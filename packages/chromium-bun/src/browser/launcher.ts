// SPDX-License-Identifier: Apache-2.0
/**
 * Headless Chromium / Chrome Process Launcher & Agent-Browser Runner
 * Spawns isolated ephemeral headless Chromium processes with CDP WebSocket control.
 */
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  getEngine,
  resolveChromium,
  resolveExecutable,
} from "../engines/registry.ts";
import { ChromiumBunCdpClient } from "./cdp-client.ts";

export interface LaunchedChromiumInstance extends AsyncDisposable {
  readonly binaryPath: string;
  readonly wsEndpoint: string;
  readonly client: ChromiumBunCdpClient;
  readonly userDataDir: string;
  close(): Promise<void>;
}

/** Chromium local résolu par le registre des moteurs (engines/registry.ts), sans chemin codé en dur. */
export function findLocalChromiumBinary(): string | null {
  return resolveChromium();
}

export function findAgentBrowserBinary(): string | null {
  return resolveExecutable(getEngine("agent-browser"));
}

export async function launchHeadlessChromium(options?: {
  binaryPath?: string;
  extraArgs?: string[];
  timeoutMs?: number;
}): Promise<LaunchedChromiumInstance> {
  const binaryPath = options?.binaryPath ?? findLocalChromiumBinary();
  if (!binaryPath) {
    throw new Error(
      "No Chromium/Chrome binary found. Set CHROME_PATH or run `chromium-bun engines install chrome@stable`.",
    );
  }

  const userDataDir = mkdtempSync(join(tmpdir(), "chromium-bun-profile-"));
  const args = [
    binaryPath,
    "--headless=new",
    "--remote-debugging-port=0",
    "--remote-allow-origins=*",
    `--user-data-dir=${userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-sync",
    "--disable-extensions",
    "--disable-gpu-sandbox",
    "--window-size=1440,900",
    ...(options?.extraArgs ?? []),
    "about:blank",
  ];

  const proc = Bun.spawn(args, {
    stdout: "ignore",
    stderr: "pipe",
  });

  const timeoutMs = options?.timeoutMs ?? 15_000;
  const wsEndpoint = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      try {
        proc.kill();
      } catch {}
      reject(
        new Error(
          `Timed out waiting for Chromium DevTools endpoint (${timeoutMs}ms)`,
        ),
      );
    }, timeoutMs);

    void (async () => {
      const reader = proc.stderr.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const match = /DevTools listening on (ws:\/\/[^\r\n]+)/.exec(buf);
          if (match?.[1]) {
            clearTimeout(timer);
            reader.releaseLock();
            resolve(match[1].trim());
            return;
          }
        }
        clearTimeout(timer);
        reject(
          new Error(
            `Chromium exited before emitting DevTools WebSocket URL: ${buf.slice(0, 400)}`,
          ),
        );
      } catch (err) {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    })();
  });

  const client = await ChromiumBunCdpClient.connect({
    endpoint: wsEndpoint,
    timeoutMs,
  });
  const targetId = await client.createTarget("about:blank");
  await client.attachToTarget(targetId, true);

  let closed = false;
  const close = async () => {
    if (closed) return;
    closed = true;
    await client.close().catch(() => undefined);
    try {
      proc.kill();
      await proc.exited;
    } catch {}
    try {
      rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  };

  return {
    binaryPath,
    wsEndpoint,
    client,
    userDataDir,
    close,
    async [Symbol.asyncDispose]() {
      await close();
    },
  };
}
