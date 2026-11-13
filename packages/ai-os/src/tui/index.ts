// Terminal UI, Bun-native (node:readline + node:util styleText, no npm dependency): prompt line with history,
// transcript with light markdown styling (bold, inline code, headings), spinner while the agent runs, slash commands.
import { createInterface } from "node:readline";
import { styleText } from "node:util";
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

export const HELP = "/help  /clear  /exit   Enter sends, Ctrl+C quits";

/** Minimal markdown styling for the transcript (terminal escapes only when the output is a TTY). */
export function renderMarkdown(md: string, color = true) {
  if (!color) return md;
  return md
    .split("\n")
    .map((l) =>
      /^#{1,6}\s/.test(l)
        ? styleText(["bold", "cyan"], l.replace(/^#+\s/, ""))
        : l
            .replace(/\*\*([^*]+)\*\*/g, (_, x) => styleText("bold", x))
            .replace(/`([^`]+)`/g, (_, x) => styleText("yellow", x))
            .replace(
              /(^|\s)_([^_]+)_(?=\s|$)/g,
              (_, a, x) => a + styleText("italic", x),
            ),
    )
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
    if (r.toolCalls.length) s.print(`_tools: ${r.toolCalls.join(", ")}_`);
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
    prompt: color ? styleText("cyan", "> ") : "> ",
  });
  const history: Message[] = [];
  const frames = ["|", "/", "-", "\\"];
  let spin: ReturnType<typeof setInterval> | undefined;
  const print = (md: string) =>
    void output.write(`${renderMarkdown(md, color)}\n`);
  const busy = (on: boolean) => {
    if (on && color) {
      let i = 0;
      spin = setInterval(
        () =>
          output.write(
            `\r${styleText("dim", `${frames[i++ % frames.length]} thinking`)}`,
          ),
        120,
      );
    } else if (spin) {
      clearInterval(spin);
      spin = undefined;
      output.write("\r\x1b[2K");
    }
  };
  output.write(
    `${color ? styleText("bold", "ai-os") + styleText("dim", `  ${HELP}`) : `ai-os  ${HELP}`}\n`,
  );
  rl.on("SIGINT", () => {
    rl.close();
    process.exit(0);
  });
  rl.prompt();
  for await (const line of rl) {
    if (!(await handle(line, { history, print, busy }, o))) break;
    rl.prompt();
  }
  rl.close();
  process.exit(0);
}
