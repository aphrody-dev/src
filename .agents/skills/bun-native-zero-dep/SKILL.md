---
name: bun-native-zero-dep
description: Canonical sovereign guide for Pure Bun v1.4.4 Full-Rust zero-dependency architecture across src. Enforces zero bunx invocations, zero unnecessary dependencies/devDependencies in package.json, native Bun v1.4.4 API replacements (Bun.SQL, bun:sqlite, Bun.S3Client, Bun.Image, Bun.Archive, Bun.serve, Bun.Glob, Bun.CryptoHasher, Bun.password, Bun.semver, Bun.color, Bun.Transpiler, bun:ffi, bun fmt, bun check, bun build --compile --bytecode), and ambient TypeScript declarations (bun-native.d.ts).
---

# Pure Bun v1.4.4 Zero-Dependency & Zero-bunx Architecture (`bun-native-zero-dep`)

## 1. Core Sovereign Directives

1. **Zero `bunx` Everywhere**:
   - NEVER invoke `bunx` in scripts, `package.json`, `justfile`, CI workflows, code comments, or documentation.
   - `bunx` resolves, downloads, and executes arbitrary npm tarballs on demand, violating deterministic supply-chain integrity, offline reproducibility, and sub-millisecond startup.
   - Replace every `bunx <tool>` invocation with:
     - Native Bun v1.4.4 subcommands: `bun fmt`, `bun check`, `bun test`, `bun build --compile --bytecode`.
     - Workspace binary scripts: `bun run <bin>` or `bun <script.ts>`.
     - Pre-compiled userland AOT binaries in `C:\Users\aphro\.local\bin` (`xtk`, `n2b`, `gds`, `wck`, `frg`, `triad`, `src-deploy`, `ai-os`).

2. **Zero Unnecessary `dependencies` and `devDependencies`**:
   - First-party Bun v1.4.4 packages and services MUST declare `"dependencies": {}, "devDependencies": {}` whenever native Bun APIs, Web Standards, or C-ABI `bun:ffi` bridges cover the workload.
   - Packages do NOT need `@types/bun`, `@types/node`, `typescript`, `prettier`, `biome`, `turbo`, `@changesets/cli`, `postgres`, `better-sqlite3`, `aws4fetch`, `@aws-sdk/client-s3`, `sharp` (for metadata/resize/transcode/ThumbHash), `undici`, `axios`, `pino`, `glob`, `semver`, `chalk`, or `@paralleldrive/cuid2`.

3. **Sacred Host Userspace & Zero Emojis**:
   - Never touch `C:\Windows\System32`. Install compiled `.exe` and `.dll` artifacts only in `C:\Users\aphro\.local\bin`.
   - Never print, log, or commit raw secrets from `.env`.
   - Zero emojis in code, JSON, Markdown, or commit messages.

---

## 2. Passing `bun check` With `"dependencies": {}, "devDependencies": {}`

Bun v1.4.4 ships a native multi-core Rust port of TypeScript 7 (`bun check`) with built-in standard library definitions (`ESNext`, `DOM`, `DOM.Iterable`, `WebWorker`).

### Critical Rule: Omit `"types": ["bun"]` in `tsconfig.json`

In TypeScript 7 (`bun check`), omitting `"types"` defaults to `types: []` (no automatic `node_modules/@types/*` lookup). Setting `"types": ["bun"]` forces the checker to search `node_modules/@types/bun` and fails with `TS2688` when `devDependencies` is `{}`.

Instead, include the shared sovereign ambient header [`packages/bun-plugins/bun-native.d.ts`](packages/bun-plugins/bun-native.d.ts) (or a local `src/bun-env.d.ts` triple-slash reference).

### Canonical Zero-Dependency `package.json`

