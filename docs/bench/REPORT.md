# Headless engine benchmark, Aphrody Labs (fr1, 2026-11-12)

Host: fr1 (Ubuntu 26.10, kernel 7.3, x86_64, 12 cores, 45 GB). Harness: `~/browser-bench/harness` (TypeScript on Bun 1.4.4). Every measurement was run 3 times, each on a fresh browser process, and the tables report the median. Raw data: `results/main.json`, `pw-chromium.json`, `embed.json`, `lighthouse.json`, `lighthouse-cef.json`, `driver-compat.json`.

## Method

- Drivers: Puppeteer-core 25.17.0 over CDP for the Chromium family, Lightpanda, Obscura, CEF and Electron. Puppeteer over WebDriver BiDi for Firefox Nightly and Zen. Playwright-core 1.65.0 for its own chromium, firefox and webkit builds. Raw WebDriver classic for Servo. agent-browser runs only through its CLI (`open`, `eval`, `click`, `close`) on chs-stable.
- Load time is the time until `goto(waitUntil: load)` returns. Networkidle comes from Puppeteer `waitForNetworkIdle(500 ms)` or Playwright `networkidle`. DCL and TTFB come from Navigation Timing. LCP, FCP and CLS come from web-vitals 6.2.3, injected after load. INP needs real interaction and is not reported.
- Peak RSS and CPU are sampled every 100 ms from /proc, summed over every process whose exe lives in the engine directory. Xvfb is not counted for CEF and Electron.
- Cold start is spawn until the driver is ready (CDP /json/version plus connect, WebDriver /status plus session, or the first `agent-browser open`).
- A: 12 public sites, 3 GETs per site per engine, no login. Success means the load did not error and the expected text was found in the body or title.
- B: a local app built on Next.js 16.5.0-canary.48 and React 19.3 canary: RSC, Suspense streaming of 200 rows with an 800 ms delay, `useActionState` server action, next/image, `<Link>` client navigation. It was built once with Node 24.22.3 and served by `next start`, once on Node 24.22.3 and once on `bun --bun`. vercel/commerce (needs Shopify credentials) and next-forge (needs Clerk and other SaaS keys) were not used.
- C: a local page with the official Turnstile test sitekeys. The 3x interactive widget is never clicked. "Rendered with no callback" is the expected result: the widget is waiting for a human.
- D: a local probe page with COOP/COEP: 45 web, ES and CSS features plus layout checks, wasm-feature-detect 1.x, and navigator.gpu.
- Lighthouse 13.6.0 (performance, desktop preset): 3 runs on the Next app. On the real sites it ran only on pw-chromium, and only once per site, to stay at or under 3 loads per site per engine (pw-chromium was not used for workload A).

## Versions tested

- Chrome for Testing chrome-headless-shell: Stable 157.0.8103.78, Canary 160.0.8156.0
- Brave Nightly v1.102.1 (Chromium 158.0.8127.22), Helium 0.21.2.1 (Chromium 157.0.8103.50)
- Lightpanda nightly 1.1.0-nightly.12036+a34d6993e (asset dated 2026-11-12)
- Obscura v0.2.6 (obscura-x86_64-linux, render build, not the stealth build)
- Firefox Nightly 162.0a1, BuildID 20261112010410, rev 3b0e7a18530e47dba0c56e2440d8f1fc4d5847fa; geckodriver 0.37.1 downloaded but not needed (BiDi)
- Zen 1.24.2b (Gecko 160.0, rev f384dac1c21f997ffe2ec389752fef8ecd9e4e04)
- Servo nightly 2026-11-11, servoshell 0.8.0-88b53c45f
- Playwright 1.65.0 builds: chromium_headless_shell-1254, firefox-1572, webkit-2388 (Ubuntu 26.04 fallback builds; WebKit needed `libmanette-0.2-0`, installed with apt)
- CEF 156.0.26+g8ea0c73+chromium-156.0.8078.88 (cefsimple from the client distribution)
- Electron 43.8.9 (Chromium 150.0.7871.250)
- agent-browser 0.42.0 (npm), Node 24.22.3, Bun 1.4.4, Next 16.5.0-canary.48, Lighthouse 13.6.0, Puppeteer-core 25.17.0, Playwright-core 1.65.0, web-vitals 6.2.3

