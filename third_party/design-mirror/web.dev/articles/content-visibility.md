---
source_url: https://web.dev/articles/content-visibility
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:57+00:00
sha256: 179d2b777c6e6735e7432b3bea20d8878f6018a8a3804d999632bc765d8d6fd2
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, web.dev
modified: images et avatars retirés ; texte inchangé sinon
---

Improve initial load time by skipping the rendering of offscreen content.

Una Kravets [X](https://twitter.com/una) [GitHub](https://github.com/una) [Bluesky](https://bsky.app/profile/una.im) [Homepage](https://una.im/) Jeremy Wagner [GitHub](https://github.com/malchata) [LinkedIn](https://www.linkedin.com/in/malchata) [Homepage](https://jlwagner.net/) Vladimir Levin

Published: August 5, 2020

> [!TIP]
> **Celebration:** This web feature is now available in all three major browser engines, and becomes **Baseline Newly available** as of September 15, 2025.

<iframe src="https:///frame/articles/content-visibility/index_ec9c555ab7d70c54491bee8dc0f3b7667d026259426329aacda7148b550d120f.frame" class="framebox inherit-locale " allow="clipboard-write https://" allowfullscreen is-upgraded></iframe>

The
[`content-visibility`](https://drafts.csswg.org/css-contain/#propdef-content-visibility)
property enables the
user agent to skip an element's rendering work, including layout and painting,
until it is needed. Because rendering is skipped, if a large portion of your
content is off-screen, using the `content-visibility` property makes the
initial user load much faster. It also allows for faster interactions with the
on-screen content. Pretty neat.

Browser Support

- ' d='M96 183a64 64 0 0 1-23-23L17 64a128 128 0 0 0 111 192l55-96a64 64 0 0 1-87 23Z'/%3E%3Cpath fill='url(%23b)' d='M192 128a64 64 0 0 1-9 32l-55 96A128 128 0 0 0 239 64H128a64 64 0 0 1 64 64Z'/%3E%3Ccircle cx='128' cy='128' r='52' fill='%231a73e8'/%3E%3Cpath fill='url(%23c)' d='M96 73a64 64 0 0 1 32-9h111a128 128 0 0 0-222 0l56 96a64 64 0 0 1 23-87Z'/%3E%3C/svg%3E)
- ' xlink:href='%23A'%3E%3Cstop offset='.76' stop-opacity='0'/%3E%3Cstop offset='.95' stop-opacity='.5'/%3E%3Cstop offset='1'/%3E%3C/radialGradient%3E%3CradialGradient id='F' cx='2523' cy='4680' r='20243' gradientTransform='matrix(-.03715 .99931 -2.12836 -.07913 13579 3530)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2335c1f1'/%3E%3Cstop offset='.11' stop-color='%2334c1ed'/%3E%3Cstop offset='.23' stop-color='%232fc2df'/%3E%3Cstop offset='.31' stop-color='%232bc3d2'/%3E%3Cstop offset='.67' stop-color='%2336c752'/%3E%3C/radialGradient%3E%3CradialGradient id='G' cx='24247' cy='7758' r='9734' gradientTransform='matrix(.28109 .95968 -.78353 .22949 24510 -16292)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2366eb6e'/%3E%3Cstop offset='1' stop-color='%2366eb6e' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cpath id='H' d='M24105 20053a9345 9345 0 01-1053 472 10202 10202 0 01-3590 646c-4732 0-8855-3255-8855-7432 0-1175 680-2193 1643-2729-4280 180-5380 4640-5380 7253 0 7387 6810 8137 8276 8137 791 0 1984-230 2704-456l130-44a12834 12834 0 006660-5282c220-350-168-757-535-565z'/%3E%3Cpath id='I' d='M11571 25141a7913 7913 0 01-2273-2137 8145 8145 0 01-1514-4740 8093 8093 0 013093-6395 8082 8082 0 011373-859c312-148 846-414 1554-404a3236 3236 0 012569 1297 3184 3184 0 01636 1866c0-21 2446-7960-8005-7960-4390 0-8004 4166-8004 7820 0 2319 538 4170 1212 5604a12833 12833 0 007684 6757 12795 12795 0 003908 610c1414 0 2774-233 4045-656a7575 7575 0 01-6278-803z'/%3E%3Cpath id='J' d='M16231 15886c-80 105-330 250-330 566 0 260 170 512 472 723 1438 1003 4149 868 4156 868a5954 5954 0 003027-839 6147 6147 0 001133-850 6180 6180 0 001910-4437c26-2242-796-3732-1133-4392-2120-4141-6694-6525-11668-6525-7011 0-12703 5635-12798 12620 47-3654 3679-6605 7996-6605 350 0 2346 34 4200 1007 1634 858 2490 1894 3086 2921 618 1067 728 2415 728 2952s-271 1333-780 1990z'/%3E%3Cuse fill='url(%23B)' xlink:href='%23H'/%3E%3Cuse fill='url(%23D)' opacity='.35' xlink:href='%23H'/%3E%3Cuse fill='url(%23C)' xlink:href='%23I'/%3E%3Cuse fill='url(%23E)' opacity='.4' xlink:href='%23I'/%3E%3Cuse fill='url(%23F)' xlink:href='%23J'/%3E%3Cuse fill='url(%23G)' xlink:href='%23J'/%3E%3C/svg%3E)
- ' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%239059ff' stop-opacity='0'/%3E%3Cstop offset='.3' stop-color='%238c4ff3' stop-opacity='.1'/%3E%3Cstop offset='.8' stop-color='%237716a8' stop-opacity='.5'/%3E%3Cstop offset='1' stop-color='%236e008b' stop-opacity='.6'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-g' cx='239.1' cy='34.6' r='171.6' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffe226'/%3E%3Cstop offset='.1' stop-color='%23ffdb27'/%3E%3Cstop offset='.3' stop-color='%23ffc82a'/%3E%3Cstop offset='.5' stop-color='%23ffa930'/%3E%3Cstop offset='.7' stop-color='%23ff7e37'/%3E%3Cstop offset='.8' stop-color='%23ff7139'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-h' cx='374' cy='-74.3' r='732.2' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-i' cx='304.6' cy='7.1' r='536.4' gradientTransform='rotate(84 303 4)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.3' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.6' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-j' cx='235' cy='98.1' r='457.1' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-k' cx='355.7' cy='124.9' r='500.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.2' stop-color='%23ffe141'/%3E%3Cstop offset='.5' stop-color='%23ffaf1e'/%3E%3Cstop offset='.6' stop-color='%23ff980e'/%3E%3C/radialGradient%3E%3ClinearGradient id='ff-a' x1='446.9' y1='76.8' x2='47.9' y2='461.8' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.4' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.5' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/linearGradient%3E%3ClinearGradient id='ff-l' x1='442.1' y1='74.8' x2='102.6' y2='414.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%23fff44f' stop-opacity='.8'/%3E%3Cstop offset='.3' stop-color='%23fff44f' stop-opacity='.6'/%3E%3Cstop offset='.5' stop-color='%23fff44f' stop-opacity='.2'/%3E%3Cstop offset='.6' stop-color='%23fff44f' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134a120 120 0 0 0-66 25 71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a229 229 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zM202 355l3 1-3-1zm55-145zm198-31z' fill='url(%23ff-a)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-b)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-c)'/%3E%3Cpath d='m362 195 1 1a130 130 0 0 0-22-29C266 92 322 5 331 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62z' fill='url(%23ff-d)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-e)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-f)'/%3E%3Cpath d='m171 151 5 3a111 111 0 0 1-1-58c-25 11-44 29-58 44 1 0 36 0 54 11z' fill='url(%23ff-g)'/%3E%3Cpath d='M18 261a242 242 0 0 0 231 197 207 207 0 0 0 206-279c8 56-20 110-64 146-86 71-169 43-186 31l-3-1c-50-24-71-70-67-110-42 0-57-35-57-35s38-28 89-4c46 22 90 4 90 4 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5l-5-3c-18-11-52-11-54-11-9-12-9-51-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73c0 1-9 38-5 57z' fill='url(%23ff-h)'/%3E%3Cpath d='M341 167a130 130 0 0 1 22 29 46 46 0 0 1 4 3c55 50 26 121 24 126 44-36 72-90 64-146-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-9 5-65 92 10 167z' fill='url(%23ff-i)'/%3E%3Cpath d='M367 199a46 46 0 0 0-4-3l-1-1c-13-9-36-18-58-15 86 44 63 193-57 187a107 107 0 0 1-31-6 131 131 0 0 1-11-5c17 12 99 39 186-31 2-5 31-76-24-126z' fill='url(%23ff-j)'/%3E%3Cpath d='M148 277s12-41 80-41c7 0 28-20 29-26s-44 18-90-4c-51-24-89 4-89 4s15 35 57 35c-4 40 16 85 67 110l3 1c-29-15-54-44-57-79z' fill='url(%23ff-k)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62-13-9-36-18-58-14 86 43 63 192-57 186a107 107 0 0 1-31-6 131 131 0 0 1-11-5l-3-1 3 1c-29-15-54-44-57-79 0 0 12-41 80-41 7 0 28-20 29-26 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a279 279 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zm-24 13z' fill='url(%23ff-l)'/%3E%3C/svg%3E)
- ' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-color='%2324a5f3' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%231e8ceb' /%3E%3C/radialGradient%3E%3CradialGradient id='s-j' cx='109.3' cy='13.8' r='93.1' gradientTransform='matrix(-.02 1.1 -1.04 -.02 137 -115)' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235488d6' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235d96eb' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='220' height='220' x='22' y='-107' fill='url(%23s-a)' ry='49' transform='matrix(.57 0 0 .57 187 256)' /%3E%3Cg transform='translate(194 190)'%3E%3Ccircle cx='67.8' cy='67.7' fill='url(%23s-c)' paint-order='stroke fill markers' r='54' /%3E%3Ccircle cx='-69.9' cy='69.3' fill='url(%23s-i)' transform='translate(138 -2)' r='54' /%3E%3C/g%3E%3Cellipse cx='120' cy='14.2' fill='url(%23s-j)' rx='93.1' ry='93.7' transform='matrix(.58 0 0 .58 192 250)' /%3E%3Cg transform='matrix(.58 0 0 .57 197 182)'%3E%3Cpath fill='%23cac7c8' d='M46 192h1l72-48-7-9-66 57Z' /%3E%3Cpath fill='%23fbfffc' d='M46 191v1l66-57-7-9-59 65Z' /%3E%3Cpath fill='url(%23s-d)' d='m119 144-7-9 66-57-59 66Z' /%3E%3Cpath fill='%23fb645c' d='m105 126 7 9 66-57-1-1-72 49Z' /%3E%3C/g%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='1' stroke-width='1.3' d='m287 278 3-2m-12-17 8-2m-8-3h4m-4-13 8 2m-8 3h4m-1-13 7 3m-4-11 7 4m-2-11 6 6m0-12 6 7m1-11 4 6m4-10 3 7m5-9 2 7m15-7-1 7m10-5-3 7m11-4-4 7m11-2-5 6m16 7-7 4m10 4-7 3m10 6-8 1m8 16-8-2m5 10-7-3m4 11-7-4m2 11-6-5m0 11-5-6m-2 11-4-7m-4 11-3-8m-6 10-1-8m-16 8 2-8m-10 5 3-7m-11 4 4-7m-11 2 5-6m-8 3 3-3m4 8 2-3m5 8 2-4m6 7 1-4m8 5v-4m8 4v-4m9 3-1-4m9 1-2-4m9 0-2-4m9-2-3-3m8-4-3-2m8-5-4-2m7-6-4-1m5-8h-4m4-8h-4m3-9-4 1m1-9-4 2m-1-9-3 2m-2-9-3 3m-4-8-2 3m-5-8-2 4m-6-6-1 3m-8-5v4m-8-4v4m-9-2 1 3m-9 0 2 3m-9 1 2 3m-9 2 3 3m-8 4 3 2m-8 5 4 2m-7 6 4 1m-4 25 4-1m-2 5 7-3m-6 7 4-2m-2 6 7-4m-13-21h8m41-41v-8m0 99v-8m49-42h-8' transform='translate(-65 8)' /%3E%3C/svg%3E)

