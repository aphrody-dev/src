---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/clickjacking-mitigation
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: b4fcbe70da4be6e668b80900fcb9390cc5cfd84cd7d936d04b2f5b0b661b0431
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Clickjacking is a malicious attack where users are tricked into clicking on links or UI elements on a site that appears to be a trusted and familiar site. This is typically accomplished by embedding part or all of the trusted site into the malicious site using an `<iframe>`.

The [`X-Frame-Options` (XFO) header](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Frame-Options) and the [`frame-ancestors` directive](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors) in the `Content-Security-Policy` (CSP) header can mitigate clickjacking attacks by controlling how a site can be embedded within an `<iframe>`.

## How the Lighthouse audit fails

The audit will pass if the XFO header is set with `SAMEORIGIN` or `DENY`, or the `frame-ancestors` directive is set on the CSP header. The audit will fail if neither of these frame control policies are configured.
Lighthouse report warning that no CSP or XFO response header was found to mitigate clickjacking.

## How to set a frame control policy to mitigate clickjacking

A frame control policy needs to be set on the HTTP headers of the initial document request. The `X-Frame-Options` header and the `frame-ancestors` directive in the `Content-Security-Policy` won't work if set on a `<meta>` element.

### XFO header

Setting either `DENY` or `SAMEORIGIN` for the XFO header will mitigate clickjacking attacks:

    X-Frame-Options: SAMEORIGIN

    X-Frame-Options: DENY

The `SAMEORIGIN` directive permits the page to be displayed only if all ancestor frames share the same origin as the page itself. Conversely, the `DENY` directive prevents the page from being displayed in a frame, regardless of the parent frame origin.

### CSP header

The `frame-ancestors` directive within the CSP header defines what sites may embed the given page in a `<frame>`, `<iframe>`, `<object>`, or `<embed>`. Similar to XFO, the CSP `frame-ancestors` directive can be used to mitigate clickjacking attacks by setting it to `self` or `none`:

    Content-Security-Policy: frame-ancestors 'self';

    Content-Security-Policy: frame-ancestors 'none';

However, the `frame-ancestors` directive is more flexible than XFO because it can set specific parent sources that may embed the page:

    Content-Security-Policy: frame-ancestors 'self' https://example.com;

## Resources

- [X-Frame-Options](https://developer.mozilla.org/docs/Web/HTTP/Headers/X-Frame-Options)
- [frame-ancestors](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
