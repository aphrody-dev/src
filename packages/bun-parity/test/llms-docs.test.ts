// Every result Bun's documentation states in a `// =>` comment (https://bun.com/llms-full.txt,
// extracted into test/llms/cases.json by `bpt llms extract`), checked against a Bun binary:
// BUN_UNDER_TEST, else the Bun running the test. Examples that are not self-contained (they use a
// name or file the page defines elsewhere) are reported as todo, not as failures.

import { describe, expect, test } from "bun:test";
import type { Extracted } from "../src/llms/extract.ts";
import { classify, isLiteral, transform } from "../src/llms/extract.ts";
import { CASES_PATH, notSelfContained } from "../src/llms/cli.ts";
import { runCase } from "../src/llms/run.ts";

const data: Extracted = await Bun.file(CASES_PATH).json();
const bin = process.env.BUN_UNDER_TEST || process.execPath;

describe("extraction", () => {
  test("literals are only literals", () => {
    expect(isLiteral(`"hello"`)).toBe(true);
    expect(isLiteral(`[{ address: "1.2.3.4", ttl: 0 }]`)).toBe(true);
    expect(isLiteral(`123n`)).toBe(true);
    expect(isLiteral(`Bun.version`)).toBe(false);
    expect(isLiteral(`process.exit(1)`)).toBe(false);
    expect(isLiteral(`foo`)).toBe(false);
  });

  test("results are classified", () => {
    expect(classify(`buf.length`, `11`)).toBe("literal");
    expect(classify(`blob.stream()`, `ReadableStream`)).toBe("type");
    expect(classify(`arr.buffer`, `ArrayBuffer(64)`)).toBe("type");
    expect(classify(`Bun.revision`, `"49231b2c"`)).toBe("unverifiable");
    expect(classify(`x`, `"/path/to/file.txt"`)).toBe("unverifiable");
  });

  test("a logged expression is evaluated once, where it was logged", () => {
    const t = transform(
      `const h = make();\nconsole.log(h.digest("hex"));\n// => "abc"\n`,
    )!;
    expect(t.code).toBe(
      `const h = make();\n__expect(0, () => (h.digest("hex")));\n\n`,
    );
    expect(t.expectations[0]!.printed).toBe(true);
  });

  test("the cases come from llms-full.txt", () => {
    expect(data.source).toBe("https://bun.com/llms-full.txt");
    expect(data.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(data.cases.length).toBeGreaterThan(20);
  });
});

describe(`documented results with ${bin}`, () => {
  for (const c of data.cases) {
    test.concurrent(
      c.id,
      async () => {
        const r = await runCase(bin, c);
        if (r.status !== "pass" && notSelfContained(r)) {
          console.warn(
            `${c.id}: not self-contained (${r.failures[0]?.actual ?? r.stderr?.split("\n")[0]})`,
          );
          return;
        }
        expect(
          r.failures.map((f) => ({
            documented: f.expectation.source,
            actual: f.actual,
          })),
          `${c.url}`,
        ).toEqual([]);
      },
      20_000,
    );
  }
});
