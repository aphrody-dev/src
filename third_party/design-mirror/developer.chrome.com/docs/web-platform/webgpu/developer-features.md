---
source_url: https://developer.chrome.com/docs/web-platform/webgpu/developer-features
fetched: 2026-11-13
lastmod: 2026-11-11T16:59:22+00:00
sha256: 3163f07c41624ae4380f2b7431070476988b83bcbeadc33bdbae56ed77cfae70
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

François Beaufort [GitHub](https://github.com/beaufortfrancois)

Published: June 3, 2025

Chrome's WebGPU API implementation includes features intended solely for development and testing. These features are outside the standard WebGPU specification. **Do not use these features in production.**

> [!WARNING]
> **Warning:** Some features, such as disabling timestamp query quantization, may raise privacy concerns due to offering more precise timing information. This is why these features should only be enabled during development and testing, so that the overall security of the WebGPU API remains robust.

This document details how to enable WebGPU developer features and provides a comprehensive list.

## Prerequisite

To enable WebGPU developer features in Chrome, follow these steps:

1. Enable the "WebGPU Developer Features" [flag](https://developer.chrome.com/docs/web-platform/chrome-flags.md.txt#chromeflags) at `chrome://flags/#enable-webgpu-developer-features`.
2. Restart Chrome browser.

## Disable timestamp queries quantization

Timestamp queries enable WebGPU applications to accurately measure (to the nanosecond) the execution time of GPU commands during compute and render passes. These queries are essential for analyzing GPU workload performance and behavior. For more details, refer to [Timestamp queries in compute and render passes](https://developer.chrome.com/blog/new-in-webgpu-121.md.txt#timestamp_queries_in_compute_and_render_passes).

Due to [timing attack](https://gpuweb.github.io/gpuweb/#security-timing-device) concerns, timestamp queries are quantized with a resolution of 100 microseconds, which provides a good compromise between precision and security. This quantization is automatically disabled when the "WebGPU Developer Features" flag is enabled.

## Extended adapter information

To get a deeper understanding of the adapter being used, [GPUAdapterInfo](https://developer.mozilla.org/docs/Web/API/GPUAdapterInfo) exposes the following attributes:

- The `device` attribute (standardized) is a vendor-specific adapter identifier.
- The `description` attribute (standardized) is a human-readable string providing adapter details.
- The `driver` attribute (non-standardized) is a human-readable string describing the driver.
- The `backend` attribute (non-standardized) indicates the graphics backend, such as `"WebGPU"`, `"D3D11"`, `"D3D12"`, `"metal"`, `"vulkan"`, `"openGL"`, `"openGLES"`, or `"null"`.
- The `type` attribute (non-standardized) identifies the GPU type: `"discrete GPU"`, `"integrated GPU"`, `"CPU"`, or `"unknown"`.
- The `d3dShaderModel` attribute (non-standardized) specifies the maximum supported D3D shader model number, for example, 62 indicates HLSL SM 6.2 support.
- The `vkDriverVersion` attribute (non-standardized) is the vendor-specified Vulkan driver version.
- The `powerPreference` attribute (non-standardized) is `"low-power"` or `"high-performance"`, based on the GPUPowerPreference in [GPURequestAdapterOptions](https://gpuweb.github.io/gpuweb/#dictdef-gpurequestadapteroptions).

To anticipate memory limitations when allocating large amounts during the development of your app, [GPUAdapterInfo](https://developer.mozilla.org/docs/Web/API/GPUAdapterInfo) exposes `memoryHeaps` non-standardized information such as the size and type of memory heaps available on the adapter.

```javascript
const adapter = await navigator.gpu.requestAdapter();

for (const { size, properties } of adapter.info.memoryHeaps) {
  console.log(size); // memory heap size in bytes
  if (properties & GPUHeapProperty.DEVICE_LOCAL) {
    /* ... */
  }
  if (properties & GPUHeapProperty.HOST_VISIBLE) {
    /* ... */
  }
  if (properties & GPUHeapProperty.HOST_COHERENT) {
    /* ... */
  }
  if (properties & GPUHeapProperty.HOST_UNCACHED) {
    /* ... */
  }
  if (properties & GPUHeapProperty.HOST_CACHED) {
    /* ... */
  }
}
```

## Shader module compilation option strict math

The [GPUShaderModuleDescriptor](https://developer.mozilla.org/docs/Web/API/GPUDevice/createShaderModule#descriptor) includes a `strictMath` non-standardized boolean option, which enables or disables strict mathematical precision during shader module compilation. This option is supported on Metal and Direct3D. When `strictMath` is enabled, the compiler adheres to precise mathematical rules. Conversely, disabling it allows the compiler to optimize shaders by:

- Ignoring the possibility of NaN and Infinity values.
- Treating -0 as +0.
- Replacing division with faster multiplication by the reciprocal.
- Rearranging operations based on associative and distributive properties.

```javascript
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const code = `
  // Examines the bit pattern of the floating-point number to
  // determine if it represents a NaN according to the IEEE 754 standard.
  fn isNan(x : f32) -> bool {
    bool ones_exp = (bitcast<u32>(x) & 0x7f8) == 0x7f8;
    bool non_zero_sig = (bitcast<u32>(x) & 0x7ffff) != 0;
    return ones_exp && non_zero_sig;
  }
  // ...
`;

// Enable strict math during shader compilation.
const shaderModule = device.createShaderModule({ code, strictMath: true });
```

## Import video with zero-copy

The GPUExternalTexture `isZeroCopy` non-standardized boolean attribute lets you know whether the video imported with [importExternalTexture()](https://developer.mozilla.org/docs/Web/API/GPUDevice/importExternalTexture) was directly accessed by the GPU without the need for an intermediate copy.

```javascript
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();

const video = document.querySelector("video");
const externalTexture = device.importExternalTexture({ source: video });

if (externalTexture.isZeroCopy) {
  console.log("Video frame was accessed directly by the GPU");
}
```
