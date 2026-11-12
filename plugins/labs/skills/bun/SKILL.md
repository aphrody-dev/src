---
name: bun
description: Bun 1.4.4 reference (CLI, runtime APIs, bundler, test runner, package manager, SQL/SQLite/Redis/S3, shell, FFI, HTTP/WebSocket, Node compat, bunfig) condensed from the full upstream oven-sh/bun docs. Use BEFORE choosing any JS/TS tool or writing any script, test, format, typecheck, bundle, binary, FFI, SQL, shell or HTTP code; triggers "bun", "node", "npm", "npx", "tsc", "prettier", "biome", "eslint", "vite", "vitest", "jest", "esbuild", "webpack", "package.json", "bunfig", "Bun.serve", "bun:sqlite", "bun test", "bun build --compile". Bun replaces node, npm/pnpm/yarn, npx, tsc, prettier, biome, oxlint, eslint, vite, vitest, jest, esbuild.
---

# bun

Rule: if Bun does it, use no third-party tool. Never use node/npm/npx/tsc/prettier/biome/eslint/vite/vitest/jest/esbuild. Check this file, then `references/<area>.md`, then the full doc.

- Installed: `bun 1.4.4+38afee6c8` (`bun --revision`, checked 2026-11-12).
- Docs: oven-sh/bun `7f964e69651c` (2026-11-11), `C:/src/third_party/browsers/oven-sh_bun/docs/` (`docs.json` = nav). Online: `https://bun.com/docs/<path-without-ext>`.
- Docs can be ahead of the installed binary. Check `bun <cmd> --help` before using a flag. Example: `bun lint` is documented (`docs/lint/`) but 1.4.4 prints `Script not found "lint"`.

## Task -> Bun

