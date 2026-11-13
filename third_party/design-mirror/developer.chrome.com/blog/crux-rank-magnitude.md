---
source_url: https://developer.chrome.com/blog/crux-rank-magnitude
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: 2633d4e972fc02761923e36e31ef574ed9786c0e53f03f1b74025093adcb517b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Johannes Henkel [X](https://twitter.com/powdercloud) [GitHub](https://github.com/powdercloud) [Mastodon](https://mastodon.social/@powdercloud) Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Starting with the [February 2021 dataset](https://developer.chrome.com/docs/crux/release-notes.md.txt#202101), we're adding an experimental metric to the [CrUX report in BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt) which distinguishes the popularity of origins by orders of magnitude: The top 1k origins, top 10k, top 100k, top 1M, ...

Let's see how this looks in practice:

```sql
SELECT
  experimental.popularity.rank AS rank_magnitude,
  COUNT(DISTINCT origin) AS num_origins
FROM
  `chrome-ux-report.all.202102`
GROUP BY
  rank_magnitude
ORDER BY
  rank_magnitude
```

| Row | rank_magnitude | num_origins |
| --- | -------------- | ----------- |
| 1   | 1,000          | 1,000       |
| 2   | 10,000         | 9,000       |
| 3   | 100,000        | 90,000      |
| 4   | 1,000,000      | 900,000     |
| 15  | 10,000,000     | 7,264,371   |

For the February 2021 global data set, we get 5 buckets. As expected, in row 1,
we see that there are 1000 origins with rank magnitude 1000 - the 1k most
popular origins by our metric. Row 2 may look surprising, indicating that there
are only 9k origins in the top 10k set; this is because the origins in row 1 are
also part of the top 10k set. To select the top 10k origins, one needs to
specify experimental.popularity.rank \<= 10000 when querying.

The dataset also contains country specific rank magnitude. For example, this
query lists the 10k origins that are most popular in Germany.

```sql
SELECT DISTINCT origin
FROM `chrome-ux-report.country_de.202102`
WHERE experimental.popularity.rank <= 10000
```

To touch on the potential of our new popularity metric, let's see how popularity
segments of the web differ with respect to the [first contentful paint metric (FCP)](https://web.dev/articles/fcp). For the purpose of this query,
we consider 1 second a fast user experience.

```sql
SELECT
  SUM(fcp.density)/count(distinct origin)
FROM
  `chrome-ux-report.all.202102`,
  UNNEST(first_contentful_paint.histogram.bin) AS fcp
WHERE
  fcp.start < 1000 AND experimental.popularity.rank <= 1000
```

For the origins with `experimental.popularity.rank` \<= 1000, the query sums all
histogram bucket densities for FCP metric values smaller than 1000ms and divides
it by the number of origins - that is, it calculates the average percentage of
fast FCP loads for the 1k most popular origins. In this query, all origins have
equal weight, so arguably this is not perfect. But let's see whether the result
is sensitive to changing the rank magnitude, by altering the where clause to
specify experimental.popularity.rank \<= 10000. We do this for 10k, 100k, and so
on:

| Rank magnitude of origins | Percentage of FCP \< 1s, averaged over origins |
| ------------------------- | ---------------------------------------------- |
| 1.000                     | 53.6%                                          |
| 10,000                    | 49.6%                                          |
| 100,000                   | 45.9%                                          |
| 1,000,000                 | 43.2%                                          |
| 10,000,000                | 39.9%                                          |

This indicates that a faster user experience on the web is correlated with being more popular.

In the [October 2022 dataset](https://developer.chrome.com/docs/crux/release-notes.md.txt#202210) this was further split out by half-rank steps. Rerunning the first query for this dataset shows the half-steps and the number of origins in each rank magnitude::

```sql
SELECT
  experimental.popularity.rank AS rank_magnitude,
  COUNT(DISTINCT origin) AS num_origins
FROM
  `chrome-ux-report.all.202210`
GROUP BY
  rank_magnitude
ORDER BY
  rank_magnitude
```

| Row | rank_magnitude | num_origins |
| --- | -------------- | ----------- |
| 1   | 1,000          | 1,000       |
| 2   | 5,000          | 4,000       |
| 3   | 10,000         | 5,000       |
| 4   | 50,000         | 40,000      |
| 5   | 100,000        | 50,000      |
| 6   | 500,000        | 400,000     |
| 7   | 1,000,000      | 500,000     |
| 8   | 5,000,000      | 4,000,000   |
| 9   | 10,000,000     | 5,000,000   |
| 10  | 50,000,000     | 7,637,195   |

Learn more about [using CrUX on BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt) and [browse the CrUX Cookbook](https://github.com/GoogleChrome/CrUX/tree/main/sql) for more example queries. Share your queries if you like, and let us know what you find.
