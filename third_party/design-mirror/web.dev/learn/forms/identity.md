---
source_url: https://web.dev/learn/forms/identity
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: 03b2428ac59a8ee91d3e4332d5654c5264118a65d868b6c4715a01457da6fca6
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

> [!WARNING]
> **Warning:** User account [authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) is a complex issue in terms of privacy and security. For account safety, it's likely better to use a [third-party identity provider](https://web.dev/articles/sign-up-form-best-practices.md.txt#federated-login), instead of building your own secure authentication system. Learn more about [best practices for account authentication and password management](https://cloud.google.com/blog/products/identity-security/account-authentication-and-password-management-best-practices).

## Help users sign up

The sign-up form is often the first interaction with a form on your website.
Good sign-up form design is critical, and a secure form is essential.

Look at a sign-up form, to learn how you can help users sign up on your website.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/42a33b97484873a214f8a945a3b55f71?height=450&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

Keep the sign-up form minimal and only show the required form controls to create
an account. Don't double up your form controls to help users get their account
details right. Send a confirmation email instead.

> [!NOTE]
> **Note:** Only require sign-up if you really need to. To store information between navigation, consider using [client-side storage](https://web.dev/articles/storage-for-the-web.md.txt). For checkout forms, add a guest checkout by default. You can ask new customers if they want to sign up after they've completed a purchase, or when they enter address details.

### Account details

You can help users fill in their account details by using the appropriate
`autocomplete` attribute. Use `autocomplete="email"` for the email field, and
`autocomplete="new-password"` for a new-password field.

Learn more about [autofilling input controls](https://web.dev/learn/forms/autofill.md.txt).

> [!WARNING]
> **Warning:** [**Allow pasting into password fields**](https://www.ncsc.gov.uk/blog-post/let-them-paste-passwords). Disabling pasting encourages the users to write memorable passwords instead of secure passwords. It's particularly annoying for users with password managers to suggest and autofill secure passwords.

You can also help users enter a secure password by offering a reveal-password
`<button>`. Learn more about the
[reveal-password pattern](https://web.dev/learn/forms/javascript.md.txt#ensure_users_can_see_the_password_they_entered).

### Secure your sign-up form

Never store or transmit passwords in plain text.
Make sure to [salt and hash](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#Use_a_cryptographically_strong_credential-specific_salt)
passwords---and [don't try to invent your own hashing algorithm](https://www.schneier.com/blog/archives/2011/04/schneiers_law.html).

Offer [multi-factor authentication](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html),
especially if you store personal or sensitive data.
[SMS OTP best practices](https://web.dev/articles/sms-otp-form.md.txt) and
[Enabling Strong Authentication with WebAuthn](https://developer.chrome.com/blog/webauthn)
explain how to implement multi-factor authentication.

Ensure users don't use compromised passwords. For example, use the API from
[Have I Been Pwned](https://haveibeenpwned.com/API/)
to detect compromised passwords, and suggest your users fill in a different new
password, or warn them if their password becomes compromised.

## Help users sign in

See how to build a sign-in form to ensure users can sign in to your website.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/89610184f6c51990ab9484b593e1d951?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

Make the location of sign-up and sign-in buttons obvious.
Ensure your form is usable on touch devices:

- The [tap target size](https://web.dev/articles/accessible-tap-targets.md.txt) of buttons is at least 48px.
- The `font-size` of your form elements is big enough (`20px` is about right on mobile).
- There is enough space (`margin`) between form controls, and that inputs are large enough (use at least `padding: 15px` on mobile).

### Help users fill in their email and password

Help browsers and password managers autofill account details.
Use `autocomplete="email"` for the email field,
and `autocomplete="current-password"` for a current password field.

To help users manually fill in their account details, use `type="email"`
for the email field to show the appropriate on-screen keyboard on mobile devices.

Use the `required` attribute for your email and password field so you can warn
of invalid values when the user submits the form. Consider using
[real-time validation](https://web.dev/learn/forms/javascript.md.txt#ensure_users_are_notified_about_errors_in_real_time)
to help users correct invalid data as soon as they have entered it, rather than
waiting for form submission.

### Ensure users can see the password they entered

The text you fill in for `<input type="password">` is obscured by default,
to respect the privacy of users.
Help users to enter their password,
by showing a `<button>` to toggle the visibility of the entered text.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/bd8577c5380c436dba2788c7a2c8652a?height=300&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="CodePen example"></iframe>

Learn more about
[implementing a password-reveal `<button>`](https://web.dev/learn/forms/javascript.md.txt#ensure_users_can_see_the_password_they_entered).

## Ensure your sign-in and sign-up forms are usable

Test your sign-in and sign-up forms regularly with real people to make sure that authentication works as expected.
Use analytics and [real user measurement (RUM)](https://web.dev/articles/user-centric-performance-metrics.md.txt) to collect field data,
and tools such as [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview)
and [PageSpeed Insights](https://pagespeed.web.dev/) to run tests yourself.
Learn more about [testing for usability](https://web.dev/learn/forms/usability-testing.md.txt) and
[gathering analytics data](https://web.dev/learn/forms/data.md.txt).

Ensure your forms work in different browsers and on different platforms.
Test your form on different screen sizes, using only your keyboard,
or using a screen reader such as
[VoiceOver](https://www.youtube.com/watch?v=5R-6WvAihms&list=PLNYkxOF6rcICWx0C9LVWWVqvHlYJyqw7g&index=6) on Mac or
[NVDA](https://www.nvaccess.org/) on Windows.

## Help users change their account settings

Make sure that users can change every account setting,
including email addresses, passwords, and usernames.

Make it transparent what data you are storing,
and help users download all their personal data at any time.
Ensure users can delete their account if that's what they want.
Account management features such as these may be a legal requirement in some regions.

### Ensure users can update their passwords

Make it easier for users to update their password.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/dd3ac6198324f644774583c02bf0fbd8?height=450&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;"></iframe>

Ask users for the current password before changing it, and send an email about
a password change with the option to revert and lock the account.

Add the option to request a new password, and consider providing a
[`.well-known` URL](https://web.dev/articles/change-password-url.md.txt) for requesting a new password.

## Resources

- [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Understanding the root cause of account takeover](https://security.googleblog.com/2017/11/new-research-understanding-root-cause.html)
- [Password security: Complexity versus length](https://www.infosecinstitute.com/resources/security-awareness/password-security-complexity-vs-length/)
- [Sign-up form best practices](https://web.dev/articles/sign-up-form-best-practices.md.txt)
- [Sign-in form best practices](https://web.dev/articles/sign-in-form-best-practices.md.txt)
- [Effective password management \| Session](https://www.youtube.com/watch?v=4Ve2kw_AN84)
