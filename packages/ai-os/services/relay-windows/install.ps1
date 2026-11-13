# Installe le relais sous Windows (PowerShell 7, session élevée), sans mot de passe ni interaction :
#   service « AphrodyRelay » (aphrody-relay-svc.exe, artefact CI relay-service) en LocalSystem ; il lance `bun relay serve`
#   dans la session console active avec le jeton de l'utilisateur (WTSQueryUserToken), donc avec ses sessions agy,
#   Claude Code, gcloud, ssh et Chrome. Le Chrome du relais est démarré à la demande par le relais lui-même.
# Usage : pwsh -File install.ps1 -ServiceExe <chemin\aphrody-relay-svc.exe> [-Uninstall]
param([string]$ServiceExe, [switch]$Uninstall)
$ErrorActionPreference = 'Stop'
$name = 'AphrodyRelay'
if ($Uninstall) {
  if (Get-Service $name -ErrorAction SilentlyContinue) { Stop-Service $name -ErrorAction SilentlyContinue; sc.exe delete $name | Out-Null }
  return
}
if (-not $ServiceExe -or -not (Test-Path $ServiceExe)) { throw 'ServiceExe introuvable (artefact relay-service de la CI)' }
$bun = (Get-Command bun -ErrorAction Stop).Source
$cli = Join-Path $PSScriptRoot '..\..\packages\relay\src\cli.ts' | Resolve-Path | Select-Object -ExpandProperty Path
$home_ = Join-Path $env:LOCALAPPDATA 'aphrody\relay'
New-Item -ItemType Directory -Force $home_ | Out-Null
if (Get-Service $name -ErrorAction SilentlyContinue) { Stop-Service $name }
else { New-Service -Name $name -BinaryPathName "`"$ServiceExe`"" -DisplayName 'Aphrody relay (Claude Code <-> Gemini)' -StartupType Automatic | Out-Null }
sc.exe config $name binPath= "`"$ServiceExe`"" | Out-Null
$env_ = @("RELAY_BUN=$bun", "RELAY_CLI=$cli", "RELAY_HOME=$home_", 'RELAY_PORT=8790', 'RELAY_TCP_PORT=8791', 'RELAY_CDP_PORT=9333',
  "SRC_ROOT=$((Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path)")
$tls = Join-Path $home_ 'tls'
if ((Test-Path "$tls\cert.pem") -and (Test-Path "$tls\key.pem")) { $env_ += @("RELAY_TLS_CERT=$tls\cert.pem", "RELAY_TLS_KEY=$tls\key.pem", 'RELAY_TLS_PORT=8792') }
Set-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Services\$name" -Name Environment -Type MultiString -Value $env_
# Échecs : relance après 5 s, 10 s puis 30 s ; compteur remis à zéro chaque jour.
sc.exe failure $name reset= 86400 actions= restart/5000/restart/10000/restart/30000 | Out-Null
Unregister-ScheduledTask -TaskName 'AphrodyRelayBrowser' -Confirm:$false -ErrorAction SilentlyContinue
Start-Service $name
Get-Service $name | Select-Object Name, Status
