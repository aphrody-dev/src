// Interactive TUI e2e through a real pseudo-terminal (ConPTY on Windows, openpty on Linux) via Bun.spawn({ terminal }).
import { expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI = join(import.meta.dir, "..", "..", "core", "src", "cli.ts");
const strip = (s: string) => s.replace(/\x1b\[[0-9;?<>=]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(\x07|\x1b\\)|\x1b[=>78]/g, "");

test("tui: type a prompt, get the reply, /exit", async () => {
  const home = mkdtempSync(join(tmpdir(), "agent-pty-"));
  let screen = "";
  const dec = new TextDecoder();
  const p = Bun.spawn([process.execPath, CLI, "tui", "--home", home, "--model", "echo:bot"], {
    cwd: home,
    env: { ...Bun.env, AGENT_EMBEDDER: "hash" },
    terminal: { cols: 100, rows: 30, data: (_t, d) => void (screen += dec.decode(d)) },
  });
  const waitFor = async (needle: string, ms = 15_000) => {
    const t0 = Date.now();
    while (!strip(screen).includes(needle)) {
      if (Date.now() - t0 > ms) throw new Error(`timeout waiting for ${needle}\n${strip(screen).slice(-800)}`);
      await Bun.sleep(50);
    }
  };
  await waitFor("/help");
  for (const ch of "hello pty") p.terminal!.write(ch);
  p.terminal!.write("\r");
  await waitFor("bot: hello pty");
  for (const ch of "/exit") p.terminal!.write(ch);
  p.terminal!.write("\r");
  const code = await Promise.race([p.exited, Bun.sleep(10_000).then(() => "timeout")]);
  if (code === "timeout") p.kill();
  expect(code).toBe(0);
}, 40_000);
