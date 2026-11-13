import { describe, expect, test } from "bun:test";
import { componentsBundle, elementModule, tokensCss, typescale, typescaleCss } from "../src/web.ts";

describe("@aphrody/design/web", () => {
  test("tokensCss is minified and carries the M3 roles", () => {
    const css = tokensCss();
    expect(css).toContain("--md-sys-color-primary");
    expect(css).not.toContain("/*");
    expect(css).not.toContain("\n");
  });
  test("typescale references the tokens only", () => {
    expect(typescale("body-large")).toContain("var(--md-sys-typescale-body-large-size)");
    expect(typescaleCss()).toContain(".md-typescale-display-large{");
  });
  test("elementModule maps tags and rejects others", () => {
    expect(elementModule("md-filled-button")).toBe("@material/web/button/filled-button.js");
    expect(elementModule("md-outlined-icon-button")).toBe("@material/web/iconbutton/outlined-icon-button.js");
    expect(elementModule("md-filter-chip")).toBe("@material/web/chips/filter-chip.js");
    expect(() => elementModule("div")).toThrow();
  });
  test("componentsBundle registers only the requested subset, deterministically", async () => {
    const a = await componentsBundle(["md-divider"]);
    const b = await componentsBundle(["md-divider", "md-divider"]);
    expect(a).toBe(b);
    expect(a).toContain("md-divider");
    expect(a).not.toContain("md-filled-button");
    const big = await componentsBundle(["md-filled-button", "md-divider"]);
    expect(big.length).toBeGreaterThan(a.length);
  }, 60000);
});
