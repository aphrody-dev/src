# Dépendances : minimisation et verrous (2026-11-13)

Suite de `docs/deps/POLICY.md` (règles) et `docs/deps/DEDUP.md` (doublons Cargo). Principe : src ne
versionne aucun code tiers. Un amont est soit une dépendance de registre (crates.io, npm via le catalogue
bun, PyPI via uv), soit un fork `aphrody-labs` épinglé par commit (`src.lock.json` puis `DEPS`), soit,
pour un patch Rust, un `[patch.crates-io]` git épinglé par `rev` sur ce fork.

## Avant / après

Mesures sur `main` (avant : f27d752 ; après : f1df189 puis le commit steamroom).

| Mesure | Avant | Après |
|---|---|---|
| Fichiers suivis sous `third_party/` | 5 399 (70,0 Mo) | 7 (manifestes : `ECOSYSTEM.toml`, `forks.txt`, `vendor.lock`, …) |
| Copies vendorisées | 3 : `third_party/oils` (5 327 fichiers), `third_party/patches/quinn-proto`, `third_party/patches/glob-match` | 0 |
| Fichiers suivis (dépôt) | 10 519 | 5 129 |
| Pack `.git` | 59 Mio | inchangé (historique conservé, pas de réécriture) |
| Paquets `Cargo.lock` | 1 350 (lock en retard sur les manifestes) | 1 356 (lock aligné : `adblock` et sa chaîne) |
| Crates Cargo en plusieurs versions / copies en trop | 114 / 127 | 114 / 127 (tous transitifs, voir plus bas) |
| Sources git Cargo | 3 dépôts, épinglés par `branch`/`tag` | 5 dépôts, tous épinglés par `rev` |
| Patchs Cargo `path` | 2 | 0 |
| Paquets npm externes (`bun.lock`) | 4 (`@types/bun`, `bun-types`, `@types/node`, `undici-types`), 0 doublon | idem |
| Paquets PyPI (`uv.lock`) | 22, dont `pyright` + `nodeenv` (Node téléchargé) | 21 : `ty` (Astral, Rust) remplace `pyright` |
| Sous-modules | 4 (`apps/auto`, `apps/r2b`, `apps/rosegriffon`, `apps/shenron`) | 4 (inchangé, voir plus bas) |
| Dossier `vendor/` | absent | absent |

## Ce qui a changé

- `third_party/oils` n'est plus suivi. La copie correspondait à `aphrody-labs/oils@996dee35` (branche
  `windows-native`) ; le pin passe à la pointe `afe7c4ce` dans `src.lock.json` et `DEPS`, et le dossier
  local est un clone partiel de ce commit.
- `quinn-proto` 0.11.19 (patchs `LORE:` : `max_rtt`, `is_crypto`, `min_rtt` BBR fenêtré, fenêtre BBR
  bornée) vit sur `aphrody-labs/quinn`, branche `aphrody/lore`, commit `6e76339b`, posé sur le commit
  amont de la release 0.11.19.
- `glob-match` 0.2.1 (correctif du retour arrière `**`, sémantique gitignore) vit sur
  `aphrody-labs/glob-match`, branche `aphrody/lore`, commit `2307a20a`, posé sur le tag `v0.2.1`.
  L'amont n'a plus rien publié depuis 2024-08 ; aucun remplaçant n'a la même sémantique.
- `russh`, `sntrup761` (`[patch.crates-io]`) et `steamroom` (`crates/steam-depot`) passent de
  `branch`/`tag` à `rev`. La branche reste en commentaire pour `ay lock --deps --bump`. `sntrup761` et `steamroom` suivent leur transfert vers `aphrody-labs`.
- `steamroom` passe à 0.2.1 (`aphrody-labs/steamroom`, tag `v0.2.1`, commit `b9868e9f`) : `zip` 9 au lieu de 8, ce qui
  retire RUSTSEC-2026-0367, -0368, -0369 et -0429 du graphe.
