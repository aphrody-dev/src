// SPDX-License-Identifier: Apache-2.0
/**
 * Code graph: Chromium DEPS (`ay gclient revinfo`) -> first-party engines, gn component edges counted in the checkout's
 * BUILD.gn/*.gni files, and the consumer edges declared in ECOSYSTEM.toml (CEF -> cef-rs, rusty_v8 -> deno_core, ...).
 */
import { tmpdir } from "node:os";
import { type Target, type TrackersDoc } from "./run.ts";
import { ROOT, nowIso, pool, run } from "./net.ts";

export type EdgeKind = "deps" | "gn" | "consumes" | "in-tree";
export interface GNode {
  id: string;
  label: string;
  kind: "product" | "dep" | "component";
  version?: string;
  url?: string;
  rev?: string;
  dirs?: string[];
  gn_files?: number;
}
export interface GEdge {
  from: string;
  to: string;
  kind: EdgeKind;
  weight?: number;
  evidence?: string;
}
export interface Graph {
  schema: 1;
  generated_at: string;
  sources: string[];
  nodes: GNode[];
  edges: GEdge[];
  notes: string[];
}

/** gn label prefix (dir under chromium/src) -> node id. Tracker ids are reused where a tracker exists. */
export const GN_NODES: readonly [dir: string, id: string, scan: boolean][] = [
  ["chrome", "chrome", true],
  ["content", "content", true],
  ["components", "components", true],
  ["services", "services", true],
  ["net", "net", true],
  ["base", "base", true],
  ["ui", "ui", true],
  ["gpu", "gpu", true],
  ["media", "media", true],
  ["cc", "cc", true],
  ["mojo", "mojo", true],
  ["ipc", "ipc", true],
  ["headless", "headless", true],
  ["extensions", "extensions", true],
  ["device", "device", true],
  ["storage", "storage", true],
  ["sandbox", "sandbox", true],
  ["printing", "printing", true],
  ["url", "url", true],
  ["v8", "v8", true],
  ["third_party/blink", "blink", true],
  ["skia", "skia", true],
  ["third_party/skia", "skia", true],
  ["third_party/dawn", "dawn", true],
  ["third_party/angle", "angle", true],
  ["third_party/pdfium", "pdfium", false],
  ["third_party/boringssl", "boringssl", false],
  ["third_party/webrtc", "webrtc", false],
  ["third_party/icu", "icu", false],
  ["third_party/harfbuzz-ng", "harfbuzz", false],
  ["third_party/freetype", "freetype", false],
  ["third_party/perfetto", "perfetto", false],
  ["third_party/devtools-frontend", "devtools-frontend", false],
  ["third_party/ffmpeg", "ffmpeg", false],
];

/** DEPS path (under src/) of a dependency that is also a tracker target. */
const DEPS_TO_TRACKER: Record<string, string> = {
  "src/v8": "v8",
  "src/third_party/skia": "skia",
  "src/third_party/dawn": "dawn",
  "src/third_party/angle": "angle",
};

const byLongest = <T>(items: readonly T[], key: (t: T) => string): T[] =>
  [...items].sort((a, b) => key(b).length - key(a).length);

