import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { libraryRoot, storeRoot } from "./manifest.ts";
import { run } from "./util.ts";

/** Licenses accepted for repository entries (OSI-approved or public domain dedication). */
export const REPO_LICENSES = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "MPL-2.0",
  "GPL-2.0",
  "GPL-3.0",
  "LGPL-2.1",
  "LGPL-3.0",
  "AGPL-3.0",
  "CC0-1.0",
  "Unlicense",
  "0BSD",
  "Zlib",
  "BSL-1.0",
]);

export interface Repo {
  id: string;
  url: string;
  license: string;
  sha: string;
  note: string;
  archived: boolean;
  fork: boolean;
}

export const reposFile = (root: string) =>
  join(libraryRoot(root), "repos.toml");

export function parseRepos(text: string): Repo[] {
  const d = Bun.TOML.parse(text) as { repo?: Record<string, unknown>[] };
  return (d.repo ?? []).map((r) => ({
    id: String(r.id ?? ""),
    url: String(r.url ?? ""),
    license: String(r.license ?? ""),
    sha: String(r.sha ?? ""),
    note: String(r.note ?? ""),
    archived: r.archived === true,
    fork: r.fork === true,
  }));
}

export function checkRepos(rs: Repo[]): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const r of rs) {
    if (seen.has(r.id)) errs.push(`${r.id}: duplicate`);
    seen.add(r.id);
    if (!REPO_LICENSES.has(r.license))
      errs.push(`${r.id}: license ${r.license || "<none>"} not accepted`);
    if (!/^[0-9a-f]{40}$/.test(r.sha))
      errs.push(`${r.id}: sha must be a 40-char commit`);
    if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(r.url))
      errs.push(`${r.id}: url must be a github https url`);
  }
  return errs;
}

export const repoPath = (root: string, r: Repo) =>
  join(storeRoot(root), "repos", r.id.replace("/", "__"));

/** Shallow fetch of exactly the pinned commit into the store (not into git). */
export async function fetchRepo(
  root: string,
  r: Repo,
): Promise<"ok" | "cached"> {
  const dir = repoPath(root, r);
  mkdirSync(dir, { recursive: true });
  if (existsSync(join(dir, ".git"))) {
    const h = await run(["git", "-C", dir, "rev-parse", "HEAD"]);
    if (h.ok && h.out.trim() === r.sha) return "cached";
  } else {
    const i = await run(["git", "-C", dir, "init", "-q"]);
    if (!i.ok) throw new Error(`${r.id}: ${i.err.trim()}`);
  }
  for (const args of [
    ["fetch", "-q", "--depth", "1", r.url + ".git", r.sha],
    ["checkout", "-q", "--detach", "FETCH_HEAD"],
  ]) {
    const x = await run(["git", "-C", dir, ...args], { nice: true });
    if (!x.ok) throw new Error(`${r.id}: ${x.err.trim().slice(0, 200)}`);
  }
  const h = await run(["git", "-C", dir, "rev-parse", "HEAD"]);
  if (h.out.trim() !== r.sha)
    throw new Error(`${r.id}: HEAD ${h.out.trim()} != pinned ${r.sha}`);
  return "ok";
}

interface GhRepo {
  name: string;
  full_name: string;
  html_url: string;
  private: boolean;
  archived: boolean;
  fork: boolean;
  license: { spdx_id: string } | null;
  default_branch: string;
}

async function gh<T>(path: string): Promise<T> {
  const r = await run(["gh", "api", path]);
  if (!r.ok) throw new Error(`gh api ${path}: ${r.err.trim().slice(0, 200)}`);
  return JSON.parse(r.out) as T;
}

export interface ScanResult {
  included: Repo[];
  excluded: { id: string; license: string; reason: string }[];
}

/** Public repos of an org: OSI licence per GitHub's licence field, pinned at default-branch HEAD. */
export async function scanOrg(
  owner: string,
  kind: "orgs" | "users" = "orgs",
): Promise<ScanResult> {
  const list: GhRepo[] = [];
  for (let page = 1; ; page++) {
    const p = await gh<GhRepo[]>(
      `${kind}/${owner}/repos?per_page=100&page=${page}`,
    );
    list.push(...p);
    if (p.length < 100) break;
  }
  const res: ScanResult = { included: [], excluded: [] };
  for (const r of list.sort((a, b) => (a.full_name < b.full_name ? -1 : 1))) {
    const lic = r.license?.spdx_id ?? "";
    if (r.private) {
      res.excluded.push({
        id: r.full_name,
        license: lic,
        reason: "not public (visible through membership only); never mirrored",
      });
    } else if (!lic) {
      res.excluded.push({
        id: r.full_name,
        license: "none",
        reason: "no license file: all rights reserved",
      });
    } else if (lic === "NOASSERTION") {
      res.excluded.push({
        id: r.full_name,
        license: lic,
        reason: "custom or unrecognized license (EULA or non-OSI terms)",
      });
    } else if (!REPO_LICENSES.has(lic)) {
      res.excluded.push({
        id: r.full_name,
        license: lic,
        reason: "license not on the OSI/CC0 allowlist",
      });
    } else {
      const c = await gh<{ sha: string }>(
        `repos/${r.full_name}/commits/${r.default_branch}`,
      );
      res.included.push({
        id: r.full_name,
        url: r.html_url,
        license: lic,
        sha: c.sha,
        note: r.fork ? "fork of upstream, license is the upstream's" : "",
        archived: r.archived,
        fork: r.fork,
      });
    }
  }
  return res;
}

export function renderRepos(rs: Repo[]): string {
  return (
    "# Pinned git dependencies. Every entry: OSI/CC0 license per GitHub's license field, 40-char commit.\n# Fetched into the store (not git) by `ay assets fetch --repos`; refreshed by `ay assets scan`.\n" +
    rs
      .map(
        (r) =>
          `\n[[repo]]\nid = ${JSON.stringify(r.id)}\nurl = ${JSON.stringify(r.url)}\nlicense = ${JSON.stringify(r.license)}\nsha = ${JSON.stringify(r.sha)}\n` +
          (r.note ? `note = ${JSON.stringify(r.note)}\n` : "") +
          (r.archived ? "archived = true\n" : "") +
          (r.fork ? "fork = true\n" : ""),
      )
      .join("")
  );
}
