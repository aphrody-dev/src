# Bun CLI: run, watch, debug, repl, init/create, check, fmt, lint, TS
Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## Welcome to Bun — `docs/index.mdx`
> Bun is an all-in-one toolkit for developing modern JavaScript/TypeScript applications.
icon="cog" title="Bun Runtime" href="/runtime" cta={ Get started with bun run } > A fast JavaScript runtime designed as…
### Get Started
Bun ships as a single, dependency-free binary and includes a runtime, package manager, test runner, and bundler.
### What's Inside
- Runtime: Execute JavaScript/TypeScript files and package scripts with near-zero overhead.
- Package Manager: Fast installs, workspaces, overrides, and audits with `bun install`.
- Test Runner: Jest-compatible, TypeScript-first tests with snapshots, DOM, and watch mode.
- Bundler: Native bundling for JS/TS/JSX with splitting, plugins, and HTML imports.
- Type Checker: Check a TypeScript project on every CPU core with `bun check`.
- Linter: Find bugs with 1,000 built-in rules and no configuration with `bun lint`.
Explore each area using the cards above.
### What is Bun?
Bun is an all-in-one toolkit for JavaScript and TypeScript apps.
`bun run index.tsx  # TS and JSX supported by default`
### What is a runtime?
JavaScript (or, more formally, ECMAScript) is only a _specification_ for a programming language.
- Browsers · Node.js
### Design goals
Bun is designed from the ground-up with today's JavaScript ecosystem in mind.
- **Speed**. Bun processes start 4x faster than Node.js.
- **TypeScript & JSX support**. You can directly execute `.jsx`, `.ts`, and `.tsx` files; Bun's transpiler converts thes
- **ESM & CommonJS compatibility**. The world is moving towards ES modules (ESM), but millions of packages on npm still 
- **Web-standard APIs**. Bun implements standard Web APIs like `fetch`, `WebSocket`, and `ReadableStream`. Bun is powere
- **Node.js compatibility**. In addition to supporting Node-style module resolution, Bun aims for full compatibility wit

## Installation — `docs/installation.mdx`
> Install Bun with npm, Homebrew, Docker, or the official script.
### Overview
Bun ships as a single, dependency-free executable.
### Installation
`curl -fsSL https://bun.com/install | bash`
**Linux users:** You need the `unzip` package to install Bun (`sudo apt install unzip`).
- **Image Variants**
### Upgrading
`bun upgrade`
**Homebrew users** To avoid conflicts with Homebrew, use `brew upgrade bun` instead.
### Canary Builds
-> View canary build
`bun upgrade --canary bun upgrade --stable`
### Installing Older Versions
Since Bun is a single binary, you can install older versions by re-running the installer script with a specific version.
`curl -fsSL https://bun.com/install | bash -s "bun-v1.3.3"`
### Direct Downloads
To download Bun binaries directly, visit the releases page on GitHub.
- Latest Version Downloads · Musl Binaries
### CPU Requirements
Bun ships a single x64 binary per platform.
| Platform | Intel Requirement | AMD Requirement |
| - | - | - |
| x64 | Nehalem (1st gen Core) or newer | Bulldozer or newer |
### Uninstall
`rm -rf ~/.bun`

## Quickstart — `docs/quickstart.mdx`
> Build your first app with Bun
### Overview
Build a minimal HTTP server with `Bun.serve`, run it locally, then evolve it by installing a package.
`bun init my-app`
### Run a script
Bun can also execute `"scripts"` from your `package.json`.
```json
{
 "name": "my-app",
 "module": "index.ts",
 "type": "module",
 "private": true,
…
```

## Bun Runtime — `docs/runtime/index.mdx`
> Execute JavaScript/TypeScript files, package.json scripts, and executable packages with Bun's fast runtime.
The Bun Runtime is designed to start fast and run fast.
| Command | Time |
| - | - |
| `bun hello.js` | `5.2ms` |
| `node hello.js` | `25.1ms` |
### Run a file
Use `bun run` to execute a source file.
`bun run index.js`
- `--watch` · `--check`
### Run a `package.json` script
Compare to `npm run ` or `yarn `
`bun [bun flags] run <script> [script flags]`
- `--bun` · Filtering
### `bun run -` to pipe code from stdin
`bun run -` reads JavaScript, TypeScript, TSX, or JSX from stdin and executes it without writing to a temporary file fi…
`echo "console.log('Hello')" | bun run -`
### `bun run --console-depth`
Control the depth of object inspection in console output with the `--console-depth` flag.
`bun --console-depth 5 run index.tsx`
### `bun run --smol`
In memory-constrained environments, use the `--smol` flag to reduce memory usage at a cost to performance.
`bun --smol run index.tsx`
### Resolution order
Bun always executes absolute paths and paths starting with `./` or `.\\` as source files.
- `package.json` scripts: `bun run build`
- Source files: `bun run src/main.js`
- Binaries from project packages: `bun add eslint && bun run eslint`
- (`bun run` only) System commands: `bun run ls`

