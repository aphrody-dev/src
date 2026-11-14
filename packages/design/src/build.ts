// Generates every token output of @aphrody/design from assets/brand/brand.toml.
// Color: official @material/material-color-utilities (DynamicScheme, MaterialDynamicColors).
// Type scale, shape, motion, elevation, state: parsed from @material/web tokens/versions/v0_192.
// `bun run src/build.ts` writes tokens/ and DESIGN.md ; `--check` fails if anything would change.
import {
  argbFromHex,
  hexFromArgb,
  Hct,
  MaterialDynamicColors,
  TonalPalette,
} from "@material/material-color-utilities";
import { join } from "node:path";
import { moduleDir } from "./modules.ts";
import { SCHEMES, type Variant } from "./schemes.ts";

const pkg = join(import.meta.dir, "..");
const root = join(pkg, "..", "..");
const out = join(pkg, "tokens");
const check = process.argv.includes("--check");

type Brand = {
  name: string;
  seed: string;
  variant: string;
  accent: string;
  font: string;
  font_fallback: string[];
};
// Source : assets/brand/brand.toml (agent marque) ; à défaut (checkout CI sans assets/brand), la copie
// gardée dans tokens/tokens.json (source.brand), pour que --check et les tests restent reproductibles.
const brandFile = Bun.file(join(root, "assets/brand/brand.toml"));
const brand: Brand = (await brandFile.exists())
  ? (Bun.TOML.parse(await brandFile.text()) as { brand: Brand }).brand
  : (await Bun.file(join(out, "tokens.json")).json()).source.brand;
if (!brand?.seed)
  throw new Error(
    "graine de marque introuvable (assets/brand/brand.toml ou tokens/tokens.json source.brand)",
  );
const mcuVersion = (
  await Bun.file(
    join(moduleDir("@material/material-color-utilities"), "package.json"),
  ).json()
).version;
const mwcVersion = (
  await Bun.file(join(moduleDir("@material/web"), "package.json")).json()
).version;

const Scheme = SCHEMES[brand.variant as Variant];
if (!Scheme)
  throw new Error(`variant inconnue dans brand.toml : ${brand.variant}`);

// Modes: M3 defines standard (0), medium (0.5) and high (1) contrast, light and dark.
const MODES = [
  ["light", false, 0],
  ["dark", true, 0],
  ["light-medium-contrast", false, 0.5],
  ["dark-medium-contrast", true, 0.5],
  ["light-high-contrast", false, 1],
  ["dark-high-contrast", true, 1],
] as const;

