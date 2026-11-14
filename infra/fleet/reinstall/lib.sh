#!/bin/sh
# Shared guards. Every destructive script needs CONFIRM=REINSTALL-<host> and refuses to run on a mounted target.
# NOT executed by the plan authors: docs/infra/REINSTALL-PLAN.md.
set -eu
need_confirm() { [ "${CONFIRM:-}" = "REINSTALL-$1" ] || { echo "refuse: set CONFIRM=REINSTALL-$1" >&2; exit 2; }; }
need_root() { [ "$(id -u)" = 0 ] || { echo "refuse: root only" >&2; exit 2; }; }
not_mounted() { ! grep -q "^$1" /proc/mounts || { echo "refuse: $1 mounted" >&2; exit 2; }; }
log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
