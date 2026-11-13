import { expect, test } from "bun:test";
import { summarize } from "./game-fps";

test("median fps and percentiles from frame durations", () => {
  const frames = [...Array(95).fill(8), ...Array(5).fill(20)];
  const s = summarize(frames);
  expect(s.frames).toBe(100);
  expect(s.medianFps).toBe(125);
  expect(s.p95FrameMs).toBe(8);
  expect(s.p99FrameMs).toBe(20);
  expect(s.worstFrameMs).toBe(20);
});

test("empty input does not divide by zero", () => {
  expect(summarize([]).medianFps).toBe(0);
});
