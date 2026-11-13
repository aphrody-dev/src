# Aphrody, modèle Alphabet

Décision du propriétaire, 2026-11-13 : src est le holding, comme Alphabet (https://abc.xyz/). Un noyau qui finance et outille tout, des paris indépendants qui partagent ce noyau et peuvent être arrêtés sans toucher au reste. Ce document fait autorité pour l'organisation ; `docs/NAMING.md` et `AGENTS.md` restent la référence des noms et des règles.

## Domaines

- **aphrody.com** joue le rôle d'abc.xyz : vitrine sobre du holding, qui liste le noyau, les paris, les lettres et les métriques publiques. Aucun produit n'y vit.
- **aphrody.app** joue le rôle de Vercel (équipe `aphrody-dev`) : plateforme de déploiement et tableau de bord des projets (apps, déploiements, domaines, logs, preview par commit), construite sur notre propre stack (Cloudflare Workers, R2, flotte), sans `vercel.json` ni dépendance à Vercel.

## Principes

- **Un monorepo, une vérité** : tout vit dans `C:\src` sur `main`. Les forks sont dans `third_party/`, la liste est dans `third_party/forks.txt`, et les piles de patchs passent par `ay upstream`.
- **Le noyau sert les paris** : un pari ne réimplémente rien de ce que fournit le noyau (auth, coffre, relais, CI, flotte, toolchain).
- **Mesurer, puis trancher** : chaque pari a une métrique. La revue continue (tribunal Gemini, `docs/reviews/`) le note, et un pari qui stagne est gelé ou arrêté.
- **Zéro humain dans la boucle** : NHITL. La seule exception est le clic du propriétaire sur une connexion, groupé par `ay auth daemon` à une demande au plus par identifiant et par 24 h.

## Noyau (l'équivalent de Google)

| Unité | Chemin | Rôle | Métrique |
|---|---|---|---|
| ay | `crates/`, binaire `ay` | CLI bas niveau unique (bun + Chromium + LLVM), point d'entrée reproductible | commandes vertes en CI, `ay doctor` propre |
| ai-os | `packages/ai-os` | orchestrateur d'agents, relais MCP/A2A/ACP, dédup et cache des appels, index NHITL, brain | tâches abouties sans humain, taux de hit du cache |
| Identité et coffre | `packages/env-kit`, `var/secrets`, `docs/infra/AUTH.md`, `VAULT.md` | auth AI first, OIDC, App GitHub, coffre synchronisé | identifiants valides sondés, zéro secret en clair |
| Toolchain | `docs/llvm`, `docs/deps`, `third_party/bun`, fork Chromium | LLVM partagé, bun canary, Chromium, piles de patchs amont, approvisionnement et locks (`ay doctor --deps`, `ay lock --deps`) | divergence amont, PR fusionnées, erreurs `ay doctor --deps` (0 visé), crates Cargo en double (110 au 2026-11-13) |
| Flotte | `infra/fleet`, `infra/cluster`, `infra/deploy.toml` | fr1 builds, fr2 proxy/CDN, prd backends, mesh mTLS, résilience | `systemctl --failed` vide, redémarrage sans humain |
| Facturation | `docs/infra/GCP-BILLING.md`, `env-kit billing` | budgets, plafonds, crédits | dépense sous plafond |

## Paris (Other Bets)

| Pari | Chemin | Mission | Métrique |
|---|---|---|---|
| nt | `apps/nt` | vrai NT du poste rendu GPU, 4K 120 fps | fps, couverture des API |
| unixwin | `docs/unixwin`, `apps/unixwin`, `third_party/{niubash,rubash,WinuxCmd}` | shell et Unix natifs sous Windows | suite niu verte, CI rubash verte |
| Inférence | `infra/ai`, `docs/ai/DISTRIBUTED-INFERENCE.md` | tissu llama.cpp et routage des modèles | tok/s, coût par requête |
| Jeu | `docs/gaming`, `infra/gaming`, `apps/rosegriffon/plugins/steam` | Steam, Proton, Wine, Vulkan, DirectX unifiés | jeux lancés, mises à jour amont |
| Linux | `docs/linux`, `infra/pkg` | CachyOS en tier 1, recettes multi-distro, GPU compute | paquets construits par distro |
| rosegriffon | `apps/rosegriffon` (sous-module) | produit Steam et contenus | santé 200, synchro CDN |
| shenron | `apps/shenron` (sous-module) | moteur et paquets média | publications npm |
| Produits Aphrody | `apps/aphrody`, `apps/aphrody-app`, `apps/r2-site`, `apps/yolo` | sites et apps publics | disponibilité, Core Web Vitals |
| Marque | `assets/brand`, `docs/profile` | identité unique de tous les binaires, sites et profils | assets générés par `ay brand build` |

Au 2026-11-13, `docs/gaming`, `infra/gaming`, `docs/linux`, `infra/pkg` et `docs/profile` sont en création par leurs agents.

## Orchestration

1. **Une seule file** : toute tâche d'agent passe par `ai-os orch` (runner `infra/agents/runner.ts` sur prd et le PC). Les sessions Claude parallèles se coordonnent par messages et par l'index NHITL, pas par des copies de travail.
2. **Une seule règle de commit** : `git pull --rebase`, puis `git commit -- <chemins>` (l'index est partagé), sans attribution IA.
3. **Une seule revue** : tribunal à trois voix (Claude, Gemini, juge neutre), verdicts dans `docs/reviews/INDEX.md`.
4. **Arrêt et gel** : un pari sans progrès mesuré sur deux revues est gelé (`status = frozen` dans ce fichier) ; ses forks restent synchronisés par `ay upstream`, rien n'est supprimé sans export.

## Lettre du fondateur

TODO(owner) : texte de la lettre, publié tel quel en tête d'aphrody.com (`apps/aphrody/src/holding/page.ts` le rend dès que ce marqueur disparaît).

## Investisseurs et contact

TODO(owner) : relations investisseurs (texte et adresse dédiée éventuelle). Contact public : contact@aphrody.com.
