---
source_url: https://developer.chrome.com/docs/performance/insights/font-display
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: feeffea7baeef23c015b4f6695151aa63fe85894229e167ad2ee345d9b24cb35
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

Published: Oct 8, 2025

Consider setting [`font-display`](https://developer.mozilla.org/docs/Web/CSS/@font-face/font-display) to `swap` or `optional` to ensure text is consistently visible. `swap` can be further optimized to mitigate layout shifts with [font metric overrides](https://developer.chrome.com/blog/font-fallbacks.md.txt).

## How to pass this insight

Set `font-display` to either `swap` or `optional` to pass this insight.

## Stack-specific guidance

This insight also offers stack-specific guidance for pages using the following technologies:

### Drupal

Specify `@font-display` when defining custom fonts in your theme.

### Magento

Specify `@font-display` when [defining custom fonts](https://devdocs.magento.com/guides/v2.3/frontend-dev-guide/css-topics/using-fonts.html).

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/FontDisplay.ts)
- [Controlling font performance with font displays](https://developer.chrome.com/blog/font-display.md.txt)
- [Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks.md.txt)
- [Avoid invisible text during loading](https://web.dev/articles/font-best-practices)
- [Preload web fonts to improve loading speed (codelab)](https://web.dev/articles/codelab-preload-web-fonts)
- [Prevent layout shifting and flashes of invisible text (FOIT) by preloading optional fonts](https://web.dev/articles/preload-optional-fonts)
