// Design inputs of the aphrody.com and aphrody.app pages, all from the monorepo design system (skill ui-system):
// tokens from packages/design/tokens/tokens.css (Material Color Utilities from assets/brand/brand.toml), Material
// Web components from packages/design/src/components.ts (bundled by bun), Google Sans Flex, the brand mark.
// No color, radius, duration or font value is written here: CSS only references `--md-sys-*` / `--md-ref-*`.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

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

/** Google Sans Flex (brand.toml `font`), served by Google Fonts. display=optional: the swap of a late font moved
 * whole sections (CLS 0.30 traced on aphrody.com, 2026-11-13); a font that misses the first frame waits for the
 * next visit instead of shifting the page. */
export const FONT_LINK =
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:wght@100..1000&display=optional">';

/** M3 list and chip in native HTML (ul/li/a, span/a): the md-list-item shadow `role="listitem"` has no `list`
 * parent for axe (aria-required-parent), and labels must not wait for JavaScript. Buttons keep Material Web but
 * reserve their box before the upgrade, so `md.js` arriving late does not shift the page. */
export const NATIVE_CSS = `
.m3-list{list-style:none;margin:0;padding:8px 0;border-radius:var(--md-sys-shape-corner-medium);background:var(--md-sys-color-surface-container-low)}
.m3-list a,.m3-list .row{display:flex;gap:16px;align-items:center;min-height:72px;padding:12px 24px 12px 16px;color:var(--md-sys-color-on-surface);text-decoration:none}
.m3-list a:hover{background:color-mix(in srgb,var(--md-sys-color-on-surface) 8%,transparent)}
.m3-list a:focus-visible{outline:3px solid var(--md-sys-color-secondary);outline-offset:-3px}
.m3-list .txt{flex:1;min-width:0;display:flex;flex-direction:column}
.m3-list .h{${type("body-large")}}
.m3-list .s{${type("body-medium")};color:var(--md-sys-color-on-surface-variant)}
.m3-list .t{${type("label-small")};color:var(--md-sys-color-on-surface-variant)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:8px}
.chip{display:inline-flex;align-items:center;height:32px;padding:0 16px;border:1px solid var(--md-sys-color-outline);border-radius:var(--md-sys-shape-corner-small);color:var(--md-sys-color-on-surface);text-decoration:none;${type("label-large")}}
a.chip:hover{background:color-mix(in srgb,var(--md-sys-color-on-surface) 8%,transparent)}
a:focus-visible{outline:3px solid var(--md-sys-color-secondary);outline-offset:2px}
:is(md-filled-button,md-filled-tonal-button,md-outlined-button,md-text-button):not(:defined){display:inline-flex;align-items:center;height:40px;padding:0 24px;${type("label-large")}}
md-text-button:not(:defined){padding:0 12px}`;

export interface ListRow {
  headline: string; // already escaped HTML
  supporting?: string;
  trailing?: string;
  href?: string;
}

/** Native M3 list (escaped HTML in, markup out). */
export const m3List = (rows: ListRow[]): string =>
  `<ul class="m3-list" role="list">${rows
    .map((r) => {
      const inner = `<span class="txt"><span class="h">${r.headline}</span>${r.supporting ? `<span class="s">${r.supporting}</span>` : ""}</span>${r.trailing ? `<span class="t">${r.trailing}</span>` : ""}`;
      return `<li>${r.href ? `<a href="${r.href}">${inner}</a>` : `<span class="row">${inner}</span>`}</li>`;
    })
    .join("")}</ul>`;

/** Material Web bundle for the browser, minified: the elements of src/client/md.ts, resolved from
 * packages/design/node_modules (the one Material Web install of the monorepo). */
export async function componentsBundle(root: string): Promise<string> {
  const from = resolve(root, "packages", "design", "src");
  const r = await Bun.build({
    entrypoints: [join(import.meta.dir, "client", "md.ts")],
    target: "browser",
    format: "esm",
    minify: true,
    plugins: [
      <import("bun").BunPlugin>{
        name: "aphrody-design",
        setup(b) {
          b.onResolve({ filter: /^@material\/web\// }, (a) => ({
            path: Bun.resolveSync(a.path, from),
          }));
        },
      },
    ],
  });
  if (!r.success)
    throw new Error(`Material Web bundle: ${r.logs.map(String).join("\n")}`);
  return r.outputs[0]!.text();
}
