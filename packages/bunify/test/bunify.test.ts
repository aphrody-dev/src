import { beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync, existsSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bunify, fixLockIntegrity, rewriteScript, rewriteSource } from "../src/index.ts";

describe("rewriteScript", () => {
  test.each([
    ["pnpm --filter \"./packages/**\" run clean", "bun --filter \"./packages/**\" run clean"],
    ["pnpm -r run build", "bun --filter '*' run build"],
    ["pnpm i && pnpm build", "bun install && bun run build"],
    ["yarn workspaces foreach -A run lint", "bun --filter '*' run lint"],
    ["lerna run test", "bun --filter '*' run test"],
    ["cross-env NODE_ENV=1 node x.js", "NODE_ENV=1 bun x.js"],
    ["npx tsc -p .", "bunx tsc -p ."],
    ["pnpm dlx turbo build", "bunx turbo build"],
    ["ts-node a.ts", "bun a.ts"],
    ["npm run a --workspaces", "bun --filter '*' run a"],
  ])("%s", (input, out) => expect(rewriteScript(input)).toBe(out));
  test("idempotent", () => {
    const once = rewriteScript("pnpm i && node a.js && pnpm --filter x run y");
    expect(rewriteScript(once)).toBe(once);
  });
});

test("rewriteSource", () => {
  expect(rewriteSource(`#!/usr/bin/env node\nexeca('pnpm', ['i'])\nspawn("node", [f])\nexec('npx x')`)).toBe(
    `#!/usr/bin/env bun\nexeca('bun', ['i'])\nspawn(process.execPath, [f])\nexec('bunx x')`,
  );
});

test("fixLockIntegrity drops git hashes only", () => {
  const git = `    "a/ci-info": ["ci-info@github:watson/ci-info#f43f", {}, "f43f", "sha512-AAA=="],`;
  const npm = `    "x": ["x@1.0.0", "", {}, "sha512-BBB=="],`;
  expect(fixLockIntegrity(git)).toBe(`    "a/ci-info": ["ci-info@github:watson/ci-info#f43f", {}, "f43f"],`);
  expect(fixLockIntegrity(npm)).toBe(npm);
});

test("pnpm monorepo end to end, then --check is clean", async () => {
  const root = mkdtempSync(join(tmpdir(), "bunify-"));
  mkdirSync(join(root, "packages/a"), { recursive: true });
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "r", private: true, packageManager: "pnpm@10.0.0", scripts: { build: "pnpm -r run build", "pnpm:devPreinstall": "node pre.js" }, devDependencies: { "cross-env": "7.0.3" } }, null, 2));
  writeFileSync(join(root, "pnpm-workspace.yaml"), "packages:\n  - 'packages/*'\noverrides:\n  left-pad: 1.3.0\nallowBuilds:\n  esbuild: true\nminimumReleaseAge: 60\n");
  writeFileSync(join(root, "packages/a/package.json"), JSON.stringify({ name: "a", scripts: { build: "node build.js" } }, null, 2));
  writeFileSync(join(root, "pre.js"), "#!/usr/bin/env node\n");
  const r = await bunify({ root, noLock: true });
  expect(r.source).toBe("pnpm");
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  expect(pkg.workspaces).toEqual(["packages/*"]);
  expect(pkg.overrides).toEqual({ "left-pad": "1.3.0" });
  expect(pkg.trustedDependencies).toEqual(["esbuild"]);
  expect(pkg.scripts).toEqual({ build: "bun --filter '*' run build", preinstall: "bun pre.js" });
  expect(pkg.packageManager.startsWith("bun@")).toBe(true);
  expect(pkg.devDependencies["cross-env"]).toBeUndefined();
  expect(JSON.parse(readFileSync(join(root, "packages/a/package.json"), "utf8")).scripts.build).toBe("bun build.js");
  expect(readFileSync(join(root, "bunfig.toml"), "utf8")).toContain("minimumReleaseAge = 3600");
  expect(existsSync(join(root, "pnpm-workspace.yaml"))).toBe(true); // kept until a bun.lock exists
  expect((await bunify({ root, noLock: true, check: true })).changed).toEqual(["pnpm-workspace.yaml"].filter(() => false));
});

// ---- fullbun ----
import { RULES, runFullbun, useCore, engine } from "../src/fullbun.ts";

