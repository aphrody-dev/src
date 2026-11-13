// Terminal UI, Bun-native (node:readline + node:util styleText ; couleurs = rôles M3 de @aphrody/design, ansi 24 bits): prompt line with history,
// transcript with light markdown styling (bold, inline code, headings), spinner while the agent runs, slash commands.
import { createInterface } from "node:readline";
import { styleText } from "node:util";
import { ansi, type Role } from "@aphrody/design";
import { run } from "../core/agent";
import type { LanguageModel, Message } from "../llm/types";

export type TuiOptions = {
  home: string;
  model: LanguageModel;
  cwd?: string;
  allowShell?: boolean;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
};

/** Texte coloré par un rôle M3 (thème sombre), avant-plan seul pour garder gras/italique. */
const md = (role: Role, x: string) => `${ansi(role, "dark")}${x}\x1b[39m`;

export const HELP = "/help  /clear  /exit   Enter sends, Ctrl+C quits";

/** Minimal markdown styling for the transcript (terminal escapes only when the output is a TTY). */
export function renderMarkdown(md: string, color = true) {
  if (!color) return md;
  let fenced = false;
  return md
    .split("\n")
    .map((l) => {
      if (/^\s*```/.test(l)) {
        fenced = !fenced;
        return styleText("dim", l);
      }
      if (fenced) return md("tertiary", l);
      // Inline code first; its content is kept out of the bold/italic rules.
      const parts = l.split(/(`[^`]+`)/);
      if (/^#{1,6}\s/.test(l))
        return styleText("bold", md("primary", l.replace(/^#+\s/, "")));
      return parts
        .map((p) =>
          p.startsWith("`") && p.endsWith("`") && p.length > 1
            ? md("secondary", p.slice(1, -1))
            : p
                .replace(/\*\*([^*]+)\*\*/g, (_, x) => styleText("bold", x))
                .replace(
                  /(^|\s)_([^_\s][^\n]*?)_(?=\s|$)/g,
                  (_, a, x) => a + styleText("italic", x),
                ),
        )
        .join("");
    })
    .join("\n");
}

/** Handles one submitted line; returns false to quit. Exported for tests. */
export async function handle(
  input: string,
  s: {
    history: Message[];
    print: (md: string) => void;
    busy: (on: boolean) => void;
  },
  o: TuiOptions,
): Promise<boolean> {
  const text = input.trim();
  if (!text) return true;
  if (text === "/exit" || text === "/quit") return false;
  if (text === "/help") return (s.print(HELP), true);
  if (text === "/clear")
    return ((s.history.length = 0), s.print("_session cleared_"), true);
  s.print(`**you**  ${text}`);
  s.busy(true);
  try {
    const r = await run({
      task: text,
      model: o.model,
      home: o.home,
      cwd: o.cwd ?? process.cwd(),
      allowShell: o.allowShell,
      history: s.history,
    });
    s.busy(false);
    if (r.toolCalls.length) s.print(`tools: \`${r.toolCalls.join(", ")}\``);
    s.print(r.text || "_(no text)_");
  } catch (e) {
    s.busy(false);
    s.print(`**error** ${e instanceof Error ? e.message : String(e)}`);
  }
  return true;
}

export async function startTui(o: TuiOptions) {
  const input = o.input ?? process.stdin;
  const output = o.output ?? process.stdout;
  const color = (output as { isTTY?: boolean }).isTTY === true;
  const rl = createInterface({
    input,
    output,
    terminal: color,
    prompt: color ? md("primary", "> ") : "> ",
  });
  const history: Message[] = [];
  const frames = ["|", "/", "-", "\\"];
  let spin: ReturnType<typeof setInterval> | undefined;
  const print = (md: string) =>
    void output.write(`${renderMarkdown(md, color)}\n`);
  const busy = (on: boolean) => {
    if (spin) {
      clearInterval(spin);
      spin = undefined;
      output.write("\r\x1b[2K");
    }
    if (on) rl.pause();
    else rl.resume();
    if (on && color) {
      let i = 0;
      spin = setInterval(
        () =>
          output.write(
            `\r${styleText("dim", `${frames[i++ % frames.length]} thinking`)}`,
          ),
        120,
      );
    }
  };
  output.write(
    `${color ? styleText("bold", "ai-os") + styleText("dim", `  ${HELP}`) : `ai-os  ${HELP}`}\n`,
  );
  // Ctrl+C closes the prompt; the caller (agent CLI) decides how the process ends.
  rl.on("SIGINT", () => rl.close());
  rl.prompt();
  for await (const line of rl) {
    if (!(await handle(line, { history, print, busy }, o))) break;
    rl.prompt();
  }
  busy(false);
  rl.close();
}
