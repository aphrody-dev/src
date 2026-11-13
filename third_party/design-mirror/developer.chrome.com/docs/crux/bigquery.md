---
source_url: https://developer.chrome.com/docs/crux/bigquery
fetched: 2026-11-13
lastmod: 2026-10-13T18:02:02+00:00
sha256: 390d6c97c08a4ab6fb510a420d920efc702257088c8923bda2c63ec45575cce1
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Learn how CrUX data is structured on BigQuery.

## Introduction

The raw data behind the Chrome UX Report (CrUX) is available on [BigQuery](https://cloud.google.com/bigquery/), a database hosted on Google Cloud.

CrUX on BigQuery allows users to directly query the full dataset going back to 2017, for example to analyze trends, compare web technologies and benchmark domains.

The data is structured by monthly release, as well as a number of summary tables to provide quicker access for querying the data.

## Access the dataset

Using BigQuery requires a [Google Cloud account](https://cloud.google.com/) and basic knowledge of SQL. The [CrUX dataset on BigQuery](https://console.cloud.google.com/bigquery?p=chrome-ux-report&d=all&page=dataset) is free to access and explore up to the limits of the [free tier](https://cloud.google.com/bigquery/pricing#queries), which is renewed monthly and provided by BigQuery. Additionally, new Google Cloud users may be eligible for a [signup credit](https://cloud.google.com/free/docs/frequently-asked-questions#free-trial) to cover expenses beyond the free tier. Note that a credit card must be provided for the Google Cloud project, see [Why do I need to provide a credit card?](https://cloud.google.com/free/docs/frequently-asked-questions#why-credit-card).

If this is your first time using BigQuery then follow these steps to set up a project:

1. Navigate to **Create a Project** on the [Google Cloud console](https://console.cloud.google.com/projectcreate).
2. Give your new project a name like "My Chrome UX Report" and click Create.
3. Provide your billing information if prompted.
4. Navigate to the [CrUX dataset on BigQuery](https://console.cloud.google.com/bigquery?p=chrome-ux-report&d=all&page=dataset)

Now you're ready to start querying the dataset.
| **Note:** For example queries see the [getting started guide](https://developer.chrome.com/docs/crux/guides/bigquery).

## Project organization

CrUX data on BigQuery is released on the second Tuesday of the following month. Each month is released as a new table under `chrome-ux-report.all`. There are also a number of materialized tables which provide summary statistics for each month.

- \`chrome-ux-report
  - `all`
    - [YYYYMM](https://developer.chrome.com/docs/crux/bigquery#schema_raw_tables)
  - `country_CC`
    - [YYYYMM](https://developer.chrome.com/docs/crux/bigquery#schema_raw_tables)
  - [`experimental`](https://developer.chrome.com/docs/crux/bigquery#schema_experimental)
    - [`country`](https://developer.chrome.com/docs/crux/bigquery#schema-experimental-country)
    - [`global`](https://developer.chrome.com/docs/crux/bigquery#schema-experimental-global)
  - [`materialized`](https://developer.chrome.com/docs/crux/bigquery#schema_summary)
    - [`country_summary`](https://developer.chrome.com/docs/crux/bigquery#schema_country_summary)
    - [`device_summary`](https://developer.chrome.com/docs/crux/bigquery#schema_device_summary)
    - [`metrics_summary`](https://developer.chrome.com/docs/crux/bigquery#schema_metrics_summary)
    - [`origin_summary`](https://developer.chrome.com/docs/crux/bigquery#schema_origin_summary)

## Detailed table schema

The raw tables for each country and the `all` dataset are provided by year and month.

### Raw tables

The raw tables have the following schema:

- `origin`
- `effective_connection_type`
- `form_factor`
- `first_paint`
- `first_contentful_paint`
- `largest_contentful_paint`
- `dom_content_loaded`
- `onload`
- `layout_instability`
  - `cumulative_layout_shift`
- `interaction_to_next_paint`
- `round_trip_time`
- `navigation_types`
  - `navigate`
  - `navigate_cache`
  - `reload`
  - `restore`
  - `back_forward`
  - `back_forward_cache`
  - `prerender`
- `experimental`
  - `permission`
    - `notifications`
  - `time_to_first_byte`
  - `popularity`

## Materialized table schema

Materialized tables are provided for easier access to summary data by a number of key dimensions. No histograms are provided, instead performance data is aggregated into fractions by performance assessment and the 75th percentile value. A set of example rows from the `metrics_summary` table are shown in this example:  

| yyyymm | origin | fast_lcp | avg_lcp | slow_lcp | p75_lcp |
|---|---|---|---|---|---|
| 202204 | https://example.com | 0.9056 | 0.0635 | 0.0301 | 1600 |
| 202203 | https://example.com | 0.9209 | 0.052 | 0.0274 | 1400 |
| 202202 | https://example.com | 0.9169 | 0.0545 | 0.0284 | 1500 |
| 202201 | https://example.com | 0.9072 | 0.0626 | 0.0298 | 1500 |

This shows that in the 202204 dataset, 90.56% of real-user experiences on `https://example.com` met the criteria for [good LCP](https://web.dev/articles/defining-core-web-vitals-thresholds#refresher:_core_web_vitals_metrics_and_thresholds), and that the coarse 75th percentile LCP value was 1,600ms. This is slightly slower than previous months.

Four materialized tables are provided:

[`metrics_summary`](https://developer.chrome.com/docs/crux/bigquery#schema-metrics-summary)
:   key metrics by month and origin

[`device_summary`](https://developer.chrome.com/docs/crux/bigquery#schema-device-summary)
:   key metrics by month, origin and device type

[`country_summary`](https://developer.chrome.com/docs/crux/bigquery#schema-country-summary)
:   key metrics by month, origin, device type and country

[`origin_summary`](https://developer.chrome.com/docs/crux/bigquery#schema-origin-summary)
:   a list of all origins included in the dataset

### `metrics_summary`

The `metrics_summary` table contains summary statistics for each origin and each monthly dataset:

`yyyymm`
:   Month of the data collection period

`origin`
:   URL of the site origin

`rank`
:   Coarse popularity ranking (as of [March 2021](https://developer.chrome.com/docs/crux/release-notes#202103))

`[small|medium|large]_cls`
:   fraction of traffic by CLS thresholds

`[fast|avg|slow]_<metric>`
:   fraction of traffic by performance thresholds

`[low|medium|high]_rtt`
:   fraction of traffic by RTT thresholds

`p75_<metric>`
:   75th percentile value of performance metrics (milliseconds)

`notification_permission_[accept|deny|ignore|dismiss]`
:   fraction of notification permission behaviors

`[desktop|phone|tablet]Density`
:   fraction of traffic by form factor

`[_4G|_3G|_2G|slow2G|offline]Density`
:   fraction of traffic by effective connection type *(calculated from `rtt` histograms [from February 2025](https://developer.chrome.com/blog/crux-2025-02), with no offline)*

`navigation_type_[navigate|navigate_cache|reload|restore|back_forward|back_forward_cache|prerender]`
:   fraction of navigation types

### `device_summary`

The `device_summary` table contains aggregated statistics by month, origin, country and device. In addition to the `metrics_summary` columns there is:

`device`
:   Device [form factor](https://developer.chrome.com/docs/crux/methodology#form-factor-dimension)

### `country_summary`

The `country_summary` table contains aggregated statistics by month, origin, country and device. In addition to the `metrics_summary` columns there is:

`country_code`
:   [Two-letter country code](https://developer.chrome.com/docs/crux/methodology#country-dimension)

`device`
:   Device [form factor](https://developer.chrome.com/docs/crux/methodology#form-factor-dimension)

### `origin_summary`

The `origin_summary` table contains a list of all origins in the CrUX dataset; it is updated monthly with the latest list of origins in the dataset and has a single column: `origin`.

## Experimental dataset

Tables in the experimental dataset are exact copies of the default `YYYYMM` tables, but they make use of newer and more advanced BigQuery features like [partitioning](https://cloud.google.com/bigquery/docs/partitioned-tables) and [clustering](https://cloud.google.com/bigquery/docs/clustered-tables) that enable you to write faster, simpler, and cheaper queries.

### `country`

The `experimental.country` dataset contains aggregated data from the `country_CC` datasets with an additional `yyyymm` column for the dataset date. The schema is identical to [raw tables](https://developer.chrome.com/docs/crux/bigquery#schema_raw_tables) with the addition of the date and `country_code` columns, allowing for country-level comparison over time queries to be executed without joining the monthly tables.

### `global`

The `experimental.global` dataset contains aggregated data from the `all` dataset with an additional `yyyymm` column for the dataset date. The schema is identical to [raw tables](https://developer.chrome.com/docs/crux/bigquery#schema_raw_tables) with the addition of the date, allowing for comparison over time queries to be executed without joining the monthly tables.
