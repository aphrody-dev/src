---
source_url: https://developer.chrome.com/docs/devtools/accessibility/navigation
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: 125472f89b56ebdc6ef60cc209db84b93b06c78e89131890b27c61a292bdfa2b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Rob Dodson [X](https://twitter.com/rob_dodson) [GitHub](https://github.com/robdodson) [Homepage](https://robdodson.me)

This guide aims to help users who primarily rely on assistive technology (AT),
such as screen readers, access and use [Chrome DevTools](https://developer.chrome.com/docs/devtools). Chrome DevTools is
a suite of web developer tools built into the Google Chrome browser. Review the
[Accessibility Reference](https://developer.chrome.com/docs/devtools/accessibility/reference.md.txt) if you're looking for DevTools features
related to improving the accessibility of a web page.

The accessibility of DevTools is a work-in-progress. Some panels and tabs work
better with AT than others. This guide walks you through the
panels which are the most accessible and highlights specific issues you may
encounter along the way.

## Overview

DevTools is divided into a series of _panels_ which are organized into an
[ARIA `tablist`](https://www.w3.org/TR/wai-aria-1.1/#tablist). For example:

- The **Elements** panel lets you view and change [DOM nodes](https://developer.chrome.com/docs/devtools/dom.md.txt) or [CSS](https://developer.chrome.com/docs/devtools/css.md.txt).
- The [**Console** panel](https://developer.chrome.com/docs/devtools/console.md.txt) lets you read JavaScript logs and live edit objects.

Within the content area of each panel, there are a number of different tools,
often referred to as _tabs_ or _panes_ in the documentation. For example, the
**Elements** panel contains additional tabs to inspect event listeners, the
accessibility tree, and much more. The distinction between tabs and panes is
somewhat arbitrary. The only reason you'll see one term or the other is to
maintain consistency with the rest of the official DevTools documentation.

## Keyboard shortcuts

The [DevTools Keyboard Shortcuts reference](https://developer.chrome.com/docs/devtools/shortcuts.md.txt) is a helpful cheatsheet. Be sure
to bookmark it and refer back to it as you explore the different panels.

## Open DevTools

To get started, read through [Open Chrome DevTools](https://developer.chrome.com/docs/devtools/open.md.txt). There are a number of
ways to open DevTools, either through keyboard shortcuts or menu items.

## Navigate between panels

You can navigate between panels by keyboard, the Command Menu, or using a
mouse or trackpad.

### Navigate by keyboard

- With DevTools open, press <kbd>Control</kbd>+<kbd>]</kbd> or <kbd>Command</kbd>+<kbd>]</kbd> (Mac) to focus the next panel.
- Press <kbd>Control</kbd>+<kbd>[</kbd> or <kbd>Command</kbd>+<kbd>[</kbd> (Mac) to focus the previous panel.
- It's also possible to use <kbd>Shift</kbd>+<kbd>Tab</kbd> to move focus into a panel's `tablist` and use the arrow keys to change panels, though it may be faster to use the previously mentioned shortcuts.

#### Known issues

- Some panels, such as the **Console** and **Performance** panels, may move focus into their content area as soon as they are activated. This can make navigating by arrow keys difficult.
- The selected panel's name is announced, but only after a screen reader has read the focused content in the panel. This can make it very easy to miss.

### Navigate by Command Menu

To focus a specific panel, use the [**Command Menu**](https://developer.chrome.com/docs/devtools/command-menu.md.txt):

1. With DevTools open, press <kbd>Control</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> or <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> (Mac) to open the **Command Menu** . The **Command Menu** is a fuzzy search autocomplete combobox.
2. Type the name of the panel you'd like to open, then use the <kbd>Down Arrow</kbd> keyboard to navigate to the correct option.
3. Press <kbd>Enter</kbd> to run a command.

For example, to open the **Elements** panel:

1. Open the **Command Menu**.
2. Type <kbd>E</kbd> then <kbd>L</kbd>. The **Panel \> Show Elements** option is selected.
3. Press <kbd>Enter</kbd> to run the command that opens the panel.

Opening a panel this way directs focus to the contents of the panel itself. In
the case of the **Elements** panel, focus moves into the **DOM Tree**.

## Elements panel

### Inspect an element on the page

1. Navigate to the element you want to inspect using the screen reader's cursor.
2. Simulate a right-mouse click on the element to open the context menu.
3. Choose the **Inspect** option. This opens the [**Elements** panel](https://developer.chrome.com/docs/devtools/dom.md.txt) and focuses the element in the **DOM Tree**.

The **DOM Tree** is laid out as an [ARIA `tree`](https://www.w3.org/TR/wai-aria-1.1/#tree). See an example in
[Navigate the **DOM Tree** with a keyboard](https://developer.chrome.com/docs/devtools/dom.md.txt#keynav).

### Copy the code for an element in the DOM Tree

1. With focus on a node in the **DOM Tree**, bring up the right-click context menu.
2. Expand the **Copy** option.
3. Select **Copy outerHTML**.

#### Known issues

- **Copy `outerHTML`** often selects the parent node, instead of the intended node. However, the contents of the element should still be in the copied within `outerHTML`.

### Modify the attributes of an element in the DOM Tree

- With focus on a node in the **DOM Tree** , press <kbd>Enter</kbd> to make it editable.
- Press <kbd>Tab</kbd> to move between attribute values. When you hear "space" you are inside of an empty text input and can type a new attribute value.
- Press <kbd>Control</kbd>+<kbd>Enter</kbd> or <kbd>Command</kbd>+<kbd>Enter</kbd> (Mac) to accept the change and hear the entire contents of the element.

#### Known issues

- When you type into the text input, you won't get feedback. If you make a typo and use the arrow keys to explore your input, you won't get feedback. The easiest way to check your work is to accept the change, then listen for the entire element to be announced.

### Edit the HTML of an element in the DOM Tree

- With focus on a node in the **DOM Tree** , press <kbd>Enter</kbd> to make it editable.
- Press <kbd>Tab</kbd> to move between attribute values. When you hear the element's name, for example, `h2`, you are inside of a text input and may change the element's type.
- Press <kbd>Control</kbd>+<kbd>Enter</kbd> or <kbd>Command</kbd>+<kbd>Enter</kbd> (Mac) to accept the change.

For example, typing `h3` and pressing <kbd>Control</kbd>+<kbd>Enter</kbd> or
<kbd>Command</kbd>+<kbd>Enter</kbd> (Mac) changes the element's start and end
tags to `h3`.

## Elements panel tabs

The **Elements** panel contains additional tabs for inspecting things like the
CSS applied to an element or its place in the accessibility tree.

- With focus on a node in the **DOM Tree** , press <kbd>Tab</kbd> until you hear that the **Styles** pane is selected.
- Use the <kbd>Right Arrow</kbd> to explore other available tabs.

The **DOM Tree** turns elements with `href` attributes into focusable links, so
you may need to press <kbd>Tab</kbd> more than once to reach the **Styles** pane.

### Known issues

The **DOM Breakpoints** and **Properties** tabs aren't keyboard accessible.

### Styles pane

In the **Styles** pane you'll find controls for filtering styles, toggling
element states (such as [`:active`](https://developer.mozilla.org/docs/Web/CSS/:active) and [`:focus`](https://developer.mozilla.org/docs/Web/CSS/:focus)), toggling classes,
and adding new classes. There is also a powerful style inspection tool to
explore and modify styles applied to the element that's in focus in the
**DOM Tree**.

The key concept to understand about the **Styles** pane is that it only shows
styles for the currently-selected node in the **DOM Tree** . For example,
suppose you're done inspecting the styles of a `<header>` node, and now you want
to look at the styles for a `<footer>` node. To do that, you must select the
`<footer>` node in the **DOM Tree**.

You may find it faster to use the [Inspect](https://developer.chrome.com/docs/devtools/accessibility/navigation.md.txt#inspect) workflow to inspect a node
that's in the general vicinity of the `footer` node (such as a link within the
footer), which focuses the **DOM Tree**, and then use your keyboard to navigate
to the exact node that you're interested in.

#### Navigate the Styles pane

Because all of the style tools connect in one way or another back to the
**Styles** pane, it makes sense to become an expert in this tool first.

- With focus on the **Styles** pane, press <kbd>Tab</kbd> to move focus inside and explore its contents.
- Press <kbd>Tab</kbd> until the first style becomes active. If you're using a screen reader, this first style is announced as "`element.style {}`".
- Press <kbd>Down Arrow</kbd> to navigate the list of styles in order of specificity. A screen reader announces each style starting with the name of the CSS file, the line number that the style appears on, and the style name itself. For example: "`main.css:233` `.card__img {}`"
- Press <kbd>Enter</kbd> to inspect a style in more detail. Focus begins on an editable version of the style name.
- Press <kbd>Tab</kbd> to move between editable versions of each CSS property and their corresponding values. At the end of each style block is a blank editable text field which you may use to add additional CSS properties.
- You may continue to press <kbd>Tab</kbd> to move through the list of styles, or press <kbd>Escape</kbd> to exit this mode and go back to navigating by arrow keys.

Read through [the Styles pane keyboard reference](https://developer.chrome.com/docs/devtools/shortcuts.md.txt#styles) for additional shortcuts.

##### Known Issues

- If you use the **Filter** editable text field, you cannot navigate the list of styles.

#### Toggle element state

To toggle an element's state, such as `:active` or `:focus`:

1. Navigate to the **Styles** pane and press <kbd>Tab</kbd> until the **Toggle Element State** button has focus.
2. Press <kbd>Enter</kbd> to expand the collection of element states. The element states are presented as a group of checkboxes.
3. Press <kbd>Tab</kbd> until the first state, `:active`, has focus.
4. Press <kbd>Space</kbd> to enable it. If the currently-selected element in the DOM Tree has an `:active` style, it's now applied.
5. Continue pressing <kbd>Tab</kbd> to explore all of the available states.

#### Add an exiting class

Adjacent to the **Toggle Element State** button is the **Element Classes**
button. Move focus to it by pressing <kbd>Tab</kbd> then <kbd>Enter</kbd>. Focus
moves into an edit text field labeled **Add New Class**.

The **Element Classes** button is primarily used for adding existing classes to
an element. For example, if your stylesheet contained a helper class named
`.clearfix` you could press `.` inside of the edit text field to see a
suggestion list of classes and use the <kbd>Down Arrow</kbd> to find the
`.clearfix` suggestion. Or type the class name out yourself and press
<kbd>Enter</kbd> to apply it.

#### Add a new style rule

Adjacent to the **Element Classes** button is the **New Style Rule** button.
Move focus to it by pressing <kbd>Tab</kbd> and press <kbd>Enter</kbd>. Focus
moves into an editable text field inside of the style inspector. The initial
text content of the field is the tag name of the element that is selected in
the **DOM Tree** . You may type any class name you want into this field and then
press <kbd>Tab</kbd> to assign CSS properties to it.

### Computed tab

With focus on the [**Computed** tab](https://developer.chrome.com/docs/devtools/css/reference.md.txt#computed), press <kbd>Tab</kbd> to move focus
inside and explore its contents. Within the **Computed** tab there are controls
for exploring which CSS properties are actually applied to an element in order
of specificity.

#### Explore all computed styles

Press <kbd>Tab</kbd> until you reach the collection of computed styles. These
are presented as an ARIA `tree`. Expanding a listbox reveals which CSS selectors
are applying the computed style. These selectors are organized by specificity.

A screen reader announces the computed value, which CSS selector is matching,
the filename of the stylesheet that contains the selector, and the line number
for the selector.

#### Known issues

- If you use the **Filter** text field you will no longer be able to inspect styles.

### Event listeners tab

From within the **Elements** panel you may inspect the event listeners applied
to an element using the **Event Listeners** tab. With focus on the **Styles**
pane, press the <kbd>Right Arrow</kbd> to navigate to the **Event Listeners**
tab.

#### Explore event listeners

Event listeners are presented as an ARIA `tree`. You may use the arrow keys to
navigate them. A screen reader announces the name of the DOM object that the
event listener is attached to, as well as the filename where the event listener
is defined and its line number.

### Accessibility pane

With focus on the [**Accessibility** pane](https://developer.chrome.com/docs/devtools/accessibility/reference.md.txt#pane), press <kbd>Tab</kbd> to move
focus inside and explore its contents. Within the **Accessibility** pane there
are controls for exploring the accessibility tree, the ARIA attributes applied
to an element, and its computed accessibility properties.

#### Accessibility Tree

The **Accessibility Tree** is presented as an ARIA `tree` where each `treeitem`
corresponds to an element in the DOM. The tree announces the computed role for
the selected node. Generic elements, such as `div` and `span`, are announced as
"GenericContainer" in the tree. Use the arrow keys to traverse the tree and
explore parent-child relationships.

#### Known issues

- The type of ARIA tree used by the **Accessibility** pane may be unavailable in Chrome for mac OS screen readers, such as VoiceOver. Subscribe to [Chromium issue #868480](https://bugs.chromium.org/p/chromium/issues/detail?id=868480) to be informed about progress on this issue.
- The **ARIA Attributes** and **Computed Properties** sections are marked up as ARIA trees, but they don't include focus management. This means these sections aren't keyboard operable.

## Audits panel

The **Audits** panel lets you run a series of tests against a site to check for
common issues related to performance, accessibility, SEO, and a number of other
categories.

### Configure and run an audit

1. When the **Audits** panel is first opened, focus is placed on the **Run Audit** button at the end of the form. By default the form is configured to run audits for every category using mobile emulation on a simulated 3G connection.
2. Use <kbd>Shift</kbd>+<kbd>Tab</kbd> or navigate back in Browse mode to change the audit settings.
3. When you're ready to run the audit, navigate back to the **Run Audit** button and press <kbd>Enter</kbd>.
4. Focus moves into a modal window with a **Cancel** button which lets you exit the audit. You may hear a series of earcons as the audit runs and refreshes the page multiple times.

#### Known issues

- The different sections of the configuration form aren't marked up with a `fieldset` element. It may be easier to navigate them in Browse mode to figure out which controls are associated with each section.
- There is no earcon or live region announcement when the audit is finished running. Generally it takes about 30 seconds, after which you should be able to navigate to the results. Use Browse mode to quickly reach the results.

### Navigate the audit report

The audit report is organized into sections that correspond with each of the
audit categories. The report opens with a list of scores for each category.
These scores are also links which can be used to skip to the relevant sections.
Within each section are expandable `details` elements, which contain information
relating to passed or failed audits. By default, only failing audits are shown.
Each section ends with a final `details` element which contains all of the
passed audits.

To run a new audit, use <kbd>Shift</kbd>+<kbd>Tab</kbd> to exit the report and
look for the **Perform An Audit** button.
