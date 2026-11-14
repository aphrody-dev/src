// SPDX-License-Identifier: Apache-2.0
/**
 * Automated Real-Condition Browser, Web Vitals, Accessibility, Agent-Browser & Lighthouse Runner
 * Executes live end-to-end verification against local and production URLs.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import type { RealWebVitals } from "../browser/cdp-client.ts";
import {
  findAgentBrowserBinary,
  findLocalChromiumBinary,
  launchHeadlessChromium,
} from "../browser/launcher.ts";

export interface RealChromiumAuditReport {
  url: string;
  auditedAt: string;
  title: string;
  vitals: RealWebVitals;
  consoleErrors: string[];
  pageExceptions: string[];
  accessibility: {
    totalNodes: number;
    landmarks: string[];
    headings: string[];
  };
  externalGoogleLinks: string[];
  screenshotBytes: number;
  passed: boolean;
}

export interface AgentBrowserAuditReport {
  url: string;
  binaryPath: string;
  exitCode: number;
  snapshotLines: number;
  outputPreview: string;
  passed: boolean;
}

export interface LighthouseAuditReport {
  url: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  fcpMs: number;
  lcpMs: number;
  tbtMs: number;
  cls: number;
  passed: boolean;
}

export function findLighthouseBinary(): string | null {
  const candidates = [
    join(homedir(), ".bun/bin", process.platform === "win32" ? "lighthouse.exe" : "lighthouse"),
    join(homedir(), ".local/bin", process.platform === "win32" ? "lighthouse.exe" : "lighthouse"),
    join(Bun.env.USERPROFILE || Bun.env.HOME || "", ".bun/bin/lighthouse.exe"),
    join(Bun.env.USERPROFILE || Bun.env.HOME || "", ".bun/bin/lighthouse"),
  ];
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  return Bun.which("lighthouse") ?? null;
}

export async function auditUrlInRealChromium(
  url: string,
  options?: {
    forbidExternalGoogleLinks?: boolean;
    maxLcpMs?: number;
    maxCls?: number;
    timeoutMs?: number;
  },
): Promise<RealChromiumAuditReport> {
  await using browser = await launchHeadlessChromium({
    timeoutMs: options?.timeoutMs ?? 20_000,
  });
  const consoleErrors: string[] = [];
  const pageExceptions: string[] = [];

  await browser.client.send("Log.enable").catch(() => undefined);
  await browser.client.send("Runtime.enable").catch(() => undefined);

  browser.client.on("Runtime.consoleAPICalled", (params) => {
    if (params.type === "error") {
      const args = Array.isArray(params.args) ? params.args : [];
      const msg = args
        .map((a: Record<string, unknown>) =>
          String(a.value ?? a.description ?? ""),
        )
        .join(" ")
        .trim();
      if (msg) consoleErrors.push(msg);
    }
  });

  browser.client.on("Runtime.exceptionThrown", (params) => {
    const details = (params.exceptionDetails ?? {}) as { text?: string };
    if (details.text) pageExceptions.push(details.text);
  });

  const nav = await browser.client.navigate(url, { waitUntil: "networkidle0" });
  if (nav.errorText) {
    pageExceptions.push(`Navigation error: ${nav.errorText}`);
  }

  // Allow LCP / layout-shift observers a brief frame settle window
  await Bun.sleep(150);

  const [title, vitals, accessibility, externalGoogleLinks, screenshot] =
    await Promise.all([
      browser.client.evaluate<string>("document.title || ''"),
      browser.client.collectWebVitals(),
      browser.client.getAccessibilitySummary(),
      browser.client.evaluate<string[]>(`(() => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map((a) => a.getAttribute("href") || "")
        .filter((href) => /^https?:\\/\\/([a-z0-9-]+\\.)*google\\.[a-z.]+/i.test(href));
    })()`),
      browser.client.captureScreenshot({ format: "webp", quality: 80 }),
    ]);

  const maxLcpMs = options?.maxLcpMs ?? 2500;
  const maxCls = options?.maxCls ?? 0.1;
  const googleClean = options?.forbidExternalGoogleLinks
    ? externalGoogleLinks.length === 0
    : true;

  const passed =
    pageExceptions.length === 0 &&
    consoleErrors.length === 0 &&
    vitals.lcpMs <= maxLcpMs &&
    vitals.cls <= maxCls &&
    accessibility.landmarks.length > 0 &&
    googleClean;

  return {
    url,
    auditedAt: new Date().toISOString(),
    title,
    vitals,
    consoleErrors,
    pageExceptions,
    accessibility,
    externalGoogleLinks,
    screenshotBytes: screenshot.byteLength,
    passed,
  };
}

export async function runAgentBrowserSnapshot(
  url: string,
  sessionName?: string,
): Promise<AgentBrowserAuditReport> {
  const binaryPath = findAgentBrowserBinary();
  if (!binaryPath) {
    throw new Error(
      "agent-browser binary not found in ~/.local/bin or PATH",
    );
  }

  const session = sessionName ?? `qa-${Date.now()}`;
  const openProc = Bun.spawn([binaryPath, "--session", session, "open", url], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const openExit = await openProc.exited;
  const openOut = await new Response(openProc.stdout).text();
  const openErr = await new Response(openProc.stderr).text();

  const snapProc = Bun.spawn(
    [binaryPath, "--session", session, "snapshot", "-i"],
    {
      stdout: "pipe",
      stderr: "pipe",
    },
  );
  const snapExit = await snapProc.exited;
  const snapOut = await new Response(snapProc.stdout).text();

  const closeProc = Bun.spawn([binaryPath, "--session", session, "close"], {
    stdout: "ignore",
    stderr: "ignore",
  });
  await closeProc.exited.catch(() => undefined);

  const combined = `${openOut}\n${snapOut}`.trim();
  const lines = combined ? combined.split(/\r?\n/).length : 0;

  return {
    url,
    binaryPath,
    exitCode: openExit === 0 ? snapExit : openExit,
    snapshotLines: lines,
    outputPreview: (combined || openErr).slice(0, 600),
    passed: openExit === 0 && snapExit === 0 && lines > 0,
  };
}

export async function runLighthouseAudit(
  url: string,
): Promise<LighthouseAuditReport> {
  const lhBin = findLighthouseBinary();
  if (!lhBin) {
    throw new Error(
      "lighthouse binary not found in ~/.bun/bin/lighthouse.exe or PATH",
    );
  }
  const chromePath = findLocalChromiumBinary();
  if (!chromePath) {
    throw new Error("Chromium/Chrome binary not found for Lighthouse");
  }

  const outDir = mkdtempSync(join(tmpdir(), "lh-audit-"));
  const reportPath = join(outDir, "report.json");
  const profileDir = join(outDir, "chrome-profile");

  try {
    const proc = Bun.spawn(
      [
        lhBin,
        url,
        "--output=json",
        `--output-path=${reportPath}`,
        "--only-categories=performance,accessibility,best-practices,seo",
        "--form-factor=desktop",
        "--screenEmulation.disabled",
        "--throttling-method=provided",
        "--quiet",
        `--chrome-flags=--headless=new --no-first-run --no-default-browser-check --disable-gpu-sandbox --user-data-dir=${profileDir}`,
      ],
      {
        env: {
          ...Bun.env,
          CHROME_PATH: chromePath,
        },
        stdout: "ignore",
        stderr: "pipe",
      },
    );

    await proc.exited;
    if (!existsSync(reportPath)) {
      const errText = await new Response(proc.stderr).text();
      throw new Error(
        `Lighthouse did not produce report.json: ${errText.slice(0, 500)}`,
      );
    }

    const raw = JSON.parse(readFileSync(reportPath, "utf8")) as {
      categories?: Record<string, { score?: number | null }>;
      audits?: Record<string, { numericValue?: number }>;
    };

    const score = (key: string) =>
      Math.round(((raw.categories?.[key]?.score ?? 0) as number) * 100);
    const metric = (key: string) =>
      Math.round(((raw.audits?.[key]?.numericValue ?? 0) as number) * 100) /
      100;

    const performance = score("performance");
    const accessibility = score("accessibility");
    const bestPractices = score("best-practices");
    const seo = score("seo");

    return {
      url,
      performance,
      accessibility,
      bestPractices,
      seo,
      fcpMs: metric("first-contentful-paint"),
      lcpMs: metric("largest-contentful-paint"),
      tbtMs: metric("total-blocking-time"),
      cls: metric("cumulative-layout-shift"),
      passed:
        performance >= 90 &&
        accessibility >= 95 &&
        bestPractices >= 95 &&
        seo >= 95,
    };
  } finally {
    try {
      rmSync(outDir, { recursive: true, force: true });
    } catch {}
  }
}
