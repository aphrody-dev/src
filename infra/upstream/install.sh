#!/bin/sh
# Daily patch-stack sync for a fleet host, as the runner user (never root). Idempotent.
#   prd: ssh prd 'sudo -iu agent sh ~/agents/src/infra/upstream/install.sh'      -> bun
#   fr1: ssh vps 'sh ~/agents/src/infra/upstream/install.sh'                      -> chromium
# Needs the agents runner checkout (infra/agents/install.sh), bun, git and gh with push rights on the
# forks (GH_TOKEN from systemd-creds --user on prd, gh hosts.yml on fr1). Doc: docs/upstream/STRATEGY.md.
set -eu
[ "$(id -u)" != 0 ] || { echo "upstream install: not as root" >&2; exit 1; }
SRC=${AGENTS_SRC:-$HOME/agents/src}
[ -f "$SRC/packages/upstream/src/cli.ts" ] || { echo "upstream install: $SRC has no packages/upstream (git -C $SRC pull)" >&2; exit 1; }
export PATH="$HOME/.bun/bin:$HOME/.local/bin:/usr/local/bin:$PATH"
BUN=$(command -v bun) || { echo "upstream install: bun missing" >&2; exit 1; }
command -v gh >/dev/null || { echo "upstream install: gh missing" >&2; exit 1; }

# Weight split (CLAUDE.md, docs/infra/FLEET.md): bun, Linux system and gaming mirror stacks on prd (git only, no build),
# Chromium only on fr1. Linux stacks: docs/linux/PATCHSETS.md.
if [ -d /srv/chromium/src/.git ]; then
  STACKS=chromium GC=chromium ENV="Environment=AY_UPSTREAM_CHECKOUT_CHROMIUM=/srv/chromium/src"
else
  STACKS=bun,linux-cachyos,cachyos-pkgbuilds,kernel-patches,liquorix,scx,gaming,web GC=bun ENV=""
fi
STACKS=${UPSTREAM_STACKS:-$STACKS}

UNITS=$HOME/.config/systemd/user
mkdir -p "$UNITS"
UNIT_FILES="$SRC/infra/upstream/systemd/*"
# Linux layer (docs/linux/OWNERSHIP.md): patchset watch on prd, partial kernel mirror on fr1.
case $STACKS in *linux-cachyos*) LINUX_TIMER=aphrody-linux-watch.timer UNIT_FILES="$UNIT_FILES $SRC/infra/linux/systemd/prd/*" ;; esac
case $STACKS in *chromium*) LINUX_TIMER=aphrody-linux-mirror.timer UNIT_FILES="$UNIT_FILES $SRC/infra/linux/systemd/fr1/*" ;; esac
for f in $UNIT_FILES; do
  sed -e "s|@SRC@|$SRC|g" -e "s|@BUN@|$BUN|g" -e "s|@STACKS@|$STACKS|g" -e "s|@GC@|$GC|g" -e "s|@ENV@|$ENV|g" "$f" > "$UNITS/$(basename "$f")"
done
export XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}
systemctl --user daemon-reload
systemctl --user enable --now aphrody-upstream.timer >/dev/null
[ -z "${LINUX_TIMER:-}" ] || systemctl --user enable --now "$LINUX_TIMER" >/dev/null
SRC_ROOT=$SRC "$BUN" "$SRC/packages/upstream/src/cli.ts" status $(echo "$STACKS" | tr , ' ') --no-fetch || true
echo "upstream install: ok host=$(hostname) stacks=$STACKS"
systemctl --user list-timers aphrody-upstream.timer --no-pager | head -3
