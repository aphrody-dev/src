// Status registry: infra/upstream/status/<stack>.toml, keyed by patch slug. It records the upstream status
// of patches whose commit carries no trailer (several agents push to the fork's default branch at once;
// rewriting its history for a status change would make every one of them rebase). A value here wins
// over the commit trailer.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Meta, Status } from "./patch.ts";
import type { Patch, StackConfig } from "./stack.ts";

export type Entry = {
  status?: Status;
  note?: string;
  pr?: string;
  owner?: string;
  subject?: string;
  updated?: string;
};

export function registryFile(root: string, s: StackConfig): string {
  return join(root, "infra", "upstream", "status", `${s.name}.toml`);
}

export function loadRegistry(
  root: string,
  s: StackConfig,
): Record<string, Entry> {
  const f = registryFile(root, s);
  if (!existsSync(f)) return {};
  const doc = Bun.TOML.parse(readFileSync(f, "utf8")) as {
    patch?: Record<string, Entry>;
  };
  return doc.patch ?? {};
}

export function applyRegistry(
  root: string,
  s: StackConfig,
  patches: Patch[],
): Patch[] {
  const reg = loadRegistry(root, s);
  for (const p of patches) {
    const e = reg[p.slug];
    if (!e) continue;
    const meta: Meta = { ...p.meta };
    if (e.status) meta.status = e.status;
    if (e.note !== undefined) meta.statusNote = e.note;
    if (e.pr) meta.pr = e.pr;
    if (e.owner) meta.owner = e.owner;
    p.meta = meta;
  }
  return patches;
}

const q = (v: string) => JSON.stringify(v); // TOML basic strings accept JSON escapes for this content

export function saveEntry(
  root: string,
  s: StackConfig,
  slug: string,
  e: Entry,
): string {
  const reg = loadRegistry(root, s);
  reg[slug] = {
    ...reg[slug],
    ...e,
    updated: new Date().toISOString().slice(0, 10),
  };
  const keys = Object.keys(reg).sort();
  let out = `# Upstream status of the ${s.name} stack (${s.fork}), written by \`ay upstream mark\`.\n# Keys: patch slug (Electron's munge of the subject). Doc: docs/upstream/STRATEGY.md.\n`;
  for (const k of keys) {
    const v = reg[k]!;
    out += `\n[patch.${q(k)}]\n`;
    for (const f of [
      "subject",
      "status",
      "note",
      "pr",
      "owner",
      "updated",
    ] as const)
      if (v[f] !== undefined && v[f] !== "")
        out += `${f} = ${q(String(v[f]))}\n`;
  }
  const f = registryFile(root, s);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, out);
  return f;
}
