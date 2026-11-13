---
source_url: https://developer.chrome.com/docs/performance/insights/document-latency
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: ed420ffbeb05bea9dc504634329224f66268575d8ea893c7650ca662de3422b0
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Adam Raine [GitHub](https://github.com/adamraine)

Published: Mar 27, 2025

The initial document request for the page is the most important because all network requests and page content depend on it. Optimizing the initial document request improves performance.

## What the insight checks

The insight checks if any of the following conditions affected the initial document request:

- The navigation request was redirected one or more times.
- It took more than 600ms for the server to respond to the request.
- The response was uncompressed.

DevTools reports that the document latency can be reduced by eliminating redirects

> [!IMPORTANT]
> **Key point:** The [Core Web Vitals recommended Time to First Byte (TTFB) time](https://web.dev/articles/ttfb#what_is_a_good_ttfb_score) (800 ms) is longer than the server response time recommended by this insight (600ms). This is because TTFB includes the time to do DNS lookup and handle redirects as well as the server response time.

## Avoid redirects

Redirects slow down your page load speed. When a browser requests a resource that has been redirected, the server usually returns an HTTP response like this:

    HTTP/1.1 301 Moved Permanently
    Location: /path/to/new/location

The browser must then make another HTTP request at the new location to retrieve the resource. This additional trip across the network can delay the loading of the resource.

Make sure links point to the current location of a resource. If you're using redirects to divert mobile users to the mobile version of your page, consider redesigning your site to use [responsive design](https://web.dev/articles/responsive-web-design-basics).

## Reduce server response times

The first step to improve server response times is to identify the core conceptual tasks that your server must complete in order to return page content, and then measure how long each of these tasks takes. Once you've identified the longest tasks, find ways to speed them up.

There are many possible causes of slow server responses and many possible ways to improve:

- Optimize the server's application logic to prepare pages faster. If you use a server framework, the framework may have recommendations on how to do this.
- Optimize how your server queries databases or migrate to faster database systems.
- Upgrade your server hardware to have more memory or CPU.
- Use a CDN to reduce network latency. This is particularly effective if the document can be cached at the CDN edge node.

See the [Optimize TTFB](https://web.dev/articles/optimize-ttfb) guide for more details.

## Enable compression

Text compression can reduce the overall size of the initial HTML document. When a browser requests a resource, it will use the [`Accept-Encoding`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Accept-Encoding) HTTP request header to indicate what compression algorithms it supports.

```console
Accept-Encoding: gzip, compress, br, zstd
```

See also [Optimize the encoding and transfer size of text-based assets](https://web.dev/articles/reduce-network-payloads-using-text-compression).

Your server should return the [`Content-Encoding`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Encoding) HTTP response header to indicate what compression algorithm it used.
DevTools reports that the document request is using gzip compression

## Stack-specific guidance

This insight also offers stack-specific guidance for pages using the following technologies:

### WordPress

- Enable text compression in your web server configuration.
- Choose a lightweight theme (ideally a block theme) and implement full-page caching or a static site solution. Disable unnecessary plugins to minimize server overhead.
- Consider upgrading your hosting to managed or dedicated service.

### Drupal

- If the [Redirect](https://www.drupal.org/project/redirect) module is installed, review and remove unnecessary redirects.
- Offload traffic with one or more `Drupal` caching modules such as `Internal Page Cache`, `Internal Dynamic Page Cache`, and `BigPipe`. Couple these with a CDN to further improve response time. Your hosting servers should make use of PHP OPcache.
- Consider using memory-caching such as Redis or Memcached to reduce database query times.
- Use performant themes, modules, and faster servers to lower server response time.

### React

- If you are using React Router, minimize usage of the `<Redirect>` component for [route navigations](https://v5.reactrouter.com/web/api/Redirect).
- If you are server-side rendering any React components, consider using [`renderToNodeStream()`](https://reactjs.org/docs/react-dom-server.html#rendertonodestream) or `renderToStaticNodeStream()` to allow the client to receive and hydrate different parts of the markup instead of all at once.

### Joomla

- Enable the Gzip Page Compression setting (System \> Global configuration \> Server).
- Templates, extensions, and server specifications all contribute to server response time. Consider finding a more optimized template, carefully selecting an optimization extension, or upgrading your server.

### Magento

- Use Magento's [Varnish integration](https://experienceleague.adobe.com/en/docs/commerce-operations/configuration-guide/cache/varnish/config-varnish).

## Resources

- [Time to First Byte documentation](https://web.dev/articles/ttfb)
- [Optimizing TTFB guide](https://web.dev/articles/optimize-ttfb)
- [Redirections in HTTP](https://developer.mozilla.org/docs/Web/HTTP/Redirections)
- [Optimize the encoding and transfer size of text-based assets](https://web.dev/articles/reduce-network-payloads-using-text-compression)
