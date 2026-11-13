---
source_url: https://developer.chrome.com/docs/lighthouse/performance/first-contentful-paint
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: 4abfddec4ce92a0730d984de6549aee0373c828f6c7658aa40b336d1fdcd0e12
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
First Contentful Paint (FCP) is one of six metrics
tracked in the **Performance** section of the Lighthouse report.
Each metric captures some aspect of page load speed.

Lighthouse displays FCP in seconds:
 The Lighthouse First Contentful Paint score

## What FCP measures

FCP measures how long it takes the browser
to render the first piece of DOM content
after a user navigates to your page.
Images, non-white `<canvas>` elements, and SVGs on your page are considered
DOM content; anything inside an iframe *isn't* included.

## How Lighthouse determines your FCP score

Your FCP score is a comparison of your page's FCP time
and FCP times for real websites, based on
[data from the HTTP Archive](https://httparchive.org/reports/loading-speed#fcp).
For example, sites performing in the ninety-ninth percentile
render FCP in about 1.2 seconds.
If your website's FCP is 1.2 seconds,
your FCP score is 99. See [How metric scores are determined](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt#metric-scores)
to learn how Lighthouse score thresholds are set.

This table shows how to interpret your FCP score for mobile:

| FCP time (in seconds) | Color-coding |
|---|---|
| 0--1.8 | Green (fast) |
| 1.8--3 | Orange (moderate) |
| Over 3 | Red (slow) |

Lighthouse mobile FCP thresholds

The [Web Vitals initiative](https://web.dev/articles/vitals) recommends [the same thresholds regardless of device](https://web.dev/articles/defining-core-web-vitals-thresholds#device) for its thresholds, which basically uses the mobile thresholds. However, since Lighthouse is a lab tool, it can be useful to be stricter when testing for faster desktop devices it uses different thresholds.

The following table shows how to interpret your FCP score on desktop:

| FCP time (in seconds) | Color-coding |
|---|---|
| 0--0.9 | Green (fast) |
| 0.9--1.6 | Orange (moderate) |
| Over 1.6 | Red (slow) |

Lighthouse desktop FCP thresholds

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to improve your FCP score

One issue that's particularly important for FCP is
font load time. Check out the
[Ensure text remains visible during webfont load](https://developer.chrome.com/docs/lighthouse/performance/font-display.md.txt) post
for ways to speed up your font loads.

## Measure FCP on real users' devices

To learn how to measure when FCP actually occurs on your users' devices,
see [Measure FCP in JavaScript](https://web.dev/articles/fcp#measure-in-javascript).

See Google's [Assessing Loading Performance in Real Life with Navigation and Resource Timing](https://web.dev/articles/navigation-and-resource-timing)
for more on collecting real-user metrics.

## How to improve your overall Performance score

Unless you have a specific reason for focusing on a particular metric, it's
usually better to focus on improving your overall Performance score.

Use the **Diagnostics** section of your Lighthouse report to determine which improvements will have the most value for your page. The more significant the opportunity, the greater the effect it will have on your Performance score. For example, the following Lighthouse screenshot shows that [eliminating render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources.md.txt) will yield the biggest improvement:
 Lighthouse: Diagnostics section

See the [Performance audits](https://developer.chrome.com/docs/lighthouse/performance)
to learn how to address the opportunities identified in your Lighthouse report.

## Resources

- [Source code for **First Contentful Paint** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/metrics/first-contentful-paint.js)
- [FCP Metric Guide](https://web.dev/articles/fcp)
- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt)
- [Paint Timing specification](https://w3c.github.io/paint-timing)
