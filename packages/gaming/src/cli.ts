#!/usr/bin/env bun
// ay gaming: the gaming stack of the host and its reproducible wrappers. Doc: docs/gaming/OWNERSHIP.md.
import { existsSync } from "node:fs";
import { agilitySdk, protonDx, windowsDx } from "./dx.ts";
import { forkPins } from "./forks.ts";
import { NativeError } from "./native.ts";
import { run } from "./proton.ts";
import { syncSkills } from "./skills.ts";
import { compatTools, findSteamRoot, listApps, type CompatTool } from "./steam.ts";
import {
  appUpdateArgs,
  hostPlatform,
  installSteamcmd,
  loadDownloads,
  resolveApp,
  runSteamcmd,
  srcRoot,
  steamcmdExe,
} from "./steamcmd.ts";
import { vulkanInfoSummary, vulkanManifests } from "./vulkan.ts";

const HELP = `ay gaming <command> [--json]

  status                       Steam root, apps, compat tools, Vulkan layers, DirectX, steamcmd
  apps [--filter <text>]       installed apps (appmanifest_*.acf, via ay steam)
  proton                       Proton / Steam Linux Runtime / compatibilitytools.d, with their DXVK and vkd3d-proton
  layers [--info]              Vulkan ICDs and implicit/explicit layers (--info adds vulkaninfo --summary)
  dx                           DirectX: DXGI adapters and D3D12 runtime (Windows), Agility SDK per game
  forks                        gaming forks pinned in src.lock.json and their variants
  steamcmd install             official steamcmd into the per-user tool dir (infra/gaming/downloads.toml)
  steamcmd app-update <name|appid> --dir <d> [--user <u>] [--beta <b>] [--platform linux|windows|macos] [--dry-run]
  steamcmd run -- <steamcmd args>
  run <exe> --prefix <dir> [--tool <name> | --tool-path <dir>] [--app <id>] [--dry-run] [-- args]
                               Proton outside Steam (umu-run, else <proton>/proton); native on Windows
  skills sync|check            regenerate or verify .agents/skills/steam-* from the steam plugin

Options: --root <steam root> (default: $STEAM_PATH or the detected install). Low-level data: ay steam --help.`;

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

function out(v: unknown, json: boolean, text: () => string): void {
  console.log(json ? JSON.stringify(v, null, 2) : text());
}

function tryRoot(argv: string[]): string | undefined {
  try {
    return flag(argv, "--root") ?? findSteamRoot();
  } catch {
    return undefined;
  }
}

async function status(argv: string[], json: boolean): Promise<number> {
  let native: string | null = null;
  let root: string | undefined;
  try {
    root = flag(argv, "--root") ?? findSteamRoot();
  } catch (e) {
    native = (e as Error).message;
  }
  let apps = 0;
  let tools: CompatTool[] = [];
  if (root)
    try {
      apps = (await listApps(root)).length;
      tools = compatTools(root);
    } catch (e) {
      native = (e as Error).message;
    }
  const layers = vulkanManifests();
  const d = loadDownloads();
  const s = {
    platform: hostPlatform(),
    steam_root: root ?? null,
    apps,
    compat_tools: tools.map((t) => t.display_name ?? t.name),
    vulkan: {
      icds: layers.filter((l) => l.kind === "icd").length,
      implicit_layers: layers.filter((l) => l.kind === "implicit_layer").map((l) => l.name),
      explicit_layers: layers.filter((l) => l.kind === "explicit_layer").length,
    },
    dx: process.platform === "win32" ? windowsDx() : protonDx(tools),
    steamcmd: existsSync(steamcmdExe(d)) ? steamcmdExe(d) : null,
    native_error: native,
  };
  out(s, json, () =>
    [
      `platform     ${s.platform}`,
      `steam root   ${s.steam_root ?? "(none)"}`,
      `apps         ${s.apps}`,
      `compat tools ${s.compat_tools.join(", ") || "(none)"}`,
      `vulkan       ${s.vulkan.icds} ICD, ${s.vulkan.implicit_layers.length} implicit layers (${s.vulkan.implicit_layers.join(", ")}), ${s.vulkan.explicit_layers} explicit`,
      `steamcmd     ${s.steamcmd ?? "not installed (ay gaming steamcmd install)"}`,
      ...(native ? [`ay steam     ${native}`] : []),
    ].join("\n"),
  );
  return native ? 1 : 0;
}

