import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bunify, planMarkdown, rewriteTool, rewriteToolScript } from "../src/index.ts";
import { ADDON_DEPS, analyzeSource, pinOf } from "../src/rust.ts";

describe("rewriteTool", () => {
  test.each([
    ["prettier --write .", "bun fmt ."],
    ["npx prettier --check src", "bun fmt --check src"],
    ["eslint --fix src", "oxlint --fix src"],
    ["tsc --noEmit", "bun check"],
    ["babel src -d lib", "swc src -d lib"],
  ])("%s", (i, o) => expect(rewriteTool(i)).toMatchObject({ out: o }));
  test("manual cases", () => {
    expect(rewriteTool("eslint --config x.js .")).toHaveProperty("manual");
    expect(rewriteTool("tsc -p .")).toHaveProperty("manual");
    expect(rewriteTool("webpack --mode production")).toMatchObject({ to: "rspack build" });
    expect(rewriteTool("postcss a.css")).toHaveProperty("manual");
    expect(rewriteTool("prettier --write . | cat")).toHaveProperty("manual");
    expect(rewriteTool("ls")).toBeNull();
  });
  test("scripts and idempotence", () => {
    const { out, hits } = rewriteToolScript("prettier --write . && eslint --fix . && webpack");
    expect(out).toBe("bun fmt . && oxlint --fix . && webpack");
    expect(hits).toHaveLength(3);
    expect(rewriteToolScript(out).out).toBe(out);
  });
});

describe("analyzeSource", () => {
  test("spawn rewrites and manual sites", () => {
    const src = `import { execSync, spawnSync } from "node:child_process";
execSync("prettier --write .");
spawnSync("eslint", ["--fix", "src"], { stdio: "inherit" });
execSync("eslint --config x .");
`;
    const r = analyzeSource("a.ts", src);
    expect(r.text).toContain('execSync("bun fmt .")');
    expect(r.text).toContain('spawnSync("oxlint", ["--fix", "src"], { stdio: "inherit" })');
    expect(r.text).toContain('execSync("eslint --config x .")');
    expect(r.items.filter((i) => i.status === "rewritten")).toHaveLength(2);
    expect(r.items.filter((i) => i.status === "manual")).toHaveLength(1);
  });
  test("hot imports and addons", () => {
    const r = analyzeSource("b.js", `const sharp = require("sharp");\nimport pako from "pako";\nconst a = require("./x.node");\nprocess.dlopen(m, p);\n`);
    expect(r.items.map((i) => `${i.kind}:${i.id}`).sort()).toEqual(["addon:*.node", "addon:process.dlopen", "hot:pako", "hot:sharp"]);
  });
});

describe("pins and tables", () => {
  test("prefer aphrody-labs forks", () => {
    expect(pinOf("oxc")).toBe("github:aphrody-labs/oxc");
    expect(pinOf("blake3, sha2")).toBe("github:BLAKE3-team/BLAKE3");
  });
  test("addon dependencies stay in depot-migrate's obsolete list", () => {
    const rs = join(import.meta.dir, "..", "..", "..", "crates", "depot-migrate", "src", "manifest.rs");
    if (!existsSync(rs)) return;
    const list = readFileSync(rs, "utf8");
    for (const d of ["node-gyp", "nan", "node-addon-api"]) {
      expect(ADDON_DEPS).toContain(d);
      expect(list).toContain(`"${d}"`);
    }
  });
});

describe("bunify stage rust", () => {
  const repo = () => {
    const root = mkdtempSync(join(tmpdir(), "n2r-"));
    mkdirSync(join(root, "src"));
    writeFileSync(join(root, "package.json"), JSON.stringify({ name: "x", scripts: { fmt: "prettier --write .", lint: "eslint --fix src", build: "webpack" }, dependencies: { sharp: "1.0.0", nan: "2.0.0" } }, null, 2) + "\n");
    writeFileSync(join(root, "binding.gyp"), "{}");
    writeFileSync(join(root, "src", "a.ts"), 'import { execSync } from "node:child_process";\nexecSync("prettier --check .");\n');
    return root;
  };
  test("plan only with --check", async () => {
    const root = repo();
    const r = await bunify({ root, stage: "rust", check: true });
    expect(r.rust!.summary).toMatchObject({ addon: 2, hot: 1, rewritten: 3 });
    expect(readFileSync(join(root, "src", "a.ts"), "utf8")).toContain("prettier");
    expect(planMarkdown(r.rust!)).toContain("bun fmt --check .");
  });
  test("rewrites and is idempotent", async () => {
    const root = repo();
    await bunify({ root, stage: "rust" });
    expect(readFileSync(join(root, "src", "a.ts"), "utf8")).toContain('execSync("bun fmt --check .")');
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts).toEqual({ fmt: "bun fmt .", lint: "oxlint --fix src", build: "webpack" });
    const again = await bunify({ root, stage: "rust", check: true });
    expect(again.changed).toEqual([]);
  });
});
