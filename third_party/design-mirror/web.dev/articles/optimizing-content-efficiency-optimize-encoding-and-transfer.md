---
source_url: https://web.dev/articles/optimizing-content-efficiency-optimize-encoding-and-transfer
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: 6763dcc61608a537868ed531a5c2a80a47c25fd48f907163cc7b0b636ce8f3cd
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Ilya Grigorik [X](https://twitter.com/igrigorik) [Homepage](https://igvita.com/) Jeremy Wagner [GitHub](https://github.com/malchata) [LinkedIn](https://www.linkedin.com/in/malchata) [Homepage](https://jlwagner.net/)

Next to eliminating unnecessary resource downloads, the best thing you can do to
improve page load speed is to minimize the overall download size by optimizing
and compressing the remaining resources.

## Data compression 101

Once you've set up your website to avoid downloading any unused resources, the
next step is to compress any remaining eligible resources that the browser has
to download. Depending on the resource type---text, images, fonts, and so
on---there are many different techniques to choose from: generic tools that can be
enabled on the web server, pre-processing optimizations for specific content
types, and resource-specific optimizations that require input from the
developer.

Delivering the best performance requires a combination of all of the following
techniques:

- Compression is the process of encoding information using fewer bits.
- Eliminating unnecessary data always yields the best results.
- There are many different compression techniques and algorithms.
- You will need a variety of techniques to achieve the best compression.

The process of reducing the size of data is _data compression_. Many people have
contributed algorithms, techniques, and optimizations to improve compression
ratios, compression speed, and the memory required by various compression
algorithms.

A full discussion of data compression is well beyond the scope of this guide.
However, it's important to understand---at a high level---how compression works, and
the techniques you can use to reduce the size of various assets that your pages
require.

To illustrate the core principles of these techniques, consider the process of
optimizing a simple text message format that was invented just for this example:

```text
# Below is a secret message, which consists of a set of headers in
# key-value format followed by a newline and the encrypted message.
format: secret-cipher
date: 08/25/16
AAAZZBBBBEEEMMM EEETTTAAA
```

1. Messages may contain arbitrary annotations---sometimes referred to as _comments_---which are indicated by the "#" prefix. Annotations do not affect the meaning of the message, or its behaviors.
2. Messages may contain _headers_ , which are key-value pairs (separated by `":"` in the preceding example) that appear at the beginning of the message.
3. Messages carry text payloads.

What can can be done to reduce the size of the prior message, which starts at
200 characters?

1. The comment is interesting, but it doesn't affect the meaning of the message. Eliminate it when transmitting the message.
2. There are good techniques to encode headers in an efficient manner. For example if you know that all messages have "format" and "date," you could convert those to short integer IDs and just send those. However, that might not be true, so it's best to leave it alone for now.
3. The payload is text only. While we don't know what the contents of it really are (apparently, it's using a `"secret-cipher"`), just looking at the text shows that there's a lot of redundancy in it. Perhaps instead of sending repeated letters, you can just count the number of repeated letters and encode them more efficiently. For example, `"AAA"` becomes `"3A"`, which represents a sequence of three A's.

Combining these techniques produces the following result:

```text
format: secret-cipher
date: 08/25/16
3A2Z4B3E3M 3E3T3A
```

The new message is 56 characters long, which means that you've compressed the
original message by 72%. That's a significant reduction!

This is a toy example of how compression algorithms can be effective at
reducing the _transfer size_ of text-based resources. In practice, compression
algorithms are far more sophisticated than the previous example illustrates, and
on the web, compression algorithms can be used to significantly reduce download
times for resources. By applying compression to text-based assets, a web page
can spend less time _loading_ resources, so that users can see the effects of
those resources sooner than they would without compression.

## Minification: Preprocessing, and context-specific optimizations

The first technique discussed here is _minification_. While minification is not
strictly a compression algorithm, it is a way of removing unnecessary and
redundant characters used in source code to make resources more readable for
humans. However, that readability isn't necessary to maintain the functionality
of that source code on production websites, and can delay the loading of
resources on the web.

Minification is a type of content-specific optimization that can significantly
reduce the size of delivered resources, and are optimizations are best applied
as part of your build and deployment process. For example, bundlers are a
commonly-used type of software that can automatically minify resources just
prior to the deployment of new production code to a website.

