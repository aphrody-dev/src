---
source_url: https://web.dev/articles/performance-audit-share
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:12+00:00
sha256: 96879440272e0395c03ae4a7d4bfc246c12fafa9964417fd761fe08df90f04e0
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Sam Dutton [X](https://twitter.com/sw12) [GitHub](https://github.com/samdutton) [Mastodon](https://techhub.social/@samdutton) [Bluesky](https://bsky.app/profile/samdutton.bsky.social) [Homepage](https://samdutton.com)

Once you've audited a site, make sure to package the results in a digestible form.

- Consider producing different reports for different stakeholders.
- Focus on business needs and show how technical metrics support these.
- Start with a summary.
- Structure data by topic (such as load performance and page weight) rather than simply listing tool output data.
- Order results by priority.
- Leave out results if they're not relevant or interesting.
- Where possible present numerical data as charts or graphs.
- Avoid a wall of data --- site reviews should not be boring.   

**Be sensitive to the people on the receiving end of your audit.**

Those working on a site may be well aware of problems. There may be complex, non-technical
reasons why problems haven't been fixed.

It's much more helpful to describe poor performance in terms of opportunities and solutions,
rather than simply listing a catalog of failures.

Wherever possible, talk to site developers and other stakeholders before presenting your
findings more widely.

## Provide context

When sharing review results you may want to include contextual data to justify effort and motivate
developers or other stakeholders to implement improvements you suggest --- such as the following from
[DoubleClick](https://www.doubleclickbygoogle.com/articles/mobile-speed-matters/):

- 53% of users abandon sites that take longer than three seconds to load.
- Mobile sites load in 5 seconds earn up to 2x more mobile ad revenue.
- The average load time for mobile sites is 19 seconds.

There is a comprehensive list of business reasons for improving performance on
[neotys.com](http://www.neotys.com/blog/how-to-talk-about-performance-testing-with-ceos-and-business-managers/).
More information about how to improve site performance is available from
[perf.rocks](http://perf.rocks/articles) and
[Web Fundamentals](https://web.dev/web/fundamentals/performance), along with case
studies and success stories.

If you don't have a [performance budget](https://infrequently.org/2017/10/can-you-afford-it-real-world-web-performance-budgets), now is the time! [Calculate
a budget](https://www.performancebudget.io/) and show how your site weighs up.

## Demonstrate potential

Chrome DevTools [Local Overrides](https://t.co/0a56PgKlPv) allow you to override
website assets with local versions. This can be a great way to show how simple changes can make a
big difference.

For example:

- Create a version of the CSS used by a site's homepage, with redundant rules removed.
- Change HTML to defer JavaScript loading.
- Replace image files with optimized versions.

You can even share changed files with developers working on a site, to enable them to demonstrate
potential improvements directly to their colleagues. Local Overrides also makes it simple to create
side-by-side screencasts showing performance differences between optimized and unoptimized versions.
This approach can be much more compelling than a lengthy todo list! Find out how to use Local
Overrides [here](https://glebbahmutov.com/blog/local-overrides/).
