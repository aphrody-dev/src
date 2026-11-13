# généré par packages/machine/src/shells.ts depuis shells/env.toml — ne pas éditer
# nushell 0.117 : sourcé par nu/env.nu. Idempotent ; PATH : entrée existante déplacée en tête.
do --env {
  let h = $nu.home-dir
  let dirs = if $nu.os-info.name == "windows" {
    $env.SRC_ROOT = 'C:\src'
    $env.AY_SHELL_CACHE = ([$h '\.cache\shell'] | str join)
    $env.LANG = 'C.UTF-8'
    $env.PYTHONUTF8 = '1'
    $env.EDITOR = 'hx'
    $env.VISUAL = 'hx'
    $env.PAGER = 'less'
    $env.CARGO_HOME = ([$h '\.cargo'] | str join)
    $env.RUSTUP_HOME = ([$h '\.rustup'] | str join)
    $env.BUN_INSTALL = ([$h '\.bun'] | str join)
    $env.DENO_INSTALL = ([$h '\.deno'] | str join)
    $env.DENO_DIR = ([$h '\.cache\deno'] | str join)
    $env.DENO_NO_UPDATE_CHECK = '1'
    $env.JAVA_HOME = 'C:\Program Files\Microsoft\jdk-25.0.5.21-hotspot'
    $env.ANDROID_HOME = ([$h '\AppData\Local\Android\Sdk'] | str join)
    $env.ANDROID_SDK_ROOT = $env.ANDROID_HOME
    $env.GHIDRA_INSTALL_DIR = ([$h '\AppData\Local\ghidra'] | str join)
    $env.npm_config_fund = 'false'
    $env.npm_config_audit = 'false'
    $env.npm_config_update_notifier = 'false'
    $env.DO_NOT_TRACK = '1'
    $env.DOTNET_CLI_TELEMETRY_OPTOUT = '1'
    $env.POWERSHELL_TELEMETRY_OPTOUT = '1'
    $env.POWERSHELL_UPDATECHECK = 'Off'
    $env.NEXT_TELEMETRY_DISABLED = '1'
    $env.TURBO_TELEMETRY_DISABLED = '1'
    $env.ASTRO_TELEMETRY_DISABLED = '1'
    $env.WRANGLER_SEND_METRICS = 'false'
    $env.CHECKPOINT_DISABLE = '1'
    $env.FZF_DEFAULT_COMMAND = 'fd --type f --hidden --exclude .git --path-separator /'
    ['C:\Program Files\coreutils\bin' ([$h '\.local\bin'] | str join) ([$env.CARGO_HOME '\bin'] | str join) ([$env.BUN_INSTALL '\bin'] | str join) ([$env.DENO_INSTALL '\bin'] | str join) 'C:\Program Files\nodejs' ([$env.JAVA_HOME '\bin'] | str join) ([$env.ANDROID_HOME '\cmdline-tools\latest\bin'] | str join) ([$env.ANDROID_HOME '\platform-tools'] | str join) $env.GHIDRA_INSTALL_DIR]
  } else {
    $env.SRC_ROOT = ([$h '/src'] | str join)
    $env.AY_SHELL_CACHE = ([$h '/.cache/shell'] | str join)
    $env.XDG_CONFIG_HOME = ([$h '/.config'] | str join)
    $env.XDG_CACHE_HOME = ([$h '/.cache'] | str join)
    $env.XDG_DATA_HOME = ([$h '/.local/share'] | str join)
    $env.XDG_STATE_HOME = ([$h '/.local/state'] | str join)
    $env.LANG = 'C.UTF-8'
    $env.PYTHONUTF8 = '1'
    $env.EDITOR = 'nvim'
    $env.VISUAL = 'nvim'
    $env.PAGER = 'less'
    $env.CARGO_HOME = ([$h '/.cargo'] | str join)
    $env.RUSTUP_HOME = ([$h '/.rustup'] | str join)
    $env.BUN_INSTALL = ([$h '/.bun'] | str join)
    $env.DENO_NO_UPDATE_CHECK = '1'
    $env.npm_config_fund = 'false'
    $env.npm_config_audit = 'false'
    $env.npm_config_update_notifier = 'false'
    $env.DO_NOT_TRACK = '1'
    $env.DOTNET_CLI_TELEMETRY_OPTOUT = '1'
    $env.POWERSHELL_TELEMETRY_OPTOUT = '1'
    $env.POWERSHELL_UPDATECHECK = 'Off'
    $env.NEXT_TELEMETRY_DISABLED = '1'
    $env.TURBO_TELEMETRY_DISABLED = '1'
    $env.ASTRO_TELEMETRY_DISABLED = '1'
    $env.WRANGLER_SEND_METRICS = 'false'
    $env.CHECKPOINT_DISABLE = '1'
    $env.FZF_DEFAULT_COMMAND = 'fd --type f --hidden --exclude .git --path-separator /'
    [([$h '/.local/bin'] | str join) ([$env.CARGO_HOME '/bin'] | str join) ([$env.BUN_INSTALL '/bin'] | str join)]
  }
  let key = {|x| $x | str lowercase | str replace -a '\' '/' | str trim -r -c '/' }
  let add = $dirs | where {|d| $d | path exists }
  let keys = $add | each $key
  $env.PATH = $add ++ ($env.PATH | where {|x| (do $key $x) not-in $keys })
}
