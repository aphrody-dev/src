---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/custom-controls-labels
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:15+00:00
sha256: bc1583acd2ba8c1295dd7eb13dfe261fd0fdf8d8be9c53273fdb6ce2b58d560a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Custom interactive controls should be focusable. For example, if you use
JavaScript to turn a `<div>` into a fancy drop-down, that drop-down isn't
automatically inserted into the correct tab order.

You need to manually check that all custom controls are
[keyboard focusable](https://web.dev/articles/keyboard-access).

When possible, use
[semantic HTML elements](https://web.dev/learn/html/semantic-html) that allow
for interaction.

## How to test

To test that the custom control is focusable,
press the `TAB` key to navigate through the site:
<iframe height="250" style="width: 100%;" scrolling="no" title="Tabindex Zero" src="https://codepen.io/web-dot-dev/embed/dyxjqye?default-tab=result" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
</iframe>

Are you able to reach all of the interactive controls on the page?
If not, you may need to use `tabindex` to improve the focusability of those controls.
See also [Control focus with tabindex](https://web.dev/articles/control-focus-with-tabindex).

## How to fix

To make a custom control focusable, insert the custom control element into the
natural tab order using `tabindex="0"`.
For example:

```html
<div tabindex="0">Focus me with the TAB key</div>
```

## Why this matters

For users who either cannot or choose not to use a mouse,
keyboard navigation is the primary means of reaching everything on a screen.
Good keyboard experiences depend on a logical tab order and discernible focus styles.
If a keyboard user can't see what's focused, they have no way of interacting with the page.

If you're new to accessibility testing, we recommend learning about
[manual accessibility testing](https://web.dev/learn/accessibility/test-manual)
and [Assistive Technology testing](https://web.dev/learn/accessibility/test-assistive-technology).

## Resources

- [Source code for **Custom controls have associated labels** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/custom-controls-labels.js)
- [Some elements have a `[tabindex]` value greater than `0`](https://web.dev/tabindex)
