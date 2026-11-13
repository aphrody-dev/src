/** Provider-neutral contracts. Every backend implements these; apps only see these. */
export type Target = "cf" | "vercel" | "vps";

export interface ByteRange {
  offset: number;
  length?: number;
}
export interface BlobObject {
  body: ReadableStream | null;
  size: number;
  etag?: string;
  contentType?: string;
  /** Set when a byte range was served (status 206). */
  range?: { offset: number; length: number };
}
export interface Storage {
  get(key: string, opts?: { range?: ByteRange }): Promise<BlobObject | null>;
  put(key: string, data: string | ArrayBuffer | Uint8Array | Blob, opts?: { contentType?: string }): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, opts?: { ttl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface SQL {
  /** Write `?` placeholders; they are rewritten to $1.. for Postgres. */
  all<T = Record<string, unknown>>(query: string, params?: unknown[]): Promise<T[]>;
  run(query: string, params?: unknown[]): Promise<void>;
}
export interface Env {
  get(name: string): string | undefined;
  require(name: string): string;
}
export interface Ctx {
  target: Target;
  env: Env;
  storage: Storage | null;
  kv: KV | null;
  sql: SQL | null;
  waitUntil(p: Promise<unknown>): void;
}
export type CronHandler = (ctx: Ctx) => Promise<void> | void;
export interface AppDef {
  name: string;
  fetch(req: Request, ctx: Ctx): Promise<Response> | Response;
  /** name -> handler. Schedules live in infra/deploy.toml ([hosting.<app>].crons), never here. */
  crons?: Record<string, CronHandler>;
}
