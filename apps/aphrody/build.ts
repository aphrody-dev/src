import {
  copyFileSync,
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
import {
  render404,
  renderNews,
  renderPackageHub,
  renderVertical,
} from "./src/seo/html";
import {
  LOCALES,
  NEWS,
  PACKAGE_ECOSYSTEMS,
  VERTICALS,
  localizedPath,
  newsPath,
  packageHubPath,
  verticalPath,
} from "./src/seo/site";
import { UniversalStoreManager } from "./src/store/universal-manager";
import { holdingCss, measure, renderHolding } from "./src/holding/page";

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

// 3. Static HTML (SSG): home, topic hubs, package hubs, news - fr and en.
const store = new UniversalStoreManager(":memory:");
const pageFile = (path: string, l: "fr" | "en") => {
  const p = localizedPath(path, l);
  return (p === "/" ? "" : p.slice(1) + "/") + "index.html";
};
// Home = holding page generated from docs/ALPHABET.md (abc.xyz model); the former product home stays
// available as renderHome for the search and package pages it links to.
const SRC_ROOT = join(ROOT, "..", "..");
const metrics = measure(SRC_ROOT);
for (const l of LOCALES) {
  emit(pageFile("/", l), renderHolding(SRC_ROOT, l, metrics));
  for (const v of VERTICALS)
    emit(pageFile(verticalPath(v.slug), l), renderVertical(v, l, cfg));
  for (const eco of PACKAGE_ECOSYSTEMS) {
    const pkgs = (await store.search("", eco as never)).map((p) => ({
      name: p.name,
      description: p.description,
      installCmd: p.installCmd,
    }));
    emit(pageFile(packageHubPath(eco), l), renderPackageHub(eco, pkgs, l, cfg));
  }
  for (const n of NEWS)
    emit(pageFile(newsPath(n.slug), l), renderNews(n, l, cfg));
}

// 4. Crawler, agent and compliance documents.
emit("robots.txt", robotsTxt());
for (const [name, xml] of Object.entries(buildSitemaps(BUILD_DATE)))
  emit(name, xml);
emit("llms.txt", llmsTxt());
emit("llms-full.txt", llmsFullTxt());
const contact = (process.env.PUBLIC_CONTACT_EMAIL || "").trim() || undefined;
emit("ads.txt", adsTxt(cfg));
emit("sellers.json", JSON.stringify(sellersJson(contact), null, 2));
emit(".well-known/security.txt", securityTxt(BUILD_DATE, contact));
emit(".well-known/agent.json", JSON.stringify(agentJson(), null, 2));
emit(".well-known/webmcp.json", JSON.stringify(webmcpJson(), null, 2));
emit("humans.txt", humansTxt(BUILD_DATE));
const nowKey = indexNowKey(process.env);
emit(`${nowKey}.txt`, nowKey);
emit("g-cfg.json", JSON.stringify(cfg));
emit("404.html", render404("fr", cfg));
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
    `  Content-Security-Policy: ${buildCsp(cfg)}`,
    "/atkinson-next.woff2",
    "  Cache-Control: public, max-age=31536000, immutable",
    "/*.xml",
    "  Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    "/ads.txt",
    "  Content-Type: text/plain; charset=utf-8",
    "  Cache-Control: public, max-age=0, s-maxage=3600",
    "",
  ].join("\n"),
);
emit(
  "favicon.svg",
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="10" fill="#17202A"/><path d="M32 14L49 48H40.6L37.1 40.4H26.9L23.4 48H15L32 14ZM29.6 34H34.4L32 28.2L29.6 34Z" fill="#F2F4F1"/><rect x="42" y="10" width="12" height="12" rx="2" fill="#3FC1B9"/></svg>',
);
const publicDir = join(ROOT, "public");
if (existsSync(publicDir)) {
  for (const f of readdirSync(publicDir))
    copyFileSync(join(publicDir, f), join(DIST_DIR, f));
}
// Material Web (packages/design/src/components.ts), loaded as a module by the holding page.
emit("md.js", await componentsBundle(join(ROOT, "..", "..")));
emit("holding.css", minifyCss(holdingCss(join(ROOT, "..", ".."))));

// 5. Pre-compress text assets (gzip + brotli) for in-memory serving.
const COMPRESS = new Set([
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
    brotliCompressSync(raw, { params: { [zc.BROTLI_PARAM_QUALITY]: 11 } }),
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
