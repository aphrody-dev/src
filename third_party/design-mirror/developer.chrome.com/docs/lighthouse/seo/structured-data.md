---
source_url: https://developer.chrome.com/docs/lighthouse/seo/structured-data
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: 84939beda053c110e037f0262e532c2a18985744de35b57ddb755e3af7d558a8
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Search engines use structured data to understand what kind of content is on
your page. For example, you can tell search engines that your page is an
article, a job posting, or an FAQ.

Marking up your content with structured data makes it more likely that it will
be included in rich search results. For example, content marked up as an article
might appear in a list of top stories relevant to something the user searched
for.

> [!NOTE]
> **Note:** The [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) structured data audit is manual, so it does not affect your Lighthouse SEO score.

## How to mark up your content

1. Identify the [content type](https://developers.google.com/search/docs/guides/mark-up-content#content_types) that represents your content.
2. Create the structured data markup using the [reference docs for that content type](https://developers.google.com/search/docs/guides/search-gallery).
3. Insert the markup into each page you wish to make eligible to search engines.
4. Run the [Structured Data Linter](http://linter.structured-data.org/) to validate your structured data.
5. Test how the markup works in Google Search using the [Structured Data Testing Tool](https://search.google.com/structured-data/testing-tool/).

See Google's [Mark Up Your Content Items](https://developers.google.com/search/docs/guides/mark-up-content)
page for more information.

## Resources

- [Source code for **Structured data is valid** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/manual/structured-data.js)
- [Mark Up Your Content Items](https://developers.google.com/search/docs/guides/mark-up-content)
- [Structured Data Testing Tool](https://search.google.com/structured-data/testing-tool/)
- [Structured Data Linter](http://linter.structured-data.org/)
- [Google search gallery](https://developers.google.com/search/docs/guides/search-gallery)
