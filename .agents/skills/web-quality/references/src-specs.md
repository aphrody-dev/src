# src normative specs: accessibility, SEO, Core Web Vitals

Folded from the former web-a11y-seo-cwv skill. Where a threshold differs from a generic audit, these src specs win.
Three specs are authoritative (sources web.dev, developer.chrome.com and w3.org/TR/WCAG22 read on 2026-11-13, stable ids, RFC 2119 levels):

| Spec          | Files                                                 | Id prefix    |
| ------------- | ----------------------------------------------------- | ------------ |
| Accessibility | `docs/design/specs/a11y/web.md` + `.json`             | `web.a11y.*` |
| SEO           | `docs/design/specs/seo/web.md` + `.json`              | `web.seo.*`  |
| Performance   | `docs/design/specs/perf/core-web-vitals.md` + `.json` | `web.cwv.*`  |

The JSON (schema `docs/design/specs/spec.schema.json`) is machine-readable: cite the rule id in reviews, commits and tests. Mirrored source texts: `third_party/design-mirror/{web.dev,developer.chrome.com}` (field `sources[].mirror`).

## Thresholds to know without opening the spec

- Field, p75, mobile and desktop separate: LCP ≤ 2500 ms, INP ≤ 200 ms, CLS ≤ 0.1 (poor: > 4000 ms, > 500 ms, > 0.25). FCP ≤ 1800 ms and TTFB ≤ 800 ms as diagnostics. FID is no longer a target.
- Main thread: no task > 50 ms; yield via `scheduler.yield()` with fallback.
- Contrast 4.5:1 (text), 3:1 (large text, essential icons, components); pointer target ≥ 24 × 24 CSS px (WCAG 2.5.8), 48 px aimed for touch.
- LCP image: never `loading="lazy"`, `fetchpriority="high"`, discoverable in the HTML; never an `unload` listener (bfcache).

## Procedure

1. Read the spec of the affected domain; apply every MUST, justify in writing any SHOULD set aside.
2. Measure: Lighthouse 13 (Accessibility, SEO categories, performance insights) and axe-core in CI; locally, MCP `chrome-devtools` (`lighthouse_audit`, `performance_start_trace`).
3. Complete with the manual audits listed in `web.a11y.test-manual` (keyboard, focus, screen reader).
4. In production: RUM with the web-vitals library + LoAF, in addition to CrUX (`web.cwv.crux-plus-rum`).
5. A rule without a source or a new threshold: reread the page live (`curl -sL -H "Accept: text/markdown" <url>`), update the JSON then the `.md`, report any conflict in the "Conflicts" section of the spec.

## Neighbouring skills

- `modern-web-guidance:modern-web-guidance`: current HTML/CSS/JS APIs; consult for implementation, then check against the ids above.
- `cloudflare:web-perf`: performance diagnosis of sites on Cloudflare.
- `ui-system`: UI targets, tokens, components; `webgpu-wasm-ui`: GPU and wasm rendering in the browser.

## Forbidden

- Copying a passage from web.dev, developer.chrome.com or WCAG into the repository: rephrase and cite the URL (WCAG: criterion number).
- Asserting a threshold, a browser support or a version without a page read in the session.
