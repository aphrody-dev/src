# Architecture racine cible du src fusionné (2026-11-12)

Un seul dépôt `C:\src`, pensé d'emblée comme quatre choses à la fois : un **OS pour agents**, un **browser**, un **shell** et un **monorepo bun + cargo plat**. Règles : zéro duplication, zéro régression, et chaque fusion se ferme sur `cargo test --workspace` + `bun test` verts, sans recul de nombre de tests.

## Racine (seuls fichiers autorisés)

```
Cargo.toml          un seul workspace ; [workspace.dependencies] = une seule version par crate
Cargo.lock
package.json        workspaces bun : ["packages/*", "apps/*"]
bun.lock
rust-toolchain.toml nightly épinglée
.cargo/config.toml  vendored-sources = third_party/crates, cranelift dev, rust-lld
justfile            point d'entrée unique (build, test, factory, deploy, save)
.lore/ .loreignore  VCS (historique labs rév. 1–14 + src)
README.md AGENTS.md CLAUDE.md LICENSE-*
crates/ packages/ apps/ third_party/ infra/ docs/
```

Disparaissent de la racine (à fondre dans les dossiers ci-dessus) : Dockerfile, compose.yaml, cloudbuild.yaml, flake.nix, deploy.ps1/.sh, install.ps1/.sh, graphify-out/, var/, node_modules/, target/ (ignorés), GEMINI.md, MAINTAINERS. Le contenu de deploy.toml, tools.toml, depot-artifacts.toml et dist-workspace.toml passe dans infra/ ou dans le Cargo.toml.

## Couches (préfixe obligatoire = couche, dossiers plats)

| Couche | Rôle « OS pour agent » | crates/ (Rust) | packages/ (bun) |
|---|---|---|---|
| `sys-` | noyau : Win32/NT (windows-rs), Linux, FFI, processus, capture | sys, ffi, rt → sys-* | — |
| `shell-` | le shell : osh (Oils Windows), coreutils, chemins, PATHEXT, snapshot | unix-uutils → shell-* | shell-matrix |
| `browser-` | le browser : fabrique Chromium, channels, conformance, labs_agent, CDP | conformance (channels), factory | bench |
| `desktop-` | pilotage UI : UIA, input, fenêtres (fork agent-desktop) | dx12-winui-core, ui | — |
| `agent-` | runtime agent : MCP, skills, outils, sessions | ring3-agent, apm | skills, mcp |
| `vcs-` | Lore : stockage, transport, révisions | lore* → vcs-lore-* | — |
| `depot-` | toolchain monorepo : ay, gclient, cipd, cas, vpython, graph | depot-*, ay, xtask | ay (bun) |
| `design-` | UI web/native : tokens, icônes, layout | aphrody-design-* → design-* | ui |
| `infra-` | fleet : déploiement, NativeLink, systemd | — (scripts → infra/) | — |

`apps/` = binaires et sites déployables uniquement (aphrody CLI, site). `third_party/` = upstream vendorisé, **une copie par projet**, verrouillé dans `src.lock.json`, sans patch local (les patchs vivent dans les forks aphrody-labs, épinglés par commit).

## Déduplication obligatoire (connue à ce jour)

