[English source](../../../README.md)

# src

Aphrody 的单体仓库（monorepo）。贡献者与代理的约定见 [AGENTS.md](../../../AGENTS.md) 和 [CLAUDE.md](../../../CLAUDE.md)；目标架构见 [docs/ARCHITECTURE.md](../../ARCHITECTURE.md)，路线图见 [docs/STACK-ROADMAP.md](../../STACK-ROADMAP.md)。品牌、令牌与图标位于 [assets/brand](../../../assets/brand)（`ay brand build`），设计系统见 [packages/design](../../../packages/design/DESIGN.md)。

## 目录结构

| 目录                                                                              | 内容                                                                                                                                                                                                                              |
| :-------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/`](../../../apps)                                                          | `aphrody`、`aphrody-app`、`auto`、`l2l`、`nt`、`r2-site`、`r2b`、`unixwin`、`yolo`，以及由 Aphrody 维护的两个社区站点 `rosegriffon` 和 `shenron`。`auto`、`r2b`、`rosegriffon`、`shenron` 是 git 子模块。                         |
| [`packages/`](../../../packages)                                                  | Bun `@aphrody/*` 包：`ai-os`（唯一的 AI 产品）、`core`、`deploy`、`design`、`env-kit`、`ffi-bridge`、`forge`、`gaming`、`wck` 等。                                                                                                |
| [`crates/`](../../../crates)                                                      | Rust 2024 crate，同属一个扁平的 Cargo 工作区：`ay`（仓库 CLI）、`archguard`、`xtask`、`depot-*`、`lore*`、`aphrody-ui`、`core`、`core-capi`、`ffi`、`rust-stack`、`tv-*`、`gamescope-*`、`steam-depot`、`conformance`、`apm` 等。 |
| [`infra/`](../../../infra)                                                        | 由上游工具组装的集群与部署配置（`docker`、`cluster`、`cloudflare`、`fleet`、`mesh-vn`、`chromium-factory` 等）。                                                                                                                  |
| [`third_party/`](../../../third_party)                                            | 上游检出与 aphrody-labs 分叉，由 [`src.lock.json`](../../../src.lock.json) 固定；分叉清单见 [`third_party/forks.txt`](../../../third_party/forks.txt)。不做本地修改。                                                             |
| `docs/`、`assets/`、`conformance/`、`licenses/`、`plugins/`、`scripts/`、`tools/` | 文档、品牌资源、一致性测试套件、许可证文本、Claude Code 插件（`labs`、`aphrody-nhitl`）、脚本与工具。                                                                                                                             |

## 锁定与许可证

- `src.lock.json` 是唯一的版本锁定来源；[`DEPS`](../../../DEPS) 与 [`.gitmodules`](../../../.gitmodules) 由 `ay manifests` 派生。[`MAINTAINERS`](../../../MAINTAINERS) 手工维护。
- 自有代码采用 MIT OR Apache-2.0（[LICENSE-MIT](../../../LICENSE-MIT)、[LICENSE-APACHE](../../../LICENSE-APACHE)）。依赖策略见 `deny.toml` 和 [docs/ARCHITECTURE.md](../../ARCHITECTURE.md)。

## 常用命令

Rust 在 CI 或构建主机上编译，不在工作站上编译。

```sh
just doctor          # 工具链诊断
just arch-check      # 架构检查（严格模式用 ay arch check --strict）
just lock            # 将检出锁定到 src.lock.json，并派生 DEPS 与 .gitmodules
just manifests-check # 派生清单与 gitlink 是否与 src.lock.json 一致
just env-doctor      # 检查脱敏的 .env 保险库与编辑器认证配置
just graph <path> <name>   # 生成 tree-sitter 代码图到 graphify-out/<name>
just deploy          # 在主机上执行 docker compose pull + up --wait
just verify-all      # 架构检查、doctor、Bun 测试，然后运行 Rust 的 ci.yml
```

## 延伸阅读

| 主题                                 | 文档                                                                                                                                                    |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 设计系统与 UI                        | [docs/design/DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)、[docs/ui/STACK.md](../../ui/STACK.md)、[packages/design/DESIGN.md](../../../packages/design/DESIGN.md) |
| 媒体（`crates/tv-*`）                | [docs/tv](../../tv)                                                                                                                                     |
| 游戏与 Steam                         | [docs/gaming/OWNERSHIP.md](../../gaming/OWNERSHIP.md)                                                                                                   |
| Epic Games 与 Unreal Engine 资料     | [docs/epic/RESOURCES.md](../../epic/RESOURCES.md)、[docs/epic/TRACKING.md](../../epic/TRACKING.md)                                                      |
| 游戏与创作套件（仅有计划，尚未开始） | [docs/games/PLAN.md](../../games/PLAN.md)                                                                                                               |
| 部署                                 | [docs/infra/DEPLOY.md](../../infra/DEPLOY.md)                                                                                                           |
| 会话记录                             | [docs/SESSION-LEDGER-2026-11-13.md](../../SESSION-LEDGER-2026-11-13.md)                                                                                 |

## Labs（2026-11-12 合并）

Aphrody Labs：自托管平台相关工作，其原二进制现为 `ay conformance`。

| 路径                                          | 内容                                                                   |
| :-------------------------------------------- | :--------------------------------------------------------------------- |
| `test/conformance`、`conformance/`          | 固定版本的一致性套件，CLI 为 `ay conformance`                          |
| `src/lore*`、`licenses/lore`、`tools/lore` | Lore VCS，已吸收（MIT）                                                |
| `src/apm`                                  | APM crate                                                              |
| `[patch.crates-io]`                           | 以 `rev` 固定的 aphrody-labs 分叉补丁 crate（quinn-proto、glob-match） |
| `third_party/oils`                            | oils 分叉及其固定版本                                                  |
| `infra/chromium-factory`                      | Chromium 构建工厂                                                      |
| `plugins/labs`                                | Claude Code 插件 `labs`（[docs/agents/PLUGIN.md](../../PLUGIN.md)）           |

相关命令：`just lab-build`、`just lab-dev`、`just lab-conformance`。
