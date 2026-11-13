// LanguageModel and Embedder over the providers discovered at run time (models.ts). Nothing is hardcoded:
//   resolveModel("provider/model")  any id returned by listModels()/llm_models
//   resolveModel()                  AGENT_MODEL, else the first model of the first active provider
//   providerEmbedder("provider/model")  /v1/embeddings (core/model.ts resolveEmbedder: AGENT_EMBEDDER=hash|provider/model)
// OpenAI-compatible providers get native tool calling; CLI providers (antigravity, claude) answer in text only.
import { type Provider, listModels, providers } from "./models";
import type {
  ChatRequest,
  ChatResponse,
  Embedder,
  LanguageModel,
  Message,
  ToolCall,
} from "./types";

const split = (spec: string) => {
  const i = spec.indexOf("/");
  return i > 0 ? [spec.slice(0, i), spec.slice(i + 1)] : [spec, ""];
};

const toWire = (m: Message) => {
  switch (m.role) {
    case "assistant":
      return {
        role: "assistant",
        content: m.content,
        ...(m.toolCalls?.length
          ? {
              tool_calls: m.toolCalls.map((c) => ({
                id: c.id,
                type: "function",
                function: {
                  name: c.name,
                  arguments: JSON.stringify(c.input ?? {}),
                },
              })),
            }
          : {}),
      };
    case "tool":
      return { role: "tool", tool_call_id: m.toolCallId, content: m.content };
    default:
      return { role: m.role, content: m.content };
  }
};

const parseArgs = (a: unknown) => {
  if (typeof a !== "string") return a ?? {};
  try {
    return JSON.parse(a || "{}");
  } catch {
    return a;
  }
};

/** OpenAI chat/completions with function tools (Ollama, llama.cpp, vLLM, OpenRouter, HF router, Vercel, Workers AI). */
export function chatModel(
  id: string,
  p: Provider,
  model: string,
): LanguageModel {
  const chat = p.chat!;
  return {
    id,
    tools: true,
    async chat(req: ChatRequest): Promise<ChatResponse> {
      const r = await fetch(
        `${chat.base()}${chat.path ?? "/v1/chat/completions"}`,
        {
          method: "POST",
          headers: { "content-type": "application/json", ...chat.headers() },
          body: JSON.stringify({
            model,
            messages: [
              ...(req.system ? [{ role: "system", content: req.system }] : []),
              ...req.messages.map(toWire),
            ],
            ...(req.tools?.length
              ? {
                  tools: req.tools.map((t) => ({
                    type: "function",
                    function: {
                      name: t.name,
                      description: t.description,
                      parameters: t.inputSchema,
                    },
                  })),
                  tool_choice: req.toolChoice ?? "auto",
                }
              : {}),
            ...(req.maxOutputTokens ? { max_tokens: req.maxOutputTokens } : {}),
          }),
          signal: req.signal ?? AbortSignal.timeout(600_000),
        },
      );
      const raw = await r.text();
      let j: any;
      try {
        j = JSON.parse(raw);
      } catch {
        throw new Error(
          `${id} : HTTP ${r.status}, réponse non JSON : ${raw.slice(0, 200)}`,
        );
      }
      if (!r.ok || j.error || (!j.choices && !j.result))
        throw new Error(
          `${id} : HTTP ${r.status} ${JSON.stringify(j.error ?? j.errors ?? j).slice(0, 300)}`,
        );
      const msg = j.choices?.[0]?.message ?? {};
      const content = Array.isArray(msg.content)
        ? msg.content.map((p: any) => p?.text ?? "").join("")
        : msg.content;
      const toolCalls: ToolCall[] = (msg.tool_calls ?? []).map(
        (c: any, i: number) => ({
          id: String(c.id ?? `call_${crypto.randomUUID()}_${i}`),
          name: String(c.function?.name ?? c.name),
          input: parseArgs(c.function?.arguments ?? c.arguments),
        }),
      );
      return {
        text: String(content ?? j.result?.response ?? ""),
        toolCalls,
        finishReason: String(
          j.choices?.[0]?.finish_reason ??
            (toolCalls.length ? "tool_calls" : "stop"),
        ),
        usage: j.usage
          ? {
              inputTokens: j.usage.prompt_tokens,
              outputTokens: j.usage.completion_tokens,
            }
          : undefined,
      };
    },
  };
}

