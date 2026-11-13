import { expect, test } from "bun:test";
import { isForbiddenIpv6, SsrfGuard } from "../src/browser/ssrf.ts";

test("IPv4 embedded in IPv6 is judged on the IPv4", () => {
  for (const ip of [
    "::1",
    "::",
    "::127.0.0.1",
    "::7f00:1",
    "::ffff:127.0.0.1",
    "::ffff:a00:1",
    "64:ff9b::7f00:1",
    "64:ff9b::10.0.0.1",
    "64:ff9b:1::1",
    "2002:7f00:1::",
    "2002:a9fe:a9fe::",
    "2001::7f00:1",
    "2001:db8::1",
    "fd00::1",
    "fe80::1%eth0",
    "fec0::1",
    "ff02::1",
    "100::1",
    "1:2:3",
  ]) {
    expect(isForbiddenIpv6(ip)).toBe(true);
  }
  for (const ip of [
    "2606:4700::1111",
    "64:ff9b::808:808",
    "2002:808:808::",
    "::ffff:8.8.8.8",
  ]) {
    expect(isForbiddenIpv6(ip)).toBe(false);
  }
});

test("guard is fail-closed on DNS failure and IPv6 literals", async () => {
  const g = new SsrfGuard();
  for (const u of [
    "http://does-not-exist.invalid/",
    "http://[::127.0.0.1]/",
    "http://[64:ff9b::7f00:1]/",
    "http://[2002:7f00:1::]/",
    "http://0x7f000001/",
    "http://127.1/",
    "file:///etc/passwd",
  ]) {
    expect(await g.isSafe(u)).toBe(false);
  }
});

test("redirect hops are re-validated", async () => {
  const srv = Bun.serve({
    port: 0,
    fetch: () =>
      new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data/" },
      }),
  });
  const g = new SsrfGuard({ allowedHosts: ["localhost"] });
  try {
    await expect(g.fetch(`http://localhost:${srv.port}/`)).rejects.toThrow(
      /SSRF Guard/,
    );
  } finally {
    srv.stop(true);
  }
});
