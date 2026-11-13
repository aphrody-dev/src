# Bun runtime APIs
Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## Bun APIs — `docs/runtime/bun-apis.mdx`
> Overview of Bun's native APIs available on the Bun global object and built-in modules
Bun implements a set of native APIs on the `Bun` global object and through several built-in modules.
```ts
Bun.serve({
 fetch(req: Request) {
  return new Response("Success!");
 },
});
```
| Topic | APIs …|
| - | -…|
| HTTP Server | `Bun.serve` …|
| Shell | `$` …|
| Bundler | `Bun.build` …|
| File I/O | `Bun.file`, `Bun.write`, `Bun.stdin`, `Bun.stdout`, `Bun.…|
| Child Processes | `Bun.spawn`, `Bun.spawnSync` …|
| TCP Sockets | `Bun.listen`, `Bun.connect` …|
| UDP Sockets | `Bun.udpSocket` …|
| WebSockets | `new WebSocket()` (client), `Bun.serve` (server) …|

## Globals — `docs/runtime/globals.mdx`
> Use Bun's global objects
Bun implements the following globals.
| Global …| Source | Notes …|
| -…| - | -…|
| `AbortController` | Web | …|
| `AbortSignal` | Web | …|
| `alert` | Web | Intended for command-line tools …|
| `Blob` …| Web | …|
| `Buffer` …| Node.js | See Node.js > `Buffer` …|
| `Bun` …| Bun | Subject to change as additional APIs are added …|
| `ByteLengthQueuingStrategy` | Web | …|
| `confirm` | Web | Intended for command-line tools …|

## Web APIs — `docs/runtime/web-apis.mdx`
> Web-standard APIs supported by Bun for server-side JavaScript
Some Web APIs, like the DOM API and History API, aren't relevant in a server-first runtime like Bun.
| Category | APIs …|
| - | -…|
| HTTP | `fetch`, `Response`, `Request`, `Headers`, `AbortControll…|
| URLs | `URL`, `URLSearchParams` …|
| Web Workers | `Worker`, `self.postMessage`, `structuredClone`, `Message…|
| Streams | `ReadableStream`, `WritableStream`, `TransformStream`, `B…|
| Blob | `Blob` …|
| WebSockets | `WebSocket` …|
| Encoding and decoding | `Uint8Array`, `Uint8Array.prototype.toBase64()`, `Uint8Ar…|
| JSON | `JSON` …|

## File I/O — `docs/runtime/file-io.mdx`
> Bun provides a set of optimized APIs for reading and writing files.
The `Bun.file` and `Bun.write` APIs documented on this page are heavily optimized and are the recommended way to work w…
### Reading files (`Bun.file()`)
`Bun.file(path): BunFile`
`const foo = Bun.file("foo.txt"); // relative to cwd foo.size; // number of bytes foo.type; // MIME type`
- **Deleting files (`file.delete()`)**
### Writing files (`Bun.write()`)
The `Bun.write` function is a multi-tool for writing payloads of all kinds to disk.
- `string`: A path to a location on the file system. Use the `"path"` module to manipulate paths.
- `URL`: A `file://` descriptor.
- `BunFile`: A file reference.
- `string`
- `Blob` (including `BunFile`)
- `ArrayBuffer` or `SharedArrayBuffer`
| Output | Input | System call | Platform |
| - | - | - | - |
| file | file | copy_file_range | Linux |
| file | pipe | sendfile | Linux |
| pipe | pipe | splice | Linux |
| terminal | file | sendfile | Linux |
| terminal | terminal | sendfile | Linux |
| socket | file or pipe | sendfile (if http, not https) | Linux |
| file (doesn't exist) | file (path) | clonefile | macOS |
| file (exists) | file | fcopyfile | macOS |
```ts
const data = `It was the best of times, it was the worst of times.`;
await Bun.write("output.txt", data);
```
### Incremental writing with `FileSink`
Bun provides a native incremental file writing API called `FileSink`.
`const file = Bun.file("output.txt"); const writer = file.writer();`
### Directories
Bun's implementation of `node:fs` is fast.
- Reading directories (readdir) · Reading directories recursively · Creating directories (mkdir)
### Benchmarks
The following is a 3-line implementation of the Linux `cat` command.
`import { resolve } from "path"; const path = resolve(process.argv.at(-1)); await Bun.write(Bun.stdout, Bun.file(path));`
### Reference
```ts
interface Bun {
 stdin: BunFile;
 stdout: BunFile;
 stderr: BunFile;
 file(path: string | number | URL, options?: { type?: string }): BunFile;
…
```

## Binary Data — `docs/runtime/binary-data.mdx`
> Working with binary data in JavaScript
Bun implements several data types and utilities for working with binary data in JavaScript, most of which are Web-stand…
| Class | Description …|
| - | -…|
| `TypedArray` | A family of classes that provide an `Array`-like interfac…|
| `Buffer` | A subclass of `Uint8Array` that implements a wide range o…|
| `DataView` | A class that provides a `get/set` API for writing some nu…|
| `Blob` | A readonly blob of binary data usually representing a fil…|
| `File` | A subclass of `Blob` that represents a file. Has a `name`…|
| `BunFile` | _Bun only_. A subclass of `Blob` that represents a lazily…|
### `ArrayBuffer` and views
JavaScript had no language-native way to store and manipulate binary data until ECMAScript 2015 (ES6) introduced a rang…
`const buf = new ArrayBuffer(8);`
- `DataView` · `TypedArray` · `Uint8Array` · `Buffer`
### `Blob`
`Blob` is a Web API commonly used for representing files.
```ts
const blob = new Blob(["<html>Hello</html>"], {
 type: "text/html",
});
blob.type; // => text/html
blob.size; // => 18
```
- `BunFile` · `File`
### Streams
Streams let you work with binary data without loading it all into memory at once.
```ts
const stream = new ReadableStream({
 start(controller) {
  controller.enqueue("hello");
  controller.enqueue("world");
  controller.close();
…
```
### Conversion
Use this section as a reference for converting one binary format to another.
- From `ArrayBuffer` · To `TypedArray` · To `DataView` · To `Buffer` · To `string` · To `number[]` · To `Blob` · To `ReadableStream` · From `TypedArray` · To `ArrayBuffer` · To `DataView` · To `Buffer` · To `string` · To `number[]` · To `Blob` · To `ReadableStream` · From `DataView` · To `ArrayBuffer` · To `TypedArray` · To `Buffer` · To `string` · To `number[]` · To `Blob` · To `ReadableStream` · From `Buffer` · To `ArrayBuffer` · To `TypedArray` · To `DataView` · To `string` · To `number[]` · To `Blob` · To `ReadableStream` · From `Blob` · To `ArrayBuffer` · To `TypedArray` · To `DataView` · To `Buffer` · To `string` · To `number[]` · To `ReadableStream` · From `ReadableStream` · To `ArrayBuffer` · To `Uint8Array` · To `TypedArray` · To `DataView` · To `Buffer` · To `string` · To `number[]` · To `Blob` · To `ReadableStream`

## Streams — `docs/runtime/streams.mdx`
> Use Bun's streams API to work with binary data without loading it all into memory at once
Streams are an important abstraction for working with binary data without loading it all into memory at once.
```ts
const stream = new ReadableStream({
 start(controller) {
  controller.enqueue("hello");
  controller.enqueue("world");
  controller.close();
…
```
### Direct `ReadableStream`
Bun implements an optimized version of `ReadableStream` that avoids unnecessary queue management.
```ts
const stream = new ReadableStream({
 start(controller) {
  controller.enqueue("hello");
  controller.enqueue("world");
  controller.close();
…
```
- Ending the stream · Handling backpressure
### Async generator streams
Bun also supports async generator functions as a source for `Response` and `Request`.
```ts
const response = new Response(
 (async function* () {
  yield "hello";
  yield "world";
 })(),
…
```
### `Bun.ArrayBufferSink`
The `Bun.ArrayBufferSink` class is a fast incremental writer for constructing an `ArrayBuffer` of unknown size.
```ts
const sink = new Bun.ArrayBufferSink();
sink.write("h");
sink.write("e");
sink.write("l");
sink.write("l");
…
```
### Reference
```ts
export class ArrayBufferSink {
 constructor();
 start(options?: {
  asUint8Array?: boolean;
  highWaterMark?: number;
…
```

## Hashing — `docs/runtime/hashing.mdx`
> Utility functions for hashing and verifying passwords with various cryptographically secure algorithms
Bun implements the `createHash` and `createHmac` functions from `node:crypto` in addition to the Bun-native APIs docume…
### `Bun.password`
`Bun.password` is a collection of utility functions for hashing and verifying passwords with various cryptographically …
```ts
const password = "super-secure-pa$$word";
const hash = await Bun.password.hash(password);
// => $argon2id$v=19$m=65536,t=2,p=1$tFq+9AVr1bfPxQdh6E8DQRhEXg/M/SqYCNu6gVdRRNs$GzJ8PuBi+K+BVojzPfS5mjnC8OpLGtv8KJqF99eP6a4
const isMatch = await Bun.password.verify(password, hash);
// => true
```
- Salt · bcrypt - Modular Crypt Format · argon2 - PHC format
### `Bun.hash`
`Bun.hash` is a collection of utilities for _non-cryptographic_ hashing.
`Bun.hash("some data here");`
### `Bun.CryptoHasher`
`Bun.CryptoHasher` incrementally computes a hash of string or binary data with a cryptographic hash algorithm.
- `"blake2b256"`
- `"blake2b512"`
- `"blake2s256"`
- `"md4"`
- `"md5"`
- `"ripemd160"`
`const hasher = new Bun.CryptoHasher("sha256"); hasher.update("hello world"); hasher.digest();`
| Category | Encodings |
| - | - |
| Binary encodings | `"base64"` `"base64url"` `"hex"` |
| Character encodings | `"utf8"` `"utf-8"` `"utf16le"` `"latin1"` |
| Legacy character encodings | `"ascii"` `"binary"` `"ucs2"` `"ucs-2"` |
- **HMAC in `Bun.CryptoHasher`**

## Glob — `docs/runtime/glob.mdx`
> Use Bun's fast native implementation of file globbing
### Quickstart
```ts
import { Glob } from "bun";
const glob = new Glob("**/*.ts");
for await (const file of glob.scan(".")) {
 console.log(file); // => "index.ts"
}
```
To match many paths against one pattern, create the `Glob` once and reuse it.
### Supported Glob Patterns
- `?` - Match any single character · `*` - Matches zero or more characters, except for path separators (`/` or `\`) · `` - Match any number of characters including `/` · `[ab]` - Matches one of the characters contained in the brackets, as well as character ranges · `{a,b,c}` - Match any of the given patterns · `{1..3}` - Match a range of numbers or letters · `@(a|b)` - Extended glob patterns · `!` - Negates the result at the start of a pattern · `\` - Escapes any of the special characters above
### Node.js `fs.glob()` compatibility
```ts
import { glob, globSync, promises } from "node:fs";
const files = await Array.fromAsync(promises.glob(["***.js"]));
const filtered = await Array.fromAsync(
 promises.glob("***.test.*"],
 }),
…
```
- Array of patterns as the first argument
- `exclude` option to filter results

## Semver — `docs/runtime/semver.mdx`
> Use Bun's semantic versioning API
`Bun.semver` compares semantic versions and checks whether a version is compatible with a range of versions.
### `Bun.semver.satisfies(version: string, range: string): boolean`
Returns `true` if `version` satisfies `range`, otherwise `false`.
```typescript
import { semver } from "bun";
semver.satisfies("1.0.0", "^1.0.0"); // true
semver.satisfies("1.0.0", "^1.0.1"); // false
semver.satisfies("1.0.0", "~1.0.0"); // true
semver.satisfies("1.0.0", "~1.0.1"); // false
…
```
### `Bun.semver.order(versionA: string, versionB: string): 0 | 1 | -1`
Returns `0` if `versionA` and `versionB` are equal, `1` if `versionA` is greater than `versionB`, and `-1` if `versionA…
```typescript
import { semver } from "bun";
semver.order("1.0.0", "1.0.0"); // 0
semver.order("1.0.0", "1.0.1"); // -1
semver.order("1.0.1", "1.0.0"); // 1
const unsorted = ["1.0.0", "1.0.1", "1.0.0-alpha", "1.0.0-beta", "1.0.0-rc"];
…
```

## Utils — `docs/runtime/utils.mdx`
> Use Bun's utility functions to work with the runtime
### `Bun.version`
A `string` containing the version of the `bun` CLI that is currently running.
`Bun.version; // => "1.3.3"`
### `Bun.revision`
The git commit of Bun that was compiled to create the current `bun` CLI.
`Bun.revision; // => "f02561530fda1ee9396f51c8bc99b38716e38296"`
### `Bun.env`
An alias for `process.env`.
### `Bun.main`
An absolute path to the entrypoint of the current program (the file you executed with `bun run`).
`Bun.main;`
### `Bun.sleep()`
`Bun.sleep(ms: number)`
`console.log("hello"); await Bun.sleep(1000); console.log("hello one second later!");`
### `Bun.sleepSync()`
`Bun.sleepSync(ms: number)`
`console.log("hello"); Bun.sleepSync(1000); // blocks thread for one second console.log("hello one second later!");`
### `Bun.which()`
`Bun.which(bin: string)`
`const ls = Bun.which("ls"); console.log(ls); // "/usr/bin/ls"`
### `Bun.randomUUIDv7()`
`Bun.randomUUIDv7()` returns a UUID v7, which is monotonic and suitable for sorting and databases.
`import { randomUUIDv7 } from "bun"; const id = randomUUIDv7(); // => "0192ce11-26d5-7dc3-9305-1426de888c5a"`
### `Bun.peek()`
`Bun.peek(prom: Promise)`
```ts
import { peek } from "bun";
const promise = Promise.resolve("hi");
const result = peek(promise);
console.log(result); // "hi"
```
### `Bun.openInEditor()`
Opens a file in your default editor.
`const currentFile = import.meta.url; Bun.openInEditor(currentFile);`
### `Bun.deepEquals()`
Recursively checks if two objects are equivalent.
`const foo = { a: 1, b: 2, c: { d: 3 } }; Bun.deepEquals(foo, { a: 1, b: 2, c: { d: 3 } }); Bun.deepEquals(foo, { a: 1, b: 2, c: { d: 4 } });`
### `Bun.escapeHTML()`
- `"` becomes `&quot;`
- `&` becomes `&amp;`
- `'` becomes `&#x27;`
- `<` becomes `&lt;`
- `>` becomes `&gt;`
This function is optimized for large input.
### `Bun.stringWidth()`
~6,756x faster `string-width` alternative
`Bun.stringWidth("hello"); // => 5 Bun.stringWidth("\u001b[31mhello\u001b[0m"); // => 5 Bun.stringWidth("\u001b[31mhello\u001b[0m", { countAnsiEscapeCodes: true }); // => 12`
| Unit | 1 Millisecond |
| - | - |
| ns | 1,000,000 |
| µs | 1,000 |
| ms | 1 |
### `Bun.fileURLToPath()`
Converts a `file://` URL to an absolute path.
`const path = Bun.fileURLToPath(new URL("file:///foo/bar.txt")); console.log(path); // "/foo/bar.txt"`
### `Bun.pathToFileURL()`
Converts an absolute path to a `file://` URL.
`const url = Bun.pathToFileURL("/foo/bar.txt"); console.log(url); // "file:///foo/bar.txt"`
### `Bun.gzipSync()`
Compresses a `Uint8Array` using zlib's GZIP algorithm.
```ts
const buf = Buffer.from("hello".repeat(100)); // Buffer extends Uint8Array
const compressed = Bun.gzipSync(buf);
buf; // => Uint8Array(500)
compressed; // => Uint8Array(30)
```
### `Bun.gunzipSync()`
Decompresses a `Uint8Array` using zlib's GUNZIP algorithm.
```ts
const buf = Buffer.from("hello".repeat(100)); // Buffer extends Uint8Array
const compressed = Bun.gzipSync(buf);
const dec = new TextDecoder();
const uncompressed = Bun.gunzipSync(compressed);
dec.decode(uncompressed);
…
```
### `Bun.deflateSync()`
Compresses a `Uint8Array` using zlib's DEFLATE algorithm.
```ts
const buf = Buffer.from("hello".repeat(100));
const compressed = Bun.deflateSync(buf);
buf; // => Buffer(500)
compressed; // => Uint8Array(12)
```
### `Bun.inflateSync()`
Decompresses a `Uint8Array` using zlib's INFLATE algorithm.
```ts
const buf = Buffer.from("hello".repeat(100));
const compressed = Bun.deflateSync(buf);
const dec = new TextDecoder();
const decompressed = Bun.inflateSync(compressed);
dec.decode(decompressed);
…
```
### `Bun.zstdCompress()` / `Bun.zstdCompressSync()`
Compresses a `Uint8Array` using the Zstandard algorithm.
```ts
const buf = Buffer.from("hello".repeat(100));
const compressedSync = Bun.zstdCompressSync(buf);
const compressedAsync = await Bun.zstdCompress(buf);
const compressedLevel = Bun.zstdCompressSync(buf, { level: 6 });
```
### `Bun.zstdDecompress()` / `Bun.zstdDecompressSync()`
Decompresses a `Uint8Array` using the Zstandard algorithm.
```ts
const buf = Buffer.from("hello".repeat(100));
const compressed = Bun.zstdCompressSync(buf);
const decompressedSync = Bun.zstdDecompressSync(compressed);
const decompressedAsync = await Bun.zstdDecompress(compressed);
const dec = new TextDecoder();
…
```
### `Bun.inspect()`
Serializes an object to a `string` exactly as `console.log` would print it.
```ts
const obj = { foo: "bar" };
Bun.inspect(obj);
// => '{\n  foo: "bar",\n}'
const arr = new Uint8Array([1, 2, 3]);
Bun.inspect(arr);
…
```
- `Bun.inspect.custom` · `Bun.inspect.table(tabularData, properties, options)`
### `Bun.nanoseconds()`
Returns the number of nanoseconds since the current `bun` process started, as a `number`.
`Bun.nanoseconds(); // => 7288958`
### `Bun.readableStreamTo*()`
Bun implements a set of convenience functions for asynchronously consuming the body of a `ReadableStream` and convertin…
```ts
const stream = (await fetch("https://bun.com")).body;
stream; // => ReadableStream
await Bun.readableStreamToArrayBuffer(stream);
// => ArrayBuffer
await Bun.readableStreamToBytes(stream);
…
```
### `Bun.resolveSync()`
Resolves a file path or module specifier using Bun's internal module resolution algorithm.
```ts
Bun.resolveSync("./foo.ts", "/path/to/project");
// => "/path/to/project/foo.ts"
Bun.resolveSync("zod", "/path/to/project");
// => "/path/to/project/node_modules/zod/index.ts"
```
### `Bun.stripANSI()`
~6-57x faster `strip-ansi` alternative
```ts
const coloredText = "\u001b[31mHello\u001b[0m \u001b[32mWorld\u001b[0m";
const plainText = Bun.stripANSI(coloredText);
console.log(plainText); // => "Hello World"
const formatted = "\u001b[1m\u001b[4mBold and underlined\u001b[0m";
console.log(Bun.stripANSI(formatted)); // => "Bold and underlined"
```
### `Bun.wrapAnsi()`
Drop-in replacement for `wrap-ansi` npm package
```ts
Bun.wrapAnsi("The quick brown fox jumps over the lazy dog", 20);
// => "The quick brown fox\njumps over the lazy\ndog"
Bun.wrapAnsi("\u001b[31mThe quick brown fox jumps over the lazy dog\u001b[0m", 20);
// => "\u001b[31mThe quick brown fox\u001b[39m\n\u001b[31mjumps over the lazy\u001b[39m\n\u001b[31mdog\u001b[0m"
```
- **Options**
### `serialize` & `deserialize` in `bun:jsc`
To save a JavaScript value into a SharedArrayBuffer & back, use `serialize` and `deserialize` from the `"bun:jsc"` modu…
```js
import { serialize, deserialize } from "bun:jsc";
const buf = serialize({ foo: "bar" });
const obj = deserialize(buf);
console.log(obj); // => { foo: "bar" }
```
### `estimateShallowMemoryUsageOf` in `bun:jsc`
The `estimateShallowMemoryUsageOf` function returns a best-effort estimate of the memory usage of an object in bytes, e…
```js
import { estimateShallowMemoryUsageOf } from "bun:jsc";
const obj = { foo: "bar" };
const usage = estimateShallowMemoryUsageOf(obj);
console.log(usage); // => 16
const buffer = Buffer.alloc(1024 * 1024);
…
```

## Color — `docs/runtime/color.mdx`
> Format colors as CSS, ANSI, numbers, hex strings, and more
`Bun.color(input, outputFormat?)` uses Bun's CSS parser to parse, normalize, and convert colors from user input to any …
| Format | Example |
| - | - |
| `"css"` | `"red"` |
| `"ansi"` | `"\x1b[38;2;255;0;0m"` |
| `"ansi-16"` | `"\x1b[91m"` |
| `"ansi-256"` | `"\x1b[38;5;196m"` |
| `"ansi-16m"` | `"\x1b[38;2;255;0;0m"` |
| `"number"` | `0x1a2b3c` |
| `"rgb"` | `"rgb(255, 99, 71)"` |
| `"rgba"` | `"rgba(255, 99, 71, 0.5)"` |
- Validate and normalize colors to persist in a database (`number` is the most database-friendly)
- Convert colors to different formats
- Color terminal output beyond the basic 16 colors (use `ansi` to auto-detect terminal color support, or `ansi-16`, `ans
- Format colors for use in CSS injected into HTML
- Get the `r`, `g`, `b`, and `a` color components as JavaScript objects or numbers from a CSS color string
- Flexible input · Format colors as CSS · Format colors as ANSI (for terminals) · 24-bit ANSI colors (`ansi-16m`) · 256 ANSI colors (`ansi-256`) · 16 ANSI colors (`ansi-16`) · Format colors as numbers · Get the red, green, blue, and alpha channels · `{rgba}` object · `[rgba]` array · Format colors as hex strings · Bundle-time client-side color formatting

## Console — `docs/runtime/console.mdx`
> The console object in Bun
Bun provides a browser- and Node.js-compatible console global.
### Object inspection depth
- **CLI flag**: Use `--console-depth ` to set the depth for a single run
- **Configuration**: Set `console.depth` in your `bunfig.toml` to persist it across runs
- **Default**: Bun inspects objects to a depth of `2` levels
`const nested = { a: { b: { c: { d: "deep" } } } }; console.log(nested);`
The CLI flag takes precedence over the configuration file setting.
### Reading from stdin
In Bun, the `console` object is also an `AsyncIterable` that reads `process.stdin` line by line.
`for await (const line of console) { console.log(line); }`

## Workers — `docs/runtime/workers.mdx`
> Use Bun's Workers API to create and communicate with a new JavaScript instance running on a separate thread while sharing I/O resources with the main thread
The `Worker` API is still experimental (particularly for terminating workers).
### Creating a `Worker`
Like in browsers, `Worker` is a global.
- From the main thread · Worker thread · `preload` - load modules before the worker starts · `blob:` URLs · `"open"`
### Messages with `postMessage`
To send messages, use `worker.postMessage` and `self.postMessage`.
- **Performance optimizations**
### Terminating a worker
A `Worker` instance terminates automatically once its event loop has no work left to do.
`const worker = new Worker(new URL("worker.ts", import.meta.url).href); worker.terminate();`
- `process.exit()` · `"close"`
### Managing lifetime
By default, an active `Worker` keeps the main (spawning) process alive, so async tasks like `setTimeout` and promises k…
- `worker.unref()` · `worker.ref()`
### Memory usage with `smol`
Bun's `Worker` supports a `smol` mode that reduces memory usage at a cost of performance.
`const worker = new Worker("./i-am-smol.ts", { smol: true, });`
### Environment Data
Share data between the main thread and workers using `setEnvironmentData()` and `getEnvironmentData()`.
```ts
import { setEnvironmentData, getEnvironmentData } from "worker_threads";
setEnvironmentData("config", { apiUrl: "https://api.google.com" });
const config = getEnvironmentData("config");
console.log(config); // => { apiUrl: "https://api.google.com" }
```
### Worker Events
`process.on("worker", worker => { console.log("New worker created:", worker.threadId); });`
### `Bun.isMainThread`
Check `Bun.isMainThread` to tell whether you're on the main thread.
```ts
if (Bun.isMainThread) {
 console.log("I'm the main thread");
} else {
 console.log("I'm in a worker");
}
```

## HTMLRewriter — `docs/runtime/html-rewriter.mdx`
> Use Bun's HTMLRewriter to transform HTML documents with CSS selectors
HTMLRewriter transforms HTML documents with CSS selectors.
### Usage
```ts
const rewriter = new HTMLRewriter().on("img", {
 element(img) {
  img.setAttribute("src", "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
  img.before('<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" target="_blank">', {
   html: true,
…
```
The rewriter replaces every image with a thumbnail of Rick Astley and wraps each `` in a link, producing a diff like th…
- Input types · Element Handlers · CSS Selector Support · Element Operations · Text Operations · Comment Operations · Document Handlers · Response Handling
### Error Handling
The overload you called decides which channel an error takes.
- Invalid selector syntax in the `on()` method
- Invalid input types (for example, passing a Symbol)
- Body already used errors, and input bodies that have already failed or aborted
- Anything a content handler raises on a `string` / `ArrayBuffer` input, since
```ts
try {
 const result = rewriter.transform("<div></div>");
} catch (error) {
 console.error("HTMLRewriter error:", error);
}
```
- An error thrown by a content handler, or a rejected Promise one returned
- Malformed or truncated input
### See also
You can also read the Cloudflare documentation, which this API is intended to be compatible with.

## Transpiler — `docs/runtime/transpiler.mdx`
> Use Bun's transpiler to transpile JavaScript and TypeScript code
Bun exposes its internal transpiler as the `Bun.Transpiler` class.
`const transpiler = new Bun.Transpiler({ loader: "tsx", // "js" | "jsx" | "ts" | "tsx" });`
### `.transformSync()`
Transpile code synchronously with the `.transformSync()` method.
```ts
const transpiler = new Bun.Transpiler({
 loader: 'tsx',
});
const code = `
import * as whatever from "./whatever.ts"
…
```
### `.transform()`
The `transform()` method is an async version of `.transformSync()` that returns a `Promise`.
`const transpiler = new Bun.Transpiler({ loader: "jsx" }); const result = await transpiler.transform("<div>hi!</div>"); console.log(result);`
### `.scan()`
The `.scan()` method scans source code and returns a list of its imports and exports, plus metadata about each one.
```ts
const transpiler = new Bun.Transpiler({
 loader: "tsx",
});
const code = `
import React from 'react';
…
```
- `import-statement`: `import React from 'react'`
- `require-call`: `const val = require('./cjs.js')`
- `require-resolve`: `require.resolve('./cjs.js')`
- `dynamic-import`: `import('./loader')`
- `import-rule`: `@import 'foo.css'`
- `url-token`: `url('./foo.png')`
### `.scanImports()`
In performance-sensitive code, use the `.scanImports()` method to get a list of imports.
```ts
const transpiler = new Bun.Transpiler({
 loader: "tsx",
});
const code = `
import React from 'react';
…
```
### Reference
```ts
type Loader = "jsx" | "js" | "ts" | "tsx";
interface TranspilerOptions {
 define?: Record<string, string>,
 loader?: Loader,
 target?: "browser" | "bun" | "node",
…
```

## Plugins — `docs/runtime/plugins.mdx`
> Universal plugin API for extending Bun's runtime and bundler
Bun has a universal plugin API that extends both the _runtime_ and the _bundler_.
### Lifecycle hooks
- `onStart()`: Run once the bundler has started a bundle
- `onResolve()`: Run before the bundler resolves a module
- `onLoad()`: Run before the bundler loads a module
- `onBeforeParse()`: Run zero-copy native addons in the parser thread before the bundler parses a file
- **Reference**
### Usage
A plugin is a JavaScript object containing a `name` property and a `setup` function.
```tsx
import type { BunPlugin } from "bun";
const myPlugin: BunPlugin = {
 name: "Custom loader",
 setup(build) {
 },
…
```
### Plugin lifecycle
- Namespaces · `onStart` · `onResolve` · `onLoad` · `.defer()` · Example: tracking and reporting unused exports
### Native plugins
Bun's bundler is fast partly because it is written in native code and uses multiple threads to load and parse modules i…
- `onBeforeParse()`: Called on any thread before Bun's bundler parses a file.
- Creating a native plugin in Rust · `onBeforeParse`

## Archive — `docs/runtime/archive.mdx`
> Create and extract tar archives with Bun's fast native implementation
`Bun.Archive` is Bun's native API for tar archives.
### Quickstart
**Create an archive from files:**
```ts
const archive = new Bun.Archive({
 "hello.txt": "Hello, World!",
 "data.json": JSON.stringify({ foo: "bar" }),
 "nested/file.txt": "Nested content",
});
…
```
### Creating Archives
Use `new Bun.Archive()` to create an archive from an object where keys are file paths and values are file contents.
```ts
const archive = new Bun.Archive({
 "README.md": "# My Project",
 "src/index.ts": "console.log('Hello');",
 "package.json": JSON.stringify({ name: "my-project" }),
});
```
- **Strings** - Text content
- **Blobs** - Binary data
- **ArrayBufferViews** (such as `Uint8Array`) - Raw bytes
- **ArrayBuffers** - Raw binary data
- Writing Archives to Disk · Getting Archive Bytes
### Extracting Archives
- From Existing Archive Data · Extracting to Disk · Filtering Extracted Files
### Reading Archive Contents
- Get All Files · Error Handling · Filtering with Glob Patterns
### Compression
Bun.Archive creates uncompressed tar archives by default.
```ts
const archive = new Bun.Archive({ "hello.txt": "Hello, World!" });
const gzippedTarball = await Bun.file("archive.tar.gz").bytes();
const readArchive = new Bun.Archive(gzippedTarball);
const compressed = new Bun.Archive({ "hello.txt": "Hello, World!" }, { compress: "gzip" });
const maxCompression = new Bun.Archive({ "hello.txt": "Hello, World!" }, { compress: "gzip", level: 12 });
```
- No options or `undefined` - Uncompressed tar (default)
- `{ compress: "gzip" }` - Enable gzip compression at level 6
- `{ compress: "gzip", level: number }` - Gzip with custom level 1-12 (1 = fastest, 12 = smallest)
### Examples
- Bundle Project Files · Extract and Process npm Package · Create Archive from Directory
### Reference
> **Note**: The following type signatures are simplified.
```ts
type ArchiveInput =
 Record<string, string | Blob | Bun.ArrayBufferView | ArrayBufferLike> | Blob | Bun.ArrayBufferView | ArrayBufferLike;
type ArchiveOptions = {
 compress?: "gzip";
 level?: number;
…
```

## Cron — `docs/runtime/cron.mdx`
> Schedule and parse cron jobs with Bun
Bun has built-in support for cron — parse expressions, run a callback on a schedule inside your process, or register OS…
### Quickstart
**Run a callback on a schedule in the current process:**
`Bun.cron("0 * * * *", async () => { await cleanupTempFiles(); });`
### `Bun.cron.parse()`
Parse a cron expression and return the next matching `Date` in the system's local time zone.
`const next = Bun.cron.parse("*/15 * * * *"); console.log(next); // => next quarter-hour boundary`
- Parameters · Returns · Chaining calls
### Cron expression syntax
| Field | Values | Special characters |
| - | - | - |
| Minute | `0`–`59` | `*` `,` `-` `/` |
| Hour | `0`–`23` | `*` `,` `-` `/` |
| Day of month | `1`–`31` | `*` `,` `-` `/` |
| Month | `1`–`12` or `JAN`–`DEC` | `*` `,` `-` `/` |
| Day of week | `0`–`7` or `SUN`–`SAT` | `*` `,` `-` `/` |
- Special characters · Named values · Predefined nicknames · Time zone · Day-of-month and day-of-week interaction
### `Bun.cron(schedule, handler)` — in-process
Run a callback on a cron schedule inside the current process.
`const job = Bun.cron("*/5 * * * *", async () => { await syncToDatabase(); });`
| | In-process | OS-level |
| - | - | - |
| Survives process exit/reboot | No | Yes |
| Shared state between runs | Yes | No (fresh process each time) |
| Platform requirements | None | crontab / launchd / Task Scheduler |
| Windows expression limits | None | 48-trigger cap |
| Return type | `CronJob` | `Promise<void>` |
- Parameters · No-overlap guarantee · Error handling · `bun --hot` · The `CronJob` handle · Fake timers
### `Bun.cron(path, schedule, title)` — OS-level
Register an OS-level cron job that runs a JavaScript/TypeScript module on a schedule.
`await Bun.cron("./worker.ts", "30 2 * * MON", "weekly-report");`
- Parameters · The `scheduled()` handler
### How it works per platform
- Linux · macOS · Windows · User context · Trigger limit · Windows containers
### `Bun.cron.remove()`
Remove a previously registered cron job by its title.
`await Bun.cron.remove("weekly-report");`
| Platform | What `remove()` does |
| - | - |
| Linux | Edits crontab to remove the entry and its marker comment |
| macOS | Runs `launchctl bootout` and deletes the plist file |
| Windows | Runs `schtasks /delete` to remove the scheduled task |

## CSRF Protection — `docs/runtime/csrf.mdx`
> Generate and verify CSRF tokens with Bun's built-in API
`Bun.CSRF` generates and verifies CSRF (Cross-Site Request Forgery) tokens.
`const token = Bun.CSRF.generate("my-secret", { sessionId: "user-session-id" }); const isValid = Bun.CSRF.verify(token, { secret: "my-secret", sessionId: "user-session-id" }); console.log(isValid); // true`
### `Bun.CSRF.generate()`
Generate a CSRF token.
`const token = Bun.CSRF.generate("my-secret-key");`
- `secret` (string, optional) — The secret key used to sign the token. If not provided, Bun generates a random in-memory
- `options` (object, optional):
| Option | Type | Default | Description …|
| - | - | - | -…|
| `expiresIn` | `number` | `86400000` | Milliseconds until the token expires. Defaults to 24 hour…|
| `encoding` | `string` | `"base64url"` | Token encoding format: `"base64"`, `"base64url"`, or `"he…|
| `algorithm` | `string` | `"sha256"` | HMAC algorithm: `"sha256"`, `"sha384"`, `"sha512"`, `"sha…|
| `sessionId` | `string` | (none) | Binds the token to the requesting principal (session ID, …|
### `Bun.CSRF.verify()`
Verify a CSRF token. Returns `true` if the token is valid and has not expired, `false` otherwise.
`const isValid = Bun.CSRF.verify(token, { secret: "my-secret-key" });`
- `token` (string, required) — The token to verify.
- `options` (object, optional):
| Option | Type | Default | Description …|
| - | - | - | -…|
| `secret` | `string` | (auto) | The secret used to sign the token. If not provided, uses …|
| `maxAge` | `number` | `86400000` | Maximum token age in milliseconds, independent of the tok…|
| `encoding` | `string` | `"base64url"` | Must match the encoding used during `generate()`. …|
| `algorithm` | `string` | `"sha256"` | Must match the algorithm used during `generate()`. …|
| `sessionId` | `string` | (none) | Must match the `sessionId` used during `generate()`. A to…|
### Using with `Bun.serve()`
A typical pattern is to generate a token when rendering a form, embed it in a hidden field, and verify it when the form…
```ts
const SECRET = process.env.CSRF_SECRET || "my-secret";
function getSessionId(req: Request): string | null {
 return req.headers.get("cookie")?.match(/(?:^|;\s*)session=([^;]+)/)?.[1] ?? null;
}
const server = Bun.serve({
…
```
### Default secret
If you omit the `secret` parameter in both `generate()` and `verify()`, Bun uses a random secret generated once per thr…
`const token = Bun.CSRF.generate(); const isValid = Bun.CSRF.verify(token); // true`
### TypeScript
```ts
type CSRFAlgorithm = "blake2b256" | "blake2b512" | "sha256" | "sha384" | "sha512" | "sha512-256";
interface CSRFGenerateOptions {
 expiresIn?: number;
 encoding?: "base64" | "base64url" | "hex";
 algorithm?: CSRFAlgorithm;
…
```

## Secrets — `docs/runtime/secrets.mdx`
> Use Bun's Secrets API to store and retrieve sensitive credentials securely
Store and retrieve sensitive credentials securely using the operating system's native credential storage APIs.
```typescript
import { secrets } from "bun";
let githubToken: string | null = await secrets.get({
 service: "my-cli-tool",
 name: "github-token",
});
…
```
### Overview
`Bun.secrets` provides a cross-platform API for managing sensitive credentials that CLI tools and development applicati…
- **macOS**: Keychain Services
- **Linux**: libsecret (GNOME Keyring, KWallet, and other secret service daemons)
- **Windows**: Windows Credential Manager
### API
- `Bun.secrets.get(options)` · `Bun.secrets.set(options)` · `Bun.secrets.delete(options)`
### Examples
- Storing CLI Tool Credentials · Migrating from Plaintext Config Files · Error Handling · Updating Credentials
### Platform Behavior
- macOS (Keychain) · Linux (libsecret) · Windows (Credential Manager)
### Security Considerations
- **Encryption**: The operating system's credential manager encrypts credentials
- **Access Control**: Only the user who stored the credential can retrieve it
- **No Plain Text**: Passwords are never stored in plain text
- **Memory Safety**: Bun zeros out password memory after use
- **Process Isolation**: Credentials are isolated per user account
### Limitations
- Maximum password length varies by platform (typically 2048-4096 bytes)
- Keep `service` and `name` reasonably short (under 256 characters)
- Some special characters may need escaping depending on the platform
- Requires appropriate system services:
- Linux: Secret service daemon must be running
- macOS: Keychain Access must be available
---
### Comparison with Environment Variables
- ✅ Encrypts credentials at rest (thanks to the operating system)
- ✅ Avoids exposing secrets in process memory dumps (Bun zeros the memory after it's no longer needed)
- ✅ Survives application restarts
- ✅ Can be updated without restarting the application
- ✅ Provides user-level access control
- ❌ Requires OS credential service
---
### Best Practices
- **Use descriptive service names**: Match the tool or application name
If you're building a CLI for external use, use a UTI (Uniform Type Identifier) for the service name.
`{ service: "com.docker.hub", name: "username" } { service: "com.vercel.cli", name: "team-name" } { service: "api", name: "key" }`
- **Credentials-only**: Don't store application configuration in this API
- **Use for local development tools**:
- ✅ CLI tools (gh, npm, docker, kubectl)
- ✅ Local development servers
- ✅ Personal API keys for testing
### TypeScript
```typescript
namespace Bun {
 interface SecretsOptions {
  service: string;
  name: string;
 }
…
```

## Image — `docs/runtime/image.mdx`
> Decode, transform, and encode images with a fast native pipeline
`Bun.Image` is a chainable image pipeline for decoding, resizing, rotating, and re-encoding JPEG, PNG, WebP, HEIC, and …
```ts
await Bun.file("photo.jpg").image().resize(400, 400, { fit: "inside" }).webp({ quality: 80 }).write("thumb.webp");
```
### Input
The constructor accepts a path, bytes, or a `Blob` — including `Bun.file()` and `Bun.s3.file()`.
```ts
new Bun.Image("./photo.jpg"); // file path
new Bun.Image(buffer); // Buffer / ArrayBuffer / TypedArray
new Bun.Image(Bun.file("photo.jpg")); // BunFile (read lazily, off-thread)
Bun.file("photo.jpg").image(); // same as above
Bun.s3.file("bucket/photo.jpg").image(); // S3File
```
### Metadata
`const { width, height, format } = await new Bun.Image(input).metadata(); // => { width: 1920, height: 1080, format: "jpeg" }`
### Resize
```ts
img.resize(800); // width 800, keep aspect ratio
img.resize(800, 600); // exactly 800×600 (stretch)
img.resize(800, 600, { fit: "inside" }); // fit within 800×600
img.resize(800, 600, { withoutEnlargement: true }); // never upscale
img.resize(800, 600, { filter: "mitchell" });
```
| `fit` | Behavior |
| - | - |
| `"fill"` (default) | Stretch to exactly `width × height` |
| `"inside"` | Preserve aspect ratio; result fits _within_ the box |
`filter` selects the resampling kernel.
| Filter | Use when |
| - | - |
| `"lanczos3"` _(default)_ | General-purpose, sharpest for photos |
| `"lanczos2"` | Slightly softer, fewer ringing artifacts |
| `"mitchell"` | Smooth gradients; the classic bicubic compromise |
| `"cubic"` | Catmull-Rom — sharper than Mitchell, can ring |
### Rotate · flip
`img.rotate(90); // 90° clockwise (multiples of 90 only) img.flip(); // mirror vertically (about the x-axis) img.flop(); // mirror horizontally (about the y-axis)`
### Modulate
```ts
img.modulate({
 brightness: 1.2, // 1 = unchanged
 saturation: 0, // 0 = greyscale, 1 = unchanged, >1 = boost
});
```
### Output formats
Calling a format method sets the encode target; without one, Bun reuses the source format.
```ts
img.jpeg({ quality: 85 }); // 1–100, default 80
img.png({ compressionLevel: 6 }); // zlib level 0–9
img.png({ palette: true, colors: 64, dither: true }); // indexed PNG
img.webp({ quality: 80 });
img.webp({ lossless: true });
…
```
### Terminals
```ts
await img.bytes(); // Uint8Array
await img.buffer(); // Buffer
await img.blob(); // Blob with .type set to the output MIME
await img.toBase64(); // string
await img.dataurl(); // "data:image/png;base64,…"
…
```
`.write()` accepts the same destinations as `Bun.write` — a path string, `Bun.file()`, `Bun.s3.file()`, or an fd.
### Placeholders
`.placeholder()` returns a low-quality placeholder to inline in HTML before the real image loads.
`const lqip = await Bun.file("hero.jpg").image().placeholder();`
### `Bun.serve` integration
A `Bun.Image` pipeline is a valid `Response` body and sets `Content-Type` automatically.
```ts
Bun.serve({
 routes: {
  "/avatar/:id": async req => {
   if (!/^[a-z0-9]+$/.test(req.params.id)) return new Response(null, { status: 400 });
   const out = await Bun.file(`avatars/${req.params.id}.png`).image().resize(128, 128).webp().blob();
…
```
### Clipboard
```ts
const img = Bun.Image.fromClipboard();
if (img) {
 const png = await img.resize(800, 800, { fit: "inside" }).png().bytes();
}
```
`fromClipboard()` reads PNG, TIFF, HEIC, JPEG, WebP, GIF, or BMP from the system pasteboard on macOS and Windows; the r…
### Platform backends
| | Linux | macOS | Windows |
| - | - | - | - |
| JPEG / PNG / WebP | libjpeg-turbo · built-in · libwebp | same | same |
| BMP / GIF (decode) | built-in | ImageIO | WIC |
| TIFF (decode) | ❌ | ImageIO | WIC |
| Resize / rotate / flip | Highway SIMD | Accelerate vImage ³ | Highway SIMD |
| HEIC / AVIF | ❌ `ERR_IMAGE_FORMAT_UNSUPPORTED` | ImageIO ² | WIC ¹ |
| Clipboard | ❌ returns `null` | NSPasteboard | Win32 |
¹ Windows requires the **HEIF Image Extensions** / **AV1 Video Extension** from the Microsoft Store.
```ts
const out = await img
 .avif({ quality: 50 })
 .bytes()
 .catch(e => {
  if (e.code === "ERR_IMAGE_FORMAT_UNSUPPORTED") return img.webp({ quality: 80 }).bytes();
…
```

## Markdown — `docs/runtime/markdown.mdx`
> Parse and render Markdown with Bun's built-in Markdown API, supporting GFM extensions and custom rendering callbacks
**Unstable API** — This API is under active development and may change in future versions of Bun.
- `Bun.markdown.html()` — render Markdown to an HTML string
- `Bun.markdown.render()` — render Markdown with custom callbacks for each element
- `Bun.markdown.react()` — render Markdown to React JSX elements
### `Bun.markdown.html()`
Convert a Markdown string to HTML.
`const html = Bun.markdown.html("# Hello **world**");`
- Options · Autolinks · Heading IDs
### `Bun.markdown.render()`
Parse Markdown and render it using custom JavaScript callbacks.
```ts
const result = Bun.markdown.render("# Hello **world**", {
 heading: (children, { level }) => `<h${level} class="title">${children}</h${level}>`,
 strong: children => `<b>${children}</b>`,
 paragraph: children => `<p>${children}</p>`,
});
```
- Callback signature · Block callbacks · List item meta · Inline callbacks · Examples · Custom HTML with classes · Stripping all formatting · Omitting elements · ANSI terminal output · Nested list numbering · Code block syntax highlighting · Parser options
### `Bun.markdown.react()`
Render Markdown directly to React elements.
`function Markdown({ text }: { text: string }) { return Bun.markdown.react(text); }`
- Server-side rendering · Component overrides · Available overrides · React 18 and older · Parser options

## YAML — `docs/runtime/yaml.mdx`
> Use Bun's built-in support for YAML files through both runtime APIs and bundler integration
In Bun, YAML is a first-class citizen alongside JSON and TOML.
- Parse YAML strings with `Bun.YAML.parse`
- `import` & `require` YAML files as modules at runtime (including hot reloading & watch mode support)
- `import` & `require` YAML files in frontend apps with Bun's bundler
### Conformance
Bun's YAML parser, written in Rust, passes the official YAML test suite and covers the vast majority of real-world use …
### Runtime API
- `Bun.YAML.parse()` · Multi-document YAML · Supported YAML Features · Error Handling
### Module Import
- ES Modules · Default Import · Named Imports · CommonJS
### Hot Reloading with YAML
When you run your application with `bun --hot`, Bun detects changes to YAML files and reloads them without closing conn…
- **Configuration Hot Reloading**
### Configuration Management
- Environment-Based Configuration · Feature Flags Configuration · Database Configuration · Bundler Integration · Dynamic Imports

## TOML — `docs/runtime/toml.mdx`
> Use Bun's built-in support for TOML files through both runtime APIs and bundler integration
In Bun, TOML is a first-class citizen alongside JSON, JSON5, and YAML.
- Parse TOML strings with `Bun.TOML.parse`
- `import` & `require` TOML files as modules at runtime (including hot reloading & watch mode support)
- `import` & `require` TOML files in frontend apps with Bun's bundler
### Runtime API
- `Bun.TOML.parse()` · Supported TOML Features · Date/times · Error Handling · `Bun.TOML.stringify()`
### Module Import
- ES Modules · Default Import · Named Imports · Import Attributes · CommonJS
### Hot Reloading with TOML
When you run your application with `bun --hot`, Bun detects changes to TOML files and reloads them without restarting:
```toml
[server]
port = 3000
host = "localhost"
[features]
debug = true
…
```
### Bundler Integration
When you bundle with Bun, the bundler parses imported TOML at build time and includes it as a JavaScript module:
`bun build app.ts --outdir=dist`
- Zero runtime TOML parsing overhead in production
- Smaller bundle sizes
- Tree shaking of unused properties (named imports)
- **Dynamic Imports**

## JSON5 — `docs/runtime/json5.mdx`
> Use Bun's built-in support for JSON5 files through both runtime APIs and bundler integration
In Bun, JSON5 is a first-class citizen alongside JSON, TOML, and YAML.
- Parse and stringify JSON5 with `Bun.JSON5.parse` and `Bun.JSON5.stringify`
- `import` & `require` JSON5 files as modules at runtime (including hot reloading & watch mode support)
- `import` & `require` JSON5 files in frontend apps with Bun's bundler
### Conformance
Bun's JSON5 parser is written in Rust and passes 100% of the official JSON5 test suite.
### Runtime API
- `Bun.JSON5.parse()` · Supported JSON5 Features · Error Handling · `Bun.JSON5.stringify()` · Pretty Printing · Special Values
### Module Import
- ES Modules · Default Import · Named Imports · CommonJS
### Hot Reloading with JSON5
```json5
{
 server: {
  port: 3000,
  host: "localhost",
 },
…
```
---
### Bundler Integration
When you bundle with Bun, the bundler parses imported JSON5 files at build time and includes them as JavaScript modules:
`bun build app.ts --outdir=dist`
- Zero runtime JSON5 parsing overhead in production
- Smaller bundle sizes
- Tree shaking of unused properties (named imports)
- **Dynamic Imports**

## JSONL — `docs/runtime/jsonl.mdx`
> Parse newline-delimited JSON (JSONL) with Bun's built-in streaming parser
Bun has built-in support for parsing JSONL (newline-delimited JSON), where each line is a separate JSON value.
`const results = Bun.JSONL.parse('{"name":"Alice"}\n{"name":"Bob"}\n');`
### `Bun.JSONL.parse()`
Parse a complete JSONL input and return an array of all parsed values.
```ts
import { JSONL } from "bun";
const input = '{"id":1,"name":"Alice"}\n{"id":2,"name":"Bob"}\n{"id":3,"name":"Charlie"}\n';
const records = JSONL.parse(input);
console.log(records);
```
- **Error handling**
### `Bun.JSONL.parseChunk()`
For streaming, `parseChunk` parses as many complete values as it can from the input and reports how far it got.
```ts
const chunk = '{"id":1}\n{"id":2}\n{"id":3';
const result = Bun.JSONL.parseChunk(chunk);
console.log(result.values); // [{ id: 1 }, { id: 2 }]
console.log(result.read); // 17 — characters consumed
console.log(result.done); // false — incomplete value remains
…
```
- Return value · Streaming example · Byte offsets with `Uint8Array` · Error recovery
### Supported value types
`const input = '42\n"hello"\ntrue\nnull\n[1,2,3]\n{"key":"value"}\n'; const values = Bun.JSONL.parse(input);`
---
### Performance notes
- **ASCII fast path**: Bun parses pure ASCII input directly without copying, using a zero-allocation `StringView`.
- **UTF-8 support**: Bun decodes non-ASCII `Uint8Array` input to UTF-16.
- **BOM handling**: Bun automatically skips a UTF-8 BOM (`0xEF 0xBB 0xBF`) at the start of a `Uint8Array`.
- **Pre-built object shape**: The result object from `parseChunk` uses a cached structure for fast property access.

## XML — `docs/runtime/xml.mdx`
> Use Bun's built-in support for XML through both runtime APIs and bundler integration
In Bun, XML is a first-class citizen alongside JSON, TOML, YAML, and JSON5.
- Parse and stringify XML with `Bun.XML.parse` and `Bun.XML.stringify`
- `import` & `require` XML files as modules at runtime (including hot reloading & watch mode support)
- `import` & `require` XML files in frontend apps with Bun's bundler
### Runtime API
- `Bun.XML.parse()` · One or many · Input types and encodings · Error handling · `Bun.XML.stringify()` · Pretty printing
### Module Import
- ES Modules · Default Import · Named Import · CommonJS · Import Attributes
### Hot Reloading with XML
```ts
import { config } from "./config.xml";
Bun.serve({
 port: 3000,
 fetch(req) {
  return new Response(`Running in ${config["@env"]} against ${config.database["@host"]}`);
…
```
---
### Bundler Integration
When you bundle with Bun, the bundler parses imported XML files at build time and inlines them as JavaScript objects:
`bun build app.ts --outdir=dist`
- Zero runtime XML parsing overhead in production
- Smaller bundle sizes
- Tree shaking of unused properties
- **Dynamic Imports**
### Conformance
Bun's XML parser is written in Rust and implements XML 1.0 (Fifth Edition) as a non-validating processor that does not …
- The whole document, including the internal DTD subset, must be well-formed — anything else throws a `SyntaxError`.
- The parser expands internal entities declared in the document, with expansion limits so "billion laughs" payloads fail
- The parser does not fetch or read external DTDs or external entities, so there is no XXE surface. In a document with n
- The parser validates nothing against the DTD. It does not resolve namespaces and keeps prefixed names verbatim.
### Performance
The parser works in two stages, like Bun's JSON parser.
| Document | `Bun.XML.parse` | txml | fast-xml-parser | @xmldom/xmldom | xml2js |
| - | -: | -: | -: | -: | -: |
| S3 `ListObjectsV2` response, 231 KB | **1.1 ms** | 4.0 ms | 23 ms | 31 ms | 19 ms |
| Atom feed, 193 KB | **1.1 ms** | 3.7 ms | 19 ms | 23 ms | 16 ms |
| libphonenumber metadata, 960 KB | **5.3 ms** | 9.6 ms | 56 ms | 53 ms | — |
| Chromium `enums.xml`, 1.4 MB | **16 ms** | 41 ms | 150 ms | 103 ms | — |
| freedesktop MIME database, 2.2 MB | **27 ms** | 56 ms | 299 ms | 280 ms | — |

## WebView — `docs/runtime/webview.mdx`
> Control a headless browser from Bun for automation, testing, and scraping — zero dependencies on macOS, Chrome DevTools Protocol everywhere else
`Bun.WebView` is a headless browser built into the runtime.
```ts
await using view = new Bun.WebView();
await view.navigate("https://google.com");
await view.click("a[href]"); // waits for the link to be clickable
const title = await view.evaluate("document.title");
await Bun.write("page.png", await view.screenshot());
```
### Creating a view
```ts
const view = new Bun.WebView({
 width: 1280, // viewport width in CSS pixels (1-16384, default 800)
 height: 720, // viewport height in CSS pixels (1-16384, default 600)
 url: "https://bun.com", // optional: start navigating immediately
});
```
The constructor is synchronous — it returns immediately and spawns the browser subprocess in the background.
- Automatic cleanup with `using` · Persistent storage
### Backends
`Bun.WebView` supports two rendering engines.
| Backend | Engine | Platforms | Requirements …|
| - | - | - | -…|
| `"webkit"` | WKWebView | macOS only | None — uses the system `WebKit.framework` …|
| `"chrome"` | Blink | macOS / Linux / Windows | Chrome, Chromium, Edge, or Brave installed (or Playwright…|
`const view = new Bun.WebView({ backend: "chrome" });`
- How the WebKit backend works · How the Chrome backend works · Finding the Chrome executable · Connecting to an already-running Chrome {#existing-chrome} · Launch flags · Subprocess output
### Navigation
`await view.navigate("https://google.com"); await view.navigate("data:text/html,<h1>hello</h1>"); await view.navigate("file:///path/to/index.html");`
`navigate()` resolves when the main frame's `load` event fires.
- History · Navigation callbacks
### Evaluating JavaScript
`const title = await view.evaluate("document.title"); const items = await view.evaluate("[...document.querySelectorAll('li')].map(li => li.textContent)"); const user = await view.evaluate("({ name: 'bun', ok: true })");`
- It must be an **expression**, not a statement sequence. For multiple statements, wrap in an IIFE: `evaluate("(() => { 
- If it evaluates to a `Promise`, `evaluate()` awaits the promise and returns its resolved value.
The result round-trips through `JSON.stringify` in the page and `JSON.parse` in Bun.
### Screenshots
`const png = await view.screenshot(); await Bun.write("page.png", png);`
- Image format · Return type · Shared memory for terminal graphics
### Input simulation
All input methods dispatch **native** browser events.
- Clicking · Clicking by selector · Typing text · Pressing keys · Scrolling · Resizing
### Console capture
Forward `console.*` calls from the page to your Bun process by passing the `console` option to the constructor.
- Mirror to Bun's console · Custom handler
### Raw Chrome DevTools Protocol {#cdp}
When using `backend: "chrome"`, you can drop down to raw CDP commands for anything the high-level API doesn't cover.
- Sending commands · Subscribing to events
### Lifecycle
- Closing a view · Killing all browsers · Event-loop behavior · Subprocess death
### Concurrency model
Each view has a small number of independent operation "slots".
- one `navigate()` (shared with `reload()`/`goBack()`/`goForward()` on the Chrome backend)
- one `evaluate()`
- one `screenshot()`
- one `cdp()` (Chrome only)
- one "simple" operation — `click()`, `type()`, `press()`, `scroll()`, `scrollTo()`, `resize()` (and `reload()`/`goBack(
### Reference
- `new Bun.WebView(options?)` · `backend` object form · Instance properties · Instance methods · `click()` options · `press()` options · `scrollTo()` options · `screenshot()` options · Static methods

## Environment Variables — `docs/runtime/environment-variables.mdx`
> Read and configure environment variables in Bun, including automatic .env file support
Bun reads your `.env` files automatically and provides idiomatic ways to read and write your environment variables prog…
### Setting environment variables
Bun reads the following files automatically (listed in order of increasing precedence).
- `.env`
- `.env.production`, `.env.development`, `.env.test` (depending on the value of `NODE_ENV`)
- `.env.local` (not loaded when `NODE_ENV=test`)
- `.env.production.local`, `.env.development.local`, `.env.test.local` (depending on the value of `NODE_ENV`)
`FOO=hello BAR=world`
### Manually specifying `.env` files
The `--env-file` flag overrides which `.env` files Bun loads.
`bun --env-file=.env.1 src/index.ts bun --env-file=.env.abc --env-file=.env.def run build bun install --env-file=.env.ci`
### Disabling automatic `.env` loading
Use `--no-env-file` to disable Bun's automatic `.env` file loading, for example in production or CI/CD pipelines where …
`bun run --no-env-file index.ts bun install --no-env-file`
### Quotation marks
```ini
FOO='hello'
FOO="hello"
FOO=`hello`
```
- Expansion · `dotenv`
### Reading environment variables
Read the current environment variables from `process.env`.
`process.env.API_TOKEN; // => "secret"`
### TypeScript
In TypeScript, all properties of `process.env` are typed as `string | undefined`.
`Bun.env.whatever;`
### Configuring Bun
Bun reads these environment variables to configure aspects of its behavior.
| Name | Description …|
| - | -…|
| `NODE_TLS_REJECT_UNAUTHORIZED` | `NODE_TLS_REJECT_UNAUTHORIZED=0` disables SSL certificate…|
| `SSL_CERT_FILE` | Path to a PEM file of CA certificates that Bun trusts in …|
| `SSL_CERT_DIR` | Directories of CA certificates that Bun trusts in additio…|
| `NODE_USE_SYSTEM_CA` | `NODE_USE_SYSTEM_CA=1` makes Bun also trust the system's …|
| `BUN_CONFIG_VERBOSE_FETCH` | If `BUN_CONFIG_VERBOSE_FETCH=curl`, then fetch requests l…|
| `BUN_RUNTIME_TRANSPILER_CACHE_PATH` | The runtime transpiler caches the transpiled output of so…|
| `TMPDIR` | Bun occasionally requires a directory to store intermedia…|
| `NO_COLOR` | If `NO_COLOR=1`, then ANSI color output is disabled. …|
### Runtime transpiler caching
For files larger than 4 KB, Bun caches transpiled output into `$BUN_RUNTIME_TRANSPILER_CACHE_PATH` or the platform-spec…
- Disable the runtime transpiler cache · What does it cache?

## Module Resolution — `docs/runtime/module-resolution.mdx`
> How Bun resolves modules and handles imports in JavaScript and TypeScript
The JavaScript ecosystem is in a years-long transition from CommonJS modules to native ES modules (ESM).
### Syntax
Consider the following files.
`import { hello } from "./hello"; hello();`
- `./hello.tsx`
- `./hello.jsx`
- `./hello.mts`
- `./hello.ts`
- `./hello.mjs`
- `./hello.js`
### Module systems
Bun has native support for CommonJS and ES modules.
| Module Type | `require()` | `import * as` …|
| - | - | -…|
| ES Module | Module Namespace | Module Namespace …|
| CommonJS | module.exports | `default` is `module.exports`, keys of module.exports are…|
- Using `require()` · Using `import` · Using `import` and `require()` together · Top level await
### Importing packages
Bun implements the Node.js module resolution algorithm, so you can import packages from `node_modules` with a bare spec…
`import { stuff } from "foo";`
- NODE_PATH · Custom conditions · Built-in replacements for npm packages
### Path re-mapping
Bun supports import path re-mapping through TypeScript's `compilerOptions.paths` in `tsconfig.json`, which works well w…
```json
{
 "compilerOptions": {
  "paths": {
   "config": ["./config.ts"], // map specifier to file
   "components/*": ["components/*"] // wildcard matching
…
```
### Import suffixes
A query string at the end of an import path changes what the import gives you, like in Vite.
| Suffix | Default export …|
| - | -…|
| `?raw` | The file's text …|
| `?url` | The file's absolute path …|
| `?worker` | A function that starts the file as a `Worker` …|
| `?sharedworker` | The same, but with `SharedWorker`, a global that Bun does…|
| `?worker&url` | The file's absolute path …|
| `?inline` on a `.css` file | The file's text …|
| `?inline` on an asset | A `data:` URL of the file (images, fonts, audio, video, `…|
| `?init` on a `.wasm` file | An async function that takes the imports and returns the …|
```ts
import shader from "./shader.glsl?raw";
import path from "./resize.ts?url";
import logo from "./logo.png?inline"; // "data:image/png;base64,..."
import ResizeWorker from "./resize.ts?worker";
const worker = new ResizeWorker({ name: "resize" });
```
### `import.meta`
The `import.meta` object exposes information about the current module.
```ts
import.meta.dir; // => "/path/to/project"
import.meta.file; // => "file.ts"
import.meta.path; // => "/path/to/project/file.ts"
import.meta.url; // => "file:///path/to/project/file.ts"
import.meta.main; // `true` if this file is directly executed by `bun run`
…
```
| Property | Description …|
| - | -…|
| `import.meta.dir` | Absolute path to the directory containing the current fil…|
| `import.meta.dirname` | An alias to `import.meta.dir`, for Node.js compatibility …|
| `import.meta.env` | An alias to `process.env`. In `bun test`, it also has Vit…|
| `import.meta.file` | The name of the current file, e.g. `index.tsx` …|
| `import.meta.path` | Absolute path to the current file, e.g. `/path/to/project…|
| `import.meta.filename` | An alias to `import.meta.path`, for Node.js compatibility…|
| `import.meta.glob` | Import every module that matches a glob pattern. See `imp…|
| `import.meta.main` | Indicates whether the current file is the entrypoint to t…|
- **`import.meta.glob`**

## ModuleGraph — `docs/runtime/module-graph.mdx`
> Run many instances of one app in a single process with Bun.ModuleGraph. Each instance gets fresh module state and its own timers and I/O; compiled code is shared.
`Bun.ModuleGraph` is experimental.
```ts
const tenantProcess = Object.create(process, { env: { value: { TENANT: "a" }, enumerable: true } });
const graph = new Bun.ModuleGraph({
 globals: { process: tenantProcess }, // free identifiers in the graph's modules
 onError(error, kind) {
  console.error("tenant failed", kind, error);
…
```
### What a graph opens is the graph's
A graph has a context of its own for timers and I/O.
- timers
- `Bun.serve` and `Bun.listen` servers, sockets, `fetch()` requests, WebSockets
- watchers
- child processes, including `Bun.$`, and `Bun.Terminal` terminals
- workers
- database connections
### Disposing
`graph.dispose()` also drops the graph's module registry and `require.cache`.
- `graph.import()`, `graph.run()` and the graph's `require()` fail with `ERR_INVALID_STATE`.
- `import()` from a function of the graph that the host calls fails the same way.
- `import()` by the disposed graph's own leftover code stays pending.
- Modules of the graph that had not run yet never will.
### Calling into a graph
A function runs in its caller's context, whichever graph defined it.
`app.start(); // what this opens is the host's graph.run(() => app.start()); // what this opens is the graph's`
### Errors
Uncaught exceptions and unhandled rejections go to the `onError` of the graph in whose context they happen, instead of …
### What is shared
The global object, `globalThis` properties, plugins and native addons are shared by every graph and the host.

## File Types — `docs/runtime/file-types.mdx`
> File types and loaders supported by Bun's bundler and runtime
The Bun bundler implements a set of default loaders.
`import my_toml from "./my_file" with { type: "toml" }; const { default: my_toml } = await import("./my_file", { with: { type: "toml" } });`
### Built-in loaders
- `js` · `jsx` · `ts` · `tsx` · `json` · `jsonc` · `toml` · `yaml` · `json5` · `xml` · `text` · `md` · `napi` · `sqlite` · `html` · `css` · `sh` loader · `file`

## JSX — `docs/runtime/jsx.mdx`
> Built-in JSX and TSX support in Bun with configurable transpilation options
Bun supports `.jsx` and `.tsx` files.
```ts
function Component(props: {message: string}) {
 return (
  <body>
   <h1 style={{color: 'red'}}>{props.message}</h1>
  </body>
…
```
### Configuration
Bun reads your `tsconfig.json` or `jsconfig.json` to determine how to perform the JSX transform internally.
- [`jsx`](https://www.typescriptlang.org/tsconfig#jsx) · [`jsxFactory`](https://www.typescriptlang.org/tsconfig#jsxFactory) · [`jsxFragmentFactory`](https://www.typescriptlang.org/tsconfig#jsxFragmentFactory) · [`jsxImportSource`](https://www.typescriptlang.org/tsconfig#jsxImportSource) · JSX pragma
### Logging
Bun implements special logging for JSX to help with debugging.
```tsx
import { Stack, UserCard } from "./components";
console.log(
 <Stack>
  <UserCard name="Dom" bio="Street racer and Corona lover" />
  <UserCard name="Jakob" bio="Super spy and Dom's secret brother" />
…
```
### Prop punning
```tsx
function Div(props: {className: string;}) {
 const {className} = props;
 return <div className={className} />;
 return <div {className} />;
}
```

## Code generation from strings — `docs/runtime/code-generation-from-strings.mdx`
> Make eval(), new Function() and every other way a string becomes code throw, for the whole process, with --disallow-code-generation-from-strings.
`--disallow-code-generation-from-strings` stops a program from turning strings into code.
| Flag | What it refuses …|
| - | -…|
| `--disallow-code-generation-from-strings` | `eval()` and the `Function` constructors. The same as Nod…|
| `--disallow-code-generation-from-strings=strict` | Every way a string becomes code in the process. Bun only.…|
`bun --disallow-code-generation-from-strings=strict server.ts`
### How `=strict` decides
With `=strict`, the engine runs static code and nothing else.
- Bun's own built-in modules and functions.
- The modules that Bun's loader reads from where the program is stored: files on disk or, for a compiled executable, the
- The program given to `bun -e` or on standard input.
### The flag applies to the whole process
Bun reads the flag at startup.
- There is no API that re-enables code generation.
- Every `Worker` has the level of the process, whatever `execArgv` you give the `Worker`.
- Every realm and context the program creates later has it: `ShadowRealm`, `node:vm` contexts under `=strict`, and every
- The level a compiled executable is built with is a floor. `BUN_OPTIONS` can raise it and cannot lower it.
- **Workers whose code is a string**
### What each level refuses
| A string becomes code through …| Flag | `=strict` |
| -…| - | - |
| `eval()`, direct and indirect …| refused | refused |
| `new Function()`, and the async, generator and async gene…| refused | refused |
| `ShadowRealm.prototype.evaluate()`, and `eval()` inside a…| refused | refused |
| `new vm.Script()`, `vm.runInThisContext()`, `vm.runInCont…| allowed | refused |
| `vm.compileFunction()`, `new vm.SourceTextModule()` …| allowed | refused |
| `eval()` inside a `node:vm` context, including one made w…| allowed | refused |
| `module._compile()`, and a `require.extensions` handler t…| allowed | refused |
| Assigning a different `Module.wrapper` …| allowed | refused |
- Importing module files, with literal or computed specifiers, and modules embedded in a compiled executable.
- `new Worker()` with a file.
- `require()` and `createRequire()` of files and built-in modules.
- `Bun.ModuleGraph`.
- `JSON.parse()`, `RegExp`, and `eval()` of a value that is not a string.
- WebAssembly.
A compiled executable with `=strict` loads modules, Workers and `require()`d files from the executable only.
### The inspector
The debugger evaluates the code its client sends, so `=strict` refuses it.
```txt
error: BUN_INSPECT cannot be used with --disallow-code-generation-from-strings=strict: the inspector evaluates code from strings
```
| Route …| With `=strict` |
| -…| - |
| `--inspect`, `--inspect-wait`, `--inspect-brk`, `BUN_INSP…| Bun exits with an error at startup |
| `BUN_INSPECT_CONNECT_TO` …| Bun prints a warning and connects to nothing |
| `inspector.open()` from `node:inspector` …| throws |
| `startRemoteDebugger()` from `bun:jsc` …| throws |
| `new inspector.Session()` from `node:inspector`, which ne…| evaluates nothing, with or without the flag |
| `$vm`, JavaScriptCore's debugging global (`BUN_JSC_useDol…| not defined |
### Parts of Bun that stop working
| Part of Bun …| Flag | `=strict` |
| -…| - | - |
| The development server: `import()` with import attributes…| throws | throws |
| `node:repl`: `repl.start()`, `REPLServer` …| works | throws |
| `node:worker_threads`: `new Worker(code, { eval: true })`…| works | throws |
| `node:inspector`: `inspector.open()` …| works | throws |
| `bun:jsc`: `startRemoteDebugger()` …| works | throws |
| `node:vm`: everything that takes source text …| works | throws |
| `node:module`: `module._compile()`, assigning `Module.wra…| works | throws |
| `Bun.plugin()`: `onLoad` and `build.module()` that return…| works | throws |
Every built-in module still loads with `=strict`.
### In a compiled executable
Pass the flag when you compile.
`bun build --compile --disallow-code-generation-from-strings=strict ./server.ts --outfile server`
- With `--trim` · Files on disk are not part of the program · `data:` URLs written in the source
### Checking that the flag is on
`if (!process.execArgv.includes("--disallow-code-generation-from-strings=strict")) { throw new Error("refusing to start without --disallow-code-generation-from-strings=strict"); }`
A `Worker` inherits `process.execArgv`, so the same check works inside one.
- With `=strict`, Bun adds the flag to the list the `Worker` sees.
- With the flag and no value, the `Worker` sees the list you gave it, as in Node.js. The `Worker` still refuses `eval()`
### A build of Bun that always has `=strict`
When you build Bun from source, turning the `codeGenerationFromStrings` build option off makes `=strict` a compile-time…
`bun scripts/build.ts --profile=release --codeGenerationFromStrings=off`
- It reads no flag or environment variable to get the level, so `BUN_BE_BUN=1` and a missing `--compile-exec-argv` do no
- The flag itself is still accepted, with or without `=strict`, and changes nothing.
- `process.execArgv` lists only the flags you gave, as in any build. To check for this build, see that `new vm.Script(""
- Bun's own code that compiles a string, such as `node:vm`'s and `module._compile()`'s, sits after a refusal that always
### What the flag does not cover
- **Files.** Outside a compiled executable, a program that writes a file and then imports it runs that file. Importing f
- **Startup.** The entry point, a file given to `--preload`, `--import` or `--require`, and `bun -e` are the program. So
- **`BUN_OPTIONS`.** Bun reads `BUN_OPTIONS` in a compiled executable too. It cannot lower the level. With the flag and 
- **The executable file.** Whoever can replace or edit a compiled executable decides what is embedded in it.
- **`BUN_BE_BUN`.** With `BUN_BE_BUN=1`, a compiled executable runs as the `bun` CLI. The embedded program does not star
- **The process's own memory.** A program that can write to its own memory can change anything, including the embedded m

## File System Router — `docs/runtime/file-system-router.mdx`
> Bun provides a fast API for resolving routes against file-system paths
This API is intended primarily for library authors.
### Next.js-style
The `FileSystemRouter` class resolves routes against a `pages` directory.
```txt
pages
├── index.tsx
├── settings.tsx
├── blog
│   ├── [slug].tsx
…
```
### Reference
```ts
interface Bun {
 class FileSystemRouter {
  constructor(params: {
   dir: string;
   style: "nextjs";
…
```
