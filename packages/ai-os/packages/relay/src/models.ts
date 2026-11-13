// Fournisseurs et modèles découverts à l'exécution, jamais codés en dur : chaque fournisseur est actif si son accès existe
// (variable d'environnement, CLI authentifiée ou serveur local qui répond) et sa liste de modèles vient de son API.
// Appel unifié : `llm_ask { model: "<fournisseur>/<modèle>" }` en API compatible OpenAI (chat/completions) ou par CLI.
//
//   fournisseur   accès                                         liste des modèles                         appel
//   ollama        OLLAMA_HOST ou 127.0.0.1:11434 qui répond     GET /api/tags                              /v1/chat/completions
//   openai-compat RELAY_OPENAI_ENDPOINTS="nom=url,…" (llama.cpp llama-server, vLLM, mistral.rs, LM Studio, LiteLLM proxy…)
//                                                               GET /v1/models                             /v1/chat/completions
//   openrouter    OPENROUTER_API_KEY                            GET /api/v1/models                         /api/v1/chat/completions
//   huggingface   HF_TOKEN                                      GET router.huggingface.co/v1/models        router /v1/chat/completions
//   vercel        AI_GATEWAY_API_KEY                            GET ai-gateway.vercel.sh/v1/models         /v1/chat/completions
//   cloudflare    CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID  GET /ai/models/search (Text Generation)    /ai/v1/chat/completions
//   antigravity   CLI agy authentifiée                          agy models                                 agy -p
//   claude        CLI claude authentifiée                       (alias de la CLI)                          claude -p
import { agy, claude } from "./backends.ts";

export type Model = {
  id: string;
  provider: string;
  name?: string;
  context?: number;
};
type Provider = {
  id: string;
  available: () => Promise<boolean>;
  list: () => Promise<Model[]>;
  chat?: {
    base: () => string;
    headers: () => Record<string, string>;
    path?: string;
  };
  ask?: (model: string, prompt: string) => Promise<string>;
};

