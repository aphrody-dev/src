/**
 * One app entrypoint, three hosts. Backends come from env only (filled by
 * scripts/deploy-target.ts from infra/deploy.toml [hosting.<app>]), never hardcoded:
 *   STORAGE = r2:<binding> | s3 (S3_BUCKET, S3_ENDPOINT, S3_REGION) | fs:<dir>
 *   KV      = cf:<binding> | redis (REDIS_URL)
 *   SQL     = d1:<binding> | url (DATABASE_URL: postgres://… or sqlite://…)
 * Cron: CF scheduled() maps the expression with CRONS="<expr>=<name>;…";
 * VPS systemd timer runs `bun <entry> --cron <name>`; Vercel Cron calls
 * GET /__cron/<name> with `Authorization: Bearer $CRON_SECRET`.
 */
import { cfKV, d1SQL, r2Storage } from "./cf";
import { detectTarget, makeEnv } from "./env";
import type { AppDef, Ctx, KV, SQL, Storage, Target } from "./types";

export type * from "./types";
export { detectTarget, makeEnv };

type Bindings = Record<string, unknown>;

export async function resolveCtx(target: Target, b: Bindings, waitUntil: Ctx["waitUntil"]): Promise<Ctx> {
  const env = makeEnv(b);
  const pick = (v?: string) => {
    const [kind = "", ...rest] = (v ?? "").split(":");
    return [kind, rest.join(":")] as const;
  };
  let storage: Storage | null = null;
  let kv: KV | null = null;
  let sql: SQL | null = null;
  const [sk, sa] = pick(env.get("STORAGE"));
  const [kk, ka] = pick(env.get("KV"));
  const [qk, qa] = pick(env.get("SQL"));
  if (sk === "r2") storage = r2Storage(b[sa || "BUCKET"] as never);
  if (kk === "cf") kv = cfKV(b[ka || "KV"] as never);
  if (qk === "d1") sql = d1SQL(b[qa || "DB"] as never);
  if (sk === "s3" || sk === "fs" || kk === "redis" || qk === "url") {
    const m = await import("./bun");
    if (sk === "s3")
      storage = m.s3Storage({ bucket: env.require("S3_BUCKET"), endpoint: env.get("S3_ENDPOINT"), region: env.get("S3_REGION") });
    if (sk === "fs") storage = m.fsStorage(sa || env.require("STORAGE_DIR"));
    if (kk === "redis") kv = m.redisKV(env.require("REDIS_URL"));
    if (qk === "url") sql = m.bunSQL(env.require("DATABASE_URL"));
  }
  return { target, env, storage, kv, sql, waitUntil };
}

async function cronRoute(app: AppDef, req: Request, ctx: Ctx): Promise<Response | null> {
  const m = new URL(req.url).pathname.match(/^\/__cron\/([\w-]+)$/);
  if (!m) return null;
  const secret = ctx.env.get("CRON_SECRET");
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("forbidden", { status: 403 });
  const h = app.crons?.[m[1]!];
  if (!h) return new Response("unknown cron", { status: 404 });
  await h(ctx);
  return Response.json({ ok: true, cron: m[1] });
}

interface ExecCtx {
  waitUntil(p: Promise<unknown>): void;
}

/** Cloudflare Workers module: `export default cloudflare(app)`. */
export function cloudflare(app: AppDef) {
  return {
    async fetch(req: Request, b: Bindings, c: ExecCtx) {
      const ctx = await resolveCtx("cf", b, (p) => c.waitUntil(p));
      return (await cronRoute(app, req, ctx)) ?? app.fetch(req, ctx);
    },
    async scheduled(ev: { cron: string }, b: Bindings, c: ExecCtx) {
      const ctx = await resolveCtx("cf", b, (p) => c.waitUntil(p));
      const map = Object.fromEntries(
        (ctx.env.get("CRONS") ?? "")
          .split(";")
          .filter(Boolean)
          .map((s) => s.split("=") as [string, string]),
      );
      const name = map[ev.cron];
      if (name && app.crons?.[name]) await app.crons[name](ctx);
    },
  };
}

/** Vercel Functions (web-standard fetch export): `export default vercel(app)`. */
export function vercel(app: AppDef) {
  return {
    async fetch(req: Request) {
      const pending: Promise<unknown>[] = [];
      const ctx = await resolveCtx("vercel", {}, (p) => void pending.push(p.catch(() => {})));
      const res = (await cronRoute(app, req, ctx)) ?? (await app.fetch(req, ctx));
      if (pending.length) await Promise.all(pending);
      return res;
    },
  };
}

/**
 * VPS (and Vercel's Bun preset, which detects the Bun.serve() call): Bun.serve,
 * or a single cron run with `--cron <name>` (systemd timer).
 */
export async function vps(app: AppDef, argv: string[] = Bun.argv) {
  const ctx = await resolveCtx(detectTarget(), {},(p) => void p.catch((e) => console.error(e)));
  const i = argv.indexOf("--cron");
  if (i >= 0) {
    const name = argv[i + 1] ?? "";
    const h = app.crons?.[name];
    if (!h) throw new Error(`unknown cron ${name}`);
    await h(ctx);
    return null;
  }
  return Bun.serve({
    port: Number(ctx.env.get("PORT") ?? 3000),
    hostname: ctx.env.get("HOST") ?? "127.0.0.1",
    fetch: async (req) => (await cronRoute(app, req, ctx)) ?? app.fetch(req, ctx),
  });
}

export function defineApp(app: AppDef): AppDef {
  return app;
}
