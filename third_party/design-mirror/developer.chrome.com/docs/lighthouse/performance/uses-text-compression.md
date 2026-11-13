---
source_url: https://developer.chrome.com/docs/lighthouse/performance/uses-text-compression
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: 4dcb201ca30368213b7ab9f62409d00103b5c62c1c9ffb0b2a8906be69c3c5e5
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
> [!WARNING]
> **Warning:** This audit has moved into the [Document request latency](https://developer.chrome.com/docs/performance/insights/document-latency.md.txt) insight as of Lighthouse 13. For more information see [What's new in Lighthouse 13](https://developer.chrome.com/blog/lighthouse-13-0.md.txt).

Text-based resources should be served with compression to minimize total network
bytes. The Opportunities section of your Lighthouse report lists all text-based
resources that aren't compressed:

## How Lighthouse handles text compression

Lighthouse gathers all responses that:

- Have text-based resource types.
- Do not include a `content-encoding` header set to `br`, `gzip`, or `deflate`.

Lighthouse then compresses each of these with
[GZIP](https://www.gnu.org/software/gzip/) to compute the potential
savings.

If the original size of a response is less than 1.4KiB, or if the
potential compression savings is less than 10% of the original size, then
Lighthouse does not flag that response in the results.

> [!NOTE]
> **Note:** The potential savings that Lighthouse lists are the potential savings when the response is encoded with GZIP. If Brotli is used, even more savings are possible.

## Enable text compression on your server

Enable text compression on the server(s) that served these responses in order to
pass this audit.

When a browser requests a resource, it will use the
[`Accept-Encoding`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Accept-Encoding)
HTTP request header to indicate what compression algorithms it supports.

```text
Accept-Encoding: gzip, compress, br
```

If the browser supports [Brotli](https://opensource.googleblog.com/2015/09/introducing-brotli-new-compression.html)
(`br`) you should use Brotli because it can reduce the file size of the resources more than the
other compression algorithms. Search for `how to enable Brotli compression in <X>`, where
`<X>` is the name of your server. As of December 2022 Brotli is supported in all major browsers except Safari on iOS. See
[Browser compatibility](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Encoding#Browser_compatibility)
for updates.

Use GZIP as a fallback to Brotli. GZIP is supported in all major browsers,
but is less efficient than Brotli. Refer to [Server Configs](https://github.com/h5bp/server-configs)
for examples.

Your server should return the
[`Content-Encoding`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Encoding)
HTTP response header to indicate what compression algorithm it used.

```text
Content-Encoding: br
```

## Check for response compression

To check if a server compressed a response:

Press `Control+Shift+J` (or `Command+Option+J` on Mac) to open DevTools.
Click the Network tab.

1. Press <kbd>Control</kbd>+<kbd>Shift</kbd>+<kbd>J</kbd> (or <kbd>Command</kbd>+<kbd>Option</kbd>+<kbd>J</kbd> on Mac) to open DevTools.
2. Click the **Network** tab.
3. Click the request that caused the response you're interested in.
4. Click the **Headers** tab.
5. Check the `content-encoding` header in the **Response Headers** section.

 The `content-encoding` response header.

To compare the compressed and decompressed sizes of a response:

1. Press <kbd>Control</kbd>+<kbd>Shift</kbd>+<kbd>J</kbd> (or <kbd>Command</kbd>+<kbd>Option</kbd>+<kbd>J</kbd> on Mac) to open DevTools.
2. Click the **Network** tab.
3. Enable large request rows. See [Use large request rows](https://developer.chrome.com/docs/devtools/network/reference.md.txt#request-rows).
4. Look at the **Size** column for the response you're interested in. The top value is the compressed size. The bottom value is the decompressed size.

See also [Minify and compress network payloads](https://web.dev/articles/reduce-network-payloads-using-text-compression).

## Stack-specific guidance

- **Drupal** : Text-based resources should be served with compression (gzip, deflate or brotli) to minimize total network bytes. Consider using a CDN that natively supports this, or configure the web server to perform this operation. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/text-compression).
- **Joomla** : Enable the Gzip Page Compression setting (**System** \> **Global configuration** \> **Server**).
- **WordPress**: Enable text compression in your web server configuration.

## Resources

- [Source code for **Enable text compression** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/byte-efficiency/uses-text-compression.js)
