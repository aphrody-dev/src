---
source_url: https://developer.chrome.com/blog/crux-ad-metrics
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:43+00:00
sha256: a5fc104afa9feec0cb1f647764631cb7e6deb8b01b0ec354f4e222c5bb4413a8
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Alex Cone [X](https://twitter.com/https://x.com/alextcone) [LinkedIn](https://www.linkedin.com/in/alextcone)

Published: September 15, 2026

We've all encountered overwhelming ad experiences on the web. We know them when we see them, but they're hard to quantify. Today, Chrome is introducing a new set of metrics to the [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux.md.txt) designed to describe websites' ad loads as real users encounter them.

These new CrUX ad metrics provide **a more complete picture of a user's experience on the web** . They expand the [aggregate data already publicly available in CrUX](https://developer.chrome.com/docs/crux/methodology/metrics.md.txt) by reporting on four dimensions of a site's ad experience:

- **Ad Count**: The average number of ads in the viewport
- **Ad Density**: The average fraction of the viewport area occupied by ads.
- **Ad Weight (Network Usage)**: The resources consumed by ads measured in bytes.
- **Ad Weight (CPU Usage)**: The resources consumed by ads measured in milliseconds.

We expect these metrics to be particularly useful for web advertisers and the services they use to place ads. We've heard from a large cross-section of ad ecosystem stakeholders that these metrics could enhance how they value ad opportunities and make ad product decisions. We're encouraged by this feedback as we think **users ultimately benefit from more collective attention paid to tuning web ad experiences**.

> [!NOTE]
>
> ## Ecosystem support
>
> A sample of ecosystem support we have received in regards to publishing this data:
> -
>
> > _"By providing a clearer picture of the ad environment our clients are competing in, these new metrics will provide us with enabling insights to drive greater efficiency and impact."_
>
> _**--- Ryan Storrar, Global President, Media Management \& Delivery, WPP**_
> -
>
> > _"This is a great step forward for the ecosystem. As a publisher focused on independent, quality journalism, we want to be valued for the experiences we build, and these metrics provide a clear, objective ground truth to support that."_
>
> _**--- Sara Badler, Chief Advertising Officer, North America, The Guardian**_
> -
>
> > _"Chrome is investing in the right signals to improve the web, and Mediavine is excited to help demonstrate that quality experiences deliver stronger results. Expanding visibility into these metrics empowers both advertisers and publishers to make smarter decisions that benefit the entire ecosystem."_
>
> _**--- Amanda Martin, CRO, Mediavine**_
> -
>
> > _"We're excited about Google Chrome's approach to building metrics with the advertising ecosystem. There's still work to be done on how best to use the data, but you can see the potential for an incentive shift --- one that rewards media owners who've built better ad experiences for consumers and improved attention and performance for marketers. This could be the start of a win-win for good actors on the open internet."_
>
> _**--- Michael McNeeley, SVP Product, Index Exchange**_
> -
>
> > _"Display \& Video 360 supports this initiative to bring transparency to page layout quality. We look forward to exploring with the industry how these signals can improve quality and support advertiser goals."_
>
> _**--- Bill Reardon, General Manager, Enterprise Platform, Google Ads**_
> -
>
> > _"Better ad experiences benefit users, publishers, and advertisers, but the industry needs stronger incentives to reward quality. Chrome's new CrUX metrics add visibility into the ad experience and complement AU's media quality signals, helping advertisers make better decisions and encouraging a higher-quality ecosystem."_
>
> _**--- Marc Guldimann, CEO \& Co-founder of Adelaide**_

The new CrUX ad metrics are reported on the same dimensions and follow the same eligibility criteria as [our existing Web Vitals](https://developer.chrome.com/docs/crux.md.txt). While inspired by [Core Web Vitals](https://web.dev/articles/vitals), which help provide visibility into websites' speed, responsiveness and visual stability, CrUX ad metrics are not part of Core Web Vitals and don't have suggested targets or thresholds.

You can access these new ad metrics in CrUX today. Developers should expect data availability to increase over the coming month. Each of the four metrics is labeled "experimental" to make clear we are open to [community feedback](https://groups.google.com/a/chromium.org/g/chrome-ux-report), evolving these metrics and exploring additional metrics that focus sites' investments on improving users' browsing experience.

For more information on how to retrieve and use these new metrics, visit our documentation on [developer.chrome.com/docs/ads](https://developer.chrome.com/docs/ads).
