---
source_url: https://developer.chrome.com/docs/web-platform/webgpu/overview
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:00+00:00
sha256: 4a8ede229708b9cdf1c4b7164194e728712f40b6455cd4f164e5b2ce815600f4
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---
François Beaufort [GitHub](https://github.com/beaufortfrancois)

Published: Jul 20, 2023, Last updated: Aug 11, 2025

WebGPU is a web graphics API that offers significant benefits, such as greatly
reduced JavaScript workload for the same graphics and more than three times
improvements in machine learning model inferences. This is possible because of
flexible GPU programming and access to advanced capabilities that WebGL does not
provide.

The API is designed with the web platform in mind, featuring an idiomatic
JavaScript API, integration with promises, support for importing videos, and a
polished developer experience with clear error messages.

WebGPU is the result of a collaborative effort by the
[W3C's "GPU for the Web" Community Group](https://www.w3.org/community/gpu/),
which includes contributions from major companies such as Mozilla, Apple, Intel,
and Microsoft.

## Browser support

This initial release of WebGPU was made available in Chrome 113, on ChromeOS devices with Vulkan support, Windows devices with Direct3D 12 support, and macOS. Android support was later in Chrome 121 on devices running Android 12 and greater powered by Qualcomm and ARM GPUs. Linux and expanded support for existing platforms is coming soon.

WebGPU shipped in [Firefox 141 on Windows](https://mozillagfx.wordpress.com/2025/07/15/shipping-webgpu-on-windows-in-firefox-141/) and [Safari 26](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/#webgpu), in addition to the implementation in Chrome.

For the latest updates on WebGPU's implementation status, you can check the [gpuweb implementation status page](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status).

## Library support

Many widely used WebGL libraries are already in the process of implementing
WebGPU support or have already done so. This means that using WebGPU may only
require making a single line change.

- [Babylon.js](https://doc.babylonjs.com/setup/support/webGPU) has full WebGPU support.
- [PlayCanvas](https://blog.playcanvas.com/initial-webgpu-support-lands-in-playcanvas-engine-1-62/) announced initial WebGPU support.
- [TensorFlow.js](https://www.npmjs.com/package/@tensorflow/tfjs-backend-webgpu) supports WebGPU-optimized versions of most operators.
- [Three.js](https://threejs.org) WebGPU support is in progress, see [examples](https://threejs.org/examples/?q=webgpu#webgpu_particles).

Both the [Dawn](https://dawn.googlesource.com/dawn) library for Chromium and the
[wgpu](https://github.com/gfx-rs/wgpu) library for Firefox are available as
standalone package. They offer great portability and ergonomic layers that
abstract operating system GPU APIs. Using these libraries in native applications
makes it easier to port to [WASM](https://webassembly.org/) through
[Emscripten](https://emscripten.org/) and [Rust web-sys](https://rustwasm.github.io/wasm-bindgen/web-sys/index.html).

## Resources

WebGPU is a significant technology, and we recommend the following resources to learn more:

- Check out the W3C specifications for [WebGPU](https://gpuweb.github.io/gpuweb/) and [WGSL](https://gpuweb.github.io/gpuweb/wgsl/).
- Experiment with [samples](https://webgpu.github.io/webgpu-samples/) and explore WGSL with a [tour](https://google.github.io/tour-of-wgsl/).
- Look at the [MDN documentation](https://developer.mozilla.org/docs/Web/API/WebGPU_API).
- Read the official [explainer](https://gpuweb.github.io/gpuweb/explainer/) and [best practices](https://toji.dev/webgpu-best-practices/).
- Learn about [GPU compute](https://developer.chrome.com/docs/capabilities/web-apis/gpu-compute.md.txt) and [more](https://surma.dev/things/webgpu/index.html).
