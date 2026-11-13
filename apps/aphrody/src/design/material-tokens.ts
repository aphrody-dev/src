/**
 * Google Material Design 3 (M3) Tokens, Adaptive Breakpoints & Material Symbols Registry
 * Reference: https://m3.material.io/
 * Zero external npm dependencies - 100% pure Web Standards & SVG Icons
 */
import symbolsJson from "../../../../assets/brand/gen/symbols/symbols.json";

export interface MaterialThemeTokens {
  surface: string;
  onSurface: string;
  onSurfaceVariant: string;
  surfaceDim: string;
  surfaceBright: string;
  surfaceContainerLowest: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export const MATERIAL_LIGHT_TOKENS: MaterialThemeTokens = {
  surface: "#fef7ff",
  onSurface: "#1d1b20",
  onSurfaceVariant: "#49454f",
  surfaceDim: "#ded8e1",
  surfaceBright: "#fef7ff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f7f2fa",
  surfaceContainer: "#f3edf7",
  surfaceContainerHigh: "#ece6f0",
  surfaceContainerHighest: "#e6e0e9",
  primary: "#6750a4",
  onPrimary: "#ffffff",
  primaryContainer: "#eaddff",
  onPrimaryContainer: "#21005d",
  secondary: "#625b71",
  onSecondary: "#ffffff",
  secondaryContainer: "#e8def8",
  onSecondaryContainer: "#1d192b",
  tertiary: "#7d5260",
  onTertiary: "#ffffff",
  tertiaryContainer: "#ffd8e4",
  onTertiaryContainer: "#31111d",
  error: "#b3261e",
  onError: "#ffffff",
  outline: "#79747e",
  outlineVariant: "#cac4d0",
  inverseSurface: "#313033",
  inverseOnSurface: "#f4eff4",
  inversePrimary: "#d0bcff",
};

export const MATERIAL_DARK_TOKENS: MaterialThemeTokens = {
  surface: "#141218",
  onSurface: "#e6e0e9",
  onSurfaceVariant: "#cac4d0",
  surfaceDim: "#141218",
  surfaceBright: "#3b383e",
  surfaceContainerLowest: "#0f0d13",
  surfaceContainerLow: "#1d1b20",
  surfaceContainer: "#211f26",
  surfaceContainerHigh: "#2b2930",
  surfaceContainerHighest: "#36343b",
  primary: "#d0bcff",
  onPrimary: "#381e72",
  primaryContainer: "#4f378b",
  onPrimaryContainer: "#eaddff",
  secondary: "#ccc2dc",
  onSecondary: "#332d41",
  secondaryContainer: "#4a4458",
  onSecondaryContainer: "#e8def8",
  tertiary: "#efb8c8",
  onTertiary: "#492532",
  tertiaryContainer: "#633b48",
  onTertiaryContainer: "#ffd8e4",
  error: "#f2b8b5",
  onError: "#601410",
  outline: "#938f99",
  outlineVariant: "#49454f",
  inverseSurface: "#e6e1e5",
  inverseOnSurface: "#313033",
  inversePrimary: "#6750a4",
};

export const MATERIAL_GLOBAL_TOKENS = {
  shapeCornerNone: "0px",
  shapeCornerExtraSmall: "4px",
  shapeCornerSmall: "8px",
  shapeCornerMedium: "12px",
  shapeCornerLarge: "16px",
  shapeCornerExtraLarge: "28px",
  shapeCornerFull: "9999px",
  elevationLevel0: "none",
  elevationLevel1:
    "0 1px 3px 1px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.30)",
  elevationLevel2:
    "0 2px 6px 2px rgba(0,0,0,0.15), 0 1px 2px 0 rgba(0,0,0,0.30)",
  elevationLevel3:
    "0 4px 8px 3px rgba(0,0,0,0.15), 0 1px 3px 0 rgba(0,0,0,0.30)",
  elevationLevel4:
    "0 6px 10px 4px rgba(0,0,0,0.15), 0 2px 3px 0 rgba(0,0,0,0.30)",
  elevationLevel5:
    "0 8px 12px 6px rgba(0,0,0,0.15), 0 4px 4px 0 rgba(0,0,0,0.30)",
  stateHoverOpacity: "0.08",
  stateFocusOpacity: "0.10",
  statePressedOpacity: "0.12",
  stateDraggedOpacity: "0.16",
};

export type MaterialBreakpoint = "compact" | "medium" | "expanded";

export function getMaterialBreakpoint(width: number): MaterialBreakpoint {
  if (width < 600) return "compact";
  if (width < 840) return "medium";
  return "expanded";
}

export function getMaterialCssVariables(
  theme: "light" | "dark" = "light",
): string {
  const t = theme === "dark" ? MATERIAL_DARK_TOKENS : MATERIAL_LIGHT_TOKENS;
  const entries: string[] = [];

  for (const [key, val] of Object.entries(t)) {
    entries.push(`--md-sys-color-${key}: ${val};`);
  }
  for (const [key, val] of Object.entries(MATERIAL_GLOBAL_TOKENS)) {
    entries.push(`--md-sys-${key}: ${val};`);
  }

  return entries.join("\n  ");
}

/**
 * Material Symbols Rounded (Apache-2.0): the [symbols] subset of assets/brand/brand.toml, optimized by
 * `ay brand build` (assets/brand/gen/symbols/symbols.json, also cdn.aphrody.com/brand/v1). No inline copy.
 */
type SymbolEntry = { codepoint: string; viewBox: string; outline: string; fill: string };
const SYMBOLS = symbolsJson as Record<string, SymbolEntry>;
export const MATERIAL_SYMBOLS: Record<string, string> = Object.fromEntries(
  Object.entries(SYMBOLS).map(([name, s]) => [name, s.outline]),
);

export function renderMaterialSymbol(
  name: string,
  size = 20,
  fill = "currentColor",
): string {
  const s = SYMBOLS[name] ?? SYMBOLS.apps!;
  return `<svg class="md-symbol" viewBox="${s.viewBox}" width="${size}" height="${size}" fill="${fill}">${s.outline}</svg>`;
}

/**
 * Compact CSS custom properties for the M3 components of the SEO pages and the
 * consent banner (keeps the initial CSS inside the 14 KB LCP budget).
 * Emits :root (light) and [data-theme="dark"]; the inline head script sets
 * data-theme from storage or prefers-color-scheme before first paint.
 */
const M3_SUBSET_KEYS: Array<keyof MaterialThemeTokens> = [
  "surface",
  "surfaceContainer",
  "onSurface",
  "onSurfaceVariant",
  "primary",
  "onPrimary",
  "secondaryContainer",
  "onSecondaryContainer",
  "outlineVariant",
];

function m3Vars(t: MaterialThemeTokens): string {
  return M3_SUBSET_KEYS.map((k) => `--m3-${k}:${t[k]}`).join(";");
}

export function getMaterialCssSubset(): string {
  const light = m3Vars(MATERIAL_LIGHT_TOKENS);
  const dark = m3Vars(MATERIAL_DARK_TOKENS);
  return `:root{${light}}` + `[data-theme="dark"]{${dark}}`;
}
