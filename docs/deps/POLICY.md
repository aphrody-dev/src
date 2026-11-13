# Approvisionnement et dépendances : politique (2026-11-13)

Une version par composant, un canal par composant, un lock par écosystème, tout vérifié par
`ay doctor --deps` et mis à jour par `ay lock --deps --bump`. Modèles : Chromium (DEPS + gclient,
`third_party/` à plat, binaires CIPD épinglés par hash) et intelligent-terminal
(`third_party/intelligent-terminal` @ 5a4876d, 2026-11-13 : `vcpkg.json` avec `builtin-baseline` et
`overrides`, ports et triplets dans `dep/vcpkg-overlay-*`, sources tierces dans `oss/<nom>/` avec un
`cgmanifest.json` par composant, poste décrit en `.config/configuration.winget`).

Études d'origine : `docs/packaging/PACKAGE-MANAGERS.md`, `docs/packaging/RECOMMENDATION.md`,
`docs/llvm/UNIFIED-TOOLCHAIN.md`, `docs/compat/TARGETS.md`, `docs/INSTALL_UPDATE.md`. Ce document
les tranche. Seul écart : les images `distroless/*-debian13` citées dans `RECOMMENDATION.md` sont
écartées, car src n'utilise jamais Debian ni Ubuntu.

## 1. Règles

1. **Un canal par composant** (tableau §2). Ordre de préférence :
   1. le manifeste du projet (`Cargo.toml`, `package.json`, `pyproject.toml`, `go.mod`) avec son lock ;
   2. la release officielle précompilée, épinglée dans `tools.toml` avec sha256 ou signature, installée par `ay up` dans `~/.local/bin` ;
   3. un fork `aphrody-labs` épinglé par commit (`src.lock.json` puis DEPS), seulement quand il porte un patch ou une optimisation ;
   4. le gestionnaire système, en dernier recours : winget sous Windows ; dans les conteneurs, apk (Alpine), pacman (Arch) ou nix.
   Jamais apt, snap ni image Debian/Ubuntu. flatpak/Flathub sert uniquement aux applications de bureau Linux, hors chaîne de build.
   Exception bornée (2026-11-13, demande du propriétaire) : Debian et Ubuntu sont des **cibles de sortie** de `ay pkg` (`infra/pkg`, `docs/linux/OWNERSHIP.md`) ; leurs conteneurs épinglés par digest servent seulement à construire et tester nos `.deb` en CI, et l'image `base-debian` à ce test. Aucun outil de src n'en dépend, apt reste interdit sur le PC.
2. **Un lock par écosystème, à la racine** : `Cargo.lock`, `bun.lock`, `uv.lock`, `infra/go.sum` et `src.lock.json` (dépôts git). DEPS, `.repo/manifests/default.xml` et MAINTAINERS en sont générés par `ay lock`. Un sous-module `apps/*` garde le lock de son propre dépôt.
3. **Une version par paquet.**
   - Rust : chaque dépendance crates.io est déclarée une seule fois dans `[workspace.dependencies]` ; les membres écrivent `{ workspace = true }` et peuvent seulement ajouter des `features` ou `optional`.
   - bun : toute dépendance externe passe par `"catalog:"` (catalogue racine, versions exactes).
   - Python : un seul workspace uv, déclaré dans le `pyproject.toml` racine.
4. **Les exigences suivent semver, le lock donne l'exactitude.** Côté Rust, une exigence caret (`"1.0.104"`), sauf deux cas où l'épinglage exact `=` est gardé : une préversion, ou une ligne précédée de `# Pinned:` avec sa raison. La CI construit avec `--locked` et installe avec `bun install --frozen-lockfile` et `uv sync --locked`.
5. **Chaîne d'approvisionnement.**
   - `deny.toml` (cargo-deny) n'autorise que crates.io et les forks git listés dans `allow-git`.
   - Pas de script `preinstall`/`postinstall`, pas de registre tiers, pas de version flottante (`latest`, `*`).
   - Les binaires précompilés sont vérifiés par sha256 ou par signature. Aucun outil n’est en `source = "ubi"` : sha256 par plateforme dans `tools.toml`.
6. **Toolchain Rust épinglée** : `rust-toolchain.toml` contient une nightly datée (`nightly-YYYY-MM-DD`). La date correspond au commit rustc de `src.lock.json`. Le correspondant se vérifie dans `static.rust-lang.org/dist/<date>/channel-rust-nightly-git-commit-hash.txt`.
7. **node vers bun.** Aucun script ne lance node, npx, npm, pnpm, yarn, tsc, prettier, eslint, jest, vitest ou esbuild : bun les remplace (`bun test`, `bun fmt`, `bun check`, `bun build`, `bun x`). Un amont Node que l'on absorbe devient un fork `aphrody-labs` porté sur bun (lock `bun.lock`, scripts bun). C'est déjà fait pour openclaw : migration pnpm vers bun.
8. **third_party à la Chromium.**
   - Un amont = un dossier `third_party/<nom>`, épinglé par commit dans `src.lock.json` et DEPS, et non versionné dans src.
   - Le clone est partiel (`--filter=blob:none`), éventuellement sparse ; `ay git slim --all` le compacte (commit-graph, multi-pack-index, repack).
   - Les patchs vivent dans les forks, jamais dans une copie vendorisée.
   - La mise à jour passe par `ay lock`, puis par le commit de `src.lock.json` et de DEPS.
