// Bun side: projects.toml, monorepo inventory, labs cards and brand tokens, assembled into the Registry that
// CI uploads to aphrody.app on every push (single source: the repository).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { firstPath, parseAlphabet, plain, section } from "./alphabet.ts";
import { readBrand, tokensCss } from "./m3.ts";
import {
  NAME,
  type InventoryItem,
  type LabCard,
  type Project,
  type Registry,
} from "./state.ts";

export const SRC_ROOT =
  Bun.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..");

export function loadProjects(root = SRC_ROOT): Project[] {
  const t = Bun.TOML.parse(
    readFileSync(join(root, "packages", "deploy", "projects.toml"), "utf8"),
  ) as any;
  return Object.entries(t.project ?? {}).map(([name, v]: [string, any]) => {
    if (!NAME.test(name))
      throw new Error(`projects.toml: bad project name ${name}`);
    return {
      name,
      path: v.path,
      build: v.build ?? "bun run build",
      out: v.out ?? "dist",
      domains: v.domains ?? [],
      worker: v.worker,
      watch: v.watch ?? [`${v.path}/**`],
      env: v.env ?? [],
      exclude: v.exclude ?? [],
      production: v.production === "manual" ? "manual" : "auto",
      api: v.api,
      protect: v.protect === true,
      budgets: v.budgets,
    } satisfies Project;
  });
}

