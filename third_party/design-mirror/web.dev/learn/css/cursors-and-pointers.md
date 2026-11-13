---
source_url: https://web.dev/learn/css/cursors-and-pointers
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: 018afc218cc20fb16eb99e9e06747aa090005782857f6e1f8214b407a2417f50
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

On non-touchscreen devices, the cursor is an essential way for your users to know what they are interacting with. You can also provide useful hints on how an element can be interacted with, or how a movement with a trackpad or mouse will impact your site.

## Cursors

Browsers automatically handle some common use cases for cursors.

If you are reading this on a device with a cursor, explore the page. It's possible you haven't noticed how cursors change before, but note the hints that it provides. When your pointer goes over text, the cursor changes to a selection I-beam that suggests that you can select the text. If you hover over a link, the cursor changes to a hand pointing with the index finger, suggesting that you can take an action. Everywhere else will have a default cursor, which is often an arrow.

As you make more interactive sites, you will want to customize the cursor so users can more readily understand the interactions.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/empMqZe?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen empMqZe by web-dot-dev on Codepen">
</iframe>

Browsers support a range of keywords for the [cursor property](https://developer.mozilla.org/docs/Web/CSS/cursor) that provide hints for dragging, resizing, selection, and more.

If none of the supported cursors communicate an element's interactions, you can also provide an SVG or PNG image to be used as a cursor.

## Carets

An insertion caret is used to show your position in editable text. This is different from your cursor, as it doesn't follow your mouse. You can change the color with `caret-color`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/xbwWvVJ?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen xbwWvVJ by web-dot-dev on Codepen">
</iframe>

## Responding to a user's pointer inputs

Users with a mouse or trackpad are able to interact with a more precise point on the screen than users with a touchscreen. If you design only for the precision of a mouse, users with touchscreens or fine motor control issues may not be able to interact with your page as they need.

Common issues include buttons that are too small or interactive elements that are too close to each other. These make it difficult for users to interact with the correct element.

Ensuring your buttons and other interactive targets are large enough is an important step in ensuring your site is accessible. You can also customize your styles based on the precision of the user's input devices with `pointer` and `any-pointer` media queries.

The `pointer` media feature refers to the user's primary input device, while `any-pointer` refers to all input devices. You can match devices like mice with `fine` and devices like touchscreens with `coarse`. The `none` value indicates the user is not using an input device with a pointer.

## Pointer and touch events

### Disabling specific touchscreen gestures

When you're using a touchscreen, the browser handles some common gestures. For example, touching the screen with two fingers and spreading them apart usually zooms in on the site. While you don't have to implement those behaviors on your site, you may want to disable or override that behavior in certain cases.

<iframe src="https:///frame/learn/css/cursors-and-pointers/index_5f51cbfb67e82825eae31bfab91ff2ae2ca17457b3b00e68485e8e7c82bce411.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

To opt out of the browser handling some actions, list the actions you do want the element to handle. `pan-x` and `pan-y` enable single-finger panning gestures. These can be enabled along with `pinch-zoom` which enables multi-finger zooming and panning.

The `manipulation` keyword is equivalent to `pan-x pan-y pinch-zoom`. `manipulation` excludes other touch behaviors that require multiple touches in a short time, like double tap to zoom.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/pvjLMbP?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen pvjLMbP by web-dot-dev on Codepen">
</iframe>

After you disable browser handling of an action by excluding it from `touch-action`, you can set up pointer events for that action.

> [!NOTE]
> **Note:** You should be careful when disabling touch actions that you are not causing accessibility issues. For example, removing the ability for a user to zoom in on the whole page may make your design more stable, but it also may make it more difficult for people with visual impairments to access the content.

### Disabling all events and actions

In some cases, you may want to specify that an element is not interactive. By setting `pointer-events: none` on a button, for example, you won't be able to click the button, or even trigger a hover state.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/azvYeZK?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen azvYeZK by web-dot-dev on Codepen">
</iframe>

## Check your understanding

What property controls pointer events for gestures on a touchscreen?
`pointer-events` Incorrect. `manipulation` Incorrect. `interactivity` Incorrect. `touch-action` Correct! If a user has a touchscreen with a mouse as a secondary input connected to the same device, which media queries will match?
`@media (pointer: coarse)` Correct! `@media (pointer: fine)` Incorrect. `@media (any-pointer: coarse)` Correct! `@media (any-pointer: fine)` Correct!
