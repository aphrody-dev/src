---
source_url: https://web.dev/articles/webassembly-performance-patterns-for-web-apps
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 666993f181731cedf1b0629a9576108dfe57b839d2827b0f12dea041683fc93c
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Thomas Steiner [GitHub](https://github.com/tomayac) [LinkedIn](https://www.linkedin.com/in/thomassteinerlinkedin) [Mastodon](https://toot.cafe/@tomayac) [Bluesky](https://bsky.app/profile/tomayac.com) [Homepage](https://blog.tomayac.com/)

In this guide, aimed at web developers who want to benefit from WebAssembly,
you'll learn how to make use of Wasm to outsource CPU-intensive tasks with the
help of a running example. The guide covers everything from best practices for
loading Wasm modules to optimizing their compilation and instantiation. It
further discusses shifting the CPU-intensive tasks to Web Workers and looks into
implementation decisions you'll be confronted with like when to create the Web
Worker and whether to keep it permanently alive or spin it up when needed. The
guide iteratively develops the approach and introduces one performance pattern
at a time, until suggesting the best solution to the problem.

## Assumptions

Assume you have a very CPU-intensive task that you want to outsource to
WebAssembly (Wasm) for its close-to-native performance. The CPU-intensive task
used as an example in this guide calculates the factorial of a number. The
factorial is the product of an integer and all the integers below it. For
example, the factorial of four (written as `4!`) is equal to `24` (that is,
`4 * 3 * 2 * 1`). The numbers get big quickly. For example, `16!` is
`2,004,189,184`. A more realistic example of a CPU-intensive task could be
[scanning a barcode](https://web.dev/case-studies/mishipay.md.txt#fallback_solution) or
[tracing a raster image](https://web.dev/case-studies/svgcode.md.txt).

A performant iterative (rather than recursive) implementation of a `factorial()`
function is shown in the following code sample written in C++.

```c
#include <stdint.h>

extern "C" {

// Calculates the factorial of a non-negative integer n.
uint64_t factorial(unsigned int n) {
    uint64_t result = 1;
    for (unsigned int i = 2; i <= n; ++i) {
        result *= i;
    }
    return result;
}

}
```

For the rest of the article, assume there's a Wasm module based on compiling
this `factorial()` function with Emscripten in a file called `factorial.wasm`
using all
[code optimization best practices](https://emscripten.org/docs/optimizing/Optimizing-Code.html).
For a refresher on how to do this, read
[Calling compiled C functions from JavaScript using ccall/cwrap](https://emscripten.org/docs/porting/connecting_cpp_and_javascript/Interacting-with-code.html#calling-compiled-c-functions-from-javascript-using-ccall-cwrap).
The following command was used to compile `factorial.wasm` as
[standalone Wasm](https://v8.dev/blog/emscripten-standalone-wasm).

```bash
emcc -O3 factorial.cpp -o factorial.wasm -s WASM_BIGINT -s EXPORTED_FUNCTIONS='["_factorial"]'  --no-entry
```

In HTML, there's a `form` with an `input` paired with an `output` and a submit
`button`. These elements are referenced from JavaScript based on their names.

```html
<form>
  <label>The factorial of <input type="text" value="12" /></label> is
  <output>479001600</output>.
  <button type="submit">Calculate</button>
</form>
```

```javascript
const input = document.querySelector("input");
const output = document.querySelector("output");
const button = document.querySelector("button");
```

## Loading, compilation, and instantiation of the module

Before you can use a Wasm module, you need to load it. On the web, this happens
through the
[`fetch()`](https://developer.mozilla.org/docs/Web/API/Fetch_API/Using_Fetch)
API. As you know that your web app depends on the Wasm module for the
CPU-intensive task, you should preload the Wasm file as early as possible. You
do this with a
[CORS-enabled fetch](https://developer.mozilla.org/docs/Web/HTML/Attributes/rel/preload#cors-enabled_fetches)
in the `<head>` section of your app.

```html
<link rel="preload" as="fetch" href="factorial.wasm" crossorigin />
```

> [!NOTE]
> **Note:** You can optionally fine-tune the priority of the preload using the [`fetchpriority`](https://developer.mozilla.org/docs/Web/HTML/Element/link#fetchpriority) attribute so it doesn't compete with even more urgent resources.

In reality, the `fetch()` API is asynchronous and you need to `await` the
result.

```javascript
fetch("factorial.wasm");
```

Next, compile and instantiate the Wasm module. There are temptingly named
functions called
[`WebAssembly.compile()`](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/compile_static)
(plus
[`WebAssembly.compileStreaming()`](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/compileStreaming_static))
and
[`WebAssembly.instantiate()`](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/instantiate_static)
for these tasks, but, instead, the
[`WebAssembly.instantiateStreaming()`](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/instantiateStreaming_static)
method compiles _and_ instantiates a Wasm module directly from a streamed
underlying source like `fetch()`---no `await` needed. This is the most efficient
and optimized way to load Wasm code. Assuming the Wasm module exports a
`factorial()` function, you can then use it straight away.

```javascript
const importObject = {};
const resultObject = await WebAssembly.instantiateStreaming(
  fetch("factorial.wasm"),
  importObject,
);
const factorial = resultObject.instance.exports.factorial;

button.addEventListener("click", (e) => {
  e.preventDefault();
  output.textContent = factorial(parseInt(input.value, 10));
});
```

## Shift the task to a Web Worker

If you execute this on the main thread, with truly CPU-intensive tasks, you risk
blocking the entire app. A common practice is to shift such tasks to a Web
Worker.

### Restructure of the main thread

To move the CPU-intensive task to a Web Worker, the first step is to restructure
the application. The main thread now creates a `Worker`, and, apart from that,
only deals with sending the input to the Web Worker and then receiving the
output and displaying it.

```javascript
/* Main thread. */

let worker = null;

// When the button is clicked, submit the input value
//  to the Web Worker.
button.addEventListener("click", (e) => {
  e.preventDefault();

  // Create the Web Worker lazily on-demand.
  if (!worker) {
    worker = new Worker("worker.js");

    // Listen for incoming messages and display the result.
    worker.addEventListener("message", (e) => {
      output.textContent = e.result;
    });
  }

  worker.postMessage({ integer: parseInt(input.value, 10) });
});
```

### Bad: Task runs in Web Worker, but code is racy

The Web Worker instantiates the Wasm module and, upon receiving a message,
performs the CPU-intensive task and sends the result back to the main thread.
The problem with this approach is that instantiating a Wasm module with
`WebAssembly.instantiateStreaming()` is an asynchronous operation. This means
that the code is racy. In the worst case, the main thread sends data when the
Web Worker isn't ready yet, and the Web Worker never receives the message.

```javascript
/* Worker thread. */

// Instantiate the Wasm module.
// 🚫 This code is racy! If a message comes in while
// the promise is still being awaited, it's lost.
const importObject = {};
const resultObject = await WebAssembly.instantiateStreaming(
  fetch("factorial.wasm"),
  importObject,
);
const factorial = resultObject.instance.exports.factorial;

// Listen for incoming messages, run the task,
// and post the result.
self.addEventListener("message", (e) => {
  const { integer } = e.data;
  self.postMessage({ result: factorial(integer) });
});
```

> [!NOTE]
> **Note:** You could introduce a messaging system where the Web Worker informs the main thread once the Wasm module is ready, and only then accept incoming requests.

### Better: Task runs in Web Worker, but with possibly redundant loading and compiling

One workaround to the problem of asynchronous Wasm module instantiation is to
move the Wasm module loading, compilation, and instantiation all into the event
listener, but this would mean that this work would need to happen on every
received message. With HTTP caching and the HTTP cache able to cache the
compiled Wasm bytecode, this is not the worst solution, but there's a better
way.

By moving the asynchronous code to the beginning of the Web Worker and not
actually waiting for the promise to fulfill, but rather storing the promise in a
variable, the program immediately moves on to the event listener part of the
code, and no message from the main thread will be lost. Inside of the event
listener, the promise can then be awaited.

```javascript
/* Worker thread. */

const importObject = {};
// Instantiate the Wasm module.
// 🚫 If the `Worker` is spun up frequently, the loading
// compiling, and instantiating work will happen every time.
const wasmPromise = WebAssembly.instantiateStreaming(
  fetch("factorial.wasm"),
  importObject,
);

// Listen for incoming messages
self.addEventListener("message", async (e) => {
  const { integer } = e.data;
  const resultObject = await wasmPromise;
  const factorial = resultObject.instance.exports.factorial;
  const result = factorial(integer);
  self.postMessage({ result });
});
```

### Good: Task runs in Web Worker, and loads and compiles only once

The result of the static
[`WebAssembly.compileStreaming()`](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/compileStreaming_static)
method is a promise that resolves to a
[`WebAssembly.Module`](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/Module).
One nice feature of this object is that it can be transferred using
[`postMessage()`](https://developer.mozilla.org/docs/Web/API/Window/postMessage).
This means the Wasm module can be loaded and compiled just once in the main
thread (or even another Web Worker purely concerned with loading and compiling),
and then be transferred to the Web Worker responsible for the CPU-intensive
task. The following code shows this flow.

```javascript
/* Main thread. */

const modulePromise = WebAssembly.compileStreaming(fetch("factorial.wasm"));

let worker = null;

// When the button is clicked, submit the input value
// and the Wasm module to the Web Worker.
button.addEventListener("click", async (e) => {
  e.preventDefault();

  // Create the Web Worker lazily on-demand.
  if (!worker) {
    worker = new Worker("worker.js");

    // Listen for incoming messages and display the result.
    worker.addEventListener("message", (e) => {
      output.textContent = e.result;
    });
  }

  worker.postMessage({
    integer: parseInt(input.value, 10),
    module: await modulePromise,
  });
});
```

On the Web Worker side, all that remains is to extract the `WebAssembly.Module`
object and instantiate it. Since the message with the `WebAssembly.Module` isn't
streamed, the code in the Web Worker now uses
[`WebAssembly.instantiate()`](https://developer.mozilla.org/docs/WebAssembly/JavaScript_interface/instantiate_static)
rather than the `instantiateStreaming()` variant from before. The instantiated
module is cached in a variable, so the instantiation work only needs to happen
once upon spinning up the Web Worker.

```javascript
/* Worker thread. */

let instance = null;

// Listen for incoming messages
self.addEventListener("message", async (e) => {
  // Extract the `WebAssembly.Module` from the message.
  const { integer, module } = e.data;
  const importObject = {};
  // Instantiate the Wasm module that came via `postMessage()`.
  instance = instance || (await WebAssembly.instantiate(module, importObject));
  const factorial = instance.exports.factorial;
  const result = factorial(integer);
  self.postMessage({ result });
});
```

### Perfect: Task runs in inline Web Worker, and loads and compiles only once

Even with HTTP caching, obtaining the (ideally) cached Web Worker code and
potentially hitting the network is expensive. A common performance trick is to
inline the Web Worker and load it as a `blob:` URL. This still requires the
compiled Wasm module to be passed to the Web Worker for instantiation, as the
contexts of the Web Worker and the main thread are different, even if they're
based on the same JavaScript source file.

> [!NOTE]
> **Note:** Inlining Web Worker code by hand may harm the overall structure of your codebase. One way to deal with this is to leave the actual inlining to build tools like \[Vite that have special query suffixes like `?inline](https://v3.vitejs.dev/guide/features.html#import-with-query-suffixes)`.

```javascript
/* Main thread. */

const modulePromise = WebAssembly.compileStreaming(fetch("factorial.wasm"));

let worker = null;

const blobURL = URL.createObjectURL(
  new Blob(
    [
      `
let instance = null;

self.addEventListener('message', async (e) => {
  // Extract the \`WebAssembly.Module\` from the message.
  const {integer, module} = e.data;
  const importObject = {};
  // Instantiate the Wasm module that came via \`postMessage()\`.
  instance = instance || await WebAssembly.instantiate(module, importObject);
  const factorial = instance.exports.factorial;
  const result = factorial(integer);
  self.postMessage({result});
});
`,
    ],
    { type: "text/javascript" },
  ),
);

button.addEventListener("click", async (e) => {
  e.preventDefault();

  // Create the Web Worker lazily on-demand.
  if (!worker) {
    worker = new Worker(blobURL);

    // Listen for incoming messages and display the result.
    worker.addEventListener("message", (e) => {
      output.textContent = e.result;
    });
  }

  worker.postMessage({
    integer: parseInt(input.value, 10),
    module: await modulePromise,
  });
});
```

### Lazy or eager Web Worker creation

So far, all the code samples spun up the Web Worker lazily on-demand, that is,
when the button was pressed. Depending on your application, it can make sense to
create the Web Worker more eagerly, for example, when the app is idle or even as
part of the app's bootstrapping process. Therefore, move the Web Worker creation
code outside of the button's event listener.

```javascript
const worker = new Worker(blobURL);

// Listen for incoming messages and display the result.
worker.addEventListener("message", (e) => {
  output.textContent = e.result;
});
```

### Keep the Web Worker around or not

One question that you may ask yourself is whether you should keep the Web Worker
permanently around, or recreate it whenever you need it. Both approaches are
possible and have their advantages and disadvantages. For example, keeping a Web
Worker permanently around may increase your app's memory footprint and make
dealing with concurrent tasks harder, since you somehow need to map results
coming from the Web Worker back to the requests. On the other hand, your Web
Worker's bootstrapping code might be rather complex, so there could be a lot of
overhead if you create a new one each time. Luckily this is something you can
measure with the
[User Timing API](https://developer.mozilla.org/docs/Web/API/Performance_API/User_timing).

The code samples so far have kept one permanent Web Worker around. The following
code sample creates a new Web Worker ad hoc whenever needed. Note that you need
to keep track of
[terminating the Web Worker](https://developer.mozilla.org/docs/Web/API/Worker/terminate)
yourself. (The code snippet skips error handling, but in case something goes
wrong, be sure to terminate in all cases, success or failure.)

```javascript
/* Main thread. */

let worker = null;

const modulePromise = WebAssembly.compileStreaming(fetch("factorial.wasm"));

const blobURL = URL.createObjectURL(
  new Blob(
    [
      `
// Caching the instance means you can switch between
// throw-away and permanent Web Worker freely.
let instance = null;

self.addEventListener('message', async (e) => {
  // Extract the \`WebAssembly.Module\` from the message.
  const {integer, module} = e.data;
  const importObject = {};
  // Instantiate the Wasm module that came via \`postMessage()\`.
  instance = instance || await WebAssembly.instantiate(module, importObject);
  const factorial = instance.exports.factorial;
  const result = factorial(integer);
  self.postMessage({result});
});  
`,
    ],
    { type: "text/javascript" },
  ),
);

button.addEventListener("click", async (e) => {
  e.preventDefault();
  // Terminate a potentially running Web Worker.
  if (worker) {
    worker.terminate();
  }
  // Create the Web Worker lazily on-demand.
  worker = new Worker(blobURL);
  worker.addEventListener("message", (e) => {
    worker.terminate();
    worker = null;
    output.textContent = e.data.result;
  });
  worker.postMessage({
    integer: parseInt(input.value, 10),
    module: await modulePromise,
  });
});
```

## Demos

There are two demos for you to play with. One with an
[ad hoc Web Worker](https://googlechrome.github.io/samples/factorial-wasm-ad-hoc-worker/)
([source code](https://github.com/GoogleChrome/samples/tree/gh-pages/factorial-wasm-ad-hoc-worker))
and one with a
[permanent Web Worker](https://googlechrome.github.io/samples/factorial-wasm-permanent-worker/)
([source code](https://github.com/GoogleChrome/samples/tree/gh-pages/factorial-wasm-permanent-worker/)).
If you open the Chrome DevTools and check the Console, you can see the User
Timing API logs that measure the time it takes from the button click to the
displayed result on the screen. The Network tab shows the `blob:` URL
request(s). In this example, the timing difference between ad hoc and permanent
is about 3×. In practice, to the human eye, both are indistinguishable in this
case. The results for your own real life app will most likely vary.

## Conclusions

This post has explored some performance patterns for dealing with Wasm.

- As a general rule, prefer the streaming methods (`WebAssembly.compileStreaming()` and `WebAssembly.instantiateStreaming()`) over their non-streaming counterparts (`WebAssembly.compile()` and `WebAssembly.instantiate()`).
- If you can, outsource performance-heavy tasks in a Web Worker, and do the Wasm loading and compiling work only once outside of the Web Worker. This way, the Web Worker only needs to instantiate the Wasm module it receives from the main thread where the loading and compiling happened with `WebAssembly.instantiate()`, which means the instance can be cached if you keep the Web Worker around permanently.
- Measure carefully whether it makes sense to keep one permanent Web Worker around forever, or to create ad hoc Web Workers whenever they are needed. Also think when it is the best time to create the Web Worker. Things to take into consideration are memory consumption, the Web Worker instantiation duration, but also the complexity of possibly having to deal with concurrent requests.

If you take these patterns into account, you're on the right track to optimal
Wasm performance.

## Acknowledgements

This guide was reviewed by
[Andreas Haas](https://scholar.google.com/citations?user=0mBu9WMAAAAJ),
[Jakob Kummerow](https://github.com/jakobkummerow),
[Deepti Gandluri](https://www.linkedin.com/in/deepti-gandluri/),
[Alon Zakai](https://www.linkedin.com/in/alonzakai/),
[Francis McCabe](https://dl.acm.org/profile/81100035055),
[François Beaufort](https://github.com/beaufortfrancois), and
[Rachel Andrew](https://rachelandrew.co.uk/).
