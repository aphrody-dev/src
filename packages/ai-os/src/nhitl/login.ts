// Connexions des CLI d'agents sans saisie par un agent : seul le clic final revient au propriétaire.
//   claude : le propriétaire lance `claude setup-token` sur le PC et copie le jeton ; il est lu au presse-papiers
//            (jamais affiché), rangé dans le coffre (env-kit secret set CLAUDE_CODE_OAUTH_TOKEN, DPAPI), presse-papiers
//            vidé, puis chiffré par `systemd-creds --user` chez l'utilisateur du runner de chaque hôte et vérifié.
//   codex  : `codex login --device-auth` dans une fenêtre tmux de l'hôte ; le code d'appareil (public) est écrit dans
//            <RELAY_HOME>/device-code.txt pour la page https://auth.openai.com/codex/device ouverte chez le propriétaire.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { relayHome } from "../relay/cdp";
import { srcRoot } from "../orch/fleet";

const TOKEN = /sk-ant-oat01-[A-Za-z0-9_-]{60,}/;
const DEVICE = /\b[A-Z0-9]{4}-[A-Z0-9]{4,5}\b/;

/** Cibles ssh des runners : prd par rebond fr2 (mesh WireGuard), fr2 direct. */
const TARGETS: Record<string, string[]> = {
  prd: ["-o", "HostKeyAlias=72.60.186.43", "-J", "fr2", "agent@10.200.77.5"],
  fr2: ["fr2"],
};
const ssh = (h: string, cmd: string, stdin?: string) =>
  Bun.spawnSync(
    ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=30", ...(TARGETS[h] ?? [h]), cmd],
    { stdin: stdin === undefined ? "ignore" : Buffer.from(stdin), timeout: 240_000 },
  );
const clip = () =>
  Bun.spawnSync(["pwsh", "-NoProfile", "-c", "Get-Clipboard -Raw"]).stdout.toString();

const PUSH =
  "umask 077; mkdir -p ~/.config/credstore.encrypted && systemd-creds --user --name=CLAUDE_CODE_OAUTH_TOKEN encrypt - ~/.config/credstore.encrypted/CLAUDE_CODE_OAUTH_TOKEN 2>/dev/null && " +
  "CLAUDE_CODE_OAUTH_TOKEN=$(systemd-creds --user decrypt --name=CLAUDE_CODE_OAUTH_TOKEN ~/.config/credstore.encrypted/CLAUDE_CODE_OAUTH_TOKEN - 2>/dev/null) " +
  "PATH=$HOME/.local/bin:/usr/local/bin:$PATH timeout 120 claude -p 'Reply with the single word: ok' --output-format text 2>&1 | head -c 200";

/** Lance `claude setup-token` dans un PTY bun (Bun.Terminal) : le navigateur s'ouvre, le propriétaire clique
 *  « Autoriser », le rappel localhost arrive au CLI et le jeton est extrait du flux sans être affiché ni écrit
 *  sur disque. Seules les lignes d'état (URL, erreurs) sont relayées, jeton masqué. */
async function captureSetupToken(waitMin: number): Promise<string> {
  const env = { ...process.env } as Record<string, string | undefined>;
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  let buf = "";
  const term = new Bun.Terminal({
    cols: 400,
    rows: 50,
    data(_t, d) {
      const t = new TextDecoder().decode(d).replace(/\x1b\[\d*C/g, " ").replace(/\x1b\][^\x07\x1b]*(\x07|\x1b\\)/g, "").replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
      buf += t;
      if (/press enter/i.test(t)) term.write("\r");
      for (const l of t.split(/\r?\n/)) {
        const x = l.replace(/sk-ant-[A-Za-z0-9_-]+/g, "[secret]").trim();
        if (x && /http|error|success|token|expire/i.test(x)) console.error(x.slice(0, 200));
      }
    },
  });
  const p = Bun.spawn(["claude", "setup-token"], { env, terminal: term });
  const timer = setTimeout(() => p.kill(), waitMin * 60_000);
  await p.exited;
  clearTimeout(timer);
  term.close();
  // Le CLI espace les mots par des déplacements de curseur (CSI n C, convertis en espaces) ; sans cela le mot suivant
  // (« Store ») se collait au jeton. Le jeton peut aussi être coupé par un retour à la ligne de mise en forme.
  return TOKEN.exec(buf)?.[0] ?? TOKEN.exec(buf.replace(/\s+/g, ""))?.[0] ?? "";
}

export async function login(cli: string, hosts = ["prd", "fr2"], waitMin = 30, fromClipboard = false) {
  if (cli === "claude") {
    const deadline = Date.now() + waitMin * 60_000;
    let tok = fromClipboard ? "" : await captureSetupToken(waitMin);
    while (fromClipboard && Date.now() < deadline && !tok) {
      tok = TOKEN.exec(clip())?.[0] ?? "";
      if (!tok) await Bun.sleep(3000);
    }
    if (!tok) return { cli, ok: false, error: "aucun jeton sk-ant-oat01 au presse-papiers" };
    Bun.spawnSync(["pwsh", "-NoProfile", "-c", "Set-Clipboard -Value $null"]);
    const set = Bun.spawnSync(
      ["bun", "run", "--cwd", join(srcRoot(), "packages/env-kit"), "src/cli.ts", "secret", "set", "CLAUDE_CODE_OAUTH_TOKEN"],
      { stdin: Buffer.from(tok) },
    );
    const out: Record<string, unknown> = { cli, vault: set.exitCode === 0 };
    for (const h of hosts) {
      const r = ssh(h, PUSH, tok);
      out[h] = { exit: r.exitCode, reply: r.stdout.toString().replace(TOKEN, "[secret]").trim().slice(0, 80) };
    }
    return out;
  }
  if (cli === "codex") {
    const out: Record<string, unknown> = { cli };
    for (const h of hosts) {
      const st = ssh(h, "PATH=$HOME/.local/bin:$HOME/.bun/bin:$PATH codex login status 2>&1 | head -1").stdout.toString().trim();
      if (/logged in/i.test(st) && !/not logged/i.test(st)) {
        out[h] = { ok: true, status: st };
        continue;
      }
      ssh(h, 'tmux kill-window -t agents:login-codex 2>/dev/null; tmux new-window -d -t agents -n login-codex "PATH=$HOME/.local/bin:$HOME/.bun/bin:$PATH codex login --device-auth; sleep 900"');
      await Bun.sleep(12_000);
      const pane = ssh(h, "tmux capture-pane -p -t agents:login-codex").stdout.toString();
      const code = DEVICE.exec(pane)?.[0];
      if (code) {
        mkdirSync(relayHome(), { recursive: true });
        writeFileSync(join(relayHome(), "device-code.txt"), `${code}\n`);
      }
      out[h] = { ok: false, device_code_file: code ? join(relayHome(), "device-code.txt") : null, page: "https://auth.openai.com/codex/device" };
    }
    return out;
  }
  throw new Error("usage : ai-os nhitl login claude|codex [--hosts prd,fr2]");
}
