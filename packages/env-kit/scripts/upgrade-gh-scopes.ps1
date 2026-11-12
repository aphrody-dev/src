#Requires -Version 5.1
<#
.SYNOPSIS
  Upgrades GitHub CLI (`gh`) token scopes for full monorepo, package registry, org, and workflow automation.
  Never prints raw token values. Safe for interactive or non-blocking invocation.
#>
param(
  [switch]$Interactive
)

$ErrorActionPreference = 'Stop'

$RequiredScopes = @(
  'repo',
  'workflow',
  'admin:org',
  'delete_repo',
  'gist',
  'read:packages',
  'write:packages',
  'delete:packages',
  'read:user',
  'user:email',
  'admin:public_key',
  'admin:gpg_key',
  'codespace',
  'project'
)

$ScopeCsv = $RequiredScopes -join ','

Write-Host "[env-kit] Checking current GitHub authentication scopes..."
$statusOut = (gh auth status 2>&1 | Select-String -NotMatch "Token:" | Out-String)
Write-Host $statusOut.Trim()

$missing = @()
foreach ($s in $RequiredScopes) {
  if ($statusOut -notmatch [regex]::Escape("'$s'")) {
    $missing += $s
  }
}

if ($missing.Count -eq 0) {
  Write-Host "[env-kit] All $($RequiredScopes.Count) target GitHub scopes are already active."
  exit 0
}

Write-Host "[env-kit] Missing optional/extended scopes ($($missing.Count)): $($missing -join ', ')"
Write-Host "[env-kit] Current working token remains intact."

if (-not $Interactive -and ([Environment]::UserInteractive -eq $false -or $env:CI -eq 'true' -or [Console]::IsInputRedirected)) {
  Write-Host "[env-kit] Non-interactive session detected. To complete device-code scope upgrade in an interactive terminal, run:"
  Write-Host "  gh auth refresh -h github.com -s $ScopeCsv"
  Write-Host "  env-kit sync-gh"
  exit 0
}

if (-not $Interactive) {
  Write-Host "[env-kit] Pass -Interactive to launch browser/device-code scope refresh now, or run directly:"
  Write-Host "  gh auth refresh -h github.com -s $ScopeCsv"
  exit 0
}

Write-Host "[env-kit] Launching gh auth refresh..."
& gh auth refresh -h github.com -s $ScopeCsv
if ($LASTEXITCODE -eq 0) {
  $newTok = (& gh auth token 2>$null).Trim()
  if ($newTok) {
    [Environment]::SetEnvironmentVariable('GITHUB_TOKEN', $newTok, 'User')
    [Environment]::SetEnvironmentVariable('GH_TOKEN', $newTok, 'User')
    if (Get-Command env-kit -ErrorAction SilentlyContinue) {
      & env-kit set GITHUB_TOKEN $newTok | Out-Null
      & env-kit set GH_TOKEN $newTok | Out-Null
    }
    Write-Host "[env-kit] Synced refreshed token into User environment and C:\src\.env (SET [len=$($newTok.Length)])."
  }
}
