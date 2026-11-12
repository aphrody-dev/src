---
name: browser-engines
description: Use when choosing, driving, building or comparing a browser engine for Aphrody Labs — render oracle, agent browser (light or full), embedded browser, cross-engine diff, conformance runs, CDP/BiDi/WebDriver or Playwright/Puppeteer compatibility, building Chromium/Brave/Helium/Servo/Lightpanda/Obscura/Firefox/Blitz/rusty_v8/workerd from source, or the Brave/Helium patch-over-Chromium model. Triggers: "quel moteur", "headless", "oracle de rendu", "agent browser", "Lightpanda", "Servo", "Obscura", "Helium", "Brave", "chrome-headless-shell", "CEF", "Electron", "BiDi", "CDP", "Playwright", "Puppeteer", "build from source".
---

# browser-engines (mesuré fr1, 2026-11-12)

Font foi, dans l'ordre : `C:\labs\docs\bench\REPORT.md` (+ `*.json`), `C:\labs\docs\ENGINE-DECISION.md` § « Décision mesurée », puis amendements propriétaire (V8 suit Chromium de cef-rs 156 ; oracle = Chrome Stable 157 ; checkout 160 = extraction seulement). Ne pas citer un chiffre hors de ces fichiers sans source.

## Rôles labs

| rôle | moteur | preuve (REPORT) | limites |
|---|---|---|---|
| Oracle de rendu | chrome-headless-shell Stable 157.0.8103.78 ; Canary 160.0.8156.0 = alerte | 12/12 sites, B 6/6, Turnstile 9/9, 45/45 features, Lighthouse OK, ~142 ms froid, ~620 Mo | — |
| Second oracle | Firefox Nightly 162.0a1 via BiDi ; WebKit (Playwright webkit-2388) pour JSC | FF 12/12, 44/45 ; WebKit B 6/6, 45/45 | FF ~1,1 Go, ~2 s froid |
| Agent léger | Lightpanda 1.1.0-nightly.12036 | 12/12, B 6/6, ~72 Mo, 44 ms froid, Puppeteer+Playwright ok | pas de layout/paint/iframes/Wasm/Turnstile réel |
| Agent complet | chs-stable en CDP direct (Puppeteer/Playwright) ; `labs_agent` (usine fr1) = version réduite | idem oracle | agent-browser 0.42 ajoute 30-90 ms/cmd, +~400 ms froid |
| Embarqué VPS | Electron 43.8.9 (Chromium 150) | 12/12, 581 Mo, meilleur LCP | `Target.createTarget` non supporté |
| Embarqué (alt.) | CEF 156.0.26 | fonctionne | Xvfb requis, pas de nouvelle cible CDP : Lighthouse/newPage KO |
| Veille | Servo 0.8.0 nightly, Obscura 0.2.6 | Servo 6/12, 36/45, WebDriver seul ; Obscura nav client `<Link>` KO | rejouer `bun bench.ts` |
| Écartés headless | Brave Nightly 1.102.1 (Chromium 158), Helium 0.21.2.1 (157) | Brave ~1,1 Go ; Helium ~11 s/page, 2,2 Go | — |
| Serveur JS | Node 24 réf., Bun 1.4.4 option | résultats client identiques | `next start` plus lent sous Bun (1 échantillon) |

## Matrice drivers (goto+evaluate+click+screenshot, REPORT § Driver compatibility)

| moteur | protocole | Puppeteer 25.17 | Playwright 1.65 |
|---|---|---|---|
| chs-stable/canary, pw-chromium, Brave, Helium | CDP | ok | ok |
| Lightpanda, Obscura | CDP (sous-ensemble) | ok | ok |
| Firefox Nightly, Zen | WebDriver BiDi | ok (BiDi) | KO (lancement) |
| pw-firefox | BiDi / Juggler | ok (BiDi) | ok (Juggler) |
| pw-webkit | protocole WebKit Playwright | n/a | ok |
| Servo | WebDriver classic seul | n/a | n/a |
| CEF 156, Electron 43 | CDP sans `Target.createTarget` | KO newPage | KO newPage |

Règle : piloter la page existante pour CEF/Electron ; BiDi pour Gecko ; CDP direct sinon.

## Build depuis les sources (clones `C:\src\third_party\browsers\*`)

