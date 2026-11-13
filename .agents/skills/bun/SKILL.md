---
name: bun
description: bun 1.4.4 reference (CLI, runtime API, upstream docs). Use BEFORE any choice of JS/TS tool, script, test, format, typecheck, bundling, FFI, SQL, shell, HTTP: bun replaces node, npm, tsc, prettier, biome, oxlint, eslint, vite, vitest, jest, esbuild.
---

# bun 1.4.4

Rule: if bun does it, no third-party tool. Check below first, then the upstream docs.
Indexed bun docs (md/mdx fork, bun.com llms-full.txt, bun skills): `ay docs bun <words> [--json] [-n N]`, page: `ay docs show <path>`, refresh: `ay docs sync`.

## Equivalents

- typecheck: `bun check -b` (not tsc/tsgo) · format: `bun fmt`, `--check`, `--staged` (not prettier/biome)
- tests: `bun test` (not vitest/jest) · bundle/compile: `bun build`, `--compile` (not vite/esbuild)
- scripts: `Bun.$`, `Bun.spawn`, `fetch`, `Bun.Glob`, `Bun.file/write` (not node/python/pwsh)
- native: `bun:ffi` (dlopen, cc) · data: `bun:sqlite`, `Bun.SQL`, `Bun.redis`, `Bun.s3`
- lint: `bun lint` (and `bun compile`) present in canary 1.4.5-canary.1+9ea3c693a, absent from 1.4.4 (observed 2026-11-13, `bpt compare`)

## Windows (2026-11-13)

- `bun upgrade` 1.4.4/canary: extraction by `powershell Expand-Archive` whose exit code is ignored; launched from pwsh 7 (inherited PSModulePath), Windows PowerShell loads pwsh 7's Archive 1.2.7 → `MethodCountCouldNotFindBest` then `Failed to verify Bun (code: ENOENT)`. Workaround: `PSModulePath= bun upgrade --canary`, or `ay rt install bun@canary` (verified by the GitHub digest). Fixed in aphrody-labs/bun (native zip, API digest for the canary).
- The `SHASUMS256.txt` of the `canary` release can lag behind republished archives: check the sha256 `digest` from the GitHub API.
- Compare the binaries: `just bun-compare`; documented results of llms-full.txt: `just bun-docs name=<bun.exe>`.

## Commands

- `bun run`: ./my-script.ts Execute a file with Bun
- `bun test`: Run unit tests with Bun
- `bun check`: Type check a TypeScript project
- `bun fmt`: Format JavaScript and TypeScript, like Prettier
- `bun x`: bun-repl Execute a package binary (CLI), installing if needed (bunx)
- `bun repl`: Start a REPL session with Bun
- `bun exec`: Run a shell script directly with Bun
- `bun install`: Install dependencies for a package.json (bun i)
- `bun add`: react Add a dependency to package.json (bun a)
- `bun remove`: is-array Remove a dependency from package.json (bun rm)
- `bun update`: lyra Update outdated dependencies
- `bun audit`: Check installed packages for vulnerabilities
- `bun dedupe`: Remove duplicate versions from the lockfile
- `bun prune`: Remove packages that are not in the lockfile from node_modules
- `bun outdated`: Display latest versions of outdated dependencies
- `bun link`: [<package>] Register or link a local npm package
- `bun unlink`: Unregister a local npm package
- `bun publish`: Publish a package to the npm registry
- `bun info`: @remix-run/dev Display package metadata from the registry
- `bun why`: @evan/duckdb Explain why a package is installed
- `bun build`: ./a.ts ./b.jsx Bundle TypeScript & JavaScript into a single file
- `bun init`: Start an empty Bun project from a built-in template
- `bun create`: next-app Create a new project from a template (bun c)
- `bun upgrade`: Upgrade to latest version of Bun.

## Runtime modules

- `bun`: $, Archive, ArrayBufferSink, CSRF, Cookie, CookieMap, CryptoHasher, FFI, FetchSession, FileSystemRouter, Glob, Image, JSON5, JSONC, JSONL, MD4, MD5, ModuleGraph, RedisClient, S3Client, SHA1, SHA224, SHA256, SHA384, SHA512, SHA512_256, SQL, TOML, Terminal, Transpiler, WebView, XML, YAML, allocUnsafe, argv, build, color, concatArrayBuffers, connect, cron, cwd, deepEquals, deepMatch, deflateSync, dns, embeddedFiles, enableANSIColors, env, escapeHTML, fetch, file, fileURLToPath, gc, generateHeapSnapshot, gunzipSync, gzipSync, hash, indexOfLine, inflateSync, inspect
- `bun:sqlite`: Database, SQLiteError, Statement, constants
- `bun:ffi`: CFunction, CString, FFIType, JSCallback, cc, dlopen, linkSymbols, native, ptr, read, suffix, toArrayBuffer, toBuffer, viewSource
- `bun:test`: afterAll, afterEach, beforeAll, beforeEach, describe, expect, expectTypeOf, it, jest, mock, onTestFinished, setDefaultTimeout, setSystemTime, spyOn, test, vi, xdescribe, xit, xtest
- `bun:jsc`: bytecodeOrderStats, callerSourceOrigin, codeCoverageForFile, describe, describeArray, deserialize, drainMicrotasks, edenGC, estimateShallowMemoryUsageOf, fullGC, gcAndSweep, generateHeapSnapshotForDebugging, getProtectedObjects, getRandomSeed, heapSize, heapStats, isRope, jscDescribe, jscDescribeArray, memoryUsage, noFTL, noInline, noOSRExitFuzzing, numberOfDFGCompiles, optimizeNextInvocation, percentAvailableMemoryInUse, profile, releaseWeakRefs, reoptimizationRetryCount, samplingProfilerStackTraces, serialize, setRandomSeed, setTimeZone, setTimezone, startRemoteDebugger, startSamplingProfiler, totalCompileTime
- `bun:wrap`: $$typeof

## Sources

- Upstream docs: C:Usersaphro
  tendorundocs (`just vendor-bun` to update)
- Generated index: C:Usersaphro
  tdocsun{runtime,cli,docs}.md
- What's new: https://bun.com/blog
