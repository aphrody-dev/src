export interface PortlessServiceRoute {
  service: string;
  hostname: string;
  targetPort: number;
  workspacePath: string;
  protocol: "http" | "https";
  worktreePrefix?: string;
}

export interface PortlessRouterBenchmarkResult {
  registeredRoutes: number;
  lookupIterations: number;
  lookupAvgMicroseconds: number;
  lookupOpsPerSec: number;
  httpRoundtripRequests: number;
  httpAvgLatencyMicroseconds: number;
  httpRequestsPerSec: number;
  zeroCollisions: boolean;
}

export const SOVEREIGN_CORE_SERVICES: ReadonlyArray<{
  service: string;
  workspacePath: string;
  preferredPort?: number;
}> = [
  { service: "aphrody", workspacePath: "C:\\src\\aphrody" },
  { service: "shenron", workspacePath: "C:\\src\\shenron" },
  { service: "rosegriffon", workspacePath: "C:\\src\\rosegriffon" },
  { service: "pi-opencode", workspacePath: "C:\\src\\pi-opencode" },
  { service: "ring3", workspacePath: "C:\\src\\ring3-agent" },
  { service: "design", workspacePath: "C:\\src\\google-design" },
] as const;

const PORT_RANGE_START = 4000;
const PORT_RANGE_SIZE = 1000; // 4000..4999 matching vercel-labs/portless range, but deterministic & collision-free

/**
 * Deterministic FNV-1a 32-bit slot hash with linear probing in [4000, 4999]
 * so every named `<service>.localhost` (and `<worktree>.<service>.localhost`)
 * gets a stable, repeatable port across restarts without stateful daemon race conditions.
 */
export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export class PortlessRouterRegistry {
  private readonly byHostname = new Map<string, PortlessServiceRoute>();
  private readonly usedPorts = new Set<number>();

  constructor(seedDefaults = true) {
    if (seedDefaults) {
      for (const item of SOVEREIGN_CORE_SERVICES) {
        this.registerService(item.service, item.workspacePath);
      }
    }
  }

  registerService(
    service: string,
    workspacePath: string,
    options: {
      worktreePrefix?: string;
      explicitPort?: number;
      protocol?: "http" | "https";
    } = {},
  ): PortlessServiceRoute {
    const cleanService = service
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-");
    const cleanPrefix = options.worktreePrefix
      ? options.worktreePrefix
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-")
      : undefined;
    const hostname = cleanPrefix
      ? `${cleanPrefix}.${cleanService}.localhost`
      : `${cleanService}.localhost`;

    const existing = this.byHostname.get(hostname);
    if (existing) return existing;

    let port: number;
    if (
      options.explicitPort !== undefined &&
      !this.usedPorts.has(options.explicitPort)
    ) {
      port = options.explicitPort;
    } else {
      const initialSlot = fnv1a32(hostname) % PORT_RANGE_SIZE;
      let probe = 0;
      port = PORT_RANGE_START + initialSlot;
      while (this.usedPorts.has(port) && probe < PORT_RANGE_SIZE) {
        probe++;
        port = PORT_RANGE_START + ((initialSlot + probe) % PORT_RANGE_SIZE);
      }
      if (this.usedPorts.has(port)) {
        throw new Error("Exhausted deterministic port pool [4000..4999]");
      }
    }

    this.usedPorts.add(port);
    const route: PortlessServiceRoute = {
      service: cleanService,
      hostname,
      targetPort: port,
      workspacePath,
      protocol: options.protocol ?? "http",
      worktreePrefix: cleanPrefix,
    };
    this.byHostname.set(hostname, route);
    return route;
  }

  /**
   * Zero-allocation hot-path Host header resolution (`aphrody.localhost:1355` -> route).
   */
  resolveHostHeader(
    hostHeader: string | null,
  ): PortlessServiceRoute | undefined {
    if (!hostHeader) return undefined;
    const colonIdx = hostHeader.indexOf(":");
    const rawHost =
      colonIdx === -1 ? hostHeader : hostHeader.slice(0, colonIdx);
    const normalized = rawHost.toLowerCase();
    return this.byHostname.get(normalized);
  }

  listRoutes(): PortlessServiceRoute[] {
    return Array.from(this.byHostname.values()).sort((a, b) =>
      a.hostname.localeCompare(b.hostname),
    );
  }

  exportPortlessConfigJson(): {
    apps: Record<string, { name: string; port: number }>;
  } {
    const apps: Record<string, { name: string; port: number }> = {};
    for (const r of this.listRoutes()) {
      apps[r.workspacePath] = {
        name: r.hostname.replace(/\.localhost$/, ""),
        port: r.targetPort,
      };
    }
    return { apps };
  }
}

export interface RunningPortlessServer {
  server: ReturnType<typeof Bun.serve>;
  port: number;
  registry: PortlessRouterRegistry;
  stop: () => void;
}

/**
 * Starts a zero-copy `Bun.serve` reverse router compatible with `vercel-labs/portless`.
 * When `proxyUpstream` is false (diagnostic/routing mode), returns sub-millisecond route inspection JSON.
 * When `proxyUpstream` is true, streams requests directly to `http://127.0.0.1:<targetPort>` with `X-Forwarded-*` headers.
 */
