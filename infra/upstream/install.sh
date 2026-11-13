#!/bin/sh
# Daily patch-stack sync for a fleet host, as the runner user (never root). Idempotent.
#   prd: ssh prd 'sudo -iu agent sh ~/agents/src/infra/upstream/install.sh'      -> bun,bunx
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

# Weight split (CLAUDE.md, docs/infra/FLEET.md): bun stacks on prd, Chromium only on fr1.
if [ -d /srv/chromium/src/.git ]; then
  STACKS=chromium GC=chromium ENV="Environment=AY_UPSTREAM_CHECKOUT_CHROMIUM=/srv/chromium/src"
else
  STACKS=bun,bunx GC=bun ENV=""
fi
STACKS=${UPSTREAM_STACKS:-$STACKS}

UNITS=$HOME/.config/systemd/user
mkdir -p "$UNITS"
for f in "$SRC"/infra/upstream/systemd/*; do
  sed -e "s|@SRC@|$SRC|g" -e "s|@BUN@|$BUN|g" -e "s|@STACKS@|$STACKS|g" -e "s|@GC@|$GC|g" -e "s|@ENV@|$ENV|g" "$f" > "$UNITS/$(basename "$f")"
done
export XDG_RUNTIME_DIR=${XDG_RUNTIME_DIR:-/run/user/$(id -u)}
systemctl --user daemon-reload
systemctl --user enable --now aphrody-upstream.timer >/dev/null
SRC_ROOT=$SRC "$BUN" "$SRC/packages/upstream/src/cli.ts" status $(echo "$STACKS" | tr , ' ') --no-fetch || true
echo "upstream install: ok host=$(hostname) stacks=$STACKS"
systemctl --user list-timers aphrody-upstream.timer --no-pager | head -3
