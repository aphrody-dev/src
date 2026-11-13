---
source_url: https://web.dev/articles/user-centric-performance-metrics
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:36+00:00
sha256: c7b37790c86cadbb702e9d57d6a5a006deb4565d2ac402ab6cbb916ae376cbe1
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Philip Walton [X](https://twitter.com/philwalton) [GitHub](https://github.com/philipwalton) [LinkedIn](https://www.linkedin.com/in/waltonphilip) [Mastodon](https://toot.cafe/@philipwalton) [Bluesky](https://bsky.app/profile/philipwalton.com) [Homepage](https://philipwalton.com/)

We've all heard how important performance is. But when we talk about performance, and about making websites "fast", what specifically do we mean?

The truth is that performance is relative:

- A site might be fast for one user (on a fast network with a powerful device) but slow for another user (on a slow network with a low-end device).
- Two sites may finish loading in the exact same amount of time, yet one may *seem* to load faster (if it loads content progressively rather than waiting until the end to display anything).
- A site might *appear* to load quickly but then respond slowly (or not at all) to user interaction.

When talking about performance, it's important to be precise and to refer to
performance in terms of *metrics*. Objective criteria that can be quantitatively
measured, but it's also important to make sure the metrics you're measuring are
useful.

## Defining metrics

Historically, web performance has been measured with the [`load`](https://developer.mozilla.org/docs/Web/API/Window/load_event) event. However, even though `load` is a well-defined moment in a page's lifecycle, that moment doesn't necessarily correspond with anything the user cares about.

For example, a server could respond with a minimal page that "loads" immediately, but then defers fetching content or displaying anything on the page until several seconds after the `load` event fires. Such a page technically has a fast load time, but that time doesn't correspond to how a user experiences the page loading.

Over the past few years, members of the Chrome team---in collaboration with the [W3C Web Performance Working Group](https://www.w3.org/webperf/)---have been working to standardize a set of new APIs and metrics that more accurately measure how users experience the performance of a web page.

To help ensure the metrics are relevant to users, we frame them around a few key questions:

|---|---|
| **Is it happening?** | Did the navigation start successfully? Has the server responded? |
| **Is it useful?** | Has enough content rendered that users can engage with it? |
| **Is it usable?** | Can users interact with the page, or is it busy? |
| **Is it delightful?** | Are the interactions smooth and natural, free of lag? |

## How metrics are measured

Performance metrics are generally measured in one of two ways:

- **In the lab:** using tools to simulate a page load in a consistent, controlled environment
- **In the field**: on real users actually loading and interacting with the page

Neither of these options is necessarily better or worse than the other---in fact you generally want to use both to ensure good performance.

### In the lab

Testing performance in the lab is essential when developing new features. Before features are released in production, it's impossible to measure their performance characteristics on real users, so testing them in the lab before the feature is released is the best way to prevent performance regressions.

### In the field

On the other hand, while testing in the lab is a reasonable proxy for performance, it isn't necessarily reflective of how actual users experience your site.

The performance of a site can vary dramatically based on a user's device capabilities and their network conditions. It can also vary based on whether (or how) a user is interacting with the page.

Page loads are also not always deterministic. For example, sites that load personalized content or ads can experience vastly different performance characteristics from user to user. A lab test won't capture those differences.

The only way to truly know how your site performs for your users is to actually measure its performance as those users load and interact with it. This type of measurement is commonly called [Real User Monitoring (RUM)](https://en.wikipedia.org/wiki/Real_user_monitoring).

## Types of metrics

There are several other types of metrics that are relevant to how users perceive performance.

- **Perceived load speed:** how quickly a page can load and render all of its visual elements to the screen.
- **Load responsiveness:** how quickly a page can load and execute any required JavaScript code in order for components to respond quickly to user interaction
- **Runtime responsiveness:** after page load, how quickly can the page respond to user interaction.
- **Visual stability:** do elements on the page shift in ways that users don't expect and potentially interfere with their interactions?
- **Smoothness:** do transitions and animations render at a consistent frame rate and flow fluidly from one state to the next?

Given all these types of performance metrics, it's hopefully clear that no single metric is sufficient to capture all the performance characteristics of a page.

## Important metrics to measure

- **[First Contentful Paint (FCP)](https://web.dev/articles/fcp.md.txt):** measures the time from when the page starts loading to when any part of the page's content is rendered on the screen. *([lab](https://web.dev/articles/user-centric-performance-metrics.md.txt#lab), [field](https://web.dev/articles/user-centric-performance-metrics.md.txt#field))*
- **[Largest Contentful Paint (LCP)](https://web.dev/articles/lcp.md.txt):** measures the time from when the page starts loading to when the largest text block or image element is rendered on the screen. *([lab](https://web.dev/articles/user-centric-performance-metrics.md.txt#lab), [field](https://web.dev/articles/user-centric-performance-metrics.md.txt#field))*
- **[Interaction to Next Paint (INP)](https://web.dev/articles/inp.md.txt)** : measures the latency of every tap, click, or keyboard interaction made with the page, and---based on the number of interactions---selects the worst interaction latency of the page (or close to the highest) as a single, representative value to describe a page's overall responsiveness. *([lab](https://web.dev/articles/user-centric-performance-metrics.md.txt#lab), [field](https://web.dev/articles/user-centric-performance-metrics.md.txt#field))*
- **[Total Blocking Time (TBT)](https://web.dev/articles/tbt.md.txt):** measures the total amount of time between FCP and TTI where the main thread was blocked for long enough to prevent input responsiveness. *([lab](https://web.dev/articles/user-centric-performance-metrics.md.txt#lab))*
- **[Cumulative Layout Shift (CLS)](https://web.dev/articles/cls.md.txt):** measures the cumulative score of all unexpected layout shifts that occur between when the page starts loading and when its [lifecycle state](https://developer.chrome.com/blog/page-lifecycle-api) changes to hidden. *([lab](https://web.dev/articles/user-centric-performance-metrics.md.txt#lab), [field](https://web.dev/articles/user-centric-performance-metrics.md.txt#field))*
- **[Time to First Byte (TTFB)](https://web.dev/articles/ttfb.md.txt)** : measures the time it takes for the network to respond to a user request with the first byte of a resource. *([lab](https://web.dev/articles/user-centric-performance-metrics.md.txt#lab), [field](https://web.dev/articles/user-centric-performance-metrics.md.txt#field))*

In some cases, new metrics will be introduced to cover missing areas, but in other cases the best metrics are ones specifically tailored to your site.

## Custom metrics

The performance metrics covered earlier are good for getting a general understanding of the performance characteristics of most sites on the web. They're also good for having a common set of metrics for sites to compare their performance against their competitors.

However, there may be times when a specific site is unique in some way that requires additional metrics to capture the full performance picture. For example, the LCP metric is intended to measure when a page's main content has finished loading, but there could be cases where the largest element is not part of the page's main content and thus LCP may not be relevant.

To address such cases, the Web Performance Working Group has also standardized lower-level APIs that can be useful for implementing your own custom metrics:

- [User Timing API](https://w3c.github.io/user-timing/)
- [Long Tasks API](https://w3c.github.io/longtasks/)
- [Long Animation Frames API](https://w3c.github.io/long-animation-frames/)
- [Element Timing API](https://wicg.github.io/element-timing/)
- [Navigation Timing API](https://w3c.github.io/navigation-timing/)
- [Resource Timing API](https://w3c.github.io/resource-timing/)
- [Server timing](https://w3c.github.io/server-timing/)

Refer to the guide on [Custom Metrics](https://web.dev/articles/custom-metrics.md.txt) to learn how to use these APIs to measure performance characteristics specific to your site.
