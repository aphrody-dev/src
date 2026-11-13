// bun:ffi bridge to crates/net (cdylib aphrody_net). Library path: APHRODY_NET_LIB,
// else target/release next to the repo root.
import { dlopen, FFIType, CString, type Pointer } from "bun:ffi";
import { join } from "node:path";

export interface Trace {
  url: string;
  host: string;
  port: number;
  dns_path: string;
  addrs: string[];
  peer: string;
  dns_ms: number;
  connect_ms: number;
  tls_ms: number;
  ttfb_ms: number;
  total_ms: number;
  alpn: string | null;
  tls_version: string | null;
  cipher: string | null;
  cert_chain_len: number;
  status: number | null;
  alt_svc: string | null;
  server: string | null;
}

const libName =
  process.platform === "win32"
    ? "aphrody_net.dll"
    : process.platform === "darwin"
      ? "libaphrody_net.dylib"
      : "libaphrody_net.so";

let lib: ReturnType<typeof open> | undefined;
function open() {
  const path =
    process.env.APHRODY_NET_LIB ??
    join(import.meta.dir, "../../../target/release", libName);
  return dlopen(path, {
    aphrody_net_probe_json: {
      args: [FFIType.cstring, FFIType.cstring],
      returns: FFIType.ptr,
    },
    aphrody_net_free: { args: [FFIType.ptr], returns: FFIType.void },
  });
}

/** Blocking probe (runs on the calling thread; wrap in a Worker for concurrency). */
export interface ProbeOpts {
  dns?: "system" | "doh";
  proto?: "tcp" | "h3";
}

/** https:// = HTTP probe, wss:// = WebSocket upgrade probe. */
export function probe(url: string, opts: ProbeOpts = {}): Trace {
  lib ??= open();
  const p = lib.symbols.aphrody_net_probe_json(
    Buffer.from(url + "\0"),
    Buffer.from(JSON.stringify(opts) + "\0"),
  ) as Pointer;
  try {
    const r = JSON.parse(new CString(p).toString());
    if (!r.ok) throw new Error(`net probe: ${r.error}`);
    return r.trace as Trace;
  } finally {
    lib.symbols.aphrody_net_free(p);
  }
}

if (import.meta.main) {
  const url = Bun.argv[2] ?? "https://gemini.google.com/";
  console.log(JSON.stringify(probe(url), null, 2));
}
