---
source_url: https://developer.chrome.com/docs/lighthouse/seo/font-size
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: aa7a83f77f03223de292dbe47d977d17ad4609b4bf66710e295d78a0cc8b33a7
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

> [!WARNING]
> **Warning:** This audit has been removed as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

Many search engines rank pages based on how mobile-friendly they are. Font
sizes smaller than 12 px are often difficult to read on mobile devices
and may require users to zoom in to display text at a comfortable reading size.

## How the Lighthouse font size audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages
with font sizes that are too small to read easily on mobile:

Lighthouse flags pages on which 40% or more of the text has a font size smaller
than 12 px. When a page fails the audit, Lighthouse lists the results in a
table with four columns:

|---|---|
| **Source** | The source location of the CSS ruleset that is causing the illegible text. |
| **Selector** | The selector of the ruleset. |
| **% of Page Text** | The percentage of text on the page that is affected by the ruleset. |
| **Font Size** | The computed size of the text. |

> [!NOTE]
> **Note:** Each SEO audit is weighted equally in the Lighthouse SEO Score, except for the manual **[Structured data is valid](https://developer.chrome.com/docs/lighthouse/seo/structured-data.md.txt)** audit. Learn more in the [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt).

## How to fix illegible fonts

Check font sizes in your CSS. Aim to have a font size of at least 12 px on
at least 60% of the text on your page.

## How to fix a missing viewport config

If Lighthouse reports `Text is illegible because of a missing viewport config`,
add a `<meta name="viewport" content="width=device-width, initial-scale=1">`
tag to the `<head>` of your document.

See the [Does not have a `<meta name="viewport">` tag with `width` or `initial-scale`](https://developer.chrome.com/docs/lighthouse/pwa/viewport)
post for more information.

## Resources

[Source code for **Document does not use legible font sizes** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/font-size.js)