## Watch Mode — `docs/runtime/watch-mode.mdx`
> Automatic reloading in Bun with --watch and --hot modes
- `--watch` mode, which hard restarts Bun's process when imported files change.
- `--hot` mode, which soft reloads the code (without restarting the process) when imported files change.
---
### `--watch` mode
Watch mode works with `bun test` and `bun build`, and when running TypeScript, JSX, and JavaScript files.
`bun --watch index.tsx`
### `--hot` mode
Use `bun --hot` to enable hot reloading when executing code with Bun.
`bun --hot server.ts`
- **HTTP servers**

## Debugging — `docs/runtime/debugger.mdx`
> Debug your Bun code with an interactive debugger using WebKit Inspector Protocol
Bun speaks the WebKit Inspector Protocol, so you can debug your code with an interactive debugger.
### Debugging JavaScript and TypeScript
```typescript
Bun.serve({
 fetch(req) {
  console.log(req.url);
  return new Response("Hello, world!");
 },
…
```
- `--inspect` · `--inspect-brk` · `--inspect-wait` · Setting a port or URL for the debugger
### Debuggers
Several debugging tools can connect to this server.
- `debug.bun.sh` · Visual Studio Code Debugger
### Debugging Network Requests
Set the `BUN_CONFIG_VERBOSE_FETCH` environment variable to log network requests made with `fetch()` or `node:http`.
| Value | Description |
| - | - |
| `curl` | Print requests as `curl` commands |
| `true` | Print request & response info |
| `false` | Don't print anything (default) |
- **Print fetch & node:http requests as curl commands**
### Stacktraces & sourcemaps
Bun transpiles every file, which could leave stack traces pointing at the transpiled output.
- Syntax-highlighted source code preview · V8 Stack Traces · V8 Stack Trace API · `Error.prepareStackTrace` · `Error.captureStackTrace(error, startFn)`

