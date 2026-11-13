---
source_url: https://developer.chrome.com/docs/devtools/performance/selector-stats
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: 14a1729a753f3c67c7a9fe01e46ebae62373bf6b159c96df52c908c0eb329a8a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Sofia Emelianova [GitHub](https://github.com/sofiayem)

The **Performance** panel marks each long-running task with a red triangle in the upper right corner and a warning in the **Summary** tab, to indicate work on the main thread that takes a long time to run and has slow performance:

In your performance recordings, some of these long-running tasks may be **Recalculate Style** events. A **Recalculate Style** event tracks the time it takes for the browser to do the following:

- Iterate through the DOM elements on a page, to find all of the CSS style rules that match a given element.
- Compute each element's actual style, based on the matching CSS style rules.

CSS styles need to be recalculated whenever the applicability of CSS rules may have changed, such as when:

- Elements are added to or removed from the DOM.
- An element's attributes are changed, such as the value of a class or ID attribute.
- User makes input, such as a mouse move or a change of element focus, which can affect `:hover` rules.

Long-running **Recalculate Style** events can be [problematic for performance](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations), and can be a cause of long presentation delays that affect your website's [Interaction to Next Paint (INP)](https://web.dev/articles/inp). If you find long-running **Recalculate Style** events, you can use the **Selector Stats** tab to understand which of your CSS selectors is taking the most time and slowing down performance.

The **Selector Stats** tab provides statistics about the CSS rule selectors that were involved in one or more **Recalculate Style** events within a performance recording.

## Record a performance trace with Selector Stats turned on

To view the statistics of your CSS rule selectors during long-running **Recalculate Style** events, record a performance trace with the **Selector Stats** capture setting turned on.

> [!TIP]
> **Tip:** The **Selector Stats** is turned off by default because it adds more overhead to your performance recordings. Leave it turned on when you need to inspect the performance of **Recalculate Style** events and other rendering information.

To record a performance trace with selector statistics:

1. Open a web page, for example, the [Photo Gallery demo page](https://microsoftedge.github.io/Demos/photo-gallery/).

2. [Open DevTools](https://developer.chrome.com/docs/devtools/open.md.txt) and navigate to the **Performance** panel.

3. In the **Performance** panel, click the **Capture settings** button and check **Enable CSS selector stats**.

4. Click **Record** , run the scenario that you want to improve, then click **Stop**.

Then, view CSS selector statistics, as described in the next sections.

## View CSS rule selector statistics for a single event

To view the statistics of the CSS rule selectors that are involved in a single **Recalculate Style** event:

1. [Record a performance trace with Selector Stats turned on](https://developer.chrome.com/docs/devtools/performance/selector-stats.md.txt#enabled-selector-stats).

2. Find a **Recalculate Style** event in your performance recording and click it.

3. In the bottom section of the **Performance** panel, open the **Selector Stats** tab.

### Table of CSS selectors in the Selector Stats tab

The **Selector Stats** tab contains a table of CSS selectors. The table displays the following information for each CSS selector:

| Column                     | Description                                                                                                                                                                                            |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Elapsed (ms)               | The amount of time the browser spent matching this CSS selector. This time is given in milliseconds (ms), where 1 ms is 1/1000 of a second.                                                            |
| Match Attempts             | The number of elements the browser engine attempted to match with this CSS selector.                                                                                                                   |
| Match Count                | The number of elements the browser engine matched with this CSS selector.                                                                                                                              |
| % of slow-path non-matches | The ratio of elements that didn't match with this CSS selector, to the elements that the browser engine attempted to match, and which required the browser engine to use less optimized code to match. |
| Selector                   | The CSS selector that was matched.                                                                                                                                                                     |
| Style Sheet                | The CSS style sheet that contains the CSS selector.                                                                                                                                                    |

When finished, in the **Performance** panel, open **Capture settings** and clear **Enable CSS selector stats**.

## View CSS rule selector statistics for multiple events

To view aggregate statistics of the CSS rule selectors that are involved in multiple **Recalculate Style** events, copy multiple **Selector Stats** tables into a spreadsheet, as follows:

1. [Record a performance trace with Selector Stats turned on](https://developer.chrome.com/docs/devtools/performance/selector-stats.md.txt#enabled-selector-stats).

2. Find the first **Recalculate Style** event you're interested in, and then click it.

3. In the bottom section of the **Performance** panel, open the **Selector Stats** tab.

4. Right-click the selector stats table and select **Copy table**.

5. Paste the table into a spreadsheet, such as Google Sheets.

6. Repeat the previous steps with the other **Recalculate Style** events you're interested in.

When finished, in the **Performance** panel, open **Capture settings** and clear **Enable CSS selector stats**.

## View aggregate CSS rule selector statistics for the full recording

To view aggregate statistics of the CSS rule selectors that are involved in the entire performance recording:

1. [Record a performance trace with Selector Stats turned on](https://developer.chrome.com/docs/devtools/performance/selector-stats.md.txt#enabled-selector-stats).

2. Click an empty area of the flame chart to deselect any event that may be selected.

3. Select the entire recording range. To do this, double-click the CPU chart at the top of the **Performance** panel.

4. In the bottom section of the **Performance** panel, open the **Selector Stats** tab. You will see a new row at the top with data on totals for all selectors.

When finished, in the **Performance** panel, open **Capture settings** and clear **Enable CSS selector stats**.

## Analyze CSS selector stats

To sort the data in the **Selector Stats** table in ascending or descending order, click a column header. For example, to see which CSS selectors take up the most time, click the **Elapsed (ms)** column header.

To try to improve the performance of your web page, focus on the CSS selectors that:

- Took a long time to calculate (high **Elapsed (ms)** value).
- Which the browser attempted to match many times (high **Match Attempts** value).
- Which the browser didn't actually match many elements with (low **Match Count** value compared to the **Match Attempts** value).
- Which have a high percentage of slow-path non-matches.

For example, in the previous screenshot:

- The first CSS selector (`html body .ps[tooltip...`) required the most time.
- The browser engine attempted to match this CSS selector 1104 times, but didn't match any elements.

Therefore, this CSS selector is the first candidate to try to improve.

Try to change your CSS selectors so they require less time to calculate and match fewer elements on the page. How to improve your CSS selectors depends on your particular use case.

Repeat the steps in this tutorial to confirm that your changes helped decrease the **Recalculate Style** event duration, in the **Elapsed (ms)** column.

> [!NOTE]
> **Note:** Portions of this page are modifications based on work created and [shared by Microsoft](https://github.com/MicrosoftDocs/edge-developer) and used according to terms described in the [Creative Commons Attribution 4.0 International License](https://creativecommons.org/licenses/by/4.0/legalcode). The [original page](https://learn.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/evaluate-performance/selector-stats) is authored by Microsoft Edge Team, including Michael Hoffman, Patrick Brosset, Joe Martin, and Zoher Ghadyali.
