# Commits main depuis 2026-10-15 (266)

| SHA | Date | Auteur | Sujet |
|---|---|---|---|
| `b6c3f857f7b` | 2026-11-13 | aphrody-dev | ci(native): trace the fork's own order file (trace-order job), link gnu with it |
| `139f969b2b6` | 2026-11-13 | aphrody-dev | ci(native): syscall counts (strace -c) of bun -e 0 and the test runner; 100 runs of the test runner |
| `811191526cd` | 2026-11-13 | aphrody-dev | ci(native): HTTP bench in rotated rounds (median), canary run again last as a control |
| `836b71fdc07` | 2026-11-13 | aphrody-dev | completions: compare the Windows test output with the script without CRLF |
| `a438f06df2d` | 2026-11-13 | aphrody-dev | ci(native): download each target's artifact into its own directory |
| `5414a5fdfbd` | 2026-11-13 | aphrody-dev | ci(native): link gnu with canary's order file, trimmable like ci-build; startup profile in the bench |
| `46cd8c96a2c` | 2026-11-13 | Aphrody | ci(native): drop the duplicated artifacts_run input |
| `a6c026a7371` | 2026-11-13 | Aphrody | ci(native): bench musl builds in alpine, glibc ones on the host; bench-only mode |
| `7f18cd3c787` | 2026-11-13 | aphrody-dev | shell: use bun_core::cast_slice_mut in the dead bin link check (no bytemuck in bun_install) |
| `226421ce8ab` | 2026-11-13 | aphrody-dev | upgrade, completions: Cargo.lock entries for bun_archive's zip dependencies; read $SHELL through zstr! |
| `25c6bc39c60` | 2026-11-13 | Aphrody | Cargo.lock: record bun_archive's bun_libdeflate_sys and bun_zlib dependencies |
| `2088a741de8` | 2026-11-13 | Aphrody | ci(native): run on dispatch only |
| `fc5a9784a4f` | 2026-11-13 | aphrody-dev | docs: sizes Bun.gzipSync and Bun.deflateSync give for the utils examples |
| `83f512d30b0` | 2026-11-13 | aphrody-dev | build: xwin 0.10.0, which reads the current Visual Studio manifest |
| `492682147b9` | 2026-11-13 | aphrody-dev | ci(aphrody): cross-compile bun.exe for Windows x64 and run the fork's Windows regression tests |
| `b804d918875` | 2026-11-13 | aphrody-dev | shell: skip a dead bin link for the script words bun, bunx and node (Windows) |
| `c676d3e8925` | 2026-11-13 | aphrody-dev | import.meta.main: compare the main module's key as a URL in every executable |
| `b3ccfb52697` | 2026-11-13 | aphrody-dev | node:fs: resolve a relative path that normalizes to nothing to the cwd on Windows |
| `a48a39bbc78` | 2026-11-13 | aphrody-dev | sys(windows): report ENOENT for an empty path instead of acting on the directory it is relative to |
| `24e9c7fcd79` | 2026-11-13 | aphrody-dev | completions: print the script for bash, zsh and fish on Windows |
| `b37d2c65a8e` | 2026-11-13 | aphrody-dev | upgrade: unpack the Windows release in-process and check canary downloads against the API digest |
| `a6279d421fa` | 2026-11-13 | Aphrody | ci(native): leave the Windows sysroot out of the build host |
| `19f05fd43bb` | 2026-11-13 | Aphrody | ci: native release build (ThinLTO, linux-x64 gnu/musl, windows-x64) and non-regression bench |
| `13249e0b87f` | 2026-11-13 | aphrody-dev | build: pass the .bind.ts schema list to the codegen scripts in a file |
| `301077fd96a` | 2026-11-12 | aphrody-dev | child_process: expose the parent-end pipe fd through stream._handle |
| `9098897a173` | 2026-11-13 | Jarred Sumner | AOT: the text of functions stored as it is, and fixes of plain Bun (#48815) |
| `a62cc285621` | 2026-11-13 | Dylan Conway | spawn, io: share Process and KeepAlive instead of borrowing them exclusively (#48893) |
| `d4596e94bd6` | 2026-11-13 | Dylan Conway | tar: match npm more closely in npm mode (#48888) |
| `31744d23a96` | 2026-11-13 | Dylan Conway | fds: give opened descriptors an owner instead of closing them by hand (#48880) |
| `4cf6d10b395` | 2026-11-13 | Dylan Conway | event loop: give the uws loop its lifetime and share the mini loop (#48885) |
| `e0c9596ca5e` | 2026-11-13 | Dylan Conway | shell: environments and their strings are owned (#48889) |
| `0554db8758a` | 2026-11-13 | Dylan Conway | vm: share the VM instead of borrowing it exclusively (#48875) |
| `c7b1ba42a38` | 2026-11-13 | Jarred Sumner | http: resume a partially written request head from the same bytes (#48667) |
| `4bf0ef99dfe` | 2026-11-13 | Dylan Conway | test: share the temporary folder setup; resolve HTML entry points as paths (#48873) |
| `33cf0a0a339` | 2026-11-13 | Dylan Conway | event loop: share the loop instead of borrowing it exclusively (#48866) |
| `b6e7b9cdc4e` | 2026-11-13 | Dylan Conway | timers: share the timer state instead of borrowing it exclusively (#48854) |
| `e67258f3348` | 2026-11-13 | Dylan Conway | css: give the AST the lifetime of its arena (#48819) |
| `d0f4fdd65fb` | 2026-11-12 | Jarred Sumner | AOT: bundles, classes behind parameters, exports by getters, mocks of awaiting files, known strings (#48771) |
| `f84773225f2` | 2026-11-12 | Dylan Conway | ci: check the history of a release branch (#48809) |
| `f11eb40b197` | 2026-11-12 | Dylan Conway | ci: list the contributors of a release without building a diff (#48799) |
| `4a78d39947f` | 2026-11-12 | Dylan Conway | ci: release pipeline cleanups (#48776) |
| `9ea3c693a20` | 2026-11-12 | Dylan Conway | Bump to 1.4.5 (#48774) |
| `801eb373283` | 2026-11-12 | Dylan Conway | ci: build releases from release branches (#48769) |
| `8aa496e1df5` | 2026-11-12 | Dylan Conway | Pin WebKit to b553971ea817 (#48750) |
| `741769c6e80` | 2026-11-12 | Jarred Sumner | AOT: update the engine; stores in defaults of parameters, paths that stores rule out (#48714) |
| `ccb3611f2ad` | 2026-11-12 | Jarred Sumner | AOT: strings that packages evaluate, modules in bundles, class factories, mocks in import cycles (#48677) |
| `7f964e69651` | 2026-11-11 | Dylan Conway | Tighten checks in lifecycle scripts, package extraction and macros (#48423) |
| `43850629ce6` | 2026-11-11 | Jarred Sumner | AOT: module instances in test runs, files that packages read, build cost (#48617) |
| `f33631841f6` | 2026-11-11 | robobun | Upgrade WebKit to 8156ba68efab (#48297) |
| `447ff870b60` | 2026-11-11 | Jarred Sumner | AOT: stack traces as in bun run, code from disk, workers, embedded files, module mocks, build cost (#48478) |
| `89452d2ac13` | 2026-11-10 | Jarred Sumner | AOT: bun compile, build output, module mocks, fixes and new names (#48436) |
| `98cda0d8b12` | 2026-11-09 | Jarred Sumner | AOT: Bun's side of the compiler's new optimizations, with fixes and tests (#48120) |
| `750f232afe5` | 2026-11-09 | Dylan Conway | Check vendored test suites out by commit (#48428) |
| `af566a38e5a` | 2026-11-09 | Dylan Conway | Extend existing checks to `bun run` bins and `data:` URL macros (#48413) |
| `cd40cef93a2` | 2026-11-09 | Alistair Smith | css: fix layer ordering bugs left after #47797 (#47882) |
| `2596ac5d391` | 2026-11-07 | Jarred Sumner | AOT: the Bun side of the rewritten ahead-of-time compiler (#47942) |
| `7ca0042d3ba` | 2026-11-06 | Dylan Conway | Check the xwin archive's sha256; ignore `bin` paths that contain a NUL (#48050) |
| `b1305ddc7ce` | 2026-11-05 | Dylan Conway | ci: leave the SSH server out of the Linux images (#47981) |
| `b1007f1177f` | 2026-11-04 | Dylan Conway | Remove 125 `unsafe` blocks from IPC, N-API, `bun:ffi`, `node:zlib`, c-ares, BoringSSL, `node:quic` and the parser (#47944) |
| `e57d89ba63a` | 2026-11-04 | Dylan Conway | Make `epoll_ctl`, `kevent`, six uSockets loop imports and `Bun__FFI__closeFunctions` unsafe to call (#47940) |
| `05a0ec93a61` | 2026-11-04 | Dylan Conway | Remove 98 `unsafe` blocks from `bun_threading`, `bun_alloc`, the bundler and the transpiler (#47901) |
| `b9f2ec36352` | 2026-11-04 | Dylan Conway | Remove 131 `unsafe` blocks from `Blob`, `Bun.write`, `FileSink`, `fetch`, `Response` and the S3 client (#47895) |
| `e0953f4f75b` | 2026-11-04 | Dylan Conway | install: send configured credentials to tarball URLs that the project names (#47900) |
| `cdfa19bba93` | 2026-11-03 | Dylan Conway | Remove 128 `unsafe` blocks from the event loop, spawn, `bun_jsc`, `node:fs` and `fs.watch` (#47893) |
| `9365e0c1a70` | 2026-11-03 | Dylan Conway | Remove 187 `unsafe` blocks from the VM, DNS, timers, and the socket and server code (#47871) |
| `675ee5b97b9` | 2026-11-03 | Dylan Conway | Fixes in node:net, node:http, node:http2, node:stream, node:quic, node:worker_threads, node:crypto and Bun.password (#47836) |
| `a2691bdbf49` | 2026-11-03 | Dylan Conway | Remove 126 `unsafe` blocks from the core crates, the resolver and the package manager (#47414) |
| `3bf1a06469d` | 2026-11-02 | Dylan Conway | ci: remove the issue dedupe and PR issue-finder workflows (#47824) |
| `5e08ec1bec7` | 2026-11-02 | Dylan Conway | X509Certificate, Bun.password and Bun.CryptoHasher: a fifth batch of crypto fixes (#47820) |
| `01ec0854347` | 2026-11-02 | Dylan Conway | node:crypto, webcrypto: a fourth batch of Node compatibility fixes (#47671) |
| `6a38049270e` | 2026-11-02 | Alistair Smith | css: keep a named sublayer that follows an anonymous layer in a masked import (#47810) |
| `6cdb3835d90` | 2026-11-02 | Alistair Smith | css: print @layer statements before @import and keep the layers of duplicate imports (#47797) |
| `a4c3a5eee9a` | 2026-11-02 | Dylan Conway | ci: look up and bake Windows images with Azure federated identities (#47779) |
| `129f3c7a896` | 2026-11-02 | Dylan Conway | crash handler: take the signature off a saved return address on arm64 (#47523) |
| `bdb04717320` | 2026-11-02 | robobun | bundler: convert the prelinked graph's request count to u16 once (#46363) |
| `a9bf6e26d31` | 2026-11-02 | robobun | mordant: remove baseline counts for findings that are gone (#46244) |
| `efcfe0ebca9` | 2026-11-02 | robobun | mordant: lower the baseline by 21 findings that are gone from main (#46969) |
| `271b65ec608` | 2026-11-02 | Ankur Datta | docs: update the Prisma guides to Prisma ORM 8 (#46310) |
| `3f3a9ff87cd` | 2026-11-01 | Dylan Conway | ci: look up Linux images with an AWS role (#47625) |
| `1b6d511ab26` | 2026-11-01 | Dylan Conway | ci: canary release uses a GitHub App token and does not wait for tests (#47622) |
| `43fc90a03c5` | 2026-11-01 | Dylan Conway | ci: publish to npm with trusted publishing (#47615) |
| `cee9dd92737` | 2026-10-31 | Dylan Conway | node:crypto, webcrypto: a third batch of Node compatibility fixes (#47591) |
| `384a3884ca0` | 2026-10-31 | Dylan Conway | ci: run release jobs in the release environment (#47601) |
| `09038927158` | 2026-10-31 | Dylan Conway | ci: remove the [sign windows] commit message option (#47596) |
| `d70e1775f7f` | 2026-10-31 | robobun | Fix the debug build: include FunctionCodeBlock.h in BunPlugin.cpp (#47592) |
| `2b0ace8c687` | 2026-10-31 | Dylan Conway | Replace libspng with a PNG codec in safe Rust and two Highway kernels (#47070) |
| `9e76acc6fb7` | 2026-10-31 | Jarred Sumner | bun test: Vitest compatibility (#44833) |
| `89fbb780659` | 2026-10-31 | Dylan Conway | node:crypto, webcrypto, tls: more Node compatibility fixes (#47567) |
| `4f7acde0f12` | 2026-10-31 | Dylan Conway | test: make isGlibcVersionAtLeast work with two-part glibc versions (#47564) |
| `31d9e12b04b` | 2026-10-31 | Dylan Conway | Unmask WebSocket server frames in blocks instead of byte by byte (#47555) |
| `a47a315dc4a` | 2026-10-31 | Jarred Sumner | AOT: bun test --aot on large suites, module loading fixes, fuzzer fixes (#47316) |
| `bc55d562b26` | 2026-10-31 | Dylan Conway | node:crypto, webcrypto: assorted Node compatibility fixes (#47559) |
| `6c5e37f6789` | 2026-10-31 | Dylan Conway | tty: keep fds 0-2 open on destroy, and give WriteStream its own prototype (#47395) |
| `34cbc70fa1d` | 2026-10-30 | Dylan Conway | Instantiate BunGlobWalker's methods once, in bun_glob (#47513) |
| `d7d941c045f` | 2026-10-30 | Dylan Conway | Put the small hot fields of the checker, parser and formatter structs first (#47512) |
| `77b380dcaff` | 2026-10-30 | Dylan Conway | Compile four cold paths in lint, the type checker and error conversion once (#47490) |
| `204d7017df3` | 2026-10-30 | Dylan Conway | Shrink defaultGlobalObject's inline part and use putDirectNamed at 114 more sites (#47498) |
| `8971677982d` | 2026-10-30 | robobun | Upgrade WebKit to e8f704815e94 (#47112) |
| `f7607a3d350` | 2026-10-29 | Dylan Conway | Remove 146 `unsafe` blocks from the dev server and the `Bun.*` APIs (#47393) |
| `9fe1cd6caa5` | 2026-10-29 | Dylan Conway | Remove 128 `unsafe` blocks from the test runner and the CLI (#47382) |
| `73a20437c1b` | 2026-10-29 | ig-ant | fs: add windowsHandle option to file streams (#47087) |
| `69f4077643c` | 2026-10-29 | Dylan Conway | TextDecoder: throw when the result cannot be allocated or is too long (#47278) |
| `e084c83006c` | 2026-10-29 | Dylan Conway | Remove 118 `unsafe` blocks from the syscall wrappers and the shell (#47338) |
| `da867c60bf0` | 2026-10-29 | Dylan Conway | Remove 74 `unsafe` blocks from the css parser, the bundler and the JS parser (#47317) |
| `000ef503730` | 2026-10-28 | Jarred Sumner | test: the floor of the ICU version takes a version with more parts than it has (#47323) |
| `377e942bf97` | 2026-10-28 | Dylan Conway | Fix false alarms in the scan behind `compile-trim-capabilities.test.ts` (#47326) |
| `081ace731df` | 2026-10-28 | Jarred Sumner | Remove the address space ballast and the mimalloc patches, upgrade mimalloc to v3.6.0 and ICU to 79.1 (#47281) |
| `57f4f19b744` | 2026-10-28 | Dylan Conway | Remove 166 `unsafe` blocks by borrowing and by naming the lifetimes that values already have (#47291) |
| `e64b59d9263` | 2026-10-28 | Jarred Sumner | Fix the build of bun_bundler with the test_support feature (#47299) |
| `3a9ea00437f` | 2026-10-28 | Jarred Sumner | AOT: fixes for modules, classes and Workers, WebKit upgrade, shorter compiler docs (#47129) |
| `bf801354935` | 2026-10-28 | Dylan Conway | Remove 70 `unsafe` blocks by borrowing instead of holding raw pointers (#47273) |
| `37a5e3a71c7` | 2026-10-28 | Dylan Conway | Zero-initialize plain C structs with the safe `ffi::zeroed()` (#47249) |
| `d472c5b3f9c` | 2026-10-28 | Dylan Conway | resolver: `Entry::kind` and `Entry::symlink` take `&RealFS` and are safe (#47250) |
| `563272e7818` | 2026-10-28 | Dylan Conway | sha: drop the unused `ENGINE` argument of the EVP hashers' `hash` (#47253) |
| `3e2d53cde4f` | 2026-10-28 | Dylan Conway | js_printer: give `RequireOrImportMetaCallback` the lifetime of its context (#47251) |
| `c49cc85d6e5` | 2026-10-28 | Dylan Conway | Drop `detach_lifetime` where the data already has the lifetime (#47247) |
| `73b53109f70` | 2026-10-28 | Dylan Conway | uws: put `Loop`'s fields in `Cell`s so its methods take `&self` (#47231) |
| `2871f0cb47f` | 2026-10-28 | Dylan Conway | shell: reference-count IO objects with `Rc` instead of `Arc` (#47238) |
| `60ca742d872` | 2026-10-28 | Dylan Conway | crash handler: give `CrashReason` the lifetime of its panic message (#47235) |
| `6c3d1bf9569` | 2026-10-28 | Jarred Sumner | Keep `Bun.Archive.extract()` and directory routes inside their directory, and bound sparse holes in `files()` (#47106) |
| `11c367163a4` | 2026-10-27 | Jarred Sumner | Upgrade WebKit to fcc1ea0973a4 (#47125) |
| `8d5672c5529` | 2026-10-27 | Jarred Sumner | Compile TypeScript to machine code ahead of time: `bun build --compile --aot` (#45631) |
| `7942008688a` | 2026-10-27 | Jarred Sumner | css: consolidate the open CSS parser fixes (#47025) |
| `9b8347a24e2` | 2026-10-27 | Dylan Conway | Upgrade WebKit to 191c6a41380b (#47057) |
| `92e819d895c` | 2026-10-27 | Dylan Conway | Replace bytemuck with an in-tree crate, bun_pod (#47037) |
| `c643ea8c2a9` | 2026-10-26 | Dylan Conway | Replace libarchive with a tar reader and writer in safe Rust (#46638) |
| `a0cc096ce8c` | 2026-10-26 | Dylan Conway | Upgrade WebKit to 982277c9dd3e (#47035) |
| `99ee03e0800` | 2026-10-26 | Dylan Conway | Replace HdrHistogram with safe Rust and fix `node:perf_hooks` histograms (#46650) |
| `8a0e49eedbb` | 2026-10-26 | Dylan Conway | bun_core::String can no longer borrow (fixes a source-map name use-after-free) (#46825) |
| `98a436596da` | 2026-10-26 | Dylan Conway | Fix use-after-free of `BuildMessage.position.file`: real lifetimes for `Source`, `Path`, `ImportRecord` and resolve results (#46834) |
| `1341090411b` | 2026-10-26 | robobun | install: print the loaded .env files only with --verbose (#47008) |
| `5734941b1b3` | 2026-10-26 | Jarred Sumner | bunx: fix the .bin link of a native dependency in more cases (#46486) |
| `3396aead750` | 2026-10-26 | robobun | bun lint: give JS plugin nodes and tokens start and end in TypeScript files without an ESLint or oxlint config (#46980) |
| `57fe602507f` | 2026-10-26 | Jarred Sumner | `bun lint`: a command in release builds, with shorter hints (#46439) |
| `449877f3e08` | 2026-10-25 | robobun | console.groupCollapsed: start a group, as console.group does (#46505) |
| `179664ea89f` | 2026-10-24 | Dylan Conway | darwin-ci: host.sh installs the pinned bun over a different version (#46718) |
| `5e182948be7` | 2026-10-24 | Dylan Conway | bindgen: move the stream sinks to a schema and delete `generate-jssink.ts` (#46641) |
| `811afe7cd5f` | 2026-10-23 | Dylan Conway | Upgrade WebKit to f59345e04a8d (#46690) |
| `a8fcd319be5` | 2026-10-23 | robobun | zlib: reach the z_stream only through a raw pointer while zlib-ng holds its back-pointer (#46607) |
| `a8b5e920c46` | 2026-10-24 | Alistair Smith | `bun check`: keep a nested object literal widened in a generic function (#46678) |
| `7d240c1dd59` | 2026-10-23 | robobun | deps: update c-ares to v1.34.9 (#46588) |
| `6292c6539d9` | 2026-10-23 | Dylan Conway | bindgen: move every Rust function that takes a `CallFrame` to schemas and delete `#[host_fn]`, `$rust` and `$newRustFunction` (#46540) |
| `5c6d4e24cd1` | 2026-10-23 | SUZUKI Sosuke | Upgrade WebKit to 33ce3bf11a71 (#46279) |
| `b70684d797c` | 2026-10-22 | Dylan Conway | Make `--use-openssl-ca` leave out the bundled root certificates (#46542) |
| `1917b1aaba8` | 2026-10-22 | Dylan Conway | Build with Bun 1.4.4, update Node.js to 26.12.1 (#46533) |
| `fec4a8850ea` | 2026-10-22 | Dylan Conway | bindgen: move the remaining 61 classes to schemas and delete `generate-classes.ts` (#46329) |
| `b6a5ecee50b` | 2026-10-22 | Jarred Sumner | release: fix the Homebrew job and a flaky Docker download (#46498) |
| `38afee6c84f` | 2026-10-22 | Jarred Sumner | node:http, node:http2: refuse the malformed requests that Node refuses (#46456) |
| `da9179d93ac` | 2026-10-22 | robobun | install: fall back to copyfile only when the hard link itself fails (#46480) |
| `017316d1086` | 2026-10-22 | Jarred Sumner | bunx: run the platform binary of a native dependency, not its stub (#46468) |
| `9c2dd6b6100` | 2026-10-21 | robobun | react-compiler: fix a throw on each render and stale values for a `let` that a memo block reassigns (#42482) |
| `e81a34ca329` | 2026-10-21 | Dylan Conway | compile: revert the startup check of every module graph offset (#46461) |
| `9e1e6ea5304` | 2026-10-21 | Dylan Conway | ci: fix the Windows sign step on the Build Tools image (#46462) |
| `7382b38a47a` | 2026-10-21 | Dylan Conway | usockets: fail the connection when send() reports too many bytes (#46452) |
| `398f1e34941` | 2026-10-21 | Jarred Sumner | Fix 7 regressions since 1.4.3 in bun install, bunx, bun patch, bun pm pack and bun: imports (#46455) |
| `7a748413f94` | 2026-10-21 | Jarred Sumner | http3: lift lsquic's limits on header sizes, and honor the stream ID of a GOAWAY (#46436) |
| `17ae5349b73` | 2026-10-21 | Dylan Conway | Fix quadratic `Bun.stringWidth` on non-ASCII multi-line text (#46389) |
| `0a0f5dc907b` | 2026-10-21 | robobun | pack: read an ignore line or `files` entry that begins with `!(` as a negation again (#46240) |
| `d99c2012507` | 2026-10-21 | robobun | ws: keep the async context of the call beside each waiting send callback (#46390) |
| `c6dd13de3ca` | 2026-10-21 | robobun | install: apply overrides to the range that bun add and bun update write (#46230) |
| `0a340f09be3` | 2026-10-21 | Jarred Sumner | `bun lint`: a command in canary builds only (#46438) |
| `b1d4686174a` | 2026-10-21 | Jarred Sumner | `bun check`: fix two regressions from #46001, the empty name in TS2883, and `this` of a constrained type parameter (#46417) |
| `2a5cbbcb084` | 2026-10-21 | Jarred Sumner | Fix regressions since 1.4.3 in bun install, bunx, node:fs and node:http2, and update brotli (#46392) |
| `9bd124cb40c` | 2026-10-21 | robobun | node:http: a request gets its body behind the FIN of socket.end() (#44419) |
| `dac8cca342e` | 2026-10-21 | robobun | install: re-parse a cached package.json in the call that replaces its text (#46394) |
| `f2de5902543` | 2026-10-21 | Dylan Conway | structuredClone: reject RSA CryptoKey records with no hash and ChaCha20-Poly1305 keys that are not 32 bytes (#46410) |
| `4a9c3418a27` | 2026-10-21 | Dylan Conway | fetch, RedisClient: a TLS session that breaks after its handshake is a lost connection, not a failed handshake (#46409) |
| `0de6da25f20` | 2026-10-21 | Dylan Conway | bun test --isolate: a macro call is `undefined` from the second test file on (#46405) |
| `54152a47f91` | 2026-10-21 | robobun | Bun.write: stop reporting a caught direct stream failure as an unhandled rejection (#41721) |
| `9e4545f9737` | 2026-10-21 | robobun | dev server: an `export *` after another statement of the same path loses exports of a barrel target (#46229) |
| `49b80f56ab0` | 2026-10-21 | Dylan Conway | sql(postgres): read the rows of a Bind written before its statement's RowDescription as text (#46408) |
| `0793250a5b9` | 2026-10-21 | robobun | Bump WebKit: the GC suspend signal handler works on an alternate signal stack (#45427) |
| `5738e23e04c` | 2026-10-21 | robobun | js_parser: bind the body of a class with lowered class decorators to the decorated class (#45435) |
| `cb1c0a25e26` | 2026-10-21 | Dylan Conway | structuredClone: reject malformed CryptoKey records instead of returning bogus or null keys (#46387) |
| `491aaad15f4` | 2026-10-21 | Dylan Conway | bun build --react-compiler: catch has its own position in the source map (#46378) |
| `6fbfdcd7efe` | 2026-10-21 | robobun | fetch: stop a `Connection: keep-alive` header from undoing `keepalive: false` on HTTP/1.1 (#46379) |
| `cd63c845449` | 2026-10-21 | robobun | install: put the resolutions back after a layout hoist (#45783) |
| `ebcd48701e3` | 2026-10-21 | robobun | tls: keep a stream TLS engine's context alive while its entry points run (#46335) |
| `e350ec3601b` | 2026-10-21 | Dylan Conway | bun test --coverage: list the lines of case and default (#46327) |
| `e53cd3d9948` | 2026-10-21 | robobun | Take a `Bun.build()` output as the Blob it holds in `Bun.hash`, `CryptoHasher`, the parsers and the client `WebSocket` (#45823) |
| `f2c800b3227` | 2026-10-21 | Dylan Conway | bun test --coverage: list the lines of an object literal's braces and of else (#46161) |
| `a950fc5307f` | 2026-10-21 | Jarred Sumner | Hardening follow-up: fix regressions from #46021 and more crashes (#46270) |
| `963452075e9` | 2026-10-21 | Dylan Conway | build: --hardened=on compiles everything with the stack protector, _FORTIFY_SOURCE, stack clash protection and zeroed locals (#46317) |
| `2d6d4454f3f` | 2026-10-21 | Dylan Conway | bun test --coverage: list the line of finally (#46301) |
| `43581903005` | 2026-10-21 | Dylan Conway | Fix `FileSink` panic when `start({ path })` moves a writer from a TTY to a regular file (#46283) |
| `59c1ac474cd` | 2026-10-21 | Dylan Conway | bindgen: classes whose struct outlives the JS object, and move `Timeout`, `Immediate`, `NodeHTTPResponse` and 14 more to schemas (#46128) |
| `f33c8409347` | 2026-10-21 | Dylan Conway | ci: update buildkite-agent to 4.7.0 (#46298) |
| `1f21b909887` | 2026-10-21 | Dylan Conway | tls: reject chains containing blocked public keys, update root certificates to NSS 3.131.1 (#46300) |
| `0c864a07c4a` | 2026-10-20 | Dylan Conway | Coverage: code that is skipped, or never reached after a yield or an await, reads as not run (#46183) |
| `5829c9df1ad` | 2026-10-20 | Dylan Conway | Fix `bun:sqlite` segfault in `Statement#run` before any `Database` has been opened (#46291) |
| `71bc8185c8a` | 2026-10-20 | Dylan Conway | Fix `TextEncoder.encodeInto` panic on a detached destination (#46274) |
| `9b4284f788f` | 2026-10-20 | Jarred Sumner | Hardening: fix crashes across the runtime, bundler, dev server, shell and CLI (#46021) |
| `4a5e6eb04ad` | 2026-10-20 | Jarred Sumner | `bun check`: fix errors lost since #45800, and 9 to 37% faster (#46001) |
| `b7efd52c3b3` | 2026-10-20 | Dylan Conway | ci-images: update the system's trusted roots (#46227) |
| `ea6a2c7b7c9` | 2026-10-19 | Jarred Sumner | crypto: update root certificates (#46159) |
| `6f58f6b8944` | 2026-10-19 | Dylan Conway | Source positions: coverage, stack frames, call sites and source maps agree with the source (#45677) |
| `eb807b77186` | 2026-10-20 | Alistair Smith | bun bake: require() of a built-in, and a route whose import threw (#46017) |
| `b4c02f03f43` | 2026-10-20 | Alistair Smith | test: fix bake.test.ts cleanup and the --check URL on Windows (#46135) |
| `6673b8ebf2d` | 2026-10-19 | Dylan Conway | test: fix 20 flaky tests (#45873) |
| `3469eb3f863` | 2026-10-20 | Alistair Smith | bun bake: the framework names the server-only exports of its pages (#45996) |
| `3880151f0ab` | 2026-10-19 | Dylan Conway | Move `Crypto`, `TextDecoder`, `Bun.FileSystemRouter` and three more classes to bindgen schemas (#45888) |
| `91e7e3b140e` | 2026-10-19 | Alistair Smith | dev error overlay: the look of bun.com, and errors of one kind in one card (#45959) |
| `02f36b477ee` | 2026-10-19 | Alistair Smith | dev error overlay: scroll, show duplicate errors once, underline the whole css url() (#45921) |
| `94f1325fc2d` | 2026-10-19 | Alistair Smith | bun bake: getServerSideProps, getStaticProps and getStaticPaths (#45911) |
| `6bb5dc19565` | 2026-10-18 | Jarred Sumner | `bun check`: 1.4x to 7.8x faster on large projects. Fixes for `bun check`, `bun lint` and `bun fmt` (#45800) |
| `c1df64b8d5c` | 2026-10-18 | Jarred Sumner | install: fix regressions since 1.4.3 and resolve peer dependencies more like pnpm (#45898) |
| `ad4089bf49d` | 2026-10-19 | Alistair Smith | bun bake: .tsx pages and frameworks in bake.config.ts (#45905) |
| `59003546239` | 2026-10-18 | Alistair Smith | bun bake: start again when bake.config.ts changes (#45902) |
| `25ef6936bde` | 2026-10-18 | Alistair Smith | bun bake: build plugins from bake.config.ts (#45828) |
| `4354b80d7bc` | 2026-10-18 | Jarred Sumner | install: more fixes after the package manager consolidation (#45710) |
| `bc1030a97b0` | 2026-10-18 | Jarred Sumner | WebSocket client: follow-up fixes to #45223 (#45720) |
| `ed58ba2126e` | 2026-10-17 | Dylan Conway | Move 58 small natives of `node:*` and `Bun` to bindgen schemas (#45851) |
| `5667cd6c0ad` | 2026-10-17 | Jarred Sumner | sql: fixes for problems found after the consolidation (#45304) (#45711) |
| `d0831bc9fe5` | 2026-10-17 | Dylan Conway | Check published types against the bindgen schemas, honor `memLevel` and `strategy` in `gzipSync` and `deflateSync`, and pass dictionaries to Rust by reference (#45794) |
| `53296f9fa0a` | 2026-10-17 | Dylan Conway | test: compile eight components on Windows in the chain of functions test of react-compiler.test.ts (#45808) |
| `80145254100` | 2026-10-17 | Dylan Conway | test: do not wait for a build that is already done in module-graph-isolation.test.ts (#45821) |
| `534a4e1379f` | 2026-10-17 | Dylan Conway | test: wait for the child in module-graph-workers.test.ts only once the worker's dispose() has returned (#45813) |
| `988d77a28f8` | 2026-10-17 | Dylan Conway | test: install the signal storm handler of setTimeout.test.js with SA_RESTART (#45811) |
| `9a22efd3cf2` | 2026-10-17 | Dylan Conway | test: rename the marker file into place in the macOS end-to-end test of cron.test.ts (#45809) |
| `ed680823cb6` | 2026-10-18 | Alistair Smith | add bun bake: serve app/pages and app/server.ts (#45682) |
| `fd539ca7c0d` | 2026-10-17 | robobun | Remove dead code from bun_lint, bun_sema, BunProcess.cpp, and NodeDirent.cpp (#45764) |
| `0973e696f90` | 2026-10-17 | Dylan Conway | test: spell PATH one way in bunEnv on Windows (#45692) |
| `47c8687a098` | 2026-10-17 | Dylan Conway | test: wait for the close callback in the batch test of node-dgram.test.js (#45686) |
| `ed799f0cd2a` | 2026-10-17 | Dylan Conway | test: yield the next chunk once the client has the first in async-iterator-stream.test.ts (#45688) |
| `d635666b051` | 2026-10-17 | Dylan Conway | test: ask the heap what keeps a graph alive in the 50 graphs test of module-graph.test.ts (#45674) |
| `5eab34dacb0` | 2026-10-17 | Dylan Conway | test: have the grandchild of the crashed worker test in parallel.test.ts block in wait (#45661) |
| `bd68ea530ba` | 2026-10-17 | robobun | test: bind the blackhole listener to lo0 on macOS (#44413) |
| `c814409aea4` | 2026-10-17 | Dylan Conway | Define Bun.CryptoHasher, the static hashers and Bun.sha with the bindgen (#45687) |
| `c0e1716f173` | 2026-10-17 | Dylan Conway | `fs.realpath`: a backslash is part of the file name on POSIX, and each variant reads its path as Node does (#45423) |
| `017b2439a7a` | 2026-10-16 | Jarred Sumner | sql: consolidate the open Bun.sql, bun:sqlite and node:sqlite pull requests (#45304) |
| `788087c0a4e` | 2026-10-16 | Jarred Sumner | `bun lint`: JSON and Markdown natively, programs in parallel. `bun check -b`: share work between projects. `bun fmt`: `package.json` and Svelte without Prettier (#45595) |
| `ff8ad61ad5d` | 2026-10-16 | Dylan Conway | Add b.bytes and define thirty-five Bun.* functions with the bindgen (#45590) |
| `0ffddcdc6d6` | 2026-10-16 | robobun | test(bake): remove the test that checks `Response.render` stays removed (#45641) |
| `4f4b46a4de0` | 2026-10-16 | Dylan Conway | test: run harness-max-rss.test.ts and compile-rss.test.ts outside the parallel batch (#45636) |
| `57c4be79e89` | 2026-10-16 | Dylan Conway | test: keep hot() from being inlined in disallow-code-generation-from-strings.test.ts (#45639) |
| `be49315aeb9` | 2026-10-16 | Dylan Conway | test: give the registry.npmjs.org stand-in of the migration tests its own cache (#45644) |
| `3214d0b2900` | 2026-10-16 | Dylan Conway | test: compare the tarballs of the overrides test in run-autoinstall.test.ts without their order (#45640) |
| `abf661025d7` | 2026-10-16 | Dylan Conway | test: drop the 5 second timeout of load-same-js-file-a-lot.test.ts (#45635) |
| `7f3bc6a5e0f` | 2026-10-16 | Dylan Conway | test: reset with terminate() in the close() error tests of socket.test.ts (#45598) |
| `321972abf13` | 2026-10-16 | Dylan Conway | test: start the exit timer in worker-terminate-lifetime.test.ts once the fetches have responded (#45600) |
| `f0c6cbc81ad` | 2026-10-16 | Jarred Sumner | WebSocket: real closing handshake, one failure path, `ws` rewritten on native transports (consolidates the open WebSocket PRs) (#45223) |
| `4334326cd1e` | 2026-10-16 | Jarred Sumner | install: accept a migrated yarn.lock whose resolutions key has a range (#45616) |
| `d7562f260d4` | 2026-10-16 | Dylan Conway | YAML.parse: name a key that is a sequence or a mapping once the input has been read (#45593) |
| `0b2d346127f` | 2026-10-17 | Alistair Smith | bake: fix a plugin leak, ignoreDirs parsing, and a router crash (#45605) |
| `b28212a12cf` | 2026-10-17 | Alistair Smith | bake: move the code into folders by job (no behavior change) (#45489) |
| `f0e4f6b3b55` | 2026-10-16 | Dylan Conway | test: pack the rename-retry fixture with Bun.Archive, not the system tar (#45588) |
| `f8bc171976f` | 2026-10-16 | Jarred Sumner | install: replace a file at a command's name behind a symlinked node_modules (#45477) |
| `21620e2be39` | 2026-10-16 | Dylan Conway | Define eighteen Bun.* functions with the bindgen (#45450) |
| `d940fbe7b9c` | 2026-10-16 | Dylan Conway | Bump WebKit to 87ee10da087b (#45567) |
| `25411eaa357` | 2026-10-16 | Jarred Sumner | `bun lint`, `bun fmt`, `bun check`: fix the open issues (#45482) |
| `0a2f1c81569` | 2026-10-16 | Dylan Conway | Bun.indexOfLine with the bindgen, and .allowShared for a SharedArrayBuffer (#45454) |
| `5866b5f13de` | 2026-10-16 | Alistair Smith | remove JSPromise Strong::from_value, its last caller is gone (#45481) |
| `288aca3b0fb` | 2026-10-16 | Alistair Smith | ci: bump mordant to 564c8da (#45478) |
| `4b1681a2cf1` | 2026-10-16 | Alistair Smith | bake: drop React-specific behavior from core ("use server", --server-components, bun:app) (#45461) |
| `8ba82c36d62` | 2026-10-16 | Jarred Sumner | install: terse messages, quieter output, and retries that start at 50 ms (#45460) |
| `e4c638fab66` | 2026-10-16 | Alistair Smith | ci: bump mordant to 0d47474 (#45465) |
| `86da172b06f` | 2026-10-16 | Alistair Smith | ci: bump mordant to 8ba3540 (#45463) |
| `e25d24c1557` | 2026-10-15 | Dylan Conway | bake: options own their strings, in one set of types (#44496) |
| `6ffebec89eb` | 2026-10-15 | Jarred Sumner | `bun lint`: warn when a tsconfig.json without `include` made it load many files to lint a few (#45302) |
| `0663016fd8e` | 2026-10-15 | robobun | Compile cache: skip the bytecode optimizer when writing entries (#45446) |
| `f14a5a684f7` | 2026-10-15 | Jarred Sumner | `bun lint --type-aware`: ask for types on demand instead of checking every file first (#45451) |
| `e6f65f33c72` | 2026-10-15 | Jarred Sumner | install: fix regressions and older bugs found after the package manager consolidation (#45307) |
| `af5743d74cf` | 2026-10-15 | Dylan Conway | One bindgen: replace bindgen v1 and v2, add classes, generate the Rust side (#45104) |
| `792368fdcc7` | 2026-10-15 | Jarred Sumner | fetch over HTTP/2: reject on a TLS alert after the handshake, and stop using a connection that went silent after an abort (#45422) |
| `f2405c382d4` | 2026-10-16 | SUZUKI Sosuke | Upgrade WebKit to 23b0720b40 (#45303) |
| `116dd64fd5c` | 2026-10-15 | Jarred Sumner | `bun lint`: categories skip frameworks the project doesn't use, and `"plugin/*" = "off"` turns a plugin off (#45297) |
