---
source_url: https://web.dev/articles/accent-color
fetched: 2026-11-13
lastmod: 2026-11-12T22:02:34+00:00
sha256: 5d1c4c28e63313444a1ffdc99feb8c6c6f60ece0992722a10c0e16508cf347b2
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Bring your brand color to built-in HTML form inputs with one line of code.

Adam Argyle [X](https://twitter.com/argyleink) [GitHub](https://github.com/argyleink) [Homepage](https://nerdy.dev) Joey Arhar [X](https://twitter.com/josepharhar) [GitHub](https://github.com/josepharhar)

Published: August 11, 2021

Today's HTML form elements are [difficult to
customize](https://codepen.io/GeoffreyCrofte/pen/BiHzp). It feels as if it's
a choice between few or no custom styles, or resetting input styles and
build it up from scratch. Building it up from scratch ends up being much more
work than anticipated. It can also lead to forgotten styles for element states
([indeterminate](https://developer.mozilla.org/docs/Web/CSS/:indeterminate),
I'm looking at you), and the loss of built-in accessibility features.
To fully recreate what the browser provides may be more
work than you're looking to take on.

<iframe src="https:///frame/articles/accent-color/index_ccf3d9b771a8961af24f05cbfd69d44cc8b5335225512253b9a43ef64ae050cc.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

```css
accent-color: hotpink;
```

CSS `accent-color` from the [CSS UI
specification](https://www.w3.org/TR/css-ui-4/#widget-accent) is here to tint
elements with one line of CSS, saving you from customization efforts by
providing a way to bring your brand into elements.
[Demo](https://codepen.io/web-dot-dev/pen/PomBZdy)

The `accent-color` property also works with
[`color-scheme`](https://web.dev/articles/color-scheme.md.txt), allowing authors to tint both
the light and dark elements.
In the following example the user has a dark theme active, the page uses
`color-scheme: light dark`, and uses the same `accent-color: hotpink` for dark
themed hotpink tinted controls.
[Demo](https://codepen.io/web-dot-dev/pen/PomBZdy)

## Supported elements

Currently, only four elements will tint via the `accent-color` property:
[checkbox](https://web.dev/articles/accent-color.md.txt#checkbox), [radio](https://web.dev/articles/accent-color.md.txt#radio), [range](https://web.dev/articles/accent-color.md.txt#range) and
[progress](https://web.dev/articles/accent-color.md.txt#progress). Each can be previewed here
<https://accent-color.glitch.me> in light and
dark color schemes.

> [!WARNING]
> **Warning:** If the following demo elements are all the same color, then your browser doesn't support `accent-color` yet.

### Checkbox

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/dyWjGqZ?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen dyWjGqZ by web-dot-dev on Codepen"></iframe>

### Radio

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/WNjKrgB?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen WNjKrgB by web-dot-dev on Codepen"></iframe>

### Range

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/yLbqeRy?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen yLbqeRy by web-dot-dev on Codepen"></iframe>

### Progress

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/rNmrxqL?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen rNmrxqL by web-dot-dev on Codepen"></iframe>

## Guaranteeing contrast

To prevent inaccessible elements from existing, browsers with `accent-color`
need to determine an [eligible contrast
color](https://webaim.org/articles/contrast/) to be used alongside the custom
accent. Below is a screenshot demonstrating how Chrome 94 (left) and Firefox 92
Nightly (right) differ in their algorithms:

The most important thing to take away from this, is to **trust the browser**.
Provide a brand color, and trust that it will make smart decisions for you.

> [!NOTE]
> **Note:** The browser will not change your color in a dark theme.

## Extra: More tinting

You may be wondering how to tint more than these four form elements? Here's a
minimal sandbox which tints:

- the focus ring
- text selection highlights
- list [markers](https://web.dev/articles/css-marker-pseudo-element.md.txt)
- arrow indicators (Webkit only)
- scrollbar thumb (Firefox only)

```css
html {
  --brand: hotpink;
  scrollbar-color: hotpink Canvas;
}

:root {
  accent-color: var(--brand);
}
:focus-visible {
  outline-color: var(--brand);
}
::selection {
  background-color: var(--brand);
}
::marker {
  color: var(--brand);
}

:is(
  ::-webkit-calendar-picker-indicator,
  ::-webkit-clear-button,
  ::-webkit-inner-spin-button,
  ::-webkit-outer-spin-button
) {
  color: var(--brand);
}
```

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/RwVBreJ?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen RwVBreJ by web-dot-dev on Codepen"></iframe>

### Potential future

The spec does not limit the application of `accent-color` to the four elements
shown in this article, more support could be added later. Elements like the
selected `<option>` in a `<select>` could be highlighted with the
`accent-color`.

What else do you like to tint on the web? Tweet
[@argyleink](https://twitter.com/argyleink) with your selector and it might get
added to this article!
