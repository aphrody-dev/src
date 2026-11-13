// SPDX-License-Identifier: Apache-2.0
/** Paths relative to the repository root; no absolute path lives in source. */
import { homedir } from "node:os";
import { join, resolve } from "node:path";

// packages/chromium-bun/src -> repository root
export const REPO_ROOT = process.env.SRC_ROOT
  ? resolve(process.env.SRC_ROOT)
  : resolve(import.meta.dir, "..", "..", "..");

export const CHROMIUM_ROOT =
  process.env.CHROMIUM_ROOT ??
  join(REPO_ROOT, "third_party", "chromium", "src");

export const DEPOT_TOOLS_ROOT =
  process.env.DEPOT_TOOLS_ROOT ?? join(REPO_ROOT, "third_party", "depot_tools");

const EXE = process.platform === "win32" ? ".exe" : "";

/** Userland binary: PATH first, then ~/.local/bin. Null when absent. */
export function findExecutable(name: string): string | null {
  return (
    Bun.which(name) ??
    Bun.which(name, { PATH: join(homedir(), ".local", "bin") })
  );
}

/** Node binary vendored with Chromium for the current platform (may not exist). */
export function chromiumNodePath(): string {
  const sub =
    process.platform === "win32"
      ? ["win", "node.exe"]
      : ["linux", "node-linux-x64", "bin", "node"];
  return join(CHROMIUM_ROOT, "third_party", "node", ...sub);
}

export function chromiumBuildTool(name: "gn"): string {
  const dir = process.platform === "win32" ? "win" : "linux64";
  return join(CHROMIUM_ROOT, "buildtools", dir, `${name}${EXE}`);
}

export function depotTool(name: "ninja" | "siso"): string {
  return join(
    DEPOT_TOOLS_ROOT,
    process.platform === "win32" ? `${name}.bat` : name,
  );
}
