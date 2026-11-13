---
source_url: https://developer.chrome.com/docs/lighthouse/performance/render-blocking-resources
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:25+00:00
sha256: bde9fa38b4e4b7e1e20355d9b0afd6263649866762a95ffc4bd3dae72a73d5b3
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has moved into the [Render-blocking requests](https://developer.chrome.com/docs/performance/insights/render-blocking.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

The Opportunities section of your Lighthouse report lists all URLs
blocking the first paint of your page.
The goal is to reduce the impact of these render-blocking URLs
by inlining critical resources, deferring non-critical resources,
and removing anything unused.

## Which URLs get flagged as render-blocking resources?

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt)
flags two types of render-blocking URLs: scripts and stylesheets.

A `<script>` tag that:

- Is in the `<head>` of the document.
- Does not have a `defer` attribute.
- Does not have an `async` attribute.

A `<link rel="stylesheet">` tag that:

- Does not have a `disabled` attribute. When this attribute is present, the browser does not download the stylesheet.
- Does not have a `media` attribute that matches the user's device specifically. `media="all"` is considered render-blocking.

## How to identify critical resources

The first step towards reducing the impact of render-blocking resources
is to identify what's critical and what's not.
Use the [Coverage tab](https://developer.chrome.com/docs/devtools/coverage.md.txt)
in Chrome DevTools to identify non-critical CSS and JS.
When you load or run a page, the tab tells you how much code was used,
versus how much was loaded:
 Chrome DevTools: Coverage tab.

You can reduce the size of your pages by only shipping the code and styles
that you need. Click on a URL to inspect that file in the Sources panel.
Styles in CSS files and code in JavaScript files are marked in two colors:

- **Green (critical):** Styles that are required for first paint; code that's critical to the page's core functionality.
- **Red (non-critical):** Styles that apply to content not immediately visible; code not being used in page's core functionality.

## How to eliminate render-blocking scripts

Once you've identified critical code,
move that code from the render-blocking URL to an inline `script` tag in your HTML page.
When the page loads, it will have what it needs to handle the page's core functionality.

If there's code in a render-blocking URL that's not critical,
you can keep it in the URL,
and then mark the URL with `async` or `defer` attributes
(see also [Adding Interactivity with JavaScript](https://web.dev/articles/critical-rendering-path/adding-interactivity-with-javascript)).

Code that isn't being used at all should be removed (see [Remove unused code](https://web.dev/articles/remove-unused-code)).

## How to eliminate render-blocking stylesheets

Similar to inlining code in a `<script>` tag,
inline critical styles required for the first paint
inside a `<style>` block at the `head` of the HTML page.
Then load the rest of the styles asynchronously using the `preload` link
(see [Defer unused CSS](https://web.dev/articles/defer-non-critical-css)).

Consider automating the process of extracting and inlining "Above the Fold" CSS
using the [Critical tool](https://github.com/addyosmani/critical/blob/master/README.md).

Another approach to eliminating render-blocking styles is
to split up those styles into different files, organized by media query.
Then add a media attribute to each stylesheet link.
When loading a page,
the browser only blocks the first paint to retrieve the stylesheets that match the user's device
(see [Render-Blocking CSS](https://web.dev/articles/critical-rendering-path/render-blocking-css)).

Finally, you'll want to minify your CSS to remove any extra whitespace or
characters (see [Minify CSS](https://web.dev/articles/minify-css)).
This ensures that you're sending the smallest possible bundle to your users.

## Stack-specific guidance

### AMP

Use tools such as [AMP Optimizer](https://github.com/ampproject/amp-toolbox/tree/master/packages/optimizer)
to [server-side render AMP layouts](https://amp.dev/documentation/guides-and-tutorials/optimize-and-measure/server-side-rendering/).

### Drupal

Consider using [a module](https://www.drupal.org/project/critical_css) to inline critical CSS and JavaScript, and use the defer attribute for non-critical CSS or JavaScript.

### Joomla

There are a number of Joomla plugins that can help you [inline critical assets](https://extensions.joomla.org/instant-search/?jed_live%5Bquery%5D=performance)
or [defer less important resources](https://extensions.joomla.org/instant-search/?jed_live%5Bquery%5D=performance).

### WordPress

There are a number of WordPress plugins that can help you [inline critical assets](https://wordpress.org/plugins/search/critical+css/) or [defer less important resources](https://wordpress.org/plugins/search/defer+css+javascript/).

## Resources

- [Source code for **Eliminate render-blocking resources** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/render-blocking-resources.js)
- [Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting)
- [Remove unused code codelab](https://web.dev/codelab-remove-unused-code)
- [JavaScript Start-up Optimization](https://web.dev/articles/optimizing-content-efficiency-javascript-startup-optimization)
