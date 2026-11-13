---
source_url: https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: 424d6d325e19061de5834154c33acd5bf429efd74b0053e7d52182c65d5f87e2
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Find which navigations were blocked from using the bfcache, and why.

Chris Mills [X](https://twitter.com/chrisdavidmills) [GitHub](https://github.com/chrisdavidmills) [LinkedIn](https://www.linkedin.com/in/chris-mills-4471711) Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

The `notRestoredReasons` property, added to the [`PerformanceNavigationTiming`](https://developer.mozilla.org/docs/Web/API/PerformanceNavigationTiming) class, reports information on whether frames present in the document were blocked from using the [bfcache](https://web.dev/articles/bfcache) on navigation, and why. Developers can use this information to identify pages that need updates to make them bfcache-compatible, thereby improving site performance.

## Current status

The `notRestoredReasons` API has shipped from Chrome 123 and is being rolled out gradually.

> [!NOTE]
> **Note:** Differences since the origin trial.
>
> From Chrome 109 until 114
> [the API was available as an origin trial](https://developer.chrome.com/origintrials#/view_trial/3101854243351429121).
> This had a number of differences to the shipped API following feedback through the standardisation process:
>
> - A `blocked` boolean (named `preventedBackForwardCache` in previous iterations) indicated whether the bfcache was blocked. This was removed as it can be inferred from the presence of blocking reasons.
> - The `reasons` value, was an array of strings but is now an array of objects.
> - The reason texts were updated (see [note about avoid depending on specific text](https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons.md.txt#avoid-depending-on-reason-text)).
> - Empty attributes were represented as empty strings (`""`) but now are `null`.

## Concepts and usage

Modern browsers provide an optimization feature for history navigation called the [back/forward cache](https://web.dev/articles/bfcache) (bfcache). This enables an instant loading experience when users go back to a page they have already visited. Pages can be blocked from entering the bfcache or get evicted while in bfcache for different reasons, some required by a specification and some specific to browser implementations.

Previously, there was no way for developers to find out why their pages were blocked from using the bfcache in the field, though there was a [test in Chrome dev tools](https://web.dev/articles/bfcache#test_to_ensure_your_pages_are_cacheable). To enable monitoring in the field, the [`PerformanceNavigationTiming`](https://developer.mozilla.org/docs/Web/API/PerformanceNavigationTiming) class has been extended to include a `notRestoredReasons` property. This returns an object containing related information on the top frame and all iframes present in the document:

- Reasons why they were blocked from using the bfcache.
- Details such as frame `id` and `name`, to help identify iframes in the HTML.

  This allows developers to take action to make those pages bfcache-compatible, thereby improving site performance.

## Examples

A [`PerformanceNavigationTiming`](https://developer.mozilla.org/docs/Web/API/PerformanceNavigationTiming) instance can be obtained from features such as [`Performance.getEntriesByType()`](https://developer.mozilla.org/docs/Web/API/Performance/getEntriesByType) and [`PerformanceObserver`](https://developer.mozilla.org/docs/Web/API/PerformanceObserver).

For example, you could invoke the following function to return all `PerformanceNavigationTiming` objects present in the performance timeline and log their `notRestoredReasons`:

```javascript
function returnNRR() {
  const navEntries = performance.getEntriesByType("navigation");
  for (let i = 0; i < navEntries.length; i++) {
    console.log(`Navigation entry ${i}`);
    let navEntry = navEntries[i];
    console.log(navEntry.notRestoredReasons);
  }
}
```

For history navigations, the `PerformanceNavigationTiming.notRestoredReasons` property returns an object with the following structure, which represents the blocked state of the top-level frame:

```javascript
{
  children: [],
  id: null,
  name: null,
  reasons: [
    {"reason", "unload-listener"}
  ],
  src: null,
  url: "https://www.example.com/page/"
}
```

The properties are as follows:

`children`
: An array of objects representing the blocked state of any same-origin frames embedded in the top-level frame. Each object has the same structure as the parent object --- this way, any number of levels of embedded frames can be represented inside the object recursively. If the frame has no children, the array will be empty.

`id`
: A string representing the `id` attribute value of the frame (for example `<iframe id="foo" src="...">`). If the frame has no `id`, the value will be `null`. For the top-level page this is `null`.

`name`
: A string representing the `name` attribute value of the frame (for example `<iframe name="bar" src="...">`). If the frame has no `name`, the value will be an empty string. For the top-level page this is `null`.

`reasons`
: An array of strings each representing a reason why the navigated page was blocked from using the bfcache. There are many different reasons why blocking could occur. See the [Blocking reasons](https://developer.chrome.com/docs/web-platform/bfcache-notrestoredreasons.md.txt#blocking_reasons) section for more details.

`src`
: A string representing the path to the frame's source (for example `<iframe src="b.html">`). If the frame has no `src`, the value will be an empty string. For the top-level page this is `null`.

`url`
: A string representing the URL of the navigated page/iframe.

For `PerformanceNavigationTiming` objects that don't represent history navigations, the `notRestoredReasons` property will return `null`.

Note that `notRestoredReasons` also returns `null` when there are no blocking reasons, so this being `null` is not an indicator that the bfcache was or was not used. For that, you must [use the `event.persisted` property](https://web.dev/articles/bfcache#observe-page-restored).

### Report bfcache blocking in same-origin frames

When a page has same-origin frames embedded, the returned `notRestoredReasons` value will contain an object inside the `children` property representing the blocked state of each embedded frame.

For example:

```javascript
{
  children: [
    {
      children: [],
      id: "iframe-id",
      name: "iframe-name",
      reasons: [],
      src: "./index.html",
      url: "https://www.example.com/"
    },
    {
      children: [],
      id: "iframe-id2",
      name: "iframe-name2",
      reasons: [
        {"reason": "unload-listener"}
      ],
      src: "./unload-examples.html",
      url: "https://www.example.com/unload-examples.html"
    },
  ],
  id: null,
  name: null,
  reasons: [],
  src: null,
  url:"https://www.example.com"
}
```

### Report bfcache blocking in cross-origin frames

When a page has cross-origin frames embedded, we limit the amount of information shared about them to avoid leaking cross-origin information. We only include information that the outer page already knows, and whether the cross-origin subtree blocked bfcache or not. We don't include any blocking reasons or information about lower levels of the subtree (even if some sub-levels are same-origin).

For example:

```javascript
{
  children: [
    {
      children: [],
      id: "iframe-id",
      name: "iframe-name",
      reasons: [],
      src: "./index.html",
      url: "https://www.example2.com/"
    }
  ],
  id: null,
  name: null,
  reasons: [
        {"reason": "masked"}
  ],
  src: null,
  url:"https://www.example.com"
}
```

For all the cross-origin iframes, we report `null` for the `reasons` value for the frame, and the top-level frame will shows a reason of `"masked"`. Note that `"masked"` may also be used for user agent-specific reasons so may not always indicate an issue in an iframe.

See the [Security and privacy](https://github.com/WICG/bfcache-not-restored-reason/blob/main/NotRestoredReason.md#security-and-privacy) section in the explainer for more details about security and privacy considerations.

## Blocking reasons

As we said earlier, there are many different reasons why blocking could occur:

The following are examples of some of the most common reasons the bfcache cannot be used:

- `unload-listener`: the page registers an `unload` handler, which prevents bfcache usage in certain browsers. Note that Chrome no longer emits this reason from Chrome 155 except where sites have opted back in to `unload` events. See [Deprecating the unload event](https://developer.chrome.com/docs/web-platform/deprecating-unload.md.txt) for more information.
- `response-cache-control-no-store`: The page uses `no-store` as a `cache-control` value.
- `related-active-contents`: The page was opened from another page (either using "duplicate tab") which still has a reference to this page.

> [!CAUTION]
> **Caution:** Reason text is liable to change as more reasons are added and deleted, or to make the reason more obvious. For example, `unload-listener` shows as `unload-handler` in Chrome 123.
>
> Users of this API should avoid depending on specific wording for reasons and be prepared to handle new reasons being added and deleted.

## Feedback

The Chromium team wants to hear about your experiences with the bfcache `notRestoredReasons` API.

### Tell us about the API design

Is there something about the API that does not work like you expected? Or are there missing methods
or properties that you need to implement your idea? Have a question or comment on the security
model? File a spec issue on the corresponding [GitHub repo](https://github.com/WICG/bfcache-not-restored-reason/issues), or add your thoughts to an
existing issue.

### Report a problem with the implementation

Did you find a bug with Chromium's implementation? Or is the implementation different from the spec?
File a bug [on our issue tracker](https://issues.chromium.org/issues/new?component=1457076&template=0). Be sure to include as much detail as you can,
instructions for reproducing, and specify the component as `UI > Browser > Navigation > BFCache`.

### Show support for the API

Are you planning to use the bfcache `notRestoredReasons` API? Your public support helps the Chromium team
prioritize features and shows other browser vendors how critical it is to support them.

Send a tweet to [@ChromiumDev](https://twitter.com/ChromiumDev) using the hashtag
[`#NotRestoredReasons`](https://twitter.com/search?q=%23NotRestoredReasons&src=recent_search_click&f=live) and
let us know where and how you are using it.

## Helpful links

- [Back/forward cache](https://web.dev/articles/bfcache)
- [Public explainer](https://github.com/WICG/bfcache-not-restored-reason/blob/main/NotRestoredReason.md)
- [Chromium tracking bug](https://issues.chromium.org/issues/40225770)
- [ChromeStatus.com feature page](https://chromestatus.com/feature/5684908759449600)
- [Intent to Experiment](https://groups.google.com/a/chromium.org/g/blink-dev/c/ce4hr99dUDc/)
- [Intent to Ship](https://groups.google.com/a/chromium.org/g/blink-dev/c/G5tPtziBkEA/)
