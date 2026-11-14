#!/bin/bash
# Storage, memory and kernel tuning of one host, idempotent, driven by /etc/fleet/tune.conf
# (source: infra/fleet/<host>/tune.conf). Runs as root; fleet-tune.service re-applies it at every boot.
#   fleet-tune.sh apply   sysctl drop-in, zram (zram-generator), swapfile size, noatime remount, fstrim.timer,
#                         fleet-clean.timer
#   fleet-tune.sh check   OK/FAIL per item, exit 1 on any FAIL
#   fleet-tune.sh clean   disk cleanup with quotas (called by fleet-clean.timer)
# Never reboots. A kernel change goes through docs/linux and infra/fleet/bin/fleet-reboot-precheck.sh.
# Security hardening is out of scope here (sysctl hardening keys stay in 90-aphrody-serve.conf / fr1 sysctl).
set -uo pipefail
CONF=${FLEET_TUNE_CONF:-/etc/fleet/tune.conf}
[ -r "$CONF" ] || { echo "fleet-tune: $CONF missing" >&2; exit 2; }
SYSCTL="" ZRAM_SIZE="" ZRAM_ALGO=zstd SWAPFILE="" SWAP_SIZE="" SWAP_PRIO=10 NOATIME="" CLEAN_USERS="root"
TARGET_ROOTS="" TARGET_MAX_DAYS=14 BUN_CACHE_MAX_MB=2048 SCCACHE_MAX_MB=20480 DOCKER_KEEP_HOURS=336 BUILDER_KEEP=10GB
JOURNAL_MAX=1G TMP_MAX_HOURS=24 LOG_MAX_MB=200 HEAVY_LOCK=/var/lock/aphrody-heavy.lock
# shellcheck source=/dev/null
. "$CONF"
mode=${1:-check}; rc=0
ok()  { echo "OK   $*"; }
bad() { echo "FAIL $*"; rc=1; }
log() { logger -t fleet-tune "$*"; echo "$*"; }
SYSCTL_FILE=/etc/sysctl.d/95-fleet-tune.conf
ZRAM_FILE=/etc/systemd/zram-generator.conf
mb() { du -sm "$1" 2>/dev/null | cut -f1; }
to_mb() { numfmt --from=iec "$1" | awk '{ print int($1 / 1048576) }'; }

sysctl_body() { printf '# managed by fleet-tune (infra/fleet/<host>/tune.conf)\n'; tr ';' '\n' <<<"$SYSCTL" | sed 's/^ *//; /^$/d'; }

