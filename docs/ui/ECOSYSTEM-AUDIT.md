# Audit de l'écosystème design / UI / UX

Commande du propriétaire, 2026-11-13 : auditer tout l'écosystème design contre la pile unifiée de src, porter ce qui manque au plus natif, sans doublon. Goûts fixés : GPUI, Microsoft WebUI, Native SDK de Vercel (`vercel-labs/native`), vrai Material 3. Ce document complète `docs/ui/STACK.md` (cibles) et `docs/ui/INVENTORY.md` (surfaces) ; il ne les répète pas.

Sources vues en direct le 2026-11-13 : `gh api repos/<r>` + `commits/<branche>` + `releases/latest` (commit = HEAD de la branche par défaut, date du commit), registres npm, crates.io, pub.dev, NuGet, Maven Google, `releases_windows.json` de Flutter, context7 (Angular, shadcn, MUI, gpui-kit), sources amont lues pour les formats (chemins cités). Licence = `license.spdx_id` GitHub, vérifiée dans le dépôt quand GitHub dit `NOASSERTION`.

Verdicts : **adopter** (dépendance ou outil), **tokens seulement** (adaptateur généré par `packages/design/src/adapters.ts`, aucun composant), **fork** (aphrody-labs, `third_party/forks.txt`), **écarter**.

## 1. Skills, plugins et MCP de design

