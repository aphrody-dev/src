[English source](../../games/PLAN.md)

# src 中的游戏与创作套件：计划（2026-11-13 重写）

本文取代文件的第一版。旧版提出的若干决定（UI 栈、GPU 版本固定、FFmpeg 绑定、C ABI）仓库早已定下，因此作废。下表每一行都注明了 2026-11-13 读取该事实的位置。除非某行注明，否则均未实现。

## 1. 现状

| 领域                 | 状态                                                                                                                                                                                                                                     | 出处                                                    |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| UI 决定              | 所有者 2026-11-13 的决定（当日修订）：框架不限（Bevy UI、egui、iced、WinUI 3、Tauri、GPUI、WebUI 等）；标准是渲染质量、性能与功能                                                                                                        | `docs/ui/STACK.md`                                      |
| 设计系统             | 令牌在 `packages/design`；Rust 核心 `crates/aphrody-ui`，布局适配器 `to_bevy`（`css_to_bevy_node`）与 `to_egui` 位于可选特性 `bevy` 和 `egui` 之后                                                                                       | `docs/design/DESIGN_SYSTEM.md`、`crates/aphrody-ui/Cargo.toml` |
| 引擎与 GPU 版本      | `[workspace.dependencies]`：bevy 0.20、egui 0.37、wgpu 30.0.1、winit 0.31.0-beta.4、image 0.25.10                                                                                                                                        | `Cargo.toml` 第 124 至 162 行                           |
| 使用这些版本的 crate | `aphrody-ui`、`corelib`、`gamescope-cli`、`gamescope-web-wasm`、`gamescope-wgsl`                                                                                                                                                         | `crates/*/Cargo.toml`                                   |
| 媒体领域             | `crates/tv-core`、`tv-ffmpeg`（对 `ffmpeg-next` 9.1.0 的安全封装）、`tv-cli`、`tv-i18n`                                                                                                                                                  | `docs/tv/plan-ecosysteme-c-rust.mdx`                    |
| 许可证策略           | `deny.toml` 中的许可名单；GPL、LGPL、AGPL、非 OSI 许可证以及报告为 `NOASSERTION` 的仓库一律拒绝，除非有记录在案的评审；FFmpeg libav* 动态链接，绝不内置                                                                                  | `docs/ARCHITECTURE.md` 第 405 至 411 行、`deny.toml`    |
| C ABI                | `crates/core-capi`（cbindgen，`include/aphrody_core.h`）封装 `crates/core`；Bun 绑定在 `packages/core/src/ffi.ts`；规则见 `docs/native/llvm/C-ABI-2026.md`                                                                                      | 上述文件                                                |
| 代码图               | `ay graph build`（tree-sitter），配方 `just graph <path> <name>`，输出到 `graphify-out/<name>`（不入库）                                                                                                                                 | `justfile` 第 74 至 76 行                               |
| 扁平化               | `ay flat list\|sync\|check` 将 bun 分叉的叶子 crate 复制到 `crates/bun-flat`，每个上游 crate 一个模块，分叉提交与各模块许可证记录在 `flat.toml`                                                                                          | `crates/bun-flat/flat.toml`                             |
| 固定的检出           | `third_party/artcraft`（`83aad5eb`）、`third_party/ffmpeg`（`46d13a83`）、`third_party/storyteller-bevy`（`4ce8b72c`）、`third_party/wgpu`（aphrody-labs 分叉）、`third_party/winit`（上游）；自提交 `4c6bf057`（2026-11-12）起写入 lock | `DEPS`、`src.lock.json`                                 |
| 跟踪的分叉           | `third_party/forks.txt` 中有 bevyengine 18 项、storytold 33 项、EpicGames 10 项，由 fr1 定时器与 `upstream-sync.yml` 同步                                                                                                                | `docs/epic/TRACKING.md`                                 |
| 方向                 | "Epic 路线（未排期）"；Unreal Engine 仅通过私有分叉                                                                                                                                                                                      | `docs/STACK-ROADMAP.md`、`docs/ARCHITECTURE.md`         |

## 2. 影响合并的版本（`gh api`，2026-11-13）

