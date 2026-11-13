---
source_url: https://web.dev/learn/css/specificity
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:53+00:00
sha256: adfe13c8e8a6f3c03041826c8529a2e8b1ef35fdd60e2743294e3dcb433cf89a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

##### [The CSS Podcast - 003: Specificity](https://thecsspodcast.libsyn.com/003-specificity)

Suppose that you're working with the following HTML and CSS:

```html
<button class="branding">Hello, Specificity!</button>
```

```css
.branding {
  color: blue;
}

button {
  color: red;
}
```

There's two rules that target the same element here.
Each rule contains a declaration that wants to set the color of the button:
one tries to color the button red and the other tries to color it blue.
Which declaration gets applied to the element?

Understanding the CSS specificity algorithm is the key to understanding how CSS decides between competing declarations.

Specificity is one of the distinct stages of the cascade,
which was covered in the last module, on [the cascade](https://web.dev/learn/css/the-cascade.md.txt).
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/YzNKMXm?height=200&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen YzNKMXm by web-dot-dev on Codepen"></iframe>

## Specificity scoring

Each selector rule within an [origin](https://web.dev/learn/css/the-cascade.md.txt#origin) gets a scoring.
You can think of specificity as a total score and each selector type earns points towards that score.
Declarations from rules with the highest specificity win.

With specificity in a real project,
the balancing act is making sure the CSS rules you expect to apply, actually _do apply,_
while generally keeping scores low to prevent complexity.
The specificity should only be as high as we need it to be,
rather than aiming for the highest specificity possible.
In the future, some genuinely more important CSS might need to be applied.
If you go for the highest specificity, you'll make that job hard.

The specificity is not a decimal number but a triad
that consists of three components: `A`, `B`, and `C`.

- `A`: id-like specificity
- `B`: class-like specificity
- `C`: element-like specificity

It is often represented using the `(A,B,C)` notation. For example: `(1,0,2)`.
The alternative `A-B-C` notation is also commonly used.
A diagram demonstrating what component of specificity various selectors affect.

## How to compare specificities

Specificities are compared by comparing the three components in order:
the specificity with a larger A value is more specific;
if the two A values are tied, then the specificity with a larger B value is more specific;
if the two B values are also tied, then the specificity with a larger C value is more specific;
if all the values are tied, the two specificities are equal.

For example, `(1,0,0)` is considered a higher specificity than `(0,4,3)`
because the `A` value in `(1,0,0)` (which is `1`)
is greater than the `A` value from `(0,4,3)` (which is `0`).

## Selectors influence specificity

Each part in the specificity triad starts with a value of `0`,
so the default specificity is `(0,0,0)`.
Each part of a selector increases the specificity that, depending on the type of selector,
increment the value of either `A`, `B`, or `C`.

### Universal selector

A [universal selector](https://developer.mozilla.org/docs/Web/CSS/Universal_selectors) (`*`)
adds **no specificity** , leaving its value at the initial specificity of `(0,0,0)`.

```css
* {
  color: red;
}
```

### Element or pseudo-element selector

An [element](https://developer.mozilla.org/docs/Web/CSS/Type_selectors) (type)
or [pseudo-element](https://developer.mozilla.org/docs/Web/CSS/Pseudo-elements)
selector adds **element-like specificity** which increments the `C` component by `1`.

The following examples have an overall specificity of `(0,0,1)`.

#### Type selector

```css
div {
  color: red;
}
```

#### Pseudo-element selector

```css
::selection {
  color: red;
}
```

### Class, pseudo-class, or attribute selector

A [class](https://developer.mozilla.org/docs/Web/CSS/Class_selectors),
[pseudo-class](https://developer.mozilla.org/docs/Web/CSS/Pseudo-classes) or
[attribute](https://developer.mozilla.org/docs/Web/CSS/Attribute_selectors) selector adds **class-like specificity**
which increments the `B` component by `1`.

The following examples have a specificity of `(0,1,0)`.

#### Class selector

```css
.my-class {
  color: red;
}
```

#### Pseudo-class selector

```css
:hover {
  color: red;
}
```

#### Attribute selector

```css
[href="#"] {
  color: red;
}
```

### ID selector

An [ID](https://developer.mozilla.org/docs/Web/CSS/ID_selectors)
selector adds **id-like specificity** which increments the `A` component by 1,
as long as you use an ID selector (`#myID`) and not an attribute selector (`[id="myID"]`).

In the following example, the specificity is `(1,0,0)`

```css
#myID {
  color: red;
}
```

### Other selectors

CSS has many selectors. Not all of them add specificity.
For example, the [`:not()`](https://developer.mozilla.org/docs/Web/CSS/:not) pseudo-class
itself adds nothing to the specificity calculation.

The specificity of the `:not()` pseudo-class is replaced by the specificity of the
most specific selector in its comma-separated argument of selectors; providing
the same specificity as if it had been written `:not(:is(argument))`.

```css
div:not(.my-class) {
  color: red;
}
```

The [`:is()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:is) pseudo-class
also does not itself add to the specificity calculation. Like `:not()`, it takes
the specificity of its most specific argument.

```css
:is(h1, h2, h3) {
  color: blue;
}
```

This sample has a specificity of `(0,0,1)` because it has only one kind of
selector (`type`).

With the addition of an `id`, the specificity increases to `(1,0,0)`.

```css
:is(h1, h2, h3, #my-heading) {
  color: blue;
}
```

The [`:where()`](https://developer.mozilla.org/docs/Web/CSS/:where) pseudo-class
is different. No matter the specificity of any of its arguments, it always has a
specificity of `(0,0,0)`.

```css
:where(h1, h2, h3, #my-heading) {
  color: blue;
}
```

The low specificity styles applied using `:where()` allow you to override these
styles with basic selectors later in your style sheet:

```css
:where(#my-content) {
  color: red;
}

p {
  color: blue;
}
```

Even though `:where()` has an `id` in its arguments list, it still only has a
specificity of `(0, 0, 0)`, so the basic `p` selector overrides it and the text
will be `blue`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/ZYGyBgJ?height=200&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title=":where Pen by web-dot-dev on Codepen"></iframe>

### Check your understanding

Test your knowledge of specificity scoring
What is the specificity of `a[href="#"]`?
`(0,0,1)` The `a` is worth `(0,0,1)`, but the `[href="#"]` is worth `(0,1,0)`. `(0,1,0)` Try again! The `a` is worth `(0,0,1)`, but the `[href="#"]` is worth `(0,1,0)`. `(0,1,1)` The `a` is worth `(0,0,1)` and the `[href="#"]` is worth `(0,1,0)`, making a total specificity of **`(0,1,1)`**.

## Factors that don't affect specificity

There are some common misconceptions about the following factors affecting specificity.

### Inline style attributes

CSS applied directly to the `style` attribute of an element,
does not affect specificity as it's a different step in [the cascade](https://web.dev/learn/css/the-cascade.md.txt)
that is evaluated before specificity.

```html
<div style="color: red"></div>
```

In order to override this declaration from within a style sheet,
you have to resort to get the declaration win in an earlier step of [the cascade](https://web.dev/learn/css/the-cascade.md.txt).

For example, you could add `!important` to it,
so that it becomes part of [the Authored `!important` origin](https://web.dev/learn/css/the-cascade.md.txt#origin).

### `!important` declarations

An `!important` at the end of a CSS declaration does not affect specificity
but puts the declaration in a different [origin](https://web.dev/learn/css/the-cascade.md.txt#origin),
namely _Authored `!important`_.

In the following example, the specificity of `.my-class` is not relevant for the
`!important` declaration to win.

```css
.my-class {
  color: red !important;
  color: white;
}
```

When two declarations are `!important`, then the specificity comes in play again,
as the origin step from the cascade was not able to determine the winner yet.

```css
.branding {
  color: blue !important;
}

button {
  color: red !important;
}
```

## Specificity in context

When a complex or compound selector is used, each part of that selector
adds up to the specificity.
Consider this example HTML:

```html
<a class="my-class another-class" href="#">A link</a>
```

This link has two classes on it.
The rule in the following CSS has **a specificity of `(0,0,1)`**:

```css
a {
  color: red;
}
```

If you reference one of the classes in the selector,
it now has **a specificity of `(0,1,1)`**:

```css
a.my-class {
  color: green;
}
```

Add the other class to the selector,
it now has **a specificity of `(0,2,1)`**:

```css
a.my-class.another-class {
  color: rebeccapurple;
}
```

Add the `href` attribute to the selector,
it now has **a specificity of `(0,3,1)`**:

```css
a.my-class.another-class[href] {
  color: goldenrod;
}
```

Finally,add a `:hover` pseudo-class to all of that,
the selector ends up with **a specificity of `(0,4,1)`**:

```css
a.my-class.another-class[href]:hover {
  color: lightgrey;
}
```

### Check your understanding

Test your knowledge of specificity scoring
Which of the following selectors has a specificity of **`(0,2,1)`**?
`article > section` Elements add element-like specificity (\`C\` component). There are 2 elements in the selector, making this have a specificity of **`(0,0,2)`**. `article.card.dark` Elements add element-like specificity (\`C\` component) and classes add class-like specificity (\`B\` component). With 2 classes and 1 element, that makes this selector have a specificity of **`(0,2,1)`**. `article:hover a[href]` Elements add element-like specificity (\`C\` component), pseudo-classes and attributes add class-like specificity (\`B\` component). There are 2 element selectors (2 × `(0,0,1)`), an attribute selector (worth `(0,1,0)`), and a class selector (worth `(0,1,0)`). This makes this selector have a total specificity of **`(0,2,2)`**.

## Pragmatically increasing specificity

Say you have some CSS that looks like this:

```css
.my-button {
  background: blue;
}

button[onclick] {
  background: grey;
}
```

With HTML that looks like this:

```html
<button class="my-button" onclick="alert('hello')">Click me</button>
```

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/abpoxdR?height=500&amp;theme-id=light&amp;default-tab=css%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen abpoxdR by web-dot-dev on Codepen"></iframe>

The button has a grey background,
because the second selector has **a specificity of `(0,1,1)`** .
This is because it has one type selector (`button`),
which is **`(0,0,1)`** and an attribute selector (`[onclick]`), which is **`(0,1,0)`**.

The previous rule---`.my-button`---equals **`(0,1,0)`**
because it has one class selector, which is a lower specificity than `(0,1,1)`.

If you want to give this rule a boost,
you can repeat the class selector like this:

```css
.my-button.my-button {
  background: blue;
}

button[onclick] {
  background: grey;
}
```

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/zYNOXBJ?height=500&amp;theme-id=light&amp;default-tab=css%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen zYNOXBJ by web-dot-dev on Codepen"></iframe>

Now, the button will have a blue background,
because the new selector gets a specificity **`(0,2,0)`**

> [!CAUTION]
> **Caution:** If you find that you are needing to boost specificity like this frequently, it may indicate that you are writing overly specific selectors. Consider whether you can refactor your CSS to reduce the specificity of other selectors to avoid this problem.

## A tie in specificity falls back to the next step in the cascade

Continuing with the button example for now, switch the CSS around to this:

```css
.my-button {
  background: blue;
}

[onclick] {
  background: grey;
}
```

The button has a grey background,
because **both selectors have an identical specificity** of `(0,1,0)`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/zYNOXKJ?height=500&amp;theme-id=light&amp;default-tab=css%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen zYNOXKJ by web-dot-dev on Codepen"></iframe>

If you switch the rules in the source order,
the button would then be blue.

```css
[onclick] {
  background: grey;
}

.my-button {
  background: blue;
}
```

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/WNReWRO?height=500&amp;theme-id=light&amp;default-tab=css%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen WNReWRO by web-dot-dev on Codepen"></iframe>

This is because both selectors have the same specificity.
In this case, the cascade falls back to [the order of appearance step](https://web.dev/learn/css/the-cascade.md.txt#position_and_order_of_appearance).

## Resources

- [CSS SpeciFISHity](http://specifishity.com)
- [Specificity Calculator](https://specificity.keegan.st)
- [MDN Specificity](https://developer.mozilla.org/docs/Web/CSS/Specificity)
- [Specifics on CSS Specificity](https://css-tricks.com/specifics-on-css-specificity/)
- [Another Specificity Calculator](https://polypane.app/css-specificity-calculator)