### Engines

| engine          | version                                                                                                                                                                                   | size MB | cold start ms (med, all runs) |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------------------------- |
| chs-stable      | Google Chrome for Testing 157.0.8103.78                                                                                                                                                   | 276     | 142                           |
| chs-canary      | Google Chrome for Testing 160.0.8156.0                                                                                                                                                    | 284     | 130                           |
| brave-nightly   | Brave Browser Nightly 158.1.102.1 unknown                                                                                                                                                 | 491     | 431                           |
| helium          | Helium 0.21.2.1 (Chromium 157.0.8103.50)                                                                                                                                                  | 396     | 346                           |
| lightpanda      | 1.1.0-nightly.12036+a34d6993e                                                                                                                                                             | 74      | 44                            |
| obscura         | obscura 0.2.6                                                                                                                                                                             | 218     | 42                            |
| firefox-nightly | Version=162.0a1 BuildID=20261112010410 SourceStamp=3b0e7a18530e47dba0c56e2440d8f1fc4d5847fa BuildID=20261112010410 Milestone=162.0a1 SourceStamp=3b0e7a18530e47dba0c56e2440d8f1fc4d5847fa | 402     | 2143                          |
| zen             | Version=1.24.2b BuildID=20261111122308 SourceStamp=f384dac1c21f997ffe2ec389752fef8ecd9e4e04 BuildID=20261111122308 Milestone=160.0 SourceStamp=f384dac1c21f997ffe2ec389752fef8ecd9e4e04   | 413     | 2542                          |
| pw-firefox      | playwright-core 1.65.0 firefox-1572                                                                                                                                                       | 316     | 1440                          |
| pw-webkit       | playwright-core 1.65.0 webkit-2388                                                                                                                                                        | 253     | 353                           |
| servo           | Version: Servo 0.8.0-88b53c45f                                                                                                                                                            | 177     | 140                           |
| agent-browser   | agent-browser 0.42.0 on chs-stable                                                                                                                                                        | 127     | 517                           |
| pw-chromium     | playwright-core 1.65.0 chromium_headless_shell-1254                                                                                                                                       | 282     | 108                           |
| cef-156         | CEF 156.0.26+g8ea0c73+chromium-156.0.8078.88 (cefsimple under Xvfb)                                                                                                                       | 1521    | 503                           |
| electron-43     | Electron 43.8.9 Chromium 150.0.7871.250 (xvfb-run, hidden BrowserWindow)                                                                                                                  | 316     | 437                           |

### A. Real sites (12 sites x 3 loads; medians over per-site medians)

