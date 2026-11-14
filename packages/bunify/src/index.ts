// @aphrody/bunify: switch any JS/TS monorepo from pnpm, yarn, npm or lerna + Node to Bun, idempotently.
import { Glob, $ } from "bun";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { esc, plannedPatches, runFullbun, type Engine, type Manual, type RuleStats, RULES } from "./fullbun.ts";

export { RULES, ruleSummary, type Manual, type Rule } from "./fullbun.ts";

export type Source = "pnpm" | "yarn" | "npm" | "bun";
export interface Options {
  root: string;
  check?: boolean;
  /** Skip `bun install --lockfile-only` (lock migration). */
  noLock?: boolean;
  /** Extra globs for package.json files outside the declared workspaces (fixtures, evals). */
  extraPackages?: string[];
  /** Globs of JS/TS tooling whose spawn calls are rewritten. */
  tools?: string[];
  /** Replace Node-era dependencies by Bun built-ins (see RULES). */
  fullbun?: boolean;
  /** Restrict the fullbun pass to these rule ids. */
  rules?: string[];
  log?: (line: string) => void;
}
export interface Report {
  source: Source;
  changed: string[];
  lock: "migrated" | "kept" | "skipped";
  /** Sites a fullbun rule could not rewrite safely. */
  manual: Manual[];
  fullbun?: { engine: Engine; rules: Record<string, RuleStats>; jest: { package: string; unsafeFiles: number }[] };
}

export const DEFAULT_TOOLS = [
  "*.{js,mjs,cjs,ts,mts}",
  "scripts/**/*.{js,mjs,cjs,ts,mts}",
  "packages/*/{scripts,taskfile}*/**/*.{js,mjs,cjs,ts}",
  "packages/*/taskfile*.{js,ts}",
  "packages/*/*.{mjs,cjs}",
];

export function detect(root: string): Source {
  if (existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))) return "bun";
  if (existsSync(join(root, "pnpm-workspace.yaml")) || existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock")) || existsSync(join(root, ".yarnrc.yml"))) return "yarn";
  return "npm";
}

