# AOSP (GKI) et Chromium OS : noyaux et manifestes (2026-11-13)

Pas de checkout complet, ni sur le PC ni sur fr1. Seuls les dépôts nécessaires aux noyaux sont mirrorés sur fr1, en clones nus partiels (`--filter=blob:none`) des branches suivies.

## Miroir partiel (fr1)

Script `infra/linux/android/mirror.sh` (garde : arrêt si moins de 60 Go libres), rafraîchi chaque dimanche par `aphrody-linux-mirror.timer` (`infra/linux/systemd/fr1/`, installé par `infra/upstream/install.sh`). Avant : 96 Go libres sur `/` de fr1 (`df`, usine Chromium sur le même disque). Premier passage le 2026-11-13, `/srv/build/mirror` :

| Dépôt | Branches | Taille |
|---|---|---|
| android/platform/manifest | main, android-latest-release | 952 Ko |
| android/kernel/manifest | common-android-mainline, common-android17-6.18, common-android18-7.3 | 260 Ko |
| android/kernel/build (kleaf) | main-kernel | 5,7 Mo |
| android/kernel/common | android-mainline, android17-6.18, android18-7.3 | 1,7 Go |
| chromiumos/manifest | main, stable | 38 Mo |
| chromiumos/third_party/kernel | chromeos-6.12 | 1,5 Go |

Après : 92 Go libres. Les versions suivies (branches GKI et ChromeOS les plus récentes, release R) sont dans `infra/linux/patchsets.toml` ; un saut de branche (android19, chromeos-6.18) apparaît dans `ay linux status` et s'ajoute au script.

## GKI

- Manifeste : `kernel/manifest` branche `common-android18-7.3` (ou `common-android-mainline`) ; local manifest `infra/linux/android/local_manifests/aphrody-gki.xml` (retire l'arbre Pixel `raviole` et le JDK). `repo init --reference=/srv/build/mirror/android` réutilise le miroir.
- Build : kleaf (Bazel hermétique, `tools/bazel run //common:kernel_x86_64_dist`), avec le clang préconstruit d'AOSP (`prebuilts/clang/host/linux-x86`). Exception documentée à la toolchain partagée : le GKI doit garder l'ABI et le KMI d'AOSP, donc son compilateur.
- Arbre local : remote `gki` de `third_party/linux` (déjà présent).

## Chromium OS

- Manifeste : `chromiumos/manifest` (`main`, `stable`, `release-R159-16883.B`).
- Noyau : `chromiumos/third_party/kernel` `chromeos-6.12` ; configuration par `chromeos/scripts/prepareconfig chromiumos-x86_64` (saveur `chromiumos-x86_64-generic.flavour.config`), puis Kbuild normal avec `LLVM=<dir>/`, donc le LLVM partagé de fr1 comme pour les saveurs CachyOS.
- Paquets : Portage ; `ay pkg gen <recette> --target portage` produit l'ebuild EAPI 8 pour l'overlay.
- Remote `chromeos` de `third_party/linux`.

## Patchs de performance

Les deux arbres portent déjà leurs propres séries (Android Common Kernel, ChromeOS). Rien n'est ajouté sans mesure ; la comparaison se fait par `git log` / `git range-diff` entre les remotes `gki`, `chromeos`, `cachyos` et `stable` de `third_party/linux`.
