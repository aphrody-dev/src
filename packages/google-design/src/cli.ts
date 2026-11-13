#!/usr/bin/env bun
// `ay design <cmd>` (crates/ay, Route::Package("google-design")) :
//   lint|export|spec [file]   DESIGN.md (format google-labs-code/design.md, src/design-md) ; fichier par défaut :
//                             packages/design/DESIGN.md, le système de design unique du monorepo
//   stitch <cmd>              client Stitch absorbé (packages/ai-os/src/google/stitch, `ai-os stitch`)
//   push <projectId> [file]   téléverse le DESIGN.md dans un projet Stitch (upload_design_md)
//   autre                     gds (../cli.ts : plan, tokens, verify, hct, symbols, serve, ...)
import { join, resolve } from "node:path";
import { runDesignMd } from "./design-md/cli.ts";

const root = resolve(
  Bun.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", ".."),
);
export const DESIGN_SYSTEM = join(root, "packages", "design", "DESIGN.md");

const aiOs = (args: string[]) =>
  Bun.spawn(
    [
      process.execPath,
      join(root, "packages", "ai-os", "src", "cli.ts"),
      ...args,
    ],
    {
      stdio: ["inherit", "inherit", "inherit"],
      env: { ...process.env, SRC_ROOT: root },
    },
  ).exited;

const [cmd, ...rest] = Bun.argv.slice(2);
if (cmd === "lint" || cmd === "export" || cmd === "spec") {
  // Positionnels hors valeurs d'option (--format x, --prefix x) : aucun = système de design du monorepo.
  const positional = rest.filter(
    (a, i) =>
      !a.startsWith("-") && !/^--(format|prefix)$/.test(rest[i - 1] ?? ""),
  );
  const file = cmd !== "spec" && positional.length === 0 ? [DESIGN_SYSTEM] : [];
  process.exit(await runDesignMd([cmd, ...file, ...rest]));
} else if (cmd === "stitch") {
  process.exit(await aiOs(["stitch", ...rest]));
} else if (cmd === "push") {
  const [project, file] = rest;
  if (!project) {
    console.error("ay design push <projectId> [DESIGN.md]");
    process.exit(2);
  }
  process.exit(
    await aiOs(["stitch", "design-md", project, file ?? DESIGN_SYSTEM]),
  );
} else {
  await import("../cli.ts");
}
