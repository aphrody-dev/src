import { describe, expect, test } from "bun:test";
import { TurboCache } from "../turbo-cache-plugin.ts";
import { join } from "node:path";

describe("Sovereign Turbo Blake3 Cache Engine", () => {
  const cache = new TurboCache({
    cacheDir: join(import.meta.dir, ".tmp-turbo-cache"),
  });

  test("computes deterministic Blake3 task hash", () => {
    const h1 = cache.computeHash("cargo build", [], ["CARGO_TERM_COLOR"]);
    const h2 = cache.computeHash("cargo build", [], ["CARGO_TERM_COLOR"]);
    expect(h1).toBe(h2);
    expect(h1.length).toBe(64);
  });

  test("memoizes task execution with cache hit", async () => {
    cache.clear();
    const testKey = `expensive-task-${Date.now()}`;
    let callCount = 0;
    const task = async () => {
      callCount++;
      return { answer: 42, generatedAt: Date.now() };
    };

    // First run (miss)
    const run1 = await cache.run(testKey, {}, task);
    expect(run1.cached).toBe(false);
    expect(run1.data.answer).toBe(42);
    expect(callCount).toBe(1);

    // Second run (hit)
    const run2 = await cache.run(testKey, {}, task);
    expect(run2.cached).toBe(true);
    expect(run2.data.answer).toBe(42);
    expect(callCount).toBe(1); // function was not called again!

    const stats = cache.getStats();
    expect(stats.hits).toBeGreaterThanOrEqual(1);
    expect(stats.misses).toBeGreaterThanOrEqual(1);
  });
});
