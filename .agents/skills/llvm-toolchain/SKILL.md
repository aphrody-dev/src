---
name: llvm-toolchain
description: Shared LLVM toolchain (clang, lld, wasm-ld, wasi-sdk, binaryen, rustc on the same LLVM) for the C/ASM/Wasm core in src/ and the C ABI in src/core/capi. Use before writing or changing code that is compiled with it.
---

# Shared LLVM and WebAssembly toolchain

- Design and per-language table (clang, rustc, lld, LTO flags): `docs/native/llvm/UNIFIED-TOOLCHAIN.md`; native specs: `docs/native/README.md`.
- Pins: `third_party/toolchain-157.toml` (clang and rustc built on one LLVM revision, Chromium's `update.py` / `update_rust.py` revisions) and `third_party/chrome-channels.toml`. Read the version from these files or from `clang --version` / `rustc -vV`, never from prose.
- C and Wasm core: `make -C src` (`src/Makefile`: `clang` for native, the wasi-sdk clang from `~/.local/share/ay/tools/` for Wasm via `WASI_CC`, `wasm-opt` and `wasm-validate` for post-processing). Validate with `wasm-validate --enable-all <file>.wasm`.
- Installed on the PC: `C:\Program Files\LLVM\bin` (clang, lld-link, wasm-ld), `~/.local/bin` (`wasm-opt`, `wasm-validate`). Heavy builds (Chromium, LLVM) run on fr1, see skill `fleet`.
- C ABI consumers: `src/core/capi` (Rust side), `packages/core/src/ffi.ts` (Bun side); round trip: `bun test packages/core`. The cc build script is `src/core/build.rs` (test: `src/core/tests/registry.rs`).
- Find users of a symbol: `bun packages/core/src/cli.ts users <name>`; reindex first with `bun packages/core/src/cli.ts index <root> --all`.
- Upstream sources: `third_party/llvm-project` (docs at https://llvm.org/docs/).
