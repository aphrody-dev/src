import { describe, expect, test } from "bun:test";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  cmpVersion,
  highest,
  loadPatchsets,
  pkgbuildVersion,
  writePins,
} from "../src/patchsets.ts";
import {
  FORMATS,
  formatsOf,
  generate,
  gentooLicense,
  loadDistros,
  loadRecipes,
  matrix,
  nixLicenses,
  type Recipe,
} from "../src/recipe.ts";
import { buildEnv, loadKernels } from "../src/kernel.ts";
import { parse } from "../src/cli.ts";

const ROOT = resolve(import.meta.dir, "..", "..", "..");

describe("patchsets", () => {
  test("versions compare numerically", () => {
    expect(cmpVersion("7.10", "7.9")).toBeGreaterThan(0);
    expect(cmpVersion("18-7.3", "17-6.18")).toBeGreaterThan(0);
    expect(
      highest(
        ["7.3/main", "7.10/main", "6.18/main", "x"],
        "^(\\d+\\.\\d+)/main$",
      ),
    ).toBe("7.10");
    expect(
      highest(
        ["redistrib_13.4.3.json", "redistrib_13.5.0.json"],
        "^redistrib_([0-9.]+)\\.json$",
      ),
    ).toBe("13.5.0");
  });

  test("PKGBUILD version vars", () => {
    expect(
      pkgbuildVersion("_major=7.3\n_minor=4\n#_minorc=5\n", [
        "_major",
        "_minor",
      ]),
    ).toBe("7.3.4");
    expect(
      pkgbuildVersion("_major=7.3\n", ["_major", "_minor"]),
    ).toBeUndefined();
  });

  test("registry loads and pins are rewritten in place", () => {
    const list = loadPatchsets(ROOT);
    expect(list.find((p) => p.name === "cachyos")?.repo).toBe(
      "CachyOS/linux-cachyos",
    );
    expect(list.find((p) => p.name === "clear")?.excluded).toBeTruthy();
    const dir = mkdtempSync(join(tmpdir(), "ay-linux-"));
    mkdirSync(join(dir, "infra", "linux"), { recursive: true });
    cpSync(
      join(ROOT, "infra", "linux", "patchsets.toml"),
      join(dir, "infra", "linux", "patchsets.toml"),
    );
    expect(
      writePins(dir, [
        { name: "cachyos", latest: "7.4.1" },
        { name: "cachyos-patches", latest: "7.5" },
      ]),
    ).toBe(2);
    const after = loadPatchsets(dir);
    expect(after.find((p) => p.name === "cachyos")?.pinned).toBe("7.4.1");
    expect(after.find((p) => p.name === "cachyos-patches")?.pinned).toBe("7.5");
    expect(after.find((p) => p.name === "zen")?.pinned).toBe(
      list.find((p) => p.name === "zen")?.pinned,
    );
  });
});

describe("kernel flavors", () => {
  test("prd: zen4 + ThinLTO, Chromium LLVM on fr1, pinned image", () => {
    const env = buildEnv(loadKernels(ROOT), "prd", "fr1");
    expect(env.KNOBS).toContain("_processor_opt=zen4");
    expect(env.KNOBS).toContain("_use_llvm_lto=thin");
    expect(env.IMAGE).toContain("@sha256:");
    expect(env.LLVM_DIR.endsWith("Release+Asserts")).toBe(true);
    expect(buildEnv(loadKernels(ROOT), "prd", "ci").LLVM_DIR).toBe("");
    expect(() => buildEnv(loadKernels(ROOT), "nope", "ci")).toThrow();
  });
});

describe("recipes", () => {
  const recipes = loadRecipes(ROOT);
  const distros = loadDistros(ROOT);

  test("every recipe generates every target it lists", () => {
    for (const r of recipes)
      for (const f of formatsOf(r)) {
        const g = generate(
          ROOT,
          r,
          f,
          distros.find((d) => d.format === f),
        );
        expect(g.files["build.sh"]).toBeTruthy();
      }
  });

  test("CI matrix covers Arch, Debian, Alpine and Nix", () => {
    const m = matrix(recipes, distros);
    for (const d of ["arch", "debian", "alpine", "nix"])
      expect(m.some((x) => x.distro === d)).toBe(true);
    for (const x of m)
      if (x.format !== "docker") expect(x.image).toContain("@sha256:");
  });

  test("checksums in PKGBUILD and APKBUILD match the source files", () => {
    const r = recipes.find((x) => x.name === "aphrody-sysctl")!;
    const body = new Uint8Array(readFileSync(join(ROOT, r.files[0]!.src)));
    const pkgbuild = generate(ROOT, r, "arch").files["PKGBUILD"] as string;
    expect(pkgbuild).toContain(
      new Bun.CryptoHasher("sha256").update(body).digest("hex"),
    );
    const apk = generate(ROOT, r, "alpine").files[
      "aphrody/aphrody-sysctl/APKBUILD"
    ] as string;
    expect(apk).toContain(
      new Bun.CryptoHasher("sha512").update(body).digest("hex"),
    );
    expect(apk).toContain("pkgrel=0");
  });

  test("licences map to Gentoo and nixpkgs names", () => {
    expect(gentooLicense("MIT OR Apache-2.0")).toBe("|| ( MIT Apache-2.0 )");
    expect(nixLicenses("MIT OR Apache-2.0")).toBe("mit asl20");
  });

  test("Soong: /etc files become prebuilt_etc, other paths are refused", () => {
    const dir = mkdtempSync(join(tmpdir(), "ay-pkg-"));
    writeFileSync(join(dir, "a.conf"), "x=1\n");
    const base: Recipe = {
      name: "t",
      version: "1",
      release: 1,
      date: "2026-11-13",
      summary: "s",
      description: "d",
      license: "MIT",
      homepage: "https://example.invalid",
      maintainer: "m <m@x>",
      arch: "all",
      targets: ["android"],
      files: [{ src: "a.conf", dest: "/system/etc/t/a.conf" }],
    };
    const bp = generate(dir, base, "soong").files["Android.bp"] as string;
    expect(bp).toContain("prebuilt_etc {");
    expect(bp).toContain('sub_dir: "t"');
    expect(() =>
      generate(
        dir,
        { ...base, files: [{ src: "a.conf", dest: "/usr/lib/a.conf" }] },
        "soong",
      ),
    ).toThrow();
  });

  test("formats list is closed", () => {
    expect(FORMATS).toEqual([
      "arch",
      "debian",
      "alpine",
      "portage",
      "soong",
      "nix",
      "docker",
    ]);
  });
});

test("argument parsing", () => {
  const o = parse(["build", "prd", "--host", "ci", "--run", "--out=/x"]);
  expect(o.args).toEqual(["build", "prd"]);
  expect(o.values.get("host")).toBe("ci");
  expect(o.values.get("out")).toBe("/x");
  expect(o.flags.has("run")).toBe(true);
});
