import { test, expect } from "bun:test";
import { runAll } from "../src/niu-e2e";
test("niubash 1.5.0 end to end", async () => {
  const rs = await runAll();
  expect(rs.filter((r) => !r.ok)).toEqual([]);
}, 60000);
