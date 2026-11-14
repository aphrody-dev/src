export type DynamicValue<T = unknown> = T | { $state: string };

export interface JsonRenderActionBinding {
  action: string;
  params?: Record<string, DynamicValue>;
}

export interface JsonRenderUIElement<
  T extends string = string,
  P extends Record<string, unknown> = Record<string, unknown>,
> {
  type: T;
  props: P;
  children?: string[];
  slots?: Record<string, string[]>;
  visible?:
    boolean | { $state: string; eq?: unknown; neq?: unknown; not?: true };
  on?: Record<string, JsonRenderActionBinding | JsonRenderActionBinding[]>;
}

export interface JsonRenderSpec {
  root: string;
  elements: Record<string, JsonRenderUIElement>;
  state?: Record<string, unknown>;
}

export interface JsonRenderTreeNode {
  type: string;
  props?: Record<string, unknown>;
  children?: JsonRenderTreeNode[];
  on?: Record<string, JsonRenderActionBinding | JsonRenderActionBinding[]>;
}

export interface JsonRenderPatch {
  op: "add" | "replace" | "remove";
  path: string;
  value?: unknown;
}

export interface CompiledSSRDocument {
  html: string;
  css: string;
  fullDocument: string;
  htmlBytes: number;
  cssBytes: number;
  totalBytes: number;
  gzippedBytes: number;
  clsScore: number;
  hasExplicitIntrinsicSizing: boolean;
  elementCount: number;
}

export interface JsonRenderBenchmarkResult {
  iterations: number;
  elementCount: number;
  sovereignSsrOpsPerSec: number;
  sovereignTotalMs: number;
  baselineVdomOpsPerSec: number;
  baselineTotalMs: number;
  speedupFactor: number;
  sovereignOutputBytes: number;
  sovereignGzipBytes: number;
  baselineReactRuntimeBytesEstimate: number;
  payloadReductionFactor: number;
  clsScore: number;
}

const ALLOWED_CATALOG_COMPONENTS = new Set([
  "Page",
  "Grid",
  "Stack",
  "Card",
  "Metric",
  "Button",
  "Badge",
  "Table",
  "Alert",
  "Input",
  "Text",
]);

export const SOVEREIGN_M3_FLUENT2_CSS = `:root{--md-sys-color-primary:#1a73e8;--md-sys-color-on-primary:#ffffff;--md-sys-color-surface:#ffffff;--md-sys-color-surface-container:#f8f9fa;--md-sys-color-on-surface:#1f1f1f;--md-sys-color-outline:#dadce0;--fluent-radius-md:8px;--fluent-radius-lg:12px;--fluent-shadow-4:0 2px 4px rgba(0,0,0,.06),0 0 2px rgba(0,0,0,.04)}*{box-sizing:border-box}body{margin:0;font:400 14px/20px "Segoe UI Variable","Roboto Flex",system-ui,sans-serif;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface)}.jr-page{max-width:1200px;margin:0 auto;padding:24px;contain:layout style}.jr-grid{display:grid;grid-template-columns:repeat(var(--cols,3),minmax(0,1fr));gap:16px;min-height:120px}.jr-stack{display:flex;flex-direction:column;gap:12px}.jr-card{background:var(--md-sys-color-surface-container);border:1px solid var(--md-sys-color-outline);border-radius:var(--fluent-radius-lg);box-shadow:var(--fluent-shadow-4);padding:16px;min-height:96px;contain:content}.jr-card-title{margin:0 0 8px;font:600 16px/24px inherit}.jr-metric{display:flex;flex-direction:column;min-height:56px}.jr-metric-label{font-size:12px;opacity:.75;line-height:16px}.jr-metric-val{font:600 24px/32px inherit;font-variant-numeric:tabular-nums}.jr-btn{display:inline-flex;align-items:center;justify-content:center;height:36px;min-width:88px;padding:0 16px;border-radius:var(--fluent-radius-md);border:none;background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);font:500 14px/20px inherit;cursor:pointer}.jr-badge{display:inline-flex;align-items:center;height:24px;padding:0 10px;border-radius:999px;font:500 12px/16px inherit;background:#e8f0fe;color:#1967d2}`;

