---
source_url: https://developer.chrome.com/docs/lighthouse/performance/estimated-input-latency
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: c1e2157df5748d2299fc97c4fa8a9e59a7294426f4e5caca8eaf1f67ff52d70f
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Estimated Input Latency is one of six metrics
tracked in the **Performance** section of the Lighthouse report.
Each metric captures some aspect of page load speed.

The Lighthouse reports displays Estimated Input Latency in milliseconds:

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## What Estimated Input Latency measures

Estimated Input Latency is an estimate of how long your app takes to respond to user input
during the busiest 5 second window of page load.
The timing of this audit is from
[First Meaningful Paint](https://developer.chrome.com/docs/lighthouse/performance/first-meaningful-paint.md.txt)
to the end of the trace, which is roughly 5 seconds after
[Time to Interactive](http://web.dev/articles/tti).
If your latency is higher than 50 ms, users may perceive your app as laggy.

The [RAIL performance model](https://web.dev/articles/rail)
recommends that apps respond to user input within 100 ms,
while Lighthouse's Estimated Input Latency target score is 50 ms. Why?
Lighthouse uses a proxy metric---availability of the main thread---to measure
how well your app responds to user input.

Lighthouse assumes that your app needs 50 ms to completely respond to the user's input
(from performing any JavaScript executions to physically painting the new pixels to the screen).
If your main thread is unavailable for 50 ms or more,
that doesn't leave enough time for your app to complete the response.

Approximately 90% of users will encounter Lighthouse's reported amount of input latency or less.
10% of users can expect higher latency.

## How to improve your Estimated Input Latency score

To make your app respond to user input faster,
optimize how your code runs in the browser.
Check out the series of techniques outlined on Google's
[Rendering Performance](https://web.dev/articles/rendering-performance) page.
These tips range from offloading computation to web workers to free up the main thread,
to refactoring your CSS selectors to perform fewer calculations,
to using CSS properties that minimize the amount of browser-intensive operations.

> [!CAUTION]
> **Caution:** The Estimated Input Latency audit isn't a complete measurement of input latency. It doesn't measure how long your app truly takes to respond to a user input; nor does it does measure that your app's response to the user's input is visually complete.

## How to measure Estimated Input Latency manually

To measure Estimated Input Latency manually,
make a recording with the Chrome DevTools Timeline.
See [Do less main thread work](https://developer.chrome.com/docs/devtools/lighthouse.md.txt#main)
for an example of the workflow.
The basic idea is to start a recording, perform the user input that you want to measure,
stop the recording, and then analyze the flame chart to ensure that
[all stages of the pixel pipeline](https://web.dev/articles/rendering-performance#the_pixel_pipeline)
are complete within 50 ms.

## Resources

- [Source code for **Estimated Input Latency** audit](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/metrics/estimated-input-latency.js)
- [Lighthouse v3 Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt)
- [Measure Performance with the RAIL Model](https://web.dev/articles/rail)
- [Rendering Performance](https://web.dev/articles/rendering-performance)
- [Optimize Website Speed With Chrome DevTools](https://developer.chrome.com/docs/devtools/overview.md.txt#start)
