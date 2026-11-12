// pi-style TUI on @earendil-works/pi-tui (same code as our fork third_party/pi, MIT, Mario Zechner):
// main-screen differential renderer, multi-line editor, markdown transcript, spinner, slash commands.
import { run } from "@aphrody/agent-core";
import {
  Editor,
  type EditorTheme,
  Loader,
  Markdown,
  type MarkdownTheme,
  matchesKey,
  ProcessTerminal,
  type Terminal,
  Text,
  type TUI,
  TuiMainScreen,
} from "@earendil-works/pi-tui";
import type { LanguageModel, ModelMessage } from "ai";
import { styleText } from "node:util";

const c =
  (...f: Parameters<typeof styleText>[0][]) =>
  (s: string) =>
    f.reduce((acc, x) => styleText(x, acc), s);

export const markdownTheme: MarkdownTheme = {
  heading: c("bold", "cyan"),
  link: c("blue"),
  linkUrl: c("dim"),
  code: c("yellow"),
  codeBlock: c("green"),
  codeBlockBorder: c("dim"),
  quote: c("italic"),
  quoteBorder: c("dim"),
  hr: c("dim"),
  listBullet: c("cyan"),
  bold: c("bold"),
  italic: c("italic"),
  strikethrough: c("strikethrough"),
  underline: c("underline"),
};
export const editorTheme: EditorTheme = {
  borderColor: c("dim"),
  selectList: { selectedPrefix: c("blue"), selectedText: c("bold"), description: c("dim"), scrollInfo: c("dim"), noMatch: c("dim") },
};

export type TuiOptions = { home: string; model: LanguageModel; cwd?: string; allowShell?: boolean; terminal?: Terminal };

export const HELP = "/help  /clear  /exit   Enter sends, Shift+Enter newline, Ctrl+C quits";

/** Handles one submitted line; returns false to quit. Exported for tests. */
export async function handle(
  input: string,
  s: { history: ModelMessage[]; print: (md: string) => void; busy: (on: boolean) => void },
  o: TuiOptions,
): Promise<boolean> {
  const text = input.trim();
  if (!text) return true;
  if (text === "/exit" || text === "/quit") return false;
  if (text === "/help") return s.print(HELP), true;
  if (text === "/clear") return (s.history.length = 0), s.print("_session cleared_"), true;
  s.print(`**you**  ${text}`);
  s.busy(true);
  try {
    const r = await run({ task: text, model: o.model, home: o.home, cwd: o.cwd ?? process.cwd(), allowShell: o.allowShell, history: s.history });
    if (r.toolCalls.length) s.print(styleText("dim", `tools: ${r.toolCalls.join(", ")}`));
    s.print(r.text || "_(no text)_");
  } catch (e) {
    s.print(`**error** ${e instanceof Error ? e.message : String(e)}`);
  } finally {
    s.busy(false);
  }
  return true;
}

export async function startTui(o: TuiOptions) {
  const tui: TUI = new TuiMainScreen(o.terminal ?? new ProcessTerminal());
  const history: ModelMessage[] = [];
  tui.addChild(new Text(styleText("bold", "agent") + styleText("dim", `  ${HELP}`), 1, 0));
  const editor = new Editor(tui, editorTheme);
  let loader: Loader | undefined;
  const print = (md: string) => {
    tui.removeChild(editor);
    tui.addChild(new Markdown(md, 1, 0, markdownTheme));
    if (loader) tui.removeChild(loader), tui.addChild(loader);
    tui.addChild(editor);
    tui.requestRender();
  };
  const busy = (on: boolean) => {
    if (on) {
      loader = new Loader(tui, c("cyan"), c("dim"), "thinking");
      tui.removeChild(editor);
      tui.addChild(loader);
      tui.addChild(editor);
    } else if (loader) {
      loader.stop();
      tui.removeChild(loader);
      loader = undefined;
    }
    tui.requestRender();
  };
  const quit = () => {
    tui.stop();
    process.exit(0);
  };
  editor.onSubmit = (value) => {
    void handle(value, { history, print, busy }, o).then((cont) => cont || quit());
  };
  tui.addChild(editor);
  tui.setFocus(editor);
  tui.addInputListener((data) => {
    if (matchesKey(data, "ctrl+c")) quit();
  });
  tui.start();
}
