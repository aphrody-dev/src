import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { bearerOk, verifyAccess } from "../src/access.ts";
import {
  firstPath,
  inline,
  isTodo,
  parseAlphabet,
  section,
} from "../src/alphabet.ts";
import { parseHeaders } from "../src/serve.ts";
import {
  parsePreviewHost,
  previewUrl,
  rollbackTarget,
  type Registry,
} from "../src/state.ts";
import {
  affected,
  cacheKey,
  changedFiles,
  loadProjects,
  manifest,
  overBudget,
} from "../src/registry.ts";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import worker, { type Env } from "../src/worker.ts";

class FakeR2 {
  m = new Map<string, { body: Uint8Array; type?: string }>();
  async get(key: string) {
    const v = this.m.get(key);
    if (!v) return null;
    const text = new TextDecoder().decode(v.body);
    return {
      body: v.body,
      size: v.body.length,
      httpEtag: `"${key.length}"`,
      text: async () => text,
      json: async () => JSON.parse(text),
      writeHttpMetadata: (h: Headers) =>
        v.type && h.set("content-type", v.type),
    };
  }
  async put(key: string, value: any, opts?: any) {
    const body =
      typeof value === "string"
        ? new TextEncoder().encode(value)
        : new Uint8Array(await new Response(value).arrayBuffer());
    this.m.set(key, { body, type: opts?.httpMetadata?.contentType });
  }
}

const SHA_A = "a".repeat(40);
const SHA_B = "b".repeat(40);
const TOKEN = "t0ken-for-tests";
const reg: Registry = {
  generatedAt: "2026-11-13T00:00:00Z",
  commit: SHA_B,
  projects: [
    {
      name: "site",
      path: "apps/site",
      build: "bun run build",
      out: "dist",
      domains: ["site.aphrody.app"],
      watch: ["apps/site/**"],
      env: [],
      exclude: [],
      production: "auto",
    },
  ],
  inventory: [],
  labs: [],
  css: "",
  mark: "<svg></svg>",
};

