# Etude WSL + CachyOS + WSL CachyOS (2026-11-14)

Recherche et mesures seules. Aucune distro importee, aucun `.wslconfig` modifie, aucun build fr1 touche.
Sources vues dans la session (`gh api`, lectures `wsl` en lecture seule). SHA de reference: MicrosoftDocs/WSL `526e577`.

## 1. Etat mesure de ce PC (2026-11-14)

| Element | Valeur observee |
| --- | --- |
| WSL | 3.0.5.0 (release microsoft/WSL du 2026-11-03), WSLg 1.0.79, Windows 10.0.28120.3302 |
| Noyau | `6.18.58.1-microsoft-standard-WSL2` (branche `linux-msft-wsl-6.18.y`, seule branche recente; pas de 7.x) |
| Distro | `aphrody` (WSL2, defaut, running), os-release = CachyOS, systemd PID 1, `is-system-running` = running |
| pacman | `Architecture = auto x86_64_v3 x86_64`, depots `cachyos-v3`, `cachyos-core-v3`, `cachyos-extra-v3`, `cachyos` |
| CPU vu dans la VM | i7-13700F, `avx2 bmi2 fma movbe` presents, `avx512f` absent: v3 oui, v4/znver4 non |
| Mem / swap | 24 GB, swap 32 GB (`/dev/sdc`, VHD WSL), `vm.swappiness=100`, pas de zram |
| THP | `madvise` (config MS), defrag `madvise` |
| Sched | CFS/EEVDF noyau MS: pas de BORE, `CONFIG_SCHED_CLASS_EXT` non defini, `HZ=250`, `PREEMPT_NONE` (dynamic) |
| GPU | `/dev/dxg` present, `nvidia-smi -L` voit la RTX 4070, `/usr/lib/wsl/lib` (libcuda, libd3d12) |
| KVM | `/dev/kvm` present, `kvm_intel` charge, `nested=Y`, qemu et docker installes dans la distro |
| Horloge | `tsc` (source `hyperv_clocksource_tsc_page` detectee) |
| `wslc` | `wslc 3.0.5.0` present (builtin WSL) |

`.wslconfig` actuel: processors=24, memory=24GB, swap=32GB, nestedVirtualization, guiApplications, pageReporting, localhostForwarding, firewall=false; experimental: dnsTunneling, hostAddressLoopback, autoMemoryReclaim=gradual, sparseVhd, bestEffortDnsParsing. Aucune ligne `kernel=`: la distro tourne encore sur le noyau Microsoft.

### Mesures hyperfine (Windows -> `wsl -d aphrody`, noyau MS 6.18.58.1, runs 8-20)

| Test | Resultat |
| --- | --- |
| Demarrage `wsl -d aphrody -- /bin/true` (VM chaude, N=20) | 80.9 ms +- 10.0 (63.6..107.7) |
| Boucle CPU C `-O2` 4e8 iterations (gcc inclus) | 893 ms +- 8 |
| 300 x `cat` fichier ext4 (gcc inclus) | 712 ms +- 18 |
| 300 x `cat` fichier DrvFs `/mnt/c/src` (gcc inclus) | 1200 ms +- 73 |
| Delta DrvFs - ext4 | ~490 ms / 300 lectures, soit ~1.6 ms par ouverture DrvFs |

Limite: chaque cas recompile le binaire (gcc dans la mesure), les cas `spawn` (727 ms) et `ext4` (380 ms) sont incoherents entre eux (cache) et non retenus. Seuls l'ordre de grandeur du demarrage et le surcout DrvFs sont fiables. Noyau CachyOS custom: non mesurable (pas encore boote), aucune comparaison A/B possible aujourd'hui.

## 2. Findings avec sources

