#!/bin/sh
# Move bulky non-Chromium trees from / (sda1) to /home (sdb1, btrfs) and bind-mount them back at the same path.
set -eu
dest=/home/.relocated
mkdir -p "$dest"
for d in /srv/build /srv/artifacts /opt/android-sdk /var/lib/yolo-cache; do
  mountpoint -q "$d" && { echo "skip $d (already a mount)"; continue; }
  t="$dest$(echo "$d" | tr / _)"
  rsync -aHAX --info=stats0 "$d/" "$t/"
  mv "$d" "$d.old"; mkdir -p "$d"
  grep -q " $d none bind" /etc/fstab || echo "$t $d none bind,x-systemd.requires-mounts-for=/home 0 0" >> /etc/fstab
  systemctl daemon-reload; mount "$d"
  rm -rf --one-file-system "$d.old"
  echo "moved $d -> $t"
done
df -h / /home | tail -2
