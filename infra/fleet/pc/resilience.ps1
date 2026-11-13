# PC (Windows) part of `just fleet-resilience`: services in Automatic (Delayed Start) with recovery restart,
# src scheduled tasks restartable and started when available. Idempotent. Needs an elevated shell for apply.
#   pwsh -NoProfile -File infra/fleet/pc/resilience.ps1 apply|check
# pwsh only for the service/task CIM and registry surface (sc.exe for recovery actions).
param([ValidateSet('apply', 'check')][string]$Mode = 'check')
$ErrorActionPreference = 'Stop'
$services = @('AphrodyRelay', 'WireGuardManager', 'WireGuardTunnel$wg-win')
$tasks = @('\Aphrody\AgentsHealth', '\Aphrody\AgentsLogon', '\ay-ai-litellm', '\ay-ai-llamacpp', '\ay-ai-ollama')
$fail = 0
function Say($ok, $msg) { if ($ok) { "OK   $msg" } else { "FAIL $msg"; $script:fail = 1 } }

foreach ($s in $services) {
  $svc = Get-CimInstance Win32_Service -Filter "Name='$($s -replace "'", "''")'"
  if (-not $svc) { Say $false "service $s absent"; continue }
  $key = "HKLM:\SYSTEM\CurrentControlSet\Services\$s"
  if ($Mode -eq 'apply') {
    & sc.exe config $s start= delayed-auto | Out-Null
    & sc.exe failure $s reset= 86400 actions= restart/5000/restart/10000/restart/30000 | Out-Null
    & sc.exe failureflag $s 1 | Out-Null   # recovery also when the service stops with an error code
    if ($svc.State -ne 'Running') { Start-Service -Name $s }
  }
  $svc = Get-CimInstance Win32_Service -Filter "Name='$($s -replace "'", "''")'"
  $delayed = (Get-ItemProperty $key -Name DelayedAutostart -ErrorAction SilentlyContinue).DelayedAutostart -eq 1
  $fa = (Get-ItemProperty $key -Name FailureActions -ErrorAction SilentlyContinue).FailureActions
  # SERVICE_FAILURE_ACTIONS: 20-byte header (reset, 2 ptrs, count, ptr) then {type,delay} pairs; type 1 = restart.
  $restart = $fa -and $fa.Length -ge 28 -and [BitConverter]::ToInt32($fa, 12) -ge 1 -and [BitConverter]::ToInt32($fa, 20) -eq 1
  Say ($svc.StartMode -eq 'Auto' -and $delayed -and $restart -and $svc.State -eq 'Running') "service $s start=$($svc.StartMode) delayed=$delayed restart=$restart state=$($svc.State)"
}

foreach ($t in $tasks) {
  $path = ($t.Substring(0, $t.LastIndexOf('\') + 1)); $name = $t.Substring($t.LastIndexOf('\') + 1)
  $task = Get-ScheduledTask -TaskPath $path -TaskName $name -ErrorAction SilentlyContinue
  if (-not $task) { Say $false "task $t absent"; continue }
  if ($Mode -eq 'apply') {
    $st = $task.Settings
    $st.StartWhenAvailable = $true; $st.DisallowStartIfOnBatteries = $false; $st.StopIfGoingOnBatteries = $false
    if ($st.RestartCount -lt 3) { $st.RestartCount = 999; $st.RestartInterval = 'PT1M' }
    Set-ScheduledTask -TaskPath $path -TaskName $name -Settings $st | Out-Null
    $task = Get-ScheduledTask -TaskPath $path -TaskName $name
  }
  $s = $task.Settings
  Say ($task.State -ne 'Disabled' -and $s.StartWhenAvailable -and $s.RestartCount -ge 3 -and -not $s.DisallowStartIfOnBatteries) "task $t state=$($task.State) restart=$($s.RestartCount)x$($s.RestartInterval) available=$($s.StartWhenAvailable)"
}
exit $fail
