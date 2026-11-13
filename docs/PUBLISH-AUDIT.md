# Audit pré-publication (2026-11-12)

Audit en lecture seule. Scans exécutés sur fr2 (`ssh cdn`) avec gitleaks 8.30.1 (binaire de release, sha256 vérifié contre `checksums.txt`), règles par défaut plus des règles ajoutées pour les tokens crates.io (`cio…`), `ctx7sk…`, les clés R2/AWS et les variables nommées `CARGO_REGISTRY_TOKEN`, `CTX7_API_KEY`, `GH_TOKEN`/`GITHUB_TOKEN` et `CLOUDFLARE_API_TOKEN`. Les clones mirror ont été faits avec tout l'historique et supprimés après chaque scan. Le token gh a été passé par stdin puis env, sans jamais être écrit sur disque. fr2 a été nettoyé (`/tmp/aud` supprimé). Aucune valeur de secret n'apparaît dans ce document.

Décision du propriétaire : toutes les licences sont acceptées pour l'usage interne (vendoring, fusion dans src). Le tableau des licences ne vaut donc que pour la publication publique (crates.io, npm, dépôts publics).

## 1. Secrets

| Dépôt | Findings | Taille | Résultat du tri |
|---|---|---|---|
| aphrody-dev/src | 6 (+2 avec les règles ajoutées) | – | fixtures uniquement |
| aphrody-labs/shenron | 82 | 285 Mo | 1 clé Stripe de test au format réel, build `.next` commité, le reste en faux positifs |
| aphrody-labs/r2b | 9 | 19 Mo | fixtures de test (JWT, marqueurs) |
| aphrody-labs/auto | 7 | 49 Mo | fixtures `sk_test_` courtes, vecteurs de test xlsx |
| aphrody-labs/yolo, aphrody-m3, antigravity-sdk-python | 0 | – | propre |
| aphrody-labs/labs | 0 (dépôt vide) | 0 | – |
| aphrody-labs/UnrealEngine | non scanné | 39,8 Go | ignoré (> 2 Go) |
| C:\labs (arbre de travail, sans target/third_party/crates/.lore) | 17 | 45 Mo tgz | clés de test de CPython 2.7 dans `forks/oils`, toutes publiques |

### Secrets exposés connus dans cette session

| Secret | Occurrences dans un historique git ou dans C:\labs |
|---|---|
| CARGO_REGISTRY_TOKEN (`cio…`) | 0 |
| Clés Cloudflare R2 (access/secret) | 0 |
| Token gh (`gho_`/`ghp_`/`github_pat_`) | 0 réel. 3 fixtures marquées comme fausses : src `tools/archguard/tests/archguard_test.rs` @0b8cdd0c et `packages/env-kit/loaders/rust/src/lib.rs` @f5a14bf1, ainsi que `loaders/rust/src/lib.rs` @0d87b374 |
| CTX7_API_KEY (`ctx7sk…`) | 0 réel. 1 fixture : src `packages/knowledge-engine/tests/knowledge-engine.test.ts` @f5a14bf1 |

Ces quatre secrets restent compromis du fait de leur exposition dans la session. Il faut les révoquer quoi qu'il en soit, même si l'audit ne les trouve dans aucun dépôt.

### Findings à traiter

