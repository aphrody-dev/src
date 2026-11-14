// SPDX-License-Identifier: Apache-2.0
/** Static tracker description: `[tracker.<id>]` tables of third_party/ECOSYSTEM.toml (no version lives there). */
import { existsSync } from "node:fs";
import { ROOT } from "./net.ts";

export type Role = "engine" | "component" | "consumer" | "fork" | "tooling";

/** One resolver call: `from` selects the implementation in resolvers.ts, the other keys are its parameters. */
export interface Resolver {
  readonly from: string;
  readonly label?: string;
  readonly [k: string]: unknown;
}

export interface TrackerConfig {
  readonly id: string;
  readonly name: string;
  readonly role: Role;
  readonly fork?: boolean;
  readonly repo?: string;
  readonly mirror?: string;
  readonly upstream?: string;
  readonly local?: string;
  readonly issues?: string;
  readonly issues_component?: string;
  readonly issues_component_source?: string;
  readonly prs?: string;
  readonly gerrit?: string;
  readonly gerrit_project?: string;
  readonly news?: string;
  readonly changelog?: string;
  readonly release_notes?: string;
  readonly mailing_list?: string;
  readonly forum?: string;
  readonly builds?: string;
  readonly source?: string;
  readonly moved_from?: string;
  readonly note?: string;
  readonly skills?: readonly string[];
  readonly consumes?: readonly string[];
  readonly version?: Resolver;
  readonly v8?: Resolver | readonly Resolver[];
  readonly chrome?: Resolver;
  readonly pins?: readonly Resolver[];
}

export const ecosystemPath = (): string =>
  `${ROOT()}/third_party/ECOSYSTEM.toml`;

export function parseTrackers(toml: string): TrackerConfig[] {
  const doc = Bun.TOML.parse(toml) as {
    tracker?: Record<string, Omit<TrackerConfig, "id">>;
  };
  return Object.entries(doc.tracker ?? {}).map(
    ([id, t]) => ({ id, ...t }) as TrackerConfig,
  );
}

export async function loadTrackers(): Promise<TrackerConfig[]> {
  return parseTrackers(await Bun.file(ecosystemPath()).text());
}

export interface ResolvedLinks {
  issues?: string;
  prs?: string;
  news?: string;
  changelog?: string;
  release_notes?: string;
  mailing_list?: string;
  forum?: string;
  builds?: string;
  source?: string;
  gerrit?: string;
  repo?: string;
}

/** Explicit URL wins; otherwise the GitHub defaults of `repo`. */
export function linksOf(t: TrackerConfig): ResolvedLinks {
  const gh = t.repo ? `https://github.com/${t.repo}` : undefined;
  const pick = (v: string | undefined, d: string | undefined) => (v ? v : d);
  const l: ResolvedLinks = {
    issues: pick(t.issues, gh && `${gh}/issues`),
    prs: pick(
      t.prs,
      t.gerrit && t.gerrit_project
        ? `${t.gerrit}/q/project:${t.gerrit_project}+status:open`
        : gh && `${gh}/pulls`,
    ),
    news: pick(t.news, gh && `${gh}/releases.atom`),
    changelog: pick(t.changelog, gh && `${gh}/releases`),
    release_notes: t.release_notes,
    mailing_list: t.mailing_list,
    forum: t.forum,
    builds: t.builds,
    source: t.source,
    gerrit: t.gerrit,
    repo: gh,
  };
  return Object.fromEntries(
    Object.entries(l).filter(([, v]) => v),
  ) as ResolvedLinks;
}

export const skillExists = (name: string): boolean =>
  existsSync(`${ROOT()}/.agents/skills/${name}/SKILL.md`);

/** Structural problems of the configuration; empty when consistent. */
export function validateTrackers(ts: readonly TrackerConfig[]): string[] {
  const ids = new Set(ts.map((t) => t.id));
  const errs: string[] = [];
  for (const t of ts) {
    if (!t.name || !t.role) errs.push(`${t.id}: name and role are required`);
    for (const c of t.consumes ?? [])
      if (!ids.has(c)) errs.push(`${t.id}: consumes unknown tracker ${c}`);
    for (const s of t.skills ?? [])
      if (!skillExists(s))
        errs.push(`${t.id}: skill ${s} has no .agents/skills/${s}/SKILL.md`);
    if (!t.version) errs.push(`${t.id}: version resolver missing`);
    if (!t.repo && !t.upstream && !t.news && !t.issues)
      errs.push(`${t.id}: no repo, upstream, news or issues`);
  }
  return errs;
}
