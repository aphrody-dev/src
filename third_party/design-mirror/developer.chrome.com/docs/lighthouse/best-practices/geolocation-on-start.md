---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/geolocation-on-start
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: 3c3250c29ba422c2a23194407878f431b7c4f2556717f750788c9ed12a7342ac
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Users are mistrustful of or confused by pages
that automatically request their location on page load.

## How the Lighthouse geolocation audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages that request geolocation
permission on load:
 Lighthouse audit showing geolocation request on page load.

Lighthouse checks all JavaScript executed on page load. If the script calls
`geolocation.getCurrentPosition()` or `geolocation.watchPosition()`,
and geolocation permission has not already been granted, the audit fails.

If geolocation permission was granted to a page before the audit,
Lighthouse can't identify any geolocation permission requests.
So, make sure to [reset permissions](https://support.google.com/chrome/answer/6148059)
before running the audit.

Lighthouse reports the URL and line number
of each request for geolocation permission.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## Ask for users' locations responsibly

Remove all calls to `geolocation.getCurrentPosition()` and
`geolocation.watchPosition()` that occur on page load.

To provide a better user experience:

- Consider using the [`<geolocation>` element](https://developer.chrome.com/blog/geolocation-html-element.md.txt).
- Always request geolocation permission after a user action, not on page load.
- Clearly indicate that the action will request geolocation permission.
- Assume users won't give you their locations.
- Use a fallback if users don't grant geolocation permission.

- Learn more about [User Location](https://web.dev/articles/user-location)

## Resources

- View the [source code for **Requests the geolocation permission on page load** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/geolocation-on-start.js)
