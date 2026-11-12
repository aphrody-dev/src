import { describe, expect, test } from "bun:test";
import { parseJustfile, generateJustModule } from "../just-plugin.ts";

describe("Sovereign Justfile Bun Plugin", () => {
  const sampleJustfile = `
# Default build recipe
default:
    cargo build --release

# Ingest monorepo targets
ingest target="depot" format="json":
    depot ingest C:\\src\\\${target} --format \${format}

# Slim git repositories
slim:
    git gc --prune=now
`;

  test("parseJustfile extracts recipes with comments and parameters", () => {
    const recipes = parseJustfile(sampleJustfile);

    expect(recipes["default"]).toBeDefined();
    expect(recipes["default"].description).toContain("Default build recipe");
    expect(recipes["default"].body).toContain("cargo build --release");

    expect(recipes["ingest"]).toBeDefined();
    expect(recipes["ingest"].parameters).toContain("target");
    expect(recipes["ingest"].parameters).toContain("format");

    expect(recipes["slim"]).toBeDefined();
    expect(recipes["slim"].description).toContain("Slim git repositories");
  });

  test("generateJustModule produces valid JS module syntax", () => {
    const code = generateJustModule("C:\\src\\justfile", sampleJustfile);
    expect(code).toContain("export const recipes =");
    expect(code).toContain("async function ingest");
    expect(code).toContain("export { ingest }");
    expect(code).toContain("export { run_default as default }");
    expect(code).toContain("export { slim }");
  });
});
