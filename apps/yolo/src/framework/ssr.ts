// SPDX-License-Identifier: Apache-2.0
/**
 * Yolo Streaming HTMLRewriter SSR Engine
 * Injects cryptographic per-request CSP nonces, Material 3 color roles (@aphrody/design, Material Color Utilities),
 * canonical metadata, and initial deterministic JSON hydration state.
 */
import { tokens } from "../../../../packages/design/src/index.ts";
import {
  schemeCss,
  type Variant,
} from "../../../../packages/design/src/runtime.ts";

/** Brand seed (assets/brand/brand.toml via packages/design/tokens). */
export const BRAND_SEED = tokens.source.seed;

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

export function buildM3InlineThemeCss(seedHex = BRAND_SEED): string {
  const validHex = /^#[0-9a-fA-F]{6}$/.test(seedHex) ? seedHex : BRAND_SEED;
  return schemeCss(validHex, tokens.source.variant as Variant);
}

export function renderSsrDocument(
  rawHtml: string,
  options: YoloSsrRenderOptions,
): string {
  const inlineThemeCss = buildM3InlineThemeCss(options.seedHex);
  const safeJson = JSON.stringify(options.initialState).replace(
    /</g,
    "\\u003c",
  );

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
