---
source_url: https://web.dev/learn/html/details
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:04+00:00
sha256: 4013cb5681a088ccbf2a9ed80b721a2e002fd3f05e98890550113fddac94ecb7
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Discover how the very useful details and summary elements work, and where to
use them.

An expander arrow, sometimes known as a disclosure widget, is a user interface
control that hides and shows content. If you are reading this on `web.dev`, and
your viewport is less than 106 ems wide, clicking the "On this page" reveals the
table of contents for this section. If you don't see it, shrink the browser to
view the table of contents navigation on this page as an expander arrow.

The [accordion](https://en.wikipedia.org/wiki/Accordion_(GUI)) graphical user
interface is a series of vertically stacked disclosure widgets. A common use
case for the accordion is a Frequently Asked Questions (FAQ) page. In this case,
an accordion FAQ contains a list of visible questions. When clicked on, the
question expands, or "discloses," the answer to that question.

[jQuery](https://jqueryui.com/accordion/) has included an accordion UI pattern
since at least 2009. The original JavaScript-free accordion solution included
making each FAQ question a `<label>` followed by the checkmark it labeled, and
then displaying `<div>` answer when the checkmark was checked. The CSS looked
something like this:

```css
#FAQ [type="checkbox"] + div.answer {
  /* all the answer styles */
  display: none;
}
#FAQ [type="checkbox"]:checked + div.answer {
  display: block;
}
```

Why the history? Disclosure widgets, such as accordions, without JavaScript or
form control hacks, are a relatively recent addition. The
[`<details>`](https://developer.mozilla.org/docs/Web/HTML/Element/details) and
[`<summary>`](https://developer.mozilla.org/docs/Web/HTML/Element/summary)
elements have only been fully supported in modern browsers since January 2020.
You can now create functional, albeit less than attractive, disclosure widgets
with semantic HTML.

The `<details>` and `<summary>` elements are all you need: they are a
built-in way to handle expanding and collapsing content. When a user clicks or
taps a `<summary>`, or releases the <kbd>Enter</kbd> key when the `<summary>`
has focus, the contents of the parent `<details>` toggle to visible.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/MWqgjQr?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen MWqgjQr by web-dot-dev on Codepen"></iframe>

Like all semantic content, you can progressively enhance the default features
and appearance. In this case, just a tiny bit of CSS has been added:
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/ExeYgQd?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen ExeYgQd by web-dot-dev on Codepen"></iframe>

That means, this CodePen (and all of the CodePen samples) has no JavaScript.

## Toggle visibility with the `open` attribute

The `<details>` element is the disclosure widget container. The `<summary>` is
the summary or legend for its parent `<details>`. The summary is always
displayed, acting as a button that toggles the display of the rest of the
parent's contents. Interacting with the `<summary>` toggles the display of the
self-labeled summary siblings by toggling the `<details>`' element's `open`
attribute.

The `open` attribute is a boolean attribute. If present, no matter the value
or lack thereof, it indicates that all the `<details>` contents are shown to
the user. If the `open` attribute is not present, only the contents of the
`<summary>` are shown.

Because the `open` attribute is added and removed automatically as the user
interacts with the control, it can be used in CSS to style the element
differently based on its state.

You can create an accordion with a list of multiple `<details>` elements, each
with a `<summary>` child. Omitting the `open` attribute in your HTML means the
`<details>` will all be collapsed, or closed, with just the summary headings
visible when the page loads;
each heading being the opener for the rest of the contents in the parent
`<details>`. If you include the `open` attribute in your HTML, `<details>`
renders expanded, with the contents visible, when the page loads.

The hidden content in the collapsed state is searchable in some browsers but
not others, even though the collapsed content is not part of the DOM. If you
search in Edge or Chrome, the details containing a search term expand to display
the occurrence. This behavior is not replicated in Firefox or Safari.

The `<summary>` must be the first child of a `<details>` element, representing
a summary, caption, or legend for the rest of the contents of the parent
`<details>` element in which it is nested. The `<summary>` element's contents
can be any heading content, plain text, or HTML that can be used within a
paragraph.

## Toggle the summary marker

In the two earlier Codepens, there's an arrow to the
[inline-start](https://developer.mozilla.org/docs/Web/CSS/CSS_Logical_Properties)
side of the summary. An expander arrow is typically presented on-screen, a
small triangle that rotates (or twists) to indicate open or closed status and
a label next to the triangle. The contents of the `<summary>` element label the
disclosure widget.

The rotating arrow at the top of each section is a
[`::marker`](https://developer.mozilla.org/docs/Web/CSS/::marker) set on the
`<summary>` element. Like list items, the `<summary>` element supports the
[`list-style`](https://developer.mozilla.org/docs/Web/CSS/list-style)
shorthand property and its longhand properties, including
[`list-style-type`](https://developer.mozilla.org/docs/Web/CSS/list-style-type).
You can style the disclosure triangle with CSS, including changing the marker
used from a triangle to any other bullet type, including an image with
[`list-style-image`](https://developer.mozilla.org/docs/Web/CSS/list-style-image).

To apply other styles, use a selector similar to
[`details summary::marker`](https://web.dev/learn/css/pseudo-elements.md.txt#marker). The `::marker`
[pseudo-element](https://web.dev/learn/css/selectors.md.txt#pseudo-element) only accepts a limited
number of styles. Removing the `::marker` and replacing it with the
easier-to-style [`::before`](https://developer.mozilla.org/docs/Web/CSS/::before)
is common practice, with CSS styles changing the style of the generated content
slightly based on the presence (or absence) of the open attribute. You can
remove the disclosure widget icon by setting `list-style: none` or set the
[content](https://developer.mozilla.org/docs/Web/CSS/content)
of the marker to `none`, but you should always include visual indicators to
inform sighted users that the summary content toggles to show and hide content.

```css
details summary::before {
  /* all the styles */
}
details[open] summary::before {
  /* changes applied when open only */
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/jOvNMxL?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen jOvNMxL by web-dot-dev on Codepen"></iframe>

This example removes the default marker, and adds generated content to create a
`+` when the details are closed and a `-` when the details are open.

If you want the details block open by default, include the `open` attribute on
the opening `<details>` tag. You can also add space between each dialog and
transition the rotation of the marker created with generated content to
improve the appearance:
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/yLxBajp?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen yLxBajp by web-dot-dev on Codepen"></iframe>

## How errors are handled

If you don't include a `<summary>`, the browser creates one for you, with a
marker and the word "details". This summary is part of a
[shadow root](https://web.dev/learn/html/template.md.txt#shadow_dom), and therefore doesn't have
author CSS summary styles applied.

> [!NOTE]
> **Note:** Unfortunately, Safari does not include the details in the [keyboard focus order](https://bugs.webkit.org/show_bug.cgi?id=249904).

If you do include a `<summary>`, but it's not the first element in the
`<details>`, the browser still displays the summary as it should. It won't fail
if you include a link, label, or other interactive element within the summary
but browsers handle interactive content within interactive content differently.

For example, if you include a link in a summary, some browsers add both the
summary and the link to the default tabbing order, but other browsers don't
focus on the link by default. If you click a `<label>` nested in a `<summary>`,
some browsers give focus to the associated form control. Other browsers
give focus to the form control and toggle the `<details>` open or closed.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/QWVLKxg?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen QWVLKxg by web-dot-dev on Codepen"></iframe>

## The `HTMLDetailsElement` interface

Like all HTML elements, the
[`HTMLDetailsElement`](https://developer.mozilla.org/docs/Web/API/HTMLDetailsElement)
inherits all properties, methods, and events from
[`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement), and
adds the [`open`](https://developer.mozilla.org/docs/Web/API/HTMLDetailsElement/open)
instance property and a [`toggle`](https://developer.mozilla.org/docs/Web/API/HTMLDetailsElement/toggle_event)
event. The [`HTMLDetailsElement.open`](https://developer.mozilla.org/docs/Web/API/HTMLDetailsElement/open)
property is a boolean value reflecting the
[`open`](https://developer.mozilla.org/docs/Web/HTML/Element/details#attr-open)
HTML attribute, indicating whether or not the element's contents
(not counting the `<summary>`) are to be shown to the user. The toggle event is
fired when the `<details>` element is toggled open or closed. You can listen to
this event using [`addEventListener()`](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener).

If you want to write a script to close the opened details when the user opens
any other details, remove the open attribute using
[`removeAttribute("open")`](https://developer.mozilla.org/docs/Web/API/Element/removeAttribute):
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/PodYGBz?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen to close all open details, using JavaScript."></iframe>

This is the only example to use JavaScript. You probably don't need JavaScript,
except to close other open widgets.

Remember, `<details>` and `<summary>` can be heavily styled and can even be used
to [create tooltips](https://css-tricks.com/exploring-what-the-details-and-summary-elements-can-do/).
But, if you're going to use these semantic elements for use cases in which the
native semantics are a mismatch, always
[maintain accessibility](https://www.scottohara.me//blog/2022/09/12/details-summary.html).
HTML for the most part is by default accessible. Our job as developers is to
make sure our content stays accessible.

## Check your understanding

Test your knowledge of details and summary.
The `<summary>` must be the first child of which element?
`<p>` Try again. `<details>` Correct! `<fieldset>` Try again.
