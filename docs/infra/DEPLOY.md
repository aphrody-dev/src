# Déploiement, mise à l'échelle et retour arrière de src

Source unique : `infra/deploy.toml` (`[services.*]` placement et ports blue/green, `[hosting.*]` cible cf | vercel | vps,
`[containers]` images). Rendu par cible : `bun scripts/deploy-target.ts <app> <cf|vercel|vps>`. Images :
`infra/docker/` (Dockerfile, `docker-bake.hcl`, `compose.yaml`, `smoke.sh`), CI `.github/workflows/images.yml`.
Versions des outils : `packages/machine/toolchains.lock.toml` (généré par `scripts/toolchains-lock.ts`). Outils upstream
retenus par brique (versions, commits sources) : [UPSTREAM-STACK.md](UPSTREAM-STACK.md). Aucun moteur maison : `ay deploy <sub>`
= `just docker-<sub>`.

## Rôles de la flotte

| Hôte | Rôle | Installé par | Moteur de conteneurs |
|---|---|---|---|
| PC (Windows 11) | dev, aucune build lourde | winget/officiels, `packages/machine` | aucun local (pas de WSL) : contextes `fr1` (ssh://vps), `prd`, `fr2` |
| prd (USA, Arch) | backends de prod uniquement, aucun compilateur | `just fleet-bootstrap prd` (purge go, zig, .NET, cargo-zigbuild, cbindgen, nextest, builder buildx) | Docker 29.9 + compose, images tirées de GHCR |
| fr1 (Ubuntu) | usine : Chromium/LLVM, builds d'images, CI (runner `fr1`), training, agents lourds | `just fleet-bootstrap fr1` | Docker 29.7, buildx `aphrody` (docker-container, 4 CPU / 12 Gio, amd64+arm64 via binfmt) |
| fr2 (Ubuntu) | edge : nginx, CDN, cloudflared | `just fleet-bootstrap fr2` | Docker (`ip-forward-no-drop`, `live-restore`), profil `edge` |

## Matrice par service

| Service | Production actuelle | Alternatives rendues | Échelle horizontale | État | Retour arrière (une ligne) |
|---|---|---|---|---|---|
| aphrody (aphrody.com) | CF Worker (`apps/aphrody/wrangler.toml`), `/api/*`, `/g/*`, `/search` en origine prd | image `aphrody` (`core`, 23000) | Worker : automatique ; conteneur : `--scale aphrody=N` derrière l'upstream nginx | aucun (dist/ dans l'image) | `bunx wrangler rollback -c apps/aphrody/wrangler.toml` ; conteneur : `SRC_TAG=<sha> just docker-up` |
| aphrody-app (aphrody.app) | CF (`apps/aphrody-app/wrangler.toml`) | — | automatique | KV/R2 Cloudflare | `bunx wrangler rollback -c apps/aphrody-app/wrangler.toml` |
| downloads / cdn | CF Workers `downloads-portable`, `cdn-portable` (R2) | image `r2-site` (`edge`, 28797/28796, `STORAGE=s3`) | sans état : N répliques, fr2 + prd | R2 (bucket), rien en local | `bunx wrangler rollback --name downloads-portable` ; conteneur : `SRC_TAG=<sha> just docker-up edge fr2` |
| api.aphrody.com | CF Worker `api-aphrody-com` | image `api-gateway` (`infra/fleet/workers/selfhost.ts`, R2 via S3) | sans état | R2 | `bunx wrangler rollback --name api-aphrody-com` |
| yolo | prd (`vps_exec`) | image `yolo` (23092) | une instance (graphe .yolo local) | `.yolo/` (régénérable) | `SRC_TAG=<sha> just docker-up` |
| ai-os relay | prd, unité utilisateur `aphrody-relay` (8790/8791) | image `ai-os` (28790/28791) | une instance par jeton/home | volume `ai-os-home` (jeton, sessions) | `systemctl --user restart aphrody-relay` (bleu) ; conteneur : `SRC_TAG=<sha> just docker-up` |
| ai-os gateway | — (nouveau) | image `ai-os`, `bun src/cli.ts gateway` (24000) | N instances si `AGENT_GATEWAY_TOKEN` commun, état par home | volume `ai-os-home` | `SRC_TAG=<sha> just docker-up` |
| llama.cpp | PC (Vulkan, RTX 4070), prd CPU | image amont `ghcr.io/ggml-org/llama.cpp:server-b12316` épinglée par digest (`ai`) | verticale (RAM/GPU) ; plusieurs modèles = plusieurs services | volume `llama-models` (GGUF, lecture seule) | changer le digest dans `compose.yaml`, `just docker-up ai` |
| rust-stack | prd (`rust-daemon`) | image `rust-stack` (24100) | une instance (SQLite) | volume `rust-stack-data` | `SRC_TAG=<sha> just docker-up` |
| ring3-agent (r3d) | prd (`rust-daemon`) | image `r3d` (28080) | sans état réseau : N | aucun | `SRC_TAG=<sha> just docker-up` |
| loreserver | prd systemd `loreserver` (41339 sur le maillage) | image `loreserver` (31339, 31337/udp) | un écrivain ; lecteurs par réplicas du stockage | `/data` (volume `lore-data`) + sauvegarde R2 | `just lab-deploy-loreserver` (binaire précédent) ou `SRC_TAG=<sha> just docker-up` |
| shenron | prd, compose produit (`/srv/shenron`) | `just docker-products` (lanes + image `shenron`) | défini par le produit | Postgres/Redis produit | compose produit, tag précédent |
| rosegriffon | prd, compose produit (`rosegriffon-*`) | `just docker-products` (`RG_REGISTRY=ghcr.io/aphrody-labs/rosegriffon`) | défini par le produit | Postgres/Redis produit | `RG_TAG=<tag> docker compose -f apps/rosegriffon/compose.yaml up -d` |