apply_sysctl() {
  [ -n "$SYSCTL" ] || return 0
  local tmp; tmp=$(mktemp); sysctl_body > "$tmp"
  if ! cmp -s "$tmp" "$SYSCTL_FILE" 2>/dev/null; then install -m 0644 "$tmp" "$SYSCTL_FILE"; log "sysctl: $SYSCTL_FILE written"; fi
  rm -f "$tmp"; sysctl -q -p "$SYSCTL_FILE"
}
check_sysctl() {
  local kv k v cur
  while IFS= read -r kv; do
    k=${kv%%=*}; k=${k// /}; v=${kv#*=}; v=$(echo $v)
    cur=$(sysctl -n "$k" 2>/dev/null | tr -s '\t ' ' ')
    [ "$cur" = "$v" ] && ok "sysctl $k = $v" || bad "sysctl $k = '$cur' (want '$v')"
  done < <(tr ';' '\n' <<<"$SYSCTL" | sed 's/^ *//; /^$/d')
}

apply_zram() {
  [ -n "$ZRAM_SIZE" ] || return 0
  if [ ! -x /usr/lib/systemd/system-generators/zram-generator ]; then
    if command -v pacman >/dev/null; then pacman -S --noconfirm --needed zram-generator >/dev/null
    elif command -v apt-get >/dev/null; then DEBIAN_FRONTEND=noninteractive apt-get install -y -qq systemd-zram-generator >/dev/null; fi
  fi
  local body; body=$(printf '# managed by fleet-tune\n[zram0]\nzram-size = %s\ncompression-algorithm = %s\nswap-priority = 100\n' "$ZRAM_SIZE" "$ZRAM_ALGO")
  if [ "$(cat "$ZRAM_FILE" 2>/dev/null)" != "$body" ]; then
    printf '%s\n' "$body" > "$ZRAM_FILE"; systemctl daemon-reload
    # A live zram0 in use keeps its size until the next boot; an absent one starts now.
    if swapon --show=NAME --noheadings | grep -q '^/dev/zram0$'; then log "zram: config written, size applies at next boot"
    else systemctl restart systemd-zram-setup@zram0.service && log "zram: zram0 started"; fi
  fi
  swapon --show=NAME --noheadings | grep -q '^/dev/zram0$' || systemctl start systemd-zram-setup@zram0.service
}
check_zram() {
  [ -n "$ZRAM_SIZE" ] || return 0
  swapon --show=NAME,PRIO --noheadings | grep -q '^/dev/zram0 *100$' && ok "zram0 swap prio 100" || bad "zram0 swap missing"
}

apply_swap() {
  [ -n "$SWAPFILE" ] && [ -n "$SWAP_SIZE" ] || return 0
  local want have fs; want=$(to_mb "$SWAP_SIZE"); have=0
  [ -f "$SWAPFILE" ] && have=$(( $(stat -c %s "$SWAPFILE") / 1048576 ))
  if [ "$have" -ne "$want" ]; then
    # Swap in use goes back to RAM (or zram) first: refuse when it would not fit.
    local used avail; used=$(swapon --show=NAME,USED --bytes --noheadings | awk -v f="$SWAPFILE" '$1==f {print int($2/1048576)}')
    avail=$(awk '/^MemAvailable:/ {print int($2/1024)}' /proc/meminfo)
    if [ "${used:-0}" -gt $(( avail / 2 )) ]; then bad "swap: $SWAPFILE holds ${used} MiB, only ${avail} MiB available, not resized"; return; fi
    swapoff "$SWAPFILE" 2>/dev/null; rm -f "$SWAPFILE"
    fs=$(stat -f -c %T "$(dirname "$SWAPFILE")")
    if [ "$fs" = btrfs ]; then btrfs filesystem mkswapfile --size "${want}m" "$SWAPFILE" >/dev/null   # nocow, no compression
    else fallocate -l "${want}M" "$SWAPFILE" && chmod 600 "$SWAPFILE" && mkswap -q "$SWAPFILE"; fi
    log "swap: $SWAPFILE ${have} MiB -> ${want} MiB"
  fi
  # fstab: one line for the swapfile with its priority (below zram).
  local line="$SWAPFILE none swap defaults,pri=$SWAP_PRIO 0 0"
  if ! grep -qxF "$line" /etc/fstab; then
    sed -i "\|^$SWAPFILE[[:space:]]|d" /etc/fstab; echo "$line" >> /etc/fstab; log "fstab: $line"
  fi
  swapon --show=NAME --noheadings | grep -qx "$SWAPFILE" || swapon -p "$SWAP_PRIO" "$SWAPFILE"
}
check_swap() {
  [ -n "$SWAPFILE" ] || return 0
  local size; size=$(swapon --show=NAME,SIZE --bytes --noheadings | awk -v f="$SWAPFILE" '$1==f {print int($2/1048576)}')
  [ -n "$size" ] && [ "$size" -ge $(( $(to_mb "$SWAP_SIZE") - 1 )) ] && ok "swapfile $SWAPFILE ${size} MiB" || bad "swapfile $SWAPFILE ${size:-off} (want $SWAP_SIZE)"
}

# noatime: remount live; the root of a host booted without a fstab line for / is remounted at every boot by
# fleet-tune.service, every other mount gets noatime in fstab.
apply_noatime() {
  local m
  for m in $NOATIME; do
    findmnt -no OPTIONS "$m" | tr , '\n' | grep -qx noatime && continue
    mount -o remount,noatime "$m" && log "noatime: $m remounted"
    if awk -v m="$m" '$2==m' /etc/fstab | grep -q .; then
      awk -v m="$m" 'BEGIN{OFS="\t"} $2==m && $4 !~ /(^|,)noatime(,|$)/ { sub(/(^|,)relatime/, "", $4); $4 = ($4 == "" || $4 == "defaults" ? "noatime" : $4 ",noatime") } {print}' /etc/fstab > /etc/fstab.fleet-tune && mv /etc/fstab.fleet-tune /etc/fstab
    fi
  done
}
check_noatime() {
  local m; for m in $NOATIME; do findmnt -no OPTIONS "$m" | tr , '\n' | grep -qx noatime && ok "noatime $m" || bad "noatime $m"; done
}

apply_units() {
  systemctl enable --now fstrim.timer >/dev/null 2>&1
  systemctl enable --now fleet-clean.timer >/dev/null 2>&1
  systemctl enable fleet-tune.service >/dev/null 2>&1
}
check_units() {
  local t; for t in fstrim.timer fleet-clean.timer; do systemctl is-active -q "$t" && ok "$t active" || bad "$t inactive"; done
  systemctl is-enabled -q fleet-tune.service && ok "fleet-tune.service enabled" || bad "fleet-tune.service not enabled"
}

clean() {
  local before after u home d
  before=$(df -BM --output=avail / | tail -1 | tr -dc 0-9)
  # Cargo target dirs (CACHEDIR.TAG written by cargo) untouched for TARGET_MAX_DAYS; skipped while a heavy job
  # holds the lock (fr1 CI/aphrody-heavy, prd light builds).
  # Read-only open, as heavy.sh: fs.protected_regular forbids O_CREAT on another user's file in /run/lock, even for root.
  [ -e "$HEAVY_LOCK" ] || (umask 0; : > "$HEAVY_LOCK")
  if [ -n "$TARGET_ROOTS" ] && ( exec 9<"$HEAVY_LOCK" && flock -n 9 ); then
    while IFS= read -r d; do
      d=$(dirname "$d")
      [ -z "$(find "$d" -maxdepth 3 -newermt "-${TARGET_MAX_DAYS} days" -print -quit 2>/dev/null)" ] || continue
      log "clean: cargo target $d ($(mb "$d") MiB, idle > ${TARGET_MAX_DAYS} d)"; rm -rf --one-file-system "$d"
    done < <(find $TARGET_ROOTS -xdev -maxdepth 6 -name CACHEDIR.TAG -path '*/target/CACHEDIR.TAG' 2>/dev/null)
  fi
  for u in $CLEAN_USERS; do
    home=$(getent passwd "$u" | cut -d: -f6); [ -n "$home" ] || continue
    d=$home/.bun/install/cache
    if [ -d "$d" ] && [ "$(mb "$d")" -gt "$BUN_CACHE_MAX_MB" ]; then log "clean: bun cache $d $(mb "$d") MiB > $BUN_CACHE_MAX_MB"; rm -rf "$d"; fi
    d=$home/.cache/sccache
    if [ -d "$d" ] && [ "$(mb "$d")" -gt "$SCCACHE_MAX_MB" ]; then  # oldest first down to the cap
      log "clean: sccache $d $(mb "$d") MiB > $SCCACHE_MAX_MB"
      find "$d" -type f -printf '%A@ %s %p\n' | sort -n | awk -v cap=$((SCCACHE_MAX_MB * 1048576)) '{ t += $2; f[NR] = $3; s[NR] = $2 } END { for (i = 1; i <= NR && t > cap; i++) { print f[i]; t -= s[i] } }' | xargs -r rm -f
    fi
  done
  if command -v docker >/dev/null && systemctl is-active -q docker; then
    docker builder prune -f --keep-storage "$BUILDER_KEEP" >/dev/null 2>&1
    docker image prune -af --filter "until=${DOCKER_KEEP_HOURS}h" >/dev/null 2>&1
  fi
  if command -v docker >/dev/null && systemctl is-active -q docker; then
    # container json logs over LOG_MAX_MB truncated in place (the daemon keeps its fd); networks without containers.
    find /var/lib/docker/containers -name "*-json.log" -size "+${LOG_MAX_MB}M" -exec truncate -s 0 {} + 2>/dev/null
    docker network prune -f >/dev/null 2>&1
    # build hosts only: stopped containers and dangling anonymous volumes (prd never: rollbacks and data).
    if [ "$(cat /etc/aphrody/role 2>/dev/null)" != prd ]; then
      docker container prune -f --filter "until=${DOCKER_KEEP_HOURS}h" >/dev/null 2>&1
      docker volume prune -f >/dev/null 2>&1
    fi
  fi
  # systemd: coredumps, failed unit state, journal of rotated files.
  rm -rf /var/lib/systemd/coredump/* 2>/dev/null
  systemctl reset-failed >/dev/null 2>&1
  journalctl -q --rotate --vacuum-time=7d >/dev/null 2>&1
  # nginx: rotated logs older than 3 d, live logs over LOG_MAX_MB truncated, then reopen.
  if [ -d /var/log/nginx ]; then
    find /var/log/nginx -type f \( -name "*.gz" -o -name "*.[0-9]" \) -mtime +3 -delete 2>/dev/null
    find /var/log/nginx -type f -name "*.log" -size "+${LOG_MAX_MB}M" -exec truncate -s 0 {} + 2>/dev/null
    command -v nginx >/dev/null && nginx -s reopen >/dev/null 2>&1
  fi
  command -v podman >/dev/null && podman image prune -af --filter "until=${DOCKER_KEEP_HOURS}h" >/dev/null 2>&1
  journalctl -q --vacuum-size="$JOURNAL_MAX" >/dev/null 2>&1
  # tmp files idle > TMP_MAX_HOURS, package caches, freed blocks to the hypervisor, page cache and memory compaction.
  find /tmp /var/tmp -xdev -mindepth 1 -mmin "+$((TMP_MAX_HOURS * 60))" ! -name "*.lock" ! -name ".X*" -delete 2>/dev/null
  if command -v pacman >/dev/null; then paccache -rk1 >/dev/null 2>&1 || pacman -Scc --noconfirm >/dev/null 2>&1; fi
  command -v apt-get >/dev/null && apt-get clean >/dev/null 2>&1
  fstrim -a >/dev/null 2>&1
  sync; echo 1 > /proc/sys/vm/drop_caches; echo 1 > /proc/sys/vm/compact_memory 2>/dev/null
  after=$(df -BM --output=avail / | tail -1 | tr -dc 0-9)
  log "clean: / free ${before} MiB -> ${after} MiB"
}

case $mode in
  apply) apply_sysctl; apply_zram; apply_swap; apply_noatime; apply_units; check_sysctl >/dev/null; check_zram >/dev/null; check_swap >/dev/null; check_noatime >/dev/null; check_units >/dev/null ;;
  check) check_sysctl; check_zram; check_swap; check_noatime; check_units ;;
  clean) clean ;;
  *) echo "usage: $0 apply|check|clean" >&2; exit 2 ;;
esac
exit $rc
