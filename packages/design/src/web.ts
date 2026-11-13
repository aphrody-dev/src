// @aphrody/design/web : inputs of web pages from the design system. tokens.css (Material Color Utilities from
// assets/brand/brand.toml), a Material Web subset bundled by bun, and the M3 typescale as CSS.
// Same API shape as tokensCss/componentsBundle of packages/deploy/src/m3.ts, without the repository root argument.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const PKG = join(import.meta.dir, "..");
const TOKENS = join(PKG, "tokens", "tokens.css");

/** Minify CSS conservatively: comments and whitespace only. */
export function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{};,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

/** packages/design/tokens/tokens.css, minified. */
export function tokensCss(): string {
  return minifyCss(readFileSync(TOKENS, "utf8"));
}

/** M3 type roles (display/headline/title/body/label x large/medium/small). */
export const TYPE_ROLES = [
  "display",
  "headline",
  "title",
  "body",
  "label",
].flatMap((r) => ["large", "medium", "small"].map((s) => `${r}-${s}`));

/** CSS `font` + `letter-spacing` declarations of an M3 type role, from the typescale tokens. */
export const typescale = (role: string): string =>
  `font:var(--md-sys-typescale-${role}-weight) var(--md-sys-typescale-${role}-size)/var(--md-sys-typescale-${role}-line-height) var(--md-sys-typescale-${role}-font);letter-spacing:var(--md-sys-typescale-${role}-tracking)`;

/** One `.md-typescale-<role>` utility class per role. */
export const typescaleCss = (): string =>
  TYPE_ROLES.map((r) => `.md-typescale-${r}{${typescale(r)}}`).join("");

const ELEMENT = /^md-[a-z0-9-]+$/;

/** Module path of a Material Web element (md-filled-button -> @material/web/button/filled-button.js). */
export function elementModule(tag: string): string {
  if (!ELEMENT.test(tag)) throw new Error(`not a Material Web element: ${tag}`);
  const name = tag.slice(3);
  const dirs: Record<string, string> = {
    button: "button",
    "icon-button": "iconbutton",
    fab: "fab",
    chip: "chips",
    "list-item": "list",
    list: "list",
    checkbox: "checkbox",
    switch: "switch",
    radio: "radio",
    divider: "divider",
    "linear-progress": "progress",
    "circular-progress": "progress",
    "text-field": "textfield",
    tabs: "tabs",
    tab: "tabs",
    menu: "menu",
    "menu-item": "menu",
    dialog: "dialog",
    ripple: "ripple",
    "focus-ring": "focus",
    elevation: "elevation",
    icon: "icon",
    slider: "slider",
    select: "select",
    "select-option": "select",
  };
  const key = Object.keys(dirs)
    .sort((a, b) => b.length - a.length)
    .find((k) => name === k || name.endsWith(`-${k}`));
  if (!key) throw new Error(`unknown Material Web element: ${tag}`);
  return `@material/web/${dirs[key]}/${name}.js`;
}

/** Minified browser bundle registering only the given Material Web elements, resolved from this package. */
export async function componentsBundle(elements: string[]): Promise<string> {
  const mods = [...new Set(elements)].sort().map(elementModule);
  for (const m of mods) Bun.resolveSync(m, PKG);
  const entry = mods.map((m) => `import ${JSON.stringify(m)};`).join("\n");
  const r = await Bun.build({
    entrypoints: ["aphrody-md-entry.ts"],
    target: "browser",
    format: "esm",
    minify: true,
    files: { "aphrody-md-entry.ts": entry },
    plugins: [
      {
        name: "aphrody-design-web",
        setup(b) {
          b.onResolve({ filter: /^@material\/web\// }, (a) => ({
            path: Bun.resolveSync(a.path, PKG),
          }));
        },
      },
    ],
  } as Parameters<typeof Bun.build>[0]);
  if (!r.success)
    throw new Error(`Material Web bundle: ${r.logs.map(String).join("\n")}`);
  return r.outputs[0]!.text();
}
