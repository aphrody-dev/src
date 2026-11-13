---
source_url: https://developer.chrome.com/docs/lighthouse/performance/dom-size
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: b847d71273d10092dc8a7cae000bd1049467486908b7503f4cb094702a2e8ca3
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has moved into the [Optimize DOM size](https://developer.chrome.com/docs/performance/insights/dom-size.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

A large DOM tree can slow down your page performance in multiple ways:

- **Network efficiency and load performance**

  A large DOM tree often includes many nodes that aren't visible when the user
  first loads the page, which unnecessarily increases data costs for your users
  and slows down load time.
- **Runtime performance**

  As users and scripts interact with your page,
  the browser must constantly
  [recompute the position and styling of nodes](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations).
  A large DOM tree in combination with complicated style rules can severely slow down rendering and [interactivity](https://web.dev/articles/dom-size-and-interactivity).
- **Memory performance**

  If your JavaScript uses general query selectors such as `document.querySelectorAll('li')`,
  you may be unknowingly storing references to a very large number of nodes,
  which can overwhelm the memory capabilities of your users' devices.

## How the Lighthouse DOM size audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
reports the total DOM elements for a page, the page's maximum DOM depth,
and its maximum child elements:
 Lighthouse highlights excessive DOM size details

Lighthouse flags pages with DOM trees that:

- Warns when the body element has more than \~800 nodes.
- Errors when the body element has more than \~1,400 nodes.

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to optimize the DOM size

In general, look for ways to create DOM nodes only when needed,
and destroy nodes when they're no longer needed.

If you're shipping a large DOM tree,
try loading your page and manually noting which nodes are displayed.
Perhaps you can remove the undisplayed nodes from the initially loaded document
and only create them after a relevant user interaction,
such as a scroll or a button click.

If you create DOM nodes at runtime,
[Subtree Modification DOM Change Breakpoints](https://developer.chrome.com/docs/devtools/dom.md.txt)
can help you pinpoint when nodes get created.

If you can't avoid a large DOM tree,
another approach for improving rendering performance is simplifying your CSS selectors.
See Google's [Reduce the Scope and Complexity of Style Calculations](https://web.dev/reduce-the-scope-and-complexity-of-style-calculations)
for more information.

For more details see the [How large DOM sizes affect interactivity, and what you can do about it](https://web.dev/articles/dom-size-and-interactivity) article.

## Stack-specific guidance

### Angular

If you're rendering large lists, use [virtual scrolling](https://web.dev/articles/virtualize-lists-with-angular-cdk) with the Component Dev Kit (CDK).

### React

- Use a "windowing" library like [`react-window`](https://web.dev/articles/virtualize-long-lists-react-window) to minimize the number of DOM nodes created if you are rendering many repeated elements on the page.
- Minimize unnecessary re-renders using [`shouldComponentUpdate`](https://reactjs.org/docs/optimizing-performance.html#shouldcomponentupdate-in-action), [`PureComponent`](https://reactjs.org/docs/react-api.html#reactpurecomponent), or [`React.memo`](https://reactjs.org/docs/react-api.html#reactmemo).
- [Skip effects](https://reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects) only until certain dependencies have changed if you are using the `Effect` hook to improve runtime performance.

## Resources

- [Source code for **Avoid an excessive DOM size** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/dom-size.js)
- [Reduce the Scope and Complexity of Style Calculations](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations)