[Source](https://developer.mozilla.org/docs/Web/CSS/Reference/Properties/content-visibility)

In our article demo, applying `content-visibility: auto` to chunked content areas gives a **7x** rendering performance boost on initial load. Read on to learn more.

## CSS Containment

The key and overarching goal of CSS containment is to enable rendering
performance improvements of web content by providing **predictable isolation of
a DOM subtree** from the rest of the page.

Basically a developer can tell a browser what parts of the page are encapsulated
as a set of content, allowing the browsers to reason about the content without
needing to consider state outside of the subtree. Knowing which bits of content
(subtrees) contain isolated content means the browser can make optimization
decisions for page rendering.

There are four types of [CSS
containment](https://developer.mozilla.org/docs/Web/CSS/CSS_containment),
each a potential value for the `contain` CSS property, which can be combined
in a space-separated list of values:

- `size`: Size containment on an element ensures that the element's box can be laid out without needing to examine its descendants. This means we can potentially skip layout of the descendants if all we need is the size of the element.
- `layout`: Layout containment means that the descendants do not affect the external layout of other boxes on the page. This allows us to potentially skip layout of the descendants if all we want to do is lay out other boxes.
- `style`: Style containment ensures that properties which can have effects on more than just its descendants don't escape the element (e.g. counters). This allows us to potentially skip style computation for the descendants if all we want is to compute styles on other elements.
- `paint`: Paint containment ensures that the descendants of the containing box don't display outside its bounds. Nothing can visibly overflow the element, and if an element is off-screen or otherwise not visible, its descendants will also not be visible. This allows us to potentially skip painting the descendants if the element is offscreen.

## Skip rendering work with `content-visibility`

It may be hard to figure out which containment values to use, since browser
optimizations may only kick in when an appropriate set is specified. You can
play around with the values to see [what works
best](https://developer.mozilla.org/docs/Web/CSS/CSS_containment), or you
can use `content-visibility` to apply the needed
containment automatically. `content-visibility` ensures that you get the largest
performance gains the browser can provide with minimal effort from you as a
developer.

The content-visibility property accepts several values, but `auto` is the one
that provides immediate performance improvements. An element that has
`content-visibility: auto` gains `layout`, `style` and `paint` containment. If
the element is off-screen (and not otherwise relevant to the user---relevant
elements would be the ones that have focus or selection in their subtree), it
also gains `size` containment (and it stops
[painting](https://developer.chrome.com/blog/inside-browser-part3#paint)
and
[hit-testing](https://developer.chrome.com/blog/inside-browser-part4#finding-the-event-target)
its contents).

What does this mean? In short, if the element is off-screen its descendants are
not rendered. The browser determines the size of the element without considering
any of its contents, and it stops there. Most of the rendering, such as styling
and layout of the element's subtree are skipped.

As the element approaches the viewport, the browser no longer adds the `size`
containment and starts painting and hit-testing the element's content. This
enables the rendering work to be done just in time to be seen by the user.

> [!CAUTION]
> **Caution:** The browser is only able to skip rendering work if you are also careful not to call any DOM API that [forces some of rendering to occur](https://gist.github.com/paulirish/5d52fb081b3570c81e3a#file-what-forces-layout-md) on one of the skipped subtrees. If you're using `content-visibility` to improve performance, audit your code to make sure these APIs are not getting called. To help find them, Chromium will print console messages if you call one of these APIs for a subtree of an element with `content-visibility:hidden`. To see the messages, [turn on verbose logging](https://developer.chrome.com/docs/devtools/console/log).

## A note on accessibility

One of the features of `content-visibility: auto` is that the off-screen content remains available in the document object model and therefore, the accessibility tree (unlike with `visibility: hidden`). This means, that content can be searched for on the page, and navigated to, without waiting for it to load or sacrificing rendering performance.

The flip-side of this, however, is that [landmark](https://www.w3.org/TR/wai-aria-1.1/#landmark_roles) elements with style features such as `display: none` or `visibility: hidden` will also appear in the accessibility tree when off-screen, since the browser won't render these styles until they enter the viewport. To prevent these from being visible in the accessibility tree, potentially causing clutter, be sure to also add `aria-hidden="true"`.

## Example: A travel blog

In this example, we baseline our travel blog on the right, and apply `content-visibility: auto` to chunked areas on the left. The results show rendering times going from **232ms** to **30ms** on initial page load.

A travel blog typically contains a set of stories with a few pictures, and some
descriptive text. Here is what happens in a typical browser when it navigates to
a travel blog:

1. A part of the page is downloaded from the network, along with any needed resources.
2. The browser styles and lays out all of the contents of the page, without considering if the content is visible to the user.
3. The browser goes back to step 1 until all of the page and resources are downloaded.

In step 2, the browser processes all of the contents looking for things that may
have changed. It updates the style and layout of any new elements, along with
the elements that may have shifted as a result of new updates. This is rendering
work. This takes time.
An example of a travel blog. See [Demo on Codepen](https://codepen.io/una/pen/rNxEWLo)

Now consider what happens if you put `content-visibility: auto` on each of the
individual stories in the blog. The general loop is the same: the browser
downloads and renders chunks of the page. However, the difference is in the
amount of work that it does in step 2.

With content-visibility, it will style and layout all of the contents that are
currently visible to the user (they are on-screen). However, when processing the
story that is fully off-screen, the browser will skip the rendering work and
only style and layout the element box itself.

The performance of loading this page would be as if it contained full on-screen
stories and empty boxes for each of the off-screen stories. This performs much
better, with _expected reduction of 50% or more_ from the rendering cost of
loading. In our example, we see a boost from a **232ms** rendering time to a
**30ms** rendering time. That's a **7x** performance boost.

What is the work that you need to do in order to reap these benefits? First, we
chunk the content into sections:
Example of chunking content into sections with the `story` class applied, to receive `content-visibility: auto`. See [Demo on Codepen](https://codepen.io/vmpstr/pen/xxZoyMb)

Then, we apply the following style rule to the sections:

```css
.story {
  content-visibility: auto;
  contain-intrinsic-size: 1000px; /* Explained in the next section. */
}
```

> [!NOTE]
> **Note:** Note that as content moves in and out of visibility, it will start and stop being rendered as needed. However, this does not mean that the browser will have to render and re-render the same content over and over again, since the rendering work is saved when possible.

### Specify the natural size of an element with `contain-intrinsic-size`

In order to realize the potential benefits of `content-visibility`, the browser
needs to apply size containment to ensure that the rendering results of contents
don't affect the size of the element in any way. This means that the element
will lay out as if it was empty. If the element does not have a height specified
in a regular block layout, then it will be of 0 height.

This might not be ideal, since the size of the scrollbar will shift, being
reliant on each story having a non-zero height.

Thankfully, CSS provides another property, `contain-intrinsic-size`, which
effectively specifies the natural size of the element _if the element is
affected by size containment_ . In our example, we are setting it to `1000px` as
an estimate for the height and width of the sections.

This means it will lay out as if it had a single child of "intrinsic-size"
dimensions, ensuring that your unsized divs still occupy space.
`contain-intrinsic-size` acts as a placeholder size in lieu of rendered content.

The [`auto`](https://drafts.csswg.org/css-sizing-4/#valdef-contain-intrinsic-width-auto-length)
keyword for `contain-intrinsic-size` causes the browser will remember
the last-rendered size, if any, and use that instead of the developer-provided placeholder
size. For example, if you specified `contain-intrinsic-size: auto 300px`, the
element will start out with a `300px` intrinsic sizing in each dimension, but once
the element's contents are rendered, it will retain the rendered intrinsic size.
Any subsequent rendering size changes will also be remembered. In practice, this means that if you
scroll an element with `content-visibility: auto` applied, and then scroll it back
offscreen, it will automatically retain its ideal width and height, and not revert
to the placeholder sizing. This feature is especially useful for infinite scrollers,
which can now automatically improve sizing estimation over time as the user
explores the page.

> [!NOTE]
> **Note:** We can use `IntersectionObserver` and `MutationObserver` to set the correct sizes inline for each element. [Alex Russell](https://twitter.com/slightlylate) explains how this works in [`content-visibility` without jittery scrollbars](https://infrequently.org/2020/12/content-visibility-scroll-fix/), and [Resize-Resilient `content-visibility` Fixes](https://infrequently.org/2020/12/resize-resilient-deferred-rendering/).

## Hide content with `content-visibility: hidden`

What if you want to keep the content unrendered regardless of whether or not it
is on-screen, while leveraging the benefits of cached rendering state? Enter:
`content-visibility: hidden`.

The `content-visibility: hidden` property gives you all of the same benefits of
unrendered content and cached rendering state as `content-visibility: auto` does
off-screen. However, unlike with `auto`, it does not automatically start to
render on-screen.

This gives you more control, allowing you to hide an element's contents and
later unhide them quickly.

Compare it to other common ways of hiding element's contents:

- `display: none`: hides the element and destroys its rendering state. This means unhiding the element is as expensive as rendering a new element with the same contents.
- `visibility: hidden`: hides the element and keeps its rendering state. This doesn't truly remove the element from the document, as it (and it's subtree) still takes up geometric space on the page and can still be clicked on. It also updates the rendering state any time it is needed even when hidden.

`content-visibility: hidden`, on the other hand, hides the element while
preserving its rendering state, so, if there are any changes that need to
happen, they only happen when the element is shown again (i.e. the
`content-visibility: hidden` property is removed).

Some great use cases for `content-visibility: hidden` are when implementing
advanced virtual scrollers, and measuring layout. They're also great for
single-page applications (SPA's). Inactive app views can be left in the DOM with
`content-visibility: hidden` applied to prevent their display but maintain their
cached state. This makes the view quick to render when it becomes active again.

> [!NOTE]
> **Note:** In an experiment, Facebook engineers observed an up to 250ms improvement in navigation times when going back to previously cached views.

## Effects on Interaction to Next Paint (INP)

[INP](https://web.dev/articles/inp.md.txt) is a metric that evaluates a page's ability to be reliably responsive to user input. Responsiveness can be affected by any excessive amount of work that occurs on the main thread, including rendering work.

Whenever you can reduce rendering work on any given page, you're giving the main thread an opportunity to respond to user inputs more quickly. This includes rendering work, and using the `content-visiblity` CSS property where appropriate can reduce rendering work---especially during startup, when most rendering and layout work is done.

Reducing rendering work has a direct effect on INP. When users attempt to interact with a page that uses the `content-visibility` property properly to defer layout and rendering of offscreen elements, you're giving the main thread a chance to respond to critical user-visible work. This can improve your page's INP in some situations.

## Conclusion

`content-visibility` and the CSS Containment Spec mean some exciting performance
boosts are coming right to your CSS file. For more information on these
properties, check out:

- [The CSS Containment Spec](http://drafts.csswg.org/css-contain/)
- [MDN Docs on CSS
  Containment](https://developer.mozilla.org/docs/Web/CSS/CSS_Containment)
- [CSSWG Drafts](https://github.com/w3c/csswg-drafts)
