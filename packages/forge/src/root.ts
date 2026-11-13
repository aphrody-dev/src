// Repository root, cross-platform: $SRC_ROOT, nearest ancestor holding identity.toml,
// `git rev-parse --show-superproject-working-tree || --show-toplevel`, then ../../.. of this file.
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

function git(args: string[], cwd: string): string | null {
  const r = Bun.spawnSync(["git", ...args], {
    cwd,
    stdout: "pipe",
    stderr: "ignore",
  });
  const out = r.success ? r.stdout.toString().trim() : "";
  return out || null;
}

export function resolveSrcRoot(from: string = import.meta.dir): string {
  if (process.env.SRC_ROOT) return resolve(process.env.SRC_ROOT);
  for (let d = resolve(from); ; d = dirname(d)) {
    if (existsSync(join(d, "identity.toml"))) return d;
    if (dirname(d) === d) break;
  }
  const top =
    git(["rev-parse", "--show-superproject-working-tree"], from) ??
    git(["rev-parse", "--show-toplevel"], from);
  return top ? resolve(top) : resolve(from, "..", "..", "..");
}

export const SRC_ROOT = resolveSrcRoot();

/** Path under the repo root (native separators). */
export const srcPath = (...parts: string[]) => join(SRC_ROOT, ...parts);
