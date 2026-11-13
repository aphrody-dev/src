# Bun bundler (bun build) and compiler (--compile)
Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## CSS — `docs/bundler/css.mdx`
> Bun's bundler has built-in support for CSS with modern features
- Transpiling modern/future features to work on all browsers (including vendor prefixing)
- Minification
- CSS Modules
- Tailwind (through a native bundler plugin)
### Transpiling
Transpiling and vendor prefixing are enabled by default, so you can use modern and future CSS features without worrying…
### Browser Compatibility
- Edge 80+
- Firefox 78+
- Chrome 80+
- Safari 14+
- Opera 67+
### Syntax Lowering
- Nesting · Color mix · Relative colors · LAB colors · Color function · HWB colors · Color notation · light-dark() color function · Logical properties · :dir() selector · :lang() selector · :is() selector · :not() selector · Math functions · Media query ranges · Shorthands · Double position gradients · system-ui font
### CSS Modules
- Detecting CSS module files (`.module.css`) with no configuration
- Composition (`composes` property)
- Importing CSS modules into JSX/TSX
- Warnings/errors for invalid usages of CSS modules
A CSS module is a CSS file (with the `.module.css` extension) where all class names and animations are scoped to the fi…
- Getting started · Composition · Composing from a separate CSS module file

## esbuild — `docs/bundler/esbuild.mdx`
> Migration guide from esbuild to Bun's bundler
Bun's bundler API is heavily inspired by esbuild.
### Performance
Bun's bundler is 1.75x faster than esbuild on esbuild's three.js benchmark.
### CLI API
`esbuild <entrypoint> --outdir=out --bundle bun build <entrypoint> --outdir=out`
In Bun's CLI, boolean flags like `--minify` take no argument.
| esbuild | bun build | Notes …|
| - | - | -…|
| `--bundle` | n/a | Bun always bundles; use `--no-bundle` to disable it. …|
| `--define:K=V` | `--define K=V` | Small syntax difference; no colon.<br/>`esbuild --define:…|
| `--external:<pkg>` | `--external <pkg>` | Small syntax difference; no colon.<br/>`esbuild --externa…|
| `--format` | `--format` | Bun supports `"esm"`, `"cjs"`, and `"iife"`. esbuild defa…|
| `--loader:.ext=loader` | `--loader .ext:loader` | Bun supports a different set of built-in loaders than esb…|
| `--minify` | `--minify` | No differences …|
| `--outdir` | `--outdir` | No differences …|
| `--outfile` | `--outfile` | No differences …|
### JavaScript API
| esbuild.build() | Bun.build() | Notes …|
| - | - | -…|
| `absWorkingDir` | n/a | Always set to `process.cwd()` …|
| `alias` | n/a | Not supported …|
| `allowOverwrite` | n/a | Always false …|
| `assetNames` | `naming.asset` | Uses the same templating syntax as esbuild, but you must …|
| `banner` | `banner` | Only applies to js bundles …|
| `bundle` | n/a | Always true. Use `Bun.Transpiler` to transpile without bu…|
| `charset` | n/a | Not supported …|
| `chunkNames` | `naming.chunk` | Uses the same templating syntax as esbuild, but you must …|
### Plugin API
Bun's plugin API is designed to be esbuild-compatible.
```ts
import type { BunPlugin } from "bun";
const myPlugin: BunPlugin = {
 name: "my-plugin",
 setup(builder) {
 },
…
```
- onResolve · onLoad

## Fullstack dev server — `docs/bundler/fullstack.mdx`
> Build fullstack applications with Bun's integrated dev server that bundles frontend assets and handles API routes
To get started, import HTML files and pass them to the `routes` option in `Bun.serve()`.
```ts
import { serve, sql } from "bun";
import dashboard from "./dashboard.html";
import homepage from "./index.html";
const server = serve({
 routes: {
…
```
### HTML Routes
- HTML Imports as Routes · HTML Processing Example
### React Integration
To use React in your client-side code, import `react-dom/client` and render your app.
```ts
import dashboard from "../public/dashboard.html";
import { serve } from "bun";
serve({
 routes: {
  "/": dashboard,
…
```
### Development Mode
```ts
import homepage from "./index.html";
import dashboard from "./dashboard.html";
Bun.serve({
 routes: {
  "/": homepage,
…
```
- Development Mode Features · Advanced Development Configuration · Development vs Production
### Production Mode
- Ahead of Time Bundling (Recommended) · Runtime Bundling
### API Routes
- HTTP Method Handlers · Dynamic Routes · Request Handling
### Plugins
Bun also supports bundler plugins when bundling static routes.
- TailwindCSS Plugin · Custom Plugins
### Inline Environment Variables
Bun can replace `process.env.*` references in your frontend JavaScript and TypeScript with their values at build time.
`[serve.static] env = "PUBLIC_*"  # only inline env vars starting with PUBLIC_ (recommended)`
### Sourcemaps
In development, Bun generates linked sourcemaps for bundled routes and serves them alongside the JavaScript and CSS chu…
`[serve.static] sourcemap = "linked" # serve sourcemaps in production too`
### How It Works
Bun uses `HTMLRewriter` to scan for `` and `` tags in HTML files and uses them as entrypoints for Bun's bundler.
- **Processing Pipeline**
### Complete Example
```ts
import { serve } from "bun";
import { Database } from "bun:sqlite";
import homepage from "./public/index.html";
import dashboard from "./public/dashboard.html";
const db = new Database("app.db");
…
```
### Best Practices
- Project Structure · Environment-Based Configuration · Error Handling · API Response Helpers · Type Safety
### Deployment
- Production Build · Docker Deployment · Environment Variables
### Migration from Other Frameworks
- From Express + Webpack · From Next.js API Routes
### Limitations and Future Plans
- Current Limitations · Planned Features

