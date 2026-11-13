// SPDX-License-Identifier: Apache-2.0
/**
 * Vault locations. One root per host, never tracked by git:
 *
 * - Windows (the PC): `<src>/var/secrets` (`/*` allowlist of the root .gitignore keeps `var/` out).
 * - Linux: `$XDG_DATA_HOME/aphrody/vault` (inbox of age envelopes, applied state). The local layer
 *   stays where systemd looks for it: `/etc/credstore.encrypted` (root) or
 *   `~/.config/credstore.encrypted` (`systemd-creds --user`), so units read it with
 *   `LoadCredentialEncrypted=`.
 *
 * `APHRODY_VAULT_DIR` overrides the root, `ENV_KIT_SECRET_DIR` the local secret directory (tests).
 */

import { homedir } from "node:os";
import { join, resolve } from "node:path";

export type LocalBackend = "dpapi" | "systemd-creds" | "systemd-creds-user";

export const WIN = process.platform === "win32";

/** Repository root: SRC_ROOT, else three levels above this file (packages/vault/src). */
export function srcRoot(): string {
  return process.env.SRC_ROOT ?? resolve(import.meta.dir, "..", "..", "..");
}

export function vaultRoot(): string {
  if (process.env.APHRODY_VAULT_DIR) return process.env.APHRODY_VAULT_DIR;
  if (WIN) return join(srcRoot(), "var", "secrets");
  const base = process.env.XDG_DATA_HOME ?? join(homedir(), ".local", "share");
  return join(base, "aphrody", "vault");
}

/** Pre-vault location of the env-kit DPAPI store: still read (newest file wins), never written. */
export function legacyDpapiDir(): string {
  const base = process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local");
  return join(base, "aphrody", "secrets");
}

export const isRoot = (): boolean => process.getuid?.() === 0;

export interface LocalStoreInfo {
  backend: LocalBackend;
  dir: string;
  /** Read-only fallbacks, searched after `dir`. */
  legacy: string[];
}

export function localStore(): LocalStoreInfo {
  const override = process.env.ENV_KIT_SECRET_DIR;
  if (WIN) {
    return {
      backend: "dpapi",
      dir: override ?? join(vaultRoot(), "local"),
      legacy: override ? [] : [legacyDpapiDir()],
    };
  }
  if (process.platform === "linux") {
    if (isRoot()) return { backend: "systemd-creds", dir: override ?? "/etc/credstore.encrypted", legacy: [] };
    const base = process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config");
    return { backend: "systemd-creds-user", dir: override ?? join(base, "credstore.encrypted"), legacy: [] };
  }
  throw new Error(`vault: unsupported platform ${process.platform}`);
}

/** Repository files describing the vault (public data only: names, scopes, recipients). */
export const infraDir = (): string => join(srcRoot(), "infra", "vault");
