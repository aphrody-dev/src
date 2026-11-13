---
source_url: https://developer.chrome.com/docs/lighthouse/performance/unused-css-rules
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:15+00:00
sha256: 5832baa68fb553f9bd3d5615c188291451c5aa07fccbaaf4ce37858a24336cbd
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
The Opportunities section of your Lighthouse report lists
all stylesheets with unused CSS with a potential savings of 2 KiB or more.
Remove the unused CSS
to reduce unnecessary bytes consumed by network activity:

## How unused CSS slows down performance

Using a `<link>` tag is a common way to add styles to a page:

```html
<!DOCTYPE html>
<html>
  <head>
    <link href="main.css" rel="stylesheet" />
    ...
  </head>
</html>
```

The `main.css` file that the browser downloads is known as an external stylesheet,
because it's stored separately from the HTML that uses it.

By default, a browser must download, parse, and process all external stylesheets
that it encounters before it can display, or render, any content to a user's screen.
It wouldn't make sense for a browser to attempt to display content
before the stylesheets have been processed,
because the stylesheets may contain rules that affect the styling of the page.

Each external stylesheet must be downloaded from the network.
These extra network trips can significantly increase the time
that users must wait before they see any content on their screens.

Unused CSS also slows down a browser's construction of the
[render tree](https://web.dev/articles/critical-rendering-path/render-tree-construction).
The render tree is like the DOM tree, except that it also includes the styles for each node.
To construct the render tree, a browser must walk the entire DOM tree, and check which CSS rules apply to each node.
The more unused CSS there is,
the more time that a browser might potentially need to spend calculating the styles for each node.

## How to detect unused CSS

The Coverage tab of Chrome DevTools can help you discover critical and uncritical CSS.
See [View used and unused CSS with the Coverage tab](https://developer.chrome.com/docs/devtools/css/reference.md.txt#coverage).
 Chrome DevTools: Coverage tab.

## Inline critical CSS and defer non-critical CSS

Similar to inlining code in a `<script>` tag,
inline critical styles required for the first paint
inside a `<style>` block at the `head` of the HTML page.
Then load the rest of the styles asynchronously using the `preload` link.

Consider automating the process of extracting and inlining "Above the Fold" CSS
using the [Critical tool](https://github.com/addyosmani/critical/blob/master/README.md).

Learn more in [Defer non-critical CSS](https://web.dev/articles/defer-non-critical-css).

## Stack-specific guidance

### Drupal

Consider removing unused CSS rules and only attach the needed `Drupal` libraries
to the relevant page or component in a page. See the
[`Drupal` documentation](https://www.drupal.org/docs/develop/theming-drupal/adding-assets-css-js-to-a-drupal-theme-via-librariesyml#define)
for details.

To identify attached libraries that are adding extraneous CSS, try running
[code coverage](https://developer.chrome.com/docs/devtools/coverage.md.txt) in Chrome DevTools. You can identify the
theme or module responsible from the URL of the stylesheet when CSS aggregation
is disabled in your `Drupal` site.

Look out for themes and modules that have multiple stylesheets listed that
have a lot of red in code coverage. Themes and modules should only attach a
stylesheet library if it's actually used on the page.

### Joomla

Consider reducing, or switching, the number of [Joomla extensions](https://extensions.joomla.org/) loading unused CSS in your page.

### WordPress

Consider reducing, or switching, the number of [WordPress plugins](https://wordpress.org/plugins/) loading unused CSS in your page.

## Resources

- [Source code for **Remove unused CSS** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/unused-css-rules.js)
