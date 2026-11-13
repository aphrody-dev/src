// Worker des webhooks de l'App GitHub « aphrody » (docs/infra/GITHUB-APP.md). Déploiement : `cf deploy --dry-run`
// puis `cf deploy` (jeton : ay auth mint cloudflare --perm "Workers Scripts Write,Queues Write"). Le secret
// GITHUB_WEBHOOK_SECRET est posé par `ay auth github-app create` (wrangler secret put, valeur sur stdin).
import { bindings, defineConfig } from "cf/config";

import * as entrypoint from "./src/index.ts" with { type: "cf-worker" };
import type { GithubEvent } from "./src/index.ts";

export default defineConfig({
  worker: {
    name: "aphrody-github",
    entrypoint,
    compatibilityDate: "2026-11-01",
    workersDev: true,
    env: {
      GITHUB_WEBHOOK_SECRET: bindings.secret(),
      EVENTS: bindings.queue<GithubEvent>({ name: "github-events" }),
    },
  },
});