const kebab = (s: string) =>
  s
    .replace(/_/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
const seed = Hct.fromInt(argbFromHex(brand.seed));
const roles = new MaterialDynamicColors().allColors.filter(
  (c) => !c.name.endsWith("_palette_key_color"),
);

const color: Record<string, Record<string, string>> = {};
for (const [mode, dark, contrast] of MODES) {
  const s = new Scheme(seed, dark, contrast);
  const m: Record<string, string> = {};
  for (const c of roles)
    m[kebab(c.name)] = hexFromArgb(c.getArgb(s)).toUpperCase();
  color[mode] = m;
}
const light = new Scheme(seed, false, 0);
const TONES = [
  0, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95,
  96, 98, 99, 100,
];
const palettes: Record<string, Record<string, string>> = {};
for (const [name, p] of Object.entries({
  primary: light.primaryPalette,
  secondary: light.secondaryPalette,
  tertiary: light.tertiaryPalette,
  neutral: light.neutralPalette,
  "neutral-variant": light.neutralVariantPalette,
  error: light.errorPalette,
})) {
  palettes[name] = Object.fromEntries(
    TONES.map((t) => [String(t), hexFromArgb(p.tone(t)).toUpperCase()]),
  );
}

// --- Material Web sys tokens (SCSS maps, hardcoded values) ---
const v = join(moduleDir("@material/web"), "tokens/versions/v0_192");
async function scss(name: string): Promise<Record<string, string>> {
  const src = (await Bun.file(join(v, `_md-${name}.scss`)).text()).replace(
    /\s+/g,
    " ",
  );
  const r: Record<string, string> = {};
  for (const m of src.matchAll(
    /'([a-z0-9-]+)': if\(\$exclude-hardcoded-values, null, (.+?)\)(?:,(?= ')| \);)/g,
  ))
    r[m[1]] = m[2].trim();
  for (const m of src.matchAll(
    /'([a-z0-9-]+)': map\.get\(\$deps, 'md-ref-typeface', '([a-z-]+)'\)/g,
  ))
    r[m[1]] = `ref:${m[2]}`;
  return r;
}
const [typeRaw, refType, shapeRaw, motionRaw, elevRaw, stateRaw] =
  await Promise.all(
    [
      "sys-typescale",
      "ref-typeface",
      "sys-shape",
      "sys-motion",
      "sys-elevation",
      "sys-state",
    ].map(scss),
  );
const fontStack = [brand.font, ...brand.font_fallback]
  .map((f) => (f.includes(" ") ? `"${f}"` : f))
  .join(", ");
const ref: Record<string, string> = {
  ...refType,
  brand: fontStack,
  plain: fontStack,
};
const strip = (x: string) => x.replace(/^\((.*)\)$/, "$1");
const resolve = (x: string) =>
  x.startsWith("ref:") ? ref[x.slice(4)] : strip(x);

const typescale: Record<string, Record<string, string>> = {};
for (const [k, val] of Object.entries(typeRaw)) {
  const m = k.match(
    /^(display|headline|title|body|label)-(large|medium|small)(?:-prominent)?-(font|line-height|size|tracking|weight)$/,
  );
  if (!m || k.includes("prominent")) continue;
  (typescale[`${m[1]}-${m[2]}`] ??= {})[m[3]] = resolve(val);
}
const shape = Object.fromEntries(
  Object.entries(shapeRaw)
    .filter(([k]) =>
      /^corner-(none|extra-small|small|medium|large|extra-large|full)$/.test(k),
    )
    .map(([k, x]) => [k, strip(x)]),
);
const motion = Object.fromEntries(
  Object.entries(motionRaw)
    .filter(([k]) => /^(duration|easing)-/.test(k))
    .map(([k, x]) => [k, strip(x)]),
);
const elevation = Object.fromEntries(
  Object.entries(elevRaw)
    .filter(([k]) => /^level\d$/.test(k))
    .map(([k, x]) => [k, `${strip(x)}dp`]),
);
const state = Object.fromEntries(
  Object.entries(stateRaw)
    .filter(([k]) => /state-layer-opacity$/.test(k))
    .map(([k, x]) => [k, strip(x)]),
);

// Garde-fous : une mise à jour de @material/web qui change le format SCSS doit casser le build, pas le vider.
const expect = (what: string, got: number, want: number) => {
  if (got !== want)
    throw new Error(
      `${what} : ${got} au lieu de ${want} (format @material/web changé ?)`,
    );
};
expect("rôles typescale", Object.keys(typescale).length, 15);
for (const [n, p] of Object.entries(typescale))
  expect(`propriétés de ${n}`, Object.keys(p).length, 5);
expect("coins", Object.keys(shape).length, 7);
expect(
  "durées",
  Object.keys(motion).filter((k) => k.startsWith("duration")).length,
  16,
);
expect("élévations", Object.keys(elevation).length, 6);
expect("opacités d'état", Object.keys(state).length, 4);

const tokens = {
  $schema: "aphrody-design/1",
  source: {
    brand: {
      name: brand.name,
      seed: brand.seed,
      variant: brand.variant,
      accent: brand.accent,
      font: brand.font,
      font_fallback: brand.font_fallback,
    },
    seed: brand.seed.toUpperCase(),
    variant: brand.variant,
    "material-color-utilities": mcuVersion,
    "material-web": mwcVersion,
    "material-web-tokens": "v0_192",
  },
  color,
  custom: { bolt: brand.accent.toUpperCase() },
  palettes,
  typeface: {
    brand: fontStack,
    plain: fontStack,
    code: `"Google Sans Code", "Roboto Mono", ui-monospace, monospace`,
  },
  typescale,
  shape,
  motion,
  elevation,
  state,
};

// --- emitters ---
const files: Record<string, string> = {};
const header = (c: string) =>
  `${c} Généré par packages/design/src/build.ts depuis assets/brand/brand.toml (seed ${tokens.source.seed}, ${brand.variant}, MCU ${mcuVersion}). Ne pas éditer.\n`;
files["tokens.json"] = JSON.stringify(tokens, null, 2) + "\n";

const cssVars = (m: Record<string, string>) =>
  Object.entries(m)
    .map(([k, x]) => `  --md-sys-color-${k}: ${x};`)
    .join("\n");
const typeVars = Object.entries(typescale).flatMap(([n, p]) =>
  Object.entries(p).map(([k, x]) => `  --md-sys-typescale-${n}-${k}: ${x};`),
);
files["tokens.css"] = `${header("/*")}*/
:root {
  color-scheme: light dark;
  --md-ref-typeface-brand: ${fontStack};
  --md-ref-typeface-plain: ${fontStack};
  --md-ref-typeface-code: ${tokens.typeface.code};
  --aphrody-bolt: ${tokens.custom.bolt};
${typeVars.join("\n")}
${Object.entries(shape)
  .map(([k, x]) => `  --md-sys-shape-${k}: ${x};`)
  .join("\n")}
${Object.entries(motion)
  .map(([k, x]) => `  --md-sys-motion-${k}: ${x};`)
  .join("\n")}
${Object.entries(state)
  .map(([k, x]) => `  --md-sys-state-${k}: ${x};`)
  .join("\n")}
}
:root, [data-theme="light"] {
${cssVars(color.light)}
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${cssVars(color.dark).replace(/^/gm, "  ")}
  }
}
[data-theme="dark"] {
${cssVars(color.dark)}
}
@media (prefers-contrast: more) {
  :root:not([data-theme]) {
${cssVars(color["light-high-contrast"]).replace(/^/gm, "  ")}
  }
}
@media (prefers-contrast: more) and (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
${cssVars(color["dark-high-contrast"]).replace(/^/gm, "  ")}
  }
}
${MODES.slice(2)
  .map(([m]) => `[data-theme="${m}"] {\n${cssVars(color[m])}\n}`)
  .join("\n")}
@media (prefers-reduced-motion: reduce) {
  :root {
${Object.keys(motion)
  .filter((k) => k.startsWith("duration"))
  .map((k) => `    --md-sys-motion-${k}: 0ms;`)
  .join("\n")}
  }
}
`;

const UP = (s: string) => s.replace(/-/g, "_").toUpperCase();
const rgba = (hex: string) => `0x${hex.slice(1)}FF`;
files["tokens.rs"] =
  `${header("//")}// Couleurs en RGBA u32 (0xRRGGBBFF), directement utilisables avec gpui::rgba(u32) ou ratatui Color::from_u32(c >> 8).
// Usage : include!(concat!(env!("CARGO_MANIFEST_DIR"), "/<chemin relatif>/packages/design/tokens/tokens.rs"));
#[allow(dead_code)]
pub mod md {
${MODES.map(
  ([m]) =>
    `    pub mod ${m.replace(/-/g, "_")} {\n${Object.entries(color[m])
      .map(([k, x]) => `        pub const ${UP(k)}: u32 = ${rgba(x)};`)
      .join(
        "\n",
      )}\n        /// Tous les rôles (nom kebab, RGBA), pour les recherches par nom.\n        pub const ALL: &[(&str, u32)] = &[${Object.keys(
      color[m],
    )
      .map((k) => `("${k}", ${UP(k)})`)
      .join(", ")}];\n    }`,
).join("\n")}
    pub const BOLT: u32 = ${rgba(tokens.custom.bolt)};
    pub const FONT_BRAND: &str = ${JSON.stringify(brand.font)};
    /// Ton 10 de la palette neutre (encre de l'organisation Dev).
    pub const INK: u32 = ${rgba(palettes.neutral["10"])};
    /// Palettes HCT de Material Color Utilities par teinte entière (0..360) : tuiles produit (chroma 56,
    /// tons 40 et 80) et séries de graphiques (chroma 60, tons 45 et 70) ; PRIMARY = teinte du primaire clair.
    pub mod hue {
        pub const PRIMARY: f64 = ${Hct.fromInt(argbFromHex(color.light.primary)).hue.toFixed(6)};
${[
  ["TILE_40", 56, 40],
  ["TILE_80", 56, 80],
  ["SERIES_45", 60, 45],
  ["SERIES_70", 60, 70],
]
  .map(
    ([n, c, t]) =>
      `        pub const ${n}: [u32; 360] = [${Array.from({ length: 360 }, (_, h) => rgba(hexFromArgb(TonalPalette.fromHueAndChroma(h, c as number).tone(t as number)).toUpperCase())).join(", ")}];`,
  )
  .join("\n")}
        /// Valeur de table pour une teinte quelconque (arrondie au degré).
        pub fn at(table: &[u32; 360], hue: f64) -> u32 {
            table[(hue.rem_euclid(360.0).round() as usize) % 360]
        }
    }
${Object.entries(shape)
  .filter(([, x]) => x.endsWith("px"))
  .map(
    ([k, x]) =>
      `    pub const SHAPE_${UP(k)}: f32 = ${parseFloat(x).toFixed(1)};`,
  )
  .join("\n")}
${Object.entries(motion)
  .filter(([k]) => k.startsWith("duration"))
  .map(([k, x]) => `    pub const MOTION_${UP(k)}_MS: u32 = ${parseInt(x)};`)
  .join("\n")}
}
`;
const ZIG_KEYWORDS = new Set([
  "error",
  "type",
  "test",
  "const",
  "var",
  "fn",
  "struct",
  "enum",
  "union",
  "opaque",
  "return",
  "if",
  "else",
  "while",
  "for",
  "switch",
  "try",
  "catch",
  "and",
  "or",
  "align",
  "inline",
  "export",
  "extern",
  "packed",
  "pub",
  "comptime",
  "defer",
  "errdefer",
  "break",
  "continue",
  "unreachable",
  "volatile",
  "anytype",
  "orelse",
]);
const zigId = (s: string) => (ZIG_KEYWORDS.has(s) ? `@"${s}"` : s);
files["tokens.zig"] = `${header("//")}// Couleurs en RGBA u32 (0xRRGGBBFF).
${MODES.map(
  ([m]) =>
    `pub const ${m.replace(/-/g, "_")} = struct {\n${Object.entries(color[m])
      .map(
        ([k, x]) =>
          `    pub const ${zigId(k.replace(/-/g, "_"))}: u32 = ${rgba(x)};`,
      )
      .join("\n")}\n};`,
).join("\n")}
pub const bolt: u32 = ${rgba(tokens.custom.bolt)};
pub const font_brand = ${JSON.stringify(brand.font)};
`;

