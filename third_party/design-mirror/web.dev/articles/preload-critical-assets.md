---
source_url: https://web.dev/articles/preload-critical-assets
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:29+00:00
sha256: 96df9b52fdd4af9edaa3b103f211229aeecfbd9144885eb23ea2c7973bd5d085
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Houssein Djirdeh [X](https://twitter.com/hdjirdeh) [GitHub](https://github.com/housseindjirdeh) [Homepage](https://houssein.me/)  Jeremy Wagner [GitHub](https://github.com/malchata) [LinkedIn](https://www.linkedin.com/in/malchata) [Homepage](https://jlwagner.net/)  Milica Mihajlija [X](https://twitter.com/bibydigital) [GitHub](https://github.com/mihajlija) [Homepage](https://mihajlija.github.io/)

When you open a web page, the browser requests the HTML document from a server, parses its contents, and submits separate requests for any referenced resources. As a developer, you already know about all the resources your page needs and which of them are the most important. You can use that knowledge to request the critical resources ahead of time and speed up the loading process. This post explains how to achieve that with `<link rel="preload">`.

## How preloading works

Preloading is best suited for resources typically discovered late by the browser.
 In this example, Pacifico font is defined in the stylesheet with a [`@font-face`](https://web.dev/articles/reduce-webfont-size.md.txt#define_a_font_family_with_font-face)) rule. The browser loads the font file only after it has finished downloading and parsing the stylesheet.

By preloading a certain resource, you are telling the browser that you would like to fetch it sooner than the browser would otherwise discover it because you are certain that it is important for the current page.
 In this example, Pacifico font is preloaded, so the download happens in parallel with the stylesheet.

The critical request chain represents the order of resources that are prioritized and fetched by the browser. Lighthouse identifies assets that are on the third level of this chain as late-discovered. You can use the [**Preload key requests**](https://developer.chrome.com/docs/lighthouse/performance/uses-rel-preload) audit to identify which resources to preload.

You can preload resources by adding a `<link>` tag with `rel="preload"` to the head of your HTML document:

```html
<link rel="preload" as="script" href="critical.js">
```

The browser caches preloaded resources so they are available immediately when needed. (It doesn't execute the scripts or apply the stylesheets.)

> [!NOTE]
> **Note:** After implementing preloading, many sites, including [Shopify, Financial Times and Treebo, saw 1-second improvements](https://medium.com/reloading/preload-prefetch-and-priorities-in-chrome-776165961bbf) in user-centric metrics such as [Time to Interactive](https://web.dev/articles/tti.md.txt) and [First Contentful Paint](https://web.dev/articles/fcp.md.txt).

Resource hints, for example, [`preconnect`](https://web.dev/articles/preconnect-and-dns-prefetch.md.txt)and [`prefetch`](https://web.dev/articles/link-prefetch.md.txt), are executed as the browser sees fit. The `preload`, on the other hand, is mandatory for the browser. Modern browsers are already pretty good at prioritizing resources, that's why it's important to use `preload` sparingly and only preload the most critical resources.

Unused preloads trigger a Console warning in Chrome, approximately 3 seconds after the `load` event.

> [!NOTE]
> **Note:** `preload` is supported in all modern browsers. Browser Support
>
> - ' d='M96 183a64 64 0 0 1-23-23L17 64a128 128 0 0 0 111 192l55-96a64 64 0 0 1-87 23Z'/%3E%3Cpath fill='url(%23b)' d='M192 128a64 64 0 0 1-9 32l-55 96A128 128 0 0 0 239 64H128a64 64 0 0 1 64 64Z'/%3E%3Ccircle cx='128' cy='128' r='52' fill='%231a73e8'/%3E%3Cpath fill='url(%23c)' d='M96 73a64 64 0 0 1 32-9h111a128 128 0 0 0-222 0l56 96a64 64 0 0 1 23-87Z'/%3E%3C/svg%3E)
> - ' xlink:href='%23A'%3E%3Cstop offset='.76' stop-opacity='0'/%3E%3Cstop offset='.95' stop-opacity='.5'/%3E%3Cstop offset='1'/%3E%3C/radialGradient%3E%3CradialGradient id='F' cx='2523' cy='4680' r='20243' gradientTransform='matrix(-.03715 .99931 -2.12836 -.07913 13579 3530)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2335c1f1'/%3E%3Cstop offset='.11' stop-color='%2334c1ed'/%3E%3Cstop offset='.23' stop-color='%232fc2df'/%3E%3Cstop offset='.31' stop-color='%232bc3d2'/%3E%3Cstop offset='.67' stop-color='%2336c752'/%3E%3C/radialGradient%3E%3CradialGradient id='G' cx='24247' cy='7758' r='9734' gradientTransform='matrix(.28109 .95968 -.78353 .22949 24510 -16292)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2366eb6e'/%3E%3Cstop offset='1' stop-color='%2366eb6e' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cpath id='H' d='M24105 20053a9345 9345 0 01-1053 472 10202 10202 0 01-3590 646c-4732 0-8855-3255-8855-7432 0-1175 680-2193 1643-2729-4280 180-5380 4640-5380 7253 0 7387 6810 8137 8276 8137 791 0 1984-230 2704-456l130-44a12834 12834 0 006660-5282c220-350-168-757-535-565z'/%3E%3Cpath id='I' d='M11571 25141a7913 7913 0 01-2273-2137 8145 8145 0 01-1514-4740 8093 8093 0 013093-6395 8082 8082 0 011373-859c312-148 846-414 1554-404a3236 3236 0 012569 1297 3184 3184 0 01636 1866c0-21 2446-7960-8005-7960-4390 0-8004 4166-8004 7820 0 2319 538 4170 1212 5604a12833 12833 0 007684 6757 12795 12795 0 003908 610c1414 0 2774-233 4045-656a7575 7575 0 01-6278-803z'/%3E%3Cpath id='J' d='M16231 15886c-80 105-330 250-330 566 0 260 170 512 472 723 1438 1003 4149 868 4156 868a5954 5954 0 003027-839 6147 6147 0 001133-850 6180 6180 0 001910-4437c26-2242-796-3732-1133-4392-2120-4141-6694-6525-11668-6525-7011 0-12703 5635-12798 12620 47-3654 3679-6605 7996-6605 350 0 2346 34 4200 1007 1634 858 2490 1894 3086 2921 618 1067 728 2415 728 2952s-271 1333-780 1990z'/%3E%3Cuse fill='url(%23B)' xlink:href='%23H'/%3E%3Cuse fill='url(%23D)' opacity='.35' xlink:href='%23H'/%3E%3Cuse fill='url(%23C)' xlink:href='%23I'/%3E%3Cuse fill='url(%23E)' opacity='.4' xlink:href='%23I'/%3E%3Cuse fill='url(%23F)' xlink:href='%23J'/%3E%3Cuse fill='url(%23G)' xlink:href='%23J'/%3E%3C/svg%3E)
> - ' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%239059ff' stop-opacity='0'/%3E%3Cstop offset='.3' stop-color='%238c4ff3' stop-opacity='.1'/%3E%3Cstop offset='.8' stop-color='%237716a8' stop-opacity='.5'/%3E%3Cstop offset='1' stop-color='%236e008b' stop-opacity='.6'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-g' cx='239.1' cy='34.6' r='171.6' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffe226'/%3E%3Cstop offset='.1' stop-color='%23ffdb27'/%3E%3Cstop offset='.3' stop-color='%23ffc82a'/%3E%3Cstop offset='.5' stop-color='%23ffa930'/%3E%3Cstop offset='.7' stop-color='%23ff7e37'/%3E%3Cstop offset='.8' stop-color='%23ff7139'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-h' cx='374' cy='-74.3' r='732.2' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-i' cx='304.6' cy='7.1' r='536.4' gradientTransform='rotate(84 303 4)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.3' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.6' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-j' cx='235' cy='98.1' r='457.1' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-k' cx='355.7' cy='124.9' r='500.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.2' stop-color='%23ffe141'/%3E%3Cstop offset='.5' stop-color='%23ffaf1e'/%3E%3Cstop offset='.6' stop-color='%23ff980e'/%3E%3C/radialGradient%3E%3ClinearGradient id='ff-a' x1='446.9' y1='76.8' x2='47.9' y2='461.8' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.4' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.5' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/linearGradient%3E%3ClinearGradient id='ff-l' x1='442.1' y1='74.8' x2='102.6' y2='414.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%23fff44f' stop-opacity='.8'/%3E%3Cstop offset='.3' stop-color='%23fff44f' stop-opacity='.6'/%3E%3Cstop offset='.5' stop-color='%23fff44f' stop-opacity='.2'/%3E%3Cstop offset='.6' stop-color='%23fff44f' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134a120 120 0 0 0-66 25 71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a229 229 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zM202 355l3 1-3-1zm55-145zm198-31z' fill='url(%23ff-a)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-b)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-c)'/%3E%3Cpath d='m362 195 1 1a130 130 0 0 0-22-29C266 92 322 5 331 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62z' fill='url(%23ff-d)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-e)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-f)'/%3E%3Cpath d='m171 151 5 3a111 111 0 0 1-1-58c-25 11-44 29-58 44 1 0 36 0 54 11z' fill='url(%23ff-g)'/%3E%3Cpath d='M18 261a242 242 0 0 0 231 197 207 207 0 0 0 206-279c8 56-20 110-64 146-86 71-169 43-186 31l-3-1c-50-24-71-70-67-110-42 0-57-35-57-35s38-28 89-4c46 22 90 4 90 4 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5l-5-3c-18-11-52-11-54-11-9-12-9-51-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73c0 1-9 38-5 57z' fill='url(%23ff-h)'/%3E%3Cpath d='M341 167a130 130 0 0 1 22 29 46 46 0 0 1 4 3c55 50 26 121 24 126 44-36 72-90 64-146-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-9 5-65 92 10 167z' fill='url(%23ff-i)'/%3E%3Cpath d='M367 199a46 46 0 0 0-4-3l-1-1c-13-9-36-18-58-15 86 44 63 193-57 187a107 107 0 0 1-31-6 131 131 0 0 1-11-5c17 12 99 39 186-31 2-5 31-76-24-126z' fill='url(%23ff-j)'/%3E%3Cpath d='M148 277s12-41 80-41c7 0 28-20 29-26s-44 18-90-4c-51-24-89 4-89 4s15 35 57 35c-4 40 16 85 67 110l3 1c-29-15-54-44-57-79z' fill='url(%23ff-k)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62-13-9-36-18-58-14 86 43 63 192-57 186a107 107 0 0 1-31-6 131 131 0 0 1-11-5l-3-1 3 1c-29-15-54-44-57-79 0 0 12-41 80-41 7 0 28-20 29-26 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a279 279 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zm-24 13z' fill='url(%23ff-l)'/%3E%3C/svg%3E)
> - ' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-color='%2324a5f3' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%231e8ceb' /%3E%3C/radialGradient%3E%3CradialGradient id='s-j' cx='109.3' cy='13.8' r='93.1' gradientTransform='matrix(-.02 1.1 -1.04 -.02 137 -115)' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235488d6' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235d96eb' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='220' height='220' x='22' y='-107' fill='url(%23s-a)' ry='49' transform='matrix(.57 0 0 .57 187 256)' /%3E%3Cg transform='translate(194 190)'%3E%3Ccircle cx='67.8' cy='67.7' fill='url(%23s-c)' paint-order='stroke fill markers' r='54' /%3E%3Ccircle cx='-69.9' cy='69.3' fill='url(%23s-i)' transform='translate(138 -2)' r='54' /%3E%3C/g%3E%3Cellipse cx='120' cy='14.2' fill='url(%23s-j)' rx='93.1' ry='93.7' transform='matrix(.58 0 0 .58 192 250)' /%3E%3Cg transform='matrix(.58 0 0 .57 197 182)'%3E%3Cpath fill='%23cac7c8' d='M46 192h1l72-48-7-9-66 57Z' /%3E%3Cpath fill='%23fbfffc' d='M46 191v1l66-57-7-9-59 65Z' /%3E%3Cpath fill='url(%23s-d)' d='m119 144-7-9 66-57-59 66Z' /%3E%3Cpath fill='%23fb645c' d='m105 126 7 9 66-57-1-1-72 49Z' /%3E%3C/g%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='1' stroke-width='1.3' d='m287 278 3-2m-12-17 8-2m-8-3h4m-4-13 8 2m-8 3h4m-1-13 7 3m-4-11 7 4m-2-11 6 6m0-12 6 7m1-11 4 6m4-10 3 7m5-9 2 7m15-7-1 7m10-5-3 7m11-4-4 7m11-2-5 6m16 7-7 4m10 4-7 3m10 6-8 1m8 16-8-2m5 10-7-3m4 11-7-4m2 11-6-5m0 11-5-6m-2 11-4-7m-4 11-3-8m-6 10-1-8m-16 8 2-8m-10 5 3-7m-11 4 4-7m-11 2 5-6m-8 3 3-3m4 8 2-3m5 8 2-4m6 7 1-4m8 5v-4m8 4v-4m9 3-1-4m9 1-2-4m9 0-2-4m9-2-3-3m8-4-3-2m8-5-4-2m7-6-4-1m5-8h-4m4-8h-4m3-9-4 1m1-9-4 2m-1-9-3 2m-2-9-3 3m-4-8-2 3m-5-8-2 4m-6-6-1 3m-8-5v4m-8-4v4m-9-2 1 3m-9 0 2 3m-9 1 2 3m-9 2 3 3m-8 4 3 2m-8 5 4 2m-7 6 4 1m-4 25 4-1m-2 5 7-3m-6 7 4-2m-2 6 7-4m-13-21h8m41-41v-8m0 99v-8m49-42h-8' transform='translate(-65 8)' /%3E%3C/svg%3E)
>
> [Source](https://developer.mozilla.org/docs/Web/HTML/Reference/Attributes/rel/preload)

## Use cases

### Preloading resources defined in CSS

Fonts defined with [`@font-face`](https://web.dev/articles/reduce-webfont-size.md.txt#define_a_font_family_with_font-face) rules or background images defined in CSS files aren't discovered until the browser downloads and parses those CSS files. Preloading these resources ensures they are fetched before the CSS files have downloaded.

### Preloading CSS files

If you are using the [critical CSS approach](https://web.dev/articles/extract-critical-css.md.txt), you split your CSS into two parts. The critical CSS required for rendering the above-the-fold content is inlined in the `<head>` of the document and non-critical CSS is usually lazy-loaded with JavaScript. Waiting for JavaScript to execute before loading non-critical CSS can cause delays in rendering when users scroll, so it's a good idea to use `<link rel="preload">` to initiate the download sooner.

### Preloading JavaScript files

Because browsers don't execute preloaded files, preloading is useful to separate fetching from [execution](https://developer.chrome.com/docs/lighthouse/performance/bootup-time) which can improve metrics such as Time to Interactive. Preloading works best if you [split](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting.md.txt) your JavaScript bundles and only preload critical chunks.

## How to implement rel=preload

The simplest way to implement `preload` is to add a `<link>` tag to the `<head>` of the document:

```html
<head>
  <link rel="preload" as="script" href="critical.js">
</head>
```

Supplying the `as` attribute helps the browser set the priority of the prefetched resource according to its type, set the right headers, and determine whether the resource already exists in the cache. Accepted values for this attribute include: `script`, `style`, `font`, `image`, and [others](https://developer.mozilla.org/docs/Web/HTML/Element/link#Attributes).

> [!NOTE]
> **Note:** Take a look at the [Chrome Resource Priorities and Scheduling](https://docs.google.com/document/d/1bCDuq9H1ih9iNjgzyAL0gpwNFiEP4TZS-YLRp_RuMlc/edit) document to learn more about how the browser prioritizes different types of resources.

> [!CAUTION]
> **Caution:** Omitting the `as` attribute, or having an invalid value is equivalent to an [XHR request,](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest) where the browser doesn't know what it is fetching so it can't determine the correct priority. It can also cause some resources, such as scripts, to be fetched twice.

Some types of resources, such as fonts, are loaded in [anonymous mode](https://www.w3.org/TR/css-fonts-3/#font-fetching-requirements). For those you must set the `crossorigin` attribute with `preload`:

```html
<link rel="preload" href="ComicSans.woff2" as="font" type="font/woff2" crossorigin>
```

> [!CAUTION]
> **Caution:** Fonts preloaded without the `crossorigin` attribute will be fetched twice!

`<link>` elements also accept a [`type` attribute](https://developer.mozilla.org/docs/Web/HTML/Element/link#attr-type), which contains the [MIME type](https://developer.mozilla.org/docs/Web/HTTP/Basics_of_HTTP/MIME_types) of the linked resource. The browsers use the value of the `type` attribute to make sure that resources get preloaded only if their file type is supported. If a browser doesn't support the specified resource type, it will ignore the `<link rel="preload">`.

> [!WARNING]
> **Try it:** [Improve the performance of a page by preloading web fonts](https://web.dev/articles/codelab-preload-web-fonts.md.txt).

You can also preload any type of resource via the [`Link` HTTP header](https://developer.mozilla.org/docs/Web/HTTP/Headers/Link):

`Link: </css/style.css>; rel="preload"; as="style"`

A benefit of specifying `preload` in the HTTP Header is that the browser doesn't need to parse the document to discover it, which can offer small improvements in some cases.

### Preloading JavaScript modules with webpack

If you are using a module bundler that creates build files of your application, you need to check if it supports the injection of preload tags. With [webpack](https://webpack.js.org/) version 4.6.0 or later, preloading is supported through the use of [magic comments](https://webpack.js.org/api/module-methods/#magic-comments) inside `import()`:

```javascript
import(_/* webpackPreload: true */_ "CriticalChunk")
```

If you are using an older version of webpack, use a third-party plugin such as [preload-webpack-plugin](https://github.com/GoogleChromeLabs/preload-webpack-plugin).

## Effects of preloading on Core Web Vitals

Preloading is a powerful performance optimization that has an effect on loading speed. Such optimizations can lead to changes in your site's [Core Web Vitals](https://web.dev/articles/vitals.md.txt), and it's important to be aware them.

### Largest Contentful Paint (LCP)

Preloading has a powerful effect on [Largest Contentful Paint (LCP)](https://web.dev/articles/lcp.md.txt) when it comes to fonts and images, as both images and text nodes can be [LCP candidates](https://web.dev/articles/lcp.md.txt#what-elements-are-considered). Hero images and large runs of text that are rendered using web fonts can benefit significantly from a well-placed preload hint, and should be used when there are opportunities to deliver these important bits of content to the user faster.

However, you want to be careful when it comes to preloading---and other optimizations! In particular, avoid preloading too many resources. If too many resources are prioritized, effectively none of them are. The effects of excessive preload hints will be especially detrimental to those on slower networks where bandwidth contention will be more evident.

Instead, focus on a few high-value resources that you know will benefit from a well-placed preload. When preloading fonts, ensure that you're serving fonts in WOFF 2.0 format to reduce resource load time as much as possible. Since WOFF 2.0 has [excellent browser support](https://caniuse.com/woff2), using older formats such as WOFF 1.0 or TrueType (TTF) will delay your LCP if the LCP candidate is a text node.

When it comes to LCP and JavaScript, you'll want to ensure that you're sending complete markup from the server in order for the [browser's preload scanner](https://web.dev/articles/preload-scanner.md.txt) to work properly. If you're serving up an experience that relies entirely on JavaScript to render markup and can't send server-rendered HTML, it would be advantageous to step in where the browser preload scanner can't and preload resources that would only otherwise be discoverable when the JavaScript finishes loading and executing.

### Cumulative Layout Shift (CLS)

[Cumulative Layout Shift (CLS)](https://web.dev/articles/cls.md.txt) is an especially important metric where web fonts are concerned, and CLS has significant interplay with web fonts that use the [`font-display` CSS property](https://developer.mozilla.org/docs/Web/CSS/@font-face/font-display) to manage how fonts are loaded. To minimize web font-related layout shifts, consider the following strategies:

1. **Preload fonts while using the default `block` value for `font-display`.** This is a delicate balance. Blocking the display of fonts without a fallback can be considered a user experience problem. On one hand, loading fonts with `font-display: block;` eliminates web font-related layout shifts. On the other hand, you still want to get those web fonts loaded as soon as possible if they're crucial to the user experience. Combining a preload with `font-display: block;` may be an acceptable compromise.
2. **Preload fonts while using the `fallback` value for `font-display`.** `fallback` is a compromise between `swap` and `block`, in that it has an extremely short blocking period.
3. **Use the `optional` value for `font-display` without a preload.** If a web font isn't crucial to the user experience, but it is still used to render a significant amount of page text, consider using the `optional` value. In adverse conditions, `optional` will display page text in a fallback font while it loads the font in the background for the next navigation. The net result in these conditions is improved CLS, as system fonts will render immediately, while subsequent page loads will load the font immediately without layout shifts.

CLS is a difficult metric to optimize for when it comes to web fonts. As always, experiment in the [lab](https://web.dev/articles/lab-and-field-data-differences.md.txt#lab_data), but trust your [field data](https://web.dev/articles/lab-and-field-data-differences.md.txt#field_data) to determine if your font loading strategies are improving CLS or making it worse.

### Interaction to Next Paint (INP)

[Interaction to Next Paint](https://web.dev/articles/inp.md.txt) is a metric that gauges responsiveness to user input. Since the lion's share of interactivity on the web is driven by JavaScript, preloading JavaScript that powers important interactions may help to keep a page's INP lower. However, be aware that preloading too much JavaScript during startup can carry unintended negative consequences if too many resources are contending for bandwidth.

You'll also want to be careful about how you go about [code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting.md.txt). Code splitting is an excellent optimization for reducing the amount of JavaScript loaded during startup, but interactions can be delayed if they rely on JavaScript loaded right at the start of the interaction. To compensate for this, you'll need to examine the user's intent, and inject a preload for the necessary chunk(s) of JavaScript before the interaction takes place. One example could be preloading JavaScript required for validating a form's contents when any of the fields in the form are focused.

## Conclusion

To improve page speed, preload important resources that are discovered late by the browser. Preloading everything would be counterproductive so use `preload` sparingly and [measure the impact in the real-world](https://web.dev/explore/fast#measure-performance-in-the-field).
