#!/bin/bash
# Single fleet notifier: one alert per cause and per 24 h (same rule as `ay auth daemon`), mail through Resend
# (send-only key FLEET_RESEND_KEY from the vault, user credstore of $NOTIFY_USER), optional webhook FLEET_ALERT_URL.
#   fleet-notify.sh send <cause> <message>   alert unless <cause> was already sent in the last 24 h
#   fleet-notify.sh scan                     (timer fleet-notify, 5 min) journald errors of the fleet tags since the
#                                            last cursor + failed units, one cause each
# State: /var/lib/fleet-notify (cursor, <sha>.sent). Never prints the key.
set -uo pipefail
[ -f /etc/fleet/resilience.conf ] && . /etc/fleet/resilience.conf
[ -f /etc/fleet/health.env ] && . /etc/fleet/health.env
ST=/var/lib/fleet-notify; mkdir -p "$ST"; chmod 700 "$ST"
TO=${FLEET_ALERT_TO:-contact@aphrody.com}; FROM=${FLEET_ALERT_FROM:-fleet@aphrody.com}
TAGS=${NOTIFY_TAGS:-fleet-health fleet-resilience fleet-backup src-checkout}
DAY=86400

key() { # FLEET_RESEND_KEY from the first user credstore that has it (vault: agent on prd, ubuntu on fr1/fr2)
  local u f
  for u in ${NOTIFY_USER:-agent ubuntu}; do
    f=$(getent passwd "$u" | cut -d: -f6)/.config/credstore.encrypted/FLEET_RESEND_KEY
    [ -f "$f" ] && runuser -u "$u" -- systemd-creds --user decrypt --name=FLEET_RESEND_KEY "$f" - 2>/dev/null | tr -d '\n' && return 0
  done
  return 1
}

send() { # $1 cause, $2 message
  local cause=$1 msg=$2 h s now k body
  h=$(printf '%s' "$cause" | sha256sum | cut -c1-16); s="$ST/$h.sent"; now=$(date +%s)
  [ -f "$s" ] && [ $((now - $(cat "$s"))) -lt $DAY ] && return 0
  logger -t fleet-notify "alert [$HOST] $cause: $msg"
  body=$(jq -n --arg f "fleet $HOST <$FROM>" --arg t "$TO" --arg s "[fleet $HOST] $cause" --arg x "$msg

host: $(hostname) ($HOST)  time: $(date -u +%FT%TZ)
next alert for this cause: in 24 h at the earliest (state $s)" '{from:$f,to:[$t],subject:$s,text:$x}')
  local ok=0
  if k=$(key) && [ -n "$k" ]; then
    printf 'Authorization: Bearer %s\n' "$k" | curl -sf -m 20 -H @- -H 'Content-Type: application/json' \
      -H "Idempotency-Key: fleet-$HOST-$h-$((now / DAY))" -d "$body" https://api.resend.com/emails -o /dev/null && ok=1
  fi
  [ -n "${FLEET_ALERT_URL:-}" ] && curl -sf -m 10 -H 'Content-Type: application/json' \
    -d "$(jq -n --arg c "[fleet $HOST] $cause: $msg" '{content:$c,text:$c}')" "$FLEET_ALERT_URL" -o /dev/null && ok=1
  if [ $ok = 1 ]; then echo "$now" > "$s"; else logger -t fleet-notify -p daemon.err "alert delivery failed for $cause"; return 1; fi
}

scan() {
  local cur args=() line cause u
  cur=$(cat "$ST/cursor" 2>/dev/null)
  for t in $TAGS; do args+=(-t "$t"); done
  if [ -n "$cur" ]; then args+=(--after-cursor "$cur"); else args+=(--since "-10min"); fi
  journalctl "${args[@]}" -p err -o json --no-pager --show-cursor -q 2>/dev/null > "$ST/scan.json"
  while read -r line; do
    t=$(jq -r '.SYSLOG_IDENTIFIER // "?"' <<<"$line"); m=$(jq -r '.MESSAGE // ""' <<<"$line")
    # Cause = tag + message with numbers, counters and pids removed (same failure, same cause).
    cause="$t: $(sed -E 's/\(x[0-9]+\)//g; s/\b[0-9a-f]{7,40}\b/H/g; s/[0-9]+/N/g' <<<"$m" | cut -c1-160)"
    send "$cause" "$m"
  done < <(grep '^{' "$ST/scan.json")
  cur=$(sed -n 's/^-- cursor: //p' "$ST/scan.json" | tail -1); [ -n "$cur" ] && echo "$cur" > "$ST/cursor"
  for u in $(systemctl --failed --no-legend --plain | awk '{print $1}'); do
    send "failed unit $u" "$(systemctl status "$u" --no-pager -n 15 2>&1 | head -30)"
  done
  rm -f "$ST/scan.json"
}

case ${1:-scan} in
  send) send "${2:?cause}" "${3:?message}" ;;
  scan) scan ;;
  *) echo "usage: $0 send <cause> <message> | scan" >&2; exit 2 ;;
esac
