# Attach the XFS data VHDX to WSL 2 (run at logon via Task Scheduler: see docs/infra/WSL.md). Idempotent.
$vhd = 'C:\wsl\aphrody-data.vhdx'
if (-not (Test-Path $vhd)) { "create vdisk file=$vhd maximum=200000 type=expandablenexit" | diskpart | Out-Null }
wsl.exe --mount --vhd $vhd --bare 2>$null
