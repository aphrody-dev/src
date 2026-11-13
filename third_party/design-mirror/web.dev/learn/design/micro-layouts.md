---
source_url: https://web.dev/learn/design/micro-layouts
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: 194fc434ab01eb1277b944b2e9c71308175e3c69ca5fe9705be5c1df2c6e0b64
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
When we think of layouts, we often think of page-level designs.
But smaller components within the page can have their own self-contained layouts.

Ideally, these component-level layouts will adjust themselves automatically,
regardless of their position on the page.
There may be situations where you don't know if a component will be placed into the main content column or the sidebar or both.
Without knowing for sure where a component will end up,
you need to make sure that the component can adjust itself to its container.

> [!NOTE]
> **Note:** Creating components that can adapt to their container can be easier with [container queries](https://developer.mozilla.org/docs/Web/CSS/CSS_Container_Queries).

## Grid

[CSS grid](https://web.dev/learn/css/grid.md.txt) isn't just for page-level layouts.
It also works well for the components that live within them.

In this example, the `::before` and `::after`
[pseudo-elements](https://web.dev/learn/css/pseudo-elements.md.txt) create decorative lines on either
side of a heading. The heading itself is a grid container. The individual
elements are laid out so that the lines always fill the available space.

```css
h1 {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1em;
}
h1::before,
h1::after {
  content: "";
  border-top: 0.1em double black;
  align-self: center;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/rNzYvxm?height=200&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen rNzYvxm by web-dot-dev on Codepen"></iframe>   Desktop browsers like Firefox and Chrome have developer tools that can show you grid lines and areas overlaid on your design.

Learn how to [inspect grid layouts](https://developer.chrome.com/docs/devtools/css/grid) in Chrome DevTools.

## Flexbox

As the name suggests, you can use [flexbox](https://web.dev/learn/css/flexbox.md.txt) to make your
components flexible. You can declare which elements in your component should
have a minimum or maximum size and let the other elements flex to fit
accordingly.

In this example, the image takes up one quarter of the available space and the
text takes up the other three quarters.
But the image never gets larger than 200 pixels.

```css
.media {
  display: flex;
  align-items: center;
  gap: 1em;
}
.media-illustration {
  flex: 1;
  max-inline-size: 200px;
}
.media-content {
  flex: 3;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/qBXVYZo?height=300&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen qBXVYZo by web-dot-dev on Codepen"></iframe>   The developer tools in Firefox and Chrome can help you visualize the shape of your flexbox components.

Learn how to [inspect flexbox layouts](https://developer.chrome.com/docs/devtools/css/flexbox)
in Chrome DevTools.

## Container queries

Flexbox lets you design from the content out. You can specify the parameters of
your elements (how narrow they should get, how wide they should get) and let the
browser figure out the final implementation.

But the component itself has no awareness of its context.
It doesn't know if it's being used in the main content or in a sidebar.
This can make component layouts trickier than page layouts.
To be able to apply contextually relevant styles, your components need to know more than the size of the viewport they are inside.

With page layouts, you *do* know the width of the container because the
container is the browser viewport; media queries report the dimensions of the
page-level container.

To report the dimensions of any container, use
[container queries](https://developer.mozilla.org/docs/Web/CSS/CSS_Container_Queries).

To start, define which elements act as containers.

```css
main,
aside {
  container-type: inline-size;
}
```

This means that you want to query the inline dimension. For English-language
documents, that's the horizontal axis. You're going to change styles based on
the width of the container.

If a component is inside one of those containers, you can apply styles similarly
to how you apply media queries.

```css
.media-illustration {
  max-width: 200px;
  margin: auto;
}

@container (min-width: 25em) {
  .media {
    display: flex;
    align-items: center;
    gap: 1em;
  }

  .media-illustration {
    flex: 1;
  }

  .media-content {
    flex: 3;
  }
}
```

If a media object is inside a container that's narrower than `25em`, the flexbox
styles aren't applied. The image and text appear are ordered vertically.

But, if the containing element is wider than `25em`, the image and text appear
side-by-side.

With container queries, you can style components independently. You can write
rules based on the width of the containing element; the width of the
viewport no longer matters.

## Combine queries

You can use media queries for the page layout and container queries for the
components within the page.

Here the overall structure of the page has a `main` element and an `aside` element.
There are media objects within both elements.

```html
<body>
  <main>
     <div class="media">...</div>
     <div class="media">...</div>
  </main>
  <aside>
     <div class="media">...</div>
  </aside>
</body>
```

A media query applies a grid layout to the `main` and `aside` elements when the
viewport is wider than `45em`.

```css
@media (min-width: 45em) {
  body {
    display: grid;
    grid-template-columns: 3fr 1fr;
  }
}
```

The container query rule for the media objects remains the same:
only apply a horizontal flexbox layout if the containing element is wider than `25em`.

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/RwZjyRv?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen RwZjyRv by web-dot-dev on Codepen"></iframe>

Container queries are a game-changer for micro layouts.
Your components can be self-contained, independent of the browser viewport.

### Check your understanding

Test your knowledge of micro layouts.
Grid and flexbox are both useful for micro layouts?
True 🎉 Correct! False Incorrect. Grid and flexbox are both very useful, even for the 'tiniest' of layouts.

Previously, you learned about page-level macro layouts. Now you know about
component-level micro layouts.

Next, you'll go deeper into the very building blocks of your content and learn
how to make your images responsive. First, you'll learn about
[responsive typography](https://web.dev/learn/design/typography.md.txt).
