---
source_url: https://web.dev/articles/crux-and-rum-differences
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:22+00:00
sha256: 5ed59efd30f967da64d4e2bdf534231366b96982a35aa88ae14e665e4b99f87f
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Learn about reasons why RUM data can show different Core Web Vitals numbers from CrUX.

 Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Published: August 15, 2022, Last updated: December 17, 2025

The [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux) provides user experience metrics for how real-world Chrome users experience popular destinations on the web. This data is automatically collected by Chrome from users who have opted in, and is made available based on the [CrUX eligibility criteria](https://developer.chrome.com/docs/crux/methodology#eligibility).

CrUX data is therefore available for millions of websites. Many site owners have not had access to field data before, and CrUX has enabled many sites to see the value of this for the first time. As a public dataset, CrUX can also be used for competitive analysis and benchmarking of user experience metrics.

[Real User Monitoring (RUM)](https://en.wikipedia.org/wiki/Real_user_monitoring) is similar to CrUX, but instead of Chrome automatically collecting user-experience metrics, code is included on the websites to do this collection and feed it back to a RUM provider or analytics solution for further analysis.

With both solutions measuring user experience metrics, it is natural to assume that they should be equivalent. It can be confusing when we see differences. This guide will explain why that can happen, and offers suggestions for what to do when the numbers don't align.

## Benefits of supplementing CrUX with a RUM solution

CrUX is a great tool for a consistent view across sites and---as [the Google dataset for the Core Web Vitals program](https://developer.chrome.com/docs/crux)---sites will likely want to keep an eye on what it is showing. The aim of CrUX is to provide a statistically relevant overview of millions of websites for cross comparison.

However, for a deeper dive in investigating *why* data is showing the numbers it is, investing in a full RUM solution to supplement CrUX can give you access to more detailed information than can be made available in a publicly queryable dataset. This can help you explain and improve your metrics in a number of ways.

### Deeper analysis to investigate issues

CrUX can often be used to point out if you have a problem on your site, but not necessarily exactly where on your site the issue lies nor why. RUM solutions---whether home-grown through [the likes of the web-vitals library](https://web.dev/articles/debug-performance-in-the-field.md.txt) or some of the many commercial products---can help bridge that gap.

Using a RUM solution gives you access to much more fine-grained data for all your pages, and on all browsers. It also lets you segment and analyze this data in ways CrUX does not, enabling you to drill down and investigate problem areas of the site. Are they affected by a particular segment of users? Or users who take certain actions? Exactly when did the problem start? These are questions that are much easier to answer with the additional data that a RUM tool can provide.

### Correlate with other business metrics

RUM also lets you compare your web performance metrics directly with any business metrics, showing the value in investing in performance, and what other performance work to prioritize. We have numerous [case studies](https://web.dev/case-studies) with businesses doing this correlation, such as [Farfetch](https://web.dev/case-studies/farfetch.md.txt#step_1_defining_measuring_and_monitoring_metrics) or [The Economic Times](https://web.dev/case-studies/economic-times-cwv.md.txt).

### Collect other performance data

A RUM solution allows collection of other custom metrics, tied directly to your specific business. One of the more well-known examples is Twitter's "[Time to first Tweet](https://blog.twitter.com/engineering/en_us/a/2012/improving-performance-on-twittercom#:%7E:text=The%20most%20important%20metric%20we,Tweet%20on%20each%20page's%20timeline.)" metric. These site-specific measures can then be correlated with Core Web Vital improvements and business metrics.

## Differences between two sets of field data

> A man with a watch knows what time it is. A man with two watches is never sure.
> [Segal's Law](https://en.wikipedia.org/wiki/Segal%27s_law)

Whenever you have two sources of data, it can often be confusing and frustrating as to why they differ. In much the same way as it's important to understand the difference between [lab and field metrics](https://web.dev/articles/lab-and-field-data-differences.md.txt), there can also be differences between two sources of *field* data. While the data would be the same in an ideal world, there are many reasons why they can differ.

### Lab data versus field data

The first thing to check is whether you are looking at lab (synthetic) metrics or field (RUM) metrics. While it's natural to assume RUM products only look at field data, many offer a lab component as well.

Lab data is incredibly useful precisely because of the fixed conditions it measures under. It can be used to monitor unexpected changes or regressions in a production environment without the noise of a changing field population. However, lab data may not be representative of the real user experience, so field metrics can show quite different results.

### Populations

The datasets used by CrUX and RUM solutions may be different due to differences in which page visits are being measured depending on which browsers, users, sites, and devices are being compared.

#### Included browsers

The Chrome User Experience Report, as its name suggests, is Chrome-only. While there are many Chromium-based browsers (Edge, Opera, and Brave to name a few) that shares a lot of the Chrome codebase, only Chrome users feed data into CrUX. This restriction also means Chrome users on iOS are not included, since it uses the underlying Webkit browser engine. Android WebViews also don't count as "Chrome", so data from these users is not included---though [Chrome Custom Tabs](https://developer.chrome.com/docs/android/custom-tabs) are included.

While Chrome is one of the world's most popular browsers---and therefore would likely give a broad representation of your site's performance in most cases---measuring just that browser is by no means a measure of all your users. This may explain one main difference between RUM and CrUX. This is particularly true for performance techniques that rely on APIs or image formats only available in Chrome, for example.

The lack of iOS data can also lead to bias. For example, [as iOS users are typically on more performant devices](https://infrequently.org/2021/03/the-performance-inequality-gap/) or visiting from more countries with better network infrastructure, including them can lead to high overall performance metrics. On the other hand, *excluding* them---as CrUX does---can lead to data that is skewed to the lower end of site visitors ([example case study](https://www.smashingmagazine.com/2021/12/core-web-vitals-case-study-smashing-magazine/)). Android users typically cover a wider range of devices, device capabilities, and markets.

RUM solutions can get data for non-Chrome browsers, and in particular from Chromium-based browsers that often have the same metrics (such as Core Web Vitals) built-in. Non-Chromium-based browsers are also measured by RUM solutions, but may have a more limited set of metrics. For example, [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls.md.txt) is only available in Chromium-based browsers. Some other paint-based metrics like LCP, INP, and even [First Contentful Paint (FCP)](https://web.dev/articles/fcp.md.txt) can be measured quite differently (see later).

#### Opted-in users

As well as being limited to Chrome users, CrUX is further restricted by only measuring [a subset of Chrome users](https://developer.chrome.com/docs/crux/methodology#user-eligibility) who have opted in to share CrUX data when the browser was installed.

RUM providers also only look at a subset of users, usually due to cookie banner prompts---asking users to opt into RUM data collection---or tracking blockers. This can adversely affect some initial page loads if the confirmation is not given until the second or subsequent page, when some of the site assets have already been cached from previous pages. If this happens frequently, the metrics may appear more favorable in RUM than they actually are if slower initial page loads are excluded in a sufficient number of cases.

#### Included sites

CrUX is only intended to report on public websites, so there are other [eligibility criteria](https://developer.chrome.com/docs/crux/methodology#eligibility) that may result in data not being logged in CrUX. Most notable of these criteria is that the website must be publicly discoverable and sufficiently popular to ensure a minimal sample size from which to draw meaningful conclusions. In most cases, this will result in no data being available in CrUX. This is less of a confusing difference compared to the data being available but different, but explains why that happens.

However, if specific pages of a site are marked as indexable but others are not, then you may only see a subset of URLs in CrUX. If the origin is publicly discoverable, then all page views within that origin will be included in the origin-level data, but URL-level data may not be available.

#### Devices

CrUX segments data by mobile, desktop, and tablet - though many tools concentrate on the first two and may not expose tablet data, or may include it within mobile or desktop. The performance characteristics on mobile versus desktop can be quite different---both in terms of the content delivered, and in the capabilities of the devices viewing them.

RUM data will allow segmenting traffic similarly, but often shows consolidated data by default. RUM may only allow segmenting by device type (for example, mobile) or browser (for example, Chrome), but not both to only see mobile Chrome traffic. When comparing to CrUX data, ensure you are comparing like-for-like by filtering by device type *and* the Chrome browser.

#### Sampling

RUM solutions typically allow adjusting the sampling rate of opted-in visitors where data is collected. This can be used to reduce the volume of data needed to be analyzed, and to reduce costs of commercial RUM services. If that sample size is too small and not representative of the wider population, then the resulting metrics will also be similarly skewed. Discuss with your RUM provider the appropriate sampling size for your site.

### Aggregation of data

Field data by its very nature will include many, many data points of the same metrics compared to lab data, which will give a single value. If this data is aggregated differently for reporting, it can lead to another reason for differences between CrUX and RUM.

#### Timespan

CrUX data is based on a 28 day sliding window of traffic, and it is not possible to change this timeframe---though the [CrUX BigQuery data](https://developer.chrome.com/docs/crux/bigquery) is stored for each month, allowing you to see previous months, and the [CrUX History API](https://developer.chrome.com/docs/crux/history-api) also gives historical data over a weekly period. Both still provide data based on the 28 day sliding window.

RUM data typically allows much greater granularity to allow seeing the impact of changes much sooner. When choosing smaller periods, though, RUM data can be unduly impacted by fluctuations in website traffic and visitors. When comparing RUM data to CrUX data, always ensure you are looking at performance over 28 days. Once you are satisfied the data is similar, you can look at other time frames to drill into the RUM data.

#### Aggregation of statistics

CrUX metrics are measured at the 75th percentile---that is, looking at the value that 75% of page views achieved. There will be extremes in field data and removing the worst 25% experiences, it is intended to give a value that the majority of visitors can reasonably be expected to achieve.

RUM products often give a wider number of options of how to aggregate the metrics, including 75th percentile, median and other percentiles. If comparing RUM values to CrUX data, it is necessary to ensure you are looking at 75th percentile data to compare like-for-like.

The histogram data in CrUX includes all available data---not just 75th percentile---and shows the number of page views in each rating, but the aggregate score will be based on 75th percentile. This CrUX data is surfaced in tools like [PageSpeed Insights](https://pagespeed.web.dev/):
 PageSpeed Insights shows CrUX 75th percentile and histogram data

### Differences in metrics

There are many metrics used to measure web performance, so when comparing two different sets of data, it's important to understand what metrics are being measured, and how those metrics are being used.

#### Metrics measured

CrUX data is the Google dataset of the [Core Web Vitals](https://web.dev/articles/vitals.md.txt) initiative and primarily measures these metrics ([LCP](https://web.dev/articles/lcp.md.txt), [CLS](https://web.dev/articles/cls.md.txt), and [INP](https://web.dev/articles/inp.md.txt)), with [a few additional metrics](https://developer.chrome.com/docs/crux/methodology/metrics) to complement these.

RUM tools usually include these Core Web Vitals, but often include many other metrics too. Some RUM providers also measure the user experience using their own combination of all these metrics perhaps to give a "happiness index" or such. When comparing RUM data to CrUX, ensure you are comparing like-for-like.

Tools that assess Core Web Vitals pass or fail status should consider a page passing if it meets the recommended targets at the 75th percentile for all Core Web Vitals. If INP is not present for pages with no interactions, then only LCP and CLS need to pass.

#### Metric differences across browsers

CrUX only measures in Chrome browsers, and you can refer to the [Web Vitals Changelogs](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/README.md) to see how these change with each version of Chrome.

RUM solutions, however, will measure from a wider variety of browsers. Chromium-based browsers (Edge, Opera, and so on) will likely be similar to Chrome, unless Chrome is implementing new changes as noted in the Changelog.

For non-Chromium browsers, the differences can be more pronounced. paint based metrics like LCP, INP and FCP, for example, are available in Safari and Firefox, but [is measured in a different way](https://web.dev/blog/lcp-and-inp-are-now-baseline-newly-available.md.txt#are_there_any_differences_in_the_implementations). This can lead to significant variances in the times reported. As stated previously, if you are wanting to compare RUM to CrUX, it is best to filter on just Chrome users to allow for a like-for-like comparison.

#### Metrics timing

Core Web Vitals metrics are provided by web browser APIs, but that does not mean there is not a potential for differences of values reported using them. Exactly *when* the metric measurement is taken---at page load or throughout the full page life cycle---can lead to differences. RUM tools may not always measure metrics in the same way---even if using the same names---and the same browser APIs to get the data, which can be confusing.

[Largest Contentful Paint (LCP)](https://web.dev/articles/lcp.md.txt) is a page-load metric. A number of LCP elements can be reported by the Web API if larger elements are loaded later after the initial render. The final LCP element is when the page finishes loading or the user interacts with the page. Therefore differences can arise if the LCP element is reported earlier than those two events.

Additionally, in field data, the LCP element can be different depending on how the page is loaded. For a default page load showing the top of the page content, the LCP element will depend primarily on the screen size. However, if the page is opened with an anchor link further down the document, or similarly opened with a deep-link into a Single Page App (SPA)---more on that later---then the LCP element can be different.

Don't assume that the LCP timings provided in either CrUX nor RUM are based on the same element as lab tools. While CrUX will give you the overall LCP value per page or origin, RUM can segment this further to identify individual LCP problem sessions.

[Cumulative Layout Shift (CLS)](https://web.dev/articles/cls.md.txt) is measured [throughout the life of the page](https://web.dev/articles/cls.md.txt#what_is_cls), so the initial page-load CLS may not be representative of pages that cause greater shifts later after the page has loaded and the user has interacted with it. Taking the CLS value only after the page load---as many RUM products do---will therefore give a different result than taking the CLS value after the user finishes with the page.

[Interaction to Next Paint (INP)](https://web.dev/articles/inp.md.txt) responsiveness metric requires an input to be measured, and observes all click, tap, and keyboard interactions throughout the life of the page, in a similar fashion to CLS, and so the reported value of INP may be very different if measured after the user has made a number of interactions on the page.

CrUX will follow the [Core Web Vitals documentation](https://web.dev/articles/vitals.md.txt) and measure these through the full lifetime of the page. Many RUM providers choose instead to measure these metrics either after page load, or at some other time (for example, when a key call-to-action is clicked) for various reasons.

Getting an understanding from your RUM provider as to when Core Web Vitals are measured is important when seeing unexplained variances between the two data sources.

#### Single-page applications

Single-page applications (SPA) work by updating the content on the current page, rather than performing actual page navigations at the browser level. This means the browser does not see these as page navigations, despite users experiencing them as such. The [Core Web Vitals APIs provided by the browser won't take these into consideration](https://web.dev/articles/vitals-spa-faq.md.txt), and therefore CrUX does not support these page navigations. Work is underway to resolve this issue---see the [Measuring soft navigations](https://developer.chrome.com/docs/web-platform/soft-navigations) post for more information.

Some RUM providers do attempt to detect "soft navigations" in SPAs, but if they're also attributing Core Web Vitals metrics to those "soft navigations" it will lead to differences with CrUX since the underlying APIs don't support this for many of the metrics.

### CrUX and Web API differences

As well as the differences in *which* page views are measured, and *what* is measured, there are a few other, more complicated, scenarios to be aware of that can lead to differences in CrUX and RUM data. Some of these are due to limitations of the Web APIs used to measure the metrics, and some are where the results returned by the API need to be treated differently for certain scenarios. The Core Web Vitals documentation lists these differences for [LCP](https://web.dev/articles/lcp.md.txt#differences_between_the_metric_and_the_api) and [CLS](https://web.dev/articles/cls.md.txt#differences_between_the_metric_and_the_api) but the main differences are also noted in the following sections.

#### Back/forward cache

CrUX considers [Back/forward cache](https://web.dev/articles/bfcache.md.txt) (or bfcache) restores as page navigations even though they don't result in a conventional page load. As the Web APIs don't treat these as a page load, RUM solutions need to [take extra steps](https://web.dev/articles/bfcache.md.txt#how_bfcache_affects_analytics_and_performance_measurement) for these pages to be counted if they want to match CrUX. These are considerably faster page loads that can result in overall better performance being reported for a site, so not including them can result in worse overall page performance metrics. Refer to your RUM solution to understand if they handle bfcache restored pages.

#### Iframes

For security and privacy reasons, top-level pages don't have access to content within iframes (not even same-origin iframes). This means performance metrics for content in those can only be measured by the iframe itself, and not through the Web APIs on the framing page. If the iframe content includes the LCP element, or content that impacts the CLS or INP experienced by the user, this won't be available to RUM solutions ([including the Google web-vitals JavaScript library](https://github.com/GoogleChrome/web-vitals#limitations)).

CrUX however, being measured by the Chrome browser itself rather than JavaScript on the page, does not have these limitations and so does measure metrics within iframes when reporting Core Web Vitals. This more accurately reflects what the user experiences, but can be another reason for differences for sites making use of iframes.

One concrete example of how this can lead to differences between LCP data in CrUX and RUM is embedded `<video>`. An playsinline autoplaying `<video>` element's first painted frame can count as an LCP candidate, but embeds for popular video streaming services may place these elements in an `<iframe>`. CrUX can account for this, as it can access `<iframe>` contents, but RUM solutions cannot.

#### Cross-origin resources

LCP media served from other domains may not give render time in the [PerformanceObserver API](https://developer.mozilla.org/docs/Web/API/PerformanceObserver)---unless the [Timing-Allow-Origin header](https://developer.mozilla.org/docs/Web/HTTP/Headers/Timing-Allow-Origin) (TAO) is provided---due to browser security restrictions to reduce timing attacks. This [falls back to the load time of the resource](https://web.dev/articles/lcp.md.txt#load-render-time) but this may be quite different from when the content was actually painted.

This can lead to the seemingly impossible situation where LCP is reported by web APIs as earlier than FCP. This is not the case but only appears so due to this security restriction.

This was [resolved in late 2024](https://github.com/w3c/paint-timing/issues/104) and a slightly coarsened render time [is available from Chrome 133](https://chromestatus.com/feature/5128261284397056) even when `Timing-Allow-Origin` is not provided.

Again, CrUX does report the render time data for Core Web Vitals. Sites are advised to limit cross-origin content that impacts the Core Web Vitals metrics and to enable TAO where possible if they want to measure this more accurately. Other cross-origin resources may be subject to similar restrictions.

#### Background tabs

When a page is not opened in a background tab they will still emit metrics using Web APIs. However, these are not reported by CrUX since they give timings that are inconsistent with the user experience. RUM solutions should also consider ignoring these, or at least explaining how these page views are treated.

## So what can we do about it?

We have shown why there may be differences between CrUX and RUM data, either due to differences in the methodology each uses or due to which users and page views are included or excluded. Ideally, both sets of data will still be representative of your site performance to be useful, but the reasons given should outline why it is very unlikely to get the exact same numbers in each.

Where differences are slight (for example reporting a LCP of 2.0 seconds versus 2.2 seconds) both datasets will be useful and can usually be considered to be roughly in sync.

When pronounced differences make you question the accuracy of the data, you should try to understand those differences. Can the RUM data be filtered to be more closely aligned with CrUX (looking only at Chrome users, for desktop or mobile, with 75th percentile values over 28 days) to reduce these differences?

If so---and you can get the data to match more closely---then you should still ask why you are seeing these differences in the overall data and what this means. Are non-Chrome users skewing your metrics in a positive or negative way? Does this give you more insights into where you have performance issues that you can prioritize?

If your non-Chrome users are getting different results then you can use this valuable insight that RUM has given you to optimize differently. For example, certain APIs are not available on certain browsers, but you can consider alternatives for unsupported browsers to also improve their experiences. Or you can give [a different, but more performant, experience](https://www.smashingmagazine.com/2022/03/signals-customizing-website-user-experience) to users on constrained devices or networks. CrUX is limited to Chrome data, but you should consider all your site visitors' experiences to help prioritize improvements. RUM data can fill that gap.

Once you understand the reasons for any differences, both tools can be incredibly useful to understand the user experiences of your website, and to help improve this even if the numbers are not identical. Use your RUM data to complement CrUX data and allow you to dig into what CrUX is telling you at a high level by segmenting your traffic to help you identify if it's particular areas of your site or user base that need attention.

Looking at the trends to see your improvements are having the expected positive impacts is often more important than having each number match exactly between the two data sources. As mentioned previously, RUM lets you look at different time frames to get an advance look at what your 28 day CrUX scores will be---though looking at too short time frames can lead to noisy data, hence why CrUX uses 28 days.

Often there is no "right" or "wrong" answer in these different metrics - they are just a different lens on your users and how they are experiencing your site. As long as you understand why these differences happen, and what that can do to drive your decision making, that is what is more important to better serve your site visitors.
