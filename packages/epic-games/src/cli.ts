#!/usr/bin/env bun
// SPDX-License-Identifier: Apache-2.0
// Epic Games & Unreal Engine Sovereign CLI (egs)

import { parsePakFooter, PAK_FILE_MAGIC } from "./pak";
import { parseUAssetSummary, PACKAGE_FILE_TAG } from "./uasset";
import { parseEgsManifestHeader, EGS_MANIFEST_MAGIC } from "./manifest";

const args = process.argv.slice(2);
const command = args[0] || "help";

async function main() {
  if (command === "inspect") {
    const filePath = args[1];
    if (!filePath) {
      console.error(
        "Usage: egs inspect <file.pak | file.uasset | file.manifest>",
      );
      process.exit(1);
    }

    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    console.log(`[EGS] Inspecting: ${filePath} (${buffer.length} bytes)`);

    // Try UAsset
    try {
      const uasset = parseUAssetSummary(buffer);
      console.log(`[UAsset] Detected Unreal Engine Asset`);
      console.log(`  UE4 Version: ${uasset.fileVersionUE4}`);
      console.log(`  UE5 Version: ${uasset.fileVersionUE5}`);
      console.log(`  Names:       ${uasset.nameCount}`);
      console.log(`  Exports:     ${uasset.exportCount}`);
      console.log(`  Imports:     ${uasset.importCount}`);
      return;
    } catch {}

    // Try EGS Manifest
    try {
      const manifest = parseEgsManifestHeader(buffer);
      console.log(`[Manifest] Detected Epic Games Store Manifest`);
      console.log(`  Version:     ${manifest.version}`);
      console.log(`  Header Size: ${manifest.headerSize}`);
      console.log(`  Compressed:  ${manifest.isCompressed}`);
      return;
    } catch {}

    // Try PAK Footer
    try {
      const pak = parsePakFooter(buffer);
      console.log(`[PAK] Detected Unreal Engine .pak Archive`);
      console.log(`  Version:      ${pak.version}`);
      console.log(`  Index Offset: ${pak.indexOffset}`);
      console.log(`  Index Size:   ${pak.indexSize}`);
      console.log(`  Encrypted:    ${pak.isEncrypted}`);
      return;
    } catch {}

    console.log("[EGS] Unknown or unsupported binary format.");
  } else {
    console.log("Sovereign Epic Games & Unreal Engine CLI (egs)");
    console.log("Commands:");
    console.log(
      "  inspect <file>   Inspect .pak, .uasset, or .manifest file metadata",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