| engine          | sites ok (3/3) | sites ok (>=1/3) | load ms | networkidle ms | DCL ms | peak RSS MB | CPU s | LCP ms | FCP ms | CLS   |
| --------------- | -------------- | ---------------- | ------- | -------------- | ------ | ----------- | ----- | ------ | ------ | ----- |
| chs-stable      | 12/12          | 12/12            | 736     | 1088           | 676    | 622         | 2.08  | 540    | 428    | 0.000 |
| chs-canary      | 12/12          | 12/12            | 676     | 1015           | 469    | 620         | 2.16  | 456    | 372    | 0.000 |
| brave-nightly   | 12/12          | 12/12            | 658     | 1349           | 580    | 1102        | 2.95  | 484    | 468    | 0.000 |
| helium          | 10/12          | 12/12            | 11238   | 10567          | 704    | 2202        | 25.63 | 716    | 672    | 0.000 |
| lightpanda      | 12/12          | 12/12            | 388     | 629            | 218    | 72          | 0.55  | -      | -      | -     |
| obscura         | 12/12          | 12/12            | 1372    | 1639           | -      | 142         | 2.79  | -      | -      | -     |
| firefox-nightly | 12/12          | 12/12            | 712     | 1141           | 521    | 1104        | 6.29  | 563    | 457    | -     |
| zen             | 12/12          | 12/12            | 708     | 1338           | 417    | 1423        | 8.54  | -      | -      | -     |
| pw-firefox      | 12/12          | 12/12            | 984     | 1310           | 617    | 846         | 5.69  | 497    | 494    | -     |
| pw-webkit       | 11/12          | 11/12            | 998     | 2084           | 728    | 627         | 4.51  | 911    | 573    | -     |
| servo           | 6/12           | 10/12            | 635     | -              | 333    | 384         | 1.74  | -      | 489    | -     |
| agent-browser   | 12/12          | 12/12            | 709     | -              | 490    | 556         | 2.08  | 420    | 312    | 0.000 |
| cef-156         | 12/12          | 12/12            | 723     | 983            | 491    | 1128        | 3.61  | 376    | 352    | 0.000 |
| electron-43     | 12/12          | 12/12            | 517     | 846            | 462    | 581         | 1.78  | 308    | 308    | 0.000 |

Per-site success runs (x/3) and median load ms

| site           | chs-stable | chs-canary | brave-nightly | helium    | lightpanda | obscura  | firefox-nightly | zen      | pw-firefox | pw-webkit | servo    | agent-browser | cef-156  | electron-43 |
| -------------- | ---------- | ---------- | ------------- | --------- | ---------- | -------- | --------------- | -------- | ---------- | --------- | -------- | ------------- | -------- | ----------- |
| nextjs.org     | 3/3 599    | 3/3 576    | 3/3 586       | 3/3 11516 | 3/3 348    | 3/3 7000 | 3/3 712         | 3/3 699  | 3/3 655    | 3/3 599   | 0/3 635  | 3/3 811       | 3/3 575  | 3/3 395     |
| vercel.com     | 3/3 805    | 3/3 625    | 3/3 638       | 2/3 10542 | 3/3 388    | 3/3 2489 | 3/3 699         | 3/3 1123 | 3/3 673    | 3/3 809   | 3/3 725  | 3/3 709       | 3/3 629  | 3/3 517     |
| react.dev      | 3/3 706    | 3/3 693    | 3/3 810       | 3/3 10588 | 3/3 316    | 3/3 1543 | 3/3 722         | 3/3 701  | 3/3 1000   | 3/3 949   | 2/3 710  | 3/3 629       | 3/3 754  | 3/3 779     |
| cf-docs        | 3/3 736    | 3/3 676    | 3/3 644       | 3/3 12109 | 3/3 391    | 3/3 1307 | 3/3 599         | 3/3 708  | 3/3 984    | 3/3 1519  | 3/3 593  | 3/3 681       | 3/3 723  | 3/3 509     |
| web.dev        | 3/3 2725   | 3/3 2115   | 3/3 2145      | 2/3 14838 | 3/3 878    | 3/3 2257 | 3/3 1935        | 3/3 2165 | 3/3 2374   | 3/3 3144  | 2/3 1757 | 3/3 1969      | 3/3 2362 | 3/3 1842    |
| wikipedia      | 3/3 455    | 3/3 455    | 3/3 598       | 3/3 11238 | 3/3 187    | 3/3 742  | 3/3 466         | 3/3 503  | 3/3 725    | 3/3 2529  | 3/3 279  | 3/3 520       | 3/3 572  | 3/3 346     |
| github-repo    | 3/3 1204   | 3/3 1161   | 3/3 1377      | 3/3 15500 | 3/3 584    | 3/3 1612 | 3/3 1131        | 3/3 1076 | 3/3 1446   | 3/3 3060  | 3/3 965  | 3/3 1217      | 3/3 1151 | 3/3 1023    |
| hn             | 3/3 1084   | 3/3 988    | 3/3 956       | 3/3 11317 | 3/3 629    | 3/3 1372 | 3/3 943         | 3/3 1160 | 3/3 1076   | 3/3 998   | 2/3 1362 | 3/3 965       | 3/3 972  | 3/3 644     |
| mdn            | 3/3 515    | 3/3 486    | 3/3 658       | 3/3 462   | 3/3 138    | 3/3 483  | 3/3 476         | 3/3 474  | 3/3 610    | 3/3 437   | 2/3 284  | 3/3 384       | 3/3 312  | 3/3 236     |
| amazon-product | 3/3 524    | 3/3 350    | 3/3 495       | 3/3 408   | 3/3 212    | 3/3 256  | 3/3 396         | 3/3 349  | 3/3 460    | 0/3 341   | 3/3 372  | 3/3 339       | 3/3 288  | 3/3 249     |
| bbc-news       | 3/3 1631   | 3/3 1478   | 3/3 4223      | 3/3 11219 | 3/3 649    | 3/3 982  | 3/3 1186        | 3/3 858  | 3/3 1529   | 3/3 1183  | 3/3 736  | 3/3 1411      | 3/3 1423 | 3/3 1186    |
| youtube        | 3/3 1959   | 3/3 2033   | 3/3 4064      | 3/3 19516 | 3/3 2591   | 3/3 3412 | 3/3 1822        | 3/3 3234 | 3/3 3531   | 3/3 1992  | 0/3 151  | 3/3 2019      | 3/3 1778 | 3/3 1875    |

