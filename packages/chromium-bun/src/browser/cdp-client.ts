// SPDX-License-Identifier: Apache-2.0
/**
 * Pure Bun v1.4.4 Chrome DevTools Protocol (CDP) WebSocket + HTTP Client
 * Zero external dependencies — native WebSocket, fetch, and AsyncDisposable.
 */

export interface CdpVersionInfo {
  Browser: string;
  "Protocol-Version": string;
  "User-Agent": string;
  "V8-Version"?: string;
  webSocketDebuggerUrl: string;
}

export interface CdpTargetInfo {
  targetId: string;
  type: string;
  title: string;
  url: string;
  attached?: boolean;
  webSocketDebuggerUrl?: string;
}

export interface CdpClientOptions {
  endpoint: string;
  token?: string;
  sessionId?: string;
  timeoutMs?: number;
}

export interface NavigateResult {
  frameId: string;
  loaderId?: string;
  errorText?: string;
}

export interface ScreenshotOptions {
  format?: "png" | "jpeg" | "webp";
  quality?: number;
  captureBeyondViewport?: boolean;
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale?: number;
  };
}

export interface RealWebVitals {
  ttfbMs: number;
  fcpMs: number;
  lcpMs: number;
  cls: number;
  domContentLoadedMs: number;
  loadMs: number;
}

interface CdpRequest {
  id: number;
  method: string;
  params: Record<string, unknown>;
  sessionId?: string;
}

interface CdpResponse {
  id?: number;
  result?: Record<string, unknown>;
  error?: { code: number; message: string };
  method?: string;
  params?: Record<string, unknown>;
  sessionId?: string;
}

