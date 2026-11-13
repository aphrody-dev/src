---
source_url: https://developer.chrome.com/docs/lighthouse/accessibility/scoring
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:39+00:00
sha256: aa00ff1f380904e36e7410f564368dc72cb7606a2abe15db9c24b541363ba9f3
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
The Lighthouse Accessibility score is a weighted average
of all accessibility audits.
Weighting is based on
[axe user impact assessments](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md).

Each accessibility audit is pass or fail.
Unlike the [Performance audits](https://developer.chrome.com/docs/lighthouse/performance),
a page doesn't get points for partially passing an accessibility audit.
For example, if some buttons on a page have accessible names,
but others don't, the page gets a 0 for the
[**Buttons do not have an accessible name** audit](https://dequeuniversity.com/rules/axe/4.11/button-name).

The following table shows the weighting for each accessibility audit.
More heavily weighted audits have a bigger effect on your score.
Manual audits and low-impact / best-practices audits
aren't included in the table because they don't affect your score.

| Audit | Weight |
|---|---|
| [`[accesskey]` values are unique](https://dequeuniversity.com/rules/axe/4.11/accesskeys) | 7 |
| [`[aria-*]` attributes match their roles](https://dequeuniversity.com/rules/axe/4.11/aria-allowed-attr) | 10 |
| [`button`, `link`, and `menuitem` elements have accessible names](https://dequeuniversity.com/rules/axe/4.11/aria-command-name) | 7 |
| [Elements with `role="dialog"` or `role="alertdialog"` have accessible names](https://dequeuniversity.com/rules/axe/4.11/aria-dialog-name) | 7 |
| [`[aria-hidden="true"]` is not present on the document `<body>`](https://dequeuniversity.com/rules/axe/4.11/aria-hidden-body) | 10 |
| [`[aria-hidden="true"]` elements do not contain focusable descendants](https://dequeuniversity.com/rules/axe/4.11/aria-hidden-focus) | 7 |
| [ARIA input fields have accessible names](https://dequeuniversity.com/rules/axe/4.11/aria-input-field-name) | 7 |
| [ARIA `meter` elements have accessible names](https://dequeuniversity.com/rules/axe/4.11/aria-meter-name) | 7 |
| [ARIA `progressbar` elements have accessible names](https://dequeuniversity.com/rules/axe/4.11/aria-progressbar-name) | 7 |
| [`[role]`s have all required `[aria-*]` attributes](https://dequeuniversity.com/rules/axe/4.11/aria-required-attr) | 10 |
| [Elements with an ARIA `[role]` that require children to contain a specific `[role]` have all required children](https://dequeuniversity.com/rules/axe/4.11/aria-required-children) | 10 |
| [`[role]`s are contained by their required parent element](https://dequeuniversity.com/rules/axe/4.11/aria-required-parent) | 10 |
| [`[role]` values are valid](https://dequeuniversity.com/rules/axe/4.11/aria-roles) | 10 |
| [Elements with the `role=text` attribute don't have focusable descendants](https://dequeuniversity.com/rules/axe/4.11/aria-text) | 7 |
| [ARIA toggle fields have accessible names](https://dequeuniversity.com/rules/axe/4.11/aria-toggle-field-name) | 7 |
| [ARIA `tooltip` elements have accessible names](https://dequeuniversity.com/rules/axe/4.11/aria-tooltip-name) | 7 |
| [ARIA `treeitem` elements have accessible names](https://dequeuniversity.com/rules/axe/4.11/aria-treeitem-name) | 7 |
| [`[aria-*]` attributes have valid values](https://dequeuniversity.com/rules/axe/4.11/aria-valid-attr-value) | 10 |
| [`[aria-*]` attributes are valid and not misspelled](https://dequeuniversity.com/rules/axe/4.11/aria-valid-attr) | 10 |
| [Buttons have an accessible name](https://dequeuniversity.com/rules/axe/4.11/button-name) | 10 |
| [The page contains a heading, skip link, or landmark region](https://dequeuniversity.com/rules/axe/4.11/bypass) | 7 |
| [Background and foreground colors have a sufficient contrast ratio](https://dequeuniversity.com/rules/axe/4.11/color-contrast) | 7 |
| [`<dl>`'s contain only properly-ordered `<dt>` and `<dd>` groups, `<script>`, `<template>` or `<div>` elements](https://dequeuniversity.com/rules/axe/4.11/definition-list) | 7 |
| [Definition list items are wrapped in `<dl>` elements](https://dequeuniversity.com/rules/axe/4.11/dlitem) | 7 |
| [Document has a `<title>` element](https://dequeuniversity.com/rules/axe/4.11/document-title) | 7 |
| [`[id]` attributes on active, focusable elements are unique](https://dequeuniversity.com/rules/axe/4.11/duplicate-id-active) | 7 |
| [ARIA IDs are unique](https://dequeuniversity.com/rules/axe/4.11/duplicate-id-aria) | 10 |
| [No form fields have multiple labels](https://dequeuniversity.com/rules/axe/4.11/form-field-multiple-labels) | 3 |
| [`<frame>` or `<iframe>` elements have a title](https://dequeuniversity.com/rules/axe/4.11/frame-title) | 7 |
| [Heading elements appear in a sequentially-descending order](https://dequeuniversity.com/rules/axe/4.11/heading-order) | 3 |
| [`<html>` element has a `[lang]` attribute](https://dequeuniversity.com/rules/axe/4.11/html-has-lang) | 7 |
| [`<html>` element has a valid value for its `[lang]` attribute](https://dequeuniversity.com/rules/axe/4.11/html-lang-valid) | 7 |
| [`<html>` element has an `[xml:lang]` attribute with the same base languge as the `[lang]` attribute](https://dequeuniversity.com/rules/axe/4.11/html-xml-lang-mismatch) | 3 |
| [Image elements have `[alt]` attributes](https://dequeuniversity.com/rules/axe/4.11/image-alt) | 10 |
| [Input buttons have discernible text](https://dequeuniversity.com/rules/axe/4.11/input-button-name) | 10 |
| [`<input type="image">` elements have `[alt]` text](https://dequeuniversity.com/rules/axe/4.11/input-image-alt) | 10 |
| [Elements with visible text labels have matching accessible names](https://dequeuniversity.com/rules/axe/4.11/label-content-name-mismatch) | 7 |
| [Form elements have associated labels](https://dequeuniversity.com/rules/axe/4.11/label) | 10 |
| [Document should have one main landmark](https://dequeuniversity.com/rules/axe/4.11/landmark-one-main) | 3 |
| [Links are distinguishable without relying on color](https://dequeuniversity.com/rules/axe/4.11/link-in-text-block) | 7 |
| [Links have a discernible name](https://dequeuniversity.com/rules/axe/4.11/link-name) | 7 |
| [Lists contain only `<li>` elements and script supporting elements (`<script>` and `<template>`)](https://dequeuniversity.com/rules/axe/4.11/list) | 7 |
| [List items (`<li>`) are contained within `<ul>`, `<ol>` or `<menu>` parent elements](https://dequeuniversity.com/rules/axe/4.11/listitem) | 7 |
| [The document does not use `<meta http-equiv="refresh">`](https://dequeuniversity.com/rules/axe/4.11/meta-refresh) | 10 |
| [`[user-scalable="no"]` is not used in the `<meta name="viewport">` element and the `[maximum-scale]` attribute is not less than 5](https://dequeuniversity.com/rules/axe/4.11/meta-viewport) | 10 |
| [`<object>` elements have alternate text](https://dequeuniversity.com/rules/axe/4.11/object-alt) | 7 |
| [Select elements have associated label elements](https://dequeuniversity.com/rules/axe/4.11/select-name) | 10 |
| [Skip links are focusable](https://dequeuniversity.com/rules/axe/4.11/skip-link) | 3 |
| [No element has a `[tabindex]` value greater than 0](https://dequeuniversity.com/rules/axe/4.11/tabindex) | 7 |
| [Tables use `<caption>` instead of cells with the `[colspan]` attribute to indicate a caption](https://dequeuniversity.com/rules/axe/4.11/table-fake-caption) | 7 |
| [`<td>` elements in a large `<table>` have one or more table headers](https://dequeuniversity.com/rules/axe/4.11/td-has-header) | 10 |
| [Cells in a `<table>` element that use the `[headers]` attribute refer to table cells within the same table](https://dequeuniversity.com/rules/axe/4.11/td-headers-attr) | 7 |
| [`<th>` elements and elements with `[role="columnheader"/"rowheader"]` have data cells they describe](https://dequeuniversity.com/rules/axe/4.11/th-has-data-cells) | 7 |
| [`[lang]` attributes have a valid value](https://dequeuniversity.com/rules/axe/4.11/valid-lang) | 7 |
| [`<video>` elements contain a `<track>` element with `[kind="captions"]`](https://dequeuniversity.com/rules/axe/4.11/video-caption) | 10 |
