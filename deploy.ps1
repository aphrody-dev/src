<#
.SYNOPSIS
  Sovereign One-Click Deployment Entrypoint (`git clone` -> Live Production)
  Powered by Go 1.27 (`src-deploy.exe` / `dpl.cmd`) + Zig CGO + Rust + Bun v1.4.4 FFI
#>
[CmdletBinding()]
param(
  [Parameter(Position = 0)]
  [string]$Target = "all",

  [ValidateSet("self-hosted", "cloudflare", "gcloud", "vercel", "all")]
  [string]$Provider = "self-hosted",

  [ValidateSet("blue", "green")]
  [string]$Slot = "blue",

  [switch]$All,

  [switch]$Live,

  [switch]$Doctor
)

$ErrorActionPreference = "Stop"
$SrcDeploy = "C:\Users\aphro\.local\bin\src-deploy.exe"

if (-not (Test-Path $SrcDeploy)) {
  Write-Host "[deploy.ps1] Compiling src-deploy.exe with Go 1.27..."
  Push-Location "C:\src\infra"
  try {
    $env:CGO_ENABLED = "0"
    go build -trimpath -ldflags="-s -w" -o $SrcDeploy .\cmd\src-deploy
  } finally {
    Pop-Location
  }
}

if ($Doctor) {
  & $SrcDeploy doctor
  exit $LASTEXITCODE
}

& $SrcDeploy caddyfile --out "C:/src/infra/generated/Caddyfile"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$dryFlag = if ($Live) { "--live" } else { "--dry-run" }
if ($All -or $Target -eq "--all" -or $Target -eq "all") {
  & $SrcDeploy up --all $dryFlag --provider $Provider --slot $Slot
} else {
  & $SrcDeploy up $Target $dryFlag --provider $Provider --slot $Slot
}
exit $LASTEXITCODE
