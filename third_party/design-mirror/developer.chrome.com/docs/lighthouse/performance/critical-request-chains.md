---
source_url: https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:33+00:00
sha256: 51230acd7fc34f39fc23c341d57c61134140a420972798089360b4ae06f64d71
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

> [!WARNING]
> **Warning:** This audit has moved into the [Network dependency tree](https://developer.chrome.com/docs/performance/insights/network-dependency-tree.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

[Critical request chains](https://web.dev/articles/critical-rendering-path)
are series of dependent network requests important for page rendering.
The greater the length of the chains and the larger the download sizes,
the more significant the impact on page load performance.

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
reports critical requests loaded with a high priority:

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How Lighthouse identifies critical request chains

Lighthouse uses network priority as a proxy for identifying render-blocking critical resources.
See Google's [Chrome Resource Priorities and Scheduling](https://docs.google.com/document/d/1bCDuq9H1ih9iNjgzyAL0gpwNFiEP4TZS-YLRp_RuMlc/edit)
for more information about how Chrome defines these priorities.

Data on critical request chains, resource sizes,
and time spent downloading resources is extracted from the
[Chrome Remote Debugging Protocol](https://github.com/ChromeDevTools/devtools-protocol).

## How to reduce the effect of critical request chains on performance

Use the critical request chains audit results to target the resources that have the biggest effect on page load first:

- Minimize the number of critical resources: eliminate them, defer their download, mark them as `async`, and so on.
- Optimize the number of critical bytes to reduce the download time (number of round trips).
- Optimize the order in which the remaining critical resources are loaded: download all critical assets as early as possible to shorten the critical path length.

Learn more about optimizing your
[images](https://web.dev/articles/use-imagemin-to-compress-images),
[JavaScript](https://web.dev/articles/apply-instant-loading-with-prpl),
[CSS](https://web.dev/articles/defer-non-critical-css), and
[web fonts](https://web.dev/articles/avoid-invisible-text).

## Stack-specific guidance

### Magento

If you are not bundling your JavaScript assets, consider using [baler](https://github.com/magento/baler).

## Resources

[Source code for **Minimize critical request depth** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/critical-request-chains.js)
