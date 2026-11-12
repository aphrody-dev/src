# Lighthouse 13.6.0 (repo @3e50684, 2026-11-11, Apache-2.0, see LICENSE-lighthouse.txt)

Run: `bun x lighthouse@13.6.0 <url> [flags]` (Node >=22.19). Browser binary: `CHROME_PATH`.

| Flag | Use |
|---|---|
| `--chrome-flags="--headless --no-sandbox"` | headless / containers |
| `--port=<n>` `--hostname` | attach to a running browser (CDP) |
| `--preset=desktop\|perf\|experimental` | built-in config |
| `--form-factor`, `--screenEmulation.disabled` | emulation |
| `--only-categories` / `--only-audits` / `--skip-audits` | scope |
| `--throttling-method=simulate\|devtools\|provided`, `--throttling.cpuSlowdownMultiplier` | throttling (default simulate, Lantern) |
| `--output=json --output=html --output-path=<p>` | reports (`stdout` ok) |
| `--max-wait-for-load`, `--blocked-url-patterns`, `--extra-headers`, `--disable-storage-reset` | load control |
| `-G` / `-A` | gather artifacts / audit saved artifacts |
| `--url-file`, `--fail-fast` | batch |
| `--list-all-audits` | audit ids for this version |

Categories: performance, accessibility, best-practices, seo, agentic-browsing (fraction score: agent-accessibility-tree, webmcp-form-coverage, webmcp-registered-tools, webmcp-schema-validity, llms-txt, ard-schema).

Perf weights: TBT 30, LCP 25, CLS 25, FCP 10, SI 10, INP 0. Log-normal scoring with `p10`/`median` per form factor (core/audits/metrics/*.js; LCP mobile 2500/4000, desktop 1200/2400). docs/scoring.md.

Insights (weight 0, `<id>-insight`): cache, cls-culprits, document-latency, dom-size, duplicated-javascript, font-display, forced-reflow, image-delivery, inp-breakdown, lcp-breakdown, lcp-discovery, legacy-javascript, modern-http, network-dependency-tree, render-blocking, third-parties, viewport.
Diagnostics: unused-javascript, unused-css-rules, unminified-css/javascript, total-byte-weight, bootup-time, mainthread-work-breakdown, long-tasks, non-composited-animations, unsized-images, bf-cache, user-timings.
Best practices: is-on-https, redirects-http, csp-xss, has-hsts, origin-isolation, clickjacking-mitigation, trusted-types-xss, geolocation-on-start, notification-on-start, paste-preventing-inputs, image-aspect-ratio, image-size-responsive, doctype, charset, baseline, js-libraries, deprecations, third-party-cookies, errors-in-console, valid-source-maps, inspector-issues.
SEO: is-crawlable, document-title, meta-description, http-status-code, link-text, crawlable-anchors, robots-txt, image-alt, hreflang, canonical, structured-data.

Node API with Puppeteer (docs/puppeteer.md, docs/user-flows.md):
```js
import puppeteer from 'puppeteer-core';
import lighthouse, {startFlow} from 'lighthouse';
const browser = await puppeteer.launch({executablePath: process.env.CHROME_PATH, headless: true});
const page = await browser.newPage();
const r = await lighthouse(url, {output: 'json', onlyCategories: ['performance']}, undefined, page);
// lab INP: timespan flow
const flow = await startFlow(page);
await flow.navigate(url);
await flow.startTimespan(); await page.click('button'); await flow.endTimespan();
await flow.snapshot();
await Bun.write('flow.html', await flow.generateReport());
```
Modes: navigation (page load), timespan (interactions: INP, post-load CLS), snapshot (current DOM: a11y, state).

Variability (docs/variability.md): >=3 runs, median, quiet host, same Chrome build. Lighthouse CI (`@lhci/cli`) for budgets: not verified here.

fr1 bench gotchas (docs/bench/REPORT.md, 2026-11-12): cef-156 "Failed to create a page for context", electron-43 "Target.createTarget: Not supported", lightpanda/obscura "session not found", helium 2/3 ok (FAILED_DOCUMENT_REQUEST).
