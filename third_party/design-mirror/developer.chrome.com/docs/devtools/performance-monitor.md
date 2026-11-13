---
source_url: https://developer.chrome.com/docs/devtools/performance-monitor
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:22+00:00
sha256: bc3b623d78cdd51e86b2ffaf8228985daca793e7d98b10e0a002c1d5074d6247
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Dale St. Marthe [LinkedIn](https://www.linkedin.com/in/dale-st-marthe)

Use the **Performance monitor** to quickly get an idea of your site's load and runtime performance.

## Overview

The **Performance monitor** panel displays a timeline that graphs performance metrics in real-time. Click a metric to show or hide it. Then see how the graph changes as you interact with your app.

The performance monitor tracks the following metrics:

- CPU usage.
- JavaScript heap size.
- The total number of DOM nodes, JavaScript event listeners, documents, and frames on the page.
- Layouts and style recalculations per second.

## Open the Performance monitor panel

To open the **Performance monitor** panel:

1. [Open DevTools](https://developer.chrome.com/docs/devtools/open.md.txt).
2. Open the **Command menu** by pressing:
   - macOS: <kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>
   - Windows, Linux, ChromeOS: <kbd>Control</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> 
3. Start typing `Performance monitor`, select **Show Performance monitor** , and press <kbd>Enter</kbd>. DevTools displays the **Performance monitor** panel at the bottom of your DevTools window.

Alternatively, in the top right corner, select **More options** \> **More tools** \> **Performance monitor**.

## Use the Performance monitor panel

The **Performance monitor** gives a general idea of your website's runtime performance.

Observing how metric values change as you interact with your website can reveal opportunities for improvement.

A useful feature of the **Performance monitor** is that it persists throughout page navigation. So, as frontend developer, you can avoid issues like [layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) by opening the **Performance monitor** , scrolling through their website, and keeping an eye on the **DOM Nodes** and **Layout/sec** metrics.

If users are reporting sluggish load times on your site, the **Performance monitor** can help you identify problem areas.

For example, a large spike in **CPU usage** can point to inefficient code. And generally, if a page contains a high number of **JS event listeners** then it may be beneficial to refactor your code and reduce those numbers to free up memory.

If you're just starting out with analyzing performance, the recommended path is to first use the **Lighthouse** panel, and then investigate further using the **Performance** panel or **Performance monitor**.
