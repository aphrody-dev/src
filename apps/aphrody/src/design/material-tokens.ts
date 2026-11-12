/**
 * Google Material Design 3 (M3) Tokens, Adaptive Breakpoints & Material Symbols Registry
 * Reference: https://m3.material.io/
 * Zero external npm dependencies - 100% pure Web Standards & SVG Icons
 */

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
 * Crisp Vector SVG Material Symbols Registry
 * ViewBox 0 0 24 24, stroke/fill controlled by currentColor
 */
export const MATERIAL_SYMBOLS: Record<string, string> = {
  search:
    '<path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>',
  menu: '<path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>',
  close:
    '<path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>',
  settings:
    '<path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>',
  apps: '<path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z"/>',
  storefront:
    '<path d="M21.9 8.89l-1.05-4.37c-.22-.9-1-1.52-1.91-1.52H5.05c-.9 0-1.69.63-1.9 1.52L2.1 8.89c-.24 1.02-.02 2.06.62 2.88.08.11.19.19.28.29V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-6.94c.09-.09.2-.18.28-.28.64-.82.87-1.87.62-2.89zm-2.97-3.41l1 4.18c.09.37-.04.75-.36 1.01-.26.22-.65.33-1.07.33-.83 0-1.5-.67-1.5-1.5v-4h1.93zm-5.43 4c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-4h3v4zm-6.5 0c0 .83-.67 1.5-1.5 1.5-.42 0-.81-.12-1.07-.33-.31-.26-.44-.64-.35-1.02l1-4.15h1.92v4zm-1.95 9.52V13.8c.44.13.9.2 1.45.2 1.52 0 2.86-.74 3.7-1.87.83 1.13 2.18 1.87 3.7 1.87s2.87-.74 3.7-1.87c.84 1.13 2.18 1.87 3.7 1.87.55 0 1.01-.07 1.45-.2v5.19H5.05z"/>',
  rocket_launch:
    '<path d="M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 8.65h2.12c.11-2.45 1.23-5.07 2.84-6.88l-1.39-1.77zM12 2.5c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L3 19.5 4.5 21l2.39-1.97C8.43 20.26 10.38 21 12.5 21c4.97 0 9-4.03 9-9 0-4.97-4.03-9.5-9.5-9.5zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>',
  tune: '<path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>',
  download: '<path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>',
  refresh:
    '<path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>',
  code: '<path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>',
  palette:
    '<path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.5 21H12c4.97 0 9-4.03 9-9 0-4.97-4.03-9-9-9zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>',
  desktop_windows:
    '<path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z"/>',
  devices:
    '<path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 10h-4v-7h4v7z"/>',
  check: '<path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>',
  arrow_back:
    '<path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>',
  play_arrow: '<path d="M8 5v14l11-7z"/>',
  speed:
    '<path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.28-10.43zM10.59 15.41a2 2 0 1 1 2.83-2.83l5.66-5.66-2.83 2.83a2 2 0 0 1-2.83 2.83l-2.83 2.83z"/>',
  layers:
    '<path d="M11.99 18.54l-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>',
  auto_awesome:
    '<path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>',
};

export function renderMaterialSymbol(
  name: string,
  size = 20,
  fill = "currentColor",
): string {
  const path = MATERIAL_SYMBOLS[name] || MATERIAL_SYMBOLS.apps;
  return `<svg class="md-symbol" viewBox="0 0 24 24" width="${size}" height="${size}" fill="${fill}">${path}</svg>`;
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
