// SPDX-License-Identifier: Apache-2.0
/**
 * Profil headless/cloud (profiles/headless.json) : arguments de lancement, politiques Linux,
 * configuration agent-browser et lanceur persistant (service fr1). Autonome : n'importe que le JSON,
 * pour être copié tel quel sur fr1 (`just chromium-headless-deploy`).
 *
 *   bun src/browser/profile.ts args [--os linux|win] [--gpu software|hardware|off]
 *   bun src/browser/profile.ts policies
 *   bun src/browser/profile.ts agent-browser-config [--write] [--os ..] [--gpu ..]
 *   bun src/browser/profile.ts launch --port 9222 --user-data-dir DIR [--bin PATH] [--gpu ..]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import profile from "../../profiles/headless.json" with { type: "json" };

export type ProfileOs = "linux" | "win";
export type GpuMode = "software" | "hardware" | "off";

export const HEADLESS_PROFILE = profile;

export function currentOs(): ProfileOs {
  return process.platform === "win32" ? "win" : "linux";
}

/** Arguments du profil pour un OS ; un seul --disable-features (dernière valeur gagnante, base/command_line.cc). */
export function profileArgs(
  os: ProfileOs = currentOs(),
  gpu: GpuMode = profile.gpu.default[os] as GpuMode,
): string[] {
  const args = profile.args
    .filter((a) => (a.os as string[]).includes(os))
    .map((a) => a.arg);
  args.push(...profile.gpu[gpu].map((a) => a.arg));
  args.push(
    `--disable-features=${profile.disableFeatures.map((f) => f.name).join(",")}`,
  );
  return args;
}

/** Arguments d'office d'agent-browser (base « avant » des mesures). */
export function agentBrowserBaselineArgs(): string[] {
  return [...profile.agentBrowserBaseline.common];
}

/** Base agent-browser puis profil, dans l'ordre où agent-browser les assemble (arguments utilisateur en dernier). */
export function agentBrowserEffectiveArgs(
  os: ProfileOs = currentOs(),
  gpu?: GpuMode,
): string[] {
  return [...agentBrowserBaselineArgs(), ...profileArgs(os, gpu)];
}

export function linuxPolicies(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(profile.policies.linux)
      .filter(([k]) => !k.startsWith("$"))
      .map(([k, v]) => [k, (v as { value: unknown }).value]),
  );
}

/** Arguments que l'on peut ajouter à agent-browser : ceux qu'il passe déjà sont omis (sauf --disable-features, à remplacer). */
export function agentBrowserExtraArgs(
  os: ProfileOs = currentOs(),
  gpu?: GpuMode,
): string[] {
  const base = new Set(agentBrowserBaselineArgs());
  return profileArgs(os, gpu).filter((a) => !base.has(a));
}

export function agentBrowserConfigPath(): string {
  return join(homedir(), ".agent-browser", "config.json");
}

/** Fusionne la clé `args` (chaîne, une ligne par argument) dans ~/.agent-browser/config.json. */
export function writeAgentBrowserConfig(
  os: ProfileOs = currentOs(),
  gpu?: GpuMode,
  path = agentBrowserConfigPath(),
): Record<string, unknown> {
  const current = existsSync(path)
    ? (JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>)
    : {};
  const next = { ...current, args: agentBrowserExtraArgs(os, gpu).join("\n") };
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

function defaultBinary(os: ProfileOs): string {
  return os === "win"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : "/usr/bin/google-chrome";
}

function flag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function launch(argv: string[]): Promise<never> {
  const os = (flag(argv, "--os") as ProfileOs) ?? currentOs();
  const gpu = flag(argv, "--gpu") as GpuMode | undefined;
  const port = flag(argv, "--port") ?? "9222";
  const udd = flag(argv, "--user-data-dir");
  if (!udd)
    throw new Error("--user-data-dir requis (CDP refuse le profil par défaut)");
  mkdirSync(udd, { recursive: true });
  const bin = flag(argv, "--bin") ?? defaultBinary(os);
  const proc = Bun.spawn(
    [
      bin,
      ...profileArgs(os, gpu),
      "--window-size=1280,720",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${udd}`,
      "about:blank",
    ],
    { stdout: "inherit", stderr: "inherit" },
  );
  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.on(sig, () => proc.kill(sig));
  }
  process.exit(await proc.exited);
}

if (import.meta.main) {
  const [cmd, ...argv] = process.argv.slice(2);
  const os = (flag(argv, "--os") as ProfileOs) ?? currentOs();
  const gpu = flag(argv, "--gpu") as GpuMode | undefined;
  switch (cmd) {
    case "args":
      console.log(profileArgs(os, gpu).join("\n"));
      break;
    case "policies":
      console.log(JSON.stringify(linuxPolicies(), null, 2));
      break;
    case "agent-browser-config":
      if (argv.includes("--write")) {
        writeAgentBrowserConfig(os, gpu);
        console.log(agentBrowserConfigPath());
      } else {
        console.log(
          JSON.stringify(
            { args: agentBrowserExtraArgs(os, gpu).join("\n") },
            null,
            2,
          ),
        );
      }
      break;
    case "launch":
      await launch(argv);
      break;
    default:
      console.error(
        "usage: profile.ts args|policies|agent-browser-config [--write]|launch --port N --user-data-dir DIR [--os linux|win] [--gpu software|hardware|off] [--bin PATH]",
      );
      process.exit(2);
  }
}
