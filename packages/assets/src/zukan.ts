// Rose Griffon (`@rosegriffon/inagle`, `nie`, `rg-cron`, `rg-ui`) Byron Love / Aphrody Zukan crawler &
// real W3C SVG 2 / Material Symbols / Favicon / Material 3 + OKLCH Theme generator.
import * as mcu from "@material/material-color-utilities";
import { load as cheerioLoad } from "../../../apps/rosegriffon/node_modules/cheerio/dist/esm/index.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { optimizeSvg2, validateSvg2, vectorizeRgbaToSvg2 } from "./svg2.ts";
import { syncMaterialSymbolsDir } from "./material-symbols.ts";
import { syncBevyMeta } from "./bevy.ts";
import {
  computeRoles,
  type RoleMap,
} from "../../../apps/rosegriffon/packages/rg-ui/src/lib/color-engine.ts";

export const BYRON_ZUKAN_URL =
  "https://zukan.inazuma.jp/en/chara_list/?q=hN2RnpKaoIyano2cl93FpN2-j5eNkJuG392igg==";

export interface ZukanCharaEntry {
  id: string;
  series: string;
  name: string;
  nickname: string;
  detailUrl: string;
  imageUrl: string;
  modelViewUrl: string | null;
  gender: string;
  element: string;
  position: string;
  role: string;
  team: string;
  description: string;
}

