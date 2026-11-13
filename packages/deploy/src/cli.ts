#!/usr/bin/env bun
// ay deploy: client of aphrody.app (packages/deploy). Doc: packages/deploy/README.md.
//   ay deploy <project> [--ref main] [--local]   build in CI (default) or here (--local, vault env), preview URL
//   ay deploy ls [project]                       projects, or deployments of one project
//   ay deploy logs <project> [sha]               build log (latest deployment by default)
//   ay deploy rollback <project> [sha]           production back to sha, or to the previous production
//   ay deploy promote <project> <sha>            production to sha
//   ay deploy ci [--before sha] [--after sha] [--project p]...   CI entry: registry, affected projects, deploy
//   ay deploy registry                           upload the registry (projects, inventory, labs, brand)
// Container deploys stay under `ay deploy up|build|smoke|ps|shell|run|products` (just docker-*).
import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { affected, buildRegistry, loadProjects, SRC_ROOT } from "./registry.ts";
import { previewUrl, type Deployment, type Project } from "./state.ts";

const API = (Bun.env.APHRODY_DEPLOY_API ?? "https://aphrody.app").replace(
  /\/$/,
  "",
);
const TOKEN = Bun.env.APHRODY_DEPLOY_TOKEN ?? "";
const argv = Bun.argv.slice(2);

function flag(name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i < 0) return undefined;
  const v = argv[i + 1];
  argv.splice(i, 2);
  return v;
}
function flags(name: string): string[] {
  const out: string[] = [];
  for (let v = flag(name); v !== undefined; v = flag(name)) out.push(v);
  return out;
}
function bool(name: string): boolean {
  const i = argv.indexOf(name);
  if (i >= 0) argv.splice(i, 1);
  return i >= 0;
}

async function call<T = any>(
  method: string,
  path: string,
  body?: unknown,
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {};
  if (auth) {
    if (!TOKEN)
      throw new Error(
        "APHRODY_DEPLOY_TOKEN is not set (vault: env-kit exec -- ay deploy ...)",
      );
    headers.authorization = `Bearer ${TOKEN}`;
  }
  if (body !== undefined) headers["content-type"] = "application/json";
  const r = await fetch(API + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok)
    throw new Error(
      `${method} ${path}: HTTP ${r.status} ${text.slice(0, 300)}`,
    );
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

const git = (...a: string[]) =>
  Bun.spawnSync(["git", ...a], { cwd: SRC_ROOT })
    .stdout.toString()
    .trim();

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

async function upload(
  p: Project,
  sha: string,
  dir: string,
): Promise<{ files: number; bytes: number }> {
  const skip = p.exclude.map((g) => new Bun.Glob(g));
  const files = walk(dir)
    .map((f) => relative(dir, f).replace(/\\/g, "/"))
    .filter((rel) => !skip.some((g) => g.match(rel)));
  let bytes = 0;
  let next = 0;
  const one = async () => {
    for (let i = next++; i < files.length; i = next++) {
      const rel = files[i]!;
      const f = Bun.file(join(dir, rel));
      bytes += f.size;
      const path = `/api/projects/${p.name}/deployments/${sha}/files/${rel.split("/").map(encodeURIComponent).join("/")}`;
      for (let attempt = 1; ; attempt++) {
        const r = await fetch(API + path, {
          method: "PUT",
          headers: {
            authorization: `Bearer ${TOKEN}`,
            "content-type": f.type || "application/octet-stream",
          },
          body: f,
        });
        if (r.ok) break;
        if (attempt >= 3)
          throw new Error(
            `upload ${rel}: HTTP ${r.status} ${(await r.text()).slice(0, 200)}`,
          );
        await Bun.sleep(500 * attempt);
      }
    }
  };
  await Promise.all(Array.from({ length: 8 }, one));
  return { files: files.length, bytes };
}

async function githubDeployment(
  p: Project,
  sha: string,
  env: string,
  url: string,
  ok: boolean,
): Promise<void> {
  const repo = Bun.env.GITHUB_REPOSITORY;
  const token = Bun.env.GITHUB_TOKEN;
  if (!repo || !token) return;
  const h = {
    authorization: `Bearer ${token}`,
    accept: "application/vnd.github+json",
    "content-type": "application/json",
    "user-agent": "aphrody-deploy",
  };
  const r = await fetch(`https://api.github.com/repos/${repo}/deployments`, {
    method: "POST",
    headers: h,
    body: JSON.stringify({
      ref: sha,
      environment: env,
      auto_merge: false,
      required_contexts: [],
      transient_environment: env.startsWith("preview"),
      production_environment: env.startsWith("production"),
      description: `aphrody.app ${p.name}`,
    }),
  });
  if (!r.ok) return console.error(`github deployment ${env}: HTTP ${r.status}`);
  const d = (await r.json()) as { id: number };
  await fetch(
    `https://api.github.com/repos/${repo}/deployments/${d.id}/statuses`,
    {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        state: ok ? "success" : "failure",
        environment_url: url,
        log_url: Bun.env.GITHUB_RUN_URL,
        auto_inactive: true,
      }),
    },
  );
}

