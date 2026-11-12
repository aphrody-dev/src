# Bun package manager
Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## bunx — `docs/pm/bunx.mdx`
> Run packages from npm
`bunx` is an alias for `bun x`.
`bunx cowsay "Hello world!"`
### Arguments and flags
To pass additional command-line flags and arguments through to the executable, place them after the executable name.
`bunx my-cli --foo bar`
### Shebangs
By default, Bun respects shebangs.
`bunx --bun my-cli`
### Package flag
**`--package ` or `-p `** - Run a binary from a specific package.
`bunx -p renovate renovate-config-validator bunx --package @angular/cli ng`

## Catalogs — `docs/pm/catalogs.mdx`
> Share common dependency versions across multiple packages in a monorepo
**Catalogs** share dependency versions across the packages in a monorepo.
### Overview
- Define version catalogs in the root `package.json`
- Reference those versions with the `catalog:` protocol
- Update every package at once by changing the version in one place
Catalogs matter most in large monorepos where dozens of packages depend on the same versions of key dependencies.
### How to Use Catalogs
- Directory Structure Example · 1. Define Catalogs in Root package.json · 2. Reference Catalog Versions in Workspace Packages · 3. Run Bun Install
### Catalog vs Catalogs
- **`catalog`** (singular): A single default catalog for commonly used dependencies
```json
  "catalog": {
   "react": "^19.0.0",
   "react-dom": "^19.0.0"
  }
```
- **`catalogs`** (plural): Multiple named catalogs for grouping dependencies
### Benefits of Using Catalogs
- **Consistency**: All packages use the same version of critical dependencies
- **Maintenance**: Update a dependency version in one place instead of across multiple `package.json` files
- **Clarity**: Makes it obvious which dependencies are standardized across your monorepo
- **Simplicity**: No extra version resolution strategies or external tools
### Real-World Example
**Root package.json**
```json
{
 "name": "react-monorepo",
 "workspaces": {
  "packages": ["packages/*"],
  "catalog": {
…
```
### Updating Versions
```json
"catalog": {
 "react": "^19.1.0",  // Updated from ^19.0.0
 "react-dom": "^19.1.0"  // Updated from ^19.0.0
}
```
Then run `bun install` to update all packages.
### Adding to the catalog with `bun add`
`bun add --catalog` adds the entry to the root catalog and writes `"catalog:"` to the current package; `--catalog=` add…
`bun add react --catalog`
### Lockfile Integration
Bun's lockfile tracks catalog versions, so installs are consistent across environments.
- The catalog definitions from your package.json
- The resolution of each cataloged dependency
```json
{
 "lockfileVersion": 2,
 "workspaces": {
  "": {
   "name": "react-monorepo",
…
```
### Limitations and Edge Cases
- Catalog references must match a dependency defined in either `catalog` or one of the named `catalogs`
- Bun ignores empty strings and whitespace in catalog names and treats them as the default catalog
- `catalog:default` is the same as `catalog:`. You can define the default catalog as either `catalog` or `catalogs.defau
- Invalid dependency versions in catalogs fail to resolve during `bun install`
- `catalog:` only works in the root and workspace `package.json` files. Inside a published package it fails to resolve. 
### Publishing
When you run `bun publish` or `bun pm pack`, Bun replaces `catalog:` references in your `package.json` with the resolve…

## bun add — `docs/pm/cli/add.mdx`
> Add packages to your project with Bun's fast package manager
`bun add preact`
Bun writes the package to `dependencies` unless you pass `--dev`, `--optional`, or `--peer`.
- Without a flag, Bun updates that entry in place. If two of `dependencies`, `devDependencies` and `optionalDependencies
- With `--dev`, `--optional`, `--peer`, or `--save-prod`, Bun moves the entry to the group you name. An entry in `peerDe
### `--dev`
**Alias** — `--development`, `-d`, `-D`
`bun add --dev @types/react bun add -d @types/react`
### `--optional`
`bun add --optional lodash`
### `--peer`
`bun add --peer @types/bun`
Bun installs peer dependencies by default, so no additional `devDependencies` entry is needed.
### `--save-prod`
`bun add --save-prod zod`
### `--exact`
To pin a package to the resolved version, use `--exact`.
`bun add react --exact bun add react -E`
### `--catalog`
In a workspace, `--catalog` writes the version to the root `package.json` catalog and adds `"catalog:"` to the current …
`bun add react --catalog bun add vitest --catalog=testing`
- If the catalog already has an entry, Bun reuses it and writes only `"catalog:"` to the current package. Pass an explic
- If you omit the version and the current `package.json` already has a range (`"react": "^18.2.0"`), Bun catalogs that r
- A package that already references `"catalog:"` keeps using that catalog.
- Attach the name with `=`: `--catalog=testing`, not `--catalog testing`.
- Bun catalogs tarball and git specifiers under the package's real name. It rejects relative paths and workspace package
### `--filter`
In a monorepo, add the package to the matching workspace(s) instead of the current directory's package.
```bash
bun add zod --filter api
bun add -d typescript --filter './packages/*'
bun add ./vendor/logger --filter '*'
bun remove zod --filter '*' --filter '!api'
```
- `*` matches every workspace package but not the root. To include the root, name it: `--filter '*' --filter ''`.
- If no workspace matches, Bun writes nothing and the command fails.
- Bun resolves local paths from the current directory and rewrites them relative to each selected package.
- Bun updates `bun.lock` for the whole repo but links only the selected workspaces into `node_modules`, as with `bun ins
- Cannot be combined with `--global`.
### `--global`
**Alias** — `bun add --global`, `bun add -g`, `bun install --global` and `bun install -g`
```bash
bun add --global cowsay # or `bun add -g cowsay`
cowsay "Bun!"
```
### Trusted dependencies
Unlike other npm clients, Bun does not execute arbitrary lifecycle scripts for installed dependencies, such as `postins…
```json
{
 "name": "my-app",
 "version": "1.0.0",
 "trustedDependencies": ["my-trusted-package"] // [!code ++]
}
```
### Git dependencies
`bun add git@github.com:moment/moment.git`
To install private repositories, your system needs the appropriate SSH credentials to access the repository.
### Tarball dependencies
A package name can correspond to a `.tgz` file at a URL.
`bun add zod@https://registry.npmjs.org/zod/-/zod-3.21.4.tgz`
### Local paths
A folder or a local `.tgz` file is resolved from the current directory and written relative to the `package.json` it is…
`bun add ../shared/logger bun add -g .`

