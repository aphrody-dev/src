---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/deprecations
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: d15b9290e2412a78b6687f333d7463d7d7dca4bfbd2d584323d4c4a1d9713cf9
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Deprecated APIs are scheduled to be removed from Chrome.
Calling these APIs
after they're removed causes errors on your site.

## How the Lighthouse deprecated API audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages that call deprecated APIs:

Lighthouse includes all deprecated API warnings that Chrome logs
to the DevTools Console.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## How to remove deprecated APIs

Go to
[Chrome Platform Status](https://www.chromestatus.com/features#deprecated) and
expand the entries for the APIs that you're using
to learn why the APIs are deprecated and how to replace them.

## Resources

- [Source code for **Uses deprecated APIs** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/deprecations.js)
- [Chrome Platform Status](https://www.chromestatus.com/features#deprecated)
