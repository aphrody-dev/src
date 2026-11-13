---
source_url: https://developer.chrome.com/blog/webassembly-jspi-origin-trial
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: 636372025a96d060423e40b20bab13862735c81eb449f506694287d8f8b142e2
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Thomas Steiner [GitHub](https://github.com/tomayac) [LinkedIn](https://www.linkedin.com/in/thomassteinerlinkedin) [Mastodon](https://toot.cafe/@tomayac) [Bluesky](https://bsky.app/profile/tomayac.com) [Homepage](https://blog.tomayac.com/)

JavaScript Promise Integration (JSPI) is an API that allows synchronous
sequential code compiled to WebAssembly to access asynchronous Web APIs. Many
Web APIs are crafted in terms of JavaScript
[promises](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise):
instead of immediately performing the requested operation, they return a promise
to do so. When the action is finally performed, the browser's task runner
invokes any callbacks with the promise. JSPI hooks into this architecture to
allow a WebAssembly application to be suspended when the promise is returned,
and to be resumed when the promise is resolved.

From Chrome 123 until Chrome 128,
[JSPI is available as an origin trial](https://developer.chrome.com/origintrials#/view_trial/1603844417297317889).
Learn more about JSPI in the blog post
[Introducing the WebAssembly JavaScript Promise Integration API](https://v8.dev/blog/jspi)
or from the
[specification draft](https://github.com/WebAssembly/js-promise-integration).

To get a better understanding of how to use this feature, consider the following
excerpt of a C program that calculates the Fibonacci sequence by outsourcing the
addition to a JavaScript function.

```c
// This is C code.
long promiseFib(long x) {
  if (x == 0)
    return 0;
  if (x == 1)
    return 1;
  // This is where the C code calls asynchronous JavaScript.
  return promiseAdd(promiseFib(x - 1), promiseFib(x - 2));
}

// Addition artificially wrapped in a Promise.
EM_ASYNC_JS(long, promiseAdd, (long x, long y), {
  // This is asynchronous JavaScript code.
  return Promise.resolve(x+y);
});
```

To compile this C program to WebAssembly, use the following command, which
requires the [Emscripten SDK](https://github.com/emscripten-core/emsdk).

```bash
emcc -O3 badfib.c -o index.html -s ASYNCIFY=2
```

You can feature-detect JSPI support from JavaScript as follows:

```javascript
if ("Suspender" in WebAssembly) {
  // JSPI is supported.
}
```

To try out JSPI with real users of your application,
[sign up for the origin trial](https://developer.chrome.com/origintrials#/view_trial/1603844417297317889).
Read [Get started with origin trials](https://developer.chrome.com/docs/web-platform/origin-trials.md.txt) if you
need instructions. The JSPI team is looking forward to receiving your origin
trial feedback (see [Step 5](https://developer.chrome.com/docs/web-platform/origin-trials.md.txt) in the
instructions) so the feature fits your needs when it ships!
