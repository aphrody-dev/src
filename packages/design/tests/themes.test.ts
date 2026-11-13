import { expect, test } from "bun:test";
import { argbFromHex, Contrast, Hct } from "@material/material-color-utilities";
import { buildThemes, THEMES, themesCss } from "../src/themes.ts";

const tone = (hex: string) => Hct.fromInt(argbFromHex(hex)).tone;

test("every theme has the same roles in light and dark", () => {
  const { themes } = buildThemes();
  const keys = Object.keys(themes.aphrody.light).sort();
  for (const t of Object.values(themes) as any[]) {
    expect(Object.keys(t.light).sort()).toEqual(keys);
    expect(Object.keys(t.dark).sort()).toEqual(keys);
  }
});

test("primary / on-primary and surface / on-surface reach AA in every theme and mode", () => {
  for (const t of Object.values(buildThemes().themes) as any[])
    for (const m of [t.light, t.dark])
      for (const [a, b] of [["primary", "on-primary"], ["surface", "on-surface"], ["background", "on-background"]])
        expect(Contrast.ratioOfTones(tone(m[a]), tone(m[b]))).toBeGreaterThanOrEqual(4.5);
});

test("css declares every theme", () => {
  const css = themesCss();
  for (const t of THEMES) expect(css).toContain(`:root[data-theme="${t.name}"]`);
});
