---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/focus-traps
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: 630a41ed0b812665cf2309c51d7eccb3bfd46b4c3be45ebd37da40be558eff40
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Keyboard focus should never be locked or trapped at one particular page element.
Users should be able to navigate to and from all page elements,
using only the keyboard.

## How to manually test

To test that your users can't accidentally trap their focus,
navigate to and from all page elements using only the keyboard.
Use <kbd>TAB</kbd> to navigate "forward" and <kbd>SHIFT</kbd>+<kbd>TAB</kbd> to
navigate "backward."

If you can't tab through all page elements successfully, then your keyboard
navigation is not working correctly. Watch out for autocomplete widgets, as
keyboard focus may get stuck.

Learn more about
[manual accessibility tests](https://web.dev/learn/accessibility/test-manual).

## How to fix

Pages that present content in multiple formats, such as modal dialogs and
widgets, are at risk for focus traps.

If you have a modal that requires interaction, where you want to prevent the
user from interacting with the rest of the page until acknowledged, only then
can you consider temporarily trapping the user. However, you should consider
providing a keyboard-accessible method of escaping the modal.

Here's an example for [how to create an accessible modal](https://github.com/gdkraus/accessible-modal-dialog).
In this example, you get the intended behaviors of a modal,
without forcing the user to refresh the page to get out of the focus trap.

We also recommend you read
[Modals and Keyboard Traps](https://web.dev/articles/using-tabindex#modals_and_keyboard_traps).

## Why this matters

For users who either cannot or choose not to use a mouse,
keyboard navigation is the primary means of reaching everything on a screen.
Good keyboarding experiences depend on a logical tab order and discernible focus
styles. If a keyboard user gets trapped in a particular page element,
they have no way of interacting with the page.

Learn more about how to
[test with Assistive Technology](https://web.dev/learn/accessibility/test-assistive-technology).

## Resources

[Source code for **User focus is not accidentally trapped in a region** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/focus-traps.js).
