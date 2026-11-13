---
source_url: https://web.dev/learn/css/counters
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:46+00:00
sha256: a44db97b6f3e91f5247704ea24530eb5bb1eebd467739384fbed8964749f3ada
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Many types of content are best represented as an HTML [list](https://web.dev/learn/html/lists.md.txt). For ordered list content, like recipe steps or footnotes for an article, the marker often contains information as well. CSS provides several ways to control the counters in a list.

## List styles

There are a wide range of predefined list style types that support numbers, alphabetical, roman numerals, and many international counting systems.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/rNKPRrJ?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen rNKPRrJ by web-dot-dev on Codepen">
</iframe>

In addition to the styles supported by browsers, W3C published [Ready-made Counter Styles](https://w3c.github.io/predefined-counter-styles), with support for 181 additional styles in 45 writing systems.

If these options don't fit your needs, you can also define a custom [`@counter-style`](https://developer.mozilla.org/docs/Web/CSS/@counter-style). This lets you specify custom symbols, a prefix and suffix, and more.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/azvYeOG?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen azvYeOG by web-dot-dev on Codepen">
</iframe>

By default, the item marker is `outside` the list, positioned in front of the list, and right aligned. You can also position the item marker inside the list, with `list-style-position: inside`.

## Counters

While list styles control how the list item markers are displayed, counters allow you to control the values to be displayed. For `<li>` list item elements, the browser creates a counter called `list-item` that is incremented by 1 for each list item encountered.

CSS counters keep a running count of the number of times an element that has a corresponding `counter-increment` value set is rendered.

To create a new counter, use `counter-reset` with a counter name and, optionally, an initial value. You will often set this on a parent element that holds all the elements that will be counted.

> [!NOTE]
> **Note:** `counter-reset`, which initializes a counter with an initial value and direction, shouldn't be confused with `counter-set`, which only sets the value of an existing counter.

Then, add a `counter-increment` property on each element you want to count.

Finally, display the counter value using the `counter()` function.

In this example, we want to display the running count of footnotes as the link text for each footnote. Since we want a single counter for the entire document, we set `counter-reset: note` on the body, and increment on each footnote link.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/wBKmVKK?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen wBKmVKK by web-dot-dev on Codepen">
</iframe>

You can also have multiple counters counting different items. In the footnotes example, what if you wanted to display the index of the section and paragraph that the footnote is in?

The section count can be created on the body using `counter-reset`, and then increment on each `<h2>` element. We want the paragraph count to reset for each section, so we'll use `counter-reset` on `<h2>` elements, and increment on `<p>` elements.

Finally, we combine the counter values in the `content` property.

```css
a:after {
  content: "(S" counter(section) "P" counter(paragraph) "N" counter(note) ")";
  font-size: small;
  vertical-align: super;
}
```

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/VYLNybr?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen VYLNybr by web-dot-dev on Codepen">
</iframe>

### Nested counters

What happens when you nest a list inside of a list? The `list-item` counter is initialized for each `<ul>` or `<ol>` element, and using `counter()` only returns the number of the innermost count. If you want to show the count from each of the nested counters, use the `counters()` function, which takes a counter name and a separator.

```css
li::marker {
  content: counters(list-item, ".");
}
```

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/azvYevG?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen azvYevG by web-dot-dev on Codepen">
</iframe>

### Reversing counters

By default, counters (including the implicit `list-item` counter for `<ol>` elements) start at 0, and count up by one for each element, meaning the first one will be counted as 1. What if you want to count backwards to 1?

To do that, add the `reversed` attribute to the `<ol>`. If you are using the standard list style, the markers will work as expected. However, if you are using a custom counter, you will need to set `counter-increment` to a negative value, and calculate the start value for the counter manually.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/RNWMXWm?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen RNWMXWm by web-dot-dev on Codepen">
</iframe>

## Check your understanding

What property creates a new counter with a value and direction?
`counter-reset` Correct! `counter-create` Incorrect. `counter-set` Incorrect. `counter-init` Incorrect. What is the name of the counter created for each `ul` and `ol`?
`list-item` Correct! `ordered-list` Incorrect. `list` Incorrect. `default` Incorrect. If your language's counting system isn't one of the types supported by CSS, you will have to create it yourself manually.
True Incorrect. False Correct! What declaration would show the counts in a nested list?
`content: counter(0) "." counter(1)` Incorrect. `content: counters(list-item, ".")` Correct! `content: counter(nested)` Incorrect. `content: counters()` Incorrect.
