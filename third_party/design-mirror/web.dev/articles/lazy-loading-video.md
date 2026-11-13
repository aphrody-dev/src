---
source_url: https://web.dev/articles/lazy-loading-video
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: b41d638ff4e928c8bff4f4e9396f483dda69413175b2789235b9c7da85400450
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Jeremy Wagner [GitHub](https://github.com/malchata) [LinkedIn](https://www.linkedin.com/in/malchata) [Homepage](https://jlwagner.net/)  Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Published: August 16, 2019, Last updated: July 2, 2026

As with [image elements](https://web.dev/articles/lazy-loading-images), you may also want to lazy-load video. Videos are commonly loaded with the `<video>` element, though for videos hosted on other services such as YouTube they may use `<iframe>`s (in which case check out the article in [lazy-loading iframes](https://web.dev/articles/iframe-lazy-loading.md.txt)).

How to lazy-load `<video>` depends on the use case, as there are a couple of different solutions.

## Using the `loading` attribute

<iframe src="https:///frame/articles/lazy-loading-video/index_e9e8c9d93c8c900dcf9739c5623b534c69a5f80b9c1d0750b00f1c7d3c5511e5.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

Browsers have started to support the `loading` attribute on media elements (`<video>` and `<audio>`). Where supported this means both the media and any poster image are automatically lazy-loaded just by adding the `loading="lazy"` attribute:

```html
<video controls loading="lazy" preload="none" poster="one-does-not-simply-placeholder.jpg">
  <source src="one-does-not-simply.webm" type="video/webm">
  <source src="one-does-not-simply.mp4" type="video/mp4">
</video>
```

Using `loading="lazy"` will prevent the `poster` image from loading at all, until in or near the viewport, and then will use the `preload` attribute to decide how much of the `video` to load. This also means `autoplay` videos won't autoplay until in or near the viewport. The `loading="lazy"` attribute works with `poster`, `preload`, and `autoplay` attributes and does not replace the need for them.

Browsers that don't support `loading` attribute on media elements will ignore this attribute, which will result in the `poster` image loading immediately, and the video loading based on the `preload` attribute, which we will cover next.

## Use the `preload` attribute to lazy-load video that doesn't autoplay

Avoiding autoplaying videos is usually best practice as it leaves the control with the user. In these cases specifying the [`preload` attribute](https://developer.mozilla.org/docs/Web/HTML/Element/video#attr-preload) on the `<video>` element is the best way to avoid loading the whole video until needed:

```html
<video controls loading="lazy" preload="none" poster="one-does-not-simply-placeholder.jpg">
  <source src="one-does-not-simply.webm" type="video/webm">
  <source src="one-does-not-simply.mp4" type="video/mp4">
</video>
```

The previous example uses a `preload` attribute with a value of `none` to prevent browsers from preloading *any* video data, even when in the viewport. The `poster` attribute gives the `<video>` element a placeholder that will occupy the space while the video loads.

In most browsers `preload` defaults to `metadata` and a portion of the video is preloaded using the `Content-Range` header. This can result in more data being downloaded than desired---browsers cannot know what bytes the metadata is stored at, and it may not be stored at the beginning of the file. Therefore, the best chance of avoiding loading the video is with using `preload="none"`.

This can be further enhanced to preload the metadata when the user hovers the video with an `onmouseenter` attribute (or with the equivalent `mouseenter` event handler):

```html
<video controls
  loading="lazy"
  preload="none"
  poster="one-does-not-simply-placeholder.jpg"
  onmouseenter="event.target.setAttribute('preload','metadata')">
  <source src="one-does-not-simply.webm" type="video/webm">
  <source src="one-does-not-simply.mp4" type="video/mp4">
</video>
```

This not only reduces the delay when the user goes to play the video, but also shows the duration of the video as soon as they.

Videos can qualify as [LCP candidates](https://web.dev/articles/lcp.md.txt#what-elements-are-considered%22). A `poster` image will be quicker to load than the video so where this is an LCP candidate, you should use a poster image, but also [preload it](https://web.dev/articles/preload-critical-assets.md.txt) with a [`fetchpriority` attribute value of `"high"`](https://web.dev/articles/fetch-priority.md.txt#the_fetchpriority_attribute), since [at the time of writing you cannot specify the `fetchpriority` for poster attributes](https://github.com/whatwg/html/issues/10378):

```html
<link rel="preload" href="one-does-not-simply-placeholder.jpg" as="image" fetchpriority="high">
<video controls preload="none"
  poster="one-does-not-simply-placeholder.jpg"
  onmouseenter="event.target.setAttribute('preload','metadata')">
  <source src="one-does-not-simply.webm" type="video/webm">
  <source src="one-does-not-simply.mp4" type="video/mp4">
</video>
```

Videos that are LCP elements shouldn't use `loading="lazy"`---in the same way that [you shouldn't lazy load LCP images](https://web.dev/articles/browser-level-image-lazy-loading.md.txt#eager-load-first-images) videos.

## For video acting as an animated GIF replacement

Autoplaying videos are commonly used for GIF-style quick animations. While animated GIFs enjoy wide use, they're subpar to video equivalents in a number of ways, particularly in file size. Animated GIFs can stretch into the range of several megabytes of data. Videos of similar visual quality tend to be far smaller.

Using the `<video>` element as a replacement for animated GIF is not as straightforward as the `` element. Animated GIFs have three characteristics:

1. They play automatically when loaded.
2. They loop continuously ([though that's not always the case](https://davidwalsh.name/prevent-gif-loop)).
3. They don't have an audio track.

Achieving this with the `<video>` element looks something like this:

```html
<video autoplay muted loop playsinline>
  <source src="one-does-not-simply.webm" type="video/webm">
  <source src="one-does-not-simply.mp4" type="video/mp4">
</video>
```

The `loading="lazy"` attribute avoids loading the video until near the viewport. The `autoplay`, `muted`, and `loop` attributes are self-explanatory. [`playsinline` is necessary for autoplaying to occur in iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/).

Now you have a serviceable video-as-GIF replacement that works across platforms. But how to go about lazy loading it?

For browsers that support this the `loading="lazy"` is the easiest option:

```html
<video loading="lazy" autoplay muted loop playsinline>
  <source src="one-does-not-simply.webm" type="video/webm">
  <source src="one-does-not-simply.mp4" type="video/mp4">
</video>
```

To support lazy-loading of video in other browsers you need to use JavaScript and modify your `<video>` markup accordingly:

```html
<video class="lazy" preload="none" controls muted loop playsinline width="610" height="254" poster="one-does-not-simply.jpg">
  <source src="one-does-not-simply.webm" type="video/webm">
  <source src="one-does-not-simply.mp4" type="video/mp4">
</video>
```

You'll notice the removal of `autoplay`, and the addition of the `class="lazy"`, `preload="none"` and [`poster`](https://developer.mozilla.org/docs/Web/HTML/Element/video#attr-poster) attributes, which lets you specify a placeholder to occupy the `<video>` element's space until the video is lazy-loaded. Then, we use a JavaScript Intersection Observer to re-enabled the autoplaying:

```javascript
document.addEventListener("DOMContentLoaded", function() {
  var lazyVideos = [].slice.call(document.querySelectorAll("video.lazy"));

  if ("IntersectionObserver" in window) {
    var lazyVideoObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(video) {
        if (video.isIntersecting) {
          video.target.removeAttribute('preload');
          video.target.removeAttribute('controls');
          video.target.autoplay = true;
          video.target.classList.remove("lazy");
          lazyVideoObserver.unobserve(video.target);
        }
      });
    });

    lazyVideos.forEach(function(lazyVideo) {
      lazyVideoObserver.observe(lazyVideo);
    });
  }
});
```

Using this method, the video does not autoplay by default and only when the intersection observer detects the video as entering the viewport. Additionally, the `controls` attribute handles the cases when the JavaScript fails. Together this means you have a video solution that emulates animated GIF behavior, but doesn't incur the same intensive data usage as animated GIFs do, and you can lazy-load that content.

## Lazy loading libraries

The following libraries can help you to lazy-load video:

- [vanilla-lazyload](https://github.com/verlok/vanilla-lazyload) and [lozad.js](https://github.com/ApoorvSaxena/lozad.js) are super lightweight options that use Intersection Observer only. As such, they are highly performant, but will need to be polyfilled before you can use them on older browsers.
- If you need a React-specific lazy loading library, you might consider [react-lazyload](https://github.com/jasonslyvia/react-lazyload). While it doesn't use Intersection Observer, it *does* provide a familiar method of lazy loading images for those accustomed to developing applications with React.

Each of these lazy loading libraries is well documented, with plenty of markup patterns for your various lazy loading endeavors.

As the `loading` attribute for `<video>` becomes available in more browsers we expect JavaScript solutions (including libraries) to be used less in favor of the built-in solutions, except for those that want more control than that allows.
