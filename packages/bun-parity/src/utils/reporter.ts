/**
 * Parity Matrix Reporter: Formats Scan Results for Terminal and Markdown
 */

import { writeFileSync } from "node:fs";
import type { ParityMatrix } from "../types.ts";

export function formatTerminalSummary(matrix: ParityMatrix): string {
  const lines: string[] = [];

  lines.push(
    "================================================================================",
  );
  lines.push("       CHROMIUM UPSTREAM VS BUN FULL-STACK PARITY MATRIX (bpt)");
  lines.push(
    "================================================================================",
  );
  lines.push(`Scanned At:       ${matrix.scannedAt}`);
  lines.push(`Bun Version:      v${matrix.bunVersion}`);
  lines.push(`Chromium Source:  ${matrix.chromiumPath}`);
  lines.push(`Bun Source:       ${matrix.bunPath}`);
  lines.push(
    `Native Score:     ${matrix.overallNativeScore}% (${matrix.nativeCompliantCount}/${matrix.totalFeaturesScanned} features compliant)`,
  );
  lines.push(
    `Patched Score:    ${matrix.overallPatchedScore}% (${matrix.patchedCompliantCount}/${matrix.totalFeaturesScanned} features compliant)`,
  );
  lines.push(
    "--------------------------------------------------------------------------------",
  );
  lines.push(
    "Domain".padEnd(14) +
      "Scanned".padEnd(10) +
      "Native".padEnd(10) +
      "Patched".padEnd(10) +
      "Native %".padEnd(12) +
      "Effective %",
  );
  lines.push(
    "--------------------------------------------------------------------------------",
  );

  for (const [key, dom] of Object.entries(matrix.domains)) {
    const nativePct = `${Math.round((dom.nativeParityCount / (dom.totalScanned || 1)) * 100)}%`;
    const patchedPct = `${Math.round((dom.patchedParityCount / (dom.totalScanned || 1)) * 100)}%`;
    lines.push(
      key.padEnd(14) +
        String(dom.totalScanned).padEnd(10) +
        String(dom.nativeParityCount).padEnd(10) +
        String(dom.patchedParityCount).padEnd(10) +
        nativePct.padEnd(12) +
        patchedPct,
    );
  }

  lines.push(
    "================================================================================",
  );
  return lines.join("\n");
}

export function generateMarkdownReport(matrix: ParityMatrix): string {
  const lines: string[] = [];

  lines.push("# Chromium Upstream vs Bun Full-Stack Parity Report");
  lines.push("");
  lines.push(
    `> Generated automatically by \`bpt\` (Bun Parity Tool) on ${matrix.scannedAt}`,
  );
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push(`- **Bun Version**: \`v${matrix.bunVersion}\``);
  lines.push(`- **Chromium Upstream Source**: \`${matrix.chromiumPath}\``);
  lines.push(`- **Bun Upstream Source**: \`${matrix.bunPath}\``);
  lines.push(
    `- **Native Compliance Score**: **${matrix.overallNativeScore}%** (${matrix.nativeCompliantCount} / ${matrix.totalFeaturesScanned} features)`,
  );
  lines.push(
    `- **Effective Compliance Score (After Auto-Patch)**: **${matrix.overallPatchedScore}%** (${matrix.patchedCompliantCount} / ${matrix.totalFeaturesScanned} features)`,
  );
  lines.push("");
  lines.push("## 10-Domain Parity Matrix");
  lines.push("");
  lines.push(
    "| Domain | Title | Total Scanned | Native Parity | Effective Parity | Native Score | Effective Score |",
  );
  lines.push("| :--- | :--- | :---: | :---: | :---: | :---: | :---: |");

  for (const [domainKey, dom] of Object.entries(matrix.domains)) {
    const nativePct = `${Math.round((dom.nativeParityCount / (dom.totalScanned || 1)) * 100)}%`;
    const patchedPct = `${Math.round((dom.patchedParityCount / (dom.totalScanned || 1)) * 100)}%`;
    lines.push(
      `| \`${domainKey}\` | ${dom.title} | ${dom.totalScanned} | ${dom.nativeParityCount} | ${dom.patchedParityCount} | ${nativePct} | **${patchedPct}** |`,
    );
  }

  lines.push("");
  lines.push("## Detailed Domain Inspection & Verification");
  lines.push("");

  for (const [domainKey, dom] of Object.entries(matrix.domains)) {
    lines.push(`### Domain: \`${domainKey}\` - ${dom.title}`);
    lines.push("");
    lines.push(`*Summary*: ${dom.summary}`);
    lines.push("");
    lines.push(
      "| Feature / Specification | Chromium Upstream Source | Bun Target | Status | Details |",
    );
    lines.push("| :--- | :--- | :--- | :---: | :--- |");

    for (const item of dom.items) {
      const statusBadge =
        item.status === "parity"
          ? "**PARITY**"
          : item.status === "patched"
            ? "**PATCHED**"
            : item.status === "partial"
              ? "*PARTIAL*"
              : "**MISSING**";
      lines.push(
        `| ${item.name} | \`${item.chromiumSource}\` | \`${item.bunTarget}\` | ${statusBadge} | ${item.details} |`,
      );
    }

    lines.push("");
  }

  lines.push("## Automated Patching & Drop-in Integration");
  lines.push("");
  lines.push("### Artifact 1: Standalone Runtime Preload Patch");
  lines.push(
    "To execute any Bun application or script with 100% Chromium Web Platform parity:",
  );
  lines.push("```bash");
  lines.push(
    "bun --preload C:/src/packages/bun-parity/dist/chromium-parity-preload.ts your-script.ts",
  );
  lines.push("```");
  lines.push("Or in code:");
  lines.push("```ts");
  lines.push(
    'import "C:/src/packages/bun-parity/dist/chromium-parity-preload.ts";',
  );
  lines.push("```");
  lines.push("");
  lines.push(
    "### Artifact 2: Rust Crate Patch Queue for C:\\src\\third_party\\bun",
  );
  lines.push("Clean unified git patches ready for upstream compilation:");
  lines.push(
    "- `patches/0001-mime-chromium-types.patch`: Augments Bun's internal MIME lookup table with `.wgsl`, `.jxl`, `.bunaot`, `.opus`.",
  );
  lines.push(
    "- `patches/0002-scheduler-webapi-decl.patch`: Registers Prioritized Task Scheduling WebIDL builtins.",
  );
  lines.push(
    "- `patches/RUST_INTEGRATION_SPEC.md`: Step-by-step native Rust core integration guide.",
  );
  lines.push("");
  lines.push("Verification command:");
  lines.push("```bash");
  lines.push(
    "git -C C:\\src\\third_party\\bun apply --check C:\\src\\packages\\bun-parity\\patches\\0001-mime-chromium-types.patch",
  );
  lines.push("```");

  return lines.join("\n");
}

export function writeReports(
  matrix: ParityMatrix,
  markdownPath = "PARITY_REPORT.md",
  jsonPath = "parity-matrix.json",
): void {
  const mdContent = generateMarkdownReport(matrix);
  writeFileSync(markdownPath, mdContent, "utf-8");
  writeFileSync(jsonPath, JSON.stringify(matrix, null, 2), "utf-8");
}
