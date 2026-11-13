---
source_url: https://web.dev/articles/aria-poison-or-antidote
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: 61817101574f167e067a06988025ae1eb76ff031adeeb66a17d4e939c3615fa4
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Aaron Leventhal [X](https://twitter.com/aaronlev)

## What is ARIA?

ARIA lets web authors create an alternative reality, seen only by screen readers.

Sometimes it's necessary to expand on the truth or even downright "lie" to screen readers about
what's happening in web content. For example, "focus is really over here!" or "this is really a
slider!". It's like adding magical sticky notes on top of tools and widgets on your workbench. These
magical sticky notes make everyone believe what's written on them.

When a magical sticky note exists, it either overrides our belief about what
each tool is or does. For example, if you add ARIA that states "this thing over
here is a glue gun!". Even though it's an empty blue box sitting, the magical
sticky note tells us that it's a glue gun. We can also add, "and it is 30%
full!". The screen reader now reports that there is a 30% full glue gun.

The web equivalent to this is to take a plain `div` with an image inside of it, and
use ARIA to say it's a slider at value 30 out of 100. ARIA doesn't make the `div`
a slider; it just tells the screen reader to say it's one.

ARIA doesn't affect the appearance of a web page, or the behavior for a mouse or keyboard user.
Only users of assistive technologies notice ARIA's impact. Web developers can add
any arbitrary ARIA without affecting users that aren't running an assistive technology.

You read it right: ARIA doesn't actually do anything to keyboard focus or tab order. That's all done
in HTML, sometimes tweaked with bits of JavaScript.

## How does ARIA work?

Browsers are asked by a screen reader or other assistive technology for
information about each element. When ARIA is present on an element, the browser
takes in the information and changes what it tells the screen reader about that
element.

Here are some common uses of ARIA.

- Add special components that don't exist in HTML, like autocomplete, a tree, or a spreadsheet.
- Add components that exist in HTML, but the author decided they should reinvent, possibly because they wanted to change the behavior or appearance of the standard element. For example, an HTML `<input type="range">` element is basically a slider, but authors want to make it look different.
  - In most cases, this could be addressed with CSS. However, for `range`, CSS is awkwARD. Authors can make their own slider and use `role="slider"` with `aria-valuenow` to tell the keyboard what the current value is.
- Include live regions to tell screen readers about relevant changes to an area of a page.
- Create landmarks, such as headings. Landmarks help screen reader users find what they want, faster. Landmarks can contain an entire related area. For example, "this container is the main area of the page" and "this container over here is a navigation panel".

## Why ARIA?

It can be useful to add some ARIA to HTML that already works. For example, we
might want a form control to point to an error message alert for an invalid
input. Or we might want to indicate the specific use of a text input. These
tweaks can make ordinary websites more usable with a screen reader.

## Menu bar example

Let's say the local web store doesn't sell all the widgets we need. But, we are
[MacGyver](https://www.cbs.com/shows/macgyver/). We can just invent our own widgets from
other widgets! This is pretty similar to a web author who needs to make a menu bar.

While the `<nav>` element exists, menu bars are often cobbled together using
divs, images, buttons, click handlers, keypress handles, and ARIA.

### Support mouse users

Let's make a menu bar together. We show a bunch of items in generic box elements called divs. Any
time our user clicks on a div, it executes the corresponding command. Cool, it works for mouse
clicker people!

Next, we make it look pretty. We use CSS to line elements up nicely and put visual
outlines around them. We make it look enough like other menu bars that sighties intuitively know
that it's a menu bar and how to use it. Our menu bar even uses a different background color on any
item that the mouse is over, giving the user some helpful visual feedback.

Some menu items are parents. They spawn child submenus. Whenever the user hovers on one of these we
start an animation that slides out the child submenu.

This is all pretty inaccessible, as is the usual case for many things on the web.

### Make our menu bar keyboard accessible

Let's add keyboard accessibility. This only requires HTML changes, and not ARIA.
Remember that ARIA doesn't affect core aspects such as appearance, mouse, or
keyboard for users without assistive technologies.

Just like a web page can respond to the mouse, it can also respond to the keyboard. Our JavaScript
can listen to all keystrokes that occur and decide if the keypress is useful. If not, it throws it
back to the page like a fish that's too small to eat. Our rules are something like:

- If the user presses an arrow key, let's look at our own internal menu bar blueprints and decide what the new active menu item should be. We will clear any current highlights and highlight the new menu item so the sighted user visually knows where they are. The web page should then call `event.preventDefault()` to prevent the browser from performing the usual action (scrolling the page, in this case).
- If the user presses the <kbd>Enter</kbd> key, we can treat it just like a click, and perform the appropriate action (or even open another menu).
- If the user presses a key that should do something else, send it back to the page. For example, our menu bar doesn't need the <kbd>Tab</kbd> key, so throw it back! This is hard to get right. For example, the menu bar needs arrow keys, but not <kbd>Alt</kbd>+<kbd>Arrow</kbd> or <kbd>Command</kbd>+Arrow. Those are shortcuts for moving to the previous and next page in the web history of your browser tab. If the author isn't careful, the menu bar will eat those. This kind of bug happens a lot, and we haven't even started with ARIA yet!

### Screen reader access to our menu bar

Our menu bar was created with duct tape and divs. As a result, a screen reader has no idea what any
of it is. The background color for the active item is just a color. The menu item divs are just
plain objects with no particular meaning. Consequently, a user of our menu bar doesn't get any
instructions about what keys to press or what item they're on.

But that's no fair! The menu bar acts just fine for the sighted user.

ARIA to the rescue. ARIA lets us pretend to the screen reader that focus is in a
menu bar. If the author does everything right, our custom menu bar will look to the screen reader
just like a menu bar in a desktop application.

Our first ARIA lie is the `aria-activedescendant` attribute. Set the attribute
to the ID of the active menu item, being careful to update it whenever it
changes. For example,
`aria-activedescendant="settings-menuitem"`. This causes the screen reader to
consider our ARIA active item as the focus, which is read aloud or shown on a Braille display.
Explanation of _ancestor_ , _parent_ , and _descendant_ The term descendant refers to the
fact that an item is contained somewhere inside of another. The opposite term is ancestor, which is
to say an item is contained by ancestors. For the next container up/down, these may use the more
specific terms parent/child. For example, imagine a document with a paragraph that has a link
inside. The link's parent is a paragraph, but it also has the document as an ancestor.
Conversely, the document may have many paragraph children, each with links. The links are all
descendants of the grandparent document.

By using `aria-activedescendant` to point from the focused menu bar to a specific menu
item, the screen reader now knows where the user has moved, but nothing else about the object. What
is this div thing anyway? That's where the role attribute comes in. We use `role="menubar"` on the
containing element for the entire thing, then we use `role="menu"` on groups of items, and
`role="menuitem"` on ... drumroll ... the individual menu items.

And what if the menuitem can lead to a child menu? The user needs to know that.
For a sighted
user, there might be a little picture of a triangle at the end of the menu, but the screen reader
doesn't know how to automatically read images, at least at this point. We can add
`aria-expanded="false"` on each expandable menuitem to indicate that there is something that can
be expanded, and it isn't expanded. Additionally, the author should put
`role="none"` on the `img` triangle to indicate it's for beauty purposes only. This prevents
the screen reader from saying anything about the image that would be redundant.

## Fix keyboard bugs

Although keyboard access is a part of core HTML, it's easy to overwrite. For
example:

- A checkbox uses spacebar to toggle, but the author forgot to call `preventDefault()`. Now the spacebar both toggles the checkbox and moves the page down, which is the default browser behavior for spacebar.
- An ARIA modal dialog wants to trap tab navigation inside of it. If the author forgets to specifically allow <kbd>Control</kbd>+<kbd>Tab</kbd> to open a new tab while in the dialog, it won't work as expected.
- An author creates a selection list and implements up and down keys. However, the author still needs to add home, end, pageup, pagedown, or first letter navigation.

Authors should follow known patterns. Check out the [Resources](https://web.dev/articles/aria-poison-or-antidote.md.txt#resources) section for more information.

For pure keyboard access issues, it's useful to also try without a screen reader, or with virtual
browser mode off. You can discover keyboard bugs without a screen reader, as keyboard
access is implemented with HTML, not ARIA. After all, ARIA doesn't affect
keyboard or mouse behavior; instead, it lies to the screen reader about what's in
the web page, what's currently focused, and so on.

Keyboard bugs are almost always a bug in the web content, specifically in their HTML and JavaScript,
not in ARIA.

### Why are there so many?

There are many ways an author can get ARIA wrong. Each mistake leads to either complete
breakage or subtle differences. The subtle problems may be worse, because the author is unlikely to catch them before publishing.

After all, unless the author is an experienced screen reader user, something is going to go wrong in
the ARIA. In our menu bar example, the author could think the "option" role was to be used when "menuitem"
was correct. They could forget to use `aria-expanded`, forget to set and clear
`aria-activedescendant` at the right times, or forget to have a menu bar containing the other menus.
And what about menu item counts? Usually menu items are presented by screen readers with something
like "item 3 of 5" so that the user knows where they are. This is generally counted automatically by
the browser, but in some cases, and in some browser - screen reader combinations, the wrong numbers
might be computed, and the author would need to override these numbers with `aria-posinset` and
`aria-setsize`.

And this is just menu bars. Think of how many kinds of widgets there are. Glance at the ARIA spec or
authoring practices if you like. For each pattern, there are a dozen ways ARIA could be misused.
ARIA relies on authors to know what they're doing. What could possibly go wrong, given that most
authors are not screen reader users?

In other words, it is 100 percent necessary for actual screen reader users to try ARIA widgets before
they're considered shippable. There's too much nuance. Ideally everything would be tried with
several different browser-screen reader combinations, because of the numerous implementation
quirks, in addition to a few incomplete implementations.

## Summary

ARIA can be used to override or add to anything and everything that the HTML says.
It can make small changes to the accessibility presentation or build an entire
experience. For this reason, ARIA is both incredibly powerful and yet dangerous in the hands of
our developers who aren't screen reader users.

ARIA is a markup layer that overrides other choices. When a screen reader asks
what's happening, if ARIA exists, the user gets the ARIA version of the truth.

## Additional resources

[W3C's ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices-1.1/)
documents the important keyboard navigation characteristics of each example and
provides working JavaScript, CSS, and ARIA. The examples are focused on what
works today, and doesn't cover mobile.

### What's an accessibility API?

An accessibility API is how a screen reader or other assistive technology
knows what's in the page and what's happening. Examples include MSAA, IA2, and
UIA. There are two parts to an accessibility API:

- A "tree" of objects that represents a container hierarchy. For example, a document can contain a bunch of paragraphs. A paragraph can have text, images, links, and text decorations. Each item in the object tree can have properties, such as role (what am I?), a name or label, a user-entered value, a description, and boolean states, such as focusable, focused, required, checked. ARIA can override any of these properties.
  - Screen readers use the tree to help users navigate in virtual buffer mode, such as, "go to the next heading, please".
- A series of events that occur describing changes to the tree, like "focus is now over here!". The screen reader uses events to tell the user what just happened. When important HTML or ARIA markup changes, an event is fired to tell the screen reader that something changed.

HTML maps nicely to these accessibility APIs. When HTML is not enough, ARIA
can be added so the browser overrides the HTML semantics before sending the
object tree or events to the screen reader.
