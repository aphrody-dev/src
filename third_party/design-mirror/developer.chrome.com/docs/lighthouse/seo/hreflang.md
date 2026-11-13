---
source_url: https://developer.chrome.com/docs/lighthouse/seo/hreflang
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:12+00:00
sha256: 61455fad82b02e317fe338a513f6e72f808fd8ce0f03fb45ac056cad12c0809e
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Many sites provide different versions of a page based on a user's language or
region. `hreflang` links tell search engines the URLs for all the versions of
a page so that they can display the correct version for each language or region.

## How the Lighthouse `hreflang` audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags
incorrect `hreflang` links:

Lighthouse checks for `hreflang` links
in the page's `head` and in its [response headers](https://developer.mozilla.org/docs/Glossary/Response_header).

Lighthouse then checks for valid language codes within the `hreflang`links.
Lighthouse reports any `hreflang` links with invalid language codes.

Lighthouse does not check region codes or your [sitemap](https://support.google.com/webmasters/answer/156184).

> [!NOTE]
> **Note:** Each SEO audit is weighted equally in the Lighthouse SEO Score, except for the manual **[Structured data is valid](https://developer.chrome.com/docs/lighthouse/seo/structured-data.md.txt)** audit. Learn more in the [Lighthouse Scoring Guide](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt).

## How to define an `hreflang` link for each version of a page

Suppose that you have three versions of a page:

- An English version at `https://example.com`
- A Spanish version at `https://es.example.com`
- A German version at `https://de.example.com`

There are three ways to tell search engines that these pages are equivalent.
Choose whichever method is easiest for your situation.

**Option 1:** Add `hreflang` links to the `<head>` of each page:

```html
<link rel="alternate" hreflang="en" href="https://example.com" />
<link rel="alternate" hreflang="es" href="https://es.example.com" />
<link rel="alternate" hreflang="de" href="https://de.example.com" />
```

Each version of a page must link to all other versions,
**including itself** . Otherwise, search engines may ignore the `hreflang` links
or interpret them incorrectly.

For pages that allow users to select their language, use the `x-default`
keyword:

```html
<link rel="alternate" href="https://example.com" hreflang="x-default" />
```

**Option 2:** Add `Link` headers to your HTTP response:

```html
Link: <https://example.com>; rel="alternate"; hreflang="en", <https://es.example.com>;
rel="alternate"; hreflang="es", <https://de.example.com>; rel="alternate"; hreflang="de"
```

**Option 3:** Add language version information to your [sitemap](https://support.google.com/webmasters/answer/156184).

```xml
<url>
<loc>https://example.com</loc>

<xhtml:link rel="alternate" hreflang="es"
href="https://es.example.com"/>

<xhtml:link rel="alternate" hreflang="de"
href="https://es.example.com"/>

</url>
```

> [!NOTE]
> **Note:** For more information, see Google's [Tell Google about localized versions of your page](https://support.google.com/webmasters/answer/189077).

## Guidelines for `hreflang` values

- The `hreflang` value must always specify a language code.
- The language code must follow [ISO 639-1 format](https://wikipedia.org/wiki/List_of_ISO_639-1_codes).
- The `hreflang` value can also include an optional regional code. For example, `es-mx` is for Spanish speakers in Mexico, while `es-cl` is for Spanish speakers in Chile.
- The region code must follow the [ISO 3166-1 alpha-2 format](https://wikipedia.org/wiki/ISO_3166-1_alpha-2).

## Resources

- [Source code for **Document does not have a valid `hreflang`** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/seo/hreflang.js)
- [Tell Google about localized versions of your page](https://support.google.com/webmasters/answer/189077)
- [ISO 639-1 format](https://wikipedia.org/wiki/List_of_ISO_639-1_codes)
- [ISO 3166-1 alpha-2 format](https://wikipedia.org/wiki/ISO_3166-1_alpha-2)
