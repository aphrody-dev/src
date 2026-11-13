---
source_url: https://web.dev/articles/performance-optimizing-content-efficiency
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: 77a8ffa98426a7f27d819a65d465748a6298eeacc1f9549ad4f89432aff00991
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Ilya Grigorik [X](https://twitter.com/igrigorik) [Homepage](https://igvita.com/)

Our web applications continue to grow in their scope, ambition, and functionality -- that's a good thing. However, the relentless march toward a richer web is driving another trend: the amount of data downloaded by each application continues to increase at a steady pace. To deliver great performance we need to optimize delivery of each and every byte!

What does a modern web application look like? [HTTP Archive](http://httparchive.org/) can help us answer this question. The project tracks how the web is built by periodically crawling the most popular sites (300,000+ from the Alexa Top 1M list) and recording and aggregating analytics on the number of resources, content types, and other metadata for each individual destination.

|   | 50th percentile | 75th percentile | 90th percentile |
|---|---|---|---|
| HTML | 13 KB | 26 KB | 54 KB |
| Images | 528 KB | 1213 KB | 2384 KB |
| JavaScript | 207 KB | 385 KB | 587 KB |
| CSS | 24 KB | 53 KB | 108 KB |
| Other | 282 KB | 308 KB | 353 KB |
| **Total** | **1054 KB** | **1985 KB** | **3486 KB** |

The above data captures the trend in growth of number of downloaded bytes for popular destinations on the web between January 2013 and January 2014. Of course, not every site grows at the same rate or requires the same amount of data, hence the reason why we are highlighting the different quantiles within the distribution: 50th (median), 75th, and 90th.

A median site at the beginning of 2014 is composed of 75 requests that add up to 1054 KB of total transferred bytes, and the total number of bytes (and requests) has grown at a steady pace throughout the previous year. This by itself should not be all that surprising, but it does carry important performance implications: yes, internet speeds are getting faster, but they are getting faster at different rates in different countries, and many users are still subject to data caps and expensive metered plans - especially on mobile.

Unlike their desktop counterparts, web applications do not require a separate installation process: enter the URL and we are up and running -- that's a key feature of the web. However, to make this happen **we often have to fetch dozens, and sometime hundreds, of various resources, all of which can add up to megabytes of data and must come together in hundreds of milliseconds to facilitate the instant web experience we are aiming for.**

Achieving an instant web experience in light of these requirements is no small feat, which is why optimizing content efficiency is critical: eliminating unnecessary downloads, optimizing transfer encoding of each resource through various compression techniques, and leveraging caching whenever possible to eliminate redundant downloads.
