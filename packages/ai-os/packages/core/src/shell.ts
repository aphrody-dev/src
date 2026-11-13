// Native shell resolution, ported from the windows-native patches of our forks
// (OpenClaw OPENCLAW_EXEC_SHELL/OPENCLAW_BASH, Hermes HERMES_BASH + niubash candidate; see
// C:\src\docs\agents\WINDOWS-NATIVE-PORT.md @16eea3d). Never picks the System32 WSL bash stub.
import { existsSync } from "node:fs";
import { join } from "node:path";

export function resolveBash(env = Bun.env): string | undefined {
  const candidates = [
    env.AGENT_BASH,
    env.OPENCLAW_BASH,
    env.HERMES_BASH,
    process.platform === "win32" && env.LOCALAPPDATA ? join(env.LOCALAPPDATA, "Programs", "Niubash", "winuxcmd", "bin", "bash.exe") : undefined,
  ].filter(Boolean) as string[];
  for (const c of candidates) if (existsSync(c)) return c;
  const found = Bun.which("bash");
  if (found && !(process.platform === "win32" && /\\system32\\bash\.exe$/i.test(found))) return found;
  return undefined;
}
