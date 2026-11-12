# Sovereign GitLab & Tri-Forge Infrastructure (`infra/gitlab`)

Production deployment manifests, Omnibus configuration, Arch Linux / CachyOS / Omarchy CI builder image, and Tri-Forge bootstrap scripts uniting **GitHub**, **GitLab**, and **Google Cloud Git** across all 26 `C:\src` repositories.

## 1. Tri-Forge Topology

Every repository in `C:\src` (root `src` + 25 submodules = 26 repositories) maintains synchronized Git remotes managed via `@aphrody/forge` (`frg`):

- `origin` (**GitHub**): `https://github.com/aphrody-dev/<repo>.git`
- `gitlab` (**GitLab SaaS**): `https://gitlab.com/aphrody-dev/<repo>.git`
- `gitlab-self` (**Sovereign GitLab CE on OVH `fr2`**): `https://git.aphrody.com/aphrody/<repo>.git` (owner `contact@aphrody.com`, SSH `:2224`, OCI Registry `registry.aphrody.com`)
- `google` (**Google Cloud Git — GCP `aphrody` `#468000409790`**): `https://source.developers.google.com/p/aphrody/r/<repo>` + Developer Connect (`projects/aphrody/locations/europe-west1/connections/aphrody-triforge`)
- `all` (**Multi-Forge Push Fanout**): pushes simultaneously to `origin`, `gitlab`, and `google`.

## 2. Directory Layout

- `docker-compose.gitlab.yml` — Sovereign GitLab CE Omnibus (`git.aphrody.com`) + Docker CI Runner + `archlinux-pkgctl` Runner.
- `gitlab.rb` — Memory-tuned Omnibus configuration for OVH `fr2` (< 3.2 GB RSS), Puma (2 workers), Sidekiq (concurrency 8), Prometheus disabled, Container & Package Registries enabled, and SMTP wired to Stalwart (`mail.aphrody.com` / `contact@aphrody.com`).
- `arch-ci/Dockerfile.arch-builder` — Arch Linux + CachyOS `x86-64-v3` repo + `devtools` (`pkgctl`) + `mkinitcpio` + Rust + Bun + Go CI container for building `.pkg.tar.zst` packages and WSL2 `.wsl` rootfs images.
- `setup-triforge.ps1` / `setup-triforge.sh` — Cross-platform bootstrap scripts for `gh`, `glab`, `gcloud`, and `frg` without exposing secrets.

## 3. CLI Operations (`frg`)

```powershell
# Audit or apply remotes across all 26 C:\src repositories
frg remotes
frg remotes --apply

# Provision GitLab group, projects, branch protections (main + dev), and registries
frg gitlab-init --dry-run
frg gitlab-init

# Configure GCP 'aphrody' Developer Connect, Cloud Source Repositories & credential helper
frg google-git-init --dry-run
frg google-git-init

# Synchronize main & dev across GitHub, GitLab, and Google Git
frg tri-sync --dry-run --forge all
frg tri-sync --forge all

# Audit & fetch Arch Linux GitLab, CachyOS, and Omacom/Omarchy upstream repositories
frg arch-upstreams
frg arch-upstreams --sync
```

## 4. Deploying Sovereign GitLab on OVH `fr2`

```bash
export GITLAB_ROOT_PASSWORD="<from-sovereign-vault>"
export STALWART_SMTP_PASSWORD="<from-sovereign-vault>"

docker compose -f docker-compose.gitlab.yml build gitlab-runner-arch-pkgctl
docker compose -f docker-compose.gitlab.yml up -d
```

Reverse-proxy `git.aphrody.com` to `127.0.0.1:8929` and `registry.aphrody.com` to `127.0.0.1:5050` via Caddy or Cloudflare Tunnel (`infra/mesh-vn`). SSH Git traffic listens on TCP `:2224`.
