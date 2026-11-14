// SPDX-License-Identifier: Apache-2.0
/** Tracker link checks: a status code is never taken as proof, the body is read (feed item, JSON, page title). */
import { ghApi, http, nowIso, run, ROOT } from "./net.ts";
import { parseFeed } from "./resolvers.ts";

export interface LinkCheck {
  url: string;
  status: number;
  final_url?: string;
  kind: "feed" | "json" | "html" | "unreachable";
  /** What was read from the body: latest feed item, JSON shape, or page title. */
  proof?: string;
  error?: string;
  fetched_at: string;
}

export async function checkLink(url: string): Promise<LinkCheck> {
  let r = await http(url, { timeout: 20_000, max: 300_000 });
  // gitiles and Buganizer rate-limit bursts: one retry on transport failure or 5xx.
  if (r.status === 0 || r.status >= 500) {
    await Bun.sleep(1500);
    r = await http(url, { timeout: 20_000, max: 300_000 });
  }
  const base = {
    url,
    status: r.status,
    final_url: r.url !== url ? r.url : undefined,
    fetched_at: nowIso(),
  };
  if (r.status === 0) return { ...base, kind: "unreachable", error: r.error };
  const body = r.text.trimStart();
  if (
    /^<\?xml|^<rss|^<feed/i.test(body) ||
    /<(rss|feed)[\s>]/.test(body.slice(0, 600))
  ) {
    const f = parseFeed(r.text);
    return {
      ...base,
      kind: "feed",
      proof: f.title ? `${f.title}${f.date ? ` (${f.date})` : ""}` : undefined,
      error: f.title ? undefined : "feed without item",
    };
  }
  try {
    const j = JSON.parse(body.replace(/^\)\]\}'\n/, ""));
    return {
      ...base,
      kind: "json",
      proof: Array.isArray(j)
        ? `array(${j.length})`
        : `object(${Object.keys(j).slice(0, 4).join(",")})`,
    };
  } catch {
    /* not JSON */
  }
  const title = body
    .match(/<title[^>]*>([^<]{1,100})/i)?.[1]
    ?.replace(/\s+/g, " ")
    .trim();
  return {
    ...base,
    kind: "html",
    proof: title,
    error: r.status === 200 ? undefined : `HTTP ${r.status}`,
  };
}

export interface GerritLatest {
  number: number;
  subject: string;
  updated: string;
  url: string;
}

/** Latest merged change of a Gerrit project, read from the REST API (XSSI prefix stripped by http()). */
export async function gerritLatest(
  host: string,
  project: string,
): Promise<GerritLatest> {
  const url = `${host}/changes/?q=project:${project}+status:merged&n=1`;
  const r = await http(url);
  const j = JSON.parse(r.text.replace(/^\)\]\}'\n/, "")) as {
    _number: number;
    subject: string;
    updated: string;
  }[];
  const c = j[0];
  if (!c) throw new Error(`${url}: no merged change`);
  return {
    number: c._number,
    subject: c.subject,
    updated: c.updated,
    url: `${host}/c/${project}/+/${c._number}`,
  };
}

export interface RepoMeta {
  full_name: string;
  archived: boolean;
  pushed_at: string;
  default_branch: string;
  stars: number;
  license?: string;
  description?: string;
  has_issues: boolean;
  fetched_at: string;
}

export async function repoMeta(repo: string): Promise<RepoMeta> {
  const o = await ghApi<any>(`repos/${repo}`);
  return {
    full_name: o.full_name,
    archived: !!o.archived,
    pushed_at: o.pushed_at,
    default_branch: o.default_branch,
    stars: o.stargazers_count,
    license: o.license?.spdx_id ?? undefined,
    description: o.description ?? undefined,
    has_issues: !!o.has_issues,
    fetched_at: nowIso(),
  };
}

export interface LocalInfo {
  path: string;
  exists: boolean;
  head?: string;
  date?: string;
  origin?: string;
  repo_root?: string;
}

/** State of the checkout on this machine (read-only git). `path` is relative to the repository root. */
export async function localInfo(path: string): Promise<LocalInfo> {
  const abs = `${ROOT()}/${path}`;
  if (!(await Bun.file(`${abs}/.git`).exists()) && !(await dirExists(abs)))
    return { path, exists: false };
  const log = await run(["git", "-C", abs, "log", "-1", "--format=%H%n%cs"]);
  const [head, date] = log.out.trim().split("\n");
  const top = (
    await run(["git", "-C", abs, "rev-parse", "--show-toplevel"])
  ).out.trim();
  const origin = (
    await run(["git", "-C", abs, "remote", "get-url", "origin"])
  ).out.trim();
  return {
    path,
    exists: true,
    head: head || undefined,
    date: date || undefined,
    origin: origin || undefined,
    repo_root: top || undefined,
  };
}

async function dirExists(p: string): Promise<boolean> {
  try {
    return (
      (
        await Array.fromAsync(
          new Bun.Glob("*").scan({ cwd: p, onlyFiles: false }),
        )
      ).length >= 0
    );
  } catch {
    return false;
  }
}
