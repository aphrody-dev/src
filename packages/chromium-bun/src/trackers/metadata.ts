// SPDX-License-Identifier: Apache-2.0
/**
 * README.chromium for every checkout of third_party/, in the format of chromium/src third_party/README.chromium.template
 * (validated by depot_tools/metadata). The checkouts are untracked clones, so the files live in the versioned mirror
 * third_party/metadata/<dir>/README.chromium, one per third_party/<dir>.
 */
import { existsSync, readdirSync, rmSync } from "node:fs";
import { loadTrackers } from "./config.ts";
import { ROOT, pool, run } from "./net.ts";
import { type TrackersDoc, readTrackers } from "./run.ts";

export interface Readme {
  name: string;
  shortName?: string;
  url: string;
  version: string;
  date?: string;
  revision?: string;
  updateMechanism: string;
  license: string;
  licenseFile?: string;
  shipped: "yes" | "no";
  securityCritical: "yes" | "no";
  description: string;
  localModifications: string;
}

export function renderReadme(r: Readme): string {
  const f: string[] = [`Name: ${r.name}`];
  if (r.shortName && r.shortName !== r.name)
    f.push(`Short Name: ${r.shortName}`);
  f.push(`URL: ${r.url}`, `Version: ${r.version}`);
  if (r.date) f.push(`Date: ${r.date}`);
  if (r.revision) f.push(`Revision: ${r.revision}`);
  f.push(`Update Mechanism: ${r.updateMechanism}`, `License: ${r.license}`);
  if (r.licenseFile) f.push(`License File: ${r.licenseFile}`);
  f.push(
    `Shipped: ${r.shipped}`,
    `Security Critical: ${r.securityCritical}`,
    "",
    "Description:",
    r.description,
    "",
    "Local Modifications:",
    r.localModifications,
  );
  return `${f.join("\n")}\n`;
}

const BSD = (t: string) =>
  /Neither the name|may be used to endorse|promote products/i.test(t)
    ? "BSD-3-Clause"
    : "BSD-2-Clause";
const LICENSES: readonly [RegExp, string | ((t: string) => string)][] = [
  [/GNU AFFERO GENERAL PUBLIC LICENSE/i, "AGPL-3.0"],
  [/GNU LESSER GENERAL PUBLIC LICENSE[\s\S]{0,120}Version 3/i, "LGPL-3.0"],
  [/GNU LESSER GENERAL PUBLIC LICENSE[\s\S]{0,120}Version 2\.1/i, "LGPL-2.1"],
  [/GNU GENERAL PUBLIC LICENSE[\s\S]{0,120}Version 3/i, "GPL-3.0"],
  [/GNU GENERAL PUBLIC LICENSE[\s\S]{0,120}Version 2/i, "GPL-2.0"],
  [/Apache License[\s\S]{0,200}Version 2\.0/i, "Apache-2.0"],
  [/Mozilla Public License[\s\S]{0,80}2\.0/i, "MPL-2.0"],
  [/Boost Software License/i, "BSL-1.0"],
  [/free and unencumbered software|The Unlicense/i, "Unlicense"],
  [
    /Permission is hereby granted, free of charge, to any person obtaining a copy/i,
    "MIT",
  ],
  [
    /Permission to use, copy, modify, and\/or distribute this software for any purpose with or without fee/i,
    "ISC",
  ],
  [/Redistribution and use in source and binary forms/i, BSD],
  [
    /zlib License|This software is provided 'as-is', without any express or implied warranty/i,
    "Zlib",
  ],
];

/** SPDX id of one license text, or undefined when no known text matches. */
export function detectLicense(text: string): string | undefined {
  for (const [re, id] of LICENSES)
    if (re.test(text)) return typeof id === "string" ? id : id(text);
  return undefined;
}

interface LockRepo {
  url: string;
  upstream_url?: string | null;
  commit: string;
}

async function lockRepos(): Promise<Record<string, LockRepo>> {
  try {
    return (
      (await Bun.file(`${ROOT()}/src.lock.json`).json()) as {
        repositories: Record<string, LockRepo>;
      }
    ).repositories;
  } catch {
    return {};
  }
}

const SECURITY_CRITICAL = new Set([
  "chromium",
  "blink",
  "v8",
  "skia",
  "dawn",
  "angle",
  "cef",
  "cef-rs",
  "rusty-v8",
  "node",
  "electron",
]);

