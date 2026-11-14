// Collects the public facts shown on the GitHub profile cards into docs/native/profile/stats.json.
// Source: the GitHub REST and search APIs through the authenticated `gh` CLI. No badge or stats
// service is involved; `ay brand build` renders the JSON to static SVG (assets/brand/gen/profile).
// Usage: bun docs/native/profile/stats.ts
import { $ } from "bun";
import { join } from "node:path";

type Repo = {
  name: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
};
type Pr = {
  repository: { nameWithOwner: string };
  state: string;
  url: string;
  title: string;
};

const gh = async <T>(...args: string[]): Promise<T> =>
  JSON.parse(await $`gh ${args}`.text()) as T;

const orgRepos = await gh<Repo[]>(
  "api",
  "--paginate",
  "--slurp",
  "orgs/aphrody-labs/repos?type=public&per_page=100",
).then((pages) => (pages as unknown as Repo[][]).flat());
const sources = orgRepos.filter((r) => !r.fork && !r.archived);
const forks = orgRepos.filter((r) => r.fork);
const languages = await gh<Record<string, number>>(
  "api",
  "repos/aphrody-labs/src/languages",
);
const prs = await gh<Pr[]>(
  "search",
  "prs",
  "--author",
  "aphrody-dev",
  "--json",
  "repository,state,url,title",
  "-L",
  "200",
);
const upstream = prs.filter(
  (p) => !p.repository.nameWithOwner.startsWith("aphrody-"),
);
const upstreamRepos = [
  ...new Set(upstream.map((p) => p.repository.nameWithOwner)),
].sort();
const merged = await gh<Pr[]>(
  "search",
  "prs",
  "--author",
  "aphrody-dev",
  "--merged",
  "--json",
  "repository,state,url,title",
  "-L",
  "200",
);
const mergedUpstream = merged.filter(
  (p) => !p.repository.nameWithOwner.startsWith("aphrody-"),
);

const stats = {
  generated: new Date().toISOString().slice(0, 10),
  source: "GitHub REST API",
  accounts: [
    {
      id: "aphrody-labs",
      title: "aphrody-labs",
      rows: [
        ["Active public source repositories", String(sources.length)],
        ["Public forks", String(forks.length)],
        ["Monorepo", "aphrody-labs/src"],
      ],
      languages: Object.entries(languages).sort((a, b) => b[1] - a[1]),
    },
    {
      id: "aphrody-dev",
      title: "aphrody-dev upstream work",
      rows: [
        ["Pull requests to upstream projects", String(upstream.length)],
        ["Merged upstream", String(mergedUpstream.length)],
        ["Upstream repositories", String(upstreamRepos.length)],
      ],
      languages: [],
    },
  ],
  pulls: upstream.map((p) => ({
    repo: p.repository.nameWithOwner,
    state: p.state,
    title: p.title,
    url: p.url,
  })),
};
await Bun.write(
  join(import.meta.dir, "stats.json"),
  JSON.stringify(stats, null, 2) + "\n",
);
console.log(
  `${sources.length} sources, ${forks.length} forks, ${upstream.length} upstream PRs (${mergedUpstream.length} merged)`,
);
