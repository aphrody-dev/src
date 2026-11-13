---
source_url: https://developer.chrome.com/docs/devtools/performance/overview
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 606408d6b4a2752753233939ca67bdc959af4b84ca280304bae183fd8011777e
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Dale St. Marthe [LinkedIn](https://www.linkedin.com/in/dale-st-marthe) Sofia Emelianova [GitHub](https://github.com/sofiayem)

Use the **Performance** panel to analyze your website's performance.

> [!IMPORTANT]
> **Key Point:** You can also use **AI assistance** to analyze performance profiles and understand bottlenecks. See [AI assistance for performance](https://developer.chrome.com/docs/devtools/ai-assistance/chat.md.txt#performance).

[Video](https://www.youtube.com/watch?v=M5oe010pYbA)

## Overview

The **Performance** panel lets you record CPU performance profiles of your web applications. Analyze profiles to find potential performance bottlenecks and ways you can optimize resource use.

Use the **Performance** panel to do the following:

- Record a performance profile.
- Change capture settings.
- Analyze a performance report.

For a comprehensive guide on improving your website's performance, see [Analyze runtime performance](https://developer.chrome.com/docs/devtools/performance.md.txt).

## Open the Performance panel

To open the **Performance** panel, [open DevTools](https://developer.chrome.com/docs/devtools/open.md.txt) and select **Performance** from a set of tabs at the top.

Alternatively, follow these steps to open the **Performance** panel with the **Command menu**:

1. [Open DevTools](https://developer.chrome.com/docs/devtools/open.md.txt).
2. Open the **Command menu** by pressing:
3. macOS: <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>
4. Windows, Linux, ChromeOS: <kbd>Control</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>
5. Start typing `Performance panel`, select **Show Performance panel** , and press <kbd>Enter</kbd>.

## Observe Core Web Vitals live

When you open the **Performance** panel, it immediately captures and shows you your local [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) and [Cumulative Layout Shift (CLS)](https://web.dev/articles/cls) metrics tells you their score (good, needs improvement, or bad).

If you interact with your page, the **Performance** panel also captures your local [Interaction to Next Paint (INP)](https://web.dev/articles/inp) and its score, which, in addition to LCP and CLS, gives you a complete overview of [Core Web Vitals](https://web.dev/articles/vitals) of your page using your network connection and device. It also captures and reports Core Web Vitals for client-side soft navigations in single-page applications.

Under the three metric cards in the **Interactions** and **Layout shifts** tabs, you can find tables with information on captured interactions and layout shifts, including elements, timings, phases (for interactions), and scores (for layout shifts). To clear both lists, click **Clear**.

To get a breakdown of a metric score, hover over the metric value to see a tooltip.

### Compare your experience to the experience of your users

You can also fetch field data from the [Chrome UX Report](https://developer.chrome.com/docs/crux.md.txt) and compare the experience of your site's users to your local metrics.

To add field data:

1. In **Performance** \> **Next steps** \> **Field data** , click **Set up**.

2. In the **Configure field data fetching** dialog, note the **Privacy disclosure** , and click **Ok**.

   #### Advanced: Set up a mapping between development and production environments...

   Optionally, to automatically get the most relevant field data, you can set up (multiple) mappings between your development and production origins:
   1. In the dialog window, expand the **Advanced** section and click **+ New**.
   2. In the mapping table, enter your development and production URLs and click **+**.

      For example, a mapping of `http://localhost:8080` to `https://example.com` will bring up field data for `example.com/page1` when you navigate to `localhost:8080/page1`.

      Additionally, if for some reason you can't get the field data automatically, you can turn on **Always show field data for the below URL** and provide a URL. The **Performance** panel will attempt to fetch field data for this URL first and then show you this field data no matter what page you navigate to.

      To change your field data fetch settings after setup, click **Field data** \> **Configure**

   With the field data fetch set up, the **Performance** panel now shows you a comparison between your local metric scores and those that your users experience. You can see the collection period in the **Field data** section on the right.

   To get a breakdown of a metric score, hover over the metric value to see a tooltip.

### Configure your environment to better match that of your users

With the field data fetch set up as described in the previous section, the **Performance** panel provides you with recommendations on how to configure your environment to better match the experience of your users.

To configure your environment:

1. In each metric card, expand the **Consider your local test conditions** section, if any, and read the recommendations.

   Looks like in this example, to better match the experience of your users, you might want to use a common desktop screen size and throttle down the CPU and network.

2. To match the environment configuration for this example:

   1. Set your viewport to one of the common screen sizes (for example, 720p or 1080p). To emulate specific devices and screen sizes, you can use the [Device mode](https://developer.chrome.com/docs/devtools/device-mode.md.txt) in the **Elements** panel.
   2. 82% users of the website in this example use desktops to browse. To make sure that you compare your local metric scores to the correct field data, you can select **Desktop** from the **Field data** \> **Device** drop-down list.
   3. In the **Environment settings** section, set the **Network** drop-down list to, for example, **Fast 4G** , and **CPU** to, for example, **20x slowdown** . You may also make sure to **Disable network cache** in the same section.

   > [!TIP]
   > **Tip:** In throttling drop-down menus of the **Environment settings** section, the **Performance** panel may also recommend the throttling presets to use. Additionally, to better match low- and mid-tier mobile devices, you can [calibrate custom CPU throttling presets](https://developer.chrome.com/docs/devtools/settings/throttling.md.txt#cpu-throttling) on your device. To do so, select **Calibrate** from **CPU** \> **Calibrated presets**.

3. With your environment configured, reload the page, interact with it to capture your local INP, and compare the metric scores again.

   Looks like the metric scores are now more similar to those that your users experience. Accordingly, the **Consider your local test conditions** sections disappeared from the metric cards.

With that, you can now start improving the [Core Web Vitals](https://web.dev/articles/vitals) of your website:

- [Optimize LCP](https://web.dev/articles/optimize-lcp)
- [Optimize INP](https://web.dev/articles/optimize-inp)
- [Optimize CLS](https://web.dev/articles/optimize-cls)

## Capture and analyze a performance report

In the next sections, follow guidance on how to record a profile, change capture settings, and analyze the report.

[Video](https://www.youtube.com/watch?v=7A70hBrPL4I)

### Record a performance profile

When you are ready to record, the **Performance** panel gives you the following options:

- [Record runtime performance](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#record-runtime)
- [Record load performance](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#record-load)
- [Capture screenshots while recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#screenshots)
- [Force garbage collection while recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#garbage)
- [Save a recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#save)
- [Load a recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#load)
- [Clear a recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#clear)

### Change capture settings

**Capture settings** let you change how DevTools captures performance recordings and can give you additional information in the report. Click **Capture settings** to access the **Capture settings** menu.

Select the following options from the **Capture settings** menu:

- [**Disable JavaScript samples**](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#disable-js-samples): Disables the recording of the JavaScript call stacks displayed in the **Main** track that are called during the recording. Will reduce performance overhead.
- [**Enable advanced paint instrumentation (slow)**](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#paint): Captures advanced paint instrumentation. Significantly hinders performance.
- [**Enable CSS selector stats (slow)**](https://developer.chrome.com/blog/new-in-devtools-125.md.txt#perf): Captures CSS selector statistics. Significantly hinders performance.
- [**CPU throttling**](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#cpu-throttle): Simulate slower CPU speeds.
- [**Network throttling**](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#network-throttle): Simulate slower network speeds.
- [**Screenshot capture**](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#screenshots): Choose a screenshot frame size and count cap preset when **Screenshots** is enabled.

### Analyze a performance report

See [Analyze a performance recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#analyze) for a complete guide on how to use the **Performance** panel.

The following presents a grouping of topics from the guide, plus other helpful documentation:

**To learn how to navigate the report:**

- [Navigate the recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#navigate)
- [Search activities](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#search)
- [Track event initiators](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#event-initiators)

**Use Performance Insights to get actionable insights on your website's performance:**

- [Performance Insights](https://developer.chrome.com/docs/performance/insights)

**To learn how to focus on what matters for your workflow:**

- [Change the order of tracks and hide them](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#track-config)
- [Hide functions and their children in the flame chart](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#hide-func)
- [Create breadcrumbs and jump between zoom levels](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#breadcrumbs)

**To learn about the Bottom-up, Call tree, and Event log tabs:**

- [View activities in a table](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#activities)

**To learn how to analyze the report:**

- [View main thread activity](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#main)
- [Read the flame chart](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#flame-chart)
- [View a screenshot](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#view-screenshot)
- [View memory metrics](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#memory)
- [View the duration of a portion of a recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#duration)
- [Analyze CSS selector performance during Recalculate Style events](https://developer.chrome.com/docs/devtools/performance/selector-stats.md.txt)
- [Profile Node.js performance with the Performance panel](https://developer.chrome.com/docs/devtools/performance/nodejs.md.txt)
- [Analyze frames per second (FPS)](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#fps)
- [Timeline event reference](https://developer.chrome.com/docs/devtools/performance/timeline-reference.md.txt)

## Improve performance with these panels

Discover other panels that can help you improve your website's performance:

- [Lighthouse: Optimize website speed](https://developer.chrome.com/docs/devtools/lighthouse.md.txt)
- [Memory: Memory panel overview](https://developer.chrome.com/docs/devtools/memory.md.txt)
- [Rendering: Discover issues with rendering performance](https://developer.chrome.com/docs/devtools/rendering/performance.md.txt)
- [Issues: Find and fix problems](https://developer.chrome.com/docs/devtools/issues.md.txt)
- [Performance: View layers information](https://developer.chrome.com/docs/devtools/performance/reference.md.txt)

## Additional resources

[Video](https://www.youtube.com/watch?v=BHqxD9qr6Gw)
