# Plugin Claude Code `labs`

Emplacement : `plugins/labs` (v0.1.0). Validé le 2026-11-12 avec `claude plugin validate` (OK) et un script de contrôle : frontmatter, noms uniques, liens relatifs.

## Installation
- Local : `claude --plugin-dir C:\labs\plugins\labs`
- Marketplace : déclarer une entrée dans `.claude-plugin/marketplace.json` à la racine du dépôt, puis `/plugin marketplace add aphrody-labs/labs` et `/plugin install labs@<marketplace>`. Ce fichier n'est pas encore créé.
  ```json
  {"name":"aphrody-labs","owner":{"name":"Aphrody Labs"},"plugins":[{"name":"labs","source":"./plugins/labs"}]}
  ```

## Contenu
| Type | Nom | Rôle |
|-|-|-|
| skill | labs-dev | recettes just, profils cargo, Lore, fr1/prd, conventions |
| skill | chromium | canaux, fetch/gn/siso, args headless/labs_agent, ChromiumOS |
| skill | browser-engines | rôles des moteurs, drivers CDP/BiDi, builds, inventaire des orgs |
| skill | web-quality | Lighthouse 13.6, web-vitals 6.2, Baseline/BCD, modern-web-guidance |
| skill | bun | docs bun upstream condensées (1.4.4) |
| skill | vercel-labs | index des outils Vercel Labs |
| skill | agent-browser, vercel-composition-patterns, vercel-react-native-skills, vercel-react-view-transitions, vercel-optimize, web-design-guidelines, writing-guidelines | copies upstream |
| skill | aphrody-stack | renvoi vers STACK-ROADMAP.md (non vérifié) |
| commande | /labs:factory, /labs:save, /labs:bench, /labs:channels | usine fr1, Lore, bench, pins Chrome |
| agent | chromium-builder, web-perf-auditor | dépannage de l'usine, audit perf |

## Sources (2026-11-12)
- Chromium : `C:\src\third_party\chromium\src` @ef68a767 (160.0.8158.0) ; `third_party/chrome-channels.toml` (stable 157.0.8103.78).
- Web : lighthouse 13.6.0 @3e50684, web-vitals 6.2.3 @94b3b4b, modern-web-guidance @4dd9683, browser-compat-data 8.1.8 @e665ba4. Pages lues : web.dev/articles/vitals, web.dev/baseline.
- Navigateurs : brave-core @c299f814f, helium @4697bd3, servo @85c78cb89, lightpanda @16ff86b, autres clones listés dans `skills/browser-engines/SKILL.md`. gh api search sur 9 orgs.
- Vercel Labs : agent-skills @1a2c79d, agent-browser 0.42.0 @d129226, skills CLI 1.8.0 @1d2bf37.
- Bun : oven-sh/bun @7f964e69 (1.4.4), binaire 1.4.4+38afee6c8.
- labs : justfile, Cargo.toml, .cargo/config.toml, ARCHITECTURE.md, ENGINE-DECISION.md, bench/REPORT.md.

## Non vérifié / limites
- Pièges `enable_printing`, `enable_pdf`, `enable_nacl` (`enable_nacl` est absent des `.gni` du checkout) ; dépôts chromiumos listés sans vérification individuelle ; `cros-factory.sh` utilise l'ancienne forme `cros_sdk -- build_packages`.
- web-quality : commandes Lighthouse et injection web-vitals non exécutées ; seuils « mauvais » tirés du code source seulement ; CDN `@6` ; champs web-features.
- browser-engines : commandes de build Chromium, Firefox et deno non relues dans les clones.
- vercel-labs : versions npm non interrogées ; fichiers LICENSE MIT rédigés localement pour agent-skills, qui n'a pas de LICENSE en upstream ; `web-design-guidelines` télécharge ses règles à l'exécution.
- bun : références de 368 KB pour 250 KB visés ; `bun lint` documenté mais absent du binaire 1.4.4 ; scripts de génération dans `%TEMP%\bunskill`, non versionnés.
- labs-dev : aucune recette `just min` ; gain de rust-lld non chiffré ; `/labs:bench` sans script de bench versionné.
- Agents et commandes non exécutés.
