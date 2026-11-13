---
source_url: https://web.dev/learn/css/paths-shapes-clipping-masking
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: 209d2bd293141a8c44a0ff934981aa320d1118804b76707699306b9d2bdeb37f
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

HTML rendering is built on top of the box model, but there's more to life (and web design) than rectangles. CSS supports multiple ways to change which areas of an element are rendered, giving developers freedom to create designs that support all shapes and sizes. Clipping allows for geometric shapes, while masking affects visibility at the pixel level.

## Paths and Shapes

<iframe src="https:///frame/learn/css/paths-shapes-clipping-masking/index_096c2dec3b031fee5c2aac4b474f814f0c3a49034a03102f350b390c2abe68bb.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

CSS uses functions to define shapes. We cover general information about functions in the [CSS Functions module](https://web.dev/learn/css/functions.md.txt). In this section, you'll learn how to create shapes in CSS. All of the following examples use the shapes you create with the `clip-path` property, which reduces the visible area to only what is inside the shape. This allows the elements to differ visually from the element's box. We cover clipping in more detail later on.

Shapes defined in CSS can be either basic shapes (such as circles, rectangles, and polygons) or paths (which can define complex and compound shapes).

### Basic shapes

#### `circle()` and `ellipse()`

The `circle()` and `ellipse()` functions define round and oval shapes with radii relative to an element. The `circle()` function accepts a single size or percentage as an argument. By default, both functions position the shape relative to the center of the element. Both accept an optional position following the `at` keyword, which can be expressed as lengths, percentages, or positional keywords.

```css
.my-element {
  width: 60px;
  height: 60px;
  background: blue;
  clip-path: circle(50%);
}
```

The preceding example shows a circular clipping path using the `circle()` function. Note that a radius of `50%` creates a circle the full width of the element. The `ellipse()` function accepts two arguments representing the horizontal and vertical radii of the shape.

```css
.my-element {
  width: 60px;
  height: 60px;
  background: blue;
  clip-path: ellipse(50% 25%);
}
```

The preceding example shows an elliptical clipping path using the `ellipse()` function. Note that a radius of 50% creates an ellipse the full width of the element. The following example displays the same ellipse positioned with its center at the top of the element.

```css
.my-element {
  width: 60px;
  height: 60px;
  background: blue;
  clip-path: ellipse(50% 25% at center top);
}
```

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/QwjrzZv?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen QwjrzZv by web-dot-dev on Codepen">
</iframe>

#### `rect()` and `inset()`

The `rect()` and `inset()` functions provide different ways to define a rectangle by setting the position of its sides relative to the sides of an element. This lets you create rectangles that visually differ from the element's default box. They optionally accept the `round` keyword to create a rectangle with rounded corners, using the same syntax as the `border-radius` shorthand property.

The `rect()` function defines the position of the top and bottom sides of the rectangle relative to the top edge of the element and the left and right sides relative to the left edge of the element. This function accepts four size or percentage units as arguments defining the top, right, bottom, and left sides. You might choose the `rect()` function when you want a rectangle that does not scale when the size of the element changes or one that keeps the same proportions as the element changes.

```css
.my-element {
  width: 80px;
  height: 60px;
  background: blue;
  clip-path: rect(15px 75px 45px 10px);
}
```

The preceding example shows a rectangular clipping path defined using the `rect()` function. The dimensions are relative to the top and left edges of the element as shown in the diagram.

The `inset()` function defines the position of the sides of a rectangle by the distance inward from each of the sides of an element. This function accepts one to four size or percentage units as arguments, allowing you to define multiple sides at once. You might choose the `inset()` function when you want a rectangle that scales with the element or a rectangle that has a fixed distance from the element's edges.

```css
.my-element {
  width: 80px;
  height: 60px;
  background: blue;
  clip-path: inset(15px 5px 15px 10px);
}
```

The preceding example shows a rectangular clipping path defined using the `inset()` function. The dimensions are relative to the sides of the element.

The `rect()` and `inset()` functions optionally accept the `round` keyword to create a rectangle with rounded corners, using the same syntax as the `border-radius` shorthand property. The following example demonstrates rounded versions of the rectangles shown previously.

```css
.rounded-rect {
  width: 80px;
  height: 60px;
  background: blue;
  clip-path: inset(15px 5px 15px 10px round 5px);
}

.rounded-inset {
  width: 80px;
  height: 60px;
  background: blue;
  clip-path: inset(15px 5px 15px 10px round 5px);
}
```

#### `polygon()`

For other shapes, such as triangles, pentagons, stars, etc., the `polygon()` function lets you create shapes by connecting multiple points with straight lines. The `polygon()` function accepts a list of pairs consisting of two length or percentage units. Each pair describes a point on the polygon: the first value is the distance from the left edge of the element, the second is the distance from the top edge of the element. You don't need to close the polygon, as it will be completed by connecting the last point with the first point.

```css
.my-element {
  width: 60px;
  height: 60px;
  background: blue;
  clip-path: polygon(50% 0, 0 100%, 100% 100%);
}
```

The preceding example creates a triangular clipping path by defining three points.

By default, the `polygon()` function renders overlapping areas as filled. You can change this behavior with an optional first argument called the fill rule. To alternate between filled and non-filled areas, set the fill rule to `evenodd`. To use the default fill rule, set it to `nonzero`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/vENjPmd?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen vENjPmd by web-dot-dev on Codepen">
</iframe>

The preceding example shows the `polygon()` function with trigonometric functions to create regular polygons and star shapes. This does not create the largest possible regular polygon that fits inside an element or center it--we'll leave that as an exercise for you to try. The star shapes in this example also demonstrate the `nonzero` and `evenodd` fill rules.

### Complex shapes

When the basic shape functions are not enough to describe a complex shape, CSS provides functions that use more sophisticated syntax to describe features such as curves and lines. These functions are also useful for compound shapes (shapes that are composed of multiple shapes, such as a circle with a hole in it).

#### `path()`

The `path()` function accepts a string of [SVG path syntax](https://developer.mozilla.org/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths) to describe a shape. This allows for complex shapes to be created using instructions that describe the lines and curves that make up the shape. Directly editing the SVG syntax can be complicated, so we recommend considering a dedicated visual editor that can export the syntax when creating shapes with the `path()` function.

The `path()` function does not use CSS sizing units and all values are interpreted as pixels. This means that shapes created with the path function are not responsive to the size of the element or container. We recommend using `path()` only for shapes that have fixed dimensions.

#### `shape()`

> [!NOTE]
> **Note:** the `shape()` function is not currently supported in Firefox.

The `shape()` function uses a command syntax to describe a shape, similar to the `path()` function. However, the `shape()` function commands are native CSS and can use CSS size units. This allows shapes defined using the `shape()` function to be sized responsively.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/NPGMJgJ?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen NPGMJgJ by web-dot-dev on Codepen">
</iframe>

The preceding example uses the `path()` and `shape()` functions to define a heart shape and a circle with a hole in the center. The example uses the same value in pixels for both functions, but the `shape()` functions could have used other CSS size units such as percentages or container relative units as well.

## Clipping

Clipping defines which areas of an element are visible, similar to clipping an image from a magazine. The `clip-path` property sets the path used to define the clip area.

As you saw in the examples in the earlier section, any of the basic shape or path functions can be used as the `clip-path`. The `clip-path` property also supports paths defined in an SVG `clipPath` element, which can be either embedded or in a separate file.

The preceding diagram shows how the addition of a `clip-path` to an image element changes the visible area of the image. The upper clip path uses the `circle()` function, while the lower uses an SVG `clipPath`. Note that the circle created using the `circle()` function is positioned centered on the element by default.

The `clip-path` property only accepts a single path. To clip an element with multiple shapes that don't overlap, use the `path()` or `shape()` functions to define a compound path, or use an SVG `clipPath`. Another option for complex scenarios is to use masking instead of clipping, which we cover in a later section.

### Clipping with shapes

To clip using a basic shape or path function, set the `clip-path` property to the value returned by the function, as in the preceding examples. Each function will position the clipping shape differently relative to the element, so refer to the reference for each function.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/ZYboPvb?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen ZYboPvb by web-dot-dev on Codepen">
</iframe>

In the preceding example two elements have a circular `clip-path` applied using the `.clipped` class. Note that the `clip-path` is positioned relative to each element and that the text within the `clip-path` does not reflow to follow the shape.

#### A clipping path's reference box

By default, the clipping path for an element includes the element's border. When using one of the basic shape functions, you can set the reference box of the clip-path to include only the area of the element within the border. Valid values for the reference box are `stroke-box` (the default) and `fill-box` (to include only the area inside the border).
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/qEOYvpj?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen qEOYvpj by web-dot-dev on Codepen">
</iframe>

The preceding example shows elements with a large (`20px` border), each using the `inset()` function to set the `clip-path`. The element that clips relative to the element's border still shows a portion of the border. The elements that clip relative to the area within the border don't show any border and are smaller, even with the same inset value.

### Clipping with graphics

A clipping path may be defined in an SVG document, either embedded in the HTML document or referenced externally. This can be useful to define complex clipping paths created in graphics programs or clipping paths that combine multiple shapes.

```html
<svg>
  <defs>
    <clipPath id="kitten-clip-shape">
      <circle cx="130" cy="175" r="100" />
    </clipPath>
  </defs>
</svg>

<style>
  #kitten {
    clip-path: url(#kitten-clip-shape);
  }
</style>
```

In the preceding example, the `clipPath` with an `id` of `kitten-clip-shape` is applied to the `` element. In this case the SVG document is embedded in the HTML. If the SVG document is an external file named `kitten-clipper.svg`, then the `clipPath` would instead be referenced as `url(kitten-clipper.svg#kitten-clip-shape)`.

## Masking

<iframe src="https:///frame/learn/css/paths-shapes-clipping-masking/index_f49c655e398f0a6b4209c0f989d815e620075cc07f1f2642a4e830885f839c24.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

Masking is another method for defining which areas of an element are shown or hidden. Where clipping uses basic shapes or paths, masking uses the pixels from an image or a gradient to determine the visibility. Unlike clipping, masking allows areas of an element to be partially transparent. Multiple mask images may be applied to an element to produce a variety of effects.

To apply a mask, set the `mask-image` property. This property accepts one or more images, gradients, or references to `<mask>` elements in an SVG document. Multiple mask images may be applied by separating them with commas.

```css
.my-element {
  mask-image: url(my-mask.png), linear-gradient(black 0%, transparent 100%);
}
```

In the preceding example, `.my-element` is masked using a PNG image, followed by a linear gradient. Multiple masks are added together by default, to create the final mask.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/xbwjBYd?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen xbwjBYd by web-dot-dev on Codepen">
</iframe>

The preceding example shows an image with one or more masks applied. Toggle each mask to see how the masks add together to produce the final effect.

### Alpha versus luminance masking

You can apply a mask using either the `alpha` or `luminance` of the image. When masking based on `alpha`, the transparency of each pixel in the mask image is applied to the element, ignoring any color information of that pixel. When masking based on `luminance`, both the transparency and the value of each pixel (how bright or dark) is applied to the element. Masking by luminance treats brighter colors as visible and darker colors as invisible.

To set the masking mode, use the `mask-mode` property. By default, the `mask-mode` property is set to `match-source`, which sets a mode based on the type of the mask image. For images and gradients, this will default to `alpha`. For SVG masks, this will default to either the value of the `<mask>` element's `mask-type` property or `luminance`, if there is no `mask-type` defined.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/gbazEzB?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen gbazEzB by web-dot-dev on Codepen">
</iframe>

In the preceding example a test pattern showing different color and alpha values is used as a mask. By toggling the `mask-mode`, you can see how `alpha` mode is based on transparency, while `luminance` mode is based on both color brightness and transparency.

### Additional masking properties

CSS provides additional properties to fine-tune the behavior of your masks. Each of the properties accepts a comma-separated list of values, which will be matched to the list of masks set by the `mask-image` property. If there are fewer values than masks, the list will repeat until a value has been set for each mask. If there are more values than masks, any excess values are discarded.

| Property         | Description                                                                                                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mask-clip`      | Sets which reference box of the element masks are applied to. Defaults to `border-box.`                                                                                                                                                                                       |
| `mask-composite` | Sets the interaction between masks when multiple masks are applied to the same element. Defaults to `add`.                                                                                                                                                                    |
| `mask-origin`    | Sets the reference box that acts as the origin of a mask. Defaults to `border-box`. This behaves similarly to `background-origin` and accepts the same keywords.                                                                                                              |
| `mask-position`  | Sets the position of a mask relative to the `mask-origin`. Accepts position keyword values such as `top` or `center`, percentages, size units, or values relative to a position keyword. This behaves similarly to `background-position` and accepts the same argument types. |
| `mask-repeat`    | Sets how a mask repeats if the masked element is larger than the mask. Defaults to `repeat`. This behaves similarly to `background-repeat` and accepts the same argument types.                                                                                               |
| `mask-size`      | Sets how a mask resizes relative to the size of the masked element. Defaults to `auto`. This behaves similarly to `background-size` and accepts the same argument types.                                                                                                      |

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/zxvjbyZ?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen zxvjbyZ by web-dot-dev on Codepen">
</iframe>

### The mask shorthand

You can set multiple mask properties at once with the mask shorthand. This can simplify setting multiple masks by grouping all of the properties of each mask together. The mask shorthand is equivalent to setting these properties in order: `mask-image`, `mask-mode`, `mask-position`, `mask-size`, `mask-repeat`, `mask-origin`, `mask-clip`, and `mask-composite`. Not every property needs to be included and any not included will be reset to their initial value. With support for up to eight properties per mask, it can help to have a [full reference](https://developer.mozilla.org/docs/Web/CSS/mask) available.

```css
.longhand {
  mask-image:
    linear-gradient(white, black), linear-gradient(90deg, black, transparent);
  mask-mode: luminance, alpha;
  mask-position:
    bottom left,
    top right;
  mask-size:
    50% 50%,
    30% 30%;
}

.shorthand {
  mask:
    linear-gradient(white, black) luminance bottom left / 50% 50%,
    linear-gradient(90deg, black, transparent) alpha top right / 30% 30%;
}
```

In the preceding example, each class has two masks applied. The first uses individual properties while the second uses the `mask` shorthand. Both styles are equivalent to each other.

## Flowing text around floated elements

<iframe src="https:///frame/learn/css/paths-shapes-clipping-masking/index_35abcfce0843dc05178bf7ff2c2e321f6abda0a5235c2d30e6bed0a8ce362a99.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

When you clip or mask an element, you are only changing the visible area within its box, but the box itself remains unchanged. This means that a floated element will affect the document flow based on its original bounding box, not the visible portions of the element. To define the flow around an element, use the `shape-outside` property along with the clip path.

The `shape-outside` property defines the shape that content will flow around an element. This shape may be any of the basic shape functions, but not shapes defined using the `path()` or `shape()` functions, or a `clipPath` defined in an SVG document.

The `shape-outside` property also accepts an image or gradient. As with masking, the shape's boundaries will be determined by the transparency of the image or gradient. The `shape-image-threshold` property sets which levels of transparency are considered inside the shape.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/xbwjBMX?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen xbwjBMX by web-dot-dev on Codepen">
</iframe>

## Shapes in animation

### Animating clip-path

You can animate the `clip-path` property, blending from shape to shape. You must use the same shape function for each keyframe to produce smooth animations. When using the `polygon()` or `shape()` functions, the same number of points must be used in each keyframe.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/YPyLgBj?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen YPyLgBj by web-dot-dev on Codepen">
</iframe>

In the preceding example, the `clip-path` of an element transitions between a pentagon and star shape defined using the `polygon()` function. The example uses the `evenodd` fill rule to show how the animating points create overlapping areas.

### Animating with offset-path

You can also animate elements along the paths created with these shape functions. The `offset-path` property sets the shape to use as the path, and the `offset-distance` sets the position along that path. You can also use the `ray()` function with the `offset-path` property to animate along a straight line.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/KwdREEd?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen KwdREEd by web-dot-dev on Codepen">
</iframe>

The preceding example demonstrates using the same polygon for both a `clip-path` and an `offset-path`. The animation uses `offset-distance` to move the smaller stars along the using the same polygon the large star uses as its `clip-path`.

## Check your understanding

Which of the following are valid shape functions?
`circle()` Correct! `square()` Incorrect. `hexagon()` Incorrect. `polygon()` Correct! `rectangle()` Incorrect. `inset()` Correct! True or false: Shapes defined with the `path()` function can be defined using percentages
True Incorrect. False Correct! True or false: Setting the clipping path of an element will not change the flow of text around an element
True Correct! False Incorrect. Which of the following can be used as a clipping path?
A basic shape Correct! An SVG `clipMask` element Correct! A bitmap image Incorrect. A gradient Incorrect. Which of the following can be used as a mask?
A bitmap image Correct! A gradient Correct! An SVG mask element Correct! A basic shape, like `circle()` or `rect()` Incorrect.
