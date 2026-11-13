---
source_url: https://web.dev/learn/images/vector-images
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: a02c9a0019228e6415afb0068bc5a7a62a2caee62bd8e38cdcd444e66ac4d0a8
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Vector graphics are a method of communicating a series of shapes, coordinates, and paths to their rendering context. They
are a set of instructions for how an image should be drawn. When that image is scaled up or down, the set of points and lines that
the image represents are redrawn to scale. A smooth curve between two points will be redrawn just as smoothly at any size---similar
to the way a CSS-defined border on an HTML element is redrawn as that element is scaled in the viewport.

Scalable Vector Graphics (SVG) is an XML-based markup language developed by the W3C. It is a vector image format designed
for the modern web.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/WNKorKN?height=500&amp;theme-id=light&amp;default-tab=html%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen WNKorKN by web-dot-dev on Codepen"></iframe>

Any design software dedicated to editing vector artwork will allow you to export an image as an SVG. But being a standardized,
human-readable markup language, SVG can also be created and edited with any text editing software, regardless of the software used
to create it, though that quickly becomes unrealistic for images of any real complexity. SVG can be styled with CSS, or contain
JavaScript that builds behaviors and interactions into the images themselves.

Even beyond the obvious appeal for designers and developers, SVG is also an incredibly powerful format in terms of the end user experience.
The descriptive information contained within an SVG source is often highly compact compared to raster image formats' more prescriptive
pixel-grid-based information, in the case of simple shapes---to oversimplify somewhat, the difference between telling the browser
"draw a 1px red line between 1x1 and 1x5" and "1x1 is a red pixel. 1x2 is a red pixel. 1x3 is a red pixel. 1x4 is a red pixel. 1x5 is a red pixel."
The flip side is that the descriptive nature of SVG requires more interpretation---more "thinking"---from the browser. For this reason,
complex SVGs can be more taxing to render. In the same vein, a highly complex image could mean a verbose set of instructions, and a large transfer size.

It may take a little trial and error before you're able to instantly recognize an image source candidate as better served by SVG rather than a
conventional raster format. There are a few guidelines, though: interface elements like icons are almost always well served by SVG. Artwork with
sharp lines, solid colors, and clearly-defined shapes will likely be a strong candidate for SVG.

SVG is a huge topic: an entire markup language made to coexist alongside HTML, with unique styling options and capabilities. For a more detailed
introduction to SVG see the [MDN SVG tutorial](https://developer.mozilla.org/docs/Web/SVG/Tutorial/Introduction).