| Dépôt | Fichier | Commit | Règle | Gravité |
|---|---|---|---|---|
| shenron | apps/site/src/lib/stripe.ts | a2671e1e | stripe-access-token (`sk_test_` et `pk_test_`, 107 caractères, format réel) | moyenne : à révoquer dans le dashboard Stripe (mode test) |
| shenron | apps/site/.next-ui-preview/** (build commité, 2 commits) | 3ffae86d | private-key (vecteur de test de jose), generic-api-key | faible, mais c'est un artefact de build à purger de l'historique |
| shenron | packages/db/migration-audit.snapshot.json | ×12 commits | generic-api-key | faible : hash de snapshot, à vérifier |
| shenron | apps/site/tests/*, packages/api/test/* | divers | discord-client-id | faible : un client id est public |
| shenron | data/catalogues/pages/*.html (14) | 239fe463 | generic-api-key | faux positif (pages HTML aspirées) |
| src | packages/epic-games/src/auth.ts | bca544b2 | generic-api-key (client id/secret du launcher Epic) | faible : valeur connue publiquement, mais sa présence pose un problème de CGU Epic |
| src | infra/internal/envvault/envvault_test.go | 5d7e8036 | env-named-known CLOUDFLARE_API_TOKEN | le token est un faux, mais `CLOUDFLARE_ACCOUNT_ID` (32 caractères) n'est pas marqué comme faux : vérifier qu'il ne s'agit pas du vrai |
| src | packages/env-kit/tests, tests/env-kit.test.ts | f5a14bf1, 0d87b374 | generic-api-key | fixture |
| auto | apps/api/src/encaissement.test.ts, apps/web/e2e/paiement-en-ligne.test.ts, apps/api/src/modules/courrier.test.ts | 144c4b3a | stripe-access-token / generic | fixtures courtes (19 et 22 caractères) |
| auto | vendor/suite/crates/gridcraft-xlsx/src/{crypto,tests}/* | 4f3ad0b5 | generic-api-key | vecteurs de test |
| r2b | src/rea/** (9) | 248976e0 | jwt, generic-api-key | fixtures de test |

## 2. Licences (publication publique uniquement)

### C:\src

- Le Cargo.toml de workspace déclare `MIT OR Apache-2.0`, mais il n'y a ni `LICENSE-MIT`/`LICENSE-APACHE` ni `LICENSE` à la racine. À ajouter avant toute publication.
- `third_party/` n'est pas suivi par git : 313 dépôts locaux, qui ne seront pas publiés tant qu'ils ne sont pas commités. Répartition : MIT 122, Apache-2.0 98, BSD 17, GPL 21, MPL 5, LGPL 2, AGPL 4, Unlicense 1, autres 17, sans fichier de licence 26.
- Licences restrictives qui bloquent une redistribution publique (vendoring dans un dépôt public ou une crate) :
  - EULA Epic : dépôt `aphrody-labs/UnrealEngine`, jamais public.
  - SDK Steam / Valve : `steamworks-rs`, `steamkit`, `steam-protobufs`, `steam-vent` (sans licence), `steamtracking` (sans licence). Les bindings sont redistribuables sous leur propre licence, pas le SDK Steamworks.
  - AGPL (contaminante si fusionnée dans du code publié) : `defguard`, `heretic`, `lightpanda-io-browser`, `locally-uncensored`.
  - Sans licence (tous droits réservés) : CachyOS-PKGBUILDS, anthropics-skills, aosp-manifest, arch-wsl, cachyos-hyprland-settings, chromium (licence BSD dans un sous-chemin, à vérifier), dioxus-components, gcc et glibc (GPL dans `COPYING*`, faux négatif probable), hanashi-graphics-demo, hostinger-api, hostinger-api-typescript-sdk, hostinger-claude-plugin, kernel-patches, labs, lc-binutils, n2b, nsh, omarchy-site, openai-skills, point-generator, storyteller-bevy, stylo (MPL dans un sous-chemin), yash-rs.
  - Licences propriétaires ou de type « autre » à relire : `claude-code`, `claude-agent-sdk-typescript` (licence commerciale Anthropic), `autogen`, `browser-compat-data`, `webmcp`, `mdn-content`/`csswg-drafts`/`ecma262` (CC/W3C), `firefox` (MPL), `linux` (GPL).
- Code suivi par git : `infra/winnt-sdk/native-cpp/native_nt_gpu.lib`, un binaire à vérifier (provenance et licence). Les icônes dans `crates/aphrody-design-icons/sources/*` ont leur LICENSE (chromium, cosmic, fluent, material).
- Packages Epic/Steam : `packages/epic-games` (embarque le client secret du launcher Epic, contraire aux CGU) et `crates/steam-depot` (Apache-2.0, à vérifier : aucun binaire SDK).

### C:\labs

- Pas de LICENSE à la racine. `[workspace.package]` n'a pas de champ `license`, et les 21 crates `lore*` n'ont pas de champ license (toutes en `publish = false`). Lore est en MIT © Epic Games (`licenses/lore/LICENSE`) : redistribution possible en conservant la notice.
- `forks/oils` a un LICENSE.txt. `forks/dl` n'a pas de fichier de licence. `vendor/glob-match` et `vendor/quinn-proto` ont leur LICENSE.

### Crates et packages

| Workspace | Type | Nombre | Licence | publish=false / private |
|---|---|---|---|---|
| src | crates | 52 | 31 héritent du workspace, 19 explicites, 2 sans licence (`agy-desktop`, `xtk`) | 15 |
| src | npm @aphrody/* | 18 | 1 MIT (`bun-parity`), 17 sans licence | 6 private |
| labs | crates | 24 | 3 héritent du workspace (sans valeur), 21 lore sans licence | 21 |

## 3. Disponibilité des noms

Vérification faite le 2026-11-12 via l'API crates.io et le registre npm, avec le User-Agent `aphrody-audit`.

- crates.io : 72 noms libres sur 75. Noms pris : `lore` (0.1.0, maj 2025-12-05), `ffi` (0.1.1), `sys` (0.0.1). Ces trois crates sont en `publish = false` chez nous, mais `lore` est à renommer avant toute publication, par exemple en `aphrody-lore`. Les noms génériques `cosmic-compat`, `unix-distro` et `smithay-wayland-wire` sont libres aujourd'hui.
- npm : 16 noms libres sur 18. `@aphrody/web` (1.4.7) et `@aphrody/yolo` (3.2.0) existent déjà, publiés par le mainteneur `<npm-owner>`. La page de l'organisation `@aphrody` répond 200, donc le scope est pris. **À confirmer** : `<npm-owner>` est-il le propriétaire ? Si non, le scope `@aphrody` est indisponible et il faut en choisir un autre.

## Verdicts

| Cible | Verdict | Condition |
|---|---|---|
| aphrody-dev/src (dépôt public) | après correction | LICENSE à la racine, retrait de `epic-games` (secret du launcher), vérification de `native_nt_gpu.lib` et de `CLOUDFLARE_ACCOUNT_ID`, pas de `third_party/` commité |
| crates src (MIT/Apache) | après correction | LICENSE à la racine et licences explicites (`agy-desktop`, `xtk`). Les 15 crates en publish=false restent internes |
| npm @aphrody/* | après correction | confirmer la propriété du scope, ajouter `license` à 17 packages |
| aphrody-labs/yolo, aphrody-m3, antigravity-sdk-python | publiables maintenant pour les secrets | LICENSE à vérifier dans chaque dépôt (non audité) |
| aphrody-labs/r2b, auto | publiables maintenant pour les secrets | fixtures seulement. LICENSE à vérifier |
| aphrody-labs/shenron | après correction | révoquer la clé Stripe de test, purger `.next-ui-preview` de l'historique (git filter-repo), droits sur le contenu Dragon Ball aspiré |
| C:\labs / aphrody-labs/labs | après correction | LICENSE et `license` dans le workspace, renommer `lore` sur crates.io, conserver la notice MIT Epic de Lore |
| aphrody-labs/UnrealEngine | jamais | EULA Epic |
| third_party restrictif (Steam SDK, AGPL, sans licence) | jamais en redistribution publique | usage interne autorisé |

## Actions, par ordre

1. Révoquer ou régénérer les quatre secrets exposés dans la session : CARGO_REGISTRY_TOKEN, clés R2, token gh, CTX7_API_KEY.
2. Révoquer la clé Stripe de test de shenron (`apps/site/src/lib/stripe.ts` @a2671e1e).
3. Vérifier `CLOUDFLARE_ACCOUNT_ID` dans `infra/internal/envvault/envvault_test.go` et le remplacer par un faux s'il est réel.
4. Retirer le client secret Epic de `packages/epic-games` ou le charger depuis l'environnement.
5. shenron : `git filter-repo` sur `apps/site/.next-ui-preview`, et ajouter ce chemin à `.gitignore`.
6. Ajouter LICENSE-MIT et LICENSE-APACHE à la racine de src et de labs, plus `license` dans `[workspace.package]` de labs et dans les packages npm.
7. Confirmer la propriété du scope npm `@aphrody` (mainteneur `<npm-owner>`).
8. Renommer `lore`, `ffi` et `sys` avant toute publication. Les autres noms de crates sont libres.
9. Ne jamais commiter `third_party/` ni UnrealEngine dans un dépôt public. Relire `native_nt_gpu.lib`.
10. Avant de rendre un dépôt public, relancer `gitleaks git --redact` dessus (la règle `extra.toml` peut être recréée à partir de la section 1).

Mise à jour 2026-11-13 : `packages/epic-games` a été supprimé de l arbre (commit `2b1a28fe`). Les points qui le citent ne concernent plus que l historique git, où la valeur reste lisible.
