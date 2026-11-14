// SPDX-License-Identifier: Apache-2.0
/** Trackers: static targets (ECOSYSTEM.toml) + live sources -> third_party/chromium-trackers.json. */
import {
  type TrackerConfig,
  linksOf,
  loadTrackers,
  skillExists,
  validateTrackers,
} from "./config.ts";
import {
  type GerritLatest,
  type LinkCheck,
  type LocalInfo,
  type RepoMeta,
  checkLink,
  gerritLatest,
  localInfo,
  repoMeta,
} from "./links.ts";
import { ROOT, nowIso, pool } from "./net.ts";
import {
  type Channels,
  type Ctx,
  type Found,
  fetchChannels,
  resolve,
} from "./resolvers.ts";

export type Outcome = Found | { error: string; fetched_at: string };
const isErr = (
  o: Outcome | undefined,
): o is { error: string; fetched_at: string } => !!o && "error" in o;

export interface Target {
  id: string;
  name: string;
  role: string;
  fork: boolean;
  note?: string;
  moved_from?: string;
  repo?: string;
  upstream?: string;
  mirror?: string;
  local?: LocalInfo;
  github?: RepoMeta | { error: string };
  links: Record<string, LinkCheck>;
  gerrit_latest?: GerritLatest | { error: string };
  issues_component?: { id: string; source: string; verified: boolean | null };
  skills: { name: string; exists: boolean }[];
  version?: Outcome;
  chrome?: Outcome;
  v8?: Outcome[];
  pins?: Outcome[];
  consumes: string[];
  consumed_by: string[];
}

export interface TrackersDoc {
  schema: 1;
  generated_at: string;
  generator: string;
  config: string;
  channels: Channels;
  targets: Target[];
  conflicts: string[];
}

export const trackersPath = (): string =>
  `${ROOT()}/third_party/chromium-trackers.json`;

const attempt = async (f: () => Promise<Found>): Promise<Outcome> => {
  try {
    return await f();
  } catch (e) {
    return {
      error: String(e instanceof Error ? e.message : e).slice(0, 300),
      fetched_at: nowIso(),
    };
  }
};

async function verifyComponent(
  t: TrackerConfig,
): Promise<Target["issues_component"]> {
  if (!t.issues_component || !t.issues_component_source) return undefined;
  const p = `${ROOT()}/third_party/chromium/src/${t.issues_component_source}`;
  try {
    const m = (await Bun.file(p).text()).match(/component_id:\s*(\d+)/)?.[1];
    return {
      id: t.issues_component,
      source: `third_party/chromium/src/${t.issues_component_source}`,
      verified: m === t.issues_component,
    };
  } catch {
    return {
      id: t.issues_component,
      source: `third_party/chromium/src/${t.issues_component_source}`,
      verified: null,
    };
  }
}

