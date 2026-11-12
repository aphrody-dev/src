// SPDX-License-Identifier: Apache-2.0
/**
 * SSRF Guard for Sovereign Crawler & Headless Chromium Pool.
 * Blocks loopback, RFC1918, link-local, cloud metadata (169.254.169.254 / metadata.google.internal), and multicast.
 */
import { lookup } from "node:dns/promises";

export interface SsrfGuardOptions {
  allowPrivateNetwork?: boolean;
  allowedHosts?: string[];
  blockedHosts?: string[];
}

export function isForbiddenIpv4(ip: string): boolean {
  const parts = ip.split(".").map((n) => Number.parseInt(n, 10));
  if (
    parts.length !== 4 ||
    parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)
  ) {
    return true;
  }
  const [b0, b1, b2, b3] = parts as [number, number, number, number];

  if (b0 === 0) return true;
  if (b0 === 127) return true;
  if (b0 === 10) return true;
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
  if (b0 === 192 && b1 === 168) return true;
  if (b0 === 169 && b1 === 254) return true;
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
  if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;
  if (b0 === 192 && b1 === 88 && b2 === 99) return true;
  if (b0 === 192 && b1 === 0 && b2 === 0 && b3 !== 9 && b3 !== 10) return true;
  if (b0 >= 224) return true;
  return false;
}

export function isForbiddenIpv6(ip: string): boolean {
  const norm = ip.toLowerCase().trim();
  if (norm === "::1" || norm === "0:0:0:0:0:0:0:1") return true;
  if (norm === "::" || norm === "0:0:0:0:0:0:0:0") return true;
  if (norm.startsWith("fc") || norm.startsWith("fd")) return true;
  if (
    norm.startsWith("fe8") ||
    norm.startsWith("fe9") ||
    norm.startsWith("fea") ||
    norm.startsWith("feb")
  ) {
    return true;
  }
  if (norm.includes("::ffff:")) {
    const v4 = norm.split("::ffff:")[1];
    if (v4 && isForbiddenIpv4(v4)) return true;
  }
  return false;
}

export class SsrfGuard {
  readonly allowPrivateNetwork: boolean;
  private readonly allowedHosts: Set<string>;
  private readonly blockedHosts: Set<string>;

  constructor(options: SsrfGuardOptions = {}) {
    this.allowPrivateNetwork = options.allowPrivateNetwork ?? false;
    this.allowedHosts = new Set(
      (options.allowedHosts ?? []).map((h) => h.toLowerCase()),
    );
    this.blockedHosts = new Set(
      (options.blockedHosts ?? []).map((h) => h.toLowerCase()),
    );
  }

  async validateUrl(targetUrl: string | URL): Promise<void> {
    const url = typeof targetUrl === "string" ? new URL(targetUrl) : targetUrl;
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`SSRF Guard: Unsupported protocol "${url.protocol}"`);
    }
    const hostname = url.hostname.toLowerCase();

    if (this.blockedHosts.has(hostname)) {
      throw new Error(`SSRF Guard: Host "${hostname}" is explicitly blocked.`);
    }
    if (this.allowedHosts.has(hostname) || this.allowPrivateNetwork) {
      return;
    }

    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname === "metadata.google.internal" ||
      hostname === "instance-data"
    ) {
      throw new Error(
        `SSRF Guard: Target host "${hostname}" resolves to an internal network.`,
      );
    }

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      if (isForbiddenIpv4(hostname)) {
        throw new Error(
          `SSRF Guard: Target IP "${hostname}" is a private or forbidden IPv4 address.`,
        );
      }
      return;
    }

    const cleanV6 = hostname.replace(/^\[|\]$/g, "");
    if (cleanV6.includes(":")) {
      if (isForbiddenIpv6(cleanV6)) {
        throw new Error(
          `SSRF Guard: Target IPv6 "${cleanV6}" is a private or loopback address.`,
        );
      }
      return;
    }

    try {
      const records = await lookup(hostname, { all: true });
      for (const record of records) {
        if (record.family === 4 && isForbiddenIpv4(record.address)) {
          throw new Error(
            `SSRF Guard: Host "${hostname}" resolved to forbidden private IPv4: ${record.address}`,
          );
        }
        if (record.family === 6 && isForbiddenIpv6(record.address)) {
          throw new Error(
            `SSRF Guard: Host "${hostname}" resolved to forbidden private IPv6: ${record.address}`,
          );
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.message.startsWith("SSRF Guard:")) {
        throw err;
      }
    }
  }

  isSafe(targetUrl: string | URL): Promise<boolean> {
    return this.validateUrl(targetUrl)
      .then(() => true)
      .catch(() => false);
  }
}