function env(): Env {
  return {
    BUCKET: new FakeR2(),
    DEPLOY_TOKEN: TOKEN,
    ACCESS_TEAM: "team.cloudflareaccess.com",
    ACCESS_AUD: "aud",
  };
}
const auth = {
  authorization: `Bearer ${TOKEN}`,
  "content-type": "application/json",
};
const call = (
  e: Env,
  method: string,
  path: string,
  body?: unknown,
  headers: Record<string, string> = auth,
) =>
  worker.fetch(
    new Request(`https://aphrody.app${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : typeof body === "string"
            ? body
            : JSON.stringify(body),
    }),
    e,
  );

async function deploy(e: Env, sha: string, html: string) {
  expect(
    (
      await call(e, "POST", "/api/projects/site/deployments", {
        sha,
        message: `m ${sha[0]}`,
      })
    ).status,
  ).toBe(201);
  expect(
    (
      await call(
        e,
        "PUT",
        `/api/projects/site/deployments/${sha}/files/index.html`,
        html,
        { authorization: auth.authorization, "content-type": "text/html" },
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await call(
        e,
        "PUT",
        `/api/projects/site/deployments/${sha}/files/_headers`,
        "/*\n  X-Test: 1\n",
        { authorization: auth.authorization },
      )
    ).status,
  ).toBe(200);
  expect(
    (
      await call(e, "POST", `/api/projects/site/deployments/${sha}/finalize`, {
        state: "ready",
        files: 2,
        bytes: 10,
        log: "ok",
      })
    ).status,
  ).toBe(200);
}

describe("state", () => {
  test("preview hosts", () => {
    expect(parsePreviewHost("aphrody-1a2b3c4.aphrody.app")).toEqual({
      project: "aphrody",
      short: "1a2b3c4",
    });
    expect(parsePreviewHost("aphrody-app-1a2b3c4.aphrody.app")).toEqual({
      project: "aphrody-app",
      short: "1a2b3c4",
    });
    expect(parsePreviewHost("api.aphrody.app")).toBeNull();
    expect(parsePreviewHost("app-cad.aphrody.app")).toBeNull();
    expect(parsePreviewHost("x-1a2b3c4.aphrody.com")).toBeNull();
    expect(previewUrl("yolo", SHA_A)).toBe("https://yolo-aaaaaaa.aphrody.app");
  });
  test("rollback target is the previous production", () => {
    expect(
      rollbackTarget({
        production: "b",
        history: [
          { sha: "a", at: "", action: "promote", by: "" },
          { sha: "b", at: "", action: "promote", by: "" },
        ],
        deployments: [],
      }),
    ).toBe("a");
    expect(
      rollbackTarget({
        production: "a",
        history: [{ sha: "a", at: "", action: "promote", by: "" }],
        deployments: [],
      }),
    ).toBeUndefined();
  });
  test("_headers parser", () => {
    const r = parseHeaders("/*\n  A: 1\n/x\n  B: 2\n");
    expect(r.length).toBe(2);
    expect(r[0]!.re.test("/anything")).toBe(true);
    expect(r[1]!.re.test("/x")).toBe(true);
    expect(r[1]!.re.test("/xy")).toBe(false);
  });
});

describe("platform worker", () => {
  test("deploy, preview, production, rollback", async () => {
    const e = env();
    await e.BUCKET.put("deploys/_registry.json", JSON.stringify(reg));
    await deploy(e, SHA_A, "<p>A</p>");
    const prev = await worker.fetch(
      new Request("https://site-aaaaaaa.aphrody.app/"),
      e,
    );
    expect(prev.status).toBe(200);
    expect(await prev.text()).toBe("<p>A</p>");
    expect(prev.headers.get("x-test")).toBe("1");
    expect(prev.headers.get("x-aphrody-deploy")).toBe(
      `site@${SHA_A.slice(0, 12)}`,
    );
    expect(
      (await call(e, "POST", "/api/projects/site/promote", { sha: SHA_A }))
        .status,
    ).toBe(200);
    await deploy(e, SHA_B, "<p>B</p>");
    expect(
      (await call(e, "POST", "/api/projects/site/promote", { sha: SHA_B }))
        .status,
    ).toBe(200);
    expect(
      await (
        await worker.fetch(new Request("https://site.aphrody.app/"), e)
      ).text(),
    ).toBe("<p>B</p>");
    const rb = await (
      await call(e, "POST", "/api/projects/site/rollback", {})
    ).json();
    expect(rb).toMatchObject({ ok: true, sha: SHA_A, previous: SHA_B });
    expect(
      await (
        await worker.fetch(new Request("https://site.aphrody.app/"), e)
      ).text(),
    ).toBe("<p>A</p>");
    const list = await (
      await call(e, "GET", "/api/projects/site/deployments")
    ).json();
    expect(list.production).toBe(SHA_A);
    expect(list.deployments.map((d: { sha: string }) => d.sha)).toEqual([
      SHA_B,
      SHA_A,
    ]);
    expect(list.history.map((h: { action: string }) => h.action)).toEqual([
      "promote",
      "promote",
      "rollback",
    ]);
    expect(
      (await worker.fetch(new Request("https://site-ccccccc.aphrody.app/"), e))
        .status,
    ).toBe(404);
  });
  test("writes, logs and dashboard need a credential", async () => {
    const e = env();
    await e.BUCKET.put("deploys/_registry.json", JSON.stringify(reg));
    expect(
      (
        await call(
          e,
          "POST",
          "/api/projects/site/deployments",
          { sha: SHA_A },
          {},
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await call(
          e,
          "POST",
          "/api/projects/site/deployments",
          { sha: SHA_A },
          { authorization: "Bearer nope" },
        )
      ).status,
    ).toBe(401);
    expect((await call(e, "PUT", "/api/registry", reg, {})).status).toBe(401);
    expect(
      (
        await call(
          e,
          "GET",
          `/api/projects/site/deployments/${SHA_A}/log`,
          undefined,
          {},
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await call(e, "GET", "/dashboard", undefined, {
          "cf-access-jwt-assertion": "x.y.z",
        })
      ).status,
    ).toBe(401);
    expect((await call(e, "GET", "/dashboard", undefined, auth)).status).toBe(
      200,
    );
    expect((await call(e, "GET", "/", undefined, {})).status).toBe(200);
    expect((await call(e, "GET", "/labs", undefined, {})).status).toBe(200);
    expect(
      (await worker.fetch(new Request("https://artcraft.aphrody.app/"), e))
        .status,
    ).toBe(200);
    expect(
      (await worker.fetch(new Request("https://play.aphrody.app/"), e)).status,
    ).toBe(302);
  });
  test("deploy token comparison", () => {
    expect(bearerOk(`Bearer ${TOKEN}`, TOKEN)).toBe(true);
    expect(bearerOk(`Bearer ${TOKEN}x`, TOKEN)).toBe(false);
    expect(bearerOk(`Bearer ${TOKEN}`, undefined)).toBe(false);
    expect(bearerOk(null, TOKEN)).toBe(false);
  });
  test("access token is refused without a valid signature", async () => {
    const fake = (async () =>
      Response.json({ keys: [] })) as unknown as typeof fetch;
    const tok = [
      btoa(JSON.stringify({ alg: "RS256", kid: "k" })),
      btoa(JSON.stringify({ aud: "aud", exp: 9e9 })),
      "c2ln",
    ].join(".");
    expect(
      await verifyAccess(tok, "team.cloudflareaccess.com", "aud", fake),
    ).toBeNull();
    expect(
      await verifyAccess(tok, "team.cloudflareaccess.com", undefined, fake),
    ).toBeNull();
  });
});

describe("sources", () => {
  const root = join(import.meta.dir, "..", "..", "..");
  test("ALPHABET.md has the core and bets tables", () => {
    const a = parseAlphabet(
      readFileSync(join(root, "docs", "ALPHABET.md"), "utf8"),
    );
    expect(section(a, "Noyau")?.table?.rows.length).toBeGreaterThan(3);
    expect(section(a, "Paris")?.table?.rows.length).toBeGreaterThan(3);
    expect(isTodo(section(a, "Lettre"))).toBe(true);
    expect(
      firstPath(
        "`docs/unixwin`, `apps/unixwin`, `third_party/{niubash,rubash}`",
      ),
    ).toBe("docs/unixwin");
    expect(inline("`a` <b> [x](https://e.com)")).toBe(
      '<code>a</code> &lt;b&gt; <a href="https://e.com">x</a>',
    );
  });
  test("projects.toml is valid and change detection matches", () => {
    const p = loadProjects(root);
    expect(p.map((x) => x.name)).toContain("aphrody");
    expect(
      affected(p, ["apps/aphrody/public/robots.txt"]).map((x) => x.name),
    ).toEqual(["aphrody"]);
    expect(affected(p, ["docs/ALPHABET.md"]).map((x) => x.name)).toEqual([
      "aphrody",
    ]);
    expect(affected(p, ["README.md"])).toEqual([]);
  });
});

describe("build cache and observe", () => {
  const root = mkdtempSync(join(tmpdir(), "deploy-cache-"));
  mkdirSync(join(root, "app", "dist", "a"), { recursive: true });
  writeFileSync(join(root, "bun.lock"), "lock1");
  writeFileSync(join(root, "app", "index.ts"), "x");
  writeFileSync(join(root, "app", "dist", "index.html"), "<p>1</p>");
  writeFileSync(join(root, "app", "dist", "a", "b.js"), "b");
  writeFileSync(join(root, "app", "dist", "a", "b.js.gz"), "gz");
  const p = loadProjects(join(import.meta.dir, "..", "..", ".."))[0]!;
  const proj = {
    ...p,
    watch: ["app/**"],
    build: "bun run build",
    budgets: undefined,
  };
  const tracked = ["app/index.ts", "bun.lock", "other.md"];
  test("cache key is stable and covers watch files, bun.lock and command", () => {
    const k1 = cacheKey(proj, root, tracked);
    expect(cacheKey(proj, root, tracked)).toBe(k1);
    expect(cacheKey({ ...proj, build: "bun x" }, root, tracked)).not.toBe(k1);
    writeFileSync(join(root, "bun.lock"), "lock2");
    const k2 = cacheKey(proj, root, tracked);
    expect(k2).not.toBe(k1);
    writeFileSync(join(root, "app", "index.ts"), "y");
    expect(cacheKey(proj, root, tracked)).not.toBe(k2);
    writeFileSync(join(root, "other.md"), "z");
    expect(cacheKey(proj, root, tracked)).toBe(cacheKey(proj, root, tracked));
  });
  test("manifest hashes outputs, applies excludes, diff keeps only changes", () => {
    const m = manifest(join(root, "app", "dist"), ["**/*.gz"]);
    expect(Object.keys(m)).toEqual(["a/b.js", "index.html"]);
    expect(changedFiles(m, m)).toEqual([]);
    expect(changedFiles(undefined, m)).toEqual(["a/b.js", "index.html"]);
    writeFileSync(join(root, "app", "dist", "index.html"), "<p>2</p>");
    expect(
      changedFiles(m, manifest(join(root, "app", "dist"), ["**/*.gz"])),
    ).toEqual(["index.html"]);
    rmSync(root, { recursive: true, force: true });
  });
  test("budgets: over p75 fails, missing samples do not", () => {
    const b = { ...proj, budgets: { LCP: 2500, INP: 200, CLS: 0.1 } };
    expect(
      overBudget(b, { LCP: { p75: 3000, n: 4 }, CLS: { p75: 0.05, n: 4 } }),
    ).toEqual(["LCP p75 3000 > budget 2500 (n 4)"]);
    expect(overBudget(b, { INP: { p75: 900, n: 0 } })).toEqual([]);
    expect(overBudget(proj, { LCP: { p75: 9e9, n: 1 } })).toEqual([]);
  });
  test("projects.toml: design tokens watched, budgets and protect parsed", () => {
    const all = loadProjects(join(import.meta.dir, "..", "..", ".."));
    const x = all.find((y) => y.name === "aphrody")!;
    expect(x.watch).toContain("packages/design/**");
    expect(x.budgets?.LCP).toBe(2500);
    expect(x.protect).toBe(false);
  });
});
