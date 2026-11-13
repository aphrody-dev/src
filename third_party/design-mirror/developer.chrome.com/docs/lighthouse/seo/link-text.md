---
source_url: https://developer.chrome.com/docs/lighthouse/seo/link-text
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: 33e629f7bad0cc8d1460bcee54f280086094e58be7760b7fb391235d0176b9a1
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Link text is the clickable word or phrase in a hyperlink. When link text clearly
conveys a hyperlink's target, both users and search engines can more easily
understand your content and how it relates to other pages.

## How the Lighthouse link text audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags links
without descriptive text:

Lighthouse flags the following generic link text:

- `click here`
- `click this`
- `go`
- `here`
- `this`
- `start`
- `right here`
- `more`
- `learn more`

> [!NOTE]
> **Note:** Each SEO audit is weighted equally in the Lighthouse SEO Score, except for the manual **[Structured data is valid](https://developer.chrome.com/docs/lighthouse/seo/structured-data.md.txt)** audit. Learn more in the [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt).

## How to add descriptive link text

Replace generic phrases like "click here" and "learn more" with specific
descriptions. In general, write link text that clearly indicates what type of
content users will get if they follow the hyperlink.

```html
<p>To see all of our basketball videos, <a href="videos.html">click here</a>.</p>
```
Don't

"Click here" doesn't convey where the hyperlink will take users.

```html
<p>Check out all of our <a href="videos.html">basketball videos</a>.</p>
```
Do

"Basketball videos" clearly conveys that the hyperlink will take users to a page
of videos.

> [!NOTE]
> **Note:** You'll often need to revise the surrounding sentence to make link text descriptive.

## Link text best practices

- Stay on topic. Don't use link text that has no relation to the page's content.
- Don't use the page's URL as the link description unless you have a good reason to do so, such as referencing a site's new address.
- Keep descriptions concise. Aim for a few words or a short phrase.
- Pay attention to your internal links too. Improving the quality of internal links can help both users and search engines navigate your site more easily.

See the [Use links wisely](https://support.google.com/webmasters/answer/7451184#uselinkswisely)
section of Google's [Search Engine Optimization (SEO) Starter Guide](https://support.google.com/webmasters/answer/7451184)
for more tips.

## Resources

- [Source code for **Links do not have descriptive text** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/link-text.js)
- [Search Engine Optimization (SEO) Starter Guide](https://support.google.com/webmasters/answer/7451184)