export function labelNode(label: string, nodes = GN_NODES): string | undefined {
  const p = label.replace(/^\/\//, "").split(":")[0] ?? "";
  for (const [dir, id] of byLongest(nodes, (n) => n[0]))
    if (p === dir || p.startsWith(`${dir}/`)) return id;
  return undefined;
}

export interface Revinfo {
  [path: string]: { url: string; rev: string | null };
}

export async function revinfo(): Promise<Revinfo> {
  const out = `${tmpdir().replaceAll("\\", "/")}/aphrody-revinfo-${process.pid}.json`;
  const r = await run([
    "ay",
    "gclient",
    "revinfo",
    "--root",
    `${ROOT()}/third_party/chromium`,
    "--ignore-dep-type",
    "cipd",
    "--ignore-dep-type",
    "gcs",
    "--output-json",
    out,
  ]);
  if (r.code !== 0)
    throw new Error(`ay gclient revinfo: ${(r.err || r.out).slice(0, 200)}`);
  return (await Bun.file(out).json()) as Revinfo;
}

/** DEPS entries -> nodes, each attached to its nearest enclosing dependency (chromium for top-level ones). */
export function depsGraph(rev: Revinfo): { nodes: GNode[]; edges: GEdge[] } {
  const paths = Object.keys(rev).filter((p) => p !== "src" && !p.includes(":"));
  const sorted = byLongest(paths, (p) => p);
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  const idOf = (p: string) =>
    DEPS_TO_TRACKER[p] ?? `dep:${p.replace(/^src\//, "")}`;
  for (const p of paths) {
    const info = rev[p] as { url: string; rev: string | null };
    if (!DEPS_TO_TRACKER[p])
      nodes.push({
        id: idOf(p),
        label: p.replace(/^src\//, ""),
        kind: "dep",
        url: info.url,
        rev: info.rev ?? undefined,
      });
    const parent = sorted.find((q) => q !== p && p.startsWith(`${q}/`));
    edges.push({
      from: parent ? idOf(parent) : "chromium",
      to: idOf(p),
      kind: "deps",
      evidence: `DEPS ${p}`,
    });
  }
  return { nodes, edges };
}

/** Pinned revision of the mapped trackers, for node attributes. */
export const pinnedOf = (
  rev: Revinfo,
): Record<string, { url: string; rev: string }> =>
  Object.fromEntries(
    Object.entries(DEPS_TO_TRACKER).flatMap(([p, id]) =>
      rev[p]?.rev ? [[id, { url: rev[p].url, rev: rev[p].rev as string }]] : [],
    ),
  );

const STRING_LABEL = /"(\/\/[A-Za-z0-9_\-./+]+)(?::[A-Za-z0-9_\-./+]*)?"/g;

/** Files that reference each target component, per owning component (distinct files, not occurrences). */
export async function gnEdges(
  srcRoot: string,
): Promise<{ edges: GEdge[]; files: Record<string, number> }> {
  const dirs = GN_NODES.filter((n) => n[2]);
  const counts = new Map<string, number>();
  const files: Record<string, number> = {};
  for (const [dir, id] of dirs) {
    const list: string[] = [];
    for (const pat of ["**/BUILD.gn", "**/*.gni"]) {
      for await (const f of new Bun.Glob(pat).scan({
        cwd: `${srcRoot}/${dir}`,
        onlyFiles: true,
      })) {
        if (!f.includes("node_modules")) list.push(`${srcRoot}/${dir}/${f}`);
      }
    }
    files[id] = (files[id] ?? 0) + list.length;
    await pool(list, 32, async (file) => {
      const text = await Bun.file(file).text();
      const seen = new Set<string>();
      for (const m of text.matchAll(STRING_LABEL)) {
        const to = labelNode(m[1] as string);
        if (to && to !== id) seen.add(to);
      }
      for (const to of seen)
        counts.set(`${id}\0${to}`, (counts.get(`${id}\0${to}`) ?? 0) + 1);
    });
  }
  const edges: GEdge[] = [...counts].map(([k, w]) => {
    const [from, to] = k.split("\0") as [string, string];
    return {
      from,
      to,
      kind: "gn" as const,
      weight: w,
      evidence: "BUILD.gn/*.gni string labels",
    };
  });
  return {
    edges: edges.sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0)),
    files,
  };
}

const ok = (o: unknown): o is { value: string } =>
  !!o && typeof o === "object" && "value" in o;

