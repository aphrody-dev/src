---
source_url: https://web.dev/learn/css/borders
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:19+00:00
sha256: 9a6fc0ba3f9ac40392e472f32c2b57c94e920399fb5b158bf7ef02fc0c0632b6
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---
##### [The CSS Podcast - 016: Borders](https://thecsspodcast.libsyn.com/016-borders)

In the [box model](https://web.dev/learn/css/box-model.md.txt) module,
we considered a frame analogy to describe each section of the box model.

The border box is the frame of your boxes,
and the `border` properties give you a huge array of options to create that frame in
nearly any style that you can think of.

## Border properties

The individual `border` properties provide a way to style the various parts of a border.

Browser Support

- ' d='M96 183a64 64 0 0 1-23-23L17 64a128 128 0 0 0 111 192l55-96a64 64 0 0 1-87 23Z'/%3E%3Cpath fill='url(%23b)' d='M192 128a64 64 0 0 1-9 32l-55 96A128 128 0 0 0 239 64H128a64 64 0 0 1 64 64Z'/%3E%3Ccircle cx='128' cy='128' r='52' fill='%231a73e8'/%3E%3Cpath fill='url(%23c)' d='M96 73a64 64 0 0 1 32-9h111a128 128 0 0 0-222 0l56 96a64 64 0 0 1 23-87Z'/%3E%3C/svg%3E)
- ' xlink:href='%23A'%3E%3Cstop offset='.76' stop-opacity='0'/%3E%3Cstop offset='.95' stop-opacity='.5'/%3E%3Cstop offset='1'/%3E%3C/radialGradient%3E%3CradialGradient id='F' cx='2523' cy='4680' r='20243' gradientTransform='matrix(-.03715 .99931 -2.12836 -.07913 13579 3530)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2335c1f1'/%3E%3Cstop offset='.11' stop-color='%2334c1ed'/%3E%3Cstop offset='.23' stop-color='%232fc2df'/%3E%3Cstop offset='.31' stop-color='%232bc3d2'/%3E%3Cstop offset='.67' stop-color='%2336c752'/%3E%3C/radialGradient%3E%3CradialGradient id='G' cx='24247' cy='7758' r='9734' gradientTransform='matrix(.28109 .95968 -.78353 .22949 24510 -16292)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2366eb6e'/%3E%3Cstop offset='1' stop-color='%2366eb6e' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cpath id='H' d='M24105 20053a9345 9345 0 01-1053 472 10202 10202 0 01-3590 646c-4732 0-8855-3255-8855-7432 0-1175 680-2193 1643-2729-4280 180-5380 4640-5380 7253 0 7387 6810 8137 8276 8137 791 0 1984-230 2704-456l130-44a12834 12834 0 006660-5282c220-350-168-757-535-565z'/%3E%3Cpath id='I' d='M11571 25141a7913 7913 0 01-2273-2137 8145 8145 0 01-1514-4740 8093 8093 0 013093-6395 8082 8082 0 011373-859c312-148 846-414 1554-404a3236 3236 0 012569 1297 3184 3184 0 01636 1866c0-21 2446-7960-8005-7960-4390 0-8004 4166-8004 7820 0 2319 538 4170 1212 5604a12833 12833 0 007684 6757 12795 12795 0 003908 610c1414 0 2774-233 4045-656a7575 7575 0 01-6278-803z'/%3E%3Cpath id='J' d='M16231 15886c-80 105-330 250-330 566 0 260 170 512 472 723 1438 1003 4149 868 4156 868a5954 5954 0 003027-839 6147 6147 0 001133-850 6180 6180 0 001910-4437c26-2242-796-3732-1133-4392-2120-4141-6694-6525-11668-6525-7011 0-12703 5635-12798 12620 47-3654 3679-6605 7996-6605 350 0 2346 34 4200 1007 1634 858 2490 1894 3086 2921 618 1067 728 2415 728 2952s-271 1333-780 1990z'/%3E%3Cuse fill='url(%23B)' xlink:href='%23H'/%3E%3Cuse fill='url(%23D)' opacity='.35' xlink:href='%23H'/%3E%3Cuse fill='url(%23C)' xlink:href='%23I'/%3E%3Cuse fill='url(%23E)' opacity='.4' xlink:href='%23I'/%3E%3Cuse fill='url(%23F)' xlink:href='%23J'/%3E%3Cuse fill='url(%23G)' xlink:href='%23J'/%3E%3C/svg%3E)
- ' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%239059ff' stop-opacity='0'/%3E%3Cstop offset='.3' stop-color='%238c4ff3' stop-opacity='.1'/%3E%3Cstop offset='.8' stop-color='%237716a8' stop-opacity='.5'/%3E%3Cstop offset='1' stop-color='%236e008b' stop-opacity='.6'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-g' cx='239.1' cy='34.6' r='171.6' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffe226'/%3E%3Cstop offset='.1' stop-color='%23ffdb27'/%3E%3Cstop offset='.3' stop-color='%23ffc82a'/%3E%3Cstop offset='.5' stop-color='%23ffa930'/%3E%3Cstop offset='.7' stop-color='%23ff7e37'/%3E%3Cstop offset='.8' stop-color='%23ff7139'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-h' cx='374' cy='-74.3' r='732.2' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-i' cx='304.6' cy='7.1' r='536.4' gradientTransform='rotate(84 303 4)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.3' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.6' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-j' cx='235' cy='98.1' r='457.1' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-k' cx='355.7' cy='124.9' r='500.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.2' stop-color='%23ffe141'/%3E%3Cstop offset='.5' stop-color='%23ffaf1e'/%3E%3Cstop offset='.6' stop-color='%23ff980e'/%3E%3C/radialGradient%3E%3ClinearGradient id='ff-a' x1='446.9' y1='76.8' x2='47.9' y2='461.8' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.4' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.5' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/linearGradient%3E%3ClinearGradient id='ff-l' x1='442.1' y1='74.8' x2='102.6' y2='414.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%23fff44f' stop-opacity='.8'/%3E%3Cstop offset='.3' stop-color='%23fff44f' stop-opacity='.6'/%3E%3Cstop offset='.5' stop-color='%23fff44f' stop-opacity='.2'/%3E%3Cstop offset='.6' stop-color='%23fff44f' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134a120 120 0 0 0-66 25 71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a229 229 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zM202 355l3 1-3-1zm55-145zm198-31z' fill='url(%23ff-a)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-b)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-c)'/%3E%3Cpath d='m362 195 1 1a130 130 0 0 0-22-29C266 92 322 5 331 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62z' fill='url(%23ff-d)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-e)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-f)'/%3E%3Cpath d='m171 151 5 3a111 111 0 0 1-1-58c-25 11-44 29-58 44 1 0 36 0 54 11z' fill='url(%23ff-g)'/%3E%3Cpath d='M18 261a242 242 0 0 0 231 197 207 207 0 0 0 206-279c8 56-20 110-64 146-86 71-169 43-186 31l-3-1c-50-24-71-70-67-110-42 0-57-35-57-35s38-28 89-4c46 22 90 4 90 4 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5l-5-3c-18-11-52-11-54-11-9-12-9-51-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73c0 1-9 38-5 57z' fill='url(%23ff-h)'/%3E%3Cpath d='M341 167a130 130 0 0 1 22 29 46 46 0 0 1 4 3c55 50 26 121 24 126 44-36 72-90 64-146-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-9 5-65 92 10 167z' fill='url(%23ff-i)'/%3E%3Cpath d='M367 199a46 46 0 0 0-4-3l-1-1c-13-9-36-18-58-15 86 44 63 193-57 187a107 107 0 0 1-31-6 131 131 0 0 1-11-5c17 12 99 39 186-31 2-5 31-76-24-126z' fill='url(%23ff-j)'/%3E%3Cpath d='M148 277s12-41 80-41c7 0 28-20 29-26s-44 18-90-4c-51-24-89 4-89 4s15 35 57 35c-4 40 16 85 67 110l3 1c-29-15-54-44-57-79z' fill='url(%23ff-k)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62-13-9-36-18-58-14 86 43 63 192-57 186a107 107 0 0 1-31-6 131 131 0 0 1-11-5l-3-1 3 1c-29-15-54-44-57-79 0 0 12-41 80-41 7 0 28-20 29-26 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a279 279 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zm-24 13z' fill='url(%23ff-l)'/%3E%3C/svg%3E)
- ' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-color='%2324a5f3' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%231e8ceb' /%3E%3C/radialGradient%3E%3CradialGradient id='s-j' cx='109.3' cy='13.8' r='93.1' gradientTransform='matrix(-.02 1.1 -1.04 -.02 137 -115)' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235488d6' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235d96eb' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='220' height='220' x='22' y='-107' fill='url(%23s-a)' ry='49' transform='matrix(.57 0 0 .57 187 256)' /%3E%3Cg transform='translate(194 190)'%3E%3Ccircle cx='67.8' cy='67.7' fill='url(%23s-c)' paint-order='stroke fill markers' r='54' /%3E%3Ccircle cx='-69.9' cy='69.3' fill='url(%23s-i)' transform='translate(138 -2)' r='54' /%3E%3C/g%3E%3Cellipse cx='120' cy='14.2' fill='url(%23s-j)' rx='93.1' ry='93.7' transform='matrix(.58 0 0 .58 192 250)' /%3E%3Cg transform='matrix(.58 0 0 .57 197 182)'%3E%3Cpath fill='%23cac7c8' d='M46 192h1l72-48-7-9-66 57Z' /%3E%3Cpath fill='%23fbfffc' d='M46 191v1l66-57-7-9-59 65Z' /%3E%3Cpath fill='url(%23s-d)' d='m119 144-7-9 66-57-59 66Z' /%3E%3Cpath fill='%23fb645c' d='m105 126 7 9 66-57-1-1-72 49Z' /%3E%3C/g%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='1' stroke-width='1.3' d='m287 278 3-2m-12-17 8-2m-8-3h4m-4-13 8 2m-8 3h4m-1-13 7 3m-4-11 7 4m-2-11 6 6m0-12 6 7m1-11 4 6m4-10 3 7m5-9 2 7m15-7-1 7m10-5-3 7m11-4-4 7m11-2-5 6m16 7-7 4m10 4-7 3m10 6-8 1m8 16-8-2m5 10-7-3m4 11-7-4m2 11-6-5m0 11-5-6m-2 11-4-7m-4 11-3-8m-6 10-1-8m-16 8 2-8m-10 5 3-7m-11 4 4-7m-11 2 5-6m-8 3 3-3m4 8 2-3m5 8 2-4m6 7 1-4m8 5v-4m8 4v-4m9 3-1-4m9 1-2-4m9 0-2-4m9-2-3-3m8-4-3-2m8-5-4-2m7-6-4-1m5-8h-4m4-8h-4m3-9-4 1m1-9-4 2m-1-9-3 2m-2-9-3 3m-4-8-2 3m-5-8-2 4m-6-6-1 3m-8-5v4m-8-4v4m-9-2 1 3m-9 0 2 3m-9 1 2 3m-9 2 3 3m-8 4 3 2m-8 5 4 2m-7 6 4 1m-4 25 4-1m-2 5 7-3m-6 7 4-2m-2 6 7-4m-13-21h8m41-41v-8m0 99v-8m49-42h-8' transform='translate(-65 8)' /%3E%3C/svg%3E)