/** Build one project at `sha` (the checkout), upload it, finalize, promote when production = auto. */
async function deployOne(
  p: Project,
  sha: string,
  opts: { branch: string; message: string; run?: string; promote: boolean },
): Promise<boolean> {
  const url = previewUrl(p.name, sha);
  console.log(`== ${p.name}@${sha.slice(0, 7)}: ${p.build} in ${p.path}`);
  await call("POST", `/api/projects/${p.name}/deployments`, {
    sha,
    branch: opts.branch,
    message: opts.message,
    run: opts.run,
  });
  const t0 = Date.now();
  const r = await Bun.$`${{ raw: p.build }}`
    .cwd(join(SRC_ROOT, p.path))
    .env({ ...Bun.env, APHRODY_DEPLOY_SHA: sha } as Record<string, string>)
    .nothrow()
    .quiet();
  let log = `$ ${p.build}  (cwd ${p.path}, ${sha})\n${r.stdout.toString()}${r.stderr.toString()}\nexit ${r.exitCode} after ${((Date.now() - t0) / 1000).toFixed(1)} s\n`;
  if (r.exitCode !== 0) {
    console.error(log);
    await call("POST", `/api/projects/${p.name}/deployments/${sha}/finalize`, {
      state: "error",
      log: log.slice(-200_000),
    });
    await githubDeployment(p, sha, `preview/${p.name}`, url, false);
    return false;
  }
  const up = await upload(p, sha, join(SRC_ROOT, p.path, p.out));
  log += `uploaded ${up.files} files, ${up.bytes} bytes\n`;
  await call("POST", `/api/projects/${p.name}/deployments/${sha}/finalize`, {
    state: "ready",
    files: up.files,
    bytes: up.bytes,
    log: log.slice(-200_000),
  });
  console.log(`preview ${url} (${up.files} files)`);
  await githubDeployment(p, sha, `preview/${p.name}`, url, true);
  if (opts.promote && p.production === "auto") {
    const pr = await call("POST", `/api/projects/${p.name}/promote`, { sha });
    console.log(
      `production ${p.name} -> ${pr.sha?.slice(0, 7)} (was ${pr.previous?.slice(0, 7) ?? "none"})`,
    );
    if (p.domains[0])
      await githubDeployment(
        p,
        sha,
        `production/${p.name}`,
        `https://${p.domains[0]}`,
        true,
      );
  }
  return true;
}

function project(name: string | undefined): Project {
  const p = loadProjects().find((x) => x.name === name);
  if (!p)
    throw new Error(
      `unknown project ${name ?? ""} (packages/deploy/projects.toml: ${loadProjects()
        .map((x) => x.name)
        .join(", ")})`,
    );
  return p;
}

