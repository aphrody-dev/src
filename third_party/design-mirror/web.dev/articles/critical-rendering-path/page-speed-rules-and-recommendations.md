---
source_url: https://web.dev/articles/critical-rendering-path/page-speed-rules-and-recommendations
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: c412937abc42f36dfc83f4790528d2ed8c6883f703269c7c7c5cfbd84bd9392b
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Ilya Grigorik [X](https://twitter.com/igrigorik) [Homepage](https://igvita.com/)

Published: August 17, 2018

This guide examines PageSpeed Insights rules in context: what to pay attention to when optimizing the critical rendering path, and why.

## Eliminate render-blocking JavaScript and CSS

To deliver the fastest time to first render, minimize and (where possible) eliminate the number of critical resources on the page, minimize the number of downloaded critical bytes, and optimize the critical path length.

## Optimize JavaScript use

JavaScript resources are parser blocking by default unless marked as `async` or added using a special JavaScript snippet. Parser blocking JavaScript forces the browser to wait for the CSSOM and pauses construction of the DOM, which in turn can significantly delay the time to first render.

### Prefer asynchronous JavaScript resources

Asynchronous resources unblock the document parser and allow the browser to avoid blocking on CSSOM prior to executing the script. Often, if the script can use the `async` attribute, it also means it is not essential for the first render. Consider loading scripts asynchronously after the initial render.

### Avoid synchronous server calls

Use the `navigator.sendBeacon()` method to limit data sent by XMLHttpRequests in
`unload` handlers. Because many browsers require such requests to be
synchronous, they can slow page transitions, sometimes noticeably. The following
code shows how to use `navigator.sendBeacon()` to send data to the server in the
`pagehide` handler instead of in the `unload` handler.

```javascript
<script>
  function() {
    window.addEventListener('pagehide', logData, false);
    function logData() {
      navigator.sendBeacon(
        'https://putsreq.herokuapp.com/Dt7t2QzUkG18aDTMMcop',
        'Sent by a beacon!');
    }
  }();
</script>
```

The `fetch()` method provides a better way to asynchronously request data. `fetch()` processes responses using Promises rather than multiple event handlers. Unlike the response to an XMLHttpRequest, a `fetch()` response is a stream object. This means that a call to `json()` also returns a Promise.

```javascript
<script>
  fetch('./api/some.json')
    .then(
      function(response) {
        if (response.status !== 200) {
          console.log('Looks like there was a problem. Status Code: ' +  response.status);
          return;
        }
        // Examine the text in the response
        response.json().then(function(data) {
          console.log(data);
        });
      }
    )
    .catch(function(err) {
      console.log('Fetch Error :-S', err);
    });
</script>
```

The `fetch()` method can also handle POST requests.

```javascript
<script>
  fetch(url, {
    method: 'post',
    headers: {
      "Content-type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: 'foo=bar&lorem=ipsum'
  }).then(function() { // Additional code });
</script>
```

### Defer parsing JavaScript

To minimize the amount of work the browser has to perform to render the page, defer any non-essential scripts that are not critical to constructing the visible content for the initial render.

### Avoid long running JavaScript

Long running JavaScript blocks the browser from constructing the DOM, CSSOM, and rendering the page, so defer until later any initialization logic that's not essential for the first render. If a long initialization sequence needs to run, consider splitting it into several stages to allow the browser to process other events in between.

## Optimize CSS use

CSS is required to construct the render tree and JavaScript often blocks on CSS during initial construction of the page. Ensure that any non-essential CSS is marked as non-critical (for example, print and other media queries), and that the amount of critical CSS and the time to deliver it is as small as possible.

### Put CSS in the document head

Specify all CSS resources as early as possible within the HTML document so that the browser can discover the `<link>` tags and dispatch the request for the CSS as soon as possible.

### Avoid CSS imports

The CSS import (`@import`) directive enables one style sheet to import rules from another style sheet file. However, avoid these directives because they introduce additional round trips into the critical path: the imported CSS resources are discovered only after the CSS style sheet with the `@import` rule itself is received and parsed.

### Inline render-blocking CSS

For best performance, you may want to consider inlining the critical CSS directly into the HTML document. This eliminates additional roundtrips in the critical path and if done correctly can deliver a "one round trip" critical path length where only the HTML is a blocking resource.

## Feedback
