// SPDX-License-Identifier: Apache-2.0
/**
 * Banc headless sur sites réels : base agent-browser 0.42.0 (« before ») contre base + profil
 * (profiles/headless.json, « after »). Chrome jetable par tour (profil neuf = démarrage à froid),
 * sites visités en série dans un onglet comme un agent. Mesures : démarrage (DevToolsActivePort),
 * chargement (Page.navigate -> load), statut HTTP du document, RAM (Windows : octets privés ;
 * Linux : PSS) après chaque site, nombre de processus, WebGL.
 *
 *   bun src/benchmarks/headless-sites.ts [--variants "before;after;after-BackForwardCache;before+--disable-gpu"] [--runs 3] [--bin PATH] [--out f.json]
 */
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { hostname, tmpdir } from "node:os";
import { join } from "node:path";
import {
  agentBrowserBaselineArgs,
  currentOs,
  type GpuMode,
  profileArgs,
} from "../browser/profile.ts";

export const SITES = [
  "https://aphrody.com/",
  "https://aphrody.app/",
  "https://api.aphrody.com/",
  "https://www.google.com/",
  "https://gemini.google.com/",
  "https://vercel.com/",
  "https://developers.cloudflare.com/",
  "https://dash.cloudflare.com/",
];

const os = currentOs();

/** before | after | after-gpu-<mode>, suivis de +--arg (ajout) ou -FeatureName (retiré de --disable-features). */
function variantArgs(name: string): string[] {
  const [head, ...mods] = name.split(/(?=\+--|-[A-Z])/);
  let args: string[];
  if (head === "before") args = agentBrowserBaselineArgs();
  else {
    const m = /^after(?:-gpu-(software|hardware|off))?$/.exec(head!);
    if (!m) throw new Error(`variante inconnue : ${name}`);
    args = [
      ...agentBrowserBaselineArgs(),
      ...profileArgs(os, m[1] as GpuMode | undefined),
    ];
  }
  for (const mod of mods) {
    if (mod.startsWith("+")) args.push(mod.slice(1));
    else {
      const feat = mod.slice(1);
      args = args.map((a) =>
        a.startsWith("--disable-features=")
          ? `--disable-features=${a
              .slice(19)
              .split(",")
              .filter((f) => f !== feat)
              .join(",")}`
          : a,
      );
    }
  }
  return args;
}

// --- mémoire par processus ---------------------------------------------------------------
type MemFn = (pid: number) => number | null;
async function memFn(): Promise<MemFn> {
  if (os === "linux") {
    return (pid) => {
      try {
        const t = readFileSync(`/proc/${pid}/smaps_rollup`, "utf8");
        const kb = /^Pss:\s+(\d+) kB/m.exec(t)?.[1];
        return kb ? Number(kb) * 1024 : null;
      } catch {
        return null;
      }
    };
  }
  const { dlopen, FFIType, ptr } = await import("bun:ffi");
  const k32 = dlopen("kernel32.dll", {
    OpenProcess: {
      args: [FFIType.u32, FFIType.i32, FFIType.u32],
      returns: FFIType.ptr,
    },
    CloseHandle: { args: [FFIType.ptr], returns: FFIType.i32 },
    K32GetProcessMemoryInfo: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.u32],
      returns: FFIType.i32,
    },
  });
  // PROCESS_MEMORY_COUNTERS_EX (x64, cb = 80) : PrivateUsage à l'octet 72.
  return (pid) => {
    const h = k32.symbols.OpenProcess(0x1000, 0, pid);
    if (!h) return null;
    const buf = new BigUint64Array(10);
    new Uint32Array(buf.buffer)[0] = 80;
    const ok = k32.symbols.K32GetProcessMemoryInfo(h, ptr(buf), 80);
    k32.symbols.CloseHandle(h);
    return ok ? Number(buf[9]) : null;
  };
}

