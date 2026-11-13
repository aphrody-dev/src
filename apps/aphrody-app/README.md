# Aphrody App (`aphrody.app`)

Pure-Rust (Edition 2024, zero TypeScript) multi-target desktop & web application combining WebGPU/WGSL Mica rendering, Wayland wire-protocol & tiling layouts, Fluid-style total-order CRDT state (`SharedMap`, `SharedString`, `SharedCounter`), Blake3 content-addressed OPFS/WAL storage, and W3C WebMCP (`navigator.modelContext` + HTTP JSON-RPC `/mcp`).

## Workspace Crates

- `crates/aphrody-core`: Pure-Rust Wayland wire framing, tiling layouts (`dwindle`, `cosmic_grid`, `niri_scroll`, `floating`), Fluid-style sequenced operations, Blake3 WAL/VFS block store, and WebMCP JSON-RPC 2.0 registry.
- `crates/aphrody-wasm`: `wasm32-unknown-unknown` client mounting WebGPU (`mica.wgsl`), OPFS persistence, and `navigator.modelContext` WebMCP tools.
- `crates/aphrody-host`: Native CLI, ANSI TUI (`aphrody-app tui`), COOP/COEP HTTP + SSE Fluid sequencer + `/mcp` server (`aphrody-app serve`), static bundle builder (`aphrody-app build-dist`), and benchmark suite (`aphrody-app bench`).
- `crates/aphrody-android`: Android NDK `cdylib` (`aarch64-linux-android` / `x86_64-linux-android`) exposing C-ABI/JNI entrypoints over `aphrody-core`.

## Build & Verification

```bash
cargo test --workspace
cargo build --release -p aphrody-host
aphrody-app build-dist --root . --out ./dist
wck ./dist
```

## Multi-OS Packaging

- **Cloudflare Workers**: `wrangler.toml`; the built shell is served at https://shell.aphrody.app (Worker `aphrody-app-site`, R2 `aphrody-dist/sites/aphrody.app`). The apex https://aphrody.app is the deployment platform (`packages/deploy`).
- **Windows 11**: `aphrody-app.exe` (`x86_64-pc-windows-msvc`)
- **Arch / CachyOS**: `packaging/arch/PKGBUILD`
- **NixOS**: `packaging/nix/default.nix`
- **Alpine (musl)**: `packaging/alpine/APKBUILD`
- **Wayland Session**: `packaging/wayland/aphrody-app.desktop`
- **Android Native**: `cargo build -p aphrody-android --target aarch64-linux-android --release`