| projet | clone (commit, date) | commande |
|---|---|---|
| Chromium | gitiles chromium/src | `fetch chromium` + `gn gen out/X` + `autoninja -C out/X chrome` (doc upstream, non relue ici) |
| brave-core | c299f814f 2026-11-12 (v1.102.1, tag Chromium 158.0.8127.22) | `pnpm run init` puis `pnpm run build [Release]` ; `--target_os=android --target_arch=arm` / `ios` |
| brave-browser | cbd0ce8 2026-11-12 | issues/releases/wiki seulement, pas de code |
| helium | 4697bd3 2026-11-12 (Chromium 157.0.8103.78, `patches/series` 371 lignes) | via dépôt plateforme |
| helium-linux | c594074 2026-11-10 | `scripts/docker-build.sh` |
| servo | 85c78cb89 2026-11-12 | `./mach bootstrap` puis `./mach build` (Windows `.\mach`) |
| stylo | 9d5623e 2026-11-11 | crate Cargo (moteur CSS de Servo) |
| lightpanda | 16ff86b 2026-11-12 | Zig : `zig build snapshot_creator -- src/snapshot.bin` ; `zig build -Dsnapshot_path=../../snapshot.bin` ; `make test` |
| obscura | 3bae609 2026-11-11 | `cargo build --release -p obscura-cli --bins --features render[,stealth]` ; CDP protégé par `OBSCURA_CDP_TOKEN` |
| firefox | 2024e90df3 2026-11-12 | `./mach bootstrap && ./mach build` (convention Mozilla, non relue ici) |
| blitz | e814eb0 2026-11-12 | `cargo run -rp browser` / `rdme` / `todomvc` |
| rusty_v8 | 55ca54e 2026-10-21 | `cargo build` (binaire précompilé) ; `RUSTY_V8_ARCHIVE`, `RUSTY_V8_MIRROR` ; source : `V8_FROM_SOURCE=1` + `LIBCLANG_PATH` |
| deno | e7b39ebd 2026-10-26 | `cargo build` |
| workerd | 22a428d 2026-11-12 | `bazel build //src/workerd/server:workerd [--config=release|thin-lto]` |
| agent-browser | f88c40b 2026-11-11 | `npm i -g agent-browser` ; dev : `pnpm install && pnpm build:source` ; `cargo test e2e -- --ignored --test-threads=1` |

## Modèle patch-over-Chromium

- **Brave** : `brave-core` est un dépôt *dans* `src/brave` d'un checkout Chromium épinglé (`package.json` → `tag`). Deux mécanismes : `patches/*.patch` (1327 fichiers, modifs directes de Chromium, `DEPS.patch` inclus) et `chromium_src/` (surcharges par chemin miroir, préférées car moins de conflits). Montée de version : `docs/chromium_version_upgrade.md`.
- **Helium** : fork de la méthode ungoogled-chromium. Tarball Chromium (`chromium_version.txt`), `pruning.list` (binaires retirés), `domain_substitution.list` + `domain_regex.list`, `flags.gn`, puis `patches/series` appliqué dans l'ordre. Patches rangés par vendeur : `ungoogled-chromium/`, `inox-patchset/`, `iridium-browser/`, `bromite/`, `brave/`, `debian/`, `upstream-fixes/`, `helium/`. Dépôts plateforme (`helium-linux|windows|macos`) font build + packaging. Licences : `LICENSE` + `LICENSE.ungoogled_chromium`.
- Conséquence labs : pour un Chromium maison (usine fr1), copier le modèle Helium (série ordonnée + pruning) pour des builds reproductibles ; `chromium_src` à la Brave pour les surcharges durables.

## Workflow

1. Besoin de vérité pixel/Lighthouse → chs-stable ; diff → + Firefox BiDi + WebKit.
2. Lecture/scraping massif pas cher → Lightpanda ; repli chs-stable si layout/iframe/Turnstile.
3. Nouvelle version d'un moteur → rejouer le harness `docs/bench` (`bun bench.ts`), mettre à jour REPORT.md puis ce tableau.
4. Inventaire des orgs (Chrome, Chromium, Brave, imputnet, Servo, Lightpanda, h4ckf0r0day, vercel-labs) → `references/org-inventory.md` (= `C:\labs\docs\WEB-ECOSYSTEM.md`).

## Liens

- https://googlechromelabs.github.io/chrome-for-testing/ · https://chromium.googlesource.com/chromium/src · https://github.com/brave/brave-core · https://github.com/imputnet/helium · https://github.com/servo/servo · https://github.com/lightpanda-io/browser · https://github.com/h4ckf0r0day/obscura · https://github.com/vercel-labs/agent-browser · https://github.com/DioxusLabs/blitz · https://github.com/denoland/rusty_v8 · https://github.com/cloudflare/workerd · https://w3c.github.io/webdriver-bidi/

## Non vérifié

Commandes Chromium/Firefox (non relues dans les clones) ; causes des lenteurs Helium (non investiguées, REPORT).
