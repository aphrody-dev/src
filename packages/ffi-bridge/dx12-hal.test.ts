import { describe, expect, test } from "bun:test";
import {
  DX12_HAL_ABI_VERSION,
  dx12Adapters,
  dx12HalCandidates,
  loadDx12Hal,
} from "./src/dx12-hal";

describe("dx12-hal bun:ffi binding", () => {
  test("candidates and ABI version", () => {
    expect(DX12_HAL_ABI_VERSION).toBe(1);
    expect(dx12HalCandidates().every((p) => p.endsWith("dx12_hal.dll"))).toBe(
      true,
    );
  });

  test("absent off Windows or without a build", () => {
    const hal = loadDx12Hal();
    if (process.platform !== "win32") expect(hal).toBeNull();
    if (!hal) expect(() => dx12Adapters()).toThrow("dx12_hal.dll");
    else expect(Array.isArray(dx12Adapters())).toBe(true);
  });
});
