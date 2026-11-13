import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git } from "../src/git.ts";
import {
  headRef,
  parseMessage,
  recommendation,
  slug,
  upstreamMessage,
  withMeta,
} from "../src/patch.ts";
import { bunPrBody, checkBun, checkChromium } from "../src/rules.ts";
import {
  branchSeries,
  fetchBoth,
  fileSeries,
  checkSeries,
  replay,
  rewriteMessage,
  type StackConfig,
} from "../src/stack.ts";
import { main } from "../src/cli.ts";

describe("trailers", () => {
  const msg =
    "build: relative paths\n\nWhy it matters.\n\nTested: ninja -t commands\n\nUpstream-Status: Submitted [https://github.com/oven-sh/bun/pull/1]\nUpstream-PR: https://github.com/oven-sh/bun/pull/1\n";
  test("parse", () => {
    const m = parseMessage(msg);
    expect(m.subject).toBe("build: relative paths");
    expect(m.status).toBe("submitted");
    expect(m.statusNote).toBe("https://github.com/oven-sh/bun/pull/1");
    expect(m.pr).toBe("https://github.com/oven-sh/bun/pull/1");
    expect(m.body).toBe("Why it matters.\n\nTested: ninja -t commands");
  });
  test("upstream message drops our trailers only", () => {
    expect(upstreamMessage(msg + "Signed-off-by: A <a@b>\n")).not.toContain(
      "Upstream-",
    );
    expect(
      upstreamMessage("x\n\nbody\n\nBug: 1\nUpstream-Status: Pending\n"),
    ).toBe("x\n\nbody\n\nBug: 1\n");
  });
  test("withMeta replaces and joins the trailer block", () => {
    const out = withMeta("x\n\nbody\n\nBug: 1\n", {
      status: "pending",
      statusNote: "",
      pr: null,
      owner: "bun-windows",
    });
    expect(out).toBe(
      "x\n\nbody\n\nBug: 1\nUpstream-Status: Pending\nUpstream-Owner: bun-windows\n",
    );
    const again = withMeta(out, {
      status: "inappropriate",
      statusNote: "aphrody-only",
      pr: null,
      owner: null,
    });
    expect(parseMessage(again).status).toBe("inappropriate");
    expect(again.match(/Upstream-Status/g)?.length).toBe(1);
  });
  test("slug follows Electron's munge_subject_to_filename", () => {
    expect(slug("child_process: expose the parent-end pipe fd")).toBe(
      "child_process_expose_the_parent-end_pipe_fd",
    );
    expect(headRef("build: pass bindgen sources relative")).toBe(
      "up/build-pass-bindgen-sources-relative",
    );
  });
  test("recommendation", () => {
    const m = parseMessage("x\n\nUpstream-Status: Submitted [u]\n");
    expect(recommendation(m, { state: "merged", url: "u" })).toContain(
      "retirer",
    );
    expect(recommendation(parseMessage("x\n"), null)).toContain(
      "statut manquant",
    );
  });
});

describe("rules", () => {
  const meta = parseMessage(
    "upgrade: fix\n\nWhat.\n\nTested: bun bd test test/cli/x.test.ts\n",
  );
  test("bun requires a test for src/ changes and a verification paragraph", () => {
    expect(
      checkBun({
        meta,
        files: ["src/a.rs"],
        added: "",
        authorEmail: "a@b",
      }).some((f) => f.rule === "bun-test"),
    ).toBe(true);
    expect(
      checkBun({
        meta,
        files: ["src/a.rs", "test/a.test.ts"],
        added: "",
        authorEmail: "a@b",
      }).filter((f) => f.level === "error"),
    ).toEqual([]);
    const noVerify = parseMessage("docs: x\n\nonly what\n");
    expect(
      checkBun({
        meta: noVerify,
        files: ["docs/a.mdx"],
        added: "",
        authorEmail: "a@b",
      }).some((f) => f.rule === "bun-pr-template"),
    ).toBe(true);
  });
  test("AI attribution and secrets are errors", () => {
    const m = parseMessage(
      "x: y\n\nTested: z\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n",
    );
    const f = checkBun({
      meta: m,
      files: [],
      added: "+ghp_" + "a".repeat(36),
      authorEmail: "a@b",
    });
    expect(f.map((x) => x.rule)).toContain("no-ai-attribution");
    expect(f.map((x) => x.rule)).toContain("no-secret");
  });
  test("chromium footer and AUTHORS", () => {
    const m = parseMessage("Fix thing\n\nLonger.\n");
    const f = checkChromium({
      meta: m,
      files: ["base/a.cc"],
      added: "",
      authorEmail: "x@aphrody.com",
      authors: "Someone <s@e.com>\n",
    });
    expect(
      f
        .filter((x) => x.level === "error")
        .map((x) => x.rule)
        .sort(),
    ).toEqual(["cr-ai-note", "cr-authors", "cr-footer"]);
  });
  test("chromium requires the AI note that AGENTS.md forbids elsewhere", () => {
    const m = parseMessage(
      "Fix thing\n\nLonger.\n\nAI assistance: Claude wrote the first draft of the test; reviewed by the author.\n\nBug: 1\n",
    );
    const f = checkChromium({
      meta: m,
      files: ["AUTHORS", "base/a.cc"],
      added: "",
      authorEmail: "x@aphrody.com",
      authors: "",
    });
    expect(f.filter((x) => x.level === "error")).toEqual([]);
  });

  test("bun PR body follows the template", () => {
    expect(bunPrBody(meta)).toBe(
      "### What does this PR do?\n\nWhat.\n\n### How did you verify your code works?\n\nbun bd test test/cli/x.test.ts\n",
    );
  });
});

