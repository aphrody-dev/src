# Central System Core (`src/`): Linux 7.4-rc2, LLVM, Freedesktop, Wine, NT & WebAssembly

Canonical Layer-0 specification for [src](file:///C:/src/src) (`aysys.dll` / `aysys.wasm` / `ay-wasm-inspect.wasm` / `wayland.wasm`). Every upper layer (`crates/*` via `extern "C"`, `packages/*` via `bun:ffi`, and `apps/aphrody` via WebAssembly + WebGPU) binds to this single pure C (`-std=gnu11`) + Assembler tree.

## 1. Subsystem Layout & Canonical C Prefixes

Multi-million-LoC operating systems, compilers, and compatibility layers partition by **subsystem**, preserving upstream C namespaces so patches apply cleanly (`git am` / `quilt`):

| Directory                       | Upstream Pillar                                    | C Prefix / Types                                                 | Key Files                                                                                                                                                                                        |
| :------------------------------ | :------------------------------------------------- | :--------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/include/uapi/ay/`          | Linux UAPI + WebAssembly 3.0                       | `__u8..__u64`, `__s8..__s64`, `__usize`                          | [types.h](file:///C:/src/src/include/uapi/ay/types.h), [errno.h](file:///C:/src/src/include/uapi/ay/errno.h), [wasm.h](file:///C:/src/src/include/uapi/ay/wasm.h)                                |
| `src/include/ay/`               | Master Public C ABI                                | `AY_API`, `AY_WASM`                                              | [sys.h](file:///C:/src/src/include/ay/sys.h)                                                                                                                                                     |
| `src/arch/x86/` & `src/kernel/` | `torvalds/linux` `7.4-rc2`                         | `ay_*` (`ay_rdtsc`, `ay_fnv1a64`, `ay_cpu_probe`, `ay_syscall6`) | [entry_64.S](file:///C:/src/src/arch/x86/entry_64.S), [sys.c](file:///C:/src/src/kernel/sys.c)                                                                                                   |
| `src/drivers/gpu/drm/`          | Linux DRM/KMS + Mesa `26.3.0`                      | `drm_*`, `mesa_*`, `DRM_FORMAT_*`, `EGL_PLATFORM_*`              | [drm.h](file:///C:/src/src/include/uapi/ay/drm.h), [drm_mesa.c](file:///C:/src/src/drivers/gpu/drm/drm_mesa.c)                                                                                   |
| `src/wayland/`                  | Wayland `1.26.0`, XCB `1.17.0`, XWayland `26.0.99` | `wl_*`, `xcb_*`, `xwm_*`                                         | [wayland.h](file:///C:/src/src/include/uapi/ay/wayland.h), [wire.c](file:///C:/src/src/wayland/wire.c), [xwm.c](file:///C:/src/src/wayland/xwm.c), [tiler.c](file:///C:/src/src/wayland/tiler.c) |
| `src/nt/` & `src/wine/`         | ReactOS / NT Executive & Wine                      | `nt_*`, `NTSTATUS`, `STATUS_*`, `wine_*`                         | [ntstatus.h](file:///C:/src/src/include/uapi/ay/ntstatus.h), [status.c](file:///C:/src/src/nt/status.c), [server_proto.c](file:///C:/src/src/wine/server_proto.c)                                |
| `src/wasm/`                     | WebAssembly 3.0 + WASI-SDK `34.0`                  | `wasm_*`, `WASM_SEC_*`, `WASI_*`                                 | [module.c](file:///C:/src/src/wasm/module.c), [wasi_cli.c](file:///C:/src/src/wasm/wasi_cli.c), [compositor.c](file:///C:/src/src/wasm/compositor.c)                                             |

## 2. Compiler & Style Invariants

Enforced by [Makefile](file:///C:/src/src/Makefile) and [.clang-format](file:///C:/src/src/.clang-format):

- **Dialect**: `-std=gnu11 -O3 -funsigned-char -fno-common -fno-strict-aliasing -fintegrated-as -Wall -Wextra -Werror`.
- **Torvalds Style**: 8-col hard tabs, K&R braces, negative `-errno` return codes, zero C++ RTTI/exceptions, zero hidden allocations.
- **WebAssembly Cohort Flags**: `-msimd128 -mbulk-memory -mmultivalue -mnontrapping-fptoint -msign-ext` linked with `wasm-ld --lto-O3`, post-optimized by Binaryen `wasm-opt -O4`, and verified by WABT `wasm-validate --enable-all`.

## 3. Verified Artifact Footprint (2026-11-14)

| Target                 | Toolchain                                                                   |                          Size | Verification                                                                           |
| :--------------------- | :-------------------------------------------------------------------------- | ----------------------------: | :------------------------------------------------------------------------------------- |
| `aysys.dll`            | `clang 23.1.5` + `lld-link` ThinLTO (`x86_64-pc-windows-msvc`, `-nostdlib`) | `7,680 B` (`4,672 B` `.text`) | `llvm-size` + `bun:ffi` ([sys.test.ts](file:///C:/src/packages/core/test/sys.test.ts)) |
| `aysys.wasm`           | `clang` (`wasm32-unknown-unknown`, `v128` SIMD128) + `wasm-opt -O4`         |    `6,786 B` (`29` functions) | `wasm-validate` + `wasm-objdump` + `WebAssembly.instantiate`                           |
| `ay-wasm-inspect.wasm` | `wasi-sdk 34.0` (`clang 23.1.0-rc3`, `wasm32-wasip1`) + `wasm-opt -O3`      |                    `34,135 B` | `wasm-validate` + `wasm_inspect_module`                                                |
| `wayland.wasm`         | `clang` (`wasm32-unknown-unknown`, SIMD128) + `wasm-opt -O4`                |                    `10,210 B` | `wasm-validate` + [wayland.wasm](file:///C:/src/apps/aphrody/public/wayland.wasm)      |
