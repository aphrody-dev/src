// Design inputs of the aphrody.com and aphrody.app pages, all from the monorepo design system (skill ui-system):
// tokens from packages/design/tokens/tokens.css (Material Color Utilities from assets/brand/brand.toml), Material
// Web components from packages/design/src/components.ts (bundled by bun), Google Sans Flex, the brand mark.
// No color, radius, duration or font value is written here: CSS only references `--md-sys-*` / `--md-ref-*`.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export interface Brand {
  name: string;
  mark: string;
}

/** Brand name and mark from assets/brand (brand.toml, src/mark.svg). */
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
    : "";
  if (mark && !/aria-hidden/.test(mark))
    mark = mark.replace("<svg", '<svg aria-hidden="true"');
  return { name: b.name ?? "Aphrody", mark };
}

/** packages/design/tokens/tokens.css, minified (comments and whitespace only). */
export function tokensCss(root: string): string {
  const f = join(root, "packages", "design", "tokens", "tokens.css");
  if (!existsSync(f))
    throw new Error(`${f} missing: bun run --cwd packages/design build`);
  return readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,])\s*/g, "$1")
    .trim();
}

/** CSS `font` + `letter-spacing` of an M3 type role, from the typescale tokens. */
export const type = (role: string) =>
  `font:var(--md-sys-typescale-${role}-weight) var(--md-sys-typescale-${role}-size)/var(--md-sys-typescale-${role}-line-height) var(--md-sys-typescale-${role}-font);letter-spacing:var(--md-sys-typescale-${role}-tracking)`;

/** Google Sans Flex (brand.toml `font`), served by Google Fonts. */
export const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@100..1000&display=swap">';

/** Material Web bundle (packages/design/src/components.ts) for the browser, minified. */
export async function componentsBundle(root: string): Promise<string> {
  const r = await Bun.build({
    entrypoints: [join(root, "packages", "design", "src", "components.ts")],
    target: "browser",
    format: "esm",
    minify: true,
  });
  if (!r.success)
    throw new Error(`Material Web bundle: ${r.logs.map(String).join("\n")}`);
  return r.outputs[0]!.text();
}
