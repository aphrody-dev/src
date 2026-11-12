/**
 * Content hashing for strong ETags.
 * Uses rust_stack_ffi.dll (rs_blake3_hex) through bun:ffi when the library is
 * present; otherwise falls back to SHA-256 from Bun.CryptoHasher.
 * rs_blake3_hex(input_ptr, input_len: usize, out_ptr, out_cap: usize) -> i32
 * (number of hex bytes written, negative on error). usize maps to FFIType.u64.
 */

import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { dlopen, FFIType, ptr } from "bun:ffi";

type HexFn = (bytes: Uint8Array) => string;

export interface HashEngine {
  name: "blake3-ffi" | "sha256";
  tag: string;
  hex: HexFn;
}

function sha256Hex(bytes: Uint8Array): string {
  return new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
}

export function dllCandidates(
  env: Record<string, string | undefined> = process.env,
): string[] {
  return [
    env.RUST_STACK_FFI_DLL,
    join(homedir(), ".local", "bin", "rust_stack_ffi.dll"),
  ].filter((p): p is string => Boolean(p));
}

export function loadFfiBlake3(
  candidates: string[] = dllCandidates(),
): HexFn | null {
  for (const path of candidates) {
    if (!existsSync(path)) continue;
    try {
      const lib = dlopen(path, {
        rs_blake3_hex: {
          args: [FFIType.ptr, FFIType.u64, FFIType.ptr, FFIType.u64],
          returns: FFIType.i32,
        },
      });
      const fn: HexFn = (bytes) => {
        const out = new Uint8Array(128);
        const input = bytes.byteLength ? bytes : new Uint8Array(1);
        const n = lib.symbols.rs_blake3_hex(
          ptr(input),
          BigInt(bytes.byteLength),
          ptr(out),
          BigInt(out.byteLength),
        );
        if (n !== 64) throw new Error(`rs_blake3_hex returned ${n}`);
        return new TextDecoder().decode(out.subarray(0, 64));
      };
      // Self-check against the BLAKE3 test vector for the empty input.
      if (
        fn(new Uint8Array(0)) !==
        "af1349b9f5f9a1a6a0404dea36dcc9499bcb25c9adc112b7cc9a93cae41f3262"
      )
        continue;
      return fn;
    } catch {
      /* DLL unusable: try next candidate, then fall back */
    }
  }
  return null;
}

let engine: HashEngine | undefined;

export function getHashEngine(): HashEngine {
  if (!engine) {
    const ffi = loadFfiBlake3();
    engine = ffi
      ? { name: "blake3-ffi", tag: "b3", hex: ffi }
      : { name: "sha256", tag: "s2", hex: sha256Hex };
  }
  return engine;
}

/** Strong ETag (quoted, no W/ prefix) for a representation of the bytes. */
export function strongEtag(bytes: Uint8Array, variant = ""): string {
  const e = getHashEngine();
  return `"${e.tag}-${e.hex(bytes).slice(0, 32)}${variant ? "-" + variant : ""}"`;
}
