---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/use-landmarks
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: 04c6625e2615cbf28203729e1834b39800f9e5402ca38458010ef29cf1ef6f0b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
HTML5 elements such as `main`, `nav`, and `aside` act as landmarks,
or special regions on the page to which
screen readers and other assistive technologies can jump.
By using landmark elements,
you can dramatically improve the navigation experience on your site
for users of assistive technology.
Learn more in Deque University's
[HTML 5 and ARIA Landmarks](https://dequeuniversity.com/rules/axe/4.4/landmark-one-main).

## How to manually check landmarks

Use [the W3C's list of landmark elements](https://www.w3.org/WAI/ARIA/apg/example-index/landmarks/HTML5.html)
to check that each major section of your page is contained by a landmark element.
For example:

```html
<header>
  <p>Put product name and logo here</p>
</header>
<nav>
  <ul>
    <li>Put navigation here</li>
  </ul>
</nav>
<main>
  <p>Put main content here</p>
</main>
<footer>
  <p>Put copyright info, supplemental links, etc. here</p>
</footer>
```

You can also use tools like Microsoft's
[Accessibility Insights extension](https://accessibilityinsights.io/)
to visualize your page structure and catch sections that aren't contained in landmarks:

## How to use landmarks effectively

- Use landmark elements to define major sections of your page instead of relying on generic elements like `<div>` or `<span>`.
- Use landmarks to convey the structure of your page. For example, the `<main>` element should include all content directly related to the page's main idea, so there should only be one per page. See [MDN's summary of content sectioning elements](https://developer.mozilla.org/docs/Web/HTML/Element#content_sectioning) to learn how to use each landmark.
- Use landmarks judiciously. Having too many landmarks can actually make navigation *more* difficult for assistive technology users because it prevents them from easily skipping to a desired piece of content.

> [!NOTE]
> **Note:** If you find that your page has, for example, four `<nav>` elements or ten `<aside>` elements, that may suggest a need to simplify your user interface or content structure, which will likely benefit *all* users.

See the [Headings and landmarks](https://web.dev/headings-and-landmarks) post
for more information.

## Resources

- [Source code for **HTML5 landmark elements are used to improve navigation** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/use-landmarks.js)
- [HTML5 Sectioning Elements (W3C)](https://www.w3.org/WAI/ARIA/apg/example-index/landmarks/HTML5.html)
- [HTML 5 and ARIA Landmarks (Deque University)](https://web.archive.org/web/20210320023151/https://dequeuniversity.com/assets/html/jquery-summit/html5/slides/landmarks.html)