| Task | Bun | Not |
|-|-|-|
| run TS/JS/JSX file | `bun file.ts`, `bun run file.ts` | node, ts-node, tsx |
| package.json script | `bun run dev`, `bun --filter 'pkg*' dev`, `--workspaces`, `--parallel` | npm run, turbo (for simple cases) |
| watch / hot reload | `bun --watch x.ts`, `bun --hot x.ts` | nodemon |
| typecheck | `bun check` (`-b` project refs, `-p tsconfig`, `--no-pretty`) | tsc, tsgo |
| format | `bun fmt`, `--check`, `--staged`, `--changed=main`, `--init` | prettier, biome |
| lint | `bun lint` only if `bun lint --help` works (not in 1.4.4) | eslint, oxlint |
| test | `bun test` (`--coverage`, `-t re`, `--parallel=N`, `--shard=1/3`, `-u`) | jest, vitest |
| install deps | `bun install` / `bun i`, `--frozen-lockfile` (CI) | npm/pnpm/yarn |
| add/remove | `bun add [-d] pkg`, `bun remove pkg`, `bun update [-i]` | npm i |
| run a package bin | `bunx pkg` / `bun x pkg` | npx |
| audit / why / outdated | `bun audit`, `bun why pkg`, `bun outdated` | npm audit |
| patch a dep | `bun patch pkg` then `bun patch --commit node_modules/pkg` | patch-package |
| publish | `bun publish` (`bun pm pack` for a tarball) | npm publish |
| bundle | `bun build ./a.ts --outdir dist --target browser\|bun\|node --minify --sourcemap=linked --splitting` | esbuild, webpack, rollup |
| dev server / SPA / fullstack | `bun ./index.html`; `Bun.serve({ routes: { "/": html } })` | vite |
| single binary | `bun build --compile [--bytecode] [--target=bun-linux-x64] app.ts --outfile app` | pkg, nexe |
| new project | `bun init`, `bun create <tpl\|github-repo>` | create-* via npx |
| shell script | `` Bun.$`cmd ${arg}` ``, `bun exec "cmd"` | bash/pwsh helper scripts |
| subprocess | `Bun.spawn([...], { stdout: "pipe" })`, `Bun.spawnSync` | child_process |
| files | `Bun.file(p).text()/json()/bytes()/stream()`, `Bun.write(p, data)` | fs.readFile |
| glob | `new Bun.Glob("**/*.ts").scan(".")` | fast-glob, globby |
| HTTP server | `Bun.serve({ port, routes, fetch, websocket })` | express, ws |
| HTTP client | `fetch` (proxy, unix sockets, `tls`) | axios, node-fetch |
| Postgres/MySQL/SQLite | `` import { sql, SQL } from "bun"; await sql`select ${x}` `` | pg, mysql2, postgres |
| embedded SQLite | `import { Database } from "bun:sqlite"` | better-sqlite3 |
| Redis/Valkey | `import { redis, RedisClient } from "bun"` | ioredis |
| S3/R2/MinIO | `import { s3, S3Client } from "bun"; s3.file("k").text()` | aws-sdk |
| hashing / passwords | `Bun.hash`, `new Bun.CryptoHasher("sha256")`, `Bun.password.hash/verify` | bcrypt, xxhash libs |
| YAML/TOML/JSON5/JSONL/XML/MD | `import x from "./a.yaml"`, `Bun.YAML.parse`, `Bun.TOML.parse`, `Bun.JSON5`, `Bun.JSONL`, `Bun.XML`, `Bun.markdown` | js-yaml, toml, marked |
| env / .env | auto-loaded; `Bun.env.X`, `--env-file=.env.x` | dotenv |
| compression / archives | `Bun.gzipSync`, `Bun.zstdCompress`, `Bun.Archive` | zlib wrappers, tar |
| semver | `Bun.semver.satisfies(v, range)`, `.order` | semver |
| C / native | `bun:ffi` `dlopen`, `cc` (TinyCC), Node-API `.node` | ffi-napi |
| HTML transform | `new HTMLRewriter().on(sel, h).transform(res)` | cheerio (streaming cases) |
| cron | `Bun.cron(...)` (`docs/runtime/cron.mdx`) | node-cron |
| secrets (OS keychain) | `Bun.secrets.get/set({ service, name })` | keytar |
| image ops | `Bun.Image` (see runtime-apis.md) | sharp (verify parity) |
| headless browser | `Bun.WebView` (see runtime-apis.md) | puppeteer (verify parity) |
| debug | `bun --inspect[-brk\|-wait] x.ts` -> debug.bun.sh | node --inspect |
| REPL | `bun repl` | node |
| upgrade | `bun upgrade [--canary]` | |

## CLI summary (full flags: references/cli.md, bundler.md, test.md, pm.md)

- Global: `--watch`, `--hot`, `--smol`, `-r/--preload`, `--env-file`, `--cwd`, `-b/--bun` (force bun over node shebang), `--silent`, `--elide-lines`, `-F/--filter`, `--workspaces`, `--parallel`, `--sequential`, `--shell=bun|system`, `--no-orphans`, `--inspect*`, `--define`, `--loader .ext:loader`, `--tsconfig-override`, `--conditions`, `--install=auto|fallback|force`, `-i` (auto-install).
- `bun build`: `--outdir/--outfile`, `--target`, `--format esm|cjs|iife`, `--splitting`, `--minify[-syntax|-whitespace|-identifiers]`, `--sourcemap`, `-e/--external`, `--packages external`, `--define`, `--env inline|PREFIX_*`, `--entry/chunk/asset-naming`, `--public-path`, `--metafile[-md]`, `--banner/--footer`, `--production`, `--no-bundle`, `--react-fast-refresh`, `--react-compiler`, `--compile` (+ `--bytecode`, `--asset`, `--compile-exec-argv`, `--compile-autoload-*`, `--target=bun-<os>-<arch>[-musl]`), `--watch`.
- `bun test`: `--timeout` (5000ms), `-u`, `--rerun-each`, `--retry`, `--todo`, `--only`, `--concurrent`, `--max-concurrency`, `--randomize --seed`, `--coverage --coverage-reporter=text|lcov --coverage-dir`, `--bail`, `-t`, `--reporter=junit|dots --reporter-outfile`, `--only-failures`, `--changed`, `--isolate`, `--parallel=N`, `--shard=i/n`, `--timings`, `--preload`, `--pass-with-no-tests`.
- `bun install`: `--frozen-lockfile`, `--production`, `--linker isolated|hoisted`, `--omit dev|optional|peer`, `--filter`, `-g`, `--dry-run`, `--force`, `--no-save`, `--trust`, `--concurrent-scripts`, `--minimum-release-age`, `--cpu/--os`. Lockfile `bun.lock` (text). Lifecycle scripts blocked unless `trustedDependencies`.
- `bun pm` (1.4.4 help): `bin`, `cache`, `default-trusted`, `diff`, `fetch`, `hash[-print|-string]`, `licenses`, `ls`, `migrate`, `pack`, `pkg`, `scan`, `trust`, `untrusted`, `version`, `view`, `whoami`, `why`.
- `bun fmt`: `-c/--check`, `--staged`, `--changed`, `--stdin-filepath`, `--print-width` (80), `--use-tabs`, `--no-semi`, `--single-quote`, `--init`, `--doctor`, `--no-script`. Config `[fmt]` in bunfig.toml.
- `bun check`: `-p/--project`, `-b/--build`, `--pretty/--no-pretty`, `--all`, `--threads`, `--timing`, `--cwd`, `--no-script`, any tsc option (`--strict`, `--target=`).

