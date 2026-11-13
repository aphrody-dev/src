---
source_url: https://developer.chrome.com/docs/performance/insights/viewport
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: 1e37168c6c7a9420113ab846df51e317ba424126928130c3756f2859b99e748c
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

Published: Oct 8, 2025

Tap interactions may be [delayed by up to 300 milliseconds](https://developer.chrome.com/blog/300ms-tap-delay-gone-away.md.txt) if the viewport is not optimized for mobile.

## How to pass this insight

At the initial render of the page, a `<meta name="viewport">` element that is optimized for a mobile device must be present.

Here's an example of a passing meta viewport element:

The criteria for a viewport optimized for mobile are the following:

- `width` attribute is set to something (`device-width` is most common)
- `initial-scale` attribute is set, and its value is \>= 1

## Additional references

- [viewport insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/Viewport.ts)
- [Responsive Web Design Basics](https://web.dev/articles/responsive-web-design-basics#viewport)
- [Using the viewport meta tag to control layout on mobile browsers](https://developer.mozilla.org/docs/Web/HTML/Guides/Viewport_meta_element)
- [Chrome Speed - First Input Delay Changes in Chrome 91](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2021_05_fid.md)
