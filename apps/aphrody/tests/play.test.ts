import { describe, expect, it } from "bun:test";
import { PLAY_CSP, renderPlay } from "../src/play/page";

describe("/play page", () => {
  const html = renderPlay();

  it("is a full-screen canvas with a message area and the module entry", () => {
    expect(html).toContain('<canvas id="game"');
    expect(html).toContain('id="msg"');
    expect(html).toContain('src="/play/play.js"');
  });

  it("has no inline script (CSP forbids it on /play)", () => {
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)(?![^>]*application\/json)[^>]*>/);
  });

  it("allows wasm and nothing third-party", () => {
    expect(PLAY_CSP).toContain("'wasm-unsafe-eval'");
    expect(PLAY_CSP).not.toContain("'unsafe-eval'");
    expect(PLAY_CSP).not.toMatch(/https:\/\//);
  });
});
