#!/usr/bin/env bun
// ay release: one release flow run on fr1 (config: packages/release/release.toml). Dry-run unless `publish` is given.
//   ay release [plan|dry-run|publish] [--only crates,npm,pypi,vcpkg,github] [--verify] [--json] [--out DIR]
// plan     registry state only (no build); dry-run (default) adds cargo publish --dry-run, bun publish --dry-run,
//          maturin wheel + twine check, vcpkg git-registry generated locally; publish needs every NEW package listed
//          in .agents/owner-rules.json, then tags, creates the GitHub release, dispatches the OIDC workflows
//          (crates-publish.yml, npm-publish.yml, pypi-publish.yml) and pushes the vcpkg registry.
// Heavy steps (cargo, maturin) run under aphrody-heavy when it exists (fr1 lock, nice 19, load gate).
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import {
  baseline,
  gate,
  key,
  portFiles,
  pyproject,
  versionsFile,
  versionsPath,
  type Item,
  type OwnerRules,
  type PortSpec,
} from "./plan.ts";

const root = process.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..");
const argv = process.argv.slice(2);
const mode = (["plan", "dry-run", "publish"].includes(argv[0] ?? "") ? argv.shift() : "dry-run") as "plan" | "dry-run" | "publish";
const flag = (n: string) => argv.includes(n);
const opt = (n: string) => {
  const i = argv.indexOf(n);
  return i >= 0 ? argv[i + 1] : undefined;
};
const only = new Set((opt("--only") ?? "github,crates,npm,pypi,vcpkg").split(","));
const out = opt("--out") ?? join(root, "target", "release-plan");
const json = flag("--json");
const cfg = Bun.TOML.parse(readFileSync(join(import.meta.dir, "..", "release.toml"), "utf8")) as any;
const ws = (Bun.TOML.parse(readFileSync(join(root, "Cargo.toml"), "utf8")) as any).workspace.package;
const version: string = ws.version;
const tag = `${cfg.tag_prefix}${version}`;
const log = (s: string) => json || console.error(s);

function run(cmd: string[], cwd = root, heavy = false): { ok: boolean; out: string } {
  const argv = heavy && Bun.which("aphrody-heavy") ? ["aphrody-heavy", ...cmd] : cmd;
  const p = Bun.spawnSync(argv, { cwd, stdout: "pipe", stderr: "pipe", env: { ...process.env, SRC_ROOT: root } });
  return { ok: p.exitCode === 0, out: (p.stdout.toString() + p.stderr.toString()).trim() };
}
const tail = (s: string, n = 6) => s.split("\n").slice(-n).join("\n");

async function exists(url: string, headers: Record<string, string> = {}): Promise<number> {
  const r = await fetch(url, { headers: { "user-agent": "aphrody-release (github.com/aphrody-labs/src)", ...headers } });
  return r.status;
}

const items: Item[] = [];

// GitHub: tag and release.
if (only.has("github")) {
  const t = run(["git", "ls-remote", "--tags", "origin", `refs/tags/${tag}`]);
  const r = run(["gh", "release", "view", tag, "-R", cfg.repo, "--json", "tagName"]);
  items.push({ registry: "github", name: tag, version, isNew: false, published: t.out.includes(tag) && r.ok });
}

