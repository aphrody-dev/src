---
name: rust-stack-sovereign
description: "Build, serve, and bind the 100% Pure-Rust Sovereign Stack (src/rust-stack): Better-Auth (Argon2id, OAuth2.1 PKCE, Ed25519 JWKS), shadcn_rs zero-JS SSR/Dioxus/GPUI components, native Open-WebUI, Rust coding agent, OpenAI Gateway (:4320), and the rust_stack_ffi C ABI."
---

# Pure-Rust Sovereign Stack & `rust_stack_ffi.dll`

Activate this skill when working on authentication, zero-JS SSR UI components (`shadcn_rs`), high-throughput LLM gateway caching (`:4320`), or Bun <-> Rust C-ABI FFI (`rust_stack_ffi`, the cdylib of `src/rust-stack`).

## Execution & Verification

1. **Launch Unified Rust Server (`:4320`)**:
   ```powershell
   rust-stack serve
   ```
2. **Run Cargo & Bun FFI Verification**:
   ```powershell
   cargo test --manifest-path src/rust-stack/Cargo.toml
   bun test packages/ffi-bridge/rust-stack-ffi.test.ts
   ```
3. **`bun:ffi` binding contract**:
   Always pass `FFIType.u64` (with `BigInt(byteLength)`) for Rust `usize` parameters so `bun check` and 64-bit Windows MS-x64 ABI match cleanly.

## Progressive Disclosure Reference

- Full C-ABI symbol signatures (`rs_blake3_hex`, `rs_auth_issue_jwt`, `rs_auth_verify_jwt`, `rs_ui_render_card`) and crate module layout: see [`references/ffi-and-modules.md`](./references/ffi-and-modules.md).