The best way to compress redundant or unnecessary data is to eliminate it.
However, you can't just delete arbitrary data. Yet, in some contexts where we
have content-specific knowledge of the data format and its properties, it's
possible to significantly reduce the size of the payload without affecting its
actual meaning or capabilities.

```html
<html>
  <head>
    <style>
      /* awesome-container is only used on the landing page */
      .awesome-container {
        font-size: 120%;
      }

      .awesome-container {
        width: 50%;
      }
    </style>
  </head>
  <body>
    <!-- awesome container content: START -->
    <div>This is my awesome container, and it is <em>so</em> awesome.</div>
    <!-- awesome container content: END -->
    <script>
      awesomeAnalytics(); // Beacon conversion metrics
    </script>
  </body>
</html>
```

Consider the prior HTML snippet and the three different content types that it
contains:

1. HTML markup.
2. CSS to customize a page's presentation.
3. JavaScript to power interactions and other advanced page capabilities.

Each of these content types has different rules for what constitutes valid
content, different rules for specifying comments, and so forth. The question
that remains, though, is "how can the size of this page be reduced?"

- Code comments are a developer's best friend, but the browser doesn't need them! Stripping CSS (`/* ... */`), HTML (`<!-- ... -->`), and JavaScript (`// ...`) comments reduces the total transfer size of the page and its subresources.
- A "smart" CSS compressor could notice that we're using an inefficient way of defining rules for `.awesome-container`, and collapse the two declarations into one without affecting any other styles, saving more bytes. Over a large set of CSS rules, removing this kind of redundancy can add up---but it may not be something that can be applied aggressively, as selectors are often necessarily duplicated in different contexts, such as within media queries.
- Spaces and tabs are developer conveniences in HTML, CSS, and JavaScript. An additional compressor could strip out all the tabs and spaces. Unlike other deduplication techniques, this sort of optimization _can_ be applied fairly aggressively, so long as such spaces or tabs aren't necessary for the page's presentation---for example, you'd want to preserve the spaces within runs of text in an HTML document, as they ensure readability of content that users will actually see.

```html
<html>
  <head>
    <style>
      .awesome-container {
        font-size: 120%;
        width: 50%;
      }
    </style>
  </head>
  <body>
    <div>This is my awesome container, and it is <em>so</em> awesome.</div>
    <script>
      awesomeAnalytics();
    </script>
  </body>
</html>
```

