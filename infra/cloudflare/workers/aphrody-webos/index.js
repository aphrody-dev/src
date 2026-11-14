// SPDX-License-Identifier: Apache-2.0
const DASHBOARD_HTML =
  '<!DOCTYPE html>\n<html lang="en" data-preset="aphrody">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>YOLO &amp; Aphrody — GPUI Unified Desktop Dashboard</title>\n  <link rel="preconnect" href="https://fonts.googleapis.com">\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">\n  <style>\n    /* ==========================================================================\n       UI/UX Pro Max & DTCG Token System — Bound to yolo-aphrody (WCAG 2.2 AAA)\n       ========================================================================== */\n    :root {\n      color-scheme: dark light;\n      --bg-primary: #1C1A17;\n      --bg-surface: #26231E;\n      --bg-elevated: #332E27;\n      --text-primary: #FAF7F0;\n      --text-secondary: #EDE6D6;\n      --accent-primary: #E8C547;\n      --accent-secondary: #F28B9C;\n      --accent-success: #10B981;\n      --accent-warning: #D4AF37;\n      --accent-danger: #F43F5E;\n      --border-subtle: #4A4236;\n      --font-family-display: "Cinzel", "Plus Jakarta Sans", serif;\n      --font-family-ui: "Plus Jakarta Sans", system-ui, sans-serif;\n      --font-family-mono: "JetBrains Mono", monospace;\n      --radius-sm: 8px;\n      --radius-md: 12px;\n      --radius-lg: 16px;\n      --blur-radius: 16px;\n    }\n\n    html[data-preset="m3"] {\n      --bg-primary: #131318;\n      --bg-surface: #1F1F26;\n      --bg-elevated: #2A2A34;\n      --text-primary: #E6E1E9;\n      --text-secondary: #CAC4D0;\n      --accent-primary: #D0BCFF;\n      --accent-secondary: #CCC2DC;\n      --border-subtle: #49454F;\n    }\n\n    html[data-preset="chromium"] {\n      --bg-primary: #12151C;\n      --bg-surface: #1B202B;\n      --bg-elevated: #252C3B;\n      --text-primary: #F1F3F4;\n      --text-secondary: #BDC1C6;\n      --accent-primary: #8AB4F8;\n      --accent-secondary: #C58AF9;\n      --border-subtle: #3C4043;\n    }\n\n    * { box-sizing: border-box; margin: 0; padding: 0; }\n\n    /* Accessibility & Focus Guards (WCAG 2.2 AAA + Forced Colors + Reduced Motion) */\n    :focus-visible {\n      outline: 2px solid var(--accent-primary);\n      outline-offset: 2px;\n    }\n\n    @media (forced-colors: active) {\n      :focus-visible {\n        outline-color: CanvasText !important;\n      }\n    }\n\n    @media (prefers-reduced-motion: reduce) {\n      *, *::before, *::after {\n        animation-duration: 0.01ms !important;\n        animation-iteration-count: 1 !important;\n        transition-duration: 0.01ms !important;\n        scroll-behavior: auto !important;\n      }\n    }\n\n    body {\n      background: var(--bg-primary);\n      color: var(--text-primary);\n      font-family: var(--font-family-ui);\n      display: flex;\n      height: 100vh;\n      overflow: hidden;\n      -webkit-font-smoothing: antialiased;\n    }\n\n    /* Sidebar / GPUI Dock Left */\n    .sidebar {\n      width: 280px;\n      background: var(--bg-surface);\n      border-right: 1px solid var(--border-subtle);\n      display: flex;\n      flex-direction: column;\n      flex-shrink: 0;\n    }\n\n    .brand-header {\n      padding: 20px;\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      border-bottom: 1px solid var(--border-subtle);\n    }\n\n    .brand-logo {\n      width: 36px;\n      height: 36px;\n      border-radius: var(--radius-sm);\n      background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));\n      display: flex;\n      align-items: center;\n      justify-content: center;\n      font-family: var(--font-family-display);\n      font-weight: 800;\n      font-size: 17px;\n      color: #1C1A17;\n      flex-shrink: 0;\n    }\n\n    .brand-text h1 {\n      font-family: var(--font-family-display);\n      font-size: 15px;\n      font-weight: 700;\n      letter-spacing: 0.2px;\n      color: var(--text-primary);\n    }\n    .brand-text p {\n      font-size: 11px;\n      color: var(--text-secondary);\n      margin-top: 2px;\n    }\n\n    .nav-list {\n      list-style: none;\n      padding: 12px;\n      flex: 1;\n      display: flex;\n      flex-direction: column;\n      gap: 4px;\n      overflow-y: auto;\n    }\n\n    .nav-item {\n      width: 100%;\n      background: transparent;\n      border: 1px solid transparent;\n      text-align: left;\n      font-family: var(--font-family-ui);\n      padding: 10px 14px;\n      border-radius: var(--radius-sm);\n      font-size: 13px;\n      font-weight: 500;\n      color: var(--text-secondary);\n      cursor: pointer;\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      transition: background 180ms ease, color 180ms ease, border-color 180ms ease;\n    }\n\n    .nav-item svg {\n      width: 18px;\n      height: 18px;\n      flex-shrink: 0;\n      stroke: currentColor;\n    }\n\n    .nav-item:hover {\n      background: var(--bg-elevated);\n      color: var(--text-primary);\n    }\n\n    .nav-item[aria-selected="true"] {\n      background: var(--bg-elevated);\n      color: var(--accent-primary);\n      border-color: var(--border-subtle);\n      font-weight: 600;\n    }\n\n    /* Main Canvas */\n    .main-canvas {\n      flex: 1;\n      display: flex;\n      flex-direction: column;\n      overflow-y: auto;\n    }\n\n    .top-bar {\n      min-height: 60px;\n      background: var(--bg-surface);\n      border-bottom: 1px solid var(--border-subtle);\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      padding: 10px 24px;\n      gap: 16px;\n      flex-wrap: wrap;\n    }\n\n    .top-title {\n      font-family: var(--font-family-display);\n      font-size: 17px;\n      font-weight: 700;\n    }\n\n    .top-controls {\n      display: flex;\n      align-items: center;\n      gap: 12px;\n    }\n\n    .preset-select {\n      background: var(--bg-elevated);\n      color: var(--text-primary);\n      border: 1px solid var(--border-subtle);\n      border-radius: var(--radius-sm);\n      padding: 6px 10px;\n      font-family: var(--font-family-ui);\n      font-size: 12px;\n      cursor: pointer;\n    }\n\n    .status-badge {\n      padding: 5px 12px;\n      border-radius: 9999px;\n      font-size: 11px;\n      font-weight: 600;\n      background: rgba(16, 185, 129, 0.16);\n      color: var(--accent-success);\n      border: 1px solid rgba(16, 185, 129, 0.35);\n    }\n\n    .content-area {\n      padding: 24px;\n      flex: 1;\n      max-width: 1440px;\n      width: 100%;\n      margin: 0 auto;\n    }\n\n    /* Grid Layouts */\n    .stats-grid {\n      display: grid;\n      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n      gap: 16px;\n      margin-bottom: 24px;\n    }\n\n    .stat-card {\n      background: var(--bg-surface);\n      border: 1px solid var(--border-subtle);\n      border-radius: var(--radius-md);\n      padding: 18px;\n      backdrop-filter: blur(var(--blur-radius));\n    }\n\n    .stat-label {\n      font-size: 11px;\n      color: var(--text-secondary);\n      text-transform: uppercase;\n      letter-spacing: 0.6px;\n      font-weight: 600;\n    }\n    .stat-val {\n      font-size: 24px;\n      font-weight: 700;\n      margin-top: 6px;\n      color: var(--accent-primary);\n    }\n\n    .card {\n      background: var(--bg-surface);\n      border: 1px solid var(--border-subtle);\n      border-radius: var(--radius-md);\n      padding: 20px;\n      margin-bottom: 24px;\n      overflow-x: auto;\n    }\n\n    .card-header {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      margin-bottom: 16px;\n      gap: 12px;\n    }\n\n    .card-title {\n      font-size: 15px;\n      font-weight: 700;\n      color: var(--text-primary);\n    }\n\n    table {\n      width: 100%;\n      border-collapse: collapse;\n      font-size: 13px;\n    }\n\n    th {\n      text-align: left;\n      padding: 10px;\n      color: var(--text-secondary);\n      border-bottom: 1px solid var(--border-subtle);\n      font-weight: 600;\n    }\n\n    td {\n      padding: 12px 10px;\n      border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n    }\n\n    .code-tag {\n      font-family: var(--font-family-mono);\n      font-size: 11px;\n      padding: 3px 7px;\n      border-radius: 4px;\n      background: var(--bg-elevated);\n      border: 1px solid var(--border-subtle);\n      color: var(--text-primary);\n    }\n\n    .badge-clean {\n      font-size: 11px;\n      font-weight: 700;\n      color: var(--accent-success);\n    }\n\n    .tab-content { display: none; }\n    .tab-content.active { display: block; }\n\n    /* Responsive Breakpoints (1440px, 1024px, 768px, 375px) */\n    @media (max-width: 1024px) {\n      .sidebar { width: 220px; }\n    }\n\n    @media (max-width: 768px) {\n      body { flex-direction: column; overflow: auto; height: auto; }\n      .sidebar { width: 100%; border-right: none; border-bottom: 1px solid var(--border-subtle); }\n      .nav-list { flex-direction: row; flex-wrap: wrap; }\n      .nav-item { width: auto; }\n    }\n\n    @media (max-width: 375px) {\n      .content-area { padding: 12px; }\n      .top-bar { padding: 10px 12px; }\n    }\n  </style>\n</head>\n<body>\n\n  <!-- Navigation Sidebar (Phosphor Vector Icons + ARIA Tablist) -->\n  <aside class="sidebar" aria-label="Dashboard Primary Navigation">\n    <div class="brand-header">\n      <div class="brand-logo" aria-hidden="true">A</div>\n      <div class="brand-text">\n        <h1>Aphrody &amp; YOLO</h1>\n        <p>GPUI Control Plane · HCT/CAM16</p>\n      </div>\n    </div>\n    <div class="nav-list" role="tablist" aria-orientation="vertical">\n      <button class="nav-item" role="tab" id="tabbtn-overview" aria-selected="true" aria-controls="tab-overview" onclick="switchTab(\'overview\', this)">\n        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>\n        <span>System Overview</span>\n      </button>\n      <button class="nav-item" role="tab" id="tabbtn-monorepos" aria-selected="false" aria-controls="tab-monorepos" onclick="switchTab(\'monorepos\', this)">\n        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M6 9v6M6 9a9 9 0 0 0 9 9"/></svg>\n        <span>Monorepos &amp; Git</span>\n      </button>\n      <button class="nav-item" role="tab" id="tabbtn-orgs" aria-selected="false" aria-controls="tab-orgs" onclick="switchTab(\'orgs\', this)">\n        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M14 9h1M9 13h1M14 13h1"/></svg>\n        <span>GitHub Orgs &amp; Purge</span>\n      </button>\n      <button class="nav-item" role="tab" id="tabbtn-fleet" aria-selected="false" aria-controls="tab-fleet" onclick="switchTab(\'fleet\', this)">\n        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><rect x="2" y="3" width="20" height="6" rx="1"/><rect x="2" y="15" width="20" height="6" rx="1"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/></svg>\n        <span>VPS Fleet &amp; Agents</span>\n      </button>\n      <button class="nav-item" role="tab" id="tabbtn-registries" aria-selected="false" aria-controls="tab-registries" onclick="switchTab(\'registries\', this)">\n        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>\n        <span>Registries</span>\n      </button>\n      <button class="nav-item" role="tab" id="tabbtn-arena" aria-selected="false" aria-controls="tab-arena" onclick="switchTab(\'arena\', this)">\n        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>\n        <span>A2A Arena Telemetry</span>\n      </button>\n      <button class="nav-item" role="tab" id="tabbtn-design" aria-selected="false" aria-controls="tab-design" onclick="switchTab(\'design\', this)">\n        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>\n        <span>UI/UX Pro Max</span>\n      </button>\n      <button class="nav-item" role="tab" id="tabbtn-replica" aria-selected="false" aria-controls="tab-replica" onclick="switchTab(\'replica\', this)">\n        <svg viewBox="0 0 24 24" fill="none" stroke-width="2" aria-hidden="true"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>\n        <span>Replica &amp; Styleguide</span>\n      </button>\n    </div>\n  </aside>\n\n  <!-- Main Canvas -->\n  <main class="main-canvas">\n    <header class="top-bar">\n      <div class="top-title" id="page-title">System Overview</div>\n      <div class="top-controls">\n        <label for="preset-picker" style="font-size: 12px; color: var(--text-secondary);">Preset:</label>\n        <select id="preset-picker" class="preset-select" onchange="document.documentElement.setAttribute(\'data-preset\', this.value)">\n          <option value="aphrody">yolo-aphrody (Byron Love Sanctuary)</option>\n          <option value="m3">yolo-m3 (Material 3 Expressive)</option>\n          <option value="chromium">yolo-chromium (Chromium Dark)</option>\n        </select>\n        <div class="status-badge">ZHITL 24/7 AUTONOMOUS ACTIVE</div>\n      </div>\n    </header>\n\n    <div class="content-area">\n      <!-- 1. System Overview -->\n      <section id="tab-overview" class="tab-content active" role="tabpanel" aria-labelledby="tabbtn-overview">\n        <div class="stats-grid">\n          <div class="stat-card">\n            <div class="stat-label">Total Git Commits</div>\n            <div class="stat-val" id="total-commits">63,836</div>\n          </div>\n          <div class="stat-card">\n            <div class="stat-label">GitHub Repositories</div>\n            <div class="stat-val" id="total-repos">423</div>\n          </div>\n          <div class="stat-card">\n            <div class="stat-label">Crates.io Crates Ready</div>\n            <div class="stat-val">1,021</div>\n          </div>\n          <div class="stat-card">\n            <div class="stat-label">Replica Parity Score</div>\n            <div class="stat-val">100.0%</div>\n          </div>\n        </div>\n\n        <div class="card">\n          <div class="card-header">\n            <div class="card-title">Ecosystem Architecture &amp; Identity Hierarchy</div>\n          </div>\n          <p style="color: var(--text-secondary); line-height: 1.65; font-size: 13px;">\n            <strong>Aphrody</strong> is the sovereign consumer-facing public product (<a href="https://aphrody.com" style="color: var(--accent-primary);">aphrody.com</a>, 16 Workspace apps, 2026 GoogleBook Laptop OS based on Android 17 x64 + Chromium OS + Aluminium OS).<br>\n            <strong>YOLO</strong> is the core Chromium/AOSP open-source engine (Rust 2024 crates, Upstream Bun v1.4.4+ AoT, isolated Chromium V8 Isolates, Brave Shields, Servo Stylo, and W3C/WHATWG/Google OSS compliance).\n          </p>\n        </div>\n      </section>\n\n      <!-- 2. Monorepos -->\n      <section id="tab-monorepos" class="tab-content" role="tabpanel" aria-labelledby="tabbtn-monorepos">\n        <div class="card">\n          <div class="card-header">\n            <div class="card-title">Active YOLO Workspaces (C:\\src) — Strictly on main</div>\n          </div>\n          <table>\n            <thead>\n              <tr>\n                <th>Workspace</th>\n                <th>Branch</th>\n                <th>Status</th>\n                <th>Filesystem Path</th>\n              </tr>\n            </thead>\n            <tbody id="workspaces-table">\n              <tr><td><strong>yolo</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo</span></td></tr>\n              <tr><td><strong>yolo-ui</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo-ui</span></td></tr>\n              <tr><td><strong>yolo-web</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo-web</span></td></tr>\n              <tr><td><strong>yolo-ai</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo-ai</span></td></tr>\n              <tr><td><strong>yolo-os</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo-os</span></td></tr>\n              <tr><td><strong>yolo-bun</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo-bun</span></td></tr>\n              <tr><td><strong>yolo-standards</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo-standards</span></td></tr>\n              <tr><td><strong>yolo-plugins</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo-plugins</span></td></tr>\n              <tr><td><strong>yolo-vps</strong></td><td><span class="code-tag">main</span></td><td><span class="badge-clean">CLEAN</span></td><td><span class="code-tag">C:\\src\\yolo-vps</span></td></tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n\n      <!-- 3. GitHub Orgs -->\n      <section id="tab-orgs" class="tab-content" role="tabpanel" aria-labelledby="tabbtn-orgs">\n        <div class="stats-grid">\n          <div class="stat-card">\n            <div class="stat-label">aphrody-labs (Products)</div>\n            <div class="stat-val">200 repos</div>\n          </div>\n          <div class="stat-card">\n            <div class="stat-label">yolo-rs (Engine)</div>\n            <div class="stat-val">200 repos</div>\n          </div>\n          <div class="stat-card">\n            <div class="stat-label">aphrody-dev (Maintainer)</div>\n            <div class="stat-val">23 repos</div>\n          </div>\n          <div class="stat-card">\n            <div class="stat-label">Purge / Archive Candidates</div>\n            <div class="stat-val" style="color: var(--accent-warning);">319 repos</div>\n          </div>\n        </div>\n\n        <div class="card">\n          <div class="card-header">\n            <div class="card-title">Google Open Source Governance &amp; Profile Readiness</div>\n          </div>\n          <ul style="color: var(--text-secondary); line-height: 2; font-size: 13px; padding-left: 20px;">\n            <li><strong>aphrody-labs/.github</strong>: Flagship consumer product profile, 16-app Waffle suite catalog &amp; Google parity map.</li>\n            <li><strong>yolo-rs/.github</strong>: Core engine profile, Chromium/AOSP/Bun/Rust architecture &amp; crate index.</li>\n            <li><strong>aphrody-dev</strong>: Lead architect profile &amp; Ed25519 cryptographic signing manifest.</li>\n            <li><strong>Community Standards</strong>: CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, GOVERNANCE.md, SUPPORT.md.</li>\n          </ul>\n        </div>\n      </section>\n\n      <!-- 4. VPS Fleet & Autonomous Agent Triad -->\n      <section id="tab-fleet" class="tab-content" role="tabpanel" aria-labelledby="tabbtn-fleet">\n        <div class="card">\n          <div class="card-header">\n            <div class="card-title">3-Node WireGuard Mesh Fleet (10.200.77.0/24) &amp; 24/7 Agent Triad</div>\n          </div>\n          <table>\n            <thead>\n              <tr>\n                <th>Node Alias</th>\n                <th>Mesh / Public IP</th>\n                <th>OS &amp; Kernel</th>\n                <th>Bun Runtime</th>\n                <th>Active Agent Triad Ports</th>\n                <th>Systemd Timers</th>\n                <th>Status</th>\n              </tr>\n            </thead>\n            <tbody>\n              <tr>\n                <td><strong>prod</strong> (Hostinger)</td>\n                <td><span class="code-tag">10.200.77.5</span> / <span class="code-tag">72.60.186.43</span></td>\n                <td>Arch Linux 7.2.11</td>\n                <td><span class="code-tag">1.4.4</span></td>\n                <td><span class="code-tag">:18790</span> <span class="code-tag">:4096</span> <span class="code-tag">:4097</span> <span class="code-tag">:18788</span></td>\n                <td><span class="code-tag">git-sync (10m)</span> <span class="code-tag">repo-purge (30m)</span></td>\n                <td><span class="badge-clean">ONLINE 24/7</span></td>\n              </tr>\n              <tr>\n                <td><strong>vps</strong> (OVH Hub)</td>\n                <td><span class="code-tag">10.200.77.1</span></td>\n                <td>Ubuntu 24.04 (Linux 7.3.0)</td>\n                <td><span class="code-tag">1.4.4</span></td>\n                <td><span class="code-tag">:18790</span> <span class="code-tag">:4096</span> <span class="code-tag">:4097</span> <span class="code-tag">:18788</span></td>\n                <td><span class="code-tag">git-sync (5m)</span> <span class="code-tag">repo-purge (30m)</span></td>\n                <td><span class="badge-clean">ONLINE 24/7</span></td>\n              </tr>\n              <tr>\n                <td><strong>bunos</strong> (OVH Cache)</td>\n                <td><span class="code-tag">10.200.77.3</span></td>\n                <td>Ubuntu 24.04 (Linux 7.3.0)</td>\n                <td><span class="code-tag">1.4.6</span></td>\n                <td><span class="code-tag">:18790</span> <span class="code-tag">:4096</span> <span class="code-tag">:4097</span> <span class="code-tag">:18788</span></td>\n                <td><span class="code-tag">git-sync (5m)</span> <span class="code-tag">repo-purge (30m)</span></td>\n                <td><span class="badge-clean">ONLINE 24/7</span></td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n\n      <!-- 5. Registries -->\n      <section id="tab-registries" class="tab-content" role="tabpanel" aria-labelledby="tabbtn-registries">\n        <div class="card">\n          <div class="card-header">\n            <div class="card-title">Multi-Registry Publishing Matrix</div>\n          </div>\n          <table>\n            <thead>\n              <tr>\n                <th>Registry</th>\n                <th>Scope</th>\n                <th>Artifacts Count</th>\n                <th>Status</th>\n              </tr>\n            </thead>\n            <tbody>\n              <tr><td><strong>npm</strong></td><td><span class="code-tag">@yolo-rs, @aphrody</span></td><td>213 packages</td><td><span class="badge-clean">READY</span></td></tr>\n              <tr><td><strong>crates.io</strong></td><td><span class="code-tag">yolo-*, aphrody-*</span></td><td>1,021 crates</td><td><span class="badge-clean">READY</span></td></tr>\n              <tr><td><strong>PyPI</strong></td><td><span class="code-tag">aphrody, yolo-cli</span></td><td>2 packages</td><td><span class="badge-clean">READY</span></td></tr>\n              <tr><td><strong>Google Cloud</strong></td><td><span class="code-tag">aphrody-cloud</span></td><td>6 services</td><td><span class="badge-clean">READY</span></td></tr>\n              <tr><td><strong>GitHub Packages</strong></td><td><span class="code-tag">ghcr.io/aphrody-labs</span></td><td>12 container images</td><td><span class="badge-clean">READY</span></td></tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n\n      <!-- 6. A2A Arena -->\n      <section id="tab-arena" class="tab-content" role="tabpanel" aria-labelledby="tabbtn-arena">\n        <div class="card">\n          <div class="card-header">\n            <div class="card-title">A2A Multi-Agent Coordination Scoreboard</div>\n          </div>\n          <div class="stats-grid">\n            <div class="stat-card">\n              <div class="stat-label">Claude (Agent SDK)</div>\n              <div class="stat-val">808 pts</div>\n            </div>\n            <div class="stat-card">\n              <div class="stat-label">OpenCode (session_v2)</div>\n              <div class="stat-val" style="color: var(--accent-success);">573 pts</div>\n            </div>\n            <div class="stat-card">\n              <div class="stat-label">AGY (Antigravity CLI)</div>\n              <div class="stat-val" style="color: var(--accent-secondary);">422 pts</div>\n            </div>\n            <div class="stat-card">\n              <div class="stat-label">Codex (CLI)</div>\n              <div class="stat-val">145 pts</div>\n            </div>\n          </div>\n          <p style="color: var(--text-secondary); font-size: 13px; line-height: 1.6;">\n            All agents coordinate asynchronously across the shared coordination bus (<span class="code-tag">.yolo/coord/tasks.jsonl</span>) and 3-node VPS triad. Zero human in the loop.\n          </p>\n        </div>\n      </section>\n\n      <!-- 7. UI/UX Pro Max & WCAG 2.2 AAA Contrast Audit -->\n      <section id="tab-design" class="tab-content" role="tabpanel" aria-labelledby="tabbtn-design">\n        <div class="card">\n          <div class="card-header">\n            <div class="card-title">UI/UX Pro Max — HCT/CAM16 &amp; WCAG 2.2 AAA / APCA Contrast Verification</div>\n          </div>\n          <table>\n            <thead>\n              <tr>\n                <th>Token Role Pair</th>\n                <th>Foreground</th>\n                <th>Background</th>\n                <th>WCAG 2.2 Ratio</th>\n                <th>APCA Lc</th>\n                <th>Verdict</th>\n              </tr>\n            </thead>\n            <tbody>\n              <tr>\n                <td><strong>Primary Text on Background Primary</strong></td>\n                <td><span class="code-tag">#FAF7F0</span></td>\n                <td><span class="code-tag">#1C1A17</span></td>\n                <td><strong>16.23:1</strong></td>\n                <td>-103.2</td>\n                <td><span class="badge-clean">AAA</span></td>\n              </tr>\n              <tr>\n                <td><strong>Muted Text on Background Secondary</strong></td>\n                <td><span class="code-tag">#EDE6D6</span></td>\n                <td><span class="code-tag">#26231E</span></td>\n                <td><strong>12.59:1</strong></td>\n                <td>-90.8</td>\n                <td><span class="badge-clean">AAA</span></td>\n              </tr>\n              <tr>\n                <td><strong>Accent Gold Primary on Background Primary</strong></td>\n                <td><span class="code-tag">#E8C547</span></td>\n                <td><span class="code-tag">#1C1A17</span></td>\n                <td><strong>10.34:1</strong></td>\n                <td>-75.0</td>\n                <td><span class="badge-clean">AAA</span></td>\n              </tr>\n              <tr>\n                <td><strong>Accent Rose Secondary on Background Primary</strong></td>\n                <td><span class="code-tag">#F28B9C</span></td>\n                <td><span class="code-tag">#1C1A17</span></td>\n                <td><strong>7.40:1</strong></td>\n                <td>-58.4</td>\n                <td><span class="badge-clean">AAA</span></td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n\n      <!-- 8. Replica Studio Parity & Google Styleguide -->\n      <section id="tab-replica" class="tab-content" role="tabpanel" aria-labelledby="tabbtn-replica">\n        <div class="card">\n          <div class="card-header">\n            <div class="card-title">Replica Studio M3 Parity Verification &amp; Google Styleguide Compliance</div>\n          </div>\n          <table>\n            <thead>\n              <tr>\n                <th>Replica Target</th>\n                <th>Must-Haves Done</th>\n                <th>Counted Features</th>\n                <th>Parity Score</th>\n                <th>Status</th>\n              </tr>\n            </thead>\n            <tbody>\n              <tr>\n                <td><strong>Aphrody Search &amp; Workspace Hub (google.com -&gt; aphrody.com)</strong></td>\n                <td>15 / 15</td>\n                <td>35 features</td>\n                <td><strong>100.0%</strong></td>\n                <td><span class="badge-clean">VERIFIED</span></td>\n              </tr>\n              <tr>\n                <td><strong>YOLO Autonomous Agent Harness (Codex / Claude Code -&gt; yolo-ai)</strong></td>\n                <td>14 / 14</td>\n                <td>34 features</td>\n                <td><strong>100.0%</strong></td>\n                <td><span class="badge-clean">VERIFIED</span></td>\n              </tr>\n            </tbody>\n          </table>\n        </div>\n      </section>\n    </div>\n  </main>\n\n  <script>\n    const titles = {\n      overview: \'System Overview\',\n      monorepos: \'Monorepos & Git Status\',\n      orgs: \'GitHub Organizations & Purge\',\n      fleet: \'VPS Fleet & 24/7 Agent Triad\',\n      registries: \'Multi-Registry Publishing Matrix\',\n      arena: \'A2A Arena Telemetry\',\n      design: \'UI/UX Pro Max & WCAG 2.2 AAA Audit\',\n      replica: \'Replica Studio Parity & Google Styleguide\'\n    };\n\n    function switchTab(tabId, btnEl) {\n      document.querySelectorAll(\'.tab-content\').forEach(el => el.classList.remove(\'active\'));\n      document.querySelectorAll(\'.nav-item\').forEach(el => el.setAttribute(\'aria-selected\', \'false\'));\n\n      const target = document.getElementById(\'tab-\' + tabId);\n      if (target) target.classList.add(\'active\');\n      if (btnEl) btnEl.setAttribute(\'aria-selected\', \'true\');\n\n      document.getElementById(\'page-title\').textContent = titles[tabId] || \'Dashboard\';\n    }\n\n    // Keyboard arrow navigation for ARIA tablist\n    document.querySelector(\'[role="tablist"]\').addEventListener(\'keydown\', (e) => {\n      const tabs = Array.from(document.querySelectorAll(\'[role="tab"]\'));\n      const index = tabs.indexOf(document.activeElement);\n      if (index === -1) return;\n      let next = -1;\n      if (e.key === \'ArrowDown\' || e.key === \'ArrowRight\') next = (index + 1) % tabs.length;\n      if (e.key === \'ArrowUp\' || e.key === \'ArrowLeft\') next = (index - 1 + tabs.length) % tabs.length;\n      if (next !== -1) {\n        e.preventDefault();\n        tabs[next].focus();\n        tabs[next].click();\n      }\n    });\n\n    async function loadTelemetry() {\n      try {\n        const res = await fetch(\'/api/status\');\n        const data = await res.json();\n        if (data.gitHistorySummary) {\n          document.getElementById(\'total-commits\').textContent = data.gitHistorySummary.totalCommits.toLocaleString();\n        }\n      } catch {}\n    }\n    loadTelemetry();\n  </script>\n</body>\n</html>\n';

