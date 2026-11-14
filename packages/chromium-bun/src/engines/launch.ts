// SPDX-License-Identifier: Apache-2.0
/**
 * Lance un moteur headless qui expose CDP (Chrome for Testing, Chromium, Playwright Chromium,
 * Obscura) ou WebDriver (Servo) sur 127.0.0.1, et rend son point d'accès. Le pilotage
 * CDP passe par le client existant (browser/cdp-client.ts) ; Playwright et Puppeteer s'y connectent
 * aussi (connectOverCDP, connect({ browserURL })).
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ChromiumBunCdpClient } from "../browser/cdp-client.ts";
import { type Engine, getEngine, resolveExecutable } from "./registry.ts";

export interface RunningEngine extends AsyncDisposable {
  readonly engine: Engine;
  readonly executable: string;
  readonly port: number;
  /** http://127.0.0.1:<port> : base CDP (/json/version) ou WebDriver (/status). */
  readonly endpoint: string;
  /** CDP : URL WebSocket du navigateur ; WebDriver classique : null. */
  readonly webSocketDebuggerUrl: string | null;
  readonly version: string;
  connect(): Promise<ChromiumBunCdpClient>;
  close(): Promise<void>;
}

/** Port TCP libre choisi par le système. */
export function freePort(): number {
  const s = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch: () => new Response(null, { status: 204 }),
  });
  const port = s.port;
  s.stop(true);
  return port;
}

async function probe(engine: Engine, base: string) {
  const url =
    engine.protocol === "webdriver" ? `${base}/status` : `${base}/json/version`;
  const r = await fetch(url, { signal: AbortSignal.timeout(800) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = (await r.json()) as {
    Browser?: string;
    webSocketDebuggerUrl?: string;
    value?: { ready?: boolean; build?: { version?: string } };
  };
  return engine.protocol === "webdriver"
    ? { version: j.value?.build?.version ?? "webdriver", ws: null }
    : { version: j.Browser ?? "cdp", ws: j.webSocketDebuggerUrl ?? null };
}

export async function launchEngine(
  id: string,
  options: { port?: number; timeoutMs?: number; extraArgs?: string[] } = {},
): Promise<RunningEngine> {
  const engine = getEngine(id);
  if (!engine.serve)
    throw new Error(
      `${id} n'expose ni CDP ni WebDriver (protocole ${engine.protocol})`,
    );
  const executable = resolveExecutable(engine);
  if (!executable)
    throw new Error(`${id} absent : \`chromium-bun engines install ${id}\``);
  const port = options.port ?? freePort();
  const profileDir = mkdtempSync(
    join(tmpdir(), `engine-${engine.id.replace(/[^\w-]/g, "_")}-`),
  );
  const proc = Bun.spawn(
    [
      executable,
      ...engine.serve(port, profileDir),
      ...(options.extraArgs ?? []),
    ],
    { stdin: "ignore", stdout: "ignore", stderr: "pipe" },
  );
  const base = `http://127.0.0.1:${port}`;
  const close = async () => {
    try {
      proc.kill();
      await proc.exited;
    } catch {}
    // Chrome laisse parfois des processus fils quelques instants : nettoyage au mieux.
    try {
      rmSync(profileDir, { recursive: true, force: true, maxRetries: 5 });
    } catch {}
  };

  const deadline = Date.now() + (options.timeoutMs ?? 20_000);
  let info: { version: string; ws: string | null } | null = null;
  while (!info) {
    if (proc.exitCode !== null) {
      const err = await new Response(proc.stderr).text();
      await close();
      throw new Error(
        `${id} s'est arrêté (code ${proc.exitCode}) : ${err.slice(-400)}`,
      );
    }
    info = await probe(engine, base).catch(() => null);
    if (!info) {
      if (Date.now() > deadline) {
        await close();
        throw new Error(`${id} injoignable sur ${base}`);
      }
      await Bun.sleep(150);
    }
  }
  const ready = info;
  return {
    engine,
    executable,
    port,
    endpoint: base,
    webSocketDebuggerUrl: ready.ws,
    version: ready.version,
    connect: () => {
      if (engine.protocol !== "cdp")
        throw new Error(`${id} parle ${engine.protocol}, pas CDP`);
      return ChromiumBunCdpClient.connect({ endpoint: ready.ws ?? base });
    },
    close,
    async [Symbol.asyncDispose]() {
      await close();
    },
  };
}
