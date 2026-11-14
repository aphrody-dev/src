// SPDX-License-Identifier: Apache-2.0
/** Network and process helpers for the trackers: every fetch is timed out and never throws on HTTP status. */
import { repoRoot } from "../engines/registry.ts";

export const ROOT = (): string => repoRoot().replaceAll("\\", "/");
export const nowIso = (): string => new Date().toISOString();

export interface Http {
  readonly status: number;
  readonly url: string;
  readonly text: string;
  readonly error?: string;
}

/** GET with timeout; transport failures return status 0 and `error`. At most `max` bytes of body are kept. */
export async function http(
  url: string,
  opts: { timeout?: number; max?: number } = {},
): Promise<Http> {
  try {
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 aphrody-trackers", accept: "*/*" },
      signal: AbortSignal.timeout(opts.timeout ?? 25_000),
      redirect: "follow",
    });
    const text = (await r.text()).slice(0, opts.max ?? 400_000);
    return { status: r.status, url: r.url, text };
  } catch (e) {
    return { status: 0, url, text: "", error: String(e).slice(0, 160) };
  }
}

export async function httpJson<T = unknown>(url: string): Promise<T> {
  const r = await http(url, { max: 20_000_000 });
  if (r.status !== 200)
    throw new Error(`${url}: HTTP ${r.status} ${r.error ?? ""}`);
  return JSON.parse(r.text.replace(/^\)\]\}'\n/, "")) as T;
}

export async function run(
  cmd: string[],
  cwd?: string,
): Promise<{ out: string; err: string; code: number }> {
  const p = Bun.spawn(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
  ]);
  return { out, err, code: await p.exited };
}

/** GitHub REST through the authenticated gh CLI (JSON parsed in process: no --jq quoting). */
export async function ghApi<T = any>(path: string): Promise<T> {
  const r = await run(["gh", "api", path]);
  if (r.code !== 0)
    throw new Error(`gh api ${path}: ${(r.err || r.out).trim().slice(0, 140)}`);
  return JSON.parse(r.out) as T;
}

export async function ghFile(
  repo: string,
  path: string,
  ref?: string,
): Promise<string> {
  const o = await ghApi<{ content?: string }>(
    `repos/${repo}/contents/${path}${ref ? `?ref=${encodeURIComponent(ref)}` : ""}`,
  );
  if (!o.content)
    throw new Error(`${repo}:${path}@${ref ?? "default"}: no file content`);
  return new TextDecoder().decode(Buffer.from(o.content, "base64"));
}

export async function ghLatestTag(
  repo: string,
): Promise<{ tag: string; name: string; published: string }> {
  try {
    const r = await ghApi<{
      tag_name: string;
      name: string;
      published_at: string;
    }>(`repos/${repo}/releases/latest`);
    return { tag: r.tag_name, name: r.name ?? "", published: r.published_at };
  } catch {
    const t = await ghApi<{ name: string }[]>(`repos/${repo}/tags?per_page=1`);
    if (!t[0]) throw new Error(`${repo}: no release and no tag`);
    return { tag: t[0].name, name: "", published: "" };
  }
}

/** Run `n` async jobs at a time, keeping order. */
export async function pool<T, R>(
  items: readonly T[],
  n: number,
  fn: (t: T) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k] as T);
      }
    }),
  );
  return out;
}

const memo = new Map<string, Promise<unknown>>();
/** Per-process memo for repeated lookups (gitiles DEPS, V8 headers, crates.io). */
export function once<T>(key: string, f: () => Promise<T>): Promise<T> {
  let p = memo.get(key) as Promise<T> | undefined;
  if (!p) {
    p = f();
    memo.set(key, p);
  }
  return p;
}

/** a.b.c.d from include/v8-version.h text. */
export function parseV8Header(h: string): string {
  const g = (k: string) =>
    h.match(new RegExp(`#define V8_${k}\\s+(\\d+)`))?.[1];
  const v = [
    "MAJOR_VERSION",
    "MINOR_VERSION",
    "BUILD_NUMBER",
    "PATCH_LEVEL",
  ].map(g);
  if (v.some((x) => x === undefined))
    throw new Error("v8-version.h: version macros not found");
  return v.join(".");
}
