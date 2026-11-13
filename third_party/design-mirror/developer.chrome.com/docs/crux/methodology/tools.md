---
source_url: https://developer.chrome.com/docs/crux/methodology/tools
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: 64bb6a01760a3af0441beef3e82bab29185af228e6cc7cefb7e1c64cfce731fe
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Published: Jun 23, 2022, Last updated: Sep 9, 2025

The CrUX dataset is made available through a variety of tools maintained by
Google. Each tool may access CrUX data slightly differently, resulting in
varying levels of timeliness and metric support.

| Tool | Frequency | Metrics | Dimensions | Historical Data | Origin / Page-level |
|---|---|---|---|---|---|
| [CrUX API](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-crux-api) | 28-day average [^2^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-2) | Subset of key metrics [^4^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-4) | No country dimension | No---See CrUX History API | Origin \& Page |
| [CrUX History API](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-crux-history-api) | Weekly [^3^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-3) | Subset of key metrics [^4^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-4) | No country dimension | Previous 40 weeks | Origin \& Page |
| [CrUX Vis](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-crux-vis) | Weekly [^3^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-3) | Subset of key metrics [^4^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-4) | No country dimension | Previous 40 weeks | Origin \& Page |
| [PageSpeed Insights](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-psi) | 28-day average [^2^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-2) | Subset of key metrics [^4^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-4) | No country dimensions | No | Origin \& Page |
| [PageSpeed Insights API](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-psi-api) | 28-day average [^2^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-2) | Subset of key metrics [^4^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-4) | No country dimensions | No | Origin \& Page |
| [Google Search Console](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-gsc) | 28-day average [^2^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-2) | Core web vitals | Form factor dimension | Three months | Page Group [^6^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-6) |
| [CrUX on BigQuery](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-bigquery) | Monthly [^1^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-1) | All metrics (except LCP resource types and subparts) | All dimensions | Since 2017 [^5^](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#footnote-5) | Origin |

^1^ Monthly data is released on the second Tuesday after each monthly collection period. The last 28 days of each month period are included.  

^2^ 28-day rolling average data is updated daily, based on the aggregated data from the previous 28 days.  

^3^ Weekly historical data is released every Monday, containing the 40 most recent 28 day collection periods that end on Saturdays.  

^4^ The web vital metrics are available in all tools.  

^5^ Not all metrics are available in all monthly tables, see the [release notes](https://developer.chrome.com/docs/crux/release-notes.md.txt) for details.  

^6^ Search Console [groups URLs](https://support.google.com/webmasters/answer/9205520#page_groups) that provide similar experiences, Core Web Vitals data are shown aggregated by these page groups.

The following sections briefly summarize each tool and how the data can be used.

### CrUX API

The [CrUX API](https://developer.chrome.com/docs/crux/api.md.txt) provides programmatic access to CrUX data by page or origin, and can be further filtered by form factor and metrics.

The API provides [Web Vitals](https://web.dev/articles/vitals) metrics both by origin and at page-level and the data is updated daily. The only values provided for metrics are calculated from the previous 28 days as a rolling window. Historical data is available using the separate [History API](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-crux-history-api).

The CrUX API returns more quickly than the [PageSpeed Insights API](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-psi-api) but does not include the additional [Lighthouse data](https://developers.google.com/search/blog/2018/11/pagespeed-insights-now-powered-by) provided by PageSpeed Insights.

[Read more in the API documentation](https://developer.chrome.com/docs/crux/api.md.txt).

### CrUX History API

The [CrUX History API](https://developer.chrome.com/docs/crux/history-api.md.txt) provides programmatic access to
CrUX historical data by page or origin, and can be further filtered by form factor and metrics.

The API provides [Web Vitals](https://web.dev/articles/vitals) metrics both by
origin and at page-level and the data is updated weekly. The only values
provided for metrics are calculated from the past 40 weekly collection periods
of 28 days as a rolling window.

Read more in the [History API documentation](https://developer.chrome.com/docs/crux/history-api.md.txt).

### CrUX Vis

[CrUX Vis](https://cruxvis.withgoogle.com/#/) is a tool to visualize the CrUX History API data to allow you to quickly see a trend of CrUX data over time.

Read more in the [CrUX Vis documentation](https://developer.chrome.com/docs/crux/vis.md.txt).

### PageSpeed Insights

[PageSpeed Insights](https://pagespeed.web.dev/) uses CrUX to present real-user performance data alongside performance opportunities powered by [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt).

The PageSpeed Insights report presents a consolidated view of the Core Web Vitals for the given URL or origin, plus additional diagnostic metrics. Data is presented by desktop and mobile form factors and can be compared with the lab test results to give a better understanding of your page performance.

PageSpeed Insights does not provide historical data, and does not include country or effective connection type dimensions.

### PageSpeed Insights API

The [PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
offers programmatic access to the data shown in PageSpeed Insights, including
Core Web Vitals data from CrUX.

This API integrates well into existing SEO tooling and workflows, allowing CrUX
data to be included in automated reports and analyses. The PageSpeed Insights
API returns slower than the [CrUX API](https://developer.chrome.com/docs/crux/methodology/tools.md.txt#tool-crux-api), but includes additional
data provided by [Lighthouse](https://developers.google.com/search/blog/2018/11/pagespeed-insights-now-powered-by).

As in the web version, the PageSpeed Insights API has no historical data and is limited to the Core Web Vitals. Country and effective connection type dimensions are not included.

### Search Console

[Search Console](https://search.google.com/search-console) shows how CrUX data influences the [page experience](https://developers.google.com/search/docs/advanced/experience/page-experience) ranking factor by URL and URL group.

Search Console presents Core Web Vitals values as aggregates of [groups of similar pages](https://support.google.com/webmasters/answer/9205520#page_groups). This provides a quick indication of which sections of a site are potentially impacting the page experience ranking factor.

Data is updated daily and is split by mobile and desktop form factors. A maximum sample of 20 pages per group are presented for further analysis.

### CrUX on BigQuery

Origin-level CrUX data is available for public querying using
[BigQuery](https://cloud.google.com/bigquery).

[Chrome UX on BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt) provides a publicly accessible
database of all origin-level data collected by CrUX. It is possible to query any
and all origins for which data is collected, analyze any metric that CrUX
supports and filter by all available dimensions. Full metric histograms are
stored in the BigQuery tables allowing for visualization of performance
distributions, including experimental metrics.

The data in BigQuery is updated monthly, with each month's data released on the
second Tuesday after the collection period. Page-level data is not available in
BigQuery tables, and percentiles are interpreted from coarse histogram data
which results in approximate values.

Use CrUX on BigQuery for analysis across any dimension: origins, countries,
dates, form factor and connection type. Read more about
[CrUX on BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt).
