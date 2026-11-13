---
source_url: https://developer.chrome.com/docs/performance/insights/lcp-discovery
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: cada2db66028c275162ea6211fd71e64518c3da59fdf755d87b6b3515a67de16
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

Published: Oct 8, 2025

Optimize LCP by making the LCP image discoverable from the HTML immediately, prioritizing it, and avoiding lazy-loading.

## How to pass this insight

If a page's LCP is an image:

- Use `fetchpriority=high` on the image element, or on its preload directive.
- Ensure the image is discoverable from the main document (either because it is directly in the HTML, or the image is preloaded).
- Avoid `loading=lazy` for the image.

> [!IMPORTANT]
> **Important:** When preloading the image, ensure `fetchpriority=high` is set on the preload as well as the image.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/LCPDiscovery.ts)
- [Optimize Largest Contentful Paint - Eliminate resource load delay](https://web.dev/articles/optimize-lcp#1_eliminate_resource_load_delay)
- [The performance effects of too much lazy loading](https://web.dev/articles/lcp-lazy-loading)
