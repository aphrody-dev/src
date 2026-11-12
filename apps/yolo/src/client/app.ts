// SPDX-License-Identifier: Apache-2.0
/**
 * Yolo Fullstack Client Entry
 * Registers <aphrody-pet>, consumes build-time M3 virtual icon modules,
 * and drives AST Module Graph, Bun Primitives, M3 Symbols, and 3-VPS Cluster inspectors.
 */
import iconBolt from "m3:icon/rounded/bolt?size=18";
import iconLayers from "m3:icon/rounded/layers?size=18";
import iconPets from "m3:icon/rounded/pets?size=18";
import iconSearch from "m3:icon/rounded/search?size=18";
import iconTerminal from "m3:icon/rounded/terminal?size=18";
import {
  type AphrodyPetElement,
  defineAphrodyPet,
} from "../../../../packages/google-design/src/pets/element.ts";

defineAphrodyPet();

interface SsrBootstrapState {
  bunVersion?: string;
  moduleCount?: number;
  seedHex?: string;
}

function readSsrState(): SsrBootstrapState {
  const el = document.getElementById("yolo-ssr-state");
  if (!el?.textContent) return {};
  try {
    return JSON.parse(el.textContent) as SsrBootstrapState;
  } catch {
    return {};
  }
}

function decorateNavIcons(): void {
  const iconMap: Record<string, string> = {
    overview: iconPets,
    graph: iconLayers,
    primitives: iconBolt,
    icons: iconTerminal,
    cluster: iconSearch,
  };
  for (const btn of document.querySelectorAll<HTMLButtonElement>(
    ".nav-tab[data-panel]",
  )) {
    const panel = btn.dataset.panel || "";
    const svg = iconMap[panel];
    if (svg) {
      const slot = btn.querySelector<HTMLElement>(".nav-icon-slot");
      if (slot) {
        slot.innerHTML = svg;
      }
    }
  }
}

function setupNavigation(): void {
  const tabs = Array.from(
    document.querySelectorAll<HTMLButtonElement>(".nav-tab[data-panel]"),
  );
  const panels = Array.from(
    document.querySelectorAll<HTMLElement>(".stage-panel"),
  );

  const activate = (targetId: string) => {
    for (const tab of tabs) {
      tab.classList.toggle("is-active", tab.dataset.panel === targetId);
    }
    for (const p of panels) {
      const match = p.id === `panel-${targetId}`;
      p.hidden = !match;
      p.classList.toggle("is-visible", match);
    }
    if (targetId === "graph") void loadGraph();
    if (targetId === "primitives") void loadPrimitives();
    if (targetId === "icons") void loadIcons("");
    if (targetId === "cluster") void runClusterSearch();
  };

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      if (tab.dataset.panel) activate(tab.dataset.panel);
    });
  }
}

function setupThemeAndSeed(): void {
  const toggleBtn = document.getElementById("theme-toggle-btn");
  const seedInput = document.getElementById(
    "seed-color-input",
  ) as HTMLInputElement | null;

  toggleBtn?.addEventListener("click", () => {
    const html = document.documentElement;
    const next = html.dataset.theme === "dark" ? "light" : "dark";
    html.dataset.theme = next;
    toggleBtn.textContent = next === "dark" ? "Light Theme" : "Dark Theme";
  });

  seedInput?.addEventListener("input", async () => {
    const hex = seedInput.value;
    const res = await fetch(`/api/theme?seed=${encodeURIComponent(hex)}`);
    if (!res.ok) return;
    const { css } = (await res.json()) as { css: string };
    const styleEl = document.getElementById("yolo-m3-theme");
    if (styleEl) styleEl.textContent = css;
  });
}

function setupPetControls(): void {
  const pet = document.getElementById("yolo-pet") as AphrodyPetElement | null;
  const badge = document.getElementById("pet-status-badge");
  const buttons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("#pet-controls .chip-btn"),
  );
  if (!pet) return;

  for (const btn of buttons) {
    btn.addEventListener("click", () => {
      for (const b of buttons) b.classList.toggle("is-selected", b === btn);
      if (btn.dataset.petMode === "ambient") {
        pet.clearState();
        pet.play(null);
        if (badge) badge.textContent = "ambient · 16-way gaze";
      } else if (btn.dataset.petState) {
        pet.play(null);
        pet.setState(btn.dataset.petState);
        if (badge) badge.textContent = `state:${btn.dataset.petState}`;
      } else if (btn.dataset.petPlay) {
        pet.play(btn.dataset.petPlay);
        if (badge) badge.textContent = `play:${btn.dataset.petPlay}`;
      }
    });
  }
}

async function loadGraph(rescan = false): Promise<void> {
  const tbody = document.getElementById("graph-tbody");
  if (!tbody) return;
  const res = await fetch(rescan ? "/api/graph?rescan=1" : "/api/graph");
  if (!res.ok) return;
  const data = (await res.json()) as {
    totalModules: number;
    modules: Array<{
      relPath: string;
      kind: string;
      bytes: number;
      lines: number;
      exports: string[];
      imports: Array<{ specifier: string }>;
      blake3Hash: string;
    }>;
  };
  const modKpi = document.getElementById("kpi-mod-count");
  if (modKpi) modKpi.textContent = `${data.totalModules} files`;

  tbody.innerHTML = data.modules
    .map(
      (m) => `<tr>
        <td><code>${escapeHtml(m.relPath)}</code></td>
        <td>${escapeHtml(m.kind.toUpperCase())}</td>
        <td>${(m.bytes / 1024).toFixed(1)} KB</td>
        <td>${m.lines}</td>
        <td>${m.exports.length} exp / ${m.imports.length} imp</td>
        <td><code>${escapeHtml(m.blake3Hash.slice(0, 14))}</code></td>
      </tr>`,
    )
    .join("");
}

