# Claude Code plugin `labs`

Location: `plugins/labs` (v0.1.0). Validated on 2026-11-12 with `claude plugin validate` (OK) and a check script: frontmatter, unique names, relative links.

## Installation
- Local: `claude --plugin-dir plugins/labs` (from the root of src)
- Marketplace: declare an entry in `.claude-plugin/marketplace.json` at the root of the repository, then `/plugin marketplace add aphrody-labs/labs` and `/plugin install labs@<marketplace>`. This file is not created yet.
  ```json
  {"name":"aphrody-labs","owner":{"name":"Aphrody Labs"},"plugins":[{"name":"labs","source":"./plugins/labs"}]}
  ```

## Contents
| Type | Name | Role |
|-|-|-|
| skill | labs-dev | just recipes, cargo profiles, Lore, fr1/prd, conventions |
| skill | chromium | channels, fetch/gn/siso, headless/labs_agent args, ChromiumOS |
| skill | browser-engines | engine roles, CDP/BiDi drivers, builds, org inventory |
| skill | web-quality | Lighthouse 13.6, web-vitals 6.2, Baseline/BCD, modern-web-guidance |
| skill | bun | condensed upstream bun docs (1.4.4) |
| skill | vercel-labs | index of Vercel Labs tools |
| skill | agent-browser, vercel-composition-patterns, vercel-react-native-skills, vercel-react-view-transitions, vercel-optimize, web-design-guidelines, writing-guidelines | upstream copies |
| skill | aphrody-stack | pointer to STACK-ROADMAP.md (not verified) |
| command | /labs:factory, /labs:save, /labs:bench, /labs:channels | fr1 factory, Lore, bench, Chrome pins |
| agent | chromium-builder, web-perf-auditor | factory troubleshooting, perf audit |

## Sources (2026-11-12)
- Chromium: `C:\src\third_party\chromium\src` @ef68a767 (160.0.8158.0); `third_party/chrome-channels.toml` (stable 157.0.8103.78).
- Web: lighthouse 13.6.0 @3e50684, web-vitals 6.2.3 @94b3b4b, modern-web-guidance @4dd9683, browser-compat-data 8.1.8 @e665ba4. Pages read: web.dev/articles/vitals, web.dev/baseline.
- Browsers: brave-core @c299f814f, helium @4697bd3, servo @85c78cb89, lightpanda @16ff86b, other clones listed in `skills/browser-engines/SKILL.md`. gh api search across 9 orgs.
- Vercel Labs: agent-skills @1a2c79d, agent-browser 0.42.0 @d129226, skills CLI 1.8.0 @1d2bf37.
- Bun: oven-sh/bun @7f964e69 (1.4.4), binary 1.4.4+38afee6c8.
- labs: justfile, Cargo.toml, .cargo/config.toml, ARCHITECTURE.md, ENGINE-DECISION.md, bench/REPORT.md.

## Not verified / limits
- Pitfalls `enable_printing`, `enable_pdf`, `enable_nacl` (`enable_nacl` is absent from the checkout's `.gni` files); chromiumos repositories listed without individual verification; `cros-factory.sh` uses the old form `cros_sdk -- build_packages`.
- web-quality: Lighthouse commands and web-vitals injection not run; "poor" thresholds taken from the source code only; CDN `@6`; web-features fields.
- browser-engines: Chromium, Firefox and deno build commands not reread in the clones.
- vercel-labs: npm versions not queried; MIT LICENSE files written locally for agent-skills, which has no LICENSE upstream; `web-design-guidelines` downloads its rules at run time.
- bun: references of 368 KB against 250 KB targeted; `bun lint` documented but absent from the 1.4.4 binary; generation scripts in `%TEMP%\bunskill`, not versioned.
- labs-dev: no `just min` recipe; rust-lld gain not quantified; `/labs:bench` without a versioned bench script.
- Agents and commands not run.
