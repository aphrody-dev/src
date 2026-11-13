---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/paste-preventing-inputs
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: 4e6f1a61324aede284efcc16813aebfbe458589648016de66c8a4b29b18a3e70
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Some websites claim that allowing users to paste passwords reduces security.
However, password pasting actually _improves_ security
because it enables the use of password managers.

Password managers typically generate strong passwords for users,
store them securely, and then automatically paste them
into password fields whenever users need to log in. This approach is generally
more secure than forcing users to type in passwords that are short enough
to remember.

In the general case, users should not be prevented from pasting into `<input>` elements.

## How this Lighthouse audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags code that prevents users from pasting into non-readonly input fields:

Lighthouse gathers all non-readonly `<input>` elements,
pastes some text into each element,
and then verifies that `paste` event was not prevented by a custom event handler.

It's also possible to prevent pasting outside of a `paste` event listener.
Lighthouse doesn't detect that scenario.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## How to enable pasting into password fields

### Find the code that's preventing pasting

To quickly find and inspect the code that's preventing pasting:

1. Expand the [**Event Listener Breakpoints**](https://developer.chrome.com/docs/devtools/javascript/breakpoints.md.txt#event-listeners) pane.
2. Expand the **Clipboard** list.
3. Select the **`paste`** checkbox.
4. Paste some text into a password field on your page.
5. DevTools should pause on the first line of code in the relevant `paste` event listener.

### Remove the code that's preventing pasting

The source of the problem is often a call to `preventDefault()`
within the `paste` event listener
that's associated with the password input element:

```javascript
let input = document.querySelector("input");

input.addEventListener("paste", (e) => {
  e.preventDefault(); // This is what prevents pasting.
});
```

If you're only listening to paste events to preempt them,
remove the entire event listener.

## Resources

[Source code for **Prevents users from pasting into input fields** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/paste-preventing-inputs.js)
