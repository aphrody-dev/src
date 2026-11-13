---
source_url: https://web.dev/learn/accessibility/structure
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:57+00:00
sha256: df9e716a019562b6f714e7c9c198df784c7d29a601802bdeb52487b02ab6f94c
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
One of the most important aspects of digital accessibility is the underlying
structure of the page. When you build your website or app using
[structural elements](https://www.w3.org/WAI/tutorials/page-structure/) instead
of relying on styles alone, you give critical context to people using assistive
technologies (AT), such as screen readers.

Structural elements serve as an outline of the content on the screen, but they
also act as anchor points to allow for easier navigation within the content.

When you use [semantic HTML elements](https://developer.mozilla.org/docs/Glossary/Semantics#semantics_in_html),
the inherent meaning of each element is passed on to the accessibility tree and
used by the AT, giving more meaning to the content than non-semantic elements.
There may be cases where you need to add additional ARIA attributes to build
relationships or to enhance the overall user experience, but in most
situations, one of the [100+ HTML elements](https://developer.mozilla.org/docs/Web/HTML/Element)
available should work fairly well on its own.

While this module focuses on the most widely used structural elements critical
to digital accessibility, there are certainly additional elements and
environmental factors to consider when building structure into your website or
app. These examples are an introduction to the topic, rather than all-inclusive.

> [!NOTE]
> **Note:** The [Learn HTML course](https://web.dev/learn/html.md.txt) covers the basics of HTML and [semantic structure](https://web.dev/learn/html/semantic-html.md.txt) in great detail. As such, this module builds off of that material and is focused specifically on digital accessibility. Also, be sure to review the [ARIA and HTML module](https://web.dev/learn/accessibility/aria-html.md.txt) in this course.

## Landmarks

Users of AT rely on structural elements to give them information about the
page's overall layout. When sectioning off large regions of content, you can
use either ARIA landmark roles or the newer HTML landmark elements to add
structural context to your page.

Landmarks ensure content is in navigable regions. It's recommended that you
supply at least one landmark per page.

Some resources suggest combining
[ARIA and HTML landmarks](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/landmark_role#best_practices)
together to provide better AT coverage. While this type of redundancy shouldn't
cause issues for your users, test the patterns using a screen reader
to be certain. When in doubt, it's best to default to using only the newer HTML
landmark elements, as the
[browser support](https://stevefaulkner.github.io/HTML5accessibility/) is very
robust.

Let's compare the HTML landmark elements as
[mapped](https://www.a11yproject.com/posts/aria-landmark-roles/) to their
counterpart ARIA landmark roles.

| HTML landmark element | ARIA landmark role |
|---|---|
| [`<header>`](https://developer.mozilla.org/docs/Web/HTML/Element/header) | [banner](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/banner_role) |
| [`<aside>`](https://developer.mozilla.org/docs/Web/HTML/Element/aside) | [complementary](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/complementary_role) |
| [`<footer>`](https://developer.mozilla.org/docs/Web/HTML/Element/footer) | [contentinfo](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/contentinfo_role) |
| [`<nav>`](https://developer.mozilla.org/docs/Web/HTML/Element/nav) | [navigation](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/navigation_role) |
| [`<main>`](https://developer.mozilla.org/docs/Web/HTML/Element/main) | [main](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/main_role) |
| [`<form>`](https://developer.mozilla.org/docs/Web/HTML/Element/form) ^1^ | [form](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/form_role) |
| [`<section>`](https://developer.mozilla.org/docs/Web/HTML/Element/section) ^1^ | [region](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/region_role) |
[^1^ Requires inclusion of the `name` attribute to be accessible. A `section` must be [accessibly-named](https://www.w3.org/WAI/ARIA/apg/practices/names-and-descriptions/#whatareaccessiblenamesanddescriptions?) for its implicit ARIA role of [`region`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/region_role) to be visible to assistive technology.]

Now, compare examples of accessible content structure.
Don't

```html
<div>
    <div>...</div>
</div>

<div>
    <p>Stamp collecting, also known as philately, is
    the study of postage stamps, stamped envelopes,
    postmarks, postcards, and other materials relating
    to postal delivery.</p>
</div>

<div>
<p>© 2022 - Stamps R Awesome</p>
</div>
```
Do

```html
<header>
    <nav>...</nav>
</header>
<main>
    <section aria-label="Introduction to stamp collecting">
    <p>Stamp collecting, also known as philately, is
    the study of postage stamps, stamped envelopes,
    postmarks, postcards, and other materials relating
    to postal delivery.</p>
    </section>
</main>
<footer>
<p>© 2022 - Stamps R Awesome</p>
</footer>
```

> [!NOTE]
> **Note:** Check out the [ARIA Landmarks Example](https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/main.html) for more information and best practices.

## Headings

When implemented correctly,
[HTML heading levels](https://developer.mozilla.org/docs/Web/HTML/Element/Heading_Elements)
form a succinct outline of the overall page content.

There are six heading levels we can use. Heading level one `<h1>` is used for
the page's highest and most important information, moving incrementally to
heading level six `<h6>` for the lowest and least important information.

The sequence of the heading levels is important. Ideally, you won't skip
heading levels, for example, starting a section with an `<h1>` and immediately
following it with an `<h5>`. Instead, you should progress to the `<h5>` in
order. [Heading level order is especially important to AT users](https://youtu.be/vAAzdi1xuUY)
as this is one of their primary ways to navigate through content.

> [!NOTE]
> **Note:** While you can use [ARIA heading roles](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/heading_role) for heading levels, it's recommended you use semantic HTML heading levels whenever possible.

To help you adhere to the proper semantic structure and order for headings,
consider decoupling your CSS styles from the heading levels. This allows you
more flexibility in heading styles while maintaining the heading level order.
It's critical you don't use styles alone to create headings, as these
aren't seen by AT as a heading.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dev-codepen-external/embed/Vwdajpe?height=400&amp;theme-id=auto&amp;default-tab=html%2Ccss%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen Vwdajpe by web-dev-codepen-external on Codepen"></iframe>

When we fake headings, the appropriate structure isn't conveyed to AT users.

Headings are also helpful for people with cognitive and attention deficit
disorders. It's important to make the heading content meaningful to help them
understand what is most important on the page.
Don't

```html
<div>
    <h3>Stamps</h3>
    <p>Stamp collecting, also known as philately, is the study of
  postage stamps, stamped envelopes, postmarks, postcards, and
  other materials relating to postal delivery.</p>
</div>

<div>
    <h3>How do I start a stamp collection?</h3>
  <h2>Equipment you will need</h2>
    <h4>...</h4>
  <h2>How to acquire stamps</h2>
    <h4>...</h4>
  <h2>Organizations you can join</h2>
    <h4>...</h4>
</div>
```
Do

```html
<header>
  <h1>Stamp collecting</h1>
</header>
<main>
    <section aria-label="Introduction to stamp collecting">
        <h2>What is stamp collecting?</h2>
        <p>Stamp collecting, also known as philately, is the study of
    postage stamps, stamped envelopes, postmarks, postcards, and
    other materials relating to postal delivery.</p>
    </section>

    <section aria-label="Start a stamp collection">
        <h2>How do I start a stamp collection?</h2>
    <h3>Required equiment</h3>
    <p>...</p>

    <h3>How to acquire stamps</h3>
    <p>...</p>

    <h3>Organizations you can join</h3>
        <p>...</p>
    </section>
</main>
```

## Lists

[HTML lists](https://www.w3.org/WAI/tutorials/page-structure/content/#lists)
are a way to semantically group items similar to one other giving them inherent
meaning, much like your grocery store list or that never-ending to-do list you
keep ignoring.

There are three types of HTML lists:

- ordered [`<ol>`](https://developer.mozilla.org/docs/Web/HTML/Element/ol)
- unordered [`<ul>`](https://developer.mozilla.org/docs/Web/HTML/Element/ul)
- description [`<dl>`](https://developer.mozilla.org/docs/Web/HTML/Element/dl)

The list item [`<li>`](https://developer.mozilla.org/docs/Web/HTML/Element/li)
element is used to represent an item in an ordered or unordered list, while the
description term
[`<dt>`](https://developer.mozilla.org/docs/Web/HTML/Element/dt) and definition
[`<dd>`](https://developer.mozilla.org/docs/Web/HTML/Element/dd) elements can
be found in the description list.

When programmed correctly, these elements can inform non-sighted AT users about
the visible structure of the list. When an AT encounters a semantic list, it
can tell the user the list name and how many items are in it. As the user
navigates within the list, the AT will read each list item out loud and tell
which number it's in the list---item one of five, item two of five, and so
on.

Grouping items into lists also helps sighted people who have cognitive and
attention disorders and those with reading disabilities, as list content is
typically styled to have more visual whitespace and the content is to the point.
Don't

```html
<div>
  <p>How do I start a stamp collection?</p>
  <p>Equipment you will need</p>
    <div>
      <p>Small tongs with rounded tips</p>
      <p>Stamp hinges</p>
      <p>Stockbook or albumn</p>
      <p>Magnifying glass</p>
      <p>Stamps</p>
    </div>
</div>
```
Do

```html
<div>
  <h1>How do I start a stamp collection?</h1>
  <h2>Equipment you will need</h2>
  <ol>
    <li>Small tongs with rounded tips</li>
    <li>Stamp hinges</li>
    <li>Stockbook or albumn</li>
    <li>Magnifying glass</li>
    <li>Stamps</li>
  </ol>
</div>
```

## Tables

In HTML, tables are generally used for organizing data or page layout.

Depending on the table's purpose, you'll use different semantic structural
elements. Tables can be very complex in structure, but when you stick to the
basic semantic rules, they are fairly accessible without much intervention.

### Layout

In the early days of the internet, layout tables were the primary HTML element
used to build visual structures. Today, we use a mix of semantic and
non-semantic elements such as `<div>`s and landmarks to create layouts.

While the days of creating layout tables are mostly over, there are times when
layout tables are still used, such as in visually rich emails, newsletters, and
advertisements. In these cases, tables used only for layout must not
use structural elements that convey relationships and add context, such as
`<th>` or `<caption>`.

Layout tables must also be hidden from AT users with the ARIA
[presentation role](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/presentation_role)
or [aria-hidden state](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Attributes/aria-hidden).
Don't

```html
<table>
  <caption>My stamp collection</caption>
  <tr>
    <th>[Stamp Image 1]</th>
    <th>[Stamp Image 2]</th>
    <th>[Stamp Image 3]</th>
  </tr>
</table>
```
Do

```html
<table role="presentation">
  <tr>
    <td>[Stamp Image 1]</td>
    <td>[Stamp Image 2]</td>
    <td>[Stamp Image 3]</td>
  </tr>
</table>
```

### Data

Unlike a layout table, which should be hidden from AT users, a
[data table](https://www.w3.org/WAI/tutorials/tables/) and all its elements
must be exposed. The structure of data tables is critical for conveying simple
and complex information to users.

When a table is structured correctly, relationships form between the column
headers and rows and the data within the table. When structured incorrectly,
the user is left to decipher the meaning and context of the information in the
table.

Depending on the complexity of the table, forming relationships through code is
accomplished in different ways. The first step to making a table accessible is
to mark up header cells with
[`<th>`](https://developer.mozilla.org/docs/Web/HTML/Element/th) and data cells
with [`<td>`](https://developer.mozilla.org/docs/Web/HTML/Element/td) elements.

For more complex tables, you may need to use additional HTML table elements
such as
[`<rowgroup>`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Roles/rowgroup_role),
[`<colgroup>`](https://developer.mozilla.org/docs/Web/HTML/Element/colgroup),
[`<caption>`](https://developer.mozilla.org/docs/Web/HTML/Element/caption),
and
[`scope`](https://developer.mozilla.org/docs/Web/HTML/Element/th#attr-scope) to
convey meaning and relationships.
Don't

```html
<table>
  <tr>
    <td>Animal</td>
    <td>Year</td>
    <td>Condition</td>
  </tr>
  <tr>
    <td>Bird</td>
    <td>1947</td>
    <td>Fair</td>
  </tr>
  <tr>
    <td>Lion</td>
    <td>1982</td>
    <td>Good</td>
  </tr>
  <tr>
    <td>Horse</td>
    <td>1978</td>
    <td>Mint</td>
  </tr>
</table>
```
Do

```html
<table>
  <caption>My stamp collection</caption>
  <tr>
    <th>Animal</th>
    <th>Year</th>
    <th>Condition</th>
  </tr>
  <tr>
    <td>Bird</td>
    <td>1947</td>
    <td>Fair</td>
  </tr>
  <tr>
    <td>Lion</td>
    <td>1982</td>
    <td>Good</td>
  </tr>
  <tr>
    <td>Horse</td>
    <td>1978</td>
    <td>Mint</td>
  </tr>
</table>
```
