---
source_url: https://developer.chrome.com/docs/lighthouse/performance/uses-responsive-images
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: 2667fcf9f6b8182dd9d4fb6d4f8f6ab0b1dd4a7bfca3aba94d5f150b8b5c3239
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

> [!WARNING]
> **Warning:** This audit has moved into the [Improve image delivery](https://developer.chrome.com/docs/performance/insights/image-delivery.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

The Opportunities section of your Lighthouse report lists all images in your page
that aren't appropriately sized,
along with the potential savings in [kibibytes (KiB)](https://en.wikipedia.org/wiki/Kibibyte).
Resize these images to save data and improve page load time:

## How Lighthouse calculates oversized images

For each image on the page,
Lighthouse compares the size of the rendered image against the size of the actual image.
The rendered size also accounts for device pixel ratio.
If the rendered size is at least 4KiB smaller than the actual size,
then the image fails the audit.

## Strategies for properly sizing images

Ideally, your page should never serve images that are larger than the version
that's rendered on the user's screen.
Anything larger than that just results in wasted bytes and slows down page load time.

The main strategy for serving appropriately sized images is called "responsive images". With responsive images, you generate multiple versions of each image,
and then specify which version to use in your HTML or CSS using media queries, viewport dimensions, and so on. Additionally, [RespImageLint](https://ausi.github.io/respimagelint/) is a helpful bookmarklet for identifying the optimal `srcset` and `sizes` values for your images. See [Serve responsive images](https://web.dev/serve-responsive-images) to learn more about these attributes.

[Image CDNs](https://web.dev/articles/image-cdns) are another main strategy for serving appropriately sized images.
You can think of image CDNs like web service APIs for transforming images.

Another strategy is to use vector-based image formats, like SVG.
With a finite amount of code, an SVG image can scale to any size.
See [Replace complex icons with SVG](https://web.dev/articles/responsive-images#replace_complex_icons_with_svg) to learn more.

Tools like
[gulp-responsive](https://www.npmjs.com/package/gulp-responsive) or
[responsive-images-generator](https://www.npmjs.com/package/responsive-images-generator)
can help automate the process of converting an image into multiple formats.
There are also image CDNs which let you generate multiple versions,
either when you upload an image, or request it from your page.

## Stack-specific guidance

### AMP

Use the
[`amp-img`](https://amp.dev/documentation/components/amp-img/?format=websites)
component's support for
[`srcset`](https://web.dev/articles/use-srcset-to-automatically-choose-the-right-image)
to specify which image assets to use based on the screen size. See
also [Responsive images with srcset, sizes \& heights](https://amp.dev/documentation/guides-and-tutorials/develop/style_and_layout/art_direction/).

### Angular

Consider using the [`BreakpointObserver` utility](https://material.angular.io/cdk/layout/overview) in the Component Dev
Kit (CDK) to manage image breakpoints.

### Drupal

Ensure that you are using the native [Responsive Image Styles](https://www.drupal.org/documentation/modules/responsive_image) provided from `Drupal`. Use the Responsive Image Styles when rendering image fields through view modes, views, or images uploaded through the WYSIWYG editor.

### Gatsby

Use the [gatsby-image](https://www.gatsbyjs.com/plugins/gatsby-image/) plugin to
generate multiple smaller images for smartphones and tablets. It can also create
SVG image placeholders for efficient lazy loading.

### Joomla

Consider using a [responsive images plugin](https://extensions.joomla.org/instant-search/?jed_live%5Bquery%5D=responsive+images).

### WordPress

Upload images directly through the [media library](https://wordpress.org/support/article/media-library-screen/) to ensure
that the required image sizes are available, and then insert them from the media
library or use the image widget to ensure the optimal image sizes are used
(including those for the responsive breakpoints). Avoid using `Full Size` images
unless the dimensions are adequate for their usage. See [Inserting images into posts and pages](https://wordpress.org/support/article/inserting-images-into-posts-and-pages/).

## Resources

- [Source code for **Properly size images** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/uses-responsive-images.js)
- [Serve images with correct dimensions](https://web.dev/articles/serve-images-with-correct-dimensions)
