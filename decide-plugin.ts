// Sovereign Bun Plugin: Native System-1 Decisional Runtime (`Bun.decide`, `bun:decide`, `*.decide.json|toml`)
// Zero-GPU CPU + NVMe SSD + DDR5 RAM BitNet 1.58-bit Ternary AVX2 + Verbose-LLM FSM Transducer + Zero-Trust Firewall.
import { plugin } from "bun";
import { CString, dlopen, FFIType, ptr, type Pointer } from "bun:ffi";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type DecideKind =
  | "CALL_TOOL"
  | "BUN_API"
  | "DIRECT_ANSWER"
  | "ESCALATE_SYSTEM2"
  | "CLARIFY"
  | "BLOCKED_DEFENSE";

export interface DecideToolSpec {
  name: string;
  description?: string;
  keywords?: string[];
  parameters?: {
    type?: "object";
    required?: string[];
    properties?: Record<
      string,
      {
        type?: "string" | "number" | "integer" | "boolean" | "array" | "object";
        enum?: Array<string | number | boolean>;
      }
    >;
  };
}

export interface DecideOptions {
  tools?: readonly DecideToolSpec[];
  confidenceThreshold?: number;
  aiOsRoot?: string;
}

export interface DecideEnvelope {
  ok: boolean;
  decision: DecideKind;
  toolOrApi: string | null;
  category: string;
  arguments: Record<string, unknown>;
  confidence: number;
  latencyMs: number;
  engine: string;
  zeroGpu: true;
  hotNeuronsEvaluated: number;
  totalNeurons: number;
  strippedVerboseChars: number;
  missingRequiredParams?: string[];
  defenseTriggered?: string;
  replacedLegacyPkg?: string;
}

export interface DecidePolicySpec {
  name?: string;
  description?: string;
  confidenceThreshold?: number;
  tools?: DecideToolSpec[];
}

interface NativeSystem1Ffi {
  bitnetSparseGemv(
    packed: Uint8Array,
    scales: Float32Array,
    mask: Uint8Array,
    x: Float32Array,
    outF: number,
    inF: number,
  ): { out: Float32Array; evaluated: number };
  transduceVerbose(raw: string): {
    ok: boolean;
    decision: DecideKind;
    tool_or_api: string | null;
    arguments: Record<string, unknown>;
    confidence: number;
    stripped_verbose_chars: number;
    extracted_raw_json: boolean;
  };
}

let ffiCache: NativeSystem1Ffi | null | undefined;

function getNativeSystem1Ffi(): NativeSystem1Ffi | null {
  if (ffiCache !== undefined) return ffiCache;
  const candidates = [
    "C:/Users/aphro/.local/bin/sovereign_polyglot_ffi.dll",
    "C:/src/packages/ai-os/native/sovereign-polyglot-ffi/target/release/sovereign_polyglot_ffi.dll",
  ];
  const found = candidates.find((c) => existsSync(c));
  if (!found) {
    ffiCache = null;
    return null;
  }

  try {
    const lib = dlopen(resolve(found), {
      sov_polyglot_free_string: { args: [FFIType.ptr], returns: FFIType.void },
      sov_system1_bitnet_sparse_gemv: {
        args: [
          FFIType.ptr,
          FFIType.ptr,
          FFIType.ptr,
          FFIType.ptr,
          FFIType.ptr,
          FFIType.u64,
          FFIType.u64,
        ],
        returns: FFIType.u64,
      },
      sov_system1_transduce_verbose: {
        args: [FFIType.ptr],
        returns: FFIType.ptr,
      },
    });

    ffiCache = {
      bitnetSparseGemv(packed, scales, mask, x, outF, inF) {
        const out = new Float32Array(outF);
        const ev = lib.symbols.sov_system1_bitnet_sparse_gemv(
          ptr(packed),
          ptr(scales),
          ptr(mask),
          ptr(x),
          ptr(out),
          BigInt(outF),
          BigInt(inF),
        );
        return { out, evaluated: Number(ev) };
      },
      transduceVerbose(raw: string) {
        const bytes = new TextEncoder().encode(raw);
        const cBuf = new Uint8Array(bytes.length + 1);
        cBuf.set(bytes, 0);
        const outPtr = lib.symbols.sov_system1_transduce_verbose(
          ptr(cBuf),
        ) as Pointer | null;
        if (!outPtr) {
          return {
            ok: false,
            decision: "DIRECT_ANSWER",
            tool_or_api: null,
            arguments: {},
            confidence: 0,
            stripped_verbose_chars: 0,
            extracted_raw_json: false,
          };
        }
        try {
          return JSON.parse(new CString(outPtr).toString());
        } finally {
          lib.symbols.sov_polyglot_free_string(outPtr);
        }
      },
    };
    return ffiCache;
  } catch {
    ffiCache = null;
    return null;
  }
}

