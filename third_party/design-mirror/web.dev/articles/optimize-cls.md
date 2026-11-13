---
source_url: https://web.dev/articles/optimize-cls
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: 8da8bccbce221c05dd072787e09cdc0f170741bfdc6f2e2fbc5a9b99bef7ce1b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Learn how to avoid sudden layout shifts to improve user-experience

 Addy Osmani [X](https://twitter.com/addyosmani) [GitHub](https://github.com/addyosmani) [Bluesky](https://bsky.app/profile/addyosmani.bsky.social)  Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

Published: May 5, 2020, Last updated: Feb 7, 2025

[Cumulative Layout Shift (CLS)](https://web.dev/articles/cls.md.txt) is one of the three [Core Web Vitals](https://web.dev/articles/vitals.md.txt#core_web_vitals) metrics. It measures the instability of content by combining how much visible content has shifted in the viewport with the distance the affected elements moved.

Layout shifts can be distracting to users. Imagine you've started reading an article when all of a sudden elements shift around the page, throwing you off and requiring you to find your place again. This is very common on the web, including when reading the news, or trying to click those 'Search' or 'Add to Cart' buttons. Such experiences are visually jarring and frustrating. They're often caused when visible elements are forced to move because another element was suddenly added to the page or resized.

To provide a good user experience, **sites should strive to have a CLS of 0.1 or less for at least 75% of page visits.**
 Good CLS values are 0.1 or less. Poor values are greater than 0.25.

Unlike the other Core Web Vitals, which are time-based values measured in seconds or milliseconds, the CLS score is a unitless value based on a calculation of how much content is shifting and by how far.

In this guide, we'll cover optimizing common causes of layout shifts.

The most common causes of a poor CLS are:

- Images without dimensions.
- Ads, embeds, and iframes without dimensions.
- Dynamically injected content such as ads, embeds, and iframes without dimensions.
- Web fonts.

> [!NOTE]
>
> **Note:** For a visual overview of some of the content presented in this guide, see the Optimize for Core Web Vitals video from Google I/O 2020:
> [Video](https://www.youtube.com/watch?v=AQqFZ5t8uNc)

## Understand the causes of layout shifts

Before you start looking at solutions to common CLS issues, it's important to understand your CLS score and where the shifts are coming from.

### CLS in lab tools versus field

It is common to hear developers think the CLS measured by the [Chrome UX Report (CrUX)](https://developer.chrome.com/docs/crux) is incorrect as it does not match the CLS they measure using Chrome DevTools or other lab tools. Web performance lab tools like Lighthouse may not show the full CLS of a page as they typically do a basic load of the page to measure some web performance metrics and provide some guidance (though [Lighthouse user flows](https://web.dev/articles/lighthouse-user-flows.md.txt) do allow you measure beyond the default page load audit).

CrUX is the Google dataset of the Web Vitals program, and for that, CLS is measured throughout the full life of the page and not just during the initial page load that lab tools typically measure.

Layout shifts are very common during page load, as all the necessary resources are fetched to initially render the page, but layout shifts can also happen after the initial load. Many post-load shifts may occur [as the result of a user interaction](https://web.dev/articles/cls.md.txt#user-initiated_layout_shifts) and therefore will be excluded from the CLS score as they are *expected* shifts---as long as they occur within 500 milliseconds of that interaction.

However, other post-load shifts that are unexpected by the user may be included where there was no qualifying interaction---for example, if you scroll further along the page and lazy-loaded content is loaded and that causes shifts. Other common causes of post-load CLS are on interactions of transitions, for example on Single Page Apps, which take longer than the 500 millisecond grace period.

[PageSpeed Insights](https://pagespeed.web.dev/) shows both the user-perceived
CLS from a URL in its "Discover what your real users are experiencing" section,
and the lab-based load CLS in its "Diagnose performance issues" section.
Differences between these values are likely the result of post-load CLS.
 In this example, CrUX measures a much larger CLS than Lighthouse.

> [!NOTE]
> **Note:** PageSpeed Insights will show URL-level data where it exists, and attempt to fall back to origin-level data where this does not exist. Always check what data is showing to ensure you don't waste time trying to track down a CLS issue that actually exists on other pages on your origin! In the earlier example, you can see this is URL-level data as shown in the top right of the image.

### Identify load CLS issues

When the CrUX and Lighthouse CLS scores of PageSpeed Insights are broadly aligned, this usually indicates there is a load CLS issue that was detected by Lighthouse. In this case Lighthouse will help with two audits to provide more information on images causing CLS due to missing width and height, and also list all the elements that shifted for the page load along with their CLS contribution. You can see these audits by filtering on the CLS audits:
 Lighthouse's detailed CLS diagnostics.

> [!NOTE]
> **Note:** Lighthouse will identify the elements that were shifted, but often these are the ones *impacted* rather than the elements *causing* the CLS. For example, if a new element is inserted into the DOM, the elements that are beneath it will show in this audit, but the root cause is the addition of the new element above. However, the shifted element should be sufficient to help you identify and resolve the root cause.

The [Performance panel](https://developer.chrome.com/docs/devtools/evaluate-performance) in DevTools provides a wealth of information on layout shifts:
 After recording a new trace in the Performance panel, the **Layout Shifts** track of the results is populated with purple bars displaying a `Layout Shift` clusters. Clicking the diamonds shows an animation of the shift and details in the **Summary** panel.

Layout shifts are highlighted in the **Layout shifts** track. The purple line groups shifts into shift clusters with the diamonds showing individual shifts in that cluster. The size of the diamond is proportional to the size of the shift allowing you to hone in on the largest shifts.

Clicking on a shift shows a pop up with an animation of the shift and highlights the elements shift in purple.

Additionally, the **Summary** view for a `Layout Shift` record includes the start time, the shift score as well as the elements shifted. This is particularly helpful to get more detail on load CLS issues since this is easily replicated with a reload performance profile.

This also links to the **Layout shift culprits** insight displayed in the **Insights** panel on the left, which shows the total CLS at the top, as well as possible reasons for layout shifts.

### Identify post-load CLS issues

Disagreement between the CrUX and Lighthouse CLS scores often indicates post-load CLS. These shifts can be tricky to track down without field data. For information on collecting field data, see [Measure CLS elements in the field](https://web.dev/articles/optimize-cls.md.txt#measure-cls-in-field).

The live metrics view of the Performance Panel lets you interact with the page and monitor the CLS score to identify interactions causing large layout shfts.
 The live metrics view of the Performance Panel allows monitoring of a web page's CLS score while interacting with the page.

As an alternative to using the DevTools, you can browse your web page while [recording layout shifts using a Performance Observer](https://web.dev/articles/cls.md.txt#measure_layout_shifts_in_javascript) pasted into the console.

After you set up shift monitoring, you can try to replicate any post-load CLS issues. CLS often happens while the user scrolls through a page, when lazy-loaded content loads fully without space reserved for it. Content shifting when the user holds the pointer over it is another common post-load CLS cause. Any content shift during either of these interactions counts as unexpected, even if it happens within 500 milliseconds.

For more information, see [Debug layout shifts](https://web.dev/articles/debug-layout-shifts.md.txt).

After you've identified any common causes of CLS, the [timespans user flow mode of Lighthouse](https://web.dev/articles/lighthouse-user-flows.md.txt#timespans) can also be used to ensure typical user flows don't regress by introducing layout shifts.

### Measure CLS elements in the field

Monitoring CLS in the field can be invaluable in determining what circumstances CLS happens in and narrowing down the possible causes. Like most lab tools, field tools measure only the elements that shifted, but that usually provides enough information to identify the cause. You can also use CLS field measurements to determine which issues are the highest priority to fix.

The `web-vitals` library has [attribution functions](https://github.com/GoogleChrome/web-vitals#send-attribution-data) that let you collect this additional information. For more information, see [Debug performance in the field](https://web.dev/articles/debug-performance-in-the-field.md.txt). Other RUM providers have also started collecting and presenting this data similarly.

> [!NOTE]
> **Note:** RUM solutions that measure CLS in the field, including the `web-vitals` library, may show differences that CrUX data as explained in the [Why is CrUX data different from my RUM data?](https://web.dev/articles/crux-and-rum-differences.md.txt) post. In particular, CLS that happens in iframes is not measurable from Web APIs but is visible to the user, and is therefore included in CrUX. So while field data can be invaluable for identifying CLS issues, be aware that it may be incomplete in certain scenarios.

## Common causes of CLS

Once you have identified the causes of CLS, you can start working on fixing the issues. In this section we will show some of the more common reasons for CLS, and what you can do to avoid them.

### Images without dimensions

Always include `width` and `height` size attributes on your images and video elements. Alternatively, reserve the required space with [CSS `aspect-ratio`](https://web.dev/articles/aspect-ratio.md.txt) or similar. This approach ensures that the browser can allocate the correct amount of space in the document while the image is loading.
Images without width and height specified. Images with width and height specified.  Lighthouse 6.0 impact of setting image dimensions on CLS.

#### History of `width` and `height` attributes on images

In the early days of the web, developers would add `width` and `height` attributes to their `` tags to ensure sufficient space was allocated on the page before the browser started fetching images. This would minimize reflow and re-layout.

```html

```

`width` and `height` in this example don't include units. These "pixel" dimensions would ensure that the browser reserved a 640x360 area in the page's layout. The image would stretch to fit this space, regardless of whether the true dimensions matched it.

When [Responsive Web Design](https://www.smashingmagazine.com/2011/01/guidelines-for-responsive-web-design/) was introduced, developers began to omit `width` and `height` and started using CSS to resize images instead:

```css
img {
  width: 100%; /* or max-width: 100%; */
  height: auto;
}
```

However, because the image size isn't specified, space can't be allocated for it until the browser starts to download it and can determine its dimensions. As images load, text shifts down the page to make room for them, creating a confusing and frustrating user experience.

This is where aspect ratio comes in. The aspect ratio of an image is the ratio of its width to its height. It's common to see this expressed as two numbers separated by a colon (for example, 16:9 or 4:3). For an x:y aspect ratio, the image is x units wide and y units high.

This means if we know one of the dimensions, the other can be determined. For a 16:9 aspect ratio:

- If puppy.jpg has a 360px height, width is 360 x (16 / 9) = 640px
- If puppy.jpg has a 640px width, height is 640 x (9 / 16) = 360px

Knowing the aspect ratio for an image allows the browser to calculate and reserve sufficient space for the height and associated area.

#### Modern best practice for setting image dimensions

Because modern browsers set the default aspect ratio of images based on an
image's `width` and `height` attributes, you can prevent layout shifts by
setting those attributes on the image and including the preceding CSS in your
style sheet.

```html
<!-- set a 640:360 i.e a 16:9 aspect ratio -->

```

All browsers will then add a [default aspect ratio](https://html.spec.whatwg.org/multipage/rendering.html#attributes-for-embedded-content-and-images) based on the element's existing `width` and `height` attributes.

This calculates an aspect ratio based on the `width` and `height` attributes before the image has loaded. It provides this information at the very start of layout calculation. As soon as an image is told to be a certain width (for example `width: 100%`), the aspect ratio is used to calculate the height.

This `aspect-ratio` value is calculated by major browsers as the HTML is processed, rather than with a default User Agent style sheet (see [this post for a deep dive into why](https://jakearchibald.com/2022/img-aspect-ratio/#width--height-presentational-hints)), so the value is displayed a little differently. For example, Chrome displays it like this in the Styles section of the Element panel:

```css
img[Attributes Style] {
  aspect-ratio: auto 640 / 360;
}
```

Safari behaves similarly, using an **HTML Attributes** style source. Firefox doesn't display this calculated `aspect-ratio` at all in its **Inspector** panel, but does use it for layout.

The `auto` part of the preceding code is important, because it causes the image dimensions to override the default aspect ratio after the image downloads. If the image dimensions are different, this still causes some layout shift after the image loads, but this ensures the image aspect ratio is still used when it becomes available, in case the HTML is incorrect. Even if the actual aspect ratio is different from the default, it still causes less layout shift than the 0x0 default size of an image with no dimensions provided.

> [!TIP]
> **Tip:** If you're having a hard time understanding aspect ratio, a handy [calculator](https://aspectratiocalculator.com/16-9.html) is available to help.

For a fantastic deep-dive into aspect ratio with further thinking around responsive images, see [jank-free page loading with media aspect ratios](https://blog.logrocket.com/jank-free-page-loading-with-media-aspect-ratios/).

If your image is in a container, you can use CSS to resize the image to the width of the container. We set `height: auto;` to avoid using a fixed value for the image height.

```css
img {
  height: auto;
  width: 100%;
}
```

#### What about responsive images?

When working with [responsive images](https://web.dev/articles/serve-responsive-images.md.txt), `srcset` defines the images you allow the browser to select between and what size each image is. To ensure `` width and height attributes can be set, each image should use the same aspect ratio.

```html

```

Your images' aspect ratios can also change depending on your
[art direction](https://developer.mozilla.org/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images#Art_direction).
For example, you may want to include a cropped shot of an image for narrow
viewports, and display the full image on desktop:

```html
<picture>
  <source media="(max-width: 799px)" srcset="puppy-480w-cropped.jpg" />
  <source media="(min-width: 800px)" srcset="puppy-800w.jpg" />
  
</picture>
```

Chrome, Firefox, and Safari now support setting `width` and `height` on the
`<source>` elements within a given `<picture>` element:

```html
<picture>
  <source media="(max-width: 799px)" srcset="puppy-480w-cropped.jpg" width="480" height="400" />
  <source media="(min-width: 800px)" srcset="puppy-800w.jpg" width="800" height="400" />
  
</picture>
```

### Ads, embeds, and other late-loaded content

Images aren't the only type of content that can cause layout shifts. Ads, embeds, iframes, and other dynamically injected content can all cause content appearing after them to shift down, increasing your CLS.

Ads are one of the largest contributors to layout shifts on the web. Ad networks and publishers often support dynamic ad sizes. Ad sizes increase performance and revenue due to higher click rates and more ads competing in the auction. Unfortunately, this can lead to a suboptimal user experience due to ads pushing visible content you're viewing down the page.

Embeddable widgets allow you to include portable web content on your page, such as videos from YouTube, maps from Google Maps, and social media posts. However, these widgets often aren't aware of how large their contents are before they load. As a result, platforms offering embeds don't always reserve space for their widgets, which causes layout shifts when they finally load.

The techniques for dealing with these are all similar. The major differences are how much control you have over the content that will be inserted. If this is inserted by a third-party like an ad partner, you may not know the exact size of content that will be inserted, nor be able to control any layout shifts happening within those embeds.

#### Reserve space for late-loading content

When placing late-loading content in the content flow, layout shifts can be avoided by reserving the space for them in the initial layout.

One approach is to add a `min-height` CSS rule to reserve space or---for responsive content such as ads, for example---use the [`aspect-ratio`](https://web.dev/articles/aspect-ratio.md.txt) CSS property in a similar manner to the way browsers automatically use this for images with dimensions provided.
 Reserving space for ads can prevent layout shifts

You may need to account for subtle differences in ad or placeholder sizes across form factors using media queries.

For content that may not have a fixed height, like ads, you might not be able to reserve the exact amount of space needed to eliminate the layout shift entirely. If a smaller ad is served, a publisher can style a larger container to avoid layout shifts, or choose the most likely size for the ad slot based on historical data. The downside to this approach is that it increases the amount of blank space on the page.

You can instead set the initial size to the smallest size that will be used, and accept some level of shift for larger content. Using `min-height`, as suggested previously, allows the parent element to grow as necessary while reducing the impact of layout shifts, compared to the 0px default size of an empty element.

Try to avoid collapsing the reserved space by showing a placeholder if, for example, no ad is returned. Removing the space set aside for elements can cause just as much CLS as inserting content.

#### Place late-loading content lower in the viewport

Dynamically injected content closer to the top of the viewport usually causes greater layout shifts than content injected lower in the viewport. However, injecting content anywhere in the viewport still causes some shift. If you can't reserve space for injected content, we recommend placing it later on the page to reduce the impact on its CLS.

#### Avoid inserting new content without a user interaction

You've probably experienced layout shifts due to UI that pops-in at the top or bottom of the viewport when you're trying to load a site. Similar to ads, this often happens with banners and forms that shift the rest of the page's content:
Dynamic content without space reserved.

If you need to display these types of UI affordances, reserve sufficient space in the viewport for it in advance (for example, using a placeholder or skeleton UI) so that when it loads, it does not cause content in the page to surprisingly shift around. Alternatively, ensure the element is not part of the document flow by overlaying the content where this makes sense. See the [Best practices for cookie notices](https://web.dev/articles/cookie-notice-best-practices.md.txt) post for more recommendations on these types of components.

In some cases adding content dynamically is an important part of user experience. For example, when loading more products to a list of items or when updating live feed content. There are several ways to avoid unexpected layout shifts in those cases:

- Replace the old content with the new content within a fixed size container or use a carousel and remove the old content after the transition. Remember to disable any links and controls until the transition has completed to prevent accidental clicks or taps while the new content is coming in.
- Have the user initiate the load of new content, so they are not surprised by the shift (for example with a "Load more" or "Refresh" button). It's recommended to prefetch the content before the user interaction so that it shows up immediately. As a reminder, [layout shifts that occur within 500 milliseconds](https://web.dev/articles/cls.md.txt#user-initiated_layout_shifts) of user input are not counted towards CLS.
- Seamlessly load the content offscreen and overlay a notice to the user that it's available (for example, with a "Scroll to top" button).

 Examples of dynamic content loading without causing unexpected layout shifts. Left: Live feed content loading on Twitter. Right: "Load More" example on Chloé website. Check out how the YNAP team [optimized for CLS when loading more content](https://medium.com/ynap-tech/how-to-optimize-for-cls-when-having-to-load-more-content-3f60f0cf561c).

> [!NOTE]
> **Note:** If content is likely to take more than 500 milliseconds---for example it requires a network fetch---then reserving the expected space within that 500 millisecond timeframe and taking the impact of any future shift up front ensures any shifts won't be included in the CLS score.

### Animations

Changes to CSS property values can require the browser to react to these changes. Some values, such as `box-shadow` and `box-sizing`, trigger re-layout, paint, and composite. Changing the `top` and `left` properties also cause layout shifts, even when the element being moved is on its own layer. Avoid animating using these properties.

Other CSS properties can be changed without triggering re-layouts. These include using `transform` animations to translate, scale, rotate, or skew elements.

Composited animations using `translate` can't impact other elements, and so don't count toward CLS. Non-composited animations also don't cause re-layout. To learn more about which CSS properties trigger layout shifts, see [High-performance animations](https://web.dev/articles/animations-guide.md.txt).

### Web fonts

Downloading and rendering web fonts is typically handled in one of two ways before the web font is downloaded:

- The fallback font is swapped with the web font, incurring a Flash of Unstyled Text (FOUT).
- "Invisible" text is displayed using the fallback font until a web font is available and the text is made visible (FOIT---flash of invisible text).

**Both approaches can cause layout shifts**. Even if the text is invisible, it's still laid out using the fallback font, so when the web font loads, the text block and the surrounding content shift in the same way as for the visible font.

The following tools can help you minimize shifting of text:

- `font-display: optional` can avoid a re-layout as the web font is only used if it is available by the time of initial layout.
- Ensure the appropriate fallback font is used. For example, using `font-family: "Google Sans", sans-serif;` will ensure the browser's `sans-serif` fallback font is used while `"Google Sans"` is loaded. Not specifying a fallback font using just `font-family: "Google Sans"` will mean the default font is used, which on Chrome is "Times"---a serif font which is a worse match than the default `sans-serif` font.
- Minimize the size differences between the fallback font and the web font using the new `size-adjust`, `ascent-override`, `descent-override`, and `line-gap-override` APIs as detailed in the [Improved font fallbacks](https://developer.chrome.com/blog/font-fallbacks) post.
- The [Font Loading API](https://web.dev/articles/optimize-webfont-loading.md.txt#the_font_loading_api) can reduce the time it takes to get necessary fonts.
- Load critical web fonts as early as possible using `<link rel=preload>`. A preloaded font will have a higher chance to meet the first paint, in which case there's no layout shifting.

Read [Best practices for fonts](https://web.dev/articles/font-best-practices.md.txt) for other font best practices.

## Reduce CLS by ensuring pages are eligible for the bfcache

A highly effective technique for keeping CLS scores low is to ensure your web pages are eligible for the [back/forward cache](https://web.dev/articles/bfcache.md.txt) (bfcache).

The bfcache keeps pages in browsers memory for a short period after you navigate away so if you return to them, then they will be restored exactly as you left them. This means the fully loaded page is instantly available---without any shifts which may be normally seen during load due to any of the reasons given earlier.

While this does potentially still mean the initial page load encounters layout shifts, when a user goes back through pages they are not seeing the same layout shifts repeatedly. You should always aim to avoid the shifts even on the initial load, but where that is more tricky to resolve fully, you can at least reduce the impact by avoiding them on any bfcache navigations.

Back and forward navigations are common on many sites. For example, returning to a contents page, or a category page, or search results.

When this [was rolled out to Chrome](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/docs/speed/metrics_changelog/2022_01_bfcache.md), we saw [noticeable improvements in CLS](https://developer.chrome.com/docs/crux/release-notes#202201).

The bfcache is used by default by all browsers, but some sites are ineligible for the bfcache due to a variety of reasons. Read [the bfcache guide](https://web.dev/articles/bfcache.md.txt) for more details on how to test and identify any issues preventing bfcache usage to ensure you are making full use of this feature to help your overall CLS score for your site.

## Conclusion

There are a number of techniques to identify and improve CLS as detailed earlier in this guide. There are allowances built into Core Web Vitals, so even if you cannot eliminate CLS completely, using some of these techniques should allow you to reduce the impact. This will hopefully allow you to stay within those limits, creating a better experience for your website's users.
