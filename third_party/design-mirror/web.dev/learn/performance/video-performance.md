---
source_url: https://web.dev/learn/performance/video-performance
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:04+00:00
sha256: 4bd6d5d918b02277482bc4d9d59f750648d16f41fbaa1e1daf66e987ef756889
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

In [the previous module](https://web.dev/learn/performance/image-performance.md.txt), you learned some performance techniques related to
images, which are a widely used resource type on the web that can consume
significant bandwidth if care is not taken to optimize them and take the user's
viewport into consideration.

However, images aren't the only media type commonly seen on the web. Videos are
another popular media type often used on web pages. Before looking at some of
the possible optimizations, it's important to first understand how the `<video>`
element works.

## Video source files

When working with media files, the file you recognize on your operating system
(`.mp4`, `.webm`, and others) is called a _container_ . A container contains one
or more _streams_. In most cases, this would be the video and audio stream.

You can compress each stream using a codec. For example, a `video.webm` could be
a [WebM](https://www.webmproject.org) container containing a video stream compressed using [VP9](https://en.wikipedia.org/wiki/VP9), and an audio
stream compressed using [Vorbis](https://en.wikipedia.org/wiki/Vorbis).

Understanding the difference between containers and codecs is helpful, because
it helps you to compress your media files using significantly less bandwidth,
which leads to lower overall page load times, as well as potentially improving a
page's [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp.md.txt), which is a [user-centric metric](https://web.dev/articles/user-centric-performance-metrics.md.txt) and
one of the three [Core Web Vitals](https://web.dev/articles/vitals.md.txt).

One way to compress video files involves using [FFmpeg](https://ffmpeg.org/):

```bash
ffmpeg -i input.mov output.webm
```

The preceding command---though as basic as it gets when using FFmpeg---takes the
`input.mov` file and outputs an `output.webm` file using the default FFmpeg
options. The preceding command outputs a smaller video file that works in all
modern browsers. Tweaking [the video](https://ffmpeg.org/ffmpeg.html#Video-Options) or [audio options FFmpeg offers](https://ffmpeg.org/ffmpeg.html#Audio-Options) could
help you to reduce a video's file size even further. For example, if you are
using a `<video>` element to replace a GIF, you should remove the audio track:

```bash
ffmpeg -i input.mov -an output.webm
```

> [!IMPORTANT]
> **Important:** The [`-an`](https://ffmpeg.org/ffmpeg.html#Audio-Options) flag removes all audio streams from the output file. This is an important optimization if the use case for your video doesn't require audio---for example, [where videos are used to replace
> animated GIFs](https://web.dev/articles/replace-gifs-with-videos)---as removing the audio stream reduces the size of the video file, even if the audio stream already present in the source video file is silent.

If you want to tweak things a bit further, FFmpeg offers the `-crf` flag when
compressing videos without using variable bitrate encoding. `-crf` stands for
**Constant Rate Factor**. This is a setting that adjusts the level of
compression, and does so by accepting an integer within a given range.

Codecs such as H.264 and VP9 support the `-crf` flag, but its use depends on
which codec you're using. For more info, read about [constant rate factor for
encoding videos in H.264](https://trac.ffmpeg.org/wiki/Encode/H.264#crf), as well as [constant quality when encoding videos in
VP9](https://trac.ffmpeg.org/wiki/Encode/VP9#constantq).

### Multiple formats

When working with video files, specifying multiple formats works as a fallback
for browsers that don't support all modern formats.

```html
<video>
  <source src="video.webm" type="video/webm" />
  <source src="video.mp4" type="video/mp4" />
</video>
```

Since [all modern browsers support the H.264 codec](https://caniuse.com/mpeg4), MP4 can be used as the
fallback for legacy browsers. The WebM version can use the newer [AV1 codec](https://en.wikipedia.org/wiki/AV1),
which is [not yet as widely supported](https://caniuse.com/av1), or the earlier VP9 codec, which is
[better supported than AV1](https://caniuse.com/webm), but typically doesn't compress as well as AV1.

> [!NOTE]
> **Note:** Similar to the `<picture>` element, the order in which you list the `<source>` child elements in the `<video>` element dictates the priority to the browser. If you specify an MP4 source first, then the browser selects that format regardless of its support for more efficient formats that may be specified.

## The `poster` attribute

A video's poster image is added using the [`poster` attribute](https://developer.mozilla.org/docs/Web/HTML/Element/video#attr-poster) on the `<video>`
element, which hints to users what the video contents may be before playback is
initiated:

```html
<video poster="poster.jpg">
  <source src="video.webm" type="video/webm" />
  <source src="video.mp4" type="video/mp4" />
</video>
```

> [!NOTE]
> **Note:** It used to be that a `<video>` element without a `poster` image was not a [LCP candidate](https://web.dev/articles/lcp.md.txt#what-elements-are-considered). [This
> issue](https://bugs.chromium.org/p/chromium/issues/detail?id=1289664) has since been resolved, and the first frame of a video file---once painted---will be considered as an LCP candidate. If your website makes significant use of video files, it's therefore important to either use the `poster` attribute if your videos don't autoplay, or ensure that video LCP candidates are optimized so that they display as soon as possible if the `poster` attribute isn't used.

## Autoplay

According to the HTTP Archive, [20% of videos](https://almanac.httparchive.org/en/2022/media#fig-37) across the web include the
`autoplay` attribute. `autoplay` is used when a video must be played
immediately---such as when used as a video background or as a [replacement for
animated GIFs](https://web.dev/articles/replace-gifs-with-videos).

Animated GIFs can be very large, especially if they have many frames with
intricate details. It's not uncommon for animated GIFs to consume several
megabytes of data, which can be a significant drain on bandwidth better spent
for more critical resources. You should generally avoid animated image formats,
as `<video>` equivalents are much more efficient for this type of media.

If autoplaying video is a requirement for your website, you can use the
`autoplay` attribute directly on the `<video>` element:

```html
<!-- This will automatically play a video, but
     it will loop continuously and be muted: -->
<video autoplay muted loop playsinline>
  <source src="video.webm" type="video/webm" />
  <source src="video.mp4" type="video/mp4" />
</video>
```

> [!CAUTION]
> **Caution:** `<video>` elements with the `autoplay` attribute specified begin downloading immediately, even if they are located outside of the initial viewport.

By combining the `poster` attribute with the [Intersection Observer API](https://developer.mozilla.org/docs/Web/API/Intersection_Observer_API) you can
configure your page to only [download videos once they are within the viewport](https://web.dev/articles/lazy-loading-video.md.txt#video-gif-replacement).
The `poster` image could be a low-quality image placeholder, such as the first
frame of the video. Once the video appears in the viewport, the browser begins
downloading the video. This could improve load times for content within the
initial viewport. On the downside, when using a `poster` image for `autoplay`,
your users receive an image that is shown only briefly until the video has
loaded and begins playing.

> [!NOTE]
> **Note:** Autoplaying video on page load can be an unpleasant experience for users---especially if the video contains an audio stream, which can be startling if the device volume is loud. Autoplay should only be used when necessary, and as the result of an anticipated need for the user. To minimize poor user experiences due to autoplaying videos, browsers have different criteria that make a video eligible to autoplay. For more details, see the autoplay policies for [Chrome](https://developer.chrome.com/blog/autoplay/) and [WebKit](https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/).

## User-initiated playback

Generally, the browser begins downloading a video file as soon as the HTML
parser discovers the `<video>` element. If you have `<video>` elements where the
user initiates playback, you probably don't want the video to begin downloading
until the user has interacted with it.

You can affect what is downloaded for video resources by using the `<video>`
element's [`preload`](https://developer.mozilla.org/docs/Web/HTML/Element/video#attr-preload) attribute:

- Setting `preload="none"` informs the browser that none of the video's contents should preloaded.
- Setting `preload="metadata"` only fetches video metadata, such as the video's duration and possibly other cursory information.

Setting `preload="none"` is likely the most desirable case if you're loading
videos that users need to initiate playback for.

> [!NOTE]
> **Note:** The `preload` attribute is a _hint_---the browser may opt not to obey it, and it may behave differently on different browsers or when comparing a mobile device to a desktop device.

You can improve the user experience in this case by adding a `poster` image.
This gives the user some context on what the video is about. Additionally, if
the poster image is your LCP element, you can increase the `poster` image's
priority using the `<link rel="preload">` hint along with
`fetchpriority="high"`:

```html
<link rel="preload" as="image" href="poster.jpg" fetchpriority="high" />
```

> [!NOTE]
> **Note:** If the video is not the largest element in the viewport, preloading the `poster` image may delay your LCP through bandwidth contention, where available bandwidth would otherwise be allocated to other more critical resources.

## Lazy-loading

A relatively new addition to Video performance is the `loading=lazy` attribute.
Similar to [Browser-level image lazy loading](https://web.dev/articles/browser-level-image-lazy-loading.md.txt)
and [the same for iframes](https://web.dev/articles/iframe-lazy-loading.md.txt), this attribute
brings the same to videos for their `poster` and `preload` downloads.

Using a `poster` attribute along with `preload="none"` or `preload="metadata"`
can already avoid downloading the video by default, the `loading=lazy` attribute
defers even downloading the poster image and metadata until the video is in or
approaching the viewport.

## Embeds

Given all the complexity in optimizing and serving video content efficiently,
it makes sense to want to offload the problem to dedicated video services such
as YouTube or Vimeo. Such services optimize the delivery of videos for you, but
embedding a video from a third party service can have its own sort of effect on
performance, as the embedded video players can often serve a lot of extra
resources, such as JavaScript.

Given this reality, third-party video embeds can significantly impact page
performance. According to the HTTP Archive, YouTube embeds block the main thread
for more than [1.7 seconds](https://almanac.httparchive.org/en/2022/third-parties#fig-8) for the median website. Blocking the main thread for
long periods of time is a serious user experience problem that can impact a
page's [Interaction to Next Paint (INP)](https://web.dev/articles/inp.md.txt). However, you can strike a compromise
by _not_ loading the embed immediately during the initial page load, and instead
create a placeholder for the embed that is replaced by the actual video embed
when the user interacts with it.

> [!IMPORTANT]
> **Important:** To learn about facades, read the [section
> on facades in the module that covers lazy loading images and
> `<iframe>` elements](https://web.dev/learn/performance/lazy-load-images-and-iframe-elements#facades).

## Video demos

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy" src="https://chrome.dev/f/learn_performance_video/?attributionHidden=true&amp;sidebarCollapsed=true&amp;previewSize=100" style="height: 100%; width: 100%; border: 0;" title="Learn Performance Video demo"></iframe>

## Test your knowledge

The order of `<source>` elements inside of a
parent `<video>` element does _not_ determine
which video resource is ultimately downloaded.
True. Try again. False. Correct!
The `<video>` element's `poster` attribute
is considered an LCP candidate.
True. Correct! False. Try again.

## Up next: Optimize web fonts

Next up in our coverage of optimizing specific resource types is fonts.
[Optimizing your website's fonts](https://web.dev/learn/performance/optimize-web-fonts.md.txt) is something that is often overlooked, but can
have a significant impact on your website's overall load speed, and metrics such
as LCP and [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls.md.txt).
