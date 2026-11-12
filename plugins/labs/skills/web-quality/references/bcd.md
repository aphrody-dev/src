# MDN browser-compat-data 8.1.8 (@e665ba4, 2026-11-11, CC0, see LICENSE-bcd.txt)

Local clone: C:\src\third_party\web\mdn_browser-compat-data. Top dirs: api, css, html, http, javascript, mathml, svg, webassembly, webdriver, webextensions, manifests, mediatypes, browsers. The key path mirrors the file path: `css/properties/anchor-name.json` -> `css.properties["anchor-name"].__compat`; sub-features are nested keys.

`__compat`: `support.<browser>` is one statement or an array (first = current), with `version_added` (version string, `"preview"`, `false`, or ranged `≤N`), `version_removed`, `partial_implementation`, `flags`, `prefix`/`alternative_name`, `notes`. Also `status{experimental, standard_track, deprecated}`, `tags: ["web-features:<id>"]`, `spec_url`, `mdn_url`.

Core browser ids: chrome, chrome_android, edge, firefox, firefox_android, safari, safari_ios. Release dates: `browsers/<id>.json` -> `browsers.<id>.releases["<ver>"].release_date`.

Example (checked 2026-11-12): anchor-name chrome 125, firefox 147, safari 26, tag web-features:anchor-positioning.

Baseline is not stored in BCD. web-features (npm `web-features`) computes it (`status.baseline: high|low|false`, `baseline_low_date`, `baseline_high_date`). It is not cloned locally, so the field names are unverified. Online sources: the MDN page banner, https://webstatus.dev, caniuse. The Lighthouse `baseline` audit uses its bundled `core/lib/baseline/web-features-data.json`.

List CSS properties that have no Safari support:
```sh
bun -e 'const R="C:/src/third_party/web/mdn_browser-compat-data/";for await(const f of new Bun.Glob("css/properties/*.json").scan(R)){const j=await Bun.file(R+f).json();for(const[k,v]of Object.entries(j.css.properties)){const s=[v.__compat?.support.safari].flat()[0];if(s&&!s.version_added)console.log(k)}}'
```
