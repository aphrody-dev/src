# Fresh-machine bootstrap: build `ay` once, then `ay up --bootstrap` applies tools.toml
# (tools, config files, links, clones from src.lock.json, ay doctor). docs/infra/INSTALL_UPDATE.md §4.
$ErrorActionPreference = "Stop"
$env:SRC_ROOT = Split-Path -Parent (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"
if (-not (Get-Command ay -ErrorAction SilentlyContinue)) {
    $env:RUSTC_WRAPPER = ""
    cargo install --path "$env:SRC_ROOT\crates\ay" --root "$env:USERPROFILE\.local" --locked --no-track
    if ($LASTEXITCODE) { exit $LASTEXITCODE }
}
ay up --bootstrap
exit $LASTEXITCODE
