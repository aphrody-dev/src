#!/usr/bin/env bash
# SPDX-License-Identifier: Apache-2.0
# Sandbox test of vault-host.sh on a Linux host (temp XDG dirs, real systemd-creds --user, no unit
# touched). Copy vault-host.sh and this file to one directory on the host, then run: bash test-host.sh
# (or pipe vault-host.sh on stdin with --stdin-script). Last run: fr1, 2026-11-13, 9/9 ok.
# Checks: receive+apply, replay refused, empty MANIFEST refused, non-regular entry refused, decommission.
set -euo pipefail
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
export XDG_DATA_HOME=$T/data XDG_CONFIG_HOME=$T/cfg VAULT_HOST_NO_SYSTEMD=1
if [ "${1:-}" = --stdin-script ]; then sed -n '1,/^esac$/p' > "$T/vh.sh"; else cp "$(dirname "$0")/vault-host.sh" "$T/vh.sh"; fi
chmod 700 "$T/vh.sh"
ok() { echo "ok   $*"; }
ko() { echo "FAIL $*"; exit 1; }
R=$("$T/vh.sh" keygen | tail -1); [[ $R == age1* ]] && ok keygen || ko keygen
W=$T/w; mkdir "$W"
head -c 24 /dev/urandom | base64 | age -e -r "$R" -o "$W/FAKE_T.age"
mk() { (echo "# seq $1"; [ -n "${2:-}" ] && echo "$(b3sum --no-names "$W/FAKE_T.age")  FAKE_T.age" || echo "# ${3:-}") > "$W/MANIFEST"; }
mk 1 x; out=$(tar -cf - -C "$W" MANIFEST FAKE_T.age | "$T/vh.sh" receive); [[ $out == applied=1* ]] && ok "apply ($out)" || ko apply
[ -f "$T/cfg/credstore.encrypted/FAKE_T" ] && ok credstore || ko credstore
tar -cf - -C "$W" MANIFEST FAKE_T.age | "$T/vh.sh" receive 2>/dev/null && ko "replay accepted" || ok "replay refused"
mk 2 "" none; tar -cf - -C "$W" MANIFEST | "$T/vh.sh" receive 2>/dev/null && ko "empty accepted" || ok "empty MANIFEST refused"
mk 3 x; ln -s /etc/passwd "$W/evil"; tar -cf - -C "$W" MANIFEST FAKE_T.age evil | "$T/vh.sh" receive 2>/dev/null && ko "symlink accepted" || ok "symlink refused"
out=$("$T/vh.sh" decommission); [[ $out == "decommissioned revoked=1" ]] && ok "$out" || ko "decommission ($out)"
[ -z "$(ls -A "$T/cfg/credstore.encrypted")" ] && ok "credstore empty" || ko "credstore not empty"
[ ! -e "$T/vh.sh" ] && [ ! -d "$T/data/aphrody/vault" ] && ok "script and state removed" || ko "leftovers"
