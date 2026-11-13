---
source_url: https://web.dev/learn/html/focus
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:46+00:00
sha256: d7cc8089db7991625f74a129a676a7a8ea3a423a0aa0c32f072176bc6fb3f4da
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Interactive elements, including [form controls](https://web.dev/learn/html/forms.md.txt),
[links](https://web.dev/learn/html/links.md.txt), and buttons, are by default focusable and tabbable.
Tabbable elements are part of the document's sequential focus navigation order.
Other elements are inert, meaning they are not interactive. With HTML
attributes, it's possible to make interactive elements inert and to
make inert elements interactive.

> [!NOTE]
> **Note:** For usability and accessibility, always make sure that the user knows which element has focus. Include CSS [`:focus`](https://developer.mozilla.org/docs/Web/CSS/:focus), [`:focus-visible`](https://developer.mozilla.org/docs/Web/CSS/:focus-visible), and (optionally) [`:focus-within`](https://developer.mozilla.org/docs/Web/CSS/:focus-within) styles. There are modules dedicated to focus styles in both [Learn CSS](https://web.dev/learn/css/focus.md.txt) and [Learn Accessibility](https://web.dev/learn/accessibility/focus.md.txt).

By default, the navigation focus order is the same as the visual order, which is
the source code order. There are HTML attributes that can alter this order and
CSS properties that can alter the visual order of content. Changing the tabbing
order with HTML or visual rendering order with CSS can harm user experience.

Don't alter the perceived and actual tabbing order with CSS and HTML. As the
following two examples demonstrate, tab orders that differ from the visually
expected order are confusing to users and bad for user experience.

In the following example, the value of the
[`tabindex`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/tabindex)
attribute has made the tab order chaotic:
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/GRXKqGz?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen GRXKqGz by web-dot-dev on Codepen"></iframe>

In this example, CSS has created a divergence between the tabbing order and the
visual order of the content:
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/KKxPMBV?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

The [`flex-flow: row-reverse;`](https://developer.mozilla.org/docs/Web/CSS/flex-flow)
declaration has reversed the visual order. In addition, the CSS
[order](https://developer.mozilla.org/docs/Web/CSS/order) property was applied
to the sixth word, "This", which visually moved that one word. The tabbing
sequence is the order of the code, which no longer matches the visual order.
This creates a disconnect for keyboard users.

Some CSS features, including [flexbox](https://developer.mozilla.org/docs/Learn/CSS/CSS_layout/Flexbox),
[grid](https://developer.mozilla.org/docs/Web/CSS/CSS_Grid_Layout),
[positioning](https://developer.mozilla.org/docs/Learn/CSS/CSS_layout/Positioning),
[transforms](https://developer.mozilla.org/docs/Web/CSS/translate), and
[multi-column](https://developer.mozilla.org/docs/Learn/CSS/CSS_layout/Multiple-column_Layout),
can alter the visual order of content. Test your content by tabbing through it
with a keyboard: with <kbd>shift</kbd> + <kbd>tab</kbd> to move backwards
through the content. Use CSS to indicate which element has focus. Don't reorder
focusable elements with CSS.

It's important you maintain a logical tabbing order on all viewport sizes.

## Make inert elements interactive

The `contenteditable` and `tabindex` attributes, being global attributes, can be
added to any element, making them focusable in the process. Focusable elements
can also be focused with a mouse or pointer, by having the
[`autofocus`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/autofocus)
attribute set, or by script, such as with
[`element.focus()`](https://developer.mozilla.org/docs/Web/API/HTMLElement/focus).

### The `tabindex` attribute

The global [`tabindex`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/tabindex)
attribute, introduced in [attributes](https://web.dev/learn/html/attributes.md.txt#tabindex), enables
elements that otherwise wouldn't be able to receive focus to get
focus, usually with <kbd>Tab</kbd>, hence the name.

The `tabindex` attribute takes as its value an integer. A negative value makes
an element focusable but not tabbable. A `tabindex` value of `0` makes the
element focusable and tabbable, adding the element on which it's applied to
the sequential focus navigation order in source code order. A value of 1 or
greater makes the element focusable and tabbable, but adds it to a prioritized
tabbing sequence and should be avoided.

On this page, the share button, `<share-action>`, is a
[custom element](https://web.dev/learn/html/template.md.txt). The `tabindex="0"` adds this
element into the keyboard default tabbing order:

```html
<share-action
  authors="@front-end.social/@estellevw"
  data-action="click"
  data-category="web.dev"
  data-icon="share"
  data-label="share, mastodon"
  role="button"
  tabindex="0"
>
  <svg aria-label="share" role="img" xmlns="http://www.w3.org/2000/svg">
    <use href="#shareIcon" />
  </svg>
  <span>Share</span>
</share-action>
```

> [!NOTE]
> **Note:** The [`role="button"`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/button_role) informs screen reader users that this element should behave like a [`<button>`](https://developer.mozilla.org/docs/Web/HTML/Element/button). Avoid creating custom elements that mimic semantic elements, as it requires [replication of semantic functions](https://web.dev/learn/accessibility/aria-html.md.txt), including `tabindex` and `role`.

Additionally, the [local navigation](https://web.dev/learn/html/navigation.md.txt#local_navigation)
has a custom element with a negative `tabindex` value:

```html
<web-navigation-drawer type="standard" tabindex="-1"></web-navigation-drawer>
```

A `tabindex` attribute with a negative value makes the element focusable, but
not tabbable. The element can receive focus, such as using
[`HTMLElement.focus()`](https://developer.mozilla.org/docs/Web/API/HTMLElement/focus),
but it's not part of the sequential focus navigation order. The convention for
non-tabbable, focusable elements is to use `tabindex="-1"`. If you add
`tabindex="-1"` to an interactive element, it will no longer be tabbable.

The [`element.focus()`](https://developer.mozilla.org/docs/Web/API/HTMLElement/focus)
method can be used to set focus to focusable elements. Browsers scroll focused
elements into view. For this reason, avoid the use of
`element.focus({preventScroll:true})`, as focusing on a non-visible element is a
bad user experience.

If you want to query the document to find out which element has focus, use the
read-only [`Document.activeElement`](https://developer.mozilla.org/docs/Web/API/Document/activeElement)
property.

Elements with a `tabindex` of `1` or greater are included in a separate tab
sequence. As in the following Codepen, tabbing begins in a separate sequence, in
order of lowest value to highest value, before going through those in the
regular sequence (no `tabindex` set, or `tabindex="0"`) in source order:
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/WNgexPv?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

`tabindex` with a positive value puts the element into a prioritized focus
sequence, which can lead to focus order chaos. Avoid
[modifying the DOM order with `tabindex`](https://web.dev/articles/using-tabindex.md.txt). Altered
tabbing order can create bad user experiences and are difficult to maintain.

### The `contenteditable` attribute

The [`contenteditable`](https://web.dev/learn/html/attributes.md.txt#contenteditable) attribute was
discussed earlier. Setting `contenteditable="true"` on any element makes it
editable, focusable, and part of the tab order. The focus behavior is similar to
setting `tabindex="0"`, but not the same. Nested `contenteditable` elements are
focusable but not tabbable. To make a nested `contenteditable` element tabbable,
add `tabindex="0"`, which adds it to the sequential focus navigation order.

## Give `autofocus` to interactive elements

While the boolean [`autofocus`](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/autofocus)
is a global attribute that can be set on any element, it doesn't make an inert
element interactive. When the page loads, the first focusable element with the
`autofocus` attributes receives focus, as long as that element is displayed and
not nested in a [`<dialog>`](https://web.dev/learn/html/dialog.md.txt).

Automatically setting focus on content may be confusing to users. When you set
`autofocus` on a form control, that form control scrolls into view on page load.
Your users, including screen reader users and users with small viewports, may
miss the form's instructions or even the form control's label. Further, the
`autofocus` attribute doesn't alter the document's sequential focus
navigation order. The elements in the sequence that come prior to auto-focused
element are skipped. For these reasons, you should avoid using the `autofocus`
attribute.

The exception to the "don't use `autofocus`" recommendation is including the
`autofocus` attribute within `<dialog>` elements. When a dialog is opened,
the browser automatically focuses on the first focusable interactive element
within the `<dialog>`, which means it's unnecessary to add `autofocus` to an
element. If you want to be sure a specific interactive element within the dialog
receives focus when the dialog opens, add the `autofocus` attribute to that
element.

```html
<dialog open>
  <form method="dialog">
    <button type="submit" autofocus>close</button>
  </form>
</dialog>
```

The `autofocus` attribute set on the close `<button>` allow it to receive focus
when the dialog is opened. As the first element in the dialog, it would have
received focus in any case. By default, when a dialog is opened, the first
focusable element within the dialog receives focus unless a different element
within the dialog has the `autofocus` attribute set.

## Make interactive elements inert

There are also HTML attributes that can remove interactive elements from the
tabbing sequence. Including a negative `tabindex` to focusable elements, adding
the `disabled` attribute to supporting form controls, and adding the global
`inert` attribute to a container all make elements un-tabbable. These three
attributes are completely separate and aren't interchangeable.

### Negative `tabindex` value

A `tabindex` attribute with a negative value makes an element focusable, but not
tabbable. While adding `tabindex="0"` to a focusable-by-default element,
including links, buttons, form controls, and elements that are `contenteditable`
is not necessary; including a `tabindex` with a negative value removes normally
tabbable elements from the sequential focus navigation order.

A negative `tabindex` value prevents keyboard users from focusing on interactive
elements, but doesn't disable the element. Pointer users can still focus on the
element. To disable an element, use the `disabled` attribute.

### Disabled

The boolean [disabled](https://developer.mozilla.org/docs/Web/HTML/Attributes/disabled)
attribute makes the form controls on which it's applied and their descendants,
if any, unfocusable. Disabled form controls can't be focused, don't get click
events, and are not submitted upon form submission.

`disabled` is not a global attribute. It applies to `<button>`, `<input>`,
`<optgroup>`, `<option>`, `<select>`, `<textarea>`, form-associated custom
elements, and [`<fieldset>`](https://developer.mozilla.org/docs/Web/HTML/Element/fieldset).
When set on `<optgroup>` or `<fieldset>`, all the child form controls are
disabled, except for the contents of the `<fieldset>`'s first
[`<legend>`](https://developer.mozilla.org/docs/Web/HTML/Element/legend).

The same elements that support `disabled` are also targetable with the
[`:disabled`](https://developer.mozilla.org/docs/Web/CSS/:disabled)
and [`:enabled`](https://developer.mozilla.org/docs/Web/CSS/:enabled)
pseudo-classes. Elements that are disabled with the `disabled` attribute are
generally styled as light gray with the user-agent stylesheet, even if an
[`accent-color`](https://developer.mozilla.org/docs/Web/CSS/accent-color)
is set.

Being a boolean attribute, the presence of the attribute disables the otherwise
enabled element; you can't set it to `false`. To re-enable a disabled element,
the attribute has to be removed, generally with
[`Element.removeAttribute('disabled')`](https://developer.mozilla.org/docs/Web/API/Element/removeAttribute).

The [`HTMLInputElement.disabled`](https://developer.mozilla.org/docs/Web/API/HTMLInputElement/disabled)
property lets you check if an input is disabled. As `disabled` is not a global
attribute, it's not inherited from the HTMLElement, but every supporting
element interface, like [`HTMLSelectElement`](https://developer.mozilla.org/docs/Web/API/HTMLSelectElement/disabled),
[`HTMLTextareaElement`](https://developer.mozilla.org/docs/Web/API/HTMLTextAreaElement#instance_properties),
has the same read-only property.

The `disabled` attribute doesn't apply to normally `inert` elements that are
made focusable with `tabindex` or `contenteditable`, nor does it apply to the
`<form>` element. To disable these elements, the global `inert` attribute can
be used.

### The `inert` attribute

When the `inert` global boolean attribute is added to an element, that element
and all nested content become disabled, which means they cannot be clicked or
tabbed to. They are also removed from the accessibility tree. While `inert`
can be applied to any element, it's generally used for sections of content,
such as offscreen or otherwise hidden content.

When applying `disabled` to form controls, the browser provides default styling
and can be styled using the [`:disabled`](https://developer.mozilla.org/docs/Web/CSS/:disabled)
pseudo class. The `inert` attribute provides no visual indicators and has no
matching pseudoclass (though the `[inert]`
[attribute selector](https://web.dev/learn/css/selectors.md.txt#attribute_selector) matches).

Using `inert` on visible content without styles indicating the inertness can
lead to poor user experience. As inert content is not available to screen reader
users, it can lead to confusion when sighted screen reader users see content on
screen that is not available to the accessibility tools. Make inertness very
apparent with CSS.

Make sure that the focus never moves to non-visible content. Anything rendered
off-screen that does not automatically come into view when focused should be
made [inert](https://developer.chrome.com/articles/inert). If content is hidden
but comes into view when focused, like a
[skip to content link](https://web.dev/learn/html/navigation.md.txt#skip_to_content_link),
it does not need to be made inert.

## Check your understanding

Test your knowledge of focus.
If an element cannot be focused it is described as what?
Empty. Try again. Inert. Correct! Hidden. Try again. What will be true if the element has a `disabled` attribute?
It will be unfocusable. Correct! It will not be displayed. Try again. If it is a form element it will not be submitted. Correct!
