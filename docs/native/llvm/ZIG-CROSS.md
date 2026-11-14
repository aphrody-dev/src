# Zig Ecosystem & Cross-Compilation (`zig` + `cargo-zigbuild`)

Forks enregistrés dans [`third_party/forks.txt`](../../third_party/forks.txt) :

- `aphrody-labs/zig` (miroir de `https://codeberg.org/ziglang/zig` / `ziglang/zig`)
- `aphrody-labs/cargo-zigbuild` (fork de `rust-cross/cargo-zigbuild`)

## Interface C unifiée (Zig / C / C++ / Rust / Bun)

- [`aphrody_core.h`](../../src/core/capi/include/aphrody_core.h) : ABI Rust `aphrody_core_capi` (`core_*`).
- [`aphrody_zig.h`](../../src/core/capi/include/aphrody_zig.h) : ABI Zig `fx_capi` (`fx_*`) + `native` (`native_sdk_app_*`), consommé par :
  - Rust : [`src/ffi/src/fx.rs`](../../src/ffi/src/fx.rs)
  - Bun (`bun:ffi`) : [`packages/ai-os/src/core/fx-ffi.ts`](../../packages/ai-os/src/core/fx-ffi.ts), [`packages/native/src/index.ts`](../../packages/native/src/index.ts)

## Commandes de build et cross-compilation

```sh
# 1. Coeur Zig fx_capi (Windows/Linux/macOS)
cd packages/ai-os/native/fx && zig build fx-capi -Doptimize=ReleaseFast

# 2. Cross-compilation Rust via cargo-zigbuild (glibc épinglé / Windows / macOS / WASM)
cargo zigbuild --release --target x86_64-unknown-linux-gnu.2.28
cargo zigbuild --release --target aarch64-unknown-linux-gnu.2.28
cargo zigbuild --release --target x86_64-pc-windows-gnu
```
