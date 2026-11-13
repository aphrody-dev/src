import { describe, expect, test } from "bun:test";
import {
  checkRadianceHdr,
  classify,
  renderMarkdown,
  summarize,
  type TestResult,
} from "../../src/test.ts";
import { lockStanzas } from "../../src/retest.ts";

const r = (o: Partial<TestResult>): TestResult => ({
  id: "a",
  kind: "k",
  type: "image",
  validator: "v",
  ok: true,
  ms: 1,
  bytes: 2,
  detail: "d",
  ...o,
});

describe("classify", () => {
  test("by extension", () => {
    expect(classify("a/b.OGG")).toBe("audio");
    expect(classify("x.glb")).toBe("model");
    expect(classify("x.svg")).toBe("svg");
    expect(classify("x.jpg")).toBe("image");
    expect(classify("x.hdr")).toBe("hdri");
    expect(classify("x.toml")).toBeUndefined();
  });
});

describe("radiance", () => {
  const hdr = (res: string, payload: number) =>
    new Uint8Array([
      ...new TextEncoder().encode(
        `#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n${res}\n`,
      ),
      ...new Uint8Array(payload),
    ]);
  test("accepts a valid header", () =>
    expect(checkRadianceHdr(hdr("-Y 4 +X 4", 64))).toContain("4x4"));
  test("rejects a bad signature", () =>
    expect(() => checkRadianceHdr(new TextEncoder().encode("nope"))).toThrow());
  test("rejects truncated pixels", () =>
    expect(() => checkRadianceHdr(hdr("-Y 64 +X 64", 3))).toThrow("truncated"));
});

describe("report", () => {
  test("summary counts pass, fail, skip per type", () => {
    const s = summarize([
      r({}),
      r({ ok: false }),
      r({ skipped: true }),
      r({ type: "audio" }),
    ]);
    expect(s.find((x) => x.type === "image")).toMatchObject({
      tested: 3,
      passed: 1,
      failed: 1,
      skipped: 1,
    });
    expect(s.find((x) => x.type === "audio")?.passed).toBe(1);
  });
  test("markdown lists failures", () => {
    const md = renderMarkdown(
      [r({ ok: false, id: "bad", detail: "boom" })],
      [],
      { date: "x" },
    );
    expect(md).toContain("## Failures");
    expect(md).toContain("bad (v): boom");
  });
});

describe("fingerprint", () => {
  test("keeps only decoder stanzas", () => {
    const lock = `[[package]]\nname = "bevy"\nversion = "0.20.1"\n\n[[package]]\nname = "serde"\nversion = "1"\n`;
    const s = lockStanzas(lock);
    expect(s).toContain('name = "bevy"');
    expect(s).not.toContain("serde");
  });
});
