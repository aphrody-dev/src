// Moteurs du relais.
//   gemini-web : gemini.google.com piloté par CDP dans le Chrome du relais (sélecteurs relevés le 2026-11-13 :
//                rich-textarea .ql-editor, bouton aria-label « Send message » / « Envoyer un message », model-response message-content,
//                bouton d'arrêt présent tant que la génération court ; aller-retour mesuré : 10,5 s).
//   antigravity : Antigravity CLI headless (`agy -p … --output-format json`), session Antigravity de l'utilisateur, modèles Gemini 4.
//   claude     : Claude Code headless (`claude -p --output-format json`), authentification existante de la CLI.
import { Tab, launchBrowser } from "./cdp.ts";

export type Answer = {
  text: string;
  engine: string;
  chat?: string;
  ms: number;
};

const GEMINI = "https://gemini.google.com/";
let queue: Promise<unknown> = Promise.resolve();
const serial = <T>(f: () => Promise<T>): Promise<T> => {
  const r = queue.then(f, f);
  queue = r.catch(() => {});
  return r;
};

/** Pose une question à Gemini (web). `chat` : identifiant ou URL d'une conversation existante, sinon conversation neuve. */
export function geminiWeb(
  prompt: string,
  opts: { chat?: string; timeoutMs?: number } = {},
): Promise<Answer> {
  return serial(async () => {
    const t0 = performance.now();
    await launchBrowser(true);
    const tab = await Tab.open(`${GEMINI}app`, GEMINI);
    try {
      const target = opts.chat
        ? opts.chat.startsWith("http")
          ? opts.chat
          : `${GEMINI}app/${opts.chat}`
        : `${GEMINI}app`;
      await tab.navigate(target);
      const ready = await tab.eval<string>(`(async () => {
        for (let i = 0; i < 100; i++) {
          if (location.host.startsWith('accounts.')) return 'login';
          if ([...document.querySelectorAll('button, a')].some(b => /^(Se connecter|Sign in)$/.test((b.getAttribute('aria-label') ?? b.textContent ?? '').trim()))) return 'login';
          const ed = document.querySelector('rich-textarea .ql-editor');
          if (ed) { ed.focus(); return 'ok'; }
          await new Promise(r => setTimeout(r, 150));
        }
        return 'timeout';
      })()`);
      if (ready === "login")
        throw new Error(
          "Gemini : session Google absente dans le Chrome du relais (relay login)",
        );
      if (ready !== "ok")
        throw new Error("Gemini : éditeur introuvable (interface modifiée ?)");
      const before = await tab.eval<number>(
        "document.querySelectorAll('model-response').length",
      );
      await tab.insertText(prompt);
      const sent = await tab.eval<boolean>(`(async () => {
        for (let i = 0; i < 40; i++) {
          const b = document.querySelector('button[aria-label="Send message"], button[aria-label="Envoyer un message"], button.send-button');
          if (b && !b.disabled) { b.click(); return true; }
          await new Promise(r => setTimeout(r, 100));
        }
        return false;
      })()`);
      if (!sent) throw new Error("Gemini : bouton d'envoi introuvable");
      const timeout = opts.timeoutMs ?? 600_000;
      const out = await tab.eval<{
        text: string;
        url: string;
      } | null>(`(async () => {
        const t0 = performance.now();
        let last = '', stable = 0;
        while (performance.now() - t0 < ${timeout}) {
          await new Promise(r => setTimeout(r, 400));
          const rs = document.querySelectorAll('model-response');
          if (rs.length <= ${before}) continue;
          const txt = rs[rs.length - 1].querySelector('message-content')?.innerText?.trim() ?? '';
          const busy = document.querySelector('button[aria-label*="Stop" i], button[aria-label*="Arrêter" i]');
          if (txt && txt === last && !busy) { if (++stable >= 3) return { text: txt, url: location.href }; } else stable = 0;
          last = txt;
        }
        return null;
      })()`);
      if (!out) throw new Error(`Gemini : pas de réponse en ${timeout} ms`);
      return {
        text: out.text,
        engine: "gemini-web",
        chat: out.url,
        ms: Math.round(performance.now() - t0),
      };
    } finally {
      tab.close();
    }
  });
}

// Une clé d'API Anthropic dans l'environnement prime sur la connexion claude.ai et désactive ses connecteurs (Gmail,
// Drive…) ; GOOGLE_GENAI_USE_VERTEXAI envoie Gemini CLI vers Vertex au lieu du compte Google. Retirées pour ces moteurs.
const without = (...keys: string[]) =>
  Object.fromEntries(
    Object.entries(process.env).filter(([k]) => !keys.includes(k)),
  ) as Record<string, string>;
const CLAUDE_ENV = () =>
  without(
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_CUSTOM_HEADERS",
    "ANTHROPIC_SERVICE_ACCOUNT_ID",
    "ANTHROPIC_WORKSPACE_ID",
  );

async function cli(
  engine: string,
  argv: string[],
  pick: (j: any) => string,
  env?: Record<string, string>,
): Promise<Answer> {
  const t0 = performance.now();
  const p = Bun.spawn(argv, {
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
    ...(env ? { env } : {}),
  });
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  if (code !== 0)
    throw new Error(`${engine} : code ${code} ${err.slice(0, 400)}`);
  let text = out.trim();
  try {
    text = pick(JSON.parse(out));
  } catch {}
  return { text, engine, ms: Math.round(performance.now() - t0) };
}

