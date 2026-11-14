type ShowcaseSnapshot = {
  runtime_host: string;
  tab: string;
  preset_idx: number;
  preset_id: string;
  preset_name: string;
  dark: boolean;
  page_idx: number;
  page_id: string;
  page_title: string;
  target_idx: number;
  target_id: string;
  tiling_idx: number;
  tiling_name: string;
  tile_count: number;
  viewport_w: number;
  viewport_h: number;
  palette: Record<string, string>;
  css_variables: string;
  hyprland_conf: string;
  gpui_kit_json: Record<string, unknown>;
  manifest: {
    theme_count: number;
    component_count: number;
    page_count: number;
    target_count: number;
    bricks: Array<{
      brick: string;
      upstream: string;
      fork: string;
      role: string;
    }>;
  };
  rendered_frame: {
    a11y_node_count: number;
    scene_command_count: number;
    content_type: string;
    payload: string;
    vitals: {
      horizontal_overflow_px: number;
      window_class: string;
      inspected_nodes: number;
    };
    secondary_artifacts: Record<string, string>;
  };
  wayland_geometry: {
    zones: {
      top_bar: Rect;
      left_panel: Rect;
      right_panel: Rect;
      bottom_bar: Rect;
      usable_content: Rect;
    };
    tiles: Rect[];
  };
  gamescope_budget_ms: number;
  target_matrix: Array<{
    id: string;
    a11y_nodes: number;
    scene_commands: number;
    overflow_px: number;
    content_type: string;
  }>;
  components: string[];
  domains: string[];
  domain_filter: number | null;
  search_query: string;
  filtered_crates: Array<{
    dir: string;
    package: string;
    domain: string;
    layer: string;
    summary: string;
  }>;
  selected_crate_idx: number;
  third_party_bricks: Array<{
    name: string;
    version_or_pin: string;
    upstream: string;
    fork_or_location: string;
    category: string;
    features_exposed: string;
  }>;
  selected_brick_idx: number;
  abi_bridges: Array<{
    crate_dir: string;
    library: string;
    header: string;
    symbols: string[];
    consumers: string;
  }>;
  selected_abi_idx: number;
  first_party_total: number;
  third_party_total: number;
};

type Rect = { x: number; y: number; width: number; height: number };

const TABS = [
  "Overview",
  "UI Fusion",
  "Taffy Layout",
  "1P Crates",
  "3P & Forks",
  "C ABI & FFI",
];

const PRESETS = [
  "aphrody",
  "m3",
  "fluent",
  "hyprland",
  "omarchy",
  "catppuccin",
  "cachyos",
  "nord",
  "gruvbox",
];

const PAGES = [
  "studio-workspace",
  "intelligent-terminal",
  "wayland-browser-compositor",
  "design-system-gallery",
];

