# unixwin : build et installation depuis les forks

Rien ne compile sur le poste. Le binaire `niu.exe` en service se construit à partir des forks
`aphrody-labs/niubash` et `aphrody-labs/rubash`, aux commits de `src.lock.json`, par l'une des deux voies :

1. **prd** (Linux vers Windows) : `infra/unixwin/prd-build.sh`. Clone partiel des deux forks côte à côte dans
   `~/unixwin` (le `[patch]` de niubash prend `../rubash`), puis
   `nice -n 19 cargo xwin build --release --locked -j 4 --target x86_64-pc-windows-msvc --bin niu`.
   cargo-xwin se trouve dans `~/.cargo/bin` ; CRT et SDK MSVC sont en cache dans `~/.cache/cargo-xwin` ;
   clang-cl, lld-link et llvm-rc viennent de clang 23.1.4 (pacman). Sortie : `~/unixwin/out/<triple>/niu.exe`,
   plus `SHA256SUMS` et `SOURCES` (les commits).
2. **CI du fork** : workflow `aphrody build` de `aphrody-labs/niubash` (`.github/workflows/aphrody-build.yml`),
   lancé à chaque push sur master ou à la main avec `rubash_rev`. Jobs : `windows` (x64 et arm64,
   windows-latest, artefact `niu-<triple>` avec `SHA256SUMS`) et `cross-xwin` (ubuntu vers
   x86_64-pc-windows-msvc, le même chemin que prd).

Le pilote `scripts/unixwin/unixwin.ts` (bun) enchaîne les étapes. Les recettes sont dans
`scripts/unixwin/unixwin.just`, importé par le justfile racine.

| Commande                                  | Effet                                                                                                                                                                                                                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `just unixwin-status`                     | avance et retard de chaque fork sur l'amont (`gh api compare`), pins, sha256 du `niu.exe` installé                                                                                                                                                                                                      |
| `just unixwin-sync`                       | clones manquants (`packages/machine/src/forks.ts <noms>`), puis pins dans `src.lock.json`                                                                                                                                                                                                               |
| `just unixwin-build [triple]`             | build sur prd (`ay ssh cp` + `ay ssh exec`), rapatriement dans `var/unixwin/prd/<triple>`, contrôle sha256                                                                                                                                                                                              |
| `just unixwin-fetch-ci [triple]`          | artefact du run `aphrody build` réussi au commit épinglé, dans `var/unixwin/ci/<triple>`, contrôle sha256                                                                                                                                                                                               |
| `just unixwin-install [ci\|prd] [triple]` | remplace `niu.exe` et ses copies identiques (`winuxcmd/bin/bash.exe`, `sh.exe`) dans `%LOCALAPPDATA%\Programs\Niubash` ; copie revérifiée (`*.new`), échange par renommage avec restauration ; l'ancien binaire devient `*.old-<horodatage>`, purgé à l'installation suivante s'il était encore exécuté |
| `just unixwin-test`                       | suite bun de bout en bout (`apps/unixwin/tests`)                                                                                                                                                                                                                                                        |
| `just unixwin-test-fr1 [filtre]`          | `cargo test` de rubash sur fr1 (usine) au commit épinglé (`infra/unixwin/fr1-test.sh`, `aphrody-heavy`, 4 tâches)                                                                                                                                                                                       |

Mise à jour d'un fork : commit sur sa branche par défaut dans `third_party/<nom>`, push, puis
`bun scripts/unixwin/unixwin.ts lock` et commit de `src.lock.json`. `ay lock --lock-only` réécrit tout le lock
dans un autre format (chemins absolus d'une version antérieure d'ay) : ne pas l'utiliser pour ces seuls pins.

Le reste du paquet installé (WinuxCmd, niu-git, assets) vient de l'installateur amont v1.5.0
(`winget install --id Unixwin.Niubash`, épinglé dans `tools.toml` et `shells.lock.toml`). WinuxCmd (C++23, VS
2022 + CMake) et niu-git (MSVC + vcpkg) ne se construisent que sur Windows : par la CI de leurs forks, si un
correctif l'exige.