## REPL — `docs/runtime/repl.mdx`
> An interactive JavaScript and TypeScript REPL with syntax highlighting, history, and tab completion
`bun repl` starts an interactive Read-Eval-Print Loop (REPL) for evaluating JavaScript and TypeScript expressions.
`bun repl`
### Features
- **TypeScript & JSX** — Write TypeScript and JSX directly. Bun transpiles everything on the fly.
- **Top-level `await`** — Await promises directly at the prompt without wrapping in an async function.
- **Syntax highlighting** — The REPL highlights input as you type.
- **Persistent history** — The REPL saves history to `~/.bun_repl_history`. History persists across sessions.
- **Tab completion** — Press `Tab` to complete property names and REPL commands.
- **Multi-line input** — Unclosed brackets, braces, and parentheses automatically continue on the next line.
---
### Special variables
The REPL exposes two special variables that update after each evaluation.
| Variable | Description |
| - | - |
| `_` | The result of the last expression |
| `_error` | The last error that was thrown |
```txt
> 2 + 2
4
> _ * 10
40
> JSON.parse("oops")
…
```
### Top-level `await`
You can `await` any expression directly at the prompt.
```txt
> await fetch("https://api.github.com/repos/oven-sh/bun").then(r => r.json()).then(r => r.stargazers_count)
81234
> const response = await fetch("https://example.com")
undefined
> response.status
…
```
### Importing modules
```txt
> import { z } from "zod"
undefined
> const path = require("path")
undefined
> z.string().parse(path.join("/tmp", "file.txt"))
…
```
Declarations persist for the rest of the session.
### Multi-line input
When you press `Enter` on a line with unclosed brackets, braces, or parentheses, the REPL automatically continues on th…
```txt
> function add(a, b) {
...   return a + b;
... }
undefined
> add(2, 3)
…
```
### REPL commands
Type `.help` at the prompt to see all available REPL commands.
| Command | Description …|
| - | -…|
| `.help` | Print the help message listing commands and keybindings …|
| `.exit` | Exit the REPL …|
| `.clear` | Clear the screen …|
| `.copy` | Copy the last result to the clipboard. Pass an expression…|
| `.load` | Load a file into the REPL session: `.load ./script.ts` …|
| `.save` | Save the current REPL history to a file: `.save ./session…|
| `.editor` | Enter multi-line editor mode (press `Ctrl+D` to evaluate,…|
| `.break` | Cancel the current multi-line input …|
### Keybindings
The REPL supports Emacs-style line editing.
| Keybinding | Action |
| - | - |
| `Ctrl+A` | Move to start of line |
| `Ctrl+E` | Move to end of line |
| `Ctrl+B` / `Ctrl+F` | Move backward/forward one character |
| `Alt+B` / `Alt+F` | Move backward/forward one word |
| `Ctrl+U` | Delete to start of line |
| `Ctrl+K` | Delete to end of line |
| `Ctrl+W` | Delete word backward |
| `Ctrl+D` | Delete character (or exit if line is empty) |
### History
The REPL automatically saves history to `~/.bun_repl_history` (up to 1000 entries) and loads it at the start of each se…
`> .save ./my-session.txt`
### Non-interactive mode
Use `-e` / `--eval` to evaluate a script with REPL semantics and exit.
```sh
bun repl -e "const x: number = 42; console.log(x)"
# 42
bun repl -p "await fetch('https://example.com').then(r => r.status)"
# 200
bun repl -p "{ a: 1, b: 2 }"
…
```

## bun create — `docs/runtime/templating/create.mdx`
> Create a new Bun project from a React component, a `create-<template>` npm package, a GitHub repo, or a local template
`bun create` is optional — Bun works without any configuration.
### From a React component
`bun create ./MyComponent.tsx` turns an existing React component into a complete dev environment with hot reload and pr…
`bun create ./MyComponent.jsx # .tsx also supported`
- How this works · Using TailwindCSS with Bun · Using `shadcn/ui` with Bun
### From `npm`
`bun create <template> [<destination>]`
If you don't have a local template with the same name, this command downloads and runs the `create-` package from npm.
### From GitHub
`bun create /` downloads the contents of the GitHub repo to disk.
`bun create <user>/<repo> bun create github.com/<user>/<repo>`
- Downloads the template
- Copies all template files into the destination folder
- Initializes a fresh Git repo. Opt out with the `--no-git` flag.
- Installs dependencies with `bun install`
### From a local template
You can define custom templates on your local file system.
- `$HOME/.bun-create/`: global templates
- `/.bun-create/`: project-specific templates
`cd $HOME/.bun-create mkdir foo cd foo`
- **Setup logic**
### Reference
- CLI flags · Environment variables

## bun init — `docs/runtime/templating/init.mdx`
> Scaffold an empty Bun project with the interactive `bun init` command
Scaffold a new Bun project with `bun init`.
`bun init my-app`
- a `package.json` file with a name that defaults to the current directory name, and a `typecheck` script that runs `bun
- a `tsconfig.json` or `jsconfig.json` file, depending on whether the entry point is a TypeScript file
- an entry point, which defaults to `index.ts` unless any of `index.{tsx, jsx, js, mts, mjs}` exist or the `package.json
- a `README.md` file
- a `CLAUDE.md` file when `bun init` detects Claude CLI (disable with `CLAUDE_CODE_AGENT_RULE_DISABLED` env var)
- a `.cursor/rules/*.mdc` file when `bun init` detects Cursor (disable with `CURSOR_AGENT_RULE_DISABLED` env var); the f

