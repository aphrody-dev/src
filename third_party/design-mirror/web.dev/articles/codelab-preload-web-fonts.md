---
source_url: https://web.dev/articles/codelab-preload-web-fonts
fetched: 2026-11-13
lastmod: 2026-11-12T20:26:33+00:00
sha256: ca5849ba4d094b50410e1c32f5afeeb26a21f7f572faa73b18ca461f58b5a7a6
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Garima Mimani [GitHub](https://github.com/garimamimani)

> [!IMPORTANT]
> To follow this codelab, open [this Glitch](https://glitch.com/edit/#!/web-dev-preload-webfont?path=index.html) in a second tab.

> [!NOTE]
> **Note:** This codelab uses Chrome DevTools. [Download Chrome](https://www.google.com/chrome) if you don't already have it.

This codelab shows you how to preload web fonts using `rel="preload"` to remove
any flash of unstyled text (FOUT).

## Measure

First measure how the website performs before adding any optimizations.

1. To preview the site, press **View App** . Then press **Fullscreen** .
2. Press \`Control+Shift+J\` (or \`Command+Option+J\` on Mac) to open DevTools.
3. Click the **Lighthouse** tab.
4. Make sure the **Performance** checkbox is selected in the *Categories* list.
5. Click the **Generate report** button.

The Lighthouse report that is generated will show you the fetching sequence of resources under **Maximum critical path latency**.

In the above audit the web fonts are part of the critical request chain and fetched last. The [**critical request chain**](https://developer.chrome.com/docs/lighthouse/performance/critical-request-chains) represents the order of resources that are prioritized and fetched by the browser. In this application, the web fonts (Pacfico and Pacifico-Bold) are defined using the [@font-face](https://web.dev/articles/font-best-practices.md.txt#understanding_font-face) rule and are the last resource fetched by the browser in the critical request chain. Typically, webfonts are lazy loaded which means that they are not loaded until the critical resources are downloaded (CSS, JS).

Here is the sequence of the resources fetched in the application:

## Preloading web fonts

To avoid FOUT, you can preload web fonts that are required immediately. Add the `Link` element for this application at the head of the document:

```html
<head>
 <!-- ... -->
 <link rel="preload" href="/assets/Pacifico-Bold.woff2" as="font" type="font/woff2" crossorigin>
</head>
```

The `as="font" type="font/woff2"` attributes tell the browser to download this resource as a font and helps in prioritization of the re­source queue.

The `crossorigin` attribute indicates whether the resource should be fetched with a CORS request as the font may come from a different domain. Without this attribute, the preloaded font is ignored by the browser.

Since Pacifico-Bold is used in the page header, we added a preload tag to fetch it even sooner. It isn't important to preload the Pacifico.woff2 font because it styles the text that is below the fold.

Reload the application and run lighthouse again. Check the **Maximum critical path latency** section.

Notice how the `Pacifico-Bold.woff2` is removed from the critical request chain. It is fetched earlier in the application.

With preload, the browser knows that it needs to download this file earlier. It is important to note that if not used correctly, preload can harm performance by making unnecessary requests for resources that are not used.
