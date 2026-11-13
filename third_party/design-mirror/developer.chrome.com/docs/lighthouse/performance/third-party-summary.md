---
source_url: https://developer.chrome.com/docs/lighthouse/performance/third-party-summary
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: a5738eabd66bbf5d24ac1fdb49788ee9d1f8fd71c8744830d58e2383468aa5d0
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

> [!WARNING]
> **Warning:** This audit has moved into the [Use efficient cache lifetimes](https://developer.chrome.com/docs/performance/insights/cache.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

To add an advertising network, social media button, A/B test, or analytics service to your page,
you usually need to add a third-party script to your HTML. These [third-party scripts can significantly affect your page load performance](https://web.dev/articles/third-party-javascript).

## How the Lighthouse audit for third-party code fails

Lighthouse flags pages that have third-party code that blocks the [main thread](https://developer.mozilla.org/docs/Glossary/Main_thread) for 250 ms or
longer:

A third-party script is any script hosted on a domain that's different to the domain of the URL
that you audited with Lighthouse. As the page loads, Lighthouse calculates how long each of the
third-party scripts blocks the main thread. If the total blocking time is greater than 250 ms
the audit fails.

## How to reduce the impact of third-party code

See [Identify slow third-party scripts](https://web.dev/articles/identify-slow-third-party-javascript) to learn how to use
Chrome DevTools and other Lighthouse audits to detect problematic third-party code, and
see [Efficiently load third-party JavaScript](https://web.dev/articles/efficiently-load-third-party-javascript) for
optimization strategies.

## Resources

- [Source code for **Reduce the impact of third-party code** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/third-party-summary.js)
- [Loading Third-party JavaScript](https://web.dev/articles/optimizing-content-efficiency-loading-third-party-javascript)
