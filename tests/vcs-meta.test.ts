import { describe, expect, test } from "bun:test";
import { getVcsMetadata } from "../vcs-meta-plugin.ts";
import { resolve } from "node:path";

describe("Sovereign VCS Metadata Engine", () => {
  test("extracts current repository metadata", () => {
    const meta = getVcsMetadata(resolve("C:\\src\\third_party\\vcs\\forge"));

    expect(meta.commitSha).toBeDefined();
    expect(meta.shortSha.length).toBe(8);
    expect(meta.changeId).toBeDefined();
    expect(meta.branch).toBeDefined();
    expect(["jj", "gix", "git"]).toContain(meta.engine);
  });
});