// crates.io: workspace crates whose publish is not false.
if (only.has("crates")) {
  const meta = JSON.parse(run(["cargo", "metadata", "--no-deps", "--format-version", "1"]).out.split("\n").find((l) => l.startsWith("{")) ?? "{}");
  const sel: string[] = cfg.crates.select ?? [];
  const pkgs = (meta.packages ?? []).filter((p: any) => p.publish === null && (!sel.length || sel.includes(p.name)));
  for (const p of pkgs) {
    const st = await exists(`https://crates.io/api/v1/crates/${p.name}`);
    const vs = st === 200 ? await exists(`https://crates.io/api/v1/crates/${p.name}/${p.version}`) : 404;
    const it: Item = { registry: "crates", name: p.name, version: p.version, isNew: st === 404, published: vs === 200 };
    if (st === 200) {
      // A crate of the same name owned by someone else is a name collision, not an update.
      const r = await fetch(`https://crates.io/api/v1/crates/${p.name}/owners`, { headers: { "user-agent": "aphrody-release (github.com/aphrody-labs/src)" } });
      const owners = ((await r.json()) as { users?: { login: string }[] }).users?.map((u) => u.login) ?? [];
      if (!owners.some((o) => (cfg.crates.owners ?? ["aphrody-dev"]).includes(o))) {
        it.dryRun = { ok: false, detail: `name taken on crates.io by ${owners.join(",") || "?"}: rename the crate` };
        items.push(it);
        continue;
      }
    }
    if (mode !== "plan" && !it.published) {
      const r = run(["cargo", "publish", "--dry-run", "--allow-dirty", "-p", p.name, ...(flag("--verify") ? [] : ["--no-verify"])], root, true);
      it.dryRun = { ok: r.ok, detail: tail(r.out, 3) };
    }
    items.push(it);
  }
}

// npm: non-private packages/*.
if (only.has("npm")) {
  const sel: string[] = cfg.npm.select ?? [];
  const dirs = sel.length ? sel : readdirSync(join(root, "packages")).map((d) => `packages/${d}`).filter((d) => existsSync(join(root, d, "package.json")));
  for (const d of dirs) {
    const pj = JSON.parse(readFileSync(join(root, d, "package.json"), "utf8"));
    if (pj.private) continue;
    const st = await exists(`https://registry.npmjs.org/${pj.name.replace("/", "%2f")}`);
    const vs = st === 200 ? await exists(`https://registry.npmjs.org/${pj.name.replace("/", "%2f")}/${pj.version}`) : 404;
    const it: Item = { registry: "npm", name: pj.name, version: pj.version, isNew: st === 404, published: vs === 200 };
    if (mode !== "plan" && !it.published) {
      const r = run(["bun", "publish", "--dry-run", "--access", "public"], join(root, d));
      it.dryRun = { ok: r.ok, detail: tail(r.out, 2) };
    }
    items.push(it);
  }
}

// PyPI: PyO3 crates, maturin wheel (abi3) + sdist, twine check.
if (only.has("pypi")) {
  for (const c of cfg.pypi.crates as string[]) {
    const ct = Bun.TOML.parse(readFileSync(join(root, c, "Cargo.toml"), "utf8")) as any;
    const dist: string = cfg.pypi.dist_name?.[c] ?? ct.package.name;
    const v = typeof ct.package.version === "string" ? ct.package.version : version;
    const st = await exists(`https://pypi.org/pypi/${dist}/json`);
    const vs = st === 200 ? await exists(`https://pypi.org/pypi/${dist}/${v}/json`) : 404;
    const it: Item = { registry: "pypi", name: dist, version: v, isNew: st === 404, published: vs === 200 };
    if (mode !== "plan" && !it.published) {
      const pp = join(root, c, "pyproject.toml");
      const generated = !existsSync(pp);
      if (generated) writeFileSync(pp, pyproject(dist, v, ct.package.description ?? dist, cfg.repo));
      const wd = join(out, "pypi", dist);
      rmSync(wd, { recursive: true, force: true });
      const b = run(["uvx", "maturin@1.16.0", "build", "--release", "--sdist", "-m", join(c, "Cargo.toml"), "-o", wd], root, true);
      const files = b.ok ? readdirSync(wd).map((f) => join(wd, f)) : [];
      const t = b.ok ? run(["uvx", "twine", "check", "--strict", ...files]) : { ok: false, out: "" };
      if (generated) rmSync(pp);
      it.dryRun = { ok: b.ok && t.ok, detail: b.ok ? `${files.map((f) => f.split("/").pop()).join(", ")}; ${tail(t.out, 2)}` : tail(b.out, 4) };
    }
    items.push(it);
  }
}

