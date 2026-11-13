// SPDX-License-Identifier: Apache-2.0
/**
 * Registre unique des moteurs de navigation, d'automatisation et de crawl du dépôt.
 * Chaque entrée dit d'où vient le code (third_party/<nom>, fork aphrody-labs), comment le binaire
 * s'installe (ay up, Chrome for Testing, Playwright, uv tool, build distante) et quel protocole il
 * parle (CDP, WebDriver, MCP, CLI, bibliothèque). Aucune version n'est codée ici hors des épingles
 * des installeurs officiels (PINS) ; les binaires de release sont épinglés dans tools.toml.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type EngineProtocol =
  "cdp" | "webdriver" | "playwright" | "mcp" | "cli" | "library";

export type CftBrowser = "chrome" | "chrome-headless-shell";
export type CftChannel = "stable" | "beta" | "dev" | "canary";
export type PlaywrightBrowser =
  "chromium" | "chromium-headless-shell" | "firefox" | "webkit";

export type EngineInstall =
  /** Binaire de release épinglé dans tools.toml, installé par `ay up <tool>`. */
  | { via: "ay"; tool: string; bin: string }
  /** Chrome for Testing par @puppeteer/browsers (API JSON officielle). */
  | { via: "cft"; browser: CftBrowser; channel: CftChannel }
  /** Navigateurs Playwright (`playwright install`), cache partagé JS et Python. */
  | { via: "playwright"; browser: PlaywrightBrowser }
  /** Outil Python isolé par `uv tool install`. */
  | { via: "uv"; spec: string; bin: string }
  /** Construit hors du poste : fr1 (Chromium, LLVM) ou prd (le reste). */
  | { via: "build"; host: "fr1" | "prd"; output?: string[] }
  /** Bibliothèque consommée par dépendance (bun add, uv add, cargo), sans binaire. */
  | { via: "dependency"; registry: "npm" | "pypi" | "crates"; name: string }
  /** Navigateur installé par le système (Chrome, Edge). */
  | { via: "system" };

export interface Engine {
  readonly id: string;
  readonly title: string;
  readonly language: string;
  readonly protocol: EngineProtocol;
  readonly upstream: string;
  /** Dossier relatif à la racine du dépôt (third_party/<nom>) ou null si le code amont n'y est pas. */
  readonly thirdParty: string | null;
  readonly install: EngineInstall;
  /** argv (sans l'exécutable) qui expose le protocole sur 127.0.0.1:<port>. */
  serve?(port: number, profileDir: string): string[];
}

/** Versions des installeurs officiels lancés par `bun x` (npm et PyPI, vérifiées le 2026-11-13). */
export const PINS = {
  playwrightPython: "1.65.1",
  crawleePython: "1.11.2",
  puppeteerBrowsers: "3.2.7",
  playwright: "1.65.0",
} as const;

export const repoRoot = (): string =>
  Bun.env.SRC_ROOT || join(import.meta.dir, "..", "..", "..", "..");

export const binDir = (): string => join(homedir(), ".local", "bin");

/** Cache des navigateurs téléchargés : APHRODY_BROWSERS, sinon LOCALAPPDATA (Windows) ou XDG_CACHE_HOME. */
export const browsersCache = (): string =>
  Bun.env.APHRODY_BROWSERS ||
  (process.platform === "win32"
    ? join(
        Bun.env.LOCALAPPDATA || join(homedir(), "AppData", "Local"),
        "aphrody",
        "browsers",
      )
    : join(
        Bun.env.XDG_CACHE_HOME || join(homedir(), ".cache"),
        "aphrody",
        "browsers",
      ));

export const cftCache = (): string => join(browsersCache(), "cft");
export const playwrightCache = (): string =>
  join(browsersCache(), "ms-playwright");
const exe = (name: string) =>
  process.platform === "win32" ? `${name}.exe` : name;

