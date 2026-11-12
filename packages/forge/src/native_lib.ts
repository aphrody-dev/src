// Locates the monorepo's C-ABI library built from crates/ffi (`aphrody_ffi`).
import { suffix } from "bun:ffi";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** `aphrody_ffi.dll`, `libaphrody_ffi.so` or `libaphrody_ffi.dylib`. */
export const APHRODY_FFI_FILE = `${process.platform === "win32" ? "" : "lib"}aphrody_ffi.${suffix}`;

/** Search order: $AY_FFI_LIB, ~/.local/bin, then the root workspace target dirs. */
export function aphrodyFfiCandidates(): string[] {
  const root = process.env.SRC_ROOT || join(import.meta.dir, "..", "..", "..");
  const targetDir = process.env.CARGO_TARGET_DIR || join(root, "target");
  return [
    process.env.AY_FFI_LIB,
    join(homedir(), ".local", "bin", APHRODY_FFI_FILE),
    join(targetDir, "release", APHRODY_FFI_FILE),
    join(targetDir, "debug", APHRODY_FFI_FILE),
  ].filter((p): p is string => Boolean(p));
}

/** First candidate that exists on disk, or null. */
export function findAphrodyFfi(): string | null {
  return aphrodyFfiCandidates().find((p) => existsSync(p)) ?? null;
}
