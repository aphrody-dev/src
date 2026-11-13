---
source_url: https://developer.chrome.com/docs/lighthouse/seo/plugins
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: e6a86225e361514033b1a4c9fb214159ce7e513a3f066adb41050ca4a769a904
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Search engines often can't index content that relies on browser plugins, such as
Java or Flash. That means plugin-based content doesn't show up in search
results.

Also, most mobile devices don't support plugins, which
[creates frustrating experiences for mobile users](https://developers.google.com/search/mobile-sites/mobile-seo/common-mistakes#unplayable-content).

## How the Lighthouse plugins audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages
that use plugins:

Lighthouse checks the page for elements that commonly represent plugins:

- `embed`
- `object`
- `applet`

Lighthouse then flags an element as a plugin if its MIME type matches any of the
following:

- `application/x-java-applet`
- `application/x-java-bean`
- `application/x-shockwave-flash`
- `application/x-silverlight`
- `application/x-silverlight-2`

Lighthouse also flags elements that point to a URL with a file format that is
known to represent plugin content:

- `swf`
- `flv`
- `class`
- `xap`

## Don't use plugins to display your content

To convert plugin-based content to HTML, refer to guidance for that
plugin. For example, MDN explains [how to convert Flash video to HTML5 video](https://developer.mozilla.org/docs/Plugins/Flash_to_HTML5/Video).

## Resources

- [Source code for **Document uses plugins** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/plugins.js)
- [Unplayable content on mobile devices](https://developers.google.com/search/mobile-sites/mobile-seo/common-mistakes#unplayable-content)
- [Flash video to HTML5 video](https://developer.mozilla.org/docs/Plugins/Flash_to_HTML5/Video)

> [!NOTE]
> **Note:** Each SEO audit is weighted equally in the Lighthouse SEO Score, except for the manual **[Structured data is valid](https://developer.chrome.com/docs/lighthouse/seo/structured-data.md.txt)** audit. Learn more in the [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt).
