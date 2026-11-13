# bun:ffi dans src

Pont TS <-> natif : dlopen + symboles typés, CString + core_free, JSCallback pour le streaming (packages/core/src/ffi.ts).

Sources :
- [V] https://bun.com/reference/bun/ffi
- clone local : third_party/bun (docs/runtime/ffi.mdx) (0 fichiers indexés)

Code testé qui l'utilise (14, généré par `bun packages/core/src/cli.ts gen`) :
- `apps/aphrody/src/runtime/hash.ts` — tests : `apps/aphrody/tests/aphrody.test.ts`, `apps/aphrody/tests/seo.test.ts`
- `infra/ffi-bridge/index.ts` — tests : `infra/ffi-bridge/polyglot.test.ts`, `infra/ffi-bridge/rust-stack-ffi.test.ts`, `infra/ffi-bridge/unix-distro.test.ts`
- `infra/ffi-bridge/rust-stack-ffi.test.ts` — tests : `infra/ffi-bridge/polyglot.test.ts`, `infra/ffi-bridge/rust-stack-ffi.test.ts`, `infra/ffi-bridge/unix-distro.test.ts`
- `infra/ffi-bridge/src/unix-distro.ts` — tests : `infra/ffi-bridge/polyglot.test.ts`, `infra/ffi-bridge/rust-stack-ffi.test.ts`, `infra/ffi-bridge/unix-distro.test.ts`
- `packages/ai-os/native/sovereign-polyglot-ffi/src/system1.rs` — tests : `packages/ai-os/tests/ai-os.test.ts`, `packages/ai-os/tests/full-design-mode.test.ts`, `packages/ai-os/tests/rosegriffon.test.ts`
- `packages/ai-os/src/ffi/desktop.ts` — tests : `packages/ai-os/tests/ai-os.test.ts`, `packages/ai-os/tests/full-design-mode.test.ts`, `packages/ai-os/tests/rosegriffon.test.ts`
- `packages/ai-os/src/ffi/polyglot.ts` — tests : `packages/ai-os/tests/ai-os.test.ts`, `packages/ai-os/tests/full-design-mode.test.ts`, `packages/ai-os/tests/rosegriffon.test.ts`
- `packages/bun-plugins/decide-plugin.ts` — tests : `packages/bun-plugins/m3-icons-plugin.test.ts`, `packages/bun-plugins/tests/just-plugin.test.ts`
- `packages/core/src/ffi.ts` — tests : `packages/core/test/ffi.test.ts`
- `packages/core/test/ffi.test.ts` — tests : `packages/core/test/ffi.test.ts`
- `packages/forge/src/depot-bridge.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/forge/src/depot_ffi.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/forge/src/native_lib.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/pi-opencode/src/native-bridge.ts` — tests : `packages/pi-opencode/tests/pi-opencode.test.ts`

Scripts :
- `bun packages/core/src/cli.ts index C:/src --all` : réindexe (sqlite var/index/core.db + JSON).
- `bun packages/core/src/cli.ts users bun:ffi` : liste les fichiers qui l'importent/l'appellent.
- `bun test packages/core` : round-trip bun:ffi <-> core-capi.
