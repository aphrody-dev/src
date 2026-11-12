/**
 * Nixpkgs & NixOS Declarative Profile Generator Driver
 * Generates flake.nix / configuration.nix snippets and manages nix profiles
 * Zero external npm dependencies
 */

import type { StorePackage } from "../types";

export const NIX_CURATED_PACKAGES: StorePackage[] = [
  {
    id: "nix-bun",
    name: "nixpkgs#bun",
    ecosystem: "nix",
    version: "1.4.4",
    description:
      "Incredibly fast JavaScript runtime, bundler, test runner, and package manager",
    author: "NixOS Community",
    category: "Development / Toolchain",
    stars: 14000,
    installCmd: "nix profile install nixpkgs#bun",
    runCmd: "bun --version",
    sandboxed: true,
    tags: ["nix", "nixos", "flake", "reproducible"],
  },
  {
    id: "nix-rust-bin",
    name: "nixpkgs#rust-bin.stable.latest.default",
    ecosystem: "nix",
    version: "1.85.0",
    description:
      "Declarative Rust toolchain with fat LTO and reproducible target CPU flags",
    author: "oxalica",
    category: "Systems Programming",
    stars: 2800,
    installCmd:
      "nix profile install github:oxalica/rust-overlay#rust-bin.stable.latest.default",
    runCmd: "rustc --version",
    sandboxed: true,
    tags: ["nix", "rust", "overlay", "lto"],
  },
  {
    id: "nix-neovim",
    name: "nixpkgs#neovim",
    ecosystem: "nix",
    version: "0.10.4",
    description:
      "Vim-fork focused on extensibility and usability with Lua engine",
    author: "Neovim Team",
    category: "Editor",
    stars: 82000,
    installCmd: "nix profile install nixpkgs#neovim",
    runCmd: "nvim",
    sandboxed: true,
    tags: ["nix", "editor", "lua"],
  },
];

export async function searchNixPackages(
  query: string,
): Promise<StorePackage[]> {
  const q = query.toLowerCase().trim();
  if (!q) return NIX_CURATED_PACKAGES;
  return NIX_CURATED_PACKAGES.filter(
    (p) => p.name.includes(q) || p.description.toLowerCase().includes(q),
  );
}
