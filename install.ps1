# Sovereign One-Click Reproducible Monorepo Installer (Windows NT)
# Pinned to C:\src\src.lock.json
[CmdletBinding()]
param(
    [string]$LockFile = "C:\src\src.lock.json",
    [string]$TargetDir = "C:\src",
    [switch]$SkipClones = $false
)

$ErrorActionPreference = "Stop"
Write-Host "`n=== SOVEREIGN MONOREPO INSTALLER (Windows NT) ===" -ForegroundColor Cyan

if (-not (Test-Path $LockFile)) {
    Write-Error "Lockfile not found at: $LockFile"
    exit 1
}

$lock = Get-Content $LockFile -Raw | ConvertFrom-Json
Write-Host "Lockfile version $($lock.version) generated at $($lock.generated_at)" -ForegroundColor DarkGray
Write-Host "Target OS: $($lock.hardware.os) | CPU: $($lock.hardware.cpu) | GPU: $($lock.hardware.gpu)`n" -ForegroundColor DarkGray

# Ensure local bin exists and is in User PATH
$localBin = "$env:USERPROFILE\.local\bin"
if (-not (Test-Path $localBin)) {
    New-Item -ItemType Directory -Path $localBin -Force | Out-Null
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$localBin*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$localBin", "User")
    $env:PATH = "$env:PATH;$localBin"
    Write-Host "[PATH] Added $localBin to User PATH" -ForegroundColor Green
}

# Verify Core Toolchains
Write-Host "[1/5] Verifying & Installing Core Toolchains..." -ForegroundColor Yellow

function Ensure-Tool($name, $wingetId, $cargoPkg) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
        Write-Host "  Installing missing tool: $name..." -ForegroundColor Yellow
        if ($wingetId) {
            winget install --id $wingetId --accept-source-agreements --accept-package-agreements -e --silent
        } elseif ($cargoPkg) {
            cargo binstall --no-confirm $cargoPkg
        }
    } else {
        Write-Host "  [OK] $name found" -ForegroundColor DarkGreen
    }
}

Ensure-Tool "sccache" "Mozilla.sccache" "sccache"
Ensure-Tool "just" "Casey.Just" "just"
Ensure-Tool "jj" "jj-vcs.jj" "jujutsu"
Ensure-Tool "cargo-binstall" "" "cargo-binstall"
Ensure-Tool "cargo-nextest" "" "cargo-nextest"
Ensure-Tool "gix" "" "gitoxide"

# Configure Cargo Global Settings
Write-Host "`n[2/5] Configuring Global Cargo 2026 Environment..." -ForegroundColor Yellow
$cargoDir = "$env:USERPROFILE\.cargo"
if (-not (Test-Path $cargoDir)) { New-Item -ItemType Directory -Path $cargoDir -Force | Out-Null }
$cargoConfig = @"
# Canonical Sovereign Cargo Configuration (2026)
[build]
rustc-wrapper = "sccache"

[alias]
xtask = "run --manifest-path C:/src/crates/xtask/Cargo.toml --release --"
nt = "nextest run"
b = "build"
c = "check"
t = "test"

[target.x86_64-pc-windows-msvc]
rustflags = ["-C", "target-cpu=native"]

[net]
git-fetch-with-cli = true
"@
Set-Content -Path "$cargoDir\config.toml" -Value $cargoConfig -Encoding utf8
Write-Host "  [OK] $cargoDir\config.toml configured with sccache and xtask" -ForegroundColor Green

# Configure Jujutsu User Settings
Write-Host "`n[3/5] Configuring Global Jujutsu (jj)..." -ForegroundColor Yellow
$jjDir = "$env:APPDATA\jj"
if (-not (Test-Path $jjDir)) { New-Item -ItemType Directory -Path $jjDir -Force | Out-Null }
$jjConfig = @"
[user]
name = "aphrody-dev"
email = "contact@aphrody.com"

[ui]
default-command = "log"
diff-editor = ":builtin"
paginate = "never"

[snapshot]
max-new-file-size = "1MiB"
auto-track = "all()"

[git]
auto-local-bookmark = true
abandon-unreachable-commits = true