/** Rewrite one package.json script so that it only needs Bun. */
export function rewriteScript(cmd: string): string {
  return cmd
    .replace(/\bcross-env(?:-shell)?\s+/g, "")
    .replace(/\b(?:pnpm|yarn)\s+--filter[= ]("[^"]+"|'[^']+'|\S+)\s+(?:--\S+\s+)*(?:run\s+|exec\s+)?/g, "bun run --filter $1 ")
    .replace(/\bpnpm\s+(?:-r|--recursive)\s+(?:--\S+\s+)*(?:run\s+)?/g, "bun run --filter '*' ")
    .replace(/\byarn\s+workspaces\s+(?:foreach\s+(?:-\S+\s+)*)?run\s+/g, "bun run --filter '*' ")
    .replace(/\blerna\s+run\s+/g, "bun run --filter '*' ")
    .replace(/\bnpm\s+run\s+(\S+)\s+--workspaces?\b/g, "bun run --filter '*' $1")
    .replace(/\b(?:pnpm|yarn|npm)\s+(?:i|install|ci)\b(?:\s+--frozen-lockfile)?/g, "bun install")
    .replace(/\b(?:pnpm|yarn)\s+(?:dlx|exec)\s+/g, "bunx ")
    .replace(/\bnpm\s+exec\s+(?:--\s+)?/g, "bunx ")
    .replace(/\b(?:pnpm|yarn|npm)\s+run\s+/g, "bun run ")
    .replace(/\b(?:pnpm|yarn)\s+(?=[\w@.:-])(?!add\b|remove\b|why\b)/g, "bun run ")
    .replace(/\bnpm\s+test\b/g, "bun run test")
    .replace(/\bbun --filter ("[^"]+"|'[^']+'|\S+) run /g, "bun run --filter $1 ")
    .replace(/\bnpx\s+/g, "bunx ")
    .replace(/(^|[\s;&|(])node(?=\s)/g, "$1bun")
    .replace(/(^|[\s;&|(])ts-node(?:-esm)?(?=\s)/g, "$1bun")
    .replace(/(^|[\s;&|(])tsx(?=\s)(?!\s*--?help)/g, "$1bun");
}

const SPAWN = /(execa|execaSync|spawn|spawnSync|exec|execSync|execFile|execFileSync|fork)\s*\(\s*(['"`])(pnpm|yarn|npm|npx|node)\2/g;
/** Rewrite JS/TS tooling: spawned package managers and node, shebangs. */
export function rewriteSource(text: string): string {
  return text
    .replace(SPAWN, (_m, fn: string, q: string, bin: string) =>
      bin === "node" ? `${fn}(process.execPath` : `${fn}(${q}${bin === "npx" ? "bunx" : "bun"}${q}`)
    .replace(/(['"`])(?:pnpm|yarn) (?:i|install)(?: --frozen-lockfile)?\b/g, "$1bun install")
    .replace(/(['"`])(?:pnpm|yarn|npm) run /g, "$1bun run ")
    .replace(/(['"`])npx /g, "$1bunx ")
    .replace(/^#!\/usr\/bin\/env (?:node|ts-node|tsx)\b/m, "#!/usr/bin/env bun");
}

/** pnpm-only override forms Bun rejects: removal ("-"), parent selectors (a>b), empty range ("pkg@"). */
export function normalizeOverrides(o: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === "-" || k.includes(">")) continue;
    out[k.replace(/@$/, "")] = v;
  }
  return out;
}

/** Root manifest fields from pnpm-workspace.yaml, lerna.json, yarn resolutions. */
export function migrateRoot(pkg: any, root: string): { bunfig: string | null; drop: string[] } {
  const drop: string[] = [];
  let bunfig: string | null = null;
  const wsFile = join(root, "pnpm-workspace.yaml");
  if (existsSync(wsFile)) {
    const ws = Bun.YAML.parse(readFileSync(wsFile, "utf8")) as Record<string, any>;
    if (ws.packages) pkg.workspaces = ws.packages;
    if (ws.overrides) pkg.overrides = { ...pkg.overrides, ...ws.overrides };
    if (ws.patchedDependencies) pkg.patchedDependencies = ws.patchedDependencies;
    if (ws.packageExtensions) pkg.packageExtensions = ws.packageExtensions;
    if (ws.catalog || ws.catalogs) pkg.workspaces = { packages: ws.packages, catalog: ws.catalog, catalogs: ws.catalogs };
    const allow = Object.entries(ws.allowBuilds ?? {}).filter(([, v]) => v === true).map(([k]) => k);
    const only = ws.onlyBuiltDependencies ?? [];
    if (allow.length || only.length) pkg.trustedDependencies = [...new Set([...allow, ...only])].sort();
    const lines = ["# Generated by @aphrody/bunify from pnpm-workspace.yaml.", "[install]"];
    if (ws.saveExact) lines.push("exact = true");
    if (ws.linkWorkspacePackages) lines.push("linkWorkspacePackages = true");
    if (ws.minimumReleaseAge) lines.push(`minimumReleaseAge = ${Number(ws.minimumReleaseAge) * 60}`);
    if (ws.minimumReleaseAgeExclude?.length)
      lines.push(`minimumReleaseAgeExcludes = ${JSON.stringify(ws.minimumReleaseAgeExclude)}`);
    bunfig = [...lines, "", "[run]", "# `node` in scripts and shebangs resolves to Bun.", "bun = true", ""].join("\n");
    drop.push(wsFile);
  }
  if (pkg.pnpm) {
    if (pkg.pnpm.overrides) pkg.overrides = { ...pkg.overrides, ...pkg.pnpm.overrides };
    if (pkg.pnpm.patchedDependencies) pkg.patchedDependencies = { ...pkg.patchedDependencies, ...pkg.pnpm.patchedDependencies };
    if (pkg.pnpm.onlyBuiltDependencies) pkg.trustedDependencies = [...new Set([...(pkg.trustedDependencies ?? []), ...pkg.pnpm.onlyBuiltDependencies])].sort();
    delete pkg.pnpm;
  }
  if (pkg.resolutions) {
    pkg.overrides = { ...pkg.overrides, ...pkg.resolutions };
    delete pkg.resolutions;
  }
  const lerna = join(root, "lerna.json");
  if (!pkg.workspaces && existsSync(lerna)) pkg.workspaces = JSON.parse(readFileSync(lerna, "utf8")).packages;
  for (const [hook, to] of [["pnpm:devPreinstall", "preinstall"]] as const)
    if (pkg.scripts?.[hook]) {
      pkg.scripts[to] = pkg.scripts[to] ? `${pkg.scripts[hook]} && ${pkg.scripts[to]}` : pkg.scripts[hook];
      delete pkg.scripts[hook];
    }
  if (pkg.overrides) pkg.overrides = normalizeOverrides(pkg.overrides);
  pkg.packageManager = `bun@${Bun.version.replace(/-.*/, "")}`;
  if (pkg.engines) {
    delete pkg.engines.node;
    delete pkg.engines.pnpm;
    delete pkg.engines.yarn;
    delete pkg.engines.npm;
    pkg.engines.bun = `>=${Bun.version.replace(/-.*/, "")}`;
  }
  return { bunfig, drop };
}

/** Git/GitHub dependencies keep the old manager's tarball hash after migration: drop it. */
export function fixLockIntegrity(lock: string): string {
  return lock.replace(/^(\s*"[^"]+": \["[^"@]+@(?:github|git\+[^"]+|git):[^"]*", \{[^\n]*\}, "[0-9a-f]+"), "sha512-[^"]+"\],$/gm, "$1],");
}

function workspaceGlobs(pkg: any): string[] {
  const ws = Array.isArray(pkg.workspaces) ? pkg.workspaces : (pkg.workspaces?.packages ?? []);
  return ws.filter((g: string) => !g.startsWith("!")).map((g: string) => `${g.replace(/\/$/, "")}/package.json`);
}

async function* scan(root: string, patterns: string[]) {
  const seen = new Set<string>();
  for (const p of patterns)
    for await (const raw of new Glob(p).scan({ cwd: root, dot: false })) {
      const rel = raw.replaceAll("\\", "/");
      if (rel.includes("node_modules/") || rel.includes("/dist/") || rel.includes("/compiled/") || seen.has(rel)) continue;
      seen.add(rel);
      yield rel;
    }
}

export async function bunify(opts: Options): Promise<Report> {
  const { root, check = false } = opts;
  const log = opts.log ?? (() => {});
  const source = detect(root);
  const changed: string[] = [];
  const save = async (rel: string, before: string, after: string) => {
    if (before === after) return;
    if (!changed.includes(rel)) changed.push(rel);
    if (!check) await Bun.write(join(root, rel), after);
    log(`${check ? "would change" : "changed"} ${rel}`);
  };

  // 1. Lock migration first: Bun reads pnpm-lock.yaml, yarn.lock and package-lock.json itself.
  let lock: Report["lock"] = "kept";
  if (!check && !opts.noLock && source !== "bun") {
    await $`bun install --lockfile-only`.cwd(root).quiet();
    lock = "migrated";
  } else if (opts.noLock) lock = "skipped";
  const lockPath = join(root, "bun.lock");
  if (existsSync(lockPath)) {
    const text = readFileSync(lockPath, "utf8");
    await save("bun.lock", text, fixLockIntegrity(text));
  }

  // 2. Root manifest and bunfig.
  const rootText = readFileSync(join(root, "package.json"), "utf8");
  const rootPkg = JSON.parse(rootText);
  const { bunfig, drop } = migrateRoot(rootPkg, root);
  if (bunfig !== null) {
    const p = join(root, "bunfig.toml");
    await save("bunfig.toml", existsSync(p) ? readFileSync(p, "utf8") : "", bunfig);
  }

  // 3. Fullbun source pass (needs the manifests to know versions and where dependencies are declared).
  const pkgGlobs = ["package.json", ...workspaceGlobs(rootPkg), ...(opts.extraPackages ?? [])];
  const manifests = new Map<string, { text: string; pkg: any }>();
  for await (const rel of scan(root, pkgGlobs)) {
    const text = rel === "package.json" ? rootText : readFileSync(join(root, rel), "utf8");
    manifests.set(rel, { text, pkg: rel === "package.json" ? rootPkg : JSON.parse(text) });
  }
  let manual: Manual[] = [];
  let fullbun: Report["fullbun"];
  let dropDeps = new Map<string, Set<string>>();
  if (opts.fullbun) {
    const versions = new Map<string, number[]>();
    for (const { pkg } of manifests.values())
      for (const f of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"])
        for (const [n, r] of Object.entries<string>(pkg[f] ?? {})) {
          const major = /\d+/.exec(r)?.[0];
          if (major) versions.set(n, [...(versions.get(n) ?? []), Number(major)]);
        }
    // only files owned by the root or a declared workspace package: examples and fixtures with their own manifest stay as shipped
    const owner = new Map<string, boolean>();
    const owned = (rel: string): boolean => {
      const dir = rel.includes("/") ? rel.slice(0, rel.lastIndexOf("/")) : "";
      if (!owner.has(dir)) {
        const mf = dir ? `${dir}/package.json` : "package.json";
        owner.set(dir, manifests.has(mf) ? true : existsSync(join(root, mf)) ? false : dir ? owned(dir) : true);
      }
      return owner.get(dir)!;
    };
    const files = (await sourceFiles(root)).filter(owned);
    const res = await runFullbun(root, files, (rel) => readFileSync(join(root, rel), "utf8"), versions, opts.rules);
    for (const [rel, after] of res.files) await save(rel, readFileSync(join(root, rel), "utf8"), after);
    manual = res.manual;
    // dependencies whose last reference is gone, per declaring package.json directory
    for (const rule of RULES.filter((r) => r.mode === "rewrite" && (!opts.rules || opts.rules.includes(r.id))))
      for (const name of rule.drop ?? []) {
        const gone = res.dropped.get(name);
        if (!gone) continue;
        for (const [rel, { pkg }] of manifests) {
          const dir = rel === "package.json" ? "" : rel.slice(0, -"package.json".length);
          const declared = ["dependencies", "devDependencies"].some((f) => pkg[f]?.[name]);
          if (!declared) continue;
          const under = (s: Set<string> | undefined) => [...(s ?? [])].some((f) => f.startsWith(dir));
          const script = Object.values<string>(pkg.scripts ?? {}).some((s) => new RegExp(`(^|[\\s;&|(])${esc(name)}(?=[\\s;&|)]|$)`).test(s));
          if (under(gone) && !under(res.remaining.get(name)) && !script) {
            if (!dropDeps.has(rel)) dropDeps.set(rel, new Set());
            dropDeps.get(rel)!.add(name);
          }
        }
      }
    const jest: { package: string; unsafeFiles: number }[] = [];
    for (const [rel, { pkg }] of manifests)
      if (["jest", "ts-jest", "babel-jest", "@swc/jest"].some((d) => pkg.dependencies?.[d] || pkg.devDependencies?.[d])) {
        const dir = rel === "package.json" ? "" : rel.slice(0, -"package.json".length);
        const unsafeFiles = [...res.jestFiles.keys()].filter((f) => f.startsWith(dir)).length;
        jest.push({ package: rel, unsafeFiles });
        manual.push({ rule: "jest", file: rel, line: 1, reason: unsafeFiles ? `jest with ${unsafeFiles} file(s) using mock/fake-timer APIs: keep` : "jest without hoisted-mock APIs: candidate for bun:test" });
        res.rules.jest = { files: (res.rules.jest?.files ?? 0) + 1, rewritten: 0, manual: (res.rules.jest?.manual ?? 0) + 1, kept: 0 };
      }
    // known bun patches (version read from node_modules or an exact range)
    const exact = (name: string) => {
      const nm = join(root, "node_modules", name, "package.json");
      if (existsSync(nm)) return JSON.parse(readFileSync(nm, "utf8")).version as string;
      for (const { pkg } of manifests.values())
        for (const f of ["dependencies", "devDependencies"]) if (/^\d/.test(pkg[f]?.[name] ?? "")) return pkg[f][name] as string;
    };
    if (!opts.rules || opts.rules.includes("taskr"))
      for (const pl of plannedPatches(root, rootPkg, exact)) {
        rootPkg.patchedDependencies = { ...rootPkg.patchedDependencies, [pl.key]: pl.file };
        if (pl.content) await save(pl.file, existsSync(join(root, pl.file)) ? readFileSync(join(root, pl.file), "utf8") : "", pl.content);
        res.rules.taskr = { files: (res.rules.taskr?.files ?? 0) + 1, rewritten: 1, manual: 0, kept: 0 };
      }
    fullbun = { engine: res.engine, rules: res.rules, jest };
  }

  // 4. Every package.json script.
  for (const [rel, m] of manifests) {
    const before = m.text;
    const pkg = m.pkg;
    for (const name of dropDeps.get(rel) ?? [])
      for (const field of ["dependencies", "devDependencies"]) delete pkg[field]?.[name];
    for (const [k, v] of Object.entries(pkg.scripts ?? {})) pkg.scripts[k] = rewriteScript(v as string);
    for (const field of ["dependencies", "devDependencies"])
      for (const dep of ["cross-env", "ts-node", "tsx"]) delete pkg[field]?.[dep];
    const indent = before.match(/^\{\n([ \t]+)"/)?.[1] ?? "  ";
    await save(rel, before, JSON.stringify(pkg, null, indent) + "\n");
  }

  // 5. Tooling.
  for await (const rel of scan(root, opts.tools ?? DEFAULT_TOOLS)) {
    const before = readFileSync(join(root, rel), "utf8");
    await save(rel, before, rewriteSource(before));
  }

  // 6. Old manager files.
  const old = [...drop, ...["pnpm-lock.yaml", "yarn.lock", "package-lock.json", ".yarnrc.yml", ".npmrc.pnpm"].map((f) => join(root, f))];
  for (const f of old)
    if (existsSync(f) && existsSync(lockPath)) {
      changed.push(f.slice(root.length + 1));
      if (!check) rmSync(f);
    }
  return { source, changed, lock, manual, fullbun };
}

const SRC_EXT = /\.(?:[cm]?[jt]s|[jt]sx)$/;
const SRC_SKIP = /(?:^|\/)(?:node_modules|dist|compiled|fixtures|__snapshots__|\.next|target|coverage)\/|\.d\.[cm]?ts$/;
/** Tracked and untracked-but-not-ignored JS/TS sources (git), else a glob walk. */
async function sourceFiles(root: string): Promise<string[]> {
  let all: string[] = [];
  if (existsSync(join(root, ".git"))) {
    const r = await $`git ls-files -z --cached --others --exclude-standard`.cwd(root).quiet().nothrow();
    if (r.exitCode === 0) all = r.stdout.toString().split("\0").filter(Boolean);
  }
  if (!all.length) for await (const rel of scan(root, ["**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}"])) all.push(rel);
  return all.filter((f) => SRC_EXT.test(f) && !SRC_SKIP.test(f) && existsSync(join(root, f)));
}
