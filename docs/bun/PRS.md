# Pull requests oven-sh/bun

Instantané du 2026-11-14.

## Fusionnées sur main depuis 2026-10-15 (255)

| PR | Titre | Auteur | Date | Labels |
|---|---|---|---|---|
| [#48893](https://github.com/oven-sh/bun/pull/48893) | spawn, io: share Process and KeepAlive instead of borrowing them exclusively | dylan-conway | 2026-11-14 |  |
| [#48889](https://github.com/oven-sh/bun/pull/48889) | shell: environments and their strings are owned | dylan-conway | 2026-11-14 |  |
| [#48888](https://github.com/oven-sh/bun/pull/48888) | tar: match npm more closely in npm mode | dylan-conway | 2026-11-14 |  |
| [#48885](https://github.com/oven-sh/bun/pull/48885) | event loop: give the uws loop its lifetime and share the mini loop | dylan-conway | 2026-11-14 |  |
| [#48880](https://github.com/oven-sh/bun/pull/48880) | fds: give opened descriptors an owner instead of closing them by hand | dylan-conway | 2026-11-14 |  |
| [#48875](https://github.com/oven-sh/bun/pull/48875) | vm: share the VM instead of borrowing it exclusively | dylan-conway | 2026-11-14 |  |
| [#48873](https://github.com/oven-sh/bun/pull/48873) | test: share the temporary folder setup; resolve HTML entry points as paths | dylan-conway | 2026-11-13 |  |
| [#48866](https://github.com/oven-sh/bun/pull/48866) | event loop: share the loop instead of borrowing it exclusively | dylan-conway | 2026-11-13 |  |
| [#48854](https://github.com/oven-sh/bun/pull/48854) | timers: share the timer state instead of borrowing it exclusively | dylan-conway | 2026-11-13 |  |
| [#48819](https://github.com/oven-sh/bun/pull/48819) | css: give the AST the lifetime of its arena | dylan-conway | 2026-11-13 |  |
| [#48815](https://github.com/oven-sh/bun/pull/48815) | AOT: the text of functions stored as it is, and fixes of plain Bun | Jarred-Sumner | 2026-11-14 |  |
| [#48809](https://github.com/oven-sh/bun/pull/48809) | ci: check the history of a release branch | dylan-conway | 2026-11-13 |  |
| [#48799](https://github.com/oven-sh/bun/pull/48799) | ci: list the contributors of a release without building a diff | dylan-conway | 2026-11-13 |  |
| [#48776](https://github.com/oven-sh/bun/pull/48776) | ci: release pipeline cleanups | dylan-conway | 2026-11-13 |  |
| [#48774](https://github.com/oven-sh/bun/pull/48774) | Bump to 1.4.5 | dylan-conway | 2026-11-13 |  |
| [#48771](https://github.com/oven-sh/bun/pull/48771) | AOT: bundles, classes behind parameters, exports by getters, mocks of awaiting files, known strings | Jarred-Sumner | 2026-11-13 |  |
| [#48769](https://github.com/oven-sh/bun/pull/48769) | ci: build releases from release branches | dylan-conway | 2026-11-13 |  |
| [#48750](https://github.com/oven-sh/bun/pull/48750) | Pin WebKit to b553971ea817 | dylan-conway | 2026-11-12 |  |
| [#48714](https://github.com/oven-sh/bun/pull/48714) | AOT: update the engine; stores in defaults of parameters, paths that stores rule out | Jarred-Sumner | 2026-11-12 |  |
| [#48677](https://github.com/oven-sh/bun/pull/48677) | AOT: strings that packages evaluate, modules in bundles, class factories, mocks in import cycles | Jarred-Sumner | 2026-11-12 |  |
| [#48667](https://github.com/oven-sh/bun/pull/48667) | http: resume a partially written request head from the same bytes | Jarred-Sumner | 2026-11-13 |  |
| [#48617](https://github.com/oven-sh/bun/pull/48617) | AOT: module instances in test runs, files that packages read, build cost | Jarred-Sumner | 2026-11-12 |  |
| [#48478](https://github.com/oven-sh/bun/pull/48478) | AOT: stack traces as in bun run, code from disk, workers, embedded files, module mocks, build cost | Jarred-Sumner | 2026-11-11 |  |
| [#48436](https://github.com/oven-sh/bun/pull/48436) | AOT: bun compile, build output, module mocks, fixes and new names | Jarred-Sumner | 2026-11-10 |  |
| [#48428](https://github.com/oven-sh/bun/pull/48428) | Check vendored test suites out by commit | dylan-conway | 2026-11-10 |  |
| [#48423](https://github.com/oven-sh/bun/pull/48423) | Tighten checks in lifecycle scripts, package extraction and macros | dylan-conway | 2026-11-12 |  |
| [#48413](https://github.com/oven-sh/bun/pull/48413) | Extend existing checks to `bun run` bins and `data:` URL macros | dylan-conway | 2026-11-09 |  |
| [#48297](https://github.com/oven-sh/bun/pull/48297) | Upgrade WebKit to 8156ba68efab | robobun | 2026-11-11 | claude |
| [#48120](https://github.com/oven-sh/bun/pull/48120) | AOT: the next base | Jarred-Sumner | 2026-11-10 |  |
| [#48050](https://github.com/oven-sh/bun/pull/48050) | Check the xwin archive's sha256; ignore `bin` paths that contain a NUL | dylan-conway | 2026-11-07 |  |
| [#47981](https://github.com/oven-sh/bun/pull/47981) | ci: leave the SSH server out of the Linux images | dylan-conway | 2026-11-05 |  |
| [#47944](https://github.com/oven-sh/bun/pull/47944) | Remove 125 `unsafe` blocks from IPC, N-API, `bun:ffi`, `node:zlib`, c-ares, BoringSSL, `node:quic` and the parser | dylan-conway | 2026-11-05 |  |
| [#47942](https://github.com/oven-sh/bun/pull/47942) | AOT: front end, test runs and tests for the rewritten compiler | Jarred-Sumner | 2026-11-07 |  |
| [#47940](https://github.com/oven-sh/bun/pull/47940) | Make `epoll_ctl`, `kevent`, six uSockets loop imports and `Bun__FFI__closeFunctions` unsafe to call | dylan-conway | 2026-11-04 |  |
| [#47901](https://github.com/oven-sh/bun/pull/47901) | Remove 98 `unsafe` blocks from `bun_threading`, `bun_alloc`, the bundler and the transpiler | dylan-conway | 2026-11-04 |  |
| [#47900](https://github.com/oven-sh/bun/pull/47900) | install: send configured credentials to tarball URLs that the project names | dylan-conway | 2026-11-04 |  |
| [#47895](https://github.com/oven-sh/bun/pull/47895) | Remove 131 `unsafe` blocks from `Blob`, `Bun.write`, `FileSink`, `fetch`, `Response` and the S3 client | dylan-conway | 2026-11-04 |  |
| [#47893](https://github.com/oven-sh/bun/pull/47893) | Remove 128 `unsafe` blocks from the event loop, spawn, `bun_jsc`, `node:fs` and `fs.watch` | dylan-conway | 2026-11-04 |  |
| [#47882](https://github.com/oven-sh/bun/pull/47882) | css: fix layer ordering bugs left after #47797 | alii | 2026-11-09 |  |
| [#47871](https://github.com/oven-sh/bun/pull/47871) | Remove 187 `unsafe` blocks from the VM, DNS, timers, and the socket and server code | dylan-conway | 2026-11-04 |  |
| [#47836](https://github.com/oven-sh/bun/pull/47836) | Fixes in node:net, node:http, node:http2, node:stream, node:quic, node:worker_threads, node:crypto and Bun.password | dylan-conway | 2026-11-03 |  |
| [#47824](https://github.com/oven-sh/bun/pull/47824) | ci: remove the issue dedupe and PR issue-finder workflows | dylan-conway | 2026-11-03 |  |
| [#47820](https://github.com/oven-sh/bun/pull/47820) | X509Certificate, Bun.password and Bun.CryptoHasher: a fifth batch of crypto fixes | dylan-conway | 2026-11-03 |  |
| [#47810](https://github.com/oven-sh/bun/pull/47810) | css: keep a named sublayer that follows an anonymous layer in a masked import | alii | 2026-11-03 |  |
| [#47797](https://github.com/oven-sh/bun/pull/47797) | css: print @layer statements before @import and keep the layers of duplicate imports | alii | 2026-11-03 |  |
| [#47779](https://github.com/oven-sh/bun/pull/47779) | ci: look up and bake Windows images with Azure federated identities | dylan-conway | 2026-11-02 |  |
| [#47671](https://github.com/oven-sh/bun/pull/47671) | node:crypto, webcrypto: a fourth batch of Node compatibility fixes | dylan-conway | 2026-11-03 |  |
| [#47622](https://github.com/oven-sh/bun/pull/47622) | ci: canary release uses a GitHub App token and does not wait for tests | dylan-conway | 2026-11-01 |  |
| [#47625](https://github.com/oven-sh/bun/pull/47625) | ci: look up Linux images with an AWS role | dylan-conway | 2026-11-01 |  |
| [#47615](https://github.com/oven-sh/bun/pull/47615) | ci: publish to npm with trusted publishing | dylan-conway | 2026-11-01 |  |
| [#47601](https://github.com/oven-sh/bun/pull/47601) | ci: run release jobs in the release environment | dylan-conway | 2026-11-01 |  |
| [#47596](https://github.com/oven-sh/bun/pull/47596) | ci: remove the [sign windows] commit message option | dylan-conway | 2026-11-01 |  |
| [#47592](https://github.com/oven-sh/bun/pull/47592) | Fix the debug build: include FunctionCodeBlock.h in BunPlugin.cpp | robobun | 2026-11-01 | claude |
| [#47591](https://github.com/oven-sh/bun/pull/47591) | node:crypto, webcrypto: a third batch of Node compatibility fixes | dylan-conway | 2026-11-01 |  |
| [#47567](https://github.com/oven-sh/bun/pull/47567) | node:crypto, webcrypto, tls: more Node compatibility fixes | dylan-conway | 2026-10-31 |  |
| [#47564](https://github.com/oven-sh/bun/pull/47564) | test: make isGlibcVersionAtLeast work with two-part glibc versions | dylan-conway | 2026-10-31 |  |
| [#47559](https://github.com/oven-sh/bun/pull/47559) | node:crypto, webcrypto: assorted Node compatibility fixes | dylan-conway | 2026-10-31 |  |
| [#47555](https://github.com/oven-sh/bun/pull/47555) | Unmask WebSocket server frames in blocks instead of byte by byte | dylan-conway | 2026-10-31 |  |
| [#47523](https://github.com/oven-sh/bun/pull/47523) | crash handler: take the signature off a saved return address on arm64 | dylan-conway | 2026-11-02 |  |
| [#47513](https://github.com/oven-sh/bun/pull/47513) | Instantiate BunGlobWalker's methods once, in bun_glob | dylan-conway | 2026-10-31 |  |
| [#47512](https://github.com/oven-sh/bun/pull/47512) | Put the small hot fields of the checker, parser and formatter structs first | dylan-conway | 2026-10-31 |  |
| [#47498](https://github.com/oven-sh/bun/pull/47498) | Shrink defaultGlobalObject's inline part and use putDirectNamed at 114 more sites | dylan-conway | 2026-10-31 |  |
| [#47490](https://github.com/oven-sh/bun/pull/47490) | Compile four cold paths in lint, the type checker and error conversion once | dylan-conway | 2026-10-31 |  |
| [#47414](https://github.com/oven-sh/bun/pull/47414) | Remove 126 `unsafe` blocks from the core crates, the resolver and the package manager | dylan-conway | 2026-11-03 |  |
| [#47395](https://github.com/oven-sh/bun/pull/47395) | tty: keep fds 0-2 open on destroy, and give WriteStream its own prototype | dylan-conway | 2026-10-31 |  |
| [#47393](https://github.com/oven-sh/bun/pull/47393) | Remove 146 `unsafe` blocks from the dev server and the `Bun.*` APIs | dylan-conway | 2026-10-29 |  |
| [#47382](https://github.com/oven-sh/bun/pull/47382) | Remove 128 `unsafe` blocks from the test runner and the CLI | dylan-conway | 2026-10-29 |  |
| [#47338](https://github.com/oven-sh/bun/pull/47338) | Remove 118 `unsafe` blocks from the syscall wrappers and the shell | dylan-conway | 2026-10-29 |  |
| [#47326](https://github.com/oven-sh/bun/pull/47326) | Fix false alarms in the scan behind `compile-trim-capabilities.test.ts` | dylan-conway | 2026-10-29 |  |
| [#47323](https://github.com/oven-sh/bun/pull/47323) | test: the floor of the ICU version takes a version with more parts than it has | Jarred-Sumner | 2026-10-29 |  |
| [#47317](https://github.com/oven-sh/bun/pull/47317) | Remove 74 `unsafe` blocks from the css parser, the bundler and the JS parser | dylan-conway | 2026-10-29 |  |
| [#47316](https://github.com/oven-sh/bun/pull/47316) | AOT: bun test --aot on large suites, module loading fixes, fuzzer fixes | Jarred-Sumner | 2026-10-31 |  |
| [#47299](https://github.com/oven-sh/bun/pull/47299) | Fix the build of bun_bundler with the test_support feature | Jarred-Sumner | 2026-10-29 |  |
| [#47291](https://github.com/oven-sh/bun/pull/47291) | Remove 166 `unsafe` blocks by borrowing and by naming the lifetimes that values already have | dylan-conway | 2026-10-29 |  |
| [#47281](https://github.com/oven-sh/bun/pull/47281) | Remove the address space ballast and the mimalloc patches, upgrade mimalloc to v3.6.0 and ICU to 79.1 | Jarred-Sumner | 2026-10-29 |  |
| [#47278](https://github.com/oven-sh/bun/pull/47278) | TextDecoder: throw when the result cannot be allocated or is too long | dylan-conway | 2026-10-29 |  |
| [#47273](https://github.com/oven-sh/bun/pull/47273) | Remove 70 `unsafe` blocks by borrowing instead of holding raw pointers | dylan-conway | 2026-10-29 |  |
| [#47253](https://github.com/oven-sh/bun/pull/47253) | sha: drop the unused `ENGINE` argument of the EVP hashers' `hash` | dylan-conway | 2026-10-28 |  |
| [#47251](https://github.com/oven-sh/bun/pull/47251) | js_printer: give `RequireOrImportMetaCallback` the lifetime of its context | dylan-conway | 2026-10-28 |  |
| [#47250](https://github.com/oven-sh/bun/pull/47250) | resolver: `Entry::kind` and `Entry::symlink` take `&RealFS` and are safe | dylan-conway | 2026-10-28 |  |
| [#47249](https://github.com/oven-sh/bun/pull/47249) | Zero-initialize plain C structs with the safe `ffi::zeroed()` | dylan-conway | 2026-10-28 |  |
| [#47247](https://github.com/oven-sh/bun/pull/47247) | Drop `detach_lifetime` where the data already has the lifetime | dylan-conway | 2026-10-28 |  |
| [#47238](https://github.com/oven-sh/bun/pull/47238) | shell: reference-count IO objects with `Rc` instead of `Arc` | dylan-conway | 2026-10-28 |  |
| [#47235](https://github.com/oven-sh/bun/pull/47235) | crash handler: give `CrashReason` the lifetime of its panic message | dylan-conway | 2026-10-28 |  |
| [#47231](https://github.com/oven-sh/bun/pull/47231) | uws: put `Loop`'s fields in `Cell`s so its methods take `&self` | dylan-conway | 2026-10-28 |  |
| [#47129](https://github.com/oven-sh/bun/pull/47129) | AOT: fixes for modules, classes and Workers, WebKit upgrade, shorter compiler docs | Jarred-Sumner | 2026-10-29 |  |
| [#47125](https://github.com/oven-sh/bun/pull/47125) | Upgrade WebKit to fcc1ea0973a4 | Jarred-Sumner | 2026-10-28 |  |
| [#47112](https://github.com/oven-sh/bun/pull/47112) | Upgrade WebKit to e8f704815e94 | robobun | 2026-10-30 | claude |
| [#47106](https://github.com/oven-sh/bun/pull/47106) | Keep `Bun.Archive.extract()` and directory routes inside their directory, and bound sparse holes in `files()` | Jarred-Sumner | 2026-10-28 |  |
| [#47087](https://github.com/oven-sh/bun/pull/47087) | fs: add windowsHandle option to file streams | ig-ant | 2026-10-29 |  |
| [#47070](https://github.com/oven-sh/bun/pull/47070) | Replace libspng with a PNG codec in safe Rust and two Highway kernels | dylan-conway | 2026-10-31 |  |
| [#47057](https://github.com/oven-sh/bun/pull/47057) | Upgrade WebKit to 191c6a41380b | dylan-conway | 2026-10-27 |  |
| [#47037](https://github.com/oven-sh/bun/pull/47037) | Replace bytemuck with an in-tree crate, bun_pod | dylan-conway | 2026-10-27 |  |
| [#47035](https://github.com/oven-sh/bun/pull/47035) | Upgrade WebKit to 982277c9dd3e | dylan-conway | 2026-10-27 |  |
| [#47025](https://github.com/oven-sh/bun/pull/47025) | css: consolidate the open CSS parser fixes | Jarred-Sumner | 2026-10-27 |  |
| [#47008](https://github.com/oven-sh/bun/pull/47008) | install: print the loaded .env files only with --verbose | robobun | 2026-10-26 | claude |
| [#46980](https://github.com/oven-sh/bun/pull/46980) | bun lint: give JS plugin nodes and tokens start and end in TypeScript files without an ESLint or oxlint config | robobun | 2026-10-26 | claude |
| [#46969](https://github.com/oven-sh/bun/pull/46969) | mordant: lower the baseline by 21 findings that are gone from main | robobun | 2026-11-02 | claude |
| [#46834](https://github.com/oven-sh/bun/pull/46834) | Fix use-after-free of `BuildMessage.position.file`: real lifetimes for `Source`, `Path`, `ImportRecord` and resolve results | dylan-conway | 2026-10-27 |  |
| [#46825](https://github.com/oven-sh/bun/pull/46825) | bun_core::String can no longer borrow (fixes a source-map name use-after-free) | dylan-conway | 2026-10-27 |  |
| [#46718](https://github.com/oven-sh/bun/pull/46718) | darwin-ci: host.sh installs the pinned bun over a different version | dylan-conway | 2026-10-24 |  |
| [#46690](https://github.com/oven-sh/bun/pull/46690) | Upgrade WebKit to f59345e04a8d | dylan-conway | 2026-10-24 |  |
| [#46678](https://github.com/oven-sh/bun/pull/46678) | `bun check`: keep a nested object literal widened in a generic function | alii | 2026-10-24 |  |
| [#46650](https://github.com/oven-sh/bun/pull/46650) | Replace HdrHistogram with safe Rust and fix `node:perf_hooks` histograms | dylan-conway | 2026-10-27 |  |
| [#46641](https://github.com/oven-sh/bun/pull/46641) | bindgen: move the stream sinks to a schema and delete `generate-jssink.ts` | dylan-conway | 2026-10-24 |  |
| [#46638](https://github.com/oven-sh/bun/pull/46638) | Replace libarchive with a tar reader and writer in safe Rust | dylan-conway | 2026-10-27 |  |
| [#46607](https://github.com/oven-sh/bun/pull/46607) | zlib: reach the z_stream only through a raw pointer while zlib-ng holds its back-pointer | robobun | 2026-10-24 | claude |
| [#46588](https://github.com/oven-sh/bun/pull/46588) | deps: update c-ares to v1.34.9 | robobun | 2026-10-24 | claude |
| [#46542](https://github.com/oven-sh/bun/pull/46542) | Make `--use-openssl-ca` leave out the bundled root certificates | dylan-conway | 2026-10-23 |  |
| [#46540](https://github.com/oven-sh/bun/pull/46540) | bindgen: move every Rust function that takes a `CallFrame` to schemas and delete `#[host_fn]`, `$rust` and `$newRustFunction` | dylan-conway | 2026-10-23 |  |
| [#46533](https://github.com/oven-sh/bun/pull/46533) | Build with Bun 1.4.4, update Node.js to 26.12.1 | dylan-conway | 2026-10-23 |  |
| [#46505](https://github.com/oven-sh/bun/pull/46505) | console.groupCollapsed: start a group, as console.group does | robobun | 2026-10-25 | claude |
| [#46498](https://github.com/oven-sh/bun/pull/46498) | release: fix the Homebrew job and a flaky Docker download | Jarred-Sumner | 2026-10-22 |  |
| [#46486](https://github.com/oven-sh/bun/pull/46486) | bunx: fix the .bin link of a native dependency in more cases | Jarred-Sumner | 2026-10-26 |  |
| [#46480](https://github.com/oven-sh/bun/pull/46480) | install: fall back to copyfile only when the hard link itself fails | robobun | 2026-10-22 | claude |
| [#46468](https://github.com/oven-sh/bun/pull/46468) | bunx: run the platform binary of a native dependency, not its stub | Jarred-Sumner | 2026-10-22 |  |
| [#46462](https://github.com/oven-sh/bun/pull/46462) | ci: fix the Windows sign step on the Build Tools image | dylan-conway | 2026-10-22 |  |
| [#46461](https://github.com/oven-sh/bun/pull/46461) | compile: revert the startup check of every module graph offset | dylan-conway | 2026-10-22 |  |
| [#46456](https://github.com/oven-sh/bun/pull/46456) | node:http, node:http2: refuse the malformed requests that Node refuses | Jarred-Sumner | 2026-10-22 |  |
| [#46455](https://github.com/oven-sh/bun/pull/46455) | Fix 7 regressions since 1.4.3 in bun install, bunx, bun patch, bun pm pack and bun: imports | Jarred-Sumner | 2026-10-22 |  |
| [#46452](https://github.com/oven-sh/bun/pull/46452) | usockets: fail the connection when send() reports too many bytes | dylan-conway | 2026-10-22 |  |
| [#46439](https://github.com/oven-sh/bun/pull/46439) | `bun lint`: a command in release builds, with shorter hints | Jarred-Sumner | 2026-10-26 |  |
| [#46438](https://github.com/oven-sh/bun/pull/46438) | `bun lint`: a command in canary builds only | Jarred-Sumner | 2026-10-22 |  |
| [#46436](https://github.com/oven-sh/bun/pull/46436) | http3: lift lsquic's limits on header sizes, and honor the stream ID of a GOAWAY | Jarred-Sumner | 2026-10-22 |  |
| [#46417](https://github.com/oven-sh/bun/pull/46417) | `bun check`: fix two regressions from #46001, the empty name in TS2883, and `this` of a constrained type parameter | Jarred-Sumner | 2026-10-22 |  |
| [#46410](https://github.com/oven-sh/bun/pull/46410) | structuredClone: reject RSA CryptoKey records with no hash and ChaCha20-Poly1305 keys that are not 32 bytes | dylan-conway | 2026-10-22 |  |
| [#46409](https://github.com/oven-sh/bun/pull/46409) | fetch, RedisClient: a TLS session that breaks after its handshake is a lost connection, not a failed handshake | dylan-conway | 2026-10-22 |  |
| [#46408](https://github.com/oven-sh/bun/pull/46408) | sql(postgres): read the rows of a Bind written before its statement's RowDescription as text | dylan-conway | 2026-10-21 |  |
| [#46405](https://github.com/oven-sh/bun/pull/46405) | bun test --isolate: a macro call is `undefined` from the second test file on | dylan-conway | 2026-10-22 |  |
| [#46394](https://github.com/oven-sh/bun/pull/46394) | install: re-parse a cached package.json in the call that replaces its text | robobun | 2026-10-22 | claude |
| [#46392](https://github.com/oven-sh/bun/pull/46392) | Fix regressions since 1.4.3 in bun install, bunx, node:fs and node:http2, and update brotli | Jarred-Sumner | 2026-10-22 |  |
| [#46390](https://github.com/oven-sh/bun/pull/46390) | ws: keep the async context of the call beside each waiting send callback | robobun | 2026-10-22 | claude |
| [#46389](https://github.com/oven-sh/bun/pull/46389) | Fix quadratic `Bun.stringWidth` on non-ASCII multi-line text | dylan-conway | 2026-10-22 |  |
| [#46387](https://github.com/oven-sh/bun/pull/46387) | structuredClone: reject malformed CryptoKey records instead of returning bogus or null keys | dylan-conway | 2026-10-21 |  |
| [#46379](https://github.com/oven-sh/bun/pull/46379) | fetch: stop a `Connection: keep-alive` header from undoing `keepalive: false` on HTTP/1.1 | robobun | 2026-10-21 | claude |
| [#46378](https://github.com/oven-sh/bun/pull/46378) | bun build --react-compiler: catch has its own position in the source map | dylan-conway | 2026-10-21 |  |
| [#46363](https://github.com/oven-sh/bun/pull/46363) | bundler: convert the prelinked graph's request count to u16 once | robobun | 2026-11-02 | claude |
| [#46335](https://github.com/oven-sh/bun/pull/46335) | tls: keep a stream TLS engine's context alive while its entry points run | robobun | 2026-10-21 | claude |
| [#46329](https://github.com/oven-sh/bun/pull/46329) | bindgen: move the remaining 61 classes to schemas and delete `generate-classes.ts` | dylan-conway | 2026-10-22 |  |
| [#46327](https://github.com/oven-sh/bun/pull/46327) | bun test --coverage: list the lines of case and default | dylan-conway | 2026-10-21 |  |
| [#46317](https://github.com/oven-sh/bun/pull/46317) | build: --hardened=on compiles everything with the stack protector, _FORTIFY_SOURCE, stack clash protection and zeroed locals | dylan-conway | 2026-10-21 |  |
| [#46310](https://github.com/oven-sh/bun/pull/46310) | docs: update the Prisma guides to Prisma ORM 8 | ankur-arch | 2026-11-02 |  |
| [#46301](https://github.com/oven-sh/bun/pull/46301) | bun test --coverage: list the line of finally | dylan-conway | 2026-10-21 |  |
| [#46300](https://github.com/oven-sh/bun/pull/46300) | tls: reject chains containing blocked public keys, update root certificates to NSS 3.131.1 | dylan-conway | 2026-10-21 |  |
| [#46298](https://github.com/oven-sh/bun/pull/46298) | ci: update buildkite-agent to 4.7.0 | dylan-conway | 2026-10-21 |  |
| [#46291](https://github.com/oven-sh/bun/pull/46291) | Fix `bun:sqlite` segfault in `Statement#run` before any `Database` has been opened | dylan-conway | 2026-10-21 |  |
| [#46283](https://github.com/oven-sh/bun/pull/46283) | Fix `FileSink` panic when `start({ path })` moves a writer from a TTY to a regular file | dylan-conway | 2026-10-21 |  |
| [#46279](https://github.com/oven-sh/bun/pull/46279) | Upgrade WebKit to 33ce3bf11a71 | sosukesuzuki | 2026-10-23 |  |
| [#46274](https://github.com/oven-sh/bun/pull/46274) | Fix `TextEncoder.encodeInto` panic on a detached destination | dylan-conway | 2026-10-21 |  |
| [#46270](https://github.com/oven-sh/bun/pull/46270) | Hardening follow-up: fix regressions from #46021 and more crashes | Jarred-Sumner | 2026-10-21 |  |
| [#46244](https://github.com/oven-sh/bun/pull/46244) | mordant: remove baseline counts for findings that are gone | robobun | 2026-11-02 | claude |
| [#46240](https://github.com/oven-sh/bun/pull/46240) | pack: read an ignore line or `files` entry that begins with `!(` as a negation again | robobun | 2026-10-22 | claude |
| [#46230](https://github.com/oven-sh/bun/pull/46230) | install: apply overrides to the range that bun add and bun update write | robobun | 2026-10-22 | claude |
| [#46229](https://github.com/oven-sh/bun/pull/46229) | dev server: an `export *` after another statement of the same path loses exports of a barrel target | robobun | 2026-10-22 | claude |
| [#46227](https://github.com/oven-sh/bun/pull/46227) | ci-images: update the system's trusted roots | dylan-conway | 2026-10-20 |  |
| [#46183](https://github.com/oven-sh/bun/pull/46183) | Coverage: code that is skipped, or never reached after a yield or an await, reads as not run | dylan-conway | 2026-10-21 |  |
| [#46161](https://github.com/oven-sh/bun/pull/46161) | bun test --coverage: list the lines of an object literal's braces and of else | dylan-conway | 2026-10-21 |  |
| [#46159](https://github.com/oven-sh/bun/pull/46159) | crypto: update root certificates | Jarred-Sumner | 2026-10-20 |  |
| [#46135](https://github.com/oven-sh/bun/pull/46135) | test: fix bake.test.ts cleanup and the --check URL on Windows | alii | 2026-10-20 |  |
| [#46128](https://github.com/oven-sh/bun/pull/46128) | bindgen: classes whose struct outlives the JS object, and move `Timeout`, `Immediate`, `NodeHTTPResponse` and 14 more to schemas | dylan-conway | 2026-10-21 |  |
| [#46021](https://github.com/oven-sh/bun/pull/46021) | Hardening: fix crashes across the runtime, bundler, dev server, shell and CLI | Jarred-Sumner | 2026-10-20 |  |
| [#46017](https://github.com/oven-sh/bun/pull/46017) | bun bake: require() of a built-in, and a route whose import threw | alii | 2026-10-20 |  |
| [#46001](https://github.com/oven-sh/bun/pull/46001) | `bun check`: fix errors lost since #45800, and 9 to 37% faster | Jarred-Sumner | 2026-10-20 |  |
| [#45996](https://github.com/oven-sh/bun/pull/45996) | bun bake: the framework names the server-only exports of its pages | alii | 2026-10-20 |  |
| [#45959](https://github.com/oven-sh/bun/pull/45959) | dev error overlay: the look of bun.com, and errors of one kind in one card | alii | 2026-10-19 |  |
| [#45921](https://github.com/oven-sh/bun/pull/45921) | dev error overlay: scroll, show duplicate errors once, underline the whole css url() | alii | 2026-10-19 |  |
| [#45911](https://github.com/oven-sh/bun/pull/45911) | bun bake: getServerSideProps, getStaticProps and getStaticPaths | alii | 2026-10-19 |  |
| [#45905](https://github.com/oven-sh/bun/pull/45905) | bun bake: .tsx pages and frameworks in bake.config.ts | alii | 2026-10-18 |  |
| [#45902](https://github.com/oven-sh/bun/pull/45902) | bun bake: start again when bake.config.ts changes | alii | 2026-10-18 |  |
| [#45898](https://github.com/oven-sh/bun/pull/45898) | install: fix regressions since 1.4.3 and resolve peer dependencies more like pnpm | Jarred-Sumner | 2026-10-18 |  |
| [#45888](https://github.com/oven-sh/bun/pull/45888) | Move `Crypto`, `TextDecoder`, `Bun.FileSystemRouter` and three more classes to bindgen schemas | dylan-conway | 2026-10-19 |  |
| [#45873](https://github.com/oven-sh/bun/pull/45873) | test: fix 20 flaky tests | dylan-conway | 2026-10-20 |  |
| [#45851](https://github.com/oven-sh/bun/pull/45851) | Move 58 small natives of `node:*` and `Bun` to bindgen schemas | dylan-conway | 2026-10-18 |  |
| [#45828](https://github.com/oven-sh/bun/pull/45828) | bun bake: build plugins from bake.config.ts | alii | 2026-10-18 |  |
| [#45823](https://github.com/oven-sh/bun/pull/45823) | Take a `Bun.build()` output as the Blob it holds in `Bun.hash`, `CryptoHasher`, the parsers and the client `WebSocket` | robobun | 2026-10-21 | claude |
| [#45821](https://github.com/oven-sh/bun/pull/45821) | test: do not wait for a build that is already done in module-graph-isolation.test.ts | dylan-conway | 2026-10-18 |  |
| [#45813](https://github.com/oven-sh/bun/pull/45813) | test: wait for the child in module-graph-workers.test.ts only once the worker's dispose() has returned | dylan-conway | 2026-10-18 |  |
| [#45811](https://github.com/oven-sh/bun/pull/45811) | test: install the signal storm handler of setTimeout.test.js with SA_RESTART | dylan-conway | 2026-10-18 |  |
| [#45809](https://github.com/oven-sh/bun/pull/45809) | test: rename the marker file into place in the macOS end-to-end test of cron.test.ts | dylan-conway | 2026-10-18 |  |
| [#45808](https://github.com/oven-sh/bun/pull/45808) | test: compile eight components on Windows in the chain of functions test of react-compiler.test.ts | dylan-conway | 2026-10-18 |  |
| [#45800](https://github.com/oven-sh/bun/pull/45800) | `bun check`: 1.4x to 7.8x faster on large projects. Fixes for `bun check`, `bun lint` and `bun fmt` | Jarred-Sumner | 2026-10-19 |  |
| [#45794](https://github.com/oven-sh/bun/pull/45794) | Check published types against the bindgen schemas, honor `memLevel` and `strategy` in `gzipSync` and `deflateSync`, and pass dictionaries to Rust by reference | dylan-conway | 2026-10-18 |  |
| [#45783](https://github.com/oven-sh/bun/pull/45783) | install: put the resolutions back after a layout hoist | robobun | 2026-10-21 | claude |
| [#45764](https://github.com/oven-sh/bun/pull/45764) | Remove dead code from bun_lint, bun_sema, BunProcess.cpp, and NodeDirent.cpp | robobun | 2026-10-18 | claude |
| [#45720](https://github.com/oven-sh/bun/pull/45720) | WebSocket client: follow-up fixes to #45223 | Jarred-Sumner | 2026-10-18 |  |
| [#45711](https://github.com/oven-sh/bun/pull/45711) | sql: fixes for problems found after the consolidation (#45304) | Jarred-Sumner | 2026-10-18 |  |
| [#45710](https://github.com/oven-sh/bun/pull/45710) | install: more fixes after the package manager consolidation | Jarred-Sumner | 2026-10-18 |  |
| [#45692](https://github.com/oven-sh/bun/pull/45692) | test: spell PATH one way in bunEnv on Windows | dylan-conway | 2026-10-17 |  |
| [#45688](https://github.com/oven-sh/bun/pull/45688) | test: yield the next chunk once the client has the first in async-iterator-stream.test.ts | dylan-conway | 2026-10-17 |  |
| [#45687](https://github.com/oven-sh/bun/pull/45687) | Define Bun.CryptoHasher, the static hashers and Bun.sha with the bindgen | dylan-conway | 2026-10-17 |  |
| [#45686](https://github.com/oven-sh/bun/pull/45686) | test: wait for the close callback in the batch test of node-dgram.test.js | dylan-conway | 2026-10-17 |  |
| [#45682](https://github.com/oven-sh/bun/pull/45682) | add bun bake: serve app/pages and app/server.ts | alii | 2026-10-18 |  |
| [#45677](https://github.com/oven-sh/bun/pull/45677) | Source positions: coverage, stack frames, call sites and source maps agree with the source | dylan-conway | 2026-10-20 |  |
| [#45674](https://github.com/oven-sh/bun/pull/45674) | test: ask the heap what keeps a graph alive in the 50 graphs test of module-graph.test.ts | dylan-conway | 2026-10-17 |  |
| [#45661](https://github.com/oven-sh/bun/pull/45661) | test: have the grandchild of the crashed worker test in parallel.test.ts block in wait | dylan-conway | 2026-10-17 |  |
| [#45644](https://github.com/oven-sh/bun/pull/45644) | test: give the registry.npmjs.org stand-in of the migration tests its own cache | dylan-conway | 2026-10-17 |  |
| [#45641](https://github.com/oven-sh/bun/pull/45641) | test(bake): remove the test that checks `Response.render` stays removed | robobun | 2026-10-17 | claude |
| [#45640](https://github.com/oven-sh/bun/pull/45640) | test: compare the tarballs of the overrides test in run-autoinstall.test.ts without their order | dylan-conway | 2026-10-17 |  |
| [#45639](https://github.com/oven-sh/bun/pull/45639) | test: keep hot() from being inlined in disallow-code-generation-from-strings.test.ts | dylan-conway | 2026-10-17 |  |
| [#45636](https://github.com/oven-sh/bun/pull/45636) | test: run harness-max-rss.test.ts and compile-rss.test.ts outside the parallel batch | dylan-conway | 2026-10-17 |  |
| [#45635](https://github.com/oven-sh/bun/pull/45635) | test: drop the 5 second timeout of load-same-js-file-a-lot.test.ts | dylan-conway | 2026-10-17 |  |
| [#45631](https://github.com/oven-sh/bun/pull/45631) | Compile TypeScript to machine code ahead of time: `bun build --compile --aot` | Jarred-Sumner | 2026-10-27 |  |
| [#45616](https://github.com/oven-sh/bun/pull/45616) | install: accept a migrated yarn.lock whose resolutions key has a range | Jarred-Sumner | 2026-10-17 |  |
| [#45605](https://github.com/oven-sh/bun/pull/45605) | bake: fix a plugin leak, ignoreDirs parsing, and a router crash | alii | 2026-10-16 |  |
| [#45600](https://github.com/oven-sh/bun/pull/45600) | test: start the exit timer in worker-terminate-lifetime.test.ts once the fetches have responded | dylan-conway | 2026-10-17 |  |
| [#45598](https://github.com/oven-sh/bun/pull/45598) | test: reset with terminate() in the close() error tests of socket.test.ts | dylan-conway | 2026-10-17 |  |
| [#45595](https://github.com/oven-sh/bun/pull/45595) | `bun lint`: JSON and Markdown natively, programs in parallel. `bun check -b`: share work between projects. `bun fmt`: `package.json` and Svelte without Prettier | Jarred-Sumner | 2026-10-17 |  |
| [#45593](https://github.com/oven-sh/bun/pull/45593) | YAML.parse: name a key that is a sequence or a mapping once the input has been read | dylan-conway | 2026-10-16 |  |
| [#45590](https://github.com/oven-sh/bun/pull/45590) | Add b.bytes and define thirty-five Bun.* functions with the bindgen | dylan-conway | 2026-10-17 |  |
| [#45588](https://github.com/oven-sh/bun/pull/45588) | test: pack the rename-retry fixture with Bun.Archive, not the system tar | dylan-conway | 2026-10-16 |  |
| [#45567](https://github.com/oven-sh/bun/pull/45567) | Bump WebKit to 87ee10da087b | dylan-conway | 2026-10-16 |  |
| [#45489](https://github.com/oven-sh/bun/pull/45489) | bake: move the code into folders by job (no behavior change) | alii | 2026-10-16 |  |
| [#45482](https://github.com/oven-sh/bun/pull/45482) | `bun lint`, `bun fmt`, `bun check`: fix the open issues | Jarred-Sumner | 2026-10-16 |  |
| [#45481](https://github.com/oven-sh/bun/pull/45481) | remove JSPromise Strong::from_value, its last caller is gone | alii | 2026-10-16 |  |
| [#45478](https://github.com/oven-sh/bun/pull/45478) | ci: bump mordant to 564c8da | alii | 2026-10-16 |  |
| [#45477](https://github.com/oven-sh/bun/pull/45477) | install: replace a file at a command's name behind a symlinked node_modules | Jarred-Sumner | 2026-10-16 |  |
| [#45465](https://github.com/oven-sh/bun/pull/45465) | ci: bump mordant to 0d47474 | alii | 2026-10-16 |  |
| [#45463](https://github.com/oven-sh/bun/pull/45463) | ci: bump mordant to 8ba3540 | alii | 2026-10-16 |  |
| [#45461](https://github.com/oven-sh/bun/pull/45461) | bake: drop React-specific behavior from core ("use server", --server-components, bun:app) | alii | 2026-10-16 |  |
| [#45460](https://github.com/oven-sh/bun/pull/45460) | install: terse messages, quieter output, and retries that start at 50 ms | Jarred-Sumner | 2026-10-16 |  |
| [#45454](https://github.com/oven-sh/bun/pull/45454) | Bun.indexOfLine with the bindgen, and .allowShared for a SharedArrayBuffer | dylan-conway | 2026-10-16 |  |
| [#45451](https://github.com/oven-sh/bun/pull/45451) | `bun lint --type-aware`: ask for types on demand instead of checking every file first | Jarred-Sumner | 2026-10-16 |  |
| [#45450](https://github.com/oven-sh/bun/pull/45450) | Define eighteen Bun.* functions with the bindgen | dylan-conway | 2026-10-16 |  |
| [#45446](https://github.com/oven-sh/bun/pull/45446) | Compile cache: skip the bytecode optimizer when writing entries | robobun | 2026-10-16 | claude |
| [#45435](https://github.com/oven-sh/bun/pull/45435) | js_parser: bind the body of a class with lowered class decorators to the decorated class | robobun | 2026-10-21 | claude |
| [#45427](https://github.com/oven-sh/bun/pull/45427) | Bump WebKit: the GC suspend signal handler works on an alternate signal stack | robobun | 2026-10-21 | claude |
| [#45423](https://github.com/oven-sh/bun/pull/45423) | `fs.realpath`: a backslash is part of the file name on POSIX, and each variant reads its path as Node does | dylan-conway | 2026-10-17 |  |
| [#45422](https://github.com/oven-sh/bun/pull/45422) | fetch over HTTP/2: reject on a TLS alert after the handshake, and stop using a connection that went silent after an abort | Jarred-Sumner | 2026-10-16 |  |
| [#45307](https://github.com/oven-sh/bun/pull/45307) | install: fix regressions and older bugs found after the package manager consolidation | Jarred-Sumner | 2026-10-16 |  |
| [#45304](https://github.com/oven-sh/bun/pull/45304) | sql: consolidate the open Bun.sql, bun:sqlite and node:sqlite pull requests | Jarred-Sumner | 2026-10-17 |  |
| [#45303](https://github.com/oven-sh/bun/pull/45303) | Upgrade WebKit to 23b0720b40 | sosukesuzuki | 2026-10-16 |  |
| [#45302](https://github.com/oven-sh/bun/pull/45302) | `bun lint`: warn when a tsconfig.json without `include` made it load many files to lint a few | Jarred-Sumner | 2026-10-16 |  |
| [#45297](https://github.com/oven-sh/bun/pull/45297) | `bun lint`: categories skip frameworks the project doesn't use, and `"plugin/*" = "off"` turns a plugin off | Jarred-Sumner | 2026-10-15 |  |
| [#45294](https://github.com/oven-sh/bun/pull/45294) | Bun.ModuleGraph: `dispose()` closes the `Bun.Terminal` terminals the graph opened | dylan-conway | 2026-10-15 |  |
| [#45293](https://github.com/oven-sh/bun/pull/45293) | Bun.ModuleGraph: `dispose()` with a `node:http` server still listening no longer leaks the graph | dylan-conway | 2026-10-15 |  |
| [#45291](https://github.com/oven-sh/bun/pull/45291) | util.inspect: don't take the iterator guards from the writable `node:util/types` | dylan-conway | 2026-10-15 |  |
| [#45290](https://github.com/oven-sh/bun/pull/45290) | Round long hexadecimal, octal and binary literals to the nearest double | dylan-conway | 2026-10-15 |  |
| [#45289](https://github.com/oven-sh/bun/pull/45289) | Fix aborts from `channel._subscribers` and `Object.prototype.onEndCallbacks`, and handle `_subscribers` as Node does | dylan-conway | 2026-10-15 |  |
| [#45283](https://github.com/oven-sh/bun/pull/45283) | worker_threads: array methods see indexed keys of a `SHARE_ENV` `process.env` prototype | dylan-conway | 2026-10-15 |  |
| [#45281](https://github.com/oven-sh/bun/pull/45281) | TextEncoder: fix `encode` of a substring whose parent string changed width | dylan-conway | 2026-10-15 |  |
| [#45280](https://github.com/oven-sh/bun/pull/45280) | build: link the WebKit prebuilts with assertions and coverage of JSC on Linux x64 | dylan-conway | 2026-10-15 |  |
| [#45272](https://github.com/oven-sh/bun/pull/45272) | Bump WebKit: the limits of cgroup v2 are seen where a cgroup v1 hierarchy exists beside it | Jarred-Sumner | 2026-10-15 |  |
| [#45268](https://github.com/oven-sh/bun/pull/45268) | `bun fmt` and `bun lint`: follow-ups to the comment model | Jarred-Sumner | 2026-10-15 |  |
| [#45223](https://github.com/oven-sh/bun/pull/45223) | WebSocket: real closing handshake, one failure path, `ws` rewritten on native transports (consolidates the open WebSocket PRs) | Jarred-Sumner | 2026-10-17 |  |
| [#45173](https://github.com/oven-sh/bun/pull/45173) | `--disallow-code-generation-from-strings=strict` runs static code only, checked in one place in the engine | dylan-conway | 2026-10-15 |  |
| [#45150](https://github.com/oven-sh/bun/pull/45150) | Windows: no debug panic in `bun check`, `lint`, `fmt` without a package.json | dylan-conway | 2026-10-15 |  |
| [#45147](https://github.com/oven-sh/bun/pull/45147) | `bun check`: no system call per link when listing a directory on Windows | dylan-conway | 2026-10-15 |  |
| [#45144](https://github.com/oven-sh/bun/pull/45144) | ci-images: check every download against a sha256, and pin what still floated | dylan-conway | 2026-10-15 |  |
| [#45104](https://github.com/oven-sh/bun/pull/45104) | One bindgen: replace bindgen v1 and v2, add classes, generate the Rust side | dylan-conway | 2026-10-16 |  |
| [#44833](https://github.com/oven-sh/bun/pull/44833) | bun test: Vitest compatibility | Jarred-Sumner | 2026-10-31 |  |
| [#44496](https://github.com/oven-sh/bun/pull/44496) | bake: options own their strings, in one set of types | dylan-conway | 2026-10-16 |  |
| [#44419](https://github.com/oven-sh/bun/pull/44419) | node:http: a request gets its body behind the FIN of socket.end() | robobun | 2026-10-22 | claude |
| [#44413](https://github.com/oven-sh/bun/pull/44413) | test: bind the blackhole listener to lo0 on macOS | robobun | 2026-10-17 | claude |
| [#42482](https://github.com/oven-sh/bun/pull/42482) | react-compiler: fix a throw on each render and stale values for a `let` that a memo block reassigns | robobun | 2026-10-22 | claude |
| [#41721](https://github.com/oven-sh/bun/pull/41721) | Bun.write: stop reporting a caught direct stream failure as an unhandled rejection | robobun | 2026-10-22 | claude |

## Ouvertes (300)

| PR | Titre | Auteur | Date | Labels |
|---|---|---|---|---|
| [#48937](https://github.com/oven-sh/bun/pull/48937) | test(aot): check how each run of the two ModuleGraph loader files ends | robobun | 2026-11-14 | claude |
| [#48935](https://github.com/oven-sh/bun/pull/48935) | Keep the line, column and sourceURL that user code assigns to an Error | robobun | 2026-11-14 | claude |
| [#48934](https://github.com/oven-sh/bun/pull/48934) | bun test --aot: vi.doMock() keeps a loaded module for importers whose body has begun | robobun | 2026-11-14 | claude |
| [#48933](https://github.com/oven-sh/bun/pull/48933) | Leave NODE_ENV to the runtime for Bun.build env "disable" and emit jsx in builds that do not define it | robobun | 2026-11-14 | claude |
| [#48932](https://github.com/oven-sh/bun/pull/48932) | node:net: wire a socket's `signal` with `addAbortSignal`, and report what a listener throws on such a socket | robobun | 2026-11-14 | claude |
| [#48931](https://github.com/oven-sh/bun/pull/48931) | child_process: close child.stdin with no 'error' when the child exited before the loop's first poll | robobun | 2026-11-14 | claude |
| [#48930](https://github.com/oven-sh/bun/pull/48930) | test: a non-special URL with credentials keeps an empty path before a query or fragment (needs oven-sh/WebKit#1056) | robobun | 2026-11-14 | claude |
| [#48929](https://github.com/oven-sh/bun/pull/48929) | AOT: a cycle that a question of Lower closes with an empty stack is not noted | robobun | 2026-11-14 | claude |
| [#48927](https://github.com/oven-sh/bun/pull/48927) | inspector, sql: fail on a unix URL with no socket path instead of using TCP | robobun | 2026-11-14 | claude |
| [#48926](https://github.com/oven-sh/bun/pull/48926) | AOT: programs and mocks of test runs, built-ins behind ?. | Jarred-Sumner | 2026-11-14 |  |
| [#48925](https://github.com/oven-sh/bun/pull/48925) | react-compiler: depend on the root variable of a read that nothing reads (with #46898, #47209) | robobun | 2026-11-14 | claude |
| [#48924](https://github.com/oven-sh/bun/pull/48924) | fix(console): add 'Assertion failed:' prefix to console.assert with message | LeonxLJX | 2026-11-14 |  |
| [#48923](https://github.com/oven-sh/bun/pull/48923) | test: run the Azure Service Bus test against a local AMQP broker | robobun | 2026-11-14 | claude |
| [#48922](https://github.com/oven-sh/bun/pull/48922) | ci: regenerate the shard weights from measured runs, and rewrite test/expected-durations.json in place | robobun | 2026-11-14 | claude |
| [#48921](https://github.com/oven-sh/bun/pull/48921) | ci: raise the job limit of the Linux asan test lane to 60 minutes and of the Ubuntu lanes to 45 | robobun | 2026-11-14 | claude |
| [#48920](https://github.com/oven-sh/bun/pull/48920) | node:buffer: reject DataView in Buffer.copyBytesFrom | robobun | 2026-11-14 | claude |
| [#48919](https://github.com/oven-sh/bun/pull/48919) | bun test: keep names re-exported from a mocked module in the original of a patched module | robobun | 2026-11-14 | claude |
| [#48918](https://github.com/oven-sh/bun/pull/48918) | FileReader: leave every read for a Node stream to the poll callback | robobun | 2026-11-14 | claude |
| [#48917](https://github.com/oven-sh/bun/pull/48917) | Decide the uncaughtException origin of an entry point where the loader runs it | robobun | 2026-11-14 | claude |
| [#48916](https://github.com/oven-sh/bun/pull/48916) | bun:test: record the methods a `{ spy: true }` class defines, and mock only those on each instance it constructs | robobun | 2026-11-14 | claude |
| [#48915](https://github.com/oven-sh/bun/pull/48915) | napi: run queued finalizers, completions, uv_close and threadsafe function callbacks before the env cleanup at a Worker exit | robobun | 2026-11-14 | claude |
| [#48914](https://github.com/oven-sh/bun/pull/48914) | libuv(win): cancel the pending tty read by its kind, and end the cancel flag with its request | robobun | 2026-11-14 | claude |
| [#48913](https://github.com/oven-sh/bun/pull/48913) | bun test --aot: find what package.json names with the build's file search | robobun | 2026-11-14 | claude |
| [#48912](https://github.com/oven-sh/bun/pull/48912) | bun test: add this.utils.printDiffOrStringify, which reads Jest's arguments or Vitest's from the call | robobun | 2026-11-14 | claude |
| [#48911](https://github.com/oven-sh/bun/pull/48911) | test: run test-cluster-primary-kill.js with LeakSanitizer again | robobun | 2026-11-14 | claude |
| [#48910](https://github.com/oven-sh/bun/pull/48910) | bun test: give a mock factory the one instance of a module that waits for its mock | robobun | 2026-11-14 |  |
| [#48909](https://github.com/oven-sh/bun/pull/48909) | debug-adapter: translate breakpoint and pause locations with the tokens of their own line | robobun | 2026-11-14 | claude |
| [#48907](https://github.com/oven-sh/bun/pull/48907) | test: take two turns of the decorator lowering timing test on a debug build | robobun | 2026-11-14 | claude |
| [#48906](https://github.com/oven-sh/bun/pull/48906) | node:assert: restore Error.stackTraceLimit when a failed assertion throws | robobun | 2026-11-14 | claude |
| [#48905](https://github.com/oven-sh/bun/pull/48905) | bun test: make each deep comparison carry its own equality testers | robobun | 2026-11-14 | claude |
| [#48904](https://github.com/oven-sh/bun/pull/48904) | Remove dead code from Performance, bun:ffi, bun_sys, the test scanner, env_var and uWS | robobun | 2026-11-14 | claude |
| [#48903](https://github.com/oven-sh/bun/pull/48903) | bun-types: declare `WebAssembly.Memory.toFixedLengthBuffer` and `toResizableBuffer` as lib.dom does | robobun | 2026-11-14 | claude |
| [#48901](https://github.com/oven-sh/bun/pull/48901) | bun test: add INVERTED_COLOR, DIM_COLOR and BOLD_WEIGHT to this.utils, and end each of its colors with its own off code | robobun | 2026-11-14 | claude |
| [#48900](https://github.com/oven-sh/bun/pull/48900) | bun:test: resolve the target of spyOn until it is stable, and take the built-in lock only for a locked target | robobun | 2026-11-14 | claude |
| [#48899](https://github.com/oven-sh/bun/pull/48899) | AOT: model in one place what `bun run` prints of a never-run branch | robobun | 2026-11-14 | claude |
| [#48898](https://github.com/oven-sh/bun/pull/48898) | test(hot): make all rejected promises first in the entry-point promise test | robobun | 2026-11-14 | claude |
| [#48897](https://github.com/oven-sh/bun/pull/48897) | test: paths of non-special URLs keep dots before a backslash and a dot-led first segment (needs oven-sh/WebKit#1053) | robobun | 2026-11-14 | claude |
| [#48896](https://github.com/oven-sh/bun/pull/48896) | blob, install: pass operations that own themselves by Box | dylan-conway | 2026-11-14 |  |
| [#48895](https://github.com/oven-sh/bun/pull/48895) | timers, spawn, terminal: references for work in flight are owned | dylan-conway | 2026-11-14 |  |
| [#48894](https://github.com/oven-sh/bun/pull/48894) | Bump WebKit: a termination ends the setter that a store to an own index accessor calls | robobun | 2026-11-14 | claude |
| [#48892](https://github.com/oven-sh/bun/pull/48892) | Upgrade WebKit: an index store to globalThis has globalThis as its receiver | robobun | 2026-11-14 | claude |
| [#48891](https://github.com/oven-sh/bun/pull/48891) | resolver: a busted directory listing keeps its slot and is refilled in place | robobun | 2026-11-14 | claude |
| [#48890](https://github.com/oven-sh/bun/pull/48890) | bun lint: hold back fixes that write a runner name before its `require()` line has run | robobun | 2026-11-14 | claude |
| [#48887](https://github.com/oven-sh/bun/pull/48887) | Treat a default export that throws for a name it does not have as no server | robobun | 2026-11-14 | claude |
| [#48886](https://github.com/oven-sh/bun/pull/48886) | bun:main: only import the entry, and look for a default-export server in native code | robobun | 2026-11-14 |  |
| [#48884](https://github.com/oven-sh/bun/pull/48884) | bundler, dev server: fix plugin resolution, module identity, hot updates and dropped directives | alii | 2026-11-13 |  |
| [#48883](https://github.com/oven-sh/bun/pull/48883) | css: keep a resolution in a token list as a token | robobun | 2026-11-13 | claude |
| [#48882](https://github.com/oven-sh/bun/pull/48882) | AOT: scan a barrel again when the build finds it to be an entry point | robobun | 2026-11-13 | claude |
| [#48881](https://github.com/oven-sh/bun/pull/48881) | resolver: honor a "browser" map key spelled with the node: prefix | robobun | 2026-11-13 | claude |
| [#48879](https://github.com/oven-sh/bun/pull/48879) | net: read a pipe fd through FdPipe, classify adopted fds natively | robobun | 2026-11-13 | claude |
| [#48877](https://github.com/oven-sh/bun/pull/48877) | bun lint: hold back the `vitest/consistent-vitest-vi` rename of a name that is not Vitest's object | robobun | 2026-11-13 | claude |
| [#48876](https://github.com/oven-sh/bun/pull/48876) | bun-types: one `ReadableStreamDefaultReader` type without lib.dom, with `readMany()` | robobun | 2026-11-13 | claude |
| [#48872](https://github.com/oven-sh/bun/pull/48872) | node:dgram: complete bind() in the frame that resolved the address | robobun | 2026-11-13 | claude |
| [#48870](https://github.com/oven-sh/bun/pull/48870) | bundler(splitting): make a self `import()` in a file with no wrapper load the chunk of that file | robobun | 2026-11-13 | claude |
| [#48869](https://github.com/oven-sh/bun/pull/48869) | Do not give Bun classes the JSType of InternalFieldTuple or JSWeakSet | robobun | 2026-11-13 | claude |
| [#48868](https://github.com/oven-sh/bun/pull/48868) | repl: store block-level functions to the session and parse input with `await` as sloppy code | robobun | 2026-11-13 | claude |
| [#48867](https://github.com/oven-sh/bun/pull/48867) | build: under bun, findBun returns the running bun before probing ~/.bun/bin | robobun | 2026-11-13 | claude |
| [#48865](https://github.com/oven-sh/bun/pull/48865) | test(mock-module): sweep 4 ticks, not 16, in a debug build | robobun | 2026-11-13 | claude |
| [#48864](https://github.com/oven-sh/bun/pull/48864) | css: store a blank after a folded color function that touches the next token | robobun | 2026-11-13 | claude |
| [#48863](https://github.com/oven-sh/bun/pull/48863) | Bump WebKit (oven-sh/WebKit#1051 preview): bind() in DFG and FTL code uses the target's `length` only when it is a Number | robobun | 2026-11-13 | claude |
| [#48862](https://github.com/oven-sh/bun/pull/48862) | Store the CommonJS main module when the entry point runs | robobun | 2026-11-13 | claude |
| [#48861](https://github.com/oven-sh/bun/pull/48861) | fix(bundler): resume async plugin setup without recursively polling | chrisbbreuer | 2026-11-13 |  |
| [#48860](https://github.com/oven-sh/bun/pull/48860) | fix(build): preserve the selected Bun unless the user install is newer | chrisbbreuer | 2026-11-13 |  |
| [#48859](https://github.com/oven-sh/bun/pull/48859) | fix(build): honor the Rust incremental compilation option | chrisbbreuer | 2026-11-13 |  |
| [#48858](https://github.com/oven-sh/bun/pull/48858) | fix(build): include FrameTracers for SuspendExceptionScope | chrisbbreuer | 2026-11-13 |  |
| [#48855](https://github.com/oven-sh/bun/pull/48855) | mock.module: make the lookup of a relative specifier independent of other mocks | robobun | 2026-11-13 | claude |
| [#48853](https://github.com/oven-sh/bun/pull/48853) | bun:ffi: report a missing symbol in dlopen() as ERR_DLOPEN_FAILED | robobun | 2026-11-13 | claude |
| [#48852](https://github.com/oven-sh/bun/pull/48852) | node:vm: make the put and defineOwnProperty hooks of a context ask their own global | robobun | 2026-11-13 | claude |
| [#48851](https://github.com/oven-sh/bun/pull/48851) | test/aot: fail a several-step mock case when a run died or prints other lines than bun test | robobun | 2026-11-13 | claude |
| [#48850](https://github.com/oven-sh/bun/pull/48850) | bun test: add this.utils.iterableEquality and this.utils.subsetEquality | robobun | 2026-11-13 | claude |
| [#48849](https://github.com/oven-sh/bun/pull/48849) | process.nextTick: arm the first drain only inside a microtask checkpoint | robobun | 2026-11-13 | claude |
| [#48848](https://github.com/oven-sh/bun/pull/48848) | types: add the FdSocketOptions overload to Bun.connect | robobun | 2026-11-13 | claude |
| [#48845](https://github.com/oven-sh/bun/pull/48845) | test/aot: build the names past the front tables once, and ask each case under many names | robobun | 2026-11-13 | claude |
| [#48844](https://github.com/oven-sh/bun/pull/48844) | test/aot: run the mock-laid-over projects concurrently on every lane and compare how each run ends | robobun | 2026-11-13 | claude |
| [#48843](https://github.com/oven-sh/bun/pull/48843) | redis: make hmget, hset and hmset refuse a field after an array or object of fields | robobun | 2026-11-13 | claude |
| [#48842](https://github.com/oven-sh/bun/pull/48842) | redis: make unsubscribe(channel, listener, undefined) remove only that listener | robobun | 2026-11-13 | claude |
| [#48841](https://github.com/oven-sh/bun/pull/48841) | test/aot: run the 8 programs of records-written-in-the-files concurrently and check stderr and exit codes | robobun | 2026-11-13 | claude |
| [#48840](https://github.com/oven-sh/bun/pull/48840) | node:vm: a store with a context global as the receiver runs the native setter of the holder | robobun | 2026-11-13 | claude |
| [#48839](https://github.com/oven-sh/bun/pull/48839) | test/aot: run the neighbors of records-expected-beside-a-promise concurrently and check what every command says | robobun | 2026-11-13 | claude |
| [#48838](https://github.com/oven-sh/bun/pull/48838) | deepEquals: do not compare runtimeTypeForCause() of two Errors | robobun | 2026-11-13 | claude |
| [#48837](https://github.com/oven-sh/bun/pull/48837) | test/aot: hold the rules for a command that fails while a test of the engine is made | robobun | 2026-11-13 | claude |
| [#48836](https://github.com/oven-sh/bun/pull/48836) | test/aot: with a sanitizer, run both sizes of each star-walk cost test at the same time | robobun | 2026-11-13 | claude |
| [#48835](https://github.com/oven-sh/bun/pull/48835) | test/aot: build the 34,000 sites without Bun's library, and check what both runs print and the room the sites take | robobun | 2026-11-13 | claude |
| [#48834](https://github.com/oven-sh/bun/pull/48834) | react-compiler: unlink the name of a compiled function expression from a parameter of the same name | robobun | 2026-11-13 | claude |
| [#48833](https://github.com/oven-sh/bun/pull/48833) | bun test --isolate=modules: remove a finished file's listeners, performance entries and capture callback | robobun | 2026-11-13 | claude |
| [#48832](https://github.com/oven-sh/bun/pull/48832) | test/aot: answer the request-accessor cases of plain Bun in four processes and check each run's stderr | robobun | 2026-11-13 | claude |
| [#48831](https://github.com/oven-sh/bun/pull/48831) | test: own-property reads of a global proxy in builtins, and the debugger's scope objects | robobun | 2026-11-13 | claude |
| [#48830](https://github.com/oven-sh/bun/pull/48830) | Module mocks: ask the resolver where a mock of a missing module has no original for the importer | robobun | 2026-11-13 | claude |
| [#48829](https://github.com/oven-sh/bun/pull/48829) | test/aot: make wide-lists-in-parts.test.ts faster and hold each program to what it prints | robobun | 2026-11-13 | claude |
| [#48828](https://github.com/oven-sh/bun/pull/48828) | test/aot: make where-guesses-fail.test.ts faster and hold every way of its programs | robobun | 2026-11-13 | claude |
| [#48827](https://github.com/oven-sh/bun/pull/48827) | bun test: vi.doMock() keeps a loaded module for importers whose body has begun | robobun | 2026-11-13 | claude |
| [#48826](https://github.com/oven-sh/bun/pull/48826) | Fold import.meta.env.KEY in browser bundles served by Bun.serve | robobun | 2026-11-13 | claude |
| [#48825](https://github.com/oven-sh/bun/pull/48825) | MessagePort: receive from start() until the last 'message' listener is removed | robobun | 2026-11-13 | claude |
| [#48824](https://github.com/oven-sh/bun/pull/48824) | bun test: set up the DOM environment when a test file left `document` undefined | robobun | 2026-11-13 | claude |
| [#48823](https://github.com/oven-sh/bun/pull/48823) | bun test: take a skip or todo result only from the mode of a sequence's test | robobun | 2026-11-13 | claude |
| [#48822](https://github.com/oven-sh/bun/pull/48822) | node:path: fold every letter in win32.relative behind an ASCII gate | robobun | 2026-11-13 | claude |
| [#48821](https://github.com/oven-sh/bun/pull/48821) | Add WebGPU | dylan-conway | 2026-11-13 |  |
| [#48820](https://github.com/oven-sh/bun/pull/48820) | tls: hold the event loop while sealed records wait for the kernel | robobun | 2026-11-13 | claude |
| [#48818](https://github.com/oven-sh/bun/pull/48818) | bun test: do not put back a spy that was restored while fake timers were on | robobun | 2026-11-13 | claude |
| [#48816](https://github.com/oven-sh/bun/pull/48816) | node:fs: non-recursive rm reports the errno unlink returned instead of EFAULT | robobun | 2026-11-13 | claude |
| [#48814](https://github.com/oven-sh/bun/pull/48814) | bun lint: hold back the `vitest/consistent-vitest-vi` rename onto a type-only import | robobun | 2026-11-13 | claude |
| [#48813](https://github.com/oven-sh/bun/pull/48813) | Remove dead code from bun_lint and bun_sys: `ResolvedConfig.parser_name` and `O::NOATIME` | robobun | 2026-11-13 | claude |
| [#48812](https://github.com/oven-sh/bun/pull/48812) | Include FrameTracers.h in BunPlugin.cpp | everton-dgn | 2026-11-13 |  |
| [#48808](https://github.com/oven-sh/bun/pull/48808) | Bun.Image#write: parse the destination when write() is called | robobun | 2026-11-13 | claude |
| [#48807](https://github.com/oven-sh/bun/pull/48807) | node:test: at the end of a test file, take the mocks of the file off newest first | robobun | 2026-11-13 | claude |
| [#48805](https://github.com/oven-sh/bun/pull/48805) | Remove dead code from bun_aot: the unused test method `CommonJsExports::check` | robobun | 2026-11-13 | claude |
| [#48804](https://github.com/oven-sh/bun/pull/48804) | build --dts: keep the name of a declared namespace that its module alone reads | robobun | 2026-11-13 | claude |
| [#48803](https://github.com/oven-sh/bun/pull/48803) | fix: recognize DOMException and AbortSignal reasons in Error.isError | Jacob-Met | 2026-11-13 |  |
| [#48802](https://github.com/oven-sh/bun/pull/48802) | fix(http2): avoid empty DATA frames for zero-length response writes | Jacob-Met | 2026-11-13 |  |
| [#48800](https://github.com/oven-sh/bun/pull/48800) | assert.partialDeepStrictEqual: give no cycle verdict until a pair repeats, then compare under Node's memos | robobun | 2026-11-13 | claude |
| [#48798](https://github.com/oven-sh/bun/pull/48798) | Remove dead code: AOT leftovers in bun_sema, `ErrorLocation.filename`, and the `JsPoster` clone slot | robobun | 2026-11-13 | claude |
| [#48796](https://github.com/oven-sh/bun/pull/48796) | lint: honor conditionNames of the typescript import resolver | robobun | 2026-11-13 | claude |
| [#48795](https://github.com/oven-sh/bun/pull/48795) | bun test: let a load that waits for a module mock go on when its test file ends | robobun | 2026-11-13 | claude |
| [#48794](https://github.com/oven-sh/bun/pull/48794) | node:module: make require.resolve.paths answer for its module, whatever it is called on | robobun | 2026-11-13 | claude |
| [#48793](https://github.com/oven-sh/bun/pull/48793) | completions: print the script for bash, zsh and fish on Windows | aphrody-dev | 2026-11-13 |  |
| [#48792](https://github.com/oven-sh/bun/pull/48792) | upgrade: unpack the Windows release in-process and check canary downloads against the API digest | aphrody-dev | 2026-11-13 |  |
| [#48791](https://github.com/oven-sh/bun/pull/48791) | fix(serve): finish streaming response headers before the first body chunk | Jacob-Met | 2026-11-13 |  |
| [#48790](https://github.com/oven-sh/bun/pull/48790) | bun check: fix named-file globals, add --no-follow-imports | Jarred-Sumner | 2026-11-13 |  |
| [#48789](https://github.com/oven-sh/bun/pull/48789) | fix(windows): open directories without unnecessary access rights | Jacob-Met | 2026-11-13 |  |
| [#48788](https://github.com/oven-sh/bun/pull/48788) | node:fs: call the fs.glob callback from the promise reaction, as Node does | robobun | 2026-11-13 | claude |
| [#48787](https://github.com/oven-sh/bun/pull/48787) | build: pass the .bind.ts schema list to the codegen scripts in a file | aphrody-dev | 2026-11-13 |  |
| [#48786](https://github.com/oven-sh/bun/pull/48786) | docs: sizes Bun.gzipSync and Bun.deflateSync give for the utils examples | aphrody-dev | 2026-11-13 |  |
| [#48785](https://github.com/oven-sh/bun/pull/48785) | util.inspect: keep the `: ` in an error's stack and put only the name on it | robobun | 2026-11-13 | claude |
| [#48784](https://github.com/oven-sh/bun/pull/48784) | build: xwin 0.10.0, which reads the current Visual Studio manifest | aphrody-dev | 2026-11-13 |  |
| [#48782](https://github.com/oven-sh/bun/pull/48782) | FileReader: after a short read, leave the next read to the poll callback | robobun | 2026-11-13 | claude |
| [#48781](https://github.com/oven-sh/bun/pull/48781) | usockets: connect to a name's addresses one at a time (RFC 8305 Happy Eyeballs) | cirospaciari | 2026-11-13 |  |
| [#48780](https://github.com/oven-sh/bun/pull/48780) | bun lint: hold back `vitest/no-importing-vitest-globals` fixes that change what the file does | robobun | 2026-11-13 | claude |
| [#48779](https://github.com/oven-sh/bun/pull/48779) | node:fs: parse the fs.mkdtemp prefix as the start of a name, not as a path | robobun | 2026-11-13 | claude |
| [#48778](https://github.com/oven-sh/bun/pull/48778) | bun test: resolve report paths and file names from the folder the run started in | robobun | 2026-11-13 | claude |
| [#48777](https://github.com/oven-sh/bun/pull/48777) | bun test: decide a kept window's names against the globals from the end of the preloads | robobun | 2026-11-13 | claude |
| [#48775](https://github.com/oven-sh/bun/pull/48775) | bun test: build a describe()'s Suite chain in a loop and each name from its parent's | robobun | 2026-11-13 | claude |
| [#48773](https://github.com/oven-sh/bun/pull/48773) | build(deps): bump the actions group across 1 directory with 7 updates | app/dependabot | 2026-11-13 | dependencies, github_actions |
| [#48772](https://github.com/oven-sh/bun/pull/48772) | node:path: matchesGlob and fs.watch ignore match as minimatch does for Node | robobun | 2026-11-12 | claude |
| [#48770](https://github.com/oven-sh/bun/pull/48770) | node:stream: decode the pulls of a native-backed Readable in C++, each chunk owns its buffer | robobun | 2026-11-12 | claude |
| [#48768](https://github.com/oven-sh/bun/pull/48768) | fetch: print headers only on request, not at `logLevel = "debug"` | robobun | 2026-11-12 | claude |
| [#48767](https://github.com/oven-sh/bun/pull/48767) | bun test: set the time zone through the JSC VM so start-up never reads the first file's global | robobun | 2026-11-12 | claude |
| [#48764](https://github.com/oven-sh/bun/pull/48764) | Fix DNS TXT records containing multiple character strings | Jacob-Met | 2026-11-12 |  |
| [#48763](https://github.com/oven-sh/bun/pull/48763) | test/aot: pin the test-runs-in-folders projects whose `bun test` run has two answers | robobun | 2026-11-12 | claude |
| [#48762](https://github.com/oven-sh/bun/pull/48762) | install: bin lookup fixes for lifecycle scripts | dylan-conway | 2026-11-12 |  |
| [#48761](https://github.com/oven-sh/bun/pull/48761) | bun fmt: print a member chain whose last object breaks on one line the first time | robobun | 2026-11-12 | claude |
| [#48760](https://github.com/oven-sh/bun/pull/48760) | test/aot: update the lists of the hand-run mock grids | robobun | 2026-11-12 | claude |
| [#48759](https://github.com/oven-sh/bun/pull/48759) | react-compiler: keep a read of a property that nothing uses in a nested function | robobun | 2026-11-12 | claude |
| [#48758](https://github.com/oven-sh/bun/pull/48758) | node:fs: recursive readdir descends up to the OS path limit | robobun | 2026-11-12 | claude |
| [#48757](https://github.com/oven-sh/bun/pull/48757) | AOT: apply bun-ignore comments to the warning that the build decides after the compiler | robobun | 2026-11-12 | claude |
| [#48756](https://github.com/oven-sh/bun/pull/48756) | napi: implement the libuv thread primitives over pthreads on posix | robobun | 2026-11-12 | claude |
| [#48754](https://github.com/oven-sh/bun/pull/48754) | build: fail configure when a tool gives no answer, instead of taking the next one | robobun | 2026-11-12 | claude |
| [#48752](https://github.com/oven-sh/bun/pull/48752) | process.stdin: take the reader back in _read when a consumer is attached | robobun | 2026-11-12 | claude |
| [#48749](https://github.com/oven-sh/bun/pull/48749) | node:net, node:dns: throw ERR_INVALID_ARG_VALUE for a null byte in a connect host, setLocalAddress() or reverse() | robobun | 2026-11-12 | claude |
| [#48745](https://github.com/oven-sh/bun/pull/48745) | test/aot: hold both runs of a-few-of-every-sweep to stderr and start its writers four at a time | robobun | 2026-11-12 | claude |
| [#48743](https://github.com/oven-sh/bun/pull/48743) | require(esm): read `__esModule` and "module.exports" in separate try blocks | robobun | 2026-11-12 | claude |
| [#48741](https://github.com/oven-sh/bun/pull/48741) | Enable module.findSourceMap() with a source-maps switch, and name coverage functions | robobun | 2026-11-12 | claude |
| [#48740](https://github.com/oven-sh/bun/pull/48740) | bundler: pick the graph of a file's imports the way its transpiler is picked | robobun | 2026-11-12 | claude |
| [#48739](https://github.com/oven-sh/bun/pull/48739) | lint: no-useless-assignment follows `continue <label>` only when the label is right before the loop | robobun | 2026-11-12 | claude |
| [#48738](https://github.com/oven-sh/bun/pull/48738) | Bun.serve: find the files of a built HTML import from the server bundle's folder | robobun | 2026-11-12 | claude |
| [#48737](https://github.com/oven-sh/bun/pull/48737) | Give each import.meta its own resolve and resolveSync | robobun | 2026-11-12 | claude |
| [#48736](https://github.com/oven-sh/bun/pull/48736) | docs: say what a test file's `vi.mock()` gets as the original of a package that a preload mocked | robobun | 2026-11-12 | claude |
| [#48735](https://github.com/oven-sh/bun/pull/48735) | bun test --isolate=modules: restore the globals without looking up `globalThis`, `process` or `Bun` by name | robobun | 2026-11-12 | claude |
| [#48734](https://github.com/oven-sh/bun/pull/48734) | undici: give each request() result its own opaque and context | robobun | 2026-11-12 | claude |
| [#48733](https://github.com/oven-sh/bun/pull/48733) | fix(glob): deduplicate sentinel-terminated symlink matches | zjuncal | 2026-11-12 |  |
| [#48732](https://github.com/oven-sh/bun/pull/48732) | bun test: vi.importActual() and jest.requireActual() in the factory of a loaded module return the original | robobun | 2026-11-12 | claude |
| [#48729](https://github.com/oven-sh/bun/pull/48729) | bun lint: with no config, accept a method that `expect()` only inspects in `unbound-method` | robobun | 2026-11-12 | claude |
| [#48728](https://github.com/oven-sh/bun/pull/48728) | test/aot: compare run counts in test-runs-in-folders and show stderr on failure | robobun | 2026-11-12 | claude |
| [#48727](https://github.com/oven-sh/bun/pull/48727) | test/aot: find the turns of three statements by name without a search, and state what they print | robobun | 2026-11-12 | claude |
| [#48726](https://github.com/oven-sh/bun/pull/48726) | bun test: reuse a kept window for options that are the same JSON value | robobun | 2026-11-12 | claude |
| [#48725](https://github.com/oven-sh/bun/pull/48725) | Read .xml files as their bytes on disk, so import agrees with Bun.XML.parse | smittie2000 | 2026-11-12 |  |
| [#48724](https://github.com/oven-sh/bun/pull/48724) | bun test: read what a mock factory requests as a plain run prints it under --coverage and the inspector | robobun | 2026-11-12 | claude |
| [#48723](https://github.com/oven-sh/bun/pull/48723) | test/aot: check stderr, exit code and signal of both runs of each request shape | robobun | 2026-11-12 | claude |
| [#48721](https://github.com/oven-sh/bun/pull/48721) | test/aot: make 37 builds in bun-ignore-comments, not 94, and write no executable | robobun | 2026-11-12 | claude |
| [#48720](https://github.com/oven-sh/bun/pull/48720) | Give the module namespace prototype a Structure that prohibits property caching | robobun | 2026-11-12 | claude |
| [#48719](https://github.com/oven-sh/bun/pull/48719) | test/aot: gather the 512,000 plain stores, run 70,000 of them, and pin the last | robobun | 2026-11-12 | claude |
| [#48718](https://github.com/oven-sh/bun/pull/48718) | test/aot: fail a module-identity case whose `bun test` run is not whole | robobun | 2026-11-12 | claude |
| [#48717](https://github.com/oven-sh/bun/pull/48717) | node:http2: read what the peer sent before the close that follows a rejected send | robobun | 2026-11-12 | claude |
| [#48716](https://github.com/oven-sh/bun/pull/48716) | bun build --dts: state an unannotated class member in `.aot.ts` with the checker's type and the bundle's names | robobun | 2026-11-12 | claude |
| [#48715](https://github.com/oven-sh/bun/pull/48715) | fs.globSync: name Dirents relative to the working directory when `cwd` is omitted | robobun | 2026-11-12 | claude |
| [#48713](https://github.com/oven-sh/bun/pull/48713) | node:fs: call a FileHandle stream back from a microtask, through a job arm of the binding | robobun | 2026-11-12 |  |
| [#48711](https://github.com/oven-sh/bun/pull/48711) | node:sqlite, streams: refuse re-entry from an authorizer, and stop what addAbortSignal() errors | sosukesuzuki | 2026-11-12 |  |
| [#48710](https://github.com/oven-sh/bun/pull/48710) | css: keep the source text of a number that touches the token before it | robobun | 2026-11-12 | claude |
| [#48709](https://github.com/oven-sh/bun/pull/48709) | Bun.sleepSync: keep one deadline across caught signals | robobun | 2026-11-12 | claude |
| [#48708](https://github.com/oven-sh/bun/pull/48708) | bun build --dts: keep declarators unmerged, and find a binding by its pattern depth | robobun | 2026-11-12 | claude |
| [#48707](https://github.com/oven-sh/bun/pull/48707) | test: remove the vendored `node inspect` debugger tests | robobun | 2026-11-12 | claude |
| [#48706](https://github.com/oven-sh/bun/pull/48706) | bun test --isolate=modules: shared built-ins tell the restore what to do with their `process` listeners | robobun | 2026-11-12 | claude |
| [#48705](https://github.com/oven-sh/bun/pull/48705) | bun test --isolate=modules: load `abort-controller` before the snapshot | robobun | 2026-11-12 | claude |
| [#48704](https://github.com/oven-sh/bun/pull/48704) | worker_threads: stop the Worker's port while the Worker has no 'message' listener | robobun | 2026-11-12 | claude |
| [#48701](https://github.com/oven-sh/bun/pull/48701) | install: report ENAMETOOLONG for a `bun <path>.lockb` path that does not fit the path buffer | robobun | 2026-11-12 | claude |
| [#48700](https://github.com/oven-sh/bun/pull/48700) | react-compiler: in `bun lint`, resolve a name that Babel does not bind as Babel's `getBinding` does | robobun | 2026-11-12 | claude |
| [#48699](https://github.com/oven-sh/bun/pull/48699) | React Compiler: compile every JavaScript-like module, with the rule in one place | robobun | 2026-11-12 | claude |
| [#48698](https://github.com/oven-sh/bun/pull/48698) | import.meta.main: compare the main module's key as a URL in every executable | robobun | 2026-11-12 | claude |
| [#48697](https://github.com/oven-sh/bun/pull/48697) | bunfig: apply `logLevel` where the file is loaded, so `bun run <file>` takes it | robobun | 2026-11-12 | claude |
| [#48696](https://github.com/oven-sh/bun/pull/48696) | bundler: keep `this` per call of a star import member, not per file | robobun | 2026-11-12 | claude |
| [#48695](https://github.com/oven-sh/bun/pull/48695) | Set ICU's default locale in Bun, not from the host | robobun | 2026-11-12 | claude |
| [#48694](https://github.com/oven-sh/bun/pull/48694) | bun test: mock.module() keeps the modules that the test file imports | robobun | 2026-11-12 | claude |
| [#48693](https://github.com/oven-sh/bun/pull/48693) | sourcemap: treat an empty `sources` entry as the module itself | robobun | 2026-11-12 | claude |
| [#48690](https://github.com/oven-sh/bun/pull/48690) | bun test: at the end of a test file, restore a spy only where it is still on its property | robobun | 2026-11-12 | claude |
| [#48688](https://github.com/oven-sh/bun/pull/48688) | timers: mark "no callback arguments" with the empty JSValue so a lone `undefined` is passed | robobun | 2026-11-12 | claude |
| [#48687](https://github.com/oven-sh/bun/pull/48687) | node:module: call Module._extensions handlers on the extensions object, and a preload's Module.runMain on Module | robobun | 2026-11-12 | claude |
| [#48686](https://github.com/oven-sh/bun/pull/48686) | bun test --isolate=modules: put a property back on a built-in that a file locked | robobun | 2026-11-12 | claude |
| [#48685](https://github.com/oven-sh/bun/pull/48685) | worker_threads: run the worker's bootstrap before 'online' and before its start-up errors | robobun | 2026-11-12 | claude |
| [#48684](https://github.com/oven-sh/bun/pull/48684) | bindgen: `configurable` and `enumerable` on a function row; Timeout and Immediate methods as in Node.js | robobun | 2026-11-12 | claude |
| [#48683](https://github.com/oven-sh/bun/pull/48683) | Make members of net.BlockList, module.SourceMap, StringDecoder and Node's handles configurable, as in Node.js | robobun | 2026-11-12 | claude |
| [#48682](https://github.com/oven-sh/bun/pull/48682) | node:net: complete a write that waits for drain from the event loop only, and hold the loop for it after unref() | robobun | 2026-11-12 | claude |
| [#48680](https://github.com/oven-sh/bun/pull/48680) | node-fallbacks: keep @__PURE__ marks in the prebuilt browser polyfills | robobun | 2026-11-12 | claude |
| [#48679](https://github.com/oven-sh/bun/pull/48679) | node:fs: mkdtemp returns ENAMETOOLONG when prefix + XXXXXX does not fit, instead of shortening the prefix | robobun | 2026-11-12 | claude |
| [#48678](https://github.com/oven-sh/bun/pull/48678) | MessagePort: deliver the peer's close from the drain, after its queued messages | robobun | 2026-11-12 | claude |
| [#48675](https://github.com/oven-sh/bun/pull/48675) | Event loop: run the task queue one generation at a time, at most 9 per drain | robobun | 2026-11-12 | claude |
| [#48674](https://github.com/oven-sh/bun/pull/48674) | bun lint: hold back fixes that change what `bun test` does with module mocks on `jest` or `vi` | robobun | 2026-11-12 | claude |
| [#48673](https://github.com/oven-sh/bun/pull/48673) | bundler(html): keep the media of a stylesheet link as an @media block | robobun | 2026-11-12 | claude |
| [#48672](https://github.com/oven-sh/bun/pull/48672) | bun fmt: keep the whitespace in a Markdown task's `[ ]` as it is | magndotcc | 2026-11-12 |  |
| [#48671](https://github.com/oven-sh/bun/pull/48671) | bun test: put back what a restored spy replaced when a module mock ends | robobun | 2026-11-12 | claude |
| [#48670](https://github.com/oven-sh/bun/pull/48670) | node:http: release the connection of a response when its socket closes | robobun | 2026-11-12 | claude |
| [#48669](https://github.com/oven-sh/bun/pull/48669) | Add `[serve.static] reactCompiler` to run the React Compiler in the HTML dev server | robobun | 2026-11-12 | claude |
| [#48668](https://github.com/oven-sh/bun/pull/48668) | jsc-stress: add a fixture for parseInt results outside int32 after DFG tier-up | robobun | 2026-11-12 | claude |
| [#48666](https://github.com/oven-sh/bun/pull/48666) | docs: say that --allow-unresolved and --reject-unresolved check non-literal arguments only | robobun | 2026-11-12 | claude |
| [#48665](https://github.com/oven-sh/bun/pull/48665) | test: pin toJSON handling in JSON.stringify's fast paths | robobun | 2026-11-12 | claude |
| [#48664](https://github.com/oven-sh/bun/pull/48664) | bun test --aot: read `vi?.importActual(path)` in a mock factory as a plain run does | robobun | 2026-11-12 | claude |
| [#48663](https://github.com/oven-sh/bun/pull/48663) | node-fallbacks: give no polyfill binding the name of a page global | robobun | 2026-11-12 | claude |
| [#48662](https://github.com/oven-sh/bun/pull/48662) | console.assert: prepend "Assertion failed" marker when given a message | robobun | 2026-11-12 | claude |
| [#48661](https://github.com/oven-sh/bun/pull/48661) | bun fmt: pair emphasis by what is left of a run, as micromark does | robobun | 2026-11-12 | claude |
| [#48660](https://github.com/oven-sh/bun/pull/48660) | MessagePort: keep hasRef() true until the 'close' event fires, and false inside it | robobun | 2026-11-12 | claude |
| [#48659](https://github.com/oven-sh/bun/pull/48659) | bun test: make a helper's vi.mock() of a package reach modules that an earlier test file evaluated | robobun | 2026-11-12 | claude |
| [#48658](https://github.com/oven-sh/bun/pull/48658) | node:test: cite the commit of v26.3.0 in the MockTracker upstream permalink | robobun | 2026-11-12 | claude |
| [#48657](https://github.com/oven-sh/bun/pull/48657) | import.meta.resolve: return the file a package names when it is missing | magndotcc | 2026-11-12 |  |
| [#48655](https://github.com/oven-sh/bun/pull/48655) | bun fmt: place the comments at the end of a YAML document as yaml's parser does | robobun | 2026-11-12 | claude |
| [#48654](https://github.com/oven-sh/bun/pull/48654) | bun-types: accept HTMLBundle, BunFile and { dir } under a method key in Bun.serve routes | robobun | 2026-11-12 | claude |
| [#48653](https://github.com/oven-sh/bun/pull/48653) | Bun.Cookie: clear `domain` when assigned `undefined` or `null`, and declare it `string \| null` | robobun | 2026-11-12 | breaking, claude |
| [#48652](https://github.com/oven-sh/bun/pull/48652) | node:stream: read on after a synchronous native pull whose chunk the decoder holds back | robobun | 2026-11-12 | claude |
| [#48651](https://github.com/oven-sh/bun/pull/48651) | v8: add the 30 members that the npm re2 addon imports | robobun | 2026-11-11 | claude |
| [#48650](https://github.com/oven-sh/bun/pull/48650) | cli: -c, --config takes a required path | robobun | 2026-11-11 | claude |
| [#48649](https://github.com/oven-sh/bun/pull/48649) | bun test: evict the ES modules that called require() for a module mock | robobun | 2026-11-11 | claude |
| [#48648](https://github.com/oven-sh/bun/pull/48648) | lint: add bun/react-no-manual-memoization | robobun | 2026-11-11 | claude |
| [#48647](https://github.com/oven-sh/bun/pull/48647) | bun fmt: keep the empty line between Markdown blocks where it decides where a block ends | robobun | 2026-11-11 | claude |
| [#48645](https://github.com/oven-sh/bun/pull/48645) | fmt: keep a Markdown fenced code block with no line between its fences empty | robobun | 2026-11-11 | claude |
| [#48644](https://github.com/oven-sh/bun/pull/48644) | test: run Node's tests of the polyfilled modules as browser bundles | robobun | 2026-11-11 | claude |
| [#48643](https://github.com/oven-sh/bun/pull/48643) | bun test: close a happy-dom window with happyDOM.close() | robobun | 2026-11-11 | claude |
| [#48642](https://github.com/oven-sh/bun/pull/48642) | bun test --isolate: drop a finished file's transpile jobs when they come back | robobun | 2026-11-11 | claude |
| [#48640](https://github.com/oven-sh/bun/pull/48640) | bun:test: give the built-in and `expect.extend()` matchers one `asymmetricMatch()` | robobun | 2026-11-11 | claude |
| [#48639](https://github.com/oven-sh/bun/pull/48639) | test: take 47 batch-flaky files out of the parallel batch | robobun | 2026-11-11 | claude |
| [#48637](https://github.com/oven-sh/bun/pull/48637) | fmt(markdown): keep a code span's fence clear of the backtick runs before it | robobun | 2026-11-11 | claude |
| [#48636](https://github.com/oven-sh/bun/pull/48636) | bun fmt: keep a risky paragraph's text inline in every Markdown flavor | robobun | 2026-11-11 | claude |
| [#48635](https://github.com/oven-sh/bun/pull/48635) | child_process: make piped stdio streams before the child starts, and send inside child.stdin.end() | robobun | 2026-11-11 | claude |
| [#48634](https://github.com/oven-sh/bun/pull/48634) | bun fmt: keep an escaped space or tab in a double-quoted YAML scalar | robobun | 2026-11-11 | claude |
| [#48633](https://github.com/oven-sh/bun/pull/48633) | node:stream: release a pipe destination's drain wait when its pipe is torn down | robobun | 2026-11-11 | claude |
| [#48632](https://github.com/oven-sh/bun/pull/48632) | bun fmt: end a YAML keep scalar with its own line break only at the end of the stream | robobun | 2026-11-11 | claude |
| [#48631](https://github.com/oven-sh/bun/pull/48631) | docs: fix dead links (8 files) | xyonx-bot | 2026-11-11 |  |
| [#48630](https://github.com/oven-sh/bun/pull/48630) | bun test --isolate=modules: undo an index key that a file defines without `configurable` | robobun | 2026-11-11 | claude |
| [#48629](https://github.com/oven-sh/bun/pull/48629) | node-fallbacks: build the browser polyfills with --keep-names | robobun | 2026-11-11 | claude |
| [#48628](https://github.com/oven-sh/bun/pull/48628) | bun:test: ask a matcher that is a whole value of toMatchObject() and of snapshot property matchers | robobun | 2026-11-11 | claude |
| [#48627](https://github.com/oven-sh/bun/pull/48627) | build: link Linux and FreeBSD with full RELRO and BIND_NOW | robobun | 2026-11-11 | claude |
| [#48625](https://github.com/oven-sh/bun/pull/48625) | docs: say which calls exit the process under `--trim-locales` | robobun | 2026-11-11 | claude |
| [#48624](https://github.com/oven-sh/bun/pull/48624) | bun test: end a preload's vi.setConfig() with the preload's hooks | robobun | 2026-11-11 | claude |
| [#48623](https://github.com/oven-sh/bun/pull/48623) | test/aot: check all that each build and program of runtime-modules-and-user-flags writes | robobun | 2026-11-11 | claude |
| [#48621](https://github.com/oven-sh/bun/pull/48621) | bun test: keep the owners of a mocked module export in the engine, so mocks and spies end in any order | robobun | 2026-11-11 | claude |
| [#48620](https://github.com/oven-sh/bun/pull/48620) | process: emit 'removeListener' from one removal step in the native EventEmitter | robobun | 2026-11-11 | claude |
| [#48619](https://github.com/oven-sh/bun/pull/48619) | bun test --isolate=modules: end what a preload made when its test file ends | robobun | 2026-11-11 | claude |
| [#48618](https://github.com/oven-sh/bun/pull/48618) | Remove dead code from bun-types and oxlint.json: commented-out declarations and four stale ignore patterns | robobun | 2026-11-11 | claude |
| [#48616](https://github.com/oven-sh/bun/pull/48616) | byte-search lint: report every slice split method that takes a byte-literal closure | robobun | 2026-11-11 | claude |
| [#48615](https://github.com/oven-sh/bun/pull/48615) | bun test: run a module again whose top-level code mocked through a function of another module | robobun | 2026-11-11 | claude |
| [#48614](https://github.com/oven-sh/bun/pull/48614) | AOT: look Worker files, Worker starts and entry points up in tables, not by scans | robobun | 2026-11-11 | claude |
| [#48613](https://github.com/oven-sh/bun/pull/48613) | AOT: know a function, class or regex read out of a one-member literal as truthy and not null | robobun | 2026-11-11 | claude |
| [#48610](https://github.com/oven-sh/bun/pull/48610) | require(esm): return the live namespace in a cycle that a require() began | robobun | 2026-11-11 | claude |
| [#48599](https://github.com/oven-sh/bun/pull/48599) | test: match a TS code only where a colon follows it | robobun | 2026-11-11 | claude |
| [#48598](https://github.com/oven-sh/bun/pull/48598) | test: wait for a second immediate in "interval/timeout do not affect immediates" of node-timers.test.ts | robobun | 2026-11-11 | claude |
| [#48597](https://github.com/oven-sh/bun/pull/48597) | test/aot: run the programs of fixed.test.ts in one concurrent group and hold their stderr | robobun | 2026-11-11 | claude |
| [#48596](https://github.com/oven-sh/bun/pull/48596) | lint: list files for import/no-unused-modules without an .eslintrc | robobun | 2026-11-11 | claude |
| [#48595](https://github.com/oven-sh/bun/pull/48595) | test/aot: run mock-ways as five concurrent projects and check how each run ends | robobun | 2026-11-11 | claude |
| [#48594](https://github.com/oven-sh/bun/pull/48594) | Bump WebKit (oven-sh/WebKit#1031): keep the string of `source` on the RegExp cell after the first read | robobun | 2026-11-11 | claude |
| [#48593](https://github.com/oven-sh/bun/pull/48593) | js_parser, aot: move a #private initializer and add a constructor only beside an assigned plain field | robobun | 2026-11-11 | claude |
| [#48592](https://github.com/oven-sh/bun/pull/48592) | bun test: number a snapshot matcher that throws in its compare or print as the runner of its .snap file does | robobun | 2026-11-11 | claude |
| [#48591](https://github.com/oven-sh/bun/pull/48591) | node-fallbacks: keep emit("error") arguments and throw ERR_UNHANDLED_ERROR in the events and domain polyfills | robobun | 2026-11-11 | claude |
| [#48590](https://github.com/oven-sh/bun/pull/48590) | bun test: `test.extend()` starts from the file's top-level `test.override()` calls | robobun | 2026-11-11 | claude |
| [#48589](https://github.com/oven-sh/bun/pull/48589) | bundler: print `module.exports` as written in a file that has a module object | robobun | 2026-11-11 | claude |
| [#48588](https://github.com/oven-sh/bun/pull/48588) | test/aot: end a server program's test run at its answer, not at a 60 s limit, and state what each program prints | robobun | 2026-11-11 | claude |
| [#48587](https://github.com/oven-sh/bun/pull/48587) | test/aot: keep the programs of what-a-loop-asks-of-a-variable in the file and state what each run prints | robobun | 2026-11-11 | claude |
| [#48585](https://github.com/oven-sh/bun/pull/48585) | docs: use the `ts` loader and anchored filters in the `.defer()` plugin example | robobun | 2026-11-11 | claude |
| [#48584](https://github.com/oven-sh/bun/pull/48584) | test/aot: build the tracing-patch programs of node:http concurrently and check each run's stderr and counter | robobun | 2026-11-11 | claude |
| [#48582](https://github.com/oven-sh/bun/pull/48582) | test/aot: run the cases of a-package-whose-name-is-handed-to-a-helper concurrently and check how each start ends | robobun | 2026-11-11 | claude |
| [#48580](https://github.com/oven-sh/bun/pull/48580) | node:vm: delete through the contextified object's own [[Delete]], and look up a declared name without reading it | robobun | 2026-11-11 | claude |
| [#48578](https://github.com/oven-sh/bun/pull/48578) | docs: list the value of a CSS custom property among the intentional bun fmt differences | robobun | 2026-11-11 | claude |
| [#48577](https://github.com/oven-sh/bun/pull/48577) | redis: make exists() refuse a second key | robobun | 2026-11-11 | claude |
| [#48576](https://github.com/oven-sh/bun/pull/48576) | timers: take the event loop ref in Immediate.ref() only while the Immediate is queued | robobun | 2026-11-11 | claude |
| [#48575](https://github.com/oven-sh/bun/pull/48575) | js_parser: write design:paramtypes only for a constructor of the source | robobun | 2026-11-11 | claude |
| [#48573](https://github.com/oven-sh/bun/pull/48573) | WebSocket client: hold bytes the transport hands over while paused | robobun | 2026-11-11 | claude |
| [#48572](https://github.com/oven-sh/bun/pull/48572) | glob: give a `.` or `..` after `**/name` its own work item again (regression from #28496) | robobun | 2026-11-11 | claude |
| [#48571](https://github.com/oven-sh/bun/pull/48571) | bun test: take the spies of a `{ spy: true }` automock out of shared objects when the test file ends | robobun | 2026-11-11 |  |
| [#48570](https://github.com/oven-sh/bun/pull/48570) | node:fs: open a trailing-slash rm path as a directory instead of unlinking it | robobun | 2026-11-11 | claude |
| [#48569](https://github.com/oven-sh/bun/pull/48569) | resolver: carry the decorator options of an extending tsconfig across extends | robobun | 2026-11-11 | claude |
| [#48568](https://github.com/oven-sh/bun/pull/48568) | bun test --isolate: close a file's window without taking its names off `globalThis` | robobun | 2026-11-11 | claude |
| [#48567](https://github.com/oven-sh/bun/pull/48567) | bun test --globals=vitest: fail the file when defining the globals throws, and run the next file | robobun | 2026-11-11 | claude |
| [#48565](https://github.com/oven-sh/bun/pull/48565) | bun test: read an older Bun's entry beside the runner's own, and tell a Vitest .snap in key order by a snapshot with both keys | robobun | 2026-11-11 | claude |
| [#48563](https://github.com/oven-sh/bun/pull/48563) | bun-types: make `Mocked<T>` assignable to `T` | robobun | 2026-11-11 | claude |
| [#48562](https://github.com/oven-sh/bun/pull/48562) | fix(websocket): preserve receive state and pause across nested waits | chrisbbreuer | 2026-11-11 |  |
| [#48561](https://github.com/oven-sh/bun/pull/48561) | react-compiler: emit a number node for NaN and +/-Infinity, not a name | robobun | 2026-11-11 | claude |
| [#48560](https://github.com/oven-sh/bun/pull/48560) | Reject Bun.file(fd).delete() and unlink() instead of resolving with the TypeError | robobun | 2026-11-11 | claude |
| [#48557](https://github.com/oven-sh/bun/pull/48557) | install: re-resolve a dependency that bun.lock binds outside its range, and fail --frozen-lockfile on it | robobun | 2026-11-11 | claude |
| [#48556](https://github.com/oven-sh/bun/pull/48556) | fix(node:net): emit 'error' and set hadError on failed write after peer FIN | mindulle | 2026-11-11 |  |
| [#48555](https://github.com/oven-sh/bun/pull/48555) | node:fs/promises: declare Node's parameters so each function has Node's length | robobun | 2026-11-11 | claude |
| [#48554](https://github.com/oven-sh/bun/pull/48554) | WebSocket client: queue bytes that arrive while the frame parser is on the stack | robobun | 2026-11-11 | claude |
| [#48553](https://github.com/oven-sh/bun/pull/48553) | node:stream: advance the native pull buffer before push() | robobun | 2026-11-11 | claude |
| [#48552](https://github.com/oven-sh/bun/pull/48552) | bun test: wind down a run that --bail stops instead of exiting in place | robobun | 2026-11-11 | claude |
| [#48551](https://github.com/oven-sh/bun/pull/48551) | node:stream: pull a native-backed Readable from a later tick, never inside _read() | robobun | 2026-11-11 | claude |
| [#48550](https://github.com/oven-sh/bun/pull/48550) | sql: drop parsed `tls` options from Postgres/MySQL once `SSL_CTX` is built | iktakahiro | 2026-11-11 |  |
