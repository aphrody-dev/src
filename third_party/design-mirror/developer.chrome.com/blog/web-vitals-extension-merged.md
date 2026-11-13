---
source_url: https://developer.chrome.com/blog/web-vitals-extension-merged
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: 9c7cc770d5b0c6f8d0b501fd60da9417885b2c21a3010c96aac664568207f3b5
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Rick Viscomi [GitHub](https://github.com/rviscomi) [Bluesky](https://bsky.app/profile/rviscomi.dev) [Homepage](https://developer.chrome.com/rviscomi.dev/)

Published: January 13, 2025

With the release of Chrome 132 this month, the Web Vitals extension has officially merged with the Performance panel in DevTools. As outlined in [September's announcement](https://developer.chrome.com/blog/web-vitals-extension.md.txt), now that the last few features have shipped, we're finally ready to end support for the Web Vitals extension.

If you're already using the [live metrics view](https://developer.chrome.com/blog/devtools-realtime-cwv.md.txt) of DevTools to measure and debug your local Core Web Vitals experiences, that's great! We'd be interested to hear your [feedback](https://goo.gle/devtools-live-cwv-issue) if anything could be improved.

For anyone else still using the Web Vitals extension, you should migrate to DevTools now. You'll start to see warnings in the extension about the end of support, urging you to migrate. We also plan to revoke its CrUX API key in the near future, which will break the field data integration. To make the move a little bit easier, we've created this handy [migration guide](https://github.com/GoogleChrome/web-vitals-extension?tab=readme-ov-file#-migrating-to-devtools) showing you where to find the same features in DevTools.

All of the major features of the extension have been merged into DevTools, but if you happen to rely on anything that isn't supported, let us know. Browse the list of issues in the [public hotlist](https://goo.gle/devtools-live-cwv-hotlist) and add your +1 to any that align with your use case. This list includes issues that have been closed, so perhaps a fix is on the way, or it's a feature that we don't plan to support in DevTools. If your use case isn't covered, [file a feature request](https://goo.gle/devtools-live-cwv-issue) so we can prioritize it and unblock your workflow. As a last resort, if you're still unable to complete your migration to DevTools, we've added instructions on [maintaining your own local copy of the extension](https://github.com/GoogleChrome/web-vitals-extension?tab=readme-ov-file#%EF%B8%8F-self-maintenance-instructions).

We've still got a lot more planned for [the future of the Performance panel](https://developer.chrome.com/blog/perf-tooling-2024.md.txt), but today it's an incredibly powerful debugging tool, including the features of the Web Vitals extension and beyond.
