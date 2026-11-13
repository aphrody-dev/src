---
source_url: https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: 32db43b0e4653af934b0cbc05636c20a781c4ef1bb7f8114d63b2d1873167b7e
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Total Blocking Time (TBT) is one of the metrics tracked in the **Performance** section
of the Lighthouse report. Each metric captures some aspect of page load speed.

The Lighthouse report displays TBT in milliseconds:
 The Lighthouse Total Blocking Time audit

## What TBT measures

TBT measures the total amount of time that a page is blocked from responding to user input,
such as mouse clicks, screen taps, or keyboard presses. The sum is calculated by adding
the *blocking portion* of all [long tasks](https://web.dev/long-tasks-devtools/) between [First Contentful Paint](https://web.dev/fcp/) and [Time to Interactive](https://web.dev/interactive/).
Any task that executes for more than 50 ms is a long task. The amount of time after
50 ms is the blocking portion. For example, if Lighthouse detects a 70 ms long task,
the blocking portion would be 20 ms.

## How Lighthouse determines your TBT score

Your TBT score is a comparison of your page's TBT time and TBT times millions of real sites
when loaded on mobile devices. See [How metric scores are determined](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt#metric-scores)
to learn how Lighthouse score thresholds are set.

This table shows how to interpret your TBT score on mobile:

| TBT time (in milliseconds) | Color-coding |
|---|---|
| 0--200 | Green (fast) |
| 200-600 | Orange (moderate) |
| Over 600 | Red (slow) |

Lighthouse mobile TBT thresholds

This table shows how to interpret your TBT score on desktop:

| TBT time (in milliseconds) | Color-coding |
|---|---|
| 0--150 | Green (fast) |
| 150-350 | Orange (moderate) |
| Over 350 | Red (slow) |

Lighthouse desktop TBT thresholds

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to improve your TBT score

See [What is causing my long tasks?](https://web.dev/articles/long-tasks-devtools#what_is_causing_my_long_tasks) to learn
how to diagnose the root cause of long tasks with the Performance panel of Chrome DevTools.

In general, the most common causes of long tasks are:

- Unnecessary JavaScript loading, parsing, or execution. While analyzing your code in the Performance panel you might discover that the main thread is doing work that isn't really necessary to load the page. [Reducing JavaScript payloads with code splitting](https://web.dev/reduce-javascript-payloads-with-code-splitting/), [removing unused code](https://web.dev/remove-unused-code/), or [efficiently loading third-party JavaScript](https://web.dev/efficiently-load-third-party-javascript/) should improve your TBT score.
- Inefficient JavaScript statements. For example, after analyzing your code in the Performance panel, suppose you see a call to `document.querySelectorAll('a')` that returns 2000 nodes. Refactoring your code to use a more specific selector that only returns 10 nodes should improve your TBT score.

> [!NOTE]
> **Note:** Unnecessary JavaScript loading, parsing, or execution is usually a much bigger opportunity for improvement on most sites.

## How to improve your overall Performance score

Unless you have a specific reason for focusing on a particular metric, it's
usually better to focus on improving your overall Performance score.

Use the **Diagnostics** section of your Lighthouse report to determine which improvements will have the most value for your page. The more significant the opportunity, the greater the effect it will have on your Performance score. For example, the following Lighthouse screenshot shows that [eliminating render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources.md.txt) will yield the biggest improvement:
 Lighthouse: Diagnostics section

See the [Performance audits](https://developer.chrome.com/docs/lighthouse/performance)
to learn how to address the opportunities identified in your Lighthouse report.

## Resources

- [Source code for **Total Blocking Time** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/metrics/total-blocking-time.js)
- [Are long JavaScript tasks delaying your Time to Interactive?](https://web.dev/long-tasks-devtools/)
- [Optimize First Input Delay](https://web.dev/optimize-fid/)
- [First Contentful Paint](https://web.dev/fcp/)
- [Time to Interactive](https://web.dev/interactive/)
- [Reduce JavaScript payloads with code splitting](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
- [Remove unused code](https://web.dev/remove-unused-code/)
- [Efficiently load third-party resources](https://web.dev/efficiently-load-third-party-javascript/)
