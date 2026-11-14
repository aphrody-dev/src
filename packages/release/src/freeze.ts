// `ay release freeze [--check]`: the frozen versioning system of docs/VERSIONING.md, applied by code.
// VERSION (repo root, one SemVer line) is the only hand-written monorepo version. freeze copies it into
//   - Cargo.toml [workspace.package] version (every crate with version.workspace = true inherits it),
//   - the `version` of every path dependency on such a crate (inline tables and [*dependencies.<name>] tables,
//     in every workspace Cargo.toml; only inside dependency sections),
//   - the root package.json "version",
// then refreshes Cargo.lock offline (cargo metadata, no build). --check (judge.yml) writes nothing and exits 1 on
// any drift, on a VERSION that is not SemVer, when the tags cannot be listed, or when VERSION is not above the
// latest stable tag vX.Y.Z (allowed equal only on the tagged commit itself): a canary X.Y.Z-canary.N must sort
// after the stable it follows.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

// SemVer 2.0.0 (semver.org): numeric identifiers without leading zeros, optional pre-release and build metadata.
const NUM = "0|[1-9]\\d*";
const PRE = `(?:${NUM}|\\d*[A-Za-z-][0-9A-Za-z-]*)`;
export const SEMVER = new RegExp(
  `^(${NUM})\\.(${NUM})\\.(${NUM})(?:-(${PRE}(?:\\.${PRE})*))?(?:\\+([0-9A-Za-z-]+(?:\\.[0-9A-Za-z-]+)*))?$`,
);

/** SemVer precedence (build metadata ignored, as the spec requires). */
export function cmp(a: string, b: string): number {
  if (!SEMVER.test(a) || !SEMVER.test(b))
    throw new Error(`not SemVer: ${SEMVER.test(a) ? b : a}`);
  return Bun.semver.order(a, b);
}

