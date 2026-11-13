---
source_url: https://developer.chrome.com/docs/devtools/performance/timeline-reference
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: b2799922e954b849f1fcf7e3537ddc66e1dee1d2d276a33db90790880076e2d0
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Meggin Kearney Flavio Copes

The timeline events mode displays all events triggered while making a recording. Use the timeline
event reference to learn more about each timeline event type.

## Common timeline event properties

Certain details are present in events of all types, while some only apply to certain event types.
This section lists properties common to different event types. Properties specific to certain event
types are listed in the references for those event types that follow.

| Property                 | When is it shown                                                                                                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aggregated time          | For events with [nested events](https://developer.chrome.com/docs/devtools/evaluate-performance/reference#view-nested-events), the time taken by each category of events. |
| Call Stack               | For events with [child events](https://developer.chrome.com/docs/devtools/evaluate-performance/reference#view-nested-events), the time taken by each category of events.  |
| CPU time                 | How much CPU time the recorded event took.                                                                                                                                |
| Details                  | Other details about the event.                                                                                                                                            |
| Duration (at time-stamp) | How long it took the event with all of its children to complete; timestamp is the time at which the event occurred, relative to when the recording started.               |
| Self time                | How long the event took without any of its children.                                                                                                                      |
| Used Heap Size           | Amount of memory being used by the application when the event was recorded, and the delta (+/-) change in used heap size since the last sampling.                         |

## Loading events

This section lists events that belong to Loading category and their properties.

| Event            | Description                                                                     |
| ---------------- | ------------------------------------------------------------------------------- |
| Parse HTML       | Chrome executed its HTML parsing algorithm.                                     |
| Finish Loading   | A network request completed.                                                    |
| Receive Data     | Data for a request was received. There will be one or more Receive Data events. |
| Receive Response | The initial HTTP response from a request.                                       |
| Send Request     | A network request has been sent.                                                |

### Loading event properties

| Property            | Description                                                  |
| ------------------- | ------------------------------------------------------------ |
| Resource            | The URL of the requested resource.                           |
| Preview             | Preview of the requested resource (images only).             |
| Request Method      | HTTP method used for the request (GET or POST, for example). |
| Status Code         | HTTP response code.                                          |
| MIME Type           | MIME type of the requested resource.                         |
| Encoded Data Length | Length of requested resource in bytes.                       |

## Scripting events

This section lists events that belong to the Scripting category and their properties.

| Event                   | Description                                                                                                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Animation Frame Fired   | A scheduled animation frame fired, and its callback handler invoked.                                                                                                                                 |
| Cancel Animation Frame  | A scheduled animation frame was canceled.                                                                                                                                                            |
| GC Event                | Garbage collection occurred.                                                                                                                                                                         |
| DOMContentLoaded        | The [DOMContentLoaded](https://developer.mozilla.org/docs/Web/Events/DOMContentLoaded) was fired by the browser. This event is fired when all of the page's DOM content has been loaded and parsed.  |
| Evaluate Script         | A script was evaluated.                                                                                                                                                                              |
| Event                   | A JavaScript event ("mousedown", or "key", for example).                                                                                                                                             |
| Function Call           | A top-level JavaScript function call was made (only appears when browser enters JavaScript engine).                                                                                                  |
| Install Timer           | A timer was created with [setInterval()](https://developer.mozilla.org/docs/Web/API/WindowTimers/setInterval) or [setTimeout()](https://developer.mozilla.org/docs/Web/API/WindowTimers/setTimeout). |
| Request Animation Frame | A `requestAnimationFrame()` call scheduled a new frame                                                                                                                                               |
| Remove Timer            | A previously created timer was cleared.                                                                                                                                                              |
| Time                    | A script called [console.time()](https://developer.chrome.com/docs/devtools/console/reference.md.txt#consoletimelabel)                                                                               |
| Time End                | A script called [console.timeEnd()](https://developer.chrome.com/docs/devtools/console/reference.md.txt#consoletimeendlabel)                                                                         |
| Timer Fired             | A timer fired that was scheduled with `setInterval()` or `setTimeout()`.                                                                                                                             |
| XHR Ready State Change  | The ready state of an XMLHTTPRequest changed.                                                                                                                                                        |
| XHR Load                | An `XMLHTTPRequest` finished loading.                                                                                                                                                                |

### Scripting event properties

| Property      | Description                                  |
| ------------- | -------------------------------------------- |
| Timer ID      | The timer ID.                                |
| Timeout       | The timeout specified by the timer.          |
| Repeats       | Boolean that specifies if the timer repeats. |
| Function Call | A function that was invoked.                 |

## Rendering events

This section lists events that belong to Rendering category and their properties.

| Event             | Description                                      |
| ----------------- | ------------------------------------------------ |
| Invalidate layout | The page layout was invalidated by a DOM change. |
| Layout            | A page layout was executed.                      |
| Recalculate style | Chrome recalculated element styles.              |
| Scroll            | The content of nested view was scrolled.         |

### Rendering event properties

| Property               | Description                                                                                                                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Layout invalidated     | For Layout records, the stack trace of the code that caused the layout to be invalidated.                                                                                                                            |
| Nodes that need layout | For Layout records, the number of nodes that were marked as needing layout before the relayout started. These are normally those nodes that were invalidated by developer code, plus a path upward to relayout root. |
| Layout tree size       | For Layout records, the total number of nodes under the relayout root (the node that Chrome starts the relayout).                                                                                                    |
| Layout scope           | Possible values are "Partial" (the re-layout boundary is a portion of the DOM) or "Whole document".                                                                                                                  |
| Elements affected      | For Recalculate style records, the number of elements affected by a style recalculation.                                                                                                                             |
| Styles invalidated     | For Recalculate style records, provides the stack trace of the code that caused the style invalidation.                                                                                                              |

## Painting events

This section lists events that belong to Painting category and their properties.

| Event            | Description                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Composite Layers | Chrome's rendering engine composited image layers.                                                                                             |
| Image Decode     | An image resource was decoded.                                                                                                                 |
| Image Resize     | An image was resized from its native dimensions.                                                                                               |
| Paint            | Composited layers were painted to a region of the display. Hovering over a Paint record highlights the region of the display that was updated. |

### Painting event properties

| Property   | Description                                                       |
| ---------- | ----------------------------------------------------------------- |
| Location   | For Paint events, the x and y coordinates of the paint rectangle. |
| Dimensions | For Paint events, the height and width of the painted region.     |
