---
source_url: https://web.dev/articles/lcp-lazy-loading
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: 14186f59472dd13310e0bfde4ccc9d55c69c9fd5338949a1e1146048f0d87f12
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Data-driven advice for lazy loading images with Core Web Vitals in mind.

Felix Arntz [X](https://twitter.com/felixarntz) [Homepage](https://felix-arntz.me) Rick Viscomi [GitHub](https://github.com/rviscomi) [Bluesky](https://bsky.app/profile/rviscomi.dev) [Homepage](https://web.dev/rviscomi.dev/)

Lazy loading is a technique that defers downloading a resource until it's needed, to conserve data and reduce network contention for critical assets. It became a web standard in [2019](https://web.dev/articles/browser-level-image-lazy-loading.md.txt) and today `loading="lazy"` for images is [supported](https://caniuse.com/loading-lazy-attr) by most major browsers.

This guide summarizes how publicly available web transparency data and ad hoc A/B testing was analyzed to understand the adoption and performance characteristics of browser-level image lazy loading. The findings included that lazy loading can be an amazingly effective tool for reducing unneeded image bytes, but overuse can negatively affect performance. Concretely, this analysis shows that more eagerly loading images within the initial viewport---while liberally lazy loading the rest---can give us the best of both worlds: fewer bytes loaded and improved [Core Web Vitals](https://web.dev/articles/vitals/core-web-vitals).

## Adoption

According to the most recent data in [HTTP Archive](https://httparchive.org/), built-in image lazy loading is used by [29%](https://httparchive.org/reports/state-of-images#imgLazy) of websites and adoption is growing rapidly.
Breakdown of the types of websites that make use of browser-level image lazy loading. _([Source](https://gist.github.com/rviscomi/44d80c1a0f4dec9cbafb37347c770278#file-lazy-loading-wp-cms-sql))_.

[Querying](https://gist.github.com/rviscomi/44d80c1a0f4dec9cbafb37347c770278#file-lazy-loading-wp-cms-sql) the raw data in the HTTP Archive project gives us a clearer understanding of what kinds of websites are driving adoption: 84% of sites that use browser-level image lazy loading use WordPress, 2% use another CMS, and the remaining 14% don't use a known CMS. These results make clear how [WordPress is leading the charge](https://make.wordpress.org/core/2020/07/14/lazy-loading-images-in-5-5/) in adoption.
Breakdown of the types of websites that make use of browser-level image lazy loading. _([Source](https://gist.github.com/rviscomi/44d80c1a0f4dec9cbafb37347c770278#file-lazy-loading-wp-cms-timeseries-sql))_.

The [rate of adoption](https://gist.github.com/rviscomi/44d80c1a0f4dec9cbafb37347c770278#file-lazy-loading-wp-cms-timeseries-sql) is also worth noting. One year ago in July 2020, WordPress sites that use lazy loading made up tens of thousands websites in the corpus of about 6 million (1% of total). Lazy loading adoption in WordPress alone has since grown to over 1 million websites (14% of total).

## Correlational performance

[Digging deeper](https://gist.github.com/rviscomi/44d80c1a0f4dec9cbafb37347c770278#file-lazy-loading-crux-lcp-sql) into HTTP Archive, it can be compared how pages with and without browser-level image lazy loading perform with the [Largest Contentful Paint (LCP) metric](https://web.dev/articles/lcp.md.txt). The LCP data comes from real-user experiences from the [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux) as opposed to synthetic testing in the lab. The following chart uses a box-and-whisker plot to visualize the distributions of each pages' 75th percentile LCP: the lines represent the 10th and 90th percentiles and the boxes represent the 25th and 75th percentiles.
Distribution of all pages' 75th percentile LCP experience, broken down by whether they use browser-level image lazy loading. _([Source](https://gist.github.com/rviscomi/44d80c1a0f4dec9cbafb37347c770278#file-lazy-loading-crux-lcp-sql))_.

The median page without lazy loading has a 75th percentile LCP of 2,922 milliseconds, compared to 3,546 milliseconds for the median page with lazy loading. Overall, websites that use lazy loading tend to have worse LCP performance.

It's important to point out that these are _correlational_ results and they don't necessarily point to lazy loading as being the _cause_ of the slower performance. Hypothetically, if WordPress sites tend to be a bit slower, and given how much they make up the lazy loading cohort, that could explain the difference. To eliminate that variability, the focus can be narrowed down specifically to WordPress sites.
Distribution of WordPress pages' 75th percentile LCP experience, broken down by whether they use browser-level image lazy loading. _([Source](https://gist.github.com/rviscomi/44d80c1a0f4dec9cbafb37347c770278#file-lazy-loading-crux-lcp-wordpress-sql))_.

Unfortunately, the same pattern emerges when drilling down into WordPress pages; those that use lazy loading tend to have slower LCP performance. The median WordPress page without lazy loading has a 75th percentile LCP of 3,495 milliseconds, compared to 3,768 milliseconds for the median page with lazy loading.

This still doesn't prove that lazy loading _causes_ pages to get slower, but using it does coincide with having slower performance. To try to answer the causality question, a lab-based A/B test was set up.

## Causal performance

The goal for the A/B test was to prove or disprove the hypothesis that built-in image lazy loading, as implemented in WordPress core, resulted in slower LCP performance and fewer image bytes. The methodology used was to test a demo WordPress website with the [twentytwentyone](https://wordpress.org/themes/twentytwentyone/) theme. Both the archive and single page types were tested, which are like the home and article pages, on desktop and emulated mobile devices using [WebPageTest](https://webpagetest.org/). Each combination of pages with and without lazy loading enabled were tested, and each test was ran nine times to get the median LCP value and number of image bytes.

| Series                                                                                                                                                                                                                                                                                                                                                               | default | disabled | Difference from default |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- | ----------------------- |
| [twentytwentyone-archive-desktop](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcQM_859caf47f070026732f4da3f70b8afe3-l:fix,210625_BiDcPT_2b89f12170b7180acf06cb35d3125d6a-l:disabled,210625_AiDc28_df202856ac4f0da4748c7a84a7a455a8-l:default) | 2,029   | 1,759    | -13%                    |
| [twentytwentyone-archive-mobile](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcV5_003a2ee20d6ee7323fca102afe3ef511-l:fix,210625_BiDcET_810fe76322f8a6003c38f0bc901e4025-l:disabled,210625_BiDc99_44b0562e9077eb01e1e18dceec69bca9-l:default)  | 1,657   | 1,403    | -15%                    |
| [twentytwentyone-single-desktop](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_AiDcR8_47e248c3211951b7af3bc9a87f205cc7-l:fix,210625_AiDcXB_3d9db18bf36397fcdc5d3db207d0d9e7-l:disabled,210625_AiDc2G_ee59429fac9a388b2184758078610b61-l:default)  | 1,655   | 1,726    | 4%                      |
| [twentytwentyone-single-mobile](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcR1_c349d38d4c7151772f2678fa7767ff42-l:fix,210625_AiDcD9_502bb504fc87aebafc5f8c9aaa70faa5-l:disabled,210625_BiDcPS_de2a3e5a526e470287d850d1dbc96fb7-l:default)   | 1,352   | 1,384    | 2%                      |
| [Change in LCP (ms) by disabling browser-level image lazy loading on sample WordPress pages.]                                                                                                                                                                                                                                                                        |

These results compare the median LCP in milliseconds for tests on archive and single pages for desktop and mobile. When lazy loading was disabled on archive pages, LCP improved by a significant margin. On single pages, however, it made less of a difference.

Disabling lazy loading seems to make the single pages slightly faster. However, the difference in LCP is less than one standard deviation for both desktop and mobile tests, so this could be attributed to variance and consider the change neutral overall. By comparison, the difference for archive pages is closer to two to three standard deviations.

| Series                                                                                                                                                                                                                                                                                                                                                               | default | disabled | Difference from default |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- | ----------------------- |
| [twentytwentyone-archive-desktop](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcQM_859caf47f070026732f4da3f70b8afe3-l:fix,210625_BiDcPT_2b89f12170b7180acf06cb35d3125d6a-l:disabled,210625_AiDc28_df202856ac4f0da4748c7a84a7a455a8-l:default) | 577     | 1173     | 103%                    |
| [twentytwentyone-archive-mobile](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcV5_003a2ee20d6ee7323fca102afe3ef511-l:fix,210625_BiDcET_810fe76322f8a6003c38f0bc901e4025-l:disabled,210625_BiDc99_44b0562e9077eb01e1e18dceec69bca9-l:default)  | 172     | 378      | 120%                    |
| [twentytwentyone-single-desktop](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_AiDcR8_47e248c3211951b7af3bc9a87f205cc7-l:fix,210625_AiDcXB_3d9db18bf36397fcdc5d3db207d0d9e7-l:disabled,210625_AiDc2G_ee59429fac9a388b2184758078610b61-l:default)  | 301     | 850      | 183%                    |
| [twentytwentyone-single-mobile](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcR1_c349d38d4c7151772f2678fa7767ff42-l:fix,210625_AiDcD9_502bb504fc87aebafc5f8c9aaa70faa5-l:disabled,210625_BiDcPS_de2a3e5a526e470287d850d1dbc96fb7-l:default)   | 114     | 378      | 233%                    |
| [Change in the number of image bytes (KB) by disabling browser-level image lazy loading on sample WordPress pages.]                                                                                                                                                                                                                                                  |

These results compare the median number of image bytes (in KB) for each test. As expected, lazy loading has a very clear positive effect on reducing the number of image bytes. If a real user were to scroll through the entire page, all images would load anyway as they cross into the viewport, but these results show the improved performance of the initial page load.

To summarize the results of the A/B test, the lazy loading technique used by WordPress very clearly helps reduce image bytes at the cost of a delayed LCP.

## Testing a fix

The most important aspect of WordPress' current lazy-loading implementation for this experiment is that it lazy-loads images within the viewport (_above the fold_ ). The CMS blog post [acknowledges](https://web.dev/articles/browser-level-lazy-loading-for-cmss.md.txt#avoid_lazy_loading_above-the-fold_elements) this as a pattern to avoid, but experimental data at the time indicated that the effect on LCP was minimal and worth simplifying the implementation in WordPress core.

Given this new data, an experimental fix was created that avoids lazy loading images that are above the fold, and the fix was tested under the same conditions as the first A/B test.

| Series                                                                                                                                                                                                                                                                                                                                                               | default | disabled | fix   | Difference from default | Difference from disabled |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- | ----- | ----------------------- | ------------------------ |
| [twentytwentyone-archive-desktop](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcQM_859caf47f070026732f4da3f70b8afe3-l:fix,210625_BiDcPT_2b89f12170b7180acf06cb35d3125d6a-l:disabled,210625_AiDc28_df202856ac4f0da4748c7a84a7a455a8-l:default) | 2,029   | 1,759    | 1,749 | -14%                    | -1%                      |
| [twentytwentyone-archive-mobile](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcV5_003a2ee20d6ee7323fca102afe3ef511-l:fix,210625_BiDcET_810fe76322f8a6003c38f0bc901e4025-l:disabled,210625_BiDc99_44b0562e9077eb01e1e18dceec69bca9-l:default)  | 1,657   | 1,403    | 1,352 | -18%                    | -4%                      |
| [twentytwentyone-single-desktop](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_AiDcR8_47e248c3211951b7af3bc9a87f205cc7-l:fix,210625_AiDcXB_3d9db18bf36397fcdc5d3db207d0d9e7-l:disabled,210625_AiDc2G_ee59429fac9a388b2184758078610b61-l:default)  | 1,655   | 1,726    | 1,676 | 1%                      | -3%                      |
| [twentytwentyone-single-mobile](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcR1_c349d38d4c7151772f2678fa7767ff42-l:fix,210625_AiDcD9_502bb504fc87aebafc5f8c9aaa70faa5-l:disabled,210625_BiDcPS_de2a3e5a526e470287d850d1dbc96fb7-l:default)   | 1,352   | 1,384    | 1,342 | -1%                     | -3%                      |
| [Change in LCP (ms) by the proposed fix for browser-level image lazy loading on sample WordPress pages.]                                                                                                                                                                                                                                                             |

These results are much more promising. Lazy loading only the images below the fold results in a complete reversal of the LCP regression and possibly even a slight _improvement_ over disabling lazy loading entirely. How could it be faster than not lazy loading at all? One explanation is that by not loading below-the-fold images, there's less network contention with the LCP image, which enables it to load more quickly.

| Series                                                                                                                                                                                                                                                                                                                                                               | default | disabled | fix | Difference from default | Difference from disabled |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | -------- | --- | ----------------------- | ------------------------ |
| [twentytwentyone-archive-desktop](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcQM_859caf47f070026732f4da3f70b8afe3-l:fix,210625_BiDcPT_2b89f12170b7180acf06cb35d3125d6a-l:disabled,210625_AiDc28_df202856ac4f0da4748c7a84a7a455a8-l:default) | 577     | 1173     | 577 | 0%                      | -51%                     |
| [twentytwentyone-archive-mobile](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcV5_003a2ee20d6ee7323fca102afe3ef511-l:fix,210625_BiDcET_810fe76322f8a6003c38f0bc901e4025-l:disabled,210625_BiDc99_44b0562e9077eb01e1e18dceec69bca9-l:default)  | 172     | 378      | 172 | 0%                      | -54%                     |
| [twentytwentyone-single-desktop](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_AiDcR8_47e248c3211951b7af3bc9a87f205cc7-l:fix,210625_AiDcXB_3d9db18bf36397fcdc5d3db207d0d9e7-l:disabled,210625_AiDc2G_ee59429fac9a388b2184758078610b61-l:default)  | 301     | 850      | 301 | 0%                      | -65%                     |
| [twentytwentyone-single-mobile](https://www.webpagetest.org/video/compare.php?medianMetric=chromeUserTiming.LargestContentfulPaint&highlightLCP=1&thumbSize=200&ival=100&end=visual&tests=210625_BiDcR1_c349d38d4c7151772f2678fa7767ff42-l:fix,210625_AiDcD9_502bb504fc87aebafc5f8c9aaa70faa5-l:disabled,210625_BiDcPS_de2a3e5a526e470287d850d1dbc96fb7-l:default)   | 114     | 378      | 114 | 0%                      | -70%                     |
| [Change in the number of image bytes (KB) by the proposed fix for browser-level image lazy loading on sample WordPress pages.]                                                                                                                                                                                                                                       |

In terms of image bytes, the fix has absolutely no change as compared to the default behavior. This is great because that was one of the strengths of the current approach.

This fix comes with some caveats. WordPress determines which images to lazy load on the server side, which means it doesn't know anything about the user's viewport size or whether images initially load within it. So the fix uses heuristics about the images' relative location in the markup to guess whether it loads in the viewport. Specifically, if the image is the first featured image on the page or the first image in the main content, it's assumed to be above the fold, or close to it, and it won't be lazy-loaded.

Page-level conditions like the number of words in the heading or the amount of paragraph text early in the main content can affect whether the image is within the viewport. There are also user-level conditions that might affect the accuracy of the heuristics, especially the viewport size and the use of anchor links that change the scroll position of the page.

For those reasons, it's important to acknowledge that the fix is only calibrated to provide good performance in the general case, and fine-tuning might be needed to make these results applicable to all real-world scenarios.

## Implementation

Now that a better way to lazy-load images has been identified, all of the image savings and faster LCP performance, how can sites start using it? The highest priority change is to submit a patch to WordPress core to implement the experimental fix. The guidance in the [Browser-level lazy-loading for CMSs](https://web.dev/articles/browser-level-lazy-loading-for-cmss.md.txt) blog post will also be updated to clarify the negative effects of above-the-fold lazy loading and how CMSs can use heuristics to avoid it.

Since these best practices are applicable to all web developers, it may also be worth flagging lazy loading antipatterns in tools like Lighthouse. Refer to the [feature request](https://github.com/GoogleChrome/lighthouse/issues/12785) on GitHub if you're interested to follow along with progress on that audit. Until then, one thing developers could do to find instances of LCP elements being lazy-loaded is to add more detailed logging to their field data.

```javascript
new PerformanceObserver((list) => {
  const latestEntry = list.getEntries().at(-1);

  if (latestEntry?.element?.getAttribute("loading") == "lazy") {
    console.warn("Warning: LCP element was lazy loaded", latestEntry);
  }
}).observe({ type: "largest-contentful-paint", buffered: true });
```

The preceding JavaScript snippet will evaluate the most recent LCP element and log a warning if it was lazy-loaded.

This also highlights a sharp edge of the lazy loading technique and the potential for API improvements at the platform level. For example, there's an open issue in Chromium to [experiment](https://bugs.chromium.org/p/chromium/issues/detail?id=996963) with natively loading the first few images eagerly, similar to the fix, despite the `loading` attribute.

## Conclusion

If your site uses browser-level image lazy loading, check how it's implemented and run A/B tests to better understand its performance costs. It may benefit from more eagerly loading images above the fold. If you have a WordPress site, there will hopefully be a patch landing in WordPress core soon. And if you're using another CMS, make sure they're aware of the potential performance issues described here.

Trying out relatively new web platform APIs can come with both risks and rewards---they're called cutting edge features for a reason. While we're starting to get a sense of the thorniness of browser-level image lazy loading, we're also seeing the upsides of how to use it to achieve better performance.
