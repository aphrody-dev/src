# bun natif unique : aphrody-labs/bun, build release LTO, non-régression

Date : 2026-11-13. [V] = vu dans la session (commande ou fichier cité), [NV] = non vérifié.

## Sources

| Élément          | Valeur                                                                                                                                                                                                                                    | Source                                                                       |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Canary amont     | `oven-sh/bun` main `9ea3c693a2` (2026-11-13 00:11 UTC, « Bump to 1.4.5 »)                                                                                                                                                                 | `gh api repos/oven-sh/bun/commits/main` [V]                                  |
| Stable           | v1.4.4 (2026-10-22)                                                                                                                                                                                                                       | `gh release list -R oven-sh/bun` [V]                                         |
| Fork consolidé   | `aphrody-labs/bun` main `c7b36732e0` = canary `9ea3c693a2` + 3 patchs (fd du pipe parent child_process, chemins bindgen relatifs Windows, frontmatter doc) ; aucune release ni run CI ; ancien `main` `9dda375835` rebasé en `94e80d17e1` | `CONSOLIDATION.md`, `gh api .../compare` (ahead 3, behind 0) [V]             |
| WebKit/JSC       | prébuilt `oven-sh/WebKit` `b553971ea8` (tarball `-lto` en release)                                                                                                                                                                        | `scripts/build/deps/webkit.ts:6` [V]                                         |
| Toolchain        | LLVM 23.1.1, Rust `nightly-2026-09-15`, CMake 3.30.5, node 26.12.1, bun 1.4.4                                                                                                                                                             | `build/ci-images/linux-aarch64-debian/bootstrap.sh` généré par `spec.ts` [V] |
| uutils coreutils | 0.12.0 (2026-09-17) ; `main` en 0.13.0, MSRV 1.89, MIT ; chaque utilitaire expose `uumain(args) -> UResult<()>`                                                                                                                           | `gh api repos/uutils/coreutils/...` [V]                                      |

## Fork

- Org `bunx-sh` abandonnée sur contre-ordre du propriétaire (formulaire rempli, jamais validé ; aucune org créée).
- Fork de référence : `aphrody-labs/bun`, `main` = `c7b36732e0` (canary + 3 patchs, voir `CONSOLIDATION.md`) + `6194118b68` (CI `native` : `.github/workflows/native.yml`, `.github/native/`). Artefacts : runs `native` et prereleases `native-<date>-<sha>` de ce dépôt.
- Les 26 workflows amont sont désactivés sur le fork (`gh workflow disable`) : seul `native` tourne.
- Consolidation : `CONSOLIDATION.md` (agent d'audit) ; la base est sa `main`, rien de plus n'est rapatrié ici.

## Remplacer JSC/WebKit par coreutils / Rust for Linux : verdict

Non faisable. JavaScriptCore est le moteur qui exécute le JavaScript (parseur, bytecode, JIT, GC) ; coreutils, Rust for Linux et GNU sont des commandes et un noyau, pas des moteurs JS. Mesures dans `oven-sh/bun` `9ea3c693a2` [V] :

- 4 338 fichiers `.rs` et 1 327 `.cpp/.h` sous `src/` ; 411 fichiers Rust manipulent directement `JSValue`/`JSGlobalObject`, 115 dans `src/jsc` (liaisons).
- Le build lie un prébuilt `oven-sh/WebKit` en ThinLTO avec le Rust et le C++ de bun (`scripts/build/config.ts`, profil `release`).

Ce qui est faisable et ce qui existe :

| Piste                                                      | État                                                                                                                                                                                                                                           | Coût / risque                                                                   | Source                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Builtins du Bun Shell                                      | 19 builtins en Rust (`true false pwd exit basename dirname cd echo export cat mv rm which ls mkdir touch cp seq yes`) ; `cat` et `cp` désactivés sur POSIX sauf `BUN_ENABLE_EXPERIMENTAL_SHELL_BUILTINS`                                       | déjà dans le binaire                                                            | `src/runtime/shell/Builtin.rs` [V]                               |
| uutils comme builtins du shell                             | non direct : `uumain` écrit sur le `stdout` du processus (`std::io`) alors que les builtins de bun sont des machines à états asynchrones qui écrivent par `IOWriter` (pipes en mémoire, redirections) ; il faudrait réécrire chaque utilitaire | élevé                                                                           | `Builtin.rs` (`on_io_writer_chunk`), `uu/cat/src/cat.rs:223` [V] |
| uutils en multicall (argv[0] = `ls`, `cp`…, façon busybox) | faisable : un crate du workspace qui appelle `uu_<cmd>::uumain` avant l'initialisation de JSC ; coût de démarrage nul pour `bun` (comparaison d'argv[0]) ; taille +N Mo                                                                        | moyen ; demande `Cargo.lock` régénéré (`--locked` dans `scripts/build/rust.ts`) | [NV] tant que non construit                                      |
| API Linux/POSIX                                            | déjà exposées : `node:fs`, `node:child_process`, `Bun.spawn`, `bun:ffi` (`dlopen` de libc), `rustix` 0.38 dans le workspace                                                                                                                    | nul                                                                             | `Cargo.toml` [V]                                                 |
| Démarrer en PID 1 (QEMU, WSL)                              | binaire musl lié statiquement à libstdc++ ; dépend du chargeur `ld-musl` : voir « Binaires »                                                                                                                                                   | —                                                                               | voir mesures                                                     |

## Build

- Hôte : comme les lanes Buildkite amont (un hôte debian-13 aarch64 qui cross-compile toutes les cibles, `.buildkite/ci.ts` `getBuildAgent`) [V]. Amont : `r8g.4xlarge` (16 vCPU, 128 Go), délai 60 min. Ici : runner GitHub `ubuntu-24.04-arm` + conteneur `debian:13`, `-j4`, `nice -n 19`, swap 24 Go.
- prd écarté : 31 Go dont 9 disponibles, swap 16/16 Go occupé, charge 47 sur 8 cœurs (`free -g`, `uptime`, 2026-11-13 01:32 UTC) [V]. fr1 réservé à Chromium/LLVM. Rien sur le PC.
- `.github/native/host.sh` extrait du `bootstrap.sh` généré les seules étapes d'outillage (paquets, node, bun, ninja, cmake, LLVM, Rust, compiler-rt x64, sysroots glibc/musl/Windows) ; Buildkite, tailscale, docker, prefetch exclus.
- Commande : `node scripts/build.ts --profile=release --os=<os> --arch=x64 [--abi=gnu|musl] -j4` : ThinLTO inter-langages Rust + C++ + WebKit `-lto` (`config.ts:1111-1121`), toutes les fonctionnalités du profil release (TinyCC, SQLite statique…).
- Cibles : `linux-x64-musl`, `linux-x64-gnu`, `windows-x64`.

## Intégration « récursive » de l'écosystème bun de src

RÉSULTATS_INTEGRATION

## Binaires

RÉSULTATS_BINAIRES

## Non-régression

RÉSULTATS_BENCH

## Note pour l'agent LFS

RÉSULTATS_LFS

## Reste à faire

RESTE
