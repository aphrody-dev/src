// Minimal CDP client for an already running, logged-in Chrome (owner profile or
// APHRODY_CHROME_PROFILE launched with --remote-debugging-port). No cookie or token
// ever leaves the browser: we only read Network events and DOM booleans.
export interface ChromeNet {
  url: string; protocol?: string; remoteIP?: string; tls?: string; cipher?: string;
  dns_ms?: number; connect_ms?: number; tls_ms?: number; ttfb_ms?: number;
}

export async function openPage(cdpHttp: string, url: string) {
  const t = await (await fetch(`${cdpHttp}/json/new?${encodeURIComponent(url)}`, { method: "PUT" })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map<number, (v: any) => void>();
  const events: { method: string; params: any }[] = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(String(m.data));
    if (d.id && pending.has(d.id)) { pending.get(d.id)!(d.result ?? d.error); pending.delete(d.id); }
    else if (d.method) events.push(d);
  };
  const send = (method: string, params: object = {}) =>
    new Promise<any>((r) => { pending.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
  const evaluate = async (expr: string) =>
    (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true }))?.result?.value;
  const close = async () => { ws.close(); await fetch(`${cdpHttp}/json/close/${t.id}`); };
  return { send, evaluate, events, close };
}

/** Map a CDP Network.responseReceived to the same fields as crates/net Trace. */
export function fromResponse(p: any): ChromeNet {
  const r = p.response, tm = r.timing, s = r.securityDetails;
  const span = (a: number, b: number) => (a >= 0 && b >= 0 ? b - a : undefined);
  return {
    url: r.url, protocol: r.protocol, remoteIP: r.remoteIPAddress,
    tls: s?.protocol, cipher: s?.cipher,
    dns_ms: tm && span(tm.dnsStart, tm.dnsEnd),
    connect_ms: tm && span(tm.connectStart, tm.sslStart >= 0 ? tm.sslStart : tm.connectEnd),
    tls_ms: tm && span(tm.sslStart, tm.sslEnd),
    ttfb_ms: tm && span(tm.sendEnd, tm.receiveHeadersStart ?? tm.receiveHeadersEnd),
  };
}
