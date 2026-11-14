// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import {
  loadTrackers,
  linksOf,
  parseTrackers,
  validateTrackers,
} from "../src/trackers/config.ts";
import { depsGraph, labelNode } from "../src/trackers/graph.ts";
import { detectLicense, renderReadme } from "../src/trackers/metadata.ts";
import { ROOT, parseV8Header } from "../src/trackers/net.ts";
import {
  maxSatisfying,
  parseFeed,
  satisfies,
} from "../src/trackers/resolvers.ts";

const REQUIRED = [
  "chromium",
  "blink",
  "v8",
  "skia",
  "cef",
  "cef-rs",
  "deno-core",
  "node",
  "electron",
  "obscura",
  "agent-browser",
  "lightpanda-zig-v8",
  "brave",
  "edge",
  "vivaldi",
  "opera",
  "ungoogled-chromium",
  "thorium",
  "helium",
];

describe("trackers configuration (third_party/ECOSYSTEM.toml)", () => {
  test("covers every requested target and is consistent", async () => {
    const ts = await loadTrackers();
    const ids = ts.map((t) => t.id);
    for (const id of REQUIRED) expect(ids).toContain(id);
    expect(validateTrackers(ts)).toEqual([]);
  });

  test("GitHub defaults derive issues, pull requests, news and changelog", () => {
    const [t] = parseTrackers(
      `[tracker.x]\nname="X"\nrole="consumer"\nrepo="o/r"\nversion={from="github-release"}`,
    );
    expect(linksOf(t as never)).toMatchObject({
      issues: "https://github.com/o/r/issues",
      prs: "https://github.com/o/r/pulls",
      news: "https://github.com/o/r/releases.atom",
      changelog: "https://github.com/o/r/releases",
    });
  });

  test("a Gerrit target points pull requests at the project queue", () => {
    const [t] = parseTrackers(
      `[tracker.v]\nname="V"\nrole="component"\ngerrit="https://g.example"\ngerrit_project="v8/v8"\nupstream="u"\nversion={from="x"}`,
    );
    expect(linksOf(t as never).prs).toBe(
      "https://g.example/q/project:v8/v8+status:open",
    );
  });

  test("the ECOSYSTEM.toml tables do not register as tree-sitter grammars (build.rs reads kind)", async () => {
    const doc = Bun.TOML.parse(
      await Bun.file(`${ROOT()}/third_party/ECOSYSTEM.toml`).text(),
    ) as { tracker: Record<string, Record<string, unknown>> };
    for (const t of Object.values(doc.tracker))
      expect(`${t.kind ?? ""}`).not.toMatch(/grammar|tree-sitter/);
  });
});

describe("parsers", () => {
  test("v8-version.h", () => {
    expect(
      parseV8Header(
        "#define V8_MAJOR_VERSION 15\n#define V8_MINOR_VERSION 8\n#define V8_BUILD_NUMBER 62\n#define V8_PATCH_LEVEL 31\n",
      ),
    ).toBe("15.8.62.31");
    expect(() => parseV8Header("nothing")).toThrow();
  });

  test("cargo caret requirements", () => {
    expect(satisfies("0.412.3", "0.412")).toBe(true);
    expect(satisfies("0.413.0", "0.412")).toBe(false);
    expect(satisfies("150.4.0", "^150.4.0")).toBe(true);
    expect(satisfies("151.0.0", "^150.4.0")).toBe(false);
    expect(satisfies("0.4.9", "^0.4.0")).toBe(true);
    expect(satisfies("0.5.0", "^0.4.0")).toBe(false);
    expect(satisfies("149.4.0-rc.4", "=149.4.0-rc.4")).toBe(true);
    expect(
      maxSatisfying(
        ["150.3.0", "150.4.0", "151.0.0", "150.5.0-rc.1"],
        "^150.4.0",
      ),
    ).toBe("150.4.0");
  });

  test("RSS and Atom first item", () => {
    expect(
      parseFeed(
        "<rss><channel><item><title><![CDATA[Opera 140]]></title><pubDate>Mon, 1 Jan 2026</pubDate><link>https://x/y</link></item></channel></rss>",
      ),
    ).toEqual({
      title: "Opera 140",
      date: "Mon, 1 Jan 2026",
      link: "https://x/y",
    });
    expect(
      parseFeed(
        '<feed><entry><title>v1.2</title><updated>2026-11-14T00:00:00Z</updated><link href="https://g/h"/></entry></feed>',
      ),
    ).toEqual({
      title: "v1.2",
      date: "2026-11-14T00:00:00Z",
      link: "https://g/h",
    });
  });
});

