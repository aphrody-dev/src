import { describe, expect, test } from "bun:test";
import {
  loadNative,
  NATIVE_LIB_FILE,
  NATIVE_SYMBOLS,
  nativeLibCandidates,
} from "./index.ts";

describe("@aphrody/native", () => {
  test("exports expected C ABI symbol table", () => {
    expect(NATIVE_SYMBOLS.native_sdk_app_create).toBeDefined();
    expect(NATIVE_SYMBOLS.native_sdk_app_destroy).toBeDefined();
    expect(NATIVE_SYMBOLS.native_sdk_app_viewport).toBeDefined();
    expect(NATIVE_SYMBOLS.native_sdk_app_gpu_frame_state).toBeDefined();
  });

  test("resolves platform library filename and candidate paths", () => {
    expect(NATIVE_LIB_FILE).toContain("native-sdk.");
    const candidates = nativeLibCandidates();
    expect(candidates.length).toBeGreaterThanOrEqual(3);
    expect(candidates.some((p) => p.includes("zig-out"))).toBe(true);
  });

  test("loadNative returns null or loaded handle without throwing", () => {
    const result = loadNative();
    if (result !== null) {
      expect(typeof result.path).toBe("string");
      expect(result.lib.symbols.native_sdk_app_create).toBeFunction();
    } else {
      expect(result).toBeNull();
    }
  });
});
