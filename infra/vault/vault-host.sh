#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Host side of the aphrody vault (docs/infra/VAULT.md). Installed by `env-kit vault hosts install`
# into ~/.local/libexec/aphrody/vault-host.sh. Never prints a value: only names, counts, hashes.
#
#   keygen [--force]  age identity sealed by systemd-creds as credential "aphrody-vault-age";
#                     prints the public recipient only (the private key never leaves this host)
#   recipient         public recipient of the identity
#   receive           tar of age envelopes on stdin -> inbox (atomic swap), then apply
#   apply             inbox/<NAME>.age -> credstore/<NAME> (systemd-creds), idempotent by BLAKE3,
#                     revokes the credentials it applied earlier and no longer receives
#   fp NAME           BLAKE3 of the decrypted credential (proof without revealing it)
#   status            counts
set -euo pipefail
umask 077
# Non-interactive ssh and systemd user units may lack /usr/local/bin (b3sum on prd and fr2).
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin"

VAULT="${XDG_DATA_HOME:-$HOME/.local/share}/aphrody/vault"
if [ "$(id -u)" = 0 ]; then STORE=/etc/credstore.encrypted; USERFLAG=(); else
  STORE="${XDG_CONFIG_HOME:-$HOME/.config}/credstore.encrypted"; USERFLAG=(--user); fi
ID=aphrody-vault-age
NAME_RE='^[A-Za-z_][A-Za-z0-9_.-]{0,127}$'
mkdir -p "$VAULT/inbox" "$VAULT/applied" "$STORE"
# One receive/apply at a time (push from the PC and the hourly timer).
exec 9>"$VAULT/.lock"; flock -w 120 9 || { echo "vault-host: locked" >&2; exit 1; }

creds() { systemd-creds "${USERFLAG[@]}" "$@"; }
b3() { b3sum --no-names "$@"; }
command -v b3sum >/dev/null || { echo "vault-host: b3sum absent (MANIFEST is BLAKE3)" >&2; exit 1; }
identity() { creds decrypt --name="$ID" "$STORE/$ID" -; }
for t in age age-keygen systemd-creds tar flock; do command -v "$t" >/dev/null || { echo "vault-host: $t absent" >&2; exit 1; }; done

