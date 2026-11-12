#!/usr/bin/env bash
# End-to-end Tri-Forge bootstrap for Linux / WSL2 / OVH FR2 VPS
# Covers GitHub (gh), GitLab (glab / git.aphrody.com), and Google Cloud Git (gcloud project 'aphrody' #468000409790).
# Strictly zero secret values echoed to stdout/stderr.

set -euo pipefail

SRC_ROOT="${SRC_ROOT:-/mnt/c/src}"
if [[ ! -d "$SRC_ROOT" && -d "/workspace" ]]; then
  SRC_ROOT="/workspace"
fi
GCP_PROJECT="${GCP_PROJECT:-aphrody}"
GCP_REGION="${GCP_REGION:-europe-west1}"
GCLOUD_CONFIG="${GCLOUD_CONFIG:-org-contact}"
DRY_RUN="${DRY_RUN:-0}"

echo "[Tri-Forge Setup] Initializing Sovereign Tri-Forge across ${SRC_ROOT}"

# 1. Load .env safely without printing values
if [[ -f "${SRC_ROOT}/.env" ]]; then
  while IFS='=' read -r key val; do
    key="$(echo "${key:-}" | xargs)"
    if [[ -z "$key" || "$key" == \#* ]]; then
      continue
    fi
    val="${val%\"}"
    val="${val#\"}"
    val="${val%\'}"
    val="${val#\'}"
    if [[ -z "${!key:-}" ]]; then
      export "${key}=${val}"
    fi
  done < "${SRC_ROOT}/.env"
  echo "[Tri-Forge Setup] Loaded environment keys from ${SRC_ROOT}/.env (values redacted)"
fi

# 2. Verify CLI binaries
for tool in git bun gh glab gcloud; do
  if command -v "$tool" >/dev/null 2>&1; then
    echo "[Tri-Forge Setup] Verified tool: ${tool} -> $(command -v "$tool")"
  else
    echo "[Tri-Forge Setup] Optional tool not on PATH: ${tool}"
  fi
done

# 3. Configure Google Cloud Git credential helper
git config --global credential.https://source.developers.google.com.helper gcloud.sh
echo "[Tri-Forge Setup] Configured git credential helper for source.developers.google.com -> gcloud.sh"

# 4. Run frg Tri-Forge orchestration
cd "${SRC_ROOT}/packages/forge"
if [[ "$DRY_RUN" == "1" ]]; then
  bun run src/cli.ts remotes
  bun run src/cli.ts gitlab-init --dry-run
  bun run src/cli.ts google-git-init --dry-run
else
  bun run src/cli.ts remotes --apply
  bun run src/cli.ts gitlab-init
  bun run src/cli.ts google-git-init
fi

bun run src/cli.ts arch-upstreams
echo "[Tri-Forge Setup] Completed cleanly."
