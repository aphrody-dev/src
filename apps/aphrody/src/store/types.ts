/**
 * Store types. Every field comes from the upstream source of the package;
 * a value the source does not provide is absent (never defaulted or invented).
 */

export type Ecosystem =
  | "bun"
  | "crates"
  | "github"
  | "winget"
  | "chocolatey"
  | "aur"
  | "nix"
  | "flatpak"
  | "fdroid"
  | "steam"
  | "epic";

export const ECOSYSTEMS: readonly Ecosystem[] = [
  "bun",
  "crates",
  "github",
  "winget",
  "chocolatey",
  "aur",
  "nix",
  "flatpak",
  "fdroid",
  "steam",
  "epic",
];

export interface StorePackage {
  id: string;
  name: string;
  ecosystem: Ecosystem;
  /** Latest version as published by the registry; absent when the search endpoint does not return it. */
  version?: string;
  description: string;
  author?: string;
  repoUrl?: string;
  /** Canonical page of the package in its registry or store. */
  url?: string;
  image?: string;
  license?: string;
  /** GitHub stargazers_count read from the GitHub API; absent when not looked up or unavailable. */
  stars?: number;
  /** Command that installs the package with the ecosystem's own tool; empty when the ecosystem has none. */
  installCmd: string;
  tags: string[];
}

export type SourceErrorCode =
  | "http_error"
  | "timeout"
  | "network"
  | "bad_payload"
  | "token_missing"
  | "no_public_api"
  | "source_missing"
  | "unknown_ecosystem";

export interface SourceReport {
  ecosystem: string;
  ok: boolean;
  count: number;
  /** URL of the upstream endpoint that was queried. */
  source: string;
  fetchedAt: string;
  error?: { code: SourceErrorCode; message: string; status?: number };
}

export interface StoreSearch {
  query: string;
  ecosystem: string;
  count: number;
  packages: StorePackage[];
  sources: SourceReport[];
  /** Set when the query is empty: nothing is searched. */
  empty?: "empty_query";
}
