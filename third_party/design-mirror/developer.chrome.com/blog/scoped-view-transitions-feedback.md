---
source_url: https://developer.chrome.com/blog/scoped-view-transitions-feedback
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:15+00:00
sha256: da72557a6cac680893b3d2073247ae652b9c57c016f1642c67f10f97fe19026b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Bramus [X](https://twitter.com/bramus) [GitHub](https://github.com/bramus) [Mastodon](https://front-end.social/@bramus) [Bluesky](https://bsky.app/profile/bram.us) [Homepage](https://www.bram.us/)

Published: Sep 10, 2025

Scoped view transitions is a proposed extension to the [View Transition API](https://developer.chrome.com/docs/web-platform/view-transitions.md.txt) which lets you start a view transition on a subtree of the DOM. The feature is ready for testing from Chrome 140 with the "Experimental Web Platform features" flag enabled in `chrome://flags`. We're actively looking for developer feedback.

## Quick intro

To start a scoped view transition, call `element.startViewTransition()` (instead of `document.startViewTransition()`) on any `HTMLElement` with `contain: layout` applied to it.

```javascript
document.querySelector("nav").startViewTransition({
  callback: () => {
    // ... code that manipulates the contents of <nav>
  },
});
```

The result is a view transition scoped to the subtree of your chosen `HTMLElement`, with the resulting `::view-transition` pseudo-tree getting injected onto that `HTMLElement`. The `HTMLElement` acts as a container for the transition animations.

    html
      ├─ head
      └─ body
         ├─ nav
         │  ├─ ::view-transition
         │  │  └─ ::view-transition-group(thing)
         │  │     └─ ::view-transition-image-pair(thing)
         │  │        ├─ ::view-transition-old(thing)
         │  │        └─ ::view-transition-new(thing)
         │  └─ ul
         │     ├─ li
         │     ├─ li
         │     └─ li
         └─ main
            └─ ...

Scoped transitions allow multiple view transitions to run at the same time (as long as they have different transition roots). Pointer events are prevented on only that subtree ([which you can re-enable](https://www.bram.us/2025/01/29/view-transitions-page-interactivity/)), rather than the whole document. In addition, they allow elements outside of the transition root to be painted on top of the scoped view transition.

Learn all about scoped view transitions in [the scoped view transitions explainer](https://github.com/WICG/view-transitions/blob/main/scoped-transitions.md).

## Demo

In the following demo, you can move a dot within its container by clicking one of the buttons. This can be done with document-scoped view transitions or element-scoped view transitions, allowing you to see how they behave differently.

### Live Demo

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/ogjOjyd?height=700&amp;default-tab=result" style="height: 700px; width: 100%; border: 0;" title="View Transitions: Document-Scoped vs Element-Scoped"></iframe>

### Demo Recording

With scoped view transitions, the dot remains clipped by its parent during the transition. Furthermore the dot does not paint over the popover when shown.

## Feedback wanted

We're interested in feedback from the web developer community about:

- The shape of the Scoped View Transitions API.
- Use-cases where the feature works well or didn't work as expected.
- How the questions about [self-participating scopes](https://docs.google.com/document/d/1I_38aS2_W1iKT35wClsKvoJ8JYDPCmuVuhPmowSG6pU/edit?tab=t.0#heading=h.50yc5154aelq) should be resolved.

Share your feedback by commenting on [CSS WG issue #9890](https://github.com/w3c/csswg-drafts/issues/9890). Familiarize yourself with the [known issues](https://github.com/WICG/view-transitions/blob/main/scoped-transitions.md#known-issues) and [constraints](https://github.com/WICG/view-transitions/blob/main/scoped-transitions.md#constraints) before leaving feedback.

If you run into a bug, [file a Chromium bug](https://crbug.com/new) to let us know.
