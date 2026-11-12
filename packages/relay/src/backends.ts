// Moteurs du relais.
//   gemini-web : gemini.google.com piloté par CDP dans le Chrome du relais (sélecteurs relevés le 2026-11-13 :
//                rich-textarea .ql-editor, bouton aria-label « Send message » / « Envoyer un message », model-response message-content,
//                bouton d'arrêt présent tant que la génération court ; aller-retour mesuré : 10,5 s).
//   gemini-cli : Gemini CLI headless (`gemini -p … -o json`, 0.68.0), sans navigateur (Linux, services).
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
const GEMINI_ENV = () => without("GOOGLE_GENAI_USE_VERTEXAI");

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

export const geminiCli = (prompt: string, model?: string) =>
  cli(
    "gemini-cli",
    [
      "gemini",
      "--skip-trust",
      "-p",
      prompt,
      "-o",
      "json",
      "--approval-mode",
      "plan",
      ...(model ? ["-m", model] : []),
    ],
    (j) => String(j.response ?? j.text ?? ""),
    GEMINI_ENV(),
  );

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

/** Gemini : web si un Chrome de relais est configurable (session Google), sinon CLI. RELAY_GEMINI=web|cli force le moteur. */
export async function gemini(
  prompt: string,
  opts: { chat?: string; engine?: string } = {},
): Promise<Answer> {
  const engine =
    opts.engine ??
    Bun.env.RELAY_GEMINI ??
    (process.platform === "win32" ? "web" : "cli");
  return engine === "cli" ? geminiCli(prompt) : geminiWeb(prompt, opts);
}
