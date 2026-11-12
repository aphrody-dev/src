/**
 * First-party GA4 relay served at /g/collect.
 * The browser sends measurement hits to our own origin; the server forwards
 * them to Google Analytics and answers 204 immediately (non-blocking).
 * It is not an open relay: only hits whose tid equals the configured
 * measurement id are forwarded, bodies are capped, and nothing is forwarded
 * when no id is configured.
 */

export const GA_COLLECT_ENDPOINT = "https://www.google-analytics.com/g/collect";
export const MAX_RELAY_BODY_BYTES = 8192;

export interface RelayOptions {
  ga4?: string;
  fetchImpl?: typeof fetch;
  endpoint?: string;
}

function noContent(state: string): Response {
  return new Response(null, {
    status: 204,
    headers: { "Cache-Control": "no-store", "X-Aphrody-Relay": state },
  });
}

export async function handleCollect(
  req: Request,
  opts: RelayOptions,
): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { Allow: "GET, POST, OPTIONS", "Cache-Control": "no-store" },
    });
  }
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, POST, OPTIONS" },
    });
  }
  if (!opts.ga4) return noContent("disabled");

  const url = new URL(req.url);
  const body =
    req.method === "POST" ? new Uint8Array(await req.arrayBuffer()) : undefined;
  if (body && body.byteLength > MAX_RELAY_BODY_BYTES) {
    return new Response("Payload Too Large", { status: 413 });
  }
  const tid =
    url.searchParams.get("tid") ||
    new URLSearchParams(body ? new TextDecoder().decode(body) : "").get("tid");
  if (tid !== opts.ga4) {
    return new Response("Bad Request", {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const f = opts.fetchImpl || fetch;
  const target = `${opts.endpoint || GA_COLLECT_ENDPOINT}${url.search}`;
  const headers: Record<string, string> = {
    "Content-Type":
      req.headers.get("content-type") || "text/plain;charset=UTF-8",
  };
  const ua = req.headers.get("user-agent");
  if (ua) headers["User-Agent"] = ua;
  try {
    void Promise.resolve(
      f(target, { method: req.method, headers, body }),
    ).catch(() => {});
  } catch {
    /* forwarding failures must never affect the visitor */
  }
  return noContent("forwarded");
}