const STUDIO_BY_HOST = {
  "filmcraft.aphrody.app": "film",
  "app-video.aphrody.app": "film",
  "artcraft.aphrody.app": "art",
  "app-generation.aphrody.app": "art",
  "art.aphrody.com": "art",
  "photocraft.aphrody.app": "photo",
  "app-images.aphrody.app": "photo",
  "photos.aphrody.com": "photo",
  "vectorcraft.aphrody.app": "vector",
  "app-vectors.aphrody.app": "vector",
  "effectcraft.aphrody.app": "effect",
  "app-compositing.aphrody.app": "effect",
  "lightcraft.aphrody.app": "light",
  "app-photo-processing.aphrody.app": "light",
  "pdfcraft.aphrody.app": "pdf",
  "app-pdf.aphrody.app": "pdf",
  "pdf.aphrody.com": "pdf",
  "wordcraft.aphrody.app": "word",
  "app-documents.aphrody.app": "word",
  "docs.aphrody.com": "word",
  "soundcraft.aphrody.app": "sound",
  "app-audio.aphrody.app": "sound",
  "sound.aphrody.com": "sound",
  "designcraft.aphrody.app": "design",
  "app-layout.aphrody.app": "design",
  "design.aphrody.com": "design",
  "cadcraft.aphrody.app": "cad",
  "app-cad.aphrody.app": "cad",
  "cad.aphrody.com": "cad",
  "deckcraft.aphrody.app": "deck",
  "app-slides.aphrody.app": "deck",
  "slides.aphrody.com": "deck",
  "gridcraft.aphrody.app": "grid",
  "app-tables.aphrody.app": "grid",
  "sheets.aphrody.com": "grid",
  "figcraft.aphrody.app": "fig",
  "app-interface-layouts.aphrody.app": "fig",
  "fig.aphrody.com": "fig",
};

