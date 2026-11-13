---
source_url: https://developer.chrome.com/docs/lighthouse/seo/http-status-code
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:22+00:00
sha256: 5b5e52a4542178fbd9e13a5c50441155ff1783a11f2225e5506f676a86ba9e55
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Servers provide a three-digit [HTTP status code](https://developer.mozilla.org/docs/Web/HTTP/Status)
for each resource request they receive. Status codes in the 400s and 500s
[indicate that there's an error](https://developer.mozilla.org/docs/Web/HTTP/Status#Client_error_responses)
with the requested resource. If a search engine encounters a status code error
when it's **crawling** a web page, it may not index that page properly.

> [!IMPORTANT]
> **Key term:** _Crawling_ is how a search engine updates its index of content on the web.

## How the Lighthouse HTTP status code audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages
that return an unsuccessful HTTP status code (in the 400s or 500s):

> [!NOTE]
> **Note:** Each SEO audit is weighted equally in the Lighthouse SEO Score, except for the manual **[Structured data is valid](https://developer.chrome.com/docs/lighthouse/seo/structured-data.md.txt)** audit. Learn more in the [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt).

## How to fix an unsuccessful HTTP status code

First make sure you actually want search engines to crawl the page. Some pages,
like your 404 page or any other page that shows an error, shouldn't be included
in search results.

To fix an HTTP status code error, refer to the documentation for your server or
hosting provider. The server should return a status code in the 200s for all
valid URLs or a status code in the 300s for a resource that has moved to
another URL.

> [!NOTE]
> **Note:** If you're [using GitHub Pages to host a single-page app](https://www.smashingmagazine.com/2016/08/sghpa-single-page-app-hack-github-pages/), you'll likely need to serve valid content with a 404 status code.

> [!WARNING]
> **Try it:** Single-page applications can make fixing HTTP status code errors a bit more complicated. Learn how to [fix sneaky 404s in an Express application](https://web.dev/codelab-fix-sneaky-404).

## Resources

- [Source code for **Page has unsuccessful HTTP status code** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/http-status-code.js)
- [HTTP response status codes](https://developer.mozilla.org/docs/Web/HTTP/Status)
