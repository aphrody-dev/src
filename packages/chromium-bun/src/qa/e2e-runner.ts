// SPDX-License-Identifier: Apache-2.0
/**
 * Automated Real-Condition Local & Production E2E Verification Suite
 * Drives real Headless Chromium CDP, agent-browser.exe accessibility snapshots,
 * and Google Lighthouse CLI against:
 *   1. Local @aphrody/web (apps/aphrody) production server
 *   2. Local @aphrody/yolo (apps/yolo) fullstack framework server
 *   3. Live Production https://aphrody.com/
 */
import { join, resolve } from "node:path";
import {
  type AgentBrowserAuditReport,
  auditUrlInRealChromium,
  type LighthouseAuditReport,
  type RealChromiumAuditReport,
  runAgentBrowserSnapshot,
  runLighthouseAudit,
} from "./real-browser-audit.ts";

export interface TargetE2eResult {
  name: string;
  url: string;
  cdp: RealChromiumAuditReport;
  agentBrowser: AgentBrowserAuditReport | null;
  lighthouse: LighthouseAuditReport | null;
  apiChecks: Record<string, boolean>;
}

export interface FullE2eSuiteReport {
  timestamp: string;
  allLocalPassed: boolean;
  targets: TargetE2eResult[];
}

async function waitForHttpOk(url: string, timeoutMs = 8000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await Bun.sleep(120);
  }
  return false;
}

export async function runFullE2eRealConditionSuite(options?: {
  monorepoRoot?: string;
  withLighthouse?: boolean;
  withAgentBrowser?: boolean;
  includeProd?: boolean;
  prodUrl?: string;
}): Promise<FullE2eSuiteReport> {
  const root = resolve(
    options?.monorepoRoot ?? join(import.meta.dir, "../../../.."),
  );
  const withLighthouse = options?.withLighthouse ?? true;
  const withAgentBrowser = options?.withAgentBrowser ?? true;
  const includeProd = options?.includeProd ?? true;
  const prodUrl = options?.prodUrl ?? "https://aphrody.com/";

  const aphrodyPort = 39101;
  const yoloPort = 39102;

  const aphrodyProc = Bun.spawn(["bun", "run", "server.ts"], {
    cwd: join(root, "apps", "aphrody"),
    env: { ...process.env, PORT: String(aphrodyPort) },
    stdout: "ignore",
    stderr: "ignore",
  });

  const yoloProc = Bun.spawn(["bun", "run", "server.ts"], {
    cwd: join(root, "apps", "yolo"),
    env: { ...process.env, PORT: String(yoloPort) },
    stdout: "ignore",
    stderr: "ignore",
  });

  const targets: TargetE2eResult[] = [];

  try {
    const aphrodyUrl = `http://127.0.0.1:${aphrodyPort}/`;
    const yoloUrl = `http://127.0.0.1:${yoloPort}/`;

    const [aphrodyReady, yoloReady] = await Promise.all([
      waitForHttpOk(`${aphrodyUrl}ok`),
      waitForHttpOk(`${yoloUrl}ok`),
    ]);

    if (!aphrodyReady) {
      throw new Error(`apps/aphrody failed to start on ${aphrodyUrl}`);
    }
    if (!yoloReady) {
      throw new Error(`apps/yolo failed to start on ${yoloUrl}`);
    }

    // 1. Audit Local apps/aphrody
    const aphrodySearchRes = await fetch(`${aphrodyUrl}api/search?q=aphrody`);
    const aphrodyDocxRes = await fetch(`${aphrodyUrl}api/office/docx`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "E2E Spec",
        paragraphs: ["Real E2E OOXML check"],
      }),
    });
    const aphrodyDocxBytes = new Uint8Array(await aphrodyDocxRes.arrayBuffer());

    const aphrodyCdp = await auditUrlInRealChromium(aphrodyUrl, {
      forbidExternalGoogleLinks: true,
    });
    const aphrodyAb = withAgentBrowser
      ? await runAgentBrowserSnapshot(aphrodyUrl)
      : null;
    const aphrodyLh = withLighthouse
      ? await runLighthouseAudit(aphrodyUrl)
      : null;

    targets.push({
      name: "local:apps/aphrody",
      url: aphrodyUrl,
      cdp: aphrodyCdp,
      agentBrowser: aphrodyAb,
      lighthouse: aphrodyLh,
      apiChecks: {
        clusterSearchOk: aphrodySearchRes.ok,
        docxPkzipMagic:
          aphrodyDocxRes.ok &&
          aphrodyDocxBytes[0] === 0x50 &&
          aphrodyDocxBytes[1] === 0x4b,
      },
    });

    // 2. Audit Local apps/yolo
    const yoloPrimsRes = await fetch(`${yoloUrl}api/primitives`);
    const yoloGraphRes = await fetch(`${yoloUrl}api/graph`);
    const yoloCdp = await auditUrlInRealChromium(yoloUrl, {
      forbidExternalGoogleLinks: true,
    });
    const yoloAb = withAgentBrowser
      ? await runAgentBrowserSnapshot(yoloUrl)
      : null;
    const yoloLh = withLighthouse ? await runLighthouseAudit(yoloUrl) : null;

    targets.push({
      name: "local:apps/yolo",
      url: yoloUrl,
      cdp: yoloCdp,
      agentBrowser: yoloAb,
      lighthouse: yoloLh,
      apiChecks: {
        primitivesOk: yoloPrimsRes.ok,
        moduleGraphOk: yoloGraphRes.ok,
      },
    });

    // 3. Audit Live Production https://aphrody.com/
    if (includeProd) {
      const prodReachable = await waitForHttpOk(prodUrl, 5000);
      if (prodReachable) {
        const prodCdp = await auditUrlInRealChromium(prodUrl, {
          forbidExternalGoogleLinks: false,
        });
        const prodAb = withAgentBrowser
          ? await runAgentBrowserSnapshot(prodUrl)
          : null;
        const prodLh = withLighthouse
          ? await runLighthouseAudit(prodUrl)
          : null;
        targets.push({
          name: "prod:aphrody.com",
          url: prodUrl,
          cdp: prodCdp,
          agentBrowser: prodAb,
          lighthouse: prodLh,
          apiChecks: {
            httpsReachable: true,
          },
        });
      }
    }
  } finally {
    try {
      aphrodyProc.kill();
    } catch {
      // ignore
    }
    try {
      yoloProc.kill();
    } catch {
      // ignore
    }
  }

  const localTargets = targets.filter((t) => t.name.startsWith("local:"));
  const allLocalPassed = localTargets.every(
    (t) =>
      t.cdp.passed &&
      Object.values(t.apiChecks).every(Boolean) &&
      (t.lighthouse === null || t.lighthouse.passed),
  );

  return {
    timestamp: new Date().toISOString(),
    allLocalPassed,
    targets,
  };
}
