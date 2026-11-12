#!/usr/bin/env bash
# Deploy NativeLink: `deploy.sh server` on fr1, `deploy.sh worker <sched-ip> <cache-bytes> [jobs]` on each builder.
set -euo pipefail
V=1.8.5; role=$1; here="$(cd "$(dirname "$0")" && pwd)"
if ! /usr/local/bin/nativelink --version 2>/dev/null | grep -q "$V"; then
  t=$(mktemp -d); curl -fsSL "https://github.com/TraceMachina/nativelink/releases/download/v$V/nativelink-$V-x86_64-unknown-linux-musl.tar.gz" | tar -xz -C "$t"
  sudo install -m755 "$(find "$t" -type f -name nativelink | head -1)" /usr/local/bin/nativelink; rm -rf "$t"
fi
sudo mkdir -p /etc/nativelink
if [ "$role" = server ]; then
  sudo mkdir -p /home/nativelink; sudo install -m644 "$here/server.json5" /etc/nativelink/server.json5
  cfg=/etc/nativelink/server.json5; envs="ReadWritePaths=/home/nativelink
ExecStartPre=+/bin/chown -R nativelink-server /home/nativelink"
else
  sudo install -m644 "$here/worker.json5" /etc/nativelink/worker.json5
  cfg=/etc/nativelink/worker.json5
  # systemd >= 262 mounts the DynamicUser state dir (/var/lib/private) noexec+idmapped: re-allow exec for the work dir.
  # NL_JOBS: 4th arg, else MemAvailable/2.5 GiB capped at nproc (max cxx RSS 2.97 GB in F0;
  # fr2 11 GiB with nproc=6 would OOM). Planned: fr1 10, prd 4, fr2 3.
  jobs="${4:-$(awk -v n="$(nproc)" '/MemAvailable/{j=int($2/2621440); if(j>n)j=n; if(j<1)j=1; print j}' /proc/meminfo)}"
  envs="Environment=NL_SCHED=$2 NL_CACHE_BYTES=$3 NL_JOBS=$jobs
ExecPaths=/var/lib/private/nativelink"
fi
sudo tee /etc/systemd/system/nativelink-$role.service >/dev/null <<UNIT
[Unit]
Description=NativeLink $role (REAPI for Chromium siso)
After=network-online.target
[Service]
$(printf "%b" "$envs")
DynamicUser=yes
StateDirectory=nativelink
ProtectSystem=strict
ProtectHome=read-only
NoNewPrivileges=yes
ExecStart=/usr/local/bin/nativelink $cfg
Restart=always
LimitNOFILE=1048576
Nice=5
[Install]
WantedBy=multi-user.target
UNIT
sudo systemctl daemon-reload; sudo systemctl enable --now nativelink-$role; sleep 2; systemctl is-active nativelink-$role
