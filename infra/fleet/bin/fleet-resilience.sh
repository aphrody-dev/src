#!/bin/bash
# Survive reboot, crash and kill: idempotent host hardening driven by /etc/fleet/resilience.conf
# (source: infra/fleet/<host>/resilience.conf). Runs as root on fr1, fr2, prd.
#   fleet-resilience.sh apply   drop-ins (Restart=, StartLimit, network-online), enable --now, linger,
#                               user units, wg-quick@, compose restart policy, fstab nofail, dead units off
#   fleet-resilience.sh check   report OK/FAIL per item, exit 1 on any FAIL
#   fleet-resilience.sh heal    restart what is down (units, user units, failed HTTP probes); called by fleet-health
# Rules kept from RUNBOOK.md: filtering = fleet-firewall (nft -f /etc/fleet/firewall.nft at boot);
# never enable ufw nor nftables.service.
set -uo pipefail
CONF=${FLEET_RESILIENCE_CONF:-/etc/fleet/resilience.conf}
[ -r "$CONF" ] || { echo "fleet-resilience: $CONF missing" >&2; exit 2; }
SERVICES="" TIMERS="" BATCH="" BATCH_LOCK="" WG="" USER_UNITS="" LINGER="" DISABLE="" DISABLE_USER="" PROBES="" NOFAIL="" FIREWALL_UNIT=fleet-firewall
# shellcheck source=/dev/null
. "$CONF"
# Bare names are services: nginx -> nginx.service (drop-in directories need the full unit name).
SERVICES=$(for u in $SERVICES; do case $u in *.*) echo "$u";; *) echo "$u.service";; esac; done | paste -sd" ")
ST=/var/lib/fleet-resilience; mkdir -p "$ST"
DROPIN=50-fleet-resilience.conf
mode=${1:-check}
rc=0
ok()   { echo "OK   $*"; }
bad()  { echo "FAIL $*"; rc=1; }
warn() { echo "WARN $*"; }
log()  { logger -t fleet-resilience "$*"; echo "$*"; }
uctl() { local u=$1; shift; systemctl --user -M "$u@" "$@"; }
uhome() { getent passwd "$1" | cut -d: -f6; }
src_runs() { # $1 unit or user:unit -> its main process runs code from $SRC_CHECKOUT
  local pid; case $1 in *:*) pid=$(uctl "${1%%:*}" show -p MainPID --value "${1#*:}");; *) pid=$(systemctl show -p MainPID --value "$1");; esac
  [ -n "$pid" ] && [ "$pid" != 0 ] && tr "\0" " " < "/proc/$pid/cmdline" 2>/dev/null | grep -q "$SRC_CHECKOUT/"
}

dropin_body() { # $1 = Type of the unit
  local r=always; [ "$1" = oneshot ] && r=on-failure
  printf '# managed by fleet-resilience (infra/fleet/bin/fleet-resilience.sh)\n[Unit]\nWants=network-online.target\nAfter=network-online.target\nStartLimitIntervalSec=600\nStartLimitBurst=20\n[Service]\nRestart=%s\nRestartSec=5s\n' "$r"
}
write_if_changed() { # $1 path, stdin content; prints 1 if changed
  local tmp; tmp=$(mktemp); cat > "$tmp"
  if [ -f "$1" ] && cmp -s "$tmp" "$1"; then rm -f "$tmp"; return 1; fi
  install -D -m 0644 "$tmp" "$1"; rm -f "$tmp"; return 0
}

