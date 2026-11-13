---
source_url: https://developer.chrome.com/blog/speculation-rules-improvements
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:57+00:00
sha256: 716fefb984dc61f8f7827f29735e94cc5226e21409c2dc1b0be19126919f1a21
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

The Chrome team has been working on some exciting updates to the [Speculation Rules API](https://developer.chrome.com/docs/web-platform/prerender-pages.md.txt) used to improve navigation performance by prefetching or even prerendering future navigations. These additional improvements are now all available from Chrome 122 (with some features available from earlier versions).

These changes make prefetching and prerendering pages considerably easier to deploy and less wasteful, which we hope will encourage further adoption.

## Additional features

First up is an explanation of the new additions we've added to the Speculation Rules API and how to use them. After this, we'll show you a [demo](https://developer.chrome.com/blog/speculation-rules-improvements.md.txt#demo) so you can see them in action.

### Document rules

Previously, the Speculation Rules API worked by specifying a list of URLs to prefetch or prerender:

```html
<script type="speculationrules">
  {
    "prerender": [
      {
        "source": "list",
        "urls": ["next.html", "next2.html"]
      }
    ]
  }
</script>
```

The speculation rules were semi-dynamic in that new speculation rule scripts could be added, and old scripts removed to discard those speculations (note that updating the `urls` list of an existing speculation rules script does not trigger a change in speculations). However, it still left the choice of URLs up to the site, either by sending them from the server at page request time, or by dynamically creating this list through client-side JavaScript.

_List rules_ remain as an option for simpler use cases (where the next navigation is from a small set of obvious ones), or more advanced use cases (where the list of URLs are dynamically calculated based on whatever heuristics the site owner wants to use, and then inserted into the page).

As an alternative, we're excited to offer a new option for automatic link finding using _document rules_ . This works by sourcing URLs from the document itself based on a `where` condition. This can be based on the links themselves:

```html
<script type="speculationrules">
  {
    "prerender": [
      {
        "source": "document",
        "where": {
          "and": [
            { "href_matches": "/*" },
            { "not": { "href_matches": "/logout/*" } }
          ]
        },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

> [!NOTE]
> **Note:** An earlier version of document rules---available during the origin trial---had more complex `href_matches` that required additional syntax to match URL parameters and fragments (`{"href_matches": "/*\\?*#*"}`). This has been simplified in the release version.

CSS selectors can also be used as an alternative, or in conjunction with, href matches to find links in the current page:

```html
<script type="speculationrules">
  {
    "prerender": [
      {
        "source": "document",
        "where": {
          "and": [
            { "selector_matches": ".prerender" },
            { "not": { "selector_matches": ".do-not-prerender" } }
          ]
        },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

This allows a single speculation ruleset to be used across the whole site, rather than having specific ones per page, making it much easier for sites to deploy speculation rules.

Of course, prerendering **all** links on a page would definitely be wasteful, so with this new ability, we've introduced an `eagerness` setting.

### Eagerness

With any kind of speculation, there is a trade off between [precision and recall](https://en.wikipedia.org/wiki/Precision_and_recall), and lead time. Prerendering all links on page load means you'll almost certainly prerender a link a user clicks on (assuming they click a same-site link on the page), and with as much lead time as possible, but with a potentially huge waste of bandwidth.

On the other hand, only prerendering once a user has clicked a link prevents waste, but at the cost of a much reduced lead time. This means its unlikely to have completed prerendering before the browser switches to that page.

The `eagerness` setting allows you to define when speculations should run, separating _when_ to speculate from which URLs to perform speculations on. The `eagerness` setting is available for both `list` and `document` source rules, and has four settings, for which Chrome has the following heuristics:

- **`immediate`:** This is used to speculate as soon as possible, that is, as soon as the speculation rules are observed.
- **`eager`:** This currently behaves identically to the `immediate` setting, but in future, we are looking to place this somewhere between `immediate` and `moderate`.
- **`moderate`:** This performs speculations if you hover over a link for 200 milliseconds (or on the [`pointerdown`](https://developer.mozilla.org/docs/Web/API/Element/pointerdown_event) event if that is sooner, and on mobile where there is no `hover` event).
- **`conservative`:** This speculates on pointer or touch down.

The default `eagerness` for `list` rules is `immediate`. The `moderate` and `conservative` options can be used to limit `list` rules to URLs that a user interacts with to a specific list. Though in many cases, `document` rules with an appropriate `where` condition may be more appropriate.

The default `eagerness` for `document` rules is `conservative`. Given a document can consist of many URLs, use of `immediate` or `eager` for `document` rules should be used with caution (see also the [Chrome limits](https://developer.chrome.com/blog/speculation-rules-improvements.md.txt#chrome-limits) section next).

Which `eagerness` setting to use depends on your site. For a very simple static site, speculating more eagerly may have little cost and be beneficial for users. Sites with more complex architectures and heavier page payloads may prefer to reduce waste by speculating less often until you get more positive signal of intent from users to limit waste.

> [!CAUTION]
> **Caution:** Over-speculation has a clear cost to users for bandwidth, memory, and CPU costs, but also for sites themselves. Be conscious of the impact you are putting on your users when implementing speculations. The `eagerness` settings allow you to reduce the likelihood of wasted speculations. Chrome also places [limits](https://developer.chrome.com/blog/speculation-rules-improvements.md.txt#chrome-limits) on speculations to reduce the impact of overuse.

The `moderate` option is a middle ground, and many sites could benefit from the following simple speculation rule that would prerender all links on hover or pointerdown as a basic---yet powerful---implementation of speculation rules:

```html
<script type="speculationrules">
  {
    "prerender": [
      {
        "source": "document",
        "where": {
          "href_matches": "/*"
        },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

### Chrome limits

Even with the choice of `eagerness`, Chrome has limits in place to prevent overuse of this API:

| `eagerness`                 | Prefetch | Prerender |
| --------------------------- | -------- | --------- |
| `immediate` / `eager`       | 50       | 10        |
| `moderate` / `conservative` | 2 (FIFO) | 2 (FIFO)  |

Speculation limits in Chrome

The `moderate` and `conservative` settings---which depend on user interaction---work in a [First In, First Out (FIFO) manner](<https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics)>). After reaching the limit, a new speculation will cause the oldest speculation to be canceled and replaced by the newer one to conserve memory.

The fact that `moderate` and `conservative` speculations are triggered by users allows us to use a more modest threshold of 2 to conserve memory. The `immediate` and `eager` settings are not triggered by a user action and so have a higher limit as it is not possible for the browser to know which are needed and when they are needed.

A speculation which is canceled by being pushed out of the FIFO queue can be triggered again---for example by hovering over that link again---which will result in that URL being re-speculated. In that case the previous speculation will likely have caused the browser to cache some resources in the HTTP Cache for that URL, so repeating the speculation should have a much reduced network and so time costs.

The `immediate` and `eager` limits are also dynamic. Removing a speculation rules script element using these eagerness levels will create capacity by canceling those removed speculations. These URLs can also be re-speculated if they are included in a new URL script and the limit has not been reached.

Chrome will also [prevent speculations being used in certain conditions](https://source.chromium.org/chromium/chromium/src/+/main:content/public/browser/preloading.h?q=PreloadingEligibility&ss=chromium) including:

- [Save-Data](https://web.dev/articles/optimizing-content-efficiency-save-data).
- [Energy saver](https://developer.chrome.com/blog/memory-and-energy-saver-mode.md.txt).
- Memory constraints.
- When the "Preload pages" setting is turned off (which is also explicitly turned off by Chrome extensions such as uBlock Origin).
- Pages opened in background tabs.

All of these conditions aim to reduce the impact of over-speculation when it would be detrimental to users.

### Optional `source`

Chrome 122 makes the `source` key optional since this can be inferred from the presence of the `url` or `where` keys. These two speculation rules are therefore identical:

```html
<script type="speculationrules">
  {
    "prerender": [
      {
        "source": "document",
        "where": { "href_matches": "/*" },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

```html
<script type="speculationrules">
  {
    "prerender": [
      {
        "where": { "href_matches": "/*" },
        "eagerness": "moderate"
      }
    ]
  }
</script>
```

### `Speculation-Rules` HTTP header

Speculation rules can also be delivered by using a `Speculation-Rules` HTTP header, rather than including them directly in the document's HTML. This allows easier deployment by CDNs without the need to alter document contents themselves.

The `Speculation-Rules` HTTP header is returned with the document, and points to a location of a JSON file containing the speculation rules:

```console
Speculation-Rules: "/speculationrules.json"
```

> [!WARNING]
> **Warning:** As this is a structured header, the quotes are important and **must** be included in the header value.

This resource must use the correct MIME type and, if it is a cross-origin resource, pass a CORS check.

```console
Content-Type: application/speculationrules+json
Access-Control-Allow-Origin: *
```

If you want to use relative URLs you may want to include the `"relative_to": "document"` key in your speculation rules. Otherwise, relative URLs will be relative the speculation rules JSON file's URL. This may be particularly useful if you need to select some---or all---same-origin links.

### Better cache reuse

We have made a number of improvements to caching in Chrome so that prefetching (or even prerendering) a document will store and reuse resources in the HTTP cache. This means speculating can still have future benefits, even if that speculation is not used.

This also makes re-speculating (for example, for document rules with a `moderate` eagerness setting) considerably cheaper, as Chrome will use the HTTP cache for cacheable resources.

We also support the new `No-Vary-Search` proposal to further improve cache reuse.

#### `No-Vary-Search` support

When prefetching or prerendering a page, certain URL parameters (technically known as _search parameters_) may be unimportant to the page actually delivered by the server, and only used by client side JavaScript.

For example, [UTM parameters](https://en.wikipedia.org/wiki/UTM_parameters) are used by Google Analytics for campaign measurement, but usually do not result in different pages being delivered from the server. This means that `page1.html?utm_content=123` and `page1.html?utm_content=456` will deliver the same page from the server, so the same page can be reused from the cache.

Similarly, applications may use other URL parameters that are only handled client side.

The [No-Vary-Search](https://wicg.github.io/nav-speculation/no-vary-search.html) proposal allows a server to specify parameters that do not result in a difference to the resource delivered, and therefore allow a browser to reuse previously cached versions of a document which only differ by these parameters. Note: currently this is only supported in Chrome (and Chromium-based browsers) for prefetch navigation speculations.

Speculation rules support using `expects_no_vary_search` to indicate where a `No-Vary-Search` HTTP header is expected to be returned. Doing so can help further avoid unnecessary downloads.

```html
<script type="speculationrules">
  {
    "prefetch": [
      {
        "urls": ["/products"],
        "expects_no_vary_search": "params=(\"id\")"
      }
    ]
  }
</script>

<a href="/products?id=123">Product 123</a>
<a href="/products?id=124">Product 124</a>
```

In this example, the `/products` initial page HTML is the same for both product IDs `123` and `124`. However, the page contents eventually differ based on client-side rendering using JavaScript to fetch product data using the `id` search parameter. So we prefetch that URL eagerly and it should return a `No-Vary-Search` HTTP header showing the page can be used for any `id` search param.

However, if the user clicks on any of the links before the prefetch has completed, the browser may not have received the `/products` page. In this case, the browser does not know if it will contain the `No-Vary-Search` HTTP header. The browser is then left with a choice of whether to fetch the link again, or wait for the prefetch to complete to see if it contains a `No-Vary-Search` HTTP header. The `expects_no_vary_search` setting allows the browser to know the page response is expected to contain a `No-Vary-Search` HTTP header, and to wait for that prefetch to complete.

## Demo

We have created a demo at <https://chrome.dev/speculative-loading/common-fruits.html> which can be used to see document rules with a `moderate` eagerness setting in action:
Speculation rules demo

Open DevTools, click the **Application** panel. Then, in the **Background services** section, click **Speculative loads** , then the **Speculations** pane, and sort by the **Status** column.

As you hover over the fruits, you will see the pages prerendering. Clicking on them will show a much quicker LCP time than one of the recipes, which are not prerendered. This demo is also explained in [the following video](https://www.youtube.com/watch?v=BIpz9Hdjm_A&t=216s):

[Video](https://www.youtube.com/watch?v=BIpz9Hdjm_A)

You can also check out the previous [debugging speculation rules blog post](https://developer.chrome.com/docs/devtools/application/debugging-speculation-rules.md.txt) for more information on how to use DevTools to debug speculation rules.

## Platform support for speculation rules

While speculation rules are relatively simple to implement by injecting the rules into a `<script type="speculationrules">` element, platform support can make this a one-click affair. We've been working with various platforms and partners to make it easier to roll out speculation rules.

We're also working hard [to standardize the API](https://github.com/WICG/nav-speculation) through the [Web Incubator Community Group (WICG)](https://wicg.io/) to allow other browsers to also implement this exciting API if they choose to.

### WordPress

The [WordPress Core Performance team](https://make.wordpress.org/performance/) (including developers from Google), created a [Speculation Rules plugin](https://wordpress.org/plugins/speculation-rules/). This plugin allows a simple one-click addition of document rules support to any WordPress site. This plugin is also available to install through the [WordPress Performance Lab](https://wordpress.org/plugins/performance-lab/) plugin, which you should also consider installing as it will keep you up to date on related performance plugins from the team.

Two groups of settings are available: the **Speculation mode** and the **Eagerness** setting:
WordPress Speculation Rules plugin

For more complicated setups---for example, to exclude certain URLs from being prefetched or prerendered---read [the documentation](https://wordpress.org/plugins/speculation-rules/#how%20can%20i%20prevent%20certain%20urls%20from%20being%20prefetched%20and%20prerendered%3F).

### Akamai

Akamai is one of the world's leading CDN providers, and they have been actively experimenting with the Speculation Rules API for some time now. Akamai has released [documentation](https://techdocs.akamai.com/ion/docs/prerender-pages-with-speculation-rules) on how customers can enable this API in their CDN settings. They have also previously shared [the impressive results possible with this new API](https://discuss.akamai.com/t/speculation-rules-api-on-akamai/1242).

### Uxify

Uxify (previously part of Nitropack) is a performance optimization solution which uses their custom Navigation AI to predict which pages to add to speculation rules, which aims to provide a longer lead time than hovering over a link, but without the waste of needlessly speculating on all the links observed. See the [Uxify Speculation Rules API documentation](https://uxify.com/blog/post/speculation-rules-api) for more information. This innovative solution shows there is still plenty for the older list rules to offer when paired with site-specific insights.

The Chrome team also worked with the team on [a webinar for the Speculation Rules API](https://www.youtube.com/watch?v=4d4ySzzMM_w) for those looking for more information, including a good discussion on the considerations needed between speculating early and often, as well as late and less frequently.

### Astro

Astro added [prerendering pages using the Speculation Rules API in 4.2](https://astro.build/blog/astro-420/#experimental-prerendering-pages-using-the-speculation-rules-api) on an experimental basis, allowing developers using Astro to enable this feature with ease, while falling back to a standard prefetch for browsers that do not support the Speculation Rules API. Read their [client prerender documentation](https://docs.astro.build/en/reference/configuration-reference/#experimentalclientprerender) for more information.

## Conclusion

These additions to the Speculation Rules API allow for a much simpler use of this exciting new performance feature for sites, with less risk of wasting resources with unused speculations. It is exciting to see platforms already lean into this API. We hope to see wider adoption of this API in 2024, and ultimately better performance to end users as a result.

In addition to the performance gains the Speculation Rules API provides, we're also excited to see what new opportunities this opens up. [View Transitions](https://developer.chrome.com/blog/spa-view-transitions-land.md.txt) is a new API that allows developers to specify transitions between navigations more easily. This is currently available for Single Page Applications (SPAs), but the [multi-page version is in progress](https://github.com/WICG/view-transitions/blob/main/cross-doc-explainer.md) (and available behind a flag in Chrome). Prerender is a natural add-on to that feature to ensure there is no delay, which would otherwise prevent the user experience improvement the transition is intended to provide. We have already [seen sites experimenting with this combination](https://developer.chrome.com/blog/view-transitions-case-studies.md.txt#view_transitions_for_mpa_with_prerendering_technology).

We look forward to further adoption of the Speculation Rules API throughout 2024, and will keep you updated on any further improvements we make to the API.

## Acknowledgements

_Thumbnail by [Robbie Down](https://unsplash.com/@robbiedown) on [Unsplash](https://unsplash.com/photos/person-holding-clear-glass-ball-ssuwtAadz2E)_
