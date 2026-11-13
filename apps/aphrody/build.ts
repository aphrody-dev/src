import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, extname, join } from "path";
import { brotliCompressSync, constants as zc } from "node:zlib";
import { validateWeb, formatReport } from "../../packages/wck/src/index";
import { componentsBundle, tokensCss } from "../../packages/deploy/src/m3";
import { buildCsp, readGoogleConfig } from "./src/google/config";
import {
  adsTxt,
  agentJson,
  buildSitemaps,
  humansTxt,
  indexNowKey,
  llmsFullTxt,
  llmsTxt,
  robotsTxt,
  securityTxt,
  sellersJson,
  webmcpJson,
} from "./src/seo/documents";
import { minifyCss } from "./src/seo/page-css";
import { render404 } from "./src/seo/html";
import { PLAY_CSP, renderPlay } from "./src/play/page";
import { buildImmersive } from "./src/immersive/build";
import { buildOs } from "./src/os/build";
import {
  holding404,
  HOME_LOCALES,
  artSprite,
  holdingCss,
  productIcons,
  renderHolding,
} from "./src/holding/page";

const ROOT = import.meta.dir;
const DIST_DIR = join(ROOT, "dist");
const BUILD_DATE = new Date().toISOString().slice(0, 10);
const cfg = readGoogleConfig(process.env);

if (existsSync(DIST_DIR)) rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });

