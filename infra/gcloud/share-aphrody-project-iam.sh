#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-aphrody}"
PROJECT_NUMBER="${PROJECT_NUMBER:-468000409790}"
OWNER_CONFIG="${OWNER_CONFIG:-owner}"
OWNER_EMAIL="${OWNER_EMAIL:-${APHRODY_OWNER_GOOGLE_ACCOUNT:?set APHRODY_OWNER_GOOGLE_ACCOUNT (vault)}}"
AI_EMAIL="${AI_EMAIL:-${APHRODY_AI_GOOGLE_ACCOUNT:?set APHRODY_AI_GOOGLE_ACCOUNT (vault)}}"
ORG_EMAIL="${ORG_EMAIL:-contact@aphrody.com}"
AUTOMATION_SA_NAME="${AUTOMATION_SA_NAME:-yolo-automation}"
AUTOMATION_SA_EMAIL="${AUTOMATION_SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
DRY_RUN="${DRY_RUN:-0}"

if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
fi

run_gcloud() {
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "[DRY-RUN] gcloud $*"
    return 0
  fi
  echo "[EXEC] gcloud $*"
  gcloud "$@"
}

echo "=== Aphrody Multi-Google Cloud IAM Sharing (${PROJECT_ID} #${PROJECT_NUMBER}) ==="

ensure_config() {
  local cfg_name="$1"
  local cfg_email="$2"
  local cfg_region="$3"
  local cfg_ai_region="${4:-}"

  if ! gcloud config configurations list --filter="name:${cfg_name}" --limit=1 --format="value(name)" --quiet 2>/dev/null | grep -Fxq "${cfg_name}"; then
    run_gcloud config configurations create "${cfg_name}" --no-activate --quiet
  fi

  run_gcloud config set core/project "${PROJECT_ID}" --configuration="${cfg_name}" --quiet
  run_gcloud config set run/region "${cfg_region}" --configuration="${cfg_name}" --quiet
  run_gcloud config set artifacts/location "${cfg_region}" --configuration="${cfg_name}" --quiet

  if [[ -n "${cfg_ai_region}" ]]; then
    run_gcloud config set ai/region "${cfg_ai_region}" --configuration="${cfg_name}" --quiet
  fi

  run_gcloud config set core/account "${cfg_email}" --configuration="${cfg_name}" --quiet
}

ensure_config "owner" "${OWNER_EMAIL}" "europe-west1" ""
ensure_config "ai-agent" "${AI_EMAIL}" "europe-west1" "us-central1"
ensure_config "org-contact" "${ORG_EMAIL}" "europe-west1" ""
ensure_config "sa-automation" "${AUTOMATION_SA_EMAIL}" "europe-west1" ""

SHARED_APIS=(
  "iam.googleapis.com"
  "cloudresourcemanager.googleapis.com"
  "aiplatform.googleapis.com"
  "generativelanguage.googleapis.com"
  "sourcerepo.googleapis.com"
  "developerconnect.googleapis.com"
  "cloudbuild.googleapis.com"
  "artifactregistry.googleapis.com"
  "run.googleapis.com"
  "secretmanager.googleapis.com"
  "drive.googleapis.com"
)

run_gcloud services enable "${SHARED_APIS[@]}" \
  --project="${PROJECT_ID}" \
  --configuration="${OWNER_CONFIG}" \
  --quiet

if ! gcloud iam service-accounts list \
  --project="${PROJECT_ID}" \
  --configuration="${OWNER_CONFIG}" \
  --filter="email:${AUTOMATION_SA_EMAIL}" \
  --limit=1 \
  --format="value(email)" \
  --quiet 2>/dev/null | grep -Fxq "${AUTOMATION_SA_EMAIL}"; then
  run_gcloud iam service-accounts create "${AUTOMATION_SA_NAME}" \
    --display-name="Aphrody NHITL Automation Service Account" \
    --description="Headless NHITL CI/CD service account for /src monorepo" \
    --project="${PROJECT_ID}" \
    --configuration="${OWNER_CONFIG}" \
    --quiet
fi

bind_role() {
  local member="$1"
  local role="$2"
  run_gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="${member}" \
    --role="${role}" \
    --condition=None \
    --configuration="${OWNER_CONFIG}" \
    --quiet
}

# 1. Owner Principal (${OWNER_EMAIL})
bind_role "user:${OWNER_EMAIL}" "roles/owner"

# 2. Autonomous AI Principal (${AI_EMAIL})
AI_ROLES=(
  "roles/aiplatform.user"
  "roles/serviceusage.serviceUsageConsumer"
  "roles/artifactregistry.writer"
  "roles/cloudbuild.builds.editor"
  "roles/developerconnect.user"
  "roles/storage.objectAdmin"
  "roles/logging.logWriter"
)
for r in "${AI_ROLES[@]}"; do
  bind_role "user:${AI_EMAIL}" "${r}"
done

# 3. Organization Principal (contact@aphrody.com)
ORG_ROLES=(
  "roles/editor"
  "roles/run.admin"
  "roles/dns.admin"
  "roles/secretmanager.admin"
)
for r in "${ORG_ROLES[@]}"; do
  bind_role "user:${ORG_EMAIL}" "${r}"
done

# 4. Headless Automation Service Account (yolo-automation@aphrody.iam.gserviceaccount.com)
SA_ROLES=(
  "roles/editor"
  "roles/developerconnect.admin"
  "roles/artifactregistry.admin"
)
for r in "${SA_ROLES[@]}"; do
  bind_role "serviceAccount:${AUTOMATION_SA_EMAIL}" "${r}"
done

cat <<EOF

=== Interactive One-Liners to Cache OAuth & ADC Tokens ===
# 1. Cache OAuth + ADC for autonomous AI principal (ai-agent -> ${AI_EMAIL} : Gemini, Spark, Hermes, OpenClaw):
gcloud auth login "${AI_EMAIL}" --configuration=ai-agent && CLOUDSDK_ACTIVE_CONFIG_NAME=ai-agent gcloud auth application-default login --project="${PROJECT_ID}"

# 2. Cache OAuth + ADC for organization infrastructure principal (org-contact -> ${ORG_EMAIL}):
gcloud auth login "${ORG_EMAIL}" --configuration=org-contact && CLOUDSDK_ACTIVE_CONFIG_NAME=org-contact gcloud auth application-default login --project="${PROJECT_ID}"

# 3. Cache OAuth + ADC for personal root owner principal (owner -> ${OWNER_EMAIL}):
gcloud auth login "${OWNER_EMAIL}" --configuration=owner && CLOUDSDK_ACTIVE_CONFIG_NAME=owner gcloud auth application-default login --project="${PROJECT_ID}"
EOF
