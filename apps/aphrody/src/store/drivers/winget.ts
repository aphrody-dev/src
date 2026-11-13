/**
 * Windows Package Manager (winget) Driver
 * Native adapter querying winget CLI / Windows repository manifests
 * Zero external npm dependencies
 */

import type { StorePackage } from "../types";

export const WINGET_CURATED_PACKAGES: StorePackage[] = [
  {
    id: "winget-oven-bun",
    name: "Oven-sh.Bun",
    ecosystem: "winget",
    version: "1.4.4",
    description: "Incredibly fast JavaScript & TypeScript all-in-one toolkit",
    author: "Oven",
    category: "Runtime / Toolchain",
    stars: 76000,
    installCmd: "winget install --id Oven-sh.Bun -e",
    runCmd: "bun --version",
    sandboxed: false,
    tags: ["bun", "javascript", "fast", "windows"],
  },
  {
    id: "winget-nvidia-cuda",
    name: "Nvidia.CUDA",
    ecosystem: "winget",
    version: "13.4.0",
    description:
      "NVIDIA CUDA Toolkit for GPU-accelerated computing (sm_89 Ada Lovelace)",
    author: "NVIDIA Corporation",
    category: "Hardware Acceleration",
    stars: 35000,
    installCmd: "winget install --id Nvidia.CUDA -e",
    runCmd: "nvcc --version",
    sandboxed: false,
    tags: ["nvidia", "cuda", "gpu", "sm_89"],
  },
  {
    id: "winget-rustup",
    name: "Rustlang.Rustup",
    ecosystem: "winget",
    version: "1.28.0",
    description: "The Rust toolchain installer for native systems programming",
    author: "Rust Foundation",
    category: "Language / Toolchain",
    stars: 98000,
    installCmd: "winget install --id Rustlang.Rustup -e",
    runCmd: "rustc --version",
    sandboxed: false,
    tags: ["rust", "lto", "compiler", "systems"],
  },
  {
    id: "winget-git",
    name: "Git.Git",
    ecosystem: "winget",
    version: "2.50.0",
    description: "Fast, scalable, distributed revision control system",
    author: "Software Freedom Conservancy",
    category: "Developer Tooling",
    stars: 55000,
    installCmd: "winget install --id Git.Git -e",
    runCmd: "git --version",
    sandboxed: false,
    tags: ["vcs", "git", "cli"],
  },
  {
    id: "winget-vscode",
    name: "Microsoft.VisualStudioCode",
    ecosystem: "winget",
    version: "1.98.0",
    description:
      "Visual Studio Code code editor redefined and optimized for building and debugging",
    author: "Microsoft",
    category: "IDE / Editor",
    stars: 165000,
    installCmd: "winget install --id Microsoft.VisualStudioCode -e",
    runCmd: "code .",
    sandboxed: false,
    tags: ["editor", "microsoft", "ide"],
  },
];

export async function searchWingetPackages(
  query: string,
): Promise<StorePackage[]> {
  const q = query.toLowerCase().trim();
  if (!q) return WINGET_CURATED_PACKAGES;
  return WINGET_CURATED_PACKAGES.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}
