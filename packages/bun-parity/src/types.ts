/**
 * Core type definitions for Chromium Upstream vs Bun Parity Recon & Patcher
 */

export type ParityDomain =
  | "html"
  | "css"
  | "js"
  | "api"
  | "texte"
  | "data-assets"
  | "dns"
  | "tls"
  | "stack";

export type ParityStatus = "parity" | "missing" | "partial" | "patched";

export interface ParityItem {
  domain: ParityDomain;
  name: string;
  chromiumSource: string;
  bunTarget: string;
  status: ParityStatus;
  details: string;
  patchAvailable: boolean;
  patchedBy?: string;
}

export interface DomainReport {
  domain: ParityDomain;
  title: string;
  totalScanned: number;
  nativeParityCount: number;
  patchedParityCount: number;
  items: ParityItem[];
  summary: string;
}

export interface ParityMatrix {
  scannedAt: string;
  bunVersion: string;
  chromiumPath: string;
  bunPath: string;
  overallNativeScore: number;
  overallPatchedScore: number;
  totalFeaturesScanned: number;
  nativeCompliantCount: number;
  patchedCompliantCount: number;
  domains: Record<ParityDomain, DomainReport>;
}

export interface ScanOptions {
  chromiumPath?: string;
  bunPath?: string;
  verbose?: boolean;
}

export interface PatchOptions {
  distPath?: string;
  patchesDir?: string;
  dryRun?: boolean;
}

export interface PatchResult {
  generatedAt: string;
  preloadPath: string;
  patchesGenerated: string[];
  patchedFeatureCount: number;
  verificationPassed: boolean;
}
