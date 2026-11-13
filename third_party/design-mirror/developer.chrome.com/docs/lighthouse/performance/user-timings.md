---
source_url: https://developer.chrome.com/docs/lighthouse/performance/user-timings
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:22+00:00
sha256: 97e86e7ad64bbab9b0d857dc10cefb7172f72fc9242ad1f23b92af0d940368c3
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

## What's the User Timing API?

Making your web app fast and responsive is crucial for a good user experience.
The first step in improving performance is identifying where time is being spent.

The [User Timing API](https://developer.mozilla.org/docs/Web/API/User_Timing_API)
gives you a way to measure your app's JavaScript performance.
You do that by inserting API calls in your JavaScript and then
extracting detailed timing data that you can use to optimize your code.
You can access those data from JavaScript using the API
or by viewing them on your [Chrome DevTools Timeline Recordings](https://developer.chrome.com/docs/devtools/evaluate-performance/performance-reference).

Check out the [page about the User Timing API](https://web.dev/articles/usertiming)
for a quick introduction to using it.

## How Lighthouse reports User Timing data

When your app uses the User Timing API to add marks (that is, time stamps)
and measures (that is, measurements of the elapsed time between marks),
you'll see them in your
[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) report:

Lighthouse extracts User Timing data from
[Chrome's Trace Event Profiling Tool](https://www.chromium.org/developers/how-tos/trace-event-profiling-tool).

This audit is not structured as a pass or fail test.
It's just an opportunity to discover a useful API that can help you measure your app's performance.

> [!NOTE]
> **Note:** See the [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring.md.txt) post to learn how your page's overall performance score is calculated.

## Stack-specific guidance

### React

Use the [React DevTools Profiler](https://reactjs.org/blog/2018/09/10/introducing-the-react-profiler.html),
which makes use of the Profiler API, to measure the rendering performance of
your components.

## Resources

- [Source code for **User Timing marks and measures** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/user-timings.js)
- [User Timing API (MDN)](https://developer.mozilla.org/docs/Web/API/User_Timing_API)
- [User Timing API (web.dev)](https://web.dev/articles/usertiming)
