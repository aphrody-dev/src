---
source_url: https://developer.chrome.com/docs/lighthouse/performance/lighthouse-largest-contentful-paint
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 06fc7ac2704969630355e73c9047dc52def54e130d4e25237ed823fcd77403b1
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Largest Contentful Paint (LCP) is one of the metrics
tracked in the **Performance** section of the Lighthouse report.
Each metric captures some aspect of page load speed.

Lighthouse displays LCP in seconds:
 The Lighthouse Largest Contentful Paint score

## What LCP measures

LCP measures when the largest content element in the viewport is
rendered to the screen. This approximates when the main content of the page is
visible to users. See [Largest Contentful Paint defined](https://web.dev/lcp/#what-is-lcp) for more
details on how LCP is determined.

## How Lighthouse determines your LCP score

Lighthouse extracts LCP data from [Chrome's tracing tool](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool).

The following table shows how to interpret your LCP score on mobile:

| LCP time (in seconds) | Color-coding |
|---|---|
| 0-2.5 | Green (fast) |
| 2.5-4 | Orange (moderate) |
| Over 4 | Red (slow) |

Lighthouse mobile LCP thresholds

The [Web Vitals initiative](https://web.dev/articles/vitals) recommends [the same thresholds regardless of device](https://web.dev/articles/defining-core-web-vitals-thresholds#device) for its thresholds, which basically uses the mobile thresholds. However, since Lighthouse is a lab tool, it can be useful to be stricter when testing for faster desktop devices it uses different thresholds.

The following table shows how to interpret your LCP score on desktop:

| LCP time (in seconds) | Color-coding |
|---|---|
| 0-1.2 | Green (fast) |
| 1.2-2.4 | Orange (moderate) |
| Over 2.4 | Red (slow) |

Lighthouse desktop LCP thresholds

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to improve your LCP score

If the LCP is an image, the timing can be broken down into four subparts.
Knowing which subparts take the longest can help you [optimize your LCP](https://web.dev/optimize-lcp/).
Lighthouse will display the LCP element along with the subpart breakdown in the "Largest Contentful Paint element" diagnostic.

| LCP subpart | Description |
|---|---|
| Time to first byte (TTFB) | The time from when the user initiates loading the page until when the browser receives the first byte of the HTML document response. [Learn more about TTFB](https://web.dev/articles/ttfb). |
| Load delay | The delta between TTFB and when the browser starts loading the LCP resource. |
| Load time | The time it takes to load the LCP resource itself. |
| Render delay | The delta between when the LCP resource finishes loading until the LCP element is fully rendered. |

## Resources

- [Source code for **Largest Contentful Paint** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/metrics/largest-contentful-paint.js)
- [Largest Contentful Paint](https://web.dev/articles/lcp)
- [Largest Contentful Paint API](https://wicg.github.io/largest-contentful-paint/)
