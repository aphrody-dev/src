import { test, expect } from "bun:test";
import { runDiff } from "../src/diff";
test("diffcorpus: niu agrees with GNU bash on >= 90% of 306 cases", async () => {
  const rs = await runDiff();
  expect(rs.length).toBe(306);
  expect(rs.filter(r => r.same).length / rs.length).toBeGreaterThanOrEqual(0.9);
}, 180000);
