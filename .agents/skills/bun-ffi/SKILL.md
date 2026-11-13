---
name: bun-ffi
description: bun:ffi dans src. Pont TS <-> natif : dlopen + symboles typés, CString + core_free, JSCallback pour le streaming (packages/core/src/ffi.ts). Utiliser avant d'écrire ou modifier du code bun-ffi dans C:\src.
---

# bun:ffi dans src

Pont TS <-> natif : dlopen + symboles typés, CString + core_free, JSCallback pour le streaming (packages/core/src/ffi.ts).

Sources :
- [V] https://bun.com/reference/bun/ffi
- clone local : third_party/bun (docs/runtime/ffi.mdx) (0 fichiers indexés)

Code testé qui l'utilise (24, généré par `bun packages/core/src/cli.ts gen`) :
- `apps/aphrody/src/runtime/hash.ts` — tests : `apps/aphrody/tests/aphrody.test.ts`, `apps/aphrody/tests/seo.test.ts`
- `apps/auto/packages/native/src/index.ts` — tests : `apps/auto/AY_FIELD_TEST.md`, `apps/auto/apps/admin/src/serveur.test.ts`, `apps/auto/apps/api/src/admin.test.ts`
- `apps/rosegriffon/packages/bun-engine-formats/src/tinke.ts` — tests : `apps/rosegriffon/apps/cli/src/index.test.ts`, `apps/rosegriffon/apps/iecode-dotnet/Cli/Commands/TestG4sk.cs`, `apps/rosegriffon/apps/iecode-dotnet/Core.Tests/AdxDecoderTests.cs`
- `apps/rosegriffon/packages/inagle/src/core/vfs-data.ts` — tests : `apps/rosegriffon/apps/cli/src/index.test.ts`, `apps/rosegriffon/apps/iecode-dotnet/Cli/Commands/TestG4sk.cs`, `apps/rosegriffon/apps/iecode-dotnet/Core.Tests/AdxDecoderTests.cs`
- `apps/rosegriffon/packages/inagle/src/dotnet/native.ts` — tests : `apps/rosegriffon/apps/cli/src/index.test.ts`, `apps/rosegriffon/apps/iecode-dotnet/Cli/Commands/TestG4sk.cs`, `apps/rosegriffon/apps/iecode-dotnet/Core.Tests/AdxDecoderTests.cs`
- `apps/rosegriffon/packages/inagle/src/ffi/nie.ts` — tests : `apps/rosegriffon/apps/cli/src/index.test.ts`, `apps/rosegriffon/apps/iecode-dotnet/Cli/Commands/TestG4sk.cs`, `apps/rosegriffon/apps/iecode-dotnet/Core.Tests/AdxDecoderTests.cs`
- `apps/rosegriffon/templates/lua52-service/src/ast.ts` — tests : `apps/rosegriffon/apps/cli/src/index.test.ts`, `apps/rosegriffon/apps/iecode-dotnet/Cli/Commands/TestG4sk.cs`, `apps/rosegriffon/apps/iecode-dotnet/Core.Tests/AdxDecoderTests.cs`
- `apps/rosegriffon/templates/lua52-service/src/rea.ts` — tests : `apps/rosegriffon/apps/cli/src/index.test.ts`, `apps/rosegriffon/apps/iecode-dotnet/Cli/Commands/TestG4sk.cs`, `apps/rosegriffon/apps/iecode-dotnet/Core.Tests/AdxDecoderTests.cs`
- `apps/shenron/packages/config/test/fixtures/violating/src/ffi.ts` — tests : `apps/shenron/apps/activity/test/auth.test.ts`, `apps/shenron/apps/activity/test/boundaries.test.ts`, `apps/shenron/apps/activity/test/browser.live.test.ts`
- `apps/shenron/packages/native/src/engine.ts` — tests : `apps/shenron/apps/activity/test/auth.test.ts`, `apps/shenron/apps/activity/test/boundaries.test.ts`, `apps/shenron/apps/activity/test/browser.live.test.ts`
- `apps/shenron/packages/native/src/generated/symbols.ts` — tests : `apps/shenron/apps/activity/test/auth.test.ts`, `apps/shenron/apps/activity/test/boundaries.test.ts`, `apps/shenron/apps/activity/test/browser.live.test.ts`
- `apps/shenron/packages/native/src/re.ts` — tests : `apps/shenron/apps/activity/test/auth.test.ts`, `apps/shenron/apps/activity/test/boundaries.test.ts`, `apps/shenron/apps/activity/test/browser.live.test.ts`
- `apps/shenron/packages/native/src/worker-thread.ts` — tests : `apps/shenron/apps/activity/test/auth.test.ts`, `apps/shenron/apps/activity/test/boundaries.test.ts`, `apps/shenron/apps/activity/test/browser.live.test.ts`
- `apps/shenron/packages/native/test/compat.test.ts` — tests : `apps/shenron/apps/activity/test/auth.test.ts`, `apps/shenron/apps/activity/test/boundaries.test.ts`, `apps/shenron/apps/activity/test/browser.live.test.ts`
- `apps/shenron/packages/pipeline/test/aphrody/portability.test.ts` — tests : `apps/shenron/apps/activity/test/auth.test.ts`, `apps/shenron/apps/activity/test/boundaries.test.ts`, `apps/shenron/apps/activity/test/browser.live.test.ts`
- `infra/ffi-bridge/index.ts` — tests : `infra/ffi-bridge/polyglot.test.ts`, `infra/ffi-bridge/rust-stack-ffi.test.ts`, `infra/ffi-bridge/unix-distro.test.ts`
- `infra/ffi-bridge/rust-stack-ffi.test.ts` — tests : `infra/ffi-bridge/polyglot.test.ts`, `infra/ffi-bridge/rust-stack-ffi.test.ts`, `infra/ffi-bridge/unix-distro.test.ts`
- `infra/ffi-bridge/src/unix-distro.ts` — tests : `infra/ffi-bridge/polyglot.test.ts`, `infra/ffi-bridge/rust-stack-ffi.test.ts`, `infra/ffi-bridge/unix-distro.test.ts`
- `packages/bun-plugins/decide-plugin.ts` — tests : `packages/bun-plugins/m3-icons-plugin.test.ts`, `packages/bun-plugins/tests/just-plugin.test.ts`, `packages/bun-plugins/tests/lua-plugin.test.ts`
- `packages/core/src/ffi.ts` — tests : `packages/core/test/ffi.test.ts`
- `packages/core/test/ffi.test.ts` — tests : `packages/core/test/ffi.test.ts`
- `packages/forge/src/depot-bridge.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/forge/src/depot_ffi.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/forge/src/native_lib.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`

Scripts :
- `bun packages/core/src/cli.ts index C:/src --all` : réindexe (sqlite var/index/core.db + JSON).
- `bun packages/core/src/cli.ts users bun:ffi` : liste les fichiers qui l'importent/l'appellent.
- `bun test packages/core` : round-trip bun:ffi <-> core-capi.
