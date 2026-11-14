import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { checkBevyMeta, renderBevyMeta } from "../src/bevy.ts";
import {
  renderMaterialSymbolsCss,
  renderRustIconsModule,
  validateMaterialSymbolSvg,
} from "../src/material-symbols.ts";
import { optimizeSvg2, validateSvg2 } from "../src/svg2.ts";
import { extractImageColors, parseZukanListHtml } from "../src/zukan.ts";

const root = join(import.meta.dir, "..", "..", "..");

describe("Bevy asset conventions", () => {
  test("renderBevyMeta formats valid RON AssetMeta v1.0 sidecars", () => {
    const pngMeta = renderBevyMeta("textures/hero.png", { pixelArt: true });
    expect(pngMeta).toContain('meta_format_version: "1.0"');
    expect(pngMeta).toContain(
      'loader: "bevy_image::image_loader::ImageLoader"',
    );
    expect(pngMeta).toContain("sampler: Nearest");
    expect(checkBevyMeta(pngMeta!, "textures/hero.png")).toEqual([]);

    const glbMeta = renderBevyMeta("models/explorer.glb");
    expect(glbMeta).toContain('loader: "bevy_gltf::loader::GltfLoader"');
    expect(checkBevyMeta(glbMeta!, "models/explorer.glb")).toEqual([]);
  });

  test("checkBevyMeta rejects malformed or missing loader specs", () => {
    const errs = checkBevyMeta('(meta_format_version: "0.9")', "bad.png");
    expect(errs.length).toBeGreaterThanOrEqual(3);
  });
});

describe("W3C CR-SVG2-20261006 validation", () => {
  test("accepts clean SVG 2 markup with viewBox and plain href", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img"><title>Icon</title><use href="#mark"/></svg>';
    const rep = validateSvg2(svg, "clean.svg");
    expect(rep.ok).toBe(true);
    expect(rep.hasViewBox).toBe(true);
    expect(rep.hasTitleOrHidden).toBe(true);
    expect(optimizeSvg2(svg)).toContain("viewBox=");
  });

  test("rejects deprecated xlink:href and embedded base64 raster images", () => {
    const xlinkSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><use xlink:href="#a"/></svg>';
    const xlinkRep = validateSvg2(xlinkSvg, "xlink.svg");
    expect(xlinkRep.ok).toBe(false);
    expect(xlinkRep.errors.some((e) => e.includes("XLink"))).toBe(true);

    const rasterSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><image href="data:image/png;base64,iVBORw0"/></svg>';
    const rasterRep = validateSvg2(rasterSvg, "raster.svg");
    expect(rasterRep.ok).toBe(false);
    expect(rasterRep.errors.some((e) => e.includes("base64"))).toBe(true);
  });
});

describe("Material Symbols Rounded conventions", () => {
  test("validates optical 24px grid + currentColor and emits variable font axes CSS", () => {
    const okSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2L2 22h20z"/></svg>';
    expect(validateMaterialSymbolSvg(okSvg, "bolt")).toEqual([]);

    const badSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#000"><path d="M0 0h16v16H0z"/></svg>';
    expect(validateMaterialSymbolSvg(badSvg, "bad").length).toBe(2);

    const css = renderMaterialSymbolsCss(29);
    expect(css).toContain('"FILL" 0');
    expect(css).toContain('"wght" 400');
    expect(css).toContain('"GRAD" 0');
    expect(css).toContain('"opsz" 24');

    const rs = renderRustIconsModule({
      settings: {
        codepoint: "e8b8",
        outline: '<path d="M12 2z"/>',
        fill: '<path d="M12 2z"/>',
        viewBox: "0 0 24 24",
      },
    });
    expect(rs).toContain("pub struct IconData");
    expect(rs).toContain("pub const SETTINGS: IconData");
    expect(rs).toContain("pub enum Symbol");
    expect(rs).toContain("Self::Settings => '\\u{e8b8}'");
  });
});

describe("Rose Griffon Zukan parser & MCU+OKLCH color extractor", () => {
  test("parses tbody character rows matching zukan.inazuma.jp structure", () => {
    const sampleHtml = `<table><tbody><tr>
      <td rowspan="2"><input type="checkbox" class="my-team-checkbox" data-chara-id="k/d/y/dykb3jbxeis" data-chara-name="Byron Love" data-nickname="Aphrody" /></td>
      <td rowspan="2">185</td>
      <td rowspan="2"><picture><img src="https://dxi4wb638ujep.cloudfront.net/1/k/d/y/dykb3jbxeis.png" /></picture><a href="/en/chara_param/?q=abc">Byron Love</a></td>
      <td rowspan="2">Aphrody</td>
      <td colspan="9">Inazuma Eleven</td>
      <td rowspan="2">Male</td>
      <td rowspan="2">Forest</td>
      <td rowspan="2">MF</td>
      <td rowspan="2">Player</td>
    </tr></tbody></table>`;
    const parsed = parseZukanListHtml(sampleHtml);
    expect(parsed.entries.length).toBe(1);
    expect(parsed.entries[0]?.id).toBe("185");
    expect(parsed.entries[0]?.series).toBe("IE1");
    expect(parsed.entries[0]?.name).toBe("Byron Love");
    expect(parsed.entries[0]?.nickname).toBe("Aphrody");
    expect(parsed.entries[0]?.element).toBe("Forest");
    expect(parsed.entries[0]?.position).toBe("MF");
  });

  test("extracts MCU Celebi seeds + Rose Griffon OKLCH roles from local portrait", () => {
    const ie1Png = join(
      root,
      "assets",
      "brand",
      "gen",
      "zukan",
      "raw",
      "byron-ie1.png",
    );
    if (!existsSync(ie1Png)) return;
    const analysis = extractImageColors(ie1Png, 4);
    expect(analysis.seeds.length).toBeGreaterThan(0);
    expect(analysis.oklchLight.primary).toMatch(/^#[0-9a-f]{6}$/i);
    expect(analysis.oklchDark.surface).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
