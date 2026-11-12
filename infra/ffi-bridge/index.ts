/**
 * Sovereign Polyglot Native FFI Bridge (Rust <-> Bun v1.4.4 <-> Go 1.27)
 * Loads Go 1.27 `infra_go.dll`, Rust `pi_opencode_native.dll`, and Rust `agent_desktop_ffi.dll`
 * in the exact same Bun process, passing shared `Uint8Array` memory pointers zero-copy across runtimes.
 */
import { dlopen, FFIType, ptr } from "bun:ffi";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const BIN_DIR = join(homedir(), ".local", "bin");

export const GO_INFRA_DLL_PATH = join(BIN_DIR, "infra_go.dll");
export const RUST_PI_DLL_PATH = join(BIN_DIR, "pi_opencode_native.dll");
export const RUST_AGENT_DESKTOP_DLL_PATH = join(BIN_DIR, "agent_desktop_ffi.dll");

export interface DetectedProjectSpec {
  name: string;
  path: string;
  framework: string;
  runtime: string;
  entrypoint: string;
  buildCommand: string;
  artifactOut: string;
  region: string;
  targetNodes: string[];
  domains: string[];
  providers: string[];
  port: number;
  bluePort: number;
  greenPort: number;
  googleEgress: boolean;
}

export interface RustWorkspaceSnapshot {
  fileCount: number;
  totalBytes: number;
  merkleHash: string;
}

export interface PolyglotSnapshotAndDigest {
  rustSnapshot: RustWorkspaceSnapshot;
  goOciDigest: string;
  agentDesktopAbiVersion: number;
  goInfraVersion: number;
  rustCpuThreads: number;
}

function cstr(text: string): Uint8Array {
  const encoded = new TextEncoder().encode(text);
  const buf = new Uint8Array(encoded.length + 1);
  buf.set(encoded, 0);
  buf[encoded.length] = 0;
  return buf;
}

