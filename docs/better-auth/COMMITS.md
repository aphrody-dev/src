# Commits main depuis 2026-10-15 (278)

| SHA | Date | Auteur | Sujet |
|---|---|---|---|
| `2039e7303` | 2026-11-14 | better-release[bot] | chore: release v1.7.24 (#12610) |
| `aeee6bab3` | 2026-11-14 | Gustavo Valverde | docs: match the FAQ's `better-call` resolution to `better-auth` (#12602) |
| `d7f831cdd` | 2026-11-14 | Gustavo Valverde | fix(oauth-provider): drop the double slash from endpoint URLs (#12598) |
| `b77e78341` | 2026-11-14 | Gustavo Valverde | fix: delete expired verification rows at most once a minute (#12593) |
| `0597f4c2f` | 2026-11-14 | Gustavo Valverde | fix(deps): share one `better-call` 1.4 copy across plugins (#12502) |
| `87ede7984` | 2026-11-14 | Gustavo Valverde | fix: recognize APIError from another better-call copy in plugins (#12503) |
| `3dcbc1044` | 2026-11-14 | Gustavo Valverde | docs(oauth-provider): say requireActiveAccessToken skips DPoP checks (#12498) |
| `f39e6c66c` | 2026-11-13 | better-release[bot] | chore: release v1.7.23 (#12493) |
| `cfa73e90f` | 2026-11-13 | Gustavo Valverde | fix(mcp): resolve requireMcpAuth signing keys without a self-request (#12501) |
| `b9c259b61` | 2026-11-13 | Gustavo Valverde | fix(oauth-provider): verify PKCE and DPoP before consuming a code (#12499) |
| `be0d01c8c` | 2026-11-13 | Gustavo Valverde | fix(oauth-provider): warn when extensions set the same discovery key (#12500) |
| `9dc64fbba` | 2026-11-13 | Gustavo Valverde | fix(kysely-adapter): save top-level JSON arrays on PostgreSQL (#12530) |
| `41a25269d` | 2026-11-13 | Gustavo Valverde | fix(memory-adapter): stop reusing stored serial ids after a delete (#12544) |
| `d6e9bbdbb` | 2026-11-13 | Gustavo Valverde | fix(test): give each test file its own MongoDB database (#12543) |
| `06925b35d` | 2026-11-13 | Gustavo Valverde | fix(oauth-provider): send DPoP insufficient_scope challenges (#12525) |
| `7c61c4053` | 2026-11-13 | Gustavo Valverde | fix(oauth-provider): expose WWW-Authenticate on every resource challenge (#12521) |
| `295954490` | 2026-11-13 | Gustavo Valverde | fix(oauth-provider): send a Bearer challenge for unsupported schemes (#12515) |
| `35135c64d` | 2026-11-13 | Gustavo Valverde | docs(mcp): explain the handler's in-memory DPoP replay store (#12504) |
| `c10b35da7` | 2026-11-13 | Gustavo Valverde | docs: correct schema validation, telemetry, and DPoP challenge notes (#12480) |
| `0a014aef6` | 2026-11-12 | Taesu | ci: validate docs sidebar icons against versioned docs (#12497) |
| `cdbd26f20` | 2026-11-13 | Taesu | docs(ciba): add sidebar icon (#12496) |
| `d808595d9` | 2026-11-13 | better-release[bot] | docs: sync v1.8 documentation (#12434) |
| `e9aeec8d9` | 2026-11-12 | Jonathan Samines | docs: update sentinel header docs to match current behavior (#12495) |
| `53abb9664` | 2026-11-12 | Taesu | fix(electron): find the auth callback anywhere in launch arguments (#12490) |
| `3a03cbea3` | 2026-11-12 | Taesu | refactor: remove non-null assertions the type checker already proves (#12474) |
| `3d233e438` | 2026-11-12 | Gustavo Valverde | ci(release-tooling): require every entry in each release-note AI batch (#12477) |
| `116c86889` | 2026-11-12 | better-release[bot] | chore: release v1.7.22 (#12435) |
| `61463a2dd` | 2026-11-12 | Gustavo Valverde | ci(release-tooling): keep release-note titles to the headline (#12476) |
| `63a2c74a4` | 2026-11-12 | Gustavo Valverde | ci(release-tooling): keep one overlong rewrite from dropping a whole release-notes batch (#12475) |
| `f6487eddd` | 2026-11-12 | Taesu | fix(stripe): warn when a subscription update has no local subscription (#12473) |
| `ed1d47b0f` | 2026-11-12 | Taesu | chore(deps): update dependencies (#12472) |
| `49e874968` | 2026-11-12 | Taesu | chore(deps): update dependencies (#12470) |
| `e4f92152a` | 2026-11-12 | Taesu | test(generic-oauth): serve provider discovery locally in helper tests (#12471) |
| `bfe96d5af` | 2026-11-12 | Taesu | test(smoke): wait for the anchored schema lookup before migrating (#12469) |
| `67fd70b43` | 2026-11-12 | Taesu | chore: re-resolve and dedupe the lockfile with pnpm 12 (#12463) |
| `d210421a2` | 2026-11-12 | Taesu | fix(session): keep expired sessions out of the hook context on get-session (#12459) |
| `d32a30af3` | 2026-11-12 | Taesu | fix(client): treat unknown connectivity as online (#12462) |
| `ce18ac353` | 2026-11-12 | Taesu | chore: upgrade pnpm to 12.18.0 (#12460) |
| `4e2628878` | 2026-11-12 | Taesu | refactor: share the deletion step across deleteUser and its callback (#12457) |
| `653617421` | 2026-11-12 | Taesu | fix(db): ignore references to app tables when resolving joins (#12333) |
| `946177e50` | 2026-11-11 | Taesu | fix(session): expire session cookies when revoking the current session or deleting the user with a token (#12321) |
| `80c407b7c` | 2026-11-11 | Taesu | fix(client): skip session refresh listeners during SSR and keep manager teardown safe (#12324) |
| `71052af88` | 2026-11-11 | Taesu | fix: keep verification consumes from hanging on Cloudflare Workers (#12451) |
| `79219b4f8` | 2026-11-11 | Taesu | fix: start a module-scope auth instance cleanly on Cloudflare Workers (#12448) |
| `d521343fc` | 2026-11-11 | Taesu | fix(client): send a JSON body on deferred session refresh (#12330) |
| `485567e2c` | 2026-11-11 | Taesu | fix(oauth2): stop logging a `TypeError` when `user.create.before` aborts sign-up (#12331) |
| `ec3047da8` | 2026-11-11 | Taesu | fix(organization): keep the active organization when a delete hook rejects (#12334) |
| `bbddc3c3e` | 2026-11-11 | Taesu | refactor(oauth2): share parseStringBoolean across providers (#12450) |
| `59768427a` | 2026-11-11 | Gustavo Valverde | fix(oauth-provider): answer failed DPoP requests with a DPoP challenge (#12447) |
| `139302823` | 2026-11-11 | Gustavo Valverde | fix(oauth-provider): send WWW-Authenticate challenges on UserInfo 401s (#12446) |
| `e9d8e5977` | 2026-11-11 | Gustavo Valverde | fix(oauth-provider): keep resource challenges valid and report invalid_token (#12445) |
| `316a55c28` | 2026-11-11 | Gustavo Valverde | chore: surface e2e fixture failures and correct two docs examples (#12428) |
| `262adc0e7` | 2026-11-11 | Gustavo Valverde | fix(core): reject introspected tokens that fail claim checks with 401 (#12432) |
| `26c9d28f1` | 2026-11-11 | better-release[bot] | docs: sync v1.8 documentation (#12266) |
| `b23792472` | 2026-11-11 | better-release[bot] | chore: release v1.7.21 (#12384) |
| `0df361837` | 2026-11-11 | Gustavo Valverde | fix(sso): extend the refreshed session's own SAML logout record (#12424) |
| `ef4d4f7dc` | 2026-11-11 | Taesu | fix(telemetry): report Cloudflare Workers as workerd (#12425) |
| `4739122fa` | 2026-11-11 | Hardik Gupta | fix(core): use ObjectId-shaped derived ids for Prisma ObjectId columns (#12126) |
| `16f55e03f` | 2026-11-11 | Gustavo Valverde | fix(sso): key SAML replay protection on the decoded assertion ID (#12421) |
| `114d7d03f` | 2026-11-11 | Gustavo Valverde | docs: say when trustedOrigins receives a request on auth.api calls (#12415) |
| `91052614c` | 2026-11-11 | Mahmoud Ghazy | fix(generic-oauth): send discoveryHeaders to same-origin JWKS and keep them on the discovery origin (#12179) |
| `f539be6c8` | 2026-11-11 | Gustavo Valverde | fix(scim): return 501 when the adapter has no native transaction (#12413) |
| `fb48efe10` | 2026-11-11 | Gustavo Valverde | fix(core): let custom token auth hooks replace caller headers in any casing (#12414) |
| `671f54ca8` | 2026-11-11 | Gustavo Valverde | fix(sso): keep SAML Single Logout working after session refresh (#12417) |
| `40806302b` | 2026-11-11 | Sudhan | fix(mongo-adapter): create indexes for fields marked unique or index (#12299) |
| `b0ced9d25` | 2026-11-11 | Gustavo Valverde | fix(generic-oauth, oauth-provider): stop sharing pending retries across requests (#12395) |
| `79d61b0fb` | 2026-11-11 | Gustavo Valverde | fix(oauth-provider): report rejected post-logout redirect URIs as invalid_redirect_uri (#12391) |
| `fcf0db623` | 2026-11-11 | Jakub Jankowski | fix(scim): handle Groups with more than 100 members (#12070) |
| `1c3410a5c` | 2026-11-11 | Lakshya Dhariwal | fix(sign-up): send sign-up emails after the transaction commits (#12052) |
| `070d10139` | 2026-11-11 | Gustavo Valverde | fix(passkey): accept exact trusted origins under a wildcard allowed host (#12388) |
| `5ea897937` | 2026-11-11 | Gustavo Valverde | docs: correct consent denial, SAML name, device client, and migrate changeset wording (#12394) |
| `625e6feb4` | 2026-11-11 | Gustavo Valverde | fix(demo): handle failed and processed lookups on the device approval page (#12393) |
| `a277020fa` | 2026-11-11 | Gustavo Valverde | fix(device-authorization): return request details to a concurrent lookup by the claiming user (#12392) |
| `db930d901` | 2026-11-11 | Gustavo Valverde | fix(oauth-provider): revoke in-flight access tokens on adapters without foreign keys (#12389) |
| `57fa8432d` | 2026-11-11 | Gustavo Valverde | fix(prisma-adapter): handle null unique filters in update and write a single row (#12390) |
| `2d10ae733` | 2026-11-11 | Gustavo Valverde | fix(core): keep null when coercing serial id where values (#12402) |
| `1a79da506` | 2026-11-11 | Taesu | fix(core): prevent stalled schema validation from blocking requests (#11716) |
| `5a69b1752` | 2026-11-11 | Jarod Stewart | docs: replace "better-inbox" with "BYO (byo-oss)" in community plugins (#12280) |
| `310d52559` | 2026-11-11 | Taesu | docs: add a Cloudflare guide (#12405) |
| `9362c0d42` | 2026-11-11 | Taesu | fix: await promises that were dropped or concatenated as strings (#12409) |
| `9b40ac62a` | 2026-11-11 | Taesu | fix: keep Kysely out of split bundles that use plugin packages (#12404) |
| `e64f62427` | 2026-11-10 | Taesu | fix(siwe): stop exposing internal error messages in verify responses (#12403) |
| `c3a94c546` | 2026-11-10 | Gustavo Valverde | fix(generic-oauth): send authorizationHeaders on token refresh (#12401) |
| `92de52793` | 2026-11-10 | Gustavo Valverde | docs(oauth-provider): describe resource client defaults that include the base path (#12387) |
| `5c120747e` | 2026-11-10 | Gustavo Valverde | fix(kysely-adapter): read only the schemas in use when introspecting Postgres (#11912) |
| `900195df3` | 2026-11-10 | Gustavo Valverde | fix(oauth-provider): return invalid_grant when reuse revokes an in-flight issuance (#11911) |
| `fd66861c3` | 2026-11-10 | Gustavo Valverde | fix(oauth-provider): revalidate the client and redirect URI before redirecting a consent denial (#12385) |
| `b241ffc94` | 2026-11-10 | Gustavo Valverde | fix(prisma-adapter): match regex characters literally on MongoDB (#11807) |
| `71a5f02a9` | 2026-11-10 | Gustavo Valverde | docs(device-authorization): harden approval page examples (#11440) |
| `8f4f86b58` | 2026-11-10 | better-release[bot] | chore: release v1.7.20 (#12379) |
| `5638e00d2` | 2026-11-10 | Gustavo Valverde | refactor(sso): remove the ACS lookup that always returned undefined (#11745) |
| `1a368a153` | 2026-11-10 | Gustavo Valverde | fix(oauth-provider): resolve resource client defaults from the auth context (#12234) |
| `dc07ae456` | 2026-11-10 | Gustavo Valverde | fix(oauth-provider): bind prelogin client lookup to the signed query's client_id (#12237) |
| `265629cb9` | 2026-11-10 | Gustavo Valverde | fix(prisma-adapter): keep insensitive filters case-insensitive on keyed updates (#11809) |
| `a3f50d064` | 2026-11-10 | Gustavo Valverde | fix(oauth-provider): support http deployments on private networks (#11904) |
| `42d40c0bb` | 2026-11-10 | Gustavo Valverde | test(drizzle-adapter): fix schema type-check timeouts under CI load (#12355) |
| `8654ff2f1` | 2026-11-10 | Gustavo Valverde | fix(sso): apply the default SAML clock skew to samlify's assertion window (#12309) |
| `e9b43d714` | 2026-11-10 | Gustavo Valverde | fix(prisma-adapter): match unset fields for eq null on MongoDB (#11806) |
| `eb7b4f4b0` | 2026-11-10 | Gustavo Valverde | docs(oauth-provider): match the 1.7 docs to the code (#12303) |
| `8e0f7d72d` | 2026-11-10 | Gustavo Valverde | docs: correct OAuth provider, SSO, and rate limit details (#12302) |
| `52315bca3` | 2026-11-10 | Gustavo Valverde | test(e2e): fix two intermittent failures in the SCIM demo spec (#12354) |
| `121d5ea31` | 2026-11-10 | better-release[bot] | chore: release v1.7.19 (#12285) |
| `5304290c5` | 2026-11-10 | Taesu | ci(release-tooling): credit commit co-authors in release note contributors (#12371) |
| `27a276979` | 2026-11-10 | Taesu | test(e2e): measure Kysely in the minimal bundle from the esbuild metafile (#12370) |
| `34ee1008d` | 2026-11-10 | Taesu | fix(oauth2): reject a refresh response without an access token (#12369) |
| `23a60a31f` | 2026-11-09 | Taesu | fix(siwe): create the user, wallet address and account atomically (#12366) |
| `339414f9b` | 2026-11-09 | Taesu | fix(expo): stop logging provider config errors on every authorization proxy request (#12368) |
| `d8aedc28d` | 2026-11-09 | Jonathan Samines | docs: document infra compatibility matrix (#12365) |
| `7473d304a` | 2026-11-09 | Jonathan Samines | docs: update dash endpoints reference (#12364) |
| `e786566dc` | 2026-11-09 | Taesu | fix(admin): create the user and credential account atomically (#12338) |
| `c41f8ff08` | 2026-11-09 | Taesu | fix(admin): hash the password before creating the user in create-user (#12335) |
| `29e45f84d` | 2026-11-09 | Taesu | fix(username): avoid hanging social sign-up when a username is mapped (#12340) |
| `3f1021d79` | 2026-11-09 | Gustavo Valverde | test(passkey): cover verify-registration with a revoked cached session (#12353) |
| `ac778b70e` | 2026-11-09 | Taesu | fix(client): honor method passed in second-argument fetch options (#12336) |
| `5f0a0fcef` | 2026-11-09 | Taesu | fix(open-api): document query parameters of optional query schemas (#12337) |
| `abff01dab` | 2026-11-09 | Felix Lu | docs(api-key): document defaultExpiresIn in seconds (#12256) |
| `89e74b81e` | 2026-11-09 | Taesu | fix(organization): return `INVITATION_NOT_FOUND` code from get-invitation (#12332) |
| `76f9d554b` | 2026-11-09 | Taesu | fix(oauth-provider): store client metadata as an object in json columns (#12328) |
| `b0f795a0b` | 2026-11-09 | Taesu | fix(oauth-provider): reject unprefixed client secrets through the standard invalid_client response (#12327) |
| `a10121d33` | 2026-11-09 | Taesu | fix(session): never store the active-sessions list without an expiry (#12323) |
| `6080a5e54` | 2026-11-09 | Taesu | fix(oauth-provider): allow oauth2Consent through auth.api without a Request (#12325) |
| `525bd7a7d` | 2026-11-09 | Taesu | fix(organization): return an empty page from listMembers when no members match (#12318) |
| `2d5ef64da` | 2026-11-09 | Taesu | fix(oauth): keep database OAuth state valid during the DST fall-back hour (#12320) |
| `4b0327bfa` | 2026-11-09 | Taesu | fix(db): keep plugin schema overrides local to each plugin instance (#12319) |
| `76e6a207e` | 2026-11-09 | Taesu | fix(mcp): accept HTTP resources on .localhost subdomains (#12322) |
| `8412a5f43` | 2026-11-09 | Taesu | fix(core): stop printing raw fallback join errors with console.error (#12317) |
| `43316b292` | 2026-11-09 | bucabay | docs: add @mailkite/better-auth-inbox to community plugins (#12313) |
| `de6ef28b8` | 2026-11-08 | Taesu | fix(cli): show the cause of failures without stack traces or false success (#12305) |
| `3981fe4ef` | 2026-11-08 | dependabot[bot] | chore(deps): bump anthropics/claude-code-action from 1.0.262 to 1.0.266 in the github-actions group (#12308) |
| `a63237e0b` | 2026-11-08 | Taesu | docs(device-authorization): clarify client validation behavior (#12306) |
| `5eb69d837` | 2026-11-08 | Arya Kesarwani | fix(device-authorization): return invalid_client for rejected client on /device/token (#12246) |
| `103f02956` | 2026-11-08 | Taesu | docs: use signOut in server action cookie examples (#12304) |
| `ba59f5d8e` | 2026-11-06 | Taesu | test(waku): align the fixture with the guide and cover action redirects (#12290) |
| `6168d08a3` | 2026-11-07 | Taesu | ci: run publishing and automation workflows only in better-auth/better-auth (#12291) |
| `6a32d8e69` | 2026-11-06 | Taesu | fix(cli): keep notices off stdout so results stay clean (#12287) |
| `79f2d890f` | 2026-11-06 | Nihal Gonsalves | docs: update waku guide for 1.0.0-rc.4, fix plugin example (#12187) |
| `9a5b6acda` | 2026-11-06 | Taesu | fix(cli): fail fast instead of prompting in non-interactive runs (#12286) |
| `56a849bb7` | 2026-11-07 | Taesu | fix(cli): stop reporting canceled and failed runs as success (#12275) |
| `ef8fe525d` | 2026-11-06 | Taesu | docs: add expand toggles to sidebar folders (#12274) |
| `584f2011e` | 2026-11-06 | Michael Li | docs: add @mockatoo/connect-better-auth to community plugins (#12247) |
| `b2a505f94` | 2026-11-06 | Taesu | test(sveltekit): wait for hydration before submitting the form (#12273) |
| `3c67b8eb4` | 2026-11-06 | Taesu | test(e2e): share one server launcher across integration tests (#12272) |
| `d487e35db` | 2026-11-06 | Taesu | chore: remove stale workspace changelogs (#12270) |
| `92928a54f` | 2026-11-06 | Taesu | docs(blog): move advisory links from titles to GHSA IDs (#12271) |
| `41fdc7070` | 2026-11-06 | Taesu | test(waku): improve server lifecycle and cover API sign-out (#12269) |
| `77fa730c2` | 2026-11-06 | Ankur Datta | docs(prisma): pin Prisma 7 packages and link the Prisma 7 docs (#12229) |
| `55d076e6e` | 2026-11-05 | better-release[bot] | docs: sync v1.8 documentation (#12209) |
| `38f43e390` | 2026-11-05 | better-release[bot] | chore: release v1.7.18 (#12252) |
| `9e2a0ecbe` | 2026-11-05 | Gustavo Valverde | fix(session): revoke sessions created while bulk revocation runs (#12259) |
| `9342a73e3` | 2026-11-04 | Gustavo Valverde | fix(core): accept introspected tokens when verifyOptions.typ is set (#12249) |
| `e7c728856` | 2026-11-04 | Gustavo Valverde | docs: split OAuth provider and SSO pages into folders (#12232) |
| `278bb2819` | 2026-11-04 | Gustavo Valverde | fix(test-utils): close the instance's own Postgres and SQLite handles (#12250) |
| `85f434247` | 2026-11-04 | Gustavo Valverde | fix(test-utils): make testWith mysql work and run it in CI (#12244) |
| `499f1fd62` | 2026-11-04 | Jonathan Samines | docs: update sentinel and audit events docs (#12245) |
| `11ef66e8e` | 2026-11-04 | Jonathan Samines | docs: add docs for sentinel headers feature (#12243) |
| `d92e97375` | 2026-11-04 | Gustavo Valverde | docs(rate-limit): explain which IP headers are safe to list (#12236) |
| `e3ae9e1c9` | 2026-11-04 | better-release[bot] | chore: release v1.7.17 (#12214) |
| `f9d62dbed` | 2026-11-05 | Taesu | chore: remove jsdoc-only changeset (#12235) |
| `e0d618542` | 2026-11-04 | Gustavo Valverde | docs(rate-limit): explain how Better Auth finds the client IP (#12226) |
| `b6a87ad96` | 2026-11-04 | Ali A. | fix(cookies): clear the dont_remember marker on a remembered sign-in (#12181) |
| `164323577` | 2026-11-04 | Nihal Gonsalves | test: add waku integration test (1.0.0-rc.4) (#12186) |
| `fbff53792` | 2026-11-04 | Taesu | fix(two-factor): honor trusted devices when the sign-in step runs on custom paths (#12228) |
| `96388e0ea` | 2026-11-04 | Taesu | chore: bump react (#12230) |
| `3ab3dbf6d` | 2026-11-04 | Taesu | fix(passkey): keep base URL mode per auth instance (#12225) |
| `7879d6da2` | 2026-11-04 | İsmail Karslı | docs: add `@typesql/better-auth` to community adapters (#12221) |
| `fc2e00bb4` | 2026-11-04 | Taesu | fix(kysely-adapter): run MySQL insert and read-back in one transaction (#12220) |
| `16aa41252` | 2026-11-04 | Taesu | fix(origin-check): validate IPv4 octets in IP wildcard trusted origins (#12217) |
| `9150314da` | 2026-11-04 | Taesu | fix(phone-number): treat empty phone number as missing (#12219) |
| `cff7c1ced` | 2026-11-04 | Taesu | fix(device-authorization): reject revoked cached sessions on deny (#12216) |
| `b00bff028` | 2026-11-04 | Taesu | fix(expo): require state before setting oauth state cookie (#12218) |
| `9ba3ac664` | 2026-11-04 | dependabot[bot] | chore(deps): bump the github-actions group with 2 updates (#12169) |
| `b251957f7` | 2026-11-03 | Bereket Engida | docs(blog): link advisories and group them by severity (#12215) |
| `f5be35166` | 2026-11-04 | Taesu | fix: keep sessions created by delete hooks during bulk revocation (#12212) |
| `98bcd9849` | 2026-11-04 | Taesu | fix(two-factor): accept API key sessions when verifying TOTP enrollment (#12211) |
| `fbeab6605` | 2026-11-03 | Daniel Merja | docs: add better-auth-trustware to community plugins (#12189) |
| `a34fb5fa4` | 2026-11-03 | Bereket Engida | docs(blog): use callout for Vercel WAF note (#12208) |
| `e7200d132` | 2026-11-04 | better-release[bot] | docs: sync v1.8 documentation (#12206) |
| `d0b832f2f` | 2026-11-04 | Taesu | docs: update blog post (#12200) |
| `4d01463f2` | 2026-11-04 | Taesu | ci: deduplicate auth utils for Nuxt builds (#12203) |
| `93edae16e` | 2026-11-04 | better-release[bot] | chore: release v1.7.16 (#12199) |
| `f25081ac0` | 2026-11-04 | Taesu | fix: harden authentication flows (#12198) |
| `0e75ddcf3` | 2026-11-01 | better-release[bot] | docs: sync v1.8 documentation (#12176) |
| `19f20ab26` | 2026-11-01 | better-release[bot] | docs: sync v1.6 documentation (#12172) |
| `e556c07ce` | 2026-11-01 | better-release[bot] | chore: release v1.7.15 (#12101) |
| `1f0bde1fd` | 2026-10-30 | Taesu | fix(cli): stop init from hanging on database migration (#12148) |
| `804ba8aa3` | 2026-10-30 | Taesu | fix(api): keep response headers set by before hooks (#12145) |
| `f63fb0ec2` | 2026-10-30 | Taesu | fix: accept constructor keys in strict JSON parsing (#12142) |
| `514f8a2f9` | 2026-10-30 | Taesu | fix(cli): generate resource route handler for remix and react router v7 (#12118) |
| `9dddbf4f6` | 2026-10-30 | Taesu | fix(cli): run login and logout directly instead of re-invoking the CLI (#12110) |
| `9ce8b2c72` | 2026-10-30 | Taesu | fix(api-key): accept parsed JSON from secondary storage (#12107) |
| `9fbda445e` | 2026-10-30 | Taesu | chore: fix spell check (#12138) |
| `a7b085f30` | 2026-10-30 | TOSH KUMAR PATEL | docs: update better-auth-multi-tenant description (#12124) |
| `a483eafdd` | 2026-10-30 | Seifeddine Largat | docs: add better-auth-waitlist to community plugins (#12128) |
| `c6fbff177` | 2026-10-30 | Taesu | docs(blog): explain security release process (#12130) |
| `95d158b04` | 2026-10-29 | Taesu | test(session): stabilize refresh and expiration tests (#12116) |
| `0c8b44ad2` | 2026-10-30 | Taesu | docs(blog): list security release lines (#12115) |
| `ae6d759b0` | 2026-10-30 | Taesu | docs(blog): preannounce 2026-11-03 security release (#12113) |
| `9ef0c5bda` | 2026-10-29 | Taesu | fix(core): refuse redirects on built-in provider token and key requests (#12106) |
| `ace1f2779` | 2026-10-29 | Taesu | fix(cli): keep unparsable MCP config files when running `auth ai` (#12111) |
| `264de2b89` | 2026-10-29 | Taesu | fix(client): keep vue ssr session fetch relative without baseURL (#12109) |
| `1391673e2` | 2026-10-29 | Taesu | fix(generic-oauth): encode HubSpot access token as a path parameter (#12108) |
| `8e7c5e969` | 2026-10-29 | Josh | docs: add better-auth-loginllama to community plugins (#12090) |
| `e7dec6fc2` | 2026-10-29 | Enes Koç | docs: add tauri-plugin-better-auth to community plugins (#11942) |
| `4af793f1c` | 2026-10-29 | Taesu | fix(stripe): reject non-string success query values (#12105) |
| `3b3a5957a` | 2026-10-29 | Taesu | fix(stripe): validate success callbackURL after session id replacement (#12102) |
| `459292386` | 2026-10-29 | Taesu | fix(cimd): reject status lines Response cannot represent in the Node transport (#12103) |
| `6e7fa279a` | 2026-10-29 | Taesu | fix(username): honor validationOrder on sign-in and availability check (#12097) |
| `7769e91a3` | 2026-10-29 | Taesu | fix(admin): reject banned users when creating sessions outside an endpoint (#12100) |
| `3f1719302` | 2026-10-29 | Taesu | fix(admin): reject `id` in update-user data (#12099) |
| `4cdcb1c00` | 2026-10-29 | Taesu | fix: report position instead of value in BETTER_AUTH_SECRETS errors (#12098) |
| `8f39145dc` | 2026-10-28 | better-release[bot] | docs: sync v1.8 documentation (#12021) |
| `bdb130449` | 2026-10-26 | Jonathan Samines | docs: add custom field mapping for managed SCIM docs (#12059) |
| `a936663d3` | 2026-10-26 | better-release[bot] | chore: release v1.7.14 (#12055) |
| `63fa154a1` | 2026-10-26 | Taesu | docs(guides): fix Clerk migration script for empty fields and passwords (#12056) |
| `d2cb7f56c` | 2026-10-26 | Taesu | fix(two-factor): accept imported Base32 TOTP secrets (#12031) |
| `2947ab76c` | 2026-10-26 | Jewook (Mason) Yoo | fix(kakao): forward `loginHint` to the authorization URL (#12045) |
| `58485bea5` | 2026-10-25 | armful | docs: add better-auth-captcha to community plugins (#12038) |
| `6d597d946` | 2026-10-25 | Taesu | chore(deps): bump `@playwright/test` to 1.64.1 (#12032) |
| `7f6108148` | 2026-10-25 | better-release[bot] | chore: release v1.7.13 (#11994) |
| `87461073b` | 2026-10-25 | Taesu | chore(deps): bump nuxt, mariadb adapter and patched transitive deps (#12023) |
| `660839741` | 2026-10-25 | dependabot[bot] | chore(deps): bump anthropics/claude-code-action from 1.0.252 to 1.0.253 in the github-actions group (#12026) |
| `d57596651` | 2026-10-25 | Taesu | chore: bump `@better-auth/utils` and `@better-fetch/fetch` (#12016) |
| `ccf698c80` | 2026-10-25 | dependabot[bot] | chore(deps): bump the github-actions group across 1 directory with 14 updates (#12002) |
| `fd1e64393` | 2026-10-25 | dependabot[bot] | chore(deps): bump zod from 4.5.4 to 4.6.6 in /demo/nextjs (#12017) |
| `e2a55a433` | 2026-10-25 | Taesu | ci(zizmor): scope app tokens and ignore maintainer-only comment triggers (#12015) |
| `d25b91e76` | 2026-10-24 | Zeeshan | docs(two-factor): mark userId as required in viewBackupCodes (#12006) |
| `ea3cbfdd3` | 2026-10-24 | Zeeshan | docs(organization): addMember requires userId (#12007) |
| `b6820be45` | 2026-10-24 | Taesu | test(stripe): fix type errors in tests (#12013) |
| `e24e52f1f` | 2026-10-24 | Zeeshan | docs(organization): metadata in updateOrganization is not nullable (#12008) |
| `61ac79790` | 2026-10-24 | Taesu | fix(demo): align stripe version (#12012) |
| `da53faea2` | 2026-10-24 | godwitbo | feat(stripe): support Stripe SDK v23 (#11954) |
| `d32b5b271` | 2026-10-23 | Taesu | ci(dependabot): limit demo updates to security fixes (#11998) |
| `2712441e3` | 2026-10-23 | Taesu | refactor(cloudflare): standardize token endpoint auth options (#11997) |
| `1c031b183` | 2026-10-23 | Taesu | chore(deps): update dependencies (#11984) |
| `9cb95fe3d` | 2026-10-23 | Taesu | fix(build): bump tsdown to 0.23.1 (#11985) |
| `1cf4b2c8f` | 2026-10-22 | Allen Zhou | feat(vercel): support token endpoint authentication strategies (#11948) |
| `1795fe135` | 2026-10-22 | better-release[bot] | docs: sync v1.8 documentation (#11878) |
| `c6a08cf4f` | 2026-10-22 | Taesu | docs: locate Typesense build output under Next.js route cache (#11979) |
| `5b2374103` | 2026-10-22 | TOSH KUMAR PATEL | docs: add better-auth-multi-tenant to community plugins (#11969) |
| `7a1ecde4c` | 2026-10-22 | Taesu | chore(deps): bump `next` to 16.4.2 (#11976) |
| `f4260a95c` | 2026-10-20 | better-release[bot] | chore: release v1.7.12 (#11922) |
| `226fb9d5b` | 2026-10-20 | Taesu | ci(release-tooling): name affected users in release note actions (#11938) |
| `626422efc` | 2026-10-20 | Taesu | ci(release-tooling): collect release note actions and share entry rules (#11937) |
| `94436b3ec` | 2026-10-20 | Taesu | ci(release-tooling): update release note models and prompts (#11936) |
| `f5ea731e6` | 2026-10-20 | Taesu | fix(sso): verify OIDC ID tokens with the shared step (#11935) |
| `2a576f39d` | 2026-10-20 | Taesu | fix(mcp): accept only OAuth access tokens in requireMcpAuth (#11934) |
| `2ad9350f9` | 2026-10-20 | Zeeshan | docs(basic-usage): use twoFactor.verifyTotp instead of verifyTOTP (#11794) |
| `2c32f84bf` | 2026-10-20 | Taesu | chore: configure Anthropic OSS Scanner (#11932) |
| `4bc78baa8` | 2026-10-20 | Taesu | fix(core): reject ID tokens when the provider has no client ID (#11931) |
| `b18e3b8fd` | 2026-10-20 | Taesu | fix(oauth-proxy): run the standard callback checks on proxied callbacks (#11930) |
| `fb4861908` | 2026-10-19 | Taesu | fix(jwt): verify tokens with the stored key's algorithm (#11925) |
| `681aa5c44` | 2026-10-19 | Taesu | fix(session): keep the cause of session lookup failures (#11924) |
| `1b24cac7b` | 2026-10-20 | Taesu | chore: bump `better-call` (#11927) |
| `e8defb7a9` | 2026-10-20 | Taesu | docs: add security contact email to `SECURITY.md` (#11926) |
| `083a74329` | 2026-10-19 | Alpcan Aydın | fix(core): accept undefined fields from mapProfileToUser under exactOptionalPropertyTypes (#11918) |
| `876608da8` | 2026-10-19 | Taesu | fix(core): verify id_tokens with one shared policy (#11919) |
| `60ccee0ba` | 2026-10-20 | Aman Kushwaha | feat(plugin): add `@amank-root/better-auth-razorpay` to community plugin (#11917) |
| `0c691b60b` | 2026-10-19 | Taesu | chore: bump `better-call` (#11921) |
| `492134aeb` | 2026-10-19 | Taesu | fix(oauth): restore Twitch and Paybin ID token handling (#11920) |
| `f9ac70660` | 2026-10-19 | starslingdev[bot] | perf(e2e): skip redundant prisma schema pushes (#9882) |
| `460425da0` | 2026-10-19 | starslingdev[bot] | perf(e2e): stop re-resolving drizzle-kit on every launch (#10850) |
| `52ab801cc` | 2026-10-19 | better-release[bot] | chore: release v1.7.11 (#11827) |
| `2f6ca3f37` | 2026-10-18 | Taesu | fix(core): accept undefined plugin init options under exactOptionalPropertyTypes (#11907) |
| `dfd8dd287` | 2026-10-18 | Taesu | fix(oauth): verify Twitch and Paybin ID tokens (#11884) |
| `9c4e3d75c` | 2026-10-19 | DevSnap | docs: add ArcadeDB to community adapters (#11895) |
| `3d6c994fc` | 2026-10-19 | Panche I. | docs: add @agentaos/better-auth to community plugins (#11896) |
| `9833f2aca` | 2026-10-18 | MarkMac | docs: add better-auth-saml-idp to community plugins (#11905) |
| `d0ca6d538` | 2026-10-17 | Panagiotis Plytas | docs: remove beta wording from good-webhooks community plugin entry (#11877) |
| `197bd7f2b` | 2026-10-17 | Taesu | docs: keep hono basePath inline code on one line (#11890) |
| `da28c189a` | 2026-10-17 | Taesu | refactor(expo): narrow native scheme in request hooks (#11889) |
| `5ba9ce51c` | 2026-10-17 | Taesu | docs: redesign docs OG image (#11888) |
| `c875131de` | 2026-10-17 | starslingdev[bot] | ci: move StarSling jobs to Ubuntu 26.04 (#11733) |
| `abee9506c` | 2026-10-17 | Taesu | fix(e2e): prevent hangs during process tree cleanup (#11885) |
| `ce965696d` | 2026-10-17 | Christoph Nakazawa | perf(core): inline OpenTelemetry attribute constants (#11623) |
| `5d3d5c4c7` | 2026-10-17 | Nooc | fix(expo): send origin for id token link social (#10207) |
| `6c48290c9` | 2026-10-16 | Taesu | test(adapter): surface swallowed assertion failures in adapter factory tests (#11817) |
| `9d89f27e9` | 2026-10-16 | Kurtis Tryber | docs: update SuperSend TX to Groundmail in the email provider list (#11879) |
| `e5b971444` | 2026-10-16 | Taesu | fix(docs): match documentation sources to release versions (#11868) |
