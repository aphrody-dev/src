import { describe, expect, test } from "bun:test";
import { GAMESCOPE_CSP, GAMESCOPE_PERMISSIONS, renderGamescope } from "../src/gamescope/page";

describe("gamescope host page", () => {
  test("canvas, status line and both layout buttons", () => {
    const html = renderGamescope();
    expect(html).toContain('<canvas id="gs"');
    expect(html).toContain('data-shell="ps"');
    expect(html).toContain('data-shell="switch"');
    expect(html).toContain('src="/gamescope/gamescope.js"');
  });
  test("CSP allows wasm from the first-party CDN only", () => {
    expect(GAMESCOPE_CSP).toContain("'wasm-unsafe-eval'");
    expect(GAMESCOPE_CSP).toContain("script-src 'self' https://cdn.aphrody.com");
    expect(GAMESCOPE_CSP).not.toContain("'unsafe-eval'");
    expect(GAMESCOPE_PERMISSIONS).toContain("gamepad=(self)");
  });
});
