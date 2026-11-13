import { describe, expect, test } from "bun:test";
import { Spring, MOTION, dur } from "../src/immersive/motion.ts";
import { pickNext, stickDir } from "../src/immersive/nav.ts";
import { parseMotion } from "../src/immersive/tokens.macro.ts";

describe("motion tokens", () => {
  test("first declaration wins over the reduced-motion override", () => {
    const m = parseMotion(":root{--md-sys-motion-duration-short2: 100ms;}@media (x){:root{--md-sys-motion-duration-short2: 0ms;}}");
    expect(m.duration.short2).toBe(100);
  });
  test("real tokens are loaded in seconds", () => {
    expect(dur("medium1")).toBe(0.25);
    expect(MOTION.easing.emphasized).toEqual([0.2, 0, 0, 1]);
  });
});

describe("spring", () => {
  test("settles on the target within its duration", () => {
    const s = new Spring(0, 1, 0.25);
    for (let i = 0; i < 20; i++) s.step(1 / 60);
    expect(Math.abs(s.x - 1)).toBeLessThan(0.02);
  });
  test("never overshoots when critically damped from rest", () => {
    const s = new Spring(0, 1, 0.3);
    let max = 0;
    for (let i = 0; i < 200; i++) {
      s.step(1 / 120);
      max = Math.max(max, s.x);
    }
    expect(max).toBeLessThanOrEqual(1.0001);
  });
  test("zero duration snaps instead of producing NaN", () => {
    const s = new Spring(0, 1, 0);
    s.step(0.016);
    expect(s.x).toBe(1);
  });
});

describe("spatial navigation", () => {
  const row = [0, 1, 2].map((i) => ({ x: i * 400, y: 0, w: 380, h: 300 }));
  test("moves along a row", () => {
    expect(pickNext(row, 0, "right")).toBe(1);
    expect(pickNext(row, 1, "left")).toBe(0);
    expect(pickNext(row, 2, "right")).toBe(-1);
  });
  test("prefers the aligned neighbour", () => {
    const g = [{ x: 0, y: 0, w: 100, h: 100 }, { x: 0, y: 300, w: 100, h: 100 }, { x: 400, y: 20, w: 100, h: 100 }];
    expect(pickNext(g, 0, "down")).toBe(1);
    expect(pickNext(g, 0, "right")).toBe(2);
  });
  test("stick dead zone and direction", () => {
    expect(stickDir(0.2, 0.2)).toBeNull();
    expect(stickDir(0.9, 0.1)).toBe("right");
    expect(stickDir(0, -0.8)).toBe("up");
  });
});
