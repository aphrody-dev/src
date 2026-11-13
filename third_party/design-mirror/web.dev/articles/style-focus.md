---
source_url: https://web.dev/articles/style-focus
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: 140201fcf2e9af2c0b82f38baa20b7c8d7ac1865990df6e25c3635045d20faab
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
> [!TIP]
> **Tip:** Take the [Learn Accessibility keyboard focus module](https://web.dev/learn/accessibility/focus.md.txt) to learn more about supporting disabled users.

 Rob Dodson [X](https://twitter.com/rob_dodson) [GitHub](https://github.com/robdodson) [Homepage](https://robdodson.me)

The focus indicator, often signified by a "focus ring," identifies the
element in focus on your page. For users who can't or don't want to use a mouse,
this indicator is *extremely important*, because it acts as a stand-in for a
mouse-pointer.

If the browser's default focus indicator clashes with your design, you can use
CSS to restyle it. Remember to keep your users in mind.

## Use `:focus` to always show a focus indicator

The [`:focus`](https://developer.mozilla.org/docs/Web/CSS/:focus)
pseudo-class is applied to elements in focus, regardless of the input method
or device (such as a mouse, keyboard, or stylus) in use.

For example, the following `<div>` has a `tabindex` that makes it focusable,
with a custom style for its `:focus` state:

```css
div[tabindex="0"]:focus {
  outline: 4px dashed orange;
}
```

No matter what device you use, the `<div>` looks the same in focus.
<iframe height="346" style="width: 100%;" scrolling="no" title="focus-style" src="https://codepen.io/web-dot-dev/embed/QwbXOxq?default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
</iframe>

Unfortunately, browsers can be inconsistent with how they apply focus. Whether
or ot an element receives focus may depend on the browser and the operating
system.

For example, the following `<button>` has custom CSS for its `:focus`
state.

```css
button:focus {
  outline: 4px dashed orange;
}
```

If you click the `<button>` with a mouse in Chrome on macOS you should see
its custom focus style. However, you won't see the custom focus style if you
click the `<button>` in Safari on macOS. This is because in
Safari the element does not receive focus when you click it.
<iframe height="346" style="width: 100%;" scrolling="no" title="focus-style2" src="https://codepen.io/web-dot-dev/embed/JodQOZV?default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
</iframe>

> [!NOTE]
> **Note:** Read about [`<button>` focus behavior](https://developer.mozilla.org/docs/Web/HTML/Element/button#Clicking_and_focus) to determine which browsers and operating systems apply focus to a `<button>`.

Focus behavior is inconsistent. Test your page across different devices and
with different inputs to ensure your focus styles are acceptable to your users.

## Use `:focus-visible` to selectively show a focus indicator

<iframe src="https:///frame/articles/style-focus_54f18c87d8864acbd13bb6f73a15e58a5f480383f174c656406af744cdfda8c9.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

The [`:focus-visible`](https://developer.mozilla.org/docs/Web/CSS/:focus-visible)
pseudo-class is applied when an element receives focus and the browser
determines (with heuristics) that displaying a focus indicator would be
beneficial to the user. In particular, if the most recent user interaction
was with a keyboard and the key press did not include a meta, <kbd>ALT</kbd>,
<kbd>OPTION</kbd>, or <kbd>CONTROL</kbd> key, then `:focus-visible` will match.

The button in the following example *selectively* shows a focus indicator. If
you use a mouse to click, the results are different than if you first use
a keyboard to tab to it.

```css
button:focus-visible {
  outline: 4px dashed orange;
}
```
<iframe height="346" style="width: 100%;" scrolling="no" title="focus-visible-style" src="https://codepen.io/web-dot-dev/embed/WbvqXKE?default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
</iframe>

## Use `:focus-within` to style the parent of a focused element

<iframe src="https:///frame/articles/style-focus_5998c4981561fc2fa3caa094e4e1dd5e6e05808bfbe8c7761f6b2f8923c40d26.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

The
[`:focus-within`](https://developer.mozilla.org/docs/Web/CSS/:focus-within)
pseudo-class is applied to an element when the element itself receives
focus or when a child element receives focus. It can be used to highlight a
region of the page to draw the user's attention to that area.

For example, a form receives focus both when the form itself is selected and
also when any of its radio buttons are selected.

```css
form:focus-within {
  background: #ffecb3;
}
```
<iframe height="346" style="width: 100%;" scrolling="no" title="focus-within-style" src="https://codepen.io/web-dot-dev/embed/azOgVjX?default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
</iframe>

## When to display a focus indicator

A good question is to ask yourself, "If you clicked on this control while
using a mobile device, would you expect it to display a keyboard?"

- **If yes** : The control should *always* show a focus indicator, regardless of the input device. For example, this is almost always true of the `<input type="text">` element. The user needs to send input to the element with the keyboard, regardless of how the input element becomes in focus.
- **If no** : The control may choose to selectively show a focus indicator. For example, when a user clicks a `<button>` with a mouse or on a touchscreen, the action is completed. A focus indicator may be unnecessary. However, if the user is navigating with a keyboard, it's useful to show a focus indicator so the user can decide whether or not they want to activate the control with <kbd>ENTER</kbd> or <kbd>SPACE</kbd>.

## Avoid `outline: none`

The way browsers decide when to draw a focus indicator is, frankly, very
confusing. Changing the appearance of a `<button>` element with CSS or giving
an element a `tabindex` causes the browser's default focus ring behavior to
kick-in.

Sometimes, developers remove the focus indicator using CSS:

```css
/* Don't do this!!! */
:focus {
  outline: none;
}
```

A better way to work around this issue is to combine `:focus` and the
`:focus-visible` polyfill. The first block of code demonstrates how
the polyfill works, and the sample app beneath it provides an example of using
the polyfill to change the focus indicator on a button.

```css
/*
  This hides the focus indicator if the element receives focus with a
  mouse, but it still shows up on keyboard focus.
*/
.js-focus-visible :focus:not(.focus-visible) {
  outline: none;
}

/*
  Optionally: Define a strong focus indicator for keyboard focus.
  If you choose to skip this step, then the browser's default focus
  indicator will be displayed instead.
*/
.js-focus-visible .focus-visible {
  ...
}
```
<iframe height="346" style="width: 100%;" scrolling="no" title="focus-visible" src="https://codepen.io/web-dot-dev/embed/OPVeOob?default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
</iframe>
