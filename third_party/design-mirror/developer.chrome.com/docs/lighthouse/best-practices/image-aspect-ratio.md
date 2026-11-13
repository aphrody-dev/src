---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/image-aspect-ratio
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:25+00:00
sha256: 773ae399fef1ad884b37a5ff578654e1ec38164ed8158c6f96f66e9690e2b445
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

If a rendered image has an [aspect ratio](<https://en.wikipedia.org/wiki/Aspect_ratio_(image)>) that's significantly different
to the aspect ratio in its source file (the _natural_ aspect ratio),
the rendered image may look distorted,
possibly creating an unpleasant user experience.

## How the Lighthouse image aspect ratio audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags any
image with a rendered dimension of more than a few pixels difference to the expected dimension
when rendered at its natural ratio:

There are two common causes for an incorrect image aspect ratio:

- An image is set with explicit width and height values that differ from the source image's dimensions.
- An image is set to a width and height as a percentage of a variably-sized container.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## Ensure images display with the correct aspect ratio

### Use an image CDN

An image CDN can make it easier to automate the process of creating different sized
versions of your images. Check out [Use image CDNs to optimize images](https://web.dev/articles/image-cdns)
for an overview and [How to install the Thumbor image CDN](https://web.dev/articles/install-thumbor) for a
hands-on codelab.

### Check the CSS that affects the image's aspect ratio

If you're having trouble finding the CSS that's causing the incorrect aspect ratio,
Chrome DevTools can show you the CSS declarations that affect a given image.
See Google's [View only the CSS that's actually applied to an element](https://developer.chrome.com/docs/devtools/css/reference.md.txt#computed)
page for more information.

### Check the image's `width` and `height` attributes in the HTML

When possible, it's good practice to specify each image's `width` and `height`
attributes in your HTML so that the browser can allocate space for the image.
This approach helps to ensure that content below the image doesn't shift once
the image is loaded.

However, specifying image dimensions in HTML can be difficult
if you're working with responsive images
because there's no way to know the width and height
until you know the viewport dimensions. Consider using the
[CSS Aspect Ratio](https://www.npmjs.com/package/css-aspect-ratio) library or
[aspect ratio boxes](https://css-tricks.com/aspect-ratio-boxes/)
to help preserve aspect ratios for responsive images.

Finally, check out the [Serve images with correct dimensions](https://web.dev/articles/serve-images-with-correct-dimensions)
post to learn how to serve images that are the right size for each user's device.

## Resources

- [Source code for **Displays images with incorrect aspect ratio** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/image-aspect-ratio.js)
- [CSS Aspect Ratio](https://www.npmjs.com/package/css-aspect-ratio)
- [Aspect Ratio Boxes](https://css-tricks.com/aspect-ratio-boxes/)
- [Serve images with correct dimensions](https://web.dev/articles/serve-images-with-correct-dimensions)
