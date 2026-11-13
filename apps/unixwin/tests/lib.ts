// Outils communs de la suite unixwin : binaires réels du poste (niubash installé, WinuxCmd embarqué, bash et
// coreutils de référence), lancés par Bun.spawn (octets bruts) ou par Bun Shell ($). Aucun binaire n'est simulé :
// un binaire absent rend le test « skip » avec la raison.
import { existsSync } from "node:fs";
import { join } from "node:path";

const win = process.platform === "win32";
const local = process.env.LOCALAPPDATA ?? "";
const niuRoot = join(local, "Programs", "Niubash");

const first = (...c: (string | null | undefined)[]) =>
  c.find((p) => p && existsSync(p)) ?? null;

export const NIU = first(
  process.env.NIU,
  win ? join(niuRoot, "niu.exe") : Bun.which("niu"),
);
export const WINUXCMD = first(
  process.env.WINUXCMD,
  win ? join(niuRoot, "winuxcmd", "usr", "bin", "winuxcmd.exe") : null,
  Bun.which("winuxcmd"),
);
// Oracle bash : GNU bash 5.3 (Git for Windows sous Windows, bash du système ailleurs).
export const BASH_REF = first(
  process.env.BASH_REF,
  win ? "C:\\Program Files\\Git\\bin\\bash.exe" : "/bin/bash",
);
// Coreutils de référence : uutils (Coreutils for Windows de Microsoft, binaire multicall).
export const UUTILS = first(process.env.UUTILS, Bun.which("coreutils"));

export type Run = { out: string; err: string; code: number; bytes: Uint8Array };

const decode = (b: Uint8Array) => new TextDecoder().decode(b);

// Environnement neutre et identique pour l'implémentation et l'oracle : locale UTF-8, pas de rc, pas de repli.
export const baseEnv = (extra: Record<string, string> = {}) => {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env))
    if (
      v !== undefined &&
      !/^(BASH_ENV|NIU_ENV|ENV|NIU_ROOT_FALLBACK|RUBASH_ROOT_FALLBACK|PROMPT_COMMAND)$/.test(
        k,
      )
    )
      env[k] = v;
  return { ...env, LC_ALL: "C.UTF-8", LANG: "C.UTF-8", ...extra };
};

export async function spawn(
  argv: string[],
  opts: {
    stdin?: string | Uint8Array;
    env?: Record<string, string>;
    cwd?: string;
  } = {},
): Promise<Run> {
  const p = Bun.spawn(argv, {
    stdin: opts.stdin === undefined ? "ignore" : new Response(opts.stdin),
    stdout: "pipe",
    stderr: "pipe",
    env: opts.env ?? baseEnv(),
    cwd: opts.cwd,
    windowsHide: true,
    timeout: 30_000,
  });
  const [o, e, code] = await Promise.all([
    new Response(p.stdout).bytes(),
    new Response(p.stderr).bytes(),
    p.exited,
  ]);
  return { out: decode(o), err: decode(e), code, bytes: o };
}

export const niu = (script: string, opts: Parameters<typeof spawn>[1] = {}) =>
  spawn([NIU!, "-c", script], opts);
export const bashRef = (
  script: string,
  opts: Parameters<typeof spawn>[1] = {},
) => spawn([BASH_REF!, "--norc", "--noprofile", "-c", script], opts);

