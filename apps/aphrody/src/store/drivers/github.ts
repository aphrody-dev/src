/** GitHub REST API: repository search, and star counts for packages that point at a GitHub repository. */

import {
  getJson,
  githubHeaders,
  githubRepo,
  need,
  LIMIT,
  type DriverContext,
} from "../http";
import type { StorePackage } from "../types";

export const GITHUB_SOURCE = "https://api.github.com/search/repositories";

interface GhRepo {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  html_url: string;
  clone_url: string;
  language: string | null;
  topics?: string[];
  license?: { spdx_id?: string | null } | null;
  owner?: { login?: string };
}

export function parseGithub(raw: { items: GhRepo[] }): StorePackage[] {
  return need(raw.items, "items").map((r) => ({
    id: `github-${r.full_name}`,
    name: r.full_name,
    ecosystem: "github",
    description: r.description ?? "",
    author: r.owner?.login,
    repoUrl: r.html_url,
    url: r.html_url,
    license: r.license?.spdx_id ?? undefined,
    stars: r.stargazers_count,
    installCmd: `git clone ${r.clone_url}`,
    tags: [...(r.language ? [r.language] : []), ...(r.topics ?? [])],
  }));
}

export async function searchGithub(
  query: string,
  ctx: DriverContext,
): Promise<StorePackage[]> {
  const url = `${GITHUB_SOURCE}?q=${encodeURIComponent(query)}&sort=stars&per_page=${LIMIT}`;
  return parseGithub(
    await getJson<{ items: GhRepo[] }>(ctx, url, {
      headers: githubHeaders(ctx.env),
    }),
  );
}

/**
 * Reads stargazers_count from the GitHub API for the packages whose repoUrl is a GitHub repository.
 * A lookup that fails (rate limit, 404) leaves `stars` absent for that package.
 */
export async function addStars(
  pkgs: StorePackage[],
  ctx: DriverContext,
  max = 8,
): Promise<void> {
  const todo = pkgs
    .filter((p) => p.stars === undefined && githubRepo(p.repoUrl))
    .slice(0, max);
  await Promise.all(
    todo.map(async (p) => {
      try {
        const r = await getJson<{ stargazers_count?: number }>(
          ctx,
          `https://api.github.com/repos/${githubRepo(p.repoUrl)}`,
          { headers: githubHeaders(ctx.env) },
          6000,
        );
        if (typeof r.stargazers_count === "number")
          p.stars = r.stargazers_count;
      } catch {
        /* stars stay absent */
      }
    }),
  );
}
