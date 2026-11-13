---
source_url: https://web.dev/articles/accessible-tap-targets
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:39+00:00
sha256: 6d10eee8b496e838ecea6bcfc577d97c8dfb9a3228cda337db33b2a62695f7fb
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Dave Gash Meggin Kearney Patrick H. Lauke [GitHub](https://github.com/patrickhlauke) [Homepage](https://www.splintered.co.uk/) Rachel Andrew Technical Writer [GitHub](https://github.com/rachelandrew) [LinkedIn](https://www.linkedin.com/in/rachelandrew) [Mastodon](https://front-end.social/@rachelandrew) [Bluesky](https://bsky.app/profile/rachelandrew.bsky.social) [Homepage](https://rachelandrew.co.uk) Rob Dodson [X](https://twitter.com/rob_dodson) [GitHub](https://github.com/robdodson) [Homepage](https://robdodson.me)

When your design is displayed on a mobile device, make sure that interactive
elements, such as buttons or links, are large enough and have enough
space around them. This makes it easier for users to press without
accidentally overlapping onto other elements. This benefits all users,
but is especially helpful for anyone with a motor impairment.

A minimum recommended touch target size is around 48 device independent pixels
on a site with a properly set mobile viewport.
For example, while an icon may only have a width and height of 24px,
you can use additional padding to bring the tap target size up to 48px.
The 48x48 pixel area corresponds to around 9mm,
which is about the size of a person's finger pad area.
<iframe height="200" style="width: 100%;" scrolling="no" title="Style a tap target on Codepen" src="https://codepen.io/web-dot-dev/embed/gbPGxBb?default-tab=html%2Cresult" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
</iframe>

Touch targets should also be spaced about 8 pixels apart, horizontally and
vertically, so that a user's finger pressing on one tap target does not
inadvertently touch another tap target.

## Test your touch targets

If your target is text and you have used relative values such as `em` or `rem`
to size the text and any padding, you can use developer tools
to check that the computed value of that area is large enough.
<iframe height="350" style="width: 100%;" scrolling="no" src="https://codepen.io/web-dot-dev/embed/dPGVVXy?default-tab=html%2Cresult" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
</iframe>

Inspect the link. In Chrome DevTools switch to the
[Computed pane](https://developer.chrome.com/docs/devtools/css/overrides#computed)
where you can inspect the various parts of the box and see what pixel size
they resolve to. In Firefox DevTools there is a Layout Panel.
In that Panel you get the actual size of the inspected element.

## Detect touchscreen with media queries

Instead of testing for viewport dimensions and guessing small dimensions that
are likely to be phones or tablets, there are more robust ways to adapt
your design based on actual device capabilities.

With media queries, we can detect whether a user's primary input is touchscreen
(`pointer`) and if any of the detected inputs is a touchscreen (`any-pointer`).
The `pointer` and `any-pointer` features return `fine` or `coarse`.
A fine pointer indicates the user has a mouse or trackpad. This is still true if
the mouse is connected by Bluetooth to a phone or tablet. A `coarse` pointer
indicates a touchscreen, which can be any size or type of device.

If you add a media query to increase the touch target, test for a coarse pointer
so you can increase the tap targets for all touchscreen users, no matter
what device they're using.

```css
.container a {
  padding: 0.2em;
}

@media (any-pointer: coarse) {
  .container a {
    padding: 0.8em;
  }
}
```

Find out more about interaction media features, such as `pointer`, in
[Responsive web design basics](https://web.dev/articles/responsive-web-design-basics.md.txt).
