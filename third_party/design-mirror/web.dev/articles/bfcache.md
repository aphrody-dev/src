---
source_url: https://web.dev/articles/bfcache
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: b761ffd5435d078855967b95581c2f69a57c397e3a1e0e443a8b97261171edfe
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Philip Walton [X](https://twitter.com/philwalton) [GitHub](https://github.com/philipwalton) [LinkedIn](https://www.linkedin.com/in/waltonphilip) [Mastodon](https://toot.cafe/@philipwalton) [Bluesky](https://bsky.app/profile/philipwalton.com) [Homepage](https://philipwalton.com/) Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Published: May 25, 2023, Last updated: October 16, 2026

Back/forward cache (or bfcache) is a browser optimization that enables instant
back and forward navigation. It significantly improves the browsing experience,
especially for users with slower networks or devices.

As web developers, it's critical to understand how to [optimize your pages for bfcache](https://web.dev/articles/bfcache.md.txt#optimize), so your users can reap the benefits.

> [!NOTE]
> Prefer video to reading? Check out this [DevTools Tips video on debugging bfcache](https://youtu.be/Y2IVv5KnrmI) for a summary of what's on this page.
> [Video](https://www.youtube.com/watch?v=Y2IVv5KnrmI)

## Browser compatibility

All major browsers include a bfcache, including Chrome since version 96, [Firefox](https://developer.mozilla.org/docs/Mozilla/Firefox/Releases/1.5/Using_Firefox_1.5_caching) and [Safari](https://webkit.org/blog/427/webkit-page-cache-i-the-basics/).

## bfcache basics

With back/forward cache (bfcache), instead of destroying a page when the user navigates away, we postpone destruction and pause JS execution. If the user navigates back soon, we make the page visible again and unpause JS execution. This results in a near instant page navigation for the user.

How many times have you visited a website and clicked a link to go to another page, only to realize it's not what you wanted and click the back button? In that moment, bfcache can make a big difference in how fast the previous page loads:

|---|---|
| **_Without_ bfcache enabled** | A new request is initiated to load the previous page, and, depending on how well that page has been [optimized](https://web.dev/explore/reliable#the-options-in-your-caching-toolbox) for repeat visits, the browser might have to re-download, re-parse, and re-execute some (or all) of resources it just downloaded. |
| **_With_ bfcache enabled** | Loading the previous page is _essentially instant_, because the entire page can be restored from memory, without having to go to the network at all. |

Check out this video of bfcache in action to understand the speed up it can bring to navigations:
[Video](https://www.youtube.com/watch?v=cuPsdRckkF0) Using bfcache makes pages load much more quickly during back and forward navigation.

In the video, the example with bfcache is quite a bit faster than the example without it.

bfcache not only speeds up navigation, it also reduces data usage, since resources don't have to be downloaded again.

Chrome usage data shows that 1 in 10 navigations on desktop and 1 in 5 on mobile are either back or forward. With bfcache enabled, browsers could eliminate the data transfer and time spent loading for billions of web pages every single day!

### How the "cache" works

The "cache" used by bfcache is different from the [HTTP cache](https://web.dev/articles/http-cache.md.txt), which plays its own role in speeding up repeat navigations. bfcache is a snapshot of the entire page in memory, including the JavaScript heap, whereas the HTTP cache contains only the responses for previously made requests. Since it's very rare for all requests required to load a page to be fulfilled from the HTTP cache, repeat visits using bfcache restores are always faster than even the most well-optimized non-bfcache navigations.

Freezing a page to potentially re-enable it again later involves some complexity in terms of how best to preserve in-progress code. For example, how do you handle `setTimeout()` calls where the timeout is reached while the page is in the bfcache?

The answer is that browsers pause any pending timers or unresolved promises for pages in bfcache, including almost all pending tasks in the [JavaScript task queues](https://html.spec.whatwg.org/multipage/webappapis.html#task-queue), and resume processing tasks if the page is restored from the bfcache.

In some cases, such as for timeouts and promises, this is fairly low risk, but in other cases it can lead to confusing or unexpected behavior. For example, if the browser pauses a task that's required as part of an [IndexedDB
transaction](https://developer.mozilla.org/docs/Web/API/IDBTransaction), it can affect other open tabs in the same origin, because the same IndexedDB databases can be accessed by multiple tabs simultaneously. As a result, browsers will generally not attempt to cache pages in the middle of an IndexedDB transaction or while using APIs that might affect other pages.

For more details on how various API usage affects a page's bfcache eligibility, see [Optimize your pages for bfcache](https://web.dev/articles/bfcache.md.txt#optimize).

### The bfcache and iframes

If a page contains embedded iframes, then the iframes themselves are not separately eligible for the bfcache. For example, if you navigate to another URL within an iframe, the previous content does not enter bfcache and if you go back, the browser will go "back" within the iframe rather than in the main frame, but the back navigation within the iframe won't use the bfcache.

However, when the main frame is restored from the bfcache, embedded iframes will be restored as they were when the page entered the bfcache.

The main frame can also be blocked from using the bfcache if an embedded iframe uses APIs that block this. The [Permissions Policy](https://web.dev/articles/bfcache.md.txt#permissions-policy) set on the main frame or the use of [`sandbox` attributes](https://developer.mozilla.org/docs/Web/HTML/Element/iframe#sandbox) can be used to avoid this.

### The bfcache and single page apps (SPA)

Because bfcache works with browser-managed navigations, it doesn't work for "soft navigations" within a single-page app (SPA). However, bfcache can still help when going back to an SPA rather than doing a full re-initialisation of that app again from the start.

### APIs to observe bfcache

Although bfcache is an optimization that browsers do automatically, it's still important for developers to know when it's happening so they can [optimize their pages for it](https://web.dev/articles/bfcache.md.txt#optimize) and [adjust any metrics or performance measurement](https://web.dev/articles/bfcache.md.txt#analytics) accordingly.

The primary events used to observe bfcache are the [page transition events](https://developer.mozilla.org/docs/Web/API/PageTransitionEvent) `pageshow` and `pagehide`, which are supported by [most browsers](https://caniuse.com/page-transition-events).

The newer [Page Lifecycle](https://developer.chrome.com/blog/page-lifecycle-api) events---`freeze` and `resume`---are also dispatched when pages enter or leave bfcache, as well as in some other situations, for example, when a background tab gets frozen to minimize CPU usage. These events are only supported in Chromium-based browsers.

#### Observe when a page is restored from bfcache

The `pageshow` event fires right after the `load` event when the page is initially loading and any time the page is restored from bfcache. The `pageshow` event has a [`persisted`](https://developer.mozilla.org/docs/Web/API/PageTransitionEvent/persisted) property, which is `true` if the page was restored from bfcache and `false` otherwise. You can use the `persisted` property to distinguish regular page loads from bfcache restores. For example:

```javascript
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    console.log("This page was restored from the bfcache.");
  } else {
    console.log("This page was loaded normally.");
  }
});
```

In browsers that support the Page Lifecycle API, the `resume` event fires when pages are restored from bfcache (immediately before the `pageshow` event) and when a user revisits a frozen background tab. If you want to update a page's state after it's frozen (which includes pages in the bfcache), you can use the `resume` event, but if you want to measure your site's bfcache hit rate, you'd need to use the `pageshow` event. In some cases, you might need to use both.

For details on bfcache measurement best practices, see [How bfcache affects analytics and performance measurement](https://web.dev/articles/bfcache.md.txt#analytics).

#### Observe when a page is entering bfcache

The `pagehide` event fires either when a page unloads or when the browser tries to put it in the bfcache.

The `pagehide` event also has a `persisted` property. If it's `false`, you can be confident a that page isn't about to enter the bfcache. However, `persisted` being `true` doesn't guarantee that a page will be cached. It means the browser _intends_ to cache the page, but there may be other factors that make it impossible to cache.

```javascript
window.addEventListener("pagehide", (event) => {
  if (event.persisted) {
    console.log("This page *might* be entering the bfcache.");
  } else {
    console.log("This page will unload normally and be discarded.");
  }
});
```

Similarly, the `freeze` event fires immediately after the `pagehide` event if `persisted` is `true`, but that only means the browser _intends_ to cache the page. It might still have to discard it for a number of reasons explained later.

## Optimize your pages for bfcache

Not all pages get stored in bfcache, and even when a page does get stored there, it won't stay there indefinitely. It's critical that developers understand what makes pages eligible (and ineligible) for bfcache to maximize their cache-hit rates.

The following sections outline the best practices to make it as likely as possible that the browser can cache your pages.

### Never use the `unload` event

The most important way to optimize for bfcache in all browsers is to never use the `unload` event. Ever!

The `unload` event is problematic for browsers because it predates bfcache and many pages on the internet operate under the (reasonable) assumption that a page won't continue to exist after the `unload` event has fired. This presents a challenge because many of those pages were _also_ built with the assumption that the `unload` event would fire any time a user is navigating away, which is no longer true (and [hasn't been true for a long time](https://developer.chrome.com/blog/page-lifecycle-api/#the-unload-event)).

So browsers are faced with a dilemma, they have to choose between something that can improve the user experience---but might also risk breaking the page.

Chrome has now [deprecated the `unload` event](https://developer.chrome.com/blog/unload-deprecated-in-chrome), so it will no longer fire in Chrome, except on iOS where all browsers use the WebKit rendering engine, and so behave like Safari.

On desktop, Firefox (and in the past, Chrome) have chosen to make pages ineligible for bfcache if they add an `unload` listener, which is less risky but also disqualifies _a lot_ of pages. Safari will attempt to cache some pages with an `unload` event listener, but to reduce potential breakage it won't run the `unload` event when a user is navigating away, which makes the event very unreliable.

On mobile, Safari (and in the past, Chrome) does attempt to cache pages with an `unload` event listener since the risk of breakage is lower due to the fact that the `unload` event has always been extremely unreliable on mobile. Firefox treats pages that use `unload` as ineligible for the bfcache, except on iOS, where all browsers use the WebKit rendering engine, and so behave like Safari.

Instead of using the `unload` event, use the `pagehide` event. The `pagehide` event fires in all cases where the `unload` event fires, and it _also_ fires when a page is put in the bfcache.

In fact, [Lighthouse](https://developer.chrome.com/docs/lighthouse) has a [`no-unload-listeners` audit](https://github.com/GoogleChrome/lighthouse/pull/11085), which will warn developers if any JavaScript on their pages (including that from third-party libraries) adds an `unload` event listener.

> [!WARNING]
> **Warning:** Never add an `unload` event listener! Use the `pagehide` event instead. Adding an `unload` event listener will make your site slower in Firefox, and the code won't even run most of the time in Chrome and Safari.

#### Use Permission Policy to prevent unload handlers being used on a page

Sites that don't use `unload` event handlers can ensure these are not added by using a [Permissions Policy](https://developer.chrome.com/blog/deprecating-unload/#permissions-policy).

```console
Permissions-Policy: unload=()
```

This also prevents third parties or extensions from slowing the site down by adding unload handlers and making the site ineligible for the bfcache.

> [!IMPORTANT]
> **Important:** This policy is only supported in Chromium-based browsers, which have now deprecated the \`unload\` event so it may not have an effect unless other browsers also start to support this header.

#### Only add `beforeunload` listeners conditionally

The `beforeunload` event won't make your pages ineligible for bfcache in modern browsers' bfcache but previously it did and it is still unreliable, so avoid using it unless absolutely necessary.

Unlike the `unload` event, however, there are legitimate uses for
`beforeunload`. For example, when you want to warn the user that they have
unsaved changes they'll lose if they leave the page. In this case, it's
recommended that you only add `beforeunload` listeners when a user has unsaved
changes and then remove them immediately after the unsaved changes are saved.
Don't

```javascript
window.addEventListener("beforeunload", (event) => {
  if (pageHasUnsavedChanges()) {
    event.preventDefault();
    return (event.returnValue = "Are you sure you want to exit?");
  }
});
```

This code adds a `beforeunload` listener unconditionally. Do

```javascript
function beforeUnloadListener(event) {
  event.preventDefault();
  return (event.returnValue = "Are you sure you want to exit?");
}

// A function that invokes a callback when the page has unsaved changes.
onPageHasUnsavedChanges(() => {
  window.addEventListener("beforeunload", beforeUnloadListener);
});

// A function that invokes a callback when the page's unsaved changes are resolved.
onAllChangesSaved(() => {
  window.removeEventListener("beforeunload", beforeUnloadListener);
});
```

This code only adds the `beforeunload` listener when it's needed (and removes it when it's not).

### Minimize use of `Cache-Control: no-store`

`Cache-Control: no-store` is an HTTP header web servers can set on responses that instructs the browser not to store the response in any HTTP cache. It's used for resources containing sensitive user information, such as pages behind a login.

Although bfcache is not an HTTP cache, historically, when `Cache-Control: no-store` is set on the page resource itself (as opposed to any subresource), browsers have chosen not to store the page in bfcache so any pages using `Cache-Control: no-store` may not be eligible for bfcache. There is [work underway to change this behavior for Chrome](https://developer.chrome.com/docs/web-platform/bfcache-ccns) in a privacy-preserving manner.

Since `Cache-Control: no-store` restricts a page's eligibility for bfcache, it should only be set on pages that contain sensitive information where caching of any sort is never appropriate.

For pages that need to always serve up-to-date content---and that content does not contain sensitive information---use `Cache-Control: no-cache` or `Cache-Control: max-age=0`. These directives instruct the browser to revalidate the content before serving it, and they don't affect a page's bfcache eligibility.

Note that when a page is restored from bfcache, it is restored from memory, not from the HTTP cache. As a result, directives like `Cache-Control: no-cache` or `Cache-Control: max-age=0` are not taken into account, and no revalidation occurs before the content is displayed to the user.

This is still likely a better user experience, however, as bfcache restores are instant and---since pages don't stay in the bfcache for very long---it's unlikely that the content is out of date. However, if your content does change minute-by-minute, you can fetch any updates using the `pageshow` event, as outlined in the next section.

### Update stale or sensitive data after bfcache restore

If your site keeps user state---especially any sensitive user information---that data needs to be updated or cleared after a page is restored from bfcache.

For example, if a user navigates to a checkout page and then updates their shopping cart, a back navigation could potentially expose out-of-date information if a stale page is restored from bfcache.

Another, more critical example is if a user signs out of a site on a public computer and the next user clicks the back button. This could potentially expose private data that the user assumed was cleared when they logged out.

To avoid situations like this, it's good to always update the page after a `pageshow` event if `event.persisted` is `true`:

```javascript
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    // Do any checks and updates to the page
  }
});
```

While ideally you would update the content in place, for some changes you may want to force a full reload. The following code checks for the presence of a site-specific cookie in the `pageshow` event and reloads if the cookie is not found:

```javascript
window.addEventListener('pageshow', (event) => {
  if (event.persisted && !document.cookie.match(/my-cookie)) {
    // Force a reload if the user has logged out.
    location.reload();
  }
});
```

A reload has the advantage that will still preserve the history (to allow forward navigations), but a redirect may be more appropriate in some cases.

### Ads and bfcache restore

As a publisher, you may want to refresh ads on each back/forward navigation. Making a page ineligible for bfcache through the use of `Cache-Control: no-store` is a bad approach that harms performance for your users.

Instead, you can keep your pages eligible for bfcache and refresh just the ads. Some ad tagging libraries, like [Google Publisher Tag (GPT)](https://developers.google.com/publisher-tag/reference#googletag.config.AutoRefreshConfig.backForwardCache), automatically refresh actively viewed ad slots when a user returns to a page through a bfcache restore. If your ad tagging library does not do this and you want ads to be refreshed, you can use the [`pageshow`](https://web.dev/articles/bfcache.md.txt#observe-page-restored) event to detect bfcache restores and trigger an ad refresh.

### Avoid `window.opener` references

In older browsers, if a page was opened using [`window.open()`](https://developer.mozilla.org/docs/Web/API/Window/open) from a link with [`target=_blank`](https://developer.mozilla.org/docs/Web/HTML/Element/a#target), without specifying [`rel="noopener"`](https://developer.mozilla.org/docs/Web/HTML/Link_types/noopener), the opening page would have a reference to the window object of the opened page.

In addition to [being a security risk](https://mathiasbynens.github.io/rel-noopener/), a page with a non-null [`window.opener`](https://developer.mozilla.org/docs/Web/API/Window/opener) reference can't safely be put into bfcache, because that could break any pages attempting to access it.

As a result, it's best to avoid creating `window.opener` references. You can do this by using `rel="noopener"` whenever possible (note, this is now the default in all modern browsers). If your site requires opening a window and controlling it through [`window.postMessage()`](https://developer.mozilla.org/docs/Web/API/Window/postMessage) or directly referencing the window object, neither the opened window nor the opener will be eligible for the bfcache.

### Close open connections before the user navigates away

As mentioned previously, when a page is held in the bfcache, it pauses all scheduled JavaScript tasks and resumes them when the page is taken out of the cache.

If these scheduled JavaScript tasks are only accessing DOM APIs---or other APIs isolated to just the current page---then pausing these tasks while the page is not visible to the user is not going to cause any problems.

However, if these tasks are connected to APIs that are also accessible from other pages in the same origin (for example: IndexedDB, Web Locks, WebSockets) this can be problematic because pausing these tasks may prevent code in other tabs from running.

As a result, some browsers won't attempt to put a page in bfcache in the following scenarios:

- Pages with an open [IndexedDB connection](https://developer.mozilla.org/docs/Web/API/IDBOpenDBRequest).
- Pages with in-progress [fetch()](https://developer.mozilla.org/docs/Web/API/Fetch_API) or [XMLHttpRequest](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest).
- Pages with an open [WebSocket](https://developer.mozilla.org/docs/Web/API/WebSocket) or [WebRTC](https://developer.mozilla.org/docs/Web/API/WebRTC_API) connection. Chrome (as of 149) and Safari do no block on open WebSockets but other browsers do.

If your page is using any of these APIs, we strongly recommend closing connections and removing or disconnecting observers during the `pagehide` or `freeze` event. That allows the browser to safely cache the page without the risk of affecting other open tabs.

Then, if the page is restored from the bfcache, you can reopen or reconnect to those APIs during the `pageshow` or `resume` event, or have them always automatically reopen using the `error` or `close` events. Ensure you do no open multiple connections if using multiple events.

The following example shows how to ensure that pages using IndexedDB are eligible for bfcache by closing an open connection in the `pagehide` event listener:

```javascript
let dbPromise;
function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open("my-db", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("keyval");
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });
  }
  return dbPromise;
}

// Close the connection to the database when the user leaves.
window.addEventListener("pagehide", () => {
  if (dbPromise) {
    dbPromise.then((db) => db.close());
    dbPromise = null;
  }
});

// Open the connection when the page is loaded or restored from bfcache.
window.addEventListener("pageshow", () => openDB());
```

### Test to ensure your pages are cacheable

Chrome DevTools can help you test your pages to ensure they're optimized for bfcache, and identify any issues that might prevent them from being eligible.

To test a page:

1. Navigate to the page in Chrome.
2. In DevTools, go to **Application** -\> **Back-forward Cache**.
3. Click the **Run Test** button. DevTools then tries to navigate away and back to determine whether the page can be restored from bfcache.

The **Back-forward Cache** panel in DevTools.

If the test is successful, the panel reports "Restored from back-forward cache".
A successfully restored page.

If it's unsuccessful, the panel indicates the reason why. If the reason is something you can address as a developer, the panel marks it as **Actionable**.
A failed bfcache test with an actionable result.

In this example, the use of an `unload` event listener makes the page [ineligible](https://web.dev/articles/bfcache.md.txt#never-use-the-unload-event) for bfcache. You can fix that by switching from `unload` to using `pagehide`:
Do

```javascript
window.addEventListener('pagehide', ...);
```

Don't

```javascript
window.addEventListener('unload', ...);
```

Lighthouse 10.0 also [added a bfcache audit](https://developer.chrome.com/blog/lighthouse-10-0#bfcache), which performs a similar test. For more information, see the [bfcache audit's docs](https://developer.chrome.com/docs/lighthouse/performance/bf-cache).

## How bfcache affects analytics and performance measurement

If you use an analytics tool to measure visits to your site, you might notice a decrease in the total number of pageviews reported as Chrome enables bfcache for more users.

In fact, you're likely already underreporting pageviews from other browsers that implement bfcache, because many popular analytics libraries don't measure bfcache restores as new pageviews.

To include bfcache restores in your pageview count, set listeners for the `pageshow` event and check the `persisted` property.

The following example shows how to do this with Google Analytics. Other analytics tools likely use similar logic:

```javascript
// Send a pageview when the page is first loaded.
// This happens by default just by loading gtag
gtag("config", "TAG_ID");

window.addEventListener("pageshow", (event) => {
  // Send another pageview if the page is restored from bfcache.
  if (event.persisted) {
    gtag("event", "page_view");
  }
});
```

### Measure your bfcache hit ratio

You may also want to measure whether the bfcache was used, to help identify pages that are not utilizing the bfcache. This can be done by measuring the navigation type for page loads:

```javascript
// Send a navigation_type when the page is first loaded.
// To do this disable the default pageview so you can manually send it
// supplemented with the additional detail.
gtag('config', 'TAG_ID', { send_page_view: false });
gtag('event', 'page_view', {
   'navigation_type': performance.getEntriesByType('navigation')[0].type;
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    // Send another pageview if the page is restored from bfcache.
    gtag('event', 'page_view', {
      'navigation_type': 'back_forward_cache';
    });
  }
});
```

Calculate your bfcache hit ratio using the counts for `back_forward` navigations and `back_forward_cache` navigations.

It is important to realize that there are a number of scenarios, outside of the site owners control, when a Back/Forward navigation won't use the bfcache, including:

- when the user quits the browser and starts it again
- when the user duplicates a tab
- when the user closes a tab and reopens it

In some of these cases the original navigation type may be preserved by some browsers and so may show a type of `back_forward` despite these not being Back/Forward navigations.

Even without those exclusions the bfcache will be discarded after a period to conserve memory.

So, website owners shouldn't be expecting a 100% bfcache hit ratio for all `back_forward` navigations. However, measuring their ratio can be useful to identify pages where the page itself is preventing bfcache usage for a high proportion of back and forward navigations.

The Chrome team has added the [`NotRestoredReasons` API](https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons) to help expose the reasons why pages don't use bfcache, so developers can improve their bfcache hit rates. The Chrome team has also [added navigation types to CrUX](https://developer.chrome.com/blog/crux-navigation-types) making it possible to see the number of bfcache navigations even without measuring it yourself.

### Performance measurement

bfcache can also negatively affect performance metrics collected [in the field](https://web.dev/articles/user-centric-performance-metrics.md.txt#in_the_field), specifically metrics that measure page load times.

Since bfcache navigations restore an existing page rather than initiate a new page load, the total number of page loads collected will decrease when bfcache is enabled. What's critical, though, is that the page loads being replaced by bfcache restores would likely have been some of the fastest page loads in your dataset. This is because back and forward navigations, by definition, are repeat visits, and repeat page loads are generally faster than page loads from first time visitors (due to [HTTP caching](https://web.dev/articles/http-cache.md.txt), as mentioned earlier).

The result is fewer fast page loads in your dataset, which will likely skew the distribution slower---despite the fact that the performance experienced by the user has probably improved!

There are a few ways to deal with this issue. One is to annotate all page load metrics with their respective [navigation type](https://www.w3.org/TR/navigation-timing-2/#sec-performance-navigation-types): `navigate`, `reload`, `back_forward`, or `prerender`. This lets you continue to monitor your performance within these navigation types, even if the overall distribution skews negative. We recommend this approach for non-user-centric page load metrics like [Time to First Byte (TTFB)](https://web.dev/articles/ttfb.md.txt).

For user-centric metrics like the [Core Web Vitals](https://web.dev/articles/vitals.md.txt), a better option is to report a value that more accurately represents what the user experiences.

> [!CAUTION]
> **Caution:** The `back_forward` navigation type in the [Navigation Timing API](https://www.w3.org/TR/navigation-timing-2/#sec-performance-navigation-types) is not to be confused with bfcache restores. The Navigation Timing API only annotates page loads, whereas bfcache restores are re-using a page loaded from a previous navigation.

### Impact on Core Web Vitals

[Core Web Vitals](https://web.dev/articles/vitals.md.txt) measure the user's experience of a web page across a variety of dimensions (loading speed, interactivity, visual stability), and since users experience bfcache restores as faster navigations than full page loads, it's important that the Core Web Vitals metrics reflect this. After all, a user doesn't care whether or not bfcache was enabled, they just care that the navigation was fast!

Tools that collect and report on the Core Web Vitals metrics, like the [Chrome User Experience Report](https://developer.chrome.com/docs/crux), treat bfcache restores as separate page visits in their dataset. And while there aren't dedicated web performance APIs for measuring these metrics after bfcache restores, you can approximate their values using existing web APIs:

- For [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp.md.txt), use the delta between the `pageshow` event's timestamp and the timestamp of the next painted frame, because all elements in the frame will be painted at the same time. In the case of a bfcache restore, LCP and FCP are the same.
- For [Interaction to Next Paint (INP)](https://web.dev/articles/inp.md.txt), keep using your existing Performance Observer, but reset the current INP value to 0.
- For [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls.md.txt), keep using your existing Performance Observer, but reset the current CLS value to 0.

For more details on how bfcache affects each metric, see the individual Core Web Vitals [metric guides pages](https://web.dev/articles/vitals.md.txt#core_web_vitals). For a specific example of how to implement bfcache versions of these metrics, refer to the [PR adding them to the web-vitals JS library](https://github.com/GoogleChrome/web-vitals/pull/87).

The [web-vitals](https://github.com/GoogleChrome/web-vitals) JavaScript library [supports bfcache restores](https://github.com/GoogleChrome/web-vitals/pull/87) in the metrics it reports.

## Additional resources

- [Firefox Caching](https://developer.mozilla.org/Firefox/Releases/1.5/Using_Firefox_1.5_caching) _(bfcache in Firefox)_
- [Page Cache](https://webkit.org/blog/427/webkit-page-cache-i-the-basics/) _(bfcache in Safari)_
- [Back/forward cache: web exposed behavior](https://docs.google.com/document/d/1JtDCN9A_1UBlDuwkjn1HWxdhQ1H2un9K4kyPLgBqJUc/edit?usp=sharing) _(bfcache differences across browsers)_
- [Performance Game Changer: Browser Back/Forward Cache](https://www.smashingmagazine.com/2022/05/performance-game-changer-back-forward-cache/) _(a case study from Smashing Magazine showing dramatic Core Web Vitals improvements by enabling bfcache)_
