---
source_url: https://developer.chrome.com/docs/web-platform/bfcache-ccns
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: 0fb2764a71f59bac3c292cde1b52e01430b1a0b9489b684fb34feb0153598f8f
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Published: October 21, 2024, Last updated: Sep 9, 2025

Chrome is making a change to allow [back/forward cache (bfcache)](https://web.dev/articles/bfcache) usage for pages using `Cache-Control: no-store` when this is safe to do. Find out what that means for developers.

> [!IMPORTANT]
> **Important:** Update 11th March 2025. We are completing the final rollout to 100% of users over March and April 2025.

## Background

Setting `Cache-Control: no-store` as an HTTP Header is a signal that the page shouldn't be stored in the HTTP cache. This should be used for pages containing sensitive data---for example, for pages when a user is logged in---but the `no-store` directive is often used on pages without sensitive data.

With bfcache, instead of destroying a page when the user navigates away, we postpone destruction and pause JS execution. If the user navigates back soon, we make the page visible again and unpause JS execution. This results in a near instant page navigation for the user.

While it is not required by the HTML spec, browsers typically take `Cache-Control: no-store` as a signal to avoid placing the page in bfcache. This [is the largest reason the bfcache is not used](https://github.com/fergald/explainer-bfcache-ccns/blob/main/README.md#problem), for about 17% of history navigations on mobile and 7% of history navigations on desktop. This means these pages don't benefit from the quick restores and must fully reload the page, including any network calls, JavaScript execution, and rendering.

Often `Cache-Control: no-store` is set to avoid caching issues when the site changes, but this reason is less relevant when the bfcache is used, as the full page is restored almost as if it had been left open all along.

## How Chrome is changing this behavior

Chrome has [announced an intention to change this behavior](https://groups.google.com/a/chromium.org/g/blink-dev/c/GuRqI7zXWMY/m/us6Rzd-xBgAJ) but is taking a cautious approach to this change. We have been running experiments since Chrome 116 gradually increasing the percentage of page loads and this is expected to reach 100% in March and April 2025.

### Sensitive data

While our analysis shows the majority of back or forward navigations don't include sensitive data and so should be eligible for the bfcache, there are cases where pages shouldn't be placed in the bfcache. For example on logging out, it shouldn't be possible to retrieve a logged in page by navigating back or forth.

To avoid this, Chrome will evict a page from the bfcache on changes to cookies, or [other authorization methods](https://github.com/fergald/explainer-bfcache-ccns/blob/main/README.md#authorization).

In addition, use of the following APIs for pages using `Cache-Control: no-store` will continue to make those pages ineligible for bfcache:

- [WebSocket](https://developer.mozilla.org/docs/Web/API/WebSocket)
- [WebTransport](https://developer.mozilla.org/docs/Web/API/WebTransport)
- [WebRTC](https://developer.mozilla.org/docs/Web/API/WebRTC_API)

Additionally if a `Cache-control: no-store` page makes a fetch or XHR request and that returns `Cache-control: no-store` on its response, then this will also evict the page as it may contain sensitive data.

Note that this is not a comprehensive list of APIs which prevent bfcache usage but the APIs that block bfcache on `Cache-Control: no-store` pages even if they are not being used at the time of leaving the page.

The bfcache timeout for `Cache-Control: no-store` pages is also reduced to 3 minutes (from 10 minutes used for pages which don't use `Cache-Control: no-store`) to further reduce risk.

### Enterprise out opts

Enterprises often have difficult-to-update software and shared devices. The `AllowBackForwardCacheForCacheControlNoStorePageEnabled` policy can be disabled to continue to prevent bfcache usage for `Cache-Control: no-store` pages.

### Testing the change

Developers can test this change with the following flag:

```bash
--enable-features=CacheControlNoStoreEnterBackForwardCache:level/restore-unless-cookie-change
```

If any of the previous exceptions apply---for example, cookies changing---this will prevent the page from using the bfcache with a reason of "Pages whose main resource has `Cache-Control: no-store` cannot enter back/forward cache." showing in the [Chrome DevTools bfcache tester](https://developer.chrome.com/docs/devtools/application/back-forward-cache.md.txt).

You can use this [bfcache test page](https://chrome.dev/f/bfcache_no_store/) to test with and without this flag.

## What developers should know

While developers won't need to make any changes for their users to benefit from this greater bfcache usage, there are some things that they may need to consider as a result of this. These were similar considerations that other sites may have experienced in the initial launch of bfcache in December 2021.

### Should developers still aim to reduce usage of `Cache-Control: no-store`?

The bfcache is enabled for `Cache-Control: no-store` under the previously mentioned limited circumstances and only for Chrome. Other browsers may still block bfcache usage when `Cache-Control: no-store` is used.

Best practice remains to [minimize use of `Cache-Control: no-store`](https://web.dev/articles/bfcache#minimize-no-store) rather than depend on these heuristics.

### Impact on performance

The reason we are making this change is to improve the page experience for users on the web. We saw noticeable improvements to Core Web Vitals when we first launched bfcache, and now we want to bring those same improvements to more sites.

Site owners may see an improvement to their Core Web Vitals as this rolls out, and can [measure bfcache usage in CrUX, including in CrUX Vis](https://cruxvis.withgoogle.com/).

### Impact analytics

Pages restored from the bfcache "restore" the old page (including the JavaScript heap) rather than reload the page. Many popular analytics providers don't measure bfcache restores as new page views since they only trigger page views when they are initially loaded.

Sites may therefore see a reduction in page loads in their analytics when they start using the bfcache for the first time. We recommend considering these as pageviews, by setting listeners for the `pageshow` event and checking the `persisted` property:

```javascript
// Send a pageview when the page is first loaded.
gtag("event", "page_view");

// Send another pageview if the page is restored from bfcache.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // Page was restored from bfcache, sent another page view.
    gtag("event", "page_view");
  }
});
```

### Handle updates on page restore

As sites may now see bfcache usage when they did not see this before and when the page would instead be fully reloaded with fresh data, developers may want to consider refreshing data on a bfcache restore.

Updates can be triggered in a similar manner to logging additional page views for analytics using the `pageshow` event and checking the `persisted` property.

Note that not all content needs to be updated and users may prefer going "back" to the content they saw previously. For example, refreshing a list of articles may mean the user no longer sees an article they were going back to view.

### Impact on advertisements

Similar to analytics impact, sites may see a reduction in ad impressions if ads only load on page load. Ads can be programmatically refreshed on bfcache restore to ensure parity with full page loads, again using the `pageshow` event and checking the `persisted` property but may [not always be the right thing to do](https://web.dev/articles/bfcache#ads-restore). Refer to your ad provider's documentation on how to trigger ad reloads.

## More information on bfcache

For more information on bfcache, see our [comprehensive bfcache technical guide](https://web.dev/articles/bfcache).

## Feedback

We are eager to hear feedback on this change which can be provided in [Chrome's issue tracker using the bfcache component](https://issues.chromium.org/issues/new?component=1457076&template=0).

## Conclusion

We are excited to bring the benefit of bfcache to many more pages to improve page experience for users. We have carefully considered this change and our approach seeks to roll this out in as safe a manner as possible. We hope the information provided here will help developers understand this change and make any changes necessary to avoid issues when this happens.
