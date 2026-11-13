// Applique (idempotent) la configuration utilisateur décidée le 2026-11-12 : shell niubash, Coreutils Microsoft,
// Claude Code sans Git Bash ni PowerShell, MCP de pilotage du bureau et du navigateur, Windows Terminal.
// Usage (racine du dépôt) : bun packages/machine/src/apply-user.ts [--check]
// Shells (env partagé, configs, lock) : voir shells.ts et packages/machine/shells/.
// Preuves : https://github.com/aphrody-labs/nt/tree/main/docs/research (shell-replacement.md, claude-to-nt-stack.md)
// Ne touche à aucun réglage de sécurité (UAC, Defender, connecteurs d'agent) : voir README.md.
import { existsSync } from "node:fs";
import { shells } from "./shells.ts";
import { toolchain } from "./toolchain.ts";

const check = process.argv.includes("--check");
const LOCAL = process.env.LOCALAPPDATA!;
const HOME = process.env.USERPROFILE!;
const NB = `${LOCAL}\\Programs\\Niubash`;
const BASH = `${NB}\\winuxcmd\\bin\\bash.exe`;
const results: string[] = [];
const note = (ok: boolean, what: string) =>
  results.push(`${ok ? "ok  " : check ? "DIFF" : "set "} ${what}`);

const run = (argv: string[]) => {
  const r = Bun.spawnSync(argv, { stdout: "pipe", stderr: "pipe" });
  return {
    code: r.exitCode,
    out: r.stdout.toString(),
    err: r.stderr.toString(),
  };
};

