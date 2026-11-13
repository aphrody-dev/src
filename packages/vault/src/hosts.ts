// SPDX-License-Identifier: Apache-2.0
/**
 * Hosts (infra/vault/hosts.toml: public age recipients, ssh targets), scope policy
 * (infra/vault/policy.toml) and the local registry (<vault>/registry.json: kind and scope per
 * secret, names only). `scopeOf()` is the single place that decides what may leave the PC.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { infraDir, vaultRoot } from "./paths.ts";
import { RESERVED } from "./crypto.ts";

export type Kind = "token" | "document" | "chrome-passwords" | "profile";
export const KINDS: Kind[] = ["token", "document", "chrome-passwords", "profile"];

export interface Host {
  name: string;
  os: "windows" | "linux";
  ssh: string[];
  /** Other ssh routes tried in order when a route fails to connect (exit 255). */
  fallback: string[][];
  recipient: string;
}

export interface Policy {
  defaults: Record<Kind, string[]>;
  scope: Record<string, string[]>;
  never: { names: string[]; kinds: string[] };
}

export interface RegistryEntry {
  kind: Kind;
  scope?: string[];
  updated: string;
}

const hostsFile = () => process.env.VAULT_HOSTS_FILE ?? join(infraDir(), "hosts.toml");
const policyFile = () => process.env.VAULT_POLICY_FILE ?? join(infraDir(), "policy.toml");
const registryFile = () => join(vaultRoot(), "registry.json");

export async function loadHosts(): Promise<Host[]> {
  const t = Bun.TOML.parse(await readFile(hostsFile(), "utf8")) as Record<string, Partial<Host>>;
  return Object.entries(t).map(([name, h]) => ({
    name,
    os: h.os ?? "linux",
    ssh: h.ssh ?? [name],
    fallback: h.fallback ?? [],
    recipient: h.recipient ?? "",
  }));
}

const q = (s: string) => JSON.stringify(s);

/** Rewrites one host's recipient in place (keeps comments and layout of hosts.toml). */
/** Drops a TOML table (and the comment lines just above it) from a file, keeping the rest verbatim. */
function dropTable(text: string, table: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let skip = false;
  for (const l of lines) {
    const sec = /^\[([^\]]+)\]\s*$/.exec(l);
    if (sec) {
      skip = sec[1] === table;
      if (skip) while (out.length && /^#/.test(out.at(-1)!)) out.pop();
    }
    if (!skip) out.push(l);
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

/** Removes a host from hosts.toml, from every scope of policy.toml and of the local registry. */
export async function forgetHost(host: string): Promise<{ policyScopes: number; registryScopes: number }> {
  if (host === "pc") throw new Error("the PC cannot be removed");
  await writeFile(hostsFile(), dropTable(await readFile(hostsFile(), "utf8"), host));
  let policyScopes = 0;
  const pol = (await readFile(policyFile(), "utf8")).split("\n").map((l) => {
    const m = /^(\s*[A-Za-z_][A-Za-z0-9_.-]*\s*=\s*)\[(.*)\](.*)$/.exec(l);
    if (!m || !new RegExp(`"${host}"`).test(m[2]!)) return l;
    policyScopes++;
    const kept = m[2]!.split(",").map((x) => x.trim()).filter((x) => x && x !== `"${host}"`);
    return `${m[1]}[${kept.join(", ")}]${m[3]}`;
  });
  await writeFile(policyFile(), pol.join("\n"));
  const reg = await loadRegistry();
  let registryScopes = 0;
  for (const e of Object.values(reg))
    if (e.scope?.includes(host)) {
      e.scope = e.scope.filter((h) => h !== host);
      registryScopes++;
    }
  await saveRegistry(reg);
  return { policyScopes, registryScopes };
}

export async function setRecipient(host: string, recipient: string): Promise<void> {
  const f = hostsFile();
  const lines = (await readFile(f, "utf8")).split("\n");
  let inHost = false;
  let done = false;
  for (let i = 0; i < lines.length; i++) {
    const sec = /^\[(.+)\]\s*$/.exec(lines[i]!);
    if (sec) inHost = sec[1] === host;
    else if (inHost && /^recipient\s*=/.test(lines[i]!)) {
      lines[i] = `recipient = ${q(recipient)}`;
      done = true;
    }
  }
  if (!done) throw new Error(`hosts.toml: host ${host} or its recipient line not found`);
  await writeFile(f, lines.join("\n"));
}

export async function loadPolicy(): Promise<Policy> {
  const t = Bun.TOML.parse(await readFile(policyFile(), "utf8")) as Partial<Policy>;
  return {
    defaults: { token: ["pc"], document: ["pc"], "chrome-passwords": ["pc"], profile: ["pc"], ...t.defaults },
    scope: t.scope ?? {},
    never: { names: t.never?.names ?? [], kinds: t.never?.kinds ?? [] },
  };
}

export async function loadRegistry(): Promise<Record<string, RegistryEntry>> {
  let text: string;
  try {
    text = await readFile(registryFile(), "utf8");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw e;
  }
  return JSON.parse(text); // a corrupt registry is an error, never "no scope"
}

export async function saveRegistry(r: Record<string, RegistryEntry>): Promise<void> {
  await mkdir(vaultRoot(), { recursive: true, mode: 0o700 });
  const tmp = `${registryFile()}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(r, null, 2), { mode: 0o600 });
  await rename(tmp, registryFile());
}

export async function register(name: string, kind: Kind, scope?: string[]): Promise<void> {
  const r = await loadRegistry();
  r[name] = { kind, ...(scope ? { scope } : r[name]?.scope ? { scope: r[name]!.scope } : {}), updated: new Date().toISOString() };
  await saveRegistry(r);
}

/** Hosts allowed to receive `name`. Reserved names and PC-only kinds never get a remote host. */
export function scopeOf(name: string, kind: Kind, policy: Policy, registry: Record<string, RegistryEntry>): string[] {
  const s = registry[name]?.scope ?? policy.scope[name] ?? policy.defaults[kind] ?? ["pc"];
  const local = RESERVED.has(name) || policy.never.names.includes(name) || policy.never.kinds.includes(kind);
  return local ? s.filter((h) => h === "pc") : [...new Set(s)];
}
