---
source_url: https://web.dev/articles/semantics-and-screen-readers
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:33+00:00
sha256: 11ac53598cbb0b63628fade9d667320557b1a64dd7df655fc60a281767291e78
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Rob Dodson [X](https://twitter.com/rob_dodson) [GitHub](https://github.com/robdodson) [Homepage](https://robdodson.me)

Have you ever stopped to wonder *how* assistive technology, such as a screen
reader, knows what to announce to users? The answer is that these technologies
rely on developers marking up their pages with **semantic** HTML. But what are
semantics, and how do screen readers use them?

## Affordances and semantics

Before diving into semantics, it's helpful to understand affordances. An
*affordance* is any object that offers its user the opportunity to perform an
action. A classic example is the teapot:
 A teapot's handle is a natural affordance.

This teapot doesn't need an instruction manual. Instead, its physical design
conveys to the user how it should be operated. It has a handle, and because
you've seen other objects in the world with similar handles, you can infer how
you should pick it up and operate it.

When we build graphical user interfaces, we use CSS to add
**visual affordances** to our interface. For example, you might give a button
a drop shadow and border so that it resembles an actual button in the real world.

But for users who are unable to see the screen, these visual affordances aren't
conveyed to them. Therefore, you need to make sure that your interface is
constructed in a way that can convey these same affordances to assistive
technology. This non-visual exposure of a UI element's affordances is called
its *semantics*.

## Write semantic HTML

The easiest way of conveying proper semantics is to use semantically rich HTML
elements.

Using CSS, it's possible to style the `<div>` and `<button>` elements so they
convey the same visual affordances, but the two experiences are very different
when using a screen reader. A `<div>` is just a generic grouping element,
so a screen reader only announces the text content of the `<div>`.
The `<button>` is announced as a "button," a much stronger signal to the user
that it's something they can interact with.

Often, the best solution to this problem is to avoid custom interactive controls
altogether. For example, replace a `<div>` that's acting like a button
with an actual `<button>`.

## Semantic properties and the accessibility tree

Generally speaking, every HTML element will have some of the following semantic
properties:

- A **role** or type
- A **name**
- A **value** (optional)
- A **state** (optional)

An element's **role** describes its type, for example, "button," "input," or
even just "group" for things like `div` and `span` elements.

An element's **name** is its computed label. Screen readers typically announce
an element's name followed by its role, such as "Sign up, button." The algorithm
that determines an element's name factors in things like if there is any text
content inside the element, whether or not it has attributes such as `title`
or `placeholder`, whether or not the element is associated with an actual
`<label>` element, and if the element has any ARIA attributes such as
`aria-label` and `aria-labelledby`.

Some elements *may* have a **value** . For example, `<input type="text">` may
have a value that reflects whatever the user has typed into the text field.

Some elements *may* also have a **state** , which conveys their current status.
For example, a `<select>` element can be in either an *expanded* or a
*collapsed* state, depending on if it's open or closed.

### The accessibility tree

For each node in the DOM, the browser determines if the
node is semantically "interesting" and adds it to [the accessibility
tree](https://web.dev/articles/the-accessibility-tree).
When assistive technology, like a screen reader, is providing an alternative UI
to the user, it is often doing so by walking this accessibility tree.

> [!NOTE]
> **Note:** Browsers often remove semantically uninteresting nodes, such as `<div>` and `<span>`, from the accessibility tree, especially if they're just being used to position their children with CSS. For example, if you have a `<button>` nested inside of 5 `<div>` elements, the browser may remove some of the `<div>` elements in the middle to reduce noise.

With Chrome DevTools, you can [inspect an element's semantic
properties](https://developer.chrome.com/docs/devtools/accessibility/reference#pane)
and explore its position in the accessibility tree.

## Next steps

Once you know a bit about semantics and how they aid screen reader navigation,
you can't help but look at the pages you build differently. In the next section,
we'll take a step back and consider how the entire outline of a page can be
conveyed using effective [headings and landmarks](https://web.dev/articles/headings-and-landmarks.md.txt).
