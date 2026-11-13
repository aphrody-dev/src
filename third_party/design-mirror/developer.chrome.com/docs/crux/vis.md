---
source_url: https://developer.chrome.com/docs/crux/vis
fetched: 2026-11-13
lastmod: 2026-09-15T16:04:03+00:00
sha256: 3c9b187bf32105acf1aef22ad5e3fdb71ada8046e24c0072d95fe35769d9ba1c
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

CrUX Vis is a dashboard that visualizes the weekly historical data from the [CrUX History API](https://developer.chrome.com/docs/crux/history-api).

## Access CrUX Vis

To launch CrUX Vis, visit [cruxvis.withgoogle.com](https://cruxvis.withgoogle.com), or enter an origin or URL, and press <kbd>enter</kbd> or click **Go**:
<iframe src="https:///frame/docs/crux/vis/index_23045f1ed0c07ff8e0dd1f9a75915143d676bff50837fb648c62466ae287f274.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded title="Form to generate a URL to CrUX Vis for your domain"></iframe>

> [!NOTE]
> **Note:** If the protocol (`http` or `https`) is not provided, then `https` will be assumed.

The CrUX Vis URL can then be shared and bookmarked for quick reference.

## Does it work for all websites?

No. If your origin is not included in the CrUX dataset, there will be no data to display. There are over 15 million origins in the dataset, but the one you want may not have sufficient data to be included.

Some common issues with origins are providing the wrong protocol, for example `http://` instead of `https://`, and omitting the subdomain when needed. Some websites include redirects, so if `http://example.com` redirects to `https://www.example.com`, then you should use the latter, which is the canonical version of the origin.

Similarly, URL-level data may not be available even when origin-level data is available.

## CrUX Vis overview

CrUX Vis has 6 pages:

1. Core Web Vitals
2. Loading Performance
3. Interactivity
4. Visual Stability
5. Ad Metrics
6. All Metrics

Each page includes a chart showing distributions over time for the past 40 weeks (where daya is available).

The weekly data is updated every Monday and each data point includes the previous 28-days worth of data. This means the data is overlapping.

### Controls

Each page has a **Controls** section which lets you switch:

- Date: Origin and URL-level data
- Device: Phone, Desktop, Tablet, or all Data
- Time periods
- Display: 75th percentile, distributions, or both

Controls section of the CrUX Vis.

### Core Web Vitals

The first page is an overview of the URL or origin's [Core Web Vitals](https://web.dev/articles/vitals) performance. These are the most important UX metrics that Google recommends you focus on.
Core Web Vitals page of CrUX Vis.

Use the Core Web Vitals page to understand how the URL or origin is experienced by users and which metrics need work, either because they are under recommended limits, or because they are regressing.

The page includes links to the next three sections to explore further.

### Loading Performance

The Loading Performance pages includes all loading-related metrics in CrUX History API.
Loading Performance page of CrUX Vis.

This page includes the following metrics:

- [Largest Contentful Paint (LCP)](https://developer.chrome.com/docs/crux/methodology/metrics#lcp-metric)
- [First Contentful Paint (FCP)](https://developer.chrome.com/docs/crux/methodology/metrics#fcp-metric)
- [Time to First Byte (TTFB)](https://developer.chrome.com/docs/crux/methodology/metrics#ttfb-metric)
- [Largest Contentful Paint (LCP) resource type](https://developer.chrome.com/docs/crux/methodology/metrics#lcp-resource-type)
- [Largest Contentful Paint (LCP) image subparts](https://developer.chrome.com/docs/crux/methodology/metrics#lcp-image-subparts)
- [Round Trip Time (RTT)](https://developer.chrome.com/docs/crux/methodology/metrics#round-trip-time-metric)
- [Navigation types](https://developer.chrome.com/docs/crux/methodology/metrics#navigation-types)
- [Form Factors](https://developer.chrome.com/docs/crux/methodology/dimensions#form-factor-dimension)

### Interactivity

The Interactivity page includes all interactivity-related metrics in CrUX History API.
Interactivity page of CrUX Vis.

This page includes the following metrics:

- [Interaction to Next Paint (INP)](https://developer.chrome.com/docs/crux/methodology/metrics#inp-metric)
- [Form Factors](https://developer.chrome.com/docs/crux/methodology/dimensions#form-factor-dimension)

### Visual Stability

The Visual Stability page includes all visual stability-related metrics in CrUX History API.
Visual Stability page of CrUX Vis.

This page includes the following metrics:

- [Cumulative Layout Shift (CLS)](https://developer.chrome.com/docs/crux/methodology/metrics#cls-metric)
- [Form Factors](https://developer.chrome.com/docs/crux/methodology/dimensions#form-factor-dimension)

### Ad Metrics

The Ad Metrics page includes all ad-related metrics in CrUX History API.
Ad metrics page of CrUX Vis.

This page includes the following metrics:

- [Ad Count](https://developer.chrome.com/docs/ads/metrics/count)
- [Ad Density](https://developer.chrome.com/docs/ads/metrics/density)
- [Ad Weight: CPU](https://developer.chrome.com/docs/ads/metrics/weight-cpu)
- [Ad Weight: Network](https://developer.chrome.com/docs/ads/metrics/weight-network)

For more information about ad metrics, see [ad metrics documentation](https://developer.chrome.com/docs/ads/metrics).

### All Metrics

The All Metrics page includes all metrics in CrUX History API in one place:
All Metrics page of CrUX Vis.

This page includes the following metrics:

- [Largest Contentful Paint (LCP)](https://developer.chrome.com/docs/crux/methodology/metrics#lcp-metric)
- [Interaction to Next Paint (INP)](https://developer.chrome.com/docs/crux/methodology/metrics#inp-metric)
- [Cumulative Layout Shift (CLS)](https://developer.chrome.com/docs/crux/methodology/metrics#cls-metric)
- [First Contentful Paint (FCP)](https://developer.chrome.com/docs/crux/methodology/metrics#fcp-metric)
- [Time to First Byte (TTFB)](https://developer.chrome.com/docs/crux/methodology/metrics#ttfb-metric)
- [Largest Contentful Paint (LCP) resource type](https://developer.chrome.com/docs/crux/methodology/metrics#lcp-resource-type)
- [Largest Contentful Paint (LCP) image subparts](https://developer.chrome.com/docs/crux/methodology/metrics#lcp-image-subparts)
- [Round Trip Time (RTT)](https://developer.chrome.com/docs/crux/methodology/metrics#round-trip-time-metric)
- [Navigation types](https://developer.chrome.com/docs/crux/methodology/metrics#navigation-types)
- [Form Factors](https://developer.chrome.com/docs/crux/methodology/dimensions#form-factor-dimension)
- [Ad Count](https://developer.chrome.com/docs/ads/metrics/count)
- [Ad Density](https://developer.chrome.com/docs/ads/metrics/density)
- [Ad Weight: CPU](https://developer.chrome.com/docs/ads/metrics/weight-cpu)
- [Ad Weight: Network](https://developer.chrome.com/docs/ads/metrics/weight-network)

## FAQ

These are some of the frequently asked questions about the CrUX Vis:

### When would I use the CrUX Vis as opposed to other tools?

CrUX Vis is for viewing historical data over time. Other tools such as PageSpeed Insights may only show the latest data.

See also [CrUX Tools](https://developer.chrome.com/docs/crux/methodology/tools).

### How can I get the data that CrUX Vis displays?

All data in CrUX Vis comes from the [CrUX History API](https://developer.chrome.com/docs/crux/history-api) which can be queried using a [CrUX API key](https://developer.chrome.com/docs/crux/history-api#crux_api_key).

### How can I customize CrUX Vis?

CrUX Vis does not offer customization options, beyond the [controls](https://developer.chrome.com/docs/crux/vis#controls). Users wishing to build a custom dashboard can use the [CrUX History API](https://developer.chrome.com/docs/crux/history-api) that powers CrUX Vis to display the data as they want. Many third-party tools exist which provide alternative visualizations of this data.
