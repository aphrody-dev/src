// omarchy status: kernel config fragment, omarchy probe (crates/unix-omarchy) and the GPU seen by
// the shared D3D12 layer (crates/dx12-hal via ./dx12-hal.ts). The former native_nt_gpu.dll and .NET WinUI
// host of infra/winnt-sdk are gone (ticket nt-001): the WinUI 3 shell is apps/nt.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type Dx12Adapter,
  dx12Adapters,
  loadDx12Hal,
  srcRoot,
} from "./dx12-hal";

export interface DistroHardwareProbe {
  cpu: {
    vendor: string;
    brand: string;
    architecture_level: string;
    cores_physical: number;
    threads_logical: number;
    has_avx2: boolean;
    has_bmi2: boolean;
  };
  gpu: {
    vendor_id: number;
    device_id: number;
    name: string;
    architecture: string;
    compute_capability: string;
    vram_mb: number;
  };
  ram_gb: number;
  ram_technology: string;
}

export interface DistroStatus {
  kernelConfigValid: boolean;
  hardware: DistroHardwareProbe;
  /** DXGI adapters from dx12_hal.dll; null when the library is absent (Linux, no build). */
  dx12Adapters: Dx12Adapter[] | null;
}

const SRC_ROOT = srcRoot();
const TARGET_DIR = process.env.CARGO_TARGET_DIR || join(SRC_ROOT, "target");
export const KERNEL_CONFIG = join(
  SRC_ROOT,
  "third_party",
  "linux",
  "arch",
  "x86",
  "configs",
  "cachyos_sm89_wsl2_baremetal.config",
);

export function verifyLinuxKernelConfig(): {
  valid: boolean;
  options: string[];
} {
  if (!existsSync(KERNEL_CONFIG)) {
    return { valid: false, options: [] };
  }

  const content = readFileSync(KERNEL_CONFIG, "utf-8");
  const required = [
    "CONFIG_RUST=y",
    "CONFIG_SCHED_CLASS_EXT=y",
    "CONFIG_MNATIVE_INTEL=y",
    "CONFIG_NTSYNC=y",
    "CONFIG_SECCOMP=y",
    "CONFIG_DXGKRNL=y",
    "CONFIG_LRU_GEN=y",
    "CONFIG_HZ_1000=y",
    "CONFIG_PREEMPT_FULL=y",
  ];

  const matched = required.filter((opt) => content.includes(opt));
  return {
    valid: matched.length === required.length,
    options: matched,
  };
}

export function probeDistroHardware(): DistroHardwareProbe {
  const exe = process.platform === "win32" ? "omarchy.exe" : "omarchy";
  const res = spawnSync(join(TARGET_DIR, "release", exe), ["probe", "--json"], {
    encoding: "utf-8",
  });
  if (res.status !== 0) {
    throw new Error(
      `Failed to execute omarchy probe: ${res.stderr ?? res.error}`,
    );
  }
  return JSON.parse(res.stdout);
}

export function checkDistroFullStatus(): DistroStatus {
  return {
    kernelConfigValid: verifyLinuxKernelConfig().valid,
    hardware: probeDistroHardware(),
    dx12Adapters: loadDx12Hal() ? dx12Adapters() : null,
  };
}

if (import.meta.main) {
  const status = checkDistroFullStatus();
  console.log(
    `Kernel config fragment: ${status.kernelConfigValid ? "verified" : "invalid"}`,
  );
  console.log(
    `CPU: ${status.hardware.cpu.brand} (${status.hardware.cpu.architecture_level})`,
  );
  console.log(
    `GPU (probe): ${status.hardware.gpu.name} (${status.hardware.gpu.architecture})`,
  );
  for (const a of status.dx12Adapters ?? []) {
    console.log(
      `DXGI adapter ${a.index}: ${a.name} (${Math.round(a.dedicated_video_memory / 2 ** 20)} MB)`,
    );
  }
  if (!status.dx12Adapters) console.log("DXGI adapters: dx12_hal.dll absent");
}
