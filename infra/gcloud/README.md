# Aphrody Multi-Google Cloud (`gcloud`) 3-Principal Sharing & IAM Architecture

Canonical multi-account Google Cloud identity and IAM sharing reference for GCP project `aphrody` (`#468000409790`).

## 1. Three-Principal + Automation Matrix (`aphrody` `#468000409790`)

| Alias | Principal Email | `gcloud` Config | Regions (`compute` / `ai`) | Scope & IAM Roles |
| :--- | :--- | :--- | :--- | :--- |
| `ai` | `yoyo.aphrody@gmail.com` | `ai-yoyo` | `europe-west1` / `us-central1` | Dedicated autonomous AI account for `ai-os`, `triad`, `pi-opencode`, Gemini, Spark, Hermes, OpenClaw, Google Drive (`rclone` remote `gdrive-yoyo`), NotebookLM, Vertex AI, and Cloud Build sandboxes. Bound to `roles/aiplatform.user`, `roles/serviceusage.serviceUsageConsumer`, `roles/artifactregistry.writer`, `roles/cloudbuild.builds.editor`, `roles/developerconnect.user`, `roles/storage.objectAdmin`, `roles/logging.logWriter`. |
| `owner` | `yohanpierre15@gmail.com` | `owner-yohan` | `europe-west1` | Personal developer and root owner of GCP project `aphrody` (`#468000409790`). Bound to `roles/owner`. |
| `org` | `contact@aphrody.com` | `org-contact` | `europe-west1` | Organization and production infrastructure master identity across Google Workspace, Cloudflare, GitHub (`aphrody-dev`), GitLab (`aphrody-dev` / `git.aphrody.com`), OVH (`fr1`, `fr2`), Hostinger (`usa`), Vercel, Supabase, and `mail.aphrody.com`. Bound to `roles/editor`, `roles/run.admin`, `roles/dns.admin`, `roles/secretmanager.admin`. |
| `sa` | `yolo-automation@aphrody.iam.gserviceaccount.com` | `sa-automation` | `europe-west1` | Headless NHITL CI/CD service account in GCP project `aphrody`. Bound to `roles/editor`, `roles/developerconnect.admin`, `roles/artifactregistry.admin`. |

## 2. Non-Clobbering Process Isolation for Autonomous Agents

Autonomous daemons and agent harnesses (`ai-os`, `triad`, `pi-opencode`, Spark, Hermes, OpenClaw) must never mutate the global active `gcloud` configuration file (`~/.config/gcloud/active_config`) used in human interactive terminals.

Use `getIsolatedGcloudEnv('ai')` from `@aphrody/env-kit`:

```ts
import { getIsolatedGcloudEnv } from "@aphrody/env-kit";

const childEnv = getIsolatedGcloudEnv("ai");
// Sets CLOUDSDK_ACTIVE_CONFIG_NAME="ai-yoyo", CLOUDSDK_CORE_PROJECT="aphrody",
// CLOUDSDK_CORE_ACCOUNT="yoyo.aphrody@gmail.com", CLOUDSDK_AI_REGION="us-central1",
// APHRODY_RCLONE_REMOTE="gdrive-yoyo", without touching global active_config.
```

## 3. CLI Operations via `env-kit accounts`

```powershell
# Inspect all 4 gcloud configurations, OAuth token status, rclone gdrive-yoyo, and 10 org surfaces:
env-kit accounts status
env-kit accounts status --json

# Idempotently create/update ai-yoyo, owner-yohan, org-contact, and sa-automation:
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

Run as root owner (`yohanpierre15@gmail.com` via `--configuration=owner-yohan`):

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
gcloud auth login yoyo.aphrody@gmail.com --configuration=ai-yoyo
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "ai-yoyo"
gcloud auth application-default login --project=aphrody

# Organization principal (Google Workspace / Production Infra):
gcloud auth login contact@aphrody.com --configuration=org-contact
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "org-contact"
gcloud auth application-default login --project=aphrody
```

## Cloud Build

The build config is `infra/gcloud/cloudbuild.yaml` (moved out of the repository root on 2026-11-13). Triggers must name it: `gcloud builds triggers update <trigger> --build-config=infra/gcloud/cloudbuild.yaml`; manual run: `gcloud builds submit --config infra/gcloud/cloudbuild.yaml .`.
