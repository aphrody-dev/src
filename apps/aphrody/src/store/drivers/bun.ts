/**
 * Bun Package Manager Driver (bun pm / bun install / bun pm fetch / bun pm cache)
 * 100% native oven-sh/bun (Full Rust) adapter with zero external npm dependencies
 */

import type { StorePackage } from "../types";

export const BUN_CURATED_PACKAGES: StorePackage[] = [
  {
    id: "bun-elysia",
    name: "elysia",
    ecosystem: "bun",
    version: "1.2.0",
    description:
      "Ergonomic Framework for Humans with high-performance type-safety",
    category: "Web Framework",
    stars: 12500,
    installCmd: "bun add elysia && bun pm fetch",
    runCmd: "bun run dev",
    sandboxed: false,
    tags: ["bun", "typescript", "fast", "api", "framework"],
  },
  {
    id: "bun-hono",
    name: "hono",
    ecosystem: "bun",
    version: "4.7.0",
    description: "Fast, Lightweight, Web-standards based Web Framework",
    category: "Web Framework",
    stars: 21000,
    installCmd: "bun add hono && bun pm fetch",
    runCmd: "bun run dev",
    sandboxed: false,
    tags: ["bun", "web-standards", "router", "microframework"],
  },
  {
    id: "bun-prettier",
    name: "prettier",
    ecosystem: "bun",
    version: "3.5.0",
    description:
      "Opinionated code formatter for JavaScript and TypeScript (or use native bun fmt)",
    category: "Developer Tooling",
    stars: 49000,
    installCmd: "bun add -d prettier",
    runCmd: "bun fmt",
    sandboxed: false,
    tags: ["linter", "formatter", "cli"],
  },
  {
    id: "bun-typescript",
    name: "typescript",
    ecosystem: "bun",
    version: "5.8.0",
    description: "TypeScript language compiler (or use native fast bun check)",
    category: "Language / Tooling",
    stars: 104000,
    installCmd: "bun add -d typescript",
    runCmd: "bun check",
    sandboxed: false,
    tags: ["compiler", "types", "official"],
  },
];

export async function searchBunPackages(
  query: string,
): Promise<StorePackage[]> {
  const q = query.toLowerCase().trim();
  if (!q) return BUN_CURATED_PACKAGES;
  return BUN_CURATED_PACKAGES.filter(
    (p) => p.name.includes(q) || p.description.toLowerCase().includes(q),
  );
}