| Brique | Dépôt, commit | Version, licence | Déjà dans src / sur le PC | Verdict |
|---|---|---|---|---|
| Figma MCP + plugin officiel | `figma/mcp-server-guide` `c208a2da6a` (2026-11-12) | serveur distant https://mcp.figma.com/mcp ; skills figma-use, design-to-code, code-connect, generate-library, generate-design, motion, shaders | plugin `figma@claude-plugins-official` actif ; `whoami` OK (équipe Aphrody, pro) ; variables du fichier `2xsZi5wLPAYLGNCLZ2ZJUv` (`packages/design/src/figma.ts`) | **adopter** (inscrit dans `infra/agents/toolchain.toml`) |
| figma-to-code (Stefan Petrovici) | marketplace anthropic-plugin-directory, 1.3.2 | MIT | installé : skill design-to-code + second serveur MCP `figma` | **écarter** : doublon du plugin officiel, désinstallé (`state = "absent"`) |
| Code Connect | `figma/code-connect` `d856baa9bf` (2026-10-26) | v2.1.0, MIT ; npm `@figma/code-connect` 2.1.0 | aucun composant Figma maison à relier (on suit le Material 3 Design Kit) | **écarter** pour l'instant ; à reprendre quand des composants Material Web seront publiés dans le fichier Figma |
| figma-developer-mcp (Framelink) | npm 0.13.2 (2026-06-18) | MIT | — | **écarter** : doublon du MCP officiel |
| Google Stitch | `google-labs-code/stitch-sdk` `f6aa86cde1` (2026-11-05), npm `@google/stitch-sdk` 0.3.5 ; `google-labs-code/stitch-skills` `0337446dad` (2026-08-17) | Apache-2.0 | MCP `stitch` intégré au relais (`mcp__relay__stitch__*`, dont `create_design_system_from_design_md`) ; skill src `google-labs-stitch-jules-design` ; fork `aphrody-labs/stitch-skills` (autre agent) | **adopter** via le relais ; SDK et skills `stitch-build` (React/shadcn) **écartés** |
| DESIGN.md | `google-labs-code/design.md` `1ed38aa9dd` (2026-11-06) | 0.4.0, Apache-2.0 ; npm `@google/design.md` 0.4.0 | `packages/design/DESIGN.md` généré, `designmd lint` | **adopter** (fait) |
| Modern web guidance (web.dev) | `GoogleChrome/modern-web-guidance` `4dd968349e` (2026-11-10) | Apache-2.0 | plugin `modern-web-guidance@googlechrome` (manifeste, autre agent) ; `GoogleChrome/web.dev` est archivé (2023-10-29) | **adopter** (fait) |
| Core Web Vitals | `GoogleChrome/web-vitals` `94b3b4bced` (2026-11-09) | npm 6.2.3, Apache-2.0 | aucun site ne mesure le RUM | **adopter** dans les sites servis par bun (un seul module partagé, à câbler par les agents de site) |
| Lighthouse / LHCI | `GoogleChrome/lighthouse` `4875928438` (v13.6.0, 2026-10-27) ; `GoogleChrome/lighthouse-ci` `99fc5efd77` (v0.16.1, 2026-11-11) | Apache-2.0 | skill `cloudflare:web-perf`, `design-first-pro-max` (porte 100/100) | **adopter** : audits via le MCP chrome-devtools ; LHCI en CI pour aphrody.com/aphrody.app (lot suivant) |
| Chrome DevTools MCP | `ChromeDevTools/chrome-devtools-mcp` `1417f93ee3` (v1.13.0, 2026-11-11) | Apache-2.0 | MCP `chrome-devtools` par `bun x` (manifeste, autre agent) ; le plugin amont lance `npx` | **adopter** (fait, sans le plugin npx) |
| PageSpeed Insights / CrUX | API `pagespeedonline/v5`, CrUX API | Google | appel anonyme du 2026-11-13 : HTTP 429 (quota journalier partagé épuisé) | **adopter** avec une clé GCP du projet aphrody (coffre env-kit), même modèle que `DEVELOPERKNOWLEDGE_API_KEY` |
| web-quality-skills (Addy Osmani) | `addyosmani/web-quality-skills` `afa8da9421` (2026-08-24) | MIT | fork `aphrody-labs/web-quality-skills` (autre agent) | suivi par l'audit outillage (`docs/tooling/AI-TOOLING-AUDIT.md`) |
| three.js | `mrdoob/three.js` `c2345655c5` (r187, 2026-10-30) | npm 0.187.0, MIT | rg-website (sous-module) | **adopter** seulement pour la 3D web ; le natif reste wgpu/WebGPU |
| model-viewer | `google/model-viewer` `b740780649` (v4.4.0, 2026-10-09) | Apache-2.0 | — | **écarter** (aucun besoin de visionneuse glTF ; three.js suffit) |
| WebGPU | `gpuweb/gpuweb` `10be35c70d` (2026-11-10) | spec W3C | wgpu 30.0.1 (gamescope-web), WGSL d'aphrody.app | **adopter** (déjà là) |
| Réplique d'UI / screenshot-to-code | `abi/screenshot-to-code` `a8139779f7` (2026-10-09) | MIT, Python + React | skills src `replica-*` ; Figma `generate_figma_design` ; Stitch | **écarter** (doublon) |
| Vercel agent-skills | `vercel-labs/agent-skills` `1a2c79d4e6` (2026-10-27) | MIT (README) | — | **adopter** `web-design-guidelines` seule (règles lues en direct) ; react-*, composition-patterns : **écarter** (React hors pile) |
| Anthropic skills | `anthropics/skills` `2c5958ecac` (2026-11-06) | — | `document-skills` (manifeste) ; `frontend-design` installé mais désactivé | `frontend-design`, `theme-factory`, `canvas-design` : **écarter** (DESIGN.md + ui-system font foi) |
| Microsoft skills | `microsoft/skills` `2d08976b5f` (2026-11-12) | MIT, 211 skills | skill `microsoft` + MCP Microsoft Learn | **écarter** : aucune skill Fluent/WinUI (frontend-ui-dark-ts et frontend-design-review sont React/Azure) |
| MUI skills | `mui/material-ui` `skills/material-ui-theming` | MIT | — | **écarter** (MUI = tokens seulement) |
| gpui-kit skills | `longbridge/gpui-kit` `6f7f4d9698` | Apache-2.0 | — | **adopter** : `gpui-kit`, `gpui-kit-design-guides` (manifeste) |
| WebUI skill | `microsoft/webui` `30ca60aa4b`, `ai/SKILL.md` (`.claude-plugin/plugin.json` sans marketplace) | MIT | — | **adopter** : `webui-reference` (manifeste) |
| Native SDK skill | `vercel-labs/native` `4d47c2cfcd`, `skills/native-sdk` | Apache-2.0 | — | **écarter** : stub qui charge le contenu via `npx @native-sdk/cli` (Node 24 exigé, règle bun) |

