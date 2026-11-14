// Reproducible 2026 shell/CLI/TUI/terminal/font/theme engine backed by Pure C ABI (`packages/core/src/sys.ts`).
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import {
  findShellEntry,
  formatTermSgr,
  getTermPalette,
  listShellCatalog,
  listTermThemes,
  searchShellCatalog,
  type ShellCatalogEntry,
  type TermPalette,
} from "@aphrody/core/sys";

const ROOT = join(import.meta.dir, "..", "..", "..");
const WIN = process.platform === "win32";
const DARWIN = process.platform === "darwin";
const HOME = (WIN ? process.env.USERPROFILE : process.env.HOME) ?? "";

export type Results = string[];

function run(argv: string[]) {
  return Bun.spawnSync(argv, { stdout: "pipe", stderr: "pipe" });
}

function sha256Hex(bytes: Uint8Array): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(bytes);
  return hasher.digest("hex");
}

function writeIfChanged(
  res: Results,
  check: boolean,
  file: string,
  content: string,
  label: string,
) {
  const cur = existsSync(file) ? readFileSync(file, "utf8") : null;
  const ok = cur === content;
  res.push(`${ok ? "ok  " : check ? "DIFF" : "set "} ${label}`);
  if (!ok && !check) {
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, content, "utf8");
  }
}

export function ensureGitDeltaInclude(res: Results, check: boolean) {
  const gitconfig = join(HOME, ".gitconfig");
  const deltaPath = join(HOME, ".config", "git", "delta.gitconfig").replaceAll(
    "\\",
    "/",
  );
  const raw = existsSync(gitconfig) ? readFileSync(gitconfig, "utf8") : "";
  const hasInclude = raw.toLowerCase().includes("delta.gitconfig");
  res.push(
    `${hasInclude ? "ok  " : check ? "DIFF" : "set "} gitconfig include delta.gitconfig`,
  );
  if (!hasInclude && !check) {
    const sep = raw.length > 0 && !raw.endsWith("\n") ? "\n" : "";
    const block = `${sep}\n[include]\n\tpath = ${deltaPath}\n`;
    writeFileSync(gitconfig, raw + block, "utf8");
  }
}

function wtSettingsPath(): string {
  return join(
    process.env.LOCALAPPDATA ?? "",
    "Packages",
    "Microsoft.WindowsTerminal_8wekyb3d8bbwe",
    "LocalState",
    "settings.json",
  );
}

function paletteToWtScheme(p: TermPalette): Record<string, string> {
  return {
    name: p.name,
    background: p.bg,
    foreground: p.fg,
    cursorColor: p.cursorBg,
    selectionBackground: p.selectionBg,
    black: p.ansi[0]!,
    red: p.ansi[1]!,
    green: p.ansi[2]!,
    yellow: p.ansi[3]!,
    blue: p.ansi[4]!,
    purple: p.ansi[5]!,
    cyan: p.ansi[6]!,
    white: p.ansi[7]!,
    brightBlack: p.ansi[8]!,
    brightRed: p.ansi[9]!,
    brightGreen: p.ansi[10]!,
    brightYellow: p.ansi[11]!,
    brightBlue: p.ansi[12]!,
    brightPurple: p.ansi[13]!,
    brightCyan: p.ansi[14]!,
    brightWhite: p.ansi[15]!,
  };
}