A failures (first error per engine/site)

- helium vercel.com: net::ERR_ABORTED at https://vercel.com/ | eval: Execution context was destroyed, most likely because of a navigation.
- helium web.dev: net::ERR_ABORTED at https://web.dev/ | eval: Execution context was destroyed, most likely because of a navigation.
- pw-webkit amazon-product: expected text not found (title="Page Not Found", textLen=5)
- servo nextjs.org: expected text not found (title="", textLen=70)
- servo react.dev: expected text not found (title="", textLen=0)
- servo web.dev: expected text not found (title="", textLen=0)
- servo hn: expected text not found (title="", textLen=0)
- servo mdn: expected text not found (title="", textLen=0)
- servo youtube: expected text not found (title="Error loading page", textLen=61)

### B. Next.js 16 canary app (RSC + Suspense streaming + server action + next/image + client nav), next start on Node 24 vs Bun

| engine          | runtime | ok runs | streamed | hydrated | click | server action | client nav | load ms | hydration ms | action ms | nav ms | LCP ms | peak RSS MB | CPU s |
| --------------- | ------- | ------- | -------- | -------- | ----- | ------------- | ---------- | ------- | ------------ | --------- | ------ | ------ | ----------- | ----- |
| chs-stable      | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 932     | 1            | 142       | 60     | 200    | 537         | 0.68  |
| chs-stable      | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 905     | 2            | 139       | 29     | 132    | 535         | 0.65  |
| chs-canary      | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 899     | 1            | 144       | 32     | 140    | 537         | 0.74  |
| chs-canary      | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 909     | 1            | 139       | 33     | 160    | 539         | 0.73  |
| brave-nightly   | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 937     | 3            | 133       | 66     | 124    | 1036        | 1.81  |
| brave-nightly   | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 920     | 1            | 169       | 72     | 236    | 1041        | 1.90  |
| helium          | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 890     | 1            | 148       | 147    | 480    | 2172        | 16.71 |
| helium          | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 865     | 2            | 139       | 48     | 504    | 2214        | 16.21 |
| lightpanda      | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 898     | 0            | 112       | 17     | -      | 46          | 0.19  |
| lightpanda      | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 918     | 0            | 120       | 113    | -      | 46          | 0.22  |
| obscura         | node    | 0/3     | 3/3      | 3/3      | 3/3   | 3/3           | 0/3        | 973     | 0            | 155       | -      | -      | 66          | 0.36  |
| obscura         | bun     | 0/3     | 3/3      | 3/3      | 3/3   | 3/3           | 0/3        | 964     | 0            | 151       | -      | -      | 66          | 0.36  |
| firefox-nightly | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 882     | 2            | 161       | 51     | 169    | 990         | 4.98  |
| firefox-nightly | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 881     | 2            | 154       | 59     | 170    | 994         | 4.84  |
| zen             | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 990     | 18           | 4100      | 7902   | -      | 1275        | 8.57  |
| zen             | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 968     | 2            | 4077      | 7917   | -      | 1299        | 7.78  |
| pw-firefox      | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 916     | 5            | 172       | 76     | 285    | 774         | 4.61  |
| pw-firefox      | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 975     | 8            | 157       | 92     | 300    | 774         | 4.72  |
| pw-webkit       | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 921     | 2            | 159       | 62     | 1016   | 476         | 1.16  |
| pw-webkit       | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 896     | 1            | 155       | 49     | 976    | 475         | 1.16  |
| servo           | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 936     | 1            | 40        | 50     | -      | 278         | 0.71  |
| servo           | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 939     | 13           | 58        | 141    | -      | 279         | 0.75  |
| agent-browser   | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 896     | 32           | 89        | 97     | 68     | 470         | 0.70  |
| agent-browser   | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 889     | 30           | 80        | 79     | 64     | 472         | 0.70  |
| pw-chromium     | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 827     | 1            | 152       | 128    | 68     | 458         | 0.67  |
| pw-chromium     | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 842     | 1            | 152       | 137    | 72     | 460         | 0.63  |
| cef-156         | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 841     | 1            | 136       | 127    | 80     | 1065        | 1.98  |
| cef-156         | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 872     | 1            | 129       | 42     | 96     | 1064        | 1.97  |
| electron-43     | node    | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 821     | 1            | 1133      | 1007   | -      | 522         | 0.90  |
| electron-43     | bun     | 3/3     | 3/3      | 3/3      | 3/3   | 3/3           | 3/3        | 829     | 1            | 1125      | 1015   | -      | 523         | 0.95  |

