// Reproducible steamcmd wrapper: installs Valve's official bootstrap from the manifest
// (infra/gaming/downloads.toml) into a per-user directory, never into the repo, and runs it with
// fixed script arguments. Credentials: none in argv; `--user` relies on steamcmd's own cached
// login (first login is interactive in steamcmd, or done by the owner), anonymous otherwise.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface SteamcmdPlatform {
  url: string;
  size: number;
  sha256: string;
  archive: "zip" | "tar.gz";
  exe: string;
}

export interface AppEntry {
  appid: number;
  name: string;
  platform?: "linux" | "windows" | "macos";
}

export interface Downloads {
  steamcmd: Record<"windows" | "linux" | "macos", SteamcmdPlatform>;
  apps: Record<string, AppEntry>;
}

export function srcRoot(): string {
  return process.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..");
}

export function loadDownloads(root = srcRoot()): Downloads {
  return Bun.TOML.parse(readFileSync(join(root, "infra", "gaming", "downloads.toml"), "utf8")) as unknown as Downloads;
}

export function hostPlatform(): "windows" | "linux" | "macos" {
  return process.platform === "win32" ? "windows" : process.platform === "darwin" ? "macos" : "linux";
}

/** Per-user tool directory: $AY_STEAMCMD_DIR, %LOCALAPPDATA%\ay\steamcmd or ~/.local/share/ay/steamcmd. */
export function steamcmdDir(): string {
  if (process.env.AY_STEAMCMD_DIR) return process.env.AY_STEAMCMD_DIR;
  if (process.platform === "win32")
    return join(process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"), "ay", "steamcmd");
  return join(process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share"), "ay", "steamcmd");
}

export function steamcmdExe(d = loadDownloads()): string {
  return join(steamcmdDir(), d.steamcmd[hostPlatform()].exe);
}

/** Downloads and unpacks steamcmd when missing; checks the manifest size. */
export async function installSteamcmd(d = loadDownloads()): Promise<string> {
  const p = d.steamcmd[hostPlatform()];
  const dir = steamcmdDir();
  const exe = join(dir, p.exe);
  if (existsSync(exe)) return exe;
  mkdirSync(dir, { recursive: true });
  const res = await fetch(p.url);
  if (!res.ok) throw new Error(`${p.url}: HTTP ${res.status}`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length !== p.size)
    throw new Error(`${p.url}: ${buf.length} bytes, manifest says ${p.size} (update infra/gaming/downloads.toml after checking the source)`);
  const sum = new Bun.CryptoHasher("sha256").update(buf).digest("hex");
  if (sum !== p.sha256) throw new Error(`${p.url}: sha256 ${sum}, manifest says ${p.sha256}`);
  // Unpack into a staging dir, check the listing, then move: a half-extracted install never looks complete.
  const stage = `${dir}.partial`;
  rmSync(stage, { recursive: true, force: true });
  mkdirSync(stage, { recursive: true });
  const archive = join(stage, p.archive === "zip" ? "steamcmd.zip" : "steamcmd.tar.gz");
  await Bun.write(archive, buf);
  // Windows: System32 bsdtar (libarchive) reads zip; an MSYS tar on PATH would not.
  const tar = process.platform === "win32" ? join(process.env.SystemRoot ?? "C:\\Windows", "System32", "tar.exe") : "tar";
  const list = Bun.spawnSync([tar, "-tf", archive], { stdout: "pipe", stderr: "inherit" }).stdout.toString().split(/\r?\n/).filter(Boolean);
  if (list.some((e) => e.startsWith("/") || /^[A-Za-z]:/.test(e) || e.split(/[\\/]/).includes("..")))
    throw new Error(`${p.url}: archive entry outside the target directory`);
  const r = Bun.spawnSync([tar, "-xf", archive, "-C", stage], { stdout: "inherit", stderr: "inherit" });
  if (r.exitCode !== 0) throw new Error(`tar -xf ${archive}: exit ${r.exitCode}`);
  rmSync(archive);
  for (const e of readdirSync(stage)) renameSync(join(stage, e), join(dir, e));
  rmSync(stage, { recursive: true, force: true });
  return exe;
}

export interface AppUpdate {
  app: number;
  dir: string;
  platform?: string;
  beta?: string;
  user?: string;
  validate?: boolean;
}

/** steamcmd script arguments for one app install or update: platform override and install dir
 * come before the login, which steamcmd expects. */
export function appUpdateArgs(o: AppUpdate): string[] {
  const args: string[] = [];
  if (o.platform) args.push("+@sSteamCmdForcePlatformType", o.platform);
  args.push("+force_install_dir", o.dir, "+login", o.user ?? "anonymous", "+app_update", String(o.app));
  if (o.beta) args.push("-beta", o.beta);
  if (o.validate !== false) args.push("validate");
  args.push("+quit");
  return args;
}

/** Resolves a manifest name (`proton-experimental`) or a numeric app id. */
export function resolveApp(name: string, d = loadDownloads()): AppEntry {
  const byName = d.apps[name];
  if (byName) return byName;
  if (/^\d+$/.test(name)) return { appid: Number(name), name: `app ${name}` };
  throw new Error(`unknown app ${name} (one of ${Object.keys(d.apps).join(", ")} or an app id)`);
}

export async function runSteamcmd(args: string[]): Promise<number> {
  const exe = await installSteamcmd();
  const p = Bun.spawn([exe, ...args], { stdio: ["inherit", "inherit", "inherit"] });
  return await p.exited;
}
