---
source_url: https://developer.chrome.com/docs/lighthouse/performance/interactive
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: be1c653b62e21bfbe18978f43836e8bfaded4fbb0d299c2df02c22bf1cd1c901
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!CAUTION]
> **Caution:** [Time to Interactive (TTI)](https://web.dev/articles/tti) has proved overly sensitive to outlier network requests and long tasks, resulting in high variability in this metric. TTI was [removed as a metric from Lighthouse 10](https://developer.chrome.com/blog/lighthouse-10-0.md.txt#scoring-changes). Newer, alternative, metrics like [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp), [Total Blocking Time (TBT)](https://web.dev/articles/tbt), and [Interaction to Next Paint (INP)](https://web.dev/articles/inp) are usually better metrics to use in place of TTI.

Time to Interactive (TTI) is one of six metrics
tracked in the **Performance** section of the Lighthouse report.
Each metric captures some aspect of page load speed.

Measuring TTI is important because
some sites optimize content visibility at the expense of interactivity.
This can create a frustrating user experience:
the site appears to be ready, but when the user tries to interact with it,
nothing happens.

Lighthouse displays TTI in seconds:

## What TTI measures

TTI measures how long it takes a page to become *fully* interactive.
A page is considered fully interactive when:

- The page displays useful content, which is measured by the [First Contentful Paint](https://web.dev/articles/fcp),
- Event handlers are registered for most visible page elements, and
- The page responds to user interactions within 50 milliseconds.

> [!NOTE]
> **Note:** Both [First CPU Idle](https://developer.chrome.com/docs/lighthouse/performance/first-cpu-idle.md.txt) and TTI measure when the page is ready for user input. First CPU Idle occurs when the user can *start* to interact with the page; TTI occurs when the user is *fully* able to interact with the page. See Google's [First Interactive And Consistently Interactive](https://docs.google.com/document/d/1GGiI9-7KeY3TPqS3YT271upUVimo-XiL5mwWorDUD4c/edit) if you're interested in the exact calculation for each metric.

## How Lighthouse determines your TTI score

The TTI score is a comparison of your page's TTI
and the TTI for real websites, based on
[data from the HTTP Archive](https://httparchive.org/reports/loading-speed#ttci).
For example, sites performing in the ninety-ninth percentile
render TTI in about 2.2 seconds.
If your website's TTI is 2.2 seconds, your TTI score is 99.

This table shows how to interpret your TTI score:

| TTI metric (in seconds) | Color-coding |
|---|---|
| 0--3.8 | Green (fast) |
| 3.9--7.3 | Orange (moderate) |
| Over 7.3 | Red (slow) |

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to improve your TTI score

One improvement that can have a particularly big effect on TTI is
deferring or removing unnecessary JavaScript work.
Look for opportunities to [optimize your JavaScript](https://web.dev/articles/fast#optimize_your_javascript).
In particular, consider [reducing JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
and [applying the PRPL pattern](https://web.dev/articles/apply-instant-loading-with-prpl). [Optimizing third-party JavaScript](https://web.dev/fast/#optimize-your-third-party-resources)
also yields significant improvements for some sites.

These two Diagnostic audits provide additional opportunities
to reduce JavaScript work:

- [Minimize main thread work](https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown.md.txt)
- [Reduce JavaScript execution time](https://developer.chrome.com/docs/lighthouse/performance/bootup-time.md.txt)

## Tracking TTI on real users' devices

To learn how to measure when TTI actually occurs on your users' devices,
see Google's [User-centric Performance Metrics](https://web.dev/user-centric-performance-metrics/) page.
The [Tracking TTI](https://web.dev/user-centric-performance-metrics/) section describes
how to programmatically access TTI data and submit it to Google Analytics.

> [!NOTE]
> **Note:** TTI can be difficult to track in the field. Tracking [Interaction to Next Paint](https://web.dev/articles/inp) is recommended in the field.

## How to improve your overall Performance score

Unless you have a specific reason for focusing on a particular metric, it's
usually better to focus on improving your overall Performance score.

Use the **Diagnostics** section of your Lighthouse report to determine which improvements will have the most value for your page. The more significant the opportunity, the greater the effect it will have on your Performance score. For example, the following Lighthouse screenshot shows that [eliminating render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources.md.txt) will yield the biggest improvement:
 Lighthouse: Diagnostics section

See the [Performance audits](https://developer.chrome.com/docs/lighthouse/performance)
to learn how to address the opportunities identified in your Lighthouse report.

## Resources

- [Source code for **Time to Interactive** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/metrics/interactive.js)
- [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt)
- [First Interactive And Consistently Interactive](https://docs.google.com/document/d/1GGiI9-7KeY3TPqS3YT271upUVimo-XiL5mwWorDUD4c/edit)
- [JavaScript Start-up Optimization](https://web.dev/articles/optimizing-content-efficiency-javascript-startup-optimization)
- [Reduce JavaScript Payloads with Tree Shaking](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking)
- [Optimize third-party resources](https://web.dev/fast/#optimize-your-third-party-resources)
