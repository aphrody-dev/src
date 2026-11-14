import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  findShellEntry,
  formatTermSgr,
  getTermPalette,
  listShellCatalog,
  listTermThemes,
  searchShellCatalog,
} from "@aphrody/core/sys";
import { formatCatalogCli } from "../src/shell-kit.ts";

const ROOT = join(import.meta.dir, "..", "..", "..");
const SHELLS = join(ROOT, "packages", "machine", "shells");

describe("packages/machine Pure C ABI shell customization index & configs", () => {
  test("every catalog entry with a config path references a real versioned file", () => {
    const entries = listShellCatalog();
    expect(entries.length).toBeGreaterThanOrEqual(40);
    for (const entry of entries) {
      if (entry.config) {
        const full = join(ROOT, entry.config);
        expect(existsSync(full)).toBe(true);
      }
      expect(entry.docs).toStartWith("https://");
    }
  });

  test("manifest.toml links all existing config sources and fonts.lock.toml parses cleanly", () => {
    const manifest = Bun.TOML.parse(
      readFileSync(join(SHELLS, "manifest.toml"), "utf8"),
    ) as {
      link?: { src: string; mode: string }[];
    };
    const links = manifest.link ?? [];
    expect(links.length).toBeGreaterThanOrEqual(20);
    for (const l of links) {
      expect(["source", "copy"]).toContain(l.mode);
      expect(existsSync(join(SHELLS, l.src))).toBe(true);
    }

    const fonts = Bun.TOML.parse(
      readFileSync(join(SHELLS, "fonts", "fonts.lock.toml"), "utf8"),
    ) as {
      release: { tag: string };
      font: { slug: string; zip_sha256: string; tar_xz_sha256: string }[];
      google?: {
        slug: string;
        family: string;
        file: string;
        url: string;
        sha256: string;
      }[];
    };
    expect(fonts.release.tag).toBe("v3.5.1");
    expect(fonts.font.length).toBe(3);
    for (const f of fonts.font) {
      expect(f.zip_sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(f.tar_xz_sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    const google = fonts.google ?? [];
    expect(google.length).toBe(6);
    for (const g of google) {
      expect(g.url).toStartWith("https://");
      expect(g.sha256).toMatch(/^[a-f0-9]{64}$/);
    }
    expect(google.map((g) => g.family)).toContain("Google Sans Code");
    expect(google.map((g) => g.family)).toContain("Google Sans Flex");
    expect(google.map((g) => g.family)).toContain("Material Symbols Rounded");
  });

  test("wezterm, alacritty, ghostty, lazygit, starship & yazi configs have valid schemas and 20px Google Sans Code", () => {
    const wez = readFileSync(join(SHELLS, "wezterm", "wezterm.lua"), "utf8");
    expect(wez).not.toContain(".cargo\\bin\\nu.exe");
    expect(wez).toContain("Google Sans Code");
    expect(wez).toContain("config.font_size = 20");

    const ala = readFileSync(
      join(SHELLS, "alacritty", "alacritty.toml"),
      "utf8",
    );
    expect(ala).toContain('family = "Google Sans Code"');
    expect(ala).toContain("size = 20.0");

    const ghostty = readFileSync(join(SHELLS, "ghostty", "config"), "utf8");
    expect(ghostty).toContain('font-family = "Google Sans Code"');
    expect(ghostty).toContain("font-size = 20");

    const lg = readFileSync(join(SHELLS, "lazygit", "config.yml"), "utf8");
    expect(lg).toContain("diffRenderers:");
    expect(lg).toContain('nerdFontsVersion: "3"');

    const yazi = readFileSync(join(SHELLS, "yazi", "yazi.toml"), "utf8");
    expect(yazi).toContain("hx");
    expect(yazi).not.toContain("code ");

    const fastfetch = JSON.parse(
      readFileSync(join(SHELLS, "fastfetch", "config.jsonc"), "utf8"),
    ) as { modules: unknown[] };
    expect(Array.isArray(fastfetch.modules)).toBe(true);
  });

  test("Pure C ABI lookup, search and CLI formatter operate deterministically", () => {
    const themes = listTermThemes();
    expect(themes.length).toBe(9);
    const p = getTermPalette("catppuccin-mocha");
    expect(p?.bg).toBe("#1E1E2E");
    expect(formatTermSgr(0xffcdd6f4, 0xff1e1e2e, 16 | 32)).toContain("\x1b[");

    expect(findShellEntry("yazi")?.version).toBe("26.9.1");
    expect(findShellEntry("google-sans-code")?.version).toBe("2026");
    expect(findShellEntry("google-sans-flex")?.version).toBe("2026");
    expect(searchShellCatalog("atuin")[0]?.slug).toBe("atuin");
    expect(formatCatalogCli(undefined, "starship")).toContain(
      "https://starship.rs/config/",
    );
    expect(formatCatalogCli()).toContain("# C ABI 2026 Customization Index");
  });
});