/** Parses `zukan.inazuma.jp/en/chara_list/` using Rose Griffon `@rosegriffon/inagle` Cheerio selectors (`tbody > tr`). */
export function parseZukanListHtml(html: string): {
  entries: ZukanCharaEntry[];
  svgAssets: string[];
  cssAssets: string[];
} {
  const $ = cheerioLoad(html);
  const entries: ZukanCharaEntry[] = [];
  const origin = "https://zukan.inazuma.jp";

  const mapSeries = (label: string): string => {
    const l = label.toLowerCase();
    if (l.includes("ares")) return "ARES";
    if (l.includes("orion")) return "ORION";
    if (l.includes("victory")) return "VIC";
    if (l.includes("galaxy")) return "GAL";
    if (l.includes("chrono")) return "CS";
    if (l.includes("go")) return "GO";
    return "IE1";
  };

  $("tbody").each((_, tbody) => {
    const row = $(tbody).find("tr").first();
    const cb = row.find("input.my-team-checkbox").first();
    if (!cb.length) return;
    const cells = row.find("td");
    const paramHref =
      row.find("a[href*='chara_param']").first().attr("href") ?? "";
    const modelHref =
      row.find("a[href*='chara_model_view']").first().attr("href") ?? null;
    const imgSrc =
      row.find("picture img").first().attr("src") ??
      row.find("img[src*='cloudfront']").first().attr("src") ??
      "";
    const seriesLabel =
      $(tbody).find("td[colspan='9']").first().text().trim() ||
      cells.eq(4).text().trim();
    const numId = cells.eq(1).text().replace(/\s+/g, " ").trim();
    entries.push({
      id: numId || cb.attr("data-chara-id") || "",
      series: mapSeries(seriesLabel),
      name: cb.attr("data-chara-name") ?? "Byron Love",
      nickname:
        cb.attr("data-nickname") ||
        cells.eq(3).text().replace(/\s+/g, " ").trim() ||
        "Aphrody",
      detailUrl: paramHref ? new URL(paramHref, origin).toString() : "",
      imageUrl: imgSrc,
      modelViewUrl: modelHref ? new URL(modelHref, origin).toString() : null,
      gender: cells.eq(5).text().replace(/\s+/g, " ").trim(),
      element: cells.eq(6).text().replace(/\s+/g, " ").trim(),
      position: cells.eq(7).text().replace(/\s+/g, " ").trim(),
      role: cells.eq(8).text().replace(/\s+/g, " ").trim(),
      team: cells.eq(11).text().replace(/\s+/g, " ").trim(),
      description: "",
    });
  });

  if (entries.length === 0) {
    $("ul.charaListBox > li").each((_, el) => {
      const li = $(el);
      const paramHref =
        li.find("a[href*='chara_param']").first().attr("href") ?? "";
      const modelHref =
        li.find("a[href*='chara_model_view']").first().attr("href") ?? null;
      const cb = li.find("input.my-team-checkbox").first();
      const imgSrc =
        li.find("img[src*='cloudfront']").first().attr("src") ?? "";
      const text = li.text().replace(/\s+/g, " ").trim();
      const numMatch = text.match(/^(\d+)/);
      const seriesImg = li.find("img[src*='icn_']").first().attr("src") ?? "";
      const seriesMatch = seriesImg.match(/icn_([a-z0-9]+)\./i);
      entries.push({
        id: numMatch?.[1] ?? "",
        series: (seriesMatch?.[1] ?? "ie1").toUpperCase(),
        name: cb.attr("data-chara-name") ?? "Byron Love",
        nickname: "Aphrody",
        detailUrl: paramHref.startsWith("http")
          ? paramHref
          : paramHref
            ? new URL(paramHref, origin).toString()
            : "",
        imageUrl: imgSrc,
        modelViewUrl: modelHref ? new URL(modelHref, origin).toString() : null,
        gender: "",
        element: "",
        position: "",
        role: "",
        team: "",
        description: "",
      });
    });
  }

  const svgAssets = [
    ...new Set(
      [...html.matchAll(/https:\/\/[^\s"'<>]+\.svg/gi)].map((m) => m[0]),
    ),
  ];
  const cssAssets = [
    ...new Set(
      [...html.matchAll(/https:\/\/[^\s"'<>]+\.css/gi)].map((m) => m[0]),
    ),
  ];
  return { entries, svgAssets, cssAssets };
}

/** Parses `chara_param` detail fields matching `apps/rosegriffon/crates/aphrody-nie-zukan` field layout. */
export function parseZukanDetailHtml(html: string): Partial<ZukanCharaEntry> {
  const $ = cheerioLoad(html);
  const nickname =
    $(".nameBox .ruby, .nameBox .subName")
      .first()
      .text()
      .replace(/\s+/g, " ")
      .trim() || "Aphrody";
  const description = $(".commentBox, .charaText, .txtBox")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();
  const field = (label: string) => {
    const dd = $(`dt:contains('${label}')`)
      .first()
      .next("dd")
      .text()
      .replace(/\s+/g, " ")
      .trim();
    return dd;
  };
  return {
    nickname,
    gender: field("Gender"),
    element: field("Element"),
    position: field("Position"),
    role: field("Role"),
    team: field("Appears in") || field("Team"),
    description,
  };
}

/** Quantizes an image via Material Color Utilities (`QuantizerCelebi` + `Score`) + Rose Griffon OKLCH roles. */
export function extractImageColors(
  imagePath: string,
  desired = 5,
): {
  seeds: string[];
  topHct: { hue: number; chroma: number; tone: number };
  populous: string[];
  oklchLight: RoleMap;
  oklchDark: RoleMap;
} {
  const proc = Bun.spawnSync([
    "magick",
    imagePath,
    "-resize",
    "128x128>",
    "-alpha",
    "on",
    "rgba:-",
  ]);
  const buf = proc.stdout;
  const pixels: number[] = [];
  for (let i = 0; i + 3 < buf.length; i += 4) {
    const a = buf[i + 3]!;
    if (a < 128) continue;
    const argb =
      ((255 << 24) | (buf[i]! << 16) | (buf[i + 1]! << 8) | buf[i + 2]!) >>> 0;
    pixels.push(argb);
  }
  const quantized = mcu.QuantizerCelebi.quantize(pixels, 128);
  const ranked = mcu.Score.score(quantized, {
    desired,
    fallbackColorARGB: 0xff135b82,
  });
  const seeds = ranked.map((c: number) => mcu.hexFromArgb(c).toUpperCase());
  const topHct = mcu.Hct.fromInt(ranked[0]!);
  const populous = [...quantized.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([argb]) => mcu.hexFromArgb(argb).toUpperCase());

  // Use primary sapphire or ranked chromatic hue for Rose Griffon OKLCH engine
  const chromatic =
    ranked.find((c) => mcu.Hct.fromInt(c).chroma >= 30) ?? ranked[0]!;
  const hctChrom = mcu.Hct.fromInt(chromatic);
  return {
    seeds,
    topHct: {
      hue: Number(topHct.hue.toFixed(1)),
      chroma: Number(topHct.chroma.toFixed(1)),
      tone: Number(topHct.tone.toFixed(1)),
    },
    populous,
    oklchLight: computeRoles({
      hue: hctChrom.hue,
      chroma: 0.14,
      mode: "light",
    }),
    oklchDark: computeRoles({ hue: hctChrom.hue, chroma: 0.14, mode: "dark" }),
  };
}

/** Studio W3C SVG 2 Aphrody brand mark (`CR-SVG2-20261006`): Byron Zeus Sapphire badge + Aphrody 4-point spark + twin wings. */
export function buildBrandMarkSvg2(colors: {
  sapphire: string;
  deepSapphire: string;
  gold: string;
  rose: string;
  lavender: string;
  cream: string;
}): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" role="img">
  <title>Aphrody</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${colors.sapphire}"/>
      <stop offset="100%" stop-color="${colors.deepSapphire}"/>
    </linearGradient>
    <linearGradient id="spark" x1="0" y1="1" x2="1" y2="0">
      <stop offset="0%" stop-color="${colors.gold}"/>
      <stop offset="55%" stop-color="${colors.rose}"/>
      <stop offset="100%" stop-color="${colors.lavender}"/>
    </linearGradient>
  </defs>
  <rect width="48" height="48" rx="12" fill="url(#bg)"/>
  <path d="M8 29c3.5-8 8-12 11.5-13.5-2.5 5-3.5 9-1.5 13-3.5-1-7-0.5-10 .5zm32 0c-3.5-8-8-12-11.5-13.5 2.5 5 3.5 9 1.5 13 3.5-1 7-.5 10 .5z" fill="${colors.cream}" fill-opacity=".9"/>
  <path d="M24 9c0 8.3-6.7 15-15 15 8.3 0 15 6.7 15 15 0-8.3 6.7-15 15-15-8.3 0-15-6.7-15-15z" fill="url(#spark)"/>
</svg>`;
}

export async function runZukanBrandPipeline(
  root: string,
  opts: { offlineCacheDir?: string } = {},
): Promise<{
  entries: ZukanCharaEntry[];
  svgCount: number;
  iconCount: number;
  errors: string[];
}> {
  const brandDir = join(root, "assets", "brand");
  const srcDir = join(brandDir, "src");
  const zukanDir = join(brandDir, "gen", "zukan");
  const iconsDir = join(brandDir, "gen", "icons", "aphrody");
  const symbolsDir = join(brandDir, "gen", "symbols");
  const themesDir = join(brandDir, "gen", "themes");
  const publicDir = join(root, "apps", "aphrody", "public");

  for (const d of [
    srcDir,
    zukanDir,
    iconsDir,
    symbolsDir,
    themesDir,
    publicDir,
  ]) {
    mkdirSync(d, { recursive: true });
  }

  let html = "";
  const cacheHtml = opts.offlineCacheDir
    ? join(opts.offlineCacheDir, "zukan-page.html")
    : "";
  if (cacheHtml && existsSync(cacheHtml)) {
    html = readFileSync(cacheHtml, "utf8");
  } else {
    const res = await fetch(BYRON_ZUKAN_URL, {
      headers: { "user-agent": "Mozilla/5.0 RoseGriffon-Inagle/1.0" },
    });
    if (!res.ok) throw new Error(`zukan crawl HTTP ${res.status}`);
    html = await res.text();
  }

  const { entries, svgAssets, cssAssets } = parseZukanListHtml(html);
  const errors: string[] = [];
  const rawImgDir = join(zukanDir, "raw");
  mkdirSync(rawImgDir, { recursive: true });

  // Seed cached Byron portraits if offlineCacheDir provided, then fetch missing sprites/details
  if (opts.offlineCacheDir) {
    for (const s of ["ie1", "go", "ares"]) {
      const cachedPng = join(
        opts.offlineCacheDir,
        "zukan-byron",
        `byron_${s}.png`,
      );
      const dstPng = join(rawImgDir, `byron-${s}.png`);
      if (existsSync(cachedPng) && !existsSync(dstPng)) {
        writeFileSync(dstPng, readFileSync(cachedPng));
      }
    }
  }

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]!;
    const slug = `byron-${e.series.toLowerCase()}`;
    const pngPath = join(rawImgDir, `${slug}.png`);
    if (!existsSync(pngPath) && e.imageUrl) {
      const r = await fetch(e.imageUrl).catch(() => null);
      if (r?.ok) writeFileSync(pngPath, new Uint8Array(await r.arrayBuffer()));
    }
    if (!opts.offlineCacheDir && e.detailUrl) {
      const dr = await fetch(e.detailUrl).catch(() => null);
      if (dr?.ok) {
        const dHtml = await dr.text();
        Object.assign(e, parseZukanDetailHtml(dHtml));
      }
    }
  }

  // Vectorize each crawled Byron portrait + local user Byron busts to clean W3C SVG 2 pure `<path>` SVGs
  const vectorTargets: [string, string, string][] = [
    [
      join(rawImgDir, "byron-ie1.png"),
      join(zukanDir, "byron-ie1.svg"),
      "Byron Love (IE1 Zeus)",
    ],
    [
      join(rawImgDir, "byron-go.png"),
      join(zukanDir, "byron-go.svg"),
      "Byron Love (GO Coach)",
    ],
    [
      join(rawImgDir, "byron-ares.png"),
      join(zukanDir, "byron-ares.svg"),
      "Byron Love (Ares)",
    ],
    [
      join(rawImgDir, "zeus-bust.webp"),
      join(zukanDir, "zeus-bust.svg"),
      "Byron Love Zeus Bust",
    ],
    [
      join(rawImgDir, "coach-bust.webp"),
      join(zukanDir, "coach-bust.svg"),
      "Byron Love Coach Bust",
    ],
  ];

  const colorAnalyses: Record<
    string,
    ReturnType<typeof extractImageColors>
  > = {};
  let svgCount = 0;

  for (const [srcPath, outSvg, title] of vectorTargets) {
    if (!existsSync(srcPath)) continue;
    const key = outSvg.split(/[\\/]/).pop()!.replace(".svg", "");
    colorAnalyses[key] = extractImageColors(srcPath);
    const idProc = Bun.spawnSync([
      "magick",
      "identify",
      "-format",
      "%w %h",
      srcPath,
    ]);
    const [ow, oh] = idProc.stdout.toString().trim().split(/\s+/).map(Number);
    const tw = Math.min(ow || 192, 192);
    const th = Math.max(1, Math.round(((oh || tw) * tw) / (ow || tw)));
    const rgba = Bun.spawnSync([
      "magick",
      srcPath,
      "-resize",
      `${tw}x${th}!`,
      "-alpha",
      "on",
      "rgba:-",
    ]).stdout;
    const vec = vectorizeRgbaToSvg2(rgba, tw, th, { title, maxColors: 12 });
    const rep = validateSvg2(vec.svg, outSvg);
    errors.push(...rep.errors);
    writeFileSync(outSvg, vec.svg + "\n");
    svgCount++;
  }

  // Download & upgrade Zukan's official SVGs (`btn_x.svg`, `btn_close.svg`, `btn_page-top.svg`, `img_logo_l5.svg`) to CR-SVG2-20261006
  for (const u of svgAssets) {
    const fname = u.split("/").pop()!;
    const sr = await fetch(u).catch(() => null);
    if (!sr?.ok) continue;
    let svgText = await sr.text();
    if (!/viewBox=/.test(svgText))
      svgText = svgText.replace(/<svg\b/, '<svg viewBox="0 0 64 64"');
    const opt = optimizeSvg2(svgText);
    const rep = validateSvg2(opt, fname);
    if (rep.ok) {
      writeFileSync(join(zukanDir, fname), opt + "\n");
      svgCount++;
    }
  }

  // Canonical crawled palette grounded in Byron Love (#185 IE1 Zeus Sapphire + Blonde + GO Rose + Ares + assets/logo.svg)
  const palette = {
    sapphire: "#135B82",
    deepSapphire: "#0B3B59",
    gold: "#D1D293",
    rose: "#F472B6",
    lavender: "#9B72CB",
    cream: "#FBF0DF",
    aresFlame: "#C63F00",
    goCrimson: "#EA6A6A",
  };

  // Write W3C SVG 2 brand mark, favicon, and wordmark
  const markSvg = optimizeSvg2(buildBrandMarkSvg2(palette));
  const wordmarkSource = join(root, "assets", "logo.svg");
  const wordmarkSvg = existsSync(wordmarkSource)
    ? optimizeSvg2(readFileSync(wordmarkSource, "utf8"))
    : markSvg;
  for (const [f, content] of [
    [join(srcDir, "favicon.svg"), markSvg],
    [join(srcDir, "mark.svg"), markSvg],
    [join(srcDir, "wordmark.svg"), wordmarkSvg],
    [join(iconsDir, "favicon.svg"), markSvg],
    [join(iconsDir, "icon.svg"), markSvg],
    [join(publicDir, "favicon.svg"), markSvg],
    [join(publicDir, "icon.svg"), markSvg],
  ] as const) {
    const rep = validateSvg2(content, f);
    errors.push(...rep.errors);
    writeFileSync(f, content + "\n");
    svgCount++;
  }

  // Render crisp multi-resolution PNGs + ICOs via resvg & magick
  const pngSizes = [16, 24, 32, 48, 64, 128, 180, 192, 256, 512];
  for (const sz of pngSizes) {
    const dst = join(
      iconsDir,
      sz === 180 ? "apple-touch-icon.png" : `icon-${sz}.png`,
    );
    Bun.spawnSync([
      "resvg",
      "-w",
      String(sz),
      "-h",
      String(sz),
      join(srcDir, "favicon.svg"),
      dst,
    ]);
  }
  // Maskable 512px icon (centered spark inside M3 safe circle with sapphire canvas)
  const maskableSvg = optimizeSvg2(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img"><title>Aphrody Maskable</title><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${palette.sapphire}"/><stop offset="100%" stop-color="${palette.deepSapphire}"/></linearGradient><linearGradient id="sp" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stop-color="${palette.gold}"/><stop offset="60%" stop-color="${palette.rose}"/><stop offset="100%" stop-color="${palette.lavender}"/></linearGradient></defs><rect width="512" height="512" fill="url(#bg)"/><path d="M128 296c28-64 64-96 92-108-20 40-28 72-12 104-28-8-56-4-80 4zm256 0c-28-64-64-96-92-108 20 40 28 72 12 104 28-8 56-4 80 4z" fill="${palette.cream}" fill-opacity=".9"/><path d="M256 136c0 66.3-53.7 120-120 120 66.3 0 120 53.7 120 120 0-66.3 53.7-120 120-120-66.3 0-120-53.7-120-120z" fill="url(#sp)"/></svg>`,
  );
  writeFileSync(join(srcDir, "maskable.svg"), maskableSvg + "\n");
  Bun.spawnSync([
    "resvg",
    "-w",
    "512",
    "-h",
    "512",
    join(srcDir, "maskable.svg"),
    join(iconsDir, "maskable-512.png"),
  ]);

  // Pack multi-resolution ICOs via ImageMagick
  Bun.spawnSync([
    "magick",
    join(iconsDir, "icon-16.png"),
    join(iconsDir, "icon-32.png"),
    join(iconsDir, "icon-48.png"),
    join(iconsDir, "favicon.ico"),
  ]);
  Bun.spawnSync([
    "magick",
    join(iconsDir, "icon-16.png"),
    join(iconsDir, "icon-24.png"),
    join(iconsDir, "icon-32.png"),
    join(iconsDir, "icon-48.png"),
    join(iconsDir, "icon-64.png"),
    join(iconsDir, "icon-128.png"),
    join(iconsDir, "icon-256.png"),
    join(iconsDir, "app.ico"),
  ]);

  const webmanifest = {
    background_color: "#0C141B",
    display: "standalone",
    icons: [
      { sizes: "any", src: "icon.svg", type: "image/svg+xml" },
      { sizes: "192x192", src: "icon-192.png", type: "image/png" },
      { sizes: "512x512", src: "icon-512.png", type: "image/png" },
      {
        purpose: "maskable",
        sizes: "512x512",
        src: "maskable-512.png",
        type: "image/png",
      },
    ],
    name: "aphrody.com",
    short_name: "aphrody.com",
    theme_color: palette.sapphire,
  };
  writeFileSync(
    join(iconsDir, "site.webmanifest"),
    JSON.stringify(webmanifest, null, 2) + "\n",
  );

  // Sync icons + webmanifest into apps/aphrody/public/
  for (const fname of [
    "favicon.ico",
    "icon-192.png",
    "icon-512.png",
    "apple-touch-icon.png",
    "maskable-512.png",
    "site.webmanifest",
  ]) {
    writeFileSync(join(publicDir, fname), readFileSync(join(iconsDir, fname)));
  }

  // Build Byron Love / Zukan themes (MCU HCT + Rose Griffon OKLCH)
  const zukanThemes = {
    source: BYRON_ZUKAN_URL,
    palette,
    characters: entries,
    cssAssets,
    analyses: colorAnalyses,
    oklchThemes: {
      "byron-ie1": {
        seed: palette.sapphire,
        accent: palette.gold,
        light: colorAnalyses["byron-ie1"]?.oklchLight,
        dark: colorAnalyses["byron-ie1"]?.oklchDark,
      },
      "byron-go": {
        seed: palette.goCrimson,
        accent: palette.gold,
        light: colorAnalyses["byron-go"]?.oklchLight,
        dark: colorAnalyses["byron-go"]?.oklchDark,
      },
      "byron-ares": {
        seed: palette.aresFlame,
        accent: palette.cream,
        light: colorAnalyses["byron-ares"]?.oklchLight,
        dark: colorAnalyses["byron-ares"]?.oklchDark,
      },
    },
  };
  writeFileSync(
    join(zukanDir, "manifest.json"),
    JSON.stringify(zukanThemes, null, 2) + "\n",
  );
  writeFileSync(
    join(themesDir, "zukan-themes.json"),
    JSON.stringify(zukanThemes.oklchThemes, null, 2) + "\n",
  );
  const zukanCss = Object.entries(zukanThemes.oklchThemes)
    .flatMap(([id, t]) =>
      (["light", "dark"] as const).map(
        (m) =>
          `:root[data-zukan-theme="${id}"][data-mode="${m}"] {\n` +
          Object.entries((t[m] ?? {}) as Record<string, string>)
            .map(([k, v]) => `  --md-sys-color-${k}: ${v};`)
            .join("\n") +
          "\n}\n",
      ),
    )
    .join("\n");
  writeFileSync(join(themesDir, "zukan-themes.css"), zukanCss);

  // Sync Material Symbols Rounded (Apache-2.0 official Google Fonts Icons)
  const symRes = syncMaterialSymbolsDir(symbolsDir);
  errors.push(...symRes.errors);

  // Write canonical assets/brand/brand.toml pointing to crawled Byron Love Zeus Sapphire seed & official symbols
  const symList = existsSync(join(symbolsDir, "symbols.json"))
    ? Object.keys(
        JSON.parse(readFileSync(join(symbolsDir, "symbols.json"), "utf8")),
      ).sort()
    : [];
  const brandToml = `# Aphrody brand: generated from Rose Griffon Zukan crawl (Byron Love / Aphrody),
# Google Material Symbols Rounded, W3C SVG 2 (CR-SVG2-20261006), and Bevy AssetMeta v1.0.

[brand]
name = "Aphrody"
version = 3
seed = "${palette.sapphire}"
variant = "vibrant"
accent = "${palette.gold}"
font = "Google Sans Flex"
font_fallback = ["Roboto Flex", "Inter", "system-ui", "sans-serif"]

[zukan]
source_url = "${BYRON_ZUKAN_URL}"
character = "Byron Love (Aphrody)"
primary_seed = "${palette.sapphire}"
gold_accent = "${palette.gold}"
go_crimson = "${palette.goCrimson}"
ares_flame = "${palette.aresFlame}"

[symbols]
font_file = "gen/symbols/material-symbols-rounded.woff2"
sprite = "gen/symbols/sprite.svg"
names = ${JSON.stringify(symList, null, 2)}
`;
  writeFileSync(join(brandDir, "brand.toml"), brandToml);

  // Generate Bevy .meta RON sidecars across `assets/` (and validate all existing `.meta`)
  const metaSync = syncBevyMeta(join(root, "assets"), { write: true });
  errors.push(...metaSync.errors);

  return { entries, svgCount, iconCount: symRes.count, errors };
}
