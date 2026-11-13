---
source_url: https://web.dev/learn/forms/address
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:25+00:00
sha256: 104bb7b6485e011b8b2c1abcd7bfc0225c006a23cb5f9f1b0bdea8e8e6a72dbd
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Filling in an address can be time-consuming and frustrating. What is
**Address line 2** for? You may not have a surname, so what should you enter in
a **Surname** field? Avoid these confusions and help users fill out address
forms.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/6af9430bd0fc87b3850bb187409ce312?height=650&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

## Build a user-friendly form

Many forms use one field for first name and one for surname.
However, some people don't have a surname, or their names don't have two parts,
so how should they fill in the surname field? Use a single `<input>` for the
name field. Learn more about
[handling different name formats](https://web.dev/learn/forms/internationalization.md.txt#ensure_your_form_can_handle_different_name_formats).

> [!CAUTION]
> **Caution:** Don't restrict the allowed characters for names to [Latin-only](https://en.wikipedia.org/wiki/Latin_alphabet). Allow [Unicode characters](https://web.dev/articles/payment-and-address-form-best-practices.md.txt#unicode-matching) for the name `<input>` to ensure everybody can fill in their name. Use a single `<input>` for the street address, as not every address has a street number.

According to [research](https://baymard.com/blog/address-line-2),
**Address line 2** can be confusing for users. Consider using a `<textarea>`
for the whole address, or hide the **Address line 2** field behind a reveal `<button>`.

Be careful with form control descriptions.
For example, users in the US say **ZIP** , in the UK **postcode** .
Use `<label for="zip">ZIP or postal code (optional)</label>`
to make sure users know what data to enter.
Make the postal code field optional--not every address has a postal code.

> [!NOTE]
> **Note:** You can use services like [Place Autocomplete](https://developers.google.com/maps/documentation/javascript/examples/places-autocomplete-addressform) or [Loqate](https://www.loqate.com/) to help users look up addresses. Consider [avoiding postcode address lookup](https://web.dev/articles/payment-and-address-form-best-practices.md.txt#postal-code-address-lookup), and only provide address lookup as an extra option.

## Help users enter their address

The `autocomplete` attribute can help users re-enter their address:

- `autocomplete="name"`
- `autocomplete="street-address"`
- `autocomplete="postal-code"`
- `autocomplete="country"`

> [!NOTE]
> **Note:** There are two possible `autocomplete` values for the country: `country`, country or territory code, and `country-name`, country or territory name. Use `autocomplete="country"` for `<select>` where the `value` for the `<option>` is the country code. Want to use an `<input>` for the country name? Use `autocomplete="country-name"`.

You can define multiple values separated by a space for `autocomplete`. Say you
have a form with a shipping address and another form for a billing address.
To tell the browser which postal code is for the billing address, you can use
`autocomplete="billing postal-code"`. For the shipping address, use `shipping`
as the first value.

Change the label for the `Enter` key on on-screen keyboards with the
`enterkeyhint` attribute. Use `enterkeyhint="done"` for the last form control,
and `enterkeyhint="next"` for the other form controls.

## Resources

- [Payment and address forms best practices](https://web.dev/articles/payment-and-address-form-best-practices.md.txt)
- [Form Usability: Getting Address Line 2 Right](https://baymard.com/blog/address-line-2)
