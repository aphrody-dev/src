// @aphrody/design CLI : bun run src/cli.ts themes [--check] | screenshots [name...]
//   themes       writes tokens/themes.json and tokens/themes.css from src/themes.ts (--check: fail on drift)
//   screenshots  headless Chrome over DevTools (CHROME env, else usual paths) -> assets/brand/captures/themes/<name>-<mode>.png
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildThemes, previewHtml, THEMES, themesCss } from "./themes.ts";

const pkg = join(import.meta.dir, "..");
const root = join(pkg, "..", "..");
const [cmd, ...args] = process.argv.slice(2);

async function themes(check: boolean) {
  const files: [string, string][] = [
    [join(pkg, "tokens/themes.json"), JSON.stringify(buildThemes(), null, 2) + "\n"],
    [join(pkg, "tokens/themes.css"), themesCss()],
  ];
  let drift = 0;
  for (const [f, body] of files) {
    if (check) {
      if (!(await Bun.file(f).exists()) || (await Bun.file(f).text()) !== body) {
        console.error(`drift: ${f}`);
        drift++;
      }
    } else await Bun.write(f, body);
  }
  if (drift) process.exit(1);
  console.log(`${THEMES.length} themes, ${files.length} files${check ? " (unchanged)" : ""}`);
}

function chromePath(): string {
  const c = [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"];
  const f = c.find((p) => p && existsSync(p));
  if (!f) throw new Error("Chrome not found; set CHROME");
  return f;
}

async function screenshots(only: string[]) {
  const out = join(root, "assets/brand/captures/themes");
  mkdirSync(out, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "design-themes-"));
  // Chrome may fork and exit its launcher: talk to the browser over DevTools (as assets/brand/capture.ts does).
  Bun.spawn(
    [chromePath(), "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${join(tmp, "p")}`, "--hide-scrollbars",
      "--no-first-run", "--disable-extensions", "--force-color-profile=srgb", "about:blank"],
    { stdout: "ignore", stderr: "ignore" },
  );
  const portFile = join(tmp, "p", "DevToolsActivePort");
  for (let i = 0; i < 100 && !existsSync(portFile); i++) await Bun.sleep(100);
  const [port, path] = (await Bun.file(portFile).text()).trim().split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let seq = 0;
  const pending = new Map<number, (m: any) => void>();
  ws.addEventListener("message", (e) => {
    const m = JSON.parse(String(e.data));
    pending.get(m.id)?.(m);
  });
  const send = (method: string, params: object = {}, sessionId?: string) =>
    new Promise<any>((res, rej) => {
      const id = ++seq;
      pending.set(id, (m) => (m.error ? rej(new Error(`${method}: ${m.error.message}`)) : res(m.result)));
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  try {
    for (const t of THEMES.filter((t) => !only.length || only.includes(t.name))) {
      for (const mode of ["light", "dark"] as const) {
        const { targetId } = await send("Target.createTarget", { url: "about:blank" });
        const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
        await send("Page.enable", {}, sessionId);
        await send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false }, sessionId);
        const { frameTree } = await send("Page.getFrameTree", {}, sessionId);
        await send("Page.setDocumentContent", { frameId: frameTree.frame.id, html: previewHtml(t, mode) }, sessionId);
        await Bun.sleep(300);
        const shot = await send("Page.captureScreenshot", { format: "png" }, sessionId);
        await Bun.write(join(out, `${t.name}-${mode}.png`), Buffer.from(shot.data, "base64"));
        await send("Target.closeTarget", { targetId });
        console.log(`${t.name}-${mode}.png`);
      }
    }
  } finally {
    await send("Browser.close").catch(() => {});
    ws.close();
    await Bun.sleep(1000);
    rmSync(tmp, { recursive: true, force: true });
  }
}

if (cmd === "themes") await themes(args.includes("--check"));
else if (cmd === "screenshots") await screenshots(args);
else {
  console.error("usage: cli.ts themes [--check] | screenshots [name...]");
  process.exitCode = 2;
}
