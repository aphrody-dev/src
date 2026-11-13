# Stack upstream de l'infra aphrody (2026-11-13)

Règle maison : assembler les meilleures briques upstream, aucun moteur maison. Chaque version ci-dessous a été lue le
2026-11-13 avec `gh api repos/<o>/<r>` (licence, `pushed_at`, archivé), `gh api repos/<o>/<r>/releases/latest` et
`gh api repos/<o>/<r>/git/ref/tags/<tag>` (tag annoté déréférencé par `git/tags/<sha>`) ; les MCP github et context7 étaient
injoignables (ENOTFOUND). « commit » = commit pointé par le tag de la release citée (12 caractères), pas la tête de branche.
Critère de rétention : release ou commit de moins de 6 mois, dépôt non archivé, licence OSI permissive ou copyleft faible
(MPL-2.0) ; AGPL et BUSL écartées. La colonne « outil » donne la release upstream de référence ; l'épingle réellement
déployée est celle de `tools.toml` (écarts listés au §3).

Rôles de la flotte (décision du 2026-11-13) : **fr1** (`ssh vps`) = usine (builds, CI, training, agents lourds) ;
**prd** (`ssh prd`, USA) = backends de prod uniquement, sans compilateur ; **fr2** (`ssh cdn`) = edge uniquement.

## 1. Brique → outil retenu

Une ligne par brique : version et commit source, raison, code maison remplacé, migration / retour arrière.

