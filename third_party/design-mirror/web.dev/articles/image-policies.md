---
source_url: https://web.dev/articles/image-policies
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:12+00:00
sha256: b042d3e711ed6ab6d70b52facaaf552e6d7cb92c2a6890a9fa4037f843f2b530
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Use optimized image policies to ensure your site is using the best performing images.

Luna Lu [GitHub](https://github.com/loonybear)

Images often take up a significant amount of visual space and make up the
majority of the downloaded bytes on a website. Optimizing images can improve
loading performance and reduce network traffic.

Surprisingly, more than half of the sites on the web are serving poorly
compressed or unnecessarily large images. This leaves a lot of room for
performance improvements simply by optimizing the images.

You may ask, how do I know if my images are optimized and how should I optimize
them? We are experimenting with a new set of feature policies for image
optimization: `oversized-images`, `unoptimized-lossy-images`,
`unoptimized-lossless-images`, and`unoptimized-lossless-images-strict`.
All are now available for [origin
trials](https://github.com/GoogleChrome/OriginTrials/blob/gh-pages/developer-guide.md).

## Optimized image policies

Permissions policy is introducing a new set restrictions on images that can be
applied with development-time enforcement. Images violating any of the
restrictions will be rendered as placeholder images, which are easy to identify
and fix. These policies can be specified in report-only mode where images will
render normally without enforcement while violations are being observed via
reports. (See [Report-only mode in the wild](https://web.dev/articles/image-policies.md.txt#report-only_mode_in_the_wild),
below for details.)

### oversized-images

The `oversized-images` permissions policy restricts the intrinsic dimensions
of an image in relation to its container size.

When a document uses the `oversized-images` policy, any `` element
whose intrinsic resolution is more than X times larger than the container size
in either dimension will be replaced with a placeholder image.

#### Why?

Serving images larger than what the viewing device can render---for example,
serving desktop images to mobile contexts, or serving high-pixel-density images
to a low-pixel-density device---is wasting network traffic and device
memory. Read [Serve images with correct dimensions](https://web.dev/articles/serve-images-with-correct-dimensions.md.txt)
and [Serve responsive images](https://web.dev/articles/serve-responsive-images.md.txt)
for information on optimizing your images.

#### Examples

A few examples illustrate this. The following shows the default behavior when cutting an image's display size in half.
The default resizing behavior.

If I apply the following permissions policy, I get a placeholder image instead.

`Permissions-Policy: oversized-images *(2);`
When the image is too large for the container.

I get similar results if I lower only the width or the height.
Resize width and height.

#### How to use

To summarize, `oversized-images` policy can be specified through either:

- `Permissions-Policy` HTTP header
- `<iframe>` `allow` attribute

To declare the `oversized-images` policy, you need to provide:

- The feature name, `oversized-images` (Required)
- A list of origins (Optional)
- The threshold values (i.e., the downscaling ratio X) for the origins, specified in parenthesis (Optional)

We recommend a downscaling ratio of 2.0 or lower. Consider using
[responsive images](https://web.dev/articles/serve-responsive-images.md.txt) with different resolutions to
best serve images on various screen sizes, resolutions, and so on.

#### More examples

`Permissions-Policy: oversized-images *(2.0)`

The policy is enforced on all origins with a threshold value of 2.0. Any
`` element with an image whose downscaling ratio that is greater than
2.0 is disallowed and will be replaced with a placeholder image.

`Permissions-Policy: oversized-images *(inf) 'self'(1.5)`

The policy is enforced on the site's origin with a threshold value of 1.5.
`elements in top-level browsing contexts and same origin nested
browsing contexts will only render normally if the downscaling ratio is less
than or equal to 1.5.` elements everywhere else will render normally.

### unoptimized-{lossy,lossless}-images

The `unoptimized-lossy-images`, `unoptimized-lossless-images`,
`unoptimized-lossless-images-strict` feature policies restrict the file
size of an image in relation to its intrinsic resolution:

`unoptimized-lossy-images`
: Lossy formats should not exceed a byte-per-pixel ratio of X, with a fixed **1KB** overhead allowance. For a W x H image, the file size threshold is calculated as W x H x X + 1024.

`unoptimized-lossless-images`
: Lossless formats should not exceed a byte-per-pixel ratio of X, with a fixed **10KB** overhead allowance. For a W x H image, the file size threshold is calculated as W x H x X + 10240.

`unoptimized-lossless-images-strict`
: Lossless formats should not exceed a byte-per-pixel ratio of X, with a fixed **1KB** overhead allowance. For a W x H image, the file size threshold is calculated as W x H x X + 1024.

When a document uses any of these policies, any `` element violating
the constraint will be replaced with a placeholder image.

#### Why?

The larger the download size is, the longer it takes for an image to load. The
file size should be kept as small as possible when optimizing an image:
stripping metadata, picking a good image format, using image compression, and so on.
Read [Use Imagemin to compress images](https://web.dev/articles/use-imagemin-to-compress-images.md.txt) and
[Use WebP images](https://web.dev/articles/serve-images-webp.md.txt) for information on
optimizing your images.

#### Example

The following shows the default browser behavior. Without the permissions policy an unoptimized lossy image can be displayed just the same as an optimized image.
Comparing an optimized image with an unoptimized image.

If I apply the following permissions policy, I get a placeholder image instead.

`Permissions-Policy: unoptimized-lossy-images *(0.5);`
When the image is not optimized.

#### How to use

If you are new to permissions policy, please check out [Introduction to Permissions
Policy](https://developer.chrome.com/docs/privacy-sandbox/permissions-policy) for
more details.

To summarize, `unoptimized-{lossy,lossless}-images` policies can be either
specified through:

- `Permissions-Policy` HTTP header
- `<iframe>` `allow` attribute

To declare an `unoptimized-{lossy,lossless}-images` policy, you will need to
provide:

- The feature name, for example, `unoptimized-lossy-images` (Required)
- A list of origins (Optional)
- The threshold values (i.e., byte-per-pixel ratio X) for the origins, specified in parenthesis (Optional)

We recommend a byte-per-pixel ratio of 0.5 or lower for
`unoptimized-lossy-images` and a byte-per-pixel ratio of 1 or lower for
`unoptimized-lossless-images` and `unoptimized-lossless-images-strict`.

WebP formats have better compression ratios than other formats. Serve all your
images in WebP lossy format if you can. If that is not sufficient, try WebP
lossless format. Use JPEG on browsers that don't support WebP formats. Use PNG
if none of thes formats work.

If you are using WebP formats, try with stricter thresholds:

- 0.2 for WEBPV8
- 0.5 for WEBPL

#### More examples

```text
Feature-Policy:  unoptimized-lossy-images *(0.5);
                 unoptimized-lossless-images *(1.0);
                 unoptimized-lossless-images-strict *(1.0);
```

This policy is enforced on all origins with a threshold value of 0.5 (for lossy
formats) and 1 (for lossless formats). Any `` element whose image has a
byte-per-pixel ratio exceeding the constraint is disallowed and will be replaced
with a placeholder image.

```text
Feature-Policy: unoptimized-lossy-images *(inf) 'self'(0.3);
                unoptimized-lossless-images *(inf) 'self'(0.8);
                unoptimized-lossless-images-strict *(inf) 'self'(0.8);
```

This policy is enforced on the site's origin with a threshold value of 0.3 (for
lossy formats) and 0.8 (for lossless formats). The `elements in top-level
browsing contexts and same origin nested browsing contexts will only render
normally if the byte-per-pixel ratio meets these constraints. The` elements
everywhere else will render normally.

### Report-only mode in the wild

Publishing a site with placeholder images may not be what you want. You can use
the policies in enforcement mode (with unoptimized images rendered as
placeholder images) during development and staging, and use report-only mode in
production. (Check out [Permissions Policy
Reporting](https://github.com/w3c/webappsec-permissions-policy/blob/master/reporting.md)
for more details.) Similar to `Permissions-Policy` HTTP header, the
`Permissions-Policy-Report-Only` header lets you observe violation reports in the
wild without any enforcement.

### Limitations

Image policies only work on HTML image elements (``, `<source>`,
etc.) and are not yet supported on background images or generated content. If you
would like to have policies supported on broader contents, please let us know.

## Optimizing your images

I've talked quite a bit about optimizing your images, but haven't said how to do it. That topic is out of scope for this article, but you can learn more from the links below and from the codelabs listed at the end of the article.

- [Optimizing images](https://web.dev/explore/fast#optimize-your-images)
- [Serve images with correct dimensions](https://web.dev/articles/serve-images-with-correct-dimensions.md.txt)

## Please give us feedback

Hopefully this article has given you a good understanding of the image policies
and gotten you excited. We'd really love for you to try out the policies and
give us feedback.

You can give us feedback for each of the features mentioned in this article to
our mailing list: [feature-control@](mailto:feature-control@chromium.org)[chromium.org](mailto:feature-control@chromium.org).

We would love to know what threshold values you used and found useful. We would
love to know whether `unoptimized-lossless-images` or
`unoptimized-lossless-images-strict` is more intuitive and easy to use, or if we
should use a difference overhead allowance instead. We will be sending out a
survey near the end of the trial. Stay tuned!