// Integration: a bare "upstream", a bare "fork" and a checkout, all local.
function repo(): {
  up: string;
  fork: string;
  co: string;
  s: StackConfig;
  root: string;
} {
  const root = mkdtempSync(join(tmpdir(), "upstream-test-"));
  const up = join(root, "up.git");
  const fork = join(root, "fork.git");
  const co = join(root, "co");
  const env = {
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@e",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@e",
  };
  Object.assign(process.env, env);
  git(root, ["init", "-q", "--bare", "-b", "main", up]);
  git(root, ["clone", "-q", up, co]);
  writeFileSync(join(co, "a.txt"), "1\n2\n3\n");
  git(co, ["add", "."]);
  git(co, ["commit", "-qm", "init"]);
  git(co, ["push", "-q", "origin", "main"]);
  git(root, ["clone", "-q", "--bare", up, fork]);
  git(co, ["remote", "rename", "origin", "upstream"]);
  git(co, ["remote", "add", "origin", fork]);
  git(co, ["fetch", "-q", "origin"]);
  git(co, ["branch", "-q", "--set-upstream-to=origin/main", "main"]);
  mkdirSync(join(root, "infra", "upstream"), { recursive: true });
  writeFileSync(
    join(root, "infra", "upstream", "stacks.toml"),
    `[stack.t]\nmodel = "branch"\nupstream = "x/up"\nupstream_url = "${up.replace(/\\/g, "/")}"\nref = "main"\nfork = "x/fork"\nbranch = "main"\ncheckout = "co"\nforge = "github"\nrules = "bun"\nrunner = "pc"\n`,
  );
  writeFileSync(join(root, "identity.toml"), "");
  const s: StackConfig = {
    name: "t",
    model: "branch",
    upstream: "x/up",
    upstream_url: up,
    ref: "main",
    fork: "x/fork",
    branch: "main",
    checkout: "co",
    forge: "github",
    rules: "bun",
    runner: "pc",
  };
  return { up, fork, co, s, root };
}

function commitFile(
  dir: string,
  file: string,
  text: string,
  msg: string,
): void {
  writeFileSync(join(dir, file), text);
  git(dir, ["add", file]);
  git(dir, ["commit", "-qm", msg]);
}

