import { describe, expect, test } from "bun:test";
import { rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  iconsPlugin,
  m3IconPlugin,
  m3TokensPlugin,
} from "./m3-icons-plugin.ts";

describe("m3IconPlugin + iconsPlugin + m3TokensPlugin", () => {
  test("bundles virtual m3:icon/*, symbol:*, m3:tokens.css, and .ico files with zero external deps", async () => {
    const entryDir = join(tmpdir(), `aphrody-m3-plugin-${Date.now()}`);
    const entryFile = join(entryDir, "entry.ts");
    const icoPath = join(
      import.meta.dir,
      "../google-design/assets/brand/favicon.ico",
    ).replace(/\\/g, "/");
    await Bun.write(
      entryFile,
      `import searchIcon from "m3:icon/outlined/search?size=20";
import petWave from "symbol:pet_wave?style=rounded&wght=500&size=28";
import tokensCss from "m3:tokens.css?seed=%238c6c88";
import faviconUrl from "${icoPath}";
export { searchIcon, petWave, tokensCss, faviconUrl };
`,
    );

    try {
      const res = await Bun.build({
        entrypoints: [entryFile],
        plugins: [m3IconPlugin, iconsPlugin(), m3TokensPlugin()],
        target: "bun",
      });
      expect(res.success).toBe(true);
      const code = await res.outputs[0]!.text();
      expect(code).toContain("<svg");
      expect(code).toContain("--md-sys-color-primary");
      expect(code).toContain("data:image/png;base64,");
    } finally {
      try {
        rmSync(entryDir, { recursive: true, force: true });
      } catch {}
    }
  });
});