export function syncWindowsTerminalTheme(
  res: Results,
  check: boolean,
  themeSlug = "aphrody-m3-dark",
) {
  if (!WIN) return;
  const f = wtSettingsPath();
  if (!existsSync(f)) return;
  const target =
    getTermPalette(themeSlug) ?? getTermPalette("catppuccin-mocha");
  if (!target) return;

  const rawText = readFileSync(f, "utf8");
  const wt = Bun.JSONC.parse(rawText) as {
    schemes?: Record<string, string>[];
    profiles?: {
      defaults?: Record<string, unknown>;
      list?: Record<string, unknown>[];
    };
  };

  const palettes = listTermThemes();
  const schemes = Array.isArray(wt.schemes) ? [...wt.schemes] : [];
  const schemeByName = new Map(schemes.map((s) => [s.name, s]));
  let changed = false;

  for (const p of palettes) {
    const want = paletteToWtScheme(p);
    const cur = schemeByName.get(p.name);
    if (!cur || JSON.stringify(cur) !== JSON.stringify(want)) {
      changed = true;
      const idx = schemes.findIndex((s) => s.name === p.name);
      if (idx >= 0) schemes[idx] = want;
      else schemes.push(want);
    }
  }

  wt.schemes = schemes;
  wt.profiles = wt.profiles ?? {};
  wt.profiles.defaults = wt.profiles.defaults ?? {};
  const defaults = wt.profiles.defaults as Record<string, unknown>;
  const font = (defaults.font as Record<string, unknown> | undefined) ?? {};
  const wantFace =
    "Google Sans Code, Symbols Nerd Font Mono, Material Symbols Rounded";
  const wantFeatures = { calt: 1, liga: 1 };
  const curFeatures =
    (font.features as Record<string, unknown> | undefined) ?? {};
  if (
    font.face !== wantFace ||
    font.size !== 20 ||
    curFeatures.calt !== 1 ||
    curFeatures.liga !== 1
  ) {
    defaults.font = {
      ...font,
      face: wantFace,
      size: 20,
      features: wantFeatures,
    };
    changed = true;
  }
  if (defaults.antialiasingMode !== "cleartype") {
    defaults.antialiasingMode = "cleartype";
    changed = true;
  }
  if (defaults.colorScheme !== target.name) {
    defaults.colorScheme = target.name;
    changed = true;
  }
  if (defaults.cursorShape !== "bar") {
    defaults.cursorShape = "bar";
    changed = true;
  }
  if (Array.isArray(wt.profiles.list)) {
    for (const p of wt.profiles.list as Record<string, unknown>[]) {
      const pf = p.font as Record<string, unknown> | undefined;
      if (!pf) continue;
      if (typeof pf.size === "number" && pf.size < 20) {
        pf.size = 20;
        changed = true;
      }
      if (
        typeof pf.face === "string" &&
        pf.face &&
        !pf.face.includes("Google Sans Code")
      ) {
        delete pf.face;
        if (Object.keys(pf).length === 0) delete p.font;
        changed = true;
      }
    }
  }

  // Ensure default Niubash profile has Nerd Font explicitly inherited (clear stale font overrides if needed)
  for (const prof of wt.profiles.list ?? []) {
    if (prof.name === "Ubuntu-24.04" || prof.name === "Niubash") {
      if (prof.colorScheme && prof.colorScheme !== target.name) {
        prof.colorScheme = target.name;
        changed = true;
      }
    }
  }

  res.push(
    `${!changed ? "ok  " : check ? "DIFF" : "set "} Windows Terminal C ABI schemes (${palettes.length}) + Nerd Font (${target.name})`,
  );
  if (changed && !check) {
    writeFileSync(f, `${JSON.stringify(wt, null, 2)}\n`, "utf8");
  }
}

type FontLockEntry = {
  slug: string;
  family: string;
  zip: string;
  zip_sha256: string;
  tar_xz: string;
  tar_xz_sha256: string;
};

type GoogleFontEntry = {
  slug: string;
  family: string;
  file: string;
  stale_alias?: string;
  url: string;
  sha256: string;
};

type FontLockFile = {
  release: { repo: string; tag: string };
  font: FontLockEntry[];
  google?: GoogleFontEntry[];
};

const FLEET_HOSTS = ["vps", "prd", "cdn"] as const;

const FONTCONFIG_CONF = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd">
<fontconfig>
  <!-- Aphrody 2026: Google Sans Code + Symbols Nerd Font Mono + Material Symbols + Google Sans Flex -->
  <match target="font">
    <edit name="antialias" mode="assign"><bool>true</bool></edit>
    <edit name="hinting" mode="assign"><bool>true</bool></edit>
    <edit name="hintstyle" mode="assign"><const>hintslight</const></edit>
    <edit name="rgba" mode="assign"><const>rgb</const></edit>
    <edit name="lcdfilter" mode="assign"><const>lcddefault</const></edit>
    <edit name="autohint" mode="assign"><bool>false</bool></edit>
  </match>
  <match target="pattern">
    <test qual="any" name="family"><string>monospace</string></test>
    <edit name="family" mode="prepend" binding="strong"><string>Google Sans Code</string></edit>
    <edit name="family" mode="append" binding="weak"><string>Symbols Nerd Font Mono</string></edit>
    <edit name="family" mode="append" binding="weak"><string>Material Symbols Rounded</string></edit>
    <edit name="family" mode="append" binding="weak"><string>Material Symbols Outlined</string></edit>
    <edit name="family" mode="append" binding="weak"><string>Material Symbols Sharp</string></edit>
  </match>
  <match target="pattern">
    <test qual="any" name="family"><string>sans-serif</string></test>
    <edit name="family" mode="prepend" binding="strong"><string>Google Sans Flex</string></edit>
    <edit name="family" mode="append" binding="weak"><string>Material Symbols Rounded</string></edit>
    <edit name="family" mode="append" binding="weak"><string>Material Symbols Outlined</string></edit>
    <edit name="family" mode="append" binding="weak"><string>Material Symbols Sharp</string></edit>
  </match>
