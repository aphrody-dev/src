// Thin, synchronous wrappers over git and gh. Nothing here touches the working tree unless the
// caller asks for it: the stack is rebuilt with plumbing (merge-tree, commit-tree, update-ref).
import { existsSync } from "node:fs";
import { join } from "node:path";

export type Run = { code: number; out: string; err: string };

export function run(
  cmd: string[],
  opts: { cwd?: string; env?: Record<string, string>; stdin?: string } = {},
): Run {
  const r = Bun.spawnSync(cmd, {
    cwd: opts.cwd,
    env: { ...process.env, ...credEnv(), ...opts.env },
    stdin: opts.stdin === undefined ? "ignore" : Buffer.from(opts.stdin),
    stdout: "pipe",
    stderr: "pipe",
  });
  return {
    code: r.exitCode ?? 1,
    out: r.stdout.toString(),
    err: r.stderr.toString(),
  };
}

export class GitError extends Error {}

export function git(
  cwd: string,
  args: string[],
  env?: Record<string, string>,
  stdin?: string,
): string {
  const r = run(["git", ...args], { cwd, env, stdin });
  if (r.code !== 0)
    throw new GitError(
      `git ${args.join(" ")}: ${r.err.trim() || r.out.trim()}`,
    );
  return r.out.replace(/\n$/, "");
}

export function gitTry(
  cwd: string,
  args: string[],
  env?: Record<string, string>,
): Run {
  return run(["git", ...args], { cwd, env });
}

export type Commit = {
  sha: string;
  tree: string;
  parents: string[];
  authorName: string;
  authorEmail: string;
  authorDate: string;
  message: string;
};

const SEP = "\x1f";
const END = "\x1e";

/** Commits of `range`, oldest first, with what commit-tree needs to recreate them. */
export function commits(cwd: string, range: string): Commit[] {
  const out = git(cwd, [
    "log",
    "--reverse",
    `--format=%H${SEP}%T${SEP}%P${SEP}%an${SEP}%ae${SEP}%aI${SEP}%B${END}`,
    range,
  ]);
  return out
    .split(END)
    .map((s) => s.replace(/^\n/, ""))
    .filter((s) => s.length > 0)
    .map((s) => {
      const [sha, tree, parents, authorName, authorEmail, authorDate, message] =
        s.split(SEP);
      return {
        sha: sha!,
        tree: tree!,
        parents: parents!.split(" ").filter(Boolean),
        authorName: authorName!,
        authorEmail: authorEmail!,
        authorDate: authorDate!,
        message: message!.replace(/\n+$/, "\n"),
      };
    });
}

/** Recreate `c` with another parent, tree and message; author kept, committer = the current identity. */
export function commitTree(
  cwd: string,
  c: Commit,
  tree: string,
  parent: string,
  message = c.message,
): string {
  return git(
    cwd,
    ["commit-tree", tree, "-p", parent, "-F", "-"],
    {
      GIT_AUTHOR_NAME: c.authorName,
      GIT_AUTHOR_EMAIL: c.authorEmail,
      GIT_AUTHOR_DATE: c.authorDate,
    },
    message,
  );
}

/**
 * Tree of `c` cherry-picked onto `onto`, computed by `git merge-tree` (no checkout, no index).
 * Returns null with the conflicting paths when it does not apply.
 */
export function pickTree(
  cwd: string,
  c: Commit,
  onto: string,
): { tree: string } | { conflicts: string[] } {
  const base = c.parents[0];
  if (!base) throw new GitError(`${c.sha}: root commit cannot be replayed`);
  const r = gitTry(cwd, [
    "merge-tree",
    "--write-tree",
    "--name-only",
    "--no-messages",
    `--merge-base=${base}`,
    onto,
    c.sha,
  ]);
  const lines = r.out.split("\n").filter(Boolean);
  if (r.code === 0) return { tree: lines[0]! };
  if (r.code === 1) return { conflicts: lines.slice(1) };
  throw new GitError(`git merge-tree ${c.sha}: ${r.err.trim()}`);
}

export function treeOf(cwd: string, rev: string): string {
  return git(cwd, ["rev-parse", `${rev}^{tree}`]);
}

export function revParse(cwd: string, rev: string): string | null {
  const r = gitTry(cwd, [
    "rev-parse",
    "--verify",
    "--quiet",
    `${rev}^{commit}`,
  ]);
  return r.code === 0 ? r.out.trim() : null;
}

export function isClean(cwd: string): boolean {
  return (
    git(cwd, ["status", "--porcelain", "--untracked-files=no"]).trim() === ""
  );
}

export function currentBranch(cwd: string): string | null {
  const r = gitTry(cwd, ["symbolic-ref", "--quiet", "--short", "HEAD"]);
  return r.code === 0 ? r.out.trim() : null;
}

export function isRepo(dir: string): boolean {
  // Work tree clone (.git) or bare clone (HEAD + objects at the top).
  return (
    existsSync(join(dir, ".git")) ||
    (existsSync(join(dir, "HEAD")) && existsSync(join(dir, "objects")))
  );
}

/** Files touched by a commit (first parent). */
export function filesOf(cwd: string, sha: string): string[] {
  return git(cwd, [
    "diff-tree",
    "--no-commit-id",
    "--name-only",
    "-r",
    `${sha}^`,
    sha,
  ])
    .split("\n")
    .filter(Boolean);
}

// Long-lived credentials of the fleet runner user (Linux): `systemd-creds --user` in
// ~/.config/credstore.encrypted/<NAME>, same store as infra/agents/runner.ts. Decrypted into the child
// environment only, never argv or files.
let creds: Record<string, string> | null = null;
function credEnv(): Record<string, string> {
  if (creds) return creds;
  creds = {};
  if (process.platform === "win32" || !process.env.HOME || process.env.GH_TOKEN)
    return creds;
  const f = join(
    process.env.HOME,
    ".config",
    "credstore.encrypted",
    "GH_TOKEN",
  );
  if (!existsSync(f)) return creds;
  const r = Bun.spawnSync(
    ["systemd-creds", "--user", "--name=GH_TOKEN", "decrypt", f, "-"],
    {
      stdout: "pipe",
      stderr: "ignore",
    },
  );
  if (r.exitCode === 0) creds.GH_TOKEN = r.stdout.toString().trim();
  return creds;
}

/** `gh api` returning parsed JSON, or null on HTTP error (404 included). */
export function ghApi<T = any>(path: string, args: string[] = []): T | null {
  const r = run(["gh", "api", path, ...args]);
  if (r.code !== 0) return null;
  try {
    return JSON.parse(r.out) as T;
  } catch {
    return null;
  }
}

export function gh(args: string[], stdin?: string): Run {
  return run(["gh", ...args], { stdin });
}
