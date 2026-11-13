---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/focusable-controls
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:57+00:00
sha256: bbf72977e47dee9cd9feb4e209ab93af3f2c559624054abd91ea9bc5a9c665da
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Published: May 2, 2019

Manually check that all custom controls are keyboard focusable
and display a focus indicator.
The order in which elements are focused should aim to follow the DOM order.
If you're unsure which elements should receive focus,
see the [focus module](https://web.dev/learn/accessibility/focus) in the
[Learn Accessibility course](https://web.dev/learn/accessibility) on web.dev.

> [!CAUTION]
> **Caution:** This page has a broken demo, as [Glitch has ended hosting](https://blog.glitch.com/post/changes-are-coming-to-glitch).

## How to manually test

To test that the custom control is focusable
and displays a focus indicator,
start by tabbing through your site.
Use `TAB` (or `SHIFT +
TAB`) to move between controls, and use the arrow keys and
`ENTER` and `SPACE` to manipulate their values
(see also [Keyboard access fundamentals](https://web.dev/articles/keyboard-access)):
<iframe style="height: 100%; width: 100%; border: 0;" title="interactive-elements on Glitch" src="https://glitch.com/embed/#!/embed/interactive-elements?attributionHidden=true&amp;sidebarCollapsed=true&amp;path=index.html&amp;previewSize=100" allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy"></iframe>

Are you able to reach all of the interactive controls on the page?
Is there a focus indicator on each interactive control?

## How to fix

If you aren't able to tab through all elements on a page,
you may need to use `tabindex` to improve the focusability of those controls.

To make a custom control focusable,
insert the custom control element into the natural tab order using `tabindex="0"`
(see also [Control focus with tabindex](https://web.dev/articles/control-focus-with-tabindex)).
For example:

```html
<div tabindex="0">Focus me with the TAB key</div>
```

You may also need to add the appropriate ARIA roles to the custom control elements.
See [Custom controls have ARIA roles](https://developer.chrome.com/docs/lighthouse/accessibility/custom-control-roles.md.txt).

If you're not seeing a focus indicator,
consider using `:focus` to always show a focus indicator.
Regardless of whether you use a mouse or a keyboard to tab to it,
the button's focus indicator always looks the same
(see also [Style focus](https://web.dev/articles/style-focus)).
<iframe style="height: 100%; width: 100%; border: 0;" title="focus-style on Glitch" src="https://glitch.com/embed/#!/embed/focus-style?attributionHidden=true&amp;sidebarCollapsed=true&amp;path=index.html&amp;previewSize=100" allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy"></iframe>

## Why this matters

For users who either cannot or choose not to use a mouse,
keyboard navigation is the primary means of reaching everything on a screen.
Good keyboard experiences depend on a logical tab order and discernible focus styles.
If a keyboard user can't see or learn what's in focus, they have no way of
interacting with the page.

Learn more about accessibility in
[Learn Accessibility](https://web.dev/learn/accessibility).

## Resources

- Source code for [**Interactive controls are keyboard focusable** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/focusable-controls.js).
- Some elements have a [`[tabindex]` value greater than `0`](https://dequeuniversity.com/rules/axe/4.4/tabindex).
- Use [semantic HTML](https://web.dev/learn/html/semantic-html) for keyboard wins.
