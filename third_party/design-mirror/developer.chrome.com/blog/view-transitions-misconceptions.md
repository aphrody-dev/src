---
source_url: https://developer.chrome.com/blog/view-transitions-misconceptions
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:36+00:00
sha256: 7e374023b1a76d0c97db99f03ea42fe6b443c37046d4ca1afa6cad24e016a8a7
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Bramus [X](https://twitter.com/bramus) [GitHub](https://github.com/bramus) [Mastodon](https://front-end.social/@bramus) [Bluesky](https://bsky.app/profile/bram.us) [Homepage](https://www.bram.us/)

The View Transition API is a web development game changer. Whether your website is single or multi-page, this powerful API lets you create seamless transitions between views, resulting in native-like experiences that captivate users. Currently available in Chrome, with same document view transitions soon to be available in Safari.

With more and more people starting to look into the View Transition API, it's time to debunk some misconceptions.

## Misconception 1: The View Transition API takes screenshots

When running a view transition, the API takes snapshots of the old and new state of the content. These snapshots then get animated, as detailed in [the "How these transitions work"-section of the documentation](https://developer.chrome.com/docs/web-platform/view-transitions/same-document.md.txt#how_these_transitions_work).

While you can use the term screenshot for the old snapshot, the new snapshot is not a screenshot but actually a live representation of the node. Think of it as a replaced element.

    ::view-transition
    └─ ::view-transition-group(root)
       └─ ::view-transition-image-pair(root)
          ├─ ::view-transition-old(root) 👈 Screenshot
          └─ ::view-transition-new(root) 👈 Live representation

Thanks to this live aspect, [demos like this one](https://simple-set-demos.glitch.me/video/) work: the video--sourced from the new snapshot--keeps playing while the view transition is happening.
A playing video participating in a view transition [Minimal demo](https://simple-set-demos.glitch.me/video/). [Source](https://glitch.com/edit/#!/simple-set-demos?path=video%2Fstyles.css%3A2%3A21).

The logic and CSS used for this is [detailed in our documentation](https://developer.chrome.com/docs/web-platform/view-transitions/same-document.md.txt#transitioning-without-freezing).

## Misconception 2: Capturing more than one element results in multiple view transitions running

When you capture multiple elements, the snapshotting process will capture all old and new states. When you capture a `.box` in addition to the `:root` element, you get this pseudo tree:

    ::view-transition
    └─ ::view-transition-group(root)
    |  └─ ::view-transition-image-pair(root)
    |     ├─ ::view-transition-old(root)
    |     └─ ::view-transition-new(root)
    └─ ::view-transition-group(box)
       └─ ::view-transition-image-pair(box)
          ├─ ::view-transition-old(box)
          └─ ::view-transition-new(box)

While this tree contains multiple snapshot pairs only a single view transition is run.

Currently, Chrome is limited to running one view transition per document at the same time. [Try clicking rapidly in this demo](https://codepen.io/web-dot-dev/full/rNEVmmp) to start a new view transition. You'll notice the ongoing transition skips to the end when a new one starts.

> [!NOTE]
> **Note:** In the future, with element-scoped transitions, you will be able to run a transition on a subtree of the DOM and it will also be possible to have concurrent transitions in a single document--as long as they don't share snapshotted elements.

## Misconception 3: You can't implement view transitions because of browser support

Many developers are concerned they can't implement view transitions because it's only supported on Chrome. Some good news here is that Safari is working on this and will include it in [the upcoming Safari 18 release](https://developer.apple.com/documentation/safari-release-notes/safari-18-release-notes).

But still, don't let spotty browser support prevent you from implementing view transitions today. View transitions are the perfect material for [progressive enhancement](https://piccalil.li/blog/its-about-time-i-tried-to-explain-what-progressive-enhancement-actually-is/). [The original documentation](https://developer.chrome.com/docs/web-platform/view-transitions/same-document.md.txt) shares a method of adding this methodology to your code.

```javascript
function handleClick(e) {
    // Fallback for browsers that don't support this API:
    if (!document.startViewTransition) {
        updateTheDOMSomehow();
        return;
    }

    // With a View Transition:
    document.startViewTransition(() => updateTheDOMSomehow());
}
```

If your browser supports [same-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/same-document.md.txt) you get the enriched, animated, version. If your browser doesn't then you get the current experience. Over time, as more and more browsers support view transitions, more users will get to experience this enriched version, all automatically.

The same thing applies to [cross-document view transitions](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document.md.txt). Browsers that don't support them will ignore the [CSS opt-in](https://developer.chrome.com/docs/web-platform/view-transitions/cross-document.md.txt#cross-document_view_transitions_are_opt-in) when parsing stylesheets.

This approach was successfully implemented in ecommerce, as [detailed in this case study](https://developer.chrome.com/blog/css-ui-ecommerce-vt.md.txt)

> [!NOTE]
> **Note:** Don't forget to respect the user's reduced motion preference too. This can be done in your JavaScript or in CSS by wrapping all those names or animations in the `@media (prefers-reduced-motion: no-reduce)` conditional. If no elements have been captured or there are no animations to run, the view transition swaps out the old DOM with the new DOM without any animation happening. [Learn more about motion and accessibility](https://web.dev/learn/accessibility/motion).

## Misconception 4: View transitions break incremental rendering

There are [claims that view transitions break incremental rendering](https://frontendmasters.com/blog/view-transitions-break-incremental-rendering/). This is not true: Cross-document view transitions were specified to not break this fundamental aspect of the web.

Browsers start rendering a page when they have "enough" content. This is--in most browsers--after loading all stylesheets in the `<head>`, parsing all render-blocking JavaScript in the `<head>`, and loading sufficient markup. Cross-document view transitions don't change this: the content required for [First Contentful Paint](https://web.dev/articles/fcp) is unaltered. After this first render, the browser can--and will--incrementally render newly received content.

You can choose to block rendering until a certain element is present in the DOM. This is convenient in situations where you want to be sure that the elements participating in the view transition are present on the new page.

To do so, use this link tag:

```html
<link rel="expect" blocking="render" href="#elementId">
```

This overrides the browser's heuristics used to decide when to perform its first render: the first render gets delayed until the specified element is present in the DOM tree.

This manual blocking has some safeguards built in. For example, when the closing `</html>` tag is seen but the blocking element was not, rendering will no longer be blocked. Additionally, you can add your own timeout logic which removes the blocking attribute at any point in time.

It is evident that render blocking should be used with caution. The impact of blocking rendering needs to be evaluated on a case by case basis. By default, avoid using `blocking=render` unless you can actively measure and gauge the impact it has on your users, by measuring the impact to your [performance metrics](https://web.dev/articles/user-centric-performance-metrics).

## Misconception 5: The snapshotting process is slow or expensive

While the View Transition API prepares the new view and gets its snapshots, the old view remains visible to the user. Because of this, a user gets to see the old page a little bit longer than without view transitions. This delay is negligible though, in reality only a few frames. In Chrome, the impact of `pageswap` for example is two stale frames at most: One to execute the logic plus one extra frame to ensure snapshots have been composited and cached.

Furthermore, the data for the snapshots is taken directly from the compositor, so there are no extra layout or repaint steps that need to happen in order to get the snapshot data.

## Bonus Misconception: It's the View Transitions API

When talking about view transitions, people often refer to the "View Transitions API". This is incorrect. The API is called the "View Transition API"--note the singular "Transition".

The misconception stems from some articles--including at one point our [own docs on DCC](https://developer.chrome.com/docs/web-platform/view-transitions.md.txt)--using the wrong term.

The trick to remembering the correct name is you use the (one) View Transition API to create (one or more) view transitions.
