---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/custom-control-roles
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: b0c681d7c1475ea0c3c75bce3335eed187ac4511b23761bd337fdfb2977ad8a0
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Check that all custom controls have an appropriate `role` and
any required ARIA attributes that confer their properties and state.
For example, a custom checkbox needs a `role="checkbox"` and
`aria-checked="true|false"` to properly convey its state.

Learn how to use [ARIA and HTML](https://web.dev/learn/accessibility/aria-html)
to understand when best to provide missing semantics for custom controls.

## How to test

> [!TIP]
> **Tip:** If you're new to accessibility testing, we recommend learning about [manual accessibility testing](https://web.dev/learn/accessibility/test-manual) and [Assistive Technology testing](https://web.dev/learn/accessibility/test-assistive-technology).

To check that all custom interactive controls have appropriate ARIA roles,
test the page using either the
[Chrome DevTools accessibility pane](https://developer.chrome.com/docs/devtools/accessibility/reference.md.txt#pane)
or a screen reader.

[JAWS](https://www.freedomscientific.com/products/software/jaws/) and
[NVDA](https://www.nvaccess.org/)
are two of the more popular screen readers for Windows.
[VoiceOver](https://www.apple.com/accessibility/mac/vision/)
is the screen reader built into macOS.

With CSS, you can style a `<div>` and `<button>` elements to convey the same
visual affordances, but the experience is very different when using a screen
reader. A `<div>` is just a generic grouping element, so a screen reader only
announces the text content of the `<div>`.
The `<button>` is announced as a "button," a much stronger signal to the user
that it's something they can interact with.

See also [Semantics and screen readers](https://web.dev/articles/semantics-and-screen-readers).

## How to fix

The best solution to this problem is to avoid custom interactive controls
altogether. For example, replace a `<div>` that's acting like a button
with an actual `<button>`.

```html
<button>Learn more</button>
```

If you must use a `<div>`, add `role="button"` and `aria-pressed="false"`.

```html
<div role="button" aria-pressed="false">Learn more</div>
```

Now screen readers announce the role and interactive state for the `<div>`.

## Why this matters

If you haven't used assistive technology before, you may not know how your
content performs for assistive technology users. Ideally, you can speak to
users who use assistive technology regularly and can share feedback on how
your website or web application performs.

Another way to understand how assistive technology users experience your content
is to [test with Assistive Technology](https://web.dev/learn/accessibility/test-assistive-technology).
Using a screen reader helps give you a clearer understanding of how your content
is labeled, and if there are any obstructions to navigation.

## Resources

You can look at the source code for the
[**Custom controls have ARIA roles** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/custom-controls-roles.js)