/** Flattens a conversation into one prompt for CLI agents (no tool calling on this path). */
export const flatten = (req: ChatRequest) => {
  const turns = req.messages.map((m) =>
    m.role === "tool" ? `[${m.name}] ${m.content}` : `${m.role}: ${m.content}`,
  );
  if (
    !req.system &&
    req.messages.length === 1 &&
    req.messages[0]!.role === "user"
  )
    return req.messages[0]!.content;
  return [req.system, ...turns].filter(Boolean).join("\n\n");
};

export function cliModel(
  id: string,
  p: Provider,
  model: string,
): LanguageModel {
  return {
    id,
    tools: false,
    chat: async (req) => {
      req.signal?.throwIfAborted();
      return {
        text: await p.ask!(model, flatten(req)),
        toolCalls: [],
        finishReason: "stop",
      };
    },
  };
}

/** Deterministic model `echo/<name>`: replies "<name>: <last user text>" (tests, smoke runs). */
export function echoModel(name = "echo"): LanguageModel {
  return {
    id: `echo/${name}`,
    tools: false,
    chat: async (req) => {
      const last = [...req.messages].reverse().find((m) => m.role === "user");
      return {
        text: `${name}: ${last?.content ?? ""}`,
        toolCalls: [],
        finishReason: "stop",
      };
    },
  };
}

/** First model of the first active provider, in providers() order (local servers first). */
export async function defaultModelId(): Promise<string> {
  for (const r of await listModels())
    if (r.available && r.models[0]) return r.models[0].id;
  throw new Error(
    "aucun modèle découvert (voir llm_models : Ollama, RELAY_OPENAI_ENDPOINTS, clés API ou CLI agy/claude)",
  );
}

export async function resolveModel(
  spec: string | undefined = Bun.env.AGENT_MODEL,
): Promise<LanguageModel> {
  const id = spec || (await defaultModelId());
  const [pid, mid] = split(id);
  if (pid === "echo") return echoModel(mid || "echo");
  const p = providers().find((x) => x.id === pid);
  if (!p)
    throw new Error(
      `fournisseur inconnu ou inactif : ${pid} (voir llm_models)`,
    );
  if (!mid)
    throw new Error(`modèle manquant : ${id} (attendu fournisseur/modèle)`);
  return p.chat ? chatModel(id, p, mid!) : cliModel(id, p, mid!);
}

/** OpenAI-compatible /v1/embeddings of a discovered provider. */
export function providerEmbedder(spec: string): Embedder {
  const [pid, model] = split(spec);
  if (!model) throw new Error(`modèle d'embeddings manquant : ${spec}`);
  const p = providers().find((x) => x.id === pid);
  if (!p?.chat)
    throw new Error(
      `embeddings indisponibles pour ${pid} (fournisseur sans API compatible OpenAI)`,
    );
  const path = (p.chat.path ?? "/v1/chat/completions").replace(
    "chat/completions",
    "embeddings",
  );
  return {
    id: spec,
    async embed(texts) {
      const out: number[][] = [];
      for (let i = 0; i < texts.length; i += 64) {
        const r = await fetch(`${p.chat!.base()}${path}`, {
          method: "POST",
          headers: { "content-type": "application/json", ...p.chat!.headers() },
          body: JSON.stringify({ model, input: texts.slice(i, i + 64) }),
          signal: AbortSignal.timeout(120_000),
        });
        const batch = texts.slice(i, i + 64);
        const j: any = await r.json().catch(() => ({}));
        const data: any[] = Array.isArray(j.data) ? [...j.data] : [];
        if (!r.ok || data.length !== batch.length)
          throw new Error(
            `${spec} : HTTP ${r.status}, ${data.length}/${batch.length} vecteurs`,
          );
        data.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        out.push(...data.map((d) => d.embedding as number[]));
      }
      return out;
    },
  };
}

/** Appel d'un modèle « fournisseur/modèle » (le modèle est celui que renvoie la liste ; rien n'est supposé). */
export async function llmAsk(model: string, prompt: string, system?: string) {
  const t0 = performance.now();
  const m = await resolveModel(model);
  const r = await m.chat({
    system,
    messages: [{ role: "user", content: prompt }],
  });
  return {
    text: r.text,
    model: m.id,
    usage: r.usage,
    ms: Math.round(performance.now() - t0),
  };
}
