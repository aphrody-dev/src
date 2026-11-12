Gemini said

Score: 7 / 20 — Useful initial inventory, but invalidated as a reference specification by direct self-contradictions (append-only edits), broken toolchain claims (CLANGDWARF, spirv64 Vulkan, "in-tree" conflation), and a flawed verification methodology (Triple.h enum presence treated as target support).

Criterion	Score	Verdict
Factual accuracy (LLVM, triples, linkers)	2 / 6	Multiple wrong triples, linker pipelines, and repo boundaries
Internal consistency	1 / 4	Footer directly contradicts body (sparse vs full checkout, Metal/WGSL status)
Architectural & verification rigor	2 / 5	Triple.h lexical check conflated with working toolchain; zero build/link verification
Completeness & operational readiness	2 / 5	No support tiers, sysroots/CRTs, API/OS versions, or non-LLVM commit pins
1. Factual Errors

EDK2 CLANGDWARF vs lld-link PE/COFF (OS & Firmware tables):

Claim: UEFI | x86_64-unknown-uefi ... | edk2 CLANGDWARF and edk2 (CLANGDWARF, PE via lld-link).

Fact: CLANGDWARF compiles to ELF + DWARF using -target x86_64-pc-linux-gnu (or aarch64/riscv64 ELF) + ld.lld, then converts ELF → PE/COFF via EDK2 GenFw. Direct PE/COFF linking via lld-link is EDK2 CLANGPDB (or standalone -target x86_64-unknown-uefi, which emits COFF + PDB, not DWARF-in-ELF). Furthermore, riscv64 UEFI in EDK2 relies on the ELF CLANGDWARF + GenFw path, not riscv64-unknown-uefi COFF.

Vulkan SPIR-V triple (spirv64-unknown-vulkan):

Claim: backend LLVM SPIRV [V] (spirv64-unknown-vulkan, OS Vulkan [V]).

Fact: spirv64 is physical 64-bit addressing (OpenCL/compute kernels: spirv64-unknown-unknown or spirv64-amd-amdhsa). Vulkan shaders in Clang/LLVM require logical SPIR-V (ArchType::spirv, not spirv64) plus a Vulkan version and shader stage environment, e.g. spirv1.6-unknown-vulkan1.3-compute or spirv-unknown-vulkan1.3-pixel.

Experimental vs default LLVM targets (Header & GPU table):

