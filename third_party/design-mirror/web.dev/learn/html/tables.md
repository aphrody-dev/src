---
source_url: https://web.dev/learn/html/tables
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:49+00:00
sha256: cf1896442a43077cbf8c5e83ffb4599d72c292a83ece0076337779ebe7a2e1a2
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

HTML tables display tabular data with rows and columns. You should choose to
use a `<table>` based on the content you're displaying and your users'
needs relative to that content. If data is being presented, compared, sorted,
calculated, or cross-referenced, then `<table>` is probably the right choice.
If you're interested in organizing content that's non-tabular, such as
such as a large group of thumbnail images, tables aren't appropriate. Instead,
[create a list](https://web.dev/learn/html/lists.md.txt) of images and style the
[grid with CSS](https://web.dev/learn/css/grid.md.txt).

In this section, we discuss all the elements that make up the table, along with
some accessibility and usability features to consider when presenting tabular
data. While Learn HTML isn't focused on CSS, we will cover some table-specific
CSS properties. For more on CSS, take [Learn CSS](https://web.dev/learn/css.md.txt).

## Table elements, in order

The [`<table>`](https://developer.mozilla.org/docs/Web/HTML/Element/table) tag
wraps the table content, including all the table elements.
The implicit ARIA role of a `<table>` is `table`; assistive technologies know this element is a table structure containing data arranged in
rows and columns. If the table maintains a selection state, has two-dimensional navigation, or allows the user to rearrange cell order, set [`role="grid"`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/grid_role).
If the rows of the `grid` can be expanded and collapsed, use [`role="treegrid"`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/treegrid_role) instead.

Inside the `<table>`, you'll find the table headers (`<thead>`), table bodies (`<tbody>`), and, optionally, table footers (`<tfoot>`).
Each of these is made up of table rows (`<tr>`). Rows contain table header (`<th>`) and table data (`<td>`) cells which, in turn, contain all the data.
In the DOM, before any of this, you may find two additional features: the table caption (`<caption>`) and column groups (`<colgroup>`). Depending
on whether or not the `<colgroup>` has a `span` attribute, it may contain nested table column (`<col>`) elements.

The table's children are, in order:

1. [`<caption>`](https://developer.mozilla.org/docs/Web/HTML/Element/caption) element
2. [`<colgroup>`](https://developer.mozilla.org/docs/Web/HTML/Element/colgroup) elements
3. [`<thead>`](https://developer.mozilla.org/docs/Web/HTML/Element/thead) elements
4. [`<tbody>`](https://developer.mozilla.org/docs/Web/HTML/Element/tbody) elements
5. [`<tfoot>`](https://developer.mozilla.org/docs/Web/HTML/Element/tfoot) elements

We'll cover the `<table>` elements' children, which are all optional but recommended, then take a look at rows, table header cells,
and table data cells. The `<colgroup>` will be covered last.

### Table caption

The preferred method of naming a table is the semantic element,
[`<caption>`](https://developer.mozilla.org/docs/Web/HTML/Element/table).
The `<caption>` provides a descriptive, programmatically associated table title.
It's visible and available to all users by default.

The `<caption>` element should be the first element nested in the `<table>` element. Including it lets all users know the
purpose of the table immediately without having to read the surrounding text. Alternatively, you can use `aria-label` or `aria-labelledby`
on the `<table>` to provide an accessible name as the caption. The `<caption>` element has no element-specific attributes.

The caption appears outside the table. The location of the caption can be set with the CSS [`caption-side`](https://developer.mozilla.org/docs/Web/CSS/caption-side) property, which is a
better practice than using the deprecated `align` attribute. This can set the caption to the top and bottom. The left and right
side positioning, with `inline-start` and `inline-end`, aren't yet fully supported. Top is the default browser presentation.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/yLEZRyW?height=300&amp;theme-id=dark&amp;default-tab=html%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

Preferably, data tables should have clear headers and a caption, and be clear enough to be almost self-explanatory. Bear in mind that
not all users have the same cognitive abilities. When the table is "making a point", or otherwise needs interpretation, provide a
brief summary of the main point or function of the table. Where that summary is placed depends on its length and complexity.
If brief, use it as the inner text of the caption. If longer, summarize it in the caption, and provide the summary in the
paragraph preceding the table, associating the two with the [`aria-describedby`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Attributes/aria-describedby)
attribute. Putting the table in a `<figure>` and putting the summary in the `<figcaption>` is another option.

### Data sectioning

The content of tables is made up of up to three sections: zero or more table headers (`<thead>`) , table bodies (`<tbody>`),
and table footers (`<tfoot>`). All are optional, with zero or more of each being supported.

These elements don't help or hinder the accessibility of the table, but they are useful in terms of usability. They provide
styling hooks. For example, the [header contents can be made sticky](https://adrianroselli.com/2020/01/fixed-table-headers.html),
while the `<tbody>` contents can be made to scroll. Rows not nested in one of these three containing elements are implicitly
wrapped in a `<tbody>`. All three share the same implicit role [`rowgroup`](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Roles/Rowgroup_Role).
None of these three elements has any element-specific attributes.

What we have so far:

```html
<table>
  <caption>
    MLW Students
  </caption>
  <thead></thead>
  <tbody></tbody>
  <tfoot></tfoot>
</table>
```

The `<tfoot>` element was originally specified to come right after the `<thead>` and before the `<tbody>` for accessibility reasons,
which is why you may come across this non-intuitive source order in legacy codebases.

### Table content

Tables can be divided into table headers, bodies, and footers, but none of these really does anything if the tables don't
contain table rows, cells, and content. Each table row, `<tr>` contains one or more cells. If a cell is a header cell, use `<th>`.
Otherwise, use `<td>`.

User-agent stylesheets generally display the content in a `<th>` table header cell as centered and bold. These default styles,
and all styling, are best controlled with CSS instead of the deprecated attributes that used to be available on individual cells,
rows, and even the `<table>`.

There were attributes to add padding between cells and within cells, for borders, and for text alignment. Cellpadding and cellspacing,
which define the space between the content of a cell and its border, and between the borders of adjacent cells, should be set
with the CSS [border-collapse](https://developer.mozilla.org/docs/Web/CSS/border-collapse) and [border-spacing](https://developer.mozilla.org/docs/Web/CSS/border-spacing)
properties, respectively. `Border-spacing` will have no effect if `border-collapse: collapse` is set. If `border-collapse: separate;`
is set, it's possible to hide empty cells completely with `empty-cells: hide;`. To learn more about styling tables, here's an
interactive slidedeck of [table-related CSS styles](https://estelle.github.io/CSS/tables/#slide1).

In the examples, we've added a border on the table and each individual cell with CSS to make some features more apparent:
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/oNymmWw?height=300&amp;theme-id=dark&amp;default-tab=html%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

In this example, we have a caption, a table header, and a table body. The header has one row containing three header `<th>` cells,
thereby creating three columns. The body contains three rows of data: the first cell is a header cell for the row, so we use `<th>` instead of `<td>`.

The `<th>` cell has semantic meaning, with implicit ARIA roles of [columnheader](https://w3c.github.io/aria/#columnheader)
or [rowheader](https://w3c.github.io/aria/#rowheader). It defines the cell as the header for the column or row of table cells,
depending on the value of the enumerated `scope` attribute. The browser will default to `col` or `row` if `scope` is not explicitly set.
Because we have used semantic markup, the `1956` cell has two headers: Year and Lou Minious. This association tells us that "1956" is the
"year" of graduation for "Lou Minious". In this example, as we can see the entire table, the association is visually apparent.
Using `<th>` provides the association even when the header column or row has scrolled out of view. We could have explicitly set
`<th scope="col">Year</th>` and `<th scope="row">Lou Minious</th>` but with a table like this, the enumerated default values work.
Other values for `scope` include `rowgroup` and `colgroup`, which are useful with complex tables.

## Merge cells

Similar to MS Excel, Google Sheets, and Numbers, it's possible to join
multiple cells into a single cell. This can be done with the HTML `colspan`
and `rowspan` attributes:

- `colspan` merges two or more adjacent cells within a single row.
- `rowspan` merges cells across rows when added to the cell in the first of your merged rows.

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/GRGzzEd?height=300&amp;theme-id=dark&amp;default-tab=html%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

In this example, the table header contains two rows. The first header row contains three cells spanning four columns: the middle cell
has `colspan="2"`. This merges two adjacent cells. The first and last cells include `rowspan="2"`. This merges the cell with the cell
in the adjacent row, immediately beneath it.

The second row in the table header contains two cells; these are the cells for the second and third columns in the second row.
No cell is declared for the first or last column as the cell in the first and last columns in the first row span two rows.

In cases where a cell is defined by multiple header cells with associations that cannot be set by the `scope` attributes alone,
include the `headers` attribute with a space-separated list of the associated headers. As this example is a more complex table, we explicitly define
the scope of the headers with the `scope` attribute. To be even clearer, we added the `headers` attribute to each cell.

The `headers` attributes may not have been necessary in this case, but they're important to remember as
your tables grow in complexity. Tables with complex structures, such as tables where headers or cells are merged or with more
than two levels of column or row headers, require explicit identification of associated header cells. In such complex tables, explicitly
associate each data cell with each corresponding header cell with a list of space-separated `id` values of all the associated headers
as the value of the `headers` attribute.

The `headers` attribute is more commonly found on `<td>` elements, but is also valid on `<th>`.

That said, complex table structures can be difficult for all users,
not just screen reader users, to understand. Cognitively
and in terms of screen reader support, simpler tables, with few to no spanned cells, even without adding scope and headers, are better understood.
They're also easier to manage!

## Style tables

There are two relatively obscure elements that were briefly mentioned: the column group, [`<colgroup>`](https://developer.mozilla.org/docs/Web/HTML/Element/colgroup), element
and its only descendant, the empty [`<col>`](https://developer.mozilla.org/docs/Web/HTML/Element/col) column element. The
`<colgroup>` element is used to define groups of columns, or `<col>` elements, within a table.

If used, the column grouping should be nested in the `<table>`,
immediately after the `<caption>` and before any table data.
If they span more than one column, use the `span` attribute.

The content outline order for a table is generally as follows, with `<table>` and `<caption>` being the two elements that
should be included:

```html
<table>
  <caption>
    Table Caption
  </caption>
  <colgroup>
    <col />
  </colgroup>
  <thead>
    ...
  </thead>
</table>
```

`<colgroup>` and `<col>` have no [semantic meaning](https://web.dev/learn/accessibility/structure.md.txt),
which would impact table accessibility. However, they do help you style columns
with CSS, such as setting widths.

`<td>` and `<th>` related styles override `<col>` styles. In CodePen, we set
the `colspan` to merge some rows of the table, but not all. If the
[`nth-child`](https://developer.mozilla.org/docs/Web/CSS/Reference/Selectors/:nth-child)
CSS selector is applied to `<tr>`, depending on what row or column was merged,
this could impact the style.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/emdJJjQ?height=300&amp;theme-id=dark&amp;default-tab=html%2Cresult&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

In this case, \`tr \> \*:nth-child(2)\` impacts the second child of every row. Is this the outcome you expected?

Unfortunately, only a few properties are supported. Styles aren't inherited into
the cells, and the only way to target cells with `<col>` is by using a
complex selector, such as the
[`:has()` relational selector](https://developer.mozilla.org/docs/Web/CSS/:has).

If both the `<table>` and the `<colgroup>` have a background color, the
`background-color` of the `<colgroup>` is on top. The order of drawing is:
table, column groups, columns, rowgroups, rows, with cells last and on top, as
shown in the [schema of table layers](https://w3c.github.io/csswg-drafts/css2/#table-layers).
The `<td>` and `<th>` elements aren't descendants of `<colgroup>` or `<col>`
elements, and don't inherit their styling.

To stripe a table, CSS structural selectors come in handy. For example,
`tbody tr:nth-of-type(odd) {background-color: rgba(0 0 0 / 0.1);}`
adds a translucent black to each odd row in the body of the table, while allowing
background effects set on `<colgroup>` show through.

Tables aren't responsive by default. Rather, they are sized according to their
content by default. Extra measures are needed to get table
layout styling to effectively work across a variety of devices. If you are
[changing the CSS display property for table elements](https://adrianroselli.com/2018/02/tables-css-display-properties-and-aria.html),
include ARIA `role` attributes. While that may sound redundant, the CSS
`display` property can affect the accessibility tree in some browsers.

## Present data

Table elements have semantic meanings that are used by assistive technologies to
help users navigate through the rows and columns, without getting lost. The
`<table>` element shouldn't be used for presentation. If you need a heading over
a list, use a [header](https://web.dev/learn/html/headings-and-sections.md.txt#headings_h1-h6)
and a [list](https://web.dev/learn/html/lists.md.txt). If you want to lay out content in many columns,
use [multi-column layout](https://developer.mozilla.org/docs/Web/CSS/CSS_Columns).
If you want to lay out content in a grid, use [CSS grid](https://web.dev/learn/css/grid.md.txt).

Only use a table for data.

Think of it this way: if your data requires a spreadsheet in order to be
presented at a meeting, use `<table>`. If you want to use the features available
in presentation software, such as Google Slides or PowerPoint, you probably need
a [description list](https://web.dev/learn/html/lists.md.txt).

In short: if you're not presenting tabular data, don't use a `<table>`.
If you use a table for presentation, set `role="none"`.

Many developers use tables to lay out forms, but it's unnecessary. You do
need to know about [HTML forms](https://web.dev/learn/html/forms.md.txt).

### Check your understanding

Test your knowledge of tables.
Which element is used to mark up cells that are headings?
`<header>` Try again. `<caption>` Try again. `<th>` Correct! Which information is likely to be suitable for layout with a table?
Some scientific terms and their description. Try again, this is better suited to a `<dl>`. A spreadsheet of information detailing students and their grades over 3 semesters. Correct! Ingredients for a recipe. Try again, this is better suited to a `<ul>`.
