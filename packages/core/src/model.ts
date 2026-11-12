// Provider resolution through native AI SDK providers. AGENT_MODEL=provider:model.
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { aiEmbedder, type Embedder, hashEmbedder } from "./context";

export function resolveModel(spec = Bun.env.AGENT_MODEL ?? "anthropic:claude-opus-5-5"): LanguageModel {
  const i = spec.indexOf(":");
  const provider = i < 0 ? "anthropic" : spec.slice(0, i);
  const id = i < 0 ? spec : spec.slice(i + 1);
  switch (provider) {
    case "anthropic":
      return createAnthropic()(id);
    case "local": // llama.cpp server or any OpenAI-compatible endpoint
      return createOpenAICompatible({ name: "local", baseURL: Bun.env.AGENT_BASE_URL ?? "http://127.0.0.1:8080/v1" }).chatModel(id);
    case "workers-ai": // Cloudflare Workers AI via the official AI SDK provider (REST mode)
      return createWorkersAI({ accountId: Bun.env.CLOUDFLARE_ACCOUNT_ID!, apiKey: Bun.env.CLOUDFLARE_API_TOKEN! })(id as never);
    case "echo": {
      // deterministic test model: replies "<id>: <last user text>"
      const { MockLanguageModelV4 } = require("ai/test") as typeof import("ai/test");
      return new MockLanguageModelV4({
        doGenerate: async (opts) => {
          const last = [...opts.prompt].reverse().find((m) => m.role === "user");
          const text = last && Array.isArray(last.content) ? last.content.map((p) => ("text" in p ? p.text : "")).join("") : "";
          return {
            content: [{ type: "text", text: `${id}: ${text}` }],
            finishReason: { unified: "stop", raw: undefined },
            usage: { inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 }, outputTokens: { total: 1, text: 1, reasoning: 0 } },
            warnings: [],
          };
        },
      });
    }
    case "gateway": // Vercel AI Gateway model id, e.g. gateway:anthropic/claude-opus-5-5
      return id;
    default:
      throw new Error(`unknown provider ${provider}`);
  }
}

/** AGENT_EMBEDDER=hash | workers-ai:@cf/baai/bge-m3 | local:<model> (llama.cpp /v1/embeddings). Default: hash (offline). */
export function resolveEmbedder(spec = Bun.env.AGENT_EMBEDDER ?? "hash"): Embedder {
  const i = spec.indexOf(":");
  const provider = i < 0 ? spec : spec.slice(0, i);
  const id = spec.slice(i + 1);
  switch (provider) {
    case "hash":
      return hashEmbedder();
    case "workers-ai":
      return aiEmbedder(
        createWorkersAI({ accountId: Bun.env.CLOUDFLARE_ACCOUNT_ID!, apiKey: Bun.env.CLOUDFLARE_API_TOKEN! }).textEmbedding(id as never),
        spec,
      );
    case "local":
      return aiEmbedder(
        createOpenAICompatible({ name: "local", baseURL: Bun.env.AGENT_BASE_URL ?? "http://127.0.0.1:8080/v1" }).embeddingModel(id),
        spec,
      );
    default:
      throw new Error(`unknown embedder ${spec}`);
  }
}