[revset-aliases]
"stack()" = "ancestors(@, 10) & mutable()"
"wip()" = "mutable() & ~empty()"
"review()" = "heads(mutable())"
"@
Set-Content -Path "$jjDir\config.toml" -Value $jjConfig -Encoding utf8
Write-Host "  [OK] $jjDir\config.toml configured with 1MiB snapshot guard" -ForegroundColor Green

# Reproduce Repositories from Lockfile
if (-not $SkipClones) {
    Write-Host "`n[4/5] Synchronizing Monorepo Repositories from Lockfile..." -ForegroundColor Yellow
    $repos = $lock.repositories.PSObject.Properties
    foreach ($r in $repos) {
        $repoKey = $r.Name
        $info = $r.Value
        $repoPath = $info.path

        if (-not (Test-Path $repoPath)) {
            if ($info.url -like "https://*" -or $info.url -like "git@*") {
                Write-Host "  Cloning $repoKey ($($info.url))..." -ForegroundColor Cyan
                git clone --depth=1 --filter=blob:none $info.url $repoPath
            } else {
                Write-Host "  Skipping local-only placeholder: $repoKey" -ForegroundColor DarkGray
            }
        }
    }
}

# Compile xtk, rust-stack, triad, and src-deploy CLI Tooling
Write-Host "`n[5/5] Building & Installing Sovereign Rust, Bun, and Go CLI Tooling..." -ForegroundColor Yellow
if (Test-Path "$TargetDir\crates\xtask") {
    Push-Location "$TargetDir\crates\xtask"
    cargo build --release
    Pop-Location
    $builtExe = "$env:LOCALAPPDATA\Aphrody\cache\cargo-target\release\xtk.exe"
    if (-not (Test-Path $builtExe)) {
        $builtExe = "$TargetDir\crates\xtask\target\release\xtk.exe"
    }
    if (Test-Path $builtExe) {
        Copy-Item $builtExe "$localBin\xtk.exe" -Force
        Write-Host "  [OK] Installed xtk.exe to $localBin\xtk.exe" -ForegroundColor Green
    }
}
if (Test-Path "$TargetDir\crates\rust-stack") {
    Push-Location "$TargetDir\crates\rust-stack"
    cargo build --release
    Pop-Location
}
if (Test-Path "$TargetDir\infra\go.mod") {
    Push-Location "$TargetDir\infra"
    go build -o "$localBin\src-deploy.exe" ./cmd/src-deploy
    Pop-Location
    Write-Host "  [OK] Installed src-deploy.exe to $localBin\src-deploy.exe" -ForegroundColor Green
}
if (Test-Path "$TargetDir\packages\ai-triad\src\cli.ts") {
    bun build --compile "$TargetDir\packages\ai-triad\src\cli.ts" --outfile "$localBin\triad.exe" | Out-Null
    bun run "$TargetDir\packages\ai-triad\src\cli.ts" sync-configs | Out-Null
    Write-Host "  [OK] Installed triad.exe & synced Codex/AGY/Claude configs" -ForegroundColor Green
}

# Expose the shared agent skills to Claude Code (.agents/skills is the single source of truth)
$claudeSkills = "$TargetDir\.claude\skills"
if ((Test-Path "$TargetDir\.agents\skills") -and -not (Test-Path $claudeSkills)) {
    New-Item -ItemType Directory -Force "$TargetDir\.claude" | Out-Null
    New-Item -ItemType Junction -Path $claudeSkills -Target "$TargetDir\.agents\skills" | Out-Null
    Write-Host "  [OK] Linked .claude\skills -> .agents\skills" -ForegroundColor Green
}

# Install frg.cmd shim
$frgShim = @"
@echo off
bun run "C:\src\packages\forge\src\cli.ts" %*
"@
Set-Content -Path "$localBin\frg.cmd" -Value $frgShim -Encoding ascii
Write-Host "  [OK] Installed frg.cmd to $localBin\frg.cmd" -ForegroundColor Green

# Run final verification doctor
Write-Host "`nRunning Sovereign Doctor Verification:" -ForegroundColor Cyan
& "$localBin\xtk.exe" doctor

Write-Host "Sovereign Monorepo Setup 100% Complete & Verified.`n" -ForegroundColor Green
