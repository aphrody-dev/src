---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/no-document-write
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: 5bd3d3e03af67ea4b9f133f64d5ab5845f82777daf60762b9adbfe6ea78389c8
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

> [!WARNING]
> **Warning:** This audit has been removed as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

Using [`document.write()`](https://developer.mozilla.org/docs/Web/API/Document/write)
can delay the display of page content by tens of seconds
and is particularly problematic for users on slow connections.
Chrome therefore blocks the execution of `document.write()` in many cases,
meaning you can't rely on it.

In the Chrome DevTools Console you'll see the following message when you use `document.write()`:

```text
[Violation] Avoid using document.write().
```

In the Firefox DevTools Console you'll see this message:

```text
An unbalanced tree was written using document.write() causing
data from the network to be reparsed.
```

## How the Lighthouse `document.write()` audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags
calls to `document.write()` that weren't blocked by Chrome:

For the most problematic uses,
Chrome will either block calls to `document.write()`
or emit a console warning about them, depending on the user's connection speed.
Either way, the affected calls appear in the DevTools Console.
See Google's [Intervening against `document.write()`](https://developer.chrome.com/blog/removing-document-write.md.txt)
article for more information.

Lighthouse reports any remaining calls to `document.write()`
because it adversely affects performance no matter how it's used,
and there are better alternatives.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## Avoid `document.write()`

Remove all uses of `document.write()` in your code. If it's being used
to inject third-party scripts, try using
[asynchronous loading](https://web.dev/critical-rendering-path-adding-interactivity-with-javascript#parser_blocking_versus_asynchronous_javascript)
instead.

If third-party code is using `document.write()`,
ask the provider to support asynchronous loading.

## Resources

- [Source code for **Uses `document.write()`** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/no-document-write.js)
- [Intervening against `document.write()`](https://developer.chrome.com/blog/removing-document-write.md.txt)
- [Parser blocking versus asynchronous JavaScript](https://web.dev/critical-rendering-path-adding-interactivity-with-javascript#parser_blocking_versus_asynchronous_javascript)
- [Speculative parsing](https://developer.mozilla.org/docs/Glossary/speculative_parsing)
