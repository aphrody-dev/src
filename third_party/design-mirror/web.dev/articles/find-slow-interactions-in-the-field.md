---
source_url: https://web.dev/articles/find-slow-interactions-in-the-field
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: 97da1cbabdd03ae1b3209e2b6a6b21a29aaad25c925633978eedcbee5f1c3c04
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Learn how to find slow interactions in your website's field data so you can find opportunities to improve its Interaction to Next Paint.

Jeremy Wagner [GitHub](https://github.com/malchata) [LinkedIn](https://www.linkedin.com/in/malchata) [Homepage](https://jlwagner.net/)

[Video](https://www.youtube.com/watch?v=xfjumh8ySRY)

> [!NOTE]
> **Try it:** The [measuring INP codelab](https://codelabs.developers.google.com/measuring-inp) covers many of the concepts outlined in this guide. Give it a try!

[Field data](https://web.dev/articles/lab-and-field-data-differences.md.txt#field_data) is data that tells you how actual users are experiencing your website. It teases out issues you can't find in [lab data](https://web.dev/articles/lab-and-field-data-differences.md.txt#lab_data) alone. Where [Interaction to Next Paint (INP)](https://web.dev/articles/inp.md.txt) is concerned, field data is essential in identifying slow interactions, and provides vital clues to help you fix them.

In this guide, you'll learn how to quickly assess your website's INP using field data from the [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux) to see if your website has issues with INP. Subsequently, you'll learn how to use the attribution build of [the web-vitals JavaScript library](https://github.com/GoogleChrome/web-vitals)---and the new insights it provides from the [Long Animation Frames API (LoAF)](https://developer.chrome.com/docs/web-platform/long-animation-frames)---to gather and interpret field data for slow interactions on your website.

## Start with CrUX to evaluate your website's INP

If you're not collecting field data from your website's users, CrUX may be a good starting point. CrUX collects field data from real Chrome users who have opted into sending telemetry data.

CrUX data is surfaced in a number of different areas, and it depends on the scope of the information you're looking for. CrUX can provide data on INP and other Core Web Vitals for:

- Individual pages and entire origins using [PageSpeed Insights](https://pagespeed.web.dev).
- Types of pages. For example, many ecommerce websites have Product Detail Page and Product Listing Page types. You can get CrUX data for unique page types in [Search Console](https://search.google.com/search-console/about).

As a starting point, you can enter your website's URL in PageSpeed Insights. Once you enter the URL, field data for it---if available---will be displayed for multiple metrics, including INP. You can also use the toggles to check your INP values for mobile and desktop dimensions.
A readout of CrUX data as seen in PageSpeed insights. In this example, the given web page's INP needs improvement.

This data is useful because it tells you if you have a problem. What CrUX can't do, however, is tell you _what_ is causing problems. There are many Real User Monitoring (RUM) solutions available that will help you gather your own field data from your website's users to help you answer that, and one option is to gather that field data yourself using the web-vitals JavaScript library.

## Collect field data with the `web-vitals` JavaScript library

The [`web-vitals` JavaScript library](https://github.com/GoogleChrome/web-vitals) is a script you can load on your website to gather field data from your website's users. You can use it to record a number of metrics, including INP in browsers that support it.

Browser Support

- ' d='M96 183a64 64 0 0 1-23-23L17 64a128 128 0 0 0 111 192l55-96a64 64 0 0 1-87 23Z'/%3E%3Cpath fill='url(%23b)' d='M192 128a64 64 0 0 1-9 32l-55 96A128 128 0 0 0 239 64H128a64 64 0 0 1 64 64Z'/%3E%3Ccircle cx='128' cy='128' r='52' fill='%231a73e8'/%3E%3Cpath fill='url(%23c)' d='M96 73a64 64 0 0 1 32-9h111a128 128 0 0 0-222 0l56 96a64 64 0 0 1 23-87Z'/%3E%3C/svg%3E)
- ' xlink:href='%23A'%3E%3Cstop offset='.76' stop-opacity='0'/%3E%3Cstop offset='.95' stop-opacity='.5'/%3E%3Cstop offset='1'/%3E%3C/radialGradient%3E%3CradialGradient id='F' cx='2523' cy='4680' r='20243' gradientTransform='matrix(-.03715 .99931 -2.12836 -.07913 13579 3530)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2335c1f1'/%3E%3Cstop offset='.11' stop-color='%2334c1ed'/%3E%3Cstop offset='.23' stop-color='%232fc2df'/%3E%3Cstop offset='.31' stop-color='%232bc3d2'/%3E%3Cstop offset='.67' stop-color='%2336c752'/%3E%3C/radialGradient%3E%3CradialGradient id='G' cx='24247' cy='7758' r='9734' gradientTransform='matrix(.28109 .95968 -.78353 .22949 24510 -16292)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2366eb6e'/%3E%3Cstop offset='1' stop-color='%2366eb6e' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cpath id='H' d='M24105 20053a9345 9345 0 01-1053 472 10202 10202 0 01-3590 646c-4732 0-8855-3255-8855-7432 0-1175 680-2193 1643-2729-4280 180-5380 4640-5380 7253 0 7387 6810 8137 8276 8137 791 0 1984-230 2704-456l130-44a12834 12834 0 006660-5282c220-350-168-757-535-565z'/%3E%3Cpath id='I' d='M11571 25141a7913 7913 0 01-2273-2137 8145 8145 0 01-1514-4740 8093 8093 0 013093-6395 8082 8082 0 011373-859c312-148 846-414 1554-404a3236 3236 0 012569 1297 3184 3184 0 01636 1866c0-21 2446-7960-8005-7960-4390 0-8004 4166-8004 7820 0 2319 538 4170 1212 5604a12833 12833 0 007684 6757 12795 12795 0 003908 610c1414 0 2774-233 4045-656a7575 7575 0 01-6278-803z'/%3E%3Cpath id='J' d='M16231 15886c-80 105-330 250-330 566 0 260 170 512 472 723 1438 1003 4149 868 4156 868a5954 5954 0 003027-839 6147 6147 0 001133-850 6180 6180 0 001910-4437c26-2242-796-3732-1133-4392-2120-4141-6694-6525-11668-6525-7011 0-12703 5635-12798 12620 47-3654 3679-6605 7996-6605 350 0 2346 34 4200 1007 1634 858 2490 1894 3086 2921 618 1067 728 2415 728 2952s-271 1333-780 1990z'/%3E%3Cuse fill='url(%23B)' xlink:href='%23H'/%3E%3Cuse fill='url(%23D)' opacity='.35' xlink:href='%23H'/%3E%3Cuse fill='url(%23C)' xlink:href='%23I'/%3E%3Cuse fill='url(%23E)' opacity='.4' xlink:href='%23I'/%3E%3Cuse fill='url(%23F)' xlink:href='%23J'/%3E%3Cuse fill='url(%23G)' xlink:href='%23J'/%3E%3C/svg%3E)
- ' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%239059ff' stop-opacity='0'/%3E%3Cstop offset='.3' stop-color='%238c4ff3' stop-opacity='.1'/%3E%3Cstop offset='.8' stop-color='%237716a8' stop-opacity='.5'/%3E%3Cstop offset='1' stop-color='%236e008b' stop-opacity='.6'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-g' cx='239.1' cy='34.6' r='171.6' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffe226'/%3E%3Cstop offset='.1' stop-color='%23ffdb27'/%3E%3Cstop offset='.3' stop-color='%23ffc82a'/%3E%3Cstop offset='.5' stop-color='%23ffa930'/%3E%3Cstop offset='.7' stop-color='%23ff7e37'/%3E%3Cstop offset='.8' stop-color='%23ff7139'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-h' cx='374' cy='-74.3' r='732.2' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-i' cx='304.6' cy='7.1' r='536.4' gradientTransform='rotate(84 303 4)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.3' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.6' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-j' cx='235' cy='98.1' r='457.1' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-k' cx='355.7' cy='124.9' r='500.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.2' stop-color='%23ffe141'/%3E%3Cstop offset='.5' stop-color='%23ffaf1e'/%3E%3Cstop offset='.6' stop-color='%23ff980e'/%3E%3C/radialGradient%3E%3ClinearGradient id='ff-a' x1='446.9' y1='76.8' x2='47.9' y2='461.8' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.4' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.5' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/linearGradient%3E%3ClinearGradient id='ff-l' x1='442.1' y1='74.8' x2='102.6' y2='414.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%23fff44f' stop-opacity='.8'/%3E%3Cstop offset='.3' stop-color='%23fff44f' stop-opacity='.6'/%3E%3Cstop offset='.5' stop-color='%23fff44f' stop-opacity='.2'/%3E%3Cstop offset='.6' stop-color='%23fff44f' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134a120 120 0 0 0-66 25 71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a229 229 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zM202 355l3 1-3-1zm55-145zm198-31z' fill='url(%23ff-a)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-b)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-c)'/%3E%3Cpath d='m362 195 1 1a130 130 0 0 0-22-29C266 92 322 5 331 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62z' fill='url(%23ff-d)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-e)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-f)'/%3E%3Cpath d='m171 151 5 3a111 111 0 0 1-1-58c-25 11-44 29-58 44 1 0 36 0 54 11z' fill='url(%23ff-g)'/%3E%3Cpath d='M18 261a242 242 0 0 0 231 197 207 207 0 0 0 206-279c8 56-20 110-64 146-86 71-169 43-186 31l-3-1c-50-24-71-70-67-110-42 0-57-35-57-35s38-28 89-4c46 22 90 4 90 4 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5l-5-3c-18-11-52-11-54-11-9-12-9-51-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73c0 1-9 38-5 57z' fill='url(%23ff-h)'/%3E%3Cpath d='M341 167a130 130 0 0 1 22 29 46 46 0 0 1 4 3c55 50 26 121 24 126 44-36 72-90 64-146-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-9 5-65 92 10 167z' fill='url(%23ff-i)'/%3E%3Cpath d='M367 199a46 46 0 0 0-4-3l-1-1c-13-9-36-18-58-15 86 44 63 193-57 187a107 107 0 0 1-31-6 131 131 0 0 1-11-5c17 12 99 39 186-31 2-5 31-76-24-126z' fill='url(%23ff-j)'/%3E%3Cpath d='M148 277s12-41 80-41c7 0 28-20 29-26s-44 18-90-4c-51-24-89 4-89 4s15 35 57 35c-4 40 16 85 67 110l3 1c-29-15-54-44-57-79z' fill='url(%23ff-k)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62-13-9-36-18-58-14 86 43 63 192-57 186a107 107 0 0 1-31-6 131 131 0 0 1-11-5l-3-1 3 1c-29-15-54-44-57-79 0 0 12-41 80-41 7 0 28-20 29-26 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a279 279 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zm-24 13z' fill='url(%23ff-l)'/%3E%3C/svg%3E)
- ' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-color='%2324a5f3' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%231e8ceb' /%3E%3C/radialGradient%3E%3CradialGradient id='s-j' cx='109.3' cy='13.8' r='93.1' gradientTransform='matrix(-.02 1.1 -1.04 -.02 137 -115)' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235488d6' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235d96eb' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='220' height='220' x='22' y='-107' fill='url(%23s-a)' ry='49' transform='matrix(.57 0 0 .57 187 256)' /%3E%3Cg transform='translate(194 190)'%3E%3Ccircle cx='67.8' cy='67.7' fill='url(%23s-c)' paint-order='stroke fill markers' r='54' /%3E%3Ccircle cx='-69.9' cy='69.3' fill='url(%23s-i)' transform='translate(138 -2)' r='54' /%3E%3C/g%3E%3Cellipse cx='120' cy='14.2' fill='url(%23s-j)' rx='93.1' ry='93.7' transform='matrix(.58 0 0 .58 192 250)' /%3E%3Cg transform='matrix(.58 0 0 .57 197 182)'%3E%3Cpath fill='%23cac7c8' d='M46 192h1l72-48-7-9-66 57Z' /%3E%3Cpath fill='%23fbfffc' d='M46 191v1l66-57-7-9-59 65Z' /%3E%3Cpath fill='url(%23s-d)' d='m119 144-7-9 66-57-59 66Z' /%3E%3Cpath fill='%23fb645c' d='m105 126 7 9 66-57-1-1-72 49Z' /%3E%3C/g%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='1' stroke-width='1.3' d='m287 278 3-2m-12-17 8-2m-8-3h4m-4-13 8 2m-8 3h4m-1-13 7 3m-4-11 7 4m-2-11 6 6m0-12 6 7m1-11 4 6m4-10 3 7m5-9 2 7m15-7-1 7m10-5-3 7m11-4-4 7m11-2-5 6m16 7-7 4m10 4-7 3m10 6-8 1m8 16-8-2m5 10-7-3m4 11-7-4m2 11-6-5m0 11-5-6m-2 11-4-7m-4 11-3-8m-6 10-1-8m-16 8 2-8m-10 5 3-7m-11 4 4-7m-11 2 5-6m-8 3 3-3m4 8 2-3m5 8 2-4m6 7 1-4m8 5v-4m8 4v-4m9 3-1-4m9 1-2-4m9 0-2-4m9-2-3-3m8-4-3-2m8-5-4-2m7-6-4-1m5-8h-4m4-8h-4m3-9-4 1m1-9-4 2m-1-9-3 2m-2-9-3 3m-4-8-2 3m-5-8-2 4m-6-6-1 3m-8-5v4m-8-4v4m-9-2 1 3m-9 0 2 3m-9 1 2 3m-9 2 3 3m-8 4 3 2m-8 5 4 2m-7 6 4 1m-4 25 4-1m-2 5 7-3m-6 7 4-2m-2 6 7-4m-13-21h8m41-41v-8m0 99v-8m49-42h-8' transform='translate(-65 8)' /%3E%3C/svg%3E)

[Source](https://developer.mozilla.org/docs/Web/API/PerformanceEventTiming/interactionId)

The standard build of the web-vitals library can be used to get basic INP data from users in the field:

```javascript
import { onINP } from "web-vitals";

onINP(({ name, value, rating }) => {
  console.log(name); // 'INP'
  console.log(value); // 512
  console.log(rating); // 'poor'
});
```

In order to analyze your field data from your users, you'll want to send this data somewhere:

```javascript
import { onINP } from "web-vitals";

onINP(({ name, value, rating }) => {
  // Prepare JSON to be sent for collection. Note that
  // you can add anything else you'd want to collect here:
  const body = JSON.stringify({ name, value, rating });

  // Use `sendBeacon` to send data to an analytics endpoint.
  // For Google Analytics, see https://github.com/GoogleChrome/web-vitals#send-the-results-to-google-analytics.
  navigator.sendBeacon("/analytics", body);
});
```

However, this data by itself doesn't tell you much more than CrUX would. That's where the attribution build of the web-vitals library comes in.

### Go further with the web-vitals library's attribution build

[The attribution build](https://github.com/GoogleChrome/web-vitals?tab=readme-ov-file#attribution-build) of the web-vitals library surfaces additional data you can get from users in the field to help you better troubleshoot problematic interactions that are affecting your website's INP. This data is accessible through the `attribution` object surfaced in the library's `onINP()` method:

```javascript
import { onINP } from "web-vitals/attribution";

onINP(({ name, value, rating, attribution }) => {
  console.log(name); // 'INP'
  console.log(value); // 56
  console.log(rating); // 'good'
  console.log(attribution); // Attribution data object
});
```

How data from the web-vitals library appears in the console.

In addition to the page's INP itself, the attribution build provides a lot of data you can use to help understand the reasons for slow interactions, including which part of the interaction you should focus on. It can help you answer important questions such as:

- "Did the user interact with the page while it was loading?"
- "Did the interaction's event handlers run for a long time?"
- "Was the interaction event handler code delayed from starting? If so, what else was happening on the main thread at that time?"
- "Did the interaction cause a lot of rendering work that delayed the next frame from being painted?"

The following table shows some of the basic attribution data you can get from the library that can help you figure out some high-level causes of slow interactions on your website:

| `attribution` object key      | Data                                                                                                                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `interactionTarget`           | A CSS selector pointing to the element that produced the page's INP value---for example, `button#save`.                                                                                                             |
| `interactionType`             | The interaction's type, either from clicks, taps, or keyboard inputs.                                                                                                                                               |
| `inputDelay`\*                | The interaction's [input delay](https://web.dev/articles/optimize-input-delay.md.txt#what_is_input_delay).                                                                                                          |
| `processingDuration`\*        | The time from when the first event listener started running in response to the user interaction until when all event listener processing has finished.                                                              |
| `presentationDelay`\*         | The interaction's [presentation delay](https://web.dev/articles/optimize-inp.md.txt#minimize_presentation_delay), which takes place starting from when event handlers finish to the time the next frame is painted. |
| `longAnimationFrameEntries`\* | Entries from the LoAF associated with the interaction. See the next for additional info.                                                                                                                            |
| [\*New in version 4]          |

Beginning with version 4 of the web-vitals library, you can get even deeper insight into problematic interactions through the data it provides with INP phase breakdowns (input delay, processing duration and presentation delay) and the [Long Animation Frames API (LoAF)](https://developer.chrome.com/docs/web-platform/long-animation-frames).

### The Long Animation Frames API (LoAF)

Browser Support

- ' d='M96 183a64 64 0 0 1-23-23L17 64a128 128 0 0 0 111 192l55-96a64 64 0 0 1-87 23Z'/%3E%3Cpath fill='url(%23b)' d='M192 128a64 64 0 0 1-9 32l-55 96A128 128 0 0 0 239 64H128a64 64 0 0 1 64 64Z'/%3E%3Ccircle cx='128' cy='128' r='52' fill='%231a73e8'/%3E%3Cpath fill='url(%23c)' d='M96 73a64 64 0 0 1 32-9h111a128 128 0 0 0-222 0l56 96a64 64 0 0 1 23-87Z'/%3E%3C/svg%3E)
- ' xlink:href='%23A'%3E%3Cstop offset='.76' stop-opacity='0'/%3E%3Cstop offset='.95' stop-opacity='.5'/%3E%3Cstop offset='1'/%3E%3C/radialGradient%3E%3CradialGradient id='F' cx='2523' cy='4680' r='20243' gradientTransform='matrix(-.03715 .99931 -2.12836 -.07913 13579 3530)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2335c1f1'/%3E%3Cstop offset='.11' stop-color='%2334c1ed'/%3E%3Cstop offset='.23' stop-color='%232fc2df'/%3E%3Cstop offset='.31' stop-color='%232bc3d2'/%3E%3Cstop offset='.67' stop-color='%2336c752'/%3E%3C/radialGradient%3E%3CradialGradient id='G' cx='24247' cy='7758' r='9734' gradientTransform='matrix(.28109 .95968 -.78353 .22949 24510 -16292)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2366eb6e'/%3E%3Cstop offset='1' stop-color='%2366eb6e' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cpath id='H' d='M24105 20053a9345 9345 0 01-1053 472 10202 10202 0 01-3590 646c-4732 0-8855-3255-8855-7432 0-1175 680-2193 1643-2729-4280 180-5380 4640-5380 7253 0 7387 6810 8137 8276 8137 791 0 1984-230 2704-456l130-44a12834 12834 0 006660-5282c220-350-168-757-535-565z'/%3E%3Cpath id='I' d='M11571 25141a7913 7913 0 01-2273-2137 8145 8145 0 01-1514-4740 8093 8093 0 013093-6395 8082 8082 0 011373-859c312-148 846-414 1554-404a3236 3236 0 012569 1297 3184 3184 0 01636 1866c0-21 2446-7960-8005-7960-4390 0-8004 4166-8004 7820 0 2319 538 4170 1212 5604a12833 12833 0 007684 6757 12795 12795 0 003908 610c1414 0 2774-233 4045-656a7575 7575 0 01-6278-803z'/%3E%3Cpath id='J' d='M16231 15886c-80 105-330 250-330 566 0 260 170 512 472 723 1438 1003 4149 868 4156 868a5954 5954 0 003027-839 6147 6147 0 001133-850 6180 6180 0 001910-4437c26-2242-796-3732-1133-4392-2120-4141-6694-6525-11668-6525-7011 0-12703 5635-12798 12620 47-3654 3679-6605 7996-6605 350 0 2346 34 4200 1007 1634 858 2490 1894 3086 2921 618 1067 728 2415 728 2952s-271 1333-780 1990z'/%3E%3Cuse fill='url(%23B)' xlink:href='%23H'/%3E%3Cuse fill='url(%23D)' opacity='.35' xlink:href='%23H'/%3E%3Cuse fill='url(%23C)' xlink:href='%23I'/%3E%3Cuse fill='url(%23E)' opacity='.4' xlink:href='%23I'/%3E%3Cuse fill='url(%23F)' xlink:href='%23J'/%3E%3Cuse fill='url(%23G)' xlink:href='%23J'/%3E%3C/svg%3E)
- ' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%239059ff' stop-opacity='0'/%3E%3Cstop offset='.3' stop-color='%238c4ff3' stop-opacity='.1'/%3E%3Cstop offset='.8' stop-color='%237716a8' stop-opacity='.5'/%3E%3Cstop offset='1' stop-color='%236e008b' stop-opacity='.6'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-g' cx='239.1' cy='34.6' r='171.6' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffe226'/%3E%3Cstop offset='.1' stop-color='%23ffdb27'/%3E%3Cstop offset='.3' stop-color='%23ffc82a'/%3E%3Cstop offset='.5' stop-color='%23ffa930'/%3E%3Cstop offset='.7' stop-color='%23ff7e37'/%3E%3Cstop offset='.8' stop-color='%23ff7139'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-h' cx='374' cy='-74.3' r='732.2' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-i' cx='304.6' cy='7.1' r='536.4' gradientTransform='rotate(84 303 4)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.3' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.6' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-j' cx='235' cy='98.1' r='457.1' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-k' cx='355.7' cy='124.9' r='500.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.2' stop-color='%23ffe141'/%3E%3Cstop offset='.5' stop-color='%23ffaf1e'/%3E%3Cstop offset='.6' stop-color='%23ff980e'/%3E%3C/radialGradient%3E%3ClinearGradient id='ff-a' x1='446.9' y1='76.8' x2='47.9' y2='461.8' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.4' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.5' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/linearGradient%3E%3ClinearGradient id='ff-l' x1='442.1' y1='74.8' x2='102.6' y2='414.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%23fff44f' stop-opacity='.8'/%3E%3Cstop offset='.3' stop-color='%23fff44f' stop-opacity='.6'/%3E%3Cstop offset='.5' stop-color='%23fff44f' stop-opacity='.2'/%3E%3Cstop offset='.6' stop-color='%23fff44f' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134a120 120 0 0 0-66 25 71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a229 229 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zM202 355l3 1-3-1zm55-145zm198-31z' fill='url(%23ff-a)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-b)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-c)'/%3E%3Cpath d='m362 195 1 1a130 130 0 0 0-22-29C266 92 322 5 331 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62z' fill='url(%23ff-d)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-e)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-f)'/%3E%3Cpath d='m171 151 5 3a111 111 0 0 1-1-58c-25 11-44 29-58 44 1 0 36 0 54 11z' fill='url(%23ff-g)'/%3E%3Cpath d='M18 261a242 242 0 0 0 231 197 207 207 0 0 0 206-279c8 56-20 110-64 146-86 71-169 43-186 31l-3-1c-50-24-71-70-67-110-42 0-57-35-57-35s38-28 89-4c46 22 90 4 90 4 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5l-5-3c-18-11-52-11-54-11-9-12-9-51-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73c0 1-9 38-5 57z' fill='url(%23ff-h)'/%3E%3Cpath d='M341 167a130 130 0 0 1 22 29 46 46 0 0 1 4 3c55 50 26 121 24 126 44-36 72-90 64-146-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-9 5-65 92 10 167z' fill='url(%23ff-i)'/%3E%3Cpath d='M367 199a46 46 0 0 0-4-3l-1-1c-13-9-36-18-58-15 86 44 63 193-57 187a107 107 0 0 1-31-6 131 131 0 0 1-11-5c17 12 99 39 186-31 2-5 31-76-24-126z' fill='url(%23ff-j)'/%3E%3Cpath d='M148 277s12-41 80-41c7 0 28-20 29-26s-44 18-90-4c-51-24-89 4-89 4s15 35 57 35c-4 40 16 85 67 110l3 1c-29-15-54-44-57-79z' fill='url(%23ff-k)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62-13-9-36-18-58-14 86 43 63 192-57 186a107 107 0 0 1-31-6 131 131 0 0 1-11-5l-3-1 3 1c-29-15-54-44-57-79 0 0 12-41 80-41 7 0 28-20 29-26 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a279 279 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zm-24 13z' fill='url(%23ff-l)'/%3E%3C/svg%3E)
- ' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-color='%2324a5f3' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%231e8ceb' /%3E%3C/radialGradient%3E%3CradialGradient id='s-j' cx='109.3' cy='13.8' r='93.1' gradientTransform='matrix(-.02 1.1 -1.04 -.02 137 -115)' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235488d6' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235d96eb' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='220' height='220' x='22' y='-107' fill='url(%23s-a)' ry='49' transform='matrix(.57 0 0 .57 187 256)' /%3E%3Cg transform='translate(194 190)'%3E%3Ccircle cx='67.8' cy='67.7' fill='url(%23s-c)' paint-order='stroke fill markers' r='54' /%3E%3Ccircle cx='-69.9' cy='69.3' fill='url(%23s-i)' transform='translate(138 -2)' r='54' /%3E%3C/g%3E%3Cellipse cx='120' cy='14.2' fill='url(%23s-j)' rx='93.1' ry='93.7' transform='matrix(.58 0 0 .58 192 250)' /%3E%3Cg transform='matrix(.58 0 0 .57 197 182)'%3E%3Cpath fill='%23cac7c8' d='M46 192h1l72-48-7-9-66 57Z' /%3E%3Cpath fill='%23fbfffc' d='M46 191v1l66-57-7-9-59 65Z' /%3E%3Cpath fill='url(%23s-d)' d='m119 144-7-9 66-57-59 66Z' /%3E%3Cpath fill='%23fb645c' d='m105 126 7 9 66-57-1-1-72 49Z' /%3E%3C/g%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='1' stroke-width='1.3' d='m287 278 3-2m-12-17 8-2m-8-3h4m-4-13 8 2m-8 3h4m-1-13 7 3m-4-11 7 4m-2-11 6 6m0-12 6 7m1-11 4 6m4-10 3 7m5-9 2 7m15-7-1 7m10-5-3 7m11-4-4 7m11-2-5 6m16 7-7 4m10 4-7 3m10 6-8 1m8 16-8-2m5 10-7-3m4 11-7-4m2 11-6-5m0 11-5-6m-2 11-4-7m-4 11-3-8m-6 10-1-8m-16 8 2-8m-10 5 3-7m-11 4 4-7m-11 2 5-6m-8 3 3-3m4 8 2-3m5 8 2-4m6 7 1-4m8 5v-4m8 4v-4m9 3-1-4m9 1-2-4m9 0-2-4m9-2-3-3m8-4-3-2m8-5-4-2m7-6-4-1m5-8h-4m4-8h-4m3-9-4 1m1-9-4 2m-1-9-3 2m-2-9-3 3m-4-8-2 3m-5-8-2 4m-6-6-1 3m-8-5v4m-8-4v4m-9-2 1 3m-9 0 2 3m-9 1 2 3m-9 2 3 3m-8 4 3 2m-8 5 4 2m-7 6 4 1m-4 25 4-1m-2 5 7-3m-6 7 4-2m-2 6 7-4m-13-21h8m41-41v-8m0 99v-8m49-42h-8' transform='translate(-65 8)' /%3E%3C/svg%3E)

[Source](https://developer.mozilla.org/docs/Web/API/PerformanceLongAnimationFrameTiming)

Debugging interactions using field data is a challenging task. With data from LoAF, however, it's now possible to get better insights into the causes behind slow interactions, as LoAF exposes a number of detailed timings and other data you can use to pinpoint precise causes---and more importantly, where the source of the problem is in your website's code.

The attribution build of the web-vitals library exposes an array of LoAF entries under the `longAnimationFrameEntries` key of the `attribution` object. The following table lists a few key bits of data you can find in each LoAF entry:

| LoAF entry object key   | Data                                                                                                                                                                                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `duration`              | The duration of the long animation frame, up to when layout has finished, but excluding painting and compositing.                                                                                                                                                                                                                             |
| `blockingDuration`      | The total amount of time in the frame that the browser was unable to respond quickly due to long tasks. This blocking time can include long tasks running JavaScript, as well as any subsequent long rendering task in the frame.                                                                                                             |
| `firstUIEventTimestamp` | The timestamp of when the event was queued during the frame. Useful for figuring out the start of an interaction's [input delay](https://web.dev/optimize-input-delay#what_is_input_delay).                                                                                                                                                   |
| `startTime`             | The starting timestamp of the frame.                                                                                                                                                                                                                                                                                                          |
| `renderStart`           | When the rendering work for the frame began. This includes any [`requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame) callbacks (and [`ResizeObserver`](https://developer.mozilla.org/docs/Web/API/ResizeObserver) callbacks if applicable), but potentially before any style/layout work begins. |
| `styleAndLayoutStart`   | When style/layout work in the frame occurs. Can be useful in figuring out the length of style/layout work when figuring in other available timestamps.                                                                                                                                                                                        |
| `scripts`               | An array of items containing script attribution information contributing to the page's INP.                                                                                                                                                                                                                                                   |

A diagram of the timings of a long animation frame according to the LoAF API (minus `blockingDuration`).

All of this information can tell you a lot about what makes an interaction slow---but the `scripts` array that LoAF entries surface should be of particular interest:

| Script attribution object key | Data                                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `invoker`                     | The invoker. This can vary based on the invoker type described in the next row. Examples of invokers can be values like `'IMG#id.onload'`, `'Window.requestAnimationFrame'`, or `'Response.json.then'`. |
| `invokerType`                 | The type of the invoker. Can be `'user-callback'`, `'event-listener'`, `'resolve-promise'`, `'reject-promise'`, `'classic-script'`, or `'module-script'`.                                               |
| `sourceURL`                   | The URL to the script where the long animation frame originated from.                                                                                                                                   |
| `sourceCharPosition`          | The character position in the script identified by `sourceURL`.                                                                                                                                         |
| `sourceFunctionName`          | The name of the function in the identified script.                                                                                                                                                      |

Each entry in this array contains the data shown in this table, which gives you information about the script that was responsible for the slow interaction---and how it was responsible.

## Measure and identify common causes behind slow interactions

To give you an idea of how you might use this information, this guide will now walk through how you can use LoAF data surfaced in the `web-vitals` library to determine some causes behind slow interactions.

### Long processing durations

The processing duration of an interaction is the time it takes for the interaction's registered event handler callbacks to run to completion and anything else that might happen in between them. High processing durations are surfaced by the web-vitals library:

```javascript
import { onINP } from "web-vitals/attribution";

onINP(({ name, value, attribution }) => {
  const { processingDuration } = attribution; // 512.5
});
```

It's natural to think that the primary cause behind a slow interaction is that your event handler code took too long to run, but that isn't always the case! Once you've confirmed that this is the problem, you can dig deeper with LoAF data:

```javascript
import { onINP } from "web-vitals/attribution";

onINP(({ name, value, attribution }) => {
  const { processingDuration } = attribution; // 512.5

  // Get the longest script from LoAF covering `processingDuration`:
  const loaf = attribution.longAnimationFrameEntries.at(-1);
  const script = loaf?.scripts.toSorted((a, b) => b.duration - a.duration)[0];

  if (script) {
    // Get attribution for the long-running event handler:
    const { invokerType } = script; // 'event-listener'
    const { invoker } = script; // 'BUTTON#update.onclick'
    const { sourceURL } = script; // 'https://example.com/app.js'
    const { sourceCharPosition } = script; // 83
    const { sourceFunctionName } = script; // 'update'
  }
});
```

> [!NOTE]
> **Note:** There can be multiple entries in the `longAnimationFrameEntries` and `script` arrays. This example gets the last animation frame (which should generally overlap with event processing), as well as the script data associated with it that took the longest to run.

As you can see in the preceding code snippet, you can work with LoAF data to track down the precise cause behind an interaction with high processing duration values, including:

- The element and its registered event listener.
- The script file---and the character position within it---containing the long-running event handler code.
- The name of the function.

This type of data is invaluable. You no longer need to do the legwork of finding out exactly which interaction---or which of its event handlers---were responsible for high processing duration values. Also, because third-party scripts can often register their own event handlers, you can determine whether or not it was your code that was responsible! For the code you have control over, you'll want to look into [optimizing long tasks](https://web.dev/articles/optimize-long-tasks.md.txt).

### Long input delays

While long-running event handlers are common, there are other parts of the interaction to consider. One part occurs before the processing duration, which is known as the [input delay](https://web.dev/articles/optimize-input-delay.md.txt#what_is_input_delay). This is the time from when the user initiates the interaction, to the moment its event handler callbacks begin to run and happens when the main thread is already processing another task. The web-vitals library's attribution build can tell you the length of the input delay for an interaction:

```javascript
import { onINP } from "web-vitals/attribution";

onINP(({ name, value, attribution }) => {
  const { inputDelay } = attribution; // 125.59439536
});
```

If you notice that some interactions have high input delays, then you'll need to figure out what was happening on the page at the time of the interaction that caused the long input delay---and that often boils down to whether the interaction occurred as the page was loading, or afterward.

#### Was it during page load?

The main thread is often busiest as a page is loading. During this time, all sorts of tasks are being queued and processed, and if the user tries to interact with the page while all of this work is happening, it can delay the interaction. Pages that load a lot of JavaScript can kick off work to compile and evaluate scripts, as well as executing functions that get a page ready for user interactions. This work can get in the way if the user happens to interact as this activity occurs, and you can find out if that's the case for your website's users:

```javascript
import { onINP } from "web-vitals/attribution";

onINP(({ name, value, attribution }) => {
  const { inputDelay } = attribution; // 125.59439536

  // Get the longest script from the first LoAF entry:
  const loaf = attribution.longAnimationFrameEntries[0];
  const script = loaf?.scripts.toSorted((a, b) => b.duration - a.duration)[0];

  if (script) {
    // Invoker types can describe if script eval blocked the main thread:
    const { invokerType } = script; // 'classic-script' | 'module-script'
    const { sourceLocation } = script; // 'https://example.com/app.js'
  }
});
```

If you record this data in the field and you see high input delays and invoker types of `'classic-script'` or `'module-script'`, then it's fair to say that scripts on your site [are taking a long time to evaluate](https://web.dev/articles/script-evaluation-and-long-tasks.md.txt), and are blocking the main thread long enough to delay interactions. You can reduce this blocking time by breaking up your scripts into smaller bundles, defer initially unused code to be loaded at a later point in time, and audit your site for unused code you can remove altogether.

#### Was it after page load?

While input delays often occur while a page is loading, it's just as possible that they can occur _after_ a page has loaded, due to an entirely different cause. Common causes of input delays after page load can be code that runs periodically due to an earlier `setInterval` call, or even event callbacks that were queued to run earlier, and are still processing.

```javascript
import { onINP } from "web-vitals/attribution";

onINP(({ name, value, attribution }) => {
  const { inputDelay } = attribution; // 125.59439536

  // Get the longest script from the first LoAF entry:
  const loaf = attribution.longAnimationFrameEntries[0];
  const script = loaf?.scripts.toSorted((a, b) => b.duration - a.duration)[0];

  if (script) {
    const { invokerType } = script; // 'user-callback'
    const { sourceURL } = script; // 'https://example.com/app.js'
    const { sourceCharPosition } = script; // 83
    const { sourceFunctionName } = script; // 'update'
  }
});
```

As is the case with troubleshooting high processing duration values, high input delays due to the causes mentioned earlier will give you detailed script attribution data. What is different, however, is that the invoker type will change based on the nature of the work that delayed the interaction:

- `'user-callback'` indicates the blocking task was from `setInterval`, `setTimeout`, or even `requestAnimationFrame`.
- `'event-listener'` indicates that the blocking task was from an earlier input that was queued and still processing.
- `'resolve-promise'` and `'reject-promise'` means that the blocking task was from some asynchronous work that was kicked off earlier, and resolved or rejected at a time when the user attempted to interact with the page, delaying the interaction.

In any case, the script attribution data will give you a sense of where to start looking, and whether the input delay was due to your own code, or that of a third-party script.

### Long presentation delays

Presentation delays are the last mile of an interaction, and begin when the interaction's event handlers finish, up to the point at which the next frame was painted. They occur when the work in an event handler due to an interaction changes the visual state of the user interface. As with processing durations and input delays, the web-vitals library can tell you how long the presentation delay was for an interaction:

```javascript
import { onINP } from "web-vitals/attribution";

onINP(({ name, value, attribution }) => {
  const { presentationDelay } = attribution; // 113.32307691
});
```

If you record this data and see high presentation delays for interactions contributing to your website's INP, the culprits can vary, but here are a couple causes to be on the lookout for.

#### Expensive style and layout work

Long presentation delays may be expensive [style recalculation](https://web.dev/articles/reduce-the-scope-and-complexity-of-style-calculations.md.txt) and [layout](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing.md.txt) work that arises from a number of causes, including complex CSS selectors and [large DOM sizes](https://web.dev/articles/dom-size-and-interactivity.md.txt). You can measure the duration this work with the LoAF timings surfaced in the web-vitals library:

```javascript
import { onINP } from "web-vitals/attribution";

onINP(({ name, value, attribution }) => {
  const { presentationDelay } = attribution; // 113.32307691

  // Get the longest script from the last LoAF entry:
  const loaf = attribution.longAnimationFrameEntries.at(-1);
  const script = loaf?.scripts.toSorted((a, b) => b.duration - a.duration)[0];

  // Get necessary timings:
  const { startTime } = loaf; // 2120.5
  const { duration } = loaf; // 1002

  // Figure out the ending timestamp of the frame (approximate):
  const endTime = startTime + duration; // 3122.5

  // Get the start timestamp of the frame's style/layout work:
  const { styleAndLayoutStart } = loaf; // 3011.17692309

  // Calculate the total style/layout duration:
  const styleLayoutDuration = endTime - styleAndLayoutStart; // 111.32307691

  if (script) {
    // Get attribution for the event handler that triggered
    // the long-running style and layout operation:
    const { invokerType } = script; // 'event-listener'
    const { invoker } = script; // 'BUTTON#update.onclick'
    const { sourceURL } = script; // 'https://example.com/app.js'
    const { sourceCharPosition } = script; // 83
    const { sourceFunctionName } = script; // 'update'
  }
});
```

LoAF won't tell you the duration of the style and layout work is for a frame, but it will tell you when it started. With this starting timestamp, you can use other data from LoAF to calculate an accurate duration of that work by determining the end time of the frame, and subtracting the start timestamp of the style and layout work from that.

> [!NOTE]
> **Note:** There's a type of layout known as forced layout, where style recalculation and layout operations are forced to occur in an event handler's callback, before the presentation delay phase. This kind of layout affects interaction latency, and can be accessed in a Long Animation Frame entry's `forcedStyleAndLayoutDuration` property.

#### Long-running `requestAnimationFrame` callbacks

One potential cause of long presentation delays is excessive work done in a [`requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame) callback. The contents of this callback are executed after event handlers have finished running, but just prior to style recalculation and layout work.

These callbacks can take considerable time to complete if the work done within them is complex. If you suspect high presentation delay values are due to work you're doing with `requestAnimationFrame`, you can use LoAF data surfaced by the web-vitals library to identify these scenarios:

```javascript
onINP(({ name, value, attribution }) => {
  const { presentationDelay } = attribution; // 543.1999999880791

  // Get the longest script from the last LoAF entry:
  const loaf = attribution.longAnimationFrameEntries.at(-1);
  const script = loaf?.scripts.toSorted((a, b) => b.duration - a.duration)[0];

  // Get the render start time and when style and layout began:
  const { renderStart } = loaf; // 2489
  const { styleAndLayoutStart } = loaf; // 2989.5999999940395

  // Calculate the `requestAnimationFrame` callback's duration:
  const rafDuration = styleAndLayoutStart - renderStart; // 500.59999999403954

  if (script) {
    // Get attribution for the event handler that triggered
    // the long-running requestAnimationFrame callback:
    const { invokerType } = script; // 'user-callback'
    const { invoker } = script; // 'FrameRequestCallback'
    const { sourceURL } = script; // 'https://example.com/app.js'
    const { sourceCharPosition } = script; // 83
    const { sourceFunctionName } = script; // 'update'
  }
});
```

If you see that a significant portion of the presentation delay time is spent in a `requestAnimationFrame` callback, ensure the work you're doing in these callbacks is limited to performing work that results in an actual update to the user interface. Any other work that doesn't touch the DOM or update styles will unnecessarily delay the next frame from being painted, so be careful!

## Conclusion

Field data is the best source of information you can draw on when it comes to understanding which interactions are problematic for actual users in the field. By relying on field data collection tools such as the web-vitals JavaScript library (or a RUM provider), you can be more confident about which interactions are most problematic, and then move on to [reproducing problematic interactions in the lab](https://web.dev/articles/manually-diagnose-slow-interactions-in-the-lab.md.txt) and then go about fixing them.
