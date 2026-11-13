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

  it("allows wasm and only the first-party CDN", () => {
    expect(PLAY_CSP).toContain("'wasm-unsafe-eval'");
    expect(PLAY_CSP).not.toContain("'unsafe-eval'");
    // The only external origin is the first-party CDN that serves the wasm build (game.yml publishes it).
    expect(PLAY_CSP.match(/https:\/\/[^\s;]+/g)).toEqual([
      "https://cdn.aphrody.com",
      "https://cdn.aphrody.com",
    ]);
  });
});
