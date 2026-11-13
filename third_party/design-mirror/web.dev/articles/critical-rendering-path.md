---
source_url: https://web.dev/articles/critical-rendering-path
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: d6669f19b41efe755adb364ddde501932fe79b006376156dc91d8b92ae0bc956
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Ilya Grigorik [X](https://twitter.com/igrigorik) [Homepage](https://igvita.com/)

Published: March 31, 2014

*Optimizing the critical rendering path* refers to prioritizing the display of
content that relates to the current user action.

Delivering a fast web experience requires a lot of work by the browser. Most of
this work is hidden from us as web developers: we write the markup, and a nice
looking page comes out on the screen. But how exactly does the browser go from
consuming our HTML, CSS, and JavaScript to rendered pixels on the screen?

Optimizing for performance is all about understanding what happens in these
intermediate steps between receiving the HTML, CSS, and JavaScript bytes and
the required processing to turn them into rendered pixels - that's
the **critical rendering path**.

By optimizing the critical rendering path we can significantly improve the
time to first render of our pages. Further, understanding the critical
rendering path also serves as a foundation for building well-performing
interactive applications. The interactive updates process is the same, just done in a continuous loop and ideally at 60 frames per second!
But first, an overview of how the browser displays a simple page.

## Additional resources

- [Constructing the Object Model](https://web.dev/articles/critical-rendering-path/constructing-the-object-model.md.txt)
- [Render-tree Construction, Layout, and Paint](https://web.dev/articles/critical-rendering-path/render-tree-construction.md.txt)
- [Render-blocking CSS](https://web.dev/articles/critical-rendering-path/render-blocking-css.md.txt)
- [Adding Interactivity with JavaScript](https://web.dev/articles/critical-rendering-path/adding-interactivity-with-javascript.md.txt)
- [Measuring the Critical Rendering Path](https://web.dev/articles/critical-rendering-path/measure-crp.md.txt)
- [Analyzing Critical Rendering Path Performance](https://web.dev/articles/critical-rendering-path/analyzing-crp.md.txt)
- [Optimizing the Critical Rendering Path](https://web.dev/articles/critical-rendering-path/optimizing-critical-rendering-path.md.txt)
- [PageSpeed Rules and Recommendations](https://web.dev/articles/critical-rendering-path/page-speed-rules-and-recommendations.md.txt)

## Feedback