// vcpkg: git registry generated under <out>/vcpkg-registry (cloned from the registry repo when it exists).
let registryExists = false;
if (only.has("vcpkg")) {
  registryExists = run(["gh", "api", `repos/${cfg.vcpkg.registry}`, "--jq", ".full_name"]).ok;
  const reg = join(out, "vcpkg-registry");
  rmSync(reg, { recursive: true, force: true });
  if (registryExists) run(["git", "clone", "-q", "--depth", "50", `https://github.com/${cfg.vcpkg.registry}.git`, reg]);
  else {
    mkdirSync(reg, { recursive: true });
    run(["git", "init", "-q", "-b", "main"], reg);
  }
  const g = (...a: string[]) => run(["git", "-c", "user.name=aphrody-release", "-c", "user.email=release@aphrody.app", ...a], reg);
  for (const p of cfg.vcpkg.ports as PortSpec[]) {
    const ref = mode === "publish" ? tag : run(["git", "rev-parse", "HEAD"]).out;
    let sha512: string | null = null;
    if (mode === "publish") {
      const tgz = await fetch(`https://github.com/${cfg.repo}/archive/${ref}.tar.gz`);
      sha512 = new Bun.CryptoHasher("sha512").update(await tgz.arrayBuffer()).digest("hex");
    }
    const ct = Bun.TOML.parse(readFileSync(join(root, p.crate, "Cargo.toml"), "utf8")) as any;
    const files = portFiles(p, version, { repo: cfg.repo, ref, sha512, description: ct.package.description ?? p.port, license: ws.license });
    for (const [f, body] of Object.entries(files)) {
      mkdirSync(join(reg, "ports", p.port), { recursive: true });
      writeFileSync(join(reg, "ports", p.port, f), body);
    }
    g("add", "-A");
    g("commit", "-q", "-m", `${p.port} ${version}: port`);
    const tree = g("rev-parse", `HEAD:ports/${p.port}`).out;
    const vp = join(reg, versionsPath(p.port));
    const bp = join(reg, "versions", "baseline.json");
    mkdirSync(dirname(vp), { recursive: true });
    const prevV = existsSync(vp) ? JSON.parse(readFileSync(vp, "utf8")) : null;
    const isNew = !registryExists || !prevV;
    writeFileSync(vp, JSON.stringify(versionsFile(prevV, { "git-tree": tree, version, "port-version": 0 }), null, 2) + "\n");
    writeFileSync(bp, JSON.stringify(baseline(existsSync(bp) ? JSON.parse(readFileSync(bp, "utf8")) : null, p.port, version), null, 2) + "\n");
    g("add", "-A");
    g("commit", "-q", "-m", `${p.port} ${version}: versions`);
    // Consistency check that x-add-version would do: the recorded tree is the port directory at HEAD.
    const ok = g("rev-parse", `HEAD:ports/${p.port}`).out === tree && (sha512 !== null || mode !== "publish");
    items.push({ registry: "vcpkg", name: p.port, version, isNew, published: false, dryRun: { ok, detail: `git-tree ${tree.slice(0, 12)}, ${reg}${sha512 ? "" : " (SHA512 computed from the tag at publish)"}` } });
  }
  if (!registryExists) items.push({ registry: "vcpkg", name: "repo", version: cfg.vcpkg.registry, isNew: true, published: false });
}

// Owner gate.
const rulesPath = join(root, ".agents", "owner-rules.json");
const rules: OwnerRules | null = existsSync(rulesPath) ? JSON.parse(readFileSync(rulesPath, "utf8")) : null;
const g8 = gate(items, rules);
const failed = items.filter((i) => i.dryRun && !i.dryRun.ok).map(key);
const report = { mode, version, tag, host: existsSync("/etc/aphrody/role") ? readFileSync("/etc/aphrody/role", "utf8").trim() : "unknown", ownerRules: rules ? rulesPath : null, gate: g8, failed, items };
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "report.json"), JSON.stringify(report, null, 2) + "\n");

