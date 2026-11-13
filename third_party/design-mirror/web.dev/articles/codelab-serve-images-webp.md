---
source_url: https://web.dev/articles/codelab-serve-images-webp
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: 388b6bab4a508f505395492e2a7d2ae812f3fe40137392502f9137bb316858ba
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Katie Hempenius [X](https://twitter.com/katiehempenius)

> [!IMPORTANT]
> To follow this codelab, open [this Glitch](https://glitch.com/edit/#!/webp-cli) in a second tab.

The webp
[command line tool](https://developers.google.com/speed/webp/docs/precompiled)
has already been installed for you, so you're all set to get started. This tool
converts JPG, PNG, and TIFF images to WebP.

## Convert images to WebP

1. Click **Remix to Edit** to make the project editable.
2. Click **Terminal** (note: if the Terminal button does not show you may need to use the Fullscreen option).
3. Type the following command:

```bash
cwebp -q 50 images/flower1.jpg -o images/flower1.webp
```

This command converts, at a quality of `50` (`0` is the worst; `100` is the
best), the `images/flower1.jpg` file and saves it as `images/flower1.webp`.

> [!NOTE]
> **Note:** Are you wondering why you type `cwebp` instead of `webp`? WebP has two separate commands for encoding and decoding WebP images. `cwebp` encodes images to WebP, while `dwebp` decodes images from WebP.

After doing this, you should see something like this in the console:

```bash
Saving file 'images/flower1.webp'
File:      images/flower1.jpg
Dimension: 504 x 378
Output:    29538 bytes Y-U-V-All-PSNR 34.57 36.57 36.12   35.09 dB
           (1.24 bpp)
block count:  intra4:        750  (97.66%)
              intra16:        18  (2.34%)
              skipped:         0  (0.00%)
bytes used:  header:            116  (0.4%)
             mode-partition:   4014  (13.6%)
 Residuals bytes  |segment 1|segment 2|segment 3|segment 4|  total
    macroblocks:  |      22%|      26%|      36%|      17%|     768
      quantizer:  |      52 |      42 |      33 |      24 |
   filter level:  |      16 |       9 |       6 |      26 |
```

You've just successfully converted the image to WebP.

However, running the `cwebp` command one image at a time like this would take a
long time to convert many images. If you need to do this, you can use a script
instead.

- Run this script in the console (don't forget the backticks):

```bash
`for file in images/*; do cwebp -q 50 "$file" -o "${file%.*}.webp"; done`
```

This script converts, at a quality of `50`, all the files in the `images/`
directory, and saves them as a new file (same filename, but with a `.webp` file
extension) in the same directory.

### ✔︎ Check-in

You should now have 6 files in your `images/` directory:

```bash
flower1.jpg
flower1.webp
flower2.jpg
flower2.webp
flower3.png
flower3.webp
```

Next, update this Glitch to serve WebP images to browsers that support it.

## Add WebP images using the `<picture>` tag

The `<picture>` tag allows you to serve WebP to newer browsers while maintaining
support for older browsers.

- In `index.html` replace `` with the following HTML:

```html
<picture>
  <source type="image/webp" srcset="images/flower1.webp" />
  <source type="image/jpeg" srcset="images/flower1.jpg" />
</picture>
```

- Next, replace the `` tags for `flower2.jpg` and `flower3.png` with `<picture>` tags.

### ✔︎ Check-in

Once completed, the `<picture>` tags in `index.html` should look like this:

```html
<picture>
  <source type="image/webp" srcset="images/flower1.webp" />
  <source type="image/jpeg" srcset="images/flower1.jpg" />
</picture>
<picture>
  <source type="image/webp" srcset="images/flower2.webp" />
  <source type="image/jpeg" srcset="images/flower2.jpg" />
</picture>
<picture>
  <source type="image/webp" srcset="images/flower3.webp" />
  <source type="image/png" srcset="images/flower3.png" />
</picture>
```

Next, use Lighthouse to verify you've correctly implemented WebP images on the
site.

## Verify WebP usage with Lighthouse

Lighthouse's **Serve images in next-gen formats** performance audit can let you
know if all the images on your site are using next-gen formats like WebP.

1. To preview the site, press **View App** . Then press **Fullscreen** .
2. Press \`Control+Shift+J\` (or \`Command+Option+J\` on Mac) to open DevTools.
3. Click the **Lighthouse** tab.
4. Make sure the **Performance** checkbox is selected in the _Categories_ list.
5. Click the **Generate report** button.
6. Verify the **Serve images in next-gen formats** audit is passed.

Success! You are now serving WebP images on your site.
