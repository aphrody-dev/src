---
source_url: https://web.dev/learn/html/metadata
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: 47b3697a48c9f96f79f6cdd6f8fff605dcd4401985fa746104da97b12ed0b28a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

In the document structure section you learned about the components you (almost) always find in the `<head>` of an HTML document. While everything in the `<head>`, including the `<title>`, `<link>`, `<script>`, `<style>`, and the lesser used `<base>`, is actually "meta data", there is a `<meta>` tag for metadata that cannot be represented by these other elements.

The specification includes several meta types, and there are many, many other application-supported meta types not in any official specification. In this section, we'll discuss the attributes and values that are included in the specifications, some common meta names and content values, and a few meta types that are incredibly useful for search engine optimization, social media posting, and user experience that are not officially defined by the [WHATWG](https://html.spec.whatwg.org/multipage/semantics.html#the-meta-element) or [W3C](https://www.w3.org/MarkUp/html-spec/Elements/META.html).

## The required `<meta>` tags, revisited

Let's revisit the two necessary `<meta>` tags already covered---the [character set declaration](https://web.dev/learn/html/document-structure.md.txt#character_encoding) and the [viewport meta tag](https://web.dev/learn/html/document-structure.md.txt#viewport_metadata)---and get a better understanding of the `<meta>` tag in the process.

The `charset` attribute of the `<meta>` element came about in a unique manner. Originally the character set metadata was written as `<meta http-equiv="Content-Type" content="text/html; charset=<characterset>" />`, but so many developers mis-typed the `content` attribute as `content="text/html" charset="<characterset>"` that browsers began supporting charset as an attribute. It is standardized now in the HTML living standard as `<meta charset="<charset>" />`, where, for HTML,`<charset>` is the case-insensitive string "utf-8" .

You may have noticed the original character set meta declaration used to include the `http-equiv` attribute. This is short for "http-equivalent", as the meta tag is basically replicating what could be set in an HTTP header. Aside from the `charset` exception, all other meta tags defined in the WHATWG HTML specification contain either the `http-equiv` or `name` attribute.

## Officially defined meta tags

