// Outils du relais, partagés par toutes les surfaces (JSON-RPC HTTP/WebSocket/TCP/TLS, MCP, A2A, ACP).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { claude, claudeWithTools, gemini, geminiCli } from "./backends.ts";

export type Tool = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  readOnly: boolean;
  run: (a: any) => Promise<unknown>;
};

const str = (description: string) => ({ type: "string", description });
const obj = (props: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties: props,
  required,
  additionalProperties: false,
});

/** Alias ssh de ~/.ssh/config (Host sans joker). */
export function sshHosts(): string[] {
  const f = join(homedir(), ".ssh", "config");
  if (!existsSync(f)) return [];
  const t = readFileSync(f, "utf8");
  return [
    ...new Set(
      [...t.matchAll(/^\s*Host\s+(.+)$/gim)]
        .flatMap((m) => m[1]!.split(/\s+/))
        .filter((h) => h && !/[*?!]/.test(h)),
    ),
  ].sort();
}

const ssh = async (host: string, cmd: string, timeout = 15000) => {
  if (!sshHosts().includes(host)) throw new Error(`hôte ssh inconnu : ${host}`);
  const p = Bun.spawn(
    ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=6", host, cmd],
    { stdout: "pipe", stderr: "pipe" },
  );
  const kill = setTimeout(() => p.kill(), timeout);
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  clearTimeout(kill);
  return { host, code, out: out.trim(), err: err.trim().slice(0, 500) };
};

// Services réseau suivis sur la flotte (tunnels, VPN, proxys) : lecture seule.
const NET_UNITS =
  "cloudflared* wg-quick@* tailscaled* caddy* nginx* haproxy* frpc* frps* openvpn* headscale* sshd*";

const skillDirs = () => [
  join(homedir(), ".claude", "skills"),
  ...(Bun.env.SRC_ROOT
    ? [
        join(Bun.env.SRC_ROOT, ".claude", "skills"),
        join(Bun.env.SRC_ROOT, ".agents", "skills"),
      ]
    : []),
];

export const TOOLS: Tool[] = [
  {
    name: "gemini_ask",
    description:
      "Ask Gemini (gemini.google.com in the relay browser, or Gemini CLI). Returns the answer and the chat URL.",
    inputSchema: obj(
      {
        prompt: str("Prompt"),
        chat: str("Existing chat id or URL (optional)"),
        engine: { type: "string", enum: ["web", "cli"] },
      },
      ["prompt"],
    ),
    readOnly: false,
    run: (a) => gemini(String(a.prompt), { chat: a.chat, engine: a.engine }),
  },
  {
    name: "gemini_review",
    description:
      "Submit a deliverable (file content or diff) to Gemini for a scored review (/20) with concrete defects.",
    inputSchema: obj(
      {
        title: str("What is reviewed"),
        content: str("File content or unified diff"),
        chat: str("Review chat id (optional)"),
      },
      ["title", "content"],
    ),
    readOnly: false,
    run: (a) =>
      gemini(
        `Revue technique stricte de « ${a.title} ». Donne une note /20, puis la liste des défauts vérifiables (fichier, ligne, correction). Pas de compliments.\n\n${String(a.content).slice(0, 120_000)}`,
        { chat: a.chat },
      ),
  },
  {
    name: "claude_ask",
    description:
      "Ask Claude Code headless (claude -p, plan mode: no edits), using the CLI's existing authentication.",
    inputSchema: obj(
      { prompt: str("Prompt"), model: str("Model alias (optional)") },
      ["prompt"],
    ),
    readOnly: false,
    run: (a) => claude(String(a.prompt), a.model),
  },
  {
    name: "workspace_ask",
    description:
      "Google Workspace through Claude Code's claude.ai connectors (Gmail, Calendar, Drive, Docs, Slides, Sheets): read, write plans and design documents. Only those connector tools are allowed.",
    inputSchema: obj(
      {
        prompt: str("Task for Gmail/Calendar/Drive/Docs/Slides/Sheets"),
        apps: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "Gmail",
              "Google_Calendar",
              "Google_Drive",
              "Google_Docs",
              "Google_Slides",
              "Google_Sheets",
            ],
          },
        },
      },
      ["prompt"],
    ),
    readOnly: false,
    run: (a) =>
      claudeWithTools(
        String(a.prompt),
        (
          (a.apps as string[] | undefined) ?? [
            "Gmail",
            "Google_Calendar",
            "Google_Drive",
            "Google_Docs",
            "Google_Slides",
            "Google_Sheets",
          ]
        ).map((x) => `mcp__claude_ai_${x}`),
      ),
  },
  {
    name: "gemini_cli_ask",
    description:
      "Ask Gemini through Gemini CLI headless (plan mode), without the browser.",
    inputSchema: obj({ prompt: str("Prompt") }, ["prompt"]),
    readOnly: false,
    run: (a) => geminiCli(String(a.prompt)),
  },
  {
    name: "fleet_status",
    description:
      "Read-only health of the VPS fleet (ssh aliases from ~/.ssh/config): uptime, failed units, tunnel/VPN/proxy units.",
    inputSchema: obj({ host: str("ssh alias (optional, all if omitted)") }),
    readOnly: true,
    run: async (a) =>
      Promise.all(
        (a.host ? [String(a.host)] : sshHosts()).map((h) =>
          ssh(
            h,
            `uptime; systemctl --failed --no-legend --plain | head -20; systemctl list-units --no-legend --plain --type=service ${NET_UNITS} | head -40`,
          ),
        ),
      ),
  },
  {
    name: "claude_inventory",
    description:
      "Read-only inventory of Claude Code: MCP servers (claude mcp list) and skills (SKILL.md names).",
    inputSchema: obj({}),
    readOnly: true,
    run: async () => {
      const p = Bun.spawn(["claude", "mcp", "list"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      const mcp = (await new Response(p.stdout).text()).trim();
      await p.exited;
      const skills = skillDirs().flatMap((d) =>
        existsSync(d)
          ? readdirSync(d)
              .filter((s) => existsSync(join(d, s, "SKILL.md")))
              .map((s) => `${d}:${s}`)
          : [],
      );
      return { mcp, skills };
    },
  },
  {
    name: "gcloud_accounts",
    description:
      "Read-only list of gcloud configurations and credentialed accounts.",
    inputSchema: obj({}),
    readOnly: true,
    run: async () => {
      const run = async (argv: string[]) => {
        const p = Bun.spawn(argv, { stdout: "pipe", stderr: "pipe" });
        const t = await new Response(p.stdout).text();
        await p.exited;
        return JSON.parse(t || "[]");
      };
      return {
        configurations: (
          await run([
            "gcloud",
            "config",
            "configurations",
            "list",
            "--format=json",
          ])
        ).map((c: any) => ({
          name: c.name,
          active: c.is_active,
          account: c.properties?.core?.account,
          project: c.properties?.core?.project,
        })),
        accounts: (await run(["gcloud", "auth", "list", "--format=json"])).map(
          (a: any) => ({ account: a.account, active: a.status === "ACTIVE" }),
        ),
      };
    },
  },
];

export const toolByName = new Map(TOOLS.map((t) => [t.name, t]));
