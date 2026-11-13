---
source_url: https://developer.chrome.com/docs/lighthouse/performance/offscreen-images
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: 2236441b338c8ac34a51c7f9b2f33afa330110f14475d7b1aea8c8de58781b49
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has been removed as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

The Opportunities section of your Lighthouse report lists
all offscreen or hidden images in your page
along with the potential savings in [kibibytes (KiB)](https://en.wikipedia.org/wiki/Kibibyte).
Consider lazy-loading these images
after all critical resources have finished loading
to lower [Time to Interactive](http://web.dev/articles/tti):

See also [Lazy load offscreen images with lazysizes codelab](https://web.dev/codelab-use-lazysizes-to-lazyload-images).

## Stack-specific guidance

### AMP

Automatically lazy-load images with [`amp-img`](https://amp.dev/documentation/components/amp-img/).
See the [Images](https://amp.dev/documentation/guides-and-tutorials/develop/media_iframes_3p/#images)
guide.

### Drupal

Consider configuring lazy load images in `Drupal`. The field formatters for images support `lazy` or `eager`.

### Joomla

Install a [lazy-load Joomla plugin](https://extensions.joomla.org/instant-search/?jed_live%5Bquery%5D=lazy+loading)
that provides the ability to defer any offscreen images, or switch to a template
that provides that functionality. Starting with Joomla 4.0, a dedicated
lazy-loading plugin can be enabled by using the "Content - Lazy Loading Images"
plugin. Also consider using [an AMP plugin](https://extensions.joomla.org/instant-search/?jed_live%5Bquery%5D=amp).

### Magento

Consider modifying your product and catalog templates to make use of the web
platform's [lazy loading](https://web.dev/articles/browser-level-image-lazy-loading) feature.

### WordPress

Install a [lazy-load WordPress plugin](https://wordpress.org/plugins/search/lazy+load/) that provides the
ability to defer any offscreen images, or switch to a theme that provides that
functionality. Also consider using [the AMP plugin](https://wordpress.org/plugins/amp/).

## Resources

- [Source code for **Defer offscreen images** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/offscreen-images.js)