| Doublon | Garder | Supprimer |
|---|---|---|
| C:\labs vs src/third_party/labs (miroir bun) | contenu C:\labs fusionné en couches | src/third_party/labs |
| vendor crates labs (578) vs vendor src | un seul third_party/crates régénéré par `cargo vendor` du workspace fusionné | l'autre |
| coreutils-1/2/3, uutils-coreutils, findutils-1, sed-1, fx-1, wterm-1, skills-3, vcpkg-1 | un fork par upstream | les suffixés (après accord propriétaire) |
| brush / niubash / osh comme bash.exe | un seul choix mesuré (niubash aujourd'hui, osh candidat) | config des autres |
| docs labs + src/docs (60+ fichiers) | docs/ par couche, un fichier par sujet | rapports historiques → docs/archive/ |
| scripts shell factory | crates/browser-factory (F4) | infra/chromium-factory/*.sh |

## Ordre de fusion (sans régression)

1. Geler : snapshot Lore (labs rév. 14) + commit src ; mesurer les nombres de tests des deux côtés.
2. Workspace unique : fusionner les [workspace.dependencies] (version la plus récente qui compile), profils labs (cranelift/llvm-test/min).
3. Déplacer par couche, crate par crate, test après chaque déplacement.
4. Vendor unique, lockfiles uniques ; supprimer les doublons du tableau.
5. Vérifier : mêmes nombres de tests ou plus, mêmes binaires, `just ci` vert.

## Identité changeable, déplaçable, multiplateforme (exigence du propriétaire)

Tout nom doit pouvoir changer sans réécrire le code : nom du dépôt (`src`), CLI, binaires, crates, packages npm, scope, site, URL git.
- **Une seule source** : `identity.toml` à la racine (name, cli, scope npm, crate_prefix, domain, git remotes, lore remote). Tout le reste en dérive.
- **Génération** : `ay identity apply` (Rust) réécrit les champs `name`, `[[bin]]`, `package.json#name` et les remotes depuis identity.toml ; `ay identity check` sert de garde en CI (aucun nom en dur ailleurs).
- **Code** : aucun nom de produit en dur. Utiliser `env!("CARGO_PKG_NAME")`/`CARGO_BIN_NAME`, et lire le scope ou le domaine via une crate `identity` générée par build.rs depuis identity.toml.
- **Chemins** : jamais de `C:\src` ni de `/home/ubuntu/...` en dur. Les chemins sont relatifs à la racine du dépôt (détectée par `.lore`/`Cargo.toml`), sinon ils viennent de variables (`SRC_ROOT`, `XDG_*`, `%LOCALAPPDATA%`) via `dirs`.
- **Multiplateforme** : chaque binaire compile et teste sur windows-msvc et linux-gnu. Les scripts .sh/.ps1 sont remplacés par des recettes `just` qui appellent des binaires Rust ou bun (pas de bash ni de pwsh requis).
- **Renommer = une PR** : modifier identity.toml, puis `ay identity apply`, puis `just ci`. Pour les noms déjà publiés (crates.io, npm), ajouter un alias de transition.

## Annexe : architecture labs v0 (fusionnée depuis C:\labs\docs\ARCHITECTURE.md, 2026-11-12)

Chemins d'origine : `crates/cli` est devenu `crates/aphrody-cli`, `infra/chromium-factory` `infra/chromium-factory`, `vendor/` `third_party/patches/`.



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

Maintenance note: the `denoland/deno_core` GitHub repo is archived (`repos.tsv`: archived=true, last push 2026-02-27). The crate is still published from the Deno monorepo (0.413.0, 2026-10-21). The `js` trait keeps a switch to `boa` or `rquickjs` cheap if publishing stops.

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

`cargo check` passed for `x86_64-pc-windows-msvc`, `x86_64-unknown-linux-gnu` and `wasm32-unknown-unknown` on the M0 skeleton. The other targets join the CI matrix in M0.

### 11. License policy

- **Project license**: MIT OR Apache-2.0.
- **Allowed dependency licenses**: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, Zlib, Unicode-3.0, CC0-1.0, Unlicense, and MPL-2.0 under the rule below.
- **MPL-2.0** (lightningcss, stylo, selectors, cssparser, servo): used unmodified, as registry dependencies only. No MPL file is copied, patched or vendored into this repo. If a fix is needed, it goes upstream and the pin is bumped. A `[patch]` entry against an MPL crate is forbidden.
- **Denied**: GPL, LGPL, AGPL (any version), SSPL, BUSL and other non-OSI licenses, plus any code whose license GitHub reports as NOASSERTION, unless a manual review clears it and the review is recorded here.
- **Study-only**: Bun (`oven-sh/bun`). GitHub reports NOASSERTION (`repos.tsv`). Its `LICENSE.md` at `43850629` says Bun itself is MIT but statically links LGPL-2 JavaScriptCore/WebKit and bundles other C/C++ code, so the tree is mixed. Contributors may read it and describe the ideas, but must not copy, translate line by line or vendor its code. The same applies to Zed/GPUI (NOASSERTION).
- **Test suites as oracles**: upstream suites are fetched at pinned commits into the ignored `conformance/upstream/` and run there. They are not committed, so their licenses (Test262 BSD-style, WPT 3-Clause BSD, Bun NOASSERTION) do not enter the source tree.
- **Enforcement**: `cargo-deny` (`deny.toml`, added in M0) with `licenses`, `bans` (no `openssl-sys`, which keeps the TLS stack on rustls) and `sources` (crates.io, plus `vendor/` path patches) runs before every change is submitted to Lore.

### 12. Cross-cutting decisions

- **Errors**: `thiserror` in library crates and one `miette`-style diagnostic renderer in `cli`. The choice is made in M1 and pinned then.
- **Concurrency**: tokio for I/O. JS runs on isolate threads, never on tokio worker threads. CPU-heavy work (parse, bundle, scan) goes to rayon-style pools inside rolldown and oxide.
- **Cache**: `.aphrody/cache/<kind>/<blake-or-sha256>`, zstd-compressed and content-addressed, shared by `dev`, `build` and `test`.
- **Telemetry**: none.
