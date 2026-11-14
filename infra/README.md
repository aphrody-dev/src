# infra/

Infrastructure de src, assemblée à partir d'outils upstream (aucun moteur de déploiement maison). Correspondance
brique → outil, versions et commits sources : [docs/infra/UPSTREAM-STACK.md](../docs/infra/UPSTREAM-STACK.md).

| Dossier       | Contenu                                                                                              | Outil upstream                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `deploy.toml` | flotte, placement des services, hébergement, auth, images                                            | lu par `packages/deploy/src/deploy-target.ts`, `infra/cluster/gen.ts`, `packages/env-kit` |
| `docker/`     | `Dockerfile`, `docker-bake.hcl`, `compose.yaml`, `smoke.sh`                                          | docker buildx bake, docker compose                                            |
| `cluster/`    | LB, failover, mesh mTLS 7444 ([CLUSTER.md](../docs/infra/CLUSTER.md))                                | HAProxy, nginx                                                                |
| `cloudflare/` | zone, tunnels, WAF, Access ([FR2-CLOUDFLARE.md](../docs/infra/FR2-CLOUDFLARE.md))                    | API Cloudflare, `cf`, wrangler                                                |
| `fleet/`      | bootstrap idempotent des hôtes (`just fleet-bootstrap <fr1, prd ou fr2>`), unités systemd, nginx fr2 | systemd, nginx, WireGuard, cloudflared                                        |
| `agents/`     | runner d'agents de la flotte                                                                         | systemd                                                                       |

Rôles : fr1 (`ssh vps`) = usine (builds, CI, training, agents lourds) ; prd (`ssh prd`) = backends de prod sans
compilateur ; fr2 (`ssh cdn`) = edge. Procédure de déploiement et retour arrière : [docs/infra/DEPLOY.md](../docs/infra/DEPLOY.md).

```sh
just docker-build            # images amd64+arm64 -> ghcr.io/aphrody-labs (CI images.yml)
just docker-smoke            # build + healthcheck de chaque image (CI)
just deploy core prd         # compose pull + up --wait ; retour : SRC_TAG=<sha> just docker-up core prd
just fleet-bootstrap fr1     # toolchains épinglées (tools.toml)
```
