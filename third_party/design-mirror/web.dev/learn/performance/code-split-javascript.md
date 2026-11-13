---
source_url: https://web.dev/learn/performance/code-split-javascript
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:40+00:00
sha256: a1a233232df37bbae07aa83bc009855d92814509c53cdd32dbe2362d7b00707b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Loading large JavaScript resources impacts page speed significantly. Splitting
your JavaScript into smaller chunks and only downloading what is necessary for
a page to function during startup can greatly improve your page's [load
responsiveness](https://web.dev/articles/tbt), which in turn can improve your page's [Interaction to Next
Paint (INP)](https://web.dev/articles/inp).

As a page downloads, parses, and compiles large JavaScript files, it can become
unresponsive for periods of time. The page elements are visible, as they are a
part of a page's initial HTML and styled by CSS. However, because the JavaScript
required to power those interactive elements---as well as other scripts loaded by
the page---may be parsing and executing the JavaScript for them to function. The
result is that the user may feel as though the interaction was significantly
delayed, or even altogether broken.

This often happens because the main thread is blocked, as JavaScript is parsed
and compiled on the main thread. If this process takes too long, interactive
page elements may not respond quickly enough to user input. One remedy for this
is to load only the JavaScript you need for the page to function, while
deferring other JavaScript to load later on through a technique known as code
splitting. This module focuses on the latter of these two techniques.

## Reduce JavaScript parsing and execution during startup through code splitting

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/) throws a warning when [JavaScript execution takes longer than 2
seconds, and fails when it takes more than 3.5 seconds](https://developer.chrome.com/docs/lighthouse/performance/bootup-time/). Excessive JavaScript
parsing and execution is a potential problem at _any_ point in the page
lifecycle, as it has the potential to increase an interaction's [_input delay_](https://web.dev/articles/optimize-input-delay.md.txt)
if the time at which the user interacts with the page coincides with the moment
the main thread tasks responsible for processing and executing JavaScript are
running.

More than that, excessive JavaScript execution and parsing is particularly
problematic during the initial page load, as this is the point in the page
lifecycle that users are quite likely to interact with the page. In fact,
[Total Blocking Time (TBT)](https://web.dev/articles/tbt.md.txt)---a load responsiveness metric---is [highly correlated](https://almanac.httparchive.org/en/2022/performance#inp-and-tbt)
with [INP](https://web.dev/articles/inp.md.txt), suggesting that users have a high tendency to attempt interactions
during the initial page load.

The Lighthouse audit that reports the time spent executing each JavaScript file
that your page requests is useful in that it can help you identify exactly which
scripts may be candidates for [_code splitting_](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting.md.txt). You can then go further by
using the [coverage tool](https://developer.chrome.com/docs/devtools/coverage/) in Chrome DevTools to identify exactly which parts of
a page's JavaScript go unused during page load.

Code splitting is a useful technique that can reduce a page's initial JavaScript
payloads. It lets you split a JavaScript bundle into two parts:

- The JavaScript needed at page load, and therefore can't be loaded at any other time.
- Remaining JavaScript that can be loaded at a later point in time, most often at the point in which the user interacts with a given interactive element on the page.

Code splitting can be done by using the [dynamic `import()`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Operators/import) syntax. This
syntax---unlike `<script>` elements which requests a given JavaScript resource
during startup---makes a request for a JavaScript resource at a later point during
the page lifecycle.

> [!IMPORTANT]
> **Important:** Dynamic `import()` is a function-like expression that lets you dynamically load a JavaScript module. It is an asynchronous operation that can be used to import a module in response to an interaction, or other any other conditions that you want to load additional modules. Dynamic `import()` is distinct from the [static
> `import`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/import) statement, which imports a module immediately and requires that the parent module and all of its dependencies are parsed and executed before it can run.

```javascript
document.querySelectorAll("#myForm input").addEventListener(
  "blur",
  async () => {
    // Get the form validation named export from the module through destructuring:
    const { validateForm } = await import("/validate-form.mjs");

    // Validate the form:
    validateForm();
  },
  { once: true },
);
```

In the preceding JavaScript snippet, the `validate-form.mjs` module is
downloaded, parsed, and executed only when a user [blurs](https://developer.mozilla.org/docs/Web/API/Element/blur_event) any of a form's
`<input>` fields. In this situation, the JavaScript resource responsible for
driving the form's validation logic is only ever involved with the page when it
is most likely to be actually used.

JavaScript bundlers like [webpack](https://webpack.js.org/guides/code-splitting/), [Parcel](https://parceljs.org/features/code-splitting/), [Rollup](https://rollupjs.org/guide/en#dynamic-import), and [esbuild](https://esbuild.github.io/api/#splitting) can be
configured to split JavaScript bundles into smaller chunks whenever they
encounter a dynamic `import()` call in your source code. Most of these tools do
this automatically, but esbuild in particular requires you to opt into this
optimization.

> [!NOTE]
> **Note:** [React](https://react.dev) abstracts the dynamic `import()` through its [`React.lazy`](https://react.dev/reference/react/lazy) syntax. Under the hood, this still relies on dynamic `import()`, and the module bundler is still responsible for splitting the JavaScript into separate chunks.

## Helpful notes on code splitting

While code splitting is an effective method of reducing main thread contention
during the initial page load, it pays to keep a few things in mind if you decide
to go audit your JavaScript source code for code splitting opportunities.

### Use a bundler if you can

It's common practice for developers to use [JavaScript modules](https://developer.mozilla.org/docs/Web/JavaScript/Guide/Modules) during the
development process. It's an excellent developer experience improvement that
improves code readability and maintainability. However, there are some
suboptimal performance characteristics that can result when shipping JavaScript
modules to production.

Most importantly, you should use a bundler to process and optimize your source
code, including modules you intend to code split. Bundlers are very effective at
not just applying optimizations to JavaScript source code, but they are also
quite effective at balancing performance considerations such as bundle size
against compression ratio. Compression effectiveness increases with bundle size,
but bundlers also try to ensure that bundles aren't so large that they incur
long tasks due to script evaluation.

Bundlers also avoid the problem of shipping a large number of unbundled modules
over the network. Architectures that use JavaScript modules tend to have large,
complex module trees. When module trees are unbundled, each module represents a
separate HTTP request, and interactivity in your web app may be delayed if you
don't bundle modules. While it's possible to use the
[`<link rel="modulepreload">` resource hint](https://developer.chrome.com/blog/modulepreload/) to load large module trees as early
as possible, JavaScript bundles are still preferable from a loading performance
standpoint.

### Don't inadvertently disable streaming compilation

Chromium's V8 JavaScript engine offers a number of optimizations out of the box
to ensure that your production JavaScript code loads as efficiently as possible.
One of these optimizations is known as _streaming compilation_ which---like the
incremental parsing of HTML streamed to the browser---compiles streamed chunks of
JavaScript as they arrive from the network.

You have a couple of ways to ensure that streaming compilation occurs for your
web application in Chromium:

- **Transform your production code to avoid using JavaScript modules.** Bundlers can transform your JavaScript source code based on a compilation target, and the target is often specific to a given environment. V8 will apply streaming compilation to any JavaScript code that doesn't use modules, and you can configure your bundler to transform your JavaScript module code into a syntax that doesn't use JavaScript modules and their features.
- **If you want to ship JavaScript modules to production, use the `.mjs`
  extension.** Whether or not your production JavaScript uses modules, there's no special [content type](https://en.wikipedia.org/wiki/Media_type) for JavaScript that uses modules versus JavaScript that does not. Where V8 is concerned, you effectively opt out of streaming compilation when you ship JavaScript modules in production using the `.js` extension. If you use the `.mjs` extension for JavaScript modules, V8 can ensure that streaming compilation for module-based JavaScript code isn't broken.

Don't let these considerations dissuade you from using code splitting. Code
splitting is an effective way of reducing initial JavaScript payloads to users,
but by using a bundler and knowing how you can preserve V8's streaming
compilation behavior, you can ensure that your production JavaScript code is as
fast for users as it can be.

### Dynamic import demo

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy" src="https://chrome.dev/f/learn_performance_dynamic_import/?attributionHidden=true&amp;sidebarCollapsed=true&amp;previewSize=100" style="height: 100%; width: 100%; border: 0;" title="Learn Performance Dynamic Import demo"></iframe>

## webpack

[webpack](https://webpack.js.org/guides/code-splitting/) ships with a plugin named [`SplitChunksPlugin`](https://webpack.js.org/plugins/split-chunks-plugin/), which lets you
configure how the bundler splits JavaScript files. webpack recognizes both the
dynamic `import()` and static `import` statements. The behavior of
`SplitChunksPlugin` can be modified by specifying the `chunks` option in its
configuration:

- `chunks: async` is the default value, and refers to dynamic `import()` calls.
- `chunks: initial` refers to static `import` calls.
- `chunks: all` covers both dynamic `import()` and static imports, allowing you to share chunks between `async` and `initial` imports.

By default, whenever webpack encounters a dynamic `import()` statement. it
creates a separate chunk for that module:

```javascript
/* main.js */

// An application-specific chunk required during the initial page load:
import myFunction from "./my-function.js";

myFunction("Hello world!");

// If a specific condition is met, a separate chunk is downloaded on demand,
// rather than being bundled with the initial chunk:
if (condition) {
  // Assumes top-level await is available. More info:
  // https://v8.dev/features/top-level-await
  await import("/form-validation.js");
}
```

The default webpack configuration for the preceding code snippet results in two
separate chunks:

- The `main.js` chunk---which webpack classifies as an `initial` chunk---that includes `main.js` and `./my-function.js` module.
- The `async` chunk, which includes only `form-validation.js` (containing a [file hash](https://bundlers.tooling.report/hashing/) in the resource name if configured). This chunk is only downloaded if and when `condition` is [truthy](https://developer.mozilla.org/docs/Glossary/Truthy).

This configuration lets you defer loading the `form-validation.js` chunk until
it's actually needed. This can improve load responsiveness by reducing [script
evaluation](https://web.dev/articles/script-evaluation-and-long-tasks) time during the initial page load. Script download and evaluation
for the `form-validation.js` chunk occurs when a specified condition is met, in
which case, the dynamically imported module is downloaded. One example may be a
condition where a polyfill is only downloaded for a particular browser, or---as in
the earlier example---the imported module is necessary for a user interaction.

On the other hand, changing the `SplitChunksPlugin` configuration to specify
`chunks: initial` ensures that code is split only on initial chunks. These are
chunks such as those statically imported, or listed in webpack's [`entry`
property](https://webpack.js.org/concepts/entry-points/). Looking at the preceding example, the resulting chunk would be a
combination of `form-validation.js` _and_ `main.js` in a single script file,
resulting in potentially worse initial page load performance.

The options for `SplitChunksPlugin` can also be configured to separate larger
scripts into multiple smaller ones---for example by using the [`maxSize`](https://webpack.js.org/plugins/split-chunks-plugin/#splitchunksmaxsize) option
to instruct webpack to split chunks into separate files if they exceed what is
specified by `maxSize`. [Dividing large script files into smaller files can
improve load responsiveness](https://web.dev/articles/script-evaluation-and-long-tasks#loading_scripts_with_the_script_element), as in some cases CPU-intensive script evaluation
work is divided into smaller tasks, which are less likely to block the main
thread for longer periods of time.

Additionally, generating larger JavaScript files also means that scripts are
more likely to suffer from cache invalidation. For example, if you ship a very
large script with both framework and first-party application code, the entire
bundle can be invalidated if only the framework is updated, but nothing else in
the bundled resource.

On the other hand, smaller script files increases the likelihood that a return
visitor retrieves resources from the cache, resulting in faster page loads on
repeat visits. However, smaller files benefit less from compression than larger
ones, and may increase network round-trip time on page loads with an unprimed
browser cache. Care must be taken to strike a balance between caching
efficiency, compression effectiveness, and script evaluation time.

> [!CAUTION]
> **Caution:** If you disable `SplitChunksPlugin` by specifying `splitChunks: false` in your application's webpack configuration, then `./my-function.js` gets bundled in _both_ `main.js` and `form-validation.js`.

#### webpack demo

> [!NOTE]
> **Note:** Since this demo uses a bundler, a demo can't be embedded for it. To run it, clone the following Github repository to your local machine and follow the instructions in the repository's [`README`](https://github.com/kevinfarrugia/learn-performance-webpack-code-splitting/#readme).

[webpack `SplitChunksPlugin` demo](https://github.com/kevinfarrugia/learn-performance-webpack-code-splitting/).

## Test your knowledge

Which type of `import` statement is used when performing code
splitting?
Dynamic `import()`. Correct! Static `import`. Try again.
Which type of `import` statement _must_ be at the top
of a JavaScript module, and in no other location?
Dynamic `import()`. Try again. Static `import`. Correct!
When using `SplitChunksPlugin` in webpack, what is the
difference between an `async` chunk and an
`initial` chunk?
`async` chunks are loaded using dynamic `import()` and `initial` chunks are loaded using static `import`. Correct! `async` chunks are loaded using static `import` and `initial` chunks are loaded using dynamic `import()`. Try again.

## Up next: Lazy load images and `<iframe>` elements

Though it tends to be a fairly expensive type of resource, JavaScript isn't the
only resource type you can defer the loading of. Image and `<iframe>` elements
are potentially costly resources in their own right. Similar to JavaScript, you
can defer the loading of images and `<iframe>` element by [lazy loading
them](https://web.dev/learn/performance/lazy-load-images-and-iframe-elements), which is explained in the next module of this course.
