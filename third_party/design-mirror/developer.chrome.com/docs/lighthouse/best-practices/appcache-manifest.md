---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/appcache-manifest
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:04+00:00
sha256: 13d5a6d3827f4f5b4320ac8c2b69cb9d022d1df8c5f35df126e0f9e40c20c470
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

The Application Cache, also known as AppCache,
is [deprecated](https://html.spec.whatwg.org/multipage/browsers.html#offline).

## How the Lighthouse Application Cache audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages that use the Application Cache:

This audit fails when Lighthouse finds a reference to
the Application Cache manifest in a page's `<html>` tag.
For example, this markup causes the audit to fail:

```html
<html manifest="example.appcache">
  ...
</html>
```

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## Use the Cache API instead of the Application Cache

To pass this audit,
remove the manifest from your page,
and use the
[Cache API](https://developer.mozilla.org/docs/Web/API/Cache)
via a [service worker](https://developer.chrome.com/docs/workbox/service-worker-overview.md.txt)
instead.

To migrate from the Application Cache to service workers,
consider using the
[sw-appcache-behavior library](https://github.com/GoogleChrome/sw-appcache-behavior).
This library generates a service-worker-based implementation of the behavior
defined in an Application Cache manifest.

See the [Current page does not respond with a 200 when offline](https://developer.chrome.com/docs/lighthouse/pwa/works-offline.md.txt) post
for more information about using service workers to make your site work
offline.

## Resources

- [Source code for **Uses Application Cache** audit](https://github.com/GoogleChrome/lighthouse/blob/ecd10efc8230f6f772e672cd4b05e8fbc8a3112d/lighthouse-core/audits/dobetterweb/appcache-manifest.js)
- MDN's [Cache](https://developer.mozilla.org/docs/Web/API/Cache) page
- [Current page does not respond with a 200 when offline](https://developer.chrome.com/docs/lighthouse/pwa/works-offline.md.txt)
