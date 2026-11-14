#!/bin/sh
# Install Arch from a provider rescue system (Debian-based on OVH). Usage: CONFIRM=REINSTALL-<host> HOST=fr2|fr1|usa sh 20-arch-install.sh
# Method: archlinux-bootstrap tarball + chroot pacstrap (ArchWiki "Install Arch Linux from existing Linux").
# Disks: fr2 sda 100G; fr1 sda 300G (sdb/sdc untouched here, see 30-fr1-stripe.sh); usa sda 400G.
. "$(dirname "$0")/lib.sh"; need_root; : "${HOST:?}"; need_confirm "$HOST"
DISK=${DISK:-/dev/sda}; not_mounted "$DISK"
KEY=${KEY:?path to authorized_keys to install}
MIRROR=${MIRROR:-https://geo.mirror.pkgbuild.com/iso/latest/archlinux-bootstrap-x86_64.tar.zst}
log "partition $DISK: bios_grub 1M, ESP 512M vfat, root XFS (OVH VPS and Hostinger boot BIOS or UEFI: keep both)"
sgdisk --zap-all "$DISK"
sgdisk -n1:0:+1M -t1:ef02 -n2:0:+1G -t2:ef00 -n3:0:0 -t3:fd00 -c3:root "$DISK"; partprobe "$DISK"; sleep 1
P=$( [ -e "${DISK}p3" ] && echo "${DISK}p" || echo "$DISK" )
mkfs.vfat -F32 "${P}2"
# defaults of mkfs.xfs (reflink=1, crc=1, finobt=1) are kept on purpose: man mkfs.xfs
ROOT="${P}3"; SU=""
if [ "$HOST" = fr1 ]; then  # ONE root over sda3+sdb+sdc (no /home, no /srv): mdraid0, chunk 512K, multi-zone since sizes differ
  not_mounted /dev/sdb; not_mounted /dev/sdc; wipefs -a /dev/sdb /dev/sdc
  mdadm --create /dev/md/root --metadata=1.2 --level=0 --chunk=512K --raid-devices=3 "${P}3" /dev/sdb /dev/sdc
  ROOT=/dev/md/root; SU="-d su=512k,sw=3"; fi
mkfs.xfs -f -L root $SU "$ROOT"
mkdir -p /mnt/root && mount -o noatime,logbufs=8,logbsize=256k "$ROOT" /mnt/root && mkdir -p /mnt/root/boot && mount "${P}2" /mnt/root/boot
cd /tmp && curl -fLO "$MIRROR" && mkdir -p /tmp/ab && tar -xf archlinux-bootstrap-x86_64.tar.zst -C /tmp/ab --strip-components=1
mount --bind /tmp/ab /tmp/ab; mount --rbind /mnt/root /tmp/ab/mnt; mount -t proc proc /tmp/ab/proc; mount --rbind /dev /tmp/ab/dev; mount --rbind /sys /tmp/ab/sys
cp /etc/resolv.conf /tmp/ab/etc/resolv.conf
echo 'Server = https://geo.mirror.pkgbuild.com/$repo/os/$arch' > /tmp/ab/etc/pacman.d/mirrorlist
chroot /tmp/ab sh -ec '
pacman-key --init && pacman-key --populate archlinux
pacstrap -K /mnt base linux linux-firmware xfsprogs mdadm dosfstools grub efibootmgr openssh sudo git rsync zram-generator wireguard-tools docker docker-buildx nginx nix cloudflared qemu-base libvirt dnsmasq just clang lld llvm cmake ninja mold sccache zstd btrfs-progs
genfscompat() { :; }
genfstab -U /mnt >> /mnt/etc/fstab
'
install -d -m700 /mnt/root/root/.ssh && install -m600 "$KEY" /mnt/root/root/.ssh/authorized_keys
echo "$HOST" > /mnt/root/etc/hostname
# serial console (OVH KVM) + both boot modes; fallback entry names are added by 40-kernel.sh
cat > /mnt/root/etc/default/grub <<G
GRUB_CMDLINE_LINUX="console=tty1 console=ttyS0,115200 rootflags=noatime,logbufs=8,logbsize=256k"
GRUB_DEFAULT=saved
GRUB_SAVEDEFAULT=true
GRUB_DISABLE_SUBMENU=y
G
# CachyOS repos (x86-64-v3 when the CPU supports it, checked in the rescue system; fr1/fr2 are Haswell = v3, no AVX-512).
# Source: https://mirror.cachyos.org/cachyos-repo.tar.xz (cachyos-repo.sh adds keys, mirrorlists, [cachyos-v3] repos). Skip with CACHY=0.
if [ "${CACHY:-1}" = 1 ]; then
  /lib64/ld-linux-x86-64.so.2 --help | grep -q 'x86-64-v3 (supported' || { echo "CPU lacks x86-64-v3: set CACHY=0" >&2; exit 1; }
  curl -fL https://mirror.cachyos.org/cachyos-repo.tar.xz -o /mnt/root/tmp/cachyos-repo.tar.xz
  chroot /tmp/ab arch-chroot /mnt sh -ec 'cd /tmp && tar xf cachyos-repo.tar.xz && cd cachyos-repo && ./cachyos-repo.sh && pacman -Syu --noconfirm'
fi
chroot /tmp/ab arch-chroot /mnt sh -ec "
ln -sf /usr/share/zoneinfo/UTC /etc/localtime; systemd-firstboot --locale=C.UTF-8 --timezone=UTC 2>/dev/null || true
grub-install --target=i386-pc $DISK
grub-install --target=x86_64-efi --efi-directory=/boot --removable
grub-mkconfig -o /boot/grub/grub.cfg
systemctl enable sshd systemd-networkd systemd-resolved docker nginx fstrim.timer
printf '[Match]\nName=en*\n[Network]\nDHCP=yes\n' > /etc/systemd/network/20-wan.network
"
log "OK: networking is DHCP; on OVH VPS verify the IPv4 /32 route (see doc) BEFORE leaving rescue. Then reboot from the provider panel."
# fr1 only: assemble md at early boot (mdadm_udev hook before filesystems) and record the array
if [ "$HOST" = fr1 ]; then
  mdadm --detail --scan >> /mnt/root/etc/mdadm.conf
  sed -i 's/^HOOKS=(\(.*\)block filesystems/HOOKS=(\1block mdadm_udev filesystems/' /mnt/root/etc/mkinitcpio.conf
  chroot /tmp/ab arch-chroot /mnt mkinitcpio -P && chroot /tmp/ab arch-chroot /mnt grub-mkconfig -o /boot/grub/grub.cfg
fi