## Runtime APIs index (detail: references/runtime-apis.md unless noted)

| Area | APIs |
|-|-|
| Module `bun` | `$`, `Archive`, `ArrayBufferSink`, `CSRF`, `Cookie`, `CookieMap`, `CryptoHasher`, `FileSystemRouter`, `Glob`, `Image`, `JSON5`, `JSONC`, `JSONL`, `ModuleGraph`, `RedisClient`, `S3Client`, `SQL`, `TOML`, `Terminal`, `Transpiler`, `WebView`, `XML`, `YAML`, `build`, `color`, `connect`, `cron`, `deepEquals`, `dns`, `embeddedFiles`, `env`, `escapeHTML`, `file`, `gzipSync`, `hash`, `inspect`, `listen`, `markdown`, `nanoseconds`, `password`, `peek`, `plugin`, `randomUUIDv7`, `resolveSync`, `secrets`, `semver`, `serve`, `sleep`, `spawn`, `stringWidth`, `stripANSI`, `udpSocket`, `which`, `wrapAnsi`, `write`, `zstdCompress[Sync]`, `readableStreamTo*` |
| HTTP (http-websocket.md) | `Bun.serve` routes/params/static, `server.reload/stop/upgrade/publish/requestIP/timeout`, TLS, cookies (`req.cookies`), metrics, error handling; `fetch`; `Bun.connect/listen` (TCP), `Bun.udpSocket`, `Bun.dns` |
| Data (sql-db.md) | `Bun.SQL`/`sql` (postgres, mysql, mariadb, sqlite adapters; tx, `sql.json/array`, `.values/.raw`), `bun:sqlite` (`Database`, `query/prepare/run/all/get/iterate`, WAL, `serialize`), `Bun.redis`, `Bun.s3` (`presign`, `write`, `list`) |
| Process (shell-ffi.md) | `Bun.$` (pipes, redirects, `.text/.json/.lines/.quiet/.nothrow/.env/.cwd`), `Bun.spawn/spawnSync` (`ipc`, `terminal` PTY), `bun:ffi` (`dlopen`, `FFIType`, `ptr`, `CString`, `JSCallback`, `cc`), Node-API |
| Test (test.md) | `bun:test`: `test/it/describe` (`.each/.only/.skip/.todo/.concurrent/.serial/.failing/.if`), lifecycle hooks, `expect` (jest + `toMatchSnapshot`, `toMatchInlineSnapshot`, `expectTypeOf`), `mock`, `spyOn`, `mock.module`, `jest.useFakeTimers`, `setSystemTime`, happy-dom preload, coverage thresholds |
| Bundler (bundler.md) | `Bun.build({ entrypoints, outdir, target, format, splitting, plugins, minify, sourcemap, external, define, env, naming, compile })`, loaders, plugins (`onResolve/onLoad`), macros (`with { type: "macro" }`), CSS, HTML entrypoints, fullstack, HMR, standalone HTML, executables |
| Other modules | `bun:sqlite`, `bun:ffi`, `bun:test`, `bun:jsc` (heap/GC/profiler), `bun:wrap` |
| Globals / Web | `fetch`, `Request/Response/Headers`, `WebSocket`, `Worker`, streams, `URLPattern`, `crypto.subtle`, `BroadcastChannel`, `HTMLRewriter`, `navigator`, `performance` ... (runtime-apis.md "Web APIs") |
| Node compat (node-compat.md) | per-module status table for `node:*` builtins and globals |
| Config (config-bunfig.md) | `bunfig.toml`: `preload`, `jsx*`, `smol`, `logLevel`, `define`, `loader`, `telemetry`, `[env]`, `[serve.static]`, `[test]`, `[install]` (registry, scopes, linker, cache, `minimumReleaseAge`, security scanner), `[run]` (`shell`, `bun`), `[fmt]` |

