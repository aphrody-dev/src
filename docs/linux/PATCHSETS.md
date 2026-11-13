# Patchsets noyau : CachyOS en tier 1, même méthode pour les autres (2026-11-13)

Sources lues aujourd'hui : `CachyOS/linux-cachyos` `8e308d0a3895` (`linux-cachyos/PKGBUILD`, `linux-cachyos-server/PKGBUILD`, `script-znver4.sh`), `CachyOS/kernel-patches` (`7.3/sched`, `7.3/misc`), `Documentation/kbuild/llvm.rst` et `Documentation/dev-tools/autofdo.rst` (torvalds/linux master), API GitHub/GitLab, `git ls-remote`, kernel.org `releases.json`.

## 1. Méthode (identique pour chaque patchset)

1. **Registre** `infra/linux/patchsets.toml` : une entrée par source, une méthode de lecture officielle, une version épinglée. `ay linux status` compare en direct (`=` à jour, `->` amont plus récent, `x` exclu, `!` erreur) ; `ay linux sync --write` déplace les épingles.
2. **Fork + pile** quand on porte un patch : fork `aphrody-labs/<nom>` (skill `gh-fork`), pile `model = "series"` dans `infra/upstream/stacks.toml`, patchs dans `infra/upstream/patches/<pile>/` avec un trailer `Upstream-Status:` (vocabulaire Yocto, `docs/upstream/STRATEGY.md`).
3. **Suivi continu** sur prd (git seul, aucun build) : `aphrody-upstream.timer` 05:30 UTC lance `ay upstream sync bun,linux-cachyos,cachyos-pkgbuilds,kernel-patches,liquorix,scx --push` (vérifie que la série s'applique sur la pointe amont et avance le miroir du fork par l'API merge-upstream) ; `aphrody-linux-watch.timer` 06:00 UTC écrit `var/linux/status.json`. Conflit : code 3, unité en échec, fork intact (`STRATEGY.md` §9).
4. **Build** hors du PC : `ay linux build <saveur> --host fr1 --run` (conteneur CachyOS, `nice -n 19`, poids CPU minimal, refus si `ninja|autoninja|siso|reproxy|rewrapper` tourne, arrêt dès qu'un tel build démarre, code 75) ou `--host ci` (`linux-kernel.yml`). prd refusé.

## 2. CachyOS (tier 1)

| Réglage (`linux-cachyos/PKGBUILD`) | Défaut amont | Effet relevé dans le code |
|---|---|---|
| `_cpusched` | `cachyos` | `cachyos`, `bore`, `hardened` activent `SCHED_BORE` ; `eevdf` = EEVDF seul ; `bmq` ; `rt`, `rt-bore` = `PREEMPT_RT` |
| `_processor_opt` | vide (= `X86_NATIVE_CPU`) | `generic_v1..v4` -> `GENERIC_CPU` + `X86_64_VERSION` ; `zen4` -> `MZEN4` ; `native` |
| `_use_llvm_lto` | `thin` | `LTO_CLANG_THIN`, `thin-dist`, `full`, `none` ; LTO => `CC=clang LD=ld.lld LLVM=1 LLVM_IAS=1` |
| `_autofdo`, `_autofdo_profile_name` | non | `AUTOFDO_CLANG`, `CLANG_AUTOFDO_PROFILE=<profil>` |
| `_propeller`, `_propeller_profiles` | non | `PROPELLER_CLANG`, `CLANG_PROPELLER_PROFILE_PREFIX` |
| `_HZ_ticks`, `_tickrate`, `_preempt`, `_hugepage` | 1000, full, full, always | server : 300, full, lazy, madvise |
| `_use_kcfi`, `_build_nvidia_open`, `_build_zfs` | non | kCFI ; module NVIDIA ouvert 620.70.06 ; ZFS |

Les dépôts CachyOS livrent des variantes x86-64-v3, x86-64-v4 et znver4 (`script-v3-v4.sh`, `script-znver4.sh` : `_processor_opt=zen4`, conteneur `pttrr/docker-makepkg-znver4`). La source noyau vient des archives `CachyOS/linux` (`cachyos-7.3.4-1`), arbre ajouté comme remote `cachyos` de `third_party/linux`.

Conflit signalé : `docs/packaging/KERNELS.md` décrit le défaut comme « EEVDF, BORE en option » ; le commentaire du PKGBUILD dit « CachyOS Default Scheduler (EEVDF) », mais `_cpusched=cachyos` active `SCHED_BORE`. Le défaut réel est BORE sur EEVDF. Pour prd on garde EEVDF seul (`_cpusched=eevdf`), en accord avec `RECOMMENDATION.md` (BORE sans gain mesuré).

### Alignement sur la toolchain LLVM partagée

Patch `infra/upstream/patches/linux-cachyos/linux-cachyos_build_with_an_llvm_toolchain_directory_llvm_prefix.patch` : réglage `_llvm_prefix` ; s'il est posé, Kbuild reçoit `LLVM=<dir>/` (syntaxe de `llvm.rst`) et les paquets clang/llvm/lld sortent de `makedepends`. `Upstream-Status: Inappropriate` pour l'instant (proposable plus tard). Sur fr1, `infra/linux/kernels.toml` pointe vers le LLVM de l'usine Chromium (`/srv/chromium/src/third_party/llvm-build/Release+Asserts/bin`, clang 24.0.0git `86922d51`) : clang, ld.lld, llvm-ar, llvm-nm, llvm-objcopy, llvm-objdump, llvm-readelf, llvm-strip y sont (listé le 2026-11-13). En CI, le clang du conteneur CachyOS.

Limites : le paquet LLVM de Chromium n'a pas `llvm-profdata` ; la partie Rust du noyau (`rust`, `rust-bindgen`) reste celle du conteneur, donc pas de LTO inter-langages Rust/C dans le noyau tant que rustc et clang n'ont pas le même LLVM [NV : vérifier la règle Kconfig de la version 7.3].

### Saveurs (`ay linux flavors`)

| Saveur | Cible | Réglages |
|---|---|---|
| `prd` | EPYC 9354P (Zen 4) | `zen4`, EEVDF, 300 Hz, `lazy`, THP madvise, ThinLTO |
| `desktop-v3`, `desktop-v4` | postes x86-64-v3 / v4 | défauts CachyOS (BORE), ThinLTO |
| `kvm-v3` | invités KVM classe fr1/fr2 | comme `prd` en `generic_v3` |
| `prd-autofdo` | passe 1 AutoFDO | `_autofdo=yes _build_debug=yes` |

AutoFDO/Propeller : la collecte exige des branches LBR (Intel), BRS (Zen 3) ou `amd_lbr_v2` (Zen 4) (`autofdo.rst`). prd est un invité KVM dont `/proc/cpuinfo` n'expose que `perfmon_v2` (relevé le 2026-11-13) : aucun profil ne peut y être collecté. La passe 2 attend donc une machine physique ; d'ici là les saveurs restent ThinLTO + `-march`, l'essentiel du gain mesuré par Phoronix (`KERNELS.md`).

## 3. Autres patchsets

| Patchset | Source live | Version 2026-11-13 | Fork | Suivi |
|---|---|---|---|---|
| mainline / stable / longterm | kernel.org `releases.json` | 7.4-rc2 / 7.3.4 / 6.18.63 | `aphrody-labs/linux` | registre |
| CachyOS PKGBUILD | `_major._minor` | 7.3.4 | `linux-cachyos` | registre + pile (1 patch) |
| CachyOS kernel-patches | dossiers de séries | 7.4 | `kernel-patches` | registre + pile |
| BORE | `patches/stable` de `firelzrd/bore-scheduler` | 7.0.0 | - | registre |
| sched-ext | release `sched-ext/scx` | v1.1.4 | `scx` | registre + pile |
| zen | branches `<x.y>/main` | 7.3 | `zen-kernel` | registre + remote `zen` |
| XanMod | tags GitLab `xanmod/linux` | 7.3.4-xanmod1 | - (GitLab) | registre + remote `xanmod` |
| Liquorix | branches `<x.y>/master` | 7.3 | `liquorix-package` | registre + pile |
| Clear Linux | `clearlinux-pkgs/linux` | archivé | - | exclu |
| GKI | branches `android<N>-<x.y>` | android18-7.3 | - (Gerrit) | registre + remote `gki` + miroir fr1 |
| ChromeOS | branches `chromeos-<x.y>` | chromeos-6.12 ; release R159 | - (Gerrit) | registre + remote `chromeos` + miroir fr1 |

Patchs de perf retenus : aucun patch tiers n'est copié dans nos séries tant qu'un gain n'est pas mesuré sur nos hôtes (`docs/SCIENTIFIC-RIGOR.md`). Les patchsets sont lus à leur source (remotes de `third_party/linux`, forks) pour comparer et cueillir au besoin.
