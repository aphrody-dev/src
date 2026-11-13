---
source_url: https://developer.chrome.com/docs/crux/guides/history-api
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: 086514e6bbf19deac8d4f0984b056c2fdef00ccef16ee9edae6a4ad029f41f3d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Johannes Henkel [X](https://twitter.com/powdercloud) [GitHub](https://github.com/powdercloud) [Mastodon](https://mastodon.social/@powdercloud)  Jasmine Yan [GitHub](https://github.com/jazyan)  Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Published: Feb 7, 2023, Last updated: Apr 11, 2025

This guide introduces the [Chrome UX Report (CrUX) History API](https://developer.chrome.com/docs/crux/history-api.md.txt)
endpoint, which provides time series of web performance data. This data
updates weekly, and lets you see about 6 months worth of history, with 40
data points spaced out by a week.

When used with the daily updates from the original [CrUX API](https://developer.chrome.com/docs/crux/api.md.txt)
endpoint, you can now quickly see both the most recent data and what happened
previously, making this a powerful tool for seeing web page changes over time.

## Try the API on this page

[Try it!](https://developer.chrome.com/docs/crux/guides/history-api.md.txt#try-it)

## Query the daily CrUX API

To recap from [a previous article on the CrUX API](https://developer.chrome.com/blog/chrome-ux-report-api), you can get a snapshot of the field data for a particular origin in this way:

```bash
API_KEY="[YOUR_API_KEY]"
curl "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$API_KEY" --header 'Content-Type: application/json' --data '{"origin": "https://web.dev"}'

{
  "record": {
    "key": {
      "origin": "https://web.dev"
    },
    "metrics": {
      "largest_contentful_paint": {
        "histogram": [{
          "start": 0, "end": 2500, "density": 0.9192
        }, {
          "start": 2500, "end": 4000, "density": 0.0513
        }, {
          "start": 4000, "density": 0.0294
        }],
        "percentiles": {
          "p75": 1303
        }
      }
      // ...
    },
    "collectionPeriod": {
      "firstDate": { "year": 2022, "month": 12, "day": 27 },
      "lastDate": { "year": 2023, "month": 1, "day": 23 }
    }
  }
}
```

This snapshot includes histogram density values and percentile values for a particular 28-day collection period, in this case, from December 27, 2022 to January 23, 2023.

## Query the CrUX History API

To call the history endpoint, change `queryRecord` in the URL to
`queryHistoryRecord` in the `curl` command. Using the same
[CrUX API key](https://developer.chrome.com/docs/crux/api.md.txt#crux_api_key) as for the previous call will work.
`collectionPeriodCount` specifies the number of time series entries to return;
the max is 40. If not specified, it defaults to 25.

```bash
API_KEY="[YOUR_API_KEY]"
curl "https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=$API_KEY" \
 --header 'Content-Type: application/json' \
 --data '{"origin": "https://web.dev", "collectionPeriodCount": 40}'
```

The overall shape of a response is similar, but there is a lot more data.
Instead of a single data point, there are now time series for the fields
containing the 75th percentile (p75) and histogram density values.

```json
{
  "record": {
    "key": {
      "origin": "https://web.dev"
    },
    "metrics": {
      "largest_contentful_paint": {
        "histogramTimeseries": [{
            "start": 0, "end": 2500, "densities": [
              0.9190, 0.9203, 0.9194, 0.9195, 0.9183, 0.9187
            ]
          }, {
            "start": 2500, "end": 4000, "densities": [
              0.0521, 0.0513, 0.0518, 0.0518, 0.0526, 0.0527
            ]
          },  {
            "start": 4000, "densities": [
              0.0288, 0.0282, 0.0286, 0.0285, 0.0290, 0.0285
            ]
          }
        ],
        "percentilesTimeseries": {
          "p75s": [
            1362, 1352, 1344, 1356, 1366, 1377
          ]
        }
      }
      // ...
    },
    "collectionPeriods": [{
        "firstDate": { "year": 2022, "month": 7, "day": 10 },
        "lastDate": { "year": 2022, "month": 8, "day": 6 }
      }, {
        "firstDate": { "year": 2022, "month": 7, "day": 17 },
        "lastDate": { "year": 2022, "month": 8, "day": 13 }
      }, {
        "firstDate": { "year": 2022, "month": 7, "day": 24 },
        "lastDate": { "year": 2022, "month": 8, "day": 20 }
      }, {
        "firstDate": { "year": 2022, "month": 7, "day": 31 },
        "lastDate": { "year": 2022, "month": 8, "day": 27 }
      }, {
        "firstDate": { "year": 2022, "month": 8, "day": 7 },
        "lastDate": { "year": 2022, "month": 9, "day": 3 }
      }, {
        "firstDate": { "year": 2022, "month": 8, "day": 14 },
        "lastDate": { "year": 2022, "month": 9, "day": 10 }
      }
    ]
  }
}
```

In this example, the `densities` time series for the 0 to 2500 ms bucket of the
[Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) metric is
`[0.9190, 0.9203, 0.9194, 0.9195, 0.9183, 0.9187].` Each of these densities was
observed during the corresponding `collectionPeriods` entry. For example, the
fifth density, 0.9183, was the density for the fifth collection period, ending
on September 3rd, 2022, and 0.9187 was the density in the period ending the
week after that.

In other words, interpreting the last time series entries in the example for
[web.dev](https://web.dev), it was found that from August 14, 2022 until
September 10, 2022, 91.87% of page loads had LCP values smaller than 2500ms,
5.27% had values between 2500ms and 4000ms, and 2.85% had values greater
than 4000ms.

Similarly, there's a time series for the p75 values: the LCP p75 for August 14,
2022 until September 10, 2022 was `1377`. This means that, for this collection
period, 75% of user experiences had an LCP of less than 1377 ms, and 25% of
user experiences had an LCP greater than 1377 ms.

While the example only lists 6 time series entries and collection periods,
responses from the API provide 25 time series entries by default and a max of
40 - when `"collectionPeriodCount": 40` is specified in the request. Since the
end dates for each of these collection periods are Saturdays that are 7 days
apart, with `"collectionPeriodCount": 40` this covers 10 months.

> [!NOTE]
> **Note:** Unlike the daily API, the CrUX History API is only updated once a week on Mondays (including data until the previous Saturday). However, like the daily API, each value in the CrUX History API is measured from the previous 28 days. This means the History API should represent the same data that was available using the daily API for the given date---it is just now available to query retrospectively. However, it does mean the History API contains overlapping periods of data but---as a trend analysis---it is useful to track the change in metrics over time.

In any given response, the length of the time series for the histogram bin
densities and for p75 values will be exactly the same as the length of array in
the `collectionPeriods` field: There is a one-to-one correspondence based on the
index into these arrays.

## Query page-level data

As well as origin-level data, the CrUX History API allows access to historical
page-level data. While the origin-level data was available previously using the
[CrUX dataset on BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt), the page-level historical data
was only available if sites collected and stored the data themselves. The new
API now unlocks that historical page-level data.

The page-level data can be queried in the same manner, but using `url` instead of `origin` in the payload:

```bash
API_KEY="[YOUR_API_KEY]"
curl "https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=$API_KEY" \
 --header 'Content-Type: application/json' \
 --data '{"url": "https://web.dev/blog/"}'
```

Page-level (and origin-level) historical data is subject to
[the same eligibility requirements](https://developer.chrome.com/docs/crux/methodology.md.txt#eligibility) as the
rest of CrUX, and so pages in particular may not have a complete historical
record. In these cases the "missing" data will be represented by `"NaN"` for the
`histogramTimeseries` densities and `null` for the `percentilesTimeseries`. The
reason for the difference is the histogram densities are always numbers, while
the percentiles can be numbers or strings (CLS uses strings, even if they
look like numbers).

## Visualize the data

The easiest way to visualize the data is through
[CrUX Vis](https://cruxvis.withgoogle.com/) a tool specifically created to
demonstrate the power of the CrUX History API. Read more in
[the CrUX Vis documentation](https://developer.chrome.com/docs/crux/vis.md.txt).

To generate similar charts yourself, we have created an example
[Colab](https://colab.research.google.com/). A Colab, or 'Colaboratory',
lets you write and execute Python from within your browser. The
[CrUX History API Colab](https://colab.research.google.com/github/GoogleChrome/CrUX/blob/main/colab/crux-history-api.ipynb)
([source](https://github.com/GoogleChrome/CrUX/blob/main/colab/crux-history-api.ipynb))
uses Python to make calls to the API and chart the data.

This Colab lets you make p75 charts, tri-bin charts, get data in tabular form,
and see the request and response pair for the CrUX API, by filling out a brief
form. You don't need to be a programmer to use this, but you can look
at the Python code and modify it into something amazing.

This is just one example of how to use this new API. As a JSON-based,
HTTP endpoint the API is queryable from any technology.

## Conclusion

Before the introduction of the CrUX History API endpoint, site owners were
limited in the historical information they could obtain from CrUX. Monthly
origin-level data was available using BigQuery, but weekly data was not
available nor was page-level historical data. Site owners could record this
data themselves using the daily API, but often the need for this was only
discovered after a regression in metrics.

The hope with the introduction of this CrUX History API is that it will allow
site owners to have a better understanding of their changing site metrics, and
as a diagnostic tool for when issues arise. If you are using the new API,
feedback is welcomed at the [Chrome UX Report Google Group](https://groups.google.com/a/chromium.org/g/chrome-ux-report).
