> **Statut : non vérifié.** Synthèse produite par des agents avec peu d'appels d'outils (24 pour 6 agents) : versions, classements et constats ci-dessous viennent en grande partie de la mémoire du modèle et peuvent être faux ou datés au 2026-11-12. Seuls font foi : `bench/REPORT.md`, `third_party/chrome-channels.toml`, et les mesures datées dans ENGINE-DECISION.md (« Décision mesurée »).

Vérifié moi-même dans `C:\labs` (lecture seule) : `Cargo.toml:3` `members = ["crates/*"]` (24 crates) ; `Cargo.toml:196-197` `deno_core = "=0.413.0"`, `v8 = "=152.2.0"` ; `:59` `dashmap = "=7.0.0-rc2"` ; `:181-183` `blitz-* = "=0.3.0-beta.4"` ; `docs/ARCHITECTURE.md:11` « Git is not used » alors que `.git` existe (3 commits) ; `rust-toolchain.toml` `channel = "nightly"` sans date ; `crates/cli/Cargo.toml:21` dépend de `aphrody-conformance`. Le reste vient des rapports de scan. [NV] = non vérifié.

## 1. Classements consolidés

**Navigateurs et moteurs (embarquement et agents)**
1. Chromium/Blink, Stable 157 (`third_party/chrome-channels.toml`) : la référence WPT, WebGPU (Dawn) et V8.
2. CEF via cef-rs 156.4.0+156.0.26 : la meilleure façon d'embarquer Blink en Rust, une seule version derrière Stable.
3. `headless_shell` (checkout 160.0.8158.0) : la meilleure base pour un Chromium agent, sans `//chrome` ni UI, avec CDP natif.
4. Lightpanda 1.1.0-dev (Zig, `build.zig.zon`) : la meilleure interface agent (CDP, BiDi, MCP, markdown). Licence AGPL, donc processus séparé obligatoire.
5. Obscura 0.1.0 (Rust, V8 150.4 via deno_core 0.412) : la philosophie la plus proche de labs (MCP, SSRF, stealth), mais très jeune.
6. Electron 43.8.9 (Chromium 150) : compatibilité maximale, mais 7 versions majeures de retard et lourd.
7. Servo 0.8.0 (SpiderMonkey `mozjs_sys` 153.6) : modulaire et en Rust, mais seulement WebDriver, pas de CDP.
8. Blitz 0.3.0-beta.4 : HTML/CSS natif sans JS. Idéal pour l'UI, pas pour le web arbitraire.
9. WebKit/WPE, puis Gecko : le premier n'a pas de cible Windows, le second ne s'embarque pas sur desktop.
10. Helium et Brave : des sources de patchs (debloat, privacy), pas des moteurs à embarquer.
- agent-browser 0.42.0 n'est pas un moteur : c'est la référence UX côté CLI (refs `@e1`, actions vérifiées).

**Moteurs JS**
1. V8 16.0.25 (checkout) / 15.7 (Stable) : performances de référence, via rusty_v8.
2. JavaScriptCore : démarrage rapide (Bun), mais les bindings Rust sont faibles.
3. SpiderMonkey (mozjs) : seulement si on prend la voie Servo.
4. QuickJS-ng / quickjs-jit =0.14.2 (nsh) : le meilleur moteur pour scripter ou sandboxer en Rust.
5. Hermes / Static Hermes : AOT intéressant, mais aucun binding mûr [NV].
6. Boa, puis Nova : Rust pur, mais lents ou encore en recherche.

**Compilateurs et toolchains**
1. clang/LLVM de Chromium : ThinLTO, PGO et orderfile.
2. rustc sur le même LLVM : condition pour la cross-language LTO avec Chromium.
3. rustc Cranelift : uniquement pour la boucle de dev.
4. `zig cc` : cross-compilation C.
5. MSVC : seulement pour le linker et le SDK.
- TypeScript, dans l'ordre : tsgo (type-check) > oxc (parse, transform, minify) > swc > esbuild > tsc.

**Rendu et GPU**
- Raster : Skia Graphite > Vello 0.12 > WebRender. Vello est la voie Rust.
- API GPU : wgpu 30 côté Rust, Dawn côté Blink. Garder `webgpu.h` comme frontière commune.
- Layout : Taffy 0.15, le seul pivot commun à GPUI, nsh, Blitz et Servo.
- Texte : HarfBuzz > Parley (+harfrust/skrifa) > font-kit+swash (GPUI) > cosmic-text.
- Style : stylo, le seul moteur CSS complet en Rust.