// 1. Claude Code : settings.json env
const settingsPath = `${HOME}\\.claude\\settings.json`;
const settings = await Bun.file(settingsPath).json();
const wantEnv: Record<string, string> = {
  CLAUDE_CODE_GIT_BASH_PATH: BASH,
  CLAUDE_CODE_USE_POWERSHELL_TOOL: "0",
};
let dirty = false;
settings.env ??= {};
for (const [k, v] of Object.entries(wantEnv)) {
  const ok = settings.env[k] === v;
  note(ok, `settings.json env.${k}`);
  if (!ok) {
    settings.env[k] = v;
    dirty = true;
  }
}
if (dirty && !check) {
  await Bun.write(`${settingsPath}.bak-${Date.now()}`, Bun.file(settingsPath));
  await Bun.write(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
}

// 2. Claude Code : serveurs MCP (scope user)
const mcp: Record<string, string[]> = {
  "agent-desktop": [
    `${HOME}\\.local\\bin\\agent-desktop.exe`,
    "mcp",
    "--headed",
  ],
  "agent-browser": [`${HOME}\\.local\\bin\\agent-browser.exe`, "mcp"],
};
for (const [name, cmd] of Object.entries(mcp)) {
  const has = run(["claude", "mcp", "get", name]).code === 0;
  note(has, `claude mcp ${name}`);
  if (!has && !check)
    run(["claude", "mcp", "add", "--scope", "user", name, "--", ...cmd]);
}

// 3. PATH utilisateur : niubash/winuxcmd présent, Git Bash absent
const q = run(["reg", "query", "HKCU\\Environment", "/v", "Path"]).out;
const line = q.split(/\r?\n/).find((l) => /\bPath\b/.test(l)) ?? "";
const userPath = line.replace(/^\s*Path\s+REG_(EXPAND_)?SZ\s+/, "").trim();
const entries = userPath.split(";").filter(Boolean);
const wantIn = [NB, `${NB}\\winuxcmd\\usr\\bin`];
const wantOut = [
  "c:\\program files\\git\\bin",
  "c:\\program files\\git\\usr\\bin",
  "c:\\program files\\git\\cmd",
];
const lower = entries.map((e) => e.toLowerCase());
const pathOk =
  wantIn.every((w) => lower.includes(w.toLowerCase())) &&
  !wantOut.some((w) => lower.includes(w));
note(pathOk, "PATH utilisateur (niubash in, Git Bash out)");
if (!pathOk && !check) {
  const next = entries.filter((e) => !wantOut.includes(e.toLowerCase()));
  for (const w of wantIn)
    if (!next.some((e) => e.toLowerCase() === w.toLowerCase())) next.push(w);
  run([
    "reg",
    "export",
    "HKCU\\Environment",
    `${process.env.TEMP}\\HKCU-Environment-${Date.now()}.reg`,
    "/y",
  ]);
  run([
    "reg",
    "add",
    "HKCU\\Environment",
    "/v",
    "Path",
    "/t",
    "REG_EXPAND_SZ",
    "/d",
    next.join(";"),
    "/f",
  ]);
}

// 4. Windows Terminal : profil par défaut niubash
const wt = `${LOCAL}\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.json`;
if (existsSync(wt)) {
  const text = await Bun.file(wt).text();
  const def = text.match(/"defaultProfile"\s*:\s*"([^"]+)"/)?.[1];
  // settings.json de Terminal est du JSONC : on cherche niu.exe autour de l'occurrence "guid" du profil par défaut.
  const at =
    def === undefined
      ? -1
      : text.search(
          new RegExp(`"guid"\\s*:\\s*"${def.replace(/[{}]/g, "\\$&")}"`, "i"),
        );
  const isNiu =
    at >= 0 && /niu\.exe/i.test(text.slice(Math.max(0, at - 600), at + 600));
  note(isNiu, "Windows Terminal defaultProfile = niubash");
  if (!isNiu && !check)
    run([`${NB}\\niu.exe`, "--install-wt-profile", "--set-default"]);
  // Claude Code doit tourner en administrateur : le profil niubash s'ouvre élevé (sans invite si l'UAC
  // élève les admins sans demander, voir le contrôle plus bas).
  const cur = await Bun.file(wt).text();
  // Bloc du profil délimité par ses lignes "{" / "}" (le GUID contient lui-même des accolades).
  const nameAt = cur.search(/"name"\s*:\s*"Niubash"/);
  // Indentation libre (WT réécrit le fichier en 4 ou 6 espaces) : début = dernière ligne "{" avant le nom.
  const open =
    nameAt < 0
      ? null
      : [...cur.slice(0, nameAt).matchAll(/\n([ \t]*)\{[ \t]*\r?\n/g)].at(-1);
  const start = open?.index ?? -1;
  const end = open ? cur.indexOf(`\n${open[1]}}`, nameAt) : -1;
  const block = start >= 0 && end > start ? cur.slice(start, end) : "";
  // État lu sur le JSONC parsé (indépendant du formatage).
  const niu = (
    Bun.JSONC.parse(cur) as {
      profiles?: { list?: { name?: string; elevate?: boolean }[] };
    }
  ).profiles?.list?.find((p) => p.name === "Niubash");
  const elevated = niu?.elevate === true;
  note(elevated, "Windows Terminal profil Niubash elevate=true");
  if (!elevated && block && !check) {
    await Bun.write(`${wt}.bak-${Date.now()}`, cur);
    await Bun.write(
      wt,
      cur.replace(
        block,
        block.replace(
          /("commandline"\s*:\s*"[^"]*",)/,
          '$1\n        "elevate": true,',
        ),
      ),
    );
  }
}

// 5. Shells : env.toml -> env.{sh,ps1,nu,fish}, complétions ay, configs du manifeste, lock, HKCU (shells.ts).
results.push(...shells({ check }));

// 5b. Outillage agent : infra/agents/toolchain.toml (marketplaces, plugins, MCP, skills épinglées), voir toolchain.ts.
results.push(...(await toolchain({ check })));

// 6. Contrôles en lecture seule : élévation (ce script ne modifie ni l'UAC ni sudo).
const sudoOn = /Enabled\s+REG_DWORD\s+0x3/.test(
  run([
    "reg",
    "query",
    "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Sudo",
  ]).out,
);
results.push(
  `info sudo inline: ${sudoOn ? "oui" : "non (Paramètres > Système > Avancé > Activer sudo)"}`,
);
const cpba = run([
  "reg",
  "query",
  "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System",
  "/v",
  "ConsentPromptBehaviorAdmin",
]).out.match(/0x(\d+)/)?.[1];
results.push(
  `info UAC ConsentPromptBehaviorAdmin=${cpba ?? "?"} (0 = élévation admin sans invite)`,
);
const high = /S-1-16-12288/.test(
  run([
    `${process.env.SystemRoot}\\System32\\whoami.exe`,
    "/groups",
    "/fo",
    "csv",
  ]).out,
);
results.push(`info processus courant élevé: ${high ? "oui" : "non"}`);

console.log(results.join("\n"));
process.exit(check && results.some((r) => r.startsWith("DIFF")) ? 1 : 0);
