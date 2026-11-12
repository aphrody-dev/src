# Racine unique — architecture cible (2026-11-12)

Fusion de trois arbres — le monorepo `src`, `labs` et `nt` (public : github.com/aphrody-labs/nt) — en un seul. Contraintes du propriétaire : **zéro doublon, zéro régression**. La racine doit être, dès le départ, à la fois un **OS pour agents**, un **navigateur**, un **shell** et un **monorepo bun + cargo à plat**, et tout doit y être **renommable, déplaçable et multiplateforme**.

Cible commune avec la session labs (référence : `labs/docs/ROOT-ARCHITECTURE.md`). Les décisions de coordination sont reprises ici.

## 1. Invariants (contrôlés par `ay arch check --strict` et `just ci`)

1. **Un seul de chaque.** Un workspace Cargo (`crates/*`), un workspace bun (`packages/*`), une toolchain Rust (`rust-toolchain.toml`, une nightly épinglée). Un seul `Cargo.lock`, `bun.lock`, `src.lock.json` (dépôts) et `justfile`. `[workspace.dependencies]` donne une version par crate.
2. **À plat.** `crates/<couche>-<nom>`, `packages/<nom>`, `third_party/<nom>`, sur un seul niveau, sans dossier de catégorie (modèle Chromium). La catégorie devient une métadonnée. Les crates existants changent de dossier mais gardent leur nom de package, pour ne casser aucun dépendant.
3. **Un projet amont = un dossier.** Les forks d'un même réseau GitHub sont réunis :
   - `origin` = fork `aphrody-labs`, `upstream` = projet amont ;
   - un fork tiers qui porte des commits devient un remote supplémentaire du même clone (exemple : `reactos` dans `third_party/LiberNT`), pas une seconde copie ;
   - les patchs vivent dans les forks, épinglés par commit, jamais dans une copie vendorisée.
4. **Rien de régénérable n'est versionné.** `third_party/` (matérialisé depuis `src.lock.json`), `third_party/crates` (`cargo vendor` via `just vendor` : `Cargo.lock` et la source-replace de `.cargo/config.toml` restent versionnés, le build tourne hors ligne), `target/`, `node_modules/`, `var/`.
5. **Identité unique.** `identity.toml` à la racine contient : nom du dépôt, CLI, scope npm, préfixe des crates, domaine, remotes git et Lore.
   - `ay identity apply` réécrit les `name`, `[[bin]]`, `package.json#name` et remotes ;
   - `ay identity check` sert de garde de CI ;
   - le code n'écrit aucun nom de produit en dur : il utilise `env!("CARGO_PKG_NAME")`, `CARGO_BIN_NAME` ou une crate `identity` générée par build.rs ;
   - renommer tient en une PR : identity.toml, puis `apply`, puis `just ci`.
6. **Aucun chemin absolu, lien ni jonction.**
   - Les chemins sont relatifs à la racine, détectée par `Cargo.toml` ou `.lore`.
   - Sinon ils viennent des variables d'environnement (`XDG_*`, `%LOCALAPPDATA%`, `SystemRoot`).
7. **Multiplateforme.** Chaque binaire compile et teste sur windows-msvc et linux-gnu. `just` appelle des binaires Rust ou bun : aucun `.sh` ni `.ps1` requis. Les recettes propres à un OS sont marquées `[windows]` ou `[unix]`.
8. **Pas de régression.** Après chaque phase, les nombres de tests doivent être égaux ou supérieurs à la base. Une phase qui casse est annulée. Exécution sur prd ou fr2 uniquement : consigne du propriétaire, aucune compilation sur le PC ni sur fr1.

## 2. Arbre cible

```
<racine>/
├── identity.toml                                   identité unique (nom, CLI, scope, domaine, remotes)
├── Cargo.toml  Cargo.lock  rust-toolchain.toml  .cargo/config.toml
├── package.json  bun.lock  bunfig.toml  tsconfig.json
├── justfile  src.lock.json  README.md  AGENTS.md  CLAUDE.md  LICENSE-*
├── crates/<couche>-<nom>   Rust : sys-, shell-, browser-, desktop-, agent-, vcs-, depot-, design-, nt-
├── packages/<nom>          bun : machine, shell-matrix, nt, env-kit, forge…
├── apps/<nom>              binaires et sites déployables
├── third_party/<nom>       amonts à plat, verrouillés (src.lock.json), non versionnés
├── infra/                  Go, fleet, chromium-factory (scripts → crates/browser-factory)
└── docs/<couche>/          une arborescence, un fichier par sujet ; historique → docs/archive/
```

## 3. Rôles

