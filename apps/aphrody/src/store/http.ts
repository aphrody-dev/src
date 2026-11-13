/** Shared HTTP plumbing of the store drivers: typed errors, timeouts, injectable fetch. */

import type { SourceErrorCode } from "./types";

export type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

export interface DriverContext {
  fetch: Fetcher;
  env: Record<string, string | undefined>;
  /** Directory for downloaded indexes (winget). */
  cacheDir: string;
}

export const USER_AGENT = "aphrody-store/1 (+https://aphrody.com)";
export const LIMIT = 20;

export class SourceError extends Error {
  constructor(
    public code: SourceErrorCode,
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function request(
  ctx: DriverContext,
  url: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  let res: Response;
  try {
    res = await ctx.fetch(url, {
      ...init,
      headers: { "user-agent": USER_AGENT, ...(init.headers as object) },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const name = (e as { name?: string })?.name;
    if (name === "TimeoutError" || name === "AbortError")
      throw new SourceError("timeout", `no answer within ${timeoutMs} ms`);
    throw new SourceError("network", String((e as Error)?.message ?? e));
  }
  if (!res.ok)
    throw new SourceError(
      "http_error",
      `HTTP ${res.status} ${res.statusText}`.trim(),
      res.status,
    );
  return res;
}

export async function getJson<T>(
  ctx: DriverContext,
  url: string,
  init?: RequestInit,
  timeoutMs?: number,
): Promise<T> {
  const res = await request(ctx, url, init, timeoutMs);
  try {
    return (await res.json()) as T;
  } catch {
    throw new SourceError("bad_payload", "response is not valid JSON");
  }
}

export async function getText(
  ctx: DriverContext,
  url: string,
  init?: RequestInit,
  timeoutMs?: number,
): Promise<string> {
  return (await request(ctx, url, init, timeoutMs)).text();
}

export async function getBytes(
  ctx: DriverContext,
  url: string,
  timeoutMs?: number,
): Promise<Uint8Array> {
  return new Uint8Array(
    await (await request(ctx, url, {}, timeoutMs)).arrayBuffer(),
  );
}

export function need<T>(value: T | undefined | null, what: string): T {
  if (value === undefined || value === null)
    throw new SourceError("bad_payload", `missing ${what} in response`);
  return value;
}

export function githubHeaders(
  env: Record<string, string | undefined>,
): Record<string, string> {
  const h: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  };
  if (env.GITHUB_TOKEN) h.authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return h;
}

export function githubRepo(url?: string): string | undefined {
  const m = url?.match(
    /github\.com[/:]([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/#?].*)?$/i,
  );
  return m ? `${m[1]}/${m[2]}` : undefined;
}
