---
source_url: https://developer.chrome.com/docs/lighthouse/seo/is-crawlable
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: 434385c55b621c5ba1f90304993185b96d9bc292d302d66c8197d5e458ee0c03
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Search engines can only show pages in their search results if those pages don't
explicitly block indexing by search engine crawlers. Some HTTP headers and meta
tags tell crawlers that a page shouldn't be indexed.

Only block indexing for content that you don't want to appear in search results.

## How the Lighthouse indexing audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages
that search engines can't index:

Lighthouse only checks for headers or elements that block _all_ search engine
crawlers. For example, the `<meta>` element below prevents all search engine
crawlers (also known as robots) from accessing your page:

```html
<meta name="robots" content="noindex" />
```

This HTTP response header also blocks all crawlers:

```html
X-Robots-Tag: noindex
```

You might also have `<meta>` elements that block specific crawlers, such as:

```html
<meta name="Googlebot" content="noindex" />
```

Lighthouse doesn't fail the audit for crawler-specific directives like this, but they can
still make your page harder to discover, so use them with caution. Lighthouse will emit a
warning if a crawler-specific directive is blocking a common indexing bot.

> [!NOTE]
> **Note:** Each SEO audit is weighted equally in the Lighthouse SEO Score, except for the manual **[Structured data is valid](https://developer.chrome.com/docs/lighthouse/seo/structured-data.md.txt)** audit. Learn more in the [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt).

## How to ensure search engines can crawl your page

First make sure you want search engines to index the page. Some pages, like
[sitemaps](https://support.google.com/webmasters/answer/156184?ref_topic=4581190)
or legal content, generally shouldn't be indexed. (Keep in mind that blocking
indexing doesn't prevent users from accessing a page if they know its URL.)

For pages that you want indexed, remove any HTTP headers or `<meta>` elements
that are blocking search engine crawlers. Depending on how you set up your site,
you might need to do some or all of the steps below:

- Remove the `X-Robots-Tag` HTTP response header if you set up a HTTP response header:

```text
X-Robots-Tag: noindex
```

- Remove the following meta tag if it's present in the head of the page:

```html
<meta name="robots" content="noindex" />
```

- Avoid meta tags that block specific crawlers if these tags are present in the head of the page. For example:

```html
<meta name="Googlebot" content="noindex" />
```

## Add additional control (optional)

You may want more control over how search engines index your page. For example,
maybe you don't want Google to index images, but you do want the rest of the page
indexed.

For information about how to configure your `<meta>` elements and HTTP
headers for specific search engines, see these guides:

- [Google Search](https://developers.google.com/search/reference/robots_meta_tag)
- [Bing](https://www.bing.com/webmaster/help/which-robots-metatags-does-bing-support-5198d240)
- [Yandex](https://yandex.com/support/webmaster/controlling-robot/html.html)

## Resources

- [Source code for **Page is blocked from indexing** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/is-crawlable.js)
- Google's [Robots meta tag and X-Robots-Tag HTTP header specifications](https://developers.google.com/search/reference/robots_meta_tag)
- Bing's [Robots Metatags](https://www.bing.com/webmaster/help/which-robots-metatags-does-bing-support-5198d240)
- Yandex's [Using HTML elements](https://yandex.com/support/webmaster/controlling-robot/html.html)
