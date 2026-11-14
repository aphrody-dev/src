#!/usr/bin/env bun
// checkdeps: layered dependency gate for C:\src (Chromium buildtools/checkdeps analogue).
//
// Every first-party unit (a directory holding Cargo.toml [package] or package.json) gets a
// layer from the nearest DEPS.rules file at or above it. Rules accumulate from the root
// downward, deeper files override shallower ones (Chromium include_rules inheritance).
//
// DEPS.rules syntax, one directive per line, `#` comments:
//   layer = N        L0 toolchain, L1 base, L2 platform, L3 services, L4 agent, L5 surfaces
//   +path            re-allow a lower/lateral path that a broader -rule forbids (never upward)
//   !path            ticketed debt: the only way to keep an upward edge; reported as a warning
//   -path            forbid, even if the layer order would allow it
//   use path         declare an edge the manifests cannot show (bun:ffi dlopen, pyo3); own dir only
// Only [dependencies] and [build-dependencies] count: dev-dependencies (tests, benches) are exempt.
//
// Edge policy: lower layer -> allowed; same layer -> allowed (cycles are errors); upper layer
// -> error unless ! rule. Unlayered units -> error. Exit code 1 on any error.
//
// Units: Cargo.toml [package], package.json, pyproject.toml [project] (uv; edges from [tool.uv.sources]).
// Usage: bun scripts/checkdeps.ts [--root DIR] [--json] [--graph] [--affected REF]
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

type Rule = { kind: "+" | "!" | "-"; path: string; from: string };
type Scope = {
  layer?: number;
  layerFrom?: string;
  rules: Rule[];
  uses: string[];
};
type Unit = {
  dir: string;
  name: string;
  kind: "cargo" | "bun" | "uv";
  deps: string[];
};
type Finding = {
  level: "error" | "warn";
  from: string;
  to: string;
  msg: string;
};

const args = Bun.argv.slice(2);
const root = resolve(
  args.includes("--root")
    ? args[args.indexOf("--root") + 1]!
    : join(import.meta.dir, ".."),
);
const SCAN = [
  "src",
  "bench",
  "test",
  "packages",
  "apps",
  "infra",
  "tools",
  "browser",
  "plugins",
];
const SKIP = new Set([
  "node_modules",
  "target",
  "third_party",
  "vendor",
  ".git",
  "dist",
  "graphify-out",
  "tests",
  "examples",
  "benches",
  "fixtures",
]);
const LAYER_NAMES = [
  "L0 toolchain",
  "L1 base",
  "L2 platform",
  "L3 services",
  "L4 agent",
  "L5 surfaces",
];

const rel = (p: string) => relative(root, p).replaceAll("\\", "/");
const readToml = (p: string): any => {
  try {
    return Bun.TOML.parse(readFileSync(p, "utf8"));
  } catch {
    return undefined;
  }
};

// 1. Discover units (depth <= 3 below each scan root).
const units = new Map<string, Unit>();
// apps/* are separate repositories (DEPS-pinned) with their own gates: only their root unit is checked.
function walk(dir: string, depth: number, max: number) {
  if (depth > max || !existsSync(dir)) return;
  const cargo = join(dir, "Cargo.toml");
  const pkg = join(dir, "package.json");
  const py = join(dir, "pyproject.toml");
  if (existsSync(cargo)) {
    const t = readToml(cargo);
    if (t?.package?.name)
      units.set(rel(dir), {
        dir: rel(dir),
        name: t.package.name,
        kind: "cargo",
        deps: [],
      });
  } else if (existsSync(pkg)) {
    try {
      const j = JSON.parse(readFileSync(pkg, "utf8"));
      if (j.name)
        units.set(rel(dir), {
          dir: rel(dir),
          name: j.name,
          kind: "bun",
          deps: [],
        });
    } catch {}
  } else if (existsSync(py)) {
    // Python (uv): a [project] is a unit; a bare [tool.uv.workspace] root is not.
    const t = readToml(py);
    if (t?.project?.name)
      units.set(rel(dir), {
        dir: rel(dir),
        name: t.project.name,
        kind: "uv",
        deps: [],
      });
  }
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && !SKIP.has(e.name) && !e.name.startsWith("."))
      walk(join(dir, e.name), depth + 1, max);
  }
}
for (const s of SCAN) walk(join(root, s), 0, s === "apps" ? 1 : 3);

