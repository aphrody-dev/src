# Décision moteur (2026-11-12)

**Statut** : le débat ci-dessous (8 agents, 13 appels d'outils) est argumentatif et non vérifié. **Font foi, dans l'ordre** : la section « Décision mesurée » (benchmark fr1), puis les amendements du propriétaire. Les amendements en fin de fichier font foi : V8 suit le Chromium de cef-rs (156), oracle de conformance = Chrome Stable (157), le checkout 160 sert uniquement à l'extraction. Les mentions contraires plus bas sont historiques.

Issue du débat Chromium / Servo / Bun (inventaire neutre, 3 avocats, réfutations, juge). Scores et chiffres non vérifiés exclus de la décision.

**Faits contestés vérifiés (2026-11-12)**
- V8 local : **16.0.25.0**, et non 15.9.85 (`C:\src\third_party\chromium\src\v8\include\v8-version.h` l.11-14). Commit `e4e354fb9e409c178a647af015b5fa330461081e` du 2026-11-11 = `v8_revision` (DEPS l.334). Chromium 160.0.8158.0 (`chrome/VERSION`). La réfutation Bun a raison.
- `LICENSE_FOR_ABOUT_CREDITS` : 967 lignes au total, dont 829 non vides. Les deux chiffres cités sont exacts.
- `denoland/deno_core` : `archived: true`. Le crate continue pourtant d'être publié depuis `denoland/deno` `libs/core` (labs l.195 `=0.413.0`). Il n'est donc pas abandonné, mais le dépôt historique est mort.
- rusty_v8 : dernière release v152.2.0, publiée le 2026-08-20 (V8 15.2). Il faut donc un saut de majeure vers 16.0.
- `deny.toml` (racine de src, ex-labs) l.6 : MPL-2.0 autorisée, aucune GPL ni LGPL (relu le 2026-11-13).
- Pins labs : `stylo =0.24.0`, `vello =0.12.0`, `vello_cpu =0.4.0`, `lto="fat"` l.287. Le vendor Blitz utilise d'autres versions (vello 0.11).
- Pas vérifiés : scores wpt.fyi, Servo et test262, tailles de binaire, temps de build. Je les écarte de la décision.

## 1. Verdict

Je retiens un hybride. Le binaire est un runtime serveur Rust sur V8 compilé depuis les sources à la `v8_revision` du checkout. Blink sert d'oracle hors binaire. Blitz est opt-in.

| Critère | Chromium embarqué | Blitz/stylo intégré | Runtime V8 façon Bun (+ oracle Chromium) |
|---|---|---|---|
| (a) Bout en bout | 5 (le web Google natif ; le reste à écrire de toute façon) | 2 (WPT non mesuré) | 4 (Workers, Vercel et RSC complets ; le web Google vérifié par l'oracle) |
| (b) Bas niveau, LTO, zero-copy | 3 (ThinLTO, GN maître) | 4 (fat LTO Rust, mais V8 reste un blob C++) | 5 (fat LTO, plus V8 sources avec linker-plugin-lto) |
| (c) Coût petite équipe | 1 | 3 | 4 |
| (d) Licences | 1 (LGPL Blink statique, contraire à deny.toml) | 4 (MPL par fichier) | 5 (BSD, MIT, Apache) |
| (e) Chiffres citables | 2 (rien de vérifié) | 1 | 2 (à mesurer en M1) |
| **Total /25** | **12** | **14** | **20** |

Pourquoi :
- Aucune des cibles Cloudflare, Vercel et Next.js n'a besoin d'un DOM dans le binaire. Les trois parties le concèdent.
- Pour le web Google, seul Blink atteint la référence. Or l'embarquer viole deny.toml et inverse le build (GN maître).
- On le sert donc comme oracle et comme outil `aphrody render` (`headless_shell` lancé comme processus séparé), jamais lié au binaire.
- Le vrai sujet est le V8 : on suit la révision du checkout, et on paie le port des bindings une fois par roll, de façon industrialisée.

## 2. Architecture refondue

**Couches (de bas en haut)**
1. **`aphrody-v8`** : fork `aphrody-labs/rusty_v8`.
   - Son sous-module `v8/` pointe sur `v8_revision` du DEPS de `C:\src`. `build/`, `buildtools/` et `third_party/*` sont alignés sur `v8/DEPS` à cette révision.
   - Build avec `V8_FROM_SOURCE=1`, et `GN`, `NINJA` pris dans `C:\src\third_party\depot_tools`. Le clang est celui de Chromium (`CLANG_BASE_PATH` = `third_party/llvm-build`), `SCCACHE` vient de `src.lock.json`.
   - Un `.lib` statique est produit et mis en cache par hash de révision via `RUSTY_V8_ARCHIVE`.
2. **`aphrody-core`** : fork `aphrody-labs/deno`, extrait de `libs/core` (+ `serde_v8`, `ops` macro).
   - Il porte l'event loop, les ops `#[op2(fast)]`, les modules ESM et le snapshot.
   - Reste ouvert : soit réduire `deno_core` au nécessaire, soit écrire notre propre couche mince. Il faut décider sur mesure (taille, nombre d'ops).
3. **`aphrody-io`** : tokio (IOCP / io_uring), hyper et rustls.
   - Les buffers sont des `bytes::Bytes` exposés en `ArrayBuffer` via `v8::ArrayBuffer::new_backing_store_from_bytes` (deleter Rust), donc zero-copy.
4. **APIs** :
   - `aphrody-web` : fetch, Streams, URL, Encoding, WebCrypto via aws-lc-rs ou ring, structuredClone.
   - `aphrody-workers` : modèle isolate par requête, `compatibility_date` et flags, KV/DO/Cache/R2 en local, `nodejs_compat`.
   - `aphrody-node` : polyfills repris de Deno `ext/node`, sous MIT.
5. **Outils** :
   - `aphrody-bundler` : oxc, rolldown, lightningcss et le port Tailwind v4.
   - `aphrody-vercel` : Build Output API v3 (`.vercel/output`, functions edge/node, prerender, ISR).
   - `aphrody-next` : RSC et Flight, middleware edge.
   - `aphrody-pm`, `aphrody-test`.
6. **`lore*`** : inchangé.
7. **`aphrody-render`** (feature `render`, désactivée par défaut) : blitz-dom/html/paint, stylo non modifié et `vello_cpu`, sans wgpu ni winit côté serveur. Les pins sont réalignés sur un fork commun.
8. **`crates/conformance`** :
   - test262 via `v8/tools/run-tests.py` sur notre V8 ;
   - WPT runtime (`fetch/`, `streams/`, `url/`, `encoding/`, `WebCryptoAPI/`) contre `aphrody` ;
   - WPT layout de `render` comparé à l'oracle Chromium 160 en CDP ;
   - tests workerd et `bun/test/js/workerd` (HTMLRewriter seulement, couverture limitée).

**Crates**
- Gardées : `cli`, `conformance`, `lore*`.
- Retirées du chemin par défaut : blitz, stylo, vello, wgpu, winit (passent sous `render`). Plus aucun pin `v8 =152.2.0` venant de crates.io.
- Ajoutées : `aphrody-v8`, `aphrody-core`, `aphrody-io`, `aphrody-web`, `aphrody-workers`, `aphrody-node`, `aphrody-bundler`, `aphrody-vercel`, `aphrody-next`, `aphrody-pm`, `aphrody-test`, `aphrody-render`.

**Politique de révision V8**
- La seule source de vérité est `C:\src\DEPS` `v8_revision`, qui suit le pin Chromium dans `src.lock.json`.
- Une recette `just v8-roll` :
  1. lit la révision ;
  2. met à jour le sous-module du fork ;
  3. synchronise les deps V8 ;
  4. build ;
  5. lance `cargo test -p aphrody-v8` ;
  6. lance test262.
- On roll quand Chromium bouge, au rythme des branches et non de HEAD brut.
- Un tag `aphrody-v8-<v8ver>` (aujourd'hui 16.0.25) est créé à chaque roll.
- Sémantique Workers : un écart de version avec workerd (15.8.62.5) est acceptable, car les flags de compat sont gérés par nous et non par V8.

**Build**
- Cargo est maître. GN et ninja ne servent qu'à l'intérieur du `build.rs` de `aphrody-v8`, avec depot_tools réutilisé tel quel. Aucun gclient ne touche labs.
- Release :
  - `lto="fat"`, `codegen-units=1`, `panic="abort"`, PGO (`cargo pgo` sur des workloads Next et Workers) ;
  - un LTO croisé optionnel : V8 compilé `-flto=thin` + `-Clinker-plugin-lto` avec le même LLVM que le rustc nightly. Le gain est à mesurer avant de l'adopter.
- AOT et démarrage :
  - startup snapshot contenant web, workers et node pré-initialisés (`JsRuntimeForSnapshot` dans `build.rs`) ;
  - code cache V8 par module bundle ;
  - pool d'isolates pré-chauffés.
- Zero-copy : fast API calls, `String::new_external_onebyte` pour les sources du snapshot, mmap des assets statiques, `sendfile`/`TransmitFile`.
- `cargo-deny` : la règle actuelle reste, et MPL n'est autorisée que dans le graphe `render` (`[graph] features` séparés).

**Exécution par cible**
- **Cloudflare** : `aphrody serve --workers wrangler.toml`. Un isolate par Worker, les bindings KV/DO sont simulés en local et compat_date est appliquée. Validé par les tests workerd portés.
- **Vercel** : `aphrody build --vercel` produit `.vercel/output` v3, puis `aphrody deploy` passe par l'API Vercel. Les functions edge tournent sur notre runtime, les functions node sur `aphrody-node`.
- **Next.js** : `next build` et `next start` exécutés par `aphrody` (compat Node). On remplace progressivement le bundler par rolldown, et RSC est streamé via Web Streams natives.
- **Web Google** :
  - le JS client est garanti par test262 sur la même V8 ;
  - le rendu est délégué à `headless_shell` (Chromium 160 local, `is_official_build=true`, cible séparée), piloté en CDP par `aphrody render` et `conformance` ;
  - Blitz sert au rendu natif et léger, avec un score WPT publié contre l'oracle.

**Forks aphrody-labs**
- `rusty_v8` (prioritaire) et `deno` (pour `libs/core` et `ext/node`).
- `blitz` + `stylo` + `taffy` + `parley`, uniquement pour `render`, publiés comme l'exige la MPL.
- `chromium` : le pin existe déjà via `C:\src\DEPS`, rien à forker dans labs.
- `workerd`, en lecture seule pour la référence de sémantique et de tests.

## 3. Premiers pas, dans l'ordre

1. Corriger les docs : V8 local = 16.0.25 (`v8-version.h`), `deno_core` archivé mais publié depuis `deno/libs/core`. Fichiers : `docs/ARCHITECTURE.md` et `docs/ROADMAP.md`. Vérification : grep « 15.9 » renvoie 0 résultat.
2. Mesurer la base : `cargo build --release` avec le prébuilt `v8 152.2.0`, `hyperfine 'aphrody -e ""'`, taille du binaire. Résultats consignés dans `docs/CONFORMANCE.md`.
3. Forker `denoland/rusty_v8` en `aphrody-labs/rusty_v8`, avec une branche `v8-16.0.25` dont le sous-module est `e4e354fb…`. Synchroniser les deps V8 (`gclient` avec le `.gclient` de V8, ou un script `tools/update_deps` du fork).
4. Build de `V8_FROM_SOURCE=1` avec `GN`, `NINJA` et `CLANG_BASE_PATH` pris dans `C:\src\third_party`, et `SCCACHE=sccache`. Corriger `src/binding.cc` jusqu'au vert. Critère : `cargo test` passe sur le fork, et la durée du build à froid comme celle de l'incrémental sont notées.
5. Patcher le workspace : `v8 = { git = "aphrody-labs/rusty_v8", rev = … }`, `deno_core` aligné. Vérifier `cargo tree -i v8` (une seule version) et `cargo deny check`.
6. Passer blitz, stylo, vello et wgpu sous la feature `render`. Vérifier que `cargo tree -e normal` sans features ne contient plus `stylo` et que deny reste vert.
7. Ajouter la recette `just v8-roll` : elle lit `C:\src\DEPS`, met à jour le sous-module, build, puis lance test262. Pour vérifier, la lancer deux fois de suite : la seconde ne fait rien, la révision étant déjà à jour.
8. Créer le snapshot et `aphrody-web` minimal (fetch, Streams, URL, Encoding). Faire tourner WPT runtime en CI et publier le score.
9. Écrire `aphrody-workers` (isolate par requête, compat_date), puis porter les tests workerd fetch et streams.
10. Écrire `aphrody-vercel` : Build Output v3 sur un exemple `vercel/examples`, puis un deploy de test.
11. Next.js App Router : `next start` sous `aphrody`, avec le diff visuel de l'oracle `headless_shell` en CDP.
12. Puis PGO, et le test du LTO croisé (`-Clinker-plugin-lto`) : on ne le garde que si le gain est d'au moins 5 % sur les benchs de l'étape 2.

## Amendements du propriétaire (2026-11-12)

**Chromium : rôles séparés**
- Le checkout `C:\src\third_party\chromium\src` (Chromium 160.0.8158.0, V8 16.0.25) sert uniquement de source à extraire : `third_party/*`, LLVM/clang, documentation, ressources UI. Il n'est ni embarqué ni ciblé, car 160 est incompatible avec les embeddings ci-dessous.
- Cibles d'embedding (VPS et desktop), toujours sur la dernière version publiée :
  - CEF via `tauri-apps/cef-rs` 156.4.0+156.0.26 (Chromium 156) ;
  - Tauri v3 (`tauri-v3.0.0-alpha.6`) ;
  - Electron 43.8.9 (Chromium 150.0.7871.250).
- La politique de révision V8 change : `aphrody-v8` suit le V8 du Chromium de cef-rs (la cible d'embedding la plus récente), et non la HEAD du checkout. Le JS côté serveur garde ainsi la même sémantique que le navigateur livré. `just v8-roll` lit la version Chromium dans `cef-rs`.

**Priorités produit dès la création**
- WebAssembly et WebGPU sont des cibles de premier rang : le runtime expose WASM (SIMD, threads, GC, exceptions, memory64, JSPI) et WebGPU via `wgpu` (et Dawn comme référence). Le pipeline build produit du WASM optimisé (`wasm-opt`/binaryen, `wasm-bindgen`).
- Front supporté de bout en bout : TypeScript (tsc et `typescript-go`), Tailwind v4, shadcn, Base UI, React, Svelte, Solid, Vue, vanilla JS, Electron, Microsoft Fluent UI/FAST, et les APIs Bun (HTML/CSS bundler, React).
- Équivalents Rust suivis et forkés : GPUI (Zed), gpui-component, Tauri v3, Taffy, Leptos, Axum, Blitz, wasmtime.

## Décision mesurée (benchmark fr1, 2026-11-12) — fait foi

Source : [bench/REPORT.md](bench/REPORT.md), 15 moteurs, 12 sites réels, app Next.js 16 (RSC, streaming, server action, next/image), Turnstile test keys, 45 features.
- **Oracle de rendu** : chrome-headless-shell Stable (157), Canary (160) en alerte avancée. Seul sans faute, Lighthouse OK, ~140 ms à froid, ~620 Mo.
- **Second oracle** : Firefox Nightly via BiDi ; WebKit (Playwright) pour le point de vue JSC.
- **Agent léger** : Lightpanda (12/12 sites, 72 Mo, 44 ms à froid ; pas de layout/paint/iframes/Turnstile).
- **Agent complet** : chs-stable piloté en CDP direct ; `labs_agent` (usine fr1) en est la version réduite.
- **Embarqué VPS** : Electron 43 (581 Mo, meilleur LCP) ; CEF 156 exige Xvfb et ne crée pas de pages CDP.
- **Écartés pour l'instant** : Servo (6/12 sites, WebDriver seul), Obscura (navigation client cassée), Brave/Helium (RAM, instabilité).
- **Serveur JS** : Node 24 référence, Bun en option (résultats client identiques).
