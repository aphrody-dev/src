---
source_url: https://web.dev/articles/performance-audit-security
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: a03250367271e1e7e94f54085fbc7d54dd3ad3e9c36c9da4e293848aa5e2b54b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Sam Dutton [X](https://twitter.com/sw12) [GitHub](https://github.com/samdutton) [Mastodon](https://techhub.social/@samdutton) [Bluesky](https://bsky.app/profile/samdutton.bsky.social) [Homepage](https://samdutton.com)

You won't be able to build a PWA without HTTPS.

Serving your site over HTTPS is fundamental for security, and many APIs won't work without it. If
you need to justify implementation costs, find out [why HTTPS matters](https://web.dev/web/fundamentals/security/encrypt-in-transit/why-https).

If a site uses HTTP for any assets, users will be warned in the URL bar. Chrome displays a warning
like the following.
 *From Chrome 68, the address bar warns if not all assets use HTTPS*

HTTPS should be implemented everywhere --- not just, for example, on login or checkout pages. Any
insecure page or asset can be a vector for attack, making your site a liability for your users and
your business.

Site security is easy to check with [Chrome DevTools Security panel](https://web.dev/web/tools/chrome-devtools/security). Keep a record of any
problems.

The site in the following example is not secure, since some assets are served over HTTP.
 *Chrome DevTools Security panel*
