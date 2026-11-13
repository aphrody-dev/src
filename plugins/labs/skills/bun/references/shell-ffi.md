# Bun Shell, spawn, FFI, cc, Node-API

Source: oven-sh/bun@7f964e6 docs/ (2026-11-11), compressed. Prose cut to first sentence; code blocks capped at 5 lines; CodeGroup keeps first tab only. Full text: C:/src/third_party/browsers/oven-sh_bun/docs/<path> or https://bun.com/docs/<path-without-ext>.

## Shell — `docs/runtime/shell.mdx`

> Use Bun's shell scripting API to run shell commands from JavaScript
> Bun Shell makes shell scripting with JavaScript & TypeScript fun.

```ts
import { $ } from "bun";
const response = await fetch("https://google.com");
await $`cat < ${response} | wc -c`; // 1256
```

### Features

- **Cross-platform**: works on Windows, Linux & macOS. Instead of installing `rimraf` or `cross-env`, you can use Bun Sh
- **Familiar**: Bun Shell is a bash-like shell that supports redirection, pipes, and environment variables.
- **Globs**: Bun Shell supports glob patterns natively, including `**`, `*`, and `{expansion}`.
- **Template literals**: Template literals execute shell commands and interpolate variables and expressions.
- **Safety**: Bun Shell escapes all strings by default, preventing shell injection attacks.
- **JavaScript interop**: Use `Response`, `ArrayBuffer`, `Blob`, `Bun.file(path)` and other JavaScript objects as stdin,

---

### Getting started

```js
import { $ } from "bun";
await $`echo "Hello World!"`; // Hello World!
```

By default, shell commands print to stdout.

### Error handling

By default, a non-zero exit code throws an error.

```js
import { $ } from "bun";
try {
 const output = await $`something-that-may-fail`.text();
 console.log(output);
} catch (err) {
…
```

### Redirection

- `<` redirect stdin
- `>` or `1>` redirect stdout
- `2>` redirect stderr
- `&>` redirect both stdout and stderr
- `>>` or `1>>` redirect stdout, _appending_ to the destination, instead of overwriting
- `2>>` redirect stderr, _appending_ to the destination, instead of overwriting
  Bun Shell also supports redirecting from and to JavaScript objects.
- **Example: Redirect output to JavaScript objects (`>`)**

```js
import { $ } from "bun";
const buffer = Buffer.alloc(100);
await $`echo "Hello World!" > ${buffer}`;
console.log(buffer.toString()); // Hello World!\n
```

- `Buffer`, `Uint8Array`, `Uint16Array`, `Uint32Array`, `Int8Array`, `Int16Array`, `Int32Array`, `Float32Array`, `Float6
- `Bun.file(path)`, `Bun.file(fd)` (writes to the file)
- **Example: Redirect input from JavaScript objects (`<`)**

```js
import { $ } from "bun";
const response = new Response("hello i am a response body");
const result = await $`cat < ${response}`.text();
console.log(result); // hello i am a response body
```

- `Buffer`, `Uint8Array`, `Uint16Array`, `Uint32Array`, `Int8Array`, `Int16Array`, `Int32Array`, `Float32Array`, `Float6
- `Bun.file(path)`, `Bun.file(fd)` (reads from the file)
- `Response` (reads from the body)
- **Example: Redirect stdin -> file**

```js
import { $ } from "bun";
await $`cat < myfile.txt`;
```

- **Example: Redirect stdout -> file**

```js
import { $ } from "bun";
await $`echo bun! > greeting.txt`;
```

- **Example: Redirect stderr -> file**

```js
import { $ } from "bun";
await $`bun run index.ts 2> errors.txt`;
```

- **Example: Redirect stderr -> stdout**

```js
import { $ } from "bun";
await $`bun run ./index.ts 2>&1`;
```

- **Example: Redirect stdout -> stderr**

```js
import { $ } from "bun";
await $`bun run ./index.ts 1>&2`;
```

### Piping (`|`)

```js
import { $ } from "bun";
const result = await $`echo "Hello World!" | wc -w`.text();
console.log(result); // 2\n
```

### Command substitution (`$(...)`)

```js
import { $ } from "bun";
await $`echo Hash of current commit: $(git rev-parse HEAD)`;
```

Because Bun internally uses the special `raw` property on the input template literal, using the backtick syntax for com…