| Brique | Outil retenu (version, commit) | Raison | Remplace dans notre code | Migration ; retour arrière (une ligne) |
|---|---|---|---|---|
| Build d'images | docker/buildx v0.39.0 (`360040a78d61`) + moby/buildkit v0.35.0 (`f55949dea4f0`) ; CI docker/bake-action v7.5.0 (`59cb1203cd42`), setup-buildx-action v4.4.1 (`f87e5991a6d7`), login-action v4.8.0 (`8aa5831fb8d4`) | `docker-bake.hcl` existe déjà (matrice amd64+arm64, cache registre, SBOM et provenance) | `infra/internal/oci` (layout OCI 1.1 sans démon + client HTTP Docker Engine en Go) et `src-deploy oci-pack` : supprimés ; builder buildx `aphrody` retiré de prd, recréé sur fr1 | `just docker-build` / `just docker-smoke` = `gh workflow run images.yml` (build puis job smoke) ; build manuel sur l'usine : `ssh vps docker buildx bake --builder aphrody …` ; retour : `git revert <sha>` |
| Déploiement | docker/compose v5.7.1 (`fb1fd129f868`) sur moby v29.9.3 (`70efc0e31da3`) | `compose up -d --wait` attend les HEALTHCHECK, profils `core`/`edge`, `SRC_TAG` = retour arrière. Limite : compose recrée le conteneur (arrêt puis démarrage), pas de blue/green ni de retour automatique ; le zéro-coupure tient aux ports verts (compose) à côté des ports bleus et à la bascule nginx/HAProxy après `curl --resolve` | `src-deploy detect/plan/up/caddyfile` (Go, 4 300 lignes), unités `sovereign-*@.service` blue/green générées, `infra/generated/{Caddyfile,deploy-plan.json}` : supprimés ; `ay deploy <sub>` → `just docker-<sub>` | `just deploy [profil] [hôte]` ; retour : `SRC_TAG=<sha précédent> just docker-up <profil> <hôte>` |
| Registre OCI | GHCR `ghcr.io/aphrody-labs` ; repli auto-hébergé : distribution/distribution v3.1.2 (`3220848f15d9`) ou project-zot/zot v2.1.23 (`d7915e82e669`), non déployés ; copie/inspection : regclient v0.11.7, skopeo v1.25.1 | push par `GITHUB_TOKEN` en CI, aucun service à opérer | Artifact Registry `bunos` + `infra/gcloud/cloudbuild.yaml` (images Debian, doublon d'`images.yml`) : supprimés | déjà en place ; seul le fichier de pipeline est supprimé, le dépôt Artifact Registry `bunos` n'est pas touché ; retour : `git checkout <sha>~ -- infra/gcloud/cloudbuild.yaml` |
| CI | GitHub Actions + runner auto-hébergé fr1 (`self-hosted,Linux,X64,fr1,build`, en ligne sur aphrody-labs/src) ; local : nektos/act v0.2.97 | source unique `.github/workflows` ; fr1 = usine | `verify-go-infra` (Cloud Build) supprimé ; `go test ./...` retiré de `just verify-all` | rien à migrer ; retour : `git revert <sha>` |
| Workers / edge functions | cloudflare/workerd v1.20261113.1 (`6cd7d1ae6382`), wrangler 4.161.0 (workers-sdk, tag `wrangler@4.161.0` = `1e688baedfe8`), workers-rs v0.9.0 (`fcc2fae203cf`), CLI `cf` 1.0.0-beta.31 (cloudflare/cf, `4dd33739da3c`), agents 0.33.0 | Workers existants (aphrody, aphrody-app, r2-site, api) ; `cf` hors projets Wrangler | `infra/internal/providers/cloudflare.go` (client REST v4 + upload de Workers en Go) : supprimé | inchangé (wrangler/cf) ; retour : `bunx wrangler rollback -c <wrangler.toml>` |
| Proxy (origine L7) | nginx (distro 1.29 ; upstream nginx/nginx release-1.31.8, `140aa9427118`) | déjà sur les 3 hôtes, vhosts + caches de la couche cluster | générateur de Caddyfile HTTP/3 (`providers/vps.go`) : supprimé, Caddy n'était installé sur aucun VPS (vérifié) | rien ; retour : `git revert <sha>` |
| Edge, cache/CDN | Cloudflare (anycast, cache de zone, WAF, R2) | voir [FR2-CLOUDFLARE.md](FR2-CLOUDFLARE.md) (chantier fr2) | — | référence |
| LB, mesh, dédup | HAProxy (dernière branche stable taguée v3.4.0 ; HAProxy 3.4 en service) mTLS TCP 7444 + WireGuard noyau | voir [CLUSTER.md](CLUSTER.md) (chantier cluster) | — | référence |
| Tunnel | cloudflare/cloudflared 2026.11.0 (`b0297f0b24c6`, publié le 2026-11-12) | connecteurs existants (prd `mig-prd`/`prod`, fr2) | — | épingle du lock : 2026.10.7, montée proposée au chantier fr2 (§3) |
| TLS / ACME | certificats edge Cloudflare + Origin CA ; certbot v5.10.0 sur fr2 pour les origines restantes ; rustls v/0.23.46 dans le code Rust ; alternative go-acme/lego v5.6.0 | Cloudflare termine le TLS public, aucune ACME à opérer sur prd | plan Let's Encrypt de Caddy (`src-deploy`) : supprimé | rien ; retour : `git revert <sha>` |
| Secrets | systemd-creds (systemd v262.2) + `ay secret` (DPAPI sur le PC), `/etc/aphrody/secrets.env` en `env_file`, gh secrets + OIDC (GCP WIF) | déjà câblé ([AUTH.md](AUTH.md)), aucun serveur à opérer ; limite : un `env_file` est visible par `docker inspect` (voir §3) ; sops v3.13.3 / age v1.3.2 non requis (aucun secret dans le dépôt) ; OpenBao v2.7.2 écarté (service en plus) | `infra/internal/envvault` (chargeur .env masqué en Go) : supprimé, doublon de `packages/env-kit` | rien ; retour : `git revert <sha>` |
| Stockage objet | Cloudflare R2 (API S3) + rclone v1.76.0 (`e982ff36668f`) ; repli auto-hébergé : rustfs 1.0.5 (`34e6449ed90e`, Apache-2.0), non déployé ; Garage v2.5.0 écarté (AGPL-3.0) | R2 = production actuelle ; RustFS = S3 en Rust sous licence permissive | signeur S3v4 R2 en Go (`providers/cloudflare.go`) : supprimé ; `api-gateway`/`r2-site` restent sur l'API S3 | rien ; retour : `git revert <sha>` |
| Observabilité / logs | **cible, non déployée** : vectordotdev/vector v0.61.0 (`17e017e3c07b`, MPL-2.0) en agent sur chaque hôte (journald, `docker_logs`, `/metrics`) → VictoriaMetrics v1.156.0 (`0c1bf87a0c98`, Apache-2.0) pour les métriques et VictoriaLogs v1.53.0 (Apache-2.0) pour les logs, sur fr1 dans une tranche systemd plafonnée (`MemoryMax`, `CPUWeight` bas) ; aujourd'hui journald + pilote de logs `local` + `/metrics` HAProxy (stats 19900) | un binaire Rust par hôte, rien de lourd sur prd ni fr2 (rôles) ; Loki v3.7.9 écarté (AGPL-3.0) ; VictoriaMetrics ne stocke pas de logs, d'où VictoriaLogs | — | à faire : unité vector sur fr1 d'abord ; retour : `systemctl disable --now vector` |
| Bundling monorepo | oven-sh/bun bun-v1.4.4 (`38afee6c84fc`, `bun build`, workspaces, `--compile`) + `just` + cargo | règle globale : bun remplace les bundlers JS | — | rien |
| Vercel (softBlock) | aucun outil retenu ; OSS consulté, utilisable sans déployer : vercel/ai (`146396263d28`, SDK IA), vercel/nft 1.11.1, vercel/ncc 0.45.0, vercel/turborepo v2.11.11, CLI `vercel` pour `env pull`/`inspect` | aucune production sur Vercel ; turborepo/nft/ncc écartés : bun workspaces + `bun build --compile` couvrent le besoin | `providers/vercel.go` (client API v13 en Go) : supprimé | `scripts/deploy-target.ts <app> vercel` reste un rendu de portabilité ; retour : sans objet |

Forks : aucun nouveau fork, tous les outils retenus sont consommés tels quels (binaires, images ou actions épinglées) ;
un fork n'est créé (skill gh-fork, `third_party/forks.txt`) que si un patch devient nécessaire.

## 2. Exécuté dans ce chantier (2026-11-13)

- Supprimé : `infra/cmd/src-deploy`, `infra/internal/{detect,envvault,oci,providers}`, `infra/cshared`, `infra/go.mod`,
  la partie Go d'`infra/ffi-bridge` (`index.ts`, `polyglot.test.ts`, crate `src/lib.rs`), `infra/generated/Caddyfile`,
  `infra/generated/deploy-plan.json`, `infra/generated/systemd/sovereign-*@.service`, `infra/gcloud/cloudbuild.yaml`,
  l'étape `src-deploy` de `tools.toml`, les recettes `deploy-plan` et `go test` de `verify-all`.
- `ay deploy <sub>` route vers `just docker-<sub>` (`crates/ay/src/lib.rs`, test unitaire mis à jour) ; `just deploy` =
  `just docker-up`.
- Builds déplacés de prd vers fr1 et la CI : `just docker-build` et `just docker-smoke` passent par `images.yml`, builder
  buildx `aphrody` créé sur fr1, contexte Docker `fr1` (`ssh://vps`) ajouté sur le PC. `infra/fleet/bootstrap/fr1.sh` installe go, zig, .NET, cargo-zigbuild, cargo-nextest,
  protoc, cbindgen, b3sum, wrangler/cf et le builder buildx `aphrody` (4 CPU / 12 Gio, Chromium garde la priorité) ;
  `prd.sh` n'installe plus que le runtime (Docker, compose, nginx, WireGuard, bun, cloudflared) ; go, zig et .NET
  rejoignent la purge « backends only » du chantier résilience/NHITL (commit 17a8f11 : workers REAPI, BuildKit,
  rustup, paquets de build, caches ; différée si un `cargo` ou un `buildx` tourne).
  `common.sh` : repli IPv4 dans `fetch` (fr1 reçoit un 404 de dl.google.com en IPv6).
- `scripts/toolchains-lock.ts` / `tools.toml` : `hosts` alignés sur les rôles (prd n'a plus
  rust, llvm, cmake, ninja, sccache, nextest, ffmpeg, go, zig, .NET, protoc, cbindgen, wrangler, cf).

## 3. Propositions aux autres chantiers (non appliquées)

- **Cluster** : Pingora 0.9.1 (`f86ffda5d3ae`, Apache-2.0) pourrait remplacer HAProxy + nginx shard (LB, cache, retries
  dans un seul process Rust, rechargement à chaud). Non recommandé maintenant : Pingora est une bibliothèque, il faudrait
  écrire et maintenir le binaire (code maison), alors que HAProxy couvre déjà mTLS, hachage cohérent et checks actifs.
- **Cluster** : `nativelink-worker` (TraceMachina/nativelink v1.8.5, `82149a27fd93`) tourne aussi sur fr2 (worker de build, contraire à
  « fr2 edge seul ») ; la purge de prd est faite par 17a8f11, fr2 reste à traiter.
- **Cluster / résilience** : les conteneurs `edge` (`downloads`, `cdn`, `api-gateway`) tournent aussi sur fr1 ; l'usine
  n'a pas à servir de trafic, retirer fr1 des membres edge ou lui garder un poids nul.
- **Résilience / agents** : des agents compilaient encore sur prd (`cargo test`/`cargo check` de root observés le
  2026-11-13) ; tant qu'ils tournent, la purge de `prd.sh` est différée : les router vers `ssh vps aphrody-heavy`.
- **Résilience / agents** : `agent_runner` (common.sh) échoue sur fr1 : `rm -f ~/.config/systemd/user/aphrody-agents*`
  rencontre le dossier `aphrody-agents.service.d` (« Is a directory ») ; `rm -rf` ou exclure les `.d`.
- **fr2 Cloudflare** : monter cloudflared 2026.10.7 → 2026.11.0 (release du 2026-11-12) dans `scripts/toolchains-lock.ts`
  puis `just fleet-bootstrap fr2|prd` (remplacement atomique du binaire, connecteurs redémarrés un par un).
- **Deps** : moby v29.9.3 et buildx v0.39.0 sont sortis (lock : docker-engine 29.9.2, buildx 0.38) ; nginx du lock = 1.29
  distro contre upstream 1.31.8.

- **Déploiement (ce chantier, suite)** : zéro-coupure et retour automatique par Wowu/docker-rollout v0.14 (MIT, actif
  2026-10-28 : démarre la nouvelle réplique, attend le HEALTHCHECK, retire l'ancienne ou avorte) ; épingler les images de
  prd par digest et consigner le tag précédent sur l'hôte (`/var/lib/aphrody/{current,previous}-tag`).
- **Résilience / auth** : passer les secrets des conteneurs de `env_file` à `secrets:` de compose (fichiers en tmpfs sous
  `/run/secrets`, absents de `docker inspect`).
- **CI / deps** : épingler les actions par SHA complet (bake-action, setup-buildx-action, login-action : commits des tags
  ci-dessus) ; `just docker-build` attend désormais le run (`gh run watch --exit-status`), `docker-smoke` à aligner.

## 4. Écartés à l'inventaire

| Dépôt | Motif (gh api, 2026-11-13) |
|---|---|
| minio/minio | archivé (`archived: true`), dernière release RELEASE.2025-10-15 |
| containrrr/watchtower | archivé ; fork actif nicholas-fedor/watchtower v1.24.0 écarté aussi (pull automatique hors du flux CI → smoke → up) |
| varnish/Varnish-Cache, varnishcache/varnish-cache | les deux dépôts GitHub sont archivés (gh api) ; cache = Cloudflare + nginx |
| cloudflare/boringtun | dernière release 2022-07 (boringtun-cli-0.5.2) ; WireGuard noyau déjà en place |
| cloudflare/foundations | dernière release v3.4.0 de 2024-10 (commits actifs) ; bibliothèque pour services Pingora, sans usage ici |
| basecamp/kamal v2.12.0, kamal-proxy | runtime Ruby en plus ; compose + healthchecks suffit |
| traefik v3.7.18, caddy v2.11.9 | actifs, mais nginx + HAProxy + Cloudflare couvrent déjà proxy, LB et TLS ; un 3e proxy serait un doublon |
| tailscale v1.104.7, headscale v0.29.7, nebula v1.12.0 | plan de contrôle en plus ; mesh = WireGuard + HAProxy mTLS (chantier cluster) |
| hashicorp/nomad v2.1.1 | Business Source License (fichier LICENSE lu ; `NOASSERTION` côté gh), non OSI |
| grafana/loki v3.7.9 | AGPL-3.0 et plus lourd que Vector + VictoriaMetrics |
| woodpecker v3.20.1, forgejo (hébergé sur Codeberg, non inventorié par gh) | la CI de référence est GitHub Actions |
| vercel/turborepo, ncc, nft, evanw/esbuild, rolldown | bun remplace (règle globale) |

## 5. Validation

Gemini 4 Carbon High (web, 2026-11-13) : 5/20, verdict et suites dans
[docs/reviews/gemini-2026-11-13-upstream-stack.md](../reviews/gemini-2026-11-13-upstream-stack.md).
