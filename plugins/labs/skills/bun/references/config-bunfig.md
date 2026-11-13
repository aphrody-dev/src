# bunfig.toml

Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## bunfig.toml — `docs/runtime/bunfig.mdx`

> Configure Bun's behavior using its configuration file bunfig.toml
> `bunfig.toml` is Bun's configuration file.

### Global vs. local

Put `bunfig.toml` in your project root, alongside your `package.json`.

- `$HOME/.bunfig.toml`
- `$XDG_CONFIG_HOME/.bunfig.toml`

### Runtime

Top-level fields in `bunfig.toml` configure Bun's runtime behavior.

- **`preload`**
  An array of scripts/plugins to execute before running a file or script.
  `preload = ["./preload.ts"]`
- **`jsx`**
  Configure how Bun handles JSX.

```toml
jsx = "react"
jsxFactory = "h"
jsxFragment = "Fragment"
jsxImportSource = "react"
```

- `jsx`
- `jsxFactory`
- `jsxFragment`
- `jsxImportSource`
- **`smol`**
  Enable `smol` mode. This reduces memory usage at the cost of performance.
  `smol = true`
- **`logLevel`**
  Set the log level: `"debug"`, `"warn"`, or `"error"`.
  `logLevel = "debug" # "debug" | "warn" | "error"`
- **`define`**
  The `define` field replaces global identifiers with constant expressions wherever they appear.
  `[define] "process.env.bagel" = "'lox'"`
- **`loader`**
  Configure how Bun maps file extensions to loaders.
  `[loader] ".bagel" = "tsx"`
- `jsx`
- `js`
- `ts`
- `tsx`
- `css`
- `file`
- **`telemetry`**
  The `telemetry` field enables or disables analytics.
  `telemetry = false`
- **`env`**
  Configure automatic `.env` file loading.
  `env = false`
- **`console`**
  Configure console output behavior.
- **`console.depth`**

### Serve

The `[serve]` section configures `Bun.serve` and `bun run` when serving HTTP.

- **`serve.port`**
  The default port for `Bun.serve` to listen on.
  `[serve] port = 3000`

### Test runner

The `[test]` section of `bunfig.toml` configures the test runner.
`[test]`

- **`test.root`**
  The root directory to run tests from.
  `[test] root = "./__tests__"`
- **`test.preload`**
  Same as the top-level `preload` field, but only applies to `bun test`.
  `[test] preload = ["./setup.ts"]`
- **`test.environment`**
  The DOM that test files run with.
  `[test] environment = "happy-dom"`
- **`test.globals`**
  Which module `test`, `expect` and the other globals come from.
- `"bun"`: a file that imports anything from `"vitest"` gets them from `"vitest"`. Any other file gets them from `"bun:t
- `"vitest"`: every file gets them from `"vitest"`, like `globals: true` in a Vitest project.
  `[test] globals = "vitest"`
- **`test.reactCompiler`**
  Compile components and hooks with Bun's built-in React Compiler.
- `true`: every JavaScript and TypeScript file, except test files, preload scripts and `node_modules`.
- An array of folders or glob patterns: only the files in them.
- A table with `include` and `exclude`: the files that `include` matches and `exclude` doesn't.
  `[test.reactCompiler] include = ["src", "packages/ui"] exclude = ["**/*.stories.*"]`
- **`test.pathIgnorePatterns`**
  Exclude files and directories from test discovery using glob patterns.
  `[test] pathIgnorePatterns = ["vendor/**", "submodules/**", "fixtures/**"]`
- **`test.smol`**
  Same as the top-level `smol` field, but only applies to `bun test`.
  `[test] smol = true`
- **`test.coverage`**
  Enables coverage reporting.
  `[test] coverage = false`
- **`test.coverageThreshold`**
  The coverage threshold.
  `[test] coverageThreshold = 0.9`
- **`test.coverageSkipTestFiles`**
  Whether to skip test files when computing coverage statistics.
  `[test] coverageSkipTestFiles = false`
- **`test.coverageIgnoreSourcemaps`**
  Whether to report coverage against transpiled output instead of remapping line numbers through sourcemaps back to the o…
  `[test] coverageIgnoreSourcemaps = false`
- **`test.coveragePathIgnorePatterns`**
  Exclude files from coverage reports using glob patterns.

```toml
[test]
# Single pattern
coveragePathIgnorePatterns = "***.spec.ts",
 "**/*.test.ts",
 "src/utils/**",