function describe(dir: string): string {
  for (const f of ["package.json"]) {
    const p = join(dir, f);
    if (existsSync(p))
      try {
        return String(JSON.parse(readFileSync(p, "utf8")).description ?? "");
      } catch {}
  }
  const readme = join(dir, "README.md");
  if (existsSync(readme)) {
    const line = readFileSync(readme, "utf8")
      .split("\n")
      .find(
        (l) =>
          l.trim() &&
          !l.startsWith("#") &&
          !l.startsWith("!") &&
          !l.startsWith("<"),
      );
    return (line ?? "").replace(/[*`_]/g, "").trim().slice(0, 200);
  }
  return "";
}

/** apps/* and every directory holding a wrangler config (Workers), from the checkout. */
export function inventory(
  projects: Project[],
  root = SRC_ROOT,
): InventoryItem[] {
  const deployed = new Set(projects.map((p) => p.path));
  const out: InventoryItem[] = [];
  const apps = join(root, "apps");
  for (const n of readdirSync(apps).sort()) {
    const d = join(apps, n);
    if (
      !existsSync(join(d, "package.json")) &&
      !existsSync(join(d, "Cargo.toml")) &&
      !existsSync(join(d, "README.md"))
    )
      continue;
    out.push({
      path: `apps/${n}`,
      kind: "app",
      name: n,
      description: describe(d),
      deployed: deployed.has(`apps/${n}`),
    });
  }
  for (const base of [
    "infra/cloudflare/workers",
    "infra/fleet/workers",
    "packages",
  ]) {
    const b = join(root, base);
    if (!existsSync(b)) continue;
    for (const n of readdirSync(b).sort()) {
      const d = join(b, n);
      const isWorker = [
        "wrangler.toml",
        "wrangler.jsonc",
        "cloudflare.config.ts",
      ].some((f) => existsSync(join(d, f)));
      if (!isWorker) continue;
      out.push({
        path: `${base}/${n}`,
        kind: "worker",
        name: n,
        description: describe(d),
        deployed: deployed.has(`${base}/${n}`),
      });
    }
  }
  return out;
}

const BLOB = "https://github.com/aphrody-labs/src/tree/main/";

/** Labs cards: the bets of docs/ALPHABET.md, then the public non-fork, non-archived aphrody-labs repositories. */
export async function labs(
  root = SRC_ROOT,
  token = Bun.env.GITHUB_TOKEN ?? Bun.env.GH_TOKEN,
): Promise<LabCard[]> {
  const a = parseAlphabet(
    readFileSync(join(root, "docs", "ALPHABET.md"), "utf8"),
  );
  const bets = section(a, "Paris")?.table?.rows ?? [];
  const cards: LabCard[] = bets.map((r) => {
    const path = firstPath(r[1] ?? "");
    return {
      name: plain(r[0] ?? ""),
      description: plain(r[2] ?? ""),
      metric: plain(r[3] ?? ""),
      url: path ? BLOB + path : "https://github.com/aphrody-labs/src",
      source: "alphabet" as const,
    };
  });
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "aphrody-deploy",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  for (let page = 1; page < 10; page++) {
    const r = await fetch(
      `https://api.github.com/orgs/aphrody-labs/repos?type=public&per_page=100&page=${page}`,
      { headers },
    );
    if (!r.ok) throw new Error(`GitHub repos: HTTP ${r.status}`);
    const list = (await r.json()) as any[];
    for (const x of list)
      if (!x.fork && !x.archived && x.description)
        cards.push({
          name: x.name,
          description: x.description,
          url: x.html_url,
          homepage: x.homepage || undefined,
          language: x.language || undefined,
          pushedAt: x.pushed_at,
          source: "github",
        });
    if (list.length < 100) break;
  }
  return cards;
}

export async function buildRegistry(
  commit: string,
  root = SRC_ROOT,
): Promise<Registry> {
  const projects = loadProjects(root);
  const brand = readBrand(root);
  return {
    generatedAt: new Date().toISOString(),
    commit,
    projects,
    inventory: inventory(projects, root),
    labs: await labs(root),
    css: tokensCss(root),
    mark: brand.mark,
  };
}

/** Projects whose watch globs match one of the changed paths. */
export function affected(projects: Project[], changed: string[]): Project[] {
  return projects.filter((p) =>
    p.watch.some((g) => {
      const glob = new Bun.Glob(g);
      return changed.some((c) => glob.match(c));
    }),
  );
}

/** Build cache key: SHA-256 over the git-tracked files matched by `watch`, bun.lock and the build command. */
export function cacheKey(
  p: Project,
  root = SRC_ROOT,
  tracked?: string[],
): string {
  const files =
    tracked ??
    Bun.spawnSync(["git", "ls-files", "-z"], { cwd: root })
      .stdout.toString()
      .split("\0")
      .filter(Boolean);
  const globs = p.watch.map((g) => new Bun.Glob(g));
  const picked = files
    .filter((f) => globs.some((g) => g.match(f)))
    .concat("bun.lock")
    .sort();
  const h = new Bun.CryptoHasher("sha256");
  h.update(`build\0${p.build}\0out\0${p.out}\0`);
  for (const f of new Set(picked)) {
    h.update(`${f}\0`);
    h.update(
      existsSync(join(root, f))
        ? new Bun.CryptoHasher("sha256")
            .update(readFileSync(join(root, f)))
            .digest("hex")
        : "-",
    );
  }
  return h.digest("hex");
}

export interface BuildCache {
  key: string;
  project: string;
  sha: string; // deployment that holds the files
  files: Record<string, string>; // path -> sha256
  bytes: number;
  at: string;
}

export const cachePath = (p: string, key: string, root = SRC_ROOT) =>
  join(root, "deploys", p, "_cache", `${key}.json`);

/** Content manifest of a build output: relative path -> sha256 (exclusions applied). */
export function manifest(
  dir: string,
  exclude: string[],
): Record<string, string> {
  const skip = exclude.map((g) => new Bun.Glob(g));
  const out: Record<string, string> = {};
  for (const rel of [...new Bun.Glob("**/*").scanSync({ cwd: dir, dot: true })]
    .map((f) => f.replace(/\\/g, "/"))
    .sort())
    if (!skip.some((g) => g.match(rel)))
      out[rel] = new Bun.CryptoHasher("sha256")
        .update(readFileSync(join(dir, rel)))
        .digest("hex");
  return out;
}

/** Files of `next` that are new or changed against `prev`. */
export function changedFiles(
  prev: Record<string, string> | undefined,
  next: Record<string, string>,
): string[] {
  return Object.keys(next).filter((k) => prev?.[k] !== next[k]);
}

/** Budget breaches of a project's p75 vitals (metrics without samples are not judged). */
export function overBudget(
  p: Project,
  vitals: Record<string, { p75: number; n: number }>,
): string[] {
  return Object.entries(p.budgets ?? {}).flatMap(([k, max]) => {
    const v = vitals[k];
    return v && v.n > 0 && max !== undefined && v.p75 > max
      ? [`${k} p75 ${v.p75} > budget ${max} (n ${v.n})`]
      : [];
  });
}
