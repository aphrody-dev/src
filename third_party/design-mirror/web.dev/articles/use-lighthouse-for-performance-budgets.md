---
source_url: https://web.dev/articles/use-lighthouse-for-performance-budgets
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:04+00:00
sha256: e8c66f394317717518b0742cfaa74996580e12a66bce82ad505aa6b11e06eb86
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Katie Hempenius [X](https://twitter.com/katiehempenius)

[Lighthouse](https://github.com/GoogleChrome/lighthouse) now supports performance budgets. This feature, known as LightWallet, can be set up in under five minutes and provides feedback on performance metrics and the size and quantity of page resources.

> [!IMPORTANT]
> **Key point:** While Lighthouse is an excellent tool for identifying performance improvement opportunities, it can't be stressed enough that Lighthouse is a tool that relies on [lab data](https://web.dev/articles/lab-and-field-data-differences.md.txt#lab_data). While lab data is an integral part of any performance improvement effort, comparing and contrasting that data with [field data](https://web.dev/articles/lab-and-field-data-differences.md.txt#field_data) collected from your website's actual users is key. Doing so will help you understand how the changes you make to your website affect real users.

## Install Lighthouse

LightWallet is available in the command line version of Lighthouse v5+.

To get started, install Lighthouse:

```bash
npm install -g lighthouse
```

## Create a budget

Create a file named `budget.json`. In this file add the following JSON:

```json
[
  {
    "path": "/*",
    "timings": [
      {
        "metric": "interactive",
        "budget": 3000
      },
      {
        "metric": "first-meaningful-paint",
        "budget": 1000
      }
    ],
    "resourceSizes": [
      {
        "resourceType": "script",
        "budget": 125
      },
      {
        "resourceType": "total",
        "budget": 300
      }
    ],
    "resourceCounts": [
      {
        "resourceType": "third-party",
        "budget": 10
      }
    ]
  }
]
```

This example `budget.json` file sets five separate budgets:

- A budget of 3000ms for Time to Interactive.
- A budget of 125 KB for the total amount of JavaScript on the page.
- A budget of 300 KB for the overall size of the page.
- A budget of 10 requests for the number of requests made to third-party origins.

For a complete list of supported performance metrics and resource types, refer to the [Performance Budgets](https://github.com/GoogleChrome/lighthouse/blob/master/docs/performance-budgets.md) section of the Lighthouse docs.

## Run Lighthouse

Run Lighthouse using the `--budget-path` flag. This flag tells Lighthouse the location of your budget file.

```bash
lighthouse https://example.com --budget-path=./budget.json
```

> [!NOTE]
> **Note:** **Note** : A budget file does not have to be named `budget.json`.

## View the results

If LightWallet has been configured correctly, the Lighthouse report will contain a **Budgets** section within the **Performance** category.

In the JSON version of the Lighthouse report, Lightwallet results can be found within the audit findings for the `performance-budget` audit.