…
```

- **`test.coverageReporter`**
  By default, the test runner prints coverage reports to the console.
  `[test] coverageReporter  = ["text", "lcov"]  # default ["text"]`
- **`test.coverageDir`**
  Set the path where coverage reports are saved.
  `[test] coverageDir = "path/to/somewhere"  # default "coverage"`
- **`test.randomize`**
  Run tests in random order.
  `[test] randomize = true`
- **`test.seed`**
  Set the random seed for test randomization.
  `[test] randomize = true seed = 2444615283`
- **`test.rerunEach`**
  Re-run each test file a specified number of times.
  `[test] rerunEach = 3`
- **`test.retry`**
  Default retry count for all tests.
  `[test] retry = 3`
- **`test.clearMocks`**
  Clear every mock function's calls and results before each test.
  `[test] clearMocks = true`
- **`test.concurrentTestGlob`**
  Test files matching this glob pattern run all of their tests concurrently, as if you passed the `--concurrent` flag.
  `[test] concurrentTestGlob = "**/concurrent-*.test.ts"`
- **`test.onlyFailures`**
  When enabled, the output shows only failed tests, which reduces noise in large test suites.
  `[test] onlyFailures = true`
- **`test.reporter`**
  Configure the test reporter settings.
- `test.reporter.dots` · `test.reporter.junit` · `test.reporter.junitSuites`

### Linter

The `[lint]` section configures `bun lint`.

```toml
[lint]
typeAware = true
ignorePatterns = ["vendor/", "**/*.gen.ts"]
[lint.rules]
"no-console" = "warn"
…
```

- **`lint.rules`**
  Set a rule to `"off"`, `"warn"`, or `"error"`.

```toml
[lint.rules]
"no-console" = "warn"
"@typescript-eslint/no-explicit-any" = "off"
"unicorn/prefer-node-protocol" = "error"
"no-restricted-imports" = ["error", { paths = ["lodash"] }]
```

- A wildcard can only be `"off"`. To turn rules on, name them or use `lint.categories`.
- `lint.overrides` and flags apply after `[lint.rules]`. A wildcard there also turns off a rule that `[lint.rules]` sets
- `"react/*"` leaves `react/jsx-uses-react` on. That rule reports nothing. It keeps `no-unused-vars` quiet about `React`
- A wildcard works with Bun's own lint config. If the working directory has an ESLint or oxlint config, `bun lint` rejec
- **`lint.plugins`**
  Load ESLint plugins: paths, relative to `bunfig.toml`, or package names.

```toml
[lint]
plugins = ["./lint/plugin.js", "eslint-plugin-perfectionist"]
[lint.rules]
"local/no-todo" = "warn"
"perfectionist/sort-imports" = "error"
```

- **`lint.categories`**
  Set a whole category of rules at once.
  `[lint.categories] suspicious = "warn" perf = "warn"`
  | Category | What its rules report | | - | - |
  | `correctness` | Code that is wrong or useless |
  | `suspicious` | Code that is probably wrong or useless |
  | `pedantic` | Strict checks, with some false positives |
  | `perf` | Code that could run faster |
  | `style` | Code that could be more idiomatic |
  | `restriction` | Language features and patterns you want to ban |
  | `nursery` | New rules that are still changing |
  | `all` | Every category at once |
- **`lint.overrides`**
  Use different rules for some files.

```toml
[[lint.overrides]]
files = ["*.test.ts", "scripts/**"]
excludeFiles = ["scripts/vendor/**"]
rules = { "no-console" = "off" }
```

- **`lint.ignorePatterns`**
  Skip the files that match.
  `[lint] ignorePatterns = ["vendor/", "**/*.gen.ts"]`
- **`lint.settings`**
  Settings that rules share, such as the React version.

```toml
[lint.settings.react]
version = "18.2"
[lint.settings."jsx-a11y".components]
Picture = "img"
```

