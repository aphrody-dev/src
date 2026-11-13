// Bridge to the Rust half: `ay steam <sub>` prints JSON computed by crates/steam-depot (VDF text and
// binary, appinfo.vdf, appmanifest_*.acf, libraryfolders.vdf, compat tools, Proton env). One parser
// per format in the monorepo; this file only spawns and decodes. Ownership: docs/gaming/OWNERSHIP.md.
import { existsSync } from "node:fs";
import { join } from "node:path";

/** `ay` to run: $AY_BIN, then `ay` on PATH, then the workspace build under $SRC_ROOT/target. */
export function ayBin(): string {
  const env = process.env.AY_BIN;
  if (env) return env;
  const onPath = Bun.which("ay");
  if (onPath) return onPath;
  const root = process.env.SRC_ROOT;
  const exe = process.platform === "win32" ? "ay.exe" : "ay";
  if (root)
    for (const profile of ["release", "debug"]) {
      const p = join(root, "target", profile, exe);
      if (existsSync(p)) return p;
    }
  return "ay";
}

export class NativeError extends Error {}

/** Runs `ay steam <args>` and parses its JSON. `root` adds `--root`. */
export function steamJson<T = unknown>(args: string[], root?: string): T {
  const argv = [ayBin(), "steam", ...(root ? ["--root", root] : []), ...args];
  let r: { stdout: Buffer; stderr: Buffer; exitCode: number | null };
  try {
    r = Bun.spawnSync(argv, { stdout: "pipe", stderr: "pipe" });
  } catch (e) {
    throw new NativeError(
      `ay not found (${(e as Error).message}); install it with \`ay self-update\` or set AY_BIN`,
    );
  }
  const err = r.stderr.toString().trim();
  if (r.exitCode !== 0) {
    if (/unrecognized subcommand 'steam'|invalid value 'steam'/.test(err))
      throw new NativeError(
        "this ay has no `steam` command; update it (`ay self-update`) or set AY_BIN",
      );
    throw new NativeError(
      err || `ay steam ${args.join(" ")}: exit ${r.exitCode}`,
    );
  }
  return JSON.parse(r.stdout.toString()) as T;
}
