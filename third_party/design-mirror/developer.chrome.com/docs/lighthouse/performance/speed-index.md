---
source_url: https://developer.chrome.com/docs/lighthouse/performance/speed-index
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: f9414e2343d30aade3e571e22d8d7832b2796e2f8acb56a8d57a98a3428d29f3
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Speed Index is one of five metrics
tracked in the **Performance** section of the Lighthouse report.
Each metric captures some aspect of page load speed.

Lighthouse displays Speed Index in seconds:
Speed Index is one of five metrics tracked in the Performance section of the Lighthouse report

## What Speed Index measures

Speed Index measures how quickly content is visually displayed during page load.
Lighthouse first captures a video of the page loading in the browser and
computes the visual progression between frames.
Lighthouse then uses the [Speedline Node.js module](https://github.com/paulirish/speedline)
to generate the Speed Index score.

> [!NOTE]
> **Note:** Speedline is based on the same principles as the [original speed index introduced by WebpageTest.org](https://github.com/WPO-Foundation/webpagetest-docs/blob/main/src/metrics/SpeedIndex.md).

## How Lighthouse determines your Speed Index score

Your Speed Index score is a comparison of your page's speed index
and the speed indexes of real websites, based on
[data from the HTTP Archive](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt#metric-scores).

This table shows how to interpret your mobile Speed Index score:

| Speed Index (in seconds) | Color-coding      |
| ------------------------ | ----------------- |
| 0--3.4                   | Green (fast)      |
| 3.4--5.8                 | Orange (moderate) |
| Over 5.8                 | Red (slow)        |

Lighthouse mobile Speed Index thresholds

This table shows how to interpret your desktop Speed Index score:

| Speed Index (in seconds) | Color-coding      |
| ------------------------ | ----------------- |
| 0--1.3                   | Green (fast)      |
| 1.3--2.3                 | Orange (moderate) |
| Over 2.3                 | Red (slow)        |

Lighthouse desktop Speed Index thresholds

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to improve your Speed Index score

While anything you do to improve page load speed
will improve your Speed Index score,
addressing any issues discovered by these Diagnostic audits
should have a particularly big impact:

- [Minimize main thread work](https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown.md.txt)
- [Reduce JavaScript execution time](https://developer.chrome.com/docs/lighthouse/performance/bootup-time.md.txt)
- [Ensure text remains visible during webfont load](https://developer.chrome.com/docs/lighthouse/performance/font-display.md.txt)

## How to improve your overall Performance score

Unless you have a specific reason for focusing on a particular metric, it's
usually better to focus on improving your overall Performance score.

Use the **Diagnostics** section of your Lighthouse report to determine which improvements will have the most value for your page. The more significant the opportunity, the greater the effect it will have on your Performance score. For example, the following Lighthouse screenshot shows that [eliminating render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources.md.txt) will yield the biggest improvement:
Lighthouse: Diagnostics section

See the [Performance audits](https://developer.chrome.com/docs/lighthouse/performance)
to learn how to address the opportunities identified in your Lighthouse report.

## Resources

- [Source code for **Speed Index** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/metrics/speed-index.js)
- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt)
- [Speedline](https://github.com/paulirish/speedline)
- [WebPagetest Speed Index](https://github.com/WPO-Foundation/webpagetest-docs/blob/main/src/metrics/SpeedIndex.md)