- **`lint.typeAware`**
  Turn on typescript-eslint's recommended type-aware rules, such as `@typescript-eslint/no-floating-promises`.
  `[lint] typeAware = true tsconfig = "./tsconfig.lint.json" # default: the nearest tsconfig.json`
- **`lint.typeCheck`**
  Also report type errors, like `bun check`.
  `[lint] typeCheck = true`
- **`lint.globals`**
  Declare global variables, so that `no-undef` accepts them.
  `[lint.globals] MY_GLOBAL = "readonly"`
- **`lint.maxWarnings`**
  Exit with code `1` if there are more warnings than this.
  `[lint] maxWarnings = 0`
- **All keys**
  | Key | Value | Flag | | - | - | - |
  | `rules` | table | `--rule` |
  | `plugins` | array | `--plugin` |
  | `categories` | table | `-A`, `-W`, `-D` |
  | `overrides` | array of tables | |
  | `globals` | table | `--global` |
  | `settings` | table | |
  | `ignorePatterns` | array | `--ignore-pattern` |
  | `typeAware` | boolean | `--type-aware`, `--no-type-aware` |
  `bun lint --help --all` says what each flag does.

### Formatter

The `[fmt]` section configures `bun fmt`.

```toml
[fmt]
printWidth = 100
semi = false
sortImports = true
ignorePatterns = ["vendor/", "**/*.gen.ts"]
```