export function startPortlessRouterServer(
  options: {
    port?: number;
    registry?: PortlessRouterRegistry;
    proxyUpstream?: boolean;
  } = {},
): RunningPortlessServer {
  const registry = options.registry ?? new PortlessRouterRegistry(true);
  const proxyUpstream = options.proxyUpstream ?? true;

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: options.port ?? 0,
    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      if (url.pathname === "/_portless/routes") {
        return Response.json({
          router: "sovereign-portless-bun-v1.4.4",
          routes: registry.listRoutes(),
        });
      }

      const host =
        req.headers.get("x-portless-host") ?? req.headers.get("host");
      const route = registry.resolveHostHeader(host);
      if (!route) {
        return Response.json(
          {
            error: "Unknown .localhost service route",
            host,
            available: registry.listRoutes().map((r) => r.hostname),
          },
          { status: 404 },
        );
      }

      if (!proxyUpstream) {
        return Response.json({
          routed: true,
          service: route.service,
          hostname: route.hostname,
          targetPort: route.targetPort,
          pathname: url.pathname,
        });
      }

      const upstreamUrl = `${route.protocol}://127.0.0.1:${route.targetPort}${url.pathname}${url.search}`;
      const headers = new Headers(req.headers);
      headers.set("x-forwarded-host", route.hostname);
      headers.set("x-forwarded-proto", route.protocol);

      return fetch(upstreamUrl, {
        method: req.method,
        headers,
        body: req.body,
        redirect: "manual",
      });
    },
  });

  return {
    server,
    port: server.port ?? options.port ?? 0,
    registry,
    stop: () => server.stop(true),
  };
}

export async function benchmarkPortlessRouter(
  lookupIterations = 500_000,
  httpRequests = 400,
): Promise<PortlessRouterBenchmarkResult> {
  const registry = new PortlessRouterRegistry(true);
  // Also register worktree subdomains (`symphony-1.pi-opencode.localhost`, `ralph-verify.aphrody.localhost`)
  registry.registerService("pi-opencode", "C:\\src\\pi-opencode", {
    worktreePrefix: "symphony-1",
  });
  registry.registerService("aphrody", "C:\\src\\aphrody", {
    worktreePrefix: "ralph-verify",
  });

  const routes = registry.listRoutes();
  const uniquePorts = new Set(routes.map((r) => r.targetPort));
  const zeroCollisions = uniquePorts.size === routes.length;

  const hostSamples = [
    "aphrody.localhost:1355",
    "shenron.localhost:1355",
    "rosegriffon.localhost",
    "pi-opencode.localhost:443",
    "ring3.localhost",
    "design.localhost:8080",
    "symphony-1.pi-opencode.localhost",
    "ralph-verify.aphrody.localhost",
  ];

  // Warmup
  for (let i = 0; i < 2000; i++) {
    registry.resolveHostHeader(hostSamples[i & 7]!);
  }

  const tLookup0 = Bun.nanoseconds();
  let portAcc = 0;
  for (let i = 0; i < lookupIterations; i++) {
    const matched = registry.resolveHostHeader(hostSamples[i & 7]!);
    if (matched) portAcc += matched.targetPort;
  }
  const lookupNs = Bun.nanoseconds() - tLookup0;
  if (portAcc === 0) throw new Error("Expected resolved ports");

  const lookupAvgMicroseconds = Number(
    (lookupNs / lookupIterations / 1000).toFixed(4),
  );
  const lookupOpsPerSec = Math.round(lookupIterations / (lookupNs / 1e9));

  // Spin up an ephemeral upstream backend + ephemeral portless reverse router to measure real end-to-end zero-copy HTTP proxy overhead
  const upstream = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(req: Request) {
      return new Response("ok", {
        headers: {
          "content-type": "text/plain",
          "x-echo-host": req.headers.get("x-forwarded-host") ?? "",
        },
      });
    },
  });

  const liveRegistry = new PortlessRouterRegistry(false);
  liveRegistry.registerService("aphrody", "C:\\src\\aphrody", {
    explicitPort: upstream.port,
  });
  for (const svc of SOVEREIGN_CORE_SERVICES.slice(1)) {
    liveRegistry.registerService(svc.service, svc.workspacePath);
  }

  const router = startPortlessRouterServer({
    port: 0,
    registry: liveRegistry,
    proxyUpstream: true,
  });

  try {
    const targetUrl = `http://127.0.0.1:${router.port}/ok`;
    for (let i = 0; i < 20; i++) {
      const res = await fetch(targetUrl, {
        headers: { "x-portless-host": "aphrody.localhost" },
      });
      await res.text();
    }

    const tHttp0 = Bun.nanoseconds();
    for (let i = 0; i < httpRequests; i++) {
      const res = await fetch(targetUrl, {
        headers: { "x-portless-host": "aphrody.localhost" },
      });
      await res.arrayBuffer();
    }
    const httpNs = Bun.nanoseconds() - tHttp0;
    const httpAvgLatencyMicroseconds = Number(
      (httpNs / httpRequests / 1000).toFixed(2),
    );
    const httpRequestsPerSec = Math.round(httpRequests / (httpNs / 1e9));

    return {
      registeredRoutes: routes.length,
      lookupIterations,
      lookupAvgMicroseconds,
      lookupOpsPerSec,
      httpRoundtripRequests: httpRequests,
      httpAvgLatencyMicroseconds,
      httpRequestsPerSec,
      zeroCollisions,
    };
  } finally {
    router.stop();
    upstream.stop(true);
  }
}
