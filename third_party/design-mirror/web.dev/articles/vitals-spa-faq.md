---
source_url: https://web.dev/articles/vitals-spa-faq
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:36+00:00
sha256: ac352a09ff72122fd6fee56e731c3ab3c9acfedd32fcbec832a3d62ca39d1cb7
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Answers to common questions about SPAs, Core Web Vitals, and how Core Web Vitals treats these.

 Philip Walton [X](https://twitter.com/philwalton) [GitHub](https://github.com/philipwalton) [LinkedIn](https://www.linkedin.com/in/waltonphilip) [Mastodon](https://toot.cafe/@philipwalton) [Bluesky](https://bsky.app/profile/philipwalton.com) [Homepage](https://philipwalton.com/)  Yoav Weiss [X](https://twitter.com/yoavweiss) [GitHub](https://github.com/yoavweiss)  Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Published: September 14, 2021, Last updated: October 13, 2026

> [!NOTE]
> **Update (October 2026):** Chrome 151 released new APIs that allow measuring Core Web Vitals for SPA sites. See the [Measuring soft navigations](https://developer.chrome.com/docs/web-platform/soft-navigations) post for more details. This FAQ has been updated in light of these changes while retaining the historical context. Additionally, Chrome has [started publishing experimental versions of these metrics](https://web.dev/blog/crux-experimental-soft-navs.md.txt) in the [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux) from October 2026.

Since first introducing the [Web Vitals](https://web.dev/articles/vitals.md.txt) initiative in May of 2020, we
on the Chrome team have received a lot of great questions and feedback about the
program.

Perhaps the topic we've received the most questions about, which is also
probably the hardest question to answer, is how to measure Core Web Vitals in a
[single-page application](https://en.wikipedia.org/wiki/Single-page_application)
(SPA), as well as how SPA architectures affect Core Web Vitals scores.

These questions are hard to answer because the problem is quite nuanced, so in
this post we're going to do our best to answer the most common questions,
providing as much detail and context as we can.

Before getting into specifics, though, it's important to state that Google does
not have any preference as to what architecture or technology is used to build a
site. We believe that SPAs and multi-page applications (MPAs) are both capable
of delivering high quality experiences to users, and our intention with the Web
Vitals initiative is to provide metrics that measure the experience independent
of the technology.

## Frequently asked questions

The following are some of the most common questions we get on this subject. We are happy to take feedback to add to this FAQ at [our feedback group](mailto:web-vitals-feedback@googlegroups.com) or by [raising an issue](https://issuetracker.google.com/issues/new?component=1400680&template=1857359).

### Do Core Web Vitals metrics include SPA route transitions?

When first introduced, each of the Core Web Vitals metrics was measured relative to the current, top-level page navigation. If a page dynamically loaded new content and updated the URL of the page in the address bar, it would have no effect on how the Core Web Vitals metrics are measured.

Metric values were not reset, and the URL associated with each metric measurement is the URL the user navigated to that initiated the page load.

Chrome 151 introduced new APIs that allow measurement of Core Web Vitals across SPA route transitions and which are used by the latest version of the [`web-vitals`](https://github.com/GoogleChrome/web-vitals) library, some RUM solutions, and tooling like Chrome DevTools. As of October 2026, Chrome has [started publishing experimental versions of these metrics](https://web.dev/blog/crux-experimental-soft-navs.md.txt) in CrUX which include soft navigation metrics and aim to graduate these from experimental in May 2027.

Other browser engines, beyond Chromium, don't yet support these new APIs and so Core Web Vitals can only be measured across full page loads for those browsers.

### Why was this a hard problem to solve?

There is no standardized way of building an SPA today, and even among the
popular SPA and routing libraries, the user experience can be quite different
from app to app:

- Some SPAs update the URL only when loading new "full page" content, whereas other sites update the URL for tiny content changes or even just UI state changes.
- Some SPAs update the URL using the History API, whereas others use hash changes in order to support older browsers (and others don't update the URL at all).
- Some SPAs load content and then update the URL, whereas others update the URL before loading content.
- Some SPAs load content all at once, synchronously, in a single JavaScript task, whereas others transition content in, asynchronously, across multiple tasks (with no clear transition end event).
- Some SPAs always load content from the network, whereas others preload all content upfront so that route changes load instantly from memory.

These differences make defining and identifying what constitutes an SPA route
change, or even an SPA itself, very difficult to do *at scale*.

In some cases an SPA route change is logically identical to an MPA page load,
and in such cases it would be great if the existing Core Web Vitals metrics
could be applied.

However, without solid heuristics to reliably identify "real" route changes from
all other URL changes---as well as clear signals marking the beginning and end of
such transitions---reporting Core Web Vitals metrics in these cases would muddy
the data and make it less useful or representative of the real user experience
on the site.

The [Soft Navigation work](https://github.com/WICG/soft-navigations) has provided a solution to this with two new performance APIs:

- [`PerformanceSoftNavigation`](https://wicg.github.io/soft-navigations/#sec-soft-navs) which measures when a user interaction leads to both a paint and a URL change. The combination of these three things provides a standardized definition of a "soft navigation" regardless of the framework used and some of the differences mentioned previously. This allows splitting the performance timeline into separate "navigations", allowing CLS and INP to be measured for each navigation.
- [`InteractionContentfulPaint`](https://wicg.github.io/soft-navigations/#sec-interaction-contentful-paint) which measures "contentful paints" after an interaction, allowing FCP and LCP to be measured for these soft navigations.

The combination of these two APIs allow Core Web Vitals to be measured across both full page loads and soft navigations.

### Are SPA route changes the same as full page loads for Core Web Vitals?

No, there are still many differences between these types of navigations, which can result in different Core Web Vital metrics.

A soft navigation has content on the page and is updating some or all of that content to display the new "page." In many ways this is similar to the difference between an uncached full page load versus a page load when some or all of the page resources are cached, but to an even more extreme state as some content may stay rendered.

In theory the main difference will be the potential for soft navigations to be much faster. But there are other, more subtle differences.

The new soft navigation APIs only consider new content. So a page that updates the `<h1>` and text content, but leaves the same hero image between pages, won't consider the hero image as an LCP candidate if it did not re-paint. This will lead to differences in which elements are used to calculate the LCP time based on whether the same page is loaded as a full page load, or as a soft navigation from another existing page.

Similarly, INP may be less for soft navigations since a lot of JavaScript needed to run the site will already be loaded. In the same way, a soft navigation may have less (or more!) CLS if the same content causes CLS on a full page load but does not need to be loaded or re-rendered on a soft navigation.

There are also slight differences in when the measurements are taken from in full page loads (measured from after the navigation interaction processing) versus soft navigations (measured from the interaction start time).

As previously stated, many of these differences are similar to uncached versus cached pages, and the concept of what Core Web Vitals attempts to measure still applies. However, it's worthwhile understanding these subtleties when investigating Core Web Vital issues.

### Is it harder for SPAs to do well on Core Web Vitals than MPAs?

There is nothing inherent in the SPA architecture that would prevent a page in
an SPA from loading just as quickly---and scoring just as well on all of the Core
Web Vitals metrics---as a similar page in an MPA.

However, properly optimized MPAs do have some advantages in meeting the Core Web
Vitals thresholds that SPAs don't. This has largely been mitigated with the soft navigations work discussed previously, but it may still be the case when these new APIs are not yet used.
The reason is because with the MPA
architecture, each "page" is loaded as a full-page navigation (rather than
dynamically fetching content and inserting it into the existing page), which
means users who visit an MPA are more likely to load more than one page from the
site, which in turn means that a larger percentage of the distribution of all
page loads for an MPA will involve some or all of the sub-resources being
cached.

Granted, for an MPA to perform better on the Core Web Vitals metrics than an SPA
requires a few things to be true:

- The MPA needs to have optimized sub-resource caching in order to ensure same-origin page loads are indeed faster than cross-origin page loads at the 75th percentile.
- Users who visit MPAs need to visit multiple pages in order for the site to receive the caching benefits that result in faster page loads.

Since Core Web Vitals assessments [consider the 75th
percentile](https://web.dev/articles/defining-core-web-vitals-thresholds#choice_of_percentile) of page
visits, having more, well-performing page visits in the dataset will increase
the likelihood that the visit at the 75th percentile of the distribution will be
within the recommended thresholds.

Note that an important thing to consider when comparing Core Web Vitals scores
is how the data is aggregated---that is, whether the dataset in the distribution
includes all pages from your site or origin, or just page loads for a particular
page URL.

When aggregating the scores of all pages in an origin, individual fast pages can
improve the 75th percentile for the origin as a whole. However, when aggregating
by individual pages, the scores of one page won't affect the scores of the
next. In other words, when aggregating the scores of an MPA by page, fast cache
loads seen on the checkout page will *not* improve the scores of slow initial
loads experienced on the site's [landing
page](https://en.wikipedia.org/wiki/Landing_page).

You can check your site's score for different aggregation methods using
[PageSpeed Insights](https://pagespeed.web.dev/) or
the [Chrome User Experience Report
API](https://developer.chrome.com/blog/chrome-ux-report-api),
which reports scores for both individual page URLs and the entire origin.

Another way the SPA architecture can affect Core Web Vitals scores is for
metrics that consider the full lifespan of a page. Since users visiting SPAs
tend to stay on the same "page" for the entire session, metrics that accumulate
over time can be harsher on SPAs than MPAs.

With the soft navigations work, we believe that there should be no disadvantages to SPAs in terms of how Core Web Vitals can be measured. However, full integration of these APIs across all tooling and reporting solutions will take time.

### If SPA architectures improve the user experience, shouldn't that improvement be reflected in the metrics?

Yes, it should. Quantifying just how much the experience has improved was difficult to do at scale, given all the different ways SPAs are implemented on the web today. We now have a solution to the measurement problem, and when these new APIs are used, any improvements from moving to SPAs should be reflected in the metrics.

The truth is the web performance industry (Google included) has historically not
invested nearly as much time and effort into developing [user-centric
metrics](https://web.dev/articles/user-centric-performance-metrics) for the post-load performance of a
page as it has for the page load itself. This isn't because post-load
performance isn't important, it's because post-load UX and interactions are so
much more varied and less well-defined---making it hard to design metrics for
them.

But even now that we have more post-load metrics to measure SPA
performance, we wouldn't want to ignore the load experience just because the
post load experience got better.

One of the goals of the Web Vitals initiative is to promote and incentivize good
user experiences across as many aspects of loading and using a web page as
possible. We don't want to encourage scenarios where bad experiences are
justified if you can have enough good experiences to make up for them. Users
want pages to load fast *and* transition to new content fast, and we've tried to
design metrics that favor those types of experiences.

### We switched our site from an MPA to an SPA and our scores regressed. Is that expected?

It depends. There are a number of reasons why your scores could change after a
major architecture migration, but a decrease in the number of warm cache loads
could account for some of the change.

A quick way to check would be to test both an MPA and SPA version of one of your
landing pages with
[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview). If the
Lighthouse score is lower on any of the Core Web Vitals metric for the SPA
version, then it's likely that the load experience did get worse after the
update.

### Should I switch my site from an SPA to an MPA to score better on Core Web Vitals?

Probably not. You should only switch from an SPA to an MPA if you are not happy
with your SPA stack and you have reason to believe an MPA will provide a better
user experience.

With the soft navigations work, we believe we have addressed the measurement issues so moving for that reason alone does not make sense.

However, if you have reason to show that performance will improve, rather than just measurements improving, then that may be reason to move from SPA to MPA (or vice versa!).

### If Core Web Vitals scores are only reported for an SPA's landing pages, how can I debug issues that occur on "pages" after a route transition?

Google tools that report field data for the Core Web Vitals metric (like Search
Console and PageSpeed Insights) get their data from the [Chrome User Experience
Report](https://developer.chrome.com/docs/crux)
(CrUX).

As of October 2026, Chrome has [started publishing experimental versions of these metrics](https://web.dev/blog/crux-experimental-soft-navs.md.txt) in the [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux), but most tools report the Core Web Vitals without these new soft navigation metrics.

As a site owner you can now use the new APIs to measure Core Web Vitals by SPA route in advance of this to understand how your scores may change, and also to debug issues. Chrome DevTools also supports soft navigations in the performance panel so you can debug and inspect soft navigations there.

For more details and best practices on this, see: [Measuring soft navigations](https://developer.chrome.com/docs/web-platform/soft-navigations).

### What is Google doing to ensure MPAs don't have an unfair advantage compared to SPAs?

As mentioned previously, with the soft navigations work, we believe that the work we have undertaken now means there should be no disadvantages to SPAs in this regard, though full integration across all tooling and reporting solutions will take time.

#### Assess cross-origin and same-origin page visits separately

Today the Core Web Vitals metrics aggregate all page visits into a single
bucket---they don't differentiate between new versus returning visits or landing
pages versus checkout pages or any other aggregation type where cache state
could have an effect on performance.

One way to normalize the differences between SPA and MPA performance would be to
apply different weighting to different types of visits, potentially even with
completely different [threshold
recommendations](https://web.dev/articles/defining-core-web-vitals-thresholds).

While we definitely do want to reward effective cache implementations, we don't
want fast intra-site navigations to be able to cover up for slow landing page
loads. We also don't want to incentivize sites to break up long pages into a
collection of shorter pages just for the sake of improving metric scores.

By separately assessing cross-origin and same-origin page visits we can help
ensure that both types of experiences are important without letting the relative
popularity of one type on a given site skew the distribution of any particular
metric.

## Final thoughts

Google is deeply committed to improving the Web Vitals metrics, and ensuring
they measure and incentivize high-quality experiences that are important to
users. That being said, we do acknowledge that measurement gaps exist today. The
metrics are now able to cover SPA route transitions which addresses on of the main gaps.

We also believe these new APIs (particularly `InteractionContentfulPaint`) have further uses and potential benefits beyond Core Web Vitals measurement for soft navigations. We are very excited to continue to build on these now that the main reason for their introduction has been addressed.

I hope this post has helped shed some light on this complex and nuanced subject.
As always, if you have feedback on the current or future Web Vitals metrics,
email
[web-vitals-feedback@googlegroups.com](mailto:web-vitals-feedback@googlegroups.com).
