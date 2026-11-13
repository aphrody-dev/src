# Revue Gemini f8cd391dcea6

- Commit : docs/games : ArtCraft pile egui/winit/wgpu, Omni API, forks de pins
- Moteur : antigravity (28685 ms)

**Note : 11/20**

Je n'ai pas ouvert le Cargo.toml d'artcraft ni les dépôts amont. Les défauts 1 à 3 sont recoupés avec le commit, `forks.txt` et le justfile locaux. Les défauts 4 à 6 se vérifient dans l'amont.

## Défauts

1. **`third_party/forks.txt:376` — incohérence avec la doc.**
   - Seul `storytold/egui` est inscrit. `storytold/winit` et `storytold/wgpu` sont exclus au motif que `fork-sync` déduit le nom cible du basename.
   - Le même problème touche `egui` : le fork cible est `aphrody-labs/egui`, et `egui` n'a pas de doublon connu. Pour `winit` et `wgpu`, la cause du refus est donc un défaut de l'outil, pas du dépôt.
   - Correction : supporter un nom cible explicite dans `fork-sync` (par exemple `storytold/winit aphrody-labs/storytold-winit`) et inscrire les trois forks. Sinon, ajouter à `ARTCRAFT.md` une ligne qui dit que ces deux pins ne sont pas synchronisés automatiquement. Le texte actuel laisse deux révisions sans mécanisme de synchronisation.

2. **`docs/games/ARTCRAFT.md`, section Update, ligne « Forks kept » — pins tronqués.**
   - Les révisions sont écrites `6d518fc7...` et `a517b384...`. Un pin tronqué n'est pas vérifiable.
   - Correction : donner les SHA complets de 40 caractères ou, à défaut, 12 caractères sans points de suspension. Ajouter le chemin du Cargo.toml source et le commit d'artcraft lu.

3. **Même section, ligne « Forks kept » — forks non vérifiables.**
   - Le texte affirme que `storytold-winit` et `storytold-wgpu` existent dans `aphrody-labs` et que les pins restent atteignables. Aucune commande de vérification n'est citée, par exemple `gh api repos/aphrody-labs/storytold-winit/commits/<sha>`.
   - Correction : ajouter la commande et son résultat, ou retirer « kept ».

4. **Même section, ligne « UI/GPU stack » — versions sans source.**
   - Les versions egui 0.37, image 0.25, cpal 0.18 et kurbo 0.13 sont citées sans lien ni ligne de Cargo.toml.
   - egui est pinné sur un rev git. La version 0.37 est donc celle déclarée, pas celle compilée, et peut diverger du rev.
   - Correction : citer le fichier et la ligne de chaque Cargo.toml, et préciser « déclarée ».

5. **Même section, ligne « Omni API » — informations d'authentification sensibles et non vérifiées.**
   - Le texte donne l'URL de production, le préfixe de clé et le fait que l'accès soit réservé par le staff, d'après `_docs/artcraft_omni_api.md`. La doc de référence est notée « not read » et aucun appel n'a été fait.
   - Correction : marquer ces éléments comme non vérifiés, ou retirer l'exemple de chemin. Ajouter le SHA du fichier source.

6. **Même section, ligne « Not forked, no license » — mélange de statuts.**
   - La ligne regroupe des dépôts sans licence, un dépôt `NOASSERTION` (harfbuzz) et un fork BSD-3 (`winprint.rs`). Ce sont trois statuts juridiques distincts.
   - Correction : une ligne par statut. Pour harfbuzz, citer la licence réelle (MIT) ou la mention du dépôt.

7. **Ligne « Consequence » — conclusion mal étayée.**
   - « Share only wgpu and winit » ignore le fait que Bevy utilise `bevy_winit` et `bevy_egui`.
   - La décision manquante est une vraie question de conception, mais elle reste en suspens (« not made here »). Il manque un propriétaire et une échéance, par exemple un ticket.
   - Correction : citer la version de wgpu de Bevy et celle du pin storytold pour montrer l'écart de version, puis ouvrir un ticket pour la décision.

8. **Structure du document.**
   - Une section « Update » collée en fin de fichier mélange faits, décisions et conclusions.
   - Les étapes 2 à 4 du plan existant (lignes 28 à 30) n'ont pas été mises à jour : elles disent toujours « no code is moved yet » et ne mentionnent pas les forks créés.
   - Correction : intégrer les faits dans le corps du document et mettre à jour la liste d'étapes.

## Points qui tiennent

- Le justfile : la recette `graph` est bien à la ligne 75, ce qui valide l'affirmation du doc existant.
- Le diff de `forks.txt` est minimal et son format est cohérent avec les lignes voisines.
