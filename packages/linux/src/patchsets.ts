// Live versions of the kernel patchsets, distro kernels and GPU stacks of infra/linux/patchsets.toml.
// Every method reads one official source; GitHub calls use GH_TOKEN/GITHUB_TOKEN (or `gh auth token`).

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type Patchset = {
  name: string;
  group: string;
  method: string;
  pinned: string;
  repo?: string;
  path?: string;
  vars?: string[];
  pattern?: string;
  project?: string;
  url?: string;
  channel?: string;
  fork?: string;
  excluded?: string;
};

export type Live = Patchset & {
  latest?: string;
  archived?: boolean;
  error?: string;
  state: "ok" | "behind" | "excluded" | "error";
};

export const PATCHSETS = join("infra", "linux", "patchsets.toml");

export function loadPatchsets(root: string): Patchset[] {
  const doc = Bun.TOML.parse(readFileSync(join(root, PATCHSETS), "utf8")) as {
    patchset?: Record<string, Omit<Patchset, "name">>;
  };
  return Object.entries(doc.patchset ?? {}).map(([name, p]) => ({ name, ...p }));
}

/** Numeric-aware comparison: 7.10 > 7.9, 18-7.3 > 17-6.18, 20261104 > 20251001. */
export function cmpVersion(a: string, b: string): number {
  const pa = a.split(/[^0-9]+/).filter(Boolean).map(Number);
  const pb = b.split(/[^0-9]+/).filter(Boolean).map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? -1) - (pb[i] ?? -1);
    if (d) return d;
  }
  return a.localeCompare(b);
}

/** Highest first capture group of `pattern` over `names`. */
export function highest(names: string[], pattern: string): string | undefined {
  const re = new RegExp(pattern);
  const hits = names.flatMap((n) => {
    const m = re.exec(n);
    return m ? [m[1] ?? m[0]] : [];
  });
  return hits.sort(cmpVersion).at(-1);
}

/** `_major=7.3` and `_minor=4` of a PKGBUILD -> "7.3.4" (vars joined by "."). */
export function pkgbuildVersion(text: string, vars: string[]): string | undefined {
  const parts = vars.map((v) => new RegExp(`^${v}=["']?([^"'\\s#]+)`, "m").exec(text)?.[1]);
  return parts.every(Boolean) ? parts.join(".") : undefined;
}

let token: string | undefined | null = null;
function ghToken(): string | undefined {
  if (token !== null) return token;
  token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    const r = Bun.spawnSync(["gh", "auth", "token"], { stderr: "ignore" });
    token = r.exitCode === 0 ? r.stdout.toString().trim() || undefined : undefined;
  }
  return token;
}

async function gh<T>(path: string, accept = "application/vnd.github+json"): Promise<T> {
  const t = ghToken();
  const r = await fetch(`https://api.github.com/${path}`, {
    headers: { accept, "user-agent": "aphrody-ay-linux", ...(t ? { authorization: `Bearer ${t}` } : {}) },
  });
  if (!r.ok) throw new Error(`GitHub ${path}: HTTP ${r.status}`);
  return (accept.endsWith("raw") ? await r.text() : await r.json()) as T;
}

async function ghPaged(path: string): Promise<{ name: string }[]> {
  const out: { name: string }[] = [];
  for (let page = 1; page <= 10; page++) {
    const sep = path.includes("?") ? "&" : "?";
    const list = await gh<{ name: string }[]>(`${path}${sep}per_page=100&page=${page}`);
    out.push(...list);
    if (list.length < 100) break;
  }
  return out;
}

async function text(url: string): Promise<string> {
  const r = await fetch(url, { headers: { "user-agent": "aphrody-ay-linux" } });
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  return r.text();
}

function lsRemoteHeads(url: string): string[] {
  const r = Bun.spawnSync(["git", "ls-remote", "--heads", url], { stderr: "pipe" });
  if (r.exitCode !== 0) throw new Error(`git ls-remote ${url}: ${r.stderr.toString().trim()}`);
  return r.stdout
    .toString()
    .split("\n")
    .map((l) => l.split("\trefs/heads/")[1])
    .filter((x): x is string => !!x);
}