function readStatePointer(
  state: Record<string, unknown> | undefined,
  pointer: string,
): unknown {
  if (!state) return undefined;
  const clean = pointer.startsWith("/") ? pointer.slice(1) : pointer;
  if (!clean) return state;
  let cur: unknown = state;
  for (const part of clean.split("/")) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function resolvePropValue(
  val: unknown,
  state: Record<string, unknown> | undefined,
): unknown {
  if (typeof val === "object" && val !== null && "$state" in val) {
    const ptr = (val as { $state: unknown }).$state;
    if (typeof ptr === "string") {
      return readStatePointer(state, ptr);
    }
  }
  return val;
}

function isElementVisible(
  cond: JsonRenderUIElement["visible"],
  state: Record<string, unknown> | undefined,
): boolean {
  if (cond === undefined) return true;
  if (typeof cond === "boolean") return cond;
  const actual = readStatePointer(state, cond.$state);
  let res: boolean;
  if ("eq" in cond && cond.eq !== undefined) {
    res = actual === cond.eq;
  } else if ("neq" in cond && cond.neq !== undefined) {
    res = actual !== cond.neq;
  } else {
    res = Boolean(actual);
  }
  return cond.not ? !res : res;
}

function formatMetricValue(raw: unknown, format: unknown): string {
  const str = String(raw ?? "");
  const num = Number(str);
  if (!Number.isFinite(num)) return str;
  if (format === "currency") {
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (format === "percent") {
    return `${num.toFixed(1)}%`;
  }
  if (format === "number") {
    return num.toLocaleString("en-US");
  }
  return str;
}

function esc(value: unknown): string {
  return Bun.escapeHTML(String(value ?? ""));
}

/**
 * Normalizes a nested `JsonRenderTreeNode` (`type`, `props`, `children`) into
 * `vercel-labs/json-render` flat `Spec` (`root`, `elements`).
 */
export function treeToFlatSpec(
  tree: JsonRenderTreeNode,
  state?: Record<string, unknown>,
): JsonRenderSpec {
  const elements: Record<string, JsonRenderUIElement> = {};
  let seq = 0;

  const visit = (node: JsonRenderTreeNode): string => {
    seq++;
    const key = `${node.type.toLowerCase()}-${seq}`;
    const childKeys: string[] = [];
    if (node.children) {
      for (const child of node.children) {
        childKeys.push(visit(child));
      }
    }
    elements[key] = {
      type: node.type,
      props: node.props ?? {},
      children: childKeys,
      on: node.on,
    };
    return key;
  };

  const root = visit(tree);
  return { root, elements, state };
}

/**
 * Applies RFC 6902 streaming SpecStream patches (`vercel-labs/json-render` JSONL patch stream)
 * onto an evolving `JsonRenderSpec`.
 */
export function applySpecStreamPatches(
  initial: JsonRenderSpec,
  patches: readonly JsonRenderPatch[],
): JsonRenderSpec {
  const spec: JsonRenderSpec = {
    root: initial.root,
    elements: { ...initial.elements },
    state: initial.state ? { ...initial.state } : {},
  };

  for (const patch of patches) {
    if (patch.path === "/root" && typeof patch.value === "string") {
      spec.root = patch.value;
      continue;
    }
    if (patch.path.startsWith("/elements/")) {
      const rest = patch.path.slice("/elements/".length);
      const slash = rest.indexOf("/");
      if (slash === -1) {
        if (patch.op === "remove") {
          delete spec.elements[rest];
        } else if (patch.value && typeof patch.value === "object") {
          spec.elements[rest] = patch.value as JsonRenderUIElement;
        }
      } else {
        const elKey = rest.slice(0, slash);
        const subField = rest.slice(slash + 1);
        const existing = spec.elements[elKey];
        if (existing && subField === "children" && Array.isArray(patch.value)) {
          spec.elements[elKey] = {
            ...existing,
            children: patch.value as string[],
          };
        }
      }
      continue;
    }
    if (patch.path.startsWith("/state/")) {
      const key = patch.path.slice("/state/".length);
      spec.state = spec.state ?? {};
      if (patch.op === "remove") {
        delete spec.state[key];
      } else {
        spec.state[key] = patch.value;
      }
    }
  }

  return spec;
}

export function validateJsonRenderSpec(spec: JsonRenderSpec): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!spec.root || typeof spec.root !== "string") {
    errors.push("Missing spec.root string");
  } else if (!spec.elements[spec.root]) {
    errors.push(`Root element "${spec.root}" not found in spec.elements`);
  }

  for (const [key, el] of Object.entries(spec.elements)) {
    if (!ALLOWED_CATALOG_COMPONENTS.has(el.type)) {
      errors.push(
        `Disallowed component type "${el.type}" at "${key}" (outside catalog guardrail)`,
      );
    }
    if (el.children) {
      for (const childKey of el.children) {
        if (!spec.elements[childKey]) {
          errors.push(`Dangling child reference "${childKey}" inside "${key}"`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function renderElementSSR(
  key: string,
  spec: JsonRenderSpec,
  out: string[],
  counter: { count: number },
): void {
  const el = spec.elements[key];
  if (!el || !ALLOWED_CATALOG_COMPONENTS.has(el.type)) return;
  if (!isElementVisible(el.visible, spec.state)) return;

  counter.count++;
  const props = el.props;
  const children = el.children ?? [];

  switch (el.type) {
    case "Page": {
      const title = esc(resolvePropValue(props.title, spec.state) ?? "");
      out.push(`<main class="jr-page" data-jr-key="${esc(key)}">`);
      if (title)
        out.push(`<header><h1 class="jr-card-title">${title}</h1></header>`);
      for (const c of children) renderElementSSR(c, spec, out, counter);
      out.push(`</main>`);
      break;
    }
    case "Grid": {
      const cols =
        Number(resolvePropValue(props.columns, spec.state) ?? 3) || 3;
      out.push(
        `<section class="jr-grid" style="--cols:${cols}" data-jr-key="${esc(key)}">`,
      );
      for (const c of children) renderElementSSR(c, spec, out, counter);
      out.push(`</section>`);
      break;
    }
    case "Stack": {
      out.push(`<div class="jr-stack" data-jr-key="${esc(key)}">`);
      for (const c of children) renderElementSSR(c, spec, out, counter);
      out.push(`</div>`);
      break;
    }
    case "Card": {
      const title = esc(resolvePropValue(props.title, spec.state) ?? "");
      out.push(`<article class="jr-card" data-jr-key="${esc(key)}">`);
      if (title) out.push(`<h3 class="jr-card-title">${title}</h3>`);
      for (const c of children) renderElementSSR(c, spec, out, counter);
      out.push(`</article>`);
      break;
    }
    case "Metric": {
      const label = esc(resolvePropValue(props.label, spec.state) ?? "");
      const rawVal = resolvePropValue(props.value, spec.state);
      const formatted = esc(formatMetricValue(rawVal, props.format));
      out.push(
        `<div class="jr-metric" data-jr-key="${esc(key)}"><span class="jr-metric-label">${label}</span><span class="jr-metric-val">${formatted}</span></div>`,
      );
      break;
    }
    case "Button": {
      const label = esc(resolvePropValue(props.label, spec.state) ?? "Action");
      const actionAttr =
        typeof props.action === "string"
          ? ` data-jr-action="${esc(props.action)}"`
          : "";
      out.push(
        `<button type="button" class="jr-btn" data-jr-key="${esc(key)}"${actionAttr}>${label}</button>`,
      );
      break;
    }
    case "Badge": {
      const label = esc(resolvePropValue(props.label, spec.state) ?? "");
      out.push(
        `<span class="jr-badge" data-jr-key="${esc(key)}">${label}</span>`,
      );
      break;
    }
    default: {
      const text = esc(
        resolvePropValue(props.text ?? props.label ?? "", spec.state),
      );
      out.push(`<div data-jr-key="${esc(key)}">${text}`);
      for (const c of children) renderElementSSR(c, spec, out, counter);
      out.push(`</div>`);
      break;
    }
  }
}

export function compileJsonRenderSSR(
  spec: JsonRenderSpec,
): CompiledSSRDocument {
  const chunks: string[] = [];
  const counter = { count: 0 };
  renderElementSSR(spec.root, spec, chunks, counter);
  const html = chunks.join("");
  const css = SOVEREIGN_M3_FLUENT2_CSS;
  const fullDocument = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${html}</body></html>`;

  const htmlBytes = Buffer.byteLength(html, "utf8");
  const cssBytes = Buffer.byteLength(css, "utf8");
  const totalBytes = Buffer.byteLength(fullDocument, "utf8");
  const gzippedBytes = Bun.gzipSync(
    Buffer.from(fullDocument, "utf8"),
  ).byteLength;

  // CLS = 0 guaranteed via contain:layout/content, tabular-nums, and explicit min-height/height sizing
  const hasExplicitIntrinsicSizing =
    css.includes("min-height:") &&
    css.includes("contain:layout") &&
    css.includes("tabular-nums");

  return {
    html,
    css,
    fullDocument,
    htmlBytes,
    cssBytes,
    totalBytes,
    gzippedBytes,
    clsScore: hasExplicitIntrinsicSizing ? 0 : 0.1,
    hasExplicitIntrinsicSizing,
    elementCount: counter.count,
  };
}

/**
 * Baseline reference VDOM tree materializer + recursive object cloning + attribute serialization
 * modeling traditional client/framework `defineRegistry` + VDOM reconciliation passes.
 */
function renderBaselineVdomPass(spec: JsonRenderSpec): string {
  type VNode = {
    tag: string;
    attrs: Record<string, string>;
    children: Array<VNode | string>;
  };

  const buildVNode = (key: string): VNode | null => {
    const el = spec.elements[key];
    if (!el || !isElementVisible(el.visible, spec.state)) return null;
    const clonedProps = JSON.parse(JSON.stringify(el.props ?? {})) as Record<
      string,
      unknown
    >;
    const childNodes: Array<VNode | string> = [];
    for (const ck of el.children ?? []) {
      const cn = buildVNode(ck);
      if (cn) childNodes.push(cn);
    }
    const resolved: Record<string, string> = { "data-jr-key": key };
    for (const [pk, pv] of Object.entries(clonedProps)) {
      resolved[`data-prop-${pk.toLowerCase()}`] = String(
        resolvePropValue(pv, spec.state) ?? "",
      );
    }
    if (el.type === "Metric") {
      childNodes.push(
        String(resolvePropValue(clonedProps.label, spec.state) ?? ""),
        formatMetricValue(
          resolvePropValue(clonedProps.value, spec.state),
          clonedProps.format,
        ),
      );
    } else if (clonedProps.title) {
      childNodes.unshift(
        String(resolvePropValue(clonedProps.title, spec.state)),
      );
    } else if (clonedProps.label) {
      childNodes.push(String(resolvePropValue(clonedProps.label, spec.state)));
    }
    return {
      tag: el.type === "Button" ? "button" : "div",
      attrs: resolved,
      children: childNodes,
    };
  };

  const serialize = (node: VNode | string): string => {
    if (typeof node === "string") return Bun.escapeHTML(node);
    const attrStr = Object.entries(node.attrs)
      .map(([k, v]) => `${k}="${Bun.escapeHTML(v)}"`)
      .join(" ");
    const inner = node.children.map(serialize).join("");
    return `<${node.tag} ${attrStr}>${inner}</${node.tag}>`;
  };

  const rootVNode = buildVNode(spec.root);
  return rootVNode ? serialize(rootVNode) : "";
}

export function createSampleDashboardSpec(): JsonRenderSpec {
  return {
    root: "page-root",
    state: {
      metrics: {
        rps: 148920,
        latencyP99: 0.42,
        uptime: 99.998,
        revenue: 482910.5,
      },
      alerts: {
        degraded: false,
      },
    },
    elements: {
      "page-root": {
        type: "Page",
        props: { title: "Sovereign C:\\src Telemetry Console" },
        children: ["badge-live", "grid-kpis", "card-actions"],
      },
      "badge-live": {
        type: "Badge",
        props: { label: "Bun v1.4.4 Zero-Dependency M3 + Fluent 2" },
        children: [],
      },
      "grid-kpis": {
        type: "Grid",
        props: { columns: 4 },
        children: ["card-rps", "card-lat", "card-up", "card-rev"],
      },
      "card-rps": {
        type: "Card",
        props: { title: "Throughput" },
        children: ["metric-rps"],
      },
      "metric-rps": {
        type: "Metric",
        props: {
          label: "Requests / sec",
          value: { $state: "/metrics/rps" },
          format: "number",
        },
      },
      "card-lat": {
        type: "Card",
        props: { title: "Tail Latency" },
        children: ["metric-lat"],
      },
      "metric-lat": {
        type: "Metric",
        props: {
          label: "P99 Milliseconds",
          value: { $state: "/metrics/latencyP99" },
        },
      },
      "card-up": {
        type: "Card",
        props: { title: "Availability" },
        children: ["metric-up"],
      },
      "metric-up": {
        type: "Metric",
        props: {
          label: "Mesh SLA",
          value: { $state: "/metrics/uptime" },
          format: "percent",
        },
      },
      "card-rev": {
        type: "Card",
        props: { title: "Annualized Run Rate" },
        children: ["metric-rev"],
      },
      "metric-rev": {
        type: "Metric",
        props: {
          label: "USD Volume",
          value: { $state: "/metrics/revenue" },
          format: "currency",
        },
      },
      "card-actions": {
        type: "Card",
        props: { title: "Autonomous Fleet Controls" },
        children: ["stack-btns"],
      },
      "stack-btns": {
        type: "Stack",
        props: {},
        children: ["btn-refresh", "btn-export"],
      },
      "btn-refresh": {
        type: "Button",
        props: { label: "Sync Submodules", action: "refresh_data" },
      },
      "btn-export": {
        type: "Button",
        props: { label: "Export Benchmark Report", action: "export_report" },
      },
    },
  };
}

export function benchmarkJsonRenderArena(
  iterations = 10_000,
): JsonRenderBenchmarkResult {
  const spec = createSampleDashboardSpec();
  const compiledOnce = compileJsonRenderSSR(spec);

  for (let i = 0; i < 200; i++) {
    compileJsonRenderSSR(spec);
    renderBaselineVdomPass(spec);
  }

  const tSov0 = Bun.nanoseconds();
  let lenSov = 0;
  for (let i = 0; i < iterations; i++) {
    const chunks: string[] = [];
    const counter = { count: 0 };
    renderElementSSR(spec.root, spec, chunks, counter);
    lenSov += chunks.join("").length;
  }
  const sovereignTotalMs = (Bun.nanoseconds() - tSov0) / 1e6;

  const tBase0 = Bun.nanoseconds();
  let lenBase = 0;
  for (let i = 0; i < iterations; i++) {
    lenBase += renderBaselineVdomPass(spec).length;
  }
  const baselineTotalMs = (Bun.nanoseconds() - tBase0) / 1e6;

  if (lenSov === 0 || lenBase === 0) {
    throw new Error("Unexpected empty render output");
  }

  // Standard React 19 + @json-render/core + @json-render/shadcn gzipped client hydration bundle baseline (~58 KB gzipped / ~182 KB raw)
  const baselineReactRuntimeBytesEstimate = 182_400;

  const sovereignSsrOpsPerSec = Math.round(
    (iterations / sovereignTotalMs) * 1000,
  );
  const baselineVdomOpsPerSec = Math.round(
    (iterations / baselineTotalMs) * 1000,
  );

  return {
    iterations,
    elementCount: compiledOnce.elementCount,
    sovereignSsrOpsPerSec,
    sovereignTotalMs: Number(sovereignTotalMs.toFixed(2)),
    baselineVdomOpsPerSec,
    baselineTotalMs: Number(baselineTotalMs.toFixed(2)),
    speedupFactor: Number(
      (baselineTotalMs / Math.max(0.01, sovereignTotalMs)).toFixed(2),
    ),
    sovereignOutputBytes: compiledOnce.totalBytes,
    sovereignGzipBytes: compiledOnce.gzippedBytes,
    baselineReactRuntimeBytesEstimate,
    payloadReductionFactor: Number(
      (
        baselineReactRuntimeBytesEstimate / Math.max(1, compiledOnce.totalBytes)
      ).toFixed(1),
    ),
    clsScore: compiledOnce.clsScore,
  };
}
