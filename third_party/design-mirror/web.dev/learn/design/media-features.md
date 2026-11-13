---
source_url: https://web.dev/learn/design/media-features
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:08+00:00
sha256: 8872c353864be85e0f95b063c70430c41798c14d453e4b01a1f9b2b191f865ff
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
Responsive design wouldn't be possible without media queries. Before media queries there was no way of knowing what kind of device people were using to visit your website. Designers had to make assumptions. Those assumptions were encoded into fixed-width designs or liquid layouts.

That all changed with the introduction of [media queries](https://web.dev/learn/design/media-queries.md.txt). For the first time designers could meet people halfway. Designers could adjust their layouts to respond to people's devices.

Remember, a media query comprises an optional media type and a mandatory media feature. There hasn't been much change in media types over the years. There are still just four possible values:

```css
@media all
@media screen
@media print
@media speech
```

[Media features](https://developer.mozilla.org/docs/Web/CSS/@media#media_features), on the other hand, have expanded greatly. Designers now can meet users beyond halfway, adapting designs to fit far more than just screen size.

Browser Support

- ' d='M96 183a64 64 0 0 1-23-23L17 64a128 128 0 0 0 111 192l55-96a64 64 0 0 1-87 23Z'/%3E%3Cpath fill='url(%23b)' d='M192 128a64 64 0 0 1-9 32l-55 96A128 128 0 0 0 239 64H128a64 64 0 0 1 64 64Z'/%3E%3Ccircle cx='128' cy='128' r='52' fill='%231a73e8'/%3E%3Cpath fill='url(%23c)' d='M96 73a64 64 0 0 1 32-9h111a128 128 0 0 0-222 0l56 96a64 64 0 0 1 23-87Z'/%3E%3C/svg%3E)
- ' xlink:href='%23A'%3E%3Cstop offset='.76' stop-opacity='0'/%3E%3Cstop offset='.95' stop-opacity='.5'/%3E%3Cstop offset='1'/%3E%3C/radialGradient%3E%3CradialGradient id='F' cx='2523' cy='4680' r='20243' gradientTransform='matrix(-.03715 .99931 -2.12836 -.07913 13579 3530)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2335c1f1'/%3E%3Cstop offset='.11' stop-color='%2334c1ed'/%3E%3Cstop offset='.23' stop-color='%232fc2df'/%3E%3Cstop offset='.31' stop-color='%232bc3d2'/%3E%3Cstop offset='.67' stop-color='%2336c752'/%3E%3C/radialGradient%3E%3CradialGradient id='G' cx='24247' cy='7758' r='9734' gradientTransform='matrix(.28109 .95968 -.78353 .22949 24510 -16292)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2366eb6e'/%3E%3Cstop offset='1' stop-color='%2366eb6e' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cpath id='H' d='M24105 20053a9345 9345 0 01-1053 472 10202 10202 0 01-3590 646c-4732 0-8855-3255-8855-7432 0-1175 680-2193 1643-2729-4280 180-5380 4640-5380 7253 0 7387 6810 8137 8276 8137 791 0 1984-230 2704-456l130-44a12834 12834 0 006660-5282c220-350-168-757-535-565z'/%3E%3Cpath id='I' d='M11571 25141a7913 7913 0 01-2273-2137 8145 8145 0 01-1514-4740 8093 8093 0 013093-6395 8082 8082 0 011373-859c312-148 846-414 1554-404a3236 3236 0 012569 1297 3184 3184 0 01636 1866c0-21 2446-7960-8005-7960-4390 0-8004 4166-8004 7820 0 2319 538 4170 1212 5604a12833 12833 0 007684 6757 12795 12795 0 003908 610c1414 0 2774-233 4045-656a7575 7575 0 01-6278-803z'/%3E%3Cpath id='J' d='M16231 15886c-80 105-330 250-330 566 0 260 170 512 472 723 1438 1003 4149 868 4156 868a5954 5954 0 003027-839 6147 6147 0 001133-850 6180 6180 0 001910-4437c26-2242-796-3732-1133-4392-2120-4141-6694-6525-11668-6525-7011 0-12703 5635-12798 12620 47-3654 3679-6605 7996-6605 350 0 2346 34 4200 1007 1634 858 2490 1894 3086 2921 618 1067 728 2415 728 2952s-271 1333-780 1990z'/%3E%3Cuse fill='url(%23B)' xlink:href='%23H'/%3E%3Cuse fill='url(%23D)' opacity='.35' xlink:href='%23H'/%3E%3Cuse fill='url(%23C)' xlink:href='%23I'/%3E%3Cuse fill='url(%23E)' opacity='.4' xlink:href='%23I'/%3E%3Cuse fill='url(%23F)' xlink:href='%23J'/%3E%3Cuse fill='url(%23G)' xlink:href='%23J'/%3E%3C/svg%3E)
- ' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%239059ff' stop-opacity='0'/%3E%3Cstop offset='.3' stop-color='%238c4ff3' stop-opacity='.1'/%3E%3Cstop offset='.8' stop-color='%237716a8' stop-opacity='.5'/%3E%3Cstop offset='1' stop-color='%236e008b' stop-opacity='.6'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-g' cx='239.1' cy='34.6' r='171.6' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffe226'/%3E%3Cstop offset='.1' stop-color='%23ffdb27'/%3E%3Cstop offset='.3' stop-color='%23ffc82a'/%3E%3Cstop offset='.5' stop-color='%23ffa930'/%3E%3Cstop offset='.7' stop-color='%23ff7e37'/%3E%3Cstop offset='.8' stop-color='%23ff7139'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-h' cx='374' cy='-74.3' r='732.2' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-i' cx='304.6' cy='7.1' r='536.4' gradientTransform='rotate(84 303 4)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.3' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.6' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-j' cx='235' cy='98.1' r='457.1' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-k' cx='355.7' cy='124.9' r='500.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.2' stop-color='%23ffe141'/%3E%3Cstop offset='.5' stop-color='%23ffaf1e'/%3E%3Cstop offset='.6' stop-color='%23ff980e'/%3E%3C/radialGradient%3E%3ClinearGradient id='ff-a' x1='446.9' y1='76.8' x2='47.9' y2='461.8' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.4' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.5' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/linearGradient%3E%3ClinearGradient id='ff-l' x1='442.1' y1='74.8' x2='102.6' y2='414.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%23fff44f' stop-opacity='.8'/%3E%3Cstop offset='.3' stop-color='%23fff44f' stop-opacity='.6'/%3E%3Cstop offset='.5' stop-color='%23fff44f' stop-opacity='.2'/%3E%3Cstop offset='.6' stop-color='%23fff44f' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134a120 120 0 0 0-66 25 71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a229 229 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zM202 355l3 1-3-1zm55-145zm198-31z' fill='url(%23ff-a)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-b)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-c)'/%3E%3Cpath d='m362 195 1 1a130 130 0 0 0-22-29C266 92 322 5 331 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62z' fill='url(%23ff-d)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-e)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-f)'/%3E%3Cpath d='m171 151 5 3a111 111 0 0 1-1-58c-25 11-44 29-58 44 1 0 36 0 54 11z' fill='url(%23ff-g)'/%3E%3Cpath d='M18 261a242 242 0 0 0 231 197 207 207 0 0 0 206-279c8 56-20 110-64 146-86 71-169 43-186 31l-3-1c-50-24-71-70-67-110-42 0-57-35-57-35s38-28 89-4c46 22 90 4 90 4 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5l-5-3c-18-11-52-11-54-11-9-12-9-51-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73c0 1-9 38-5 57z' fill='url(%23ff-h)'/%3E%3Cpath d='M341 167a130 130 0 0 1 22 29 46 46 0 0 1 4 3c55 50 26 121 24 126 44-36 72-90 64-146-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-9 5-65 92 10 167z' fill='url(%23ff-i)'/%3E%3Cpath d='M367 199a46 46 0 0 0-4-3l-1-1c-13-9-36-18-58-15 86 44 63 193-57 187a107 107 0 0 1-31-6 131 131 0 0 1-11-5c17 12 99 39 186-31 2-5 31-76-24-126z' fill='url(%23ff-j)'/%3E%3Cpath d='M148 277s12-41 80-41c7 0 28-20 29-26s-44 18-90-4c-51-24-89 4-89 4s15 35 57 35c-4 40 16 85 67 110l3 1c-29-15-54-44-57-79z' fill='url(%23ff-k)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62-13-9-36-18-58-14 86 43 63 192-57 186a107 107 0 0 1-31-6 131 131 0 0 1-11-5l-3-1 3 1c-29-15-54-44-57-79 0 0 12-41 80-41 7 0 28-20 29-26 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a279 279 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zm-24 13z' fill='url(%23ff-l)'/%3E%3C/svg%3E)
- ' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-color='%2324a5f3' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%231e8ceb' /%3E%3C/radialGradient%3E%3CradialGradient id='s-j' cx='109.3' cy='13.8' r='93.1' gradientTransform='matrix(-.02 1.1 -1.04 -.02 137 -115)' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235488d6' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235d96eb' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='220' height='220' x='22' y='-107' fill='url(%23s-a)' ry='49' transform='matrix(.57 0 0 .57 187 256)' /%3E%3Cg transform='translate(194 190)'%3E%3Ccircle cx='67.8' cy='67.7' fill='url(%23s-c)' paint-order='stroke fill markers' r='54' /%3E%3Ccircle cx='-69.9' cy='69.3' fill='url(%23s-i)' transform='translate(138 -2)' r='54' /%3E%3C/g%3E%3Cellipse cx='120' cy='14.2' fill='url(%23s-j)' rx='93.1' ry='93.7' transform='matrix(.58 0 0 .58 192 250)' /%3E%3Cg transform='matrix(.58 0 0 .57 197 182)'%3E%3Cpath fill='%23cac7c8' d='M46 192h1l72-48-7-9-66 57Z' /%3E%3Cpath fill='%23fbfffc' d='M46 191v1l66-57-7-9-59 65Z' /%3E%3Cpath fill='url(%23s-d)' d='m119 144-7-9 66-57-59 66Z' /%3E%3Cpath fill='%23fb645c' d='m105 126 7 9 66-57-1-1-72 49Z' /%3E%3C/g%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='1' stroke-width='1.3' d='m287 278 3-2m-12-17 8-2m-8-3h4m-4-13 8 2m-8 3h4m-1-13 7 3m-4-11 7 4m-2-11 6 6m0-12 6 7m1-11 4 6m4-10 3 7m5-9 2 7m15-7-1 7m10-5-3 7m11-4-4 7m11-2-5 6m16 7-7 4m10 4-7 3m10 6-8 1m8 16-8-2m5 10-7-3m4 11-7-4m2 11-6-5m0 11-5-6m-2 11-4-7m-4 11-3-8m-6 10-1-8m-16 8 2-8m-10 5 3-7m-11 4 4-7m-11 2 5-6m-8 3 3-3m4 8 2-3m5 8 2-4m6 7 1-4m8 5v-4m8 4v-4m9 3-1-4m9 1-2-4m9 0-2-4m9-2-3-3m8-4-3-2m8-5-4-2m7-6-4-1m5-8h-4m4-8h-4m3-9-4 1m1-9-4 2m-1-9-3 2m-2-9-3 3m-4-8-2 3m-5-8-2 4m-6-6-1 3m-8-5v4m-8-4v4m-9-2 1 3m-9 0 2 3m-9 1 2 3m-9 2 3 3m-8 4 3 2m-8 5 4 2m-7 6 4 1m-4 25 4-1m-2 5 7-3m-6 7 4-2m-2 6 7-4m-13-21h8m41-41v-8m0 99v-8m49-42h-8' transform='translate(-65 8)' /%3E%3C/svg%3E)

