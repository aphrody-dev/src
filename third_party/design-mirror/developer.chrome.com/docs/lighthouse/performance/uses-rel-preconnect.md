---
source_url: https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preconnect
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: 37abda1bb00415b53075b19049ad9e289aa52ff064d7a48138de7f785b17318f
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

> [!WARNING]
> **Warning:** This audit has moved into the [Network dependency tree](https://developer.chrome.com/docs/performance/insights/network-dependency-tree.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

The Opportunities section of your Lighthouse report lists all key requests
that aren't yet prioritizing fetch requests with `<link rel=preconnect>`:

## Browser compatibility

`<link rel=preconnect>` is supported on most browsers. See
[Browser compatibility](https://developer.mozilla.org/docs/Web/HTML/Link_types/preconnect#Browser_compatibility).

## Improve page load speed with preconnect

Consider adding `preconnect` or `dns-prefetch` resource hints
to establish early connections to important third-party origins.

`<link rel="preconnect">` informs the browser that your page intends
to establish a connection to another origin,
and that you'd like the process to start as soon as possible.

Establishing connections often involves significant time in slow networks,
particularly when it comes to secure connections, as it may involve DNS lookups,
redirects, and several round trips to the final server that handles the user's request.

Taking care of all this ahead of time can make your application feel much snappier
to the user without negatively affecting the use of bandwidth.
Most of the time in establishing a connection is spent waiting, rather than exchanging data.

Informing the browser of your intention is as simple as adding a link tag to your page:

`<link rel="preconnect" href="https://example.com">`

This lets the browser know that the page intends
to connect to `example.com` and retrieve content from there.

Bear in mind that while `<link rel="preconnect">` is pretty cheap,
it can still take up valuable CPU time, particularly on secure connections.
This is especially bad if the connection isn't used within 10 seconds,
as the browser closes it, wasting all of that early connection work.

In general,
try to use `<link rel="preload">`,
as it's a more comprehensive performance tweak,
but do keep `<link rel="preconnect">` in your tool belt for the edge cases like:

- [Use-case: Knowing Where From, but not What You're Fetching](https://web.dev/articles/preconnect-and-dns-prefetch#knowing_where_from_but_not_what_youre_fetching)
- [Use-case: Streaming Media](https://web.dev/articles/preconnect-and-dns-prefetch#streaming_media)

`<link rel="dns-prefetch">` is another `<link>` type related to connections.
This handles the DNS lookup only,
but it's got wider browser support, so it may serve as a nice fallback.
You use it the exact same way:

```html
<link rel="dns-prefetch" href="https://example.com" />.
```

## Stack-specific guidance

### Drupal

`Preconnect` or `dns-prefetch` resource hints can be added by installing and configuring [a module](https://www.drupal.org/project/project_module?f%5B0%5D&f%5B1%5D&f%5B2%5D&f%5B3%5D&f%5B4%5D=sm_field_project_type:full&f%5B5%5D&f%5B6%5D&text=Preconnect&solrsort=score+desc&op=Search) that provides facilities for user agent resource hints.

### Magento

[Modify your themes's layout](https://devdocs.magento.com/guides/v2.3/frontend-dev-guide/layouts/xml-manage.html)
and add preconnect or DNS prefetch resource hints.

## Resources

- [Source code for **Preconnect to required origins** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/uses-rel-preconnect.js)
- [Resource Prioritization--Getting the Browser to Help You](https://developers.google.com/web/fundamentals/performance/resource-prioritization#preconnect)
- [Establish network connections early to improve perceived page speed](https://web.dev/articles/preconnect-and-dns-prefetch)
- [Link types: preconnect](https://developer.mozilla.org/docs/Web/HTML/Link_types/preconnect#Browser_compatibility)