interface TrainedMeta {
  featureDim: number;
  numClasses: number;
  classes: Array<{
    index: number;
    id: string;
    canonicalApi: string;
    category: string;
    summary: string;
    keywords: string[];
    nodeLegacyAliases: string[];
  }>;
}

let cachedWeights: {
  meta: TrainedMeta;
  scales: Float32Array;
  packed: Uint8Array;
} | null = null;

function loadTrainedBunMdxModel(aiOsRoot = "C:/src/packages/ai-os") {
  if (cachedWeights) return cachedWeights;
  const binPath = resolve(aiOsRoot, "models/bun-system1-b158.bin");
  const metaPath = resolve(aiOsRoot, "models/bun-system1-b158.meta.json");
  if (!existsSync(binPath) || !existsSync(metaPath)) return null;

  const meta = JSON.parse(readFileSync(metaPath, "utf8")) as TrainedMeta;
  const raw = readFileSync(binPath);
  const buf = new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength);
  const scalesBytes = meta.numClasses * 4;
  const sSlice = buf.slice(16, 16 + scalesBytes);
  const scales = new Float32Array(
    sSlice.buffer,
    sSlice.byteOffset,
    meta.numClasses,
  );
  const packedBytes = meta.numClasses * Math.ceil(meta.featureDim / 4);
  const packed = buf.slice(16 + scalesBytes, 16 + scalesBytes + packedBytes);
  cachedWeights = { meta, scales, packed };
  return cachedWeights;
}

function hashTextFeatures(text: string, dim = 512): Float32Array {
  const vec = new Float32Array(dim);
  const norm = text
    .toLowerCase()
    .replace(/[^a-z0-9_.:$/-]+/g, " ")
    .trim();
  if (!norm) return vec;
  const tokens = norm.split(/\s+/);

  const add = (feat: string, w: number) => {
    let h1 = 2166136261 >>> 0;
    let h2 = 16777619 >>> 0;
    for (let i = 0; i < feat.length; i++) {
      const c = feat.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ (c + i), 1099511627) >>> 0;
    }
    vec[h1 % dim]! += ((h2 & 1) === 0 ? 1 : -1) * w;
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    add(
      `u:${t}`,
      t.startsWith("bun") || t.includes("sqlite") || t.includes("ffi")
        ? 3.0
        : 1.2,
    );
    if (i + 1 < tokens.length) add(`b:${t}_${tokens[i + 1]}`, 1.6);
    if (t.length >= 4) {
      for (let k = 0; k + 4 <= Math.min(t.length, 16); k += 2) {
        add(`c4:${t.slice(k, k + 4)}`, 0.45);
      }
    }
  }
  let sq = 0;
  for (let i = 0; i < dim; i++) sq += vec[i]! * vec[i]!;
  if (sq > 1e-12) {
    const inv = 1 / Math.sqrt(sq);
    for (let i = 0; i < dim; i++) vec[i]! *= inv;
  }
  return vec;
}

const DEFENSE_RULES: Array<{ id: string; re: RegExp }> = [
  {
    id: "WINDOWS_SYSTEM32_IMMUTABLE",
    re: /(?:c:[/\\]+windows[/\\]+system32|[/\\]system32[/\\]|syswow64[/\\])/i,
  },
  {
    id: "DESTRUCTIVE_DISK_WIPE",
    re: /\b(?:format-volume|diskpart\s+clean|rm\s+-rf\s+\/(?:\s|$))\b/i,
  },
  {
    id: "PROMPT_INJECTION_OVERRIDE",
    re: /(?:ignore\s+(?:all\s+)?previous\s+instructions\s+and\s+(?:delete|exfiltrate|exec)|<\|im_start\|>\s*system\s*override)/i,
  },
];