1. Une image CachyOS WSL officielle existe: `CachyOS/cachyos-wsl` (branche `cachyos`, release `2026.11.05.5` du 2026-11-05, build mensuel Actions, signee Cosign, base archlinux-wsl). Elle detecte le CPU au premier lancement et bascule sur znver4, x86-64-v4 ou v3 (`rootfs/usr/lib/wsl/optimize-repos`), avec garde-fou: znver4 refuse si `avx512f` absent car l'hyperviseur peut masquer des instructions. https://github.com/CachyOS/cachyos-wsl
2. L'image officielle desactive zram: `rootfs/etc/systemd/zram-generator.conf` ("WSL already provides swap and manages the VM memory, so no zram devices are created"). Elle garde `cachyos-settings`, `cachyos-rate-mirrors`, fish.
3. Le noyau MS est la seule source de `dxgkrnl`: `drivers/hv/dxgkrnl/` (dxgadapter.c, dxgvmbus.c, ioctl.c, dxgsyncfile.c...) existe dans `microsoft/WSL2-Linux-Kernel@linux-msft-wsl-6.18.y` et `CONFIG_DXGKRNL=y` dans `Microsoft/config-wsl`. Le `config` de `CachyOS/linux-cachyos/linux-cachyos-rc` ne contient aucun `DXGKRNL`: un noyau CachyOS 7.4-rc2 sans port du driver = pas de `/dev/dxg`, donc ni CUDA, ni D3D12, ni WSLg GPU. https://github.com/microsoft/WSL2-Linux-Kernel
4. Le `config` CachyOS rc compile en modules (`=m`) ce que WSL veut integre: `HYPERV_STORAGE`, `HYPERV_NET`, `HYPERV_VSOCKETS`, `PCI_HYPERV`, `NET_9P_VIRTIO`, `9P_FS`, `HYPERV_UTILS`, `HYPERV_BALLOON`; alors que `config-wsl` les met en `=y`. Sans initramfs adapte (le cmdline WSL charge `initrd=\initrd.img` systeme minimal), la VM ne boote pas ou perd reseau/vsock/disque. https://github.com/CachyOS/linux-cachyos
5. linux-cachyos-rc: `_major=7.4`, `_rcver=rc2`, defauts PKGBUILD `_cpusched=cachyos`, `_HZ_ticks=1000`, `_tickrate=full`, `_preempt=full`, `_hugepage=always`, `_use_llvm_lto=thin`, `_autofdo=no`, `_propeller=no`; le `config` fourni a `SCHED_CLASS_EXT=y`, `HZ=300`, `THP_ALWAYS=y`, `NTSYNC=m`, `KVM_INTEL=m`. (PKGBUILD et config lus sur main de `CachyOS/linux-cachyos`.)
6. `wslc.exe` est inclus a WSL 3.0.5 (verifie: `wslc 3.0.5.0`); la doc exige >= 2.9.3. C'est un CLI docker-like (`run`, `image ls`, `container ps`, `-p`) plus une API NuGet `Microsoft.WSL.Containers`. Il utilise une VM de session propre, separee de la VM WSL des distros: reglages dans `%LOCALAPPDATA%\wslc\settings.yaml` (`cpuCount`, `memorySize` defaut 50%, `maxStorageSize` 1TB, `idleTimeout` 30 s), `.wslconfig` ne s'y applique pas. https://learn.microsoft.com/windows/wsl/wsl-container
7. `.wslconfig` documente (MicrosoftDocs/WSL `wsl-config.md`): `kernel`, `kernelModules` (VHD de modules), `kernelCommandLine`, `loadKernelModules`, `loadDefaultKernelModules` (tun, ip_tables, br_netfilter), `kernelBootTimeout` 30000 ms, `systemDistro`, `gpuSupport`, `virtiofs` (experimental, defaut false), `networkingMode` = none/nat/bridged(deprecie)/mirrored/consomme, `isolateDistroCgroup`, `vmIdleTimeout` 60000, `nestedVirtualization` defaut true. Defauts experimentaux: `autoMemoryReclaim=dropCache`, `sparseVhd=false`.
8. Nested KVM fonctionne ici: `/dev/kvm`, `kvm_intel nested=Y`, 48 flags vmx visibles. Un noyau custom doit garder `KVM`, `KVM_INTEL`, `KVM_HYPERV` et `HYPERV` (config MS: `KVM=m`, `KVM_INTEL=m`, `KVM_AMD=m`, `KVM_HYPERV=y`, `VHOST_NET=m`, `VHOST_VSOCK=m`, `TUN=m`).
9. Surcout DrvFs mesure ~1.6 ms par ouverture contre ~0 sur ext4: tout build lourd doit vivre sur le VHDX ext4. `virtiofs` reste experimental dans la doc.
10. Sur ce PC le noyau MS est deja PREEMPT_DYNAMIC avec defaut `none`, HZ=250, mitigations CPU actives (`CPU_MITIGATIONS=y`, retpoline, IBRS entry, ITS, TSA, VMSCAPE) et `/sys/devices/system/cpu/vulnerabilities` en `Mitigation: Enhanced IBRS` + BHI_DIS_S.

## 3. Ce qui s'applique de CachyOS sous la VM Hyper-V WSL

