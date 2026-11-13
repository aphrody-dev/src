// Skills hub: one client over several sources, fanned out in parallel. Fuses OpenClaw ClawHub (HTTP API v1,
// https://clawhub.ai/api/v1, docs/http-api.md in openclaw/clawhub) with Hermes tools/skills_hub*.py
// (source router: clawhub, GitHub repos with SKILL.md). Installs are linted (Hermes rules), carry provenance,
// and are indexed into Context through Skills.sync().
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { lintContent, parseSkill } from "./skill-lint";
import type { Skills } from "./skills";

export type HubSkill = {
  source: string;
  ref: string;
  name: string;
  summary: string;
  score?: number;
  url?: string;
};
export interface HubSource {
  id: string;
  search(q: string, limit: number): Promise<HubSkill[]>;
  fetchSkill(ref: string): Promise<string>;
}

export const clawhub = (
  base = Bun.env.CLAWHUB_URL ?? "https://clawhub.ai",
  fetchFn: typeof fetch = fetch,
): HubSource => ({
  id: "clawhub",
  async search(q, limit) {
    const u = new URL("/api/v1/search", base);
    u.searchParams.set("q", q);
    u.searchParams.set("limit", String(limit));
    u.searchParams.set("nonSuspiciousOnly", "true");
    const r = await fetchFn(u, { signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error(`clawhub search ${r.status}`);
    const j: any = await r.json();
    return (j.results ?? []).map((x: any) => ({
      source: "clawhub",
      ref: x.slug ?? x.install?.reference?.split("/").pop(),
      name: x.displayName ?? x.slug,
      summary: x.summary ?? "",
      score: x.score,
      url: x.canonicalUrl ? new URL(x.canonicalUrl, base).href : undefined,
    }));
  },
  async fetchSkill(ref) {
    const u = new URL(`/api/v1/skills/${encodeURIComponent(ref)}/file`, base);
    u.searchParams.set("path", "SKILL.md");
    const r = await fetchFn(u, { signal: AbortSignal.timeout(20_000) });
    if (!r.ok) throw new Error(`clawhub file ${ref} ${r.status}`);
    return r.text();
  },
});

/** GitHub source: `owner/repo` with skills under `<root>/<name>/SKILL.md` (anthropics/skills layout, Hermes github source). */
export const github = (
  repo: string,
  root = "skills",
  ref = "main",
  fetchFn: typeof fetch = fetch,
): HubSource => {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
  };
  if (Bun.env.GITHUB_TOKEN)
    headers.authorization = `Bearer ${Bun.env.GITHUB_TOKEN}`;
  return {
    id: `github:${repo}`,
    async search(q, limit) {
      const r = await fetchFn(
        `https://api.github.com/repos/${repo}/contents/${root}?ref=${ref}`,
        { headers, signal: AbortSignal.timeout(20_000) },
      );
      if (!r.ok) throw new Error(`github ${repo} ${r.status}`);
      const dirs = ((await r.json()) as any[])
        .filter((e) => e.type === "dir")
        .map((e) => String(e.name));
      const terms = q.toLowerCase().split(/\W+/).filter(Boolean);
      return dirs
        .map((name) => ({
          name,
          score: terms.filter((t) => name.toLowerCase().includes(t)).length,
        }))
        .filter((d) => d.score > 0 || terms.length === 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((d) => ({
          source: `github:${repo}`,
          ref: d.name,
          name: d.name,
          summary: "",
          score: d.score,
          url: `https://github.com/${repo}/tree/${ref}/${root}/${d.name}`,
        }));
    },
    async fetchSkill(name) {
      const r = await fetchFn(
        `https://raw.githubusercontent.com/${repo}/${ref}/${root}/${name}/SKILL.md`,
        { signal: AbortSignal.timeout(20_000) },
      );
      if (!r.ok) throw new Error(`github ${repo}/${name} ${r.status}`);
      return r.text();
    },
  };
};

export const defaultSources = () => [clawhub(), github("anthropics/skills")];

/** Parallel fan-out search across sources; failing sources are reported, not fatal. */
export async function hubSearch(
  q: string,
  sources = defaultSources(),
  limit = 10,
) {
  const settled = await Promise.allSettled(
    sources.map((s) => s.search(q, limit)),
  );
  const results: HubSkill[] = [];
  const errors: string[] = [];
  settled.forEach((r, i) =>
    r.status === "fulfilled"
      ? results.push(...r.value)
      : errors.push(`${sources[i]!.id}: ${r.reason}`),
  );
  return { results, errors };
}

/** Install a hub skill into the local store: lint (errors block), write SKILL.md, record provenance. */
export async function hubInstall(
  skills: Skills,
  source: HubSource,
  ref: string,
) {
  const content = await source.fetchSkill(ref);
  const parsed = parseSkill(content);
  const name = (parsed?.front.name ?? ref)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-");
  const findings = lintContent(content, join(skills.dir, name));
  const errors = findings.filter(
    (f) => f.severity === "error" && f.rule !== "name-dir-mismatch",
  );
  if (errors.length)
    throw new Error(`lint: ${errors.map((e) => e.rule).join(", ")}`);
  mkdirSync(join(skills.dir, name), { recursive: true });
  const path = join(skills.dir, name, "SKILL.md");
  await Bun.write(path, content);
  const u = await skills.usage();
  u[name] = {
    uses: 0,
    createdAt: new Date().toISOString(),
    state: "active",
    pinned: true,
    ...{ source: `${source.id}:${ref}` },
  };
  await Bun.write(join(skills.dir, ".usage.json"), JSON.stringify(u, null, 2));
  await skills.sync();
  return {
    name,
    path,
    warnings: findings.filter((f) => f.severity === "warning"),
  };
}