async function loadPrimitives(): Promise<void> {
  const grid = document.getElementById("primitives-grid");
  if (!grid) return;
  const res = await fetch("/api/primitives");
  if (!res.ok) return;
  const report = (await res.json()) as {
    items: Array<{
      api: string;
      durationMs: number;
      verified: boolean;
      detail: string;
    }>;
  };

  grid.innerHTML = report.items
    .map(
      (it) => `<article class="mini-card">
        <div class="mini-card-head">
          <span>${escapeHtml(it.api)}</span>
          <span class="badge-pill">${it.verified ? "PASS" : "FAIL"} · ${it.durationMs}ms</span>
        </div>
        <div class="helper-text">${escapeHtml(it.detail)}</div>
      </article>`,
    )
    .join("");
}

async function loadIcons(filter: string): Promise<void> {
  const grid = document.getElementById("icons-grid");
  if (!grid) return;
  const res = await fetch(`/api/icons?q=${encodeURIComponent(filter)}`);
  if (!res.ok) return;
  const data = (await res.json()) as {
    icons: Array<{ name: string; svg: string }>;
  };

  grid.innerHTML = data.icons
    .map(
      (ic) => `<div class="icon-tile">
        ${ic.svg}
        <span>${escapeHtml(ic.name)}</span>
      </div>`,
    )
    .join("");
}

async function runClusterSearch(): Promise<void> {
  const input = document.getElementById(
    "cluster-query-input",
  ) as HTMLInputElement | null;
  const nodesGrid = document.getElementById("cluster-nodes-grid");
  const stack = document.getElementById("cluster-results-stack");
  if (!nodesGrid || !stack) return;

  const q = input?.value ?? "aphrody";
  const [healthRes, searchRes] = await Promise.all([
    fetch("/api/cluster/health"),
    fetch(`/api/cluster/search?q=${encodeURIComponent(q)}`),
  ]);

  if (healthRes.ok) {
    const health = (await healthRes.json()) as {
      nodes: Array<{
        spec: {
          id: string;
          publicIp: string;
          wireguardIp: string;
          role: string;
          allowNonGoogleWorkloads: boolean;
        };
        indexedDocs: number;
      }>;
    };
    nodesGrid.innerHTML = health.nodes
      .map(
        (n) => `<div class="mini-card">
          <div class="mini-card-head">
            <span>Node ${escapeHtml(n.spec.id.toUpperCase())}</span>
            <span class="badge-pill">${escapeHtml(n.spec.wireguardIp)}</span>
          </div>
          <div class="helper-text">
            Public: <code>${escapeHtml(n.spec.publicIp)}</code><br/>
            Role: ${escapeHtml(n.spec.role)}<br/>
            Docs: ${n.indexedDocs} · Non-Google Workloads: ${n.spec.allowNonGoogleWorkloads ? "Yes" : "Blocked"}
          </div>
        </div>`,
      )
      .join("");
  }

  if (searchRes.ok) {
    const result = (await searchRes.json()) as {
      tookMs: number;
      hits: Array<{
        url: string;
        title: string;
        snippet: string;
        rrfScore: number;
        sources: string[];
      }>;
    };
    stack.innerHTML = result.hits
      .map(
        (h) => `<article class="result-item">
          <div><a href="${escapeHtml(h.url)}">${escapeHtml(h.title)}</a></div>
          <div class="helper-text">${escapeHtml(h.snippet)}</div>
          <small class="badge-pill">RRF ${h.rrfScore} · ${escapeHtml(h.sources.join(", "))} · ${result.tookMs}ms</small>
        </article>`,
      )
      .join("");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bootstrap(): void {
  const ssr = readSsrState();
  const bunVerEl = document.getElementById("kpi-bun-ver");
  if (bunVerEl && ssr.bunVersion)
    bunVerEl.textContent = `Bun ${ssr.bunVersion}`;
  const modEl = document.getElementById("kpi-mod-count");
  if (modEl && typeof ssr.moduleCount === "number")
    modEl.textContent = `${ssr.moduleCount} files`;

  decorateNavIcons();
  setupNavigation();
  setupThemeAndSeed();
  setupPetControls();

  document
    .getElementById("rescan-graph-btn")
    ?.addEventListener("click", () => void loadGraph(true));
  document
    .getElementById("run-primitives-btn")
    ?.addEventListener("click", () => void loadPrimitives());

  const iconInput = document.getElementById(
    "icon-filter-input",
  ) as HTMLInputElement | null;
  iconInput?.addEventListener("input", () => void loadIcons(iconInput.value));

  const clusterForm = document.getElementById("cluster-search-form");
  clusterForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void runClusterSearch();
  });
}

bootstrap();
