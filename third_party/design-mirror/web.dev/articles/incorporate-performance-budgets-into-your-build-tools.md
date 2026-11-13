---
source_url: https://web.dev/articles/incorporate-performance-budgets-into-your-build-tools
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 9fa871108469344defa78df566ac019c0fb93116738fc2f697f3d2319df9948d
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Milica Mihajlija [X](https://twitter.com/bibydigital) [GitHub](https://github.com/mihajlija) [Homepage](https://mihajlija.github.io/)

Once you've defined a performance budget, it's time to set up the build process
to keep track of it. There are a number of tools that let you define thresholds
for chosen performance metrics and warn you if you go over budget. Find out
how to choose one that best fits your needs and current setup. 🕵️‍♀️

## Lighthouse performance budgets

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) is an auditing tool that tests sites in a few key areas---performance, accessibility, best practices and how well your site performs as a progressive web application.

The [command line version](https://developer.chrome.com/docs/lighthouse/overview#cli) of Lighthouse (v5+) supports setting [performance budgets](https://web.dev/articles/use-lighthouse-for-performance-budgets.md.txt) based on:

- resource size
- resource count

You can set budgets for any of the following resource types:

- `document`
- `font`
- `image`
- `media`
- `other`
- `script`
- `stylesheet`
- `third-party`
- `total`

Budgets are set in a JSON file and after defining them the new "Over Budget" column tells you whether you're exceeding any limits.
 "Budgets" section in Lighthouse report

## Webpack performance hints

[Webpack](https://web.dev/articles/webpack.md.txt) is a powerful build tool for optimizing how your code is delivered to the users. It also supports setting performance budgets based on **asset size**.

Turn on [performance hints](https://webpack.js.org/configuration/performance/) in `webpack.config.js` to get command line warnings or errors when your bundle size grows over the limit. It's a great way to stay mindful about asset sizes throughout the development.

After the build step, webpack outputs a color-coded list of assets and their sizes. Anything over budget is highlighted in yellow.
 The highlighted bundle.js is bigger than your budget

The default limit for both assets and entry-points is **250 KB**. You can set your own targets in the configuration file.
 Webpack bundle size warning ⚠️

The budgets are compared against **uncompressed asset sizes** . Uncompressed [JavaScript size is related to the execution time](https://v8.dev/blog/cost-of-javascript-2019) and big files can take a long time to execute, especially on mobile devices.

> [!NOTE]
> **Note:** Compressed asset sizes affect the transfer time, which is very important on slow networks.

 Bonus feature: webpack won't only warn you, it will give you a recommendation on how to downsize your bundles. 💁

## Bundlesize

[Bundlesize](https://github.com/siddharthkp/bundlesize) is a simple npm package that tests asset size against a threshold you've set. It can run locally and integrate with your CI.

### Bundlesize CLI

Run [bundlesize CLI](https://github.com/siddharthkp/bundlesize#cli) by specifying a threshold and the file that you want to test.

```bash
bundlesize -f "dist/bundle.js" -s 170kB
```

Bundlesize outputs color-coded test results in one line.
 Failing bundlesize CLI test ❌  Passing bundlesize CLI test ✔️

### Bundlesize for CI

You'll get the most value out of bundlesize if you integrate it with a CI to automatically enforce size limits on pull requests. **If bundlesize test fails, that pull request is not merged.** It works for pull requests on GitHub with [Travis CI](https://travis-ci.org/), [CircleCI](https://circleci.com/), [Wercker](http://www.wercker.com/), and [Drone](http://readme.drone.io/).
 Bundlesize check status on GitHub

You may have a fast app today, but adding new code can often change this. Checking pull requests with bundlesize will help you avoid performance regressions. Bootstrap, Tinder, Trivago and many others use it to keep their budgets in check.

With bundlesize, it's possible to set thresholds for each file separately. This is especially useful if you are splitting a bundle in your application.

By default, **it tests gzipped asset sizes** . You can use the compression option to switch to [brotli compression](https://css-tricks.com/brotli-static-compression/) or turn it off completely.

## Lighthouse Bot

[Lighthouse Bot](https://github.com/ebidel/lighthouse-ci) integrates with Travis CI and enforces budgets based on any of the five Lighthouse audit categories. For example, a budget of 100 for your Lighthouse performance score. It's sometimes simpler to keep an eye on a single number than individual asset budgets and Lighthouse scores take many things into account.
 Lighthouse scores 💯

Lighthouse Bot runs an audit after you deploy a site to staging server. In `.travis.yml` set budgets for particular Lighthouse categories with `--perf`, `--a11y`, `--bp`, `--seo` or `--pwa` options. Aim to stay in the green zone with scores of at least 90.

```
after_success:
  - ./deploy.sh # Deploy the PR changes to staging server
  - npm run lh -- --perf=96 https://staging.example.com # Run Lighthouse test
```

If the scores for a pull request on GitHub fall below the threshold you've set, **Lighthouse Bot can prevent pull request from being merged**. ⛔
 Lighthouse Bot check status on GitHub

**Lighthouse Bot** then comments on your pull request with updated scores. This is a neat feature which encourages conversation about performance as code changes are happening.
 Lighthouse reporting scores on pull request 💬

If you find your pull request blocked by a poor Lighthouse score, run an audit with [Lighthouse CLI](https://developer.chrome.com/docs/lighthouse/overview#cli) or in [Dev Tools](https://developer.chrome.com/docs/lighthouse/overview#devtools). It generates a report with details about bottlenecks and hints for simple optimizations.

## Summary

| Tool | CLI | CI | Summary |
|---|---|---|---|
| Lighthouse | ✔️ | ❌ | - Budgets for different types of resources based on their size or count. |
| webpack | ✔️ | ❌ | - Budgets based on sizes of assets generated by webpack. - Checks uncompressed sizes. |
| bundlesize | ✔️ | ✔️ | - Budgets based on sizes of specific resources. - Checks compressed or uncompressed sizes. |
| Lighthouse Bot | ❌ | ✔️ | - Budgets based on Lighthouse scores. |
