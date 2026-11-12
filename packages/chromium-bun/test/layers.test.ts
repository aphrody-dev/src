import { describe, expect, it } from "bun:test";
import { SOVEREIGN_LAYERS, getLayer, getAllLayers } from "../src/layers.ts";

describe("6-Layer Sovereign Architecture Specification", () => {
  it("should have exactly 6 defined sovereign layers", () => {
    const layers = getAllLayers();
    expect(layers.length).toBe(6);
    expect(layers.map((l) => l.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("should define Layer 1 as POSIX contract", () => {
    const l1 = getLayer(1);
    expect(l1.name).toBe("POSIX");
    expect(l1.codename).toBe("posix_contract");
  });

  it("should define Layer 2 as Unix philosophy", () => {
    const l2 = getLayer(2);
    expect(l2.name).toBe("Unix");
    expect(l2.codename).toBe("unix_philosophy");
  });

  it("should define Layer 3 as Linux kernel", () => {
    const l3 = getLayer(3);
    expect(l3.name).toBe("Linux");
    expect(l3.codename).toBe("linux_kernel");
    expect(l3.canonicalSource).toContain("linux");
  });

  it("should define Layer 4 as GNU userland via uutils in Rust", () => {
    const l4 = getLayer(4);
    expect(l4.name).toBe("GNU");
    expect(l4.codename).toBe("gnu_userland");
    expect(l4.canonicalSource).toContain("uutils");
  });

  it("should define Layer 5 as Chromium native heavyweight C++/GPU", () => {
    const l5 = getLayer(5);
    expect(l5.name).toBe("Chromium");
    expect(l5.description).toContain("Dawn");
    expect(l5.description).toContain("Skia");
    expect(l5.description).toContain("V8");
  });

  it("should define Layer 6 as Bun full Rust sovereign runtime", () => {
    const l6 = getLayer(6);
    expect(l6.name).toBe("Bun");
    expect(l6.codename).toBe("bun_sovereign_runtime");
    expect(l6.description).toContain("Rust");
    expect(l6.description).toContain("bun check");
    expect(l6.description).toContain("bun fmt");
  });
});