B failures

- obscura/node: Node is either not clickable or not an Element
- obscura/bun: Node is either not clickable or not an Element

next start time to first 200: Node 14240 ms, Bun 23097 ms (first launch, single sample)

### C. Cloudflare Turnstile, local page with official test sitekeys (expected: 1x success, 2x error, 3x widget rendered waiting for a human)

| engine          | 1x pass                   | 2x block                  | 3x interactive            | load ms (1x) |
| --------------- | ------------------------- | ------------------------- | ------------------------- | ------------ |
| chs-stable      | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 340          |
| chs-canary      | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 258          |
| brave-nightly   | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 470          |
| helium          | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 384          |
| lightpanda      | 0/3 no-callback(rendered) | 0/3 no-callback(rendered) | 3/3 no-callback(rendered) | 59           |
| obscura         | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 68           |
| firefox-nightly | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 301          |
| zen             | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 327          |
| pw-firefox      | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 649          |
| pw-webkit       | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 224          |
| servo           | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 110          |
| agent-browser   | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 284          |
| pw-chromium     | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 267          |
| cef-156         | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 244          |
| electron-43     | 3/3 success               | 3/3 error                 | 3/3 no-callback(rendered) | 286          |

### D. Feature probe (local page, COOP/COEP isolated)

| engine          | web features ok | missing                                                                                                                                      | simd | relaxedSimd | threads | gc  | exceptionsFinal | memory64 | jspi | tailCall | jsStringBuiltins | navigator.gpu | gpu adapter |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------- | ------- | --- | --------------- | -------- | ---- | -------- | ---------------- | ------------- | ----------- |
| chs-stable      | 45/45           | none                                                                                                                                         | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| chs-canary      | 44/45           | webgl                                                                                                                                        | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| brave-nightly   | 45/45           | none                                                                                                                                         | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| helium          | 45/45           | none                                                                                                                                         | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| lightpanda      | 39/45           | webgl, navigator.serviceWorker, es2026.Temporal, viewTransition, layout.grid.computed, layout.flex.computed                                  | y    | y           | n       | y   | y               | y        | y    | y        | y                | n             | n           |
| obscura         | 40/45           | CompressionStream, webgl, css.nesting, css.anchor, viewTransition                                                                            | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| firefox-nightly | 44/45           | webgl                                                                                                                                        | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| zen             | 44/45           | webgl                                                                                                                                        | y    | y           | y       | y   | y               | y        | y    | y        | y                | n             | n           |
| pw-firefox      | 44/45           | webgl                                                                                                                                        | y    | y           | y       | y   | y               | y        | y    | y        | y                | n             | n           |
| pw-webkit       | 45/45           | none                                                                                                                                         | y    | y           | y       | y   | y               | y        | y    | y        | y                | n             | n           |
| servo           | 36/45           | SharedArrayBuffer, IntersectionObserver, indexedDB, navigator.serviceWorker, css.subgrid, css.has, css.container, css.anchor, viewTransition | y    | y           | n       | y   | y               | y        | y    | y        | y                | n             | n           |
| agent-browser   | 45/45           | none                                                                                                                                         | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| pw-chromium     | 45/45           | none                                                                                                                                         | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| cef-156         | 44/45           | webgl                                                                                                                                        | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |
| electron-43     | 44/45           | webgl                                                                                                                                        | y    | y           | y       | y   | y               | y        | y    | y        | y                | y             | n           |

