// SPDX-License-Identifier: Apache-2.0
/**
 * Yolo Streaming HTMLRewriter SSR Engine
 * Injects cryptographic per-request CSP nonces, dynamic Material Design 3 HCT CSS variables,
 * canonical metadata, and initial deterministic JSON hydration state.
 */
import {
  exportWebCss,
  generateDynamicTheme,
} from "../../../../packages/google-design/src/index.ts";

export interface YoloSsrRenderOptions {
  nonce: string;
  seedHex?: string;
  canonicalUrl: string;
  initialState: Record<string, unknown>;
}

export function generateCspNonce(): string {
  const random = crypto.getRandomValues(new Uint8Array(16));
  return Buffer.from(random).toString("base64");
}

export function buildM3InlineThemeCss(seedHex = "#1A73E8"): string {
  const validHex = /^#[0-9a-fA-F]{6}$/.test(seedHex) ? seedHex : "#1A73E8";
  const theme = generateDynamicTheme(validHex, "tonal_spot", 0.0);
  return exportWebCss(theme);
}

export function renderSsrDocument(rawHtml: string, options: YoloSsrRenderOptions): string {
  const inlineThemeCss = buildM3InlineThemeCss(options.seedHex);
  const safeJson = JSON.stringify(options.initialState).replace(/</g, "\\u003c");

  const rewriter = new HTMLRewriter()
    .on("link[rel='canonical']", {
      element(el) {
        el.setAttribute("href", options.canonicalUrl);
      },
    })
    .on("style#yolo-m3-theme", {
      element(el) {
        el.setAttribute("nonce", options.nonce);
        el.setInnerContent(inlineThemeCss, { html: false });
      },
    })
    .on("script#yolo-ssr-state", {
      element(el) {
        el.setAttribute("nonce", options.nonce);
        el.setInnerContent(safeJson, { html: false });
      },
    })
    .on("script[src]", {
      element(el) {
        el.setAttribute("nonce", options.nonce);
      },
    });

  return rewriter.transform(rawHtml);
}
