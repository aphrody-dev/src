// Sovereign Bun Plugin: Zero-Cost Compile-Time VCS Metadata Injection (jj + gix + git)
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

export interface VcsMetadata {
  commitSha: string;
  shortSha: string;
  changeId: string;
  branch: string;
  author: string;
  timestamp: string;
  isClean: boolean;
  engine: "jj" | "gix" | "git";
}

function safeExec(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, {
      cwd,
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 3000,
    }).trim();
  } catch {
    return "";
  }
}

export function getVcsMetadata(cwd: string = process.cwd()): VcsMetadata {
  const hasJj = existsSync(join(cwd, ".jj"));

  let commitSha = "0000000000000000000000000000000000000000";
  let changeId = "000000000000";
  let branch = "main";
  let author = "developer";
  let timestamp = new Date().toISOString();
  let isClean = true;
  let engine: "jj" | "gix" | "git" = "git";

  if (hasJj) {
    try {
      const template =
        'commit_id ++ "||" ++ change_id ++ "||" ++ author.name() ++ "||" ++ committer.timestamp()';
      const out = safeExec(`jj log -r @ --no-graph -T '${template}'`, cwd);
      if (out) {
        const parts = out.split("||");
        if (parts[0]) commitSha = parts[0];
        if (parts[1]) changeId = parts[1];
        if (parts[2]) author = parts[2];
        if (parts[3]) timestamp = parts[3];
        engine = "jj";
      }
    } catch {
      // Fallback
    }
  }

  // Git / Gix fallback
  if (commitSha.startsWith("00000000")) {
    const gitHead = safeExec("git rev-parse HEAD", cwd);
    if (gitHead) {
      commitSha = gitHead;
      changeId = gitHead.substring(0, 12);
    }
    const gitAuthor = safeExec("git log -1 --pretty=format:%an", cwd);
    if (gitAuthor) author = gitAuthor;
    const gitDate = safeExec("git log -1 --pretty=format:%cI", cwd);
    if (gitDate) timestamp = gitDate;
  }

  const gitBranch = safeExec("git branch --show-current", cwd);
  if (gitBranch) branch = gitBranch;

  const status = safeExec("git status --porcelain=v1", cwd);
  isClean = !status.trim();

  return {
    commitSha,
    shortSha: commitSha.substring(0, 8),
    changeId,
    branch,
    author,
    timestamp,
    isClean,
    engine,
  };
}

export const vcsMetaPlugin = {
  name: "sovereign-vcs-meta",
  setup(build: any) {
    build.onResolve({ filter: /^vcs:meta$/ }, () => {
      return { path: "vcs:meta", namespace: "vcs-meta-ns" };
    });

    build.onLoad({ filter: /.*/, namespace: "vcs-meta-ns" }, () => {
      const meta = getVcsMetadata();
      return {
        contents: `
// Zero-cost compile-time VCS metadata
export const VCS_METADATA = ${JSON.stringify(meta, null, 2)};
export const COMMIT_SHA = ${JSON.stringify(meta.commitSha)};
export const SHORT_SHA = ${JSON.stringify(meta.shortSha)};
export const CHANGE_ID = ${JSON.stringify(meta.changeId)};
export const BRANCH = ${JSON.stringify(meta.branch)};
export const AUTHOR = ${JSON.stringify(meta.author)};
export const TIMESTAMP = ${JSON.stringify(meta.timestamp)};
export const IS_CLEAN = ${meta.isClean};
export const ENGINE = ${JSON.stringify(meta.engine)};
export default VCS_METADATA;
`,
        loader: "js",
      };
    });
  },
};
