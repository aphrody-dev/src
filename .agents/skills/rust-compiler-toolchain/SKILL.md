---
name: rust-compiler-toolchain
description: Rust compiler and toolchain reference grounded in rust-lang/rust and aphrody-labs/rust: pinned Chromium-157 nightly, LLVM 24 cross-language LTO, lld, and windows-rs.
---

# Rust Compiler and Toolchain

Fork: `aphrody-labs/rust` (parent: `rust-lang/rust`, default branch: `main`, registered in `third_party/forks.txt`).
Latest upstream release: `1.100.0` (2026-11-12).

## Pinned Toolchain in `C:\src`

Defined in `C:\src\rust-toolchain.toml`:

```toml
[toolchain]
channel = "chromium-157"
components = ["rustfmt", "clippy", "rust-src"]
profile = "minimal"
```

- `chromium-157` links `rustc 1.100.0-nightly (1edd55dcf 2026-09-09)` against LLVM 24.0.0, matching Chromium's `clang` and `lld` (`third_party/toolchain-157.toml`).
- Installed and linked via `bun scripts/toolchain.ts install`.

## Cross-Language Linker-Plugin LTO

When linking Rust `staticlib` crates with C/C++ compiled by `clang` on the shared LLVM toolchain, pass `-C linker-plugin-lto` and align LTO modes:

| Compiler | Thin LTO | Fat LTO |
| :--- | :--- | :--- |
| `rustc` | `-C lto=thin` | `-C lto=fat` |
| `clang` / `clang++` | `-flto=thin` | `-flto=full` |

Example linking a Clang thin-LTO static library into a Rust binary via `lld`:

```bash
clang ./clib.c -flto=thin -c -o ./clib.o -O2
ar crus ./libxyz.a ./clib.o
RUSTFLAGS="-Clinker-plugin-lto -Clinker=clang -Clink-arg=-fuse-ld=lld" cargo build --release
```

Note on `-C lto`: omitting `-C lto` performs thin local LTO on the local crate unless `codegen-units=1` or `opt-level=0` is set.

## Windows Native Stack

- Use `windows` (`0.62.2` on crates.io) and `windows-bindgen` for Win32/NT APIs.
- If `just install-ay` fails with `rustc` exit `0xfffffffe` under `sccache`, retry with `RUSTC_WRAPPER=""`.