if (json) console.log(JSON.stringify(report, null, 2));
else {
  for (const i of items) {
    const st = i.published ? "published" : i.isNew ? "NEW" : "update";
    const dr = i.dryRun ? (i.dryRun.ok ? "dry-run ok" : `dry-run FAIL: ${i.dryRun.detail.split("\n").pop()}`) : "";
    console.log(`${i.registry.padEnd(6)} ${i.name.padEnd(36)} ${i.version.padEnd(10)} ${st.padEnd(9)} ${dr}`);
  }
  const by = (r: string) => items.filter((i) => i.registry === r);
  console.log(`\n${tag}: ${items.length} items; ${["crates", "npm", "pypi", "vcpkg"].map((r) => `${r} ${by(r).filter((i) => i.dryRun?.ok).length}/${by(r).filter((i) => i.dryRun).length} ok`).join(", ")}`);
  console.log(`owner-rules: ${rules ? rulesPath : "absent"}; blocked new packages: ${g8.blocked.length}${g8.reason ? ` (${g8.reason})` : ""}`);
  console.log(`report: ${join(out, "report.json")}`);
}

if (mode !== "publish") process.exit(failed.length ? 1 : 0);

// publish: refuse if a new package is not approved or a dry-run failed.
if (g8.blocked.length) {
  console.error(`ay release publish: refused, ${g8.blocked.length} new package(s) without owner approval: ${g8.blocked.join(" ")}`);
  process.exit(3);
}
if (failed.length) {
  console.error(`ay release publish: refused, dry-run failures: ${failed.join(" ")}`);
  process.exit(1);
}
const todo = (r: string) => items.filter((i) => i.registry === r && !i.published);
const step = (what: string, r: { ok: boolean; out: string }) => {
  log(`${r.ok ? "ok  " : "FAIL"} ${what}${r.ok ? "" : `\n${tail(r.out)}`}`);
  if (!r.ok) process.exit(1);
};
if (todo("github").length) {
  step(`tag ${tag}`, run(["git", "tag", "-a", tag, "-m", tag]));
  step(`push ${tag}`, run(["git", "push", "origin", `refs/tags/${tag}`]));
  // release.yml (dist) builds the artifacts on the tag and creates the GitHub release itself.
}
const crates = todo("crates").map((i) => i.name);
if (crates.length) step("crates-publish.yml", run(["gh", "workflow", "run", cfg.crates.workflow, "-R", cfg.repo, "-f", `crates=${crates.join(" ")}`, "-f", "dry_run=false"]));
const npmDirs = todo("npm").map((i) => readdirSync(join(root, "packages")).find((d) => existsSync(join(root, "packages", d, "package.json")) && JSON.parse(readFileSync(join(root, "packages", d, "package.json"), "utf8")).name === i.name)).filter(Boolean).map((d) => `packages/${d}`);
if (npmDirs.length) step("npm-publish.yml", run(["gh", "workflow", "run", cfg.npm.workflow, "-R", cfg.repo, "-f", `packages=${npmDirs.join(" ")}`, "-f", "dry_run=false"]));
if (todo("pypi").length) step("pypi-publish.yml", run(["gh", "workflow", "run", cfg.pypi.workflow, "-R", cfg.repo, "-f", `crates=${(cfg.pypi.crates as string[]).join(" ")}`, "-f", "dry_run=false"]));
if (todo("vcpkg").length) {
  const reg = join(out, "vcpkg-registry");
  if (!registryExists) step(`create ${cfg.vcpkg.registry}`, run(["gh", "repo", "create", cfg.vcpkg.registry, "--public", "--description", "vcpkg registry of aphrody-labs (generated by ay release)"]));
  if (!registryExists) run(["git", "remote", "add", "origin", `https://github.com/${cfg.vcpkg.registry}.git`], reg);
  step("push vcpkg registry", run(["git", "push", "origin", "main"], reg));
}
