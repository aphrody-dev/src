#!/usr/bin/env bun
// relay : pont Claude Code <-> Gemini et outils de la flotte.
//   relay serve                  HTTP (rpc, mcp, a2a, ws), TCP, TLS
//   relay browser [--headful]    Chrome du relais (profil dédié, CDP 127.0.0.1:RELAY_CDP_PORT)
//   relay login                  Chrome du relais visible : connexion Google une fois (saisie par l'utilisateur)
//   relay ask <prompt…>          question à Gemini (Antigravity, --web : gemini.google.com) ; --claude pour Claude Code headless
//   relay review <fichier>       revue Gemini notée /20 d'un fichier
//   relay inspect                relevé des sélecteurs Gemini (diagnostic)
//   relay acp                    agent ACP sur stdio
//   relay mcp-stdio              même serveur MCP que POST /mcp, en stdio (JSON-RPC délimité par lignes)
//   relay token                  affiche le jeton (pour claude mcp add)
//   relay mcp-add [--bearer]     enregistre le relais dans Claude Code (portée utilisateur) : OAuth 2.1 (DCR + PKCE,
//                                approbation automatique en boucle locale, zéro clic) ; --bearer : jeton fixe en en-tête
//   relay approve <code> [--deny]  consent d'une demande OAuth en attente (code utilisateur RFC 8628 ou demande /authorize)
//   relay client add <nom> [--scope "mcp a2a"]  client confidentiel client_credentials ; secret écrit dans
//                                <relayHome>/clients/<nom>.json (0600), jamais affiché
import { browserInfo, launchBrowser } from "./cdp.ts";
import { acp } from "./acp.ts";
import { claude, gemini } from "./backends.ts";
import { dispatch, mcpRpc } from "./protocols.ts";
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
  case "mcp-stdio": {
    // UTF-8 décodé en flux (caractères coupés entre deux blocs) ; requêtes traitées en parallèle.
    const dec = new TextDecoder("utf-8");
    const pending = new Set<Promise<void>>();
    const send = (o: unknown) =>
      void process.stdout.write(`${JSON.stringify(o)}\n`);
    let buf = "";
    for await (const chunk of process.stdin) {
      buf += dec.decode(chunk, { stream: true });
      let i: number;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let body: unknown;
        try {
          body = JSON.parse(line);
        } catch {
          send({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: "Parse error" },
          });
          continue;
        }
        const p = dispatch(body, mcpRpc).then((out) => {
          if (out) send(out);
        });
        pending.add(p);
        p.finally(() => pending.delete(p));
      }
    }
    await Promise.all(pending);
    break;
  }
  case "token":
    console.log(await relayToken());
    break;
  case "mcp-add": {
    const port = Bun.env.RELAY_PORT ?? "8790";
    const args = [
      "claude",
      "mcp",
      "add",
      "--transport",
      "http",
      "--scope",
      "user",
      "relay",
      `http://127.0.0.1:${port}/mcp`,
    ];
    if (flag("--bearer"))
      args.push("--header", `Authorization: Bearer ${await relayToken()}`);
    const p = Bun.spawnSync(args);
    console.log(p.stdout.toString() || p.stderr.toString());
    break;
  }
  case "approve": {
    const port = Bun.env.RELAY_PORT ?? "8790";
    const r = await fetch(`http://127.0.0.1:${port}/oauth/approve`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${await relayToken()}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        user_code: rest[0] ?? "",
        request: rest[0] ?? "",
        decision: flag("--deny") ? "deny" : "allow",
      }),
    });
    console.log(r.ok ? "approuvé" : `refus : ${await r.text()}`);
    process.exit(r.ok ? 0 : 1);
  }
  case "client": {
    const name = rest[1];
    if (rest[0] !== "add" || !name || !/^[\w.-]+$/.test(name))
      throw new Error('usage : relay client add <nom> [--scope "mcp a2a"]');
    const port = Bun.env.RELAY_PORT ?? "8790";
    const i = rest.indexOf("--scope");
    const scope = i >= 0 ? rest[i + 1] : "mcp a2a";
    const r = await fetch(`http://127.0.0.1:${port}/oauth/register`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${await relayToken()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        client_name: name,
        grant_types: ["client_credentials"],
        token_endpoint_auth_method: "client_secret_basic",
        scope,
      }),
    });
    if (!r.ok) throw new Error(`enregistrement refusé : ${await r.text()}`);
    const { join } = await import("node:path");
    const { mkdirSync } = await import("node:fs");
    const { relayHome } = await import("./cdp.ts");
    const dir = join(relayHome(), "clients");
    mkdirSync(dir, { recursive: true });
    const f = join(dir, `${name}.json`);
    const j = (await r.json()) as { client_id: string };
    await Bun.write(
      f,
      JSON.stringify({
        ...j,
        token_endpoint: `http://127.0.0.1:${port}/oauth/token`,
      }),
    );
    if (process.platform !== "win32") Bun.spawnSync(["chmod", "600", f]);
    console.log(`client ${j.client_id} : identifiants dans ${f}`);
    break;
  }
  default:
    console.error(
      "usage : relay serve | browser [--headful] | login | ask <prompt> [--claude|--web] | review <fichier> | inspect | recon [url] | acp | mcp-stdio | token | mcp-add [--bearer] | approve <code> | client add <nom>",
    );
    process.exit(2);
}
