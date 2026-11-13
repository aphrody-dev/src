// Stack engine: load infra/upstream/stacks.toml, read the series, replay it on upstream, mark statuses,
// build ephemeral PR heads. Branch-model stacks are rebuilt with plumbing only (merge-tree + commit-tree):
// the working tree of the checkout is never written, except a `git reset --keep` of the default branch
// when it is the checked-out branch.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import {
  commitTree,
  commits,
  currentBranch,
  filesOf,
  git,
  gitTry,
  isClean,
  isRepo,
  pickTree,
  revParse,
  treeOf,
  type Commit,
} from "./git.ts";
import {
  parseMessage,
  slug,
  withMeta,
  type Meta,
  type Status,
} from "./patch.ts";

export type StackConfig = {
  name: string;
  model: "branch" | "series" | "mirror";
  upstream: string;
  upstream_url: string;
  github_upstream?: string; // GitHub mirror of a non-GitHub upstream (compare API)
  ref: string;
  fork: string;
  branch: string;
  checkout: string;
  series?: string;
  forge: "github" | "gerrit";
  gerrit?: string;
  rules: string;
  runner: string;
  optional?: boolean;
  lint_workflows?: string[];
  group?: string; // `ay upstream sync <group>` selects every stack of the group (stacks.d/<group>.toml)
};

export function repoRoot(): string {
  if (process.env.SRC_ROOT) return resolve(process.env.SRC_ROOT);
  let dir = process.cwd();
  for (;;) {
    if (
      existsSync(join(dir, "identity.toml")) ||
      existsSync(join(dir, "src.lock.json"))
    )
      return dir;
    const up = resolve(dir, "..");
    if (up === dir) return process.cwd();
    dir = up;
  }
}

export function loadStacks(
  root = repoRoot(),
  file = join(root, "infra", "upstream", "stacks.toml"),
): StackConfig[] {
  // stacks.toml, then every stacks.d/<group>.toml next to it (group = file name unless set).
  const read = (f: string, group?: string): StackConfig[] => {
    const doc = Bun.TOML.parse(readFileSync(f, "utf8")) as {
      stack?: Record<string, Omit<StackConfig, "name">>;
    };
    return Object.entries(doc.stack ?? {}).map(([name, s]) => ({ name, ...(group ? { group } : {}), ...s }));
  };
  const dropins = join(dirname(file), "stacks.d");
  return [
    ...read(file),
    ...(existsSync(dropins)
      ? readdirSync(dropins)
          .filter((f) => f.endsWith(".toml"))
          .sort()
          .flatMap((f) => read(join(dropins, f), f.slice(0, -5)))
      : []),
  ];
}

export function stackDir(root: string, s: StackConfig): string {
  // Runner override, e.g. AY_UPSTREAM_CHECKOUT_CHROMIUM=/srv/chromium/src on fr1.
  const env = process.env[`AY_UPSTREAM_CHECKOUT_${s.name.toUpperCase()}`];
  return resolve(root, env || s.checkout);
}

/** Make sure the checkout exists: an existing clone, or a blobless bare clone of the fork (runners). */
export function ensureCheckout(root: string, s: StackConfig): string {
  const dir = stackDir(root, s);
  const forkUrl =
    s.forge === "gerrit" ? s.upstream_url : `https://github.com/${s.fork}.git`;
  if (!isRepo(dir)) {
    mkdirSync(resolve(dir, ".."), { recursive: true });
    git(root, [
      "clone",
      "--bare",
      "--filter=blob:none",
      "--branch",
      s.branch,
      forkUrl,
      dir,
    ]);
  }
  return dir;
}

export function fetchBoth(dir: string, s: StackConfig): void {
  // By URL: the Chromium checkout of gclient names upstream `origin`, the forks name it `upstream`.
  git(dir, [
    "fetch",
    "--quiet",
    s.upstream_url,
    `+refs/heads/${s.ref}:refs/remotes/upstream/${s.ref}`,
  ]);
  if (s.model === "branch")
    git(dir, [
      "fetch",
      "--quiet",
      "origin",
      `+refs/heads/${s.branch}:refs/remotes/origin/${s.branch}`,
    ]);
}

export type Patch = {
  index: number;
  sha: string; // commit (branch model) or file name (series model)
  slug: string;
  meta: Meta;
  authorEmail: string;
  files: string[];
  commit?: Commit;
  file?: string;
};

