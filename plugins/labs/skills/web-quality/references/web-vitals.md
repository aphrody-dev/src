# web-vitals 6.2.3 API (README @94b3b4b, Apache-2.0, see LICENSE-web-vitals.txt)

Builds: `web-vitals` (standard), `web-vitals/attribution` (+~1.5 KB brotli). Dist: `dist/web-vitals.iife.js`, `dist/web-vitals.attribution.iife.js` (+ ES module variants). README CDN examples still pin `web-vitals@5`; use `@6` for 6.x. Prefer self-hosting.

Functions: `onCLS(cb, opts?)`, `onFCP`, `onINP`, `onLCP`, `onTTFB`. Exported thresholds: `CLSThresholds [0.1,0.25]`, `FCPThresholds [1800,3000]`, `INPThresholds [200,500]`, `LCPThresholds [2500,4000]`, `TTFBThresholds [800,1800]`.

Metric: `name, value, rating ('good'|'needs-improvement'|'poor'), delta, id, entries, navigationType, navigationId, navigationInteractionId?, navigationStartTime?, navigationURL?`.

ReportOpts: `reportAllChanges?`, `reportSoftNavs?` (SPA soft navigations), `generateTarget?(el)` (custom selector). INP: `durationThreshold?`, `includeProcessedEventEntries?`. LCP attribution: `resourceBufferSize?`.

| Metric | Attribution fields                                                                                                                                                                                                                                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LCP    | target, url, timeToFirstByte, resourceLoadDelay, resourceLoadDuration, elementRenderDelay, lcpResourceEntry, lcpEntry, navigationEntry                                                                                                                                                                                                                      |
| INP    | interactionTarget, interactionTime, interactionType (pointer/keyboard), nextPaintTime, inputDelay, processingDuration, presentationDelay, loadState, longAnimationFrameEntries, longestScript{entry, subpart, intersectingDuration}, totalScriptDuration, totalStyleAndLayoutDuration, totalPaintDuration, totalUnattributedDuration, processedEventEntries |
| CLS    | largestShiftTarget, largestShiftTime, largestShiftValue, largestShiftEntry, largestShiftSource, loadState                                                                                                                                                                                                                                                   |
| FCP    | timeToFirstByte, firstByteToFCP, loadState, fcpEntry, navigationEntry                                                                                                                                                                                                                                                                                       |
| TTFB   | waitingDuration, cacheDuration, dnsDuration, connectionDuration, requestDuration, navigationEntry                                                                                                                                                                                                                                                           |

Rules: call each `on*` once per page; send with `navigator.sendBeacon`; use `delta` when the analytics backend sums values; put the attribution target in a debug dimension (README GA4 example).
