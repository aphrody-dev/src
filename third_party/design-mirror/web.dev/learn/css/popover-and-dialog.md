---
source_url: https://web.dev/learn/css/popover-and-dialog
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:36+00:00
sha256: 21a22eedbfac61ad0e41f57d98f7299d530d115db2a2b13c808fa6783feea11d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
<iframe src="https:///frame/learn/css/popover-and-dialog/index_76d3d94ec159048016d62789a639cca432cc7f10dc84f5e68e01d2f0b49280a9.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

A popover is any element with a `popover` attribute, and is useful for a wide range of interactive patterns, including tooltips, alerts, toasts and more.

```html
<div id="my-popover" popover>My popover content</div>
```

The `popover` attribute hides the element by default, and you have to provide a way for users to open it. While popovers are placed in the top layer, above all other content, they are not modal. This means you can still interact with content outside of the popover.

> [!NOTE]
> **Note:** You can use `popover` on a `<dialog>` element. This will give you the semantics and accessibility of a non-modal dialog, and the behavior of a popover.

## Controlling popovers

Before we explore the different kinds of popovers and how they behave, look at how to open and close your popovers.

### Declaratively

Popovers can be controlled entirely in HTML, without needing to use JavaScript, using buttons (and inputs with the `button` type) and the `popovertarget` attribute.

The popover in the previous code snippet has an `id` of `my-popover`, and you can use this to refer to the popover.

```html
<button popovertarget="my-popover">Toggle</button>
```

You can also specify if a button should open or close a popover using `popovertargetaction="show"` and `popovertargetaction="hide"`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/OPyZpJL?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen OPyZpJL by web-dot-dev on Codepen">
</iframe>

### With JavaScript

You can also control a popover using JavaScript, which is useful when you want to show a popover in response to something besides a user's click a button. To do this, you need to get the popover element, and then call `showPopover()`, `hidePopover()`, or `togglePopover()`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/KwdRWKg?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen KwdRWKg by web-dot-dev on Codepen">
</iframe>

## Types of popovers

When you add a popover to your site, there are a lot of interactions to consider. How does it open? How can users dismiss it? What happens to other open popovers? There are three types of popovers, and you can choose the type that provides behavior and interactions required by your use case.

### Auto popovers

Auto popovers have the most functionality built in, and are the default if you don't specify a type.

```html
<div id="popover" popover>My popover</div>
```

In many cases, you don't want to have multiple popovers open at the same time, so auto popovers close other auto popovers when they are opened. They also support "light dismiss", meaning if you click outside of the popover, it closes automatically. It can also be closed with the <kbd>Esc</kbd> key.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/MYaGpwp?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen MYaGpwp by web-dot-dev on Codepen">
</iframe>

### Manual popovers

While the auto popover behavior covers a lot of use cases, there are instances where you may need more control of your popovers. With manual popovers, you have a lot more control, and are also responsible for a lot more of the behavior.

```html
<div id="popover" popover="manual">My popover</div>
```

This popover will only close when you explicitly close it--it can't be closed by light dismiss or the `Esc` key. It does allow you to open multiple popovers simultaneously.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/wBKjJKa?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen wBKjJKa by web-dot-dev on Codepen">
</iframe>

### Hint popovers

<iframe src="https:///frame/learn/css/popover-and-dialog/index_64ce07e6aa9daf7bf04f4145e9b30e5bc603989a2070a5e510735e8e7e91ec1a.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

You may also want to use popovers to add tooltips to your page. In this pattern, you want to be able to hover over an item, and see a description. Only one should be open at a time. If you use auto popovers, opening one will close any other open auto popovers. If you use manual popovers, you need to manually implement a lot of the behavior, including closing other popovers. Hint popovers provide a third option with behavior similar to auto popovers. However, opening a hint popover doesn't close auto popovers.

```html
<div id="popover" popover="hint">My popover</div>
```

Hint popovers are useful for supplementary information that is secondary to the primary content. You'll often want to trigger hint popovers with non-click events like hover or focus.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/dPYevYQ?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen dPYevYQ by web-dot-dev on Codepen">
</iframe>

## Positioning your popover

By default, your popovers will open up in the middle of the screen. They are added to the top layer, above all your other content, and can be positioned relative to the viewport.

This isn't always ideal, as you often want to place your popover close to the item that triggers them. [Anchor positioning](https://web.dev/learn/css/anchor-positioning.md.txt) provides a way to do that.

<iframe src="https:///frame/learn/css/popover-and-dialog/index_15b73af344fdb5ea97398e4d70a442c08d2b13e6f49fccb1ae778d294f096665.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

There are two steps to anchor positioning- defining the anchor element and placing your element relative to that anchor. Popovers can handle the first step, by setting an implicit anchor for you. When you open a popover using `<button popovertarget>`, the button is the implicit anchor. If you're opening a popover using JavaScript, you can set the implicit anchor with the `source` option.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/XJmqMXz?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen XJmqMXz by web-dot-dev on Codepen">
</iframe>

By default, a popover is centered using `margin: auto`. To use anchor positioning, you'll likely need to override that by setting `margin: unset`.