- `tools/lore` : `ty` remplace `pyright` dans le groupe `dev`. La roue `pyright` télécharge Node par
  `nodeenv`, ce qu'interdit la règle 7 de la politique.

## Contrôles

`just check` lance `just js-deps` et `just deny`. La CI (`ci.yml`, étape « Supply-chain gate ») lance
les deux.

- `deny.toml` (cargo-deny 0.20) :
  - sources : crates.io, plus les organisations GitHub `aphrody-labs` et `aphrody-dev`, avec
    `required-git-spec = "rev"` ;
  - licences : liste permissive, à laquelle s'ajoutent MIT-0, BSL-1.0, CDLA-Permissive-2.0,
    Unicode-DFS-2016 et bzip2-1.0.6 (revues le 2026-11-13) ;
  - interdits : `openssl`, `openssl-sys`, ainsi que `atty`, `instant`, `ansi_term` et `serde_yaml`
    (abandonnés) ;
  - `unmaintained = "workspace"` ;
  - deux avis ignorés, faute de correctif amont : RUSTSEC-2023-0071 (`rsa` 0.9 par `jsonwebtoken`) et
    RUSTSEC-2026-0387 (`crypto-bigint` 0.5 par `elliptic-curve` 0.13).
- `scripts/js-deps-check.ts` (bun) bloque, pour le workspace bun racine :
  - une dépendance externe hors `catalog:`, ou une dépendance interne hors `workspace:*` ;
  - une version flottante dans le catalogue ;
  - un nom résolu en plusieurs versions dans `bun.lock` ;
  - une dépendance d'exécution sans types (`.d.ts` ou `@types/*`) ;
  - un paquet que bun remplace (fetch, `Bun.Glob`, `Bun.$`, `bun:sqlite`, `bun test`, `bun fmt`…) ;
  - un script `preinstall`, `postinstall` ou `prepare`.

## Restes, avec leur cause

- **Doublons Cargo** : tous transitifs (familles RustCrypto, `rand`, `windows`, `syn`, `hashbrown` ;
  détail dans `docs/deps/DEDUP.md`). Au niveau des membres, les seuls écarts étaient `zerocopy` 0.9-alpha
  et `sha2` 0.10 dans `next`, déjà alignés dans les manifestes en cours. `multiple-versions` reste donc
  en `warn`.
- **Dépendances directes sans release depuis plus de 18 mois** (relevé crates.io, 212 directes) : `hex`,
  `byteorder`, `walkdir`, `urlencoding`, `dotenvy`, `temp-env`, `streaming-iterator` (imposé par l'API
  de `tree-sitter`), `enum_dispatch`, `async-stream`, `lz4-sys`, `sys-locale`, quatre grammaires
  `tree-sitter-*`, `ring` et `directories`. Aucune n'a d'avis RustSec. Les crates de BurntSushi et
  `hex` sont terminées, pas abandonnées.
- **Dépôts archivés** : `directories` et `console_error_panic_hook`.
  - `directories` reste : `etcetera`, l'alternative maintenue, range la config sous `%APPDATA%`
    (Roaming) au lieu de `%LOCALAPPDATA%`, ce qui déplacerait le magasin de jetons de lore.
  - `console_error_panic_hook` est de toute façon tiré par `bevy_app`.
- **Sous-modules** : les quatre `apps/*` sont des produits ou des dépôts séparés de 19 à 49 Mo, déjà
  épinglés à la fois par le gitlink et par `DEPS`. Les remplacer par le seul `DEPS` suppose de changer
  `ay lock`, qui génère `.gitmodules`. Écart relevé : `DEPS` épingle `apps/rosegriffon@f5d61f9`, alors
  que le gitlink est à `ff692b5`. Le prochain `ay lock` les réaligne ; rosegriffon relève de sa propre
  session.
- **.NET** : `apps/nt` utilise `Directory.Packages.props` (gestion centrale). `Relay.Service.csproj`
  (`packages/ai-os`) déclare encore ses versions en ligne.
