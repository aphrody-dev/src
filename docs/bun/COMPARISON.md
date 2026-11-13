# bun : stable, canary et fork aphrody-labs/bun

Mesuré le 2026-11-13 03:32 UTC sur Windows_NT 10.0.28120 x64, 13th Gen Intel(R) Core(TM) i7-13700F (24 threads), 32 GiB. Rejouer : `just bun-compare` (ou `bun packages/bun-parity/bin/bpt.ts compare stable=<chemin> canary=<chemin>`).

## Binaires

| binary | version | revision | size (bytes) | sha256 |
|---|---|---|---|---|
| stable | 1.4.4 | 1.4.4+38afee6c8 | 115,281,496 | `cb1d8e6564e655e4` |
| canary | 1.4.5 | 1.4.5-canary.1+9ea3c693a | 163,478,528 | `5ea8e75f7b7a34a5` |

## Révisions et patchs du fork

- stable: `bun-v1.4.4` (2026-10-22), GitHub API `releases/latest`.
- canary: oven-sh/bun main `4a78d39947` (2026-11-13T03:23:06Z), 107 commits after `bun-v1.4.4`.
- fork: aphrody-labs/bun main, 19 commits ahead of oven-sh/bun main and 1 behind.

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

## API et commandes exposées

| binary | `Bun.*` | `node:` modules | globals | CLI commands |
|---|---|---|---|---|
| stable | 112 | 76 | 157 | 24 |
| canary | 112 | 76 | 157 | 26 |

canary against stable, commands: added `compile`, `lint`

## Résultats documentés (bun.com/llms-full.txt)

Source: https://bun.com/llms-full.txt, sha256 `9d0810446ac194bc`, read 2026-11-13.
43 examples with 80 checked results; 95 examples left out (network, server, subprocess, files, npm packages, or no checkable result).

| binary | version | pass | doc and behavior differ | example not self-contained |
|---|---|---|---|---|
| stable | 1.4.4+38afee6c8 | 38 | 3 | 2 |
| canary | 1.4.5-canary.1+9ea3c693a | 39 | 2 | 2 |

| example | documented | stable | canary |
|---|---|---|---|
| [/docs/runtime/binary-data#10](https://bun.com/docs/runtime/binary-data) | `blob.type; // => text/html` | `"text/html;charset=utf-8"` | as documented |
| [/docs/runtime/utils#6](https://bun.com/docs/runtime/utils) | `compressed; // => Uint8Array(30)` | `Uint8Array(32) [ 31, 139, 8, 0, 0, 0, 0, 0, 0, 10, 203, 72, ` | `Uint8Array(32) [ 31, 139, 8, 0, 0, 0, 0, 0, 0, 10, 203, 72, ` |
| [/docs/runtime/utils#8](https://bun.com/docs/runtime/utils) | `compressed; // => Uint8Array(12)` | `Uint8Array(14) [ 203, 72, 205, 201, 201, 207, 24, 37, 242, 7` | `Uint8Array(14) [ 203, 72, 205, 201, 201, 207, 24, 37, 242, 7` |


## Performances

Méthode de `third_party/bun/.github/native/bench.sh` (CI du fork) : mêmes fixtures, hyperfine 10 exécutions après 3 de chauffe, binaires l'un après l'autre sur la même machine. Moyenne ± écart type. Outils : hyperfine 2.0.0, oha 1.16.0. `bun install` sans `--frozen-lockfile=false` (bench.sh) : bun 1.4.4 refuse une valeur à cette option.

| case | stable | canary | note |
|---|---|---|---|
| startup `-e 0` | 21.5 ± 2.3 ms **(best)** | 22.0 ± 2.0 ms | |
| startup `--version` | 7.4 ± 1.6 ms | 6.8 ± 0.5 ms **(best)** | |
| Bun Shell | 113.1 ± 5.6 ms | 107.2 ± 4.9 ms **(best)** | |
| bun:ffi (2M calls) | 39.9 ± 1.5 ms | 39.2 ± 1.2 ms **(best)** | |
| bun test (1000 tests) | 24.8 ± 1.1 ms **(best)** | 27.6 ± 1.4 ms | |
| bun install (warm cache) | 5456.1 ± 373.3 ms | 4980.6 ± 194.9 ms **(best)** | |
| http (Bun.serve, oha -z 10s -c 64) | 54,962 req/s, p99 2.01 ms | 54,792 req/s, p99 1.87 ms | |
## Fork aphrody-labs/bun

Binaire Windows du fork : CI `aphrody windows` (`third_party/bun/.github/workflows/aphrody-windows.yml`, cross-compilation `windows-x64-release` sur ubuntu-24.04, tests de non-régression sur windows-2025), run 43355726130 en cours au moment de cette mesure. Une fois le run vert : `ay bun install --fork` (ou `ay rt install bun@fork --from <bun.exe>`) puis `just bun-compare` ajoute la colonne `fork` à toutes les sections.
