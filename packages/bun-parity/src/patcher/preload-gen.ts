/**
 * Artifact 1 Generator: Instant Zero-Copy Runtime Preload Patch
 * Synthesizes dist/chromium-parity-preload.ts
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { PatchOptions } from "../types.ts";

export async function generatePreloadPatch(
  options: PatchOptions = {},
): Promise<{ outputPath: string; size: number }> {
  const rootDir = join(import.meta.dir, "../..");
  const distDir = options.distPath ?? join(rootDir, "dist");
  const outputPath = join(distDir, "chromium-parity-preload.ts");

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  const entryPath = join(rootDir, "src/preload-entry.ts");

  const buildResult = await Bun.build({
    entrypoints: [entryPath],
    target: "bun",
    minify: false,
    format: "esm",
  });

  if (!buildResult.success) {
    const errorMsg = buildResult.logs.map((l) => l.message).join("\n");
    throw new Error(`Failed to build preload patch: ${errorMsg}`);
  }

  const outputText = await buildResult.outputs[0].text();
  const banner = `/**
 * CHROMIUM UPSTREAM VS BUN FULL-STACK RUNTIME PARITY PRELOAD
 * Generated automatically by bun-parity (bpt patch)
 * Target: Bun v${Bun.version}
 * Artifact: dist/chromium-parity-preload.ts
 */\n\n`;

  writeFileSync(outputPath, banner + outputText, "utf-8");

  return {
    outputPath,
    size: outputText.length + banner.length,
  };
}
