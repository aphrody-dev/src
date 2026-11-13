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

/** Expands an IPv6 literal (optionally with a dotted IPv4 tail) to 8 hextets; null if malformed. */
export function parseIpv6(ip: string): number[] | null {
  let s = ip
    .toLowerCase()
    .trim()
    .replace(/^\[|\]$/g, "");
  const zone = s.indexOf("%");
  if (zone >= 0) s = s.slice(0, zone);
  const tail = s.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (tail) {
    const p = tail[1]!.split(".").map(Number);
    if (p.some((n) => n > 255)) return null;
    s = `${s.slice(0, -tail[1]!.length)}${((p[0]! << 8) | p[1]!).toString(16)}:${((p[2]! << 8) | p[3]!).toString(16)}`;
  }
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = 8 - head.length - rest.length;
  if (halves.length === 1 ? head.length !== 8 : fill < 1) return null;
  const all = [
    ...head,
    ...Array(halves.length === 2 ? fill : 0).fill("0"),
    ...rest,
  ];
  const out: number[] = [];
  for (const h of all) {
    if (!/^[0-9a-f]{1,4}$/.test(h)) return null;
    out.push(Number.parseInt(h, 16));
  }
  return out;
}

const v4of = (hi: number, lo: number) =>
  `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;

/**
 * Special-purpose IPv6 (RFC 6890 registry) is forbidden, and every IPv4-embedding form
 * (compatible ::/96, mapped ::ffff:0:0/96, NAT64 64:ff9b::/96 and 64:ff9b:1::/48,
 * 6to4 2002::/16) is judged on its embedded IPv4; Teredo 2001::/32 and malformed input are forbidden.
 */
export function isForbiddenIpv6(ip: string): boolean {
  const h = parseIpv6(ip);
  if (!h) return true;
  const [a, b, c, d, e, f, g, i] = h as [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  if (a === 0 && b === 0 && c === 0 && d === 0 && e === 0) {
    if (f === 0 || f === 0xffff)
      return g === 0 && i <= 1 ? true : isForbiddenIpv4(v4of(g, i));
    return true; // ::ffff:0:0:0/96 (SIIT) and other ::/80 forms
  }
  if (a === 0x64 && b === 0xff9b)
    return c === 0 && d === 0 && e === 0 && f === 0
      ? isForbiddenIpv4(v4of(g, i))
      : true;
  if (a === 0x2002) return isForbiddenIpv4(v4of(b, c));
  if (a === 0x2001 && b === 0) return true; // Teredo: tunnel relay, never a crawl target
  if (a === 0x2001 && b === 0x0db8) return true; // documentation
  if (a === 0x2001 && b < 0x200) return true; // 2001::/23 IETF protocol assignments
  if (a === 0x0100 && b === 0 && c === 0 && d === 0) return true; // discard 100::/64
  if ((a & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((a & 0xffc0) === 0xfe80 || (a & 0xffc0) === 0xfec0) return true; // link/site local
  if ((a & 0xff00) === 0xff00) return true; // multicast
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
      throw new Error(
        `SSRF Guard: Host "${hostname}" did not resolve (fail-closed).`,
      );
    }
  }

  /**
   * fetch with every redirect hop re-validated (redirect: "manual", at most maxRedirects hops).
   * DNS rebinding between validation and connect stays open: pinning the IP needs a dedicated
   * connector or egress proxy.
   */
  async fetch(
    targetUrl: string | URL,
    init: RequestInit = {},
    maxRedirects = 5,
  ): Promise<Response> {
    let url = new URL(targetUrl);
    for (let hop = 0; ; hop++) {
      await this.validateUrl(url);
      const res = await fetch(url.href, { ...init, redirect: "manual" });
      const location = res.headers.get("location");
      if (res.status < 300 || res.status >= 400 || !location) return res;
      if (hop >= maxRedirects) {
        throw new Error(
          `SSRF Guard: more than ${maxRedirects} redirects from ${targetUrl}`,
        );
      }
      url = new URL(location, url);
    }
  }

  isSafe(targetUrl: string | URL): Promise<boolean> {
    return this.validateUrl(targetUrl)
      .then(() => true)
      .catch(() => false);
  }
}
