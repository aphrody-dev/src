# WSL aphrody (CachyOS)

Distro `aphrody` (CachyOS, x86-64-v3, systemd) importée depuis `target/wsl/aphrody-dev-<date>.wsl`, construite sur fr1 par `infra/wsl-distro/scripts/build-on-fr1.sh` (`PROFILE=dev`).
Le CPU (i7-13700F) supporte x86-64-v3, pas v4 (pas d'AVX-512).

## Installation

- Docker Desktop, ses distros et ses vhdx sont purgés (aucune sauvegarde, ordre du propriétaire). Docker Engine tourne dans la distro.
- Import : `wsl --import aphrody C:\wsl\aphrody target\wsl\aphrody-dev-<date>.wsl --version 2` puis `wsl --manage aphrody --set-sparse true`.
- Premier démarrage : `pacman-key --init && pacman-key --populate archlinux cachyos`, `sed -i 's/^#Server/Server/' /etc/pacman.d/mirrorlist`, `pacman -Syu`.
- Paquets : docker, docker-buildx, docker-compose, qemu-full, qemu-user-static(-binfmt), xfsprogs, weston, mesa-utils, vulkan-tools.

## Disque

- Données et images Docker : VHDX XFS dédié `C:\wsl\aphrody-data.vhdx` (expansible, label `aphrody-data`, monté sur `/var/lib/docker`, `noatime,discard,nofail`).
- Attache : `infra/wsl-distro/scripts/mount-data.ps1` (tâche planifiée à l'ouverture de session). WSL ne monte pas un VHDX au démarrage tout seul.
- NTFS (C:) reste NTFS : `fsutil behavior set disablelastaccess 1`, 8dot3 désactivé (registre), ReTrim, `DISM /StartComponentCleanup /ResetBase`.
- Travailler dans le VHD de la distro (ext4/XFS) et non sur `/mnt/c` : 10 000 fichiers créés en 97 ms contre 7780 ms via 9p.

## Docker

`/etc/docker/daemon.json` : overlayfs avec containerd image store, json-file 10m x 3, live-restore, cgroup v2 (pilote systemd), nofile 1048576. L'API écoute sur `unix:///var/run/docker.sock` et `127.0.0.1:2375` (loopback, réseau mirrored).
Côté Windows : `~/.local/bin/docker(.cmd)` délègue à `wsl -d aphrody docker`. `wslc` : `wslc-settings.yaml`.

## QEMU

KVM imbriqué (`nestedVirtualization=true`, `/dev/kvm` présent). binfmt `qemu-user-static` pour `docker buildx --platform linux/arm64`. QEMU Windows (WHPX) déjà installé via winget.

## Noyau

`kernel/build-kernel.sh` (fr1) : CachyOS 7.4-rc2 + BORE + dxgkrnl importé du noyau Microsoft. `packages/machine/wsl/wslconfig` (copie de `~/.wslconfig`) : `kernel=` et `kernelModules=` vers `target\wsl\`. Le noyau Microsoft 6.18.58.1 reste le repli GPU.

## Preuve (`infra/wsl-distro/scripts/proof.sh`)

Noyau 7.4.0-rc2-aphrody-cachyos-wsl2 booté, `/dev/dxg` et `/dev/kvm` présents, THP `madvise`, `nvidia-smi -L` voit la RTX 4070, `glxinfo` rend via D3D12 (Mesa 26.2.6), docker sur XFS.

| Mesure | Valeur |
| --- | --- |
| `docker run --rm alpine true` (depuis Windows, wsl.exe inclus, hyperfine 20 runs) | 623 ms (+-19) |
| `docker run --rm alpine true` dans la distro (moyenne de 20) | 693 ms |
| `docker buildx build --platform linux/arm64` (sans cache) | 1490 ms, `uname -m` = aarch64 |
| QEMU+KVM, Alpine virt jusqu au prompt login | 4349 ms |
| Création de 10 000 fichiers, VHD distro vs `/mnt/c` | 97 ms vs 7780 ms |
| Espace libre C: | 131,9 Go avant, 159,8 Go après (Docker purgé, VHDX distro et données créés) |

# Annexe : étude WSL + CachyOS (2026-11-14, ex WSL-CACHYOS-STUDY.md)

Sources vues dans la session (`gh api`, lectures `wsl`), MicrosoftDocs/WSL@526e577, microsoft/WSL2-Linux-Kernel@a9891719, CachyOS/linux-cachyos. Statut : le noyau CachyOS 7.4-rc2 avec dxgkrnl porté est booté et validé (voir Noyau), la conclusion "ne pas mettre kernel=" ne s'applique plus.
### 4. Checklist de config noyau pour un noyau CachyOS-based WSL

Cle = valeurs de `Microsoft/config-wsl` (6.18.y) ou verifiees par `/proc/config.gz` du noyau MS tournant.

| CONFIG | Valeur requise | Pourquoi |
| --- | --- | --- |
| `CONFIG_HYPERV` | y | base invite Hyper-V |
| `CONFIG_HYPERV_STORAGE` | y | disque racine VHDX (hv_storvsc) |
| `CONFIG_HYPERV_NET` | y | reseau NAT/mirrored |
| `CONFIG_HYPERV_VSOCKETS`, `CONFIG_VSOCKETS` | y | init WSL, interop, wslg |
| `CONFIG_HYPERV_UTILS`, `CONFIG_HYPERV_TIMER`, `CONFIG_HYPERV_BALLOON` | y | timesync (`hv_utils.timesync_implicit`), reclaim memoire |
| `CONFIG_PCI_HYPERV`, `CONFIG_PCI_HYPERV_INTERFACE`, `CONFIG_HYPERV_IOMMU` | y | passthrough PCI vers dxgkrnl |
| `CONFIG_DXGKRNL` | y (patch hors arbre a porter sur 7.4) | `/dev/dxg`: CUDA, D3D12, WSLg GPU |
| `CONFIG_NET_9P`, `CONFIG_NET_9P_FD`, `CONFIG_NET_9P_VIRTIO`, `CONFIG_9P_FS` | y | DrvFs `/mnt/c` (plan9 via vsock) |
| `CONFIG_VIRTIO_FS`, `CONFIG_VIRTIO_PCI`, `CONFIG_VIRTIO_MMIO`, `CONFIG_FUSE_FS` | y | virtiofs, WSLg, wslc |
| `CONFIG_VIRTIO_PMEM` | y | config-wsl |
| `CONFIG_EXT4_FS`, `CONFIG_OVERLAY_FS`, `CONFIG_SQUASHFS` | y | racine, docker, wsl system distro |
| `CONFIG_KVM`, `CONFIG_KVM_INTEL`, `CONFIG_KVM_HYPERV` | m/m/y | nested KVM |
| `CONFIG_VHOST_NET`, `CONFIG_VHOST_VSOCK`, `CONFIG_TUN` | m | qemu/containers |
| `CONFIG_CGROUPS`, `CONFIG_MEMCG`, `CONFIG_PSI`, `CONFIG_USER_NS` | y | systemd, docker, cgroup v2 |
| `CONFIG_NF_TABLES`, `CONFIG_BRIDGE`, `CONFIG_VETH`, `CONFIG_WIREGUARD`, `CONFIG_IP_VS` | y/m | reseau containers |
| `CONFIG_BINFMT_MISC`, `CONFIG_X86_X2APIC` | y | interop Windows, topologie |
| `CONFIG_PAGE_REPORTING` | y | `pageReporting`, `page_reporting_order=5` |
| `CONFIG_MODULES` + VHD modules | y | `.wslconfig kernelModules` si modules |
| `CONFIG_DEBUG_INFO_BTF` | y | sched_ext/eBPF |
| `CONFIG_SCHED_CLASS_EXT` | y optionnel | scx |
| `CONFIG_FB_HYPERV`, `CONFIG_HID_HYPERV_MOUSE`, `CONFIG_DRM_HYPERV` | non requis | pas de console graphique |
| `CONFIG_NTSYNC` | m | Wine |
| initramfs / modules par defaut | doit contenir `tun ip_tables br_netfilter` (ou `loadDefaultKernelModules`) | `wsl-config.md` |

Controle avant import: `scripts/config` diff entre le `.config` CachyOS et `Microsoft/config-wsl`; refuser tout `=m` de la section Hyper-V/9P/vsock.

### 5. `.wslconfig` recommande (validation par le doc `wsl-config.md`)

```ini
[wsl2]
processors=24
memory=24GB
swap=32GB
nestedVirtualization=true
guiApplications=true
gpuSupport=true
localhostForwarding=true
vmIdleTimeout=-1
kernelBootTimeout=60000
# kernel=C:\\Users\\aphro\\.local\\share\\wsl\\bzImage-cachyos-rc
# kernelModules=C:\\Users\\aphro\\.local\\share\\wsl\\modules.vhdx
# loadKernelModules=kvm_intel,vhost_net
# kernelCommandLine=transparent_hugepage=madvise

[experimental]
autoMemoryReclaim=gradual
sparseVhd=true
dnsTunneling=true
hostAddressLoopback=true
bestEffortDnsParsing=true
```

Notes: `kernel`/`kernelModules` restent commentes tant que le noyau custom n'a pas boote en banc (la section est inchangee, ce fichier ne modifie rien). `vmIdleTimeout=-1` garde la VM vivante (systemd services); `autoMemoryReclaim=gradual` (defaut doc `dropCache`). `firewall=false` actuel desactive le filtrage Hyper-V sur le trafic WSL: a justifier. `networkingMode=mirrored` non active ici: a n'ajouter qu'avec test des services (ports).

### 6. Pitfalls

- GPU/WSLg avec noyau custom: sans `dxgkrnl` + `PCI_HYPERV` + `HYPERV_IOMMU` (finding 3-4) pas de `/dev/dxg`; WSLg (Weston, PulseAudio, RDP via vsock) depend aussi de `/mnt/wslg` et de `/tmp/.X11-unix` cree par l'init WSL (note de `/etc/wsl.conf` actuel: ne pas monter `/tmp` via fstab, `tmp.mount` masque). Les libs GPU viennent de Windows via `/usr/lib/wsl/lib` (ne pas les ecraser avec les paquets nvidia Linux: `ldconfig=true`/`appendLibPath`).
- systemd: `[boot] systemd=true` est requis; `initTimeout` defaut 10000 ms; `protectBinfmt` evite que systemd casse l'interop. Unites a masquer/neutraliser: zram-generator, `tmp.mount`.
- init: WSL lance son propre init (`WSL_ROOT_INIT=1`) puis systemd (cmdline observe: `initrd=\initrd.img`, fourni par WSL); un initrd mkinitcpio n'est pas necessaire, non verifie.
- Modules: un noyau avec modules exige `kernelModules` (VHD) coherent avec `uname -r`, sinon `tun`, `ip_tables`, `br_netfilter` (chargement par defaut) echouent.
- `autoMemoryReclaim` + THP `always`: la VM garde de la RSS; garder `madvise`.
- mitigations: les desactiver (`mitigations=off`) seulement apres mesure, `CONFIG_CPU_MITIGATIONS=y` sur MS par defaut.
- `kernelBootTimeout` 30 s par defaut: un noyau LTO/debug gros peut le depasser; le relever.
- wslc: VM separee, pas de partage d'images avec le Docker du distro; ses ports publies lient `127.0.0.1` par defaut (`defaultBindingAddress`).
- Une image CachyOS officielle ne fournit pas de noyau WSL custom: le noyau est celui du MS; le noyau linux-cachyos est un travail propre a ce depot.

### 7. wslc vs Docker Engine dans la distro

| Critere | wslc | Docker Engine dans `aphrody` |
| --- | --- | --- |
| Statut | builtin WSL (3.0.5, doc: >= 2.9.3), PRs CLI actives dans microsoft/WSL | paquet Arch, installe ici |
| VM | session dediee, `idleTimeout` 30 s | VM WSL de la distro, avec tout le reste |
| Config | `%LOCALAPPDATA%\wslc\settings.yaml` | systemd + `daemon.json` + `.wslconfig` |
| Stockage | VHDX propre (1TB max), `storagePath` | disque de la distro |
| GPU | declare dans l'API ("GPU access") | nvidia-container-toolkit + `/dev/dxg` |
| Ecosysteme | CLI sans compose/buildx confirmes | compose, buildx, registres, k8s |
| Integration Windows | API NuGet, ports sur 127.0.0.1, `host.wslc.internal` | localhost forwarding / mirrored |

### 8. Tableau de decision

| Besoin | Choix | Raison |
| --- | --- | --- |
| Distro CachyOS maintenant | image officielle `CachyOS/cachyos-wsl` ou l'actuelle `aphrody` + depots v3 | deja fonctionnelle, GPU OK |
| GPU / CUDA / WSLg | noyau MS 6.18 `-microsoft-standard-WSL2` | seule source de dxgkrnl |
| Noyau linux-cachyos-rc 7.4 | uniquement si dxgkrnl porte et config Hyper-V en `=y`; sinon pas de GPU | findings 3-4 |
| Performance CPU | depots v3, build ext4, pas v4/znver4 | 13700F sans AVX-512 |
| Memoire | swap WSL + `autoMemoryReclaim=gradual`, pas de zram | zram double compression |
| Scheduler | EEVDF/CFS noyau MS; `scx` seulement apres mesure | gain non demontre sous Hyper-V |
| Conteneurs Windows-apps | wslc | integre, API |
| Conteneurs dev/CI/GPU | Docker Engine dans la distro | compose, toolkit nvidia |
| KVM/QEMU | `nestedVirtualization=true`, `/dev/kvm` | deja valide ici |
| Builds noyau | fr1 (inchange) | regle projet |
| Rollback | garder `kernel=` commente tant que le banc n'a pas passe | distro bootable |

### 9. Non mesure

- Noyau CachyOS custom (non boote), BORE/sched_ext/HZ/THP A/B, LTO/AutoFDO/Propeller, wslc vs Docker (temps de run), virtiofs, mirrored networking.
- Disque: benchmark ext4 pur non fiable (gcc dans la boucle).