const chromeFlags =
  (headlessFlag: boolean) => (port: number, profileDir: string) => [
    ...(headlessFlag ? ["--headless=new"] : []),
    `--remote-debugging-port=${port}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${profileDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-extensions",
    "about:blank",
  ];

const CHANNELS: readonly CftChannel[] = ["stable", "beta", "dev", "canary"];
const gh = (r: string) => `https://github.com/${r}`;

export const ENGINES: readonly Engine[] = [
  ...CHANNELS.flatMap((channel): Engine[] => [
    {
      id: `chrome@${channel}`,
      title: `Chrome for Testing (${channel})`,
      language: "C++",
      protocol: "cdp",
      upstream: gh("GoogleChromeLabs/chrome-for-testing"),
      thirdParty: "third_party/chrome-for-testing",
      install: { via: "cft", browser: "chrome", channel },
      serve: chromeFlags(true),
    },
    {
      id: `chrome-headless-shell@${channel}`,
      title: `chrome-headless-shell (${channel})`,
      language: "C++",
      protocol: "cdp",
      upstream: gh("GoogleChromeLabs/chrome-for-testing"),
      thirdParty: "third_party/chrome-for-testing",
      install: { via: "cft", browser: "chrome-headless-shell", channel },
      serve: chromeFlags(false),
    },
  ]),
  {
    id: "chromium",
    title: "Chromium du dépôt (gclient, build fr1)",
    language: "C++",
    protocol: "cdp",
    upstream: "https://chromium.googlesource.com/chromium/src",
    thirdParty: "third_party/chromium",
    install: {
      via: "build",
      host: "fr1",
      output: [
        "third_party/chromium/src/out/Release",
        "third_party/chromium/src/out/Default",
      ],
    },
    serve: chromeFlags(true),
  },
  {
    id: "chrome",
    title: "Chrome ou Edge du système",
    language: "C++",
    protocol: "cdp",
    upstream: "https://www.google.com/chrome/",
    thirdParty: null,
    install: { via: "system" },
    serve: chromeFlags(true),
  },
  ...(
    ["chromium", "chromium-headless-shell", "firefox", "webkit"] as const
  ).map((browser): Engine => ({
    id: `playwright-${browser}`,
    title: `Playwright ${browser}`,
    language: "C++",
    protocol: browser.startsWith("chromium") ? "cdp" : "playwright",
    upstream: gh("microsoft/playwright"),
    thirdParty: "third_party/playwright",
    install: { via: "playwright", browser },
    ...(browser.startsWith("chromium")
      ? { serve: chromeFlags(browser === "chromium") }
      : {}),
  })),
  {
    id: "lightpanda",
    title: "Lightpanda",
    language: "Zig",
    protocol: "cdp",
    upstream: gh("lightpanda-io/browser"),
    thirdParty: "third_party/lightpanda-io-browser",
    install: { via: "ay", tool: "lightpanda", bin: "lightpanda" },
    serve: (port) => ["serve", "--host", "127.0.0.1", "--port", String(port)],
  },
  {
    id: "obscura",
    title: "Obscura",
    language: "Rust",
    protocol: "cdp",
    upstream: gh("h4ckf0r0day/obscura"),
    thirdParty: "third_party/obscura",
    install: { via: "ay", tool: "obscura", bin: "obscura" },
    serve: (port) => ["serve", "--port", String(port)],
  },
  {
    id: "servo",
    title: "Servo",
    language: "Rust",
    protocol: "webdriver",
    upstream: gh("servo/servo"),
    thirdParty: "third_party/servo",
    install: { via: "ay", tool: "servo", bin: "servo" },
    serve: (port) => ["--headless", `--webdriver=${port}`, "about:blank"],
  },
  {
    id: "blitz",
    title: "Blitz (HTML/CSS, Stylo + Taffy + anyrender)",
    language: "Rust",
    protocol: "library",
    upstream: gh("DioxusLabs/blitz"),
    thirdParty: "third_party/blitz",
    install: { via: "build", host: "prd" },
  },
  {
    id: "javascriptcore",
    title: "JavaScriptCore de bun (oven-sh/WebKit)",
    language: "C++",
    protocol: "library",
    upstream: gh("oven-sh/WebKit"),
    thirdParty: "third_party/WebKit",
    install: { via: "build", host: "prd" },
  },
  {
    id: "v8",
    title: "V8 du Chromium du dépôt",
    language: "C++",
    protocol: "library",
    upstream: "https://chromium.googlesource.com/v8/v8",
    thirdParty: "third_party/chromium/src/v8",
    install: { via: "build", host: "fr1" },
  },
  {
    id: "agent-browser",
    title: "agent-browser (CLI et MCP)",
    language: "Rust",
    protocol: "cli",
    upstream: gh("vercel-labs/agent-browser"),
    thirdParty: "third_party/agent-browser",
    install: { via: "ay", tool: "agent-browser", bin: "agent-browser" },
  },
  {
    id: "chrome-devtools-mcp",
    title: "Chrome DevTools MCP",
    language: "TypeScript",
    protocol: "mcp",
    upstream: gh("ChromeDevTools/chrome-devtools-mcp"),
    thirdParty: "third_party/chrome-devtools-mcp",
    install: {
      via: "ay",
      tool: "chrome-devtools-mcp",
      bin: "chrome-devtools-mcp",
    },
  },
  {
    id: "playwright-mcp",
    title: "Playwright MCP",
    language: "TypeScript",
    protocol: "mcp",
    upstream: gh("microsoft/playwright-mcp"),
    thirdParty: "third_party/playwright-mcp",
    install: { via: "ay", tool: "playwright-mcp", bin: "playwright-mcp" },
  },
  {
    id: "playwright-python",
    title: "Playwright pour Python",
    language: "Python",
    protocol: "cli",
    upstream: gh("microsoft/playwright-python"),
    thirdParty: "third_party/playwright-python",
    install: {
      via: "uv",
      spec: `playwright==${PINS.playwrightPython}`,
      bin: "playwright",
    },
  },
  {
    id: "crawlee-python",
    title: "Crawlee pour Python",
    language: "Python",
    protocol: "cli",
    upstream: gh("apify/crawlee-python"),
    thirdParty: "third_party/crawlee-python",
    install: {
      via: "uv",
      spec: `crawlee[cli]==${PINS.crawleePython}`,
      bin: "crawlee",
    },
  },
  {
    id: "apify-cli",
    title: "Apify CLI (plateforme Apify)",
    language: "TypeScript",
    protocol: "cli",
    upstream: gh("apify/apify-cli"),
    thirdParty: "third_party/apify-cli",
    install: { via: "ay", tool: "apify-cli", bin: "apify" },
  },
  {
    id: "crawlee",
    title: "Crawlee (JS)",
    language: "TypeScript",
    protocol: "library",
    upstream: gh("apify/crawlee"),
    thirdParty: "third_party/crawlee",
    install: { via: "dependency", registry: "npm", name: "crawlee" },
  },
  {
    id: "puppeteer",
    title: "Puppeteer",
    language: "TypeScript",
    protocol: "library",
    upstream: gh("puppeteer/puppeteer"),
    thirdParty: "third_party/puppeteer",
    install: { via: "dependency", registry: "npm", name: "puppeteer-core" },
  },
  {
    id: "playwright",
    title: "Playwright (JS)",
    language: "TypeScript",
    protocol: "library",
    upstream: gh("microsoft/playwright"),
    thirdParty: "third_party/playwright",
    install: { via: "dependency", registry: "npm", name: "playwright-core" },
  },
  {
    id: "apify-sdk",
    title: "Apify SDK (JS)",
    language: "TypeScript",
    protocol: "library",
    upstream: gh("apify/apify-sdk-js"),
    thirdParty: "third_party/apify-sdk-js",
    install: { via: "dependency", registry: "npm", name: "apify" },
  },
  {
    id: "apify-sdk-python",
    title: "Apify SDK (Python)",
    language: "Python",
    protocol: "library",
    upstream: gh("apify/apify-sdk-python"),
    thirdParty: "third_party/apify-sdk-python",
    install: { via: "dependency", registry: "pypi", name: "apify" },
  },
  {
    id: "apify-client",
    title: "Client API Apify (JS)",
    language: "TypeScript",
    protocol: "library",
    upstream: gh("apify/apify-client-js"),
    thirdParty: "third_party/apify-client-js",
    install: { via: "dependency", registry: "npm", name: "apify-client" },
  },
  {
    id: "apify-client-python",
    title: "Client API Apify (Python)",
    language: "Python",
    protocol: "library",
    upstream: gh("apify/apify-client-python"),
    thirdParty: "third_party/apify-client-python",
    install: { via: "dependency", registry: "pypi", name: "apify-client" },
  },
];

export function getEngine(id: string): Engine {
  const e = ENGINES.find((x) => x.id === id);
  if (!e)
    throw new Error(
      `moteur inconnu : ${id} (voir \`chromium-bun engines list\`)`,
    );
  return e;
}

/** Correspondance canal -> exécutable écrite par l'installation Chrome for Testing. */
export const cftIndexFile = (): string => join(cftCache(), "channels.json");
export const readCftIndex = (): Record<
  string,
  { buildId: string; path: string }
> => {
  try {
    return JSON.parse(readFileSync(cftIndexFile(), "utf8"));
  } catch {
    return {};
  }
};

const PLAYWRIGHT_LAYOUT: Record<
  PlaywrightBrowser,
  { dir: string; rel: Record<string, string[]> }
> = {
  chromium: {
    dir: "chromium-",
    rel: {
      win32: ["chrome-win64/chrome.exe", "chrome-win/chrome.exe"],
      linux: ["chrome-linux64/chrome", "chrome-linux/chrome"],
      darwin: [
        "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing",
        "chrome-mac/Chromium.app/Contents/MacOS/Chromium",
      ],
    },
  },
  "chromium-headless-shell": {
    dir: "chromium_headless_shell-",
    rel: {
      win32: [
        "chrome-headless-shell-win64/chrome-headless-shell.exe",
        "chrome-win/headless_shell.exe",
      ],
      linux: [
        "chrome-headless-shell-linux64/chrome-headless-shell",
        "chrome-linux/headless_shell",
      ],
      darwin: [
        "chrome-headless-shell-mac-arm64/chrome-headless-shell",
        "chrome-mac/headless_shell",
      ],
    },
  },
  firefox: {
    dir: "firefox-",
    rel: {
      win32: ["firefox/firefox.exe"],
      linux: ["firefox/firefox"],
      darwin: ["firefox/Nightly.app/Contents/MacOS/firefox"],
    },
  },
  webkit: {
    dir: "webkit-",
    rel: {
      win32: ["Playwright.exe"],
      linux: ["pw_run.sh"],
      darwin: ["pw_run.sh"],
    },
  },
};

function playwrightExecutable(browser: PlaywrightBrowser): string | null {
  const root = playwrightCache();
  if (!existsSync(root)) return null;
  const layout = PLAYWRIGHT_LAYOUT[browser];
  const dirs = readdirSync(root)
    .filter(
      (d) =>
        d.startsWith(layout.dir) && /^\d+$/.test(d.slice(layout.dir.length)),
    )
    .sort(
      (a, b) =>
        Number(b.slice(layout.dir.length)) - Number(a.slice(layout.dir.length)),
    );
  for (const d of dirs)
    for (const rel of layout.rel[process.platform] ?? [])
      if (existsSync(join(root, d, rel))) return join(root, d, rel);
  return null;
}

function systemChrome(): string | null {
  if (process.platform === "win32") {
    for (const app of ["chrome.exe", "msedge.exe"]) {
      const q = Bun.spawnSync([
        "reg",
        "query",
        `HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\${app}`,
        "/ve",
      ]);
      const m = /REG_SZ\s+(.+\.exe)/i.exec(q.stdout.toString());
      if (m && existsSync(m[1]!.trim())) return m[1]!.trim();
    }
  }
  for (const c of [
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "chromium-browser",
    "chrome",
    "microsoft-edge",
  ]) {
    const p = Bun.which(c);
    if (p) return p;
  }
  return null;
}

/** Exécutable du moteur s'il est présent sur cette machine, sinon null (aucun téléchargement). */
export function resolveExecutable(engine: Engine): string | null {
  const i = engine.install;
  switch (i.via) {
    case "ay": {
      const local = join(binDir(), exe(i.bin));
      return existsSync(local) ? local : (Bun.which(i.bin) ?? null);
    }
    case "uv": {
      // uv tool install écrit dans UV_TOOL_BIN_DIR = binDir() ; un homonyme ailleurs (bun global) ne compte pas.
      const local = join(binDir(), exe(i.bin));
      return existsSync(local) ? local : null;
    }
    case "cft":
      return readCftIndex()[`${i.browser}@${i.channel}`]?.path ?? null;
    case "playwright":
      return playwrightExecutable(i.browser);
    case "system":
      return systemChrome();
    case "build": {
      if (engine.id === "chromium" && Bun.env.CHROMIUM_PATH)
        return Bun.env.CHROMIUM_PATH;
      for (const out of i.output ?? []) {
        const p = join(repoRoot(), out, exe("chrome"));
        if (existsSync(p)) return p;
      }
      return null;
    }
    case "dependency":
      return null;
  }
}

/** Premier Chromium disponible : CHROME_PATH, build du dépôt, Chrome for Testing stable, Playwright, système. */
export function resolveChromium(): string | null {
  if (Bun.env.CHROME_PATH && existsSync(Bun.env.CHROME_PATH))
    return Bun.env.CHROME_PATH;
  for (const id of [
    "chromium",
    "chrome@stable",
    "chrome-headless-shell@stable",
    "playwright-chromium",
    "chrome",
  ]) {
    const p = resolveExecutable(getEngine(id));
    if (p) return p;
  }
  return null;
}
