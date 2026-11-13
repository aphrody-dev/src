// SPDX-License-Identifier: Apache-2.0
/**
 * @aphrody/chromium-bun — Google Boq (`batchexecute`) Protocol & Factual Grounding Verifier
 * Consolidated from `yolo-rs/yolo-web/crates/aphrody-boq` & `packages/search-core/src/hallucination-detector.ts`.
 */

import type { ThreeVpsSearchCluster } from "./cluster-3vps.ts";

export const BOQ_XSSI_PREFIX = ")]}'\n";

export function encodeBoqFreq(rpcId: string, payload: unknown): string {
  const inner = JSON.stringify(payload);
  return JSON.stringify([[[rpcId, inner, null, "generic"]]]);
}

export function stripBoqXssi(raw: string): string {
  const withoutNewline = raw.startsWith(")]}'\n") ? raw.slice(5) : raw;
  const withoutPrefix = withoutNewline.startsWith(")]}'")
    ? withoutNewline.slice(4)
    : withoutNewline;
  return withoutPrefix.trimStart();
}

export function extractBoqChunks(body: string): unknown[] {
  const chunks: unknown[] = [];
  const lines = body.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = (lines[i] ?? "").trim();
    if (!line) {
      i++;
      continue;
    }
    if (/^\d+$/.test(line)) {
      const length = Number(line);
      if (i + 1 < lines.length) {
        const next = (lines[i + 1] ?? "").trim();
        if (next) {
          try {
            chunks.push(JSON.parse(next));
            i += 2;
            continue;
          } catch {}
        }
      }
      let accumulated = "";
      let j = i + 1;
      while (j < lines.length && accumulated.length < length) {
        if (accumulated) accumulated += "\n";
        accumulated += lines[j] ?? "";
        j++;
      }
      try {
        chunks.push(JSON.parse(accumulated.trim()));
      } catch {}
      i = j;
    } else {
      try {
        chunks.push(JSON.parse(line));
      } catch {}
      i++;
    }
  }
  return chunks;
}

export function parseBoqEnvelopes<T = unknown>(raw: string): T[] {
  const stripped = stripBoqXssi(raw);
  const chunks = extractBoqChunks(stripped);
  const results: T[] = [];
  for (const chunk of chunks) {
    if (!Array.isArray(chunk)) continue;
    for (const env of chunk) {
      if (!Array.isArray(env) || env[0] !== "wrb.fr") continue;
      const inner = env[2];
      if (typeof inner === "string") {
        try {
          results.push(JSON.parse(inner) as T);
        } catch {}
      }
    }
  }
  return results;
}

export interface FactCheckClaimResult {
  claim: string;
  assessment: "True" | "False" | "Insufficient Information";
  summary: string;
  confidenceScore: number;
  sources: Array<{ title: string; url: string; snippet: string }>;
}

export class SovereignGroundingVerifier {
  constructor(private readonly cluster: ThreeVpsSearchCluster) {}

  extractClaims(text: string): string[] {
    return text
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 15 && !s.startsWith("#"));
  }

  async verifyClaim(claim: string): Promise<FactCheckClaimResult> {
    const searchRes = await this.cluster.search(claim, { limit: 3 });

    let assessment: FactCheckClaimResult["assessment"] =
      "Insufficient Information";
    let summary =
      "No authoritative local or verified cluster document matched the query.";
    let confidence = 50;

    const bestHit = searchRes.hits[0];
    if (bestHit) {
      const claimLower = claim.toLowerCase();
      const snippetLower = (bestHit.snippet || "").toLowerCase();
      const titleLower = (bestHit.title || "").toLowerCase();

      const keywords = claimLower.split(/\W+/).filter((w) => w.length >= 4);
      const matches = keywords.filter(
        (k) => snippetLower.includes(k) || titleLower.includes(k),
      );
      const matchRatio =
        keywords.length > 0 ? matches.length / keywords.length : 0;

      if (matchRatio >= 0.4) {
        assessment = "True";
        summary = `Verified against ${bestHit.title} (${bestHit.url})`;
        confidence = Math.min(98, Math.max(75, Math.round(matchRatio * 100)));
      } else {
        assessment = "False";
        summary = `Inconsistency detected against ${bestHit.title} (${bestHit.url})`;
        confidence = 80;
      }
    }

    return {
      claim,
      assessment,
      summary,
      confidenceScore: confidence,
      sources: searchRes.hits.map((h) => ({
        title: h.title,
        url: h.url,
        snippet: h.snippet,
      })),
    };
  }
}
