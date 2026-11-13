# Revue Gemini e8ae3a2b7e6f

- Commit : Epic/Bevy : sync des forks sur fr1 (fork-sync.timer, session gh existante, 33/33), CI reduite a l'instantane ; revue Gemini 3 (12/20) appliquee : une seule source de verite (snapshot.json, forks.txt), royalties retirees faute d'EULA lue, legendary epingle @170964e7
- Moteur : antigravity (29766 ms)

**Note : 13/20**

Défauts vérifiables (relecture du diff uniquement, rien n'a été exécuté) :

1. `fork-sync.sh:109` : le filtre `grep -E '^(EpicGames|bevyengine|trumank|FabianFG|UE4SS-RE|legendary-gl|3ddelano)/'` écrit les propriétaires en dur. Cela contredit « une seule source de verite ». Il exclut aussi `AstroTechies`, `4sval`, `Heroic-Games-Launcher`, `RareDevs` et `devphmd`, que RESOURCES.md décrit comme « community repos above ». Correction : supprimer le grep et synchroniser toutes les lignes de `forks.txt`.
2. `fork-sync.sh:109` : `cut -d' ' -f1` suppose un format `forks.txt` avec séparateur espace. Le diff ne montre pas ce fichier. Les lignes vides ou les commentaires `#` seraient traités comme des dépôts. Correction : `grep -vE '^\s*(#|$)'` avant le `cut`, et documenter le format.
3. `fork-sync.sh:113` : le nom du fork est déduit par `${up#*/}`. Deux amont avec le même nom de dépôt sous des propriétaires différents entrent en collision. Le `sort -u` ne le détecte pas. Correction : lire le nom du fork dans `forks.txt`, ou détecter les doublons.
4. `fork-sync.sh:113` : `gh repo sync` sans `--force` ne gère pas un fork qui a divergé. Il échoue avec « not a fast-forward ». RESOURCES.md:80 annonce pourtant « fast-forwards ». Le cas n'est pas traité et sa conséquence n'est pas documentée. Un fork archivé échoue aussi (cas `aphrody-labs/bevy` noté dans l'ancien texte). Cette note de RESOURCES.md a été supprimée sans que le cas soit géré dans le script.
5. `fork-sync.sh:113-117` : `set -eu` sans `pipefail` (le script est en `sh`). La ligne 106 (`gh api … | base64 -d`) masque l'échec de `gh api` : le fichier `forks.txt` vide donne ok=0 failed=0 et sortie 0. Correction : tester que `$tmp/up` n'est pas vide, sinon `exit 1`.
6. `fork-sync.sh:106` : `base64 -d` sur `.content` échoue si GitHub renvoie des retours à la ligne et que la version de base64 est stricte. Un fichier de plus d'1 Mo n'a pas de `.content`. Correction : `gh api -H 'Accept: application/vnd.github.raw' …`.
7. `fork-sync.sh:100` : le défaut lit `forks.txt` depuis GitHub (`aphrody-labs/src`), alors que RESOURCES.md:87 le présente comme dans le dépôt local. Le timer dépend donc d'un push préalable et du réseau. Pas de contrôle de cohérence avec les forks réellement présents.
8. `fork-sync.service:6` : `ExecStart=%h/.local/bin/fork-sync.sh`. Rien dans le commit n'installe le script de `infra/fleet/bin/` vers `~/.local/bin/`, ni les unités vers `~/.config/systemd/user/`. Aucun `enable --now`, aucun `loginctl enable-linger` (indispensable pour un timer utilisateur sans session ouverte). Cela contredit « tout survit au reboot ». Correction : un script d'installation ou une entrée dans le justfile.
9. `fork-sync.service` : le `PATH` d'une unité utilisateur ne contient pas forcément `gh` s'il est installé sous `~/.local/bin`. Il manque aussi `Environment=GH_CONFIG_DIR` ou `PATH=`. Pas d'`OnFailure=` ni d'alerte : un échec reste silencieux dans journald.
10. `fork-sync.timer:4` : `OnCalendar=*-*-* 00/6:41:00` est valide mais obscur. Le commit n'affiche aucune vérification par `systemd-analyze calendar`. Le fichier n'a pas de newline final (`\ No newline at end of file`).
11. `RESOURCES.md:80` : « 33 ok, 0 failed » n'a pas de source versionnée dans le dépôt, seulement dans le message de commit. Le compte de 33 n'est pas contrôlable. Il est aussi incohérent avec le filtre en dur du point 1, si `forks.txt` contient d'autres propriétaires.
12. `RESOURCES.md:81-82` : les deux mécanismes (CI toutes les 6 h et timer toutes les 6 h) partagent la même source `forks.txt`. Rien n'indique si `upstream-sync.yml` fait encore `gh repo sync`. Le diff ne le retire pas, donc le risque de double synchronisation est possible. À vérifier.
13. `RESOURCES.md:23` : « Lore: open source and free to use. » reste sans source. Le contenu précis sur la licence a été supprimé, sans pointeur vers le champ `license` de `snapshot.json` (affirmation citée à la ligne 8 : « MIT »).
14. `RESOURCES.md:34` : la ligne « UE royalty » est conservée comme « Not recorded », avec comme source `unrealengine.com/eula`. Une URL de source pour une information non lue est trompeuse. Correction : lire l'EULA ou supprimer la ligne.
15. `RESOURCES.md:46` et `:42` : les versions et dates ont été retirées du texte et renvoyées vers `snapshot.json`. Le document n'est plus autonome, et `snapshot.json` n'est pas dans le commit. La ligne 31 garde pourtant « 5.8 (2026-06-17) » et « 5.8.4-release » en dur, ce qui reste une double source.
16. `RESOURCES.md:74` : `@170964e7` est une référence courte à 8 caractères sur un dépôt dont le préfixe peut devenir ambigu. Correction : le SHA complet de 40 caractères. Le paragraphe mélange aussi `legendary-gl/legendary` (ligne 69) et `derrod/legendary` : même dépôt ou pas, à indiquer.
17. Message de commit : un seul sujet de plus de 250 caractères, sans corps. Il mélange sync, CI, revue Gemini et licence. Il faut le scinder en plusieurs commits.
18. `fork-sync.sh` : aucun test automatisé, ni `shellcheck`, ni mode `--dry-run`. L'en-tête annonce « Usage » sans option d'aide.

Points qui justifient la note : le commit retire les affirmations non sourcées, et la sortie a un code d'échec correct quand `fail > 0`.
