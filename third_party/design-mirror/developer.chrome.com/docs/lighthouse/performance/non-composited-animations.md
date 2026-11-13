---
source_url: https://developer.chrome.com/docs/lighthouse/performance/non-composited-animations
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:40+00:00
sha256: b70f62936005c39e8b2ff39991c23ba1b40213d0b9b59b32ea690c68cf80ff8a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Some animations on web pages can be [handled completely in the compositor stage of the rendering pipeline](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count).

Non-composited animations require more work and can appear [janky](https://en.wiktionary.org/wiki/jank) (not smooth) on low-end phones or when performance-heavy tasks are running on the main thread.

Non-composited animations can also increase the [Cumulative Layout Shift](https://web.dev/articles/cls) (CLS) of your page since they result in actual movement of elements that the CLS algorithm measures, which may cause knock on shifts to other elements. Composited animations won't result in other elements shifting and so are excluded from CLS. Reducing CLS will improve your Lighthouse Performance score.

## Background

The browser's algorithms for converting HTML, CSS, and JavaScript into pixels are collectively known
as the *rendering pipeline*.
 The rendering pipeline.

It's OK if you don't understand what each step of the rendering pipeline means. The key thing to
understand right now is that at each step of the rendering pipeline the browser uses the result of
the previous operation to create new data. For example, if your code does something that triggers
Layout, the Paint and Composite steps need to run again. A non-composited animation is any animation
that triggers one of the earlier steps in the rendering pipeline (Style, Layout, or Paint).
Non-composited animations perform worse because they force the browser to do more work.

Check out the following resources to learn about the rendering pipeline in-depth:

- [Inside look at modern web browsers (part 3)](https://developer.chrome.com/blog/inside-browser-part3.md.txt)
- [Simplify paint complexity and reduce paint areas](https://web.dev/simplify-paint-complexity-and-reduce-paint-areas/)
- [Stick to compositor-only properties and manage layer count](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/)

## How Lighthouse detects non-composited animations

When an animation can't be composited, Chrome reports the failure reasons to the DevTools trace,
which is what Lighthouse reads. Lighthouse lists DOM nodes which have animations that were not
composited along with the failure reason(s) for each animation.

## How to ensure animations are composited

See [Stick to compositor-only properties and manage layer count](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/) and
[High-performance animations](https://web.dev/animations-guide/).

## Resources

- [Source code for the *Avoid non-composited animations* audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/non-composited-animations.js)
- [Stick to compositor-only properties and manage layer count](https://web.dev/stick-to-compositor-only-properties-and-manage-layer-count/)
- [High-performance animations](https://web.dev/animations-guide/)
- [Simplify paint complexity and reduce paint areas](https://web.dev/simplify-paint-complexity-and-reduce-paint-areas/)
- [Inside look at modern web browsers (part 3)](https://developer.chrome.com/blog/inside-browser-part3.md.txt)
