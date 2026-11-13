# Pile UI cible du monorepo

Décision du propriétaire, 2026-11-13 : toutes les UI actuelles sont rejetées sauf quatre références, GPUI (Zed), Microsoft WebUI, la « Vercel native Zig UI » et le vrai Material 3. Ce document cite les sources vues en direct le 2026-11-13 (`gh api`, registre npm, crates.io, context7, Microsoft Learn MCP, MCP Figma) et fixe la cible de chaque surface. Système de design : `packages/design`. Inventaire et plan : `docs/ui/INVENTORY.md`. Skill pour les agents : `.agents/skills/ui-system`.

## 1. GPUI (Zed)

| Point | Constat | Source |
|---|---|---|
| Dépôt | `zed-industries/zed`, crate `crates/gpui`, homepage https://gpui.rs | `gh api repos/zed-industries/zed`, HEAD `27bbbc1cc4` (2026-11-13) |
| Licence | `gpui` et `gpui_windows` : Apache-2.0 (le dépôt Zed est mixte GPL/AGPL/Apache, `NOASSERTION` côté GitHub) | `crates/gpui/Cargo.toml`, `crates/gpui_windows/Cargo.toml` |
| crates.io | `gpui` 0.2.2 (publiée le 2025-10-22, Apache-2.0) ; l'arbre de Zed est plus récent que la crate publiée | `crates.io/api/v1/crates/gpui` |
| Écosystème | `gpui-component` 0.9.1 (longbridge, 2026-11-09), fork communautaire `gpui-ce` 0.3.0 (2026-10-20) ; context7 indexe aussi une 0.3.4 (`/websites/rs_gpui-pre`) non publiée sur crates.io : conflit de versions signalé, on épingle un commit Zed | crates.io, context7 |
| Windows | backend `gpui_windows` en production (Zed 1.28.1 du 2026-11-11 livré sur Windows) : Direct3D 11 + DirectComposition + DirectWrite, `windows-rs` (`windows-core` 0.62), AccessKit | `crates/gpui_windows/src/directx_renderer.rs`, `gh api .../releases/latest` |
| Écart avec nt | GPUI est en D3D11, nt vise D3D12 et 4K 120 fps : GPUI convient aux outils desktop, pas au shell nt (direction tenue par l'agent nt) | lecture du code ci-dessus |
| Intégration | dépendance git épinglée sur un commit Zed, couleurs `packages/design/tokens/tokens.rs` (`gpui::rgba(md::light::PRIMARY)`), compilation en CI ou sur fr1 | — |

## 2. Microsoft WebUI

| Point | Constat | Source |
|---|---|---|
| Dépôt | `microsoft/webui` : SSR sans JavaScript côté serveur, templates HTML compilés en protocole binaire (protobuf), Web Components hydratés en îlots ; docs https://microsoft.github.io/webui | `gh api repos/microsoft/webui`, HEAD `30ca60aa4b` (2026-11-10) |
| Licence | MIT | GitHub, npm |
| Versions | release v3.1.1 (2026-11-10) ; npm `@microsoft/webui` 3.1.1 ; crate `microsoft-webui-cli` ; NuGet `Microsoft.WebUI` | `gh api .../releases`, registre npm |
| Intégration bun | officielle : « Node.js and Bun : `@microsoft/webui` exposes the Rust renderer through a platform-specific native addon » ; binaires `webui-win32-x64`, `webui-win32-arm64` | https://microsoft.github.io/webui/build/integrations/node/ |
| Desktop | crate `webui-desktop` (WebView2 via `webview2-com` + `windows` sur Windows), paquets `webui-desktop-win32-x64/arm64` | `crates/webui-desktop/Cargo.toml` ; distribution WebView2 Evergreen : https://learn.microsoft.com/microsoft-edge/webview2/concepts/distribution |
| Tokens | crate `webui-tokens` et `DESIGN.md` d'architecture dans le dépôt | `gh api .../contents/crates` |
| Rôle chez nous | moteur de rendu HTML des sites et dashboards servis par bun (aphrody.com, aphrody.app), avec Material Web comme îlots ; hôte desktop léger pour les outils qui n'ont pas besoin de GPUI | — |

## 3. « Vercel native Zig UI » = Native SDK (`vercel-labs/native`)

| Point | Constat | Source |
|---|---|---|
| Identification | `vercel-labs/native`, « Toolkit for building native desktop apps », langage Zig, https://native-sdk.dev ; seul dépôt vercel-labs d'UI native en Zig (`wterm` est un terminal Zig vers WASM) | `gh api repos/vercel-labs/native`, `docs/ECOSYSTEM-VERCEL-MICROSOFT.md` |
| Licence | Apache-2.0, 7 844 étoiles | GitHub |
| Version | v0.11.1 (2026-11-09), HEAD `4d47c2cfcd` ; statut « experimental » (bandeau Vercel Labs) | `gh api .../releases` |
| Modèle | cœur TypeScript (sous-ensemble vérifié, compilé en natif) ou cœur Zig (`--template zig-core`), vues en balisage `.native`, architecture message/update/effets ; Zig 0.16 | README, https://native-sdk.dev/docs |
| Windows | hôte desktop Windows : présentation Direct2D/DirectWrite des paquets retenus, repli sur un rendu logiciel déterministe ; IME Windows non encore vérifiée sur matériel réel | https://native-sdk.dev/docs/platform-support |
| Contrainte | la CLI `@native-sdk/cli` exige Node.js 24 : incompatible avec la règle bun ; usage limité au cœur Zig piloté par `zig build`, sans la CLI npm. Procédure de build sans Node non encore écrite : la ligne Zig de la matrice reste conditionnelle tant qu'un outil n'en a pas besoin | README |
| Rôle chez nous | outils natifs dont le cœur est déjà en Zig ; tokens `packages/design/tokens/tokens.zig` ; aucune surface actuelle ne l'exige (voir INVENTORY) | — |

## 4. Material 3

| Brique | Constat | Source |
|---|---|---|
| Spécification | https://m3.material.io (tokens : https://m3.material.io/foundations/design-tokens/overview) | HTTP 200 vu le 2026-11-13 |
| Material Color Utilities | `material-foundation/material-color-utilities` (Apache-2.0, poussé le 2026-11-06), npm `@material/material-color-utilities` 0.4.0 (2026-01-21) : `DynamicScheme`, `MaterialDynamicColors`, variantes TonalSpot/Vibrant/Expressive/…, spec 2021 et 2025, contraste 0/0,5/1 | registre npm, `gh api` |
| Material Web | `material-components/material-web` (Apache-2.0), npm `@material/web` 2.5.0 (2026-07-15), nightlies 2.5.1 jusqu'au 2026-11-11 ; README : « MWC is in maintenance mode pending new maintainers » ; dépend de `lit` ^2.8 ou ^3 | README, registre npm |
| Tokens Material Web | `@material/web/tokens/versions/v0_192/_md-sys-*.scss` : échelle typographique, formes, mouvement, élévation, états ; `material-foundation/material-tokens` est archivé (dernier push 2023-08-15) | paquet installé, `gh api` |
| Material Symbols | `google/material-design-icons` (Apache-2.0), npm `material-symbols` 0.49.0 (polices variables Outlined/Rounded/Sharp) et `@material-symbols/svg-400` 0.49.0 ; catalogue https://fonts.google.com/icons | registre npm |
| Figma | Material 3 Design Kit officiel : https://www.figma.com/community/file/1035203688168086460/material-3-design-kit (redirection vérifiée) ; nos variables : fichier `2xsZi5wLPAYLGNCLZ2ZJUv` (équipe Aphrody, plan Professional, 4 modes par collection), voir `packages/design/tokens/figma.json` | MCP Figma `whoami`, `use_figma` |
| design.md | `google-labs-code/design.md` (Apache-2.0, HEAD `1ed38aa9dd`), npm `@google/design.md` 0.4.0, CLI `designmd lint` ; format front matter YAML `version: alpha` | `docs/spec.md` du dépôt |

Police : Google Sans Flex, SIL OFL 1.1 sans Reserved Font Name (google/fonts `ofl/googlesansflex`, voir `assets/brand/brand.toml`) ; le nom ne doit pas servir de nom de produit.

Risque : Material Web est en maintenance. Mitigation : nous ne dépendons que des éléments `md-*` stables et des tokens CSS `--md-sys-*`, que `packages/design` génère lui-même ; un remplacement par des Web Components WebUI garderait les mêmes tokens.

## 5. Modèles Google et Cloudflare

| Sujet | Google | Cloudflare |
|---|---|---|
| Système de design | Material 3 (ci-dessus), un seul système pour tous les produits, tokens `md.sys.*` / `md.ref.*` | Kumo (`cloudflare/kumo`, MIT, npm `@cloudflare/kumo` 2.18.1, HEAD `eaa9e173b2`) : composants React sur Base UI, https://kumo-ui.com |
| Figma | Material 3 Design Kit communautaire, variables `Schemes/*` | `packages/kumo-figma` : plugin qui génère le UI Kit, `build-figma-variables.ts`, `sync-tokens-to-figma.ts`, test de dérive code/Figma |
| Docs | https://developers.google.com/style (guide de style de documentation), docs par produit sous developers.google.com | `cloudflare/cloudflare-docs` (branche `production`, HEAD `dc696ce1fe`), Astro 7.4.5 + Starlight, 114 sections produit sous `src/content/docs`, guide https://developers.cloudflare.com/style-guide/ (style-and-grammar, documentation-content-strategy, api-content-strategy) |
| Organisation | marques produit sous un holding, docs et design partagés | un catalogue de produits plat, une page d'entrée par produit, même gabarit partout |

Ce que nous reprenons : un seul système de tokens généré (Google), une synchronisation code vers Figma vérifiée par un test de dérive (Cloudflare `kumo-figma`, chez nous `src/figma.ts` + `tests/tokens.test.ts`), un gabarit de doc unique par produit (Cloudflare). Ce que nous ne reprenons pas : React/Base UI de Kumo (règle web = Material Web), Astro (bun sert les docs).

## 6. Matrice des cibles

| Surface | Cible | Tokens | Composants / icônes | Construction |
|---|---|---|---|---|
| Web : sites, dashboards, aphrody.com, aphrody.app | HTML servi par bun (`Bun.serve`) ou rendu par Microsoft WebUI, îlots Material Web | `tokens.css` (`--md-sys-*`) | `@aphrody/design/components` (`md-*`), Material Symbols Rounded | `bun build`, en CI |
| Desktop natif (outils) | GPUI | `tokens.rs` | composants GPUI maison minimaux sur les rôles M3, ou `gpui-component` thémé | CI Windows ou fr1 `nice -n 19` |
| Desktop à contenu web | Microsoft WebUI desktop (WebView2) | `tokens.css` | Material Web | CI |
| nt (shell du poste, exception assumée : Fluent/WinUI 3 y coexistent avec les rôles M3 de la marque) | direction de l'agent nt : WebUI, WinUI 3, Fluent, GPU pur 4K 120 fps ; reçoit `tokens.rs`/`tokens.css` pour la marque | `tokens.rs` | selon agent nt | CI |
| TUI (`ay`, outils CLI) | ratatui/crossterm (Rust) ou SGR bun | `tokens.rs`, `ansi.json`, `ansi.sh`, schémas Windows Terminal dans `ansi.json` | — | CI |
| Outils natifs Zig | Native SDK (`vercel-labs/native`) cœur Zig, sans CLI Node | `tokens.zig` | composants Native SDK thémés | CI |
| Maquettes | Figma (MCP) + Stitch (MCP du relais) depuis `packages/design/DESIGN.md` | `figma-variables.json`, `DESIGN.md` | Material 3 Design Kit | — |

## 7. Garde-fous de `packages/design`

- `src/build.ts` échoue si l'extraction SCSS de Material Web ne donne pas 15 styles typographiques x 5 propriétés, 7 coins, 16 durées, 6 élévations, 4 opacités d'état.
- `tests/tokens.test.ts` : source = `brand.toml`, 6 modes aux mêmes 49 rôles, contraste de toutes les paires `on-X`/`X` (4,5:1, 7:1 en contraste élevé), `inverse-on-surface`, `outline`/`surface` >= 3:1, absence de dérive des sorties.
- `tokens.css` met les durées à 0 ms sous `prefers-reduced-motion: reduce`.
- `figma-sync.js` ne renomme le premier mode qu'à la création de la collection et signale les variables Figma absentes du code (`stale`).
- Suppression d'`aphrody-design-emit` : `Cargo.lock` élagué, validé par `cargo metadata --locked` sur un export `git archive HEAD` (2026-11-13).
- Non validé localement (aucune compilation sur le PC) : `tokens.rs` et `tokens.zig` ; à compiler en CI au premier consommateur.

## 8. Ce qui est remplacé

- `packages/google-design` (studio « gds », port maison de HCT, serveur miroir, Stitch simulé) : remplacé par `packages/design` qui appelle le Material Color Utilities officiel. Ses consommateurs migrent (INVENTORY), puis le paquet est supprimé.
- `crates/aphrody-design-*` (moteur HCT Rust, émetteurs multi-cibles) : la génération passe à `packages/design` ; `crates/aphrody-brand` (agent marque) reste le producteur des assets graphiques et doit lire `packages/design/tokens/tokens.json` au lieu de recalculer le schéma (même résultat vérifié : primary `#1242FF`, dark primary `#BAC3FF`).
- Tailwind, shadcn, Base UI et CSS de couleurs maison dans les apps : retirés au fil des migrations.
