# Revue Gemini : absorption des skills UI/UX et MCP partagés (2026-11-13)

Outil : `mcp__relay__gemini_review` (moteur antigravity, 29,8 s). Objet : commits `173f75dc` (forks), `d7714399` (MCP relay et figma pour Codex et agy), `cd658a10` (skills ui-ux-pro-max, humanizer, threejs-webgpu, ui-system ; retrait de design-first-pro-max).

## Verdict

11/20, sur le diff seul (fichiers du dépôt non lus par le relecteur).

## Défauts retenus et corrigés

| # | Défaut | Correction |
|---|---|---|
| 1, 2 | `sharedMcp` ignore sans message un nom non résolu (hors hôte, en-têtes, secrets) | ligne `info ... pas d'entrée [[claude.mcp]] HTTP sans secret` pour Codex et agy |
| 3, 4, 5 | agy : URL comparée par sous-chaîne, état cherché par regex dans toute la ligne | colonnes NAME TYPE STATUS URL comparées exactement |
| 12 | tokens de 2 caractères (ui, ux, 3d) supprimés par la recherche | seuil abaissé à 2 caractères |
| 14 | scores BM25 non comparables entre domaines dans `--brief` | précisé dans la skill : juxtaposition, pas de classement |
| 18 | LCP 1,2 s et INP 50 ms présentés sans source | marqués objectifs internes, seuils Core Web Vitals cités à côté |
| 19 | versions three.js et wgpu sans source | source `gh api .../releases/latest` et dates de publication en métadonnées |
| 20 | `bun x @gltf-transform/cli` non épinglé | épinglé `@4.5.1` (registre npm du 2026-11-13), skill et références |
| 23 | commandes `gds audit-slop` non vérifiées | exécutée sur la skill humanizer : fonctionne (signale le lexique cité, attendu) |

## Défauts écartés

- 6 : `agy mcp add` met à jour une entrée existante (aide de la CLI : « Add or update ») ; pas de `remove` nécessaire.
- 7 : Codex ne recrée l'entrée que si l'URL ou l'état diffère (test `ok` avant `remove`).
- 8 : figma sur Codex reste « connexion OAuth à valider » tant que le propriétaire n'a pas cliqué (`codex mcp login figma`) ; seule exception d'interaction admise.
- 15 : le parseur CSV gère `\r\n`, BOM, guillemets doublés et champs multilignes.
- 16 : `--ofl` exclut toute famille absente de `google-font-licenses.json` ; révision google/fonts `038b637d` notée dans la skill.
- 21, 22 : état des forks et attribution Apache-2.0 de frontend-design déjà explicites (`ui-system`, titre de section avec commit `41bbe19d1a1a`).
- 11, 17 : tests automatisés non ajoutés dans ce lot.
