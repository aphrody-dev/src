# Cross-compilation Windows depuis Linux (2026-11-13)

Image `ghcr.io/aphrody-labs/base-cross-windows` (`infra/linux/cross-windows/Dockerfile`, CI `linux-images.yml`).

| Cible | Chaîne | Origine |
|---|---|---|
| `x86_64-w64-windows-gnu`, `aarch64-w64-windows-gnu` | llvm-mingw : clang, lld, en-têtes et CRT mingw-w64, libc++ | release `mstorsjo/llvm-mingw` 20261104 (LLVM 23.1.5), sha256 vérifié (digest de l'API GitHub) |
| `x86_64-pc-windows-msvc` | clang-cl + lld-link + llvm-lib, `msvc.cmake` | clang/lld/llvm d'Arch dans l'image ; CRT MSVC et SDK Windows posés à l'exécution par `xwin --accept-license splat --output /xwin` (xwin 0.10.0, même version que `tools.toml`) |

Forks : `aphrody-labs/mingw-w64` (`third_party/mingw-w64`), `aphrody-labs/llvm-mingw`, `aphrody-labs/reactos` et `aphrody-labs/LiberNT` (nt), tous existants.

Licences : les fichiers Microsoft (CRT, SDK) ne sont jamais intégrés à une image publiée ; mingw-w64 (ZPL 2.1, parties domaine public, BSD ou LGPL marquées : `COPYING`, `COPYING.MinGW-w64-runtime`) et llvm-mingw (scripts ISC, `LICENSE.txt` ; LLVM Apache-2.0 avec exception LLVM) sont redistribuables, avec leurs fichiers de licence (présents dans l'archive).

Écart avec la toolchain partagée (`docs/llvm/UNIFIED-TOOLCHAIN.md`) : Chromium 157 est sur LLVM 24, llvm-mingw 20261104 sur LLVM 23.1.5. Pour un LTO inter-langages avec les objets Chromium, la cible MSVC se construit sur fr1 avec le clang-cl et le lld-link de l'usine (`/srv/chromium/src/third_party/llvm-build/Release+Asserts/bin`, qui n'a pas `llvm-rc`) ; la cible GNU attend une llvm-mingw reconstruite sur ce LLVM (`build-mingw-w64.sh` et compagnie dans le fork), à faire en CI.

ReactOS et LiberNT : la direction clang-cl est celle de `UNIFIED-TOOLCHAIN.md` §2 ; leurs builds restent du ressort de nt.
