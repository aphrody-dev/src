# Architecture de src

Document de référence unique. Remplace `docs/ROOT-ARCHITECTURE.md` et `docs/CORE.md` (fusionnés ici, 2026-11-12). Les principes et leurs sources sont dans [PHILOSOPHY.md](PHILOSOPHY.md). L'architecture interne de l'IA reste dans `packages/ai-os/docs/ARCHITECTURE.md` (paquet `@aphrody/ai-os`, fusionné à plat depuis aphrody-labs/agent le 2026-11-13) et se range entièrement en L4/L5 ci-dessous.

## 1. Modèle en couches

Inspiré de NT (HAL sous l'Executive, sous les sous-systèmes) et des components Chromium (base en bas, embedders en haut).

| Couche | Rôle (analogue) | Contenu actuel |
|---|---|---|
| L0 toolchain | compilateurs, pins (LLVM partagé, rustc nightly, bun 1.4.4) | `rust-toolchain.toml`, `tools/`, `third_party/` (hors graphe first-party) |
| L1 base | `//base` : primitives portables, sans `cfg(target_os)` ni windows-rs, sans service | `crates/core`, `depot-core`, `depot-cas`, `lore-base`, `lore-io`, `lore-error-set(-macro)`, `lore-macro`, `aphrody-design-shared`, `aphrody-design-tokens`, `gamescope-core`, `tv-core`, `tv-i18n` |
| L2 plateforme | HAL : Windows, Linux, Cloudflare, Vercel, réseau, C ABI de base | `sys`, `net`, `core-capi`, `dx12-hal` (D3D12, DirectComposition, C ABI `dx12_hal_*`), `unix-*`, `remote`, `lore-credential`, `lore-fuse`, `steam-depot`, `gamescope-wgsl`, `smithay-wayland-wire`, `hypr-tiler`, `cosmic-compat`, `tv-ffmpeg` (FFmpeg libav* en liaison dynamique) ; `packages/core` (bun:ffi sur core-capi), `ffi-bridge` (bun:ffi sur dx12-hal), `net`, `machine`, `runtime-adapter` ; `infra/*` |
| L3 services | Executive : VCS, build, design, web | `crates/*` par défaut : `lore*` (stockage, révision, transport, serveur, backends aws/hashicorp), `depot-*` (gclient, cipd, vpython, re, graph...), `xtask`, `up`, `rt`, `archguard`, `corelib`, `factory`, `conformance`, `bench`, `next`, `react`, `ui`, design ; C ABI de services `ffi`, `lore-capi` ; `packages/*` par défaut |
| L4 agent | sous-système agent | `packages/ai-os` (core, llm, relay, research, gateway, tui ; ses sous-dossiers sont des sous-couches), `crates/agent-context`, `crates/agent-py`, `crates/ring3-agent`, `plugins/` |
| L5 surfaces | embedders (`//chrome`) | CLIs : `ay` (dont `ay conformance`, ex-`aphrody-cli`), `depot-cli`, `lore-client`, `gamescope-cli`, `wslg-cli`, `tv-cli` ; `ai-os` (CLI `src/cli.ts`, gateway, tui) ; `apps/*` (dont `apps/nt`) |

La liste exacte vient de `just checkdeps --graph` ; ce tableau est un résumé.

## 2. Directions autorisées (appliquées)

- Vers le bas : toujours permis.
- Latéral (même couche) : permis, cycles interdits.
- Vers le haut : interdit. Seul `!chemin` (dette ticketée, avertissement) le tolère ; `+chemin` ne sert qu'à relever un `-` plus large et ne franchit jamais une couche vers le haut.
- `-chemin` interdit une arête même descendante.
- Unité sans couche : erreur.
- Les cycles sont cherchés sur tout le graphe (toutes couches) ; un cycle n'est rétrogradé en avertissement que si l'une de ses arêtes porte un `!`.
- Les `[dev-dependencies]` (tests, benches) sont exemptées ; `[dependencies]` et `[build-dependencies]` comptent.

Placement des C ABI : une C ABI de base va en L2 (frontière plateforme : `core-capi`, et `packages/core` qui la charge) ; une C ABI de service reste dans la couche du service exposé (`ffi`, `lore-capi` en L3), donc utilisable par L4. L5 est réservé aux binaires et surfaces finales.

Arêtes invisibles dans les manifestes (bun:ffi `dlopen`, pyo3) : déclarées par `use chemin` dans le `DEPS.rules` du consommateur (`packages/core` : `use crates/core-capi`) ; elles entrent dans les couches, les cycles et `just affected`.

Mise en application :
- `DEPS.rules` par répertoire (`layer = N`, `+`, `!`, `-`, `use`), hérité vers le bas ; format maison adapté de `buildtools/checkdeps` de Chromium (préfixes et héritage repris, `layer` et `use` ajoutés). Les lignes `sous/dossier: directive` d'un parent couvrent les sous-modules où src n'écrit pas (`agent/`, `apps/*` ; règles dans `/DEPS.rules`).
- Arêtes lues dans les manifestes : dépendances `path` / `workspace = true` de Cargo, `@aphrody/*` / `workspace:` / `file:` de package.json.
- Gate : `bun scripts/checkdeps.ts` (`just checkdeps`, étape CI « Layered dependency gate », inclus dans `just check`). Archguard ARCH-017 garde les frontières de domaine (voir checkdeps-002).
- Propriété : `MAINTAINERS` (format kernel, M: = agent ou skill propriétaire), `just maintainer <chemin>`.

## 3. Graphe de tâches

Choix : `just` + bun workspaces + cargo, sans turbo (raisons : PHILOSOPHY.md §6).

- `just affected [ref]` : unités modifiées depuis `ref` plus dépendants transitifs (équivalent de `turbo --filter=...[ref]`).
- `just test-affected [ref]` : `cargo test -p` sur les crates touchées, `bun test` sur les packages touchés, `uv run pytest` sur les unités Python touchées. Les `apps/*` gardent leurs propres gates (`apps/nt` : .NET 11 / C++23 dans `.github/workflows/nt.yml`, déclenché par ses chemins) ; test-affected ne les relance pas.
- `just check` : `bun fmt --check`, `cargo fmt --check`, `bun check -b` (typecheck TS), checkdeps, archguard. La compilation (`cargo check`/`cargo test`) tourne en CI sur runner, pas sur le poste (règle : pas de build local).
- Cache : sccache local pour cargo. Cache distant R2 : taskgraph-001.

## 4. Racine du dépôt

```
Cargo.toml Cargo.lock   un seul workspace ; [workspace.dependencies] = une version par crate
package.json bun.lock   workspaces bun
rust-toolchain.toml     nightly épinglée ; tools.toml : pins des binaires L0 (`ay up`)
deny.toml               politique cargo-deny (licences, bans, sources ; §11)
identity.toml           identité du produit, source unique (§6) ; marque aussi la racine
src.lock.json           seul pin des dépôts externes ; DEPS et .gitmodules en sont dérivés (pin-001)
DEPS .gitmodules        dérivés (`ay manifests`, gate `ay manifests --check`), jamais édités à la main
DEPS.rules              racine des règles de couches (checkdeps)
dist-workspace.toml     configuration cargo-dist (lue à la racine du workspace par dist)
justfile                point d'entrée unique
MAINTAINERS             propriétaires par sous-système (format kernel, édité à la main)
README.md AGENTS.md CLAUDE.md GEMINI.md LICENSE-* .env.example .gitignore .gitattributes .graphifyignore
.github/ .cargo/ .agents/ .claude/
crates/ packages/ apps/ third_party/ infra/ tools/ docs/ scripts/ conformance/ licenses/ plugins/
```

Rangés le 2026-11-13 : `deploy.toml` -> `infra/deploy.toml` (flotte, hébergement, auth) ; `cloudbuild.yaml` -> `infra/gcloud/` ; `.gitlab-ci.yml` -> `infra/gitlab/gitlab-ci.yml` (chemin à déclarer côté GitLab, infra/gitlab/README.md) ; `flake.nix` -> `infra/nix/` ; `install.ps1`/`install.sh` -> `scripts/` (amorce de dix lignes vers `ay up --bootstrap`) ; `deploy.ps1`/`deploy.sh` supprimés (doublons de `just deploy` = `ay deploy`) ; `.repo/` supprimé (manifeste `repo` jamais consommé). Dockerfile, compose.yaml et .dockerignore -> `infra/docker/` (Dockerfile.dockerignore, docker-bake.hcl ; agent conteneurs). Locaux et ignorés, jamais suivis : `.env`, `var/`, `graphify-out/`, `target/`, `node_modules/`. CI de référence : `.github/workflows` ; GitLab et Cloud Build sont des miroirs optionnels.

`apps/` et `third_party/` sont exclus du workspace Cargo (`[workspace] exclude`). `apps/` = produits déployables, sous-modules épinglés par DEPS (rosegriffon, shenron, r2b, auto) ou arbres fusionnés (`apps/nt`, ex-`aphrody-labs/nt`, CI `.github/workflows/nt.yml`), avec leurs propres gates : checkdeps n'inspecte que leur unité racine, pas leur intérieur. `third_party/` = upstream, une copie par projet, verrouillée dans `src.lock.json`, sans patch local : un correctif vit dans un fork `aphrody-labs` épinglé par commit (§11).

## 5. Bibliothèque commune (core)

| Pilier | Où | Rôle |
|---|---|---|
| tree-sitter | `crates/core` (`aphrody-core`, L1) | parse multi-langage, symboles/appels/imports, requêtes, index, BLAKE3 |
| LLVM | `crates/core-capi` (cdylib, L2) | C ABI `core_*`, construite en release avec rustc + clang sur le LLVM partagé ; la LTO inter-langages s'arrête à la cdylib (Rust + C de tree-sitter), jamais à travers bun:ffi |
| bun:ffi | `packages/core` (`@aphrody/core`, L2) | `dlopen` typé, `CString` + `core_free`, `JSCallback`, store `bun:sqlite` |

C ABI (`core_abi_version() == 1`) : `core_free`, `core_languages`, `core_parse_json`, `core_query_json`, `core_blake3_hex`, `core_index_json`, `core_index_each`. Sorties JSON, erreurs `{"error": ...}`. En-tête : `cbindgen --config crates/core-capi/cbindgen.toml crates/core-capi -o crates/core-capi/include/aphrody_core.h`. On ajoute des symboles sans en casser ; un changement incompatible incrémente `core_abi_version`. `@aphrody/core` ouvre la bibliothèque en deux temps : résoudre `core_abi_version` seul, refuser si la version diffère, puis seulement lier le reste de la table (TICKET abi-001 si ce n'est pas encore le cas).

Ce que `crates/core` n'est pas : `crates/corelib` (`aphrody-corelib`, L3 depuis le 2026-11-13 : il tire wgpu et sert des produits, donc ni L1 ni L2) n'est pas une seconde bibliothèque commune mais le support des produits shenron/rosegriffon (GPU wgpu, formats RE CRI/UTF/AOB, horloge d'émulation, formats Epic, format Boq, filtrage réseau). Ses parties génériques sont des enveloppes de bibliothèques amont : le filtrage réseau passe par `adblock` (Brave adblock-rust 0.13.5, MPL-2.0) depuis le 2026-11-13, le moteur maison est supprimé. Aucune fonction n'existe dans les deux crates ; `crates/ffi` (C ABI de services, L3) expose `corelib::web`.

Distribution : `dlopen` ne charge pas une bibliothèque depuis la mémoire d'un exécutable `bun build --compile` ; la cdylib est donc livrée à côté du binaire ou extraite vers un cache disque vérifié par BLAKE3 (pas de `/tmp` noexec). Le binaire `ay` (Rust) lie `crates/core` statiquement et n'a pas ce problème.

Grammaires : 13 avec extracteur dédié ; les autres découvertes par `crates/core/build.rs` (`third_party/ECOSYSTEM.toml` ou `third_party/tree-sitter-*`, symboles `aphrody_grammar_<nom>*`). `APHRODY_GRAMMARS=0` désactive. Index : `bun packages/core/src/cli.ts index [root]` vers `var/index/core.db` (cible : `XDG_CACHE_HOME` / `%LOCALAPPDATA%`, var/ devant quitter la racine). Les préfixes `aphrody_*`/`APHRODY_*` des symboles C et variables sont des noms figés hors `just identity apply` : TICKET identity-001 (les neutraliser en `core_*`/`SRC_*`).

## 6. Identité renommable et multiplateforme

- Une source : `identity.toml` (product, cli, naming : scope npm et préfixes, orgs, domains, products.*). `just identity apply` (`bun scripts/identity.ts apply`) réécrit les champs copiés (Cargo.toml `[workspace.package]`, nom et `[[bin]]` de crates/ay, `package.json#name` et clés `@scope/` des dépendances) ; `just identity check` garde `just check` et la CI. Lecteurs directs : crates/xtask (vars DEPS), packages/forge (valeurs par défaut des forges), tout paquet via `import identity from "<racine>/identity.toml"`. Les configurations d'hôte (nginx, mail, DNS) restent littérales : elles décrivent l'état déployé.
- Aucun nom de produit ni chemin absolu en dur : `env!("CARGO_PKG_NAME")`, racine détectée par `identity.toml` (ARCHITECTURE-ROOT.md invariant 6) ou `SRC_ROOT`, `XDG_*`, `%LOCALAPPDATA%`.
- Chaque binaire compile et teste sur windows-msvc et linux-gnu ; scripts .sh/.ps1 remplacés par des recettes just. Exceptions par nature, en `cfg(windows)` : `dx12-hal` (D3D12, DirectComposition ; vide sur Linux) et l'hôte `wslg-cli` (DispatcherQueue WinUI 3 dans `wslg_cli::host` ; sur Linux, les binaires sortent en erreur). `smithay-wayland-wire` et `cosmic-compat` compilent et testent sur Linux ; seuls le transport Hyper-V et le mappage D3D12 des dmabufs sont `cfg(windows)`. dx12-001 soldé le 2026-11-13.

## 7. Règles de fusion (sans régression)

1. Geler : snapshot Lore + commit ; compter les tests des deux côtés.
2. Workspace unique, une version par dépendance.
3. Déplacer crate par crate, test après chaque déplacement, `just checkdeps` vert à chaque commit.
4. Vendor et lockfiles uniques.
5. Mêmes nombres de tests ou plus.

## 8. Dette connue (tickets)

| Ticket | Constat | Correction |
|---|---|---|
| checkdeps-001 | soldé le 2026-11-13 : l'entrée CLI est `packages/ai-os/src/cli.ts`, hors de `src/core` ; ai-os est une seule unité L4 | — |
| checkdeps-002 | ARCH-017 d'archguard double checkdeps pour les couches mais porte aussi les frontières de domaine | traduire ces frontières en règles `-` (ex. L3 services système sans `dx12-hal`/`steam-depot`, agent sans `next`/`react`) avant de retirer ARCH-017 et d'appeler checkdeps depuis `ay arch check` |
| checkdeps-003 | `apps/rosegriffon` : cycle `rg-db` <-> `rg-types`, vu par un passage manuel de checkdeps à profondeur 3 (hors gate src) | à corriger dans le dépôt rosegriffon, par son propre gate |
| checkdeps-004 | soldé le 2026-11-13 : chaque `pyproject.toml` à `[project]` est une unité `uv` (arêtes `[tool.uv.sources]`) ; `just test-affected` lance `uv run pytest` sur les unités touchées. `apps/nt` n'a aucune arête de build vers `crates/*` ou `infra/*` (aucune référence dans ses .csproj, CMake ou TS), rien à déclarer | — |
| nt-001 | soldé le 2026-11-13 : la DLL GPU partagée est la crate L2 `crates/dx12-hal` (cdylib `dx12_hal.dll`, C ABI `dx12_hal_*` en Rust sur windows-rs, à la place de `native_nt_gpu` en C++) ; sa liaison bun:ffi `packages/ffi-bridge/src/dx12-hal.ts` (paquet L2, `use crates/dx12-hal`) sert `unix-distro.ts` (hors produit, reste dans le paquet) et `apps/nt` (`/api/gpu` de `sdk/tools/host/server.ts`, dépendance `file:` vue par checkdeps) ; `infra/winnt-sdk` supprimé (l'hôte .NET cède la place à la coque WinUI 3 de `apps/nt`, la DispatcherQueue à `wslg_cli::host`) ; `infra/ffi-bridge` devenu `packages/ffi-bridge` (ARCH-006 n'admet plus que `infra/mesh-vn`) | — |
| dx12-001 | soldé le 2026-11-13 : `crates/dx12-winui-core` scindé ; `crates/dx12-hal` (L2, `cfg(windows)`, vide sur Linux) garde D3D12, fences, textures partagées par handle NT, DirectComposition et une C ABI `dx12_hal_*` (cdylib `dx12_hal.dll`, JSON, `dx12_hal_abi_version() == 1`) ; la DispatcherQueue WinUI 3 part dans l'hôte `wslg-cli` (L5, `wslg_cli::host`) | — |
| pin-001 | soldé le 2026-11-13 : `src.lock.json` est le seul pin des dépôts ; `ay manifests` en dérive DEPS et .gitmodules, `ay manifests --check` signale toute dérive (fichier ou gitlink différent du verrou) ; `.repo/` et la génération de MAINTAINERS retirés ; les crates restent épinglées par Cargo.lock (vendored-sources = copie hors ligne de Cargo.lock, pas un second pin) | dérive restante signalée par le gate : `apps/rosegriffon` (gitlink ff692b5 vs verrou f5d61f9) à résoudre par `ay lock` côté propriétaire du produit |
| toolchain-001 | cranelift (dev) incompatible avec la LTO LLVM et limité sur windows-msvc | cranelift seulement en dev hors cdylib ; trancher clang-cl vs cl.exe (conflit ouvert) |
| taskgraph-001 | cache distant R2 pour sccache non configuré | backend S3 de sccache vers R2 sur les runners, après lecture de la doc sccache |

## Annexe A : architecture produit web (labs v0, ex-ROOT-ARCHITECTURE.md)

Chemins d'origine : `crates/cli` de labs est devenu `ay conformance` (crates/conformance) ; `vendor/` est devenu des forks `aphrody-labs` épinglés par commit (§11).



Status: v0 architecture. Implemented: conformance harness skeleton, Lore absorbed. Versions read from crates.io on 2026-11-12.

### 1. Scope

Aphrody Labs (`aphrody-labs/labs`, private) is the lab of Aphrody, as Vercel Labs is to Vercel (`aphrody-dev` is the main org). Goal: a self-hosted replacement for Vercel, Vercel Labs, Epic Games and Unreal Engine, built on their open-source projects, with every paid or hosted-only feature replaced by a self-hosted one.

- Shell (Windows, Claude Code): see [docs/shell/INDEX.md](shell/INDEX.md).
- Compatibility target on the web side: `vercel/vercel` (CLI, builders, Build Output API v3) and Next.js. Our stack on top: Tailwind v4 engine, shadcn registry, Base UI components, Blitz/vello renderer.
- Compatibility target on the web side: `vercel/vercel` (CLI, builders, Build Output API v3) and Next.js.
- Version control: Lore (`EpicGames/lore`, MIT), vendored from the fork `aphrody-labs/lore` into `third_party/lore`. Git is not used.
- Product focus from day one: WebAssembly and WebGPU first-class (wgpu, wasmtime, binaryen), the whole modern front stack (TypeScript, Tailwind, shadcn, Base UI, React, Svelte, Solid, Vue, vanilla, Electron, Fluent UI) and its Rust equivalents (GPUI, gpui-component, Tauri v3, Taffy, Leptos, Axum). Embedding targets: CEF (cef-rs, Chromium 156), Tauri v3, Electron 43 (Chromium 150); the Chromium 160 checkout is only a source for third_party, LLVM, docs and UI. See ENGINE-DECISION.md.
- Epic side: Unreal Engine through the private fork `aphrody-labs/UnrealEngine` (EULA: private, licensees only, never in a public repository). Followed upstreams: lore and its SDKs, zen, PixelStreamingInfrastructure, raddebugger, UnrealEngine.

Decisions:
- JS engine: V8 built from source at the `v8_revision` of the Chromium checkout in `C:src` (today V8 16.0.25, commit `e4e354fb`), through the fork `aphrody-labs/rusty_v8`; `deno_core` from the fork `aphrody-labs/deno` (`libs/core`; `denoland/deno_core` is archived). No WebKit/JavaScriptCore. Fallbacks: `boa_engine`, then `rquickjs`. See [ENGINE-DECISION.md](ENGINE-DECISION.md).
- Renderer: Blitz (stylo + taffy + parley + vello) behind the `render` feature, off by default. Chromium `headless_shell` (local checkout) is the out-of-process oracle for layout and the Google web platform, never linked into the binary (Blink is LGPL).
- Toolchain: oxc + rolldown + lightningcss. swc is not used.
- Tailwind: port `packages/tailwindcss` to Rust, use the MIT Oxide scanner, and diff the output against upstream snapshots.
- Components: shadcn registry schema and Base UI.
- Lore is absorbed as workspace members (`crates/lore*`), its patched crates live in `vendor/`. `scripts/absorb-lore.sh` re-syncs from `aphrody-labs/lore`.
- Upstream-first: nightly toolchain, dependencies tracked at their latest upstream release.
- Bun is studied only (license NOASSERTION: MIT plus statically linked LGPL-2 JavaScriptCore). Ideas may be ported; code may not.
- MPL-2.0 crates are used without modification.

### 2. Layers

```
+--------------------------------------------------------------------------------------+
|                               aphrody (single binary, crates/cli)                     |
|  dev | build | serve | deploy | test | install | add | render | run | x (conformance)|
+--------------------------------------------------------------------------------------+
| L6 Product      | next (App Router)  | registry (shadcn schema) | deploy (BOA v3,    |
|                 | rsc (Flight)       | components (Base UI)     |  adapters, OCI)    |
+-----------------+--------------------+--------------------------+--------------------+
| L5 CSS          | tailwind (engine port)  <- tailwind-oxide (scanner)   | css (lightningcss)|
+-----------------+-------------------------------------------------------+------------+
| L4 Toolchain    | transpile (oxc) | bundle (rolldown) | resolve (oxc_resolver) |       |
|                 | pm (install, lockfile, registry client) | test (runner, expect) |       |
+-----------------+--------------------------------------------------------------------+
| L3 Runtime      | runtime (deno_core host, module loader, snapshot)                  |
|                 | node (node:* builtins) | webapi (fetch, streams, URL)   | bunapi |
+-----------------+--------------------------------------------------------------------+
| L2 Engine       | js (trait)  ->  v8 (native)  |  boa (wasm32, fallback)  | quickjs     |
+-----------------+--------------------------------------------------------------------+
| L1 Platform     | io (tokio, fs, process, watch) | net (hyper, axum, rustls, quinn/h3) |
|                 | renderer (blitz-dom/html/paint, stylo, taffy, parley, vello, wgpu) |
+--------------------------------------------------------------------------------------+
| L0 Base         | base (errors, paths, interned strings, hashing, tracing setup)     |
+--------------------------------------------------------------------------------------+
| Lore (VCS)      | crates/lore* (absorbed from aphrody-labs/lore), vendor/ patches    |
+--------------------------------------------------------------------------------------+
```

Rules:
- A layer depends only on the layers below it. `cli` is the only crate that depends on everything.
- L1 to L5 hold no framework-specific knowledge. Next.js semantics live only in `next` and `rsc`.
- `renderer` is independent of the JS engine at v0. It renders HTML and CSS that the server produced.

### 3. Crate map

One root workspace (`Cargo.toml`, `resolver = "3"`, `edition = "2024"`). Members are flat at `crates/<dir>`. Package names are `aphrody-<dir>`, except the binary, which is `aphrody`. The owner already publishes about 190 older `aphrody-*` crates; directory names were chosen so that no new package reuses one of them (`renderer`, `js` and `webapi` instead of the taken `aphrody-render`, `aphrody-engine` and `aphrody-web`). Check each new name on crates.io before adding a crate. Every external version is pinned once in `[workspace.dependencies]`, and members use `dep.workspace = true`.

| Dir | Package | Layer | Responsibility | Key deps | Bun subsystem studied (lines, from targets survey) |
|---|---|---|---|---|---|
| `cli` | `aphrody` | top | argument parsing, command dispatch | clap | `runtime` cli parts |
| `base` | `aphrody-base` | L0 | error types, path utils, string interning, tracing init | tracing | `bun_core` 33150, `paths` 7258 |
| `io` | `aphrody-io` | L1 | async fs, process spawn, file watching, shell | tokio, notify, ignore | `io` 11797, `spawn` 4696, `watcher` 2568, `shell_parser` 5873 |
| `net` | `aphrody-net` | L1 | HTTP/1.1, HTTP/2, HTTP/3 server and client, TLS, WebSocket | hyper, hyper-util, axum, tower, rustls, reqwest, quinn, h3 | `http` 18740, `uws` 1701 |
| `renderer` | `aphrody-renderer` | L1 | headless and windowed HTML/CSS rendering, screenshots, WPT reftests | blitz-dom, blitz-html, blitz-paint, anyrender, stylo, taffy, parley, vello, vello_cpu, wgpu, winit | none (Bun has no renderer) |
| `js` | `aphrody-js` | L2 | `Engine` trait: realms, modules, microtasks, host ops; backends `v8`, `boa`, `quickjs` (features) | v8, boa_engine, rquickjs | `jsc` 55638 (C++ heavy) |
| `runtime` | `aphrody-runtime` | L3 | deno_core JsRuntime host, ESM and CJS loader, startup snapshot, event loop, permissions | deno_core | `runtime` 363594, `event_loop` 2619 |
| `webapi` | `aphrody-webapi` | L3 | fetch, Request/Response, streams, URL, TextEncoder, WebCrypto, timers, WebSocket | net, runtime | `http_jsc` 6417 |
| `node` | `aphrody-node` | L3 | `node:*` builtins (fs, path, buffer, stream, http, crypto, child_process, worker_threads, async_hooks) | io, net, runtime | `node_path` 3059 |
| `bunapi` | `aphrody-bunapi` | L3 | Bun-compatible globals (`Bun.serve`, `Bun.file`, `Bun.spawn`, `bun:test` surface) for the Bun suite | runtime, net, io | `runtime` (API surface) |
| `transpile` | `aphrody-transpile` | L4 | parse, transform (TS, JSX, decorators, React Refresh), codegen, minify, source maps | oxc | `js_parser` 51577, `js_printer` 9641, `sourcemap` 4712 |
| `resolve` | `aphrody-resolve` | L4 | Node/ESM resolution, `exports`/`imports`, tsconfig paths, conditions | oxc_resolver | `resolver` 19793 |
| `bundle` | `aphrody-bundle` | L4 | graph build, code splitting, server/client/edge environments, HMR graph | rolldown, transpile, resolve, css | `bundler` 61628 |
| `pm` | `aphrody-pm` | L4 | npm registry client, semver, lockfile (reads `bun.lock`, `package-lock.json`, `pnpm-lock.yaml`), tarball cache, linker | net, io, sha2, zstd | `install` 106179, `semver` 4211, `tar` 4721 |
| `test` | `aphrody-test` | L4 | test runner, `expect`, snapshots, mocks, Jest/Vitest/bun:test surface | runtime | `runtime` test runner parts |
| `css` | `aphrody-css` | L5 | CSS parse, transform, minify, CSS modules, bundling | lightningcss | `css` 61193 |
| `tailwind-oxide` | `aphrody-tailwind-oxide` | L5 | candidate scanner (upstream `crates/oxide`, MIT, upstream code with notice kept) | ignore | none |
| `tailwind` | `aphrody-tailwind` | L5 | Tailwind v4 compiler (section 7) | css, tailwind-oxide | none |
| `rsc` | `aphrody-rsc` | L6 | Flight wire format, client/server reference manifests, server action ids | bundle | none |
| `next` | `aphrody-next` | L6 | App Router: route tree, layouts, metadata, caching, middleware/proxy, server actions, image and font | rsc, bundle, runtime, net | `router` 1772 |
| `registry` | `aphrody-registry` | L6 | shadcn-schema registry client and server, `components.json`, `add` | net, serde_json | none |
| `deploy` | `aphrody-deploy` | L6 | Build Output API v3 writer, `serve` for it, OCI image, provider adapters | bundle, net | `standalone_graph` 7889 (single-file exe idea) |
| `conformance` | `aphrody-conformance` | tool | fetch pinned upstreams, run the 11 suites, emit JSON results | io, net | none |

Bun line counts give a rough idea of scope. They are not a design input: Bun's crates mirror a Zig-to-Rust port, and this codebase does not follow its structure.

### 4. Pinned v0 dependency set

All versions are pinned exactly (`=x.y.z`) in the root `Cargo.toml`. License and MSRV come from crates.io version metadata.

| Crate | Version | License | rust-version | Role |
|---|---|---|---|---|
| deno_core | 0.413.0 | MIT | n/a | JS runtime host (ops, module loader, snapshots) |
| v8 | 152.2.0 | MIT (bindings; V8 is BSD-3-Clause, ICU is Unicode-3.0) | n/a | V8 engine |
| boa_engine | 0.22.0 | Unlicense OR MIT | 1.91.0 | pure-Rust engine for wasm32 and fallback |
| rquickjs | 0.14.0 | MIT (QuickJS: MIT) | 1.87 | small-footprint fallback |
| oxc | 0.158.0 | MIT | **1.97.0** | parser, transformer, codegen, minifier |
| oxc_resolver | 11.24.3 | MIT | 1.95.0 | module resolution |
| rolldown | 1.3.2 | MIT | n/a | bundler core |
| lightningcss | 1.0.0-alpha.72 | MPL-2.0 | n/a | CSS engine (unmodified) |
| blitz-dom | 0.2.4 | MIT OR Apache-2.0 | 1.86.0 | DOM and style integration |
| blitz-html | 0.2.0 | MIT OR Apache-2.0 | 1.86.0 | HTML to DOM |
| blitz-paint | 0.2.1 | MIT OR Apache-2.0 | 1.86.0 | painting |
| anyrender | 0.14.0 | MIT OR Apache-2.0 | n/a | render backend abstraction |
| stylo | 0.24.0 | MPL-2.0 | n/a | CSS cascade and computed style (unmodified) |
| selectors | 0.43.0 | MPL-2.0 | n/a | selector matching (unmodified) |
| cssparser | 0.38.0 | MPL-2.0 | 1.85 | CSS tokenizer (unmodified) |
| html5ever | 0.40.1 | MIT OR Apache-2.0 | 1.85 | HTML parser |
| taffy | 0.15.1 | MIT | 1.71 | block, flex and grid layout |
| parley | 0.12.0 | Apache-2.0 OR MIT | 1.88 | text layout |
| fontique | 0.13.0 | Apache-2.0 OR MIT | 1.88 | font enumeration and fallback |
| vello | 0.12.0 | Apache-2.0 OR MIT | 1.89 | GPU 2D rendering |
| vello_cpu | 0.4.0 | Apache-2.0 OR MIT | 1.89 | CPU rasterizer for deterministic headless screenshots and WPT reftests |
| wgpu | 30.0.1 | MIT OR Apache-2.0 | 1.87.0 | GPU API (Vulkan, Metal, DX12, WebGPU) |
| winit | 0.30.13 | Apache-2.0 | 1.70.0 | windowing (preview window only) |
| tokio | 1.54.1 | MIT | 1.85 | async runtime |
| hyper | 1.12.0 | MIT | 1.63 | HTTP/1 and HTTP/2 |
| hyper-util | 0.1.21 | MIT | 1.85 | hyper glue |
| axum | 0.8.9 | MIT | 1.80 | internal dev-server routes |
| tower | 0.5.3 | MIT | 1.64.0 | middleware |
| rustls | 0.23.46 | Apache-2.0 OR ISC OR MIT | 1.71 | TLS |
| reqwest | 0.13.5 | MIT OR Apache-2.0 | 1.85.0 | outbound HTTP (registry, deploy APIs) |
| quinn | 0.11.12 | MIT OR Apache-2.0 | 1.85 | QUIC |
| h3 | 0.0.8 | MIT | 1.70 | HTTP/3 (experimental) |
| url | 2.5.8 | MIT OR Apache-2.0 | 1.63 | WHATWG URL |
| bytes | 1.12.1 | MIT | 1.57 | buffers |
| tracing | 0.1.44 | MIT | 1.65.0 | diagnostics |
| clap | 4.6.7 | MIT OR Apache-2.0 | 1.85 | CLI |
| serde / serde_json | 1.0.229 / 1.0.154 | MIT OR Apache-2.0 | 1.56 / 1.71 | serialization |
| toml | 1.2.1 | MIT OR Apache-2.0 | 1.85 | config files |
| sha2 | 0.11.1 | MIT OR Apache-2.0 | 1.88 | integrity hashes |
| zstd | 0.14.3 | BSD-3-Clause (links C libzstd, BSD) | 1.64 | cache compression |
| ignore | 0.4.34 | Unlicense OR MIT | 1.88 | gitignore-aware walking |
| notify | 8.2.2 | CC0-1.0 | 1.88 | file watching |
| servo (optional, feature `servo`) | 0.8.0 | MPL-2.0 | 1.88.0 | full engine backend; off by default |

Not used, with the reason:
- swc_core 84.0.3: overlaps with oxc.
- rspack_core 0.103.2: webpack API surface is not a goal.
- tailwind-rs, railwind, tailwind-css: stale (last releases 2022 to 2023 per `crates.tsv`) and not v4.
- webrender 0.70.1: Blitz uses vello.
- nova_vm 1.0.0: too young (2003 downloads).

Maintenance note: the `denoland/deno_core` GitHub repo is archived (archived=true, last push 2026-02-27). The crate is still published from the Deno monorepo (0.413.0, 2026-10-21). The `js` trait keeps a switch to `boa` or `rquickjs` cheap if publishing stops.

MSRV: the workspace declares `rust-version = "1.97"` because `oxc 0.158.0` declares `rust-version = "1.97.0"`. `rust-toolchain.toml` pins 1.99.1, the current stable on 2026-11-12. CI also runs a 1.97 check job, and the MSRV moves only when a pinned dependency requires it.

### 5. Data flows

#### 5.1 `aphrody dev`

```
fs watcher (io/notify) --changed paths--> module graph (bundle, incremental)
      |                                         |
      |                       +-----------------+------------------+
      |                       v                 v                  v
      |               server env (RSC)   client env (browser)  edge env
      |                transpile/oxc      transpile + React Refresh
      |                       |                 |
      |                       v                 v
      |              runtime (V8 isolate)   dev HTTP server (net) --HMR WebSocket--> browser
      |               renders Flight + HTML   serves /_next/static/* from memory
      v
tailwind scanner (oxide) --candidates--> tailwind compiler --> css (lightningcss) --> HMR CSS update
```
- One process, with a tokio multi-thread runtime for I/O. JS executes on dedicated isolate threads: one server isolate per environment, plus a worker pool for parallel route rendering.
- Modules are transpiled lazily, on first request, and cached by content hash in `.aphrody/cache` (zstd).
- HMR has two paths: client modules use React Refresh boundaries, and server modules invalidate the Flight payload, which the client refetches with `router.refresh()` semantics.

#### 5.2 `aphrody build`

```
next.config.* (evaluated in runtime) --> route discovery (app/, pages/)
  --> bundle: 3 environments (server-rsc, server-ssr, client) + edge, code splitting
  --> rsc: client-reference manifest, server-action manifest
  --> tailwind + css: one CSS file per layout chunk, minified
  --> prerender: execute static routes in runtime --> HTML + .rsc payloads
  --> deploy: write .vercel/output (Build Output API v3) + .next-compatible manifests
```
- `build` is deterministic: the same inputs and lockfile produce byte-identical output. CI checks this with a two-build hash comparison.
- `build --target <vercel|node|static|oci>` selects the output adapter. The default is `vercel`, which is BOA v3.

#### 5.3 `aphrody serve`

```
.vercel/output/config.json --routes--> router (net, matches BOA v3 route phases)
   |-- static/            served from disk/mmap, immutable cache headers
   |-- functions/*.func   loaded into runtime isolates (pooled), handler per route
   |-- *.prerender-config ISR: stale-while-revalidate with an on-disk cache
```
- `serve` runs the same artifact Vercel would run, so local and remote behavior match. This is also how the Build Output v3 suite runs in CI without network access.

#### 5.4 `aphrody deploy`

```
build --target vercel  -->  .vercel/output
  --> provider = vercel: POST files and the deployment through the Vercel REST API (token from env), same contract as `vercel deploy --prebuilt`
  --> provider = oci:    single static binary + output dir --> OCI image (no Dockerfile needed)
  --> provider = static: static/ only (routes that need functions are rejected at build time)
```
- Credentials are read only from the environment or the OS keychain, never from the repo.

### 6. Next.js App Router and RSC/Flight design

Next.js-compatible means that an existing project runs unmodified with `aphrody dev` and `aphrody build`. A `next` bin shim lets the upstream Next.js test harness drive it.

What stays JavaScript: React, react-dom and the `next/*` client and server runtime modules come from npm (MIT) and execute in V8. Their behavior is not reimplemented. What becomes Rust is everything Next.js normally does in its Node-side build and server: config loading, route-tree building, bundling (Turbopack/webpack roles), manifests, the server request pipeline, the cache, and static generation.

Components:
1. **Route tree** (`next`). It scans `app/` for `page`, `layout`, `template`, `loading`, `error`, `not-found`, `route`, `default`, parallel `@slot`, intercepting `(..)` and groups `(group)`, and `pages/` for legacy routes. It produces the same route manifests (`app-paths-manifest.json`, `routes-manifest.json`, `prerender-manifest.json`, `middleware-manifest.json`) because the Next.js runtime and the deploy adapter read them.
2. **Environments** (`bundle`). Each environment is a separate rolldown build with its own conditions: `react-server` for RSC, `node`/`edge` for SSR, and `browser` for the client. Directives (`"use client"`, `"use server"`, `"use cache"`) are detected in the oxc AST:
   - `"use client"` modules are replaced in the RSC graph by client-reference stubs (`registerClientReference(id, export)`).
   - `"use server"` functions are replaced in the client graph by `createServerReference(actionId)`. The action id is a stable hash of module path plus export name, salted per build.
3. **Flight** (`rsc`). Rust does not encode Flight. Encoding happens in V8 with React's own `react-server-dom` server build, which keeps the format identical to the upstream React version. Rust supplies three things: (a) the client-reference manifest in the shape that `react-server-dom-webpack` and `react-server-dom-turbopack` expect (`id`, `chunks`, `name`); (b) the module loading shim (`__webpack_require__`/`__turbopack_require__` equivalents) mapped onto aphrody chunks; (c) a streaming bridge that moves Flight chunks from the RSC isolate to the SSR isolate and the HTTP response without copying (`bytes::Bytes` over a channel). The `rsc` crate also includes a Flight decoder for tests and inspection.
4. **Request pipeline** (`next` + `net`): proxy/middleware (edge env), then route match, then RSC render (Flight), then SSR (HTML from Flight, `renderToReadableStream`), then streaming response. Navigation requests that carry an `RSC: 1` header skip SSR. Partial prerendering is supported: the static shell is generated at build time and dynamic holes are filled at request time over the same stream.
5. **Server actions**: a POST with `Next-Action: <id>` is looked up in the server-action manifest, then the arguments are decoded with React's `decodeReply` in V8. Return values and revalidation are serialized as Flight.
6. **Caching**: `fetch` cache, `"use cache"`, `cacheTag`/`cacheLife`, `revalidatePath`/`revalidateTag`. The storage interface is pluggable: memory for `dev`, disk for `serve`, and the provider for `deploy`. The semantics follow the pinned Next.js version, which the e2e suite verifies.
7. **Next.js modules served natively**: `next/image` (optimizer on Rust image codecs, chosen in M4), `next/font` (font fetch and subsetting at build time via fontique/skrifa), `next/og` (rendered by `renderer`).

Version policy: one Next.js minor line at a time, pinned in the conformance lock. The `next` package version in a user project must match that supported line; on a mismatch, `aphrody` warns.

### 7. Tailwind CSS v4 engine design

The goal is byte-identical CSS to `tailwindcss` v4 at the pinned upstream commit, for the same input CSS and sources.

```
input.css --(lightningcss parse)--> AST --(at-rule pass)--> DesignSystem
   @import "tailwindcss" | @theme | @source | @utility | @variant | @custom-variant | @plugin | @config | @apply
sources --(tailwind-oxide scanner)--> candidate strings
candidates --(candidate parser)--> {variants[], utility, value, modifier, important}
   --(DesignSystem.compile)--> rules --(sort: layer, variant order, property order)--> CSS AST
   --(lightningcss: nesting, vendor prefixes, @property, color-mix fallbacks, minify)--> output.css
```

- **Port scope**: `packages/tailwindcss/src` (MIT) is ported module by module: `design-system`, `candidate`, `utilities`, `variants`, `theme`, `compile`, `apply`, `at-import`, `css-functions`, `property-order`, `sort`. Each Rust module records the upstream file and commit it was ported from, which keeps later re-syncs mechanical.
- **Scanner**: upstream `crates/oxide` (package `tailwindcss-oxide`, MIT, edition 2021, verified at commit `b08bf83a`) is used as a git dependency pinned to the conformance commit. If its dependency tree blocks that, it is vendored into `crates/tailwind-oxide` with the upstream MIT license and a NOTICE file. Its tests run unchanged (suite 4).
- **JS plugins and `@config`**: legacy `tailwind.config.js` and `@plugin` modules run in the aphrody runtime through a small plugin API bridge (`addUtilities`, `matchUtilities`, `addVariant`, `theme()`). Pure-CSS configs never start an isolate.
- **Integration points**: the `bundle` CSS pipeline (automatic for `@import "tailwindcss"`), `aphrody tailwind` (CLI-compatible with `@tailwindcss/cli` flags), and a PostCSS-compatible entry for the integration suite.
- **Verification**: the upstream `*.test.ts` files mostly use `toMatchInlineSnapshot` around `compile()` or `run()`. A one-time extractor (in `conformance`) converts each case into a `{input css, candidates, expected css}` fixture at the pinned commit. Rust tests diff against those fixtures (suite 5).

### 8. Component registry design

- **Schema**: the shadcn registry schemas are the compatibility contract: `registry.json` and `registry-item.json`, which exist at `shadcn-ui/ui@dd41d19e:apps/v4/public/schema/`. The `registry` crate models them with serde using `deny_unknown_fields` off and `$schema` preserved, and it validates every document against the upstream JSON Schema in tests.
- **Item types**: `registry:ui`, `registry:component`, `registry:block`, `registry:lib`, `registry:hook`, `registry:page`, `registry:file`, `registry:style`, `registry:theme`, `registry:item`, with `files`, `dependencies`, `devDependencies`, `registryDependencies`, `cssVars`, `css`, `envVars`, `docs`, `meta`.
- **Client**: `aphrody add <item | url | @namespace/item>` reads `components.json` (style, aliases, `tailwind.css`, `iconLibrary`, `registries`). It resolves `registryDependencies` transitively, rewrites import aliases, merges `cssVars`/`css` into the Tailwind v4 CSS entry (`@theme inline`, `:root`, `.dark`), and installs npm dependencies through `pm`. Its observable result must equal `shadcn add` on the same project, which is checked by snapshotting the file tree.
- **Server**: `aphrody registry build` turns a `registry.json` into the static `r/<name>.json` items. The output is servable by `aphrody serve` or any static host.
- **Components**: components ship as TSX source (the shadcn model), not as Rust widgets. The first-party set is built on Base UI primitives (`@base-ui/react` 1.9.0 at `mui/base-ui@5aacdbb7`, MIT), so the Base UI test suite (suite 7) is the behavioral oracle for interaction and accessibility under the aphrody runtime and test runner.

### 9. Deploy output (Build Output API v3)

```
.vercel/output/
  config.json                    { "version": 3, "routes": [...], "images": {...}, "overrides": {...}, "cache": [...], "framework": {...} }
  static/                        public assets, prerendered HTML and .rsc payloads
  functions/<path>.func/
    .vc-config.json              { "runtime": "nodejs<NN>.x", "handler": "...", "launcherType": "Nodejs", "supportsResponseStreaming": true }
                                 or { "runtime": "edge", "entrypoint": "..." }
    <bundled handler + chunks>
  functions/<path>.prerender-config.json   { "expiration", "group", "bypassToken", "fallback", "allowQuery" }
```
- Function bundles are plain ESM/CJS that runs on Vercel's Node and Edge runtimes, so deploying needs no custom runtime. The same bundles run on the aphrody runtime under `aphrody serve`. One artifact serves both.
- Route phases (`filesystem`, `handle: miss`, `rewrite`, `hit`, `error`) are generated from `routes-manifest.json`, following the order of the upstream Next.js deployment adapter (`packages/next/src/build/adapter/`, verified at `vercel/next.js@3642b242`).
- An `oci` adapter packages the `serve` binary with `.vercel/output` into one image, for self-hosting.

### 10. Targets

| Target | Engine | Notes |
|---|---|---|
| x86_64-pc-windows-msvc | v8 | prebuilt rusty_v8 static lib |
| x86_64/aarch64-unknown-linux-gnu | v8 | prebuilt rusty_v8 static lib |
| x86_64/aarch64-unknown-linux-musl | v8 from source, or boa | no prebuilt rusty_v8 musl archive is assumed; CI builds V8 with `V8_FROM_SOURCE=1` and caches the result. Fallback artifact uses `--features engine-boa` |
| aarch64/x86_64-apple-darwin | v8 | prebuilt rusty_v8 static lib |
| wasm32-unknown-unknown | boa | toolchain crates (transpile, css, tailwind, rsc, registry) plus a boa-backed runtime subset; renderer via wgpu WebGPU. No V8, no net server |

`cargo check --workspace` runs on `x86_64-unknown-linux-gnu` (prd) and `x86_64-pc-windows-msvc` (CI); the Windows-host crates of the WSLg stack are empty on Linux (see §6).

### 11. Politique de licences

- **Licence du projet** : MIT OR Apache-2.0.
- **Licences de dépendances admises** : MIT, Apache-2.0 (y compris WITH LLVM-exception), BSD-2-Clause, BSD-3-Clause, ISC, Zlib, Unicode-3.0, CC0-1.0, Unlicense, et MPL-2.0 selon la règle suivante (liste exécutable : `deny.toml`).
- **MPL-2.0** (lightningcss, stylo, selectors, cssparser, servo, adblock) : dépendances de registre utilisées sans modification. Aucun fichier MPL n'est copié, patché ni vendorisé ; un correctif part en amont et le pin monte. Une entrée `[patch]` visant une crate MPL est interdite.
- **Patchs** : `third_party/` ne reçoit aucune modification locale et il n'y a plus de `third_party/patches/` (2026-11-13). Une crate de registre corrigée passe par un fork `aphrody-labs` épinglé par commit dans `[patch.crates-io]` (`git` + `rev`, imposé par `deny.toml` `required-git-spec = "rev"` ; aujourd'hui quinn-proto et glob-match). Jamais sur une crate MPL. `docs/patches/series` n'indexe que des patchs suivis dans l'arbre.
- **Refusées** : GPL, LGPL, AGPL (toutes versions), SSPL, BUSL et autres licences non OSI, ainsi que tout code dont GitHub rapporte la licence NOASSERTION, sauf revue manuelle consignée ici.
- **Exception revue (2026-11-13)** : `ffmpeg-next` / `ffmpeg-sys-next` (WTFPL, permissive) admises crate par crate dans `deny.toml` `[licenses] exceptions`. FFmpeg libav* (LGPL-2.1+) est lié dynamiquement depuis le système ou vcpkg, jamais vendorisé : `crates/tv-*` restent MIT OR Apache-2.0 (LGPL-2.1 §6). Le test `tv-ffmpeg` `ffmpeg_build_is_lgpl` (`cargo test -p tv-ffmpeg -- --ignored`, obligatoire avant toute distribution) échoue si la libavutil chargée annonce `--enable-gpl`, `--enable-nonfree` ou `--enable-version3` (LGPL-3.0), ou une licence autre que « LGPL version 2.1 ». Aucune crate `tv-*` n'est distribuée aujourd'hui (cargo-dist ne publie que `ay`, seul paquet `[package.metadata.dist] dist = true`) ; ce test devient une étape bloquante du job de release le jour où une crate `tv-*` y entre. Constat du 2026-11-13 : le FFmpeg d'Arch sur prd (2:9.0.2-2) est construit avec `--enable-gpl` ; un binaire `tv-*` lié à lui n'est pas distribuable sous MIT OR Apache-2.0, la distribution doit lier un FFmpeg LGPL (port vcpkg `ffmpeg` sans la feature `gpl`, triplets de `infra/vcpkg`). Seules les crates `tv-*` dépendent de `tv-ffmpeg` : `-crates/tv-ffmpeg` dans `/DEPS.rules` (donc crates, packages, plugins et apps), relevé par `+` dans `crates/tv-cli`.
- **Étude seulement** : Bun (`oven-sh/bun`, licence GitHub NOASSERTION ; son `LICENSE.md` au commit `43850629` : Bun MIT mais JavaScriptCore/WebKit LGPL-2 liés statiquement). Lecture et description des idées permises ; copie, traduction ligne à ligne et vendorisation interdites. Idem Zed/GPUI (NOASSERTION).
- **Suites de test comme oracles** : récupérées aux commits épinglés dans `conformance/upstream/` (ignoré) et exécutées là ; jamais commitées, leurs licences (Test262, WPT, Bun) n'entrent pas dans l'arbre.
- **Application** : `cargo-deny` (`deny.toml`) avec `licenses`, `bans` (pas d'`openssl-sys` : TLS sur rustls) et `sources` (crates.io, forks git `aphrody-dev` et `aphrody-labs` épinglés par `rev`) en CI avant main.

### 12. Décisions transverses

- **Erreurs** : `thiserror` dans les bibliothèques, un seul rendu de diagnostics façon `miette` dans les CLIs.
- **Concurrence** : tokio pour les E/S ; le JS tourne sur des threads d'isolat, jamais sur les workers tokio ; le travail CPU (parse, bundle, scan) va dans des pools rayon.
- **Cache** : `<cache OS>/aphrody/<kind>/<blake3>` (`XDG_CACHE_HOME`, `%LOCALAPPDATA%`), compressé zstd et adressé par contenu, partagé par `dev`, `build` et `test`.
- **Télémétrie** : aucune.