## bun audit — `docs/pm/cli/audit.mdx`
> Check your installed packages for known security vulnerabilities
`bun audit`
Bun reads the package list from `bun.lock` (no `node_modules` required), sends it to the npm advisory endpoint, and pri…
- Filtering options · `--json` · `bun audit fix` · `bun audit fix --latest` · Exit code

## bun dedupe — `docs/pm/cli/dedupe.mdx`
> Remove duplicate versions of packages from bun.lock
Over time, `bun.lock` can accumulate several versions of the same package even though one of them satisfies every range.
`bun dedupe`
- `--check` and `--dry-run` · Notes

## bun info — `docs/pm/cli/info.mdx`
> Display package metadata from the npm registry
`bun info` displays package metadata from the npm registry.
### Usage
`bun info react`
`bun info react` prints the package's latest version, description, homepage, dependencies, and other metadata.
### Viewing specific versions
`bun info react@18.0.0`
A version range or a dist-tag selects the same version that `bun add` would install.
### Viewing specific properties
`bun info react version bun info react dependencies bun info react repository.url`
Property paths use the same grammar as `npm view` and `bun pm pkg`.
### JSON output
`bun info react --json bun info react version dist.tarball --json   # {"version": "...", "dist.tarball": "..."}`
`bun info` does not need a `package.json`.
### Alias
`bun pm view react  # equivalent to: bun info react`
### Examples
`bun info is-number bun info is-number@7.0.0 …`