/** The series of a branch-model stack: commits from merge-base(tip, upstream) to tip. */
export function branchSeries(
  dir: string,
  s: StackConfig,
  tip: string,
): { base: string; patches: Patch[] } {
  const up = `refs/remotes/upstream/${s.ref}`;
  const base = git(dir, ["merge-base", tip, up]);
  const merges = git(dir, ["rev-list", "--merges", `${base}..${tip}`]).trim();
  if (merges)
    throw new Error(
      `${s.name}: commits de fusion dans la pile (${merges.split("\n").length}) : pile linéaire attendue`,
    );
  const list = commits(dir, `${base}..${tip}`);
  // The status registry is keyed by slug: two patches with one slug would share a status.
  const seen = new Map<string, string>();
  for (const c of list) {
    const k = slug(c.message.split("\n")[0] ?? "");
    if (seen.has(k))
      throw new Error(
        `${s.name}: deux patchs ont le même nom « ${k} » (${seen.get(k)!.slice(0, 10)}, ${c.sha.slice(0, 10)}) : changer un sujet`,
      );
    seen.set(k, c.sha);
  }
  return {
    base,
    patches: list.map((c, i) => ({
      index: i + 1,
      sha: c.sha,
      slug: slug(c.message.split("\n")[0] ?? ""),
      meta: parseMessage(c.message),
      authorEmail: c.authorEmail,
      files: filesOf(dir, c.sha),
      commit: c,
    })),
  };
}

/** The series of a series-model stack: `.patches` order, mbox headers parsed for subject and trailers. */
export function fileSeries(root: string, s: StackConfig): Patch[] {
  const dir = resolve(root, s.series!);
  const order = existsSync(join(dir, ".patches"))
    ? readFileSync(join(dir, ".patches"), "utf8")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#"))
    : [];
  return order.map((name, i) => {
    const text = readFileSync(join(dir, name), "utf8");
    const headerEnd = text.indexOf("\n---\n");
    const head = headerEnd < 0 ? text : text.slice(0, headerEnd);
    const subjectLine =
      /^Subject: (?:\[PATCH[^\]]*\] )?(.*)$/m.exec(head)?.[1] ?? name;
    const from = /^From: .*<([^>]+)>/m.exec(head)?.[1] ?? "";
    const bodyStart = head.indexOf("\n\n");
    const body = bodyStart < 0 ? "" : head.slice(bodyStart + 2);
    const files = [...text.matchAll(/^diff --git a\/(\S+) b\//gm)].map(
      (m) => m[1]!,
    );
    return {
      index: i + 1,
      sha: name,
      slug: name.replace(/\.patch$/, ""),
      meta: parseMessage(subjectLine + "\n\n" + body),
      authorEmail: from,
      files,
      file: join(dir, name),
    };
  });
}

export type ReplayResult =
  | {
      ok: true;
      head: string;
      kept: Patch[];
      dropped: { patch: Patch; why: string }[];
    }
  | {
      ok: false;
      patch: Patch;
      conflicts: string[];
      applied: number;
      dropped: { patch: Patch; why: string }[];
    };

/**
 * Replay `patches` on `onto`. A patch is dropped when `drop` says so (merged upstream) or when it
 * becomes empty on the new base (upstream already has the change). The first conflict stops the replay.
 */
export function replay(
  dir: string,
  patches: Patch[],
  onto: string,
  drop: (p: Patch) => string | null,
  message: (p: Patch) => string = (p) => p.commit!.message,
): ReplayResult {
  let head = onto;
  const kept: Patch[] = [];
  const dropped: { patch: Patch; why: string }[] = [];
  for (const p of patches) {
    const why = drop(p);
    if (why) {
      dropped.push({ patch: p, why });
      continue;
    }
    const r = pickTree(dir, p.commit!, head);
    if ("conflicts" in r)
      return {
        ok: false,
        patch: p,
        conflicts: r.conflicts,
        applied: kept.length,
        dropped,
      };
    if (r.tree === treeOf(dir, head)) {
      dropped.push({
        patch: p,
        why: "vide sur la nouvelle base : changement déjà présent en amont",
      });
      continue;
    }
    head = commitTree(dir, p.commit!, r.tree, head, message(p));
    kept.push(p);
  }
  return { ok: true, head, kept, dropped };
}

/** Move the fork's default branch to `head` in the checkout (reset --keep when it is checked out). */
export function moveBranch(
  dir: string,
  s: StackConfig,
  head: string,
  old: string,
): void {
  const bare = git(dir, ["rev-parse", "--is-bare-repository"]) === "true";
  if (!bare && currentBranch(dir) === s.branch) {
    if (!isClean(dir))
      throw new Error(
        `${dir} : modifications locales, branche ${s.branch} non déplacée`,
      );
    git(dir, ["reset", "--quiet", "--keep", head]);
  } else {
    git(dir, ["update-ref", `refs/heads/${s.branch}`, head, old]);
  }
}