case "${1:-status}" in
  keygen)
    if [ -f "$STORE/$ID" ] && [ "${2:-}" != "--force" ]; then identity | age-keygen -y -; exit 0; fi
    age-keygen 2>/dev/null | creds encrypt --name="$ID" - "$STORE/$ID.new"
    # The previous identity stays as .old until an apply succeeds with the new one.
    [ -f "$STORE/$ID" ] && cp -f "$STORE/$ID" "$VAULT/identity.old"
    mv -f "$STORE/$ID.new" "$STORE/$ID"
    identity | age-keygen -y -
    ;;
  recipient) identity | age-keygen -y - ;;
  receive)
    rm -rf "$VAULT/inbox.new"; mkdir -p "$VAULT/inbox.new"
    tar -x -C "$VAULT/inbox.new" --no-same-owner --no-same-permissions
    [ -f "$VAULT/inbox.new/MANIFEST" ] || { echo "receive: MANIFEST absent, inbox kept" >&2; exit 1; }
    # Only regular files; a monotonic sequence refuses replays of older archives.
    [ -z "$(find "$VAULT/inbox.new" -mindepth 1 ! -type f -print -quit)" ] || { echo "receive: non-regular entry, inbox kept" >&2; exit 1; }
    seq=$(sed -n "s/^# seq \([0-9]\+\)$/\1/p" "$VAULT/inbox.new/MANIFEST" | head -1)
    last=$(cat "$VAULT/seq" 2>/dev/null || echo 0)
    [ -n "$seq" ] && [ "$seq" -gt "$last" ] || { echo "receive: sequence $seq not after $last, inbox kept" >&2; exit 1; }
    grep -q "^# allow-empty$" "$VAULT/inbox.new/MANIFEST" || grep -q "\.age$" "$VAULT/inbox.new/MANIFEST" || { echo "receive: empty MANIFEST without allow-empty, inbox kept" >&2; exit 1; }
    listed=" "
    while read -r h f; do
      [[ $h == "#" ]] && continue
      [[ $f =~ ^[A-Za-z_][A-Za-z0-9_.-]*\.age$ ]] && [ "$(b3 "$VAULT/inbox.new/$f")" = "$h" ] || { echo "receive: $f altered, inbox kept" >&2; exit 1; }
      listed+="$f "
    done < "$VAULT/inbox.new/MANIFEST"
    for p in "$VAULT"/inbox.new/* "$VAULT"/inbox.new/.[!.]*; do
      [ -e "$p" ] || continue; b=$(basename "$p"); [ "$b" = MANIFEST ] || [[ $listed == *" $b "* ]] || rm -rf "$p"
    done
    rm -rf "$VAULT/inbox.old"; mv "$VAULT/inbox" "$VAULT/inbox.old"; mv -T "$VAULT/inbox.new" "$VAULT/inbox"; rm -rf "$VAULT/inbox.old"
    echo "$seq" > "$VAULT/seq"
    flock -u 9
    exec "$0" apply
    ;;
  apply)
    applied=0 unchanged=0 revoked=0 failed=0
    shopt -s nullglob
    # No verified inbox (first run, crash between swaps): apply nothing, revoke nothing.
    [ -f "$VAULT/inbox/MANIFEST" ] || { echo "applied=0 unchanged=0 revoked=0 failed=0 inbox=absent"; exit 0; }
    identity >/dev/null || { echo "apply: identity unreadable" >&2; exit 1; }
    find "$STORE" -maxdepth 1 -name "*.new" -mmin +10 -delete 2>/dev/null || true
    for f in "$VAULT"/inbox/*.age; do
      n=$(basename "$f" .age)
      [[ $n =~ $NAME_RE ]] && [ "$n" != "$ID" ] || { failed=$((failed+1)); continue; }
      h=$(b3 "$f")
      if [ "$(cat "$VAULT/applied/$n" 2>/dev/null)" = "$h" ] && [ -f "$STORE/$n" ]; then unchanged=$((unchanged+1)); continue; fi
      if age -d -i <(identity) "$f" | creds encrypt --name="$n" - "$STORE/$n.new"; then
        mv -f "$STORE/$n.new" "$STORE/$n"; echo "$h" > "$VAULT/applied/$n"; applied=$((applied+1))
      else rm -f "$STORE/$n.new"; failed=$((failed+1)); fi
    done
    for a in "$VAULT"/applied/*; do
      n=$(basename "$a")
      [ -f "$VAULT/inbox/$n.age" ] && continue
      rm -f "$STORE/$n" "$a"; revoked=$((revoked+1))
    done
    date -u +%FT%TZ > "$VAULT/applied.at"
    [ "$failed" = 0 ] && rm -f "$VAULT/identity.old"
    # Exit 0: transport succeeded; per-name failures are reported, not retried in a loop.
    echo "applied=$applied unchanged=$unchanged revoked=$revoked failed=$failed store=$STORE"
    ;;
  fp)
    n="${2:?NAME}"; [[ $n =~ $NAME_RE ]] && [ "$n" != "$ID" ] || { echo "fp: invalid name" >&2; exit 2; }
    creds decrypt --name="$n" "$STORE/$n" - | b3sum --no-names
    ;;
  status)
    shopt -s nullglob; in=("$VAULT"/inbox/*.age); ap=("$VAULT"/applied/*)
    echo "inbox=${#in[@]} applied=${#ap[@]} identity=$([ -f "$STORE/$ID" ] && echo yes || echo no) at=$(cat "$VAULT/applied.at" 2>/dev/null || echo never) store=$STORE"
    ;;
  *) echo "usage: vault-host.sh keygen|recipient|receive|apply|fp NAME|status" >&2; exit 2 ;;
esac
