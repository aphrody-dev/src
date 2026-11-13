# Inventaire des UI du monorepo

État au 2026-11-13 (lecture des `package.json`, `Cargo.toml`, configurations Wrangler et sources ; nombres de fichiers hors `node_modules`, `target`, `dist`). Cible de chaque surface : `docs/ui/STACK.md`. Règles pour les agents : `.agents/skills/ui-system`. Toutes les UI listées ici sont rejetées par le propriétaire, sauf celles déjà sur GPUI, Microsoft WebUI, Native SDK (Zig) ou Material 3 officiel : aucune ne l'est encore entièrement.

Légende cible : **W** = Material Web + `packages/design/tokens/tokens.css` + Material Symbols, HTML servi par bun ou WebUI ; **G** = GPUI ; **WD** = WebUI desktop (WebView2) ; **T** = TUI sur `tokens.rs` / `ansi.json` ; **Z** = Native SDK cœur Zig ; **nt** = direction de l'agent nt.

## 1. Surfaces

### Produits Aphrody (priorité 1)

| Surface | Chemin | Type | Pile actuelle | Déploiement | Cible | État |
|---|---|---|---|---|---|---|
| aphrody.com | `apps/aphrody` | site | bun sans dépendance, SSR TS (`src/seo/*`), `style.css`, `m3.css`, `src/design/material-tokens.ts` (`--m3-*`), police Atkinson Hyperlegible Next, `DESIGN.md` propre (#0B7A75), sprites « pets » de google-design | Worker `aphrody` (`wrangler.toml`), aphrody.com | W | à migrer par l'agent aphrody.com : remplacer `m3.css`/`material-tokens.ts` par `@aphrody/design/tokens.css`, police Google Sans Flex, composants `md-*`, retirer les pets |
| aphrody.app (plateforme) | `packages/deploy` (non suivi, en cours) | dashboard + site | Worker bun, HTML rendu serveur (`src/pages.ts`), CSS M3 de `src/m3.ts` qui importe `packages/google-design/src/color-utils/hct.ts` | Worker `aphrody-deploy`, aphrody.app, *.aphrody.app | W | à migrer par l'agent aphrody.app : remplacer `m3.ts` par `tokens.css`, ne plus importer google-design |
| aphrody.app (client WebGPU) | `apps/aphrody-app/web`, `crates/aphrody-wasm` | web app | Rust wasm-bindgen 0.2.129, `shaders/mica.wgsl` | Worker `aphrody-app` | W (chrome HTML) + rendu WebGPU conservé | agent aphrody.app ; couleurs WGSL depuis `tokens.json` |
| aphrody-app TUI | `apps/aphrody-app/crates/aphrody-host/src/tui.rs` | TUI | ANSI écrit à la main (139 lignes) | binaire local | T (`tokens.rs` via `include!`) | planifié |
| yolo | `apps/yolo` | web app | bun SSR (HTMLRewriter), `src/client/{index.html,app.ts,style.css}`, `--bg-page/--fg-*`, `DESIGN.md` propre (#435e91), plugin `packages/bun-plugins/m3-icons-plugin.ts`, assets google-design | yolo.aphrody.com | W | planifié (lot 2) |
| r2-site | `apps/r2-site` | site | bun sur `@aphrody/runtime-adapter`, 6 fichiers | downloads.aphrody.com, cdn.aphrody.com | W | planifié (lot 2) |

### Noyau (outils internes)

| Surface | Chemin | Type | Pile actuelle | Cible | État |
|---|---|---|---|---|---|
| ai-os TUI | `packages/ai-os/src/tui/index.ts` | TUI | `node:readline` + `styleText` | T | **migré** : couleurs = rôles M3 sombres de `@aphrody/design` (`ansi()`), tests `test/tui` verts |
| ai-os relais, page WebMCP | `packages/ai-os/src/relay/{server,webmcp,oauth}.ts` | page web | HTML `Bun.serve` | W | planifié |
| forge dashboard | `packages/forge/src/server.ts` | dashboard | HTML inline `Bun.serve` (681 lignes) | W | planifié (lot 2) |
| env-kit, pages OAuth | `packages/env-kit/src/{github-app,google-auth}.ts` | pages de rappel | HTML `Bun.serve` | W | planifié (fichiers en cours chez un autre agent) |
| google-design studio | `packages/google-design/server.ts`, `dist/*.html` | dashboard de dev | bun, pages canvas/figma/hct/stitch/symbols/tokens/verify | supprimé avec le paquet | remplacé par `packages/design` |
| ay, lore-client, depot-core | `crates/ay`, `crates/lore-client`, `crates/depot-core` | CLI colorée | anstyle 1.0.14, anstream 1.0.0, ANSI brut | T | planifié : palette anstyle depuis `tokens.rs` |
| ring3-agent | `crates/ring3-agent/src/http_server.rs` | page web | HTML écrit à la main | W | planifié |
| page d'état Bun OS | `infra/fleet/fr1-orig/nginx/snippets/aphrody-status.inc` | page d'état | HTML statique (`factory/automation/status.ts`) | W | planifié |
| gamescope-web | `infra/gamescope-web`, `crates/gamescope-web-wasm` | démo WebGPU | wgpu 30.0.1, wasm-bindgen 0.2.130 | W (chrome) | planifié |
| gamescope-cli | `crates/gamescope-cli` | fenêtre desktop | winit 0.31.0-beta.4, wgpu 30.0.1 | G | planifié |
| thème WSL Omarchy | `infra/wsl-distro/theme-tokyo-night` | thème desktop | CSS, RON, Hyprland, TOML, Lua | T (schéma terminal de `ansi.json`) | planifié |
| docs Lore | `tools/lore/mkdocs.yml` | site de docs | MkDocs, thème material (amont Epic) | inchangé (amont) | hors périmètre |

### nt (agent nt, direction WebUI, WinUI 3, Fluent, GPU 4K 120 fps)

| Surface | Chemin | Pile actuelle | Cible |
|---|---|---|---|
| nt web | `apps/nt/modules/web` | bun, `nt.html`, `nt.ts`, `scene.wgsl` | nt |
| explorer | `apps/nt/base/shell/explorer` | WinUI 3 en code, WindowsAppSDK 2.6.5, net11.0-windows, NativeAOT | nt |
| winui-hello | `apps/nt/sdk/rust/winui-hello` | Rust `windows-reactor` (fork windows-rs) | nt |
| serveur hôte | `apps/nt/sdk/tools/host/server.ts` | `Bun.serve`, WS `/kernel` | nt |

L'agent nt reçoit `tokens.rs` et `tokens.css` pour la marque ; la pile reste sa décision.

### Paris et produits séparés (priorité 3)

| Surface | Chemin | Type | Pile actuelle | Cible |
|---|---|---|---|---|
| unixwin.dev | `apps/unixwin/upstream/unixwin.dev` | site | astro ^5.0.0 (copie amont) | W |
| wpm-gui | `apps/unixwin/upstream/wpm-gui` | desktop | Tauri 2, svelte ^5.28, vite ^6.3 | G |
| auto web | `apps/auto/apps/web` | web app | React ^19.3.1, tailwindcss 4.3.3, @aphrody/m3-react/m3-tailwind/m3-tokens 1.4.7, @aphrody/material-web 3.3.3, @base-ui/react ^1.9, @xyflow/react, better-auth, @fontsource (Inter, Plus Jakarta Sans, material-symbols-rounded 5.3.9), sous-apps `public/craft/{word,pdf,grid}` | W |
| auto admin | `apps/auto/apps/admin` | dashboard | React + `@auto/ui` | W |
| auto desktop | `apps/auto/apps/desktop/src-tauri` | desktop | Tauri 2 | WD |
| auto extension | `apps/auto/apps/extension` | extension MV3 | TS + HTML/CSS | W |
| auto console | `apps/auto/box/console` | console wasm | Rust wasm-bindgen | W |
| r2b / rea | `apps/r2b/src/rea` | CLI interactive | @clack/prompts 1.7.0, @xterm/headless 6.0.0 | T |
| RoseGriffon site | `apps/rosegriffon/apps/rg-website` (sous-module) | web app | next 16.5.0-canary.5, react ^19.3, tailwind ^4.3.3, shadcn ^4.21 (base-nova), @base-ui/react, three, motion, lucide-react, react-icons | W |
| RoseGriffon maintenance | `apps/rosegriffon/infra/cloudflare/maintenance` | page d'état | Worker | W |
| rg-app-shell | `apps/rosegriffon/packages/rg-app-shell` | app shell | next, lucide, next-themes | W |
| IECODE GUI | `apps/rosegriffon/apps/iecode-dotnet/Gui` | desktop .NET | Avalonia + Fluent, FluentAvaloniaUI, Material.Icons.Avalonia, 8 thèmes XAML | WD (NuGet `Microsoft.WebUI`) |
| NIE UI | `apps/rosegriffon/packages/nie-ui`, `nie-web`, `tools/iecode-cpp` | web UI | TS + LESS, `game-design-system.tsx` (deux copies) | W |
| NIE editor | `apps/rosegriffon/crates/aphrody-nie-editor` | desktop | eframe 0.36.2 | G |
| nie-pkg-ui | `apps/rosegriffon/crates/nie-pkg-ui` | SSR | dioxus 0.7.10 + dioxus-ssr | W (WebUI) |
| docs patreon-bun | `apps/rosegriffon/packages/patreon-bun/docs/.vitepress` | docs | VitePress | W |
| Shenron site | `apps/shenron/apps/site` (sous-module) | web app | next 16.5.0-canary.5, react ^19.3, tailwind ^4.3.3, shadcn ^4.21, lucide, motion, pixi.js, remotion, tiptap, next-intl ; `vercel.json` | W |
| Shenron activity | `apps/shenron/apps/activity` | Discord Activity | embedded-app-sdk ^2.5, react, @aphrody/shenron-ui | W |
| Shenron Studio, Koharu | `apps/shenron/crates/{shenron-desktop,shenron-studio,koharu-*}` | desktop | fork Tauri `aphrody-tauri` 3.0.0-alpha.4, vello 0.11 | G |
| bots Discord (rg-bot, shenron bot) | `apps/rosegriffon/apps/rg-bot`, `apps/shenron/apps/bot` | embeds Discord | discord.js ^14.27, discordx | couleurs d'embed depuis `tokens.json` |
| l2l | `apps/l2l` | — | `PLAN.md` seul | — |

`apps/rosegriffon` et `apps/shenron` sont des sous-modules (non initialisés dans `git submodule status`) : leurs migrations se font dans leurs dépôts.

## 2. Bibliothèques de design, tokens, composants, icônes

| Bibliothèque | Chemin | Consommateurs | Décision |
|---|---|---|---|
| **@aphrody/design** | `packages/design` | ai-os TUI | **unique système** : tokens MCU 0.4.0, Material Web 2.5.0, Material Symbols 0.49.0, Figma, DESIGN.md |
| assets/brand + aphrody-brand | `assets/brand`, `crates/aphrody-brand` (agent marque) | sites, binaires | garde `brand.toml` (seed `#3355FF`, vibrant) comme entrée ; `gen/tokens/*` devient redondant avec `packages/design/tokens` (valeurs identiques vérifiées) : l'agent marque lit `tokens.json` |
| aphrody-design-emit | `crates/aphrody-design-emit` | aucun | **supprimé** (émetteur multi-cible dédoublonné par `packages/design/src/build.ts`), `Cargo.lock` élagué |
| aphrody-design-tokens, -shared | `crates/aphrody-design-{tokens,shared}` | aphrody-brand, `crates/ui`, `crates/react`, `crates/next` | à retirer après bascule d'aphrody-brand sur `tokens.json` (moteur HCT Rust redondant avec MCU) |
| aphrody-design-identity, -sprite-sheet | `crates/aphrody-design-{identity,sprite-sheet}` | test `google-design/tests/pet-parity.test.ts` | à supprimer avec google-design (`m3-tokens.css` identique octet pour octet à celui de google-design) |
| aphrody-design-icons | `crates/aphrody-design-icons` | `google-design/src/symbols/catalog.ts` (repli) | à supprimer avec google-design ; icônes = `material-symbols` |
| aphrody-design-layout | `crates/aphrody-design-layout` | `crates/react` | à retirer (parseur Tailwind, contraire à la règle) |
| crates/ui | `crates/ui` | aucun | à retirer ou réécrire sur GPUI + `tokens.rs` |
| @aphrody/google-design | `packages/google-design` | yolo (assets, symbols), aphrody (pets), `packages/deploy/src/m3.ts` (hct.ts) | à supprimer dès que ces trois consommateurs sont migrés |
| bun-plugins m3-icons | `packages/bun-plugins/m3-icons-plugin.ts` | yolo | à supprimer avec la migration de yolo |
| deploy `m3.ts` | `packages/deploy/src/m3.ts` | pages aphrody.app | remplacé par `tokens.css` (agent aphrody.app) |
| tokens d'apps | `apps/aphrody/src/design/material-tokens.ts`, `src/m3.css` ; `apps/yolo/src/client/style.css` | une app chacun | remplacés par `tokens.css` |
| @aphrody/m3-* (npm 1.4.7 et 3.3.x) | sources dans `var/legacy/aphrody-labs/aphrody-m3` | auto, rg-ui, shenron-ui | abandon : Material Web officiel à la place |
| @auto/ui | `apps/auto/packages/ui` | auto web, admin, extension | remplacé par `@aphrody/design` |
| @rosegriffon/ui (77 composants shadcn) | `apps/rosegriffon/packages/rg-ui` | rg-website, rg-app-shell, rg-bot | remplacé par `@aphrody/design` (dans le sous-module) |
| @aphrody/shenron-ui | `apps/shenron/packages/ui` | site, activity, bot | remplacé par `@aphrody/design` ; `tokens-m3/` et `gds/` sont des copies divergentes de google-design |
| registres shadcn | 4 `components.json` (rg-ui, rg-website, shenron site, shenron ui) | — | à supprimer |
| Omarchy/Aether | `crates/unix-omarchy`, `crates/cosmic-compat/src/theme.rs` | WSL | schéma terminal de `ansi.json` |
| `var/brand-stage` | copie de staging de trois crates (non suivie) | aucun | à purger par son propriétaire |

Sources d'icônes en usage : lucide-react, react-icons, @material-symbols/svg-400 0.48.1, @fontsource/material-symbols-rounded 5.3.9, google-design `assets/symbols`, `assets/brand/symbols`, Material.Icons.Avalonia. Cible : `material-symbols` 0.49.0 seul (et `assets/brand/symbols` pour les icônes produit, déjà en Material Symbols Rounded).

## 3. Ordre de migration

1. **aphrody.com et aphrody.app** (agents dédiés) : `tokens.css`, Material Web, Google Sans Flex, fin des imports google-design.
2. **yolo, r2-site, forge, pages du relais et d'env-kit, page d'état** : passage à W ; puis suppression de `packages/google-design`, `packages/bun-plugins/m3-icons-plugin.ts`, `crates/aphrody-design-{identity,sprite-sheet,icons}`.
3. **TUI** : aphrody-host, ay/lore-client (anstyle depuis `tokens.rs`), rea.
4. **Bascule d'aphrody-brand** sur `tokens.json`, puis retrait de `crates/aphrody-design-{tokens,shared,layout}` et `crates/ui`.
5. **auto** (W + WD), **unixwin** (W + G), **rosegriffon** et **shenron** dans leurs sous-modules (W, G, WD), avec abandon de shadcn, Tailwind, Base UI, lucide et des paquets `@aphrody/m3-*`.

Chaque lot : `bun test --cwd packages/design`, compilation en CI ou sur fr1 (`nice -n 19`), revue Gemini archivée dans `docs/reviews/`.
