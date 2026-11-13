---
source_url: https://web.dev/articles/serve-images-webp
fetched: 2026-11-13
lastmod: 2026-11-12T22:03:57+00:00
sha256: cad3996c2dcbe08448f146cff7b4c479a0aa353124ade95e28e52fc0573c6ff4
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Katie Hempenius [X](https://twitter.com/katiehempenius)

## Why should you care?

WebP images are smaller than their JPEG and PNG counterparts---usually on the
magnitude of a 25--35% reduction in filesize. This decreases page sizes and
improves performance.

- YouTube found that switching to WebP thumbnails resulted in [10%
  faster page loads](https://www.youtube.com/watch?v=rqXMwLbYEE4).
- Facebook [experienced](https://code.fb.com/android/improving-facebook-on-android/) a 25-35% filesize savings for JPEGs and an 80% filesize savings for PNGs when they switched to using WebP.

WebP is an excellent replacement for JPEG, PNG, and GIF images. In addition,
WebP offers both lossless and lossy compression. In lossless compression no data
is lost. Lossy compression reduces file size, but at the expense of possibly
reducing image quality.

## Convert images to WebP

People generally use one of the following approaches for converting their images
to WebP: the
[`cwebp` command-line tool](https://developers.google.com/speed/webp/docs/using)
or the [Imagemin WebP plugin](https://github.com/imagemin/imagemin-webp) (npm
package).
The Imagemin WebP plugin is generally the best choice if your project uses build
scripts or build tools (e.g. Webpack or Gulp), whereas the CLI is a good choice
for small projects or if you'll only need to convert images once.

When you convert images to WebP, you have the option to set a wide variety of
compression settings---but for most people the only thing you'll ever need to
care about is the quality setting. You can specify a quality level from 0
(worst) to 100 (best). It's worth playing around with this, find
which level is the right tradeoff between image quality and filesize for your
needs.

### Use `cwebp`

Convert a single file, using `cwebp`'s default compression settings:

```bash
cwebp images/flower.jpg -o images/flower.webp
```

Convert a single file, using a quality level of `50`:

```bash
cwebp -q 50 images/flower.jpg -o images/flower.webp
```

Convert all files in a directory:

```bash
for file in images/*; do cwebp "$file" -o "${file%.*}.webp"; done
```

### Use Imagemin

The Imagemin WebP plugin can be used by itself or with your favorite build tool
(Webpack/Gulp/Grunt/etc.). This usually involves adding \~10 lines of code to a
build script or the configuration file for your build tool.
Here are examples of how to do that for
[Webpack](https://glitch.com/%7Ewebp-webpack),
[Gulp](https://glitch.com/%7Ewebp-gulp), and
[Grunt](https://glitch.com/%7Ewebp-grunt).

If you are not using one of those build tools, you can use Imagemin by itself as
a Node script. This script will convert the files in the `images` directory and
save them in the `compressed_images` directory.

```javascript
const imagemin = require("imagemin");
const imageminWebp = require("imagemin-webp");

imagemin(["images/*"], {
  destination: "compressed_images",
  plugins: [imageminWebp({ quality: 50 })],
}).then(() => {
  console.log("Done!");
});
```

## Serve WebP images

If your site only supports WebP compatible
[browsers](https://caniuse.com/#search=webp), you can stop reading. Otherwise,
serve WebP to newer browsers and a fallback image to older browsers:

**Before:**

```html

```

**After:**

```html
<picture>
  <source type="image/webp" srcset="flower.webp" />
  <source type="image/jpeg" srcset="flower.jpg" />
</picture>
```

The
[`<picture>`](https://developer.mozilla.org/docs/Web/HTML/Element/picture),
[`<source>`](https://developer.mozilla.org/docs/Web/HTML/Element/source),
and `` tags, including how they are ordered relative to each other, all
interact to achieve this end result.

### `<picture>`

The `<picture>` tag provides a wrapper for zero or more `<source>` tags and one `` tag.

### `<source>`

The `<source>` tag specifies a media resource.

The browser uses the first listed source that's in a format it supports. If the browser does not support any of the formats listed in the `<source>` tags, it falls back to loading the image specified by the `` tag.

> [!TIP]
> **Tip:** The `<source>` tag for the "preferred" image format (in this case that is WebP) should be listed first, before other `<source>` tags. The value of the `type` attribute should be the MIME type corresponding to the image format. An image's [MIME type](https://developer.mozilla.org/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types) and its file extension are often similar, but they aren't necessarily the same thing (for example, `.jpg` versus `image/jpeg`).

### ``

The ``tag is what makes this code work on browsers
that don't support the `<picture>` tag.
If a browser does not support the `<picture>` tag, it will
ignore the tags it doesn't support. Thus, it only "sees" the`` tag and loads that image.

> [!TIP]
> **Tip:** The ``tag should always be included, and it should always be listed last, after all `<source>` tags. The resource specified by the`` tag should be in a universally supported format (e.g. JPEG), so it can be used as a fallback.

### Reading the HTTP `Accept` header

If you have an application backend or web server that lets you rewrite requests, you can read the value of the [HTTP `Accept` header](https://developer.mozilla.org/docs/Web/HTTP/Headers/Accept), which will advertise what alternative image formats are supported:

```console
Accept: image/webp,image/svg+xml,image/*,*/*;q=0.8
```

Reading this request header and rewriting the response based on its contents has the benefit of simplifying your image markup. `<picture>` markup can get rather long with many sources. Following is an Apache `mod_rewrite` rule that can serve WebP alternates:

```apacheconf
RewriteEngine On
RewriteCond %{HTTP:Accept} image/webp [NC]
RewriteCond %{HTTP:Content-Disposition} !attachment [NC]
RewriteCond %{DOCUMENT_ROOT}/$1.webp -f [NC]
RewriteRule (.+)\.(png|jpe?g)$ $1.webp [T=image/webp,L]
```

If you go this route, you'll need to set the [HTTP `Vary` response header](https://developer.mozilla.org/docs/Web/HTTP/Headers/Vary) to ensure caches will understand that the image may be served differently depending on the `Accept` header:

```apacheconf
<FilesMatch ".(jpe?g|png)$">
  <IfModule mod_headers.c>
    Header set Vary "Accept"
  </IfModule>
</FilesMatch>
```

The previous rewrite rule will look for a WebP version of any requested JPEG or PNG image. If a WebP alternate is found, it will be served with the proper `Content-Type` header. This will allow you to use image markup similar to the following with automatic WebP support:

```html

```

## Verify WebP usage

Lighthouse can be used to verify that all images on your site are being served
using WebP. Run the Lighthouse Performance Audit (**Lighthouse \> Options \>
Performance** ) and look for the results of the **Serve images in next-gen
formats** audit. Lighthouse will list any images that are not being served in
WebP.
