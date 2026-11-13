---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/uses-http2
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:36+00:00
sha256: f3626475fdd16a2cc89b4386502fcb0b6359225a6be9ee6d4501a0c137f3626e
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has moved into the [Modern HTTP](https://developer.chrome.com/docs/performance/insights/modern-http.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

HTTP/2 serves your page's resources faster
and with less data moving over the wire.

## How the Lighthouse HTTP/2 audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) lists all resources not served over HTTP/2:

Lighthouse gathers all resources requested by the page
and checks the HTTP protocol version of each. There are some
cases where non-HTTP/2 requests will be ignored in the audit
results. [See the implementation](https://github.com/GoogleChrome/lighthouse/blob/9fad007174f240982546887a7e97f452e0eeb1d1/lighthouse-core/audits/dobetterweb/uses-http2.js#L138)
for more details.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## How to pass this audit

Serve your resources over HTTP/2.

To learn how to enable HTTP/2 on your servers,
see [Setting up HTTP/2](https://surma.dev/things/h2setup/).

## Resources

- [Source code for **Does not use HTTP/2 for all of its resources** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/uses-http2.js)
- [Introduction to HTTP/2](https://web.dev/articles/performance-http2)
- [HTTP/2 Frequently Asked Questions](https://http2.github.io/faq/)
