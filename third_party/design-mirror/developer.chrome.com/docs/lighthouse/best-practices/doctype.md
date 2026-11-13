---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/doctype
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:46+00:00
sha256: 877d7e41eb884b34a47b4745f95e50a044d0f450f13f19a9260ab3520d5bf0ca
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Specifying a doctype prevents the browser from switching to
[quirks mode](https://developer.mozilla.org/docs/Web/HTML/Quirks_Mode_and_Standards_Mode),
which can cause your page to [render in unexpected ways](https://quirks.spec.whatwg.org/#css).

## How the Lighthouse doctype audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags pages without the
`<!DOCTYPE html>` declaration:
 Lighthouse audit showing missing doctype.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## How to add a doctype declaration

Add the `<!DOCTYPE html>` declaration to the top of your HTML document:

```html
<!DOCTYPE html>
<html lang="en">
...
```

Read about [Doctype on MDN](https://developer.mozilla.org/docs/Glossary/Doctype)
for more information.

## Resources

- [Source code for **Page lacks the HTML doctype, thus triggering quirks mode** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/dobetterweb/doctype.js)
- [Quirks Mode and Standards Mode](https://developer.mozilla.org/docs/Web/HTML/Quirks_Mode_and_Standards_Mode)