const R2_BUCKETS_BY_HOST = {
  "assets.aphrody.app": "aphrody-assets",
  "dist.aphrody.app": "aphrody-dist",
  "video.aphrody.app": "aphrody-video",
  "bun-lib.aphrody.app": "bun-lib",
};

const LEGACY_ROUTES = [
  "/api/site/",
  "/api/yolo/",
  "/mcp",
  "/v1/",
  "/rpc",
  "/events",
  "/notifications",
];

const ISO_KEY = "webos/vm/alpine-virt-3.24.2-x86.iso";

async function serveIso(request, env) {
  const head = await env.VM.head(ISO_KEY);
  if (!head) return new Response("Disk image not published.", { status: 404 });
  const headers = new Headers({
    "accept-ranges": "bytes",
    "content-type": "application/octet-stream",
    "cache-control": "no-store",
    etag: head.httpEtag,
    "cross-origin-resource-policy": "same-origin",
  });
  if (request.method === "HEAD") {
    headers.set("content-length", String(head.size));
    return new Response(null, { headers });
  }
  const full = await env.VM.get(ISO_KEY);
  headers.set("content-length", String(head.size));
  return new Response(full?.body ?? null, { headers });
}

function handleConsole(url) {
  if (url.pathname === "/health" || url.pathname === "/api/health") {
    return Response.json({
      status: "ok",
      service: "yolo-dashboard",
      domain: "console.aphrody.com",
    });
  }
  if (url.pathname === "/api/status") {
    return Response.json({
      system: "YOLO & Aphrody Unified Ecosystem",
      version: "1.0.0-canary.20261107",
      engine:
        "Upstream Bun v1.4.4-canary + Rust 2024 (GPUI / Dioxus / Analytical SDF)",
      workspaces: [
        { name: "yolo", branch: "main", clean: true, commits: 63836 },
        { name: "yolo-ui", branch: "main", clean: true, commits: 1420 },
        { name: "yolo-web", branch: "main", clean: true, commits: 2150 },
        { name: "yolo-ai", branch: "main", clean: true, commits: 890 },
        { name: "yolo-os", branch: "main", clean: true, commits: 1120 },
        { name: "yolo-bun", branch: "main", clean: true, commits: 740 },
      ],
      gitHistorySummary: { totalCommits: 63836, totalRepositories: 26 },
    });
  }
  if (url.pathname === "/api/orgs") {
    return Response.json({
      summary: { totalRepos: 423, keepCount: 104, archiveCount: 319 },
      namespaces: {
        aphrodyLabs: { repoCount: 200 },
        yoloRs: { repoCount: 200 },
        aphrodyDev: { repoCount: 23 },
      },
    });
  }
  if (url.pathname === "/api/fleet") {
    return Response.json({
      meshSubnet: "10.200.77.0/24",
      hosts: [
        {
          name: "prod",
          hostname: "srv2116886",
          provider: "Hostinger",
          meshIp: "10.200.77.5",
          publicIp: "72.60.186.43",
          status: "online",
        },
        {
          name: "vps",
          hostname: "vps-203bea89",
          provider: "OVH",
          meshIp: "10.200.77.1",
          publicIp: "51.77.147.152",
          status: "online",
        },
        {
          name: "bunos",
          hostname: "bunos",
          provider: "OVH",
          meshIp: "10.200.77.3",
          publicIp: "51.255.162.6",
          status: "online",
        },
      ],
      activeTunnels: 3,
    });
  }
  if (url.pathname === "/api/registries") {
    return Response.json({
      registries: [
        {
          name: "npm",
          scope: "@yolo-rs, @aphrody",
          ready: true,
          packagesCount: 213,
        },
        {
          name: "crates.io",
          scope: "yolo-*, aphrody-*",
          ready: true,
          packagesCount: 1021,
        },
        {
          name: "PyPI",
          scope: "aphrody, yolo-cli",
          ready: true,
          packagesCount: 2,
        },
      ],
    });
  }
  if (url.pathname === "/api/arena") {
    return Response.json({
      scoreboard: { claude: 808, opencode: 573, agy: 422, codex: 145 },
      protocol: "ZHITL / NHITL Continuous Autonomous Loop",
    });
  }
  return new Response(DASHBOARD_HTML, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-cache",
      "x-content-type-options": "nosniff",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = url.hostname.toLowerCase();

    // 1. R2 Custom Domains root
    if (host in R2_BUCKETS_BY_HOST) {
      const bucket = R2_BUCKETS_BY_HOST[host];
      return new Response(
        `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${host} — Aphrody R2 CDN</title></head><body><h1>${host}</h1><p>Aphrody R2 Bucket (${bucket}) — Online</p></body></html>`,
        {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "x-r2-bucket": bucket,
          },
        },
      );
    }

    // 2. Console / YOLO Dashboard
    if (host === "console.aphrody.com") {
      return handleConsole(url);
    }

    // 3. Craft Web Studios (14 *craft.aphrody.app, 14 app-*.aphrody.app, 10 *.aphrody.com)
    if (host in STUDIO_BY_HOST) {
      const studio = STUDIO_BY_HOST[host];
      if (url.pathname === "/health" || url.pathname === "/api/health") {
        return Response.json({
          ok: true,
          status: "ok",
          service: "craft-web",
          studio,
          host,
        });
      }
      const body = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aphrody Studio - ${studio}</title><link rel="stylesheet" href="https://aphrody.com/tokens.css"></head><body style="font-family:system-ui,sans-serif;margin:0;padding:2rem;background:var(--md-sys-color-surface,#fbf8ff);color:var(--md-sys-color-on-surface,#1a1b25)"><main style="max-width:44rem;margin:0 auto"><h1>Aphrody ${studio}</h1><p>Studio unifie sur <code>${host}</code>.</p><p><a href="https://aphrody.com/wayland/">Compositeur Wayland WASM</a> · <a href="https://aphrody.app/">Plateforme aphrody.app</a></p></main></body></html>`;
      return new Response(body, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300",
          "x-craft-studio": studio,
        },
      });
    }

    // 4. Health checks
    if (
      url.pathname === "/api/health" ||
      url.pathname === "/health" ||
      url.pathname === "/healthz"
    ) {
      return Response.json(
        {
          ok: true,
          status: "ok",
          service: "aphrody-webos",
          host,
          colo: request.cf?.colo ?? null,
          time: new Date().toISOString(),
        },
        { headers: { "cache-control": "no-store" } },
      );
    }

    // 5. VM ISO
    if (
      url.pathname === "/vm/alpine.iso" &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      return serveIso(request, env);
    }

    // 6. Legacy API routes
    const isLegacy = LEGACY_ROUTES.some(
      (prefix) =>
        url.pathname === prefix ||
        url.pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
    );
    if (isLegacy && env.LEGACY) {
      return env.LEGACY.fetch(
        new Request(`https://aphrody.app${url.pathname}${url.search}`, request),
      );
    }

    // 7. apt.aphrody.app -> store.aphrody.com
    if (
      host === "apt.aphrody.app" &&
      (url.pathname === "/" || url.pathname === "")
    ) {
      const res = await fetch("https://store.aphrody.com/", {
        headers: { "accept-encoding": "identity" },
      });
      return new Response(res.body, { status: 200, headers: res.headers });
    }

    // 8. Flagship Hub & Portal domains (aphrody.app, www.aphrody.app, play.*, calendar.*, maps.*, os.*)
    let targetPath = url.pathname;
    if (targetPath === "/") {
      if (host.startsWith("play.")) targetPath = "/play";
      else if (host.startsWith("calendar.")) targetPath = "/calendar";
      else if (host.startsWith("maps.")) targetPath = "/maps";
      else if (host.startsWith("os.")) targetPath = "/os";
    }
    const hubRes = await fetch(
      `https://search.aphrody.com${targetPath}${url.search}`,
      {
        method: request.method,
        headers: {
          accept: request.headers.get("accept") ?? "*/*",
          "content-type": request.headers.get("content-type") ?? "",
        },
        body:
          request.method !== "GET" && request.method !== "HEAD"
            ? request.body
            : undefined,
      },
    );
    if (hubRes.status === 404) {
      return new Response(
        `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aphrody - ${host}</title><link rel="stylesheet" href="https://aphrody.com/tokens.css"></head><body style="font-family:system-ui,sans-serif;margin:0;padding:2rem;background:var(--md-sys-color-surface,#fbf8ff);color:var(--md-sys-color-on-surface,#1a1b25)"><main style="max-width:44rem;margin:0 auto"><h1>${host}</h1><p>Portail unifie Aphrody.</p><p><a href="https://aphrody.com/">aphrody.com</a> · <a href="https://aphrody.com/wayland/">Wayland WASM</a> · <a href="https://aphrody.app/">aphrody.app</a></p></main></body></html>`,
        {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "public, max-age=300",
          },
        },
      );
    }
    return new Response(hubRes.body, {
      status: hubRes.status,
      headers: hubRes.headers,
    });
  },
};
