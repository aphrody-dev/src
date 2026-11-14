# Releases vercel/next.js (60 dernières)

## v16.5.0-canary.50 (2026-11-14) canary

### Core Changes

- Enable turbopackMinifyBeforeChunking by default on canary releases: #101113
- Turbopack: write smaller/faster client reference manifests: #101312
- Generate managed agent instructions on next dev and respect opt-outs: #101746
- fix(next/image): check the LCP element loading state: #101737
- Run render error reporting outside the work-unit scope: #101597
- Fix RSC navigation and runtime prefetches in `next start`: #101357
- Expose full-route RSC prerender classification to adapters: #101309
- Distinguish dynamic rendering from required prerendering: #101511
- turbopack: size chunk items by their minified code when minifying before chunking: #101010
- Prevent repeated prerenders during fallback shell revalidation: #101756
- Enable Turbopack GC by default: #101591
- Exit next dev when the server process is killed by a signal: #101752
- Store "use cache" durability once per entry in server reference manifest: #101674
- Remove `durability` property from `createServerModuleMap` results: #101730
- Resolve webpack dev HMR test callback when a build has nothing to apply: #101682
- turbo-tasks: capture effects on multiple workers: #101514
- Turbopack: report routes nested inside catch-all segments instead of panicking in dev: #101697

### Example Changes

- docs: standalone env file precedence and with-docker-multi-env secrets: #101728
- examples: bump Alpine Docker base images to Node 24: #101215

### Misc Changes

- docs: place shell param-order rule with build-time shells: #101680
- turbo-persistence: don't modify the directory on read-only open: #101779
- Optimize inline_atom: #101778
- docs: clarify standalone .env copying and the next-server tracing exclude key: #101699
- docs: Add more clarification about SVG security policies: #101311
- Add a 48-hour Cargo dependency cooldown: #101765
- Update Rust nightly to 2026-11-13: #101764
- Upgrade React from `df6aa4ec-20261112` to `df6aa4ec-20261112`: #101760
- turbo-tasks-backend: store task edges in flat EdgeSets: #101489
- turbo-tasks-backend: add a profile driver to the keyed dependencies benchmark: #101731
- docs: correct deploymentId environment variable precedence: #101740
- Turbopack: list compact re-export namespace keys in code unit order: #101494
- turbo-tasks-backend: fix transient root test race: #101700
- Scaffold separate entrypoint for Turbopack NFT functionality: #94356
- Turbopack: read UnusedReferences by key in ESM export code generation: #101626
- Require real deployment coverage for application behavior: #101510
- Turbopack: read UnusedReferences by key in pattern mapping: #101725
- test: replace files atomically in patchFile: #101683
- turbo-persistence: faster key block sorting: #100335
- turbopack: return small free ranges to the OS after project shutdown: #101623
- Turbopack: return freed memory eagerly while shutting down the project: #101589
- turbo-persistence: validate sst_inspect block reads with BlockOffsets: #100313

### Credits 

Huge thanks to @lukesandberg, @icyJoseph, @aurorascharff, @bgw, @wbinnssmith, @unstubbable, @sokra, and @mischnic for helping!

## v16.5.0-canary.49 (2026-11-12) canary

### Core Changes

- Optimize NFT base path mapping: #101151
- Fix `ImageResponse` prerendering with `--debug-prerender`: #101678
- Upgrade React from `1620f7b9-20261111` to `df6aa4ec-20261112`: #101673
- Fix ESLint link rule for constant and mapped hrefs: #101641
- Complete metadata references and fix descriptor resolution: #101547
- docs: clarify dynamicParams with Cache Components: #100249
- Test Proxy Link headers across cache revalidation: #101620
- Remove obsolete prerender abort workarounds: #101621
- Use forward slashes in route bundle stats chunk paths: #101617
- Preserve build diagnostics during worker shutdown: #101598

### Misc Changes

- turbo-tasks-backend: keep the active count inline: #101486
- turbopack: use static for shared rcstr! values and hardcode magic identifiers: #101686
- docs: clarify synchronous IO after request data: #101685
- turbo-persistence: remove ParallelScheduler::block_in_place: #101544
- Turbopack: release freed memory right after project shutdown: #101529
- turbo-tasks-backend: read collectibles and update the reader dependency atomically: #101548
- [internal-skills] fetch CI status on demand instead of blocking on --wait: #101661
- Fix pnpm-lock.yaml for bench/large-app-router after React upgrade: #101642
- bench: add generated large App Router benchmark for Turbopack scaling: #101502
- test: fix flaky vary-params-base-dynamic prefetch collection: #101531
- test: fit cold-cache npm install in create-next-app template test timeout: #101625
- docs: add native DOM examples to Activity guide: #101581
- turbo-persistence: report batch_get misses from batch_lookup_entry: #101615
- create-next-app: exit with code 1 when installation fails: #101624
- Strengthen documentation review criteria: #101622
- Turbopack: skip unmatched siblings when building app loader trees: #101535
- docs: explain runtime config removal on the middleware-to-proxy error page: #101616
- Turbopack: start whole-app client style groups earlier in production builds: #101612
- turbo-tasks: don't make parentless transient tasks aggregation roots: #101614
- turbo-tasks: avoid redundant aggregation roots and root-upper optimization cascades: #101604
- turbo-persistence: make batch_get callback-oriented: #100678

### Credits 

Huge thanks to @lukesandberg, @mischnic, @aurorascharff, @sokra, @unstubbable, @eps1lon, and @icyJoseph for helping!

## v16.5.0-canary.48 (2026-11-11) canary

### Core Changes

- Prerender route handlers that await immediates: #101593
- Fix orphaned detached telemetry flush processes: #101588
- Upgrade React from `e84e1492-20261031` to `1620f7b9-20261111`: #101587
- docs: clarify tag invalidation client effects: #101504
- Keep dev overlay errors across no-op webpack hot updates: #101532

### Misc Changes

- Turbopack: don't grow effect vectors inside the analyzer arena: #101480
- Fix metadata route selection with `--debug-build-paths`: #101585
- eval: generate the docs pointer from the tested Next.js package: #101558
- Turbopack: scale default disk write concurrency: #101519
- eval: correct graders for Proxy, instant navigation, and category prefetching: #101523
- docs: clarify Server Actions configuration: #101549
- Turbopack: add build cache portability e2e test and fix location-dependent tasks: #100780
- Turbopack: replace SwcComments with a lightweight MutableComments store: #101543
- turbo-tasks-backend: merge aggregated data updates for new followers: #100435
- test: fix keep-alive socket reuse in CSS HMR race helper: #101530
- turbo-tasks: count task executions in task statistics: #101025
- test: fix repeated-slashes router push navigation race: #101528
- next-core: deserialize next.config env and output file tracing globs into typed maps: #100971
- turbo-tasks: add OrderedJsonValue/OrderedJsonMap with key-order-sensitive equality: #100964
- turbo-tasks: use OrderedAutoMap/OrderedAutoSet for order-observing values: #100940
- auto-hash-map: add positional access and IndexMap/IndexSet conversions for ordered maps: #101497
- test: close lingering prerender-export server connections: #101527
- test: fix flaky app-root-params-getters/simple: #101525
- test: fix flaky dev-validation-worker-source-maps: #101524
- turbo-tasks-malloc: use official mimalloc Rust bindings (v3.6.1): #101518
- docs: explain complementary Web Vitals and custom metrics APIs: #98968

### Credits 

Huge thanks to @unstubbable, @timneutkens, @jimmyhmiller, @aurorascharff, @sokra, @lukesandberg, and @adityareddy-dev for helping!

## v16.5.0-canary.47 (2026-11-10) canary

### Core Changes

- fix(next/image): detect distortion using intrinsic proportions: #101349
- Write CPU profiles for next build static workers: #100614

### Misc Changes

- turbo-tasks-backend: process aggregation edge removals after additions and balancing: #100892
- turbo-tasks-backend: track early aggregation edge removals as follower debt instead of retrying: #100873
- Skip unused URL effects in web worker constructors: #101297
- Turbopack: discover snapshot fixtures with custom entries: #101495
- turbo-tasks: Add AutoSet and OrderedAutoSet benchmarks: #100952
- turbo-tasks: Support IndexMap backed AutoMap and AutoSet: #100948
- Turbopack: fix scope-hoisted imports of missing exports: #101482
- Turbopack: don't suggest already-imported names for missing exports: #101479

### Credits 

Huge thanks to @sokra, @jimmyhmiller, and @aurorascharff for helping!

## v16.5.0-canary.46 (2026-11-09) canary

### Core Changes

- Resolve parallel route params from the URL when predicting routes: #101477
- Prevent prerenders from changing foreground response status: #101295
- Release fetch cache locks when origin fetch throws synchronously: #101461
- Don't block the dev overlay on the npm registry version check: #100628
- Fix deployed RSC responses after static-to-partial revalidation: #101454
- docs: enable the testing API at build and server startup: #101443

### Misc Changes

- turbo-tasks: pack CellKey into one word: #101393
- Turbopack: use bincode fixint encoding for ids and persisted hashes: #101419
- [evals] Move fixtures to AI SDK 7: #101470
- Turbopack: migrate CSS snapshot tests to execution tests: #101232
- Turbopack: migrate basic snapshot tests to execution tests: #101231
- Turbopack: migrate tree-shaking and scope-hoisting snapshot tests to execution tests: #101230
- Turbopack: migrate ESM export optimization snapshot tests to execution tests: #101229
- Turbopack: migrate CommonJS tree-shaking snapshot tests to execution tests: #101228
- Turbopack: migrate comptime snapshot tests to execution tests: #101227
- Turbopack: migrate import and resolution snapshot tests to execution tests: #101211
- Require real router interactions in navigation tests: #101462
- [create-next-app] Output next steps commands when creating app from template: #99769

### Credits 

Huge thanks to @lukesandberg, @acdlite, @unstubbable, @swarnava, @sokra, @ShakilUrRehman21, and @aurorascharff for helping!

## v16.4.6 (2026-11-09)

> [!NOTE]
> This release is backporting bug fixes. It does **not** include all pending features/changes on canary.

### Core Changes

