---
source_url: https://web.dev/articles/how-can-performance-improve-conversion
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 2dc685ae28e9d456a5611b5799679ab27081dbc96e162c1239b9e259ea4aadcf
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Optimize your site's performance and improve conversions.

 Martin Schierle [X](https://twitter.com/martinschierle) [GitHub](https://github.com/martinschierle)

In our other ecommerce guides, you learned [what you should measure
to improve performance](https://web.dev/articles/what-should-you-measure-to-improve-performance), and
[how to measure and report metrics to build a performance culture](https://web.dev/articles/how-to-report-metrics).
 A conversion funnel going from discover to engage to convert to re-engage.

In this guide, we address the different ways in which a website should be optimized for performance to yield maximum conversions at the end of the funnel.

## Discovery

New users discover a website in most cases through organic search, social sharing, website links or paid campaigns. Some important discovery mechanisms are directly affected by website performance. Website crawlers may have difficulty indexing sites that are slow to load or have extensive [client side rendering and JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering).

Speed can also be a direct ranking factor, for example on [web search](https://webmasters.googleblog.com/2018/01/using-page-speed-in-mobile-search.html), [ad campaigns](https://developer.chrome.com/blog/search-ads-speed/#the-mobile-speed-score-for-ads-landing-pages) or [social networks](https://newsroom.fb.com/news/2017/08/news-feed-fyi-showing-you-stories-that-link-to-faster-loading-webpages/).
Keep in mind that new users who discover your website will get an uncached first load, so basically the worst possible experience. This can be especially frustrating if good money was spent to get the user to the website, just to see them dropping off due to a long first load.

Make sure to use appropriate tools as described in [Fast Load Times](https://web.dev/explore/fast) to optimize towards a first load, because first impressions matter---if the first load is too slow, the user may never see the optimized second load or stay around to look at your products. In general [loading times of a website map very well to bounce rates](https://developer.akamai.com/blog/2015/09/01/mobile-web-performance-monitoring-conversion-rate), which in turn often correlate well with conversions.

## Engagement

After getting users to your site, you need to keep them engaged with your content, which you can verify in your analytics of choice by looking at session length, time-on-page, pages-per-session and general [user flows](https://support.google.com/analytics/answer/1709395).
 A user flow through the funnel as seen by Google Analytics.

Besides various UX best practices, a smooth, fast and responsive experience is key here. While optimizing a website for discovery means optimizing for first load, optimizing for engagement means fast navigations and fast repeat loads. Analyze at which steps of the flow users drop out, and then relate back to speed metrics for these navigations. This can be analyzed for example via [WebPageTest](https://github.com/WPO-Foundation/webpagetest-docs/blob/main/src/scripting.md#sample-scripts), [Puppeteer](https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md) or via the Chrome DevTools [Record](https://developer.chrome.com/docs/devtools/evaluate-performance/#record) feature. We will show you more examples of those in the following guides.

## Conversion

While website conversions are often bound to good discovery paired with great engagement, there are a couple of additional points to remember. Users expect hero images to [load fast](https://web.dev/articles/user-centric-performance-metrics.md.txt), call-to-action buttons should be rendered and [labeled](https://developer.chrome.com/blog/lighthouse-load-performance/#all-text-remains-visible-during-web-font-loads) quickly, page should be [responsive](https://web.dev/articles/fid.md.txt) and [layout jumps](https://css-tricks.com/content-jumping-avoid/) should be avoided. A user won't buy anything if they can't click the *Buy Now* button due to busy CPU or a jumping or unlabeled button.

In general it's best to measure and track the time-to-action towards a conversion or a subgoal for it, for example the median time it takes shoppers to get from landing on your site, to viewing a product, to completing payment .

## Re-engagement

It turns out that only 2% of users [convert on first visit](https://retargeter.com/what-is-retargeting-and-how-does-it-work/), so it is important to get the other 98% to come back, and re-engage them with your content. Modern websites have different ways to do this, for example via mail, tailored display ads in [remarketing](https://support.google.com/google-ads/answer/2453998) or notifications. This works best if the flow from reengagement to website is as smooth as possible. Unfortunately this is not always the case, as for example mail apps often open links in their in-app webview, slowing down page load and complicating logins through different cache and cookie storage.
Make sure to optimize for fast repeat loads and smooth UX flows to increase chances of reengagement.

## Recap

Ecommerce sites always strive for conversions, which are at the end of a purchase funnel. Every step along the funnel needs to be optimized for website speed to minimize bounce rates and drop-offs, and for each step there are different things to optimize, different pitfalls and culprits:
 An ecommerce funnel showing which metric to optimize in which step.

To learn more, be sure to check out the other posts in this series on [measuring
to improve performance](https://web.dev/articles/what-should-you-measure-to-improve-performance), and
[how report metrics to build a performance culture](https://web.dev/articles/how-to-report-metrics).
