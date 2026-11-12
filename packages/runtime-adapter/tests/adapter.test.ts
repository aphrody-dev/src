import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cloudflare, resolveCtx, vercel } from "../src/index";
import { fsStorage, bunSQL } from "../src/bun";
import app, { parseRange } from "../../../apps/r2-site/src/app";

const dir = mkdtempSync(join(tmpdir(), "ra-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("fs storage: put/get/range and no path traversal", async () => {
  const s = fsStorage(dir);
  await s.put("site/a.txt", "0123456789");
  const full = await s.get("site/a.txt");
  expect(full?.size).toBe(10);
  const part = await s.get("site/a.txt", { range: { offset: 2, length: 3 } });
  expect(await new Response(part!.body).text()).toBe("234");
  expect(part!.range).toEqual({ offset: 2, length: 3 });
  expect(await s.get("../../etc/passwd")).toBeNull();
});

test("sqlite via Bun.SQL with ? placeholders", async () => {
  const db = bunSQL("sqlite://:memory:");
  await db.run("create table t (a int)");
  await db.run("insert into t values (?)", [7]);
  expect(await db.all("select a from t where a = ?", [7])).toEqual([{ a: 7 }]);
});

test("r2-site on vps ctx: index, 206, 404, health", async () => {
  process.env.STORAGE = `fs:${dir}`;
  process.env.PREFIX = "site";
  await fsStorage(dir).put("site/index.html", "<h1>hi</h1>");
  const ctx = await resolveCtx("vps", {}, () => {});
  const r = await app.fetch(new Request("http://x/"), ctx);
  expect(r.status).toBe(200);
  expect(await r.text()).toBe("<h1>hi</h1>");
  const p = await app.fetch(new Request("http://x/a.txt", { headers: { range: "bytes=0-3" } }), ctx);
  expect(p.status).toBe(206);
  expect(p.headers.get("content-range")).toBe("bytes 0-3/10");
  expect((await app.fetch(new Request("http://x/nope.bin"), ctx)).status).toBe(404);
  expect(((await (await app.fetch(new Request("http://x/health"), ctx)).json()) as { target: string }).target).toBe("vps");
  expect(parseRange("bytes=5-")).toEqual({ offset: 5 });
});

test("cloudflare wrapper: R2 binding + scheduled cron mapping", async () => {
  let ran = "";
  const store = new Map<string, string>([["k", "v"]]);
  const BUCKET = {
    get: async (k: string) => (store.has(k) ? { body: new Response(store.get(k)).body, size: 1, httpEtag: '"e"' } : null),
    put: async () => {},
    delete: async () => {},
  };
  const w = cloudflare({
    name: "t",
    fetch: async (_r, ctx) => new Response(await new Response((await ctx.storage!.get("k"))!.body).text()),
    crons: { nightly: () => void (ran = "nightly") },
  });
  const env = { STORAGE: "r2:BUCKET", BUCKET, CRONS: "0 3 * * *=nightly" };
  const c = { waitUntil() {} };
  expect(await (await w.fetch(new Request("http://x/"), env, c)).text()).toBe("v");
  await w.scheduled({ cron: "0 3 * * *" }, env, c);
  expect(ran).toBe("nightly");
});

test("vercel wrapper: /__cron requires CRON_SECRET", async () => {
  delete process.env.STORAGE;
  process.env.CRON_SECRET = "s";
  let ran = false;
  const v = vercel({ name: "t", fetch: () => new Response("ok"), crons: { job: () => void (ran = true) } });
  expect((await v.fetch(new Request("http://x/__cron/job"))).status).toBe(403);
  const ok = await v.fetch(new Request("http://x/__cron/job", { headers: { authorization: "Bearer s" } }));
  expect(ok.status).toBe(200);
  expect(ran).toBe(true);
});
