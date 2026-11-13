---
source_url: https://web.dev/learn/css/anchor-positioning
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: d4a2a1f096a076a73a6274a9b72f5ec07c39a516a454ffb579a7e21675f229af
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
When you're placing a tooltip or a drop-down menu, you often want to position it relative to another element on the page. While there have been ways using absolute positioning to achieve this effect, more complex requirements have historically resorted to positioning items using JavaScript.

CSS anchor positioning provides a way to declaratively position an element relative to another element.

<iframe src="https:///frame/learn/css/anchor-positioning/index_15b73af344fdb5ea97398e4d70a442c08d2b13e6f49fccb1ae778d294f096665.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

## Tethering elements

To make an element an anchor, you give it an `anchor-name` value of any string that starts with two dashes. This is the identifier that the positioned element will use to find its anchor, and it's helpful to give it a descriptive name. You can even give an element multiple anchor names, if it will be used as an anchor in different ways.

You will need to set a few properties on the positioned element so it can be tethered. First, you need to pull the element out of the document's flow, so that it floats, by setting `position: absolute` or `position: fixed`.

Next, you will need to set which anchor you want to tether to, by setting `position-anchor` to the anchor name you set on the anchor.

Finally, you'll need to set how to position the anchor. You'll learn more about `position-area` later in this module.

```css
#anchor {
   anchor-name: --my-anchor;
}

#positionedElement {
     position: absolute;
     position-anchor: --my-anchor;
     position-area: end;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/YPyLpeN?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen YPyLpeN by web-dot-dev on Codepen">
</iframe>

### Implicit tethers

[Popovers](https://web.dev/learn/css/popover-and-dialog.md.txt) are even simpler to tether. When you open a popover using a button with a `popovertarget` or by setting a `source` with `showPopover({source})`, the popover has an "implicit anchor" already set. Because a popover is already floating with `position: fixed` by default, to position a popover, all you need to do is set the position.

```css
#anchor{}

#positionedElement {
  position-area: end;
  margin: unset;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/azvGBKO?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen azvGBKO by web-dot-dev on Codepen">
</iframe>

> [!NOTE]
> **Note:** We also need to `unset` the popover's margin. By default, a popover's margin is `auto`, which impacts its positioning.

### Scoping the potential anchors

You may implement anchor positioning as part of a component, so that you can use a pattern like a drop-down menu in multiple places. If you are using the same `anchor-name` multiple times, how do you make sure that each positioned element finds the correct anchor?

JavaScript solutions involve adding unique IDs to each anchor, and then referring to that from the positioned element. This gets cumbersome, and CSS has a simpler solution with `anchor-scope`.

The `anchor-scope` property sets which anchor names will be matched only among an element and its descendants. It accepts a list of one or more anchor names or the keyword `all` to limit the scope of all defined anchor names.

An `anchor-scope` is ideally added to an ancestor of both the positioned element and anchor element that does not contain other anchor elements with the same name. Often, this is on the reusable component's root.

The following example shows the difference `anchor-scope` makes when applied to repeated elements with the same `anchor-name`. In the example, all of the `` elements and the image banners reference the `--image` anchor name. When `anchor-scope` is applied to the `<li>` elements, `position-anchor: --image` will match only the `` element within the same `<li>` element as the banner, otherwise it will match the last rendered ``.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/GgpdNBM?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen GgpdNBM by web-dot-dev on Codepen">
</iframe>

> [!NOTE]
> **Note:** The algorithm for finding an anchor is complex, but the key point is that the anchor has to be fully laid out before the positioned element. This means you can't tether to an element in a higher layer (like in a popover), or absolute positioned elements that are after the positioned element. If there are multiple anchors with the same anchor name, the winner will be the last one in the document that is already laid out.

## Positioning

Now that you've tethered the element to your anchor, it's time to position it. Anchor positioning provides two methods for positioning -- `position-area` and the `anchor()` function.

### `position-area`

The `position-area` property lets you position an element around the anchor by specifying one or two keywords. This covers many common use cases, and is often a good place to start.

#### How `position-area` works

