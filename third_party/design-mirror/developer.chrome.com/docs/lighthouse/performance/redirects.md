---
source_url: https://developer.chrome.com/docs/lighthouse/performance/redirects
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: 0ff2f387e50d17c6166b2ffff067eaec4fed42ebe372a8e20bfe737c9326f3f7
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has moved into the [Document request latency](https://developer.chrome.com/docs/performance/insights/document-latency.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

Redirects slow down your page load speed.
When a browser requests a resource that has been redirected,
the server usually returns an HTTP response like this:

```javascript
HTTP/1.1 301 Moved Permanently
Location: /path/to/new/location
```

The browser must then make another HTTP request at the new location
to retrieve the resource.
This additional trip across the network can delay the loading
of the resource by hundreds of milliseconds.

## How the Lighthouse multiple redirects audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
flags pages that have multiple redirects:

A page fails this audit when it has two or more redirects.

## How to eliminate redirects

Point links to flagged resources
to the resources' current locations.
It's especially important to avoid redirects in resources
required for your [Critical Rendering Path](https://web.dev/articles/critical-rendering-path).

If you're using redirects to divert mobile users to the mobile version of your page,
consider redesigning your site to use
[Responsive Design](https://web.dev/articles/responsive-web-design-basics).

## Stack-specific guidance

### Drupal

Redirects introduce additional delays before the page can be loaded. If the
[Redirect](https://www.drupal.org/project/redirect) module is installed, review
and remove unnecessary redirects.
[Learn more](https://developers.google.com/web/tools/lighthouse/audits/redirects).

### React

If you are using React Router, minimize usage of the `<Redirect>` component for
[route navigations](https://reacttraining.com/react-router/web/api/Redirect).

## Resources

- [Source code for **Avoid multiple page redirects** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/redirects.js)
- [Redirections in HTTP](https://developer.mozilla.org/docs/Web/HTTP/Redirections)
- [Avoid Landing Page Redirects](https://developers.google.com/speed/docs/insights/AvoidRedirects)
