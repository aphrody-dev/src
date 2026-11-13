# Déduplication Cargo : relevé (2026-11-13)

Mesures prises sur `Cargo.lock`, toutes cibles confondues, avec `ay doctor --deps --dups`. On compte les crates résolues en plusieurs versions et les copies en trop. La mesure `cargo tree -d -e normal,build` sur l'hôte Linux (prd) est donnée en complément.

| État | Paquets | Crates en double | Copies en trop | `cargo tree -d` (noms, hôte) |
|---|---|---|---|---|
| avant (main 8c3c113) | 1352 | 114 | 127 | 67 |
| après (`ay lock --deps --hoist --breaking --dedupe`) | 1352 | 110 | 123 | 65 |
| smallvec 1.16 et dashmap 6.2 stables, aphrody-design-emit retiré par son agent | 1347 | 105 | 118 | n. m. |

## Ce qui a été fait

- 166 exigences inline des membres sont passées en `{ workspace = true }`, avec 69 nouvelles entrées dans `[workspace.dependencies]`.
- 106 épinglages `=` sont devenus des exigences caret : l'exactitude reste portée par `Cargo.lock`.
- Doublons supprimés à la source :
  - `libc` 1.0.0-alpha.5 : retour à 0.2.191, la version du reste du graphe ;
  - `zerocopy` et `zerocopy-derive` 0.9.0-alpha.0 : `bench` et `ring3-agent` passent à la 0.8 du workspace ;
  - `sha2` 0.10 : `next` passe à la 0.11 du workspace ;
  - `zip` 8 : `steam-depot` passe à la 9 du workspace.
- smallvec 2.0.0-beta.4 vers 1.16 (35 types `SmallVec<T, N>` réécrits en `SmallVec<[T; N]>`, `from_slice_copy` remplacé par `from_slice`) et dashmap 7.0.0-rc2 vers 6.2 : plus aucune préversion dans lore. Vérifié sur fr1 par `cargo check --workspace --all-targets`.
- `cargo update` monte les versions dans les bornes. `--breaking` monte `oxc_*` de 0.155 à 0.158 : c'étaient les seules majeures en retard parmi les dépendances directes.
- `--dedupe` ramène `glam` de 0.34.3 à 0.33.12 (bitcode s'aligne sur bevy) et `libloading` de 0.9.0 à 0.8.9.

## Doublons restants et cause

| Famille | Versions | Cause | Action |
|---|---|---|---|
| RustCrypto (`digest`, `sha1`, `sha2`, `hmac`, `cipher`, `aes`, `der`, `spki`, `pkcs8`, `rsa`, `p256`, `p384`, `ecdsa`, `ed25519-dalek`, `signature`, `rand_core`…) | 0.10/0.11, 2/3 | transition amont : russh 0.65, aws-sdk et rust-stack sur la nouvelle génération ; jsonwebtoken, ssh-key et rsa 0.9 sur l'ancienne | suivre les releases ; rien à corriger localement |
| `rand`, `rand_core`, `rand_chacha`, `getrandom` | 0.8/0.9/0.10, 0.2/0.3/0.4 | lore sur `rand` 0.10, hickory sur 0.9, crates anciennes sur 0.8 | idem |
| `windows*` | 0.61/0.62 | gpu-allocator, sysinfo, wgpu-hal sur 0.62 ; d'autres crates encore sur 0.61 | aligner le fork `windows-rs` quand les dépendants publient |
| `syn` | 1/2/3 | `lore-macro` et `lore-error-set-macro` sur syn 3 ; l'écosystème encore sur 2 ; quelques crates sur 1 | aucune |
| `hashbrown`, `foldhash` | 0.14 à 0.17, 0.1/0.2 | versions figées par indexmap, dashmap et les crates gpu | aucune |
| `parking_lot` 0.13, `quick-xml` 0.42, `tower-http` 0.7 | nouvelles majeures | les membres sont à jour, les dépendances externes encore sur l'ancienne | attendre l'amont |
| `thiserror`, `toml`, `winnow`, `itertools`, `phf` | 1/2, 0.9/1, … | dépendances externes en retard | attendre l'amont |

Les doublons restants viennent tous des dépendances externes. Chaque `ay lock --deps --bump --dedupe` hebdomadaire les réduit à mesure que l'amont publie.

Vérifié sur prd le 2026-11-13, sous `flock`, avec `nice 19` et `-j 2` : `cargo check --all-targets` passe sur aphrody-lore, lore-capi, steam-depot, next, react, stack-bench, ring3-agent, aphrody-up, depot-gclient, depot-cipd, rust-stack, aphrody-remote et aphrody, et les tests de xtk, aphrody-up, steam-depot, next, react et depot-gclient passent. Le `Cargo.lock` final a été résolu sur fr1, puis validé par `cargo metadata --locked`.