</fontconfig>
`;

function userFontDir(): string {
  if (WIN)
    return join(
      process.env.LOCALAPPDATA ?? "",
      "Microsoft",
      "Windows",
      "Fonts",
    );
  if (DARWIN) return join(HOME, "Library", "Fonts");
  return join(HOME, ".local", "share", "fonts", "NerdFonts");
}

function fontCacheDir(): string {
  return join(HOME, ".cache", "ay-fonts");
}

function installedFontFiles(dir: string): Set<string> {
  if (!existsSync(dir)) return new Set();
  const out = new Set<string>();
  for (const name of readdirSync(dir)) {
    out.add(name.toLowerCase());
  }
  return out;
}

function fontMarkerFile(font: FontLockEntry): string {
  switch (font.slug) {
    case "nerd-fonts-symbols":
      return "symbolsnerdfontmono-regular.ttf";
    case "cascadia-code-nf":
      return "caskaydiacovenerdfontmono-regular.ttf";
    case "jetbrains-mono-nf":
      return "jetbrainsmononerdfontmono-regular.ttf";
    default:
      return `${font.slug}.ttf`;
  }
}

function registerWindowsUserFont(ttfPath: string, valueLabel?: string) {
  const stem = basename(ttfPath).replace(/\.[^.]+$/, "");
  const regName = `${valueLabel ?? stem} (TrueType)`;
  run([
    "reg",
    "add",
    "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts",
    "/v",
    regName,
    "/t",
    "REG_SZ",
    "/d",
    ttfPath,
    "/f",
  ]);
}

function cleanupStaleWindowsFont(
  destDir: string,
  staleFile: string,
): string | null {
  const stalePath = join(destDir, staleFile);
  const regQuery = run([
    "reg",
    "query",
    "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts",
  ]);
  if (regQuery.exitCode === 0) {
    const lines = regQuery.stdout.toString().split(/\r?\n/);
    for (const line of lines) {
      if (!line.toLowerCase().includes(staleFile.toLowerCase())) continue;
      const match = line.match(/^\s+(.+?)\s+REG_SZ\s+/);
      if (match?.[1]) {
        run([
          "reg",
          "delete",
          "HKCU\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts",
          "/v",
          match[1].trim(),
          "/f",
        ]);
      }
    }
  }
  return existsSync(stalePath) ? stalePath : null;
}

async function notifyWindowsFonts(
  addedPaths: string[],
  removedPaths: string[],
) {
  if (!WIN || (addedPaths.length === 0 && removedPaths.length === 0)) return;
  try {
    const { dlopen, FFIType, ptr } = await import("bun:ffi");
    const gdi = dlopen("gdi32.dll", {
      AddFontResourceW: { args: [FFIType.ptr], returns: FFIType.i32 },
      RemoveFontResourceW: { args: [FFIType.ptr], returns: FFIType.i32 },
    });
    const user = dlopen("user32.dll", {
      SendMessageTimeoutW: {
        args: [
          FFIType.u64,
          FFIType.u32,
          FFIType.u64,
          FFIType.u64,
          FFIType.u32,
          FFIType.u32,
          FFIType.ptr,
        ],
        returns: FFIType.u64,
      },
    });
    for (const r of removedPaths) {
      const buf = Buffer.from(`${r}\0`, "utf16le");
      gdi.symbols.RemoveFontResourceW(ptr(buf));
      try {
        rmSync(r, { force: true });
      } catch {
        // Ignore if currently mapped by an open window; registry entry is already removed.
      }
    }
    for (const a of addedPaths) {
      const buf = Buffer.from(`${a}\0`, "utf16le");
      gdi.symbols.AddFontResourceW(ptr(buf));
    }
    const resultBuf = new BigUint64Array(1);
    user.symbols.SendMessageTimeoutW(
      0xffffn,
      0x001d,
      0n,
      0n,
      0x0002,
      1500,
      ptr(resultBuf),
    );
    gdi.close();
    user.close();
  } catch {
    // Non-fatal if Win32 broadcast fails in restricted sessions.
  }
}

async function downloadVerified(
  url: string,
  wantSha256: string,
): Promise<Uint8Array> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const bytes = new Uint8Array(await resp.arrayBuffer());
  const got = sha256Hex(bytes);
  if (got !== wantSha256.toLowerCase()) {
    throw new Error(
      `SHA-256 mismatch for ${url}: got ${got}, want ${wantSha256}`,
    );
  }
  return bytes;
}

function hasVerifiedFile(path: string, wantSha256: string): boolean {
  if (!existsSync(path)) return false;
  return sha256Hex(readFileSync(path)) === wantSha256.toLowerCase();
}

function extractArchive(archivePath: string, destDir: string) {
  mkdirSync(destDir, { recursive: true });
  if (archivePath.endsWith(".zip") && WIN) {
    const r = run([
      "pwsh",
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${archivePath.replaceAll("'", "''")}' -DestinationPath '${destDir.replaceAll("'", "''")}' -Force`,
    ]);
    if (r.exitCode !== 0) {
      throw new Error(`Expand-Archive failed: ${r.stderr.toString()}`);
    }
    return;
  }
  const flag = archivePath.endsWith(".zip")
    ? ["-o", archivePath, "-d", destDir]
    : null;
  if (flag) {
    const r = run(["unzip", ...flag]);
    if (r.exitCode !== 0)
      throw new Error(`unzip failed: ${r.stderr.toString()}`);
    return;
  }
  const r = run(["tar", "-xf", archivePath, "-C", destDir]);
  if (r.exitCode !== 0) throw new Error(`tar failed: ${r.stderr.toString()}`);
}

