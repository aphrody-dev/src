#!/bin/sh
# FFmpeg LGPL-2.1 (no --enable-gpl, --enable-version3, --enable-nonfree) for prd (Arch), so that
# src/tv/ffmpeg links a distributable libav* (gate: src/tv/ffmpeg/tests/ffmpeg_license.rs).
# Arch's own PKGBUILD (pinned commit), same pkgname/sonames, so omacut and qt6-multimedia-ffmpeg keep
# their dependency; only GPL/v3 options and their libraries are dropped (x264, x265, xvid, vid.stab,
# rubberband, frei0r = GPL; gmp, opencore-amr = LGPLv3/Apache needing --enable-version3).
# Built on fr1 (the factory) in an archlinux container, installed on prd with pacman -U + IgnorePkg.
#   ssh vps 'aphrody-heavy sh -s' < infra/fleet/ffmpeg-lgpl/build.sh        -> /srv/build/ffmpeg-lgpl/out/*.pkg.tar.zst
#   sh infra/fleet/ffmpeg-lgpl/install-prd.sh                               (from the PC)
# Rollback on prd: sudo pacman -S ffmpeg (repo GPL build) && sudo sed -i '/^IgnorePkg = ffmpeg$/d' /etc/pacman.conf
set -eu
PKG_COMMIT=${PKG_COMMIT:-011bf6043} # ffmpeg 2:9.0.2-5 (gitlab.archlinux.org/archlinux/packaging/packages/ffmpeg)
OUT=${OUT:-/srv/build/ffmpeg-lgpl/out}
JOBS=${JOBS:-4}
mkdir -p "$OUT"
docker run --rm -i -v "$OUT:/out" -e PKG_COMMIT="$PKG_COMMIT" -e JOBS="$JOBS" archlinux:latest sh -s <<'EOF'
set -eu
pacman -Syu --noconfirm --needed base-devel git >/dev/null
useradd -m b && echo 'b ALL=(ALL) NOPASSWD: ALL' > /etc/sudoers.d/b
su b -c 'set -eu; cd ~ && git clone -q https://gitlab.archlinux.org/archlinux/packaging/packages/ffmpeg.git p && cd p && git checkout -q "$PKG_COMMIT"
gpg --batch --import keys/pgp/*.asc 2>/dev/null
for o in gpl version3 frei0r gmp libopencore_amrnb libopencore_amrwb librubberband libvidstab libx264 libx265 libxvid; do
  sed -i "/^    --enable-$o \\\\$/d" PKGBUILD
done
for d in gmp opencore-amr rubberband vid.stab x264 x265 xvidcore frei0r-plugins librubberband.so libvidstab.so libx264.so libxvidcore.so; do
  sed -i "/^ *$d\$/d; /^#* *$d\$/d" PKGBUILD
done
sed -i "/frei0r-plugins: /d; s/^license=(GPL-3.0-only)/license=(LGPL-2.1-or-later)/; s/^pkgrel=\(.*\)/pkgrel=\1.1/; s/^pkgdesc=.\(.*\).$/pkgdesc=\"\1 (LGPL-2.1 build, aphrody)\"/" PKGBUILD
if grep -nE -- "--enable-(gpl|version3|nonfree)" PKGBUILD; then exit 1; fi
MAKEFLAGS=-j$JOBS makepkg -s --noconfirm --nocheck >/tmp/makepkg.log 2>&1 || { tail -40 /tmp/makepkg.log; exit 1; }
cp ffmpeg-[0-9]*.pkg.tar.zst /out/'
EOF
ls -l "$OUT"
