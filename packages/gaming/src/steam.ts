// Steam helpers of the monorepo (Bun half): local install data over `ay steam` (Rust parsers in
// src/steam), local path map of an app, SteamID forms, SteamDB/store links and the
// credential-file guard. Consumed by `ay gaming` and the `steam` plugin MCP
// (apps/rosegriffon/plugins/steam/servers/steam-mcp.ts). Ownership: docs/gaming/OWNERSHIP.md.

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { steamJson } from "./native.ts";

export type Vdf = { [key: string]: string | Vdf };

// ---------------------------------------------------------------- local data (Rust)

/** Steam root: $STEAM_PATH, then the first installation src/steam finds (registry on
 * Windows, ~/.steam, ~/.local/share/Steam, Flatpak, snap, macOS). */
export function findSteamRoot(): string | undefined {
  const r = steamJson<{ root: string | null }>(["root"]);
  return r.root ?? undefined;
}

export interface Library {
  path: string;
  label: string;
  apps: number[];
}

export async function listLibraries(root: string): Promise<Library[]> {
  return steamJson<Library[]>(["libraries"], root);
}

export interface InstalledApp {
  appid: number;
  name: string;
  installdir: string;
  library: string;
  manifest: string;
  install_path: string;
  exists_on_disk: boolean;
  buildid: string;
  size_on_disk: number;
  state_flags: number;
  state: string[];
  last_updated: number;
  depots: { depot: string; manifest: string | null; size: string | null }[];
}

export async function listApps(
  root: string,
  filter?: string,
): Promise<InstalledApp[]> {
  return steamJson<InstalledApp[]>(
    ["apps", ...(filter ? ["--filter", filter] : [])],
    root,
  );
}

export type VdfFormat = "auto" | "text" | "binary" | "appinfo";

/** Parses a KeyValues file to JSON (text, binary, or appinfo.vdf with an optional app). The Rust
 * side refuses credential files as well. */
export function readVdf(
  path: string,
  format: VdfFormat = "auto",
  app?: number,
): unknown {
  if (isSecretFile(path))
    throw new Error(`${path} holds credentials; not read`);
  return steamJson([
    "vdf",
    path,
    "--format",
    format,
    ...(app === undefined ? [] : ["--app", String(app)]),
  ]);
}

export interface CompatTool {
  name: string;
  display_name: string | null;
  path: string;
  kind: string;
  source: string;
  version: string | null;
}

/** Proton, Steam Linux Runtime and compatibilitytools.d entries (GE, CachyOS, umu). */
export function compatTools(root: string): CompatTool[] {
  return steamJson<CompatTool[]>(["compat"], root);
}

export interface LaunchEnv {
  app: number;
  prefix: string;
  install_path: string;
  env: Record<string, string>;
  wrapper: string[];
  launch_options: string;
}

export function launchEnv(
  app: number,
  o: {
    root?: string;
    prefix?: string;
    installPath?: string;
    cacheRoot?: string;
    gamemode?: boolean;
  } = {},
): LaunchEnv {
  const args = ["env", String(app)];
  if (o.prefix) args.push("--prefix", o.prefix);
  if (o.installPath) args.push("--install-path", o.installPath);
  if (o.cacheRoot) args.push("--cache-root", o.cacheRoot);
  if (o.gamemode) args.push("--gamemode");
  return steamJson<LaunchEnv>(args, o.root);
}

// ---------------------------------------------------------------- path map

const exists = (p: string): string | null => (existsSync(p) ? p : null);

/** Map an appid to every local path Steam uses for it. */
export async function appPaths(
  root: string,
  appid: number,
  accountId?: number,
) {
  const apps = await listApps(root);
  const app = apps.find((a) => a.appid === appid);
  const lib = app?.library ?? root;
  const sa = join(lib, "steamapps");
  const depotManifests = existsSync(join(root, "depotcache"))
    ? readdirSync(join(root, "depotcache"))
        .filter((f) => app?.depots.some((d) => f.startsWith(`${d.depot}_`)))
        .map((f) => join(root, "depotcache", f))
    : [];
  const userdata = join(root, "userdata");
  const users = existsSync(userdata)
    ? readdirSync(userdata).filter((d) => /^\d+$/.test(d))
    : [];
  const userDirs = (accountId ? [String(accountId)] : users).map((u) => ({
    accountId: Number(u),
    appDir: exists(join(userdata, u, String(appid))),
    remote: exists(join(userdata, u, String(appid), "remote")),
    // Any userdata/<accountid>/<n>/remote/<appid>/screenshots directory present on disk
    // (the client stores screenshots as <gameid>/screenshots/, per steamclient64.dll strings).
    screenshots: findScreenshots(join(userdata, u), appid),
  }));
  return {
    appid,
    name: app?.name ?? null,
    installed: Boolean(app),
    library: lib,
    appmanifest: app?.manifest ?? null,
    installDir: app ? exists(app.install_path) : null,
    downloading: exists(join(sa, "downloading", String(appid))),
    shadercache: exists(join(sa, "shadercache", String(appid))),
    workshop: exists(join(sa, "workshop", "content", String(appid))),
    workshopManifest: exists(join(sa, "workshop", `appworkshop_${appid}.acf`)),
    compatdata: exists(join(sa, "compatdata", String(appid))),
    protonPrefix: exists(join(sa, "compatdata", String(appid), "pfx")),
    depotManifests,
    librarycache: exists(join(root, "appcache", "librarycache", String(appid))),
    users: userDirs,
    state: app?.state ?? [],
  };
}

