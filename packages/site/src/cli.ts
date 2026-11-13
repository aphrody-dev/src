#!/usr/bin/env bun
// aphrody-site build|serve [dir] : site.config.ts (default export of defineSite) + app/.
import { join, resolve } from "node:path";
import type { BuildOptions } from "./build.ts";
import { buildSite } from "./build.ts";
import type { ResolvedSite } from "./config.ts";
import { serveSite } from "./serve.ts";

const [cmd = "build", dir = "."] = Bun.argv
  .slice(2)
  .filter((a) => !a.startsWith("--"));
const root = resolve(dir);
const cfg = (await import(join(root, "site.config.ts"))) as {
  default: ResolvedSite;
  plugins?: BuildOptions["plugins"];
};
if (cmd === "build") {
  const r = await buildSite({ root, site: cfg.default, plugins: cfg.plugins });
  console.log(
    `[site] ${cfg.default.name}: ${r.pages.length} pages, wck ${r.wck?.score ?? "skip"}`,
  );
} else if (cmd === "serve") {
  const s = await serveSite({
    dist: join(root, "dist"),
    appDir: join(root, "app"),
  });
  console.log(`[site] http://127.0.0.1:${s.port}`);
} else {
  console.error("usage: aphrody-site build|serve [dir]");
  process.exit(2);
}
