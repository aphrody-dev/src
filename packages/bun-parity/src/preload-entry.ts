/**
 * Standalone Drop-in Runtime Preload Entry for Bun
 * Automatically patches globalThis and Bun runtime with Chromium Parity APIs
 */

import { installAllChromiumPolyfills } from "./polyfills/index.ts";

// Automatically install all Chromium Parity Polyfills on globalThis
export const installedParity = installAllChromiumPolyfills(globalThis);

export * from "./polyfills/index.ts";
