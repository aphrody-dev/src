# généré par packages/machine/src/shells.ts depuis shells/env.toml — ne pas éditer
# pwsh 7 et Windows PowerShell 5.1 : $env:* seulement ; aucune cmdlet (pas de chargement de module),
# aucun sous-processus ni réseau ; idempotent. PATH en une passe : dossiers existants de env.toml en tête,
# puis le PATH hérité sans doublons (comparaison insensible à la casse, \ final ignoré).
$_ayW = $env:OS -eq 'Windows_NT'
if ($_ayW) { $_ayH = $env:USERPROFILE } else { $_ayH = $env:HOME }
if ($_ayW) {
  $env:SRC_ROOT = 'C:\src'
  $env:AY_SHELL_CACHE = $_ayH + '\.cache\shell'
  $env:LANG = 'C.UTF-8'
  $env:PYTHONUTF8 = '1'
  $env:EDITOR = 'hx'
  $env:VISUAL = 'hx'
  $env:PAGER = 'less'
  $env:CARGO_HOME = $_ayH + '\.cargo'
  $env:RUSTUP_HOME = $_ayH + '\.rustup'
  $env:BUN_INSTALL = $_ayH + '\.bun'
  $env:DENO_INSTALL = $_ayH + '\.deno'
  $env:DENO_DIR = $_ayH + '\.cache\deno'
  $env:DENO_NO_UPDATE_CHECK = '1'
  $env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-25.0.5.21-hotspot'
  $env:ANDROID_HOME = $_ayH + '\AppData\Local\Android\Sdk'
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
  $env:GHIDRA_INSTALL_DIR = $_ayH + '\AppData\Local\ghidra'
  $env:npm_config_fund = 'false'
  $env:npm_config_audit = 'false'
  $env:npm_config_update_notifier = 'false'
  $env:DO_NOT_TRACK = '1'
  $env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
  $env:POWERSHELL_TELEMETRY_OPTOUT = '1'
  $env:POWERSHELL_UPDATECHECK = 'Off'
  $env:NEXT_TELEMETRY_DISABLED = '1'
  $env:TURBO_TELEMETRY_DISABLED = '1'
  $env:ASTRO_TELEMETRY_DISABLED = '1'
  $env:WRANGLER_SEND_METRICS = 'false'
  $env:CHECKPOINT_DISABLE = '1'
  $env:FZF_DEFAULT_COMMAND = 'fd --type f --hidden --exclude .git --path-separator /'
  $_ayD = @(('C:\Program Files\coreutils\bin'), ($_ayH + '\.local\bin'), ($env:CARGO_HOME + '\bin'), ($env:BUN_INSTALL + '\bin'), ($env:DENO_INSTALL + '\bin'), ('C:\Program Files\nodejs'), ($env:JAVA_HOME + '\bin'), ($env:ANDROID_HOME + '\cmdline-tools\latest\bin'), ($env:ANDROID_HOME + '\platform-tools'), ($env:GHIDRA_INSTALL_DIR))
} else {
  $env:SRC_ROOT = $_ayH + '/src'
  $env:AY_SHELL_CACHE = $_ayH + '/.cache/shell'
  $env:XDG_CONFIG_HOME = $_ayH + '/.config'
  $env:XDG_CACHE_HOME = $_ayH + '/.cache'
  $env:XDG_DATA_HOME = $_ayH + '/.local/share'
  $env:XDG_STATE_HOME = $_ayH + '/.local/state'
  $env:LANG = 'C.UTF-8'
  $env:PYTHONUTF8 = '1'
  $env:EDITOR = 'nvim'
  $env:VISUAL = 'nvim'
  $env:PAGER = 'less'
  $env:CARGO_HOME = $_ayH + '/.cargo'
  $env:RUSTUP_HOME = $_ayH + '/.rustup'
  $env:BUN_INSTALL = $_ayH + '/.bun'
  $env:DENO_NO_UPDATE_CHECK = '1'
  $env:npm_config_fund = 'false'
  $env:npm_config_audit = 'false'
  $env:npm_config_update_notifier = 'false'
  $env:DO_NOT_TRACK = '1'
  $env:DOTNET_CLI_TELEMETRY_OPTOUT = '1'
  $env:POWERSHELL_TELEMETRY_OPTOUT = '1'
  $env:POWERSHELL_UPDATECHECK = 'Off'
  $env:NEXT_TELEMETRY_DISABLED = '1'
  $env:TURBO_TELEMETRY_DISABLED = '1'
  $env:ASTRO_TELEMETRY_DISABLED = '1'
  $env:WRANGLER_SEND_METRICS = 'false'
  $env:CHECKPOINT_DISABLE = '1'
  $env:FZF_DEFAULT_COMMAND = 'fd --type f --hidden --exclude .git --path-separator /'
  $_ayD = @(($_ayH + '/.local/bin'), ($env:CARGO_HOME + '/bin'), ($env:BUN_INSTALL + '/bin'))
}
$_ayS = [IO.Path]::PathSeparator
$_ayL = [Collections.Generic.List[string]]::new()
$_ayK = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($_ayX in $_ayD) { if ([IO.Directory]::Exists($_ayX) -and $_ayK.Add($_ayX.TrimEnd('\'))) { $_ayL.Add($_ayX) } }
foreach ($_ayX in $env:PATH.Split($_ayS)) { if ($_ayX -and $_ayK.Add($_ayX.TrimEnd('\'))) { $_ayL.Add($_ayX) } }
$env:PATH = [string]::Join($_ayS, $_ayL)
$_ayW = $null; $_ayH = $null; $_ayD = $null; $_ayS = $null; $_ayL = $null; $_ayK = $null; $_ayX = $null
