---
source_url: https://developer.chrome.com/docs/performance/insights/third-parties
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:22+00:00
sha256: 9f6c8f77b6f6916456e6fddf071df0ecd500dfa78ac20e14295518020fd1d67c
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Connor Clark [X](https://twitter.com/cjamcl) [GitHub](https://github.com/connorjclark)

Published: Oct 8, 2025

Third-party code can significantly impact load performance. Reduce and defer loading of third-party code to prioritize your page's content.

Resources are grouped by third-party based on the [Third Party Web](https://github.com/patrickhulce/third-party-web) open source dataset.

## How to pass this insight

This insight always passes, but will still show for informational purposes if any third-party requests are detected.

## Additional references

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/ThirdParties.ts)
- [Load Third-Party JavaScript](https://web.dev/articles/optimizing-content-efficiency-loading-third-party-javascript)
- [Distinguish between first- and third-party events in the Performance Panel](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#distinguish_between_first-_and_third-party_events)
