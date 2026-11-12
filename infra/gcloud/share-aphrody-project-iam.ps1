#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$ProjectId = "aphrody",
    [string]$ProjectNumber = "468000409790",
    [string]$OwnerConfig = "owner-yohan",
    [string]$OwnerEmail = "yohanpierre15@gmail.com",
    [string]$AiEmail = "yoyo.aphrody@gmail.com",
    [string]$OrgEmail = "contact@aphrody.com",
    [string]$AutomationSaName = "yolo-automation",
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"
$AutomationSaEmail = "$AutomationSaName@$ProjectId.iam.gserviceaccount.com"

function Invoke-GcloudStep {
    param(
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )
    $cmdDisplay = "gcloud " + ($Arguments -join " ")
    if ($DryRun) {
        Write-Output "[DRY-RUN] $cmdDisplay"
        return
    }
    Write-Output "[EXEC] $cmdDisplay"
    & gcloud @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "gcloud command failed (exit=$LASTEXITCODE): $cmdDisplay"
    }
}

Write-Output "=== Aphrody Multi-Google Cloud IAM Sharing ($ProjectId #$ProjectNumber) ==="

# 1. Ensure named configurations exist via env-kit or direct gcloud calls
$existingConfigsJson = & gcloud config configurations list --limit=50 --format="json(name)" 2>$null
$existingNames = @()
if ($LASTEXITCODE -eq 0 -and $existingConfigsJson) {
    $existingNames = ($existingConfigsJson | ConvertFrom-Json) | ForEach-Object { $_.name }
}

$configMatrix = @(
    @{ Name = "owner-yohan"; Account = $OwnerEmail; Region = "europe-west1"; AiRegion = $null },
    @{ Name = "ai-yoyo"; Account = $AiEmail; Region = "europe-west1"; AiRegion = "us-central1" },
    @{ Name = "org-contact"; Account = $OrgEmail; Region = "europe-west1"; AiRegion = $null },
    @{ Name = "sa-automation"; Account = $AutomationSaEmail; Region = "europe-west1"; AiRegion = $null }
)

foreach ($cfg in $configMatrix) {
    if ($existingNames -notcontains $cfg.Name) {
        Invoke-GcloudStep -Arguments @("config", "configurations", "create", $cfg.Name, "--no-activate", "--quiet")
    }
    Invoke-GcloudStep -Arguments @("config", "set", "core/project", $ProjectId, "--configuration=$($cfg.Name)", "--quiet")
    Invoke-GcloudStep -Arguments @("config", "set", "run/region", $cfg.Region, "--configuration=$($cfg.Name)", "--quiet")
    Invoke-GcloudStep -Arguments @("config", "set", "artifacts/location", $cfg.Region, "--configuration=$($cfg.Name)", "--quiet")
    if ($cfg.AiRegion) {
        Invoke-GcloudStep -Arguments @("config", "set", "ai/region", $cfg.AiRegion, "--configuration=$($cfg.Name)", "--quiet")
    }
    Invoke-GcloudStep -Arguments @("config", "set", "core/account", $cfg.Account, "--configuration=$($cfg.Name)", "--quiet")
}

# 2. Enable shared GCP APIs under owner-yohan
$sharedApis = @(
    "iam.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "aiplatform.googleapis.com",
    "generativelanguage.googleapis.com",
    "sourcerepo.googleapis.com",
    "developerconnect.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "drive.googleapis.com"
)

Invoke-GcloudStep -Arguments (@("services", "enable") + $sharedApis + @("--project=$ProjectId", "--configuration=$OwnerConfig", "--quiet"))

# 3. Ensure headless CI/CD service account exists idempotently
$saCheck = & gcloud iam service-accounts list --project=$ProjectId --configuration=$OwnerConfig --filter="email:$AutomationSaEmail" --limit=1 --format="value(email)" --quiet 2>$null
if (-not $saCheck -or $saCheck.Trim() -ne $AutomationSaEmail) {
    Invoke-GcloudStep -Arguments @(
        "iam", "service-accounts", "create", $AutomationSaName,
        "--display-name=Aphrody NHITL Automation Service Account",
        "--description=Headless NHITL CI/CD service account for C:\src monorepo",
        "--project=$ProjectId",
        "--configuration=$OwnerConfig",
        "--quiet"
    )
}

# 4. Bind IAM roles idempotently across all 4 principals
$bindings = @(
    @{ Member = "user:$OwnerEmail"; Roles = @("roles/owner") },
    @{
        Member = "user:$AiEmail"
        Roles  = @(
            "roles/aiplatform.user",
            "roles/serviceusage.serviceUsageConsumer",
            "roles/artifactregistry.writer",
            "roles/cloudbuild.builds.editor",
            "roles/developerconnect.user",
            "roles/storage.objectAdmin",
            "roles/logging.logWriter"
        )
    },
    @{
        Member = "user:$OrgEmail"
        Roles  = @(
            "roles/editor",
            "roles/run.admin",
            "roles/dns.admin",
            "roles/secretmanager.admin"
        )
    },
    @{
        Member = "serviceAccount:$AutomationSaEmail"
        Roles  = @(
            "roles/editor",
            "roles/developerconnect.admin",
            "roles/artifactregistry.admin"
        )
    }
)

foreach ($entry in $bindings) {
    foreach ($role in $entry.Roles) {
        Invoke-GcloudStep -Arguments @(
            "projects", "add-iam-policy-binding", $ProjectId,
            "--member=$($entry.Member)",
            "--role=$role",
            "--condition=None",
            "--configuration=$OwnerConfig",
            "--quiet"
        )
    }
}

Write-Output ""
Write-Output "=== Interactive One-Liners to Cache OAuth & ADC Tokens ==="
Write-Output "# 1. Cache OAuth + ADC for autonomous AI principal (ai-yoyo -> $AiEmail : Gemini, Spark, Hermes, OpenClaw):"
Write-Output "gcloud auth login $AiEmail --configuration=ai-yoyo; `$env:CLOUDSDK_ACTIVE_CONFIG_NAME='ai-yoyo'; gcloud auth application-default login --project=$ProjectId"
Write-Output ""
Write-Output "# 2. Cache OAuth + ADC for organization infrastructure principal (org-contact -> $OrgEmail):"
Write-Output "gcloud auth login $OrgEmail --configuration=org-contact; `$env:CLOUDSDK_ACTIVE_CONFIG_NAME='org-contact'; gcloud auth application-default login --project=$ProjectId"
Write-Output ""
Write-Output "# 3. Cache OAuth + ADC for personal root owner principal (owner-yohan -> $OwnerEmail):"
Write-Output "gcloud auth login $OwnerEmail --configuration=owner-yohan; `$env:CLOUDSDK_ACTIVE_CONFIG_NAME='owner-yohan'; gcloud auth application-default login --project=$ProjectId"
