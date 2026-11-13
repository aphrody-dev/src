#!/bin/sh
# just ping (docs/VERSIONING.md): fleet hosts over ssh + public endpoints; exit 1 if anything is down.
set -u
fail=0
head=$(git -C "$(dirname "$0")/../../.." rev-parse --short HEAD 2>/dev/null)
for h in vps cdn prd; do
  r=$(timeout 25 ssh -o BatchMode=yes -o ConnectTimeout=10 "$h" \
    'printf "%s %s failed=%s" "$(systemctl is-system-running 2>/dev/null)" "$(sudo -n git -C /srv/src rev-parse --short HEAD 2>/dev/null || echo -)" "$(systemctl --failed --no-legend --plain | wc -l)"' 2>/dev/null) || { r="DOWN"; fail=1; }
  printf '%-4s %s\n' "$h" "$r"
done
for u in https://aphrody.com/ https://aphrody.com/api/health https://aphrody.app/ https://api.aphrody.com/ https://cdn.aphrody.com/ https://downloads.aphrody.com/; do
  c=$(curl -s -o /dev/null -m 15 -w '%{http_code} %{time_total}s' "$u") || c="000"
  case $c in 2*|3*|401*|404*) ;; *) fail=1 ;; esac
  printf '%-36s %s\n' "$u" "$c"
done
printf 'local HEAD %s ; exit %s\n' "$head" "$fail"
exit $fail
