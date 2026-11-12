# Noyaux Linux : comparatif (2026-11-12)

Légende : chaque chiffre porte sa source et sa date ; `[NV]` = non vérifié dans cette session.

## Versions de référence

| Branche | Version | Source |
|---|---|---|
| mainline | 7.4-rc2 (2026-11-09) | kernel.org/releases.json, lu le 2026-11-12 |
| stable | 7.3.4 (2026-11-10), 7.2.15 (2026-11-01) | idem |
| longterm | 6.18.63, 6.12.117, 6.6.162, 6.1.192, 5.15.225 | idem |
| linux-cachyos (v4) | 7.3.3-1 ; variantes bore, eevdf, bmq, server, gcc, deckify ; hardened 7.2.11-2 | mirror.cachyos.org/repo/x86_64_v4/cachyos-v4/, 2026-11-12 |
| Arch `linux` | 7.2.15.arch1-1 (2026-11-10) | archlinux.org/packages JSON, 2026-11-12 |
| Arch `linux-zen` | 7.2.15.zen1 (2026-11-10) | idem |
| Alpine 3.24 `linux-lts` / `linux-virt` | 6.18.63-r0 | dl-cdn.alpinelinux.org v3.24/main, 2026-11-12 |
| Ubuntu 26.10 `linux` (generic) | 7.3.0-11.12 publié ; installé 7.3.0-9 sur fr1/fr2 | Launchpad API + `uname -r`, 2026-11-12 |
| Ubuntu 26.10 `linux-lowlatency` | candidat 7.3.0-10.10 | `apt-cache policy` sur fr2, 2026-11-12 |
| NixOS default | [NV] (nixos-unstable suit généralement le dernier LTS ; non consulté) | — |

Note : la release GitHub `CachyOS/linux-cachyos` « latest » affiche 6.17.9 (2025-12-01) ; le dépôt de paquets est la source à jour (7.3.3). Conflit de sources signalé.

## Résultats publics

- Phoronix, « Benchmarking The Different CachyOS Linux Kernel Flavors », 2026-06-02 : `linux-cachyos` par défaut (Clang ThinLTO + AutoFDO) premier en moyenne géométrique ; flavor `server` meilleur sur stress-ng ; `hardened` pénalité notable et io_uring désactivé ; peu d'écart sur Blender (CPU-bound user-space) ; LTS (6.18) meilleur sur Valkey, plus faible sur SVT-AV1. https://www.phoronix.com/review/cachyos-linux-flavors
- Phoronix, « Benchmarking The BORE Scheduler Performance With CachyOS », 2026-06-04 : BORE juste derrière le défaut (EEVDF) en moyenne géométrique ; pas de gain particulier. https://www.phoronix.com/review/cachyos-bore
- OrdinaTechnic, 2026-06 : même conclusion, le défaut bat les variantes à ordonnanceur alternatif. https://www.ordinatechnic.com/distribution-specific-guides/cachyos/a-benchmark-comparison-of-cachyoss-performance-optimized-kernels
- Phoronix 2026-04-30 : CachyOS devant Ubuntu 26.04 LTS et Fedora 44 (système complet, pas noyau isolé) ; 2026-08-18 idem sur station à 46 k$. https://www.phoronix.com/search/CachyOS

Lecture : l'essentiel du gain CachyOS vient de la compilation (LTO/AutoFDO/Propeller, -march v3/v4/znver) et non de BORE. Le gain noyau est faible sur charges CPU user-space, mesurable sur charges syscall/IO (stress-ng, réseau, io_uring).

## Caractéristiques

| Noyau | Ordonnanceur | Compilation | Préemption/HZ | sched_ext | Cible |
|---|---|---|---|---|---|
| linux-cachyos | EEVDF (défaut), BORE en option | Clang ThinLTO + AutoFDO (+ Propeller [NV]), paquets v3/v4/znver4 | full, 1000 Hz [NV] | oui | desktop, build |
| linux-cachyos-server | EEVDF | idem | moins préemptif, HZ plus bas [NV] | oui | serveur |
| Arch linux | EEVDF | GCC, x86-64 générique | PREEMPT_DYNAMIC, 1000 Hz (prd, /proc/config.gz) | oui (prd) | généraliste |
| Arch linux-zen | EEVDF + réglages latence | GCC, générique | full [NV] | oui [NV] | desktop |
| Ubuntu 26.10 generic | EEVDF | GCC, générique | PREEMPT_DYNAMIC, 1000 Hz (fr1/fr2 /boot/config) | oui | généraliste |
| Ubuntu lowlatency | EEVDF | GCC | réglage latence (Ubuntu a fusionné generic/lowlatency via PREEMPT_DYNAMIC depuis 24.04 [NV]) | oui | audio |
| Alpine linux-lts | EEVDF | GCC | voluntary [NV], 6.18 LTS | [NV] | conteneur, stabilité |
| Alpine linux-virt | idem, drivers réduits | GCC | idem | [NV] | VM/VPS minimal |
| NixOS default | EEVDF | GCC | [NV] | [NV] | reproductible |

## Hôtes (mesuré le 2026-11-12)

| Hôte | OS | Noyau | CPU | RAM | Options clés |
|---|---|---|---|---|---|
| prd | Arch Linux | 7.2.11-arch1-1 (repo : 7.2.15) | AMD EPYC 9354P, 8 vCPU, x86-64-v4 | 32 Go | PREEMPT=y, PREEMPT_DYNAMIC, NO_HZ_FULL, HZ=1000, SCHED_CLASS_EXT, THP always, I/O none/mq-deadline |
| fr2 (cdn) | Ubuntu 26.10 | 7.3.0-9-generic (archive : 7.3.0-11) | Haswell (KVM), 6 vCPU, x86-64-v3 | 11,4 Go | PREEMPT_DYNAMIC, NO_HZ_FULL, HZ=1000, SCHED_CLASS_EXT, THP madvise |
| fr1 (vps) | Ubuntu 26.10 | 7.3.0-9-generic | Haswell (KVM), 12 vCPU, x86-64-v3 | 46 Go | idem fr2 |

Les trois hôtes ont un retard de mise à jour noyau (prd 4 révisions stables, fr1/fr2 2 révisions Ubuntu).

## Meilleur noyau par usage

| Usage | Choix | Raison |
|---|---|---|
| Desktop/jeu, latence | linux-cachyos (défaut, EEVDF), paquet znver4/v4 si CPU compatible | premier en moyenne Phoronix 2026-06-02 ; BORE sans gain prouvé (2026-06-04) |
| Serveur de build (débit) | linux-cachyos-server v4 sur Arch | meilleur stress-ng ; compilation dominée par user-space donc gain modeste |
| Hôte conteneurs | noyau stable de la distro + sched_ext disponible ; cachyos-server si Arch | patches sécurité rapides, cgroup v2 |
| Petit VPS | noyau générique de la distro (Ubuntu generic) ou Alpine linux-virt | un noyau custom sur KVM apporte peu, coût de maintenance élevé |