**Équivalents C++ → Rust**
- Remplacer par le Rust : ICU → ICU4X 2 ; HarfBuzz → harfrust ; FreeType → skrifa ; zlib → zlib-rs ; libpng → png ; Dawn → wgpu (côté Rust) ; libxml → xml5ever.
- BoringSSL → rustls + aws-lc-rs, mais seulement côté serveur aphrody.
- Pas d'équivalent mûr, on garde le C++ : ANGLE, PDFium, V8.

**Documentation**
1. Tauri et Electron : la doc la plus complète.
2. Dioxus : bon guide, rustdoc et exemples.
3. wgpu, Servo, oxc : doc correcte.
4. Chromium : très vaste, mais éclatée et souvent périmée.
5. Lightpanda et Obscura : README et bancs d'essai seulement.
6. GPUI et gpui-kit : on apprend surtout par les exemples.

## 2. Doublons, goulots et erreurs d'architecture

**Critique**
1. **Git ou Lore : il faut choisir.** `docs/ARCHITECTURE.md:11` contredit `.git` ; `.github/workflows/ci.yml` est supprimé, donc il n'y a plus de CI.
   - Correctif : git canonique (miroir `aphrody-labs/labs`), Lore traité comme un simple produit. Restaurer la CI sous forme de `just ci`, puis réécrire la ligne 11.
2. **Écart V8.** `Cargo.toml:196-197` tire V8 15.2 précompilé, alors que `docs/ENGINE-DECISION.md` impose V8 16.0.25.
   - Correctif : retirer les deux lignes ; ajouter `[patch.crates-io] v8 = { path = "vendor/rusty_v8" }` quand le fork existera.
   - Construire V8 une seule fois et le stocker en artefact CAS (`depot-cas`), jamais pendant `cargo build`.
3. **ENGINE-DECISION se contredit** (lignes 59, 98 et 125).
   - Correctif : oracle de conformance = Stable 157 ; embarquement = CEF 156 / Electron 150 ; 160 = uniquement source d'extraction.

**Élevé**
4. **Deux workspaces revendiquent le même produit.** `C:\src\Cargo.toml:6-8` contient `next`, `react`, `ui`, `rt`, `rust-stack`, `aphrody-design-*` ; `labs/crates/cli/Cargo.toml:3` décrit aussi aphrody.
   - Correctif : `src` = outillage souverain uniquement ; tout le code produit va dans labs.
5. **Lore surdimensionne la build.** `Cargo.toml:3` compile tous les crates : aws, hashicorp, fuse, capi, chaos, otlp/tonic, quinn (583 paquets dans le lock).
   - Correctif : sortir Lore dans `vcs/lore/` en workspace séparé, ou au minimum ajouter `default-members`.
6. **Trois copies de Lore** : `crates/lore*`, `tools/lore/`, `vendor/`, plus `src/third_party/vcs/lore`.
   - Correctif : une seule source, `aphrody-labs/lore`, épinglée dans `src.lock.json`.
7. **Le harnais de test est lié au binaire de prod** (`crates/cli/Cargo.toml:21`).
   - Correctif : passer conformance en dev-dependency ou en binaire `labs-conformance` séparé.
8. **Toolchain flottante.** Nightly sans date dans labs ; pas de `rust-toolchain.toml` dans src (MSRV 1.85 contre 1.97).
   - Correctif : `nightly-2026-11-12` identique dans les deux repos, piloté par `src.lock.json`.
9. **Politique de versions.** Tout est en `=x.y.z`, y compris des pré-versions (`Cargo.toml:41-197`).
   - Correctif : plages caret, avec Cargo.lock comme seul pin. `=` seulement pour les couples liés et commentés (gpui-pre, blitz/stylo, bitcode).
10. **Orgs mélangées.** `C:\src\DEPS:22-40` mêle `aphrody-dev` et `aphrody-labs`, avec des entrées qui pointent vers le repo lui-même.
    - Correctif : `aphrody-labs` comme seule org de forks ; supprimer les auto-références.

