---
source_url: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: 44bf154bdc0ab7f71c6792b1eff2a3bfd1acfe4c19e0a352634622296b4a773e
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

How Lighthouse calculates your overall Performance score

In general, only [metrics](https://developer.chrome.com/docs/lighthouse/performance#metrics)
contribute to your Lighthouse Performance score, not the results of Opportunities or Diagnostics.
That said, improving the opportunities and diagnostics likely improve the metric values, so there
is an indirect relationship.

Below, we've outlined why the score can fluctuate, how it's comprised, and how Lighthouse scores each individual metric.

## Why your score fluctuates

A lot of the variability in your overall Performance score and metric values is not due to Lighthouse. When your Performance score fluctuates it's usually because of changes in underlying conditions. Common
problems include:

- A/B tests or changes in ads being served
- Internet traffic routing changes
- Testing on different devices, such as a high-performance desktop and a low-performance laptop
- Browser extensions that inject JavaScript and add/modify network requests
- Antivirus software

[Lighthouse's documentation on Variability](https://github.com/GoogleChrome/lighthouse/blob/master/docs/variability.md) covers this in more depth.

Furthermore, even though Lighthouse can provide you a single overall Performance score, it might be more
useful to think of your site performance as a distribution of scores, rather than a single number.
See the introduction of [User-Centric Performance Metrics](https://web.dev/articles/user-centric-performance-metrics)
to understand why.

## How the Performance score is weighted

The Performance score is a [weighted average](https://www.wikihow.com/Calculate-Weighted-Average#Weighted_Averages_without_Percentages_sub) of the _metric scores_. Naturally, more heavily weighted metrics have a bigger effect on your overall Performance score.
The metric scores are not visible in the report, but are calculated under the hood.

> [!NOTE]
> **Note:** The weightings are chosen to provide a balanced representation of the user's perception of performance. The weightings have changed over time because the Lighthouse team is regularly doing research and gathering feedback to understand what has the biggest impact on user-perceived performance.

[](https://googlechrome.github.io/lighthouse/scorecalc/) Explore scoring with the [Lighthouse scoring calculator](https://googlechrome.github.io/lighthouse/scorecalc/)

### Lighthouse 10

| Audit                                                                                  | Weight |
| -------------------------------------------------------------------------------------- | ------ |
| [First Contentful Paint](https://web.dev/articles/fcp)                                 | 10%    |
| [Speed Index](https://developer.chrome.com/en/docs/lighthouse/performance/speed-index) | 10%    |
| [Largest Contentful Paint](https://web.dev/articles/lcp)                               | 25%    |
| [Total Blocking Time](https://web.dev/tbt/)                                            | 30%    |
| [Cumulative Layout Shift](https://web.dev/articles/cls)                                | 25%    |

### Lighthouse 8

| Audit                                                                                  | Weight |
| -------------------------------------------------------------------------------------- | ------ |
| [First Contentful Paint](https://web.dev/articles/fcp)                                 | 10%    |
| [Speed Index](https://developer.chrome.com/en/docs/lighthouse/performance/speed-index) | 10%    |
| [Largest Contentful Paint](https://web.dev/articles/lcp)                               | 25%    |
| [Time to Interactive](https://web.dev/tti/)                                            | 10%    |
| [Total Blocking Time](https://web.dev/tbt/)                                            | 30%    |
| [Cumulative Layout Shift](https://web.dev/articles/cls)                                | 15%    |

### How metric scores are determined

Once Lighthouse has gathered the performance metrics (mostly reported in milliseconds), it converts each raw metric
value into a metric score from 0 to 100 by looking where the metric value falls on its Lighthouse scoring distribution.
The scoring distribution is a log-normal distribution derived from the performance metrics of real website performance
data on [HTTP Archive](https://httparchive.org/).

For example, Largest Contentful Paint (LCP) measures when a user perceives that the
largest content of a page is visible. The metric value for LCP represents the time duration between
the user initiating the page load and the page rendering its primary content. Based on real
website data, top-performing sites render LCP in about 1,220ms, so that metric value is mapped to
a score of 99.

Going a bit deeper, the Lighthouse scoring curve model uses HTTPArchive data to determine two control points that then set
the shape of a [log-normal](https://en.wikipedia.org/wiki/Weber%E2%80%93Fechner_law) curve. The 25th percentile of HTTP Archive
data becomes a score of 50 (the median control point), and the 8th percentile becomes a score of 90 (the good/green control point).
While exploring the scoring curve plot, note that between 0.50 and 0.92, there's a near-linear relationship between metric value and score.
Around a score of 0.96 is the "point of diminishing returns" as higher, the curve pulls away, requiring increasingly more metric improvement to
improve an already high score.
[Explore the scoring curve for TTI](https://www.desmos.com/calculator/o98tbeyt1t).

### How desktop versus mobile is handled

[As mentioned](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt#metric-scores), the score curves are determined from real performance data. Prior to Lighthouse v6, all score curves were based on mobile performance data,
however a desktop Lighthouse run would use that. In practice, this led to artificially inflated desktop scores. Lighthouse v6 fixed this bug by using specific desktop scoring.
While you certainly can expect overall changes in your perf score from 5 to 6, any scores for desktop will be significantly different.

### How scores are color-coded

The metrics scores and the perf score are colored according to these ranges:

- 0 to 49 (red): Poor
- 50 to 89 (orange): Needs Improvement
- 90 to 100 (green): Good

To provide a good user experience, sites should strive to have a good score (90-100). A "perfect" score of 100 is extremely challenging to achieve and not expected.
For example, taking a score from 99 to 100 needs about the same amount of metric improvement that would take a 90 to 94.

### What can developers do to improve their performance score?

First, use the [Lighthouse scoring calculator](https://googlechrome.github.io/lighthouse/scorecalc/) to help understand what thresholds you should be aiming for achieving a certain Lighthouse performance score.

In the Lighthouse report, the **Opportunities** section has detailed suggestions and documentation on how to implement them. Additionally, the **Diagnostics** section lists additional guidance that developers can explore to further improve their performance.