async function fb(files: Record<string, string>, only?: string[], versions: Record<string, number[]> = {}) {
  const res = await runFullbun("/x", Object.keys(files), (r) => files[r]!, new Map(Object.entries(versions)), only);
  return { res, out: (name: string) => res.files.get(name) ?? files[name]! };
}
const one = async (rule: string, src: string, versions?: Record<string, number[]>) => {
  const { res, out } = await fb({ "a.ts": src }, [rule], versions);
  return { out: out("a.ts"), manual: res.manual, res };
};
const engines = [["tree-sitter", false], ["regex", true]] as const;

describe.each(engines)("fullbun rules (%s)", (_n, regex) => {
  beforeEach(() => useCore(!regex));
  if (!regex) test("engine", async () => expect(["tree-sitter", "regex"]).toContain(await engine()));

  test("execa", async () => {
    const src = `import { execa } from "execa";\nawait execa('git', ['status', '-s']);\nawait execa("pnpm", ["i"], { stdio: 'inherit' });\n`;
    const r = await one("execa", src);
    expect(r.out).toBe("await Bun.$`git status -s`.quiet();\nawait Bun.$`pnpm i`;\n");
    expect((await one("execa", r.out)).out).toBe(r.out);
    const bad = await one("execa", `import { execa } from "execa";\nconst { stdout } = await execa('git', ['x']);\nawait execa(cmd, args);\n`);
    expect(bad.out).toContain('from "execa"');
    expect(bad.manual.length).toBe(2);
  });
  test("glob", async () => {
    const r = await one("glob", `import { glob, globSync } from 'glob';\nconst a = await glob('src/**/*.ts', { cwd: root });\nconst b = globSync(pat);\n`);
    expect(r.out).toBe("const a = await Array.fromAsync(new Bun.Glob('src/**/*.ts').scan({ cwd: root, onlyFiles: false }));\nconst b = Array.from(new Bun.Glob(pat).scanSync({ onlyFiles: false }));\n");
    const fg = await one("glob", `const fg = require('fast-glob');\nconst x = fg.sync('*.js', { dot: true });\n`);
    expect(fg.out).toBe("const x = Array.from(new Bun.Glob('*.js').scanSync({ dot: true }));\n");
    const bad = await one("glob", `import glob from 'glob';\nglob('*.js', { ignore: 'x' });\nglob('*.js', cb);\n`);
    expect(bad.out).toContain("from 'glob'");
    expect(bad.manual.length).toBe(2);
  });
  test("rimraf", async () => {
    const r = await one("rimraf", `import { rimraf, rimrafSync } from "rimraf";\nawait rimraf(dir);\nrimrafSync('out');\n`, { rimraf: [5] });
    expect(r.out).toBe(`import { rm as fsRm } from "node:fs/promises";\nimport { rmSync as fsRmSync } from "node:fs";\nawait fsRm(dir, { recursive: true, force: true });\nfsRmSync('out', { recursive: true, force: true });\n`);
    expect((await one("rimraf", r.out, { rimraf: [5] })).out).toBe(r.out);
    expect((await one("rimraf", `import rimraf from "rimraf";\nrimraf(dir, cb);\n`)).manual.length).toBe(1);
    expect((await one("rimraf", `import rimraf from "rimraf";\nrimraf.sync(dir);\n`, { rimraf: [3] })).manual.length).toBe(1);
    expect((await one("rimraf", `import rimraf from "rimraf";\nrimraf('a/*');\n`, { rimraf: [5] })).manual.length).toBe(1);
  });
  test("del is report only", async () => {
    const r = await one("del", `import del from 'del';\nawait del(['a']);\n`);
    expect(r.out).toContain("from 'del'");
    expect(r.manual.length).toBe(1);
  });
  test("require-like", async () => {
    const r = await one("require-like", `const req = require('require-like');\nbox.require = req(__filename);\n`);
    expect(r.out).toBe(`const { createRequire } = require("node:module");\nbox.require = createRequire(__filename);\n`);
    expect((await one("require-like", `import req from 'require-like';\nreq(file, true);\n`)).manual.length).toBe(1);
  });
  test("dotenv", async () => {
    expect((await one("dotenv", `import 'dotenv/config';\nx();\n`)).out).toBe("x();\n");
    expect((await one("dotenv", `import dotenv from 'dotenv';\ndotenv.config();\nx();\n`)).out).toBe("x();\n");
    expect((await one("dotenv", `require('dotenv').config()\nx();\n`)).out).toBe("x();\n");
    const bad = await one("dotenv", `import dotenv from 'dotenv';\ndotenv.config({ path: '.env.x' });\n`);
    expect(bad.out).toContain("from 'dotenv'");
    expect(bad.manual.length).toBe(1);
  });
  test("node-fetch / undici", async () => {
    expect((await one("node-fetch", `import fetch, { Headers } from 'node-fetch';\nfetch(u);\n`)).out).toBe("fetch(u);\n");
    expect((await one("node-fetch", `import { fetch } from 'undici';\nfetch(u);\n`)).out).toBe("fetch(u);\n");
    expect((await one("node-fetch", `import { Agent } from 'undici';\n`)).manual.length).toBe(1);
    const bad = await one("node-fetch", `import fetch from 'node-fetch';\nconst b = await (await fetch(u)).buffer();\n`);
    expect(bad.out).toContain("node-fetch");
    expect(bad.manual.length).toBe(1);
  });
  test("ws client only", async () => {
    expect((await one("ws", `import WebSocket from 'ws';\nconst s = new WebSocket(url);\ns.addEventListener('open', f);\n`)).out).toBe("const s = new WebSocket(url);\ns.addEventListener('open', f);\n");
    expect((await one("ws", `import WebSocket from 'ws';\nconst s = new WebSocket(url);\ns.on('message', f);\n`)).manual.length).toBe(1);
    expect((await one("ws", `import { WebSocketServer } from 'ws';\n`)).manual.length).toBe(1);
  });
  test("stray reference blocks the rewrite", async () => {
    const r = await one("dotenv", `import 'dotenv/config';\nconst d = await import('dotenv');\n`);
    expect(r.out).toContain("dotenv/config");
    expect(r.manual.length).toBeGreaterThan(0);
  });
  test("chalk is kept", async () => {
    const r = await one("chalk", `import chalk from 'chalk';\nchalk.red('x');\n`);
    expect(r.res.files.size).toBe(0);
    expect(r.res.rules.chalk!.kept).toBe(1);
  });
});

