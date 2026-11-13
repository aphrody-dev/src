# Matrice de cibles (OS / CPU / GPU / firmware)

[V] = vérifié le 2026-11-12 dans `third_party/llvm-project` @ 392dfff9 (`llvm/lib/Target/*`, `llvm/include/llvm/TargetParser/Triple.h`, `llvm/lib/TargetParser/X86TargetParser.cpp`). Backends présents (ARC, CSKY, DirectX, M68k, Xtensa = expérimentaux, via `LLVM_EXPERIMENTAL_TARGETS_TO_BUILD`) : AArch64 AMDGPU ARC ARM AVR BPF CSKY DirectX Hexagon Lanai LoongArch M68k MSP430 Mips NVPTX PowerPC RISCV SPIRV Sparc SystemZ VE WebAssembly X86 XCore Xtensa. Rien n'est compilé sur le PC. [V] = présence dans les sources (parser/backend), pas un toolchain testé.

## OS

| Cible         | Triple                                           | Backend                                          | Toolchain                                                                                                                                                                  |
| ------------- | ------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Windows x64   | `x86_64-pc-windows-msvc`                         | X86 [V]                                          | clang-cl + lld-link (llvm-project)                                                                                                                                         |
| Windows arm64 | `aarch64-pc-windows-msvc`                        | AArch64 [V]                                      | clang-cl + lld-link                                                                                                                                                        |
| Linux         | `x86_64/aarch64/riscv64-unknown-linux-gnu\|musl` | X86/AArch64/RISCV [V]                            | clang + ld.lld                                                                                                                                                             |
| macOS         | `arm64-apple-macosx` / `x86_64-apple-macosx`     | AArch64/X86 [V] (OS `MacOSX`)                    | clang + ld64.lld ; SDK Apple requis                                                                                                                                        |
| Android       | `aarch64-linux-android`                          | AArch64 [V] (env `Android`)                      | clang + NDK sysroot                                                                                                                                                        |
| ChromiumOS    | `x86_64/aarch64-cros-linux-gnu`                  | X86/AArch64 [V] (OS = `Linux`, pas d'enum dédié) | toolchain Chromium (clang, lld)                                                                                                                                            |
| BSD           | `*-unknown-freebsd\|netbsd\|openbsd`             | X86/AArch64/RISCV [V]                            | clang + ld.lld                                                                                                                                                             |
| UEFI          | `x86_64-unknown-uefi` (OS `UEFI` [V]), PE/COFF   | X86/AArch64/RISCV                                | edk2 `CLANGDWARF` (ELF + ld.lld puis GenFw → PE) ou `CLANGPDB` (PE/COFF via lld-link) (217 occurrences dans tools_def.template [V]) ; coreboot `buildgcc` option clang [V] |

## CPU

| Cible                       | Fournisseur                   | Notes                                                                                                                                         |
| --------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| x86-64-v1..v4               | X86 [V]                       | `-march=x86-64` (v1), `x86-64-v2` SSE4.2, `-v3` AVX2, `-v4` AVX512F+BW+CD+DQ+VL (X86TargetParser.cpp l.468-470 [V])                           |
| aarch64                     | AArch64 [V]                   | Windows, Linux, macOS, Android                                                                                                                |
| riscv64                     | RISCV [V]                     | `riscv64-unknown-linux-gnu`, RVA22/RVA23 via `-march`                                                                                         |
| wasm32 / wasm64             | WebAssembly [V]               | `wasm32-unknown-unknown`, `wasm32-wasip1`, `wasm32-wasip2`, `wasm32-unknown-emscripten`, `wasm64-unknown-unknown` (memory64) ; link `wasm-ld` |
| loongarch64, ppc64le, s390x | LoongArch/PowerPC/SystemZ [V] | bonus serveurs                                                                                                                                |

## GPU

| API               | Chemin                                                                                                                                                                                          | Statut                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| SPIR-V / Vulkan   | backend LLVM `SPIRV` [V] (Vulkan = SPIR-V logique `spirv1.6-unknown-vulkan1.3-<stage>`, `spirv64` = OpenCL/compute) ; OpenCL : SPIRV-LLVM-Translator ; validation : SPIRV-Tools + SPIRV-Headers | backend in-tree ; Translator/Tools/Headers hors llvm-project |
| D3D12 DXIL        | backend `DirectX` [V], triple `dxil-pc-shadermodel6.x-*` (OS `ShaderModel` [V]) ; clang HLSL                                                                                                    | in-tree, expérimental upstream                               |
| Metal             | aucun backend LLVM public (pas d'enum AIR dans Triple.h [V])                                                                                                                                    | SPIR-V -> MSL (SPIRV-Cross, hors ecosystem) ou xcrun metal   |
| CUDA / PTX        | backend `NVPTX` [V] (`nvptx64-nvidia-cuda`, OS `CUDA` [V]) ; triton (MLIR)                                                                                                                      | in-tree ; ptxas propriétaire pour SASS                       |
| AMDGPU            | backend `AMDGPU` [V] (`amdgcn-amd-amdhsa`, OS `AMDHSA` [V]) ; triton                                                                                                                            | in-tree                                                      |
| WGSL / WebGPU     | pas de backend LLVM ; SPIR-V -> WGSL (Tint/Naga) ; grammaire tree-sitter-wgsl pour l'analyse                                                                                                    | hors LLVM                                                    |
| Référence drivers | mesa : `src/compiler/clc` (libclc/OpenCL C -> SPIR-V) et `src/compiler/nir` [V]                                                                                                                 | référence seulement                                          |

## Firmware / matériel

| Cible           | Chemin                                                                     |
| --------------- | -------------------------------------------------------------------------- |
| UEFI            | edk2 (CLANGDWARF: ELF+GenFw ; CLANGPDB: lld-link)                          |
| BIOS / coreboot | coreboot (clang toolchain via `util/crossgcc/buildgcc`)                    |
| FPGA / HDL      | circt (MLIR -> SystemVerilog) ; grammaires tree-sitter verilog/vhdl/firrtl |

## Non présents (clone sparse)

llvm-project est en sparse checkout (`lld`, `llvm/lib/{LTO,Passes,Support,Target,TargetParser}`) : clang, lldb, mlir, compiler-rt, libc, libcxx, flang, bolt, polly, openmp, offload sont **absents** du disque ; `git sparse-checkout add <dir>` pour les matérialiser. Polygeist écarté (dernier push 2025-06-19, inactif).

## Metal / WGSL (ajout 2026-11-12)

Pas de backend LLVM : LLVM -> SPIR-V, puis SPIRV-Cross (MSL) ou naga (third_party/wgpu, WGSL/MSL) ; Tint via third_party/dawn. llvm-project passé en checkout complet (clang, mlir, flang, libc, libcxx, bolt, polly, openmp, offload, compiler-rt, lldb).
