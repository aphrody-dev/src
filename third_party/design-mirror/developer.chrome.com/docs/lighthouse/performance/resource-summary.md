---
source_url: https://developer.chrome.com/docs/lighthouse/performance/resource-summary
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: a586520934262f46b53fa9f5652073cf88b8cf893e1625121d8ebd1cc15d15be
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
reports how many network requests were made and
how much data was transferred while your page loaded:
Lighthouse resource summary audit

- The **Requests** and **Transfer Size** values for the **Total** row are computed by adding the values for the **Image** , **Script** , **Font** , **Stylesheet** , **Other** , **Document** , and **Media** rows.
- The **Third-party** column does not factor into the **Total** row's values. Its purpose is to make you aware of how many of the total requests and how much of the total transfer size came from third-party domains. The third-party requests could be a combination of any of the other resource types.

> [!NOTE]
> **Note:** Like all of the **Diagnostics** audits, the **Keep request counts low and transfer sizes small** audit does not directly affect your **Performance** score. However, reducing request counts or transfer sizes may improve other **Performance** metrics.

## How to reduce resource counts and transfer sizes

The effect of high resource counts or large transfer sizes on load performance depends on what
type of resource is being requested.

### CSS and JavaScript

Requests for CSS and JavaScript files are render-blocking by default. In other words,
browsers can't render content to the screen until all CSS and JavaScript requests are finished.
If any of these files are hosted on a slow server, that single slow server can delay the entire
rendering process. See [Optimize your JavaScript](https://web.dev/fast/#optimize-your-javascript/), [Optimize your third-party resources](https://web.dev/fast/#optimize-your-third-party-resources/),
and [Optimize your CSS](https://web.dev/fast/#optimize-your-css/) to learn how to only ship the code that you actually need.

Affected metrics: [All](https://developer.chrome.com/docs/lighthouse/performance#metrics)

### Images

Requests for images aren't render-blocking like CSS and JavaScript, but they can still negatively
affect load performance. A common problem is when a mobile user loads a page and sees that images
have started loading but will take a while to finish. See [Optimize your images](https://web.dev/fast/#optimize-your-images/)
to learn how to load images faster.

Affected metrics: [First Contentful Paint](https://web.dev/fcp/), [Largest Contentful Paint](https://web.dev/lcp/), [Speed Index](https://developer.chrome.com/docs/lighthouse/performance/speed-index.md.txt)

### Fonts

Inefficient loading of font files can cause invisible text during the page load. See
[Optimize your fonts](https://web.dev/fast/#optimize-web-fonts/) to learn how to default to a font that's
available on the user's device and then switch to your custom font when it has finished downloading.

Affected metrics: [First Contentful Paint](https://web.dev/fcp/), [Largest Contentful Paint](https://web.dev/lcp/)

### Documents

If your HTML file is large, the browser has to spend more time parsing the HTML and
constructing the DOM tree from the parsed HTML.

Affected metrics: [First Contentful Paint](https://web.dev/fcp/), [Largest Contentful Paint](https://web.dev/lcp/)

### Media

Animated GIF files are often very large.
See [Replace GIFs with videos](https://web.dev/replace-gifs-with-videos/) to learn how to load animations faster.

Affected metrics: [First Contentful Paint](https://web.dev/fcp/), [Largest Contentful Paint](https://web.dev/lcp/)

## Use performance budgets to prevent regressions

Once you've optimized your code to reduce request counts and transfer sizes, see
[Set performance budgets](https://web.dev/articles/fast#set_performance_budgets) to learn how to prevent regressions.

## Resources

[Source code for **Keep request counts low and transfer sizes small** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/resource-summary.js)
