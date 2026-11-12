// Provider resolution through native AI SDK providers. AGENT_MODEL=provider:model.
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";
import { createWorkersAI } from "workers-ai-provider";

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
    case "gateway": // Vercel AI Gateway model id, e.g. gateway:anthropic/claude-opus-5-5
      return id;
    default:
      throw new Error(`unknown provider ${provider}`);
  }
}
