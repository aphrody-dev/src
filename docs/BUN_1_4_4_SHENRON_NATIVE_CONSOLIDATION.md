# Bun v1.4.4 Native Consolidation & Comparative Architecture Report

**Scope**: Comparative audit of local Bun v1.4.4 Full-Rust capabilities ([`C:\src\third_party\bun\docs`](file:///C:/src/third_party/bun/docs)), [`packages/bun-plugins`](file:///C:/src/packages/bun-plugins), [`packages/bun-parity`](file:///C:/src/packages/bun-parity), [`packages/chromium-bun`](file:///C:/src/packages/chromium-bun), and [`infra/ffi-bridge`](file:///C:/src/infra/ffi-bridge) against legacy and fragile npm dependencies historically carried in [`apps/shenron/package.json`](file:///C:/src/apps/shenron/package.json) and [`apps/rosegriffon/package.json`](file:///C:/src/apps/rosegriffon/package.json).

---

## 1. Executive Summary

Historically, `apps/shenron` and `apps/rosegriffon` accumulated fragile third-party and transitional wrapper dependencies (`postgres`, `pg`, `aws4fetch`, `sharp`, `modern-gif`, `@paralleldrive/cuid2`, `undici`, `undici-types`, `axios`, `pino`, `@aphrody/sql`, `@aphrody/http`, `@aphrody/paths`, `@aphrody/bun-video`, `@aphrody/bun-types`, `turbo`, `@changesets/cli`, and `bunx` script runners). Those packages introduce:

1. **Private Registry & Tarball Fragility**: Scoped `@aphrody/*` shims (`@aphrody/sql`, `@aphrody/http`, `@aphrody/paths`, `@aphrody/bun-video`, `@aphrody/bun-types`) and `bunx` on-demand CLI downloads fail in air-gapped builds, Docker multi-stage layers, or fresh VPS checkouts without registry tokens.
2. **Native Node-API (`node-gyp` / `.node`) ABI Drift**: `sharp` (`libvips` C++ prebuilds) and Node native addons complicate `bun build --compile --bytecode` single-binary distribution across Windows 11 (`x64`) and Linux (`x64`).
3. **Redundant JavaScript Glue**: `postgres`, `aws4fetch`, `undici`, `axios`, `pino`, `@paralleldrive/cuid2`, `turbo`, and `@changesets/cli` re-implement in userland JavaScript what Bun v1.4.4 already executes natively in Rust/Zig/C++ inside the runtime binary.

Empirical measurements from [`packages/chromium-bun/REPORT.md`](file:///C:/src/packages/chromium-bun/REPORT.md) confirm the vertical speedup of native Bun v1.4.4 primitives on our reference hardware (Intel Core i7-13700F 16C/24T, 32 GB DDR5-5800, Windows 11 NT):

| Workload | Native Bun v1.4.4 Primitive | Measured Performance | Legacy Baseline |
| --- | --- | --- | --- |
| TypeScript Typechecking | `bun check` (multi-core Rust TS7) | **21–37 ms** per package | `tsc --noEmit` (~1,200–4,500 ms) |
| Bundling + Minification | `Bun.build` (native Rust bundler) | **7.73 ms** | Rollup / Terser / Webpack (500+ ms) |
| TypeScript Transpilation | `Bun.Transpiler` | **100 files in 7.86 ms** (12,722 files/s) | `tsup` / `esbuild` spawn |
| SQLite Batch Writes | `bun:sqlite` (WAL transaction) | **10,000 rows in 4.30 ms** (2.32M rows/s) | `better-sqlite3` / JSON disk cache |
| Non-Crypto Hashing | `Bun.hash` (`wyhash` / `crc32` / `xxHash3`) | **25.73 GB/s** (`crc32` 15.86 GB/s) | JS `cuid2` / `crypto.createHash` |
| Compression | `Bun.zstdCompressSync` | **2,202 MB/s** (3.7x faster than gzip) | npm `fzstd` / `zlib` |
| Subprocess / CLI Startup | `bun` / AOT `--compile --bytecode` | **11.10 ms** cold start (8.16x faster than `pwsh`) | `bunx` / `npx` / `turbo` |

---

## 2. Master Consolidation Matrix (Shenron & RoseGriffon Fragile Dependencies vs. Native Bun v1.4.4)

| Fragile Dependency / Tool | Found In | Failure Mode / Overhead | Native Bun v1.4.4 + `C:\src` Sovereign Replacement | Docs / Package Source |
| --- | --- | --- | --- | --- |
| `postgres`, `pg`, `@types/pg`, `@aphrody/sql` | `shenron`, `rosegriffon` | Duplicate TCP/TLS state machines in JS; private `@aphrody/sql` registry coupling | **`Bun.SQL`** (`import { sql, SQL } from "bun"`): Native binary-protocol Postgres/MySQL/SQLite pooler with tagged-template parameterization, `sql(rows)` bulk insert, `begin()` savepoints, `LISTEN`/`NOTIFY`, and `COPY`. Local embedded state uses **`bun:sqlite`** (`Database` in WAL mode). | [`runtime/sql.mdx`](file:///C:/src/third_party/bun/docs/runtime/sql.mdx), [`runtime/sqlite.mdx`](file:///C:/src/third_party/bun/docs/runtime/sqlite.mdx) |
| `aws4fetch` | `shenron` | Extra JS SigV4 signing wrapper; lacks native streaming multipart sink & `Bun.write` integration | **`Bun.S3Client` / `Bun.s3`**: Built-in Cloudflare R2 / AWS S3 client with zero-network synchronous `presign()`, streaming multipart `writer()`, byte-range `slice()`, and direct `Bun.Image.write(s3File)`. Go control-plane tasks can also call `GoSignR2S3v4AuthHeader` via [`infra/ffi-bridge`](file:///C:/src/infra/ffi-bridge/index.ts). | [`runtime/s3.mdx`](file:///C:/src/third_party/bun/docs/runtime/s3.mdx), [`infra/ffi-bridge`](file:///C:/src/infra/ffi-bridge/index.ts) |
| `sharp` (metadata, resize, WebP/AVIF, LQIP) | `shenron`, `rosegriffon` | Heavy `libvips` C++ `.node` binary; breaks portable single-file `--compile` builds when only dimensions/thumbnails are needed | **`Bun.Image`** / **`Bun.file(p).image()`**: Built into Bun on `libjpeg-turbo` + `libwebp` + Google Highway SIMD. `.metadata()` reads headers without decoding pixels; `.resize()` runs SIMD Lanczos3; `.webp()`/`.avif()`/`.png({ palette: true })` transcode natively; `.placeholder()` emits ThumbHash data URLs. | [`runtime/image.mdx`](file:///C:/src/third_party/bun/docs/runtime/image.mdx) |
| `modern-gif`, `@aphrody/bun-video` | `shenron` | Unmaintained/private npm packages for frame muxing or GIF/video asset pipelines | **WebCodecs / Canvas / WASM + `Bun.Image` + `bun:ffi`**: Animated SVG/WebP/AVIF via `Bun.Image`, deterministic procedural frame pipelines (as in [`packages/google-design`](file:///C:/src/packages/google-design)), or direct C-ABI `bun:ffi` / local `ffmpeg` binary in `~/.local/bin` with zero npm wrappers. | [`runtime/image.mdx`](file:///C:/src/third_party/bun/docs/runtime/image.mdx), [`runtime/ffi.mdx`](file:///C:/src/third_party/bun/docs/runtime/ffi.mdx) |
| `@paralleldrive/cuid2` | `shenron` | Slow userland SHA-3 entropy pooling in JS; non-standard ID format for Postgres `uuid` columns | **`Bun.randomUUIDv7()`** / **`Bun.randomUUIDv7("base64url")`**: Native monotonic RFC 9562 time-ordered UUIDv7 (sub-microsecond C++ generation, B-tree index locality in Postgres/SQLite, 22-char URL-safe `base64url` mode replacing `cuid2` slugs) + **`crypto.randomUUID()`** for v4. | [`runtime/utils.mdx`](file:///C:/src/third_party/bun/docs/runtime/utils.mdx) |
| `undici`, `undici-types`, `axios`, `@aphrody/http` | `shenron`, `rosegriffon` | Node HTTP client polyfills redundant under Bun's native BoringSSL/uSockets stack | **Global `fetch` + `Bun.serve` + `Bun.dns`**: Native HTTP/1.1 & HTTP/2 `fetch` with `AbortSignal.timeout(ms)`, `Bun.dns.prefetch()`, Unix domain sockets (`unix`), TLS 1.3 client certs, and fullstack `Bun.serve({ routes, websocket })` + `HTMLRewriter`. Chromium `PriorityHints` & DoH Type 65 HTTPS RRs available in [`packages/bun-parity`](file:///C:/src/packages/bun-parity). | [`bundler/fullstack.mdx`](file:///C:/src/third_party/bun/docs/bundler/fullstack.mdx), [`packages/bun-parity`](file:///C:/src/packages/bun-parity/PARITY_REPORT.md) |
| `pino`, `pino-pretty` | `shenron` | Worker-thread transport complexity (`thread-stream`) that breaks or bloats `--compile` executables | **Structured JSONL Logger + `Bun.JSONL` + `Bun.color`**: Direct `process.stdout.write(JSON.stringify(entry) + "\n")` in production (~0 overhead, journald/Cloudflare Logpush ready), `Bun.JSONL.parseChunk()` for streaming log ingestion, and `Bun.color(hex, "ansi")` for local dev formatting. | [`runtime/color.mdx`](file:///C:/src/third_party/bun/docs/runtime/color.mdx) |
| `@aphrody/paths`, `glob`, `fast-glob` | `shenron`, `rosegriffon` | Trivial wrapper package over path resolution and file scanning | **`import.meta.dir` + `node:path` + `new Bun.Glob()`**: `import.meta.dir`, `import.meta.path`, `Bun.main`, and `new Bun.Glob("**/*.ts").scan({ cwd })` implemented in native code. | [`runtime/glob.mdx`](file:///C:/src/third_party/bun/docs/runtime/glob.mdx) |
| `@aphrody/bun-types`, `@types/bun`, `@types/node` | `shenron`, `rosegriffon`, `packages/*` | External `@types/*` npm graph (pulling `undici-types`, `@types/ws`, `@types/node`) solely for type-checking | **`bun check` + [`packages/bun-plugins/bun-native.d.ts`](file:///C:/src/packages/bun-plugins/bun-native.d.ts)**: Omit `"types": ["bun"]` in `tsconfig.json` so TS7 `bun check` uses built-in `lib.esnext.d.ts` + zero-dependency sovereign ambient declarations. | [`runtime/check.mdx`](file:///C:/src/third_party/bun/docs/runtime/check.mdx), [`bun-native.d.ts`](file:///C:/src/packages/bun-plugins/bun-native.d.ts) |
| `turbo` (`turbo run ...`) | `rosegriffon` | Extra Go/Rust daemon + `.turbo` cache directory overhead on top of Bun workspaces | **`bun run --filter '*' <script>`** + **`@aphrody/bun-plugins` `TurboCache`**: Native parallel workspace script filtering in Bun, paired with content-addressed `Bun.CryptoHasher("blake2s256")` task memoization (`turbo:cache`) when fine-grained input hashing is needed. | [`packages/bun-plugins/turbo-cache-plugin.ts`](file:///C:/src/packages/bun-plugins/turbo-cache-plugin.ts) |
| `@changesets/cli` | `rosegriffon` | Markdown changeset ceremony + extra CLI dependency chain | **`Bun.semver` + `bun pm pack` + `vcs:meta` plugin**: Direct `Bun.semver.order()` / `satisfies()`, `scripts/publish.ts` (`bun pm pack` resolving `workspace:*` and `catalog:`), and [`packages/bun-plugins/vcs-meta-plugin.ts`](file:///C:/src/packages/bun-plugins/vcs-meta-plugin.ts) (`vcs:meta` Git/Jujutsu revision injection). | [`runtime/semver.mdx`](file:///C:/src/third_party/bun/docs/runtime/semver.mdx), [`vcs-meta-plugin.ts`](file:///C:/src/packages/bun-plugins/vcs-meta-plugin.ts) |
| `bunx` | `rosegriffon`, scripts, docs | Downloads unpinned remote packages on demand; non-deterministic CI & security hazard | **Strict Zero-`bunx` Policy**: Use `bun fmt`, `bun check`, `bun test`, `bun run <workspace-bin>`, `bun <script.ts>`, or pre-compiled binaries in `C:\Users\aphro\.local\bin`. | [`.agents/skills/bun-native-zero-dep/SKILL.md`](file:///C:/src/.agents/skills/bun-native-zero-dep/SKILL.md) |

---

## 3. First-Party Sovereign Capabilities Harvested in `C:\src`

### 3.1 `@aphrody/bun-plugins` ([`C:\src\packages\bun-plugins`](file:///C:/src/packages/bun-plugins/index.ts))

Zero-dependency Bun bundler/runtime plugin suite providing four virtual/loader integrations:

1. **`justPlugin` ([`just-plugin.ts`](file:///C:/src/packages/bun-plugins/just-plugin.ts))**: Parses `justfile` recipes directly in Bun (`loader: "js"`) so TypeScript tools can `import { recipes, runRecipe } from "./justfile"` without shelling out to inspect task graphs.
2. **`TurboCache` & `turboCachePlugin` ([`turbo-cache-plugin.ts`](file:///C:/src/packages/bun-plugins/turbo-cache-plugin.ts))**: Content-addressed task memoization (`import { defaultCache } from "turbo:cache"`) powered by `new Bun.CryptoHasher("blake2s256")` over command strings, sorted env keys, and input file digests — replacing `turbo` without external dependencies.
3. **`vcsMetaPlugin` ([`vcs-meta-plugin.ts`](file:///C:/src/packages/bun-plugins/vcs-meta-plugin.ts))**: Virtual module `vcs:meta` exposing Jujutsu (`jj` change ID) and Git (`commitHash`, `shortHash`, `branch`, `dirty`, `timestamp`) metadata at runtime or `--compile` bundle time.
4. **`decidePlugin` ([`decide-plugin.ts`](file:///C:/src/packages/bun-plugins/decide-plugin.ts))**: Compile-time `.decide` state-machine compiler bridging `sov_core.dll` via `bun:ffi` (`dlopen`, `CString`, `ptr`) with zero runtime overhead.
5. **`bun-native.d.ts` ([`bun-native.d.ts`](file:///C:/src/packages/bun-plugins/bun-native.d.ts))**: Shared zero-dependency ambient type header enabling `"dependencies": {}, "devDependencies": {}` across `packages/bun-plugins`, `packages/brain`, `packages/chromium-bun`, `packages/pi-opencode`, and `infra/ffi-bridge`.

### 3.2 `@aphrody/bun-parity` ([`C:\src\packages\bun-parity`](file:///C:/src/packages/bun-parity/PARITY_REPORT.md))

Zero-dependency Chromium-vs-Bun Web Standards recon & preload engine (`bpt`), elevating Bun v1.4.4 to 100% parity across 10 browser/edge domains without npm packages:

- **Prioritized Task Scheduling**: `globalThis.scheduler.postTask()` & `scheduler.yield()` with `TaskController` priorities (`user-blocking`, `user-visible`, `background`).
- **W3C Web Locks API**: `navigator.locks.request()` supporting `exclusive` and `shared` modes, `ifAvailable`, and `AbortSignal`.
- **W3C CacheStorage Backed by `bun:sqlite`**: `globalThis.caches.open()` persisted in SQLite (`CREATE TABLE cache_entries`), replacing Redis/in-memory response caches for edge SSR.
- **Extended `CompressionStream`**: Adds `"br"` (Brotli via `node:zlib` native binding) alongside Bun's native `"gzip"`, `"deflate"`, `"deflate-raw"`, and `"zstd"`.
- **W3C Trusted Types & RFC 8484 DoH**: `trustedTypes.createPolicy()` and DNS-over-HTTPS Type 65 (`HTTPS` / `SVCB` ALPN HTTP/3 h3 discovery).

---

## 4. Exact Native Bun v1.4.4 Migration Idioms for Shenron & RoseGriffon

### 4.1 Replacing `postgres`, `pg`, and `@aphrody/sql` With `Bun.SQL`

```ts
// BEFORE (fragile):
// import postgres from "postgres";
// import { createPool } from "@aphrody/sql";

// AFTER (Pure Bun v1.4.4):
import { SQL } from "bun";

export const db = new SQL({
  url: Bun.env.DATABASE_URL,
  max: 20,
  idleTimeout: 30,
  connectionTimeout: 5,
  bigint: false,
});

// Parameterized query (SQL-injection safe via binary protocol)
export async function getFighterBySlug(slug: string) {
  const [fighter] = await db`
    SELECT id, slug, name_fr, power_level
    FROM fighters
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return fighter ?? null;
}

// Bulk array insert + atomic transaction
export async function insertEpisodes(episodes: Array<{ id: string; number: number; title: string }>) {
  return db.begin(async (tx) => {
    return tx`INSERT INTO episodes ${tx(episodes, "id", "number", "title")} RETURNING id`;
  });
}
```

### 4.2 Replacing `aws4fetch` With `Bun.S3Client` (Cloudflare R2 & S3)

```ts
// BEFORE (fragile):
// import { AwsClient } from "aws4fetch";

// AFTER (Pure Bun v1.4.4):
import { S3Client } from "bun";

export const r2 = new S3Client({
  accessKeyId: Bun.env.R2_ACCESS_KEY_ID,
  secretAccessKey: Bun.env.R2_SECRET_ACCESS_KEY,
  bucket: Bun.env.R2_BUCKET ?? "shenron-media",
  endpoint: `https://${Bun.env.CF_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  region: "auto",
});

// Zero-network synchronous SigV4 presigned URL (GET or PUT)
export function presignStreamSegment(key: string, expiresIn = 3600): string {
  return r2.presign(key, {
    method: "GET",
    expiresIn,
    type: "video/mp2t",
  });
}

// High-throughput multipart upload via FileSink
export async function uploadArchiveStream(key: string, chunks: AsyncIterable<Uint8Array>) {
  const writer = r2.file(key).writer({ type: "application/zstd", partSize: 8 * 1024 * 1024, retry: 3 });
  for await (const chunk of chunks) {
    writer.write(chunk);
  }
  await writer.end();
}
```

### 4.3 Replacing `sharp` Metadata, Thumbnails & LQIP With `Bun.Image`

```ts
// BEFORE (fragile C++ node-gyp addon):
// import sharp from "sharp";
// const meta = await sharp(buf).metadata();

// AFTER (Pure Bun v1.4.4 built-in Highway SIMD + libwebp + libjpeg-turbo):
export async function inspectAndOptimizeCardArt(sourcePath: string, destKey: string) {
  const img = Bun.file(sourcePath).image({ autoOrient: true });

  // Header-only zero-decode metadata extraction (~microseconds)
  const { width, height, format } = await img.metadata();

  // Generate compact ThumbHash data URL for instant zero-CLS LQIP blur
  const blurDataURL = await img.placeholder();

  // Resize + WebP encode directly to disk or S3File
  await img
    .resize(800, 800, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .write(destKey);

  return { width, height, format, blurDataURL };
}
```

### 4.4 Replacing `@paralleldrive/cuid2` With `Bun.randomUUIDv7`

```ts
// BEFORE:
// import { createId } from "@paralleldrive/cuid2";
// const id = createId();

// AFTER (Pure Bun v1.4.4 monotonic RFC 9562 UUIDv7):
// 1. Standard 36-char hex UUIDv7 for Postgres `uuid` primary keys (B-tree sequential locality):
export const newEntityId = (): string => Bun.randomUUIDv7();

// 2. Compact 22-char URL-safe base64url UUIDv7 for public short IDs (drop-in cuid2 replacement):
export const newPublicSlugId = (): string => Bun.randomUUIDv7("base64url");
```

### 4.5 Replacing `undici`, `axios`, and `@aphrody/http` With Native `fetch` + `Bun.serve`

```ts
// Pre-warm DNS cache on service boot
Bun.dns.prefetch("api.dragonballfr.com", 443);

export async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 5_000): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json() as Promise<T>;
}
```

### 4.6 Replacing `pino` With Zero-Dependency Structured JSONL + `Bun.color`

```ts
const IS_PROD = Bun.env.NODE_ENV === "production";

export function log(level: "info" | "warn" | "error", msg: string, fields: Record<string, unknown> = {}): void {
  if (IS_PROD) {
    process.stdout.write(`${JSON.stringify({ ts: Date.now(), level, msg, ...fields })}\n`);
    return;
  }
  const badgeColor = level === "error" ? "#ef4444" : level === "warn" ? "#f59e0b" : "#22c55e";
  const ansi = Bun.color(badgeColor, "ansi") ?? "";
  process.stdout.write(`${ansi}[${level.toUpperCase()}]\x1b[0m ${msg} ${Object.keys(fields).length ? JSON.stringify(fields) : ""}\n`);
}
```

### 4.7 Replacing `tar` / External Archive Helpers With `Bun.Archive` + `Bun.zstdCompressSync`

```ts
// Build deterministic tar.gz release bundle in memory or extract safely with path-traversal protection
const releaseArchive = new Bun.Archive(
  {
    "manifest.json": JSON.stringify({ version: "1.4.4", builtAt: new Date().toISOString() }),
    "server.js": await Bun.file("dist/server.js").bytes(),
  },
  { compress: "gzip", level: 9 },
);

await Bun.write("dist/release.tar.gz", releaseArchive);

// Safe extraction with built-in openat2 symlink/traversal containment and glob filter
const count = await releaseArchive.extract("dist/unpacked", { glob: "**/*.json" });
```

### 4.8 Replacing `turbo`, `@changesets/cli`, and `bunx`

```json
{
  "scripts": {
    "build": "bun run --filter '*' build",
    "dev": "bun run --filter '*' dev",
    "typecheck": "bun run --filter '*' typecheck",
    "lint": "bun run --filter '*' lint",
    "test": "bun run --filter '*' test",
    "fmt": "bun fmt",
    "check": "bun check",
    "compile": "bun build --compile --minify --bytecode src/server.ts --outfile dist/server.exe"
  }
}
```

---

## 5. First-Party Zero-Dependency Audit Summary (`C:\src`)

The following `C:\src` units now enforce `"dependencies": {}, "devDependencies": {}` and pass `bun check` + `bun test` with zero `@types/bun` or `bunx` dependencies:

- [`C:\src\package.json`](file:///C:/src/package.json) (monorepo root)
- [`C:\src\packages\bun-plugins\package.json`](file:///C:/src/packages/bun-plugins/package.json) + canonical [`bun-native.d.ts`](file:///C:/src/packages/bun-plugins/bun-native.d.ts)
- [`C:\src\packages\bun-parity\package.json`](file:///C:/src/packages/bun-parity/package.json)
- [`C:\src\packages\brain\package.json`](file:///C:/src/packages/brain/package.json)
- [`C:\src\packages\chromium-bun\package.json`](file:///C:/src/packages/chromium-bun/package.json)
- [`C:\src\packages\pi-opencode\package.json`](file:///C:/src/packages/pi-opencode/package.json)
- [`C:\src\infra\ffi-bridge\package.json`](file:///C:/src/infra/ffi-bridge/package.json)
- [`C:\src\packages\wck\package.json`](file:///C:/src/packages/wck/package.json) and [`C:\src\apps\aphrody\package.json`](file:///C:/src/apps/aphrody/package.json) (already zero-dep)

In [`C:\src\apps\rosegriffon`](file:///C:/src/apps/rosegriffon/package.json), all `bunx` invocations, `turbo` / `@changesets/cli` dependencies and scripts, legacy `aphrody-labs/rosegriffon` repository URLs, and `bun-os` remnants have been purged in favor of native `bun run --filter '*' <task>` and `https://github.com/aphrody-dev/rosegriffon.git`.
