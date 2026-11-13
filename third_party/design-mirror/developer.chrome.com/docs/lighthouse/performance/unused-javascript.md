---
source_url: https://developer.chrome.com/docs/lighthouse/performance/unused-javascript
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:12+00:00
sha256: 02273409e3d97425bb550777f05097b7c811ef4f093db10525914071b153abbb
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Unused JavaScript can slow down your page load speed:

- If the JavaScript is [render-blocking](https://web.dev/critical-rendering-path-adding-interactivity-with-javascript/), the browser must download, parse, compile, and evaluate the script before it can proceed with all of the other work that's needed for rendering the page.
- Even if the JavaScript is asynchronous (not render-blocking), the code competes for bandwidth with other resources while it's downloading, which has significant performance implications. Sending unused code over the network is also wasteful for mobile users who don't have unlimited data plans.

## How the unused JavaScript audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
flags every JavaScript file with more than 20 kibibytes of unused code:
 Click a value in the **URL** column to open the script's source code in a new tab.

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## How to remove unused JavaScript

### Detect unused JavaScript

The [Coverage tab](https://developer.chrome.com/docs/devtools/css/reference.md.txt#coverage) in Chrome DevTools can give you a line-by-line
breakdown of unused code.

The [`Coverage`](https://pptr.dev/#?product=Puppeteer&version=v4.0.0&show=api-class-coverage) class in Puppeteer can help you automate the
process of detecting unused code and extracting used code.

### Build tool for support for removing unused code

Check out the following [Tooling.Report](https://tooling.report) tests to find out if your bundler
supports features that make it easier to avoid or remove unused code:

- [Code Splitting](https://bundlers.tooling.report/code-splitting/)
- [Unused Code Elimination](https://bundlers.tooling.report/transformations/dead-code/)
- [Unused Imported Code](https://bundlers.tooling.report/transformations/dead-code-dynamic/)

## Stack-specific guidance

### Angular

If you are using Angular CLI, include source maps in your production build to
[inspect your bundles](https://angular.io/guide/deployment#inspect-the-bundles).

### Drupal

Consider removing unused JavaScript assets and only attach the needed `Drupal` libraries to the relevant page or component in a page. See the [Drupal documentation](https://www.drupal.org/docs/develop/theming-drupal/adding-assets-css-js-to-a-drupal-theme-via-librariesyml#define) for details. To identify attached libraries that are adding extraneous JavaScript, try running [code coverage](https://developer.chrome.com/docs/devtools/coverage.md.txt) in Chrome DevTools. You can identify the theme or module responsible from the URL of the script when JavaScript aggregation is disabled in your `Drupal` site. Look out for themes or modules that have many scripts in the list which have a lot of red in code coverage. A theme or module should only attach a script library if it is actually used on the page.
for details.

### Joomla

Consider reducing, or switching, the number of [Joomla extensions](https://extensions.joomla.org/) loading unused JavaScript in your
page.

### Magento

Disable Magento's built-in [JavaScript bundling](https://devdocs.magento.com/guides/v2.3/frontend-dev-guide/themes/js-bundling.html).

### React

If you are not server-side rendering, [split your JavaScript bundles](https://web.dev/articles/code-splitting-suspense) with `React.lazy()`.
Otherwise, code-split using a third-party library such as
[loadable-components](https://loadable-components.com/docs/getting-started/).

### Vue

If you are not server-side rendering and using the [Vue router](https://next.router.vuejs.org), split the bundles by [lazy loading routes](https://next.router.vuejs.org/guide/advanced/lazy-loading.html).

### WordPress

Consider reducing, or switching, the number of [WordPress plugins](https://wordpress.org/plugins/) loading unused JavaScript in your page.

## Resources

- [Source code for the **Remove unused code** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/unused-javascript.js)
- [Remove unused code](https://web.dev/articles/remove-unused-code)
- [Adding interactivity with JavaScript](https://web.dev/critical-rendering-path-adding-interactivity-with-javascript/)
- [Code Splitting](https://bundlers.tooling.report/code-splitting/)
- [Dead Code Elimination](https://bundlers.tooling.report/transformations/dead-code/)
- [Dead Imported Code](https://bundlers.tooling.report/transformations/dead-code-dynamic/)
- [Find Unused JavaScript And CSS Code With The Coverage Tab In Chrome DevTools](https://developer.chrome.com/docs/devtools/css/reference.md.txt#coverage)
- [class: `Coverage`](https://pptr.dev/#?product=Puppeteer&version=v4.0.0&show=api-class-coverage)
