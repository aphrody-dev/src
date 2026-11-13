#!/bin/bash
# Read-only git checkout of aphrody-labs/src used by host services (prd: /srv/src for the ai-os relay), instead
# of `git archive` copies. Config from /etc/fleet/resilience.conf:
#   SRC_CHECKOUT=/srv/src  SRC_SPARSE="packages/ai-os infra/ai"  SRC_RESTART="packages/ai-os=root:aphrody-relay.service ..."
#   src-checkout-update.sh ensure   blobless sparse clone if absent (called by fleet-resilience.sh apply)
#   src-checkout-update.sh          fetch, fast-forward main, restart the units whose watched path changed
set -uo pipefail
. /etc/fleet/resilience.conf
D=${SRC_CHECKOUT:?SRC_CHECKOUT not set}; REPO=${SRC_REPO:-https://github.com/aphrody-labs/src.git}
g() { git -c safe.directory="$D" -c submodule.recurse=false -c fetch.recurseSubmodules=false -C "$D" "$@"; }
ensure() {
  [ -d "$D/.git" ] && return 0
  mkdir -p "$(dirname "$D")"
  GIT_TERMINAL_PROMPT=0 git clone -q --filter=blob:none --no-checkout --branch main "$REPO" "$D" || return 1
  g sparse-checkout set --cone $SRC_SPARSE && g checkout -q main || return 1
  logger -t src-checkout "cloned $REPO into $D ($SRC_SPARSE)"
}
update() {
  ensure || exit 1
  local old new p unit
  old=$(g rev-parse HEAD)
  GIT_TERMINAL_PROMPT=0 g fetch -q --no-recurse-submodules origin main || { logger -t src-checkout -p daemon.err "fetch failed"; exit 1; }
  new=$(g rev-parse origin/main); [ "$old" = "$new" ] && exit 0
  g sparse-checkout set --cone $SRC_SPARSE; g merge -q --ff-only origin/main || { logger -t src-checkout -p daemon.err "ff-only merge refused"; exit 1; }
  logger -t src-checkout "$D ${old:0:12} -> ${new:0:12}"
  for p in $SRC_RESTART; do
    unit=${p#*=}; p=${p%%=*}
    g diff --quiet "$old" "$new" -- "$p" && continue
    ctl=(systemctl); u=$unit; case $unit in *:*) ctl=(systemctl --user -M "${unit%%:*}@"); u=${unit#*:};; esac
    "${ctl[@]}" restart "$u"; sleep 20
    if "${ctl[@]}" is-active -q "$u"; then logger -t src-checkout "$p changed -> restarted $unit"
    else # new code does not start: back to the previous commit
      g reset -q --hard "$old"; "${ctl[@]}" restart "$u"
      logger -t src-checkout -p daemon.err "$unit failed on ${new:0:12}, rolled back to ${old:0:12}"; exit 1
    fi
  done
}
case ${1:-update} in ensure) ensure ;; update) update ;; *) echo "usage: $0 [ensure|update]" >&2; exit 2 ;; esac
