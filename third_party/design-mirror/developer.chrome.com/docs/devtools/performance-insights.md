---
source_url: https://developer.chrome.com/docs/devtools/performance-insights
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:57+00:00
sha256: f36f02ba547466759e5754596586ae7589425af25fe4a65801f9c770ca533d2e
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Jecelyn Yeen [X](https://twitter.com/jecfish) [GitHub](https://github.com/jecfish) [Bluesky](https://bsky.app/profile/jec.fish) [Homepage](https://jec.fish/)  Sofia Emelianova [GitHub](https://github.com/sofiayem)

> [!CAUTION]
> **Caution:** The **Performance insights** panel is [deprecated](https://developer.chrome.com/blog/insights-panel-deprecation.md.txt) and removed from DevTools starting with Chrome version 132. We recommend you use the [Performance \> Insights](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#insights) tab instead. To learn more, see [Performance tooling in 2024 and beyond](https://developer.chrome.com/blog/perf-tooling-2024.md.txt#the_experimental_performance_insights_panel_will_be_deprecated).

Use the **Performance insights** panel to get actionable and use-case-driven insights on your website's performance.

> [!NOTE]
> **Note:** This feature is available only in Chrome, not Chromium.

[Video](https://www.youtube.com/watch?v=5PFmGeCZDvw)

## Overview

The **Performance insights** panel lets you do the following:

- [Record and measure page load performance](https://developer.chrome.com/docs/devtools/performance-insights.md.txt#record).
- [View Web Vitals performance metrics](https://developer.chrome.com/docs/devtools/performance-insights.md.txt#vitals).
- [View network activity](https://developer.chrome.com/docs/devtools/performance-insights.md.txt#network).
- Simulate slower CPU and network speeds.
- Import and export recordings.

## Why a new panel?

The new **Performance insights** panel is an experiment to address these 3 developer pain points when working with the existing **Performance** panel:

- **Too much information** . With the redesigned UI, the **Performance insights** panel streamlines the data and displays only relevant information.
- **Hard to distinguish between use cases** . The **Performance insights** panel supports use-case-driven analysis. It only supports page load use-case at the moment, with more to come in the future based on your [feedback](https://crbug.com/1270700), for example, [interactivity](https://web.dev/inp).
- **Requires deep expertise of how browsers work to use effectively** . The **Performance insights** panel highlights the key insights in the **Insights** pane, with actionable feedback on how to fix issues.

## Introduction

This tutorial teaches you how to measure and understand your page load performance with the **Performance insights** panel. Continue reading or watch the video version of this tutorial above.

## Open the Performance insights panel

1. [Open DevTools](https://developer.chrome.com/docs/devtools/open.md.txt).
2. Click on **More options** \> **More tools** \> **Performance insights**.

   

   Alternatively, use the [Command Menu](https://developer.chrome.com/docs/devtools/command-menu.md.txt) to open the **Performance insights** panel.

   

## Record performance

The **Performance insights** panel can record general and use-case-driven (for example, page load) performance.

1. [Open this demo page](https://coffee-cart.app/?ad=1) in a new tab and, on the page, [open the Performance insights panel](https://developer.chrome.com/docs/devtools/performance-insights.md.txt#open).
2. You can throttle the network and CPU while recording. For this tutorial, check **Disable cache** and set **CPU** to **4x slowdown** in the drop-down menu:

   

   > [!IMPORTANT]
   > **Key point:** Throttling is relative to your computer's capabilities. For example, the 4x slowdown option makes your CPU operate 4 times slower than usual. DevTools can't truly simulate the CPUs of mobile devices because the architecture of mobile devices is very different from that of desktops and laptops.

3. Click **Measure page load**. DevTools records performance metrics while the page reloads and then automatically stops the recording a couple seconds after the page load has finished.

   

   > [!IMPORTANT]
   > **Key point:** If you want to measure general performance of your web page, use **Start recording** . Interact with the page and click **Stop recording** manually to stop recording.

## Replay a performance recording

Use the controls at the bottom to control the replay of your recording.

Here is an example of how to do it.

- Click **Play** to play the recording.
- Click **Pause** to pause the replay.
- Adjust the **playback speed** with the drop-down.
- Click **Toggle visual preview** to show or hide the visual preview.

## Navigate a performance recording

DevTools automatically zooms out to show the full recording timeline. You can navigate the recording with zoom and move the timeline.

To zoom and move the timeline left and right, use the corresponding navigation buttons:

- Click on the **Timeline** to move the playhead to view a particular frame.
- Click the **Zoom in** and **Zoom out** controls at the bottom to zoom. In this case, you zoom based on the playhead.
- Drag the horizontal scroll bar at the bottom to move the timeline left and right.

Alternatively, you can use keyboard shortcuts. Click on the button to view the shortcuts.

When using shortcuts, you zoom based on your mouse cursor.

## View performance insights

Get a list of performance insights in the **Insights** pane. Identify and fix potential performance issues.

Hover over each of the insights to highlight them on the main tracks.

Click on an insight, for example, the render-blocking request, to open it in the **Details** pane. To understand the issue further, examine its **File** , **Issue** , **How to fix** sections, and more.

## View Web Vitals performance metrics

[Web Vitals](https://web.dev/articles/vitals) is an initiative by Google to provide unified guidance for quality signals that are essential to delivering a great user experience on the web.

You can view these metrics on the **Timeline** and **Insights** pane.

Hover over the insights on the **Timeline** to learn more about the metrics.

## Discover delays of the largest contentful paint

[Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) is one of the [Core Web Vitals](https://web.dev/articles/vitals#core_web_vitals) metrics. It reports the render time of the largest image or text block visible within the viewport, relative to when the page first started loading.

A [good LCP score](https://web.dev/articles/lcp#what_is_a_good_lcp_score?) is 2.5 seconds or less.

If the largest contentful paint on your page takes longer to render, in the timeline, you will see the LCP badge with a yellow square or red triangle.

To open the **Details** pane, click the LCP badge on the timeline or on the **Insights** pane on the right. In the pane, you can discover potential causes for the delays and suggestions on how to fix them.

In this example, a request blocks rendering and you can apply critical styles inline to fix it. To learn more, see [Eliminate render-blocking resources](https://web.dev/articles/render-blocking-resources).

To view the [subparts of LCP render time](https://web.dev/articles/optimize-lcp#lcp_breakdown), scroll down to the **Details** \> **Timings breakdown** section.

LCP render time consists of the following subparts:

| LCP sub-part | Description |
|---|---|
| Time to first byte (TTFB) | The time from when the user initiates loading the page until when the browser receives the first byte of the HTML document response. |
| Resource load delay | The delta between TTFB and when the browser starts loading the LCP resource. |
| Resource load time | The time it takes to load the LCP resource itself. |
| Element render delay | The delta between when the LCP resource finishes loading until the LCP element is fully rendered. |

If an LCP element doesn't require a resource load to render, the resource load delay and time are omitted. For example, in case the element is a text node rendered with a system font.

## View layout shifts activity

View layout shifts activity in the **Layout Shifts** track.

Layout shifts are grouped in a [session window](https://web.dev/blog/evolving-cls/?utm_source=devtools#why_a_session_window). In the example, there are two session windows. Session windows have gaps between them.

> [!IMPORTANT]
> **Key point:** Think about layout shifts like fireworks. There are times where multiple shifts happen at once, then they pause for a while, then multiple shifts happen again. Each set of multiple shifts is a session window. For more information, see [Session window](https://web.dev/blog/evolving-cls/?utm_source=devtools#why_a_session_window).

[Cumulative Layout Shifts (CLS)](https://web.dev/cls) is one of the [core web vitals](https://web.dev/articles/vitals#core_web_vitals) metrics. Use the **Layout Shifts** track to identify potential issues and causes of layout shifts.

Always start with the largest session window when improving CLS metric. In our example, session window 1 is the largest window, based on the background color and level.

Click on a screenshot to view the layout shift's details, identify potential root causes and impacted elements.

In our example, the potential root cause is **unsized media** . To learn how to fix it, see [Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls#images_without_dimensions).

### Understand layout shifts score

To understand how the scores are calculated, use the **Window** section in the **Details** pane. The **Window** shows which session window the current layout shift belongs to.

If the whole page is shifted, the maximum score of each layout shift is `1`. In our example, the first layout shift scored `0.15`. The second layout shift scored `0.041`.

The total score for this session window is `0.19`. Based on the CLS threshold, it needs improvement. The session window background color reflects the same.

The session window background graph increases over time. The **Cumulative score** of the layout shift reflects the increase at that point of time.

## View network activity

View network activity in the **Network** track. You can expand the network track to view all the network activities and click on each item to view the details.

## View renderer activity

View render activity in the **Renderer** track. You can expand each renderer to view the activities and click on each item to view the details.

## View GPU activity

View GPU activity in the **GPU** track. The GPU track is hidden by default. To enable it, check **GPU** in [Settings](https://developer.chrome.com/docs/devtools/performance-insights.md.txt#settings).

## View user timings

To get custom performance measures, you can use [User Timing](https://www.w3.org/TR/user-timing/) and visualize your timings with the **Timing** track. For more information, see the [User timing API](https://web.dev/articles/usertiming).

Check out [this demo page](https://jec.fish/demo/perf-measure) that calculates the elapsed time of text loading.

To view user timings:

1. Mark places in your application with [`performance.mark()`](https://web.dev/articles/usertiming#using_mark()).
2. Measure the elapsed time between marks with [`performance.measure()`](https://web.dev/articles/usertiming#calculating_measurements_with_measure()).
3. [Record performance](https://developer.chrome.com/docs/devtools/performance-insights.md.txt#record).
4. View the measurements on the **Timings** track. If you can't see the track, check **User timings** in [Settings](https://developer.chrome.com/docs/devtools/performance-insights.md.txt#settings).
5. To view details, click the timing on the track. 

## Customize the UI

To customize the **Timeline** and **Tracks** , click the panel's **Settings** icon and check the options you prefer.

## Export a recording

To save a recording, click **Export** .

## Import a recording

To load a recording, select **Import** .

## Delete a recording

To delete a recording:

1. Click **Delete** . A confirmation dialog opens. 
2. In the dialog, click **Delete** to confirm the deletion.
