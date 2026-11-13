---
source_url: https://web.dev/articles/optimize-input-delay
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 22a9fd3cfae7edcb49315cafd04964c9e912acdf33d211e9729adefaf0475696
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Find out what input delay is, and learn techniques to reduce it for faster interactivity.

 Jeremy Wagner [GitHub](https://github.com/malchata) [LinkedIn](https://www.linkedin.com/in/malchata) [Homepage](https://jlwagner.net/)

Interactions on the web are complicated things, with all sorts of activity occurring in the browser to drive them. What they all have in common, though, is that they incur some input delay before their event callbacks begin to run. In this guide, you'll learn what input delay is, and what you can do to minimize it so your website's interactions run faster.

## What is input delay?

*Input delay* is the period of time beginning from when the user first interacts with a page---such as tapping on a screen, clicking with a mouse, or pressing a key---up to when the event callbacks for the interaction begin to run. Every interaction begins with some amount of input delay.
 The mechanics behind input delay. When an input is received by the operating system, it must be passed to the browser before the interaction starts. This takes a certain amount of time, and can be increased by existing main thread work.

Some portion of the input delay is unavoidable: it always takes some amount of time for the operating system to recognize an input event and pass it to the browser. However, that portion of the input delay is often not even noticeable, and there are other things that happen on the page itself that can make input delays long enough to cause problems.

## How to think about input delay

Generally speaking, you want to keep every part of an interaction as short as possible so that your website has the best chance of meeting [the Interaction to Next Paint (INP) metric's "good" threshold](https://web.dev/articles/inp.md.txt#what_is_a_good_inp_score), regardless of the user's device. Keeping input delay in check is just one part of meeting that threshold.

Consequently, you'll want to aim for the shortest input delay possible to meet INP's "good" threshold. You should be aware, though, you can't expect to eliminate input delays entirely. As long as you're avoiding excessive main thread work while users are attempting to interact with your page, your input delay should be low enough to avoid problems.

## How to minimize input delay

As said previously, some input delay is unavoidable, but on the other hand, some input delay *is* avoidable. Here are some things to consider if you're struggling with long input delays.

### Avoid recurring timers that kick off excessive main thread work

There are two commonly used timer functions in JavaScript that can contribute to input delay: [`setTimeout`](https://developer.mozilla.org/docs/Web/API/setTimeout) and [`setInterval`](https://developer.mozilla.org/docs/Web/API/setInterval). The difference between the two is that `setTimeout` schedules a callback to run after a specified time. `setInterval`, on the other hand, schedules a callback to run every *n* milliseconds in perpetuity, or until the timer is stopped with [`clearInterval`](https://developer.mozilla.org/docs/Web/API/clearInterval).

`setTimeout` is not problematic in itself---in fact, it can be helpful in [avoiding long tasks](https://web.dev/articles/optimize-input-delay.md.txt#avoid_long_tasks). However, it depends on *when* the timeout occurs, and whether the user attempts to interact with the page when the timeout callback runs.

Additionally, `setTimeout` can be run in a loop or recursively, where it acts more like `setInterval`, though preferably not scheduling the next iteration until the previous one is completed. While this means the loop will yield to the main thread every time `setTimeout` is called, you should take care to ensure its callback doesn't end up doing excessive work.

`setInterval` runs a callback on an interval, and is therefore much more likely to get in the way of interactions. This is because---unlike a single instance of a `setTimeout` call, which is a one-off callback that *may* get in the way of a user interaction---`setInterval`'s recurring nature makes it much more likely that it *will* get in the way of an interaction, thus increasing the interaction's input delay.
 A timer registered by a previous `setInterval` call contributing to input delay as depicted in the performance panel of Chrome DevTools. The added input delay causes the event callbacks for the interaction to run later than they otherwise could.

If timers are occurring in first-party code, then you have control over them. Evaluate whether you need them, or do your best to reduce the work in them as much as possible. However, timers in third-party scripts are a different story. You often don't have control over what a third-party script does, and fixing performance issues in third-party code often involves working with stakeholders to determine whether a given third-party script is necessary, and if so, establish contact with a third-party script vendor to determine what can done to fix performance issues they may cause on your website.

### Avoid long tasks

One way to mitigate long input delays is to avoid long tasks. When you have excessive main thread work that blocks the main thread during interactions, that will add to the input delay for them before the long tasks have had a chance to finish.
 A visualization of what happens to interactions when tasks are too long and the browser can't respond quickly enough to interactions, versus when longer tasks are broken up into smaller tasks.

Besides minimizing the amount of work you do in a task---and you should *always* strive to do as little work as possible on the main thread---you can improve responsiveness to user input by [breaking up long tasks](https://web.dev/articles/optimize-long-tasks.md.txt).

> [!NOTE]
> **Note:** Yielding isn't foolproof, as tasks from third-party JavaScript can still make their way in between first-party tasks after yielding. This can still contribute to input delay for future interactions, and you'll need to be mindful of third-party tasks that may run on an interval, as described in the previous section. This is a problem that the [`scheduler.yield` API](https://developer.mozilla.org/docs/Web/API/Scheduler/yield) solves.

### Be mindful of interaction overlap

A particularly challenging part of optimizing INP can be if you have interactions that overlap. Interaction overlap means that after you've interacted with one element, you make another interaction with the page before the initial interaction has had a chance to render the next frame.
 A visualization of two concurrent interactions in the performance profiler in Chrome's DevTools. The rendering work in the initial click interaction causes an input delay for the subsequent keyboard interaction.

Sources of interaction overlap may be as simple as users making many interactions in a short period of time. This can occur when users type in form fields, where many keyboard interactions can occur in a very short period of time. If the work on a key event is especially expensive---such as in the common case of autocomplete fields where network requests are made to a back end---you have a couple of options:

- Consider [debouncing](https://web.dev/articles/debounce-your-input-handlers.md.txt) inputs to limit the amount of times an event callback executes in a given period of time.
- Use [`AbortController`](https://developer.mozilla.org/docs/Web/API/AbortController/abort) to cancel outgoing `fetch` requests so the main thread doesn't become congested handling `fetch` callbacks. Note: an `AbortController` instance's `signal` property can also be used to [abort events](https://developer.mozilla.org/docs/Web/API/AbortSignal/abort_event).

Another source of increased input delay due to overlapping interactions can be expensive animations. In particular, animations in JavaScript may fire many [`requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame) calls, which may get in the way of user interactions. To get around this, use CSS animations whenever possible to avoid queueing potentially expensive animation frames---but if you do this, make sure you [avoid non-composited animations](https://developer.chrome.com/en/docs/lighthouse/performance/non-composited-animations) so that animations run mainly on the GPU and compositor threads, and not on the main thread.

## Conclusion

While input delays may not represent the majority of the time your interactions take to run, it's important to understand that every part of an interaction takes up an amount of time that you can reduce. If you're [observing long input delay](https://web.dev/articles/manually-diagnose-slow-interactions-in-the-lab.md.txt#how_to_identify_long_input_delays), then you have opportunities to reduce it. Avoiding recurring timer callbacks, breaking up long tasks, and being aware of potential interaction overlap can all help you to reduce input delay, leading to faster interactivity for your website's users.
