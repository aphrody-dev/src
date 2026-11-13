---
source_url: https://developer.chrome.com/docs/lighthouse/seo/tap-targets
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:39+00:00
sha256: 0e5a9bbdf5aade2612169e77e7dd54ed206cbf055a9e6c1421ac0cbfc17cd339
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Tap targets are the areas of a web page that users on touch devices can
interact with. Buttons, links, and form elements all have tap targets.

Many search engines rank pages based on how mobile-friendly they are. Making
sure tap targets are big enough and far enough apart from each other makes
your page more mobile-friendly and accessible.

## How the Lighthouse tap targets audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages
with tap targets that meet both of these conditions:

- The target is smaller than 48 px by 48 px.
- At least 25% the target area within 48 px of the center of the target overlaps with another target.

When the audit fails, Lighthouse lists the results in a
table with three columns:

|---|---|
| **Tap Target** | The tap target that is inappropriately sized. |
| **Size** | The size of the target's bounding rectangle in pixels. |
| **Overlapping Target** | Which other tap targets, if any, are too close. |

> [!NOTE]
> **Note:** Each SEO audit is weighted equally in the Lighthouse SEO Score, except for the manual **[Structured data is valid](https://developer.chrome.com/docs/lighthouse/seo/structured-data.md.txt)** audit. Learn more in the [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt).

## How to fix your tap targets

**Option 1:** Increase the size of tap targets that are too small.
Tap targets that are 48 px by 48 px never fail the audit. If you have
elements that shouldn't *appear* any bigger (for example, icons), try increasing
the `padding` property:
 Use `padding` to make tap targets bigger without changing the appearance of an element.

**Option 2:** Increase the spacing between tap targets that are too close together
using properties like `margin`. 8 px between tap targets is a good starting point,
but is not always enough spacing to pass the audit especially for very small targets.

## Resources

- [Accessible tap targets](https://web.dev/articles/accessible-tap-targets): more information on how to ensure your tap targets are accessible by all users.
- [Source code for **Tap targets are not sized appropriately** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/tap-targets.js)
