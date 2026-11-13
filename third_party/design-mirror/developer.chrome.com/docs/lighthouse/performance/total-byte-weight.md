---
source_url: https://developer.chrome.com/docs/lighthouse/performance/total-byte-weight
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: 0eb65eac84d11b6b386f0296b8d9a57b2afb8de8ad0b26691c374a59982b29ca
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Large network payloads are highly correlated with long load times.
They also cost users money;
for example, users may have to pay for more cellular data.
So, reducing the total size of your page's network requests is good
for your users' experience on your site *and* their wallets.

> [!NOTE]
> **Note:** To see what accessing your site costs around the world, check out WebPageTest's [What Does My Site Cost?](https://whatdoesmysitecost.com/) You can adjust the results to factor in purchasing power.

## How the Lighthouse network payload audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
shows the total size in [kibibytes (KiB)](https://en.wikipedia.org/wiki/Kibibyte) of all resources requested by your page.
The largest requests are presented first:

Based on [HTTP Archive data](https://httparchive.org/reports/state-of-the-web?start=latest#bytesTotal),
the median network payload is between 1,700 and 1,900 KiB.
To help surface the highest payloads,
Lighthouse flags pages whose total network requests exceed 5,000 KiB.

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to reduce payload size

Aim to keep your total byte size below 1,600 KiB.
This target is based on the amount of data that can be
theoretically downloaded on a 3G connection
while still achieving a [Time to Interactive](http://web.dev/articles/tti) of 10 seconds or less.

Here are some ways to keep payload size down:

- Defer requests until they're needed. See the [PRPL Pattern](https://web.dev/articles/apply-instant-loading-with-prpl) for one possible approach.
- Optimize requests to be as small as possible. Possible techniques include:
  - [Minify and compress network payloads](https://web.dev/articles/reduce-network-payloads-using-text-compression).
  - [Use WebP instead of JPEG or PNG for your images](https://web.dev/articles/serve-images-webp).
  - [Set the compression level of JPEG images to 85](https://web.dev/articles/use-imagemin-to-compress-images).
- Cache requests so that the page doesn't re-download the resources on repeat visits. (See the [Network reliability landing page](https://web.dev/explore/reliable) to learn how caching works and how to implement it.)

## Stack-specific guidance

### Angular

Apply [route-level code splitting](https://web.dev/articles/route-level-code-splitting-in-angular) to
minimize the size of your JavaScript bundles. Also, consider precaching assets
with the [Angular service worker](https://web.dev/articles/precaching-with-the-angular-service-worker).

### Drupal

Consider using [Responsive Image Styles](https://www.drupal.org/documentation/modules/responsive_image) to reduce the size of images loaded on your page. If you are using `Views` to show multiple content items on a page, consider implementing pagination to limit the number of content items shown on a given page.

### Joomla

Consider showing excerpts in your article categories (one popular solution is a "read more"
link), reducing the number of articles shown on a given page, breaking your long
posts into multiple pages, or using a plugin to lazy-load comments.

### WordPress

Consider showing excerpts in your post lists (you can use the "more" tag), reducing
the number of posts shown on a given page, breaking your long posts into
multiple pages, or using a plugin to lazy-load comments.

## Resources

[Source code for **Avoid enormous network payloads** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/total-byte-weight.js)
