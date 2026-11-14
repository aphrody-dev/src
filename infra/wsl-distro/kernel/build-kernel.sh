#!/bin/sh
# build-kernel.sh - aphrody CachyOS WSL 2 kernel (bzImage + modules VHDX for .wslconfig kernel= / kernelModules=).
# Runs on fr1 only (never on the PC):
#   ssh vps 'cd <checkout>/infra/wsl-distro && HEAVY_WAIT_MAX=14400 aphrody-heavy sh kernel/build-kernel.sh'
# Sources, all pinned:
#   CachyOS/linux release cachyos-7.4-rc2-2 (the tree linux-cachyos-rc builds, CachyOS/linux-cachyos@8e308d0a)
#   CachyOS/kernel-patches@21d72141 7.4/sched/0001-bore-cachy.patch
#   microsoft/WSL2-Linux-Kernel@a9891719 (linux-msft-wsl-6.18.y): config-wsl, drivers/hv/dxgkrnl, d3dkmthk.h,
#     Microsoft/scripts/gen_artifacts_vhdx.sh (modules VHDX layout expected by WSL)
# Output: $OUT/bzImage-aphrody-cachyos, $OUT/modules-aphrody-cachyos.vhdx, $OUT/config, $OUT/SHA256SUMS
set -eu
here=$(cd "$(dirname "$0")" && pwd)
W=${WORKDIR:-/srv/build/wsl-kernel}
OUT=${OUT:-$W/out}
JOBS=${JOBS:-$(( $(nproc) / 2 ))}
TAG=cachyos-7.4-rc2-2
BORE=https://raw.githubusercontent.com/CachyOS/kernel-patches/21d721415790e6717b2ece16e82e08eb98d16c00/7.4/sched/0001-bore-cachy.patch
MS=https://raw.githubusercontent.com/microsoft/WSL2-Linux-Kernel/a989171929bed4ea681be8d77333845ce1c1732a

mkdir -p "$W/dl" "$OUT"
cd "$W/dl"
[ -f "$TAG.tar.gz" ] || curl -fsSLO "https://github.com/CachyOS/linux/releases/download/$TAG/$TAG.tar.gz"
curl -fsSL "$BORE" -o 0001-bore-cachy.patch
curl -fsSL "$MS/arch/x86/configs/config-wsl" -o config-wsl
curl -fsSL "$MS/Microsoft/scripts/gen_artifacts_vhdx.sh" -o gen_artifacts_vhdx.sh
sha256sum "$TAG.tar.gz" 0001-bore-cachy.patch config-wsl gen_artifacts_vhdx.sh

rm -rf "$W/src" && mkdir -p "$W/src"
tar -xzf "$TAG.tar.gz" -C "$W/src" --strip-components=1
cd "$W/src"
patch -Np1 -i "$W/dl/0001-bore-cachy.patch"

# dxgkrnl (/dev/dxg, GPU-PV used by WSLg and Mesa d3d12/dzn) is not upstream: import it from the Microsoft tree.
mkdir -p drivers/hv/dxgkrnl include/uapi/misc
for f in Kconfig Makefile dxgadapter.c dxgkrnl.h dxgmodule.c dxgprocess.c dxgsyncfile.c dxgsyncfile.h \
    dxgvmbus.c dxgvmbus.h hmgr.c hmgr.h ioctl.c misc.c misc.h; do
  curl -fsSL "$MS/drivers/hv/dxgkrnl/$f" -o "drivers/hv/dxgkrnl/$f"
done
curl -fsSL "$MS/include/uapi/misc/d3dkmthk.h" -o include/uapi/misc/d3dkmthk.h
grep -q dxgkrnl drivers/hv/Kconfig || sed -i '$i source "drivers/hv/dxgkrnl/Kconfig"' drivers/hv/Kconfig
grep -q dxgkrnl drivers/hv/Makefile || printf 'obj-$(CONFIG_DXGKRNL)\t\t+= dxgkrnl/\n' >> drivers/hv/Makefile

# dxgkrnl needs the two VMBus GUIDs that Microsoft keeps in include/linux/hyperv.h.
grep -q HV_GPUP_DXGK_GLOBAL_GUID include/linux/hyperv.h || cat >> include/linux/hyperv.h <<'HV'

#define HV_GPUP_DXGK_GLOBAL_GUID \
	.guid = GUID_INIT(0xdde9cbc0, 0x5060, 0x4436, 0x94, 0x48, \
			  0xea, 0x12, 0x54, 0xa5, 0xd1, 0x77)
#define HV_GPUP_DXGK_VGPU_GUID \
	.guid = GUID_INIT(0x6e382d18, 0x3336, 0x4f4b, 0xac, 0xc4, \
			  0x2b, 0x77, 0x3, 0xd4, 0xdf, 0x4a)
HV
cp "$W/dl/config-wsl" .config
scripts/kconfig/merge_config.sh -m .config "$here/wsl2-cachyos-omarchy-7.4.config"
make LLVM=1 LLVM_IAS=1 olddefconfig
# Fail when the tree silently dropped a required option.
for opt in DXGKRNL PCI_HYPERV NET_9P_VIRTIO TRANSPARENT_HUGEPAGE_MADVISE HYPERV_VMBUS HYPERV_STORAGE HYPERV_NET HYPERV_VSOCKETS 9P_FS VIRTIO_FS EXT4_FS BINFMT_MISC SCHED_BORE; do
  grep -q "^CONFIG_$opt=y" .config || { echo "build-kernel: CONFIG_$opt is not =y after olddefconfig" >&2; exit 1; }
done

make LLVM=1 LLVM_IAS=1 -j"$JOBS" bzImage modules
rel=$(make -s LLVM=1 kernelrelease)
rm -rf "$W/stage" && mkdir -p "$W/stage/mod" "$W/stage/hdr" "$W/stage/perf"
make LLVM=1 INSTALL_MOD_PATH="$W/stage/mod" INSTALL_MOD_STRIP=1 modules_install
make LLVM=1 INSTALL_HDR_PATH="$W/stage/hdr" headers_install

cp arch/x86/boot/bzImage "$OUT/bzImage-aphrody-cachyos"
cp .config "$OUT/config"
rm -f "$OUT/modules-aphrody-cachyos.vhdx"
bash "$W/dl/gen_artifacts_vhdx.sh" "$W/stage/mod" "$W/stage/hdr" "$W/stage/perf" "$rel" "$OUT/modules-aphrody-cachyos.vhdx"
cd "$OUT" && sha256sum bzImage-aphrody-cachyos modules-aphrody-cachyos.vhdx config > SHA256SUMS
echo "kernelrelease $rel"
cat SHA256SUMS