- [lts-active] Pin Tailwind to 4.3.3 in create-next-app and tests (#101061, #101176) (#101307)
- [lts-active] Automatically compress route handler responses if not already compressed (#101280)
- [lts-active] Turbopack GC fixes for dev (#100279, #100370) (#101308)

### Credits

Huge thanks to @lukesandberg and @eps1lon for helping!

## v16.5.0-canary.45 (2026-11-08) canary

### Core Changes

- docs: clarify agent feedback workspace context: #101358

### Misc Changes

- Turbopack: support turbopackIgnore on new URL(): #99965
- turbo-tasks-backend: release unused capacity in task storage: #101344
- turbopack-ecmascript: store AstPathTrie nodes as parent and kind indices: #101370

### Credits 

Huge thanks to @lukesandberg and @aurorascharff for helping!

## v16.5.0-canary.44 (2026-11-07) canary

### Core Changes

- docs: clarify refresh client cache behavior: #101160
- Link Cache Components config errors to the migration guide: #101348
- Bump `is-animated@3.0.19`: #101173

### Example Changes

- docs: use visible route locators with Cache Components: #101346

### Misc Changes

- docs: fix missing Roboto_Mono import in Pages Router font example: #88849
- docs: fix crossOrigin wording: #97462
- fix: update MDN link in route.mdx: #100753
- docs: fix link reference for child Layout in documentation: #94327
- docs: fix two links broken by the middleware to proxy rename: #99375
- docs: clarify Image priority migration and loading choices: #101345
- docs: clarify metadata image precedence: #101249
- Upgrade Rust toolchain to nightly-2026-11-06: #101279

### Credits 

Huge thanks to @codeandcore, @Rezakarimzadeh98, @robsimmons, @fediev, @adityareddy-dev, @aurorascharff, @styfle, and @mischnic for helping!

## v16.5.0-canary.43 (2026-11-06) canary

### Core Changes

- fix(app-render): stop prerendered Link headers from accumulating on revalidation: #100960
- Align eslint-config-next TypeScript peer with typescript-eslint: #101247
- Reduce header allocations in NodeNextResponse: #101225
- [image-optimizer] Move next/image-optimizer-transform under the next/experimental namespace: #101252
- [image-optimizer] Don't use NextConfigComplete for the imageOptimizerTransform public API: #101184
- Improve Request Insights context menus and trace interactions: #97796
- Build and analyze in one pass: #99962

### Misc Changes

- docs: clarify SVG handling in the Image Optimization API: #101301
- Turbopack: use hash collections for turbo-tasks values whose order is unobserved: #100939
- Turbopack: don't split page entries into a facade: #101152
- Turbopack: replace Next.js entry kinds with an opaque entry tag: #101291
- docs: map BFF proxy example routes to fixed backend endpoints: #101286
- docs: explain ESLint setup with TypeScript 7: #101246
- Durable use cache conditional reads: #101283
- docs: read the URL in history API event handlers instead of calling hooks: #101224
- review: escalate Next.js concepts in Turbopack code: #101278
- test: enable HMR dependency acceptance coverage for webpack: #101196
- test: Replace `itTurbopack` with test gates: #101195

### Credits 

Huge thanks to @styfle, @lukesandberg, @linyiru, @icyJoseph, @kassens, @mischnic, @eps1lon, @bgw, @DavidIlie, and @wbinnssmith for helping!

## v16.5.0-canary.42 (2026-11-05) canary

### Core Changes

- Persist Request Insights session history: #97795
- Show route module loading and preparation in Request Insights: #97362
- Improve Request Insights request and fetch details: #96925
- Automatically compress route handler responses if not already compressed: #101220
- experimental_prepare: Don't refetch on commit due to stale inlining hints: #101234
- Bump to swc v83: #101079
- [image-optimizer] Remove optimizeImage from the public next/image-optimizer-transform API: #101133

### Misc Changes

- Add a server-router regression gate: pnpm test-routing: #100812
- [turbopack] Fix GC/eviction race by dropping task resurrection: #100370
- docs: buffer and re-serialize in the BFF proxy Route Handler example: #101199
- Turbopack: test strict receivers in minified mixed chunks: #101239
- Turbopack: retry chunk loads that failed with component chunks: #101179
- Bump to swc v84: #101194
- docs: require Cache Components compatibility for new e2e tests: #101222
- [ci] Resolve the PR to comment on from the workflow run alone: #101090
- test: capture finished OTel spans from console output in otel-middleware-trace: #100664
- Turbopack: keep IIFEs with a PURE-annotated callee in production builds: #100477
- docs: clarify directory-specific test gate guidance: #101200
- eval: verify independent dashboard streaming: #101155
- Turbopack: generate import.meta.glob as a synthetic module: #100535
- Turbopack: report unknown module types at the import: #100534
- Turbopack: use flat module context ids for dynamic requests: #100681
- Turbopack: read block-scoping support during codegen: #101157
- Make Firebase tracing fixture independent of backend connectivity: #101180
- Pin Tailwind to 4.3.3 in no-double-tailwind-execution test: #101176

### Credits 

Huge thanks to @jamiboym, @lukesandberg, @DavidIlie, @icyJoseph, @eps1lon, @timneutkens, @mischnic, @acdlite, @sokra, @aurorascharff, @bgw, and @wbinnssmith for helping!

## v16.5.0-canary.41 (2026-11-04) canary

### Core Changes

- feat(next/image): add internal image redirects (to match existing external image redirects): #98271
- Turbopack: show the source-mapped file in issue headers: #101161
- Add Request Insights filters and pause controls: #96924
- Avoid instrumenting Next.js telemetry requests: #97182
- Classify framework request activity: #96914
- Move optional lockfile parameters into options object: #101132
- Record Instant Insights validation worker spans: #98677
- Share local tracing across development runtimes: #98676
- [image-optimizer] Replace handleDevOutput with an 'optimized' flag in ImageOptimizerResult, make the caller responsible for blur svg placeholder generation: #101167
- [image-optimizer] Move previous cache entry reuse out of `next/image-optimizer-transform`: #101126
- Deeply freeze the loaded config in test mode: #99943
- fix: do not run onStage listeners for stages that were aborted: #95684
- Update font data: #101129
- Remove the experimental.lockDistDir opt-out option: #100747
- Keep loaded config from sharing objects with defaults and callers: #99942

### Misc Changes

- Fix effects applying when they didn't need to because expression was replaced: #101166
- fix: server actions entrypoint erroring build with `type: commonjs`: #101164
- skills: improve cache-aware navigation workflows: #101169
- docs: document experimental flags removed in Next.js 16: #101165
- docs: useServerInsertedHTML: #98671
- Turbopack: narrow async-module emptiness dependencies: #101154
- eval: measure Next Dev Loop on Pokédex: #100962
- Turbopack: internalize evaluation pool plumbing: #101143
- Turbopack: generate require.context as a synthetic module: #100526
- turbopack-node: linear IPC frame parsing with eager UTF-8 decoding: #99968
- turbo-tasks-backend: keep recorded GC roots until their TTL expires: #100279
- Turbopack: only read conditionally needed values where they are used: #101072

### Credits 

Huge thanks to @styfle, @lukesandberg, @DavidIlie, @bgw, @jimmyhmiller, @lubieowoce, @aurorascharff, @icyJoseph, @jamiboym, and @mischnic for helping!

## v16.5.0-canary.40 (2026-11-03) canary

### Core Changes

- Add instrumentationInject for adapter-supplied instrumentation: #100658
- test(codemod): fix flaky agents-md e2e cascade on slow GitHub clones: #101122
- perf(build): use nft's cached readlink when collecting build traces: #99678
- [experiment] support App Router route.go handlers: #100130

### Misc Changes

- server actions: read cache kinds lazily: #101071
- turbo-tasks-backend: fix lost idle wakeup in the snapshot loop: #100290
- eval: clarify React transitions and prefetch shell grading: #101056

### Credits 

Huge thanks to @lukesandberg, @kakadiadarpan, @kassens, @shootaroo, @aurorascharff, and @timneutkens for helping!

## v16.5.0-canary.39 (2026-11-03) canary

### Core Changes

- Strip internal middleware cookie headers from edge responses: #101109
- Fix stale compressed framing for forwarded fetch responses: #101108
- [use cache] Fix cache key when binary args are used: #101107
- Fix shared shell poisoning from request-supplied placeholder params: #101106
- [next/image] Fix false-positive AVIF/HEIC detection: #101105
- Fix `unstable_cache` leaking cold `'use cache'` fills across root params: #101104
- Fix outer 'use cache' entries reused across root param values: #101103

### Misc Changes

- Turbopack: keep CSS Modules when a loader rule's `as` adds an existing extension: #101065
- Add segment config parity regression tests: #100881
- Turbopack: cleanup ReferencedAssetIdent: #101095
- [test] Fix flaky resume data cache tests: #101088
- docs: fix import.meta.glob base docs: #101085
- create-next-app: remove unused webpack bundler option: #101081
- [experiment] [turbopack-cli] compile .go files: #99980

### Credits 

Huge thanks to @eps1lon, @lukesandberg, @mischnic, @unstubbable, @icyJoseph, and @timneutkens for helping!

## v16.5.0-canary.38 (2026-11-03) canary

### Core Changes

- Fix blocking revalidation for `fetch` and `unstable_cache`: #101077

### Misc Changes

- Turbopack: avoid invalidating per-module analysis when the encryption key changes: #100950
- turbo-tasks: add cancelable cell reads via Vc::lazy_reader(): #101008
- Turbopack: use simd-utf16-len for source position column counting: #100973
- Fix layout client chunk leakage across async server imports: #101040
- Pin Tailwind to 4.3.3 in create-next-app: #101061

### Credits 

Huge thanks to @unstubbable, @sokra, @lukesandberg, @mischnic, and @jamiboym for helping!

## v16.4.5 (2026-11-03)

This release contains security fixes for the following advisories:

## Moderate

- [Cross-tenant sensitive information disclosure in Next.js 'use cache' when called through unstable_cache](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h)
- [Cache leak across root param values in nested 'use cache' functions (follow-up)](https://github.com/vercel/next.js/security/advisories/GHSA-vc7v-qv4w-wrv8)
- [Cache poisoning of shared fallback shells in Cache Components via request-supplied placeholder route params](https://github.com/vercel/next.js/security/advisories/GHSA-vvgp-ww4w-46vf)
- [Cross-user cache disclosure and poisoning in Next.js use cache with binary arguments](https://github.com/vercel/next.js/security/advisories/GHSA-rhh4-g77r-r9qj)
- [Cross-client response injection and disclosure in self-hosted Next.js applications forwarding fetched responses](https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385)
- [SVG rejection bypass in Next.js image optimization](https://github.com/vercel/next.js/security/advisories/GHSA-7qx7-33qx-rqx2)
- [HttpOnly cookie exposure through internal response header on Next.js Edge runtime routes](https://github.com/vercel/next.js/security/advisories/GHSA-f3mh-rxg3-f5g2)

## v15.5.29 (2026-11-03)

This release contains security fixes for the following advisories:

## Moderate

- [Cross-client response injection and disclosure in self-hosted Next.js applications forwarding fetched responses](https://github.com/vercel/next.js/security/advisories/GHSA-pc58-hwjq-p385)
- [SVG rejection bypass in Next.js image optimization](https://github.com/vercel/next.js/security/advisories/GHSA-7qx7-33qx-rqx2)
- [HttpOnly cookie exposure through internal response header on Next.js Edge runtime routes](https://github.com/vercel/next.js/security/advisories/GHSA-f3mh-rxg3-f5g2)

## v16.5.0-canary.37 (2026-11-02) canary

### Core Changes

- Add router.experimental_prepare(): #101050
- Handle registries not serving JSON when checking the version: #95062
- Fix navigations rerendering fully static ISR pages in `next start`: #100854
- [refactor] Remove obsolete RDC and PPR feature guards: #100827
- [no-unsafe-inline] Carry the Flight payload as data instead of inline scripts: #97573
- [no-unsafe-inline] Add an experimental flag for React's external browser runtime: #97570
- Fix revalidation for caches with short stale times: #101037
- Consistently use headersToExcludeInCacheKey: #101035
- turbopack: experimental minify-before-chunking feature: #98760

### Misc Changes

- fix(turbopack): invalidate lazy compilation state across sessions: #98867
- docs: improve turbo_tasks consistency guidance for agents: #101055
- Revert 'Turbopack: ignore fully dynamic alternatives when tracing file paths (#100651)': #101053
- Don't count features behind a new experimental flag as public API: #101051
- docs: add turbo_tasks consistency guidance for agents: #100986
- docs: correct io() prefetch behavior vs connection(): #101031
- perf: use keyed invalidation for get_chunk_groups_for_module: #101034
- test: fail e2e tests on Rust panics: #100922
- turbo-tasks: add batched keyed reads via KeyedReadRef: #100884

### Credits 

Huge thanks to @fireairforce, @mischnic, @acdlite, @vctqs1, @unstubbable, @eps1lon, @icyJoseph, @sokra, and @andrewimm for helping!

## v16.4.4 (2026-11-02)

> [!NOTE]
> This release is backporting bug fixes. It does **not** include all pending features/changes on canary. The [announced security released for November](https://nextjs.org/blog/upcoming-nextjs-security-release-november-2026) will be published tomorrow. 

### Core Changes

- [lts-active] test: disable the `reads fallback params after a client navigation` deployment test (#100668)
- [lts-active] Reload on missed Turbopack startup CSS updates (#100619)
- [lts-active] Revert "Optimize strict module factory chunks (#98421)" (#100866)
- [lts-active] Emit the Turbopack shared-runtime bootstrap in the PPR resume so it gets the CSP nonce (#100907)
- [lts-active] [ci] Pin deploy test deployments to Node.js 22.x (#100886)
- [lts-active] fix(analyze): use route summaries as the analyzer route index (#100974)
- [lts-active] Use fast-jwt instead of jsonwebtoken (#100885)

### Credits

Huge thanks to @icyJoseph, @mischnic, @wbinnssmith, @lukesandberg, and @eps1lon for helping!

## v16.5.0-canary.36 (2026-10-31) canary

### Core Changes

- Upgrade React from `a703ca64-20261030` to `e84e1492-20261031`: #100999
- Upgrade React from `dc9aed36-20261027` to `a703ca64-20261030`: #100965

### Misc Changes

- Turbopack: resolve per-module data once during module graph construction: #94842

### Credits 

Huge thanks to @lukesandberg for helping!

## v16.5.0-canary.35 (2026-10-31) canary

### Core Changes

- Handle cancellation errors during response clone cleanup: #100961
- Revert "Revert "Fix App Router locale path matching with Pages i18n"": #98726
- Fix prerendering of caught `'use cache'` errors: #100956

### Misc Changes

- docs: clarify blocking route response status: #100191
- docs: note per-route cost of boundary files, cached Route Handler checks, and per-instance rate limits: #100985
- docs: clarify unstable_cache cross-deployment persistence: #100983
- eval: allow static headings in prefetch-stage results: #100984
- turbopack: only add the Pages client entry when Pages routes exist: #100896
- turbopack: drop ASTs of tree-shaken modules: #100871
- [test] Cover cache reuse after failed handler writes: #100976
- Bundle Analyzer Agent Skill: Add Lodash deduplication eval: #99180
- Bundle Analyzer Agent Skill: Add server Markdown eval: #99179
- Bundle Analyzer Agent Skill: Add browser initial-load eval: #99178
- Turbopack: use memchr3 for source position scanning and count astral chars as two UTF-16 columns: #100919
- test: properly gate some cache-component tests: #100828
- next-napi-bindings: keep issue-backed client update errors recoverable: #100924
- turbopack: report chunk group consistency errors instead of panicking: #100923
- [test] Cover cache handler validation during concurrent reads: #100908

### Credits 

Huge thanks to @aurorascharff, @icyJoseph, @lukesandberg, @unstubbable, @wbinnssmith, @mischnic, @smaeda-ks, @sokra, and @timneutkens for helping!

## v16.5.0-canary.34 (2026-10-30) canary

### Misc Changes

- fix(turbopack): fix canary build after chunk_groups became a Vec: #100949
- Reland "perf(turbopack): canonicalize async loader availability": #100947
- fix(turbopack): avoid panics from transient chunk group indices: #100928

### Credits 

Huge thanks to @sokra and @mischnic for helping!

## v16.5.0-canary.33 (2026-10-30) canary

### Core Changes

- Stop patching error inspection if source maps are disabled: #93364

### Misc Changes

- Turbopack: store ChunkGroupInfo::chunk_groups as a Vec: #100935
- [test] Fix flaky file-system-cache-clock tests: #100946
- [ci] Fix test axis fixtures never running their off state in CI: #100912
- Define the review agent's team as the owners in review/OWNERS: #100927

### Credits 

Huge thanks to @lukesandberg, @unstubbable, @eps1lon, and @acdlite for helping!

## v16.5.0-canary.32 (2026-10-29) canary

### Core Changes

- Fix hangs and crashes for 204 responses from route handlers and deduped fetches: #100159
- fix(adapter): preserve revalidation for metadata prerenders: #100861
- next-custom-transforms: Optimize server-reference transform output: #100637
- Show dev overlay errors before the indicator state is known: #100629
- Update font data: #100863

### Misc Changes

- Improve common errors in turbo-trace-server: #100862
- docs: clarify use cache is unsupported in Proxy: #100842
- Revert "perf(turbopack): canonicalize async loader availability": #100898
- [test] Cover cache reuse after revalidation and failed writes: #100652
- Turbopack: use analyzed references for fragment facades: #100852
- [ci] Pin deploy test deployments to Node.js 22.x: #100879
- create-next-app: remove App Router prompt and always use App Router: #100850
- Turbopack: fix trailing-slash package root resolution: #100726

### Credits 

Huge thanks to @lukesandberg, @aurorascharff, @sokra, @unstubbable, @jimmyhmiller, @samselikoff, @eps1lon, @timneutkens, and @mischnic for helping!

## v16.5.0-canary.31 (2026-10-29) canary

### Core Changes

- perf(build): lazily require page-data helpers in build/utils: #100822

### Misc Changes

- perf(turbopack): canonicalize async loader availability: #100705

### Credits 

Huge thanks to @sokra for helping!

## v16.5.0-canary.30 (2026-10-28) canary

### Core Changes

- Ignore expected upgrade nudges in Agent Feedback: #100840
- Add model metadata to Agent Feedback: #100806
- Use fast-jwt instead of jsonwebtoken: #100818
- Update font data: #100813
- Turbopack: wait for trace file changes after format errors: #99847
- Add a CLI for reviewing agent feedback: #100739

### Misc Changes

- Add criteria for Vercel Agent code review: #100846
- Add experimental.hydrationChangeEvent flag: #99610
- Turbopack: Move reference to bincode's virtue dependency into a vercel-labs owned fork repository: #100847
- bench: fix nested-deps-app-router-many-pages build harness: #100820
- Fix `export const foo = function bar(){}` in server reference transform: #100830
- turbo-persistence: use partition_point for batch lookup bounds: #100821
- ci: don't run non-adapter + cache components deploy tests in PRs: #100824
- Enforce strict rustdoc (incl. private items) across the Rust workspace: #100768
- Drain the maintainer auto-close queue in one run: #100733
- test: fix native addon compilation on Node.js 26: #100819
- turbo-persistence: parallelize large batch_get reads: #100620
- Turbopack: ignore fully dynamic alternatives when tracing file paths: #100651
- docs: scope whole-route dynamic rendering claim for cookies to the previous model: #100811
- docs: note Suspense requirement for connection() with Cache Components: #100810
- docs: forward allow-listed headers and catch fetch errors in BFF proxy example: #100808

### Credits 

Huge thanks to @acdlite, @bgw, @aurorascharff, @sokra, @mischnic, @devjiwonchoi, @lukesandberg, and @icyJoseph for helping!

## v16.5.0-canary.29 (2026-10-27) canary

### Core Changes

- Create cache directory before persisting Chrome DevTools workspace UUID: #100802
- Upgrade React from `ab0d927f-20261020` to `dc9aed36-20261027`: #100791
- [testmode] Fix compressed HTTP responses with test proxy: #100805
- chore(deps): bump sharp@0.35.5: #99714
- Turbopack: Auto-detect pnpm GVS and configure an additional root for it: #99758
- Persist storage cache in Docker environments: #100790
- Persist fully static PPR payloads in filesystem cache: #100759
- Stamp FileSystemCache revalidations and entries with the monotonic clock: #100357

### Example Changes

- examples: add eve example: #100758

### Misc Changes

- turbo-bitset: make block storage pluggable: #100779
- Use fixed encoding for our 'id' types: #100764
- [RFC] Remove worktree guidance from AGENTS.md: #100659
- eval: resolve and classify the audit suite: #100748
- turbo-tasks-backend: resolve task priority when creating child contexts: #100767
- Add server-only leak pass to next-bundle-optimizer: #100330
- Turbopack: Fix webpack loaders if source file exists in an additional root: #100744
- [CI] fix incorrect VERCEL_TEST_PROJECT in non-cache-components deploy…: #100788
- ci: run changed deploy tests with both builders: #100591
- Turbopack: compute client reference manifest parts once per reference, not per page: #100443
- turbo-bitset: remove FixedBitSet and RoaringBitmap comparisons: #100724
- turbopack: use Bitset for persisted chunk group sets: #100630
- turbopack: use Bitset in compute_merged_modules: #100568
- turbopack: use Bitset in collect_graph: #100567
- turbopack: use Bitset in compute_chunk_group_info: #100643
- turbo-bitset: add Bitset, a fast bitset over a bounded bit range: #100566
- turbopack: speed up and share reverse postorder ranks: #100452
- test: remove some more dev/prod gating: #100717
- ci: Only run upload-adapter-test-results on release: #100595
- Optimize persistence CPU: #100737
- eval: split Next.js evals by purpose: #100742

### Credits 

Huge thanks to @sokra, @chadhietala, @lukesandberg, @kassens, @styfle, @aurorascharff, @wbinnssmith, @bgw, @namtran1812, @skrabe, and @mischnic for helping!

## v16.5.0-canary.28 (2026-10-26) canary

### Core Changes

- Fix draft mode rendering with Cache Components: #100728
- Render complete HTML documents after MPA Server Actions: #100740
- Turbopack: add minServerChunkSize and maxMergeServerChunkSize options: #100712
- test: read isNextDev/isNextDeploy/isNextStart from e2e-utils: #100419
- perf(build): avoid O(pages²) original app path scan in static check: #100615
- [PPF] Fix hanging HTML response after a `'use cache'` error: #100673
- export: only send each static generation batch its own resume data cache seeds: #100048

### Misc Changes

- docs: note that non-function exports of a use cache file are not available to Client Components: #100594
- Mark docs diagrams skill as internal: #100743
- [test] Isolate deploy e2e revalidation scope per suite: #100718
- test: migrate more conditions to gates: #100422
- Support fs.stat in Turbopack webpack loaders: #100272
- test: document deploy exclusions for suites that need a local server: #100483
- Turbopack: ensure tests are dropping turbo tasks correctly: #99601
- turbopack: skip redundant work in merged modules reconciliation: #100238
- turbopack: merge chunk group lists in parallel in compute_merged_modules: #100237
- bench: add warm cached build benchmark to nested-deps-app-router-many-pages: #100570
- turbo-tasks: update reader leaf distance inline when adding output dependency: #99764

### Credits 

Huge thanks to @icyJoseph, @unstubbable, @aurorascharff, @eps1lon, @mischnic, @jimmyhmiller, @sokra, @jamiboym, @arnaud-coral, and @lukesandberg for helping!

## v16.5.0-canary.27 (2026-10-24) canary

### Core Changes

- Build the inline Flight script from React's strings instead of re-encoding them: #100142
- Fix dist dir lockfile on filesystems with no or limited lockfile implementations (e.g. NFS): #100684

### Misc Changes

- perf(turbopack): look up chunk group indices through a keyed cell: #99050
- Turbopack: track availability by chunk group: #98685
- refactor(turbopack): chunk chunk groups by key: #99750
- Turbopack: consume graph-derived chunk groups: #98734
- turbo-tasks-backend: stripe SnapshotCoordinator's operation count and poll for the drain: #100280
- turbo-tasks-backend: parallelize decoding of large batch lookups: #100453
- turbo-persistence: don't shrink the shard count before the first bottom merge: #100424

### Credits 

Huge thanks to @sokra, @lukesandberg, @gaearon, and @bgw for helping!

## v16.5.0-canary.26 (2026-10-23) canary

### Core Changes

- Turbopack: bump trace format header to TRACEv1: #99781
- Pass staged fallback params directly to adapter renders: #100456
- Fix navigation from global-not-found to app routes: #100592
- End the cache-signal read when `encryptActionBoundArgs` hits the RDC: #100622
- Ignore flaky turbo-tasks-fs watcher tests in CI: #100627

### Misc Changes

- test: enable build-error suites in deploy mode: #100482
- test: enable deploy-excluded suites verified against deployments: #100484
- Turbopack: fix trace crates after concurrent trace format changes: #100656
- [cd] Document that Turbopack team can also approve releases: #100650
- Turbopack: delta-encode trace timestamps: #99809
- docs: add turbo_tasks development guidance for agents: #100581
- Fix `pnpm new-test` unit type generating no test file: #100641
- [test] Reproduce two cache-sharing bugs: #100510
- [test] Cover cache sharing after handler failures: #100519

### Credits 

Huge thanks to @jamiboym, @sokra, @eps1lon, @mischnic, @unstubbable, @kassens, @huozhi, and @digasic for helping!

## v16.5.0-canary.25 (2026-10-23) canary

### Misc Changes

- Revert "More parity for webpack loader build dependencies (#99549)": #100634
- Cache bundle analysis per output file: #100475

### Credits 

Huge thanks to @mischnic and @wbinnssmith for helping!

## v16.4.3 (2026-10-23)

> [!NOTE]
> This release is backporting bug fixes. It does **not** include all pending features/changes on canary.

### Core Changes

- [lts-active] Fix extensionless Google font URLs in both bundlers (#100277)
- [lts-active] Don't load the app-page runtime in proxy.ts (#100423)
- [lts-active] Revert "Turbopack: loader change invalidation (#95732)" (#100438)
- [lts-active][cd] Gate release bot credentials behind GitHub environments (#100123)
- [lts-active] test: Pin react-virtualized (#100545)
- [lts-active][cd] Move release un-draft to a follow-up job in bot-autonomous (#100572)
- [lts-active] Keep OpenTelemetry request traces together (#100349, #100294, #100324, #100350, #100552, #100583) (#100542)
- [lts-active] Avoid loading standalone React in server bootstrap (#100610)

### Credits

Huge thanks to @mischnic, @lukesandberg, @acdlite, @eps1lon, and @sokra for helping!

## v16.5.0-canary.24 (2026-10-22) canary

### Core Changes

- Cap bot user-agent matching at 1KB: #100604
- Pass lazy response lifecycle capabilities into App rendering: #100395
- Upgrade testmode interceptors to 0.45.9: #100585
- Defer React loading until fetch dedupe construction: #100401
- Avoid loading standalone React by separating render validation: #100467

### Misc Changes

- fix(turbopack): evaluate pure constructor callees: #100588
- Add webpack utils: #99826
- Stop requiring build-all when bootstrapping a fresh clone or worktree: #100600
- Fix webpack build dependency cell creation order: #100597
- More parity for webpack loader build dependencies: #99549
- Extend lazy server imports to route handlers and Pages: #99541
- test: enable log-file and worker-react-refresh in deploy mode: #100480
- ci: only declare a Vercel deploy target for webpack runs without a custom script: #100479
- Turbopack: Honor PURE annotations for callback arguments: #100577
- test: add non-adapter deploy snapshots to otel-middleware-trace: #100583
- Update Rspack development test manifest: #100557
- Update Rspack production test manifest: #100558
- ci: Fix ast-grep CI step: #100569

### Credits 

Huge thanks to @mischnic, @jimmyhmiller, @eps1lon, @kassens, @jamiboym, and @sokra for helping!

## v16.5.0-canary.23 (2026-10-22) canary

### Core Changes

- Upgrade React from `a6792708-20261019` to `ab0d927f-20261020`: #100527
- Preserve deferred middleware instrumentation spans when the adapter throws: #100552
- Fix cache revalidation queued during streaming: #100448
- Remove unnecessary `as any` casts: #100418
- Update font data: #100490
- Turbopack: preserve chunk load promise identity: #100421
- Emit instrumentation lifecycle spans in the request that registered it: #100350
- docs: note that instrumentation-time spans don't join request traces: #100324
- Keep middleware and render in one OpenTelemetry trace as siblings: #100294
- Start the request span before route module preparation: #100349
- Fix prerender manifest update race in dev: #100521
- Report process memory footprint (RSS) in TurboMalloc and trace samples: #99527
- Preserve cached values for the final runtime prerender: #100447
- Calling server actions in GSP fails `__next_require__ is not a function`: #99912
- fix: persist cacheControl for Pages Router ISR entries in FileSystemC…: #100495
- Remove unnecessary `as any` casts: #100418
- Update font data: #100490
- Turbopack: preserve chunk load promise identity: #100421
- Emit instrumentation lifecycle spans in the request that registered it: #100350
- docs: note that instrumentation-time spans don't join request traces: #100324
- Keep middleware and render in one OpenTelemetry trace as siblings: #100294
- Start the request span before route module preparation: #100349
- Fix prerender manifest update race in dev: #100521
- Report process memory footprint (RSS) in TurboMalloc and trace samples: #99527
- Preserve cached values for the final runtime prerender: #100447
- Calling server actions in GSP fails `__next_require__ is not a function`: #99912
- fix: persist cacheControl for Pages Router ISR entries in FileSystemC…: #100495

### Misc Changes

- [cd] Move release un-draft to a follow-up job: #100571
- Fix analyzer cell creation order: #100562
- [ci] Run flakiness detection under concurrent load: #100525
- [test] Avoid port collisions in concurrent OpenTelemetry tests: #100538
- [test] Avoid port collisions in concurrent keep-alive tests: #100537
- turbopack: use reverse postorder priority in compute_binding_usage_info: #100440
- turbo-tasks: unemit taken collectibles in a single backend operation: #100437
- Bump turbo to 2.11.10: #100549
- Turbopack: lazily compile lazy import.meta.glob matches: #100523
- turbo-tasks: batch invalidation via Invalidator::invalidate_all: #100485
- turbo-tasks: make scope_unbounded worker churn test deterministic: #100515
- Turbopack: test import.meta.glob code splitting with an execution test: #100532
- Turbopack: fix chunking for lazy import.meta.glob matches: #100522
- [test] Stabilize the cache revalidation navigation test: #100514
- Bump to swc v82.2.0: #100508
- turbo-tasks-backend: skip dirtying removed cell dependents: #100460
- docs: use the exported unstable_doesMiddlewareMatch name in proxy unit testing: #100499
- turbo-tasks-backend: restore invalidated tasks with batched optional reads: #100465
- Durable use cache: don't crash on Node workers: #100505
- Turbopack: lazily compile lazy import.meta.glob matches: #100523
- turbo-tasks: batch invalidation via Invalidator::invalidate_all: #100485
- turbo-tasks: make scope_unbounded worker churn test deterministic: #100515
- Turbopack: test import.meta.glob code splitting with an execution test: #100532
- Turbopack: fix chunking for lazy import.meta.glob matches: #100522
- [test] Stabilize the cache revalidation navigation test: #100514
- Bump to swc v82.2.0: #100508
- turbo-tasks-backend: skip dirtying removed cell dependents: #100460
- docs: use the exported unstable_doesMiddlewareMatch name in proxy unit testing: #100499
- turbo-tasks-backend: restore invalidated tasks with batched optional reads: #100465
- Durable use cache: don't crash on Node workers: #100505

### Credits 

Huge thanks to @eps1lon, @zydo, @unstubbable, @sokra, @jamiboym, @sokra, @lubieowoce, @mischnic, @icyJoseph, @koreahghg and @lukesandberg for helping!

## v16.5.0-canary.21 (2026-10-20) canary

### Core Changes

- Defer app router HMR refresh until the router is initialized: #100113

### Misc Changes

- test: extend webpack timeout for dynamic-params-retained-cache: #100382

### Credits 

Huge thanks to @sokra for helping!

## v16.5.0-canary.20 (2026-10-20) canary

### Core Changes

- Upgrade React from `ba39b32a-20261019` to `a6792708-20261019`: #100459
- Pass request headers explicitly into App request stores: #100333
- Remove request from App page prerender entry point: #100331
- Use render lifecycle callback for fetch metrics cleanup: #100323
- Upgrade React from `99c106c4-20261014` to `ba39b32a-20261019`: #100403
- Pass interception capability into App rendering: #100409

### Misc Changes

- [cd] Gate release bot credentials behind GitHub environments: #100121
- test: retry vercel deploy on transient pre-deployment network errors: #100070
- turbo-tasks: batch schedule invalidated tasks and cell dependents: #100446
- turbopack: use reverse postorder priority in compute_merged_modules: #100430
- turbopack: use reverse postorder priority in collect_graph: #100429
- turbopack: use reverse postorder priority in compute_chunk_group_info: #100428
- Turbopack: propagate late partial namespace provenance to passthrough targets: #100444
- turbopack: store unused reference edges in a keyed Vc: #100441
- AGENTS.md: prefer e2e/execution tests over implementation-mapped unit tests: #100451
- docs: document useRouter push/replace void return and useTransition migration: #100420
- docs: type proxy examples with NextRequest and fix cookie check: #100417
- Turbopack: keep env and preview props invalidations key-granular on warm start: #100425
- test: unflake prefetch-fallback-static in deploy: #99366
- Fix Activity testing guide claim about label and placeholder locators: #100445
- [ci] Upload adapter test results via GitHub Actions OIDC: #100400
- turbo-persistence: read compaction inputs with pread instead of mmap: #100336
- test: explain why deploy build-log markers are missing: #100069
- test: bound deploy build-log polling with backoff and per-call timeouts: #100068
- turbo-tasks-backend: remove racy ungated collectibles_outdated_dependency test: #100377

### Credits 

Huge thanks to @eps1lon, @sokra, @Aryan9891, @deveshasawa28, @lukesandberg, @lubieowoce, @icyJoseph, and @kassens for helping!

## v16.5.0-canary.19 (2026-10-19) canary

### Core Changes

- Show compiling status alongside DevTools issues: #100178
- Pass staged fallback params into App rendering: #100408
- Capture initial HMR version in dev render context: #100407

### Credits 

Huge thanks to @aurorascharff and @kassens for helping!

## v16.5.0-canary.18 (2026-10-19) canary

### Core Changes

- Revert "Turbopack: loader change invalidation (#95732)": #100414
- Add <Link prefetch="navigation">: #99871
- remove Static render stage: #100388
- Don't load the app-page runtime in proxy.ts: #100384
- Format all READMEs with Prettier: #100310
- Fix Pages Router HMR crash when the ISR manifest arrives before the router: #100095
- Use os.availableParallelism() instead of os.cpus().length: #100258

### Misc Changes

- test: fix flakiness in segment-cache-stale-time: #100404
- docs: Clarify when useSearchParams boundaries render on the server with Cache Components: #100276
- Clarify which pathname usePathname reads under rewrites: #100393
- test: avoid useTempDir cleanup hang on Windows (fs-extra fixWinEPERM): #100088
- test: run custom install commands async with a hard timeout: #100057
- Clarify lazy SST opening in turbo-persistence docs: #100311
- Bump to swc v82: #100270
- test: disable the `reads fallback params after a client navigation` deployment test: #100371
- test: Pin react-virtualized: #100383
- turbo-persistence: read SST metadata blocks once with pread: #100288
- turbopack: intern merge bitmaps in compute_merged_modules: #100236
- Turbopack: don't scope hoist modules using direct eval: #100308

### Credits 

Huge thanks to @mischnic, @acdlite, @lubieowoce, @icyJoseph, @tobiaslins, @sokra, and @lukesandberg for helping!

## v16.5.0-canary.17 (2026-10-17) canary

### Misc Changes

- turbo-persistence: prefetch multi-page SST blocks with MADV_WILLNEED: #100283

### Credits 

Huge thanks to @lukesandberg for helping!

## v16.5.0-canary.16 (2026-10-16) canary

### Core Changes

- Refactor fetchStrategy -> stage and completeness: #99706
- Remove dead NextNodeServer.renderHTML: #100284
- Pass Server Action request metadata into App rendering: #100274
- Revert "Keep requests through middleware in a single OpenTelemetry trace": #100302
- Respect release age when pinning the upgrade CLI: #100256

### Misc Changes

- test: remove stale deploy gate on cold RSC navigation param caching test: #100285
- Fix upgrade eval worktree dependency links: #100257

### Credits 

Huge thanks to @lukesandberg, @acdlite, @kassens, @devjiwonchoi, and @sokra for helping!

## v16.5.0-canary.15 (2026-10-15) canary

### Core Changes

- Hoist app page request URL into render context: #99269
- Hide overlay editor button labels on smaller screens: #100266
- Prefer non-partial entries regardless of FetchStrategy: #99705
- [Partial Prefetching] Don't report vary params in responses that include dynamic data: #99700
- [Partial Prefetching] Small optimizations and fixes: #99695
- [Cached Navs] Extract the shell from a fully cached response: #99619
- Refactor the navigation fetch and decode layering: #99618
- [Cached Navs] Don't extract static stage: #99617
- Make error overlay editor actions easier to discover: #100206

### Misc Changes

- Turbopack: don't inherit API route config from parent layouts: #100243
- test: Add more segment config tests: #100242
- Add more test coverage for non-Partial Prefetching behavior: #100133
- chore: Remove package.json#workspaces: #100234
- docs: Add Pages Router upgrade guides for versions 15 and 16: #100247
- docs: note that 'use cache: private' results persist across requests in dev: #100252
- test: unskip tests for Turbopack: #100185

### Credits 

Huge thanks to @gnoff, @samselikoff, @mischnic, @acdlite, and @icyJoseph for helping!

## v16.5.0-canary.14 (2026-10-15) canary

### Core Changes

- Upgrade React from `07dde64d-20261013` to `99c106c4-20261014`: #100215

### Example Changes

- docs: type error.js error prop as unknown: #100232

### Misc Changes

- chore: fix turborepo cache for miri unit test job: #100241
- Fix binary trace self-time on same-span re-entry: #100205
- docs: add instant navigation testing to Playwright guide: #100003

### Credits 

Huge thanks to @mischnic, @yousefdawood7, and @icyJoseph for helping!

## v16.5.0-canary.13 (2026-10-15) canary

### Core Changes

- Fix extensionless Google font URLs in both bundlers: #100158
- Emit the Turbopack shared-runtime bootstrap in the PPR resume so it gets the CSP nonce: #100102
- Keep requests through middleware in a single OpenTelemetry trace: #100136
- Write webpack dev manifests atomically: #100112

### Misc Changes

- next-api: isolate dropped entrypoint collectibles in an inner operation: #100187
- turbo-tasks-backend: optimize aggregated updates outside of the lock: #100165
- docs: Add turborepo agents rules: #100214

### Credits 

Huge thanks to @sokra, @andrewimm, and @bgw for helping!

## v16.4.2 (2026-10-15)

## What's Changed
* [lts-active] turbo-tasks snapshot consistency fixes (#99644, #99732, #99649) by @lukesandberg in https://github.com/vercel/next.js/pull/100002
* [lts-active] Turbopack: backport Pages Router dev module graph chaining (#98823, #99910, #100091) by @sokra in https://github.com/vercel/next.js/pull/100008
* [lts-active] fix(next-code-frame): snap visible window to char boundaries by @lukesandberg in https://github.com/vercel/next.js/pull/100212
* [lts-active] [turbopack] Fix two GC paths that leave half-torn-down dependency edges by @lukesandberg in https://github.com/vercel/next.js/pull/100209
* [lts-active] Turbopack: Ignore realpath errors during module resolution, matching node's behavior by @lukesandberg in https://github.com/vercel/next.js/pull/100217
* [lts-active] Backport docs fixes since v16.4.0 by @icyJoseph in https://github.com/vercel/next.js/pull/100246
* [lts-active] Fix Turbopack lazy dynamic-import chunk-list collisions by @lukesandberg in https://github.com/vercel/next.js/pull/100211
* [lts-active] Backport additional documentation fixes since v16.4.0 by @aurorascharff in https://github.com/vercel/next.js/pull/100262


**Full Changelog**: https://github.com/vercel/next.js/compare/v16.4.1...v16.4.2

## v16.5.0-canary.12 (2026-10-14) canary

### Core Changes

- Upgrade from pnpm v10 to v12: #99827

### Example Changes

- docs(examples): fix typo and update HTTP links to HTTPS in example READMEs: #99924

### Misc Changes

- Turbopack: Avoid `serde_json::RawValue` conversions in a few places: #97713
- docs: replace unbounded cacheHandler snippets and fix tag handling in examples: #100186
- Turbopack: don't treat events as relevant because their parent dir is in the watcher batch: #99782
- Fix CI for react 18.3: #100202
- docs: clarify ESLint 10 support: #100198
- ci: remove release eval dispatcher: #100200
- Copy pnpm store to tmpfs for test fixtures: #99960

### Credits 

Huge thanks to @bgw, @karan5028ji, @icyJoseph, @sokra, @lukesandberg, and @aurorascharff for helping!

## v16.5.0-canary.11 (2026-10-14) canary

### Core Changes

- Upgrade React from `b618bbb4-20261007` to `07dde64d-20261013`: #100194
- Remove staticInfo.rsc: #100172
- fix(analyze): use route summaries as the analyzer route index: #100081
- Reload on missed Turbopack startup CSS updates: #99963
- Remove unused getParams matcher cache: #100078
- fix: mark HTTP fetch failures as span errors: #99877
- docs: explain router.prefetch stages: #99786

### Misc Changes

- docs: fix "a HTTP"/"a SSR" grammar and Node.js casing: #99542
- docs: narrow catchError ErrorInfo.error, typed as unknown: #100196
- docs: update links for newly transferred demos: #100197
- ci: update release eval workflow pin: #100189
- ci: run evals for releases and canaries: #100126
- test: speed up use-cache-cross-deployment even more: #100181
- Turbopack: only search <head> for existing chunk tags: #100175
- docs: clarify Server Action dispatch across Mutating Data and the guide: #100144
- test: speed up use-cache-cross-deployment: #100138
- Turbopack: avoid document-wide selector scans when probing for chunk tags: #100047
- Don't optimize the aggregation graph during `connect_child`: #100147
- Simplify aggregation update queue control flow: #100146
- [ci] Fix Rspack test manifest update workflow: #100052
- docs: fix example path regexr: #100084

### Credits 

Huge thanks to @deveshasawa28, @icyJoseph, @aurorascharff, @mischnic, @wbinnssmith, @sokra, @kakadiadarpan, @lukesandberg, and @sabrinaluo for helping!

## v16.4.1 (2026-10-14)

This release contains security fixes for the following advisories:

Critical:
- [Unauthenticated Remote Code Execution in `use cache` functions returning typed arrays](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr)
- [Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)

High:
- [Denial of Service in App Router using Server Actions](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r)

## v15.5.28 (2026-10-14)

This release contains security fixes for the following advisories:

Critical:
- [Unauthenticated Remote Code Execution in Image Optimization API when SVG files are used](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)

High:
- [Denial of Service in App Router using Server Actions](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r)

## v16.5.0-canary.10 (2026-10-13) canary

### Core Changes

- docs: make agent feedback command work in npm workspaces: #100135
- test: install local Next.js sibling packages in CNA tests: #100062
- Don't blame the Pages Router for next/headers imported through a Client Component: #100087
- Resolve relative imports in `next.config.ts` from the config directory: #99743

### Misc Changes

- Update evals for stabilized navigation APIs: #100145
- Turbopack: improve segment config parsing: #98641
- docs(cache-handlers): explain updateTags durations, fix Redis EX for Infinity: #96517
- Turbopack: Use the imagesize crate to correctly size AVIF images (still no optimization or encoding): #99966
- Fix Turbopack lazy dynamic-import chunk-list collisions: #99940
- Turbopack: de-flake the active Tokio worker count test: #100120
- Turbopack: preload _app's next/dynamic chunks with _app's own availability: #100091
- test: deflake app-basepath external redirect test: #100096
- turbopack-ecmascript-runtime: simplify the shared HMR module instantiation: #99671
- chore: Make Rust warnings non-fatal unless on CI: #99939
- Fix rustdoc warnings: #100036
- Durable use cache: ignore binding usage when traversing: #100128
- chore: Fix agents instruction about rebuilding test changes: #100116
- chore: Prevent concurrent pack-for-isolated-tests: #100118
- Split filesystem-cache e2e test into multiple suites: #100111
- docs: update links to demos moved to the nextjs org: #100119
- test: allow custom webpack deployments to complete: #100054
- Turbopack: fix edge route handlers when cacheHandlers is configured: #100046
- fix(next-code-frame): snap visible window to char boundaries: #92646

### Credits 

Huge thanks to @aurorascharff, @mischnic, @leejpsd, @bgw, @jimmyhmiller, @devjiwonchoi, @sokra, @lukesandberg, @icyJoseph, @mugi-uno, and @dxdc for helping!

## v16.5.0-canary.9 (2026-10-12) canary

### Core Changes

- Gate upgrade reminder rules with agentUpgrade: #99990
- Enable network access for Codex upgrades: #100074
- Make it possible to disable `turbopackGc`: #100067
- fix: use EntryKeySide in EntryKey side field: #100053
- fix: use removePathPrefix instead of regex: #100063
- Fix root params detection on Windows: #100065
- Durable use cache: exclude context for path and code hashes: #99898
- Ensure `workStore.page` is unnormalized for generateStaticParams: #99881
- fix(codemod): find bundled docs via workspace packages in agents-md: #100017
- fix(codemod): make agents-md docs root relative to the output file: #100016
- docs: link ensureStatic TypeScript hints to its API reference: #100033
- fix: scope managed agent-feedback wording so it limits feedback, not verification: #100020
- Keep dev code frames sized to the terminal after a resize: #99916

### Example Changes

- Add cache-handler-redis-turbo example (Next.js 16 Cache Components + Redis): #96622

### Misc Changes

- Narrow upgrade eval triggers: #100075
- docs: update links for transferred demo repositories: #100041
- Expand durable use cache cross-deployment test coverage: #99900
- [cd] Support non-LTS releases: #99948
- docs: clarify Cache Components runtime config: #99820
- fix(next/image): annotate Image export so deprecated props show as deprecated: #98597
- turbo-tasks: lock-free priority queue for lowest-priority tasks, skip heap lock when empty: #99773

### Credits 

Huge thanks to @devjiwonchoi, @aurorascharff, @lukesandberg, @mischnic, @sokra, @eps1lon, @JannikZed, @awss1i, and @franpeza for helping!

## v16.5.0-canary.8 (2026-10-10) canary

### Core Changes

- Don't parse error message lines as stack frames in the server error inspector: #99888
- Turbopack: Remove webp feature flag, always build with webp enabled: #99964

### Misc Changes

- [turbopack] Remove per-shard modified counts from snapshots: #99955
- Enable GC by default on canary: #99596
- [turbopack] Fix two GC paths that leave half-torn-down dependency edges: #99902

### Credits 

Huge thanks to @lukesandberg and @bgw for helping!

## v16.5.0-canary.7 (2026-10-09) canary

### Core Changes

- Reland experimental custom webpack support: #99234

### Misc Changes

- Add CI for upgrade evals with shared preparation: #99908
- Rebuild upgrade evals around delivered apps: #99880
- Upgrade Corepack to 0.34.7: #99959
- Upgrade Turborepo to 2.11.7: #99958
- Normalize pnpm store cache keys: #99957
- test: cover Pages Router _app availability in Turbopack dev (#99789): #99910
- Turbopack: chain the Pages Router development client module graph: #98823
- turbopack: report an actionable error when Node.js child processes cannot connect: #99887
- Turbopack: Ignore realpath errors during module resolution, matching node's behavior: #99951
- test: add a `vercel` gate condition for Vercel-specific deploy tests: #99837
- test: remove per-test Corepack overrides now that deploy mode enables it: #99945

### Credits 

Huge thanks to @devjiwonchoi, @bgw, @sokra, @lukesandberg, and @jamiboym for helping!

## v16.5.0-canary.6 (2026-10-09) canary

### Core Changes

- Add more metadata to agent upgrade telemetry: #99925
- perf: reduce build tree view allocations: #99930
- fix: classify collapsed generated paths from child routes: #99864
- Upgrade React from `d75b0697-20261006` to `b618bbb4-20261007`: #99879

### Misc Changes

- docs(skills): use agent-agnostic branch prefix in create-pr: #99934
- [test] Regression test for XSS-safe `GoogleTagManager#dataLayer`: #99464
- [image-optimization] Expose `next/image-optimizer-transform` as a public subpath: #99312
- fix(next): register the chunk groups that are chunked: #99749
- refactor(turbopack): chunk several chunk groups in one chunk_group call: #99686
- Turbopack: canonicalize chunk group identity: #98733
- Turbopack: add zstd compression flags for NEXT_TURBOPACK_TRACING: #99808
- Turbopack: omit Exit+Enter trace row pairs with (almost) no gap: #99780
- Turbopack: delta-encode trace allocation counters and skip unchanged ones: #99779
- Turbopack: merge allocation counters into trace Enter/Exit rows: #99778
- [cd] Replace versioned release branches with fixed `releases/lts/*` refs: #99807
- test: Really use pnpm on deploy tests: #95360
- test: compare cache-control directives as a set in deploy tests: #99892

### Credits 

Huge thanks to @devjiwonchoi, @aurorascharff, @sokra, @eps1lon, and @mischnic for helping!

## v16.5.0-canary.5 (2026-10-08) canary

### Misc Changes

- Update error strings for a few deployment tests: #99886
- Increase timeout on module-scope deployment test: #99891
- Fix google tag manager e2e test, assume GTM 200s instead of 404ing: #99896

### Credits 

Huge thanks to @bgw for helping!

## v16.5.0-canary.4 (2026-10-08) canary

### Misc Changes

- docs: align function sidebar titles: #99858
- Fix telemetry delivery on Node.js 24: #99842
- [test] Authenticate deploy tests via VERCEL_TOKEN instead of shared auth.json: #99846
- Replace deprecated React.FormEvent with SubmitEvent: #99821
- turbo-tasks-fs: Don't print NotFound watcher errors: #99794
- Revert "[ci] Increase deploy test concurrency to 8": #99840
- Bump next in upgrade eval fixtures for CVE-2026-94483: #99838
- turbopack: don't report unactionable 'stopping failed' warnings: #99823

### Credits 

Huge thanks to @aurorascharff, @devjiwonchoi, @eps1lon, @kassens, @sokra, @bgw, and @lukesandberg for helping!

## v16.5.0-canary.3 (2026-10-07) canary

### Misc Changes

- Document `next analyze export` and skill are added in 16.4: #99738
- create-next-app: write agent feedback block to AGENTS.md when enabled: #99813
- [turbopack] fix some unused dependencies: #99825
- Fix next-bundle-optimizer skill handoffs: #99818
- [ci] Increase deploy test concurrency to 8: #99770
- Upgrade React from `278794d7-20261002` to `d75b0697-20261006`: #99819
- Turbopack: fix turbo-trace-size test after MemorySample gained active_worker_threads: #99824
- Turbopack: batch EsmBinding codegen: #99722
- Turbopack: add no-memory flag to NEXT_TURBOPACK_TRACING: #99777
- Turbopack: add turbo-trace-size CLI to inspect trace file size: #99765
- Use ESLint 10 in new create-next-app projects: #99814
- Fix instant codemod matching colocated test files: #99795
- turbo-trace-server: speed up loading compressed traces: #99775
- Upgrade rustc to nightly-2026-10-04: #99682
- Bump to swc v81: #99720

### Credits 

Huge thanks to @wbinnssmith, @aurorascharff, @kassens, @eps1lon, @sokra, @mischnic, and @devjiwonchoi for helping!

## v16.5.0-canary.2 (2026-10-07) canary

### Misc Changes

- [cd] Use pnpm to manage the version: #99041
- fix: Bump vendored @mswjs/interceptors from 0.42.5 to 0.42.6: #99485
- Turbopack: Minor cleanup from review of #99711: #99748
- Exclude blocking spans from trace work accounting: #99685
- Sample global trace concurrency across span ranges: #99254
- Trace active Tokio worker threads with memory samples: #99233
- Turbopack: report next/font/google font file fetch failures instead of Module not found: #99574
- Update font data and fix no-subsets font fixture: #99753

### Credits 

Huge thanks to @eps1lon, @blz-ea, @bgw, @sokra, @abhayymishraa, and @wbinnssmith for helping!

## v16.5.0-canary.1 (2026-10-06) canary

### Misc Changes

- [turbo-tasks] Experiment: capture snapshot pending bits under exclusion: #99747
- Keep custom-route metadata outside configuration: #99508
- turbo-tasks: copy tasks on their first modification during a snapshot: #99649
- turbo-tasks: disable persisting after a failed snapshot: #99732
- turbo-tasks: bincode-encode copy-on-write snapshots instead of cloning: #99644

### Credits 

Huge thanks to @lukesandberg, @gnoff, and @sokra for helping!

## v16.5.0-canary.0 (2026-10-06) canary

Initial release

## v16.4.0 (2026-10-07)

Check out the [16.4 announcement post](https://nextjs.org/blog/next-16-4) to get an overview of the changes.

### Core Changes

- Show compiler plugin warning in more situations: #75682
- fix(scripts): correct typo in rm.mjs error message: #87015
- docs: improve clarity and punctuation in README: #86096
- Fix debug build paths Pages Router support entries: #93529
- bundle-analyzer: record historical snapshots on each analyze run: #93520
- fix: detect proxy.ts correctly with compound pageExtensions: #93246
- feat(turbopack): support `false` values for `resolveAlias` config: #93331

### Misc Changes

- docs: correction to dynamicParams migration: #96624
- docs: proxy event argument: #96435
- docs: remove experimental note from runtime prefetching: #96615
- Preserve per-segment prefetching after dynamic navigation: #96583
- Rename static generation stream option to waitForAllReady: #96564
- Remove obsolete static generation plumbing: #96563
- [turbopack] Drop dead writes to `exports`: #96381
- [turbopack] Ignore writes to `exports` after a `module.exports = {}` writes: #96380
- [turbopack] Add test for sideEffects with optimizePackageImports: #96549
- [turbopack] Strip leading BOM before parsing CSS: #96678
- Upgrade React from `cbb046ab-20260731` to `7dfc7ccd-20260803`: #96550
- docs: use relative doc links in instant-navigation error pages: #96672
- Turbopack: terminate failed plugin worker threads: #96592
- Fix HTML-limited bot matching in prerender bypass rules: #96584
- [ci] Fix create_release_branch for new repo permissions: #96641
- test: skip action module instance deploy test: #96629
- docs: quote the dynamicParams build error in a blockquote: #96633
- [react-sync] Open pull requests as the bot that authors the commits: #96682
- [Bench] Fixes for pure Fizz bench: #96771
- Derive foreground cache revalidation from the consumer: #96731
- Fix race when navigating Back before hydration: #96252
- docs: present each Skill as steps in the AI agents guide: #96751
- Reuse completed cache entries for the rest of a request: #96727
- Upgrade React from `7dfc7ccd-20260803` to `11eddecd-20260805`: #96735
- Remove WorkStore execution mode: #96674
- Remove cache revalidation execution mode reads: #96670
- Separate App Route render and prerender pipelines: #96662
- Remove App Page execution mode reads: #96660
- test: fix missing await in css-chunking test: #96725
- docs (Skills): stop assuming app/ at the root and port 3000: #96696
- Implement next/font BeforeResolvePlugins as ImportMappingReplacement: #95808
- Use Tailwind Turbopack loader in create-next-app: #96606
- docs: instant navigation quick start with an adoption prompt: #96663
- Separate App Page render and prerender pipelines: #96659
- Move App Router execution intent to entrypoints: #96640
- Pass explicit render capabilities through App Render: #96576
- Pass explicit prefetch hint policy through App Render: #96572
- Replace WorkStore isStaticGeneration with executionMode: #96570
- docs: document ! exclusion and src/ prefix for --debug-build-paths: #96703
- Change `loadManifest` to return undefined with `handleMissing`: #96530
- Refactor server from CacheNodeSeedData -> TransportData: #96679
- Unify full/partial navigation response types: #96439
- Unify RouteTree and CacheNodeSeedData on the client: #96406
- Consolidate Promise.withResolvers polyfills: #96772
- [ci] Open automated update pull requests with `nextjs-bot`: #96683
- Require Cache Components for Instant Navigation testing: #96745
- Fix use cache over- and under-invalidation in dev: #96235
- Fix which pages the dev server announces, and when: #96250
- docs: update redirected links to current targets: #96723
- Fix(deployment-id): prevent exception on old webkit: #94604
- [fragment-scroll] Remove `config.experimental.appNewScrollHandler`: #95602
- [turbopack] Enable reexport-unknown execution test: #96774
- ci: stop publishing @vercel/devlow-bench: #96887
- fix(turbopack): name the module in the non-ESM-placeable error, and stop duplicating the importer in traces: #96560
- fix(turbopack): support `type: 'text'` in rules, and error on binding imports of non-ESM modules: #96558
- Lint devlow-bench with the root eslint config: #96871
- Remove `turbopack/packages` and relocate devlow to `packages/`: #96860
- Flush pending revalidations for forwarded action error responses: #96945
- Handle Server Actions on dynamic PPR fallback routes: #96932
- Turbopack: Improve how DiskWatcher is configured and fix polling watcher bugs: #96440
- Turbopack: Allow DiskWatcher to use a mocked DiskFileSystem, add a small unit test: #96353
- [turbopack] Add e2e test that uses component chunks + workers: #96556
- [turbopack] Support `experimental.serverMinification` & expand `experimental.turbopackMinify`: #96578
- Add a `turbopackChunking` documentation page for pages router: #96698
- [turbopack] Don't run Webpack tests on Turbopack-only changes: #96656
- [turbopack] Enable the shared runtime by default: #96778
- [turbopack] Enable CJS tree shaking by default: #96779
- refactor: clean up places that needlessly list all RenderStages: #96907
- Fix the documented invocation for generating tests non-interactively: #96896
- Make NextConfigComplete typing more accurate: #96700
- Upgrade to swc 75: #96702
- docs: link View Transitions skill on skills.sh and clarify the example prompt: #96863
- [ci] Reset the turbopack deploy test project in the weekly cron: #96822
- docs: add authentication with Cache Components guide and iron-session example: #95802
- [turbopack] Fix a potential deadlock in scope_and_block: #95695
- Remove the turbopack-build-events trace span, use `next build` instead: #96746
- docs: add `export const dynamic = 'force-static'` to Route Handlers example on Static Exports: #96964
- [turbopack] Follow re-exports for side-effect free async modules: #95993
- [turbopack] Treat constants with values referencing other values as unsafe: #96190
- [refactor] Rename `encodeCacheTag` to `encodeHeaderSafe`: #96936
- Fix formatting of Google Fonts section in documentation: #88447
- Fixing a bug - typo issue fixed: #97141
- examples: fix Webiny API env variable name: #97134
- docs: fix Link prefetch grammar and Client Components wording: #97132
- Use emitted app entries for post-build processing: #97139
- docs(mdx): fix package name in .md handling section: #97131
- [turbopack] Reduce native React Compiler work: #96820
- docs: rename repo to repository for consistency: #87849
- Fix typo in Data Access Layer section: #87202
- docs: runtime prefetching -> optimizing prefetching: #96934
- [CC] Track APIs that cause incompatible static/app shells: #97040
- Fix client component loading span timing: #96455
- Trace development route compilation: #96454
- Prefix `'use cache'` debug logs with the full directive: #97037
- Revert "[turbopack] Enable CJS tree shaking by default (#96779)": #97018
- Revert "[turbopack] Follow re-exports for side-effect free async modules": #97009
- [fragment-scroll] Rename `ScrollAndMaybeFocusHandler` to `ScrollHandler`: #96828
- Trace development route preparation: #96453
- test: cleanup Turbopack snapshot config: #97013
- Remove unused htmlLimitedBots from renderOpts: #96701
- fix(turbopack): point at the glob that matched a file with no module type: #96561
- [turbopack] Bail CJS tree-shaking on `var x = module.exports = {}`: #97130
- docs: server client and directives: #96145
- docs: clarify client cache freshness after hydration: #97180
- docs: create client-side fetching guide: #96341
- Turbopack: accept a module type argument for import.meta.glob: #96991
- docs: align Cache Components authentication guide title: #97143
- test: re-enable a few more passing NFT unit cases: #97017
- [turbopack] Do the CJS analysis needed for scope hoisting: #95826
- Remove legacy PPR code paths: #96868
- Use Cache Components as the internal PPR signal: #96827
- Make legacy PPR paths explicit: #96753
- fix: typos in code comments: #97137
- Fix spelling in two comments: #97136
- Decouple loader tree construction from children ordering: #97192
- Bump lightningcss: #97159
- Update gh-stack skill guidance: #97163
- [test] Unflake `use-cache-custom-handler-dev` tests: #97187
- Forward a build-container pin to deploy-test deployments: #97191
- Fix shared Turbopack runtime initialization race: #97215
- Fix stale data after navigation despite revalidation: #95439
- [turbopack] Only use the shared runtime by default on canary: #97208
- test: fix 'ouput' typo in parseIdsFromCliOutput: #97266
- Add the mtime fallback back: #97268
- Allow issue participants to request reopening: #96947
- [turbopack] Document clusters for chunking: #97267
- Link to issues in the contribution guide and discourage trivial PRs: #97188
- Stop serializing hmr version state: #97146
- [turbopack] Add `clusters` to chunking heuristics: #95157
- [test] Redirect the deployment host in-process for proxy deploy tests: #97260
- [test] Unflake two `cache-components-dev-streaming` assertions: #97246
- [test] Unflake `use-cache-default-profile-expire-zero` tests: #97250
- Allow running `ncc` before `pnpm build`: #97234
- Invalidate deferred Webpack entry sources: #97205
- Unify how a response's shell and full payloads are written: #96878
- Convert per-segment prefetches to NavigationFlightResponse format: #96877
- Unify how server responses are written into the client cache: #96876
- Convert tree prefetches to NavigationFlightResponse format: #96788
- fix(next/image): skip 0-byte entries when initializing disk LRU cache: #94068
- Update authentication diagram URL: #97320
- Add a script for adopting fork pull requests: #97252
- Migrate napi-rs bindings from v2 to v3: #95412
- Upgrade React from `11eddecd-20260805` to `22e4f993-20260811`: #97249
- Add RDC compression rollout controls: #97247
- [testmode] Fix infinite recursion in testmode passthrough fetch: #96525
- Turbopack: add imports_wildcard NFT unit test: #97373
- Turbopack: improve chunk_item_content docs: #97370
- test: Reenable i18n-api-support deploy test for Turbopack with adapters: #96898
- Trace instrumentation startup: #97296
- Trace route module preparation: #97295
- Trace route module loading: #97318
- fix(deps): bump `satori` and `@vercel/og`: #97276
- [test] Cover `'use cache: private'` in route handlers: #97349
- Fix missing Pages runtime in adapter Pages API outputs: #96819
- docs: align SPA guide reducer example with React conventions: #97341
- Update blob version.: #97342
- Upgrade React from `22e4f993-20260811` to `eb8feb71-20260814`: #97382
- Adopt SelectedMetadata for metadata rendering: #97387
- fix(next/image): reject empty image on read/write to disk cache : #97278
- Turbopack: remove stale manifests for deleted routes: #97333
- Turbopack: make unreachable codegen more generic: #97385
- Wait for back-before-hydration recoveries in the browser: #97321
- Extract metadata resolution primitives: #97388
- test: update React 18 redbox snapshot: #97415
- Remove server route matcher stack: #94157
- Anchor the async local storage instances to global symbols: #97255
- test: deflake use-cache-size-zero warm reload: #97421
- Scaffolding for concurrentRouterQueue flag: #97413
- Reorganize client router modules: #97402
- fix(turbo-persistence): allow 32-bit usize conversion: #97288
- test: restore missing NFT `exports*` unit fixtures: #97459
- [ci] Fix backport canary release dispatch: #97383
- turbo-tasks-backend: Enforce that tasks exist when accessing them: #96043
- turbo-tasks-backend: add persistence delete/tombstone plumbing for GC: #95975
- turbo-persistence: add key-value tombstones for MultiValue families: #96929
- Trace lazy App Route module loading: #97439
- [ci] Wait for the `next` version to be available on npm before deploy tests: #97460
- docs: fix stale Dev Overlay README link in contributing guide: #97486
- docs: app router reference accuracy: #97477
- test: Don't wait trying to load non-existing images: #97488
- test: cover dynamic APIs with i18n base path: #97367
- style(examples): remove redundant justify-content declaration: #97222
- docs: rename Vercel Edge Config to Global Config in redirecting guide: #97456
- fix: improve form accessibility by associating labels with inputs: #96335
- [docs] fix: grammar typos in linking and navigating guide: #95544
- fix(examples): correct error message typo: #97223
- docs: fix typos in example links: #97149
- Model prerenders as render candidates: #97431
- Turbopack: support character class ranges in regex: #97502
- docs: warn when catching permanentRedirect: #97496
- Remove the development debug channel persistence: #97510
- Stop the browser from restoring stale pages in development: #97505
- Turbopack: gracefully handle outputFileTracingIncludes matching a symlink: #97507
- docs: mention Valibot as validation library option in forms guides: #97468
- [PPF] Remove `unstable_eager`: #97524
- [PPF] Do not mark complete shell requests as partial: #97503
- fix: add accessible label to icon-only link: #96334
- Fix stale cross-references in skills/: #97566
- docs: generateMetadata values should be serializable with use cache: #97551
- Move preview props into separate manifest: #96004
- docs: adjust interactive app guide: #97558
- Turbopack: allow TURBOPACK_PRINT_CHUNK_GROUPS in release builds: #97515
- [test] Point next-image-legacy images at a reachable endpoint: #97545
- test: improve error-on-next-codemod-comment flakiness: #97553
- Turbopack: cross-module constants: #90300
- test: better isolate concurrent-install suite: #97546
- docs: outlining and lcp: #96942
- Turbopack: More aggressively debounce filesystem watch events if we detected changes to node_modules: #96116
- docs: document metadata pagination field: #95509
- docs: document deploymentId build ID override and Pages Router skew in 16.2: #97645
- Upgrade React from `eb8feb71-20260814` to `eafeac09-20260819`: #97636
- Turbopack: rename to use turbopack: no side effects: #94427
- refactor: move useDynamic{Route,Search}Params to reduce snapshot churn: #97360
- [PPF] unstable_navigation(): #96908
- [PPF] Scaffold unstable_navigation(): #97236
- docs: Explicit cache output description: #97548
- Improve Cache Components sync IO migration guidance: #97572
- [test] Use a non-native stub for the server externals list test: #97614
- Avoid GitHub API rate limits for create-next-app examples: #97612
- [test] Cover the prerender worker-thread backend with an addon we control: #97543
- [test] Convert the `prerender-native-module` suite to local fixture packages: #97542
- [test] Replace the `turbopack-reports` `sqlite3` dependency with a local addon fixture: #97541
- [test] Drop the dead `sqlite3` build approval from the `sharp-basic` suite: #97540
- Remove HmrTarget: #97253
- Keep HMR instructions typed until serialization: #96569
- Serialize frozen collections by value only: #96686
- feat(turbopack): isolate HMR listeners across microfrontends: #95997
- Turbopack: deduplicate Pages Router app chunks: #97664
- [react-sync] Check assignability before assigning the actor: #97638
- fix: preserve trailing slash during export MPA fallback: #97613
- Turbopack: Split the read and write codepath data structures for symlinks: #97395
- Turbopack: Show last modified file when waiting for the filesystem to settle: #97648
- docs: fix parallelRouteKey parameter name in useSelectedLayoutSegment(s): #97710
- Turbopack: Avoid cloning paths in fs watcher if the path is already in a map: #97655
- Remove generated error codes: #97687
- [PPF] Instant validation for unstable_navigation(): #97309
- Turbopack: trace graceful-fs calls: #97694
- Migrate some async blocks to async closures: #97666
- turbo-tasks: add scope_unbounded, a scoped execution primitive that allows more work to be discovered: #95974
- test: make app-document-import-order more robust: #97682
- Add a Turbopack error for missing root layouts: #97639
- Improve Partial Prefetching adoption checks: #97637
- test: stabilize poisoned proxy error overlay: #97609
- docs: correct the upper stale bound for App Shell exclusion in cacheLife: #97653
- docs: Adapters entry page lists its children pages twice: #97677
- [PPF] unstable_prefetch(): #97622
- [PPF] Scaffold unstable_prefetch(): #97618
- docs: clarify beforeInteractive placement for root layouts: #97643
- fix(turbopack): give eager `import.meta.glob` values the ESM namespace: #96559
- introduce an options struct for constructing backend storage: #97284
- [devtools] Fix indicator dragging on touch screens: #97723
- Add next/cache-handlers types entrypoint: #97592
- Remove unused return values from getPageStaticInfo: #97661
- [turbopack] defer NFT module content hashes: #97773
- test: deflake basePath external navigation: #97611
- docs(adapters): document assetsHashes and routing.middlewareMatchers: #96536
- Migrate remaining async blocks to async closures: #97701
- Turn off the adapter route collapses by default: #97774
- Serve a run of fallback shells from one route entry: #97738
- [test] Capture the route table for apps with several param shapes: #97728
- Stop emitting a separate route entry for a dynamic route's RSC form: #97726
- Stop emitting a redundant route per prefetch segment: #97720
- [test] Capture the dynamic routes a build passes to an adapter: #97719
- turbo-tasks: compile conditional cell updates once, not per cell type: #97763
- Turbopack: add unit test coverage for FileSystemPath::hash_file: #97743
- Record fallback cache lifetime for blocking PPR routes: #97821
- Document catchError for the Pages Router: #97748
- clippy: allow needless late init where it makes sense: #96410
- Turbopack: emit/collect: #96631
- docs: note that response headers must be set before calling handle() in a custom server: #97693
- Deduplicate the regress, wat/wasmparser and base64 dependencies: #97762
- perf: split cold TurboMalloc accounting paths: #97767
- turbo-tasks: execute scheduled tasks inline when they are read: #96808
- Revert "Record fallback cache lifetime for blocking PPR routes (#97821)": #97835
- Sweep stale Turbopack output from distDir on dev startup: #97591
- Fix metadata prefetch cache key for search params: #97729
- Turbopack: Improve file existence error handling in realpath_with_links and in module resolution: #97717
- Write traces with buffered synchronous IO: #96874
- fix(wasm): don't enable SWC's plugin host for wasm targets: #97859
- fix(turbopack-node): make process_pool inert on wasm: #97858
- fix(turbopack): make the SWC wasm-plugin backend native-only: #97857
- fix(turbopack-trace-utils): skip the ctrl-c handler on wasm: #97856
- refactor(turbopack-cli-utils): replace crossterm with owo-colors: #97855
- fix(turbo-tasks-fs): create symlinks through the WASI API on wasi: #97854
- fix(turbo-tasks): compile EventListener::wait on wasm: #97853
- fix(turbo-rcstr): allow the napi feature on wasm targets: #97852
- fix(next-napi-bindings): detect the target, not the host, in build.rs: #97576
- Stop printing a stack frame for error message text: #97829
- docs: clarify revalidateTag profile expire semantics: #97836
- docs: param access on use-server: #97865
- docs: fix typos and correctness issues in App Router docs: #97823
- Add deploy release test skill: #97563
- [test] Deflake the page config test for a string config value: #97848
- test: stabilize read-only page recreation: #97674
- Show the errors of an AggregateError behind a cause: #97830
- Upgrade React from `eafeac09-20260819` to `bd6ea412-20260824`: #97812
- fix: reuse a single drain listener when piping Node streams through gzip: #97698
- test: preserve server cache after compile error: #97724
- Fix Turbopack resolution through chained symlinks: #97825
- Add evals for whether agents actually use Next.js: #97816
- evals: judge behavior instead of matching source text: #97826
- Bump @vercel/agent-eval to 2.2.1: #97885
- feat(turbopack): resolve `/`-rooted imports from the project directory: #97799
- [ci] Use short-lived access tokens for preview-build uploads instead of static token: #97256
- Turbopack: correctly trace through TypeScript `__importStar`: #97697
- [turbopack] simplify ecmascript effect queue: #97771
- Update default Create Next App favicon: #97634
- fix: don't drop client references when the concatenated module id is 0: #97936
- Replace resumed render bailout error with ReactDOM.browser behind a flag: #96844
- Replace useSearchParams bailout error with ReactDOM.browser behind a flag: #96843
- Replace CSRBailout error with `ReactDOM.browser` behind a flag: #96826
- fix(next/image): reject non-2xx internal image responses: #97957
- [test] Pin Vercel CLI to Node 20.9 compatible version: #97960
- Re-enable AVIF image optimization: #97931
- Don't report a client-aborted RSC stream as a render error: #96715
- [PPF] Only track runtime accesses when the promise is used: #97165
- Fix Turbopack re-export cycle deadlock: #97933
- Port React's @gate test directive to the e2e harness: #96228
- Migrate from box_patterns to deref_patterns: #97924
- Turbopack: expose list of non-inlined env vars: #95310
- feat(turbo-tasks-fetch): stub HTTP on wasm targets: #97585
- fix(turbo-rcstr): make TaggedValue usable on wasm: #97577
- docs: explain origin matching for allowedOrigins and allowedDevOrigins: #97805
- Turbopack: improve Pat::Assign modelling in analyzer: #97867
- Upgrade rustc to nightly-2026-08-20: #97665
- Upgrade React from `bd6ea412-20260824` to `f789f203-20260825`: #97887
- [test] Fix flaky build CLI output capture: #97900
- turbo-tasks-backend: parent_count reference counting: #95976
- Upgrade Turbopack to hashbrown 0.15: #97808
- ci: skip framework tests for agent evals and skills: #97998
- Expand Turbopack dev cleanup: #97833
- Add Cache Components option to create-next-app: #97695
- Mark deploy release test skill as internal: #97961
- Turbopack: shorten CSS module class names: #97944
- Prune incomplete parallel route matchers: #97108
- Upgrade React from `f789f203-20260825` to `29d9d318-20260826`: #97995
- docs(skills): preserve prefetched UI during Partial Prefetching adoption: #97712
- Omit undeclared children slots from app routes: #97184
- Turbopack: widen the chunk ident hash from 7 to 13 base38 chars: #97945
- Fix request-context retention in the default use cache handler: #97941
- docs: improve discovery summaries: #97982
- test: add test for local font with deployment id: #97987
- Retain interception route host slots: #97242
- test: disable flaky sync-io-blocks-root.test.ts: #97986
- [test] Drain build output before start: #97947
- Expose durableUseCacheEntries config in workStore: #97926
- Pages Router: Deprecate React 18 support: #97689
- Turbopack: call loadActionManifest for app-route: #97921
- [test] Unpin Vercel CLI version: #97974
- Turbopack: don't replace single-arg calls with argument in analyzer: #95277
- Turbopack: allow compiling turbopack-node without a pool backend: #97943
- Support immutable static assets with `output: 'export'`: #97711
- Fix build error when aliasing `typescript` to `@typescript/typescript6`: #97942
- Fix optimistic routing for encoded dynamic params: #97948
- Fix intercepted route params after Proxy rewrites: #97953
- [PPF] Fix navigation() in prospective runtime prerenders: #98000
- Revert "test: re-enable sync IO root coverage": #98050
- Turbopack: drop rust analyzer skip annotation: #98047
- Turbopack: add next_config.use_react_experimental getter: #98032
- More granular cache keys for use-cache entries: #95233
- [ci] Remove dormant `code_freeze` workflow: #97756
- test: re-enable sync IO root coverage: #97996
- [ci] Remove the unused `wrong-issue-template` workflow and action: #97749
- [image-optimizer] Refactor into lightweight transform module: #97988
- [ci] Remove the stale-issue workflow: #97758
- [ci] Use presigned URLs to upload preview builds: #97922
- Turbopack: allow `get_definable_name` to return a list: #97984
- docs(examples): document env var handling in the Docker examples: #97968
- Turbopack: unify `member` and `in` handling: #97985
- Update outdated snapshots: #98011
- Guard filesystem reads against unresolved symlinks: #97902
- Turbopack: enable export mangling by default in production builds: #97676
- Turbopack: mangle exported names for smaller bundle sizes: #97672
- [ci] Remove the popular workflow and its action: #97753
- Store keys in key order in SST blocks that omit hashes: #97480
- Honor non-interactive mode in upgrade codemod prompts: #98030
- Transform .mjs files with Next.js codemods: #98029
- evals: stop requiring the removed viewTransition flag in agent-043: #98116
- errors: shorten "use cache" messages and unify them into one factory: #94300
- test: add adoption skill evals: #97759
- Upgrade React from `29d9d318-20260826` to `ff7445e6-20260831`: #98113
- [ci] Simplify `upload-preview-tarballs` workflow: #98109
- devlow: use commander for cli argument parsing: #93860
- [PPF] Pass in original searchParams for private-cache pages: #98041
- docs: document create-next-app Cache Components prompt and flag: #97798
- lazy server hmr: #96566
- Fix Turbopack HMR recovery after dropped connections: #97966
- test: Improve test cache handler implementations: #98098
- docs: Fix the documented contract for custom cache handlers: #98039
- chore: remove unused code from image optimizer: #98060
- docs: add layout stability guidance for videos and iframes: #98070
- tests: Improve use-cache-cross-deployment tests: #98049
- turbo-tasks-malloc: report memory from mimalloc: #97761
- Remove Edge runtime handling in use-cache-wrapper: #98139
- Skip discussions in the `issue_lock` workflow: #98146
- [ci] Fix `issue_lock`: #97755
- docs: document preloading with Cache Components: #97864
- chore: Remove expired sharp release age exclusions: #98120
- Reduce Turbopack cache size with per-family compression: #97714
- [test] Skip hooks of suites skipped by a lazy `@force-gate`: #98169
- Bump swc to v77: #97407
- Upgrade React from `ff7445e6-20260831` to `21c89c9f-20260901`: #98147
- turbo-tasks-backend: parent_count-driven garbage collection: #97282
- Remove the worker thread for turbopack builds: #96862
- turbo-tasks-malloc: address review feedback on #97761: #98153
- test: remove stale deploy manifest exclusions: #98051
- Enable hourly next-maintainer auto-close workflow: #98225
- Return client errors for unrecognized Server Actions: #98123
- Add Next Maintainer auto-close workflow: #98197
- perf(turbopack): skip ignored files during server tracing: #97475
- docs: note that experimental.taint taints process.env: #98145
- test: preserve static params during Cache Components migration: #98209
- Upgrade web-vitals to v6 and report soft navigations: #97232
- Upgrade React from `21c89c9f-20260901` to `f4e439e1-20260902`: #98188
- Turn on the adapter route collapses by default: #98218
- fix: suppress missing package manager errors in next info: #97946
- Turbopack: fix `source` field in CSS sourcemaps: #88225
- fix: track dynamic accesses in final runtime prerenders: #98255
- docs: add API reference pages for skipProxyUrlNormalize and skipTrailingSlashRedirect: #97967
- fix: route info segment overrides not updating in dev overlay: #96968
- test(turbopack): remove dead top-level task unmarks: #98246
- Fix flaky successive HMR changes test: #97610
- docs: Remove version label from Turbopack in Pages Router: #98316
- Bump to swc v78: #98268
- Create next.config.ts when generating apps with `pnpm new-test`: #98364
- test(evals): accept LayoutProps in App Router migration: #98365
- [test] Run deploy tests against local JavaScript changes by default: #98353
- [test] Resolve `workspace:*` packages to the version under test: #98330
- turbo-tasks: explicit GC root anchoring + cross-session orphan reclamation: #96857
- [PPF] Fix missing runtime-follow up if hints are stale: #98278
- Instant validation for caches excluded from prerenders: #98342
- [PPF] Model caches with `stale < MIN_SHELL_STALE` as prefetch-only data: #98339
- docs: document excluding content from a prefetch in the prefetching g…: #98175
- docs: add unstable_navigation and unstable_prefetch API references: #98122
- Fix turbopacks webpack loader setup to support options being optional: #98270
- [ci] Align build-and-deploy triggers with build-and-test: #98331
- test: stabilize server action HMR update: #98322
- Add version for loaders api: #98377
- turbo-tasks-backend: let a GC pass wind down when it is blocking an operation: #96676
- docs: preserve Next.js development state: #98276
- Adds .resolve to loaders api: #98361
- Turbopack: fix require handling with alternative: #98258
- docs: clarify ISR with Suspense params: #98210
- [cd] Update `peerDependencies` in prereleases to accept the current prerelease: #98411
- test: stabilize error recovery snapshot timing: #98414
- example: Use a Redis cacheHandler w/o dependencies: #95346
- Support durable use-cache entries with client components: #98140
- Upgrade React from `f4e439e1-20260902` to `6c0e1047-20260908`: #98363
- fix: preserve repeated --require/--import flags when forking workers: #96651
- ci: check that Turbopack compiles for wasm: #97588
- feat(next-napi-bindings): build Turbopack for wasm: #97586
- Turbopack: fix output tracing include glob traversal: #98382
- test: support deploy exclusions with force gates: #98149
- Fix: Turbopack CSS HMR error when editing an unmounted merged CSS chunk: #94551
- Dev server: More aggresively scold users for deleting .next when we detect it while dev is running: #98253
- turbo-persistence: add TURBO_PERSISTENCE_MMAP=0 to disable mmap: #97873
- Fix dev route discovery startup race: #97920
- Re-enable @vercel/devlow-bench publishing: #98236
- test: migrate caching deploy exclusions to force gates: #98154
- Typecheck the Turbopack ECMAScript runtime in CI: #98422
- Fix initial Turbopack HMR update handling: #98385
- Skip bundler config validation in next/jest and under test: #98392
- Remove `tsec`: #98423
- Stabilize scope_unbounded panic test: #98416
- test: restore deployment exclusion for shared Cache Components tests: #98464
- Resolve metadata independently across parallel routes: #97345
- docs: preserve route behavior during Cache Components adoption: #98275
- Add a fast-path to 'get_relative_path_to' for a potential common case when 'from' is empty: #98440
- docs: document React browser API: #97621
- Enable React browser bailout by default: #98439
- [evals] Cover focused Cache Components and Partial Prefetching cases: #97813
- Deflake gc_interrupt_is_self_healing: #98445
- Adds this.target for webpack loaders: #98436
- test(evals): validate delegated error boundary components: #98387
- test: stabilize deferred entries HMR assertions: #98418
- Add in warning for workers around the fsevents bug: #98447
- skill: add Partial Prefetching optimizer: #96471
- bundle-analyzer: add table view to single-build analyzer: #93523
- bundle-analyzer: add table view to compare mode: #93522
- bundle-analyzer: add compare view with treemap diff: #93521
- [testmode] Stop using deprecated `url.parse`: #98194
- fix(next/image): don't share the requester's socket with the internal image response: #98168
- Fix duplicate background revalidation for `'use cache'`: #98446
- Turbopack: Deduplicate project options documentation: #98465
- Report incompatible parallel route slots: #97430
- Require canonical routes for interception routes: #97428
- Error when app pages do not match any route: #97401
- fix(turbopack): add `get_relative_request_to` for paths used as module requests: #98497
- [ci] Cleanup orphaned `next-stats-action`: #98348
- [scripts] Move scripts (and benchmarks) off of `node-fetch`: #98347
- [test] Move fixtures off `node-fetch`: #98346
- [test] Move the harness off `node-fetch`: #98195
- fix(turbopack): resolve `../` and `/`-rooted `import.meta.glob` patterns: #96557
- Durable use cache: optimize env var existence checks: #98504
- Adds this.mode for webpack loaders: #98532
- Upgrade React from `6c0e1047-20260908` to `019019be-20260911`: #98576
- feat(next/image): Add experimental imgOptMozjpeg config: #98571
- [turbopack] Lazily compile dynamic imports in development (client side): #97203
- fix(devtools): handle pointercancel when dragging the indicator: #98506
- [ci] Show full logs under GitHub Actions debug logging: #98501
- fix(typegen): merge cacheLife types into next/cache instead of shadowing it: #98252
- [test] Fix `proxy-request-with-middleware` deploy test: #98553
- [ci] Remove the broken Test examples workflow and its test suite: #98517
- Align fallback parameter staging with shell validation: #98512
- Prevent synchronous IO from entering Cached Navigations: #98511
- [ci] Fix scheduled Rspack test job: #98508
- [ci] Remove Turbopack test manifest pipeline: #98507
- test: stabilize OpenTelemetry collector lifecycle: #98427
- Make TurbopackResult payloads disjoint: #98575
- Durable use cache: fix runtime env var mutation: #98558
- refactor(turbopack): drop the generic on `new_atom`, and stop it copying an owned string: #98520
- Serialize turbo-tasks trybuild tests: #98415
- Expose App Router runtime errors over HMR: #98438
- test: avoid OpenTelemetry collector socket reuse: #98632
- fix: Bump vendored @mswjs/interceptors from 0.42.0 to 0.42.5: #98607
- Document codemod errors and intentional migration exceptions: #98565
- Unify TODO markers for codemods and skip adoption-only codemods for upgrade: #98560
- Optimize strict module factory chunks: #98421
- Sort batched chunk items globally by path: #98433
- test(turbopack): strongly read test operations: #98247
- Add `next dev` wait for Turbopack shutdown: #98646
- docs: document default turbopack.resolveExtensions: #98627
- test: migrate package CSS side-effects coverage: #98635
- Improve tree shaking through Next.js module wrappers: #98638
- Trace export usage through client component proxies: #98621
- fix(turbopack): trace cyclic modules to explicit entries: #98661
- Use default pnpm package import method: #98703
- Fix constant inlining in shorthand properties: #98662
- test(turbopack): add strong read operation roots: #98248
- Use pnpm for isolated test installs: #98425
- [turbopack] Forward usage information across re-exports: #96282
- [turbopack] Use options object for ESM references: #98680
- test: enable verified runtime deploy tests: #98457
- test: enable verified assets deploy tests: #98527
- test: enable verified pages-router deploy tests: #98526
- test: enable verified tooling deploy tests: #98525
- test: enable verified app-router deploy tests: #98524
- test: enable verified caching deploy tests: #98523
- Fix unexpected query parameters in adapter deployments: #98584
- Keep never-prerenderable params out of self-hosted shells: #98612
- Fix addMissingDependency: #98588
- docs: clarify metadata support in root not-found: #98670
- Pages Router: do not return the `__appRouter` prefetch marker as route info on shallow navigation: #98187
- Pages Router: key the client router filter prefetch marker by the `as` path: #98182
- docs: add an intro paragraph to the glossary: #98654
- Fix App Router locale path matching with Pages i18n: #98095
- Upgrade React from `019019be-20260911` to `ff8f88fc-20260915`: #98693
- Store code generation AST paths in a shared trie: #98581
- Turbopack: Remove wasmer from lockfile by deleting dead feature option from our wasm crate: #98761
- Prefer using join over try_join when you don't want a vec: #98547
- Preserve committed app route response status during fallback: #98649
- docs: scope React cache() guidance to the render pass: #98741
- fix(next-custom-transforms): never place generated imports before directives: #98717
- Pin tasks during construction: #98688
- fix(use-cache): track root params read in "use cache" as vary params: #98674
- [test] Fix Webpack deployment failures in PostCSS tests: #98710
- Revert "Fix App Router locale path matching with Pages i18n": #98715
- Nudge the agents for future defaults adoption: #98721
- Add future defaults upgrade coverage for `next upgrade --ai`: #98643
- Nudge the agents for latest version upgrade: #98640
- Add "latest" upgrade coverage for `next upgrade --ai`: #98633
- Nudge the agents for security vulnerable version upgrade: #98637
- Add `next upgrade --ai` and security vulnerability coverage: #98562
- agents: Add a `--comments-only` flag to `pr-status` script, trim down context bloat in AGENTS.md: #98781
- Keep guards across restore owner handoff: #98700
- [turbopack] Track webpack loader build dependency files: #98777
- Replace lzzzz with lz4_flex: #98799
- Bump to swc v79: #98809
- [PPF] Fix unnecessary runtime prefetch with prefetch={true}: #98651
- Keep metadata rendering stable across streaming modes: #97440
- [test] Expand root-param navigation regression coverage: #98731
- docs: rewrite the bots and crawlers section in the caching guide: #98782
- Fix isStableBuild() treating commit preview tarballs as stable: #98811
- perf(turbo-persistence): shard meta files by family: #97703
- turbo-persistence: assorted read-path cleanups: #97797
- turbo-persistence: give key block searches a dense region of their own: #97705
- Introduce config options for Turbopack GC: #98378
- Persist resurrected tasks as new tasks: #98729
- Rspack: Remove bincode dependency from rspack by way of turbo-unix-path: #98855
- Pin tasks across restore waiter handoff: #98728
- test: honor skipStart for Vercel deployments: #98776
- Use internal prefix for Turbopack shutdown env: #98747
- test: retry waiting for ISR fallback in prefetch-static-shell: #98884
- Fix generated Turbopack GC option docs: #98888
- Add agent feedback behavior evals: #98887
- Add experimental agent feedback workflow: #98582
- Clean up unnecessary output asset creation: #98834
- Properly disable laziness on next/dynamic: #98828
- Set `experimental.agenticAutoUpgrade` after successful upgrade: #98871
- example(cache-handler-redis): fix connection leak, hangs on a down Redis, and cross-page tag invalidation: #98716
- Do not check Node version while agentic upgrade: #98852
- test: run cargo unit tests with miri as well: #97535
- test: unflake instant-validation: #98854
- Preserve closed-parameter restrictions in client route prediction: #98889
- [test] Fix deployment tests that relied on implicit startup: #98935
- Turbopack: Add support for specifying additional roots: #98003
- Turbopack: Add symlinks and additional roots to NFT metadata: #98469
- Enable AI upgrade for canary: #99001
- fix(turbo-persistence): preserve write errors on writer drop: #98840
- Skip slow valued tombstone test under Miri: #98992
- Improve the agent feedback review flow: #98937
- Run AI upgrades with the latest official canary: #98870
- test: move whole development-only suites out of e2e: #98842
- Fix `instant-false` codemod to run on route segment filenames: #98880
- test: migrate legacy deployment exclusion callers: #98473
- Split revalidation errors by execution context: #98993
- Enable strict route matching by default: #97397
- Surface agent feedback gate connection failures: #98991
- Generalize the build-time generator work-unit store name: #98891
- Use structural React keys during server rendering: #98944
- Upgrade React from `ff8f88fc-20260915` to `59aff3e1-20260918`: #98897
- Remove unused `hasWarnings` and `warnings`: #96956
- [PPF] Scaffold `unstable_ensureStatic` segment config: #98190
- [agent-feedback] Respect CI and telemetry opt-out: #99062
- Fix prefetch loop when a predicted route redirects: #98998
- Fix dev overlay header layout on small screens: #99049
- [PPF] Separate tracking of runtime data accesses for shells and prefetches: #98129
- Harden `next/og` SVG serialization: #99061
- test: clarify dev-only intent of duplicate Sass warning test: #98917
- test: enable upward distDir deployment coverage: #98886
- test: remove redundant deployment skips from mode-guarded suites: #98908
- Turbopack: trace static project files referenced by packages: #98712
- Durable use cache: fix next/image pulling in NEXT_DEPLOYMENT_ID: #98739
- Unify hydration error tree details: #99008
- Turbopack: forward module graph, entrypoint write, and emit spans to the JS trace: #98408
- Fix startTime and shutdown delivery of forwarded Turbopack trace spans: #98426
- Turbopack: loader change invalidation: #95732
- perf: optimize CSS graph cycle removal: #98860
- Use AGENTS.md for managed agent instructions: #99043
- Turbopack: analyze mode tracing imports only: #98825
- Turbopack: compact re-export registration: #98617
- test: Add test for ESM and CJS exports of `next/*` APIs: #98882
- Keep cached root parameters out of generic fallback shells: #98950
- Fix missing content in Cached Navigations: #98767
- [turbopack] Track members across namespace re-exports: #96396
- [PPF] Implement `unstable_ensureStatic = "shell" | "prefetch"`: #98191
- [PPF] Validate `unstable_ensureStatic` nesting: #98357
- Replace lerna task-runner usage with pnpm: #99040
- [cd] Fix release branch gate and drop dead lerna publish config: #99039
- Turbopack: fix "ModuleId not found for ident" regression: #99090
- Fix private-cache segment reuse across root params: #98810
- Turbopack: fix `Unknown module type` error for imports in webpack loaders: #99088
- Nudge future defaults upgrades for manual `next dev|build`: #98874
- Nudge latest version upgrades for manual `next dev|build`: #98873
- Nudge security upgrades for manual `next dev|build`: #98872
- Upgrade React from `59aff3e1-20260918` to `8b0da1c6-20260922`: #99059
- refactor(turbo-rcstr): drop unsupported 16-byte pointer width: #98355
- test(turbo-tasks-backend): run the db_versioning tests on wasm: #97901
- fix(turbo-tasks): let parking_lot block on wasm instead of panicking: #97860
- test(turbo-tasks): run the wasm tests with a Node wasi host: #97789
- [cd] Skip the release job when no new commits warrant a release: #98664
- [test] Add fallback param deployment regression coverage: #98883
- Turbopack: mangle exports behind an escaping namespace via the facade: #97770
- test(dev): add dedicated compiler polling coverage: #97673
- build(turbopack): upgrade notify to 9.0.0-rc.5: #98737
- test(turbopack): add polling to filesystem watcher fuzzer: #98863
- test(turbopack): fix filesystem watcher symlink expectations: #98983
- test(turbopack): fix filesystem watcher read-write tracking: #98982
- Don't re-request the App Shell to upgrade an ISR fallback: #94808
- Fix unstable ensure static task annotation: #99075
- test: update React 18 hydration error snapshots: #99073
- Remove redundant unsafe_ignore annotations: #98961
- Remove TraceRawVcs: #98953
- test(turbopack): remove remaining test unmarks: #98376
- Add experimental custom webpack support: #98862
- Default agentic upgrades to a separate worktree: #99111
- Improve agent upgrade failure message for missing app: #99117
- Preserve error boundaries in on-demand partial prerenders: #99051
- Preserve error boundaries during on-demand prerendering: #99037
- docs: clarify Turbopack ModulePart export examples: #99104
- Add some more verification and safety rules around custom `distDir`: #98997
- Preserve closed-route admission across cache misses: #98964
- Move suspension into operation guard: #99053
- [agent-feedback] Shorten managed agent instructions: #99065
- docs: clarify Cache Components build output: #98274
- Update Rust namespace re-export snapshots: #99106
- [ci] Skip preview tarball upload when the artifact is missing: #98713
- [cd] Retry preview tarball uploads with backoff and richer diagnostics: #99060
- Promote next analyze command: #99074
- [ai-upgrade] Remind the agent to report the nudge: #99127
- Tune Node server chunking for require overhead: #99120
- Turbopack: fix another "ModuleId not found for ident" regression: #99102
- test: enable deploy coverage for TypeScript config errors: #98849
- test: enable deploy coverage for routing build errors: #98848
- test: enable deploy coverage for cache build errors: #98847
- Turbopack: chunk each layout segment once in production: #99100
- bundle-analyzer: exclude traces from output types: #98536
- turbo-tasks-gc: Defer most aggregation graph management until after GC has settled: #98591
- Skip ESLint migration when scripts do not use next lint: #99103
- Turbopack: pass RcStr to AnalyzeIssue: #99166
- Use graph-backed codegen for client proxies and WASM loaders: #99115
- [PPF] Instant validation for `ensureStatic = "shell" | "prefetch"`: #98249
- Fix flaky lazy-dynamic-imports.test: #99057
- [test] Skip flaky deploy tests: #99156
- [cd] Tolerate 409 when uploading preview tarballs: #99091
- [test] Fix new deploy suites: #99162
- Provide only the relevant context for agent upgrade: #99189
- Turbopack: Add support for additionalRoots to deployment adapters: #99015
- Use Sonnet 5 with 1M context for AI upgrade handoff: #99183
- docs: font per-call preload scope and the declarations font-family override: #99167
- Revert "Add experimental custom webpack support": #99227
- test: stabilize lazy dynamic import error overlay: #98730
- turbo-tasks-gc: tear down reverse edges when collecting a task: #99145
- Sequence CI for branch-based PR stacks: #99086
- Prefetch scheduler mirrors the navigation's tree walk: #98975
- Separate route structure comparison from param comparison: #98974
- Store the head as its own CacheNode: #98973
- Record which params a CacheNode's data depends on: #98972
- Use RouteTree<T> for CacheNode tree: #98971
- Remove the page/layout distinction from RouteTree: #98970
- Fix root predicates: #98942
- [turbopack] only remove followers if they are actually removed as children: #98843
- turbo-tasks-backend: simplify the collectibility predicate and collect transient tasks: #98615
- turbo-tasks-gc: Invalidating a deleted task should be a no-op: #98614
- Avoid decoding prerender matcher parameters twice: #99121
- Prepare `'use cache'` for static root-param tracking: #99239
- [test] Adjust the prerender-encoding open fallback gate for non-adapter deploys: #99240
- Turbopack: avoid project-wide traces from package directories: #99238
- Hoist resolved pathname into app page route match: #99259
- docs: papercuts in image API reference: #99256
- test: run the TypeScript version warning suites in deploy: #99195
- test: drop skipDeployment where another gate already excludes deploy: #99194
- bundle-analyzer: suspend while loading analyzer data: #98535
- Fix Server Actions hanging after navigation to PPR pages: #99252
- Fix blurry bundle analyzer treemap on low-DPI displays: #99197
- Rename bundle analyzer snapshot naming option: #99251
- Reduce stacked PR gate polling and use ts-jest: #99215
- Name the internal trace server process: #99257
- test: enable deploy coverage for asset and compiler errors: #98850
- test: consolidate duplicate mode branches in build error tests: #99135
- test: snapshot the proxy-runtime build error output: #99136
- Avoid obsolete pnpm overrides in pack-next: #99199
- bundle-analyzer: move comparison state into URL: #98530
- simplify `Transition` by removing dead members: #94467
- fix: respect metadata streaming policy in Edge SSR: #99128
- Avoid facade splits solely for export mangling: #99285
- test: forward __NEXT_PARTIAL_PREFETCHING to test-deploy: #99275
- Turbopack: Allow webpack loaders to cross filesystem roots when reading dependencies: #99202
- Explain prerelease security upgrade limits: #99230
- Support latest agentic upgrades on prerelease channels: #99223
- Allow agentic upgrades without Git: #99217
- Show security upgrade insights in DevTools: #99002
- Use focused npm advisories and nudge only for ready upgrades: #99222
- [test] Stabilize middleware revalidation test: #99378
- test: scope loader build dependency update to Turbopack: #99380
- Remove CLAUDE.md symlinks in favor of AGENTS.md: #98910
- Align ExecuteContext task accessor names: #99258
- [test] Stabilize responsive dev overlay header layout test: #99376
- Turbopack: skip trimmed side-effect imports in SideEffectsModule: #95781
- Turbopack: preserve import `with` clauses when direct-binding: #95529
- Turbopack: fix split_module correctness for app-router: #95522
- Turbopack: fix empty tree-shake chunks desyncing part ids (#93424): #95516
- Fix custom cache handlers missing on initial requests: #99372
- Allow Draft Mode on unlisted closed routes in adapter deployments: #99370
- Fix bundle analyzer source table delta sorting: #99369
- test: fix stale snapshots after `unstable_{prefetch,navigation}` rename: #99371
- Virtualize bundle analyzer source table: #98539
- [PPF] Remove leftover debug log in router: #99365
- Remove unstable_ prefix from navigation() and prefetch(): #99241
- Lazy dynamic imports for ssr: #98836
- Refine the Security Insight upgrade prompt: #99354
- [PPF] `ensureStatic = "navigation"`: #99171
- docs: use prefetch={true} for links to ISR pages with Cache Components: #99261
- Add agent feedback to create-next-app defaults: #99119
- Make next-dev-loop browser headless by default: #98318
- [test] Extend timeout for tests barely below it: #99305
- docs: typo fixes: #99350
- [ai-upgrade] ESC to move back during prompt: #99319
- [ai-upgrade] Ask user to choose permission: #99291
- [ai-upgrade] Ask user to choose model and effort: #99235
- [ai-upgrade] Ask user whether to start upgrade in worktree: #99232
- [create-next-app] Enable Cache Components by default in create-next-app: #99436
- Include async module evaluation in client loading metrics: #99427
- turbo-tasks-backend: fix leaf distance tracing compilation: #99443
- Enable proxy export tests in deploy mode: #99400
- docs: record API stabilization across Next.js 16 releases: #99420
- test: migrate and explain custom server deploy exclusions: #98994
- test: migrate and explain root-inference deploy exclusions: #99012
- Enable build diagnostic suites in deploy mode: #99402
- test(turbopack): remove filesystem fuzzer unit tests: #99089
- [turbopack] Support webpack loader build dependency requests: #99071
- [turbopack] Track webpack loader build dependency directories: #98838
- [ci] Wire preview builds variables consistently: #99323
- [ci] Enable PR comment in any repo: #99315
- Fix bundle analyzer route selector: #98702
- bundle-analyzer: use Rust React compiler: #98695
- Link bundle analyzer empty states to source mode: #98542
- Consolidate HTML render completion cleanup: #99426
- Scope client component loading metrics to HTML renders: #99322
- fix: preserve HTTP status codes during prerendering: #99078
- test: enable deploy coverage for five verified suites: #99193
- Document agent feedback field limits: #99415
- test: migrate tooling deploy exclusions to force gates: #98156
- Turbopack: Don't force non-recursive watcher for additional roots: #99396
- turbo-persistence: intermediate merges take the newest files of similar size: #99433
- turbo-persistence: space-amplification driven compaction with adaptive hash shards: #99268
- test: enable basePath redirect deployment coverage: #99401
- fix(incremental-cache): keep an ISR entry's cache lifetime across instances and restarts: #99289
- Avoid mutating image qualities during validation: #99476
- Remove the Cache Components deployment-test alias: #99446
- Finalize the App Router dev indicator on output completion: #99384
- [test] Cover external `next/image` in adapter deployments: #99466
- Prepare image options without mutating configuration: #99394
- [PPF] Use RDC in runtime prerenders: #98025
- [PPF] Use RDC in cachedNavigations codepaths: #98005
- test: add PPF coverage to use-cache and RDC tests: #99417
- Restore static metadata prerendering for dynamic routes: #99463
- Exclude metadata files from route handler type validation: #99377
- Remove `true` from `agentUpgrade` option: #99461
- fix: revalidateTag not reaching custom cache handlers when profiles differ : #99359
- Enable agent upgrade reminders by default: #99311
- Enable deploy tests for reusable fixture variants: #99404
- test: enable compatible body-size cases in deploy: #98911
- test: retain deploy exclusions for local process control: #99392
- Enable nullish config tests in deploy mode: #99397
- Always use generateBuildId if set explicitly: #99147
- Set tracer library version: #98262
- fix: propagate repeated tag revalidation from after(): #99499
- Stabilize `ensureStatic`: #99513
- Turbopack: Enable experimental.turbopackSharedRuntime by default: #99504
- Measure AI upgrade nudges, handoffs, and completion: #99465
- turbo-persistence: 32 bit fingerprints for the used keys AMQFs: #99333
- Remove suspend during operations: #99383
- test: migrate runtime deploy exclusions to force gates: #98159
- test: migrate asset deploy exclusions to force gates: #98158
- test: migrate Pages Router deploy exclusions to force gates: #98157
- fix: stale usages of unstable_ensureStatic: #99540
- Add unstable parameter matching APIs: #97393
- docs: point next package security disclosure to HackerOne: #99459
- docs: add ensureStatic reference and validation guidance: #99355
- Enable Turbopack export name mangling by default for builds: #99362
- Allow skipping React and ESLint upgrades: #99468
- Prefer the declared package manager during upgrades: #99471
- Use Next.js conventions in bundle analyzer UI: #98780
- Pass App Page HMR state through a dev render context: #99487
- Remove request forwarding from App Router error reporting: #99488
- docs: self hosting immutable static assets: #97008
- test: enable deployment fixtures with Corepack and portable tarballs: #99192
- Resolve React dependency warnings from the target app: #99536
- Move upgrade workflows out of public docs: #99546
- Use Agent terminology throughout upgrades: #99545
- Turbopack: Commit updated generated-native file: #99561
- test: enable Relay multi-project deployment coverage: #99403
- test: migrate independent App Router deploy exclusions to force gates: #99431
- test: migrate mode-specific deploy exclusions to force gates: #98160
- Optimize esm exports by shifting the protocol burden to getters: #98932
- fix: fix pnpm builds in Docker examples: #97352
- Assert transient task references are not serialized: #99300
- Reorganize bundle analyzer toolbar: #98920
- Show async module scope in bundle analyzer: #98918
- Show bundle changes in compare treemap: #98837
- improve disk read semantics around MustExist and AllowMissing: #99249
- Allow opt-in facade-backed export mangling: #99309
- Add bundle analyzer route summary: #98787
- [turbo-tasks-backend] Correctly maintain outdated_collectibles to prevent unnecessary stale executions: #99386
- Upgrade React from `8b0da1c6-20260922` to `278794d7-20261002`: #99600
- Warn when Partial Prefetching is not configured: #99452
- Store the Turbopack module cache in a Map: #98947
- Improve agent feedback reporting reliability: #99591
- Enable empty generateStaticParams deploy diagnostics: #99406
- test: enable Nx deployment coverage: #99407
- test: enable deployment coverage for monorepo fixtures: #99395
- test: capture deployment experimental flags in config: #99534
- test: extract a shared helper for deployment feature flags: #99533
- Move App Page header parsing to handler entrypoints: #99506
- docs: clarify ensureStatic levels from dogfooding: #99590
- Gate param-matching deploy tests on the adapter: #99582
- docs: update the MCP guide for next-devtools-mcp 0.4: #99583
- Document agent upgrades across Next.js: #99293
- [test] Fix the legacy image preload order assertion for React 18: #99572
- docs: Remove task decomposition and validation boilerplate from AGENTS.md: #99558
- Turbopack: Use a FrozenMap for DiskFileSystemMap: #99569
- [test] Expose first-run e2e test failures in CI: #99528
- Turbopack: `resolveFileUrl`/`placeholderFileUrl` is always called with a module path: #99560
- Turbopack: Remove implicit mismatched root fallthrough for AfterResolvePluginCondition, accept None as a root: #99556
- Turbopack: Allow ResolveMap entries to match against all possible roots: #99555
- Turbopack: Support import.meta.url in additional roots: #99511
- Followup from #99249  remove some redundant tests and enable missing assertions all the time: #99605
- Simplify turbo-tasks-backend guards and execution contexts: #99599
- Add allocation and memory data to the trace-server MCP protocol: #98546
- turbo-tasks-backend: check access in track_modification and only track Data on serialization invalidation: #99581
- Fix CI break caused by #98932: #99621
- Fix: Unnecessary Suspense fallback triggered by URL update: #99612
- Don't suspend client params on shallow URL updates: #99611
- Add React Compiler memoization preservation option: #98589
- Unify bundle analyzer delta colors: #99607
- Turbopack: Cache canonicalized paths without turbo-tasks, try to find the longest cached prefix first: #99270
- Record parameter matching usage in build metadata: #99594
- Bundle Analyzer Agent Skill: Stream versioned analyzer graph as JSON Lines: #99387
-  Revert "Optimize esm exports by shifting the protocol burden to getters (#98932)": #99704
- [PPF] Log Sync IO errors in runtime prerenders: #99688
- docs: clarify use client directive as a file level directive: #99703
- Stabilize `forbidden()` and `unauthorized()`: #99689
- turbopack-ecmascript-runtime: type-check every runtime file: #99670
- test: unflake use-cache-search-params: #99691
- Avoid mutating config for default export paths: #99496
- Keep compile-mode metadata outside configuration: #99491
- Keep dynamic asset prefixes outside configuration: #99490
- eslint-config-next: support ESLint 10: #99628
- Add Instant Insights for prefetch() and navigation(): #97801
- rename `RenderStage.Runtime` to `PrefetchRuntime`: #99679
- Collect root param dependencies for `'use cache'` at build time: #99274
- Add client fixes for fully static route errors: #99659
- docs: clarify hover prefetching with Partial Prefetching: #99665
- Durable use cache entries: sort env var list: #99657
- next-swc: rebuild native when embedded js/src files change: #99669
- Improve static route error guidance: #99724
- docs: add Turbopack experimental config references: #99723
- Show choices for agent upgrade prompt: #99727
- docs: add Keeping pages static guide and align the navigation stage docs: #99493
- Turbopack: Check the invalidator map before adding a path to a batch: #99711
- docs: add guide for optimizing the static shell: #97737
- Keep dev and build running during upgrade prompts: #99702
- docs: use auth interruption APIs in examples: #99698
- docs: recommend auth interruption APIs in error handling: #99696
- [test] Update snapshots: #99713
- Bundle Analyzer Agent Skill: Trace conditional async and worker chunk loading: #99174
- Bundle Analyzer Agent Skill: Show route chunk groups: #99170
- Bundle Analyzer Agent Skill: Show modules in generated JS/CSS files: #99173
- Bundle Analyzer Agent Skill: Expose more route details in analyze data: #99172
- turbo-tasks-backend: stop dirtying dependents of GC-collected tasks: #99647
- turbo-tasks-backend: treat reads and connects of collected tasks as errors: #99646
- turbo-tasks-backend: stop pinning tasks during restores and always discard missing tasks: #99645
- Bundle Analyzer Agent Skill: Add analyzer skill: #99169
- Document next analyze export in the package bundling guide: #99735
- Revert stabilization of `forbidden()` and `unauthorized()`: #99734
- Preserve configured output directories during static export: #99507
- Rename skill to next-bundle-optimizer and document its usage: #99731
- [turbo-tasks-backend] Clean up task state before publishing execution completion: #99729

### Credits

Huge thanks to @acdlite, @icyJoseph, @lukesandberg, @sampoder, @ztanner, @vercel-release-bot, @marcoshernanz, @mischnic, @timneutkens, @eps1lon, @gaearon, @aurorascharff, @unstubbable, @lubieowoce, @wbinnssmith, @molebox, @kyamaz99, @sokra, @Janpot, @bgw, @m-kawafuji, @koenpunt, @gnoff, @mayur9210, @Jashnavi25, @jarrensj, @akselipalmer, @DavidIlie, @kelvinampofo, @Stanzilla, @syedsohailhussain1, @gaojude, @hammadxcm, @jimmyhmiller, @lazerg, @styfle, @bryan-ferry, @gdborton, @hardfist, @niketchandivade, @seanbeirnes, @0ldh, @fabian-hiller, @devjiwonchoi, @biubiukam, @fireairforce, @QingHeSite, @marceloboeira, @leejpsd, @hamidrezahanafi, @jgruica, @zeeshan56656, @mlekhi, @dacgray, @Xanaado, @mezotv, @anujbolewar, @spirosikmd, @Amusac, @itsybitsci, @ranger-ross, @bmorros94, @jamiboym, @kostyniuk, @alangenfeld, @aryabyte21, @martinfrancois, @kassens, @orzazade, @Samiislam851, @lukahartwig, @uaoa, @swarnava, and @6iu8a for helping!

## v16.4.0-canary.63 (2026-10-06) canary

### Misc Changes

- Document next analyze export in the package bundling guide: #99735
- Revert stabilization of `forbidden()` and `unauthorized()`: #99734
- Preserve configured output directories during static export: #99507
- Rename skill to next-bundle-optimizer and document its usage: #99731
- [turbo-tasks-backend] Clean up task state before publishing execution completion: #99729

### Credits 

Huge thanks to @wbinnssmith, @acdlite, @gnoff, and @sokra for helping!