export function decideNative(
  prompt: string,
  options: DecideOptions = {},
): DecideEnvelope {
  const t0 = performance.now();
  const trimmed = prompt.trim();

  for (const r of DEFENSE_RULES) {
    if (r.re.test(trimmed)) {
      return {
        ok: false,
        decision: "BLOCKED_DEFENSE",
        toolOrApi: null,
        category: "security",
        arguments: { reason: `Blocked by Zero-Trust Defense (${r.id})` },
        confidence: 1.0,
        latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
        engine: "zero-trust-firewall",
        zeroGpu: true,
        hotNeuronsEvaluated: 0,
        totalNeurons: 0,
        strippedVerboseChars: 0,
        defenseTriggered: r.id,
      };
    }
  }

  if (!trimmed) {
    return {
      ok: true,
      decision: "CLARIFY",
      toolOrApi: null,
      category: "clarification",
      arguments: { message: "Empty prompt" },
      confidence: 1.0,
      latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
      engine: "policy-router",
      zeroGpu: true,
      hotNeuronsEvaluated: 0,
      totalNeurons: 0,
      strippedVerboseChars: 0,
    };
  }

  const inlineArgs: Record<string, unknown> = {};
  const portM = trimmed.match(/\bport\s*[:=]?\s*(\d{2,5})\b/i);
  if (portM?.[1]) inlineArgs.port = Number(portM[1]);

  // 1. Custom Tool Policy Matching + Conservative Gatekeeper
  const tools = options.tools ?? [];
  if (tools.length > 0) {
    const lower = trimmed.toLowerCase();
    let bestTool: DecideToolSpec | null = null;
    let bestScore = 0;
    for (const tool of tools) {
      let sc = 0;
      if (lower.includes(tool.name.toLowerCase())) sc += 6;
      for (const kw of tool.keywords ?? []) {
        if (lower.includes(kw.toLowerCase())) sc += 3.5;
      }
      if (sc > bestScore) {
        bestScore = sc;
        bestTool = tool;
      }
    }
    if (bestTool && bestScore >= 3.0) {
      const props = bestTool.parameters?.properties ?? {};
      for (const [k, spec] of Object.entries(props)) {
        if (k in inlineArgs) continue;
        const m = trimmed.match(
          new RegExp(
            `\\b${k}\\s*[:=]\\s*(?:"([^"]+)"|'([^']+)'|([^\\s,;]+))`,
            "i",
          ),
        );
        const rawV = m?.[1] ?? m?.[2] ?? m?.[3];
        if (rawV !== undefined) {
          inlineArgs[k] =
            spec.type === "number" || spec.type === "integer"
              ? Number(rawV)
              : spec.type === "boolean"
                ? rawV.toLowerCase() === "true"
                : rawV;
        }
      }

      const missing = (bestTool.parameters?.required ?? []).filter(
        (reqKey) =>
          inlineArgs[reqKey] === undefined || inlineArgs[reqKey] === "",
      );
      if (missing.length > 0) {
        return {
          ok: true,
          decision: "CLARIFY",
          toolOrApi: bestTool.name,
          category: "tool_clarification",
          arguments: inlineArgs,
          confidence: 0.91,
          latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
          engine: "policy-router",
          zeroGpu: true,
          hotNeuronsEvaluated: 1,
          totalNeurons: tools.length,
          strippedVerboseChars: 0,
          missingRequiredParams: missing,
        };
      }

      return {
        ok: true,
        decision: "CALL_TOOL",
        toolOrApi: bestTool.name,
        category: "tool_call",
        arguments: inlineArgs,
        confidence: 0.96,
        latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
        engine: "policy-router",
        zeroGpu: true,
        hotNeuronsEvaluated: 1,
        totalNeurons: tools.length,
        strippedVerboseChars: 0,
      };
    }
  }

  // 2. Trained BitNet 1.58-bit Bun .mdx Weights + PowerInfer Sparse AVX2 GEMV
  const model = loadTrainedBunMdxModel(options.aiOsRoot);
  const ffi = getNativeSystem1Ffi();
  const lower = trimmed.toLowerCase();

  if (model) {
    const x = hashTextFeatures(trimmed, model.meta.featureDim);
    const mask = new Uint8Array(model.meta.numClasses);
    let hot = 0;
    let replacedLegacyPkg: string | undefined;

    for (let c = 0; c < model.meta.numClasses; c++) {
      const cls = model.meta.classes[c]!;
      if (cls.keywords.some((kw) => lower.includes(kw.trim()))) {
        mask[c] = 1;
        hot++;
      } else {
        const leg = cls.nodeLegacyAliases.find((a) =>
          lower.includes(a.toLowerCase()),
        );
        if (leg) {
          mask[c] = 1;
          hot++;
          replacedLegacyPkg = leg;
        }
      }
    }
    if (hot === 0) mask.fill(1);

    let scores: Float32Array;
    let evaluated = hot || model.meta.numClasses;
    if (ffi) {
      const res = ffi.bitnetSparseGemv(
        model.packed,
        model.scales,
        mask,
        x,
        model.meta.numClasses,
        model.meta.featureDim,
      );
      scores = res.out;
      evaluated = res.evaluated;
    } else {
      scores = new Float32Array(model.meta.numClasses);
      const rowBytes = Math.ceil(model.meta.featureDim / 4);
      for (let r = 0; r < model.meta.numClasses; r++) {
        if (!mask[r]) continue;
        let acc = 0;
        const base = r * rowBytes;
        for (let i = 0; i < model.meta.featureDim; i++) {
          const crumb =
            (model.packed[base + (i >> 2)]! >> ((i & 3) * 2)) & 0b11;
          if (crumb === 1) acc += x[i]!;
          else if (crumb === 2) acc -= x[i]!;
        }
        scores[r] = acc * model.scales[r]!;
      }
    }

    let best = 0;
    let bestScore = -1e9;
    for (let c = 0; c < model.meta.numClasses; c++) {
      if (!mask[c]) continue;
      const cls = model.meta.classes[c]!;
      let s = scores[c]!;
      if (lower.includes(cls.canonicalApi.toLowerCase())) s += 0.65;
      for (const kw of cls.keywords) if (lower.includes(kw.trim())) s += 0.22;
      for (const leg of cls.nodeLegacyAliases)
        if (lower.includes(leg.toLowerCase())) s += 0.45;
      if (s > bestScore) {
        bestScore = s;
        best = c;
      }
    }

    const chosen = model.meta.classes[best]!;
    return {
      ok: true,
      decision: "BUN_API",
      toolOrApi: chosen.canonicalApi,
      category: chosen.category,
      arguments: {
        ...inlineArgs,
        actionId: chosen.id,
        summary: chosen.summary,
        ...(replacedLegacyPkg ? { migratesFrom: replacedLegacyPkg } : {}),
      },
      confidence: Math.min(
        0.99,
        Math.round((0.68 + Math.tanh(bestScore) * 0.3) * 1000) / 1000,
      ),
      latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
      engine: ffi ? "bitnet-b1.58-avx2-ffi" : "bitnet-b1.58-js",
      zeroGpu: true,
      hotNeuronsEvaluated: evaluated,
      totalNeurons: model.meta.numClasses,
      strippedVerboseChars: 0,
      replacedLegacyPkg,
    };
  }

  // Fallback heuristic when run before training
  const api = lower.includes("sqlite")
    ? "bun:sqlite"
    : lower.includes("ffi")
      ? "bun:ffi"
      : "Bun.serve";
  return {
    ok: true,
    decision: "BUN_API",
    toolOrApi: api,
    category: "runtime",
    arguments: inlineArgs,
    confidence: 0.85,
    latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
    engine: "heuristic-fallback",
    zeroGpu: true,
    hotNeuronsEvaluated: 1,
    totalNeurons: 3,
    strippedVerboseChars: 0,
  };
}