function googleRegLabel(g: GoogleFontEntry): string {
  return g.file.includes("Italic") ? `${g.family} Italic` : g.family;
}

async function ensureCachedFontFiles(lock: FontLockFile): Promise<string> {
  const cache = fontCacheDir();
  const destDir = userFontDir();
  mkdirSync(cache, { recursive: true });

  for (const g of lock.google ?? []) {
    const cached = join(cache, g.file);
    if (hasVerifiedFile(cached, g.sha256)) continue;
    const installed = join(destDir, g.file);
    if (hasVerifiedFile(installed, g.sha256)) {
      writeFileSync(cached, readFileSync(installed));
      continue;
    }
    const bytes = await downloadVerified(g.url, g.sha256);
    writeFileSync(cached, bytes);
  }

  const symbolsTtf = "SymbolsNerdFontMono-Regular.ttf";
  const cachedSymbols = join(cache, symbolsTtf);
  if (!existsSync(cachedSymbols)) {
    const installedSymbols = join(destDir, symbolsTtf);
    if (existsSync(installedSymbols)) {
      writeFileSync(cachedSymbols, readFileSync(installedSymbols));
    } else {
      const symFont = lock.font.find((f) => f.slug === "nerd-fonts-symbols");
      if (symFont) {
        const useZip = WIN || DARWIN;
        const asset = useZip ? symFont.zip : symFont.tar_xz;
        const want = useZip ? symFont.zip_sha256 : symFont.tar_xz_sha256;
        const url = `https://github.com/${lock.release.repo}/releases/download/${lock.release.tag}/${asset}`;
        const bytes = await downloadVerified(url, want);
        const tmp = mkdtempSync(join(tmpdir(), "ay-nf-cache-"));
        try {
          const archiveFile = join(tmp, asset);
          const outDir = join(tmp, "out");
          writeFileSync(archiveFile, bytes);
          extractArchive(archiveFile, outDir);
          const found = findExeRecursive(outDir, symbolsTtf);
          if (found) writeFileSync(cachedSymbols, readFileSync(found));
        } finally {
          rmSync(tmp, { recursive: true, force: true });
        }
      }
    }
  }
  return cache;
}