const symbolsJsonFile = Bun.file(
  join(root, "assets/brand/gen/symbols/symbols.json"),
);
if (await symbolsJsonFile.exists()) {
  const { renderRustIconsModule } =
    await import("../../assets/src/material-symbols.ts");
  files["symbols.rs"] = renderRustIconsModule(await symbolsJsonFile.json());
}

// ANSI: 24-bit SGR per role, plus a 16-color terminal scheme projected from M3 roles.
const rgbOf = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const ansiScheme = (
  m: Record<string, string>,
  dark: boolean,
  p: Record<string, Record<string, string>>,
) => {
  const t = (pal: string, lt: number, dt: number) =>
    dark ? p[pal][String(dt)] : p[pal][String(lt)];
  return {
    background: m["surface"],
    foreground: m["on-surface"],
    cursorColor: m["primary"],
    selectionBackground: m["primary-container"],
    black: m["surface-container-highest"],
    red: m["error"],
    green: t("tertiary", 40, 80),
    yellow: tokens.custom.bolt,
    blue: m["primary"],
    purple: m["secondary"],
    cyan: t("tertiary", 50, 70),
    white: m["on-surface-variant"],
    brightBlack: m["outline"],
    brightRed: t("error", 50, 70),
    brightGreen: t("tertiary", 60, 90),
    brightYellow: tokens.custom.bolt,
    brightBlue: t("primary", 60, 90),
    brightPurple: t("secondary", 60, 90),
    brightCyan: t("tertiary", 70, 95),
    brightWhite: m["on-surface"],
  };
};
const darkScheme = new Scheme(seed, true, 0);
const darkPal: typeof palettes = {};
for (const [name, p] of Object.entries({
  primary: darkScheme.primaryPalette,
  secondary: darkScheme.secondaryPalette,
  tertiary: darkScheme.tertiaryPalette,
  error: darkScheme.errorPalette,
})) {
  darkPal[name] = Object.fromEntries(
    TONES.map((t) => [String(t), hexFromArgb(p.tone(t)).toUpperCase()]),
  );
}
const ansi = {
  sgr: Object.fromEntries(
    ["light", "dark"].map((mode) => [
      mode,
      Object.fromEntries(
        Object.entries(color[mode]).map(([k, x]) => {
          const [r, g, b] = rgbOf(x);
          return [
            k,
            {
              fg: `\u001b[38;2;${r};${g};${b}m`,
              bg: `\u001b[48;2;${r};${g};${b}m`,
            },
          ];
        }),
      ),
    ]),
  ),
  "windows-terminal": [
    {
      name: `${brand.name} M3 Light`,
      ...ansiScheme(color.light, false, palettes),
    },
    { name: `${brand.name} M3 Dark`, ...ansiScheme(color.dark, true, darkPal) },
  ],
};
files["ansi.json"] = JSON.stringify(ansi, null, 2) + "\n";
files["ansi.sh"] =
  `${header("#")}# Source : . packages/design/tokens/ansi.sh ; printf '%s' "$MD_PRIMARY_FG" texte "$MD_RESET"
${Object.entries(color.dark)
  .map(([k, x]) => {
    const [r, g, b] = rgbOf(x);
    return `MD_${UP(k)}_FG=$'\\e[38;2;${r};${g};${b}m'; MD_${UP(k)}_BG=$'\\e[48;2;${r};${g};${b}m'`;
  })
  .join("\n")}
MD_RESET=$'\\e[0m'
`;

