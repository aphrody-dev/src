// Material 3 color roles from the brand seed (assets/brand/brand.toml), as `--md-sys-color-*` custom properties
// for light and dark (prefers-color-scheme). Color science: the MCU port of packages/google-design (HCT, dynamic
// schemes). packages/design (tokens/tokens.css, generated from the same brand.toml with MCU) wins when present.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  generateDynamicTheme,
  type SchemeVariant,
} from "../../google-design/src/color-utils/hct.ts";

const kebab = (k: string) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

export interface Brand {
  name: string;
  seed: string;
  variant: SchemeVariant;
  accent: string;
  mark: string;
}

const DEFAULT_MARK =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="16" fill="var(--md-sys-color-primary)"/><path d="M32 14 49 48h-8.4l-3.5-7.6H26.9L23.4 48H15Zm-2.4 20h4.8L32 28.2Z" fill="var(--md-sys-color-on-primary)"/></svg>';

/** Brand values from assets/brand (brand.toml, src/mark.svg); defaults to the same seed when absent. */
export function readBrand(root: string): Brand {
  const toml = join(root, "assets", "brand", "brand.toml");
  const svg = join(root, "assets", "brand", "src", "mark.svg");
  const b = existsSync(toml)
    ? ((Bun.TOML.parse(readFileSync(toml, "utf8")) as any).brand ?? {})
    : {};
  let mark = existsSync(svg)
    ? readFileSync(svg, "utf8")
        .replace(/<\?xml[^>]*>\s*/, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .trim()
    : DEFAULT_MARK;
  if (!/aria-hidden/.test(mark))
    mark = mark.replace("<svg", '<svg aria-hidden="true"');
  return {
    name: b.name ?? "Aphrody",
    seed: b.seed ?? "#3355FF",
    variant: (b.variant ?? "vibrant") as SchemeVariant,
    accent: b.accent ?? "#FFB300",
    mark,
  };
}

export function m3Css(
  seed: string,
  variant: SchemeVariant = "vibrant",
): string {
  const t = generateDynamicTheme(seed, variant);
  const vars = (s: Record<string, string>) =>
    Object.entries(s)
      .map(([k, v]) => `--md-sys-color-${kebab(k)}:${v}`)
      .join(";");
  return `:root{${vars(t.light as unknown as Record<string, string>)}}@media (prefers-color-scheme:dark){:root{${vars(t.dark as unknown as Record<string, string>)}}}`;
}

/** Material 3 tokens CSS: packages/design/tokens/tokens.css when present (single design system), else generated. */
export function tokensCss(root: string): string {
  const f = join(root, "packages", "design", "tokens", "tokens.css");
  if (existsSync(f))
    return readFileSync(f, "utf8")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/\s+/g, " ")
      .replace(/\s*([{}:;,])\s*/g, "$1")
      .trim();
  const b = readBrand(root);
  return m3Css(b.seed, b.variant);
}