/** Highest stable version among tag names vX.Y.Z (pre-releases and non-SemVer tags ignored). */
export function latestStable(tags: string[]): string | null {
  const v = tags
    .map((t) => t.replace(/^refs\/tags\//, "").replace(/\^\{\}$/, ""))
    .filter(
      (t) => t.startsWith("v") && SEMVER.test(t.slice(1)) && !/[-+]/.test(t),
    )
    .map((t) => t.slice(1));
  return v.sort(cmp).at(-1) ?? null;
}

const header = (line: string) =>
  /^\s*\[\[?\s*([^\]]+?)\s*\]\]?\s*(#.*)?$/.exec(line)?.[1] ?? null;

/** Root Cargo.toml with [workspace.package] version set to v; throws when the key is absent. */
export function setWorkspaceVersion(toml: string, v: string): string {
  let sec = "",
    done = false;
  const out = toml.split("\n").map((line) => {
    const h = header(line);
    if (h !== null) {
      sec = h;
      return line;
    }
    if (
      sec === "workspace.package" &&
      !done &&
      /^\s*version\s*=\s*"/.test(line)
    ) {
      done = true;
      return line.replace(/(=\s*")[^"]*(")/, `$1${v}$2`);
    }
    return line;
  });
  if (!done)
    throw new Error("Cargo.toml: no version key in [workspace.package]");
  return out.join("\n");
}

/** A manifest with the version of every path dependency on an inheriting crate set to v, in dependency sections
 *  only: inline `name = { path = "..", version = ".." }` and `[<...>dependencies.<name>]` tables.
 *  `dir` = the manifest's directory, `inherit` = norm()ed directories of crates that use version.workspace. */
export function setPathDepVersions(
  toml: string,
  dir: string,
  inherit: Set<string>,
  v: string,
): string {
  const lines = toml.split("\n");
  const isDeps = (s: string) => /(^|\.)(dev-|build-)?dependencies$/.test(s);
  const isDepTable = (s: string) =>
    /(^|\.)(dev-|build-)?dependencies\.[^.]+$/.test(s);
  const hits = (p: string) => inherit.has(norm(resolve(dir, p)));
  let sec = "";
  let table: number[] = [],
    tablePath: string | null = null;
  const flush = () => {
    if (tablePath && hits(tablePath))
      for (const i of table)
        lines[i] = lines[i]!.replace(/(=\s*")[^"]*(")/, `$1${v}$2`);
    table = [];
    tablePath = null;
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const h = header(line);
    if (h !== null) {
      flush();
      sec = h;
      continue;
    }
    if (isDepTable(sec)) {
      const p = /^\s*path\s*=\s*"([^"]+)"/.exec(line);
      if (p) tablePath = p[1]!;
      if (/^\s*version\s*=\s*"/.test(line)) table.push(i);
      continue;
    }
    if (!isDeps(sec)) continue;
    const p = /\bpath\s*=\s*"([^"]+)"/.exec(line);
    if (!p || !/\bversion\s*=\s*"/.test(line) || !hits(p[1]!)) continue;
    lines[i] = line.replace(/(\bversion\s*=\s*")[^"]*(")/, `$1${v}$2`);
  }
  flush();
  return lines.join("\n");
}

/** Path key: forward slashes, no trailing slash; case-folded only on Windows (case-insensitive file system). */
export const norm = (p: string) => {
  const s = p.replace(/\\/g, "/").replace(/\/$/, "");
  return process.platform === "win32" ? s.toLowerCase() : s;
};

export type Drift = { file: string; what: string };

export function freeze(
  root: string,
  check: boolean,
): { version: string; drift: Drift[]; errors: string[] } {
  const errors: string[] = [];
  const drift: Drift[] = [];
  const vf = join(root, "VERSION");
  const version = existsSync(vf) ? readFileSync(vf, "utf8").trim() : "";
  if (!SEMVER.test(version) || version.includes("+"))
    return {
      version,
      drift,
      errors: [
        `VERSION: missing or not SemVer X.Y.Z[-pre] without build metadata (${JSON.stringify(version)})`,
      ],
    };

  const meta = Bun.spawnSync(
    ["cargo", "metadata", "--no-deps", "--format-version", "1", "--offline"],
    { cwd: root, stdout: "pipe", stderr: "pipe" },
  );
  if (meta.exitCode !== 0)
    return {
      version,
      drift,
      errors: [
        `cargo metadata: ${meta.stderr.toString().trim().split("\n").at(-1)}`,
      ],
    };
  const pkgs = (
    JSON.parse(meta.stdout.toString()) as {
      packages: { name: string; manifest_path: string }[];
    }
  ).packages;
  const manifests = pkgs.map((p) => p.manifest_path);
  const inherit = new Set<string>();
  for (const m of manifests) {
    const t = readFileSync(m, "utf8");
    if (
      /^\s*version\s*(?:\.\s*workspace\s*=\s*true|=\s*\{\s*workspace\s*=\s*true\s*\})/m.test(
        t,
      )
    )
      inherit.add(norm(dirname(m)));
  }

  const edit = (file: string, f: (s: string) => string, what: string) => {
    const before = readFileSync(file, "utf8");
    const after = f(before);
    if (after === before) return;
    drift.push({ file: relative(root, file).replace(/\\/g, "/"), what });
    if (!check) writeFileSync(file, after);
  };
  const rootToml = join(root, "Cargo.toml");
  try {
    edit(
      rootToml,
      (s) =>
        setPathDepVersions(
          setWorkspaceVersion(s, version),
          root,
          inherit,
          version,
        ),
      `[workspace.package] / workspace path deps -> ${version}`,
    );
  } catch (e) {
    return { version, drift, errors: [String((e as Error).message)] };
  }
  for (const m of manifests)
    if (resolve(m) !== resolve(rootToml))
      edit(
        m,
        (s) => setPathDepVersions(s, dirname(m), inherit, version),
        `path deps -> ${version}`,
      );
  edit(
    join(root, "package.json"),
    (s) => s.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`),
    `"version" -> ${version}`,
  );

  if (!check && drift.length) {
    const lock = Bun.spawnSync(
      ["cargo", "metadata", "--format-version", "1", "--offline"],
      { cwd: root, stdout: "ignore", stderr: "pipe" },
    );
    if (lock.exitCode !== 0)
      errors.push(
        `Cargo.lock refresh: ${lock.stderr.toString().trim().split("\n").at(-1)}`,
      );
  }

  // Tags from origin (the CI checkout is shallow, without tags); unreachable origin = explicit failure.
  const remote = Bun.spawnSync(["git", "ls-remote", "--tags", "origin", "v*"], {
    cwd: root,
    stdout: "pipe",
    stderr: "pipe",
  });
  if (remote.exitCode !== 0) {
    errors.push(
      `git ls-remote origin: ${remote.stderr.toString().trim().split("\n").at(-1)} (tags needed to compare VERSION with the last stable)`,
    );
    return { version, drift, errors };
  }
  const refs = remote.stdout
    .toString()
    .split("\n")
    .filter(Boolean)
    .map((l) => l.split("\t") as [string, string]);
  const stable = latestStable(refs.map(([, r]) => r));
  if (stable && cmp(version, stable) < 0)
    errors.push(`VERSION ${version} is below the latest stable tag v${stable}`);
  else if (stable && cmp(version, stable) === 0) {
    // Equal is valid only on the tagged commit itself; the next commit bumps VERSION (docs/VERSIONING.md).
    const head = Bun.spawnSync(["git", "rev-parse", "HEAD"], {
      cwd: root,
      stdout: "pipe",
    })
      .stdout.toString()
      .trim();
    const at = refs
      .filter(
        ([, r]) =>
          r === `refs/tags/v${stable}` || r === `refs/tags/v${stable}^{}`,
      )
      .map(([h]) => h);
    if (!at.includes(head))
      errors.push(
        `VERSION ${version} equals the stable tag v${stable} but HEAD is not that commit: bump VERSION (a canary ${version}-canary.N would sort before v${stable})`,
      );
  }
  return { version, drift, errors };
}

export function main(
  args: string[],
  root = process.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", ".."),
): never {
  const check = args.includes("--check");
  const r = freeze(root, check);
  for (const d of r.drift)
    console.error(`${check ? "drift" : "fixed"} ${d.file}: ${d.what}`);
  for (const e of r.errors) console.error(`error ${e}`);
  const bad = r.errors.length > 0 || (check && r.drift.length > 0);
  console.error(
    bad
      ? `ay release freeze${check ? " --check" : ""}: FAIL (VERSION ${r.version})${check && r.drift.length ? "; fix with `ay release freeze`" : ""}`
      : `ay release freeze${check ? " --check" : ""}: ok, monorepo version ${r.version}${check ? "" : `, ${r.drift.length} file(s) updated`}`,
  );
  process.exit(bad ? 1 : 0);
}

if (import.meta.main) main(process.argv.slice(2));
