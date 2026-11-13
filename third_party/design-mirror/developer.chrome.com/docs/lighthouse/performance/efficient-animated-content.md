---
source_url: https://developer.chrome.com/docs/lighthouse/performance/efficient-animated-content
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: 29aa5b69c25dd7e3020d061e25bd498c92f12b0a7b0f86ed769512600bc7fe21
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has moved into the [Improve image delivery](https://developer.chrome.com/docs/performance/insights/image-delivery.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

The Opportunities section of your Lighthouse report lists
all animated GIFs, along with estimated savings in seconds
achieved by converting these GIFs to video:

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## Why you should replace animated GIFs with video

Large GIFs are inefficient for delivering animated content.
By converting large GIFs to videos, you can save big on users' bandwidth.
Consider using MPEG4/WebM videos for animations and PNG/WebP
for static images instead of GIF to save network bytes.

## Create MPEG videos

There are a number of ways to convert GIFs to video.
[FFmpeg](https://ffmpeg.org/) is the tool used in this guide.
To use FFmpeg to convert the GIF, `my-animation.gif` to an MP4 video,
run the following command in your console:

`ffmpeg -i my-animation.gif my-animation.mp4`

This tells FFmpeg to take `my-animation.gif` as the input,
signified by the `-i` flag,
and to convert it to a video called `my-animation.mp4`.

## Create WebM videos

WebM videos are much smaller than MP4 videos,
but not all browsers support WebM, so it makes sense to generate both.

To use FFmpeg to convert `my-animation.gif` to a WebM video,
run the following command in your console:

`ffmpeg -i my-animation.gif -c vp9 -b:v 0 -crf 41 my-animation.webm`

## Replace the GIF image with a video

Animated GIFs have three key traits that a video needs to replicate:

- They play automatically.
- They loop continuously (usually, but it is possible to prevent looping).
- They're silent.

Luckily, you can recreate these behaviors using the `<video>` element.

```html
<video autoplay loop muted playsinline>
  <source src="my-animation.webm" type="video/webm" />
  <source src="my-animation.mp4" type="video/mp4" />
</video>
```

## Use a service that converts GIFs to HTML5 videos

Many [image CDNs](https://web.dev/articles/image-cdns) support GIF to HTML5 video conversion. You upload a
GIF to the image CDN, and the image CDN returns an HTML5 video.

## Stack-specific guidance

### AMP

For animated content, use
[`amp-anim`](https://amp.dev/documentation/components/amp-anim/) to minimize CPU
usage when the content is offscreen.

### Drupal

Consider uploading your GIF to a service that can make it available to embed as
a video.

## Resources

- [Source code for **Use video formats for animated content** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/efficient-animated-content.js)
- [Replace animated GIFs with video for faster page loads](https://web.dev/articles/replace-gifs-with-videos)
- [Replace GIFs with video codelab](https://web.dev/articles/codelab-replace-gifs-with-video)
