---
source_url: https://web.dev/learn/accessibility/forms
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:39+00:00
sha256: 3337750ad1e7f3b93ee5404a6c5ed5665f6458b13717f38341a8e9a7673ece1a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

A form is an element that allows a user to provide data into a field or a group
of fields. Forms can be a single field or a complex, multi-step form with
multiple fields per page, input validation, and a CAPTCHA.

Forms are considered one of the most difficult elements to get right from an
accessibility perspective, as they require knowledge of all the elements we
have already covered, as well as additional rules specific just to forms. With
some understanding and time, you can make an accessible form to suit you and
your users.

Forms are the last component-specific module in this course. This module
focuses on form-specific guidelines, however, the previous guidelines found in
earlier modules, such as [content structure](https://web.dev/learn/accessibility/structure.md.txt),
[keyboard focus](https://web.dev/learn/accessibility/focus.md.txt), and
[color contrast](https://web.dev/learn/accessibility/color-contrast.md.txt), also apply to form
elements.

> [!NOTE]
> **Note:** Review the [Learn Forms](https://web.dev/learn/forms.md.txt) to learn additional, form-specific best practices. There is a [form accessibility](https://web.dev/learn/forms/accessibility.md.txt) module in that course, with additional accessibility-specific form content.

## Fields

The backbone of forms is fields. Fields are small interactive patterns, such as
an input or radio button element, that allow users to enter content or make a
choice. There is a [wide variety of form fields](https://web.dev/learn/forms/fields.md.txt) to
choose from.

The default recommendation is to use established HTML patterns instead of
building something custom with ARIA, as certain features and
functions---such as field states, properties, and values---are
inherently built into the HTML elements. Custom fields require you manually
add the ARIA.

> [!NOTE]
> **Note:** If the situation requires you to build custom form fields, be sure to review the [ARIA and HTML](https://web.dev/learn/accessibility/aria-html.md.txt), [Keyboard focus](https://web.dev/learn/accessibility/focus.md.txt), and [JavaScript](https://web.dev/learn/accessibility/javascript.md.txt) modules to understand how to make these custom form fields as accessible as possible.

Not recommended --- Custom HTML with ARIA

```html
<div role="form" id="sundae-order-form">
  <!-- form content -->
</div>
```

Recommended --- Standard HTML

```html
<form id="sundae-order-form">
  <!-- form content -->
</form>
```

In addition to choosing the most accessible form field patterns, where
applicable, you should also add
[HTML autocomplete attributes](https://developer.mozilla.org/docs/Web/HTML/Attributes/autocomplete)
to your fields. Adding autocomplete attributes allows a more fine-grained
[definition or identification of purpose](https://www.w3.org/TR/WCAG21/#input-purposes)
to user agents and assistive technologies (AT).

Autocomplete attributes allow users to personalize visual presentations,
such as showing a birthday cake icon in a field with the birthday autocomplete
attribute (`bday`) assigned to it. More generally, autocomplete attributes make
filling out forms easier and quicker. This is especially helpful for people
with cognitive and reading disorders and those using ATs, such as screen
readers.

```html
<form id="sundae-order-form">
  <p>Name: <input type="name" autocomplete="name" /></p>
  <p>Telephone: <input type="tel" autocomplete="tel" /></p>
  <p>Email address: <input type="email" autocomplete="email" /></p>
</form>
```

Lastly, form fields shouldn't produce contextual changes when they receive
focus or user input unless the user has been warned about the behavior before
using the component. For example, a form shouldn't be automatically submitted
when a field receives focus or once a user adds content to the field.

## Labels

Labels inform a user about the purpose of a field, if the field is required,
and can also provide information about the field requirements, such as input
format. Labels must be visible at all times and accurately describe the form
field to users.

One of the foundational tenets of accessible forms is establishing a clear and
accurate connection between a field and its label. This is true both visually
and programmatically. Without this context, a user might not understand how to
fill out the fields in the form.

```html
<form id="sundae-order-form">
  <p>
    <label
      >Name (required): <input type="name" autocomplete="name" required
    /></label>
  </p>
  <p>
    <label
      >Telephone (required): <input type="tel" autocomplete="tel" required
    /></label>
  </p>
  <p>
    <label>Email address: <input type="email" autocomplete="email" /></label>
  </p>
</form>
```

Additionally, related form fields, such as a mailing address, need to be
programmatically and visually grouped. One method is to use the fieldset and
legend pattern to group elements that are similar.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dev-codepen-external/embed/zYLqwwQ?height=400&amp;theme-id=auto&amp;default-tab=html%2C%20result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen zYLqwwQ by web-dev-codepen-external on Codepen"></iframe>

## Descriptions

Field descriptions are similar to labels in purpose in that they are used to
give more context to the field and requirements. Field descriptions are not
required for accessibility if the labels or form instructions are descriptive
enough.

However, there are situations in which adding additional information is useful
to avoid form errors, such as relaying information about the minimum length of
input for a password field or telling a user which calendar format to use (such
as MM-DD-YYYY).

There are many different methods you can use to add field descriptions to your
forms. One of the best methods is to add an
[aria-describedby](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Attributes/aria-describedby)
attribute to the form element, in addition to a `<label>` element. The screen
reader will read both the description and the label.

If you add the
[aria-labelledby](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Attributes/aria-labelledby)
attribute to your element, the attribute value overrides the text within your
`<label>`. As always, test the final code with all of the ATs you intend
to support.
<iframe loading="lazy" allow="clipboard-read; clipboard-write; encrypted-media;" src="https://codepen.io/web-dev-codepen-external/embed/ExpKmXq?height=400&amp;theme-id=auto&amp;default-tab=html%2C%20result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

## Errors

When creating accessible forms, there's a lot you can do to prevent users from
making form errors. Earlier in this module, we covered clearly marking-up
fields, creating identifying labels, and adding detailed descriptions whenever
possible. But no matter how clear you think your form is, eventually, a user
will make a mistake.

When a user encounters a form error, the first step is to
[make the error known](https://www.w3.org/WAI/tutorials/forms/notifications).
The field where the error occurred must be clearly identified, and the error
itself must be described to the user in text.

There are different methods for [displaying error
messages](https://webaim.org/techniques/formvalidation/#error), such as:

- A modal, inline near where the error occurred
- A collection of errors grouped in one larger message at the top of the page

Be sure to pay attention to the [keyboard focus](https://web.dev/learn/accessibility/focus.md.txt)
and [ARIA live region options](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
when announcing errors.

Whenever possible, offer the user a detailed suggestion on how to fix the
error. There are two attributes available to notify users of errors.

- You can use the HTML [required](https://developer.mozilla.org/docs/Web/HTML/Attributes/required) attribute. The browser supplies a generic error message based on the file validation parameters.
- Or you can use the [aria-required](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Attributes/aria-required) attribute to share a customized error message to ATs. Only ATs receive this message, unless you add code to make the message visible to all users.

Once a user thinks all of the errors have been resolved, allow them to resubmit
the form and provide feedback about the results of their submission. An error
message tells a user they have more updates to make, while a success message
confirms that they have resolved all errors and successfully submitted the form.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dev-codepen-external/embed/abjJYWR?height=400&amp;theme-id=auto&amp;default-tab=html%2C%20result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Codepen"></iframe>

## Additional success criteria

WCAG 2.2 introduced the following success criteria that focus on more accessible
form experiences:

- [Target Size (Minimum)](https://www.w3.org/TR/WCAG22/#target-size-minimum)
- [Consistent Help](https://www.w3.org/TR/WCAG22/#consistent-help)
- [Accessible Authentication](https://www.w3.org/TR/WCAG22/#accessible-authentication)
- [Redundant Entry](https://www.w3.org/TR/WCAG22/#redundant-entry).
