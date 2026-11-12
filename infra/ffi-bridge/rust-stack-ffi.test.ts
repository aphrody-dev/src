import { describe, expect, test } from "bun:test";
import { dlopen, FFIType, ptr } from "bun:ffi";
import { existsSync } from "node:fs";
import { join } from "node:path";

const candidateDlls = [
  process.env.RUST_STACK_FFI_DLL,
  "C:\\src\\crates\\rust-stack\\target\\release\\rust_stack_ffi.dll",
  process.env.CARGO_TARGET_DIR
    ? join(process.env.CARGO_TARGET_DIR, "release", "rust_stack_ffi.dll")
    : undefined,
  "C:\\Users\\aphro\\.local\\bin\\rust_stack_ffi.dll",
].filter((p): p is string => Boolean(p));

const dllPath =
  candidateDlls.find((p) => existsSync(p)) ??
  "C:\\Users\\aphro\\.local\\bin\\rust_stack_ffi.dll";

const lib = dlopen(dllPath, {
  rs_abi_version: {
    args: [],
    returns: FFIType.u32,
  },
  rs_blake3_hex: {
    args: [FFIType.ptr, FFIType.usize, FFIType.ptr, FFIType.usize],
    returns: FFIType.i32,
  },
  rs_auth_issue_jwt: {
    args: [
      FFIType.ptr,
      FFIType.usize,
      FFIType.ptr,
      FFIType.usize,
      FFIType.u64,
      FFIType.ptr,
      FFIType.usize,
    ],
    returns: FFIType.i32,
  },
  rs_auth_verify_jwt: {
    args: [FFIType.ptr, FFIType.usize, FFIType.ptr, FFIType.usize],
    returns: FFIType.i32,
  },
  rs_ui_render_card: {
    args: [
      FFIType.ptr,
      FFIType.usize,
      FFIType.ptr,
      FFIType.usize,
      FFIType.ptr,
      FFIType.usize,
    ],
    returns: FFIType.i32,
  },
});

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe("rust_stack_ffi.dll zero-copy C-ABI interop", () => {
  test("rs_abi_version returns 1", () => {
    expect(lib.symbols.rs_abi_version()).toBe(1);
  });

  test("rs_blake3_hex computes exact 64-byte digest at sub-microsecond latency", () => {
    const input = encoder.encode("sovereign-rust-stack-2024");
    const out = new Uint8Array(128);

    const written = lib.symbols.rs_blake3_hex(
      ptr(input),
      input.byteLength,
      ptr(out),
      out.byteLength,
    );
    expect(written).toBe(64);
    const hexStr = decoder.decode(out.subarray(0, written));
    expect(hexStr).toMatch(/^[0-9a-f]{64}$/);

    const iterations = 50_000;
    const t0 = Bun.nanoseconds();
    for (let i = 0; i < iterations; i++) {
      lib.symbols.rs_blake3_hex(ptr(input), input.byteLength, ptr(out), out.byteLength);
    }
    const elapsedNs = Bun.nanoseconds() - t0;
    const nsPerCall = elapsedNs / iterations;
    console.log(
      `[bun:ffi] rs_blake3_hex: ${nsPerCall.toFixed(1)} ns/call (${((1e9 / nsPerCall) | 0).toLocaleString()} ops/sec)`,
    );
    expect(nsPerCall).toBeLessThan(1000);
  });

  test("rs_auth_issue_jwt and rs_auth_verify_jwt roundtrip", () => {
    const subject = encoder.encode("usr_sovereign_01");
    const secret = encoder.encode("super-secret-32-byte-hmac-key-01");
    const wrongSecret = encoder.encode("wrong-secret-32-byte-hmac-key-99");
    const out = new Uint8Array(512);

    const jwtLen = lib.symbols.rs_auth_issue_jwt(
      ptr(subject),
      subject.byteLength,
      ptr(secret),
      secret.byteLength,
      3600n,
      ptr(out),
      out.byteLength,
    );
    expect(jwtLen).toBeGreaterThan(40);

    const tokenSlice = out.subarray(0, jwtLen);
    const ok = lib.symbols.rs_auth_verify_jwt(
      ptr(tokenSlice),
      tokenSlice.byteLength,
      ptr(secret),
      secret.byteLength,
    );
    expect(ok).toBe(1);

    const rejected = lib.symbols.rs_auth_verify_jwt(
      ptr(tokenSlice),
      tokenSlice.byteLength,
      ptr(wrongSecret),
      wrongSecret.byteLength,
    );
    expect(rejected).toBe(0);
  });

  test("rs_ui_render_card renders escaped HTML SSR card", () => {
    const title = encoder.encode("Zero-Copy FFI Card");
    const body = encoder.encode("Rendered from Rust <cdylib> into Bun");
    const out = new Uint8Array(1024);

    const len = lib.symbols.rs_ui_render_card(
      ptr(title),
      title.byteLength,
      ptr(body),
      body.byteLength,
      ptr(out),
      out.byteLength,
    );
    expect(len).toBeGreaterThan(30);
    const html = decoder.decode(out.subarray(0, len));
    expect(html).toContain('class="rs-card"');
    expect(html).toContain("Zero-Copy FFI Card");
    expect(html).toContain("&lt;cdylib&gt;");
  });
});
