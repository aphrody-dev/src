# Visibilité des dépôts (2026-11-12)

Source : `docs/PUBLISH-AUDIT.md`, plus un gitleaks 8.30.1 (sha256 vérifié) lancé sur fr2 pour les dépôts que l'audit n'avait pas couverts (msys, knowledge-engine, mesh-vn, zig). `aphrody-dev` est un compte utilisateur, pas une organisation : `orgs/aphrody-dev/repos` renvoie 404, l'inventaire a donc été fait via `user/repos?visibility=private&affiliation=owner`.

| Dépôt | Avant | Après | Classe | Motif / correctif |
|---|---|---|---|---|
| aphrody-labs/antigravity-sdk-python | private | **public** | propre | Copie du SDK Google, LICENSE Apache-2.0 amont conservée, 0 finding |
| aphrody-labs/yolo | private | **public** | propre | LICENSE MIT + LICENSES/, 0 finding |
| aphrody-labs/r2b | private | **public** | propre | MIT, notices amont (rea, replica, third_party/) présentes, fixtures seulement |
| aphrody-labs/auto | private | **public** | propre | Apache-2.0 + licenses/, fixtures seulement |
| aphrody-labs/zig | private | **public** | propre | Miroir codeberg ziglang/zig (MIT). 1879 findings `generic-api-key`, tous dans `lib/std` et `lib/libc` (vecteurs de test amont) |
| aphrody-labs/aphrody-m3 | private | **public** | corrigé | 3e1dcf5 : LICENSE-MIT + LICENSE-APACHE, `license`/`repository`/`description` dans 30 package.json (repository corrigé : `aphrody-code/material-web` remplacé par `aphrody-labs/aphrody-m3`). forks/ garde ses licences amont |
| aphrody-labs/msys | private | **public** | corrigé | 8e29324 : LICENSE-MIT + LICENSE-APACHE, métadonnées des 3 package.json. 8 findings = faux positifs (noms de paquets cygwin) |
| aphrody-dev/knowledge-engine | private (archivé) | **public** (archivé) | corrigé | Désarchivé, puis 4050e87 (licences + package.json), puis réarchivé. 1 finding = fixture `SYNTHETIC` |
| aphrody-labs/labs | private | **public** | propre (vide) | Dépôt vide. C:\labs se pousse vers le serveur Lore, pas vers ce dépôt. LICENSE-MIT et LICENSE-APACHE ajoutés à la racine de C:\labs |
| aphrody-labs/shenron | private | private | bloqué | Clé Stripe `sk_test_` au format réel dans l'historique, plus le build `.next-ui-preview` commité. Voir BLOCKED.md |
| aphrody-dev/mesh-vn | private (archivé) | private | bloqué | **Clé privée WireGuard réelle** (`generated/wg-win.conf`, `src/generator.ts`, commit 2f81bf77) et IP publiques des hubs. Voir BLOCKED.md |
| aphrody-labs/UnrealEngine | private | private | bloqué (légal) | EULA Epic ; fork de EpicGames/UnrealEngine, un amont privé, donc impossible à rendre public |
| aphrody-dev/UnrealEngine | private | private | bloqué (légal) | Même cas |

Bilan : 13 dépôts privés inventoriés. 9 passés en public (5 propres, 3 corrigés, 1 vide), 4 restent privés (2 pour des secrets, 2 pour l'EULA Epic).

## Point hors périmètre, déjà public

`aphrody-dev/src` est **déjà public**. Les verdicts « après correction » de l'audit n'y ont pas été appliqués :
- `packages/epic-games/src/auth.ts` (@bca544b2) contient le client id/secret du launcher Epic, ce qui contrevient aux CGU Epic ;
- `infra/internal/envvault/envvault_test.go` (@5d7e8036) : il faut vérifier que `CLOUDFLARE_ACCOUNT_ID` n'est pas le vrai ;
- il n'y a pas de LICENSE à la racine (voir `src-publish-fields.patch`).

La décision revient au propriétaire : repasser src en privé, ou corriger puis purger l'historique. Aucune action n'a été faite.

La clé WireGuard de mesh-vn ne figure dans aucun commit de src (`git log --all -S` sur un clone mirror : 0 résultat).
