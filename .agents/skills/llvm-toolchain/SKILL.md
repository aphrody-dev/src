---
name: llvm-toolchain
description: Toolchain LLVM partagée (clang/lld/rustc) dans src. C ABI natif (crates/core-capi, cdylib) construit avec la toolchain LLVM partagée pour la LTO inter-langages (docs/llvm/UNIFIED-TOOLCHAIN.md). Utiliser avant d'écrire ou modifier du code llvm-toolchain dans C:\src.
---

# Toolchain LLVM partagée (clang/lld/rustc) dans src

C ABI natif (crates/core-capi, cdylib) construit avec la toolchain LLVM partagée pour la LTO inter-langages (docs/llvm/UNIFIED-TOOLCHAIN.md).

Sources :
- [NV] https://llvm.org/docs/ (LLVM 24.0.0git)
- [V] https://llvm.org/docs/LinkTimeOptimization.html
- clone local : third_party/llvm-project (0 fichiers indexés)

Code testé qui l'utilise (1, généré par `bun packages/core/src/cli.ts gen`) :
- `crates/core/build.rs` — tests : `crates/core/tests/registry.rs`

Scripts :
- `bun packages/core/src/cli.ts index C:/src --all` : réindexe (sqlite var/index/core.db + JSON).
- `bun packages/core/src/cli.ts users cc::Build` : liste les fichiers qui l'importent/l'appellent.
- `bun test packages/core` : round-trip bun:ffi <-> core-capi.
