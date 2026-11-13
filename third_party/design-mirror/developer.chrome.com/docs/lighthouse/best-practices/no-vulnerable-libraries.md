---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/no-vulnerable-libraries
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:25+00:00
sha256: 219c4f86c06f5c93655504b86bb25bba2c84ab9e0e4943119fca32fe3c434069
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

> [!CAUTION]
> **Caution:** This audit was removed from [Lighthouse v10.0.0](https://github.com/GoogleChrome/lighthouse/releases/tag/v10.0.0) on February 9th 2023. For more information on the removal of this audit, see the relevant [GitHub pull request](https://github.com/GoogleChrome/lighthouse/pull/14194).

Intruders have automated web crawlers that can scan your site
for known security vulnerabilities.
When the web crawler detects a vulnerability,
it alerts the intruder.
From there,
the intruder just needs to figure out how to exploit the vulnerability on your site.

## How this Lighthouse audit fails

[Lighthouse](https://developer.chrome.com/docs/lighthouse/overview.md.txt) flags front-end JavaScript libraries with known security vulnerabilities:

To detect vulnerable libraries, Lighthouse:

- Runs [Library Detector For Chrome](https://www.npmjs.com/package/js-library-detector).
- Checks the list of detected libraries against [snyk's Vulnerability DB](https://snyk.io/vuln?packageManager=all).

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## Stop using insecure JavaScript libraries

Stop using each of the libraries that Lighthouse flags.
If the library has released a newer version that fixes the vulnerability,
upgrade to that version.
If the library hasn't released a new version or is no longer maintained,
consider using a different library.

Click the links in the **Library Version** column of your report to learn more about
each library's vulnerabilities.

## Resources

- [Source code for **Includes front-end JavaScript libraries with known security vulnerabilities** audit](https://github.com/GoogleChrome/lighthouse/blob/master/lighthouse-core/audits/dobetterweb/no-vulnerable-libraries.js)
- [snyk's Vulnerability DB](https://snyk.io/vuln?packageManager=all)
