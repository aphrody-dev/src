import { describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bundle } from "../src/bundle.ts";
import { fetchAsset, parseManifest, sha256 } from "../src/manifest.ts";
import { makersFor, missingTools, optimize } from "../src/optimize.ts";
import {
  allowed,
  checkTargets,
  parseTargets,
  publish,
} from "../src/publish.ts";
import { pool } from "../src/util.ts";

const tmp = () => mkdtempSync(join(tmpdir(), "assets-"));

describe("pack manifest", () => {
  test("expands compact files and keeps ids unique", () => {
    const a = parseManifest(`
[[pack]]
id_base = "p"
kind = "texture"
path_base = "remote/t/"
url_base = "https://x.org/"
license = "CC0-1.0"
author = "a"
attribution = "a, CC0-1.0"
files = ["d/one.jpg|${"a".repeat(64)}", "d/two.jpg|${"b".repeat(64)}|https://y.org/two.jpg"]
`);
    expect(a.map((x) => [x.id, x.path, x.url, x.storage])).toEqual([
      [
        "p/d/one.jpg",
        "remote/t/d/one.jpg",
        "https://x.org/d/one.jpg",
        "remote",
      ],
      ["p/d/two.jpg", "remote/t/d/two.jpg", "https://y.org/two.jpg", "remote"],
    ]);
  });
});

describe("pool", () => {
  test("bounded concurrency, ordered results", async () => {
    let live = 0;
    let peak = 0;
    const r = await pool([1, 2, 3, 4, 5, 6], 2, async (n) => {
      peak = Math.max(peak, ++live);
      await Bun.sleep(5);
      live--;
      return n * 2;
    });
    expect(r).toEqual([2, 4, 6, 8, 10, 12]);
    expect(peak).toBeLessThanOrEqual(2);
  });
});

describe("fetch", () => {
  test("resumes a partial download with Range and verifies sha256", async () => {
    const body = new Uint8Array(200_000).map((_, i) => i % 251);
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        const r = req.headers.get("range");
        if (r) {
          const from = Number(/bytes=(\d+)-/.exec(r)![1]);
          return new Response(body.slice(from), { status: 206 });
        }
        return new Response(body);
      },
    });
    const root = tmp();
    process.env.ASSETS_STORE = join(root, "store");
    const a = {
      id: "x",
      kind: "k",
      path: "remote/f.bin",
      url: `http://localhost:${server.port}/f`,
      license: "CC0-1.0",
      sha256: await sha256(body),
      author: "a",
      attribution: "a",
      storage: "remote" as const,
    };
    mkdirSync(join(root, "store", "remote"), { recursive: true });
    writeFileSync(
      join(root, "store", "remote", "f.bin.part"),
      body.slice(0, 70_000),
    );
    expect(await fetchAsset(root, a)).toBe("ok");
    expect(
      await sha256(
        new Uint8Array(readFileSync(join(root, "store", "remote", "f.bin"))),
      ),
    ).toBe(a.sha256);
    expect(await fetchAsset(root, a)).toBe("cached");
    delete process.env.ASSETS_STORE;
    server.stop(true);
  });
});

