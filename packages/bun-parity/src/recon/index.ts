/**
 * Master Recon Orchestrator across all 10 Chromium vs Bun Domains
 */

import type { ParityDomain, ParityMatrix, ScanOptions } from "../types.ts";
import { scanHtmlDomain } from "./html.ts";
import { scanCssDomain } from "./css.ts";
import { scanJsDomain } from "./js.ts";
import { scanApiDomain } from "./api.ts";
import { scanTexteDomain } from "./texte.ts";
import { scanDataAssetsDomain } from "./data-assets.ts";
import { scanDnsDomain } from "./dns.ts";
import { scanTlsDomain } from "./tls.ts";
import { scanStackDomain } from "./stack.ts";

export async function runFullParityScan(
  options: ScanOptions = {},
): Promise<ParityMatrix> {
  const chromiumPath = options.chromiumPath ?? "C:/src/third_party/chromium/src";
  const bunPath = options.bunPath ?? "C:/src/third_party/bun";

  const [html, css, js, api, texte, dataAssets, dns, tls, stack] =
    await Promise.all([
      scanHtmlDomain({ chromiumPath, bunPath }),
      scanCssDomain({ chromiumPath, bunPath }),
      scanJsDomain({ chromiumPath, bunPath }),
      scanApiDomain({ chromiumPath, bunPath }),
      scanTexteDomain({ chromiumPath, bunPath }),
      scanDataAssetsDomain({ chromiumPath, bunPath }),
      scanDnsDomain({ chromiumPath, bunPath }),
      scanTlsDomain({ chromiumPath, bunPath }),
      scanStackDomain({ chromiumPath, bunPath }),
    ]);

  const domains = {
    html,
    css,
    js,
    api,
    texte,
    "data-assets": dataAssets,
    dns,
    tls,
    stack,
  };

  let totalFeaturesScanned = 0;
  let nativeCompliantCount = 0;
  let patchedCompliantCount = 0;

  for (const dom of Object.values(domains)) {
    totalFeaturesScanned += dom.totalScanned;
    nativeCompliantCount += dom.nativeParityCount;
    patchedCompliantCount += dom.patchedParityCount;
  }

  const overallNativeScore = Math.round(
    (nativeCompliantCount / (totalFeaturesScanned || 1)) * 100,
  );
  const overallPatchedScore = Math.round(
    (patchedCompliantCount / (totalFeaturesScanned || 1)) * 100,
  );

  return {
    scannedAt: new Date().toISOString(),
    bunVersion: Bun.version,
    chromiumPath,
    bunPath,
    overallNativeScore,
    overallPatchedScore,
    totalFeaturesScanned,
    nativeCompliantCount,
    patchedCompliantCount,
    domains,
  };
}