## bun install — `docs/pm/cli/install.mdx`
> Install packages with Bun's fast package manager
### Basic Usage
`bun install react bun install react@19.1.1 # specific version bun install react@latest # specific tag`
The `bun` CLI contains a Node.js-compatible package manager designed to be a dramatically faster replacement for `npm`,…
- **Installs** all `dependencies`, `devDependencies`, and `optionalDependencies`. Bun installs `peerDependencies` by def
- **Runs** your project's `{pre|post}install` and `{pre|post}prepare` scripts at the appropriate time. For security reas
- **Writes** a `bun.lock` lockfile to the project root.
### Logging
`bun install --verbose # debug logging bun install --silent  # no logging`
---
### Lifecycle scripts
Unlike other npm clients, Bun does not execute arbitrary lifecycle scripts like `postinstall` for installed dependencie…
```json
{
 "name": "my-app",
 "version": "1.0.0",
 "trustedDependencies": ["my-trusted-package"] // [!code ++]
}
```
### Workspaces
Bun supports `"workspaces"` in package.json.
```json
{
 "name": "my-app",
 "version": "1.0.0",
 "workspaces": ["packages/*"], // [!code ++]
 "dependencies": {
…
```
### Installing dependencies for specific packages
In a monorepo, you can install the dependencies for a subset of packages using the `--filter` flag.
`bun install --filter '!pkg-c' bun install --filter './packages/pkg-a'`
### Overrides and resolutions
Bun supports npm's `"overrides"` and Yarn's `"resolutions"` in `package.json`.
```json
{
 "name": "my-app",
 "dependencies": {
  "foo": "^2.0.0"
 },
…
```
### Global packages
To install a package globally, use the `-g`/`--global` flag.
```bash
bun install --global cowsay # or `bun install -g cowsay`
cowsay "Bun!"
```
### Production mode
`bun install --production`
`--production` implies `--frozen-lockfile`.
- **Offline installs**
### Omitting dependencies
To omit dev, peer, or optional dependencies, use the `--omit` flag.
`bun install --omit dev …`
### Dry run
`bun install --dry-run`
Bun resolves the dependency tree and lists every package in it, installed already or not.
- install packages into `node_modules`
- change an existing `package.json`
- write `bun.lock` or `yarn.lock`
- run your project's lifecycle scripts
### Non-npm dependencies
Bun supports installing dependencies from Git, GitHub, and local or remotely-hosted tarballs.
```json
{
 "dependencies": {
  "dayjs": "git+https://github.com/iamkun/dayjs.git",
  "lodash": "git+ssh://github.com/lodash/lodash.git#4.17.21",
  "moment": "git@github.com:moment/moment.git",
…
```
### Installation strategies
Bun supports two package installation strategies that determine how dependencies are organized in `node_modules`:
- Hoisted installs · Isolated installs · Default strategy
### Minimum release age
To protect against supply chain attacks where malicious packages are quickly published, you can configure a minimum age…
`bun add @types/bun --minimum-release-age 259200 # seconds bun install --minimum-release-age 259200 --minimum-release-age-excludes @types/node,typescript@5.4.5`
- A package name (`"typescript"`) exempts every version of that package, including versions published in the future.
- A package name followed by one or more exact versions (`"typescript@5.4.5"`, `"@types/node@20.11.0"`, `"esbuild@0.21.4
- It only affects new package resolution; existing packages in `bun.lock` remain unchanged
- Bun filters all dependencies (direct and transitive) to meet the age requirement when resolving them
- When the age gate blocks versions, a stability check detects rapid bugfix patterns
- If multiple versions were published close together just outside your age gate, Bun extends the filter to skip those po
### Configuration
- Configuring `bun install` with `bunfig.toml` · Configuring with environment variables
### CI/CD
```yaml
name: bun-types
jobs:
 build:
  name: build-app
  runs-on: ubuntu-latest
…
```
For CI/CD environments that want to enforce reproducible builds, use `bun ci` to fail the build if the package.json is …
### Platform-specific dependencies?
Bun stores normalized `cpu`, `os` and `libc` values from npm in the lockfile, along with the resolved packages.
- **`--cpu`, `--os` and `--libc` flags**
### Peer dependencies?
- If a package above the one with the peer dependency depends on that name, the peer uses that version. "Above" means it
- Otherwise, Bun picks one version that satisfies every package with a peer dependency on that name. It prefers a versio
- If no version satisfies all of them, Bun doesn't install a copy for each one, because packages like `react` or `graphq
The isolated linker applies these rules everywhere a package is used.
`warn: incorrect peer dependency "react@17.0.2": "react-dom@18.3.1" requires "react@^18.3.1"`
### Lockfile
`bun.lock` is Bun’s lockfile format.
### Cache
Bun caches registry metadata (the manifest of each package) for 5 minutes.
`bun add <pkg> --force bun install --force`
### Platform-specific backends
For performance, `bun install` uses different system calls to install dependencies depending on the platform.
`rm -rf node_modules bun install --backend hardlink`
### npm registry metadata
Bun uses a binary format for caching npm registry responses.
### Flags from npm, Yarn and pnpm
Command lines written for npm, Yarn or pnpm keep working.
| Flag …| What Bun does |
| -…| - |
| `--save-dev`, `--save-exact`, `--save-optional`, `--save-…| `--dev`, `--exact`, `--optional`, `--peer` |
| `--no-optional`, `--ignore-optional` …| `--omit=optional` |
| `--only=production`, `--only=prod` …| `--omit=dev` |
| `--production=true` …| `--production` |
| `--package-lock-only` …| `--lockfile-only` |
| `--immutable` …| `--frozen-lockfile` |
| `--location=global` …| `--global` |
| `--save-catalog` …| `--catalog` |
- `--save-exact` is `--exact`. `--save-dev`, `--save-optional`, `--save-peer` and `--save-catalog` do nothing.
- `--production=true` is an error.
- `--no-optional` does not update `optionalDependencies`, but it installs them. `--ignore-optional` is `--omit=optional`
### pnpm migration
Bun migrates projects from pnpm automatically.
`bun install`
- Lockfile Migration · Workspace Configuration · Catalog Dependencies · Configuration Migration · Requirements and limitations
### Yarn migration
Bun migrates a `yarn.lock` the same way when no `bun.lock` exists.
- npm packages, including `npm:` aliases, dist-tags, and per-package tarball URLs (`__archiveUrl`). Integrity hashes are
- ranges in `package.json` that spell out Yarn's default protocol: `npm:^1.0.0` and `npm:next` are rewritten to `^1.0.0`
- workspaces (from the `workspaces` globs of the root `package.json`) and `workspace:` ranges
- `patch:` dependencies: patches in your project (for example `.yarn/patches`) are added to `patchedDependencies` in `pa
- `file:` folders and tarballs, tarball URLs, and git / `github:` dependencies (pinned to the locked commit)
- `link:` dependencies, which stay links. `link:dir` is rewritten to `link:./dir`, because to Bun a bare name after `lin

## bun link — `docs/pm/cli/link.mdx`
> Link local packages for development
Use `bun link` in a local directory to register the current package as a "linkable" package.
`cd /path/to/cool-pkg cat package.json bun link`
### Linking a directory by path
`link:` also accepts a path, as in Yarn and pnpm.
```json
{
 "dependencies": {
  "design-tokens": "link:./vendor/design-tokens",
  "shared": "link:../shared"
 }
…
```
- Anything that is not a package name is a path: `link:./dir`, `link:../dir`, `link:vendor/dir`, an absolute path. `link
- The directory must exist. It does not need a `package.json`.
- The directory's own dependencies are not installed. Use `file:` for a copy whose dependencies are installed, or make t
- Only your project may use a path: the root `package.json`, a workspace, a `file:` directory one of them depends on, or
### Unlinking
Use `bun unlink` in the root directory to unregister a local package.
`cd /path/to/cool-pkg bun unlink`

## bun outdated — `docs/pm/cli/outdated.mdx`
> Check for outdated dependencies
`bun outdated` displays a table of the dependencies in your project that have newer versions available.
`bun outdated`
### Version Information
- **Current**: The version currently installed
- **Update**: The latest version that satisfies your package.json version range
- **Latest**: The version that the `latest` tag in the registry points to
A dependency that is ahead of `latest`, such as a prerelease, is listed when `bun update` would change its version.
- Dependency Filters · Workspace Filters · Catalog Dependencies

## bun patch — `docs/pm/cli/patch.mdx`
> Persistently patch node_modules packages in a git-friendly way
`bun patch` persistently patches packages in `node_modules` in a maintainable, git-friendly way.
- Generates `.patch` files that Bun applies to dependencies in `node_modules` on install
- You can commit `.patch` files to your repository and reuse them across installs, projects, and machines
- `"patchedDependencies"` in `package.json` keeps track of patched packages. Bun only reads it from the root `package.js
- Patches packages in `node_modules/` while preserving the integrity of Bun's Global Cache
- Test your changes locally before committing them with `bun patch --commit `
- To preserve disk space and keep `bun install` fast, Bun commits patched packages to the Global Cache and shares them a
- Step 1. Prepare the package for patching · Step 2. Test your changes locally · Step 3. Commit your changes · Removing a patch · A missing patch file

## bun pm — `docs/pm/cli/pm.mdx`
> Package manager utilities
The `bun pm` command group is a set of utilities for working with Bun's package manager.
### pack
`bun pm pack`
`bun pm pack` creates a `.tgz` file containing all files that would be published to npm, following the same rules as `n…
### Examples
`bun pm pack`
### Options
- `--dry-run`: Perform all tasks except writing the tarball to disk. Shows what would be included.
- `--destination `: The directory to save the tarball in.
- `--filename `: An exact file name for the tarball.
- `--ignore-scripts`: Skip running pre/postpack and prepare scripts.
- `--gzip-level `: Set the gzip compression level, from 0 to 9 (default 9).
- `--quiet`: Print only the tarball filename, suppressing the rest of the output. Useful in scripts.
> **Note:** `--filename` and `--destination` cannot be used at the same time.
### Output Modes
**Default output:**
`bun pm pack`
### bin
`bun pm bin`
### ls
To print a list of installed dependencies in the current project and their resolved versions, excluding their dependenc…
`bun pm ls bun list`
### licenses
List every installed package grouped by license, as read from each package's `package.json` in `node_modules`.
`bun pm licenses bun pm licenses ls`
| Flag | Description …|
| - | -…|
| `--json` | Print a JSON object keyed by license …|
| `--long` | Also print each package's `author`, `description`, and `h…|
| `--prod`, `-p` | Skip `devDependencies` (same as `--omit=dev`) …|
| `--dev`, `-D` | Only list what `devDependencies` pull in …|
| `--omit=<dev\|optional\|peer>` | Skip a dependency type, as with `bun install` …|
| `--filter <pattern>`, `-F` | Only list dependencies of the matching workspaces (filter…|
### diff
```bash
bun pm diff react                     # the version in bun.lock → latest
bun pm diff react@18.2.0 19.0.0       # two published versions
bun pm diff react@18.2.0..19.0.0      # same thing
bun pm diff ./vendored-pkg pkg@2.1.0  # a folder against a published version
bun pm diff                           # in a package folder: what is published → this folder
```
On a terminal, code is compared by meaning and shown as written.
- `1 + 1` vs `2`, `'a'` vs `"a"`, `!0` vs `true`, a re-wrapped call, a whole-file reformat, or a local renamed consisten
- A comment edit, a changed type annotation, or any change in control flow is a change, shown in the author's words.
- Unchanged text whose meaning moved — code that became unreachable, or dead code that came alive because a condition el
- Minified bundles have no readable original, so an un-minified re-print stands in for it (one declaration, call and pro
- The summary at the end calls out what a reviewer looks for first: new `install`/`postinstall` scripts, dependency and 
- Line tints follow the terminal: light or dark is taken from `COLORFGBG` or by asking the terminal for its background c
| Flag | Description …|
| - | -…|
| `--raw`, `--unformatted` | Compare bytes as-is; skip the JS/CSS/JSON re-print …|
| `--minify` | Also fold equivalent syntax (`!0`/`true`, quote style, re…|
| `--unminify` | Rename short locals in lockstep in every JS file, not jus…|
| `-w`, `--ignore-space` | On a terminal, show files that differ only in whitespace …|
| `--stat` | One line per file with a change count and bar instead of …|
| `--name-only` | Only list the files that differ, marked `A`dded / `M`odif…|
| `-U <n>`, `--unified` | Lines of context around each change (default 3) …|
| `--diff <spec>` | npm-compatible way to name a side; may be given twice …|
### whoami
Print your npm username.
`bun pm whoami`
### hash
`bun pm hash`
### cache
`bun pm cache`
This deletes everything in the cache directory, including the global store at `/links/`.
- The age of a package is the time since Bun downloaded it. A package that you still install from the cache every day co
- Where the file system records access times (Linux with the default `relatime`), the age is the time since an install l
- The next `bun install` that needs a removed package downloads it again. Keep this in mind before `bun install --offlin
- The global store in `/links/`, cached git clones and package manifests stay.
- The size in the summary is the size of the removed files. A file that a `node_modules` tree hardlinks stays on disk un
- `pack` writes every package of `bun.lock` that is in the local cache. It warns about packages it had to leave out, exc
### fetch
`bun pm fetch`
- Dependencies resolve the way `bun install` resolves them, but `node_modules` is not created, lifecycle scripts do not 
- With a lockfile, only what is missing from the cache is downloaded: the tarball URLs and git commits the lockfile reco
- In a monorepo, you only need the root `package.json` and the lockfile. Bun downloads the dependencies of every workspa
- A later `bun install` (or `bun install --offline`) installs from the cache. Without a lockfile, `--offline` can't tell
- Packages for another operating system or CPU are skipped; pass `--os` / `--cpu` to fetch them.
- `-g` fetches the dependencies of globally installed packages.
### migrate
`bun pm migrate`
Pass `--dry-run` to run the migration without writing `bun.lock` or `package.json`.
### untrusted
`bun pm untrusted`
### trust
`bun pm trust <names>`
- `--all`: Trust all untrusted dependencies.
- `--dry-run`: Print the scripts that would run and the packages that would be trusted, without running scripts or writi
A package that does not come from the npm registry (a tarball, `git`, `file:` or `link:` dependency) also has to be dec…
### default-trusted
`bun pm default-trusted`
See the current list on GitHub.
### version
`bun pm version`
Supports `patch`, `minor`, `major`, `premajor`, `preminor`, `prepatch`, `prerelease`, `from-git`, or specific versions …
### pkg
Manage `package.json` data with get, set, delete, and fix operations.
```bash
scripts.build              # dot notation
contributors[0]            # array access
workspaces.0               # dot with numeric index
scripts[test:watch]        # bracket for special chars
exports[./package.json]    # a bracketed name is literal, dots included
…
```

## bun prune — `docs/pm/cli/prune.mdx`
> Remove packages that are not in bun.lock from node_modules
`bun prune` never contacts the registry, never runs lifecycle scripts, and never modifies `bun.lock` or `package.json`.
`bun prune`
- `--production` · `--dry-run` · `--check` · `--filter` · Notes

## bun publish — `docs/pm/cli/publish.mdx`
> Use `bun publish` to publish a package to the npm registry
`bun publish` packs your package into a tarball and strips catalog and workspace protocols from the `package.json`, res…
`## Publishing the package from the current working directory bun publish`
- `--recursive` and `--filter` · `--access` · `--tag` · `publishConfig.registry` · `--dry-run` · `--tolerate-republish` · `--gzip-level` · `--auth-type` · `--otp` · `--provenance`

## bun remove — `docs/pm/cli/remove.mdx`
> Remove dependencies from your project
### Basic Usage
**Alias** — `bun rm`, `bun uninstall`, `bun r`
`bun remove ts-node`
### `--filter`
In a monorepo, remove the package from the matching workspace(s) instead of the current directory's package, using the …
`bun remove zod --filter api bun remove zod --filter '*'`

## bun update — `docs/pm/cli/update.mdx`
> Update dependencies to the newest versions their ranges allow
To upgrade your Bun CLI version, see `bun upgrade`.
`bun update`
- How `package.json` is rewritten · What is held back
### `--interactive`
`bun update --interactive bun update -i`
`--interactive` opens a terminal interface listing every outdated direct dependency.
- Interactive Interface · Keyboard Controls · Visual Indicators · Package Grouping
### `--recursive` and `--filter`
In a monorepo, `bun update` only rewrites the `package.json` of the workspace you run it in.
- `--recursive` (`-r`) updates every workspace's `package.json`.
- `--filter ` (`-F`) updates only the matching workspaces, using the filter syntax. As with `bun install --filter`, Bun 
```sh
bun update --recursive
bun update --filter './packages/*'
bun update -i -r
bun update zod -r
bun update zod --filter '...^ui'
```
### `--dev`, `--prod`, `--no-optional`
- `--dev` (`-D`) updates `devDependencies` only.
- `--prod` (`-P`) updates `dependencies` and `optionalDependencies` only.
- `--no-optional` skips `optionalDependencies`.
They combine with names, patterns, `--latest`, and `--interactive`.
```sh
bun update --dev
bun update --prod --latest
bun update -D '@types/*'
bun update -i --prod
```
### `--depth 0`
By default, `bun update` also moves transitive dependencies to the newest version their dependents' ranges allow.
`bun update --depth 0 bun update --depth 0 --latest bun update --depth 0 -r`
### `--global`
`bun update -g bun update -g typescript`
### `--latest`
By default, `bun update` updates each dependency to the latest version that satisfies the version range in your `packag…
`bun update --latest bun update -L`
- `bun update` would update to a version that matches `17.x`.
- `bun update --latest` would update to a version that matches `18.x` or later.

## bun why — `docs/pm/cli/why.mdx`
> Explain why a package is installed
`bun why` explains why a package is installed in your project by showing the dependency chain that led to it.
### Usage
`bun why <package>`
### Arguments
- ``: The name of the package to explain, or the alias a `package.json` gives it. Supports glob patterns like `@org/*` o
### Options
- `--top`: Show only the top-level dependencies instead of the complete dependency tree.
- `--depth `: Maximum depth of the dependency tree to display.
### Examples
`bun why react`
Find the package behind an alias.
### Understanding the Output
- The package name and version being queried
- The dependency chain that led to its installation
- The type of dependency (dev, peer, optional, or production)
- The version requirement specified in each package's dependencies
For nested dependencies, the command shows the complete dependency tree by default, with indentation indicating the rel…
`bun why pkg-x`

## bun --filter — `docs/pm/filter.mdx`
> Select packages by pattern in a monorepo using the --filter flag
The `--filter` (or `-F`) flag selects packages in a monorepo by pattern.
### Matching
- Package Name `--filter <pattern>` · Package Path `--filter ./<glob>` · Directory `--filter '{<dir>}'` · Dependency relations `--filter 'foo...'`
### `bun install` and `bun outdated`
By default, `bun install` installs dependencies for every package in the monorepo.
`bun install --filter '!pkg-c' bun install --filter './packages/*' …`
### Running scripts with `--filter`
`bun --filter <pattern> <script>`
!Terminal Output
- Running scripts in workspaces · Parallel and sequential mode · Dependency Order

## Global cache — `docs/pm/global-cache.mdx`
> How Bun stores and manages packages in its global cache
Bun stores every package downloaded from the registry in a global cache at `~/.bun/install/cache`, or the path set by t…
`[install.cache] dir = "~/.bun/install/cache" …`
### Minimizing re-downloads
When installing a package, if the cache already contains a version in the range specified by `package.json`, Bun uses t…
### Fast copying
Once a package is downloaded into the cache, Bun still needs to copy those files into `node_modules`.
### Saving disk space
On Linux and Windows, Bun uses hardlinks to "copy" a module into a project's `node_modules` directory, so the contents …
- **`hardlink`**: Default on Linux and Windows.
- **`clonefile`**: Default on macOS.
- **`clonefile_each_dir`**: Similar to `clonefile`, except it clones each file individually per directory. It is only av
- **`copyfile`**: The fallback used when any of the above fail. It is the slowest option. On macOS, it uses `fcopyfile()
- **`symlink`**: Symlinks each file instead of copying it. Only hoisted installs use it: `--backend=symlink` applies it 
`bun install --backend symlink node --preserve-symlinks ./foo.js`

## Global virtual store — `docs/pm/global-store.mdx`
> Install packages once. Every project links to the same copy.
Every project on your machine depends on the same handful of heavy packages — `typescript`, `next`, `webpack`, `@babel/…
### Enabling
The global virtual store is **off by default**.
`[install] linker = "isolated" globalStore = true`
### Why it's fast
Without the global store, the isolated linker calls `clonefileat()` (macOS) or `link()`/`copyfile()` (other platforms) …
```
Sort by top of stack (bun install --linker isolated, warm cache):
  clonefileat        891 / 934 samples
  __openat            15
  __read_nocancel     10
```
### Benchmarks
Warm CI install on a 1,400-package React/webpack/Babel/jest fixture, Apple Silicon macOS, `hyperfine --warmup 3 --runs …
| | wall time | system time | `clonefileat` | total syscalls |
| - | - | - | - | - |
| `--linker hoisted` | 823.9 ms | 477 ms | 1,387 | 7,857 |
| `--linker isolated`, `globalStore=false` | 840.9 ms | 1,256 ms | 1,387 | — |
| **`--linker isolated`, global store** | **124.8 ms** | **94 ms** | **0** | **4,957** |
- Disk · Real-world cold→warm
### Directory structure
```bash
~/.bun/install/cache/
├── react@18.3.1@@@1/                     # Package cache (unchanged)
│   └── ...package files...
└── links/                                # Global virtual store
  └── react@18.3.1-5664d3cd670b3205/    # <storepath>-<entry hash>
…
```
The hash also covers a version number of the entry layout.
### What stays project-local
An entry only lives in the global store when it can be safely shared.
- the package has a **patch** applied via `bun patch` — the patched contents are project-specific;
- the package is listed in **`trustedDependencies`** (or trusted via `bun add --trust`) — its lifecycle script may mutat
- the package is a direct or transitive **dependency of a trusted package** — the script can write through the trusted p
- the package, or **any** dependency it links to, is a `workspace:`, `file:`, or `link:` dependency — those resolve to p
- the package has a **peer dependency typed by an `@types/*` package of the project** (a library that peers on `react` i
### Peer dependencies
Bun folds resolved peer dependencies (required and optional) into each global entry as dep symlinks.
### Tradeoffs
- Phantom-dependency fallback · `node_modules` is mostly symlinks · Disk usage · Concurrency
### Related documentation
- Package manager > Isolated installs — The linker the global store builds on
- Package manager > Global cache — Where downloaded packages are stored
- Runtime > bunfig — `bunfig.toml` reference

## Isolated installs — `docs/pm/isolated-installs.mdx`
> Strict dependency isolation similar to pnpm's approach
Bun provides an alternative package installation strategy called **isolated installs** that creates strict dependency i…
### What are isolated installs?
Isolated installs create a non-hoisted dependency structure where packages can only access their explicitly declared de…
- **Key benefits**
### Using isolated installs
- Command line · Configuration file · Default behavior
### How isolated installs work
- Directory structure · Resolution algorithm · Workspace handling
### Comparison with hoisted installs
| Aspect | Hoisted (npm/Yarn) | Isolated (pnpm-like) |
| - | - | - |
| **Dependency access** | Packages can access any hoisted dependency | Packages only see declared dependencies |
| **Phantom dependencies** | ❌ Possible | ✅ Prevented |
| **Disk usage** | ✅ Lower (shared installs) | ✅ Similar (uses symlinks) |
| **Determinism** | ❌ Less deterministic | ✅ More deterministic |
| **Node.js compatibility** | ✅ Standard behavior | ✅ Compatible via symlinks |
| **Best for** | Single projects, legacy code | Monorepos, strict dependency management |
### Advanced features
- Peer dependency handling · Strict resolution with `install.hoist = false` · Global virtual store · Backend strategies · Debugging isolated installs
### Troubleshooting
- Compatibility issues · Performance considerations
### Migration guide
- From npm/Yarn · From pnpm
### When to use isolated installs
**Use isolated installs when:**
- Working in monorepos with multiple packages
- Strict dependency management is required
- Preventing phantom dependencies is important
- Building libraries that need deterministic dependencies
- Working with legacy code that assumes flat `node_modules`
- Compatibility with existing build tools is required
### Related documentation
- Package manager > Workspaces — Monorepo workspace management
- Package manager > Lockfile — Understanding Bun's lockfile format
- CLI > install — Complete `bun install` command reference

## Lifecycle scripts — `docs/pm/lifecycle.mdx`
> How Bun handles package lifecycle scripts securely
Packages on `npm` can define _lifecycle scripts_ in their `package.json`.
- `preinstall`: Runs before the package is installed
- `postinstall`: Runs after the package is installed
- `preuninstall`: Runs before the package is uninstalled
- `prepublishOnly`: Runs before the package is published
### `postinstall`
The `postinstall` script is particularly important.
```json
{
 "name": "my-app",
 "version": "1.0.0",
 "dependencies": {
  "node-sass": "^6.0.1"
…
```
### `trustedDependencies`
```json
{
 "name": "my-app",
 "version": "1.0.0",
 "trustedDependencies": ["node-sass"] // [!code ++]
}
```
After adding the package to `trustedDependencies`, run `bun install`.
- **Behavior of the `trustedDependencies` field**
### `--ignore-scripts`
To disable lifecycle scripts for all packages, use the `--ignore-scripts` flag.
`bun install --ignore-scripts`
### Environment variables
| Variable …| Value |
| -…| - |
| `npm_lifecycle_event` …| The name of the script, such as `postinstall` |
| `npm_lifecycle_script` …| The command of the script |
| `npm_package_json`, `npm_package_name`, `npm_package_vers…| From the `package.json` of the package the script is in |
| `npm_package_config_<key>` …| The strings in `config` of that `package.json` |
| `npm_config_local_prefix`, `INIT_CWD` …| The project directory, and where `bun install` ran |

## Lockfile — `docs/pm/lockfile.mdx`
> Bun's lockfile format and configuration
`bun install` creates a lockfile called `bun.lock`.
- Should it be committed to git? · Generate a lockfile without installing? · Can I opt out? · Text-based lockfile · Automatic lockfile migration

## .npmrc support — `docs/pm/npmrc.mdx`
Bun loads configuration options from `.npmrc` files, so you can reuse your existing registry and scope configuration.
- `~/.npmrc` (or `$XDG_CONFIG_HOME/.npmrc`)
- `./.npmrc`
- `bunfig.toml` (global, then project)
- `BUN_CONFIG_REGISTRY` / `NPM_CONFIG_REGISTRY` and `BUN_CONFIG_TOKEN` / `NPM_CONFIG_TOKEN` environment variables
- Command-line flags such as `--registry`
### Which files are read
Bun reads up to two `.npmrc` files.
- The user-level file. This is the file `NPM_CONFIG_USERCONFIG` (npm's `userconfig` option) points at when that variable
- The `.npmrc` next to your project's root `package.json`.
### Supported options
- Set the default registry · Set the registry for a specific scope · Configure options for a specific registry · How credentials are matched · `link-workspace-packages`: Control workspace package installation · `save-exact`: Save exact versions · `ignore-scripts`: Skip lifecycle scripts · `dry-run`: Preview changes without installing · `cache`: Configure cache directory · `ca` and `cafile`: Configure CA certificates · `omit` and `include`: Control dependency types · `install-strategy` and `node-linker`: Installation strategy · `public-hoist-pattern` and `hoist-pattern`: Control hoisting

## Overrides and resolutions — `docs/pm/overrides.mdx`
> Control metadependency versions with npm overrides and Yarn resolutions
Bun supports npm's `"overrides"` and Yarn's `"resolutions"` in `package.json`.
```json
{
 "name": "my-app",
 "dependencies": {
  "foo": "^2.0.0"
 },
…
```
### `"overrides"`
Add `bar` to the `"overrides"` field in `package.json`.
```json
{
 "name": "my-app",
 "dependencies": {
  "foo": "^2.0.0"
 },
…
```
- a bundled dependency and an optional peer dependency
- a peer or optional dependency that shares its version with a dependency the override does not apply to
- a name that one `package.json` lists in two groups, when the override applies to only one of the two ranges
### `"resolutions"`
`"resolutions"` is Yarn's alternative to `"overrides"`, with similar syntax.
```json
{
 "name": "my-app",
 "dependencies": {
  "foo": "^2.0.0"
 },
…
```
### Values
A value can be any dependency specifier, not only a version range.
```json
{
 "name": "my-app",
 "workspaces": {
  "packages": ["packages/*"],
  "catalog": {
…
```
### Nested overrides
You can scope a rule to one parent package, so it only applies to that package's direct dependency.
```json
{
 "name": "my-app",
 "overrides": {
  "micromatch": {
   ".": "^4.0.5",
…
```
### Version-scoped overrides
The key can carry a version selector so the rule only applies to dependents whose declared range overlaps it.
```json
{
 "name": "my-app",
 "overrides": {
  "semver@<7.5.2": "7.5.2",
  "webpack>terser@4": "4.8.1",
…
```
- `"foo@catalog:"` (or `"foo@catalog:name"`) applies to dependents that declare `foo` with that catalog.
- `"my-foo@npm:foo@^1"` applies to an `npm:` alias named `my-foo` that points at `foo` with an overlapping range. No oth
### Limitations
- Bun supports only one parent level. It ignores `a>b>c`, `a/b/c`, and deeper object nesting with a warning.
- Bun does not support pnpm's `"pkg@"` (empty selector) and `"-"` (remove dependency) forms, and skips them with a warni
- Bun writes a lockfile containing nested or version-scoped rules as `lockfileVersion` 3, which older versions of Bun ca

## Package extensions — `docs/pm/package-extensions.mdx`
> Add missing dependencies and peerDependencies to third-party packages with packageExtensions
Some packages `require()` a package they never declare.
```json
{
 "name": "my-app",
 "dependencies": {
  "react": "^18.0.0",
  "react-redux": "^7.0.0",
…
```
- **Key**: a package name, optionally with a semver range (`react-redux@7`, `@scope/pkg@^1.2`). Without a range it appli
- **Value**: `dependencies`, `optionalDependencies`, `peerDependencies` and `peerDependenciesMeta`, as in a `package.jso
- **The package wins**: an entry is ignored when the package declares a dependency of that name itself, in any group. To
- `peerDependenciesMeta` with `"optional": true` also makes a peer optional that the package declares itself.
- When several keys match a package, the first one that names a dependency wins.
- A specifier is a version, a range, a tag, an `npm:` alias, a git repository or a tarball URL. A key that holds `file:`
### Lockfile
The added entries are written to `bun.lock` with the package's own dependencies, so `bun install --frozen-lockfile` rep…
```json
{
 "packageExtensions": {
  "legacy-plugin@2.0.3": { "dependencies": ["lodash"], "optionalPeers": ["webpack"] },
  "react-redux@7.2.9": { "peerDependencies": ["react"] }
 }
…
```
### Migrating
`bun install` and `bun pm migrate` copy `pnpm.packageExtensions`, `packageExtensions` in `pnpm-workspace.yaml` and `pac…

## Scopes and registries — `docs/pm/scopes-registries.mdx`
> Configure private registries and scoped packages
The default registry is `registry.npmjs.org`.
```toml
[install]
# set default registry as a string
registry = "https://registry.npmjs.org"
# set a token
registry = { url = "https://registry.npmjs.org", token = "123456" }
…
```
- **`.npmrc`**

## Security Scanner API — `docs/pm/security-scanner-api.mdx`
Bun's package manager can scan packages before installing them, to catch supply chain attacks and known vulnerabilities.
### Quick Start
`[install.security] scanner = "@oven/bun-security-scanner" # example name, replace with your scanner's package`
- Scans all packages before installation
- Displays security warnings and advisories
- Cancels installation if the scanner finds fatal advisories
---
### How It Works
Security scanners analyze packages during `bun install`, `bun add`, and every other command that installs packages, suc…
- Known security vulnerabilities (CVEs)
- Malicious packages
- License compliance issues
- **Security Levels**
### Using Pre-built Scanners
Security companies publish Bun security scanners as npm packages.
- Installing a Scanner · Configuring the Scanner · Enterprise Configuration · Authoring your own scanner
### Related
- Configuration (bunfig.toml)
- Package Manager
- Security Scanner Template

## Workspaces — `docs/pm/workspaces.mdx`
> Develop complex monorepos with multiple independent packages
Bun supports `workspaces` in `package.json`.
```txt
<root>
├── README.md
├── bun.lock
├── package.json
├── tsconfig.json
…
```
- **Split code into logical parts.** If one package relies on another, add it as a dependency in `package.json`. If pack
- **Bun can de-duplicate dependencies.** If `a` and `b` share a common dependency, Bun _hoists_ it to the root `node_mod
- **Run scripts in multiple packages.** Use the `--filter` flag to run `package.json` scripts in several packages at onc
### Self-contained workspaces
With the hoisted linker, dependencies shared by several workspaces are hoisted to the root `node_modules`.
```json
{
 "name": "desktop",
 "installConfig": { "hoistingLimits": "workspaces" }
}
```
### Share versions with Catalogs
When many packages need the same dependency versions, define those versions once in a catalog in the root `package.json…
- 28x faster than `npm install`
- 12x faster than `yarn install` (v1)
- 8x faster than `pnpm install`
