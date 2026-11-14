# Releases better-auth/better-auth (60 dernières)

## v1.7.24 (2026-11-14)

> [!IMPORTANT]
> **Action required**
>
> - If you accept DPoP-bound tokens, call `enforceDpopBinding` from `better-auth/oauth2` in your endpoint with the request and a shared replay store. ([#12498](https://github.com/better-auth/better-auth/pull/12498))

## `better-auth`

### Bug Fixes

- Improved verification lookups to delete expired rows at most once a minute per server instance instead of on every lookup ([#12593](https://github.com/better-auth/better-auth/pull/12593))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Clarified that `requireActiveAccessToken` checks only the token and does not enforce DPoP binding ([#12498](https://github.com/better-auth/better-auth/pull/12498))
- Fixed plugin hook and endpoint errors turning into generic 500 responses when an app installs more than one copy of `better-call` ([#12503](https://github.com/better-auth/better-auth/pull/12503))
- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))
- Fixed OAuth provider discovery to stop advertising endpoint URLs with a double slash when `baseURL` ends in `/` ([#12598](https://github.com/better-auth/better-auth/pull/12598))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/cimd`

### Bug Fixes

- Fixed plugin hook and endpoint errors turning into generic 500 responses when an app installs more than one copy of `better-call` ([#12503](https://github.com/better-auth/better-auth/pull/12503))
- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/cimd/CHANGELOG.md)

## `@better-auth/passkey`

### Bug Fixes

- Fixed plugin hook and endpoint errors turning into generic 500 responses when an app installs more than one copy of `better-call` ([#12503](https://github.com/better-auth/better-auth/pull/12503))
- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/passkey/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed plugin hook and endpoint errors turning into generic 500 responses when an app installs more than one copy of `better-call` ([#12503](https://github.com/better-auth/better-auth/pull/12503))
- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/scim/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed plugin hook and endpoint errors turning into generic 500 responses when an app installs more than one copy of `better-call` ([#12503](https://github.com/better-auth/better-auth/pull/12503))
- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/sso/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed plugin hook and endpoint errors turning into generic 500 responses when an app installs more than one copy of `better-call` ([#12503](https://github.com/better-auth/better-auth/pull/12503))
- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/stripe/CHANGELOG.md)

## `@better-auth/api-key`

### Bug Fixes

- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/api-key/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/core/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/electron/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Fixed `@better-auth/expo` to use the `better-call` copy installed by `better-auth` instead of adding a second copy to Expo apps ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/expo/CHANGELOG.md)

## `@better-auth/mcp`

### Bug Fixes

- Fixed official packages to accept any `better-call` 1.4 patch release from 1.4.5 as a peer, so plugins share one copy ([#12502](https://github.com/better-auth/better-auth/pull/12502))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/34d91fcac2dc80739724a04b16fe1c53e66eadea/packages/mcp/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.7.23...v1.7.24`](https://github.com/better-auth/better-auth/compare/v1.7.23...v1.7.24)

## v1.7.23 (2026-11-13)

> [!IMPORTANT]
> **Action required**
>
> - If you want `requireMcpAuth` to keep fetching signing keys over HTTP, set `jwksUrl`. ([#12501](https://github.com/better-auth/better-auth/pull/12501))
> - If your CORS layer sets its own `Access-Control-Expose-Headers`, include `WWW-Authenticate` in it. ([#12521](https://github.com/better-auth/better-auth/pull/12521))
> - If you run `createMcpProtectedRequestHandler` in a multi-instance or serverless deployment, set `dpop.replayStore` to a shared store such as `createDpopReplayStore(internalAdapter)`. ([#12504](https://github.com/better-auth/better-auth/pull/12504))

## `better-auth`

### Bug Fixes

- Fixed `getTestInstance` sharing one MongoDB database across test files, so parallel tests no longer delete each other's data ([#12543](https://github.com/better-auth/better-auth/pull/12543))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8fec33cdc0713c4a26bdc95e3f6bdd41067c35f0/packages/better-auth/CHANGELOG.md)

## `@better-auth/mcp`

### Bug Fixes

- Improved the `dpop.replayStore` documentation on `createMcpProtectedRequestHandler` to explain the in-memory default and when to use a shared store ([#12504](https://github.com/better-auth/better-auth/pull/12504))
- Fixed `requireMcpAuth` to accept tokens when the JWT plugin publishes its keys at `jwks.remoteUrl` ([#12501](https://github.com/better-auth/better-auth/pull/12501))
- Fixed `requireMcpAuth` returning a 500 on runtimes that block requests to their own hostname, such as a single Cloudflare Worker ([#12501](https://github.com/better-auth/better-auth/pull/12501))
- Fixed cross-origin browser clients being unable to read `WWW-Authenticate` challenges from OAuth resource servers and MCP helpers ([#12521](https://github.com/better-auth/better-auth/pull/12521))
- Fixed OAuth resource servers to answer DPoP requests lacking a required scope with a `DPoP` `insufficient_scope` challenge instead of `Bearer` ([#12525](https://github.com/better-auth/better-auth/pull/12525))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8fec33cdc0713c4a26bdc95e3f6bdd41067c35f0/packages/mcp/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed cross-origin browser clients being unable to read `WWW-Authenticate` challenges from OAuth resource servers and MCP helpers ([#12521](https://github.com/better-auth/better-auth/pull/12521))
- Fixed protected resource requests using an unsupported authorization scheme or no scheme to receive a `Bearer` challenge with `resource_metadata` ([#12515](https://github.com/better-auth/better-auth/pull/12515))
- Fixed OAuth resource servers to answer DPoP requests lacking a required scope with a `DPoP` `insufficient_scope` challenge instead of `Bearer` ([#12525](https://github.com/better-auth/better-auth/pull/12525))
- Fixed OAuth token requests that fail PKCE, `redirect_uri`, `resource`, or DPoP validation consuming the authorization or device code ([#12499](https://github.com/better-auth/better-auth/pull/12499))
- Added a warning in the OAuth provider when two extensions contribute the same discovery metadata key ([#12500](https://github.com/better-auth/better-auth/pull/12500))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8fec33cdc0713c4a26bdc95e3f6bdd41067c35f0/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Improved the `advanced.database.validateSchema` documentation to explain when validation runs and which adapters skip it ([#12480](https://github.com/better-auth/better-auth/pull/12480))
- Fixed `requireMcpAuth` returning a 500 on runtimes that block requests to their own hostname, such as a single Cloudflare Worker ([#12501](https://github.com/better-auth/better-auth/pull/12501))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8fec33cdc0713c4a26bdc95e3f6bdd41067c35f0/packages/core/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- Fixed Electron sign-in callbacks being missed on Windows and Linux when Chromium reorders or appends launch arguments ([#12490](https://github.com/better-auth/better-auth/pull/12490))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8fec33cdc0713c4a26bdc95e3f6bdd41067c35f0/packages/electron/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed the Kysely adapter on PostgreSQL failing to save `json` fields whose value is an array ([#12530](https://github.com/better-auth/better-auth/pull/12530))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8fec33cdc0713c4a26bdc95e3f6bdd41067c35f0/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/memory-adapter`

### Bug Fixes

- Fixed the memory adapter reusing the ids of stored rows when `generateId` is `"serial"` after a delete ([#12544](https://github.com/better-auth/better-auth/pull/12544))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8fec33cdc0713c4a26bdc95e3f6bdd41067c35f0/packages/memory-adapter/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @grant0417, @gustavovalverde

**Full changelog:** [`v1.7.22...v1.7.23`](https://github.com/better-auth/better-auth/compare/v1.7.22...v1.7.23)

## v1.8.0-beta.9 (2026-11-12) canary

> [!IMPORTANT]
> **Action required**
>
> - If your SAML IdP sends no email attribute and a `NameID` in another Format or with no Format, send an `email` attribute or the `emailAddress` NameID Format, set `samlConfig.mapping.email` to the attribute it sends, or return the NameID from `mapProfileToUser`. ([#12484](https://github.com/better-auth/better-auth/pull/12484))
> - If you use the OAuth provider, run `npx auth@latest migrate` or `npx auth@latest generate` before upgrading to add the new optional `act` column on `oauthAccessToken`; if you set `act` via `customAccessTokenClaims`, an extension `claims.accessToken` contributor, or a resource's `customClaims`, it is now stripped, so pass `act` to `issueTokens` in custom grants instead. ([#12439](https://github.com/better-auth/better-auth/pull/12439))
> - If your `clientAuthentication` strategy returns a DPoP key (`jkt`), the token type is now `DPoP`, so make your clients send a DPoP proof with each request to a protected resource. ([#12440](https://github.com/better-auth/better-auth/pull/12440))
> - If you have a custom `OAuthProviderApi` implementation, add the `verifyDpopProof()` and `issueDpopNonce()` methods. ([#12437](https://github.com/better-auth/better-auth/pull/12437))
> - If your clients exchange their own access tokens bound by a mechanism other than DPoP, such as an mTLS certificate in `cnf["x5t#S256"]`, have your `clientAuthentication` strategy return the same `confirmation`. ([#12438](https://github.com/better-auth/better-auth/pull/12438))

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- Added RFC 8693 delegation to `oauthTokenExchange()`, so a service can exchange tokens with an `actor_token` and get an `act` claim ([#12439](https://github.com/better-auth/better-auth/pull/12439))

### Features

- Added an `expectedJkt` option to `provider.resolveConfirmation()` so extension grants can keep a DPoP-bound token bound to the same key ([#12436](https://github.com/better-auth/better-auth/pull/12436))
- Added `verifyDpopProof()` and `issueDpopNonce()` to `getOAuthProviderApi` so plugin endpoints can verify DPoP proofs and nonces ([#12437](https://github.com/better-auth/better-auth/pull/12437))

### Bug Fixes

- Fixed `client_credentials` tokens to be bound to the `confirmation` returned by a `clientAuthentication` strategy, such as an mTLS certificate thumbprint ([#12440](https://github.com/better-auth/better-auth/pull/12440))
- Fixed the OAuth provider to reject a malformed sender-constraint `confirmation` with `server_error` instead of issuing a token ([#12443](https://github.com/better-auth/better-auth/pull/12443))
- Fixed `oauthTokenExchange()` to require a matching `confirmation` when a client exchanges its own access token bound by a mechanism other than DPoP ([#12438](https://github.com/better-auth/better-auth/pull/12438))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3d00e4d99d4f36859c491a49cabc3c047080bdc/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Added a `mapProfileToUser` option so OIDC and SAML SSO providers that send no email can still sign users in ([#12484](https://github.com/better-auth/better-auth/pull/12484))
- Changed SAML sign-in to use the `NameID` as the user's email only when its `Format` is the `emailAddress` format ([#12484](https://github.com/better-auth/better-auth/pull/12484))
- Fixed SAML users who sign in without a name attribute to get their email as their name instead of an opaque `NameID` ([#12484](https://github.com/better-auth/better-auth/pull/12484))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3d00e4d99d4f36859c491a49cabc3c047080bdc/packages/sso/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.8.0-beta.8...v1.8.0-beta.9`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.8...v1.8.0-beta.9)

## v1.7.22 (2026-11-12)

## `better-auth`

### Bug Fixes

- Fixed verification value consumption hanging on Cloudflare Workers when an earlier request for the same identifier ended mid-query ([#12451](https://github.com/better-auth/better-auth/pull/12451))
- Fixed module-scope auth instances on Cloudflare Workers logging a schema validation error on every cold start by validating on first use ([#12448](https://github.com/better-auth/better-auth/pull/12448))
- Fixed `deferSessionRefresh` refresh requests failing with a 415 error in Next.js and Nuxt ([#12330](https://github.com/better-auth/better-auth/pull/12330))
- Fixed `ReferenceError: window is not defined` when a client session subscription is cleaned up after a test environment tears down its globals ([#12324](https://github.com/better-auth/better-auth/pull/12324))
- Fixed client session refresh listeners piling up on the server during SSR ([#12324](https://github.com/better-auth/better-auth/pull/12324))
- Fixed session polling never firing when the runtime's `navigator` does not report connectivity ([#12462](https://github.com/better-auth/better-auth/pull/12462))
- Fixed OAuth sign-up rejected by a `user.create.before` hook returning `false` logging a `TypeError` ([#12331](https://github.com/better-auth/better-auth/pull/12331))
- Fixed `deleteOrganization` clearing the session's active organization when a `beforeDeleteOrganization` hook rejected the delete ([#12334](https://github.com/better-auth/better-auth/pull/12334))
- Fixed `revokeSession`, `revokeSessions`, and `deleteUser({ token })` to expire session cookies when revoking the current session or deleting the user ([#12321](https://github.com/better-auth/better-auth/pull/12321))
- Fixed `getSession` to no longer leave an expired session in the request context after returning `null` ([#12459](https://github.com/better-auth/better-auth/pull/12459))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/88396b0f250ea58a9e28f35325d8b8c6dfb435ae/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed introspected access tokens that fail `aud`, `iss`, `exp`, or `nbf` claim checks to return a 401 instead of a 500 ([#12432](https://github.com/better-auth/better-auth/pull/12432))
- Fixed `getSession` failing with "Failed to get session" when a `user.additionalFields` entry references a table outside the Better Auth schema ([#12333](https://github.com/better-auth/better-auth/pull/12333))
- Fixed resource-server challenges turning rejected requests into 500 errors, and added `invalid_token` error details when a presented token fails verification ([#12445](https://github.com/better-auth/better-auth/pull/12445))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/88396b0f250ea58a9e28f35325d8b8c6dfb435ae/packages/core/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed failed requests using the `DPoP` authorization scheme to receive a `DPoP` challenge instead of a `Bearer` challenge ([#12447](https://github.com/better-auth/better-auth/pull/12447))
- Fixed resource-server challenges turning rejected requests into 500 errors, and added `invalid_token` error details when a presented token fails verification ([#12445](https://github.com/better-auth/better-auth/pull/12445))
- Fixed `/oauth2/userinfo` to send a `WWW-Authenticate` challenge on every 401 response, including DPoP failures and requests with no token ([#12446](https://github.com/better-auth/better-auth/pull/12446))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/88396b0f250ea58a9e28f35325d8b8c6dfb435ae/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed `getSession` failing with "Failed to get session" when a `user.additionalFields` entry references a table outside the Better Auth schema ([#12333](https://github.com/better-auth/better-auth/pull/12333))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/88396b0f250ea58a9e28f35325d8b8c6dfb435ae/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/mcp`

### Bug Fixes

- Fixed failed requests using the `DPoP` authorization scheme to receive a `DPoP` challenge instead of a `Bearer` challenge ([#12447](https://github.com/better-auth/better-auth/pull/12447))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/88396b0f250ea58a9e28f35325d8b8c6dfb435ae/packages/mcp/CHANGELOG.md)

## `@better-auth/prisma-adapter`

### Bug Fixes

- Fixed `getSession` failing with "Failed to get session" when a `user.additionalFields` entry references a table outside the Better Auth schema ([#12333](https://github.com/better-auth/better-auth/pull/12333))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/88396b0f250ea58a9e28f35325d8b8c6dfb435ae/packages/prisma-adapter/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed Stripe `customer.subscription.updated` webhooks for customers with no local subscription to log a clear warning instead of failing with a `TypeError` ([#12473](https://github.com/better-auth/better-auth/pull/12473))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/88396b0f250ea58a9e28f35325d8b8c6dfb435ae/packages/stripe/CHANGELOG.md)

## `@better-auth/telemetry`

### Bug Fixes

- Fixed requests failing on Cloudflare Workers for module-scope auth instances when telemetry is enabled without a static `baseURL` ([#12448](https://github.com/better-auth/better-auth/pull/12448))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/88396b0f250ea58a9e28f35325d8b8c6dfb435ae/packages/telemetry/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@AmalkrishnaAS, @Bekacru, @bytaesu, @choksi2212, @flcrom, @ghazy2001, @gustavovalverde, @mrpmohiburrahman, @umeraamir69

**Full changelog:** [`v1.7.21...v1.7.22`](https://github.com/better-auth/better-auth/compare/v1.7.21...v1.7.22)

## v1.8.0-beta.8 (2026-11-11) canary

> [!IMPORTANT]
> **Action required**
>
> - If you set an `Authorization` entry in `authorizationHeaders` or pass `authorization` in `headers` to the `@better-auth/core/oauth2` token request functions, remove it and set the header from `customizeRequest` with `tokenEndpointAuth` method `custom`, which must also set every credential the provider requires. ([#12416](https://github.com/better-auth/better-auth/pull/12416))
> - If you use the built-in Kysely adapter, run `npx auth@latest migrate`; if you use Prisma or Drizzle, run `npx auth@latest generate` and apply the migration before deploying, to add the `expiresAt` column to `oauthClient`. MongoDB needs no migration. ([#11802](https://github.com/better-auth/better-auth/pull/11802))
> - If you use built-in ID token verification and clients send an opaque (non-JWT) token such as a Facebook Graph access token together with a `nonce`, stop sending the `nonce`, because those requests are now rejected. If you use a custom `verifyIdToken`, compare the nonce to the token's claim yourself. ([#11823](https://github.com/better-auth/better-auth/pull/11823))
> - If you call `/one-tap/callback` or `auth.api.oneTapCallback` yourself, first call `POST /one-tap/nonce`, pass the returned `nonce` to `google.accounts.id.initialize({ nonce })`, and send it as `nonce` in the callback body. If you set the client's `nonce` option or a `nonce` in `additionalOptions`, remove it. ([#11823](https://github.com/better-auth/better-auth/pull/11823))

## `better-auth`

### ❗ Breaking Changes

- Changed generic OAuth to fail at startup when `authorizationHeaders` contains an `Authorization` entry, and made `validateAuthorizationCode`, `authorizationCodeRequest`, `refreshAccessToken`, and `refreshAccessTokenRequest` throw when passed `authorization` in `headers` ([#12416](https://github.com/better-auth/better-auth/pull/12416))
- Added `requireIssuedIdTokenNonce` for social providers to bind client-submitted ID tokens to a single-use server-issued nonce ([#11823](https://github.com/better-auth/better-auth/pull/11823))
- Changed `/one-tap/callback` to require a single-use nonce from the new `POST /one-tap/nonce` endpoint so each Google ID token signs in only once ([#11823](https://github.com/better-auth/better-auth/pull/11823))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/dcf6cc077e696cb90a33c3c4285b24fb3f4831dc/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### ❗ Breaking Changes

- Changed generic OAuth to fail at startup when `authorizationHeaders` contains an `Authorization` entry, and made `validateAuthorizationCode`, `authorizationCodeRequest`, `refreshAccessToken`, and `refreshAccessTokenRequest` throw when passed `authorization` in `headers` ([#12416](https://github.com/better-auth/better-auth/pull/12416))
- Added `requireIssuedIdTokenNonce` for social providers to bind client-submitted ID tokens to a single-use server-issued nonce ([#11823](https://github.com/better-auth/better-auth/pull/11823))

### Features

- Added support for server-provided DPoP nonces in the OAuth provider through `dpop: { nonce: { required: true } }`, plus resource server support with `verifyAccessTokenRequest`, `createResourceServerChallenge`, and `createDpopNonce` ([#12376](https://github.com/better-auth/better-auth/pull/12376))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/dcf6cc077e696cb90a33c3c4285b24fb3f4831dc/packages/core/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Features

- Added support for server-provided DPoP nonces in the OAuth provider through `dpop: { nonce: { required: true } }`, plus resource server support with `verifyAccessTokenRequest`, `createResourceServerChallenge`, and `createDpopNonce` ([#12376](https://github.com/better-auth/better-auth/pull/12376))

### Bug Fixes

- Fixed OAuth provider client secret expiry so it is saved, returned as `client_secret_expires_at`, and enforced with `invalid_client` at the token, introspection, and revocation endpoints ([#11802](https://github.com/better-auth/better-auth/pull/11802))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/dcf6cc077e696cb90a33c3c4285b24fb3f4831dc/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/mcp`

### Features

- Added support for server-provided DPoP nonces in the OAuth provider through `dpop: { nonce: { required: true } }`, plus resource server support with `verifyAccessTokenRequest`, `createResourceServerChallenge`, and `createDpopNonce` ([#12376](https://github.com/better-auth/better-auth/pull/12376))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/dcf6cc077e696cb90a33c3c4285b24fb3f4831dc/packages/mcp/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.8.0-beta.7...v1.8.0-beta.8`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.7...v1.8.0-beta.8)

## v1.7.21 (2026-11-11)

> [!IMPORTANT]
> **Action required**
>
> - If you use SCIM with an adapter that has no native transactions, switch to an adapter with native transactions to provision users and groups. ([#12413](https://github.com/better-auth/better-auth/pull/12413))
> - If you use the MongoDB adapter and an index build fails because of duplicate values, missing `createIndex` permission, or a conflicting index on the same field, fix the cause and restart. ([#12299](https://github.com/better-auth/better-auth/pull/12299))
> - If you rely on `update` changing every row that matches a non-unique filter, use `updateMany` instead. ([#12390](https://github.com/better-auth/better-auth/pull/12390))
> - If you set `discoveryHeaders` and your `discoveryUrl` redirects to another origin, set `discoveryUrl` to the final URL, because discovery now fails on cross-origin redirects. ([#12179](https://github.com/better-auth/better-auth/pull/12179))
> - If your clients match on the `invalid_client_metadata` error code for rejected `post_logout_redirect_uris`, update them to check for `invalid_redirect_uri`. ([#12391](https://github.com/better-auth/better-auth/pull/12391))
> - If you throw from `sendVerificationEmail` to reject a sign-up, use a `databaseHooks.user.create.before` hook instead, because a thrown error is now logged and the sign-up still succeeds. ([#12052](https://github.com/better-auth/better-auth/pull/12052))
> - If a wildcard in `baseURL.allowedHosts` covers your passkey `rpID`, you don't set `origin`, and you add tenants at runtime, return their origins from a `trustedOrigins` function that checks your tenant records. ([#12388](https://github.com/better-auth/better-auth/pull/12388))

## `better-auth`

### Bug Fixes

- Fixed plugin packages importing from the `better-auth` root, so bundlers no longer emit unused Kysely chunks when used with `better-auth/minimal` ([#12404](https://github.com/better-auth/better-auth/pull/12404))
- Fixed magic link and email OTP sign-in failing with a 500 for users with an unverified email on Prisma with MongoDB when id columns use `@db.ObjectId` ([#12126](https://github.com/better-auth/better-auth/pull/12126))
- Fixed the device approval page showing a valid code as invalid when the same signed-in user looked it up twice at once, such as under React Strict Mode ([#12392](https://github.com/better-auth/better-auth/pull/12392))
- Fixed sign-ins with a `genericOAuth` provider using `discoveryUrl` and OAuth provider requests using `resources` hanging on Cloudflare Workers ([#12395](https://github.com/better-auth/better-auth/pull/12395))
- Fixed Generic OAuth to send `authorizationHeaders` on access token refresh, added an optional `headers` input to `refreshAccessToken` and `refreshAccessTokenRequest`, and prevented invalid combined headers with differently cased client authentication headers ([#12401](https://github.com/better-auth/better-auth/pull/12401))
- Fixed generic OAuth to send `discoveryHeaders` when fetching same-origin `jwks_uri` keys, and to follow discovery redirects only within the `discoveryUrl` origin ([#12179](https://github.com/better-auth/better-auth/pull/12179))
- Fixed intermittent `schema does not exist` and `relation does not exist` errors on PostgreSQL during the startup schema check and `npx auth@latest migrate` when other schemas are dropped concurrently ([#11912](https://github.com/better-auth/better-auth/pull/11912))
- Fixed email sign-up to keep database writes made while sending verification emails or running `onExistingUserSignUp` when using a background task handler with a transactional adapter ([#12052](https://github.com/better-auth/better-auth/pull/12052))
- Fixed SIWE verification to stop exposing internal error messages in its 401 response and log them on the server instead ([#12403](https://github.com/better-auth/better-auth/pull/12403))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed the OAuth provider returning `[object Promise]` instead of the refresh token when `formatRefreshToken.encrypt` is async ([#12409](https://github.com/better-auth/better-auth/pull/12409))
- Fixed magic link and email OTP sign-in failing with a 500 for users with an unverified email on Prisma with MongoDB when id columns use `@db.ObjectId` ([#12126](https://github.com/better-auth/better-auth/pull/12126))
- Fixed sign-ins with a `genericOAuth` provider using `discoveryUrl` and OAuth provider requests using `resources` hanging on Cloudflare Workers ([#12395](https://github.com/better-auth/better-auth/pull/12395))
- Changed OAuth provider client registration and updates to return `invalid_redirect_uri` instead of `invalid_client_metadata` for rejected `post_logout_redirect_uris` entries ([#12391](https://github.com/better-auth/better-auth/pull/12391))
- Fixed OAuth provider returning a 500 on near-simultaneous refresh token reuse for opaque access tokens on databases that enforce foreign keys ([#11911](https://github.com/better-auth/better-auth/pull/11911))
- Fixed OAuth provider consent denial to redirect to the client only while the client is enabled and its `redirect_uri` is still valid ([#12385](https://github.com/better-auth/better-auth/pull/12385))
- Fixed OAuth provider to revoke in-flight opaque access tokens after refresh token reuse or a replayed authorization code on databases without foreign keys ([#12389](https://github.com/better-auth/better-auth/pull/12389))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed `null` filters on `id` and reference fields being coerced to `0` when `advanced.database.generateId` is `"serial"` ([#12402](https://github.com/better-auth/better-auth/pull/12402))
- Fixed authentication requests hanging on Cloudflare Workers when the request that started schema validation ended before validation finished ([#11716](https://github.com/better-auth/better-auth/pull/11716))
- Fixed magic link and email OTP sign-in failing with a 500 for users with an unverified email on Prisma with MongoDB when id columns use `@db.ObjectId` ([#12126](https://github.com/better-auth/better-auth/pull/12126))
- Fixed Generic OAuth to send `authorizationHeaders` on access token refresh, added an optional `headers` input to `refreshAccessToken` and `refreshAccessTokenRequest`, and prevented invalid combined headers with differently cased client authentication headers ([#12401](https://github.com/better-auth/better-auth/pull/12401))
- Fixed telemetry to report Cloudflare Workers as `workerd` instead of `node` when `nodejs_compat` is enabled, and exported the runtime detection from `@better-auth/core/env` ([#12425](https://github.com/better-auth/better-auth/pull/12425))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/core/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed plugin packages importing from the `better-auth` root, so bundlers no longer emit unused Kysely chunks when used with `better-auth/minimal` ([#12404](https://github.com/better-auth/better-auth/pull/12404))
- Fixed SAML Single Logout so refreshing a session extends that session's own logout record, for users signed in more than once with the same NameID on the Prisma or MongoDB adapter ([#12424](https://github.com/better-auth/better-auth/pull/12424))
- Fixed SAML Single Logout (`saml.enableSingleLogout`) for users who stay signed in past their session's first expiry, for both IdP-initiated and SP-initiated logout ([#12417](https://github.com/better-auth/better-auth/pull/12417))
- Fixed SAML replay protection to reject a signed response resubmitted with its assertion ID written as XML character references when `allowIdpInitiated: true` or `enableInResponseToValidation: false` is set ([#12421](https://github.com/better-auth/better-auth/pull/12421))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/sso/CHANGELOG.md)

## `@better-auth/prisma-adapter`

### Bug Fixes

- Fixed magic link and email OTP sign-in failing with a 500 for users with an unverified email on Prisma with MongoDB when id columns use `@db.ObjectId` ([#12126](https://github.com/better-auth/better-auth/pull/12126))
- Fixed Prisma adapter updates comparing a unique field with `null` failing with a validation error, and `update` now changes only one matching row ([#12390](https://github.com/better-auth/better-auth/pull/12390))
- Fixed the Prisma adapter with `provider: "mongodb"` to match `contains`, `starts_with`, `ends_with`, and case-insensitive filters as literal text instead of regex patterns ([#11807](https://github.com/better-auth/better-auth/pull/11807))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/prisma-adapter/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed plugin packages importing from the `better-auth` root, so bundlers no longer emit unused Kysely chunks when used with `better-auth/minimal` ([#12404](https://github.com/better-auth/better-auth/pull/12404))
- Fixed SCIM Groups with more than 100 members to sync in full, including Group creation, updates, deletion, role mapping, and managed connection listings ([#12070](https://github.com/better-auth/better-auth/pull/12070))
- Fixed apps using the SCIM plugin on adapters without native transactions, such as Cloudflare D1, failing at startup; `/scim/v2` requests now return 501 Not Implemented on those adapters ([#12413](https://github.com/better-auth/better-auth/pull/12413))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/scim/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- Fixed failed deep link authentication in Electron to be logged instead of causing an unhandled promise rejection in the main process ([#12409](https://github.com/better-auth/better-auth/pull/12409))
- Fixed plugin packages importing from the `better-auth` root, so bundlers no longer emit unused Kysely chunks when used with `better-auth/minimal` ([#12404](https://github.com/better-auth/better-auth/pull/12404))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/electron/CHANGELOG.md)

## `@better-auth/api-key`

### Bug Fixes

- Fixed plugin packages importing from the `better-auth` root, so bundlers no longer emit unused Kysely chunks when used with `better-auth/minimal` ([#12404](https://github.com/better-auth/better-auth/pull/12404))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/api-key/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Fixed plugin packages importing from the `better-auth` root, so bundlers no longer emit unused Kysely chunks when used with `better-auth/minimal` ([#12404](https://github.com/better-auth/better-auth/pull/12404))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/expo/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed intermittent `schema does not exist` and `relation does not exist` errors on PostgreSQL during the startup schema check and `npx auth@latest migrate` when other schemas are dropped concurrently ([#11912](https://github.com/better-auth/better-auth/pull/11912))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/mongo-adapter`

### Bug Fixes

- Added indexes in the MongoDB adapter for schema fields marked `unique` or `index`, preventing duplicate users from concurrent sign-ups with the same email ([#12299](https://github.com/better-auth/better-auth/pull/12299))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/mongo-adapter/CHANGELOG.md)

## `@better-auth/passkey`

### Bug Fixes

- Fixed passkey startup to no longer require `origin` when a wildcard in `baseURL.allowedHosts` covers your `rpID`, accepting exact trusted origins instead ([#12388](https://github.com/better-auth/better-auth/pull/12388))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/passkey/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed plugin packages importing from the `better-auth` root, so bundlers no longer emit unused Kysely chunks when used with `better-auth/minimal` ([#12404](https://github.com/better-auth/better-auth/pull/12404))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/stripe/CHANGELOG.md)

## `@better-auth/telemetry`

### Bug Fixes

- Fixed telemetry to report Cloudflare Workers as `workerd` instead of `node` when `nodejs_compat` is enabled, and exported the runtime detection from `@better-auth/core/env` ([#12425](https://github.com/better-auth/better-auth/pull/12425))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/telemetry/CHANGELOG.md)

## `@better-auth/test-utils`

### Bug Fixes

- Fixed the adapter test for `findMany` with multiple operators to create users from generated data like other adapter tests ([#12409](https://github.com/better-auth/better-auth/pull/12409))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/42352063e5eb8704c384709e38066b9e171cd14a/packages/test-utils/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@ArjunCodess, @bytaesu, @ghazy2001, @gustavovalverde, @hardikguptaofficialgit, @ItzSudhan, @lakshya-dhariwal, @mallachari, @umeraamir69

**Full changelog:** [`v1.7.20...v1.7.21`](https://github.com/better-auth/better-auth/compare/v1.7.20...v1.7.21)

## v1.8.0-beta.7 (2026-11-10) canary

## Bug Fixes

This beta includes all fixes from [v1.7.19](https://github.com/better-auth/better-auth/releases/tag/v1.7.19).

## Contributors

Thanks to everyone who contributed to this release:

@Adnan-Husayn, @AryaKesharwani, @binaryshrey, @bytaesu, @Faiziimam, @Gourav224, @jashkarangiya, @NoiceHax, @PhillJK, @Tushar-Khandelwal-2004, @Tyagiquamar, @umeraamir69, @unjica, @YIOYIOIOI

**Full changelog:** [`v1.8.0-beta.6...v1.8.0-beta.7`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.6...v1.8.0-beta.7)

## v1.7.20 (2026-11-10)

> [!IMPORTANT]
> **Action required**
>
> - If your issuer (`baseURL`, or `jwt.issuer` when set) uses `http` on a non-loopback host behind a TLS-terminating proxy, set `baseURL` to the public `https` URL, since discovery and the `iss` parameter no longer rewrite it to `https`. ([#11904](https://github.com/better-auth/better-auth/pull/11904))

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed `POST /oauth2/public-client-prelogin` with `allowPublicClientPrelogin` to return a client only when its `client_id` matches the signed `oauth_query`, otherwise responding with `401` `invalid_client` ([#12237](https://github.com/better-auth/better-auth/pull/12237))
- Fixed `oauthProviderResourceClient(auth)` defaults to accept issued access tokens when `baseURL` is only an origin, by including the auth path in the default issuer, JWKS, and introspection URLs ([#12234](https://github.com/better-auth/better-auth/pull/12234))
- Added an `allowInsecureRedirectUri` option so OAuth provider deployments served over HTTP on private networks can accept `http` redirect URIs ([#11904](https://github.com/better-auth/better-auth/pull/11904))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9e748d69938f10f303ac941095d427af73c0ffea/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/prisma-adapter`

### Bug Fixes

- Fixed Prisma adapter `incrementOne` and `update` calls using `mode: "insensitive"` filters to match case-insensitively on PostgreSQL and MongoDB ([#11809](https://github.com/better-auth/better-auth/pull/11809))
- Fixed Prisma adapter queries with `eq null` on MongoDB to also match records where the optional field was never set ([#11806](https://github.com/better-auth/better-auth/pull/11806))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9e748d69938f10f303ac941095d427af73c0ffea/packages/prisma-adapter/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Added an `allowInsecureRedirectUri` option so OAuth provider deployments served over HTTP on private networks can accept `http` redirect URIs ([#11904](https://github.com/better-auth/better-auth/pull/11904))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9e748d69938f10f303ac941095d427af73c0ffea/packages/core/CHANGELOG.md)

## `@better-auth/memory-adapter`

### Bug Fixes

- Fixed `ne null` where clauses in the memory adapter to no longer match records where the field was never set ([#11806](https://github.com/better-auth/better-auth/pull/11806))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9e748d69938f10f303ac941095d427af73c0ffea/packages/memory-adapter/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed SAML assertion validation to apply the default 5-minute `saml.clockSkew` to the `NotBefore` and `NotOnOrAfter` checks in samlify ([#12309](https://github.com/better-auth/better-auth/pull/12309))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9e748d69938f10f303ac941095d427af73c0ffea/packages/sso/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@ArjunCodess, @gustavovalverde

**Full changelog:** [`v1.7.19...v1.7.20`](https://github.com/better-auth/better-auth/compare/v1.7.19...v1.7.20)

## v1.7.19 (2026-11-10)

## `better-auth`

### Bug Fixes

- Fixed `/admin/create-user` leaving a user without a credential account when creating that account failed, such as a database hook throwing, which made retrying with the same email fail with `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` ([#12338](https://github.com/better-auth/better-auth/pull/12338))
- Fixed `/admin/create-user` leaving a user without a credential account when the password was rejected, such as by the Have I Been Pwned plugin, which made retrying with the same email fail with `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` ([#12335](https://github.com/better-auth/better-auth/pull/12335))
- Fixed client actions ignoring the HTTP method passed in second-argument fetch options, and attaching a request body when the method was a lowercase `get` or `HEAD` ([#12336](https://github.com/better-auth/better-auth/pull/12336))
- Fixed plugin schema overrides (`modelName` and field names) leaking into other instances of the same plugin in one process ([#12319](https://github.com/better-auth/better-auth/pull/12319))
- Fixed `/device/token` returning `invalid_grant` instead of `invalid_client` when `validateClient` rejects the `client_id`, matching `/device/code` and RFC 6749 section 5.2 ([#12246](https://github.com/better-auth/better-auth/pull/12246))
- Fixed OAuth sign-in failing with `state_mismatch` during the daylight saving time fall-back hour when OAuth state is stored in the database and the server's time zone observes daylight saving time ([#12320](https://github.com/better-auth/better-auth/pull/12320))
- Fixed the OpenAPI schema to document query parameters for endpoints whose query schema is wrapped in `z.optional()`, such as `/get-session` and Stripe's `/subscription/list` ([#12337](https://github.com/better-auth/better-auth/pull/12337))
- Fixed `organization.getInvitation` to return the `INVITATION_NOT_FOUND` code for a missing, expired, or non-pending invitation ([#12332](https://github.com/better-auth/better-auth/pull/12332))
- Fixed `listMembers` failing with a syntax error on PostgreSQL and MSSQL when the filter matches no members or the offset is past the last member ([#12318](https://github.com/better-auth/better-auth/pull/12318))
- Fixed the `active-sessions` list in secondary storage being stored without an expiry when every remaining session had less than a second left ([#12323](https://github.com/better-auth/better-auth/pull/12323))
- Fixed SIWE sign-in leaving a user behind when creating its wallet address or account failed, which blocked that wallet from signing in again ([#12366](https://github.com/better-auth/better-auth/pull/12366))
- Fixed social sign-up hanging on single-connection databases when the username plugin is enabled and the provider profile maps a username ([#12340](https://github.com/better-auth/better-auth/pull/12340))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5de71a89b1294564696dd3bc8161b2ff1ae9cdef/packages/better-auth/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed CLI commands hanging or exiting with code 0 at a prompt in CI or without a terminal. They now exit with code 2 and name what they need, such as `--yes`, and prompts appear on stderr so redirecting stdout no longer hides them ([#12286](https://github.com/better-auth/better-auth/pull/12286))
- Fixed CLI notices mixing into command output. `auth info --json --copy` now prints valid JSON, `auth secret` prints only the `BETTER_AUTH_SECRET` line on stdout, `auth login` and `auth logout` messages go to stderr, and `auth info` shows tips only in an interactive terminal ([#12287](https://github.com/better-auth/better-auth/pull/12287))
- Fixed CLI errors printing a stack trace instead of the cause. Config and database errors now show their message, and a mistyped `--config` path reports that the file doesn't exist. `auth mcp` and `auth ai` no longer report success after a failed step ([#12305](https://github.com/better-auth/better-auth/pull/12305))
- Fixed the CLI exiting with code 0 after a canceled or failed run. Canceling or declining a prompt, or pressing Ctrl+C, now exits with 130, and failures such as a missing config file or a failed `auth mcp` setup exit with 1 ([#12275](https://github.com/better-auth/better-auth/pull/12275))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5de71a89b1294564696dd3bc8161b2ff1ae9cdef/packages/cli/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed `auth.api.oauth2Consent({ headers, body })` failing with `request not found` when called from a server route ([#12325](https://github.com/better-auth/better-auth/pull/12325))
- Fixed a client secret without the configured `prefix.clientSecret` getting a different error than other wrong secrets. It now gets the standard `invalid_client` response: 401 with a `WWW-Authenticate: Basic` challenge for `client_secret_basic`, and 400 for `client_secret_post` ([#12327](https://github.com/better-auth/better-auth/pull/12327))
- Fixed OAuth client `metadata` being stored as a JSON string in its `json` column. It is now written as an object, so Postgres `jsonb` operators such as `->` and `@>` work with adapters that pass JSON through natively (Drizzle `pg`). Rows written as strings by earlier versions are still read ([#12328](https://github.com/better-auth/better-auth/pull/12328))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5de71a89b1294564696dd3bc8161b2ff1ae9cdef/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed failed fallback join queries printing the raw database error, including SQL and bound values, with `console.error` in addition to the configured logger ([#12317](https://github.com/better-auth/better-auth/pull/12317))
- Fixed `getAccessToken` and `refreshToken` returning the expired access token when a provider refuses a token refresh with a 200 status, as GitHub does ([#12369](https://github.com/better-auth/better-auth/pull/12369))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5de71a89b1294564696dd3bc8161b2ff1ae9cdef/packages/core/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Fixed the Expo authorization proxy logging a provider configuration error on every OAuth sign-in when a social provider is set up for ID token sign-in only, such as Apple without a client secret ([#12368](https://github.com/better-auth/better-auth/pull/12368))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5de71a89b1294564696dd3bc8161b2ff1ae9cdef/packages/expo/CHANGELOG.md)

## `@better-auth/mcp`

### Bug Fixes

- Fixed MCP rejecting plain-HTTP `resource` URLs on `.localhost` subdomains as non-HTTPS ([#12322](https://github.com/better-auth/better-auth/pull/12322))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5de71a89b1294564696dd3bc8161b2ff1ae9cdef/packages/mcp/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@Adnan-Husayn, @AryaKesharwani, @binaryshrey, @bytaesu, @Faiziimam, @Gourav224, @jashkarangiya, @NoiceHax, @PhillJK, @Tushar-Khandelwal-2004, @Tyagiquamar, @umeraamir69, @unjica, @YIOYIOIOI

**Full changelog:** [`v1.7.18...v1.7.19`](https://github.com/better-auth/better-auth/compare/v1.7.18...v1.7.19)

## v1.8.0-beta.6 (2026-11-05) canary

> [!IMPORTANT]
> **Action required**
>
> - If your clients exchange their own DPoP-bound access tokens with `oauthTokenExchange()`, send a DPoP proof signed by the token's key, or have your `clientAuthentication` strategy return that key as `confirmation`. ([#12262](https://github.com/better-auth/better-auth/pull/12262))
> - If your clients send a standard parameter more than once in form-encoded POST requests to `/oauth2/authorize`, such as `state=a&state=b`, change them to send each standard parameter only once. ([#12261](https://github.com/better-auth/better-auth/pull/12261))

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- Fixed form POST requests to `/oauth2/authorize` to reject repeated standard parameters with `invalid_request`, matching GET behavior ([#12261](https://github.com/better-auth/better-auth/pull/12261))

### Features

- Added DPoP key binding to `oauthTokenExchange()` so a client exchanging its own DPoP-bound access token must prove the same key ([#12262](https://github.com/better-auth/better-auth/pull/12262))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/fe691f0f65af941341875ab5393d88dd158bc383/packages/oauth-provider/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.8.0-beta.5...v1.8.0-beta.6`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.5...v1.8.0-beta.6)

## v1.7.18 (2026-11-05)

> [!IMPORTANT]
> **Action required**
>
> - If you use `getTestInstance` with `testWith: "mysql"`, run a MySQL server at `127.0.0.1:3306` with the `root` password set to `root_password`. ([#12244](https://github.com/better-auth/better-auth/pull/12244))

## `better-auth`

### Bug Fixes

- Fixed "revoke all sessions" with `secondaryStorage` and `storeSessionInDatabase` to also revoke sessions created while the revocation is running, except sessions created by a `session.delete.after` hook, which stay active ([#12259](https://github.com/better-auth/better-auth/pull/12259))
- Fixed `getTestInstance` from `better-auth/test` to close its own Postgres connection pool and SQLite database when the test file finishes, while with Vitest's default `sequence.hooks: "stack"` your `afterAll` hooks still run first and can keep using the instance ([#12250](https://github.com/better-auth/better-auth/pull/12250))
- Fixed `getTestInstance` with `testWith: "mysql"` hanging, and added a separate database per instance so several instances can run in one test file ([#12244](https://github.com/better-auth/better-auth/pull/12244))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/4946a1e3b66905c7374c7c52bd851fc43c6f83de/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed resource servers rejecting all introspected tokens when `verifyOptions.typ` is set together with `remoteVerify` ([#12249](https://github.com/better-auth/better-auth/pull/12249))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/4946a1e3b66905c7374c7c52bd851fc43c6f83de/packages/core/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.7.17...v1.7.18`](https://github.com/better-auth/better-auth/compare/v1.7.17...v1.7.18)

## v1.7.17 (2026-11-04)

## `better-auth`

### Bug Fixes

- Fixed sessions created by a `session.delete.after` hook being treated as revoked during "revoke all sessions" when using `secondaryStorage` with `storeSessionInDatabase` ([#12212](https://github.com/better-auth/better-auth/pull/12212))
- Fixed remembered sign-ins and sign-ups to refresh their session even if an earlier sign-in in the same browser used `rememberMe: false` ([#12181](https://github.com/better-auth/better-auth/pull/12181))
- Fixed denying a device authorization request to reject a revoked session that is still in the cookie cache ([#12216](https://github.com/better-auth/better-auth/pull/12216))
- Fixed IP wildcard trusted origins such as `exp://192.168.*.*:*` matching custom-scheme hosts with out-of-range or zero-padded octets ([#12217](https://github.com/better-auth/better-auth/pull/12217))
- Fixed the phone number plugin storing an empty `phoneNumber` on sign-up and replacing a verified number when linking an account with an empty phone number ([#12219](https://github.com/better-auth/better-auth/pull/12219))
- Fixed TOTP verification rejecting API key sessions so they can now finish two-factor enrollment ([#12211](https://github.com/better-auth/better-auth/pull/12211))
- Fixed trusted devices being ignored when an app runs the two-factor sign-in step from its own hook on another sign-in path, such as email OTP ([#12228](https://github.com/better-auth/better-auth/pull/12228))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/45909b9c3e84398b9c9b0749e46ba5563cb354f4/packages/better-auth/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Fixed Expo social sign-in to reject authorization URLs without a `state` parameter when OAuth state is stored in a cookie ([#12218](https://github.com/better-auth/better-auth/pull/12218))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/45909b9c3e84398b9c9b0749e46ba5563cb354f4/packages/expo/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed MySQL `create` with `generateId: "serial"` leaving an inserted row behind when the table reports no auto-increment id ([#12220](https://github.com/better-auth/better-auth/pull/12220))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/45909b9c3e84398b9c9b0749e46ba5563cb354f4/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/passkey`

### Bug Fixes

- Fixed passkey registration and sign-in when one `passkey()` plugin is shared between auth instances where only some set `baseURL` ([#12225](https://github.com/better-auth/better-auth/pull/12225))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/45909b9c3e84398b9c9b0749e46ba5563cb354f4/packages/passkey/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@aliamanatali, @bytaesu

**Full changelog:** [`v1.7.16...v1.7.17`](https://github.com/better-auth/better-auth/compare/v1.7.16...v1.7.17)

## v1.8.0-beta.5 (2026-11-03) canary

> [!IMPORTANT]
> **Action required**
>
> - If you write plugin after-hooks for credential sign-in routes, handle a null new session while two-factor verification is pending. ([#12202](https://github.com/better-auth/better-auth/pull/12202))
> - If you set `authenticatorSelection.userVerification` to `required`, passkey sign-in now rejects responses without user verification. ([#12202](https://github.com/better-auth/better-auth/pull/12202))
> - If you use phone sign-in with `requireVerification`, configure `sendOTP`. Without it the route returns `SEND_OTP_NOT_IMPLEMENTED`. ([#12202](https://github.com/better-auth/better-auth/pull/12202))
> - If users reset passwords by phone, they must verify the number first. Otherwise `resetPassword` returns `PHONE_NUMBER_PENDING_VERIFICATION`. ([#12202](https://github.com/better-auth/better-auth/pull/12202))
> - If you use sessions from `enableSessionForAPIKeys` on passkey registration, device-code approval, two-factor enrollment, phone number changes, social account linking, or organization invitations, those requests are now refused. If you call `linkOAuthAccount` directly, pass the session that started the link in OAuth state. ([#12202](https://github.com/better-auth/better-auth/pull/12202))

## `better-auth`

### ❗ Breaking Changes

- Changed passkey registration, device-code approval, two-factor enrollment, phone number changes, social account linking, and organization invitations to require a session still active in the store when a server-side session store is used, even with cookie caching ([#12202](https://github.com/better-auth/better-auth/pull/12202))
- Changed phone number verification to require ownership of the account that holds an unverified number, and sign-up and sign-in to reject a `phoneNumber` with `PHONE_NUMBER_CANNOT_BE_SET` ([#12202](https://github.com/better-auth/better-auth/pull/12202))
- Changed phone password reset to work only for a number already verified on the account ([#12202](https://github.com/better-auth/better-auth/pull/12202))
- Changed credential sign-in after-hooks to run after the built-in two-factor challenge, so Electron desktop sign-in completes only after two-factor verification ([#12202](https://github.com/better-auth/better-auth/pull/12202))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/next/packages/better-auth/CHANGELOG.md)

## `@better-auth/electron`

### ❗ Breaking Changes

- Changed Electron desktop sign-in to complete only after two-factor verification and the other sign-in after-hooks, regardless of plugin order, and to require the issuing browser session until the code is exchanged ([#12202](https://github.com/better-auth/better-auth/pull/12202))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/next/packages/electron/CHANGELOG.md)

## `@better-auth/passkey`

### ❗ Breaking Changes

- Changed `authenticatorSelection.userVerification` to apply to authentication as well as registration, rejecting responses without user verification when it is `required` ([#12202](https://github.com/better-auth/better-auth/pull/12202))
- Changed passkey registration to require a session still active in the store when a server-side session store is used, even with cookie caching ([#12202](https://github.com/better-auth/better-auth/pull/12202))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/next/packages/passkey/CHANGELOG.md)

## `@better-auth/core`

### ❗ Breaking Changes

- Changed credential sign-in after-hooks to run after the built-in two-factor challenge and to receive a null new session while verification is pending ([#12202](https://github.com/better-auth/better-auth/pull/12202))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/next/packages/core/CHANGELOG.md)

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- Changed device-code approval to require a session still active in the store when a server-side session store is used, even with cookie caching ([#12202](https://github.com/better-auth/better-auth/pull/12202))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/next/packages/oauth-provider/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde @Bekacru @bytaesu

**Full changelog:** [`v1.8.0-beta.4...v1.8.0-beta.5`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.4...v1.8.0-beta.5)

## v1.7.16 (2026-11-03)

## `better-auth`

### Bug Fixes

- Fixed revoked sessions staying usable with secondary storage or the cookie cache. Bulk revocation now ends sessions missing from the cached list, and passkey registration, device authorization, two-factor, social account linking, and phone number changes check the session store ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed phone numbers being stored before they are verified. Sign-up and sign-in reject a `phoneNumber` in the request, social profiles no longer set an unverified number, and verification codes use their own namespace ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed `/admin/update-user` changing phone numbers without permission. It now requires `user:set-phone`, so add `set-phone` to custom access control statements ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed email OTP accepting more guesses than `allowedAttempts` under concurrent requests, and bound email change codes to the requesting account ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed user lookup by email matching a different address on accent-insensitive database collations ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed email verification and change email links working for an account other than the one they were issued to ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed OAuth sign-in treating a string `email_verified` value such as `"false"` as verified, and bound generic OAuth profiles to the ID token subject ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed organization roles with extra whitespace passing role checks, and limited pending invitations to members who can manage them ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed wildcard trusted origins matching URLs outside the intended scheme, host, or path ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed anonymous users being linked on a sign-in still waiting for a second factor ([#12198](https://github.com/better-auth/better-auth/pull/12198))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cbfe18238b01d25a11fc7e4f71a122bb9364f327/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed the Zoom provider ignoring `disableSignUp`, `requireEmailVerification`, and `overrideUserInfoOnSignIn` ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed string `email_verified` claims from Cognito and Microsoft Entra ID being read as verified ([#12198](https://github.com/better-auth/better-auth/pull/12198))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cbfe18238b01d25a11fc7e4f71a122bb9364f327/packages/core/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Fixed the authorization proxy signing a state the server did not issue and redirecting to hosts that are not configured providers ([#12198](https://github.com/better-auth/better-auth/pull/12198))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cbfe18238b01d25a11fc7e4f71a122bb9364f327/packages/expo/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- Fixed sign-in returning the internal auth context when the transfer cookie is not a transfer request, and bound desktop authorization codes to the browser session that issued them ([#12198](https://github.com/better-auth/better-auth/pull/12198))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cbfe18238b01d25a11fc7e4f71a122bb9364f327/packages/electron/CHANGELOG.md)

## `@better-auth/passkey`

### Bug Fixes

- Fixed the expected WebAuthn origin coming from the request instead of server configuration. Set `origin` when `rpID` is set and a wildcard in `baseURL.allowedHosts` covers it ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed `userVerification: "required"` not being enforced, and applied it to authentication as well as registration ([#12198](https://github.com/better-auth/better-auth/pull/12198))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cbfe18238b01d25a11fc7e4f71a122bb9364f327/packages/passkey/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed sign-up and update-user requests setting `stripeCustomerId`. Server code that sets it through `auth.api.updateUser` must write it through the database adapter instead ([#12198](https://github.com/better-auth/better-auth/pull/12198))
- Fixed webhooks attributing a subscription to the wrong record when several records share a Stripe customer ID ([#12198](https://github.com/better-auth/better-auth/pull/12198))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cbfe18238b01d25a11fc7e4f71a122bb9364f327/packages/stripe/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed MySQL with `generateId: "serial"` returning another request's record on connection pools ([#12198](https://github.com/better-auth/better-auth/pull/12198))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cbfe18238b01d25a11fc7e4f71a122bb9364f327/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed MySQL with `generateId: "serial"` returning another request's record on connection pools ([#12198](https://github.com/better-auth/better-auth/pull/12198))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cbfe18238b01d25a11fc7e4f71a122bb9364f327/packages/drizzle-adapter/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu @Bekacru @gustavovalverde @Abhishek-B-R

**Full changelog:** [`v1.7.15...v1.7.16`](https://github.com/better-auth/better-auth/compare/v1.7.15...v1.7.16)

## v1.8.0-beta.4 (2026-11-01) canary

> [!IMPORTANT]
> **Action required**
>
> Custom Twitch and Paybin ID-token sign-ins using the default `getUserInfo` must include `idToken.accessToken`. Standard redirect-based sign-in requires no changes.

## `@better-auth/core`

### ❗ Breaking Changes

- Changed Paybin to use its published `/oauth/*` endpoints and return UserInfo data instead of stored ID-token claims, so profile mappings must handle omitted email and custom ID-token sign-ins using the default profile reader must supply `accessToken` ([#11860](https://github.com/better-auth/better-auth/pull/11860))
- Changed Spotify profile fields to match the current user profile, so mappings must handle nullable display names, omitted email, and nullable image dimensions, and a missing display name leaves the local name unset while raw profile fields remain available ([#11865](https://github.com/better-auth/better-auth/pull/11865))
- Changed Twitch to fetch current profile data with access tokens instead of using stored ID-token claims, so profile mappings must handle optional fields and custom ID-token sign-ins using the default profile reader must supply `accessToken` ([#11848](https://github.com/better-auth/better-auth/pull/11848))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/3b82055893dc4941a9e15e0984043035d10d4b73/packages/core/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu

**Full changelog:** [`v1.8.0-beta.3...v1.8.0-beta.4`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.3...v1.8.0-beta.4)

## v1.7.15 (2026-11-01)

## `better-auth`

### Bug Fixes

- Fixed organization and API key metadata, and OAuth proxy sign-ins with a `constructor` field in `additionalData`, failing with a prototype pollution error ([#12142](https://github.com/better-auth/better-auth/pull/12142))
- Improved `BETTER_AUTH_SECRETS` error messages to report the entry position instead of including the entry value ([#12098](https://github.com/better-auth/better-auth/pull/12098))
- Fixed the admin `update-user` endpoint to reject `data.id` with a 400 error instead of attempting to change the user's primary key ([#12099](https://github.com/better-auth/better-auth/pull/12099))
- Fixed the admin plugin to reject banned users when a session is created outside an endpoint, such as through `internalAdapter.createSession` ([#12100](https://github.com/better-auth/better-auth/pull/12100))
- Fixed headers and cookies set by a non-returning `hooks.before` hook being dropped from the response, with the endpoint's value winning when both set the same header or cookie ([#12145](https://github.com/better-auth/better-auth/pull/12145))
- Fixed the Vue client's `useSession(useFetch)` returning no session during Nuxt SSR when `baseURL` is inferred from the environment ([#12109](https://github.com/better-auth/better-auth/pull/12109))
- Fixed the `genericOAuth` HubSpot helper truncating access tokens with reserved characters and now returning `null` instead of requesting `/access-tokens/undefined` when no token is present ([#12108](https://github.com/better-auth/better-auth/pull/12108))
- Fixed `/sign-in/username` and `/is-username-available` rejecting usernames that sign-up accepts when `validationOrder.username` is `post-normalization` ([#12097](https://github.com/better-auth/better-auth/pull/12097))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6dfcd39e1b58cb7a1109fa00c49ccbe8d8ff83fd/packages/better-auth/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed `auth init` for Remix and React Router v7 to generate an `app/routes/api.auth.$.ts` resource route that mounts `auth.handler` instead of a second auth instance with an unsupported database option ([#12118](https://github.com/better-auth/better-auth/pull/12118))
- Fixed `auth ai` overwriting MCP config files it cannot parse, such as those with comments or trailing commas, by leaving them unchanged and printing the config to add manually ([#12111](https://github.com/better-auth/better-auth/pull/12111))
- Fixed `auth login` and `auth logout` re-launching the CLI through `npx auth@latest` in an endless loop ([#12110](https://github.com/better-auth/better-auth/pull/12110))
- Fixed `auth init` hanging during database migration and removed a stray debug line about path aliases ([#12148](https://github.com/better-auth/better-auth/pull/12148))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6dfcd39e1b58cb7a1109fa00c49ccbe8d8ff83fd/packages/cli/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed `/subscription/success` returning a 500 for non-string `callbackURL` and `checkoutSessionId` query values by rejecting them with a 400 ([#12105](https://github.com/better-auth/better-auth/pull/12105))
- Fixed `/subscription/success` to validate `callbackURL` against trusted origins after replacing `{CHECKOUT_SESSION_ID}`, preventing redirects to untrusted origins via `checkoutSessionId` ([#12102](https://github.com/better-auth/better-auth/pull/12102))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6dfcd39e1b58cb7a1109fa00c49ccbe8d8ff83fd/packages/stripe/CHANGELOG.md)

## `@better-auth/api-key`

### Bug Fixes

- Fixed API keys in secondary storage failing to verify, load, and list when the storage client returns already-parsed JSON, such as `@upstash/redis` ([#12107](https://github.com/better-auth/better-auth/pull/12107))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6dfcd39e1b58cb7a1109fa00c49ccbe8d8ff83fd/packages/api-key/CHANGELOG.md)

## `@better-auth/cimd`

### Bug Fixes

- Fixed the Node metadata transport crashing the process on responses with an out-of-range status or invalid reason phrase by reporting the client as `invalid_client` ([#12103](https://github.com/better-auth/better-auth/pull/12103))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6dfcd39e1b58cb7a1109fa00c49ccbe8d8ff83fd/packages/cimd/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed built-in social providers following HTTP redirects on token exchange, refresh, verification, and JWKS signing key requests ([#12106](https://github.com/better-auth/better-auth/pull/12106))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6dfcd39e1b58cb7a1109fa00c49ccbe8d8ff83fd/packages/core/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu

**Full changelog:** [`v1.7.14...v1.7.15`](https://github.com/better-auth/better-auth/compare/v1.7.14...v1.7.15)

## v1.6.34 (2026-11-01)

## `better-auth`

### Bug Fixes

- Fixed `ACCOUNT_NOT_FOUND` when retrieving an access token after stateless OAuth sign-in links a new provider to an existing user ([#11300](https://github.com/better-auth/better-auth/pull/11300))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/bfec1c4f5a0d9a41ec89c65155024e06c7cb0f32/packages/better-auth/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed SAML sign-in for providers that use `samlConfig.callbackUrl` as their ACS URL without `spMetadata.metadata`, which had failed with `invalid_saml_response` since 1.6.21 ([#11730](https://github.com/better-auth/better-auth/pull/11730))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/bfec1c4f5a0d9a41ec89c65155024e06c7cb0f32/packages/sso/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @gustavovalverde

**Full changelog:** [`v1.6.33...v1.6.34`](https://github.com/better-auth/better-auth/compare/v1.6.33...v1.6.34)

## v1.8.0-beta.3 (2026-10-27) canary

> [!IMPORTANT]
> **Action required**
>
> OAuth profile types for Apple, Cognito, Discord, Dropbox, Facebook, GitHub, GitLab, Gumroad, Linear, Microsoft Entra ID, Notion, Patreon, PayPal, Railway, Slack, and Twitter(X) were reviewed against each provider's official resources and updated to match. If you use custom profile mappings or profile types for any of them, review the changes below and handle fields that are now optional, nullable, or retyped.

## `better-auth`

### ❗ Breaking Changes

- Fixed the Gumroad OAuth helper to return `undefined` for accounts without a name, matching its declared profile type ([#11864](https://github.com/better-auth/better-auth/pull/11864))
- Fixed the Patreon OAuth helper to normalize null names and images to missing values while preserving empty strings, and to allow email to be null or omitted when email access is not granted ([#11863](https://github.com/better-auth/better-auth/pull/11863))
- Fixed Slack sign-in to support scoped profiles with optional `SlackProfile` email and profile claims, use POST for userinfo in the built-in provider and Generic OAuth helper, and reject Slack errors returned with HTTP 200 ([#11851](https://github.com/better-auth/better-auth/pull/11851))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f86eefd286c0bf4b24031255f0da359ab3cc9efc/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### ❗ Breaking Changes

- Fixed Apple profile types to align with identity tokens, making private-email status, user status, and pictures optional and accepting boolean or string email-verification claims ([#11842](https://github.com/better-auth/better-auth/pull/11842))
- Fixed `CognitoProfile` to make profile and token claims optional, accept boolean or `"true"`/`"false"` verification values, fall back to `cognito:username` for ID-token names, and verify tokens against both documented issuer formats ([#11843](https://github.com/better-auth/better-auth/pull/11843))
- Fixed Discord profile types to reflect optional user metadata, added avatar decoration, collectible, and primary guild details, and defaulted missing email verification to false ([#11867](https://github.com/better-auth/better-auth/pull/11867))
- Fixed Dropbox profile types to include account status, locale, referral links, pairing status, account type, team policies, and root information, with `home_path` required for team roots ([#11846](https://github.com/better-auth/better-auth/pull/11846))
- Fixed Facebook Limited Login profile callbacks to accept tokens without name, email, or picture claims ([#11856](https://github.com/better-auth/better-auth/pull/11856))
- Fixed `GithubProfile` types to match GitHub API responses, with numeric `id` and account counters, nullable details, and omitted scope-dependent fields such as `twitter_username` ([#11839](https://github.com/better-auth/better-auth/pull/11839))
- Fixed GitLab profile handling for nullable details and omitted conditional fields, made `locked` a required boolean, and preserved stored images for null avatars when profile updates are enabled ([#11853](https://github.com/better-auth/better-auth/pull/11853))
- Fixed `LinearUser.avatarUrl` to be required and typed as `string | null`, preserved stored images for null avatars during enabled profile updates, and made authorization scopes comma-separated ([#11855](https://github.com/better-auth/better-auth/pull/11855))
- Fixed `MicrosoftEntraIDProfile` claim types so timestamps are numbers, `groups`, `acrs`, and `xms_cc` are string arrays, `in_corp` is boolean, and conditional claims and profile photos can be omitted ([#11854](https://github.com/better-auth/better-auth/pull/11854))
- Fixed Notion users without an avatar to keep their existing profile image when profile updates are enabled, with optional `type`, nullable `name` and `avatar_url`, missing `image` as `undefined`, and optional `person.email_verified` metadata ([#11859](https://github.com/better-auth/better-auth/pull/11859))
- Fixed PayPal profile types to handle omitted names, email, and verification claims when personal permissions are not granted, defaulting missing email verification to false ([#11862](https://github.com/better-auth/better-auth/pull/11862))
- Fixed `RailwayProfile` to make `email`, `name`, and `picture` optional, reflecting the granted scopes ([#11861](https://github.com/better-auth/better-auth/pull/11861))
- Fixed Slack sign-in to support scoped profiles with optional `SlackProfile` email and profile claims, use POST for userinfo in the built-in provider and Generic OAuth helper, and reject Slack errors returned with HTTP 200 ([#11851](https://github.com/better-auth/better-auth/pull/11851))
- Fixed `TwitterProfile` types so nested entity objects, arrays, and URL details can be omitted or `null`, and added description cashtags, mentions, and URL preview metadata ([#11852](https://github.com/better-auth/better-auth/pull/11852))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f86eefd286c0bf4b24031255f0da359ab3cc9efc/packages/core/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu

**Full changelog:** [`v1.8.0-beta.2...v1.8.0-beta.3`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.2...v1.8.0-beta.3)

## v1.7.14 (2026-10-26)

## `better-auth`

### Bug Fixes

- Fixed two-factor TOTP to accept imported Base32 secrets stored as `base32:<secret>` ([#12031](https://github.com/better-auth/better-auth/pull/12031))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/3d217a6b9b9985d0346324748d45ac5b72ed1103/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed Kakao sign-in to forward `loginHint` so the Kakao Account login page opens with the ID field prefilled ([#12045](https://github.com/better-auth/better-auth/pull/12045))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/3d217a6b9b9985d0346324748d45ac5b72ed1103/packages/core/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @honuuk

**Full changelog:** [`v1.7.13...v1.7.14`](https://github.com/better-auth/better-auth/compare/v1.7.13...v1.7.14)

## v1.7.13 (2026-10-25)

## `better-auth`

### Bug Fixes

- Fixed type declarations so type-only exports are no longer listed as values, making a value import fail type checking instead of failing at runtime ([#11985](https://github.com/better-auth/better-auth/pull/11985))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e4666edd1da8775a9a1767442451165376036ccf/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Features

- Added token endpoint authentication options to the Vercel social provider, including dynamic OIDC tokens and private key JWT client assertions, without replacing the built-in sign-in flow ([#11948](https://github.com/better-auth/better-auth/pull/11948))

### Bug Fixes

- Added `tokenEndpointAuth: { method }` to the Cloudflare provider and deprecated `tokenEndpointAuthMethod`, which remains supported ([#11997](https://github.com/better-auth/better-auth/pull/11997))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e4666edd1da8775a9a1767442451165376036ccf/packages/core/CHANGELOG.md)

## `@better-auth/stripe`

### Features

- Added support for Stripe SDK v23 in the Stripe plugin ([#11954](https://github.com/better-auth/better-auth/pull/11954))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e4666edd1da8775a9a1767442451165376036ccf/packages/stripe/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@allenzhou101, @bytaesu, @godwit-bo

**Full changelog:** [`v1.7.12...v1.7.13`](https://github.com/better-auth/better-auth/compare/v1.7.12...v1.7.13)

## v1.8.0-beta.2 (2026-10-22) canary

> [!IMPORTANT]
> **Action required**
>
> - If your Zoom profile mappings use exhaustive login-type checks, update them to handle the login types `11`, `21`, and `23`. ([#11850](https://github.com/better-auth/better-auth/pull/11850))
> - If you use Naver profile mappings, update them to handle omitted personal fields and supply an email when Naver does not share one. ([#11858](https://github.com/better-auth/better-auth/pull/11858))
> - If you use Kakao profile mappings, update them to handle a missing `kakao_account`. ([#11857](https://github.com/better-auth/better-auth/pull/11857))
> - If you use Roblox profile mappings, update them to handle optional scoped fields, a `null` `picture`, and `unknown` custom claims. ([#11866](https://github.com/better-auth/better-auth/pull/11866))
> - If your Google profile mappings rely on ID token claims such as email verification, update them to handle claims that are now optional. ([#11847](https://github.com/better-auth/better-auth/pull/11847))
> - If you use `mapProfileToUser` with Polar, update it to read the scoped, nullable userinfo claims instead of the previous user profile fields. ([#11840](https://github.com/better-auth/better-auth/pull/11840))
> - If you use custom Kick profile mappings or `getUserInfo` callbacks, update them to treat `KickProfile.user_id` as a number instead of a string. ([#11841](https://github.com/better-auth/better-auth/pull/11841))
> - If you send `reference_id` to `/oauth2/consent` when accepting, configure `postLogin.consentReferenceId`, otherwise acceptance fails with `invalid_request`. ([#11967](https://github.com/better-auth/better-auth/pull/11967))
> - If you use a VK profile callback or mapping that reads `user.phone`, update it to treat the value as a string instead of a number. ([#11849](https://github.com/better-auth/better-auth/pull/11849))
> - If you map LinkedIn profiles in a callback, update your code to read `locale` as a string instead of a country/language object. ([#11844](https://github.com/better-auth/better-auth/pull/11844))
> - If you use Hugging Face profile mappings, iterate over the organization arrays, treat organization roles as strings, and read `securityRestrictions` instead of the deprecated SSO and MFA flags. ([#11845](https://github.com/better-auth/better-auth/pull/11845))

## `@better-auth/core`

### ❗ Breaking Changes

- Fixed `GoogleProfile` to reflect Google's optional ID token claims and to treat an absent email verification claim as unverified ([#11847](https://github.com/better-auth/better-auth/pull/11847))
- Updated Hugging Face profile organization types so organizations are arrays with string roles and optional plan and `securityRestrictions` fields ([#11845](https://github.com/better-auth/better-auth/pull/11845))
- Fixed Kakao profiles to make `KakaoProfile.kakao_account` optional and to separate consent scopes with commas in authorization requests, as Kakao documents ([#11857](https://github.com/better-auth/better-auth/pull/11857))
- Fixed `KickProfile.user_id` to be a number instead of a string ([#11841](https://github.com/better-auth/better-auth/pull/11841))
- Changed the LinkedIn profile `locale` field to a language tag string such as `en-US` instead of a country/language object ([#11844](https://github.com/better-auth/better-auth/pull/11844))
- Fixed `NaverProfile.response` to make personal profile fields optional, matching what Naver may omit ([#11858](https://github.com/better-auth/better-auth/pull/11858))
- Fixed Polar accounts to be identified by their userinfo subject and exposed the scoped, nullable userinfo claims in `mapProfileToUser` instead of unrelated user profile fields ([#11840](https://github.com/better-auth/better-auth/pull/11840))
- Fixed Roblox userinfo types so scoped `RobloxProfile` fields are optional, `picture` can be `null`, and custom claims are `unknown`, and preserved stored images when a Roblox avatar is missing and profile updates are enabled ([#11866](https://github.com/better-auth/better-auth/pull/11866))
- Fixed the VK provider profile type so `user.phone` is a string instead of a number ([#11849](https://github.com/better-auth/better-auth/pull/11849))
- Fixed Zoom profile types to include the phone number, WeChat, and Alipay login types (`11`, `21`, and `23`) ([#11850](https://github.com/better-auth/better-auth/pull/11850))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/7f1f96b672084fc2381c8c817c05a2f67756b223/packages/core/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Features

- Added the validated authorization request as `query` to the OAuth provider `shouldRedirect` hooks and `postLogin.consentReferenceId`, and let consent pages pass a chosen `reference_id` ([#11967](https://github.com/better-auth/better-auth/pull/11967))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/7f1f96b672084fc2381c8c817c05a2f67756b223/packages/oauth-provider/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @gustavovalverde

**Full changelog:** [`v1.8.0-beta.1...v1.8.0-beta.2`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.1...v1.8.0-beta.2)

## v1.7.12 (2026-10-20)

> [!IMPORTANT]
> **Action required**
>
> - If you use ID token sign-in with a provider that has no `clientId`, set `clientId` to every client ID your apps sign in with. ([#11931](https://github.com/better-auth/better-auth/pull/11931))

## `better-auth`

### Bug Fixes

- Fixed the JWT plugin to verify JWTs and session cookie-cache JWTs with the stored key's algorithm instead of the token header's, and to warn when signing or verifying a JWT without an issuer or audience ([#11925](https://github.com/better-auth/better-auth/pull/11925))
- Fixed OAuth callbacks completed through the OAuth proxy to run the same checks as the standard OAuth callback, including issuer and ID token nonce validation ([#11930](https://github.com/better-auth/better-auth/pull/11930))
- Fixed `auth.api.getSession()` to keep the original database error as `error.cause` when the session lookup fails ([#11924](https://github.com/better-auth/better-auth/pull/11924))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/29735514c737d2abeac2fb84f0691fd316231949/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed `mapProfileToUser` failing to typecheck under `exactOptionalPropertyTypes` when it returns `undefined` for `name`, `email`, or `image` ([#11918](https://github.com/better-auth/better-auth/pull/11918))
- Fixed ID token sign-in to reject tokens when the provider has no client ID, since their audience cannot be checked ([#11931](https://github.com/better-auth/better-auth/pull/11931))
- Fixed a custom Facebook `getUserInfo` to no longer receive client-submitted access tokens issued to another Facebook app, and ID tokens missing `exp` or `iat` are now rejected ([#11919](https://github.com/better-auth/better-auth/pull/11919))
- Restored the Twitch and Paybin ID token handling from before 1.7.11, which made account info fail once the ID token stored at sign-in expired ([#11920](https://github.com/better-auth/better-auth/pull/11920))
- Added a `cause` option as a third argument to `APIError.from()` to keep the underlying error for server-side callers without exposing it in the response ([#11924](https://github.com/better-auth/better-auth/pull/11924))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/29735514c737d2abeac2fb84f0691fd316231949/packages/core/CHANGELOG.md)

## `@better-auth/mcp`

### Bug Fixes

- Fixed `requireMcpAuth` to accept only OAuth access tokens and reject session JWTs from the JWT plugin, even when they share the issuer and audience ([#11934](https://github.com/better-auth/better-auth/pull/11934))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/29735514c737d2abeac2fb84f0691fd316231949/packages/mcp/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed OIDC SSO sign-in to reject ID tokens missing `exp` or `iat` and providers with an empty client ID, matching social sign-in ([#11935](https://github.com/better-auth/better-auth/pull/11935))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/29735514c737d2abeac2fb84f0691fd316231949/packages/sso/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@alpcanaydin, @bytaesu

**Full changelog:** [`v1.7.11...v1.7.12`](https://github.com/better-auth/better-auth/compare/v1.7.11...v1.7.12)

## v1.7.11 (2026-10-19)

## `better-auth`

### Bug Fixes

- Fixed repeated PostgreSQL migration diffs for `int8` columns. ([#10719](https://github.com/better-auth/better-auth/pull/10719))
- Fixed database-backed rate limiting returning an excessively large `X-Retry-After` value. ([#11521](https://github.com/better-auth/better-auth/pull/11521))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e2365403dfa98c004ac5dd31f12769525017a67d/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed plugin `init` returns with `options: undefined` failing type checks under `exactOptionalPropertyTypes`. ([#11907](https://github.com/better-auth/better-auth/pull/11907))
- Fixed ID token signature and claim validation for Twitch and Paybin sign-in. Custom Paybin issuers must publish RS256 signing keys at `<issuer>/.well-known/jwks.json`. ([#11884](https://github.com/better-auth/better-auth/pull/11884))
- Reduced installation size while preserving OpenTelemetry instrumentation attributes. ([#11623](https://github.com/better-auth/better-auth/pull/11623))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e2365403dfa98c004ac5dd31f12769525017a67d/packages/core/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed OpenAPI schemas for `/oauth2/consent` and `/oauth2/continue` to match their redirect responses. ([#10881](https://github.com/better-auth/better-auth/pull/10881))
- Fixed CIMD metadata refreshes overwriting concurrent administrator changes to discovered clients. ([#11830](https://github.com/better-auth/better-auth/pull/11830))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e2365403dfa98c004ac5dd31f12769525017a67d/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Fixed Expo social account linking with ID tokens when a session cookie is present. ([#10207](https://github.com/better-auth/better-auth/pull/10207))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e2365403dfa98c004ac5dd31f12769525017a67d/packages/expo/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@aryan1306, @bytaesu, @cpojer, @gustavovalverde, @noobnooc, @rendermani, @sahiljagtap08

**Full changelog:** [`v1.7.10...v1.7.11`](https://github.com/better-auth/better-auth/compare/v1.7.10...v1.7.11)

## v1.8.0-beta.1 (2026-10-16) canary

> [!IMPORTANT]
> **Action required**
>
> - If you regenerate an existing Drizzle Relations v2 schema, check whether it needs a nullability migration, and backfill existing `NULL` values before applying any needed `NOT NULL` constraints. ([#11836](https://github.com/better-auth/better-auth/pull/11836))

## `better-auth`

### Features

- Added a browser account chooser for Google sign-in buttons using FedCM on supported Chrome browsers ([#11343](https://github.com/better-auth/better-auth/pull/11343))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5ead2d0c149d5826032afb868c5af14bb93d3243/packages/better-auth/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed Drizzle Relations v2 schema generation to create non-nullable columns for fields that omit the `required` flag ([#11836](https://github.com/better-auth/better-auth/pull/11836))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5ead2d0c149d5826032afb868c5af14bb93d3243/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Features

- Added support for assigning `client_credentials` scopes during protected OAuth client registration ([#11832](https://github.com/better-auth/better-auth/pull/11832))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/5ead2d0c149d5826032afb868c5af14bb93d3243/packages/oauth-provider/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @gustavovalverde, @qamarq

**Full changelog:** [`v1.8.0-beta.0...v1.8.0-beta.1`](https://github.com/better-auth/better-auth/compare/v1.8.0-beta.0...v1.8.0-beta.1)

## v1.8.0-beta.0 (2026-10-15) canary

## `better-auth`

### ❗ Breaking Changes

- Changed the custom `DeviceAuthorizationGrant` interface for device-code approval ([#11610](https://github.com/better-auth/better-auth/pull/11610))

> **Migration:** Rename `assertSessionRedemption` to `assertStandaloneUse`, handle its new `use` argument, and remove uses of `getVerificationContext`, `verificationOpenAPIProperties`, and the interface's second type parameter.

- Fixed sign-up emails and OAuth session caching to run after database work completes ([#11751](https://github.com/better-auth/better-auth/pull/11751))

> **Migration:** Use a `databaseHooks.user.create.before` hook to reject sign-ups instead of throwing from `sendVerificationEmail` or `onExistingUserSignUp`, and account for logged cache-write failures no longer failing applicable sign-ins.

- Fixed concurrent device-code decisions so only the first approval or denial takes effect ([#11772](https://github.com/better-auth/better-auth/pull/11772))

> **Migration:** Replace checks for `device_code_already_processed` in `/device/approve` error types with checks for `invalid_request`.

- Fixed device-token polling to report `expired_token` immediately after a code expires ([#11772](https://github.com/better-auth/better-auth/pull/11772))

> **Migration:** Handle `expired_token` on the first poll after expiry rather than expecting an initial `slow_down` response.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f429179bcc0f690c78de0c92b57ce33e8e4215d9/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- Moved OAuth device-code approval into the provider's sign-in and consent flow ([#11610](https://github.com/better-auth/better-auth/pull/11610))

> **Migration:** Update OAuth device verification pages to send users to `/oauth2/authorize?user_code=<code>` instead of approving codes through `/device/approve` or `/device/deny`, and apply the new `deviceCode` columns before deploying.

- Stopped recording consent for empty OAuth scopes ([#11610](https://github.com/better-auth/better-auth/pull/11610))

> **Migration:** Stop relying on consent records for the empty `scope` value; omit empty entries from requested and accepted scopes.

- Added `interactionRequests` for extensions that route additional approval flows through OAuth provider pages ([#11610](https://github.com/better-auth/better-auth/pull/11610))

> **Migration:** If your OAuth provider extension implements a custom approval flow, register it through `interactionRequests` and resume it through `/oauth2/authorize`.

- Fixed OAuth token revocation and introspection to handle unknown, mistyped, and invalid tokens consistently with RFC 7009 and RFC 7662 ([#11796](https://github.com/better-auth/better-auth/pull/11796))

> **Migration:** Update clients and tests for the changed revocation, introspection, userinfo, and refresh-token error responses; extension grants should use `provider.requireActiveAccessToken` if an unknown token must throw.

- Fixed OAuth endpoints to reject repeated form parameters and report malformed resources as `invalid_target` ([#11746](https://github.com/better-auth/better-auth/pull/11746))

> **Migration:** Send token, introspection, and revocation form parameters only once except for `resource` and `audience`, and update error handling for malformed `resource` values from `invalid_request` to `invalid_target`.

- Isolated pairwise `sub` values for newly registered native and loopback OAuth clients ([#11650](https://github.com/better-auth/better-auth/pull/11650))

> **Migration:** Add the `sectorIdentifier` column to `oauthClient` with `npx auth@latest migrate`, or generate and apply the schema with your ORM, before upgrading.

### Features

- Added support for removing registered OAuth logout URIs with `null` ([#9923](https://github.com/better-auth/better-auth/pull/9923))
- Added browser-based OpenID Connect front-channel logout for registered clients ([#9923](https://github.com/better-auth/better-auth/pull/9923))
- Added OAuth token exchange for services requesting a scoped access token for another registered API ([#11763](https://github.com/better-auth/better-auth/pull/11763))
- Added configurable `acr` and `amr` claims to OAuth ID tokens ([#11787](https://github.com/better-auth/better-auth/pull/11787))
- Added authentication context claims to device-code ID tokens and their refreshes ([#11788](https://github.com/better-auth/better-auth/pull/11788))
- Added extension-defined client registration fields with validation at registration and update ([#11767](https://github.com/better-auth/better-auth/pull/11767))

### Bug Fixes

- Fixed client metadata document registration when at least one declared grant is supported ([#10731](https://github.com/better-auth/better-auth/pull/10731))
- Fixed device and CIBA polling so an invalid DPoP proof does not consume an approved request ([#11826](https://github.com/better-auth/better-auth/pull/11826))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f429179bcc0f690c78de0c92b57ce33e8e4215d9/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/ciba` ✨

### Features

- Added CIBA support for user-approved backchannel authentication with polling or ping delivery ([#11785](https://github.com/better-auth/better-auth/pull/11785))
- Added `auth.api.completeCibaRequest` so apps can approve or deny CIBA requests from server code ([#11812](https://github.com/better-auth/better-auth/pull/11812))

### Bug Fixes

- Fixed device and CIBA polling so an invalid DPoP proof does not consume an approved request ([#11826](https://github.com/better-auth/better-auth/pull/11826))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f429179bcc0f690c78de0c92b57ce33e8e4215d9/packages/ciba/CHANGELOG.md)

## `@better-auth/cimd`

### Features

- Added validation and storage for extension-defined fields in client metadata documents ([#11767](https://github.com/better-auth/better-auth/pull/11767))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f429179bcc0f690c78de0c92b57ce33e8e4215d9/packages/cimd/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@erikpr1994, @gustavovalverde, @shiminshen

**Full changelog:** [`v1.7.10...v1.8.0-beta.0`](https://github.com/better-auth/better-auth/compare/v1.7.10...v1.8.0-beta.0)

## v1.7.10 (2026-10-15)

## `better-auth`

### Bug Fixes

- Fixed Captcha and OpenAPI plugin subpath imports and type resolution for `better-auth/plugins/multi-session` and `better-auth/test`. ([#11822](https://github.com/better-auth/better-auth/pull/11822))
- Fixed Google One Tap sign-ins not recording `google` as the last login method. ([#11393](https://github.com/better-auth/better-auth/pull/11393))
- Fixed imports from `better-auth/plugins/one-tap` failing with a not-exported error. ([#11696](https://github.com/better-auth/better-auth/pull/11696))
- Fixed Google One Tap ignoring plugin-level `autoSelect` and `cancelOnTapOutside` settings. ([#11820](https://github.com/better-auth/better-auth/pull/11820))
- Fixed Google One Tap sign-ins ignoring configured Google profile mapping and user info updates. ([#11819](https://github.com/better-auth/better-auth/pull/11819))
- Fixed Google One Tap calling a prompt method unsupported by FedCM and retrying skipped prompts. ([#11821](https://github.com/better-auth/better-auth/pull/11821))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6f08d6dc3276f0f3b2b2a4c6c114fb56caf1a4e3/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Features

- Added optional self-service signing key rotation for `private_key_jwt` clients. ([#11695](https://github.com/better-auth/better-auth/pull/11695))

### Bug Fixes

- Fixed valid DPoP proofs being rejected for parameterized routes and URLs with trailing slashes. ([#11786](https://github.com/better-auth/better-auth/pull/11786))
- Fixed native clients with HTTP loopback callbacks being rejected when application type inference is enabled. ([#11798](https://github.com/better-auth/better-auth/pull/11798))
- Fixed device-code clients being unable to refresh access for approved resources omitted from a token poll. ([#11815](https://github.com/better-auth/better-auth/pull/11815))
- Fixed OAuth consent without a reference overwriting or reusing consent for a different reference. ([#11801](https://github.com/better-auth/better-auth/pull/11801))
- Fixed dynamic client registration rejecting requests that include both supported and unsupported grants. ([#11797](https://github.com/better-auth/better-auth/pull/11797))
- Fixed attempts to change cached trusted clients returning HTTP 500 instead of HTTP 400. ([#11781](https://github.com/better-auth/better-auth/pull/11781))
- Improved errors for unknown OAuth `client_id` values to say `client not found`. ([#11799](https://github.com/better-auth/better-auth/pull/11799))
- Fixed PKCE verifier errors to return the specified HTTP 400 response and error code. ([#11724](https://github.com/better-auth/better-auth/pull/11724))
- Fixed unknown OAuth clients receiving `invalid_grant` instead of `invalid_client` at the token endpoint. ([#11176](https://github.com/better-auth/better-auth/pull/11176))
- Fixed unverifiable JWT access tokens causing server errors at `/oauth2/userinfo`, `/oauth2/introspect`, and `/oauth2/revoke`. ([#11596](https://github.com/better-auth/better-auth/pull/11596))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6f08d6dc3276f0f3b2b2a4c6c114fb56caf1a4e3/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Limited JWKS refetches for unknown key IDs to protect servers from repeated requests. ([#11805](https://github.com/better-auth/better-auth/pull/11805))
- Fixed unreachable JWKS endpoints being reported as invalid tokens instead of server errors. ([#11612](https://github.com/better-auth/better-auth/pull/11612))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6f08d6dc3276f0f3b2b2a4c6c114fb56caf1a4e3/packages/core/CHANGELOG.md)

## `@better-auth/mongo-adapter`

### Bug Fixes

- Fixed MongoDB `findMany` ignoring ID sorting and potentially repeating or skipping paginated results. ([#11801](https://github.com/better-auth/better-auth/pull/11801))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6f08d6dc3276f0f3b2b2a4c6c114fb56caf1a4e3/packages/mongo-adapter/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@Bekacru, @breken-ai, @drewsephski, @gustavovalverde, @mahoor, @vhinayindia

**Full changelog:** [`v1.7.9...v1.7.10`](https://github.com/better-auth/better-auth/compare/v1.7.9...v1.7.10)

## v1.7.9 (2026-10-15)

## `better-auth`

### Bug Fixes

- Fixed `onAPIError.onError` handlers to finish before responses are sent and log failures without interrupting requests ([#11766](https://github.com/better-auth/better-auth/pull/11766))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/da7a98ab5ac6396dc6e88f25db30a05dc160a2c2/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Added `isContinuation` to `postLogin.shouldRedirect` so users can complete authorization after selecting an organization ([#11185](https://github.com/better-auth/better-auth/pull/11185))
- Fixed DPoP validation for token and UserInfo requests behind proxies that rewrite request URLs ([#10799](https://github.com/better-auth/better-auth/pull/10799))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/da7a98ab5ac6396dc6e88f25db30a05dc160a2c2/packages/oauth-provider/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @johanneskares

**Full changelog:** [`v1.7.8...v1.7.9`](https://github.com/better-auth/better-auth/compare/v1.7.8...v1.7.9)

## v1.7.8 (2026-10-14)

## `better-auth`

### Bug Fixes

- Aligned cookie security attributes with RFC 6265bis ([#11540](https://github.com/better-auth/better-auth/pull/11540))
- Added SvelteKit 3 to the supported peer dependency range ([#11488](https://github.com/better-auth/better-auth/pull/11488))
- Fixed stale cookies persisting after `customSession` sessions expire or are revoked ([#10591](https://github.com/better-auth/better-auth/pull/10591))
- Fixed `customSession` treating session lookup errors as signed-out users ([#11391](https://github.com/better-auth/better-auth/pull/11391))
- Fixed sign-in failures, replay checks, and SIWE email handling with `generateId: "uuid"` ([#11625](https://github.com/better-auth/better-auth/pull/11625))
- Removed non-returned custom fields from inferred output schema types ([#11565](https://github.com/better-auth/better-auth/pull/11565))
- Fixed Kysely migration foreign keys when custom table names match another model key ([#11505](https://github.com/better-auth/better-auth/pull/11505))
- Reduced organization plugin server bundles by excluding unused Zod locales ([#10866](https://github.com/better-auth/better-auth/pull/10866))
- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))
- Fixed generic OAuth providers remaining unavailable after discovery fails at startup by retrying on subsequent requests ([#11750](https://github.com/better-auth/better-auth/pull/11750))
- Fixed `lastLoginMethod` sign-in failures when `cookieName` or `maxAge` is explicitly `undefined` ([#11549](https://github.com/better-auth/better-auth/pull/11549))
- Fixed magic link verification changing percent-encoded characters in callback URLs ([#11174](https://github.com/better-auth/better-auth/pull/11174))
- Fixed type errors when using `oauthProvider()` or `mcp()` with `exactOptionalPropertyTypes` ([#10266](https://github.com/better-auth/better-auth/pull/10266))
- Fixed organization plugin type errors in projects with `skipLibCheck: false` ([#11637](https://github.com/better-auth/better-auth/pull/11637))
- Fixed failed password resets consuming reset links or OTPs before the new password is saved ([#11646](https://github.com/better-auth/better-auth/pull/11646))
- Fixed password resets and changes retaining the new password when database session revocation fails ([#11626](https://github.com/better-auth/better-auth/pull/11626))
- Fixed phone number password resets to use a configured `verifyOTP` callback ([#10698](https://github.com/better-auth/better-auth/pull/10698))
- Fixed secondary-storage session failures leaving sign-ups, passkey registrations, or SSO sign-ins in an inconsistent state ([#11643](https://github.com/better-auth/better-auth/pull/11643))
- Fixed missing device sessions and failed automatic session switching after cache eviction ([#11718](https://github.com/better-auth/better-auth/pull/11718))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed ID token sign-in failures caused by up to 30 seconds of clock difference with identity providers ([#11749](https://github.com/better-auth/better-auth/pull/11749))
- Fixed Atlassian user info errors being mislabeled as Figma errors in logs ([#11592](https://github.com/better-auth/better-auth/pull/11592))
- Fixed authentication requests hanging after interrupted async context initialization ([#11711](https://github.com/better-auth/better-auth/pull/11711))
- Fixed recognition of valid `AsyncLocalStorage` initialized after importing Better Auth but before first use, and corrected misleading errors for invalid runtime-provided values in edge and browser fallbacks. ([#11712](https://github.com/better-auth/better-auth/pull/11712))
- Fixed after hooks being skipped for writes retained after a failed request on adapters without transactions ([#11645](https://github.com/better-auth/better-auth/pull/11645))
- Fixed Microsoft Entra ID sign-in and account linking with ID tokens when signing keys omit `alg` ([#11663](https://github.com/better-auth/better-auth/pull/11663))
- Fixed sign-in failures, replay checks, and SIWE email handling with `generateId: "uuid"` ([#11625](https://github.com/better-auth/better-auth/pull/11625))
- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))
- Fixed concurrent MongoDB writes failing with transaction conflicts by retrying transient errors ([#11515](https://github.com/better-auth/better-auth/pull/11515))
- Added support for host-bearing custom-scheme redirect URIs for native OAuth clients ([#10956](https://github.com/better-auth/better-auth/pull/10956))
- Fixed password resets and changes retaining the new password when database session revocation fails ([#11626](https://github.com/better-auth/better-auth/pull/11626))
- Fixed secondary-storage session failures leaving sign-ups, passkey registrations, or SSO sign-ins in an inconsistent state ([#11643](https://github.com/better-auth/better-auth/pull/11643))
- Fixed missing device sessions and failed automatic session switching after cache eviction ([#11718](https://github.com/better-auth/better-auth/pull/11718))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/core/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Features

- Added support for pausing and resuming OAuth clients through `adminUpdateOAuthClient` ([#11654](https://github.com/better-auth/better-auth/pull/11654))
- Added support for linking protected resources when registering a client with `adminCreateOAuthClient` ([#11655](https://github.com/better-auth/better-auth/pull/11655))
- Added resource identifier validation for `adminCreateOAuthResource` and configured `resources` ([#11655](https://github.com/better-auth/better-auth/pull/11655))
- Added `clientId` to `clientPrivileges` checks for actions on existing OAuth clients ([#11658](https://github.com/better-auth/better-auth/pull/11658))

### Bug Fixes

- Fixed sign-in failures, replay checks, and SIWE email handling with `generateId: "uuid"` ([#11625](https://github.com/better-auth/better-auth/pull/11625))
- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))
- Added support for host-bearing custom-scheme redirect URIs for native OAuth clients ([#10956](https://github.com/better-auth/better-auth/pull/10956))
- Fixed startup resource-seeding failures from blocking authentication routes until restart ([#11726](https://github.com/better-auth/better-auth/pull/11726))
- Fixed type errors when using `oauthProvider()` or `mcp()` with `exactOptionalPropertyTypes` ([#10266](https://github.com/better-auth/better-auth/pull/10266))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))
- Fixed SSO provider registration and updates rejecting partial `mapping` values that omit defaulted fields ([#11378](https://github.com/better-auth/better-auth/pull/11378))
- Fixed SAML providers with linked accounts rejecting IdP signing certificate rotation ([#11687](https://github.com/better-auth/better-auth/pull/11687))
- Rejected OIDC SSO providers whose configured issuer does not match discovery, preventing later sign-in failures ([#11438](https://github.com/better-auth/better-auth/pull/11438))
- Fixed SAML providers with linked accounts rejecting changes to their post-login `callbackUrl` ([#11743](https://github.com/better-auth/better-auth/pull/11743))
- Fixed OIDC sign-in when the mapped email claim contains a list of addresses ([#11640](https://github.com/better-auth/better-auth/pull/11640))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/sso/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed SCIM reprovisioning of inactive users with an existing `externalId` ([#11167](https://github.com/better-auth/better-auth/pull/11167))
- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))
- Fixed SCIM requests silently ignoring attribute names with different letter case ([#11644](https://github.com/better-auth/better-auth/pull/11644))
- Fixed concurrent SCIM updates to return `409` instead of `500` when a unique value is already claimed ([#11669](https://github.com/better-auth/better-auth/pull/11669))
- Fixed SCIM User and Group requests rejecting nullable attributes sent as JSON `null` ([#11638](https://github.com/better-auth/better-auth/pull/11638))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/scim/CHANGELOG.md)

## `@better-auth/mongo-adapter`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))
- Fixed failed MongoDB transaction commits leaving transactions open and blocking other writes ([#11602](https://github.com/better-auth/better-auth/pull/11602))
- Fixed concurrent MongoDB writes failing with transaction conflicts by retrying transient errors ([#11515](https://github.com/better-auth/better-auth/pull/11515))
- Fixed MongoDB authentication errors masking the original transaction commit failure ([#11014](https://github.com/better-auth/better-auth/pull/11014))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/mongo-adapter/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))
- Fixed Drizzle sign-in, session refresh, and date filtering with string-based date columns ([#11731](https://github.com/better-auth/better-auth/pull/11731))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))
- Fixed cross-request I/O errors from concurrent D1 queries on a shared auth instance with Kysely 0.29 ([#11490](https://github.com/better-auth/better-auth/pull/11490))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/mcp`

### Bug Fixes

- Fixed `@better-auth/mcp` type errors with `exactOptionalPropertyTypes` and `skipLibCheck: false` ([#11635](https://github.com/better-auth/better-auth/pull/11635))
- Fixed type errors when using `oauthProvider()` or `mcp()` with `exactOptionalPropertyTypes` ([#10266](https://github.com/better-auth/better-auth/pull/10266))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/mcp/CHANGELOG.md)

## `@better-auth/api-key`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/api-key/CHANGELOG.md)

## `@better-auth/cimd`

### Bug Fixes

- Added support for host-bearing custom-scheme redirect URIs for native OAuth clients ([#10956](https://github.com/better-auth/better-auth/pull/10956))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/cimd/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/electron/CHANGELOG.md)

## `@better-auth/memory-adapter`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/memory-adapter/CHANGELOG.md)

## `@better-auth/passkey`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/passkey/CHANGELOG.md)

## `@better-auth/prisma-adapter`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/prisma-adapter/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Stopped reporting completed one-time Stripe checkouts as webhook failures ([#9684](https://github.com/better-auth/better-auth/pull/9684))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/stripe/CHANGELOG.md)

## `@better-auth/telemetry`

### Bug Fixes

- Aligned `@better-auth/utils` and `better-call` dependency versions across official packages ([#11512](https://github.com/better-auth/better-auth/pull/11512))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/d706dd6e99290442e07a7819ff605da8f7bbd5eb/packages/telemetry/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@aryan1306, @Bekacru, @BilalAtique, @breken-ai, @bytaesu, @codewithbharat, @disbell, @drewsephski, @gustavovalverde, @heliohm, @jashkarangiya, @jonathansamines, @kaiizer777, @kdelay, @maxnze1, @nikhilgupta58, @Sandipxg, @shiminshen, @Tushar-Khandelwal-2004

**Full changelog:** [`v1.7.7...v1.7.8`](https://github.com/better-auth/better-auth/compare/v1.7.7...v1.7.8)

## v1.7.7 (2026-09-30)

## `better-auth`

> **Magic Link upgrade:** Upgrade servers sharing verification storage together, request new Magic Links, and restart pending OAuth/SAML sign-ins. No database migration is required. See the [critical advisory](https://github.com/better-auth/better-auth/security/advisories/GHSA-965c-763c-88jm) for affected configurations and custom storage changes.

### Bug Fixes

- Fixed a critical Magic Link account-takeover vulnerability. ([#11494](https://github.com/better-auth/better-auth/pull/11494))
- Fixed ID-token sign-in ignoring the social provider’s `disableSignUp` setting. ([#11491](https://github.com/better-auth/better-auth/pull/11491))
- Fixed OAuth Proxy accepting sign-in state as a provider profile. ([#11494](https://github.com/better-auth/better-auth/pull/11494))
  Upgrade all OAuth Proxy participants together; see the [OAuth Proxy upgrade guidance](https://www.better-auth.com/docs/plugins/oauth-proxy#upgrading-existing-deployments).
- Fixed CAPTCHA errors missing the JSON `Content-Type` header. ([#11476](https://github.com/better-auth/better-auth/pull/11476))
- Fixed the active organization failing to refresh after sign-in when a session hook selects the initial organization. ([#11375](https://github.com/better-auth/better-auth/pull/11375))
- Fixed rate-limit errors missing the JSON `Content-Type` header. ([#11469](https://github.com/better-auth/better-auth/pull/11469))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b96aefb4afcb2397c3a437e5f432324fbd5a4295/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Features

- Added optional `validateRedirectUri` validation for trusted deployments with dynamic OAuth redirect URIs. ([#8686](https://github.com/better-auth/better-auth/pull/8686))
- Added `verifyOAuthQueryParams` to verify signed authorization queries before rendering a custom consent page. ([#11402](https://github.com/better-auth/better-auth/pull/11402))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b96aefb4afcb2397c3a437e5f432324fbd5a4295/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed concurrent PostgreSQL requests exceeding database-backed rate limits. ([#11331](https://github.com/better-auth/better-auth/pull/11331))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b96aefb4afcb2397c3a437e5f432324fbd5a4295/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed `consumeOne` deleting a record after a concurrent write invalidates its original condition. ([#11495](https://github.com/better-auth/better-auth/pull/11495))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b96aefb4afcb2397c3a437e5f432324fbd5a4295/packages/kysely-adapter/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@aryan1306, @bytaesu, @gitmotion, @gustavovalverde, @lennondotw

**Full changelog:** [`v1.7.6...v1.7.7`](https://github.com/better-auth/better-auth/compare/v1.7.6...v1.7.7)

## v1.7.6 (2026-09-24)

## `better-auth`

### Features

- Added support for a `bannedUserMessage` function that receives the banned user, allowing sign-in errors to include details such as the ban reason. ([#11325](https://github.com/better-auth/better-auth/pull/11325))
- Added Vercel BotID as a captcha provider for protected authentication routes. ([#11016](https://github.com/better-auth/better-auth/pull/11016))

### Bug Fixes

- Passwords over `maxPasswordLength` are now rejected with `PASSWORD_TOO_LONG` before hashing or verification. ([#11324](https://github.com/better-auth/better-auth/pull/11324))
- Fixed React hydration mismatches when session or plugin auth queries resolve before streamed components hydrate. ([#11316](https://github.com/better-auth/better-auth/pull/11316))
- Prevented older auth-query responses from overwriting newer results when requests overlap. ([#11376](https://github.com/better-auth/better-auth/pull/11376))
- Fixed model identity when a custom model name matches another schema key. ([#11333](https://github.com/better-auth/better-auth/pull/11333))
- Fixed schema validation for Cloudflare D1 when the Kysely dialect cannot introspect the database. ([#11366](https://github.com/better-auth/better-auth/pull/11366))
- Fixed social account linking through the OAuth Proxy plugin. ([#11268](https://github.com/better-auth/better-auth/pull/11268))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/better-auth/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed model identity when a custom model name matches another schema key. ([#11333](https://github.com/better-auth/better-auth/pull/11333))
- Fixed schema validation for SQLite-generated primary keys, including `INTEGER PRIMARY KEY` columns without `AUTOINCREMENT`. ([#11374](https://github.com/better-auth/better-auth/pull/11374))
- Fixed schema validation for Cloudflare D1 when the Kysely dialect cannot introspect the database. ([#11366](https://github.com/better-auth/better-auth/pull/11366))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/prisma-adapter`

### Bug Fixes

- Fixed model identity when a custom model name matches another schema key. ([#11333](https://github.com/better-auth/better-auth/pull/11333))
- Fixed schema validation for capitalized custom Prisma model names. ([#11319](https://github.com/better-auth/better-auth/pull/11319))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/prisma-adapter/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed model identity when a custom model name matches another schema key. ([#11333](https://github.com/better-auth/better-auth/pull/11333))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/core/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed model identity when a custom model name matches another schema key. ([#11333](https://github.com/better-auth/better-auth/pull/11333))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/memory-adapter`

### Bug Fixes

- Fixed model identity when a custom model name matches another schema key. ([#11333](https://github.com/better-auth/better-auth/pull/11333))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/memory-adapter/CHANGELOG.md)

## `@better-auth/mongo-adapter`

### Bug Fixes

- Fixed model identity when a custom model name matches another schema key. ([#11333](https://github.com/better-auth/better-auth/pull/11333))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/mongo-adapter/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed automatic seat updates after an organization resubscribes, even when canceled subscriptions remain in its history. ([#11347](https://github.com/better-auth/better-auth/pull/11347))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/stripe/CHANGELOG.md)

## `auth`

### Features

- Added read-only `check` and `check schema` commands to validate your configured adapter schema on demand. ([#11314](https://github.com/better-auth/better-auth/pull/11314))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6bb9dbab0b7f351b44dd929e3254c5962e9f8af1/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @davbrito, @rwieruch, @Smidge, @Wadiou, @XXMOHAMED012

**Full changelog:** [`v1.7.5...v1.7.6`](https://github.com/better-auth/better-auth/compare/v1.7.5...v1.7.6)

## v1.7.5 (2026-09-14)

## `better-auth`

### Features

- Added `database.schemaName` support for direct PostgreSQL connections. ([#11203](https://github.com/better-auth/better-auth/pull/11203))

### Bug Fixes

- Improved server-side logging for Cloudflare Turnstile verification failures. ([#11283](https://github.com/better-auth/better-auth/pull/11283))
- Fixed PostgreSQL migrations incorrectly identifying tables and views across schemas. ([#11270](https://github.com/better-auth/better-auth/pull/11270))
- Fixed MySQL index validation for existing string columns. ([#11272](https://github.com/better-auth/better-auth/pull/11272))
- Removed the unused optional `better-sqlite3` peer dependency to prevent installation conflicts. ([#11209](https://github.com/better-auth/better-auth/pull/11209))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6ee148e51b4f97b09c2c3188b275567af0451891/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Features

- Added `database.schemaName` support for direct PostgreSQL connections. ([#11203](https://github.com/better-auth/better-auth/pull/11203))

### Bug Fixes

- Fixed database option type inference outside Cloudflare Workers. ([#11290](https://github.com/better-auth/better-auth/pull/11290))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6ee148e51b4f97b09c2c3188b275567af0451891/packages/core/CHANGELOG.md)

## `@better-auth/cimd`

### Bug Fixes

- Fixed unnecessary pacing of consecutive CIMD OAuth requests when metadata cannot be cached. ([#11161](https://github.com/better-auth/better-auth/pull/11161))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6ee148e51b4f97b09c2c3188b275567af0451891/packages/cimd/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed lazy database initialization when using Drizzle relations. ([#11263](https://github.com/better-auth/better-auth/pull/11263))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6ee148e51b4f97b09c2c3188b275567af0451891/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Features

- Added `database.schemaName` support for direct PostgreSQL connections. ([#11203](https://github.com/better-auth/better-auth/pull/11203))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/6ee148e51b4f97b09c2c3188b275567af0451891/packages/kysely-adapter/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @dshukertjr, @siam923

**Full changelog:** [`v1.7.4...v1.7.5`](https://github.com/better-auth/better-auth/compare/v1.7.4...v1.7.5)

## v1.6.33 (2026-09-14)

## `@better-auth/core`

### Bug Fixes

- Fixed database option type inference for projects that do not use Cloudflare Workers. ([#11291](https://github.com/better-auth/better-auth/pull/11291))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0cb621c79766c3067c7c5de9b1e2f15cddd345e3/packages/core/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@better-release[bot]

**Full changelog:** [`v1.6.32...v1.6.33`](https://github.com/better-auth/better-auth/compare/v1.6.32...v1.6.33)

## v1.6.32 (2026-09-14)

## `better-auth`

### Bug Fixes

- Improved diagnostics for Cloudflare Turnstile verification failures ([#11286](https://github.com/better-auth/better-auth/pull/11286))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/fbc512bece72a32fae678d975a836eb4e9a4137b/packages/better-auth/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@better-release[bot]

**Full changelog:** [`v1.6.31...v1.6.32`](https://github.com/better-auth/better-auth/compare/v1.6.31...v1.6.32)

## v1.7.4 (2026-09-10)

## `better-auth`

### Features

- Added `experimental.instrumentation.enabled` to disable OpenTelemetry span creation per auth instance. ([#11224](https://github.com/better-auth/better-auth/pull/11224))
- Added support for additional session fields in `testUtils` auth helpers. ([#11217](https://github.com/better-auth/better-auth/pull/11217))
- Added Vitest 5 support to the testing utilities. ([#11205](https://github.com/better-auth/better-auth/pull/11205))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/72589990c2634637dc3cc6a3e2017f12e5b2de2f/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Features

- Added `experimental.instrumentation.enabled` to disable OpenTelemetry span creation per auth instance. ([#11224](https://github.com/better-auth/better-auth/pull/11224))

### Bug Fixes

- Fixed Metro bundling when the optional OpenTelemetry API is not installed. ([#11210](https://github.com/better-auth/better-auth/pull/11210))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/72589990c2634637dc3cc6a3e2017f12e5b2de2f/packages/core/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Fixed multibyte session data storage in Expo SecureStore. ([#11238](https://github.com/better-auth/better-auth/pull/11238))
- Fixed stale Expo secure-storage session data and corrupted cookies during concurrent updates. ([#11200](https://github.com/better-auth/better-auth/pull/11200))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/72589990c2634637dc3cc6a3e2017f12e5b2de2f/packages/expo/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Improved schema validation for the Drizzle Relations v2 adapter. ([#11213](https://github.com/better-auth/better-auth/pull/11213))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/72589990c2634637dc3cc6a3e2017f12e5b2de2f/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/test-utils`

### Features

- Added Vitest 5 support to the testing utilities. ([#11205](https://github.com/better-auth/better-auth/pull/11205))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/72589990c2634637dc3cc6a3e2017f12e5b2de2f/packages/test-utils/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @onmax

**Full changelog:** [`v1.7.3...v1.7.4`](https://github.com/better-auth/better-auth/compare/v1.7.3...v1.7.4)

## v1.6.31 (2026-09-10)

## `better-auth`

### Features

- Added an option to disable OpenTelemetry span creation for individual auth instances ([#11228](https://github.com/better-auth/better-auth/pull/11228))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/43415d7081b24e577c227052cc51ccebe909b6a8/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Features

- Added an option to disable OpenTelemetry span creation for individual auth instances ([#11228](https://github.com/better-auth/better-auth/pull/11228))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/43415d7081b24e577c227052cc51ccebe909b6a8/packages/core/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@better-release[bot]

**Full changelog:** [`v1.6.30...v1.6.31`](https://github.com/better-auth/better-auth/compare/v1.6.30...v1.6.31)

## v1.7.3 (2026-09-06)

**_Upgrading from 1.7.0–1.7.2:_**

We restored the 1.6 account core schema to avoid requiring a disruptive backfill for existing users. We recognize the cost to users who already migrated and are committed to keeping the core schema stable throughout v1.

If you applied the 1.7 issuer schema, follow the [upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide#account-identity-keeps-the-provider-key) for the required cleanup. No backfill is needed.

## `better-auth`

### Features

- Added Cloudflare as a built-in social provider with client-secret and PKCE support. ([#9908](https://github.com/better-auth/better-auth/pull/9908))
- Enabled schema validation during initialization by default, including in production, and rejected authentication requests on detected mismatches. ([#11178](https://github.com/better-auth/better-auth/pull/11178))
- Added `isPasswordCompromised` for checking passwords against Have I Been Pwned in custom server-side flows. ([#11147](https://github.com/better-auth/better-auth/pull/11147))

### Bug Fixes

- Aligned generated OpenAPI required fields with runtime validation. ([#11066](https://github.com/better-auth/better-auth/pull/11066))
- Handled malformed custom-scheme callback URLs without excessive processing. ([#11060](https://github.com/better-auth/better-auth/pull/11060))
- Improved Auth0 domain normalization to avoid slow trailing-slash processing. ([#11188](https://github.com/better-auth/better-auth/pull/11188))
- Prevented generic OAuth discovery failures from taking down the authentication API. ([#10978](https://github.com/better-auth/better-auth/pull/10978))
- Tracked email OTP sign-ins in the last login method plugin. ([#10963](https://github.com/better-auth/better-auth/pull/10963))
- Fixed callback hooks being skipped after proxied OAuth sign-ins and preserved server state when callback cookies are unavailable. The legacy /oauth-proxy-callback endpoint is deprecated and will be removed in the next minor release. ([#10988](https://github.com/better-auth/better-auth/pull/10988))
- Fixed `getSession` failures when cookie caching is disabled and cached session cookies remain. ([#11120](https://github.com/better-auth/better-auth/pull/11120))
- Fixed TOTP re-enrollment replacing an active authenticator and its backup codes. ([#11037](https://github.com/better-auth/better-auth/pull/11037))
- Prevented duplicate session requests and hydration mismatches in Nuxt `useFetch`. ([#11084](https://github.com/better-auth/better-auth/pull/11084))
- Improved dynamic organization role permission check performance. ([#11069](https://github.com/better-auth/better-auth/pull/11069))
- Added type-safe Nuxt `useFetch` integration for the Vue client's `useSession` hook. ([#11085](https://github.com/better-auth/better-auth/pull/11085))
- Restored compatibility with 1.6 account schemas by identifying accounts with `(providerId, accountId)` instead of issuer. ([#11153](https://github.com/better-auth/better-auth/pull/11153))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Features

- Added Cloudflare as a built-in social provider with client-secret and PKCE support. ([#9908](https://github.com/better-auth/better-auth/pull/9908))
- Added initialization-time schema validation and actionable mismatch guidance for Drizzle and Prisma adapters. ([#11179](https://github.com/better-auth/better-auth/pull/11179))
- Enabled schema validation during initialization by default, including in production, and rejected authentication requests on detected mismatches. ([#11178](https://github.com/better-auth/better-auth/pull/11178))
- Added custom token endpoint authentication strategies for providers with non-standard request parameters. ([#11101](https://github.com/better-auth/better-auth/pull/11101))

### Bug Fixes

- Restored optional `consumeOne` and `incrementOne` methods for custom database adapters. ([#11189](https://github.com/better-auth/better-auth/pull/11189))
- Fixed TikTok sign-in and token refresh with the documented `clientKey` and `clientSecret` options. ([#11102](https://github.com/better-auth/better-auth/pull/11102))
- Improved request IP validation performance. ([#11068](https://github.com/better-auth/better-auth/pull/11068))
- Improved PayPal authorization code and refresh token requests, including PKCE handling. ([#11129](https://github.com/better-auth/better-auth/pull/11129))
- Improved Reddit token requests with OAuth-compliant Basic authentication and redirect protection. ([#11134](https://github.com/better-auth/better-auth/pull/11134))
- Restored compatibility with 1.6 account schemas by identifying accounts with `(providerId, accountId)` instead of issuer. ([#11153](https://github.com/better-auth/better-auth/pull/11153))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/core/CHANGELOG.md)

## `auth`

### Features

- Added Cloudflare as a built-in social provider with client-secret and PKCE support. ([#9908](https://github.com/better-auth/better-auth/pull/9908))
- Added diagnostics in auth generate for required fields in existing Prisma schemas that Better Auth never writes. ([#11179](https://github.com/better-auth/better-auth/pull/11179))
- Added Codex as a supported target for configuring the Better Auth documentation MCP server. ([#11100](https://github.com/better-auth/better-auth/pull/11100))
- Added schema diagnostics to auth migrate and auth generate, blocking migrations when required columns that Better Auth never writes need manual repair. ([#11178](https://github.com/better-auth/better-auth/pull/11178))

### Bug Fixes

- Updated `auth info` to report installed dependency versions instead of declared specifiers. ([#11126](https://github.com/better-auth/better-auth/pull/11126))
- Allowed `auth init` to complete when generated setup groups have no dependencies. ([#11140](https://github.com/better-auth/better-auth/pull/11140))
- Skipped unsupported dependency specifiers during `auth upgrade` with a clear warning. ([#11127](https://github.com/better-auth/better-auth/pull/11127))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/cli/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Features

- Added initialization-time schema validation and actionable mismatch guidance for Drizzle and Prisma adapters. ([#11179](https://github.com/better-auth/better-auth/pull/11179))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/test-utils`

### Bug Fixes

- Improved adapter test suite performance by avoiding redundant cleanup queries. ([#10762](https://github.com/better-auth/better-auth/pull/10762))
- Updated adapter test suites to remove issuer-specific account requirements. ([#11153](https://github.com/better-auth/better-auth/pull/11153))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/test-utils/CHANGELOG.md)

## `@better-auth/cimd`

### Bug Fixes

- Fixed CIMD client metadata discovery failures with `ERR_INVALID_IP_ADDRESS` on supported Node.js versions. ([#10730](https://github.com/better-auth/better-auth/pull/10730))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/cimd/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Prevented Expo apps from sending unauthenticated requests during interrupted cookie storage updates. ([#11099](https://github.com/better-auth/better-auth/pull/11099))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/expo/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Features

- Enabled database schema validation by default and rejected authentication requests when the live schema does not match. ([#11178](https://github.com/better-auth/better-auth/pull/11178))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Allowed native OAuth clients using `localhost` loopback redirects to use ephemeral callback ports. ([#11090](https://github.com/better-auth/better-auth/pull/11090))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/prisma-adapter`

### Features

- Added initialization-time schema validation and actionable mismatch guidance for Drizzle and Prisma adapters. ([#11179](https://github.com/better-auth/better-auth/pull/11179))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/prisma-adapter/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Restored compatibility with 1.6 account schemas by identifying accounts with `(providerId, accountId)` instead of issuer. ([#11153](https://github.com/better-auth/better-auth/pull/11153))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/0d6b5c0beaa47c8ac6d9a49d5ecacfb719285277/packages/sso/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@BetterAndBetterII, @bytaesu, @erikpr1994, @gustavovalverde, @harshil1712, @onmax, @Salman-Arshad, @starslingdev[bot], @supercell02, @thisismert

**Full changelog:** [`v1.7.2...v1.7.3`](https://github.com/better-auth/better-auth/compare/v1.7.2...v1.7.3)

## v1.7.2 (2026-08-26)

## `better-auth`

### Bug Fixes

- Fixed permanent user bans to clear expiration dates from previous temporary bans. ([#10823](https://github.com/better-auth/better-auth/pull/10823))
- Fixed client types with more plugins being assignable to types declaring fewer plugins. ([#10907](https://github.com/better-auth/better-auth/pull/10907))
- Added warnings for invalid signed session data in the cookie cache. ([#10934](https://github.com/better-auth/better-auth/pull/10934))
- Fixed disabled MyISAM indexes from satisfying migration index checks. ([#10877](https://github.com/better-auth/better-auth/pull/10877))
- Fixed programmatic migrations on Cloudflare D1 while preserving existing-index validation. ([#10875](https://github.com/better-auth/better-auth/pull/10875))
- Allowed `~` in relative callback URLs validated by trusted-origin checks. ([#10041](https://github.com/better-auth/better-auth/pull/10041))
- Improved validation of relative callback and redirect URLs with paths, queries, and fragments. ([#10979](https://github.com/better-auth/better-auth/pull/10979))
- Allowed same-origin form submissions with `Referrer-Policy: no-referrer` while continuing to reject untrusted origins. ([#10959](https://github.com/better-auth/better-auth/pull/10959))
- Improved `getTestInstance` performance with a faster default password hasher. ([#10879](https://github.com/better-auth/better-auth/pull/10879))
- Standardized built-in placeholder emails to the namespaced `{identifier}@{namespace}.placeholder.invalid` format. ([#10982](https://github.com/better-auth/better-auth/pull/10982))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c50200bfc716cf43f5c29a2dd5766f6485c46aa1/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed async context loss in Cloudflare Workers bundles with multiple runtime conditions. ([#10855](https://github.com/better-auth/better-auth/pull/10855))
- Fixed auth request logs to respect the configured logger, log level, and disabled setting. ([#10939](https://github.com/better-auth/better-auth/pull/10939))
- Improved validation of relative callback and redirect URLs with paths, queries, and fragments. ([#10979](https://github.com/better-auth/better-auth/pull/10979))
- Standardized built-in placeholder emails to the namespaced `{identifier}@{namespace}.placeholder.invalid` format. ([#10982](https://github.com/better-auth/better-auth/pull/10982))
- Added synchronous and optional access to the current auth endpoint context. ([#10938](https://github.com/better-auth/better-auth/pull/10938))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c50200bfc716cf43f5c29a2dd5766f6485c46aa1/packages/core/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed Client ID Metadata Document registration when clients share at least one supported grant with the server. ([#11010](https://github.com/better-auth/better-auth/pull/11010))
- Improved validation of relative callback and redirect URLs with paths, queries, and fragments. ([#10979](https://github.com/better-auth/better-auth/pull/10979))
- Fixed relative redirect URLs containing fragments. ([#10983](https://github.com/better-auth/better-auth/pull/10983))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c50200bfc716cf43f5c29a2dd5766f6485c46aa1/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed one-to-one Drizzle relations when `usePlural` is enabled. ([#10941](https://github.com/better-auth/better-auth/pull/10941))
- Added validation for missing Drizzle schema fields in compound `where` clauses. ([#10859](https://github.com/better-auth/better-auth/pull/10859))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c50200bfc716cf43f5c29a2dd5766f6485c46aa1/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed programmatic migrations on Cloudflare D1 while preserving existing-index validation. ([#10875](https://github.com/better-auth/better-auth/pull/10875))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c50200bfc716cf43f5c29a2dd5766f6485c46aa1/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Improved validation of relative callback and redirect URLs with paths, queries, and fragments. ([#10979](https://github.com/better-auth/better-auth/pull/10979))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c50200bfc716cf43f5c29a2dd5766f6485c46aa1/packages/sso/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @GautamBytes, @heliohm, @sosyz, @starslingdev[bot]

**Full changelog:** [`v1.7.1...v1.7.2`](https://github.com/better-auth/better-auth/compare/v1.7.1...v1.7.2)

## v1.7.1 (2026-08-18)

## `better-auth`

### Bug Fixes

- Added native database transaction support to test instances for PostgreSQL and MySQL.
- Updated bundled dependencies (`jose`, nanostores, noble crypto packages, SimpleWebAuthn) to their latest compatible releases, with no changes required to existing projects.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/2344536054f9164ca5d1670c270d299049ee233e/packages/better-auth/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed case-insensitive parsing of string Boolean values for SCIM User `active` and the `primary` sub-attribute of `emails`, `phoneNumbers`, `addresses`, `roles`, and `entitlements` at the HTTP ingress, improving Microsoft Entra interoperability.
- Added an optional SCIM-owned connection and credential catalog: configure `managedConnections` to allow trusted server code to create runtime tenant connections and issue, rotate, and revoke bearer credentials through server-only `auth.api` methods, without a code-defined connection or an application-owned verifier.
- Fixed an issue where trusted server code could not retain a terminal connection binding before a dynamic SCIM connection's first authenticated request when supplying a provisioning domain during decommissioning.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/2344536054f9164ca5d1670c270d299049ee233e/packages/scim/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed SSO provider registration to allow reusing a SCIM connection ID, as SCIM connections no longer participate in the authentication provider namespace.
- Fixed SAML assertion signature verification to validate signatures on the raw assertion instead of trusting an already-parsed response, and enforced signing policy and size limits on SP metadata. `wantAssertionsSigned` now correctly controls whether the SP requires signed assertions, matching real-world IdP signing behavior.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/2344536054f9164ca5d1670c270d299049ee233e/packages/sso/CHANGELOG.md)

## `@better-auth/cimd`

### Bug Fixes

- Fixed Client ID Metadata Document caching to follow shared-cache freshness rules: the plugin now prefers `s-maxage` over `max-age` and `Expires`, honors `s-maxage=0`, conditionally revalidates with `ETag` or `Last-Modified`, and treats invalid or duplicate freshness directives as immediately stale. Concurrent refreshes now converge on a single client-resource link instead of failing on a unique constraint.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/2344536054f9164ca5d1670c270d299049ee233e/packages/cimd/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed native adapter transactions for raw database instances (better-sqlite3, `node:sqlite`, `bun:sqlite`, `mysql2`, `pg`) passed directly as `database`, matching the behavior of the explicit `{ db }`/`{ dialect }` config shapes. Plugins requiring native transactions (such as `@better-auth/scim`) now work correctly when using the quickstart `database: new Database(...)` form.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/2344536054f9164ca5d1670c270d299049ee233e/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed scope error responses so MCP clients now receive a `403` with an RFC 6750 `insufficient_scope` `WWW-Authenticate` challenge naming every missing scope, allowing clients to request all needed scopes in a single authorization request.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/2344536054f9164ca5d1670c270d299049ee233e/packages/oauth-provider/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed the CLI to refuse adding required columns without default values to already-populated tables ([#10863](https://github.com/better-auth/better-auth/pull/10863))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/2344536054f9164ca5d1670c270d299049ee233e/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.7.0...v1.7.1`](https://github.com/better-auth/better-auth/compare/v1.7.0...v1.7.1)

## v1.7.0 (2026-08-18)

**Blog post:** [Better Auth 1.7](https://better-auth.com/blog/1-7)

## `better-auth`

### ❗ Breaking Changes

- Moved database joins out of `experimental` into the stable `advanced.database.joins` option ([#10359](https://github.com/better-auth/better-auth/pull/10359))
  > **Migration:** Replace `experimental: { joins: true }` with `advanced: { database: { joins: true } }`. Drizzle and Prisma users should regenerate their schema (`npx auth@latest generate`) so it includes the required relations.
- Scoped account identity by trusted issuer, keying accounts on `(issuer, accountId)` ([#10403](https://github.com/better-auth/better-auth/pull/10403))
  > **Migration:** Accounts now require `Account.issuer`. Read provider identity from `accountInfo.account.accountId`, drop `mapping.id` from SSO configs, and give the `microsoftEntraId` helper a concrete tenant GUID. Apply the account-identity backfill in the 1.7 upgrade guide before deploying.
- Required captcha endpoint entries to match full auth paths, with wildcard support ([#10004](https://github.com/better-auth/better-auth/pull/10004))
  > **Migration:** Replace partial paths such as `/sign-in` with explicit wildcards like `/sign-in/*` or `/sign-in/**`.
- Moved the MCP plugin into its own `@better-auth/mcp` package built on the OAuth provider ([#9992](https://github.com/better-auth/better-auth/pull/9992))
  > **Migration:** Install `@better-auth/mcp` and `@better-auth/cimd`, add the now-required `jwt()` plugin, and move options nested under `oidcConfig` to flat `mcp({ ... })` options. Rename `withMcpAuth` to `requireMcpAuth` and `mcpHandler` to `createMcpProtectedRequestHandler`. Regenerate the schema (`npx auth migrate`): `oauthApplication` becomes `oauthClient`, plus new `oauthRefreshToken` and `oauthClientAssertion` tables.
- Added OIDC back-channel logout so ending a session cuts off every connected app's API access ([#9304](https://github.com/better-auth/better-auth/pull/9304))
  > **Migration:** Introspecting an access token whose session has ended now returns `{ active: false }`, and `/oauth2/userinfo` rejects it. Clients opt into notifications by registering `backchannel_logout_uri`. Run the schema migration for the new `oauthClient` and `oauthAccessToken` columns.
- Modeled OAuth protected resources explicitly, with per-resource TTLs, scopes, claims, and signing pins ([#9648](https://github.com/better-auth/better-auth/pull/9648))
  > **Migration:** `validAudiences` is removed: move each resource identifier into `resources` and link restricted clients through `oauthClientResource`. `@better-auth/mcp` now requires an explicit `resource`. Run `npx @better-auth/cli generate` and apply the migration before deploying.
- Decoupled SCIM provisioning from the organization plugin ([#10390](https://github.com/better-auth/better-auth/pull/10390))
  > **Migration:** SCIM configuration, client APIs, database schema, and the Group model are all replaced, and provisioning state cannot migrate in place. Follow the SCIM cutover in the 1.7 upgrade guide, including a full directory reprovision, before resuming traffic.
- Added OTP-only two-factor enablement with a discriminated `enableTwoFactor` response ([#9057](https://github.com/better-auth/better-auth/pull/9057))
  > **Migration:** `enableTwoFactor` now returns a `method` field (`"otp"` or `"totp"`); narrow on it before reading `totpURI` and `backupCodes`. Pass `method: "otp"` for OTP enrollment, which requires `otpOptions.sendOTP`.
- Resolved the auth origin from `Host` by default when using a dynamic `baseURL` ([#9134](https://github.com/better-auth/better-auth/pull/9134))
  > **Migration:** If your proxy exposes the public hostname only through `x-forwarded-host`, set `advanced.trustedProxyHeaders: true`. Deployments where the proxy rewrites `Host` (nginx default, Vercel, Cloudflare, Netlify) are unaffected.
- Added unique lookup indexes for the device authorization `deviceCode` and `userCode` columns ([#10059](https://github.com/better-auth/better-auth/pull/10059))
  > **Migration:** Resolve duplicate code values before applying the migration. MySQL and SQL Server installations must also convert both columns to bounded strings and clean up values longer than 191 characters.
- Enforced S256 PKCE in the Electron sign-in flow and hardened custom-scheme origin checks ([#9645](https://github.com/better-auth/better-auth/pull/9645))
  > **Migration:** Upgrade the `@better-auth/electron` client and server together and add your app's scheme to `trustedOrigins`. The `code_challenge_method` parameter and `disableOriginOverride` option are removed, and host-bearing custom-scheme entries now match that host exactly.
- Identified Microsoft Entra accounts by the stable `oid` claim ([#10204](https://github.com/better-auth/better-auth/pull/10204))
  > **Migration:** Migrate existing Microsoft account rows created from `sub` before upgrading. Tokens without a valid `oid` are rejected.
- Required a Google client ID before Google One Tap verifies ID tokens ([#10036](https://github.com/better-auth/better-auth/pull/10036))
  > **Migration:** Configure `oneTap({ clientId })` or `socialProviders.google.clientId`.
- Removed the deprecated `oidcProvider` plugin ([#10031](https://github.com/better-auth/better-auth/pull/10031))
  > **Migration:** Move OIDC authorization-server integrations to `@better-auth/oauth-provider`.
- Rewrote the generic OAuth plugin as a first-class social provider with OAuth 2.1 defaults ([#9069](https://github.com/better-auth/better-auth/pull/9069))
  > **Migration:** Replace `signIn.oauth2({ providerId })` with `signIn.social({ provider })`, `oauth2.link()` with `linkSocial()`, and drop `genericOAuthClient()`. Callbacks move to `/api/auth/callback/:id`, `pkce` now defaults to `true`, and `issuer` and `requireIssuerValidation` are removed in favor of OIDC discovery.
- Separated OAuth device grant ownership into `oauthDeviceAuthorization()` ([#10746](https://github.com/better-auth/better-auth/pull/10746))
  > **Migration:** The OAuth integration replaces the optional `resource` column with `oauthClientId` and `resources`, so regenerate and apply the schema. Let pending device codes expire before upgrading from an earlier 1.7 prerelease.
- Verified provider `id_tokens` with a single shared verifier ([#9828](https://github.com/better-auth/better-auth/pull/9828))
  > **Migration:** Custom `UpstreamProvider` implementations replace the removed `verifyIdToken` method with an `idToken` config carrying a JWKS source, issuer, and audience. PayPal client `id_token` sign-in now returns `ID_TOKEN_NOT_SUPPORTED`; its redirect flow is unchanged.

### Features

- Added `clientAssertion` support to the Microsoft Entra ID social provider ([#9898](https://github.com/better-auth/better-auth/pull/9898))
- Made the `Auth` instance directly fetchable ([#9431](https://github.com/better-auth/better-auth/pull/9431))
- Added per-provider `requireEmailVerification` for social sign-in ([#9929](https://github.com/better-auth/better-auth/pull/9929))
- Added a `user.validateUserInfo` gate for rejecting an identity before a user is created or linked ([#9864](https://github.com/better-auth/better-auth/pull/9864))
- Added `hydrateSession` so `useSession` returns server-fetched data on the first render ([#8733](https://github.com/better-auth/better-auth/pull/8733))
- Added compound table indexes to plugin database schemas ([#10402](https://github.com/better-auth/better-auth/pull/10402))
- Added `allowIdpInitiated` support for IdP-initiated flows through a secure server-side bounce ([#9301](https://github.com/better-auth/better-auth/pull/9301))
- Added RP-initiated logout so `signOut()` can also sign users out of the OpenID provider ([#9368](https://github.com/better-auth/better-auth/pull/9368))
- Added `refreshTokenParams` for forwarding extra parameters on generic OAuth token refresh ([#9948](https://github.com/better-auth/better-auth/pull/9948))
- Verified discovery `id_tokens` against the provider JWKS and enabled `id_token` sign-in for generic OAuth ([#9966](https://github.com/better-auth/better-auth/pull/9966))
- Added the OAuth device authorization grant (RFC 8628) ([#10135](https://github.com/better-auth/better-auth/pull/10135))
- Added DPoP sender-constrained access tokens (RFC 9449) ([#10039](https://github.com/better-auth/better-auth/pull/10039))
- Added the `at_hash` claim to ID tokens issued alongside an access token, per OIDC Core §3.1.3.6 ([#9079](https://github.com/better-auth/better-auth/pull/9079))
- Added `private_key_jwt` client authentication for token endpoint requests (RFC 7523) ([#8836](https://github.com/better-auth/better-auth/pull/8836))
- Sent `Cache-Control: no-store` on every OAuth response that carries credentials ([#10065](https://github.com/better-auth/better-auth/pull/10065))
- Added per-request `additionalParams` and `loginHint` across `signIn.social`, `linkSocial`, and `signIn.sso` ([#9305](https://github.com/better-auth/better-auth/pull/9305))
- Added a server-trusted OAuth state channel, fixing anonymous account linking in in-app browsers ([#9930](https://github.com/better-auth/better-auth/pull/9930))
- Allowed passing `userId` and `organizationId` to the `listUserTeams` API ([#8977](https://github.com/better-auth/better-auth/pull/8977))
- Added `organization.getOrganization()` for metadata-only fetches ([#10397](https://github.com/better-auth/better-auth/pull/10397))
- Added a server-only `consumePhoneNumberOTP` API for custom phone OTP flows ([#9766](https://github.com/better-auth/better-auth/pull/9766))
- Added JWKS-backed asymmetric JWTs for the session cookie cache ([#8931](https://github.com/better-auth/better-auth/pull/8931))
- Added transactional OIDC user resolution for SSO sign-ins ([#10473](https://github.com/better-auth/better-auth/pull/10473))
- Added an immutable username option ([#9240](https://github.com/better-auth/better-auth/pull/9240))
- Allowed omitting the username plugin's separate `displayUsername` field ([#10330](https://github.com/better-auth/better-auth/pull/10330))

### Bug Fixes

- Allowed test instances to enable native database transactions for PostgreSQL and MySQL.
- Refreshed bundled dependencies (jose, nanostores, the noble crypto packages, and SimpleWebAuthn) to their latest compatible releases. These updates are backward compatible and require no changes to existing projects.
- Widened the `drizzle-kit` peer dependency range ([#10299](https://github.com/better-auth/better-auth/pull/10299))
- Decoupled the session cookie cache from JWT plugin internals ([#10666](https://github.com/better-auth/better-auth/pull/10666))
- Allowed `auth migrate` to add required columns with static defaults and nullable unique columns to existing tables ([#10293](https://github.com/better-auth/better-auth/pull/10293))
- Bound the ID token `nonce` to the authorization request in the generic OAuth redirect flow ([#10095](https://github.com/better-auth/better-auth/pull/10095))
- Fixed a sign-up deadlock when JWT cookie caching ran on a single-connection SQLite database with native transactions ([#10622](https://github.com/better-auth/better-auth/pull/10622))
- Created new OAuth accounts inside the user creation transaction ([#10125](https://github.com/better-auth/better-auth/pull/10125))
- Derived the OAuth `redirect_uri` from the per-request base URL in multi-host deployments ([#10127](https://github.com/better-auth/better-auth/pull/10127))
- Preserved previously granted `account.scope` values across re-authentication and token refresh ([#10128](https://github.com/better-auth/better-auth/pull/10128))
- Preserved the resolved OAuth user when `overrideUserInfo` returns `null` ([#10124](https://github.com/better-auth/better-auth/pull/10124))
- Fired session-delete hooks and revoked bound OAuth tokens for preserved sessions on `secondaryStorage` ([#9969](https://github.com/better-auth/better-auth/pull/9969))
- Issued SIWE nonces before the wallet address and chain ID are known ([#10234](https://github.com/better-auth/better-auth/pull/10234))
- Fixed client plugin composition so One Tap, Electron, and Expo type-check with `createAuthClient` ([#10505](https://github.com/better-auth/better-auth/pull/10505))
- Single-sourced HTTP Basic credential encoding and decoding for OAuth client authentication ([#9657](https://github.com/better-auth/better-auth/pull/9657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- Moved the MCP plugin into its own `@better-auth/mcp` package built on the OAuth provider ([#9992](https://github.com/better-auth/better-auth/pull/9992))
  > **Migration:** Install `@better-auth/mcp` and `@better-auth/cimd`, add the now-required `jwt()` plugin, and move options nested under `oidcConfig` to flat `mcp({ ... })` options. Rename `withMcpAuth` to `requireMcpAuth` and `mcpHandler` to `createMcpProtectedRequestHandler`. Regenerate the schema (`npx auth migrate`): `oauthApplication` becomes `oauthClient`, plus new `oauthRefreshToken` and `oauthClientAssertion` tables.
- Added OIDC back-channel logout so ending a session cuts off every connected app's API access ([#9304](https://github.com/better-auth/better-auth/pull/9304))
  > **Migration:** Introspecting an access token whose session has ended now returns `{ active: false }`, and `/oauth2/userinfo` rejects it. Clients opt into notifications by registering `backchannel_logout_uri`. Run the schema migration for the new `oauthClient` and `oauthAccessToken` columns.
- Aligned OAuth client registration and metadata with MCP authorization 2026-07-28 ([#10577](https://github.com/better-auth/better-auth/pull/10577))
  > **Migration:** Add `applicationType` and nullable `clientDiscoveryId` columns, deduplicate existing `(clientId, resourceId)` links before the new compound unique index, then drop the legacy `type` and `public` columns. Replace `clientCredentialGrantDefaultScopes` with per-client `clientCredentialsScopes`, backfilling every client to `[]` and reassigning approved machine scopes after an audit. `mcp()` no longer enables unauthenticated DCR: compose it with `cimd()` or enable both DCR flags explicitly.
- Enforced the `max_age` authorization request parameter ([#9936](https://github.com/better-auth/better-auth/pull/9936))
  > **Migration:** Users who authenticated longer ago than the requested `max_age` are now sent back to log in, and the ID token's `auth_time` reflects the fresh login. Flows that relied on `max_age` being ignored will prompt again.
- Made ID token claim authority explicit, reserving OIDC protocol claims for the provider ([#10140](https://github.com/better-auth/better-auth/pull/10140))
  > **Migration:** `customIdTokenClaims`, extension claims, and per-issuance `idTokenClaims` can no longer set protocol claims such as issuer, subject, audience, `nonce`, `auth_time`, `acr`, `amr`, or `azp`; use namespaced custom claims instead. ID tokens now carry `acr: "0"` and discovery advertises only `"0"`.
- Modeled OAuth protected resources explicitly, with per-resource TTLs, scopes, claims, and signing pins ([#9648](https://github.com/better-auth/better-auth/pull/9648))
  > **Migration:** `validAudiences` is removed: move each resource identifier into `resources` and link restricted clients through `oauthClientResource`. `@better-auth/mcp` now requires an explicit `resource`. Run `npx @better-auth/cli generate` and apply the migration before deploying.
- Bound OAuth client authentication to the grant being issued ([#10063](https://github.com/better-auth/better-auth/pull/10063))
  > **Migration:** Remove `grantType` from `provider.authenticateClient(...)`, and return `{ clientId, confirmation? }` from a custom `OAuthClientAuthenticationStrategy.authenticate` instead of a client record.
- Bound RFC 8707 resource indicators to the authorization grant ([#9836](https://github.com/better-auth/better-auth/pull/9836))
  > **Migration:** Token and refresh requests may only narrow the authorization's `resource`; a broader request returns `invalid_target`. `customAccessTokenClaims` now receives a `resources` array in place of the `resource` string. Run the schema migration to add the new resource columns.
- Returned RFC-compliant OAuth error envelopes from validation failures ([#9277](https://github.com/better-auth/better-auth/pull/9277))
  > **Migration:** Authorization errors now redirect to a registered client's trusted redirect URI with `state` and `iss` instead of rendering the server error page, and confidential clients must use their registered `token_endpoint_auth_method`.
- Rewrote the generic OAuth plugin as a first-class social provider with OAuth 2.1 defaults ([#9069](https://github.com/better-auth/better-auth/pull/9069))
  > **Migration:** Replace `signIn.oauth2({ providerId })` with `signIn.social({ provider })`, `oauth2.link()` with `linkSocial()`, and drop `genericOAuthClient()`. Callbacks move to `/api/auth/callback/:id`, `pkce` now defaults to `true`, and `issuer` and `requireIssuerValidation` are removed in favor of OIDC discovery.
- Separated OAuth device grant ownership into `oauthDeviceAuthorization()` ([#10746](https://github.com/better-auth/better-auth/pull/10746))
  > **Migration:** The OAuth integration replaces the optional `resource` column with `oauthClientId` and `resources`, so regenerate and apply the schema. Let pending device codes expire before upgrading from an earlier 1.7 prerelease.

### Features

- Added token endpoint client authentication configuration across the OAuth stack ([#9625](https://github.com/better-auth/better-auth/pull/9625))
- Added the `@better-auth/cimd` Client ID Metadata Document plugin ([#9159](https://github.com/better-auth/better-auth/pull/9159))
- Added the OAuth device authorization grant (RFC 8628) ([#10135](https://github.com/better-auth/better-auth/pull/10135))
- Added DPoP sender-constrained access tokens (RFC 9449) ([#10039](https://github.com/better-auth/better-auth/pull/10039))
- Added an extension surface for registering grants, client authentication methods, discovery metadata, and claim contributors ([#10030](https://github.com/better-auth/better-auth/pull/10030))
- Added a refresh token reuse interval that replays the same response for duplicate refresh requests ([#10145](https://github.com/better-auth/better-auth/pull/10145))
- Allowed confidential DCR clients to complete authorization-code flows without PKCE ([#10146](https://github.com/better-auth/better-auth/pull/10146))
- Added the `at_hash` claim to ID tokens issued alongside an access token, per OIDC Core §3.1.3.6 ([#9079](https://github.com/better-auth/better-auth/pull/9079))
- Made token introspection consistent across opaque and JWT tokens and scoped it to the audience ([#10045](https://github.com/better-auth/better-auth/pull/10045))
- Exposed the issuing `sessionId` to `id_token` claim contributors ([#10113](https://github.com/better-auth/better-auth/pull/10113))
- Honored requested UserInfo claims through a claim registry ([#10156](https://github.com/better-auth/better-auth/pull/10156))
- Removed the `silenceWarnings` option and the well-known endpoint warnings it suppressed ([#10703](https://github.com/better-auth/better-auth/pull/10703))
- Added protected dynamic client registration using RFC 7591 initial access tokens ([#10037](https://github.com/better-auth/better-auth/pull/10037))
- Added `private_key_jwt` client authentication for token endpoint requests (RFC 7523) ([#8836](https://github.com/better-auth/better-auth/pull/8836))
- Sent `Cache-Control: no-store` on every OAuth response that carries credentials ([#10065](https://github.com/better-auth/better-auth/pull/10065))
- Added a server-trusted OAuth state channel, fixing anonymous account linking in in-app browsers ([#9930](https://github.com/better-auth/better-auth/pull/9930))

### Bug Fixes

- Enforced RFC 8628 request cardinality and client authentication on the device flow endpoints ([#10752](https://github.com/better-auth/better-auth/pull/10752))
- Accepted the OpenID Provider issuer as the `aud` of `private_key_jwt` client assertions ([#10811](https://github.com/better-auth/better-auth/pull/10811))
- Accepted UserInfo bearer tokens sent in a form-encoded request body ([#10155](https://github.com/better-auth/better-auth/pull/10155))
- Allowed nonce-bound confidential clients to request `offline_access` without PKCE ([#10153](https://github.com/better-auth/better-auth/pull/10153))
- Returned a `401 invalid_token` challenge from `/oauth2/userinfo` for invalid tokens ([#10068](https://github.com/better-auth/better-auth/pull/10068))
- Completed the RP-initiated logout flow with form-encoded `POST` support and confirmation pages ([#10812](https://github.com/better-auth/better-auth/pull/10812))
- Deferred token revocation and back-channel logout delivery until the session deletion commits ([#10472](https://github.com/better-auth/better-auth/pull/10472))
- Accepted form-encoded POST authorization requests and rejected unsupported OIDC request objects ([#10151](https://github.com/better-auth/better-auth/pull/10151))
- Handled voluntary and essential `acr` claim requests per OIDC Core ([#10790](https://github.com/better-auth/better-auth/pull/10790))
- Kept `profile` and `email` scope claims on the UserInfo response instead of ID tokens ([#10152](https://github.com/better-auth/better-auth/pull/10152))
- Made the `private_key_jwt` `jti` single-use atomic across processes ([#9964](https://github.com/better-auth/better-auth/pull/9964))
- Made `redirect_uri` conditional at the token endpoint, required only when the authorization included one ([#10159](https://github.com/better-auth/better-auth/pull/10159))
- Preserved client key metadata and the requested authentication method during dynamic client registration ([#10144](https://github.com/better-auth/better-auth/pull/10144))
- Redirected authorization requests missing `response_type` to the verified client redirect URI ([#10149](https://github.com/better-auth/better-auth/pull/10149))
- Rejected authorization code replay with `invalid_grant` and revoked tokens issued from that code ([#10150](https://github.com/better-auth/better-auth/pull/10150))
- Reported `unsupported_token_type` when revoking a JWT access token ([#9970](https://github.com/better-auth/better-auth/pull/9970))
- Required the `openid` scope for authorization requests that use the `claims` parameter ([#10791](https://github.com/better-auth/better-auth/pull/10791))
- Returned `invalid_grant` when a client presents a refresh token issued to another client ([#10154](https://github.com/better-auth/better-auth/pull/10154))
- MCP clients that hit a scope wall now learn exactly which scopes to ask for: missing protected scopes produce a `403` with an RFC 6750 `insufficient_scope` challenge naming every one of them, so clients can request them in a single authorization redirect.
- Single-sourced HTTP Basic credential encoding and decoding for OAuth client authentication ([#9657](https://github.com/better-auth/better-auth/pull/9657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/core`

### ❗ Breaking Changes

- Moved database joins out of `experimental` into the stable `advanced.database.joins` option ([#10359](https://github.com/better-auth/better-auth/pull/10359))
  > **Migration:** Replace `experimental: { joins: true }` with `advanced: { database: { joins: true } }`. Drizzle and Prisma users should regenerate their schema (`npx auth@latest generate`) so it includes the required relations.
- Scoped account identity by trusted issuer, keying accounts on `(issuer, accountId)` ([#10403](https://github.com/better-auth/better-auth/pull/10403))
  > **Migration:** Accounts now require `Account.issuer`. Read provider identity from `accountInfo.account.accountId`, drop `mapping.id` from SSO configs, and give the `microsoftEntraId` helper a concrete tenant GUID. Apply the account-identity backfill in the 1.7 upgrade guide before deploying.
- Decoupled SCIM provisioning from the organization plugin ([#10390](https://github.com/better-auth/better-auth/pull/10390))
  > **Migration:** SCIM configuration, client APIs, database schema, and the Group model are all replaced, and provisioning state cannot migrate in place. Follow the SCIM cutover in the 1.7 upgrade guide, including a full directory reprovision, before resuming traffic.
- Identified Microsoft Entra accounts by the stable `oid` claim ([#10204](https://github.com/better-auth/better-auth/pull/10204))
  > **Migration:** Migrate existing Microsoft account rows created from `sub` before upgrading. Tokens without a valid `oid` are rejected.
- Verified provider `id_tokens` with a single shared verifier ([#9828](https://github.com/better-auth/better-auth/pull/9828))
  > **Migration:** Custom `UpstreamProvider` implementations replace the removed `verifyIdToken` method with an `idToken` config carrying a JWKS source, issuer, and audience. PayPal client `id_token` sign-in now returns `ID_TOKEN_NOT_SUPPORTED`; its redirect flow is unchanged.

### Features

- Added `clientAssertion` support to the Microsoft Entra ID social provider ([#9898](https://github.com/better-auth/better-auth/pull/9898))
- Added per-provider `requireEmailVerification` for social sign-in ([#9929](https://github.com/better-auth/better-auth/pull/9929))
- Added a `user.validateUserInfo` gate for rejecting an identity before a user is created or linked ([#9864](https://github.com/better-auth/better-auth/pull/9864))
- Added compound table indexes to plugin database schemas ([#10402](https://github.com/better-auth/better-auth/pull/10402))
- Added `allowIdpInitiated` support for IdP-initiated flows through a secure server-side bounce ([#9301](https://github.com/better-auth/better-auth/pull/9301))
- Added RP-initiated logout so `signOut()` can also sign users out of the OpenID provider ([#9368](https://github.com/better-auth/better-auth/pull/9368))
- Added `refreshTokenParams` for forwarding extra parameters on generic OAuth token refresh ([#9948](https://github.com/better-auth/better-auth/pull/9948))
- Added an `includeGrantedScopes` option to the Google provider ([#10129](https://github.com/better-auth/better-auth/pull/10129))
- Added DPoP sender-constrained access tokens (RFC 9449) ([#10039](https://github.com/better-auth/better-auth/pull/10039))
- Added `private_key_jwt` client authentication for token endpoint requests (RFC 7523) ([#8836](https://github.com/better-auth/better-auth/pull/8836))
- Sent `Cache-Control: no-store` on every OAuth response that carries credentials ([#10065](https://github.com/better-auth/better-auth/pull/10065))
- Added per-request `additionalParams` and `loginHint` across `signIn.social`, `linkSocial`, and `signIn.sso` ([#9305](https://github.com/better-auth/better-auth/pull/9305))
- Added JWKS-backed asymmetric JWTs for the session cookie cache ([#8931](https://github.com/better-auth/better-auth/pull/8931))
- Added transactional OIDC user resolution for SSO sign-ins ([#10473](https://github.com/better-auth/better-auth/pull/10473))

### Bug Fixes

- Routed CIMD `client_id` SSRF checks through the shared host classifier, which now rejects IPv4-compatible IPv6, the 6to4 relay prefix, and site-local addresses ([#10126](https://github.com/better-auth/better-auth/pull/10126))
- Derived the OAuth `redirect_uri` from the per-request base URL in multi-host deployments ([#10127](https://github.com/better-auth/better-auth/pull/10127))
- Preserved previously granted `account.scope` values across re-authentication and token refresh ([#10128](https://github.com/better-auth/better-auth/pull/10128))
- Fixed client plugin composition so One Tap, Electron, and Expo type-check with `createAuthClient` ([#10505](https://github.com/better-auth/better-auth/pull/10505))
- Single-sourced HTTP Basic credential encoding and decoding for OAuth client authentication ([#9657](https://github.com/better-auth/better-auth/pull/9657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/core/CHANGELOG.md)

## `@better-auth/sso`

### ❗ Breaking Changes

- Scoped account identity by trusted issuer, keying accounts on `(issuer, accountId)` ([#10403](https://github.com/better-auth/better-auth/pull/10403))
  > **Migration:** Accounts now require `Account.issuer`. SSO subjects are protocol-defined (`sub` for OIDC, signed `NameID` for SAML) and `mapping.id` is removed; a manual SAML config without metadata XML must set `idpMetadata.entityID`. Apply the account-identity backfill in the 1.7 upgrade guide before deploying.
- Added rolling SAML certificate rotation by accepting an array of IdP signing certificates ([#8805](https://github.com/better-auth/better-auth/pull/8805))
  > **Migration:** `getSSOProvider`, `listSSOProviders`, and `updateSSOProvider` now always return `samlConfig.certificate` as an array, so drop any `Array.isArray` branching. Registration rejects SAML configs with no signing-cert source with `CERT_SOURCE_MISSING`.
- Hardened the `validateUserInfo` source contract so it cannot be bypassed or spoofed ([#9940](https://github.com/better-auth/better-auth/pull/9940))
  > **Migration:** `createUser` now fails closed when `validateUserInfo` is configured but no endpoint context or provisioning source is available. Read SSO metadata from `source.sso` instead of `source.oauth`, and handle the `source.method` values `sso-oidc` and `sso-saml`.
- Hardened SAML response validation for `InResponseTo`, audience restriction, and `SessionIndex` ([#9055](https://github.com/better-auth/better-auth/pull/9055))
  > **Migration:** `allowIdpInitiated` now defaults to `false`. Set `saml.allowIdpInitiated: true` to keep accepting unsolicited SAML responses.
- Consolidated the SAML ACS endpoint, made `spMetadata` optional, and fixed Single Logout ([#9117](https://github.com/better-auth/better-auth/pull/9117))
  > **Migration:** Point your IdP's ACS URL at `/sso/saml2/sp/acs/:providerId`; `/sso/saml2/callback/:providerId` is removed. `callbackUrl` is now the post-auth redirect only, and the unused `decryptionPvk`, `additionalParams`, `idpMetadata.entityURL`, and `idpMetadata.redirectURL` fields are gone.

### Features

- Added a `user.validateUserInfo` gate for rejecting an identity before a user is created or linked ([#9864](https://github.com/better-auth/better-auth/pull/9864))
- Added `allowIdpInitiated` support for IdP-initiated flows through a secure server-side bounce ([#9301](https://github.com/better-auth/better-auth/pull/9301))
- Added `private_key_jwt` client authentication for token endpoint requests (RFC 7523) ([#8836](https://github.com/better-auth/better-auth/pull/8836))
- Added per-request `additionalParams` and `loginHint` across `signIn.social`, `linkSocial`, and `signIn.sso` ([#9305](https://github.com/better-auth/better-auth/pull/9305))
- Added a server-trusted OAuth state channel, fixing anonymous account linking in in-app browsers ([#9930](https://github.com/better-auth/better-auth/pull/9930))
- Added transactional OIDC user resolution for SSO sign-ins ([#10473](https://github.com/better-auth/better-auth/pull/10473))
- Extended `resolveUser` to SAML sign-ins and hardened the provider lifecycle ([#10621](https://github.com/better-auth/better-auth/pull/10621))
- Added `additionalFields` support on `ssoProvider` ([#9445](https://github.com/better-auth/better-auth/pull/9445))

### Bug Fixes

- Allowed an SSO provider registration to reuse a SCIM connection ID, since SCIM connections no longer share the authentication provider namespace.
- Rejected redirecting OIDC discovery, token, userinfo, and JWKS endpoints so SSO works on Cloudflare Workers ([#10072](https://github.com/better-auth/better-auth/pull/10072))
- Updated samlify to 2.13.1 for a signed-assertion XML injection fix ([#9821](https://github.com/better-auth/better-auth/pull/9821))
- Upgraded samlify to 2.12.0 with XPath injection and XXE fixes ([#9121](https://github.com/better-auth/better-auth/pull/9121))
- Single-sourced HTTP Basic credential encoding and decoding for OAuth client authentication ([#9657](https://github.com/better-auth/better-auth/pull/9657))
- Verified SAML assertion signatures directly instead of trusting an already-parsed response, and applied the same signing policy and size limit to SP metadata as to IdP metadata. `wantAssertionsSigned` now controls whether signed assertions are required rather than signed response messages, matching how IdPs sign SAML responses in practice.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/sso/CHANGELOG.md)

## `@better-auth/scim`

### ❗ Breaking Changes

- Decoupled SCIM provisioning from the organization plugin ([#10390](https://github.com/better-auth/better-auth/pull/10390))
  > **Migration:** SCIM configuration, client APIs, database schema, and the Group model are all replaced, and provisioning state cannot migrate in place. Follow the SCIM cutover in the 1.7 upgrade guide, including a full directory reprovision, before resuming traffic.
- Isolated SCIM provider connections from the organization and SSO plugins ([#10249](https://github.com/better-auth/better-auth/pull/10249))
  > **Migration:** Define connections statically, resolve them with `authentication.verifyBearerToken`, or use the optional `managedConnections` catalog, and connect SCIM resources to users and roles through identity and projection callbacks. Legacy SCIM state is not migrated: back it up, issue new credentials, and fully reprovision Users and Groups.
- Bound personal SCIM connections to their creator and removed user-session connection management ([#9840](https://github.com/better-auth/better-auth/pull/9840))
  > **Migration:** The legacy connection management endpoints and `providerOwnership` are gone, so authorize SCIM administration in your own application. Legacy `scimProvider` rows and credentials are not migrated: follow the 1.7 SCIM upgrade guide, issue new credentials, and reprovision Users and Groups.

### Features

- Added a `user.validateUserInfo` gate for rejecting an identity before a user is created or linked ([#9864](https://github.com/better-auth/better-auth/pull/9864))
- Added durable SCIM Group resources with connection-scoped membership and lifecycle endpoints ([#10018](https://github.com/better-auth/better-auth/pull/10018))
- Added the SCIM Enterprise User extension and the standard User attributes for interop conformance ([#10620](https://github.com/better-auth/better-auth/pull/10620))
- Added a managed connection catalog and runtime connection resolution ([#10592](https://github.com/better-auth/better-auth/pull/10592))
- Added `acquireActiveSCIMUserLink` for transaction-safe authentication of provisioned users ([#10474](https://github.com/better-auth/better-auth/pull/10474))

### Bug Fixes

- Accepted exact case-insensitive string boolean values for SCIM User `active` and the `primary` sub-attribute of `emails`, `phoneNumbers`, `addresses`, `roles`, and `entitlements` at the HTTP ingress, for Microsoft Entra interoperability.
- Added an optional SCIM-owned connection and credential catalog. Configure `managedConnections` so trusted server code can create runtime tenant connections and issue, rotate, and revoke their bearer credentials through server-only `auth.api` methods, without a code-defined connection or an application-owned verifier.
- Allowed trusted server code to retain a terminal connection binding before a dynamic SCIM connection's first authenticated request by supplying its provisioning domain during decommissioning.
- Created filtered SCIM PATCH values when no target matches instead of rejecting the request ([#10682](https://github.com/better-auth/better-auth/pull/10682))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/scim/CHANGELOG.md)

## `@better-auth/mcp` ✨

### ❗ Breaking Changes

- Moved the MCP plugin into its own `@better-auth/mcp` package built on the OAuth provider ([#9992](https://github.com/better-auth/better-auth/pull/9992))
  > **Migration:** Install `@better-auth/mcp` and `@better-auth/cimd`, add the now-required `jwt()` plugin, and move options nested under `oidcConfig` to flat `mcp({ ... })` options. Rename `withMcpAuth` to `requireMcpAuth` and `mcpHandler` to `createMcpProtectedRequestHandler`. Regenerate the schema (`npx auth migrate`): `oauthApplication` becomes `oauthClient`, plus new `oauthRefreshToken` and `oauthClientAssertion` tables.
- Aligned OAuth client registration and metadata with MCP authorization 2026-07-28 ([#10577](https://github.com/better-auth/better-auth/pull/10577))
  > **Migration:** Add `applicationType` and nullable `clientDiscoveryId` columns, deduplicate existing `(clientId, resourceId)` links before the new compound unique index, then drop the legacy `type` and `public` columns. Replace `clientCredentialGrantDefaultScopes` with per-client `clientCredentialsScopes`, backfilling every client to `[]` and reassigning approved machine scopes after an audit. `mcp()` no longer enables unauthenticated DCR: compose it with `cimd()` or enable both DCR flags explicitly.
- Modeled OAuth protected resources explicitly, with per-resource TTLs, scopes, claims, and signing pins ([#9648](https://github.com/better-auth/better-auth/pull/9648))
  > **Migration:** `mcp()` now requires an explicit `resource` identifier, for example `resource: "https://api.example.com/mcp"`. `validAudiences` is removed: move each resource identifier into `resources`. Run `npx @better-auth/cli generate` and apply the migration before deploying.

### Features

- Added DPoP sender-constrained access tokens (RFC 9449) ([#10039](https://github.com/better-auth/better-auth/pull/10039))
- Added a refresh token reuse interval that replays the same response for duplicate refresh requests ([#10145](https://github.com/better-auth/better-auth/pull/10145))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/mcp/CHANGELOG.md)

## `@better-auth/electron`

### ❗ Breaking Changes

- Enforced S256 PKCE in the Electron sign-in flow and hardened custom-scheme origin checks ([#9645](https://github.com/better-auth/better-auth/pull/9645))
  > **Migration:** Upgrade the `@better-auth/electron` client and server together and add your app's scheme to `trustedOrigins`. The `code_challenge_method` parameter and `disableOriginOverride` option are removed, and host-bearing custom-scheme entries now match that host exactly.
- Rewrote the generic OAuth plugin as a first-class social provider with OAuth 2.1 defaults ([#9069](https://github.com/better-auth/better-auth/pull/9069))
  > **Migration:** Replace `signIn.oauth2({ providerId })` with `signIn.social({ provider })`, `oauth2.link()` with `linkSocial()`, and drop `genericOAuthClient()`. Callbacks move to `/api/auth/callback/:id`, `pkce` now defaults to `true`, and `issuer` and `requireIssuerValidation` are removed in favor of OIDC discovery.

### Bug Fixes

- Fixed client plugin composition so One Tap, Electron, and Expo type-check with `createAuthClient` ([#10505](https://github.com/better-auth/better-auth/pull/10505))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/electron/CHANGELOG.md)

## `@better-auth/expo`

### ❗ Breaking Changes

- Switched Expo secure storage to async access so apps no longer crash when the iOS Keychain is unavailable ([#10438](https://github.com/better-auth/better-auth/pull/10438))
  > **Migration:** `getCookie()` now returns a promise, and custom storage implementations must provide both synchronous and asynchronous SecureStore methods. `storageAdapter.setItem()` stays synchronous, so use `setItemAsync()` when the write must be awaited.
- Rewrote the generic OAuth plugin as a first-class social provider with OAuth 2.1 defaults ([#9069](https://github.com/better-auth/better-auth/pull/9069))
  > **Migration:** Replace `signIn.oauth2({ providerId })` with `signIn.social({ provider })`, `oauth2.link()` with `linkSocial()`, and drop `genericOAuthClient()`. Callbacks move to `/api/auth/callback/:id`, `pkce` now defaults to `true`, and `issuer` and `requireIssuerValidation` are removed in favor of OIDC discovery.

### Bug Fixes

- Fixed client plugin composition so One Tap, Electron, and Expo type-check with `createAuthClient` ([#10505](https://github.com/better-auth/better-auth/pull/10505))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/expo/CHANGELOG.md)

## `@better-auth/stripe`

### ❗ Breaking Changes

- Made the `event` parameter of `onSubscriptionCancel` required ([#9531](https://github.com/better-auth/better-auth/pull/9531))
  > **Migration:** Declare `event` as a required parameter in your callback and remove any `undefined` guards around it.
- Removed the optional marker from the `onSubscriptionCancel` `event` parameter ([#9359](https://github.com/better-auth/better-auth/pull/9359))
  > **Migration:** `event` is always supplied, so drop `undefined` handling from the callback.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/stripe/CHANGELOG.md)

## `auth`

### ❗ Breaking Changes

- Accumulated OAuth granted scopes in a new `grantedScopes` string array ([#9825](https://github.com/better-auth/better-auth/pull/9825))
  > **Migration:** `grantedScopes` replaces the comma-joined `account.scope` string with no read-time fallback, so backfill it from the existing values. The client provider contract is renamed from `OAuthProvider` to `UpstreamProvider`.

### Features

- Added a `create-admin` command for creating an initial admin user ([#9547](https://github.com/better-auth/better-auth/pull/9547))
- Added compound table indexes to plugin database schemas ([#10402](https://github.com/better-auth/better-auth/pull/10402))

### Bug Fixes

- Preserved issuer-scoped account identities by restoring `Account.accountId` alongside the required `issuer` ([#10668](https://github.com/better-auth/better-auth/pull/10668))
- Exported the generated `pgSchema` binding so drizzle-kit can emit `CREATE SCHEMA` for custom PostgreSQL namespaces ([#10770](https://github.com/better-auth/better-auth/pull/10770))
- Loaded the auth config through c12 v4 `resolveModule`, adding support for the `export default { auth }` shape ([#9477](https://github.com/better-auth/better-auth/pull/9477))
- Reverted the granted scopes architecture, restoring the previous `account.scope` storage ([#10123](https://github.com/better-auth/better-auth/pull/10123))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/cli/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### ❗ Breaking Changes

- Moved database joins out of `experimental` into the stable `advanced.database.joins` option ([#10359](https://github.com/better-auth/better-auth/pull/10359))
  > **Migration:** Replace `experimental: { joins: true }` with `advanced: { database: { joins: true } }`, and regenerate the schema (`npx auth@latest generate`) so it includes the required relations.

### Features

- Added compound table indexes to plugin database schemas ([#10402](https://github.com/better-auth/better-auth/pull/10402))
- Added a `relations-v2` entry point for projects using Drizzle Relations v2 ([#9489](https://github.com/better-auth/better-auth/pull/9489))
- Added a `schemaName` option that generates the Drizzle schema inside a `pgSchema` namespace ([#7169](https://github.com/better-auth/better-auth/pull/7169))

### Bug Fixes

- Exported the generated `pgSchema` binding so drizzle-kit can emit `CREATE SCHEMA` for custom PostgreSQL namespaces ([#10770](https://github.com/better-auth/better-auth/pull/10770))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/cimd` ✨

### ❗ Breaking Changes

- Aligned OAuth client registration and metadata with MCP authorization 2026-07-28 ([#10577](https://github.com/better-auth/better-auth/pull/10577))
  > **Migration:** Add `applicationType` and nullable `clientDiscoveryId` columns, deduplicate existing `(clientId, resourceId)` links before the new compound unique index, then drop the legacy `type` and `public` columns. Client ID Metadata Documents preserve an omitted `application_type` as `null` and cannot assign `clientCredentialsScopes`. Compose `mcp()` with `cimd()` for metadata-document clients.

### Features

- Added the `@better-auth/cimd` Client ID Metadata Document plugin ([#9159](https://github.com/better-auth/better-auth/pull/9159))

### Bug Fixes

- Client ID Metadata Documents now follow shared-cache freshness rules and fail closed when freshness is ambiguous. The plugin prefers `s-maxage` over `max-age` and `Expires`, honors `s-maxage=0`, revalidates conditionally with ETag or Last-Modified, and treats invalid or duplicate freshness directives as immediately stale. Concurrent refreshes converge on one client-resource link instead of failing on its unique constraint.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/cimd/CHANGELOG.md)

## `@better-auth/api-key`

### ❗ Breaking Changes

- Hardened atomic state transitions so concurrent requests cannot race past single-use or rate-limit guards ([#10000](https://github.com/better-auth/better-auth/pull/10000))
  > **Migration:** Custom adapters must implement native `consumeOne` and `incrementOne`, secondary storage needs atomic consume and increment operations, and custom rate-limit storage makes one `consume` decision per request. The read-then-delete and read-then-update fallbacks are removed.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/api-key/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed SQLite dialect bundles on Kysely 0.29 by mirroring the migration-table constants locally ([#10377](https://github.com/better-auth/better-auth/pull/10377))
- Raw database instances (better-sqlite3, `node:sqlite`, `bun:sqlite`, `mysql2`, `pg`) passed directly as `database` now get native adapter transactions automatically, matching the behavior of the explicit `{ db }` and `{ dialect }` config shapes. This unblocks plugins that require native transactions (such as `@better-auth/scim`) when the database is provided in the quickstart `database: new Database(...)` shape.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/i18n`

### Features

- Added built-in translations for 22 languages ([#9157](https://github.com/better-auth/better-auth/pull/9157))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/i18n/CHANGELOG.md)

## `@better-auth/mongo-adapter`

### Features

- Added compound table indexes to plugin database schemas ([#10402](https://github.com/better-auth/better-auth/pull/10402))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/mongo-adapter/CHANGELOG.md)

## `@better-auth/passkey`

### Features

- Added an optional `createSession` setting that signs the user in on successful passkey registration ([#9873](https://github.com/better-auth/better-auth/pull/9873))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c3688ba88edff12dfcb1ced007e332711509ac29/packages/passkey/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@adrianmxb, @brentmitchell25, @bytaesu, @dvanmali, @eluce2, @GautamBytes, @gustavovalverde, @ItalyPaleAle, @jonathansamines, @KingIronMan2011, @momomuchu, @OscarCornish, @pi0, @ping-maxwell, @ruban-s, @sovetski, @yordis

**Full changelog:** [`v1.6.30...v1.7.0`](https://github.com/better-auth/better-auth/compare/v1.6.30...v1.7.0)

## v1.6.30 (2026-08-17)

## `better-auth`

### Bug Fixes

- Fixed concurrent cold-start requests from intermittently losing authentication or transaction context due to an async storage initialization race ([#10833](https://github.com/better-auth/better-auth/pull/10833))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e84ec5e76d30e10fd692e8084177360484d538c1/packages/better-auth/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed automatic organization assignment via email domain to require both a verified provider domain and a verified stored user email, preventing social sign-in from joining an organization whose SSO provider merely claims that domain.
- Fixed domain verification to snapshot the provider's domains at request start, returning `409` with `SSO_PROVIDER_CHANGED` if the provider changes during DNS resolution so callers can reload and retry.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/e84ec5e76d30e10fd692e8084177360484d538c1/packages/sso/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu

**Full changelog:** [`v1.6.29...v1.6.30`](https://github.com/better-auth/better-auth/compare/v1.6.29...v1.6.30)

## v1.7.0-rc.6 (2026-08-14) canary

## `better-auth`

### Bug Fixes

- Restored client plugin declaration compatibility for downstream TypeScript consumers. ([#10794](https://github.com/better-auth/better-auth/pull/10794))
- Fixed duplicate session requests during transient Suspense remounts while ensuring incomplete refreshes are revalidated. ([#10769](https://github.com/better-auth/better-auth/pull/10769))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/bc93b27542cbdf74f6455e6f66a0b4292c247a12/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- Fixed `private_key_jwt` client assertions to accept the issuer URL as a valid `aud` claim (string or array) on token, introspection, and revocation requests. ([#10811](https://github.com/better-auth/better-auth/pull/10811))
- Completed the RP-Initiated Logout flow with form-encoded `POST` support, explicit confirmation pages, and strict `post_logout_redirect_uri` validation. ([#10812](https://github.com/better-auth/better-auth/pull/10812))
- Fixed handling of voluntary and essential ACR requests in authorization flows. ([#10790](https://github.com/better-auth/better-auth/pull/10790))
- Fixed claims requests to require the `openid` scope. ([#10791](https://github.com/better-auth/better-auth/pull/10791))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/bc93b27542cbdf74f6455e6f66a0b4292c247a12/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed missing `pgSchema` export so drizzle-kit can emit `CREATE SCHEMA` for custom PostgreSQL namespaces. ([#10770](https://github.com/better-auth/better-auth/pull/10770))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/bc93b27542cbdf74f6455e6f66a0b4292c247a12/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- Restored declaration compatibility for downstream TypeScript consumers. ([#10794](https://github.com/better-auth/better-auth/pull/10794))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/bc93b27542cbdf74f6455e6f66a0b4292c247a12/packages/electron/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Restored declaration compatibility for downstream TypeScript consumers. ([#10794](https://github.com/better-auth/better-auth/pull/10794))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/bc93b27542cbdf74f6455e6f66a0b4292c247a12/packages/expo/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed missing `pgSchema` export so drizzle-kit can emit `CREATE SCHEMA` for custom PostgreSQL namespaces. ([#10770](https://github.com/better-auth/better-auth/pull/10770))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/bc93b27542cbdf74f6455e6f66a0b4292c247a12/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @gustavovalverde, @ping-maxwell

**Full changelog:** [`v1.7.0-rc.5...v1.7.0-rc.6`](https://github.com/better-auth/better-auth/compare/v1.7.0-rc.5...v1.7.0-rc.6)

## v1.6.29 (2026-08-14)

## `better-auth`

### Bug Fixes

- Improved `deleteSessions` performance by running deletes in parallel instead of sequentially ([#10805](https://github.com/better-auth/better-auth/pull/10805))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/58c49eb97f04ff18aa823318a3856a013353fdc2/packages/better-auth/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed automatic email-domain organization assignment to require both a verified provider domain and a verified user email, preventing social sign-in from granting access when an SSO provider merely claims a domain.
- Fixed domain verification to snapshot the provider's domains at request start, returning `409` with `SSO_PROVIDER_CHANGED` if the provider changes during DNS verification so callers can reload and retry.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/58c49eb97f04ff18aa823318a3856a013353fdc2/packages/sso/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@Emmaccen

**Full changelog:** [`v1.6.28...v1.6.29`](https://github.com/better-auth/better-auth/compare/v1.6.28...v1.6.29)

## v1.6.28 (2026-08-13)

## `better-auth`

### Bug Fixes

- Prevented duplicate session requests during React Suspense retries while preserving revalidation for interrupted refreshes ([#10769](https://github.com/better-auth/better-auth/pull/10769))
- Restored client plugin declaration compatibility for downstream TypeScript consumers ([#10794](https://github.com/better-auth/better-auth/pull/10794))

For detailed changes, see the [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/86faaee69b6c2afe237fff8a00602ecc8eccc367/packages/better-auth/CHANGELOG.md).

## `@better-auth/electron`

### Bug Fixes

- Restored client plugin declaration compatibility for downstream TypeScript consumers ([#10794](https://github.com/better-auth/better-auth/pull/10794))

For detailed changes, see the [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/86faaee69b6c2afe237fff8a00602ecc8eccc367/packages/electron/CHANGELOG.md).

## `@better-auth/expo`

### Bug Fixes

- Restored client plugin declaration compatibility for downstream TypeScript consumers ([#10794](https://github.com/better-auth/better-auth/pull/10794))

For detailed changes, see the [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/86faaee69b6c2afe237fff8a00602ecc8eccc367/packages/expo/CHANGELOG.md).

## Contributors

Thanks to everyone who contributed to this release:

[@bytaesu](https://github.com/bytaesu)

**Full changelog:** [`v1.6.27...v1.6.28`](https://github.com/better-auth/better-auth/compare/v1.6.27...v1.6.28)

## v1.7.0-rc.5 (2026-08-11) canary

## `better-auth`

### ❗ Breaking Changes

- Refactored OAuth device grant ownership to use `oauthDeviceAuthorization()` alongside `oauthProvider()` or `mcp()` ([#10746](https://github.com/better-auth/better-auth/pull/10746))

> **Migration:** Replace the standalone `deviceCodeGrant()` plugin with `oauthDeviceAuthorization()` used alongside `oauthProvider()` or `mcp()`. Regenerate and apply the schema (`resource` column is replaced by `oauthClientId` and `resources`). Let any pending device codes expire or delete them before upgrading, as they cannot be exchanged through the new integration.

### Features

- Added option to disable `displayName` in the username plugin ([#10330](https://github.com/better-auth/better-auth/pull/10330))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/acbe42128f72f5c656a22353a54dda70b1316f52/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- Refactored OAuth device grant ownership to use `oauthDeviceAuthorization()` alongside `oauthProvider()` or `mcp()` ([#10746](https://github.com/better-auth/better-auth/pull/10746))

> **Migration:** Replace the standalone `deviceCodeGrant()` plugin with `oauthDeviceAuthorization()` used alongside `oauthProvider()` or `mcp()`. Regenerate and apply the schema (`resource` column is replaced by `oauthClientId` and `resources`). Let any pending device codes expire or delete them before upgrading, as they cannot be exchanged through the new integration.

### Features

- Removed the `silenceWarnings` config option and startup warnings for well-known metadata endpoints ([#10703](https://github.com/better-auth/better-auth/pull/10703))

### Bug Fixes

- Fixed device authorization flow to enforce RFC requirements ([#10752](https://github.com/better-auth/better-auth/pull/10752))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/acbe42128f72f5c656a22353a54dda70b1316f52/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed type alignment between auth endpoints and `better-call` ([#10657](https://github.com/better-auth/better-auth/pull/10657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/acbe42128f72f5c656a22353a54dda70b1316f52/packages/scim/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed CLI to align installed packages with the running CLI version ([#10743](https://github.com/better-auth/better-auth/pull/10743))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/acbe42128f72f5c656a22353a54dda70b1316f52/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @gustavovalverde, @ping-maxwell

**Full changelog:** [`v1.7.0-rc.4...v1.7.0-rc.5`](https://github.com/better-auth/better-auth/compare/v1.7.0-rc.4...v1.7.0-rc.5)

## v1.6.27 (2026-08-11)

## `better-auth`

### Bug Fixes

- Fixed duplicate session requests being made across Suspense retries ([#10676](https://github.com/better-auth/better-auth/pull/10676))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/be47e9418b4a25a4ecd51ba781d2296373b65a03/packages/better-auth/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed auth endpoint types to align with `better-call` ([#10657](https://github.com/better-auth/better-auth/pull/10657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/be47e9418b4a25a4ecd51ba781d2296373b65a03/packages/scim/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed the CLI to align installed packages with the running CLI version ([#10743](https://github.com/better-auth/better-auth/pull/10743))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/be47e9418b4a25a4ecd51ba781d2296373b65a03/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu

**Full changelog:** [`v1.6.26...v1.6.27`](https://github.com/better-auth/better-auth/compare/v1.6.26...v1.6.27)

## v1.7.0-rc.4 (2026-08-05) canary

## `better-auth`

### Features

- Added a placeholder email utility for generating temporary email addresses ([#10576](https://github.com/better-auth/better-auth/pull/10576))

### Bug Fixes

- Fixed sessions not being cleaned up when a user is deleted ([#10520](https://github.com/better-auth/better-auth/pull/10520))
- Fixed missing PKCE challenge in Apple OAuth flows ([#10294](https://github.com/better-auth/better-auth/pull/10294))
- Fixed duplicate in-flight session requests when React retries a suspended component ([#10676](https://github.com/better-auth/better-auth/pull/10676))
- Fixed cookie cache to work independently of the JWT plugin internals ([#10666](https://github.com/better-auth/better-auth/pull/10666))
- Fixed `findSessions` to skip null-parsed session tokens instead of returning early ([#10580](https://github.com/better-auth/better-auth/pull/10580))
- Fixed missing verification type when sending email OTP during sign-up ([#10608](https://github.com/better-auth/better-auth/pull/10608))
- Fixed OTP being cleared after password validation errors in email OTP flows ([#10552](https://github.com/better-auth/better-auth/pull/10552))
- Fixed email OTP to verify the code before revealing whether the email exists ([#10605](https://github.com/better-auth/better-auth/pull/10605))
- Fixed client plugin type inference when using `jwtClient` ([#10513](https://github.com/better-auth/better-auth/pull/10513))
- Fixed JWT signing to use the transaction-scoped adapter ([#10623](https://github.com/better-auth/better-auth/pull/10623))
- Fixed Apple user data being lost when using the OAuth proxy ([#10599](https://github.com/better-auth/better-auth/pull/10599))
- Fixed Google One Tap to enforce provider signup restrictions ([#10479](https://github.com/better-auth/better-auth/pull/10479))
- Fixed client plugin type inference when using `oneTapClient` ([#10635](https://github.com/better-auth/better-auth/pull/10635))
- Fixed rate limit database cleanup to be awaited by default ([#10619](https://github.com/better-auth/better-auth/pull/10619))
- Fixed `$fetch` and `$store` not being exposed on the Solid client ([#10444](https://github.com/better-auth/better-auth/pull/10444))
- Improved Next.js performance by reusing the `next/headers` import promise in production ([#10467](https://github.com/better-auth/better-auth/pull/10467))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f41b7c78575e4ea5505c5455ad8e4410a49407b6/packages/better-auth/CHANGELOG.md)

## `@better-auth/expo`

### ❗ Breaking Changes

- Switched to async secure storage access to prevent crashes when iOS Keychain is unavailable ([#10438](https://github.com/better-auth/better-auth/pull/10438))

> **Migration:** `getCookie()` now returns a Promise. Custom storage implementations must provide both sync and async `SecureStore` methods, and should use `setItemAsync()` when the write must be awaited.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f41b7c78575e4ea5505c5455ad8e4410a49407b6/packages/expo/CHANGELOG.md)

## `@better-auth/redis-storage`

### Bug Fixes

- Fixed Redis storage to use `SCAN` instead of `KEYS` to avoid blocking the server ([#10507](https://github.com/better-auth/better-auth/pull/10507))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f41b7c78575e4ea5505c5455ad8e4410a49407b6/packages/redis-storage/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed SCIM PATCH to create filtered attribute values when no target matches, instead of rejecting with a `noTarget` error ([#10682](https://github.com/better-auth/better-auth/pull/10682))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f41b7c78575e4ea5505c5455ad8e4410a49407b6/packages/scim/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed issuer-scoped account identities being overwritten during OAuth flows ([#10668](https://github.com/better-auth/better-auth/pull/10668))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/f41b7c78575e4ea5505c5455ad8e4410a49407b6/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@birkskyum, @bytaesu, @Emmaccen, @gustavovalverde, @jashkarangiya, @jeroenvandermerwe, @jlucaso1, @jsj, @krish-vachhani, @mrosberghaus, @XXMOHAMED012

**Full changelog:** [`v1.7.0-rc.3...v1.7.0-rc.4`](https://github.com/better-auth/better-auth/compare/v1.7.0-rc.3...v1.7.0-rc.4)

## v1.6.26 (2026-08-04)

## `better-auth`

### Bug Fixes

- Fixed session cleanup on user deletion to also remove sessions from secondary storage ([#10520](https://github.com/better-auth/better-auth/pull/10520))
- Fixed `findSessions` to skip invalid secondary-storage session entries without discarding other valid sessions ([#10580](https://github.com/better-auth/better-auth/pull/10580))
- Fixed email OTP sign-up to pass the verification type to custom OTP generators ([#10608](https://github.com/better-auth/better-auth/pull/10608))
- Fixed email OTP password reset to allow retrying after entering an invalid password ([#10552](https://github.com/better-auth/better-auth/pull/10552))
- Fixed email OTP verification to no longer reveal whether an email is registered before the OTP is verified ([#10605](https://github.com/better-auth/better-auth/pull/10605))
- Fixed `jwtClient()` collapsing `createAuthClient` type inference when combined with other client plugins ([#10513](https://github.com/better-auth/better-auth/pull/10513))
- Fixed JWT key minting inside database transactions to use the transaction-scoped adapter, preventing deadlocks on SQLite and ensuring keys commit with their surrounding transaction on Postgres and MySQL ([#10623](https://github.com/better-auth/better-auth/pull/10623))
- Fixed `oAuthProxy` to preserve Apple user data from `form_post` callbacks ([#10599](https://github.com/better-auth/better-auth/pull/10599))
- Fixed `oneTapClient()` collapsing `createAuthClient` type inference when combined with other client plugins ([#10635](https://github.com/better-auth/better-auth/pull/10635))
- Fixed database rate-limit cleanup to complete when no background task handler is configured ([#10619](https://github.com/better-auth/better-auth/pull/10619))
- Improved `nextCookies` performance in instrumented Next.js applications by reusing the `next/headers` import promise ([#10467](https://github.com/better-auth/better-auth/pull/10467))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/a16b30e8437927c08350194000178073b06af8cf/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Features

- Added a utility for creating stable, namespaced placeholder emails on the reserved `placeholder.invalid` domain ([#10576](https://github.com/better-auth/better-auth/pull/10576))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/a16b30e8437927c08350194000178073b06af8cf/packages/core/CHANGELOG.md)

## `@better-auth/redis-storage`

### Bug Fixes

- Fixed `listKeys()` and `clear()` to use `SCAN` instead of `KEYS` so large keyspaces no longer block the Redis server ([#10507](https://github.com/better-auth/better-auth/pull/10507))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/a16b30e8437927c08350194000178073b06af8cf/packages/redis-storage/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @Emmaccen, @gustavovalverde, @jashkarangiya, @jeroenvandermerwe, @jlucaso1, @krish-vachhani, @mrosberghaus, @XXMOHAMED012

**Full changelog:** [`v1.6.25...v1.6.26`](https://github.com/better-auth/better-auth/compare/v1.6.25...v1.6.26)

## v1.7.0-rc.3 (2026-08-03) canary

## `better-auth`

### ❗ Breaking Changes

- Added database indexes for device and user code lookups in the device authorization flow ([#10059](https://github.com/better-auth/better-auth/pull/10059))

> **Migration:** MySQL and SQL Server users must convert device code and user code columns to bounded strings (max 191 characters) and resolve any oversized values before applying the migration.

- Changed Microsoft and `microsoftEntraId` accounts to use the stable `oid` claim as the account identifier instead of `sub` ([#10204](https://github.com/better-auth/better-auth/pull/10204))

> **Migration:** Migrate existing Microsoft account rows keyed by `sub` to `oid` before upgrading; tokens without a valid `oid` claim are rejected after the update.

### Features

- Added RP-initiated logout support for Generic OAuth providers, redirecting users to their OpenID provider's logout endpoint on sign-out ([#9368](https://github.com/better-auth/better-auth/pull/9368))
- Added RFC 8628 device authorization grant support to the OAuth provider, enabling device-flow token exchanges for registered OAuth clients ([#10135](https://github.com/better-auth/better-auth/pull/10135))

### Bug Fixes

- Enabled native database transactions in test instances for Postgres and MySQL databases.
- Fixed a deadlock during sign-up when JWT session caching and native transactions are both enabled on single-connection databases ([#10622](https://github.com/better-auth/better-auth/pull/10622))
- Fixed TypeScript errors when composing One Tap, Electron, and Expo plugins with `createAuthClient` ([#10505](https://github.com/better-auth/better-auth/pull/10505))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### ❗ Breaking Changes

- Changed Microsoft and `microsoftEntraId` accounts to use the stable `oid` claim as the account identifier instead of `sub` ([#10204](https://github.com/better-auth/better-auth/pull/10204))

> **Migration:** Migrate existing Microsoft account rows keyed by `sub` to `oid` before upgrading; tokens without a valid `oid` claim are rejected after the update.

### Features

- Added RP-initiated logout support for Generic OAuth providers, redirecting users to their OpenID provider's logout endpoint on sign-out ([#9368](https://github.com/better-auth/better-auth/pull/9368))

### Bug Fixes

- Fixed TypeScript errors when composing One Tap, Electron, and Expo plugins with `createAuthClient` ([#10505](https://github.com/better-auth/better-auth/pull/10505))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/core/CHANGELOG.md)

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- Aligned MCP authorization with the 2026-07-28 specification, replacing legacy `type`/`public` client fields with `applicationType` and enforcing stricter redirect validation and scope controls ([#10577](https://github.com/better-auth/better-auth/pull/10577))

> **Migration:** Apply a database migration to add `applicationType`, nullable `clientDiscoveryId`, and `clientCredentialsScopes` columns; backfill `applicationType` from existing values and `clientCredentialsScopes` to `[]` for all clients; deduplicate `(clientId, resourceId)` pairs before applying the new unique index. Replace `OAuthClient` string-index accesses with `OAuthClient & YourExtensionMetadata`, and compose `mcp()` with `cimd()` explicitly if using Client ID Metadata Documents.

### Features

- Added RFC 8628 device authorization grant support to the OAuth provider, enabling device-flow token exchanges for registered OAuth clients ([#10135](https://github.com/better-auth/better-auth/pull/10135))

### Bug Fixes

- Fixed MCP scope enforcement to return a `403` with an RFC 6750 `insufficient_scope` `WWW-Authenticate` challenge listing all missing scopes, allowing clients to request them in a single authorization request.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/cimd`

### ❗ Breaking Changes

- Aligned MCP authorization with the 2026-07-28 specification, replacing legacy `type`/`public` client fields with `applicationType` and enforcing stricter redirect validation and scope controls ([#10577](https://github.com/better-auth/better-auth/pull/10577))

> **Migration:** Apply a database migration to add `applicationType`, nullable `clientDiscoveryId`, and `clientCredentialsScopes` columns; backfill `applicationType` from existing values and `clientCredentialsScopes` to `[]` for all clients; deduplicate `(clientId, resourceId)` pairs before applying the new unique index. Replace `OAuthClient` string-index accesses with `OAuthClient & YourExtensionMetadata`, and compose `mcp()` with `cimd()` explicitly if using Client ID Metadata Documents.

### Bug Fixes

- Fixed Client ID Metadata Document caching to follow shared-cache freshness rules, preferring `s-maxage`, honoring conditional revalidation, and treating ambiguous or duplicate freshness directives as immediately stale to prevent unique-constraint failures on concurrent refreshes.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/cimd/CHANGELOG.md)

## `@better-auth/mcp`

### ❗ Breaking Changes

- Aligned MCP authorization with the 2026-07-28 specification, replacing legacy `type`/`public` client fields with `applicationType` and enforcing stricter redirect validation and scope controls ([#10577](https://github.com/better-auth/better-auth/pull/10577))

> **Migration:** Apply a database migration to add `applicationType`, nullable `clientDiscoveryId`, and `clientCredentialsScopes` columns; backfill `applicationType` from existing values and `clientCredentialsScopes` to `[]` for all clients; deduplicate `(clientId, resourceId)` pairs before applying the new unique index. Replace `OAuthClient` string-index accesses with `OAuthClient & YourExtensionMetadata`, and compose `mcp()` with `cimd()` explicitly if using Client ID Metadata Documents.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/mcp/CHANGELOG.md)

## `@better-auth/scim`

### Features

- Added SCIM Enterprise User extension attributes and classic user attributes with improved Microsoft Entra interoperability ([#10620](https://github.com/better-auth/better-auth/pull/10620))
- Added a managed connection catalog for runtime SCIM tenant connection and credential management through server-only `auth.api` methods ([#10592](https://github.com/better-auth/better-auth/pull/10592))

### Bug Fixes

- Fixed Microsoft Entra interoperability by accepting case-insensitive string boolean values for the SCIM `active` field and `primary` sub-attributes of `emails`, `phoneNumbers`, `addresses`, `roles`, and `entitlements` at the HTTP ingress.
- Added `managedConnections` configuration to allow trusted server code to create, issue, rotate, and revoke SCIM tenant connections and bearer credentials through server-only `auth.api` methods without a code-defined connection.
- Fixed dynamic SCIM connection decommissioning to allow retaining a terminal connection binding by supplying the provisioning domain before the first authenticated request.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/scim/CHANGELOG.md)

## `@better-auth/sso`

### Features

- Extended `resolveUser` to SAML sign-ins with a discriminated `protocol` field, and added `guardProviderMutation` to authorize SSO provider updates and deletions ([#10621](https://github.com/better-auth/better-auth/pull/10621))

### Bug Fixes

- Fixed SSO provider registration to allow reusing a SCIM connection ID, since SCIM connections no longer participate in the authentication provider namespace.
- Improved SAML security by verifying assertion signatures on the raw XML rather than a pre-parsed response, enforcing signing policy and size limits on SP metadata, and correcting `wantAssertionsSigned` to control assertion signing instead of response signing.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/sso/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- Fixed TypeScript errors when composing One Tap, Electron, and Expo plugins with `createAuthClient` ([#10505](https://github.com/better-auth/better-auth/pull/10505))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/electron/CHANGELOG.md)

## `@better-auth/expo`

### Bug Fixes

- Fixed TypeScript errors when composing One Tap, Electron, and Expo plugins with `createAuthClient` ([#10505](https://github.com/better-auth/better-auth/pull/10505))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/expo/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed raw database instances (better-sqlite3, `node:sqlite`, `bun:sqlite`, `mysql2`, `pg`) passed directly as `database` to automatically receive native adapter transactions, matching the explicit `{ db }`/`{ dialect }` config shapes and unblocking plugins like `@better-auth/scim` when using the quickstart configuration.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/passkey`

### Features

- Added an optional `createSession` setting to passkey registration that signs the user in automatically on successful registration ([#9873](https://github.com/better-auth/better-auth/pull/9873))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/8bb588dde21a00c6159d0a58dd4b007b1059f596/packages/passkey/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@brentmitchell25, @GautamBytes, @gustavovalverde

**Full changelog:** [`v1.7.0-rc.2...v1.7.0-rc.3`](https://github.com/better-auth/better-auth/compare/v1.7.0-rc.2...v1.7.0-rc.3)

## v1.6.25 (2026-07-23)

## `better-auth`

### Bug Fixes

- Fixed Apple OAuth not sending the PKCE code challenge during authorization, causing token exchange failures ([#10294](https://github.com/better-auth/better-auth/pull/10294))
- Fixed Google One Tap creating new users when sign-up was disabled on the Google provider ([#10479](https://github.com/better-auth/better-auth/pull/10479))
- Fixed `$fetch` and `$store` not being exposed on the Solid client ([#10444](https://github.com/better-auth/better-auth/pull/10444))
- Fixed internal adapter queries being routed to the wrong table when a built-in table's `modelName` was set to another table's schema key (e.g. `user.modelName = "account"`).

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/07a646ea190167370fbbb60a0fa2c3be3bec5522/packages/better-auth/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@birkskyum, @jsj, @krish-vachhani

**Full changelog:** [`v1.6.24...v1.6.25`](https://github.com/better-auth/better-auth/compare/v1.6.24...v1.6.25)

## v1.7.0-rc.2 (2026-07-22) canary

## `better-auth`

### ❗ Breaking Changes

- chore!: move joins to advanced.database.joins ([#10359](https://github.com/better-auth/better-auth/pull/10359))

  If you previously set `experimental: { joins: true }`, update your config to:

  ```ts
  advanced: {
    database: {
      joins: true,
    },
  }
  ```

  Adapters that support native joins use them when enabled. If an adapter cannot return joined data for a query, Better Auth falls back to additional queries and combines the results. Drizzle and Prisma users should ensure their schema includes the required relations (`npx auth@latest generate`).

- feat(auth)!: scope accounts by issuer ([#10403](https://github.com/better-auth/better-auth/pull/10403))

  This release is breaking. `Account.accountId` is renamed to `Account.providerAccountId`, and `Account.issuer` is required. Account-specific APIs select the local `Account.id` through `accountId`; token and provider-profile APIs can instead select the signed account cookie with `useAccountCookie: true`. Credential accounts use `local:credential` and the linked user's stable `id` as their provider identity.

  OAuth provider identity now comes from raw verified profiles. OpenID Connect discovery uses `sub`, plain OAuth uses `id`, and providers can declare `accountSubject` for another immutable field; Better Auth no longer switches between `sub` and `id` at runtime. `getUserInfo().user` no longer carries provider identity, and `mapProfileToUser` cannot return `id`. Read the selected identity from `accountInfo.account.providerAccountId` instead of `accountInfo.user.id`. The generic `microsoftEntraId` helper now requires a concrete tenant GUID; use the built-in Microsoft provider for multi-tenant authorities.

  SSO account subjects are now protocol-defined. OIDC uses the verified `sub` claim, and SAML uses the signed `NameID`; `mapping.id` is removed from both configurations. A manual SAML configuration without metadata XML must set `idpMetadata.entityID`, because `samlConfig.issuer` identifies the service provider and no longer acts as the IdP identity.

  Apply the reviewed account-identity backfill in the Better Auth 1.7 upgrade guide before deploying. The generated schema migration cannot assign trusted issuers or resolve existing identity collisions automatically.

- feat(scim)!: decouple provisioning from the organization plugin ([#10390](https://github.com/better-auth/better-auth/pull/10390))

  This replaces the previous SCIM configuration, client APIs, database schema, and organization-backed Group model. Existing SCIM installations cannot migrate provisioning state in place. Follow the SCIM cutover in the 1.7 upgrade guide, including full directory reprovisioning, before resuming traffic.

  Deferred database side effects now run only after a successful transaction. A rolled-back User update no longer refreshes its cached profile, and a rolled-back bulk session revocation no longer invalidates sessions.

### Features

- feat: add `ctx` to `verifyIdToken` ([#10376](https://github.com/better-auth/better-auth/pull/10376))
- feat(db): add compound table indexes ([#10402](https://github.com/better-auth/better-auth/pull/10402))
- feat(last-login-method): `beforeStoreCookie` option for GDPR compliance ([#5753](https://github.com/better-auth/better-auth/pull/5753))
- feat(organization): add getOrganization for metadata-only fetches ([#10397](https://github.com/better-auth/better-auth/pull/10397))
- feat(sso): add transactional OIDC user resolution ([#10473](https://github.com/better-auth/better-auth/pull/10473))

### Bug Fixes

- chore: widen drizzle-kit peer dependency range ([#10299](https://github.com/better-auth/better-auth/pull/10299))
- fix: get-session should have `no-cache` cache control headers ([#10222](https://github.com/better-auth/better-auth/pull/10222))
- fix: recognize BIGINT as valid number type for SQLite in migrations. ([#10316](https://github.com/better-auth/better-auth/pull/10316))
- fix(auth): handle request clone failures in callbacks ([#10336](https://github.com/better-auth/better-auth/pull/10336))
- fix(client): preserve null in useSession().data type with throw:true ([#9787](https://github.com/better-auth/better-auth/pull/9787))
- fix(client): restore auth query lifecycle after remount ([#10379](https://github.com/better-auth/better-auth/pull/10379))
- fix(cookies): tighten CookieAttributes index signature type (#10441) ([#10442](https://github.com/better-auth/better-auth/pull/10442))
- fix(core): dedup request-state AsyncLocalStorage init to fix intermittent "No request state found" ([#9862](https://github.com/better-auth/better-auth/pull/9862))
- fix(core): resolve user.modelName collisions in references and adapter ([#10235](https://github.com/better-auth/better-auth/pull/10235))
- fix(db): avoid duplicate unique indexes in kysely migrations ([#10357](https://github.com/better-auth/better-auth/pull/10357))
- fix(magic-link, email-otp): force-validate Origin on cookieless send endpoints ([#10368](https://github.com/better-auth/better-auth/pull/10368))
- fix(mcp): expose remote auth challenge headers ([#10290](https://github.com/better-auth/better-auth/pull/10290))
- fix(open-api): include plugin user fields on sign-up/update bodies ([#10453](https://github.com/better-auth/better-auth/pull/10453))
- fix(organization): apply membershipLimit to listMembers user fetch ([#10342](https://github.com/better-auth/better-auth/pull/10342))
- fix(organization): let the database generate invitation ids ([#10040](https://github.com/better-auth/better-auth/pull/10040))
- fix(siwe): issue addressless nonces ([#10234](https://github.com/better-auth/better-auth/pull/10234))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### ❗ Breaking Changes

- chore!: move joins to advanced.database.joins ([#10359](https://github.com/better-auth/better-auth/pull/10359))

  If you previously set `experimental: { joins: true }`, update your config to:

  ```ts
  advanced: {
    database: {
      joins: true,
    },
  }
  ```

  Adapters that support native joins use them when enabled. If an adapter cannot return joined data for a query, Better Auth falls back to additional queries and combines the results. Drizzle and Prisma users should ensure their schema includes the required relations (`npx auth@latest generate`).

- feat(auth)!: scope accounts by issuer ([#10403](https://github.com/better-auth/better-auth/pull/10403))

  This release is breaking. `Account.accountId` is renamed to `Account.providerAccountId`, and `Account.issuer` is required. Account-specific APIs select the local `Account.id` through `accountId`; token and provider-profile APIs can instead select the signed account cookie with `useAccountCookie: true`. Credential accounts use `local:credential` and the linked user's stable `id` as their provider identity.

  OAuth provider identity now comes from raw verified profiles. OpenID Connect discovery uses `sub`, plain OAuth uses `id`, and providers can declare `accountSubject` for another immutable field; Better Auth no longer switches between `sub` and `id` at runtime. `getUserInfo().user` no longer carries provider identity, and `mapProfileToUser` cannot return `id`. Read the selected identity from `accountInfo.account.providerAccountId` instead of `accountInfo.user.id`. The generic `microsoftEntraId` helper now requires a concrete tenant GUID; use the built-in Microsoft provider for multi-tenant authorities.

  SSO account subjects are now protocol-defined. OIDC uses the verified `sub` claim, and SAML uses the signed `NameID`; `mapping.id` is removed from both configurations. A manual SAML configuration without metadata XML must set `idpMetadata.entityID`, because `samlConfig.issuer` identifies the service provider and no longer acts as the IdP identity.

  Apply the reviewed account-identity backfill in the Better Auth 1.7 upgrade guide before deploying. The generated schema migration cannot assign trusted issuers or resolve existing identity collisions automatically.

- feat(scim)!: decouple provisioning from the organization plugin ([#10390](https://github.com/better-auth/better-auth/pull/10390))

  This replaces the previous SCIM configuration, client APIs, database schema, and organization-backed Group model. Existing SCIM installations cannot migrate provisioning state in place. Follow the SCIM cutover in the 1.7 upgrade guide, including full directory reprovisioning, before resuming traffic.

  Deferred database side effects now run only after a successful transaction. A rolled-back User update no longer refreshes its cached profile, and a rolled-back bulk session revocation no longer invalidates sessions.

### Features

- feat(db): add compound table indexes ([#10402](https://github.com/better-auth/better-auth/pull/10402))
- feat(sso): add transactional OIDC user resolution ([#10473](https://github.com/better-auth/better-auth/pull/10473))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/core/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### ❗ Breaking Changes

- chore!: move joins to advanced.database.joins ([#10359](https://github.com/better-auth/better-auth/pull/10359))

  If you previously set `experimental: { joins: true }`, update your config to:

  ```ts
  advanced: {
    database: {
      joins: true,
    },
  }
  ```

  Adapters that support native joins use them when enabled. If an adapter cannot return joined data for a query, Better Auth falls back to additional queries and combines the results. Drizzle and Prisma users should ensure their schema includes the required relations (`npx auth@latest generate`).

### Features

- feat(db): add compound table indexes ([#10402](https://github.com/better-auth/better-auth/pull/10402))
- feat(drizzle): generate drizzle schema with schema namespace ([#7169](https://github.com/better-auth/better-auth/pull/7169))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/sso`

### ❗ Breaking Changes

- feat(auth)!: scope accounts by issuer ([#10403](https://github.com/better-auth/better-auth/pull/10403))

  This release is breaking. `Account.accountId` is renamed to `Account.providerAccountId`, and `Account.issuer` is required. Account-specific APIs select the local `Account.id` through `accountId`; token and provider-profile APIs can instead select the signed account cookie with `useAccountCookie: true`. Credential accounts use `local:credential` and the linked user's stable `id` as their provider identity.

  OAuth provider identity now comes from raw verified profiles. OpenID Connect discovery uses `sub`, plain OAuth uses `id`, and providers can declare `accountSubject` for another immutable field; Better Auth no longer switches between `sub` and `id` at runtime. `getUserInfo().user` no longer carries provider identity, and `mapProfileToUser` cannot return `id`. Read the selected identity from `accountInfo.account.providerAccountId` instead of `accountInfo.user.id`. The generic `microsoftEntraId` helper now requires a concrete tenant GUID; use the built-in Microsoft provider for multi-tenant authorities.

  SSO account subjects are now protocol-defined. OIDC uses the verified `sub` claim, and SAML uses the signed `NameID`; `mapping.id` is removed from both configurations. A manual SAML configuration without metadata XML must set `idpMetadata.entityID`, because `samlConfig.issuer` identifies the service provider and no longer acts as the IdP identity.

  Apply the reviewed account-identity backfill in the Better Auth 1.7 upgrade guide before deploying. The generated schema migration cannot assign trusted issuers or resolve existing identity collisions automatically.

### Features

- feat(sso): add transactional OIDC user resolution ([#10473](https://github.com/better-auth/better-auth/pull/10473))

### Bug Fixes

- fix(sso): redirect idp initiated saml flows in split origin deployments ([#10388](https://github.com/better-auth/better-auth/pull/10388))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/sso/CHANGELOG.md)

## `@better-auth/scim`

### ❗ Breaking Changes

- feat(scim)!: decouple provisioning from the organization plugin ([#10390](https://github.com/better-auth/better-auth/pull/10390))

  This replaces the previous SCIM configuration, client APIs, database schema, and organization-backed Group model. Existing SCIM installations cannot migrate provisioning state in place. Follow the SCIM cutover in the 1.7 upgrade guide, including full directory reprovisioning, before resuming traffic.

  Deferred database side effects now run only after a successful transaction. A rolled-back User update no longer refreshes its cached profile, and a rolled-back bulk session revocation no longer invalidates sessions.

### Features

- feat(scim): expose active provisioned user links ([#10474](https://github.com/better-auth/better-auth/pull/10474))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/scim/CHANGELOG.md)

## `auth`

### Features

- feat(db): add compound table indexes ([#10402](https://github.com/better-auth/better-auth/pull/10402))

### Bug Fixes

- fix: stub SvelteKit's explicit-environment-variables modules ([#10221](https://github.com/better-auth/better-auth/pull/10221))
- fix(cli): avoid duplicate unique indexes in drizzle schema ([#10333](https://github.com/better-auth/better-auth/pull/10333))
- fix(cli): disambiguate Drizzle relations with relationName ([#10352](https://github.com/better-auth/better-auth/pull/10352))
- fix(cli): recover when auth generate's config self-imports its own output ([#10302](https://github.com/better-auth/better-auth/pull/10302))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/cli/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- fix(electron): forward each Set-Cookie from /electron/init-oauth-proxy individually ([#9672](https://github.com/better-auth/better-auth/pull/9672))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/electron/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- fix(kysely-adapter): restore local migration constants ([#10377](https://github.com/better-auth/better-auth/pull/10377))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/mongo-adapter`

### Features

- feat(db): add compound table indexes ([#10402](https://github.com/better-auth/better-auth/pull/10402))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/mongo-adapter/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Bug Fixes

- fix(oauth-provider): defer logout effects until commit ([#10472](https://github.com/better-auth/better-auth/pull/10472))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- fix(organization): pass endpoint context to organization delete hooks ([#10190](https://github.com/better-auth/better-auth/pull/10190))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/cc708e51bcb1d4c367d2bc6182e6fd7fd722ece8/packages/stripe/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@akshatmalik-bruh, @ayushman46, @c-nicol, @gaurav-init, @gaurav0107, @GautamBytes, @gustavovalverde, @momomuchu, @OrangeManLi, @paoloricciuti, @ping-maxwell, @shiminshen, @swithek, @Tushar-Khandelwal-2004, @vinay-oppuri

**Full changelog:** [`v1.7.0-rc.1...v1.7.0-rc.2`](https://github.com/better-auth/better-auth/compare/v1.7.0-rc.1...v1.7.0-rc.2)

## v1.6.24 (2026-07-22)

## `better-auth`

### Features

- Added request context (`ctx`) as a third argument to `verifyIdToken`, enabling custom ID token verifiers to read request headers ([#10376](https://github.com/better-auth/better-auth/pull/10376))
- Added `beforeStoreCookie` option to the last-login-method plugin for GDPR compliance ([#5753](https://github.com/better-auth/better-auth/pull/5753))

### Bug Fixes

- Replaced flaky MongoDB where-coercion integration test with a direct unit test for more reliable test runs ([#10369](https://github.com/better-auth/better-auth/pull/10369))
- Fixed the `get-session` endpoint to include `no-store` cache control headers, preventing stale session data from being served ([#10222](https://github.com/better-auth/better-auth/pull/10222))
- Fixed SQLite migration diffs to recognize `BIGINT` as a valid number type, preventing spurious pending changes on rate limiter columns ([#10316](https://github.com/better-auth/better-auth/pull/10316))
- Fixed auth requests failing when request cloning throws an error inside verification callbacks ([#10336](https://github.com/better-auth/better-auth/pull/10336))
- Fixed `useSession({ throw: true })` incorrectly excluding `null` from its `data` type ([#9787](https://github.com/better-auth/better-auth/pull/9787))
- Fixed auth query revalidation and signal listeners not being restored after a client component remounts ([#10379](https://github.com/better-auth/better-auth/pull/10379))
- Fixed the `CookieAttributes` index signature type to be more precise ([#10442](https://github.com/better-auth/better-auth/pull/10442))
- Fixed silent misrouting of adapter queries when `user.modelName` was set to a value that collides with another schema key ([#10235](https://github.com/better-auth/better-auth/pull/10235))
- Fixed Kysely migration generation producing duplicate indexes for fields marked both `unique` and `index` ([#10357](https://github.com/better-auth/better-auth/pull/10357))
- Fixed magic-link and email-OTP send endpoints to validate the `Origin` header on cookieless requests, preventing cross-origin abuse ([#10368](https://github.com/better-auth/better-auth/pull/10368))
- Fixed remote MCP auth 401 challenge headers being hidden from browser clients due to missing CORS exposure ([#10290](https://github.com/better-auth/better-auth/pull/10290))
- Fixed OpenAPI schema to include plugin user fields (such as `username` and `displayUsername`) in `/sign-up/email` and `/update-user` request bodies ([#10453](https://github.com/better-auth/better-auth/pull/10453))
- Fixed `organization.listMembers` failing with "User not found for member" for organizations with more than ~100 members ([#10342](https://github.com/better-auth/better-auth/pull/10342))
- Fixed organization invitations to use database-generated IDs when `advanced.database.generateId` is configured, matching the behavior of other models ([#10040](https://github.com/better-auth/better-auth/pull/10040))
- Fixed `getDefaultModelName` to prefer exact schema key matches over `modelName` aliases, preventing adapter queries from being misrouted when a built-in table's name collides with another schema key

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9a661c7b7abceaa81123b2c56757ee24f3ad2ed6/packages/better-auth/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed SvelteKit builds by stubbing explicit-environment-variables modules ([#10221](https://github.com/better-auth/better-auth/pull/10221))
- Fixed Drizzle schema generation producing duplicate indexes for fields marked both `unique` and `index` ([#10333](https://github.com/better-auth/better-auth/pull/10333))
- Fixed Drizzle schema generation for tables with multiple foreign keys to the same model by adding disambiguating `relationName` values ([#10352](https://github.com/better-auth/better-auth/pull/10352))
- Fixed `auth generate` failing when the config file imports the not-yet-generated output file (e.g. on a Convex first run) ([#10302](https://github.com/better-auth/better-auth/pull/10302))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9a661c7b7abceaa81123b2c56757ee24f3ad2ed6/packages/cli/CHANGELOG.md)

## `@better-auth/electron`

### Bug Fixes

- Updated compatibility testing to include Electron 43 (peer range unchanged at `>=36.0.0`) ([#10440](https://github.com/better-auth/better-auth/pull/10440))
- Fixed `/electron/init-oauth-proxy` forwarding multiple `Set-Cookie` headers as a single comma-joined string, which caused the browser to drop the transfer-token cookie during OAuth handoff ([#9672](https://github.com/better-auth/better-auth/pull/9672))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9a661c7b7abceaa81123b2c56757ee24f3ad2ed6/packages/electron/CHANGELOG.md)

## `@better-auth/core`

### Bug Fixes

- Fixed an intermittent "No request state found" error caused by a race condition in `AsyncLocalStorage` initialization on serverless cold starts (e.g. Cloudflare Workers) ([#9862](https://github.com/better-auth/better-auth/pull/9862))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9a661c7b7abceaa81123b2c56757ee24f3ad2ed6/packages/core/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed IdP-initiated SAML sign-ins in split-origin deployments to redirect users to the configured application URL instead of the authentication server, using `idpInitiatedCallbackUrl` ([#10388](https://github.com/better-auth/better-auth/pull/10388))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9a661c7b7abceaa81123b2c56757ee24f3ad2ed6/packages/sso/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed `beforeDeleteOrganization` and `afterDeleteOrganization` hooks not receiving the endpoint context as the second argument ([#10190](https://github.com/better-auth/better-auth/pull/10190))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9a661c7b7abceaa81123b2c56757ee24f3ad2ed6/packages/stripe/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@akshatmalik-bruh, @ayushman46, @c-nicol, @gaurav-init, @gaurav0107, @GautamBytes, @momomuchu, @OrangeManLi, @paoloricciuti, @ping-maxwell, @shiminshen, @swithek, @Tushar-Khandelwal-2004, @vinay-oppuri

**Full changelog:** [`v1.6.23...v1.6.24`](https://github.com/better-auth/better-auth/compare/v1.6.23...v1.6.24)

## v1.7.0-rc.1 (2026-07-02) canary

## `better-auth`

### Features

- Added Yandex as a supported OAuth social provider ([#9138](https://github.com/better-auth/better-auth/pull/9138))

### Bug Fixes

- Fixed `auth migrate` to no longer abort when adding required or unique columns to an existing table ([#10293](https://github.com/better-auth/better-auth/pull/10293))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/fb1dff141c3ae8de325f190b154a7f9e9f86979a/packages/better-auth/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed affected row counting for D1 and postgres-js adapters ([#10257](https://github.com/better-auth/better-auth/pull/10257))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/fb1dff141c3ae8de325f190b154a7f9e9f86979a/packages/drizzle-adapter/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed string default values to be properly escaped in generated Drizzle schema ([#10259](https://github.com/better-auth/better-auth/pull/10259))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/fb1dff141c3ae8de325f190b154a7f9e9f86979a/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @gustavovalverde, @vladflotsky

**Full changelog:** [`v1.7.0-rc.0...v1.7.0-rc.1`](https://github.com/better-auth/better-auth/compare/v1.7.0-rc.0...v1.7.0-rc.1)

## v1.6.23 (2026-06-29)

## `better-auth`

### Features

- Added Yandex as a social OAuth provider ([#9138](https://github.com/better-auth/better-auth/pull/9138))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9dfceee14021fc15a2fb93023f39635f25b0b5ba/packages/better-auth/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Bug Fixes

- Fixed affected row counting for D1 and postgres-js adapters ([#10257](https://github.com/better-auth/better-auth/pull/10257))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9dfceee14021fc15a2fb93023f39635f25b0b5ba/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed organization subscription actions (cancel, upgrade, restore, and the billing portal) that could act on the wrong organization.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9dfceee14021fc15a2fb93023f39635f25b0b5ba/packages/stripe/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed string default values not being properly escaped in the generated Drizzle schema ([#10259](https://github.com/better-auth/better-auth/pull/10259))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/9dfceee14021fc15a2fb93023f39635f25b0b5ba/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@bytaesu, @vladflotsky

**Full changelog:** [`v1.6.22...v1.6.23`](https://github.com/better-auth/better-auth/compare/v1.6.22...v1.6.23)

## v1.7.0-rc.0 (2026-06-26) canary

## `better-auth`

### ❗ Breaking Changes

- feat(captcha)!: support wildcard endpoint matching ([#10004](https://github.com/better-auth/better-auth/pull/10004))
- feat(mcp)!: ship MCP as its own package built on the OAuth provider ([#9992](https://github.com/better-auth/better-auth/pull/9992))

  The route helper is renamed `requireMcpAuth` (was `withMcpAuth`), and the remote client is `createMcpResourceClient` (was `createMcpAuthClient`). `requireMcpAuth` verifies the bearer token against the published JWKS and passes the verified JWT claims to your handler.

  To migrate, install `@better-auth/mcp`, add the `jwt()` plugin (now required for token signing), and move options that were nested under `oidcConfig` to flat options on `mcp({ ... })`. The database models change: `oauthApplication` becomes `oauthClient`, with new `oauthRefreshToken` and `oauthClientAssertion` tables. Regenerate or migrate your schema with `npx auth migrate` or `npx auth generate`.

- feat(oauth-provider)!: add OIDC back-channel logout ([#9304](https://github.com/better-auth/better-auth/pull/9304))

  When a user's session ends at the OP (sign-out, `/oauth2/end-session`, admin revoke, ban), `@better-auth/oauth-provider` now notifies every Relying Party that holds tokens for that session. The user's API access is cut off right away, instead of access tokens staying usable until their own TTL. Each client opts in by registering a `backchannel_logout_uri` (and optionally `backchannel_logout_session_required`) via DCR or the admin client-create endpoint. The provider signs a `logout+jwt` Logout Token per client and POSTs it to that client in parallel, with a short per-RP timeout.

  **Breaking change.** Introspection of an opaque or JWT access token whose bound session has ended now returns `{ active: false }`, and `/oauth2/userinfo` rejects it with `invalid_token`. Previously the token stayed active until its own TTL. If you relied on access tokens outliving the user's session, that no longer holds.

  Refresh tokens without `offline_access` are revoked on session end; `offline_access` refresh tokens are preserved so long-lived API access can survive the browser session (OIDC Back-Channel Logout 1.0 §2.7). Access-token invalidation on session end is an additional OP hardening choice beyond §2.7, enforced by session liveness, so it holds even when the JWT plugin is disabled.

  Delivery runs through the host's background task handler when one is configured (Vercel `waitUntil`, Cloudflare `ctx.waitUntil`); without a handler it completes inline so notifications are not lost on request teardown. Configure `advanced.backgroundTasks.handler` on serverless runtimes to keep sign-out fast.

  Discovery at `/.well-known/openid-configuration` and `/.well-known/oauth-authorization-server` advertises `backchannel_logout_supported: true` and `backchannel_logout_session_supported: true` when the JWT plugin is enabled. Registering a `backchannel_logout_uri` rejects fragments, non-http(s) schemes, and non-HTTPS targets on confidential clients. Its SSRF host guard, which blocks private, reserved, tunneled, and cloud-metadata hosts, now also covers a `private_key_jwt` client's `jwks_uri`.

  Schema changes on `@better-auth/oauth-provider`:

  - `oauthClient.backchannelLogoutUri: string | null`
  - `oauthClient.backchannelLogoutSessionRequired: boolean`
  - `oauthAccessToken.revoked: Date | null`

  `better-auth`'s `signJWT` gains an optional `header` argument, forwarded to custom remote signers. JWT profiles that need an explicit media type, such as `typ: "logout+jwt"`, can now set it without reaching for the low-level signing primitives.

- feat(oauth-provider)!: model OAuth protected resources explicitly ([#9648](https://github.com/better-auth/better-auth/pull/9648))

  `validAudiences` is removed. Move each existing resource identifier into `resources`; link clients that should be limited to specific resources through `oauthClientResource` or Dynamic Client Registration `resources`.

  Access-token issuance now applies resource policy to the requested RFC 8707 `resource` values. The OAuth provider narrows scopes to resource allowlists, uses the shortest configured TTL, strips reserved RFC 9068 claim names from custom claims, emits `jti`, and keeps repeated `resource` form parameters.

  Refresh-token TTLs now use the shortest applicable lifetime. Deployments with a per-resource `refreshTokenTtl` longer than `refreshTokenExpiresIn` will see refresh tokens expire at the provider default instead of the longer resource value.

  JWT signing can now honor per-resource pins. `signJWT()` accepts `signingKeyId` and `signingAlgorithm`; JWKS adapters expose `getKeyById()` and `getLatestKeyByAlg()`. The `jwks` table adds nullable `alg` and `crv` columns, and `keyPairConfigs` can provision multiple algorithms in one keyring.

  After upgrading, run `npx @better-auth/cli generate` and apply the migration before deploying. The migration adds `oauthResource`, `oauthClientResource`, and the new `jwks` columns. Without it, resources using `signingAlgorithm` cannot find matching keys.

  Resource servers should publish RFC 9728 protected-resource metadata at their own origin. The OAuth provider exposes challenge helpers that point clients at that metadata.

  `@better-auth/mcp` now requires an explicit `resource` option. The plugin stores that identifier as an OAuth resource, publishes RFC 9728 protected-resource metadata for it, and binds issued access tokens to that resource. Existing `mcp({ loginPage, consentPage })` setups should add a protected MCP resource identifier, for example `resource: "https://api.example.com/mcp"`.

- feat(two-factor)!: add OTP enablement and discriminated response ([#9057](https://github.com/better-auth/better-auth/pull/9057))

  `enableTwoFactor` now accepts a `method` parameter (`"otp" | "totp"`, default `"totp"`) and returns a discriminated response with a `method` field.

  ### `method: "otp"`
  - Sets `twoFactorEnabled: true` immediately.
  - Returns `{ method: "otp" }`.
  - Requires `otpOptions.sendOTP` to be configured on the server; rejects with `OTP_NOT_CONFIGURED` otherwise.

  ### `method: "totp"` (default)
  - Returns `{ method: "totp", totpURI, backupCodes }`.
  - Rejects with `TOTP_NOT_CONFIGURED` if `totpOptions.disable` is set.

  ### Breaking changes
  - **Removed `skipVerificationOnEnable`**: use `method: "otp"` for immediate activation, or the standard TOTP verification flow.
  - **Response shape changed**: `enableTwoFactor` includes a `method` field in the response (`"otp"` or `"totp"`).

- fix(auth)!: ignore x-forwarded headers by default on dynamic baseURL ([#9134](https://github.com/better-auth/better-auth/pull/9134))

  Requests using `baseURL: { allowedHosts }` now resolve the auth origin from `Host` by default, so forwarded headers cannot select another allowed host unless trusted proxy headers are enabled.

  **Breaking change:** if your proxy exposes the public hostname only through `x-forwarded-host`, set `advanced.trustedProxyHeaders: true`. Deployments where the proxy rewrites `Host` to the public hostname (nginx default, Vercel, Cloudflare, and Netlify) are unaffected.

  **Migration:**

  ```ts
  betterAuth({
    baseURL: { allowedHosts: [...] },
    advanced: {
      trustedProxyHeaders: true,
    },
  });
  ```

- fix(electron)!: enforce S256 PKCE and harden origin checks ([#9645](https://github.com/better-auth/better-auth/pull/9645))

  The Electron sign-in flow now mandates PKCE S256. Plain PKCE is rejected: the `code_challenge_method` parameter is gone and every authorization code is verified by hashing the verifier with SHA-256. The server no longer trusts an `electron-origin` header to set the request Origin. The Electron client now sends a real `Origin` (for example `myapp:/`), so upgrade the `@better-auth/electron` client and server together and make sure your app's scheme is in `trustedOrigins`. The unused `disableOriginOverride` option is removed.

  Custom-scheme entries in `trustedOrigins` now match by scheme and authority instead of string prefix. A host-less entry such as `myapp://` or `exp://` still trusts every host of that scheme, but a host-bearing entry such as `myapp://callback` matches that host exactly, so it is no longer satisfied by `myapp://callback.attacker.tld`.

- fix(one-tap)!: require client id for audience validation ([#10036](https://github.com/better-auth/better-auth/pull/10036))
- refactor!: remove deprecated oidc-provider plugin ([#10031](https://github.com/better-auth/better-auth/pull/10031))
- refactor(generic-oauth)!: rewrite as first-class social provider with RFC compliance ([#9069](https://github.com/better-auth/better-auth/pull/9069))

  **Breaking changes:**

  - `signIn.oauth2({ providerId })` replaced by `signIn.social({ provider })`
  - `oauth2.link()` replaced by `linkSocial()`
  - Callback URL changed from `/api/auth/oauth2/callback/:id` to `/api/auth/callback/:id`
  - `genericOAuthClient()` removed; generic OAuth providers now use the standard social client APIs
  - `pkce` defaults to `true` (was `false`); set `pkce: false` for providers that reject PKCE
  - `authorizationUrlParams` and `tokenUrlParams` only accept `Record<string, string>`
  - `issuer` and `requireIssuerValidation` config fields removed; issuer validation is automatic via OIDC discovery
  - `mapProfileToUser` profile typed as `OAuth2UserInfo & Record<string, unknown>`

- refactor(oauth)!: verify provider `id_tokens` with a single shared verifier ([#9828](https://github.com/better-auth/better-auth/pull/9828))

  Client-submitted id_token sign-in (`signIn.social({ idToken })` and account linking) is verified by one function instead of a per-provider `verifyIdToken` method. Each provider declares an `idToken` config with a JWKS source, issuer, and audience, and the core verifier runs the signature, issuer, audience, and nonce checks. A provider that declares no config rejects the client id_token path.

  PayPal previously accepted any decodable id_token without verifying its signature. PayPal derives identity from the access token, so it now declares no `idToken` config, and the client id_token path returns `ID_TOKEN_NOT_SUPPORTED`. PayPal sign-in through the redirect flow is unchanged.

  Custom providers that implement `UpstreamProvider` directly replace the removed `verifyIdToken` method with an `idToken` config:

  ```ts
  idToken: {
  	jwks: createRemoteJWKSet(new URL("https://issuer.example/.well-known/jwks.json")),
  	issuer: "https://issuer.example",
  	audience: clientId,
  },
  ```

  For verification that cannot use a local JWKS, pass `idToken: { verify: async (token, nonce) => boolean }`. The `verifyIdToken` and `disableIdTokenSignIn` provider options are unchanged.

### Features

- feat: add `clientAssertion` support to the Microsoft Entra ID social provider ([#9898](https://github.com/better-auth/better-auth/pull/9898))
- feat: make `Auth` instance fetchable ([#9431](https://github.com/better-auth/better-auth/pull/9431))
- feat(auth): add per-provider `requireEmailVerification` for social sign-in ([#9929](https://github.com/better-auth/better-auth/pull/9929))
- feat(auth): add user.validateUserInfo provisioning gate ([#9864](https://github.com/better-auth/better-auth/pull/9864))
- feat(client): add `hydrateSession` for SSR session hydration ([#8733](https://github.com/better-auth/better-auth/pull/8733))
- feat(generic-oauth,sso): support IDP-initiated flows via secure bounce ([#9301](https://github.com/better-auth/better-auth/pull/9301))
- feat(generic-oauth): forward `refreshTokenParams` to token endpoint ([#9948](https://github.com/better-auth/better-auth/pull/9948))
- feat(generic-oauth): verify discovery `id_tokens` and enable `id_token` sign-in ([#9966](https://github.com/better-auth/better-auth/pull/9966))
- feat(oauth-provider): add DPoP support ([#10039](https://github.com/better-auth/better-auth/pull/10039))
- feat(oauth-provider): compute `at_hash` in id tokens per OIDC Core §3.1.3.6 ([#9079](https://github.com/better-auth/better-auth/pull/9079))
- feat(oauth): add `private_key_jwt` client authentication (RFC 7523) ([#8836](https://github.com/better-auth/better-auth/pull/8836))
- feat(oauth): enforce no-store on credential responses via a declarative flag ([#10065](https://github.com/better-auth/better-auth/pull/10065))
- feat(oauth): per-request `additionalParams` and `loginHint` ([#9305](https://github.com/better-auth/better-auth/pull/9305))
- feat(oauth): server-trusted state channel; fix anonymous cookieless linking ([#9930](https://github.com/better-auth/better-auth/pull/9930))
- feat(org): allow passing userId and organizationId to listUserTeams API ([#8977](https://github.com/better-auth/better-auth/pull/8977))
- feat(phone-number): add server-side OTP consumption API ([#9766](https://github.com/better-auth/better-auth/pull/9766))
- feat(session): support JWKS-backed JWT session cookie cache ([#8931](https://github.com/better-auth/better-auth/pull/8931))
- feat(username): add immutable username option ([#9240](https://github.com/better-auth/better-auth/pull/9240))

### Bug Fixes

- Bundled dependencies were refreshed to their latest compatible releases, including jose, nanostores, the noble crypto packages, and SimpleWebAuthn. These updates are backward compatible and require no changes to existing projects.
- fix(generic-oauth): bind id token nonce in redirect flow ([#10095](https://github.com/better-auth/better-auth/pull/10095))
- fix(oauth): create new oauth account in transaction ([#10125](https://github.com/better-auth/better-auth/pull/10125))
- fix(oauth): derive redirect URI from per-request baseURL ([#10127](https://github.com/better-auth/better-auth/pull/10127))
- fix(oauth): preserve account.scope across re-auth and refresh ([#10128](https://github.com/better-auth/better-auth/pull/10128))
- fix(oauth): preserve user on null profile override ([#10124](https://github.com/better-auth/better-auth/pull/10124))
- fix(session): fire session-delete hooks for preserved sessions on secondaryStorage ([#9969](https://github.com/better-auth/better-auth/pull/9969))
- refactor(oauth): single-source Basic credentials + getHttpTestInstance ([#9657](https://github.com/better-auth/better-auth/pull/9657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/better-auth/CHANGELOG.md)

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- feat(mcp)!: ship MCP as its own package built on the OAuth provider ([#9992](https://github.com/better-auth/better-auth/pull/9992))

  The route helper is renamed `requireMcpAuth` (was `withMcpAuth`), and the remote client is `createMcpResourceClient` (was `createMcpAuthClient`). `requireMcpAuth` verifies the bearer token against the published JWKS and passes the verified JWT claims to your handler.

  To migrate, install `@better-auth/mcp`, add the `jwt()` plugin (now required for token signing), and move options that were nested under `oidcConfig` to flat options on `mcp({ ... })`. The database models change: `oauthApplication` becomes `oauthClient`, with new `oauthRefreshToken` and `oauthClientAssertion` tables. Regenerate or migrate your schema with `npx auth migrate` or `npx auth generate`.

- feat(oauth-provider)!: add OIDC back-channel logout ([#9304](https://github.com/better-auth/better-auth/pull/9304))

  When a user's session ends at the OP (sign-out, `/oauth2/end-session`, admin revoke, ban), `@better-auth/oauth-provider` now notifies every Relying Party that holds tokens for that session. The user's API access is cut off right away, instead of access tokens staying usable until their own TTL. Each client opts in by registering a `backchannel_logout_uri` (and optionally `backchannel_logout_session_required`) via DCR or the admin client-create endpoint. The provider signs a `logout+jwt` Logout Token per client and POSTs it to that client in parallel, with a short per-RP timeout.

  **Breaking change.** Introspection of an opaque or JWT access token whose bound session has ended now returns `{ active: false }`, and `/oauth2/userinfo` rejects it with `invalid_token`. Previously the token stayed active until its own TTL. If you relied on access tokens outliving the user's session, that no longer holds.

  Refresh tokens without `offline_access` are revoked on session end; `offline_access` refresh tokens are preserved so long-lived API access can survive the browser session (OIDC Back-Channel Logout 1.0 §2.7). Access-token invalidation on session end is an additional OP hardening choice beyond §2.7, enforced by session liveness, so it holds even when the JWT plugin is disabled.

  Delivery runs through the host's background task handler when one is configured (Vercel `waitUntil`, Cloudflare `ctx.waitUntil`); without a handler it completes inline so notifications are not lost on request teardown. Configure `advanced.backgroundTasks.handler` on serverless runtimes to keep sign-out fast.

  Discovery at `/.well-known/openid-configuration` and `/.well-known/oauth-authorization-server` advertises `backchannel_logout_supported: true` and `backchannel_logout_session_supported: true` when the JWT plugin is enabled. Registering a `backchannel_logout_uri` rejects fragments, non-http(s) schemes, and non-HTTPS targets on confidential clients. Its SSRF host guard, which blocks private, reserved, tunneled, and cloud-metadata hosts, now also covers a `private_key_jwt` client's `jwks_uri`.

  Schema changes on `@better-auth/oauth-provider`:

  - `oauthClient.backchannelLogoutUri: string | null`
  - `oauthClient.backchannelLogoutSessionRequired: boolean`
  - `oauthAccessToken.revoked: Date | null`

  `better-auth`'s `signJWT` gains an optional `header` argument, forwarded to custom remote signers. JWT profiles that need an explicit media type, such as `typ: "logout+jwt"`, can now set it without reaching for the low-level signing primitives.

- feat(oauth-provider)!: enforce max_age ([#9936](https://github.com/better-auth/better-auth/pull/9936))
- feat(oauth-provider)!: make id-token claim authority explicit ([#10140](https://github.com/better-auth/better-auth/pull/10140))

  `customIdTokenClaims`, extension ID-token claims, and per-issuance `idTokenClaims` can no longer set OIDC/JWT protocol claims such as issuer, subject, audience, token lifetime, nonce, session or hash binding, `auth_time`, `acr`, `amr`, or `azp`. Namespaced custom claims still appear in ID tokens.

- feat(oauth-provider)!: model OAuth protected resources explicitly ([#9648](https://github.com/better-auth/better-auth/pull/9648))

  `validAudiences` is removed. Move each existing resource identifier into `resources`; link clients that should be limited to specific resources through `oauthClientResource` or Dynamic Client Registration `resources`.

  Access-token issuance now applies resource policy to the requested RFC 8707 `resource` values. The OAuth provider narrows scopes to resource allowlists, uses the shortest configured TTL, strips reserved RFC 9068 claim names from custom claims, emits `jti`, and keeps repeated `resource` form parameters.

  Refresh-token TTLs now use the shortest applicable lifetime. Deployments with a per-resource `refreshTokenTtl` longer than `refreshTokenExpiresIn` will see refresh tokens expire at the provider default instead of the longer resource value.

  JWT signing can now honor per-resource pins. `signJWT()` accepts `signingKeyId` and `signingAlgorithm`; JWKS adapters expose `getKeyById()` and `getLatestKeyByAlg()`. The `jwks` table adds nullable `alg` and `crv` columns, and `keyPairConfigs` can provision multiple algorithms in one keyring.

  After upgrading, run `npx @better-auth/cli generate` and apply the migration before deploying. The migration adds `oauthResource`, `oauthClientResource`, and the new `jwks` columns. Without it, resources using `signingAlgorithm` cannot find matching keys.

  Resource servers should publish RFC 9728 protected-resource metadata at their own origin. The OAuth provider exposes challenge helpers that point clients at that metadata.

  `@better-auth/mcp` now requires an explicit `resource` option. The plugin stores that identifier as an OAuth resource, publishes RFC 9728 protected-resource metadata for it, and binds issued access tokens to that resource. Existing `mcp({ loginPage, consentPage })` setups should add a protected MCP resource identifier, for example `resource: "https://api.example.com/mcp"`.

- fix(oauth-provider)!: bind client authentication to the issuing grant ([#10063](https://github.com/better-auth/better-auth/pull/10063))
- fix(oauth-provider)!: bind RFC 8707 resource indicators to the authorization grant ([#9836](https://github.com/better-auth/better-auth/pull/9836))

  Breaking change: when the authorization includes a `resource`, the token and refresh requests may only narrow it. A request for a resource the authorization did not cover returns `invalid_target`. The `customAccessTokenClaims` callback now receives a `resources` array in place of the `resource` string.

  Migration: run the schema migration (`npx @better-auth/cli migrate`, or `generate` if you manage the schema yourself) to add the new resource columns.

- fix(oauth-provider)!: return RFC-compliant error envelopes from validation failures ([#9277](https://github.com/better-auth/better-auth/pull/9277))

  An internal `createOAuthEndpoint` wrapper now translates zod validation failures into the envelope required by RFC 6749 §5.2, 7009 §2.2.1, 7662 §2.3, and 7591 §3.2.2. Failing issues are routed per field:

  - an absent required value maps to `errorCodesByField[name].missing` or the endpoint's `defaultError`.
  - an unsupported value (unknown enum member) maps to `errorCodesByField[name].invalid` or `defaultError`.
  - any other failure (wrong type, duplicated query params, invalid format, refinement) maps to `defaultError`, so RFC 6749 §3.1 malformed requests emit the endpoint's default code regardless of field.

  All six OAuth endpoints (`/oauth2/token`, `/oauth2/authorize`, `/oauth2/revoke`, `/oauth2/introspect`, `/oauth2/register`, `/oauth2/end-session`) now return RFC-compliant errors for malformed requests. `/oauth2/authorize` validation failures redirect to the relying party with `error`, `error_description`, echoed `state`, and `iss` whenever `client_id` and `redirect_uri` resolve against the registered client; requests without a trusted RP fall back to the server error page.

  Additional RFC compliance fixes on the same endpoints:

  - `/oauth2/revoke` and `/oauth2/introspect` now ignore an unknown `token_type_hint` instead of rejecting it. RFC 7009 §2.2.1 and RFC 7662 §2.1 reserve `unsupported_token_type` for the token itself, not the hint value; servers MAY ignore unrecognized hints and search across supported token types.
  - `/oauth2/authorize` error redirects now respect OIDC Core 1.0 §5 response modes. Errors for `response_type=token` or `id_token` are delivered in the URL fragment per RFC 6749 §4.2.2.1; an explicit `response_mode=query` overrides the default.

- refactor(generic-oauth)!: rewrite as first-class social provider with RFC compliance ([#9069](https://github.com/better-auth/better-auth/pull/9069))

  **Breaking changes:**

  - `signIn.oauth2({ providerId })` replaced by `signIn.social({ provider })`
  - `oauth2.link()` replaced by `linkSocial()`
  - Callback URL changed from `/api/auth/oauth2/callback/:id` to `/api/auth/callback/:id`
  - `genericOAuthClient()` removed; generic OAuth providers now use the standard social client APIs
  - `pkce` defaults to `true` (was `false`); set `pkce: false` for providers that reject PKCE
  - `authorizationUrlParams` and `tokenUrlParams` only accept `Record<string, string>`
  - `issuer` and `requireIssuerValidation` config fields removed; issuer validation is automatic via OIDC discovery
  - `mapProfileToUser` profile typed as `OAuth2UserInfo & Record<string, unknown>`

### Features

- feat: add token endpoint client authentication ([#9625](https://github.com/better-auth/better-auth/pull/9625))
- feat(cimd): add Client ID Metadata Document plugin ([#9159](https://github.com/better-auth/better-auth/pull/9159))
- feat(oauth-provider): add DPoP support ([#10039](https://github.com/better-auth/better-auth/pull/10039))
- feat(oauth-provider): add extension surface ([#10030](https://github.com/better-auth/better-auth/pull/10030))
- feat(oauth-provider): add refresh token reuse interval ([#10145](https://github.com/better-auth/better-auth/pull/10145))
- feat(oauth-provider): allow confidential DCR clients without PKCE ([#10146](https://github.com/better-auth/better-auth/pull/10146))
- feat(oauth-provider): compute `at_hash` in id tokens per OIDC Core §3.1.3.6 ([#9079](https://github.com/better-auth/better-auth/pull/9079))
- feat(oauth-provider): consistent and audience-scoped token introspection ([#10045](https://github.com/better-auth/better-auth/pull/10045))
- feat(oauth-provider): expose sessionId to `id_token` claim contributors ([#10113](https://github.com/better-auth/better-auth/pull/10113))
- feat(oauth-provider): honor requested UserInfo claims via a claim registry ([#10156](https://github.com/better-auth/better-auth/pull/10156))
- feat(oauth-provider): support protected dynamic client registration ([#10037](https://github.com/better-auth/better-auth/pull/10037))
- feat(oauth): add `private_key_jwt` client authentication (RFC 7523) ([#8836](https://github.com/better-auth/better-auth/pull/8836))
- feat(oauth): enforce no-store on credential responses via a declarative flag ([#10065](https://github.com/better-auth/better-auth/pull/10065))
- feat(oauth): server-trusted state channel; fix anonymous cookieless linking ([#9930](https://github.com/better-auth/better-auth/pull/9930))

### Bug Fixes

- fix(oauth-provider): accept UserInfo form-body tokens ([#10155](https://github.com/better-auth/better-auth/pull/10155))
- fix(oauth-provider): allow nonce-bound offline access without PKCE ([#10153](https://github.com/better-auth/better-auth/pull/10153))
- fix(oauth-provider): challenge invalid userinfo tokens ([#10068](https://github.com/better-auth/better-auth/pull/10068))
- fix(oauth-provider): handle OIDC authorization request inputs ([#10151](https://github.com/better-auth/better-auth/pull/10151))
- fix(oauth-provider): keep OIDC scope claims on UserInfo ([#10152](https://github.com/better-auth/better-auth/pull/10152))
- fix(oauth-provider): make `private_key_jwt` jti single-use atomic across processes ([#9964](https://github.com/better-auth/better-auth/pull/9964))
- fix(oauth-provider): make `redirect_uri` conditional at the token endpoint ([#10159](https://github.com/better-auth/better-auth/pull/10159))
- fix(oauth-provider): preserve dcr client key metadata ([#10144](https://github.com/better-auth/better-auth/pull/10144))
- fix(oauth-provider): redirect missing `response_type` errors ([#10149](https://github.com/better-auth/better-auth/pull/10149))
- fix(oauth-provider): reject authorization code replay correctly ([#10150](https://github.com/better-auth/better-auth/pull/10150))
- fix(oauth-provider): report `unsupported_token_type` for JWT access-token revocation ([#9970](https://github.com/better-auth/better-auth/pull/9970))
- fix(oauth-provider): return invalid_grant for cross-client refresh tokens ([#10154](https://github.com/better-auth/better-auth/pull/10154))
- refactor(oauth): single-source Basic credentials + getHttpTestInstance ([#9657](https://github.com/better-auth/better-auth/pull/9657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/sso`

### ❗ Breaking Changes

- feat(sso)!: support multiple IdP signing certificates ([#8805](https://github.com/better-auth/better-auth/pull/8805))

  SAML signing certificates now accept an array of PEM strings, so administrators can publish a new IdP cert alongside the old one and complete the rotation without forcing every active session to re-authenticate. Responses signed by any listed cert are accepted.

  ```ts
  samlConfig: {
      idpMetadata: {
          cert: [currentPem, nextPem],
      },
  }
  ```

  Both `samlConfig.cert` and `samlConfig.idpMetadata.cert` accept either a single PEM string or an array. When both are set, `idpMetadata.cert` wins.

  **Breaking: response shape**

  The management endpoints (`getSSOProvider`, `listSSOProviders`, `updateSSOProvider`) now return `samlConfig.certificate` as an array of parsed certificates in every case, even when a single cert is configured. The field is absent only when certs live inside `idpMetadata.metadata`. Update consumers to read an array; no more `Array.isArray` branching.

  **Validation**

  Registration now rejects SAML configs that supply no signing-cert source. samlify needs either an `idpMetadata.metadata` XML document (which embeds the certs) or an explicit PEM under `cert` or `idpMetadata.cert`. Configs missing both fail with `CERT_SOURCE_MISSING`.

  **Fix**

  SAML Single Logout could fail to decrypt encrypted `LogoutResponse` payloads because the IdP entity was constructed without `privateKey`, `encPrivateKey`, or `encPrivateKeyPass` on that code path. All three are now applied on every IdP construction.

- fix(auth)!: harden validateUserInfo source contract ([#9940](https://github.com/better-auth/better-auth/pull/9940))
- fix(sso)!: harden SAML response validation (InResponseTo, Audience, SessionIndex) ([#9055](https://github.com/better-auth/better-auth/pull/9055))

  ### Breaking Changes
  - **`allowIdpInitiated` now defaults to `false`** — IdP-initiated SSO (unsolicited SAML responses) is disabled by default. Set `saml.allowIdpInitiated: true` to restore the previous behavior. This aligns with the SAML2Int interoperability profile which recommends against IdP-initiated SSO due to its susceptibility to injection attacks.

  ### Bug Fixes
  - **InResponseTo validation was completely non-functional** — The code read `extract.inResponseTo` (always `undefined`) instead of samlify's actual path `extract.response.inResponseTo`. SP-initiated InResponseTo validation now works as intended in both ACS handlers.
  - **Audience Restriction was never validated** — SAML assertions issued for a different service provider were accepted without checking the `<AudienceRestriction>` element. Audience is now validated against the configured `samlConfig.audience` value per SAML 2.0 Core §2.5.1.
  - **SessionIndex stored as object instead of string** — samlify returns `sessionIndex` from login responses as `{ authnInstant, sessionNotOnOrAfter, sessionIndex }`, but the code stored the whole object. SLO session-index comparisons always failed silently. The correct inner `sessionIndex` string is now extracted.

  ### Improvements
  - Extracted shared `validateInResponseTo()` and `validateAudience()` into `packages/sso/src/saml/response-validation.ts`, eliminating ~160 lines of duplicated validation logic between the two ACS handlers.
  - Fixed `SAMLAssertionExtract` type to match samlify's actual extractor output shape.

- refactor(sso)!: remove callbackUrl, consolidate ACS endpoint, fix SLO ([#9117](https://github.com/better-auth/better-auth/pull/9117))

  **`callbackUrl` removed from `samlConfig`.**
  The ACS URL is now always derived from your `baseURL` and `providerId`. Remove `callbackUrl` from your SAML provider configuration. The post-login redirect destination is set per sign-in via `callbackURL` in `signIn.sso()`:

  ```ts
  await authClient.signIn.sso({
    providerId: "my-provider",
    callbackURL: "/dashboard",
  });
  ```

  **`/sso/saml2/callback/:providerId` endpoint removed.**
  Update your IdP's ACS URL to `/sso/saml2/sp/acs/:providerId`. This endpoint handles both GET and POST requests.

  **`spMetadata` is now optional.**
  You no longer need to pass `spMetadata: {}` when registering a provider. SP metadata is auto-generated from your configuration.

  **Removed unused fields from `SAMLConfig`:**
  `decryptionPvk`, `additionalParams`, `idpMetadata.entityURL`, `idpMetadata.redirectURL`. These were stored but never read. Remove them from your configuration if present.

  ### Bug fixes
  - Fix SLO SessionIndex matching: LogoutRequests with a SessionIndex were silently failing to delete the correct session.
  - Audience validation now defaults to the SP entity ID when `audience` is not configured, per SAML Core section 2.5.1.
  - Restore `AllowCreate` in AuthnRequests, required by IdPs that use JIT provisioning.
  - SP metadata endpoint now reflects actual SP capabilities (encryption, signing, SLO).

### Features

- feat(auth): add user.validateUserInfo provisioning gate ([#9864](https://github.com/better-auth/better-auth/pull/9864))
- feat(generic-oauth,sso): support IDP-initiated flows via secure bounce ([#9301](https://github.com/better-auth/better-auth/pull/9301))
- feat(oauth): add `private_key_jwt` client authentication (RFC 7523) ([#8836](https://github.com/better-auth/better-auth/pull/8836))
- feat(oauth): per-request `additionalParams` and `loginHint` ([#9305](https://github.com/better-auth/better-auth/pull/9305))
- feat(oauth): server-trusted state channel; fix anonymous cookieless linking ([#9930](https://github.com/better-auth/better-auth/pull/9930))
- feat(sso): support additionalFields on ssoProvider ([#9445](https://github.com/better-auth/better-auth/pull/9445))

### Bug Fixes

- fix(sso): reject OIDC endpoint redirects portably ([#10072](https://github.com/better-auth/better-auth/pull/10072))
- fix(sso): update samlify to 2.13.1 for signed-assertion XML injection ([#9821](https://github.com/better-auth/better-auth/pull/9821))
- fix(sso): upgrade samlify to 2.12.0 with XPath injection and XXE fixes ([#9121](https://github.com/better-auth/better-auth/pull/9121))
- refactor(oauth): single-source Basic credentials + getHttpTestInstance ([#9657](https://github.com/better-auth/better-auth/pull/9657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/sso/CHANGELOG.md)

## `@better-auth/mcp` ✨

### ❗ Breaking Changes

- feat(mcp)!: ship MCP as its own package built on the OAuth provider ([#9992](https://github.com/better-auth/better-auth/pull/9992))

  The route helper is renamed `requireMcpAuth` (was `withMcpAuth`), and the remote client is `createMcpResourceClient` (was `createMcpAuthClient`). `requireMcpAuth` verifies the bearer token against the published JWKS and passes the verified JWT claims to your handler.

  To migrate, install `@better-auth/mcp`, add the `jwt()` plugin (now required for token signing), and move options that were nested under `oidcConfig` to flat options on `mcp({ ... })`. The database models change: `oauthApplication` becomes `oauthClient`, with new `oauthRefreshToken` and `oauthClientAssertion` tables. Regenerate or migrate your schema with `npx auth migrate` or `npx auth generate`.

- feat(oauth-provider)!: model OAuth protected resources explicitly ([#9648](https://github.com/better-auth/better-auth/pull/9648))

  `validAudiences` is removed. Move each existing resource identifier into `resources`; link clients that should be limited to specific resources through `oauthClientResource` or Dynamic Client Registration `resources`.

  Access-token issuance now applies resource policy to the requested RFC 8707 `resource` values. The OAuth provider narrows scopes to resource allowlists, uses the shortest configured TTL, strips reserved RFC 9068 claim names from custom claims, emits `jti`, and keeps repeated `resource` form parameters.

  Refresh-token TTLs now use the shortest applicable lifetime. Deployments with a per-resource `refreshTokenTtl` longer than `refreshTokenExpiresIn` will see refresh tokens expire at the provider default instead of the longer resource value.

  JWT signing can now honor per-resource pins. `signJWT()` accepts `signingKeyId` and `signingAlgorithm`; JWKS adapters expose `getKeyById()` and `getLatestKeyByAlg()`. The `jwks` table adds nullable `alg` and `crv` columns, and `keyPairConfigs` can provision multiple algorithms in one keyring.

  After upgrading, run `npx @better-auth/cli generate` and apply the migration before deploying. The migration adds `oauthResource`, `oauthClientResource`, and the new `jwks` columns. Without it, resources using `signingAlgorithm` cannot find matching keys.

  Resource servers should publish RFC 9728 protected-resource metadata at their own origin. The OAuth provider exposes challenge helpers that point clients at that metadata.

  `@better-auth/mcp` now requires an explicit `resource` option. The plugin stores that identifier as an OAuth resource, publishes RFC 9728 protected-resource metadata for it, and binds issued access tokens to that resource. Existing `mcp({ loginPage, consentPage })` setups should add a protected MCP resource identifier, for example `resource: "https://api.example.com/mcp"`.

### Features

- feat(oauth-provider): add DPoP support ([#10039](https://github.com/better-auth/better-auth/pull/10039))
- feat(oauth-provider): add refresh token reuse interval ([#10145](https://github.com/better-auth/better-auth/pull/10145))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/mcp/CHANGELOG.md)

## `@better-auth/scim`

### ❗ Breaking Changes

- feat(scim)!: isolate provider connections by organization ([#10249](https://github.com/better-auth/better-auth/pull/10249))

  SCIM-managed accounts now use namespaced provider IDs (`scim:{organizationId}:{providerId}` or `scim:{providerId}` for app-level static providers). Migrate only known SCIM-managed account rows before upgrading; leave non-SCIM accounts unchanged even when they share the same provider ID.

  Organization-scoped `active: false` now makes a user inactive in that organization while keeping SCIM group and team associations available for reactivation. Use `DELETE` to fully deprovision organization-scoped SCIM state.

  `defaultSCIM` has been replaced by `staticProviders`. `linkExistingUsers.trustedDomains` has been removed; use `requireExistingOrgMembership`, `shouldLinkUser`, or explicit `true` instead.

- fix(scim)!: always bind personal SCIM connections to their creator ([#9840](https://github.com/better-auth/better-auth/pull/9840))

  `generateSCIMToken` now records the creator's `userId` on every personal connection. The `generate-token`, `list-provider-connections`, `get-provider-connection`, and `delete-provider-connection` endpoints grant access only to that owner. Organization-scoped connections keep their existing behavior and continue to use organization membership and the configured `requiredRole` checks.

  This release is breaking. It removes the `providerOwnership` option, and owner binding can no longer be disabled. The `scimProvider.userId` column is now a permanent part of the schema, so run a migration after upgrading with `npx auth migrate` or `npx auth generate`.

  Connections created before this release carry no owner. Access now fails closed, so those connections are no longer reachable through the management endpoints, including token regeneration. Reclaim them at the database level: delete `scimProvider` rows that have neither `organizationId` nor `userId`, or set `userId` to the intended owner, then regenerate tokens as needed. Organization-scoped connections are not affected.

### Features

- feat(auth): add user.validateUserInfo provisioning gate ([#9864](https://github.com/better-auth/better-auth/pull/9864))
- feat(scim): add durable group resources ([#10018](https://github.com/better-auth/better-auth/pull/10018))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/scim/CHANGELOG.md)

## `@better-auth/electron`

### ❗ Breaking Changes

- fix(electron)!: enforce S256 PKCE and harden origin checks ([#9645](https://github.com/better-auth/better-auth/pull/9645))

  The Electron sign-in flow now mandates PKCE S256. Plain PKCE is rejected: the `code_challenge_method` parameter is gone and every authorization code is verified by hashing the verifier with SHA-256. The server no longer trusts an `electron-origin` header to set the request Origin. The Electron client now sends a real `Origin` (for example `myapp:/`), so upgrade the `@better-auth/electron` client and server together and make sure your app's scheme is in `trustedOrigins`. The unused `disableOriginOverride` option is removed.

  Custom-scheme entries in `trustedOrigins` now match by scheme and authority instead of string prefix. A host-less entry such as `myapp://` or `exp://` still trusts every host of that scheme, but a host-bearing entry such as `myapp://callback` matches that host exactly, so it is no longer satisfied by `myapp://callback.attacker.tld`.

- refactor(generic-oauth)!: rewrite as first-class social provider with RFC compliance ([#9069](https://github.com/better-auth/better-auth/pull/9069))

  **Breaking changes:**

  - `signIn.oauth2({ providerId })` replaced by `signIn.social({ provider })`
  - `oauth2.link()` replaced by `linkSocial()`
  - Callback URL changed from `/api/auth/oauth2/callback/:id` to `/api/auth/callback/:id`
  - `genericOAuthClient()` removed; generic OAuth providers now use the standard social client APIs
  - `pkce` defaults to `true` (was `false`); set `pkce: false` for providers that reject PKCE
  - `authorizationUrlParams` and `tokenUrlParams` only accept `Record<string, string>`
  - `issuer` and `requireIssuerValidation` config fields removed; issuer validation is automatic via OIDC discovery
  - `mapProfileToUser` profile typed as `OAuth2UserInfo & Record<string, unknown>`

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/electron/CHANGELOG.md)

## `@better-auth/stripe`

### ❗ Breaking Changes

- fix(stripe)!: make `onSubscriptionCancel.event` required ([#9531](https://github.com/better-auth/better-auth/pull/9531))
- fix(stripe)!: remove optional marker from onSubscriptionCancel `event` ([#9359](https://github.com/better-auth/better-auth/pull/9359))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/stripe/CHANGELOG.md)

## `@better-auth/core`

### ❗ Breaking Changes

- refactor(oauth)!: verify provider `id_tokens` with a single shared verifier ([#9828](https://github.com/better-auth/better-auth/pull/9828))

  Client-submitted id_token sign-in (`signIn.social({ idToken })` and account linking) is verified by one function instead of a per-provider `verifyIdToken` method. Each provider declares an `idToken` config with a JWKS source, issuer, and audience, and the core verifier runs the signature, issuer, audience, and nonce checks. A provider that declares no config rejects the client id_token path.

  PayPal previously accepted any decodable id_token without verifying its signature. PayPal derives identity from the access token, so it now declares no `idToken` config, and the client id_token path returns `ID_TOKEN_NOT_SUPPORTED`. PayPal sign-in through the redirect flow is unchanged.

  Custom providers that implement `UpstreamProvider` directly replace the removed `verifyIdToken` method with an `idToken` config:

  ```ts
  idToken: {
  	jwks: createRemoteJWKSet(new URL("https://issuer.example/.well-known/jwks.json")),
  	issuer: "https://issuer.example",
  	audience: clientId,
  },
  ```

  For verification that cannot use a local JWKS, pass `idToken: { verify: async (token, nonce) => boolean }`. The `verifyIdToken` and `disableIdTokenSignIn` provider options are unchanged.

### Features

- feat: add `clientAssertion` support to the Microsoft Entra ID social provider ([#9898](https://github.com/better-auth/better-auth/pull/9898))
- feat(auth): add per-provider `requireEmailVerification` for social sign-in ([#9929](https://github.com/better-auth/better-auth/pull/9929))
- feat(auth): add user.validateUserInfo provisioning gate ([#9864](https://github.com/better-auth/better-auth/pull/9864))
- feat(generic-oauth,sso): support IDP-initiated flows via secure bounce ([#9301](https://github.com/better-auth/better-auth/pull/9301))
- feat(generic-oauth): forward `refreshTokenParams` to token endpoint ([#9948](https://github.com/better-auth/better-auth/pull/9948))
- feat(google): add `includeGrantedScopes` option ([#10129](https://github.com/better-auth/better-auth/pull/10129))
- feat(oauth-provider): add DPoP support ([#10039](https://github.com/better-auth/better-auth/pull/10039))
- feat(oauth): add `private_key_jwt` client authentication (RFC 7523) ([#8836](https://github.com/better-auth/better-auth/pull/8836))
- feat(oauth): enforce no-store on credential responses via a declarative flag ([#10065](https://github.com/better-auth/better-auth/pull/10065))
- feat(oauth): per-request `additionalParams` and `loginHint` ([#9305](https://github.com/better-auth/better-auth/pull/9305))

### Bug Fixes

- fix(cimd): route `client_id` SSRF checks through the shared host classifier ([#10126](https://github.com/better-auth/better-auth/pull/10126))
- fix(oauth): derive redirect URI from per-request baseURL ([#10127](https://github.com/better-auth/better-auth/pull/10127))
- fix(oauth): preserve account.scope across re-auth and refresh ([#10128](https://github.com/better-auth/better-auth/pull/10128))
- refactor(oauth): single-source Basic credentials + getHttpTestInstance ([#9657](https://github.com/better-auth/better-auth/pull/9657))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/core/CHANGELOG.md)

## `auth`

### ❗ Breaking Changes

- feat(oauth)!: accumulate granted scopes as `grantedScopes string[]` ([#9825](https://github.com/better-auth/better-auth/pull/9825))

### Features

- feat(cli): add create-admin command ([#9547](https://github.com/better-auth/better-auth/pull/9547))

### Bug Fixes

- refactor(cli): leverage c12 v4 `resolveModule` for auth config loading ([#9477](https://github.com/better-auth/better-auth/pull/9477))
- revert(oauth): remove granted scopes architecture ([#10123](https://github.com/better-auth/better-auth/pull/10123))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/cli/CHANGELOG.md)

## `@better-auth/api-key`

### ❗ Breaking Changes

- feat(auth)!: harden atomic state transitions ([#10000](https://github.com/better-auth/better-auth/pull/10000))

### Bug Fixes

- chore: sync main to next ([#9533](https://github.com/better-auth/better-auth/pull/9533))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/api-key/CHANGELOG.md)

## `@better-auth/expo`

### ❗ Breaking Changes

- refactor(generic-oauth)!: rewrite as first-class social provider with RFC compliance ([#9069](https://github.com/better-auth/better-auth/pull/9069))

  **Breaking changes:**

  - `signIn.oauth2({ providerId })` replaced by `signIn.social({ provider })`
  - `oauth2.link()` replaced by `linkSocial()`
  - Callback URL changed from `/api/auth/oauth2/callback/:id` to `/api/auth/callback/:id`
  - `genericOAuthClient()` removed; generic OAuth providers now use the standard social client APIs
  - `pkce` defaults to `true` (was `false`); set `pkce: false` for providers that reject PKCE
  - `authorizationUrlParams` and `tokenUrlParams` only accept `Record<string, string>`
  - `issuer` and `requireIssuerValidation` config fields removed; issuer validation is automatic via OIDC discovery
  - `mapProfileToUser` profile typed as `OAuth2UserInfo & Record<string, unknown>`

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/expo/CHANGELOG.md)

## `@better-auth/cimd` ✨

### Features

- feat(cimd): add Client ID Metadata Document plugin ([#9159](https://github.com/better-auth/better-auth/pull/9159))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/cimd/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Features

- feat(drizzle-adapter): support Drizzle Relations v2 ([#9489](https://github.com/better-auth/better-auth/pull/9489))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/i18n`

### Features

- feat(i18n): add built-in translations for 22 languages ([#9157](https://github.com/better-auth/better-auth/pull/9157))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/b7239f37defc644c6c45467aac65ae13a735c818/packages/i18n/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@adrianmxb, @app/better-release, @brentmitchell25, @bytaesu, @GautamBytes, @gustavovalverde, @ItalyPaleAle, @OscarCornish, @pi0, @ping-maxwell, @ruban-s, @sovetski, @yordis

**Full changelog:** [`v1.6.22...v1.7.0-rc.0`](https://github.com/better-auth/better-auth/compare/v1.6.22...v1.7.0-rc.0)

## v1.7.0-beta.10 (2026-06-26) canary

## `better-auth`

### Bug Fixes

- Bundled dependencies were refreshed to their latest compatible releases, including jose, nanostores, the noble crypto packages, and SimpleWebAuthn. These updates are backward compatible and require no changes to existing projects.
- Fixed rate limiting to be applied before plugin request handlers run ([#10191](https://github.com/better-auth/better-auth/pull/10191))
- Fixed unproven credentials to be revoked when signing in via magic link or email OTP ([#10239](https://github.com/better-auth/better-auth/pull/10239))
- Fixed account-linking logs to be routed through the configured logger ([#10121](https://github.com/better-auth/better-auth/pull/10121))
- Fixed admin authorization to use authoritative session reads ([#10187](https://github.com/better-auth/better-auth/pull/10187))
- Fixed TypeScript inference errors by declaring inherited `APIError` properties ([#8734](https://github.com/better-auth/better-auth/pull/8734))
- Fixed server-side OAuth requests to no longer follow redirects ([#10241](https://github.com/better-auth/better-auth/pull/10241))
- Fixed the `schema` option in device authorization to be optional under Zod v4 ([#9939](https://github.com/better-auth/better-auth/pull/9939))
- Fixed hosted-domain validation to be applied consistently across all Google sign-in flows ([#10197](https://github.com/better-auth/better-auth/pull/10197))
- Fixed OAuth proxy to reject profile callbacks when OAuth state is missing or expired ([#10183](https://github.com/better-auth/better-auth/pull/10183))
- Fixed OAuth provider profiles to respect user input rules ([#10196](https://github.com/better-auth/better-auth/pull/10196))
- Fixed PayPal userinfo subject to be bound to the verified ID token subject ([#10192](https://github.com/better-auth/better-auth/pull/10192))
- Fixed refresh cookie `Max-Age` to be capped at the configured `expiresIn` value ([#9621](https://github.com/better-auth/better-auth/pull/9621))
- Fixed SIWE sign-in to reject when the provided email already belongs to another account ([#10228](https://github.com/better-auth/better-auth/pull/10228))
- Fixed TOTP and backup code verification to cap the number of allowed attempts ([#10210](https://github.com/better-auth/better-auth/pull/10210))
- Fixed username storage to only accept valid `displayUsername` fallbacks ([#10182](https://github.com/better-auth/better-auth/pull/10182))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/better-auth/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed SSO provider deletion to also remove associated linked account rows ([#10224](https://github.com/better-auth/better-auth/pull/10224))
- Fixed SSO provider domain verification to require DNS proof for every listed domain ([#10227](https://github.com/better-auth/better-auth/pull/10227))
- Fixed SAML SLO POST form action to be restricted to `http` and `https` schemes ([#10225](https://github.com/better-auth/better-auth/pull/10225))
- Fixed SAML response binding to be validated against the Service Provider configuration ([#10226](https://github.com/better-auth/better-auth/pull/10226))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/sso/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed `disableMigration` to be honored for plugin schema tables ([#10198](https://github.com/better-auth/better-auth/pull/10198))
- Fixed generated `BETTER_AUTH_SECRET` to use 32 characters instead of 16 ([#10186](https://github.com/better-auth/better-auth/pull/10186))
- Fixed two-factor verification to enforce account-level lockout after repeated failed attempts ([#10240](https://github.com/better-auth/better-auth/pull/10240))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/cli/CHANGELOG.md)

## `@better-auth/api-key`

### Bug Fixes

- Fixed client IP resolution from forwarded headers to be more robust ([#10203](https://github.com/better-auth/better-auth/pull/10203))
- Refactored IP resolution logic into a shared core utility ([#10216](https://github.com/better-auth/better-auth/pull/10216))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/api-key/CHANGELOG.md)

## `@better-auth/drizzle-adapter`

### Features

- Added support for Drizzle Relations v2 via a new `@better-auth/drizzle-adapter/relations-v2` entry point ([#9489](https://github.com/better-auth/better-auth/pull/9489))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/drizzle-adapter/CHANGELOG.md)

## `@better-auth/i18n`

### Bug Fixes

- Fixed the English language fallback and updated i18n documentation ([#9872](https://github.com/better-auth/better-auth/pull/9872))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/i18n/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed the Kysely adapter to return `null` when an update matches no rows ([#10180](https://github.com/better-auth/better-auth/pull/10180))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/mcp`

### Features

- Added a `refreshTokenReuseInterval` option, defaulting to 30 seconds, so native/public clients can retry a refresh if a prior token rotation raced against it ([#10145](https://github.com/better-auth/better-auth/pull/10145))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/mcp/CHANGELOG.md)

## `@better-auth/oauth-provider`

### Features

- Added `refreshTokenReuseInterval` to allow the OAuth provider to replay refresh token responses for duplicate requests within a configurable time window ([#10145](https://github.com/better-auth/better-auth/pull/10145))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/oauth-provider/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed SCIM write operations to be properly scoped and to honor the `active` attribute ([#10242](https://github.com/better-auth/better-auth/pull/10242))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/ba52913eed6e7210808511752bf546981f6980f5/packages/scim/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@adityachaudhary99, @Bekacru, @benpsnyder, @bytaesu, @dipan-ck, @gustavovalverde, @moonevm, @Paola3stefania, @ping-maxwell, @rachit367, @sleepe229, @WilsonnnTan

**Full changelog:** [`v1.7.0-beta.9...v1.7.0-beta.10`](https://github.com/better-auth/better-auth/compare/v1.7.0-beta.9...v1.7.0-beta.10)

## v1.6.22 (2026-06-26)

## `better-auth`

### Bug Fixes

- Fixed unproven credentials not being revoked during magic link and email OTP sign-in ([#10239](https://github.com/better-auth/better-auth/pull/10239))
- Fixed server-side OAuth requests to refuse redirect responses instead of following them ([#10241](https://github.com/better-auth/better-auth/pull/10241))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/a90d061de7cdbd60e796230aadf5d1082add1fe2/packages/better-auth/CHANGELOG.md)

## `@better-auth/scim`

### Bug Fixes

- Fixed SCIM write-path operations to be properly scoped and to correctly honor the `active` attribute ([#10242](https://github.com/better-auth/better-auth/pull/10242))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/a90d061de7cdbd60e796230aadf5d1082add1fe2/packages/scim/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed organization subscription actions (cancel, upgrade, restore, and the billing portal) that could act on the wrong organization.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/a90d061de7cdbd60e796230aadf5d1082add1fe2/packages/stripe/CHANGELOG.md)

## `auth`

### Bug Fixes

- Added account-level verification lockout for two-factor authentication ([#10240](https://github.com/better-auth/better-auth/pull/10240))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/a90d061de7cdbd60e796230aadf5d1082add1fe2/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.6.21...v1.6.22`](https://github.com/better-auth/better-auth/compare/v1.6.21...v1.6.22)

## v1.6.21 (2026-06-26)

## `better-auth`

### Bug Fixes

- Fixed rate limits to be enforced before plugin request handlers run ([#10191](https://github.com/better-auth/better-auth/pull/10191))
- Fixed admin permission changes and bans to take effect immediately, even when session cookie cache is enabled ([#10187](https://github.com/better-auth/better-auth/pull/10187))
- Fixed `deviceAuthorization()` throwing a `ZodError` when called without a `schema` option under Zod v4 ([#9939](https://github.com/better-auth/better-auth/pull/9939))
- Fixed Google hosted-domain validation to apply consistently across all sign-in flows, including Google One Tap ([#10197](https://github.com/better-auth/better-auth/pull/10197))
- Fixed OAuth proxy to reject profile callbacks that do not match an issued OAuth state, preventing session creation with stale state ([#10183](https://github.com/better-auth/better-auth/pull/10183))
- Fixed OAuth sign-up and account linking to ignore provider profile values for fields marked `input: false` ([#10196](https://github.com/better-auth/better-auth/pull/10196))
- Fixed PayPal sign-in to validate user info against the verified ID token subject ([#10192](https://github.com/better-auth/better-auth/pull/10192))
- Fixed SIWE sign-in to reject emails that already belong to another account, preventing one email from being attached to two accounts ([#10228](https://github.com/better-auth/better-auth/pull/10228))
- Fixed two-factor verification to lock out after five wrong codes for TOTP and backup codes, returning `TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE` ([#10210](https://github.com/better-auth/better-auth/pull/10210))
- Fixed the username plugin to only store `displayUsername` fallbacks that pass username validation during email sign-up ([#10182](https://github.com/better-auth/better-auth/pull/10182))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/414169d95a88a6e1fac41688bc7011e96feb0d2a/packages/better-auth/CHANGELOG.md)

## `@better-auth/sso`

### Bug Fixes

- Fixed SSO provider deletion to also remove linked accounts, preventing reuse by a later provider with the same ID ([#10224](https://github.com/better-auth/better-auth/pull/10224))
- Fixed SSO domain verification to require DNS proof for every domain listed on a provider ([#10227](https://github.com/better-auth/better-auth/pull/10227))
- Fixed SAML single logout to reject IdP SLO POST URLs that use non-http(s) schemes such as `javascript:` or `data:` ([#10225](https://github.com/better-auth/better-auth/pull/10225))
- Fixed SAML SSO to reject responses whose audience, recipient, or destination does not match the configured Service Provider ([#10226](https://github.com/better-auth/better-auth/pull/10226))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/414169d95a88a6e1fac41688bc7011e96feb0d2a/packages/sso/CHANGELOG.md)

## `@better-auth/api-key`

### Bug Fixes

- Fixed client IP resolution to prevent `X-Forwarded-For` spoofing in multi-hop proxy chains ([#10203](https://github.com/better-auth/better-auth/pull/10203))
- Refactored request IP resolution into a centralized core resolver ([#10216](https://github.com/better-auth/better-auth/pull/10216))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/414169d95a88a6e1fac41688bc7011e96feb0d2a/packages/api-key/CHANGELOG.md)

## `auth`

### Bug Fixes

- Fixed `disableMigration: true` to be respected on plugin schema tables during generation and runtime migration ([#10198](https://github.com/better-auth/better-auth/pull/10198))
- Fixed the CLI to generate `BETTER_AUTH_SECRET` values with 32 characters instead of 16 ([#10186](https://github.com/better-auth/better-auth/pull/10186))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/414169d95a88a6e1fac41688bc7011e96feb0d2a/packages/cli/CHANGELOG.md)

## `@better-auth/kysely-adapter`

### Bug Fixes

- Fixed `adapter.update` to return `null` when no matching row is found ([#10180](https://github.com/better-auth/better-auth/pull/10180))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/414169d95a88a6e1fac41688bc7011e96feb0d2a/packages/kysely-adapter/CHANGELOG.md)

## `@better-auth/stripe`

### Bug Fixes

- Fixed organization subscription actions (cancel, upgrade, restore, and the billing portal) that could act on the wrong organization.

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/414169d95a88a6e1fac41688bc7011e96feb0d2a/packages/stripe/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@Bekacru, @benpsnyder, @bytaesu, @gustavovalverde, @moonevm, @Paola3stefania, @ping-maxwell, @rachit367

**Full changelog:** [`v1.6.20...v1.6.21`](https://github.com/better-auth/better-auth/compare/v1.6.20...v1.6.21)

## v1.7.0-beta.9 (2026-06-20) canary

## `@better-auth/oauth-provider`

### ❗ Breaking Changes

- Restricted `customIdTokenClaims`, extension ID-token claims, and per-issuance `idTokenClaims` from overriding protected OIDC/JWT protocol claims ([#10140](https://github.com/better-auth/better-auth/pull/10140))

> **Migration:** Remove any `iss`, `sub`, `aud`, `exp`, `nonce`, `auth_time`, `acr`, `amr`, or `azp` fields from `customIdTokenClaims`, extension ID-token claims, and per-issuance `idTokenClaims`. Use namespaced custom claims (e.g., `"https://example.com/role"`) for application-specific data instead.

### Features

- Added support for confidential DCR clients to complete authorization-code flows without PKCE when `clientRegistrationRequirePKCE: false` is set ([#10146](https://github.com/better-auth/better-auth/pull/10146))
- Added support for the `claims.userinfo` authorization request parameter, allowing clients to request specific standard claims from the UserInfo endpoint ([#10156](https://github.com/better-auth/better-auth/pull/10156))

### Bug Fixes

- Fixed the UserInfo endpoint to accept bearer tokens in `application/x-www-form-urlencoded` POST request bodies ([#10155](https://github.com/better-auth/better-auth/pull/10155))
- Fixed confidential clients that opted out of PKCE to successfully request `offline_access` when the authorization includes both `openid` scope and a `nonce` ([#10153](https://github.com/better-auth/better-auth/pull/10153))
- Fixed the OIDC authorization endpoint to accept form-encoded POST requests and return proper errors for unsupported `request` and `request_uri` parameters ([#10151](https://github.com/better-auth/better-auth/pull/10151))
- Fixed the UserInfo endpoint to correctly return `profile` and `email` scope claims, and added rejection of unsupported `acr_values` in authorization requests ([#10152](https://github.com/better-auth/better-auth/pull/10152))
- Fixed the token endpoint to only require `redirect_uri` when the original authorization request included one, and to return `invalid_grant` on mismatches ([#10159](https://github.com/better-auth/better-auth/pull/10159))
- Fixed Dynamic Client Registration to preserve client key metadata across updates ([#10144](https://github.com/better-auth/better-auth/pull/10144))
- Fixed authorization requests missing `response_type` to redirect errors to the client redirect URI instead of the provider error page ([#10149](https://github.com/better-auth/better-auth/pull/10149))
- Fixed authorization code replay to correctly return `invalid_grant` and revoke all tokens previously issued from the replayed code ([#10150](https://github.com/better-auth/better-auth/pull/10150))
- Fixed refresh token validation to return `invalid_grant` when a client attempts to use a refresh token issued to a different client ([#10154](https://github.com/better-auth/better-auth/pull/10154))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/4218161c53f050733d1cb67c608a1e6156af7bbd/packages/oauth-provider/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.7.0-beta.8...v1.7.0-beta.9`](https://github.com/better-auth/better-auth/compare/v1.7.0-beta.8...v1.7.0-beta.9)

## v1.6.20 (2026-06-20)

## `better-auth`

### Bug Fixes

- Fixed account-linking logs to route through the configured logger ([#10121](https://github.com/better-auth/better-auth/pull/10121))
- Fixed TypeScript inference errors by declaring inherited `APIError` properties ([#8734](https://github.com/better-auth/better-auth/pull/8734))
- Fixed refresh cookie `Max-Age` to be capped at `expiresIn` ([#9621](https://github.com/better-auth/better-auth/pull/9621))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c342f42fff46043b5e195f7f757b0f2c1043414c/packages/better-auth/CHANGELOG.md)

## `@better-auth/i18n`

### Bug Fixes

- Fixed English language fallback behavior and improved i18n documentation ([#9872](https://github.com/better-auth/better-auth/pull/9872))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/c342f42fff46043b5e195f7f757b0f2c1043414c/packages/i18n/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@adityachaudhary99, @dipan-ck, @sleepe229, @WilsonnnTan

**Full changelog:** [`v1.6.19...v1.6.20`](https://github.com/better-auth/better-auth/compare/v1.6.19...v1.6.20)

## v1.7.0-beta.8 (2026-06-18) canary

## `better-auth`

### Bug Fixes

- Fixed OAuth account creation to roll back the user row when account writes fail ([#10125](https://github.com/better-auth/better-auth/pull/10125))
- Fixed redirect URI derivation to use the per-request base URL in multi-host deployments ([#10127](https://github.com/better-auth/better-auth/pull/10127))
- Fixed OAuth scope preservation so previously granted scopes are not lost during re-authentication or token refresh ([#10128](https://github.com/better-auth/better-auth/pull/10128))
- Fixed user data preservation when `overrideUserInfo` returns `null` during account linking ([#10124](https://github.com/better-auth/better-auth/pull/10124))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/4d699c5fdaa4901ee96e2a3e315aa7a748b31b58/packages/better-auth/CHANGELOG.md)

## `@better-auth/core`

### Features

- Added `includeGrantedScopes` option to the Google provider to control scope accumulation across OAuth flows ([#10129](https://github.com/better-auth/better-auth/pull/10129))

### Bug Fixes

- Fixed redirect URI derivation to use the per-request base URL in multi-host deployments ([#10127](https://github.com/better-auth/better-auth/pull/10127))
- Fixed OAuth scope preservation so previously granted scopes are not lost during re-authentication or token refresh ([#10128](https://github.com/better-auth/better-auth/pull/10128))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/4d699c5fdaa4901ee96e2a3e315aa7a748b31b58/packages/core/CHANGELOG.md)

## `auth`

### Bug Fixes

- Reverted the granted scopes OAuth architecture ([#10123](https://github.com/better-auth/better-auth/pull/10123))

For detailed changes, see [`CHANGELOG`](https://github.com/better-auth/better-auth/blob/4d699c5fdaa4901ee96e2a3e315aa7a748b31b58/packages/cli/CHANGELOG.md)

## Contributors

Thanks to everyone who contributed to this release:

@gustavovalverde

**Full changelog:** [`v1.7.0-beta.7...v1.7.0-beta.8`](https://github.com/better-auth/better-auth/compare/v1.7.0-beta.7...v1.7.0-beta.8)
