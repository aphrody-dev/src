# Sovereign AI-OS Canonical Soul (`SOUL.md`)

## 1. Strict Single AI Product Ownership vs Generalist `C:\src` Platforms
- **Sole Public AI Product & AI Owner**: [`C:\src\packages\ai-os`](file:///C:/src/packages/ai-os) (`@aphrody/ai-os`, `ai-os.exe`) is the **only** public AI product and sovereign AI control-plane owner in `C:\src`. It owns 100% of AI routing, MCP tools, Soul, Brain, Memory, Sessions, Skills, and Cross-AI Triad federation (`packages/ai-triad` and `packages/agy` serve as internal orchestration and Google research backends under `ai-os`).
- **Generalist External Surface (`Torvalds / Sumner / Page`)**: Every other unit in `C:\src` (`apps/aphrody`, `apps/aphrody-app`, `apps/shenron`, `apps/rosegriffon`, `crates/*`, `packages/google-design`, `packages/wck`, `packages/forge`, `infra/*`) is **generalist systems, web, desktop, distribution, and creative engineering software** — never marketed as an "AI wrapper" or "AI product".
- **100% Autonomous NHITL Internally, Zero AI-Slop Externally**: Internally, 100% of `C:\src` engineering, design synthesis, packaging, testing, and deployment runs autonomously with zero human-in-the-loop (NHITL). Externally, every README, website, theme, icon, asset, and interface passes strict anti-AI-slop gates (`gds`, `impeccable`, `humanizer`, `ui-ux-pro-max`, `3d-pro-max`, `DESIGN.md`, and `wck` 100/100).

## 2. Mandatory Design-First & Creative Studio Doctrine
- **Plan / PRD / Maquette Before Any UI Code**: No interface is written directly in code without first producing a structured *Cahier des charges* (PRD), layout architecture, and [`DESIGN.md`](file:///C:/src/apps/aphrody/DESIGN.md) specification via `@aphrody/google-design` (`gds`).
- **Grounded Design Systems & Open Creative Asset Bank**: Combine Google Material Design 3 (HCT), Microsoft Fluent UI 2 (Mica/Acrylic), Omarchy/CachyOS desktop palettes, crisp SVG icons, stylesheets, sprite sheets, animated Open Pets (`.gif` + `.svg`), wallpapers, glTF/GLB 3D models, synthesized WAV audio micro-interactions, WebGPU/Canvas motion scenes, variable OFL typography, and complete legal/brand kits.

## 3. Three-Principal Cloud & Org Identity Matrix (GCP Project `aphrody` #468000409790)
- **`yoyo.aphrody@gmail.com` (`gcloud` config `ai-yoyo`)**: Dedicated autonomous AI agent Google account (Gemini, Spark, Hermes, OpenClaw, Google Drive `gdrive-yoyo`, NotebookLM, Vertex/Cloud Build agent tasks).
- **`yohanpierre15@gmail.com` (`gcloud` config `owner-yohan`)**: Personal developer & owner account of Yoyo (root owner of GCP project `aphrody` and repositories).
- **`contact@aphrody.com` (`gcloud` config `org-contact`)**: Organization & infrastructure identity across Google Workspace, Cloudflare, GitHub, GitLab, Google Git, OVH, Hostinger, Vercel, Supabase, and sovereign transactional/org mail (`mail.aphrody.com`).

## 4. Non-Negotiable Engineering Directives
- **Sacred Host Userspace**: `C:\Windows\System32` and host OS directories are strictly untouchable. Userland binaries live exclusively in `C:\Users\aphro\.local\bin`.
- **Bun v1.4.4 Full-Rust + Rust 2024 Fat-LTO + Go 1.27**: Zero unnecessary npm dependencies. Validate every change via `bun fmt`, `bun check`, `bun test`, `cargo test`, and `go test`.
- **Keyless & Secret-Safe Security**: Never print, log, or commit raw secrets from `C:\src\.env`.
- **Zero Emojis**: Strictly zero emojis in code, Markdown, skills, UI text, assets, and commit messages.
