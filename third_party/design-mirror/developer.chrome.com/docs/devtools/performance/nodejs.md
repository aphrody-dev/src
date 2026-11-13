---
source_url: https://developer.chrome.com/docs/devtools/performance/nodejs
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: 83db94ce9d6006eafb9d9989243add9a9d5f992428ac3c23355c4e58b7581a49
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Jecelyn Yeen [X](https://twitter.com/jecfish) [GitHub](https://github.com/jecfish) [Bluesky](https://bsky.app/profile/jec.fish) [Homepage](https://jec.fish/) Nancy Li [LinkedIn](https://www.linkedin.com/in/yangxinyu-li) Dale St. Marthe [LinkedIn](https://www.linkedin.com/in/dale-st-marthe)

Use the **Performance** panel to profile the performance of [Node.js](https://nodejs.org/en) and [Deno](https://deno.com/) applications.

> [!WARNING]
> **Deprecated:** Previously, you might have used the **JS Profiler** panel, but it's now [deprecated](https://developer.chrome.com/blog/profiling-cpu.md.txt).

## What's a CPU profile?

A CPU profile is a report that shows how the CPU was used over a period of time. It can show which programs were using the most CPU time, which processes were running, and how much time was spent in each state. With CPU profiles, you can identify performance bottlenecks and optimize CPU resource utilization.

## Open DevTools for Node

1. In the command line, run:

   ### Node.js

   ```bash
   node --inspect file-name.js
   ```

   ### Deno

   ```bash
   deno --inspect file-name.js
   ```

2. Connect to DevTools for Node in one of the following ways:

   - [Open DevTools](https://developer.chrome.com/docs/devtools/open.md.txt) and click the green Node button in the DevTools action bar at the top.
   - In the address bar enter `chrome://inspect`, then click one of the following:

     - **Open dedicated DevTools for Node** under **Devices**.
     - **Inspect** under the target you want to profile.

## Profile the CPU

To profile the CPU, open the **Performance** panel and click the **Record** button two times to start and end profiling.

> [!TIP]
> **Tip:** Optionally, you can choose a JavaScript VM instance by selecting it from the drop-down list at the right of the action bar.

## Analyze profiling results

After you stop the recording, the **Performance** panel organizes and displays data about the recording in a "profile". Use the following tabs to analyze the profiling data:

- **Timeline overview**. Located at the top under the activity bar. Shows CPU and NET activity charts on a timeline. Use it to identify performance bottlenecks.

- **Bottom-Up** : Use this tab to inspect a [selected portion of the recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#select) and see aggregated time spent on individual activities.

- **Call Tree** : This tab displays the root activities of a [selected portion of the recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#select). Root activities also have their call stacks nested. Use this tab to identify which activity is causing the most work.

- **Event Log** : This tab lists activities from a [selected portion of the recording](https://developer.chrome.com/docs/devtools/performance/reference.md.txt#select) in the order that they occurred.

## Profile with the `console.profile()` command

DevTools lets you profile JavaScript CPU performance with the `console.profile()` command. You can add this command to your code and then run the file, or copy and paste your code into the **Console** . The **Performance** panel will show you the results.

To use this command, follow these steps:

1. Enclose your code with `console.profile()` and `console.profileEnd()`, for example:

   ```javascript
   console.profile( profile ${i} );
   // Code to be profiled
   doSomething();
   console.profileEnd();
   ```

2. Run your code in one of two ways:

   - If you're using the **Console** , [open DevTools for Node](https://developer.chrome.com/docs/devtools/performance/nodejs.md.txt#open-devtools-for-node), paste your code to the **Console** , and press <kbd>Enter</kbd>.

   - In the command line, run:

     ### Node.js

     ```bash
     node --inspect file-name.js
     ```

     ### Deno

     ```bash
     deno --inspect file-name.js
     ```

     Then [open DevTools for Node](https://developer.chrome.com/docs/devtools/performance/nodejs.md.txt#open-devtools-for-node).

Once the profile is completed, the result will be shown in the **Performance** panel automatically.