9. **FFI, IR, ABI.** Une seule ABI C au centre (`crates/core-capi`, `crates/ffi`, `infra/cshared`, `bun:ffi`). Une seule LLVM : clang, lld et rustc sur la même version majeure. La LTO inter-langages passe par `-Clinker-plugin-lto` (`docs/llvm/UNIFIED-TOOLCHAIN.md`).
   - Les bibliothèques C/C++ tierces viennent de vcpkg en mode manifeste. Chaque `vcpkg.json` déclare `builtin-baseline` et `overrides`, sur le fork `aphrody-labs/vcpkg` et le triplet LLVM chaîné : les sorties sont du bitcode LLVM, mesuré sur fr2 le 2026-11-12.
   - Les gros amonts (Chromium, LLVM, noyau, WebKit) restent des unités `third_party/` construites par leur propre système, sur fr1.

## 2. Composants

| Composant | Canal retenu | Raison |
|---|---|---|
| rustc, cargo, clippy, rustfmt | rustup + `rust-toolchain.toml` (nightly datée) | même LLVM que clang ; reproductible par date ; `cargo-features` exigent nightly |
| crates Rust | `Cargo.toml` `[workspace.dependencies]` + `Cargo.lock` + cargo-deny | une version par crate, lock unique, licences et sources contrôlées |
| crates patchées (russh, sntrup761) | fork `aphrody-dev` dans `[patch.crates-io]`, commit dans `Cargo.lock` | patch PQ-kex non publié en amont |
| outils cargo (nextest, binstall, dist, zigbuild) | release GitHub + checksum (`tools.toml`) ; `cargo binstall` sinon ; `cargo install` seulement sur prd | pas de compilation sur le poste ; binstall vérifie les signatures publiées |
| bun | release GitHub `oven-sh/bun` + `SHASUMS256.txt` (`tools.toml`, verrou `toolchains.bun`) | binaire unique, musl sous Linux ; Node remplacé |
| paquets JS | `package.json` (catalogue racine) + `bun.lock` | bun natif ; zéro dépendance externe aujourd'hui (seulement `@types/bun`) |
| CLI JS (wrangler, MCP) | `source = "bun"` dans `tools.toml`, version exacte | installés par bun, sans npm |
| Python (projets src) | workspace uv racine (`pyproject.toml`, `uv.lock`) | un seul résolveur et un seul lock ; CPython géré par uv |
| uv | release GitHub `astral-sh/uv` + `.sha256` | uv publie une somme sha256 par archive |
| Go (infra) | `infra/go.mod` + `go.sum`, `go 1.27.0` | MVS + sum.golang.org |
| zig | archive ziglang.org (`tools.toml`, `source = "url"`) ; signature minisign à ajouter | pas de paquet système à jour |
| clang, lld, llvm-* | `third_party/llvm-project` construit sur fr1, partagé avec Chromium | LTO inter-langages, une seule LLVM |
| C/C++ tiers | vcpkg manifeste + baseline (fork `aphrody-labs/vcpkg`) + triplet LLVM | modèle intelligent-terminal ; binaire = bitcode |
| Chromium | gclient (`third_party/chromium`, DEPS amont, CIPD) ; build fr1 | unité indivisible, outillage Google |
| .NET 11 / 10 | archives officielles Microsoft (dotnet-install) ; NuGet + `packages.lock.json` | NativeAOT ; pas de Mono ni de VSTest |
| MSVC, Windows SDK | Windows : winget (Build Tools) ; Linux : `xwin` (`tools.toml`) | seul canal Microsoft redistribuable |
| outils système Windows (Docker Desktop, pilotes) | winget, déclaré en DSC (`packages/machine/*.dsc.winget`) | modèle `.config/configuration.winget` d'intelligent-terminal |
| CLI génériques (rg, fd, bat, just, gh…) | release GitHub (`tools.toml`), sha256 par plateforme | binaire statique, même version sur Windows et Linux |
| images OCI | Alpine (léger), Arch (lourd), `cgr.dev/chainguard/static` (Rust musl), épinglées par digest | jamais Debian/Ubuntu |
| hôtes Linux | Arch/CachyOS (prd) : pacman ; nix (`flake.nix`) hors conteneur | pas d'apt dans la chaîne src |
| applications de bureau Linux | flatpak/Flathub | isolées, hors build |
| amonts git (third_party) | fork `aphrody-labs` si patch, sinon amont ; `src.lock.json` vers DEPS | modèle Chromium DEPS |

