# crates.io : état de préparation (2026-11-12)

Tout a été exécuté sur fr2 (`nice`, cargo nightly 1.102.0 du 2026-11-06), sur des copies : `git archive` de `C:\src-merge` (merge/labs, 06ebcae) et fichiers suivis ou non ignorés de `C:\labs` (sans third_party/). Rien n'a été compilé sur le PC et rien n'a été publié. Dans les copies, le `[source.crates-io] replace-with = "vendored-sources"` de `.cargo/config.toml` est retiré, car `third_party/crates` n'est pas copié.

## Résultats

| Arbre | Crates | Tel quel (`cargo package --no-verify`) | Avec le patch | `publish --dry-run` (avec verify) |
|---|---|---|---|---|
| C:\labs | 25 | 4 OK, 21 KO (dépendances path sans version) | **25/25 OK** | 13 vérifiées OK, puis **échec sur `aphrody-lore-transport`** (voir B2) |
| C:\src-merge | 69 | majorité KO (dépendances path sans version) | **66/66 OK** (3 exclues, voir B1) | non lancé (69 crates ; à faire en CI une fois B2 et B3 réglés) |

Patches générés (appliqués et testés sur fr2, `git apply --check` OK en local) :
- `docs/publish/src-publish-fields.patch` : à appliquer sur la branche merge de src (`git apply`, puis `cargo update -w` pour le lock, qui est exclu du patch). 103 fichiers ;
- `docs/publish/labs-publish-fields.patch` : même transformation pour C:\labs. 47 fichiers. Non appliqué, en attendant la fusion labs vers src (les crates lore* existent dans les deux arbres et ne doivent être publiées qu'une fois, depuis src).

Contenu des patches :
1. `version = "<x>"` sur chaque dépendance path interne (workspace.dependencies et membres).
2. Renommages imposés par les noms déjà pris et la règle de `docs/IDENTITY.md` (`aphrody-<dir>`) : `lore` devient `aphrody-lore` (pris : 0.1.0, maintenu par un tiers), `ffi` devient `aphrody-ffi`, `sys` devient `aphrody-sys`, et par cohérence `lore-*` devient `aphrody-lore-*` (20 crates). La clé de dépendance reste inchangée (`lore = { …, package = "aphrody-lore" }`), donc le code n'est pas touché.
3. Les dev-dépendances internes héritées du workspace passent en path seul, ce que cargo retire au packaging. Sans cela, le cycle `lore-base` → `lore-io` → (dev) `lore-base` bloque.
4. `publish = false` et `publish.workspace` sont retirés, sauf pour les crates bloquées (B1) et `lore-integration-tests`.
5. Métadonnées : `license` (lore* : `MIT` + copie de `licenses/lore/LICENSE` dans chaque crate, notice Epic conservée ; `xtk`, `stack-bench` : `license.workspace`), `description` quand elle manque, `repository.workspace`. Dans src, `repository` est corrigé : `aphrody-labs/src` n'existe pas, le bon dépôt est `aphrody-dev/src`. LICENSE-MIT et LICENSE-APACHE sont ajoutés à la racine de src. Pour labs, les deux fichiers sont déjà ajoutés à la racine.
6. npm (src/packages) : voir NPM.md.

## Noms

Les 70 noms finaux (après renommage) sont **libres** sur crates.io (API, 2026-11-12), y compris `aphrody`. Les 191 crates `aphrody-*` existantes appartiennent à `aphrody-dev`, donc le compte crates.io est le bon.
Recommandation, non incluse dans le patch : préfixer aussi les noms génériques, conformément à IDENTITY.md. `archguard`, `depot-*` (12), `gamescope-*` (4), `unix-*` (3), `cosmic-compat`, `hypr-tiler`, `smithay-wayland-wire`, `dx12-hal`, `wslg-cli`, `ring3-agent`, `rust-stack`, `sovereign-corelib`, `stack-bench`, `xtk`, `steam-depot` deviendraient `aphrody-<nom>` ; ces 31 noms préfixés sont tous libres.

## Blocages restants

- **B1. Crates non publiables en l'état**
  - `aphrody-remote` dépend de `russh` via `[patch.crates-io]` git (fork `aphrody-dev/russh`, sntrup761). Sur crates.io, il résout `russh 0.65` et échoue (`pkcs1` en conflit). Il faut publier le fork sous un autre nom (par exemple `aphrody-russh`) ou attendre l'amont.
  - `aphrody` (crates/ay) dépend de `aphrody-remote`.
  - `steam-depot` dépend de `steamroom` (path vers third_party, sans version) et touche au SDK Steam : il reste interne (audit).
  - De plus, `aphrody` (crates/ay dans src) et `aphrody` (crates/cli dans labs) portent le même nom de paquet. Il faut trancher lors de la fusion.
- **B2. Patches `[patch.crates-io]` perdus à la publication.** `vendor/quinn-proto` (ajouts `LORE:` : `max_rtt`, `is_crypto`, `BbrConfig::max_window`) n'existe pas sur crates.io, d'où `E0599` dans `aphrody-lore-transport` au verify. Même chose pour `vendor/glob-match` (correctif `**`). Il faut publier ces forks sous un nom propre (`aphrody-quinn-proto`, `aphrody-glob-match`) et les référencer par `package = …`, ou faire accepter les changements en amont.
- **B3. Configuration de build absente chez l'utilisateur.** `.cargo/config.toml` impose `--cfg tokio_unstable` et `--cfg uuid_unstable`, ainsi que `cargo-features = ["codegen-backend", "panic-immediate-abort"]` (nightly). Une crate publiée qui exige ces cfg ne compile pas avec un `cargo install` ordinaire. Il faut isoler ces usages derrière une feature, ou documenter `RUSTFLAGS`. `rust-version` vaut 1.85 dans src et 1.97 dans labs, alors que le code demande nightly.
- **B4.** Pas de `readme` explicite : cargo prend `README.md` quand il existe dans la crate, et la majorité n'en a pas. C'est un avertissement, pas une erreur.

## Ordre de publication (topologique, celui que calcule `cargo package --workspace`)

src (après patch, sans B1) :
aphrody-apm, aphrody-conformance, aphrody-design-shared, aphrody-design-tokens, aphrody-design-emit, aphrody-design-icons, aphrody-design-sprite-sheet, aphrody-design-identity, aphrody-design-layout, depot-core, depot-forge, depot-treesitter, depot-graph, depot-ingest, depot-migrate, depot-re, sovereign-corelib, aphrody-ffi, aphrody-labs-cli, aphrody-lore-error-set-macro, aphrody-lore-error-set, aphrody-lore-macro, aphrody-lore-io, aphrody-lore-base, aphrody-lore-credential, aphrody-lore-proto, aphrody-lore-fuse, aphrody-lore-telemetry, aphrody-lore-transport (B2), aphrody-lore-storage, aphrody-lore-revision, aphrody-lore-notification, aphrody-lore, aphrody-lore-aws, aphrody-lore-capi, aphrody-lore-chaos-client, aphrody-lore-client, aphrody-lore-hashicorp, aphrody-lore-server, unix-cachyos, aphrody-omarchy, aphrody-up, aphrody-rt, aphrody-sys, archguard, hypr-tiler, dx12-hal, smithay-wayland-wire, cosmic-compat, depot-cas, depot-cipd, depot-cli, depot-gclient, depot-vpython, gamescope-core, gamescope-wgsl, gamescope-cli, gamescope-web-wasm, ring3-agent, rust-stack, stack-bench, unix-distro, wslg-cli, xtk.
Les forks B2 (aphrody-quinn-proto, aphrody-glob-match) passent avant aphrody-lore-transport.

labs, propre à labs (le reste est déjà dans src) : aphrody-conformance, aphrody (cli), aphrody-apm, aphrody-factory.

Commande de contrôle, à lancer sur fr2 ou en CI une fois le patch appliqué : `cargo publish --dry-run --workspace --exclude aphrody --exclude aphrody-remote --exclude steam-depot --exclude aphrody-lore-integration-tests`.