const env = (k: string) => Bun.env[k];
const getJson = async (
  url: string,
  headers: Record<string, string> = {},
  ms = 4000,
) => {
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(ms) });
  if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
  return r.json() as Promise<any>;
};
const run = async (argv: string[]) => {
  const p = Bun.spawn(argv, {
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
  });
  const [out, , code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  return { out, code };
};
const bearer = (k: string | undefined): Record<string, string> =>
  k ? { authorization: `Bearer ${k}` } : {};
const openaiList = (provider: string, j: any): Model[] =>
  (j.data ?? []).map((m: any) => ({
    id: `${provider}/${m.id}`,
    provider,
    name: m.name ?? m.id,
    context: m.context_length ?? m.context_window,
  }));

function compat(id: string, base: string, key?: string): Provider {
  return {
    id,
    available: async () =>
      !!(await getJson(`${base}/v1/models`, bearer(key), 1500).catch(
        () => null,
      )),
    list: async () =>
      openaiList(id, await getJson(`${base}/v1/models`, bearer(key))),
    chat: { base: () => base, headers: () => bearer(key) },
  };
}

export function providers(): Provider[] {
  const out: Provider[] = [];
  const ollama = env("OLLAMA_HOST")
    ? env("OLLAMA_HOST")!.startsWith("http")
      ? env("OLLAMA_HOST")!
      : `http://${env("OLLAMA_HOST")}`
    : "http://127.0.0.1:11434";
  out.push({
    id: "ollama",
    available: async () =>
      !!(await getJson(`${ollama}/api/tags`, {}, 1500).catch(() => null)),
    list: async () =>
      ((await getJson(`${ollama}/api/tags`)).models ?? []).map((m: any) => ({
        id: `ollama/${m.name}`,
        provider: "ollama",
        name: m.name,
      })),
    chat: { base: () => ollama, headers: () => ({}) },
  });
  for (const pair of (env("RELAY_OPENAI_ENDPOINTS") ?? "")
    .split(",")
    .filter(Boolean)) {
    const [name, url] = pair.split("=");
    if (name && url)
      out.push(
        compat(
          name,
          url.replace(/\/+$/, "").replace(/\/v1$/, ""),
          env(`RELAY_${name.toUpperCase().replace(/\W/g, "_")}_KEY`),
        ),
      );
  }
  if (env("OPENROUTER_API_KEY"))
    out.push({
      id: "openrouter",
      available: async () => true,
      list: async () =>
        openaiList(
          "openrouter",
          await getJson("https://openrouter.ai/api/v1/models"),
        ),
      chat: {
        base: () => "https://openrouter.ai/api",
        headers: () => bearer(env("OPENROUTER_API_KEY")),
      },
    });
  if (env("HF_TOKEN"))
    out.push(
      compat("huggingface", "https://router.huggingface.co", env("HF_TOKEN")),
    );
  if (env("AI_GATEWAY_API_KEY"))
    out.push(
      compat(
        "vercel",
        "https://ai-gateway.vercel.sh",
        env("AI_GATEWAY_API_KEY"),
      ),
    );
  if (env("CLOUDFLARE_API_TOKEN") && env("CLOUDFLARE_ACCOUNT_ID")) {
    const base = `https://api.cloudflare.com/client/v4/accounts/${env("CLOUDFLARE_ACCOUNT_ID")}/ai`;
    out.push({
      id: "cloudflare",
      available: async () => true,
      list: async () =>
        (
          (
            await getJson(
              `${base}/models/search?task=Text%20Generation&per_page=200`,
              bearer(env("CLOUDFLARE_API_TOKEN")),
              8000,
            )
          ).result ?? []
        ).map((m: any) => ({
          id: `cloudflare/${m.name}`,
          provider: "cloudflare",
          name: m.name,
        })),
      chat: {
        base: () => base,
        headers: () => bearer(env("CLOUDFLARE_API_TOKEN")),
        path: "/v1/chat/completions",
      },
    });
  }
  out.push({
    id: "antigravity",
    available: async () => !!Bun.which("agy"),
    list: async () =>
      (await run(["agy", "models"])).out
        .split(/\r?\n/)
        .map((l) => l.split("\t"))
        .filter((c) => c.length >= 2 && /^[\w.-]+$/.test(c[0]!))
        .map(([id, name]) => ({
          id: `antigravity/${id}`,
          provider: "antigravity",
          name,
        })),
    ask: async (model, prompt) => (await agy(prompt, model || undefined)).text,
  });
  out.push({
    id: "claude",
    available: async () => !!Bun.which("claude"),
    list: async () => [
      {
        id: "claude/default",
        provider: "claude",
        name: "modèle par défaut de Claude Code",
      },
    ],
    ask: async (model, prompt) =>
      (await claude(prompt, model === "default" ? undefined : model)).text,
  });
  return out;
}

/** Modèles de tous les fournisseurs actifs (les fournisseurs injoignables sont signalés, pas bloquants). */
export async function listModels(filter?: string) {
  const res = await Promise.all(
    providers().map(async (p) => {
      if (!(await p.available().catch(() => false)))
        return { provider: p.id, available: false, models: [] as Model[] };
      try {
        return { provider: p.id, available: true, models: await p.list() };
      } catch (e: any) {
        return {
          provider: p.id,
          available: true,
          error: e.message,
          models: [] as Model[],
        };
      }
    }),
  );
  const re = filter ? new RegExp(filter, "i") : null;
  return res.map((r) => ({
    ...r,
    models: re ? r.models.filter((m) => re.test(m.id)) : r.models,
  }));
}

/** Appel d'un modèle « fournisseur/modèle » (le modèle est celui que renvoie la liste ; rien n'est supposé). */
export async function llmAsk(model: string, prompt: string, system?: string) {
  const i = model.indexOf("/");
  const pid = i > 0 ? model.slice(0, i) : model;
  const mid = i > 0 ? model.slice(i + 1) : "";
  const p = providers().find((x) => x.id === pid);
  if (!p)
    throw new Error(
      `fournisseur inconnu ou inactif : ${pid} (voir llm_models)`,
    );
  const t0 = performance.now();
  if (p.ask)
    return {
      text: await p.ask(mid, prompt),
      model,
      ms: Math.round(performance.now() - t0),
    };
  const r = await fetch(
    `${p.chat!.base()}${p.chat!.path ?? "/v1/chat/completions"}`,
    {
      method: "POST",
      headers: { "content-type": "application/json", ...p.chat!.headers() },
      body: JSON.stringify({
        model: mid,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          { role: "user", content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(600_000),
    },
  );
  const j: any = await r.json();
  if (!r.ok)
    throw new Error(
      `${model} : HTTP ${r.status} ${JSON.stringify(j.error ?? j.errors ?? j).slice(0, 300)}`,
    );
  return {
    text: String(j.choices?.[0]?.message?.content ?? j.result?.response ?? ""),
    model,
    usage: j.usage,
    ms: Math.round(performance.now() - t0),
  };
}
