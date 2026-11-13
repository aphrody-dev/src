---
source_url: https://developer.chrome.com/blog/wasmgc
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:36+00:00
sha256: 77e19ef8770e256edd52b3e1534c0e322a68a367428a4d7949bccea63070bd5a
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Thomas Steiner [GitHub](https://github.com/tomayac) [LinkedIn](https://www.linkedin.com/in/thomassteinerlinkedin) [Mastodon](https://toot.cafe/@tomayac) [Bluesky](https://bsky.app/profile/tomayac.com) [Homepage](https://blog.tomayac.com/)

There are two types of programming languages: garbage-collected programming languages and programming languages that require manual memory management. Examples of the former, among many more, are Kotlin, PHP, or Java. Examples of the latter are C, C++, or Rust. As a general rule, higher-level programming languages are more likely to have garbage collection as a standard feature. In this blog post, the focus is on such garbage-collected programming languages and how they can be compiled to WebAssembly (Wasm). But what is garbage collection (often referred to as GC) to begin with?

Browser Support

- ' d='M96 183a64 64 0 0 1-23-23L17 64a128 128 0 0 0 111 192l55-96a64 64 0 0 1-87 23Z'/%3E%3Cpath fill='url(%23b)' d='M192 128a64 64 0 0 1-9 32l-55 96A128 128 0 0 0 239 64H128a64 64 0 0 1 64 64Z'/%3E%3Ccircle cx='128' cy='128' r='52' fill='%231a73e8'/%3E%3Cpath fill='url(%23c)' d='M96 73a64 64 0 0 1 32-9h111a128 128 0 0 0-222 0l56 96a64 64 0 0 1 23-87Z'/%3E%3C/svg%3E)
- ' xlink:href='%23A'%3E%3Cstop offset='.76' stop-opacity='0'/%3E%3Cstop offset='.95' stop-opacity='.5'/%3E%3Cstop offset='1'/%3E%3C/radialGradient%3E%3CradialGradient id='F' cx='2523' cy='4680' r='20243' gradientTransform='matrix(-.03715 .99931 -2.12836 -.07913 13579 3530)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2335c1f1'/%3E%3Cstop offset='.11' stop-color='%2334c1ed'/%3E%3Cstop offset='.23' stop-color='%232fc2df'/%3E%3Cstop offset='.31' stop-color='%232bc3d2'/%3E%3Cstop offset='.67' stop-color='%2336c752'/%3E%3C/radialGradient%3E%3CradialGradient id='G' cx='24247' cy='7758' r='9734' gradientTransform='matrix(.28109 .95968 -.78353 .22949 24510 -16292)' xlink:href='%23A'%3E%3Cstop offset='0' stop-color='%2366eb6e'/%3E%3Cstop offset='1' stop-color='%2366eb6e' stop-opacity='0'/%3E%3C/radialGradient%3E%3Cpath id='H' d='M24105 20053a9345 9345 0 01-1053 472 10202 10202 0 01-3590 646c-4732 0-8855-3255-8855-7432 0-1175 680-2193 1643-2729-4280 180-5380 4640-5380 7253 0 7387 6810 8137 8276 8137 791 0 1984-230 2704-456l130-44a12834 12834 0 006660-5282c220-350-168-757-535-565z'/%3E%3Cpath id='I' d='M11571 25141a7913 7913 0 01-2273-2137 8145 8145 0 01-1514-4740 8093 8093 0 013093-6395 8082 8082 0 011373-859c312-148 846-414 1554-404a3236 3236 0 012569 1297 3184 3184 0 01636 1866c0-21 2446-7960-8005-7960-4390 0-8004 4166-8004 7820 0 2319 538 4170 1212 5604a12833 12833 0 007684 6757 12795 12795 0 003908 610c1414 0 2774-233 4045-656a7575 7575 0 01-6278-803z'/%3E%3Cpath id='J' d='M16231 15886c-80 105-330 250-330 566 0 260 170 512 472 723 1438 1003 4149 868 4156 868a5954 5954 0 003027-839 6147 6147 0 001133-850 6180 6180 0 001910-4437c26-2242-796-3732-1133-4392-2120-4141-6694-6525-11668-6525-7011 0-12703 5635-12798 12620 47-3654 3679-6605 7996-6605 350 0 2346 34 4200 1007 1634 858 2490 1894 3086 2921 618 1067 728 2415 728 2952s-271 1333-780 1990z'/%3E%3Cuse fill='url(%23B)' xlink:href='%23H'/%3E%3Cuse fill='url(%23D)' opacity='.35' xlink:href='%23H'/%3E%3Cuse fill='url(%23C)' xlink:href='%23I'/%3E%3Cuse fill='url(%23E)' opacity='.4' xlink:href='%23I'/%3E%3Cuse fill='url(%23F)' xlink:href='%23J'/%3E%3Cuse fill='url(%23G)' xlink:href='%23J'/%3E%3C/svg%3E)
- ' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%239059ff' stop-opacity='0'/%3E%3Cstop offset='.3' stop-color='%238c4ff3' stop-opacity='.1'/%3E%3Cstop offset='.8' stop-color='%237716a8' stop-opacity='.5'/%3E%3Cstop offset='1' stop-color='%236e008b' stop-opacity='.6'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-g' cx='239.1' cy='34.6' r='171.6' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23ffe226'/%3E%3Cstop offset='.1' stop-color='%23ffdb27'/%3E%3Cstop offset='.3' stop-color='%23ffc82a'/%3E%3Cstop offset='.5' stop-color='%23ffa930'/%3E%3Cstop offset='.7' stop-color='%23ff7e37'/%3E%3Cstop offset='.8' stop-color='%23ff7139'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-h' cx='374' cy='-74.3' r='732.2' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-i' cx='304.6' cy='7.1' r='536.4' gradientTransform='rotate(84 303 4)' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='0' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.3' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.6' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-j' cx='235' cy='98.1' r='457.1' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.5' stop-color='%23ff980e'/%3E%3Cstop offset='.6' stop-color='%23ff5634'/%3E%3Cstop offset='.7' stop-color='%23ff3647'/%3E%3Cstop offset='.9' stop-color='%23e31587'/%3E%3C/radialGradient%3E%3CradialGradient id='ff-k' cx='355.7' cy='124.9' r='500.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.2' stop-color='%23ffe141'/%3E%3Cstop offset='.5' stop-color='%23ffaf1e'/%3E%3Cstop offset='.6' stop-color='%23ff980e'/%3E%3C/radialGradient%3E%3ClinearGradient id='ff-a' x1='446.9' y1='76.8' x2='47.9' y2='461.8' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.1' stop-color='%23fff44f'/%3E%3Cstop offset='.1' stop-color='%23ffe847'/%3E%3Cstop offset='.2' stop-color='%23ffc830'/%3E%3Cstop offset='.4' stop-color='%23ff980e'/%3E%3Cstop offset='.4' stop-color='%23ff8b16'/%3E%3Cstop offset='.5' stop-color='%23ff672a'/%3E%3Cstop offset='.5' stop-color='%23ff3647'/%3E%3Cstop offset='.7' stop-color='%23e31587'/%3E%3C/linearGradient%3E%3ClinearGradient id='ff-l' x1='442.1' y1='74.8' x2='102.6' y2='414.3' gradientUnits='userSpaceOnUse'%3E%3Cstop offset='.2' stop-color='%23fff44f' stop-opacity='.8'/%3E%3Cstop offset='.3' stop-color='%23fff44f' stop-opacity='.6'/%3E%3Cstop offset='.5' stop-color='%23fff44f' stop-opacity='.2'/%3E%3Cstop offset='.6' stop-color='%23fff44f' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134a120 120 0 0 0-66 25 71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a229 229 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zM202 355l3 1-3-1zm55-145zm198-31z' fill='url(%23ff-a)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-b)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60 14 26 22 53 25 72v1a207 207 0 0 1-206 279c-113-3-212-87-231-197-3-17 0-26 2-40-2 11-3 14-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121z' fill='url(%23ff-c)'/%3E%3Cpath d='m362 195 1 1a130 130 0 0 0-22-29C266 92 322 5 331 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62z' fill='url(%23ff-d)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-e)'/%3E%3Cpath d='M257 210c-1 6-22 26-29 26-68 0-80 41-80 41 3 35 28 64 57 79l4 2 7 3a107 107 0 0 0 31 6c120 6 143-143 57-186 22-4 45 5 58 14-21-37-60-62-105-62l-9 1a120 120 0 0 0-66 25l17 16c16 16 58 33 58 35z' fill='url(%23ff-f)'/%3E%3Cpath d='m171 151 5 3a111 111 0 0 1-1-58c-25 11-44 29-58 44 1 0 36 0 54 11z' fill='url(%23ff-g)'/%3E%3Cpath d='M18 261a242 242 0 0 0 231 197 207 207 0 0 0 206-279c8 56-20 110-64 146-86 71-169 43-186 31l-3-1c-50-24-71-70-67-110-42 0-57-35-57-35s38-28 89-4c46 22 90 4 90 4 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5l-5-3c-18-11-52-11-54-11-9-12-9-51-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73c0 1-9 38-5 57z' fill='url(%23ff-h)'/%3E%3Cpath d='M341 167a130 130 0 0 1 22 29 46 46 0 0 1 4 3c55 50 26 121 24 126 44-36 72-90 64-146-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-9 5-65 92 10 167z' fill='url(%23ff-i)'/%3E%3Cpath d='M367 199a46 46 0 0 0-4-3l-1-1c-13-9-36-18-58-15 86 44 63 193-57 187a107 107 0 0 1-31-6 131 131 0 0 1-11-5c17 12 99 39 186-31 2-5 31-76-24-126z' fill='url(%23ff-j)'/%3E%3Cpath d='M148 277s12-41 80-41c7 0 28-20 29-26s-44 18-90-4c-51-24-89 4-89 4s15 35 57 35c-4 40 16 85 67 110l3 1c-29-15-54-44-57-79z' fill='url(%23ff-k)'/%3E%3Cpath d='M479 166c-11-25-32-52-49-60a249 249 0 0 1 25 73c-27-68-73-95-111-155a255 255 0 0 1-8-14 44 44 0 0 1-4-9 1 1 0 0 0 0-1 1 1 0 0 0-1 0c-60 35-81 101-83 134l9-1c45 0 84 25 105 62-13-9-36-18-58-14 86 43 63 192-57 186a107 107 0 0 1-31-6 131 131 0 0 1-11-5l-3-1 3 1c-29-15-54-44-57-79 0 0 12-41 80-41 7 0 28-20 29-26 0-2-42-19-58-35l-17-16a71 71 0 0 0-6-5 111 111 0 0 1-1-58c-25 11-44 29-58 44-9-12-9-52-8-60l-8 4a175 175 0 0 0-24 21 210 210 0 0 0-22 26 203 203 0 0 0-32 73l-1 2-2 15a279 279 0 0 0-4 34v1a240 240 0 0 0 477 40l1-9c5-41 0-84-15-121zm-24 13z' fill='url(%23ff-l)'/%3E%3C/svg%3E)
- ' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-color='%2324a5f3' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%231e8ceb' /%3E%3C/radialGradient%3E%3CradialGradient id='s-j' cx='109.3' cy='13.8' r='93.1' gradientTransform='matrix(-.02 1.1 -1.04 -.02 137 -115)' xlink:href='%23s-b'%3E%3Cstop offset='0' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235488d6' stop-opacity='0' /%3E%3Cstop offset='1' stop-color='%235d96eb' /%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='220' height='220' x='22' y='-107' fill='url(%23s-a)' ry='49' transform='matrix(.57 0 0 .57 187 256)' /%3E%3Cg transform='translate(194 190)'%3E%3Ccircle cx='67.8' cy='67.7' fill='url(%23s-c)' paint-order='stroke fill markers' r='54' /%3E%3Ccircle cx='-69.9' cy='69.3' fill='url(%23s-i)' transform='translate(138 -2)' r='54' /%3E%3C/g%3E%3Cellipse cx='120' cy='14.2' fill='url(%23s-j)' rx='93.1' ry='93.7' transform='matrix(.58 0 0 .58 192 250)' /%3E%3Cg transform='matrix(.58 0 0 .57 197 182)'%3E%3Cpath fill='%23cac7c8' d='M46 192h1l72-48-7-9-66 57Z' /%3E%3Cpath fill='%23fbfffc' d='M46 191v1l66-57-7-9-59 65Z' /%3E%3Cpath fill='url(%23s-d)' d='m119 144-7-9 66-57-59 66Z' /%3E%3Cpath fill='%23fb645c' d='m105 126 7 9 66-57-1-1-72 49Z' /%3E%3C/g%3E%3Cpath stroke='%23fff' stroke-linecap='round' stroke-miterlimit='1' stroke-width='1.3' d='m287 278 3-2m-12-17 8-2m-8-3h4m-4-13 8 2m-8 3h4m-1-13 7 3m-4-11 7 4m-2-11 6 6m0-12 6 7m1-11 4 6m4-10 3 7m5-9 2 7m15-7-1 7m10-5-3 7m11-4-4 7m11-2-5 6m16 7-7 4m10 4-7 3m10 6-8 1m8 16-8-2m5 10-7-3m4 11-7-4m2 11-6-5m0 11-5-6m-2 11-4-7m-4 11-3-8m-6 10-1-8m-16 8 2-8m-10 5 3-7m-11 4 4-7m-11 2 5-6m-8 3 3-3m4 8 2-3m5 8 2-4m6 7 1-4m8 5v-4m8 4v-4m9 3-1-4m9 1-2-4m9 0-2-4m9-2-3-3m8-4-3-2m8-5-4-2m7-6-4-1m5-8h-4m4-8h-4m3-9-4 1m1-9-4 2m-1-9-3 2m-2-9-3 3m-4-8-2 3m-5-8-2 4m-6-6-1 3m-8-5v4m-8-4v4m-9-2 1 3m-9 0 2 3m-9 1 2 3m-9 2 3 3m-8 4 3 2m-8 5 4 2m-7 6 4 1m-4 25 4-1m-2 5 7-3m-6 7 4-2m-2 6 7-4m-13-21h8m41-41v-8m0 99v-8m49-42h-8' transform='translate(-65 8)' /%3E%3C/svg%3E)

