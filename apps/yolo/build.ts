// SPDX-License-Identifier: Apache-2.0
/**
 * Yolo Reproducible Fullstack Builder (Pure Bun v1.4.4)
 * Bundles client TypeScript with m3IconPlugin + iconsPlugin + m3TokensPlugin,
 * minifies CSS/HTML, builds .yolo/graph.sqlite AST module graph, and enforces WCK 14KB/30KB budgets.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { brotliCompressSync, constants as zlibConstants } from "node:zlib";
import { symbolsPlugin } from "../../packages/design/src/bun-plugin.ts";
import { YoloModuleGraph } from "./src/framework/graph.ts";

const APP_ROOT = import.meta.dir;
const DIST_DIR = join(APP_ROOT, "dist");
const DESIGN_ASSETS = join(APP_ROOT, "../../packages/design/assets");
const BRAND_ICONS = join(APP_ROOT, "../../assets/brand/gen/icons/yolo");

const BRAND_MARK_SVG = readFileSync(join(BRAND_ICONS, "icon.svg"), "utf8");

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,>~+])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

function precompressFile(filePath: string): {
  raw: number;
  gz: number;
  br: number;
} {
  const buf = new Uint8Array(readFileSync(filePath));
  const gz = Bun.gzipSync(buf, { level: 9 });
  const br = brotliCompressSync(buf, {
    params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 11 },
  });
  writeFileSync(`${filePath}.gz`, gz);
  writeFileSync(`${filePath}.br`, br);
  return { raw: buf.byteLength, gz: gz.byteLength, br: br.byteLength };
}

export async function buildYoloApp(): Promise<{
  htmlGzBytes: number;
  cssGzBytes: number;
  jsGzBytes: number;
  moduleCount: number;
}> {
  rmSync(DIST_DIR, { recursive: true, force: true });
  mkdirSync(join(DIST_DIR, "assets/fonts"), { recursive: true });

  // 1. Scan AST module graph into .yolo/graph.sqlite
  const graph = new YoloModuleGraph(
    APP_ROOT,
    join(APP_ROOT, ".yolo/graph.sqlite"),
  );
  const summary = graph.scanProject();
  graph.close();

  // 2. Bundle client TypeScript with sovereign M3 plugins
  const bundle = await Bun.build({
    entrypoints: [join(APP_ROOT, "src/client/app.ts")],
    outdir: DIST_DIR,
    target: "browser",
    format: "esm",
    minify: true,
    splitting: false,
    plugins: [symbolsPlugin],
  });

  if (!bundle.success) {
    const msgs = bundle.logs.map((l) => l.message).join("\n");
    throw new Error(`Yolo Bun.build failed:\n${msgs}`);
  }

  // 3. Write minified CSS + HTML + brand mark + linked Google Design assets
  const rawCss = readFileSync(join(APP_ROOT, "src/client/style.css"), "utf8");
  writeFileSync(join(DIST_DIR, "style.css"), minifyCss(rawCss));

  const rawHtml = readFileSync(join(APP_ROOT, "src/client/index.html"), "utf8");
  writeFileSync(join(DIST_DIR, "index.html"), rawHtml);
  writeFileSync(join(DIST_DIR, "assets/brand-mark.svg"), BRAND_MARK_SVG);

  const assetPairs: Array<[string, string]> = [
    [
      join(DESIGN_ASSETS, "fonts/GoogleSansFlex-latin.woff2"),
      join(DIST_DIR, "assets/fonts/GoogleSansFlex-latin.woff2"),
    ],
    [
      join(DESIGN_ASSETS, "fonts/GoogleSansCode-latin.woff2"),
      join(DIST_DIR, "assets/fonts/GoogleSansCode-latin.woff2"),
    ],
    [join(BRAND_ICONS, "favicon.ico"), join(DIST_DIR, "favicon.ico")],
  ];

  for (const [src, dst] of assetPairs) {
    if (existsSync(src)) copyFileSync(src, dst);
  }

  const htmlStats = precompressFile(join(DIST_DIR, "index.html"));
  const cssStats = precompressFile(join(DIST_DIR, "style.css"));
  const jsStats = precompressFile(join(DIST_DIR, "app.js"));
  precompressFile(join(DIST_DIR, "assets/brand-mark.svg"));

  // Enforce strict Google/WCK initial TCP cwnd budget (index.html.gz + style.css.gz <= 14 KB, app.js.gz <= 30 KB)
  const criticalGz = htmlStats.gz + cssStats.gz;
  if (criticalGz > 14 * 1024) {
    throw new Error(`Critical path budget exceeded: ${criticalGz}B > 14336B`);
  }
  if (jsStats.gz > 30 * 1024) {
    throw new Error(`Client JS budget exceeded: ${jsStats.gz}B > 30720B`);
  }

  return {
    htmlGzBytes: htmlStats.gz,
    cssGzBytes: cssStats.gz,
    jsGzBytes: jsStats.gz,
    moduleCount: summary.totalModules,
  };
}

if (import.meta.main) {
  void buildYoloApp().then((stats) => {
    console.log(
      `[yolo build] OK — modules=${stats.moduleCount} html.gz=${stats.htmlGzBytes}B style.css.gz=${stats.cssGzBytes}B app.js.gz=${stats.jsGzBytes}B`,
    );
  });
}
