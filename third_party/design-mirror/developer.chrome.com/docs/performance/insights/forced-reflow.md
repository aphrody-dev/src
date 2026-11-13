---
source_url: https://developer.chrome.com/docs/performance/insights/forced-reflow
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: 5cf71c90f92ead1b6aeaf65a4488c6a233d9b72d89efcac31cf1852353ff44f9
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

Published: Oct 8, 2025

A forced reflow occurs when JavaScript queries geometric properties (such as `offsetWidth`) after styles have been invalidated by a change to the DOM state. This forces the browser to immediately do a layout, which interrupts script execution and results in poor performance.

An example of code that causes forced reflow:

Multiple forced reflows in quick succession is called ["layout thrashing"](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing#avoid_layout_thrashing).

## How to pass this insight

- Avoid, or at least reduce, the amount of DOM geometry writes that are done just before reads.
- Have no forced reflows that take longer than 30 milliseconds.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/ForcedReflow.ts)
- [Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing)
- <https://webperf.tips/tip/layout-thrashing/>
- <https://github.com/MicrosoftEdge/MSEdgeExplainers/blob/main/EventPhases/explainer.md#how-does-this-happen>