## Type checking — `docs/runtime/check.mdx`
> Type check your TypeScript project with bun check
`bun check` type checks your TypeScript project.
`bun check`
### Set up a project
`bun init` does all of this for you.
`bun add -d @types/bun`
### Replace `tsc`
`bun check` reads the same `tsconfig.json` as `tsc` and checks the same files, so most projects only change the command.
| Instead of | Run |
| - | - |
| `tsc --noEmit` | `bun check` |
| `tsc --noEmit -p packages/server` | `bun check -p packages/server` |
| `tsc -b` | `bun check -b` |
| `tsc --noEmit && bun src/index.ts` | `bun --check src/index.ts` |
| `tsc --noEmit && bun test` | `bun test --check` |
| `tsc --noEmit && bun build ./app.ts` | `bun build --check ./app.ts` |
- **Coming from TypeScript 5**
### Run in CI
Install your dependencies, then run `bun check`.
- GitHub Actions · GitLab CI and other providers · What to expect in CI
### Check before you commit
Run `bun check` from a Git hook to catch type errors before they reach CI.
`#!/bin/sh bun check`
### Choose what to check
- The whole project · Another project · Some files or directories · Without a `tsconfig.json`
### Monorepos
- One package · Every project · A `tsconfig.json` with nothing but `references` · No `tsconfig.json` at the root
### Check before you run, build, or test
The `--check` flag type checks your code first.
`bun --check src/index.ts bun build --check src/index.ts --outdir out bun test --check`
- What `--check` covers · Watch mode · `bun build` · `Bun.build` · `bun compile`
### If `package.json` has a `check` script
Your script wins. `bun check` runs it, like `bun run check`, and passes it your flags.
```json
{
 "scripts": {
  "check": "biome check"
 }
}
```
### Output
- In a terminal · Piped or redirected · More than 50 errors · AI agents
### Troubleshooting
- Cannot find name 'console', 'Bun', or module 'bun:test' · Cannot find name 'process', 'describe', or 'expect' · Option 'baseUrl' has been removed · Stopped before type checking · Cannot find module './logo.svg' or './index.css' · `bun check` runs a script instead of the type checker · `bun check` and my editor disagree
### Compiler options as flags
Every compiler option works as a flag, as it does for `tsc`.
`bun check --noUncheckedIndexedAccess bun check --strict false bun check --target es2022`
### Differences from `tsc`
`bun check` aims to report exactly what `tsc` from TypeScript 7 reports.
`bun -p process.versions.typescript`
- **`bun check` only checks.** It does not write JavaScript, `.d.ts`, source map, or `.tsbuildinfo` files, even if `decl
- **Referenced projects don't have to be built.** `tsc` without `-b` reads the `.d.ts` files that an earlier build wrote
- **Compiler options work with `-b`.** `tsc -b --strict` reports TS5094. `bun check -b --strict` applies the option to e
- **A `tsconfig.json` with nothing but `references` is followed.** `tsc` without `-b` checks nothing there.
- **Paths work next to a `tsconfig.json`.** `tsc src/index.ts` reports TS5112 if there is a `tsconfig.json`. `bun check 
- **There is no `bun check --watch`.** To check again on every change, use `bun --watch --check`.
### CLI usage
`bun check [flags] [...files or directories]`
| Flag | Description …|
| - | -…|
| `-p`, `--project <path>` | Path to a `tsconfig.json` or its directory …|
| `-b`, `--build` | Check the projects in `references` too, like `tsc -b` …|
| `--pretty` | Show source code around each error. Default in a terminal…|
| `--no-pretty` | One line per error, like `tsc --pretty false`. Default wh…|
| `--all` | Show every error. Without it, identical errors are groupe…|
| `--threads <n>` | Number of threads. Default: one per CPU core …|
| `--timing` | Print how long loading and checking took …|
| `--cwd <path>` | Set the working directory …|

