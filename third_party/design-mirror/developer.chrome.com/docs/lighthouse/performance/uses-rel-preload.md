---
source_url: https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preload
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: 5c36855ae2f4e0b9edf05037ce4afd0165276d8c3196b6255efd707ec90fb4d6
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

> [!WARNING]
> **Warning:** This audit has been removed as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

The Opportunities section of your Lighthouse report
flags the third level of requests in your critical request chain as preload candidates:

## How Lighthouse flags determines preload candidates

Suppose your page's
[critical request chain](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains.md.txt) looks like this:

```html
index.html |--app.js |--styles.css |--ui.js
```

Your `index.html` file declares `<script src="app.js">`. When `app.js` runs , it calls
`fetch()` in order to download `styles.css` and `ui.js`. The page doesn't appear complete
until those last 2 resources are downloaded, parsed, and executed.
Using the example above, Lighthouse would flag `styles.css` and `ui.js` as candidates.

The potential savings are based on how much earlier the browser would be able
to start the requests if you declared preload links.
For example, if `app.js` takes 200ms to download, parse, and execute,
the potential savings for each resource is 200ms since `app.js` is no longer a bottleneck for each of the requests.

Preloading requests can make your pages load faster.
Without preload links, `styles.css` and `ui.js` are requested only after `app.js` has been downloaded, parsed, and executed.

The problem here is that the browser only becomes aware
of those last 2 resources after it downloads, parses, and executes `app.js`.
But you know that those resources are important and
should be downloaded as soon as possible.

## Declare your preload links

Declare preload links in your HTML to instruct the browser to download key resources
as soon as possible.

```html
<head>
  ...
  <link rel="preload" href="styles.css" as="style" />
  <link rel="preload" href="ui.js" as="script" />
  ...
</head>
```

With preload links, `styles.css` and `ui.js` are requested at the same time as `app.js`.

See also [Preload critical assets to improve loading speed](https://web.dev/articles/preload-critical-assets)
for more guidance.

### Browser compatibility

As of June 2020 preloading is supported in Chromium-based browsers. See
[Browser compatibility](https://developer.mozilla.org/docs/Web/HTML/Preloading_content#Browser_compatibility)
for updates.

### Build tool support for preloading

See [Tooling.Report's Preloading Assets](https://bundlers.tooling.report/non-js-resources/html/preload-assets/?utm_source=web.dev&utm_campaign=lighthouse&utm_medium=uses-rel-preload)
page.

## Stack-specific guidance

### Angular

[Preload routes](https://web.dev/articles/route-preloading-in-angular) ahead of time to speed up navigation.

### Magento

[Modify your themes's layout](https://devdocs.magento.com/guides/v2.3/frontend-dev-guide/layouts/xml-manage.html)
and add `<link rel=preload>` tags.

## Resources

- [Source code for **Preload key requests** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/uses-rel-preload.js)
