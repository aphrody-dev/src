---
source_url: https://developer.chrome.com/docs/lighthouse/performance/lighthouse-max-potential-fid
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:57+00:00
sha256: c9a739e0af496322bca8af618e21826c79c052527d0f7c795f66b21f39c53428
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!CAUTION]
> **Caution:** Max Potential First Input Delay was deprecated in Lighthouse 6.0. Moving forward, consider using [Total Blocking Time](https://web.dev/articles/lcp) in the lab and [First Input Delay](https://web.dev/articles/fid) and [Interaction to Next Paint](https://web.dev/articles/inp) in the field.

Max Potential First Input Delay (FID) is one of the metrics
tracked in the **Performance** section of the Lighthouse report.
Each metric captures some aspect of page load speed.

Lighthouse displays Max Potential FID in milliseconds:

## What Max Potential FID measures

Max Potential FID measures the worst-case [First Input Delay](https://web.dev/fid/) that your users might experience.
First Input Delay measures the time from when a user first interacts with your site, such as
clicking a button, to the time when the browser is actually able to respond to that interaction.

Lighthouse calculates Max Potential FID by finding the duration of the [longest task](https://web.dev/long-tasks-devtools/#what-are-long-tasks)
after [First Contentful Paint](https://web.dev/user-centric-performance-metrics/#important-metrics-to-measure). Tasks before First Contentful Paint are excluded because it's
unlikely that a user will attempt to interact with your page before any content has been rendered to
the screen, which is what First Contentful Paint measures.

## How Lighthouse determines your Max Potential FID score

Your Max Potential FID score is a comparison of your page's Max Potential FID time
and Max Potential FID times for real websites, based on
data from the [HTTP Archive](https://httparchive.org).
For example, if your Max Potential FID score in Lighthouse is green, it means
that your page performs better than 90% of real websites.

This table shows how to interpret your Max Potential FID score:

| Max Potential FID time (in milliseconds) | Color-coding |
|---|---|
| 0--130 | Green (fast) |
| 130-250 | Orange (moderate) |
| Over 250 | Red (slow) |

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to improve your Max Potential FID score

If you're trying to make major improvements to your Max Potential FID score, see
[How to improve your TTI score](https://web.dev/interactive/#how-to-improve-your-tti-score). The strategies for majorly improving Max Potential FID are
largely the same as the strategies for improving TTI.

If you want to optimize your Max Potential FID score specifically, you need to reduce the duration
of your longest tasks, since that is what Max Potential FID technically measures. The [Idle Until Urgent](https://philipwalton.com/articles/idle-until-urgent/) strategy is one way to do that.

## How to capture FID field data

Lighthouse's measurement of Max Potential FID is [lab data](https://web.dev/speed-tools/#lab-data). To capture real
FID data as your users load your pages, use Google's
[First Input Delay library](https://github.com/GoogleChromeLabs/first-input-delay).
Once you're capturing FID data, you can report it as an event
to your preferred analytics tool.

Since FID measures when actual users first interact with your page,
it's more inherently variable than typical performance metrics.
See [Analyzing and reporting on FID data](https://web.dev/fid/#analyzing-and-reporting-on-fid-data) for guidance
about how to evaluate the FID data you collect.

## How to improve your overall Performance score

Unless you have a specific reason for focusing on a particular metric, it's
usually better to focus on improving your overall Performance score.

Use the **Diagnostics** section of your Lighthouse report to determine which improvements will have the most value for your page. The more significant the opportunity, the greater the effect it will have on your Performance score. For example, the following Lighthouse screenshot shows that [eliminating render-blocking resources](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources.md.txt) will yield the biggest improvement:
 Lighthouse: Diagnostics section

See the [Performance audits](https://developer.chrome.com/docs/lighthouse/performance)
to learn how to address the opportunities identified in your Lighthouse report.

## Resources

- [Source code for **Max Potential First Input Delay** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/metrics/max-potential-fid.js)
- [First Input Delay](https://web.dev/fid/)
- [Time to Interactive](http://web.dev/articles/tti)
- [Are long JavaScript tasks delaying your Time to Interactive?](https://web.dev/articles/long-tasks-devtools)
- [First paint and first contentful paint](https://web.dev/user-centric-performance-metrics/#important-metrics-to-measure)
- [How To Think About Speed Tools](https://web.dev/speed-tools/)
