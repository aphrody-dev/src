// bun:ffi binding of crates/dx12-hal (`dx12_hal.dll`, dx12_hal_* symbols, crates/dx12-hal/src/capi.rs).
// Shared GPU layer (L2) of unix-distro.ts and apps/nt (ticket nt-001, replaces native_nt_gpu.dll).
// Contract: resolve dx12_hal_abi_version alone, refuse another version, then bind the rest; every string
// out is JSON owned by the library, copied then released with dx12_hal_free. Windows only: null elsewhere.
import { CString, FFIType, dlopen, type Pointer } from "bun:ffi";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export const DX12_HAL_ABI_VERSION = 1;
export const DX12_HAL_LIB_FILE = "dx12_hal.dll";

export interface Dx12Adapter {
  index: number;
  name: string;
  vendor_id: number;
  device_id: number;
  sub_sys_id: number;
  revision: number;
  dedicated_video_memory: number;
  dedicated_system_memory: number;
  shared_system_memory: number;
  luid: number;
  is_hardware: boolean;
}

export interface Dx12Device {
  adapter: Dx12Adapter;
  feature_level: string;
  raytracing_tier: number;
  mesh_shader_tier: number;
  variable_shading_rate_tier: number;
  sampler_feedback_tier: number;
  wave_ops: boolean;
  wave_lane_count_min: number;
  wave_lane_count_max: number;
}

const symbols = {
  dx12_hal_abi_version: { args: [], returns: FFIType.u32 },
  dx12_hal_free: { args: [FFIType.ptr], returns: FFIType.void },
  dx12_hal_adapters_json: { args: [], returns: FFIType.ptr },
  dx12_hal_device_json: { args: [], returns: FFIType.ptr },
} as const;

type HalLib = ReturnType<typeof dlopen<typeof symbols>>;

/** Monorepo root: $SRC_ROOT, else the first parent of this file or of the cwd holding identity.toml. */
export function srcRoot(): string {
  if (process.env.SRC_ROOT) return process.env.SRC_ROOT;
  for (const start of [import.meta.dir, process.cwd()]) {
    for (let d = start; ; d = dirname(d)) {
      if (existsSync(join(d, "identity.toml"))) return d;
      if (dirname(d) === d) break;
    }
  }
  return join(import.meta.dir, "..", "..", "..");
}

/** Search order: $DX12_HAL_LIB, $CARGO_TARGET_DIR or <root>/target (release, debug, then x86_64-pc-windows-msvc). */
export function dx12HalCandidates(): string[] {
  const target = process.env.CARGO_TARGET_DIR || join(srcRoot(), "target");
  const triple = join(target, "x86_64-pc-windows-msvc");
  return [
    process.env.DX12_HAL_LIB,
    join(target, "release", DX12_HAL_LIB_FILE),
    join(target, "debug", DX12_HAL_LIB_FILE),
    join(triple, "release", DX12_HAL_LIB_FILE),
    join(triple, "debug", DX12_HAL_LIB_FILE),
  ].filter((p): p is string => Boolean(p));
}

let cached: { lib: HalLib; path: string } | null | undefined;

/** Loads the library once; null off Windows, when absent, or ABI-incompatible. */
export function loadDx12Hal(): { lib: HalLib; path: string } | null {
  if (cached !== undefined) return cached;
  cached = null;
  if (process.platform !== "win32") return cached;
  for (const path of dx12HalCandidates()) {
    if (!existsSync(path)) continue;
    try {
      const probe = dlopen(path, { dx12_hal_abi_version: symbols.dx12_hal_abi_version });
      const version = probe.symbols.dx12_hal_abi_version();
      probe.close();
      if (version !== DX12_HAL_ABI_VERSION) continue;
      cached = { lib: dlopen(path, symbols), path };
      break;
    } catch {
      // Wrong arch or missing deps: try the next candidate.
    }
  }
  return cached;
}

export class Dx12HalUnavailableError extends Error {
  constructor() {
    super(`${DX12_HAL_LIB_FILE} not found (Windows only; set DX12_HAL_LIB or build crates/dx12-hal)`);
  }
}

function call<T>(f: (lib: HalLib) => unknown): T {
  const hal = loadDx12Hal();
  if (!hal) throw new Dx12HalUnavailableError();
  const p = f(hal.lib) as Pointer | null;
  if (p === null) throw new Error("dx12_hal_* returned null");
  let text: string;
  try {
    text = new CString(p).toString();
  } finally {
    hal.lib.symbols.dx12_hal_free(p);
  }
  const v = JSON.parse(text) as T | { error: string };
  if (v && typeof v === "object" && "error" in v && typeof v.error === "string") throw new Error(v.error);
  return v as T;
}

/** DXGI adapters in high-performance order. */
export const dx12Adapters = (): Dx12Adapter[] => call((l) => l.symbols.dx12_hal_adapters_json());

/** D3D12 device and DirectX 12 Ultimate tiers of the high-performance adapter. */
export const dx12Device = (): Dx12Device => call((l) => l.symbols.dx12_hal_device_json());
