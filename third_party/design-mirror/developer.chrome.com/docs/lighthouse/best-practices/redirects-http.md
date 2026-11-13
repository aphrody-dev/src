---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/redirects-http
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:33+00:00
sha256: dd3184f30dfb0fb27b421008ed912e54e33d87945ab92a70885696f2be8e882a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

All sites should be protected with HTTPS. Learn why and how to
[set up HTTPS on your server](https://developer.chrome.com/docs/lighthouse/best-practices/is-on-https.md.txt).

## How the Lighthouse HTTP redirection audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
flags pages that aren't redirected to HTTPS:
Lighthouse audit that shows that HTTP traffic isn't redirected to HTTPS.

Lighthouse changes the page's URL to HTTP, loads the page, then waits for the
[Chrome Remote Debugging Protocol](https://github.com/ChromeDevTools/devtools-protocol)
event that indicates that the page is secure.
If Lighthouse doesn't receive the event within 10 seconds, the audit fails.

## How to redirect HTTP traffic to HTTPS

Once you've set up HTTPS,
make sure that all unsecure HTTP traffic to your site is redirected to HTTPS:

- Use [canonical links](https://developer.chrome.com/docs/lighthouse/seo/canonical.md.txt) in the head of your HTML document to help search engines figure out the best way to get to the page.
- Configure your server to redirect HTTP traffic to HTTPS:
  - [nginx](https://serverfault.com/questions/67316)
  - [Apache](https://stackoverflow.com/questions/16200501)
  - [Cloudflare](https://www.cloudflare.com/website-optimization/automatic-https-rewrite/)
  - [Microsoft IIS](https://serverfault.com/q/893315)

## Resources

- [Source code for the **Does not redirect HTTP traffic to HTTPS** audit](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/redirects-http.js)
- Best practices to address:
  - [Does not use HTTPS](https://developer.chrome.com/docs/lighthouse/best-practices/is-on-https.md.txt)
  - [Document does not have a valid `rel=canonical`](https://developer.chrome.com/docs/lighthouse/seo/canonical.md.txt)
