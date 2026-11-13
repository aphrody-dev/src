import { expect, test } from "bun:test";
import { baseline, gate, portFiles, versionsFile, versionsPath, type Item } from "../src/plan.ts";

const it = (o: Partial<Item>): Item => ({ registry: "crates", name: "x", version: "1.0.0", isNew: false, published: false, ...o });

test("new packages stop at the dry-run without owner-rules.json", () => {
  const g = gate([it({ isNew: true, name: "fresh" }), it({ name: "old" })], null);
  expect(g.blocked).toEqual(["crates:fresh"]);
  expect(g.reason).toContain("absent");
});

test("owner approval unblocks only the listed new packages", () => {
  const g = gate([it({ isNew: true, name: "a" }), it({ isNew: true, name: "b", registry: "pypi" })], { release: { approve_new: ["crates:a"] } });
  expect(g.blocked).toEqual(["pypi:b"]);
});

test("new versions of existing packages need no approval", () => {
  expect(gate([it({ name: "old" })], null).blocked).toEqual([]);
});

test("vcpkg git registry layout", () => {
  expect(versionsPath("aphrody-core-capi")).toBe("versions/a-/aphrody-core-capi.json");
  const b = baseline({ default: { other: { baseline: "1.0.0", "port-version": 0 } } }, "p", "0.2.0");
  expect(b.default).toEqual({ other: { baseline: "1.0.0", "port-version": 0 }, p: { baseline: "0.2.0", "port-version": 0 } });
  const v = versionsFile({ versions: [{ "git-tree": "old", version: "0.2.0", "port-version": 0 }, { "git-tree": "t1", version: "0.1.0", "port-version": 0 }] }, { "git-tree": "new", version: "0.2.0", "port-version": 0 });
  expect(v.versions.map((e) => e["git-tree"])).toEqual(["new", "t1"]);
});

test("port files carry the CMake target and the cargo build", () => {
  const f = portFiles({ crate: "crates/core-capi", port: "aphrody-core-capi", lib: "aphrody_core_capi", header: "include/aphrody_core.h", target: "aphrody::core" }, "0.2.0", { repo: "aphrody-labs/src", ref: "v0.2.0", sha512: "ab", description: "d", license: "MIT OR Apache-2.0" });
  expect(Object.keys(f).sort()).toEqual(["aphrody-core-capi-config.cmake", "portfile.cmake", "usage", "vcpkg.json"]);
  expect(JSON.parse(f["vcpkg.json"]!).version).toBe("0.2.0");
  expect(f["portfile.cmake"]).toContain("cargo-${TARGET_TRIPLET}");
  expect(f["aphrody-core-capi-config.cmake"]).toContain("add_library(aphrody::core UNKNOWN IMPORTED)");
});
