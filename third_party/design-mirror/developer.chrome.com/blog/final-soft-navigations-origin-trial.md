---
source_url: https://developer.chrome.com/blog/final-soft-navigations-origin-trial
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:22+00:00
sha256: 6582430dd4859a0e49e4c58149cefee983aa7a0816b2c90cdc945c103904ee9d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com) Michal Mocny [X](https://twitter.com/mmocny) [GitHub](https://github.com/mmocny) [Bluesky](https://bsky.app/profile/https://bsky.app/profile/mmocny.com)

Published: April 20, 2026

Chrome plans to ship the [Soft Navigations API we have previously been experimenting with](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt) later this year. In preparation for that, we are offering one more [origin trial](https://developer.chrome.com/origintrials#/view_trial/21392098230009857) starting in Chrome 147 until Chrome 149. This trial incorporates feedback from previous trials into the API's expected final shape. We are encouraging website owners interested in this feature to conduct a final test of the API's expected final shape before its release.

## What are soft navigations?

A "soft navigation" is when JavaScript intercepts a navigation (for example, clicking on a link) and updates the content on the existing page, rather than loading a new page, while the URL is still updated in the address bar. To users, these appear the same as conventional navigations, but from the browser's perspective the page is still the original page.

## Need for the Soft Navigation API

The [Soft Navigations API](https://wicg.github.io/soft-navigations/) is a proposed API for detection of soft navigations that Single Page Application (SPA) sites use. Because no actual page navigation happens for a soft navigation, JavaScript must manually manage certain actions that would normally happen for a navigation. Some actions, like navigation history management, are possible with current APIs. However, other actions, such as [measuring Core Web Vitals](https://web.dev/articles/vitals-spa-faq), are not possible for these navigations.

The Soft Navigation API allows observation of soft navigations. While the JavaScript that initiates the soft navigation (typically a JavaScript framework) is aware of when a navigation occurs, other JavaScript used by the site (for example, analytics scripts), and the browser itself won't be aware.

## Core Web Vitals and SPAs

One of the main drivers for the Soft Navigation API is to allow measurement of Core Web Vitals for SPAs. Core Web Vitals are measured by both the browser (to appear in tooling such as the [Chrome User Experience Report](https://developer.chrome.com/docs/crux.md.txt)), and by site owners using Real User Monitoring (RUM) solutions.

JavaScript frameworks can measure some aspects of the Core Web Vitals for SPAs. In particular [Interaction to Next Paint (INP)](https://web.dev/articles/inp), and [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls) are based on primitives ([the Event Timing API](https://developer.mozilla.org/docs/Web/API/PerformanceEventTiming) and the [Layout Instability API](https://developer.mozilla.org/docs/Web/API/LayoutShift) respectively) that can be measured across any timespan to calculate those metrics. However, other metrics such as [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) are only emitted by the browser---based on page navigations and [is finalized upon interaction](https://web.dev/articles/lcp#stop-on-interaction).

> [!IMPORTANT]
> **Important:** This origin trial is to evaluate the new API and not [how this data will be used in CrUX or tooling](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt#how_will_soft_navigations_be_reported_in_crux). That will be decided after we're satisfied with the API and launch it for use outside the origin trial.

## How the API enables measurement of Core Web Vitals for SPAs

The Soft Navigation API introduces two new performance entries:

- A [`SoftNavigationEntry` entry](https://wicg.github.io/soft-navigations/#sec-soft-navs) that is emitted when all soft navigation requirements are fulfilled. This includes an `interactionId` for the interaction that caused the soft navigation, a unique `navigationId`, and a `name` set to the new URL and various paint timings that can be used to measure the first contentful paint of the soft navigation.
- An [`InteractionContentfulPaint` entry](https://wicg.github.io/soft-navigations/#sec-interaction-contentful-paint) that allows measuring multiple, increasingly-sized, contentful paints after interactions to measure LCP for soft navigations.

These new entries can be observed using a [PerformanceObserver](https://developer.mozilla.org/docs/Web/API/PerformanceObserver) using the `soft-navigation` and `interaction-contentful-paint` types respectively.

> [!NOTE]
> **Note:** While a key use case for the `InteractionContentfulPaint` entry is to measure LCP for soft navigations, this entry enables other potential use cases beyond LCP, because the event emits for all interactions and not just those that trigger soft navigations.

> [!CAUTION]
> **Caution:** This is a key difference from the [last origin trial](https://developer.chrome.com/blog/new-soft-navigations-origin-trial.md.txt) where the `InteractionContentfulPaint` entries were emitted only for soft navigation interactions. They are now emitted for all interactions, even those that don't result in a soft navigation.

The API also expands each of the `largest-contentful-paint`, `interaction-contentful-paint`, `event-timing`, and `layout-shift` performance entries (and others) to include an identifier, `navigationId`, that represents the navigation the entry is for. Because `PerformanceObserver`s don't observe performance entries until the page is idle, some time can elapse between the event that created the performance entry, and your observation of it. This is especially true when the page is very busy, for example, during soft navigations. This `navigationId` value helps attribute entries to the correct navigation.

Some `interaction-contentful-paint` entries can happen before the navigation, and some after. Instead of having to track all paints that might result in a soft navigation, the `soft-navigation` entry includes a `largestInteractionContentfulPaint` entry that is the largest paint seen until this time.

Together, these enable Core Web Vitals to be measured for:

- **LCP** : Using `largest-contentful-paint` for the initial page load and the new `interaction-contentful-paint` and `soft-navigation` entries for soft navigations.
- **CLS** : Using `layout-shift` entries and slicing them based on the `soft-navigation` entries for soft navigations.
- **INP** : Using `event` entries and slicing them based on the `soft-navigation` entries for soft navigations.
- **FCP** : Using `first-contentful-paint` for the initial page load and the paint timing details on the new `soft-navigation` entries for soft navigations.

For more details, see the [Soft Navigations documentation](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt).

## How are soft navigations triggered?

The Soft Navigation API triggers a soft navigation when the following occurs:

- A user interaction occurs,
- ... which results in a visible paint of content to the user,
- ... and a URL update occurs.

The API takes this approach rather than letting a JavaScript framework "emit" a soft navigation, or building upon the [Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api.md.txt) for two reasons:

1. First, this includes all existing SPA sites without any changes required to those sites.
2. Second, it enables a consistent understanding of what constitutes a soft navigation regardless of how a framework or developer handles navigations.

Frameworks or developers can update the URL for a soft navigation even without a user interaction or a DOM update that users would consider a navigation. They can also update the URL at different times: at the start of the interaction, only at the end when it's complete, or at any state in between.

Rather than relying on framework and developer choices, building soft navigation detection into the browser establishes a canonical definition that enables measurement Core Web Vitals for soft navigations at scale and makes these measurements comparable at scale.

Frameworks and developers can also ignore the Soft Navigations API and use the underlying Event Timing, Layout Instability APIs, and the new `InteractionContentfulPaint` performance entry to measure additional performance metrics as they choose. However, we recommend using the API for measuring Core Web Vitals to enable consistent measurement across sites and across tooling.

## Help needed to test the Soft Navigation API

We need your help to test the Soft Navigations API and determine if it correctly matches your expectations for when a soft navigation occurs. Does the API fail to report soft navigations when you consider them to have occurred? Conversely, does the API over-report navigations that you don't consider navigations?

## What has changed since the last origin trial

The primary change in this latest iteration is decoupling `InteractionContentfulPaint` from the soft navigations to enable other use cases for that performance entry, and the additional `largestInteractionContentfulPaint` attribute to the `SoftNavigationEntry`.

From a website perspective, the API now also includes [`replaceState`](https://developer.mozilla.org/docs/Web/API/History/replaceState) as soft navigations because [we heard your feedback](https://github.com/WICG/soft-navigations/issues/36) that this is important to consider as a navigation in many circumstances. We are eager to hear about any other cases where the API does not recognize a soft navigation.

We have also made countless other improvements to the implementation. For those looking exactly what has changed in the latest iteration, a detailed history of all the changes can be found in the [Soft Navigations Changelog](https://chromium.googlesource.com/chromium/src/+/main/docs/speed/metrics_changelog/soft_navigations.md).

We want the API to be as useful as possible and are open to further changes to make that happen. Changes are much easier to implement to the API before it launches and sites start depending on an implementation. Therefore, we ask SPA developers and those interested in measuring web performance for these sites to test this API and provide feedback on it.

## How to test

The API can be tested locally with [Chrome flags or command line options](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt#how_do_i_enable_soft_navigations_in_chrome). Additionally, you can test it in the field with [the origin trial](https://developer.chrome.com/origintrials#/view_trial/21392098230009857) ([learn more about origin trials](https://developer.chrome.com/docs/web-platform/origin-trials.md.txt)).

See [our documentation](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt) or the [GitHub repository](https://github.com/WICG/soft-navigations) for more technical details about the API, especially [how to measure the Core Web Vitals](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt#measure-core-web-vitals).

Additionally, an experimental [soft navigation version of the web-vitals library](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt#web-vitals-library) is available on GitHub and npm.

For a simpler test, the **Performance** panel of Chrome DevTools shows soft navigation in Performance traces as of Chrome 145, even without enabling the feature:

## Feedback

Feedback on the API should be raised as [issues on GitHub](https://github.com/WICG/soft-navigations/issues), and report bugs on the Chromium implementation on [Chrome's issue tracker](https://issues.chromium.org/issues/new?component=1456231&template=0). If you are unsure which category feedback falls into, don't worry too much. We prefer to receive feedback in either place, and we will triage the issues in both places and redirect them to the correct location.
