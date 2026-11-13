# bun : stable, canary et fork aphrody-labs/bun

Mesuré le 2026-11-13 04:15 UTC sur Windows_NT 10.0.28120 x64, 13th Gen Intel(R) Core(TM) i7-13700F (24 threads), 32 GiB. Rejouer : `just bun-compare` (ou `bun packages/bun-parity/bin/bpt.ts compare stable=<chemin> canary=<chemin> fork=<chemin>`).

## Binaires

| binary | version | revision | size (bytes) | sha256 |
|---|---|---|---|---|
| stable | 1.4.4 | 1.4.4+38afee6c8 | 115,281,496 | `cb1d8e6564e655e4` |
| canary | 1.4.5 | 1.4.5-canary.1+9ea3c693a | 163,478,528 | `5ea8e75f7b7a34a5` |
| fork | 1.4.5 | 1.4.5-canary.1+6ecae7902 | 163,351,552 | `8156322f6079d99e` |

## Révisions et patchs du fork

- stable: `bun-v1.4.4` (2026-10-22), GitHub API `releases/latest`.
- canary: oven-sh/bun main `4a78d39947` (2026-11-13T03:23:06Z), 107 commits after `bun-v1.4.4`.
- fork: aphrody-labs/bun main, 22 commits ahead of oven-sh/bun main and 1 behind.

| fork commit | subject |
|---|---|
| `4ebaec4020` | child_process: expose the parent-end pipe fd through stream._handle |
| `3823706d35` | build: pass the .bind.ts schema list to the codegen scripts in a file |
| `ee897d6da3` | ci: native release build (ThinLTO, linux-x64 gnu/musl, windows-x64) and non-regression bench |
| `462a5f4de5` | ci(native): leave the Windows sysroot out of the build host |
| `ded3bbe4a4` | upgrade: unpack the Windows release in-process and check canary downloads against the API digest |
| `2bd37902a6` | completions: print the script for bash, zsh and fish on Windows |
| `6614e0dc5b` | sys(windows): report ENOENT for an empty path instead of acting on the directory it is relative to |
| `8fdb98a6d9` | node:fs: resolve a relative path that normalizes to nothing to the cwd on Windows |
| `41240e86a5` | import.meta.main: compare the main module's key as a URL in every executable |
| `40ad872d3f` | shell: skip a dead bin link for the script words bun, bunx and node (Windows) |
| `14633264b1` | ci(aphrody): cross-compile bun.exe for Windows x64 and run the fork's Windows regression tests |
| `23a5e8fe02` | build: xwin 0.10.0, which reads the current Visual Studio manifest |
| `03b06b5b7c` | docs: sizes Bun.gzipSync and Bun.deflateSync give for the utils examples |
| `b11cd7214b` | ci(native): run on dispatch only |
| `073ec9ab0d` | Cargo.lock: record bun_archive's bun_libdeflate_sys and bun_zlib dependencies |
| `551034319f` | upgrade, completions: Cargo.lock entries for bun_archive's zip dependencies; read $SHELL through zstr! |
| `6ecae7902e` | shell: use bun_core::cast_slice_mut in the dead bin link check (no bytemuck in bun_install) |
| `f723238178` | ci(native): bench musl builds in alpine, glibc ones on the host; bench-only mode |
| `0e3b6f7877` | ci(native): drop the duplicated artifacts_run input |
| `a2467ad460` | ci(native): link gnu with canary's order file, trimmable like ci-build; startup profile in the bench |
| `d87caf24b3` | ci(native): download each target's artifact into its own directory |
| `33cc2dccef` | completions: compare the Windows test output with the script without CRLF |

## API et commandes exposées

| binary | `Bun.*` | `node:` modules | globals | CLI commands |
|---|---|---|---|---|
| stable | 112 | 76 | 157 | 24 |
| canary | 112 | 76 | 157 | 26 |
| fork | 112 | 76 | 157 | 26 |

canary against stable, commands: added `compile`, `lint`

fork against stable, commands: added `compile`, `lint`

## Résultats documentés (bun.com/llms-full.txt)

Source: https://bun.com/llms-full.txt, sha256 `9d0810446ac194bc`, read 2026-11-13.
43 examples with 80 checked results; 95 examples left out (network, server, subprocess, files, npm packages, or no checkable result).

| binary | version | pass | doc and behavior differ | example not self-contained |
|---|---|---|---|---|
| stable | 1.4.4+38afee6c8 | 38 | 3 | 2 |
| canary | 1.4.5-canary.1+9ea3c693a | 39 | 2 | 2 |
| fork | 1.4.5-canary.1+6ecae7902 | 39 | 2 | 2 |

| example | documented | stable | canary | fork |
|---|---|---|---|---|
| [/docs/runtime/binary-data#10](https://bun.com/docs/runtime/binary-data) | `blob.type; // => text/html` | `"text/html;charset=utf-8"` | as documented | as documented |
| [/docs/runtime/utils#6](https://bun.com/docs/runtime/utils) | `compressed; // => Uint8Array(30)` | `Uint8Array(32) [ 31, 139, 8, 0, 0, 0, 0, 0, 0, 10, 203, 72, ` | `Uint8Array(32) [ 31, 139, 8, 0, 0, 0, 0, 0, 0, 10, 203, 72, ` | `Uint8Array(32) [ 31, 139, 8, 0, 0, 0, 0, 0, 0, 10, 203, 72, ` |
| [/docs/runtime/utils#8](https://bun.com/docs/runtime/utils) | `compressed; // => Uint8Array(12)` | `Uint8Array(14) [ 203, 72, 205, 201, 201, 207, 24, 37, 242, 7` | `Uint8Array(14) [ 203, 72, 205, 201, 201, 207, 24, 37, 242, 7` | `Uint8Array(14) [ 203, 72, 205, 201, 201, 207, 24, 37, 242, 7` |


## Performances

Méthode de `third_party/bun/scripts/native-bench.sh` (CI du fork) : mêmes fixtures, hyperfine 10 exécutions après 3 de chauffe, binaires l'un après l'autre sur la même machine. Moyenne ± écart type. Outils : hyperfine 2.0.0, oha 1.16.0. `bun install` sans `--frozen-lockfile=false` (bench.sh) : bun 1.4.4 refuse une valeur à cette option.

| case | stable | canary | fork | note |
|---|---|---|---|---|
| startup `-e 0` | 67.8 ± 50.1 ms | 51.8 ± 24.3 ms **(best)** | 121.1 ± 184.5 ms | |
| startup `--version` | 16.0 ± 3.9 ms | 19.5 ± 6.1 ms | 16.0 ± 1.9 ms **(best)** | |
| Bun Shell | 373.8 ± 338.2 ms | 135.2 ± 10.5 ms **(best)** | 138.3 ± 16.6 ms | |
| bun:ffi (2M calls) | 43.2 ± 1.2 ms | 44.1 ± 7.9 ms | 43.0 ± 2.0 ms **(best)** | |
| bun test (1000 tests) | 27.7 ± 2.6 ms | 27.1 ± 3.0 ms **(best)** | 30.2 ± 2.5 ms | |
| bun install (warm cache) | 5702.1 ± 324.0 ms | 5514.6 ± 125.1 ms **(best)** | 5732.2 ± 328.5 ms | |
| http (Bun.serve, oha -z 10s -c 64) | 85,954 req/s, p99 1.09 ms | 89,914 req/s, p99 1.07 ms | 87,774 req/s, p99 1.12 ms | |
