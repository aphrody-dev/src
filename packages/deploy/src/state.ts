// Data model of aphrody.app, shared by the Workers (platform, apps/aphrody edge) and the CLI.
// Everything lives in one R2 bucket under "deploys/":
//   deploys/_registry.json                 projects.toml + monorepo inventory + brand + labs, uploaded by CI
//   deploys/<project>/_state.json          production pointer, history, recent deployments
//   deploys/<project>/<sha>.json           one deployment record
//   deploys/<project>/<sha>.log            build log (authenticated read)
//   deploys/<project>/<sha>/<path>         immutable files of the deployment

export const ROOT = "deploys";
export const SHORT = 7;

export type DeployState = "building" | "ready" | "error";

export interface Deployment {
  project: string;
  sha: string;
  branch: string;
  message: string;
  createdAt: string;
  readyAt?: string;
  state: DeployState;
  files?: number;
  bytes?: number;
  run?: string; // CI run URL
}

export interface HistoryEntry {
  sha: string;
  at: string;
  action: "promote" | "rollback";
  by: string;
}

export interface ProjectState {
  production?: string;
  history: HistoryEntry[];
  deployments: string[]; // newest first
}

export interface Project {
  name: string;
  path: string;
  build: string;
  out: string;
  domains: string[];
  worker?: string;
  watch: string[];
  env: string[];
  exclude: string[];
  production: "auto" | "manual";
  api?: string; // path prefixes proxied to the backend origin (prd) instead of served from R2
}

export interface InventoryItem {
  path: string;
  kind: "app" | "worker" | "package";
  name: string;
  description: string;
  deployed: boolean;
}

export interface LabCard {
  name: string;
  description: string;
  url: string;
  homepage?: string;
  language?: string;
  pushedAt?: string;
  source: "github" | "alphabet";
  metric?: string;
}

export interface Registry {
  generatedAt: string;
  commit: string;
  projects: Project[];
  inventory: InventoryItem[];
  labs: LabCard[];
  css: string; // Material 3 tokens from the brand seed
  mark: string; // brand mark SVG
}

export const keys = {
  registry: () => `${ROOT}/_registry.json`,
  state: (p: string) => `${ROOT}/${p}/_state.json`,
  record: (p: string, sha: string) => `${ROOT}/${p}/${sha}.json`,
  log: (p: string, sha: string) => `${ROOT}/${p}/${sha}.log`,
  file: (p: string, sha: string, path: string) =>
    `${ROOT}/${p}/${sha}/${path.replace(/^\/+/, "")}`,
  base: (p: string, sha: string) => `${ROOT}/${p}/${sha}`,
};

export const NAME = /^[a-z][a-z0-9-]{0,40}$/;
export const SHA = /^[0-9a-f]{40}$/;

/** `<project>-<sha7>.aphrody.app` -> { project, short }; the sha is the last dash-separated label part. */
export function parsePreviewHost(
  host: string,
  zone = "aphrody.app",
): { project: string; short: string } | null {
  if (!host.endsWith(`.${zone}`)) return null;
  const label = host.slice(0, -zone.length - 1);
  const m = /^([a-z][a-z0-9-]*)-([0-9a-f]{7,40})$/.exec(label);
  return m ? { project: m[1]!, short: m[2]! } : null;
}

export function previewUrl(
  project: string,
  sha: string,
  zone = "aphrody.app",
): string {
  return `https://${project}-${sha.slice(0, SHORT)}.${zone}`;
}

export function emptyState(): ProjectState {
  return { history: [], deployments: [] };
}

/** Previous production target for a rollback: the entry before the current one in the promote history. */
export function rollbackTarget(s: ProjectState): string | undefined {
  const seen = new Set<string>();
  for (let i = s.history.length - 1; i >= 0; i--) {
    const sha = s.history[i]!.sha;
    if (sha !== s.production && !seen.has(sha)) return sha;
    seen.add(sha);
  }
  return undefined;
}

export function resolveShort(
  s: ProjectState,
  short: string,
): string | undefined {
  return s.deployments.find((d) => d.startsWith(short));
}
