---
source_url: https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:25+00:00
sha256: 5efb96f5535dbb3dc58472077a37d4c26ef3aff3c367b621e903a45b639253ba
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
How to measure and optimize signed exchanges to get the most improvement out of them

 Devin Mullins [X](https://twitter.com/twifkak) [GitHub](https://github.com/twifkak)

Signed exchanges (SXGs) are a means to improve your page speed---mainly [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp). When referring sites (currently Google Search) link to a page, they can [prefetch it](https://developers.google.com/search/docs/advanced/experience/signed-exchange) into the browser cache before the user clicks on the link.

It's possible to make web pages that, when prefetched, require no network on the [critical path to rendering the page](https://developer.mozilla.org/docs/Web/Performance/Critical_rendering_path)! On a 4G connection, this page load [goes from 2.8s to 0.9s](https://www.webpagetest.org/video/compare.php?tests=220422_AiDcJ6_54R-l:Before,220329_BiDc1V_FJG-l:After&medianMetric=LCP) (the remaining 0.9s being mostly by CPU usage):

> [!NOTE]
> **Note:** Previously, this post showed [an improvement from 6s to 0.9s](https://www.webpagetest.org/video/compare.php?tests=220329_AiDcB7_HB0-l:Before,220329_BiDc1V_FJG-l:After&medianMetric=LCP). That was true, but the site under test was atypically slow at the time. Still, it may serve as a example representative of pages with [more subresources](https://almanac.httparchive.org/en/2021/javascript#fig-5), [slower servers](https://almanac.httparchive.org/en/2021/performance#fig-6), or users with [slower connection types](https://almanac.httparchive.org/en/2021/performance#fig-16).

Most people publishing SXGs today are using Cloudflare's easy-to-use [Automatic Signed Exchanges](https://support.cloudflare.com/hc/articles/4411075595661-Automatic-Signed-Exchanges-SXGs-Beta) (ASX) feature (though [open source options](https://web.dev/signed-exchanges#tooling) exist too):

In many cases, checking the box to enable this feature is enough to get the kind of substantial improvement shown above. Sometimes, there are a few more steps to ensure these SXGs are working as intended at each stage of the pipeline, and to optimize pages to take full advantage of prefetch.

In the past couple of months since Cloudflare's launch, I've been reading and responding to questions on [various](https://support.google.com/webmasters/threads?thread_filter=('%22signed+exchange%22')) [forums](https://community.cloudflare.com/t/automatic-signed-exchanges-sxgs-beta-launch/312634) and learning how to advise sites on how to make sure they're getting the most out of their SXG deployments. This post is a collection of my advice. I'll walk through the steps to:

- [Analyze SXG performance](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#analyze) using WebPageTest.
- [Debug the SXG pipeline](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#debug) if the Analyze step shows that it's not working.
- [Optimize pages for SXG prefetch](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#optimize) including setting an optimal `max-age` and preloading render-blocking subresources.
- [Measure SXG improvement](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#measure) using Google Analytics by selecting appropriate experiment and control groups.

## Introduction

An SXG is a file containing a URL, a set of HTTP response headers, and a response body---all cryptographically signed by a Web PKI certificate. When the browser loads an SXG, it verifies all of these:

- The SXG hasn't expired.
- The signature matches the URL, headers, body, and certificate.
- The certificate is valid and matches the URL.

If verification fails, the browser abandons the SXG and instead fetches the signed URL. If verification succeeds, the browser loads the signed response, treating it as if it came directly from the signed URL. This allows SXGs to be rehosted on any server as long as it isn't expired or modified since being signed.

In the case of Google Search, SXG [enables](https://wicg.github.io/webpackage/draft-yasskin-wpack-use-cases.html#name-privacy-preserving-prefetch) prefetching of pages in its search results. For pages supporting SXGs, Google Search can prefetch its cached copy of the page, hosted on webpkgcache.com. These webpkgcache.com URLs don't affect the display or behavior of the page, because the browser respects the original, signed URL. Prefetching can enable your page to load much faster.

> [!NOTE]
> **Note:** SXGs are potentially useful for other use cases not covered in this article. For instance, they could enable connection resilience: a chat app could pre-download a link sent to the user if the page supports SXG, so they could later view it while offline. See this larger list of [potential use cases](https://wicg.github.io/webpackage/draft-yasskin-wpack-use-cases.html).

## Analyze

To see the benefit of SXGs, start by using a lab tool to analyze SXG performance in repeatable conditions. You can use [WebPageTest](https://www.webpagetest.org/) to compare waterfalls---and LCP---with and without SXG prefetch.

> [!CAUTION]
> **Caution:** [Lab results may differ](https://web.dev/articles/lab-and-field-data-differences) from real user experiences, but they are a useful tool to diagnose where to optimize and to iterate quickly. We'll cover how to measure the resultant real user metrics in the [Measure section](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#measure).

Generate a test without SXG as follows:

- Go to [WebPageTest](https://www.webpagetest.org/) and sign in. Signing in saves your test history for easier comparison later.
- Enter the URL you want to test.
- Go to **Advanced Configuration**. (You will need Advanced Configuration for the SXG test, so using it here helps ensure the test options are the same.)
- In the **Test Settings** tab, it may be helpful to set Connection to 4G and increase "Number of Tests to Run" to 7.
- Click **Start Test**.

Generate a test *with* SXG by using the same steps as above, but before clicking **Start Test** , go to the **Script** tab, paste in the following [WebPageTest script](https://docs.webpagetest.org/scripting/), and modify the two `navigate` URLs as directed:

    // Disable log collection for the first step. We only want the waterfall for the target navigation.
    logData 0

    // Visit a search result page that includes your page.
    navigate https://google.com/search?q=site%3Asigned-exchange-testing.dev+image

    // Wait for the prefetch to succeed.
    sleep 10

    // Re-enable log collection.
    logData 1

    // Navigate to the prefetched SXG on the Google SXG Cache.
    navigate https://signed--exchange--testing-dev.webpkgcache.com/doc/-/s/signed-exchange-testing.dev/sxgs/valid-image-subresource.html

For the first `navigate` URL, if your page doesn't appear in any Google Search results yet, you can use [this prefetch page](https://signed-exchange-testing.dev/prefetch/) to generate a pretend search results page for this purpose.

To determine the second `navigate` URL, visit your page using the [SXG Validator Chrome extension](https://chrome.google.com/webstore/detail/sxg-validator/hiijcdgcphjeljafieaejfhodfbpmgoe), and click the extension icon to see the cache URL:

Once these tests are complete, go to [Test History](https://app.webpagetest.org/ui/wpt/testhistory), select the two tests, and click **Compare**:

Append `&medianMetric=LCP` to the compare URL so WebPageTest selects the run with median LCP for each side of the comparison. (The default is median by Speed Index.)

To compare waterfalls, expand the **Waterfall Opacity** section and drag the slider. To view the video, click **Adjust Filmstrip Settings** , scroll down inside that dialog, and click **View Video**.

If the SXG prefetch is successful, you will see that the "with SXG" waterfall doesn't include a row for the HTML, and the fetches for subresources start sooner. For example, compare "Before" and "After" here:

 

## Debug

If the WebPageTest is showing that the SXG is being prefetched, then it has succeeded in all the steps of the pipeline; you may skip to the [Optimize](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#optimize) section to learn how to further improve LCP. Otherwise, you'll need to find out where in the pipeline it failed and why; read on to learn how.

### Publishing

Make sure your pages are being generated as SXGs. To do so, you need to pretend to be a crawler. The easiest way is to use the [SXG Validator Chrome extension](https://chrome.google.com/webstore/detail/sxg-validator/hiijcdgcphjeljafieaejfhodfbpmgoe):

> [!NOTE]
> **Note:** SXGs are meant for SXG-capable crawlers, to enable prefetching. When users visit your site directly, you should not serve SXGs to them, since they will not be prefetched---doing so only adds overhead. Cloudflare ASX performs this [content negotiation](https://github.com/google/webpackager/blob/main/cmd/webpkgserver/README.md#content-negotiation) automatically.

The extension fetches the current URL with an `Accept` request header that says it prefers the SXG version. If you see a check mark (✅) next to Origin, that means an SXG was returned; you can skip to the [Indexing](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#indexing) section.

If you see a cross mark (❌), that means an SXG wasn't returned:

If Cloudflare ASX is enabled, then the most likely reason for a cross mark (❌) is because a cache control response header prevents it. ASX looks at headers with the following names:

- `Cache-Control`
- `CDN-Cache-Control`
- `Surrogate-Control`
- `Cloudflare-CDN-Cache-Control`

If any of these headers contains any of the following header values, it will prevent an SXG from being generated:

- `private`
- `no-store`
- `no-cache`
- `max-age` less than 120, unless overridden by `s-maxage` greater than or equal to 120

ASX doesn't create an SXG in these cases because SXGs may be [cached and reused](https://developers.google.com/search/docs/advanced/experience/signed-exchange#additional-requirements-for-google-search) for multiple visits and multiple visitors.

Another possible reason for a cross mark (❌) is the presence of one of [these stateful response headers](https://wicg.github.io/webpackage/draft-yasskin-httpbis-origin-signed-exchanges-impl.html#name-stateful-header-fields), except for `Set-Cookie`. ASX removes the `Set-Cookie` header to comply with the SXG specification.

> [!NOTE]
> **Note:** These restrictions can be seen in more detail in the ASX code. For instance, cache control headers are inspected by the code that [determines when to sign](https://github.com/google/sxg-rs/blob/d16e66a2b8d5e0c069ec70af198dd95f640321d8/sxg_rs/src/headers.rs#L105-L116) and [what the signature duration should be](https://github.com/google/sxg-rs/blob/d16e66a2b8d5e0c069ec70af198dd95f640321d8/sxg_rs/src/headers.rs#L252-L272). Other headers are removed before signing [by this configuration](https://github.com/google/sxg-rs/blob/130fec932e100b1f9949903bc6c5a61452b9f042/cloudflare_worker/wrangler.example.toml#L42) or [by this code](https://github.com/google/sxg-rs/blob/d16e66a2b8d5e0c069ec70af198dd95f640321d8/sxg_rs/src/headers.rs#L279-L292). Other headers [prevent signing](https://github.com/google/sxg-rs/blob/d16e66a2b8d5e0c069ec70af198dd95f640321d8/sxg_rs/src/headers.rs#L325-L345) if not otherwise stripped.

Another possible reason is the presence of a [`Vary: Cookie`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Vary) response header. Googlebot fetches SXGs without user credentials and may serve them to multiple visitors. If you serve different HTML to different users based on their cookie, then they could see an incorrect experience such as a logged out view.

> [!NOTE]
> **Note:** In the future, pages using `Vary: Cookie` will be supported by SXG, by being shown only to visitors without cookies for your site. This is [implemented in Chromium](https://crbug.com/1250532), and will be enabled in Google Search once that has rolled out more fully.

Alternatively to the Chrome extension, you can use a tool like [`curl`](https://curl.se/):

```bash
curl -siH "Accept: application/signed-exchange;v=b3" $URL | less
```

or [`dump-signedexchange`](https://github.com/WICG/webpackage/blob/main/go/signedexchange/README.md#dump-a-signed-exchange-file):

```bash
dump-signedexchange -verify -uri $URL
```

If the SXG is present and valid, you will see a human readable printout of the SXG. Otherwise, you will see an error message.

### Indexing

Make sure your SXGs are successfully [indexed](https://support.google.com/webmasters/answer/7645831) by Google Search. Open Chrome DevTools, then perform a Google Search for your page. If it has been indexed as an SXG, Google's link to your page will include a `data-sxg-url` pointing to webpkgcache.com's copy:

If Google Search thinks the user is likely to click on the result, it will also prefetch it:

The `<link>` element instructs the browser to download the SXG into its prefetch cache. When the user clicks on the `<a>` element, the browser will use that cached SXG to render the page.

You can also see evidence of the prefetch by going to the Network tab in DevTools and searching for URLs containing `webpkgcache`.

If the `<a>` points to webpkgcache.com, this means Google Search indexing of the signed exchange is working. You can skip forward to the [Ingestion](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#ingestion) section.

Otherwise, it could be that Google hasn't recrawled your page yet since you enabled SXG. Try the [Google Search Console URL Inspection Tool](https://support.google.com/webmasters/answer/9012289):

The presence of a `digest: mi-sha256-03=...` header indicates that Google successfully crawled the SXG version.

If a `digest` header is not present, this could be an indication that an SXG was not served to Googlebot or that the index hasn't been updated since you enabled SXGs.

If an SXG is successfully crawled, but it still isn't being linked to, then it may be a failure to meet SXG cache requirements. These are covered in the next section.

### Ingestion

When Google Search indexes an SXG, it sends its copy to the Google SXG Cache, which validates it against the [cache requirements](https://github.com/google/webpackager/blob/main/docs/cache_requirements.md). The Chrome extension shows the result:

If you see a check mark (✅), then you can skip ahead to [Optimize](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#optimize).

If it fails to meet the requirements, you will see a cross mark (❌) and a warning message indicating why:

In this event, the page will work just as it did before enabling SXG. Google will link to the page on its original host without an SXG prefetch.

In the event that the cached copy has expired and is being re-fetched in the background, you will see an hourglass (⌛):

The Google developer document on SXG also has instructions for [querying the cache manually](https://developers.google.com/search/docs/advanced/experience/signed-exchange#debug-the-google-sxg-cache).

## Optimize

If the SXG Validator Chrome extension shows all check marks (✅), you have a SXG that can be served to users! Read on to find out how to optimize your web page so that you get the *most* LCP improvement from SXG.

### max-age

When SXGs expire, the Google SXG Cache will fetch a new copy in the background. While waiting for that fetch, users are directed to the page on its original host, which is not prefetched. The longer you set `Cache-Control: max-age`, the less often this background fetch happens, and thus the more often that LCP can be reduced by prefetch.

This is a tradeoff between performance and freshness, and the cache allows site owners to provide SXGs with a max-age anywhere between 2 minutes and 7 days, to fit each page's particular needs. Anecdotally, we find that:

- `max-age=86400` (1 day) or longer works well for performance
- `max-age=120` (2 minutes) does not

We hope to learn more about values in between those two, as we study the data more.

> [!NOTE]
> **Note:** We plan to make this tradeoff easier to manage in the future, by adding a cache purge API. It will be announced on [webpackaging-announce](https://groups.google.com/g/webpackaging-announce).

### user-agent

One time, I saw LCP *increase* when using a prefetched SXG. I ran [WebPageTest](https://www.webpagetest.org/), comparing median results without and with SXG prefetch. Clicking on **After** below:

 

I saw that prefetch was working. The HTML is removed from the critical path and, thus, all of the subresources are able to load earlier. But LCP---that green dashed line---**increased from 2s to 2.1s**.

To diagnose this, I looked at the film strips. I found that the page rendered differently in SXG. In plain HTML, Chrome determined that the "largest element" for LCP was the headline. However, in the SXG version, the page added a lazy-loaded banner, which pushed the headline below the fold and caused the new largest element to be the lazy-loaded cookie consent dialog. Everything rendered faster than before, but a change in layout caused the metric to report it as slower.

I dug deeper and discovered the reason for the difference in layout is that the page varies by `User-Agent`, and there was an error in the logic. It was serving a desktop page even though the SXG crawl header indicated mobile. After this was fixed, the browser correctly identified the page's headline as its largest element again.

Now, clicking on "After", I saw that the prefetched LCP **drops to 1.3s**:

 

SXGs are enabled for all form factors. To prepare for that, ensure that one of these is true:

- Your page doesn't `Vary` by `User-Agent` (e.g. it uses [responsive design](https://developers.google.com/search/mobile-sites/mobile-seo/responsive-design) or [separate mobile/desktop URLs](https://developers.google.com/search/mobile-sites/mobile-seo/separate-urls)).
- If your page uses [dynamic serving](https://developers.google.com/search/mobile-sites/mobile-seo/dynamic-serving), it annotates itself as mobile- or desktop-only using [`<meta name=supported-media content=...>`](https://github.com/google/webpackager/blob/main/docs/supported_media.md).

### Subresources

SXGs can be used to prefetch subresources (including images) along with the HTML. Cloudflare ASX will scan the HTML for same-origin (first-party) `<link rel=preload>` elements and convert them into [SXG-compatible Link headers](https://github.com/WICG/webpackage/blob/main/explainers/signed-exchange-subresource-substitution.md). Details in the source code [here](https://github.com/google/sxg-rs/blob/d16e66a2b8d5e0c069ec70af198dd95f640321d8/cloudflare_worker/worker/src/index.ts#L250-L275) and [here](https://github.com/google/sxg-rs/blob/d16e66a2b8d5e0c069ec70af198dd95f640321d8/sxg_rs/src/link.rs).

If it's working, you'll see additional prefetches from Google Search:

To optimize for LCP, look closely at your waterfall, and figure out which resources are on the critical path to rendering the largest element. If they can't be prefetched, consider if they can be [taken off the critical path](https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources.md.txt#how_to_eliminate_render-blocking_scripts). Be on the lookout for scripts that hide the page until they are done loading.

The Google SXG Cache allows [up to 20](https://github.com/google/webpackager/blob/main/docs/cache_requirements.md#:%7E:text=There%20may%20be%20no%20more%20than%2020%20rel%3Dpreloads.) subresource preloads and ASX [ensures](https://github.com/google/sxg-rs/blob/33fa49bbd1f156ce92de0e3b6af9e352b1ba8d9f/sxg_rs/src/link.rs#L60) that this limit isn't exceeded. However, there is a risk in adding too many subresource preloads. The browser will only use preloaded subresources [if all of them have finished fetching](https://github.com/WICG/webpackage/blob/main/explainers/signed-exchange-subresource-substitution.md#:%7E:text=If%20every%20member,their%20original%20URLs.), in order to [prevent cross-site tracking](https://wicg.github.io/webpackage/loading.html#:%7E:text=This%20is%20intended%20to%20prevent%20the%20referrer%20page%20from%20encoding%20a%20tracking%20ID%20into%20the%20set%20of%20subresources%20it%20prefetches.). The more subresources there are, the less likely all of them will have finished prefetching before the user clicks through to your page.

> [!NOTE]
> **Note:** ASX currently only supports prefetch for same-origin (first-party) subresources. If you know of third-party subresource providers who support SXG, let us know on [this bug](https://github.com/google/sxg-rs/issues/82) so we can prioritize adding cross-origin support.

SXG Validator does not currently check subresources; to debug, use `curl` or `dump-signedexchange` in the meantime.

## Measure

After optimizing the LCP improvement under WebPageTest, it's useful to measure the impact of SXG prefetching on the overall performance of your site.

### Server-side metrics

When measuring server-side metrics such as [Time to First Byte (TTFB)](https://web.dev/articles/ttfb), it's important to note that your site only serves SXGs to crawlers that accept the format. Limit your measurement of TTFB to requests coming from real users, and not bots. You may find that generating SXGs increases the TTFB for crawler requests, but this has no impact on your visitors' experience.

### Client-side metrics

SXGs produce the most speed benefit for client-side metrics, especially LCP. When measuring their impact, you could simply enable Cloudflare ASX, wait for it to be re-crawled by Googlebot, wait an additional 28 days for Core Web Vitals (CWV) aggregation, and then look at your new CWV numbers. However, the change might be hard to spot when mixed in among all the other changes during this time frame.

Instead, I find it helpful to "zoom in" on the potentially affected page loads, and frame it as, "SXGs affect X% of page views, improving their LCP by Y milliseconds at the 75th percentile."

Currently, SXG prefetch only happens under certain conditions:

- Chromium browser (e.g. Chrome or Edge except on [iOS](https://chromium.googlesource.com/chromium/src.git/+/HEAD/docs/ios/user_agent.md)), version M98 or higher
- `Referer: google.com` or other [Google search domains](https://source.chromium.org/chromium/chromium/src/+/main:components/google/core/common/google_tld_list.h;l=13-42;drc=bea0acf022da996a8ff1dbdee378667a66c768e4). (Note that in Google Analytics, a referral tag applies to [all page views in the session](https://support.google.com/analytics/answer/6205762#flowchart&zippy=%2Cin-this-article), whereas SXG prefetch only applies to the first page view, directly linked from Google Search.)

> [!NOTE]
> **Note:** Google Search is planning to expand the contexts where SXG prefetch can occur, including desktop OSes and more. This may increase the X% over time, and also means you may want to update your metrics to accommodate the change. When that happens, it should be announced on [webpackaging-announce](https://groups.google.com/g/webpackaging-announce).

Read the [Contemporary study section](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#contemporary_study) for how to measure "X% of page views" and "improving their LCP by Y milliseconds".

### Contemporary study

When looking at real user monitoring (RUM) data, you should split page loads into SXG and non-SXG. When doing so, it is essential to limit the set of page loads you look at, so the non-SXG side matches the eligibility conditions for SXG, in order to avoid selection bias. Otherwise, all of the following would exist *only* in the set of non-SXG page loads, which may have innately different LCP:

- **iOS devices:** due to differences in hardware or network speed among the users who have these devices.
- **Older Chromium browsers:** for the same reasons.
- **Desktop devices:** for the same reasons or because the page layout causes a different "largest element" to be chosen.
- **Same-site navigations (visitors following links within the site):** because they can reuse cached subresources from the previous page load.

In Google Analytics (UA), [create two custom dimensions](https://support.google.com/analytics/answer/2709829) with scope "Hit", one named "isSXG" and one named "referrer". (The built-in "Source" dimension has [session scope](https://support.google.com/analytics/answer/2709828#example-session&zippy=%2Cin-this-article), so it doesn't exclude same-site navigations.)

Create a custom segment named "SXG counterfactual" with the following filters ANDed together:

- `referrer` starts with `https://www.google.`
- `Browser` exactly matches `Chrome`
- `Browser` Version matches regex `^(9[8-9]|[0-9]{3})`
- `isSXG` exactly matches `false`

Create a copy of this segment, named "SXG", except with `isSXG` exactly matches `true`.

In your site template, add the following snippet above the Google Analytics snippet. This is a [special syntax](https://github.com/google/sxg-rs#sxg-only-behavior) that ASX will change `false` to `true` when generating a SXG:

```html
<script data-issxg-var>window.isSXG=false</script>
```

Customize your Google Analytics reporting script [as recommended](https://github.com/GoogleChrome/web-vitals#send-the-results-to-google-analytics) to record LCP. If you're using gtag.js, modify the `'config'` command to set the custom dimension (replacing `'dimension1'` and `'dimension2'` with the names that Google Analytics says to use):

```javascript
gtag('config', 'YOUR_TRACKING_ID', {
  'dimension1': String(isSXG),
  'dimension2': document.referrer,
});
```

If you're using analytics.js, modify the `'create'` command as [documented here](https://developers.google.com/analytics/devguides/collection/analyticsjs/creating-trackers).

After waiting a few days to collect some data, go to the Google Analytics Events report and add a drilldown for the SXG segment. This should fill in the X for "SXGs affect X% of page views":

Finally, go to the [Web Vitals Report](https://web-vitals-report.web.app/), select "Choose segments", and select "SXG counterfactual" and "SXG".

> [!WARNING]
> **Deprecated:** Note the Web Vitals Report has since been deprecated.

Click "Submit", and you should see LCP distributions for the two segments. This should fill in the Y for "improving their LCP by Y milliseconds at the 75th percentile":

#### Caveats

Once you've applied all of the above filters, SXG counterfactual page loads should consist of things like these:

- **Cache misses:** If the Google SXG Cache doesn't have a fresh copy of the SXG for a given URL, it will redirect to the original URL at your site.
- **Other result types:** Currently, Google Search only supports SXG for standard web results and a few other types. Others, like Featured Snippets and Top Stories Carousel, will link to the original URL at your site.
- **Ineligible URLs:** If some pages on your site are not eligible for SXG (e.g. because they are not cacheable), they could appear in this set.

There may be remaining bias between the SXG page loads and the above set of non-SXG page loads, but it should be smaller in magnitude than the biases mentioned at the top of the [Contemporary study section](https://developer.chrome.com/blog/optimizing-lcp-using-signed-exchanges.md.txt#contemporary_study). For example, perhaps your non-cacheable pages are slower or faster than your cacheable pages. If you suspect this could be an issue, consider looking at the data limited to a specific SXG-eligible URL to see if its results match the overall study.

If your site has some [AMP](https://amp.dev/) pages, they probably won't see performance improvements from enabling SXG, as they can already be prefetched from Google Search. Consider adding a filter to exclude such pages, to further "zoom in" on the relevant changes.

Lastly, even addressing all selection biases, there is risk that survivorship bias makes LCP improvements look like degradations in RUM statistics. [This article](https://simonhearne.com/2022/survorship-bias-in-webperf/) does a great job of explaining that risk, and suggests looking at some form of abandonment metric to detect whether this is happening.

### Before/after study

To corroborate results from the contemporary study, it may be useful to do a comparison of LCP before and after enabling SXG. Don't limit to SXG page views, to eliminate the potential biases noted above. Instead, look at SXG-eligible results---the above segment definitions but without the `isSXG` constraint.

Note that Google Search may take up to several weeks to recrawl all pages on your site, in order to identify that SXG has been enabled for them. In those several weeks, there are other potential biases that may occur:

- New browser releases or improvements in users' hardware may speed up page loads.
- A significant event like a holiday may skew traffic from normal.

It also is helpful to look at overall 75th percentile LCP before and after, to confirm the above studies. Learning about a subset of the population doesn't necessarily tell us about the overall population. For instance, let's say SXG improves 10% of page loads by 800ms.

- If these were already the 10% fastest page loads, then it won't affect the 75th percentile at all.
- If they were the 10% slowest page loads, but they were more than 800ms slower than the 75th percentile LCP to begin with, then it won't affect the 75th percentile at all.

These are extreme examples, likely not reflective of reality, but hopefully illustrate the issue. In practice, it's likely that SXG will affect the 75th percentile for most sites. Cross-site navigations tend to be some of the slowest, and improvements from prefetching tend to be significant.

### Opt-out some URLs

Lastly, one way to compare SXG performance could be to disable SXG for some subset of URLs on your site. For instance, you could set a `CDN-Cache-Control: no-store` header to prevent Cloudflare ASX from generating an SXG. I recommend against this.

It likely has a bigger risk of selection bias than the other study methods. For instance, it may make a big difference whether your site's home page or a similarly popular URL is selected into the control group or the experiment group.

### Holdback study

The ideal way to measure impact would be to conduct a holdback study. Unfortunately, you can't do this kind of test currently. We're planning to add support for such a test in the future.

A holdback study has the following properties:

- In the experiment group, some random fraction of page views that *would* be SXG are "held back", and served as non-SXG instead. This allows for an "apples-to-apples" comparison between equivalent users, devices, scenarios, and pages.
- Those held-back (aka counterfactual) page views are labeled as such in the analytics. This allows for a "zoomed-in" view of the data, where we can compare SXG page loads in the control to SXG counterfactuals in the experiment. This, in turn, reduces noise from the other page loads that would be unaffected by SXG prefetch.

This would eliminate the aforementioned possible sources of selection bias, although it wouldn't eliminate the risk of LCP survivorship bias. Both of these properties require either the browser or the referrer to enable.

## Conclusion

Phew! That was a lot. Hopefully it paints a more complete picture of how to test SXG performance in a lab test, how to optimize its performance in a tight feedback loop with the lab test, and finally how to measure its performance in the real world. Putting all of this together should help you make the most out of SXGs, and ensure that they are benefiting your site and your users.

If you have additional advice on how to capture SXG performance, please let us know! [File a bug against developer.chrome.com](https://github.com/GoogleChrome/developer.chrome.com) with your suggested improvements.

For more information on signed exchanges, take a look at the [web.dev documentation](https://web.dev/articles/signed-exchanges) and the [Google Search documentation](https://developers.google.com/search/docs/advanced/experience/signed-exchange).
