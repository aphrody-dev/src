---
source_url: https://developer.chrome.com/docs/lighthouse/performance/first-cpu-idle
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: 736a35dbc30a0d889d9f37126c8320b6dd0678bb7ead76f51bc96f61cd4cfab3
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!CAUTION]
> **Caution:** First CPU Idle is deprecated in Lighthouse 6.0. While some have found that First CPU Idle offers a more meaningful measurement than [Time To Interactive](http://web.dev/articles/tti), the difference isn't significant enough to justify maintaining two similar metrics. Moving forward, consider using [Total Blocking Time](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time.md.txt) and [Time To Interactive](http://web.dev/articles/tti) instead.

First CPU Idle is one of six metrics
tracked in the **Performance** section of the Lighthouse report.
Each metric captures some aspect of page load speed.

Lighthouse displays First CPU Idle in seconds:

## What First CPU Idle measures

First CPU Idle measures how long it takes a page to become *minimally* interactive.
A page is considered minimally interactive when:

- Most---but not necessarily all---UI elements on the screen are interactive, and
- The page responds, on average, to most user input in a reasonable amount of time.

> [!NOTE]
> **Note:** Both First CPU Idle and [Time to Interactive](http://web.dev/articles/tti) measure when the page is ready for user input. First CPU Idle occurs when the user can *start* to interact with the page; TTI occurs when the user is *fully* able to interact with the page. See Google's [First Interactive And Consistently Interactive](https://docs.google.com/document/d/1GGiI9-7KeY3TPqS3YT271upUVimo-XiL5mwWorDUD4c/edit) if you're interested in the exact calculation for each metric.

## How Lighthouse determines your First CPU Idle score

Your First CPU Idle score is a comparison of your page's First CPU Idle time
and First CPU Idle times for real websites, based on
[data from the HTTP Archive](https://httparchive.org/reports/loading-speed#ttfi).
For example, sites performing in the ninety-fifth percentile
render First CPU Idle in about 3 seconds.
If your website's First CPU Idle is 3 seconds,
your First CPU Idle score is 95.

This table shows how to interpret your First CPU Idle score:

| First CPU Idle metric (in seconds) | Color-coding | First CPU Idle score (HTTP Archive percentile) |
|---|---|---|
| 0--4.7 | Green (fast) | 75--100 |
| 4.8--6.5 | Orange (moderate) | 50--74 |
| Over 6.5 | Red (slow) | 0--49 |

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to improve your First CPU Idle score

See [How to improve your TTI score](https://web.dev/interactive/#how-to-improve-your-tti-score). The strategies for improving First CPU Idle are
largely the same as the strategies for improving TTI.

## How to improve your overall Performance score

Unless you have a specific reason for focusing on a particular metric, it's
usually better to focus on improving your overall Performance score.

Use the **Diagnostics** section of your Lighthouse report to determine which improvements will have the most value for your page. The more significant the opportunity, the greater the effect it will have on your Performance score. For example, the following Lighthouse screenshot shows that [eliminating render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources.md.txt) will yield the biggest improvement:
 Lighthouse: Diagnostics section

See the [Performance audits](https://developer.chrome.com/docs/lighthouse/performance)
to learn how to address the opportunities identified in your Lighthouse report.

## Resources

- [Source code for **First CPU Idle** audit](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/metrics/first-cpu-idle.js)
- [Lighthouse v3 Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt)
- [First Interactive And Consistently Interactive](https://docs.google.com/document/d/1GGiI9-7KeY3TPqS3YT271upUVimo-XiL5mwWorDUD4c/edit)
- [Time to Interactive](http://web.dev/articles/tti)
