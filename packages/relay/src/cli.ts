#!/usr/bin/env bun
// relay : pont Claude Code <-> Gemini et outils de la flotte.
//   relay serve                  HTTP (rpc, mcp, a2a, ws), TCP, TLS
//   relay browser [--headful]    Chrome du relais (profil dédié, CDP 127.0.0.1:RELAY_CDP_PORT)
//   relay login                  Chrome du relais visible : connexion Google une fois (saisie par l'utilisateur)
//   relay ask <prompt…>          question à Gemini (Antigravity, --web : gemini.google.com) ; --claude pour Claude Code headless
//   relay review <fichier>       revue Gemini notée /20 d'un fichier
//   relay inspect                relevé des sélecteurs Gemini (diagnostic)
//   relay acp                    agent ACP sur stdio
//   relay token                  affiche le jeton (pour claude mcp add)
//   relay mcp-add                enregistre le relais dans Claude Code (claude mcp add --transport http, portée utilisateur)
import { browserInfo, launchBrowser } from "./cdp.ts";
import { acp } from "./acp.ts";
import { claude, gemini } from "./backends.ts";
import { relayToken, serve } from "./server.ts";
import { toolByName } from "./tools.ts";

const [cmd, ...rest] = Bun.argv.slice(2);
const flag = (f: string) => rest.includes(f);
const words = rest.filter((w) => !w.startsWith("--")).join(" ");

switch (cmd) {
  case "serve":
    await serve();
    break;
  case "browser":
    await launchBrowser(!flag("--headful"));
    console.log(await browserInfo());
    break;
  case "login":
    await launchBrowser(false);
    console.log(
      "Chrome du relais ouvert sur gemini.google.com : se connecter, puis fermer la fenêtre et lancer `relay browser`.",
    );
    break;
  case "ask": {
    const a = flag("--claude")
      ? await claude(words)
      : await gemini(words, { engine: flag("--web") ? "web" : undefined });
    console.log(a.text);
    console.error(`[${a.engine} ${a.ms} ms${a.chat ? ` ${a.chat}` : ""}]`);
    break;
  }
  case "review": {
    const f = rest[0];
    if (!f) throw new Error("usage : relay review <fichier>");
    const a: any = await toolByName
      .get("gemini_review")!
      .run({ title: f, content: await Bun.file(f).text() });
    console.log(a.text);
    break;
  }
  case "recon":
    console.log(
      JSON.stringify(
        await (await import("./recon.ts")).recon(rest[0]),
        null,
        1,
      ),
    );
    break;
  case "inspect":
    await import("./inspect.ts");
    break;
  case "acp":
    await acp();
    break;
  case "token":
    console.log(await relayToken());
    break;
  case "mcp-add": {
    const t = await relayToken();
    const port = Bun.env.RELAY_PORT ?? "8790";
    const p = Bun.spawnSync([
      "claude",
      "mcp",
      "add",
      "--transport",
      "http",
      "--scope",
      "user",
      "relay",
      `http://127.0.0.1:${port}/mcp`,
      "--header",
      `Authorization: Bearer ${t}`,
    ]);
    console.log(p.stdout.toString() || p.stderr.toString());
    break;
  }
  default:
    console.error(
      "usage : relay serve | browser [--headful] | login | ask <prompt> [--claude|--web] | review <fichier> | inspect | recon [url] | acp | token | mcp-add",
    );
    process.exit(2);
}