| 技术栈                                                                      | wgpu                                    | winit                                    | UI                                       | 许可证                                                  |
| :-------------------------------------------------------------------------- | :-------------------------------------- | :--------------------------------------- | :--------------------------------------- | :------------------------------------------------------ |
| src 工作区                                                                  | 30.0.1                                  | 0.31.0-beta.4                            | 见 `docs/ui/STACK.md`                    | MIT OR Apache-2.0                                       |
| Bevy v0.20.1（最新发布）                                                    | 30                                      | 0.30                                     | bevy_ui                                  | MIT OR Apache-2.0                                       |
| Craft Apps（photocraft、filmcraft、soundcraft、craft-launcher、craft-libs） | 30.0（经 `storytold/egui`，`6d518fc7`） | 0.30.13（`storytold/winit`，`a517b384`） | egui 0.37.0（分叉）                      | Apache-2.0                                              |
| ArtCraft Studio（`storytold/artcraft`）                                     | 未读取                                  | 未读取                                   | Tauri 2.11.2 web view 与 TypeScript 前端 | Apache-2.0 与 MIT 文件                                  |
| `storytold/artcraft-services`（后端）                                       | 不适用                                  | 不适用                                   | 不适用                                   | "ArtCraft License (WIP)"，fair source，仅限私人个人使用 |

结论：三套 Rust 技术栈都使用 wgpu 30，一个 wgpu 即可。winit 不同：src 固定 0.31.0-beta.4，Bevy 0.20.1 与 Craft 的 egui 分叉使用 0.30.x。目前只有 `gamescope-cli` 依赖 winit，且 `aphrody-ui` 仅启用 `bevy_ui`，所以工作区内只有一个 winit。加入 `bevy_winit` 或 `egui-winit` 会引入第二个。

## 3. 已发现的冲突，及所有者裁定前采用的默认做法

1. 所有者已于 2026-11-13 裁定：只要效果美观、优化且可用，任何 UI 框架均可接受。因此 Craft Apps 保留 egui，Aphrody 令牌通过 `aphrody-ui` 的 `egui` 特性接入。这修订了 `docs/ui/STACK.md` 的四项参考规则。
2. `third_party/storyteller-bevy` 已被固定，但仓库没有许可证文件，也没有 `license` 字段（上游最后提交 2024-04-09）。默认：仅供阅读参考，不向 `crates/` 复制任何内容，是移出 lock 的候选。
3. `docs/tv/plan-ecosysteme-c-rust.mdx` 列出了 x264 与 x265（GPL），而 `docs/ARCHITECTURE.md` 拒绝 GPL，且 `tv-ffmpeg` 的测试 `ffmpeg_build_is_lgpl` 会拒绝以 `--enable-gpl` 构建的 libavutil。默认：以测试强制的为准（LGPL 构建，硬件编码器）。
4. 新增名为 `C` 的根目录与分层设计（C ABI 位于 `crates/core-capi`）及 archguard 的根目录白名单相矛盾。默认：不新增根目录。新的 C 接口放入 `core-capi` 或某个 `<domain>-capi` crate，遵循 `docs/native/llvm/C-ABI-2026.md`。
5. `storytold/artcraft-services` 使用非 OSI 许可证。默认：不分叉、不复制；只可调用其文档化的 HTTP API（`docs/games/ARTCRAFT.md`）。

## 4. 工作顺序，每步附检查项

Rust 构建在 CI 或 fr1 上运行，不在工作站上运行。