| Rôle                   | Couches                             | Pièces                                                                                                                                                                     |
| ---------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS pour agents         | `sys-`, `nt-`, `desktop-`, `agent-` | modèle du vrai NT du poste (ntdll, NTFS, PE, UI Automation) rendu GPU (WebGPU, D3D12), `agent-desktop` (UIA, SendInput, capture, MCP), `ring3-agent`, `apm`, `packages/machine` (poste reproductible, élévation) |
| Compatibilité NT/Linux | `third_party`                       | `LiberNT` (+ remote `reactos`), `linux` (kernel.org), `wine` (gitlab.winehq.org), `mingw-w64` (SourceForge), `windows-rs`, `windows-drivers-rs`, `litebox`, `openvmm`      |
| Navigateur             | `browser-`                          | `chromium` (unité gclient indivisible), `infra/chromium-factory`, channels, conformance, `webui`, `blitz`, `agent-browser` (session labs)                                  |
| Shell                  | `shell-`                            | `niubash`, `rubash`, `brush`, `oils` (port Windows), Coreutils, `packages/shell-matrix`, `packages/machine/shell.dsc.winget`                                               |
| Monorepo               | `depot-`, `vcs-`                    | `ay` (lock, forks, up, identity, arch), Lore, `just`                                                                                                                       |

## 4. Fusion : origine → destination

| Origine                                | Destination                                                            | Note                                                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `nt` (aphrody-labs/nt, purgé le 2026-11-12) | `packages/nt` (coque web, outils hôte bun) + `apps/nt-app` (WinUI 3) | cœur Rust = monorepo windows-rs (fork aphrody-labs, branches `nt/monorepo`, `nt/wasm`) → `third_party/windows-rs` |
| `nt/docs`                              | `docs/nt`, `docs/ms`, `docs/bun`, `docs/research`                      | dédupliqués avec l'existant                                                                          |
| `nt/vendor` (35 clones) | supprimé le 2026-11-12 (sans modification locale) ; LiberNT déplacé dans `third_party/LiberNT` | doublons de `third_party` |
| `labs/crates/*`                        | `crates/*`                                                             | merge par la session labs (worktree `merge/labs`) : dependencies, profils, cargo-features, `[patch]` |
| `labs/vendor/{glob-match,quinn-proto}` | forks + `[patch.crates-io]`                                            |                                                                                                      |
| `labs/infra/chromium-factory`                 | `infra/chromium-factory`                                               |                                                                                                      |
| `labs/forks/oils`                      | `third_party/oils`                                                     | branche windows-native                                                                               |
| `third_party/<cat>/<dépôt>`            | `third_party/<nom>`                                                    | `packages/machine/src/flatten-third-party.ts` (voir §5)                                              |
| `configuration/` (racine, ARCH-005)    | `packages/machine`                                                     | ARCH-006 interdit le TS dans `infra/`                                                                |

## 5. third_party à plat — plan vérifié (simulation 2026-11-12)

- 320 dépôts → 309 projets amont : 277 déplacements, 10 doublons supprimés.
  - Doublons détectés par l'API GitHub, en suivant le réseau de forks et le nombre de commits d'avance (« ahead »). Exemples : `cachyos/WSL` (fork de microsoft/WSL, 0 commit d'avance, 67 de retard) et `build/wild` (aphrody-dev, 0 d'avance).
  - Autres opérations : 3 jonctions retirées, 1 dossier vide, 2 fichiers isolés déplacés vers `var/`, 26 références suivies réécrites.
- Nommage. Le nom est le dernier segment du chemin actuel, sans le préfixe `owner_`. Un nom générique garde son propriétaire (`lightpanda-io-browser`, `modelcontextprotocol-rust-sdk`). Les exceptions sont listées et justifiées dans le script.
- Sûreté. Le plan est refusé dans quatre cas : collision, dossier non verrouillé, travail local dans un doublon, fork divergent.
- Application. Le déplacement passe par un transit `third_party/.flatten`. Les dossiers de catégorie sont retirés par `rmdir`, qui échoue s'ils ne sont pas vides.
- Calendrier : après le merge labs, puis `ay lock --lock-only`.

## 6. Phases

1. Base de référence (fait le 2026-11-12, avant la consigne « pas de build sur le PC ») : 9/9 étapes vertes, cargo 805 tests OK, bun 45 OK (`var/baseline-verify-all.log`).
2. Merge labs (session labs) → vérification sur prd/fr2.
3. third_party à plat + dédup → `ay lock`.
4. nt → `packages/nt` + `apps/nt-app` ; cœur Rust via le monorepo windows-rs (`third_party/windows-rs`, branches nt/*) → vérification, mesure d'affichage réelle (?report=1).
5. `identity.toml` + `ay identity` ; `.sh`/`.ps1` restants → recettes `just` vers Rust/bun (`forks-aphrody-labs.sh` déjà remplacé par `packages/machine/src/forks.ts`).