describe("optimize and bundle", () => {
  test("missing external optimizer is named, in-process ones need none", () => {
    expect(missingTools(["svg", "woff2"])).toEqual([]);
    expect(missingTools(["webp"]).every((t) => t === "cwebp")).toBe(true);
  });
  test("woff2 is built in-process and deterministic", async () => {
    const root = tmp();
    const ttf = Bun.file("C:/Windows/Fonts/arial.ttf");
    if (!(await ttf.exists())) return;
    const src = join(root, "f.ttf");
    writeFileSync(src, new Uint8Array(await ttf.arrayBuffer()));
    const m = makersFor(".ttf", "font")[0]!;
    const a = await m.make(src, join(root, "t"));
    const b = await m.make(src, join(root, "t"));
    expect(a.ext).toBe("woff2");
    expect(Bun.hash(a.bytes)).toBe(Bun.hash(b.bytes));
    expect(a.bytes.length).toBeLessThan(ttf.size);
  });
  test("recipes per type", () => {
    expect(makersFor(".png", "texture").map((m) => m.name)).toEqual([
      "webp",
      "avif",
      "ktx2",
    ]);
    expect(makersFor(".png", "icon").map((m) => m.name)).toEqual([
      "webp",
      "avif",
    ]);
    expect(makersFor(".glb", "model").map((m) => m.name)).toEqual(["glb"]);
    expect(makersFor(".txt", "x")).toEqual([]);
  });
  test("deterministic, cached by input hash, hashed immutable layout", async () => {
    const root = tmp();
    const lib = join(root, "assets", "library", "icons");
    mkdirSync(lib, { recursive: true });
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg">\n  <!-- x -->\n  <circle r="4"/>\n</svg>\n';
    writeFileSync(join(lib, "a.svg"), svg);
    const a = {
      id: "icon/a",
      kind: "icon",
      path: "icons/a.svg",
      url: "https://x.org/a.svg",
      license: "MIT",
      sha256: await sha256(new TextEncoder().encode(svg)),
      author: "a",
      attribution: "a, MIT",
      storage: "git" as const,
    };
    const r1 = await optimize(root, [a]);
    const r2 = await optimize(root, [a]);
    expect(r1.built).toBe(1);
    expect(r2.cached).toBe(1);
    expect(r2.records[0]!.out).toBe(r1.records[0]!.out);
    expect(r1.records[0]!.out).toMatch(/^icon\/a\.[0-9a-f]{10}\.svg$/);
    const dir = join(root, "assets", "dist", "optimized");
    const m1 = bundle(root, {
      records: r1.records,
      optDir: dir,
      out: join(root, "b1"),
    });
    const m2 = bundle(root, {
      records: r1.records,
      optDir: dir,
      out: join(root, "b2"),
    });
    expect(JSON.stringify(m1)).toBe(JSON.stringify(m2));
    const e = m1.entries["icon/a.svg"]!;
    expect(e.path).toMatch(/^_assets\/icon\/a\.[0-9a-f]{10}\.svg$/);
    expect(e.integrity).toMatch(/^sha384-/);
    expect(readFileSync(join(root, "b1", "_headers"), "utf8")).toContain(
      "immutable",
    );
    expect(existsSync(join(root, "b1", e.path))).toBe(true);
  });
});

describe("publish", () => {
  const toml = `
[target.local]
type = "dir"
dir = "out"
[target.r2]
type = "rclone"
remote = "r2:b"
public_url = "https://cdn.example"
[target.s3]
type = "s3"
bucket = "b"
[target.s3.env]
token = "not a variable name"
`;
  test("target validation rejects secret-looking env values", () => {
    expect(checkTargets(parseTargets(toml))).toEqual([
      "s3: env.token must be a variable name, not a value",
    ]);
  });
  test("external target is held without owner rule, local dir publishes", async () => {
    const root = tmp();
    const b = join(root, "bundle");
    mkdirSync(join(b, "_assets"), { recursive: true });
    writeFileSync(join(b, "_assets", "f.0123456789.txt"), "hi");
    writeFileSync(join(b, "assets-manifest.json"), "{}");
    const man = { version: 1 as const, prefix: "_assets", entries: {} };
    const ts = parseTargets(toml);
    const held = await publish(
      root,
      b,
      man,
      ts.find((t) => t.name === "r2")!,
      { run: "t" },
    );
    expect(held.state).toBe("held");
    expect(
      existsSync(
        join(root, "var", "agents", "outbox", "t", "assets.publish.r2.json"),
      ),
    ).toBe(true);
    const ok = await publish(
      root,
      b,
      man,
      ts.find((t) => t.name === "local")!,
    );
    expect(ok.state).toBe("published");
    expect(readdirSync(join(root, "out"))).toContain("assets-manifest.json");
    mkdirSync(join(root, ".agents"), { recursive: true });
    writeFileSync(
      join(root, ".agents", "owner-rules.json"),
      JSON.stringify({
        rules: [{ effect: "external", step: "assets\\.publish\\.r2" }],
      }),
    );
    expect(allowed(root, "assets.publish.r2", "ay assets publish r2")).toBe(
      true,
    );
    expect(allowed(root, "assets.publish.s3", "x")).toBe(false);
  });
});