// Figma variables: one collection per family, M3 Design Kit naming (Schemes/<Role>), modes = MODES.
const toFigma = (hex: string) => {
  const [r, g, b] = rgbOf(hex);
  return {
    r: +(r / 255).toFixed(6),
    g: +(g / 255).toFixed(6),
    b: +(b / 255).toFixed(6),
    a: 1,
  };
};
const title = (k: string) =>
  k
    .split("-")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
files["figma-variables.json"] =
  JSON.stringify(
    {
      collections: [
        {
          name: "M3 Schemes",
          modes: MODES.map(([m]) => title(m)),
          variables: Object.keys(color.light).map((k) => ({
            name: `Schemes/${title(k)}`,
            type: "COLOR",
            codeSyntax: { WEB: `var(--md-sys-color-${k})` },
            values: Object.fromEntries(
              MODES.map(([m]) => [title(m), toFigma(color[m][k])]),
            ),
          })),
        },
        {
          name: "M3 Palettes",
          modes: ["Value"],
          variables: Object.entries(palettes).flatMap(([p, ts]) =>
            Object.entries(ts).map(([t, x]) => ({
              name: `Palettes/${title(p)}/${t}`,
              type: "COLOR",
              values: { Value: toFigma(x) },
            })),
          ),
        },
        {
          name: "M3 Shape",
          modes: ["Value"],
          variables: Object.entries(shape)
            .filter(([, x]) => x.endsWith("px"))
            .map(([k, x]) => ({
              name: `Corner/${title(k.replace("corner-", ""))}`,
              type: "FLOAT",
              codeSyntax: { WEB: `var(--md-sys-shape-${k})` },
              values: { Value: parseFloat(x) },
            })),
        },
      ],
    },
    null,
    2,
  ) + "\n";

