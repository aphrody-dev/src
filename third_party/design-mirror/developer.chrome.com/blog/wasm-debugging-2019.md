---
source_url: https://developer.chrome.com/blog/wasm-debugging-2019
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:43+00:00
sha256: 5432a02e8d5e2ee9d31047f463c84f12503c702b586fc1fddc08bc2e2cfe1e55
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

Ingvar Stepanyan

> [!NOTE]
> **Note:** Interested in helping improve DevTools? Sign up to participate in [Google User Research here](https://google.qualtrics.com/jfe/form/SV_9YbKj35IGoGsDBj?reserved=1&utm_source=Website+feature&Q_Language=en&utm_medium=own_web&utm_campaign=Q4&productTag=chrm&campaignDate=November2020&referral_code=UXFm430458).

## Background

Until recently, the only WebAssembly debugging that Chrome DevTools supported was viewing
raw WebAssembly stack traces, and stepping over individual instructions in a
disassembled WebAssembly text format.

While this works with any WebAssembly module and helps somewhat with debugging small, isolated functions, it's not very practical for larger apps where the mapping between the disassembled code and your sources is less obvious.

### A temporary workaround

To work around this problem, Emscripten and DevTools have temporarily adapted the existing
[source maps](https://web.dev/articles/source-maps#generating_source_maps) format to WebAssembly. This allowed mappings
between binary offsets in the compiled module to original locations in source files.

However, source maps were designed for text formats with clear mappings to JavaScript concepts and values, not for binary formats like WebAssembly with arbitrary source languages, type systems, and a linear memory. This made the integration hacky, limited, and not widely supported outside Emscripten.

## Enter DWARF

On the other hand, many native languages already have a common debugging format,
[DWARF](http://dwarfstd.org/), that provides all the necessary information for debuggers to resolve locations, variable names, type layouts, and more.

While there are still some WebAssembly-specific features that need to be added for full compatibility, compilers like Clang and Rust already support emitting DWARF information in WebAssembly modules, which enabled the DevTools team to start using it
directly in DevTools.

As the first step, DevTools now supports native source mapping using this information, so you can start debugging Wasm modules produced by any of these compilers without resorting to the disassembled format or having to use any custom scripts.

Instead, you just need to tell your compiler to include debug info like you normally would on other platforms. For example, in Clang and Emscripten this can be done by passing a `-g` flag during compilation:

```bash
  clang -g ...sources... -target wasm32 -o out.wasm

  emcc -g ...sources... -o out.js
```

You can use same `-g` flag in Rust:

```bash
  rustc -g source.rs --target wasm32-unknown-unknown -o out.wasm
```

Or, if you're using Cargo, the debug info will be included by default:

```bash
  cargo build --target wasm32-unknown-unknown
```

This new DevTools integration with DWARF already covers support for stepping over the code, setting breakpoints, and resolving stack traces in your source languages.

## The future

There is still quite a bit of work to do though.
For example, on the tooling side, ~~Emscripten (Binaryen) and~~ wasm-pack (wasm-bindgen) doesn't support updating DWARF information on transformations they perform yet. For now, they won't benefit from this integration.

And on the Chrome DevTools side, we'll be evolving integration more over time to ensure a seamless debugging experience, including:

- Resolving variable names
- Pretty-printing types
- Evaluating expressions in source languages
- ...and much more!

Stay tuned for future updates!

> [!NOTE]
> **Note:** _Updated 2020-06-19_: The original blog post used to state that Emscripten doesn't support DWARF yet. This has been fixed since, and Emscripten preserves debug information end-to-end, throughout any transformations and optimisations.

## Download the preview channels

Consider using the Chrome [Canary](https://www.google.com/chrome/canary/), [Dev](https://www.google.com/chrome/dev/), or [Beta](https://www.google.com/chrome/beta/) as your default development browser. These preview channels give you access to the latest DevTools features, let you test cutting-edge web platform APIs, and help you find issues on your site before your users do!

## Get in touch with the Chrome DevTools team

Use the following options to discuss the new features, updates, or anything else related to DevTools.

- Submit feedback and feature requests to us at [crbug.com](https://crbug.com).
- Report a DevTools issue using the **More options** \> **Help** \> **Report a DevTools issue** in DevTools.
- Tweet at [@ChromeDevTools](https://twitter.com/intent/tweet?text=@ChromeDevTools).
- Leave comments on [What's new in DevTools YouTube videos](https://goo.gle/devtools-youtube) or [DevTools Tips YouTube videos](https://goo.gle/devtools-tips).
