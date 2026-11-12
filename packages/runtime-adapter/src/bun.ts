/** Bun-native adapters (VPS, and Vercel's Bun runtime): S3/MinIO/R2-S3, fs, Redis, Postgres/SQLite. */
import type { ByteRange, KV, SQL, Storage } from "./types";

function slice(size: number, r: ByteRange) {
  const end = r.length ? Math.min(size, r.offset + r.length) : size;
  return { start: r.offset, end, range: { offset: r.offset, length: end - r.offset } };
}

/** Credentials come from S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY (Bun defaults) in the service env. */
export function s3Storage(opts: { bucket: string; endpoint?: string; region?: string }): Storage {
  const c = new Bun.S3Client(opts);
  return {
    async get(key, o) {
      const f = c.file(key);
      if (!(await f.exists())) return null;
      const st = await f.stat();
      if (o?.range) {
        const s = slice(st.size, o.range);
        return { body: f.slice(s.start, s.end).stream(), size: st.size, etag: st.etag, contentType: st.type, range: s.range };
      }
      return { body: f.stream(), size: st.size, etag: st.etag, contentType: st.type };
    },
    async put(key, data, o) {
      await c.write(key, data as never, o?.contentType ? { type: o.contentType } : undefined);
    },
    async delete(key) {
      await c.delete(key);
    },
  };
}

export function fsStorage(root: string): Storage {
  const base = root.replace(/[\\/]+$/, "");
  const p = (k: string) => {
    const clean = k.split("/").filter((s) => s && s !== "." && s !== "..").join("/");
    return `${base}/${clean}`;
  };
  return {
    async get(key, o) {
      const f = Bun.file(p(key));
      if (!(await f.exists())) return null;
      if (o?.range) {
        const s = slice(f.size, o.range);
        return { body: f.slice(s.start, s.end).stream(), size: f.size, contentType: f.type, range: s.range };
      }
      return { body: f.stream(), size: f.size, contentType: f.type };
    },
    async put(key, data) {
      await Bun.write(p(key), data as never);
    },
    async delete(key) {
      await Bun.file(p(key)).delete();
    },
  };
}

export function redisKV(url: string): KV {
  const r = new Bun.RedisClient(url);
  return {
    get: (k) => r.get(k),
    async set(k, v, o) {
      await r.set(k, v);
      if (o?.ttl) await r.expire(k, o.ttl);
    },
    async delete(k) {
      await r.del(k);
    },
  };
}

/** postgres://… (Postgres on prd, or a Hyperdrive connection string) or sqlite://path. */
export function bunSQL(url: string): SQL {
  const db = new Bun.SQL(url);
  const pg = !url.startsWith("sqlite");
  const q = (s: string) => {
    if (!pg) return s;
    let i = 0;
    return s.replace(/\?/g, () => `$${++i}`);
  };
  return {
    all: async (s, p = []) => (await db.unsafe(q(s), p as never[])) as never,
    run: async (s, p = []) => void (await db.unsafe(q(s), p as never[])),
  };
}