export function openPolyglotBridge() {
  if (!existsSync(GO_INFRA_DLL_PATH)) {
    throw new Error(`Missing Go C-shared DLL at ${GO_INFRA_DLL_PATH}`);
  }
  if (!existsSync(RUST_PI_DLL_PATH)) {
    throw new Error(`Missing Rust pi_opencode_native.dll at ${RUST_PI_DLL_PATH}`);
  }
  if (!existsSync(RUST_AGENT_DESKTOP_DLL_PATH)) {
    throw new Error(`Missing Rust agent_desktop_ffi.dll at ${RUST_AGENT_DESKTOP_DLL_PATH}`);
  }

  const goLib = dlopen(GO_INFRA_DLL_PATH, {
    GoInfraVersion: {
      args: [],
      returns: FFIType.i32,
    },
    GoDetectProjectJSON: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.i32],
      returns: FFIType.i32,
    },
    GoSignR2S3v4AuthHeader: {
      args: [
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.ptr,
        FFIType.i32,
      ],
      returns: FFIType.i32,
    },
    GoComputeOciDigest: {
      args: [FFIType.ptr, FFIType.i32, FFIType.ptr, FFIType.i32],
      returns: FFIType.i32,
    },
  });

  const rustPiLib = dlopen(RUST_PI_DLL_PATH, {
    pi_oc_cpu_threads: {
      args: [],
      returns: FFIType.u32,
    },
    pi_oc_is_safe_path: {
      args: [FFIType.ptr],
      returns: FFIType.u32,
    },
    pi_oc_snapshot_json: {
      args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
      returns: FFIType.u64,
    },
    pi_oc_diff_stats: {
      args: [FFIType.ptr, FFIType.ptr],
      returns: FFIType.u64,
    },
  });

  const rustDesktopLib = dlopen(RUST_AGENT_DESKTOP_DLL_PATH, {
    ad_abi_version: {
      args: [],
      returns: FFIType.u32,
    },
    ad_init: {
      args: [FFIType.u32],
      returns: FFIType.i32,
    },
  });

  return {
    goInfraVersion(): number {
      return goLib.symbols.GoInfraVersion() as number;
    },

    agentDesktopAbiVersion(): number {
      return rustDesktopLib.symbols.ad_abi_version() as number;
    },

    agentDesktopInit(expectedMajor: number): number {
      return rustDesktopLib.symbols.ad_init(expectedMajor) as number;
    },

    rustIsSafePath(candidatePath: string): boolean {
      const pBuf = cstr(candidatePath);
      return (rustPiLib.symbols.pi_oc_is_safe_path(ptr(pBuf)) as number) === 1;
    },

    goDetectProject(dirOrTarget: string): DetectedProjectSpec {
      const inBuf = cstr(dirOrTarget);
      const outBuf = new Uint8Array(8192);
      const written = goLib.symbols.GoDetectProjectJSON(
        ptr(inBuf),
        ptr(outBuf),
        outBuf.length,
      ) as number;
      if (written <= 0) {
        throw new Error(`GoDetectProjectJSON failed with code ${written}`);
      }
      const jsonText = new TextDecoder().decode(outBuf.subarray(0, written));
      return JSON.parse(jsonText) as DetectedProjectSpec;
    },

    goSignR2S3v4(params: {
      method: string;
      url: string;
      accessKey: string;
      secretKey: string;
      region?: string;
      payloadHash: string;
      isoDate: string;
    }): string {
      const m = cstr(params.method);
      const u = cstr(params.url);
      const ak = cstr(params.accessKey);
      const sk = cstr(params.secretKey);
      const reg = cstr(params.region ?? "auto");
      const ph = cstr(params.payloadHash);
      const dt = cstr(params.isoDate);
      const outBuf = new Uint8Array(2048);

      const written = goLib.symbols.GoSignR2S3v4AuthHeader(
        ptr(m),
        ptr(u),
        ptr(ak),
        ptr(sk),
        ptr(reg),
        ptr(ph),
        ptr(dt),
        ptr(outBuf),
        outBuf.length,
      ) as number;
      if (written <= 0) {
        throw new Error(`GoSignR2S3v4AuthHeader failed with code ${written}`);
      }
      return new TextDecoder().decode(outBuf.subarray(0, written));
    },

    goComputeOciDigest(buffer: Uint8Array, byteLen = buffer.byteLength): string {
      const outBuf = new Uint8Array(128);
      const safeBuf = buffer.byteLength > 0 ? buffer : new Uint8Array([0]);
      const written = goLib.symbols.GoComputeOciDigest(
        ptr(safeBuf),
        byteLen,
        ptr(outBuf),
        outBuf.length,
      ) as number;
      if (written <= 0) {
        throw new Error(`GoComputeOciDigest failed with code ${written}`);
      }
      return new TextDecoder().decode(outBuf.subarray(0, written));
    },

    /**
     * Zero-Copy Three-Way Pipeline: Rust -> Bun -> Go -> Bun!
     * 1. Allocates a single linear `Uint8Array` (`sharedSlab`) in Bun's heap.
     * 2. Passes `ptr(sharedSlab)` to Rust (`pi_oc_snapshot_json`), which walks the filesystem and writes Merkle JSON directly into `sharedSlab`.
     * 3. Without copying or re-encoding `sharedSlab`, passes `ptr(sharedSlab)` + `rustBytesWritten` directly into Go (`GoComputeOciDigest`)!
     * 4. Go computes the OCI `sha256:...` content-addressable digest over the exact bytes Rust wrote and returns it into `digestOutBuf` for Bun!
     */
    zeroCopyRustToBunToGoSnapshotDigest(workspaceDir: string): PolyglotSnapshotAndDigest {
      const rootCStr = cstr(workspaceDir);
      const sharedSlab = new Uint8Array(4096);
      const digestOutBuf = new Uint8Array(128);

      const rustBytesWritten = Number(
        rustPiLib.symbols.pi_oc_snapshot_json(
          ptr(rootCStr),
          ptr(sharedSlab),
          sharedSlab.byteLength,
        ),
      );
      if (rustBytesWritten <= 0) {
        throw new Error(`Rust pi_oc_snapshot_json returned ${rustBytesWritten}`);
      }

      const goDigestLen = goLib.symbols.GoComputeOciDigest(
        ptr(sharedSlab),
        rustBytesWritten,
        ptr(digestOutBuf),
        digestOutBuf.byteLength,
      ) as number;
      if (goDigestLen <= 0) {
        throw new Error(`Go GoComputeOciDigest returned ${goDigestLen}`);
      }

      const snapshotJson = new TextDecoder().decode(sharedSlab.subarray(0, rustBytesWritten));
      const goOciDigest = new TextDecoder().decode(digestOutBuf.subarray(0, goDigestLen));

      return {
        rustSnapshot: JSON.parse(snapshotJson) as RustWorkspaceSnapshot,
        goOciDigest,
        agentDesktopAbiVersion: rustDesktopLib.symbols.ad_abi_version() as number,
        goInfraVersion: goLib.symbols.GoInfraVersion() as number,
        rustCpuThreads: rustPiLib.symbols.pi_oc_cpu_threads() as number,
      };
    },
  };
}
