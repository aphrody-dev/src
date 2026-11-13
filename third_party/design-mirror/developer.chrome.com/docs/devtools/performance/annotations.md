---
source_url: https://developer.chrome.com/docs/devtools/performance/annotations
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: c0d979c7009fe47a60711af27911e7fdc42ab9f8e3d187ef75df841b4199c937
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Sofia Emelianova [GitHub](https://github.com/sofiayem) Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com)

## Overview

Once you have [recorded](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#record) a performance trace and [analyzed](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#analyze) it, you can annotate items (with Gemini), time ranges, and create connections. Then, you can share your findings with your colleagues or upload their annotated traces to inspect.

## Annotate items in the performance trace

To annotate a recording, open the **Annotations** tab in the sidebar on the left of the **Performance** panel. There are several ways to add an annotation:

- **Label item**: To add a label to an item, double-click it and type a label.
- **Connect two items**: To connect two items with an arrow, double-click the first item, click an arrow next to it, then click the second item.
- **Label a time range**: To label an arbitrary time range, shift-drag from the start of a time range to its end, then type a label.

In this example, in the **Network** track, there are two annotated requests, a connection between them, and an annotated time range highlighted in pink. The **Annotations** tab shows the number of annotations next to its tab name, in this example, 4.

### Generate annotations for Main track with Gemini

Naming things is hard! DevTools can use Gemini to suggest a label name in the **Main** track based on the context.

#### When you use this feature for the first time...

You will see the following screen that explains that AI may not always get things right, that the AI works by sending the necessary trace data to Google to analyse and make the suggestion, and that you can control this feature in the settings tab.
Auto annotation considerations prompt.

Once that's accepted, you can now ask Gemini to generate a label.

> [!NOTE]
> **Note:** Auto annotations are subject to the [same requirements as other AI features](https://developer.chrome.com/docs/devtools/ai-assistance#requirements) and can be [controlled through policy](https://developer.chrome.com/docs/devtools/ai-assistance#control_feature_availability).

To generate a label, double-click on one of the **Main track** items in the trace, then click **Generate label** next to the input field. Gemini can suggest a label based on the stack trace.

You can tweak the suggested text as you see fit.

All generated annotations are added to the **Annotations** tab.

### Remove or hide annotations

To delete an annotation, hover over it in the **Annotations** tab and click the **Delete** button next to it. Alternatively, edit the annotation by double-clicking it and delete the text. Or use the right-click context menu.

To hide annotations from the performance trace, check **Hide annotations** at the bottom of the **Annotations** tab.

## Save and share a recording

Annotations can be saved in performance traces for sharing. Traces can also be saved without annotations if preferred.

For more details on saving performance traces, see [Save performance traces](https://developer.chrome.com/docs/devtools/performance/save-trace.md.txt).

## Load a recording

To load an annotated (or not) recording, click **Upload** in the action bar at the top of the **Performance** panel.

The **Performance** panel will show annotations if they are present in the trace.
