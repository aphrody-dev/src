---
source_url: https://developer.chrome.com/docs/crux/guides/looker-studio-dashboard
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: 4ce91b0c66693dff55592d51493642e84b7f91192270fb39813577846c89c1ef
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Rick Viscomi [GitHub](https://github.com/rviscomi) [Bluesky](https://bsky.app/profile/rviscomi.dev) [Homepage](https://developer.chrome.com/rviscomi.dev/)

Published: Jun 12, 2020, Last updated: Sep 9, 2025

[Looker Studio](https://cloud.google.com/looker-studio) (formerly Data Studio) is a powerful data visualization tool that lets you build dashboards on top of big data sources, like the [Chrome UX Report](https://developer.chrome.com/docs/crux.md.txt) (CrUX). In this guide, learn how to create your own custom CrUX Dashboard to track an origin's user experience trends.

> [!WARNING]
> **Warning:** The CrUX Dashboard is [deprecated](https://developer.chrome.com/blog/crux-dashboard-deprecation.md.txt). Consider using [CrUX Vis](https://cruxvis.withgoogle.com/#/)---a newer dashboard, based on the [CrUX History API](https://developer.chrome.com/docs/crux/history-api.md.txt) which has many advantages over the CrUX Dashboard: quicker load times, weekly updates instead of monthly updates, both origin and URL-level data where available, and additional metrics not available in the dashboard. Try it out!

The CrUX Dashboard

The CrUX Dashboard is built with a Looker Studio feature called [Community Connectors](https://developers.google.com/looker-studio/connector). This connector is a pre-established link between the raw CrUX data on [BigQuery](https://console.cloud.google.com/bigquery?p=chrome-ux-report) and the visualizations of Looker Studio. It eliminates the need for users of the dashboard to write any queries or generate any charts. Everything is built for you; all you need is to provide an origin and a custom dashboard will be generated for you.

## The default CrUX dashboard

CrUX has a [default dashboard](https://developer.chrome.com/docs/crux/dashboard.md.txt), which is maintained by the CrUX team. New metrics (for example [INP](https://web.dev/articles/inp)) are added by the team and available the next time the dashboard is loaded.

> [!TIP]
> **Tip:** The default dashboard is recommended as a quick, no maintenance way of visualizing a site's CrUX data.

## Create a custom dashboard

Some users may want to customize the dashboard, in which case you can create your own copy of the default dashboard and change it as you see fit.

> [!IMPORTANT]
> **Important:** Dashboards are maintained by the creators. Any updates to the default dashboard won't be reflected in any custom dashboards that you create.

To create a custom dashboard, go to [g.co/chromeuxdash](https://g.co/chromeuxdash). This will take you to the CrUX community connector page where you can provide the origin for which the dashboard will be generated. Note that first-time users may need to complete permission or marketing preference prompts.

> [!WARNING]
> **Warning:** The CrUX cummunity connector is [being deprecated](https://developer.chrome.com/blog/crux-dashboard-deprecation.md.txt). Those wishing to create their own dashboards using thre CrUX BigQuery data will need to use a BigQuery Custom Query connector. See the example in the previous link.

The CrUX Dashboard connector

The text input field only accepts origins, not full URLs. For example:
Origin (Supported)

```text
https://developer.chrome.com
```

URL (Not supported)

```text
https://developer.chrome.com/docs/crux/guides/looker-studio-dashboard
```

If you omit the protocol, HTTPS is assumed. Subdomains matter, for example `https://developers.google.com` and `https://www.google.com` are considered to be different origins.

Some common issues with origins are providing the wrong protocol, for example `http://` instead of `https://`, and omitting the subdomain when needed. Some websites include redirects, so if `http://example.com` redirects to `https://www.example.com`, then you should use the latter, which is the canonical version of the origin. As a rule of thumb, use whichever origin users see in the address bar.

By ticking checkbox, the origin will be included in the dashboard URL, which allows the same dashboard to be used for different origins by changing this URL parameter in the future so it is recommended to tick that.

Click the **Connect** button. If you ticked the checkbox, you will be asked to confirm this.

If your origin is not included in the CrUX dataset, you may get an error message like the one shown in the next diagram. There are over 15 million origins in the dataset, but the one you want [may not have sufficient data](https://developer.chrome.com/docs/crux/methodology.md.txt#eligibility) to be included.
CrUX community connector error message when an origin does not exist

If the origin exists, you'll be taken to the schema page for the dashboard. This shows you all of the fields that are included: each effective connection type, each form factor, the month of the dataset release, the distribution of performance for each metric, and of course the name of the origin. There's nothing you need to do or change on this page, just click **Create Report** to continue.
CrUX Dashboard schema

## Use the dashboard

Each dashboard comes with three types of pages:

1. Core Web Vitals overview
2. Metric performance
3. User demographics

Each page includes a chart showing distributions over time for each available monthly release. As new datasets are released, you can refresh the dashboard to get the latest data.

The monthly datasets are released on the second Tuesday of every month. For example, the dataset consisting of user experience data from the month of May is released on the second Tuesday of June.

### Core Web Vitals overview

The first page is an overview of the origin's monthly [Core Web Vitals](https://web.dev/articles/vitals) performance. These are the most important UX metrics that Google recommends you focus on.
CrUX Dashboard Core Web Vitals overview

Use the Core Web Vitals page to understand how the origin is experienced by desktop and phone users. By default, the most recent month at the time you created the dashboard is selected. To change between older or newer monthly releases, use the **Month** filter at the top of the page.

Note that tablet is omitted from these charts by default, but if needed you could remove the **No Tablet** filter in the bar chart configuration:
Editing the CrUX Dashboard to show tablets on the Core Web Vitals page

### Metric performance

After the Core Web Vitals page, you'll find standalone pages for all [metrics](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt) in the CrUX dataset.
CrUX Dashboard LCP page

Atop each page is the **Device** filter, which you can use to restrict the form factors included in the experience data. For example, you can drill down specifically into phone experiences. This setting persists across pages.

The primary visualizations on these pages are the monthly distributions of experiences categorized as "Good", "Needs Improvement", and "Poor". The color-coded legend below the chart indicates the range of experiences included in the category. For example, in the previous screenshot, you can see the percent of "good" [Largest Contentful Paint](https://web.dev/articles/lcp#what_is_a_good_lcp_score) (LCP) experiences fluctuating and getting slightly worse in recent months.

The most recent month's percentages of "good" and "poor" experiences are shown above the chart along with an indicator of the percent difference from the previous month. For this origin, "good" LCP experiences fell by 3.2% to 56.04% month-over-month.

Additionally, for metrics like LCP and other Core Web Vitals that provide explicit percentile recommendations, you'll find the "P75" metric between the "good" and "poor" percentages. This value corresponds to the origin's 75th percentile of user experiences. In other words, 75% of experiences are better than this value. One thing to note is that this applies to the overall distribution across _all devices_ on the origin. Toggling specific devices with the **Device** filter won't recalculate the percentile.

### Technical caveats about percentiles

Be aware that the percentile metrics are based on the histogram data from [BigQuery](https://developer.chrome.com/docs/crux/guides/bigquery.md.txt), so the granularity will be coarse: 100ms for LCP, 25ms for INP, and 0.05 for CLS. In other words, a P75 LCP of 3800ms indicates that the true 75th percentile is somewhere between 3800ms and 3900ms.

Additionally, the BigQuery dataset uses a technique called "bin spreading" in which densities of user experiences are intrinsically grouped into very coarse bins of decreasing granularity. This allows us to include minute densities in the tail of the distribution without having to exceed four digits of precision. For example, LCP values less than 3 seconds are grouped into bins 200ms wide. Between 3 and 10 seconds, bins are 500ms wide. Beyond 10 seconds, bins are 5000ms wide... Rather than having bins of varying widths, bin spreading ensures that all bins are a constant 100ms wide (the greatest common divisor), and the distribution is linearly interpolated across each bin.

Corresponding P75 values in tools like PageSpeed Insights are not based on the public BigQuery dataset and are able to provide millisecond-precision values.

### User demographics

There are two [dimensions](https://developer.chrome.com/docs/crux/methodology/dimensions.md.txt) included on the user demographic pages: devices and effective connection types (ECTs). These pages illustrate the distribution of page views across the entire origin for users in each demographic.

The device distribution page shows you the breakdown of phone, desktop, and tablet users over time. Many origins tend to have little to no tablet data so you'll often see "0%" hanging off the edge of the chart.
CrUX Dashboard device page

Similarly, the ECT distribution page shows you the breakdown of 4G, 3G, 2G, slow 2G, and offline experiences.

> [!IMPORTANT]
> **Key term:** Effective connection types are considered _effective_ because they're based on bandwidth measurements on users' devices, and don't imply any particular technology used. For example, a desktop user on fast Wi-Fi may be labelled as 4G while a slower mobile connection might be labelled as 2G.

The distributions for these dimensions are calculated using segments of the
[First Contentful Paint](https://web.dev/articles/fcp) (FCP) histogram data.

## FAQ

These are some of the frequently asked questions about building CrUX dashboards on Looker Studio:

### When would I use the CrUX Dashboard as opposed to other tools?

The CrUX Dashboard is based on the same underlying data available on BigQuery, but you don't need to write a single line of SQL to extract the data and you don't ever have to worry about exceeding any free quotas. Setting up a dashboard is quicker and easier than viewing querying the underling data, all of the visualizations are generated for you, and you have the control to share it with anyone you want.

### Are there any limitations to using the CrUX Dashboard?

Being based on BigQuery means that the CrUX Dashboard inherits all of its limitations as well. It is restricted to origin-level data at monthly granularity.

The CrUX Dashboard also trades away some of the versatility of the raw data on BigQuery for simplicity and convenience. For example, metric distributions are only given as "good", "needs improvement", and "poor", as opposed to the full histograms. The CrUX Dashboard also provides data at a global level, while the BigQuery dataset lets you zoom in on particular countries.

### Where can I learn more about Looker Studio?

Check out the [Looker Studio features page](https://cloud.google.com/looker-studio#section-2) for more info.
