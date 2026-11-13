---
source_url: https://web.dev/articles/critical-rendering-path/optimizing-critical-rendering-path
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:46+00:00
sha256: 3659a82c76e9cbb22c06519a6f4c1a241a271ad9df6ae2dec0f0fc301b251b00
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Ilya Grigorik [X](https://twitter.com/igrigorik) [Homepage](https://igvita.com/)

Published: March 31, 2014

To deliver the fastest possible time to first render, we need
to minimize three variables:

- The number of critical resources.
- The critical path length.
- The number of critical bytes.

A critical resource is a resource that could block initial rendering of the page. The fewer of these resources, the less work for the browser, the CPU, and other resources.

Similarly, the critical path length is a function of the dependency graph between the critical resources and their bytesize: some resource downloads can only be initiated after a previous resource has been processed, and the larger the resource the more round trips it takes to download.

Finally, the fewer critical bytes the browser has to download, the faster it can process content and render it visible on the screen. To reduce the number of bytes, we can reduce the number of resources (eliminate them or make them non-critical) and ensure that we minimize the transfer size by compressing and optimizing each resource.

**The general sequence of steps to optimize the critical rendering path is:**

1. Analyze and characterize your critical path: number of resources, bytes, length.
2. Minimize number of critical resources: eliminate them, defer their download, mark them as async, and other important considerations.
3. Optimize the number of critical bytes to reduce the download time (number of roundtrips).
4. Optimize the order in which the remaining critical resources are loaded: download all critical assets as early as possible to shorten the critical path length.

## Feedback
