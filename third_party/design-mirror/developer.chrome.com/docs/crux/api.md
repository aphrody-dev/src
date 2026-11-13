---
source_url: https://developer.chrome.com/docs/crux/api
fetched: 2026-11-13
lastmod: 2026-11-11T15:44:10+00:00
sha256: 392b3c16bf3c8f34e3493729062e40980c8297bc5ff6bd3ed9e4c08e6f125d8b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
The CrUX API gives low-latency access to aggregated real-user experience data at page and origin granularity.

[Try it!](https://developer.chrome.com/docs/crux/api.md.txt#try-it)

## Common use case

The CrUX API allows for the querying of user experience metrics for a specific URI like "Get metrics for the `https://example.com` origin."

## CrUX API Key

Using the CrUX API requires a Google Cloud API key provisioned for `Chrome UX Report API` usage.

### Acquiring and using an API key

Get a Key

Or create one in the [Credentials page](https://console.cloud.google.com/apis/credentials).

After you have an API key, your application can append the query parameter
`key=yourAPIKey` to all request URLs.

The API key is safe for embedding in URLs; it doesn't need any encoding.

See [Example queries](https://developer.chrome.com/docs/crux/api.md.txt#example_queries).

## Data model

This section details the structure of data in requests and responses.

### Record

A discrete piece of information about a page, or site. A record can have data that is specific for an identifier and for a specific combination of dimensions. A record can contain data for one or more metrics.

### Identifiers

Identifiers specify what records should be looked up. In CrUX these identifiers are webpages and websites.

### Origin

When the identifier is an origin all data present for all pages in that origin are aggregated together. For example, say the `http://www.example.com` origin had pages as laid out by this sitemap:

```text
http://www.example.com/
http://www.example.com/foo.html
http://www.example.com/bar.html
```

This would mean that when querying the Chrome UX Report with the origin set to `http://www.example.com`, data for `http://www.example.com/`, `http://www.example.com/foo.html`, and `http://www.example.com/bar.html` would be returned, aggregated together, because those are all pages under that origin.

### URLs

When the identifier is a URL, only data for that specific URL will be returned. Looking again to the `http://www.example.com` origin sitemap:

```text
http://www.example.com/
http://www.example.com/foo.html
http://www.example.com/bar.html
```

If the identifier is set to URL with the value of `http://www.example.com/foo.html`, only data for that page will be returned.

### Dimensions

Dimensions identify a specific group of data that a record is being aggregated against, for example a form factor of `PHONE` indicates that the record contains information about loads that took place on a mobile device. Each dimension will have a certain number of values, and implicitly the lack of specifying that dimension will mean that the dimension is aggregated over all values. For example, specifying no form factor indicates that record contains information about loads that took place on any form factor.

#### Form Factor

The device class that the end-user used to navigate to the page. This is a general class of device split into `PHONE`, `TABLET`, and `DESKTOP`.

### Metric

We report metrics as statistical aggregations, in histograms, percentiles, and fractions.

Floating point values are rounded to 4 decimal places (note that the `cumulative_layout_shift` metrics are doubles encoded as a string, so are not consider floats and are reported to 2 decimal places within the string).

#### Histogram

When metrics are expressed in a histogram, we show the percentages of page loads falling into
particular ranges for that metric.

A three bin histogram for an example metric looks like this:

```json
{
  "histogram": [
    {
      "start": 0,
      "end": 1000,
      "density": 0.3818
    },
    {
      "start": 1000,
      "end": 3000,
      "density": 0.4991
    },
    {
      "start": 3000,
      "density": 0.1192
    }
  ]
}
```

This data indicates that for 38.18% of page loads, the example metric was measured
between 0ms and 1,000ms. The units of the metric are not contained in this histogram,
in this case we will assume milliseconds.

Additionally, 49.91% of page loads saw a metric value between 1,000ms and 3,000ms, and 11.92%
saw a value greater than 3,000ms.

#### Percentiles

Metrics may also contain percentiles that can be useful for additional analysis.
We report specific metric values at the given percentile for that metric.
They are based on the full set of available data and not the final binned data,
so they don't necessarily match an interpolated percentile that is based on the
final binned histogram.

```json
{
  "percentiles": {
    "p75": 2063
  }
}
```

In this example, at least 75% of page loads were measured with a metric value `<= 2063`.

> [!NOTE]
> **Note:** The values for each percentile are synthetically derived, it does not imply that any user actually experienced the value indicated, only that some percentage of page loads experienced a metric value that was less than the value given.

#### Fractions

Fractions indicate the percentages of page loads that can be labeled in a particular way.
In this case, the metric values are these labels.

For example, the `form_factors` metric consists of a `fractions` object listing the breakdown of form factors (or devices) that the given query covers:

```json
"form_factors": {
  "fractions": {
    "desktop": 0.0377,
    "tablet": 0.0288,
    "phone": 0.9335
  }
}
```

In this case, 3.77% of page loads were measured on a desktop, 2.88% on a tablet, and 93.35% on a phone, giving 100% in total.

#### Metric value types

| CrUX API Metric Name | Data Type | Metric Units | Statistical Aggregations | Documentation |
|---|---|---|---|---|
| `cumulative_layout_shift` | 2 decimal place double encoded as string | unitless | histogram with three bins, percentiles with p75 | [CLS](https://web.dev/articles/cls) |
| `interaction_to_next_paint` | int | milliseconds | histogram with three bins, percentiles with p75 | [INP](https://web.dev/articles/inp) |
| `largest_contentful_paint` | int | milliseconds | histogram with three bins, percentiles with p75 | [LCP](https://web.dev/articles/lcp) |
| `experimental_cumulative_layout_shift_with_softnavs` | 2 decimal place double encoded as string | unitless | histogram with three bins, percentiles with p75 | [Blog](https://web.dev/blog/crux-experimental-soft-navs/) |
| `experimental_interaction_to_next_paint_with_softnavs` | int | milliseconds | histogram with three bins, percentiles with p75 | [Blog](https://web.dev/blog/crux-experimental-soft-navs/) |
| `experimental_largest_contentful_paint_with_softnavs` | int | milliseconds | histogram with three bins, percentiles with p75 | [Blog](https://web.dev/blog/crux-experimental-soft-navs/) |
| `first_contentful_paint` | int | milliseconds | histogram with three bins, percentiles with p75 | [FCP](https://web.dev/articles/fcp) |
| `experimental_first_contentful_paint_with_softnavs` | int | milliseconds | histogram with three bins, percentiles with p75 | [Blog](https://web.dev/blog/crux-experimental-soft-navs/) |
| `experimental_time_to_first_byte` | int | milliseconds | histogram with three bins, percentiles with p75 | [TTFB](https://web.dev/articles/ttfb) |
| `form_factors` | 4-decimal place double | percent | mapping from form factor to fraction | [Form Factors](https://developer.chrome.com/docs/crux/api.md.txt#form-factors-metric) |
| `navigation_types` | 4-decimal place double | percent | mapping from navigation type to fraction | [Navigation Types](https://developer.chrome.com/blog/crux-navigation-types.md.txt) |
| `experimental_navigation_types_with_softnavs` | 4-decimal place double | percent | mapping from navigation type to fraction | [Blog](https://web.dev/blog/crux-experimental-soft-navs/) |
| `round_trip_time` | int | milliseconds | histogram with three bins, percentiles with p75 | [RTT metric](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt#round-trip-time-metric) |
| `largest_contentful_paint_resource_type` | 4-decimal place double | percent | mapping from navigation type to fraction | [LCP resource types](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt#lcp-resource-type) |
| `largest_contentful_paint_image_time_to_first_byte` | int | milliseconds | percentiles with p75 | [LCP subparts](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt#lcp-image-subparts) |
| `largest_contentful_paint_image_resource_load_delay` | int | milliseconds | percentiles with p75 | [LCP subparts](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt#lcp-image-subparts) |
| `largest_contentful_paint_image_resource_load_duration` | int | milliseconds | percentiles with p75 | [LCP subparts](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt#lcp-image-subparts) |
| `largest_contentful_paint_image_element_render_delay` | int | milliseconds | percentiles with p75 | [LCP subparts](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt#lcp-image-subparts) |
| `experimental_ad_count` | 2-decimal place double | unitless | p75 only | [Ad Count](https://developer.chrome.com/docs/ads/metrics/count.md.txt) |
| `experimental_ad_density` | 2-decimal place double | unitless | p75 only | [Ad Density](https://developer.chrome.com/docs/ads/metrics/density.md.txt) |
| `experimental_ad_cpu` | int | milliseconds | p75 only | [Ad Weight: CPU](https://developer.chrome.com/docs/ads/metrics/weight-cpu.md.txt) |
| `experimental_ad_kilobytes` | int | KB | p75 only | [Ad Weight: Network](https://developer.chrome.com/docs/ads/metrics/weight-network.md.txt) |

#### BigQuery metric name mapping

| CrUX API Metric Name | BigQuery Metric Name |
|---|---|
| `cumulative_layout_shift` | `layout_instability.cumulative_layout_shift` |
| `first_contentful_paint` | `first_contentful_paint` |
| `interaction_to_next_paint` | `interaction_to_next_paint` |
| `largest_contentful_paint` | `largest_contentful_paint` |
| `experimental_time_to_first_byte` | `experimental.time_to_first_byte` |
| `experimental_cumulative_layout_shift_with_softnavs` | `experimental.cumulative_layout_shift_with_softnavs` |
| `experimental_first_contentful_paint_with_softnavs` | `n/a` |
| `experimental_interaction_to_next_paint_with_softnavs` | `experimental.interaction_to_next_paint_with_softnavs` |
| `experimental_largest_contentful_paint_with_softnavs` | `experimental.largest_contentful_paint_with_softnavs` |
| `navigation_types` | `navigation_types` |
| `experimental_navigation_types_with_softnavs` | `n/a` |
| `form_factors` | n/a |
| `round_trip_time` | `round_trip_time` |
| `largest_contentful_paint_resource_type` | n/a |
| `largest_contentful_paint_image_time_to_first_byte` | n/a |
| `largest_contentful_paint_image_resource_load_delay` | n/a |
| `largest_contentful_paint_image_resource_load_duration` | n/a |
| `largest_contentful_paint_image_element_render_delay` | n/a |
| `experimental_ad_count` | `n/a` |
| `experimental_ad_density` | `n/a` |
| `experimental_ad_cpu` | `n/a` |
| `experimental_ad_kilobytes` | `n/a` |

> [!NOTE]
> **Note:** In [CrUX BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt), the histogram densities add up to 100% per origin across form factors, so the `form_factors` metric that we support in the API is instead expressed as the histogram densities for `first_contentful_paint`.

### Collection period

As of October 2022, the CrUX API contains a `collectionPeriod` object with `firstDate` and `endDate` fields representing the beginning and end dates of the aggregation window. For example:

```json
    "collectionPeriod": {
      "firstDate": {
        "year": 2022,
        "month": 9,
        "day": 12
      },
      "lastDate": {
        "year": 2022,
        "month": 10,
        "day": 9
      }
    }
```

This allows better understanding of the data and whether it's been updated yet for that day or is returning the same data as yesterday.

> [!NOTE]
> **Note:** The CrUX API is approximately two days behind today's date since it waits for completed data for the day, and there is some processing time involved before it is available in the API. The timezone used is Pacific Standard Time (PST) with no changes for daylight savings.

The collection period is also available in PageSpeed Insights:
 Collection period dates in PageSpeed Insights.

Additionally, the `collectionPeriod` will always show 28-days, even if the data is not for the full 28 days (for example if a page was launched less than 28 days ago). The `collectionPeriod` is the period of time that the CrUX data was aggregated over, not necessarily the period of time that the data represents.

## Example queries

Queries are submitted as JSON objects using a POST request to `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=[YOUR_API_KEY]"` with query data as a JSON object in the POST body:

```json
{
  "origin": "https://example.com",
  "formFactor": "PHONE",
  "metrics": [
    "largest_contentful_paint",
    "experimental_time_to_first_byte"
  ]
}
```

For example, this can be called from `curl` with the following command line (replacing `API_KEY` with your key):

```bash
curl -s --request POST 'https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=API_KEY' \
    --header 'Accept: application/json' \
    --header 'Content-Type: application/json' \
    --data '{"formFactor":"PHONE","origin":"https://www.example.com","metrics":["largest_contentful_paint", "experimental_time_to_first_byte"]}'
```

> [!NOTE]
> **Note:** The previous example is for macOS or Linux based systems---including the Git BASH shell for Windows. Other systems may require slight modifications. For example, the `cmd.exe` command line does not allow single quotes for parameters, nor the line continuations (`\`), so requires using double quotes (escaping inner quotes as appropriate with `\"`), and also using a single line.

Page-level data is available through the API by passing a `url` property in the query, instead of `origin`:

```json
{
  "url": "https://example.com/page",
  "formFactor": "PHONE",
  "metrics": [
    "largest_contentful_paint",
    "experimental_time_to_first_byte"
  ]
}
```

If the `metrics` property is not set then all available metrics will be returned:

- `cumulative_layout_shift`
- `first_contentful_paint`
- `interaction_to_next_paint`
- `largest_contentful_paint`
- `experimental_cumulative_layout_shift_with_softnavs`
- `experimental_first_contentful_paint_with_softnavs`
- `experimental_interaction_to_next_paint_with_softnavs`
- `experimental_largest_contentful_paint_with_softnavs`
- `experimental_navigation_types_with_softnavs`
- `experimental_time_to_first_byte`
- `largest_contentful_paint_resource_type`
- `largest_contentful_paint_image_time_to_first_byte`
- `largest_contentful_paint_image_resource_load_delay`
- `largest_contentful_paint_image_resource_load_duration`
- `largest_contentful_paint_image_element_render_delay`
- `navigation_types`
- `round_trip_time`
- `form_factors` (only reported if no `formFactor` is specified in the request)
- `experimental_ad_count` (only reported for [pages included in ad metrics](https://developer.chrome.com/docs/ads/methodology.md.txt#ad-metrics-eligibility))
- `experimental_ad_density` (only reported for [pages included in ad metrics](https://developer.chrome.com/docs/ads/methodology.md.txt#ad-metrics-eligibility))
- `experimental_ad_cpu` (only reported for [pages included in ad metrics](https://developer.chrome.com/docs/ads/methodology.md.txt#ad-metrics-eligibility))
- `experimental_ad_kilobytes` (only reported for [pages included in ad metrics](https://developer.chrome.com/docs/ads/methodology.md.txt#ad-metrics-eligibility))

If no `formFactor` value is provided then the values will be aggregated across all form factors.

See [Using the Chrome UX Report API](https://developer.chrome.com/blog/chrome-ux-report-api) for more example queries.

## Data pipeline

The CrUX dataset is processed through a pipeline to consolidate, aggregate and filter the data before becoming available using the API.

### The rolling average

The data in the Chrome UX Report is a 28-day rolling average of aggregated metrics. This means that the data presented in the Chrome UX Report at any given time is actually data for the past 28 days aggregated together.

This is similar to how the [CrUX dataset on BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt) aggregates monthly reports.

### Daily updates

Data is updated daily around 04:00 UTC. There is no service level agreement for update times; it is run on a best-effort basis every day.

> [!CAUTION]
> **Caution:** Data won't differ within the same day after it has been updated around 04:00 UTC, repeated calls will yield the same results.

## Schema

There is a single endpoint for the CrUX API which accepts `POST` HTTP requests. The API returns a `record` which contains one or more `metrics` corresponding to performance data about the requested origin or page.

### HTTP request

```console
POST https://chromeuxreport.googleapis.com/v1/records:queryRecord
```

The URL uses [gRPC Transcoding](https://google.aip.dev/127) syntax.

### Request body

The request body should contain data with the following structure:

```json
{
  "formFactor": enum (FormFactor),
  "metrics": [
    string
  ],

  // Union field url_pattern can be only one of the following:
  "origin": string,
  "url": string
  // End of list of possible types for union field url_pattern.
}
```

| Fields ||
|---|---|
| `formFactor` | **`enum` ([`FormFactor`](https://developer.chrome.com/docs/crux/api.md.txt#form_factor))** The form factor is a query dimension that specifies the device class that the record's data should belong to. This field uses the values `DESKTOP`, `PHONE`, or `TABLET`. Note: If no form factor is specified, then a special record with aggregated data over all form factors will be returned. |
| `metrics[]` | **`string`** The metrics that should be included in the response. If none are specified then any metrics found will be returned. Allowed values: `["cumulative_layout_shift", "first_contentful_paint", "interaction_to_next_paint", "largest_contentful_paint", "experimental_cumulative_layout_shift_with_softnavs", "experimental_first_contentful_paint_with_softnavs", "experimental_interaction_to_next_paint_with_softnavs", "experimental_largest_contentful_paint_with_softnavs", "experimental_time_to_first_byte", "experimental_navigation_types_with_softnavs", "largest_contentful_paint_resource_type", "largest_contentful_paint_image_time_to_first_byte", "largest_contentful_paint_image_resource_load_delay", "largest_contentful_paint_image_resource_load_duration", "largest_contentful_paint_image_element_render_delay", "navigation_types", "round_trip_time", "experimental_ad_count", "experimental_ad_density", "experimental_ad_cpu", "experimental_ad_kilobytes"]` |
| Union field `url_pattern`. The `url_pattern` is the main identifier for a record lookup. It can be only one of the following: ||
| `origin` | **`string`** The `url_pattern` "origin" refers to a URL pattern that is the origin of a website. Examples: `"https://example.com"`, `"https://cloud.google.com"` |
| `url` | **`string`** The `url_pattern` `url` refers to a URL pattern that is any arbitrary URL. Examples: `"https://example.com/`, `https://cloud.google.com/why-google-cloud/"` |

For example, to request the desktop largest contentful paint values for the Chrome developer documentation homepage:

```json
{
  "url": "https://developer.chrome.com/docs/",
  "formFactor": "DESKTOP",
  "metrics": [
    "largest_contentful_paint"
  ]
}
```

### Response body

Successful requests return responses with a `record` object and `urlNormalizationDetails` in the following structure:

```json
{
  "record": {
    "key": {
      object (Key)
    },
    "metrics": [
      string: {
        object (Metric)
      }
    ]
  },
  "urlNormalizationDetails": {
    object (UrlNormalization)
  }
}
```

For example, the response to the request body in the previous request could be:

```json
{
  "record": {
    "key": {
      "formFactor": "DESKTOP",
      "url": "https://developer.chrome.com/docs/"
    },
    "metrics": {
      "largest_contentful_paint": {
        "histogram": [
          {
            "start": 0,
            "end": 2500,
            "density": 0.9815
          },
          {
            "start": 2500,
            "end": 4000,
            "density": 0.0108
          },
          {
            "start": 4000,
            "density": 0.0077
          }
        ],
        "percentiles": {
          "p75": 651
        }
      }
    },
    "collectionPeriod": {
      "firstDate": {
        "year": 2022,
        "month": 9,
        "day": 12
      },
      "lastDate": {
        "year": 2022,
        "month": 10,
        "day": 9
      }
    }
  }
}
```

#### Key

`Key` defines all the dimensions that identify this record as unique.

```json
{
  "formFactor": enum (FormFactor),

  // Union field url_pattern can be only one of the following:
  "origin": string,
  "url": string
  // End of list of possible types for union field url_pattern.
}
```

| Fields ||
|---|---|
| `formFactor` | **`enum (FormFactor)`** The form factor is the device class that all users used to access the site for this record. If the form factor is unspecified, then aggregated data over all form factors will be returned. |
| Union field `url_pattern`. The URL pattern is the URL that the record applies to. `url_pattern` can be only one of the following: ||
| `origin` | **`string`** `origin` specifies the origin that this record is for. Note: When specifying an `origin`, data for loads under this origin over all pages are aggregated into origin level user experience data. |
| `url` | **`string`** `url` specifies a specific URL that this record is for. Note: When specifying a `url` only data for that specific URL will be aggregated. |

#### Metrics

A `metric` is a set of aggregated user experience data for a single web performance metric, such as first contentful paint.
It may contains a summary histogram of real world Chrome usage as a series of `bins`, specific percentile data
(such as the p75), or it may contain labeled fractions.

```json
{
  "histogram": [
    {
      object (Bin)
    }
  ],
  "percentiles": {
    object (Percentiles)
  }
}
```

or

```json
{
  "fractions": {
    object (Fractions)
  }
}
```

| Fields ||
|---|---|
| `histogram[]` | **`object (Bin)`** The histogram of user experiences for a metric. The histogram will have at least one bin and the densities of all bins will add up to \~1. |
| `percentiles` | **`object (Percentiles)`** Common useful percentiles of the Metric. The value type for the percentiles will be the same as the value types given for the Histogram bins. |
| `fractions` | **`object (Fractions)`** This object contains labeled fractions, which add up to \~1. Fractions are rounded to 4 decimal places. |

#### Bin

A `bin` is a discrete portion of data spanning from start to end, or if no end is given from start to positive infinity.

A bin's start and end values are given in the value type of the metric it represents. For example, first contentful paint is measured in milliseconds and exposed as ints, therefore its metric bins will use int32s for its start and end types. However cumulative layout shift is measured in unitless decimals and is exposed as a decimal encoded as a string, therefore its metric bins will use strings for its value type.

```json
{
  "start": value,
  "end": value,
  "density": number
}
```

| Fields ||
|---|---|
| `start` | **`(integer | string)`** Start is the beginning of the data bin. |
| `end` | **`(integer | string)`** End is the end of the data bin. If end is not populated, then the bin has no end and is valid from start to +inf. |
| `density` | **`number`** The proportion of users that experienced this bin's value for the given metric. Densities are rounded to 4 decimal places. |

#### Percentiles

`Percentiles` contains synthetic values of a metric at a given statistical percentile. These are used for estimating a metric's value as experienced by a percentage of users out of the total number of users.

```json
{
  "P75": value
}
```

| Fields ||
|---|---|
| `p75` | **`(integer | string)`** 75% of page loads experienced the given metric at or less than this value. |

#### Fractions

`Fractions` contains labeled fractions that add up to \~1. Each label describes a
page load in some way, so metrics represented in this way can be thought of as
producing distinct values instead of numerical values, and the fractions express
how frequently a particular distinct value was measured.

```json
{
  "label_1": fraction,
  "label_2": fraction,
  ...
  "label_n": fraction
}
```

Much like the density values in histogram bins, each `fraction` is a number
`0.0 <= value <= 1.0`, and they add up to \~1.0.

#### UrlNormalization

Object representing the normalization actions taken to normalize a URL to achieve a higher chance of successful lookup. These are basic, automated changes that are taken when looking up the provided `url_pattern` would be known to fail. Complex actions like following redirects are not handled.

```json
{
  "originalUrl": string,
  "normalizedUrl": string
}
```

| Fields ||
|---|---|
| `originalUrl` | **`string`** The original requested URL prior to any normalization actions. |
| `normalizedUrl` | **`string`** The URL after any normalization actions. This is a valid user experience URL that could reasonably be looked up. |

## Rate limits

The CrUX API is limited to 150 queries per minute per Google Cloud project, which is offered without charge. This limit, and your current usage, can be seen in the [Google Cloud Console](https://console.cloud.google.com/apis/api/chromeuxreport.googleapis.com/quotas). This generous quota should be sufficient for the vast majority of use cases and it is not possible to pay for an increased quota.
