// @aphrody/browser: Lightpanda Zig headless browser core + unified monorepo V8 resolver + bun:ffi bridge.
import { CString, FFIType, dlopen, ptr, suffix, type Pointer } from "bun:ffi";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const LP_ABI_VERSION = 1;
export const BROWSER_LIB_FILE = `${process.platform === "win32" ? "" : "lib"}browser_capi.${suffix}`;

const symbols = {
  lp_abi_version: { args: [], returns: FFIType.u32 },
  lp_free: { args: [FFIType.ptr], returns: FFIType.void },
  lp_capabilities_json: { args: [], returns: FFIType.ptr },
  lp_extract_title_json: { args: [FFIType.ptr], returns: FFIType.ptr },
  lp_normalize_url_json: { args: [FFIType.ptr], returns: FFIType.ptr },
} as const;

type BrowserLib = ReturnType<typeof dlopen<typeof symbols>>;

const cstr = (s: string) => ptr(Buffer.from(`${s}\0`, "utf8"));

export function browserLibCandidates(): string[] {
  const pkgRoot = join(import.meta.dir, "..");
  return [
    process.env.APHRODY_BROWSER_LIB,
    join(pkgRoot, "native", "zig-out", "bin", BROWSER_LIB_FILE),
    join(pkgRoot, "native", "zig-out", "lib", BROWSER_LIB_FILE),
    join(homedir(), ".local", "bin", BROWSER_LIB_FILE),
  ].filter((p): p is string => Boolean(p));
}

/** Unified V8 locator: consolidates V8/CEF/Chromium consumers onto the monorepo V8 (rusty_v8 / chromium/v8). */
export function resolveAphrodyV8(): { source: string; path: string } | null {
  if (process.env.APHRODY_V8_LIB && existsSync(process.env.APHRODY_V8_LIB)) {
    return { source: "env", path: process.env.APHRODY_V8_LIB };
  }
  const repoRoot = join(import.meta.dir, "..", "..", "..");
  const candidates: Array<{ source: string; path: string }> = [
    {
      source: "rusty_v8",
      path: join(
        repoRoot,
        "third_party",
        "rusty_v8",
        "target",
        "release",
        "rusty_v8.lib",
      ),
    },
    {
      source: "rusty_v8",
      path: join(
        repoRoot,
        "third_party",
        "rusty_v8",
        "target",
        "release",
        "librusty_v8.a",
      ),
    },
    { source: "rusty_v8-src", path: join(repoRoot, "third_party", "rusty_v8") },
    {
      source: "aphrody-v8",
      path: join(repoRoot, "crates", "aphrody-v8"),
    },
    {
      source: "chromium-v8",
      path: join(repoRoot, "third_party", "chromium", "v8"),
    },
  ];
  for (const c of candidates) {
    if (existsSync(c.path)) return c;
  }
  return null;
}

let cached: { lib: BrowserLib; path: string } | null | undefined;

export function loadBrowserCore(): { lib: BrowserLib; path: string } | null {
  if (cached !== undefined) return cached;
  for (const p of browserLibCandidates()) {
    if (!existsSync(p)) continue;
    try {
      const lib = dlopen(p, symbols);
      if (lib.symbols.lp_abi_version() !== LP_ABI_VERSION) {
        lib.close();
        continue;
      }
      cached = { lib, path: p };
      return cached;
    } catch {
      // try next candidate
    }
  }
  cached = null;
  return null;
}

function takeJson<T>(lib: BrowserLib, p: Pointer | bigint | null): T {
  if (!p) throw new Error("browser_capi returned null pointer");
  const ptrVal = p as Pointer;
  try {
    return JSON.parse(new CString(ptrVal).toString()) as T;
  } finally {
    lib.symbols.lp_free(ptrVal);
  }
}

export function lpCapabilities(): {
  native: boolean;
  abi: number;
  engine: string;
  v8: string;
  features: string[];
} {
  const loaded = loadBrowserCore();
  if (!loaded) {
    return {
      native: false,
      abi: LP_ABI_VERSION,
      engine: "ts-fallback",
      v8: resolveAphrodyV8()?.source ?? "none",
      features: ["extract_title", "normalize_url"],
    };
  }
  const j = takeJson<{
    abi: number;
    engine: string;
    v8: string;
    features: string[];
  }>(loaded.lib, loaded.lib.symbols.lp_capabilities_json());
  return { native: true, ...j };
}

export function lpExtractTitle(html: string): string {
  const loaded = loadBrowserCore();
  if (loaded) {
    return takeJson<{ title: string }>(
      loaded.lib,
      loaded.lib.symbols.lp_extract_title_json(cstr(html)),
    ).title;
  }
  const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  return m?.[1]?.trim() ?? "";
}

export function lpNormalizeUrl(url: string): string {
  const loaded = loadBrowserCore();
  if (loaded) {
    return takeJson<{ url: string }>(
      loaded.lib,
      loaded.lib.symbols.lp_normalize_url_json(cstr(url)),
    ).url;
  }
  const t = url.trim();
  if (!t || t.includes("://")) return t;
  return `https://${t}`;
}