### Environment variables

```js
import { $ } from "bun";
await $`FOO=foo bun -e 'console.log(process.env.FOO)'`; // foo\n
```

- **Changing the environment variables**
  By default, all commands use `process.env` as their environment variables.

```js
import { $ } from "bun";
await $`echo $FOO`.env({ ...process.env, FOO: "bar" }); // bar
```

- **Changing the working directory**

```js
import { $ } from "bun";
await $`pwd`.cwd("/tmp"); // /tmp
```

---

### Reading output

```js
import { $ } from "bun";
const result = await $`echo "Hello World!"`.text();
console.log(result); // Hello World!\n
```

- **Reading output as JSON**

```js
import { $ } from "bun";
const result = await $`echo '{"foo": "bar"}'`.json();
console.log(result); // { foo: "bar" }
```

- **Reading output line-by-line**

```js
import { $ } from "bun";
for await (let line of $`echo "Hello World!"`.lines()) {
  console.log(line); // Hello World!
}
```

- **Reading output as a Blob**

```js
import { $ } from "bun";
const result = await $`echo "Hello World!"`.blob();
console.log(result); // Blob(13) { size: 13, type: "text/plain" }
```

---

### Builtin Commands

For cross-platform compatibility, Bun Shell implements a set of builtin commands, in addition to reading commands from …

- `cd`: change the working directory
- `ls`: list files in a directory (supports `-l` for long listing format)
- `rm`: remove files and directories
- `echo`: print text
- `pwd`: print the working directory
- `bun`: run bun in bun

### Utilities

Bun Shell also implements a set of utilities for working with shells.

- **`$.braces` (brace expansion)**

```js
import { $ } from "bun";
await $.braces(`echo {1,2,3}`);
// => ["echo 1", "echo 2", "echo 3"]
```

- **`$.escape` (escape strings)**

```js
import { $ } from "bun";
console.log($.escape('$(foo) `bar` "baz"'));
// => "\$(foo) \`bar\` \"baz\""
```

---

### `.sh` file loader

For simple shell scripts, you can use Bun Shell instead of `/bin/sh`.
`echo "Hello World! pwd=$(pwd)"`

### Implementation notes

Bun Shell is a small programming language implemented in Rust, with a handwritten lexer, parser, and interpreter.

### Security in the Bun shell

By design, Bun Shell _does not invoke a system shell_ like `/bin/sh`.

```js
import { $ } from "bun";
const userInput = "my-file.txt; rm -rf /";
await $`ls ${userInput}`;
```

- **Security considerations**
  While Bun Shell prevents command injection by default, you are still responsible for security in certain scenarios.

```js
import { $ } from "bun";
const userInput = "world; touch /tmp/pwned";
await $`bash -c "echo ${userInput}"`;
```

- **Argument injection**
  Bun Shell cannot know how an external command interprets its own command-line arguments.

```js
import { $ } from "bun";
const branch = "--upload-pack=echo pwned";
await $`git ls-remote origin ${branch}`;
```

### Credits

Large parts of this API were inspired by zx, dax, and bnx.

## Spawn — `docs/runtime/child-process.mdx`

> Spawn child processes with `Bun.spawn` or `Bun.spawnSync`

### Spawn a process (`Bun.spawn()`)

Provide a command as an array of strings.
`const proc = Bun.spawn(["bun", "--version"]); console.log(await proc.exited); // 0`

### Input stream

By default, the input stream of the subprocess is undefined; configure it with the `stdin` parameter.

```ts
const proc = Bun.spawn(["cat"], {
  stdin: await fetch(
    "https://raw.githubusercontent.com/oven-sh/bun/main/examples/hashing.js",
  ),
});
const text = await proc.stdout.text();
console.log(text); // "const input = "hello world".repeat(400); ..."
```

| Value                    | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `null`                   | **Default.** Provide no input to the subprocess  |
| `"pipe"`                 | Return a `FileSink` for fast incremental writing |
| `"inherit"`              | Inherit the `stdin` of the parent process        |
| `Bun.file()`             | Read from the specified file                     |
| `TypedArray \| DataView` | Use a binary buffer as input                     |
| `Response`               | Use the response `body` as input                 |
| `Request`                | Use the request `body` as input                  |
| `ReadableStream`         | Use a readable stream as input                   |

