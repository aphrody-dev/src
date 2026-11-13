// Kernel flavors (infra/linux/kernels.toml) -> environment of infra/linux/build/kernel.sh.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type Flavor = { name: string; image: string; env: Record<string, string> };
export type Kernels = {
  toolchain: Record<string, string>;
  image: Record<string, string>;
  flavors: Flavor[];
};

export function loadKernels(root: string): Kernels {
  const doc = Bun.TOML.parse(readFileSync(join(root, "infra", "linux", "kernels.toml"), "utf8")) as {
    toolchain: Record<string, string>;
    image: Record<string, string>;
    flavor: Record<string, { image: string; env: Record<string, string> }>;
  };
  return {
    toolchain: doc.toolchain,
    image: doc.image,
    flavors: Object.entries(doc.flavor).map(([name, f]) => ({ name, image: f.image, env: f.env })),
  };
}

const KNOB = /^_[A-Za-z0-9_]+$/;
const VALUE = /^[A-Za-z0-9_./:-]*$/;

/** Environment for kernel.sh on `host` (fr1 or ci). Knob names and values are checked: they reach a shell. */
export function buildEnv(k: Kernels, flavor: string, host: "fr1" | "ci"): Record<string, string> {
  const f = k.flavors.find((x) => x.name === flavor);
  if (!f) throw new Error(`flavor « ${flavor} » inconnu (${k.flavors.map((x) => x.name).join(", ")})`);
  const image = k.image[f.image];
  if (!image?.includes("@sha256:")) throw new Error(`image ${f.image} non épinglée par digest`);
  for (const [n, v] of Object.entries(f.env))
    if (!KNOB.test(n) || !VALUE.test(v)) throw new Error(`réglage invalide ${n}=${v}`);
  const llvm = k.toolchain[host] ?? "";
  return {
    FLAVOR: f.name,
    IMAGE: image,
    HOST: host,
    // kernel.sh mounts the parent of bin/ (clang needs its lib/clang resource directory).
    LLVM_DIR: llvm.replace(/\/bin\/?$/, ""),
    KNOBS: Object.entries(f.env)
      .map(([n, v]) => `${n}=${v}`)
      .join(" "),
  };
}

export function shellEnv(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([k, v]) => `${k}='${v.replace(/'/g, "'\\''")}'`)
    .join(" ");
}
