# Aphrody Multi-Google Cloud (`gcloud`) 3-Principal Sharing & IAM Architecture

Canonical multi-account Google Cloud identity and IAM sharing reference for GCP project `aphrody` (`#468000409790`).

## 1. Three-Principal + Automation Matrix (`aphrody` `#468000409790`)

| Alias   | Principal Email                                   | `gcloud` Config | Regions (`compute` / `ai`)     | Scope & IAM Roles                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :------ | :------------------------------------------------ | :-------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai`    | `<ai-google>`                                     | `ai-agent`      | `europe-west1` / `us-central1` | Dedicated autonomous AI account for `ai-os`, `triad`, `pi-opencode`, Gemini, Spark, Hermes, OpenClaw, Google Drive (`rclone` remote `gdrive-ai`), NotebookLM, Vertex AI, and Cloud Build sandboxes. Bound to `roles/aiplatform.user`, `roles/serviceusage.serviceUsageConsumer`, `roles/artifactregistry.writer`, `roles/cloudbuild.builds.editor`, `roles/developerconnect.user`, `roles/storage.objectAdmin`, `roles/logging.logWriter`. |
| `owner` | `<owner-google>`                                  | `owner`         | `europe-west1`                 | Personal developer and root owner of GCP project `aphrody` (`#468000409790`). Bound to `roles/owner`.                                                                                                                                                                                                                                                                                                                                      |
| `org`   | `contact@aphrody.com`                             | `org-contact`   | `europe-west1`                 | Organization and production infrastructure master identity across Google Workspace, Cloudflare, GitHub (`aphrody-dev`), GitLab (`aphrody-dev` / `git.aphrody.com`), OVH (`fr1`, `fr2`), Hostinger (`usa`), Vercel, Supabase, and `mail.aphrody.com`. Bound to `roles/editor`, `roles/run.admin`, `roles/dns.admin`, `roles/secretmanager.admin`.                                                                                           |
| `sa`    | `yolo-automation@aphrody.iam.gserviceaccount.com` | `sa-automation` | `europe-west1`                 | Headless NHITL CI/CD service account in GCP project `aphrody`. Bound to `roles/editor`, `roles/developerconnect.admin`, `roles/artifactregistry.admin`.                                                                                                                                                                                                                                                                                    |

## 2. Non-Clobbering Process Isolation for Autonomous Agents

Autonomous daemons and agent harnesses (`ai-os`, `triad`, `pi-opencode`, Spark, Hermes, OpenClaw) must never mutate the global active `gcloud` configuration file (`~/.config/gcloud/active_config`) used in human interactive terminals.

Use `getIsolatedGcloudEnv('ai')` from `@aphrody/env-kit`:

```ts
import { getIsolatedGcloudEnv } from "@aphrody/env-kit";

const childEnv = getIsolatedGcloudEnv("ai");
// Sets CLOUDSDK_ACTIVE_CONFIG_NAME="ai-agent", CLOUDSDK_CORE_PROJECT="aphrody",
// CLOUDSDK_CORE_ACCOUNT="<ai-google>", CLOUDSDK_AI_REGION="us-central1",
// APHRODY_RCLONE_REMOTE="gdrive-ai", without touching global active_config.
```

## 3. CLI Operations via `env-kit accounts`

```powershell
# Inspect all 4 gcloud configurations, OAuth token status, rclone gdrive-ai, and 10 org surfaces:
env-kit accounts status
env-kit accounts status --json

# Idempotently create/update ai-agent, owner, org-contact, and sa-automation:
env-kit accounts init-gcloud

# Switch interactive shell configuration:
env-kit accounts switch ai
env-kit accounts switch owner
env-kit accounts switch org
env-kit accounts switch sa

# Print exact idempotent IAM policy binding commands:
env-kit accounts iam-bindings
```

## 4. Onboarding & IAM Policy Provisioning

Run as root owner (`<owner-google>` via `--configuration=owner`):

### Windows PowerShell

```powershell
# Preview all API enablements and IAM bindings without mutating GCP:
pwsh -NoProfile -File C:\src\infra\gcloud\share-aphrody-project-iam.ps1 -DryRun

# Execute live against project aphrody (#468000409790):
pwsh -NoProfile -File C:\src\infra\gcloud\share-aphrody-project-iam.ps1
```

### Linux / WSL2 Bash

```bash
# Dry-run preview:
bash /mnt/c/src/infra/gcloud/share-aphrody-project-iam.sh --dry-run

# Live execution:
bash /mnt/c/src/infra/gcloud/share-aphrody-project-iam.sh
```

## 5. Interactive One-Time OAuth & ADC Token Caching

```powershell
# Autonomous AI principal (Gemini, Spark, Hermes, OpenClaw):
gcloud auth login <ai-google> --configuration=ai-agent
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "ai-agent"
gcloud auth application-default login --project=aphrody

# Organization principal (Google Workspace / Production Infra):
gcloud auth login contact@aphrody.com --configuration=org-contact
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "org-contact"
gcloud auth application-default login --project=aphrody
```

## Cloud Build

Supprimé le 2026-11-13 (doublon Debian de `.github/workflows/images.yml` vers Artifact Registry ; registre unique `ghcr.io/aphrody-labs`, docs/infra/UPSTREAM-STACK.md). Retour arrière : `git checkout <sha>~ -- infra/gcloud/cloudbuild.yaml`.