## Hot reloading — `docs/bundler/hot-reloading.mdx`
> Hot Module Replacement (HMR) for Bun's development server
Hot Module Replacement (HMR) updates modules in a running application without a full page reload, preserving applicatio…
### `import.meta.hot` API Reference
Bun implements a client-side HMR API modeled after Vite's `import.meta.hot` API.
`if (import.meta.hot) { }`
### API Methods
| Method | Status | Notes …|
| - | - | -…|
| `hot.accept()` | ✅ | Indicate that a hot update can be replaced gracefully. …|
| `hot.data` | ✅ | Persist data between module evaluations. …|
| `hot.dispose()` | ✅ | Add a callback function to run when a module is about to …|
| `hot.invalidate()` | ❌ | …|
| `hot.on()` | ✅ | Attach an event listener. …|
| `hot.off()` | ✅ | Remove an event listener from `on`. …|
| `hot.send()` | ❌ | …|
| `hot.prune()` | 🚧 | Callback is currently never called. …|
### import.meta.hot.accept()
The `accept()` method indicates that a module can be hot-replaced.
```ts
import { getCount } from "./foo.ts";
console.log("count is ", getCount());
import.meta.hot.accept();
export function getNegativeCount() {
 return -getCount();
…
```
- With callback · Accepting other modules · With multiple dependencies
### import.meta.hot.data
`import.meta.hot.data` carries state from the previous version of a module to the new one across a hot replacement.
```tsx
import { createRoot } from "react-dom/client";
import { App } from "./app";
const root = (import.meta.hot.data.root ??= createRoot(elem));
root.render(<App />); // re-use an existing root
```
### import.meta.hot.dispose()
Attaches an on-dispose callback.
- Just before the module is replaced with another copy (before the next is loaded)
- After the module is detached (removing all imports to this module, see `import.meta.hot.prune()`)
```ts
const sideEffect = setupSideEffect();
import.meta.hot.dispose(() => {
 sideEffect.cleanup();
});
```
### import.meta.hot.prune()
Attaches an on-prune callback.
```ts
import { something } from "./something";
export const ws = (import.meta.hot.data.ws ??= new WebSocket(location.origin));
import.meta.hot.prune(() => {
 ws.close();
});
```
### import.meta.hot.on() and off()
Use `on()` and `off()` to listen for events from the HMR runtime.
`import.meta.hot.on("bun:beforeUpdate", () => { console.log("before a hot update"); });`
- **Built-in events**

## HTML & static sites — `docs/bundler/html-static.mdx`
> Build static sites, landing pages, and web applications with Bun's bundler
Bun's bundler has first-class support for HTML.
```html
<!doctype html>
<html>
 <head>
  <link rel="stylesheet" href="./styles.css" />
  <script src="./app.ts" type="module"></script>
…
```
- **Automatic Bundling** - Bundles and serves your HTML, JavaScript, and CSS
- **Multi-Entry Support** - Handles multiple HTML entry points and glob entry points
- **Modern JavaScript** - TypeScript & JSX support by default
- **Smart Configuration** - Reads `tsconfig.json` for paths, JSX options, and experimental decorators
- **Plugins** - Plugin support, including TailwindCSS
- **ESM & CommonJS** - Use ESM and CommonJS in your JavaScript, TypeScript, and JSX files
### Single Page Apps (SPA)
When you pass a single `.html` file to Bun, Bun uses it as a fallback route for all paths.
`bun index.html`
### Multi-page apps (MPA)
Some projects have several separate routes or HTML files as entry points.
`bun ./index.html ./about.html`
- `index.html` at `/`
- `about.html` at `/about`
- Glob patterns · Path normalization
### JavaScript, TypeScript, and JSX
Bun's transpiler natively implements JavaScript, TypeScript, and JSX support.
- **ES Modules & CommonJS**
### CSS
Bun's CSS parser is also natively implemented (about 70,000 lines of Rust).
```css
@import "./abc.css";
.container {
 background-color: blue;
}
```
- Referencing local assets in CSS · Importing CSS in JavaScript
### Plugins
The dev server supports plugins.
- **Tailwind CSS**
### Inline environment variables
Bun can replace `process.env.*` references in your JavaScript and TypeScript with their actual values at build time.
- Dev server (runtime) · Build for production · Example
### Echo console logs from browser to terminal
Bun's dev server can stream console logs from the browser to the terminal.
`bun ./index.html --console`
### Edit files in the browser
Bun's frontend dev server supports Automatic Workspace Folders in Chrome DevTools, so you can save edits to files from …
### Keyboard Shortcuts
- `o + Enter` - Open in browser
- `c + Enter` - Clear console
- `q + Enter` (or `Ctrl+C`) - Quit server
### Build for Production
`bun build ./index.html --minify --outdir=dist`
Plugins are only supported through `Bun.build`'s API or through `bunfig.toml` with the frontend dev server, not through…
- **Watch Mode**
### Plugin API
For more control, configure the bundler through the JavaScript API and use Bun's built-in `HTMLRewriter` to preprocess …
```ts
await Bun.build({
 entrypoints: ["./index.html"],
 outdir: "./dist",
 minify: true,
 plugins: [
…
```
### What Gets Processed?
- **Scripts** (``) are run through Bun's JavaScript/TypeScript/JSX bundler
- **Stylesheets** (``) are run through Bun's CSS parser & bundler
- **Images** (``, ``) are copied and hashed
- **Media** (``, ``, ``) are copied and hashed
- Any `` tag with an `href` attribute pointing to a local file is rewritten to the new path, and hashed
Bun resolves all paths relative to your HTML file, so you can organize your project however you want.
- Need more plugins
### How this works
The dev server is a small wrapper around Bun's support for HTML imports in JavaScript.
### Standalone HTML
You can bundle your entire frontend into a **single self-contained `.html` file** with no external dependencies using `…
`bun build --compile --target=browser ./index.html --outdir=dist`
### Adding a backend to your frontend
To add a backend to your frontend, use the `routes` option in `Bun.serve`.

## Bundler — `docs/bundler/index.mdx`
> Bun's fast native bundler for JavaScript, TypeScript, JSX, and more
Use Bun's native bundler through the `bun build` CLI command or the `Bun.build()` JavaScript API.
- **At a Glance**
### Why bundle?
- **Reducing HTTP requests.** A single package in `node_modules` may consist of hundreds of files, and large application
- **Code transforms.** Modern apps are commonly built with languages or tools like TypeScript, JSX, and CSS modules. All
- **Framework features.** Frameworks rely on bundler plugins & code transformations to implement common patterns like fi
- **Full-stack Applications.** Bun's bundler can handle both server and client code in a single command, enabling optimi
### Basic example
Build your first bundle.
```tsx
import * as ReactDOM from "react-dom/client";
import { Component } from "./Component";
const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<Component message="Sup!" />);
```
### Watch mode
Like the runtime and test runner, the bundler supports watch mode natively.
`bun build ./index.tsx --outdir ./out --watch`
### Content types
Like the Bun runtime, the bundler supports a range of file types by default.
| Extensions | Details …|
| - | -…|
| `.js` `.jsx` `.cjs` `.mjs` `.mts` `.cts` `.ts` `.tsx` | Uses Bun's built-in transpiler to parse the file and tran…|
| `.json` | JSON files are parsed and inlined into the bundle as a Ja…|
| `.jsonc` | JSON with comments. Files are parsed and inlined into the…|
| `.toml` | TOML files are parsed and inlined into the bundle as a Ja…|
| `.yaml` `.yml` | YAML files are parsed and inlined into the bundle as a Ja…|
| `.txt` | The contents of the text file are read and inlined into t…|
| `.html` | HTML files are processed and any referenced assets (scrip…|
| `.css` | CSS files are bundled together into a single `.css` file …|
- Assets · Plugins
### API
- entrypoints · files · Bundle entirely from memory · Override files on disk · Mix disk and virtual files · outdir · target · format · format: "esm" - ES Module · format: "cjs" - CommonJS · format: "iife" - IIFE · `jsx` · splitting · Tree-shaking `import()` and `require()` results · minChunkSize · modulePreload · plugins · env · env: "inline" · env: "PUBLIC\_\*" (prefix) · env: "disable" · sourcemap · minify · external · packages · naming · root · publicPath · define · loader · banner · footer · drop · check · dts · features · optimizeImports · Re-exported namespaces · deprecatedNamespaceObjectSetters · metafile · Markdown metafile · `metafile` option formats
### Outputs
```ts
interface BuildOutput {
 outputs: BuildArtifact[];
 success: boolean;
 logs: Array<object>; // see docs for details
 metafile?: BuildMetafile; // only when metafile: true
…
```
The `outputs` array contains all the files generated by the build.
| Property | Description …|
| - | -…|
| `kind` | What kind of build output this file is. A build generates…|
| `path` | Absolute path to the file on disk …|
| `loader` | The loader used to interpret the file. See loaders for ho…|
| `hash` | The hash of the file contents. Always defined for assets.…|
| `sourcemap` | The sourcemap file corresponding to this file, if generat…|
### Bytecode
The `bytecode: boolean` option generates bytecode for any JavaScript/TypeScript entrypoints, which can greatly improve …
- **CommonJS**: Works with or without `compile: true`. Generates a `.jsc` file alongside each entrypoint.
- **ESM**: Requires `compile: true`. Bun embeds the bytecode and module metadata in the standalone executable.
```ts
  await Bun.build({
   entrypoints: ["./index.tsx"],
   outdir: "./out",
   bytecode: true,
  })
…
```
### Executables
Bun supports "compiling" a JavaScript/TypeScript entrypoint into a standalone executable.
`bun build ./cli.tsx --outfile mycli --compile ./mycli`
### Logs and errors
On failure, `Bun.build` returns a rejected promise with an `AggregateError`.
```ts
try {
 const result = await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
 });