**Moyen**
11. **Builds non portables et lents.**
    - `target-cpu=native` (`src/tools.toml:450-483`) : passer à `x86-64-v3`.
    - lld-link désactivé (`labs/.cargo/config.toml:33-36`) + `lto=fat` + 1 CGU (`Cargo.toml:287-290`) : profil `release` en thin LTO / 16 CGU, et `dist` en fat LTO réservé à la CI.
12. **Rustflags.** Ils sont dupliqués dans `.cargo/config.toml:1-36`, et `+crt-static` est incompatible avec les DLL CEF.
    - Correctif : regrouper dans `[build]` seul ; pas de crt-static sur les cibles qui embarquent CEF.
13. **Un clone frais ne compile pas** : `vendor/`, `licenses/`, `third_party/` ne sont pas suivis.
    - Correctif : les versionner, ou les remplacer par des dépendances git épinglées.
14. **Docs dans `C:\src\docs`** : 35 fichiers, quatre docs d'architecture concurrentes, des versions Bun dans les noms de fichiers.
    - Correctif : un seul `ARCHITECTURE.md`, le reste dans `docs/history/`, et `AGENTS.md` comme unique fichier d'instructions agent.
15. **Scripts `.sh` dupliqués avec `ay`.**
    - Correctif : sous-commandes `ay vendor` et `ay channels`, plus un `labs/justfile`.

**Doublons et goulots de l'écosystème**
- **winit** en trois versions : `=0.31.0-beta.3` (dioxus), `=0.31.0-beta.4` (blitz), 0.30.2 (anyrender). Aligner sur beta.4 via `[patch]`.
- **wgpu** en trois versions : 29 (nsh), 30.0.1 (dioxus/blitz), git `cddb2f5` (gpui-fast/Zed). Pour éviter deux wgpu dans un même binaire, garder GPUI et Blitz dans des binaires séparés.
- **GPUI** en trois sources : gpui-pre =0.3.12 (gpui-kit 0.9.1), gpui-fast 0.1.14, Zed gpui 0.2.2. En choisir une seule.
- **html5ever** 0.39 (Obscura) contre 0.40.1, **taffy** 0.12 contre 0.15.1, et **dioxus-native** déclaré à la fois dans blitz (0.7.0) et dans dioxus main (0.8.0-alpha.3).
- **Dépendances git** (stylo `2dca345`, taffy `4aca4f4`, anyrender `93cf99f`) : Blitz ne peut pas être publié proprement.
- **Webview** : wry contre CEF (wef). Ne pas mélanger les deux dans une même cible.

## 3. Roadmap des frameworks Rust

**(a) Web full-stack, façon Vercel en self-hosted**
0. **Socle** : `cargo new`, nightly daté, workspace avec `resolver = "3"`, `cargo-binstall dioxus-cli` (même version que dioxus).
1. **Framework** : `dioxus = { version = "0.7.10", features = ["fullstack","router"] }` (stable). Prévoir la bascule vers 0.8 dès la sortie stable ; 0.8.0-alpha.3 est seulement à tester en branche.
2. **UI** : `rsx!`, dioxus-signals et stores, dioxus-router.
3. **Serveur** : axum 0.8.9, tower 0.5.2, tower-http 0.6.8, hyper 1.8, tokio 1.52.
   - Rendu par dioxus-ssr et dioxus-server ; hydratation via dioxus-web et interpreter-js.
4. **Server functions** : `#[server]` (dioxus-fullstack), transport HTTP ou websocket. Base de données : sqlx ou sea-orm.
5. **WASM** : wasm-bindgen 0.2.127, wasm-split (code splitting), `wasm-opt` via `dx bundle`.
6. **WebGPU web** : wgpu 30 avec le backend `webgpu`, dans un composant canvas isolé. Dioxus n'offre rien de prêt pour ça, c'est à construire.
7. **Styles et composants** :
   - CSS : Tailwind v4 (CLI standalone, sans Node) branché sur `asset!()` de manganis ;
   - primitives : dioxus-components (git, aucune release, le Base UI de Dioxus) ;
   - registre de composants façon shadcn : à créer, `aphrody-ui`.