export async function refresh(
  opts: { only?: string[]; links?: boolean } = {},
): Promise<TrackersDoc> {
  const all = await loadTrackers();
  const bad = validateTrackers(all);
  if (bad.length)
    throw new Error(`ECOSYSTEM.toml [tracker.*] invalid:\n${bad.join("\n")}`);
  const channels = await fetchChannels();
  const ctx: Ctx = { channels, version: new Map(), chrome: new Map() };
  const selected = opts.only?.length
    ? all.filter((t) => opts.only?.includes(t.id))
    : all;

  // 1. versions (and the Chrome an agent downloads), needed by the V8 lookups.
  await pool(selected, 6, async (t) => {
    if (t.version) {
      const o = await attempt(() => resolve(t.version as never, t, ctx));
      if (!isErr(o)) ctx.version.set(t.id, o);
      outcome.set(`${t.id}:version`, o);
    }
    if (t.chrome) {
      const o = await attempt(() =>
        resolve(t.chrome as never, t, ctx, "chrome"),
      );
      if (!isErr(o)) ctx.chrome.set(t.id, o);
      outcome.set(`${t.id}:chrome`, o);
    }
  });
  const consumedBy = new Map<string, string[]>();
  for (const t of all)
    for (const c of t.consumes ?? [])
      consumedBy.set(c, [...(consumedBy.get(c) ?? []), t.id]);

  const targets = await pool(selected, 5, async (t): Promise<Target> => {
    const l = linksOf(t);
    const v8s = t.v8 ? (Array.isArray(t.v8) ? t.v8 : [t.v8]) : [];
    const [v8, pins, local, github, gerrit, links, comp] = await Promise.all([
      Promise.all(
        v8s.map((r) => attempt(() => resolve(r as never, t, ctx, "v8"))),
      ),
      Promise.all(
        (t.pins ?? []).map((r) =>
          attempt(() => resolve(r as never, t, ctx, "pin")),
        ),
      ),
      t.local ? localInfo(t.local) : Promise.resolve(undefined),
      t.repo
        ? repoMeta(t.repo).catch((e) => ({ error: String(e).slice(0, 160) }))
        : Promise.resolve(undefined),
      t.gerrit && t.gerrit_project
        ? gerritLatest(t.gerrit, t.gerrit_project).catch((e) => ({
            error: String(e).slice(0, 160),
          }))
        : Promise.resolve(undefined),
      opts.links === false
        ? Promise.resolve({} as Record<string, LinkCheck>)
        : Promise.all(
            Object.entries(l)
              .filter(([k]) => k !== "repo")
              .map(
                async ([k, u]) => [k, await checkLink(u as string)] as const,
              ),
          ).then(Object.fromEntries),
      verifyComponent(t),
    ]);
    return {
      id: t.id,
      name: t.name,
      role: t.role,
      fork: !!t.fork,
      note: t.note,
      moved_from: t.moved_from,
      repo: l.repo,
      upstream: t.upstream,
      mirror: t.mirror,
      local,
      github,
      links,
      gerrit_latest: gerrit,
      issues_component: comp,
      skills: (t.skills ?? []).map((name) => ({
        name,
        exists: skillExists(name),
      })),
      version: outcome.get(`${t.id}:version`),
      chrome: outcome.get(`${t.id}:chrome`),
      v8,
      pins,
      consumes: [...(t.consumes ?? [])],
      consumed_by: consumedBy.get(t.id) ?? [],
    };
  });
  return {
    schema: 1,
    generated_at: nowIso(),
    generator: "packages/chromium-bun/src/trackers",
    config: "third_party/ECOSYSTEM.toml [tracker.*]",
    channels,
    targets,
    conflicts: conflictsOf(channels, targets),
  };
}

const outcome = new Map<string, Outcome>();

export function conflictsOf(
  channels: Channels,
  targets: readonly Target[],
): string[] {
  const out = [...channels.conflicts];
  const stable = channels.chromiumdash.Windows?.stable;
  if (channels.checkout_version && channels.chromiumdash.Windows?.canary) {
    out.push(
      `checkout third_party/chromium/src = ${channels.checkout_version}; canary = ${channels.chromiumdash.Windows.canary.version}`,
    );
  }
  for (const t of targets) {
    if (t.github && "archived" in t.github && t.github.archived)
      out.push(
        `${t.id}: ${t.github.full_name} is archived${t.moved_from ? ` (moved: ${t.repo})` : ""}`,
      );
    for (const [k, l] of Object.entries(t.links))
      if (l.status !== 200)
        out.push(
          `${t.id}: ${k} ${l.url} -> ${l.status === 0 ? `unreachable ${l.error ?? ""}` : `HTTP ${l.status}`}`,
        );
    for (const f of [t.version, t.chrome, ...(t.v8 ?? []), ...(t.pins ?? [])])
      if (isErr(f)) out.push(`${t.id}: ${f.error}`);
    if (t.issues_component && t.issues_component.verified === false)
      out.push(
        `${t.id}: issues component ${t.issues_component.id} differs from ${t.issues_component.source}`,
      );
    const c = t.version && !isErr(t.version) ? t.version.chromium : undefined;
    if (stable && c && /^\d+\./.test(c) && t.role !== "tooling") {
      const lag = stable.milestone - Number(c.split(".")[0]);
      if (lag > 0)
        out.push(
          `${t.id}: Chromium ${c} is ${lag} milestone(s) behind Windows Stable ${stable.version}`,
        );
    }
  }
  return out;
}

export async function writeTrackers(doc: TrackersDoc): Promise<void> {
  await Bun.write(trackersPath(), `${JSON.stringify(doc, null, 2)}\n`);
}

export async function readTrackers(): Promise<TrackersDoc | null> {
  const f = Bun.file(trackersPath());
  return (await f.exists()) ? ((await f.json()) as TrackersDoc) : null;
}
