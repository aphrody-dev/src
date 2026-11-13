#!/bin/bash
# Canonical src checkout of a fleet host (/srv/src): blobless clone of aphrody-labs/src (aphrody-dev/src), main only,
# fast-forward only. Config from /etc/fleet/resilience.conf:
#   SRC_CHECKOUT=/srv/src            checkout path (owned by the user the service runs as)
#   SRC_SPARSE="packages infra"      cone patterns; empty or unset = full tree (the fleet default since 2026-11-13)
#   SRC_RESTART="packages/ai-os=root:aphrody-relay.service ..."   path=unit restarted when the path changed
#   SRC_POST="ay manifests --check"  command run in the checkout after a fast-forward (fr1: lock/manifest drift check)
#   src-checkout-update.sh ensure   clone if absent (called by fleet-resilience.sh apply and fleet-setup.sh)
#   src-checkout-update.sh          fetch, fast-forward main, restart the units whose watched path changed
# Never clobbers: a dirty tracked tree, a non-main branch or a diverged history is logged and left as is.
# Log: journald tag src-checkout; last result in $SRC_STATE (default /var/lib/src-sync/status.json, else ~/.cache).
set -uo pipefail
. /etc/fleet/resilience.conf
D=${SRC_CHECKOUT:?SRC_CHECKOUT not set}; REPO=${SRC_REPO:-https://github.com/aphrody-labs/src.git}
STATE=${SRC_STATE:-/var/lib/src-sync/status.json}
g() { git -c safe.directory="$D" -c submodule.recurse=false -c fetch.recurseSubmodules=false -C "$D" "$@"; }
note() { logger -t src-checkout "$*"; echo "src-checkout: $*"; }
fail() { logger -t src-checkout -p daemon.err "$*"; echo "src-checkout: $*" >&2; status error "$*"; exit 1; }
status() {
  local f=$STATE; mkdir -p "$(dirname "$f")" 2>/dev/null || f=$HOME/.cache/src-sync/status.json; mkdir -p "$(dirname "$f")"
  printf '{"host":"%s","path":"%s","state":"%s","head":"%s","msg":"%s","at":"%s"}\n' "$(hostname)" "$D" "$1" \
    "$(g rev-parse --short=12 HEAD 2>/dev/null)" "${2//\"/}" "$(date -u +%FT%TZ)" > "$f" 2>/dev/null || true
}
ensure() {
  [ -d "$D/.git" ] && return 0
  mkdir -p "$(dirname "$D")"
  GIT_TERMINAL_PROMPT=0 git clone -q --filter=blob:none --no-checkout --branch main "$REPO" "$D" || return 1
  [ -z "${SRC_SPARSE:-}" ] || g sparse-checkout set --cone $SRC_SPARSE
  g checkout -q main || return 1
  note "cloned $REPO into $D (${SRC_SPARSE:-full})"
}
update() {
  ensure || fail "clone of $REPO into $D failed"
  local old new p unit
  [ "$(g symbolic-ref -q --short HEAD)" = main ] || { note "HEAD is not main, left alone"; status skipped "not on main"; exit 0; }
  if [ -n "$(g status --porcelain --untracked-files=no)" ]; then note "tracked changes in $D, update skipped"; status skipped "dirty tree"; exit 0; fi
  old=$(g rev-parse HEAD)
  GIT_TERMINAL_PROMPT=0 g fetch -q --no-recurse-submodules origin main || fail "fetch failed"
  new=$(g rev-parse origin/main); [ "$old" = "$new" ] && { status current "up to date"; exit 0; }
  [ -z "${SRC_SPARSE:-}" ] || g sparse-checkout set --cone $SRC_SPARSE
  g merge -q --ff-only origin/main || fail "ff-only merge refused (diverged history)"
  note "$D ${old:0:12} -> ${new:0:12}"
  for p in ${SRC_RESTART:-}; do
    unit=${p#*=}; p=${p%%=*}
    g diff --quiet "$old" "$new" -- "$p" && continue
    ctl=(systemctl); u=$unit; case $unit in *:*) ctl=(systemctl --user -M "${unit%%:*}@"); u=${unit#*:};; esac
    "${ctl[@]}" restart "$u"; sleep 20
    if "${ctl[@]}" is-active -q "$u"; then note "$p changed -> restarted $unit"
    else # new code does not start: back to the previous commit
      g reset -q --hard "$old"; "${ctl[@]}" restart "$u"
      fail "$unit failed on ${new:0:12}, rolled back to ${old:0:12}"
    fi
  done
  if [ -n "${SRC_POST:-}" ]; then
    if (cd "$D" && SRC_ROOT="$D" bash -c "$SRC_POST") >/tmp/src-post.$$ 2>&1; then note "post '$SRC_POST' ok"
    else note "post '$SRC_POST' failed: $(tail -2 /tmp/src-post.$$ | tr '\n' ' ')"; fi
    rm -f /tmp/src-post.$$
  fi
  status updated "${old:0:12} -> ${new:0:12}"
}
case ${1:-update} in ensure) ensure ;; update) update ;; *) echo "usage: $0 [ensure|update]" >&2; exit 2 ;; esac
