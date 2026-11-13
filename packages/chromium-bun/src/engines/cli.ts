// SPDX-License-Identifier: Apache-2.0
// chromium-bun engines list | channels | path <id> | install [id...] | launch <id> [--port N]
import { DEFAULT_INSTALL, installEngines } from "./install.ts";
import { launchEngine } from "./launch.ts";
import {
  ENGINES,
  getEngine,
  readCftIndex,
  resolveExecutable,
} from "./registry.ts";

const CFT_JSON =
  "https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json";

export async function runEnginesCommand(args: string[]): Promise<number> {
  const [sub = "list", ...rest] = args;
  switch (sub) {
    case "list": {
      const rows = ENGINES.map((e) => ({
        id: e.id,
        protocol: e.protocol,
        language: e.language,
        install: e.install.via,
        third_party: e.thirdParty ?? "-",
        path: resolveExecutable(e) ?? "-",
      }));
      if (rest.includes("--json")) console.log(JSON.stringify(rows, null, 2));
      else for (const r of rows) console.log(Object.values(r).join("\t"));
      return 0;
    }
    case "channels": {
      // Versions des canaux Chrome for Testing (API JSON officielle) face au cache local.
      const live = (await (await fetch(CFT_JSON)).json()) as {
        channels: Record<string, { version: string; revision: string }>;
      };
      const local = readCftIndex();
      for (const [name, c] of Object.entries(live.channels)) {
        const ch = name.toLowerCase();
        const have = local[`chrome@${ch}`]?.buildId ?? "-";
        console.log(`${ch}\t${c.version}\tr${c.revision}\tlocal=${have}`);
      }
      return 0;
    }
    case "path": {
      const id = rest[0];
      if (!id) return usage();
      const p = resolveExecutable(getEngine(id));
      if (!p) return 1;
      console.log(p);
      return 0;
    }
    case "install": {
      const ids = rest.filter((a) => !a.startsWith("--"));
      const results = await installEngines(ids.length ? ids : DEFAULT_INSTALL);
      for (const r of results)
        console.log(
          `${r.ok ? "ok" : "ERREUR"}\t${r.id}\t${r.path ?? "-"}\t${r.detail}`,
        );
      return results.every((r) => r.ok) ? 0 : 1;
    }
    case "launch": {
      const id = rest[0];
      if (!id) return usage();
      const i = rest.indexOf("--port");
      const port = i >= 0 ? Number(rest[i + 1]) : undefined;
      const running = await launchEngine(id, { port });
      console.log(
        JSON.stringify({
          id,
          executable: running.executable,
          endpoint: running.endpoint,
          webSocketDebuggerUrl: running.webSocketDebuggerUrl,
          version: running.version,
        }),
      );
      if (rest.includes("--probe")) {
        await running.close();
        return 0;
      }
      // Reste au premier plan jusqu'à Ctrl+C.
      await new Promise<void>((resolve) =>
        process.once("SIGINT", () => resolve()),
      );
      await running.close();
      return 0;
    }
    default:
      return usage();
  }
}

function usage(): number {
  console.error(
    [
      "chromium-bun engines list [--json]          registre, protocole, installation, exécutable résolu",
      "chromium-bun engines channels               canaux Chrome for Testing (API JSON officielle) et cache local",
      "chromium-bun engines path <id>              exécutable du moteur (code 1 si absent)",
      "chromium-bun engines install [id...]        installation idempotente (ay up, CfT, Playwright, uv tool)",
      "chromium-bun engines launch <id> [--port N] [--probe]   expose CDP ou WebDriver sur 127.0.0.1",
    ].join("\n"),
  );
  return 2;
}
