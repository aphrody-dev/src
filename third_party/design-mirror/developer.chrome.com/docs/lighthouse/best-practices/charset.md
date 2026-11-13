---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/charset
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:12+00:00
sha256: 57683758837547d0cab12ff3ba62391113670ab6ad01090b093cea7dbdc818fa
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Servers and browsers communicate with each other by sending bytes of data over the
internet. If the server doesn't specify which [character encoding format](https://en.wikipedia.org/wiki/Character_encoding) it's
using when it sends an HTML file, the browser won't know what character each byte represents.
The [character encoding declaration](https://html.spec.whatwg.org/multipage/semantics.html#charset)
specification solves this problem.

> [!NOTE]
> **Note:** Theoretically, a late `<meta charset>` element (one that is not fully contained in the first 1024 bytes of the document) can also significantly affect load performance. See [Issue #10023](https://github.com/GoogleChrome/lighthouse/issues/10023#issuecomment-575129051).

## How the Lighthouse `charset` audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
flags pages that do not specify their character encoding:

Lighthouse considers the character encoding to be declared if it finds any of the following:

- A `<meta charset>` element in the `<head>` of the document that is completely contained in the first 1024 bytes of the document
- A `Content-Type` HTTP response header with a `charset` directive that matches a [valid IANA name](https://www.iana.org/assignments/character-sets/character-sets.xhtml)
- A [byte-order mark](https://www.w3.org/International/questions/qa-byte-order-mark) (BOM)

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## How to pass the `charset` audit

### Add a `<meta charset>` element to your HTML

Add a `<meta charset>` element within the first 1024 bytes of your HTML document.
The element must be fully contained within the first 1024 bytes.
The best practice is to make the `<meta charset>` element the first element in the
`<head>` of your document.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ...
  </head>
</html>
```

### Add a `Content-Type` HTTP response header

Configure your server to add a [`Content-Type`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Type)
HTTP response header that includes a `charset` directive.

```console
Content-Type: text/html; charset=UTF-8
```

## Resources

- [Charset declaration is missing or occurs too late in the HTML](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/charset.js)
- [Character encoding](https://en.wikipedia.org/wiki/Character_encoding)
- [`Content-Type`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Type)
- [IANA character set names](https://www.iana.org/assignments/character-sets/character-sets.xhtml)