interface PendingCommand {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

export function normalizeCdpHttpUrl(endpoint: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, "");
  if (/^wss?:\/\//i.test(trimmed)) {
    const u = new URL(trimmed);
    const proto = u.protocol === "wss:" ? "https:" : "http:";
    return `${proto}//${u.host}`;
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `http://${trimmed}`;
}

export function normalizeCdpWebSocketUrl(endpoint: string): string {
  const trimmed = endpoint.trim();
  if (/^wss?:\/\//i.test(trimmed)) return trimmed;
  const u = new URL(normalizeCdpHttpUrl(trimmed));
  const proto = u.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${u.host}${u.pathname === "/" ? "/devtools/browser" : u.pathname}`;
}

export class ChromiumBunCdpClient implements AsyncDisposable {
  readonly wsUrl: string;
  readonly httpUrl: string;
  private readonly token?: string;
  private readonly timeoutMs: number;
  private ws: WebSocket | null = null;
  private nextId = 1;
  private sessionId?: string;
  private readonly pending = new Map<number, PendingCommand>();
  private readonly listeners = new Map<
    string,
    Set<(params: Record<string, unknown>, sessionId?: string) => void>
  >();

  constructor(options: CdpClientOptions) {
    this.wsUrl = normalizeCdpWebSocketUrl(options.endpoint);
    this.httpUrl = normalizeCdpHttpUrl(options.endpoint);
    this.token = options.token;
    this.sessionId = options.sessionId;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  static async connect(
    options: CdpClientOptions,
  ): Promise<ChromiumBunCdpClient> {
    let endpoint = options.endpoint;
    if (!/^wss?:\/\//i.test(endpoint)) {
      const httpUrl = normalizeCdpHttpUrl(endpoint);
      const response = await fetch(`${httpUrl}/json/version`, {
        headers: options.token
          ? { Authorization: `Bearer ${options.token}` }
          : {},
        signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
      });
      if (!response.ok) {
        throw new Error(
          `CDP version endpoint HTTP ${response.status}: ${httpUrl}/json/version`,
        );
      }
      const info = (await response.json()) as Partial<CdpVersionInfo>;
      if (
        typeof info.webSocketDebuggerUrl !== "string" ||
        !/^wss?:\/\//i.test(info.webSocketDebuggerUrl)
      ) {
        throw new Error(
          `Invalid webSocketDebuggerUrl from ${httpUrl}/json/version`,
        );
      }
      endpoint = info.webSocketDebuggerUrl;
    }
    const client = new ChromiumBunCdpClient({ ...options, endpoint });
    await client.open();
    return client;
  }

  async open(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(this.wsUrl);
      const cleanup = () => {
        ws.removeEventListener("open", onOpen);
        ws.removeEventListener("error", onError);
      };
      const onOpen = () => {
        cleanup();
        this.ws = ws;
        this.bindSocket(ws);
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Failed to connect to CDP WebSocket: ${this.wsUrl}`));
      };
      ws.addEventListener("open", onOpen);
      ws.addEventListener("error", onError);
    });
  }

  private bindSocket(ws: WebSocket): void {
    ws.addEventListener("message", (event) => {
      const raw =
        typeof event.data === "string" ? event.data : String(event.data);
      let msg: CdpResponse;
      try {
        msg = JSON.parse(raw) as CdpResponse;
      } catch {
        return;
      }

      if (typeof msg.id === "number") {
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        this.pending.delete(msg.id);
        clearTimeout(pending.timer);
        if (msg.error) {
          pending.reject(
            new Error(`CDP Error (${msg.error.code}): ${msg.error.message}`),
          );
        } else {
          pending.resolve(msg.result ?? {});
        }
        return;
      }

      if (typeof msg.method === "string") {
        const handlers = this.listeners.get(msg.method);
        if (handlers) {
          for (const handler of handlers) {
            handler(msg.params ?? {}, msg.sessionId);
          }
        }
      }
    });

    ws.addEventListener("close", () => {
      for (const [id, pending] of this.pending.entries()) {
        clearTimeout(pending.timer);
        pending.reject(
          new Error(`CDP WebSocket closed while awaiting command ${id}`),
        );
      }
      this.pending.clear();
    });
  }

  on(
    event: string,
    handler: (params: Record<string, unknown>, sessionId?: string) => void,
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
    return () => set?.delete(handler);
  }

  async send<TResult = Record<string, unknown>>(
    method: string,
    params: Record<string, unknown> = {},
    sessionIdOverride?: string,
  ): Promise<TResult> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.open();
    }
    const id = this.nextId++;
    const sid = sessionIdOverride ?? this.sessionId;
    const payload: CdpRequest = sid
      ? { id, method, params, sessionId: sid }
      : { id, method, params };

    return new Promise<TResult>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(
          new Error(
            `CDP command timed out after ${this.timeoutMs}ms: ${method}`,
          ),
        );
      }, this.timeoutMs);

      this.pending.set(id, {
        resolve: (res) => resolve(res as TResult),
        reject,
        timer,
      });
      this.ws!.send(JSON.stringify(payload));
    });
  }

  async createTarget(url = "about:blank"): Promise<string> {
    const { targetId } = await this.send<{ targetId: string }>(
      "Target.createTarget",
      { url },
    );
    return targetId;
  }

  async closeTarget(targetId: string): Promise<boolean> {
    const { success } = await this.send<{ success: boolean }>(
      "Target.closeTarget",
      { targetId },
    );
    return success;
  }

  async attachToTarget(targetId: string, flatten = true): Promise<string> {
    const { sessionId } = await this.send<{ sessionId: string }>(
      "Target.attachToTarget",
      {
        targetId,
        flatten,
      },
    );
    this.sessionId = sessionId;
    return sessionId;
  }

  async navigate(
    url: string,
    options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle0" },
  ): Promise<NavigateResult> {
    const waitUntil = options?.waitUntil ?? "load";
    const unsubscribers: Array<() => void> = [];
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let quietTimer: ReturnType<typeof setTimeout> | undefined;

    await this.send("Page.enable").catch(() => undefined);
    await this.send("Runtime.enable").catch(() => undefined);

    const lifecycle = new Promise<void>((resolve) => {
      if (waitUntil === "networkidle0") {
        void this.send("Network.enable").catch(() => undefined);
        const inflight = new Set<string>();
        let loaded = false;
        const scheduleQuiet = () => {
          if (loaded && inflight.size === 0) {
            if (quietTimer) clearTimeout(quietTimer);
            quietTimer = setTimeout(resolve, 400);
          } else if (quietTimer) {
            clearTimeout(quietTimer);
            quietTimer = undefined;
          }
        };
        unsubscribers.push(
          this.on("Network.requestWillBeSent", (p) => {
            if (typeof p.requestId === "string") inflight.add(p.requestId);
            scheduleQuiet();
          }),
        );
        for (const ev of ["Network.loadingFinished", "Network.loadingFailed"]) {
          unsubscribers.push(
            this.on(ev, (p) => {
              if (typeof p.requestId === "string") inflight.delete(p.requestId);
              scheduleQuiet();
            }),
          );
        }
        unsubscribers.push(
          this.on("Page.loadEventFired", () => {
            loaded = true;
            scheduleQuiet();
          }),
        );
      } else {
        const ev =
          waitUntil === "load"
            ? "Page.loadEventFired"
            : "Page.domContentEventFired";
        unsubscribers.push(this.on(ev, () => resolve()));
      }
      timeout = setTimeout(resolve, Math.min(this.timeoutMs, 10_000));
    });

    try {
      const result = await this.send<NavigateResult>("Page.navigate", { url });
      if (!result.errorText) await lifecycle;
      return result;
    } finally {
      for (const unsub of unsubscribers) unsub();
      if (timeout) clearTimeout(timeout);
      if (quietTimer) clearTimeout(quietTimer);
    }
  }

  async evaluate<T = unknown>(
    expression: string,
    options?: { awaitPromise?: boolean; returnByValue?: boolean },
  ): Promise<T> {
    const response = await this.send<{
      result: { type: string; value?: T; description?: string };
      exceptionDetails?: { text: string; exception?: { description?: string } };
    }>("Runtime.evaluate", {
      expression,
      awaitPromise: options?.awaitPromise ?? true,
      returnByValue: options?.returnByValue ?? true,
    });
    if (response.exceptionDetails) {
      const detail =
        response.exceptionDetails.exception?.description ??
        response.exceptionDetails.text;
      throw new Error(`Runtime.evaluate exception: ${detail}`);
    }
    return response.result.value as T;
  }

  async captureScreenshot(options?: ScreenshotOptions): Promise<Uint8Array> {
    const { data } = await this.send<{ data: string }>(
      "Page.captureScreenshot",
      {
        format: options?.format ?? "png",
        ...(options?.quality !== undefined ? { quality: options.quality } : {}),
        ...(options?.captureBeyondViewport !== undefined
          ? { captureBeyondViewport: options.captureBeyondViewport }
          : {}),
        ...(options?.clip ? { clip: options.clip } : {}),
      },
    );
    return Uint8Array.fromBase64(data);
  }

  async collectWebVitals(): Promise<RealWebVitals> {
    return this.evaluate<RealWebVitals>(`(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const paints = performance.getEntriesByType("paint");
      const fcp = paints.find((p) => p.name === "first-contentful-paint");
      const lcpEntries = performance.getEntriesByType("largest-contentful-paint");
      const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : (fcp ? fcp.startTime : 0);
      const layoutShifts = performance.getEntriesByType("layout-shift");
      let cls = 0;
      for (const s of layoutShifts) {
        if (!s.hadRecentInput) cls += s.value || 0;
      }
      return {
        ttfbMs: nav ? Math.round((nav.responseStart - nav.requestStart) * 100) / 100 : 0,
        fcpMs: fcp ? Math.round(fcp.startTime * 100) / 100 : 0,
        lcpMs: Math.round(lcp * 100) / 100,
        cls: Math.round(cls * 10000) / 10000,
        domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd * 100) / 100 : 0,
        loadMs: nav ? Math.round(nav.loadEventEnd * 100) / 100 : 0,
      };
    })()`);
  }

  async getAccessibilitySummary(): Promise<{
    totalNodes: number;
    landmarks: string[];
    headings: string[];
  }> {
    try {
      const { nodes } = await this.send<{
        nodes: Array<{ role?: { value?: string }; name?: { value?: string } }>;
      }>("Accessibility.getFullAXTree");
      const landmarks: string[] = [];
      const headings: string[] = [];
      for (const n of nodes ?? []) {
        const r = n.role?.value ?? "";
        const nm = n.name?.value ?? "";
        if (
          [
            "banner",
            "main",
            "navigation",
            "search",
            "contentinfo",
            "region",
          ].includes(r)
        ) {
          landmarks.push(nm ? `${r}:${nm}` : r);
        }
        if (r === "heading" && nm) {
          headings.push(nm);
        }
      }
      return { totalNodes: nodes?.length ?? 0, landmarks, headings };
    } catch {
      return this.evaluate(`(() => ({
        totalNodes: document.querySelectorAll("*").length,
        landmarks: ["header", "main", "nav", "footer"].filter((s) => document.querySelector(s)),
        headings: Array.from(document.querySelectorAll("h1,h2,h3")).map((el) => (el.textContent || "").trim()).filter(Boolean)
      }))()`);
    }
  }

  async close(): Promise<void> {
    if (this.ws) {
      const sock = this.ws;
      this.ws = null;
      if (
        sock.readyState === WebSocket.OPEN ||
        sock.readyState === WebSocket.CONNECTING
      ) {
        sock.close();
      }
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }
}