export async function buildGraph(
  doc: TrackersDoc,
  opts: { gn?: boolean } = {},
): Promise<Graph> {
  const notes: string[] = [];
  const sources = [
    "ay gclient revinfo --root third_party/chromium (checkout DEPS, recursedeps)",
    "third_party/ECOSYSTEM.toml [tracker.*].consumes",
  ];
  const nodes = new Map<string, GNode>();
  const edges: GEdge[] = [];
  const stable = doc.channels.chromiumdash.Windows?.stable?.version;
  nodes.set("chromium", {
    id: "chromium",
    label: "Chromium",
    kind: "product",
    version: stable,
  });
  let rev: Revinfo = {};
  try {
    rev = await revinfo();
  } catch (e) {
    notes.push(`DEPS graph skipped: ${e}`);
  }
  const pinned = pinnedOf(rev);
  const v8Of = (t: Target) => {
    for (const o of t.v8 ?? []) if (ok(o)) return o.value;
    return undefined;
  };
  for (const t of doc.targets) {
    const v = ok(t.version) ? t.version.value : undefined;
    nodes.set(t.id, {
      id: t.id,
      label: t.name,
      kind: "product",
      version:
        [v, v8Of(t) ? `V8 ${v8Of(t)}` : ""].filter(Boolean).join(" | ") ||
        undefined,
      url: pinned[t.id]?.url ?? t.repo ?? t.upstream,
      rev: pinned[t.id]?.rev,
    });
    for (const c of t.consumes)
      edges.push({
        from: t.id,
        to: c,
        kind: "consumes",
        evidence: `ECOSYSTEM.toml tracker.${t.id}.consumes`,
      });
  }
  for (const id of ["blink"])
    if (nodes.has(id))
      edges.push({
        from: "chromium",
        to: id,
        kind: "in-tree",
        evidence: "third_party/blink in chromium/src",
      });
  if (Object.keys(rev).length) {
    const d = depsGraph(rev);
    for (const n of d.nodes) nodes.set(n.id, n);
    edges.push(...d.edges);
  }
  if (opts.gn !== false) {
    try {
      const g = await gnEdges(`${ROOT()}/third_party/chromium/src`);
      sources.push(
        "third_party/chromium/src BUILD.gn and *.gni string labels (files referencing a component)",
      );
      const used = new Set<string>();
      for (const e of g.edges) {
        used.add(e.from);
        used.add(e.to);
      }
      for (const [dir, id] of GN_NODES) {
        if (used.has(id) && !nodes.has(id))
          nodes.set(id, {
            id,
            label: `//${dir}`,
            kind: "component",
            dirs: GN_NODES.filter((n) => n[1] === id).map((n) => n[0]),
          });
      }
      for (const e of g.edges)
        if (nodes.has(e.from) && nodes.has(e.to)) edges.push(e);
      for (const [id, n] of Object.entries(g.files)) {
        const nd = nodes.get(id);
        if (nd) nd.gn_files = n;
      }
    } catch (e) {
      notes.push(`gn component scan skipped: ${e}`);
    }
  }
  return {
    schema: 1,
    generated_at: nowIso(),
    sources,
    nodes: [...nodes.values()],
    edges,
    notes,
  };
}

const mid = (id: string) => id.replace(/[^A-Za-z0-9_]/g, "_");
const esc = (s: string) => s.replace(/"/g, "'");

/** Ecosystem diagram: tracker products, in-tree engines, consumers and the first-level Chromium DEPS libraries. */
export function ecosystemMermaid(g: Graph): string {
  const keep = new Set([
    "chromium",
    ...g.nodes.filter((n) => n.kind === "product").map((n) => n.id),
    "dep:third_party/pdfium",
    "dep:third_party/boringssl/src",
    "dep:third_party/devtools-frontend/src",
    "dep:third_party/perfetto",
    "dep:third_party/catapult",
    "dep:third_party/webrtc",
  ]);
  const lines = ["flowchart LR"];
  for (const n of g.nodes)
    if (keep.has(n.id))
      lines.push(
        `  ${mid(n.id)}["${esc(n.label)}${n.version ? `<br/>${esc(n.version.length > 48 ? `${n.version.slice(0, 45)}...` : n.version)}` : ""}"]`,
      );
  for (const e of g.edges) {
    if (e.kind === "gn" || !keep.has(e.from) || !keep.has(e.to)) continue;
    lines.push(
      `  ${mid(e.from)} ${e.kind === "consumes" ? "-->" : e.kind === "in-tree" ? "==>" : "-.->"} ${mid(e.to)}`,
    );
  }
  return `${lines.join("\n")}\n`;
}

/** gn component diagram: the heaviest edges (distinct files that reference the target). */
export function componentMermaid(g: Graph, top = 60): string {
  const gn = g.edges.filter((e) => e.kind === "gn").slice(0, top);
  const lines = ["flowchart LR"];
  const ids = new Set(gn.flatMap((e) => [e.from, e.to]));
  for (const n of g.nodes)
    if (ids.has(n.id)) lines.push(`  ${mid(n.id)}["${esc(n.label)}"]`);
  for (const e of gn)
    lines.push(`  ${mid(e.from)} -->|${e.weight}| ${mid(e.to)}`);
  return `${lines.join("\n")}\n`;
}

export const graphPaths = () => ({
  json: `${ROOT()}/third_party/chromium-graph.json`,
  eco: `${ROOT()}/third_party/chromium-graph.mmd`,
  comp: `${ROOT()}/third_party/chromium-graph-components.mmd`,
});

export async function writeGraph(g: Graph): Promise<void> {
  const p = graphPaths();
  await Bun.write(p.json, `${JSON.stringify(g, null, 2)}\n`);
  await Bun.write(p.eco, ecosystemMermaid(g));
  await Bun.write(p.comp, componentMermaid(g));
}
