// Official Material Symbols (https://fonts.google.com/icons, Apache-2.0, google/material-design-icons)
// Builds SVG 2 `<symbol>` sprites (`<use href="#id">`), optical-grid 24px SVGs (`fill="currentColor"`),
// and variable-font CSS (`FILL`, `wght`, `GRAD`, `opsz` axes). Zero invented slop shapes.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";
import { optimizeSvg2, validateSvg2 } from "./svg2.ts";

export interface SymbolEntry {
  codepoint?: string;
  fill: string;
  outline: string;
  viewBox: string;
}

const toPascalCase = (snake: string): string =>
  snake
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1).toLowerCase())
    .join("");

const toConstIdent = (snake: string): string =>
  snake.replace(/[^a-zA-Z0-9]+/g, "_").toUpperCase();

/**
 * Generates a compile-time typed Rust module (`symbols.rs`) covering both 2026 Rust UI icon paradigms:
 * - Web / WASM (`Dioxus`, `Leptos`, SSR): per-icon `pub const` `IconData` structs tree-shaken by LLVM/`wasm-opt` (zero runtime `.woff2` load).
 * - Native / GPU (`egui`, `iced`, `wgpu`/`parley`/`cosmic-text`, `GPUI`): exhaustive `enum Symbol` with Unicode scalar `codepoint()`.
 */
export function renderRustIconsModule(
  map: Record<string, SymbolEntry>,
): string {
  const names = Object.keys(map).sort();
  const consts: string[] = [];
  const variants: string[] = [];
  const nameArms: string[] = [];
  const cpArms: string[] = [];
  const dataArms: string[] = [];
  const parseArms: string[] = [];
  const allItems: string[] = [];

  for (const name of names) {
    const e = map[name]!;
    const pascal = toPascalCase(name);
    const ident = toConstIdent(name);
    const cpHex = (e.codepoint ?? "e88a").toLowerCase();
    const cpLit = `'\\u{${cpHex}}'`;
    consts.push(
      `pub const ${ident}: IconData = IconData {\n` +
        `    id: ${JSON.stringify(name)},\n` +
        `    view_box: ${JSON.stringify(e.viewBox)},\n` +
        `    outline: ${JSON.stringify(e.outline)},\n` +
        `    fill: ${JSON.stringify(e.fill || e.outline)},\n` +
        `    codepoint: ${cpLit},\n` +
        `};`,
    );
    variants.push(`    ${pascal},`);
    nameArms.push(`            Self::${pascal} => ${JSON.stringify(name)},`);
    cpArms.push(`            Self::${pascal} => ${cpLit},`);
    dataArms.push(`            Self::${pascal} => &${ident},`);
    parseArms.push(
      `            ${JSON.stringify(name)} => Some(Self::${pascal}),`,
    );
    allItems.push(`Self::${pascal}`);
  }

  return `// Compile-time typed icons (${names.length} Material Symbols Rounded). Generated — do not edit.
// Web/WASM (Dioxus, Leptos, SSR): consume \`IconData\` / \`Symbol::icon_data()\` (LLVM dead-strips unused constants, zero runtime .woff2).
// Native/GPU (egui, iced, wgpu/parley, GPUI): consume \`Symbol::codepoint()\` for compile-time typed font-atlas lookups.

/// Static SVG vector icon descriptor (tree-shaken per constant by LLVM / wasm-opt).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct IconData {
    pub id: &'static str,
    pub view_box: &'static str,
    pub outline: &'static str,
    pub fill: &'static str,
    pub codepoint: char,
}

impl IconData {
    /// Emits a W3C CR-SVG2-20261006 \`<svg>\` element inheriting \`currentColor\`.
    #[must_use]
    pub fn to_svg(&self, filled: bool, size: u16) -> String {
        let body = if filled { self.fill } else { self.outline };
        format!(
            "<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"{size}\\" height=\\"{size}\\" viewBox=\\"{vb}\\" fill=\\"currentColor\\" aria-hidden=\\"true\\">{body}</svg>",
            vb = self.view_box,
        )
    }
}

${consts.join("\n")}

/// Compile-time checked icon identifier (typos fail at \`cargo check\`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Symbol {
${variants.join("\n")}
}

impl Symbol {
    /// Exhaustive list of compiled symbols.
    pub const ALL: &'static [Self] = &[${allItems.join(", ")}];

    /// Canonical snake_case icon identifier.
    #[must_use]
    pub const fn name(self) -> &'static str {
        match self {
${nameArms.join("\n")}
        }
    }

    /// Unicode Private Use Area codepoint for native GPU text/SDF atlases (\`egui\`, \`iced\`, \`cosmic-text\`, \`parley\`).
    #[must_use]
    pub const fn codepoint(self) -> char {
        match self {
${cpArms.join("\n")}
        }
    }

    /// Static W3C SVG 2 data for Web/WASM SSR and VDOM frameworks (\`Dioxus\`, \`Leptos\`, \`Yew\`).
    #[must_use]
    pub const fn icon_data(self) -> &'static IconData {
        match self {
${dataArms.join("\n")}
        }
    }

    /// Renders a W3C CR-SVG2-20261006 \`<svg>\` string for this symbol.
    #[must_use]
    pub fn to_svg(self, filled: bool, size: u16) -> String {
        self.icon_data().to_svg(filled, size)
    }

    /// Resolves a serialized snake_case icon name at boundary edges.
    #[must_use]
    pub fn parse(name: &str) -> Option<Self> {
        match name {
${parseArms.join("\n")}
            _ => None,
        }
    }
}
`;
}