| Element CachyOS | Effet sous WSL | Verdict |
| --- | --- | --- |
| Depots x86-64-v3 | actifs et deja utilises, CPU a avx2/bmi2/fma | oui, gain reel (paquets recompiles) |
| Depots v4 / znver4 | `avx512f` absent sur 13700F | non (garde-fou officiel refuse) |
| `cachyos-settings` (sysctl, udev, zram) | sysctl utiles; zram a neutraliser (swap WSL deja la) | oui sauf zram |
| Noyau linux-cachyos (BORE/EEVDF, sched_ext) | le noyau invite ordonnance les vCPU; l'hote Windows ordonnance la VM; benefice latence faible, `scx` demande `SCHED_CLASS_EXT=y` + BTF (`DEBUG_INFO_BTF` deja y) | optionnel, a mesurer |
| THP `always` | augmente RSS; interagit avec `pageReporting`/`autoMemoryReclaim`; WSL `madvise` plus sur | `madvise` conseille |
| LTO thin Clang | gain CPU modeste, build long; compatible LLVM partage | oui sur fr1 |
| AutoFDO / Propeller | `no` par defaut dans le PKGBUILD, demandent profil | non initial |
| `HZ=1000` full preempt | plus de wakeups, charge hote; pas de gain pour build | `HZ=250..300`, preempt voluntary/dynamic |
| zram | double compression avec swap VHD sparse; image officielle le coupe | non |
| NTSYNC (`=m` dans rc) | utile Wine/Proton CPU-side seulement | garder en module |

## 4. Checklist de config noyau pour un noyau CachyOS-based WSL

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

## 5. `.wslconfig` recommande (validation par le doc `wsl-config.md`)

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

## 6. Pitfalls

- GPU/WSLg avec noyau custom: sans `dxgkrnl` + `PCI_HYPERV` + `HYPERV_IOMMU` (finding 3-4) pas de `/dev/dxg`; WSLg (Weston, PulseAudio, RDP via vsock) depend aussi de `/mnt/wslg` et de `/tmp/.X11-unix` cree par l'init WSL (note de `/etc/wsl.conf` actuel: ne pas monter `/tmp` via fstab, `tmp.mount` masque). Les libs GPU viennent de Windows via `/usr/lib/wsl/lib` (ne pas les ecraser avec les paquets nvidia Linux: `ldconfig=true`/`appendLibPath`).
- systemd: `[boot] systemd=true` est requis; `initTimeout` defaut 10000 ms; `protectBinfmt` evite que systemd casse l'interop. Unites a masquer/neutraliser: zram-generator, `tmp.mount`.
- init: WSL lance son propre init (`WSL_ROOT_INIT=1`) puis systemd (cmdline observe: `initrd=\initrd.img`, fourni par WSL); un initrd mkinitcpio n'est pas necessaire, non verifie.
- Modules: un noyau avec modules exige `kernelModules` (VHD) coherent avec `uname -r`, sinon `tun`, `ip_tables`, `br_netfilter` (chargement par defaut) echouent.
- `autoMemoryReclaim` + THP `always`: la VM garde de la RSS; garder `madvise`.
- mitigations: les desactiver (`mitigations=off`) seulement apres mesure, `CONFIG_CPU_MITIGATIONS=y` sur MS par defaut.
- `kernelBootTimeout` 30 s par defaut: un noyau LTO/debug gros peut le depasser; le relever.
- wslc: VM separee, pas de partage d'images avec le Docker du distro; ses ports publies lient `127.0.0.1` par defaut (`defaultBindingAddress`).
- Une image CachyOS officielle ne fournit pas de noyau WSL custom: le noyau est celui du MS; le noyau linux-cachyos est un travail propre a ce depot.

## 7. wslc vs Docker Engine dans la distro

| Critere | wslc | Docker Engine dans `aphrody` |
| --- | --- | --- |
| Statut | builtin WSL (3.0.5, doc: >= 2.9.3), PRs CLI actives dans microsoft/WSL | paquet Arch, installe ici |
| VM | session dediee, `idleTimeout` 30 s | VM WSL de la distro, avec tout le reste |
| Config | `%LOCALAPPDATA%\wslc\settings.yaml` | systemd + `daemon.json` + `.wslconfig` |
| Stockage | VHDX propre (1TB max), `storagePath` | disque de la distro |
| GPU | declare dans l'API ("GPU access") | nvidia-container-toolkit + `/dev/dxg` |
| Ecosysteme | CLI sans compose/buildx confirmes | compose, buildx, registres, k8s |
| Integration Windows | API NuGet, ports sur 127.0.0.1, `host.wslc.internal` | localhost forwarding / mirrored |

## 8. Tableau de decision

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

## 9. Non mesure

- Noyau CachyOS custom (non boote), BORE/sched_ext/HZ/THP A/B, LTO/AutoFDO/Propeller, wslc vs Docker (temps de run), virtiofs, mirrored networking.
- Disque: benchmark ext4 pur non fiable (gcc dans la boucle).
