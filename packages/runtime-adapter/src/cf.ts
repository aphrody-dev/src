/** Cloudflare binding adapters (R2, KV, D1). Minimal local types: zero deps. */
import type { KV, SQL, Storage } from "./types";

interface R2Obj {
  body: ReadableStream;
  size: number;
  httpEtag: string;
  httpMetadata?: { contentType?: string };
  range?: { offset?: number; length?: number };
}
export interface R2Bucket {
  get(k: string, o?: unknown): Promise<R2Obj | null>;
  put(k: string, v: unknown, o?: unknown): Promise<unknown>;
  delete(k: string): Promise<void>;
}
export interface KVNamespace {
  get(k: string): Promise<string | null>;
  put(k: string, v: string, o?: unknown): Promise<void>;
  delete(k: string): Promise<void>;
}
export interface D1Database {
  prepare(q: string): {
    bind(...a: unknown[]): {
      all(): Promise<{ results: unknown[] }>;
      run(): Promise<unknown>;
    };
  };
}

export function r2Storage(b: R2Bucket): Storage {
  return {
    async get(key, opts) {
      const o = await b.get(
        key,
        opts?.range ? { range: opts.range } : undefined,
      );
      if (!o) return null;
      const range =
        opts?.range && o.range
          ? {
              offset: o.range.offset ?? 0,
              length: o.range.length ?? o.size - (o.range.offset ?? 0),
            }
          : undefined;
      return {
        body: o.body,
        size: o.size,
        etag: o.httpEtag,
        contentType: o.httpMetadata?.contentType,
        range,
      };
    },
    async put(key, data, opts) {
      await b.put(
        key,
        data,
        opts?.contentType
          ? { httpMetadata: { contentType: opts.contentType } }
          : undefined,
      );
    },
    delete: (k) => b.delete(k),
  };
}

export function cfKV(ns: KVNamespace): KV {
  return {
    get: (k) => ns.get(k),
    // CF KV minimum expirationTtl is 60 s.
    set: (k, v, o) =>
      ns.put(k, v, o?.ttl ? { expirationTtl: Math.max(60, o.ttl) } : undefined),
    delete: (k) => ns.delete(k),
  };
}

export function d1SQL(db: D1Database): SQL {
  return {
    all: async (q, p = []) =>
      (
        await db
          .prepare(q)
          .bind(...p)
          .all()
      ).results as never,
    run: async (q, p = []) =>
      void (await db
        .prepare(q)
        .bind(...p)
        .run()),
  };
}
