---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/notification-on-start
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: 2fc92034d3e5594399aec24a0ba1ba6eb6331ff2e4bb319e6bf94308edfea135
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Good notifications are [timely, relevant, and precise](https://web.dev/articles/push-notifications-overview).
If your page asks for permission to send notifications on page load,
those notifications may not be relevant to your users or their needs.

## How the Lighthouse notification audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages that request notification permissions on load:

Lighthouse checks all JavaScript executed on page load.
If the code calls `notification.requestPermission()`,
and notification permission has not already been granted, the audit fails.

If notification permission was granted to a page before the audit,
Lighthouse can't identify any notification permission requests.
So, make sure to [reset permissions](https://support.google.com/chrome/answer/6148059)
before running the audit.

Lighthouse reports the URL and line number
of each request for notification permission.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## How to ask for users' notification permissions responsibly

Remove all calls to `notification.requestPermission()`
that occur on page load.

To provide a better user experience:

- Offer to send users a specific type of notification.
- Present the permissions request after users opt in to the notification type.

## Resources

- [Source code for **Requests the notification permission on page load** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/notification-on-start.js)
- [Push notifications overview](https://web.dev/articles/push-notifications-overview)