8. **Interop JS** (React, Svelte, Vue, Solid) : à faire via des îlots web-components. Pas d'interop native.
9. **Outillage** : hot-patch avec subsecond, dioxus-devtools, tests avec dioxus-test (expérimental), Playwright pour l'e2e.
10. **Plateforme aphrody** (à construire, `aphrody-*`) :
    - builder de déploiements immuables (tâche CAS) ;
    - previews par PR, promotion, rollback ;
    - routeur edge sur axum + rustls (TLS/ACME via `instant-acme`) ;
    - ISR avec revalidation par tags ;
    - optimisation d'images à la volée (crate `image`) ;
    - KV et Blob, observabilité OpenTelemetry, feature flags, firewall.

**(b) Desktop natif**, dans l'ordre de priorité
1. **Blitz natif** (`dioxus` feature `native`, blitz 0.3.0-beta.4, stylo rev `2dca345`, html5ever 0.40.1, taffy 0.15, parley 0.13, anyrender 0.14 / vello 0.12, wgpu 30, `winit =0.31.0-beta.4`, accesskit 0.25).
   - Le même RSX que le web, en CSS réel, sans JS.
2. **GPUI** (gpui-kit 0.9.1, avec gpui-pre =0.3.12 ou la feature `gpui-fast` 0.1.14) : pour les apps de type éditeur ou trading, avec environ 60 composants de style shadcn.
   - Binaire séparé à cause du wgpu git.
3. **Tauri v3** (3.0.0-alpha.6) avec wry : pour réutiliser la stack TS, Tailwind et shadcn. Utiliser cef-rs 156 quand il faut un Blink uniforme.
4. **Electron 43.8.9** : uniquement pour la compatibilité Node. À éviter par défaut.

Pour l'ordre d'exécution : web fullstack (étapes 1 à 7), puis Blitz natif (même code), puis plateforme aphrody, puis GPUI pour la console ops, puis Tauri/CEF.

## 4. Réorganisation de C:\labs et définition d'aphrody

**Arborescence cible**
```
labs/
  Cargo.toml            # default-members = browser + aphrody ; caret ; patch winit/v8
  rust-toolchain.toml   # nightly-2026-11-12
  justfile              # délègue à `ay`
  browser/              # Chromium agent
    overlay/            # cible GN labs_agent (dérivée de //headless:headless_shell), patches .patch
    args/{dom,vision,webgpu}.gn
    orderfile/          # orderfile LLD façon Lightpanda, PGO agent
  crates/
    agent-core/         # snapshot AXTree avec refs @eN, actions vérifiées (sémantique agent-browser)
    agent-cdp/          # client CDP + BiDi, token, garde SSRF (philosophie Obscura)
    agent-mcp/          # serveur MCP, sorties markdown et structuredData
    agent-daemon/       # sessions, --engine {labs,lightpanda(process),obscura,servo}
    conformance/        # harnais obscura-benchmark + WPT, binaire séparé
    aphrody-ui/         # registre de style shadcn sur dioxus-components + Tailwind
    aphrody-server/     # axum, SSR, server functions, ISR
    aphrody-deploy/     # builds immuables, previews, rollback, ACME
    aphrody-edge/       # routeur, cache, images
    aphrody-data/       # KV, Blob, flags
    aphrody-desktop/    # Blitz natif ; aphrody-gpui/ dans un workspace exclu
    cli/                # binaire `aphrody`, sans dépendance de test
  vcs/lore/             # workspace séparé, crates lore-* déplacés ici
  third_party/chrome-channels.toml, vendor/, licenses/   # versionnés
```

**Ce qu'on garde, supprime, ajoute**
- **On garde** : conformance, chrome-channels.toml, `.cargo` (simplifié), licenses.
- **On supprime ou on déplace** :
  - les `lore-*` à la racine, à déplacer dans `vcs/lore` ;
  - `tools/lore` et `scripts/*.sh`, remplacés par `ay` ;
  - deno_core et v8 dans le workspace ;
  - l'option crt-static sur les cibles qui embarquent CEF.
- **On ajoute** : les crates dioxus, blitz, taffy, wgpu, gpui-kit sous `[workspace.dependencies]` derrière des features, plus un justfile et la CI.

**Forks à maintenir** (org `aphrody-labs` uniquement)
- chromium-overlay (patches, pas de fork complet) ;
- rusty_v8 sur V8 16.0.25 ;
- lore.
- On suit tout le reste en amont, sans fork. Pas de fork de leptos, yoga ni webrender.

