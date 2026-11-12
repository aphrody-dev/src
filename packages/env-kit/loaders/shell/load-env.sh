#!/usr/bin/env sh
# POSIX / Bash / Zsh sourceable loader for C:/src/.env or /src/.env
# Usage: . C:/src/packages/env-kit/loaders/shell/load-env.sh
# Never echoes secret values. Preserves already-set non-empty environment variables unless ENV_KIT_OVERRIDE=1.

_env_kit_load() {
  _ek_file="${1:-}"
  if [ -z "$_ek_file" ]; then
    if [ -f "C:/src/.env" ]; then
      _ek_file="C:/src/.env"
    elif [ -f "/c/src/.env" ]; then
      _ek_file="/c/src/.env"
    else
      _ek_file="/src/.env"
    fi
  fi

  [ -f "$_ek_file" ] || return 0

  while IFS= read -r _ek_line || [ -n "$_ek_line" ]; do
    _ek_line="${_ek_line%"$(printf '\r')"}"
    case "$_ek_line" in
      ""|\#*|[[:space:]]\#*) continue ;;
    esac
    case "$_ek_line" in
      export\ *) _ek_line="${_ek_line#export }" ;;
    esac
    case "$_ek_line" in
      *=*)
        _ek_key="${_ek_line%%=*}"
        _ek_val="${_ek_line#*=}"
        # Trim leading/trailing spaces on key
        _ek_key="$(printf '%s' "$_ek_key" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
        case "$_ek_key" in
          ''|*[!A-Za-z0-9_]*|[0-9]*) continue ;;
        esac
        # Strip surrounding quotes if present
        case "$_ek_val" in
          \"*\")
            _ek_val="${_ek_val#\"}"
            _ek_val="${_ek_val%\"}"
            ;;
          \'*\')
            _ek_val="${_ek_val#\'}"
            _ek_val="${_ek_val%\'}"
            ;;
          *)
            _ek_val="$(printf '%s' "$_ek_val" | sed 's/[[:space:]][[:space:]]*#.*$//;s/^[[:space:]]*//;s/[[:space:]]*$//')"
            ;;
        esac
        eval "_ek_cur=\${$_ek_key:-}"
        if [ "${ENV_KIT_OVERRIDE:-0}" = "1" ] || [ -z "$_ek_cur" ]; then
          if [ -n "$_ek_val" ] || [ "${ENV_KIT_OVERRIDE:-0}" = "1" ]; then
            export "$_ek_key=$_ek_val"
          fi
        fi
        ;;
    esac
  done < "$_ek_file"

  unset _ek_file _ek_line _ek_key _ek_val _ek_cur
}

_env_kit_load "$@"
