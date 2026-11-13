---
source_url: https://web.dev/articles/api-for-fast-beautiful-web-fonts
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: e1589e38c6c6a915712e00380e74a654ec5e00ee71560ee3501f3ce90d95f52b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
How to use the Google Fonts CSS API to efficiently deliver web fonts.

 Jimmy Mooney [X](https://twitter.com/jimmy0x52) [GitHub](https://github.com/jimmy0x52) [LinkedIn](https://www.linkedin.com/in/jimmymooney/) [Homepage](https://www.jimmymooney.com/)

Over the years, a lot has changed with [web fonts](https://fonts.google.com/knowledge/glossary/web_font) technology. What used to be a niche practice that required an image of text or a [Flash](https://en.wikipedia.org/wiki/Scalable_Inman_Flash_Replacement) plug-in (and that compromised your website's search engine optimization) is now a standard practice across the web. Once upon a time, you had to load an entire font before the page loaded---with styles and characters you may not have even used---but even that has become a thing of the past.

The [Google Fonts CSS API](https://developers.google.com/fonts/docs/getting_started) has also evolved over the years to keep up with changes in web fonts technology. It has come a long way from its original value proposition---to make the web faster by allowing your browser to cache commonly used fonts across all the websites that used the API. This is [no longer true](https://developer.chrome.com/blog/http-cache-partitioning#how-will-cache-partitioning-affect-chromes-http-cache), but the API still provides additional and important optimizations so that websites load quickly and the fonts work well.

Using the Google Fonts CSS API, your website can request only the font data it needs to keep its CSS loading time to a minimum, ensuring your website visitors can load your content as quickly as possible. The API will respond to each request with the best font for that web browser.

All this happens by including a single line of HTML in your code.

## How to use the Google Fonts CSS API

The [Google Fonts CSS API documentation](https://developers.google.com/fonts/docs/getting_started) sums it up nicely:
>
> You don't need to do any programming; all you have to do is add a special stylesheet link to your HTML document, then refer to the font in a CSS style.

The minimum you need to do is include a single line in your HTML, like this:

```html
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap" rel="stylesheet" />
```

When you request a font from the API, you specify which family or families you would like and, optionally, their weights, styles, subsets, and [many other options](https://developers.google.com/fonts/docs/getting_started). The API will then handle your request in one of two ways:

1. If your request uses common parameters that the API already has files for, it will immediately return CSS to your user, directing them to these files.
2. If you requested a font with parameters that the API hasn't cached, it will subset your fonts on the fly, using [HarfBuzz](https://harfbuzz.github.io/harfbuzz-hb-subset.html) to do it quickly, and return CSS pointing to them.

## Font files can be large, but they don't have to be

Web fonts can be large; it's true. Just a single weight of
[Noto Sans Japanese](https://fonts.google.com/noto/specimen/Noto+Sans+JP) in
WOFF2 is almost 3.4MB. Downloading this to each and every one of your users
would be a drag on your page load time. When every millisecond counts and every
byte is precious, you want to be sure you're only loading the data your users
need.

The Google Fonts CSS API can create very small font files (called subsets), generated in real time, to serve your users only the text and styles required by your website. Instead of serving up an entire font, you can request specific characters using the [`text`](https://developers.google.com/fonts/docs/getting_started#optimizing_your_font_requests) parameter.

```html
<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&display=swap&text=RobtMn" rel="stylesheet" />
```

The CSS API also provides additional web font optimizations to your users automatically, without any API parameters. The API will serve your users CSS files with [`unicode-range`](https://developer.mozilla.org/docs/Web/CSS/@font-face/unicode-range) already enabled ([if supported by their web browser](https://caniuse.com/font-unicode-range)), so they load the fonts for only the specific characters your website needs.

The unicode-range CSS descriptor is one tool that can now be used to combat large font downloads. This CSS property sets a range of unicode characters that the `@font-face` declaration contains. If one of these characters is rendered on the page, that font is downloaded. This works well for all kinds of languages, so you can take a font that includes Latin, Greek, or Cyrillic characters and make smaller subsets. In the preceding chart, you can see that if you had to load all three of these character sets, it would be over 600 glyphs.

This also enables [Chinese, Japanese, and Korean (CJK) fonts](https://en.wikipedia.org/wiki/CJK_characters) for the web. In the preceding chart, you can see that a CJK font covers 15-20 times the number of characters that a Latin character font does. These fonts are typically very large and many of the characters in those languages are not used as frequently as others.

Using the CSS API and unicode-range can reduce file transfers by [approximately 90%](https://www.w3.org/TR/PFE-evaluation/). Using the `unicode-range` descriptor, you can define each portion separately, and each slice is only downloaded once your content contains one of the characters in these character ranges.

Example: If you wanted to set only the word "[こんにちは](https://translate.google.com/?sl=ja&tl=en&text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF&op=translate)" in [Noto Sans JP](https://fonts.google.com/noto/specimen/Noto+Sans+JP), you could:

- Self-host your own WOFF2 files.
- Use the CSS API to retrieve the WOFF2.
- Use the CSS API with the text= parameter set to "こんにちは."

In this example, you can see that by using the CSS API you are already saving 97.5% over self-hosting the WOFF2 font, thanks to the API's built-in support for separating large fonts into unicode-range. By taking it a step further and specifying exactly the text you want to display, you can further reduce the size of the font to only 95.3% of the CSS API font--that's 99.9% smaller than the self-hosted font.

The Google Fonts CSS API will automatically deliver fonts in the smallest and most compatible format supported by your user's browser. If your user is on a browser with WOFF2 support, the API will supply the fonts in WOFF2, but if they are using an older browser, the API will deliver the fonts in a format supported by that browser. To reduce the file size for each user, the API also removes data from the fonts when it's not needed. For example, hinting data will be removed for users whose browsers don't need it.

## Future-proofing your web fonts with the Google Fonts CSS API

The Google Fonts team also contributes to new W3C standards that continue innovating web font technologies, such as [WOFF2](https://www.w3.org/TR/WOFF2/). One current project is [Incremental Font Transfer](https://www.w3.org/TR/PFE-evaluation/), which allows users to load very small parts of font files as they're used on screen and stream in the rest on demand, surpassing the performance of unicode-range. When you use our web fonts API, your users get these underlying font transfer technology improvements when they become available in their browser.

This is the beauty of a fonts API: your users have the benefit of each new technology improvement without any changes to your website. New web font format? No problem. New browser or operating system support? It's taken care of. So instead of being bogged down with the maintenance of your web fonts, you are free to focus on your users and your content.

## Variable fonts support built-in

[Variable fonts](https://fonts.google.com/knowledge/glossary/variable_fonts) are font files that can store a range of design variation amongst multiple [axes](https://fonts.google.com/knowledge/glossary/axis_in_type_design), and the [new version](https://developers.google.com/fonts/docs/css2) of the Google Fonts CSS API includes support for them. Adding an additional axis of variation enables new flexibility with a font---but it can almost double the size of the font file.

When you are more specific in your CSS API request, the Google Fonts CSS API can serve only the portion of the variable font your website needs, in order to reduce download size for users. This enables the use of variable fonts for the web without incurring long page loading times. You can do this by specifying a single value on an axis, or specifying a range; you can even specify multiple axes and multiple font families all in one request. The API is flexible to meet your needs.

## Simple to implement, optimized for you

The Google Fonts CSS API helps you deliver fonts that are:

- More compatible with web browsers.
- As small as possible.
- Delivered quickly.
- Easier for you to use.

For more information on Google Fonts, visit [fonts.google.com](https://fonts.google.com/). To learn more about the CSS API, review the [API Documentation](https://developers.google.com/fonts/).
