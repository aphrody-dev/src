---
source_url: https://web.dev/articles/performance-audit-tools
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:22+00:00
sha256: 0629660310e5c959b9f02645840c3f301c433284b78dc96a23b00c3c7a19e1bd
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Sam Dutton [X](https://twitter.com/sw12) [GitHub](https://github.com/samdutton) [Mastodon](https://techhub.social/@samdutton) [Bluesky](https://bsky.app/profile/samdutton.bsky.social) [Homepage](https://samdutton.com)

There are several core objectives for building a performant, resilient site with low data cost.

For each objective, you need an audit.

| **Objective**                                                              | **Why?**                                                                                                                                                                                                                                        | **What to test for?**                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ensure privacy, security and data integrity, and enable powerful API usage | [Why HTTPS Matters](https://developers.google.com/web/fundamentals/security/encrypt-in-transit/why-https)                                                                                                                                       | HTTPS implemented for all site pages/routes and assets.                                                                                                                                                                                                                                                                                                                                                                               |
| Improve load performance                                                   | [53% of users abandon sites](https://www.doubleclickbygoogle.com/articles/mobile-speed-matters/) that take longer than three seconds to load                                                                                                    | JavaScript and CSS that could be loaded asynchronously or deferred. Set goals for time to interactive and payload size: for example TTI on 3G. [Set a performance budget](https://infrequently.org/2017/10/can-you-afford-it-real-world-web-performance-budgets/).                                                                                                                                                                    |
| Reduce page weight                                                         | • Reduce data cost for users with capped data plans • Reduce web app storage requirements --- particularly important for users on low-spec devices • Reduce hosting and serving costs • Improve serving performance, reliability and resilience | Set a page weight budget: for example, first load under 400 kB. Check for heavy JavaScript. Check file sizes to find bloated images, media, HTML, CSS and JavaScript. Find images that could be lazy loaded, and check for unused code with [coverage tools](https://developers.google.com/web/updates/2017/04/devtools-release-notes#coverage).                                                                                      |
| Reduce resource requests                                                   | • Reduce [latency issues](https://www.igvita.com/2012/07/19/latency-the-new-web-performance-bottleneck/) • Reduce serving costs • Improve serving performance, reliability and resilience                                                       | Look for excessive or unnecessary requests for any type of resource. For example: files that are loaded repeatedly, JavaScript that is loaded in multiple versions, CSS that is never used, images that are never viewed (or could be lazy loaded).                                                                                                                                                                                   |
| Optimize memory usage                                                      | [Memory can become the new bottleneck](https://timkadlec.com/2013/11/why-we-need-responsive-images-part-deux/), especially on mobile devices                                                                                                    | Use the Chrome Task Manager to compare your site against others for memory usage when loading the home page and using other site features.                                                                                                                                                                                                                                                                                            |
| Reduce CPU load                                                            | Mobile devices have limited CPU, especially low-spec devices                                                                                                                                                                                    | Check for heavy JavaScript. Find unused JavaScript and CSS with [coverage tools](https://developers.google.com/web/updates/2017/04/devtools-release-notes#coverage). Check for [excessive DOM size](https://developers.google.com/web/tools/lighthouse/audits/dom-size) and scripts that run unnecessarily on first load. Look for JavaScript loaded in multiple versions, or libraries that could be avoided with minor refactoring. |

There is a wide range of tools and techniques for auditing websites:

- System tools
- Built-in browser tools
- Browser extensions
- Online test applications
- Emulation tools
- Analytics
- Metrics provided by servers and business systems
- Screen and video recording
- Manual tests

Below you'll learn which approach is relevant for each type of audit.

> [!NOTE]
> **Note:** **Images constitute by far the [most weight](http://httparchive.org/interesting.php#bytesperpage) and [most requests](http://httparchive.org/trends.php#bytesImg&reqImg) for most web pages.** [Latency gets worse as connectivity gets worse](https://www.igvita.com/2012/07/19/latency-the-new-web-performance-bottleneck/) so excessive image file requests are an increasing problem as the web goes mobile. Images also consume power: more image requests, more radio usage, more flat batteries. [Even just to render images takes power](http://httparchive.org/trends.php#bytesImg&reqImg) -- and this is proportional to the size and quantity of images. Likewise for memory: small increases in pixel dimensions result in big increases in memory usage. With images on mobile --- especially on low-spec devices --- [memory can become the new bottleneck](https://timkadlec.com/2013/11/why-we-need-responsive-images-part-deux/). Bloated images are also problematic for users on capped data plans. [Remove redundant images](https://developers.google.com/web/fundamentals/design-and-ui/responsive/content#viewport)! If you can't get rid of them, optimize: increase compression as much as possible, reduce pixel dimensions, and use the format that gives you the smallest file sizes. Optimizing 'hero images' such as banners and backgrounds is an easy, one-off win.

## Record resource requests: Number, size, type and timing

A good place to start when auditing a site is to check pages with your browser's network tools.
If you're not sure how to do this, work through the Chrome DevTools network panel
[Get Started Guide](https://web.dev/web/tools/chrome-devtools/network-performance).
Similar tools are available for
[Firefox](https://developer.mozilla.org/docs/Tools/Network_Monitor),
[Safari](https://developer.apple.com/library/content/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/Instruments/Instruments.html#//apple_ref/doc/uid/TP40007874-CH4-SW1),
[Internet Explorer](<https://web.dev/%3Chttps://msdn.microsoft.com/library/gg130952(v=vs.85).aspx%3E>) and
[Edge](https://docs.microsoft.com/microsoft-edge/f12-devtools-guide/network).

Remember to keep a record of results before you make changes. For network requests, that can be as
simple as a screenshot --- you can also
[save profile data](https://developer.chrome.com/docs/devtools/network/reference#record) as a JSON file. There's more information below about [how to save and share test results](https://web.dev/articles/performance-audit-tools.md.txt#save_the_results).

Before you begin auditing network usage, make sure to
[disable the browser cache](https://developer.chrome.com/docs/devtools/network/reference#disable-cache)
to ensure you get accurate statistics for first-load performance. If you already do caching via a
service worker,
[clear Cache API storage](https://web.dev/web/tools/chrome-devtools/progressive-web-apps).
You may want to use an Incognito (Private) window, so that you don't have to worry about disabling
the browser cache or removing previously cached entries.

Here are some core features and metrics you should check with browser tools:

- Load performance: [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview#devtools) provides a summary of load metrics. Addy Osmani has written a great summary of [key user moments](https://medium.com/@addyosmani/progressive-web-apps-with-react-js-part-2-page-load-performance-33b932d97cf2) for page load.
- [Timeline events](https://developer.chrome.com/docs/devtools/performance) for loading and parsing resources, and memory usage. If you want to go deeper, run memory and JavaScript [profiling](https://developer.chrome.com/docs/devtools/performance).
- Total page weight and number of files.
- Number and weight of JavaScript files.
- Any particularly large individual JavaScript files (over, say, 100KB).
- Unused JavaScript. You can check using the Chrome [coverage tool](https://developer.chrome.com/blog/new-in-devtools-59).
- Total number and weight of image files.
- Any particularly large individual image files.
- Image formats: are there [PNGs that could be JPEGs or SVGs](https://web.dev/explore/fast#optimize-your-images)? Is WebP used with fallbacks?
- Whether responsive image techniques (such as [srcset](https://css-tricks.com/responsive-images-youre-just-changing-resolutions-use-srcset/)) are used.
- HTML file size.
- Total number and weight of CSS files.
- Unused CSS. (In Chrome, use the [coverage panel](https://umaar.com/dev-tips/121-css-coverage/).)
- Check for problematic usage of other assets such as Web Fonts (including icon fonts).
- Check the DevTools timeline for anything that blocks page load.

If you're working from fast wifi or a fast cellular connection, test with [low bandwidth and high
latency emulation](https://web.dev/web/tools/chrome-devtools/network-performance/network-conditions).
Remember to test on mobile as well as desktop --- some sites use UA sniffing to deliver different
assets and layouts for different devices. You may need to test on actual hardware using
[remote debugging](https://developer.chrome.com/docs/devtools/remote-debugging),
not just with device simulation.

> [!NOTE]
> **Note:** **You can often use browser tools to spot problems simply by checking network responses and ordering by size.** For example: the 349KB PNG here looked like it could be a problem: Sure enough, it turned out the image was 1600px wide, whereas the maximum display width of the element was only 400px. Decompressed, the image needed over 4MB of memory, which is a lot on a mobile phone. Resaving the image as an 800px wide JPEG (to cope with 400px display width on 2x screens) and optimizing with [ImageOptim](https://imageoptim.com/) resulted in a 17KB file: compare the [original PNG](https://drive.google.com/open?id=0B9xlQg9Xpugsb0VpQldsN3YwSEE) with the [optimized JPEG](https://drive.google.com/open?id=0B9xlQg9XpugsTlBVNlQ1bUdQa0U).
>
> <br />
>
> That's a 95% improvement!

## Check memory and CPU load

Before you make changes, keep a record of memory and CPU usage.

In Chrome you can access the Task Manager from the Window menu. This is a simple way to check a
web page's requirements.
Chrome's Task Manager --- watch out for memory and CPU hogs!

## Test first and subsequent load performance

[Lighthouse](https://developer.chrome.com/docs/lighthouse),
[WebPagetest](https://www.webpagetest.org/easy) and
[Pagespeed Insights](https://developers.google.com/speed/pagespeed/insights/) are useful for analyzing speed, data cost and resource usage. WebPagetest will also check static-content
caching, time to first byte, and if your site makes effective use of CDNs.

> [!NOTE]
> **Note:** **It's simple to enable static-content caching so browsers can cache assets the first time they're requested, by configuring your server to include appropriate headers.** If a browser can cache resources, it won't need to retrieve them from the network on subsequent visits. This improves load speed, cuts data cost and reduces network and server load --- even for browsers that don't support caching via a service worker. [Even if you're using the Cache API](https://jakearchibald.com/2016/caching-best-practices/) it's important to enable browser caching. To find out more, take a look at [PageSpeed Tools](https://developers.google.com/speed/docs/insights/LeverageBrowserCaching) and the resources on [Web Fundamentals](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/http-caching) (in particular, the 'Invalidating and updating cached responses' section).

## Save the results

- **WebPagetest** : [test results each have their own URL](https://www.webpagetest.org/result/170428_NW_cc5afd75a2041f7e09984f33e4a4ae14/).
- **Pagespeed Insights** : the [online](https://developers.google.com/speed/pagespeed/insights) Pagespeed Insights tool [now includes Chrome User Experience report data](https://webmasters.googleblog.com/2018/01/real-world-data-in-pagespeed-insights.html?m=1) highlighting real-world performance stats.
- **Lighthouse** : save reports from the Chrome DevTools Audit panel by clicking on the download button:

## Test for core Progressive Web App requirements

[Lighthouse](https://developer.chrome.com/docs/lighthouse) helps you test security,
functionality, accessibility, performance and search engine performance. In particular, Lighthouse
checks if your site successfully implements PWA features such as service workers and a Web App manifest.

Lighthouse also tests whether your site can provide an acceptable offline experience.

You can download a Lighthouse report as JSON or, if you're using the
[Lighthouse Chrome Extension](https://chrome.google.com/webstore/detail/lighthouse/blipmdconlkpinefehnmjammfjpmpbjk),
share the report as a GitHub Gist: click on the share button, select Open in Viewer, then click on
the share button again in the new window and Save as Gist.
Export a report to a gist from the Lighthouse Chrome Extension --- click the share button

## Use analytics, event tracking and business metrics to track real-world performance

If you can, keep a record of analytics data before you implement changes: bounce rates, time on
page, exit pages: whatever's relevant to your business requirements.

If possible, record business and technical metrics that might be affected, so you can compare
results after making changes. For example: an e-commerce site might track orders-per-minute or
record stats for stress and endurance testing. Back-end storage costs, CPU requirements, serving
costs and resilience are likely to improve if you cut page weight and resource requests.

If analytics aren't implemented, now is the time! Business metrics and analytics are the final
arbiter of whether or not your site is working. If appropriate, incorporate
[event tracking](https://web.dev/analytics/devguides/collection/analyticsjs/events)
for user actions such as button clicks and video plays. You may also want to implement
[goal flow analysis](https://support.google.com/analytics/answer/2520139?ref_topic=1649581):
the paths by which your users navigate towards 'conversions'.

You can keep an eye on Google Analytics
[Site Speed](https://support.google.com/analytics/answer/1205784) to check how
performance metrics correlate with business metrics. For example: 'how fast did the homepage load?'
compared to 'did entry via the home page result in a sale?'

Google Analytics uses data from the
[Navigation Timing API](https://developer.mozilla.org/docs/Web/API/Navigation_timing_API).

You may want to record data using one of the
[JavaScript performance APIs](https://developer.mozilla.org/docs/Web/API/PerformanceObserver)
or your own metrics, for example:

```javascript
    const subscribeBtn = document.querySelector('#subscribe');

    subscribeBtn.addEventListener('click', (event) => {
     // Event listener logic goes here...

     const lag = performance.now() - event.timeStamp;
     if (lag > 100) {
      ga('send', 'event', {
       eventCategory: 'Performance Metric'
       eventAction: 'input-latency',
       eventLabel: '#subscribe:click',
       eventValue: Math.round(lag),
       nonInteraction: true,
      });
     }
    });
```

You can also use ReportingObserver to check for browser deprecation and intervention warnings.
This is one of [many APIs for getting real-world, live measurements from actual users](https://web.dev/web/updates/2018/07/reportingobserver).

## Real-world experience: Screen and video recording

Make a video recording of page load on mobile and desktop. This works even better at high frame
rates and if you add a timer display.

You may also want to save screencasts. There are many screencast recording apps for Android, iOS,
and desktop platforms (and
[scripts to do the same](https://paul.kinlan.me/android-screen-recording/)).

Video-recording page load works much like the
[filmstrip view](http://www.webpagetest.org/video/compare.php?tests=170427_61_14ZR-r:1-c:0) in
WebPagetest or
[Capture Screenshots](https://web.dev/web/updates/2015/07/devtools-digest-film-strip-and-a-new-home-for-throttling)
in Chrome DevTools. You get a real-world record of page component load speed: what's fast and what's
slow. Save video recordings and screencasts to compare against later improvements.

A side-by-side before-and-after comparison can be a great way to demonstrate improvements!

## What else?

If relevant, get a [Web Bloat Score](http://www.webbloatscore.com/). This is a fun
test, but it can also be a compelling way to demonstrate code bloat --- or to show you've
made improvements.

[What Does My Site Cost?](https://whatdoesmysitecost.com/test/170427_KK_6aecf8c8a21c22e9f59b2b65e8371569#gniCost),
shown below, gives a rough guide to the financial cost of loading your site in different regions.

Many other standalone and online tools are available: take a look at
[perf.rocks/tools](http://perf.rocks/tools).
