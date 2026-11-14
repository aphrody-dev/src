---
name: web-quality
description: Measure and fix web performance and quality with Lighthouse 13.6, Core Web Vitals (web-vitals 6.2.3) and modern web best practices, and check feature support/Baseline with MDN browser-compat-data. Use when the user says "lighthouse", "audit the page", "Core Web Vitals", "LCP / INP / CLS / TTFB / TBT", "page is slow", "perf score", "web-vitals", "attribution", "Baseline", "can I use", "browser support", "best practices", "accessibility/SEO audit", or runs headless benches (chrome-headless-shell) on fr1.
---

# web-quality

Versions verified 2026-11-12 from local clones (C:\src\third_party\web): lighthouse 13.6.0 @3e50684, web-vitals 6.2.3 @94b3b4b, modern-web-guidance @4dd9683, browser-compat-data 8.1.8 @e665ba4. Lighthouse needs Node >=22.19 (package.json engines).

## Thresholds (p75 of page loads, mobile and desktop split)

| Metric | Good      | Poor     | Kind                  | Source                                           |
| ------ | --------- | -------- | --------------------- | ------------------------------------------------ |
| LCP    | <=2500 ms | >4000 ms | CWV, loading          | web-vitals src/onLCP.ts; web.dev/articles/vitals |
| INP    | <=200 ms  | >500 ms  | CWV, responsiveness   | src/onINP.ts                                     |
| CLS    | <=0.1     | >0.25    | CWV, visual stability | src/onCLS.ts                                     |
| FCP    | <=1800 ms | >3000 ms | diagnostic            | src/onFCP.ts                                     |
| TTFB   | <=800 ms  | >1800 ms | diagnostic            | src/onTTFB.ts                                    |

Lab vs field: Lighthouse has no real INP in navigation mode (weight 0); use TBT as the lab proxy, and timespan user flows or field data for INP.

Lighthouse 13 perf score weights (core/config/default-config.js): TBT 30, LCP 25, CLS 25, FCP 10, SI 10, INP 0. Insights (`*-insight`) have weight 0: they are diagnostics, not score.

## Run Lighthouse against chrome-headless-shell

```sh
bun x lighthouse@13.6.0 https://google.com \
  --chrome-flags="--headless --no-sandbox" \
  --preset=desktop --only-categories=performance \
  --output=json --output=html --output-path=./lh/site \
  --quiet
# binary: CHROME_PATH=/path/to/chrome-headless-shell (CfT, e.g. chs-stable 157.0.8103.78 on fr1)
```

- Already-running browser: launch it with `--remote-debugging-port=9222`, then `lighthouse <url> --port=9222`.
- Programmatic (Puppeteer): `lighthouse(url, {output:'json'}, undefined, page)`; see references/lighthouse.md.
- Median of >=3 runs, fresh process each run (Lighthouse docs/variability.md). Flag `--throttling-method=provided` only when you control the network.
- Categories: performance, accessibility, best-practices, seo, agentic-browsing (new in 13.x: agent a11y tree, WebMCP, llms.txt).
- Engines that failed in our bench (docs/bench/REPORT.md): cef-156, electron-43, lightpanda, obscura (no Target.createTarget or session). helium 2/3 (FAILED_DOCUMENT_REQUEST). Use chs-stable, chs-canary, brave-nightly or pw-chromium.

Our reference numbers (fr1, 2026-11-12, desktop preset, median of 3, Next 16.5 app): chs-stable score 1.00, LCP 186 ms, TBT 0, CLS 0. Real sites on pw-chromium (1 run): nextjs.org 0.83, vercel.com 0.82 (LCP 1736 ms), react.dev 0.93, developers.cloudflare.com 0.99.

## Inject web-vitals (field or bench)

```js
import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals/attribution"; // +~1.5 KB brotli vs standard build
const send = (m) =>
  navigator.sendBeacon(
    "/rum",
    JSON.stringify({
      name: m.name,
      value: m.value,
      rating: m.rating,
      id: m.id,
      nav: m.navigationType,
      attr: m.attribution,
    }),
  );
onLCP(send);
onINP(send);
onCLS(send);
onFCP(send);
onTTFB(send);
```

