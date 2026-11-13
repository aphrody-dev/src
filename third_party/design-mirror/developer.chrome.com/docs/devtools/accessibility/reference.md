---
source_url: https://developer.chrome.com/docs/devtools/accessibility/reference
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:36+00:00
sha256: 0ceab4ba27921b138d5006a862d26701791593054aea6adb6885dbc424b605fe
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Kayce Basques [X](https://twitter.com/kaycebasques) [GitHub](https://github.com/kaycebasques) Sofia Emelianova [GitHub](https://github.com/sofiayem)

This page is a comprehensive reference of accessibility features in Chrome DevTools. It is intended
for web developers who:

- Have a basic understanding of DevTools, such as how to open it.
- Are familiar with [accessibility principles and best practices](https://web.dev/accessibility/).

The purpose of this reference is to help you discover all of the tools available in DevTools that
can help you examine a page's accessibility.

See [Navigating Chrome DevTools With Assistive Technology](https://developer.chrome.com/docs/devtools/accessibility/navigation.md.txt) if you're looking for help on
navigating DevTools with an assistive technology like a screen reader.

See [Learn Accessibility](https://web.dev/learn/accessibility) if you'd like to learn how to develop accessible websites.

## Overview of accessibility features in Chrome DevTools

This section explains how DevTools fits into your overall accessibility toolkit.

When determining whether a page is accessible, you need to have 2 general questions in mind:

1. Can I navigate the page with a keyboard or [screen reader](https://web.dev/semantics-builtin/#screen-readers)?
2. Are the page's elements properly marked up for screen readers?

In general, DevTools can help you fix errors related to question #2, because these errors are easy
to detect in an automated fashion. Question #1 is just as important, but unfortunately DevTools
can't help you there. The only way to find errors related to question #1 is to try using a page with
a keyboard or screen reader yourself. See [How To Do An Accessibility Review](https://web.dev/how-to-review/) to learn more.

## Audit a page's accessibility

In general, use the accessibility checks under the **Lighthouse** panel to determine if:

- A page is properly marked up for screen readers.
- The text elements on a page have sufficient contrast ratios. See also [Make your website more readable](https://developer.chrome.com/docs/devtools/accessibility/reference.md.txt#contrast).

To audit a page:

1. Go to the URL that you want to audit.
2. In DevTools, click the **Lighthouse** panel. DevTools shows you various configuration options.

   > [!NOTE]
   > **Note:** The screenshots in this section were taken with Chrome 69. In the screenshots, the panel is still named **Audits** but it was [renamed to Lighthouse in Chrome 83](https://developer.chrome.com/blog/new-in-devtools-83.md.txt#lighthouse) You can check what version you're running at `chrome://version`. The **Audits** panel UI will look different in some earlier or later versions of Chrome, but the general workflow is the same.

3. For **Device** , select **Mobile** if you want to simulate a mobile device. This option changes
   your user agent string and resizes the viewport. If the mobile version of the page
   displays differently than the desktop version, this option could have a significant effect on
   the results of your audit.

4. In the **Lighthouse** section, make sure that **Accessibility** is enabled. Disable the other
   categories if you want to exclude them from your report. Leave them enabled if you want to
   discover other ways to improve the quality of your page.

5. The **Throttling** section lets you throttle the network and CPU, which is useful when analyzing
   load performance. This option should be irrelevant to your accessibility score, so you can use
   whatever you prefer.

6. The **Clear Storage** checkbox lets you clear all storage before loading the page, or preserve
   storage between page loads. This option is also probably irrelevant to your accessibility score,
   so you can use whatever you prefer.

7. Click **Generate Report**. After 10 to 30 seconds, DevTools provides a report. Your report gives you
   various tips on how to improve the page's accessibility.

8. Click an audit to learn more about it.

9. Click **Learn More** to view that audit's documentation.

### See also: aXe extension

You may prefer to use the [aXe extension](https://chrome.google.com/webstore/detail/axe/lhdoppojpmngadmnindnejefpokejbdd) or [Lighthouse extension](https://chrome.google.com/webstore/detail/lighthouse/blipmdconlkpinefehnmjammfjpmpbjk) rather than the **Lighthouse** panel that is available by default in Chrome.
They generally provide the same information, since aXe is the underlying engine that powers the **Lighthouse** panel. The aXe
extension has a different UI and describes audits slightly differently.

One advantage that the aXe
extension has over the **Audits** panel is that it lets you inspect and highlight failing nodes.

## Test content reflow with the Device Toolbar

The [Web Content Accessibility Guidelines (WCAG) reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html) criterion recommends that web content remain viewable without loss of information even when the viewport is resized or changes orientation. By aligning content to a single column, users who use enlarged text are supported. To test how your content reflows, [resize the viewport](https://developer.chrome.com/docs/devtools/device-mode.md.txt#responsive) dynamically with the **Device toolbar** in the **Lighthouse** panel.

To resize the viewport, drag the handles to whatever dimensions you need. For the specific dimensions to test, see the [WCAG reflow success criterion](https://www.w3.org/WAI/WCAG21/Understanding/reflow.html).

## The Accessibility tab

The **Accessibility** tab is where you can view the accessibility tree, ARIA attributes, and computed
accessibility properties of DOM nodes.

To open the **Accessibility** tab:

1. Click the **Elements** panel.
2. In the **DOM Tree**, select the element you want to inspect.
3. Click the **Accessibility** tab. This tab may be hidden behind the **More Tabs** keyboard_double_arrow_right button.

You can drag the **Accessibility** tab to the front for quicker access in the future.

### View an element's position in the accessibility tree

[The accessibility tree](https://web.dev/the-accessibility-tree/) is a subset of the DOM tree. It only contains elements from the DOM tree
that are relevant and useful for displaying the page's contents in a screen reader.

To inspect an element's position in the accessibility tree from the [Accessibility tab](https://developer.chrome.com/docs/devtools/accessibility/reference.md.txt#tab), toggle **Show accessibility tree**.

This toggle replaces the DOM tree in the **Elements** panel with a full-page accessibility tree. This tree helps you better understand how your web content is exposed to assistive technology.

To browse the accessibility tree, you can expand and select nodes to see their details under [**Computed properties**](https://developer.chrome.com/docs/devtools/accessibility/reference.md.txt#computed).

At any point you can toggle back to the DOM tree. The corresponding DOM node stays selected. This is a great way to understand the mapping between the DOM node and its accessibility tree node.

### View an element's ARIA attributes

ARIA attributes ensure that screen readers have all of the information that they need in order to
properly represent a page's contents.

View an element's ARIA attributes in [the Accessibility tab](https://developer.chrome.com/docs/devtools/accessibility/reference.md.txt#tab).

### View the source order of elements on screen

The elements on the page don't always appear in the order they are in the source. This might confuse users who depend on assistive technology to navigate the web.

To view and debug the source order on your website:

1. [Inspect an element](https://developer.chrome.com/docs/devtools/open.md.txt#inspect) on the page.
2. In **Elements** \> **Accessibility** \> **Source Order Viewer** , check check_box **Show source order**.

In the viewport, DevTools outlines nested elements with borders and marks them with numbers corresponding to their source order.

### View an element's computed accessibility properties

> [!NOTE]
> **Note:** If you're looking for computed CSS properties, see [the Computed tab.](https://developer.chrome.com/docs/devtools/css/reference.md.txt#computed)

Some accessibility properties are dynamically calculated by the browser. These properties can be
viewed in the **Computed Properties** section of the **Accessibility** tab.

View an element's computed accessibility properties in [the Accessibility tab](https://developer.chrome.com/docs/devtools/accessibility/reference.md.txt#tab).

## The Rendering tab

Use the **Rendering** tab to emulate certain CSS media features without manually specifying them in your code or testing environment. These media features change the appearance of your web page based on the user's device preferences. To test your page's visual accessibility, [open the **Rendering** tab](https://developer.chrome.com/docs/devtools/rendering.md.txt#open-rendering) and explore the following options:

- [Emulate vision deficiencies](https://developer.chrome.com/docs/devtools/rendering/apply-effects.md.txt#emulate_vision_deficiencies) to view your page through several different simulated vision deficiencies.
- [Emulate CSS media feature `prefers-color-scheme`](https://developer.chrome.com/docs/devtools/rendering/emulate-css.md.txt#emulate_css_media_feature_prefers-color-scheme) to see what your page looks like with dark or light mode enabled. Many think of dark mode as an aesthetic choice, but [Dark mode as an accessibility tool](https://web.dev/articles/prefers-color-scheme#dark_mode_as_an_accessibility_tool) makes a case for its usefulness otherwise.
- [Emulate CSS media type](https://developer.chrome.com/docs/devtools/rendering/emulate-css.md.txt#emulate_css_media_type_enable_print_preview) to see your page in a print or screen media style.
- [Emulate CSS media feature `forced-colors`](https://developer.chrome.com/docs/devtools/rendering/emulate-css.md.txt#emulate_css_media_feature_forced-colors) to see how your page looks if the user agent enabled a forced colors mode.
- [Emulate CSS media feature `prefers-contrast`](https://developer.chrome.com/docs/devtools/rendering/emulate-css.md.txt#emulate_css_media_feature_prefers-contrast) to see your web content with a higher, lower, or specific contrast value.
- [Emulate CSS media feature `prefers-reduced-motion`](https://developer.chrome.com/docs/devtools/rendering/emulate-css.md.txt#emulate_css_media_feature_prefers-reduced-motion) to view your web content with reduced motion. Some users experience distraction or nausea from animated content. Use this option to see how your page looks without animations or things like smooth-scrolling.
- [Emulate CSS media feature `prefers-reduced-transparency`](https://developer.chrome.com/docs/devtools/rendering/emulate-css.md.txt#reduced-transparency) to see how your web content appears if the user requests to reduce the transparent or translucent layer effects used on the device.

## Discover and fix low-contrast text

DevTools can automatically find low-contrast issues and suggest better colors to help you fix them. See [Make your website more readable](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt) to learn more.
