import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { buildGamescope } from "C:/src/apps/aphrody/src/gamescope/build.ts";
const dist = "C:/src/target/gamescope-local";
const emit = (rel: string, c: string | Uint8Array) => { const p = join(dist, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c); };
await buildGamescope("C:/src/apps/aphrody", dist, emit);
Bun.serve({ port: 3199, async fetch(req) {
  let p = new URL(req.url).pathname; if (p === "/gamescope") p = "/gamescope/index.html";
  const f = Bun.file(join(dist, p)); return (await f.exists()) ? new Response(f) : new Response("nf", { status: 404 });
}});
console.log("serving");
