import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  LP_ABI_VERSION,
  loadBrowserCore,
  lpCapabilities,
  lpExtractTitle,
  lpNormalizeUrl,
  resolveAphrodyV8,
} from "./index";

test("lightpanda Zig browser_capi FFI and unified V8 resolution", () => {
  const dll = join(
    import.meta.dir,
    "..",
    "native",
    "zig-out",
    "bin",
    process.platform === "win32" ? "browser_capi.dll" : "libbrowser_capi.so",
  );
  const loaded = loadBrowserCore();
  if (existsSync(dll)) {
    expect(loaded).not.toBeNull();
    expect(loaded!.lib.symbols.lp_abi_version()).toBe(LP_ABI_VERSION);
  }

  const caps = lpCapabilities();
  expect(caps.abi).toBe(LP_ABI_VERSION);
  expect(caps.features).toContain("extract_title");
  expect(
    lpExtractTitle("<html><head><Title> Aphrody </title></head></html>"),
  ).toBe("Aphrody");
  expect(lpNormalizeUrl("aphrody.com/docs")).toBe("https://aphrody.com/docs");
  expect(lpNormalizeUrl("https://aphrody.com")).toBe("https://aphrody.com");
  expect(resolveAphrodyV8()).not.toBeNull();
});
