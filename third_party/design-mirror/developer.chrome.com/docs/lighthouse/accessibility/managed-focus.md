---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/managed-focus
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:40+00:00
sha256: 9fe8a14adf8e380b4cfdcd59b752238cb7ce231fb895823b5e10e9d4996d99ef
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Whenever new content is added to a page,
try to ensure the user's focus gets directed to that content,
so they can take action on it.

## How to manually test

Single-page apps are important to test,
especially when it comes to managing a user's focus
to new content.

Typically, in a single-page app, clicking on a link won't cause a hard refresh.
Instead, a route change fetches new data for the `<main>` content area.

Users navigating with a screen reader or other assistive technology may not
know that the new content has been added to the page.
There's no indication that they should navigate back to the `<main>` area.

When this happens, you'll want to manage the user's focus
to keep the user's perceived context in sync with the site's visual content.

## How to fix

To manage a user's focus to fresh content on a page,
find a good heading in the newly loaded content and direct focus to it.
The easiest way to pull this off is to give the heading a `tabindex` of `-1`
and call its `focus()` method:

```html
<main>
  <h2 tabindex="-1">Welcome to your shopping cart</h2>
</main>
<script>
  // Assuming this gets called every time new content loads...
  function onNewPage() {
    var heading = document.querySelector("h2");
    heading.focus();
    // You can also update the page title :)
    document.title = heading.textContent;
  }
</script>
```

Assistive technologies announce the new heading
and the main landmark area that it's contained in.

> [!NOTE]
> **Note:** You probably don't want to use focus management when a user first arrives at your site. Only implement this for subsequent navigation, such as after the user clicks a link.

## Resources

[Source code for **The user's focus is directed to new content added to the page** audit](https://github.com/GoogleChrome/lighthouse/blob/master/core/audits/accessibility/manual/managed-focus.js)