> [!NOTE]
> **Note:** The present article covers the concepts behind WasmGC in high level. For an in-depth article on the topic, read [A new way to bring garbage collected programming languages efficiently to WebAssembly](https://v8.dev/blog/wasm-gc-porting) on the V8 blog.

## Garbage collection

In simplified terms, the idea of garbage collection is the attempt to reclaim memory which was allocated by the program, but that is no longer referenced. Such memory is called garbage. There are many strategies for implementing garbage collection. One of them is [reference counting](https://en.wikipedia.org/wiki/Reference_counting) where the objective is to count the number of references to objects in memory. When there are no more references to an object, it can be marked as no longer used and thus ready for garbage collection. [PHP](https://www.php.net/)'s garbage collector [uses reference counting](https://www.php.net/manual/en/features.gc.refcounting-basics.php), and using the [Xdebug](https://xdebug.org/) extension's [`xdebug_debug_zval()`](https://xdebug.org/docs/all_functions#xdebug_debug_zval) function allows you to peek under its hood. Consider the following PHP program.

```php
<?php
  $a= (string) rand();
  $c = $b = $a;
  $b = 42;
  unset($c);
  $a = null;
?>
```

The program assigns a random number casted to a string to a new variable called `a`. It then creates two new variables, `b` and `c`, and assigns them the value of `a`. After that, it reassigns `b` to the number `42`, and then unsets `c`. Finally, it sets the value of `a` to `null`. Annotating each step of the program with `xdebug_debug_zval()`, you can see the garbage collector's reference counter at work.

```php
<?php
  $a= (string) rand();
  $c = $b = $a;
  xdebug_debug_zval('a');
  $b = 42;
  xdebug_debug_zval('a');
  unset($c);
  xdebug_debug_zval('a');
  $a = null;
  xdebug_debug_zval('a');
?>
```

The above example will output the following logs, where you see how the number of references to the value of the variable `a` decreases after each step, which makes sense given the code sequence. (Your random number will be different of course.)

```bash
a:
(refcount=3, is_ref=0)string '419796578' (length=9)
a:
(refcount=2, is_ref=0)string '419796578' (length=9)
a:
(refcount=1, is_ref=0)string '419796578' (length=9)
a:
(refcount=0, is_ref=0)null

```

> [!NOTE]
> **Note:** Reference counting is used in PHP, but most modern browsers now don't use reference-counting for garbage collection.

There are other challenges with garbage collection, like [detecting cycles](https://www.php.net/manual/en/features.gc.collecting-cycles.php), but for this article, having a basic level of understanding of reference counting is enough.

## Programming languages are implemented in other programming languages

It may feel like inception, but programming languages are implemented in other programming languages. For example, the PHP runtime is primarily implemented in C. You can check out the [PHP source code on GitHub](https://github.com/php/php-src/). PHP's garbage collection code is mainly located in the file [`zend_gc.c`](https://github.com/php/php-src/blob/master/Zend/zend_gc.c). Most developers will install PHP via the package manager of their operating system. But developers can also [build PHP from the source code](https://github.com/php/php-src/tree/master#building-php-source-code). For example, in a Linux environment, the steps `./buildconf && ./configure && make` would build PHP for the Linux runtime. But this also means that the PHP runtime can be compiled for other runtimes, like, you guessed it, Wasm.

## Traditional methods of porting languages to the Wasm runtime

Independently from the platform PHP is running on, PHP scripts are compiled into the same bytecode and run by the [Zend Engine](https://en.wikipedia.org/wiki/Zend_Engine). The Zend Engine is a compiler and runtime environment for the PHP scripting language. It consists of the Zend Virtual Machine (VM), which is composed of the Zend Compiler and the Zend Executor. Languages like PHP that are implemented in other high-level languages like C commonly have optimizations that target specific architectures, such as Intel or ARM, and require a different backend for each architecture. In this context, Wasm represents a new architecture. If the VM has architecture-specific code, like just-in-time (JIT) or ahead-of-time (AOT) compilation, then the developer also implements a backend for JIT/AOT for the new architecture. This approach makes a lot of sense because often the main part of the codebase can just be recompiled for each new architecture.

Given how low-level Wasm is, it is natural to try the same approach there: Recompile the main VM code with its parser, library support, garbage collection, and optimizer to Wasm, and implement a JIT or AOT backend for Wasm if needed. This has been possible since the Wasm MVP, and it works well in practice in many cases. In fact, [PHP compiled to Wasm](https://github.com/WordPress/wordpress-playground/blob/trunk/packages/php-wasm/compile/build.js) is what powers the [WordPress Playground](https://playground.wordpress.net/). Learn more about the project in the article [Build in-browser WordPress experiences with WordPress Playground and WebAssembly](https://web.dev/wordpress-playground/).

However, PHP Wasm runs in the browser in the context of the host language JavaScript. In Chrome, [JavaScript and Wasm are run in V8](https://v8.dev/docs/wasm-compilation-pipeline), Google's open source JavaScript engine that implements ECMAScript as specified in [ECMA-262](https://www.ecma-international.org/publications-and-standards/standards/ecma-262/). And, [V8 already has a garbage collector](https://chromium.googlesource.com/v8/v8.git/+/refs/heads/main/src/heap/cppgc/). This means developers making use of, for example, PHP compiled to Wasm, end up shipping a garbage collector implementation of the ported language (PHP) to the browser that already has a garbage collector, which is as wasteful as it sounds. This is where WasmGC comes in.

The other problem of the old approach of letting Wasm modules build their own GC on top of Wasm's linear memory is that there's then no interaction between Wasm's own garbage collector and the built-on-top garbage collector of the compiled-to-Wasm language, which tends to cause problems like memory leaks and inefficient collection attempts. Letting Wasm modules reuse the existing built-in GC avoids these issues.

## Porting programming languages to new runtimes with WasmGC

WasmGC is a [proposal](https://github.com/WebAssembly/gc/blob/main/proposals/gc/Overview.md) of the [WebAssembly Community Group](https://www.w3.org/community/webassembly/). The current Wasm MVP implementation is only capable of dealing with numbers, that is, integers and floats, in linear memory, and with the [reference types](https://github.com/WebAssembly/reference-types/blob/master/proposals/reference-types/Overview.md) proposal being shipped, Wasm can additionally hold on to external references. WasmGC now adds struct and array heap types, which means support for non-linear memory allocation. Each WasmGC object has a fixed type and structure, which makes it easy for VMs to generate efficient code to access their fields without the risk of [deoptimizations](https://web.dev/speed-v8#de-optimization) that dynamic languages like JavaScript have. This proposal thereby adds efficient support for high-level managed languages to WebAssembly, via struct and array heap types that enable language compilers targeting Wasm to integrate with a garbage collector in the host VM. In simplified terms, this means that with WasmGC, porting a programming language to Wasm means the programming language's garbage collector no longer needs to be part of the port, but instead the existing garbage collector can be used.

To verify the real-world impact of this improvement, Chrome's Wasm team has compiled versions of the [Fannkuch benchmark](https://benchmarksgame-team.pages.debian.net/benchmarksgame/description/fannkuchredux.html) (which allocates data structures as it works) from [C](https://benchmarksgame-team.pages.debian.net/benchmarksgame/program/fannkuchredux-gcc-5.html), [Rust](https://benchmarksgame-team.pages.debian.net/benchmarksgame/program/fannkuchredux-rust-2.html), and [Java](https://benchmarksgame-team.pages.debian.net/benchmarksgame/program/fannkuchredux-java-2.html). The C and Rust binaries could be anywhere from _6.1 K_ to _9.6 K_ depending on the various compiler flags, while the Java version is much smaller at only _2.3 K_ ! C and Rust do not include a garbage collector, but they do still bundle `malloc/free` to manage memory, and the reason Java is smaller here is because it doesn't need to bundle any memory management code at all. This is just one specific example, but it shows that WasmGC binaries have the potential of being very small, and this is even before any significant work on optimizing for size.

## Seeing a WasmGC-ported programming language in action

### Kotlin Wasm

One of the first programming languages that has been ported to Wasm thanks to WasmGC is [Kotlin](https://kotlinlang.org/) in the form of [Kotlin/Wasm](https://kotl.in/wasmgc). The [demo](https://googlechrome.github.io/samples/kotlin-wasm-hello-world/), with [source code](https://github.com/Kotlin/kotlin-wasm-examples/tree/main/browser-example) courtesy of the Kotlin team, is shown in the following listing.

```kotlin
import kotlinx.browser.document
import kotlinx.dom.appendText
import org.w3c.dom.HTMLDivElement

fun main() {
    (document.getElementById("warning") as HTMLDivElement).style.display = "none"
    document.body?.appendText("Hello, ${greet()}!")
}

fun greet() = "world"
```

<iframe style="height: 100%; width: 100%; border: 0;" src="https://googlechrome.github.io/samples/kotlin-wasm-hello-world/" allow="camera; clipboard-read; clipboard-write; encrypted-media; geolocation; microphone; midi" loading="lazy"></iframe>

> [!NOTE]
> **Note:** To see the demo, you need to set the browser flags as per the instructions on the screen.

Now you may be wondering what the point is, since the Kotlin code above basically consists of the [JavaScript OM APIs converted to Kotlin](https://kotlinlang.org/api/latest/jvm/stdlib/org.w3c.dom/). It starts to make more sense in combination with [Compose Multiplatform](https://www.jetbrains.com/lp/compose-multiplatform/), which allows developers to build upon the UI they may already have created for their Android Kotlin apps. Check out an early exploration of this with the [Kotlin/Wasm image viewer](https://github.com/Kotlin/kotlin-wasm-examples/tree/main/compose-imageviewer), likewise courtesy of the Kotlin team.

> [!WARNING]
> **Warning:** The state of Kotlin/Wasm is [alpha](https://kotlinlang.org/docs/wasm-overview.html) and the state of Compose Multiplatform is [experimental](https://github.com/Kotlin/kotlin-wasm-examples/tree/main/compose-imageviewer#compose-multiplatform-for-web). Kotlin/Wasm can be used at developers' own risk, but they need to expect migration issues. Compose Multiplatform may be changed at any time and is to be used only for evaluation purposes. The Kotlin/Wasm image viewer demo uses Kotlin/Wasm with Compose Multiplatform which fully renders onto a `canvas` with no meaningful DOM tree that could be used to create an accessibility tree. This means it's completely inaccessible to non-sighted users and breaks important browser features like find on page, translation, text selection, extensions, zooming, and link to text fragment.

### Dart and Flutter

The Dart and Flutter teams at Google are also preparing support for WasmGC. The Dart-to-Wasm compilation work is almost complete, and the team is working on tooling support for delivering Flutter web applications compiled to WebAssembly. You can read about the current state of the work in the [Flutter documentation](https://flutter.dev/wasm). The following demo is the [Flutter WasmGC Preview](https://flutterweb-wasm.web.app/).
<iframe style="width: 100%; height: 800px" src="https://flutterweb-wasm.web.app/"></iframe>

> [!WARNING]
> **Warning:** Dart WasmGC compilation and Flutter Web with WasmGC are in preview, and are to be used only for evaluation purposes. The [Flutter Web WasmGC Preview demo](https://flutterweb-wasm.web.app/) currently uses Flutter's [CanvasKit renderer](https://docs.flutter.dev/platform-integration/web/renderers) which fully renders onto a `canvas`. This means it breaks important browser features like find on page, translation, text selection, extensions, and link to text fragment.

## Learn more about WasmGC

This blog post has barely scratched the surface and mostly provided a high-level overview of WasmGC. To learn more about the feature, check out these links:

- [A new way to bring garbage collected programming languages efficiently to WebAssembly](https://v8.dev/blog/wasm-gc-porting)
- [WasmGC Overview](https://github.com/WebAssembly/gc/blob/main/proposals/gc/Overview.md)
- [WasmGC MVP](https://github.com/WebAssembly/gc/blob/main/proposals/gc/MVP.md)
- [WasmGC post-MVP](https://github.com/WebAssembly/gc/blob/main/proposals/gc/Post-MVP.md)

## Acknowledgements

This article was reviewed by [Matthias Liedtke](https://github.com/Liedtke), [Adam Klein](https://github.com/ajklein), [Joshua Bell](https://github.com/inexorabletash), [Alon Zakai](https://github.com/kripken), [Jakob Kummerow](https://github.com/jakobkummerow), [Clemens Backes](https://github.com/backes), [Emanuel Ziegler](https://github.com/ecmziegler), and [Rachel Andrew](https://rachelandrew.co.uk/).
