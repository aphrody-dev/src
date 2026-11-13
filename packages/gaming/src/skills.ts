// Generated mirrors of the steam plugin skills. Source of truth: apps/rosegriffon/plugins/steam/skills/<name>;
// mirror: .agents/skills/<name> (read by every agent, and by Claude Code through .claude/skills).
// `ay gaming skills sync` rewrites the mirror; `ay gaming skills check` fails when it drifts.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";

export const PLUGIN = "apps/rosegriffon/plugins/steam";

/** Plugin-relative paths become repo-relative in the mirror. */
export function rewrite(text: string): string {
  return text
    .replaceAll("${CLAUDE_PLUGIN_ROOT}", PLUGIN)
    .replace(/(?<![\w/.-])plugins\/steam\//g, `${PLUGIN}/`);
}

function files(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string): void => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else out.push(p);
    }
  };
  walk(dir);
  return out.sort();
}

export interface Drift {
  skill: string;
  file: string;
  kind: "missing" | "changed" | "extra";
}

/** Compares (or, with write, regenerates) every mirrored skill. */
export function syncSkills(root: string, write: boolean): Drift[] {
  const src = join(root, PLUGIN, "skills");
  const dst = join(root, ".agents", "skills");
  const drift: Drift[] = [];
  for (const skill of readdirSync(src)
    .filter((n) => statSync(join(src, n)).isDirectory())
    .sort()) {
    const from = join(src, skill);
    const to = join(dst, skill);
    const want = new Map(
      files(from).map((f) => [
        relative(from, f),
        rewrite(readFileSync(f, "utf8")),
      ]),
    );
    const have = existsSync(to) ? files(to).map((f) => relative(to, f)) : [];
    for (const [rel, text] of want) {
      const target = join(to, rel);
      const cur = existsSync(target) ? readFileSync(target, "utf8") : null;
      if (cur === text) continue;
      drift.push({
        skill,
        file: rel,
        kind: cur === null ? "missing" : "changed",
      });
      if (write) {
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, text);
      }
    }
    for (const rel of have)
      if (!want.has(rel)) {
        drift.push({ skill, file: rel, kind: "extra" });
        if (write) rmSync(join(to, rel));
      }
  }
  return drift;
}
