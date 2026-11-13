---
source_url: https://web.dev/articles/long-tasks-devtools
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:04+00:00
sha256: db0d98b27ff35ddfe46f357f95441c8152a6f00638a9db5fd69f93cc0b6a2229
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Addy Osmani [X](https://twitter.com/addyosmani) [GitHub](https://github.com/addyosmani) [Bluesky](https://bsky.app/profile/addyosmani.bsky.social)

A [Long Task](https://developer.mozilla.org/docs/Web/API/Long_Tasks_API) is
JavaScript code that monopolizes the main thread for extended periods of time,
causing the UI to "freeze".

While a page page is loading, Long Tasks can tie up the main thread and make the
page unresponsive to user input, even if it looks ready. Clicks and taps often
don't work because interactive features like event listeners and click handlers
haven't yet been attached to UI elements. Because of this, Long Tasks can
greatly increase your [Time to Interactive](https://web.dev/articles/tti.md.txt).
 A Lighthouse Report showing a poor TTI.

Chrome DevTools can now [visualize Long Tasks](https://developer.chrome.com/blog/new-in-devtools-74/#longtasks),
making it easier to see tasks that need optimizing.

## What counts as a Long Task?

CPU-heavy Long Tasks are caused by complex work that takes longer than
50 ms. [The RAIL model](https://web.dev/articles/rail.md.txt) suggests you process user input
events in [50 ms](https://web.dev/articles/rail.md.txt#response_process_events_in_under_50ms) to
ensure a visible response within 100 ms and preserve the connection between
action and reaction.

Key point: While the RAIL model suggests providing a visual response to user
input within 100 ms, the [Interaction to Next Paint (INP)](https://web.dev/articles/inp.md.txt)
metric's thresholds allow for up to 200 ms to set more achievable expectations,
especially for slower devices.

## Are there Long Tasks in my page that could delay interactivity?

Until now, you've needed to manually look for "long yellow blocks" of script
over 50ms long in [Chrome DevTools](https://developer.chrome.com/docs/devtools)
or use the [Long Tasks API](https://calendar.perfplanet.com/2017/tracking-cpu-with-long-tasks-api/)
to figure out what tasks were delaying interactivity.
 The yellow bars indicate task length.

To help ease your performance auditing workflow,
[DevTools now visualizes Long Tasks](https://developer.chrome.com/blog/new-in-devtools-74/#longtasks).
Tasks (shown in gray) have red flags if they are Long Tasks.

To use the new visualization tool:

1. Record a trace in the [Performance panel](https://developer.chrome.com/docs/devtools/evaluate-performance) of loading a web page.
2. Look for a red flag in the main thread view. You should see tasks are now marked in gray and labeled **Task**.
3. Hold your pointer over a gray bar. You'll see a dialog showing the task duration and whether it's considered a Long Task.

## What is causing my Long Tasks?

To discover the cause of a long task, select the gray **Task** bar. In the
drawer beneath, select **Bottom-Up** and **Group by Activity**. This lets you
see what activities contributed the most (in total) to the task taking so long
to complete. In the following example, the cause of the delay looks like a
costly set of DOM queries.
 DevTools shows the causes of long tasks in this menu.

## What are common ways to optimize Long Tasks?

Large scripts are often a major cause of Long Tasks. Consider
[splitting them up](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting.md.txt).
Also keep an eye on third-party scripts, which can also contain Long Tasks that
delay primary content becoming interactive.

Break all your work into chunks that run in \< 50 ms, and run these chunks
at the right place and time. The right place for some of them might be off the
main thread, in a service worker. For guidance on breaking up long tasks, see
[Optimize Long Tasks](https://web.dev/articles/optimize-long-tasks.md.txt) and Phil Walton's
[Idle Until Urgent](https://philipwalton.com/articles/idle-until-urgent/).

Keep your pages responsive. Minimizing Long Tasks is a great way to ensure your
users have a delightful experience when they visit your site. For more
information on Long Tasks, refer to
[User-centric Performance Metrics](https://developers.google.com/web/fundamentals/performance/user-centric-performance-metrics#tracking_long_tasks).