// --- CDP minimal ---------------------------------------------------------------------------
class Cdp {
  private id = 0;
  private pending = new Map<
    number,
    { res: (v: any) => void; rej: (e: Error) => void }
  >();
  private listeners = new Set<(m: any) => void>();
  constructor(private ws: WebSocket) {
    ws.onmessage = (ev) => {
      const m = JSON.parse(String(ev.data));
      if (m.id !== undefined) {
        const p = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) p?.rej(new Error(m.error.message));
        else p?.res(m.result);
      } else for (const l of this.listeners) l(m);
    };
  }
  send(
    method: string,
    params: object = {},
    sessionId?: string,
    timeoutMs = 30_000,
  ): Promise<any> {
    const id = ++this.id;
    return new Promise((res, rej) => {
      const t = setTimeout(() => {
        this.pending.delete(id);
        rej(new Error(`timeout ${method}`));
      }, timeoutMs);
      this.pending.set(id, {
        res: (v) => (clearTimeout(t), res(v)),
        rej: (e) => (clearTimeout(t), rej(e)),
      });
      this.ws.send(
        JSON.stringify({
          id,
          method,
          params,
          ...(sessionId ? { sessionId } : {}),
        }),
      );
    });
  }
  on(fn: (m: any) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  close() {
    this.ws.close();
  }
}

const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

interface SiteResult {
  url: string;
  ok: boolean;
  status: number | null;
  loadMs: number | null;
  title: string;
  ramMB: number;
  procs: number;
  error?: string;
}
interface RunResult {
  variant: string;
  startupMs: number;
  webgl: boolean | null;
  sites: SiteResult[];
  finalRamMB: number;
  finalProcs: number;
}

