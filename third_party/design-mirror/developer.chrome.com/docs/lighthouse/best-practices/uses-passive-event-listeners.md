---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: 2e8366b6fff4276d55975be08f350471e2228572df09c814fe15dc9954e12f77
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has been removed as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

Touch and wheel event listeners are useful
for tracking user interactions and creating custom scrolling experiences,
but they can also delay page scrolling.
Currently, browsers can't know if an event listener will prevent scrolling,
so they always wait for the listener to finish executing before scrolling the page.
Passive event listeners solve this problem by letting you indicate
that an event listener will never prevent scrolling.

## Browser compatibility

Most browsers support passive event listeners. See
[Browser compatibility](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener#Browser_compatibility)

## How the Lighthouse passive event listener audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
flags event listeners that may delay page scrolling:

Lighthouse uses the following process
to identify event listeners that may affect scrolling performance:

1. Collect all event listeners on the page.
2. Filter out non-touch and non-wheel listeners.
3. Filter out listeners that call `preventDefault()`.
4. Filter out listeners that are from a different host than the page.

Lighthouse filters out listeners from different hosts
because you probably don't have control over these scripts.
There may be third-party scripts that are harming your page's scrolling performance,
but these aren't listed in your Lighthouse report.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## How to make event listeners passive to improve scrolling performance

Add a `passive` flag to every event listener that Lighthouse identified.

If you're only supporting browsers that have passive event listener support,
just add the flag. For example:

```javascript
document.addEventListener('touchstart', onTouchStart, {passive: true});
```

If you're supporting [older browsers that don't support passive event listeners](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener#Browser_compatibility),
you'll need to use feature detection or a polyfill. See the
[Feature Detection](https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md#feature-detection)
section of the WICG [Passive event listeners](https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md)
explainer document for more information.

## Resources

- [Source code for **Does not use passive listeners to improve scrolling performance** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/uses-passive-event-listeners.js)
- [Improving Scrolling Performance with Passive Event Listeners](https://developer.chrome.com/blog/passive-event-listeners.md.txt)
- [Passive event listeners explainer](https://github.com/WICG/EventListenerOptions/blob/gh-pages/explainer.md)
- [EventTarget.addEventListener()](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)