export function push(
  dir: string,
  s: StackConfig,
  head: string,
  lease: string,
): void {
  git(dir, [
    "push",
    "--quiet",
    `--force-with-lease=refs/heads/${s.branch}:${lease}`,
    "origin",
    `${head}:refs/heads/${s.branch}`,
  ]);
}

/** Rewrite the message of one patch of a branch stack (trees unchanged, so no merge needed). */
export function rewriteMessage(
  dir: string,
  base: string,
  patches: Patch[],
  target: Patch,
  meta: Pick<Meta, "status" | "statusNote" | "pr" | "owner">,
): string {
  let head = base;
  for (const p of patches) {
    const msg =
      p === target ? withMeta(p.commit!.message, meta) : p.commit!.message;
    head = commitTree(dir, p.commit!, p.commit!.tree, head, msg);
  }
  return head;
}

export function findPatch(patches: Patch[], key: string): Patch {
  const n = Number(key);
  const hits = patches.filter(
    (p) =>
      (Number.isInteger(n) && p.index === n) ||
      p.sha.startsWith(key) ||
      p.slug === key ||
      p.slug.startsWith(key),
  );
  if (hits.length !== 1)
    throw new Error(`patch « ${key} » : ${hits.length} correspondance(s)`);
  return hits[0]!;
}

export function stateDir(root: string, s: StackConfig): string {
  const d = join(root, "var", "upstream", s.name);
  mkdirSync(d, { recursive: true });
  return d;
}

export function writeState(
  root: string,
  s: StackConfig,
  file: string,
  data: unknown,
): string {
  const f = join(stateDir(root, s), file);
  writeFileSync(f, JSON.stringify(data, null, 2) + "\n");
  return f;
}

export function readState<T>(
  root: string,
  s: StackConfig,
  file: string,
): T | null {
  const f = join(root, "var", "upstream", s.name, file);
  if (!existsSync(f)) return null;
  try {
    return JSON.parse(readFileSync(f, "utf8")) as T;
  } catch {
    return null;
  }
}

/** Series model: does every patch still apply on the upstream tip? Checked on a scratch index. */
export function checkSeries(
  root: string,
  dir: string,
  s: StackConfig,
  patches: Patch[],
): { ok: boolean; failed?: Patch; err?: string } {
  if (patches.length === 0) return { ok: true };
  const index = join(stateDir(root, s), "scratch.index");
  const env = { GIT_INDEX_FILE: index };
  git(dir, ["read-tree", `refs/remotes/upstream/${s.ref}`], env);
  for (const p of patches) {
    const r = gitTry(dir, ["apply", "--cached", "--3way", p.file!], env);
    if (r.code !== 0) return { ok: false, failed: p, err: r.err.trim() };
  }
  return { ok: true };
}

/** Electron's git-export-patches flags (script/lib/git.py format_patch): stable, diff-friendly files. */
export function exportSeries(
  dir: string,
  range: string,
  out: string,
): string[] {
  mkdirSync(out, { recursive: true });
  for (const f of readdirSync(out))
    if (f.endsWith(".patch")) rmSync(join(out, f));
  const list = commits(dir, range);
  const names: string[] = [];
  for (const c of list) {
    const name = slug(c.message.split("\n")[0] ?? "") + ".patch";
    const text = git(dir, [
      "-c",
      "diff.renames=true",
      "format-patch",
      "--keep-subject",
      "--no-stat",
      "--stdout",
      "--no-signature",
      "--zero-commit",
      "--full-index",
      "--ignore-submodules=all",
      "-1",
      c.sha,
    ]);
    writeFileSync(join(out, name), text + "\n");
    names.push(name);
  }
  writeFileSync(
    join(out, ".patches"),
    names.join("\n") + (names.length ? "\n" : ""),
  );
  return names;
}

export function addedLines(dir: string, p: Patch): string {
  if (p.file) {
    return readFileSync(p.file, "utf8")
      .split("\n")
      .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
      .join("\n");
  }
  return git(dir, ["diff", `${p.sha}^`, p.sha, "--unified=0"])
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .join("\n");
}

export const STATUSES: Status[] = [
  "pending",
  "submitted",
  "backport",
  "denied",
  "inappropriate",
];
export { revParse };