async function run(
  bin: string,
  variant: string,
  mem: MemFn,
): Promise<RunResult> {
  const udd = mkdtempSync(join(tmpdir(), "headless-bench-"));
  const t0 = performance.now();
  const proc = Bun.spawn(
    [
      bin,
      ...variantArgs(variant),
      "--remote-debugging-port=0",
      `--user-data-dir=${udd}`,
      "about:blank",
    ],
    { stdout: "ignore", stderr: "ignore" },
  );
  const portFile = join(udd, "DevToolsActivePort");
  let portTxt = "";
  // Chrome écrit le fichier pendant la lecture (EBUSY sous Windows) : réessayer.
  while (!portTxt.includes("\n")) {
    if (performance.now() - t0 > 30_000)
      throw new Error("DevToolsActivePort absent après 30 s");
    try {
      if (existsSync(portFile)) portTxt = readFileSync(portFile, "utf8");
    } catch {}
    if (!portTxt.includes("\n")) await Bun.sleep(10);
  }
  const startupMs = performance.now() - t0;
  const [port, path] = portTxt.trim().split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${port}${path}`);
  await new Promise((r, j) => ((ws.onopen = r), (ws.onerror = j)));
  const cdp = new Cdp(ws);
  const info = await cdp.send("SystemInfo.getProcessInfo");
  const browserPid: number =
    info.processInfo.find((p: any) => p.type === "browser")?.id ?? proc.pid;
  const memory = async () => {
    const r = await cdp.send("SystemInfo.getProcessInfo");
    let total = 0;
    for (const p of r.processInfo) total += mem(p.id) ?? 0;
    return {
      ramMB: Math.round(total / 1048576),
      procs: r.processInfo.length as number,
    };
  };

  const { targetId } = await cdp.send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await cdp.send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  await cdp.send("Page.enable", {}, sessionId);
  await cdp.send("Network.enable", {}, sessionId);
  const sites: SiteResult[] = [];
  for (const url of SITES) {
    let status: number | null = null;
    let loaded!: () => void;
    const loadP = new Promise<void>((r) => (loaded = r));
    const off = cdp.on((m) => {
      if (m.sessionId !== sessionId) return;
      if (
        m.method === "Network.responseReceived" &&
        m.params.type === "Document" &&
        status === null
      )
        status = m.params.response.status;
      if (m.method === "Page.loadEventFired") loaded();
    });
    const t = performance.now();
    let error: string | undefined;
    let loadMs: number | null = null;
    try {
      const nav = await cdp.send("Page.navigate", { url }, sessionId);
      if (nav.errorText) error = nav.errorText;
      else {
        const done = await Promise.race([
          loadP.then(() => true),
          Bun.sleep(30_000).then(() => false),
        ]);
        if (done) loadMs = Math.round(performance.now() - t);
        else error = "load > 30 s";
      }
    } catch (e) {
      error = String(e);
    }
    off();
    let title = "";
    try {
      title =
        (
          await cdp.send(
            "Runtime.evaluate",
            { expression: "document.title", returnByValue: true },
            sessionId,
          )
        ).result.value ?? "";
    } catch {}
    const m = await memory();
    sites.push({
      url,
      ok: !error && status !== null && status < 400,
      status,
      loadMs,
      title: title.slice(0, 60),
      ...m,
      ...(error ? { error } : {}),
    });
  }
  let webgl: boolean | null = null;
  try {
    webgl = (
      await cdp.send(
        "Runtime.evaluate",
        {
          expression: "!!document.createElement('canvas').getContext('webgl2')",
          returnByValue: true,
        },
        sessionId,
      )
    ).result.value;
  } catch {}
  const fin = await memory();
  try {
    await cdp.send("Browser.close", {}, undefined, 5_000);
  } catch {}
  cdp.close();
  for (let i = 0; i < 50 && alive(browserPid); i++) await Bun.sleep(100);
  if (alive(browserPid))
    try {
      process.kill(browserPid, 9);
    } catch {}
  for (let i = 0; i < 20; i++) {
    try {
      rmSync(udd, { recursive: true, force: true });
      break;
    } catch {
      await Bun.sleep(250);
    }
  }
  return {
    variant,
    startupMs: Math.round(startupMs),
    webgl,
    sites,
    finalRamMB: fin.ramMB,
    finalProcs: fin.procs,
  };
}

const median = (a: number[]) => {
  const s = a.filter((x) => Number.isFinite(x)).sort((x, y) => x - y);
  return s.length ? s[s.length >> 1] : NaN;
};

export function summarize(runs: RunResult[]) {
  const variants = [...new Set(runs.map((r) => r.variant))];
  return variants.map((v) => {
    const rs = runs.filter((r) => r.variant === v);
    return {
      variant: v,
      runs: rs.length,
      startupMs: median(rs.map((r) => r.startupMs)),
      finalRamMB: median(rs.map((r) => r.finalRamMB)),
      peakRamMB: median(
        rs.map((r) => Math.max(...r.sites.map((s) => s.ramMB))),
      ),
      finalProcs: median(rs.map((r) => r.finalProcs)),
      webgl: rs.every((r) => r.webgl),
      success: `${rs.flatMap((r) => r.sites).filter((s) => s.ok).length}/${rs.length * SITES.length}`,
      sites: SITES.map((url) => {
        const ss = rs.map((r) => r.sites.find((s) => s.url === url)!);
        return {
          url,
          loadMs: median(ss.map((s) => s.loadMs ?? NaN)),
          ok: `${ss.filter((s) => s.ok).length}/${ss.length}`,
          status: [...new Set(ss.map((s) => s.status))].join("/"),
          title: ss[0]?.title ?? "",
        };
      }),
    };
  });
}

if (import.meta.main) {
  const argv = process.argv.slice(2);
  const get = (n: string) => {
    const i = argv.indexOf(n);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const variants = (get("--variants") ?? "before;after").split(";");
  const runsN = Number(get("--runs") ?? "3");
  const bin =
    get("--bin") ??
    (os === "win"
      ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
      : "/usr/bin/google-chrome");
  const mem = await memFn();
  const runs: RunResult[] = [];
  // Variantes entrelacées (A, B, A, B, ...) : le bruit de la machine se répartit.
  for (let i = 0; i < runsN; i++) {
    for (const v of variants) {
      const r = await run(bin, v, mem);
      runs.push(r);
      console.error(
        `${v} #${i + 1} : démarrage ${r.startupMs} ms, RAM ${r.finalRamMB} Mo, ${r.sites.filter((s) => s.ok).length}/${SITES.length} ok`,
      );
    }
  }
  const report = {
    host: hostname(),
    os,
    bin,
    date: new Date().toISOString(),
    summary: summarize(runs),
    runs,
  };
  const out = get("--out");
  if (out) writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report.summary, null, 2));
}
