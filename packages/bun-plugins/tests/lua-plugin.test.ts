// SPDX-License-Identifier: Apache-2.0
import { expect, test, describe } from "bun:test";
import { luaPlugin } from "../lua-plugin";

describe("Bun Plugins - Lua Plugin", () => {
  test("luaPlugin returns valid plugin name and setup hook", () => {
    const plugin = luaPlugin();
    expect(plugin.name).toBe("bun-plugin-lua");
    expect(typeof plugin.setup).toBe("function");

    // Cast keeps the declared type: TS does not see the assignment inside the callback
    // and would otherwise narrow `filter` to `null` (then `never` after the check).
    let filter = null as RegExp | null;
    plugin.setup({
      onLoad(opts: { filter: RegExp }) {
        filter = opts.filter;
      },
    });

    expect(filter).not.toBeNull();
    expect(filter?.test("logic.lua")).toBeTrue();
    expect(filter?.test("logic.js")).toBeFalse();
  });
});