## 2. Piles natives

| Brique | Dépôt, commit | Version, licence | Recouvrement | Verdict |
|---|---|---|---|---|
| GPUI (Zed) | `zed-industries/zed` `27bbbc1cc4` (Zed v1.28.1, 2026-11-11) | crate `gpui` 0.2.2, Apache-2.0 ; dépend de `taffy` et `accesskit` (`crates/gpui/Cargo.toml`) | `tokens.rs` | **adopter** (fait : `tokens.rs`) |
| gpui-kit (ex-gpui-component, renommé) | `longbridge/gpui-kit` `6f7f4d9698` (v0.9.1, 2026-11-09) | crates `gpui-kit` et `gpui-component` 0.9.1, Apache-2.0 (+ CC BY 4.0 docs) | thèmes JSON (`.theme-schema.json`) au modèle shadcn | **adopter** : `tokens/adapters/gpui-kit.json` (6 thèmes, clés validées contre le schéma) ; fork `aphrody-labs/gpui-kit` existant, inscrit |
| gpui-ce | `gpui-ce/gpui-ce` `41721fbcf0` (2026-11-13) | 0.3.0, Apache-2.0 | fork communautaire de GPUI | **écarter** (doublon ; on épingle Zed) |
| Microsoft WebUI | `microsoft/webui` `30ca60aa4b` (v3.1.1, 2026-11-10) | npm `@microsoft/webui` 3.1.1, crate `microsoft-webui-cli` 3.1.1, NuGet `Microsoft.WebUI` 0.0.26, MIT | `crates/webui-tokens` lit `{ themes: { <nom>: { <token>: valeur } } }` (`src/lib.rs`) | **adopter** : `tokens/adapters/webui-tokens.json` (6 modes) ; fork `aphrody-labs/webui` existant, inscrit |
| Native SDK (Vercel, Zig) | `vercel-labs/native` `4d47c2cfcd` (v0.11.1, 2026-11-09) | Apache-2.0, expérimental ; CLI npm 0.11.1 | `tokens.zig` | **adopter** cœur Zig seulement (fait : `tokens.zig`) ; fork existant |
| vello | `linebender/vello` `b7e8f523b4` (v0.12.0, 2026-11-11) | Apache-2.0 OR MIT | moteur 2D GPU, recouvre le renderer de GPUI | **écarter** hors Shenron Studio (déjà en vello 0.11) |
| taffy | `DioxusLabs/taffy` `a3997d55ba` (v0.15.1) | MIT | utilisé par GPUI | via GPUI seulement |
| parley | `linebender/parley` `32a137efbb` (v0.13.0, 2026-11-12) | Apache-2.0 OR MIT | GPUI a son propre système de texte (DirectWrite sous Windows) | **écarter** |
| AccessKit | `AccessKit/accesskit` `dea4384134` | crate 0.25.2, MIT OR Apache-2.0 | utilisé par GPUI | via GPUI seulement |
| material-colors (Rust) | crates.io 0.5.0 | MIT OR Apache-2.0 | port Rust de MCU | **écarter** : la génération reste en bun sur MCU officiel, Rust consomme `tokens.rs` |
| WinUI 3 / WinAppSDK | `microsoft/WindowsAppSDK` `ec2fd44f61` (v2.6.5, 2026-11-03) ; `microsoft/microsoft-ui-xaml` `3beb2e0b09` | NuGet `Microsoft.WindowsAppSDK` 2.6.5 (2.6.6-experimental), MIT | explorer de nt (WinAppSDK 2.6.5) | **tokens seulement** pour nt : `tokens/adapters/winui.xaml` (SystemAccentColor* + `Md*Color`/`Md*Brush`, Light/Dark/HighContrast) |
| Fluent 2 | `microsoft/fluentui` `f9720c35ba` (2026-11-12) | `@fluentui/react-components` 9.75.2, `@fluentui/web-components` 3.2.1, `@fluentui/tokens` 1.0.0-alpha.24, MIT | `BrandVariants` 10..160 (`packages/tokens/src/types.ts`) | **tokens seulement** : `tokens/adapters/fluent.json` (rampe de marque + rôles exacts) ; composants Fluent **écartés** hors nt |
| fluentui-system-icons | `microsoft/fluentui-system-icons` `4bf6b786b1` | `@fluentui/svg-icons` 1.1.345, MIT | doublon de Material Symbols | **écarter** (nt garde Segoe Fluent Icons du système) |
| FAST | `microsoft/fast` `34f3a99e2a` (2026-11-12) | `@microsoft/fast-element` 3.1.4 | socle des Web Components Fluent | **écarter** (Material Web + WebUI) |
| vscode-webview-ui-toolkit, fluentui-token-pipeline | archivés (2024-09-24, 2023-11-16) | — | — | **écarter** |

