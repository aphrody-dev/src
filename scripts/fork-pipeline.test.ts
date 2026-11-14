import { expect, test } from "bun:test";
import { bumpPins, decide, issueTitle, parseManifest, renderStatus, shardOf } from "./fork-pipeline";

const eco = `
[sync.nextjs]
repo = "aphrody-labs/next.js"
upstream = "vercel/next.js"
branch = "canary"
kind = "patched"
verify = ["bun install"]
consumers = [{ repo = "aphrody-labs/src", gate = "bun scripts/checkdeps.ts" }]
[sync.bevy]
repo = "aphrody-labs/bevy"
upstream = "bevyengine/bevy"
`;
const forks = "# c\nvercel/next.js TypeScript\nbevyengine/bevy Rust\noven-sh/bun Rust\naphrody-labs/llvm-project\n";

test("manifest: explicit tables win, forks.txt adds implicit mirrors, aphrody-labs owner skipped", () => {
  const m = parseManifest(eco, forks);
  expect(m.map((f) => f.name)).toEqual(["nextjs", "bevy", "bun"]);
  expect(m[0]).toMatchObject({ kind: "patched", branch: "canary", verify: ["bun install"], explicit: true });
  expect(m[0].consumers[0].repo).toBe("aphrody-labs/src");
  expect(m[1].kind).toBe("mirror");
  expect(m[2]).toMatchObject({ repo: "aphrody-labs/bun", upstream: "oven-sh/bun", explicit: false });
});

test("manifest rejects a malformed repo", () => {
  expect(() => parseManifest(`[sync.x]\nrepo = "nope"\nupstream = "a/b"`, "")).toThrow();
});

test("decide", () => {
  const b = { upSha: "u1", behind: 3, ahead: 0, openPr: false };
  expect(decide({ ...b, kind: "mirror" })).toBe("ff");
  expect(decide({ ...b, kind: "mirror", ahead: 2 })).toBe("diverged");
  expect(decide({ ...b, kind: "mirror", behind: 0 })).toBe("noop");
  expect(decide({ ...b, kind: "patched", ahead: 25 })).toBe("sync");
  expect(decide({ ...b, kind: "patched", openPr: true })).toBe("wait");
  expect(decide({ ...b, kind: "patched", handled: "u1" })).toBe("noop");
});

const sha = "a".repeat(40);
test("bumpPins: Cargo rev only on the fork line", () => {
  const t = `a = { git = "https://github.com/aphrody-labs/aphrody", rev = "${"1".repeat(40)}" }\nb = { git = "https://github.com/aphrody-labs/other", rev = "${"2".repeat(40)}" }`;
  const n = bumpPins("crates/x/Cargo.toml", t, "aphrody", sha);
  expect(n).toContain(`aphrody", rev = "${sha}"`);
  expect(n).toContain("2".repeat(40));
});
test("bumpPins: package.json, src.lock.json, ECOSYSTEM.toml", () => {
  expect(bumpPins("package.json", `"x": "github:aphrody-labs/bun#abcdef1"`, "bun", sha)).toBe(`"x": "github:aphrody-labs/bun#${sha}"`);
  const lock = `{\n "third_party/bun": {\n  "url": "https://github.com/aphrody-labs/bun.git",\n  "commit": "${"1".repeat(40)}",\n  "branch": "main"\n },\n "third_party/z": {\n  "commit": "${"3".repeat(40)}"\n }\n}\n`;
  const n = bumpPins("src.lock.json", lock, "bun", sha);
  expect(n).toContain(`"commit": "${sha}"`);
  expect(n).toContain("3".repeat(40));
  const eco2 = `[entry.a]\nurl = "https://github.com/aphrody-labs/next.js.git"\nsha = "${"1".repeat(40)}"\n[entry.b]\nsha = "${"4".repeat(40)}"\n`;
  const e = bumpPins("third_party/ECOSYSTEM.toml", eco2, "next.js", sha);
  expect(e).toContain(`sha = "${sha}"`);
  expect(e).toContain("4".repeat(40));
  expect(bumpPins("other.txt", "x", "bun", sha)).toBe("x");
});

test("issue title, shard and status", () => {
  expect(issueTitle("nextjs", "conflict")).toBe("[sync] nextjs: conflict");
  const s = [shardOf("a/b", 2), shardOf("c/d", 2)];
  expect(s.every((x) => x === 0 || x === 1)).toBe(true);
  expect(shardOf("a/b", 2)).toBe(shardOf("a/b", 2));
  const f = parseManifest(eco, "");
  const md = renderStatus(f, { forks: { nextjs: { upSha: sha, forkSha: sha, behind: 0, ahead: 6, action: "noop" } } }, ["gh"]);
  expect(md).toContain("| aphrody-labs/next.js | patched | " + sha.slice(0, 12));
});