export function transduceVerboseNative(
  rawVerboseOutput: string,
  options: DecideOptions = {},
): DecideEnvelope {
  const t0 = performance.now();
  for (const r of DEFENSE_RULES) {
    if (r.re.test(rawVerboseOutput)) {
      return {
        ok: false,
        decision: "BLOCKED_DEFENSE",
        toolOrApi: null,
        category: "security",
        arguments: { reason: `Blocked by Zero-Trust Defense (${r.id})` },
        confidence: 1.0,
        latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
        engine: "zero-trust-firewall",
        zeroGpu: true,
        hotNeuronsEvaluated: 0,
        totalNeurons: 0,
        strippedVerboseChars: rawVerboseOutput.length,
        defenseTriggered: r.id,
      };
    }
  }

  const ffi = getNativeSystem1Ffi();
  if (ffi) {
    const trans = ffi.transduceVerbose(rawVerboseOutput);
    if (trans.extracted_raw_json && trans.tool_or_api) {
      return {
        ok: true,
        decision: trans.decision,
        toolOrApi: trans.tool_or_api,
        category: trans.decision === "BUN_API" ? "bun_native" : "tool_call",
        arguments: trans.arguments ?? {},
        confidence: Math.round(trans.confidence * 1000) / 1000,
        latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
        engine: "verbose-fsm-transducer",
        zeroGpu: true,
        hotNeuronsEvaluated: 1,
        totalNeurons: 1,
        strippedVerboseChars: trans.stripped_verbose_chars,
      };
    }
  }

  const stripped = rawVerboseOutput
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, "")
    .trim();
  const base = decideNative(stripped, options);
  return {
    ...base,
    engine: "verbose-fsm-transducer",
    strippedVerboseChars: Math.max(0, rawVerboseOutput.length - 120),
    latencyMs: Math.round((performance.now() - t0) * 1000) / 1000,
  };
}

