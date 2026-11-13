---
source_url: https://web.dev/learn/html/images
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:15+00:00
sha256: 7596822bf7c889c48c41d1dcdd05b4a4ac66047aac617f0348c64d14b5fb4455
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
> [!NOTE]
> **Objective:** This module is a high-level overview of various use cases of images in HTML. If you're looking for a deep dive into the topic, visit the [Learn Images course](https://web.dev/learn/images.md.txt).

Decorative images, such as background gradients on buttons or background images on sections of content or the full page,
are presentational and should be applied with CSS. When an image adds context to a document, it is content and should be
embedded with HTML.

The main method for including images is the
[``](https://developer.mozilla.org/docs/Web/HTML/Element/img) tag with the
`src` attribute referencing an image resource and the `alt` attribute
describing the image.

```html

```

Both the [`srcset`](https://web.dev/learn/images/descriptive.md.txt) attribute on `` and the [`<picture>`](https://web.dev/learn/images/prescriptive.md.txt) element provide a way to include multiple image sources with
associated media queries, each with a fallback image source, enabling serving the most appropriate image file based on the device's
resolution, browser capabilities, and the viewport size. The `srcset` attribute enables providing multiple image versions
based on resolution and, along with the `sizes` attribute, browser viewport size.

```html

```

This can also be done with the [`<picture>`](https://developer.mozilla.org/docs/Web/HTML/Element/picture) element, along with [`<source>`](https://developer.mozilla.org/docs/Web/HTML/Element/picture) children, which takes an [``](https://developer.mozilla.org/docs/Web/HTML/Element/img) as a default source.

```html
<picture>
  <source srcset="images/eve.png" media="(max-width: 800px)" />
  <source srcset="images/eve-xl.jpg" />
  
</picture>
```

In addition to these built-in HTML
[responsive image methods](https://web.dev/learn/design/responsive-images.md.txt), HTML also enables
image rendering performance to be improved through various attributes. The
`` tag, and therefore graphical submit buttons
[`<input type="image">`](https://developer.mozilla.org/docs/Web/HTML/Element/input/image),
can include `height` and `width` attributes to set the image's aspect ratio to
reduce content layout shift. The `lazy` attribute enables
[lazy loading](https://web.dev/learn/images/performance-issues.md.txt#deferring_image_requests).

HTML also supports the inclusion of SVG images using the
[`<svg>`](https://www.w3.org/Graphics/SVG/) directly, though SVG
images with the `.svg` extension (or as a
[data-uri](https://css-tricks.com/data-uris/)) can be embedded using the
`` element.

> [!NOTE]
> **Note:** The [`<figure>`](https://developer.mozilla.org/docs/Web/HTML/Element/figure) element, along with its nested [`<figcaption>`](https://developer.mozilla.org/docs/Web/HTML/Element/figcaption) element, enables an image with an associated description to be included. A [figure](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/figure_role) is not limited to just including images. It is a semantic way of referencing images, code snippets, example text, or other content, along with a caption for that content, as a single unit. When including a `<figcaption>`, make sure it is the first or last child nested within the `<figure>`.

At a minimum, each foreground image should include `src` and `alt` attributes.

The `src` file is the path and filename of the embedded image. The `src`
attribute is used to provide the URL for the image. The browser then fetches
the asset and renders it to the page. This attribute is required by ``.
Without it, there is nothing to render.

The `alt` attribute provides alternative text for the image, providing a
description of the image for those unable to see the screen (think search
engines and assistive technologies, and even Alexa, Siri, and Google Assistant),
and may be displayed by the browser if the image doesn't load. In addition to
users with slow networks or capped bandwidth, the `alt` text is incredibly
useful in HTML emails, as many users block images in their email applications.

```html

```

If the image is of SVG file type, also include
[`role="img"`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/Img_role),
which is necessary due to [VoiceOver](https://bugs.webkit.org/show_bug.cgi?id=216364)
[bugs](https://bugs.webkit.org/show_bug.cgi?id=240656).

```html

```

> [!NOTE]
> **Note:** These examples include a slash at the end, also misnamed as a self-closing tag; this is a feature of XML, including SVG and XHTML, but not HTML. To learn more, review the [forms module](https://web.dev/learn/html/forms.md.txt).

## Write effective `alt` image descriptions

Alt attributes aim to be short and concise, providing all the relevant
information that the image conveys while omitting information that is redundant
to other content in the document or otherwise isn't useful. In writing the
text, the tone should reflect the tone of the site.

> [!TIP]
> **Tip:** Image purpose is critical in writing alt text. Read the [Learn Accessibility images module](https://web.dev/learn/accessibility/images.md.txt).

To write effective alternative text, imagine that you are reading the entire
page to a person who can't see it. By using the
[semantic](https://web.dev/learn/html/semantic-html.md.txt#the_role_attribute) `` element, screen
reader users and bots are informed that the element is an image. It's redundant
to include "This is an image/screenshot/photo of" in the `alt`. The user doesn't
need to know there's an image, but they do need to know what information
the image conveys.

Normally, you wouldn't say, "This is a grainy image of a dog wearing a red hat."
Rather, you would relay what the image is conveying in relation to the context
of the rest of the document. What you convey changes, depending on the context
and content of the surrounding text.

For example, the photo of a dog is described in different ways, depending on the
context. If Fluffy is an avatar next to a review for Yuckymeat dog food,
`alt="Fluffy"` suffices.

If the photo is part of Fluffy's adoption page on an animal shelter website, the
target audience is the prospective dog parent. The text should describe the
information conveyed in the image that is relevant to an adopter and which isn't
duplicated in the surrounding text. A longer description, such as
`alt="Fluffy, a tri-color terrier with very short hair, with a tennis ball in her mouth"`
is appropriate. The text of an adoption page generally includes the species,
breed, age, and gender of the adoptable pet, so this does not need to be
repeated in the alt text. But the dog's written biography probably doesn't
include hair length, colors, or toy preferences.

Importantly, we didn't describe the image in-full. The prospective dog owner
doesn't need to know if the dog is indoors or outdoors, or that it has a red
collar and a blue leash.

When using images for iconography, as the `alt` attribute provides the
accessible name, convey the meaning of the icon, not a description of the image.
For example, the magnifying glass icon's alt attribute is `search`. The
icon which looks like a house has `home` as the alt text. The 5-inch floppy
disc icon's description is `save`. If there are two icons of Fluffy used
to indicate best practices and anti-patterns, the smiling dog in a green beret
could have `alt="good"` set, while the snarling dog in a red beret might read
`alt="bad"`. That said, only use standard iconography, and if you use
non-standard icons such as the good and bad Fluffy, include a legend make
sure that the icons are not the only ways of deciphering the meaning of
your UI elements.

If the image is a screenshot or a graph, write what is learned from the image
rather than describing the appearance. While an image can definitely be worth a
thousand words, the description should concisely convey everything that
is learned.

Omit information the user already knows from the context and is otherwise
informed about in the content. For example, if you're on a tutorial page about
changing browser settings and the page is about clicking icons in the browser
chrome, the URL of the page in the screen capture isn't important. Limit the
`alt` to the topic at hand: how to change settings.

The `alt` might be "The settings icon is in the navigation bar below the search
field." Don't include "screenshot" or "machinelearningworkshop"
as the user doesn't need to know it's a screenshot and doesn't need to know
where the tech writer was surfing when they wrote the instructions. The
description of the image is based on the context of why the image was
included in the first place.

If the screen capture shows how to find the browser version number by going to
`chrome://version/`, include the URL in the content of the page as instructions,
and provide an empty string as the alt attribute as the image provides no
information that is not in the surrounding text.

If the image provides no additional information or is purely decorative,
the attribute should still be there, just as an empty string.

```html

```

MachineLearningWorkshop.com has seven foreground images, therefore seven images
with alt attributes: an easter egg light switch, a manual icon, two biographical
photos of Hal and Eve, and three avatars of a blender, a vacuum cleaner, and a
toaster. The foreground image that looks like a magazine is the only one that
is purely decorative. The page also has two background images. These images
are decorative and were added with CSS, thus they're inaccessible.

The magazine, being purely decorative, has an empty `alt` attribute, and a
[`role` of `none`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/presentation_role)
as the image is a purely presentational SVG. If meaningful, SVG images should
include the `role="img"`.

```html

```

There are three reviews at the bottom of the page, each with an image of the
poster. Usually, the `alt` text is the name of the person pictured.

```html

```

Instead, because this is a joke page, you should convey what may not be apparent
to low-vision users so they don't miss the humor. We use the original machine
function as the `alt` instead of using the character's name:

```html

```

The photos of the instructors aren't just avatars: they are biographical images
and therefore get a more detailed description.

If this were a real site, you would provide the bare minimum description of what
the teacher looks like, so a prospective student might recognize them when
entering the classroom.

```html

```

Because this is a joke site, provide the information that is relevant in the
joke context instead:

```html

```

If you were reading the page to a friend over the phone, they wouldn't care what the red dot looks like. In this case, the
history of the movie reference matters.

When writing descriptive text, consider what information the image conveys that is important and relevant to the user and
include that. Remember, the content of the `alt` attribute for an image differs based on the context. All information conveyed in an image
that a sighted user can access and is relevant to the context is what needs to be conveyed; nothing more. Keep it short, precise,
and useful.

The `src` and `alt` attributes are minimum requirements for embedded images. There are a few other attributes we need to discuss.

## Responsive images

There are a myriad of viewport sizes and screen resolutions. You don't want to
waste a mobile user's bandwidth by serving them an image wide enough for a
large screen monitor, but you might want to serve higher resolution images for
tiny devices that have four times the normal screen resolution. There are a
few ways to serve different images based on the viewport size and the screen
resolution.

### ` srcset` attribute

The [`srcset`](https://web.dev/learn/design/responsive-images.md.txt#responsive_images_with_srcset) attribute enables suggesting multiple image files,
with the browser selecting which image to request based on multiple media queries including viewport size and screen resolution.

There can be a single `srcset` attribute per `` element, but that `srcset` can link to multiple images. The `srcset`
attribute accepts a list of comma-separated values, each containing the URL of the asset followed by a space followed by
descriptors for that image option. If a width descriptor is used, you must also include the `sizes` attribute with a media
query or source size for each `srcset` option other than the last one. The Learn sections covering [responsive images with `srcset`](https://web.dev/learn/design/responsive-images.md.txt#responsive_images_with_srcset) and [descriptive syntaxes](https://web.dev/learn/images/descriptive.md.txt) are worth reading.

The `srcset` image takes precedence over the `src` image if there is a match.

### `<picture>` and `<source>`

Another method for providing multiple resources and allowing the browser to render the most appropriate asset is with the
[`<picture>`](https://developer.mozilla.org/docs/Web/HTML/Element/picture) element. The `<picture>` element is a container
element for multiple image options listed in an unlimited number of [`<source>`](https://developer.mozilla.org/docs/Web/HTML/Element/source)
elements and a single required [``](https://developer.mozilla.org/docs/Web/HTML/Element/img) element.

The [`<source>`](https://developer.mozilla.org/docs/Web/HTML/Element/source) attributes include `srcset`, `sizes`, `media`, `width`, and `height`.
The `srcset` attribute is common to `img`, `source`, and `link`, but is generally implemented slightly differently on source
as media queries can be listed in the `<srcset>`'s media attribute instead. `<source>` also supports image formats defined in the `type` attribute.

The browser considers each child `<source>` element and choose the best match among them. If no matches are found, the URL
of the `` element's [`src`](https://developer.mozilla.org/docs/Web/HTML/Element/img#attr-src) attribute is selected. The accessible name comes from the `alt` attribute of the nested ``.
The Learn sections covering the [`<picture>`](https://web.dev/learn/design/picture-element.md.txt) element and [prescriptive syntaxes](https://web.dev/learn/images/prescriptive.md.txt) are also worth a read.

## Additional performance features

There are a number of additional image features that can improve your site's
performance.

### Lazy loading

The [`loading` attribute](https://web.dev/learn/design/responsive-images.md.txt#preloading_hints)
tells the JS-enabled browser how to load the image. The default `eager` value
means the image is loaded immediately as the HTML is parsed, even if the image
is outside the visible viewport. By setting
[`loading="lazy"`](https://web.dev/articles/lazy-loading) the image loading is deferred until
it's likely to come into the viewport. "Likely" is defined by the browser based
on the distance the image is from the viewport. This is updated as the user
scrolls. Lazy loading helps save bandwidth and CPU, improving performance
for most users. If JavaScript is disabled, for security reasons, all images
default to `eager`.

```html

```

### Aspect ratio

Browsers start rendering HTML when it is received, making requests for assets
when encountered. This means the browser is already rendering the HTML when it
encounters the `` tag and makes the request. And images can take a while
to load. By default, browsers don't reserve space for images other than the
size required to render `alt` text.

The `` element has always supported unitless `height` and `width`
attributes. These properties fell out of use in favor of CSS. CSS may define
image dimensions, often setting a single dimension such as `max-width: 100%;`
to make sure the aspect ratio is preserved.

As CSS is usually included in the `<head>`, it's parsed before any ``
is encountered. But without explicitly listing the `height` or
aspect ratio, the space reserved is the height (or width) of the `alt` text.

When developers only declare a width, the receipt and rendering of images
leads to [cumulative layout shift](https://web.dev/articles/cls.md.txt) which harms
[web vitals](https://web.dev/explore/learn-core-web-vitals). To resolve this issue, browsers
support image aspect ratios. Including `height` and `width` attributes on the
`` acts as [sizing hints](https://web.dev/learn/design/responsive-images.md.txt#sizing_hints),
informing the browser of the aspect ratio, enabling the right amount of space to
be reserved for eventual image rendering.
When the browser encounters a single dimension, such as our 50% example, it
saves space for the image adhering to the CSS dimension and with the other
dimension maintaining the width-to-height aspect ratio.

```html

```

Your images are responsive if the CSS was set up correctly to make them
responsive. Yes, the included unitless `height` and `width` values are
overridden with CSS. The purpose of including these attributes is to reserve
the space at the right aspect ratio, improving performance by reducing layout
shift. The page will still take approximately the same amount
of time to load, but the UI won't jump when the image is painted to the screen.

## Other image features

The `` element also supports the `crossorigin`, `decoding`,
`referrerpolicy`, and, in Blink-based browsers, `fetchpriority` attributes.
Rarely used, if the image is part of a server-side map, include the `ismap`
boolean attribute and nest the `` in a link for users without pointing
devices.

The `ismap` attribute isn't necessary, or even supported, on the
`<input type="image" name="imageSubmitName">` as the `x` and `y`
coordinates of the click location are sent during form submission, appending
the values to the input name, if any. For example, something like
`&imageSubmitName.x=169&imageSubmitName.y=66` is submitted with the form when
the user clicks the image, submitting it. If the image doesn't have a
`name` attribute, the x and y are sent: `&x=169&y=66`.

## Check your understanding

Test your knowledge of images.
What two attributes should a foreground image always have?
`size` Try again. `alt` Correct! `src` Correct!