### Output streams

Read the subprocess's output from the `stdout` and `stderr` properties.
`const proc = Bun.spawn(["bun", "--version"]); const text = await proc.stdout.text(); console.log(text); // => "1.3.3\n"`
| Value | Description …|
| - | -…|
| `"pipe"` | **Default for `stdout`.** Pipe the output to a `ReadableS…|
| `"inherit"`| **Default for`stderr`.** Inherit from the parent process…|
| `"ignore"`| Discard the output …|
|`Bun.file()`| Write to the specified file …|
|`number` | Write to the file with the given file descriptor …|

### Exit handling

Use the `onExit` callback to listen for the process exiting or being killed.

```ts
const proc = Bun.spawn(["bun", "--version"], {
  onExit(proc, exitCode, signalCode, error) {},
});
```

### Resource usage

```ts
const proc = Bun.spawn(["bun", "--version"]);
await proc.exited;
const usage = proc.resourceUsage();
console.log(`Max memory used: ${usage.maxRSS} bytes`);
console.log(`CPU time (user): ${usage.cpuTime.user} µs`);
…
```

### Resource limits with cgroups (Linux)

On Linux, pass `cgroup` to start the subprocess inside a control group.

```ts
import { mkdirSync, writeFileSync } from "node:fs";
const dir = "/sys/fs/cgroup/build-jobs";
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/memory.max`, String(2 * 1024 ** 3)); // cgroup v1: memory.limit_in_bytes
const proc = Bun.spawn({
…
```

### Using AbortSignal

```ts
const controller = new AbortController();
const { signal } = controller;
const proc = Bun.spawn({
 cmd: ["sleep", "100"],
 signal,
…
```

### Using timeout and killSignal

```ts
const proc = Bun.spawn({
  cmd: ["sleep", "10"],
  timeout: 5000, // 5 seconds in milliseconds
});
await proc.exited; // Will resolve after 5 seconds
```

By default, Bun kills timed-out processes with `SIGTERM`.

### Using maxBuffer

For `Bun.spawnSync`, `maxBuffer` limits how many bytes of output the process can emit before Bun kills it:

```ts
const result = Bun.spawnSync({
  cmd: ["yes"], // or ["bun", "exec", "yes"] on Windows
  maxBuffer: 100,
});
```

### Inter-process communication (IPC)

Bun supports a direct inter-process communication channel between two `bun` processes.

```ts
const child = Bun.spawn(["bun", "child.ts"], {
  ipc(message) {},
});
```

