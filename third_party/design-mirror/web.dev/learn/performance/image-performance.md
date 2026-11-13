---
source_url: https://web.dev/learn/performance/image-performance
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: 2633df713dd178515a4269a85cbb6d531d57b2ea9d720ec2ad1120d6d9173174
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
> [!TIP]
> **Tip:** For in-depth learning on creating better web images, take the [Learn Images course](https://web.dev/learn/images.md.txt). Learn about specific file formats, high performance image workflows, and more.

Images are often the [heaviest](https://almanac.httparchive.org/en/2022/page-weight#fig-8) and [most prevalent](https://almanac.httparchive.org/en/2022/page-weight#fig-3) resource on the web. As a
result, optimizing images can significantly improve performance on your website.
In most cases, optimizing images means reducing the network time by sending
fewer bytes, but you can also optimize the amount of bytes sent to the user by
serving images that are properly sized for the user's device.

Images can be added to a page using [the `` or `<picture>` elements](https://web.dev/learn/html/images.md.txt), or
the CSS [`background-image` property](https://developer.mozilla.org/docs/Web/CSS/background-image).

> [!NOTE]
>
> **Note:** In some limited cases, SVG images may be inlined
> directly into a page by inserting `<svg>` markup directly
> into a page's HTML. This allows for direct access to an SVG's child elements
> in JavaScript. Given this module's focus on image performance, this use case
> for SVG images isn't covered.
>
>
> Regardless of whether you inline an SVG or load one from the HTML
> `` element, it helps to know when to use an SVG image.
> Because SVG is a
> [vector
> image format](https://wikipedia.org/wiki/Vector_graphics), they're most useful in cases where the image's contents
> are line art, diagrams and charts, and other cases where there aren't fine
> photographic details.
>
>
> If you use SVG images on your website, bear in mind that the SVG format is
> text-based, so techniques such as minification and compression apply. Lossy
> optimization is also possible using [svgo](https://github.com/svg/svgo),
> a Node.js-based SVG optimization tool.

## Image size

The first optimization you can perform when it comes to using image resources is
to display the image at the correct size---in this case, the term *size* refers to
the *dimensions* of an image. Considering no other variables, an image displayed
in a 500 pixel by 500 pixel container would be optimally sized at 500 pixels by
500 pixels. For example, using a square 1000 pixel image means that the image is
twice as large as needed.

However, there are *many* variables involved in choosing the proper image size,
making the task of choosing the proper image size in every case to be quite
complicated. In 2010, when the iPhone 4 was released, the screen resolution
(640x960) was double that of the iPhone 3 (320x480). However, the physical size
of the iPhone 4's screen remained roughly the same as the iPhone 3.

Displaying everything at the higher resolution would have made text and images
significantly smaller---half their previous size to be exact. Instead, 1 pixel
became 2 [device pixels](https://wikipedia.org/wiki/Device-independent_pixel). This is called the [device pixel ratio (DPR)](https://developer.mozilla.org/docs/Web/API/Window/devicePixelRatio). The
iPhone 4 (and many iPhone models released after) had a DPR of 2.

Revisiting the earlier example, if the device has a DPR of 2 and the image is
displayed in a 500 pixel by 500 pixel container, then a square 1000 pixel image
(referred to as the [intrinsic size](https://developer.mozilla.org/docs/Glossary/Intrinsic_Size)) is now the optimal size. Similarly, if the
device has a DPR of 3, then a square 1500 pixel image would be the optimal size.

> [!NOTE]
> **Note:** In most cases, the human eye is [unable to benefit from a DPR of 3](https://observablehq.com/@eeeps/visual-acuity-and-device-pixel-ratio). You can probably use an image that is smaller than the optimal size, without a perceivable decrease in image quality for most users.

### `srcset`

The `` element supports the [`srcset`](https://developer.mozilla.org/docs/Web/HTML/Element/img#attr-srcset) attribute, which lets you specify a
list of possible image sources the browser may use. Each image source specified
must include the image URL, and a width *or* pixel density descriptor.

```html

```

The preceding HTML snippet uses the pixel density descriptor to hint the browser
to use `image-500.png` on devices with a DPR of 1, `image-1000.jpg` on devices
with a DPR of 2, and `image-1500.jpg` on devices with a DPR of 3.

While this all may seem cut and dry, a screen's DPR is not the only
consideration in choosing the optimal image for a given page. The page's
*layout* is yet another consideration.

### `sizes`

The previous solution only works if you display the image at the same CSS pixel
size on all viewports. In many cases, the layout of a page---and the container's
size with it---changes depending on the user's device.

The [`sizes` attribute](https://developer.mozilla.org/docs/Web/HTML/Element/img#attr-sizes) lets you specify a set of source sizes, where each
source size consists of a [media condition](https://developer.mozilla.org/docs/Web/CSS/Media_Queries/Using_media_queries#syntax) and a value. The `sizes` attribute
describes the intended display size of the image in CSS pixels. When combined
with the `srcset` width descriptors, the browser can choose which image source
is best for the user's device.

```html

```

In the preceding HTML snippet, the `srcset` attribute specifies a list of image
candidates the browser can choose from, separated by commas. Each candidate in
the list consists of the image's URL, followed by a syntax that denotes the
intrinsic width of the image. An image's *intrinsic size* is its dimensions. For
example, a descriptor of `1000w` denotes that the image's intrinsic width is
1000 pixels wide.

Using this information, the browser evaluates the media condition in the `sizes`
attribute, and---in this case---is instructed that if the device's viewport width
exceeds 768 pixels, the image is displayed at a width of 500 pixels. On smaller
devices, the image is displayed at `100vw`---or the full viewport width.

> [!NOTE]
> **Note:** If you are unfamiliar with the `vw` CSS unit, read [The large, small, and dynamic
> viewport units](https://web.dev/blog/viewport-units) to learn more.

The browser can then combine this information with the list of `srcset` image
sources to find the optimal image. For example, if the user is on a mobile
device with a screen width of 320 pixels with a DPR of 3, the image is displayed
at `320 CSS pixels x 3 DPR = 960 device pixels`. In this example, the closest
sized image would be `image-1000.jpg` which has an intrinsic width of 1000
pixels (`1000w`).

> [!CAUTION]
> **Caution:** `srcset` width descriptors must have both `sizes` attribute and width descriptors, or they don't work.

## File formats

Browsers support several different image file formats. Modern image formats like
[WebP](https://web.dev/articles/serve-images-webp.md.txt) and [AVIF](https://web.dev/articles/compress-images-avif.md.txt) may provide better compression than PNG or JPEG, making your
image file size smaller and therefore taking less time to download. By serving
images in modern formats, you can [reduce a resource's load time](https://web.dev/articles/optimize-lcp.md.txt#3_reduce_resource_load_time), which may
result in a lower [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp.md.txt).

WebP is a [widely supported](https://caniuse.com/webp) format that works on all modern browsers. WebP
often has better compression than JPEG, PNG, or GIF, offering both [lossy](https://wikipedia.org/wiki/Lossy_compression) and
[lossless compression](https://wikipedia.org/wiki/Lossless_compression). WebP also supports alpha channel transparency even when
using lossy compression---a feature the JPEG codec doesn't offer.

AVIF is a newer image format, and while it isn't as widely supported as WebP, it
does enjoy [reasonably decent support across browsers](https://caniuse.com/avif). AVIF supports both lossy
and lossless compression, and [tests](https://netflixtechblog.com/avif-for-next-generation-image-coding-b1d75675fe4) have shown greater than 50% savings when
compared to JPEG in some cases. AVIF also offers [Wide Color Gamut (WCG)](https://wikipedia.org/wiki/Gamut#Wide_color_gamut) and
[High Dynamic Range (HDR)](https://wikipedia.org/wiki/High_dynamic_range#Imaging) features.

## Compression

Where images are concerned, there are two types of compression:

1. [Lossy compression](https://wikipedia.org/wiki/Lossy_compression)
2. [Lossless compression](https://wikipedia.org/wiki/Lossless_compression)

Lossy compression works by reducing the image accuracy through [quantization](https://cs.stanford.edu/people/eroberts/courses/soco/projects/data-compression/lossy/jpeg/coeff.htm),
and additional color information may be discarded using [chroma subsampling](https://wikipedia.org/wiki/Chroma_subsampling).
Lossy compression is most effective on high-density images with lots of noise
and colors---typically photos or imagery with similar contents. This is because
the [artifacts](https://wikipedia.org/wiki/Compression_artifact) produced by lossy compression are much less likely to be noticed
in such detailed images. However, lossy compression may be less effective with
imagery containing sharp edges such as line art, similarly stark details, or
text. Lossy compression can be applied to JPEG, WebP, and AVIF images.

> [!NOTE]
> **Note:** When using lossy compression, always confirm that the compressed image meets your quality standards. For example, images which contain high-contrast colored text atop a flat color are prone to artifacts from chroma subsampling.

Lossless compression reduces the file size by compressing an image with no data
loss. Lossless compression describes a pixel based on the difference from its
neighboring pixels. Lossless compression is used for the GIF, PNG, WebP, and
AVIF image formats.

You can compress your images using [Squoosh](https://squoosh.app), [ImageOptim](https://imageoptim.com/), or an image
optimization service. When compressing, there isn't a universal setting suitable
for all cases. The recommended approach would be to experiment with different
compression levels until you find a good compromise between image quality and
file size. Some advanced image optimization services can do this for you
automatically, but may not be financially viable for all users.

## The `<picture>` element

The `<picture>` element gives you greater flexibility in specifying multiple
image candidates:

```html
<picture>
  <source type="image/avif" srcset="image.avif">
  <source type="image/webp" srcset="image.webp">
  
</picture>
```

When you use `<source>` element(s) within the `<picture>` element, you can add
support for AVIF and WebP images, but fall back to more compatible legacy image
formats if the browser does not support modern formats. With this approach, the
browser picks the first `<source>` element specified that matches. If it can
render the image in that format, it uses that image. Otherwise, the browser
moves on to the next specified `<source>` element. In the preceding HTML
snippet, the AVIF format takes priority over the WebP format, falling back to
the JPEG format if neither AVIF or WebP is supported.

A `<picture>` element requires an `` element nested inside of it. The
`alt`, `width`, and `height` attributes are defined on the `` and used
regardless of which `<source>` is selected.

The `<source>` element also supports the `media`, `srcset`, and `sizes`
attributes. Similarly to the `` example earlier, these indicate to the
browser which image to select on different viewports.

> [!NOTE]
> **Note:** While the `srcset` attribute provides the browser hints on which image to use, the media query on `<src>` is a **command** to be followed by the browser.

```html
<picture>
  <source
    media="(min-resolution: 1.5x)"
    srcset="/image-1000.jpg 1000w, /image-1500.jpg 1500w"
    sizes="(min-width: 768px) 500px, 100vw">
  
</picture>
```

The `media` attribute takes a [media condition](https://developer.mozilla.org/docs/Web/CSS/Media_Queries/Using_media_queries#syntax). In the preceding example, the
device's DPR is used as the media condition. Any device with a DPR greater than
or equal to 1.5 would use the first `<source>` element. The `<source>` element
tells the browser that, on devices with a viewport wider than 768 pixels, the
selected image candidate is displayed at 500 pixels wide. On smaller devices,
this takes up the entire viewport width. By combining the `media` and `srcset`
attributes, you can have finer control over which image to use.

This is illustrated in the following table, where several viewport widths and
device pixel ratios are evaluated:

| Viewport Width (pixels) | 1 DPR | 1.5 DPR | 2 DPR | 3 DPR |
|---|---|---|---|---|
| 320 | 500.jpg | 500.jpg | 500.jpg | 1000.jpg |
| 480 | 500.jpg | 500.jpg | 1000.jpg | 1500.jpg |
| 560 | 500.jpg | 1000.jpg | 1000.jpg | 1500.jpg |
| 1024 | 500.jpg | 1000.jpg | 1000.jpg | 1500.jpg |
| 1920 | 500.jpg | 1000.jpg | 1000.jpg | 1500.jpg |

Devices with a DPR of 1 download the `image-500.jpg` image, including most
desktop users---who view the image at an [extrinsic size](https://www.w3.org/TR/css-sizing-3/#extrinsic) of 500 pixels wide. On
the other hand, mobile users with a DPR of 3 download a potentially larger
`image-1500.jpg`---the same image used on desktop devices with a DPR of 3.

```html
<picture>
  <source
    media="(min-width: 561px) and (min-resolution: 1.5x)"
    srcset="/image-1000.jpg 1000w, /image-1500.jpg 1500w"
    sizes="(min-width: 768px) 500px, 100vw">
  <source
    media="(max-width: 560px) and (min-resolution: 1.5x)"
    srcset="/image-1000-sm.jpg 1000w, /image-1500-sm.jpg 1500w"
    sizes="(min-width: 768px) 500px, 100vw">
  
</picture>
```

In this example, the `<picture>` element is adjusted to include an additional
`<source>` element to use different images for wide devices with a high DPR:

| Viewport Width (pixels) | 1 DPR | 1.5 DPR | 2 DPR | 3 DPR |
|---|---|---|---|---|
| 320 | 500.jpg | 500.jpg | 1000-sm.jpg | 1000-sm.jpg |
| 480 | 500.jpg | 500.jpg | 1000-sm.jpg | 1500-sm.jpg |
| 560 | 500.jpg | 1000-sm.jpg | 1000-sm.jpg | 1500-sm.jpg |
| 1024 | 500.jpg | 1000.jpg | 1000.jpg | 1500.jpg |
| 1920 | 500.jpg | 1000.jpg | 1000.jpg | 1500.jpg |

With this additional query, you can see that `image-1000-sm.jpg` and
`image-1500-sm.jpg` are displayed on small viewports. This extra information
lets you compress images further, since compression artifacts are not highly
visible at that size and density, while also not compromising the image quality
on desktop devices.

Alternatively, by adjusting the `srcset` and `media` attributes, you can avoid
serving large images on small viewports:

```html
<picture>
  <source
    media="(min-width: 561px)"
    srcset="/image-500.jpg, /image-1000.jpg 2x, /image-1500.jpg 3x">
  <source
    media="(max-width: 560px)"
    srcset="/image-500.jpg 1x, /image-1000.jpg 2x">
  
</picture>
```

In the preceding HTML snippet, the width descriptors have been removed in favor
of device pixel ratio descriptors. Images served on a mobile device are limited
to `/image-500.jpg` or `/image-1000.jpg`, even on devices with a DPR of 3.

## Manage complexity

When working with responsive images, you can find yourself with many different
size variations and formats for each image. In the preceding example, variations
for each size are used, but exclude AVIF and WebP. How many variants should you
have? Like many engineering problems, the answer tends to be "it depends".

While it may be tempting to have as many variations to deliver the best fit,
every additional image variant comes at a cost and makes less efficient use of
the browser cache. With only one variant, every user receives the same image,
so it can be cached very efficiently.

On the other hand, if there are many variations, each variant requires another
cache entry. Server costs can increase and may degrade performance if the
variant's cache entry has expired, and the image needs to be fetched again from
the origin server.

Apart from this, the size of your HTML document grows with each variation. You
could find yourself shipping multiple kilobytes of HTML for each image.

### Serve images based on the `Accept` request header

The [`Accept`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Accept) HTTP request header informs the server which content types the
user's browser understands. This information can be used by your server to serve
the optimal image format without adding extra bytes to your HTML responses.

```javascript
if (request.headers.accept) {
  if (request.headers.accept.includes('image/avif')) {
    return reply.from('image.avif');
  } else if (request.headers.accept.includes('image/webp')) {
    return reply.from('image.webp');
  }
}

return reply.from('image.jpg');
```

> [!IMPORTANT]
> **Important:** The `Accept` request header usually only communicates what image types are supported in requests for HTML resources. If you choose to serve resources based on the value of this header, specify it in an additional [`Vary` response header](https://developer.mozilla.org/docs/Web/HTTP/Headers/Vary) so that shared caches (such as content delivery networks (CDNs)) can account for different responses for the same URL.

The preceding HTML snippet is a simplified version of the code you can add to
your server's JavaScript backend to choose and serve the optimal image format.
If the request `Accept` header includes `image/avif`, then the AVIF image is
served. Otherwise, if the `Accept` header includes `image/webp`, the WebP image
is served. If neither of these conditions is true, then the JPEG image is
served.

You can modify responses based on contents of the `Accept` request header
in nearly every type of web server---for example, you can [rewrite image requests
on Apache servers based on the `Accept` header using `mod_rewrite`](https://web.dev/articles/serve-images-webp#reading_the_http_accept_header).

This is not unlike behavior you would find on an [Image Content Delivery Network
(CDN)](https://web.dev/articles/image-cdns). Image CDNs are excellent solutions for optimizing images and sending the
optimal format based on the user's device and browser.

The key is to find a balance, generate a reasonable number of image candidates,
and measure the impact on the user experience. Different images can give
different results, and the optimizations applied to each image depend on its
size within the page and the devices your users are using. For example, a
full-width hero image may require more variants than thumbnail images on an
ecommerce product listing page.

## Lazy loading

It's possible to tell the browser to lazy load images when they appear in the
viewport using the [`loading`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/loading) attribute. An attribute value of `lazy` tells the
browser to not download the image until it is in (or near) the viewport. This
saves bandwidth, allowing the browser to prioritize the resources it needs to
render the critical content that is already in the viewport.

> [!TIP]
> **Tip:** To learn more about lazy loading, read the [Lazy load images and `<iframe>` elements](https://web.dev/learn/performance/lazy-load-images-and-iframe-elements.md.txt) module.

## Decoding attribute

The [`decoding`](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/decoding) attribute tells the browser how it should decode the image.
There are three possible values:

- `async` tells the browser that the image can be decoded asynchronously, which may improve the time to render other content.
- `sync` tells the browser that the image should be presented at the same time as other content.
- `auto` (default) allows the browser to decide what is best for the user.

You can use the [`decode` method](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/decode)
on an instance of an `HTMLImageElement` in JavaScript, when inserting an image
into the DOM.

> [!NOTE]
> **Note:** The effects of `decoding` and `decode` may only be noticeable on very large, high-resolution images. These take a much longer time to decode. Learn more about [what the image decoding attribute actually does](https://www.tunetheweb.com/blog/what-does-the-image-decoding-attribute-actually-do).

## Image demo

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy" src="https://chrome.dev/f/learn_performance_images/?attributionHidden=true&amp;sidebarCollapsed=true&amp;previewSize=100" style="height: 100%; width: 100%; border: 0;"></iframe>

## Test your knowledge

Which image formats support *lossless* compression?
GIF. Correct! JPEG. Try again. PNG. Correct! WebP. Correct! AVIF. Correct!
Which image formats support *lossy* compression?
GIF. Try again. Although the GIF format only supports a limited palette of 256 colors, the lossy encoding must be done before converting to GIF. JPEG. Correct! PNG. Try again. WebP. Correct! AVIF. Correct!
What does the width descriptor (for example, `1000w`) tell
the browser about an image candidate specified in an `srcset`
attribute?
The *extrinsic* width of the image---that is, the dimensions of the image in the layout after styles have been applied to the page Try again. The *intrinsic* width of the image---that is, the dimensions of the image itself. Correct!
What does the `sizes` attribute tell the browser about an
`` element it's applied to?
Logic that expresses which candidate specified in an `` element's `srcset` should be loaded, given the dimensions of the user's current viewport. Correct! The *intrinsic* width of the image to be loaded from the `` element's `srcset` attribute. Try again.

## Up next: Video performance

While images may be the [most prevalent](https://almanac.httparchive.org/en/2022/page-weight#fig-3) media type used on the web, they're far
from the only one you need to keep in mind when it comes to performance. Video
is another common type of media used across the web, and comes with its own
performance considerations. In [the next module](https://web.dev/learn/performance/video-performance.md.txt) of this course, explore some
techniques around optimizing videos and how to load them efficiently.
