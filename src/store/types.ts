/**
 * Universal Store & Multi-Ecosystem Package Manager Types
 * Zero external npm dependencies - 100% pure TypeScript
 */

import type { StackRecommendation } from "../benchmark/stack-picker";

export type Ecosystem =
  | "bun"
  | "winget"
  | "aur"
  | "nix"
  | "flatpak"
  | "playstore"
  | "wasm-hub"
  | "awesome";

export interface StorePackage {
  id: string;
  name: string;
  ecosystem: Ecosystem;
  version: string;
  description: string;
  author?: string;
  repoUrl?: string;
  category: string;
  stars?: number;
  installCmd: string;
  runCmd?: string;
  sandboxed: boolean;
  tags: string[];
  pickedStack?: StackRecommendation;
}
