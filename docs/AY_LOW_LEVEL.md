# ay at the lowest level: one LTO/AOT Rust binary for every CPU, GPU, OS, wasm and micro-VM

Goal (owner, 2026-11-12): `ay` is the lowest-level CLI possible, built only from pure Rust, LTO and
AOT, running on every CPU, GPU and OS, in wasm, micro-VMs and containers. Survey of recently pushed
rust-lang, Microsoft and VM/wasm repos on 2026-11-12 (`gh search`, pushed after 2026-10-20).

## Today

| Item | State |
|---|---|
| Release profile | fat LTO, 1 codegen unit, `panic = "abort"`, stripped (root Cargo.toml) |
| Toolchain | nightly (rustup), `nightly-2026-09-15` pinned by third_party/bun |
| `ay build --list` | windows-msvc, wasm32, android-arm64 ready; linux-musl and linux-musl-arm64 missing a musl C compiler |
| Release | dist 0.34 + axoupdater (5 targets: windows x64, linux musl x64/arm64, macOS x64/arm64) |

## Building blocks

| Layer | Rust project (pushed this month) | Use in ay |
|---|---|---|
| Compiler backends | rust-lang/rust (LLVM), rustc_codegen_cranelift, rustc_codegen_gcc | LLVM for release; Cranelift for fast dev builds; GCC backend for targets LLVM lacks |
| std and builtins | `-Zbuild-std`, compiler-builtins, stdarch, portable-simd | size-optimized std, per-CPU SIMD with runtime dispatch |
| Cross C toolchain | zig via cargo-zigbuild (in tools.toml), cc-rs | fixes the missing musl and macOS linkers; one `ay build` path for C crates |
| OS interface | bytecodealliance/rustix, windows-rs / windows-sys 0.61, libc | rustix instead of libc on Linux; one windows-sys version |
| libc-free Linux | origin, c-ward (evaluate) | static `ay` without musl for `FROM scratch` and micro-VMs |
| GPU | wgpu 30 (workspace), Rust-GPU/rust-gpu (shaders in Rust, SPIR-V), cudarc | compute in `ay` for graph, hashing and AI kernels; CUDA only where wgpu cannot |
| Wasm | wasmtime, wasm-tools, wit-bindgen, WASI-Virt, wasmer, javy, componentize-py | `ay` as a wasm32-wasip2 component; run components; JS and Python to wasm |
| Micro-VMs and sandboxes | hyperlight, hyperlight-wasm, hyperlight-unikraft, hyperlight-sandbox, cargo-hyperlight, firecracker, cloud-hypervisor, rust-vmm, openvmm, litebox, mxc | `ay sandbox`: run untrusted hooks, builds and AI tools in hyperlight or firecracker; litebox as the library-OS layer |
| Containers | youki, bollard, rust-lang/docker-rust | `FROM scratch` image with static `ay`; OCI runtime in Rust |
| Windows low level | windows-drivers-rs, edit, sudo, coreutils (Microsoft) | drivers in Rust, coreutils for Windows, `ay` TUI patterns |
| Kernel-level isolation | litebox, openvmm (OpenHCL), mshv | research tier, next to Asterinas (RUST_STACK.md) |
| Async I/O | Azure/kimojio-rs (io_uring, thread per core) | evaluate for the `ay` server paths on Linux |
| Tooling | cargo, rustup, miri, crater, rustc-perf, measureme | miri on unsafe crates; rustc-perf style benches in `ay bench` |

## Target tiers

| Tier | Targets | Gate |
|---|---|---|
| 1 | x86_64-pc-windows-msvc, x86_64/aarch64-unknown-linux-musl, x86_64/aarch64-apple-darwin | full test suite in CI, released by dist |
| 2 | aarch64-pc-windows-msvc, riscv64gc-unknown-linux-musl, aarch64-linux-android, x86_64-unknown-freebsd | build plus `ay --version` and routing tests under qemu-user |
| 3 | wasm32-wasip2 (component), wasm32-unknown-unknown (browser), hyperlight guest, x86_64-unknown-uefi | build plus smoke run in wasmtime, a browser, hyperlight, QEMU OVMF |

CPU baseline: x86-64-v2 and armv8.0 for portability, with `is_x86_feature_detected!` and
`std::arch` dispatch for AVX2/AVX-512/NEON/SVE paths. PGO and BOLT (cargo-pgo) on tier 1 releases.

## Phases

1. Done for musl: `ay build` falls back to cargo-zigbuild when no musl gcc is found (static x86_64 musl `ay` built on Windows runs on fr1). Next: macOS and riscv64;
   add the tier 2 targets to `ay build --list`.
2. Features split `ay` into a core with no C dependencies (rustix, ureq on rustls with ring, pure-Rust
   xz and zstd) and optional C-backed parts (tree-sitter grammars), so wasm32-wasip2 and libc-free
   builds compile the core.
3. `ay sandbox` on hyperlight (Windows and Linux) and firecracker (Linux): hooks, builds and AI tools
   run isolated.
4. GPU compute in `ay` through wgpu and rust-gpu shaders, with CUDA through cudarc as an option.
5. Static `FROM scratch` image published with each release; micro-VM image for hyperlight-unikraft.
