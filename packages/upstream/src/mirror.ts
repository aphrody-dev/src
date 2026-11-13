// Mirror-model stacks: forks kept even with upstream, without local patches (gaming forks: Proton,
// wine, dxvk, vkd3d-proton, gamescope, Vulkan, DirectX, Bazzite...; docs/gaming/OWNERSHIP.md).
// - the default branch follows the fork's parent with GitHub "Sync fork" (merge-upstream);
// - variants (Valve, CachyOS, GE) are extra branches of the same fork, never copies: in the fork
//   network a ref update by API is enough, otherwise a bare cache under var/upstream/mirror fetches
//   the variant and pushes it (first run transfers the history once, then deltas only).
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { mergeUpstream } from "./forge.ts";
import { gh, ghApi, git } from "./git.ts";
import type { StackConfig } from "./stack.ts";

export type Variant = {
  branch: string; // branch of the fork
  url: string; // git URL of the variant
  ref?: string; // branch of the variant
  ref_pattern?: string; // or: highest branch name matching this regex (dated CachyOS branches)
  network?: string; // owner/repo when the variant is in the fork network (API ref update)
};

// default_push: the fork has no GitHub parent (GitLab upstream mirrored by push), so Sync fork does not apply.
export type MirrorStack = StackConfig & { variants?: Variant[]; default_push?: boolean };

/** Heads of a remote: branch name -> sha (git ls-remote, no checkout). */
export function remoteHeads(url: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of git(process.cwd(), ["ls-remote", "--heads", url]).split("\n")) {
    const m = line.match(/^([0-9a-f]{40})\trefs\/heads\/(.+)$/);
    if (m) out.set(m[2]!, m[1]!);
  }
  return out;
}

/** The variant branch to follow: `ref`, else the highest name matching `ref_pattern`. */
export function variantRef(v: Variant, heads: Map<string, string>): string | null {
  if (v.ref) return heads.has(v.ref) ? v.ref : null;
  if (!v.ref_pattern) return null;
  let re: RegExp;
  try {
    re = new RegExp(v.ref_pattern);
  } catch {
    return null; // invalid pattern: the row reports "?" instead of stopping the stack
  }
  // Highest by the digits of the name (dates), then by name.
  const key = (n: string) => (n.match(/\d+/g) ?? []).map((d) => d.padStart(12, "0")).join(".");
  const names = [...heads.keys()].filter((n) => re.test(n)).sort((a, b) => key(a).localeCompare(key(b)) || a.localeCompare(b));
  return names.at(-1) ?? null;
}

export type MirrorRow = { branch: string; source: string; fork_tip: string | null; source_tip: string | null; in_sync: boolean };

export function mirrorStatus(s: MirrorStack): MirrorRow[] {
  const fork = remoteHeads(`https://github.com/${s.fork}.git`);
  const up = remoteHeads(s.upstream_url);
  const rows: MirrorRow[] = [
    { branch: s.branch, source: `${s.upstream}:${s.ref}`, fork_tip: fork.get(s.branch) ?? null, source_tip: up.get(s.ref) ?? null, in_sync: fork.get(s.branch) === up.get(s.ref) },
  ];
  for (const v of s.variants ?? []) {
    const heads = remoteHeads(v.url);
    const ref = variantRef(v, heads);
    const tip = ref ? heads.get(ref)! : null;
    rows.push({ branch: v.branch, source: `${v.url}:${ref ?? "?"}`, fork_tip: fork.get(v.branch) ?? null, source_tip: tip, in_sync: tip !== null && fork.get(v.branch) === tip });
  }
  return rows;
}

const NO_PROMPT = { GIT_TERMINAL_PROMPT: "0", GIT_ASKPASS: "", SSH_ASKPASS: "" };

/** Fetches the variant into the bare cache and pushes it with a lease on the fork tip seen by
 * `mirrorStatus`: a commit pushed to the fork branch meanwhile makes the push fail instead of being lost. */
function pushVariant(root: string, s: MirrorStack, v: Variant, ref: string, forkTip: string | null): void {
  const cache = join(root, "var", "upstream", "mirror", `${s.name}.git`);
  if (!existsSync(cache)) {
    mkdirSync(cache, { recursive: true });
    git(cache, ["init", "-q", "--bare"]);
  }
  git(cache, ["fetch", "-q", "--no-tags", v.url, `+refs/heads/${ref}:refs/heads/${v.branch}`], NO_PROMPT);
  const lease = `--force-with-lease=refs/heads/${v.branch}:${forkTip ?? ""}`;
  git(cache, ["-c", "credential.helper=", "-c", "credential.helper=!gh auth git-credential", "push", "-q", lease, `https://github.com/${s.fork}.git`, `refs/heads/${v.branch}:refs/heads/${v.branch}`], NO_PROMPT);
}

/** Brings every branch of a mirror stack even with its source. Returns 0, or 1 when one failed. */
export function mirrorSync(root: string, s: MirrorStack, push: boolean): number {
  let code = 0;
  const rows = mirrorStatus(s);
  for (const row of rows) {
    if (row.in_sync) {
      console.log(`${s.name} ${row.branch} : à jour (${row.fork_tip?.slice(0, 12)})`);
      continue;
    }
    if (!push) {
      console.log(`${s.name} ${row.branch} : ${row.fork_tip?.slice(0, 12) ?? "absente"} -> ${row.source_tip?.slice(0, 12) ?? "?"} (--push pour appliquer)`);
      continue;
    }
    if (!row.source_tip) {
      console.error(`${s.name} ${row.branch} : source introuvable (${row.source}), branche du fork laissée telle quelle`);
      code = 1;
      continue;
    }
    try {
      if (row.branch === s.branch && s.default_push) {
        pushVariant(root, s, { branch: s.branch, url: s.upstream_url }, s.ref, row.fork_tip);
        console.log(`${s.name} ${row.branch} : ${row.fork_tip?.slice(0, 12) ?? "créée"} -> ${row.source_tip?.slice(0, 12)}`);
        continue;
      }
      if (row.branch === s.branch) {
        const r = mergeUpstream(s.fork, s.branch);
        console.log(`${s.name} ${row.branch} : ${r.message}`);
        if (!r.ok) code = 1;
        continue;
      }
      const v = s.variants!.find((x) => x.branch === row.branch)!;
      const ref = row.source.slice(v.url.length + 1);
      if (v.network) {
        const path = `repos/${s.fork}/git/refs/heads/${v.branch}`;
        const cur = ghApi<{ object?: { sha?: string } }>(path);
        const exists = cur !== null;
        // Lease by hand: the fork branch must still be where mirrorStatus saw it.
        if (exists && cur?.object?.sha !== row.fork_tip) throw new Error(`branche du fork déplacée (${cur?.object?.sha?.slice(0, 12)}), pas d'écrasement`);
        const r = exists
          ? gh(["api", "-X", "PATCH", path, "-f", `sha=${row.source_tip}`, "-F", "force=true"])
          : gh(["api", "-X", "POST", `repos/${s.fork}/git/refs`, "-f", `ref=refs/heads/${v.branch}`, "-f", `sha=${row.source_tip}`]);
        if (r.code !== 0) throw new Error(r.err.trim());
      } else pushVariant(root, s, v, ref, row.fork_tip);
      console.log(`${s.name} ${row.branch} : ${row.fork_tip?.slice(0, 12) ?? "créée"} -> ${row.source_tip?.slice(0, 12)}`);
    } catch (e) {
      console.error(`${s.name} ${row.branch} : ${(e as Error).message}`);
      code = 1;
    }
  }
  return code;
}
