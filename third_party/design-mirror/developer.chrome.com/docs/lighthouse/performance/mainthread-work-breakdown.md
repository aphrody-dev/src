---
source_url: https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:46+00:00
sha256: 29a38a2ded0fcc015f4469f0ffed9a36c486b4448a4d23af77a423bb677e01ac
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
The browser's [renderer process](https://developer.chrome.com/blog/inside-browser-part3.md.txt)
is what turns your code into a web page that your users can interact with.
By default, the [main thread](https://developer.mozilla.org/docs/Glossary/Main_thread)
of the renderer process typically handles most code:
it parses the HTML and builds the DOM, parses the CSS and applies the specified styles,
and parses, evaluates, and executes the JavaScript.

The main thread also processes user events.
So, any time the main thread is busy doing something else,
your web page may not respond to user interactions,
leading to a bad experience.

## How the Lighthouse main thread work audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
flags pages that keep the main thread busy for longer than 4 seconds
during load:

To help you identify the sources of main thread load,
Lighthouse shows a breakdown of where CPU time was spent
while the browser loaded your page.

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to minimize main thread work

The sections below are organized based on the categories that Lighthouse reports.
See [The anatomy of a frame](https://aerotwist.com/blog/the-anatomy-of-a-frame/)
for an overview of how Chromium renders web pages.

See [Do less main thread work](https://developer.chrome.com/docs/devtools/lighthouse.md.txt#main)
to learn how to use Chrome DevTools to investigate exactly what your main thread is doing
as the page loads.

### Script evaluation

- [Optimize third-party JavaScript](https://web.dev/articles/fast#optimize_your_third_party_resources)
- [Debounce your input handlers](https://web.dev/articles/debounce-your-input-handlers)
- [Use web workers](https://web.dev/articles/off-main-thread)

### Style and layout

- [Reduce the scope and complexity of style calculations](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations)
- [Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)

### Rendering

- [Stick to compositor only properties and manage layer count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count)
- [Simplify paint complexity and reduce paint areas](https://web.dev/articles/simplify-paint-complexity-and-reduce-paint-areas)

### Parsing HTML and CSS

- [Extract critical CSS](https://web.dev/articles/extract-critical-css)
- [Minify CSS](https://web.dev/articles/minify-css)
- [Defer non-critical CSS](https://web.dev/articles/defer-non-critical-css)

### Script parsing and compilation

- [Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
- [Remove unused code](https://web.dev/articles/remove-unused-code)

### Garbage collection

- [Monitor your web page's total memory usage with `measureMemory()`](https://web.dev/articles/monitor-total-page-memory-usage)

## Resources

- [Source code for **Minimize main thread work** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/mainthread-work-breakdown.js)
- [Main thread (MDN)](https://developer.mozilla.org/docs/Glossary/Main_thread)
- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3.md.txt)