/** Validates an SVG against Material Symbols 24px optical grid + W3C CR-SVG2-20261006. */
export function validateMaterialSymbolSvg(svg: string, name: string): string[] {
  const rep = validateSvg2(svg, `${name}.svg`);
  const errs = [...rep.errors];
  if (!/viewBox="(0 0 24 24|0 -960 960 960)"/.test(svg)) {
    errs.push(
      `${name}: Material Symbols require viewBox="0 0 24 24" or "0 -960 960 960"`,
    );
  }
  if (!/fill="currentColor"/.test(svg)) {
    errs.push(
      `${name}: monochrome Material Symbols must inherit color via fill="currentColor"`,
    );
  }
  return errs;
}

/** Formats standard Google Fonts Material Symbols Rounded variable CSS (`FILL`, `wght`, `GRAD`, `opsz`). */
export function renderMaterialSymbolsCss(count: number): string {
  return `/* Material Symbols Rounded (Apache-2.0, https://fonts.google.com/icons): ${count} glyphs; axes FILL 0..1, GRAD -50..200, opsz 20..48, wght 100..700. */
@font-face {
  font-family: "Material Symbols Rounded";
  font-style: normal;
  font-weight: 100 700;
  font-display: block;
  src: url(material-symbols-rounded.woff2) format("woff2");
}
.material-symbols-rounded {
  font-family: "Material Symbols Rounded";
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-feature-settings: "liga";
  font-variation-settings:
    "FILL" 0,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
}
.material-symbols-rounded.filled {
  font-variation-settings:
    "FILL" 1,
    "wght" 400,
    "GRAD" 0,
    "opsz" 24;
}
`;
}

/** Rebuilds `symbols.json`, SVG 2 `sprite.svg` (using `<symbol>`), and `symbols.css` from `assets/brand/gen/symbols/svg/`. */
export function syncMaterialSymbolsDir(symbolsDir: string): {
  count: number;
  errors: string[];
} {
  const svgDir = join(symbolsDir, "svg");
  mkdirSync(svgDir, { recursive: true });
  const existingJsonPath = join(symbolsDir, "symbols.json");
  const existing: Record<string, SymbolEntry> = existsSync(existingJsonPath)
    ? JSON.parse(readFileSync(existingJsonPath, "utf8"))
    : {};

  const errors: string[] = [];
  const files = readdirSync(svgDir)
    .filter((f) => f.endsWith(".svg"))
    .sort();
  const map: Record<string, SymbolEntry> = {};

  for (const file of files) {
    const raw = readFileSync(join(svgDir, file), "utf8");
    const name = basename(file, ".svg");
    const isFill = name.endsWith("-fill");
    const baseName = isFill ? name.slice(0, -5) : name;

    // Ensure clean 24x24 W3C SVG 2 icon format with currentColor & aria-hidden="true"
    // Note: keep width="24" height="24" on individual SVG files so `@aphrody/design` bun-plugin size replacement works cleanly!
    let normalized = raw.trim();
    if (!/\bwidth="24"/.test(normalized)) {
      normalized = normalized.replace(/<svg\b/, '<svg width="24" height="24"');
    }
    const errs = validateMaterialSymbolSvg(normalized, name);
    errors.push(...errs);
    if (normalized !== raw.trim()) {
      writeFileSync(join(svgDir, file), normalized + "\n");
    }

    const innerMatch = normalized.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    const inner = (innerMatch?.[1] ?? "").trim();
    const entry = (map[baseName] ??= {
      codepoint: existing[baseName]?.codepoint,
      fill: existing[baseName]?.fill ?? inner,
      outline: existing[baseName]?.outline ?? inner,
      viewBox: "0 0 24 24",
    });
    if (isFill) entry.fill = inner;
    else entry.outline = inner;
  }

  // Write W3C SVG 2 `<symbol>` sprite sheet (no xlink:href anywhere; consumers reference via `<use href="sprite.svg#name">`)
  const spriteSymbols: string[] = [];
  for (const name of Object.keys(map).sort()) {
    const e = map[name]!;
    spriteSymbols.push(
      `  <symbol id="${name}" viewBox="${e.viewBox}">${e.outline}</symbol>`,
    );
    if (e.fill && e.fill !== e.outline) {
      spriteSymbols.push(
        `  <symbol id="${name}-fill" viewBox="${e.viewBox}">${e.fill}</symbol>`,
      );
    }
  }
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">\n${spriteSymbols.join("\n")}\n</svg>\n`;
  writeFileSync(join(symbolsDir, "sprite.svg"), optimizeSvg2(sprite));
  writeFileSync(existingJsonPath, JSON.stringify(map, null, 2) + "\n");
  writeFileSync(
    join(symbolsDir, "symbols.css"),
    renderMaterialSymbolsCss(Object.keys(map).length),
  );
  writeFileSync(join(symbolsDir, "symbols.rs"), renderRustIconsModule(map));

  return { count: Object.keys(map).length, errors };
}