apply() {
  local u t changed=0 user unit home
  for u in $SERVICES; do
    systemctl cat "$u" >/dev/null 2>&1 || { bad "unit absent: $u"; continue; }
    t=$(systemctl show -p Type --value "$u")
    dropin_body "$t" | write_if_changed "/etc/systemd/system/$u.d/$DROPIN" && changed=1
  done
  for u in $WG; do
    printf '# managed by fleet-resilience\n[Unit]\nStartLimitIntervalSec=600\nStartLimitBurst=20\n[Service]\nRestart=on-failure\nRestartSec=15s\n' \
      | write_if_changed "/etc/systemd/system/wg-quick@$u.service.d/$DROPIN" && changed=1
  done
  # BATCH: backups and syncs at the lowest priority; rclone bounded (env, and --transfers/--checkers/--bwlimit
  # stripped from the command line so the env applies); with BATCH_LOCK, serialized with heavy jobs (flock).
  for u in $BATCH; do
    case $u in *.*) ;; *) u=$u.service;; esac
    systemctl cat "$u" >/dev/null 2>&1 || continue
    local ex; ex=$(sed -n "s/^ExecStart=//p" "$(systemctl show -p FragmentPath --value "$u")" | grep -v "^$")
    [ "$(echo "$ex" | wc -l)" = 1 ] || { warn "$u: not a single ExecStart, priority only"; ex=; }
    {
      printf '# managed by fleet-resilience (BATCH)\n[Service]\nNice=19\nIOSchedulingClass=idle\nCPUWeight=10\nIOWeight=10\nTimeoutStopSec=30s\n'
      printf 'Environment=RCLONE_TRANSFERS=2 RCLONE_CHECKERS=4 RCLONE_BWLIMIT=%s\n' "${BATCH_BWLIMIT:-10M}"
      if [ -n "$ex" ]; then
        ex=$(echo "$ex" | sed -E 's/ --(transfers|checkers|bwlimit)[= ][^ ]+//g; s#^/usr/bin/flock -w [0-9]+ [^ ]+ ##')
        printf 'ExecStart=\nExecStart=%s%s\n' "${BATCH_LOCK:+/usr/bin/flock -w 7200 $BATCH_LOCK }" "$ex"
      fi
    } | write_if_changed "/etc/systemd/system/$u.d/$DROPIN" && changed=1
  done
  # Bounded shutdown (prd 2026-11-13: a dd blocked on FUSE in a login session held the reboot 4.5 min):
  # 30 s stop timeout for every unit and scope, docker 60 s, and a reboot watchdog that forces the reboot
  # when reboot.target is still pending after 5 min.
  local mc=0  # zz-: must sort after other system.conf.d files (fleet limits.conf sets 45s)
  rm -f /etc/systemd/system.conf.d/90-fleet-shutdown.conf /etc/systemd/user.conf.d/90-fleet-shutdown.conf
  printf '# managed by fleet-resilience\n[Manager]\nDefaultTimeoutStopSec=30s\nDefaultTimeoutAbortSec=30s\n' | write_if_changed /etc/systemd/system.conf.d/zz-fleet-shutdown.conf && mc=1
  printf '# managed by fleet-resilience\n[Manager]\nDefaultTimeoutStopSec=30s\n' | write_if_changed /etc/systemd/user.conf.d/zz-fleet-shutdown.conf && mc=1
  printf '# managed by fleet-resilience: reboot watchdog\n[Unit]\nJobTimeoutSec=5min\nJobTimeoutAction=reboot-force\n' | write_if_changed /etc/systemd/system/reboot.target.d/$DROPIN && changed=1
  systemctl cat docker.service >/dev/null 2>&1 && printf '# managed by fleet-resilience\n[Service]\nTimeoutStopSec=60s\n' | write_if_changed /etc/systemd/system/docker.service.d/60-fleet-stop.conf && changed=1
  [ $mc = 1 ] && systemctl daemon-reexec && log "systemd: DefaultTimeoutStopSec=30s (daemon-reexec)"
  [ $changed = 1 ] && systemctl daemon-reload
  # Read-only src checkout for host services (src-checkout-update.sh), cloned before the units that use it start.
  if [ -n "${SRC_CHECKOUT:-}" ] && [ -x /usr/local/bin/src-checkout-update.sh ]; then
    /usr/local/bin/src-checkout-update.sh ensure || bad "src checkout $SRC_CHECKOUT"
    for p in ${SRC_RESTART:-}; do # units still running an old copy -> restart on the checkout
      unit=${p#*=}; src_runs "$unit" && continue
      case $unit in *:*) uctl "${unit%%:*}" daemon-reload; uctl "${unit%%:*}" restart "${unit#*:}";; *) systemctl restart "$unit";; esac
      log "restarted $unit on $SRC_CHECKOUT"
    done
  fi
  for u in $SERVICES $TIMERS; do systemctl enable "$u" >/dev/null 2>&1; systemctl is-active -q "$u" || systemctl start "$u" 2>/dev/null; done
  for u in $WG; do systemctl enable "wg-quick@$u" >/dev/null 2>&1; systemctl is-active -q "wg-quick@$u" || ip link show "$u" >/dev/null 2>&1 || systemctl start "wg-quick@$u"; done
  systemctl enable "$FIREWALL_UNIT" >/dev/null 2>&1
  for user in $LINGER; do loginctl enable-linger "$user"; done
  for user in $LINGER; do
    home=$(uhome "$user"); changed=0
    for unit in $USER_UNITS; do
      [ "${unit%%:*}" = "$user" ] || continue; unit=${unit#*:}
      case $unit in *.service)
        [ -f "$home/.config/systemd/user/$unit" ] || continue
        t=$(uctl "$user" show -p Type --value "$unit" 2>/dev/null)
        if dropin_body "$t" | sed '/^Wants=\|^After=/d' | write_if_changed "$home/.config/systemd/user/$unit.d/$DROPIN"; then
          chown -R "$user:" "$home/.config/systemd/user/$unit.d"; changed=1; fi;;
      esac
    done
    [ $changed = 1 ] && uctl "$user" daemon-reload
    for unit in $USER_UNITS; do
      [ "${unit%%:*}" = "$user" ] || continue; unit=${unit#*:}
      uctl "$user" enable "$unit" >/dev/null 2>&1; uctl "$user" is-active -q "$unit" || uctl "$user" start "$unit" 2>/dev/null
    done
  done
  for u in $DISABLE; do
    systemctl cat "$u" >/dev/null 2>&1 || continue
    case "$(systemctl is-enabled "$u" 2>/dev/null)/$(systemctl is-active "$u")" in disabled/inactive|static/inactive|masked/*) continue;; esac
    systemctl disable --now "$u" >/dev/null 2>&1; systemctl reset-failed "$u" 2>/dev/null; log "disabled dead unit $u"
  done
  for unit in $DISABLE_USER; do
    user=${unit%%:*}; unit=${unit#*:}
    case "$(uctl "$user" is-enabled "$unit" 2>/dev/null)/$(uctl "$user" is-active "$unit" 2>/dev/null)" in disabled/inactive|static/inactive|masked/*|/*) continue;; esac
    uctl "$user" disable --now "$unit" >/dev/null 2>&1; uctl "$user" reset-failed "$unit" 2>/dev/null; log "disabled dead user unit $user:$unit"
  done
  # Compose-managed containers must come back after a docker/host restart.
  if command -v docker >/dev/null && systemctl is-active -q docker; then
    # live-restore: a dockerd crash or restart leaves containers running (without it, dockerd kills them on
    # restart and does not start them again; seen on fr2 2026-11-13). Reloadable by SIGHUP, no container restart.
    local dj=/etc/docker/daemon.json cur; cur=$(cat "$dj" 2>/dev/null || echo '{}')
    if [ "$(echo "$cur" | jq -r '."live-restore" // false')" != true ] && [ "$(docker info --format '{{.Swarm.LocalNodeState}}')" != active ]; then
      mkdir -p /etc/docker; echo "$cur" | jq '. + {"live-restore": true}' > "$dj.new" && mv "$dj.new" "$dj" && systemctl reload docker && log "docker: live-restore enabled"
    fi
    docker ps -q --filter label=com.docker.compose.project --filter label=com.docker.compose.oneoff=False | while read -r c; do
      [ "$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}/{{.HostConfig.AutoRemove}}' "$c")" = "no/false" ] \
        && docker update --restart unless-stopped "$c" >/dev/null && log "container $(docker inspect -f '{{.Name}}' "$c"): restart unless-stopped"
    done
  fi
  # fstab: secondary mounts never block boot (ssh must come up even if a data disk is missing).
  for m in $NOFAIL; do
    awk -v m="$m" '$1 !~ /^#/ && $2==m && $4 !~ /(^|,)nofail(,|$)/ {f=1} END{exit !f}' /etc/fstab || continue
    cp /etc/fstab "$ST/fstab.prev"
    awk -v m="$m" 'BEGIN{OFS="\t"} $1 !~ /^#/ && $2==m {$4=$4",nofail,x-systemd.device-timeout=30s"} {print}' "$ST/fstab.prev" > /etc/fstab.new
    if findmnt --verify --tab-file /etc/fstab.new >/dev/null 2>&1; then mv /etc/fstab.new /etc/fstab; systemctl daemon-reload; log "fstab: nofail on $m"
    else rm -f /etc/fstab.new; bad "fstab: nofail on $m rejected by findmnt --verify"; fi
    rm -f "$ST/fstab.prev"
  done
}

check() {
  local u f user unit home
  f=$(systemctl --failed --no-legend --plain | awk '{print $1}' | paste -sd' ')
  [ -z "$f" ] && ok "systemctl --failed empty" || bad "failed units: $f"
  for u in $SERVICES; do
    systemctl cat "$u" >/dev/null 2>&1 || { bad "$u absent"; continue; }
    local en ac r; en=$(systemctl is-enabled "$u" 2>/dev/null); ac=$(systemctl is-active "$u"); r=$(systemctl show -p Restart --value "$u")
    [ "$ac" = active ] && [ "$r" != no ] && case $en in enabled|static|alias|indirect|generated) true;; *) false;; esac \
      && ok "$u $en $ac Restart=$r" || bad "$u enabled=$en active=$ac Restart=$r"
  done
  for u in $TIMERS; do
    [ "$(systemctl is-enabled "$u" 2>/dev/null)" = enabled ] && systemctl is-active -q "$u" && ok "$u" || bad "$u enabled=$(systemctl is-enabled "$u" 2>&1) active=$(systemctl is-active "$u")"
  done
  for u in $WG; do
    [ "$(systemctl is-enabled "wg-quick@$u" 2>/dev/null)" = enabled ] && ip link show "$u" >/dev/null 2>&1 && ok "wg-quick@$u" || bad "wg-quick@$u enabled=$(systemctl is-enabled "wg-quick@$u" 2>&1) link=$(ip link show "$u" >/dev/null 2>&1 && echo up || echo down)"
  done
  [ "$(systemctl is-enabled "$FIREWALL_UNIT" 2>/dev/null)" = enabled ] && nft -c -f /etc/fleet/firewall.nft 2>/dev/null && nft list table inet fleet >/dev/null 2>&1 \
    && ok "firewall: $FIREWALL_UNIT enabled, /etc/fleet/firewall.nft valid, inet fleet loaded" || bad "firewall: $FIREWALL_UNIT/firewall.nft/inet fleet"
  for u in ufw nftables; do [ "$(systemctl is-enabled $u 2>/dev/null)" = enabled ] && bad "$u.service enabled (filtering is fleet-firewall only)"; done
  for user in $LINGER; do
    [ -e "/var/lib/systemd/linger/$user" ] && ok "linger $user" || bad "linger $user"
    f=$(uctl "$user" --failed --no-legend --plain 2>/dev/null | awk '{print $1}' | paste -sd' ')
    [ -z "$f" ] && ok "user $user: no failed unit" || bad "user $user failed: $f"
  done
  for unit in $USER_UNITS; do
    user=${unit%%:*}; unit=${unit#*:}
    [ "$(uctl "$user" is-enabled "$unit" 2>/dev/null)" = enabled ] && uctl "$user" is-active -q "$unit" && ok "user $user: $unit" \
      || bad "user $user: $unit enabled=$(uctl "$user" is-enabled "$unit" 2>&1) active=$(uctl "$user" is-active "$unit" 2>&1)"
  done
  [ "$(systemctl show -p DefaultTimeoutStopUSec --value)" = 30s ] && [ "$(systemctl show -p JobTimeoutUSec --value reboot.target)" = 5min ] \
    && ok "shutdown bounded (DefaultTimeoutStopSec=30s, reboot.target watchdog 5min)" || bad "shutdown not bounded"
  findmnt --verify >/dev/null 2>&1 && ok "fstab verify" || bad "findmnt --verify"
  for m in $NOFAIL; do awk -v m="$m" '$2==m && $4 ~ /nofail/ {f=1} END{exit !f}' /etc/fstab && ok "fstab nofail $m" || bad "fstab nofail $m"; done
  # Runtime state must not live in /tmp (wiped at boot).
  for u in $SERVICES; do
    systemctl show -p ExecStart -p WorkingDirectory -p EnvironmentFiles --value "$u" 2>/dev/null | grep -q '/tmp/' && bad "$u references /tmp"
  done
  if command -v docker >/dev/null && systemctl is-active -q docker; then
    f=$(docker ps --filter label=com.docker.compose.project --filter label=com.docker.compose.oneoff=False --format '{{.Names}}' | while read -r c; do
      [ "$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$c")" = no ] && echo "$c"; done | paste -sd' ')
    [ -z "$f" ] && ok "compose containers have a restart policy" || bad "containers without restart policy: $f"
    [ "$(docker info --format "{{.LiveRestoreEnabled}}")" = true ] && ok "docker live-restore" || bad "docker live-restore off"
  fi
  # Listeners started by hand (login session scope) do not survive a reboot: reported, not fatal.
  ss -Hltnp 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u | while read -r p; do
    grep -q 'session-[0-9]*\.scope' "/proc/$p/cgroup" 2>/dev/null && warn "manual listener pid=$p $(tr '\0' ' ' < "/proc/$p/cmdline" | cut -c1-80)"
  done
  if [ -n "${SRC_CHECKOUT:-}" ]; then
    git -c safe.directory="$SRC_CHECKOUT" -C "$SRC_CHECKOUT" rev-parse -q --verify HEAD >/dev/null 2>&1 && ok "src checkout $SRC_CHECKOUT $(git -c safe.directory="$SRC_CHECKOUT" -C "$SRC_CHECKOUT" rev-parse --short=12 HEAD)" || bad "src checkout $SRC_CHECKOUT"
  fi
  for p in ${SRC_RESTART:-}; do u=${p#*=}; src_runs "$u" && ok "$u runs from $SRC_CHECKOUT" || bad "$u not running from $SRC_CHECKOUT"; done
  [ -x /usr/local/bin/fleet-backup.sh ] && systemctl is-active -q fleet-backup.timer && ok "fleet-backup.timer" || bad "fleet-backup.timer"
}

heal() {
  local u user unit name url n code
  # Maintenance (deploy, migration): touch /var/lib/fleet-resilience/pause to stop every automatic restart.
  [ -e "$ST/pause" ] && { log "heal: paused ($ST/pause)"; return 0; }
  for u in $SERVICES $TIMERS; do
    systemctl is-active -q "$u" && continue
    systemctl reset-failed "$u" 2>/dev/null; systemctl start "$u" 2>/dev/null; log "heal: started $u ($(systemctl is-active "$u"))"
  done
  for u in $WG; do ip link show "$u" >/dev/null 2>&1 && continue; systemctl reset-failed "wg-quick@$u" 2>/dev/null; systemctl restart "wg-quick@$u"; log "heal: wg-quick@$u restarted (link was down)"; done
  for unit in $USER_UNITS; do
    user=${unit%%:*}; unit=${unit#*:}
    uctl "$user" is-active -q "$unit" 2>/dev/null && continue
    uctl "$user" reset-failed "$unit" 2>/dev/null; uctl "$user" start "$unit" 2>/dev/null; log "heal: started $user:$unit"
  done
  # Compose containers with a restart policy that exited after the last dockerd start (killed by a daemon
  # crash/restart, not stopped by hand earlier): start them again.
  if command -v docker >/dev/null && systemctl is-active -q docker; then
    local since; since=$(date -d "$(systemctl show -p ActiveEnterTimestamp --value docker)" +%s 2>/dev/null || echo 0)
    docker ps -a -q --filter label=com.docker.compose.project --filter label=com.docker.compose.oneoff=False --filter status=exited | while read -r c; do
      [ "$(docker inspect -f "{{.HostConfig.RestartPolicy.Name}}" "$c")" = no ] && continue
      [ "$(date -d "$(docker inspect -f "{{.State.FinishedAt}}" "$c")" +%s)" -ge $((since - 60)) ] || continue
      docker start "$c" >/dev/null && log "heal: started container $(docker inspect -f "{{.Name}}" "$c")"
    done
  fi
  # PROBES: "unit=url" ; 3 consecutive failures -> restart unit (software watchdog: none of these services
  # implement sd_notify WATCHDOG=1, so WatchdogSec= would kill them). Failure = 000 (refused/timeout), or 5xx
  # on a health endpoint only (a 502 on / can be normal).
  for p in $PROBES; do
    unit=${p%%=*}; url=${p#*=}; name=$(echo "$unit" | tr '/@:' '___')
    code=$(curl -sk -o /dev/null -m 8 -w '%{http_code}' "$url"); n=$(cat "$ST/probe.$name" 2>/dev/null || echo 0)
    if [ "$code" = 000 ] || { [ "${code:0:1}" = 5 ] && [[ $url =~ /(ready|health|healthz|liveliness) ]]; }; then n=$((n+1)); else n=0; fi
    if [ $n -ge 3 ]; then
      case $unit in *:*) uctl "${unit%%:*}" restart "${unit#*:}";; docker/*) docker restart "${unit#docker/}" >/dev/null;; *) systemctl restart "$unit";; esac
      log "heal: probe $url=$code x3 -> restarted $unit"; n=0
    fi
    echo $n > "$ST/probe.$name"
  done
}

case $mode in
  apply) apply; check ;;
  check) check ;;
  heal) heal ;;
  *) echo "usage: $0 apply|check|heal" >&2; exit 2 ;;
esac
exit $rc
