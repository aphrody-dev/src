---
source_url: https://developer.chrome.com/docs/lighthouse/best-practices/errors-in-console
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:32+00:00
sha256: bd67502061b746b377880cbcce4bf9b6831bd9748112e2c34ea40a5b77eacdbb
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
Most browsers ship with built-in developer tools.
These developer tools usually include a [console](https://developer.chrome.com/docs/devtools/console.md.txt).
The console gives you information about the page that's currently running.

Messages logged in the console come from
either the web developers who built the page
or the browser itself.
All console messages have a severity level:
`Verbose`, `Info`, `Warning`, or `Error`.
An `Error` message means there's a problem on your page that you need to resolve.

## How the Lighthouse browser error audit fails

Lighthouse flags all browser errors logged to the console:
 Lighthouse audit showing browser errors in the console.

> [!NOTE]
> **Note:** Each Best Practices audit is weighted equally in the Lighthouse Best Practices Score. Learn more in [The Best Practices
> score](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring#best-practices).

## How to fix browser errors

Fix each browser error that Lighthouse reports
to ensure that your page runs as expected for all your users.

Chrome DevTools includes a couple tools
to help you track down the cause of errors:

- Beneath the text of each error, the DevTools Console shows the [call stack](https://developer.mozilla.org/docs/Glossary/Call_stack) that caused the problematic code to execute.
- A link at the top-right of each error shows you the code that caused the error.

For example, this screenshot shows a page with two errors:
 An example of errors in the Chrome DevTools Console.

In the example, the first error comes from a web developer from a call to
[`console.error()`](https://developer.chrome.com/docs/devtools/console/api.md.txt#error).
The second error comes from the browser and
indicates that a variable used in one of the page's scripts does not exist.

Beneath the text of each error,
the DevTools Console indicates the call stack in which the error appears.
For example, for the first error the Console indicates
that an `(anonymous)` function called the `init` function,
which called the `doStuff` function.
Clicking the `pen.js:9` link in the top-right of that error
shows you the relevant code.

Reviewing the relevant code for each error in this way can help you identify
and resolve possible problems.

If you can't figure out the cause of an error, try entering the error text
into a search engine.
If you can't find solutions to your problem,
try asking a question on [Stack Overflow](https://stackoverflow.com).

If you can't fix an error, consider wrapping it in a
[`try...catch`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Statements/try...catch)
statement to explicitly indicate in the code that you're aware of the issue.
You can also use the `catch` block to handle the error more gracefully.

## Resources

- [Source code for **Browser errors were logged to the console** audit](https://github.com/GoogleChrome/lighthouse/blob/main/core/audits/errors-in-console.js)