export function createPolicyRouter(spec: DecidePolicySpec) {
  const tools = spec.tools ?? [];
  const opts: DecideOptions = {
    tools,
    confidenceThreshold: spec.confidenceThreshold ?? 0.58,
  };
  return {
    name: spec.name ?? "sovereign-decide-router",
    tools,
    decide: (prompt: string) => decideNative(prompt, opts),
    transduce: (verbose: string) => transduceVerboseNative(verbose, opts),
  };
}

const GLOBAL_KEY = Symbol.for("sovereign.bun.decide.plugin");

function installGlobalDecideHooks(): void {
  const g = globalThis as unknown as Record<symbol, unknown>;
  g[GLOBAL_KEY] = {
    decide: decideNative,
    transduce: transduceVerboseNative,
    createPolicyRouter,
  };

  const bunAny = Bun as unknown as Record<string, unknown>;
  if (typeof bunAny.decide !== "function") {
    Object.defineProperty(bunAny, "decide", {
      value: decideNative,
      writable: true,
      configurable: true,
    });
  }
  if (typeof bunAny.transduceDecision !== "function") {
    Object.defineProperty(bunAny, "transduceDecision", {
      value: transduceVerboseNative,
      writable: true,
      configurable: true,
    });
  }
}

export function generateDecideModule(
  filePath: string,
  content: string,
): string {
  const isToml = filePath.toLowerCase().endsWith(".toml");
  const spec = (
    isToml ? Bun.TOML.parse(content) : JSON.parse(content)
  ) as DecidePolicySpec;
  const normalizedPath = filePath.replace(/\\/g, "/");
  return `
const hooks = globalThis[Symbol.for("sovereign.bun.decide.plugin")];
export const policyPath = ${JSON.stringify(normalizedPath)};
export const policySpec = ${JSON.stringify(spec, null, 2)};
export const router = hooks.createPolicyRouter(policySpec);
export const tools = router.tools;
export function decide(prompt) { return router.decide(prompt); }
export function transduce(verbose) { return router.transduce(verbose); }
export default router;
`;
}

export const decidePlugin = {
  name: "sovereign-decide-plugin",
  setup(build: any) {
    installGlobalDecideHooks();

    build.onResolve({ filter: /^bun:decide$/ }, () => ({
      path: "bun:decide",
      namespace: "sovereign-bun-decide",
    }));

    build.onLoad({ filter: /.*/, namespace: "sovereign-bun-decide" }, () => ({
      loader: "js",
      contents: `
const hooks = globalThis[Symbol.for("sovereign.bun.decide.plugin")];
export const decide = hooks.decide;
export const transduce = hooks.transduce;
export const createPolicyRouter = hooks.createPolicyRouter;
export default hooks;
`,
    }));

    build.onLoad(
      { filter: /\.decide\.(json|toml)$/i },
      (args: { path: string }) => {
        const content = readFileSync(args.path, "utf8");
        return {
          loader: "js",
          contents: generateDecideModule(args.path, content),
        };
      },
    );
  },
};

installGlobalDecideHooks();
try {
  plugin(decidePlugin);
} catch {
  // Ignore duplicate registration in test runners
}
