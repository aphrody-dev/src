import { readFileSync } from "node:fs";
import { join } from "node:path";

export const BRAND_GEN = join(
  import.meta.dir,
  "..",
  "..",
  "..",
  "assets",
  "brand",
  "gen",
);

export interface BrandFont {
  id: string;
  family: string;
  file: string;
  license: string;
  axes?: { tag: string; min: number; max: number; default: number }[];
}

export function brandFonts(gen = BRAND_GEN): BrandFont[] {
  return (
    JSON.parse(readFileSync(join(gen, "fonts", "fonts.json"), "utf8")) as {
      fonts: BrandFont[];
    }
  ).fonts;
}

/** @font-face rule of a self-hosted font served at `href`. */
export function fontFace(f: BrandFont, href: string): string {
  const w = f.axes?.find((a) => a.tag === "wght");
  return `@font-face{font-family:"${f.family}";src:url(${href}) format("woff2");font-weight:${w ? `${w.min} ${w.max}` : 400};font-style:normal;font-display:optional}`;
}
