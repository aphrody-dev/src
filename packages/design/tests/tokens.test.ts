import { expect, test } from "bun:test";
import { argbFromHex, Contrast, Hct } from "@material/material-color-utilities";
import { tokens } from "../src/index.ts";

const tone = (hex: string) => Hct.fromInt(argbFromHex(hex)).tone;
const ratio = (a: string, b: string) => Contrast.ratioOfTones(tone(a), tone(b));

const brandToml = Bun.file(
  `${import.meta.dir}/../../../assets/brand/brand.toml`,
);
test.skipIf(!(await brandToml.exists()))("source = brand.toml", async () => {
  const brand = Bun.TOML.parse(await brandToml.text()) as any;
  expect(tokens.source.seed).toBe(brand.brand.seed.toUpperCase());
  expect(tokens.source.variant).toBe(brand.brand.variant);
});

test("six modes, mêmes rôles", () => {
  const keys = Object.keys(tokens.color.light).sort();
  expect(Object.keys(tokens.color)).toHaveLength(6);
  for (const m of Object.values(tokens.color))
    expect(Object.keys(m).sort()).toEqual(keys);
});

test("contraste de toutes les paires on-X / X (AA, AAA en contraste élevé), outline >= 3:1", () => {
  for (const [mode, m] of Object.entries(tokens.color) as [
    string,
    Record<string, string>,
  ][]) {
    const min = mode.endsWith("high-contrast") ? 7 : 4.5;
    for (const k of Object.keys(m).filter((k) => k.startsWith("on-"))) {
      const bg =
        k === "on-surface-variant" || k === "on-background"
          ? k === "on-background"
            ? "background"
            : "surface"
          : k.slice(3);
      if (!m[bg]) continue;
      expect(ratio(m[k], m[bg]), `${mode} ${k}/${bg}`).toBeGreaterThanOrEqual(
        min,
      );
    }
    expect(
      ratio(m["inverse-on-surface"], m["inverse-surface"]),
      `${mode} inverse`,
    ).toBeGreaterThanOrEqual(min);
    expect(
      ratio(m["outline"], m["surface"]),
      `${mode} outline`,
    ).toBeGreaterThanOrEqual(3);
  }
});

test("sorties à jour (bun run build)", () => {
  const r = Bun.spawnSync([
    "bun",
    "run",
    `${import.meta.dir}/../src/build.ts`,
    "--check",
  ]);
  expect(r.exitCode, r.stderr.toString()).toBe(0);
});
