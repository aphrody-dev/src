import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { KERNEL_CONFIG, checkDistroFullStatus, probeDistroHardware, verifyLinuxKernelConfig } from "./src/unix-distro";

// Host-dependent: kernel fragment (third_party/linux) and the unix-distro release binary must exist.
describe("unix-distro status", () => {
  test.skipIf(!existsSync(KERNEL_CONFIG))("CachyOS kernel config fragment", () => {
    const res = verifyLinuxKernelConfig();
    expect(res.valid).toBe(true);
    expect(res.options.length).toBeGreaterThanOrEqual(9);
  });

  test("hardware probe and DXGI adapters", () => {
    let hw;
    try {
      hw = probeDistroHardware();
    } catch {
      return; // unix-distro not built on this host
    }
    expect(hw.cpu.threads_logical).toBeGreaterThan(0);
    const status = checkDistroFullStatus();
    if (status.dx12Adapters) expect(status.dx12Adapters.length).toBeGreaterThan(0);
  });
});
