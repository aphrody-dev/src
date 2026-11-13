---
source_url: https://web.dev/articles/baseline-in-action-image-gallery
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: e001918ef07f45634d6ebe7e5eae06b6ecfda04a7c7c1391e39a40ba4cba7d61
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Stacy Kvernmo [Bluesky](https://bsky.app/profile/stacykvernmo.com) [Homepage](https://oddbird.net/authors/stacy/)

Published: October 29, 2025

From image sharing sites to online stores, image galleries are a common pattern on the web. Images can be very data heavy, and loading images can make the page take a long time to load. In addition, users have high expectations around the usability of galleries, so it's common to add additional libraries that further increase page size.

The web platform has added support for many of the underlying pieces of an image gallery. So, what does it look like to code an image gallery with Baseline features? This demo showcases a variety of techniques that you can use to do just that.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/yyeEwJJ?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen yyeEwJJ by web-dot-dev on Codepen">
</iframe>

> [!NOTE]
> **Note:** This demo is also [available on GitHub](https://github.com/GoogleChromeLabs/baseline-demos/tree/main/src/image-gallery).

## How to deal with large image sizes

Images can be some of the largest assets you ask your users to download, and image galleries by their nature often have many images. This demo uses a couple of Baseline features to help reduce the performance impact on users.

### Lazy loading

Loading all of the images when the page loads can make the other content slower to load overall. It's a useful pattern to defer loading of images that aren't on the screen until they are on the screen.

But it's a balance---you don't want users to have to wait for images to load as they scroll. You want them to already be loaded when they scroll into view.

JavaScript libraries have made this possible in the past, and you could also roll your own with an IntersectionObserver. However, both options mean shipping more code, and leave more room for bugs.

Browsers have made this possible with an HTML-based progressive enhancement: By adding `loading="lazy"` to `` elements, the browser will defer loading those images until they are needed.

<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_0970153533b85366bf3d596e8f6a6a784912e4cdaa7b9ae2698d8b058005925e.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

If you have a sense of how many images will be seen on screens when the page is first loaded, you can set `loading="eager"` on the first few images, to make sure that those are loaded immediately. Because `loading="eager"` is the default, you can also just omit the attribute for those images.

If you view the Network panel in your browser's developer tools as you load the demo, only the first six will load immediately. Depending on your screen size and how many are visible, several others may be loaded. As you scroll, the browser will load the remaining images.

Lazy loading images works with more than just scrolling. If an image is initially hidden---for example, in a dialog---the image won't load until the dialog is opened. This would be useful in an image gallery if you are loading a larger image size when the user clicks on an image.

When you add lazy loading to your images, make sure that you are providing dimensions for the image. This prevents a layout shift if the image doesn't get loaded in time. In this demo, the inline size is determined by the grid definition, and the `aspect-ratio` CSS property on the image gallery grid items is set to `1 / 1`, so the block size matches that. You can also [set dimension attributes](https://web.dev/articles/browser-level-image-lazy-loading.md.txt#dimension-attributes) directly.

### AVIF

> [!NOTE]
> **Note:** To learn more about using images on the web, check out the [Learn Images course](https://web.dev/learn/images.md.txt).

While you want to show your users high resolution images, you likely don't want to show them the full resolution image, especially in the gallery of thumbnails. You'll want to either compress and resize your images before uploading to your server, or configure your server to resize images for you.

The AVIF file format is a relatively new format that can be an alternative to legacy formats such as JPEG and PNG, and is worth investigating for potential loading performance benefits.

<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_bf547c7eb797a0cdc12daf612a2c1aaae2aabe45f4488cbafc3188f4c4c7b5e1.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

Along with supporting animated images and transparency, AVIF can have lower file sizes than other image formats. The images in this demo were converted to AVIF from JPG, and are much smaller while retaining suitable image quality. AVIF also supports HDR images.

Online tools like [Squoosh](https://squoosh.app) and [Cloudinary](https://cloudinary.com/tools/image-to-avif) are useful for one-off conversions to AVIF if you're looking to experiment with the format. Design tools such as Photoshop (version 26+) and GIMP also export to AVIF. You can also incorporate AVIF encoding in your image
processing pipelines using [ImageMagick](https://imagemagick.org/script/formats.php/#supported).

## Lightbox effect

In an image gallery, users have the expectation that they can click an image to view a larger version. In the past, this often required `z-index` hacks, but now you can use the `<dialog>` element, which is Baseline Widely available. Built with accessibility in mind, the `<dialog>` element handles focus management more effectively, and requires less custom JavaScript.

<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_40afad7b4072ec4593e4cfd94c625600db5fa4abf94520feb00525d37543fbea.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

A dialog places your content in a new top layer, on top of everything else. To create the lightbox effect, you can use the `::backdrop` pseudo element. This is a styleable box below the dialog, but above the rest of the page. This all works without you needing to worry about the `z-index` of anything.

<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_39547b979e5af8192c61d5e818d9009621763388a2a3fe41b14c037e3e7cce38.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

### Transition the lightbox

By default, a dialog appears and disappears with no transition effects. Adding some slight transitions can make the experience feel more smooth, and help the user mentally transition. The demo uses `allow-discrete` transition behavior and `@starting-style` for the dialog to define the transition for the dialog.

<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_d1ce846b9770557fdeba887bbd55b445a18b6e694ebb58c9fbecc8cffce83a82.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>
<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_5c2f8ac66a3ab96469d525ce8a5b2f3c8a6d684526db8075a32066deee2347dc.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

## Style the button

### Backdrop filter

A common design pattern for image galleries is to place text on top of the image. This comes with the risk that the image won't provide sufficient contrast with the text, making the text difficult or impossible to read. One way of handling that is to add a semi-transparent background behind the text, but this doesn't always provide the needed effect. The `backdrop-filter` CSS property gives you more control over the effect.

<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_cd82dc3dc3293a284dfa9280de7532aaee1ae86b9a45c8e2b9c69e0e68189473.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

With `backdrop-filter`, you can combine color effects and blurs that apply to the content behind the `<dialog>` element. You can also use pseudo classes to update the filter when the button is hovered or focused.

```css
button {
  --btn-filter: blur(1em);
  backdrop-filter: var(--btn-filter);
  
  &:hover,
  &:focus {
    --btn-filter: blur(0.75em) saturate(350%);
  }
}
```

### Resolution media query

<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_242cab73cdedc26a18f7cc164f4a775bb582082ca138507ef036c5eb6ad6821c.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

The demo also uses a `resolution` media query to add a bit of extra polish. The button's top border is `1px`, which will serve as a default size, but you can choose to display a subpixel border on higher resolution screens.

```css
 @media (min-resolution: 2x) {
    --border-size: 0.5px;
  }
```

## Aspect ratio

<iframe src="https:///frame/articles/baseline-in-action-image-gallery/index_78645a768143a62b7fa429bfbb04031b475d19ee2d35652b6932fcda7ce73aaa.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

For the images to be displayed in a consistent size, you can set an aspect ratio. This works best when paired with `object-fit` to instruct the image how best to fill the space.

```css
[data-img] {
  aspect-ratio: 1 / 1;
  object-fit: cover;
}
```

The gallery example uses an aspect ratio of `1 / 1` meaning the width and height will be equal. The width comes from `grid-template-columns` which has a minimum size of `16em`, but can grow until there is enough room to add another column. The height then matches the width.

With an object-fit value of `cover`, this will ensure each image fills its container in both dimensions maintaining its intrinsic aspect ratio, and will be cropped if it's overflowing.

As you saw in the section on lazy loading images, this demo also uses `aspect-ratio` to make sure an image doesn't change dimensions when it loads, preventing a layout shift.

## Take it further

There are other Baseline features that you may want to incorporate into your image gallery. If you add navigation to the previous and next images from within the dialog, you may want to animate the change with [view transitions](https://web.dev/learn/css/view-transitions-spas.md.txt). If you have the ability to generate multiple sizes of the images, you can use [the `<picture>` element](https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/picture) to serve different resolutions of images on different screen sizes.

Baseline web features are making it possible to make a performant and usable image gallery with less code, and without relying on additional libraries. The next time you need to build an image gallery, you can use this demo as a pattern, or you can adopt pieces of it to enhance your current tools today.
