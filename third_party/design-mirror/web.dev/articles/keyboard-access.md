---
source_url: https://web.dev/articles/keyboard-access
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: 0004377861196a851906304e391bb02d06f9dafdf6dbd9c63ad9ff3ed5ae1fcb
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Rob Dodson [X](https://twitter.com/rob_dodson) [GitHub](https://github.com/robdodson) [Homepage](https://robdodson.me)

Many different users rely on the keyboard to navigate applications---from users
with temporary and permanent motor impairments to users who use keyboard
shortcuts to be more efficient and productive. Having a good keyboard navigation
strategy for your application creates a better experience for everyone.

## Focus and the tab order

At a given moment, **focus** refers to which element in your application is
actively receiving input from a keyboard, such as a field, checkbox, button
or link. In addition to keyboard events, the focused element also gets content
that is pasted from the clipboard.

To move the focus on a page, use `TAB` to navigate "forward" and `SHIFT + TAB`
to navigate "backward." The focused element is often indicated by a
**focus ring** , and various browsers style their focus rings differently. The
order in which focus proceeds forward and backward through interactive elements
is called the **tab order**.

Interactive HTML elements like text fields, buttons, and select lists are
**implicitly focusable** : they are automatically inserted into the tab order
based on their position in the
[DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model).
These interactive elements also have built-in keyboard event handling. Elements
such as paragraphs and divs are not implicitly focusable because users typically
don't need to interact with them.

Implementing a logical tab order is an important part of providing your users
with a smooth keyboard navigation experience. There are two main ideas to keep
in mind when assessing and adjusting your tab order:

1. Arrange elements in the DOM to be in logical order
2. Correctly set the visibility of offscreen content that shouldn't receive focus

## Arrange elements in the DOM to be in logical order

To check if your application's tab order is logical, try tabbing through your
page. In general, focus should follow reading order, moving from left to right,
from the top to the bottom of your page.

If the focus order seems wrong, you should rearrange the elements in the DOM to
make the tab order more natural. To change the visual arrangement on your site,
move it earlier in the DOM instead of styling it to appear earlier with CSS.

For example:
Don't

```html
<button style="float: right">Kiwi</button>
<button>Peach</button>
<button>Coconut</button>
```

The kiwi button is floated, which creates an illogical focus order. Do

```html
<button>Peach</button>
<button>Coconut</button>
<button>Kiwi</button>
```

Order your HTML in the way you want the tab order to appear.

Be careful when changing the visual position of elements using CSS to avoid
creating an illogical tab order. To fix the illogical tab order, we moved the
floating "Kiwi" button to come after Coconut and removed the inline style.

## Correctly set the visibility of offscreen content

Sometimes offscreen interactive elements need to be in the DOM, but they
shouldn't be in your tab order. For example, if you have responsive navigation
that opens in a sidebar on a button click, the user shouldn't be able to
focus on the navigation while it's closed.

To prevent a particular interactive element from receiving focus, you should
give the element either of the following CSS properties:

- `display: none`
- `visibility: hidden`

To add the element back into the tab order, for example when the navigation is
open, replace these CSS properties respectively with:

- `display: block`
- `visibility: visible`

> [!NOTE]
> **Note:** If you can't determine where the focus is as you're tabbing, open DevTools Console and enter `document.activeElement`. This property returns the element that is in focus.

## Next steps

For users who operate their computer almost entirely with the keyboard or
another input device, a logical tab order is essential for making your
application accessible and usable. As a good habit for checking your tab order,
try tabbing through your application before each publish.
