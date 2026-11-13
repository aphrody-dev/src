---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/offscreen-content-hidden
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: ed871e822584bedbe753397e2ac9ae88b531efdb469e2cd96e6dfee0f383eed6
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Ensure that only relevant parts of the page are exposed to screen readers and
other assistive technologies.
For example, content that's offscreen should be hidden from assistive
technologies.

## How to manually test

To check that offscreen content is hidden, you should
[test with screen readers](https://web.dev/learn/accessibility/test-assistive-technology)
screen reader.

- For Mac users, check out [this video on using VoiceOver](https://www.youtube.com/watch?v=5R-6WvAihms&list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g&index=6).
- For PC users, check out [this video on using NVDA](https://www.youtube.com/watch?v=Jao3s_CwdRU&list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g&index=4).
- For Chromebooks users, check out [ChromeVox, the built-in screen reader](https://support.google.com/chromebook/answer/7031755).

Use the <kbd>TAB</kbd> key to tab through your page.
The screen reader shouldn't announce hidden content.

## How to fix

To hide offscreen content,
remove the element containing that content from the
tab order by setting it to `display: none` or `visibility: hidden`.

For example:

```css
.remove-me {
  visibility: hidden;
}
```

```html
<button class="remove-me">Can't reach me with the TAB key!</button>
```

See also [Correctly set the visibility of offscreen content](https://web.dev/articles/keyboard-access#correctly_set_the_visibility_of_offscreen_content).

## Resources

[Source code for **Offscreen content is hidden from assistive technology** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/offscreen-content-hidden.js)
