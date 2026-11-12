<#
.SYNOPSIS
Opt-in userland launcher/scheduler helper for the Sovereign AI-OS Nightly Standards Sentinel.
Strictly scoped to $env:USERPROFILE\.local\bin and current-user Startup/Task profile.
Never touches host OS system directories.
#>
param(
    [ValidateSet("InstallLauncher", "RunOnce", "RemoveLauncher")]
    [string]$Action = "RunOnce",
    [switch]$ApplyUpdates
)

$ErrorActionPreference = "Stop"

$UserBinDir = Join-Path $env:USERPROFILE ".local\bin"
$AiOsExe = Join-Path $UserBinDir "ai-os.exe"
$LauncherScript = Join-Path $UserBinDir "ai-os-nightly-sync.cmd"

if (-not (Test-Path $UserBinDir)) {
    New-Item -ItemType Directory -Force -Path $UserBinDir | Out-Null
}

$SyncFlag = if ($ApplyUpdates) { "--apply" } else { "" }

switch ($Action) {
    "InstallLauncher" {
        $CmdContent = "@echo off`r`n`"$AiOsExe`" nightly-sync --out `"C:/src/packages/ai-os`" $SyncFlag`r`n"
        Set-Content -Path $LauncherScript -Value $CmdContent -Encoding ASCII
        Write-Output "Installed userland sentinel launcher at: $LauncherScript"
    }
    "RunOnce" {
        if (Test-Path $AiOsExe) {
            if ($ApplyUpdates) {
                & $AiOsExe nightly-sync --out "C:/src/packages/ai-os" --apply
            } else {
                & $AiOsExe nightly-sync --out "C:/src/packages/ai-os"
            }
        } else {
            if ($ApplyUpdates) {
                & bun run "C:/src/packages/ai-os/src/cli.ts" nightly-sync --out "C:/src/packages/ai-os" --apply
            } else {
                & bun run "C:/src/packages/ai-os/src/cli.ts" nightly-sync --out "C:/src/packages/ai-os"
            }
        }
    }
    "RemoveLauncher" {
        if (Test-Path $LauncherScript) {
            Remove-Item -Force $LauncherScript
            Write-Output "Removed userland sentinel launcher: $LauncherScript"
        } else {
            Write-Output "No launcher installed at: $LauncherScript"
        }
    }
}