async function main(): Promise<number> {
  const sub = argv.shift();
  if (!sub || sub === "--help" || sub === "help") {
    console.log(
      (await Bun.file(import.meta.path).text())
        .split("\n")
        .filter((l) => l.startsWith("//"))
        .slice(0, 11)
        .map((l) => l.slice(3))
        .join("\n"),
    );
    return 0;
  }
  if (sub === "ls") {
    const name = argv.shift();
    if (!name) {
      const list = await call<any[]>("GET", "/api/projects", undefined, false);
      for (const p of list)
        console.log(
          `${p.name.padEnd(16)} prod ${(p.production ?? "-").slice(0, 7).padEnd(8)} latest ${(p.latest?.sha ?? "-").slice(0, 7).padEnd(8)} ${(p.latest?.state ?? "").padEnd(9)} ${p.domains.join(" ")}`,
        );
      return 0;
    }
    const d = await call<{
      production: string | null;
      deployments: Deployment[];
    }>("GET", `/api/projects/${name}/deployments`, undefined, false);
    for (const x of d.deployments)
      console.log(
        `${x.sha === d.production ? "*" : " "} ${x.sha.slice(0, 7)} ${x.state.padEnd(9)} ${(x.readyAt ?? x.createdAt).slice(0, 19)} ${previewUrl(name, x.sha)}  ${x.message}`,
      );
    return 0;
  }
  if (sub === "logs") {
    const name = argv.shift();
    let sha = argv.shift();
    if (!sha)
      sha = (
        await call<{ deployments: Deployment[] }>(
          "GET",
          `/api/projects/${name}/deployments`,
          undefined,
          false,
        )
      ).deployments[0]?.sha;
    if (!sha) throw new Error(`${name}: no deployment`);
    if (sha.length < 40)
      sha =
        (
          await call<{ deployments: Deployment[] }>(
            "GET",
            `/api/projects/${name}/deployments`,
            undefined,
            false,
          )
        ).deployments.find((d) => d.sha.startsWith(sha!))?.sha ?? sha;
    process.stdout.write(
      await call<string>("GET", `/api/projects/${name}/deployments/${sha}/log`),
    );
    return 0;
  }
  if (sub === "rollback" || sub === "promote") {
    const name = argv.shift();
    const sha = argv.shift();
    if (sub === "promote" && !sha)
      throw new Error("usage: ay deploy promote <project> <sha>");
    const r = await call(
      "POST",
      `/api/projects/${name}/${sub}`,
      sha ? { sha } : {},
    );
    console.log(
      `${name}: production ${r.previous?.slice(0, 7) ?? "none"} -> ${r.sha.slice(0, 7)}`,
    );
    return 0;
  }
  if (sub === "registry") {
    const reg = await buildRegistry(git("rev-parse", "HEAD"));
    const r = await call("PUT", "/api/registry", reg);
    console.log(
      `registry: ${r.projects} projects, ${reg.inventory.length} units, ${reg.labs.length} labs cards`,
    );
    return 0;
  }
  if (sub === "ci") {
    const before = flag("--before");
    const after = flag("--after") ?? git("rev-parse", "HEAD");
    const only = flags("--project");
    const all = loadProjects();
    const reg = await buildRegistry(after);
    await call("PUT", "/api/registry", reg);
    let targets: Project[];
    if (only.length) targets = all.filter((p) => only.includes(p.name));
    else if (!before || /^0+$/.test(before)) targets = all;
    else
      targets = affected(
        all,
        git("diff", "--name-only", before, after).split("\n").filter(Boolean),
      );
    console.log(`affected: ${targets.map((p) => p.name).join(", ") || "none"}`);
    const message = git("log", "-1", "--format=%s", after);
    const run = Bun.env.GITHUB_RUN_URL;
    let ok = true;
    for (const p of targets)
      ok =
        (await deployOne(p, after, {
          branch: Bun.env.GITHUB_REF_NAME ?? "main",
          message,
          run,
          promote: true,
        })) && ok;
    return ok ? 0 : 1;
  }
  // ay deploy <project>
  const p = project(sub);
  const ref = flag("--ref") ?? "main";
  if (bool("--local")) {
    if (git("status", "--porcelain", "--", p.path))
      console.error(
        `warning: ${p.path} has uncommitted changes; the deployment is labelled with HEAD`,
      );
    const sha = git("rev-parse", "HEAD");
    return (await deployOne(p, sha, {
      branch: git("rev-parse", "--abbrev-ref", "HEAD"),
      message: git("log", "-1", "--format=%s"),
      promote: bool("--prod"),
    }))
      ? 0
      : 1;
  }
  const gh = (...a: string[]) =>
    Bun.spawnSync(["gh", ...a], {
      cwd: SRC_ROOT,
      stdout: "pipe",
      stderr: "pipe",
    });
  const t = gh(
    "workflow",
    "run",
    "deploy.yml",
    "--ref",
    ref,
    "-f",
    `project=${p.name}`,
  );
  if (t.exitCode !== 0)
    throw new Error(`gh workflow run: ${t.stderr.toString()}`);
  const sha = git("rev-parse", `origin/${ref}`) || git("rev-parse", ref);
  console.log(
    `queued ${p.name}@${sha.slice(0, 7)} in CI (deploy.yml); preview when ready: ${previewUrl(p.name, sha)}`,
  );
  for (let i = 0; i < 120; i++) {
    await Bun.sleep(10_000);
    const d = await call<{ deployments: Deployment[] }>(
      "GET",
      `/api/projects/${p.name}/deployments`,
      undefined,
      false,
    ).catch(() => null);
    const rec = d?.deployments.find((x) => x.sha === sha);
    if (rec?.state === "ready")
      return (console.log(`ready ${previewUrl(p.name, sha)}`), 0);
    if (rec?.state === "error")
      return (
        console.error(
          `build failed: ay deploy logs ${p.name} ${sha.slice(0, 7)}`,
        ),
        1
      );
  }
  console.error("timed out waiting for CI (deployment still building)");
  return 1;
}

main().then(
  (c) => process.exit(c),
  (e) => {
    console.error(`ay deploy: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  },
);