// NotebookLM (devenu « Gemini Notebook », notebook.google.com) : sélecteurs relevés le 2026-11-13 —
// textarea[aria-label="Query box"], button[aria-label="Submit"], réponse = dernier chat-message .to-user-container
// (bloc thinking-chain-view exclu) ; aller-retour mesuré : 22,5 s.
const NOTEBOOK = "https://notebook.google.com/";
export function notebookAsk(
  notebook: string,
  prompt: string,
  timeoutMs = 300_000,
): Promise<Answer> {
  return serial(async () => {
    const t0 = performance.now();
    await launchBrowser(true);
    const tab = await Tab.open(NOTEBOOK, NOTEBOOK);
    try {
      await tab.navigate(
        notebook.startsWith("http")
          ? notebook
          : `${NOTEBOOK}notebook/${notebook}`,
      );
      const out = await tab.eval<
        { text: string } | { error: string }
      >(`(async () => {
        let ta;
        for (let i = 0; i < 100 && !ta; i++) {
          if (location.host.startsWith('accounts.')) return { error: 'login' };
          ta = document.querySelector('textarea[aria-label="Query box"]');
          if (!ta) await new Promise(r => setTimeout(r, 150));
        }
        if (!ta) return { error: 'zone de question introuvable' };
        const before = document.querySelectorAll('chat-message').length;
        ta.focus();
        ta.value = ${JSON.stringify(prompt)};
        ta.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise(r => setTimeout(r, 300));
        document.querySelector('button[aria-label="Submit"]')?.click();
        const t0 = performance.now();
        let last = '', stable = 0;
        while (performance.now() - t0 < ${timeoutMs}) {
          await new Promise(r => setTimeout(r, 700));
          const ms = document.querySelectorAll('chat-message');
          if (ms.length <= before + 1) continue;
          const c = ms[ms.length - 1].querySelector('.to-user-container')?.cloneNode(true);
          c?.querySelectorAll('thinking-chain-view').forEach(e => e.remove());
          const txt = c?.innerText?.trim() ?? '';
          if (txt && txt === last) { if (++stable >= 3) return { text: txt }; } else stable = 0;
          last = txt;
        }
        return { error: 'pas de réponse' };
      })()`);
      if ("error" in out)
        throw new Error(
          out.error === "login"
            ? "NotebookLM : session Google absente (relay login)"
            : `NotebookLM : ${out.error}`,
        );
      return {
        text: out.text,
        engine: "notebooklm",
        chat: notebook,
        ms: Math.round(performance.now() - t0),
      };
    } finally {
      tab.close();
    }
  });
}

/** Antigravity CLI headless (`agy -p … --output-format json --mode plan`, 1.5.7) : session Antigravity déjà ouverte,
 * modèles Gemini 4. Modèle demandé (argument ou RELAY_AGY_MODEL, ex. gemini-4-carbon-high) ; s'il est épuisé
 * (RESOURCE_EXHAUSTED, crédits insuffisants), nouvel essai avec le modèle par défaut du compte. Mesuré : 1,96 s. */
export async function agy(
  prompt: string,
  model?: string,
  conversation?: string,
): Promise<Answer> {
  const argv = (m?: string) => [
    "agy",
    "-p",
    prompt,
    "--output-format",
    "json",
    "--mode",
    "plan",
    ...(m ? ["--model", m] : []),
    ...(conversation ? ["--conversation", conversation] : []),
  ];
  const pick = (j: any) => String(j.response ?? "").trim();
  const wanted = model ?? Bun.env.RELAY_AGY_MODEL;
  try {
    return await cli("antigravity", argv(wanted), pick);
  } catch (e: any) {
    if (!wanted || !/RESOURCE_EXHAUSTED|credits balance/i.test(e.message))
      throw e;
    const a = await cli("antigravity", argv(), pick);
    return { ...a, engine: `antigravity (repli : ${wanted} épuisé)` };
  }
}

/** Claude Code headless limité aux outils listés (ex. connecteurs claude.ai Google), sans autre permission. */
export const claudeWithTools = (prompt: string, tools: string[]) =>
  cli(
    "claude",
    [
      "claude",
      "-p",
      prompt,
      "--output-format",
      "json",
      "--permission-mode",
      "dontAsk",
      "--allowedTools",
      tools.join(","),
      "--disallowedTools",
      "mcp__relay",
    ],
    (j) => String(j.result ?? ""),
    CLAUDE_ENV(),
  );

export const claude = (prompt: string, model?: string) =>
  cli(
    "claude",
    [
      "claude",
      "-p",
      prompt,
      "--output-format",
      "json",
      "--permission-mode",
      "plan",
      ...(model ? ["--model", model] : []),
    ],
    (j) => String(j.result ?? ""),
  );

/** Gemini : Antigravity (agy) par défaut ; « web » = gemini.google.com dans le Chrome du relais. RELAY_GEMINI=agy|web. */
export async function gemini(
  prompt: string,
  opts: { chat?: string; engine?: string } = {},
): Promise<Answer> {
  const engine = opts.engine ?? Bun.env.RELAY_GEMINI ?? "agy";
  if (engine === "web") return geminiWeb(prompt, opts);
  return agy(prompt, undefined, opts.chat);
}