**Politique de versions**
- Plages caret partout, Cargo.lock comme pin, et `cargo update` hebdomadaire en CI.
- `=` uniquement pour les couples liés : blitz/stylo/html5ever, gpui-pre, `winit =0.31.0-beta.4`.
- Chromium : oracle = Stable, embarquement = CEF, extraction = 160. Les pins sont lus depuis `chrome-channels.toml`.

**Plan d'exécution** (chaque étape a un critère de vérification)
1. Trancher Git canonique, corriger `ARCHITECTURE.md:11` et ENGINE-DECISION (lignes 59, 98, 125).
   - Vérification : `rg "Git is not used"` ne renvoie rien.
2. Restaurer la CI via `just ci` (fmt, clippy, test, `cargo deny`).
   - Vérification : CI verte.
3. Sortir Lore dans `vcs/lore` et ajouter `default-members`.
   - Vérification : `cargo tree | wc -l` baisse d'au moins 50 %.
4. Retirer `Cargo.toml:196-197`, passer `crates/cli/Cargo.toml:21` en dev-dependency, et dater le nightly.
5. Versionner `vendor/` et `licenses/`.
   - Vérification : un clone frais fait `cargo build` sans erreur.
6. Profils release (thin) et dist (fat), `x86-64-v3`, rust-lld.
   - Vérification : temps de build propre mesuré avant et après.
7. Créer `browser/overlay` avec la cible `labs_agent` et les 3 `args.gn`.
   - Vérification : RSS de pointe, démarrage à froid, pages/s et score obstacle-course comparés à chrome-headless-shell 157.
8. Crates agent-core, agent-cdp, agent-mcp et agent-daemon, plus `--engine lightpanda` en processus séparé.
   - Vérification : les commandes de la suite agent-browser passent.
9. Squelette aphrody : `aphrody-server` en dioxus 0.7.10 fullstack + Tailwind, puis `aphrody-ui`.
   - Vérification : SSR, hydratation et `#[server]` passent les tests e2e Playwright.
10. Cœur de la plateforme : deploy, edge, data (previews, rollback, ACME, ISR).
    - Vérification : déployer, promouvoir et faire un rollback d'une app de démo en self-hosted.
11. Desktop : Blitz natif d'abord, puis `aphrody-gpui` (workspace exclu), puis Tauri v3 / cef-rs 156.
    - Vérification : `cargo tree -d` montre un seul winit et un seul wgpu par binaire.
12. Dans `C:\src` : déplacer `next`, `react`, `ui`, `rt`, `rust-stack` et `aphrody-design-*` vers labs ; consolider les docs ; nettoyer l'org dans DEPS.
    - Vérification : `rg aphrody-dev C:\src\DEPS` ne renvoie rien.

Fichiers de référence :
- `C:\labs\Cargo.toml`
- `C:\labs\docs\ARCHITECTURE.md`
- `C:\labs\docs\ENGINE-DECISION.md`
- `C:\labs\rust-toolchain.toml`
- `C:\labs\crates\cli\Cargo.toml`
- `C:\labs\.cargo\config.toml`
- `C:\labs\third_party\chrome-channels.toml`
- `C:\src\Cargo.toml`
- `C:\src\DEPS`
- `C:\src\tools.toml`
## Annexe : jalons labs M0..Mn (fusionné depuis C:\labs\docs\ROADMAP.md, 2026-11-12)


Every milestone closes on conformance numbers measured at the pins in [CONFORMANCE.md](CONFORMANCE.md) and published on the dashboard. The thresholds below are the initial targets. They may be raised but are never lowered without a recorded reason. Suite numbers refer to the table in CONFORMANCE.md.

### M0: Skeleton and harness

Scope: root workspace, `crates/cli`, Lore absorbed (`crates/lore*`) and this repository hosted on a self-hosted Lore server, nightly toolchain, CI matrix on all targets (self-hosted, no git), `deny.toml` (license policy), `crates/conformance` able to fetch the pins and report JSON for every suite (reporting 0 is acceptable), dashboard skeleton.

Exit criteria:
- `cargo check --workspace` green on windows-msvc, linux-gnu, linux-musl, macos (aarch64, x86_64) and wasm32-unknown-unknown, plus an MSRV 1.97 job.
- `cargo deny check` green.
- All 11 suites appear on the dashboard with a frozen denominator.
- Suite 3 (Oxide) at 100 % against the upstream crate (it is upstream code, so this validates the harness).

