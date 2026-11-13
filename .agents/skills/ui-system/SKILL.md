---
name: ui-system
description: Règles UI uniques du monorepo C:\src. Utiliser AVANT toute création ou modification d'une interface (site, app web, dashboard, desktop, TUI, composant, icône, couleur, police, maquette Figma ou Stitch). Impose @aphrody/design (tokens Material 3 générés par Material Color Utilities depuis assets/brand/brand.toml), Material Web, Material Symbols, GPUI ou Microsoft WebUI pour le desktop, et route vers les MCP Figma et Stitch.
---

# ui-system

Source de vérité : `packages/design` (tokens, DESIGN.md, composants), `docs/ui/STACK.md` (cibles et sources), `docs/ui/INVENTORY.md` (surfaces et plan de migration). Organisation : `docs/ALPHABET.md`.

## Cibles autorisées (décision du propriétaire, 2026-11-13)

| Surface | Cible | Interdit |
|---|---|---|
| Web (sites, dashboards, aphrody.com, aphrody.app) | Material Web `@material/web` + `packages/design/tokens/tokens.css` + Material Symbols Rounded ; HTML servi par bun (`Bun.serve`) ou Microsoft WebUI | React/shadcn/Tailwind/Base UI, CSS de couleurs maison, autre bibliothèque d'icônes |
| Desktop natif | GPUI (crate `gpui`, Apache-2.0) ou Microsoft WebUI desktop (WebView2 sur Windows) ; nt garde sa direction (WebUI, WinUI 3, Fluent, GPU) via son agent | egui, iced, slint, Tauri, Electron |
| TUI | ratatui/crossterm ou bun, couleurs de `tokens/tokens.rs` ou `tokens/ansi.json` (SGR 24 bits) | codes ANSI 16 couleurs codés en dur |
| Outils natifs Zig | Native SDK de vercel-labs (`vercel-labs/native`) seulement si le cœur est déjà en Zig ; tokens `tokens/tokens.zig` | CLI `@native-sdk/cli` via Node (bun uniquement) |

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
- Lint : `bun x -p @google/design.md designmd lint packages/design/DESIGN.md` (0 erreur exigée).

## Revue

Tout livrable UI passe la revue Gemini (relais `gemini_review` ou gemini.google.com via claude-in-chrome), verdict archivé dans `docs/reviews/`.