## Formatter — `docs/format/index.mdx`
> Bun's fast, built-in formatter for JavaScript, TypeScript, CSS, HTML, JSON, YAML, Markdown, and more
Bun ships with a fast, built-in code formatter.
- JavaScript, TypeScript, JSX, CSS, SCSS, Less, HTML, Vue, Svelte, Angular, JSON, YAML, TOML, Markdown, MDX, GraphQL, an
- The same output as Prettier
- Sorts imports, Tailwind CSS classes, and `package.json`
- Works with your existing Prettier or oxfmt config
### Run the formatter
`bun fmt`
`bun fmt` rewrites the files in the current directory that need it and prints their names.
### Check without writing
`--check` lists the files that need formatting and writes nothing.
`bun fmt --check`
### Options
Options live in `bunfig.toml`.
```toml
[fmt]
printWidth = 100
semi = false
singleQuote = true
```
| Option | Default | What it does |
| - | - | - |
| `printWidth` | `80` | Wrap lines at this column |
| `tabWidth` | `2` | Spaces per indentation level |
| `useTabs` | `false` | Indent with tabs |
| `semi` | `true` | Print semicolons |
| `singleQuote` | `false` | Use single quotes |
| `trailingComma` | `"all"` | `"all"`, `"es5"`, or `"none"` |
- Different options for some files · `.editorconfig`
### Ignore files
Every `.gitignore` in the repository counts, whichever directory you run `bun fmt` from.
`[fmt] ignorePatterns = ["vendor/", "**/*.gen.ts"]`
### Ignore code
`bun fmt` uses Prettier's comment, so existing ones keep working.
```ts
const matrix = [
 1, 0, 0,
 0, 1, 0,
 0, 0, 1,
];
```
### Sort imports
`[fmt] sortImports = true`
- Imports are grouped: built-in modules, packages, aliases like `@/`, relative paths, styles.
- Each group is sorted by path, and the names in `{ }` are sorted too.
- Two imports from the same module become one.
- Side-effect imports like `import "./setup"` never move, and nothing moves past one.
- A comment directly above an import moves with it. Above the first import, comments about the whole file stay at the to
To pick your own groups, use a table.
### Sort Tailwind CSS classes
`[fmt] sortTailwindcss = true`
Classes are sorted in Tailwind's recommended order, in `class` and `className` and in calls to `clsx`, `cn`, `cva`, `tw…
### Sort `package.json`
`[fmt] sortPackageJson = true`
If your `.prettierrc` lists `prettier-plugin-packagejson`, sorting is already on and uses that plugin's order.
### Format JSDoc comments
`[fmt] jsdoc = true`
### Svelte
`.svelte` files are formatted by default, like `prettier-plugin-svelte` formats them.
```toml
[fmt.svelte]
sortOrder = "options-scripts-markup-styles"
allowShorthand = true
indentScriptAndStyle = true
```
### Standard input
Pipe text through `bun fmt`.
`bun fmt --stdin-filepath src/index.ts < src/index.ts`
### Git hooks
`--staged` formats only the files you're about to commit and stages them again, so you don't need `lint-staged`.
`#!/bin/sh bun fmt --staged`
### Migrate from Prettier or oxfmt
Already have a `.prettierrc` or an `.oxfmtrc.json`?
```json
{
 "scripts": {
  "format": "prettier --write .", // [!code --]
  "format": "bun fmt" // [!code ++]
 }
…
```

