import { expect, test } from "bun:test";
import { bench } from "../bench/retrieval";

test("retrieval bench on research pack: merged heads >= single heads, latency bound", async () => {
  const r = await bench();
  const { lexical, semantic, merged } = r.results;
  console.log(JSON.stringify(r.results));
  expect(r.queries).toBe(30);
  expect(merged!.r5).toBeGreaterThanOrEqual(Math.max(lexical!.r5, semantic!.r5) - 0.05);
  expect(merged!.r5).toBeGreaterThanOrEqual(0.5);
  expect(merged!.msPerQuery).toBeLessThan(50);
});
