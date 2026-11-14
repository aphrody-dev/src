# @aphrody/bunify

Switch a JS/TS monorepo (pnpm, yarn, npm, lerna) to Bun, idempotently. Run again after each upstream sync; `--check` exits 1 when anything is not bunified yet.

```sh
bunify [root] [--check] [--no-lock] [--fullbun] [--rules id ...] [--json]
bunify --list-rules
```

Base pass: lock migration, workspaces/overrides/patchedDependencies/trustedDependencies/bunfig, package.json scripts and tooling spawn calls rewritten to Bun.

## --fullbun

Replaces Node-era dependencies by Bun built-ins. Rules are a table (`RULES` in `src/fullbun.ts`): packages, Bun replacement, mode, codemod.

| rule | package | replacement | mode |
| --- | --- | --- | --- |
| execa | execa | `Bun.$` (statement `await execa('lit', ['lit'])`, optional `{stdio:'inherit'}`) | rewrite |
| glob | glob, fast-glob | `Bun.Glob` (string pattern, options cwd/dot/absolute/nodir) | rewrite |
| rimraf | rimraf | `fs.rm` / `fs.rmSync` (one path; rimraf < 4 only for glob-free literals) | rewrite |
| require-like | require-like | `module.createRequire` (absolute file argument) | rewrite |
| dotenv | dotenv | built-in `.env` loading (`dotenv/config`, zero-argument `config()`) | rewrite |
| node-fetch | node-fetch, undici | global `fetch`/`Headers`/`Request`/`Response`/`FormData` | rewrite |
| ws | ws | global `WebSocket` (client only) | rewrite |
| del | del | globs: reported | report |
| jest | jest, ts-jest, babel-jest, @swc/jest | `bun:test`: reported per package, never forced | report |
| taskr | taskr, @taskr/esnext | known `bun patch` (`src/patches.ts`) applied when the pinned version matches | patch |
| chalk | chalk, picocolors | kept: `Bun.color` converts colors, it does not style text | keep |

ts-node, tsx and cross-env are handled by the base pass.

Safety contract: a file is rewritten by a rule only when every use of the dependency has a call shape the rule fully understands (all-or-nothing per file and rule). Anything else (dynamic import, aliases, unsupported options, result used) is listed in `manual` and the file is left unchanged. The dependency is removed from a package.json only when its last reference under that package is gone and no script mentions it. Only files owned by the root or a declared workspace package are scanned; examples and fixtures with their own manifest are skipped. Rerunning produces no change. Run `bun install` afterwards to refresh `bun.lock`.

Sources are parsed with the tree-sitter core (`@aphrody/core` `query`, loaded from `APHRODY_CORE_LIB` or `target/release`); without the library a string-aware balanced-paren scanner is used (`engine` in the report).

## Report (`--json`)

`changed`, `lock`, `manual[]` (`rule`, `file`, `line`, `reason`), `fullbun.engine`, `fullbun.rules{id: {files, rewritten, manual, kept}}`, `fullbun.jest[]`.

## Known differences

Bun.Glob returns native separators on Windows; `glob@7` callback forms, `ignore` and array patterns are manual.