async function steamcmd(argv: string[], json: boolean): Promise<number> {
  const [sub, ...rest] = argv;
  if (sub === "install") {
    const exe = await installSteamcmd();
    out({ exe }, json, () => exe);
    return 0;
  }
  if (sub === "app-update") {
    const app = resolveApp(rest[0] ?? "");
    const dir = flag(rest, "--dir");
    if (!dir) throw new Error("--dir is required");
    const args = appUpdateArgs({
      app: app.appid,
      dir,
      platform: flag(rest, "--platform") ?? app.platform,
      beta: flag(rest, "--beta"),
      user: flag(rest, "--user"),
    });
    if (rest.includes("--dry-run")) {
      out({ exe: steamcmdExe(), args }, json, () => [steamcmdExe(), ...args].join(" "));
      return 0;
    }
    return await runSteamcmd(args);
  }
  if (sub === "run") {
    const i = rest.indexOf("--");
    return await runSteamcmd(i >= 0 ? rest.slice(i + 1) : rest);
  }
  console.error("ay gaming steamcmd: install | app-update <name|appid> --dir <d> | run -- <args>");
  return 2;
}

export async function main(argv: string[]): Promise<number> {
  const json = argv.includes("--json");
  const args = argv.filter((a) => a !== "--json");
  const [cmd, ...rest] = args;
  const root = srcRoot();
  switch (cmd) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      console.log(HELP);
      return cmd === undefined ? 2 : 0;
    case "status":
      return await status(rest, json);
    case "apps": {
      const r = tryRoot(rest);
      if (!r) throw new Error("no Steam installation found (--root or STEAM_PATH)");
      const apps = await listApps(r, flag(rest, "--filter"));
      out(apps, json, () => apps.map((a) => `${a.appid}\t${a.name}\t${a.state.join(",")}\t${a.install_path}`).join("\n"));
      return 0;
    }
    case "proton": {
      const r = tryRoot(rest);
      const tools = r ? compatTools(r) : [];
      const dx = protonDx(tools);
      out({ tools, dx }, json, () =>
        tools.map((t) => `${t.kind}\t${t.display_name ?? t.name}\t${t.version ?? ""}\t${t.path}`).join("\n") || "(no compat tools)",
      );
      return 0;
    }
    case "layers": {
      const m = vulkanManifests();
      const info = rest.includes("--info") ? vulkanInfoSummary() : undefined;
      out({ manifests: m, vulkaninfo: info ?? null }, json, () =>
        [...m.map((l) => `${l.kind}\t${l.name ?? "?"}\t${l.api_version ?? ""}\t${l.file}`), ...(info ? ["", info] : [])].join("\n"),
      );
      return 0;
    }
    case "dx": {
      const r = tryRoot(rest);
      const apps = r ? await listApps(r) : [];
      const agility = apps.map((a) => ({ appid: a.appid, name: a.name, agility_sdk: agilitySdk(a.install_path) })).filter((a) => a.agility_sdk);
      const host = process.platform === "win32" ? windowsDx() : null;
      const proton = r && process.platform !== "win32" ? protonDx(compatTools(r)) : [];
      out({ host, proton, agility }, json, () => JSON.stringify({ host, proton, agility }, null, 2));
      return 0;
    }
    case "forks": {
      const pins = forkPins(root);
      out(pins, json, () => pins.map((p) => `${p.name}\t${p.commit?.slice(0, 12) ?? "(not pinned)"}\t${p.branch ?? ""}\t${p.variants.join(",")}`).join("\n"));
      return 0;
    }
    case "steamcmd":
      return await steamcmd(rest, json);
    case "run": {
      const exe = rest[0];
      const prefix = flag(rest, "--prefix");
      if (!exe || !prefix) throw new Error("usage: ay gaming run <exe> --prefix <dir> [--tool <name>] [-- args]");
      const i = rest.indexOf("--");
      return await run({
        exe,
        prefix,
        args: i >= 0 ? rest.slice(i + 1) : [],
        app: flag(rest, "--app") ? Number(flag(rest, "--app")) : undefined,
        tool: flag(rest, "--tool"),
        toolPath: flag(rest, "--tool-path"),
        root: tryRoot(rest),
        dryRun: rest.includes("--dry-run"),
      });
    }
    case "skills": {
      const write = rest[0] === "sync";
      if (!write && rest[0] !== "check") {
        console.error("ay gaming skills sync|check");
        return 2;
      }
      const drift = syncSkills(root, write);
      out(drift, json, () => drift.map((d) => `${d.kind}\t${d.skill}/${d.file}`).join("\n") || "skills in sync");
      return write || drift.length === 0 ? 0 : 1;
    }
    default:
      console.error(`ay gaming: unknown command ${cmd}\n\n${HELP}`);
      return 2;
  }
}

if (import.meta.main) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (e) {
    console.error(`ay gaming: ${e instanceof NativeError ? e.message : (e as Error).message}`);
    process.exitCode = 1;
  }
}

