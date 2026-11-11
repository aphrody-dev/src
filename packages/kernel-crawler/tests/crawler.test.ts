import { describe, expect, test } from "bun:test";
import { generateLiveUpstreamMdx, type UpstreamKernelFeed } from "../src/crawler";

describe("@aphrody/kernel-crawler MDX generation", () => {
  test("generates deterministic MDX table from kernel.org feed", () => {
    const sampleFeed: UpstreamKernelFeed = {
      latest_stable: { version: "7.3.4" },
      releases: [
        {
          moniker: "mainline",
          version: "7.4-rc2",
          iseol: false,
          released: { timestamp: 1793923200, isodate: "2026-11-08" },
          source: "https://git.kernel.org/torvalds/t/linux-7.4-rc2.tar.gz",
          pgp: null,
          patch: { full: "https://cdn.kernel.org/pub/linux/kernel/v7.x/testing/patch-7.4-rc2.xz", incremental: null },
          gitweb: "https://git.kernel.org/torvalds/h/v7.4-rc2",
        },
        {
          moniker: "stable",
          version: "7.3.4",
          iseol: false,
          released: { timestamp: 1793836800, isodate: "2026-11-07" },
          source: "https://cdn.kernel.org/pub/linux/kernel/v7.x/linux-7.3.4.tar.xz",
          pgp: "https://cdn.kernel.org/pub/linux/kernel/v7.x/linux-7.3.4.tar.sign",
          patch: { full: "https://cdn.kernel.org/pub/linux/kernel/v7.x/patch-7.3.4.xz", incremental: null },
          gitweb: null,
        },
      ],
    };

    const mdx = generateLiveUpstreamMdx(sampleFeed);
    expect(mdx).toContain("Current Latest Stable Kernel**: `7.3.4`");
    expect(mdx).toContain("| **mainline** | `7.4-rc2` | 2026-11-08 |");
    expect(mdx).toContain("| **Arch Linux / CachyOS** |");
    expect(mdx).toContain("ABAF 11C6 5A29 70B1 30AB");
  });
});
