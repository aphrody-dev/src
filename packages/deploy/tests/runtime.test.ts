import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import {
  CLIENT,
  Insights,
  rating,
  runtime,
  type DONamespace,
} from "../src/runtime.ts";
import worker, { type Env } from "../src/worker.ts";

// SQLite storage of a Durable Object, on bun:sqlite.
const sqlOf = (db: Database) => ({
  exec: (q: string, ...b: any[]) => {
    const st = db.query(q);
    const rows = /^\s*(SELECT|WITH)/i.test(q)
      ? st.all(...b)
      : (st.run(...b), []);
    return { toArray: () => rows };
  },
});
function ns(): DONamespace {
  const one = new Insights({
    storage: { sql: sqlOf(new Database(":memory:")) },
  });
  return { idFromName: (n) => n, get: () => one };
}
function bucket() {
  const m = new Map<string, string>();
  return {
    m,
    get: async (k: string) =>
      m.has(k)
        ? {
            json: async () => JSON.parse(m.get(k)!),
            text: async () => m.get(k)!,
            body: m.get(k),
          }
        : null,
    put: async (k: string, v: any) =>
      void m.set(k, typeof v === "string" ? v : String(v)),
  };
}
const UA = { "user-agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/157" };

describe("runtime", () => {
  test("client script parses and posts to the same origin", () => {
    expect(() => new Function(CLIENT)).not.toThrow();
    expect(CLIENT).toContain('"/_aphrody/v"');
  });

  test("page views and vitals aggregate into a summary", async () => {
    const env = { BUCKET: bucket() as any, INSIGHTS: ns() };
    const post = (b: unknown) =>
      runtime(
        new Request("https://yolo-abc1234.aphrody.app/_aphrody/v", {
          method: "POST",
          body: JSON.stringify(b),
          headers: UA,
        }),
        env,
        "yolo",
        "a".repeat(40),
      );
    for (let i = 0; i < 4; i++)
      expect(
        (await post({ k: "pv", p: "/", r: "https://www.google.com/x" }))!
          .status,
      ).toBe(204);
    for (const v of [1000, 2000, 3000, 4000])
      await post({ k: "v", p: "/", m: { LCP: v, CLS: 0.01, bogus: 3 } });
    await post({ k: "v", p: "/", m: { LCP: -5 } });
    const r = await env.INSIGHTS.get(0).fetch(
      new Request("https://insights/summary?days=7"),
    );
    const s = (await r.json()) as any;
    expect(s.views).toBe(4);
    expect(s.referrers[0]).toEqual({ key: "www.google.com", n: 4 });
    expect(s.vitals.LCP).toEqual({ p75: 4000, n: 4 });
    expect(s.vitals.bogus).toBeUndefined();
  });

  test("bots are not counted", async () => {
    const env = { BUCKET: bucket() as any, INSIGHTS: ns() };
    await runtime(
      new Request("https://x/_aphrody/v", {
        method: "POST",
        body: '{"k":"pv","p":"/"}',
        headers: { "user-agent": "Chrome-Lighthouse" },
      }),
      env,
      "yolo",
      "a".repeat(40),
    );
    const s = (await (
      await env.INSIGHTS.get(0).fetch(new Request("https://insights/summary"))
    ).json()) as any;
    expect(s.views).toBe(0);
  });

  test("image requests are validated", async () => {
    const env = { BUCKET: bucket() as any };
    for (const q of [
      "url=//evil.com/a.png&w=640",
      "url=/a.png&w=641",
      "url=/../a.png&w=640",
      "url=/a.txt&w=640",
    ])
      expect(
        (await runtime(
          new Request(`https://x/_aphrody/image?${q}`),
          env,
          "yolo",
          "a".repeat(40),
        ))!.status,
      ).toBe(400);
  });

  test("other paths are left to the deployment", async () => {
    expect(
      await runtime(
        new Request("https://x/index.html"),
        { BUCKET: bucket() as any },
        "y",
        "",
      ),
    ).toBeNull();
  });

  test("edge config is written by the API and read by deployments", async () => {
    const b = bucket();
    const env = { BUCKET: b, DEPLOY_TOKEN: "t" } as unknown as Env;
    // Through the API, which also drops the isolate cache of the registry.
    await worker.fetch(
      new Request("https://aphrody.app/api/registry", {
        method: "PUT",
        headers: { authorization: "Bearer t" },
        body: JSON.stringify({
          projects: [
            {
              name: "yolo",
              domains: ["yolo.aphrody.app"],
              path: "apps/yolo",
              env: [],
            },
          ],
          inventory: [],
          labs: [],
          css: "",
          mark: "",
        }),
      }),
      env,
    );
    const put = (body: string) =>
      worker.fetch(
        new Request("https://aphrody.app/api/projects/yolo/config", {
          method: "PUT",
          body,
          headers: { authorization: "Bearer t" },
        }),
        env,
      );
    expect((await put("[1]")).status).toBe(400);
    expect((await put('{"banner":"hello","flags":{"beta":true}}')).status).toBe(
      200,
    );
    const r = await runtime(
      new Request("https://yolo.aphrody.app/_aphrody/config/flags"),
      env as any,
      "yolo",
      "",
    );
    expect(await r!.json()).toEqual({ beta: true });
    const unauth = await worker.fetch(
      new Request("https://aphrody.app/api/projects/yolo/config", {
        method: "PUT",
        body: "{}",
      }),
      env,
    );
    expect(unauth.status).toBe(401);
  });

  test("ratings follow web.dev thresholds", () => {
    expect(rating("LCP", 2500)).toBe("good");
    expect(rating("INP", 300)).toBe("ni");
    expect(rating("CLS", 0.3)).toBe("poor");
  });
});
