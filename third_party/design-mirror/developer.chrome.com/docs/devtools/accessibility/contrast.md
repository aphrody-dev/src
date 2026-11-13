---
source_url: https://developer.chrome.com/docs/devtools/accessibility/contrast
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:12+00:00
sha256: bb061ee59ed3d6485d10a3e5e2e9b28e93becd295118802a0f9ebd4d6d81a146
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Sofia Emelianova [GitHub](https://github.com/sofiayem)

> [!IMPORTANT]
> **Key Point:** Low contrast text is the top accessibility issue on the web. In February 2022, 83.9% of the top million home pages had this issue. Check out the [WebAIM Million 2022 report](https://webaim.org/projects/million/#wcag) to learn more.

[Video](https://www.youtube.com/watch?v=t4pDjqhG6fE)

Low contrast texts make your website less readable for all users, even more so
for users with vision deficiencies. DevTools can automatically find low contrast
issues and suggest better colors to help you fix them.

Use DevTools to:

- [**Discover contrast issues**](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#discover-low-contrast). Use the **CSS Overview** panel, (preview) **Issues** tab, or a **Lighthouse** report to get a list of all issues.
- [**Fix contrast issues**](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#fix-low-contrast). View the issues with a tooltip in inspector mode and select colors that the **Color Picker** suggests to fix the contrast ratio.
- [**Emulate vision deficiencies**](https://developer.chrome.com/docs/devtools/rendering/apply-effects.md.txt#emulate_vision_deficiencies). Look at your site the way your users see it.

## Discover low contrast text

To discover low contrast text:

1. [Open DevTools](https://developer.chrome.com/docs/devtools/open.md.txt) on your page.
2. List all contrast issues by using one of three panels:

   - [**CSS Overview**](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#overview-contrast)
   - [(Preview) **Issues**](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#issues-contrast)
   - [**Lighthouse**](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#lighthouse-contrast)

You can experiment by opening [our CodePen](https://codepen.io/editor/web-dot-dev/pen/019ef466-d38b-7876-8a2c-87fd142fea89).

### Contrast issues in the CSS Overview panel

To get an overview:

1. Open [CSS Overview](https://developer.chrome.com/docs/devtools/css-overview.md.txt#open).
2. [Capture an overview](https://developer.chrome.com/docs/devtools/css-overview.md.txt#run).
3. Open the **Colors** section, go to **Contrast issues**, and click an issue, if any.
4. In the **Contrast issues** table, hover over an element and click the link next to it.

   
5. Fix the issue as described in the [Fix low contrast text](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#fix-low-contrast) section.

### (Preview) Contrast issues in the Issues tab

> [!NOTE]
> **Note:** This is a preview feature disabled by default.

To get a list of issues:

1. Enable contrast issues reporting in the **Issues** tab:
   1. Open **Settings** \> **Experimental**.
   2. In the filter bar, search for `contrast issue`.
   3. Select **Enable automatic contrast issue reporting via the Issues panel** . 
   4. Click **Reload DevTools** in the prompt at the top.
2. [Open the Issues tab](https://developer.chrome.com/docs/devtools/issues.md.txt#open).
3. Expand the contrast issues DevTools found, then expand the elements table, and click a link next to the element.

   
4. Fix the issue as described in the [Fix low contrast text](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#fix-low-contrast) section.

### Contrast issues in a Lighthouse report

To run a report:

1. [In DevTools](https://developer.chrome.com/docs/devtools/open.md.txt), open  **More tabs** \> **Lighthouse**.
2. Generate a Lighthouse report with the following settings:

   - **Mode**: Navigation (default)
   - **Categories**: Accessibility
   - **Device**: Desktop

   
3. Click **Analyze page load** and wait for Lighthouse to generate the report.

4. Go to the **Contrast** section. From the elements list, click a link to
   an affected element.

   
5. Fix the issue as described in the [Fix low contrast text](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#fix-low-contrast) section.

## Fix low contrast text

To fix a low contrast issue:

1. [Find a contrast issue](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#discover-low-contrast) and click a link to an
   affected element either on the [**CSS Overview** panel](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#overview-contrast),
   [**Issues** tab](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#issues-contrast), or
   [**Lighthouse** report](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#lighthouse-contrast). DevTools takes you to the
   **Elements** panel and selects the corresponding element.

   

   For example, on [our inaccessible demo CodePen](https://codepen.io/editor/web-dot-dev/pen/019ef466-d38b-7876-8a2c-87fd142fea89?orientation=left&panel=files&show=editors), the first affected
   element is `h1.line1`.
2. Click 
   **Inspect** at the top-right corner of DevTools and hover over the element in
   the viewport. DevTools shows a tooltip for this element.

   

   Notice the 
   warning sign next to the contrast ratio value in the tooltip. The contrast
   ratio measures the difference in brightness between the foreground (text
   color) and background colors.
3. [Open the **Color Picker**](https://developer.chrome.com/docs/devtools/css/reference.md.txt#color-picker) next
   to the color declaration of the element's text and, in the **Color Picker** ,
   expand the **Contrast ratio** section.

   

   The **Color Picker** tells you the contrast ratio doesn't meet the AA or AAA
   levels of [WebAIM guidelines](https://webaim.org/standards/wcag/).
4. Click the 
   **Use suggested color** button next to the AAA level. The **Color Picker**
   applies the text color that complies to the contrast ratio guidelines.

   
5. Alternatively, to pick a color manually, you can drag the circle in the
   shades preview. To stay within the AA or AAA level, pick a color below the
   top or bottom line respectively.

   
6. Similarly, fix all the contrast issues you found with the
   [**CSS Overview** panel](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#overview-contrast), [**Issues** tab](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#issues-contrast),
   or [**Lighthouse** report](https://developer.chrome.com/docs/devtools/accessibility/contrast.md.txt#lighthouse-contrast).

## Save the changes

To save the changes you made in DevTools:

- [Copy all CSS changes at once](https://developer.chrome.com/docs/devtools/changes.md.txt#copy-css-changes) and paste them to your code
- [Set up a Workspace](https://developer.chrome.com/docs/devtools/workspaces.md.txt) to allow DevTools to save files directly to your sources.

## What's next?

Learn more:

- [Learn Accessibility](https://web.dev/learn/accessibility) in general
- [Color and contrast](https://web.dev/learn/accessibility/color-contrast) accessibility in particular
