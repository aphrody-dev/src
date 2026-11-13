---
source_url: https://web.dev/articles/baseline-in-action-color-theme
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: 8860abb820b9a17e8201e82a9cc133eb3f4a63003f95689dce205cbe8e644d1d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
David A. Herron [Homepage](https://www.oddbird.net/authors/davidh/)

Published: December 11, 2025

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/OPNdOeY?height=640&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen XJXEOEg by web-dot-dev on Codepen">
</iframe>

> [!NOTE]
> **Note:** This demo is also [available on GitHub](https://github.com/GoogleChromeLabs/baseline-demos/tree/main/src/color-theme).

So, you have a site that you want to build or redesign. Maybe you have a few core colors in mind, and you're thinking about how to quickly implement a theme based on those colors.

You'll need your primary color, but also colors for actions, hover states, errors, and colors for other user interface needs. Then what about light and dark mode options? Suddenly there's lots of colors you'll need, and it can feel overwhelming.

The good news is that when it comes to building a palette relative to the color tokens that define your site and switching between color modes, Baseline features can do a lot of the heavy lifting for you. You can explore some of these techniques in the featured demo, a color themed playlist on the fictional Baseline Radio site.

## Build a base with relative colors

If you have an idea for a primary color for your theme, with some basic color theory and the CSS [relative color syntax](https://developer.mozilla.org/docs/Web/CSS/CSS_colors/Relative_colors), you can quickly start generating a palette of colors to use in your theme.

Say your base color is a shade of teal, which you can first define in your preferred color format. Then you can use any color function to create new colors relative to your base color:

```css
html {
  --base-color: oklch(43.7% 0.075 224);
}
```

The `--base-color` custom property is made using the [`oklch()`](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/color_value/oklch) color function. OkLCh is the cylindrical form of the Oklab color space, and defines values for three channels: `L` (lightness), `C` (chroma), `H` (hue), plus an optional alpha channel to control transparency.

<iframe src="https:///frame/articles/baseline-in-action-color-theme/index_192bfe4cf67662b12d9ab47c0bf0bc9377db78174687f956836b4acc6d7d006c.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

OkLCh is a good format for this type of color manipulation, as it's designed to provide perceptual uniformity. For example, if you adjust just the hue of a color, the resulting color should have a similar perceived lightness and chroma to the original color. This is especially useful in avoiding unexpected contrast issues.

Keeping the same lightness and chroma from your `--base-color`, you could adjust the hue by 120 degrees in both directions for a triadic palette.

```css
html {
  /* ... */
  --triadic-color-primary: oklch(from var(--base-color) l c calc(h + 120));
  --triadic-color-secondary: oklch(from var(--base-color) l c calc(h - 120));
}
```

As shown here, the relative color syntax uses a color function that references an origin color (`--base-color` in this example) with the `from` keyword, and adjusts the color space's respective channels based on the chosen output color, which in this case will also be OkLCh.

The resulting output gives you a dark pink for the `--accent-color`, and a shade of gold to use for the `--highlight-color`, both with the same lightness and chroma as the original `--base-color`.

```css
html {
  /* ... */
  --accent-color: var(--triadic-color-primary);
  --highlight-color: var(--triadic-color-secondary);
}
```

<iframe src="https:///frame/articles/baseline-in-action-color-theme/index_330d6ee70726677e6753067030ea3d872a6b0feee28395fb89eeb81677893be3.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

> [!NOTE]
> **Note:** In this demo, both the origin color (`--base-color`) and the output colors are in the OkLCh color space. You could define your origin color in any format, though, and the output color will be in whichever color space you use for the manipulation.

```css
  html {
    /* Input color in the rgb color space*/
    --base-color: teal;

     /* Output color in oklch. Computes to oklch(0.543123 0.0927099 314.769) */
     --triadic-color-primary: oklch(from var(--base-color) l c calc(h + 120));
  }
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/NPNoXmp?height=384&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen XJXEOEg by web-dot-dev on Codepen">
</iframe>

A complementary color would add 180 degrees to the hue angle.

```css
html {
  /* ... */
  --complement-color: oklch(from var(--base-color) l c calc(h + 180));
  --border-highlight: var(--complement-color);
}
```

For a hover state in your UI, you might want to output a lighter version of a particular color. This would mean increasing the value of the lightness channel. For an active state, you might want to add transparency by adjusting the alpha channel, or darkening it by decreasing the value of the lightness channel.

```css
html {
  /* Darken the --base-color by 15% */
  --base-color-darkened: oklch(from var(--base-color) calc(l * 0.85) c h);
  /* Assign this color a meaningful variable name */
  --action-color: var(--base-color-darkened);
  /* Lighten the --action-color by 15% */
  --action-color-light: oklch(from var(--action-color) calc(l * 1.15) c h);
  /* Darken the --action-color by 10% */
  --action-color-dark: oklch(from var(--action-color) calc(l * 0.9) c h);
}
```

Here, we are deriving the `--action-color` from the `--base-color`, and using it for buttons and links. The `--action-color` has two variants---lighter and darker---that would still apply even if the `--action-color` was changed to be relative to another color different from the `--base-color`.

You can adjust channels by using a math function like `calc()` or replacing the channel entirely with a new value. Unchanged channels are represented by their respective letters (for example, `l` for an unchanged lightness value).

## Mix colors with `color-mix()`

For other color variants, you could take a similar approach and adjust other channels of the `--base-color` custom property. Or use `color-mix()` to add hints of the base color to other aspects of your design.

<iframe src="https:///frame/articles/baseline-in-action-color-theme/index_0ecfc23fade74112d405fcaf57766dfdee6e8b72e854940abd3501b3de841b6e.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

The `--border-color` is a mix of the base color and the named color `grey`, interpolated in the `oklab` color space. When used as a color interpolation method, this provides [perceptually uniform](https://developer.mozilla.org/docs/Web/CSS/Reference/Values/color_value/color-mix#choosing_a_color_space) results.

```css
html {
  --base-mix-grey-50: color-mix(in oklab, var(--base-color), grey);
  --border-color: var(--base-mix-grey-50);
}
```

By default, this would be 50% of each color, but you can make either color more or less prominent by adjusting its percentage weight.

```css
html {
  --background-mix-base-80: color-mix(in oklab,
    var(--background-color) 80%,
    var(--base-color));
  --surface-light: var(--background-mix-base-80);
}
```

An alternative to adding more color to an element would be to adjust its chroma channel using the relative color syntax. The border of the text inputs in the contact form have a slightly more colorful border when in focus.

```css
[data-input*="text"] {
  --focus-ring: transparent;
  /* ... */
  &:focus {
    --focus-ring: oklch(from var(--border-color) l calc(c + 0.1) h);
  }
}
```

## Opt in to light and dark modes

Once you have a set of colors to work with, you'll want an efficient way to apply different colors for light and dark modes.

### Signal support for light and dark themes with the `color-scheme` property

You can instantly tell the browser that your site can be viewed in "light", "dark", or both modes with the `color-scheme` property. This property tells the browser in which color schemes an element can be comfortably rendered.

```css
 html {
   color-scheme: light dark;
}
```

<iframe src="https:///frame/articles/baseline-in-action-color-theme/index_ce3e28a5ebafe9facab42afe50f0503ec8b898d37db9104f95258e7ccab40309.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

Setting `color-scheme: light dark` on the `:root` pseudo-element or the `html` element:

- Tells the browser that your page supports being viewed in light or dark mode.
- Changes the default colors of the browser user interface to match the respective operating system setting.

To give user agents earlier notice that your page supports light and dark modes, you can also signal support for color scheme switching by adding a `<meta>` element in the `<head>` of the document.

```html
<head>
  <!-- ... -->
   <meta name="color-scheme" content="light dark">
</head>
```

> [!NOTE]
> **Note:** Read more about `color-scheme` and different color modes in the [media features module](https://web.dev/learn/design/media-features.md.txt#setting_the_color_scheme_for_ui_elements) of [Learn Responsive Design](https://web.dev/learn/design.md.txt).

### Set "light" and "dark" variants with the `light-dark()` function

As an author, you might be used to setting a page's colors with a `prefers-color-scheme` `@media` query.

```css
@media (prefers-color-scheme: light) {
  html {
    --background-color: oklch(95.5% 0 162);
    --text-color: black;
  }
}

@media (prefers-color-scheme: dark) {
  html {
    --background-color: oklch(22.635% 0.01351 291.83);
    --text-color: white;
  }
}
```

This works great for colors and styles controlled by the *author* , but as mentioned in the previous section, you would still need `color-scheme` to update the colors of the browser UI.

Changing the page's colors with a `prefers-color-scheme` query also means some code duplication since you have to define colors for each mode separately.

With `color-scheme` set on the overall page (or specific elements) though, you can use the `light-dark()` function to set colors for each mode in one line of code.

<iframe src="https:///frame/articles/baseline-in-action-color-theme/index_af7a8d4fff2f9da511b7cc9c27bdd838fc825d6bca9d34fe9ad825568c312b92.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

The function accepts two colors. The first is used when the color scheme is set to "light", and the second for when the color scheme is set to "dark".

```css
html {
  color-scheme: light dark;
  /* Color custom property values for both light and dark modes */
  --base-color: light-dark(oklch(43.7% 0.075 224), oklch(89.2% 0.069 224));
  --background-color: light-dark(oklch(95.5% 0 162), oklch(22.635% 0.01351 291.83));
  --accent-color: oklch(from var(--base-color) l c calc(h + 120));
  --active-color: light-dark(var(--action-color-light), var(--action-color-dark));
  /* ... */
}
```

As with any custom property, the `light-dark()` settings for your colors can be set globally or within specific components and then used elsewhere as needed.

```css
/* custom property usage */
body {
  background-color: var(--background-color);
  /* ... */
}

:any-link {
  /* ... */
  text-decoration-color: var(--accent-color);
}
```

## Give users control with built-in theme switcher

It's great to have a theme that adapts to a user's default system or browser color preferences, but you can take it a step further and give viewers of your site the ability to override these default color preferences.

If you build a theme toggle which updates the `data-scheme` attribute on the `<html>` element you can use the same attribute to change the `color-scheme` with CSS.

```css
html {
  color-scheme: light dark;

  &[data-scheme="light"] {
    color-scheme: light;
  }

  &[data-scheme="dark"] {
    color-scheme: dark;
  }

  &[data-scheme="green"] {
      --base-color-light: oklch(48.052% 0.11875 151.945);
      --base-color-dark: oklch(92.124% 0.13356 151.558);
      color-scheme: light dark;
   }
}
```

`data-scheme="light"` and `data-scheme="dark"` show the page only in their respective color modes. `data-scheme="green"` can be viewed in either mode and also changes the `--base-color` to a shade of green, which gives you an entirely new palette since most other colors are based on the `--base-color`.

> [!NOTE]
> **Note:** Read more about toggling themes in the web.dev article "Building a theme switch component"\](/articles/building/a-theme-switch-component) on web.dev

## Register custom properties with `@property`

So far, colors in the demo have been set as standard custom properties. You can also register properties with the `@property` rule to tap into the benefits that come with type checking.

Since the `--base-color` is used as the base of so many of the other colors in the interface, it could be good to make sure it's always a color and has a fallback value.

```css
@property --base-color-light {
  syntax: '<color>';
  inherits: false;
  initial-value: oklch(43.7% 0.075 224);
}

@property --base-color-dark {
  syntax: '<color>';
  inherits: false;
  initial-value: oklch(89.2% 0.069 224);
}

html {
  --base-color: light-dark(var(--base-color-light), var(--base-color-dark));
}
```

This way, if the `--base-color` is inadvertently changed to an invalid value, it would always fallback to its `initial-value` set with the `@property` rule.

<iframe src="https:///frame/articles/baseline-in-action-color-theme/index_bf9288640d1d3bbfb2c4ec7366d0357fd2f4e5cab541aca8e31ab7421389adf4.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

Registering certain properties this way also allows for smoothly animating colors in a `linear-gradient()`.

```css
.main-heading {
  background: linear-gradient(in oklch 90deg, var(--text-color) 50%, oklch(from var(--base-color) l c var(--header-hue)));
  background-clip: text;
  color: transparent;
  animation: header-hue-switch 5s ease-in-out infinite alternate;
}
```

`.main-heading` has a `linear-gradient()` background that's shown through the transparent text with the `background-clip` property.

A portion of the text shows a `hue` that, using the relative color syntax, animates from a channel value of `26.67` to `277`:

```css
@keyframes header-hue-switch {
  from {
    --header-hue: 26.67;
  }

  to {
    --header-hue: 277;
  }
}
```

With a registered `--header-hue` custom property, this animation is able to happen smoothly since the browser knows that this custom property is a number.

```css
@property --header-hue {
  syntax: '<number>';
  inherits: false;
  initial-value: 100;
}
```

With an unregistered custom property, the browser wouldn't know the data type of `--header-hue`, so the transition to a number would be a [discrete animation](https://developer.mozilla.org/docs/Web/CSS/Guides/Animations/Animatable_properties#discrete), which would jump between states without gradual interpolation.

## Wrap up

New Baseline tools can help you quickly build an adjustable color palette and make creating color variables a more efficient process. You'll still have to agonize over the endless color options and combinations yourself, though.

Creating your palette dynamically like this gives you flexibility. If you need to change the base color for branding, you can just update the `--base-color`, and the rest of the theme will flow from that. Or, if you add music playback capabilities, you could decide that you want to dynamically change the base color to match the currently playing song.

## Credits

Theme switcher logic adapted from Adam Argyle's [Theme switch component](https://web.dev/articles/building/a-theme-switch-component.md.txt).
