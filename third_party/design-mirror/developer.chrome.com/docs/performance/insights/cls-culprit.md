---
source_url: https://developer.chrome.com/docs/performance/insights/cls-culprit
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: ffdaa270fe7545692fb7f40602b186ee18b2a60ba85409db2d5e1b600ef1ce97
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

Published: Oct 8, 2025

[Layout shifts](https://web.dev/articles/cls#layout-shifts-in-detail) occur when elements move their position despite the absence of user interaction. Investigate the causes of layout shifts, such as elements being added, removed, or their fonts changing as the page loads.

The insight may offer a best guess for the cause of the observed layout shifts. To dive deeper, [explore the layout shift track in the Performance panel](https://web.dev/articles/debug-layout-shifts#devtools). All layout shifts can be mitigated, even if no culprit is suggested.

## How to pass this insight

Have a "good" (0.1) or better CLS.

Some [common culprits](https://web.dev/articles/optimize-cls#common-causes-of-cls) of layout shifts include:

- Unsized images
- Injected iframes (such as from ads)
- Unoptimized animations
- Web fonts - either flash of unstyled text (FOUT) or flash of invisible text (FOIT)

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/CLSCulprits.ts)
- [Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls)
- [Debug layout shifts](https://web.dev/articles/debug-layout-shifts)
- [Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks.md.txt)
- [How to create high-performance CSS animations](https://web.dev/articles/animations-guide)