After applying the previous steps, the page goes from 516 to 204 characters, which
represents a savings of approximately 60%. Granted, it's not very readable, but
it doesn't need to be in order to be usable. Modern development practices also
allow you to keep the well-formatted and readable versions of your source code
separate from the well-optimized code you ship to production. Combined with
[source maps](https://web.dev/articles/source-maps.md.txt)---which provides a readable representation of your transformed
production code lets you more easily troubleshoot bugs in production---you can
have both a good developer experience while optimizing performance for the sake
of the user experience.

> [!NOTE]
> **Note:** While not represented in the previous example, SVG images are another text-based resource. SVGs can be minified and otherwise optimized in lossy fashion using tools such as [SVGO](https://github.com/svg/svgo).

The prior example illustrates an important point: a general-purpose
compressor---say, one designed to compress arbitrary text---could do a pretty good
job of compressing the page in the prior example, but it would never know to
strip the comments, collapse CSS rules, or dozens of other content-specific
optimizations. This is why preprocessing, minification, and other context-aware
optimizations are important.

> [!NOTE]
> **Note:** Case in point, the uncompressed development versions of popular frameworks are much larger than their equivalent intended to be used in production. For example, the [development
> version of Angular 1.8.3](https://unpkg.com/browse/angular@1.8.3/angular.js) is nearly 1.4 megabytes. The [production
> version](https://unpkg.com/browse/angular@1.8.3/angular.min.js) is 177 kilobytes. This clearly demonstrates the potential of these optimizations!

Similarly, the techniques described above can be extended beyond just text-based
assets. Images, video, and other content types all contain their own forms of
metadata and various payloads. For example, whenever you take a picture with a
camera, its file typically embeds a lot of extra information: camera settings,
location, and so on. Depending on your application, this data might be critical
(for example, a photo-sharing site) or it might be completely useless. You
should consider whether it's worth removing. In practice, this metadata can add
up to tens of kilobytes for every image.

In short, as a first step in optimizing the efficiency of your assets, build
an inventory of the different content types and consider what kinds of
content-specific optimizations you can apply to reduce their size. Then---after
you've figured out what they are, automate these optimizations by adding them to
your build and release steps to ensure that the optimizations are applied
consistently for every new release to production.

## Text compression with compression algorithms

The next step to reducing the size of text-based assets is to apply a
compression algorithm to them. This goes one step further by aggressively
searching for repeatable patterns in text-based payloads before sending them to
the user, and decompressing them once they arrive in the user's browser. The
result is a further and significant reduction of those resources, and subsequent
faster download times.

- gzip and Brotli are commonly-used compression algorithms that perform best on text-based assets: CSS, JavaScript, HTML.
- All modern browsers support gzip and Brotli compression, and will advertise support for both in the `Accept-Encoding` HTTP request header.
- Your server must be configured to enable compression. Web server software will often enable modules to compress text-based resources this by default.
- Both gzip and Brotli can be fine-tuned to improve compression ratios by adjusting the level of compression. For gzip, compression settings range from 1 to 9, with 9 being the best. For Brotli, this range is 0 to 11, with 11 being the best. However, higher compression settings require more time. For resources that are [dynamically compressed](https://web.dev/articles/codelab-text-compression-brotli.md.txt#dynamic_compression)---that is, at the time of the request---settings in the middle of the range tend to offer the best trade-off between compression ratio and speed. However, [static compression](https://web.dev/articles/codelab-text-compression-brotli.md.txt#static_compression) is possible, which is when the response is compressed ahead of time, and can therefore use the most aggressive compression settings available for each compression algorithm.
- [Content Delivery Networks (CDNs)](https://web.dev/articles/content-delivery-networks.md.txt) commonly offer automatic compression of qualifying resources. CDNs can also manage dynamic and static compression for you, giving you one less aspect of compression to worry about.

[gzip](https://en.wikipedia.org/wiki/Gzip) and [Brotli](https://en.wikipedia.org/wiki/Brotli) are common compressors that can be applied to any stream of
bytes. Under the hood, they remember some of the previously examined contents of
a file, and subsequently attempt to find and replace duplicate data fragments in
an efficient way.

> [!NOTE]
> **Note:** If you're interested in a more in-depth explanation of how compression works, watch this [great
> low-level explanation of gzip](https://www.youtube.com/watch?v=whGwm0Lky2s&feature=youtu.be&t=14m11s). If you want to experiment with text compression, try out our [gzip](https://web.dev/articles/codelab-text-compression.md.txt) and [Brotli](https://web.dev/articles/codelab-text-compression-brotli.md.txt) codelabs.

In practice, both gzip and Brotli perform best on text-based content, often achieving
compression rates of as high as 70-90% for larger files. However, running these
algorithms assets that are already compressed using alternative algorithms---such
as most image formats that use lossless or lossy compression techniques---yields
little to no improvement.

All modern browsers advertise support for gzip and Brotli in the
`Accept-Encoding` HTTP request header. However, it's the hosting provider's
responsibility to ensure that the web server is properly configured to serve the
compressed resource when the client requests it.

| File                  | Algorithm | Uncompressed size | Compressed size | Compression ratio |
| --------------------- | --------- | ----------------- | --------------- | ----------------- |
| angular-1.8.3.js      | Brotli    | 1,346 KiB         | 256 KiB         | **81%**           |
| angular-1.8.3.js      | gzip      | 1,346 KiB         | 329 KiB         | **76%**           |
| angular-1.8.3.min.js  | Brotli    | 173 KiB           | 53 KiB          | **69%**           |
| angular-1.8.3.min.js  | gzip      | 173 KiB           | 60 KiB          | **65%**           |
| jquery-3.7.1.js       | Brotli    | 302 KiB           | 69 KiB          | **77%**           |
| jquery-3.7.1.js       | gzip      | 302 KiB           | 83 KiB          | **73%**           |
| jquery-3.7.1.min.js   | Brotli    | 85 KiB            | 27 KiB          | **68%**           |
| jquery-3.7.1.min.js   | gzip      | 85 KiB            | 30 KiB          | **65%**           |
| lodash-4.17.21.js     | Brotli    | 531 KiB           | 73 KiB          | **86%**           |
| lodash-4.17.21.js     | gzip      | 531 KiB           | 94 KiB          | **82%**           |
| lodash-4.17.21.min.js | Brotli    | 71 KiB            | 23 KiB          | **68%**           |
| lodash-4.17.21.min.js | gzip      | 71 KiB            | 25 KiB          | **65%**           |

The preceding table shows the savings that both Brotli and gzip compression can
provide for a few well-known JavaScript libraries. The savings range from 65% to
86% depending on the file and the algorithm. For reference, the maximum
compression level was applied to each file for both Brotli and gzip. **Wherever
possible, prefer Brotli over gzip.**

> [!IMPORTANT]
> **Important:** The prior table clearly demonstrates how applying compression on top of optimizations such as minification can provide additional savings. It is not always the case that compression alone renders the effects of minification to be meaningless---it is an _additive_ optimization.

Enabling compression is one of the simplest and most effective optimizations to
implement. If your website is not taking advantage of it, you're missing out on
a big opportunity to improve performance for your users. Fortunately, many web
servers provide default configurations that enable this important optimization,
and CDNs in particular are very effective at implementing it in a way that
balances compression speed and ratio.

A quick way to see compression in action is to open Chrome DevTools, open the
**Network** panel, load a page of your choosing, and observe the very bottom of
the network panel.
A representation of the _transfer_ size (that is, compressed) of all page resources versus their actual size as visualized in the network panel of Chrome DevTools.

Like the preceding image, you should see a breakdown of:

- The number of the requests, which is the number of resources loaded for the page.
- The _transfer size_ of all requests. This reflects the effectiveness of the compression applied to any of a page's resources.
- The _resource size_ of all requests. This reflects how large the resources for the page are _after_ they have been decompressed.

> [!NOTE]
> **Note:** Sometimes, compression algorithms can increase the size of the asset. Typically, this happens when the uncompressed asset is very small, and the overhead of the algorithm is higher than the compression savings, or when the resource is already well compressed. To avoid this problem, some servers allow you to specify a minimum file size threshold, which is typically less than four or five kilobytes.

## Effects on Core Web Vitals

Performance improvements can't be measured unless there are metrics that reflect
those improvements. The [Core Web Vitals initiative](https://web.dev/articles/vitals.md.txt) exists to
create and raise awareness of metrics that reflect the actual user experience.
This is in contrast to metrics---such as simple page load time, for example---that
don't clearly translate to user experience quality.

When you apply the optimizations outlined in this guide to the resources on your
website, the effects on Core Web Vitals can vary, based on the resources
optimized and the metric(s) involved. However, here are some instances in which
applying these optimizations can improve your website's Core Web Vitals:

- HTML resources that are minified and compressed can improve the loading of that HTML, the discoverability of its subresources, and therefore improve the loading of them. This can be beneficial for a page's [Largest Contentful Paint
  (LCP)](https://web.dev/articles/lcp). While resource hints such as `rel="preload"` can be used to affect the discoverability of resources, using too many of them can cause problems with bandwidth contention. By ensuring the HTML response for a navigation request is compressed, the resources within them can be discovered as soon as possible by the [preload scanner](https://web.dev/articles/preload-scanner.md.txt).
- Some [LCP candidates](https://web.dev/articles/lcp.md.txt#what-elements-are-considered) can also be loaded sooner by using compression. For example, SVG images which are LCP candidates can have their [resource load
  duration](https://web.dev/articles/optimize-lcp#reduce-resource-load-duration) reduced through text-based compression. This is different than optimizations that you would make to other image types---which are intrinsically compressed through other compression methods---such as how JPEG images use lossy compression.
- Additionally, text nodes can also be LCP candidates. How the techniques described in this guide depends on whether you're using a web font for text on your web pages. If you're using a web font, then [web font optimization best
  practices](https://web.dev/learn/performance/optimize-web-fonts) apply. However, if you're _not_ using web fonts---but rather system fonts that display without incurring any resource load duration---minifying and compressing your CSS reduces this duration, which means that rendering of potential LCP text nodes can occur sooner.

## Conclusion

How you optimize the encoding and transfer of text-based assets is a baseline
performance concept---but it's one that has a big impact. Be sure that you're
doing all that you can to ensure that resources eligible for minification and
compression are benefitting from those optimizations.

More importantly, be sure that these processes are being automated. For
minification, use a bundler to apply minification to eligible resources. Ensure
that your web server configuration supports compression, but more than that, use
the most effective compression available. To make this as trivial as possible,
use CDNs to automate compression for you, as they not only can compress
resources for you, but they can also do so very quickly.

By cementing these baseline performance concepts into your website's
architecture, you can ensure that your performance optimization efforts are on a
good footing, and that subsequent optimizations can rest on a solid foundation
of good baseline practices.