There are two main types of meta tags: pragma directives, with the `http-equiv` attribute like the charset meta tag used to have, and named meta types, like the viewport meta tag with the `name` attribute that we discussed in the [document structure](https://web.dev/learn/html/document-structure.md.txt) section. Both the `name` and `http-equiv` meta types must include the `content`attribute, which defines the content for the type of metadata listed.

### Pragma directives

The `http-equiv` attribute has as its value a pragma directive. These directives describe how the page should be parsed. Supported `http-equiv` values enable setting directives when you are unable to set HTTP headers directly.

The specification defines seven [pragma directives](https://html.spec.whatwg.org/multipage/semantics.html#pragma-directives), most of which have other methods of being set. For example, while you can include a language directive with `<meta http-equiv="content-language" content="en-us" />`, we have already discussed using the [`lang` attribute on the HTML element](https://web.dev/learn/html/document-structure.md.txt#content_language), which is what should be used instead.

The most common pragma directive is the `refresh` directive.

```html
<meta
  http-equiv="refresh"
  content="60; https://machinelearningworkshop.com/regTimeout"
/>
```

While you can set a directive to refresh at an interval of the number of seconds set in the `content` attribute, and even redirect to a different URL, this is not advisable. Refreshing and redirecting content without an explicit user request to do so is poor usability and negatively impacts accessibility. Don't you hate it when you're in the middle of a paragraph and the page resets? Imagine having cognitive or vision issues and that happening. If you are going to set a refresh with a redirect, make sure the user has enough time to read the page, a link to hasten the process, and, if appropriate, a button to "stop the clock" and prevent the redirect from happening.

We won't include this in our site because there is no reason to time out a user session other than to annoy our visitors.

The most useful pragma directive is `content-security-policy`, which enables defining a [content policy](https://web.dev/articles/csp.md.txt) for the current document. Content policies mostly specify allowed server origins and script endpoints, which help guard against cross-site scripting attacks.

```html
<meta http-equiv="content-security-policy" content="default-src https:" />
```

If you don't have access to change HTTP headers (or if you do), here is a list of [space separated content values for `content-security-policy` directives](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Security-Policy).

### Named meta tags

More often than not, you'll include named metadata. Include the `name` attribute, with the attribute value being the name of the metadata. As with pragma directives, the `content` attribute is required.

The `name` attribute is the name of the metadata. In addition to `viewport`, you will probably want to include `description` and `theme-color`, but not `keywords`.

#### Keywords

Search engine optimization snake-oil salespeople abused the keywords meta tag by stuffing them with comma-separated lists of spam words instead of lists of relevant key terms, so search engines don't consider this metadata to be useful anymore. No need to waste time, effort, or bytes adding it.

#### Description

The `description` value, however, is useful for SEO: the description content value is often what search engines display under the page's title in search results. Several browsers, like Firefox and Opera, use this as the default description of bookmarked pages. The description should be a short and accurate summary of the page's content.

```html
<meta
  name="description"
  content="Register for a machine learning workshop at our school for machines who can't learn good and want to do other stuff good too"
/>
```

If the second half of our description makes no sense to you, you probably haven't seen the movie [Zoolander](https://www.youtube.com/watch?v=NQ-8IuUkJJc).

#### Robots

If you don't want your site to be indexed by search engines, you can let them know. `<meta name="robots" content="noindex, nofollow" />` tells the bots to not index the site and not to follow any links. Bots should listen to the request, but there's no law requiring they heed the request. You don't need to include `<meta name="robots" content="index, follow" />` to request indexing the site and following links, as that is the default, unless HTTP headers say otherwise.

```html
<meta name="robots" content="index, follow" />
```

#### Theme color

The [`theme-color`](https://web.dev/learn/design/theming.md.txt#customize_the_browser_interface) value lets you define a color to customize the browser interface. The color value on the content attribute will be used by supporting browsers and operating systems, letting you provide a suggested color for the user agents that support coloring the title bar, tab bar, or other chrome components. This meta tag is especially useful for [progressive web apps](https://web.dev/learn/pwa.md.txt). But, if you're including a manifest file, which a PWA requires, you can include the theme color there instead. Defining it in the HTML, however, ensures that the color will be found immediately, before rendering, which may be faster on first load than waiting for the manifest.

To set the theme color to the blue tone of our site's background color, include:

```html
<meta name="theme-color" content="#226DAA" />
```

The theme color meta tag can include a `media` attribute enabling the setting of different theme colors based on media queries. The `media` attribute can be included in this meta tag only and is ignored in all other meta tags.

There are several [other `name` meta values](https://developer.mozilla.org/docs/Web/HTML/Element/meta/name), but the ones we have discussed are the most common. Except for declaring different `theme-color` values for different media queries, only include one of each meta tag. If you do need to include more than one type of meta tag to support legacy browsers, the legacy values should come after the newer values, as user agents read successive rules until they find a match.

## Open Graph

[Open Graph](https://ogp.me/) and similar meta tag protocols can be used to control how social media sites, like Twitter, LinkedIn, and Facebook, display links to your content. If not included, social media sites will correctly grab the title of your page and the description from the description meta tag, the same information as search engines will present, but you can intentionally set what you want users to see when a link is posted to your site.

When you post a link to MachineLearningWorkshop.com or web.dev on Facebook or Twitter, a card with an image, site title, and site description appears. The entire card is a hyperlink to the URL you provided.

Open Graph meta tags have two attributes each: the `property` attribute instead of the `name` attribute, and the content or value for that property. The `property` attribute is not defined in official specifications but is widely supported by applications that support the Open Graph protocol. Creating "new" attributes like `property` ensures the attribute values created for the protocol's attribute won't clash with future values of the `name` or `http-equiv` attributes.

Create a Facebook media card:

```html
<meta property="og:title" content="Machine Learning Workshop" />
<meta
  property="og:description"
  content="School for Machines Who Can't Learn Good and Want to Do Other Stuff Good Too"
/>
<meta
  property="og:image"
  content="http://www.machinelearningworkshop.com/image/all.png"
/>
<meta
  property="og:image:alt"
  content="Black and white line drawing of refrigerator, french door refrigerator, range, washer, fan, microwave, vaccuum, space heater and air conditioner"
/>
```

Include a title of your post for display. This title is generally displayed below the image and above the description. The description should be up to three sentences that summarize your post. This will appear after the headline defined in `og:title`. Provide the absolute URL to the banner image you want displayed, including the `https://` protocol. When including an image in HTML, always include an alternative text description for the image, even when the image will appear elsewhere. For Open Graph social media cards, define the `alt` as the content value for the `og:image:alt` property. You can also include a canonical URL with `og:url`.

These meta tags are all defined in the [Open Graph protocol](https://ogp.me/). The values should be the content you would like the third-party web application to display.

Other social media have their own similar syntaxes, like [Twitter card markup](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup). This enables providing a different experience depending on where the link appears, or enabling link tracking by adding a parameter at the end of the URL.

```html
<meta name="twitter:title" content="Machine Learning Workshop" />
<meta
  name="twitter:description"
  content="School for machines who can't learn good and want to do other stuff good too"
/>
<meta
  name="twitter:url"
  content="https://www.machinelearningworkshop.com/?src=twitter"
/>
<meta
  name="twitter:image:src"
  content="http://www.machinelearningworkshop.com/image/all.png"
/>
<meta name="twitter:image:alt" content="27 different home appliances" />
<meta name="twitter:creator" content="@estellevw" />
<meta name="twitter:site" content="@perfmattersconf" />
```

In Twitter's case, to ensure the value of the `name` attribute doesn't conflict with future specifications, instead of using a new attribute such as the `property` attribute in Open Graph, for Twitter card data, all name values are prefixed with `twitter:`.

You can see what your social media card will look like on [Twitter](https://cards-dev.twitter.com/validator) and [Facebook](https://developers.facebook.com/tools/debug/?q=https://machinelearningworkshop.com).

You can have different card images, titles, and descriptions for different social media sites or for different link parameters. For example, <https://perfmattersconf.com> sets different values for `og:image`, `og:title`, and `og:description` based on the parameter of the URL.

If you enter <https://perfmattersconf.com?name=erica> and <https://perfmattersconf.com?name=melanie> in [Twitter's Card Validator](https://cards-dev.twitter.com/validator), you will see these two different cards; we provided different content even though they both link to the same conference home page.

## Other useful meta information

If someone bookmarks your site, adding it to their home screen, or if your site is a progressive web application or otherwise works offline or without browser chrome features displayed, you can provide application icons for the mobile device's home screen.

You can use the `<link>` tag to link to the startup images that you want to use. Here's an example of including a few images, with media queries:

```html
<link
  rel="apple-touch-startup-image"
  href="icons/ios-portrait.png"
  media="orientation: portrait"
/>
<link
  rel="apple-touch-startup-image"
  href="icons/ios-landscape.png"
  media="orientation: landscape"
/>
```

If your site or application is web-app capable, meaning the site can stand on its own with minimal UI, such as no back button, you can use meta tags to tell the browser that too:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
```

Only include these if your app is indeed app-capable. If your site isn't, you'll be setting up your most ardent supporters, those who added your site to their home screen, for a really bad user experience. You'll lose their love!

If someone is going to save your icon to their tiny device's home screen, you want to provide the operating system with a short name that doesn't take up much room on a small device's home screen. You can do this by including a meta tag, or using a web manifest file. The following demonstrates the meta tag method:

```html
<meta name="apple-mobile-web-app-title" content="MLW" />
<meta name="application-name" content="MLW" />
```

You've covered several meta tags, all of which will make your header longer. If you're indeed creating a web app-capable, offline-friendly progressive web application, instead of including these two additional meta tags, you can more simply and succinctly include `short_name: MLW` in a webmanifest file.

The manifest file can prevent an unwieldy header full of `<link>` and `<meta>` tags. We can create a manifest file, generally called `manifest.webmanifest` or `manifest.json`. We then use the handy `<link>` tag with a `rel` attribute set to `manifest` and the `href` attribute set to the URL of the manifest file:

```html
<link rel="manifest" href="/mlw.webmanifest" />
```

This series is focused on HTML, but you can check out the [web.dev course on progressive web applications](https://web.dev/learn/pwa/web-app-manifest.md.txt) or [MDN's web app manifest documentation](https://developer.mozilla.org/docs/Web/Manifest).

Your HTML now looks something like this:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Machine Learning Workshop</title>
    <meta name="viewport" content="width=device-width" />
    <meta
      name="description"
      content="Register for a machine learning workshop at our school for machines who can't learn good and want to do other stuff good too"
    />
    <meta property="og:title" content="Machine Learning Workshop" />
    <meta
      property="og:description"
      content="School for Machines Who Can't Learn Good and Want to Do Other Stuff Good Too"
    />
    <meta
      property="og:image"
      content="http://www.machinelearningworkshop.com/image/all.png"
    />
    <meta
      property="og:image:alt"
      content="Black and white line drawing of refrigerator, french door refrigerator, range, washer, fan, microwave, vaccuum, space heater and air conditioner"
    />
    <meta name="twitter:title" content="Machine Learning Workshop" />
    <meta
      name="twitter:description"
      content="School for machines who can't learn good and want to do other stuff good too"
    />
    <meta
      name="twitter:url"
      content="https://www.machinelearningworkshop.com/?src=twitter"
    />
    <meta
      name="twitter:image:src"
      content="http://www.machinelearningworkshop.com/image/all.png"
    />
    <meta name="twitter:image:alt" content="27 different home appliances" />
    <meta name="twitter:creator" content="@estellevw" />
    <meta name="twitter:site" content="@perfmattersconf" />
    <link rel="stylesheet" src="css/styles.css" />
    <link rel="icon" type="image/png" href="/images/favicon.png" />
    <link
      rel="alternate"
      href="https://www.machinelearningworkshop.com/fr/"
      hreflang="fr-FR"
    />
    <link
      rel="alternate"
      href="https://www.machinelearningworkshop.com/pt/"
      hreflang="pt-BR"
    />
    <link rel="canonical" href="https://www.machinelearning.com" />
    <link rel="manifest" href="/mlwmanifest.json" />
  </head>
  <body>
    <!-- <script defer src="scripts/lightswitch.js"></script>-->
  </body>
</html>
```

It's pretty long, but it's done.

Now that your `<head>` is mostly complete, you can dive into some [semantic HTML](https://web.dev/learn/html/semantic-html.md.txt).

### Check your understanding

Test your knowledge of metadata
The refresh pragma directive.
Reloads the page. Correct! Redirects the visitor to another page. Try again. Loads in additional content from another file. Try again. Open Graph meta tags.
Allow you to link to charts. Try again Are required for all pages. Try again. Are used to create social media cards for your pages. Correct!
