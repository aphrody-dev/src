---
name: ui-system
description: Règles UI uniques du monorepo C:\src. Utiliser AVANT toute création ou modification d'une interface (site, app web, dashboard, desktop, TUI, composant, icône, couleur, police, maquette Figma ou Stitch). Impose @aphrody/design (tokens Material 3 générés par Material Color Utilities depuis assets/brand/brand.toml), Material Web, Material Symbols, GPUI ou Microsoft WebUI pour le desktop, et route vers les MCP Figma et Stitch.
---

# ui-system

Source de vérité : `packages/design` (tokens, DESIGN.md, composants), `docs/ui/STACK.md` (cibles et sources), `docs/ui/INVENTORY.md` (surfaces et plan de migration). Organisation : `docs/ALPHABET.md`.

## Cibles autorisées (décision du propriétaire, 2026-11-13)

| Surface                                           | Cible                                                                                                                                                 | Interdit                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Web (sites, dashboards, aphrody.com, aphrody.app) | Material Web `@material/web` + `packages/design/tokens/tokens.css` + Material Symbols Rounded ; HTML servi par bun (`Bun.serve`) ou Microsoft WebUI   | React/shadcn/Tailwind/Base UI, CSS de couleurs maison, autre bibliothèque d'icônes |
| Desktop natif                                     | GPUI (crate `gpui`, Apache-2.0) ou Microsoft WebUI desktop (WebView2 sur Windows) ; nt garde sa direction (WebUI, WinUI 3, Fluent, GPU) via son agent | egui, iced, slint, Tauri, Electron                                                 |
| TUI                                               | ratatui/crossterm ou bun, couleurs de `tokens/tokens.rs` ou `tokens/ansi.json` (SGR 24 bits)                                                          | codes ANSI 16 couleurs codés en dur                                                |
| Outils natifs Zig                                 | Native SDK de vercel-labs (`vercel-labs/native`) seulement si le cœur est déjà en Zig ; tokens `tokens/tokens.zig`                                    | CLI `@native-sdk/cli` via Node (bun uniquement)                                    |

## Règles

