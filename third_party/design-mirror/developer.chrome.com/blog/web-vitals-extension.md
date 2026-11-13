---
source_url: https://developer.chrome.com/blog/web-vitals-extension
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:15+00:00
sha256: 9ed9e09592bb103b3e309d84acece232264dc221117e117014cd5f105a80f9ae
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Rick Viscomi [GitHub](https://github.com/rviscomi) [Bluesky](https://bsky.app/profile/rviscomi.dev) [Homepage](https://developer.chrome.com/rviscomi.dev/)  Addy Osmani [X](https://twitter.com/addyosmani) [GitHub](https://github.com/addyosmani) [Bluesky](https://bsky.app/profile/addyosmani.bsky.social)

Published: September 24, 2024

> [!NOTE]
> **January 2025 update:** The merger of the Web Vitals extension and DevTools is complete and support for the extension has ended. See [the announcement](https://developer.chrome.com/blog/web-vitals-extension-merged.md.txt) for more details.

The Chrome team released the [Web Vitals extension](https://chromewebstore.google.com/detail/web-vitals/ahfhijdlegdabablpippeagghigmibma) in 2020 as a companion tool to the nascent Web Vitals program. The goal was to provide developers with a convenient way to discover how their local metrics perform. Since then, the extension has been a part of our recommended Core Web Vitals [tooling workflow](https://web.dev/articles/vitals-tools) and it's been used by nearly 200,000 developers.

Last week with the release of Chrome 129, we launched a new [real-time metrics view](https://developer.chrome.com/blog/devtools-realtime-cwv.md.txt) in the Performance panel. With these changes, many of the extension's core features are now available in Chrome DevTools, alongside all of the other powerful performance debugging capabilities. This move is part of [our broader strategy](https://developer.chrome.com/blog/perf-tooling-2024.md.txt#taking_action_on_web_performance_made_easier) to give "first-class treatment" to Core Web Vitals optimization journeys in DevTools. So to provide the best possible developer experience, **we'll be focusing all of our efforts into improving the Performance panel and ending support for the Web Vitals extension on January 7, 2025**.

For anyone still using the extension after that date, you'll stop receiving updates and some features may stop working without notice, so we recommend transitioning your tooling workflow to the Performance panel right away. That said, we recognize that DevTools includes many---but not all---features of the extension. If there are any critical features that you feel are missing from the Performance panel, add your +1 to the corresponding issues in the [hotlist](https://goo.gle/devtools-live-cwv-hotlist), or file a [new issue](https://goo.gle/devtools-live-cwv-issue). Here are some of the features that we're already planning to add support for by January:

- [Sub-part times for LCP](https://issues.chromium.org/369097966)
- [Sub-part times for INP](https://issues.chromium.org/369097528)
- [Script attribution for INP](https://issues.chromium.org/369100561)
- [Layout shift log for CLS](https://issues.chromium.org/369100729)

Through the Web Vitals extension, we've learned a lot about what developers want out of their performance tools, and we've already incorporated the core of it directly into DevTools. It's ready for you to use today, so don't wait. Meanwhile, with your feedback, we'll continue to iterate on making an even easier and more powerful Performance panel for everyone.
