# WebAssembly & Emscripten Ecosystem Specification (`docs/native/WEBASSEMBLY-EMSCRIPTEN.md`)

Grounded live via GitHub REST API (`orgs/WebAssembly/repos` = 130 total / 89 active; `orgs/emscripten-core/repos` = 12 total / 9 active) on `2026-11-14`.

## 1. Forked & Registered Repositories (`aphrody-labs` + `third_party/forks.txt`)

All 18 essential repositories from `WebAssembly` and `emscripten-core` are forked under `aphrody-labs/*` and registered in [forks.txt](file:///C:/src/third_party/forks.txt):

| Upstream Repository                     | Fork (`aphrody-labs/*`)                  | Verified Version / HEAD (`2026-11-14`)                                           | Role in `C:\src`                                                                    |
| :-------------------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| `WebAssembly/binaryen`                  | `aphrody-labs/binaryen`                  | `version_133` (`wasm-opt` installed in `~/.local/bin`)                           | Wasm-to-Wasm IR optimizer (`-O4`, SIMD128, bulk-memory, dead-argument elimination)  |
| `WebAssembly/wabt`                      | `aphrody-labs/wabt`                      | `1.0.42` (`wasm-validate`, `wasm-objdump`, `wasm2wat`, `wat2wasm` installed)     | Formal binary validator, disassembler (`v128` SIMD verifier), and WAT assembler     |
| `WebAssembly/wasi-sdk`                  | `aphrody-labs/wasi-sdk`                  | `wasi-sdk-34` (`clang 23.1.0-rc3` + `wasi-sysroot` in `~/.local/share/ay/tools`) | Portable C/C++ -> `wasm32-wasip1` / `wasm32-wasip2` SDK                             |
| `WebAssembly/wasi-libc`                 | `aphrody-labs/wasi-libc`                 | `4ec32c508731` (`wasi-sdk-34`)                                                   | POSIX/libc implementation over WASI syscalls                                        |
| `WebAssembly/WASI`                      | `aphrody-labs/WASI`                      | `v0.3.2`                                                                         | Canonical WASI Preview 2 / 0.3 async WIT interfaces                                 |
| `WebAssembly/spec`                      | `aphrody-labs/spec`                      | `943c5df07e84` (`wg-3.0`)                                                        | WebAssembly 3.0 formal specification & reference testsuite                          |
| `WebAssembly/component-model`           | `aphrody-labs/component-model`           | `dd1fefc0c618`                                                                   | Canonical ABI & WIT component composition spec                                      |
| `WebAssembly/wasi-webgpu`               | `aphrody-labs/wasi-webgpu`               | `6a776bada0b6` (`v0.3.0-rc.2`)                                                   | WASI WebGPU WIT bindings unifying native `wgpu`/Dawn and browser WebGPU             |
| `WebAssembly/wasm-c-api`                | `aphrody-labs/wasm-c-api`                | `main`                                                                           | Standard embedder C API (`wasm.h`) for native hosts                                 |
| `WebAssembly/tool-conventions`          | `aphrody-labs/tool-conventions`          | `25aceba5adba`                                                                   | LLVM C/Wasm ABI (`__linear_memory`, `__indirect_function_table`, `linking` section) |
| `WebAssembly/esm-integration`           | `aphrody-labs/esm-integration`           | `ca15ef3d3fb3`                                                                   | Zero-glue `<script type="module">` WebAssembly ESM imports                          |
| `WebAssembly/js-promise-integration`    | `aphrody-labs/js-promise-integration`    | `5b247b1026d2`                                                                   | JSPI stack-switching async C/POSIX I/O without Asyncify code bloat                  |
| `WebAssembly/shared-everything-threads` | `aphrody-labs/shared-everything-threads` | `de560922268c`                                                                   | Fine-grained shared tables/globals/functions across Wasm worker threads             |
| `WebAssembly/design`                    | `aphrody-labs/design`                    | `main`                                                                           | Architectural rationale & security model                                            |
| `emscripten-core/emscripten`            | `aphrody-labs/emscripten`                | `7.0.0` (`2026-11-06`)                                                           | Full browser POSIX/WebGL/WebGPU/Audio/Pthreads C/C++ compiler                       |
| `emscripten-core/emsdk`                 | `aphrody-labs/emsdk`                     | `708dcbcc9ee2` (`7.0.0`)                                                         | Hermetic Emscripten SDK manager                                                     |
| `emscripten-core/musl`                  | `aphrody-labs/musl`                      | `85e0e3519655` (`v1.2.2`)                                                        | Emscripten-patched `musl` C library                                                 |
| `emscripten-core/posixtestsuite`        | `aphrody-labs/posixtestsuite`            | `85555325079e`                                                                   | Open POSIX conformance suite for Wasm/Emscripten                                    |

## 2. Three-Tier WebAssembly Compilation Strategy

1. **Tier 0 — Freestanding Kernel/Wire Modules (`wasm32-unknown-unknown -nostdlib`)**:
   - Used by [Makefile](file:///C:/src/src/Makefile) (`aysys.wasm`, `wayland.wasm`).
   - Zero libc, zero WASI imports, deterministic linear memory, 6–10 KB binaries, instant `WebAssembly.instantiateStreaming` in browsers, Cloudflare Workers, and Bun.
2. **Tier 1 — Portable Sandboxed System Tools (`wasm32-wasip1` / `wasm32-wasip2` via `wasi-sdk 34.0`)**:
   - Used by [wasi_cli.c](file:///C:/src/src/wasm/wasi_cli.c) (`ay-wasm-inspect.wasm`, 34 KB).
   - Capability-secured filesystem/stdio via `wasi-libc` with zero host OS coupling.
3. **Tier 2 — Full Multimedia, Game Engine & Desktop Porting (`emscripten 7.0.0`)**:
   - Used when porting multi-million-LoC C/C++ engines (FFmpeg, Mesa/WebGPU, SDL3/Wayland clients, Craft/Bevy C plugins) requiring POSIX pthreads (`SharedArrayBuffer` + COOP/COEP), JSPI async I/O, and direct `<canvas>` WebGPU surfaces.
