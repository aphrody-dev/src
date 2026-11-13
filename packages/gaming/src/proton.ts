// Proton outside the Steam client, reproducible on headless Linux hosts (prd, fr1) and as a native
// run on Windows. Two engines, picked in this order:
// 1. umu-run (third_party/umu-launcher, README "Optionally, with WINEPREFIX, GAMEID, STORE, and
//    PROTONPATH"): Proton inside the Steam Linux Runtime container, no Steam client needed.
// 2. `<proton>/proton waitforexitandrun <exe>` (third_party/Proton/proton) with the STEAM_COMPAT_*
//    environment computed by `ay steam env` (crates/steam-depot/src/proton.rs).
import { existsSync } from "node:fs";
import { join } from "node:path";
import { compatTools, launchEnv, type CompatTool } from "./steam.ts";

export interface RunOptions {
  exe: string;
  args?: string[];
  app?: number;
  /** Compat tool name or display name (default: newest Valve Proton found, else umu's UMU-Proton). */
  tool?: string;
  /** Proton directory used as is (e.g. installed by `ay gaming steamcmd app-update`). */
  toolPath?: string;
  prefix: string;
  root?: string;
  gameId?: string;
  dryRun?: boolean;
}

export interface RunPlan {
  engine: "umu" | "proton" | "native";
  argv: string[];
  env: Record<string, string>;
}

export function pickTool(tools: CompatTool[], want?: string): CompatTool | undefined {
  const protons = tools.filter((t) => existsSync(join(t.path, "proton")));
  if (want) return protons.find((t) => t.name === want || t.display_name === want);
  const rank = (t: CompatTool): number =>
    /experimental/i.test(t.name) ? 3 : t.kind === "valve" ? 2 : 1;
  return protons.sort((a, b) => rank(b) - rank(a) || b.name.localeCompare(a.name))[0];
}

export function planRun(o: RunOptions, tools: CompatTool[] = [], umu = Bun.which("umu-run")): RunPlan {
  const args = o.args ?? [];
  if (process.platform === "win32") return { engine: "native", argv: [o.exe, ...args], env: {} };
  const tool: CompatTool | undefined = o.toolPath
    ? { name: o.toolPath, display_name: null, path: o.toolPath, kind: "valve", source: "steam-apps", version: null }
    : pickTool(tools, o.tool);
  if (umu) {
    const env: Record<string, string> = { WINEPREFIX: o.prefix, GAMEID: o.gameId ?? (o.app ? `umu-${o.app}` : "umu-default") };
    if (tool) env.PROTONPATH = tool.path;
    return { engine: "umu", argv: [umu, o.exe, ...args], env };
  }
  if (!tool) throw new Error("no Proton found: install one (`ay gaming steamcmd app-update proton-experimental`) or umu-run");
  const app = o.app ?? 0;
  const le = launchEnv(app, { root: o.root, prefix: o.prefix, installPath: join(o.exe, "..") });
  return { engine: "proton", argv: [...le.wrapper, join(tool.path, "proton"), "waitforexitandrun", o.exe, ...args], env: le.env };
}

export async function run(o: RunOptions): Promise<number> {
  const tools = o.root && process.platform !== "win32" ? compatTools(o.root) : [];
  const plan = planRun(o, tools);
  if (o.dryRun) {
    console.log(JSON.stringify(plan, null, 2));
    return 0;
  }
  const p = Bun.spawn(plan.argv, { env: { ...process.env, ...plan.env }, stdio: ["inherit", "inherit", "inherit"] });
  return await p.exited;
}
