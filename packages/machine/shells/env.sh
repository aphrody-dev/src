# généré par packages/machine/src/shells.ts depuis shells/env.toml — ne pas éditer
# Famille bash (bash, niubash, Git Bash, brush). Idempotent, builtins seulement, sûr en non interactif.
# PATH Windows : ';' + C:/x (niubash, brush natif) ; Git Bash (BASH=/usr/bin/*) : ':' + /c/x ; Linux : ':'.
case ${OSTYPE-} in msys* | cygwin* | windows*) _ay_os=w ;; *) if [ -n "${WINDIR-}" ]; then _ay_os=w; else _ay_os=l; fi ;; esac
_ay_s=: _ay_g=
if [ "$_ay_os" = w ]; then
  _ay_h=${USERPROFILE-}
  case ${BASH-} in /usr/bin/* | /bin/*) _ay_g=1 ;; *) _ay_s=';' ;; esac
else
  _ay_h=$HOME
fi
# Ajoute $1 en tête de PATH s'il existe et n'y est pas ; avec $2 (m), le déplace en tête s'il y est.
# Appartenance par `case` : ${PATH//…} coûte 40-100 ms par appel sous niubash 1.5.0 (PATH long) ;
# déplacement (préfixe/suffixe) seulement pour les entrées « front » qui ne sont pas déjà en tête.
_ay_pp() {
  local d=${1//\\//} b x q="$_ay_s$PATH$_ay_s"
  [ -d "$d" ] || return 0
  if [ -n "$_ay_g" ]; then b=${d:0:1}; d="/${b,,}${d:2}"; b=$d; else b=${d//\//\\}; fi
  case $q in
    *"$_ay_s$d$_ay_s"* | *"$_ay_s$b$_ay_s"*)
      [ -n "${2-}" ] || return 0
      case $q in "$_ay_s$d$_ay_s"* | "$_ay_s$b$_ay_s"*) return 0 ;; esac
      # Retrait par préfixe/suffixe (%% et #*), rapides sous niubash, au lieu de ${q//…}.
      for x in "$d" "$b"; do
        case $q in *"$_ay_s$x$_ay_s"*) q="${q%%"$_ay_s$x$_ay_s"*}$_ay_s${q#*"$_ay_s$x$_ay_s"}" ;; esac
      done
      q=${q#"$_ay_s"}; PATH=${q%"$_ay_s"} ;;
  esac
  PATH="$d${PATH:+$_ay_s$PATH}"
}
if [ "$_ay_os" = w ]; then
  export SRC_ROOT='C:\src'
  export AY_SHELL_CACHE="$_ay_h"'\.cache\shell'
  export LANG='C.UTF-8'
  export PYTHONUTF8='1'
  export EDITOR='hx'
  export VISUAL='hx'
  export PAGER='less'
  export CARGO_HOME="$_ay_h"'\.cargo'
  export RUSTUP_HOME="$_ay_h"'\.rustup'
  export BUN_INSTALL="$_ay_h"'\.bun'
  export DENO_INSTALL="$_ay_h"'\.deno'
  export DENO_DIR="$_ay_h"'\.cache\deno'
  export DENO_NO_UPDATE_CHECK='1'
  export JAVA_HOME='C:\Program Files\Microsoft\jdk-25.0.5.21-hotspot'
  export ANDROID_HOME="$_ay_h"'\AppData\Local\Android\Sdk'
  export ANDROID_SDK_ROOT="${ANDROID_HOME}"
  export GHIDRA_INSTALL_DIR="$_ay_h"'\AppData\Local\ghidra'
  export npm_config_fund='false'
  export npm_config_audit='false'
  export npm_config_update_notifier='false'
  export DO_NOT_TRACK='1'
  export DOTNET_CLI_TELEMETRY_OPTOUT='1'
  export POWERSHELL_TELEMETRY_OPTOUT='1'
  export POWERSHELL_UPDATECHECK='Off'
  export NEXT_TELEMETRY_DISABLED='1'
  export TURBO_TELEMETRY_DISABLED='1'
  export ASTRO_TELEMETRY_DISABLED='1'
  export WRANGLER_SEND_METRICS='false'
  export CHECKPOINT_DISABLE='1'
  export FZF_DEFAULT_COMMAND='fd --type f --hidden --exclude .git --path-separator /'
  _ay_pp "${GHIDRA_INSTALL_DIR}"
  _ay_pp "${ANDROID_HOME}"'\platform-tools'
  _ay_pp "${ANDROID_HOME}"'\cmdline-tools\latest\bin'
  _ay_pp "${JAVA_HOME}"'\bin'
  _ay_pp 'C:\Program Files\nodejs'
  _ay_pp "${DENO_INSTALL}"'\bin'
  _ay_pp "${BUN_INSTALL}"'\bin' m
  _ay_pp "${CARGO_HOME}"'\bin' m
  _ay_pp "$_ay_h"'\.local\bin' m
  _ay_pp 'C:\Program Files\coreutils\bin' m
else
  export SRC_ROOT="$_ay_h"'/src'
  export AY_SHELL_CACHE="$_ay_h"'/.cache/shell'
  export XDG_CONFIG_HOME="$_ay_h"'/.config'
  export XDG_CACHE_HOME="$_ay_h"'/.cache'
  export XDG_DATA_HOME="$_ay_h"'/.local/share'
  export XDG_STATE_HOME="$_ay_h"'/.local/state'
  export LANG='C.UTF-8'
  export PYTHONUTF8='1'
  export EDITOR='nvim'
  export VISUAL='nvim'
  export PAGER='less'
  export CARGO_HOME="$_ay_h"'/.cargo'
  export RUSTUP_HOME="$_ay_h"'/.rustup'
  export BUN_INSTALL="$_ay_h"'/.bun'
  export DENO_NO_UPDATE_CHECK='1'
  export npm_config_fund='false'
  export npm_config_audit='false'
  export npm_config_update_notifier='false'
  export DO_NOT_TRACK='1'
  export DOTNET_CLI_TELEMETRY_OPTOUT='1'
  export POWERSHELL_TELEMETRY_OPTOUT='1'
  export POWERSHELL_UPDATECHECK='Off'
  export NEXT_TELEMETRY_DISABLED='1'
  export TURBO_TELEMETRY_DISABLED='1'
  export ASTRO_TELEMETRY_DISABLED='1'
  export WRANGLER_SEND_METRICS='false'
  export CHECKPOINT_DISABLE='1'
  export FZF_DEFAULT_COMMAND='fd --type f --hidden --exclude .git --path-separator /'
  _ay_pp "${BUN_INSTALL}"'/bin'
  _ay_pp "${CARGO_HOME}"'/bin'
  _ay_pp "$_ay_h"'/.local/bin'
fi
export PATH
unset _ay_os _ay_s _ay_g _ay_h
unset -f _ay_pp
