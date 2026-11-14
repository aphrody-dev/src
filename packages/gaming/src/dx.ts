// DirectX view of the host. Windows: DXGI adapters (`ay sys --json`, src/sys), the D3D12 runtime
// files of System32 and the DirectX version key. Linux: the translation layers each Proton build
// ships (DXVK for D3D8-11, vkd3d-proton for D3D12) under files/lib/wine/{dxvk,vkd3d-proton}.
// Sources of those layers: third_party/{dxvk,vkd3d-proton,DirectX-Headers,DirectXShaderCompiler}.
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { ayBin } from "./native.ts";
import type { CompatTool } from "./steam.ts";

export interface Adapter {
  name: string;
  vendor_id: number;
  device_id: number;
  dedicated_memory: number;
  driver_version: string;
  software: boolean;
}

export interface WindowsDx {
  adapters: Adapter[];
  runtime: Record<string, boolean>;
  directx_version: string | null;
}

function regValue(key: string, value: string): string | null {
  const r = Bun.spawnSync(["reg", "query", key, "/v", value], {
    stdout: "pipe",
    stderr: "ignore",
  });
  const m = r.stdout
    .toString()
    .match(new RegExp(`${value}\\s+REG_\\w+\\s+(.+)`));
  return m?.[1]?.trim() ?? null;
}

export function windowsDx(): WindowsDx {
  const sys = Bun.spawnSync([ayBin(), "sys", "--json", "--no-tools"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  let adapters: Adapter[] = [];
  try {
    adapters = (JSON.parse(sys.stdout.toString()).gpus ?? []) as Adapter[];
  } catch {
    adapters = [];
  }
  const sys32 = join(process.env.SystemRoot ?? "C:\\Windows", "System32");
  const runtime = Object.fromEntries(
    [
      "d3d12.dll",
      "D3D12Core.dll",
      "dxgi.dll",
      "d3d11.dll",
      "dxcore.dll",
      "dxil.dll",
      "dxcompiler.dll",
    ].map((f) => [f, existsSync(join(sys32, f))]),
  );
  return {
    adapters,
    runtime,
    directx_version: regValue("HKLM\\SOFTWARE\\Microsoft\\DirectX", "Version"),
  };
}

export interface ProtonDx {
  tool: string;
  version: string | null;
  dxvk: string[];
  vkd3d_proton: string[];
}

/** DLLs of DXVK and vkd3d-proton shipped by each Proton build. */
export function protonDx(tools: CompatTool[]): ProtonDx[] {
  const list = (dir: string): string[] =>
    existsSync(dir)
      ? readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
          e.isDirectory()
            ? readdirSync(join(dir, e.name))
                .filter((f) => f.endsWith(".dll"))
                .map((f) => `${e.name}/${f}`)
            : e.name.endsWith(".dll")
              ? [e.name]
              : [],
        )
      : [];
  return tools
    .filter((t) => existsSync(join(t.path, "proton")))
    .map((t) => ({
      tool: t.display_name ?? t.name,
      version: t.version,
      dxvk: list(join(t.path, "files", "lib", "wine", "dxvk")),
      vkd3d_proton: list(join(t.path, "files", "lib", "wine", "vkd3d-proton")),
    }));
}

/** DirectX 12 Agility SDK redistributed by a game: <install>/D3D12/D3D12Core.dll, one level down. */
export function agilitySdk(installPath: string): string | null {
  const direct = join(installPath, "D3D12", "D3D12Core.dll");
  if (existsSync(direct)) return direct;
  if (!existsSync(installPath)) return null;
  for (const e of readdirSync(installPath, { withFileTypes: true }))
    if (e.isDirectory()) {
      const p = join(installPath, e.name, "D3D12", "D3D12Core.dll");
      if (existsSync(p)) return p;
    }
  return null;
}