Claim: Lists all 25 directories under llvm/lib/Target/* flatly as "Backends présents".

Fact: -DLLVM_TARGETS_TO_BUILD=all (LLVM_ALL_TARGETS) excludes ARC, CSKY, DirectX, M68k, and Xtensa. Those 5 require -DLLVM_EXPERIMENTAL_TARGETS_TO_BUILD=... in CMake. Treating DirectX like X86 or AMDGPU breaks default CMake builds.

Misleading "in-tree" labels (GPU & Firmware tables):

Claim: Marks SPIRV-LLVM-Translator, SPIRV-Tools, SPIRV-Headers, and triton (MLIR) in rows labeled Statut: in-tree; lists circt without repo boundary.

Fact: None of SPIRV-LLVM-Translator, SPIRV-Tools, SPIRV-Headers, openai/triton, or llvm/circt live inside llvm-project. Meanwhile, LLVM's in-tree SPIRV backend already handles OpenCL C directly without Khronos's out-of-tree SPIRV-LLVM-Translator. Distinguish in-tree (llvm-project) from vendored (third_party/*) and external.

Deprecated WebAssembly WASI triple & missing linker (CPU table):

Claim: wasm32-unknown-unknown|wasi|emscripten.

Fact: wasm32-wasi (OS::WASI) is deprecated upstream in Clang/LLVM, wasi-sdk, and Rust in favor of wasm32-wasip1 and wasm32-wasip2. WebAssembly also links via wasm-ld, not ld.lld.

Incomplete x86-64-v4 definition (CPU table):

Claim: -v4 AVX512VL (X86TargetParser.cpp l.468-470 [V]).

Fact: psABI x86-64-v4 mandates the full 5-extension Skylake-X baseline (AVX512F + AVX512BW + AVX512CD + AVX512DQ + AVX512VL), not AVX512VL alone. Hardcoding source line numbers (l.468-470) rots on every LLVM commit bump.

D3D12 DXIL retail usability (GPU table):

Claim: dxil-pc-shadermodel6.x-* ; clang HLSL | in-tree, expérimental upstream.

Fact: Retail D3D12 runtimes reject unsigned DXIL blobs unless validated and signed by Microsoft's proprietary dxil.dll (dxcompiler/DXC pipeline), unless Windows Developer Mode is forced. Upstream Clang HLSL remains incomplete compared to DirectXShaderCompiler (DXC).

2. Design & Methodological Flaws

Severe append-rot contradiction: ## Non présents (clone sparse) states clang, mlir, compiler-rt, libc, libcxx, etc. are absent from disk, then ## Metal / WGSL (ajout 2026-11-12) immediately below declares llvm-project switched to a full checkout with all of them present. Similarly, ## GPU marks Metal/WGSL translators as hors ecosystem / hors LLVM, whereas the appended section reveals third_party/wgpu (Naga) and third_party/dawn (Tint) are vendored locally.

The Triple.h [V] verification fallacy: Triple.h is an orthogonal string parser (Arch × Vendor × OS × Env), not a support matrix—it will happily parse avr-apple-macosx or riscv64-pc-windows-msvc. Marking BSD | *-unknown-freebsd|netbsd|openbsd | X86/AArch64/RISCV [V] as verified when nothing has been compiled or linked (Rien n'est compilé sur le PC) conflates enum existence with codegen, linker, and sysroot support.

Broken taxonomy (## CPU vs ## OS): WebAssembly (wasm32/wasm64) is a virtual ISA placed under hardware CPUs, with OS/runtime triples (wasip1, emscripten) stuffed into CPU notes and omitted from ## OS / wasm-ld toolchains.

Ambiguous scope of "Rien n'est compilé sur le PC": Unclear whether the repo forbids local compilation by policy, lacks host build artifacts at audit time, or lacks cross-sysroots.

3. Missing Items

Support Tiers (Tier 1 / 2 / 3 / Reference): x86_64-pc-windows-msvc and s390x / OpenBSD riscv64 / CIRCT have identical visual weight with zero CI/build/test expectations.

Sysroots, SDKs, and Runtimes per OS:

Windows -msvc: Requires Windows SDK + MSVC CRT/UCRT headers & libs (Visual Studio or xwin), omitted while Apple SDK and Android NDK are noted.

Windows -gnu & arm64ec: Missing x86_64/aarch64-w64-windows-gnu (LLVM-MinGW UCRT, cross-compilable without proprietary MSVC libs) and arm64ec-pc-windows-msvc.

Linux / BSD: Missing C library (glibc version floor vs musl vs llvm-libc), builtins (compiler-rt), unwinder (libunwind), and C++ runtime (libc++/libc++abi).

CUDA & AMDGPU: CUDA requires CUDA Toolkit headers + libdevice.10.bc alongside ptxas; AMDGPU compute requires ROCm device-libs (ocml/ockl) and explicit -mcpu=gfx* targets; AMDGPU Vulkan graphics (amdgcn-amd-amdpal / Mesa RADV ACO) is unaddressed.

Mandatory version suffixes in triples:

Android: Requires API level (aarch64-linux-android29, plus x86_64-linux-android29 for emulators); bare aarch64-linux-android defaults to legacy Bionic API levels.

macOS: Requires deployment target (arm64-apple-macosx14.0.0) and -fuse-ld=lld to invoke ld64.lld instead of Xcode ld; x86_64-apple-macosx should be marked legacy/deprecated.

Missing Kernel & Bare-Metal Firmware Targets:

eBPF: BPF backend is present in LLVM (bpfel-unknown-none / bpfeb-unknown-none + BTF), critical for Linux networking/observability, completely absent from tables.

32-bit x86 (i686-unknown-none-elf) & IASL for coreboot: coreboot x86 bootblock/romstage runs in 32-bit (i386-elf) even on x86_64 boards and strictly requires ACPICA iasl.

Bare-metal MCU/SoC: thumbv7em-none-eabihf (ARM backend) and riscv32imac-unknown-none-elf (RISCV backend) are absent from ## Firmware / matériel.

Version & Commit Pins for All third_party/* Repos: Only llvm-project @ 392dfff9 is pinned (without stating the LLVM major version, e.g. 21.x/22.x). edk2, coreboot, mesa, wgpu, dawn, circt, triton, and SPIRV-* lack paths and SHAs.

4. Concrete Fixes

Delete ## Non présents (clone sparse) and ## Metal / WGSL (ajout 2026-11-12); merge full-checkout state and third_party/{wgpu,dawn} directly into the header and ## GPU table.

Split verification markers into [P] (parser/source present in third_party), [B] (toolchain built), and [T] (target cross-compiled & smoke-tested). Replace [V] with [P] until a target actually links a binary.

Separate LLVM_ALL_TARGETS from LLVM_EXPERIMENTAL_TARGETS_TO_BUILD in the header and add an explicit third_party/* commit table.

Fix UEFI, SPIR-V, WASI, Android, macOS, and Windows rows using the corrected drop-in replacement below:

Markdown
# Matrice de cibles (OS / Runtime / CPU / GPU / Firmware)

Statut au 2026-11-12 (aucun binaire cible encore compilé — audit statique uniquement) :
- `[P]` = code source / parser présent dans `third_party` (non compilé)
- `[B]` = toolchain hôte compilée
- `[T]` = binaire cible compilé, lié et testé

## Dépôts `third_party` audités

| Dépôt | Chemin | Révision | Périmètre |
|---|---|---|---|
| llvm-project (checkout complet) | `third_party/llvm-project` | `392dfff9` (LLVM XX.x) | `clang`, `lld`, `lldb`, `mlir`, `flang`, `compiler-rt`, `libc`, `libcxx`, `bolt`, `polly`, `openmp`, `offload` |
| wgpu (Naga) | `third_party/wgpu` | `<SHA>` | Traduction SPIR-V / WGSL / MSL / HLSL |
| Dawn (Tint) | `third_party/dawn` | `<SHA>` | Traduction SPIR-V ↔ WGSL / MSL / HLSL |
| edk2 / coreboot / mesa | `third_party/{edk2,coreboot,mesa}` | `<SHA>` | Firmware UEFI/x86 & référence compilateurs GPU |

Backends `llvm/lib/Target/*` `[P]` :
- **Défaut (`LLVM_ALL_TARGETS`) :** AArch64, AMDGPU, ARM, AVR, BPF, Hexagon, Lanai, LoongArch, MSP430, Mips, NVPTX, PowerPC, RISCV, SPIRV, Sparc, SystemZ, VE, WebAssembly, X86, XCore.
- **Expérimentaux (`LLVM_EXPERIMENTAL_TARGETS_TO_BUILD`) :** ARC, CSKY, DirectX, M68k, Xtensa.

## OS & Runtimes

| Tier | Cible | Triple canonique | Backend | Linker & Prérequis Sysroot / Runtime |
|---|---|---|---|---|
| T1 | Windows x64 (MSVC) | `x86_64-pc-windows-msvc` | X86 `[P]` | `clang-cl` + `lld-link` ; Windows SDK + UCRT/MSVC libs (`xwin` ou VS) |
| T1 | Windows arm64 / arm64ec | `aarch64/arm64ec-pc-windows-msvc` | AArch64 `[P]` | `clang-cl` + `lld-link` ; Windows SDK + UCRT/MSVC libs |
| T2 | Windows x64/arm64 (GNU) | `x86_64/aarch64-w64-windows-gnu` | X86/AArch64 `[P]` | `clang` + `ld.lld` ; sysroot `mingw-w64` UCRT + `compiler-rt` |
| T1 | Linux | `x86_64/aarch64/riscv64-unknown-linux-gnu\|musl` | X86/AArch64/RISCV `[P]` | `clang` + `ld.lld` ; sysroot glibc/musl + `compiler-rt` + `libunwind` |
| T1 | macOS | `arm64-apple-macosx14.0.0` (`x86_64` legacy) | AArch64/X86 `[P]` | `clang -fuse-ld=lld` (`ld64.lld`) ; SDK Apple requis |
| T1 | Android | `aarch64/x86_64-linux-android29+` | AArch64/X86 `[P]` | `clang` + `ld.lld` ; sysroot Android NDK (API explicite obligatoire) |
| T1 | WASI / WebAssembly | `wasm32-wasip1`, `wasm32-wasip2`, `wasm32/64-unknown-unknown` | WebAssembly `[P]` | `clang` + `wasm-ld` ; `wasi-sdk` sysroot (ou `emscripten` pour `-unknown-emscripten`) |
| T2 | ChromiumOS | `x86_64/aarch64-cros-linux-gnu` | X86/AArch64 `[P]` | `clang` + `ld.lld` (OS `Linux` dans `Triple.h`) ; sysroot CrOS |
| T2 | FreeBSD | `x86_64/aarch64/riscv64-unknown-freebsd` | X86/AArch64/RISCV `[P]` | `clang` + `ld.lld` ; sysroot FreeBSD |
| T3 | OpenBSD / NetBSD | `x86_64/aarch64-unknown-openbsd\|netbsd` | X86/AArch64 `[P]` | `clang` + `ld.lld` ; sysroot dédié |
| T2 | Linux eBPF | `bpfel/bpfeb-unknown-none` | BPF `[P]` | `clang -g` (BTF) + `llvm-objcopy` / `ld.lld` |
| T2 | UEFI (PE natif) | `x86_64/aarch64-unknown-uefi` | X86/AArch64 `[P]` | `clang-cl`/`clang` + `lld-link` (PE/COFF direct, profil edk2 `CLANGPDB`) |
| T2 | UEFI (ELF → PE) | `x86_64/aarch64/riscv64-unknown-linux-gnu` (freestanding) | X86/AArch64/RISCV `[P]` | edk2 `CLANGDWARF` : `clang` + `ld.lld` (ELF+DWARF) puis conversion PE via `GenFw` |

## CPU (ISAs)

| Tier | Architecture | Backend LLVM | Baselines & Notes |
|---|---|---|---|
| T1 | x86-64 (`v1`..`v4`) | X86 `[P]` | `v1` (SSE2), `v2` (SSE4.2+POPCNT+CX16), `v3` (AVX2+BMI1/2+FMA+F16C), `v4` (AVX512F/BW/CD/DQ/VL) |
| T1 | aarch64 | AArch64 `[P]` | Armv8.0-A baseline (`armv8.2-a`+ / Apple M1+ selon OS) |
| T2 | riscv64 / riscv32 | RISCV `[P]` | `rva22u64` / `rva23u64` (Linux), `rv32imac` (bare-metal) |
| T1 | wasm32 / wasm64 | WebAssembly `[P]` | `simd128`, `bulk-memory`, `memory64` (`wasm64`) |
| T3 | loongarch64, ppc64le, s390x | LoongArch/PowerPC/SystemZ `[P]` | Serveurs secondaires |
| T3 | i686 / thumbv7em | X86/ARM `[P]` | Requis uniquement pour bootstages `coreboot` (x86 32-bit) et MCUs |

## GPU & Shaders

| Tier | Cible | Pipeline de compilation | Emplacement & Contraintes |
|---|---|---|---|
| T1 | Vulkan SPIR-V | `clang` HLSL/CL → backend `SPIRV` (`spirv1.6-unknown-vulkan1.3-<stage>`) | `llvm-project` `[P]` ; validation via `SPIRV-Tools` (externe/vendored) |
| T2 | OpenCL / Kernel SPIR-V | Backend `SPIRV` (`spirv64-unknown-unknown`) ou `SPIRV-LLVM-Translator` | `SPIRV` in-tree `[P]` ; Translator externe (Khronos) |
| T1 | WGSL / WebGPU | SPIR-V / WGSL ↔ WGSL / MSL / HLSL via Naga ou Tint | Vendored : `third_party/wgpu` (Naga) & `third_party/dawn` (Tint) ; analyse `tree-sitter-wgsl` |
| T1 | Metal (MSL / AIR) | SPIR-V / WGSL → MSL via Naga / Tint (ou `SPIRV-Cross` externe) ; `.metallib` via `xcrun metal` | Pas de backend AIR dans LLVM public ; SDK Apple requis pour AIR binaire |
| T2 | D3D12 DXIL | Production : DXC (`dxcompiler` + signature `dxil.dll`). Veille : backend LLVM expérimental `DirectX` (`dxil-pc-shadermodel6.x-<stage>`) | `DirectX` dans `llvm-project` (expérimental, non signé) ; `dxil.dll` propriétaire requis en retail |
| T1 | CUDA / PTX | Backend `NVPTX` (`nvptx64-nvidia-cuda`) ; Triton (MLIR) | `NVPTX` in-tree `[P]` ; requiert CUDA headers + `libdevice` + `ptxas` propriétaire (SASS) |
| T1 | AMDGPU (ROCm) | Backend `AMDGPU` (`amdgcn-amd-amdhsa`, `-mcpu=gfx*`) ; Triton (MLIR) | `AMDGPU` in-tree `[P]` ; requiert ROCm `device-libs` (ou `llvm-libc` GPU) |
| Réf | Drivers Mesa | `src/compiler/clc` (OpenCL C → SPIR-V) & `src/compiler/nir` | `third_party/mesa` `[P]` (référence uniquement) |

## Firmware & Matériel

| Tier | Cible | Pipeline & Dépendances critiques |
|---|---|---|
| T2 | UEFI (EDK2) | `third_party/edk2` : `CLANGPDB` (`lld-link` PE direct, x64/arm64) ou `CLANGDWARF` (`ld.lld` ELF + `GenFw`, x64/arm64/riscv64) + `iasl` |
| T3 | coreboot | `third_party/coreboot` : `clang` + `ld.lld` (inclut cibles `i386-elf` pour bootblock/romstage x86) + ACPICA `iasl` |
| T3 | Bare-metal MCU | `clang` + `ld.lld` + `compiler-rt` (`riscv32imac-unknown-none-elf`, `thumbv7em-none-eabihf`) |
| T3 | FPGA / HDL | `circt` (dépôt externe/vendored basé sur MLIR → SystemVerilog) ; grammaires `tree-sitter-{verilog,vhdl,firrtl}` |

