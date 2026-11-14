#!/bin/sh
# just ping (docs/packaging/VERSIONING.md): fleet hosts over ssh + public endpoints; exit 1 if anything is down.
# Hosts are ~/.ssh/config aliases: vps = fr1 (factory), cdn = fr2 (edge), prd = production.
# A host fails when ssh fails, systemd is not `running`, or any unit is failed.
set -u
fail=0
head=$(git -C "$(dirname "$0")/../../.." rev-parse --short HEAD 2>/dev/null)
for h in vps cdn prd; do
  if r=$(timeout 25 ssh -o BatchMode=yes -o ConnectTimeout=10 -o ServerAliveInterval=5 -o ServerAliveCountMax=2 "$h" \
    'st=$(systemctl is-system-running 2>/dev/null); hd=$(sudo -n git -C /srv/src rev-parse --short HEAD 2>/dev/null || echo -)
     fc=$(systemctl --failed --no-legend --plain | wc -l | tr -d " ")
     printf "%s %s failed=%s" "${st:-unknown}" "$hd" "$fc"; [ "$st" = running ] && [ "$fc" -eq 0 ]' 2>/dev/null); then :
  else
    r=${r:-DOWN}; fail=1
  fi
  printf '%-4s %s\n' "$h" "$r"
done
# url|accepted status patterns: health and sites must answer 2xx/3xx; 404 only where no index exists.
for spec in \
  'https://aphrody.com/|2*|3*' \
  'https://aphrody.com/api/health|2*' \
  'https://aphrody.app/|2*|3*' \
  'https://api.aphrody.com/|2*|3*|401*' \
  'https://cdn.aphrody.com/|2*|3*|404*' \
  'https://downloads.aphrody.com/|2*|3*|404*'; do
  u=${spec%%|*}; allow=${spec#*|}
  c=$(curl -s -o /dev/null -m 15 -w '%{http_code} %{time_total}s' "$u"); c=${c:-000}
  ok=0; IFS='|'; for p in $allow; do case $c in $p) ok=1 ;; esac; done; unset IFS
  [ $ok = 1 ] || fail=1
  printf '%-36s %s\n' "$u" "$c"
done
printf 'local HEAD %s ; exit %s\n' "$head" "$fail"
exit $fail