- **Style options**
  Same names, defaults, and meaning as Prettier's options.
  | Key | Default | What it does …|
  | - | - | -…|
  | `printWidth` | `80` | Wrap lines at this column …|
  | `tabWidth` | `2` | Spaces per indentation level …|
  | `useTabs` | `false` | Indent with tabs …|
  | `semi` | `true` | Print semicolons …|
  | `singleQuote` | `false` | Use single quotes …|
  | `jsxSingleQuote` | `false` | Use single quotes in JSX …|
  | `quoteProps` | `"as-needed"` | Quote object keys: `"as-needed"`, `"consistent"`, or `"pr…|
| `trailingComma`|`"all"`|`"all"`, `"es5"`, or `"none"` …|
- **`format.sortImports`**
  Sort, group, and merge imports.
  `[fmt] sortImports = true`
  | Key | Default | What it does …|
  | - | - | -…|
  | `groups` | above | The order of the groups. A nested array merges several gr…|
  | `customGroups` | `[]` | Your own groups: `{ groupName = "ui", elementNamePattern …|
| `internalPattern`| above | The prefixes that count as`internal`…|
|`newlinesBetween`|`true`| A blank line between groups …|
|`order`|`"asc"`|`"asc"`or`"desc"`…|
|`ignoreCase`|`true`|`a`and`A`sort together …|
|`sortSideEffects`|`false`| Also move side-effect imports, like`import "./setup"`…|
|`partitionByComment`|`false` | Sort the imports before and after a comment line separate…|
- **`format.sortTailwindcss`**
  Sort Tailwind CSS classes.
  `[fmt.sortTailwindcss] stylesheet = "./src/app.css" functions = ["clsx", "tw"]`
  | Key | What it does …|
  | - | -…|
  | `stylesheet` | Tailwind 4: the CSS file that imports Tailwind …|
  | `config` | Tailwind 3: the path of `tailwind.config.js` …|
  | `functions` | Sort the strings passed to these functions. Replaces the …|
  | `attributes` | Sort these attributes too, besides `class` and `className…|
| `preserveWhitespace`| Keep the whitespace between classes …|
|`preserveDuplicates` | Keep duplicate classes …|
- **`format.sortPackageJson`**
  Sort the keys of `package.json`.
  `[fmt] sortPackageJson = true`
- **`format.jsdoc`**
  Format JSDoc comments.
  `[fmt] jsdoc = true`
  | Key | Default | What it does …|
  | - | - | -…|
  | `capitalizeDescriptions` | `true` | Start descriptions with a capital letter …|
  | `descriptionWithDot` | `false` | End descriptions with a period …|
  | `descriptionTag` | `false` | Put `@description` before the description …|
  | `addDefaultToDescription` | `true` | Add ``Default is `1` `` to the description of `@param {nu…|
| `commentLineStrategy`|`"singleLine"`| Put a short comment on one line:`"singleLine"`, `"multil…|
  | `separateTagGroups` | `false` | A blank line between different tags …|
  | `separateReturnsFromParam` | `false` | A blank line between `@param` and `@returns` …|
  | `bracketSpacing` | `false` | `{ number }` instead of `{number}` …|
- **`format.svelte`**
  Format Svelte components.
  `[fmt.svelte] sortOrder = "scripts-markup-styles-options"`
  | Key | Default | What it does …|
  | - | - | -…|
  | `sortOrder` | `"options-scripts-markup-styles"` | The order of `<svelte:options>`, the scripts, the markup,…|
  | `allowShorthand` | `true` | Print `a={a}` as `{a}` …|
  | `indentScriptAndStyle` | `true` | Indent the code in `<script>` and `<style>` …|
- **`format.ignorePatterns`**
  Skip the files that match.
  `[fmt] ignorePatterns = ["vendor/", "**/*.gen.ts"]`
- **`format.overrides`**
  Different options for some files.

```toml
[[fmt.overrides]]
files = ["*.test.ts", "scripts/**"]
excludeFiles = ["scripts/vendor/**"]
options = { printWidth = 120, sortImports = false }
```

- `files` and `excludeFiles` take a glob or an array of globs, relative to `bunfig.toml`. They use the same syntax as `B
- `options` takes the style options, `sortImports`, `sortTailwindcss`, `sortPackageJson`, `jsdoc`, `svelte`, and `parser
- **Every other flag**

```toml
[fmt]
editorconfig = false # --no-editorconfig
ignorePath = [".gitignore", ".formatignore"] # --ignore-path .gitignore --ignore-path .formatignore
insertFinalNewline = false # --no-insert-final-newline
logLevel = "warn" # --log-level warn
…
```

`[fmt]` also applies in a project with a `.prettierrc` or an `.oxfmtrc.json`, where a key overrides the config file as …

### Package manager

The `[install]` section configures the behavior of `bun install`.
`[install]`

- **`install.optional`**
  Whether to install optional dependencies.
  `[install] optional = true`
- **`install.dev`**
  Whether to install development dependencies.
  `[install] dev = true`
- **`install.peer`**
  Whether to install peer dependencies.
  `[install] peer = true`
- **`install.production`**
  Whether `bun install` runs in "production mode".
  `[install] production = false`
- **`install.exact`**
  Whether to set an exact version in `package.json`.
  `[install] exact = false`
- **`install.ignoreScripts`**
  Whether to skip lifecycle scripts during install.
  `[install] ignoreScripts = false`
- **`install.concurrentScripts`**
  The maximum number of concurrent lifecycle scripts to run at once.
  `[install] concurrentScripts = 5`
- **`install.saveTextLockfile`**
  If `false`, `bun install` generates a binary `bun.lockb` instead of a text-based `bun.lock` file when no lockfile is pr…
  `[install] saveTextLockfile = false`
- **`install.auto`**
  Configure Bun's auto-install behavior.
  `[install] auto = "auto"`
  | Value | Description …|
  | - | -…|
  | `"auto"` | Resolve modules from local `node_modules` if it exists. O…|
  | `"force"` | Always auto-install dependencies, even if `node_modules` …|
  | `"disable"` | Never auto-install dependencies. …|
  | `"fallback"` | Check local `node_modules` first, then auto-install any p…|
- **`install.prefer`**
  Configure how Bun resolves package versions against the npm registry when running scripts.
  `[install] prefer = "online"`
  | Value | Description …|
  | - | -…|
  | `"online"` | Default. Check the registry for stale packages as needed.…|
  | `"offline"` | Skip staleness checks and resolve packages from the local…|
  | `"latest"` | Always check npm for the latest matching versions. Equiva…|
- **`install.offline`**: `[install] offline = true`
- **`install.frozenLockfile`**
  When `true`, `bun install` does not update `bun.lock`.
  `[install] frozenLockfile = false`
- **`install.dryRun`**
  Whether `bun install` resolves dependencies without installing them.
  `[install] dryRun = false`
- **`install.globalDir`**
  The directory where Bun puts globally installed packages.
  `[install] globalDir = "~/.bun/install/global"`
- **`install.globalBinDir`**
  The directory where Bun links the binaries of globally installed packages.
  `[install] globalBinDir = "~/.bun/bin"`
- **`install.registry`**
  The default registry is `https://registry.npmjs.org/`.

```toml
[install]
# set default registry as a string
registry = "https://registry.npmjs.org"
# set a token
registry = { url = "https://registry.npmjs.org", token = "123456" }
…
```

- **`install.linkWorkspacePackages`**
  Whether to link workspace packages from the monorepo root to their respective `node_modules` directories.
  `[install] linkWorkspacePackages = true`
- **`install.scopes`**
  To configure a registry for a particular scope (for example, `@myorg/`), use `install.scopes`.
  `[install.scopes] myorg = "https://username:password@registry.myorg.com/" …`
- **`install.ca` and `install.cafile`**
  To configure a CA certificate, set `install.ca` to the certificate string or `install.cafile` to the path of a certific…
  `[install] ca = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----" cafile = "path/to/cafile"`
- **`install.cache`**: `[install.cache] dir = "~/.bun/install/cache" …`
- **`install.lockfile`**
  Whether to generate a lockfile on `bun install`.
  `[install.lockfile] save = true`
- **`install.linker`**
  See Isolated installs.
  `[install] linker = "hoisted"`
  | Value | Description | | - | - |
  | `"hoisted"` | Link dependencies in a shared `node_modules` directory. |
  | `"isolated"` | Link dependencies inside each package installation. |
- **`install.globalStore`**
  When using the `"isolated"` linker, share package installations across projects in a global virtual store at `/links/`.
  `[install] globalStore = true`
- **`install.publicHoistPattern`**
  When using the `"isolated"` linker, Bun hoists packages matching these glob patterns to the root `node_modules` directo…
  `[install] publicHoistPattern = ["*eslint*", "*prettier*"]`
- **`install.hoistPattern`**
  When using the `"isolated"` linker, Bun hoists packages matching these glob patterns to a fallback directory inside the…
  `[install] hoistPattern = ["*"]`
- **`install.hoist`**
  When using the `"isolated"` linker, Bun creates `node_modules/.bun/node_modules`.
  `[install] hoist = false`
- **`install.logLevel`**
  Set the log level for `bun install`.
  `[install] logLevel = "warn"`
- **`install.security.scanner`**
  Configure a security scanner to scan packages for vulnerabilities before installation.
  `bun add -d @oven/bun-security-scanner`
- Auto-install is off, also with `-i` or `--install`. Run `bun install` first
- Packages are scanned before installation
- Installation is cancelled if fatal issues are found
- Security warnings are displayed during installation
- **`install.minimumReleaseAge`**
  Configure a minimum age (in seconds) for npm package versions.
  `[install] minimumReleaseAge = 259200`
- **`install.minimumReleaseAgeExcludes`**
  An array of packages that are exempt from the `minimumReleaseAge` check.
  `[install] minimumReleaseAge = 259200 minimumReleaseAgeExcludes = ["@types/bun", "typescript@5.4.5"]`

### `bun run`

The `[run]` section configures the `bun run` command.

- **`run.shell` - use the system shell or Bun's shell**
  The shell used to run `package.json` scripts with `bun run` or `bun`.
  `[run] shell = "system"`
- **`run.bun` - auto alias `node` to `bun`**
  When `true`, Bun prepends `$PATH` with a `node` symlink that points to the `bun` binary for all scripts or executables …
  `[run] bun = true`
- **`run.silent` - suppress reporting the command being run**
  When `true`, `bun run` and `bun` don't print the command being run.
  `[run] silent = true`
- **`run.elide-lines` - truncate filtered output**
  Truncate each script's output to its last N lines when using `--filter` in a terminal.
  `[run] elide-lines = 10`
- **`run.noOrphans` - don't leave orphan processes behind**
  When `true`, Bun watches the process that spawned it and exits as soon as that parent goes away, even if the parent was…
  `[run] noOrphans = true`
