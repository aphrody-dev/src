import { type RGB, hex, mix, lum } from "./core.ts";

export type Mode = "light" | "dark";

export interface Pal {
  dark: boolean;
  theme: string;
  mode: Mode;
  bg: RGB;
  bgAlt: RGB;
  ink: RGB;
  primary: RGB;
  secondary: RGB;
  tertiary: RGB;
  pc: RGB;
  tc: RGB;
  accent: RGB;
  /** accent colors for blobs, strongest first */
  blobs: RGB[];
  /** background to highlight ramp */
  ramp: RGB[];
}

export interface ThemeFile {
  themes: Record<
    string,
    {
      seed: string;
      light: Record<string, string>;
      dark: Record<string, string>;
    }
  >;
}

export async function loadThemes(path: string): Promise<ThemeFile> {
  return (await Bun.file(path).json()) as ThemeFile;
}

export function palette(tf: ThemeFile, theme: string, mode: Mode): Pal {
  const t = tf.themes[theme];
  if (!t) throw new Error(`unknown theme ${theme}`);
  const r = t[mode];
  const c = (k: string) => hex(r[k] ?? "#808080");
  const bg = c("background");
  const seed = hex(t.seed);
  const neutral = theme === "mono";
  // Seed-derived accent: keeps muted schemes (workshop, frost, mono) from rendering as flat grey.
  const accent = neutral
    ? c("secondary")
    : mix(c("primary"), seed, mode === "dark" ? 0.55 : 0.35);
  const pc = c("primary-container");
  const tc = c("tertiary-container");
  const primary = c("primary");
  const tertiary = c("tertiary");
  const secondary = c("secondary");
  const dark = mode === "dark";
  const soft = (x: RGB, k: number) => mix(bg, x, k);
  const blobs = dark
    ? [
        soft(accent, 0.55),
        soft(pc, 1),
        soft(tertiary, 0.4),
        soft(tc, 1),
        soft(seed, neutral ? 0.2 : 0.45),
        soft(secondary, 0.3),
      ]
    : [
        soft(accent, 0.45),
        soft(pc, 1),
        soft(tc, 1),
        soft(tertiary, 0.35),
        soft(seed, neutral ? 0.15 : 0.4),
        soft(secondary, 0.3),
      ];
  const ramp = dark
    ? [
        bg,
        c("surface-container"),
        soft(pc, 0.9),
        soft(accent, 0.5),
        soft(primary, 0.7),
      ]
    : [
        bg,
        soft(pc, 0.7),
        soft(tc, 0.9),
        soft(accent, 0.45),
        soft(primary, 0.6),
      ];
  return {
    theme,
    mode,
    dark,
    bg,
    bgAlt: c("surface-container"),
    ink: c("on-surface"),
    primary,
    secondary,
    tertiary,
    pc,
    tc,
    accent,
    blobs,
    ramp,
  };
}

export const THEMES = [
  "aphrody",
  "workshop",
  "night",
  "frost",
  "ember",
  "dawn",
  "mono",
] as const;
export const MODES: Mode[] = ["dark", "light"];

/** Which theme each surface uses by default (community sites: generic brand-token backgrounds only). */
export const APP_THEME: Record<string, string> = {
  aphrody: "aphrody",
  nt: "workshop",
  yolo: "frost",
  game: "night",
  shenron: "ember",
  rosegriffon: "dawn",
};

export const isDark = (p: Pal) => lum(p.bg) < 0.2;