### M1: Runtime

Scope: `js` (v8 backend), `runtime` (ESM and CJS, startup snapshot), `webapi`, `node` core modules, `bunapi` (`Bun.serve`, `Bun.file`, `Bun.spawn`), `aphrody run`.

Exit criteria:
- Suite 1 (Test262): gap to the d8 baseline at most 0.5 points on `built-ins` and `language`.
- Suite 2 (Bun tests): `js/web` at least 50 %, `js/node` at least 35 %, `js/bun` at least 25 %.
- `aphrody run` cold start for a hello-world script under 25 ms on linux-gnu x86_64 (release build, snapshot on).

### M2: Toolchain

Scope: `transpile`, `resolve`, `bundle`, `css`, `pm`, `test`, plus `aphrody install | build (library mode) | test`.

Exit criteria:
- Suite 2: `bundler` at least 60 %, `cli/install` at least 50 %, overall at least 50 %.
- Installs the dependency trees of the Next.js e2e fixture apps (suite 8 list) from `package-lock.json` and `pnpm-lock.yaml` with identical resolved versions.
- `aphrody test` runs its own workspace tests and the Tailwind test files from suite 4 (pass rate not gated yet).

### M3: Tailwind v4 engine

Scope: `tailwind-oxide`, `tailwind`, `aphrody tailwind`, CSS pipeline integration.

Exit criteria:
- Suite 3: 100 % (scanner as used in aphrody).
- Suite 4: at least 99 % of test cases, and every failure listed with a reason.
- Suite 5: `cli` and `postcss` at least 90 %, `vite` at least 75 %.

### M4: Framework and components

Scope: `next` (App Router route tree, layouts, metadata, middleware/proxy, server actions, caching), `rsc`, `registry`, `aphrody dev | add`, and the first-party Base UI-based component set.

Exit criteria:
- Suite 6: 100 % schema-valid, at least 95 % items byte-equal, at least 95 % `add` scenarios equal.
- Suite 7: at least 90 % (jsdom project).
- Suite 8: at least 60 % in `start` mode and at least 50 % in `dev` mode.

### M5: Build and deploy

Scope: `deploy` (Build Output API v3 writer, `aphrody serve`, Vercel provider, OCI provider), PPR, ISR.

Exit criteria:
- Suite 10: 100 % schema-valid and at least 95 % request-corpus equivalence.
- Suite 9: at least 80 % locally, and the weekly real-deploy job (Vercel and self-hosted) green for 4 consecutive weeks.
- Suite 8: at least 80 % `start`, at least 70 % `dev`.
- `aphrody build` of the same app twice produces byte-identical output.

### M6: Renderer

Scope: `renderer` (Blitz integration), `aphrody render` (screenshots, `next/og`), WPT reftest runner, optional `servo` feature.

Exit criteria:
- Suite 11: at least the Blitz baseline in every subset directory, and at least 70 % overall.
- Screenshot tests of every first-party component (light and dark) stable across linux-gnu, windows-msvc and macos with the `vello_cpu` backend.
- Release-candidate gate for 1.0: every earlier milestone's criteria still met at the current pins, and suite 2 overall at least 75 %.

### After M6 (not scheduled)

- DOM bindings from the engine into `renderer` (page JavaScript in the native renderer), and testharness.js tests in suite 11.
- HTTP/3 by default in `serve`.
- Additional deploy providers.

### Epic track (not scheduled)

- Lore as the native VCS of every Aphrody repository, served by a self-hosted Lore server.
- Self-hosted replacements for Epic online services and Unreal Engine features, built on the open-source Epic repositories (lore, zen, PixelStreamingInfrastructure, raddebugger) and the private Unreal Engine fork.
- Conformance suites for this track are defined when the first crate lands.

### Fabrique Chromium (piste prioritaire depuis 2026-11-12)

Les jalons M0–M6 ci-dessus datent de l'ancienne vision « runtime JS ». La vision actuelle de labs est un Chromium optimisé au maximum. Ses jalons sont F0–F6, avec des critères mesurés : voir [CHROMIUM-FACTORY.md](CHROMIUM-FACTORY.md#plan-révisé-après-revue-critique). Revue critique : [REVIEW-2026-11-12.md](REVIEW-2026-11-12.md).