- `advanced`: (default) Bun serializes messages using the JSC `serialize` API, which supports cloning everything `struct
- `json`: Bun serializes messages using `JSON.stringify` and `JSON.parse`, which does not support as many object types a
- **IPC between Bun & Node.js**

```js
if (typeof Bun !== "undefined") {
 const prefix = `[bun ${process.versions.bun} 🐇]`;
 const node = Bun.spawn({
  cmd: ["node", __filename],
  ipc({ message }) {
…
```

---

### Terminal (PTY) support

For interactive terminal applications, use the `terminal` option to spawn a subprocess with a pseudo-terminal (PTY) att…

```ts
const proc = Bun.spawn(["bash"], {
 terminal: {
  cols: 80,
  rows: 24,
  data(terminal, data) {
…
```

- The subprocess sees `process.stdout.isTTY` as `true`
- `stdin`, `stdout`, and `stderr` are all connected to the terminal
- `proc.stdin`, `proc.stdout`, and `proc.stderr` return `null` — use the terminal instead
- Access the terminal via `proc.terminal`
- **Terminal options**
  | Option | Description …| Default |
  | - | -…| - |
  | `cols` | Number of columns …| `80` |
  | `rows` | Number of rows …| `24` |
  | `name` | Terminal type for PTY configuration (set the `TERM` env v…| `"xterm-256color"` |
  | `data` | Callback when data is received `(terminal, data) => void`…| — |
  | `exit` | Callback when PTY stream closes (EOF or error). `exitCode…| — |
| `drain`| Callback when ready for more data`(terminal) => void` …| — |
- **Terminal methods**

```ts
proc.terminal.write("echo hello\n");
proc.terminal.resize(120, 40);
proc.terminal.setRawMode(true);
proc.terminal.ref();
proc.terminal.unref();
…
```

- **Reusable Terminal**
  To run multiple commands in sequence through the same terminal session, create a terminal independently and reuse it ac…

```ts
await using terminal = new Bun.Terminal({
 cols: 80,
 rows: 24,
 data(term, data) {
  process.stdout.write(data);
…
```

- You can reuse the terminal across multiple spawns
- You control when to close the terminal
- The `exit` callback fires when you call `terminal.close()`, not when each subprocess exits
- Use `proc.exited` to detect individual subprocess exits
- **Platform differences**
  `Bun.Terminal` uses `openpty()` on Linux and macOS, and ConPTY (`CreatePseudoConsole`) on Windows.
- **No termios on Windows.** `inputFlags`, `outputFlags`, `localFlags`, and `controlFlags` always read as `0` and settin
- **No echo without a child process on Windows.** On POSIX, the kernel line discipline echoes `write()` input back to th
- **ConPTY re-encodes output.** ConPTY renders the child's output to a virtual screen and emits whatever VT sequences de
- **Input `\r` is not translated to `\n` on Windows.** POSIX `ICRNL` maps carriage return to newline on input; ConPTY pa
- **`process.on('SIGWINCH')` in the child does not fire under ConPTY** unless the child is reading stdin in raw mode. `p
- On Windows before 11 24H2 (build 26100), `terminal.close()` may not terminate a still-running child promptly. The dela

### Blocking API (`Bun.spawnSync()`)

`Bun.spawnSync` is the blocking equivalent of `Bun.spawn`.

- The returned object contains a `success` property that indicates whether the process exited with a zero exit code.
- The `stdout` and `stderr` properties are instances of `Buffer` instead of `ReadableStream`.
- There is no `stdin` property. Use `Bun.spawn` to incrementally write to the subprocess's input stream.
  `const proc = Bun.spawnSync(["echo", "hello"]); console.log(proc.stdout.toString()); // => "hello\n"`

### Benchmarks

⚡️ `Bun.spawn` and `Bun.spawnSync` use `posix_spawn(3)`.
`bun spawn.mjs`

### Reference

The following is a reference of the Spawn API and types.

```ts
interface Bun {
 spawn(command: string[], options?: SpawnOptions.OptionsObject): Subprocess;
 spawnSync(command: string[], options?: SpawnOptions.OptionsObject): SyncSubprocess;
 spawn(options: { cmd: string[] } & SpawnOptions.OptionsObject): Subprocess;
 spawnSync(options: { cmd: string[] } & SpawnOptions.OptionsObject): SyncSubprocess;
…
```

## FFI — `docs/runtime/ffi.mdx`

> Use Bun's FFI module to efficiently call native libraries from JavaScript
> `bun:ffi` is **experimental**, with known bugs and limitations.

### dlopen usage (`bun:ffi`)

```ts
import { dlopen, FFIType, suffix } from "bun:ffi";
const path = `libsqlite3.${suffix}`;
const {
 symbols: {
  sqlite3_libversion, // the function to call
…
```

---

### Performance

According to our benchmark, `bun:ffi` is roughly 2-6x faster than Node.js FFI through `Node-API`.

### Usage

- **Zig**: `pub export fn add(a: i32, b: i32) i32 { return a + b; }`
- **Rust**

```rust
#[no_mangle]
pub extern "C" fn add(a: i32, b: i32) -> i32 {
  a + b
}
```

- **C++**

```c
#include <cstdint>
extern "C" int32_t add(int32_t a, int32_t b) {
  return a + b;
}
```

---

### FFI types

The following `FFIType` values are supported.

| `FFIType` | C Type         | Aliases                     |
| --------- | -------------- | --------------------------- |
| buffer    | `char*`        |                             |
| cstring   | `char*`        |                             |
| function  | `(void*)(*)()` | `fn`, `callback`            |
| ptr       | `void*`        | `pointer`, `void*`, `char*` |
| i8        | `int8_t`       | `int8_t`                    |
| i16       | `int16_t`      | `int16_t`                   |
| i32       | `int32_t`      | `int32_t`, `int`            |
| i64       | `int64_t`      | `int64_t`, `isize`          |

```ts
const {
 symbols: { write_all },
} = dlopen(path, {
 write_all: { args: ["i32", "buffer", "buffer_length"], returns: "u64" },
});
…
```

### Strings

JavaScript strings and C-like strings are different, and that complicates using strings with native libraries.

- UTF16 (2 bytes per letter) or potentially latin1, depending on the JavaScript engine &amp; what characters are used
- `length` stored separately
- Immutable
- UTF8 (1 byte per letter), usually
- The length is not stored. Instead, the string is null-terminated: its length is the index of the first `\0`
- Mutable
  `CString(ptr: number, byteOffset?: number, byteLength?: number): string;`

### Function pointers

Async functions are not supported

```ts
import { CFunction } from "bun:ffi";
let myNativeLibraryGetVersion = 
const getVersion = new CFunction({
 returns: "cstring",
 args: [],
…
```

### Callbacks

Use `JSCallback` to create JavaScript callback functions that you can pass to C/FFI functions, so native code can call …

```ts
import { dlopen, JSCallback, ptr, CString } from "bun:ffi";
const {
 symbols: { search },
 close,
} = dlopen("libmylib", {
…
```

- **Experimental thread-safe callbacks**
  `JSCallback` has experimental support for thread-safe callbacks.

```ts
const searchIterator = new JSCallback(
  (ptr, length) => /hello/.test(new CString(ptr, 0, Number(length))),
  {
    returns: "bool",
    args: ["ptr", "usize"],
    threadsafe: true, // Optional. Defaults to `false`
  },
);
```

### Pointers

Bun represents pointers as a `number` in JavaScript.
`import { ptr } from "bun:ffi"; let myTypedArray = new Uint8Array(32); const myPtr = ptr(myTypedArray);`

| `FFIType` | `read` function |
| --------- | --------------- |
| ptr       | `read.ptr`      |
| i8        | `read.i8`       |
| i16       | `read.i16`      |
| i32       | `read.i32`      |
| i64       | `read.i64`      |
| u8        | `read.u8`       |
| u16       | `read.u16`      |
| u32       | `read.u32`      |

- **Memory management**
  `bun:ffi` does not manage memory for you.
- From JavaScript · From C, Rust, Zig, etc · Memory safety
  Don't use raw pointers outside of FFI.
- **Pointer alignment**
  If an API expects a pointer sized to something other than `char` or `u8`, make sure the `TypedArray` is also that size.
- **Passing a pointer**

```ts
import { dlopen, FFIType } from "bun:ffi";
const {
 symbols: { encode_png },
} = dlopen(myLibraryPath, {
 encode_png: {
…
```

The auto-generated wrapper converts the `TypedArray` to a pointer.

- **Reading pointers**

```ts
const out = encode_png(
 pixels,
 128,
 128,
);
…
```

## C Compiler — `docs/runtime/c-compiler.mdx`

> Compile and run C from JavaScript with low overhead
> `bun:ffi` has experimental support for compiling and running C from JavaScript with low overhead.

### Usage (cc in `bun:ffi`)

See the introduction blog post for background.

```ts
import { cc } from "bun:ffi";
import source from "./hello.c" with { type: "file" };
const {
 symbols: { hello },
} = cc({
…
```

- **Primitive types**
  `cc` supports the same `FFIType` values as `dlopen`, except `buffer_length`.
  | `FFIType` | C Type | Aliases | | - | - | - |
  | buffer | `char*` | |
  | cstring | `char*` | |
  | function | `(void*)(*)()` | `fn`, `callback` |
  | ptr | `void*` | `pointer`, `void*`, `char*` |
  | i8 | `int8_t` | `int8_t` |
  | i16 | `int16_t` | `int16_t` |
  | i32 | `int32_t` | `int32_t`, `int` |
  | i64 | `int64_t` | `int64_t`, `isize` |
- **Strings, objects, and non-primitive types**
  For strings, objects, and other non-primitive types that don't map 1:1 to C types, `cc` supports N-API.
- Returning a C string to JavaScript · `cc` Reference · `library: string | string[]` · `symbols` · `source` · `flags: string | string[]` · `define: Record<string, string>` · Disabling `cc`
  Pass `--no-ffi-cc` to disable the C compiler for a process.
  `bun --no-ffi-cc ./app.ts`

## Node-API — `docs/runtime/node-api.mdx`

> Use Bun's Node-API module to build native add-ons to Node.js
> Node-API is an interface for building native add-ons to Node.js.
> `const napi = require("./my-node-module.node");`
