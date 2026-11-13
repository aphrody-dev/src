// Dossier d'un paquet npm installé (linker hoisted à la racine du monorepo, ou node_modules local).
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";

export function moduleDir(name: string, from: string = import.meta.dir): string {
  for (let dir = from; ; dir = dirname(dir)) {
    const candidate = join(dir, "node_modules", name);
    if (existsSync(join(candidate, "package.json"))) return candidate;
    if (dirname(dir) === dir) throw new Error(`paquet introuvable : ${name}`);
  }
}
