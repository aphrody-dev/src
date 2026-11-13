---
source_url: https://developer.chrome.com/docs/crux/release-notes
fetched: 2026-11-13
lastmod: 2026-11-11T15:44:10+00:00
sha256: f187474a1d18b93e8b7a3d279a1dc2bcdbf3664a453d31b41d50dac56f5fa6d2
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
The CrUX dataset on BigQuery is updated on the second Tuesday of every month. Each release is numbered according to the year and calendar month of the data collection period, for example 201912 corresponds to the UX data collected during December 2019 and would be released on the second Tuesday of January 2020 after the data collection period has ended.

In the following list, we've curated some release notes for each monthly dataset. Subscribe to our [CrUX Announce](https://groups.google.com/a/chromium.org/forum/#!forum/chrome-ux-report-announce) mailing list or follow [@ChromeUXReport](https://twitter.com/ChromeUXReport) on Twitter for release Announcements.

## October 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/tjKgLwe7Mos)

**Publication date**

- November 11, 2026

**What's new**

- This month, we have expanded our recent soft navigation metrics to include FCP and Navigation Types data with soft navs in the CrUX APIs.
- These will be included in BigQuery in the following month.
- We have also updated [CrUX Vis](https://cruxvis.withgoogle.com/) to include these additional metrics.

**Notable stats**

- 18,070,207 origins (↓ 1.7%)
- 68.8% of origins (↑ 0.7%) had good LCP
- 81.6% of origins (↓ 0.1%) had good CLS
- 85.2% of origins (↓ 0.2%) had good INP
- 56.3% of origins (↑ 0.7%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

  With soft navigations included (as [we plan to include from May 2027](https://developer.chrome.com/blog/crux-experimental-soft-navs)) we'd see:
- 73.6% of origins had good LCP (↑ 7.0% from when soft navs are not included)

- 85.0% of origins had good CLS (↑ 4.2% from when soft navs are not included)

- 87.0% of origins had good INP (↑ 2.1% from when soft navs are not included)

- 60.3% of origins had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals) (an ↑ 7.1% from when soft navs are not included)

## September 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/dYaZAmJytgc)

**Publication date**

- October 13, 2026

**What's new**

- This month, we are adding new experimental variants of the Core Web Vitals (LCP, INP, and CLS) including soft navigation metrics as used by SPA sites. These metrics are available in both the BigQuery dataset and CrUX APIs.
- We have also published a blog post with details about how these data change the Core Web Vitals metrics for sites that experience a lot of soft navigations, and when we expect to migrate them out of the experimental stage. See [Introducing experimental Core Web Vitals metrics to the Chrome UX Report](https://web.dev/blog/crux-experimental-soft-navs/).
- The [CrUX Vis tool](https://cruxvis.withgoogle.com/) has also been updated allowing you to visualize the impact of the changes on a site by site basis.

**Notable stats**

- 18,376,044 origins (↑ 0.4%)
- 68.3% of origins (↑ 0.2%) had good LCP
- 81.7% of origins (↑ 0.2%) had good CLS
- 85.4% of origins (↑ 0.1%) had good INP
- 55.9 % of origins (↑ 0.5%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

With soft navigations included we'd see:

- 72.1% of origins had good LCP (↑ 5.6% from when soft navs are not included)
- 85.1% of origins had good CLS (↑ 4.2% from when soft navs are not included)
- 87.4% of origins had good INP (↑ 2.3% from when soft navs are not included)
- 59.5 % of origins had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals) (an ↑ 6.4% from when soft navs are not included)

## August 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/L-8qn0w3MwE)

**Publication date**

- September 8, 2026

**What's new**

- The continued regression of INP in particular is a cause for concern, but we don't have a definitive reason for this.

**Notable stats**

- 18,294,881 origins (↑ 1.3%)
- 68.1% of origins (↓ 0.2%) had good LCP
- 81.5% of origins (\~ 0.0%) had good CLS
- 85.3% of origins (↓ 0.5%) had good INP
- 55.6 % of origins (↓ 0.2%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## July 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/-C6M-mlafc8?e=48417069)

**Publication date**

- August 11, 2026

**What's new**

- No significant updates in this release.

**Notable stats**

- 18,059,068 origins (↓ 0.8%)
- 68.3% of origins (↑ 0.8%) had good LCP
- 81.6% of origins (↑ 0.2%) had good CLS
- 85.7% of origins (↓ 0.2%) had good INP
- 55.7 % of origins (↑ 0.8%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## June 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/-iVfq8jUsfU)

**Publication date**

- July 14, 2026

**What's new**

- Further small regressions this month, but when comparing to last year we see this is seasonal so expect to see this pick up again over the summer.

**Notable stats**

- 18,210,974 origins (↑ 0.5%)
- 67.7% of origins (↓ 1.2%) had good LCP
- 81.4% of origins (↑ 0.1%) had good CLS
- 85.9% of origins (↓ 0.8%) had good INP
- 55.3% of origins (↓ 1.2%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## May 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/nXOpiFs07D4)

**Publication date**

- June 09, 2026

**What's new**

- We see a regression in pass rates this month, mostly on Android. We have a few suspicions as to why this might be but nothing definitive to share yet.
- We had a slight delay to yesterday's weekly release to the CrUX History API and CrUX Vis. This is now resolved. It was unrelated to today's monthly release.

**Notable stats**

- 18,445,974 origins (↑ 0.5%)
- 68.6% of origins (↓ 0.5%) had good LCP
- 81.3% of origins (\~ 0.0%) had good CLS
- 86.6% of origins (↓ 0.6%) had good INP
- 55.9% of origins (↓ 0.8%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## April 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/DTStkjcgexA)

**Publication date**

- May 12, 2026

**What's new**

- No significant updates in this release.

**Notable stats**

- 18,350,375 origins (↑ 0.5%)
- 68.9% of origins (↓ 0.1%) had good LCP
- 81.3% of origins (↑ 0.1%) had good CLS
- 87.1% of origins (↓ 0.2%) had good INP
- 56.4% of origins (↓ 0.2%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## March 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/ynJCewfL1Dw)

**Publication date**

- April 14, 2026

**What's new**

- No significant updates in this release.

**Notable stats**

- 18,257,384 origins (↓ 1.6%)
- 69.0% of origins (↑ 1.1%) had good LCP
- 81.2% of origins (↓ 0.1%) had good CLS
- 87.2% of origins (\~ 0.0%) had good INP
- 56.5% of origins (↑ 1.3%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## February 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/oJHmgdM4qes)

**Publication date**

- March 9, 2026

**What's new**

- We have released the CrUX data one day early this month due to team annual leave.

**Notable stats**

- 18,561,202 origins (↑ 0.8%)
- 68.2% of origins (↓ 0.2%) had good LCP
- 81.3% of origins (↑ 0.4%) had good CLS
- 87.2% of origins (↑ 0.1%) had good INP
- 55.8% of origins (↑ 0.2%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## January 2026

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/KxwziGZUGQo)

**Publication date**

- February 10, 2026

**What's new**

- As noted last month, there is always a high variability in December data for seasonal reasons so we included the comparison to November data this month as well, where we see a reversion to form with a good increase over the two months in INP, CLS, and particularly overall pass rates and a slightly lesser change in LCP.

**Notable stats**

- 18,412,653 origins (↑ 6.9%) (↓ 0.1% from Nov data)
- 68.3% of origins (↑ 1.1%) had good LCP (↑ 0.4% from Nov data)
- 80.9% of origins (↑ 0.8%) had good CLS (↑ 0.9% from Nov data)
- 87.1% of origins (↑ 1.7%) had good INP (↑ 1.0% from Nov data)
- 55.7% of origins (↑ 2.3%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals) (↑ 2.0% from Nov data)

## December 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/F-uZp7z5ZTw)

**Publication date**

- January 13, 2026

**What's new**

- We usually see a high variability with the December data---we have seen the same every year since CrUX launched. Given the high variability it's difficult to attribute any of these moves to any particular causes and we expect most numbers to revert back next month (again as they mostly have in previous years). Therefore, we won't try to explain these movements this month.

**Notable stats**

- 17,288,655 origins (↓ 6.5%)
- 67.6% of origins (↓ 0.5%) had good LCP
- 80.3% of origins (↑ 0.1%) had good CLS
- 85.6% of origins (↓ 0.6%) had good INP
- 54.4% of origins (↓ 0.4%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## November 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/gEE8xzNwdXY)

**Publication date**

- December 9, 2025

**What's new**

- A final reminder that we've [deprecated the CrUX Dashboard at the end of November](https://developer.chrome.com/blog/crux-dashboard-deprecation.md.txt). It has not been updated for this month and we will shut down the connector soon.

**Notable stats**

- 18,426,351 origins (↓ 0.1%)
- 68.0% of origins (↑ 0.3%) had good LCP
- 80.2% of origins (↓ 0.1%) had good CLS
- 86.2% of origins (↑ 0.3%) had good INP
- 54.6% of origins (↑ 0.5%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## October 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/dZ7CG9j7Mrg)

**Publication date**

- November 11, 2025

**What's new**

- A reminder that we are [deprecating the CrUX Dashboard at the end of November](https://developer.chrome.com/blog/crux-dashboard-deprecation.md.txt). As the October dataset is the last month before that data, we are now stopping updating the data in the CrUX Connector that powers this dashboard and any similar dashboards you may have created based on this. The November data (released in December) won't be included. And we will shut down the connector soon.

**Notable stats**

- 18,438,315 origins (↓ 1.4%)
- 67.7% of origins (↑ 0.2%) had good LCP
- 80.3% of origins (↑ 0.2%) had good CLS
- 85.9% of origins (↓ 0.1%) had good INP
- 54.4% of origins (↑ 1.3%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## September 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/LJVMQu02sZo)

**Publication date**

- October 14, 2025

**What's new**

- A reminder that we are [deprecating the CrUX Dashboard at the end of November](https://developer.chrome.com/blog/crux-dashboard-deprecation.md.txt). Next month will be the last month we are planning on updating the data in the CrUX Connector that powers this dashboard and any similar dashboards you may have created based on this.

**Notable stats**

- 18,640,549 origins (↑ 1.7%)
- 66.8% of origins (↑ 0.5%) had good LCP
- 80.1% of origins (\~ 0.0%) had good CLS
- 86.0% of origins (↑ 0.3%) had good INP
- 53.7% of origins (↑ 0.5%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## August 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/aFaaxmBQQkQ)

**Publication date**

- September 9, 2025

**What's new**

- A return to form with the numbers trending up again with the completion of the Android data fix mentioned last month.
- This month we're announcing the [deprecation of the CrUX Dashboard at the end of November](https://developer.chrome.com/blog/crux-dashboard-deprecation.md.txt). See the linked post for more details about why, alternatives, and options if you really want to keep your dashboard by running this yourself.

**Notable stats**

- 18,320,585 origins (↑ 1.4%)
- 66.7% of origins (↑ 0.2%) had good LCP
- 80.1% of origins (↑ 0.5%) had good CLS
- 85.7% of origins (↑ 0.5%) had good INP
- 53.5% of origins (↑ 0.8%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## July 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/cnJwd1kVOuw)

**Publication date**

- August 12, 2025

**What's new**

- Previously, we mentioned that we fixed a data quality issue affecting Android devices and we are pleased to see a reversion of the last few month's regressions in most metrics (and even more so when looking at mobile only). Note that for 202507 (July 2025) the full impact of this fix has not yet been reflected in these numbers and further improvements are expected in the next month.

**Notable stats**

- 18,068,328 origins (↑ 0.8%)
- 66.6% of origins (↓ 0.2%) had good LCP
- 79.6% of origins (↑ 1.8%) had good CLS
- 85.4% of origins (↑ 0.4%) had good INP
- 53.0% of origins (↑ 1.8%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## June 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/af1FiZimHro)

**Publication date**

- July 8, 2025

**What's new**

- We've noticed another dip on the metrics this month, particularly on mobile. We are actively investigating this and may have a solution to reverse this temporary dip. We'll update further next month.

**Notable stats**

- 17,931,785 origins (↓ 1.2%)
- 66.7% of origins (↓ 1.4%) had good LCP
- 78.3% of origins (↓ 0.1%) had good CLS
- 85.0% of origins (↓ 0.4%) had good INP
- 52.1% of origins (↓ 1.2%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## May 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/F0biHFPfyd4)

**Publication date**

- June 10, 2025

**What's new**

- We've noticed a small dip in all the metrics, but haven't been able to identify any particular reasons for this. Looking historically there is often a small dip in May so hopefully we'll see a turnaround next month!

**Notable stats**

- 18,263,455 origins (↑ 0.3%)
- 67.6% of origins (↓ 0.4%) had good LCP
- 78.3% of origins (↓ 0.2%) had good CLS
- 85.3% of origins (↓ 0.1%) had good INP
- 52.7% of origins (↓ 0.5%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## April 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/myiCFh7M8t4)

**Publication date**

- May 13, 2025

**What's new**

- Mostly stable numbers this month with slight variations most likely due to the decrease in overall origins.
- One highlight in the data is that Duda CMS (used by approximately 40,000 origins in our dataset) [removed `Cache-Control: no-store` on most of their sites](https://blog.duda.co/we-just-broke-our-industry-leading-core-web-vitals-record-82-our-latest-technical-improvements-explained) leading to a [1.80% more origins passing CLS and 1.08% origins passing LCP](https://lookerstudio.google.com/s/gNexwinfYXY). We'd encourage other platforms to investigate this performance opportunity where safe to do so as even a small caching time can result in better performance gains for users navigating back and forth around the site.

**Notable stats**

- 18,201,879 origins (↓ 1.5%)
- 67.9% of origins (\~ 0.0%) had good LCP
- 78.5% of origins (↑ 0.5%) had good CLS
- 85.4% of origins (↓ 0.4%) had good INP
- 52.9% of origins (↑ 0.2%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## March 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/jXnYUiYnsss)

**Publication date**

- April 8, 2025

**What's new**

- We noticed good improvements to LCP and overall good origins this month, which look to be down to improved [bfcache](https://web.dev/articles/bfcache) eligibility thanks to some fixes by the Chrome team to make more APIs compatible with the bfcache.
- In other CrUX news, the Chrome DevTools team has been busy adding CrUX field data to the Performance panel in [the live metrics view](https://developer.chrome.com/blog/devtools-realtime-cwv.md.txt) and in [the trace view](https://developer.chrome.com/blog/new-in-devtools-134.md.txt#field-data) including [the LCP subparts](https://developer.chrome.com/blog/devtools-insights-sidebar.md.txt#lcp_insights). We hope that makes it easier to understand the performance issues experienced by your users in context of your local debugging.
- [Last year](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/ApfdCpPfR7U/m/y27sj0smCQAJ), we launched [CrUX Vis](https://cruxvis.withgoogle.com/) as an experimental new tool to visualise CrUX Data and potentially replace the [CrUX Dashboard](https://developer.chrome.com/docs/crux/dashboard.md.txt). This has been received very well and we're removing the experimental status of this tool over the coming months and also coming up with a plan to deprecate and eventually remove the CrUX Dashboard. As many of you are aware, the dashboard has suffered from stability issues as CrUX usage of it has scaled. We'd ask you to continue to provide CrUX Vis feedback using [the CrUX Vis survey](https://forms.gle/kvvSDrEJYaf6APur7) or the [CrUX discussion group](https://groups.google.com/a/chromium.org/g/chrome-ux-report) and we'll share CrUX Dashboard deprecation timelines soon.

**Notable stats**

- 18,473,760 origins (↓ 1.2%)
- 67.9% of origins (↑ 1.8%) had good LCP
- 78.2% of origins (↑ 0.5%) had good CLS
- 85.8% of origins (\~ 0.0%) had good INP
- 52.8% of origins (↑ 2.1%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## February 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/Kz_sjV1B8-I)

**Publication date**

- March 11, 2025

**What's new**

- There were slight improvements to LCP and overall Core Web Vital pass rates, but we don't have any particular reasons for these to share.

**Notable stats**

- 18,702,963 origins (↑ 0.3%)
- 66.7% of origins (↑ 0.7%) had good LCP
- 77.8% of origins (↑ 0.1%) had good CLS
- 85.8% of origins (↑ 0.1%) had good INP
- 51.8% of origins (↑ 0.9%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## January 2025

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/TTK6ZrzFBoY)

**Publication date**

- February 11, 2025

**What's new**

- As noted last month, there is always a high variability in December data for seasonal reasons so we included the comparison to November data this month, where we see a reversion to form with a good increase in LCP and lesser changes in CLS, INP, and overall pass rates.
- We have added LCP image subparts to the CrUX API.
- We have added LCP resource types (text or image) to the CrUX API.
- We have added Round Trip Time (RTT) tri-bins to the CrUX API.
- We have added Round Trip Time (RTT) p75 and histograms to the CrUX BigQuery dataset.
- We have retired the ECT dimension from the BigQuery dataset (RTT data offers a replacement at a metric level). This leads to an increase in the number of origins with optional metric coverage (for example INP and navigation types).
- There's a lot to cover for those so you can find more information on those [LCP and RTT changes in the announcement post](https://developer.chrome.com/blog/crux-2025-02.md.txt) and you can view the new API changes from today in [CrUX Vis](https://cruxvis.withgoogle.com/#/). We hope you find the additional information useful to aid in debugging Core Web Vitals.

**Notable stats**

- 18,651,905 origins (↑ 7.2%) (↑ 0.9% from Nov data)
- 66.2% of origins (↑ 0.7%) had good LCP (↑ 0.9% from Nov data)
- 77.8% of origins (↑ 0.3%) had good CLS (↓ 0.3% from Nov data)
- 85.8% of origins (↑ 0.9%) had good INP (↓ 0.1% from Nov data)
- 51.3% of origins (↑ 0.6%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals) (↑ 0.2% from Nov data)

## December 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/iLqUTQK7rA0)

**Publication date**

- January 14, 2025

**What's new**

- We usually see a high variability with the December data---we have seen the same every year since CrUX launched. Given the high variability it's difficult to attribute any of these moves to any particular causes and we expect most numbers to revert back next month (again as they mostly have in previous years). Therefore, we won't try to explain these movements this month.
- We added the [collection period dates](https://developer.chrome.com/docs/crux/api.md.txt#collection-period) to PageSpeed Insights in the "Discover what your real users are experiencing" section so users can better understand the data they are seeing.

**Notable stats**

- 17,397,672 origins (↓ 6.4%)
- 66.0% of origins (↑ 0.7%) had good LCP
- 77.6% of origins (↓ 0.6%) had good CLS
- 85.0% of origins (↓ 1.0%) had good INP
- 51.0% of origins (↓ 0.4%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## November 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/9_KYojOEQDs)

**Publication date**

- December 10, 2024

**What's new**

- No significant updates in this release.

**Notable stats**

- 18,580,809 origins (↓ 1.2%)
- 65.6% of origins (↑ 0.1%) had good LCP
- 78.0% of origins (↓ 0.2%) had good CLS
- 85.9% of origins (\~ 0.0%) had good INP
- 51.2% of origins (\~ 0.0%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## October 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/SxXQw2bWZEQ)

**Publication date**

- November 12, 2024

**What's new**

- After a slew of updates in recent months, this was a quieter month with no major changes that we are aware of, and that's reflected in the numbers being roughly similar to last month---though most are still increasing slightly!
- As a reminder for those not waiting to wait for the monthly data on the second Tuesday of the month, the recently released CrUX Vis tool updates weekly.

**Notable stats**

- 18,814,228 origins (↓ 0.6%)
- 65.5% of origins (↑ 0.2%) had good LCP
- 78.2% of origins (\~ 0.0%) had good CLS
- 85.9% of origins (↑ 0.2%) had good INP
- 51.2% of origins (↑ 1.3%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## September 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/vg4Jif5uxec)

**Publication date**

- October 8, 2024

**What's new**

- This month includes the final rollout of the [scrolling change exclusions mentioned last month](https://developer.chrome.com/docs/crux/release-notes.md.txt#202408), which likely helped with continual improvements in pass rates seen this month.
- There was also another small change rolled out in the last month where [pages with many long events (over 150 events of 104 milliseconds or more) may not have recorded INP correctly](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2024_09_inp.md), but we don't expect many sites to be affected by this.
- This is the first month without First Input Delay (FID) data in BigQuery since [First Input Delay (FID) is now deprecated](https://web.dev/blog/inp-cwv-launch#fid_deprecation_timeline).
- We had planned to remove Effective Connection Type (ECT) from BigQuery for this month, but are still working through it's replacement so that has not changed yet.
- And for those that missed it, we launched [CrUX Vis](https://cruxvis.withgoogle.com/) this month---a new experimental CrUX tool to allow you to visualize CrUX History API data. See the [announcement post](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/ApfdCpPfR7U/m/W5ReWnW5AQAJ) for more details.

**Notable stats**

- 18,938,684 origins (↑ 2.9%)
- 65.4% of origins (↑ 0.9%) had good LCP
- 78.2% of origins (\~ 0.0%) had good CLS
- 85.7% of origins (↑ 0.9%) had good INP
- 51.0% of origins (↑ 1.8%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## August 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/iCxtZ0nALrY)

**Publication date**

- September 10, 2024

**What's new**

- Chrome has recently made a change to INP to [no longer include `pointerup` events used for scrolling](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2024_08_inp.md) (for example when you scroll on mobile using your finger). This not only improved INP by excluding these events, but also resulted in a drop in coverage of INP. Some sites may notice the optional INP metric is no longer available in CrUX.
- The [Google Publisher Tag](https://developers.google.com/publisher-tag/guides/get-started) ad library released an [INP optimization yielding on out-of-viewport Ad insertion logic](https://x.com/gilberto_cocchi/status/1818406129765859721) reducing negative INP impact. Mobile INP pass rates [improved from 55.58% to 66.12%](https://lookerstudio.google.com/s/mddqZksgYhU) for origins using GPT. Publishers can also further optimize ad insertion by using the GPT [threadYield](https://developers.google.com/publisher-tag/reference#googletag.config.PageSettingsConfig_threadYield) config option to yield even in-viewport ads.
- These changes---and the continued improvement in LCP---have contributed to the 2% increase in Core Web Vitals pass rates this month. **It's great to see more than half of origins are now passing Core Web Vitals!**
- As warned for the last few months, [First Input Delay (FID) is now deprecated](https://web.dev/blog/fid) and we have now removed FID from CrUX. The BigQuery dataset with August data published today will be the last month with FID data. The CrUX API will have FID removed from it from today.
- We have similarly also removed Effective Connection Type (ECT) from CrUX, again [as previously announced](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/Otq9hycQva4). The BigQuery dataset with August data published today will be the last month with ECT data. The ability to query the CrUX API by ECT will be removed from today. The course ECT buckets (low-2g, 2g, 3g, 4g) have been replaced in the CrUX API with a more fine-grained RTT latency p75 metric value. Note that this metric measures the internet connection latency of users of your site, rather than latency of your site directly. It is calculated based on [recently observed application-layer RTT measurements across recently active connections](https://wicg.github.io/netinfo/#rtt-attribute), not just connections to your site. Removing ECT as a dimension, and replacing it with a non-dimensional metric, means more origins will meet the threshold for CrUX data in the future. This will mean we will be able to bring CrUX insights, including split desktop and mobile data, and navigation breakdowns to many more sites.

**Notable stats**

- 18,394,950 origins (↑ 1.2%)
- 64.8% of origins (↑ 1.1%) had good LCP
- 78.2% of origins (↑ 0.2%) had good CLS
- 85.0% of origins (↑ 0.8%) had good INP
- 50.1% of origins (↑ 2.0%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## July 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/J_vLCrJmTUc)

**Publication date**

- August 13, 2024

**What's new**

- This month we saw another good increase in Core Web Vitals pass rates across all metrics.
- There are a number of changes being worked on by the Chrome team (particularly for LCP and INP) which no doubt helped with these improvements, including the [two changes to INP mentioned last month](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2024_07_inp.md) which should be fully rolled out now. We encourage those interested to check the [Web Vitals Changelogs](https://chromium.googlesource.com/chromium/src/+/master/docs/speed/metrics_changelog/README.md) for more technical detail, and will continue to highlight particularly noteworthy changes in these monthly announcements.
- This month we did a small tweak to our [CrUX API documentation](https://developer.chrome.com/docs/crux/api.md.txt), and [brought back the CrUX API Explorer](https://x.com/ChromeUXReport/status/1818633382638629099) that we used to have on our documentation in the past, but which we had to remove for technical reasons. This allows readers of the docs to quickly check API responses. By viewing this explorer in full screen, you even get curl, HTTP, and JavaScript snippets.
- This is also your final reminder that FID is deprecated and will be [removed from Chrome tools in September 2024](https://web.dev/blog/inp-cwv-launch#fid_deprecation_timeline). Make sure you update any CrUX API applications to switch over to INP by then.

**Notable stats**

- 18,176,653 origins (↓ 1.4%)
- 64.1% of origins (↑ 1.2%) had good LCP
- 78.0% of origins (↑ 0.4%) had good CLS
- 84.4% of origins (↑ 0.4%) had good INP
- 49.2% of origins (↑ 1.6%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## June 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/olSKxclnD40)

**Publication date**

- July 9, 2024

**What's new**

- This month we saw a good increase in Core Web Vitals pass rates across all metrics---a reverse of the slight regression we saw last month. If you've followed us carefully you'll be aware that some of the shifts may be seasonal, for example, in [July 2023 we also saw a decrease in the number of origins](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/AaW8rohYfHk), and an increase in pass rates for the Core Web Vitals.
- The Chrome team has been continuing work on improving efficiencies in Chrome's handling of the Core Web Vitals metrics and recently [launched some changes to INP](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2024_07_inp.md), most notably to better handle use of the basic modal dialogs ([alert](https://developer.mozilla.org/docs/Web/API/Window/alert), [confirm](https://developer.mozilla.org/docs/Web/API/Window/confirm), [print](https://developer.mozilla.org/docs/Web/API/Window/print)). While technically these are synchronous and block the main thread---and so are not recommended if there are alternatives---they do present user feedback for an interaction. They were previously not counted as presentation feedback for INP, which could result in very high INP values for sites that did use these. From Chrome 127 the presentation of the modal will mark the end measurement time for INP and so should lead to improved INP times for those sites.
- [As previously mentioned](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/Otq9hycQva4), we're planning to remove the [Effective Connection Type (ECT) dimension](https://developer.chrome.com/docs/crux/methodology/dimensions.md.txt#ect-dimension) from CrUX in September 2024. With this release, we're including a preview of the new `round_trip_time` (RTT) metric in the CrUX API, which measures network latency. See [our announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/olSKxclnD40) for details.
- And finally, as a reminder, FID is deprecated and will be [removed from Chrome tools in September 2024](https://web.dev/blog/inp-cwv-launch#fid_deprecation_timeline). Make sure you update any CrUX API applications to switch over to INP by then.

**Notable stats**

- 18,442,199 origins (↓ 1.2%)
- 63.4% of origins (↑ 2.0%) had good LCP
- 77.8% of origins (↑ 0.5%) had good CLS
- 84.1% of origins (↑ 1.1%) had good INP
- 48.4% of origins (↑ 2.6%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## May 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/Otq9hycQva4)

**Publication date**

- June 11, 2024

**What's new**

- We have seen a slight regression in LCP this month, which has affected the overall Core Web Vitals pass rate. This seems to have particularly affected mobile scores (desktop LCP scores are actually slightly up). We've been unable to find a specific reason for this change, but this does come on the back of an impressive run of form with this only being the second negative month in the last year. So at this stage we're not concerned with this slight drop this month.
- We want to give you advance notice for a change we are considering to make in three months (for the September 10th release). **We are looking to drop the [Effective Connection Type (ECT)](https://developer.chrome.com/docs/crux/methodology/dimensions.md.txt#ect-dimension) dimension** since it is proving less useful as more and more internet traffic has moved to the wide-ranging 4G bucket. Having this as a dimension leads to other issues including a reduced coverage for origins and data. However, we do think measuring latencies on the web is important and are investigating replacement options, but as a metric rather than a dimension (so the other metrics will no longer be able to be queried by ECT). We would like to receive feedback from the current users of this data to understand how impactful this would be and if we need to consider more time for the migration. Let us know by responding to this email if you would be impacted by this change.

**Notable stats**

- 18,673,241 origins (↓ 0.2%)
- 62.1% of origins (↓ 0.5%) had good LCP
- 77.4% of origins (\~ 0.0%) had good CLS
- 83.2% of origins (↑ 0.5%) had good INP
- 47.1% of origins (↓ 0.3%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## April 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/QJPxG8PF-bM)

**Publication date**

- May 14, 2024

**What's new**

- No significant updates in this release.

**Notable stats**

- 18,703,230 origins (↑ 0.2%)
- 62.4% of origins (↑ 0.3%) had good LCP
- 77.5% of origins (↑ 0.4%) had good CLS
- 82.8% of origins (↑ 0.8%) had good INP
- 47.3% of origins (↑ 1.1%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## March 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/mVtFRV_mkWw)

**Publication date**

- April 09, 2024

**What's new**

- All metrics have seen a good improvement this month, more than making up for [last month's small declines](https://developer.chrome.com/docs/crux/release-notes.md.txt#202402). This is particularly apparent on mobile.
- We're aware of a two changes which resulted in INP improvements for a large number of sites this month:
  - The Chrome Android team have made improvements to cookie caching, which saw noticeable improvements to INP and LCP. We think this was a large factor in the improvements we have seen this month.
  - The team at Google have been working with a number of Consent Management Platforms (including OneTrust, Complianz and Axeptio), to improve INP by yielding more often---particularly when cookies are accepted. This has resulted in [much improved INP for sites using these platforms](https://lookerstudio.google.com/s/nh_5q5e7MWc).
- This month we are pleased to announce that we have added navigation type breakdowns to CrUX. By exposing the navigation type breakdown, we hope to encourage site owners to be more aware of the navigation types used on their sites, and look to encourage some of the faster types by looking at caching setup, bfcache blockers, and prerendering. For more details are available in the [navigation types announcement post](https://developer.chrome.com/blog/crux-navigation-types.md.txt).
- We have also changed the [CrUX API](https://developer.chrome.com/docs/crux/api.md.txt) and [CrUX History API](https://developer.chrome.com/docs/crux/history-api.md.txt) to always round floating point numbers to 4 decimal places.

**Notable stats**

- 18,669,191 origins (↓ 0.3%)
- 62.2% of origins (↑ 1.5%) had good LCP
- 77.1% of origins (↑ 0.6%) had good CLS
- 82.1% of origins (↑ 1.8%) had good INP
- 46.8% of origins (↑ 2.6%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)---a reminder this is now measured based on INP and not FID.

## February 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/Wg2Wqq6u3QI)

**Publication date**

- March 12, 2024

**What's new**

- The big news this month is that [INP is replacing FID from today as a Core Web Vital metric](https://web.dev/blog/inp-cwv-launch). This will be the last month that we report the FID numbers in these announcement reports. Tooling such as [PageSpeed Insights](https://pagespeed.web.dev/) and the [CWVTech Report](https://cwvtech.report/) have been switched over to use INP when measuring Core Web Vitals pass rates using CrUX from today. FID should be considered deprecated now and will be removed from the Chrome tools, including CrUX, on 9th September 2024.
- We have regressed in most of the metrics this month by small amounts. We have not been able to ascertain any particular reason for this, and overall the metrics are still up from 2 months ago and previous, so we are treating these as more a slight "return to norm" of last month's impressive improvements rather than anything to be concerned about.

**Notable stats**

- 18,583,879 origins (↑ 0.8%)
- 48.8% of origins (↓ 0.4%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals) when using FID
- 45.6% of origins (↓ 0.4%) had good Core Web Vitals when using INP in place of FID as will be the case from today onwards.

## January 2024

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/Dq2fTJ7Usw4)

**Publication date**

- February 13, 2024

**What's new**

- The seasonal drop in origins from December has fully recovered.

**Notable stats**

- 18,583,729 origins (↑ 7.3%)
- 49.0% of origins (↑ 2.2%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)
- 45.8% of origins (↑ 3.0%) had good Core Web Vitals when [using INP in place of FID as will happen on March 12, 2024](https://web.dev/blog/inp-cwv-march-12).

## December 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/ccLG1dCw8DI)

**Publication date**

- January 09, 2024

**What's new**

- Most metrics improved this month with the exception of a very slight decrease in FID and INP. Increases and decreases in pass rates were most likely impacted by the larger than usual swing in origins this month rather than any changes that we are aware of. Such a swing in origins is usual for December.
- We are releasing a `form_factors` metric for the [CrUX API](https://developer.chrome.com/docs/crux/api.md.txt) and the [CrUX History API](https://developer.chrome.com/docs/crux/history-api.md.txt). This metric is reported when `formFactor` is not specified as an input, that is, when requesting statistics for the overall origin or URL. In this case, we report the fraction of the page loads in the CrUX dataset that came from desktop, phone, and tablet---and in the CrUX History API we report a timeseries of these fractions. We think this data is often useful for further understanding the changes in overall performance of a site over time and for identifying opportunities. Note that in CrUX BigQuery, this information was already available (e.g. see `[desktop|phone|tablet]Density` in the `metrics_summary` table) and the [CrUX Dashboard](https://developer.chrome.com/docs/crux/dashboard.md.txt) displays the desktop / phone / tablet fractions in its "Device Distribution" page.

**Notable stats**

- 17,323,447 origins (↓ 5.2%)
- 48.0% of origins (↑ 1.2%) had good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)
- 44.4% of origins (↑ 1.1%) had good Core Web Vitals when [using INP in place of FID as will happen from March 2024](https://web.dev/blog/inp-cwv).

## November 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/Gqz5gw3JYC4)

**Publication date**

- December 11, 2023

**What's new**

- More improvements across most of the metrics this month, though this time we're not aware of any particular changes to attribute this to.
- Our [documentation](https://developer.chrome.com/docs/crux.md.txt) has moved to new infrastructure, [similar to the web.dev move in October](https://web.dev/blog/webdev-migration). A huge benefit of this is that the CrUX documentation (and all other Chrome documentation) is available in 20 additional languages through machine translation, opening it up to many more people. [Raise an issue](https://issuetracker.google.com/issues/new?component=1400036&template=1897236) if you spot any problems with this site move.

**Notable stats**

- 18,265,721 origins
- 47.4% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)
- 43.9% of origins have good Core Web Vitals when [using INP in place of FID as will happen from March 2024](https://web.dev/blog/inp-cwv).

## October 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/vHNwpu_IR34)

**Publication date**

- November 14, 2023

**What's new**

- We're again seeing continual improvements likely due to the final rollout of the [front end improvements to LCP started in August](https://developer.chrome.com/docs/crux/release-notes.md.txt#202308) which particularly affected LCP (up a further 1.5% this month) and CLS (up 1.6%)

**Notable stats**

- 18,383,755 origins
- 46.9% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)
- 43.4% of origins have good Core Web Vitals when [using INP in place of FID as will happen from March 2024](https://web.dev/blog/inp-cwv).

## September 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/w48sCWw8IfA)

**Publication date**

- October 10, 2023

**What's new**

- We're again seeing continual improvements across most of the metrics despite the fact that FCP and TTFB actually had slight downturns. This suggests that the [front end improvements to LCP mentioned last month](https://developer.chrome.com/docs/crux/release-notes.md.txt#202308) which were still rolling out during September, likely more than counter acted these downturns.
- One thing not mentioned last month until we saw the impact, was that WordPress had [a number of improvements](https://make.wordpress.org/core/2023/08/07/wordpress-6-3-performance-improvements/) in the latest release, in particular [for LCP images](https://make.wordpress.org/core/2023/07/13/image-performance-enhancements-in-wordpress-6-3/). This looks to have resulted in a [measurable boost for WordPress sites compared to the web as a whole](https://lookerstudio.google.com/reporting/55bc8fad-44c2-4280-aa0b-5f3f0cd3d2be/page/M6ZPC?params=%7B%22df33%22:%22include%25EE%2580%25800%25EE%2580%2580IN%25EE%2580%2580ALL%22,%22df46%22:%22include%25EE%2580%25800%25EE%2580%2580IN%25EE%2580%2580mobile%22%7D) and, given it is used on about a third of the sites in the CrUX dataset, also would help explain the further improvement in LCP.
- While on the subject of LCP, Chrome 117 had [a bug whereby LCP may have been incorrect for some SPA applications when observed using Web APIs](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2023_10_lcp.md). This bug did not affect CrUX, nor Google Search Console data which is fed from CrUX. It has been fixed for Chrome 118 which started rolling out last week. If you noticed a large increase in LCP in your RUM solutions then this may have been the reason why.

**Notable stats**

- 18,405,462 origins
- 45.7% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)
- 42.1% of origins have good Core Web Vitals when [using INP in place of FID as will happen from March 2024](https://web.dev/blog/inp-cwv).

## August 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/CJT8_DbO9DU)

**Publication date**

- September 12, 2023

What's new
:   We're seeing continual improvements across most of the metrics which seem to be driven by the following changes:

    - Chrome [started rolling out a change to increase image priority from low to medium for the first 5 images](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2023_08_image_loading.md) which may have improved LCP and CLS (testing showed less impact on LCP, and more on CLS).
    - Chrome made a change for LCP for animated image formats (for example, GIFs) which now measure [the first frame rather than the full image load time as the LCP time](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2023_08_lcp.md#animated-images). This is expected to improve the LCP for the small number of sites that have animated images as LCP elements.
    - Chrome made another change for LCP whereby [video elements are now considered as LCP element candidates](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2023_08_lcp.md#videos). Previously they were only considered with a poster image. As videos are typically larger resources to download, this is expected to deteriorate the LCP for the small number of sites that have videos as LCP elements.
:   Note that all of these changes are still rolling out so the full effect of all these changes has not been seen yet and hopefully we will see further improvements next month too.
:   On a less positive note, INP pass rates remained static, showing it's a more tricky metric to optimize for.

**Notable stats**

- 18,263,523 origins
- 45.3% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)
- 41.6% of origins have good Core Web Vitals when [using INP in place of FID as will happen from March 2024](https://web.dev/blog/inp-cwv).

## July 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/76V2bzaidBk)

**Publication date**

- August 8, 2023

**What's new**

- As noted last month, we made progress on origins with redirects on their root page not showing in CrUX and since then we resolved the last of the known issues, and this month, no origins should be excluded for this reason.
- As warned in the last few releases, we have now removed the experimental prefixed Interaction to Next Paint metric from CrUX BigQuery, API, and History API. Users need to use the non-prefixed field to access this metric.

**Notable stats**

- 17,976,663 origins
- 44.6% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## June 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/AaW8rohYfHk)

**Publication date**

- July 11, 2023

**What's new**

- We are pleased to announce that we have finally made progress on the long-standing root page redirect issue [mentioned last month](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/13hl37E28RE). Some origins which redirect their root page, and were therefore excluded from CrUX due to our lack of handling this properly, should now start to be included again from this month. Note that some origins are still being resolved, so not all origins are in this month's dataset. However, it is great that we have made some good progress on this now and we hope to have the issue fully resolved in the near future.
- This is the last month that the INP metric will be available in the CrUX BigQuery, API, and History API both with and without the experimental prefix. We encourage users to move to the non-prefixed field, as the experimental prefix fields should now be considered deprecated and will be removed in 30 days.

**Notable stats**

- 18,065,718 origins
- 44.1% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## May 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/13hl37E28RE)

**Publication date**

- June 13, 2023

**What's new**

- We're seeing a slight decrease again this month for LCP and FCP due to the final roll outs of the [change in LCP to ignore low-entropy images](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2023_04_lcp.md) and [correction in paint timing](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2023_03_lcp_fcp.md) discussed last month. However, despite this, the overall good LCP, FID, and CLS rates are up slightly from last month.
- We are aware that some origins that redirect their root page (for example, https://www.example.com that automatically redirects to https://www.example.com/en/) are not showing origin-level data in CrUX, and so are also not appearing in the BigQuery dataset. We're also aware that this has been going on for some time. Unfortunately, this is proving a difficult issue to resolve, and so we still don't have an estimated time of when this will be fixed.

**Notable stats**

- 18,377,791 origins
- 43.6% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## April 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/_1ja3Bg-3Ow)

**Publication date**

- May 10, 2023

**What's new**

- We're seeing a slight decrease in pass rates for the Core Web Vitals, especially for LCP due in part to [a change in LCP to ignore low-entropy images](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2023_04_lcp.md). We also see a decrease in FCP pass rates [due to correction in paint timing](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2023_03_lcp_fcp.md) (which also affects LCP but to a lesser extent).
- On a more positive note, the [INP](https://web.dev/articles/inp) pass rate continues to improve with a further increase of 0.2%. This is especially important, as we are [moving this metric from an Experimental metric to a Pending metric](https://web.dev/blog/inp-cwv), and it will join the reset of the Core Web Vitals next year.
- From this release, the INP metric is available in the [CrUX BigQuery](https://developer.chrome.com/docs/crux/bigquery.md.txt), [API](https://developer.chrome.com/docs/crux/api.md.txt), and [History API](https://developer.chrome.com/docs/crux/history-api.md.txt), both with and without the experimental prefix. We encourage users to move to the non-prefixed field, as the experimental prefix fields should now be considered deprecated and will be removed in 90 days.

**Notable stats**

- 18,406,973 origins
- 43.5% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## March 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/1hHxnk9ZOCk)

**Publication date**

- April 11, 2023

**Notable stats**

- 18,495,210 origins
- 44.2% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## February 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/1im_J9824AU)

**Publication date**

- March 14, 2023

**What's new**

- We're seeing further improvements to the good [INP](https://web.dev/inp) rate which has increased by 2.3% to 77.3% of origins due to [the improvement in the Chrome scheduler](https://bugs.chromium.org/p/chromium/issues/detail?id=853771) mentioned last month, which was still rolling out during February.

**Notable stats**

- 18,184,396 origins
- 43.1% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## January 2023

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/ImlvxIZ8Jss)

**Publication date**

- February 14, 2023

**What's new**

- Good [INP](https://web.dev/inp) increased by 4.3% to 75.6% of origins, primarily due to [an improvement in the Chrome scheduler](https://bugs.chromium.org/p/chromium/issues/detail?id=853771). The next frame is now scheduled with highest priority after discrete input events, which shortens the lag between input event and visual update.
- This month we've launched a [CrUX History API](https://developer.chrome.com/docs/crux/history-api.md.txt), which provides 25 weeks of historical data at both origin and URL level. We've [written a post](https://developer.chrome.com/blog/chrome-ux-report-history-api) detailing how to use this new API, and a [Colab](https://colab.sandbox.google.com/github/GoogleChrome/CrUX/blob/main/colab/crux-history-api.ipynb) showing you an example of how to plot this historical data in various graphs.

**Notable stats**

- 18,203,637 origins
- 43.0% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## December 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/T0TDE_VCWTE)

**Publication date**

- January 10, 2023

**What's new**

- No significant updates in this release.

**Notable stats**

- 16,824,271 origins
- 41.8% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## November 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/-LcubQclVAg)

**Publication date**

- December 13, 2022

**What's new**

- No significant updates in this release.

**Notable stats**

- 17,618,944 origins
- 41.8% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## October 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/DmTmMHll7_o)

**Publication date**

- November 8, 2022

**What's new**

- In this release we have further broken down our "rank" popularity. Previously these were in groupings of log 10 (i.e. top 1,000 sites, top 10,000, top 100,000 sites, ... up to top 100 million sites). From this release these are provided in half-rank steps (i.e. top 1,000 sites, top 5,000 sites, top 10,000, top 50,000 sites, top 100,000 sites, top 500,000 sites... up to top 100 million sites). The top rank (1,000) won't be altered with this change (i.e. we are not providing a top 500 rank).

**Notable stats**

- 17,637,195 origins
- 41.6% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## September 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/lH-zHX-ao4E)

**Publication date**

- October 11, 2022

**What's new**

- The CrUX API now includes `collectionPeriod` object showing what day's data is included in the response as shown. More details in the [CrUX API docs](https://developer.chrome.com/api#collection-period).

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

**Notable stats**

- 17,715,277 origins
- 41.4% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## August 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/xKHFbog7-9w)

**Publication date**

- September 13, 2022

**Notable stats**

- 16,754,655 origins
- 40.7% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## July 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/N5B3F9QVOmY)

**Publication date**

- August 9, 2022

**What's new**

- This release includes a change which records the CLS metric when the tab is backgrounded in addition to tab close. See the [CLS changelog](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2021_11_cls.md) for details.
- We have identified a bug in our origin filtering which unfortunately affects a small number of origins, including some popular ones, which are missing from this release. We hope to get this fixed for future releases.

**Notable stats**

- 16,190,453 origins
- 40.6% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## June 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/_DiKAAqqKPE)

**Publication date**

- July 13, 2022

**What's new**

- The number of origins covered by the CrUX dataset increases once again in this release due to the optional dimensions feature introduced in the previous release. We expect the size to be much more stable from here.

**Notable stats**

- 16,230,572 origins
- 41.3% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## May 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/A_LAY_lYxQk)

**Publication date**

- June 14, 2022

**What's new**

- The percentage of origins having good LCP experiences increased this month by 2.4%, thanks in large part to an improvement in the [performance of Chrome on Android](https://blog.chromium.org/2022/03/a-new-speed-milestone-for-chrome.html#:%7E:text=Chrome%20continues%20to%20get%20faster%20on%20Android%20as%20well.%20Loading%20a%20page%20now%20takes%2015%25%20less%20time%2C%20thanks%20to%20prioritizing%20critical%20navigation%20moments%20on%20the%20browser%20user%20interface%20thread.). This was a major contributing factor to the percentage of origins having good Core Web Vitals increasing by 2.1%.
- With this release, CrUX records no longer require effective connection type and form factor, so we're including data for which these fields are `NULL`, indicating all effective connection types or form factors, respectively. This allows us to increase origin coverage by 28.2%.
- An unrelated issue with our data pipeline prevents us from adding new origins in this release, so we're only including origins for which we published data in the previous 6 months. Due to this, `experimental.popularity.rank` has some gaps. For example, there are only 904 origins in the top 1,000. This is unique to the 202205 release and should be fixed next month.

**Notable stats**

- 11,024,795 origins
- 42% of origins have good Core Web Vitals

## April 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/v-h5gKkUEE0)

**Publication date**

- May 3, 2022

**What's new**

- This release includes `experimental.interaction_to_next_paint`, our updated responsiveness metric.
- `experimental_interaction_to_next_paint` in the CrUX API, with thresholds 200ms and 500ms.
- `experimental_time_to_first_Byte` in the CrUX API, with thresholds 800ms and 1800ms.

**Notable stats**

- 8,602,902 origins
- 41.2% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## March 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/kiuJANLYwYQ)

**Publication date**

- April 12, 2022

**What's new**

- No significant updates in this release.

**Notable stats**

- 8,555,307 origins
- 39.6% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## February 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/F7S4_emZkcw)

**Publication date**

- March 8, 2022

**What's new**

- This release includes `experimental.responsiveness`, our candidate for the new responsiveness metric. See [web.dev/blog/responsiveness](https://web.dev/blog/responsiveness) for details.

**Notable stats**

- 8,764,246 origins
- 39.0% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## January 2022

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/n7aPXCGtjPA)

**Publication date**

- February 8, 2022

**What's new**

- Last month, Chrome broadly [rolled out the back/forward cache in Chrome 97](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2022_01_bfcache.md). These changes helped to improve the CLS pass rate by 4.4%, due to fewer layout shifts during page load. Similarly, we also saw a 2.4% improvement to LCP. These improvements are reflected in the percentage of origins having good Core Web Vitals increasing by 7.4%.

**Notable stats**

- 8,934,350 origins
- 37.6% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## December 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/rGrZuEZTbTM)

**Publication date**

- January 11, 2022

**What's new**

- No significant updates in this release.

**Notable stats**

- 8,398,796 origins
- 35.0% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## November 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/yXLokgqHBj8)

**Publication date**

- December 14, 2021

**What's new**

- We've removed the old CLS metric: `experimental.uncapped_cumulative_layout_shift` is no longer in this BigQuery release, and CrUX API no longer serves `experimental_uncapped_cumulative_layout_shift`. Use the current CLS metric instead.
- An LCP fix rolled out with M96.

**Notable stats**

- 8,733,078 origins
- 34.8% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## October 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/T5u0UPzOqjg)

**Publication date**

- November 9, 2021

**What's new**

- No significant updates in this release.

**Notable stats**

- 8,784,894 origins
- 34.1% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## September 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/zPCVi-TEguk)

**Publication date**

- October 12, 2021

**What's new**

- There was a [change to FCP](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2021_07_fcp.md) in Chrome that ignores content with a style of opacity:0, increasing the user-perceived accuracy of the metric. Read more about it in the Chrome Speed change log.

**Notable stats**

- 8,660,068 origins
- 32.8% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## August 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/GNkuNGVNaCA)

**Publication date**

- September 14, 2021

**What's new**

- No significant updates in this release.

**Notable stats**

- 8,431,699 origins
- 31.3% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## July 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/4rkDpuzInmA)

**Publication date**

- August 10, 2021

**What's new**

- No significant updates in this release.

**Notable stats**

- 8,174,923 origins
- 30.4% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## June 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/CvHQXQBbStA)

**Publication date**

- July 13, 2021

**What's new**

- [Changes to the FID metric](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2021_05_fid.md) took effect in Chrome 91, resulting in improved FID experiences involving double-tap-to-zoom on mobile.

**Notable stats**

- 8,416,608 origins
- 30.6% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## May 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/tjakkbenFZo)

**Publication date**

- June 8, 2021

**Notable stats**

- 8,411,670 origins
- 29.23% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

Notable Changes
- The BigQuery update 202105 includes the same CLS and LCP updates that we released on June 1 for the CrUX API (see below). The previous CLS metric will be available for a limited time as `experimental.uncapped_cumulative_layout_shift`.

API Update
:   June 1, 2021

Notable Changes
- The new [Cumulative Layout Shift definition](https://web.dev/articles/evolving-cls) is now the default metric surfaced as `cumulative_layout_shift`, the previous Cumulative Layout Shift metric will be available for a limited time as it is phased out as `experimental_uncapped_cumulative_layout_shift`.
- [Largest Contentful Paint](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2020_11_lcp_2.md) has undergone adjustments in recent Chrome versions and has been updated similarly in CrUX.
- First Contentful Paint tri-binning thresholds have been updated to be: \[0-1.8s\], (1.8s-3s), \[3s-∞\].

## April 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/wQyI4jUJlYQ)

**Publication date**

- May 11, 2021

**Notable stats**

- 8,423,302 origins
- 25.83% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## March 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/fyUSl0--9Z8v)

**Publication date**

- April 13, 2021

**Notable stats**

- 8,326,310 origins
- 24.81% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## February 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/fyUSl0--9Z8)

**Publication date**

- March 9, 2021

**What's new**

- Coarse origin ranking data will be available in the CrUX dataset on BigQuery, starting in the February 2021 (202102) release. With this feature, we'll be able to unlock new insights into the aggregate user experiences of the head, torso, and tail of the web. All origins in the global and per-country tables will be assigned rank magnitude values under the experimental namespace, experimental.popularity.rank. Values will be powers of 10, starting with the top 1,000, then 10,000, 100,000... For example, a rank magnitude of 10,000 means that an origin is among the top 10,000 most visited origins in the dataset ([learn more](https://developers.google.com/web/updates/2021/03/crux-rank-magnitude)).
- Tell us what you think of this new feature. We welcome your feedback on the [CrUX discussion forum](https://groups.google.com/a/chromium.org/g/chrome-ux-report).

**Notable stats**

- 8,264,371 origins
- 21.98% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## January 2021

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/Kt1rNLZP3DA)

**Publication date**

- February 10, 2021

**Notable stats**

- 8,185,540 origins
- 23.71% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## December 2020

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/_yJ6tuEcmbI)

**Publication date**

- January 12, 2021

**Notable stats**

- 7,629,156 origins
- 23.4% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## November 2020

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/fb1jtGoXpuw)

**Publication date**

- December 8, 2020

**What's new**

- As of December 3, PageSpeed Insights (web and API) is [sourcing its field data from the CrUX API](https://groups.google.com/g/pagespeed-insights-discuss/c/by9-TbqdlBM/m/Ovgg_o22AAAJ), bringing the tools closer in alignment.
- We rolled out a small [accuracy improvement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/vOlMzdG-uGo) to metrics' 75th percentiles in the CrUX API.
- The API results were [frozen](https://twitter.com/ChromeUXReport/status/1332746842254217217) for a few days at the end of November and the issue has since been fixed.

**Notable stats**

- 7,942,408 origins
- 23.5% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## October 2020

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/7npqg6mxmoY/m/CHrR0FnZAQAJ)

**Publication date**

- November 10, 2020

**What's new**

- A [CLS issue in Chrome 86](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2020_10_cls.md) may cause regressions in CLS scores:

**Notable stats**

- 8,050,755 origins
- 23.7% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## September 2020

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/oYDHMLZ76yA/m/dXwvBlNEAwAJ)

**Publication date**

- October 13, 2020

**What's new**

- No major changes in this release!

**Notable stats**

- 7,937,088 origins
- 24.6% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## August 2020

[Announcement](https://groups.google.com/a/chromium.org/g/chrome-ux-report-announce/c/vXXUE6qslKU/m/O6tjPcUtBAAJ)

**Publication date**

- September 9, 2020

**What's new**

- There was a bump in origin coverage this month (+3.3%) due in part to a data pipeline change. Previously, for a user experience record to be included in the dataset, it must have included FP, DCL, and OL measurements. Now, the only required metric is FCP. This change helps to ensure that we're capturing more meaningful user experiences.

**Notable stats**

- 7,773,359 origins
- 24.9% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## July 2020

[Announcement](https://groups.google.com/a/chromium.org/d/msg/chrome-ux-report-announce/Es5ilJvNrqg/9S-FzC2uBgAJ)

**Publication date**

- August 11, 2020

**What's new**

- No major changes in this release!

**Notable stats**

- 7,527,878 origins
- 25.2% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## June 2020

[Announcement](https://groups.google.com/a/chromium.org/d/topic/chrome-ux-report/yS-z15V7W48/discussion)

**Publication date**

- July 14, 2020

**What's new**

- User experiences served from Google's AMP cache are now attributed to the publisher's origin in CrUX. Effects will vary depending on the amount of AMP cache traffic relative to the rest of the website, but most origins see less than a 5 percentage point change in Core Web Vitals performance, with most effects being positive.

**Notable stats**

- 7,501,835 origins
- 25.34% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## May 2020

[Announcement](https://groups.google.com/a/chromium.org/d/topic/chrome-ux-report/m3fOLE4kx4s/discussion)

**Publication date**

- June 9, 2020

**What's new**

- There were two [LCP updates](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2020_05_lcp.md), which should have a minimal effect on most origins
- There was one [FID update](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2020_05_fid.md), which may result in some sites observing faster FID experiences

**Notable stats**

- 7,103,486 origins
- 23.77% of origins have good [Core Web Vitals](https://web.dev/articles/vitals#core-web-vitals)

## April 2020

[Announcement](https://groups.google.com/a/chromium.org/forum/#!topic/chrome-ux-report-announce/nFh_M7lbUPM)

**Publication date**

- May 12, 2020

**What's new**

- There was a [small improvement](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2020_04_lcp.md) to the way LCP is measured in M81. This may manifest itself in your CrUX data as a slight shift in slower LCP or in rare cases too few LCP samples to include for your origin.
- Introducing [Web Vitals](https://blog.chromium.org/2020/05/introducing-web-vitals-essential-metrics.html)! CrUX is committed to providing you with all of your Core Web Vital metrics to give you an accurate picture of how real users experience the web.
- Do you query data on a per-country basis? Give the new [`experimental.country`](https://console.cloud.google.com/bigquery?p=chrome-ux-report&d=experimental&t=country&page=table) table a try! It's optimized to make querying across country and monthly datasets easier.

**Notable stats**

- 6,389,861 origins

## March 2020

[Announcement](https://groups.google.com/a/chromium.org/forum/#!topic/chrome-ux-report-announce/PnEMrAcBJwE)

**Publication date**

- April 14, 2020

**What's new**

- CLS histogram start and end values changed from `INT64` to `NUMERIC` type and divided by 100. This change aligns CLS with the fractional layout shift values provided by the [Layout Instability API](https://github.com/WICG/layout-instability).

**Notable stats**

- 5,937,298 origins

## February 2020

**Publication date**

- March 10, 2020

**Notable stats**

- 6,366,736 origins

## January 2020

**Publication date**

- February 11, 2020

**What's new**

- Experimental metric on [notification permission acceptance rates](https://developers.google.com/web/updates/2020/02/notification-permission-data-in-crux)

**Notable stats**

- 5,976,293 origins

## December 2019

**Notable stats**

- 5,532,155 origins

## November 2019

**Notable stats**

- 5,821,306 origins

**What's new**

- The [FID](https://developer.chrome.com/docs/crux/methodology.md.txt#fid-metric) metric was moved from `experimental.first_input_delay` to `first_input.delay`
- The [CLS](https://developer.chrome.com/docs/crux/methodology.md.txt#cls-metric) metric was moved from `experimental.cumulative_layout_shift` to `layout_instability.cumulative_layout_shift`

## October 2019

**Notable stats**

- 5,752,729 origins

## September 2019

**Notable stats**

- 6,008,004 origins

**What's new**

- The [LCP](https://developer.chrome.com/docs/crux/methodology.md.txt#lcp-metric) metric was launched as `largest_contentful_paint`
- [CLS](https://developer.chrome.com/docs/crux/methodology.md.txt#cls-metric) was updated to take [move distance](https://github.com/WICG/layout-instability/blob/main/README.md#distance-fraction) into account. Coverage may be lower while Chrome users upgrade to the latest version of the Layout Instability API

## August 2019

**Notable stats**

- 6,011,463 origins

**What's new**

- [FID](https://developer.chrome.com/docs/crux/methodology.md.txt#fid-metric) coverage has returned to normal
- The average percent of fast experiences for most metrics dropped by about 2%, this appears to be due to a [bug in Chrome](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2019_12_fcp.md)

## July 2019

**Notable stats**

- 5,612,504 origins

**What's new**

- There was an [incremental update](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/2019_07_fid.md) to Chrome's [FID](https://developer.chrome.com/docs/crux/methodology.md.txt#fid-metric) implementation, which included pointer events on mobile. Coverage will be lower while Chrome users update to the latest version

## June 2019

**Notable stats**

- 5,624,797 origins

**What's new**

- The [TTFB](https://developer.chrome.com/docs/crux/methodology.md.txt#ttfb-metric) metric was added to the list of experimental metrics as `experimental.time_to_first_byte`

## May 2019

**Notable stats**

- 5,884,155 origins

**What's new**

- The [CLS](https://developer.chrome.com/docs/crux/methodology.md.txt#cls-metric) metric was added to the list of experimental metrics as `experimental.cumulative_layout_shift`

## April 2019

**Notable stats**

- 5,744,982 origins

**What's new**

- There was an incremental update to Chrome's [FID](https://developer.chrome.com/docs/crux/methodology.md.txt#fid-metric) implementation. Coverage will be lower while Chrome users update to the latest version

## March 2019

**Notable stats**

- 5,703,255 origins

**What's new**

- There was an incremental update to Chrome's [FID](https://developer.chrome.com/docs/crux/methodology.md.txt#fid-metric) implementation. Coverage will be lower while Chrome users update to the latest version

## February 2019

**Notable stats**

- 5,464,560 origins

## January 2019

**Notable stats**

- 5,351,287 origins

## December 2018

**Notable stats**

- 4,654,112 origins

## November 2018

**Notable stats**

- 4,697,003 origins

## October 2018

**Notable stats**

- 4,374,729 origins

## September 2018

**Notable stats**

- 4,375,805 origins

## August 2018

**Notable stats**

- 4,386,422 origins

**What's new**

- Histogram bins have been normalized to consistent widths ([more info](https://twitter.com/ChromeUXReport/status/1042443549676064768))

## July 2018

**Notable stats**

- 4,202,945 origins

## June 2018

**Notable stats**

- 4,134,123 origins

**What's new**

- The [FID](https://developer.chrome.com/docs/crux/methodology.md.txt#fid-metric) metric was added to the list of experimental metrics as `experimental.first_input_delay` ([learn more](https://developers.google.com/web/updates/2018/07/first-input-delay-in-crux))

## May 2018

**Notable stats**

- 4,162,633 origins

## April 2018

**Notable stats**

- 3,970,181 origins

## March 2018

**Notable stats**

- 3,589,954 origins

## February 2018

**Notable stats**

- 3,237,524 origins

## January 2018

**Notable stats**

- 3,086,603 origins

**What's new**

- Added [country dimension](https://developers.google.com/web/updates/2018/01/crux)

## December 2017

**Notable stats**

- 1,939,945 origins

## November 2017

**Notable stats**

- 1,237,407 origins

**What's new**

- Expanded dataset with [1M+ origins](https://developers.google.com/web/updates/2017/12/crux)

## October 2017

**Notable stats**

- 10,000 origins

**What's new**

- [Chrome User Experience Report beta preview](https://blog.chromium.org/2017/10/introducing-chrome-user-experience-report.html) is launched at Chrome Dev Summit
