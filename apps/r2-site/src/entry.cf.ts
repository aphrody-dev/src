// The only Workers entry of r2-site (apps/r2-site/wrangler/<host>.toml): serveStatic on the R2 binding
// itself, so ranges and conditional requests use R2's native onlyIf/range.
import type { R2Like } from "@aphrody/deploy/src/serve.ts";
import { handle } from "./app";

type Env = { BUCKET: R2Like } & Record<string, unknown>;

export default {
  fetch(req: Request, env: Env): Promise<Response> | Response {
    const vars = {
      get: (k: string) =>
        typeof env[k] === "string" ? (env[k] as string) : undefined,
    };
    return handle(req, env.BUCKET, vars, "cf");
  },
};