export async function syncNerdFonts(
  res: Results,
  check: boolean,
  install: boolean,
) {
  const lockPath = join(
    ROOT,
    "packages",
    "machine",
    "shells",
    "fonts",
    "fonts.lock.toml",
  );
  if (!existsSync(lockPath)) return;
  const lock = Bun.TOML.parse(readFileSync(lockPath, "utf8")) as FontLockFile;
  const destDir = userFontDir();
  const have = installedFontFiles(destDir);
  const addedPaths: string[] = [];
  const removedPaths: string[] = [];
  let installedAny = false;

  for (const font of lock.font ?? []) {
    const marker = fontMarkerFile(font);
    const present = have.has(marker);
    if (present) {
      res.push(`ok   font ${font.family} (${lock.release.tag})`);
      continue;
    }
    if (check || !install) {
      res.push(
        `${check ? "DIFF" : "info"} font ${font.family} absent (--fonts pour installer)`,
      );
      continue;
    }

    const useZip = WIN || DARWIN;
    const asset = useZip ? font.zip : font.tar_xz;
    const want = useZip ? font.zip_sha256 : font.tar_xz_sha256;
    const url = `https://github.com/${lock.release.repo}/releases/download/${lock.release.tag}/${asset}`;
    const bytes = await downloadVerified(url, want);

    const tmp = mkdtempSync(join(tmpdir(), "ay-nf-"));
    try {
      const archiveFile = join(tmp, asset);
      const extractDir = join(tmp, "out");
      writeFileSync(archiveFile, bytes);
      extractArchive(archiveFile, extractDir);
      mkdirSync(destDir, { recursive: true });

      let count = 0;
      const walk = (dir: string) => {
        for (const ent of readdirSync(dir, { withFileTypes: true })) {
          const full = join(dir, ent.name);
          if (ent.isDirectory()) walk(full);
          else if (
            /\.(ttf|otf)$/i.test(ent.name) &&
            !/Windows Compatible/i.test(ent.name)
          ) {
            const dst = join(destDir, ent.name);
            writeFileSync(dst, readFileSync(full));
            if (WIN) registerWindowsUserFont(dst);
            addedPaths.push(dst);
            count++;
          }
        }
      };
      walk(extractDir);
      installedAny = true;
      res.push(
        `set  font ${font.family} (${count} glyphes Nerd Fonts ${lock.release.tag})`,
      );
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }

  for (const g of lock.google ?? []) {
    const dst = join(destDir, g.file);
    const stalePresent = Boolean(
      WIN && g.stale_alias && existsSync(join(destDir, g.stale_alias)),
    );
    if (hasVerifiedFile(dst, g.sha256) && !stalePresent) {
      res.push(`ok   font ${googleRegLabel(g)} (${g.file})`);
      continue;
    }
    if (check || !install) {
      res.push(
        `${check ? "DIFF" : "info"} font ${googleRegLabel(g)} absent/obsolète (--fonts)`,
      );
      continue;
    }

    const cache = fontCacheDir();
    mkdirSync(cache, { recursive: true });
    mkdirSync(destDir, { recursive: true });
    const cached = join(cache, g.file);
    let bytes: Uint8Array;
    if (hasVerifiedFile(cached, g.sha256)) {
      bytes = readFileSync(cached);
    } else {
      bytes = await downloadVerified(g.url, g.sha256);
      writeFileSync(cached, bytes);
    }

    if (WIN && g.stale_alias) {
      const removed = cleanupStaleWindowsFont(destDir, g.stale_alias);
      if (removed) removedPaths.push(removed);
    }
    writeFileSync(dst, bytes);
    if (WIN) registerWindowsUserFont(dst, googleRegLabel(g));
    addedPaths.push(dst);
    installedAny = true;
    res.push(`set  font ${googleRegLabel(g)} (${g.file})`);
  }

  if (WIN && (addedPaths.length > 0 || removedPaths.length > 0)) {
    await notifyWindowsFonts(addedPaths, removedPaths);
  }
  if (installedAny && !WIN && !DARWIN && Bun.which("fc-cache")) {
    run(["fc-cache", "-f", destDir]);
  }
}

function runSshScript(host: string, script: string, timeoutMs = 300_000) {
  return Bun.spawnSync(
    ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10", host, "bash -s"],
    {
      stdin: Buffer.from(script, "utf8"),
      stdout: "pipe",
      stderr: "pipe",
      timeout: timeoutMs,
    },
  );
}

function uploadStageViaSsh(host: string, localDir: string, remoteDir: string) {
  const tarPack = Bun.spawnSync(["tar", "-czf", "-", "-C", localDir, "."], {
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  });
  if (tarPack.exitCode !== 0) {
    throw new Error(`tar pack failed: ${tarPack.stderr.toString()}`);
  }
  const up = Bun.spawnSync(
    [
      "ssh",
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=10",
      host,
      `rm -rf '${remoteDir}' && mkdir -p '${remoteDir}' && tar -xzf - -C '${remoteDir}'`,
    ],
    {
      stdin: tarPack.stdout,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 300_000,
    },
  );
  if (up.exitCode !== 0) {
    throw new Error(
      `ssh tar upload to ${host} failed (code=${up.exitCode}): ${up.stderr.toString()}`,
    );
  }
}

function pullDirViaSsh(
  host: string,
  remoteParent: string,
  dirName: string,
  localDestParent: string,
) {
  const pull = Bun.spawnSync(
    [
      "ssh",
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=10",
      host,
      `tar -czf - -C '${remoteParent}' '${dirName}'`,
    ],
    { stdout: "pipe", stderr: "pipe", timeout: 300_000 },
  );
  if (pull.exitCode !== 0) {
    throw new Error(
      `ssh tar pull from ${host} failed (code=${pull.exitCode}): ${pull.stderr.toString()}`,
    );
  }
  const unpack = Bun.spawnSync(["tar", "-xzf", "-", "-C", localDestParent], {
    stdin: pull.stdout,
    stdout: "pipe",
    stderr: "pipe",
    timeout: 120_000,
  });
  if (unpack.exitCode !== 0) {
    throw new Error(`tar unpack failed: ${unpack.stderr.toString()}`);
  }
}

export async function deployFontsToFleet(res: Results, check: boolean) {
  const lockPath = join(
    ROOT,
    "packages",
    "machine",
    "shells",
    "fonts",
    "fonts.lock.toml",
  );
  if (!existsSync(lockPath)) return;
  if (check) {
    res.push("info flotte Polices/Fontconfig vérifiables via --vps");
    return;
  }

  const lock = Bun.TOML.parse(readFileSync(lockPath, "utf8")) as FontLockFile;
  const stamp = sha256Hex(
    Buffer.from(readFileSync(lockPath, "utf8") + FONTCONFIG_CONF, "utf8"),
  );
  const cache = await ensureCachedFontFiles(lock);
  const webCache = join(cache, "web");
  const webStampFile = join(webCache, ".stamp");
  const haveLocalWeb =
    existsSync(webStampFile) &&
    readFileSync(webStampFile, "utf8").trim() === stamp;

  const stage = mkdtempSync(join(tmpdir(), "ay-fleet-fonts-"));
  try {
    for (const g of lock.google ?? []) {
      writeFileSync(join(stage, g.file), readFileSync(join(cache, g.file)));
    }
    const symName = "SymbolsNerdFontMono-Regular.ttf";
    if (existsSync(join(cache, symName))) {
      writeFileSync(join(stage, symName), readFileSync(join(cache, symName)));
    }
    writeFileSync(
      join(stage, "55-aphrody-google-fonts.conf"),
      FONTCONFIG_CONF,
      "utf8",
    );
    writeFileSync(join(stage, ".stamp"), `${stamp}\n`, "utf8");

    if (!haveLocalWeb) {
      // 1. Build optimized WOFF2 + HarfBuzz subsets on fr1 (vps) and cache locally.
      uploadStageViaSsh("vps", stage, "/tmp/ay-fonts-stage/in");

      const vpsOptScript = `set -eu
STAGE=/tmp/ay-fonts-stage/in
DEST=/usr/local/share/fonts/google-aphrody
WEB="$STAGE/web"
rm -rf "$WEB" && mkdir -p "$WEB"
printf '%s\\0' "$STAGE"/*.ttf | xargs -0 -P "$(nproc)" -I{} bash -c '
  f="$1"
  base=$(basename "$f" .ttf)
  woff2_compress "$f" >/dev/null
  mv "$(dirname "$f")/\${base}.woff2" "'"$WEB"'/\${base}.woff2"
' _ {}
pids=""
for pair in "GoogleSansCode[wght].ttf:GoogleSansCode-Latin" "GoogleSansCode-Italic[wght].ttf:GoogleSansCode-Italic-Latin" "GoogleSansFlex[ROND,opsz,slnt,wdth,wght].ttf:GoogleSansFlex-Latin"; do
  src="\${pair%%:*}"
  out="\${pair##*:}"
  if [ -f "$STAGE/$src" ]; then
    (
      hb-subset "$STAGE/$src" --unicodes="U+0020-00FF,U+0100-017F,U+2000-206F,U+2190-21FF,U+2500-257F" --layout-features='*' -o "$WEB/\${out}.ttf"
      woff2_compress "$WEB/\${out}.ttf" >/dev/null
      rm -f "$WEB/\${out}.ttf"
    ) &
    pids="$pids $!"
  fi
done
for p in $pids; do wait "$p"; done
sudo -n rm -rf "$DEST/web" /etc/fonts/conf.d/65-aphrody-google-fonts.conf
sudo -n mkdir -p "$DEST/web" /etc/fonts/conf.d
sudo -n install -m 0644 "$STAGE"/*.ttf "$DEST/"
sudo -n install -m 0644 "$STAGE/.stamp" "$DEST/.stamp"
sudo -n install -m 0644 "$WEB"/* "$DEST/web/"
sudo -n install -m 0644 "$STAGE/55-aphrody-google-fonts.conf" /etc/fonts/conf.d/55-aphrody-google-fonts.conf
sudo -n fc-cache -fv >/dev/null
MONO=$(fc-match monospace)
SANS=$(fc-match sans-serif)
echo "MATCH:$MONO|$SANS"
`;
      const rVps = runSshScript("vps", vpsOptScript, 300_000);
      if (rVps.exitCode !== 0) {
        throw new Error(
          `vps font optimize failed (code=${rVps.exitCode}): ${rVps.stderr.toString()} ${rVps.stdout.toString()}`,
        );
      }
      res.push(`set  flotte vps ${rVps.stdout.toString().trim()}`);

      pullDirViaSsh("vps", "/tmp/ay-fonts-stage/in", "web", stage);
      runSshScript("vps", "rm -rf /tmp/ay-fonts-stage");

      rmSync(webCache, { recursive: true, force: true });
      mkdirSync(webCache, { recursive: true });
      for (const name of readdirSync(join(stage, "web"))) {
        writeFileSync(
          join(webCache, name),
          readFileSync(join(stage, "web", name)),
        );
      }
      writeFileSync(webStampFile, `${stamp}\n`, "utf8");
    } else {
      mkdirSync(join(stage, "web"), { recursive: true });
      for (const name of readdirSync(webCache)) {
        if (name === ".stamp") continue;
        writeFileSync(
          join(stage, "web", name),
          readFileSync(join(webCache, name)),
        );
      }
    }

    for (const host of FLEET_HOSTS) {
      if (host === "vps" && !haveLocalWeb) continue;
      const checkRemote = runSshScript(
        host,
        `if [ -f /usr/local/share/fonts/google-aphrody/.stamp ] && [ "$(cat /usr/local/share/fonts/google-aphrody/.stamp)" = "${stamp}" ]; then echo "OK:$(fc-match monospace)|$(fc-match sans-serif)"; fi`,
        30_000,
      );
      const outCheck = checkRemote.stdout.toString().trim();
      if (
        checkRemote.exitCode === 0 &&
        outCheck.startsWith("OK:") &&
        outCheck.includes("Google Sans Code") &&
        outCheck.includes("Google Sans Flex")
      ) {
        res.push(`ok   flotte ${host} ${outCheck.slice(3)}`);
        continue;
      }

      uploadStageViaSsh(host, stage, "/tmp/ay-fonts-stage/in");
      const installScript = `set -eu
STAGE=/tmp/ay-fonts-stage/in
DEST=/usr/local/share/fonts/google-aphrody
sudo -n rm -rf "$DEST/web" /etc/fonts/conf.d/65-aphrody-google-fonts.conf
sudo -n mkdir -p "$DEST/web" /etc/fonts/conf.d
sudo -n install -m 0644 "$STAGE"/*.ttf "$DEST/"
sudo -n install -m 0644 "$STAGE/.stamp" "$DEST/.stamp"
sudo -n install -m 0644 "$STAGE/web"/* "$DEST/web/"
sudo -n install -m 0644 "$STAGE/55-aphrody-google-fonts.conf" /etc/fonts/conf.d/55-aphrody-google-fonts.conf
sudo -n fc-cache -fv >/dev/null
rm -rf /tmp/ay-fonts-stage
MONO=$(fc-match monospace)
SANS=$(fc-match sans-serif)
echo "MATCH:$MONO|$SANS"
`;
      const rHost = runSshScript(host, installScript, 300_000);
      if (rHost.exitCode !== 0) {
        throw new Error(
          `${host} font install failed (code=${rHost.exitCode}): ${rHost.stderr.toString()}`,
        );
      }
      res.push(`set  flotte ${host} ${rHost.stdout.toString().trim()}`);
    }
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

type ToolsTomlEntry = {
  name: string;
  version: string;
  bin: string[];
  repo?: string;
  tag?: string;
  assets?: Record<string, string>;
  sha256?: Record<string, string>;
};

const TARGET_CLI_TOOLS = [
  "starship",
  "atuin",
  "yazi",
  "lazygit",
  "bottom",
  "fastfetch",
  "tealdeer",
  "glow",
  "eza",
  "bat",
  "delta",
  "zoxide",
];

function currentPlatformKey(): string {
  const os = WIN ? "windows" : DARWIN ? "macos" : "linux";
  const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
  return `${os}-${arch}`;
}

function findExeRecursive(rootDir: string, exeName: string): string | null {
  for (const ent of readdirSync(rootDir, { withFileTypes: true })) {
    const full = join(rootDir, ent.name);
    if (ent.isDirectory()) {
      const hit = findExeRecursive(full, exeName);
      if (hit) return hit;
    } else if (ent.name.toLowerCase() === exeName.toLowerCase()) {
      return full;
    }
  }
  return null;
}

export async function syncPinnedCliTools(
  res: Results,
  check: boolean,
  install: boolean,
) {
  const tomlPath = join(ROOT, "tools.toml");
  if (!existsSync(tomlPath)) return;
  const parsed = Bun.TOML.parse(readFileSync(tomlPath, "utf8")) as {
    tool?: ToolsTomlEntry[];
  };
  const byName = new Map((parsed.tool ?? []).map((t) => [t.name, t]));
  const platKey = currentPlatformKey();
  const binDir = join(HOME, ".local", "bin");

  for (const toolName of TARGET_CLI_TOOLS) {
    const spec = byName.get(toolName);
    if (!spec) continue;
    const primaryBin = spec.bin[0]!;
    if (Bun.which(primaryBin)) {
      res.push(`ok   cli ${spec.name} (${primaryBin} ${spec.version})`);
      continue;
    }
    const assetTpl = spec.assets?.[platKey];
    const wantSha = spec.sha256?.[platKey];
    if (!assetTpl || !wantSha || !spec.repo) {
      res.push(`info cli ${spec.name} non packagé pour ${platKey}`);
      continue;
    }
    if (check || !install) {
      res.push(
        `${check ? "DIFF" : "info"} cli ${spec.name} ${spec.version} absent (--install pour installer)`,
      );
      continue;
    }

    const tag = (spec.tag ?? "v{version}").replaceAll(
      "{version}",
      spec.version,
    );
    const asset = assetTpl.replaceAll("{version}", spec.version);
    const url = `https://github.com/${spec.repo}/releases/download/${tag}/${asset}`;
    const bytes = await downloadVerified(url, wantSha);
    mkdirSync(binDir, { recursive: true });

    const tmp = mkdtempSync(join(tmpdir(), "ay-cli-"));
    try {
      const dlPath = join(tmp, basename(asset));
      writeFileSync(dlPath, bytes);
      if (
        !asset.endsWith(".zip") &&
        !asset.endsWith(".tar.gz") &&
        !asset.endsWith(".tar.xz")
      ) {
        const dstExe = join(binDir, WIN ? `${primaryBin}.exe` : primaryBin);
        writeFileSync(dstExe, bytes, WIN ? undefined : { mode: 0o755 });
        res.push(`set  cli ${spec.name} ${spec.version} -> ${dstExe}`);
      } else {
        const outDir = join(tmp, "out");
        extractArchive(dlPath, outDir);
        for (const b of spec.bin) {
          const wantName = WIN ? `${b}.exe` : b;
          const found = findExeRecursive(outDir, wantName);
          if (!found)
            throw new Error(`${spec.name}: ${wantName} missing in ${asset}`);
          const dstExe = join(binDir, wantName);
          writeFileSync(
            dstExe,
            readFileSync(found),
            WIN ? undefined : { mode: 0o755 },
          );
        }
        res.push(`set  cli ${spec.name} ${spec.version} -> ${binDir}`);
      }
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  }
}

function platformLabels(p: ShellCatalogEntry["platforms"]): string {
  return [p.windows ? "win" : "", p.linux ? "linux" : "", p.macos ? "mac" : ""]
    .filter(Boolean)
    .join("/");
}

export function writeCustomizationIndexDoc(res: Results, check: boolean) {
  const catalog = listShellCatalog();
  const themes = listTermThemes();
  const lines: string[] = [
    "# Index 2026 — Shells, CLIs, TUIs, Terminaux, Polices & Themes",
    "",
    "> Généré depuis le C ABI pur [`shell_kit.c`](../../../src/ui/shell_kit.c) (`aysys.dll` / `aysys.wasm`) via `bun packages/machine/src/shells.ts`.",
    "",
    `- **Commande unique (sync + polices + binaires)** : \`bun packages/machine/src/shells.ts --all\``,
    `- **Recherche C ABI O(log N) / docs** : \`bun packages/machine/src/shells.ts --index\` | \`--search <requête>\` | \`--docs <slug>\` | \`--theme <slug>\``,
    "",
    "## Catalogue des composants (" + catalog.length + " entrées)",
    "",
    "| Slug | Catégorie | Version | Plateformes | Source | Config | Documentation officielle |",
    "| :--- | :--- | :--- | :--- | :--- | :--- | :--- |",
  ];
  for (const e of catalog) {
    const cfg = e.config ? `\`${e.config}\`` : "—";
    lines.push(
      `| \`${e.slug}\` | ${e.category} | \`${e.version}\` | ${platformLabels(e.platforms)} | ${e.source} | ${cfg} | [${e.repo}](${e.docs}) |`,
    );
  }
  lines.push(
    "",
    "## Palettes terminaux C ABI (" + themes.length + " thèmes)",
    "",
    "| Slug | Nom | Mode | Fond | Texte | Accent |",
    "| :--- | :--- | :--- | :--- | :--- | :--- |",
  );
  for (const t of themes) {
    lines.push(
      `| \`${t.slug}\` | ${t.name} | ${t.isDark ? "dark" : "light"} | \`${t.bg}\` | \`${t.fg}\` | \`${t.accent}\` |`,
    );
  }
  const outPath = join(
    ROOT,
    "docs",
    "native",
    "shell",
    "CUSTOMIZATION-INDEX.md",
  );
  writeIfChanged(
    res,
    check,
    outPath,
    `${lines.join("\n")}\n`,
    "docs/native/shell/CUSTOMIZATION-INDEX.md",
  );
}

export function formatCatalogCli(query?: string, docsSlug?: string): string {
  if (docsSlug) {
    const entry = findShellEntry(docsSlug);
    if (!entry) return `Inconnu dans l'index C ABI : ${docsSlug}`;
    return [
      `${entry.name} (${entry.slug}) v${entry.version} [${entry.category}]`,
      `repo   : https://github.com/${entry.repo}`,
      `docs   : ${entry.docs}`,
      `config : ${entry.config || "—"}`,
      `source : ${entry.source} (${platformLabels(entry.platforms)})`,
    ].join("\n");
  }
  const entries = query ? searchShellCatalog(query) : listShellCatalog();
  const rows = entries.map(
    (e) =>
      `${e.slug.padEnd(20)} ${e.category.padEnd(9)} ${e.version.padEnd(8)} ${(e.binary || "-").padEnd(10)} ${e.docs}`,
  );
  const themes = listTermThemes().map((t) => {
    const bgNum = Number.parseInt(t.bg.slice(1), 16);
    const fgNum = Number.parseInt(t.fg.slice(1), 16);
    const swatch = formatTermSgr(
      0xff000000 | fgNum,
      0xff000000 | bgNum,
      (1 << 0) | (1 << 4) | (1 << 5),
    );
    return `${swatch} ${t.name} \x1b[0m (${t.slug})`;
  });
  return [
    `# C ABI 2026 Customization Index (${entries.length} entrées)`,
    ...rows,
    "",
    "# C ABI Palettes:",
    ...themes,
  ].join("\n");
}