…
```
### Reference
```ts
interface Bun {
 build(options: BuildOptions): Promise<BuildOutput>;
}
interface BuildConfig {
 entrypoints: string[]; // list of file path
…
```
---

## Loaders — `docs/bundler/loaders.mdx`
> Built-in loaders for the Bun bundler and runtime
The Bun bundler has a set of built-in loaders.
`import my_toml from "./my_file" with { type: "toml" }; const { default: my_toml } = await import("./my_file", { with: { type: "toml" } });`
### Built-in loaders
- `js` · `jsx` · `ts` · `tsx` · `json` · `jsonc` · `toml` · `yaml` · `xml` · `text` · `napi` · `sqlite` · `html` · `css` · `sh` · `file`

## Macros — `docs/bundler/macros.mdx`
> Run JavaScript functions at bundle-time with Bun macros
Macros are JavaScript functions that run at bundle-time.
`export function random() { return Math.random(); }`
### When to use macros
For small things you would otherwise write a one-off build script for, bundle-time code execution can be easier to main…
### Import attributes
- `with { type: 'macro' }` — an import attribute, a Stage 4 ECMAScript proposal
- `assert { type: 'macro' }` — an import assertion, an earlier incarnation of import attributes that has now been abando
### Security considerations
You can disable macros entirely with the `--no-macros` flag.
```
error: Macros are disabled
foo();
^
./hello.js:3:1 53
```
### Export condition "macro"
When shipping a library containing a macro to npm or another package registry, use the `"macro"` export condition to pr…
```json
{
 "name": "my-package",
 "exports": {
  "import": "./index.js",
  "require": "./index.js",
…
```
### Execution
When Bun's transpiler sees a macro import, it calls the function using Bun's JavaScript runtime and converts the return…
### Dead code elimination
The bundler performs dead code elimination after running and inlining macros.
`export function returnFalse() { return false; }`
### Serializability
Bun's transpiler must be able to serialize the result of the macro to inline it into the AST.
```ts
export function getObject() {
 return {
  foo: "bar",
  baz: 123,
  array: [1, 2, { nested: "value" }],
…
```
- **Response**: Bun reads the `Content-Type` and serializes accordingly. For example, it parses a Response with type `ap
- **Blob**: As with Response, the serialization depends on the `type` property.
### Arguments
Macros can accept inputs, but only in limited cases.
```ts
import { getText } from "./getText.ts" with { type: "macro" };
export function howLong() {
 const foo = Math.random() ? "foo" : "bar";
 const text = getText(`https://google.com/${foo}`);
 console.log("The page is ", text.length, " characters long");
…
```
### Examples
- Embed latest git commit hash · Make fetch() requests at bundle-time

## docs/bundler/minifier.mdx — `docs/bundler/minifier.mdx`
> Reduce bundle sizes with Bun's JavaScript and TypeScript minifier
Bun includes a fast JavaScript and TypeScript minifier.
### CLI Usage
- Enable all minification · Production mode · Granular control
### JavaScript API
```ts
await Bun.build({
 entrypoints: ["./index.ts"],
 outdir: "./out",
 minify: true, // Enable all minification modes
});
```
### Minification Modes
Bun's minifier has three independent modes that you can enable separately or together.
- Whitespace minification (`--minify-whitespace`) · Syntax minification (`--minify-syntax`) · Identifier minification (`--minify-identifiers`)
### All Transformations
- Boolean literal shortening · Boolean algebra optimizations · Undefined shortening · Undefined equality optimization · Infinity shortening · Typeof optimizations · Number formatting · Arithmetic constant folding · Bitwise constant folding · String concatenation · String indexing · Template literal folding · Template literal to string conversion · String quote optimization · Array spread inlining · Array indexing · Property access optimization · Comparison folding · Logical operation folding · Nullish coalescing folding · Comma expression simplification · Ternary conditional folding · Unary expression folding · Double negation removal · If statement optimization · Dead code elimination · Unreachable branch removal · Empty block removal · Single statement block unwrapping · TypeScript enum inlining · Pure annotation support · Identifier renaming · Whitespace removal · Semicolon optimization · Operator spacing removal · Comment removal · Object and array formatting · Control flow formatting · Function formatting · Parentheses minimization · Template literal value folding · String length constant folding · Constructor call simplification · Single property object inlining · String charCodeAt constant folding · Void 0 equality to null equality · Negation operator optimization · Import.meta property inlining · Variable declaration merging · Expression statement merging · Return statement merging · Throw statement merging · TypeScript enum cross-module inlining · Computed property enum inlining · Arrow function body shortening · Object property shorthand · Drop debugger statements · Drop console calls · Drop custom function calls
### Keep Names
To keep original function and class names for debugging while minifying identifiers, use the `--keep-names` flag:
`bun build ./index.ts --minify --keep-names --outfile=out.js`
### Combined Example
```ts
const myVariable = 42;
const myFunction = () => {
 const isValid = true;
 const result = undefined;
 return isValid ? myVariable : result;
…
```
### When to Use Minification
**Use `--minify` for:**
- Production bundles
- Reducing CDN bandwidth costs
- Improving page load times
- **`--minify-whitespace`:** Size reduction without semantic changes
- **`--minify-syntax`:** Smaller output while keeping readable identifiers for debugging
- **`--minify-identifiers`:** Maximum size reduction (combine with `--keep-names` for better stack traces)

## Plugins — `docs/bundler/plugins.mdx`
> Universal plugin API for extending Bun's runtime and bundler
Bun's universal plugin API extends both the runtime and the bundler.
### Lifecycle hooks
- `onStart()`: Run once the bundler has started a bundle
- `onResolve()`: Run before the bundler resolves a module
- `onLoad()`: Run before the bundler loads a module
- `onBeforeParse()`: Run zero-copy native addons in the parser thread before the bundler parses a file
- `onEnd()`: Run after the bundle is complete
### Reference
```ts
type PluginBuilder = {
 onStart(callback: () => void | Promise<void>): void;
 onResolve: (
  args: { filter: RegExp; namespace?: string },
  callback: (args: { path: string; importer: string }) => {
…
```
### Usage
A plugin is a JavaScript object with a `name` property and a `setup` function.
```ts
import type { BunPlugin } from "bun";
const myPlugin: BunPlugin = {
 name: "Custom loader",
 setup(build) {
 },
…
```
### Plugin lifecycle
- Namespaces · onStart · onResolve · onLoad · .defer() · onEnd
### Native plugins
Bun's bundler is written in native code and uses multiple threads to load and parse modules in parallel.
- `onBeforeParse()`: Called on any thread before Bun's bundler parses a file.
- Creating a native plugin in Rust · onBeforeParse

## Standalone HTML — `docs/bundler/standalone-html.mdx`
> Bundle a single-page app into a single self-contained .html file with no external dependencies
Bun can bundle your entire frontend into a **single `.html` file** with zero external dependencies.
`bun build --compile --target=browser ./index.html --outdir=dist`
### One file. Upload anywhere.
- **Upload it to S3** or any static file host — no directory structure to maintain, one file
- **Double-click it from your desktop** — it opens in the browser and works offline, no localhost server needed
- **Embed it in your webview** — no relative files to deal with
- **Insert it in an ``** — embed interactive content in another page with a single file URL
- **Serve it from anywhere** — any HTTP server, CDN, or file share
There's nothing to install, no `node_modules` to deploy, no build artifacts to coordinate, no relative paths to think a…
### Truly one file
Normally, distributing a web page means managing a folder of assets — the HTML, the JavaScript bundles, the CSS files, …
### Quick start
```html
<!doctype html>
<html>
 <head>
  <link rel="stylesheet" href="./styles.css" />
 </head>
…
```
Open `dist/index.html` — the React app works with no server.
### Everything gets inlined
- **What gets inlined**
### Using with React
`bun install react react-dom`
Bun bundles all of React, your components, and your CSS into `dist/index.html`.
### Using with Tailwind CSS
`bun install --dev bun-plugin-tailwind`
Bun inlines the generated Tailwind CSS directly into the HTML file as a `` tag.
### How it works
- Parses the HTML and discovers all ``, ``, ``, ``, ``, ``, and other asset references
- Bundles all JavaScript/TypeScript/JSX into a single module
- Bundles all CSS (including `@import` chains and CSS imported from JS) into a single stylesheet
- Converts every relative asset reference into a base64 `data:` URI
- Inlines the bundled JS as `` before ``
- Inlines the bundled CSS as `` in ``
### Minification
`bun build --compile --target=browser --minify ./index.html --outdir=dist`
### JavaScript API
```ts
const result = await Bun.build({
 entrypoints: ["./index.html"],
 compile: true,
 target: "browser",
 outdir: "./dist", // optional — omit to get output as BuildArtifact
…
```
### Multiple HTML files
You can pass multiple HTML files as entrypoints.
`bun build --compile --target=browser ./index.html ./about.html --outdir=dist`
### Environment variables
`API_URL=https://api.google.com bun build --compile --target=browser --env=inline ./index.html --outdir=dist`
Bun replaces references to `process.env.API_URL` in your JavaScript with the literal value at build time.
### Limitations
- **Code splitting** is not supported — `--splitting` cannot be used with `--compile --target=browser`
- **Large assets** increase file size since they're base64-encoded (33% overhead vs the raw binary)
- **External URLs** (CDN links, absolute URLs) stay as-is: Bun inlines only relative paths

## Ahead-of-time compilation — `docs/compiler/aot.mdx`
> Compile TypeScript and JavaScript to machine code at build time, with bun compile
Ahead-of-time compilation is experimental.
`bun compile ./server.ts ./server`
### What to expect
Under `bun run`, and in an executable from `bun build --compile`, your code starts in an interpreter and a JIT compiles…
- Your program starts faster. There's no source to parse and nothing to warm up.
- A large application uses less memory, and a tiny program uses about as much as without AoT. The process has no bytecod
- Typed code runs faster. A property access is one load from a fixed offset, like a struct field in Go or Rust.
- A small program's file is smaller, because it leaves out the `bun` command line and the JIT. In a large program, the m
- The build takes longer, and nothing is cached between builds.
- Untyped code can run slower than under the JIT. A JIT learns which objects show up at each property access by watching
### When to stay with the JIT
- Your hot code is untyped JavaScript from npm.
- You build on one platform and deploy to another. `bun compile` only builds for the platform it runs on, so run it in C
- A library generates its hot code with `new Function`, as some validators and serializers do. That code is interpreted.
- A dependency replaces methods of built-in objects. Assigning to `Array.prototype.push` throws a `TypeError`.
- Your program spends its time in WebAssembly that it downloads or assembles at run time.
- You need breakpoints in the executable.
If you aren't sure, build both ways and put both under the same load.
`bun compile --no-aot ./server.ts --outfile server-jit bun compile ./server.ts --outfile server-aot`
### Build an executable
`bun compile ./server.ts --outfile server`
`bun compile` is short for `bun build --compile --aot` and takes the same flags.
- Type errors stop the build · Harden the compiled code
### Read next
- Types: how your types change the compiled program.
- Compatibility: what differs from `bun run`.
- Testing and debugging: stack traces, source maps and profilers.
- Troubleshooting: the errors you're most likely to hit first.

## Bytecode Caching — `docs/compiler/bytecode.mdx`
> Speed up JavaScript execution with bytecode caching in Bun's bundler
Bytecode caching is a build-time optimization that improves startup time by pre-compiling your JavaScript to bytecode.
### Usage
- Basic usage (CommonJS) · With standalone executables · ESM bytecode · Limiting bytecode depth · Combining with other optimizations
### Performance impact
| Application size | Typical startup improvement |
| - | - |
| Small CLI (< 100 KB) | 1.5-2x faster |
| Medium-large app (> 5 MB) | 2-4x faster |
Larger applications benefit more because they have more code to parse.
### When to use bytecode
- Great for: · CLI tools · Build tools and task runners · Standalone executables · Skip it for:
### Limitations
- Version compatibility · Source code still required · Bytecode is not obfuscation
### Production deployment
- Docker · CI/CD
### Debugging
- Verify bytecode is being used · Common issues
### What is bytecode?
When you run JavaScript, the JavaScript engine doesn't execute your source code directly.
- **Parsing**: The engine reads your JavaScript source code and converts it into an Abstract Syntax Tree (AST)
- **Bytecode compilation**: The engine compiles the AST into bytecode - a lower-level representation that's faster to ex
- **Execution**: The engine's interpreter or JIT compiler executes the bytecode
- **Why lazy parsing makes this even better**
### The bytecode format
- Inside a .jsc file · What bytecode does NOT contain
### The tradeoff: file size
Bytecode files are typically 2-8x larger than the source code.
- Why is bytecode so much larger? · Mitigation strategies
### Versioning and portability
- Cross-architecture portability: ✅ · Cross-version portability: ❌
### Unlinked vs. linked bytecode
JavaScriptCore distinguishes between "unlinked" and "linked" bytecode.
- Unlinked bytecode (what's cached) · Linked bytecode (runtime execution)

## Compatibility — `docs/compiler/compatibility.mdx`
> What behaves differently in an executable built with bun compile, and what to change in your program
Ahead-of-time compilation is experimental.
| What differs …| What to do …|
| -…| -…|
| Built-in objects are read-only | Add methods, don't replace them …|
| Code from a string is interpreted | Keep it out of hot paths …|
| Unused built-ins are left out | Write the name of one that you need …|
| A dynamic import finds only what the build found | Start the path with a folder, or pass the file as an entr…|
| Nothing hooks the module loader | Use `paths` in `tsconfig.json` …|
| Your files are inside the executable | Embed what you read with `--asset` …|
| Packages are bundled | `--main-fields`, `--ignore-dce-annotations` …|
| A few corners of the language follow the spec | Rarely anything …|
### Built-in objects are read-only
Compiled code calls `push` directly.
```js
Array.prototype.last = function () {
 return this[this.length - 1];
};
Array.prototype.push = function () {};
```
- A new member: `Array.prototype.last`, `String.prototype.shout`, `Math.tau`, `BigInt.prototype.toJSON`, `Map.prototype.
- A polyfill that checks first: `Array.prototype.at ??= at`.
- A subclass: `class List extends Array {}`, `class Upper extends Response {}`.
- What tests and tools usually replace: `Date.now`, `Math.random`, `JSON.parse`, `JSON.stringify`, `fetch`, the timers, 
- A global that isn't listed below: `globalThis.Promise = Bluebird`.
- A symbol of your own, such as `Symbol.for("nodejs.util.inspect.custom")`, on any prototype but `Object.prototype`.
### Code from strings
`const add = new Function("a", "b", "return a + b"); const local = 5; console.log(add(2, 3), eval("local * 2"), (0, eval)("typeof Bun"));`
`eval`, `new Function` and `node:vm` work, under a computed name like `globalThisname` too.
- Where the build can't tell that a call evaluates code, the call throws an `EvalError`. `fnname` does if `"constructor"
- Code from a string can `import()` your entry points. Any other file may throw `Cannot load`. Pass the module to that c
- A script from a string can't declare a built-in global at its top level. `vm.runInThisContext("let Array = 5")` throws
- zod 4: call `z.config({ jitless: true })` before you create a schema.
- Fastify: call `app.setSerializerCompiler(() => JSON.stringify)`, and write the validators to files with the standalone
### Unused built-ins
An executable holds the parts of Bun's own JavaScript that your code uses.
```txt
Error: Bun.$ was not compiled into this executable because your code never uses it. To keep it, use it somewhere in your code.
```
### WebAssembly
A `.wasm` file that you import is compiled at build time.
### Dynamic imports
`const plugin = await import("./plugins/" + process.argv[2] + ".ts"); console.log(plugin.default);`
The build compiles every file it can reach from your entry point.
| Path | What the executable holds …|
| - | -…|
| `"./plugins/" + name + ".ts"` | `plugins/*.ts` …|
| ``new URL(`./plugins/${name}.ts`, import.meta.url)`` | The same …|
| `` `@/plugins/${name}.ts` `` | The same, with `"paths": { "@/*": ["./*"] }` in `tsconfig…|
| `` `locales/data/${name}.js` `` | `node_modules/locales/data/*.js` …|
| `process.env.PLUGIN \|\| "./plugins/a.ts"` | `plugins/a.ts` …|
| `path.join(process.env.DIR \|\| __dirname, "a.ts")` | `a.ts` …|
| `"./locales/" + lang` | Code and data files in `locales/`. `--explain` lists the …|
| `"./" + name` | Code only. The build names the data files that it leaves …|
- `__dirname`, `import.meta.dir`, `import.meta.url`, `path.join()`, `new URL()`, `process.platform` and `process.arch` c
- `fs.readdirSync()` and `fs.existsSync()` see the compiled files, so a loader that lists a folder and calls `require()`
- `import.meta.glob()` is expanded at build time, and every file that matches is compiled.
- `require.resolve()` and `import.meta.resolve()` return a path. They don't embed the file. Neither do `Bun.resolveSync(
- `require("./notes.txt")` returns the text itself, as in `bun build --compile`. `bun run` returns an object with the te
- An `import()` at the top level of an ES module that a `require()` loads runs its module after that `require()` returns
- **A file that isn't in the executable**
### Loader hooks and the module cache
Every `import`, and every `require()` of a constant path, is resolved at build time.
| In your program …| In an executable …|
| -…| -…|
| `Module._resolveFilename = hook` …| Called for dynamic paths only. The build warns (`TS100080…|
| `Module._extensions[".js"] = loader` …| Called for dynamic paths only …|
| `delete require.cache[path]`, `require.cache[path] = entr…| Do nothing. A module runs once. The build warns (`TS10009…|
| `Object.keys(require.cache)` …| Doesn't list compiled modules …|
| `Bun.plugin()` at run time …| Asked about dynamic paths only. It can't replace a module…|
| A tracer that patches modules as they load, like OpenTele…| Sees none of them …|
### Paths of the running file
Every compiled file has a path under `/$bunfs/root`, laid out like your sources.
| In `lib/inner.js` | In an executable |
| - | - |
| `import.meta.url` | `file:///$bunfs/root/lib/inner.js` |
| `import.meta.dirname`, `import.meta.dir` | `/$bunfs/root/lib` |
| `import.meta.filename`, `import.meta.path` | `/$bunfs/root/lib/inner.js` |
| `module.filename`, `module.id` | `/$bunfs/root/lib/inner.js` |
| `process.argv[1]`, `Bun.main` | `/$bunfs/root/cli.js`, your entry point |
| `__dirname`, `__filename` | Where the file was when you built |
| `process.execPath` | The executable |
- **Files beside your code**
### Packages
An executable is a bundle, so two fields of a `package.json` mean what they mean to `bun build`.
- `"main"` and `"module"` · `"sideEffects": false`
### Language
`bun run` transpiles each file before it runs it, and its transpiler takes a few shortcuts.
| In your program …| `bun run` | An executable |
| -…| - | - |
| `{ function inner() {} }` in a CommonJS file that isn't i…| `inner` stays inside the block | `inner` is visible after it |
| `"use strict"` at the start of a function, in such a file…| Dropped | The function is in strict mode |
| `const first = read(), limit = 5`, where `read()` returns…| `5` | A `ReferenceError` |
| `undefined[key] = 1`, where `key` has a `toString()` …| Calls `toString()`, then throws | Throws |
| `(Color as any).Red = 2`, then `Color.Red`, for an `enum`…| `2` | `1`. The member is a constant |
| `"useDefineForClassFields"` in `tsconfig.json` …| Taken from the one in the working directory | Taken from the one nearest to each file |
| `fn.caller` and `fn.arguments`, outside strict mode …| The calling function and the arguments | `null`. The build warns (`TS100302`) |
### Error messages
The class of an error and the lines in its stack trace are the same as under `bun run`.
```txt
TypeError: null is not an object (evaluating 'o.a.c')
TypeError: null is not an object (evaluating 'null.c')       without the text
TypeError: s is not a function. (In 's()', 's' is "text")
TypeError: s is not a function. (In 's()', 's' is a string)  without the text
```
### Not supported
| Feature …| Instead …|
| -…| -…|
| `--target` for another platform …| Build on that platform, or pass `--no-aot` …|
| `--preload`, `--import` in `BUN_OPTIONS` …| Import the file from your entry point, or build with `--c…|
| `preload` in `bunfig.toml` …| It's ignored. Import the file from your entry point, or b…|
| The same, built with `--no-compile-function-source` or `-…| It's an error at startup. Build with `--no-compile-autolo…|
| `--inspect` in `BUN_OPTIONS`, `BUN_INSPECT` …| Build with `--compile-inspector` …|
| `--unhandled-rejections` in `BUN_OPTIONS` …| Build with `--compile-exec-argv=--unhandled-rejections=<m…|
| `--sql-preconnect` in `BUN_OPTIONS` …| Build with `--compile-exec-argv=--sql-preconnect` …|
| Breakpoints and `debugger` …| `bun --inspect-brk ./app.ts` …|

## Test and debug a compiled program — `docs/compiler/debugging.mdx`
> Stack traces, source maps, crash reports and profiles of an executable, and how to run your tests compiled
Ahead-of-time compilation is experimental.
### Stack traces
```ts
class Repo {
 find(id: number): string {
  if (id < 0) throw new RangeError("bad id " + id);
  return "x";
 }
…
```
Stack traces have the file, line and column of your source code.
- Minified executables and external source maps · Keep every name out of the executable · List the strings in the executable · Use with Sentry
### Crash reports
If the process crashes, Bun prints a report to stderr.
### Run your tests compiled
```ts
import { expect, test } from "bun:test";
test("add", () => {
 expect(1 + 2).toBe(3);
});
```
`bun test --aot` compiles your test files, your preloads and everything they import the way `bun compile` does, and run…
- What differs from an executable · What a test can't replace · Module mocks
### Run under the compiler's rules
`Array.prototype.push = () => 0;`
`bun run --aot` checks your program the way `bun compile` does, and exits with code `1` on anything that would stop the…
### Find the guards that fail
```ts
function total(rows: { id: number }[]): number {
 let sum = 0;
 for (const row of rows) sum += row.id;
 return sum;
}
…
```
A guard that fails doesn't change what your program does.
### Profiles
`BUN_OPTIONS="--cpu-prof" ./app    # a .cpuprofile for Chrome DevTools or VS Code BUN_OPTIONS="--heap-prof" ./app   # a heap profile`
Both show your functions, classes and files by their names.
### The inspector
`bun compile --compile-inspector ./app.ts BUN_INSPECT="ws://127.0.0.1:6499/app" ./app`
The console, heap snapshots and CPU profiles work.

## Single-file executable — `docs/compiler/executables.mdx`
> Generate standalone executables from TypeScript or JavaScript files with Bun
Bun's bundler implements a `--compile` flag for generating a standalone binary from a TypeScript or JavaScript file.
`bun build ./cli.ts --compile --outfile mycli`
### Cross-compile to other platforms
Use the `--target` flag to compile your standalone executable for a different operating system, architecture, or versio…
`bun build --compile --target=bun-linux-x64 ./index.ts --outfile myapp`
- **Supported targets**
### Build-time constants
Use the `--define` flag to inject build-time constants into your executable, such as version numbers, build timestamps,…
```bash
  bun build --compile --define BUILD_VERSION='"1.2.3"' --define BUILD_TIME='"2024-01-15T10:30:00Z"' src/cli.ts --outfile mycli
```
### Deploying to production
Compiled executables reduce memory usage and improve Bun's start time.
`bun build --compile --minify --sourcemap ./path/to/my/app.ts --outfile myapp`
- Bytecode compilation · What do these flags do? · Profile-guided bytecode layout · JIT policy · Ahead-of-time compilation
### Embedding runtime arguments
**`--compile-exec-argv="args"`** - Embed runtime arguments, available at runtime in `process.execArgv`:
`bun build --compile --compile-exec-argv="--smol --user-agent=MyBot" ./app.ts --outfile myapp`
- Turn off `eval` and `new Function` · Runtime arguments via `BUN_OPTIONS`
### Automatic config loading
Standalone executables can automatically load configuration files from the directory where they are run.
- **`tsconfig.json`** and **`package.json`** loading is **disabled** — these are typically only needed at development ti
- **`.env`** and **`bunfig.toml`** loading is **enabled** — these often contain runtime configuration that may vary per 
- Enabling config loading at runtime · Disabling config loading at runtime
### Act as the Bun CLI
Set the `BUN_BE_BUN=1` environment variable to run a standalone executable as if it were the `bun` CLI itself.
`echo "console.log(\"you shouldn't see this\");" > such-bun.js bun build --compile ./such-bun.js`
### Smaller executables
`--trim` is experimental.
`bun build --compile --trim ./app.ts --outfile myapp`
### Full-stack executables
The `--compile` flag can create a standalone executable that contains both server and client code, which suits full-sta…
```ts
import { serve } from "bun";
import index from "./index.html";
const server = serve({
 routes: {
  "/": index,
…
```
- Your server code
- The Bun runtime
- All frontend assets (HTML, CSS, JavaScript)
- Any npm packages used by your server
### Worker
`bun build --compile ./index.ts ./my-worker.ts --outfile myapp`
When you add multiple entrypoints to a standalone executable, Bun bundles each one separately into the executable.
### SQLite
You can use `bun:sqlite` imports with `bun build --compile`.
`import db from "./my.db" with { type: "sqlite" }; console.log(db.query("select * from users LIMIT 1").get());`
### Embed assets & files
Standalone executables can embed files directly into the binary, so a single executable can ship images, JSON configs, …
- How it works · Reading embedded files with Bun.file() · Reading embedded files with Node.js fs · Practical examples · Embedding a JSON config file · Serving static assets in an HTTP server · Embedding templates · Embedding binary files · Embed text as a string · Embed SQLite databases · Embed N-API Addons · Embed directories · Detecting standalone mode at runtime · Listing embedded files · Content hash
### Minification
`bun build --compile --minify ./index.ts --outfile myapp`
This uses Bun's minifier to reduce the code size.
### Windows-specific flags
When compiling a standalone executable on Windows, platform-specific options customize metadata on the generated `.exe`…
`bun build --compile --windows-icon=path/to/icon.ico ./app.ts --outfile myapp bun build --compile --windows-hide-console ./app.ts --outfile myapp`
- `icon` - Path to `.ico` file for the executable icon
- `hideConsole` - Disable the background terminal (for GUI apps)
- `title` - Application title in file properties
- `publisher` - Publisher name in file properties
- `version` - Version string in file properties
- `description` - Description in file properties
### Code signing on macOS
To codesign a standalone executable on macOS (which fixes Gatekeeper warnings), use the `codesign` command.
`codesign --deep --force -vvvv --sign "XXXXXXXXXX" ./myapp`
### Code splitting
Standalone executables support code splitting.
`bun build --compile --splitting ./src/entry.ts --outfile ./build/entry`
### Using plugins
```ts
import type { BunPlugin } from "bun";
const envPlugin: BunPlugin = {
 name: "env-loader",
 setup(build) {
  build.onLoad({ filter: /\.env\.json$/ }, async args => {
…
```
---
### Unsupported CLI arguments
- `--outdir` — use `outfile` instead.
- `--public-path`
- `--target=node`
- `--target=browser` (without HTML entrypoints — see Standalone HTML for `--compile --target=browser` with `.html` files
- `--no-bundle` - Bun always bundles everything into the executable.
---
### API reference
```ts
interface BuildConfig {
 entrypoints: string[];
 compile: boolean | Bun.Build.CompileTarget | CompileBuildOptions;
}
interface CompileBuildOptions {
…
```
Without `outfile`, the executable is named after the entrypoint and written to `outdir`, or to the current working dire…
- Supported targets · Complete example

## Get more of your program typed — `docs/compiler/explain.mdx`
> How to read bun compile --explain, and what to change for each cause it reports
Ahead-of-time compilation is experimental.
### Read an entry
```ts
interface Item {
 sku: string;
 price: number;
}
const items: Item[] = [{ sku: "A-1", price: 2.5 }];
…
```
| Line | What it tells you …|
| - | -…|
| `1. unknown-object` | The rank, the cause and why |
| `at` | The line to change, where the compiler lost track of the …|
| `1 of 1 untyped access` | How many of your untyped accesses this line causes …|
| `1 untyped operator` | Operators on a value of unknown type …|
| `1 indirect call` | Calls where the callee isn't known …|
| `1 of these runs in a loop` | How many are in loops …|
| `1 of these has another cause too` | These get faster when the other cause is fixed as well …|
| `it comes in at` | Where the value gets between objects, if that's another l…|
The compiler follows each value back to where its type was lost, through variables, fields, arrays, parameters and resu…
### What is counted
The report ends with the share of your property accesses that are typed.
`Dependencies: 3.1% of property accesses are one load: 210 free, 1,320 tested, 5,244 by name (6,774) 92.4% of property accesses are one load: 1,204 free, 61 tested, 38 by name (1,303)`
| Word | The compiled code …|
| - | -…|
| `free` | One load or store at a fixed offset …|
| `tested` | A check each time, such as of the shape, then the load or…|
| `by name` | A lookup at run time …|
### Other reports
| Flag | Lists …|
| - | -…|
| `--explain=json` | Every entry, one JSON object per line …|
| `--explain=guards` | Type guards that can fail at run time |
| `--explain=guards-json` | The same guards, one JSON object per line …|
| `--explain=trim` | What `--trim` kept, and why |
| `--explain=allocations` | Where objects are allocated …|
You can pass `--explain` more than once.
### Causes
The first line of an entry has one of these codes.
- unknown-object · unknown-callee · lost-track

## Compiler — `docs/compiler/index.mdx`
> Turn a TypeScript or JavaScript program into one executable file
Bun turns a TypeScript or JavaScript program into one executable file.
`console.log("Hello world!");`
### Two ways to compile
| | `bun build --compile` | `bun compile` |
| - | - | - |
| The executable holds | Your bundled JavaScript | Machine code |
| It runs | With the JIT, like `bun run` | Without a JIT |
| TypeScript types | Removed, never checked | Checked, then used |
| Builds for | Any platform, with `--target` | The platform you build on |
| Status | Stable | Experimental |
`bun build --compile` runs nearly everything that `bun run` runs.
### Read next
- Single-file executable: cross-compile, embed files, sign the executable.
- Bytecode caching: make an executable from `bun build --compile` start faster.
- Standalone HTML: `--compile --target=browser` writes one `.html` file.
- Ahead-of-time compilation: what `bun compile` gets you, and when to stay with the JIT.
- Types and typed percentage: make compiled code faster.
- Compatibility and libraries: what differs from `bun run`.

## Libraries — `docs/compiler/libraries.mdx`
> Which npm packages don't work with bun compile and what to use instead, the flags that frameworks need, and how to publish a package that keeps its types
Ahead-of-time compilation is experimental.
### Packages that don't work
| Package …| Use instead …|
| -…| -…|
| `core-js` 2 …| `core-js` 3 …|
| `es5-shim`, `es6-shim`, `harmony-reflect` …| Nothing. Bun has what they add …|
| `array.prototype.map/auto`, `set.prototype.union/auto`, `…| What the package exports, as in `map(list, f)` …|
| `zone.js` …| Zoneless change detection in Angular …|
| `chai.should()` …| `expect` or `assert` …|
| `should`, `must` …| `should/as-function`, `must/must` …|
| `timezone-mock` …| Set `process.env.TZ` …|
| `sugar` …| `Sugar.Array.sum(list)`, not `Sugar.extend()` …|
Adding to a built-in object is allowed.
### Frameworks
Next.js and Angular put the paths of your pages together while the server runs, so the build doesn't find them.
`bun compile ./server.js ".next/server*.js" --asset .next --asset public bun compile ./.output/server/index.mjs --asset .output/public …`
### Publish a package with its types
Most packages ship JavaScript and `.d.ts` files, so the types inside their functions are gone.
`export function greet(name: string): string { return "hello " + name; }`

## Smaller executables — `docs/compiler/size.mdx`
> Why an executable is as big as it is, and how to make it smaller with bun compile --trim
`--trim` and ahead-of-time compilation are experimental.
`bun compile --trim ./server.ts`
### See what the compiler found
`--trim` only removes what the compiler can prove you don't use.
```ts
Bun.serve({
 port: 3000,
 routes: { "/": () => new Response("hello") },
});
console.log("listening");
```
### What blocks `--trim`
If the report starts with `blocked by`, your program or a dependency could reach APIs that the compiler can't see, so `…
| `blocked by` | Your program …|
| - | -…|
| `eval` | Calls `eval` or `new Function` …|
| `runtime-code` | Uses `node:vm` or `Bun.plugin` …|
| `native-code` | Uses `bun:ffi` or a native addon …|
| `dynamic-import` | Imports a computed path, or starts a `Worker` from a comp…|
| `external-import` | Imports an `--external` package or a URL …|
| `build-option` | Is built with `--compile-inspector` …|
### Make it smaller
- `--disallow-code-generation-from-strings` removes the parser and the interpreter. `eval` and `new Function` then throw
- `--trim-locales en,de` removes the `Intl` data for every other locale. Using another locale exits the process.
- `--no-compile-function-source` removes the source text of functions. `fn.toString()` then returns `[native code]`, and
Without `--trim-locales`, Bun keeps the locales that your code passes as constants, as in `toLocaleString("de")`.
- **Turn off code from strings**
### Using a removed feature
Bun removes code, not names.
- **Feature names**

## Troubleshooting — `docs/compiler/troubleshooting.mdx`
> The errors you're most likely to hit when you first build a program with bun compile, and the fix for each
Ahead-of-time compilation is experimental.
### The build stops at a type error
`const port: number = "3000"; console.log(port);`
`bun run` never checks your types, so a project can carry type errors for years.
### Other messages from the build
An `error` stops the build.
| Message | What to do …|
| - | -…|
| `TS100014: this assignment always throws` | Don't replace built-ins …|
| `TS100053: Macros are disabled` | `bun compile` doesn't run macros. Pass `--no-aot` …|
| `TS100073: This comment silences nothing` | Delete the `bun-ignore` comment, or fix the code it names…|
| `TS100308: The package "x" has 2 type errors` | Your build doesn't stop for them. `bun check --aot --all`…|
| `TS100064: this import path isn't a constant` | The build may not find the file. Pass it as another entry…|
| `TS100064: this call loads a module` | Import the `node:` or `bun:` module by name somewhere in …|
| `TS100080`, `TS100091`, `TS100092`, `TS100093` | Loader hooks and `require.cache` don't reach compiled mod…|
| `bun compile can't cross-compile` | Build on that platform, or pass `--no-aot` …|
- **Silence a warning**
### Errors when the program runs
| Message | What to do …|
| - | -…|
| `... because built-in objects are read-only` | Don't replace built-ins …|
| `Cannot find module` | The build didn't embed the file. Pass it as another entry…|
| `Cannot load ...: it isn't in this executable` | Pass the file as another entry point. Import a `node:` or…|
| `... was not compiled into this executable` | Use that API once in your own code …|
| `EvalError: ... the compiler couldn't tell ...` | Call `eval` or `new Function` directly …|
| `... can't be used with this executable` | The option needs code that wasn't compiled in. The messag…|
| `Cannot compile C code ... (PR_SET_MDWE)` | Compile the C file first, then `dlopen()` …|
Built with `--no-compile-function-source`, a message that quotes your code says less, so your error tracker may show ne…
### The executable is slower than `bun run`
Look for these causes, in this order.
- Your hot code is untyped. `bun compile --explain` lists the code that compiled to a slow path, worst first, with a fix
- A value doesn't match its declared type in hot code. Nothing is printed, because nothing goes wrong. Testing and debug
- A library generates code at run time, and Bun interprets it.
- The program runs WebAssembly that it downloads or assembles at run time.
- Code is loaded from disk, with `--aot-allow-code-from-disk`. Bun interprets that too.
### The executable is too large
`--trim` removes the Bun and Node.js APIs that your code never calls.
### Something else
If a program passes `bun check --aot` and still behaves differently from `bun run` in a way that Compatibility doesn't …

## How bun compile uses your types — `docs/compiler/types.mdx`
> What your TypeScript types do in a compiled program, and how to write code that compiles well
Ahead-of-time compilation is experimental.
### What types get you
```ts
class Account {
 balance = 0;
}
function total(accounts: Account[]): number {
 let sum = 0;
…
```
Every `Account` has the same fields in the same places, like a struct in Go or Rust, so `account.balance` is one load f…
### When a value doesn't match its type
```ts
function double(n: number): number {
 return n * 2;
}
const body: any = JSON.parse('{"visits":"3"}');
console.log(double(body.visits));
```
`bun run` prints `6` too.
### Write code that compiles well
`bun compile --explain` finds the slow spots in your program.
- Convert, don't cast · Build your own objects from what you parse · Keep computed keys in a `Map`
### 32-bit integers
To TypeScript, and under `bun run`, `int32` is a `number`.
```ts
import type { int32 } from "bun";
class Cursor {
 column: int32 = 0;
 advance(by: int32) {
  this.column = this.column + by; // [!code --]
…
```
