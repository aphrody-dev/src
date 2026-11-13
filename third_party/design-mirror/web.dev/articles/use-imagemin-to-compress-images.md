---
source_url: https://web.dev/articles/use-imagemin-to-compress-images
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: cc24bb4c7f71582127a6fa5fa64a6e887312996d2f1008bdb9f80b350384ed47
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Katie Hempenius [X](https://twitter.com/katiehempenius)

## Why should you care?

Uncompressed images bloat your pages with unnecessary bytes. Because images can be [candidates for Largest Contentful Paint (LCP)](https://web.dev/articles/lcp.md.txt#what-elements-are-considered), those unnecessary bytes can increase the image's [resource load duration](https://web.dev/articles/optimize-lcp.md.txt#reduce-resource-load-duration), possibly resulting in longer LCP times.

The photo on the right is 40% smaller than the one on the left, yet would probably look identical to the average user.

|  20 KB |  12 KB |
|---|---|

## Measure

Run Lighthouse to check for opportunities to improve page load by compressing images.
These opportunities are listed under "Efficiently encode images":

> [!NOTE]
> **Note:** Lighthouse currently reports on opportunities to compress images in JPEG format only.

## Imagemin

Imagemin is an excellent choice for image compression because it supports a wide
variety of image formats and is easily integrated with build scripts and build
tools. Imagemin is available as both a
[CLI](https://github.com/imagemin/imagemin-cli) and an [npm
module](https://www.npmjs.com/package/imagemin). Generally, the npm module is
the best choice because it offers more configuration options, but the CLI can be
a decent alternative if you want to try Imagemin without touching any code.

### Plugins

Imagemin is built around "plugins." A plugin is an npm package that compresses a
particular image format (e.g. "mozjpeg" compresses JPEGs). Popular image formats
may have multiple plugins to pick from.

The most important thing to consider when choosing a plugin is whether it is
"lossy" or "lossless." In lossless compression, no data is lost. Lossy
compression reduces file size, but at the expense of possibly reducing image
quality. If a plugin doesn't mention whether it is "lossy" or "lossless," you
can tell by its API: if you can specify the image quality of the output, then it
is "lossy."

For most people, lossy plugins are the best choice. They offer significantly
greater filesize savings, and you can customize the compression levels to meet
your needs. The table below lists popular Imagemin plugins. These aren't the only plugins
available, but they'd all be good choices for your project.

| Image Format | Lossy Plugin(s) | Lossless Plugin(s) |
|---|---|---|
| JPEG | [imagemin-mozjpeg](https://www.npmjs.com/package/imagemin-mozjpeg) | [imagemin-jpegtran](https://www.npmjs.com/package/imagemin-jpegtran) |
| PNG | [imagemin-pngquant](https://www.npmjs.com/package/imagemin-pngquant) | [imagemin-optipng](https://www.npmjs.com/package/imagemin-optipng) |
| GIF | [imagemin-giflossy](https://www.npmjs.com/package/imagemin-giflossy) | [imagemin-gifsicle](https://www.npmjs.com/package/imagemin-gifsicle) |
| SVG | [imagemin-svgo](https://www.npmjs.com/package/imagemin-svgo) |   |
| WebP | [imagemin-webp](https://www.npmjs.com/package/imagemin-webp) | [imagemin-webp](https://www.npmjs.com/package/imagemin-webp) |

### Imagemin CLI

The Imagemin CLI works with 5 different plugins: imagemin-gifsicle,
imagemin-jpegtran, imagemin-optipng, imagemin-pngquant, and imagemin-svgo.
Imagemin uses the appropriate plugin based on the image format of the
input.

To compress the images in the "images/" directory and save them to the same
directory, run the following command (overwrites the original files):

```bash
$ imagemin images/* --out-dir=images
```

### Imagemin npm module

If you want to use Imagemin with a bundler, check to see if your chosen bundler
has a plugin available for it. For example, webpack is a popular bundler that
has great support for Imagemin. You can learn more about [how to use Imagemin
with webpack in this codelab](https://web.dev/articles/codelab-imagemin-webpack).

You can also use Imagemin by itself as a Node script.
This code uses the "imagemin-mozjpeg" plugin to compress JPEG files to a quality
of 50 ('0' being the worst; '100' being the best):

```javascript
const imagemin = require('imagemin');
const imageminMozjpeg = require('imagemin-mozjpeg');

(async() => {
  const files = await imagemin(
      ['source_dir/*.jpg', 'another_dir/*.jpg'],
      {
        destination: 'destination_dir',
        plugins: [imageminMozjpeg({quality: 50})]
      }
  );
  console.log(files);
})();
```
