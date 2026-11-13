# bun : AOT, LTO, FFI (novembre 2026)

Date : 2026-11-12. Source principale : `oven-sh/bun` main `ccb3611f2a` (2026-11-12), lu dans `C:\src\third_party\bun` (branche `upstream/main`). [V] = lu dans la session, [NV] = non vérifié. Aligné sur `docs/llvm/UNIFIED-TOOLCHAIN.md` et `docs/llvm/C-ABI-2026.md`.

## Versions

| Élément                        | Valeur                                                                                    | Source                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Dernière release               | v1.4.4 (2026-10-22) ; 1.4.0 le 2026-08-20                                                 | `gh release list -R oven-sh/bun` [V]                  |
| `bun compile` / `--aot`        | mergé le 2026-10-27 (#45631), **après** 1.4.4 : canary seulement                          | PR #45631 mergedAt [V]                                |
| Langage de bun                 | Rust (4 379 fichiers `.rs`, zéro `.zig` suivi) + C++ (JSC/WebKit)                         | `git ls-files` [V]                                    |
| Rust                           | `nightly-2026-09-15`                                                                      | `rust-toolchain.toml` [V]                             |
| LLVM / clang                   | 23.1.1 (plage 23.1.x imposée) ; passage 21.1.8 → 23.1.1 dans #42851 (2026-09-16)          | `scripts/build/ci-images/spec.ts`, `tools.ts:380` [V] |
| Même LLVM majeur clang ↔ rustc | obligatoire (#44091, 2026-09-26)                                                          | `scripts/build/config.ts:1153` [V]                    |
| CMake                          | 3.30.5 (seulement pour les deps) ; le build de bun passe par `scripts/build/*.ts` + ninja | `spec.ts`, `scripts/build/` [V]                       |
| bun de bootstrap               | 1.4.4                                                                                     | `spec.ts` [V]                                         |
| Node-API                       | `NAPI_VERSION 10`                                                                         | `src/runtime/napi/js_native_api_types.h` [V]          |

## AOT et exécutables

| Mode                                          | Contenu                                                              | JIT     | Cross-compile                                                 | Statut                     | Source                                           |
| --------------------------------------------- | -------------------------------------------------------------------- | ------- | ------------------------------------------------------------- | -------------------------- | ------------------------------------------------ |
| `bun build --compile`                         | JS bundlé + runtime                                                  | oui     | oui, `--target=bun-{linux,windows,darwin}-{x64,arm64}[-musl]` | stable                     | `docs/compiler/index.mdx`, `executables.mdx` [V] |
| `--compile --bytecode`                        | bytecode JSC embarqué ; ESM exige `--compile` ; `--bytecode-depth=N` | oui     | oui                                                           | stable                     | `docs/compiler/bytecode.mdx` [V]                 |
| `--bytecode-order` / `BUN_BYTECODE_ORDER_OUT` | ordre du bytecode pour le démarrage                                  | oui     | —                                                             | depuis #43811 (2026-09-24) | log git [V]                                      |
| `bun compile` (= `build --compile --aot`)     | code machine, typecheck tsc, plus de JIT, `--trim`, `--explain`      | **non** | **non** (plateforme hôte seulement)                           | expérimental               | `docs/compiler/aot.mdx`, `index.mdx` [V]         |
| `--disallow-code-generation-from-strings`     | `eval`/`new Function` lèvent une erreur                              | —       | —                                                             | #44819                     | `executables.mdx:439` [V]                        |
| `--hardened=on` (build de bun)                | stack protector, `_FORTIFY_SOURCE`, clash protection                 | —       | —                                                             | #46317                     | log git [V]                                      |

Limites de l'AOT (PR #45631, 2026-10-27) [V] :

- Linux ≥ 6.7 : `prctl(PR_SET_MDWE)` interdit toute nouvelle mémoire exécutable. `dlopen()`, appels `bun:ffi` et jusqu'à 256 `JSCallback` ouverts fonctionnent. `cc()` (TinyCC) et les addons qui génèrent du code machine **ne fonctionnent pas**.
- Addons N-API embarquables (`require("./addon.node")`, dossier avec lib voisine via `--aot`) (`executables.mdx:920`) [V].
- Pas de breakpoints. Builds plus longs, sans cache.
- Support Windows de `bun compile` : aucune mention dans la doc ni dans la PR [NV].
- Mesures publiées : Linux x64 seulement, sur un build LTO (PR #45631) [V].

## Build de bun : LTO et PGO

| Point                       | Détail                                                                                                                              | Source                    |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| ThinLTO cross-language      | bun + JSC + Rust dans un seul link, activé par défaut en release (pas avec assertions ni ASAN), `--lto=off` pour relinker plus vite | `config.ts:1111-1121` [V] |
| JSC en LTO                  | tarball WebKit `-lto` prébuilté, même LLVM sur les deux dépôts                                                                      | `config.ts:1114-1118` [V] |
| `rustLto` / `codegen-units` | réglables, chaque crate devient N modules ThinLTO                                                                                   | `config.ts:265-271` [V]   |
| IR PGO                      | `pgoGenerate`/`pgoUse` (C++ et Rust : `-Cprofile-generate/-use`), `scripts/build-pgo.ts` ; **pas sous Windows**                     | `rust.ts:513-533` [V]     |
| Orderfile                   | trace des workloads d'une app compilée, symbol hints (#43784)                                                                       | log git [V]               |
| Crates Rust                 | une arête ninja par crate (#41854)                                                                                                  | log git [V]               |
| Windows                     | lld-link, sysroot `winsysroot.ts`, images CI Azure (#47779)                                                                         | `scripts/build/` [V]      |

## FFI et Node-API

| API                                                            | État                                                                                                                                                                                                            | Source                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `bun:ffi` (`dlopen`, `linkSymbols`, `CFunction`, `JSCallback`) | **expérimental, bugs connus, pas en prod** ; implémenté nativement dans JSC (DFG/FTL → appels natifs directs)                                                                                                   | `docs/runtime/ffi.mdx:6-52` [V] |
| `cc()`                                                         | TinyCC embarqué, appels sérialisés entre threads (#43808) ; `--no-ffi-cc` ou `--no-addons` le coupent (`ERR_FFI_CC_DISABLED`)                                                                                   | `c-compiler.mdx`, log git [V]   |
| `napi_env`/`napi_value` en FFI                                 | seulement dans `cc()`                                                                                                                                                                                           | `ffi.mdx:152-180` [V]           |
| `JSCallback({threadsafe:true})`                                | expérimental, appelable depuis n'importe quel thread ; valeur de retour non spécifiée (traiter comme `void`)                                                                                                    | `ffi.mdx:340-350` [V]           |
| Finaliseurs `toArrayBuffer`                                    | peuvent tourner sur le thread GC, pas d'appel JS                                                                                                                                                                | `ffi.mdx:467` [V]               |
| Node-API                                                       | réimplémenté par bun, version 10 ; correctifs récents : finaliseurs de buffers externes sur le thread JS (#43757), refus d'appels JS pendant le teardown (#42797), `bun test` ne détruit plus les envs (#42746) | log git [V]                     |
| Sécurité mémoire                                               | 125 blocs `unsafe` retirés (N-API, bun:ffi…) (#47944)                                                                                                                                                           | log git [V]                     |
| Couverture N-API en %                                          | pas de chiffre publié trouvé                                                                                                                                                                                    | [NV]                            |

## Recommandations (depot-capi)

1. **Prod : `depot-capi` → addon Node-API mince** (napi ≤ 10, ABI stable, embarquable dans `bun build --compile` et `bun compile`). Conforme à C-ABI-2026 règle 8.
2. **Dev / outils internes : `bun:ffi` `dlopen`** sur la même `depot-capi.dll/.so`, mêmes en-têtes cbindgen. Pas de `cc()` : cassé sous AOT+MDWE et non stable.
3. Pas de `JSCallback` threadsafe dans les chemins critiques. Côté C, passer par une file + poll depuis JS, ou par `napi_threadsafe_function` dans l'addon.
4. Distribution : `bun build --compile --bytecode --minify --sourcemap`, cross-compilé depuis prd (`--target=bun-windows-x64`, `bun-linux-x64-musl`). `bun compile` (AOT) uniquement en essai, build natif par plateforme sur prd et Windows, et pas avant une release stable (canary aujourd'hui).
5. Toolchain unifiée : épingler **LLVM 23.1.x** et un nightly Rust dont le LLVM est 23 (bun impose l'égalité des majeurs). Ça rejoint la cible ThinLTO cross-language de UNIFIED-TOOLCHAIN. Vérifier le LLVM de Chromium avant d'aligner [NV].
6. Pas de PGO bun sous Windows (non supporté upstream). Sous Linux, ThinLTO + PGO + orderfile via `scripts/build-pgo.ts`, sur prd avec `nice -n 19`.
7. Mettre à jour `UNIFIED-TOOLCHAIN.md` ligne bun : « LLVM exigé [NV] » devient 23.1.1 (spec.ts), et bun n'est plus en Zig.
