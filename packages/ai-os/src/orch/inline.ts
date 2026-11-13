// Exécution directe d'une étape en lecture seule (relecture, jugement, plan, brouillon) quand aucun runner n'écoute
// sur l'hôte : même adressage que la file (« cli[:modèle] » ou « fournisseur/modèle »), CLI en mode plan / bac à sable
// lecture seule, sans ajout de repli interne (la bascule appartient à l'orchestrateur). Les étapes qui modifient des
// fichiers passent toujours par la file du runner (commit borné aux chemins, contrôle d'acceptation).
import { resolveExe } from "../llm/agents";
import { llmAsk } from "../llm/model";
import { classify, type FailClass } from "./classify";
import { exec, type Host } from "./fleet";

export type InlineResult = {
  ok: boolean;
  text: string;
  cls?: FailClass;
  ms: number;
  tokens: number;
};

const ARGV_MAX = 24_000; // ligne de commande Windows : 32 767 caractères

function argvFor(
  cli: string,
  model: string | undefined,
  prompt: string,
  winLocal: boolean,
): { argv: string[]; stdin?: string } | string {
  const m = (flag: string) => (model ? [flag, model] : []);
  // Ligne de commande Windows bornée : une consigne trop longue n'est jamais tronquée en silence, le moteur est écarté.
  if (cli !== "claude" && winLocal && prompt.length > ARGV_MAX)
    return `consigne de ${prompt.length} caractères : trop longue pour la ligne de commande Windows de ${cli}`;
  const p = prompt;
  switch (cli) {
    case "claude":
      return {
        argv: [
          "claude",
          "-p",
          "--output-format",
          "json",
          "--permission-mode",
          "plan",
          ...m("--model"),
        ],
        stdin: prompt,
      };
    case "agy":
      return {
        argv: [
          "agy",
          "-p",
          p,
          "--output-format",
          "json",
          "--mode",
          "plan",
          ...m("--model"),
        ],
      };
    case "codex":
      return {
        argv: [
          "codex",
          "exec",
          "--skip-git-repo-check",
          "--sandbox",
          "read-only",
          ...m("-m"),
          p,
        ],
      };
    case "opencode":
      return { argv: ["opencode", "run", "--agent", "plan", ...m("-m"), p] };
    default:
      // pi n'a pas de mode lecture seule : il ne passe que par la file du runner.
      return `${cli} : pas de mode lecture seule pour l'exécution directe`;
  }
}

/** Réponse JSON des CLI (claude : result/is_error/usage ; agy : response) ou texte brut. */
function parse(out: string): {
  text: string;
  error?: boolean;
  errText?: string;
  tokens?: number;
} {
  try {
    const j = JSON.parse(out);
    const u = j.usage ?? {};
    const tokens =
      (u.input_tokens ?? 0) +
      (u.output_tokens ?? 0) +
      (u.cache_creation_input_tokens ?? 0) +
      (u.cache_read_input_tokens ?? 0);
    const error = j.is_error === true || !!j.error;
    const errText = error
      ? [
          j.result,
          typeof j.error === "string" ? j.error : JSON.stringify(j.error ?? ""),
        ]
          .filter((x) => x && x !== '""')
          .join(" ")
      : undefined;
    return {
      text: String(j.result ?? j.response ?? j.text ?? out).trim(),
      error,
      errText,
      tokens: tokens || undefined,
    };
  } catch {
    return { text: out.trim() };
  }
}

const estimate = (...s: string[]) =>
  Math.ceil(s.reduce((n, x) => n + x.length, 0) / 4);

export async function inline(
  h: Host,
  provider: string,
  prompt: string,
  timeoutMs = 600_000,
): Promise<InlineResult> {
  const t0 = performance.now();
  const [cli, model] = provider.split(/:(.*)/s);
  if (provider.includes("/") && !provider.includes(":")) {
    if (!h.local)
      return {
        ok: false,
        text: "modèle du pont : hôte local uniquement",
        cls: "missing",
        ms: 0,
        tokens: 0,
      };
    try {
      const r = await Promise.race([
        llmAsk(provider, prompt),
        Bun.sleep(timeoutMs).then(() => {
          throw new Error(`délai dépassé (${timeoutMs} ms)`);
        }),
      ]);
      const u = (r.usage?.inputTokens ?? 0) + (r.usage?.outputTokens ?? 0);
      return {
        ok: !!r.text,
        text: r.text || "réponse vide",
        cls: r.text ? undefined : "task",
        ms: r.ms,
        tokens: u || estimate(prompt, r.text),
      };
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      return {
        ok: false,
        text: msg,
        cls: classify(msg),
        ms: Math.round(performance.now() - t0),
        tokens: 0,
      };
    }
  }
  const spec = argvFor(
    cli!,
    model || undefined,
    prompt,
    h.local && process.platform === "win32",
  );
  if (typeof spec === "string")
    return { ok: false, text: spec, cls: "missing", ms: 0, tokens: 0 };
  const { argv, stdin } = spec;
  if (h.local) {
    // Jamais par cmd.exe (injection par la consigne) : l'exécutable visé par le shim .cmd, sinon moteur écarté.
    argv[0] = resolveExe(argv[0]!);
    if (/\.(cmd|bat)$/i.test(argv[0]!))
      return {
        ok: false,
        text: `${cli} : shim ${argv[0]} non résolu en .exe ; consigne non transmise par cmd.exe`,
        cls: "missing",
        ms: 0,
        tokens: 0,
      };
  }
  // À distance, une étape en lecture seule reçoit son contexte dans la consigne : elle tourne depuis le répertoire
  // personnel, sans exiger le checkout du runner.
  const r = await exec(h, argv, { stdin, timeoutMs, home: !h.local });
  const j = parse(r.out);
  const ok = r.code === 0 && !j.error && !!j.text;
  const ms = Math.round(performance.now() - t0);
  if (ok)
    return {
      ok,
      text: j.text,
      ms,
      tokens: j.tokens ?? estimate(prompt, j.text),
    };
  // Classement sur stderr et le champ d'erreur structuré, pas sur le texte produit par l'agent (qui peut citer
  // « 401 » ou « billing » dans une revue).
  const diag = (
    j.error ? `${j.errText ?? j.text}\n${r.err}` : r.err || r.out.slice(-1000)
  )
    .trim()
    .slice(-4000);
  return {
    ok: false,
    text: diag || `code ${r.code}`,
    cls: r.code === 124 ? "timeout" : classify(diag, r.code),
    ms,
    tokens: j.tokens ?? 0,
  };
}