## Gotchas

- `bun run <script>` runs package.json scripts through Bun's shell; `--bun` forces Bun runtime for `#!/usr/bin/env node` bins.
- `.env`, `.env.<NODE_ENV>`, `.env.local` load automatically; disable with `--no-env-file` (check `--help`).
- `bun test` is not Jest: no `jest.config`; config lives in `bunfig.toml [test]`; `--isolate` for per-file globals.
- `bun build --compile` embeds the runtime; cross-compile with `--target=bun-<os>-<arch>`; extra files with `--asset` or `import x from "./f" with { type: "file" }`.
- `bun install` linker: new projects (`configVersion = 1`) use isolated in workspaces, hoisted otherwise (`docs/pm/isolated-installs.mdx`). Commit `bun.lock`.
- Windows: `Bun.$` is cross-platform (builtins `ls`, `rm`, `cp`, `mv`, `cat`, `which`...); no PowerShell needed.

## References (load on demand; every section header names its `docs/<path>`)

| File | Covers |
|-|-|
| references/cli.md | install, quickstart, `bun run`, watch, debugger, repl, init/create, check, fmt, lint, TypeScript, auto-install |
| references/runtime-apis.md | 35 runtime docs: Bun APIs, globals, web APIs, file I/O, binary, streams, hashing, glob, semver, utils, workers, transpiler, plugins, archive, cron, CSRF, secrets, image, markdown, YAML/TOML/JSON5/JSONL/XML, WebView, env, module resolution, JSX, FS router |
| references/bundler.md | `docs/bundler/*` and `docs/compiler/*` (executables, bytecode, AOT, size, troubleshooting) |
| references/test.md | `docs/test/*` |
| references/pm.md | `docs/pm/*`, `docs/pm/cli/*` (install, add, audit, patch, publish, workspaces, catalogs, overrides, lockfile, npmrc, scanner API) |
| references/sql-db.md | `Bun.SQL`, `bun:sqlite`, Redis, S3 |
| references/shell-ffi.md | shell, child-process, FFI, C compiler, Node-API |
| references/http-websocket.md | `docs/runtime/http/*`, `docs/runtime/networking/*`, cookies |
| references/node-compat.md | Node.js compatibility status |
| references/config-bunfig.md | every bunfig.toml key |
| references/guides-index.md | one-liner index of 195 guides + project docs + `bun lint` rule names by plugin |
| references/LICENSE-bun.md | upstream Bun license (MIT + LGPL notices); docs adapted from oven-sh/bun |

Compression used: first sentence per section, 1 code block of 5 lines or fewer per section, tables cut at 10 rows, lists at 6 items, deep subsections listed by name only. Open the source doc whenever an exact detail matters.

Regenerate (scripts outside the repo, `%TEMP%/bunskill/{gen,post,idx}.ts`): `git -C C:/src/third_party/browsers/oven-sh_bun pull`, then rerun them and update the commit in this file.
