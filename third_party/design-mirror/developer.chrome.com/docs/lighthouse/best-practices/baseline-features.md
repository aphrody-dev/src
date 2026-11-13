---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/baseline-features
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: f2b972e0b807b564a3ebcff8508731bbf86b4cfa1d2314510e807ca9c7f9b80d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
As part of the **Best Practices** suite of audits in
[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt), DevTools tells you the
[Baseline](https://web.dev/baseline) status of features used on the current
page.
 The Baseline Features Lighthouse audit showing all the web feature IDs detected on page along with their current Baseline status.

## This is a diagnostic audit

This audit provides the following information:

- The web feature ID (from the [`web-features`
  package](https://www.npmjs.com/package/web-features)), linked to the web feature ID's entry on [webstatus.dev](https://webstatus.dev/).
- The Baseline status, either Limited availability, Newly available, or Widely available.
- Where one occurrence of the feature's usage was found in the site's source code.

The audit also gives you information about web features used in third-party
scripts, and any active extensions.

## Resources

[Video](https://www.youtube.com/watch?v=M2_cSiwTRFs)

- [Source code for the **Baseline Features** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/baseline.js)
- [Baseline on the WebDX Community Group site](https://web-platform-dx.github.io/baseline/)
- [Baseline on web.dev](https://web.dev/baseline)
