# Revue Gemini : packages/design, docs/ui/STACK.md, docs/ui/INVENTORY.md, skill ui-system (2026-11-13)

Moteur : relais `gemini_review` (antigravity), 35 s. Note : **12/20**. Gemini n'a vu que des extraits (code résumé dans la requête).

| #   | Remarque                                                 | Suite                                                                                                                                      |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `new Scheme(...)` serait l'ancienne classe sans variante | réfuté : `Scheme = SCHEMES[brand.variant]` (SchemeVibrant), l'extrait l'abrégeait                                                          |
| 2   | `allColors` instable                                     | déjà couvert : version épinglée 0.4.0, test des 49 rôles x 6 modes                                                                         |
| 3   | palettes ambiguës                                        | les palettes ne dépendent pas du mode (même seed) ; inchangé                                                                               |
| 4   | regex SCSS fragiles                                      | corrigé : le build échoue si les comptes (15 x 5 typo, 7 coins, 16 durées, 6 élévations, 4 états) changent ; `@material/web` épinglé 2.5.0 |
| 5   | styles « prominent » exclus                              | assumé (M3 Expressive hors Material Web 2.5.0)                                                                                             |
| 6   | règles de contraste CSS                                  | inchangé ; `[data-theme]` explicite prime, l'automatique couvre clair et sombre                                                            |
| 7   | Figma : renommage du premier mode, variables obsolètes   | corrigé : renommage seulement à la création, liste `stale` retournée                                                                       |
| 8   | pas de test de dérive Figma                              | partiel : `stale` + `figma.json` ; lecture complète des variables via MCP à la prochaine synchro                                           |
| 9   | 50 warnings `orphaned-tokens`                            | assumé : la règle exige 0 erreur ; les rôles M3 non référencés par un composant restent exposés                                            |
| 10  | contrastes trop partiels                                 | corrigé : toutes les paires `on-X`/`X`, 7:1 en contraste élevé, inverse, outline 3:1 (106 assertions vertes)                               |
| 11  | `tokens.rs`/`tokens.zig` jamais compilés                 | noté dans STACK §7 ; CI au premier consommateur                                                                                            |
| 12  | golden complet contre le moteur Rust                     | différé : le moteur Rust de la marque doit lire `tokens.json` (INVENTORY §3 étape 4)                                                       |
| 13  | Material Web en maintenance                              | déjà dans STACK §4 (risque et repli WebUI)                                                                                                 |
| 14  | commit Zed et sources                                    | déjà dans STACK §1 (HEAD `27bbbc1cc4`, crates.io, release 1.28.1)                                                                          |
| 15  | Native SDK sans procédure bun                            | corrigé : ligne Zig marquée conditionnelle                                                                                                 |
| 16  | nt contredit « système unique »                          | corrigé : exception assumée dans la matrice                                                                                                |
| 17  | `Cargo.lock` élagué à la main                            | vérifié : `cargo metadata --locked` vert sur un export `git archive HEAD`                                                                  |
| 18  | `git pull --rebase` inutile                              | réfuté : sessions parallèles sur main, règle d'ALPHABET.md                                                                                 |
| 19  | pas de `prefers-reduced-motion`                          | corrigé : durées à 0 ms                                                                                                                    |
| —   | licence de la police                                     | corrigé : OFL 1.1 citée dans STACK                                                                                                         |
