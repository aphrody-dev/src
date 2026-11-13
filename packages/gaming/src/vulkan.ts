// Vulkan loader view of the host: ICDs (drivers) and implicit/explicit layers, read from the JSON
// manifests where the Khronos loader looks for them (third_party/Vulkan-Loader/docs/LoaderLayerInterface.md and LoaderDriverInterface.md:
// Linux XDG and /etc, /usr/share; Windows HKLM/HKCU\SOFTWARE\Khronos\Vulkan\{Drivers,ImplicitLayers,ExplicitLayers}).
// Windows GPU drivers register their ICD under the display adapter key instead, so `--info`
// (vulkaninfo --summary, Vulkan-Tools) is the driver view there.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type ManifestKind = "icd" | "implicit_layer" | "explicit_layer";

export interface VulkanManifest {
  kind: ManifestKind;
  file: string;
  name: string | null;
  api_version: string | null;
  implementation_version: string | null;
  library_path: string | null;
  description: string | null;
  disable_environment: string[];
}

/** Parses one loader manifest (ICD or layer JSON); tolerant of `layers` arrays. */
export function parseManifest(
  kind: ManifestKind,
  file: string,
  text: string,
): VulkanManifest[] {
  const doc = JSON.parse(text) as Record<string, any>;
  const layers: Record<string, any>[] =
    kind === "icd"
      ? [doc.ICD ?? {}]
      : (doc.layers ?? (doc.layer ? [doc.layer] : []));
  return layers.map((l) => ({
    kind,
    file,
    name:
      l.name ??
      (kind === "icd" && l.library_path
        ? String(l.library_path).split(/[\\/]/).pop()!
        : null),
    api_version: l.api_version ?? null,
    implementation_version: l.implementation_version ?? null,
    library_path: l.library_path ?? null,
    description: l.description ?? null,
    disable_environment: Object.keys(l.disable_environment ?? {}),
  }));
}

const DIRS: Record<ManifestKind, string> = {
  icd: "icd.d",
  implicit_layer: "implicit_layer.d",
  explicit_layer: "explicit_layer.d",
};

function unixRoots(): string[] {
  const home = homedir();
  const xdgData = (
    process.env.XDG_DATA_DIRS ?? "/usr/local/share:/usr/share"
  ).split(":");
  const xdgConf = (process.env.XDG_CONFIG_DIRS ?? "/etc/xdg").split(":");
  return [
    join(process.env.XDG_CONFIG_HOME ?? join(home, ".config"), "vulkan"),
    ...xdgConf.map((d) => join(d, "vulkan")),
    "/etc/vulkan",
    join(process.env.XDG_DATA_HOME ?? join(home, ".local", "share"), "vulkan"),
    ...xdgData.map((d) => join(d, "vulkan")),
  ];
}

const REG: Record<ManifestKind, string> = {
  icd: "Drivers",
  implicit_layer: "ImplicitLayers",
  explicit_layer: "ExplicitLayers",
};

/** Registry values of a Khronos key: the value name is the manifest path. */
function regManifests(kind: ManifestKind): string[] {
  const out: string[] = [];
  for (const hive of ["HKLM", "HKCU"]) {
    const r = Bun.spawnSync(
      ["reg", "query", `${hive}\\SOFTWARE\\Khronos\\Vulkan\\${REG[kind]}`],
      {
        stdout: "pipe",
        stderr: "ignore",
      },
    );
    for (const line of r.stdout.toString().split(/\r?\n/)) {
      const m = line.match(/^\s+(.+\.json)\s+REG_DWORD\s+0x0+\s*$/i);
      if (m) out.push(m[1]!.trim());
    }
  }
  return out;
}

export function vulkanManifests(): VulkanManifest[] {
  const out: VulkanManifest[] = [];
  const seen = new Set<string>();
  const add = (kind: ManifestKind, file: string): void => {
    if (seen.has(file) || !existsSync(file)) return;
    seen.add(file);
    try {
      out.push(...parseManifest(kind, file, readFileSync(file, "utf8")));
    } catch {
      out.push({
        kind,
        file,
        name: null,
        api_version: null,
        implementation_version: null,
        library_path: null,
        description: "unreadable manifest",
        disable_environment: [],
      });
    }
  };
  for (const kind of Object.keys(DIRS) as ManifestKind[]) {
    if (process.platform === "win32")
      for (const f of regManifests(kind)) add(kind, f);
    else
      for (const root of unixRoots()) {
        const dir = join(root, DIRS[kind]);
        if (!existsSync(dir)) continue;
        for (const f of readdirSync(dir)
          .filter((x) => x.endsWith(".json"))
          .sort())
          add(kind, join(dir, f));
      }
  }
  return out;
}

/** `vulkaninfo --summary` when the Vulkan-Tools binary is installed; null otherwise. */
export function vulkanInfoSummary(): string | null {
  const bin = Bun.which("vulkaninfo") ?? Bun.which("vulkaninfoSDK");
  if (!bin) return null;
  const r = Bun.spawnSync([bin, "--summary"], {
    stdout: "pipe",
    stderr: "ignore",
  });
  return r.exitCode === 0 ? r.stdout.toString() : null;
}
