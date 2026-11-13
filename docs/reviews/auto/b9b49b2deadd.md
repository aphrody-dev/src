# Revue Gemini b9b49b2deadd

- Commit : docs/games : etape 1 du plan faite (graphes tree-sitter de FFmpeg, artcraft et storyteller-bevy)
- Moteur : antigravity (28546 ms)

**Note : 13/20**

Les chiffres sont exacts. Les 9 `GRAPH_REPORT.md` locaux donnent les mêmes nodes, edges et communities que le commit. `justfile:75-76` et `.gitignore:20` correspondent à ce que le plan cite.

Défauts vérifiables, dans `docs/games/PLAN.md`, ligne 48 (étape 1) :

1. **Preuve non reproductible.** Le critère de l'étape est « `GRAPH_REPORT.md` avec compteurs », mais `graphify-out/` est ignoré par git. Aucune trace dans le dépôt ne permet de vérifier « Done ».
   - Correction : committer un `docs/games/graphs.md` avec les compteurs et le hash de checkout de chaque sous-module, ou un `just graph-verify`.
2. **Version non épinglée.** Aucun commit de `third_party/ffmpeg`, `artcraft` ou `storyteller-bevy` n'est indiqué. Les compteurs dépendent donc du checkout.
   - Correction : ajouter le SHA de chaque cible, plus la version de `ay`.
3. **Colonne « Check » incohérente avec « State ».** « Check » ne mentionne que les nombres de nodes et d'edges. Elle ne dit pas que `libavutil` a été relancé (le statut précédent affichait « Started »), ni que `libavcodec` et les autres bibliothèques sont désormais incluses.
   - Correction : lister explicitement les 7 bibliothèques FFmpeg dans la colonne « Check », ou renvoyer à une table dédiée.
4. **Formulation imprécise.** « Each run took 6 s or less » ne vient d'aucune mesure archivée.
   - Correction : reporter les durées par cible, ou supprimer la phrase.
5. **Incohérence de périmètre.** La recette `just graph` sert d'outil, mais le texte d'« Done » parle seulement de `ay graph build`. Le chemin des cibles (`third_party/ffmpeg/libX`, `third_party/artcraft/crates`) n'est plus écrit.
   - Correction : lister les commandes exactes passées à `just graph`, avec leurs paramètres `name`.
6. **Dossier hors périmètre.** `graphify-out/bun` (420 374 nodes) est présent mais absent du plan.
   - Correction : le mentionner, ou le supprimer.
7. **Ligne 16 non mise à jour.** Elle cite « `justfile` lines 74 to 76 », alors que la recette `graph` commence à la ligne 75 et que `justfile:76` contient la commande. Si le fichier a bougé, la référence est périmée.
   - Correction : référencer la recette par son nom, `just graph`, au lieu de numéros de ligne.
8. **Critère de qualité absent.** Un nombre de nodes ne prouve pas que le graphe est correct. `libswresample` n'a que 404 nodes, et aucune vérification de couverture n'est indiquée (fichiers parsés contre fichiers sources, erreurs de parse).
   - Correction : ajouter une colonne ou une ligne « fichiers parsés / total ».

Le commit ne modifie qu'une ligne de documentation. Je n'ai fait aucune modification dans le dépôt.
