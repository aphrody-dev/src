import { describe, expect, test } from "bun:test";
import { CRAFT_APPS, CRAFT_CDN } from "../src/craft/apps";
import { CRAFT_CSP, CRAFT_PERMISSIONS, renderCraftApp, renderCraftIndex } from "../src/craft/page";

describe("craft host pages", () => {
  test("every app has a page with its name, icon and lazy iframe", () => {
    for (const a of CRAFT_APPS) {
      const html = renderCraftApp(a);
      expect(html).toContain(`<h1>${a.name}</h1>`);
      expect(html).toContain(`${CRAFT_CDN}${a.id}/${a.icon}`);
      expect(html).toContain('id="frame" title');
      expect(html).not.toMatch(/<iframe[^>]*\ssrc=/); // the iframe src is set by craft.js after the WebGPU check
    }
  });
  test("index lists every app", () => {
    const html = renderCraftIndex();
    for (const a of CRAFT_APPS) expect(html).toContain(`/craft/${a.id}`);
  });
  test("CSP frames only the first-party CDN, no wasm eval on the host page", () => {
    expect(CRAFT_CSP).toContain("frame-src https://cdn.aphrody.com");
    expect(CRAFT_CSP).not.toContain("unsafe-eval");
    expect(CRAFT_PERMISSIONS).toContain('gamepad=(self "https://cdn.aphrody.com")');
  });
});
