---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/interactive-element-affordance
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: 3907778655c4187e84925867a57f01c41ab61e9d91bae13a11279d018aa70734
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Interactive elements, such as links and buttons,
should indicate their state and be distinguishable from non-interactive elements.
To check that interactive elements indicate their purpose and state,
use both a visual and a screen reader test.

## How to manually test

You should test interactive elements visually and with screen readers.

### Test visual focus

To manually test visual focus, <kbd>TAB</kbd> through your page.

- Can you <kbd>TAB</kbd> to each interactive element?
- When you get to an interactive element, is there a visual clue that users can interact with it?
- Does each interactive element change in appearance when you select it?

There are many ways to style the focus indicators for each interactive element.
One way is to style the `:focus` pseudo-class.
That style is applied any time the element is focused,
regardless of the input device or method used to focus it.

Learn more about how to
[style focus](https://web.dev/learn/accessibility/focus#focus_indicator).

### Test with screen readers

> [!TIP]
> **Tip:** Learn how to [test with assistive technology](https://web.dev/learn/accessibility/test-assistive-technology).

Use a screen reader to navigate your page and check that the screen reader
announces the name of each interactive control,
the role of that control, and the current interactive state.
If the role of an element is unclear, and the state of the element is unclear,
you may need to add the appropriate ARIA roles.

Learn more in [Custom controls have ARIA roles](https://developer.chrome.com/docs/lighthouse/accessibility/custom-control-roles.md.txt).

It's also important to pay close attention to how interactive elements are
labeled. Users of screen readers and other assistive technologies
rely on labels to understand the context of that element.
Vague labels are common, and they are non-helpful for navigating content.
Learn how to improve [Labels and text alternatives](https://web.dev/articles/labels-and-text-alternatives).

## Why this matters

Providing visual hints about what a control does can help people operate and
navigate your site. These hints are called _affordances_.
Affordances makes it possible for people to use your site on a wide variety of
devices.

## Resources

[Source code for **Interactive elements indicate their purpose and state** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/interactive-element-affordance.js)
