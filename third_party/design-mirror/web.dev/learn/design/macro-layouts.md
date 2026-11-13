---
source_url: https://web.dev/learn/design/macro-layouts
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: 10b2c88088f0985a3a4781fd3f3a7224225adae26d258e78047795b029c31ee5
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Macro layouts describe the larger, page-wide organization of your interface.

Before applying any layout, you should make sure that the flow of your content makes sense.
This single column default ordering is what smaller screens will get.

```html
<body>
  <header>...</header>
  <main>
    <article>...</article>
    <aside>...</aside>
  </main>
  <footer>...</footer>
</body>
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/oNeePOX?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen oNeePOX by web-dot-dev on Codepen"></iframe>

When you arrange these individual page-level components, you're designing a macro layout: a high-level view of your page.
Using media queries, you can supply rules in CSS describing how this view should adjust to different screen sizes.

## Grid

[CSS grid](https://web.dev/learn/css/grid.md.txt) is an excellent tool for applying a layout to your page.
In the previous example, say you want a two-column layout once there's enough screen width available.
To apply this two-column layout once the browser is wide enough, use a media query to define the grid styles above a specified breakpoint.

```css
@media (min-width: 45em) {
  main {
    display: grid;
    grid-template-columns: 2fr 1fr;
  }
}
```

> [!NOTE]
> **Note:** While it would make more sense to specify `min-inline-size` instead of `min-width`, logical properties don't work in media queries yet.

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/vYJJzMK?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen vYJJzMK by web-dot-dev on Codepen"></iframe>

## Flexbox

For this specific layout, you could also use [flexbox](https://web.dev/learn/css/flexbox.md.txt).
The styles would look like this:

```css
@media (min-width: 45em) {
  main {
    display: flex;
    flex-direction: row;
  }

  main article {
    flex: 2;
  }

  main aside {
    flex: 1;
  }
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/gOxxdym?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen gOxxdym by web-dot-dev on Codepen"></iframe>

However, the flexbox version requires more CSS.
Each column has a separate rule to describe how much space it should take up.
In the grid example, that same information is encapsulated in one rule for the containing element.

## Do you need a media query?

You might not always need to use a media query.
Media queries work fine when you're applying changes to a few elements, but if the layout needs to be updated a lot, your media queries could get out of hand with lots of breakpoints.

Say you've got a page full of card components.
The cards are never wider than `15em`, and you want to put as many cards on one line as will fit.
You could write media queries with breakpoints like `30em`, `45em`, and `60em` but that's quite tedious and difficult to maintain.

Instead, you can apply rules so that the cards themselves automatically take up the right amount of space.

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15em, 1fr));
  grid-gap: 1em;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/QWMMVPm?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen QWMMVPm by web-dot-dev on Codepen"></iframe>

You can achieve a similar layout with flexbox.
In this case, if there are not enough cards to fill the final row, the remaining cards will stretch to fill the available space rather than lining up in columns.
If you want to line up rows and columns, then use grid.

```css
.cards {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1em;
}
.cards .card {
  flex-basis: 15em;
  flex-grow: 1;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/abyyaMg?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen abyyaMg by web-dot-dev on Codepen"></iframe>

By applying some smart rules in flexbox or grid, it's possible to design dynamic macro layouts with minimal CSS and without any media queries.
That's less work for you---you're making the browser do the calculations instead.
To see some examples of modern CSS layouts that are fluid without requiring media queries, see [1linelayouts.com](https://1linelayouts.glitch.me/).

### Check your understanding

Test your knowledge of macro layouts.
Which sentence best describes macro layouts?
Layouts that contain other layouts. Try again! Most layouts contain other layouts. When a design uses flexbox or grid. Try again! Neither flexbox or grid have anything specific to macro layouts. Low level layouts which cover small amounts of the screen. Try again! High level layouts which cover large amounts of the screen. 🎉 Macro layouts are foundational layouts for a page, spanning large amounts of visual area, and often are adjusted with page size media queries. Macro layouts always use media queries to adapt to different screen sizes?
True Try again! A macro layout is not defined by its usage of media queries. False 🎉 Macro layouts may adapt to fit content, fill available space, and more, without a media query.

Now that you've got some ideas for page-level macro layouts, turn your attention to the components within the page. This is the realm of [micro layouts](https://web.dev/learn/design/micro-layouts.md.txt).
