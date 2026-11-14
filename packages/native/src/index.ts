// bun:ffi bindings for the Zig Native SDK C ABI (native/src/embed/c_api.zig).
// Exposes lifecycle, viewport, and GPU frame state entrypoints from `native_sdk_app_*`.

import { dlopen, FFIType, type Pointer, suffix } from "bun:ffi";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const NATIVE_LIB_FILE = `${process.platform === "win32" ? "" : "lib"}native-sdk.${suffix}`;

export const NATIVE_SYMBOLS = {
  native_sdk_app_create: { args: [], returns: FFIType.ptr },
  native_sdk_app_destroy: { args: [FFIType.ptr], returns: FFIType.void },
  native_sdk_app_destroy_with_status: {
    args: [FFIType.ptr],
    returns: FFIType.i32,
  },
  native_sdk_app_start: { args: [FFIType.ptr], returns: FFIType.void },
  native_sdk_app_activate: { args: [FFIType.ptr], returns: FFIType.void },
  native_sdk_app_deactivate: { args: [FFIType.ptr], returns: FFIType.void },
  native_sdk_app_stop: { args: [FFIType.ptr], returns: FFIType.void },
  native_sdk_app_resize: {
    args: [FFIType.ptr, FFIType.f32, FFIType.f32, FFIType.f32, FFIType.ptr],
    returns: FFIType.void,
  },
  native_sdk_app_viewport: {
    args: [
      FFIType.ptr,
      FFIType.f32,
      FFIType.f32,
      FFIType.f32,
      FFIType.ptr,
      FFIType.f32,
      FFIType.f32,
      FFIType.f32,
      FFIType.f32,
      FFIType.f32,
      FFIType.f32,
      FFIType.f32,
      FFIType.f32,
    ],
    returns: FFIType.void,
  },
  native_sdk_app_viewport_state: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  native_sdk_app_gpu_frame_state: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
  native_sdk_app_text_input_state: {
    args: [FFIType.ptr, FFIType.ptr],
    returns: FFIType.i32,
  },
} as const;

export type NativeLib = ReturnType<typeof dlopen<typeof NATIVE_SYMBOLS>>;

/** Search order: $APHRODY_NATIVE_LIB, ~/.local/bin, packages/native/native/zig-out/lib, packages/native/native/zig-out/bin. */
export function nativeLibCandidates(): string[] {
  const pkgRoot = join(import.meta.dir, "..");
  return [
    process.env.APHRODY_NATIVE_LIB,
    join(homedir(), ".local", "bin", NATIVE_LIB_FILE),
    join(pkgRoot, "native", "zig-out", "lib", NATIVE_LIB_FILE),
    join(pkgRoot, "native", "zig-out", "bin", NATIVE_LIB_FILE),
  ].filter((p): p is string => Boolean(p));
}

let cached: { lib: NativeLib; path: string } | null | undefined;

/** Loads the native-sdk shared library once; returns null when absent. */
export function loadNative(): { lib: NativeLib; path: string } | null {
  if (cached !== undefined) return cached;
  cached = null;
  for (const path of nativeLibCandidates()) {
    if (!existsSync(path)) continue;
    try {
      const lib = dlopen(path, NATIVE_SYMBOLS);
      cached = { lib, path };
      break;
    } catch {
      // Try next candidate
    }
  }
  return cached;
}

/** Creates a Native SDK app instance via FFI, or null if the shared library is not loaded. */
export function createApp(): Pointer | null {
  const loaded = loadNative();
  if (!loaded) return null;
  return loaded.lib.symbols.native_sdk_app_create() as Pointer | null;
}

/** Destroys a Native SDK app instance via FFI. */
export function destroyApp(app: Pointer): void {
  const loaded = loadNative();
  if (!loaded) return;
  loaded.lib.symbols.native_sdk_app_destroy(app);
}