function findScreenshots(userDir: string, appid: number): string[] {
  if (!existsSync(userDir)) return [];
  return readdirSync(userDir)
    .map((d) => join(userDir, d, "remote", String(appid), "screenshots"))
    .filter((p) => existsSync(p));
}

export function dirSize(path: string, limit = 200_000): number {
  let total = 0;
  let seen = 0;
  const walk = (p: string): void => {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      if (++seen > limit) return;
      const f = join(p, e.name);
      if (e.isDirectory()) walk(f);
      else total += statSync(f).size;
    }
  };
  walk(path);
  return total;
}

// ---------------------------------------------------------------- SteamID

/** Base of individual SteamID64 values (universe 1, type 1, instance 1). */
export const STEAMID64_BASE = 76561197960265728n;
// Letters per EAccountType index, as SteamKit SteamID.cs AccountTypeChars; unknown types render as "i".
const TYPE_LETTERS = ["I", "U", "M", "G", "A", "P", "C", "g", "T", "i", "a"];

export interface SteamIdForms {
  steamid64: string;
  accountId: number;
  universe: number;
  accountType: number;
  instance: number;
  steam2: string;
  steam3: string;
  profileUrl: string;
}

export function decodeSteamId64(id: bigint): SteamIdForms {
  const accountId = Number(id & 0xffffffffn);
  const instance = Number((id >> 32n) & 0xfffffn);
  const accountType = Number((id >> 52n) & 0xfn);
  const universe = Number((id >> 56n) & 0xffn);
  const letter = TYPE_LETTERS[accountType] ?? "i";
  return {
    steamid64: id.toString(),
    accountId,
    universe,
    accountType,
    instance,
    // STEAM_X uses 0 for public on legacy engines; 1 on newer (Orange Box+). Report 1.
    steam2: `STEAM_${universe}:${accountId & 1}:${accountId >>> 1}`,
    steam3: `[${letter}:${universe}:${accountId}${accountType === 1 && instance !== 1 ? `:${instance}` : ""}]`,
    profileUrl: `https://steamcommunity.com/profiles/${id}`,
  };
}

/** Parse SteamID64, STEAM_X:Y:Z, [U:1:N], a bare account id or a /profiles/ URL.
 * Returns null for vanity names (resolve them over the network). */
export function parseSteamId(input: string): SteamIdForms | null {
  const s = input.trim();
  let m = s.match(/steamcommunity\.com\/profiles\/(\d{17})/);
  if (m) return decodeSteamId64(BigInt(m[1]!));
  if (/^\d{17}$/.test(s)) return decodeSteamId64(BigInt(s));
  m = s.match(/^STEAM_([0-5]):([01]):(\d+)$/i);
  if (m) {
    const acc = BigInt(Number(m[3]) * 2 + Number(m[2]));
    return decodeSteamId64(STEAMID64_BASE + acc);
  }
  m = s.match(/^\[?U:1:(\d+)\]?$/i);
  if (m) return decodeSteamId64(STEAMID64_BASE + BigInt(m[1]!));
  if (/^\d{1,10}$/.test(s) && Number(s) < 2 ** 32)
    return decodeSteamId64(STEAMID64_BASE + BigInt(s));
  return null;
}

/** Extract a vanity name from a /id/<name> URL or bare name. */
export function vanityOf(input: string): string | null {
  const m = input
    .trim()
    .match(/(?:steamcommunity\.com\/id\/)?([A-Za-z0-9_-]{2,32})\/?$/);
  return m ? m[1]! : null;
}

// ---------------------------------------------------------------- links

export function steamdbLinks(
  kind: string,
  id: string | number,
): Record<string, string> {
  const b = "https://steamdb.info";
  switch (kind) {
    case "app":
      return {
        app: `${b}/app/${id}/`,
        info: `${b}/app/${id}/info/`,
        depots: `${b}/app/${id}/depots/`,
        history: `${b}/app/${id}/history/`,
        patchnotes: `${b}/app/${id}/patchnotes/`,
        charts: `${b}/app/${id}/charts/`,
        packages: `${b}/app/${id}/subs/`,
        store: `https://store.steampowered.com/app/${id}/`,
        community: `https://steamcommunity.com/app/${id}`,
      };
    case "depot":
      return {
        depot: `${b}/depot/${id}/`,
        manifests: `${b}/depot/${id}/manifests/`,
      };
    case "sub":
    case "package":
      return {
        sub: `${b}/sub/${id}/`,
        store: `https://store.steampowered.com/sub/${id}/`,
      };
    case "user":
    case "calculator":
      return {
        calculator: `${b}/calculator/${id}/`,
        profile: `https://steamcommunity.com/profiles/${id}`,
      };
    default:
      throw new Error(`unknown kind ${kind} (app, depot, sub, user)`);
  }
}

// ---------------------------------------------------------------- safety

/** Files that hold login tokens or machine auth: config/config.vdf, config/loginusers.vdf,
 * userdata/<id>/config/local.vdf (cached connect tokens) and ssfn* sentry files. */
export function isSecretFile(path: string): boolean {
  const raw = path.replace(/\\/g, "/").split("/").pop()!.toLowerCase();
  if (raw.includes(":")) return true; // alternate data stream
  const base = raw.replace(/[. ]+$/, ""); // Windows ignores trailing dots and spaces
  return (
    base === "config.vdf" ||
    base === "loginusers.vdf" ||
    base === "local.vdf" ||
    base.startsWith("ssfn")
  );
}

export function isUnder(path: string, dir: string): boolean {
  const norm = (p: string): string =>
    resolve(p).replace(/\\/g, "/").toLowerCase().replace(/\/+$/, "");
  const p = norm(path);
  const d = norm(dir);
  return p === d || p.startsWith(`${d}/`);
}
