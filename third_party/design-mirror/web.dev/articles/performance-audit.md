---
source_url: https://web.dev/articles/performance-audit
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: c3deb89865c8b2352f4e97b430d608c7f4f73a61ce5e3c409761cad67a54b748
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Sam Dutton [X](https://twitter.com/sw12) [GitHub](https://github.com/samdutton) [Mastodon](https://techhub.social/@samdutton) [Bluesky](https://bsky.app/profile/samdutton.bsky.social) [Homepage](https://samdutton.com)

> [!TIP]
> **Tip:** Take the [Learn Performance course](https://web.dev/learn/performance.md.txt) for more in-depth resources and techniques.

You may have heard about the good things that
[Progressive Web App (PWA)](https://web.dev/learn/pwa.md.txt) techniques can do for your
site. You might feel tempted to add PWA features without improving the
foundation of your site's performance. But no amount of PWA features can fix
problems with blocking JavaScript and bloated images.

Instead, your first step is to perform a *site audit*, an objective review of
what works well, and where it can be improved.

Auditing your site or app helps you build a resilient, performant experience.
Plus, highlight quick wins that can be implemented with minimal sign-off. An
audit creates a baseline for data-driven development. Did a change make
things better? How does your site compare with competitors? You get metrics to
prioritize effort, and concrete evidence to brag about once you've
made improvements.

## With only 5 minutes

Run [Lighthouse](https://developer.chrome.com/docs/lighthouse) on your homepage and [save the
report data](https://web.dev/web/tools/lighthouse#gists). You get a quantified
baseline and a todo list for improvements to performance, accessibility, security and SEO.

## With only 30 minutes

[Lighthouse](https://developer.chrome.com/docs/lighthouse) is probably still the
best place to start, but with more time you can also record results from other
tools:

- [Chrome DevTools Security panel](https://web.dev/docs/devtools/security): HTTPS usage.
- [Chrome DevTools Network requests panel](https://web.dev/docs/devtools/network-request-blocking): load timings; resource sizes and number of requests for HTML, CSS, JavaScript, images, fonts and other files.
- Chrome Task Manager: If your site regularly uses significant CPU or more memory than other apps, you may need to fix memory leaks, task running, or resource loading problems.
- [WebPagetest](https://www.webpagetest.org/): caching, time to first byte, CDN usage.
- [Pagespeed Insights](https://pagespeed.web.dev/): load performance, data cost and resource usage, including Chrome User Experience report data highlighting real-world performance statistics.

Make sure to test your website as a first-time user sees it. Open the site an
Incognito (Private) Window, or use browser tools to disable caching and clear
storage. This ensures that every asset is retrieved from the network and not
from a local cache, so you get an accurate picture of first-load performance.

> [!NOTE]
> **Note:** [WebPagetest](https://www.webpagetest.org) is a service that runs performance tests from multiple locations globally using real browsers with real connections, to provide detailed metrics and optimization advice.
>
> - Generate a Lighthouse audit and report with every WebPagetest trace.
> - Measure site on first visit and repeat views, for example, to see how much service worker caching helps.
> - Visually compare multiple sites with filmstrip and waterfall comparisons.

Nothing beats real world testing. Make sure to test your site on devices and
with connectivity that are representative of your users, and keep a record of
your subjective experience.

## If you're bewildered by tools

Take a look at our guide: [How To Think About Speed Tools](https://web.dev/articles/speed-tools.md.txt).

If nothing else, use [Lighthouse](https://developer.chrome.com/docs/lighthouse) to check for:

- HTTPS: [every site should deliver all assets over HTTPS](https://web.dev/articles/why-https-matters.md.txt).
- Server settings: your web server or CDN should [use compression correctly](https://web.dev/articles/optimizing-content-efficiency-optimize-encoding-and-transfer.md.txt), [use HTTP/2](https://hpbn.co/http2/), and [include appropriate headers](https://web.dev/articles/codelab-http-cache.md.txt) to enable your browser to cache resources.
- Script elements that can be moved to the bottom of the page or given an [async or defer](https://web.dev/articles/async-functions.md.txt) attribute.
- JavaScript and libraries that can be removed.
- [Unused code](https://web.dev/articles/remove-unused-code.md.txt), such as CSS and JavaScript libraries.
- [Image pixel size reduction opportunities](https://web.dev/learn/performance/image-performance.md.txt).
- File format changes that would improve an image's size, such as changing a PNG to a JPG.

## Audience, stakeholders, context

Priorities for refactoring depend on your audience, content and functionality.
Who visits your site? Why and how do they use it? What's your [performance
budget](https://web.dev/articles/performance-budgets-101)?

Who are your stakeholders, and what are their priorities? This affects how you
structure, present, and share your audit data.

If you can't audit your whole site, check page analytics to get an idea of where
to focus. High bounce rates, low time-on-page and unexpected exit pages can be a
good indicator of where to begin. Likewise business metrics such as hosting
costs, ad clicks and conversions. Get an overview from stakeholders of what data
matters to them.

## Test, record, fix, repeat

Record the state of your site **before** making any changes, to uncover problems and
set a starting point for improvements or regressions. That gives you data to
justify and reward development effort.

Test multiple page types within your site. For single page apps, test the
components, routes and UX flows, rather than just the first load experience.