`position-area` works by creating a new containing block for the positioned element in an area generated by the edges of the anchor and the positioned element's original containing block.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/yyYjVxw?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen yyYjVxw by web-dot-dev on Codepen">
</iframe>

> [!NOTE]
> **Note:** Because `position-area` creates a new containing block for the positioned element, if you use percentages for `padding` or `margin`, it will be a percentage of the new containing block.

While there are many keywords available for `position-area`, they can be broken down into a few categories to make them more understandable. [Anchor-tool.com](https://anchor-tool.com) is a great tool for exploring the syntax.

#### Physical keywords

You can use the physical keywords, `top`, `left`, `bottom`, `right`, and `center`. For example, `position-area: top right` will place the positioned element above and to the right of the anchor. These keywords also have physical axis equivalents, `y-start`, `x-start`, `y-end`, and `x-end`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/ZYboBqd?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen ZYboBqd by web-dot-dev on Codepen">
</iframe>

#### Logical keywords

You can also use logical keywords, `block-start`, `block-end`, `inline-start`, and `inline-end`. For example, `position-area: block-end inline-start` will place the positioned element beneath and to the left of the anchor in languages like English, or after the anchor on the block axis and before the anchor on the inline axis in the document's writing mode. `center` can also be used with a logical keyword.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/gbazLQo?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen gbazLQo by web-dot-dev on Codepen">
</iframe>

You can also omit the axis if you are specifying logical keywords, with the block axis first and the inline axis second. `position-area: start end` is the same as `position-area: block-start inline-end` or even `position-area: inline-end block-start`.

> [!NOTE]
> **Note:** Logical properties position an element based on the writing mode of its containing block. If you want to use the positioned element's own writing mode, you can add the `self` modifier, for example with `self-block-start` instead of `block-start`.

#### Spanning multiple grid areas

So far, you may have noticed that these options only allow you to place the positioned element within a single grid space. Adding the `span` prefix to physical or logical properties adds the adjacent center grid space. `position-area: span-top right` will be positioned to the right of the anchor, and from the anchor's bottom to the top of the positioned element's original containing block.

A common position-area for a drop-down menu is `position-area: block-end span-inline-end`.

The `span-all` keyword spans 3 rows or columns.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/ZYboBVg?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen ZYboBVg by web-dot-dev on Codepen">
</iframe>

#### Single keyword

If you only set one keyword, the other axis is set automatically. This largely works as you would expect it to work, but it may be useful to understand how it works.

If the provided keyword is clear about its axis, the other axis is computed as `span-all`. This means that `position-area: bottom` is equivalent to `position-area: bottom span-all`, and the positioned element will be below the anchor, and have the entire width of the containing block available.

On the other hand, if the keyword doesn't clearly indicate an axis, it is repeated. `position-area: start` is equivalent to `start start`, and is placed at the top left of the anchor in left to right languages.

## The `anchor()` function

For more advanced use cases, `position-area` may not meet your requirements. The `anchor()` function lets you set individual inset properties based on the position of another element. This resolves to a [CSS length](https://web.dev/learn/css/sizing.md.txt#dimensions_and_lengths), meaning you can use it in calculations and with other CSS functions. In addition, you can also tether different sides to different anchors.

The `anchor()` function takes an anchor name and an anchor side. If your element has a default anchor, either set with `position-anchor` or implicitly, for example with a popover, you can omit the anchor name.

```css
.positionedElement {
  block-start: anchor(--my-anchor start);
  /*  OR  */
  position-anchor: --my-anchor;
  block-start: anchor(start);
}
```

### Fallback values

If an anchor can't be found for an `anchor()` function, the entire declaration will be invalid. This might happen if the anchor is rendered after the positioned element, or if there isn't an element with matching `anchor-name`. To handle this, you can set a fallback length or percentage.

```css
.positionedElement {
   block-start: anchor(--my-anchor, 100px)
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/VYvxmRb?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen VYvxmRb by web-dot-dev on Codepen">
</iframe>

In the preceding example, the positioned element's left value is anchored to `--focused-anchor`, but that `anchor-name` only exists when the first button is hovered or focused. Because an `anchor()` function resolves to a length, you can use another anchor as a fallback. If we didn't provide a fallback, the positioned element wouldn't be positioned.

### Anchor side keywords

The anchor side value chooses which of the anchor's edges to position against. Similar to `position-area`, the anchor side value supports several different types of syntax.

| Type | Values | Description |
|---|---|---|
| Physical | `top`, `left`, `bottom`, `right` | Physical keywords correspond to a specific side of the anchor, but can only be used on the same axis as the positioned element's inset that you are setting. For example, `top: anchor(bottom)` positions the element's top at the anchor's bottom, but `left: anchor(top)` won't work. |
| Side | `inside`, `outside` | The `inside` keyword corresponds to the same side as the inset property, and the `outside` keyword corresponds to the opposite side on the same axis. For example, `inset-block-start: anchor(inside)` refers to the `block-start` side of the anchor, and `inset-inline-end: (outside)` refers to the `inline-start` side of the anchor. |
| Logical | `start`, `end`, `self-start`, `self-end` | Logical keywords refer to the anchor's sides based on the writing mode of the positioned element with `self-start` and `self-end`, or with the writing mode of the positioned element's containing block with `start` and `end`. |
| Percentage | 0% - 100% | A percentage value places the positioned element along the axis from the anchor's start to end on the specified axis. `0%` is at the anchor's `start` side, and `100%` is the anchor's end side. `center` is equivalent to `50%`. If you are using a percentage on an end-side inset like `bottom`, this is not reversed---`0%` is still the anchor's `start` side. |

This example shows how a percentage value always goes from the start to the end on the specified axis:
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/yyYjgVL?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen yyYjgVL by web-dot-dev on Codepen">
</iframe>

### Using `anchor()`

Because `anchor()` is a length, it's very flexible. You can manipulate the value with CSS functions like `max()` and `calc()`.

One limitation is that you are only able to use `anchor()` functions on inset properties.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/bNVMgBZ?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen bNVMgBZ by web-dot-dev on Codepen">
</iframe>

The preceding example adds a background behind the open details panel that animates smoothly when a different panel is opened, and stretches to include a hovered details panel. To accomplish this, it uses `min()` to pick the smaller length between two anchors.

```css
#indicator{
/*  Use the smaller of the 2 values:  */
  inset-block-start: min(
/*   1. The start side of the default anchor, which is the open `<details>` element  */
    anchor(start),
/*   2. The start side of the hovered `<details>` element.    */
    anchor(--hovered start,
/*     If no `<details>` element is hovered, this falls back to infinity px, so that the other value is smaller, and therefore used.   */
       var(calc(1px * infinity)))
  );
}
```

The example also uses `calc()` to add inline space around the open panel.

## Using the anchor's size

You can also use the `anchor-size()` function to use the anchor's dimensions for your positioned element's size, position or margin.

`anchor-size()` takes an anchor name, or uses the default anchor. By default, it will use the size of the anchor on the axis that it is being used, so `width: anchor-size()` will return the anchor's width. You can also use the other axis by specifying which length you want, with the physical keywords `width` and `height` or the logical keywords `block`, `inline`, `self-block` and `self-inline`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/xbwjgqq?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen xbwjgqq by web-dot-dev on Codepen">
</iframe>

## Handling overflow

You've made a drop-down menu component, and used anchor positioning to place the drop-down menu where you want it to go. But then you move the menu over to the other side of the screen, or use it for a user menu, and the user's name is extra long. Suddenly, your drop-down is off the screen. Now what?

CSS anchor positioning has a built-in system that allows you quickly build a robust set of fallbacks when your positioned element ends up outside of its containing block.

### Fallback options

The `position-try-fallbacks` rule takes a list of fallback options. When the default position overflows, each option will be tried in order until there is a position that doesn't overflow.

You can use any `position-area` value as a fallback option. In this example, in left-to-right writing modes like English, the positioned element will try to be positioned at the bottom of the anchor, spanning the center and right columns. If that overflows, it will try to be positioned at the bottom of the anchor, spanning the left and center columns. If that overflows as well, the position will revert back to the default position, even though that overflows.

```css
.positioned-element {
  position-area: block-end span-inline-end;
  position-try-fallbacks: block-end span-inline-start;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/vENjgmj?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen vENjgmj by web-dot-dev on Codepen">
</iframe>

There are also several `flip-` keywords that handle common fallback cases. `flip-block` and `flip-inline` try flipping the element over the block and inline axes. They can also be combined with `flip-block flip-inline` to flip over both axes. The `flip-start` value flips the positioned element over a diagonal line from the start to the end corners of the anchor.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/Qwjrdve?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen Qwjrdve by web-dot-dev on Codepen">
</iframe>

You can also create a custom fallback option with `@position-try`---this lets you set the margins, alignment, and even change the anchor.

```css
@position-try --menu-below {
  position-area: bottom span-right;
  margin-top: 1em;
}

#positioned-element {
  position-try: --menu-below;
}
```

`flip-block` and `flip-inline` can be added to `@position-try` fallback options to create a variant.

```css
#positioned-element {
  position-try: --menu-below, flip-inline --menu-below;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/PwPeWjx?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen PwPeWjx by web-dot-dev on Codepen">
</iframe>

In the preceding example, the browser follows these steps, stopping as soon as it finds a solution that doesn't overflow.

1. The element is placed with `position-area: end`, at the bottom right of the anchor.
2. If that overflows, the element is placed with the custom fallback option named `--bottom-span-right`, which places it with `position-area: bottom span-right`, with an additional margin beneath.
3. If that overflows, the element is placed with `flip-inline --bottom-span-right`, which combines the custom fallback option with `flip-inline`, which is essentially `position-area: bottom span-left`.
4. If that overflows, the element is placed using the `--use-alternate` custom fallback option, which places it below a completely different anchor.
5. If that overflows, the element reverts to its original placement, with `position-area: end`, even though that is known to overflow.

### Fallback order

By default, when the initial position overflows, the browser will try each option in `position-try-fallbacks` until a position is found that doesn't overflow. You can override this behavior with `position-try-order` to test each fallback option, and use the one that has the most space on a specified axis.

You can specify the axis with either the logical keywords, `most-block-size` and `most-inline-size`, or with the physical keywords `most-height` and `most-width`.

`position-try-order` and `position-try-fallbacks` can be combined with the `position-try` shorthand, with the order coming first.

## Scrolling

When a user scrolls, they expect the page to move fluidly. To accomplish this, browsers have limits on how anchor positioning can be used when scrolling.

While you can tether a positioned element to anchors in different scroll containers, the element will only move in response to one of the anchors scrolling. This will be the default anchor, which is either the implicit anchor from a popover, or the value of `position-anchor`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/YPyLNEL?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen YPyLNEL by web-dot-dev on Codepen">
</iframe>

You'll note that the positioned element stays visible even as the anchor is scrolled out of view. To hide the positioned element when the anchor is hidden, set `position-visibility: anchors-visible`. This not only applies to when the anchor is overscrolled, but also if it is hidden in other ways, for example with `visibility: hidden`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/jEbxyYO?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen jEbxyYO by web-dot-dev on Codepen">
</iframe>

## Check your understanding

Which are valid values for the side in `anchor()`?
`inside` Correct! `25%` Correct! `25px` Incorrect. While a length like `25px` can be used as the fallback value, only percentages can be used for the side. `block-start` Incorrect `start` Correct! Which are valid values for `position-area`?
`top` Correct! `block-end inline-end` Correct! `block-start block-end` Incorrect. You can only define a single column or row on each axis. Which properties support the `anchor()` function?
`top` Correct! `margin-left` Incorrect. `inset-block-start` Correct! `transform` Incorrect. If there are multiple anchors with the same `anchor-name`, what happens?
The positioned element is duplicated and tethered to each match. Incorrect. The positioned element is tethered to the first in the document. Incorrect. The positioned element is tethered to the last in the document. Correct! The positioned element is tethered to the closest anchor. Incorrect.
