---
source_url: https://web.dev/articles/serve-responsive-images
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:36+00:00
sha256: a6842e6a3449a1cf44a8889e30598b4e9c5a583cde92b87198b1bc96e3047846
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Katie Hempenius [X](https://twitter.com/katiehempenius)

Serving desktop-sized images to mobile devices can use 2--4x more data than
needed. Follow the guidelines on this page to improve the user experience by
serving different image sizes to different devices.

## Responsive images and Core Web Vitals

When you serve responsive images, your page evaluates the display capabilities
of the user's device and choosing one of a set of image candidates that are
optimal for display based on those criteria. This saves data for your users,
mainly by serving smaller images to devices with smaller screens.

The effects of faster image loading can also extend to your page's
[Largest Contentful Paint (LCP)](https://web.dev/articles/lcp.md.txt). For example, if your page's
[LCP element](https://web.dev/articles/lcp.md.txt#what-elements-are-considered) is an image, serving
it responsively can reduce its [resource load duration](https://web.dev/articles/optimize-lcp.md.txt#reduce-resource-load-duration).

Lower resource load durations lower the load time for an LCP image, improving your
page's LCP score. A lower LCP means users will see your site as loading faster,
and especially as loading its most important content (the LCP element) faster.
Serving responsive images can also reduce bandwidth contention for other
resources on the page, which can improve how fast your page loads in general.

## Resize images

Two of the most popular image resizing tools are the [sharp npm package](https://www.npmjs.com/package/sharp)
and the [ImageMagick CLI tool](https://www.imagemagick.org/script/index.php).

The sharp package is a good choice for automating image resizing (for example,
generating multiple sizes of thumbnails for all the videos on your website). It
is fast and integrates well with build scripts and tools. ImageMagick is more
convenient for one-time image resizing because it runs entirely from the command
line.

### sharp

To use sharp as a Node script, save this code as a separate script in your
project, then run it to convert your images:

```javascript
const sharp = require('sharp');
const fs = require('fs');
const directory = './images';

fs.readdirSync(directory).forEach(file => {
  sharp(`${directory}/${file}`)
    .resize(200, 100) // width, height
    .toFile(`${directory}/${file}-small.jpg`);
  });
```

### ImageMagick

To resize an image to 33% of its original size, run the following command in
your terminal:

```bash
convert -resize 33% flower.jpg flower-small.jpg
```

To resize an image to fit within a 300px wide by 200px high space, run the
following command:

```bash
# macOS/Linux
convert flower.jpg -resize 300x200 flower-small.jpg

# Windows
magick convert flower.jpg -resize 300x200 flower-small.jpg
```

### How many image versions should you create?

There is no single "correct" answer to this question. However, it's common to
serve 3-5 different sizes of an image. Serving more image sizes is better for
performance, but takes up more space on your servers and requires you to write
slightly more HTML.

### Other options

Image services like [Thumbor](https://github.com/thumbor/thumbor) (open-source)
and [Cloudinary](https://cloudinary.com/) are also worth checking out. Both are
straightforward ways to create responsive images that also provide image
manipulation on demand. To set up Thumbor, install it on your server. Cloudinary
takes care of the details for you and requires no server setup.

## Serve multiple image versions

When you specify multiple image versions, the browser chooses the best one to
use:

| **Before** | **After** |
|---|---|
| \ | \ |

The `` tag's
[`src`](https://developer.mozilla.org/docs/Web/HTML/Element/img#attr-src),
[`srcset`](https://developer.mozilla.org/docs/Web/HTML/Element/img#attr-srcset),
and [`sizes`](https://developer.mozilla.org/docs/Web/HTML/Element/img#attr-sizes)
attributes all interact to achieve this end result.

### The "src" attribute

The src attribute makes this code work for browsers that don't
[support](https://caniuse.com/#search=srcset) the `srcset` and `sizes`
attributes. Those browsers fall back to loading the resource specified in the
`src` attribute.

> [!TIP]
> **Tip:** Make the resource you specify in `src` large enough to work well on all device sizes.

### The "srcset" attribute

The `srcset` attribute is a comma-separated list of image filenames and their
width or density descriptors.

This example uses
[width descriptors](https://www.w3.org/TR/html5/semantics-embedded-content.html#width-descriptor),
which tell the browser how wide an image is so it doesn't have to download the
image to find out. `480w` is a width descriptor tells the browser that
`flower-small.jpg` is 480px wide. `1080w` is a width descriptor tells the
browser that `flower-large.jpg` is 1080px wide.

**Extra Credit** :
You don't need to know about density descriptors to serve different image sizes.
However, if you're curious about how density descriptors work, check out the
[Resolution Switching code lab](https://web.dev/articles/codelab-density-descriptors.md.txt).
Density descriptors are used to serve different images based on the device's
[pixel density](https://en.wikipedia.org/wiki/Pixel_density).

### The "sizes" attribute

The sizes attribute tells the browser how wide the image will be when it's
displayed, though it doesn't affect the image's display size, so you still need
CSS for that.

The browser uses this information, along with what it knows about the user's
device (including its dimensions and pixel density), to determine which image to
load.

If a browser doesn't recognize the "`sizes`" attribute, it falls back to
loading the image specified by the "`src`" attribute. (`sizes` and `srcset`
were introduced at the same time, so every browser supports either both
attributes or neither.)

> [!TIP]
> You can specify slot width using a variety of units. The following are all valid sizes:  
>
> - `100px`
> - `33vw`
> - `20em`
> - `calc(50vw-10px)`
>
> The sizes attribute doesn't accept percentages (such as `25%`).

**Extra Credit** :
If you want to be fancy, you can also use the sizes attribute to specify
multiple slot sizes. This accommodates websites that use different layouts for
different viewport sizes. Check out this [multiple slot code sample](https://web.dev/articles/codelab-specifying-multiple-slot-widths.md.txt)
to learn how to do this.

### (Even more) Extra credit

In addition to all the extra credit already listed (images are complex!), you
can also use these same concepts for
[art direction](https://developer.mozilla.org/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#Art_direction).
Art direction is the practice of serving completely different-looking images
(instead of different versions of the same image) to different viewports. You
can learn more in the [Art Direction code lab](https://web.dev/articles/codelab-art-direction.md.txt).

## Verify

After you implement responsive images, you can use Lighthouse to make sure you
didn't miss any images. Run the Lighthouse Performance Audit
(**Lighthouse \> Options \> Performance** ) and look for the results of the
**Properly size images** audit. These results list the images you still need to
resize.
