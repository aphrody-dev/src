# Installe le relais sous Windows (PowerShell 7, session élevée) :
#   - service « AphrodyRelay » (aphrody-relay-svc.exe publié par la CI, job relay-service) qui supervise `bun relay serve` ;
#   - tâche planifiée « AphrodyRelayBrowser » à l'ouverture de session : Chrome du relais (profil dédié, CDP 127.0.0.1),
#     seul moyen d'utiliser la session Google de l'utilisateur (un service en session 0 n'y a pas accès).
# Usage : pwsh -File install.ps1 -ServiceExe <chemin\aphrody-relay-svc.exe> [-Uninstall]
param([string]$ServiceExe, [switch]$Uninstall)
$ErrorActionPreference = 'Stop'
$name = 'AphrodyRelay'
$task = 'AphrodyRelayBrowser'
if ($Uninstall) {
  if (Get-Service $name -ErrorAction SilentlyContinue) { Stop-Service $name -ErrorAction SilentlyContinue; sc.exe delete $name | Out-Null }
  Unregister-ScheduledTask -TaskName $task -Confirm:$false -ErrorAction SilentlyContinue
  return
}
if (-not $ServiceExe -or -not (Test-Path $ServiceExe)) { throw 'ServiceExe introuvable (artefact relay-service de la CI)' }
$bun = (Get-Command bun -ErrorAction Stop).Source
$cli = Join-Path $PSScriptRoot '..\..\packages\relay\src\cli.ts' | Resolve-Path | Select-Object -ExpandProperty Path
$home_ = Join-Path $env:LOCALAPPDATA 'aphrody\relay'
New-Item -ItemType Directory -Force $home_ | Out-Null

if (-not (Get-Service $name -ErrorAction SilentlyContinue)) {
  New-Service -Name $name -BinaryPathName "`"$ServiceExe`"" -DisplayName 'Aphrody relay (Claude Code <-> Gemini)' -StartupType Automatic | Out-Null
}
$env_ = @("RELAY_BUN=$bun", "RELAY_CLI=$cli", "RELAY_HOME=$home_", 'RELAY_PORT=8790', 'RELAY_TCP_PORT=8791', 'RELAY_CDP_PORT=9333', "SRC_ROOT=$((Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path)")
Set-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\$name" -Name Environment -Type MultiString -Value $env_
# Échecs : relance après 5 s, 10 s puis 30 s ; compteur remis à zéro chaque jour.
sc.exe failure $name reset= 86400 actions= restart/5000/restart/10000/restart/30000 | Out-Null

$action = New-ScheduledTaskAction -Execute $bun -Argument "`"$cli`" browser"
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero)
Register-ScheduledTask -TaskName $task -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null

Start-Service $name
Start-ScheduledTask -TaskName $task
Get-Service $name | Select-Object Name, Status
