---
source_url: https://web.dev/articles/images-tooling-report
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:57+00:00
sha256: b92aad59d9e2864893c5a17d98e41177269c5c04e731dbb7af7931fd40ab3a3a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Check out the state of image tooling.

 Patrick Kettner [X](https://twitter.com/patrickkettner) [GitHub](https://github.com/patrickkettner) [LinkedIn](https://www.linkedin.com/in/patrickkettner)

Published: April 20, 2022

It's one thing to put an image on the web---but it's hard to do it well.
Picking the right format, compression, dots per inch (DPI), and hundreds of
other settings can be forgotten when we do all this ourselves.

The great news is that nowadays we have an abundance of tools and services that can do all of that for us. The not-so-great news is that, well, there is an abundance. It can be hard to pick which tool or service is right for you. That's why we're launching [images.tooling.report](https://images.tooling.report), a site where we list what we think are the most important when shipping images in production, and to compare some of the most popular software and services, be they paid or free, hosted or self-hosted.

## Why is it?

Images [make up a huge part of a site's bytes transferred](https://httparchive.org/reports/state-of-images)---and those bytes add up! In fact, we found that unoptimized images made up [nearly 75% of a page's total size](https://almanac.httparchive.org/en/2019/page-weight#what-types-of-assets-does-the-http-archive-track-and-how-much-do-they-matter). All of those wasted bytes come at a cost. That is why in a study of millions of real user sessions, pages that converted had 38% fewer images than those that did not convert. So should you just delete all your images? Of course not. But you *should* make sure that the images you send out are optimized for all users, regardless of the devices they use.

## What is it?

Serving optimized images is more than just clicking "Save for Web." That is why images.tooling.report checks for a wide variety of features. We cover the basics, like how much compression the different tools and services provide, and network optimizations such as long-lived cache headers.

We don't stop there, though. We searched out more advanced options, like support for [`Save-Data`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Save-Data), [`ECT`](https://developer.mozilla.org/docs/Web/HTTP/Headers/ECT), and other [client hints](https://developer.mozilla.org/docs/Web/HTTP/Client_hints), to look for automated psychovisual analysis that can use data models to repeatedly compress images, to find the version that takes the fewest bytes without changing the way our eyes perceive it. Are you squeezing every last non-visual bit from your images before sending down the wire?

Of course, every site is a snowflake---no one tool or service did absolutely
everything we were looking for. So we broke out what we tested into different categories. We cover Content Delivery Networks (CDNs), self-hosted projects, Content Management System (CMS) plugins, and site builders. These are fairly loose definitions that are really there to try to make comparing different options more relevant:

- *CMS plugins* are packages that are an easy option for developing on platforms such as WordPress.
- *Site builders* compare a number of different services that you can use to build your website.
- *Self-hosted* is meant for devs who are comfortable cloning a git project, or running their own Docker image in production.
- *CDNs* are a bit more complicated. Some of these *are* classic CDNs, but others are services that proxy or host your images on the edge.

You can't be everything to everyone all the time, but you should check out the tests and features being evaluated and see how your image optimizer stacks up! And what if you aren't already doing something for image optimization today? Then it's a great time to check out image tooling, and see what benefits you can bring to people already using your site.

## What's next?

Do you think we have missed an image tool or service? Let us know! Both the
tools and services, and the tests themselves, are a living, updating thing.
Whenever you need a quick place to check out the state of the art in shipping
images, make sure your first stop is
[images.tooling.report](https://images.tooling.report/).