### Lighthouse 13 (performance, desktop preset), Next.js app on Node 24, median of 3

| engine        | ok runs | score | FCP ms | LCP ms | TBT ms | CLS   | TTFB ms | SI ms | error                                                |
| ------------- | ------- | ----- | ------ | ------ | ------ | ----- | ------- | ----- | ---------------------------------------------------- |
| chs-stable    | 3/3     | 1.00  | 186    | 186    | 0      | 0.000 | 19      | 352   |                                                      |
| chs-canary    | 3/3     | 1.00  | 178    | 178    | 0      | 0.000 | 9       | 341   |                                                      |
| brave-nightly | 3/3     | 1.00  | 178    | 178    | 0      | 0.000 | 7       | 340   |                                                      |
| helium        | 2/3     | 0.90  | 178    | 178    | 0      | 0.000 | 15      | 4864  | FAILED_DOCUMENT_REQUEST                              |
| pw-chromium   | 3/3     | 1.00  | 200    | 200    | 10     | 0.000 | 25      | 447   |                                                      |
| cef-156       | 0/3     | -     | -      | -      | -      | -     | -       | -     | Failed to create a page for context (id = undefined) |
| electron-43   | 0/3     | -     | -      | -      | -      | -     | -       | -     | Protocol error (Target.createTarget): Not supported  |
| lightpanda    | 0/1     | -     | -      | -      | -      | -     | -       | -     | session SID-2 not found                              |
| obscura       | 0/1     | -     | -      | -      | -      | -     | -       | -     | session page-1-session-1 not found                   |

Lighthouse on real sites (pw-chromium headless shell, 1 load per site)