| #   | 步骤                                                                                                                                                                               | 检查                                               | 状态                                                                                                                                                                                                                                                                                                                                                               |
| :-- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 用 `just graph third_party/<path> <name>` 为现有检出生成代码图                                                                                                                     | `GRAPH_REPORT.md` 含节点与边数                     | 2026-11-13 已用 `ay graph build` 完成，输出在 `graphify-out/`（不入库）；节点 / 边：libavutil 5055 / 11345，libavcodec 29819 / 97225，libavformat 10006 / 40174，libavfilter 11588 / 38477，libswscale 3022 / 6917，libswresample 404 / 724，libavdevice 1778 / 3407，`artcraft/crates` 34314 / 69018，`storyteller-bevy` 5317 / 7256。工作站上每次运行不超过 6 秒 |
| 2   | 在 fr1 上用共享 clang 生成上述库的 LLVM IR（`docs/native/llvm/UNIFIED-TOOLCHAIN.md`）                                                                                                     | 由已配置的 LGPL 构建产出 `.bc` 文件                | 未开始                                                                                                                                                                                                                                                                                                                                                             |
| 3   | 格式层：评估 `storytold/craft-libs`（Apache-2.0，114 个 `craft-<name>` crate，如 psd、pdf、exr、heif、tiff、webp、svg、raw、docx、xlsx），以 `rev` 固定的 git 依赖方式引入，不复制 | CI 中 `cargo deny check licenses` 通过             | 未开始                                                                                                                                                                                                                                                                                                                                                             |
| 4   | 媒体：按 `docs/tv` 所述扩展 `crates/tv-*`；本计划不增加内容                                                                                                                        | `tv-ffmpeg` 测试，含 `ffmpeg_build_is_lgpl`        | 由维护 `crates/tv-*` 的会话负责                                                                                                                                                                                                                                                                                                                                    |
| 5   | 引擎：在 `aphrody-ui` 的 `bevy` 特性之后逐个特性加入 Bevy crate；启用 `bevy_winit` 前先确定 winit 用 0.30 还是 0.31                                                                | CI 中 `cargo tree -d` 仅列出一个 winit 与一个 wgpu | 未开始                                                                                                                                                                                                                                                                                                                                                             |
| 6   | 仅扁平化必须修改的叶子 crate：将 `ay flat` 泛化为每个分叉一个 `flat.toml`（`--fork` 已存在）；排除无许可证与非 OSI 来源                                                            | `ay flat check --fork third_party/<name>` 无报错   | 2026-11-13 已完成：`ay flat list\|sync\|check --fork third_party/<name> [--manifest]`，每个分叉一个 flat.toml（bun、diffutils），按 deny.toml 做 SPDX 校验                                                                                                                                                                                                         |
| 7   | 在 fr1 上由发布构建获取 Craft Apps 的截图与令牌，存放在 git 之外                                                                                                                   | 文件列于 `docs/games/ARTCRAFT.md`                  | 未开始                                                                                                                                                                                                                                                                                                                                                             |
| 8   | Unreal Engine：不变，私有分叉，仅互操作                                                                                                                                            | `docs/epic/RESOURCES.md`                           | 此处无计划工作                                                                                                                                                                                                                                                                                                                                                     |

## 5. 未完成

- 本计划未新增 crate、未移动代码、未运行构建。将 src 重构为游戏引擎与创作套件的工作尚未开始。
- 2026-11-13 实测未通过的检查（与这些文档无关）：`ay arch check --strict`（72 个或更多错误，其中包括超过 50 MB 的二进制文件）、`ay manifests verify`（存在不是 gitlink 的固定项）、`ay doctor`（缺少 `cl.exe`）。

## 6. 所有者 2026-11-13 设定的目标（仅记录，尚未开始）

- 只保留三个应用，每个领域一个：`shenron`、`rosegriffon`，以及一个合并 `apps/aphrody`（aphrody.com）与 `apps/aphrody-app`（aphrody.app）的 Aphrody 应用。其余所有应用、包与 crate 都扁平化为共享代码；`shenron` 与 `rosegriffon` 中不属于其产品特有的代码迁入共享 crate 与包并复用。
- 合并后的 Aphrody 应用承载并部署 Craft Apps、ArtCraft 与游戏：浏览器中的全屏 WebAssembly 与 WebGPU，开放世界多人，1080p 下 120 fps，手柄（Xbox、PlayStation）、键鼠、音频与视频，基于 Bevy 构建，并与 Unreal Engine 建立特性对照表。
- 所有者点名的上游，使用前须以 `gh api` 核实：`vercel-labs/ui`、`vercel-labs/native`、`niri-wm/niri`、`niri-wm/awesome-niri`、DioxusLabs 组织、`longbridge`（GPUI 组件，`nsh`）、`cloudflare/vinext`、`vercel/next.js`、`vercel/vercel`、`vercel/ai`、`vercel/turborepo`、`mui/base-ui`、shadcn、`tailwindlabs/tailwindcss`、Microsoft WebUI、iced 与 COSMIC。
- 清理：移除 apps、packages 与 crates 内嵌的第三方副本；每个依赖只保留一个版本；缩小二进制体积。
- 开工前需定义的检查：合并后应用在 CI 中的一次构建、测量帧率的浏览器运行，以及每项被替换功能的对等清单。目前均不存在。
- 角色与吉祥物素材（Inazuma Eleven 与 Dragon Ball 角色、Tux、Bun 吉祥物、第三方标识）归其所有者所有；只有许可证允许再分发的素材才能放入这个公开仓库。