describe("README.chromium", () => {
  test("renders the Chromium template fields in order", () => {
    const out = renderReadme({
      name: "Skia",
      shortName: "skia",
      url: "https://skia.googlesource.com/skia",
      version: "N/A",
      date: "2026-11-10",
      revision: "fef60e46",
      updateMechanism: "Manual",
      license: "BSD-3-Clause",
      licenseFile: "/third_party/skia/LICENSE",
      shipped: "no",
      securityCritical: "yes",
      description: "Skia.",
      localModifications: "None",
    });
    const keys = out
      .split("\n")
      .filter((l) => /^[A-Za-z ]+:/.test(l))
      .map((l) => l.split(":")[0]);
    expect(keys).toEqual([
      "Name",
      "Short Name",
      "URL",
      "Version",
      "Date",
      "Revision",
      "Update Mechanism",
      "License",
      "License File",
      "Shipped",
      "Security Critical",
      "Description",
      "Local Modifications",
    ]);
  });

  test("license detection", () => {
    expect(detectLicense("Apache License\n Version 2.0, January 2004")).toBe(
      "Apache-2.0",
    );
    expect(
      detectLicense(
        "Permission is hereby granted, free of charge, to any person obtaining a copy",
      ),
    ).toBe("MIT");
    expect(
      detectLicense(
        "Redistribution and use in source and binary forms ... Neither the name of Google",
      ),
    ).toBe("BSD-3-Clause");
    expect(detectLicense("all rights reserved")).toBeUndefined();
  });

  test("every third_party checkout has a metadata file when the mirror exists", () => {
    const m = `${ROOT()}/third_party/metadata`;
    if (!existsSync(m)) return;
    for (const d of [
      "chromium",
      "skia",
      "dawn",
      "rusty_v8",
      "cef-rs",
      "obscura",
      "agent-browser",
      "node",
    ]) {
      if (existsSync(`${ROOT()}/third_party/${d}`))
        expect(existsSync(`${m}/${d}/README.chromium`)).toBe(true);
    }
  });
});

describe("graph", () => {
  test("gn labels map to the longest component prefix", () => {
    expect(labelNode("//third_party/blink/public:blink_headers")).toBe("blink");
    expect(labelNode("//v8:v8_headers")).toBe("v8");
    expect(labelNode("//third_party/skia/modules:x")).toBe("skia");
    expect(labelNode("//skia:skia")).toBe("skia");
    expect(labelNode("//content/public/browser")).toBe("content");
    expect(labelNode("//tools/foo")).toBeUndefined();
  });

  test("DEPS entries hang off their enclosing dependency", () => {
    const g = depsGraph({
      src: { url: "u", rev: null },
      "src/third_party/dawn": { url: "d", rev: "a" },
      "src/third_party/dawn/third_party/glfw3/src": { url: "g", rev: "b" },
      "src/third_party/catapult": { url: "c", rev: "c" },
    });
    const parent = (to: string) => g.edges.find((e) => e.to === to)?.from;
    expect(parent("dawn")).toBe("chromium");
    expect(parent("dep:third_party/dawn/third_party/glfw3/src")).toBe("dawn");
    expect(parent("dep:third_party/catapult")).toBe("chromium");
  });
});

describe("generated third_party/chromium-trackers.json", () => {
  test("every version carries a source and a fetch date", async () => {
    const f = Bun.file(`${ROOT()}/third_party/chromium-trackers.json`);
    if (!(await f.exists())) return;
    const doc = (await f.json()) as {
      targets: {
        id: string;
        version?: {
          value?: string;
          source?: string[];
          fetched_at: string;
          error?: string;
        };
      }[];
    };
    for (const t of doc.targets) {
      if (t.version && !t.version.error) {
        expect(t.version.source?.length, t.id).toBeGreaterThan(0);
        expect(Date.parse(t.version.fetched_at), t.id).toBeGreaterThan(0);
      }
    }
  });
});
