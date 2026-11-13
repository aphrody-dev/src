---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/visual-order-follows-dom
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:36+00:00
sha256: 66797ab204c18c3e881e29faf2c3f2f3665d9210b588a5e7b68ad05c4d083703
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
A logical tab order is important for users to have a smooth keyboard experience.
Screen readers and other assistive technologies navigate the page in DOM order.
The flow of information should make sense.

## How to manually test

To check if your application's tab order is logical,
try tabbing through your page.
In general, focus should follow reading order, from the top to the bottom of
your page. In most languages, reading order moves from left to right. In some,
such as Arabic and Hebrew, reading order moves from right to left.

There are two main ideas to keep in mind when assessing your tab order:

- Are the elements in the DOM arranged in a logical order?
- Is offscreen content correctly hidden from navigation?

Notice any jumps in navigation that seem jarring.
Also notice any offscreen jumps,
where tabbing brings you to content that's not meant to be visible.

Learn more in [Keyboard access fundamentals](https://web.dev/articles/keyboard-access).

## How to fix

If the focus order seems wrong, rearrange the elements in the DOM to make
the tab order more natural.

Avoid using CSS to visually reposition elements, as assistive technology users
will experience a nonsensical navigation.
Instead of using CSS, move the element to an earlier position in the DOM.

If offscreen content is still accessible to keyboard controls,
consider removing it using `tabindex="-1"`.

Learn more in [Control focus with tabindex](https://web.dev/articles/control-focus-with-tabindex).

## Resources

[Source code for **Visual order on the page follows DOM order** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/visual-order-follows-dom.js)
