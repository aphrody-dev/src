// Chrome DevTools Protocol, sans dépendance : lancement d'un Chrome dédié (profil propre au relais, Chrome 136+ refuse le
// débogage distant sur le profil par défaut) et pilotage d'un onglet par WebSocket (Target / Page / Runtime / Input).
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const relayHome = () =>
  Bun.env.RELAY_HOME ??
  (process.platform === "win32"
    ? join(Bun.env.LOCALAPPDATA ?? homedir(), "aphrody", "relay")
    : join(
        Bun.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"),
        "aphrody",
        "relay",
      ));

/** Exécutable Chrome : RELAY_CHROME, sinon chemin d'application enregistré (Windows), sinon PATH (Linux). */
export function chromePath(): string {
  if (Bun.env.RELAY_CHROME) return Bun.env.RELAY_CHROME;
  if (process.platform === "win32") {
    const q = Bun.spawnSync([
      "reg",
      "query",
      "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\chrome.exe",
      "/ve",
    ]);
    const m = /REG_SZ\s+(.+\.exe)/i.exec(q.stdout.toString());
    if (m) return m[1]!.trim();
  }
  for (const c of [
    "google-chrome-stable",
    "google-chrome",
    "chromium",
    "chromium-browser",
    "chrome",
  ]) {
    const p = Bun.which(c);
    if (p) return p;
  }
  throw new Error("Chrome introuvable : définir RELAY_CHROME");
}

export const cdpPort = () => Number(Bun.env.RELAY_CDP_PORT ?? 9333);

/** Lance le Chrome du relais (sans effet s'il répond déjà). `headless` false pour la connexion Google initiale. */
export async function launchBrowser(headless: boolean): Promise<void> {
  if (await version().catch(() => null)) return;
  const profile = join(relayHome(), "chrome");
  mkdirSync(profile, { recursive: true });
  const args = [
    `--user-data-dir=${profile}`,
    `--remote-debugging-port=${cdpPort()}`,
    "--remote-debugging-address=127.0.0.1",
    "--no-first-run",
    "--no-default-browser-check",
    ...(headless ? ["--headless=new"] : []),
    "https://gemini.google.com/app",
  ];
  Bun.spawn([chromePath(), ...args], {
    stdout: "ignore",
    stderr: "ignore",
    stdin: "ignore",
  }).unref();
  for (let i = 0; i < 50; i++) {
    if (await version().catch(() => null)) return;
    await Bun.sleep(200);
  }
  throw new Error(`Chrome du relais injoignable sur 127.0.0.1:${cdpPort()}`);
}

const base = () => `http://127.0.0.1:${cdpPort()}`;
async function version() {
  const r = await fetch(`${base()}/json/version`, {
    signal: AbortSignal.timeout(800),
  });
  return (await r.json()) as { Browser: string; webSocketDebuggerUrl: string };
}

export class Tab {
  private ws!: WebSocket;
  private seq = 0;
  private pending = new Map<
    number,
    { ok: (v: any) => void; ko: (e: Error) => void }
  >();
  private constructor(readonly id: string) {}

  /** Onglet existant dont l'URL commence par `prefix`, sinon nouvel onglet. */
  static async open(url: string, prefix = url): Promise<Tab> {
    const list = (await (await fetch(`${base()}/json/list`)).json()) as {
      id: string;
      type: string;
      url: string;
      webSocketDebuggerUrl: string;
    }[];
    let t = list.find((x) => x.type === "page" && x.url.startsWith(prefix));
    if (!t)
      t = (await (
        await fetch(`${base()}/json/new?${encodeURIComponent(url)}`, {
          method: "PUT",
        })
      ).json()) as typeof t;
    const tab = new Tab(t!.id);
    await tab.connect(t!.webSocketDebuggerUrl);
    return tab;
  }

  private connect(url: string) {
    return new Promise<void>((ok, ko) => {
      this.ws = new WebSocket(url);
      this.ws.onopen = () => ok();
      this.ws.onerror = () => ko(new Error("CDP : connexion refusée"));
      this.ws.onmessage = (e) => {
        const m = JSON.parse(String(e.data));
        const p = m.id && this.pending.get(m.id);
        if (!p) return;
        this.pending.delete(m.id);
        m.error ? p.ko(new Error(m.error.message)) : p.ok(m.result);
      };
    });
  }

  send<T = any>(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    const id = ++this.seq;
    return new Promise((ok, ko) => {
      this.pending.set(id, { ok, ko });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  /** Évalue une expression (promesses attendues) dans la page ; valeur sérialisée en JSON. */
  async eval<T = unknown>(expression: string): Promise<T> {
    const r = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
      userGesture: true,
    });
    if (r.exceptionDetails)
      throw new Error(
        r.exceptionDetails.exception?.description ?? r.exceptionDetails.text,
      );
    return r.result.value as T;
  }

  async navigate(url: string) {
    await this.send("Page.enable");
    await this.send("Page.navigate", { url });
  }

  /** Saisie réelle (Input.insertText : équivalent d'une frappe pour les éditeurs riches). */
  insertText(text: string) {
    return this.send("Input.insertText", { text });
  }

  close() {
    this.ws.close();
  }
}

export const browserInfo = async () =>
  version()
    .then((v) => v.Browser)
    .catch(() => null);
export const profileExists = () =>
  existsSync(join(relayHome(), "chrome", "Default"));