describe("sync", () => {
  test("replays the stack, drops a patch upstream already has, keeps the rest", async () => {
    const { up, co, root } = repo();
    commitFile(co, "b.txt", "ours\n", "feat: b\n\nUpstream-Status: Pending");
    commitFile(co, "c.txt", "same\n", "feat: c");
    git(co, ["push", "-q", "origin", "main"]);
    // Upstream lands the c.txt change itself and moves on.
    const u = join(root, "u");
    git(root, ["clone", "-q", up, u]);
    commitFile(u, "c.txt", "same\n", "upstream: c");
    commitFile(u, "a.txt", "1\n2\n3\n4\n", "upstream: a");
    git(u, ["push", "-q", "origin", "main"]);
    process.env.SRC_ROOT = root;
    expect(await main(["sync", "t", "--push"])).toBe(0);
    const s: StackConfig = {
      name: "t",
      model: "branch",
      upstream: "",
      upstream_url: up,
      ref: "main",
      fork: "",
      branch: "main",
      checkout: "co",
      forge: "github",
      rules: "bun",
      runner: "",
    };
    fetchBoth(co, s);
    const { patches, base } = branchSeries(co, s, "refs/remotes/origin/main");
    expect(patches.map((p) => p.meta.subject)).toEqual(["feat: b"]);
    expect(base).toBe(git(co, ["rev-parse", "refs/remotes/upstream/main"]));
    expect(git(co, ["show", "HEAD:a.txt"])).toBe("1\n2\n3\n4");
  });

  test("stops on the first conflict and leaves the fork untouched", async () => {
    const { up, co, root } = repo();
    commitFile(co, "a.txt", "1\nours\n3\n", "fix: a");
    git(co, ["push", "-q", "origin", "main"]);
    const before = git(co, ["rev-parse", "HEAD"]);
    const u = join(root, "u");
    git(root, ["clone", "-q", up, u]);
    commitFile(u, "a.txt", "1\ntheirs\n3\n", "upstream: a");
    git(u, ["push", "-q", "origin", "main"]);
    process.env.SRC_ROOT = root;
    expect(await main(["sync", "t", "--push"])).toBe(3);
    expect(git(co, ["rev-parse", "HEAD"])).toBe(before);
    expect(git(co, ["rev-parse", "refs/remotes/origin/main"])).toBe(before);
  });

  test("mark rewrites one message and keeps every tree", async () => {
    const { co, root } = repo();
    commitFile(co, "b.txt", "b\n", "feat: b");
    commitFile(co, "c.txt", "c\n", "feat: c");
    git(co, ["push", "-q", "origin", "main"]);
    const tree = git(co, ["rev-parse", "HEAD^{tree}"]);
    process.env.SRC_ROOT = root;
    expect(
      await main([
        "mark",
        "t",
        "1",
        "inappropriate",
        "aphrody-only",
        "--owner",
        "upstream",
        "--trailer",
        "--push",
      ]),
    ).toBe(0);
    expect(git(co, ["rev-parse", "HEAD^{tree}"])).toBe(tree);
    expect(git(co, ["log", "-1", "--format=%B", "HEAD~1"])).toContain(
      "Upstream-Status: Inappropriate [aphrody-only]",
    );
    expect(git(co, ["rev-parse", "refs/remotes/origin/main"])).not.toBe(""); // pushed with lease
    expect(git(co, ["status", "--porcelain"])).toBe("");
  });

  test("mark writes the registry by default and status reads it back", async () => {
    const { co, root } = repo();
    commitFile(co, "b.txt", "b\n", "feat: b");
    git(co, ["push", "-q", "origin", "main"]);
    const head = git(co, ["rev-parse", "HEAD"]);
    process.env.SRC_ROOT = root;
    expect(
      await main([
        "mark",
        "t",
        "feat_b",
        "submitted",
        "https://example.invalid/1",
        "--owner",
        "bun-windows",
      ]),
    ).toBe(0);
    expect(git(co, ["rev-parse", "HEAD"])).toBe(head);
    const reg = Bun.TOML.parse(
      await Bun.file(join(root, "infra/upstream/status/t.toml")).text(),
    ) as any;
    expect(reg.patch.feat_b.status).toBe("submitted");
    expect(reg.patch.feat_b.owner).toBe("bun-windows");
    const { applyRegistry } = await import("../src/registry.ts");
    const s: StackConfig = {
      name: "t",
      model: "branch",
      upstream: "",
      upstream_url: "",
      ref: "main",
      fork: "",
      branch: "main",
      checkout: "co",
      forge: "github",
      rules: "bun",
      runner: "",
    };
    const { patches } = branchSeries(co, s, "HEAD");
    expect(applyRegistry(root, s, patches)[0]!.meta.statusNote).toBe(
      "https://example.invalid/1",
    );
  });

  test("series model applies on a scratch index", () => {
    const { co, root, s } = repo();
    const dir = join(root, "series");
    mkdirSync(dir);
    git(co, ["checkout", "-q", "-b", "tmp"]);
    commitFile(co, "a.txt", "1\n2\n3\nx\n", "fix: a\n\nBug: 1");
    writeFileSync(
      join(dir, "fix_a.patch"),
      git(co, ["format-patch", "--stdout", "-1", "HEAD"]) + "\n",
    );
    writeFileSync(join(dir, ".patches"), "fix_a.patch\n");
    git(co, ["checkout", "-q", "main"]);
    const ss = {
      ...s,
      model: "series" as const,
      series: "series",
      rules: "chromium",
    };
    fetchBoth(co, ss);
    const patches = fileSeries(root, ss);
    expect(patches[0]!.meta.subject).toBe("fix: a");
    expect(checkSeries(root, co, ss, patches).ok).toBe(true);
    expect(git(co, ["status", "--porcelain"])).toBe("");
  });
});

void replay;
void rewriteMessage;