| site                                            | score | FCP ms | LCP ms | TBT ms | CLS   | TTFB ms | error                    |
| ----------------------------------------------- | ----- | ------ | ------ | ------ | ----- | ------- | ------------------------ |
| nextjs.org/                                     | 0.83  | 356    | 721    | 379    | 0.000 | 4       |                          |
| vercel.com/                                     | 0.82  | 671    | 1736   | 226    | 0.000 | 4       |                          |
| react.dev/                                      | 0.93  | 291    | 291    | 212    | 0.000 | 5       |                          |
| developers.cloudflare.com/                      | 0.99  | 338    | 615    | 8      | 0.025 | 47      |                          |
| web.dev/                                        | 0.88  | 909    | 1527   | 125    | 0.100 | 285     |                          |
| en.wikipedia.org/wiki/Web_browser               | 1.00  | 408    | 567    | 39     | 0.004 | 16      |                          |
| github.com/servo/servo                          | 0.66  | 1196   | 2046   | 388    | 0.055 | 474     |                          |
| news.ycombinator.com/                           | 1.00  | 219    | 219    | 0      | 0.000 | 150     |                          |
| developer.mozilla.org/en-US/docs/Web/JavaScript | 1.00  | 336    | 336    | 50     | 0.000 | 10      |                          |
| www.amazon.com/dp/B0DGHRT7PS                    | -     | -      | -      | -      | -     | -       | ERRORED_DOCUMENT_REQUEST |
| www.bbc.com/news                                | 0.79  | 319    | 1639   | 307    | 0.011 | 29      |                          |
| www.youtube.com/                                | 0.43  | 806    | 3847   | 931    | 0.027 | 97      |                          |

### Driver compatibility (goto + evaluate + click + screenshot)

