---
source_url: https://developer.chrome.com/blog/new-soft-navigations-origin-trial
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:12+00:00
sha256: 6a9676c16b9f51af8eb995e491ed64b01882a9a55991e6785962f1a31b83324a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)  Michal Mocny [X](https://twitter.com/mmocny) [GitHub](https://github.com/mmocny) [Bluesky](https://bsky.app/profile/https://bsky.app/profile/mmocny.com)

Published: Jul 31, 2025

> [!CAUTION]
> **Caution:** A new [Soft Navigations origin trial](https://developer.chrome.com/blog/final-soft-navigations-origin-trial.md.txt) has replaced this one with some key API differences.

Chrome is launching a new [origin trial](https://developer.chrome.com/origintrials#/view_trial/21392098230009857) from Chrome 139 for the [Soft Navigations API we have previously been experimenting with](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt). This origin trial allows sites to try the API on their site with real users to field test the API and provide the Chrome team feedback.

## What are soft navigations?

A soft navigation is when JavaScript intercepts a navigation (for example, clicking on a link) and updates the content on the existing page, rather than by loading a new page and then the URL is updated in the address bar (with a history state to allow back and forward soft navigations). To the user, these look the same as conventional navigations but as far as the browser is concerned the page is still the original page.

## Why the Soft Navigation API is needed

The [Soft Navigations API](https://wicg.github.io/soft-navigations/) is a proposed API to allow heuristic-based detection of so-called "soft navigations" as used by Single Page Application (SPA) sites. As no actual page navigation happens for a soft navigation, this means that certain actions that would normally happen for a navigation need to be manually managed by JavaScript. Some actions, like navigation history management, are possible with current APIs. However, other actions, such as [measuring Core Web Vitals](https://web.dev/articles/vitals-spa-faq), are not possible for these navigations.

The Soft Navigation API allows observation of soft navigations. While the JavaScript initiating the soft navigation (typically a JavaScript framework) is aware of when a navigation occurs, other JavaScript, and the browser itself won't be aware.

## Core Web Vitals and SPAs

One of the main drivers for the Soft Navigation API is to allow measurement of Core Web Vitals for SPAs. Core Web Vitals are measured by both the browser (to surface in the tooling such as the [Chrome User Experience Report](https://developer.chrome.com/docs/crux.md.txt)), and by Real User Monitoring (RUM) JavaScript libraries.

JavaScript frameworks could measure some aspects of the Core Web Vitals. In particularly [Interaction to Next Paint (INP)](https://web.dev/articles/inp), and [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls) are based on primitives ([the Event Timing API](https://developer.mozilla.org/docs/Web/API/PerformanceEventTiming) and the [Layout Instability API](https://developer.mozilla.org/docs/Web/API/LayoutShift) respectively) that can be be measured across any timespan to calculate the INP and CLS metrics. However, because the browser reports and finalizes [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) based on page navigations and interactions, JavaScript frameworks don't have visibility into anything other than the initial loading performance for SPAs.

> [!IMPORTANT]
> **Important:** This origin trial is to evaluate the new API and not [how this data will be used in CrUX or tooling](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt#how_will_soft_navigations_be_reported_in_crux) and the wider Core Web Vitals initiative. That will be decided after we're satisfied with the API and launch it for use outside the origin trial.

## How the Soft Navigation API allows measurement of Core Web Vitals for SPAs

The first iteration of the Soft Navigation API coupled the soft navigation heuristics with a resetting of LCP. After it is reset LCP can be re-emitted for soft navigations for new contentful paint, allowing measurement of this metric for soft navigations.

This latest iteration takes a different approach and decouples these concepts into the Soft Navigation API and a new Interaction to Contentful Paint performance entry. The [`interaction-contentful-paint`](https://github.com/WICG/soft-navigations/blob/main/Design.md#interactioncontentfulpaint) entry measures the "contentful paint" after interactions. For now, this is only emitted for soft navigations, but this opens other potential use cases beyond LCP if enabled for all interactions.

The API also expanded each of the `largest-contentful-paint`, `interaction-contentful-paint`, `event-timing`, and `layout-shift` performance entries to include an identifier that the navigation the entry is for. Performance entries are emitted after the event they are measuring---usually during idle time. This means the URL will often have changed by the time the performance entry is emitted. Including the navigation with the entry makes it much easier to measure Core Web Vitals for the given URL without having to match up performance entry times to soft navigation entry times.

## Why a heuristic?

The Soft Navigation API considers a soft navigation when the following occurs:

- A user-based interaction occurs (URL updates without a user interaction don't count)
- ... which results in a DOM modification and a paint
- ... and a URL update occurs
- URL update, including a history change.

The API takes this heuristic-based approach rather than allowing a JavaScript framework to "emit" a soft navigation, or to be built upon the [Navigation API](https://developer.chrome.com/docs/web-platform/navigation-api.md.txt) as this allows for a consistent understanding of what constitutes a soft navigation regardless of the framework or how a developer uses it.

Frameworks or developers may update the URL for a soft navigation even without a user interaction or a DOM update that we consider what a user would see as a navigation. They may also update the URL at different times---at the start of the interaction or only at the end when it's complete---or at any state in between.

Rather than relying on framework choices, building the soft navigation detection into the browser establishes canonical 'heuristics' (with your feedback from this origin trial) which will allow us to measure Core Web Vitals for soft navigations at scale and make such measurements comparable at scale.

Frameworks and developers can also ignore the Soft Navigations API heuristics and use the underlying Event Timing, Layout Instability, and Interaction to Contentful Paint APIs to measure additional performance metrics as they want, but we recommend the Core Web Vitals using the heuristic to allow measurement across sites.

## Help needed to test the Soft Navigation API

We need help to test the Soft Navigations API to test if the heuristic correctly matches your expectations of when a soft navigation has occurred. Are there instances when the API does not report soft navigations when you consider them to have occured? On the opposite, does the API over repeat navigations that you don't consider to be soft navigations?

Examples that we have seen to cause issues include when a URL is updated with [`replaceState`](https://developer.mozilla.org/docs/Web/API/History/replaceState) instead of adding a history, or when a navigation that is not user-initiated occurs (for example a logout on timeout). Both cases are explained by not matching the heuristics and the Chrome team are comfortable with not including these but we want to hear from web developers if they agree. And we particularly want to hear about cases when the heuristics do appear to be met but the API still does not recognise the soft navigation.

Additionally, we want to understand if this API, and the new Interaction to Contentful Paint primitive, addresses the primary use case of allowing measurement of the Core Web Vitals for SPAs.

We want the API to be as useful as possible and that is much easier to happen before it is launched and sites start depending on an implementation. Therefore, we ask SPA developers and those interested in measuring web performance for these sites to take this API for a spin and let us know how it works for you.

## How to test

The API can be tested locally with [Chrome flags or command line options](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt#how_do_i_enable_soft_navigations_in_chrome). In addition it can be tested in the field with [the origin trial](https://developer.chrome.com/origintrials#/view_trial/21392098230009857).

Refer to [our documentation](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt) or the [GitHub repository](https://github.com/WICG/soft-navigations) for more of the technical details of the API, and in particular [how to measure the Core Web Vitals](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt#measure-core-web-vitals). In addition an experimental [soft navigation version of the web-vitals library](https://developer.chrome.com/docs/web-platform/soft-navigations.md.txt#web-vitals-library) is available.

## Feedback

We are actively seeking feedback on this experiment at the following places:

- Feedback on the API should be raised as [issues on GitHub](https://github.com/WICG/soft-navigations/issues).
- Bugs on the Chromium implementation should be [raised on Chrome's issue tracker](https://issues.chromium.org/issues/new?template_issue=434300302&component=1456231), if this is not one of the [known issues](https://issues.chromium.org/savedsearches/6917297) yet.
- General web vitals feedback can be shared at [web-vitals-feedback@googlegroups.com](mailto:web-vitals-feedback@googlegroups.com).

If in doubt don't worry too much, we'd rather hear the feedback in either place and will happily triage the issues in both places and redirect issues to the correct location.