test("rule table is complete", () => {
  for (const id of ["execa", "glob", "rimraf", "del", "require-like", "dotenv", "node-fetch", "ws", "jest", "taskr", "chalk"]) expect(RULES.find((r) => r.id === id)).toBeTruthy();
});

test("bunify --fullbun: drops dep, patches taskr, reports jest, idempotent", async () => {
  useCore(true);
  const root = mkdtempSync(join(tmpdir(), "bunify-fb-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "r", private: true, workspaces: ["packages/*"], devDependencies: { "@taskr/esnext": "1.1.0" } }));
  mkdirSync(join(root, "packages/a"), { recursive: true });
  writeFileSync(join(root, "packages/a/package.json"), JSON.stringify({ name: "a", dependencies: { rimraf: "^5.0.0", dotenv: "^16.0.0" }, devDependencies: { jest: "^29.0.0" }, scripts: { clean: "rimraf dist" } }));
  writeFileSync(join(root, "packages/a/x.ts"), `import dotenv from "dotenv";\ndotenv.config();\nimport { rimraf } from "rimraf";\nawait rimraf("dist");\n`);
  writeFileSync(join(root, "packages/a/x.test.ts"), `jest.mock("./x");\n`);
  const opts = { root, noLock: true, fullbun: true, tools: [] as string[] };
  const dry = await bunify({ ...opts, check: true });
  expect(dry.changed).toContain("packages/a/x.ts");
  expect(dry.fullbun!.rules.dotenv!.rewritten).toBe(1);
  expect(dry.manual.some((m) => m.rule === "jest" && m.reason.includes("1 file"))).toBe(true);
  await bunify(opts);
  const pkg = JSON.parse(readFileSync(join(root, "packages/a/package.json"), "utf8"));
  expect(pkg.dependencies.dotenv).toBeUndefined();
  expect(pkg.dependencies.rimraf).toBe("^5.0.0"); // still used by a script
  expect(readFileSync(join(root, "packages/a/x.ts"), "utf8")).toContain("fsRm");
  const root2 = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  expect(root2.patchedDependencies["@taskr/esnext@1.1.0"]).toBe("patches/@taskr%2Fesnext@1.1.0.patch");
  expect(existsSync(join(root, "patches/@taskr%2Fesnext@1.1.0.patch"))).toBe(true);
  expect((await bunify({ ...opts, check: true })).changed).toEqual([]);
});
