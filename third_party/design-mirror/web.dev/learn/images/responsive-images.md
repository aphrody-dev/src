---
source_url: https://web.dev/learn/images/responsive-images
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 7435d52e4ac5310f7bea3f3385b62e51c4e4f0766d589d55be7101cc829a37f3
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

[Responsive image](https://web.dev/learn/design/responsive-images.md.txt) markup can be divided into two scenarios: situations
where the goal is the most efficient possible images, and situations where you need explicit control over what image source
the browser selects. You can think of these as _descriptive_ and _prescriptive_ syntaxes, respectively.

In this module you'll learn both approaches. First we'll cover `srcset` and `sizes`, and how to help the browser make the best
choice based on what it knows about the user, their device, and their browsing situation. You'll then discover the `<picture>` element,
which allows for explicit control over source selection based on factors like viewport size and browser support for image formats.

## Descriptive syntaxes

A descriptive syntax provides the browser with information about image sources and how they'll be used, but ultimately leaves
the decision-making to the browser. This is by far the more common scenario; for the vast majority of images you won't _want_ granular
control over browser behavior. Browsers have far more information at their disposal than web developers do, and can make complex decisions
based on this information. You can't predict users' browsing contexts accurately---there's too much about their hardware, preferences, and connection
speeds that you can't know. At best, you can make educated guesses, but can't know for _certain_ how each user experiences the web. The
central use case for responsive images is strictly goal-oriented, from a developer's perspective: allow browsers to make the most efficient image
requests possible, based on the information the browser has at hand.

To enable browsers to make these choices, `srcset` allows you to provide the browser with a list of potential sources for populating a single
``, while `sizes` allows you to provide the browser with information about how that `` will be rendered. You'll learn how to use
these in the [next module](https://web.dev/learn/images/descriptive.md.txt).

## Prescriptive syntaxes

With a prescriptive syntax, you tell the browser what to do---what source to select, based on specific criteria you've defined. While this use case isn't as
common as "just load the most efficient asset to render this image," it allows us to provide usage instructions to the browser to account for
information it doesn't have prior to the transfer of assets, such as the content of the sources or their formats.

While `srcset` and `sizes` provide you with a syntax for passing information along to the user's browser and allowing it to make decisions about
image sources, there are times when you'll need explicit control over which source file is presented and when. For example, you might
want to display versions of the same image content with different aspect ratios, based on different design treatments across layout breakpoints,
or make sure only browsers with support for a specific encoding receive specific sources.

In these cases, you want explicit control over which source is shown, and when. These are assurances that `srcset` and `sizes` can't give us,
by design. To get that control, we'll need to use the [`<picture>` element](https://web.dev/learn/images/prescriptive.md.txt).