async function licenseOf(root: string): Promise<{ id: string; file?: string }> {
  const files = readdirSync(root)
    .filter((n) => /^(LICEN[CS]E|COPYING|UNLICENSE)/i.test(n))
    .sort();
  const ids: string[] = [];
  for (const f of files) {
    const t = (
      await Bun.file(`${root}/${f}`)
        .text()
        .catch(() => "")
    ).slice(0, 24_000);
    const id = detectLicense(t);
    if (id && !ids.includes(id)) ids.push(id);
  }
  return { id: ids.length ? ids.join(", ") : "UNKNOWN", file: files[0] };
}

export async function generateMetadata(
  doc?: TrackersDoc | null,
): Promise<{ written: number; removed: number; dirs: string[] }> {
  const third = `${ROOT()}/third_party`;
  const trackers = await loadTrackers();
  const live = doc ?? (await readTrackers());
  const lock = await lockRepos();
  const dirs = readdirSync(third, { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && !["design-mirror", "metadata"].includes(d.name),
    )
    .map((d) => d.name)
    .sort();
  const out = `${third}/metadata`;
  await pool(dirs, 8, async (dir) => {
    const path = `${third}/${dir}`;
    const bare =
      existsSync(`${path}/HEAD`) &&
      existsSync(`${path}/config`) &&
      !existsSync(`${path}/.git`);
    const root =
      existsSync(`${path}/.git`) || bare
        ? path
        : existsSync(`${path}/src/.git`)
          ? `${path}/src`
          : undefined;
    const lockKey =
      existsSync(`${path}/src/.git`) && !existsSync(`${path}/.git`)
        ? `third_party/${dir}/src`
        : `third_party/${dir}`;
    const lk = lock[lockKey];
    let date: string | undefined;
    let revision: string | undefined;
    const remotes: Record<string, string> = {};
    if (root) {
      const log = (
        await run(["git", "-C", root, "log", "-1", "--format=%H%n%cs"])
      ).out
        .trim()
        .split("\n");
      revision = log[0] || undefined;
      date = log[1] || undefined;
      for (const line of (
        await run([
          "git",
          "-C",
          root,
          "config",
          "--get-regexp",
          "^remote\\..*\\.url$",
        ])
      ).out.split("\n")) {
        const m = line.match(/^remote\.(.+)\.url (.+)$/);
        if (m) remotes[m[1] as string] = m[2] as string;
      }
    }
    const t =
      trackers.find(
        (x) => x.local === `third_party/${dir}` || x.local === lockKey,
      ) ??
      trackers.find((x) => x.id.replaceAll("-", "_") === dir || x.id === dir);
    const url = (
      lk?.upstream_url ||
      remotes.upstream ||
      lk?.url ||
      remotes.origin ||
      remotes.aphrody ||
      "N/A"
    ).replace(/\.git$/, "");
    const fork =
      lk?.upstream_url ||
      Object.values(remotes).some((u) => /aphrody-labs/.test(u))
        ? Object.values(remotes).find((u) => /aphrody-labs/.test(u))
        : undefined;
    const lic = await licenseOf(bare ? path : (root ?? path));
    const readme: Readme = {
      name: t?.name ?? dir,
      shortName: dir,
      url,
      version:
        t?.id === "chromium" && live?.channels.checkout_version
          ? live.channels.checkout_version
          : "N/A",
      date,
      revision,
      updateMechanism: "Manual",
      license: lic.id,
      licenseFile: lic.file
        ? `/third_party/${dir}${root === `${path}/src` ? "/src" : ""}/${lic.file}`
        : undefined,
      shipped: "no",
      securityCritical: t && SECURITY_CRITICAL.has(t.id) ? "yes" : "no",
      description: t
        ? `${t.name}${t.note ? `. ${t.note}` : ""}. Pinned in src.lock.json; live versions in third_party/chromium-trackers.json.`
        : `Checkout of ${url}, pinned in src.lock.json.`,
      localModifications: fork
        ? `None in the checkout; the aphrody-labs fork (${fork.replace(/\.git$/, "")}) carries the patch stack.`
        : "None",
    };
    await Bun.write(`${out}/${dir}/README.chromium`, renderReadme(readme));
  });
  let removed = 0;
  if (existsSync(out)) {
    for (const d of readdirSync(out, { withFileTypes: true })) {
      if (d.isDirectory() && !dirs.includes(d.name)) {
        rmSync(`${out}/${d.name}`, { recursive: true, force: true });
        removed++;
      }
    }
  }
  return { written: dirs.length, removed, dirs };
}
