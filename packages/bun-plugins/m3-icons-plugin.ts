// SPDX-License-Identifier: Apache-2.0
/**
 * Sovereign M3 Icons, Symbol Virtual Loader, ICO Binary Module & M3 HCT Tokens Bun Plugins
 * 100% Pure Bun v1.4.4 - Zero External Dependencies
 */
import type { BunPlugin } from "bun";
import {
  bestEntry,
  entryToPng,
  exportWebCss,
  generateDynamicTheme,
  m3Icon,
  type M3IconStyle,
  parseIco,
  pngDataUrl,
} from "../google-design/index.ts";

const M3_ICON_PREFIX = "m3:icon/";
const STYLES: readonly M3IconStyle[] = ["outlined", "rounded", "sharp"];

function parseOptNum(val: string | null): number | undefined {
  if (val === null || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Resolves `m3:icon/<style>/<name>?fill=<0|1>&wght=<100..700>&opsz=<20..48>&size=<px>`
 * to a zero-runtime tree-shakable ESM default SVG export.
 */
export const m3IconPlugin: BunPlugin = {
  name: "aphrody-m3-icon-loader",
  setup(build) {
    build.onResolve({ filter: /^m3:icon\// }, (args) => ({
      path: args.path,
      namespace: "m3-icon",
    }));

    build.onLoad({ filter: /.*/, namespace: "m3-icon" }, (args) => {
      const rest = args.path.slice(M3_ICON_PREFIX.length);
      const [stylePart = "", query = ""] = rest.split("?", 2);
      const slash = stylePart.indexOf("/");
      if (slash === -1) {
        throw new Error(
          `m3:icon module path must be "m3:icon/<style>/<name>", got "${stylePart}"`,
        );
      }
      const style = stylePart.slice(0, slash) as M3IconStyle;
      const name = stylePart.slice(slash + 1);
      if (!STYLES.includes(style)) {
        throw new Error(
          `m3:icon style must be one of ${STYLES.join(", ")}, got "${style}"`,
        );
      }
      const params = new URLSearchParams(query);
      const svg = m3Icon({
        name,
        style,
        fill: parseOptNum(params.get("fill")),
        weight: parseOptNum(params.get("wght")),
        grade: parseOptNum(params.get("grad")),
        opticalSize: parseOptNum(params.get("opsz")),
        size: parseOptNum(params.get("size")),
      });
      return {
        contents: `export default ${JSON.stringify(svg)};\n`,
        loader: "js",
      };
    });
  },
};

/**
 * Resolves `symbol:<name>?style=rounded&fill=1&size=24` and `*.ico` / `*.cur` binary icons
 * directly from local sovereign catalog (zero runtime network fetch required).
 */
export function iconsPlugin(): BunPlugin {
  return {
    name: "aphrody-bun-icons",
    setup(builder) {
      builder.onResolve({ filter: /^symbol:/ }, (args) => ({
        path: args.path,
        namespace: "aphrody-symbol",
      }));
      builder.onResolve({ filter: /.*/, namespace: "symbol" }, (args) => ({
        path: `symbol:${args.path}`,
        namespace: "aphrody-symbol",
      }));
      builder.onLoad({ filter: /.*/, namespace: "aphrody-symbol" }, (args) => {
        const body = args.path.startsWith("symbol:")
          ? args.path.slice(7)
          : args.path;
        const q = body.indexOf("?");
        const name = q < 0 ? body : body.slice(0, q);
        const params = new URLSearchParams(q < 0 ? "" : body.slice(q + 1));
        const styleParam = params.get("style");
        const style: M3IconStyle =
          styleParam === "rounded" || styleParam === "sharp"
            ? styleParam
            : "outlined";
        const svg = m3Icon({
          name,
          style,
          fill: parseOptNum(params.get("fill")),
          weight: parseOptNum(params.get("wght")),
          grade: parseOptNum(params.get("grad")),
          opticalSize: parseOptNum(params.get("opsz")),
          size: parseOptNum(params.get("size")),
        });
        return {
          contents: `export const name = ${JSON.stringify(name)};\nexport default ${JSON.stringify(svg)};\n`,
          loader: "js",
        };
      });
      builder.onLoad({ filter: /\.(ico|cur)$/i }, async (args) => {
        const bytes = await Bun.file(args.path).bytes();
        const entries = parseIco(bytes);
        const meta = entries.map(({ width, height, bits, png }) => ({
          width,
          height,
          bits,
          png,
        }));
        const urls = entries.map((e) => pngDataUrl(entryToPng(e)));
        const defIdx = bestEntry(entries);
        return {
          contents: [
            `export const entries = ${JSON.stringify(meta)};`,
            `const urls = ${JSON.stringify(urls)};`,
            `export default urls[${defIdx}];`,
          ].join("\n"),
          loader: "js",
        };
      });
    },
  };
}

/**
 * Resolves `m3:tokens.css?seed=%238c6c88&dark=0` at build/runtime using HCT color math.
 */
export function m3TokensPlugin(defaultSeed = "#4285F4"): BunPlugin {
  return {
    name: "aphrody-m3-tokens",
    setup(builder) {
      builder.onResolve({ filter: /^m3:tokens\.css/ }, (args) => ({
        path: args.path,
        namespace: "m3-tokens",
      }));
      builder.onLoad({ filter: /.*/, namespace: "m3-tokens" }, (args) => {
        const q = args.path.indexOf("?");
        const params = new URLSearchParams(q < 0 ? "" : args.path.slice(q + 1));
        const seed = params.get("seed") || defaultSeed;
        const theme = generateDynamicTheme(seed);
        const css = exportWebCss(theme);
        return {
          contents: `export default ${JSON.stringify(css)};\n`,
          loader: "js",
        };
      });
    },
  };
}
