---
source_url: https://developer.chrome.com/docs/lighthouse/seo/meta-description
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: f12b95752a6950b563ef0dc8525d772db2b730833cf65fb1a02f54c6fc0e353d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

The `<meta name="description">` element provides a summary of a page's content
that search engines include in search results. A high-quality, unique meta
description makes your page appear more relevant and can increase your search
traffic.

## How the Lighthouse meta description audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages
without a meta description:

The audit fails if:

- Your page doesn't have a `<meta name=description>` element.
- The `content` attribute of the `<meta name=description>` element is empty.

Lighthouse doesn't evaluate the quality of your description.

> [!NOTE]
> **Note:** Each SEO audit is weighted equally in the Lighthouse SEO Score, except for the manual **[Structured data is valid](https://developer.chrome.com/docs/lighthouse/seo/structured-data.md.txt)** audit. Learn more in the [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt).

## How to add a meta description

Add a `<meta name=description>` element to the `<head>` of each of your pages:

```html
<meta name="description" content="Put your description here." />
```

If appropriate, include clearly tagged facts in the descriptions. For example:

```html
<meta
  name="description"
  content="Author: A.N. Author,
    Illustrator: P. Picture, Category: Books, Price: $17.99,
    Length: 784 pages"
/>
```

## Meta description best practices

- Use a unique description for each page.
- Make descriptions clear and concise. Avoid vague descriptions like "Home."
- Avoid [keyword stuffing](https://support.google.com/webmasters/answer/66358). It doesn't help users, and search engines may mark the page as spam.
- Descriptions don't have to be complete sentences; they can contain structured data.

Here are examples of good and bad descriptions:
Don't

```html
<meta name="description" content="A donut recipe." />
```

Too vague.
Do

```html
<meta
  name="description"
  content="Mary's simple recipe for maple bacon donuts
           makes a sticky, sweet treat with just a hint
           of salt that you'll keep coming back for."
/>
```

Descriptive yet concise.

See Google's [Create good titles and snippets in Search Results](https://support.google.com/webmasters/answer/35624#1)
page for more tips.

## Resources

- [Source code for **Document does not have a meta description** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/meta-description.js)
- [Create good titles and snippets in Search Results](https://support.google.com/webmasters/answer/35624#1)
- [Irrelevant keywords](https://support.google.com/webmasters/answer/66358)
