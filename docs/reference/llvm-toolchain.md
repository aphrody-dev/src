# Toolchain LLVM partagée (clang/lld/rustc) dans src

C ABI natif (crates/core-capi, cdylib) construit avec la toolchain LLVM partagée pour la LTO inter-langages (docs/llvm/UNIFIED-TOOLCHAIN.md).

Sources :
- [NV] https://llvm.org/docs/ (LLVM 24.0.0git)
- [V] https://llvm.org/docs/LinkTimeOptimization.html
- clone local : third_party/llvm-project (0 fichiers indexés)

Code testé qui l'utilise (10, généré par `bun packages/core/src/cli.ts gen`) :
- `crates/ay/src/build.rs` — tests : `crates/ay/src/build.rs`
- `crates/bench/src/hardware.rs` — tests : `crates/bench/tests/integration_tests.rs`
- `crates/bench/src/picker.rs` — tests : `crates/bench/tests/integration_tests.rs`
- `crates/steam-depot/src/install.rs` — tests : `crates/steam-depot/src/install.rs`, `crates/steam-depot/tests/depot_job.rs`, `crates/steam-depot/tests/fixtures.rs`
- `crates/steam-depot/src/proton.rs` — tests : `crates/steam-depot/src/proton.rs`, `crates/steam-depot/tests/depot_job.rs`, `crates/steam-depot/tests/fixtures.rs`
- `packages/ai-os/src/cli.ts` — tests : `packages/ai-os/tests/ai-os.test.ts`, `packages/ai-os/tests/full-design-mode.test.ts`, `packages/ai-os/tests/rosegriffon.test.ts`
- `packages/ai-os/tests/full-design-mode.test.ts` — tests : `packages/ai-os/tests/ai-os.test.ts`, `packages/ai-os/tests/full-design-mode.test.ts`, `packages/ai-os/tests/rosegriffon.test.ts`
- `packages/ai-triad/test/triad.test.ts` — tests : `packages/ai-triad/test/triad.test.ts`
- `packages/bun-parity/dist/chromium-parity-preload.ts` — tests : `packages/bun-parity/test/chromium-parity.test.ts`
- `packages/bun-parity/src/polyfills/index.ts` — tests : `packages/bun-parity/test/chromium-parity.test.ts`

Scripts :
- `bun packages/core/src/cli.ts index C:/src --all` : réindexe (sqlite var/index/core.db + JSON).
- `bun packages/core/src/cli.ts users llvm` : liste les fichiers qui l'importent/l'appellent.
- `bun test packages/core` : round-trip bun:ffi <-> core-capi.
