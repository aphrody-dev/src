---
name: bun
description: Référence bun 1.4.4 (CLI, API runtime, docs upstream). Utiliser AVANT tout choix d outil JS/TS, script, test, format, typecheck, bundling, FFI, SQL, shell, HTTP : bun remplace node, npm, tsc, prettier, biome, oxlint, eslint, vite, vitest, jest, esbuild.
---

# bun 1.4.4

Règle : si bun le fait, aucun outil tiers. Vérifier d abord ci-dessous, puis la doc upstream.
Doc bun indexée (fork md/mdx, bun.com llms-full.txt, skills bun) : `ay docs bun <mots> [--json] [-n N]`, page : `ay docs show <chemin>`, rafraîchir : `ay docs sync`.

## Équivalences
- typecheck : `bun check -b` (pas tsc/tsgo) · format : `bun fmt`, `--check`, `--staged` (pas prettier/biome)
- tests : `bun test` (pas vitest/jest) · bundle/compile : `bun build`, `--compile` (pas vite/esbuild)
- scripts : `Bun.$`, `Bun.spawn`, `fetch`, `Bun.Glob`, `Bun.file/write` (pas node/python/pwsh)
- natif : `bun:ffi` (dlopen, cc) · données : `bun:sqlite`, `Bun.SQL`, `Bun.redis`, `Bun.s3`
- lint : `bun lint` (et `bun compile`) présents dans la canary 1.4.5-canary.1+9ea3c693a, absents de 1.4.4 (relevé 2026-11-13, `bpt compare`)

## Windows (2026-11-13)
- `bun upgrade` 1.4.4/canary : extraction par `powershell Expand-Archive` dont le code de sortie est ignoré ; lancé depuis pwsh 7 (PSModulePath hérité), Windows PowerShell charge l'Archive 1.2.7 de pwsh 7 → `MethodCountCouldNotFindBest` puis `Failed to verify Bun (code: ENOENT)`. Contournement : `PSModulePath= bun upgrade --canary`, ou `ay rt install bun@canary` (vérifié par le digest GitHub). Corrigé dans aphrody-labs/bun (zip natif, digest API pour la canary).
- Le `SHASUMS256.txt` de la release `canary` peut retarder sur les archives republiées : vérifier le `digest` sha256 de l'API GitHub.
- Comparer les binaires : `just bun-compare` ; résultats documentés de llms-full.txt : `just bun-docs name=<bun.exe>`.

## Commandes
- `bun run` : ./my-script.ts       Execute a file with Bun
- `bun test` : Run unit tests with Bun
- `bun check` : Type check a TypeScript project
- `bun fmt` : Format JavaScript and TypeScript, like Prettier
- `bun x` : bun-repl             Execute a package binary (CLI), installing if needed (bunx)
- `bun repl` : Start a REPL session with Bun
- `bun exec` : Run a shell script directly with Bun
- `bun install` : Install dependencies for a package.json (bun i)
- `bun add` : react                Add a dependency to package.json (bun a)
- `bun remove` : is-array             Remove a dependency from package.json (bun rm)
- `bun update` : lyra                 Update outdated dependencies
- `bun audit` : Check installed packages for vulnerabilities
- `bun dedupe` : Remove duplicate versions from the lockfile
- `bun prune` : Remove packages that are not in the lockfile from node_modules
- `bun outdated` : Display latest versions of outdated dependencies
- `bun link` : [<package>]          Register or link a local npm package
- `bun unlink` : Unregister a local npm package
- `bun publish` : Publish a package to the npm registry
- `bun info` : @remix-run/dev       Display package metadata from the registry
- `bun why` : @evan/duckdb         Explain why a package is installed
- `bun build` : ./a.ts ./b.jsx       Bundle TypeScript & JavaScript into a single file
- `bun init` : Start an empty Bun project from a built-in template
- `bun create` : next-app             Create a new project from a template (bun c)
- `bun upgrade` : Upgrade to latest version of Bun.

## Modules runtime
- `bun` : $, Archive, ArrayBufferSink, CSRF, Cookie, CookieMap, CryptoHasher, FFI, FetchSession, FileSystemRouter, Glob, Image, JSON5, JSONC, JSONL, MD4, MD5, ModuleGraph, RedisClient, S3Client, SHA1, SHA224, SHA256, SHA384, SHA512, SHA512_256, SQL, TOML, Terminal, Transpiler, WebView, XML, YAML, allocUnsafe, argv, build, color, concatArrayBuffers, connect, cron, cwd, deepEquals, deepMatch, deflateSync, dns, embeddedFiles, enableANSIColors, env, escapeHTML, fetch, file, fileURLToPath, gc, generateHeapSnapshot, gunzipSync, gzipSync, hash, indexOfLine, inflateSync, inspect
- `bun:sqlite` : Database, SQLiteError, Statement, constants
- `bun:ffi` : CFunction, CString, FFIType, JSCallback, cc, dlopen, linkSymbols, native, ptr, read, suffix, toArrayBuffer, toBuffer, viewSource
- `bun:test` : afterAll, afterEach, beforeAll, beforeEach, describe, expect, expectTypeOf, it, jest, mock, onTestFinished, setDefaultTimeout, setSystemTime, spyOn, test, vi, xdescribe, xit, xtest
- `bun:jsc` : bytecodeOrderStats, callerSourceOrigin, codeCoverageForFile, describe, describeArray, deserialize, drainMicrotasks, edenGC, estimateShallowMemoryUsageOf, fullGC, gcAndSweep, generateHeapSnapshotForDebugging, getProtectedObjects, getRandomSeed, heapSize, heapStats, isRope, jscDescribe, jscDescribeArray, memoryUsage, noFTL, noInline, noOSRExitFuzzing, numberOfDFGCompiles, optimizeNextInvocation, percentAvailableMemoryInUse, profile, releaseWeakRefs, reoptimizationRetryCount, samplingProfilerStackTraces, serialize, setRandomSeed, setTimeZone, setTimezone, startRemoteDebugger, startSamplingProfiler, totalCompileTime
- `bun:wrap` : $$typeof

## Sources
- Doc upstream : C:Usersaphro
tendorundocs (`just vendor-bun` pour mettre à jour)
- Index généré : C:Usersaphro
tdocsun{runtime,cli,docs}.md
- Nouveautés : https://bun.com/blog