function emit(rel: string, content: string | Uint8Array): void {
  const file = join(DIST_DIR, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
}

console.log("Building Aphrody with native Bun.build()...");

// 1. Small boot entry (consent, analytics config, WebMCP). Pages render without it.
const bootBuild = await Bun.build({
  entrypoints: [join(ROOT, "src", "client", "boot.ts")],
  outdir: DIST_DIR,
  naming: "boot.js",
  define: { __G_CFG__: JSON.stringify(cfg) },
  minify: true,
  target: "browser",
  format: "esm",
});
for (const r of [bootBuild]) {
  if (!r.success) {
    console.error("Build failed:", r.logs);
    process.exit(1);
  }
}

// 2. CSS: legacy stylesheet + generated M3 token subset + M3 layer, minified.
const rawCss = [
  readFileSync(join(ROOT, "src", "style.css"), "utf-8"),
  tokensCss(join(ROOT, "..", "..")), // packages/design/tokens/tokens.css (skill ui-system)
  readFileSync(join(ROOT, "src", "m3.css"), "utf-8"),
].join("\n");
emit("style.css", minifyCss(rawCss));

// 3. Static HTML (SSG): home page in the five locales of packages/i18n.
// Public site = the holding page only (fr, en, zh-CN, ja, es): no technical hubs, package catalogs or changelogs.
const SRC_ROOT = join(ROOT, "..", "..");
for (const l of HOME_LOCALES)
  emit((l === "fr" ? "" : `${l}/`) + "index.html", renderHolding(SRC_ROOT, l));

// 4. Crawler, agent and compliance documents.
emit("art.svg", artSprite(SRC_ROOT));
emit("robots.txt", robotsTxt());
for (const [name, xml] of Object.entries(buildSitemaps(BUILD_DATE)))
  emit(name, xml);
emit("llms.txt", llmsTxt());
emit("llms-full.txt", llmsFullTxt());
const contact = (process.env.PUBLIC_CONTACT_EMAIL || "").trim() || undefined;
emit("ads.txt", adsTxt(cfg));
emit("sellers.json", JSON.stringify(sellersJson(contact), null, 2));
emit(".well-known/security.txt", securityTxt(BUILD_DATE, contact));
emit("humans.txt", humansTxt(BUILD_DATE));
const nowKey = indexNowKey(process.env);
emit(`${nowKey}.txt`, nowKey);
emit("g-cfg.json", JSON.stringify(cfg));
emit("404.html", holding404(SRC_ROOT));
// 3b. /play: full-screen WebGPU canvas. The wasm build (crates/game, wasm-bindgen --target web) is
// produced on fr1 or by .github/workflows/game.yml into GAME_WEB_DIR (default target/game-web); when it
// is absent the page still ships and tells the visitor the game is not installed.
emit("play/index.html", renderPlay());
const playBuild = await Bun.build({
  entrypoints: [join(ROOT, "src", "client", "play.ts")],
  outdir: join(DIST_DIR, "play"),
  naming: "play.js",
  minify: true,
  target: "browser",
  format: "esm",
});
if (!playBuild.success) {
  console.error("Play build failed:", playBuild.logs);
  process.exit(1);
}
const GAME_WEB_DIR =
  process.env.GAME_WEB_DIR || join(ROOT, "..", "..", "target", "game-web");
let gameWasm = false;
for (const f of ["game.js", "game_bg.wasm"]) {
  const from = join(GAME_WEB_DIR, f);
  if (existsSync(from)) {
    cpSync(from, join(DIST_DIR, "play", f));
    gameWasm = true;
  }
}
// Procedural assets written by `gen-assets` (deterministic GLB and SVG), committed in crates/game/assets.
const gameAssets = join(ROOT, "..", "..", "crates", "game", "assets");
if (existsSync(gameAssets))
  cpSync(gameAssets, join(DIST_DIR, "play", "assets"), { recursive: true });
// 3c. /os: browser OS shell (apps/aphrody/src/os): pages in five locales, client, owner assets, pinned runtimes.
for (const l of await buildOs(ROOT, DIST_DIR, emit)) console.log(`- ${l}`);
console.log(
  `- /play: wasm build ${gameWasm ? "included" : "absent (message page only)"}`,
);
// Immersive stage (WebGPU, textures from assets/library): bundles and the 512 px texture set.
for (const l of await buildImmersive(ROOT, DIST_DIR, {
  "stage-home.js": "home-entry.ts",
}))
  console.log(`- ${l}`);
// Product icons from `ay brand build` (assets/brand/gen/icons/<id>/), shown on the home page and in JSON-LD.
for (const i of productIcons(SRC_ROOT)) {
  emit(`icons/${i.id}.svg`, readFileSync(i.svg));
  emit(`icons/${i.id}.png`, readFileSync(i.png));
}
// Site icon set, social card and web font from `ay brand build` (assets/brand/gen, also on
// cdn.aphrody.com/brand/v1): single source, no copy in public/.
const BRAND_GEN = join(SRC_ROOT, "assets/brand/gen");
for (const [from, to] of [
  ["icons/aphrody-labs/favicon.ico", "favicon.ico"],
  ["icons/aphrody-labs/icon.svg", "favicon.svg"],
  ["icons/aphrody-labs/icon.svg", "icon.svg"],
  ["icons/aphrody-labs/apple-touch-icon.png", "apple-touch-icon.png"],
  ["icons/aphrody-labs/icon-192.png", "icon-192.png"],
  ["icons/aphrody-labs/icon-512.png", "icon-512.png"],
  ["icons/aphrody-labs/maskable-512.png", "maskable-512.png"],
  ["icons/aphrody-labs/site.webmanifest", "site.webmanifest"],
  ["og/aphrody-labs.png", "og-image.png"],
  ["fonts/atkinson-hyperlegible-next.woff2", "atkinson-next.woff2"],
  ["fonts/atkinson-hyperlegible-next-OFL.txt", "atkinson-next-OFL.txt"],
] as const)
  emit(to, readFileSync(join(BRAND_GEN, from)));
// Edge headers (Cloudflare Workers assets / Pages). Same policy as server.ts.
emit(
  "_headers",
  [
    "/*",
    "  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload",
    "  X-Content-Type-Options: nosniff",
    "  X-Frame-Options: SAMEORIGIN",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: microphone=(), camera=(), geolocation=()",
    "  Cross-Origin-Opener-Policy: same-origin",
    `  Content-Security-Policy: ${buildCsp(cfg)}`,
    "/play/*",
    "  ! Content-Security-Policy",
    `  Content-Security-Policy: ${PLAY_CSP}`,
    "  Permissions-Policy: microphone=(), camera=(), geolocation=(), gamepad=(self)",
    "/atkinson-next.woff2",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/icons/*",
    "  Cache-Control: public, max-age=86400",
    "/shots/*",
    "  Cache-Control: public, max-age=86400",
    "/*.xml",
    "  Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    "/ads.txt",
    "  Content-Type: text/plain; charset=utf-8",
    "  Cache-Control: public, max-age=0, s-maxage=3600",
    "",
  ].join("\n"),
);
// public/: site-only files (captures in shots/); brand assets come from assets/brand/gen above.
const publicDir = join(ROOT, "public");
if (existsSync(publicDir)) {
  for (const f of readdirSync(publicDir))
    cpSync(join(publicDir, f), join(DIST_DIR, f), { recursive: true });
}
// Material Web (packages/design/src/components.ts), loaded as a module by the holding page.
emit("md.js", await componentsBundle(join(ROOT, "..", "..")));
emit("holding.css", minifyCss(holdingCss(join(ROOT, "..", ".."))));

// 5. Pre-compress text assets (gzip + brotli) for in-memory serving.
const COMPRESS = new Set([
  ".wasm",
  ".html",
  ".js",
  ".css",
  ".svg",
  ".json",
  ".txt",
  ".xml",
]);
function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n: string) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
let htmlCount = 0;
for (const file of walk(DIST_DIR)) {
  if (/\.(gz|br)$/.test(file)) continue;
  if (file.endsWith(".html")) htmlCount++;
  if (!COMPRESS.has(extname(file).toLowerCase())) continue;
  const raw = readFileSync(file);
  writeFileSync(`${file}.gz`, Bun.gzipSync(raw));
  writeFileSync(
    `${file}.br`,
    brotliCompressSync(raw, {
      // quality 11 takes minutes on a multi-megabyte wasm module
      params: {
        [zc.BROTLI_PARAM_QUALITY]: file.endsWith(".wasm") ? 9 : 11,
      },
    }),
  );
}

const sz = (rel: string) => statSync(join(DIST_DIR, rel)).size;
const gz = (rel: string) => statSync(join(DIST_DIR, rel + ".gz")).size;
console.log("Aphrody build finished:");
for (const f of ["boot.js", "style.css", "index.html"]) {
  console.log(
    `- dist/${f}: ${(sz(f) / 1024).toFixed(2)} KB (gz: ${(gz(f) / 1024).toFixed(2)} KB)`,
  );
}
console.log(
  `- ${htmlCount} HTML pages, ${Object.keys(buildSitemaps(BUILD_DATE)).length} sitemap files`,
);
console.log(
  `- google ids configured: ${Object.keys(cfg).join(", ") || "none (no Google tag is loaded)"}`,
);

// 6. WCK compile-time 7-spec gate (Lighthouse 100, CLS = 0, LCP budget).
console.log("\nExecuting WCK 7-Spec Compile-Time Web & Lighthouse Gate...");
const report = validateWeb(DIST_DIR);
console.log(formatReport(report));
if (!report.allPassed) {
  console.error("FATAL: WCK Compile-Time Gate failed! Build aborted.");
  process.exit(1);
}
console.log("Aphrody build 100% validated by WCK!");