## Styles and animations

### The ::backdrop pseudo element

Popovers open in a top layer, above all the other content on your page. Below the popover is a `::backdrop` pseudo element that can be styled.

It's important to note that the content outside a popover is not inert-you can still click buttons and use your keyboard to navigate the page. You shouldn't obscure the page contents, for example, by applying a heavy blur effect or setting the background to an opaque color.

### The :popover-open pseudo class

Say you want to layout your popover content using CSS Grids. You add `[popover]{ display: grid }`, and suddenly all your popovers are visible. This is because popovers are hidden using `display: none`. You can use the `:popover-open` pseudo class to apply styles only when the popover is open.

```css
[popover]{
/* Don't do this! All popovers will be visible.  */
  display: grid;
}

[popover]:popover-open {
/*  This will only affect open popovers. */
  display: grid;
}
```

`:popover-open` is also useful when you are animating a popover.

### Animating popovers

There are 3 steps in a popover's animation:

1. `@starting-style {popover:popover-open { } }`-The initial styles for the popover as soon as it is visible. Note that this needs to be defined in your stylesheet after #2.
2. `popover:popover-open { }`-The styles for the popover when it is open.
3. `popover { }`-The styles the popover goes to as it closes.

A popover is hidden using `display: none` when it is not open. To animate this, you will need to set `transition-behavior: allow-discrete`, and also add `display` to the list of properties in `transition`.

If you are positioning your popover with an implicit anchor, you will need to also add `overlay` in the list of properties in `transition`. The implicit anchor relationship is removed once the popover is removed from the top layer, so adding a transition to the `overlay` property delays that until the exit transition is complete.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/XJmqMdV?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen XJmqMdV by web-dot-dev on Codepen">
</iframe>

## Interactions between popovers

You likely will have multiple popovers on a page, and how they interact depends on their type and how they are used.

### Nested popovers

In some cases, you may need to open a popover from inside another popover. For example, you may have a popover menu, and one of the menu items opens a submenu. When the user closes the main menu, you don't want the submenu to stay open. Popovers can help handle that automatically.

If you are opening a hint popover from a hint popover, or an auto popover from an auto popover, the popovers are put into a stack. Closing a popover also closes all popovers after it in the stack. This also works with light dismiss---if you click a popover, all popovers after it in the stack will close, but earlier popovers will stay open.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/raOvyLY?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen raOvyLY by web-dot-dev on Codepen">
</iframe>

A popover is added to the stack if its source element is inside a popover. The source element is set automatically when you use `popovertarget` on a button, or with JavaScript by setting the `source` option when calling `.showPopover({source})` or `.togglePopover({source})`.

There's a stack for auto popovers, and a separate stack for hint popovers. However, if you open a hint popover from inside an auto popover, it gets added to the auto stack.

Remember that hint popovers are intended for simpler, transient information, so you can't trigger an auto popover from a hint popover.

If you're using manual popovers, you need to manage all of this manually.

### Closing other popover types

You've learned that opening an auto popover closes other auto popovers, but how do the different types interact? Explore this with an example of a page that uses all three types. There is a navigation menu with buttons that use auto popovers to open and close. There is text on the page that uses hint popovers to show contextual tooltips. And finally, there is a toast with a manual popover to let the user know a background task completed.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/OPyZpRP?height=250&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen OPyZpRP by web-dot-dev on Codepen">
</iframe>

The tooltips are ephemeral, and appear when we mouse over the text. We only expect one tooltip to be visible at a time, and triggering a second hint popover closes the first.

When you open the menu by clicking on a button, the hint closes for two reasons. First, the click outside the hint triggers a light dismiss. Second, opening an auto popover dismisses all open hint popovers. This is because the user has changed what they are focusing on, and the ephemeral content in a hint popover is no longer relevant. This means that if you call `showPopover()` on an auto popover, any open hint popover will close.

The drop-down menus are auto popovers. With drop-down menus, you expect only one to be open at a time, and opening one closes the other. As you saw, opening an auto popover also closes any open hint popovers as well.

However, while a drop-down menu is open, you still may want to view the content of an unrelated tooltip. Showing a hint tooltip does not close auto popovers.

The manual popover is unaffected by the auto or hint popovers, and when it opens, it doesn't close any hint or auto popovers. However, if you open a manual popover by clicking on a button, this does trigger a light dismiss of hint and auto popovers.

The interactions between the popover types may seem complex, but they allow for common use patterns if you use the types in the correct situations. If your popovers aren't interacting as expected, revisit which types you are using.

## Check your understanding

Which are valid popover types?
`hint` Correct! `auto` Correct! `dialog` Incorrect. `manual` Correct! What types of popover are modal, meaning the background is inert?
None Correct! `hint` Incorrect. `auto` Incorrect. `manual` Incorrect. When you open an `auto` popover, what other popovers are closed automatically?
`hint` Correct! `auto` Correct! `manual` Incorrect. When you open a `hint` popover, what other popovers are closed automatically?
`hint` Correct! `auto` Incorrect. `manual` Incorrect.
