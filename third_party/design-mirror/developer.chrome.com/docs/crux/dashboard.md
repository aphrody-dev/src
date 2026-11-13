---
source_url: https://developer.chrome.com/docs/crux/dashboard
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:15+00:00
sha256: 3e37ced3d2840c1a005b05037a9fc8dad06fa43be014ad659cedd097e8514ecd
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Published: Nov 10, 2022, Last updated: Sep 9, 2025

The CrUX Dashboard is a [Looker Studio](https://cloud.google.com/looker-studio) (formerly Data Studio) dashboard that links to the raw origin-level CrUX data on [BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt) and then visualizes the data for you. It eliminates the need for users of the dashboard to write any queries or generate any charts. Everything is built for you; all you need is to provide an origin and the dashboard will be generated for you.

> [!WARNING]
> **Warning:** The CrUX Dashboard is [now deprecated](https://developer.chrome.com/blog/crux-dashboard-deprecation.md.txt). Consider using [CrUX Vis](https://developer.chrome.com/docs/crux/vis.md.txt)---a newer dashboard, based on the [CrUX History API](https://developer.chrome.com/docs/crux/history-api.md.txt) which has many advantages over the CrUX Dashboard: quicker load times, weekly updates instead of monthly updates, both origin and URL-level data where available, and additional metrics not available in the dashboard. Try it out!

## Access the CrUX Dashboard

To launch the CrUX Dashboard, enter an origin or URL, and press <kbd>enter</kbd> or click **Go**:
<iframe src="https:///frame/docs/crux/dashboard/index_170883987d4084132b31441da13a1549cdc28092e6c255ee9c515ed3ab983c76.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded title="Form to generate a URL to a CrUX dashboard for your domain"></iframe>

> [!NOTE]
> **Note:** If the protocol (`http` or `https`) is not provided, then `https` will be assumed. Paths will be stripped as the CrUX Dashboard only provides data at an origins level.

The dashboard URL can then be shared and bookmarked for quick reference.

## Does it work for all websites?

No. If your origin is not included in the CrUX dataset, there will be no data to display. There are over 15 million origins in the dataset, but the one you want may not have sufficient data to be included.

Some common issues with origins are providing the wrong protocol, for example `http://` instead of `https://`, and omitting the subdomain when needed. Some websites include redirects, so if `http://example.com` redirects to `https://www.example.com`, then you should use the latter, which is the canonical version of the origin.

## Use a Custom Search Engine to access the Dashboard

An alternative way, for those frequently visiting different domains, is to set up a custom Search Engine in Chrome which Lets you pass a search term---the origin in this case---to a URL. To do this go into Chrome Settings using the three dots menu in the top right of Chrome. Once in Settings choose the "Search engine" option.
 Chrome settings for Search Engines.

From here expand the "Manage search engines and site search", scroll to "Site Search" click the "Add" button and enter the following details:

- Search engine: `CrUX`
- Shortcut: `crux`
- URL with %s in place of query: `https://lookerstudio.google.com/c/u/0/reporting/bbc5698d-57bb-4969-9e07-68810b9fa348/page/keDQB?params=%7B%22origin%22:%22%s%22%7D`

 Chrome 'Add search engine' dialog.

After this, when you type `crux` and press `tab` in the search bar you will now be able to enter an origin, and Chrome will navigate to the CrUX Dashboard for that origin.
 Using a custom search engine in Chrome address bar.

If you omit the protocol, HTTPS is assumed. Subdomains matter, for example `https://developers.google.com` and `https://www.google.com` are considered to be different origins.

If the origin exists in CrUX, you'll be taken to the dashboard, populated with the CrUX data for this origin:
 Example CrUX Dashboard.

## Dashboard overview

Each dashboard comes with three types of pages:

1. Core Web Vitals overview
2. Metric performance
3. User demographics

Each page includes a chart showing distributions over time for each available monthly release. As new datasets are released, you can refresh the dashboard to get the latest data.

The monthly datasets are released on the second Tuesday of every month. For example, the dataset consisting of user experience data from the month of May is released on the second Tuesday of June.

### Core Web Vitals overview

The first page is an overview of the origin's monthly [Core Web Vitals](https://web.dev/articles/vitals) performance. These are the most important UX metrics that Google recommends you focus on.
 CrUX Dashboard Core Web Vitals overview.

Use the Core Web Vitals page to understand how the origin is experienced by desktop and phone users. By default, the most recent month at the time you created the dashboard is selected. To change between older or newer monthly releases, use the **Month** filter at the top of the page.

### Metric performance

After the Core Web Vitals page, you'll find standalone pages for all [metrics](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt) in the CrUX dataset.
 CrUX Dashboard LCP page.

Atop each page is the **Device** filter, which you can use to restrict the form factors included in the experience data. For example, you can drill down specifically into phone experiences. This setting persists across pages.

The primary visualizations on these pages are the monthly distributions of experiences categorized as "Good", "Needs Improvement", and "Poor". The color-coded legend below the chart indicates the range of experiences included in the category. For example, in the previous screenshot, you can see the percent of "good" [Largest Contentful Paint](https://web.dev/articles/lcp#what_is_a_good_lcp_score) (LCP) experiences fluctuating slightly and getting slightly worse in recent months.

The most recent month's percentages of "good" and "poor" experiences are shown above the chart along with an indicator of the percent difference from the previous month. For this origin, "good" LCP experiences fell by 0.8% to 83.25% month-over-month, the p75 number had 0 movement and stayed at 1,500 month-over-month, and the "poor" LCP experiences increased by 3.6% (shown in red as an increase here is bad) to 7.42%. Note the percentage movements are actual percentage movements, and not percentage point movements---for example 83.93% to 83.25% is a 0.68 percentage point movement, or 0.8% decrease of the 83.93% previous total.

Additionally, for metrics like LCP and other Core Web Vitals that provide explicit percentile recommendations, you'll find the "P75" metric between the "good" and "poor" percentages. This value corresponds to the origin's 75th percentile of user experiences. In other words, 75% of experiences are better than this value. One thing to note is that this applies to the overall distribution across *all devices* on the origin. Toggling specific devices with the **Device** filter won't recalculate the percentile.

#### Technical caveats about percentiles

Be aware that the percentile metrics are based on the histogram data from [BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt), so the granularity will be coarse: 100ms for LCP, 25ms for INP, and 0.05 for CLS. In other words, a P75 LCP of 3800ms indicates that the true 75th percentile is somewhere between 3800ms and 3900ms.

Additionally, the BigQuery dataset uses a technique called "bin spreading" in which densities of user experiences are intrinsically grouped into very coarse bins of decreasing granularity. This allows us to include minute densities in the tail of the distribution without having to exceed four digits of precision. For example, LCP values less than 3 seconds are grouped into bins 200ms wide. Between 3 and 10 seconds, bins are 500ms wide. Beyond 10 seconds, bins are 5000ms wide... Rather than having bins of varying widths, bin spreading ensures that all bins are a constant 100ms wide (the greatest common divisor), and the distribution is linearly interpolated across each bin.

Corresponding P75 values in tools like PageSpeed Insights are not based on the public BigQuery dataset and are able to provide millisecond-precision values.

### User demographics

There are two [dimensions](https://developer.chrome.com/docs/crux/methodology/dimensions.md.txt) included on the user demographic pages: devices and effective connection types (ECTs). These pages illustrate the distribution of page views across the entire origin for users in each demographic.

The device distribution page shows you the breakdown of phone, desktop, and tablet users over time:
 CrUX Dashboard device page.

Many origins tend to have little to no tablet data so you'll often see "0%" hanging off the edge of the chart.

Similarly, the ECT distribution page shows you the breakdown of 4G, 3G, 2G, slow 2G, and offline experiences.

> [!IMPORTANT]
> **Key term:** Effective connection types are considered *effective* because they're based on bandwidth measurements on users' devices, and don't imply any particular technology used. For example, a desktop user on fast Wi-Fi may be labelled as 4G while a slower mobile connection might be labelled as 2G.

The distributions for these dimensions are calculated using segments of the [First Contentful Paint](https://web.dev/articles/fcp) (FCP) histogram data.

## FAQ

These are some of the frequently asked questions about the CrUX BigQuery dataset:

### When would I use the CrUX Dashboard as opposed to other tools?

The CrUX Dashboard is based on the same underlying data available on BigQuery, but you don't need to write a single line of SQL to extract the data and you don't ever have to worry about exceeding any free quotas. Setting up a dashboard is quick, all of the visualizations are generated for you, and you have the control to share it with anyone you want.

### Are there any limitations to using the CrUX Dashboard?

Being based on BigQuery means that the CrUX Dashboard inherits all of its limitations as well. It is restricted to origin-level data at monthly granularity.

The CrUX Dashboard also trades away some of the versatility of the raw data on BigQuery for simplicity and convenience. For example, metric distributions are only given as "good", "needs improvement", and "poor", as opposed to the full histograms. The CrUX Dashboard also provides data at a global level, while the BigQuery dataset lets you zoom in on particular countries.

### How can I customize the dashboard

The page details how to access a read-only version of the CrUX Dashboard maintained by the CrUX team. If you want to create your own copy of the dashboard, so you can edit it to show different visualizations, then [see this user guide](https://developer.chrome.com/docs/crux/guides/looker-studio-dashboard.md.txt) for more info. Note that by creating you own copy, you will need to update the month manually and also won't benefit from any additions added to the official dashboard---for example new metrics, or other information.