| engine          | Puppeteer 25                                                                  | Playwright 1.65                                                                                  |
| --------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| chs-stable      | ok                                                                            | ok                                                                                               |
| chs-canary      | ok                                                                            | ok                                                                                               |
| brave-nightly   | ok                                                                            | ok                                                                                               |
| helium          | ok                                                                            | ok                                                                                               |
| lightpanda      | ok                                                                            | ok                                                                                               |
| obscura         | ok                                                                            | ok                                                                                               |
| firefox-nightly | ok via WebDriver BiDi                                                         | FAIL: _wrapApiCall: Failed to launch the browser process.                                        |
| cef-156         | FAIL: Failed to create a page for context (id = undefined)                    | FAIL: newPage: undefined is not an object (evaluating 'this._browser._crPages.get(targetId)._pag |
| electron-43     | FAIL: Protocol error (Target.createTarget): Not supported                     | FAIL: newPage: Protocol error (Target.createTarget): Not supported                               |
| zen             | ok via WebDriver BiDi                                                         | FAIL: _wrapApiCall: Failed to launch the browser process.                                        |
| pw-chromium     | ok                                                                            | ok                                                                                               |
| pw-firefox      | ok via WebDriver BiDi                                                         | ok via Juggler                                                                                   |
| pw-webkit       | FAIL: n/a: Puppeteer has no WebKit support                                    | ok                                                                                               |
| servo           | FAIL: n/a: servoshell exposes WebDriver classic only (no CDP / BiDi endpoint) | FAIL: n/a: no CDP / Juggler; WebDriver classic ok                                                |

## Caveats

- Helium: page loads take about 11 s on most sites, it uses 2.2 GB RSS and 25 CPU-s, and 2 sites returned ERR_ABORTED. This looks like its built-in blocker or first-run component work on every fresh profile. The cause was not investigated.
- Lightpanda: it scores 3/3 on Turnstile 3x only because it never runs the widget. 1x and 2x never return a callback (the widget iframe does not execute). It has no paint, so no LCP or FCP, no CSS layout (the grid/flex computed checks fail) and no WebAssembly threads. Lighthouse fails ("session not found").
- Obscura: client navigation through `<Link>` fails with "Node is either not clickable or not an Element", so B fails 6/6. Streaming, hydration, the click and the server action all work. Lighthouse fails. It exposes navigator.gpu but returns no adapter.
- Servo: 6/12 sites are fully OK. nextjs.org, react.dev, web.dev, HN, MDN and YouTube return an empty body or an "Error loading page" through WebDriver on at least one run. Workloads B, C and D work. It only speaks WebDriver classic (no CDP, no BiDi), so Puppeteer and Playwright cannot drive it.
- pw-webkit: Amazon returned "Page Not Found" (served differently to that UA). The other 11 sites are OK.
- Zen: on B, the server action takes about 4.1 s and client navigation about 7.9 s, against 0.15 s and 0.05 s on Firefox Nightly, with the same Gecko generation. Its BiDi stack is slow on these paths.
- CEF (cefsimple) quits immediately with `--headless`, so it was run windowed under Xvfb. CDP rejects Target.createTarget for new contexts, so the harness drives the existing page. Lighthouse, Puppeteer `newPage` and Playwright `newPage` all fail. The 1.5 GB size is the full client distribution with debug data. Electron rejects Target.createTarget the same way ("Not supported"), and its client navigation and server action take about 1 s because the hidden window is throttled.
- agent-browser overhead against chs-stable: cold start 517 ms vs 142 ms, A load about the same (709 vs 736 ms), B hydration poll 30 ms vs 1 ms (each CLI call costs about 30 to 90 ms), RSS 556 MB vs 622 MB (it launches Chrome with different flags).
- `next start` time to first 200 is a single cold sample: Node 14.2 s, Bun 23.1 s. Request handling under Bun matches Node (same load, hydration and action times).
- WebGPU: navigator.gpu exists in the Chromium family, Firefox Nightly and Obscura, but none returned an adapter (no GPU on the server, `--disable-gpu`).

## Conclusion (roles for labs)

1. Render oracle: chrome-headless-shell (Stable as the reference, Canary as the early-warning signal). It passed 12/12, 6/6 on B, 9/9 on Turnstile and 45/45 features, Lighthouse works, the cold start is about 140 ms and RSS is about 620 MB.
2. Second oracle for cross-engine diffs: Firefox Nightly over BiDi (12/12, B 6/6, 44/45 features). It costs about 1.1 GB and a 2 s cold start. WebKit through Playwright covers JSC/WebKit (B 6/6, 45/45 features).
3. Agent browser, lightweight tier: Lightpanda. It reads all 12/12 sites and passes B 6/6 at about 70 MB and 0.5 CPU-s, starts in 44 ms and loads in 388 ms, and works with both Puppeteer and Playwright. It has no layout, paint, iframes or Turnstile, so it is limited to DOM, JS and RSC work.
4. Agent browser, full-fidelity tier: chs-stable driven directly by Puppeteer or Playwright. agent-browser adds 30 to 90 ms per command and about 400 ms of cold start for no capability gain. It is worth keeping only as an LLM-facing CLI.
5. Obscura is promising (142 MB, 42 ms cold start, Turnstile correct), but the client-navigation click bug and the slower loads (1.4 s median) keep it out of the default path for now.
6. Servo is not ready as an oracle or an agent: 6/12 sites, 36/45 features, WebDriver-only. It is fine for B and D, at about 280 to 380 MB.
7. Embedding (VPS targets): Electron 43 is the most efficient Chromium-based option (12/12, 581 MB, the best LCP). CEF 156 works but needs Xvfb and cannot open new CDP targets, so tooling (Lighthouse, Playwright) breaks. Plan for CDP on the existing page only.
8. Brave and Helium bring nothing for headless use. Brave doubles RSS (about 1.1 GB). Helium is slow and unstable here.
9. Server runtime: Node 24 and Bun serve the Next 16 app with identical client-side results. `next start` booted faster on Node in a single cold sample, so keep Node as the reference and Bun as an option.
10. This changes the ENGINE-DECISION.md paper verdict: chrome-headless-shell becomes the oracle, Lightpanda the cheap agent tier and Firefox Nightly the second opinion. Servo and Obscura stay on a watchlist and should be re-run with this harness (`bun bench.ts --engines servo,obscura`).
