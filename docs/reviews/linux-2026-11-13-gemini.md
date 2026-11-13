# Revue Gemini 2026-11-13 : couche système Linux (packages/linux, infra/linux, infra/pkg)

- Moteur : antigravity (20,6 s), via le relais (`gemini_ask`, engine `agy`) ; `gemini_review` (lot de 25 Ko) a expiré. Résumé soumis : kernel.sh, lancement systemd-run, validation des réglages, patch `_llvm_prefix`, scripts GPU, générateurs et CI.
- Note : 11/20

## Suite donnée

| #   | Grief                                                            | Suite                                                                                                                                                                               |
| --- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | contrôle toutes les 60 s ; clang/cargo/rustc non surveillés      | intervalle ramené à 20 s. clang/cargo non ajoutés : les agents compilent du Rust en continu sur fr1, le noyau ne démarrerait jamais ; la priorité vient des poids CPU/E/S (point 3) |
| 2   | préemption perd le travail                                       | accepté : `WORK` persiste (clone et `out/`), makepkg repart de zéro ; ccache non ajouté (LTO)                                                                                       |
| 3   | `--cpu-shares` seul                                              | corrigé : `--cpus` = moitié des cœurs, `--memory 16g`, `--pids-limit`, `--blkio-weight 10`, `MAKEFLAGS=-j<moitié>`                                                                  |
| 4   | nice de l'unité sans effet sur le conteneur ; conteneur orphelin | `nice -n 19` déjà dans le conteneur (commentaire ajouté) ; `trap` qui retire le conteneur à la sortie ; linger vérifié sur fr1 (`Linger=yes`)                                       |
| 5   | patchs depuis une URL mutable ; script dans /tmp prévisible      | corrigé : série lue seulement depuis le checkout src (commit épinglé) ; script distant écrit dans un `mktemp`                                                                       |
| 6   | clone non épinglé ; application partielle                        | `git apply --check` de toute la série avant application ; le clone suit volontairement la pointe du fork (miroir vérifié chaque jour par `ay upstream sync`)                        |
| 7   | `pacman -Syu` annule l'épinglage ; `gpg ...                      |                                                                                                                                                                                     | true` | accepté : base épinglée, mises à jour de sécurité voulues ; makepkg vérifie toujours la signature `.asc` (échec du build si la clé manque), commentaire ajouté |
| 8   | KNOBS non revalidés côté shell                                   | corrigé : même règle rejouée dans kernel.sh                                                                                                                                         |
| 9   | `$LLVM_DIR` non validé                                           | corrigé : `bin/clang` exécutable exigé                                                                                                                                              |
| 10  | patch PKGBUILD fragile                                           | déjà couvert : `ay upstream sync` vérifie chaque jour que la série s'applique sur la pointe amont (code 3 sinon)                                                                    |
| 11  | versions en dur, `usermod` sur root                              | versions suivies par `ay linux status --group gpu` ; `usermod` seulement pour `$SUDO_USER`                                                                                          |
| 12  | pas de lint de paquets ni de boot QEMU                           | ouvert : namcap/lintian à ajouter à la matrice ; boot QEMU du noyau à ajouter à `linux-kernel.yml`                                                                                  |

## Passe 2 (2026-11-13) : lint bloquant et preuve de boot

- Moteur : antigravity (14,5 s), relais `gemini_ask` engine `agy`, sur description des changements (pas d'accès au code). Note provisoire : 14/20.
- Livré : namcap (E: bloquant), lintian `--fail-on error,warning`, apkbuild-lint, après build et installation ; licences sous `/usr/share/licenses/<paquet>`, copyright DEP-5 complet. Boot : `infra/linux/build/boot/init.c` (PID 1 freestanding, modèle preinit de bun-LFS) + `boot.sh` (QEMU, KVM) ; preuve fr1 KVM sur linux-cachyos 7.3.3-1 : `APHRODY-UNAME Linux 7.3.3-1-cachyos x86_64 | #1 SMP PREEMPT_DYNAMIC Sun, 08 Nov 2026 21:25:49 +0000`, `APHRODY-BOOT-OK`, `uname -r` = dossier de modules du paquet. Job CI `boot-harness` à chaque changement.

| #   | Grief                                  | Suite                                                                                                                                   |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `tee` masque le code de namcap         | corrigé : sortie dans un fichier, code de namcap conservé sous `set -e`                                                                 |
| 2   | release seule ne prouve pas le binaire | accepté : release = dossier de modules du paquet extrait, `vmlinuz` du même paquet ; la ligne `version` (date de build) est journalisée |
| 3   | modules non chargés                    | accepté : preuve de démarrage du noyau, pas du jeu de modules                                                                           |
| 4   | repli TCG silencieux                   | corrigé : `REQUIRE_KVM=1` en CI, échec si `/dev/kvm` inutilisable ; mode affiché                                                        |
| 5   | lintian non épinglé                    | accepté : la version suit le conteneur épinglé par digest                                                                               |
| 6   | Alpine moins strict                    | réfuté : `abuild` construit, `apk add` installe et teste, puis `apkbuild-lint`                                                          |
| 7   | swap non borné                         | corrigé : `--memory-swap` = `--memory`                                                                                                  |
| 8   | une seule preuve                       | `boot-harness` en CI à chaque changement ; preuve sur le noyau construit par `linux-kernel.yml`                                         |