function hrefs(html: string): string[] {
  return [...html.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]!);
}

export async function latestOf(p: Patchset): Promise<{ latest?: string; archived?: boolean }> {
  switch (p.method) {
    case "kernel-org": {
      const j = (await (await fetch("https://www.kernel.org/releases.json")).json()) as {
        releases: { moniker: string; version: string }[];
      };
      const list = j.releases.filter((r) => r.moniker === p.channel).map((r) => r.version);
      return { latest: list.sort(cmpVersion).at(-1) };
    }
    case "github-pkgbuild": {
      const t = await gh<string>(`repos/${p.repo}/contents/${p.path}`, "application/vnd.github.raw");
      return { latest: pkgbuildVersion(t, p.vars ?? []) };
    }
    case "github-dirs":
    case "github-files": {
      const list = await gh<{ name: string; type: string }[]>(`repos/${p.repo}/contents/${p.path ?? ""}`);
      const type = p.method === "github-dirs" ? "dir" : "file";
      return { latest: highest(list.filter((e) => e.type === type).map((e) => e.name), p.pattern!) };
    }
    case "github-branches":
      return { latest: highest((await ghPaged(`repos/${p.repo}/branches`)).map((b) => b.name), p.pattern!) };
    case "github-release": {
      const meta = await gh<{ archived: boolean }>(`repos/${p.repo}`);
      try {
        const rel = await gh<{ tag_name: string }>(`repos/${p.repo}/releases/latest`);
        return { latest: rel.tag_name, archived: meta.archived };
      } catch {
        const tags = await gh<{ name: string }[]>(`repos/${p.repo}/tags?per_page=1`);
        return { latest: tags[0]?.name, archived: meta.archived };
      }
    }
    case "gitlab-tags": {
      const r = await fetch(
        `https://gitlab.com/api/v4/projects/${encodeURIComponent(p.project!)}/repository/tags?per_page=100`,
      );
      if (!r.ok) throw new Error(`GitLab ${p.project}: HTTP ${r.status}`);
      const tags = (await r.json()) as { name: string }[];
      return { latest: highest(tags.map((t) => t.name), p.pattern!) };
    }
    case "git-heads":
      return { latest: highest(lsRemoteHeads(p.url!), p.pattern!) };
    case "cuda-redist":
      return { latest: highest(hrefs(await text(p.url!)), "^redistrib_([0-9.]+)\\.json$") };
    case "html-dirs":
      return { latest: highest(hrefs(await text(p.url!)), p.pattern!) };
    default:
      throw new Error(`method ${p.method} inconnue`);
  }
}

export async function liveStatus(list: Patchset[]): Promise<Live[]> {
  return Promise.all(
    list.map(async (p): Promise<Live> => {
      try {
        const { latest, archived } = await latestOf(p);
        if (p.excluded || archived) return { ...p, latest, archived, state: "excluded" };
        const state = latest && p.pinned !== latest ? "behind" : "ok";
        return { ...p, latest, archived, state };
      } catch (e) {
        return { ...p, error: (e as Error).message, state: p.excluded ? "excluded" : "error" };
      }
    }),
  );
}

/** Rewrite `pinned = "..."` of each moved entry in place (comments and order kept). */
export function writePins(root: string, moved: { name: string; latest: string }[]): number {
  const file = join(root, PATCHSETS);
  let s = readFileSync(file, "utf8");
  let n = 0;
  for (const m of moved) {
    const head = `\\[patchset\\.${m.name.replace(/[-.]/g, "\\$&")}\\]`;
    const re = new RegExp(`(${head}(?:(?!\\n\\[)[\\s\\S])*?\\npinned = )"[^"]*"`);
    if (re.test(s)) {
      s = s.replace(re, `$1"${m.latest}"`);
      n++;
    }
  }
  writeFileSync(file, s);
  return n;
}
