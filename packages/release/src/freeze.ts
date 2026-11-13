// `ay release freeze [--check]`: the frozen versioning system of docs/VERSIONING.md, applied by code.
// VERSION (repo root, one SemVer line) is the only hand-written monorepo version. freeze copies it into
//   - Cargo.toml [workspace.package] version (every crate with version.workspace = true inherits it),
//   - the `version = "..."` of every path dependency that points at such a crate (any workspace Cargo.toml),
//   - the root package.json "version",
// then refreshes Cargo.lock offline (cargo metadata, no build). --check (judge.yml) writes nothing and exits 1 on
// any drift, on a VERSION that is not SemVer, or on a VERSION not above the latest stable tag vX.Y.Z (a canary
// X.Y.Z-canary.N must sort after the stable it follows).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

export const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** SemVer precedence of two X.Y.Z[-pre] strings (build metadata not accepted). */
export function cmp(a: string, b: string): number {
  const pa = SEMVER.exec(a), pb = SEMVER.exec(b);
  if (!pa || !pb) throw new Error(`not SemVer: ${pa ? b : a}`);
  for (let i = 1; i <= 3; i++) if (+pa[i]! !== +pb[i]!) return +pa[i]! - +pb[i]!;
  if (!pa[4] || !pb[4]) return pa[4] ? -1 : pb[4] ? 1 : 0;
  const x = pa[4].split("."), y = pb[4].split(".");
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    if (x[i] === undefined) return -1;
    if (y[i] === undefined) return 1;
    const nx = /^\d+$/.test(x[i]!), ny = /^\d+$/.test(y[i]!);
    if (nx && ny && +x[i]! !== +y[i]!) return +x[i]! - +y[i]!;
    if (nx !== ny) return nx ? -1 : 1;
    if (x[i] !== y[i]) return x[i]! < y[i]! ? -1 : 1;
  }
  return 0;
}

/** Highest stable (no pre-release) version among tag names vX.Y.Z. */
export function latestStable(tags: string[]): string | null {
  const v = tags.map((t) => t.replace(/^refs\/tags\//, "").replace(/\^\{\}$/, "")).filter((t) => /^v\d+\.\d+\.\d+$/.test(t)).map((t) => t.slice(1));
  return v.sort(cmp).at(-1) ?? null;
}

/** Root Cargo.toml with [workspace.package] version set to v. */
export function setWorkspaceVersion(toml: string, v: string): string {
  return toml.replace(/(\[workspace\.package\][^[]*?\nversion\s*=\s*")[^"]*(")/, `$1${v}$2`);
}

/** A manifest with the version of every inline path dependency on an inheriting crate set to v.
 *  `dir` = the manifest's directory, `inherit` = absolute directories of crates that use version.workspace. */
export function setPathDepVersions(toml: string, dir: string, inherit: Set<string>, v: string): string {
  return toml
    .split("\n")
    .map((line) => {
      const p = /\bpath\s*=\s*"([^"]+)"/.exec(line);
      if (!p || !/\bversion\s*=\s*"/.test(line)) return line;
      if (!inherit.has(norm(resolve(dir, p[1]!)))) return line;
      return line.replace(/(\bversion\s*=\s*")[^"]*(")/, `$1${v}$2`);
    })
    .join("\n");
}

export const norm = (p: string) => p.replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();

export type Drift = { file: string; what: string };

export function freeze(root: string, check: boolean): { version: string; drift: Drift[]; errors: string[] } {
  const errors: string[] = [];
  const drift: Drift[] = [];
  const vf = join(root, "VERSION");
  const version = existsSync(vf) ? readFileSync(vf, "utf8").trim() : "";
  if (!SEMVER.test(version)) return { version, drift, errors: [`VERSION: missing or not SemVer X.Y.Z[-pre] (${JSON.stringify(version)})`] };

  const meta = Bun.spawnSync(["cargo", "metadata", "--no-deps", "--format-version", "1", "--offline"], { cwd: root, stdout: "pipe", stderr: "pipe" });
  if (meta.exitCode !== 0) return { version, drift, errors: [`cargo metadata: ${meta.stderr.toString().trim().split("\n").at(-1)}`] };
  const pkgs = (JSON.parse(meta.stdout.toString()) as { packages: { name: string; manifest_path: string }[] }).packages;
  const manifests = pkgs.map((p) => p.manifest_path);
  const inherit = new Set<string>();
  for (const m of manifests) {
    const t = readFileSync(m, "utf8");
    if (/^\s*version\s*(?:\.\s*workspace\s*=\s*true|=\s*\{\s*workspace\s*=\s*true\s*\})/m.test(t)) inherit.add(norm(dirname(m)));
  }

  const edit = (file: string, f: (s: string) => string, what: string) => {
    const before = readFileSync(file, "utf8");
    const after = f(before);
    if (after === before) return;
    drift.push({ file: relative(root, file).replace(/\\/g, "/"), what });
    if (!check) writeFileSync(file, after);
  };
  const rootToml = join(root, "Cargo.toml");
  edit(rootToml, (s) => setPathDepVersions(setWorkspaceVersion(s, version), root, inherit, version), `[workspace.package] / workspace path deps -> ${version}`);
  for (const m of manifests) if (resolve(m) !== resolve(rootToml)) edit(m, (s) => setPathDepVersions(s, dirname(m), inherit, version), `path deps -> ${version}`);
  edit(join(root, "package.json"), (s) => s.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`), `"version" -> ${version}`);

  if (!check && drift.length) {
    const lock = Bun.spawnSync(["cargo", "metadata", "--format-version", "1", "--offline"], { cwd: root, stdout: "ignore", stderr: "pipe" });
    if (lock.exitCode !== 0) errors.push(`Cargo.lock refresh: ${lock.stderr.toString().trim().split("\n").at(-1)}`);
  }

  const tags = Bun.spawnSync(["git", "ls-remote", "--tags", "--refs", "origin", "v*"], { cwd: root, stdout: "pipe", stderr: "pipe" });
  const local = Bun.spawnSync(["git", "tag", "--list", "v*"], { cwd: root, stdout: "pipe" });
  const names = [...tags.stdout.toString().split("\n").map((l) => l.split("\t")[1] ?? ""), ...local.stdout.toString().split("\n")].filter(Boolean);
  const stable = latestStable(names);
  if (stable && cmp(version, stable) <= 0 && !names.some((t) => t.endsWith(`v${version}`)))
    errors.push(`VERSION ${version} is not above the latest stable tag v${stable}: bump it (canaries must sort after stable)`);
  return { version, drift, errors };
}

export function main(args: string[], root = process.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..")): never {
  const check = args.includes("--check");
  const r = freeze(root, check);
  for (const d of r.drift) console.error(`${check ? "drift" : "fixed"} ${d.file}: ${d.what}`);
  for (const e of r.errors) console.error(`error ${e}`);
  const bad = r.errors.length > 0 || (check && r.drift.length > 0);
  console.error(bad ? `ay release freeze${check ? " --check" : ""}: FAIL (VERSION ${r.version})${check && r.drift.length ? "; fix with `ay release freeze`" : ""}` : `ay release freeze${check ? " --check" : ""}: ok, monorepo version ${r.version}${check ? "" : `, ${r.drift.length} file(s) updated`}`);
  process.exit(bad ? 1 : 0);
}

if (import.meta.main) main(process.argv.slice(2));