// DESIGN.md (google-labs-code/design.md, version alpha).
const L = color.light;
const yamlColors = Object.entries(L)
  .map(([k, x]) => `  ${k}: "${x}"`)
  .concat(
    Object.entries(color.dark).map(([k, x]) => `  dark-${k}: "${x}"`),
    [`  bolt: "${tokens.custom.bolt}"`],
  );
const yamlType = Object.entries(typescale).map(
  ([n, p]) =>
    `  ${n}:\n    fontFamily: ${brand.font}\n    fontSize: ${p.size}\n    fontWeight: ${p.weight}\n    lineHeight: ${p["line-height"]}\n    letterSpacing: ${p.tracking}`,
);
const designMd = `---
version: alpha
name: ${brand.name}
description: Material 3 ${brand.variant} depuis ${tokens.source.seed}, généré par Material Color Utilities ${mcuVersion} (packages/design). Source unique de tous les UI du monorepo.
colors:
${yamlColors.join("\n")}
typography:
${yamlType.join("\n")}
rounded:
${Object.entries(shape)
  .filter(([, x]) => x.endsWith("px"))
  .map(([k, x]) => `  ${k.replace("corner-", "")}: ${x}`)
  .join("\n")}
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
components:
  button-filled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    typography: "{typography.label-large}"
    height: 40px
    padding: 24px
  button-tonal:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.full}"
  card-filled:
    backgroundColor: "{colors.surface-container-highest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.medium}"
    padding: 16px
  card-outlined:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.medium}"
  navigation-rail:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-variant}"
    width: 80px
  top-app-bar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.title-large}"
    height: 64px
  text-field-outlined:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.extra-small}"
    height: 56px
---

## Overview

Système unique \`@aphrody/design\` : Material 3 strict (m3.material.io), schéma ${brand.variant} depuis la couleur de marque ${tokens.source.seed} de \`assets/brand/brand.toml\`. Sobre, dense, technique. Aucune couleur hors rôles M3, aucune police hors ${brand.font}.

## Colors

Rôles M3 générés par Material Color Utilities (\`DynamicScheme\`), six modes : clair, sombre, contraste moyen et élevé. Le texte utilise toujours la paire \`on-*\` de sa surface. Les surfaces s'étagent par \`surface-container-lowest\` à \`surface-container-highest\`, jamais par des ombres colorées. \`bolt\` (${tokens.custom.bolt}) est l'unique couleur custom, réservée au monogramme et aux accents de marque, jamais au texte courant.

## Typography

Échelle M3 de Material Web (tokens v0_192) : display, headline, title, body, label en large/medium/small, police ${brand.font}, code en Google Sans Code.

## Layout

Grille de 4 px, classes de fenêtre M3 : compact < 600 px, medium 600-839, expanded 840-1199, large 1200-1599, extra-large >= 1600. Navigation : barre en compact, rail en medium et plus.

## Elevation & Depth

Niveaux M3 0 à 5 (0, 1, 3, 6, 8, 12 dp) exprimés d'abord par la teinte de surface (\`surface-container-*\`), l'ombre ne sert qu'aux éléments flottants (menus, dialogues, FAB).

## Shapes

Coins M3 : none 0, extra-small 4, small 8, medium 12, large 16, extra-large 28, full. Boutons et puces en full, cartes en medium, dialogues en extra-large.

## Components

Web : Material Web (\`@material/web\` ${mwcVersion}) uniquement, via \`@aphrody/design/components\`. Icônes : SVG 2 statiques (\`assets/brand/gen/symbols/sprite.svg\`, \`svg/*.svg\`) et structs Rust typées à la compilation (\`tokens/symbols.rs\` \`IconData\` / \`lucide-dioxus\` / \`lucide-leptos\` / \`dioxus-icons\` / \`icondata_core\`, tree-shakées par LLVM/wasm-opt sans chargement \`.woff2\` runtime). Desktop natif GPU : enum \`Symbol::codepoint()\` (\`tokens/symbols.rs\`, compatible \`egui_material_icons\` / \`iced_lucide\` / \`cosmic-text\`) avec \`tokens.rs\`. TUI : \`ansi.json\`.

## Do's and Don'ts

- Faire : consommer \`tokens.css\`, \`tokens.json\` ou les constantes typées \`tokens/symbols.rs\` (\`Symbol::Settings\`), jamais recopier une valeur hexadécimale ni une chaîne d'icône non typée côté Rust.
- Faire : régénérer par \`bun run --cwd packages/design build\` après tout changement de \`brand.toml\`.
- Ne pas faire : Tailwind, shadcn, palettes maison, dégradés décoratifs, emoji dans l'UI.
- Ne pas faire : une seconde bibliothèque d'icônes runtime (\`.woff2\`) là où SVG 2 statique ou \`Symbol\` typé compile-time s'applique.
`;

const writes: [string, string][] = [
  ...Object.entries(files).map(
    ([f, c]) => [join(out, f), c] as [string, string],
  ),
  [join(pkg, "DESIGN.md"), designMd],
];
let drift = 0;
for (const [path, content] of writes) {
  const f = Bun.file(path);
  const old = (await f.exists()) ? await f.text() : "";
  if (old === content) continue;
  drift++;
  if (check) console.error(`dérive : ${path}`);
  else await Bun.write(path, content);
}
if (check && drift) process.exit(1);
console.log(
  `${check ? "vérifié" : "écrit"} : ${writes.length} fichiers, ${roles.length} rôles x ${MODES.length} modes, primary ${L.primary}`,
);