const TILING_MODES = ["MasterStack", "Dwindle", "Grid", "Monocle"];

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function boot() {
  const hostPill = document.getElementById("host-pill")!;
  const gpuStatus = document.getElementById("webgpu-status")!;
  const themeStyle = document.getElementById("dynamic-theme-vars")!;
  const presetSelect = document.getElementById(
    "preset-select",
  ) as HTMLSelectElement;
  const darkToggle = document.getElementById("dark-toggle")!;
  const tabList = document.getElementById("tab-list")!;
  const statsCard = document.getElementById("stats-card")!;
  const content = document.getElementById("content")!;
  const canvas = document.getElementById("gpu-canvas") as HTMLCanvasElement;

  const wasmMod = await import("./pkg/rust_showcase.js");
  await wasmMod.default();
  const showcase = new wasmMod.RustShowcaseWeb();

  let gpu: any = null;
  if ("gpu" in navigator) {
    try {
      gpu = await wasmMod.RustShowcaseWebGpu.create(canvas);
      gpuStatus.textContent = `WebGPU active: ${gpu.adapter_name()}`;
      canvas.addEventListener("click", (ev) => {
        if (!gpu) return;
        const r = canvas.getBoundingClientRect();
        const px = ((ev.clientX - r.left) / r.width) * canvas.width;
        const py = ((ev.clientY - r.top) / r.height) * canvas.height;
        const nextJson = gpu.click(px, py);
        if (nextJson && nextJson !== "{}") {
          const clickedSnap = JSON.parse(nextJson) as ShowcaseSnapshot;
          const tIdx = Math.max(
            0,
            TABS.findIndex(
              (t) =>
                t.toLowerCase().replace(/[^a-z0-9]/g, "") ===
                clickedSnap.tab.replace(/[^a-z0-9]/g, ""),
            ),
          );
          showcase.set_tab(
            clickedSnap.tab === "overview"
              ? 0
              : clickedSnap.tab === "fusion-ui"
                ? 1
                : clickedSnap.tab === "taffy-layout"
                  ? 2
                  : clickedSnap.tab === "first-party"
                    ? 3
                    : clickedSnap.tab === "third-party"
                      ? 4
                      : 5,
          );
          showcase.set_preset(clickedSnap.preset_idx);
          if (clickedSnap.dark !== snap.dark) showcase.toggle_dark();
          void tIdx;
          snap = JSON.parse(showcase.snapshot_json()) as ShowcaseSnapshot;
          render();
        }
      });
    } catch (err) {
      gpuStatus.textContent = `WebGPU canvas skipped (${String(err)}); WASM + M3 DOM fully active`;
    }
  } else {
    gpuStatus.textContent =
      "Browser WebGPU API unavailable; WASM + M3 DOM fully active";
  }

  let snap = JSON.parse(showcase.snapshot_json()) as ShowcaseSnapshot;
  let activeTab = 0;

  presetSelect.innerHTML = PRESETS.map(
    (p, i) => `<option value="${i}">${esc(p)}</option>`,
  ).join("");
  presetSelect.addEventListener("change", () => {
    snap = JSON.parse(showcase.set_preset(Number(presetSelect.value)));
    render();
  });

  darkToggle.addEventListener("click", () => {
    snap = JSON.parse(showcase.toggle_dark());
    render();
  });

  function syncGpu() {
    if (!gpu) return;
    gpu.sync_from_state(
      activeTab,
      snap.preset_idx,
      snap.dark,
      snap.page_idx,
      snap.target_idx,
      snap.tiling_idx,
      snap.tile_count,
      snap.domain_filter ?? -1,
      snap.selected_crate_idx,
      snap.selected_brick_idx,
      snap.selected_abi_idx,
    );
  }

  function render() {
    themeStyle.textContent = snap.css_variables;
    presetSelect.value = String(snap.preset_idx);
    darkToggle.textContent = snap.dark ? "Switch to Light" : "Switch to Dark";
    hostPill.textContent = `${snap.runtime_host} | ${snap.preset_id} (${snap.dark ? "dark" : "light"})`;

    tabList.innerHTML = TABS.map(
      (label, i) =>
        `<button class="tab-btn ${activeTab === i ? "active" : ""}" data-tab="${i}" type="button">${i + 1}. ${esc(label)}</button>`,
    ).join("");
    tabList.querySelectorAll<HTMLButtonElement>("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeTab = Number(btn.dataset.tab);
        snap = JSON.parse(showcase.set_tab(activeTab));
        render();
      });
    });

    statsCard.innerHTML = `
      <strong>Live WASM Diagnostics</strong>
      <div class="stats-grid" style="margin-top:10px">
        <span>1P Workspace Crates</span><strong>${snap.first_party_total}</strong>
        <span>3P Bricks &amp; Forks</span><strong>${snap.third_party_total}</strong>
        <span>C23 ABI Modules</span><strong>${snap.abi_bridges.length}</strong>
        <span>M3 Theme Presets</span><strong>${snap.manifest.theme_count}</strong>
        <span>Shared UI Primitives</span><strong>${snap.manifest.component_count}</strong>
        <span>Render Targets</span><strong>${snap.manifest.target_count}</strong>
        <span>AccessKit Nodes</span><strong>${snap.rendered_frame.a11y_node_count}</strong>
        <span>AnyRender Cmds</span><strong>${snap.rendered_frame.scene_command_count}</strong>
        <span>Horizontal Overflow</span><strong>${snap.rendered_frame.vitals.horizontal_overflow_px}px</strong>
        <span>WASM Scene Quads</span><strong>${showcase.quad_count()}</strong>
      </div>
    `;

    if (activeTab === 0) renderOverview();
    else if (activeTab === 1) renderFusion();
    else if (activeTab === 2) renderTaffy();
    else if (activeTab === 3) renderCrates();
    else if (activeTab === 4) renderThirdParty();
    else renderAbi();

    syncGpu();
  }

  function renderOverview() {
    content.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card"><h3>${snap.first_party_total} First-Party Crates</h3><p>Edition 2024 flat Cargo workspace across L0-L5.</p></div>
        <div class="kpi-card"><h3>${snap.third_party_total} Third-Party &amp; Forks</h3><p>DioxusLabs, Linebender, Zed GPUI, Longbridge NSH/Kit, Bevy, wgpu 30.</p></div>
        <div class="kpi-card"><h3>Taffy 0.15.1 Layer-0</h3><p>Absorbed first-party with WaylandShellZones &amp; 4 tilers.</p></div>
        <div class="kpi-card"><h3>11 Render Targets</h3><p>TUI, CLI, Web/WASM SSR, WebGPU, GPUI, OCAP, Winit, WinUI3, Mobile, Wayland, Unix.</p></div>
      </div>
      <div class="card">
        <h3>Dynamic M3 HCT Palette (${esc(snap.preset_name)})</h3>
        <div class="swatch-row">
          ${Object.entries(snap.palette)
            .map(([k, v]) => {
              const hex = v.replace("#", "");
              const r = parseInt(hex.slice(0, 2), 16) || 0;
              const g = parseInt(hex.slice(2, 4), 16) || 0;
              const b = parseInt(hex.slice(4, 6), 16) || 0;
              const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
              const fg = lum > 0.45 ? "#11131C" : "#F8FAFC";
              return `<div class="swatch" style="background:${esc(v)};color:${fg};word-break:break-word;font-size:0.74rem">${esc(k)}<div class="mono">${esc(v)}</div></div>`;
            })
            .join("")}
        </div>
        <h3>Fused Upstream Bricks in <code>aphrody-ui::fusion</code></h3>
        <div class="list-scroll">
          ${snap.manifest.bricks.map((b) => `<div class="card"><strong>${esc(b.brick)}</strong> &larr; <span class="mono">${esc(b.upstream)}</span> (fork: <span class="mono">${esc(b.fork)}</span>)<div class="muted">${esc(b.role)}</div></div>`).join("")}
        </div>
      </div>
    `;
  }

  function renderFusion() {
    content.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <h3>4 Canonical Pages</h3>
        <div class="pill-row">
          ${PAGES.map((pg, i) => `<button class="${snap.page_idx === i ? "active" : ""}" data-page="${i}">${esc(pg)}</button>`).join("")}
        </div>
        <h3>11 Native Render Targets</h3>
        <div class="pill-row">
          ${snap.target_matrix.map((t, i) => `<button class="${snap.target_idx === i ? "active" : ""}" data-target="${i}">${esc(t.id)} (${t.a11y_nodes} a11y)</button>`).join("")}
        </div>
      </div>
      <div class="split-2">
        <div class="card">
          <h3>Live Rendered Frame: <span class="mono">${esc(snap.page_id)}</span> on <span class="mono">${esc(snap.target_id)}</span></h3>
          <p class="muted">Content-Type: ${esc(snap.rendered_frame.content_type)} | AnyRender: ${snap.rendered_frame.scene_command_count} cmds | CWV Overflow: ${snap.rendered_frame.vitals.horizontal_overflow_px}px</p>
          <pre class="code-box">${esc(snap.rendered_frame.payload.slice(0, 5000))}</pre>
        </div>
        <div class="card">
          <h3>23 Shared Primitives &amp; Secondary Artifacts</h3>
          <div class="pill-row">${snap.components.map((c) => `<span class="chip-info mono">${esc(c)}</span>`).join("")}</div>
          <h4>Hyprland Config Export</h4>
          <pre class="code-box">${esc(snap.hyprland_conf)}</pre>
        </div>
      </div>
    `;
    content.querySelectorAll<HTMLButtonElement>("[data-page]").forEach((b) => {
      b.onclick = () => {
        snap = JSON.parse(showcase.set_page(Number(b.dataset.page)));
        render();
      };
    });
    content
      .querySelectorAll<HTMLButtonElement>("[data-target]")
      .forEach((b) => {
        b.onclick = () => {
          snap = JSON.parse(showcase.set_target(Number(b.dataset.target)));
          render();
        };
      });
  }

  function renderTaffy() {
    const z = snap.wayland_geometry.zones;
    const w = snap.viewport_w;
    const h = snap.viewport_h;
    content.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <h3>First-Party <code>crates/taffy</code> 0.15.1 Wayland &amp; Tiling Geometry Solver</h3>
        <div class="pill-row">
          ${TILING_MODES.map((m, i) => `<button class="${snap.tiling_idx === i ? "active" : ""}" data-tiling="${i}">${esc(m)}</button>`).join("")}
          <button id="tile-dec" type="button">- Tile</button>
          <span class="chip-info">Tiles: ${snap.tile_count}</span>
          <button id="tile-inc" type="button">+ Tile</button>
        </div>
        <svg class="taffy-svg" viewBox="0 0 ${w} ${h}">
          <rect x="${z.top_bar.x}" y="${z.top_bar.y}" width="${z.top_bar.width}" height="${z.top_bar.height}" fill="${snap.palette.surface_container_high}" stroke="${snap.palette.outline}" />
          <rect x="${z.left_panel.x}" y="${z.left_panel.y}" width="${z.left_panel.width}" height="${z.left_panel.height}" fill="${snap.palette.surface_container_high}" stroke="${snap.palette.outline}" />
          <rect x="${z.right_panel.x}" y="${z.right_panel.y}" width="${z.right_panel.width}" height="${z.right_panel.height}" fill="${snap.palette.surface_container_high}" stroke="${snap.palette.outline}" />
          <rect x="${z.bottom_bar.x}" y="${z.bottom_bar.y}" width="${z.bottom_bar.width}" height="${z.bottom_bar.height}" fill="${snap.palette.surface_container_high}" stroke="${snap.palette.outline}" />
          ${snap.wayland_geometry.tiles
            .map(
              (t, i) => `
            <rect x="${t.x}" y="${t.y}" width="${t.width}" height="${t.height}" rx="12" fill="${snap.palette.primary_container}" stroke="${snap.palette.primary}" stroke-width="2" />
            <text x="${t.x + 12}" y="${t.y + 26}" fill="${snap.palette.on_primary_container || snap.palette.on_surface}" font-size="13" font-weight="600">#${i + 1} (${Math.round(t.width)}x${Math.round(t.height)})</text>
          `,
            )
            .join("")}
        </svg>
      </div>
    `;
    content
      .querySelectorAll<HTMLButtonElement>("[data-tiling]")
      .forEach((b) => {
        b.onclick = () => {
          snap = JSON.parse(showcase.set_tiling(Number(b.dataset.tiling)));
          render();
        };
      });
    document.getElementById("tile-dec")!.onclick = () => {
      snap = JSON.parse(showcase.set_tile_count(snap.tile_count - 1));
      render();
    };
    document.getElementById("tile-inc")!.onclick = () => {
      snap = JSON.parse(showcase.set_tile_count(snap.tile_count + 1));
      render();
    };
  }

  function renderCrates() {
    const sel = snap.filtered_crates[snap.selected_crate_idx];
    content.innerHTML = `
      <div class="card" style="margin-bottom:16px">
        <div class="pill-row">
          <input id="crate-search" type="search" placeholder="Filter 82 crates..." value="${esc(snap.search_query)}" />
          <button class="${snap.domain_filter === null ? "active" : ""}" data-dom="-1">All</button>
          ${snap.domains.map((d, i) => `<button class="${snap.domain_filter === i ? "active" : ""}" data-dom="${i}">${esc(d)}</button>`).join("")}
        </div>
      </div>
      <div class="split-2">
        <div class="card list-scroll">
          ${snap.filtered_crates.map((c, i) => `<button class="list-item ${i === snap.selected_crate_idx ? "active" : ""}" data-crate="${i}"><span><strong>crates/${esc(c.dir)}</strong> (${esc(c.package)})</span><span class="mono">${esc(c.layer)}</span></button>`).join("")}
        </div>
        <div class="card">
          ${
            sel
              ? `
            <span class="chip-info">${esc(sel.layer)} | ${esc(sel.domain)}</span>
            <h2>crates/${esc(sel.dir)}</h2>
            <p class="mono">Cargo package: ${esc(sel.package)}</p>
            <p>${esc(sel.summary)}</p>
          `
              : "<p>No matching crates.</p>"
          }
        </div>
      </div>
    `;
    const searchEl = document.getElementById(
      "crate-search",
    ) as HTMLInputElement;
    searchEl.oninput = () => {
      snap = JSON.parse(showcase.set_search(searchEl.value));
      render();
      const el = document.getElementById(
        "crate-search",
      ) as HTMLInputElement | null;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    };
    content.querySelectorAll<HTMLButtonElement>("[data-dom]").forEach((b) => {
      b.onclick = () => {
        snap = JSON.parse(showcase.set_domain(Number(b.dataset.dom)));
        render();
      };
    });
    content.querySelectorAll<HTMLButtonElement>("[data-crate]").forEach((b) => {
      b.onclick = () => {
        snap = JSON.parse(showcase.select_crate(Number(b.dataset.crate)));
        render();
      };
    });
  }

  function renderThirdParty() {
    const b = snap.third_party_bricks[snap.selected_brick_idx];
    content.innerHTML = `
      <div class="split-2">
        <div class="card list-scroll">
          ${snap.third_party_bricks.map((x, i) => `<button class="list-item ${i === snap.selected_brick_idx ? "active" : ""}" data-brick="${i}"><strong>${esc(x.name)}</strong><span class="mono">${esc(x.category)}</span></button>`).join("")}
        </div>
        <div class="card">
          ${
            b
              ? `
            <span class="chip-info">${esc(b.category)}</span>
            <h2>${esc(b.name)}</h2>
            <p class="mono">Pin: ${esc(b.version_or_pin)}</p>
            <p class="mono">Upstream: ${esc(b.upstream)}</p>
            <p class="mono">Fork / Crate: ${esc(b.fork_or_location)}</p>
            <p>${esc(b.features_exposed)}</p>
          `
              : ""
          }
        </div>
      </div>
    `;
    content
      .querySelectorAll<HTMLButtonElement>("[data-brick]")
      .forEach((btn) => {
        btn.onclick = () => {
          snap = JSON.parse(showcase.select_brick(Number(btn.dataset.brick)));
          render();
        };
      });
  }

  function renderAbi() {
    const a = snap.abi_bridges[snap.selected_abi_idx];
    content.innerHTML = `
      <div class="split-2">
        <div class="card list-scroll">
          ${snap.abi_bridges.map((x, i) => `<button class="list-item ${i === snap.selected_abi_idx ? "active" : ""}" data-abi="${i}"><strong>${esc(x.library)}</strong><span class="mono">${x.symbols.length} C syms</span></button>`).join("")}
        </div>
        <div class="card">
          ${
            a
              ? `
            <span class="chip-info">${esc(a.crate_dir)}</span>
            <h2>${esc(a.library)}</h2>
            <p class="mono">Header: ${esc(a.header)}</p>
            <p>Consumers: ${esc(a.consumers)}</p>
            <pre class="code-box">${esc(a.symbols.join("\n"))}</pre>
          `
              : ""
          }
        </div>
      </div>
    `;
    content.querySelectorAll<HTMLButtonElement>("[data-abi]").forEach((btn) => {
      btn.onclick = () => {
        snap = JSON.parse(showcase.select_abi(Number(btn.dataset.abi)));
        render();
      };
    });
  }

  render();
}

boot().catch((err) => {
  const pill = document.getElementById("host-pill");
  if (pill) pill.textContent = `Init failed: ${String(err)}`;
  console.error(err);
});
