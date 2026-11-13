---
source_url: https://web.dev/articles/tbt
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: 168ce5f3d1887b475f4b90e9628c0bd28e28bc495651ea7274b209ea185da39b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Philip Walton [X](https://twitter.com/philwalton) [GitHub](https://github.com/philipwalton) [LinkedIn](https://www.linkedin.com/in/waltonphilip) [Mastodon](https://toot.cafe/@philipwalton) [Bluesky](https://bsky.app/profile/philipwalton.com) [Homepage](https://philipwalton.com/) Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Published: November 7, 2019, Last updated: October 15, 2025

<iframe src="https:///frame/articles/tbt/index_6140dac9c18c6e2c61d7be64d1f2ed45bcf60838545f526ffdea479c0aa95e16.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

> [!NOTE]
> **Note:** Total Blocking Time (TBT) is an important [lab metric](https://web.dev/articles/user-centric-performance-metrics.md.txt#in_the_lab) for measuring [load responsiveness](https://web.dev/articles/user-centric-performance-metrics.md.txt#types_of_metrics) because it helps quantify the severity of how non-interactive a page can be prior to it becoming reliably interactive. A low TBT often correlates with a low [Interaction to Next Paint (INP)](https://web.dev/articles/inp.md.txt).

## What is TBT?

The Total Blocking Time (TBT) metric measures the total amount of time after [First Contentful Paint (FCP)](https://web.dev/articles/fcp.md.txt) where the main thread was blocked for long enough to prevent input responsiveness.

By default, Lighthouse stops monitoring TBT after [Time to Interactive (TTI)](https://web.dev/articles/tti.md.txt), as do some other lab tools that measure page load. See [How does TBT relate to TTI?](https://web.dev/articles/tbt.md.txt#how_does_tbt_relate_to_tti).

The main thread is considered "blocked" any time there's a [Long Task](https://web.dev/articles/custom-metrics.md.txt#long-tasks-api) a task that runs on the main thread for more than 50 milliseconds. We say the main thread is "blocked" because the browser cannot interrupt a task that's in progress. So in the event that a user _does_ interact with the page in the middle of a long task, the browser must wait for the task to finish before it can respond.

If the task is long enough (anything higher than 50 milliseconds), it's likely that the user will notice the delay and perceive the page as sluggish or broken.

The _blocking time_ of a given long task is its duration in excess of 50 milliseconds. And the _total blocking time_ for a page is the sum of the _blocking time_ for each long task that occurs after FCP for the measured timeframe (typically TTI for page load tools, or the total trace time for other tooling).

For example, consider the following diagram of the browser's main thread during page load:
A timeline of tasks on the main thread.

The timeline depicted in the preceding image has five tasks, three of which are Long Tasks because their duration exceeds 50 milliseconds. The next diagram shows the blocking time for each of the long tasks:
The same tasks, with blocking times marked.

So while the total time spent running tasks on the main thread is 560 milliseconds, only 345 milliseconds of that time is considered blocking time.

|                         | Task duration (milliseconds) | Task blocking time (milliseconds) |
| ----------------------- | ---------------------------- | --------------------------------- |
| Task one                | 250                          | 200                               |
| Task two                | 90                           | 40                                |
| Task three              | 35                           | 0                                 |
| Task four               | 30                           | 0                                 |
| Task five               | 155                          | 105                               |
| **Total Blocking Time** |                              | **345 milliseconds**              |

### How does TBT relate to INP?

TBT predates INP and is useful as an indicator of INP issues, particularly in the lab environment where measuring INP is more difficult. However, TBT can flag potential problems were there may be no issues for users---if they don't interact at that time. And it can also miss issues caused by interactions when measured in the lab environment. We recommend measuring INP in the field as a measure of actual responsiveness issues as experienced by users. TBT may be a reasonable proxy metric for INP for the lab but it's not a substitute for INP in and of itself.

### How does TBT relate to TTI?

TBT is measured over a time period. For some lab tools that traditionally measure page loads, including Lighthouse, TBT has been measured up until TTI because it helps quantify the severity of how non-interactive a page is prior it to becoming reliably interactive. However, TBT could also continue to be measured after page load and so beyond TTI, for example in Lighthouse Timespan mode.

TTI considers a page "reliably interactive" if the main thread has been free of long tasks for at least five seconds. This means that three, 51 ms tasks spread out over 10 seconds can push back TTI just as far as a single 10-second long task---but those two scenarios would feel very different to a user trying to interact with the page.

In the first case, three, 51 ms tasks would have a TBT of **3 milliseconds** . Whereas a single, 10-second long tasks would have a TBT of **9950 milliseconds**. The larger TBT value in the second case quantifies the worse experience.

This example shows why TBT is often a better metric than TTI as it is less prone to outliers. This is even the case when TTI is used as the endpoint for TBT.

## How to measure TBT

TBT is a metric that should be measured [in the lab](https://web.dev/articles/user-centric-performance-metrics.md.txt#in_the_lab). The best way to measure TBT is to run a Lighthouse performance audit on your site. See the [Lighthouse documentation on TBT](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time) for usage details.

It is possible to measure TBT in the field, but we don't recommend this as user interaction can affect your page's TBT in ways that lead to lots of variance in your reports. Instead we advise looking at the newer [Long Animations Frame API in the field](https://developer.chrome.com/docs/web-platform/long-animation-frames#use-loaf) if wanting to look beyond a single INP interaction.

### Lab tools

- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
- [WebPageTest](https://www.webpagetest.org/)

## What is a good TBT score?

To provide a good user experience, sites should strive to have a Total Blocking Time of less than **200 milliseconds** when tested on **average mobile hardware**.

For details on how your page's TBT affects your Lighthouse performance score, see [How Lighthouse determines your TBT score](https://developer.chrome.com/docs/lighthouse/performance/lighthouse-total-blocking-time#how-lighthouse-determines-your-tbt-score)

## How to improve TBT

In general we recommend optimizing for [INP](https://web.dev/articles/inp.md.txt) over TBT as we recommend using TBT is a proxy metric for INP in the lab (where INP cannot usually be accurately measured). Therefore, to improve TBT look at our guidance for [Optimizing INP](https://web.dev/explore/how-to-optimize-inp).

If you are looking specifically at TBT, you can run a Lighthouse performance audit and pay attention to any specific [opportunities](https://developer.chrome.com/docs/lighthouse/performance#opportunities) the audit suggests.

In general improving TBT for a site involves reducing the amount of blocking scripts which means either optimizing them to be less blocking, or reducing the amount of scripts overall. Refer to the following performance guides:

- [TBT definition and reasoning](https://docs.google.com/document/d/1xCERB_X7PiP5RAZDwyIkODnIXoBk-Oo7Mi9266aEdGg/edit?tab=t.0#heading=h.lrjaedl9xnxx)
- [Optimize long tasks](https://web.dev/articles/optimize-long-tasks.md.txt)
- [Reduce the impact of third-party code](https://developer.chrome.com/docs/lighthouse/performance/third-party-summary)
- [Reduce JavaScript execution time](https://developer.chrome.com/docs/lighthouse/performance/bootup-time)
- [Minimize main thread work](https://developer.chrome.com/docs/lighthouse/performance/mainthread-work-breakdown)
- [Keep request counts low and transfer sizes small](https://developer.chrome.com/docs/lighthouse/performance/resource-summary)
