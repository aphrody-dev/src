---
source_url: https://web.dev/articles/performance-budgets-with-the-angular-cli
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:40+00:00
sha256: f626f5f5aa9cac9e789216c45879682c64d190d5c157a7b2dff0ae9de2f3d3de
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Monitor the sizes of your bundles over time to make sure your application stays fast.

Minko Gechev [X](https://twitter.com/mgechev) [GitHub](https://github.com/mgechev) [Homepage](https://blog.mgechev.com/)

Optimizing an Angular application is important, but how do you make sure its performance doesn't regress over time? By introducing performance metrics and monitoring them on each code change!

One important metric is the size of the JavaScript shipped with your application. By introducing a [performance budget](https://web.dev/articles/performance-budgets-101.md.txt) that you monitor on each build or pull request, you can make sure your optimizations persist over time.

## Calculate your performance budget

You can use [this online budget calculator](https://bit.ly/perf-budget-calculator) to estimate how much JavaScript your app can afford to load, depending on the [Time to Interactive](https://web.dev/articles/tti.md.txt) you're aiming for.

## Configure a performance budget in the Angular CLI

Once you have a target JavaScript budget, you can enforce it using the [Angular command line interface (CLI)](https://cli.angular.io/). To see how that works, check out [this sample app on GitHub](https://github.com/mgechev/budgets-web-dev/blob/master/angular.json#L33-L38).

You'll see that the following budget has been configured in `angular.json`:

```json
"budgets": [{
  "type": "bundle",
  "name": "main",
  "maximumWarning": "170kb",
  "maximumError": "250kb"
}]
```

Here's a summary of what's being specified:

- There's a budget for a JavaScript bundle called `main`.
- If the `main` bundle gets bigger than 170 KB, the Angular CLI will show a warning in the console when you build the app.
- If the `main` bundle gets bigger than 250 KB, the build will fail.

Now try building the app by running `ng build --prod`.

You should see this error in the console:

To fix the build error, take a look at `app.component.ts`, which includes an import from `rxjs/internal/operators`. This is a private import that's not supposed to be used by consumers of `rxjs`. It increases the bundle size a lot! When you update to the correct import, `rxjs/operators`, and run the build again, you'll see that it passes the budget check successfully.

Note that, since [differential loading](https://dev.to/lacolaco/differential-loading-a-new-feature-of-angular-cli-v8-4jl) is enabled by default in the Angular CLI, the `ng build` command produces two builds of the app:

- A build for browsers _with_ ECMAScript 2015 support. This build includes fewer polyfills and more modern JavaScript syntax. That syntax is more expressive, which leads to smaller bundles.
- A build for older browsers _without_ ECMAScript 2015 support. The older syntax is less expressive and requires more polyfills, which leads to larger bundles.

The `index.html` file of the sample app refers to both builds so that modern browsers can take advantage of the smaller ECMAScript 2015 build and older browsers can fall back to the ECMAScript 5 build.

## Enforce your budget as part of continuous integration

[Continuous integration (CI)](https://en.wikipedia.org/wiki/Continuous_integration) offers a convenient way to monitor the budget of your app over time. And, luckily, the quickest way to set that up is to build your app with the Angular CLI---no extra steps required! Whenever the JavaScript bundle exceeds the budget, the process will exit with code 1, and the build will fail.

If you prefer, you can also enforce a performance budget using [bundlesize](https://github.com/siddharthkp/bundlesize) and [Lighthouse](https://web.dev/articles/using-lighthouse-bot-to-set-a-performance-budget.md.txt). The main difference between performance budgets in the Angular CLI and Lighthouse is when the checks get performed. The Angular CLI performs the checks at build time, looking at the production assets and verifying their sizes. Lighthouse, however, opens the deployed version of the application and measures the asset size. Both approaches have their pros and cons. The check that Angular CLI performs is less robust but much faster since it's a single disk lookup. On the other hand, the LightWallet of Lighthouse can perform a very accurate check by considering dynamically loaded resources, but it needs to deploy and open the app each time it runs.

bundlesize is quite similar to the Angular CLI's budget check; the main difference is that bundlesize can show the check results directly in GitHub's user interface.

## Conclusion

Establish performance budgets with the Angular CLI to make sure your Angular app's performance doesn't regress over time:

1. Set a baseline for the resource size either by using a budget calculator or by following your organization's practices.
2. Configure size budgets in `angular.json` under `projects.[PROJECT-NAME].architect.build.configurations.production.budgets`
3. The budgets will be automatically enforced on each build with the Angular CLI.
4. Consider introducing budget monitoring as part of continuous integration (which can also be achieved with the Angular CLI).