// 2. Resolve edges. Cargo: path deps and workspace = true via root [workspace.dependencies].
const ws = readToml(join(root, "Cargo.toml"))?.workspace?.dependencies ?? {};
const byJsName = new Map(
  [...units.values()]
    .filter((u) => u.kind === "bun")
    .map((u) => [u.name, u.dir]),
);
const unitOf = (absDir: string) => {
  const r = rel(absDir);
  return units.has(r) ? r : undefined;
};
for (const u of units.values()) {
  const abs = join(root, u.dir);
  const out = new Set<string>();
  if (u.kind === "cargo") {
    const t = readToml(join(abs, "Cargo.toml")) ?? {};
    const tables: any[] = [t.dependencies, t["build-dependencies"]];
    for (const tgt of Object.values<any>(t.target ?? {}))
      tables.push(tgt.dependencies, tgt["build-dependencies"]);
    for (const tab of tables) {
      for (const [key, spec] of Object.entries<any>(tab ?? {})) {
        let p: string | undefined;
        if (spec && typeof spec === "object" && spec.path)
          p = join(abs, spec.path);
        else if (
          spec &&
          typeof spec === "object" &&
          spec.workspace &&
          ws[key]?.path
        )
          p = join(root, ws[key].path);
        const d = p && unitOf(p);
        if (d && d !== u.dir) out.add(d);
      }
    }
  } else if (u.kind === "uv") {
    // Edges: [tool.uv.sources] entries that are workspace members or local paths.
    const t = readToml(join(abs, "pyproject.toml")) ?? {};
    const deps = new Set(
      [
        ...(t.project?.dependencies ?? []),
        ...Object.values<string[]>(
          t.project?.["optional-dependencies"] ?? {},
        ).flat(),
      ].map((d: string) =>
        d
          .split(/[\s<>=!~;\[(]/)[0]!
          .toLowerCase()
          .replaceAll("_", "-"),
      ),
    );
    for (const [name, spec] of Object.entries<any>(t.tool?.uv?.sources ?? {})) {
      if (!deps.has(name.toLowerCase().replaceAll("_", "-"))) continue;
      const d = spec?.path
        ? unitOf(join(abs, spec.path))
        : spec?.workspace
          ? [...units.values()].find(
              (x) =>
                x.kind === "uv" &&
                x.name.toLowerCase().replaceAll("_", "-") ===
                  name.toLowerCase().replaceAll("_", "-"),
            )?.dir
          : undefined;
      if (d && d !== u.dir) out.add(d);
    }
  } else {
    const j = JSON.parse(readFileSync(join(abs, "package.json"), "utf8"));
    for (const tab of [
      j.dependencies,
      j.peerDependencies,
      j.optionalDependencies,
    ]) {
      for (const [name, ver] of Object.entries<string>(tab ?? {})) {
        let d = byJsName.get(name);
        if (!d && typeof ver === "string" && ver.startsWith("file:"))
          d = unitOf(join(abs, ver.slice(5)));
        if (d && d !== u.dir) out.add(d);
      }
    }
  }
  u.deps = [...out].sort();
}

// 3. Scopes from DEPS.rules, inherited downward.
// A line `sub/dir: directive` applies to that subdirectory. It lets the parent repo declare
// rules for gitlinked submodules (apps/*) without writing into them.
const scoped = new Map<string, string[]>();
const scopeCache = new Map<string, Scope>();
function scopeFor(dirRel: string): Scope {
  if (scopeCache.has(dirRel)) return scopeCache.get(dirRel)!;
  const parent =
    dirRel === ""
      ? undefined
      : scopeFor(dirRel.includes("/") ? dirname(dirRel) : "");
  const s: Scope = {
    layer: parent?.layer,
    layerFrom: parent?.layerFrom,
    rules: [...(parent?.rules ?? [])],
    uses: [],
  };
  const f = join(root, dirRel, "DEPS.rules");
  const own =
    existsSync(f) && statSync(f).isFile()
      ? readFileSync(f, "utf8").split(/\r?\n/)
      : [];
  const src = rel(f);
  const lines: string[] = [...(scoped.get(dirRel) ?? [])];
  for (const raw of own) {
    const line = raw.replace(/#.*/, "").trim();
    const sm = line.match(/^([\w./-]+):\s+(.+)$/);
    if (sm) {
      const key = (dirRel ? dirRel + "/" : "") + sm[1]!.replace(/\/$/, "");
      scoped.set(key, [...(scoped.get(key) ?? []), sm[2]!]);
    } else if (line) lines.push(line);
  }
  for (const line of lines) {
    const m = line.match(/^layer\s*=\s*(\d)$/);
    if (m) {
      s.layer = Number(m[1]);
      s.layerFrom = src;
    } else if (/^use\s+/.test(line)) {
      s.uses.push(line.replace(/^use\s+/, "").replace(/\/$/, ""));
    } else if ("+!-".includes(line[0]!)) {
      s.rules.unshift({
        kind: line[0] as Rule["kind"],
        path: line.slice(1).trim().replace(/\/$/, ""),
        from: src,
      });
    } else throw new Error(`${src}: bad directive '${line}'`);
  }
  scopeCache.set(dirRel, s);
  return s;
}
const matchRule = (s: Scope, target: string) =>
  s.rules
    .filter((r) => target === r.path || target.startsWith(r.path + "/"))
    .sort((a, b) => b.path.length - a.path.length)[0];

// 4. Check edges.
const findings: Finding[] = [];
for (const u of units.values())
  for (const p of scopeFor(u.dir).uses) {
    if (units.has(p)) u.deps = [...new Set([...u.deps, p])].sort();
    else
      findings.push({
        level: "error",
        from: u.dir,
        to: p,
        msg: "use: unknown unit",
      });
  }
for (const u of units.values()) {
  const s = scopeFor(u.dir);
  if (s.layer === undefined) {
    findings.push({
      level: "error",
      from: u.dir,
      to: "",
      msg: "no layer: add DEPS.rules with `layer = N`",
    });
    continue;
  }
  for (const d of u.deps) {
    const t = scopeFor(d);
    const r = matchRule(s, d);
    if (r?.kind === "-")
      findings.push({
        level: "error",
        from: u.dir,
        to: d,
        msg: `forbidden by ${r.from}`,
      });
    else if (r?.kind === "!")
      findings.push({
        level: "warn",
        from: u.dir,
        to: d,
        msg: `ticketed allowance (${r.from})`,
      });
    else if (t.layer !== undefined && t.layer > s.layer)
      findings.push({
        level: "error",
        from: u.dir,
        to: d,
        msg: `upward: L${s.layer} -> L${t.layer} (${LAYER_NAMES[t.layer]})${r?.kind === "+" ? "; + cannot lift an upward edge, use ! with a ticket" : ""}`,
      });
  }
}
// Cycles (Tarjan-free DFS, reports each back edge once).
const color = new Map<string, number>();
const stack: string[] = [];
function dfs(n: string) {
  color.set(n, 1);
  stack.push(n);
  for (const d of units.get(n)?.deps ?? []) {
    if (color.get(d) === 1) {
      const cyc = [...stack.slice(stack.indexOf(d)), d];
      // A cycle is downgraded to a warning only if one of its edges carries a ! (ticketed) rule.
      const ticketed = cyc
        .slice(0, -1)
        .some((a, i) => matchRule(scopeFor(a), cyc[i + 1]!)?.kind === "!");
      findings.push({
        level: ticketed ? "warn" : "error",
        from: n,
        to: d,
        msg: `cycle${ticketed ? " (ticketed)" : ""}: ${cyc.join(" -> ")}`,
      });
    } else if (!color.get(d)) dfs(d);
  }
  stack.pop();
  color.set(n, 2);
}
for (const n of [...units.keys()].sort()) if (!color.get(n)) dfs(n);

// 5. Report.
// --affected REF: units touched since REF plus every transitive dependent (turbo --filter=...[REF]).
if (args.includes("--affected")) {
  const ref = args[args.indexOf("--affected") + 1] ?? "origin/main";
  const changed = (
    await Bun.$`git -C ${root} diff --name-only ${ref}`.quiet().nothrow().text()
  )
    .split("\n")
    .filter(Boolean);
  const dirs = [...units.keys()].sort((a, b) => b.length - a.length);
  const hit = new Set<string>();
  for (const c of changed) {
    const d = dirs.find((u) => c === u || c.startsWith(u + "/"));
    if (d) hit.add(d);
  }
  const rdeps = new Map<string, string[]>();
  for (const u of units.values())
    for (const d of u.deps) rdeps.set(d, [...(rdeps.get(d) ?? []), u.dir]);
  const queue = [...hit];
  while (queue.length)
    for (const r of rdeps.get(queue.pop()!) ?? [])
      if (!hit.has(r)) (hit.add(r), queue.push(r));
  for (const d of [...hit].sort())
    console.log(`${units.get(d)!.kind}\t${units.get(d)!.name}\t${d}`);
  process.exit(0);
}
const errors = findings.filter((f) => f.level === "error").length;
if (args.includes("--json")) {
  console.log(JSON.stringify({ units: units.size, errors, findings }, null, 2));
} else if (args.includes("--graph")) {
  for (let l = 0; l < LAYER_NAMES.length; l++) {
    const members = [...units.values()]
      .filter((u) => scopeFor(u.dir).layer === l)
      .map((u) => u.dir);
    console.log(`${LAYER_NAMES[l]} (${members.length}): ${members.join(" ")}`);
  }
} else {
  for (const f of findings)
    console.log(
      `${f.level === "error" ? "ERROR" : "WARN "} ${f.from}${f.to ? " -> " + f.to : ""}: ${f.msg}`,
    );
  console.log(
    `checkdeps: ${units.size} units, ${errors} errors, ${findings.length - errors} warnings`,
  );
}
process.exit(errors ? 1 : 0);