## 3. Primitives web et Material

| Brique | Dépôt, commit | Version, licence | Recouvrement | Verdict |
|---|---|---|---|---|
| Material Web | `material-components/material-web` `37aa14b843` (v2.5.0, 2026-07-15) | Apache-2.0, en maintenance | composants `md-*` | **adopter** (fait) + **fork** `aphrody-labs/material-web` (maintenance amont : correctifs chez nous) |
| Material Color Utilities | `material-foundation/material-color-utilities` `194144d75e` (2026-11-06) | npm 0.4.0, Apache-2.0 ; pub `material_color_utilities` 0.13.1 | cœur du générateur | **adopter** (fait) |
| Material Symbols | `google/material-design-icons` `10ecc14790` ; npm via `marella/material-symbols` `027f61078d` (v0.49.0, 2026-11-12) | Apache-2.0 | icône unique | **adopter** (fait) |
| Google Sans Flex | `google/fonts` `3e5667764c`, `ofl/googlesansflex` (`GoogleSansFlex[ROND,opsz,slnt,wdth,wght].ttf`, `TRADEMARKS.md`) | OFL 1.1 | police de marque | **adopter** (fait, `assets/brand/fetch.ts`) |
| Material Theme Builder | `material-foundation/material-theme-builder` | archivé | remplacé par notre générateur | **écarter** |
| Jetpack Compose Material 3 | `androidx/androidx` `a7f74a234d` (2026-11-13) | `androidx.compose.material3:material3` 1.4.0 stable, 1.5.0-rc01 ; Apache-2.0 | 48 paramètres de `lightColorScheme` (sources jar 1.4.0) | **tokens seulement** : `tokens/adapters/Theme.kt` (6 ColorScheme, Shapes, Typography) |
| Flutter Material 3 | `flutter/flutter` `627ac6e834` ; stable 3.50.0 (2026-11-11, `ab2912035e`) | BSD-3-Clause ; pub `dynamic_color` 2.1.0 | `ColorScheme` (`lib/src/material/color_scheme.dart`) | **tokens seulement** : `tokens/adapters/aphrody_theme.dart` (sans `background`/`surfaceVariant` dépréciés) |
| Angular Material / CDK | `angular/components` `32cf96285e` (v22.2.7, 2026-11-11) | MIT | schematic `theme-color` (tons 0..100, `HUE_TONES`, neutres 4..96), `mat.theme(..., $overrides)` | **tokens seulement** : `tokens/adapters/_angular-theme.scss` (palettes + overrides vers `--md-sys-color-*`) |
| MUI (Material UI) | `mui/material-ui` `eae02e6d00` (v9.5.0, 2026-10-09) | MIT | Material 2 restylé, React | **tokens seulement** : `tokens/adapters/mui.json` (`colorSchemes`, `shape`, `typography`) |
| Tailwind CSS v4 | `tailwindlabs/tailwindcss` `b08bf83a32` (v4.3.5, 2026-11-06) | MIT | auto, rg-website, shenron | **tokens seulement (transition)** : `tokens/adapters/tailwind.css` (`@theme inline` sur `tokens.css`, compilé par tailwindcss 4.3.5) |
| shadcn/ui | `shadcn-ui/ui` `dd41d19e2f` (shadcn 4.23.0, 2026-10-27) | MIT | 4 registres `components.json` | **tokens seulement (transition)** : `tokens/adapters/shadcn.css` (32 variables de `globals.css` vers les rôles M3) |
| Base UI | `mui/base-ui` `fb9fbbf35e` (v1.9.0) | MIT | Kumo, auto | **écarter** |
| Radix | `radix-ui/primitives` `eb3a2b7091` (2026-10-14) ; npm `radix-ui` 1.8.1 | MIT | sous shadcn | **écarter** |