- Call each `on*` once per page (each creates a PerformanceObserver). `reportAllChanges:true` only for debugging.
- Bench injection (Puppeteer): `page.addScriptTag({url: 'https://unpkg.com/web-vitals@6/dist/web-vitals.attribution.iife.js'})` or self-host the dist file (preferred); read values after a `visibilitychange`/hide, or with `reportAllChanges`. Our bench injected 6.2.3 after load: LCP/FCP/CLS ok, INP needs a real interaction.
- Attribution fields per metric: references/web-vitals.md.

## Top fixes per metric

LCP (break down via attribution: TTFB, resourceLoadDelay, resourceLoadDuration, elementRenderDelay; fix the largest part)

- LCP image discoverable in HTML: `<img fetchpriority="high">`, no `loading="lazy"` on it, no JS/CSS-background-only discovery. Guides: performance/optimize-image-priority, optimize-preload-priority.
- Cut TTFB: CDN/edge cache, streaming HTML (performance/out-of-order-html-streaming), 103 Early Hints.
- Remove render-blocking CSS/JS (`defer`/`type=module`, inline critical CSS); responsive AVIF/WebP with `srcset`/`sizes`.
- Next-page loads: Speculation Rules prerender (performance/improve-next-page-load-performance).

INP (attribution: inputDelay, processingDuration, presentationDelay; longAnimationFrameEntries)

- Break up long tasks, yield: `scheduler.yield()` with fallback (performance/break-up-long-tasks, schedule-tasks-by-priority).
- Do minimal work in the handler, paint first, defer the rest (performance/interaction-paint-timing, identify-inp-causes).
- Shrink DOM/style recalc: `content-visibility:auto` (defer-rendering-heavy-content), avoid forced reflow (lighthouse forced-reflow-insight).
- Audit third parties (third-parties-insight, identify-heavy-scripts).

CLS (attribution: largestShiftTarget, largestShiftTime, loadState)

- `width`/`height` or `aspect-ratio` on img/video/iframe/ads (unsized-images audit).
- Reserve space for late content; never insert above existing content except on user input.
- Fonts: `font-display` + `size-adjust`/metric overrides (font-display-insight).
- Animate `transform`/`opacity` only (non-composited-animations). Keep pages bfcache-eligible (bf-cache audit).

TTFB/FCP: server caching, fewer redirects, preconnect to critical origins, HTTP/2-3 (modern-http-insight).

## Feature support and Baseline

- Baseline: Newly available = in all core browsers (Chrome, Edge, Firefox, Safari, desktop+mobile); Widely available = 30 months after Newly (web.dev/baseline). Default policy: Widely available is safe without fallback.
- Quick BCD lookup (local clone, raw JSON; key path = file path):

```sh
bun -e 'const j=await Bun.file("C:/src/third_party/web/mdn_browser-compat-data/css/properties/anchor-name.json").json();const c=j.css.properties["anchor-name"].__compat;console.log(c.status,Object.fromEntries(["chrome","edge","firefox","safari","safari_ios","chrome_android"].map(b=>[b,[c.support[b]].flat()[0]?.version_added])),c.tags)'
```

- `tags: ["web-features:<id>"]` links BCD to web-features, which holds the Baseline status (BCD itself has none). Lighthouse `baseline` audit (best-practices) lists features the page uses with status.
- Details, paths, statuses: references/bcd.md.

## Best-practice guides

Search the modern-web-guidance corpus (accessibility, css, forms, html, js, performance, privacy, pwa, security, ui-*, wasm, webmcp, built-in-ai) before writing UI/CSS/client JS. Catalog and usage: references/modern-web-guidance.md.

## References

- references/lighthouse.md: CLI flags, categories, audit ids, user flows, CI.
- references/web-vitals.md: API, Metric object, attribution fields.
- references/bcd.md: BCD layout and queries.
- references/modern-web-guidance.md: guide catalog.
- Licenses: references/LICENSE-*.txt (Apache-2.0 lighthouse, web-vitals, modern-web-guidance; CC0 BCD data).