1. Aucune valeur de couleur, rayon, durée ou police recopiée : consommer `tokens.css` (`var(--md-sys-color-primary)`), `tokens.json`, `tokens.rs` (`include!`), `tokens.zig` ou `ansi.json`.
2. Changement de couleur de marque : éditer `assets/brand/brand.toml` (propriété de l'agent marque), puis `bun run --cwd packages/design build` ; `bun test --cwd packages/design` vérifie la dérive et le contraste AA.
3. Composants web : `import "@aphrody/design/components"` puis `<md-filled-button>`, `<md-outlined-text-field>`, etc. Une seule bibliothèque. Icônes : `@aphrody/design/symbols.css`, `<md-icon>nom</md-icon>`.
4. Typographie : Google Sans Flex (brand.toml), échelle M3 `--md-sys-typescale-*`. Formes `--md-sys-shape-corner-*`. Mouvement `--md-sys-motion-*`.
5. bun uniquement pour JS/TS (aucun node, npm, vite, tsc). Rust avec windows-rs. Aucune compilation sur le PC : CI ou fr1 en `nice -n 19`.
6. Commits : `git pull --rebase` puis `git commit -- <chemins>` sur main, sans attribution IA ni emoji.
7. Vérifier en direct toute version citée (`gh api`, registre npm, crates.io, context7, Microsoft Learn MCP) et la noter avec sa date dans `docs/ui/STACK.md`.

## Figma (MCP `mcp__figma__*`)

- Charger les skills du plugin Figma avant tout appel : `figma-use` (obligatoire avant `use_figma`), `figma-generate-library` (variables, composants), `figma-generate-design` (écrans), `figma-design-to-code` (avant `get_design_context`), `figma-code-connect`.
- Fichier de référence : `packages/design/tokens/figma.json` (équipe Aphrody, plan Professional, 4 modes par collection). Toujours `create_session` avec ce fileKey.
- Synchroniser les variables : `bun run --cwd packages/design figma` produit `tokens/figma-sync.js`, à passer tel quel à `use_figma` (idempotent, `skillNames: "figma-use,figma-generate-library"`).
- Modèle visuel : Material 3 Design Kit officiel (https://www.figma.com/community/file/1035203688168086460/material-3-design-kit), noms de variables `Schemes/<Role>` alignés.

## Stitch (MCP du relais)

- Serveur `stitch` intégré au relais (`packages/ai-os/src/relay/mcp-hub.ts`, https://stitch.googleapis.com/mcp, jeton gcloud). Outils exposés sous `mcp__relay__stitch__*` quand le relais est connecté.
- Donner à Stitch `packages/design/DESIGN.md` (format google-labs-code/design.md, version alpha) comme système ; toute maquette Stitch est ensuite reconstruite en Material Web, jamais collée.
- Lint : `ay design lint` (linter absorbé dans `packages/google-design/src/design-md`, lit `packages/design/DESIGN.md` par défaut) ou `bun run --cwd packages/design lint` ; 0 erreur exigée.

## Direction et critique (d'après anthropics/skills frontend-design, Apache-2.0, 41bbe19d1a1a)

Les tokens M3 fixent couleur, forme et mouvement ; la singularité se joue dans le sujet, la composition, l'échelle typographique et un seul moment marquant.

1. Partir du sujet réel (produit, public, tâche principale) et de son vrai contenu ; jamais de lorem ni de chiffres inventés.
2. Plan en deux passes avant le code : rôles M3 retenus (variante de schéma, conteneurs), échelle `--md-sys-typescale-*` utilisée, maquette ASCII de la mise en page et de l'alignement, deux ou trois principes propres à la surface. Relire le plan : toute partie qui serait la même pour n'importe quel produit voisin est refaite.
3. Une seule audace par écran ; le reste calme et discipliné. Retirer un ornement avant de livrer.
4. Défauts génériques à refuser sauf demande explicite : grille de cartes identiques à ombre grise, sur-titre en capitales espacées au-dessus de chaque titre, un mot du titre mis en couleur ou en italique, marqueurs 01/02/03 sur un contenu qui n'est pas une suite, fondu-glissé sur chaque section, flèche « → » ajoutée aux liens, dégradés décoratifs, chaînes « A · B · C ».
5. Mouvement non déclenché par l'utilisateur : un seul, orchestré ; le mouvement qui répond à une action montre ce qui a changé.
6. Mesure < 80 caractères ; une ou deux familles au plus (Google Sans Flex, plus Google Sans Code pour le code).
7. Texte : point de vue de l'utilisateur, voix active, un bouton dit ce qu'il fait et garde son nom dans tout le flux (« Publier » puis « Publié »), erreurs qui disent quoi faire sans s'excuser. Skill `humanizer` avant livraison.
8. Critique en construisant : captures (MCP chrome-devtools) à chaque étape, responsive jusqu'au mobile, focus clavier visible, mouvement réduit respecté.

Règles UX détaillées, types de produit, structures de page et graphiques : skill `ui-ux-pro-max` (`bun .agents/skills/ui-ux-pro-max/scripts/search.ts`). 3D : skill `threejs-webgpu`.

## Actifs (licences vérifiées, forks aphrody-labs, `third_party/forks.txt`)

| Besoin             | Source                                                  | Licence                 | Usage                                                                             |
| ------------------ | ------------------------------------------------------- | ----------------------- | --------------------------------------------------------------------------------- |
| Schéma de couleurs | `material-color-utilities`                              | Apache-2.0              | déjà dans `packages/design` (npm `@material/material-color-utilities`)            |
| Icônes             | `material-design-icons` (Material Symbols)              | Apache-2.0              | seule bibliothèque d'icônes livrée                                                |
| Icônes, référence  | `lucide`                                                | ISC                     | lecture seule (dessin de pictogrammes absents de Material Symbols), jamais livrée |
| Police de marque   | Google Sans Flex (`brand.toml`)                         | voir `docs/ui/STACK.md` | interface                                                                         |
| Polices OFL        | `roboto-flex`, `googlesans-code`, `geist-font`, `inter` | OFL-1.1                 | repli variable, code, docs ; woff2 sous-ensemblés sur fr1, `OFL.txt` joint        |
| SVG : rendu        | `resvg` / `usvg`                                        | Apache-2.0 OR MIT       | rastérisation (favicons, PNG d'aperçu, tests de rendu)                            |
| SVG : optimisation | `oxvg`                                                  | MIT                     | optimiseur Rust compatible SVGO, avant tout SVG commité                           |
| 3D                 | `three.js`, `wgpu`                                      | MIT, Apache-2.0 OR MIT  | skill `threejs-webgpu`                                                            |

Aucun asset sous licence restrictive (polices commerciales, icônes payantes, CC-BY-NC, CC-BY-SA) dans le dépôt ; `resvg` et `oxvg` se compilent sur fr1, jamais sur le PC.

## Revue

Tout livrable UI passe la revue Gemini (relais `gemini_review` ou gemini.google.com via claude-in-chrome), verdict archivé dans `docs/reviews/`.
