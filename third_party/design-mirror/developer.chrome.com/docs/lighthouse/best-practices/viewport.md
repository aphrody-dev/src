---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/viewport
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:25+00:00
sha256: e9ca79c52fa989cf2d82c9179b14346eba16d2618b98deac9334f80f671290ec
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has moved into the [Optimize viewport for mobile](https://developer.chrome.com/docs/performance/insights/viewport.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

Without a [viewport meta tag](https://developer.mozilla.org/docs/Web/HTML/Viewport_meta_tag),
mobile devices render pages at typical desktop screen widths and then scale the
pages down, making them difficult to read.

Setting the viewport meta tag lets you control the
width and scaling of the viewport so that it's sized correctly on all devices.

## How the Lighthouse viewport meta tag audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages
without a viewport meta tag:

A page fails the audit unless all of these conditions are met:
- The document's `<head>` contains a `<meta name="viewport">` tag.
- The viewport meta tag contains a `content` attribute.
- The `content` attribute's value includes the text `width=`.

## How to add a viewport meta tag

Add a viewport `<meta>` tag with the appropriate key-value pairs to the `<head>`
of your page:

    <!DOCTYPE html>
    <html lang="en">
      <head>
        ...
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ...
      </head>
      ...

Here's what each key-value pair does:
- `width=device-width` sets the width of the viewport to the width of the device.
- `initial-scale=1` sets the initial zoom level when the user visits the page.

## Initial-scale of less than 1

Where the `initial-scale` is set to less than 1, this can cause browsers to enable a [double tap to zoom feature](https://developer.chrome.com/blog/300ms-tap-delay-gone-away.md.txt), typically used for desktop sites that are not mobile optimized. This adds a 300 millisecond delay to any tap interactions while the browser waits to check if a second "double" tap happens. The audit therefore also fails when the initial-scale is set to less than 1.

## Resources

- [Source code for **Has a `<meta name="viewport">` tag with `width` or `initial-scale`** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/viewport.js)
- [Responsive Web Design Basics](https://web.dev/responsive-web-design-basics#viewport)
- [Using the viewport meta tag to control layout on mobile browsers](https://developer.mozilla.org/docs/Web/HTML/Viewport_meta_tag)