[Source](https://developer.mozilla.org/docs/Web/CSS/Reference/At-rules/@media)

## Viewport dimensions

By far the most popular media queries on the web are the ones dealing with viewport width. But even here, you're presented with a choice. You can use the `max-width` media feature to apply styles below a certain width, or you can use the `min-width` media feature to apply styles above a certain width.

    main {
      display: grid;
      grid-template-columns: 2fr 1fr;
    }

    @media (max-width: 45em) {
      main {
        display: block;
      }
    }

    @media (min-width: 45em) {
      main {
        display: grid;
        grid-template-columns: 2fr 1fr;
      }
    }

Personally, I like to use `min-width`. I apply layout styles in an additive way. I introduce new layout rules at each breakpoint instead of undoing previous rules.

This additive approach also works for height. Using `min-height` you can introduce more rules as more viewport height becomes available. For example, you might have a header element that you want to anchor to the top of the browser window if there's enough vertical space.

    @media (min-height: 30em) {
      header {
        position: fixed;
      }
    }

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/PoJbdaN?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen PoJbdaN by web-dot-dev on Codepen">
</iframe>

But you can use the `max-height` media feature if you prefer. Here, the header is anchored by default, but the stickiness is removed if there isn't enough vertical space.

    header {
      position: fixed;
    }
    @media (max-height: 30em) {
      header {
        position: static;
      }
    }

Choosing between `min-` and `max-` prefixes doesn't just apply to [`width`](https://developer.mozilla.org/docs/Web/CSS/@media/width) and [`height`](https://developer.mozilla.org/docs/Web/CSS/@media/height). The [`aspect-ratio`](https://developer.mozilla.org/docs/Web/CSS/@media/aspect-ratio) media feature offers the same choice. It also offers an unprefixed version if you want to apply styles at an exact ratio of width to height.

```css
@media (min-aspect-ratio: 16/9) {
  // The ratio of width to height is at least 16 by 9.
}
@media (max-aspect-ratio: 16/9) {
  // The ratio of width to height is less than 16 by 9.
}
@media (aspect-ratio: 16/9) {
  // The ratio of width to height is exactly 16 by 9.
}
```

Providing different styles for different aspect ratios could quickly get out of hand. If you don't need that fine-grained level of control, the [`orientation`](https://developer.mozilla.org/docs/Web/CSS/@media/orientation) media feature might better suit your needs. It has two possible values: `portrait` or `landscape`.

```css
@media (orientation: portrait) {
  // The width is less than the height.
}
@media (orientation: landscape) {
  // The width is greater than the height.
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/qBXVowV?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen qBXVowV by web-dot-dev on Codepen">
</iframe>

Even though the terms "portrait" and "landscape" are most often used to refer to the orientation of mobile devices, the `orientation` media feature isn't device-specific. A full-screen browser window on a typical laptop will have an `orientation` value of `landscape`.

## Displays

Different displays have different pixel densities, measured in `dpi`, dots per inch. You can adjust your styles for different pixel densities using the [`resolution`](https://developer.mozilla.org/docs/Web/CSS/@media/resolution) media feature. Like `aspect-ratio`, `resolution` comes in three varieties: minimum, maximum, and exact.

```css
@media (min-resolution: 300dpi) {
  // The display has a pixel density of at least 300 dots per inch.
}
@media (max-resolution: 300dpi) {
  // The display has a pixel density less than 300 dots per inch.
}
@media (resolution: 300dpi) {
  // The display has a pixel density of exactly 300 dots per inch.
}
```

You may never need to use any `resolution` media queries. Pixel density is usually only an issue for images, and [responsive images](https://web.dev/learn/design/responsive-images.md.txt) are a way of dealing with pixel density directly in HTML.

On the other hand, CSS is where you define your animations and transitions. You can adjust those animations and transitions to respond to different refresh rates using the [`update`](https://developer.mozilla.org/docs/Web/CSS/@media/update-frequency) media feature. This media feature reports one of three values: `none`, `slow`, and `fast`.

An `update` value of `none` means there's no refresh rate. A printed page, for example, can't be updated.

An `update` value of `slow` means the display can't refresh quickly. An e-ink display is one example of a screen with a slow refresh rate.

An `update` value of `fast` means the display refreshes fast enough to handle animations and transitions.

```css
@media (update: fast) {
  a {
    transition-duration: 0.4s;
    transition-property: transform;
  }
  a:hover {
    transform: scale(150%);
  }
}
```

Not all aspects of the display are related to hardware capabilities. In [the module on theming](https://web.dev/learn/design/theming.md.txt), you saw how to define properties in a [web app manifest](https://web.dev/articles/add-manifest.md.txt) file. One of those properties is called `display`, and you can give it a value of `fullscreen`, `standalone`, `minimum-ui`, or `browser`. The corresponding [`display-mode`](https://developer.mozilla.org/docs/Web/CSS/@media/display-mode) media feature lets you tailor your styles for these different options.

Say you've provided a `display` value of `standalone` in your web app manifest. If someone adds your site to their home screen, the site will launch without any browser interface. You might decide to display a back button for those users.

```css
button.back {
  display: none;
}
@media (display-mode: standalone) {
  button.back {
     display: inline;
  }
}
```

## Color

There are numerous media features for querying the color capabilities of a device. If you want to adjust your styles for any display that only outputs shades of grey, you can use the [`monochrome`](https://developer.mozilla.org/docs/Web/CSS/@media/monochrome) media feature without any value.

```css
@media (monochrome) {
  body {
    color: black;
    background-color: white;
  }
}
```

There's a corresponding [`color`](https://developer.mozilla.org/docs/Web/CSS/@media/color) media feature.

```css
@media (color) {
  body {
    color: maroon;
    background-color: linen;
  }
}
```

For color screens, you can write queries with the media features [`color-gamut`](https://developer.mozilla.org/docs/Web/CSS/@media/color-gamut), [`color-index`](https://developer.mozilla.org/docs/Web/CSS/@media/color-index), or [`dynamic-range`](https://www.w3.org/TR/mediaqueries-5/#dynamic-range). All of them report specific details about the color capabilities of the screen.

In this example, color values update in response to the `dynamic-range` media feature, which reports the combination of maximum brightness, color depth, and contrast ratio of the display. The possible values are `standard` or `high`. A high-definition screen that reports a `dynamic-range` value of `high` is given a different color space using the new CSS `color()` function.

    .neon-red {
      color: hsl(355 100% 95%);
    }
    @media (dynamic-range: high) {
      .neon-red {
        color: color(display-p3 1 0 0);
      }
    }

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/BawQOPQ?height=400&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen BawQOPQ by web-dot-dev on Codepen">
</iframe>

## Interaction

Media features can also report the kind of input mechanism used to interact with your site: `hover`, `any-hover`, `pointer`, and `any-pointer`. See [the module on interaction](https://web.dev/learn/design/interaction.md.txt) for more details.

## User preference queries

Using CSS, you can collaborate with your users to make sure that they can access your content in a way that works for them. In this lesson, you've learned how to apply different CSS based on the dimensions and features of the user's device. But you can also apply different CSS based on the user's settings.

### Dark and light mode

You can respond to your user's preference for a light or dark theme. Many users set this as a system preference.

#### Setting the color scheme for UI elements

The browser provides default colors for things like scrollbars and form elements. You can specify whether to use a light theme for those with `color-scheme: light`, or a dark theme with `color-scheme: dark`. You can also specify that the page supports both, with `color-scheme: light dark`. You can set this on the `:root` or `html` element to set the scheme for the entire page, or you can override it for specific elements.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/ZYboJXa?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen ZYboJXa by web-dot-dev on Codepen">
</iframe>

You can also set a `meta` tag for `color-scheme` to set a page's scheme before your styles load. If you set `color-scheme: normal` on an element in the page, it will use the `color-scheme` value that you set in this meta tag.

```html
<meta name="color-scheme" content="dark light">
```

#### `prefers-color-scheme` media feature

You can also define custom styles in response to a user's preferred color theme with a media query for `prefers-color-scheme`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/JoYvyrm?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen JoYvyrm by web-dot-dev on Codepen">
</iframe>

#### `light-dark`

If you are providing your users the choice between both a light and a dark theme, you may find it verbose to set each color inside of a media query. `light-dark()` lets you specify both in a single property.

<iframe src="https:///frame/learn/design/media-features/index_af7a8d4fff2f9da511b7cc9c27bdd838fc825d6bca9d34fe9ad825568c312b92.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

To enable this, you need to set `color-scheme: light dark` on the element or one of its ancestors.
You first set a color to use in light mode, and then a color to use in dark mode.

```css
h1{
  color: light-dark( var(--text-light), var(--text-dark));
}
```

If a user has their system preference set to request light mode, the heading will be black. If their preference is dark mode, the heading will be white.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/bNVMrYe?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen bNVMrYe by web-dot-dev on Codepen">
</iframe>

## Contrast preferences

Your users may find it easier to read content with high or low contrast, and may set up their system to override your theme with what works best for them. Your role is to ensure that your site still works well with their preferences.

You may remember in the [Cascade module](https://web.dev/learn/css/the-cascade.md.txt#origin) that `!important` local user styles can override the authored styles that a web page provides. This allows users to use styles that work better for them.

### Forced colors

Windows provides "Contrast themes" that users can select that override the themes on a website. These are often high contrast themes, and may be in light or dark mode. In CSS, this is called forced colors, and in most cases, your site will behave as expected in this mode. Buttons, links, inputs, and other content will use the theme's colors.

Occasionally, you may need to adjust your styles, for example if you are using elements in non-standard ways. You can use the `@media (forced-colors: active)` media query to apply styles when a user has enabled forced colors.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/KwdRvym?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen KwdRvym by web-dot-dev on Codepen">
</iframe>

In some cases, a site's styles are integral to understanding the content itself, for example with a color picker or a graph with a color key. You can set `forced-color-adjust: none;` on an element to opt out of forced colors mode. Make sure to only opt out on specific elements, and to check that the content is still accessible in forced colors mode.

### High contrast

Some users may also set their system to request increased contrast. You can adjust your styles in response with the `prefers-contrast: more` media query.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/emprEeV?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen emprEeV by web-dot-dev on Codepen">
</iframe>

> [!NOTE]
> **Note:** While forced colors replace colors on your page, they don't necessarily indicate a preference for higher contrast. When forced colors is enabled, `prefers-contrast` will also be set to `more` for high contrast themes, `less` for low contrast themes, and `custom` if the system can't determine if it's high or low. To target users who request high contrast but don't have forced colors enabled, you can use `@media (prefers-contrast: more) and (forced-colors: none) {}`.

## Reduced motion

You can respond to a user's preference for reduced motion with the `prefers-reduced-motion` media query. This is often used to provide alternate animations that avoid large movements that may be triggers for people with epilepsy, vestibular motion disorders, or migraine sensitivity. Read more in [Considerations when working with animation](https://web.dev/learn/css/animations.md.txt#tips).
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/myeLMpd?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen myeLMpd by web-dot-dev on Codepen">
</iframe>

## Scripting

Your users may visit your site with JavaScript disabled, and you can adjust your CSS so that they can still access your content using the `scripting` media query.

```css
@media (scripting: none) {
  /* Styles when JavaScript is disabled*/
 }

@media (scripting: initial-only) {
  /* Styles when JavaScript is available only for an initial render, for example with a printed page or server side rendering */
}

@media (scripting: enabled) {
   /* Styles when Javascript is enabled */
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/KwdRvZq?height=500&amp;theme-id=dark&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen KwdRvZq by web-dot-dev on Codepen">
</iframe>

## Check your understanding

Test your knowledge of media features
A media query can check for a device at a specific width like `@media (width: 1024px)`?
True A specific width can only be accomplished by simultaneously checking for width above `1023px` and below `1025px`. False `min-width` and `max-width` are what is available. A media query can check for a device at a specific `aspect-ratio` like `@media (aspect-ratio: 4/3)`?
True Unique to aspect ratio, a single ratio can be matched. False This option does exist for `aspect-ratio`. Which are valid color media queries?
`@media (color)` Matches any color device. `@media (monochrome)` Matches any device without color capability. `@media (color-gamut: srgb)` Matches devices with sRGB color capability. `@media (min-color-index: 15000)` Matches devices with at least 15k colors available. `@media (dynamic-range: high)` Matches devices capable of HD color ranges. Which of the following user preference media queries are valid?
`@media (prefers-color-scheme: dark)` Matches when a user has their operating system set to dark mode. `@media (prefers-colors: high-definition)` Not real. `@media (prefers-reduced-motion: reduce)` Matches when a user has their operating system set to reduce motion. `@media (prefers-contrast: more)` Matches when a user has their operating system set to higher contrasts. `@media (prefers-site-speed: fast)` Not real. What are valid values for `color-scheme`?
`light` Correct! `dark` Correct! `night` Incorrect. `contrast` Incorrect. How do you opt an element out of forced colors?
`forced-colors: active` Incorrect. `forced-colors: inactive` Incorrect. `forced-colors-adjust: none` Correct! `forced-colors-adjust: normal` Incorrect.