[Source](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/border)

### Style

For a border to appear,
you have to define the
[`border-style`](https://developer.mozilla.org/docs/Web/CSS/border-style).
There's a few options to choose from:
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/GRrvyxY?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen GRrvyxY by web-dot-dev on Codepen"></iframe>

When using the `ridge`, `inset`, `outset` and `groove` styles,
the browser will darken the border color for the second shown color to provide contrast and depth.
This behaviour can vary between browsers,
especially for dark colors such as `black`.
In Chrome, these border styles will appear to be solid and in Firefox,
they will be lightened to then provide a darker second color.

Browser behaviour can vary for other border styles too,
so it's important to test your site in different browsers.
A common example of this difference is how each browser renders the `dotted` and `dashed` styles.
 Borders displayed in Chrome, Firefox, and Safari.

To set border style on each side of your box,
you can use
[`border-top-style`](https://developer.mozilla.org/docs/Web/CSS/border-top-style),
[`border-right-style`](https://developer.mozilla.org/docs/Web/CSS/border-right-style),
[`border-left-style`](https://developer.mozilla.org/docs/Web/CSS/border-left-style),
and [`border-bottom-style`](https://developer.mozilla.org/docs/Web/CSS/border-bottom-style).

### Shorthand

As with `margin` and `padding`,
you can use the
[`border`](https://developer.mozilla.org/docs/Web/CSS/border)
shorthand property to define all the parts of your border in one declaration.

```css
.my-element {
    border: 1px solid red;
}
```

The order of values in the `border` shorthand are `border-width`,
`border-style` and then, `border-color`.

### Color

You can set color on all sides of your box or on each individual side with
[`border-color`](https://developer.mozilla.org/docs/Web/CSS/border-color).
By default, it uses the box's current text color: `currentColor`.
This means that if you only declare border properties,
like width,
the color will be that computed value unless you explicitly set it.

```css
.my-element {
    color: blue;
    border: solid; /* Will be a blue border */
}

.my-element {
    color: blue;
    border: solid yellow;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/yLgovoX?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen yLgovoX by web-dot-dev on Codepen"></iframe>

To set a border color on each side of your box,
use
[`border-top-color`](https://developer.mozilla.org/docs/Web/CSS/border-top-color),
[`border-right-color`](https://developer.mozilla.org/docs/Web/CSS/border-right-color),
[`border-left-color`](https://developer.mozilla.org/docs/Web/CSS/border-left-color) and
[`border-bottom-color`](https://developer.mozilla.org/docs/Web/CSS/border-bottom-color).
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/MWJvQVO?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen MWJvQVO by web-dot-dev on Codepen"></iframe>

### Width

The width of a border is how thick the line is, and is controlled by
[`border-width`](https://developer.mozilla.org/docs/Web/CSS/border-width).
The default border width is `medium`.
This won't be visible unless you define a style, though.
You can use other named widths such as `thin` and `thick`.
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/PoWKQxN?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen PoWKQxN by web-dot-dev on Codepen"></iframe>

The `border-width` properties also accept a length unit such as
`px`, `em`, `rem` or `%`.
To set border width on each side of your box, use
[`border-top-width`](https://developer.mozilla.org/docs/Web/CSS/border-top-width),
[`border-right-width`](https://developer.mozilla.org/docs/Web/CSS/border-right-width),
[`border-left-width`](https://developer.mozilla.org/docs/Web/CSS/border-left-width) and
[`border-bottom-width`](https://developer.mozilla.org/docs/Web/CSS/border-bottom-width).

## Logical properties

In the
[Logical Properties](https://web.dev/learn/css/logical-properties.md.txt) module you discovered how to refer to block flow and inline flow,
rather than explicit top, right, bottom or left sides.

You have this capability with borders, too:

```css
.my-element {
    border: 2px dotted;
    border-inline-end: 2px solid red;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/poRraBp?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen poRraBp by web-dot-dev on Codepen"></iframe>

In this example, `.my-element` has all sides defined as having a `2px`,
dotted border that is the current text color.
The `inline-end` border is then defined as `2px`, solid and red.
This means that in left-to-right languages---like English---
the red border will be on the right side of the box.
In right-to-left languages---like Arabic---
the red border will be on the left side of the box.

Browser support is varied for logical properties in borders,
so make sure you check support before using.

## Border radius

To give a box rounded corners use the
[`border-radius`](https://developer.mozilla.org/docs/Web/CSS/border-radius) property.

```css
.my-element {
    border-radius: 1em;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/LYxjQoK?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen LYxjQoK by web-dot-dev on Codepen"></iframe>

This shorthand adds a consistent border to each corner of your box.
As with the other border properties,
you can define the border radius for each side with
[`border-top-left-radius`](https://developer.mozilla.org/docs/Web/CSS/border-top-left-radius),
[`border-top-right-radius`](https://developer.mozilla.org/docs/Web/CSS/border-top-right-radius),
[`border-bottom-right-radius`](https://developer.mozilla.org/docs/Web/CSS/border-bottom-right-radius) and
[`border-bottom-left-radius`](https://developer.mozilla.org/docs/Web/CSS/border-bottom-left-radius).

You can also specify each corner's radius in the shorthand,
which follows the order: top left, top right, bottom right then bottom left.

```css
.my-element {
    border-radius: 1em 2em 3em 4em;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/yLgovdK?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen yLgovdK by web-dot-dev on Codepen"></iframe>

By defining a single value for a corner,
you are using another shorthand because a border radius is split into two parts:
the vertical and horizontal sides.
This means that when you set `border-top-left-radius: 1em`,
you are setting the top-left-**top** radius and the top-left-**left** radius.

You can define both properties, per corner like this:

```css
.my-element {
    border-top-left-radius: 1em 2em;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/WNRqoPM?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen WNRqoPM by web-dot-dev on Codepen"></iframe>

This adds a `border-top-left-top` value of `1em`,
and a `border-top-left-left` value of `2em`.
This converts the top left border radius into an elliptical radius,
rather than the default circular radius.

You can define these values in the `border-radius` shorthand,
using a `/` to define the elliptical values, after the standard values.
This enables you to get creative and make some complex shapes.

```css
.my-element {
    border: 2px solid;
  border-radius: 95px 155px 148px 103px / 48px 95px 130px 203px;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/abpyqeM?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen abpyqeM by web-dot-dev on Codepen"></iframe>

## Border images

You don't just have to use a stroke-based border in CSS.
You can also use any type of image, using
[`border-image`](https://developer.mozilla.org/docs/Web/CSS/border-image).
This shorthand property allows you to set the source image,
how that image is sliced, the image width,
how far the border is outset from the edge and how it should repeat.

```css
.my-element {
  border-image-source: url(https://assets.codepen.io/174183/border-image-frame.jpg);
  border-image-slice: 61 58 51 48;
  border-image-width: 20px 20px 20px 20px;
  border-image-outset: 0px 0px 0px 0px;
  border-image-repeat: stretch stretch;
}
```
<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/zYNdWNX?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen zYNdWNX by web-dot-dev on Codepen"></iframe>

The [`border-image-width`](https://developer.mozilla.org/docs/Web/CSS/border-image-width)
property is like `border-width`:
it is how you set the width of your border image.
The [`border-image-outset`](https://developer.mozilla.org/docs/Web/CSS/border-image-outset)
property lets you set the distance between your border image and the box that it wraps around.

### `border-image-source`

The [`border-image-source`](https://developer.mozilla.org/docs/Web/CSS/border-image-source)
(source of the border image) can be a `url` for any valid image, which includes CSS gradients.

```css
.my-element {
    border-image-source: url('path/to/image.png');
}

.my-element {
    border-image-source: linear-gradient(to bottom, #000, #fff);
}
```

### `border-image-slice`

The [`border-image-slice`](https://developer.mozilla.org/docs/Web/CSS/border-image-slice)
property is a useful property that allows you to slice an image into 9 parts, made up of 4 split lines.
It works like the `margin` shorthand where you define the top, right, bottom and left **offset value**.

```css
.my-element {
    border-image: url('image.jpg');
    border-image-slice: 61 58 51 48;
}
```

With the offset values defined,
you now have 9 sections of the image: 4 corners, 4 edges and a middle section.
The corners are applied to the corners of the element with the border image.
The edges are applied to the edges of that element.
The [`border-image-repeat`](https://developer.mozilla.org/docs/Web/CSS/border-image-repeat)
property defines how those edges fill their space and the
[`border-image-width`](https://developer.mozilla.org/docs/Web/CSS/border-image-width)
property controls the size of the slices.

Lastly, the `fill` keyword determines whether the middle section, left by the slicing, is used as the element's background image or not.

### `border-image-repeat`

[`border-image-repeat`](https://developer.mozilla.org/docs/Web/CSS/border-image-repeat)
is how you instruct CSS how you would like your border image to repeat.
It works the same as `background-repeat`.

- The initial value is `stretch`, which stretches the source image to fill available space where possible.
- The `repeat` value tiles the source image's edges as many times as possible, and may clip the edge regions to achieve this.
- The `round` value is the same as repeat, but instead of clipping the image edge regions to fit as many as possible, it stretches the image as well as repeating it to achieve a seamless repeat
- The `space` value is again, the same as repeat, but this value adds space between each edge region to create a seamless pattern.

<iframe allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi;" loading="lazy" src="https://codepen.io/web-dot-dev/embed/GRrvBYv?height=500&amp;theme-id=light&amp;default-tab=result&amp;editable=true" style="height: 100%; width: 100%; border: 0;" title="Pen GRrvBYv by web-dot-dev on Codepen"></iframe>

### Check your understanding

Test your knowledge of borders
Which is the default border color?
`black` Try again! `white` Try again! `currentColor` This special CSS value will represent the computed `text-color` value, and is the default border color. `historicColor` This is made up. Try again!

```css
.my-element {
  border: solid hotpink;
}
```

What is the default width of a border?
`1px` Try again! `medium` 🎉 `solid` This is a `border-style` value, not a `border-width` value. `border-inline: 1px solid` would...
put borders on the left and right (in Latin layouts). 🎉 put borders on the top and bottom (in Latin layouts). In a Latin layout like English, `border-block` would be the top and bottom. put borders on the inside. Try again! put borders on the first line. Try again!
