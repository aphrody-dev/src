import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  appUpdateArgs,
  forkPins,
  isSecretFile,
  loadDownloads,
  parseManifest,
  parseSteamId,
  pickTool,
  planRun,
  resolveApp,
  rewrite,
  steamdbLinks,
  syncSkills,
} from "../src/index.ts";

const root = join(import.meta.dir, "..", "..", "..");

test("SteamID forms", () => {
  const id = parseSteamId("STEAM_1:1:12345")!;
  expect(id.steamid64).toBe("76561197960290419");
  expect(parseSteamId("[U:1:24691]")!.steamid64).toBe(id.steamid64);
  expect(parseSteamId("gabelogannewell")).toBeNull();
});

test("credential files are refused", () => {
  for (const f of ["config/config.vdf", "loginusers.vdf", "local.vdf", "ssfn1234"]) expect(isSecretFile(f)).toBe(true);
  expect(isSecretFile("steamapps/libraryfolders.vdf")).toBe(false);
});

test("steamdb links", () => {
  expect(steamdbLinks("app", 2799860).depots).toBe("https://steamdb.info/app/2799860/depots/");
});

test("downloads manifest and steamcmd script", () => {
  const d = loadDownloads(root);
  expect(d.steamcmd.linux.url).toStartWith("https://steamcdn-a.akamaihd.net/");
  expect(resolveApp("proton-experimental", d).appid).toBe(1493710);
  expect(appUpdateArgs({ app: 1493710, dir: "/srv/proton", platform: "linux" })).toEqual([
    "+@sSteamCmdForcePlatformType", "linux", "+force_install_dir", "/srv/proton", "+login", "anonymous",
    "+app_update", "1493710", "validate", "+quit",
  ]);
});

test("Proton app ids agree with crates/steam-depot", () => {
  const rs = readFileSync(join(root, "crates", "steam-depot", "src", "proton.rs"), "utf8");
  const block = rs.slice(rs.indexOf("VALVE_PROTON_APPS"), rs.indexOf("];", rs.indexOf("VALVE_PROTON_APPS")));
  const fromRust = [...block.matchAll(/\("([^"]+)", ([\d_]+)\)/g)].map((m) => [m[1], Number(m[2]!.replaceAll("_", ""))]);
  const apps = Object.values(loadDownloads(root).apps);
  for (const [name, id] of fromRust) expect(apps.find((a) => a.appid === id)?.name).toBe(name as string);
  const sniper = Number(rs.match(/STEAM_LINUX_RUNTIME_SNIPER_APP_ID: u32 = ([\d_]+)/)![1]!.replaceAll("_", ""));
  expect(apps.some((a) => a.appid === sniper)).toBe(true);
});

test("vulkan manifests", () => {
  const layer = parseManifest("implicit_layer", "x.json", JSON.stringify({ file_format_version: "1.0.0", layer: { name: "VK_LAYER_VALVE_steam_overlay_64", api_version: "1.3.0", disable_environment: { DISABLE_VK_LAYER_VALVE_steam_overlay_1: "1" } } }));
  expect(layer[0]!.name).toBe("VK_LAYER_VALVE_steam_overlay_64");
  expect(layer[0]!.disable_environment).toEqual(["DISABLE_VK_LAYER_VALVE_steam_overlay_1"]);
  const icd = parseManifest("icd", "radeon_icd.json", JSON.stringify({ ICD: { library_path: "/usr/lib/libvulkan_radeon.so", api_version: "1.4.354" } }));
  expect(icd[0]!.name).toBe("libvulkan_radeon.so");
});

test("proton run plan", () => {
  if (process.platform === "win32") {
    expect(planRun({ exe: "game.exe", prefix: "p" }).engine).toBe("native");
    return;
  }
  const plan = planRun({ exe: "/g/game.exe", prefix: "/pfx", app: 10 }, [], "/usr/bin/umu-run");
  expect(plan.engine).toBe("umu");
  expect(plan.env.WINEPREFIX).toBe("/pfx");
});

test("pickTool prefers Proton Experimental", () => {
  const base = mkdtempSync(join(tmpdir(), "gaming-"));
  const t = (name: string, kind: string) => {
    const path = join(base, name);
    mkdirSync(path);
    writeFileSync(join(path, "proton"), "");
    return { name, display_name: null, path, kind, source: "steam-apps", version: null };
  };
  expect(pickTool([t("Proton 9.0", "valve"), t("Proton - Experimental", "valve"), t("GE-Proton10-1", "ge-proton")])?.name).toBe("Proton - Experimental");
  rmSync(base, { recursive: true });
});

test("skill mirrors rewrite plugin paths", () => {
  expect(rewrite("bun ${CLAUDE_PLUGIN_ROOT}/servers/x.ts and plugins/steam/lib")).toBe(
    "bun apps/rosegriffon/plugins/steam/servers/x.ts and apps/rosegriffon/plugins/steam/lib",
  );
  expect(rewrite("apps/rosegriffon/plugins/steam/x")).toBe("apps/rosegriffon/plugins/steam/x");
});

test("skill mirrors are in sync", () => {
  expect(syncSkills(root, false)).toEqual([]);
});

test("gaming forks are pinned", () => {
  const pins = forkPins(root);
  for (const n of ["Proton", "wine", "dxvk", "vkd3d-proton", "Vulkan-Loader", "DirectX-Headers"])
    expect(pins.find((p) => p.name === n)?.commit).toMatch(/^[0-9a-f]{40}$/);
});
