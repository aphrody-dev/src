---
source_url: https://developer.chrome.com/blog/prerender-until-script-origin-trial
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:33+00:00
sha256: 7ec464c76aa1f14ccd474cdfa8facdf4e78b12256dd4ea508a5a5331ac37d00e
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Barry Pollard [X](https://twitter.com/tunetheweb) [GitHub](https://github.com/tunetheweb) [Mastodon](https://mastodon.social/@tunetheweb) [Bluesky](https://bsky.app/profile/tunetheweb.com) [Homepage](https://www.tunetheweb.com) Lingqi Chi [GitHub](https://github.com/Clqsin45)

Published: January 23, 2026

Chrome is launching a new [origin trial](https://developer.chrome.com/docs/web-platform/origin-trials.md.txt) from Chrome 144 for the [prerender until script](https://developer.chrome.com/origintrials#/view_trial/881016677104353281) addition to the [Speculation Rules API](https://developer.chrome.com/docs/web-platform/prerender-pages.md.txt). This origin trial lets sites try the new addition with real users. The aim is to field test the feature and provide the Chrome team feedback to help shape it and decide if it's something we should add to the web platform.

> [!TIP]
> **Tip:** For more information on this, and other new Speculation Rules API features, check out the [Speculations about Web Performance talk](https://www.youtube.com/watch?v=DqE9WV76wFo) from the 2025 [Performance.now() conference](https://perfnow.nl/): [Video](https://www.youtube.com/watch?v=DqE9WV76wFo)

## What problem is this looking to address?

The Speculation Rules API lets page loads be started in advance of users actually navigating to pages. This can improve future page loads by completing some or all of the work ahead of time. Until now it has allowed two types of speculations: prefetch and prerender.

Prefetch fetches the HTML document only. This gets that critical first resource ahead of time which then provides a performance boost when a URL is navigated to. It doesn't load any subresources (for example, CSS, JavaScript, or images), nor execute JavaScript, and so there may still be considerable work for the browser to perform upon page loads.

Prerender does much more. It fetches the subresources, and starts to render the page and execute JavaScript, almost as if the page was opened in a hidden background tab. When the user clicks on the link they can get an instant navigation if the browser has completed all the work needed to render the page.

Using the prerender option is potentially much better for performance, but comes at extra implementation cost, as well as extra resource costs. If not considered carefully, this can also cause unexpected side effects when fully prerendering a page before a user has actually navigated to the page. For example, [analytics](https://developer.chrome.com/docs/web-platform/prerender-pages.md.txt#impact-on-analytics) may fire before a user has navigated---skewing statistics---if the analytics provider does not take speculations into account.

Sites using prerender must also be careful not to serve a user a stale page. For example, if you speculate a page on an ecommerce site, then add something to your basket, and then load the previously speculated page you may see the old basket quantity if the site does not take extra care to ensure this is updated.

These complications also exist for prefetch if some of this state management happens server-side, but is often a larger problem for prerender. It can be more complicated to use prerender on [more complex sites](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules.md.txt).

However, we hear from developers that they are already seeing the performance gains from prefetching the page and want to go further with speculation rules to benefit even more. This is where prerender until script comes in.

## What is prerender until script?

prerender until script is a new, middle ground, between prefetch and prerender. It prefetches the HTML document (as prefetch does), and then starts to render the page, including fetching all the subresources (as prerender does). Crucially however, the browser will avoid executing `<script>` elements (for both inline scripts and `src` scripts). When it encounters a blocking `<script>` tag, it pauses the parser and waits until the user navigates to the page before continuing. In the meantime [the preload scanner](https://web.dev/articles/preload-scanner) can carry on and fetch subresources needed by the page so they will be ready to use when the page can continue loading.

By holding back any blocking `<script>` elements, much of the implementation complexity is avoided. At the same time, by starting the rendering process and fetching the subresources, there is a huge gain over prefetch---potentially almost as much as there is for a full prerender.

In the best case scenario (when there are no scripts in the page at all), this option will prerender the entire page. Or, when a page only has script elements in the footer [or only scripts with `async` or `defer` attributes](https://developer.chrome.com/blog/prerender-until-script-origin-trial.md.txt#async-or-defer), the page will be fully prerendered without that JavaScript. Even in the worst case scenario (where there's a blocking script in the `<head>`), the starting of the page render, and in particular the prefetching of the subresources, should lead to a much improved page load.

## How to use prerender until script?

First, [enable the feature](https://developer.chrome.com/blog/prerender-until-script-origin-trial.md.txt#enable), then prerender until script is used in the same way as the other Speculation Rules API options with a new `prerender_until_script` key (note the underscores to make it a valid JSON key name)

This can be used with list rules of static URLs:

```javascript
<script type="speculationrules">
{
  "prerender_until_script": [{
    "urls": ["next.html", "next2.html"]
  }]
}
</script>
```

It can also be used with document rules where the URLs to speculate are available as links on the page:

```javascript
<script type="speculationrules">
{
  "prerender_until_script": [{
    "where": { "href_matches": "/*" }
  }]
}
</script>
```

prerender until script can then be used with the usual Speculation Rules API options, including the [various eagerness values](https://developer.chrome.com/docs/web-platform/prerender-pages.md.txt#eagerness).

As JavaScript won't execute, `document.prerendering` cannot be read and neither can the `prerenderingchange` event. However the `activationStart` time will be non-zero.

> [!IMPORTANT]
> **Important:** Given the `prerender_until_script` option is new, it should supplement any existing prefetch rules---it won't automatically fallback in unsupporting browsers since this value won't be recognised as a valid rule value in those browsers.

The following example shows how to deploy the previous example with a fallback to prefetch for browsers that don't support `prerender_until_script`:

```javascript
<script type="speculationrules">
{
  "prerender_until_script": [{
    "where": { "href_matches": "/*" }
  }],
  "prefetch": [{
    "where": { "href_matches": "/*" }
  }]
}
</script>
```

Chrome will handle this duplication without issue and execute the most appropriate rule for each eagerness setting.

Alternatively you could use these with different eagerness levels, to eagerly prefetch, and then upgrade to prerender until script with more signals [as suggested previously with prefetch/prerender](https://developer.chrome.com/docs/web-platform/implementing-speculation-rules.md.txt#prefetch_common_pages_to_improve_non-eager_prerenders):

```javascript
<script type="speculationrules">
{
  "prefetch": [{
    "where": { "href_matches": "/*" },
    "eagerness": "eager"
  }],
  "prerender_until_script": [{
    "where": { "href_matches": "/*" },
    "eagerness": "moderate"
  }]
}
</script>
```

Note you cannot upgrade a prerender until script to a full prerender in this manner, but let us know if that's a pattern you're interested in Chrome supporting by [starring this bug](https://crbug.com/477974765).

## Is all JavaScript paused?

No, only `<script>` elements cause the parser to be paused. This means inline script handlers (for example `onload`) or `javascript:` URLs won't cause a pause and may execute.

For example, this can log `Hero image is now loaded` to the console before the page is navigated to:

```javascript

```

Whereas if the event listener is added with a `<script>`, then `Hero image is now loaded` won't be logged to the console until after the page is activated:

```javascript

<script>
  const heroImage = document.querySelector('#hero-image');
  if (heroImage.complete) {
        console.log('Hero image is now loaded');
  } else {
    heroImage.addEventListener('load',
      (event) => {
        console.log('Hero image is now loaded');
      }
    );
  }
</script>
```

This may seem counter-intuitive, but in many cases (like in the previous example!) it is likely better to take the action immediately and delaying it may lead to more unexpected complications.

Additionally, most inline events require a user action (for example, `onclick`, `onhover`) and so won't be executed until the user can interact with the page.

Finally, prior blocking scripts will pause the parser and so prevent the inline event handlers being discovered. So this won't load the message to the console until activation, despite being an inline event handler:

```javascript
<script>...</script>
```

This is especially relevant for inline script handlers that use previously defined code, which will continue to work as expected:

```javascript
<script>
imageLoadFunction() = {
   ...
}
</script>

```

## What about scripts with `async` and `defer` attributes?

Scripts with `async` and `defer` attributes are delayed until activation but won't block the parser from continuing to process the rest of the page. The scripts are downloaded but not executed until the page is navigated to.

## How to enable prerender until script?

prerender until script is a new option we're working on, and that is subject to change, so is not available for use without enabling it first to opt in.

It can be enabled locally for developer with the `chrome://flags/#prerender-until-script` Chrome flag or with the `--enable-features=PrerenderUntilScript` command line flag.

prerender until script is also now available [as an origin trial from Chrome 144](https://developer.chrome.com/origintrials#/view_trial/881016677104353281). [Origin trials](https://developer.chrome.com/docs/web-platform/origin-trials.md.txt) allow site owners to enable a feature on their sites for real users to make use of the feature without having to manually enable it. This allows the impact of the feature to be measured on real users to ensure it acts as expected.

## Take it for a test run and share your feedback

We're really excited about this proposed addition to the Speculation Rules API and encourage site owners to take it for a test run.

Share your feedback on the proposal on the [GitHub repo](https://github.com/WICG/nav-speculation/issues). For feedback on Chrome's implementation, file [a Chromium bug](https://issues.chromium.org/issues/new?component=1457018&template=0).
