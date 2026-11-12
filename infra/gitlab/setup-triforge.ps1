#Requires -Version 5.1
<#
.SYNOPSIS
  End-to-end Tri-Forge bootstrap across GitHub (gh), GitLab (glab / git.aphrody.com),
  and Google Cloud Git (gcloud Developer Connect & Source Repos on GCP project 'aphrody' #468000409790).
.DESCRIPTION
  Loads environment safely without printing secret values, verifies CLI tooling,
  configures GitLab + Google Git remotes across all 26 C:\src repositories via `frg`,
  and optionally provisions remote projects when --Provision is passed.
#>
param(
  [string]$SrcRoot = "C:\src",
  [string]$GcpProject = "aphrody",
  [string]$GcpRegion = "europe-west1",
  [string]$GcloudConfiguration = "org-contact",
  [switch]$DryRun,
  [switch]$Provision
)

$ErrorActionPreference = "Stop"

Write-Host "[Tri-Forge Setup] Initializing Sovereign Tri-Forge across $SrcRoot"

# 1. Load C:\src\.env keys into current process safely (never echo values)
$EnvFile = Join-Path $SrcRoot ".env"
if (Test-Path $EnvFile) {
  Get-Content $EnvFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
      $idx = $line.IndexOf("=")
      $k = $line.Substring(0, $idx).Trim()
      $v = $line.Substring($idx + 1).Trim().Trim('"').Trim("'")
      if ($k -and -not [Environment]::GetEnvironmentVariable($k, "Process")) {
        [Environment]::SetEnvironmentVariable($k, $v, "Process")
      }
    }
  }
  Write-Host "[Tri-Forge Setup] Loaded environment keys from $EnvFile (values redacted)"
}

# 2. Verify GitHub CLI (gh), GitLab CLI (glab), and Google Cloud CLI (gcloud)
foreach ($tool in @("git", "bun", "gh", "glab", "gcloud")) {
  $found = Get-Command $tool -ErrorAction SilentlyContinue
  if ($found) {
    Write-Host "[Tri-Forge Setup] Verified tool: $tool -> $($found.Source)"
  } else {
    Write-Host "[Tri-Forge Setup] Optional tool not on PATH: $tool"
  }
}

# 3. Configure Google Cloud Git credential helper
git config --global credential.https://source.developers.google.com.helper gcloud.cmd
Write-Host "[Tri-Forge Setup] Configured git credential helper for source.developers.google.com -> gcloud.cmd"

# 4. Apply Tri-Forge remotes across all 26 repositories via frg
$FrgExe = "C:\Users\aphro\.local\bin\frg.exe"
$DryFlag = if ($DryRun) { "--dry-run" } else { "" }

if (Test-Path $FrgExe) {
  if ($DryRun) {
    & $FrgExe remotes
  } else {
    & $FrgExe remotes --apply
  }
  & $FrgExe gitlab-init $DryFlag
  & $FrgExe google-git-init $DryFlag
  & $FrgExe arch-upstreams
} else {
  Push-Location (Join-Path $SrcRoot "packages\forge")
  try {
    if ($DryRun) {
      bun run src/cli.ts remotes
    } else {
      bun run src/cli.ts remotes --apply
    }
    if ($DryRun) {
      bun run src/cli.ts gitlab-init --dry-run
      bun run src/cli.ts google-git-init --dry-run
    } else {
      bun run src/cli.ts gitlab-init
      bun run src/cli.ts google-git-init
    }
    bun run src/cli.ts arch-upstreams
  } finally {
    Pop-Location
  }
}

# 5. Optional live GCP Developer Connect & Source Repo provisioning
if ($Provision -and -not $DryRun) {
  $gcloudCmd = Get-Command gcloud -ErrorAction SilentlyContinue
  if ($gcloudCmd) {
    Write-Host "[Tri-Forge Setup] Enabling GCP Developer Connect, Source Repos, Cloud Build & Artifact Registry on $GcpProject..."
    gcloud services enable `
      sourcerepo.googleapis.com `
      developerconnect.googleapis.com `
      cloudbuild.googleapis.com `
      artifactregistry.googleapis.com `
      --project=$GcpProject `
      --configuration=$GcloudConfiguration
  }
}

Write-Host "[Tri-Forge Setup] Completed cleanly."
