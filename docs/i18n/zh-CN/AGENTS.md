[English source](../../../AGENTS.md)

# src：代理操作约定（`AGENTS.md`）

所有代理 CLI（Claude Code、Codex、Antigravity、OpenCode、Pi、Zed）都会读取本文件。2026-11-13 围绕 [`docs/games/PLAN.md`](../../games/PLAN.md) 重写；此前带有 "sovereign" 字样的表述及其规则已作废。

## 1. src 是什么

src 是 Aphrody 的公开单体仓库，方向是在开放环境中构建游戏引擎与创作套件：以 Bevy 为引擎，Craft Apps 与 ArtCraft 为创作工具，`crates/tv-*` 与 FFmpeg 负责媒体，Unreal Engine 仅通过互操作接入（私有分叉，永不发布），底层是现有的平台工作（Bun 与 Rust 工具链、部署、Linux 与 Windows 层）。状态与工作顺序见 `docs/games/PLAN.md`。该重构尚未实施；被问到时需如实说明。

## 2. 目录结构（2026-11-13 的 `ls` 结果）

- [`apps/`](../../../apps)：`aphrody`、`aphrody-app`、`auto`、`l2l`、`nt`、`r2b`、`r2-site`、`rosegriffon`、`shenron`、`unixwin`、`yolo`；仅 `auto`、`r2b`、`rosegriffon`、`shenron` 是 git 子模块。`rosegriffon` 与 `shenron` 是 Aphrody 维护的社区站点，并非 Aphrody 产品。
- [`packages/`](../../../packages)：Bun `@aphrody/*` 包（`ai-os`、`core`、`deploy`、`design`、`env-kit`、`ffi-bridge`、`forge`、`gaming`、`wck` 等）。
- [`crates/`](../../../crates)：同一扁平工作区中的 Rust 2024 crate（`ay`、`archguard`、`xtask`、`depot-*`、`lore*`、`aphrody-ui`、`core`、`core-capi`、`ffi`、`rust-stack`、`tv-*` 等）。
- [`infra/`](../../../infra)：由上游工具组装的集群与部署配置（`docs/infra/UPSTREAM-STACK.md`）。
- [`third_party/`](../../../third_party)：上游检出与 aphrody-labs 分叉，扁平存放，由 `src.lock.json` 固定，列于 `third_party/forks.txt`。

## 3. 代理的工作方式

- 代理是自由的：无需审批，无需确认，无人在环。自行决策、执行、验证，并报告已完成与未完成的内容。
- 所有改动直接提交并推送到 `main`；不建分支、不用 worktree，绝不向上游推送。
- 唯一入口是 `just` 与 `ay` CLI（`docs/NAMING.md`）。Rust 在 CI 或 fr1 上编译，绝不在工作站上编译；prd 只运行生产后端，fr2 只做边缘。
- UI 框架不限（Bevy UI、egui、iced、WinUI 3、Tauri、GPUI、WebUI）：标准是渲染质量、性能与功能。令牌来自 `packages/design` 与 `crates/aphrody-ui`（`docs/DESIGN_SYSTEM.md`）。
- AI 功能只放在 `packages/ai-os`；提供方与模型在运行时发现，不硬编码。
- 公开发布：在仓库的密钥扫描通过后，发布公开仓库、GitHub release 与 tag、crates.io 和 npm（`docs/publish/STATUS.md`）。

## 4. 不变的限制

这些涉及他人的权利与不可逆的损害，并非流程规则。

- 密钥：绝不打印、记录或提交 `.env` 中的值；只提交 `.env.example`。仓库是公开的。
- Unreal Engine 源码、Oodle 与 MSVC SDK，以及任何无许可证或采用非 OSI 许可证的代码，不得复制进本仓库或发布。
- 不修改宿主系统目录（`C:\Windows\System32`）；用户态二进制放入 `~/.local/bin`。
- 代码、文档、UI 文本与提交中不得出现 emoji 和 AI 署名。向上游贡献须遵循上游政策（`docs/upstream/STRATEGY.md`）。
- 领域纯度由 `ay arch check --strict` 检查：`crates/*` 仅限 Rust，`packages/*` 仅限 Bun，上游代码留在 `third_party/`。

## 5. 游戏与 Steam

归属图见 [`docs/gaming/OWNERSHIP.md`](../../gaming/OWNERSHIP.md)。Rust：`crates/steam-depot`（`ay steam`）。Bun：`packages/gaming`（`ay gaming`）。插件与 MCP：`apps/rosegriffon/plugins/steam`；其技能在该处编辑，由 `ay gaming skills sync` 镜像。