## Linter — `docs/lint/index.mdx`
> Bun's fast, built-in linter for JavaScript, TypeScript, and JSX
Bun ships with a fast, built-in linter.
- 1,000+ rules from ESLint, typescript-eslint, React, import, unicorn, jsx-a11y, Jest, Vitest, and more
- Type-aware rules, without the `typescript` package
- Auto-fix with `--fix`
- Works with your existing ESLint or oxlint config
### Run the linter
`bun lint`
`bun lint` checks every `.js`, `.jsx`, `.ts`, and `.tsx` file in the current directory (plus the `.mjs`, `.cjs`, `.mts`…
### Fix problems
Many rules can fix what they report.
`bun lint --fix`
### Default rules
- **Every file**: ESLint's recommended rules
- **TypeScript**: typescript-eslint's recommended rules
- **React**: `rules-of-hooks`, `exhaustive-deps`, and `jsx-key`, if `react` is in your `package.json`
- **Tests**: leftover `test.only`, `expect()` without a matcher, un-awaited `.resolves`, and a few more, in files that i
Likely bugs are errors.
- `require()` is allowed in TypeScript files. Bun runs `import` and `require()` in the same file.
- A name that starts with `_` may be unused.
### Configure rules
Rules live in `bunfig.toml`.
```toml
[lint.rules]
"no-console" = "warn"
"prefer-const" = "off"
"eqeqeq" = ["error", "smart"] # with options
"unicorn/prefer-node-protocol" = "error"
…
```
- Find a rule · Add an ESLint plugin · Turn on a group of rules · Turn a plugin off
### Ignore files
`[lint] ignorePatterns = ["vendor/", "**/*.gen.ts"]`
The patterns use `.gitignore` syntax and are relative to `bunfig.toml`.
### ES modules and CommonJS
`bun lint` works out whether a file is an ES module or CommonJS from the file itself, the way Node.js does:
- `.mjs` and `.mts` files are modules. `.cjs` and `.cts` files are CommonJS.
- Any other file is a module if the nearest `package.json` has `"type": "module"`.
- Otherwise, a file with an `import`, an `export`, `import.meta` or a top-level `await` is a module. A file with none of
`[lint.parserOptions] sourceType = "commonjs"`
### Disable a rule in code
`bun lint` uses ESLint's comments, so existing ones keep working.
`console.log(version); console.log("off until the end of the file");`
### Type-aware rules
Some bugs only show up with types, like a promise nobody awaits.
`bun lint --type-aware`
- **Choosing a `tsconfig.json`**
### Git hooks
`--staged` lints only the files you're about to commit, so you don't need `lint-staged`.
`#!/bin/sh bun lint --staged --fix`
### CI
In GitHub Actions, `bun lint` annotates the pull request diff automatically.
```yaml
steps:
 - uses: actions/checkout@v4
 - uses: oven-sh/setup-bun@v2
 - run: bun lint --max-warnings 0 # fail on warnings too
```
### Migrate from ESLint or oxlint
Already have an `eslint.config.js`, `.eslintrc`, or `.oxlintrc.json`?
```json
{
 "scripts": {
  "lint": "eslint ." // [!code --]
  "lint": "bun lint" // [!code ++]
 }
…
```

## ESLint plugins — `docs/lint/plugins.mdx`
> Run ESLint plugins in bun lint, and write your own rules
`bun lint` runs ESLint plugins, both from npm and your own.
```js
const noTodo = {
 meta: {
  type: "suggestion",
  messages: { todo: "Open an issue instead of leaving a TODO." },
  schema: [],
…
```
### Plugins from npm
Install the package and name it.
`bun add -d eslint-plugin-perfectionist`
### Performance
JavaScript rules are slower than native ones.
- Only turn on a plugin's rules for the files that need them. Files without JavaScript rules pay nothing.
- Put a plugin in its own module. If you define it inside `eslint.config.js`, every thread has to run the whole config f
### Run the installed package instead
`bun lint --no-native-plugin-rules bun lint --native-plugin-rules=@typescript-eslint,import # only these two stay native`
ESLint's core rules are always native.
### `prettier/prettier`
`prettier/prettier` from eslint-plugin-prettier is native.
- You have a version other than Prettier 3.9.
- You use a Prettier plugin that `bun fmt` doesn't have.
- The file isn't JavaScript or TypeScript.
### Other languages
In an ESLint config, a file can have a `language` from a plugin.
- `@eslint/json`: `json/json`, `json/jsonc`, and `json/json5`, with its rules.
- `@eslint/markdown`: `markdown/commonmark` and `markdown/gfm`, with its rules.
```js
import json from "@eslint/json";
export default [
 {
  files: ["**/*.json"],
  plugins: { json },
…
```
- A language from another plugin, such as `css/css`.
- A JSON or Markdown rule that isn't built in, such as one of your own. The whole file then goes to `eslint`.
- A parser for another file type, such as `vue-eslint-parser`, `svelte-eslint-parser`, or `yaml-eslint-parser`.
- `eslint-plugin-html`.
### Processors
```js
import markdown from "@eslint/markdown";
export default [
 { files: ["***.md/*.js"], rules: { "no-var": "error" } },
];
```
### Notes
- **JavaScript rules don't get types.** `parserServices.program` is `null`, even with `--type-aware`. A rule that calls 
- **Plugins run on several threads.** Each thread imports the plugin, so module-level state is per thread, not per run.
- **A renamed built-in plugin runs in JavaScript.** For example, `@antfu/eslint-config` registers `@typescript-eslint` a
- **A rule that throws ends the run** with exit code `2`. With an oxlint config, Bun reports the error for that file and
- **A report at `loc: { line: 0, column: 0 }` is at `1:1`.** `/* eslint-disable */` at the start of the file disables it
- **Every node has `start` and `end` with `bunfig.toml` alone.** With an ESLint config, a JavaScript file has espree's n

## TypeScript — `docs/typescript.mdx`
> Using TypeScript with Bun, including type definitions and compiler options
To get TypeScript definitions for Bun's built-in APIs, install `@types/bun`.
`bun add -d @types/bun # dev dependency`
### Suggested `compilerOptions`
Bun supports top-level await, JSX, and imports with `.ts` extensions, which TypeScript doesn't allow by default.
```json
{
 "compilerOptions": {
  "lib": ["ESNext"],
  "target": "ESNext",
  "module": "Preserve",
…
```
### Type checking
Bun runs TypeScript files without checking their types.
`bun check`
### TypeScript 6 and 7

## TypeScript 6 and 7 — `docs/typescript-6.mdx`
> How to configure Bun's type definitions for TypeScript 6.0 and 7.0, which no longer auto-discover @types packages. Fix 'Cannot find name Bun' and other missing type errors after upgrading TypeScript.
TypeScript 6.0 changed how it discovers type definitions.
### What changed
Starting in TypeScript 6.0, the `types` field in `compilerOptions` defaults to an empty array instead of including all …
### Add `"types": ["bun"]` to your tsconfig
```jsonc
{
 "compilerOptions": {
  "types": ["bun"], // [!code ++]
 },
}
```
The `types` array tells TypeScript to load type definitions from `@types/bun`.
### Full recommended tsconfig.json
```jsonc
{
 "compilerOptions": {
  "lib": ["ESNext"],
  "target": "ESNext",
  "module": "Preserve",
…
```
### Does this apply to TypeScript 7?
Yes. TypeScript 7 carries forward the same default.
### Does this apply to `bun check`?
Yes. `bun check` behaves like TypeScript 7, whichever version of `typescript` you have installed.

## TypeScript — `docs/runtime/typescript.mdx`
> Using TypeScript with Bun, including type definitions and compiler options
Install `@types/bun` to get TypeScript definitions for Bun's built-in APIs.
`bun add -d @types/bun # dev dependency`
### Suggested `compilerOptions`
Bun supports top-level await, JSX, and imports with `.ts` extensions, which TypeScript doesn't allow by default.
```jsonc
{
 "compilerOptions": {
  "lib": ["ESNext"],
  "target": "ESNext",
  "module": "Preserve",
…
```

## Auto-install — `docs/runtime/auto-install.mdx`
> Bun's automatic package installation feature for standalone script execution
If Bun finds no `node_modules` directory in the directory of the importing file or higher, it abandons Node.js-style mo…
```ts
import { foo } from "foo"; // install `latest` version
foo();
```
### Project root
- The nearest directory, at or above the file, that has a `package.json` with a `name`, `workspaces`, or dependencies. A
- The workspace root, if that directory is a member of a workspace.
- The topmost directory that has a `package.json`, if none of them has a `name`, `workspaces`, or dependencies.
- The directory of the file, if there is no `package.json`.
A file in `node_modules` belongs to the project that the `node_modules` directory is in.
### Version resolution
- Scan up the tree for a `package.json` that lists `"foo"` in `dependencies`, `devDependencies`, `optionalDependencies`,
- Otherwise, use `latest`.
- Look for a `bun.lock` file in the project root. If the lockfile has a version of `"foo"` that satisfies the range, use
The dependencies of a package that comes from the lockfile also load the versions in the lockfile.
### Cache behavior
- Checks the module cache for a compatible version. If one exists, uses it.
- When resolving `latest`, checks if `package@latest` was downloaded and cached in the last _24 hours_. If so, uses it.
- Otherwise, downloads and installs the appropriate version from the registry.
With `bun --prefer-offline` (or `install.prefer = "offline"`), Bun resolves versions and tags from the cached registry …
### Registries
Bun downloads packages from the npm registry (`https://registry.npmjs.org/`) unless you configure another one.
`@myorg:registry=https://npm.myorg.com/`
### Installation
Bun installs and caches packages into `/@`, so Bun can cache multiple versions of the same package at once.
### Version specifiers
To bypass version resolution entirely, specify a version or version range directly in your import statement.
`import { z } from "zod@3.0.0"; // specific version import { z } from "zod@next"; // npm tag import { z } from "zod@^3.20.0"; // semver range`
### Benefits
- **Space efficiency** — Each version of a dependency exists in only one place on disk. This saves space and time compar
- **Portability** — Your source file is _self-contained_, so sharing scripts and gists doesn't mean zipping up a directo
- **Convenience** — You don't need to run `npm install` or `bun install` before running a file or script with `bun run`.
- **Backwards compatibility** — Because Bun still respects the versions specified in `package.json` if one exists, you c
---
### Limitations
- No Intellisense. TypeScript auto-completion in IDEs relies on type declaration files inside `node_modules`. We are inv
- No patch-package support
- No git dependencies. Run `bun install` for a dependency on a git URL.
- An `overrides` or `resolutions` entry applies only if it names a version, a range, a tag, an `npm:` alias, or a `catal
- One project per process. The registries, `overrides`, `resolutions`, and catalogs of another project do not apply to t
---
### FAQ
With pnpm, you have to run `pnpm install`, which creates a `node_modules` folder of symlinks for the runtime to resolve.