```json
{
  "name": "@aphrody/example-pkg",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "start": "bun run src/index.ts",
    "test": "bun test",
    "check": "bun check",
    "fmt": "bun fmt",
    "fmt:check": "bun fmt --check",
    "compile": "bun build --compile --minify --bytecode src/index.ts --outfile C:/Users/aphro/.local/bin/example-pkg.exe"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

### Canonical Zero-Dependency `tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "test/**/*.ts", "../bun-plugins/bun-native.d.ts"],
  "exclude": ["dist", "node_modules"]
}
```

### Standalone Minimal `bun-ambient.d.ts` Pattern (For Isolated Apps)

If an app lives outside `packages/*` and prefers a self-contained header (like `apps/aphrody/src/globals.d.ts` or `packages/wck/src/globals.d.ts`), either reference `../../packages/bun-plugins/bun-native.d.ts` or declare only the surface used:

```ts
/// <reference path="../../packages/bun-plugins/bun-native.d.ts" />
```

---

## 3. Complete Native Bun v1.4.4 Replacement Table

| Legacy / Fragile Dependency                                        | Native Bun v1.4.4 Replacement                                                                                 | Local Docs & First-Party Reference                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `bunx <pkg>` / `npx <pkg>`                                         | `bun <cmd>`, `bun run <bin>`, or AOT binary in `~/.local/bin`                                                 | Zero external on-demand tarball execution                                            |
| `turbo` (`turbo run build/test`)                                   | `bun run --filter '*' <script>` + `@aphrody/bun-plugins` `TurboCache`                                         | `packages/bun-plugins/turbo-cache-plugin.ts`                                         |
| `@changesets/cli`                                                  | `Bun.semver` + `bun pm pack` + `vcs:meta` plugin (`git` / `jj`)                                               | `third_party/bun/docs/runtime/semver.mdx`, `packages/bun-plugins/vcs-meta-plugin.ts` |
| `@types/bun`, `@aphrody/bun-types`, `@types/node`, `typescript`    | `bun check` (built-in TS7 `lib.*.d.ts`) + `bun-native.d.ts`                                                   | `third_party/bun/docs/runtime/check.mdx`, `packages/bun-plugins/bun-native.d.ts`     |
| `prettier`, `@biomejs/biome` (formatting)                          | `bun fmt` / `bun fmt --check` (`sortImports`, `sortTailwindcss`, `sortPackageJson`)                           | `third_party/bun/docs/format/index.mdx`                                              |
| `postgres`, `pg`, `mysql2`, `@aphrody/sql`                         | `Bun.SQL` (`import { sql, SQL } from "bun"`)                                                                  | `third_party/bun/docs/runtime/sql.mdx`                                               |
| `better-sqlite3`, `sql.js`, `sqlite3`                              | `bun:sqlite` (`import { Database } from "bun:sqlite"`)                                                        | `third_party/bun/docs/runtime/sqlite.mdx`                                            |
| `aws4fetch`, `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner` | `Bun.S3Client` / `Bun.s3` (`s3.file()`, `s3.presign()`, multipart `writer()`)                                 | `third_party/bun/docs/runtime/s3.mdx`                                                |
| `sharp`, `image-size`, `thumbhash`                                 | `Bun.Image` / `Bun.file(p).image()` (`metadata()`, `resize()`, `webp()`, `avif()`, `placeholder()`)           | `third_party/bun/docs/runtime/image.mdx`                                             |
| `tar`, `archiver`, `decompress`, `fflate`, `fzstd`                 | `Bun.Archive`, `Bun.gzipSync`, `Bun.deflateSync`, `Bun.zstdCompressSync`, `CompressionStream("br" \| "zstd")` | `third_party/bun/docs/runtime/archive.mdx`, `packages/bun-parity`                    |
| `express`, `fastify`, `hono`, `ws`, `@aphrody/http`                | `Bun.serve({ routes, websocket, development })` + HTML imports + `HTMLRewriter`                               | `third_party/bun/docs/bundler/fullstack.mdx`                                         |
| `undici`, `undici-types`, `node-fetch`, `axios`                    | Global `fetch` (BoringSSL TLS 1.3, `Bun.dns.prefetch`, `AbortSignal.timeout`, Unix sockets)                   | Web Standards `fetch`                                                                |
| `@paralleldrive/cuid2`, `uuid`, `nanoid`, `ulid`                   | `Bun.randomUUIDv7()` / `Bun.randomUUIDv7("base64url")` / `crypto.randomUUID()`                                | `third_party/bun/docs/runtime/utils.mdx`                                             |
| `bcrypt`, `argon2`, `xxhash-wasm`                                  | `Bun.password` (`argon2id`/`bcrypt`), `Bun.CryptoHasher`, `Bun.hash.xxHash3` / `wyhash` / `rapidhash`         | `third_party/bun/docs/runtime/hashing.mdx`                                           |
| `glob`, `fast-glob`, `globby`, `minimatch`, `@aphrody/paths`       | `new Bun.Glob(pattern)` + `import.meta.dir` + `node:path`                                                     | `third_party/bun/docs/runtime/glob.mdx`                                              |
| `chalk`, `kleur`, `colorette`, `picocolors`, `pino-pretty`         | `Bun.color(c, "ansi")` + structured JSONL stdout + `Bun.JSONL`                                                | `third_party/bun/docs/runtime/color.mdx`                                             |
| `yaml`, `js-yaml`, `@iarna/toml`, `json5`                          | `Bun.YAML`, `Bun.TOML`, `Bun.JSON5`, `Bun.JSONL`                                                              | Built-in zero-dependency parsers                                                     |
| `esbuild`, `swc`, `tsup`, `pkg`                                    | `new Bun.Transpiler()`, `Bun.build()`, `bun build --compile --bytecode`                                       | `third_party/bun/docs/runtime/transpiler.mdx`, `compiler/bytecode.mdx`               |
| `ffi-napi`, `koffi`, `node-gyp` addons                             | `bun:ffi` (`dlopen`, `FFIType`, `CString`, `ptr`, `toArrayBuffer`)                                            | `third_party/bun/docs/runtime/ffi.mdx`, `packages/ffi-bridge` (`src/dx12-hal.ts`)    |

---

## 4. Native Bun v1.4.4 Code Idioms

### 4.1 Unified SQL (`Bun.SQL` & `bun:sqlite`)

```ts
import { SQL } from "bun";
import { Database } from "bun:sqlite";

// Pooled binary-protocol Postgres / MySQL / SQLite driver
const pg = new SQL({ url: Bun.env.DATABASE_URL, max: 20, idleTimeout: 30 });
const rows = await pg`SELECT id, slug FROM episodes WHERE season = ${1}`;
await pg.begin(async (tx) => {
  await tx`INSERT INTO audit_logs ${tx({ id: Bun.randomUUIDv7(), action: "sync" })}`;
});

// Embedded synchronous WAL SQLite
using localDb = new Database("cache.sqlite", { create: true, strict: true });
localDb.exec("PRAGMA journal_mode = WAL; PRAGMA synchronous = NORMAL;");
```

### 4.2 Zero-Dependency Cloudflare R2 / S3 (`Bun.S3Client`)

```ts
import { S3Client } from "bun";

const r2 = new S3Client({
  accessKeyId: Bun.env.R2_ACCESS_KEY_ID,
  secretAccessKey: Bun.env.R2_SECRET_ACCESS_KEY,
  bucket: "media-cdn",
  endpoint: `https://${Bun.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

// Synchronous SigV4 presigning (zero network round-trip, replaces aws4fetch)
const signedGetUrl = r2.presign("videos/ep01.mp4", {
  expiresIn: 3600,
  method: "GET",
});

// Direct upload or streaming multipart sink
await r2.write("manifests/index.json", JSON.stringify({ ok: true }), {
  type: "application/json",
});
```

### 4.3 Zero-Dependency SIMD Image Pipeline (`Bun.Image`)

```ts
// Header-only metadata read without pixel decoding (replaces sharp/image-size)
const img = Bun.file("hero.png").image();
const { width, height, format } = await img.metadata();

// SIMD Lanczos3 resize + WebP encode + ThumbHash LQIP placeholder
const placeholderDataUrl = await img.placeholder();
await img
  .resize(1280, 720, { fit: "inside", withoutEnlargement: true })
  .webp({ quality: 82 })
  .write("hero.webp");
```

### 4.4 Fullstack `Bun.serve` Routes + AOT Bytecode Compilation

```ts
import homepage from "./index.html";

Bun.serve({
  port: 3000,
  routes: {
    "/": homepage,
    "/api/health": Response.json({ status: "ok", bun: Bun.version }),
    "/api/items/:id": {
      GET: (req) =>
        Response.json({
          id: req.params.id,
          traceId: Bun.randomUUIDv7("base64url"),
        }),
    },
  },
});
```

Compile into a standalone single-file native executable with pre-compiled JSC bytecode:

```powershell
bun build --compile --minify --bytecode --sourcemap ./src/server.ts --outfile C:/Users/aphro/.local/bin/my-service.exe
```

---

## 5. Verification Checklist Before Completing Any Task

1. **Zero `bunx` Audit**:
   ```powershell
   rg -n "\bbunx\b" package.json justfile packages apps/rosegriffon -g "!**/submodules/**" -g "!**/node_modules/**"
   ```
   Confirm zero command invocations exist.
2. **Manifest Purity**:
   Verify `package.json` contains `"dependencies": {}, "devDependencies": {}` (unless a justified frontend framework or peer protocol library is strictly required by an app).
3. **Native Toolchain Gate**:
   ```powershell
   bun fmt --check
   bun check
   bun test
   ```
   All three commands must exit `0`.
