# @aphrody/deploy: aphrody.app

First-party deployment platform of the monorepo (the role Vercel plays for its users, `docs/ALPHABET.md`), on Cloudflare Workers and R2. No `vercel.json`, no Vercel dependency.

## Model

- `projects.toml`: one entry per deployable project (path, bun build command, output, domains, watched paths, vault variable names).
- A deployment is immutable: `deploys/<project>/<sha>/` in R2 bucket `aphrody-dist`, with its record (`<sha>.json`) and build log (`<sha>.log`).
- Production is a pointer (`deploys/<project>/_state.json`). Promote and rollback move it; nothing is rebuilt or redeployed. The history of moves is kept.
- Previews: `https://<project>-<sha7>.aphrody.app` (route `*.aphrody.app/*`, wildcard DNS). Production: the project domains. `aphrody.com` is served by the `apps/aphrody` Worker from the same pointer; `/api/*`, `/g/*`, `/search` still go to the Bun backend on prd.

## Flow

1. Push on `main` -> `.github/workflows/deploy.yml` -> `bun packages/deploy/src/cli.ts ci`: uploads the registry (projects, monorepo inventory, labs cards, Material 3 tokens from `assets/brand`), builds each affected project, uploads it through the API, records a GitHub deployment (environment `preview/<project>`, then `production/<project>`), moves production when `production = "auto"`.
2. `ay deploy <project>` dispatches the same workflow and waits for the preview (nothing is built on the workstation); `--local` builds here with the vault environment.
3. `ay deploy ls [project]`, `ay deploy logs <project> [sha]`, `ay deploy rollback <project> [sha]`, `ay deploy promote <project> <sha>`.

## Surfaces

- `https://aphrody.app/`: projects and their production and latest deployments (public).
- `https://aphrody.app/labs`: aphrody-labs cards (bets of `docs/ALPHABET.md`, public non-fork non-archived repositories with their GitHub description).
- `https://aphrody.app/dashboard`: Cloudflare Access application `aphrody-app-dashboard` (owner policy), JWT verified again by the Worker; deployments, logs, promote and rollback.
- API: `GET /api/projects`, `GET /api/projects/<p>/deployments` public; writes and logs need `Authorization: Bearer $APHRODY_DEPLOY_TOKEN` (vault, CI secret, Worker secret `DEPLOY_TOKEN`) or Access.

## Operations

- Worker: `wrangler.toml` (name `aphrody-deploy`); `bunx wrangler@4.161.0 deploy --dry-run` first. The token comes from `ay auth mint cloudflare --perm "Workers Scripts Write,Workers R2 Storage Write" -- ...`.
- Proof: `env-kit exec -- bun infra/cloudflare/proof.ts` (section 10: aphrody.com holding page, aphrody.app pages, Access on the dashboard, last push deployed with a live preview, rollback drill on `yolo`).
- Rollback of the platform itself: `wrangler rollback` on `aphrody-deploy`; of the apex move: re-attach `aphrody.app` and `www.aphrody.app` to the Worker `aphrody-app-site` (the former desktop shell, now on `shell.aphrody.app`).

## Vercel inventory (2026-11-13, API `api.vercel.com` with the vault `VERCEL_TOKEN`)

- Team `aphrody-dev` (plan hobby, account soft-blocked since 06/2026, `docs/infra/DEPLOY.md`): projects `rg-api` (root `apps/rg-bot`), `rg-website` (`apps/rg-website`, Next.js), `rg-discord` (`crates/aphrody-rg-server`). Zero deployments, no linked repository, no domain.
- Not migrated: the three belong to rosegriffon (`apps/rosegriffon`, a community product maintained by Aphrody, not an Aphrody product), their root directories do not exist in `src`, and there is nothing deployed to move. Same for `apps/shenron/vercel.json` (submodule, community product).
- In `src` itself nothing is served by Vercel. What remains is portability code: `packages/deploy/src/deploy-target.ts <app> vercel` (render only, refuses commercial apps) and `apps/r2-site/src/entry.vercel.ts` (adapter of `packages/runtime-adapter`).
