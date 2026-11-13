# Revue Gemini e13ccbc6d3b9

- Commit : docs/games : captures des Craft Apps (fr1, Xvfb/llvmpipe), tokens de theme, .bc FFmpeg LGPL (etapes 2 et 7)
- Moteur : antigravity (25097 ms)

**Note : 11/20**

Je n'ai relu aucune source. Le diff est le seul élément dont je dispose. Je n'ai donc pas pu vérifier les chiffres, les hashes ni les valeurs de tokens, et je signale ce qui est incohérent à la lecture du diff.

**Défauts**

1. `docs/games/PLAN.md`, ligne 99 (étape 2), et `docs/games/ARTCRAFT.md`, ligne 34 : une fin de ligne `||` remplace le `|` unique. Cela ajoute une cellule vide, et le tableau se rend de travers. Même défaut ligne 105 (étape 7). Correction : un seul `|` en fin de ligne.
2. `PLAN.md`, ligne 99 : le commit `46d13a83853b71739300cdce1d514f9be7d05a59` est cité sans dire de quel dépôt il vient. La phrase « (… not in git) » est contradictoire : un commit est dans git. Correction : indiquer le dépôt et le rôle de ce commit (FFmpeg ?), ou retirer le hash.
3. `PLAN.md`, ligne 99 : l'étape exigeait le clang partagé de `docs/llvm/UNIFIED-TOOLCHAIN.md`. Le clang 23.1.6 d'Ubuntu a été utilisé à la place, et la case est quand même marquée « Done ». Le critère n'est donc pas rempli. Correction : mettre « Partial » jusqu'à ce que la toolchain partagée soit installée sur fr1.
   - La politique du dépôt dit « never Debian or Ubuntu », et la ligne le contredit sans le dire.
   - `--disable-x86asm` laisse l'IR incomplet : le chemin x86 est absent. La limite est notée en fin de ligne, mais elle devrait aussi apparaître dans le champ « Check ».
4. `ARTCRAFT.md`, ligne 34 : la ligne « Files stay outside git » indique le chemin R2 `r2:aphrody-assets/craft-captures/2026-11-13/` et `rclone lsl`, mais ne donne aucune sortie de vérification. Correction : ajouter la liste des objets et leur taille, ou un checksum du dossier.
5. `ARTCRAFT.md`, ligne 38 : la dernière phrase du tableau est fausse. « Four Craft Apps were built and run » est faux pour soundcraft, qui est compilé avec un correctif local non poussé. Ce binaire n'est pas celui du commit `2bde8b9d`, et ses captures ne sont donc pas reproductibles depuis le dépôt. Correction : publier le patch d'une ligne, par exemple dans `docs/games/patches/`.
6. `ARTCRAFT.md`, ligne 39 : la cause de l'échec de filmcraft, « a sync merged `origin/main` mid-build », est une explication sans trace. Elle indique un processus mal isolé sur fr1. Correction : joindre le log de l'échec ou le retirer.
7. `ARTCRAFT.md`, tableau des captures : les journaux contiennent probablement des chemins ou des identifiants d'hôte. Le diff ne montre aucune relecture de ces journaux avant leur envoi sur R2. Correction : indiquer qu'une relecture a eu lieu.
8. `ARTCRAFT.md`, tableau des tokens : plusieurs cellules sont « n/a » ou « inherited » (`#282828 (inherited)`, accent `#378ef0 (inherited)`). Le texte ne dit pas depuis quel fichier ni quelle ligne chaque valeur est lue. Correction : citer `fichier:ligne` par application, ou au moins la fonction.
9. `ARTCRAFT.md`, ligne 89 : « Font names … were not confirmed in source » est un aveu de données non vérifiées dans un tableau présenté comme « read from source ». Correction : vérifier, ou marquer les cellules concernées « unverified ».
10. `ARTCRAFT.md`, tableau des métriques : la ligne « Gap / tab height » mélange deux grandeurs différentes dans une même cellule (`4 / 32`). La ligne « Heading » du launcher mélange taille et police (« 24.0 display (Archivo) »). Correction : séparer ces valeurs en colonnes ou lignes distinctes.
11. `ARTCRAFT.md`, lignes 57-58 : deux lignes vides consécutives et une ligne vide en trop avant « ## Theme tokens ». Cela casse le lint markdown. Correction : n'en garder qu'une.
12. `ARTCRAFT.md`, ligne 34 : le texte parle de « thin LTO and one codegen unit as set by each repository ». C'est affirmé sans citer le `Cargo.toml` correspondant. Correction : indiquer le fichier et les valeurs.

**Bilan**
- Le contenu est utile, mais plusieurs lignes ne passent pas le critère « reproductible et vérifiable » que la page revendique : tokens non référencés au fichier et à la ligne, patch non publié, hash orphelin.
- Les étapes 2 et 7 sont marquées « Done » alors qu'elles sont partielles : toolchain non conforme, soundcraft patché localement.
- Les deux erreurs de tableau (`||`) sont des défauts de rendu à corriger tout de suite.
