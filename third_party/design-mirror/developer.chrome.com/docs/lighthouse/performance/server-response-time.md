---
source_url: https://developer.chrome.com/docs/lighthouse/performance/server-response-time
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: 0ad8b2b6c31f3b8b3e46e2df61dacaabb3c8676e9e6dc9c72596f1237d64e9bd
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has moved into the [Document request latency](https://developer.chrome.com/docs/performance/insights/document-latency.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

The Opportunities section of your Lighthouse report reports **server response time**---the time that it takes for a user's browser to receive the first byte of page content, after making the request:

## Slow server response times affect performance

This audit fails when the browser waits more than 600 ms for the server to respond to the main document request. Users dislike when pages take a long time to load. Slow server response times are one possible cause for long page loads.

When users navigate to a URL in their web browser, the browser makes a network request to fetch that content. Your server receives the request and returns the page content.

> [!IMPORTANT]
> **Key point:** Server response time is only part of the full [Time to First Byte (TTFB)](https://web.dev/articles/ttfb). As well as including the server response time, TTFB can often include DNS lookups and redirects (for example, if the final slash or the www subdomain or https protocol is omitted then the server might redirect to the correct URL, or for URL shorteners or Ads that redirect via several domains). Many Lighthouse tests will test the end URL, missing the redirect time, but even when this is not the case, the server response time will exclude these parts. For this reason, Lighthouse has a smaller limit (600 ms) to the [Core Web Vitals TTFB recommended time](https://web.dev/articles/ttfb#what_is_a_good_ttfb_score) (800 ms).

The server may need to do a lot of work in order to return a page with all of the content that users want. For example, if users are looking at their order history, the server needs to fetch each user's history from a database, and then insert that content into the page. Optimizing the server to do work like this as quickly as possible is one way to reduce the time that users spend waiting for pages to load.

Even when the server does not need to do a lot of work, the network latency between the client and the server can result in a slow server response times.

## How to improve server response times

The first step to improving server response times is to identify the core conceptual tasks that your server must complete in order to return page content, and then measure how long each of these tasks takes. Once you've identified the longest tasks, search for ways to speed them up.

There are many possible causes of slow server responses, and therefore many possible ways to improve:

- Optimize the server's application logic to prepare pages faster. If you use a server framework, the framework may have recommendations on how to do this.
- Optimize how your server queries databases, or migrate to faster database systems.
- Upgrade your server hardware to have more memory or CPU.

Use a CDN to reduce network latency. This is particularly effective if the document can be cached at the CDN edge node.

See the [Optimize TTFB](https://web.dev/articles/optimize-ttfb) guide for more details.

## Stack-specific guidance

### Drupal

Offload traffic with one or more `Drupal` caching modules such as `Internal Page Cache`, `Internal Dynamic Page Cache`, and `BigPipe`. Couple these with a CDN to further improve response time. Your hosting servers should make use of PHP OPcache. Consider using memory-caching such as Redis or Memcached to reduce database query times. Lastly use performant themes, modules, and faster servers to lower server response time.

### Magento

Use Magento's [Varnish integration](https://devdocs.magento.com/guides/v2.3/config-guide/varnish/config-varnish.html).

### React

If you are server-side rendering any React components, consider using [`renderToNodeStream()`](https://reactjs.org/docs/react-dom-server.html#rendertonodestream) or `renderToStaticNodeStream()` to allow the client to receive and hydrate different parts of the markup instead of all at once.

### WordPress

Choose a lightweight theme (ideally a block theme) and implement full-page
caching or a static site solution. Disable unnecessary plugins to minimize
server overhead.

Consider upgrading your hosting to managed or dedicated service.

## Resources

- [Source code for **Reduce server response times (TTFB)** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/server-response-time.js)
- [Time to First Byte documentation](https://web.dev/articles/ttfb)
- [Optimizing TTFB guide](https://web.dev/articles/optimize-ttfb)
