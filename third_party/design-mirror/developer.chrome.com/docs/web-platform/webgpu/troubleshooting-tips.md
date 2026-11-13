---
source_url: https://developer.chrome.com/docs/web-platform/webgpu/troubleshooting-tips
fetched: 2026-11-13
lastmod: 2026-11-11T16:58:46+00:00
sha256: b52eb855c20615772558b439be143e4dfafabf94f963ad531dbba60aab5cd887
license: CC-BY-4.0 (texte), Apache-2.0 (exemples de code)
attribution: Google LLC et les auteurs cités, developer.chrome.com
modified: images et avatars retirés ; texte inchangé sinon
---

François Beaufort [GitHub](https://github.com/beaufortfrancois)

Published: February 7, 2024, Last updated: October 17, 2025

This document explains why WebGPU may be inoperable or not working as expected in Chrome browser, with clear steps to solve the issues where possible.

## navigator.gpu is undefined

The following example shows a JavaScript error you may get when `gpu` is not available in `navigator`:

```javascript
const adapter = await navigator.gpu.requestAdapter();
```

```
cancel Uncaught TypeError: Cannot read properties of undefined (reading 'requestAdapter')
```

This may be due to one of the following reasons. Check out those in this specific order:

1. WebGPU requires Chrome 113 or greater on ChromeOS, macOS, Windows and Chrome 121 or greater on Android. Check your version at `chrome://version` and update if necessary.

2. WebGPU is accessible only to secure contexts. If you serve your code over an insecure protocol (for example, `http:`, `file:`), either use the secure `https:` protocol or address this during the development of your web app in one of the following ways:

   - Serve your code locally on `http://localhost` or `http://127.0.0.1` with either of these commands: `npx http-server` or `python3 -m http.server`.

   - Add the origin to the "Insecure origins treated as secure" list of `chrome://flags/#unsafely-treat-insecure-origin-as-secure` and restart Chrome.

   - Install Node.js and run `npx servez --ssl` to serve your folder over https with a fake certificate. You'll still get a warning in Chrome you can bypass by clicking "Advanced" then "Proceed to...".

   - Expose your local web server to the Internet with [ngrok](https://ngrok.com/).

## The GPU adapter is null

The following is an example of a JavaScript error you may get when the adapter you get from calling `requestAdapter()` is null:

```javascript
const adapter = await navigator.gpu.requestAdapter();
const device = await adapter.requestDevice();
```

```
cancel Uncaught TypeError: Cannot read properties of undefined (reading requestDevice)
```

This happens for one of the following reasons. Check out those in this specific order:

1. WebGPU is disabled when the user has turned off "Use graphics acceleration when available" in `chrome://settings/system`. Check to see if this setting is turned off and turn it back on

2. WebGPU is not supported on this platform yet. You can enable the `chrome://flags/#enable-unsafe-webgpu` flag and restart Chrome. For Linux experimental support, you'll also need to enable the `chrome://flags/#enable-vulkan` flag. Check out [WebGPU support in Headless Chrome](https://developer.chrome.com/blog/supercharge-web-ai-testing.md.txt) to learn more.

3. The GPU hardware has been specifically blocklisted. If you see "WebGPU has been disabled via blocklist or the command line" in `chrome://gpu`, you can disable the WebGPU adapters blocklist by enabling the `chrome://flags/#enable-unsafe-webgpu` flag and restarting Chrome. You can also override the built-in software rendering list by enabling the `chrome://flags/#ignore-gpu-blocklist` flag and restarting Chrome.

4. There is no matching GPU adapter for the options passed in `requestAdapter()`. [Try calling `requestAdapter()` with different options](https://gpuweb.github.io/gpuweb/#dictdef-gpurequestadapteroptions).

5. WebGPU requires a GPU (either hardware or software-emulated). You can check if Chrome detects a GPU by visiting `chrome://gpu`.

6. The GPU process crashed several times. You can reload the page or restart Chrome. Check out [WebGPU Device Loss best practices](https://toji.dev/webgpu-best-practices/device-loss#chrome-specific-testing) to learn more.

## WebGPU is slower than WebGL

1. Open `chrome://gpu` and make sure you can read "WebGPU: Hardware accelerated". If you read "WebGPU: Software only, hardware acceleration unavailable", you may need to update your GPU drivers.

2. Directly translating WebGL concepts to WebGPU might not be taking full advantage of WebGPU's unique optimizations. Check out [From WebGL to WebGPU](https://developer.chrome.com/blog/from-webgl-to-webgpu) to learn about some of their differences.

## Windows-specific limitations

Be aware of the following limitations when using WebGPU on Windows devices:

- Chrome does not support using multiple GPU adapters simultaneously. See [issue chromium:329211593](https://issues.chromium.org/issues/329211593).

- Chrome always uses the same GPU adapter that's been allocated for other Chrome workloads, which for laptops is generally the integrated graphics card, due to the power usage aspect (ie: power saving). It means the [`powerPreference`](https://gpuweb.github.io/gpuweb/#dom-gpurequestadapteroptions-powerpreference) option doesn't have any impact when calling `requestAdapter()`. You can force use of the high performance GPU if available by enabling the `chrome://flags/#force-high-performance-gpu` flag and restarting Chrome.