Tailwind et shadcn restent interdits dans les apps neuves (`.agents/skills/ui-system`) : leurs adaptateurs ne servent qu'aux sous-modules rosegriffon et shenron pendant la migration vers Material Web, pour qu'ils affichent dès maintenant les rôles M3 de la marque sans recopier une couleur.

## 4. Adaptateurs livrés (`packages/design`)

Chaîne unique : `assets/brand/brand.toml` -> `src/build.ts` (MCU) -> `tokens/tokens.json` -> `src/adapters.ts` -> `tokens/adapters/*`. Table de variantes MCU partagée : `src/schemes.ts`. Tests : `tests/adapters.test.ts` (dérive, valeurs exactes par mode, rampe Fluent monotone, contraste des états gpui-kit, équilibre XAML).

| Cible | Fichier | Validation |
|---|---|---|
| Tailwind v4 | `tailwind.css` | compilé par `@tailwindcss/cli` 4.3.5 (bun) : `bg-primary`, `text-body-large`, `ease-emphasized` produits |
| shadcn/ui | `shadcn.css` | jeu de variables de la doc shadcn (context7) |
| MUI v9 | `mui.json` | API `createTheme({ colorSchemes })` (context7, docs MUI) |
| Angular Material | `_angular-theme.scss` | compilé par `sass` 1.x (bun) ; format du schematic `theme-color` |
| Compose | `Theme.kt` | 48/48 paramètres de `lightColorScheme` de material3 1.4.0 (sources jar Maven) |
| Flutter | `aphrody_theme.dart` | 47 paramètres du constructeur `ColorScheme` (sans les 3 dépréciés) |
| Fluent 2 | `fluent.json` | noms vérifiés dans `packages/tokens/etc/tokens.api.md` |
| WinUI 3 | `winui.xaml` | XML bien formé (python3 sur fr1), 169 couleurs |
| gpui-kit | `gpui-kit.json` | toutes les clés présentes dans `.theme-schema.json` |
| Microsoft WebUI | `webui-tokens.json` | format multi-thème de `crates/webui-tokens/src/lib.rs` |
| GPUI nu, Zig, TUI, Figma, DESIGN.md | `tokens.rs`, `tokens.zig`, `ansi.*`, `figma-variables.json`, `DESIGN.md` | déjà livrés (3bbfac8f) |

Non compilés localement (règle : rien sur le PC, fr1 n'a ni kotlinc ni dart) : `Theme.kt` et `aphrody_theme.dart`, à compiler en CI au premier consommateur Android/Flutter.

## 5. Installations (manifeste `infra/agents/toolchain.toml`, applier `packages/machine/src/toolchain.ts`)

- `figma@claude-plugins-official` : inscrit (déjà actif, `whoami` vérifié).
- `figma-to-code-design-to-react-vue-and-html` : désinstallé (doublon).
- Skills épinglées par commit dans `~/.claude/skills` (témoin `.source`) : `gpui-kit`, `gpui-kit-design-guides`, `webui-reference`, `web-design-guidelines` ; chargées par Claude Code à l'application ; source des règles Vercel joignable (HTTP 200).
- `bun packages/machine/src/apply-user.ts --check` contrôle tout le manifeste (marketplaces, plugins, MCP, skills, secrets).

## 6. Reste à faire (hors périmètre de cet agent)

1. Agents de site : `web-vitals` + LHCI en CI pour aphrody.com et aphrody.app ; clé PageSpeed/CrUX au coffre.
2. Agent ui-system : `build.ts` et `runtime.ts` importent `src/schemes.ts` (table de variantes encore déclarée trois fois) ; `bun run build` enchaîne `src/adapters.ts` ; export `./adapters/*` dans `package.json`.
3. Sous-modules rosegriffon et shenron : importer `tokens.css` + `shadcn.css` en lieu de leurs palettes, puis migrer vers Material Web.
4. Agent nt : fusionner `winui.xaml` dans l'explorer si la marque doit teinter l'accent WinUI.
