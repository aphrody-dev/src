---
source_url: https://web.dev/articles/vitals-measurement-getting-started
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: a866c69535563399a241102696858fefed4afaa772c86a9792f5f0ab7787b130
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Katie Hempenius [X](https://twitter.com/katiehempenius)

Collecting data on your site's Web Vitals is the first step towards improving them. A well-rounded analysis will collect performance data from both real-world and lab environments. Measuring Web Vitals requires minimal code changes and can be accomplished using free tooling.

## Measure Web Vitals using RUM data

[Real User Monitoring](https://en.wikipedia.org/wiki/Real_user_monitoring) (RUM) data, also known as field data, captures the performance experienced by a site's actual users. RUM data is what Google uses to determine whether a site meets the [recommended Core Web Vitals thresholds.](https://web.dev/articles/vitals.md.txt)

### Getting started

If you don't have a RUM setup, the following tools will quickly provide you with data about the real-world performance of your site. These tools are all based on the same underlying dataset (the [Chrome User Experience Report](https://developer.chrome.com/docs/crux)), but have slightly different use cases:

- **[Chrome DevTools](https://developer.chrome.com/docs/devtools/performance/overview)** integrates with the CrUX dataset in the live metrics view of the Performance panel. By comparing your local experience against real-user experiences on the same page, you can make a more informed decision about where to focus your debugging efforts. If you're looking for a single action to take in order to get started with measuring and improving your site's Web Vitals, we recommend using the Chrome DevTools Performance panel.
- **[PageSpeed Insights (PSI)](https://pagespeed.web.dev/)** reports on the aggregate page-level and origin-level performance over the past 28 days. In addition, it provides suggestions on how to improve performance. PSI is available on the [web](https://pagespeed.web.dev/) and as an [API](https://developers.google.com/speed/docs/insights/v5/get-started).
- **[Search Console](https://search.google.com/search-console/welcome)** reports performance data on a per-page basis. This makes it well-suited for identifying specific pages that need improvement. Unlike PageSpeed Insights, Search Console reporting includes historical performance data. Search Console can only be used with sites that you own and have verified ownership of.
- **[CrUX Vis](https://developer.chrome.com/docs/crux/vis)** is a prebuilt dashboard that surfaces CrUX history data for a URL or origin of your choosing (where available in the CrUX dataset). It is built on top of the CrUX History API and the setup process takes about a minute. Compared to PageSpeed Insights and Search Console, CrUX Vis includes more data example, LCP subparts, navigation types, and so forth.
- **[CrUX Vis](https://cruxvis.withgoogle.com/)** is a historical dashboard that surfaces CrUX data for an origin or URL of your choosing. It is built on top of CrUX History API. Compared to PageSpeed Insights and Search Console, CrUX Vis reporting includes more details---for example, [navigation types](https://developer.chrome.com/blog/crux-navigation-types) and [LCP and RTT data](https://developer.chrome.com/blog/crux-2025-02) is available in CrUX Vis.

It's worth noting that although the tools listed previously are well-suited for "getting started" with measuring Web Vitals, they can be useful in other contexts as well. In particular, both CrUX and PSI are available as an API and can be used to build dashboards and other reporting.

### Collect RUM data

Although CrUX-based tools are a good starting point for investigating Web Vitals performance, we strongly recommend supplementing it with your own RUM. RUM data that you collect yourself can provide more detailed and immediate feedback on your site's performance. This makes it easier to identify issues and test possible solutions.

> [!NOTE]
> **Note:** CrUX-based data sources report data using a granularity of approximately one month---however, the details of this vary slightly by tool. For example, PSI and Search Console report the performance observed over the past 28 days, whereas the CrUX dataset and dashboard is broken down by calendar month.

You can collect your own RUM data by using a dedicated RUM provider, or, by setting up your own tooling.

Dedicated RUM providers specialize in collecting and reporting RUM data. To use Core Web Vitals with these services, ask your RUM provider about enabling Core Web Vitals monitoring for your site.

If you don't have a RUM provider, you may be able to augment your existing analytics setup to collect and report on these metrics by using the [`web-vitals` JavaScript library](https://github.com/GoogleChrome/web-vitals). This method is explained in more detail next.

### The web-vitals JavaScript library

If you're implementing your own RUM setup for Web Vitals, the easiest way to collect Web Vitals measurements is to use the [`web-vitals`](https://github.com/GoogleChrome/web-vitals) JavaScript library. `web-vitals` is a small, modular library (\~2KB) that provides a convenient API for collecting and reporting each of the [field-measurable](https://web.dev/articles/user-centric-performance-metrics.md.txt#in_the_field) Web Vitals metrics.

The metrics that make up Web Vitals are not all directly exposed by the browser's built-in performance APIs---but rather built on top of them. For example, [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls.md.txt) is implemented using the [Layout Instability API](https://wicg.github.io/layout-instability/). By using `web-vitals`, you don't need to worry about implementing these metrics yourself; it also ensures that the data you collect matches the methodology and best practices for each metric.

For more information on implementing `web-vitals`, refer to the [documentation](https://github.com/GoogleChrome/web-vitals) and the [Best practices for measuring Web Vitals in the field](https://web.dev/articles/vitals-field-measurement-best-practices.md.txt) guide.

### Data aggregation

It is essential that you report the measurements collected by `web-vitals`. If this data is measured but not reported, you'll never see it. The `web-vitals` documentation includes examples showing how to send the data to [a generic API endpoint](https://github.com/GoogleChrome/web-vitals#send-the-results-to-an-analytics-endpoint), [Google Analytics](https://github.com/GoogleChrome/web-vitals#send-the-results-to-google-analytics), or [Google Tag Manager](https://github.com/GoogleChrome/web-vitals#send-the-results-to-google-tag-manager).

If you already have a favorite reporting tool, consider using that. If not, Google Analytics is free and can be used for this purpose.

When considering which tool to use, it is helpful to think about who will need to have access to the data. Businesses typically achieve the biggest performance wins when the whole company, rather than a single department, is interested in improving performance. See [Fixing website speed cross-functionally](https://web.dev/articles/fixing-website-speed-cross-functionally.md.txt) to learn how to get buy-in from different departments.

### Data interpretation

When analyzing performance data, it's important to pay attention to the tails of the distribution. RUM data often reveals that performance varies widely---some users have fast experiences, others have slow experiences. However, using the median to summarize data can mask this behavior.

With regards to Web Vitals, Google uses the percentage of "good" experiences, rather than statistics like medians or averages, to determine whether a site or page meets the recommended thresholds. Specifically, for a site or page to be considered as meeting the Core Web Vitals thresholds, 75% of page visits should meet the "good" threshold for each metric.

## Measure Web Vitals using lab data

[Lab data](https://web.dev/articles/user-centric-performance-metrics.md.txt#in_the_lab), also known as synthetic data, is collected from a controlled environment, rather than actual users. Unlike RUM data, lab data can be collected from pre-production environments and therefore incorporated into developer workflows and continuous integration processes. Examples of tools that collect synthetic data are Lighthouse and WebPageTest.

### Considerations

There will always be discrepancies between RUM data and lab data---particularly if the network conditions, device type, or location of the lab environment differs significantly from that of users. However, when it comes to collecting lab data on Web Vitals metrics in particular, there are a couple specific considerations that are important to note:

- [**Largest Contentful Paint (LCP)**](https://web.dev/articles/lcp.md.txt) measured in lab environments can be different to those measured in the field with RUM data due to delays in loading the page (through redirects, latency connecting to the server, or uncached data), different content shown to different users depending on screen, or due to other reasons (including, cookie banners, personalization).
- [**Cumulative Layout Shift (CLS)**](https://web.dev/articles/cls.md.txt) measured in lab environments can be artificially lower than the CLS observed in RUM data. Many lab tools only load the page---they don't interact with it. As a result, they only capture layout shifts that occur during initial page load. By contrast, the CLS measured by RUM tools captures [unexpected layout shifts](https://web.dev/articles/cls.md.txt#expected_vs_unexpected_layout_shifts) that occur throughout the entire lifespan of the page.
- [**Interaction to Next Paint (INP)**](https://web.dev/articles/inp.md.txt) can't be measured in lab environments because it requires user interactions with the page. As a result, [Total Blocking Time](https://web.dev/articles/tbt.md.txt) (TBT) is the recommended lab proxy for INP. TBT measures the "total amount of time between First Contentful Paint and Time to Interactive during which the page is blocked from responding to user input". Although INP and TBT are calculated differently, they are both reflections of a blocked main thread during the bootstrap process. When the main thread is blocked, the browser is delayed in responding to user interactions.

### Tooling

These tools can be used to gather lab measurements of Web Vitals:

- [**Chrome DevTools**](https://developer.chrome.com/docs/devtools/performance/overview) measures and reports the Core Web Vitals for a given page in the live metrics view of the Performance panel. This view provides developers with real-time performance feedback as they make code changes.
- [**Lighthouse**](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) Lighthouse reports on LCP, CLS, and TBT, and also highlights possible performance improvements. Lighthouse is available in Chrome DevTools, as an [npm package](https://www.npmjs.com/package/lighthouse), and can also be incorporated into continuous integration workflows using [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci).
- [**WebPageTest**](https://webpagetest.org/) includes Web Vitals as a part of its standard reporting. WebPageTest is useful for gathering information on Web Vitals under particular device and network conditions.
