// Live review state: GitHub pull requests (gh api) and Gerrit changes (REST, anonymous read).
import { gh, ghApi } from "./git.ts";
import type { Review } from "./patch.ts";

const GH_PR = /^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/;
const GERRIT =
  /^(https:\/\/[^/]+-review\.googlesource\.com)\/(?:c\/.+\/\+\/|#\/c\/)(\d+)/;

export async function review(url: string | null): Promise<Review | null> {
  if (!url) return null;
  const g = GH_PR.exec(url);
  if (g) {
    const pr = ghApi<{ state: string; merged_at: string | null }>(
      `repos/${g[1]}/pulls/${g[2]}`,
    );
    if (!pr) return { state: "unknown", url };
    return {
      state: pr.merged_at ? "merged" : pr.state === "open" ? "open" : "closed",
      url,
      merged_at: pr.merged_at,
    };
  }
  const r = GERRIT.exec(url);
  if (r) {
    try {
      const res = await fetch(`${r[1]}/changes/${r[2]}`);
      if (!res.ok) return { state: "unknown", url };
      const j = JSON.parse((await res.text()).replace(/^\)\]\}'\n/, "")) as {
        status: string;
        submitted?: string;
      };
      const state =
        j.status === "MERGED"
          ? "merged"
          : j.status === "ABANDONED"
            ? "abandoned"
            : "new";
      return { state, url, merged_at: j.submitted ?? null };
    } catch {
      return { state: "unknown", url };
    }
  }
  return { state: "unknown", url };
}

/** Existing upstream PR for a head ref of the fork (any state), so a PR is never opened twice. */
export function existingPr(
  upstream: string,
  fork: string,
  head: string,
): { url: string; state: string } | null {
  const owner = fork.split("/")[0];
  const r = gh([
    "pr",
    "list",
    "-R",
    upstream,
    "--head",
    head,
    "--state",
    "all",
    "--json",
    "url,state,headRepositoryOwner",
    "--limit",
    "20",
  ]);
  if (r.code !== 0) return null;
  const list = JSON.parse(r.out || "[]") as {
    url: string;
    state: string;
    headRepositoryOwner?: { login: string };
  }[];
  return list.find((p) => p.headRepositoryOwner?.login === owner) ?? null;
}

/** Ephemeral PR heads on the fork: `up/*` (ay upstream pr) and `pr/*` (heads pushed by hand or by other agents). */
export function forkHeads(fork: string): string[] {
  return ["up/", "pr/"].flatMap((prefix) =>
    (
      ghApi<{ ref: string }[]>(
        `repos/${fork}/git/matching-refs/heads/${prefix}`,
      ) ?? []
    ).map((r) => r.ref.replace(/^refs\/heads\//, "")),
  );
}

export function deleteHead(fork: string, head: string): boolean {
  return (
    gh(["api", "-X", "DELETE", `repos/${fork}/git/refs/heads/${head}`]).code ===
    0
  );
}

export function repoExists(repo: string): boolean {
  return ghApi(`repos/${repo}`) !== null;
}

/** GitHub "Sync fork" (fast-forward of a mirror fork); false when it cannot fast-forward. */
export function mergeUpstream(
  fork: string,
  branch: string,
): { ok: boolean; message: string } {
  const r = gh([
    "api",
    "-X",
    "POST",
    `repos/${fork}/merge-upstream`,
    "-f",
    `branch=${branch}`,
  ]);
  if (r.code !== 0) return { ok: false, message: r.err.trim() || r.out.trim() };
  try {
    return {
      ok: true,
      message: (JSON.parse(r.out) as { message: string }).message,
    };
  } catch {
    return { ok: true, message: r.out.trim() };
  }
}
