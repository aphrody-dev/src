// Applique (idempotent) la configuration utilisateur : shell niubash, Coreutils Microsoft,
// Claude Code sans Git Bash ni PowerShell, MCP de pilotage du bureau et du navigateur,
// Microsoft Intelligent Terminal (fallback Windows Terminal) avec themes @aphrody/design et agentProfiles.
// Usage (racine du depot) : bun packages/machine/src/apply-user.ts [--check]
import { existsSync } from "node:fs";
import { join } from "node:path";
import { shells } from "./shells.ts";
import { toolchain } from "./toolchain.ts";

const check = process.argv.includes("--check");
const LOCAL = process.env.LOCALAPPDATA!;
const HOME = process.env.USERPROFILE!;
const NB = `${LOCAL}\\Programs\\Niubash`;
const BASH = `${NB}\\winuxcmd\\bin\\bash.exe`;
const NIUBASH_GUID = "{a9c15d34-7b8e-4c1a-9f2e-6d8c3a5b7f01}";
const CLAUDE_AGENT_GUID = "{a9c15d34-7b8e-4c1a-9f2e-6d8c3a5b7f02}";
const AGY_AGENT_GUID = "{a9c15d34-7b8e-4c1a-9f2e-6d8c3a5b7f03}";

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

// 1. Claude Code : settings.json env (aucun fichier .bak)
const settingsPath = `${HOME}\\.claude\\settings.json`;
if (existsSync(settingsPath)) {
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
    await Bun.write(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  }
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

// 3. PATH utilisateur : niubash/winuxcmd present, Git Bash absent
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

// 4. Microsoft Intelligent Terminal (fallback Windows Terminal) :
//    profil par defaut Niubash eleve + schemas @aphrody/design (ansi.json) + agentProfiles
type TerminalScheme = Record<string, string> & { name: string };
type TerminalProfile = {
  guid?: string;
  name?: string;
  commandline?: string;
  startingDirectory?: string;
  elevate?: boolean;
  colorScheme?: string;
  [k: string]: unknown;
};
type TerminalConfig = {
  defaultProfile?: string;
  schemes?: TerminalScheme[];
  profiles?: {
    defaults?: Record<string, unknown>;
    list?: TerminalProfile[];
  };
  agentProfiles?: Array<{
    guid: string;
    name: string;
    provider: string;
    commandline: string;
  }>;
  [k: string]: unknown;
};

const ansiPath = join(
  import.meta.dir,
  "..",
  "..",
  "design",
  "tokens",
  "ansi.json",
);
let designSchemes: TerminalScheme[] = [];
if (existsSync(ansiPath)) {
  const ansi = (await Bun.file(ansiPath).json()) as {
    "windows-terminal"?: TerminalScheme[];
  };
  designSchemes = ansi["windows-terminal"] ?? [];
}

const terminalTargets = [
  {
    label: "IntelligentTerminal (MSIX)",
    path: `${LOCAL}\\Packages\\Microsoft.IntelligentTerminal_8wekyb3d8bbwe\\LocalState\\settings.json`,
    isIntelligent: true,
  },
  {
    label: "IntelligentTerminal (LocalAppData)",
    path: `${LOCAL}\\IntelligentTerminal\\settings.json`,
    isIntelligent: true,
  },
  {
    label: "WindowsTerminal",
    path: `${LOCAL}\\Packages\\Microsoft.WindowsTerminal_8wekyb3d8bbwe\\LocalState\\settings.json`,
    isIntelligent: false,
  },
];

const existingTargets = terminalTargets.filter((t) => existsSync(t.path));
const activeTargets = existingTargets.some((t) => t.isIntelligent)
  ? existingTargets
  : existingTargets.slice(0, 1);

for (const target of activeTargets) {
  const raw = await Bun.file(target.path).text();
  const cfg = Bun.JSONC.parse(raw) as TerminalConfig;
  cfg.profiles ??= {};
  cfg.profiles.list ??= [];
  cfg.schemes ??= [];

  let termDirty = false;
  let niu = cfg.profiles.list.find(
    (p) => p.name === "Niubash" || /niu\.exe/i.test(p.commandline ?? ""),
  );
  if (!niu) {
    niu = {
      guid: NIUBASH_GUID,
      name: "Niubash",
      commandline: `${NB}\\niu.exe`,
      startingDirectory: "C:\\src",
      elevate: true,
      colorScheme: "Aphrody M3 Dark",
    };
    cfg.profiles.list.unshift(niu);
    termDirty = true;
  }
  const hasNiuDefault =
    Boolean(niu.guid) &&
    cfg.defaultProfile?.toLowerCase() === niu.guid?.toLowerCase();
  note(hasNiuDefault, `${target.label} defaultProfile = Niubash`);
  if (!hasNiuDefault && niu.guid) {
    cfg.defaultProfile = niu.guid;
    termDirty = true;
  }

  const elevated = niu.elevate === true;
  note(elevated, `${target.label} Niubash elevate=true`);
  if (!elevated) {
    niu.elevate = true;
    termDirty = true;
  }

  if (designSchemes.length > 0) {
    let schemesOk = true;
    for (const scheme of designSchemes) {
      const idx = cfg.schemes.findIndex((s) => s.name === scheme.name);
      if (idx < 0) {
        schemesOk = false;
        cfg.schemes.push(scheme);
        termDirty = true;
      } else if (JSON.stringify(cfg.schemes[idx]) !== JSON.stringify(scheme)) {
        schemesOk = false;
        cfg.schemes[idx] = scheme;
        termDirty = true;
      }
    }
    note(schemesOk, `${target.label} @aphrody/design ANSI schemes`);
  }

  if (target.isIntelligent) {
    const desiredAgents = [
      {
        guid: CLAUDE_AGENT_GUID,
        name: "claude",
        provider: "anthropic",
        commandline: "claude",
      },
      {
        guid: AGY_AGENT_GUID,
        name: "antigravity",
        provider: "google",
        commandline: "agy",
      },
    ];
    cfg.agentProfiles ??= [];
    let agentsOk = true;
    for (const desired of desiredAgents) {
      const idx = cfg.agentProfiles.findIndex((a) => a.name === desired.name);
      if (idx < 0) {
        agentsOk = false;
        cfg.agentProfiles.push(desired);
        termDirty = true;
      } else if (
        JSON.stringify(cfg.agentProfiles[idx]) !== JSON.stringify(desired)
      ) {
        agentsOk = false;
        cfg.agentProfiles[idx] = desired;
        termDirty = true;
      }
    }
    note(agentsOk, `${target.label} agentProfiles (claude, antigravity)`);
  }

  if (termDirty && !check) {
    await Bun.write(target.path, `${JSON.stringify(cfg, null, 2)}\n`);
  }
}

// 5. Shells : env.toml -> env.{sh,ps1,nu,fish}, completions ay, configs du manifeste, lock, HKCU (shells.ts).
results.push(...shells({ check }));

// 5b. Outillage agent : infra/agents/toolchain.toml (marketplaces, plugins, MCP, skills epinglees), voir toolchain.ts.
results.push(...(await toolchain({ check })));

// 6. Controles en lecture seule : elevation (ce script ne modifie ni l'UAC ni sudo).
const sudoOn = /Enabled\s+REG_DWORD\s+0x3/.test(
  run([
    "reg",
    "query",
    "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Sudo",
  ]).out,
);
results.push(
  `info sudo inline: ${sudoOn ? "oui" : "non (Parametres > Systeme > Avance > Activer sudo)"}`,
);
const cpba = run([
  "reg",
  "query",
  "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System",
  "/v",
  "ConsentPromptBehaviorAdmin",
]).out.match(/0x(\d+)/)?.[1];
results.push(
  `info UAC ConsentPromptBehaviorAdmin=${cpba ?? "?"} (0 = elevation admin sans invite)`,
);
const high = /S-1-16-12288/.test(
  run([
    `${process.env.SystemRoot}\\System32\\whoami.exe`,
    "/groups",
    "/fo",
    "csv",
  ]).out,
);
results.push(`info processus courant eleve: ${high ? "oui" : "non"}`);

console.log(results.join("\n"));
process.exit(check && results.some((r) => r.startsWith("DIFF")) ? 1 : 0);
