import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Agents en ligne de commande servant de fournisseurs de modèles (Antigravity `agy`, Claude Code `claude`) :
// partagés par le pont de modèles (models.ts) et le relais (relay/backends.ts). Exécution sans shell, délai borné.

export type Answer = {
  text: string;
  engine: string;
  chat?: string;
  ms: number;
};

// Une clé d'API Anthropic dans l'environnement prime sur la connexion claude.ai et désactive ses connecteurs (Gmail,
// Drive…) ; GOOGLE_GENAI_USE_VERTEXAI envoie Gemini CLI vers Vertex au lieu du compte Google. Retirées pour ces moteurs.
const without = (...keys: string[]) =>
  Object.fromEntries(
    Object.entries(process.env).filter(([k]) => !keys.includes(k)),
  ) as Record<string, string>;
export const CLAUDE_ENV = () =>
  without(
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_CUSTOM_HEADERS",
    "ANTHROPIC_SERVICE_ACCOUNT_ID",
    "ANTHROPIC_WORKSPACE_ID",
  );

/** Sous Windows, une CLI installée en shim .cmd (agy.cmd, codex.cmd) passerait ses arguments par cmd.exe, qui
 * interprète & | < > ^ % : Bun refuse alors l'appel, et un passage forcé par cmd.exe permettrait une injection par la
 * consigne. On lance donc l'exécutable que le shim appelle (ligne `"<exe>" %*`, variables `set "X=…"` et
 * d'environnement résolues). Si le shim ne se résout pas, la commande est rendue telle quelle. */
export function resolveExe(name: string): string {
  if (process.platform !== "win32") return name;
  const p = Bun.which(name);
  if (!p || !/\.(cmd|bat)$/i.test(p)) return p ?? name;
  let text = "";
  try {
    text = readFileSync(p, "utf8");
  } catch {
    return p;
  }
  const vars: Record<string, string> = {};
  const expand = (s: string) =>
    s.replace(
      /%(\w+)%/g,
      (_, k) =>
        vars[k] ?? process.env[k] ?? process.env[k.toUpperCase()] ?? `%${k}%`,
    );
  for (const m of text.matchAll(/^\s*set\s+"(\w+)=([^"]*)"/gim))
    vars[m[1]!] ??= expand(m[2]!);
  // Premier appel `"<cible>" %*` : le chemin par défaut du shim, avant ses étiquettes de sous-commandes.
  const call = text.match(/^\s*"([^"]+)"\s+%\*/im)?.[1];
  const exe = call && expand(call);
  return exe && /\.exe$/i.test(exe) && !exe.includes("%") && existsSync(exe)
    ? exe
    : p;
}

export async function cli(
  engine: string,
  argv: string[],
  pick: (j: any) => string,
  env?: Record<string, string>,
): Promise<Answer> {
  const t0 = performance.now();
  argv = [resolveExe(argv[0]!), ...argv.slice(1)];
  const p = Bun.spawn(argv, {
    stdout: "pipe",
    stderr: "pipe",
    stdin: "ignore",
    timeout: Number(Bun.env.AGENT_CLI_TIMEOUT_MS ?? 600_000),
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

/** Consigne longue pour un agent qui lit des fichiers (agy) : écrite dans un fichier temporaire privé, la ligne de
 * commande ne porte que l'ordre de le lire (Windows : 32 767 caractères, ENAMETOOLONG ; Linux : 128 Kio par argument).
 * Partagé par agy() et l'exécution directe de l'orchestrateur (orch/inline.ts). */
export function viaFile(prompt: string): string {
  const file = join(mkdtempSync(join(tmpdir(), "agy-")), "prompt.md");
  writeFileSync(file, prompt, { mode: 0o600 });
  return `Lis intégralement le fichier ${file} (${prompt.length} caractères) et réponds à la demande qu il contient, comme si son contenu était ce message.`;
}

/** Antigravity CLI headless (`agy -p … --output-format json --mode plan`, 1.5.7) : session Antigravity déjà ouverte,
 * modèles Gemini 4. Modèle demandé (argument ou RELAY_AGY_MODEL, ex. gemini-4-carbon-high) ; s'il est épuisé
 * (RESOURCE_EXHAUSTED, crédits insuffisants), nouvel essai avec le modèle par défaut du compte. Mesuré : 1,96 s. */
export async function agy(
  prompt: string,
  model?: string,
  conversation?: string,
): Promise<Answer> {
  // Windows caps a command line at 32767 characters (ENAMETOOLONG): a long prompt goes to a private temp file
  // and agy (an agent with file access) is told to read it. Mode plan: it reads, it does not edit.
  const p = prompt.length > 8000 ? viaFile(prompt) : prompt;
  const argv = (m?: string) => [
    "agy",
    "-p",
    p,
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
