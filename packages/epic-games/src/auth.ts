// SPDX-License-Identifier: Apache-2.0
// Pure-Bun Epic Games Store & EOS OAuth2 Authentication Primitives

export interface EpicOAuthToken {
  access_token: string;
  expires_in: number;
  expires_at: string;
  token_type: string;
  refresh_token?: string;
  account_id: string;
  client_id: string;
}

export const EPIC_AUTH_URL =
  "https://account-public-service-prod03.ol.epicgames.com/account/api/oauth/token";
export const EPIC_LAUNCHER_CLIENT_ID = "34a02cf8f4414e29b15921876da3abc9";
export const EPIC_LAUNCHER_SECRET = "daafbccc7377450399f881958042b885";

/**
 * Generate HTTP Basic Auth header for Epic Games API
 */
export function getEpicBasicAuth(
  clientId = EPIC_LAUNCHER_CLIENT_ID,
  secret = EPIC_LAUNCHER_SECRET,
): string {
  const credentials = `${clientId}:${secret}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

/**
 * Exchange an Epic Games authorization code or exchange code for an OAuth2 token
 */
export async function exchangeEpicCode(
  code: string,
  isExchangeCode = true,
): Promise<EpicOAuthToken> {
  const grantType = isExchangeCode ? "exchange_code" : "authorization_code";
  const paramName = isExchangeCode ? "exchange_code" : "code";

  const body = new URLSearchParams();
  body.set("grant_type", grantType);
  body.set(paramName, code);

  const res = await fetch(EPIC_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getEpicBasicAuth(),
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Epic OAuth token exchange failed (${res.status}): ${errorText}`,
    );
  }

  return (await res.json()) as EpicOAuthToken;
}