## 3. Commandes

| Commande | Effet |
|---|---|
| `ay doctor --deps` | conformité de tout le dépôt (règles ci-dessous) ; code 1 s'il y a une erreur |
| `ay doctor --deps --dups` | liste aussi les crates résolues en plusieurs versions |
| `ay doctor --deps --json` | rapport JSON (CI, tableaux de bord) |
| `ay lock --deps` | rafraîchit `Cargo.lock` (`cargo update --workspace`), `bun.lock` (`bun install --lockfile-only`) et `uv.lock` (`uv lock`) sans rien monter |
| `ay lock --deps --hoist` | remonte d'abord les exigences inline des membres dans `[workspace.dependencies]` et relâche les `=` |
| `ay lock --deps --bump` | montée dans les bornes : `cargo update`, `bun update --recursive`, `uv lock --upgrade` ; affiche les doublons avant et après |
| `ay lock --deps --dedupe` | comme `bun dedupe` : chaque crate en double est ramenée sur une version inférieure déjà résolue (`cargo update -p nom@haute --precise basse`) si tous ses dépendants l’acceptent et que le total de copies baisse |
| `ay lock --deps --breaking` | relève les exigences `[workspace.dependencies]` dont la dernière version stable (index sparse crates.io) sort de la plage caret, puis `cargo update` ; cargo 1.102-nightly n’a plus `update --breaking` ; à valider par `cargo check` sur prd |
| `ay lock` | `src.lock.json` (chemins relatifs) puis DEPS, `.repo`, MAINTAINERS |
| `just deps`, `just deps-lock`, `just deps-bump` | les mêmes, via just (`deps-bump` enchaîne `--bump --dedupe`) |

Règles vérifiées :
- Rust : `CARGO-INLINE`, `CARGO-PATH`, `CARGO-GIT`, `CARGO-REGISTRY`, `CARGO-WILDCARD`, `CARGO-PRERELEASE` (avertissement), `CARGO-DUP` (avertissement), `CARGO-DENY`, `RUST-PIN` ;
- bun : `JS-CATALOG`, `JS-CATALOG-PIN`, `JS-FLOAT`, `JS-NODE`, `JS-INSTALL-SCRIPT`, `JS-ABS-PATH`, `JS-LOCK` ;
- Python : `PY-WORKSPACE`, `PY-LOCK`, `PY-MANIFEST` ;
- conteneurs et outils : `OCI-DISTRO`, `TOOLS-PIN`, `TOOLS-UNVERIFIED` ;
- `src.lock.json` : `LOCK-ABS`, `LOCK-UNPINNED`, `LOCK-MISSING` (avertissement).

## 4. Mise à jour automatique

La CI, sur fr1 ou prd, exécute chaque semaine `ay lock --deps --bump --dedupe`, puis `cargo check --workspace --locked`, `cargo test`, `bun test` par paquet et `ay doctor --deps`. Elle commite les locks sur main quand tout est vert. Sur prd, un seul travail lourd à la fois : `flock /var/lock/aphrody-heavy.lock`, `nice -n 19`, `ionice -c 3`, `-j 2`, et seulement quand la charge est sous la moitié des cœurs. Sinon, la CI GitHub prend le relais.

Les montées majeures (`--breaking`) et la date de la nightly se changent à la main, dans un commit dédié. Le doublon restant de chaque montée est relevé dans `docs/deps/DEDUP.md`.

## 5. Une seule source d'outils

`tools.toml` déclare les CLI installées par `ay up` (`[[tool]]`, toutes épinglées et vérifiées par sha256 : digests de release GitHub, ou somme mesurée quand la release n'en publie pas). Il porte aussi, en fin de fichier, le bloc `[toolchain."<nom>"]` généré par `scripts/toolchains-lock.ts` (`just toolchains-lock`) : toolchains par hôte avec `{ url, sha256 | sha512 }` par plateforme. Ce bloc est lu par `infra/fleet/bootstrap`, `infra/docker` et `ay bun bump`. `packages/machine/toolchains.lock.toml` est supprimé.

Compléments :
- `docs/DEPS-MINIMIZE.md` : aucun code tiers versionné, sources git Cargo épinglées par `rev` ;
- `deny.toml` `[sources.allow-org]`, reconnu par `CARGO-GIT` ;
- `scripts/js-deps-check.ts`, lancé dans `just check` et en CI : doublons de `bun.lock`, built-ins bun.

## 6. Ajouts des autres chantiers

Tout nouveau chemin doit passer `ay doctor --deps` sans erreur :
- une crate sous `crates/` hérite du workspace ;
- un paquet sous `packages/` passe par le catalogue ;
- un projet Python devient membre du workspace uv ;
- un amont est cloné dans `third_party/<nom>`, puis `ay lock`.