Vercel : bloqué (softBlock depuis 06/2026) ; `scripts/deploy-target.ts <app> vercel` reste rendu pour la portabilité,
aucune production n'y est placée.

## Procédure

1. `just toolchains-lock` si une version change, puis `just fleet-bootstrap fr1` (usine) et `just fleet-bootstrap prd`
   (runtime seul) ; idempotents, ils vérifient les versions.
2. Images : push sur `main` → `images.yml` (amd64+arm64, cache registre partagé) ; ou depuis le PC `just docker-build`
   (`gh workflow run images.yml`, push par `GITHUB_TOKEN`). Build manuel sur l'usine : `ssh vps aphrody-heavy docker buildx bake --builder aphrody …`.
3. Test avant bascule : `just docker-smoke` (job smoke d'`images.yml` : healthcheck de chaque image), puis
   `just docker-up core prd` : les conteneurs écoutent sur les ports verts en 127.0.0.1, les services actuels gardent
   les ports bleus. Vérifier `curl -fsS http://127.0.0.1:<port vert>/<health>` sur l'hôte.
4. Bascule : l'upstream nginx/HAProxy du domaine passe du port bleu au vert (vhost nginx, `infra/cluster`,
   [CLUSTER.md](CLUSTER.md)), puis `curl --resolve <domaine>:443:<ip> -fsS https://<domaine>/<health>`, puis `curl -sS -o /dev/null -w '%{http_code}' https://<domaine>/` depuis le PC.
5. Retour arrière : remettre l'upstream sur le port bleu, ou `SRC_TAG=<sha précédent> just docker-up`.

## Règles

- Aucun secret dans une image, `compose.yaml` ou le dépôt : `env_file` `/etc/aphrody/secrets.env` sur l'hôte
  (`required: false`), DPAPI/env-kit sur le PC.
- Images : utilisateur non root, `read_only`, `cap_drop: ALL`, `no-new-privileges`, HEALTHCHECK, journal `local`
  borné, limite mémoire par service.
- Rust : cargo-chef (couche dépendances) + cargo-zigbuild, binaires musl statiques amd64/arm64 depuis un seul
  builder natif ; runtime Alpine. Bun : `bun install --frozen-lockfile`, serveur empaqueté (`bun build`) + `dist/`.
- Pas de Debian dans les images de src (Alpine / Arch) ; seules les images amont épinglées (llama.cpp) et les
  produits (shenron, rosegriffon) gardent leur base.

## État vérifié (2026-11-13)

- Outils : `toolchains.lock.toml` résolu sans erreur (30 entrées, sommes amont). PC : nightly-2026-11-12
  (rustc 3ef0c22cd, LLVM 23.1.5 = clang 23.1.5), .NET SDK 11.0.100, git-lfs 3.8.0, cbindgen 0.29.4, CMake 4.4.5,
  FFmpeg 9.0.2 shared (`FFMPEG_DIR`), contexte Docker `prd` par défaut. prd : go 1.27.4, zig 0.17.1, dotnet 11.0.100,
  cargo-zigbuild 0.24.1, builder buildx `aphrody` (amd64 + arm64). fr1 : sccache 0.19.0, just 1.59.0, nightly épinglée.
  fr2 : Docker activé (`ip-forward-no-drop`, FORWARD reste ACCEPT).
- Images Bun (`ai-os` relais et gateway, `aphrody`, `r2-site`, `api-gateway`) : healthy en smoke (non-root, rootfs en
  lecture seule). Compose `core` sur prd (ports verts) et `edge` sur fr2 : healthy ; `api-gateway` et `downloads`
  auto-hébergés servent les mêmes objets R2 que les Workers (`SHA256SUMS.txt` 90 o des deux côtés).
- Images Rust : construites par `images.yml` (GitHub, amd64 + arm64) ; ne pas les construire sur prd quand sa charge
  dépasse 8 (builds `cargo` d'autres agents : charge 190-240 observée le 2026-11-13).
- Push GHCR depuis le PC/prd : le jeton `gh` actuel n'a pas `write:packages` ; `images.yml` pousse avec `GITHUB_TOKEN`.
  Pour pousser hors CI : `gh auth refresh -s write:packages` puis `gh auth token | docker login ghcr.io -u aphrody-dev --password-stdin`.
