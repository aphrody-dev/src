---
source_url: https://web.dev/learn/design/picture-element
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: 71ff28a006fe53b9f27a5e0cc5d623582216351b4d960e9bb11a008ab9b42609
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
[The previous module](https://web.dev/learn/design/responsive-images.md.txt) demonstrated how the `srcset` attribute lets you provide different-sized versions of the same image. The browser can then decide which is the right version to use. If you want to change the image completely, you'll need the [`picture`](https://developer.mozilla.org/docs/Web/HTML/Element/picture) element.

In the same way that `srcset` builds upon the `src` attribute, the `picture` element builds upon the `img` element. The `picture` element wraps around an `img` element.

```html
<picture>
  
</picture>
```

If there is no `img` element nested inside the `picture` element, the `picture` element won't work.

Like the `srcset` attribute, the `picture` element will update the value of the `src` attribute in that `img` element. The difference is that where the `srcset` attribute gives suggestions to the browser, the `picture` element gives commands. This gives you control.

## `source`

You can specify multiple `source` elements inside a `picture` element, each one with its own `srcset` attribute. The browser then executes the first one that it can.

## Image formats

In this example, there are three different images in three different formats:

    <picture>
      <source srcset="image.avif" type="image/avif">
      <source srcset="image.webp" type="image/webp">
      
    </picture>

The first `source` element points to an image in [the new AVIF format](https://web.dev/articles/compress-images-avif.md.txt). If the browser is capable of rendering AVIF images, then that's the image file it chooses. Otherwise, it moves on to the next `source` element.

The second `source` element points to an image in [the WebP format](https://web.dev/articles/serve-images-webp.md.txt). If the browser is capable of rendering WebP images, it will use that image file.

Otherwise the browser will fall back to the image file in the `src` attribute of the `img` element. That image is a JPEG.

This means you can start using new image formats without sacrificing backward compatibility.

In that example, the `type` attribute told the browser which kind of image format was specified.

## Image sizes

As well as switching between image formats, you can switch between image sizes. Use the `media` attribute to tell the browser how wide the image will be displayed. Put a media query inside the `media` attribute.

    <picture>
      <source srcset="large.png" media="(min-width: 75em)">
      <source srcset="medium.png" media="(min-width: 40em)">
      
    </picture>

Here you're telling the browser that if the viewport width is wider than `75em` it must use the large image. Between `40em` and `75em` the browser must use the medium image. Below `40em` the browser must use the small image.

This is different to using the `srcset` and `sizes` attributes on the `img` element. In that case you're providing suggestions to the browser. The `source` element is more like a command than a suggestion.

You can also use the pixel density descriptor inside the `srcset` attribute of a `source` element.

    <picture>
      <source srcset="large.png 1x" media="(min-width: 75em)">
      <source srcset="medium.png 1x, large.png 2x" media="(min-width: 40em)">
      
    </picture>

In that example you're still telling the browser what to do at different breakpoints, but now the browser has the option to choose the most appropriate image for the device's pixel density.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/PoJYrNB?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen PoJYrNB by web-dot-dev on Codepen"></iframe>

## Cropping

If you only need to serve differently sized versions of the same image, `srcset` is your best option. But if an image doesn't look good at smaller sizes, you can try making a cropped version of the image instead.

The different images might have different width and height ratios to suit their context better. For example, on a mobile browser you may want to serve a crop that's narrow and tall, whereas on a desktop browser, you might want to serve a crop that's wide and short.

Here's an example of a hero image that changes its contents and its shape based on the viewport width. Add `width` and `height` attributes to each `source` element.

    <picture>
      <source srcset="full.jpg" media="(min-width: 75em)" width="1200" height="500">
      <source srcset="regular.jpg" media="(min-width: 50em)" width="800" height="400">
      
    </picture>

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/eYGOwzp?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen eYGOwzp by web-dot-dev on Codepen"></iframe>

Remember that you can't change the `alt` attribute depending on the image source. You'll need to write an `alt` attribute that describes both the full size image and the cropped image.

You probably won't need to use the `picture` element for most of your responsive images---the `srcset` and `sizes` attributes on the `img` element cover a lot of use cases. But for those situations when you need more fine-grained control, the `picture` element is a powerful tool.

There's one kind of image where you might not need either solution: icons. [That's what's next](https://web.dev/learn/design/icons.md.txt).

### Check your understanding

Test your knowledge of the picture element
Where the `srcset` attribute gives ________ to the browser, the `<picture>` element gives ________.
suggestions, commands The picture element provides control, making it great for art direction. commands, suggestions Oops, you got it backwards. Some capabilities of the `<picture>` element are:
Alternative cropping eg: landscape images or portrait images depending on the viewport. Alternative formats eg: smaller and easier to download `avif` or `webp` files if possible. Alternative sizes eg: larger images for larger monitors. Alternative densities eg: providing rich pixel quality for HD screens. Alternative ratios Picture element does not have ratio features.
