# Revue Gemini f0b5fdd691af

- Commit : docs/games : corrections apres revue gemini (crate reel depot-graph, tri, perimetre, lacunes)
- Moteur : antigravity (22126 ms)

**Note : 13/20**

J'ai vérifié le dépôt (crates, `justfile`, liens). Je n'ai pas relancé `gh api` : les étoiles et les dates ne sont pas contrôlées. Comme `/plan` demande une approbation avant toute modification, je n'ai rien changé.

**Défauts vérifiables** (`docs/games/MEDIA-STACK.md`)

1. **Ligne ~67, contradiction avec le dépôt.** La ligne cite `crates/depot-graph`, qui existe. Mais `ay graph` y est décrit comme « code graph » tree-sitter, alors que le commit annonce un tri et une correction du crate.
   - `crates/depot-treesitter` n'existe pas (`Test-Path` = False). L'ancienne référence était fausse et le corrigé est juste.
   - Le texte « execution not re-run » avoue que l'affirmation n'est pas vérifiée. Soit on exécute `ay graph`, soit on retire la mention.
   - Parenthèse imbriquée dans une parenthèse : réécrire.
2. **Ligne ~69, « recipe `graph` exists in the justfile, line 75 ».** La ligne 75 est exacte, mais la recette est `graph target="crates/depot-core" name=""`. Elle prend donc `target` et `name` en arguments. Il faut préciser la syntaxe, par exemple `just graph third_party/ffmpeg ffmpeg`. Un numéro de ligne dans un document se périme au prochain commit : citer la recette sans la ligne.
3. **Ligne ~69, étape (2) avant étape (1).** `third_party/<name>` n'existe qu'après le fork, et le fork ne couvre plus que FFmpeg. Le placeholder `<name>` est donc inutile. Écrire `third_party/ffmpeg`.
4. **Ligne 3, « Tables are unsorted ».**
   - Ce n'est pas une correction du tri, c'est un abandon du tri. Pour une matrice sourcée, un ordre déterministe (alphabétique, ou par étoiles décroissantes) coûte peu. Les tables ne sont d'ailleurs pas triées par étoiles : OpenUSD 7643 est suivi de draco 7551, puis 1399, 1156 et 644. Elles semblent en fait triées par étoiles, ce qui contredit « unsorted ».
   - Corriger soit la phrase, soit l'ordre.
5. **Ligne ~26, `KhronosGroup/glTF-Sample-Assets`, licence « (empty in the API response) ».** C'est vague.
   - Mettre `NOASSERTION/null` et renvoyer vers le LICENSE du dépôt. Ce dépôt a des licences par asset, donc la licence réelle est mixte.
   - Ne pas laisser croire à une absence de licence.
6. **Lignes ~76-79, section « Not yet covered ».**
   - Elle ne contient aucune donnée ni échéance, et le commit la nomme « lacunes ». Un document de matrice sourcée qui liste des lacunes sans les combler reste incomplet.
   - La phrase « FFmpeg LGPL/GPL » est une affirmation sans source vue (règle de vérité du dépôt). Soit la sourcer, soit la retirer.
7. **Ligne ~76, Unreal exclu.** C'est incohérent avec la ligne 70, qui cite encore Unreal comme référence de qualité. Cette ligne mentionne aussi « Epic and Oodle/MSVC stay private » sans lien vers une source.
8. **Ligne ~68, « no heavy build on the workstation ».** Il manque la justification : la règle du dépôt dit « rien sur le PC ». Citer `AGENTS.md`.
9. **Commit.** Le message est en français sans accents ni périmètre précis. Il annonce « tri » alors que le diff retire le tri.

**Correction de fond :** soit le tri est rétabli, soit les lignes 3 et 67-69 sont remises en cohérence avec lui.
