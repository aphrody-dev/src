---
source_url: https://web.dev/learn/css/nesting
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: cd13da4afa25563949a7f10863df93f8497836d7f19499934dc9ad368e671ed5
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Nesting CSS style rules can make your stylesheets more organized, easier to read, and more maintainable.

<iframe src="https:///frame/learn/css/nesting/index_270a955afb1fd49c4a178f60ff3720951297f7df0614628d70d6946718ce5d07.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

## Overview

Now that you've learned about [selectors](https://web.dev/learn/css/selectors.md.txt), you're probably wondering about a way to better organize them in your stylesheets. Imagine you were applying styles to items inside of a "feature" section on your site. With nesting, you can group these styles inside of the `.feature` rule like this:

```css
.feature {
  button {
    color: blue;
  }

  .link {
    color: red;
  }

  .text {
    font-size: 1.3em;
  }
}
```

This would be the same as writing each style separately:

```css
.feature button {
  color: blue;
}

.feature .link {
   color: red;
}

.feature .text {
   font-size: 1.3em;
}
```

Nesting can go as many layers deep as needed.

```css
.feature {
  .heading {
    color: blue;

    a {
      color: green;
    }
  }
}
```

> [!NOTE]
> **Note:** Though there is no limit to how many layers deep styles can be nested, nesting too deeply is considered bad practice and can make maintaining your CSS more difficult and complicated. Consider if it's possible to refactor your styles if you find yourself nesting more than two to three layers deep.

## Grouping and establishing relationships

Nesting lets you more succinctly group and establish relationships between style rules.

The nested rule will by default be related to the outer rule as a [descendant combinator](https://web.dev/learn/css/selectors.md.txt#descendant_combinator). Use selectors on the nested rules to change the relationships.

```css
/* targets headings that are siblings of the .feature element and come immediately after it */
.feature {
  + .heading {
    color: blue;
  }

/* targets all paragraphs that are direct children of the .feature element */
  > p {
    font-size: 1.3em;
  }
}
```

## Define explicit relationships with the `&` selector

You can also use the `&` selector to be more explicit when nesting style rules. Think of `&` as a symbol representing the parent selector.

```css
.feature {
 & button {
    color: blue;
  }
}
```

This would be equivalent to writing the styles like this:

```css
.feature button {
  color: blue;
}
```

## When `&` is required

Without `&`, nested selectors will be descendent selectors of the parent selector. To form [compound selectors](https://web.dev/learn/css/selectors.md.txt#compound_selectors), `&` **is required**.

```css
.feature {
  &:last-child {
    /* Selects the .feature element that is the :last-child, equivalent to .feature:last-child */
  }
   
  & :last-child {
    /* Selects the :last-child inside of a .feature element, equivalent to .feature :last-child */
  }

  &.highlight {
    /* Selects .feature elements that also have a .highlight class, equivalent to .feature.highlight */
  }

  & .highlight {
     /* Selects elements inside of the .feature element with the class .highlight, equivalent to .feature .highlight */
  }
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/ByorvWK?height=400&amp;theme-id=light&amp;default-tab=css%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen ByorvWK by web-dot-dev on Codepen">
</iframe>

You can also change the context and place the `&` selector at the end of the child selector, or on both sides of it.

```css

/* Targets buttons with an adjacent sibling button */
button {
  & + & {
    /* ... */
  }
}
```

```css
img {
  .my-component & {
    /* styles for images inside of `.my-component` ... */
  }
}
```

In the last example, we are adding styles for images inside of an element with the `.my-component` class. This can be useful if you are working on a project where you can't add a `class` or an `id` to an element.

## Nesting and specificity

Like [`:is()`](https://web.dev/learn/css/pseudo-classes.md.txt#is), the nesting selector takes the specificity of the selector with the highest specificity in the parent's selector list.

```css
#main-header,
.intro {
  & a {
    color: green;
  }
}

.intro a {
  color: blue;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/MYaVZmr?height=400&amp;theme-id=light&amp;default-tab=css%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen MYaVZmr by web-dot-dev on Codepen">
</iframe>

The first rule targets all of the links inside of the `#main-header` and `.intro` elements, giving them a green color.

The second rule attempts to override this to make links inside of the `.intro` element blue.

We can see why this doesn't work if we look at the specificity of each rule.

```css
/* equivalent to :is(#main-header, .intro) a with a specificity of (1, 0, 1) */
#main-header,
.intro {
  & a {
    color: green;
  }
}

/* lower specificity of (0, 1, 1) */
.intro a {
  color: blue;
}
```

Since the first rule has an `id` in its selector list, and nested rules take the specificity of the selector with the highest specificity, it has a higher specificity than the second rule. The links are green even for `a` elements that are not inside an element with the `#main-header` selector.

## Invalid Nesting

Similar to `:is()`, the nesting selector cannot represent pseudo elements.

```css
blockquote, blockquote::before, blockquote::after {
  color: navy;

  & {
    border: 1px solid navy;
  }
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/VYvXqbJ?height=400&amp;theme-id=light&amp;default-tab=css%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen VYvXqbJ by web-dot-dev on Codepen">
</iframe>

You would expect the `blockquote` and its pseudo-elements to both have `navy` colored text and borders, but that's not the case. Since the `&` selector can't represent pseudo-elements, the nested border styles will only apply to the blockquote.

When making compound selectors using `&` and type selectors, the type selector must go first without any whitespace between.

```css
/* valid css nesting */
.feature {
  p& {
    font-weight: bold;
  }
}

/* invalid css nesting */
.feature {
  &p {
    font-weight: bold;
  }
}
```

This rule allows CSS nesting to work alongside pre-processing tools like Sass. In Sass, writing `&p` would append the parent selector to the nested type selector and the result would be `.featurep`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/XJmEogY?height=400&amp;theme-id=light&amp;default-tab=css%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen XJmEogY by web-dot-dev on Codepen">
</iframe>

## Nesting at-rules

CSS conditional group rules like `@container`, `@media`, `@supports`, and `@layer` can also be nested.

```css
.feature {
  @media (min-width: 40em) {
    /* ... */
  }

  @container (inline-size > 900px) {
    /* ... */
  }
}

.feature {
  @supports (display: grid) {
    /* ... */
  }
}

.feature {
  @layer component {
    h2 {
      /* ... */
    }
  }
}
```

### Check your understanding

When using CSS Nesting, what does the `&` selector represent?
The nested child selector Incorrect. The parent selector Correct! the nearest sibling selector Incorrect. You can only nest two levels deep.
True Incorrect. False Correct! Which at-rules can be nested?
`@media` Correct! `@container` Correct! `@import` Incorrect. `@supports` Correct! `@layer` Correct!
