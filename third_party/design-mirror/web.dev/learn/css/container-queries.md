---
source_url: https://web.dev/learn/css/container-queries
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: b570f57d226d51c91a1ccb3f85c915c16fe2f9efc5eca3e69a5c926037cae1c4
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

With [media queries](https://web.dev/learn/design/media-queries.md.txt) you can adjust layouts based on the size of the viewport or the type of device being used. [Container queries](https://developer.mozilla.org/docs/Web/CSS/CSS_containment/Container_queries) allow you to make more specific adjustments to elements based on the size and state of their ancestors, or containers.

<iframe src="https:///frame/learn/css/container-queries/index_d4944f7b8a2fa9281042fbdeabb8d4d974b3486dcc2af5bd8a3d0c32d0c56356.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

Imagine you have a newsletter sign-up form that is meant to be used in several contexts on your site. You might want it to span the full width of the page on a signup page, but go into a split column on a page with other content.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/VYvXOve?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen VYvXOve by web-dot-dev on Codepen">
</iframe>

As shown in this demo, with container queries you can adjust the properties such as font-size, padding, and the layout of the element based on attributes of its nearest container, independent of the viewport size.

## Setting up a container query

Unlike media queries, container queries are established in two parts:

1. Define a container.
2. Write styles for a child element to be applied when a parent container matches the query's conditions.

### Defining a container

You can define a container by using the `container-type` property.

```css
.my-container-element {
  container-type: inline-size;
}
```

A `container-type` of `inline-size` lets you query the container's [inline axis](https://web.dev/learn/css/logical-properties.md.txt#inline_flow).

To query against both the `inline` and `block` axes, use `container-type: size`.

```css
main,
.my-component {
  container-type: size;
}
```

Both values of `container-type` apply different types of size containment. `Inline-size` containment on an element prevents its descendants from affecting its inline-size.

An element with `size` containment prevents its descendants from affecting its size in both the block and inline axes.

In this example you can see size containment can affect the element on which it is applied.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/bNVvyVY?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen bNVvyVY by web-dot-dev on Codepen">
</iframe>

Since it won't be sized based on the size of its children (the `<p>` element), the container will collapse unless given an explicit size by setting its dimensions (that is, `inline-size`, `block-size`, `aspect-ratio`) or placing it into an explicitly sized layout.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/MYaVdaP?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen MYaVdaP by web-dot-dev on Codepen">
</iframe>

### Container query conditions

Once a container is established, you can add a condition, wrapped in parentheses, that must be true for the styles inside of the container query to be applied. For container size queries, which are based on the dimensions of ancestor elements, the condition is made up of the following:

- a size feature: `width`, `height`, `inline-size`, `block-size`, `aspect-ratio`, or `orientation`,
- a comparison operator (that is, `>`, `<`, `=`, `>=`),
- and a length value.

```css
.my-container-element {
  container-type: inline-size;
}

@container (inline-size > 30em) {
  .my-child-element {
    /* styles to apply when .my-container-element is wider than 30em */
  }
}
```

Size feature conditions can also be written with a colon and a single value to test.

```css
@container (orientation: landscape) {
  /*...*/
}

@container (min-width: 300px) {
  /*...*/
}
```

You can also combine multiple conditions by using keywords like `and` and `or`, or chaining multiple conditions together with operators.

```css
@container (inline-size > 40em) and (orientation: landscape) {
  /*...*/
}

@container (height > 25vh) or (orientation: portrait) {
  /*...*/
}

@container ( 10em <= width <= 500px) {
  /*...*/
}
```

## Naming containers

To target specific containers, even if they are not the nearest ancestor, you can name containers with the `container-name` property. Then you can reference the container name you want to query before defining your conditions.

```css
.sidebar {
  container-name: main-sidebar;
  container-type: inline-size;
}

@container main-sidebar (inline-size > 20em) {
  .button-group {
    display: flex;
    padding-inline: 1.25em;
  }
}
```

The named container must still be an ancestor of the elements being styled.

## Use shorthand with the `container` property

The `container` property lets you use a shorthand syntax to both define a container and specify the container type.

```css
.sidebar {
  container: main-sidebar / inline-size;
}
```

The name of the container comes before the slash and the type of container comes after.

## Container query units

Within containers you also have access to container [relative length units](https://web.dev/learn/css/sizing.md.txt#container-relative_units). This provides more flexibility for components that can exist in different containers, since the relative lengths will adjust depending on the dimensions of the container.

Here the container length unit `cqi` (1% of a query container's inline size) is being used for the button's padding.

```css
.container {
  container: button-container / inline-size;
}

.one {
  inline-size: 30vw;
}

.two {
  inline-size: 50vw;
}

button {
  padding: 2cqi 5cqi;
}
```

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/LEpdoNV?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen LEpdoNV by web-dot-dev on Codepen">
</iframe>

Both buttons have the same relative units applied, but since the units are relative to the container's size, the second button has more padding due to its larger container.

## Nesting container queries

You can nest container queries inside of selectors.

```css
.my-element {
  display: grid;
  padding: 1em 2em;

  @container my-container (min-inline-size: 22em) {
    /* styles to apply when element's container is wider than 22em */
  }
}

/* equivalent to */
.my-element {
  display: grid;
  padding: 1em 2em;
}

@container my-container (min-inline-size: 22em) {
  .my-element {
    /* styles to apply when element's is wider than 22em */
  }
}
```

Or nest them inside of other container queries or at-rules.

```css
@container my-container (min-inline-size: 22em) {
  .my-element {
    /* styles to apply when element's is wider than 22em */
  }
}
```

```css
@layer base {
  @container my-container (min-inline-size: 22em) {
    .my-element {
      /* styles to apply */
    }
  }
}
```

## Check your understanding

Which size features can be used for container query conditions? (Mark all that apply)
`width` Correct! `block-size` Correct! `inline-size` Correct! `viewport-size` Incorrect. `viewport-size` is not a valid size feature for container queries. `height` Correct! With a container type of `inline-size`, you can query a container's `aspect-ratio`.
True Incorrect. A container type of `inline-size` cannot query the `aspect-ratio` of an element since `aspect-ratio` takes `block-size`, or `height`, into account. False Correct! You would need a `container-type` of `size` to query a container's aspect-ratio since it takes into account the both inline and block dimensions of a container. If you wanted to use a container relative unit based on the height of a container, which of the following could you choose?
`cqi` Incorrect. `cqi` is based on the logical inline-size of a container `cqq` Incorrect. `cqw` is based on the width of a container `cqb` Correct! `cqb` is based on the logical block-size of a container `cqvh` Incorrect. `cqvh` is not a valid CSS sizing unit `cqh` Correct! `cqh` is based on the height of a container
