# Pull requests better-auth/better-auth

Instantané du 2026-11-14.

## Fusionnées sur main depuis 2026-10-15 (302)

| PR | Titre | Auteur | Date | Labels |
|---|---|---|---|---|
| [#12610](https://github.com/better-auth/better-auth/pull/12610) | chore: release v1.7.24 | app/better-release | 2026-11-14 |  |
| [#12602](https://github.com/better-auth/better-auth/pull/12602) | docs: match the FAQ's `better-call` resolution to `better-auth` | gustavovalverde | 2026-11-14 | docs |
| [#12598](https://github.com/better-auth/better-auth/pull/12598) | fix(oauth-provider): drop the double slash from endpoint URLs | gustavovalverde | 2026-11-14 | identity |
| [#12593](https://github.com/better-auth/better-auth/pull/12593) | fix: delete expired verification rows at most once a minute | gustavovalverde | 2026-11-14 | database, docs |
| [#12544](https://github.com/better-auth/better-auth/pull/12544) | fix(memory-adapter): stop reusing stored serial ids after a delete | gustavovalverde | 2026-11-13 | database |
| [#12543](https://github.com/better-auth/better-auth/pull/12543) | fix(test): give each test file its own MongoDB database | gustavovalverde | 2026-11-13 |  |
| [#12530](https://github.com/better-auth/better-auth/pull/12530) | fix(kysely-adapter): save top-level JSON arrays on PostgreSQL | gustavovalverde | 2026-11-13 | database, devtools |
| [#12503](https://github.com/better-auth/better-auth/pull/12503) | fix: recognize APIError from another better-call copy in plugins | gustavovalverde | 2026-11-14 | core, oauth, credentials, identity, enterprise, payments, devtools, docs |
| [#12502](https://github.com/better-auth/better-auth/pull/12502) | fix(deps): share one `better-call` 1.4 copy across plugins | gustavovalverde | 2026-11-14 | core, credentials, identity, enterprise, payments, platform |
| [#12501](https://github.com/better-auth/better-auth/pull/12501) | fix(mcp): resolve requireMcpAuth signing keys without a self-request | gustavovalverde | 2026-11-13 | core, oauth, docs |
| [#12500](https://github.com/better-auth/better-auth/pull/12500) | fix(oauth-provider): warn when extensions set the same discovery key | gustavovalverde | 2026-11-13 | identity, docs |
| [#12499](https://github.com/better-auth/better-auth/pull/12499) | fix(oauth-provider): verify PKCE and DPoP before consuming a code | gustavovalverde | 2026-11-13 | identity, docs |
| [#12498](https://github.com/better-auth/better-auth/pull/12498) | docs(oauth-provider): say requireActiveAccessToken skips DPoP checks | gustavovalverde | 2026-11-14 | identity, docs |
| [#12497](https://github.com/better-auth/better-auth/pull/12497) | ci: validate docs sidebar icons against versioned docs | bytaesu | 2026-11-12 | docs, devops |
| [#12496](https://github.com/better-auth/better-auth/pull/12496) | docs(ciba): add sidebar icon | bytaesu | 2026-11-12 | docs |
| [#12495](https://github.com/better-auth/better-auth/pull/12495) | docs: update sentinel header docs to match current behavior | jonathansamines | 2026-11-12 | docs |
| [#12493](https://github.com/better-auth/better-auth/pull/12493) | chore: release v1.7.23 | app/better-release | 2026-11-13 |  |
| [#12490](https://github.com/better-auth/better-auth/pull/12490) | fix(electron): find the auth callback anywhere in launch arguments | bytaesu | 2026-11-12 | platform |
| [#12480](https://github.com/better-auth/better-auth/pull/12480) | docs: correct schema validation, telemetry, and DPoP challenge notes | gustavovalverde | 2026-11-13 | core, identity, docs |
| [#12477](https://github.com/better-auth/better-auth/pull/12477) | ci(release-tooling): require every entry in each release-note AI batch | gustavovalverde | 2026-11-12 |  |
| [#12476](https://github.com/better-auth/better-auth/pull/12476) | ci(release-tooling): keep release-note titles to the headline | gustavovalverde | 2026-11-12 |  |
| [#12475](https://github.com/better-auth/better-auth/pull/12475) | ci(release-tooling): keep one overlong rewrite from dropping a whole release-notes batch | gustavovalverde | 2026-11-12 |  |
| [#12474](https://github.com/better-auth/better-auth/pull/12474) | refactor: remove non-null assertions the type checker already proves | bytaesu | 2026-11-12 | core, database, organization, enterprise, skip-changeset |
| [#12473](https://github.com/better-auth/better-auth/pull/12473) | fix(stripe): warn when a subscription update has no local subscription | bytaesu | 2026-11-12 | payments |
| [#12472](https://github.com/better-auth/better-auth/pull/12472) | chore(deps): update dependencies | bytaesu | 2026-11-12 | devops, skip-changeset |
| [#12471](https://github.com/better-auth/better-auth/pull/12471) | test(generic-oauth): serve provider discovery locally in helper tests | bytaesu | 2026-11-12 | oauth, skip-changeset |
| [#12470](https://github.com/better-auth/better-auth/pull/12470) | chore(deps): update dependencies | bytaesu | 2026-11-12 |  |
| [#12469](https://github.com/better-auth/better-auth/pull/12469) | test(smoke): wait for the anchored schema lookup before migrating | bytaesu | 2026-11-12 | devops, skip-changeset |
| [#12463](https://github.com/better-auth/better-auth/pull/12463) | chore: re-resolve and dedupe the lockfile with pnpm 12 | bytaesu | 2026-11-12 |  |
| [#12462](https://github.com/better-auth/better-auth/pull/12462) | fix(client): treat unknown connectivity as online | bytaesu | 2026-11-12 | core |
| [#12460](https://github.com/better-auth/better-auth/pull/12460) | chore: upgrade pnpm to 12.18.0 | bytaesu | 2026-11-12 | devops |
| [#12459](https://github.com/better-auth/better-auth/pull/12459) | fix(session): keep expired sessions out of the hook context on get-session | bytaesu | 2026-11-12 | core |
| [#12457](https://github.com/better-auth/better-auth/pull/12457) | refactor: share the deletion step across deleteUser and its callback | bytaesu | 2026-11-12 | core, skip-changeset |
| [#12451](https://github.com/better-auth/better-auth/pull/12451) | fix: keep verification consumes from hanging on Cloudflare Workers | bytaesu | 2026-11-11 | database, devops |
| [#12450](https://github.com/better-auth/better-auth/pull/12450) | refactor(oauth2): share parseStringBoolean across providers | bytaesu | 2026-11-11 | core, oauth, enterprise, skip-changeset |
| [#12448](https://github.com/better-auth/better-auth/pull/12448) | fix: start a module-scope auth instance cleanly on Cloudflare Workers | bytaesu | 2026-11-11 | core, database, devtools, docs, devops |
| [#12447](https://github.com/better-auth/better-auth/pull/12447) | fix(oauth-provider): answer failed DPoP requests with a DPoP challenge | gustavovalverde | 2026-11-11 | identity, docs |
| [#12446](https://github.com/better-auth/better-auth/pull/12446) | fix(oauth-provider): send WWW-Authenticate challenges on UserInfo 401s | gustavovalverde | 2026-11-11 | identity, docs |
| [#12445](https://github.com/better-auth/better-auth/pull/12445) | fix(oauth-provider): keep resource challenges valid and report invalid_token | gustavovalverde | 2026-11-11 | core, oauth, identity, docs |
| [#12435](https://github.com/better-auth/better-auth/pull/12435) | chore: release v1.7.22 | app/better-release | 2026-11-12 |  |
| [#12434](https://github.com/better-auth/better-auth/pull/12434) | docs: sync v1.8 documentation | app/better-release | 2026-11-12 |  |
| [#12432](https://github.com/better-auth/better-auth/pull/12432) | fix(core): reject introspected tokens that fail claim checks with 401 | gustavovalverde | 2026-11-11 | core, oauth |
| [#12428](https://github.com/better-auth/better-auth/pull/12428) | chore: surface e2e fixture failures and correct two docs examples | gustavovalverde | 2026-11-11 | docs, devops |
| [#12425](https://github.com/better-auth/better-auth/pull/12425) | fix(telemetry): report Cloudflare Workers as workerd | bytaesu | 2026-11-11 | core, devtools |
| [#12424](https://github.com/better-auth/better-auth/pull/12424) | fix(sso): extend the refreshed session's own SAML logout record | gustavovalverde | 2026-11-11 | enterprise |
| [#12421](https://github.com/better-auth/better-auth/pull/12421) | fix(sso): key SAML replay protection on the decoded assertion ID | gustavovalverde | 2026-11-11 | enterprise |
| [#12417](https://github.com/better-auth/better-auth/pull/12417) | fix(sso): keep SAML Single Logout working after session refresh | gustavovalverde | 2026-11-11 | enterprise |
| [#12415](https://github.com/better-auth/better-auth/pull/12415) | docs: say when trustedOrigins receives a request on auth.api calls | gustavovalverde | 2026-11-11 | docs |
| [#12414](https://github.com/better-auth/better-auth/pull/12414) | fix(core): let custom token auth hooks replace caller headers in any casing | gustavovalverde | 2026-11-11 | core, oauth |
| [#12413](https://github.com/better-auth/better-auth/pull/12413) | fix(scim): return 501 when the adapter has no native transaction | gustavovalverde | 2026-11-11 | enterprise, docs, devops |
| [#12409](https://github.com/better-auth/better-auth/pull/12409) | fix: await promises that were dropped or concatenated as strings | bytaesu | 2026-11-11 | identity, platform, devtools |
| [#12405](https://github.com/better-auth/better-auth/pull/12405) | docs: add a Cloudflare guide | bytaesu | 2026-11-11 | core, docs, skip-changeset |
| [#12404](https://github.com/better-auth/better-auth/pull/12404) | fix: keep Kysely out of split bundles that use plugin packages | bytaesu | 2026-11-11 | core, enterprise, payments, platform, devops |
| [#12403](https://github.com/better-auth/better-auth/pull/12403) | fix(siwe): stop exposing internal error messages in verify responses | bytaesu | 2026-11-10 | credentials |
| [#12402](https://github.com/better-auth/better-auth/pull/12402) | fix(core): keep null when coercing serial id where values | gustavovalverde | 2026-11-11 | core |
| [#12401](https://github.com/better-auth/better-auth/pull/12401) | fix(generic-oauth): send authorizationHeaders on token refresh | gustavovalverde | 2026-11-10 | core, oauth, docs |
| [#12395](https://github.com/better-auth/better-auth/pull/12395) | fix(generic-oauth, oauth-provider): stop sharing pending retries across requests | gustavovalverde | 2026-11-11 | oauth, identity, devops |
| [#12394](https://github.com/better-auth/better-auth/pull/12394) | docs: correct consent denial, SAML name, device client, and migrate changeset wording | gustavovalverde | 2026-11-11 | enterprise, docs |
| [#12393](https://github.com/better-auth/better-auth/pull/12393) | fix(demo): handle failed and processed lookups on the device approval page | gustavovalverde | 2026-11-11 | docs |
| [#12392](https://github.com/better-auth/better-auth/pull/12392) | fix(device-authorization): return request details to a concurrent lookup by the claiming user | gustavovalverde | 2026-11-11 | identity |
| [#12391](https://github.com/better-auth/better-auth/pull/12391) | fix(oauth-provider): report rejected post-logout redirect URIs as invalid_redirect_uri | gustavovalverde | 2026-11-11 | identity |
| [#12390](https://github.com/better-auth/better-auth/pull/12390) | fix(prisma-adapter): handle null unique filters in update and write a single row | gustavovalverde | 2026-11-11 | database |
| [#12389](https://github.com/better-auth/better-auth/pull/12389) | fix(oauth-provider): revoke in-flight access tokens on adapters without foreign keys | gustavovalverde | 2026-11-11 | identity |
| [#12388](https://github.com/better-auth/better-auth/pull/12388) | fix(passkey): accept exact trusted origins under a wildcard allowed host | gustavovalverde | 2026-11-11 | credentials, docs |
| [#12387](https://github.com/better-auth/better-auth/pull/12387) | docs(oauth-provider): describe resource client defaults that include the base path | gustavovalverde | 2026-11-10 | docs |
| [#12385](https://github.com/better-auth/better-auth/pull/12385) | fix(oauth-provider): revalidate the client and redirect URI before redirecting a consent denial | gustavovalverde | 2026-11-10 | identity, docs |
| [#12384](https://github.com/better-auth/better-auth/pull/12384) | chore: release v1.7.21 | app/better-release | 2026-11-11 |  |
| [#12379](https://github.com/better-auth/better-auth/pull/12379) | chore: release v1.7.20 | app/better-release | 2026-11-10 |  |
| [#12371](https://github.com/better-auth/better-auth/pull/12371) | ci(release-tooling): credit commit co-authors in release note contributors | bytaesu | 2026-11-10 | skip-changeset |
| [#12370](https://github.com/better-auth/better-auth/pull/12370) | test(e2e): measure Kysely in the minimal bundle from the esbuild metafile | bytaesu | 2026-11-09 | devops, skip-changeset |
| [#12369](https://github.com/better-auth/better-auth/pull/12369) | fix(oauth2): reject a refresh response without an access token | bytaesu | 2026-11-09 | core, oauth |
| [#12368](https://github.com/better-auth/better-auth/pull/12368) | fix(expo): stop logging provider config errors on every authorization proxy request | bytaesu | 2026-11-09 | platform |
| [#12366](https://github.com/better-auth/better-auth/pull/12366) | fix(siwe): create the user, wallet address and account atomically | bytaesu | 2026-11-09 | credentials |
| [#12365](https://github.com/better-auth/better-auth/pull/12365) | docs: document infra compatibility matrix | jonathansamines | 2026-11-09 | docs |
| [#12364](https://github.com/better-auth/better-auth/pull/12364) | docs: update dash endpoints reference | jonathansamines | 2026-11-09 | docs |
| [#12355](https://github.com/better-auth/better-auth/pull/12355) | test(drizzle-adapter): fix schema type-check timeouts under CI load | gustavovalverde | 2026-11-10 | database, skip-changeset |
| [#12354](https://github.com/better-auth/better-auth/pull/12354) | test(e2e): fix two intermittent failures in the SCIM demo spec | gustavovalverde | 2026-11-10 | devops |
| [#12353](https://github.com/better-auth/better-auth/pull/12353) | test(passkey): cover verify-registration with a revoked cached session | gustavovalverde | 2026-11-09 | credentials, skip-changeset |
| [#12340](https://github.com/better-auth/better-auth/pull/12340) | fix(username): avoid hanging social sign-up when a username is mapped | bytaesu | 2026-11-09 | credentials |
| [#12337](https://github.com/better-auth/better-auth/pull/12337) | fix(open-api): document query parameters of optional query schemas | bytaesu | 2026-11-09 | devtools |
| [#12336](https://github.com/better-auth/better-auth/pull/12336) | fix(client): honor method passed in second-argument fetch options | bytaesu | 2026-11-09 | core |
| [#12334](https://github.com/better-auth/better-auth/pull/12334) | fix(organization): keep the active organization when a delete hook rejects | bytaesu | 2026-11-11 | organization |
| [#12333](https://github.com/better-auth/better-auth/pull/12333) | fix(db): ignore references to app tables when resolving joins | bytaesu | 2026-11-12 | core, database |
| [#12332](https://github.com/better-auth/better-auth/pull/12332) | fix(organization): return `INVITATION_NOT_FOUND` code from get-invitation | bytaesu | 2026-11-09 | organization |
| [#12331](https://github.com/better-auth/better-auth/pull/12331) | fix(oauth2): stop logging a `TypeError` when `user.create.before` aborts sign-up | bytaesu | 2026-11-11 | oauth |
| [#12330](https://github.com/better-auth/better-auth/pull/12330) | fix(client): send a JSON body on deferred session refresh | bytaesu | 2026-11-11 | core |
| [#12328](https://github.com/better-auth/better-auth/pull/12328) | fix(oauth-provider): store client metadata as an object in json columns | bytaesu | 2026-11-09 | identity |
| [#12327](https://github.com/better-auth/better-auth/pull/12327) | fix(oauth-provider): reject unprefixed client secrets through the standard invalid_client response | bytaesu | 2026-11-09 | identity |
| [#12325](https://github.com/better-auth/better-auth/pull/12325) | fix(oauth-provider): allow oauth2Consent through auth.api without a Request | bytaesu | 2026-11-09 | identity |
| [#12324](https://github.com/better-auth/better-auth/pull/12324) | fix(client): skip session refresh listeners during SSR and keep manager teardown safe | bytaesu | 2026-11-12 | core |
| [#12323](https://github.com/better-auth/better-auth/pull/12323) | fix(session): never store the active-sessions list without an expiry | bytaesu | 2026-11-09 | database |
| [#12322](https://github.com/better-auth/better-auth/pull/12322) | fix(mcp): accept HTTP resources on .localhost subdomains | bytaesu | 2026-11-09 |  |
| [#12321](https://github.com/better-auth/better-auth/pull/12321) | fix(session): expire session cookies when revoking the current session or deleting the user with a token | bytaesu | 2026-11-12 | core |
| [#12320](https://github.com/better-auth/better-auth/pull/12320) | fix(oauth): keep database OAuth state valid during the DST fall-back hour | bytaesu | 2026-11-09 |  |
| [#12319](https://github.com/better-auth/better-auth/pull/12319) | fix(db): keep plugin schema overrides local to each plugin instance | bytaesu | 2026-11-09 | database |
| [#12318](https://github.com/better-auth/better-auth/pull/12318) | fix(organization): return an empty page from listMembers when no members match | bytaesu | 2026-11-09 | organization |
| [#12317](https://github.com/better-auth/better-auth/pull/12317) | fix(core): stop printing raw fallback join errors with console.error | bytaesu | 2026-11-09 | core |
| [#12313](https://github.com/better-auth/better-auth/pull/12313) | docs: add @mailkite/better-auth-inbox to community plugins | bucabay | 2026-11-09 | docs |
| [#12309](https://github.com/better-auth/better-auth/pull/12309) | fix(sso): apply the default SAML clock skew to samlify's assertion window | gustavovalverde | 2026-11-10 | enterprise |
| [#12308](https://github.com/better-auth/better-auth/pull/12308) | chore(deps): bump anthropics/claude-code-action from 1.0.262 to 1.0.266 in the github-actions group | app/dependabot | 2026-11-08 | dependencies, devops |
| [#12306](https://github.com/better-auth/better-auth/pull/12306) | docs(device-authorization): clarify client validation behavior | bytaesu | 2026-11-08 | docs |
| [#12305](https://github.com/better-auth/better-auth/pull/12305) | fix(cli): show the cause of failures without stack traces or false success | bytaesu | 2026-11-08 | devtools |
| [#12304](https://github.com/better-auth/better-auth/pull/12304) | docs: use signOut in server action cookie examples | bytaesu | 2026-11-07 | docs |
| [#12303](https://github.com/better-auth/better-auth/pull/12303) | docs(oauth-provider): match the 1.7 docs to the code | gustavovalverde | 2026-11-10 | docs |
| [#12302](https://github.com/better-auth/better-auth/pull/12302) | docs: correct OAuth provider, SSO, and rate limit details | gustavovalverde | 2026-11-10 | docs |
| [#12299](https://github.com/better-auth/better-auth/pull/12299) | fix(mongo-adapter): create indexes for fields marked unique or index | ItzSudhan | 2026-11-11 | database, docs, devops |
| [#12291](https://github.com/better-auth/better-auth/pull/12291) | ci: run publishing and automation workflows only in better-auth/better-auth | bytaesu | 2026-11-06 | locked, devops |
| [#12290](https://github.com/better-auth/better-auth/pull/12290) | test(waku): align the fixture with the guide and cover action redirects | bytaesu | 2026-11-06 | locked, devops, skip-changeset |
| [#12287](https://github.com/better-auth/better-auth/pull/12287) | fix(cli): keep notices off stdout so results stay clean | bytaesu | 2026-11-06 | devtools, locked |
| [#12286](https://github.com/better-auth/better-auth/pull/12286) | fix(cli): fail fast instead of prompting in non-interactive runs | bytaesu | 2026-11-06 | devtools, docs, locked |
| [#12285](https://github.com/better-auth/better-auth/pull/12285) | chore: release v1.7.19 | app/better-release | 2026-11-10 |  |
| [#12280](https://github.com/better-auth/better-auth/pull/12280) | docs: replace "better-inbox" with "BYO (byo-oss)" in community plugins | stewartjarod | 2026-11-11 | docs |
| [#12275](https://github.com/better-auth/better-auth/pull/12275) | fix(cli): stop reporting canceled and failed runs as success | bytaesu | 2026-11-06 | devtools, locked |
| [#12274](https://github.com/better-auth/better-auth/pull/12274) | docs: add expand toggles to sidebar folders | bytaesu | 2026-11-06 | docs, locked |
| [#12273](https://github.com/better-auth/better-auth/pull/12273) | test(sveltekit): wait for hydration before submitting the form | bytaesu | 2026-11-06 | locked, devops, skip-changeset |
| [#12272](https://github.com/better-auth/better-auth/pull/12272) | test(e2e): share one server launcher across integration tests | bytaesu | 2026-11-06 | locked, devops, skip-changeset |
| [#12271](https://github.com/better-auth/better-auth/pull/12271) | docs(blog): move advisory links from titles to GHSA IDs | bytaesu | 2026-11-05 | docs, locked |
| [#12270](https://github.com/better-auth/better-auth/pull/12270) | chore: remove stale workspace changelogs | bytaesu | 2026-11-05 | docs, locked, devops, skip-changeset |
| [#12269](https://github.com/better-auth/better-auth/pull/12269) | test(waku): improve server lifecycle and cover API sign-out | bytaesu | 2026-11-05 | locked, devops |
| [#12266](https://github.com/better-auth/better-auth/pull/12266) | docs: sync v1.8 documentation | app/better-release | 2026-11-11 |  |
| [#12259](https://github.com/better-auth/better-auth/pull/12259) | fix(session): revoke sessions created while bulk revocation runs | gustavovalverde | 2026-11-05 | database, locked |
| [#12256](https://github.com/better-auth/better-auth/pull/12256) | docs(api-key): document defaultExpiresIn in seconds | lumpinif | 2026-11-09 | payments, docs, skip-changeset |
| [#12252](https://github.com/better-auth/better-auth/pull/12252) | chore: release v1.7.18 | app/better-release | 2026-11-05 | locked |
| [#12249](https://github.com/better-auth/better-auth/pull/12249) | fix(core): accept introspected tokens when verifyOptions.typ is set | gustavovalverde | 2026-11-04 | core, oauth, identity, docs, locked |
| [#12247](https://github.com/better-auth/better-auth/pull/12247) | docs: add @mockatoo/connect-better-auth to community plugins | tianhuil | 2026-11-06 | docs, locked |
| [#12246](https://github.com/better-auth/better-auth/pull/12246) | fix(device-authorization): return invalid_client for rejected client on /device/token | AryaKesharwani | 2026-11-07 | identity |
| [#12245](https://github.com/better-auth/better-auth/pull/12245) | docs: update sentinel and audit events docs | jonathansamines | 2026-11-04 | docs, locked |
| [#12244](https://github.com/better-auth/better-auth/pull/12244) | fix(test-utils): make testWith mysql work and run it in CI | gustavovalverde | 2026-11-04 | locked, devops |
| [#12243](https://github.com/better-auth/better-auth/pull/12243) | docs: add docs for sentinel headers feature | jonathansamines | 2026-11-04 | docs, locked |
| [#12237](https://github.com/better-auth/better-auth/pull/12237) | fix(oauth-provider): bind prelogin client lookup to the signed query's client_id | gustavovalverde | 2026-11-10 | identity, docs |
| [#12236](https://github.com/better-auth/better-auth/pull/12236) | docs(rate-limit): explain which IP headers are safe to list | gustavovalverde | 2026-11-04 | docs, locked |
| [#12235](https://github.com/better-auth/better-auth/pull/12235) | chore: remove jsdoc-only changeset | bytaesu | 2026-11-04 | locked, skip-changeset |
| [#12234](https://github.com/better-auth/better-auth/pull/12234) | fix(oauth-provider): resolve resource client defaults from the auth context | gustavovalverde | 2026-11-10 | identity, devops |
| [#12232](https://github.com/better-auth/better-auth/pull/12232) | docs: split OAuth provider and SSO pages into folders | gustavovalverde | 2026-11-04 | identity, docs, locked, skip-changeset |
| [#12230](https://github.com/better-auth/better-auth/pull/12230) | chore: bump react | bytaesu | 2026-11-04 | locked, skip-changeset |
| [#12229](https://github.com/better-auth/better-auth/pull/12229) | docs(prisma): pin Prisma 7 packages and link the Prisma 7 docs | ankur-arch | 2026-11-05 | docs, locked |
| [#12228](https://github.com/better-auth/better-auth/pull/12228) | fix(two-factor): honor trusted devices when the sign-in step runs on custom paths | bytaesu | 2026-11-04 | security, locked |
| [#12226](https://github.com/better-auth/better-auth/pull/12226) | docs(rate-limit): explain how Better Auth finds the client IP | gustavovalverde | 2026-11-04 | core, docs, locked |
| [#12225](https://github.com/better-auth/better-auth/pull/12225) | fix(passkey): keep base URL mode per auth instance | bytaesu | 2026-11-04 | credentials, locked |
| [#12221](https://github.com/better-auth/better-auth/pull/12221) | docs: add @typesql/better-auth to community adapters | ismailkarsli | 2026-11-04 | docs, locked |
| [#12220](https://github.com/better-auth/better-auth/pull/12220) | fix(kysely-adapter): run MySQL insert and read-back in one transaction | bytaesu | 2026-11-04 | database, locked, devops |
| [#12219](https://github.com/better-auth/better-auth/pull/12219) | fix(phone-number): treat empty phone number as missing | bytaesu | 2026-11-04 | credentials, locked |
| [#12218](https://github.com/better-auth/better-auth/pull/12218) | fix(expo): require state before setting oauth state cookie | bytaesu | 2026-11-04 | platform, locked |
| [#12217](https://github.com/better-auth/better-auth/pull/12217) | fix(origin-check): validate IPv4 octets in IP wildcard trusted origins | bytaesu | 2026-11-04 | core, locked |
| [#12216](https://github.com/better-auth/better-auth/pull/12216) | fix(device-authorization): reject revoked cached sessions on deny | bytaesu | 2026-11-04 | identity, locked |
| [#12215](https://github.com/better-auth/better-auth/pull/12215) | docs(blog): link advisories and group them by severity | Bekacru | 2026-11-04 | docs, locked |
| [#12214](https://github.com/better-auth/better-auth/pull/12214) | chore: release v1.7.17 | app/better-release | 2026-11-04 | locked |
| [#12212](https://github.com/better-auth/better-auth/pull/12212) | fix: keep sessions created by delete hooks during bulk revocation | bytaesu | 2026-11-04 | database, locked |
| [#12211](https://github.com/better-auth/better-auth/pull/12211) | fix(two-factor): accept API key sessions when verifying TOTP enrollment | bytaesu | 2026-11-04 | security, payments, locked |
| [#12209](https://github.com/better-auth/better-auth/pull/12209) | docs: sync v1.8 documentation | app/better-release | 2026-11-05 | locked |
| [#12208](https://github.com/better-auth/better-auth/pull/12208) | docs(blog): use callout for Vercel WAF note | Bekacru | 2026-11-03 | docs, locked |
| [#12206](https://github.com/better-auth/better-auth/pull/12206) | docs: sync v1.8 documentation | app/better-release | 2026-11-03 | locked |
| [#12203](https://github.com/better-auth/better-auth/pull/12203) | ci: deduplicate auth utils for Nuxt builds | bytaesu | 2026-11-03 | locked, skip-changeset |
| [#12200](https://github.com/better-auth/better-auth/pull/12200) | docs: update blog post | bytaesu | 2026-11-03 | docs, locked |
| [#12199](https://github.com/better-auth/better-auth/pull/12199) | chore: release v1.7.16 | app/better-release | 2026-11-03 | locked |
| [#12198](https://github.com/better-auth/better-auth/pull/12198) | fix: harden authentication flows | bytaesu | 2026-11-03 | core, database, oauth, credentials, identity, organization, security, payments, platform, docs, locked, devops |
| [#12189](https://github.com/better-auth/better-auth/pull/12189) | docs: add better-auth-trustware to community plugins | danielmerja | 2026-11-03 | docs, locked |
| [#12187](https://github.com/better-auth/better-auth/pull/12187) | docs: update waku guide for 1.0.0-rc.4, fix plugin example | nihalgonsalves | 2026-11-06 | docs, locked |
| [#12186](https://github.com/better-auth/better-auth/pull/12186) | test: add waku integration test (1.0.0-rc.4) | nihalgonsalves | 2026-11-04 | locked, devops |
| [#12181](https://github.com/better-auth/better-auth/pull/12181) | fix(cookies): clear the dont_remember marker on a remembered sign-in | aliamanatali | 2026-11-04 | core, locked |
| [#12179](https://github.com/better-auth/better-auth/pull/12179) | fix(generic-oauth): send discoveryHeaders to same-origin JWKS and keep them on the discovery origin | ghazy2001 | 2026-11-11 | oauth, docs |
| [#12176](https://github.com/better-auth/better-auth/pull/12176) | docs: sync v1.8 documentation | app/better-release | 2026-11-01 | locked |
| [#12172](https://github.com/better-auth/better-auth/pull/12172) | docs: sync v1.6 documentation | app/better-release | 2026-11-01 | locked |
| [#12169](https://github.com/better-auth/better-auth/pull/12169) | chore(deps): bump the github-actions group with 2 updates | app/dependabot | 2026-11-04 | dependencies, locked, devops, skip-changeset |
| [#12148](https://github.com/better-auth/better-auth/pull/12148) | fix(cli): stop init from hanging on database migration | bytaesu | 2026-10-30 | devtools, locked |
| [#12145](https://github.com/better-auth/better-auth/pull/12145) | fix(api): keep response headers set by before hooks | bytaesu | 2026-10-30 | core, locked |
| [#12142](https://github.com/better-auth/better-auth/pull/12142) | fix: accept constructor keys in strict JSON parsing | bytaesu | 2026-10-30 | core, oauth, organization, payments, locked |
| [#12138](https://github.com/better-auth/better-auth/pull/12138) | chore: fix spell check | bytaesu | 2026-10-30 | locked, skip-changeset |
| [#12130](https://github.com/better-auth/better-auth/pull/12130) | docs(blog): explain security release process | bytaesu | 2026-10-29 | docs, locked |
| [#12128](https://github.com/better-auth/better-auth/pull/12128) | docs: add better-auth-waitlist to community plugins | slargat | 2026-10-29 | docs, locked |
| [#12126](https://github.com/better-auth/better-auth/pull/12126) | fix(core): use ObjectId-shaped derived ids for Prisma ObjectId columns | hardikguptaofficialgit | 2026-11-11 | core, database, credentials, identity |
| [#12124](https://github.com/better-auth/better-auth/pull/12124) | docs: update better-auth-multi-tenant description | Weesofficial | 2026-10-29 | docs, locked |
| [#12118](https://github.com/better-auth/better-auth/pull/12118) | fix(cli): generate resource route handler for remix and react router v7 | bytaesu | 2026-10-30 | devtools, docs, locked |
| [#12116](https://github.com/better-auth/better-auth/pull/12116) | test(session): stabilize refresh and expiration tests | bytaesu | 2026-10-29 | core, locked, skip-changeset |
| [#12115](https://github.com/better-auth/better-auth/pull/12115) | docs(blog): list security release lines | bytaesu | 2026-10-29 | docs, locked |
| [#12113](https://github.com/better-auth/better-auth/pull/12113) | docs(blog): preannounce 2026-11-03 security release | bytaesu | 2026-10-29 | docs, locked |
| [#12111](https://github.com/better-auth/better-auth/pull/12111) | fix(cli): keep unparsable MCP config files when running `auth ai` | bytaesu | 2026-10-29 | devtools, locked |
| [#12110](https://github.com/better-auth/better-auth/pull/12110) | fix(cli): run login and logout directly instead of re-invoking the CLI | bytaesu | 2026-10-30 | devtools, locked |
| [#12109](https://github.com/better-auth/better-auth/pull/12109) | fix(client): keep vue ssr session fetch relative without baseURL | bytaesu | 2026-10-29 | core, locked |
| [#12108](https://github.com/better-auth/better-auth/pull/12108) | fix(generic-oauth): encode HubSpot access token as a path parameter | bytaesu | 2026-10-29 | oauth, locked |
| [#12107](https://github.com/better-auth/better-auth/pull/12107) | fix(api-key): accept parsed JSON from secondary storage | bytaesu | 2026-10-30 | payments, locked |
| [#12106](https://github.com/better-auth/better-auth/pull/12106) | fix(core): refuse redirects on built-in provider token and key requests | bytaesu | 2026-10-29 | core, oauth, locked |
| [#12105](https://github.com/better-auth/better-auth/pull/12105) | fix(stripe): reject non-string success query values | bytaesu | 2026-10-29 | payments, locked |
| [#12103](https://github.com/better-auth/better-auth/pull/12103) | fix(cimd): reject status lines Response cannot represent in the Node transport | bytaesu | 2026-10-29 | locked |
| [#12102](https://github.com/better-auth/better-auth/pull/12102) | fix(stripe): validate success callbackURL after session id replacement | bytaesu | 2026-10-29 | payments, locked |
| [#12101](https://github.com/better-auth/better-auth/pull/12101) | chore: release v1.7.15 | app/better-release | 2026-11-01 | locked |
| [#12100](https://github.com/better-auth/better-auth/pull/12100) | fix(admin): reject banned users when creating sessions outside an endpoint | bytaesu | 2026-10-29 | organization, locked |
| [#12099](https://github.com/better-auth/better-auth/pull/12099) | fix(admin): reject `id` in update-user data | bytaesu | 2026-10-29 | organization, locked |
| [#12098](https://github.com/better-auth/better-auth/pull/12098) | fix: report position instead of value in BETTER_AUTH_SECRETS errors | bytaesu | 2026-10-29 | core, locked |
| [#12097](https://github.com/better-auth/better-auth/pull/12097) | fix(username): honor validationOrder on sign-in and availability check | bytaesu | 2026-10-29 | credentials, locked |
| [#12090](https://github.com/better-auth/better-auth/pull/12090) | docs: add better-auth-loginllama to community plugins | joshghent | 2026-10-29 | docs, locked |
| [#12070](https://github.com/better-auth/better-auth/pull/12070) | fix(scim): handle Groups with more than 100 members | mallachari | 2026-11-11 | enterprise |
| [#12059](https://github.com/better-auth/better-auth/pull/12059) | docs: add custom field mapping for managed SCIM docs | jonathansamines | 2026-10-26 | docs, locked |
| [#12055](https://github.com/better-auth/better-auth/pull/12055) | chore: release v1.7.14 | app/better-release | 2026-10-26 | locked |
| [#12052](https://github.com/better-auth/better-auth/pull/12052) | fix(sign-up): send sign-up emails after the transaction commits | lakshya-dhariwal | 2026-11-11 | core, docs |
| [#12045](https://github.com/better-auth/better-auth/pull/12045) | fix(kakao): forward `loginHint` to the authorization URL | honuuk | 2026-10-26 | core, oauth, locked |
| [#12038](https://github.com/better-auth/better-auth/pull/12038) | docs: add better-auth-captcha to community plugins | aarmful | 2026-10-25 | docs, locked |
| [#12032](https://github.com/better-auth/better-auth/pull/12032) | chore(deps): bump `@playwright/test` to 1.64.1 | bytaesu | 2026-10-25 | locked, devops, skip-changeset |
| [#12031](https://github.com/better-auth/better-auth/pull/12031) | fix(two-factor): accept imported Base32 TOTP secrets | bytaesu | 2026-10-26 | security, docs, locked |
| [#12026](https://github.com/better-auth/better-auth/pull/12026) | chore(deps): bump anthropics/claude-code-action from 1.0.252 to 1.0.253 in the github-actions group | app/dependabot | 2026-10-25 | dependencies, locked, devops |
| [#12023](https://github.com/better-auth/better-auth/pull/12023) | chore(deps): bump nuxt, mariadb adapter and patched transitive deps | bytaesu | 2026-10-25 | locked, devops |
| [#12021](https://github.com/better-auth/better-auth/pull/12021) | docs: sync v1.8 documentation | app/better-release | 2026-10-28 | locked |
| [#12017](https://github.com/better-auth/better-auth/pull/12017) | chore(deps): bump zod from 4.5.4 to 4.6.6 in /demo/nextjs | app/dependabot | 2026-10-25 | docs, dependencies, locked |
| [#12016](https://github.com/better-auth/better-auth/pull/12016) | chore: bump `@better-auth/utils` and `@better-fetch/fetch` | bytaesu | 2026-10-25 | docs, locked |
| [#12015](https://github.com/better-auth/better-auth/pull/12015) | ci(zizmor): scope app tokens and ignore maintainer-only comment triggers | bytaesu | 2026-10-25 | locked, devops |
| [#12013](https://github.com/better-auth/better-auth/pull/12013) | test(stripe): fix type errors in tests | bytaesu | 2026-10-24 | payments, locked, skip-changeset |
| [#12012](https://github.com/better-auth/better-auth/pull/12012) | fix(demo): align stripe version | bytaesu | 2026-10-24 | docs, locked, skip-changeset |
| [#12008](https://github.com/better-auth/better-auth/pull/12008) | docs(organization): metadata in updateOrganization is not nullable | zeeshanqadir568 | 2026-10-24 | docs, locked |
| [#12007](https://github.com/better-auth/better-auth/pull/12007) | docs(organization): addMember requires userId | zeeshanqadir568 | 2026-10-24 | organization, docs, locked, skip-changeset |
| [#12006](https://github.com/better-auth/better-auth/pull/12006) | docs(two-factor): mark userId as required in viewBackupCodes | zeeshanqadir568 | 2026-10-24 | docs, locked |
| [#12002](https://github.com/better-auth/better-auth/pull/12002) | chore(deps): bump the github-actions group across 1 directory with 14 updates | app/dependabot | 2026-10-25 | dependencies, locked, devops |
| [#11998](https://github.com/better-auth/better-auth/pull/11998) | ci(dependabot): limit demo updates to security fixes | bytaesu | 2026-10-23 | locked, devops |
| [#11997](https://github.com/better-auth/better-auth/pull/11997) | refactor(cloudflare): standardize token endpoint auth options | bytaesu | 2026-10-23 | core, oauth, docs, locked |
| [#11994](https://github.com/better-auth/better-auth/pull/11994) | chore: release v1.7.13 | app/better-release | 2026-10-25 | locked |
| [#11985](https://github.com/better-auth/better-auth/pull/11985) | fix(build): bump tsdown to 0.23.1 | bytaesu | 2026-10-23 | locked |
| [#11984](https://github.com/better-auth/better-auth/pull/11984) | chore(deps): update dependencies | bytaesu | 2026-10-23 | credentials, docs, locked, devops, skip-changeset |
| [#11979](https://github.com/better-auth/better-auth/pull/11979) | docs: locate Typesense build output under Next.js route cache | bytaesu | 2026-10-21 | docs, locked |
| [#11976](https://github.com/better-auth/better-auth/pull/11976) | chore(deps): bump `next` to 16.4.2 | bytaesu | 2026-10-21 | docs, locked, skip-changeset |
| [#11969](https://github.com/better-auth/better-auth/pull/11969) | docs: add better-auth-multi-tenant to community plugins | Weesofficial | 2026-10-21 | docs, locked |
| [#11954](https://github.com/better-auth/better-auth/pull/11954) | feat(stripe): support Stripe SDK v23 | godwit-bo | 2026-10-24 | payments, docs, locked, devops |
| [#11948](https://github.com/better-auth/better-auth/pull/11948) | feat(vercel): support token endpoint authentication strategies | allenzhou101 | 2026-10-22 | core, oauth, docs, locked |
| [#11942](https://github.com/better-auth/better-auth/pull/11942) | docs: add tauri-plugin-better-auth to community plugins | laakal | 2026-10-29 | docs, locked |
| [#11938](https://github.com/better-auth/better-auth/pull/11938) | ci(release-tooling): name affected users in release note actions | bytaesu | 2026-10-20 | locked |
| [#11937](https://github.com/better-auth/better-auth/pull/11937) | ci(release-tooling): collect release note actions and share entry rules | bytaesu | 2026-10-20 | docs, locked |
| [#11936](https://github.com/better-auth/better-auth/pull/11936) | ci(release-tooling): update release note models and prompts | bytaesu | 2026-10-20 | locked, skip-changeset |
| [#11935](https://github.com/better-auth/better-auth/pull/11935) | fix(sso): verify OIDC ID tokens with the shared step | bytaesu | 2026-10-20 | core, oauth, enterprise, locked |
| [#11934](https://github.com/better-auth/better-auth/pull/11934) | fix(mcp): accept only OAuth access tokens in requireMcpAuth | bytaesu | 2026-10-20 | locked |
| [#11932](https://github.com/better-auth/better-auth/pull/11932) | chore: configure Anthropic OSS Scanner | bytaesu | 2026-10-20 | locked |
| [#11931](https://github.com/better-auth/better-auth/pull/11931) | fix(core): reject ID tokens when the provider has no client ID | bytaesu | 2026-10-20 | core, oauth, locked |
| [#11930](https://github.com/better-auth/better-auth/pull/11930) | fix(oauth-proxy): run the standard callback checks on proxied callbacks | bytaesu | 2026-10-20 | core, oauth, locked |
| [#11927](https://github.com/better-auth/better-auth/pull/11927) | chore: bump `better-call` | bytaesu | 2026-10-19 | locked |
| [#11926](https://github.com/better-auth/better-auth/pull/11926) | docs: add security contact email to `SECURITY.md` | bytaesu | 2026-10-19 | locked |
| [#11925](https://github.com/better-auth/better-auth/pull/11925) | fix(jwt): verify tokens with the stored key's algorithm | bytaesu | 2026-10-19 | core, docs, locked |
| [#11924](https://github.com/better-auth/better-auth/pull/11924) | fix(session): keep the cause of session lookup failures | bytaesu | 2026-10-19 | core, locked |
| [#11922](https://github.com/better-auth/better-auth/pull/11922) | chore: release v1.7.12 | app/better-release | 2026-10-20 | locked |
| [#11921](https://github.com/better-auth/better-auth/pull/11921) | chore: bump `better-call` | bytaesu | 2026-10-19 | locked |
| [#11920](https://github.com/better-auth/better-auth/pull/11920) | fix(oauth): restore Twitch and Paybin ID token handling | bytaesu | 2026-10-19 | core, oauth, docs, locked |
| [#11919](https://github.com/better-auth/better-auth/pull/11919) | fix(core): verify id_tokens with one shared policy | bytaesu | 2026-10-19 | core, oauth, locked |
| [#11918](https://github.com/better-auth/better-auth/pull/11918) | fix(core): accept undefined fields from mapProfileToUser under exactOptionalPropertyTypes | alpcanaydin | 2026-10-19 | core, oauth, locked, devops |
| [#11917](https://github.com/better-auth/better-auth/pull/11917) | feat(plugin): add @amank-root/better-auth-razorpay to community plugin | Amank-root | 2026-10-19 | docs, locked |
| [#11912](https://github.com/better-auth/better-auth/pull/11912) | fix(kysely-adapter): read only the schemas in use when introspecting Postgres | gustavovalverde | 2026-11-10 | database |
| [#11911](https://github.com/better-auth/better-auth/pull/11911) | fix(oauth-provider): return invalid_grant when reuse revokes an in-flight issuance | gustavovalverde | 2026-11-10 | identity |
| [#11907](https://github.com/better-auth/better-auth/pull/11907) | fix(core): accept undefined plugin init options under exactOptionalPropertyTypes | bytaesu | 2026-10-18 | core, locked, devops |
| [#11905](https://github.com/better-auth/better-auth/pull/11905) | docs: add better-auth-saml-idp to community plugins | mmcintosh | 2026-10-18 | docs, locked |
| [#11904](https://github.com/better-auth/better-auth/pull/11904) | fix(oauth-provider): support http deployments on private networks | gustavovalverde | 2026-11-10 | core, identity, docs, devops |
| [#11896](https://github.com/better-auth/better-auth/pull/11896) | docs: add @agentaos/better-auth to community plugins | PancheI | 2026-10-18 | docs, locked |
| [#11895](https://github.com/better-auth/better-auth/pull/11895) | docs: add ArcadeDB to community adapters | DevSnap | 2026-10-18 | docs, locked |
| [#11890](https://github.com/better-auth/better-auth/pull/11890) | docs: keep hono basePath inline code on one line | bytaesu | 2026-10-17 | docs, locked |
| [#11889](https://github.com/better-auth/better-auth/pull/11889) | refactor(expo): narrow native scheme in request hooks | bytaesu | 2026-10-17 | platform, locked, skip-changeset |
| [#11888](https://github.com/better-auth/better-auth/pull/11888) | docs: redesign docs OG image | bytaesu | 2026-10-17 | docs, locked |
| [#11885](https://github.com/better-auth/better-auth/pull/11885) | fix(e2e): prevent hangs during process tree cleanup | bytaesu | 2026-10-17 | locked, devops, skip-changeset |
| [#11884](https://github.com/better-auth/better-auth/pull/11884) | fix(oauth): verify Twitch and Paybin ID tokens | bytaesu | 2026-10-18 | core, oauth, docs, locked |
| [#11879](https://github.com/better-auth/better-auth/pull/11879) | docs: update SuperSend TX to Groundmail in the email provider list | Ktryberceo | 2026-10-16 | docs, locked |
| [#11878](https://github.com/better-auth/better-auth/pull/11878) | docs: sync v1.8 documentation | app/better-release | 2026-10-22 | locked |
| [#11877](https://github.com/better-auth/better-auth/pull/11877) | docs: remove beta wording from good-webhooks community plugin entry | pplytas | 2026-10-17 | docs, locked |
| [#11868](https://github.com/better-auth/better-auth/pull/11868) | fix(docs): match documentation sources to release versions | bytaesu | 2026-10-16 | docs, locked, devops, skip-changeset |
| [#11831](https://github.com/better-auth/better-auth/pull/11831) | docs(oauth-provider): explain how clients connect to organizations | gustavovalverde | 2026-10-15 | docs, locked |
| [#11830](https://github.com/better-auth/better-auth/pull/11830) | fix(oauth-provider): keep admin changes made during a CIMD refresh | gustavovalverde | 2026-10-15 | identity, locked |
| [#11829](https://github.com/better-auth/better-auth/pull/11829) | fix(docs): preserve sidebar scroll position on navigation | bytaesu | 2026-10-15 | docs, locked, skip-changeset |
| [#11827](https://github.com/better-auth/better-auth/pull/11827) | chore: release v1.7.11 | app/better-release | 2026-10-19 | locked |
| [#11822](https://github.com/better-auth/better-auth/pull/11822) | fix(better-auth): keep package subpaths in sync with build entries | gustavovalverde | 2026-10-15 | locked |
| [#11821](https://github.com/better-auth/better-auth/pull/11821) | fix(one-tap): stop calling prompt moment methods unsupported under FedCM | gustavovalverde | 2026-10-15 | oauth, docs, locked |
| [#11820](https://github.com/better-auth/better-auth/pull/11820) | fix(one-tap): apply plugin-level autoSelect and cancelOnTapOutside | gustavovalverde | 2026-10-15 | oauth, locked |
| [#11819](https://github.com/better-auth/better-auth/pull/11819) | fix(one-tap): apply the Google provider's mapProfileToUser and getUserInfo | gustavovalverde | 2026-10-15 | oauth, docs, locked |
| [#11817](https://github.com/better-auth/better-auth/pull/11817) | test(adapter): surface swallowed assertion failures in adapter factory tests | bytaesu | 2026-10-16 | locked, devops, skip-changeset |
| [#11816](https://github.com/better-auth/better-auth/pull/11816) | chore: use biome vcs ignore file and ci command | bytaesu | 2026-10-15 | locked, devops |
| [#11815](https://github.com/better-auth/better-auth/pull/11815) | fix(oauth-provider): keep approved resources refreshable after a narrowed device poll | gustavovalverde | 2026-10-15 | identity, locked |
| [#11811](https://github.com/better-auth/better-auth/pull/11811) | fix(oauth-provider): report an unknown client in a client assertion as not found | gustavovalverde | 2026-10-15 | identity, locked |
| [#11810](https://github.com/better-auth/better-auth/pull/11810) | fix(core): use a newer cached key set before joining a pending JWKS fetch | gustavovalverde | 2026-10-15 | core, oauth, locked, skip-changeset |
| [#11809](https://github.com/better-auth/better-auth/pull/11809) | fix(prisma-adapter): keep insensitive filters case-insensitive on keyed updates | gustavovalverde | 2026-11-10 | database |
| [#11807](https://github.com/better-auth/better-auth/pull/11807) | fix(prisma-adapter): match regex characters literally on MongoDB | gustavovalverde | 2026-11-10 | database |
| [#11806](https://github.com/better-auth/better-auth/pull/11806) | fix(prisma-adapter): match unset fields for eq null on MongoDB | gustavovalverde | 2026-11-10 | database, identity, devtools |
| [#11805](https://github.com/better-auth/better-auth/pull/11805) | fix(core): limit JWKS refetches for unknown key IDs | gustavovalverde | 2026-10-15 | core, oauth, locked |
| [#11804](https://github.com/better-auth/better-auth/pull/11804) | fix(oauth-provider): accept key-rotation assertions when baseURL ends in a slash | gustavovalverde | 2026-10-15 | identity, docs, locked, devops, skip-changeset |
| [#11801](https://github.com/better-auth/better-auth/pull/11801) | fix(oauth-provider): keep consent separate per reference | gustavovalverde | 2026-10-15 | database, identity, devtools, docs, locked |
| [#11799](https://github.com/better-auth/better-auth/pull/11799) | fix(oauth-provider): report an unknown client_id as not found | gustavovalverde | 2026-10-15 | identity, locked |
| [#11798](https://github.com/better-auth/better-auth/pull/11798) | fix(oauth-provider): infer native for http loopback redirect URIs | gustavovalverde | 2026-10-15 | identity, docs, locked |
| [#11797](https://github.com/better-auth/better-auth/pull/11797) | fix(oauth-provider): keep the supported grants from a dynamic registration | gustavovalverde | 2026-10-15 | identity, docs, locked |
| [#11795](https://github.com/better-auth/better-auth/pull/11795) | chore: release v1.7.10 | app/better-release | 2026-10-15 | locked |
| [#11794](https://github.com/better-auth/better-auth/pull/11794) | docs(basic-usage): use twoFactor.verifyTotp instead of verifyTOTP | zeeshanqadir568 | 2026-10-20 | docs, locked |
| [#11793](https://github.com/better-auth/better-auth/pull/11793) | test(oauth-provider): force both orderings of the revoke vs rotate race | gustavovalverde | 2026-10-15 | identity, locked, skip-changeset |
| [#11786](https://github.com/better-auth/better-auth/pull/11786) | fix(oauth-provider): build DPoP htu from the request path | gustavovalverde | 2026-10-15 | identity, docs, locked |
| [#11781](https://github.com/better-auth/better-auth/pull/11781) | fix(oauth-provider): refuse trusted-client changes with 400, not 500 | gustavovalverde | 2026-10-15 | identity, locked |
| [#11765](https://github.com/better-auth/better-auth/pull/11765) | refactor(demo): share demo base URL and MCP resource | gustavovalverde | 2026-10-15 | docs, locked |
| [#11761](https://github.com/better-auth/better-auth/pull/11761) | chore: release v1.7.9 | app/better-release | 2026-10-15 | locked |
| [#11745](https://github.com/better-auth/better-auth/pull/11745) | refactor(sso): remove the ACS lookup that always returned undefined | gustavovalverde | 2026-11-10 | enterprise, skip-changeset |
| [#11733](https://github.com/better-auth/better-auth/pull/11733) | ci: move StarSling jobs to Ubuntu 26.04 | app/starslingdev | 2026-10-17 | locked, devops |
| [#11724](https://github.com/better-auth/better-auth/pull/11724) | fix(oauth-provider): return 400 invalid_grant on PKCE verifier mismatch | drewsephski | 2026-10-15 | identity, locked |
| [#11716](https://github.com/better-auth/better-auth/pull/11716) | fix(core): prevent stalled schema validation from blocking requests | bytaesu | 2026-11-11 | core, docs, devops |
| [#11696](https://github.com/better-auth/better-auth/pull/11696) | fix(one-tap): add the better-auth/plugins/one-tap subpath export | drewsephski | 2026-10-15 | oauth, locked |
| [#11623](https://github.com/better-auth/better-auth/pull/11623) | perf(core): inline OpenTelemetry attribute constants | cpojer | 2026-10-17 | core, locked |
| [#11612](https://github.com/better-auth/better-auth/pull/11612) | fix(oauth2): report an unreachable JWKS as an error, not an invalid token | vhinayindia | 2026-10-15 | core, oauth, identity, locked |
| [#11596](https://github.com/better-auth/better-auth/pull/11596) | fix(oauth-provider): treat unverifiable JWT access tokens as invalid | mahoor | 2026-10-15 | identity, locked |
| [#11521](https://github.com/better-auth/better-auth/pull/11521) | fix(rate-limit): convert a string lastRequest before computing X-Retry-After | aryan1306 | 2026-10-15 | core, security, locked |
| [#11440](https://github.com/better-auth/better-auth/pull/11440) | docs(device-authorization): harden approval page examples | gustavovalverde | 2026-11-10 | identity, docs |
| [#11393](https://github.com/better-auth/better-auth/pull/11393) | fix(last-login-method): record Google One Tap sign-ins | breken-ai | 2026-10-15 | oauth, docs, locked |
| [#11176](https://github.com/better-auth/better-auth/pull/11176) | fix(oauth-provider): return invalid_client for an unknown client at the token endpoint | Bekacru | 2026-10-15 | identity, docs, locked |
| [#10881](https://github.com/better-auth/better-auth/pull/10881) | fix(oauth-provider): correct consent and continue OpenAPI response schemas | sahiljagtap08 | 2026-10-15 | identity, locked |
| [#10850](https://github.com/better-auth/better-auth/pull/10850) | perf(e2e): stop re-resolving drizzle-kit on every launch | app/starslingdev | 2026-10-19 | docs, locked, devops, skip-changeset |
| [#10719](https://github.com/better-auth/better-auth/pull/10719) | fix(db): recognize postgres int8 as a number type in migration diffs | rendermani | 2026-10-15 | database, locked |
| [#10207](https://github.com/better-auth/better-auth/pull/10207) | fix(expo): send origin for id token link social | noobnooc | 2026-10-16 | oauth, platform, locked |
| [#9882](https://github.com/better-auth/better-auth/pull/9882) | perf(e2e): skip redundant prisma schema pushes | app/starslingdev | 2026-10-19 | docs, locked, devops, skip-changeset |

## Ouvertes (300)

| PR | Titre | Auteur | Date | Labels |
|---|---|---|---|---|
| [#12614](https://github.com/better-auth/better-auth/pull/12614) | test(oauth-provider): cite RFC 3986 in the trailing-slash test | gustavovalverde | 2026-11-14 | identity, skip-changeset |
| [#12613](https://github.com/better-auth/better-auth/pull/12613) | fix(ci): flag namespaced instanceof APIError checks in the lint rule | gustavovalverde | 2026-11-14 | skip-changeset |
| [#12609](https://github.com/better-auth/better-auth/pull/12609) | test(oauth-provider): pin where authorize sends each error, and in order | gustavovalverde | 2026-11-14 | identity, skip-changeset |
| [#12607](https://github.com/better-auth/better-auth/pull/12607) | fix(core): fall back to expired JWKS cache on refetch failure (#12242) | ghazy2001 | 2026-11-14 | core, oauth |
| [#12606](https://github.com/better-auth/better-auth/pull/12606) | fix(oauth-provider)!: requireActiveAccessToken refuses DPoP-bound tokens | gustavovalverde | 2026-11-14 |  |
| [#12605](https://github.com/better-auth/better-auth/pull/12605) | fix(oauth-provider)!: report UserInfo errors as RFC 6750 describes | gustavovalverde | 2026-11-14 |  |
| [#12604](https://github.com/better-auth/better-auth/pull/12604) | chore: fix local spell check and docs validation | gustavovalverde | 2026-11-14 | docs |
| [#12603](https://github.com/better-auth/better-auth/pull/12603) | fix(oauth-provider): expose WWW-Authenticate on every challenge | gustavovalverde | 2026-11-14 | core, identity, docs |
| [#12600](https://github.com/better-auth/better-auth/pull/12600) | fix(oauth-provider): record a DPoP proof before consuming the code | gustavovalverde | 2026-11-14 |  |
| [#12599](https://github.com/better-auth/better-auth/pull/12599) | feat(oauth-provider)!: require the issuer as client assertion audience | gustavovalverde | 2026-11-14 |  |
| [#12597](https://github.com/better-auth/better-auth/pull/12597) | feat(mcp)!: check requireMcpAuth tokens against the provider's records | gustavovalverde | 2026-11-14 |  |
| [#12596](https://github.com/better-auth/better-auth/pull/12596) | feat(generic-oauth): request DPoP-bound tokens | gustavovalverde | 2026-11-14 |  |
| [#12595](https://github.com/better-auth/better-auth/pull/12595) | feat(oauth-provider)!: require an id on provider extensions | gustavovalverde | 2026-11-14 | identity, docs, devops |
| [#12594](https://github.com/better-auth/better-auth/pull/12594) | feat(oauth-provider): keep request_uri valid until the code is issued | gustavovalverde | 2026-11-14 |  |
| [#12592](https://github.com/better-auth/better-auth/pull/12592) | test(oauth-provider): share one DPoP proof helper across tests | gustavovalverde | 2026-11-14 | skip-changeset |
| [#12591](https://github.com/better-auth/better-auth/pull/12591) | feat(oauth-provider): issue RFC 9396 authorization details from grants | gustavovalverde | 2026-11-14 |  |
| [#12590](https://github.com/better-auth/better-auth/pull/12590) | refactor(core): rename isDpopNonceError to isDpopNonceChallenge | gustavovalverde | 2026-11-14 | skip-changeset |
| [#12589](https://github.com/better-auth/better-auth/pull/12589) | docs: describe when expired verification rows are deleted on next | gustavovalverde | 2026-11-14 |  |
| [#12588](https://github.com/better-auth/better-auth/pull/12588) | feat(oauth-provider): close the registered-client logout gaps | gustavovalverde | 2026-11-14 |  |
| [#12587](https://github.com/better-auth/better-auth/pull/12587) | fix(oauth-provider): record DPoP proofs in secondary storage | gustavovalverde | 2026-11-14 | core, oauth, identity, docs |
| [#12586](https://github.com/better-auth/better-auth/pull/12586) | fix(core): stop scanning every DPoP proof on each in-memory reservation | gustavovalverde | 2026-11-14 | core, oauth |
| [#12585](https://github.com/better-auth/better-auth/pull/12585) | fix(generic-oauth)!: check the discovered issuer against discoveryUrl | gustavovalverde | 2026-11-14 |  |
| [#12584](https://github.com/better-auth/better-auth/pull/12584) | feat(oauth-provider): present act and may_act actors by kind | gustavovalverde | 2026-11-14 | identity, docs |
| [#12583](https://github.com/better-auth/better-auth/pull/12583) | test(oauth-provider): match issueAuthorizationCode to /oauth2/authorize | gustavovalverde | 2026-11-14 | identity, skip-changeset |
| [#12582](https://github.com/better-auth/better-auth/pull/12582) | refactor(oauth-provider): share the PKCE S256 check | gustavovalverde | 2026-11-14 | skip-changeset |
| [#12581](https://github.com/better-auth/better-auth/pull/12581) | fix(oauth-provider): stop in-flight issuance on a revoked grant | gustavovalverde | 2026-11-14 |  |
| [#12580](https://github.com/better-auth/better-auth/pull/12580) | feat(core): pass the issuer and endpoint type to token auth hooks | gustavovalverde | 2026-11-14 |  |
| [#12579](https://github.com/better-auth/better-auth/pull/12579) | feat(oauth-provider): bring DPoP challenges in line with Bearer | gustavovalverde | 2026-11-14 |  |
| [#12578](https://github.com/better-auth/better-auth/pull/12578) | fix(oauth-provider): verify issued tokens with in-process signing keys | gustavovalverde | 2026-11-14 | identity, docs |
| [#12577](https://github.com/better-auth/better-auth/pull/12577) | fix(oauth-provider): merge encrypted subject claims under their own key | gustavovalverde | 2026-11-14 |  |
| [#12576](https://github.com/better-auth/better-auth/pull/12576) | feat(oauth-provider): satisfy prompt=login with an in-request sign-in | gustavovalverde | 2026-11-14 | identity, docs |
| [#12575](https://github.com/better-auth/better-auth/pull/12575) | fix(oauth-provider)!: ignore undefined access-token claims | gustavovalverde | 2026-11-14 |  |
| [#12574](https://github.com/better-auth/better-auth/pull/12574) | feat(oauth-provider): warn once when discovery ignores metadata | gustavovalverde | 2026-11-14 |  |
| [#12573](https://github.com/better-auth/better-auth/pull/12573) | test(oauth-provider): cover revoking with an APIError from another copy | gustavovalverde | 2026-11-14 | skip-changeset |
| [#12572](https://github.com/better-auth/better-auth/pull/12572) | fix(core): keep the authorization endpoint query in authorization URLs | gustavovalverde | 2026-11-14 | core, oauth |
| [#12571](https://github.com/better-auth/better-auth/pull/12571) | docs(oauth-provider): explain DPoP redirects, test cross-realm streams | gustavovalverde | 2026-11-14 | skip-changeset |
| [#12570](https://github.com/better-auth/better-auth/pull/12570) | docs: list the PAR client column with the 1.8 schema changes | gustavovalverde | 2026-11-14 |  |
| [#12566](https://github.com/better-auth/better-auth/pull/12566) | fix(rate-limit): sweep expired database rows when new keys are created | Faiziimam | 2026-11-14 | core, security |
| [#12563](https://github.com/better-auth/better-auth/pull/12563) | chore(deps): bump @sveltejs/kit from 2.70.2 to 3.1.1 | app/dependabot | 2026-11-14 | dependencies |
| [#12562](https://github.com/better-auth/better-auth/pull/12562) | feat(organization): add resolveMembership option to override caller membership | leon-wbr | 2026-11-13 | organization, docs |
| [#12561](https://github.com/better-auth/better-auth/pull/12561) | feat(client): support configurable client logger | falakahuja | 2026-11-13 | core, oauth, credentials, docs |
| [#12560](https://github.com/better-auth/better-auth/pull/12560) | chore: release v1.8.0-beta.10 | app/better-release | 2026-11-13 |  |
| [#12559](https://github.com/better-auth/better-auth/pull/12559) | feat(two-factor): add hashed storage mode for backup codes | x1mrdonut1x | 2026-11-13 | security, docs |
| [#12556](https://github.com/better-auth/better-auth/pull/12556) | docs: sync v1.8 documentation | app/better-release | 2026-11-13 |  |
| [#12555](https://github.com/better-auth/better-auth/pull/12555) | refactor(kysely-adapter): type encodeJSONArrays without any | gustavovalverde | 2026-11-13 | database, skip-changeset |
| [#12554](https://github.com/better-auth/better-auth/pull/12554) | perf(oauth-provider): resolve the device-code resource policy once | gustavovalverde | 2026-11-13 | identity, skip-changeset |
| [#12553](https://github.com/better-auth/better-auth/pull/12553) | fix(test): run every test instance cleanup when one fails | gustavovalverde | 2026-11-13 | skip-changeset |
| [#12552](https://github.com/better-auth/better-auth/pull/12552) | docs(oauth-provider): clarify which requests get a Bearer challenge | gustavovalverde | 2026-11-13 | docs, skip-changeset |
| [#12551](https://github.com/better-auth/better-auth/pull/12551) | ci(docs): sync versioned docs before validate:docs checks sidebar icons | gustavovalverde | 2026-11-13 | docs, skip-changeset |
| [#12550](https://github.com/better-auth/better-auth/pull/12550) | docs(sentinel): note that proxies can drop X-Sentinel-Request-Id | gustavovalverde | 2026-11-13 | docs, skip-changeset |
| [#12549](https://github.com/better-auth/better-auth/pull/12549) | test(memory-adapter): cite sequence semantics for serial-id tests | gustavovalverde | 2026-11-13 | database, skip-changeset |
| [#12547](https://github.com/better-auth/better-auth/pull/12547) | chore(deps): bump hono from 4.13.13 to 4.13.16 | app/dependabot | 2026-11-13 | dependencies, devops |
| [#12546](https://github.com/better-auth/better-auth/pull/12546) | chore(deps): bump hono from 4.13.13 to 4.13.16 in /e2e/integration/waku | app/dependabot | 2026-11-13 | dependencies, javascript, devops |
| [#12545](https://github.com/better-auth/better-auth/pull/12545) | feat(session): add session.maxPerUser to limit active sessions per user | karthickeyan-dev | 2026-11-13 | core, database, docs |
| [#12542](https://github.com/better-auth/better-auth/pull/12542) | docs: point the docs README license badge at LICENSE.md | abd1rahmane | 2026-11-13 | docs |
| [#12541](https://github.com/better-auth/better-auth/pull/12541) | docs: add better-auth-bachs to community plugins | grtsnx | 2026-11-13 | docs |
| [#12537](https://github.com/better-auth/better-auth/pull/12537) | fix(memory-adapter): group mixed AND and OR where clauses | uhyunpark | 2026-11-13 | database |
| [#12535](https://github.com/better-auth/better-auth/pull/12535) | docs(adapters): point the package READMEs and homepages at the current docs pages | abd1rahmane | 2026-11-13 | database |
| [#12534](https://github.com/better-auth/better-auth/pull/12534) | chore(deps): bump @hono/node-server from 2.1.5 to 2.1.6 | app/dependabot | 2026-11-13 | dependencies, devops |
| [#12533](https://github.com/better-auth/better-auth/pull/12533) | docs: update sms/email sdk documentation with up to date details | jonathansamines | 2026-11-12 | docs |
| [#12529](https://github.com/better-auth/better-auth/pull/12529) | feat(oauth-provider): bind follow-up requests to a client and DPoP key | gustavovalverde | 2026-11-12 |  |
| [#12492](https://github.com/better-auth/better-auth/pull/12492) | fix(client): report the session as pending only while it is unknown | bytaesu | 2026-11-12 | core, platform |
| [#12491](https://github.com/better-auth/better-auth/pull/12491) | feat(dbsc): add experimental DBSC plugin | bytaesu | 2026-11-12 |  |
| [#12486](https://github.com/better-auth/better-auth/pull/12486) | fix(oauth-proxy): preserve mapped user fields from mapProfileToUser (#12429) | ghazy2001 | 2026-11-12 | oauth |
| [#12485](https://github.com/better-auth/better-auth/pull/12485) | fix(api-key): skip in-process refListLocks on Cloudflare Workers (#12397) | ghazy2001 | 2026-11-12 | payments |
| [#12483](https://github.com/better-auth/better-auth/pull/12483) | feat(stripe): support billing portal configurations per plan | ashleyhull-versent | 2026-11-12 | payments, docs |
| [#12482](https://github.com/better-auth/better-auth/pull/12482) | fix(api-key): wrap expired-key cleanup in runInBackground across key routes | ghazy2001 | 2026-11-12 | payments |
| [#12481](https://github.com/better-auth/better-auth/pull/12481) | fix(cimd): remove client_uri from default originBoundFields | ghazy2001 | 2026-11-12 | docs |
| [#12461](https://github.com/better-auth/better-auth/pull/12461) | fix(cli): name the field when a reference points outside the schema | bytaesu | 2026-11-12 | core, database, devtools, docs |
| [#12455](https://github.com/better-auth/better-auth/pull/12455) | fix(account): keep the cause of token refresh failures | elisiopinheiro | 2026-11-11 | core |
| [#12442](https://github.com/better-auth/better-auth/pull/12442) | feat(open-api): add configuration option to enable/disable OpenAPI schema and reference endpoints | gabrielmar | 2026-11-11 | devtools, docs |
| [#12441](https://github.com/better-auth/better-auth/pull/12441) | feat(drizzle): implement casing helpers for schema generation and update documentation | gabrielmar | 2026-11-11 | database, devops |
| [#12430](https://github.com/better-auth/better-auth/pull/12430) | fix(oauth-proxy): relay mapProfileToUser fields in passthrough payload | umeraamir69 | 2026-11-11 | oauth |
| [#12427](https://github.com/better-auth/better-auth/pull/12427) | feat(oauth-provider): add requireOpenId option to require the openid scope on authorize requests | officialasishkumar | 2026-11-11 | identity, docs |
| [#12426](https://github.com/better-auth/better-auth/pull/12426) | ci: run affected checks on pull requests and the full suite in the merge queue | gustavovalverde | 2026-11-11 | devops, skip-changeset |
| [#12423](https://github.com/better-auth/better-auth/pull/12423) | feat(generic-oauth): pass the resolved tokenUrl to a custom getToken | Ishkirat-Singh | 2026-11-11 | oauth, docs |
| [#12422](https://github.com/better-auth/better-auth/pull/12422) | docs: add AgentiSend to the email provider list | fortuneflick | 2026-11-11 | docs |
| [#12420](https://github.com/better-auth/better-auth/pull/12420) | feat(dbsc): bind sessions to the device that signed in | gustavovalverde | 2026-11-11 | core, database, identity, organization, docs, devops |
| [#12411](https://github.com/better-auth/better-auth/pull/12411) | feat(admin): accept absolute banExpires date in banUser (#12344) | ghazy2001 | 2026-11-11 | organization, docs |
| [#12383](https://github.com/better-auth/better-auth/pull/12383) | perf(oauth-provider): skip unchanged CIMD metadata writes during revalidation (#12359) | ghazy2001 | 2026-11-10 | identity |
| [#12381](https://github.com/better-auth/better-auth/pull/12381) | fix(oauth-provider): inspect error.cause for CIMD registration unique collisions (#12357) | ghazy2001 | 2026-11-10 | identity |
| [#12380](https://github.com/better-auth/better-auth/pull/12380) | feat(admin): support absolute ban expiry | falakahuja | 2026-11-10 | organization, devtools, docs |
| [#12377](https://github.com/better-auth/better-auth/pull/12377) | fix(expo): preserve error and error_description from social sign-in redirect (#12348) | ghazy2001 | 2026-11-10 | platform |
| [#12372](https://github.com/better-auth/better-auth/pull/12372) | chore(deps): update dependencies | bytaesu | 2026-11-09 | docs, devops, skip-changeset |
| [#12367](https://github.com/better-auth/better-auth/pull/12367) | chore(docs): ignore "/login" when using middleware as auth.global.ts to affect every route | imLudwig | 2026-11-09 | docs |
| [#12360](https://github.com/better-auth/better-auth/pull/12360) | fix(expo): surface errorCallbackURL errors from the auth session | umeraamir69 | 2026-11-09 | platform |
| [#12356](https://github.com/better-auth/better-auth/pull/12356) | fix(oauth-provider): revoke offline_access grants on password reset and revoke-sessions | vjymisal0 | 2026-11-09 | identity, docs |
| [#12352](https://github.com/better-auth/better-auth/pull/12352) | fix(session): report status false when session deletion cannot be performed (#12301) | ghazy2001 | 2026-11-09 | core, database, organization |
| [#12351](https://github.com/better-auth/better-auth/pull/12351) | fix(device-authorization): inspect error.cause for unique constraint retries (#12314) | ghazy2001 | 2026-11-09 | identity |
| [#12347](https://github.com/better-auth/better-auth/pull/12347) | fix(core): type plugin session fields on internalAdapter.listSessions | aliamanatali | 2026-11-09 | core, database |
| [#12346](https://github.com/better-auth/better-auth/pull/12346) | fix(db): don't skip a delete when its lookup throws | aliamanatali | 2026-11-09 | core, database |
| [#12345](https://github.com/better-auth/better-auth/pull/12345) | fix(device-authorization): retry unique violations wrapped in an error cause | drewsephski | 2026-11-09 | identity |
| [#12329](https://github.com/better-auth/better-auth/pull/12329) | fix(oauth-provider): deliver back-channel logout and fetch client metadata on Cloudflare Workers | bytaesu | 2026-11-09 | identity |
| [#12326](https://github.com/better-auth/better-auth/pull/12326) | fix(oauth-provider): leave request bodies untouched on pages without a signed OAuth query | bytaesu | 2026-11-09 | identity |
| [#12316](https://github.com/better-auth/better-auth/pull/12316) | feat(kakao): support ID token sign-in | honuuk | 2026-11-08 | core, oauth, docs |
| [#12315](https://github.com/better-auth/better-auth/pull/12315) | fix(kakao): forward `codeVerifier` for PKCE | honuuk | 2026-11-08 | core, oauth |
| [#12311](https://github.com/better-auth/better-auth/pull/12311) | fix(last-login-method): record username and phone number sign-ins | AryaKesharwani | 2026-11-08 | docs |
| [#12310](https://github.com/better-auth/better-auth/pull/12310) | docs(kakao): clarify provider setup and common errors | khangb2306668 | 2026-11-08 | docs |
| [#12298](https://github.com/better-auth/better-auth/pull/12298) | fix(sign-up): return the same user shape for new and existing emails on MongoDB | ItzSudhan | 2026-11-07 | core |
| [#12289](https://github.com/better-auth/better-auth/pull/12289) | fix(generic-oauth): refresh ID token algorithms from discovery | 1AbdullahButt | 2026-11-06 | oauth |
| [#12288](https://github.com/better-auth/better-auth/pull/12288) | fix(oauth-provider): don't mint refreshed tokens for an ended session | onmax | 2026-11-06 | identity |
| [#12283](https://github.com/better-auth/better-auth/pull/12283) | fix(organization): reject accept when the inviter left the org | umeraamir69 | 2026-11-06 | organization |
| [#12267](https://github.com/better-auth/better-auth/pull/12267) | fix(stripe): re-read subscription before applying updated webhooks | umeraamir69 | 2026-11-05 | payments |
| [#12239](https://github.com/better-auth/better-auth/pull/12239) | fix(cimd): return all validated DNS addresses from Node transport | umeraamir69 | 2026-11-04 |  |
| [#12238](https://github.com/better-auth/better-auth/pull/12238) | fix(oauth-provider): use one error_description for token client-auth failures | umeraamir69 | 2026-11-04 | identity |
| [#12231](https://github.com/better-auth/better-auth/pull/12231) | fix(oauth-provider): use registration default scopes when authorize omits scope | Lakshya0604 | 2026-11-04 | identity |
| [#12223](https://github.com/better-auth/better-auth/pull/12223) | fix(oauth-provider): do not bind refreshed tokens to an expired session | wfcastaneda | 2026-11-04 | identity, docs |
| [#12197](https://github.com/better-auth/better-auth/pull/12197) | fix(email-otp, magic-link): sign in the existing user when it is created concurrently | 10k11 | 2026-11-03 | core, credentials |
| [#12196](https://github.com/better-auth/better-auth/pull/12196) | fix(device-authorization): accept form-encoded bodies on /device/token | AryaKesharwani | 2026-11-03 | identity |
| [#12190](https://github.com/better-auth/better-auth/pull/12190) | fix(oauth-provider): emit auth_time in JWT access tokens | VictorUvarov | 2026-11-03 | identity, docs |
| [#12185](https://github.com/better-auth/better-auth/pull/12185) | fix(core): let onAPIError.onError replace the response with an APIError | umeraamir69 | 2026-11-02 | core |
| [#12182](https://github.com/better-auth/better-auth/pull/12182) | fix(oauth-provider): replay concurrent refresh grants inside reuse interval | alfaroukhesham | 2026-11-02 | identity, docs |
| [#12180](https://github.com/better-auth/better-auth/pull/12180) | feat(generic-oauth): add disableIdTokenSignIn option | henricop | 2026-11-01 | oauth, docs |
| [#12178](https://github.com/better-auth/better-auth/pull/12178) | test(auth): cover sign-up when validateUserInfo throws | Trenyx | 2026-11-01 | core |
| [#12174](https://github.com/better-auth/better-auth/pull/12174) | fix(sso): paginate provider and candidate member reads in listSSOProviders (#12167) | ghazy2001 | 2026-11-01 | enterprise |
| [#12166](https://github.com/better-auth/better-auth/pull/12166) | fix(test-utils): include session cache cookies in auth helpers | eggrollius | 2026-11-01 | docs |
| [#12165](https://github.com/better-auth/better-auth/pull/12165) | fix(github): prefer the verified primary email over the public profile email | soufiane-bouchaara | 2026-10-31 | core, oauth |
| [#12164](https://github.com/better-auth/better-auth/pull/12164) | fix(core): do not consume delete-user token on owner mismatch (#12139) | ghazy2001 | 2026-10-31 | core |
| [#12163](https://github.com/better-auth/better-auth/pull/12163) | fix(generic-oauth): reject token responses missing id_token when verification is configured (#12153) | ghazy2001 | 2026-10-31 | oauth |
| [#12162](https://github.com/better-auth/better-auth/pull/12162) | fix(email-verification): create the change-email session only after the email update succeeds | Lakshya0604 | 2026-10-31 | core |
| [#12161](https://github.com/better-auth/better-auth/pull/12161) | feat(last-login-method): support custom cookieAttributes (#12158) | ghazy2001 | 2026-10-31 |  |
| [#12160](https://github.com/better-auth/better-auth/pull/12160) | fix(mcp,oidc-provider): rotate refresh tokens on the refresh_token grant | JosephDoUrden | 2026-10-31 | identity |
| [#12159](https://github.com/better-auth/better-auth/pull/12159) | fix(oauth-provider): scope refresh-token reuse invalidation to grant family (#12154) | ghazy2001 | 2026-10-31 | identity |
| [#12157](https://github.com/better-auth/better-auth/pull/12157) | fix(organization): prevent organizationLimit bypass on concurrent requests (#12149) | ghazy2001 | 2026-10-31 | organization |
| [#12156](https://github.com/better-auth/better-auth/pull/12156) | fix(sign-out): skip the account read when no provider can build a logout URL | PrabalParihar | 2026-10-31 | core, oauth |
| [#12147](https://github.com/better-auth/better-auth/pull/12147) | fix(cli): redact nested and snake_case secrets in `auth info` | bytaesu | 2026-10-30 | devtools |
| [#12143](https://github.com/better-auth/better-auth/pull/12143) | fix(drizzle): enable supportsJSON and supportsArrays by default to prevent double stringify (#8655) | ghazy2001 | 2026-10-30 | database |
| [#12140](https://github.com/better-auth/better-auth/pull/12140) | feat(sso): let resolvePrivateKey return its own client assertion ( Closes #12141 ) | asyrique | 2026-10-30 | enterprise, docs |
| [#12137](https://github.com/better-auth/better-auth/pull/12137) | fix(cli): avoid duplicate back-relations in prisma generator when relation exists (#12134) | ghazy2001 | 2026-10-30 | devtools |
| [#12131](https://github.com/better-auth/better-auth/pull/12131) | fix(api-key): throw non-API errors from verifyApiKey instead of returning INVALID_API_KEY | marioparaschiv | 2026-10-30 | payments |
| [#12127](https://github.com/better-auth/better-auth/pull/12127) | fix(oauth-provider): leave request bodies alone when the page query is unsigned | hardikguptaofficialgit | 2026-10-29 | identity |
| [#12120](https://github.com/better-auth/better-auth/pull/12120) | feat(oauth-popup): accept additionalParams like signIn.social | Faiziimam | 2026-10-29 |  |
| [#12114](https://github.com/better-auth/better-auth/pull/12114) | fix(sso): honor error callback for SAML account failures | marunbai | 2026-10-29 | enterprise, docs |
| [#12112](https://github.com/better-auth/better-auth/pull/12112) | fix(cli): write init env variables only to .env.local or .env | bytaesu | 2026-10-29 | devtools |
| [#12096](https://github.com/better-auth/better-auth/pull/12096) | fix(admin): stop refreshing impersonation sessions past their duration | onmax | 2026-10-29 | core, organization |
| [#12083](https://github.com/better-auth/better-auth/pull/12083) | feat(sso): bind OIDC ID tokens to the sign-in with a nonce | hyperb1iss | 2026-10-28 | enterprise, docs |
| [#12082](https://github.com/better-auth/better-auth/pull/12082) | feat(sso): support public OIDC clients with the none auth method | hyperb1iss | 2026-10-28 | enterprise, docs |
| [#12079](https://github.com/better-auth/better-auth/pull/12079) | fix(sso): redirect when the UserInfo request fails | hyperb1iss | 2026-10-28 | enterprise |
| [#12078](https://github.com/better-auth/better-auth/pull/12078) | fix(client): preserve isPending during refetch for signed-out sessions | Vishesh-Verma-07 | 2026-10-28 | core |
| [#12068](https://github.com/better-auth/better-auth/pull/12068) | fix: prevent trusted origin prefix redirects | pranav256 | 2026-10-27 | core |
| [#12065](https://github.com/better-auth/better-auth/pull/12065) | feat(oauth-provider): return expired_request for expired signed queries | 1-DARK | 2026-10-27 | identity, docs |
| [#12063](https://github.com/better-auth/better-auth/pull/12063) | fix(oauth): store refreshed tokens without the account id | jainamm-gala | 2026-10-27 | core |
| [#12054](https://github.com/better-auth/better-auth/pull/12054) | fix(organization): count other owners on the member table in removeMember | xiaoyu2er | 2026-10-26 | organization |
| [#12049](https://github.com/better-auth/better-auth/pull/12049) | fix(account): share and guard concurrent provider token refreshes | Eternity0207 | 2026-10-26 | core, database |
| [#12041](https://github.com/better-auth/better-auth/pull/12041) | fix(oauth-provider): resolve back-channel logout hosts before delivery | grant0417 | 2026-10-26 | identity, docs |
| [#12040](https://github.com/better-auth/better-auth/pull/12040) | fix(api-key): reject keys whose owner is banned or deleted | grant0417 | 2026-10-26 | payments, docs |
| [#12039](https://github.com/better-auth/better-auth/pull/12039) | fix(oauth-provider): treat introspection token_type_hint as a lookup order | luchersou | 2026-10-26 | identity |
| [#12036](https://github.com/better-auth/better-auth/pull/12036) | fix(passkey): recognize Chrome on Mac and YubiKey AAGUIDs | silentxtrader | 2026-10-25 | credentials |
| [#12035](https://github.com/better-auth/better-auth/pull/12035) | fix(oauth-provider): make allowedScopes storable across adapters | kaiizer777 | 2026-10-25 |  |
| [#12027](https://github.com/better-auth/better-auth/pull/12027) | feat(pin): add PIN plugin for step-up authentication | Vishesh-Verma-07 | 2026-10-25 | core, docs |
| [#12018](https://github.com/better-auth/better-auth/pull/12018) | fix(organization): read invitation sessions from the database when the cookie cache is on | rwieruch | 2026-10-24 | organization |
| [#12011](https://github.com/better-auth/better-auth/pull/12011) | feat(two-factor): support custom backup code verification | fireph | 2026-10-24 |  |
| [#12009](https://github.com/better-auth/better-auth/pull/12009) | feat(oauth-provider): allow optional clock tolerance for private_key_jwt assertions | umeraamir69 | 2026-10-23 | identity |
| [#11993](https://github.com/better-auth/better-auth/pull/11993) | fix(auth): preserve provider logout in stateless mode | Tushar-Khandelwal-2004 | 2026-10-22 | core |
| [#11989](https://github.com/better-auth/better-auth/pull/11989) | fix(organization): use authoritative session reads for authorization | abhi07070 | 2026-10-22 | organization, payments |
| [#11988](https://github.com/better-auth/better-auth/pull/11988) | fix(organization): surface team member insert errors outside aborted transactions | Gourav224 | 2026-10-22 | organization |
| [#11975](https://github.com/better-auth/better-auth/pull/11975) | fix(email-otp): mark the email verified inside the reset transaction | XXMOHAMED012 | 2026-10-21 | credentials, docs |
| [#11971](https://github.com/better-auth/better-auth/pull/11971) | fix(email-otp): keep the code row for an unknown or taken address | XXMOHAMED012 | 2026-10-21 | credentials |
| [#11964](https://github.com/better-auth/better-auth/pull/11964) | fix(cimd): check client_id URL policy before spending fetch budget | PrabalParihar | 2026-10-21 | docs |
| [#11963](https://github.com/better-auth/better-auth/pull/11963) | fix(organization): include team members in getFullOrganization | Vishesh-Verma-07 | 2026-10-21 | organization, docs |
| [#11962](https://github.com/better-auth/better-auth/pull/11962) | fix(username): check admin updateUser against the target user | drewsephski | 2026-10-21 | credentials, organization |
| [#11961](https://github.com/better-auth/better-auth/pull/11961) | fix(generic-oauth): cache discovery and bound discovery requests | Vishesh-Verma-07 | 2026-10-21 | oauth, docs |
| [#11960](https://github.com/better-auth/better-auth/pull/11960) | feat(phone-number): add storeOTP option | Vishesh-Verma-07 | 2026-10-21 | credentials, docs |
| [#11959](https://github.com/better-auth/better-auth/pull/11959) | fix(sso): support provider mutation guards without native transactions | Vishesh-Verma-07 | 2026-10-21 | enterprise, docs |
| [#11946](https://github.com/better-auth/better-auth/pull/11946) | fix(db): remove cached sessions when a transaction rolls back or retries | Gourav224 | 2026-10-20 | core, database |
| [#11945](https://github.com/better-auth/better-auth/pull/11945) | fix(oauth-provider): omit null list fields when writing device codes | Gourav224 | 2026-10-20 |  |
| [#11944](https://github.com/better-auth/better-auth/pull/11944) | feat(scim): support custom User schema extensions | formatlos | 2026-10-20 | enterprise, docs |
| [#11943](https://github.com/better-auth/better-auth/pull/11943) | fix(stripe): return non-2xx when a webhook can't be fully processed | nerdstep | 2026-10-20 | payments, docs |
| [#11941](https://github.com/better-auth/better-auth/pull/11941) | docs: document CLI check command exit codes | kaiizer777 | 2026-10-20 | docs |
| [#11939](https://github.com/better-auth/better-auth/pull/11939) | fix(username): apply validationOrder on sign-in and availability check | parbhatkapila4 | 2026-10-20 | credentials |
| [#11928](https://github.com/better-auth/better-auth/pull/11928) | fix(organization): aggregate permissions across all user roles in hasPermission | adeeluddin01 | 2026-10-19 | organization |
| [#11915](https://github.com/better-auth/better-auth/pull/11915) | fix(api-key): use the active transaction's adapter | luca-nardelli | 2026-10-19 | payments |
| [#11886](https://github.com/better-auth/better-auth/pull/11886) | fix(2fa): durable secondary-storage reads for 2fa challenges | kaiizer777 | 2026-10-17 | core, database, security, docs |
| [#11883](https://github.com/better-auth/better-auth/pull/11883) | fix(password-reset): hold both branches of request-password-reset to the same response-time floor | AmineBenzaazaa | 2026-10-16 | core |
| [#11881](https://github.com/better-auth/better-auth/pull/11881) | fix(organization): handle a null session update in set-active endpoints | AmineBenzaazaa | 2026-10-16 | organization |
| [#11876](https://github.com/better-auth/better-auth/pull/11876) | feat(sso): expose domain verification DNS identifier | AbdulSamad94 | 2026-10-16 | enterprise, docs |
| [#11873](https://github.com/better-auth/better-auth/pull/11873) | chore(better-auth): optimize session adapter operations | jonathansamines | 2026-10-16 | core, database |
| [#11872](https://github.com/better-auth/better-auth/pull/11872) | fix(oauth-provider): allow opting out of the https issuer rewrite | pintu544 | 2026-10-16 | identity |
| [#11803](https://github.com/better-auth/better-auth/pull/11803) | fix(cli): redact config key variants | Tushar-Khandelwal-2004 | 2026-10-15 | devtools |
| [#11777](https://github.com/better-auth/better-auth/pull/11777) | fix(oauth-provider): read form bodies as bytes instead of .text() | choksi2212 | 2026-10-15 | identity |
| [#11775](https://github.com/better-auth/better-auth/pull/11775) | fix(generic-oauth): forward configured redirectURI and gate codeVerifier for custom getToken | kaiizer777 | 2026-10-14 | oauth, docs |
| [#11769](https://github.com/better-auth/better-auth/pull/11769) | feat(cli): add opt-in timestamptz generation for drizzle postgres | kaiizer777 | 2026-10-14 | core, devtools, docs |
| [#11757](https://github.com/better-auth/better-auth/pull/11757) | fix(sveltekit): recognize auth paths behind TLS-terminating proxies | Vishesh-Verma-07 | 2026-10-14 | platform, docs |
| [#11755](https://github.com/better-auth/better-auth/pull/11755) | test(passkey): cover 400 on failed registration verification | Apu-Emdad | 2026-10-14 | credentials |
| [#11753](https://github.com/better-auth/better-auth/pull/11753) | feat(phone-number): pass purpose type to verifyOTP callback | Sandipxg | 2026-10-14 | credentials, docs |
| [#11741](https://github.com/better-auth/better-auth/pull/11741) | fix(adapter): fail closed on singular delete with empty where | drewsephski | 2026-10-14 | core, devtools, docs |
| [#11736](https://github.com/better-auth/better-auth/pull/11736) | fix(oauth): clarify rejection reason and support fallback for trustedProviders (#11321) | kaiizer777 | 2026-10-13 | core, oauth, docs |
| [#11734](https://github.com/better-auth/better-auth/pull/11734) | feat(mongo-adapter): add supportsJSON config option (#7540) | kaiizer777 | 2026-10-13 | database |
| [#11722](https://github.com/better-auth/better-auth/pull/11722) | fix(drizzle-adapter): avoid double JSON serialization in SQLite | GenSoftMX | 2026-10-13 | database, docs, devops |
| [#11720](https://github.com/better-auth/better-auth/pull/11720) | feat(rate-limit)!: adopt policy-based rate limiting | bytaesu | 2026-10-13 | do-not-merge, core, credentials, identity, security, docs |
| [#11719](https://github.com/better-auth/better-auth/pull/11719) | feat(rate-limit): add a multi-strategy rate-limit engine | bytaesu | 2026-10-13 |  |
| [#11710](https://github.com/better-auth/better-auth/pull/11710) | fix(core): expose additionalFields on callback user types | kaiizer777 | 2026-10-12 | core, credentials |
| [#11704](https://github.com/better-auth/better-auth/pull/11704) | fix(oauth-provider): keep a refresh family revoked when cleanup fails | parbhatkapila4 | 2026-10-12 | identity |
| [#11694](https://github.com/better-auth/better-auth/pull/11694) | fix(rate-limit): use fixed windows anchored to first request | dev-malay | 2026-10-12 | core, security, docs |
| [#11692](https://github.com/better-auth/better-auth/pull/11692) | fix(oauth-provider): limit jwks_uri refetches for unknown keys | gustavovalverde | 2026-10-12 | identity, docs |
| [#11681](https://github.com/better-auth/better-auth/pull/11681) | fix(cimd): bound in-flight resolution liveness and reclaim wedged fetch permits | choksi2212 | 2026-10-11 |  |
| [#11671](https://github.com/better-auth/better-auth/pull/11671) | fix(rate-limit): stop allowed requests from extending the window | Adnan-Husayn | 2026-10-10 | core, security, docs |
| [#11668](https://github.com/better-auth/better-auth/pull/11668) | fix(organization): refresh the session cookie after accepting an invitation | aryan1306 | 2026-10-10 | organization |
| [#11665](https://github.com/better-auth/better-auth/pull/11665) | fix(api-key)!: distinguish verification failures from invalid keys | bytaesu | 2026-10-10 |  |
| [#11664](https://github.com/better-auth/better-auth/pull/11664) | fix(i18n): prefer configured regional locale tags | pvarshh | 2026-10-09 | devtools, docs |
| [#11634](https://github.com/better-auth/better-auth/pull/11634) | fix(oauth-provider): revoke a refresh family before deleting it | ArjunCodess | 2026-10-08 | identity |
| [#11627](https://github.com/better-auth/better-auth/pull/11627) | fix(client): reject invalid session responses | Tushar-Khandelwal-2004 | 2026-10-08 | core |
| [#11619](https://github.com/better-auth/better-auth/pull/11619) | feat(api): run auth.api calls as a user without request headers | ArjunCodess | 2026-10-07 | core |
| [#11618](https://github.com/better-auth/better-auth/pull/11618) | feat(oauth-provider): export userNormalClaims for customIdTokenClaims implementations | dvanmali | 2026-10-07 | identity, docs |
| [#11614](https://github.com/better-auth/better-auth/pull/11614) | fix(anonymous): nest required inside the delete-anonymous-user 400 schema | gwendall | 2026-10-06 | credentials, devtools |
| [#11608](https://github.com/better-auth/better-auth/pull/11608) | fix(oauth): consume database-backed state atomically | realies | 2026-10-05 | oauth, enterprise |
| [#11601](https://github.com/better-auth/better-auth/pull/11601) | fix(session): do not restore a revoked session from a stale cache | jkugsiya | 2026-10-05 | database, devtools |
| [#11600](https://github.com/better-auth/better-auth/pull/11600) | fix(organization): release team seats when a user is deleted | Livog | 2026-10-05 | organization |
| [#11599](https://github.com/better-auth/better-auth/pull/11599) | feat(passkey): add getUserHandle for a stable WebAuthn user handle | jkugsiya | 2026-10-05 | credentials, docs |
| [#11598](https://github.com/better-auth/better-auth/pull/11598) | fix(oauth-provider): answer concurrent duplicate refreshes with the winner's response | mrosberghaus | 2026-10-05 | identity, docs |
| [#11594](https://github.com/better-auth/better-auth/pull/11594) | feat(passkey): resolve rpID per request and add expectedRPID | xiaoyu2er | 2026-10-05 | credentials, docs |
| [#11593](https://github.com/better-auth/better-auth/pull/11593) | fix(core): support Lynx regex compatibility | Tushar-Khandelwal-2004 | 2026-10-05 | core |
| [#11590](https://github.com/better-auth/better-auth/pull/11590) | fix(anonymous): keep the new session cookie when signing in over a stale one | BryceEWatson | 2026-10-04 | credentials |
| [#11588](https://github.com/better-auth/better-auth/pull/11588) | feat(oauth-provider): exchange a refresh token for a one-time browser session | ArjunCodess | 2026-10-04 | identity |
| [#11583](https://github.com/better-auth/better-auth/pull/11583) | feat(sso): configure outgoing SAML logout signatures | okxiaoliang4 | 2026-10-04 | enterprise, docs |
| [#11582](https://github.com/better-auth/better-auth/pull/11582) | feat(sso): add organization enrollment policy hooks | okxiaoliang4 | 2026-10-04 | enterprise, docs |
| [#11581](https://github.com/better-auth/better-auth/pull/11581) | feat(organization): add transaction-bound membership policy hooks | okxiaoliang4 | 2026-10-04 | organization, docs |
| [#11580](https://github.com/better-auth/better-auth/pull/11580) | feat(scim): provide user request context to projections | okxiaoliang4 | 2026-10-04 | enterprise, docs |
| [#11579](https://github.com/better-auth/better-auth/pull/11579) | fix(sso): submit SAML POST forms before iframe load | okxiaoliang4 | 2026-10-04 | enterprise, devops |
| [#11577](https://github.com/better-auth/better-auth/pull/11577) | feat(sso): support verified authentication facts and fresh SAML login | okxiaoliang4 | 2026-10-04 | enterprise, docs |
| [#11576](https://github.com/better-auth/better-auth/pull/11576) | feat(sso): support manual SLO response endpoints and SP signing metadata | okxiaoliang4 | 2026-10-04 | enterprise, docs |
| [#11556](https://github.com/better-auth/better-auth/pull/11556) | fix(oauth-provider): omit sid on refresh when the issuance session is gone | maxnze1 | 2026-10-03 | identity |
| [#11547](https://github.com/better-auth/better-auth/pull/11547) | fix(stripe): compose redirect URLs safely | bytaesu | 2026-10-02 | payments |
| [#11546](https://github.com/better-auth/better-auth/pull/11546) | fix(sso): compose callback URLs safely | bytaesu | 2026-10-02 | enterprise |
| [#11545](https://github.com/better-auth/better-auth/pull/11545) | fix(oauth-provider): compose endpoint URLs safely | bytaesu | 2026-10-02 | identity |
| [#11544](https://github.com/better-auth/better-auth/pull/11544) | fix: compose authentication and integration URLs safely | bytaesu | 2026-10-02 | core, oauth, credentials, platform, docs |
| [#11543](https://github.com/better-auth/better-auth/pull/11543) | fix(core): compose social provider URLs safely | bytaesu | 2026-10-02 | core, oauth |
| [#11542](https://github.com/better-auth/better-auth/pull/11542) | feat(core): add URL path composition helpers | bytaesu | 2026-10-02 | core |
| [#11537](https://github.com/better-auth/better-auth/pull/11537) | feat(organization)!: add email confirmation for organization deletion | mcorbelli | 2026-10-02 |  |
| [#11535](https://github.com/better-auth/better-auth/pull/11535) | fix(db): allow indexes to reference the implicit primary key id | krishnendu-2003 | 2026-10-02 | core, database, devtools |
| [#11534](https://github.com/better-auth/better-auth/pull/11534) | feat(organization): add a dedicated transfer-ownership endpoint | mcorbelli | 2026-10-02 | core, organization, docs |
| [#11532](https://github.com/better-auth/better-auth/pull/11532) | feat(auth): add explicit confirmation mode for change-email links | mcorbelli | 2026-10-02 | core, devtools, docs |
| [#11531](https://github.com/better-auth/better-auth/pull/11531) | feat(auth): add explicit confirmation mode for delete-user links | mcorbelli | 2026-10-02 | core, devtools, docs |
| [#11525](https://github.com/better-auth/better-auth/pull/11525) | fix(sso): normalize OIDC signup-disabled error to signup_disabled | kaiizer777 | 2026-10-02 | enterprise |
| [#11518](https://github.com/better-auth/better-auth/pull/11518) | fix/social-test-callback-error-handler-5127755558819347597 | abushaidislam | 2026-10-02 |  |
| [#11516](https://github.com/better-auth/better-auth/pull/11516) | feat(oauth2): export OAuth callback error codes | shaked-frame | 2026-10-01 | core, oauth, docs |
| [#11510](https://github.com/better-auth/better-auth/pull/11510) | feat(steam): add social sign-in with OpenID 2.0 | Aziz-AXG | 2026-10-01 | core, oauth, devtools, docs |
| [#11502](https://github.com/better-auth/better-auth/pull/11502) | feat(api): complete HTTP hook lifecycle | bytaesu | 2026-09-30 | target: minor, core, docs |
| [#11489](https://github.com/better-auth/better-auth/pull/11489) | fix(oauth): log OAuth token-exchange failures with provider context | Bekacru | 2026-09-30 | core, oauth |
| [#11487](https://github.com/better-auth/better-auth/pull/11487) | fix(magic-link): redirect to errorCallbackURL on session creation errors | Bekacru | 2026-09-30 | credentials |
| [#11486](https://github.com/better-auth/better-auth/pull/11486) | fix(core): tolerate a null cached user in the session secondary-storage cache | Bekacru | 2026-09-30 | database |
| [#11485](https://github.com/better-auth/better-auth/pull/11485) | fix(core): retry auth context init after a transient failure | Bekacru | 2026-09-30 | core |
| [#11470](https://github.com/better-auth/better-auth/pull/11470) | feat(jwt): allow remote signing for the session cookie cache | ArjunCodess | 2026-09-29 | core |
| [#11455](https://github.com/better-auth/better-auth/pull/11455) | docs: explain how to delete expired sessions | TiagoGranelli | 2026-09-28 | docs |
| [#11452](https://github.com/better-auth/better-auth/pull/11452) | perf(session): batch deletes in revoke-other-sessions | TiagoGranelli | 2026-09-28 | core, database |
| [#11449](https://github.com/better-auth/better-auth/pull/11449) | fix(cimd): honor AbortSignal while awaiting DNS resolution in Node transport | deepanshupal | 2026-09-28 | identity |
| [#11444](https://github.com/better-auth/better-auth/pull/11444) | feat(session): store session tokens hashed at rest (opt-in) | nova28 | 2026-09-28 | core, database, identity, enterprise, docs |
| [#11443](https://github.com/better-auth/better-auth/pull/11443) | feat(username): allow sign-up without email via getTempEmail | nova28 | 2026-09-28 | credentials, docs |
| [#11436](https://github.com/better-auth/better-auth/pull/11436) | fix(stripe): prevent TypeError in onSubscriptionUpdated when subscrip… | douglasndm | 2026-09-27 | payments |
| [#11435](https://github.com/better-auth/better-auth/pull/11435) | fix(stripe): expire the previous checkout session when checkout is restarted | rwieruch | 2026-09-27 | payments, docs |
| [#11427](https://github.com/better-auth/better-auth/pull/11427) | fix: skip endpoints a later plugin overrides in the endpoint conflict check | Paalt | 2026-09-26 | core |
| [#11415](https://github.com/better-auth/better-auth/pull/11415) | feat(jwt): store alg on the public JWK | bytaesu | 2026-09-25 | core |
| [#11410](https://github.com/better-auth/better-auth/pull/11410) | fix(oauth-provider): include target origin in logout confirmation CSP form-action (#11262) | kaiizer777 | 2026-09-25 | identity |
| [#11401](https://github.com/better-auth/better-auth/pull/11401) | fix(email-otp): reject change-email type on the generic OTP endpoints | BilalAtique | 2026-09-25 | credentials |
| [#11400](https://github.com/better-auth/better-auth/pull/11400) | fix(organization): run remove-member hooks when a member leaves | rwieruch | 2026-09-25 | organization, payments |
| [#11399](https://github.com/better-auth/better-auth/pull/11399) | fix(email-otp): do not re-verify or sign in an already verified account on verify-email | XXMOHAMED012 | 2026-09-25 | credentials, docs |
| [#11396](https://github.com/better-auth/better-auth/pull/11396) | fix(email-otp): only mail email-verification codes for a verified address to its owner | XXMOHAMED012 | 2026-09-25 | credentials, docs |
| [#11392](https://github.com/better-auth/better-auth/pull/11392) | fix(auth): run delete hooks only for removed rows | breken-ai | 2026-09-24 | database |
| [#11385](https://github.com/better-auth/better-auth/pull/11385) | fix(telemetry): stop file tracers from shipping every package.json | tycrimm | 2026-09-24 | devtools |
| [#11384](https://github.com/better-auth/better-auth/pull/11384) | fix(cli): report schema mismatches only once | bytaesu | 2026-09-24 | devtools |
| [#11371](https://github.com/better-auth/better-auth/pull/11371) | feat(phone-number): add generateOTP option | martinriviere | 2026-09-23 | credentials, docs |
| [#11368](https://github.com/better-auth/better-auth/pull/11368) | feat(electron): add support for WebContentsView | jslno | 2026-09-22 | platform |
| [#11361](https://github.com/better-auth/better-auth/pull/11361) | feat(oauth2): custom oauth token encryption | jackall3n | 2026-09-22 | core, oauth, devtools, docs |
| [#11358](https://github.com/better-auth/better-auth/pull/11358) | fix(oauth-provider): resume the authorization after an OIDC SSO sign-in | Neekoras | 2026-09-22 | identity, enterprise |
| [#11357](https://github.com/better-auth/better-auth/pull/11357) | refactor(electron): deprecate `cookiePrefix` option in server plugin | jslno | 2026-09-22 | platform, docs |
| [#11356](https://github.com/better-auth/better-auth/pull/11356) | feat(electron): allow interpolating data from session | jslno | 2026-09-22 | platform, docs |
| [#11345](https://github.com/better-auth/better-auth/pull/11345) | fix(oauth-provider): bind authorization codes to their consent | waleed-mirza | 2026-09-20 | identity |
| [#11335](https://github.com/better-auth/better-auth/pull/11335) | fix(auth): fail closed when deleting sessions from secondary storage | Vishesh-Verma-07 | 2026-09-19 | database |
| [#11315](https://github.com/better-auth/better-auth/pull/11315) | feat(cookies): add` __Host-` cookie support | bytaesu | 2026-09-17 | core, platform, docs |
| [#11312](https://github.com/better-auth/better-auth/pull/11312) | fix(session)!: surface session deletion errors on sign-out | bytaesu | 2026-09-16 |  |
| [#11309](https://github.com/better-auth/better-auth/pull/11309) | fix(organization): reject role names containing the list separator | seifsheikhelarab | 2026-09-16 | organization, docs |
| [#11304](https://github.com/better-auth/better-auth/pull/11304) | feat(auth): adding support for GHEC | katallaxie | 2026-09-16 | core, oauth, docs |
| [#11302](https://github.com/better-auth/better-auth/pull/11302) | fix(client): normalize network fetch failures | vjymisal0 | 2026-09-16 | core |
| [#11295](https://github.com/better-auth/better-auth/pull/11295) | feat(two-factor): add challengePaths option to support 2FA on custom sign-in paths | Tyagiquamar | 2026-09-15 | security |
| [#11260](https://github.com/better-auth/better-auth/pull/11260) | fix(sign-up): replace unverified claims on re-registration | waleed-mirza | 2026-09-11 | core, oauth, credentials |
| [#11237](https://github.com/better-auth/better-auth/pull/11237) | fix(generic-oauth): support symmetric ID token verification | jhapriyavart10 | 2026-09-10 | oauth |
| [#11234](https://github.com/better-auth/better-auth/pull/11234) | feat(two-factor): add storeSecret hook for TOTP secret encryption | Micheletto | 2026-09-09 | security, docs |
| [#11230](https://github.com/better-auth/better-auth/pull/11230) | fix(session): repopulate secondaryStorage after database fallback in findSession | breken-ai | 2026-09-09 | database |
| [#11219](https://github.com/better-auth/better-auth/pull/11219) | feat(react)!: suspend initial client queries | timneutkens | 2026-09-08 | core, docs |
| [#11206](https://github.com/better-auth/better-auth/pull/11206) | fix(core): don't console.error the raw query error in handleFallbackJoin | Didactora | 2026-09-07 | core |
| [#11201](https://github.com/better-auth/better-auth/pull/11201) | fix(oauth-provider): omit given_name and family_name when the user has no name | SibteProf | 2026-09-07 | identity |
| [#11199](https://github.com/better-auth/better-auth/pull/11199) | fix: loosens email signup body schema to throw correct error code | mathewmeconry | 2026-09-07 | core |
| [#11198](https://github.com/better-auth/better-auth/pull/11198) | docs: correct the 1.7 account cleanup guide | gustavovalverde | 2026-09-07 | docs |
| [#11186](https://github.com/better-auth/better-auth/pull/11186) | docs: fix foreign-key column type mismatch and index for MySQL snippets | Dragate | 2026-09-05 | docs |
| [#11183](https://github.com/better-auth/better-auth/pull/11183) | fix(email-otp): propagate `sendVerificationOTP` errors | exKAZUu | 2026-09-05 | credentials |
| [#11182](https://github.com/better-auth/better-auth/pull/11182) | fix(email-otp): reuse the existing code when concurrent sends collide | exKAZUu | 2026-09-05 | core, database, credentials |
| [#11173](https://github.com/better-auth/better-auth/pull/11173) | fix(mongo-adapter): recognize ObjectId and UUID values from a different bson instance | Bekacru | 2026-09-04 | database |
| [#11172](https://github.com/better-auth/better-auth/pull/11172) | fix(two-factor): make enabling two-factor safe under concurrent requests | Bekacru | 2026-09-04 | security |
| [#11170](https://github.com/better-auth/better-auth/pull/11170) | fix(oauth): keep the state cookie alive as long as the state it protects | Bekacru | 2026-09-04 | core, oauth, docs |
| [#11158](https://github.com/better-auth/better-auth/pull/11158) | fix(sso): run the DNS SSRF guard on OIDC discovery for public issuers | Bekacru | 2026-09-04 | enterprise, docs |
| [#11155](https://github.com/better-auth/better-auth/pull/11155) | fix(passkey): respect authenticatorSelection.userVerification in auth options and verifiers | ryuhzk | 2026-09-04 | credentials |
| [#11133](https://github.com/better-auth/better-auth/pull/11133) | fix(oauth-provider): detach inactive sessions on refresh | MagsMagnoli | 2026-09-02 | identity |
| [#11114](https://github.com/better-auth/better-auth/pull/11114) | feat(oauth-provider): decouple public-client advertisement from unauthenticated DCR | rendermani | 2026-09-02 | identity |
| [#11080](https://github.com/better-auth/better-auth/pull/11080) | feat(organizations): [WIP] Add support for roles in teams | Bredo | 2026-08-31 | organization |
| [#11078](https://github.com/better-auth/better-auth/pull/11078) | feat(api): add enabledPaths option to restrict served paths | te2wow | 2026-08-31 | core, devtools, docs |
| [#11075](https://github.com/better-auth/better-auth/pull/11075) | fix(oauth2): keep every in-flight sign-in in the cookie state | SferaDev | 2026-08-31 | oauth |
| [#11056](https://github.com/better-auth/better-auth/pull/11056) | fix(oauth): revoke tokens when consent is deleted | Garv978 | 2026-08-29 | core, credentials, identity, organization, payments, platform, devtools, docs |
| [#11055](https://github.com/better-auth/better-auth/pull/11055) | test(sso): cover wantAssertionsSigned absent-to-true policy flip | Yogesh-dev318 | 2026-08-29 | enterprise |
| [#11051](https://github.com/better-auth/better-auth/pull/11051) | fix(haveibeenpwned): bound the HIBP breach-check fetch with a timeout | pacocartones | 2026-08-29 | security |
| [#11018](https://github.com/better-auth/better-auth/pull/11018) | feat(account): return token type for get access token and refresh token endpoint | alfanjauhari | 2026-08-27 | core, oauth |
