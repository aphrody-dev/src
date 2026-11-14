[English source](../../../README.md)

# src

Aphrody のモノレポです。コントリビューターとエージェント向けの規約は [AGENTS.md](../../../AGENTS.md) と [CLAUDE.md](../../../CLAUDE.md)、目標アーキテクチャは [docs/ARCHITECTURE.md](../../ARCHITECTURE.md)、ロードマップは [docs/STACK-ROADMAP.md](../../STACK-ROADMAP.md) にあります。

## 構成

| ディレクトリ                                                                      | 内容                                                                                                                                                                                                                                                        |
| :-------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/`                                                                           | `aphrody`、`aphrody-app`、`auto`、`l2l`、`nt`、`r2-site`、`r2b`、`unixwin`、`yolo`。Aphrody が保守するコミュニティサイト `rosegriffon` と `shenron` も含みます。git サブモジュールは `auto`、`r2b`、`rosegriffon`、`shenron` です。                         |
| `packages/`                                                                       | Bun の `@aphrody/*` パッケージ群。`ai-os`(唯一の AI プロダクト)、`core`、`deploy`、`design`、`env-kit`、`ffi-bridge`、`forge`、`gaming`、`wck` など。                                                                                                       |
| `crates/`                                                                         | 単一のフラットな Cargo ワークスペースにある Rust 2024 クレート群。`ay`(リポジトリ CLI)、`archguard`、`xtask`、`depot-*`、`lore*`、`aphrody-ui`、`core`、`core-capi`、`ffi`、`rust-stack`、`tv-*`、`gamescope-*`、`steam-depot`、`conformance`、`apm` など。 |
| `infra/`                                                                          | アップストリームのツールを組み合わせたフリートとデプロイの設定(`docker`、`cluster`、`cloudflare`、`fleet`、`mesh-vn`、`chromium-factory` など)。                                                                                                            |
| `third_party/`                                                                    | アップストリームのチェックアウトと aphrody-labs のフォーク。`src.lock.json` で固定し、フォーク一覧は `third_party/forks.txt` にあります。ローカルでは変更しません。                                                                                         |
| `docs/`、`assets/`、`conformance/`、`licenses/`、`plugins/`、`scripts/`、`tools/` | ドキュメント、ブランドアセット、適合性スイート、ライセンス文書、Claude Code プラグイン(`labs`、`aphrody-nhitl`)、スクリプト、ツール類。                                                                                                                     |

## ピンとライセンス

- ピンは `src.lock.json` のみです。`DEPS` と `.gitmodules` は `ay manifests` がここから生成します。`MAINTAINERS` は手作業で管理します。
- 自社コードのライセンスは MIT OR Apache-2.0 です(`LICENSE-MIT`、`LICENSE-APACHE`)。依存関係のポリシーは `deny.toml` と `docs/ARCHITECTURE.md` にあります。

## コマンド

Rust のコンパイルは CI かビルドホストで行い、ワークステーションでは行いません。

```sh
just doctor          # toolchain doctor
just arch-check      # architecture gate (ay arch check --strict for the strict form)
just lock            # lock the checkout in src.lock.json, then derive DEPS and .gitmodules
just manifests-check # derived manifests and gitlinks match src.lock.json
just env-doctor      # check the masked .env vault and editor auth wiring
just graph <path> <name>   # tree-sitter code graph into graphify-out/<name>
just deploy          # docker compose pull + up --wait on a host
just verify-all      # architecture gate, doctor, Bun suites, then ci.yml for Rust
```

## 参照先

| トピック                                         | ドキュメント                                                             |
| :----------------------------------------------- | :----------------------------------------------------------------------- |
| デザインシステムと UI                            | `docs/design/DESIGN_SYSTEM.md`、`docs/ui/STACK.md`、`packages/design/DESIGN.md` |
| メディア(`crates/tv-*`)                          | `docs/tv`                                                                |
| ゲームと Steam                                   | `docs/gaming/OWNERSHIP.md`                                               |
| Epic Games と Unreal Engine                      | `docs/epic/RESOURCES.md`、`docs/epic/TRACKING.md`                        |
| ゲームとクリエイティブスイート(計画段階、未着手) | `docs/games/PLAN.md`                                                     |
| デプロイ                                         | `docs/infra/DEPLOY.md`                                                   |

## Labs(2026-11-12 に統合)

Aphrody Labs はセルフホスト型プラットフォームの作業です。旧バイナリは現在 `ay conformance` になっています。

| パス                                          | 内容                                                                                |
| :-------------------------------------------- | :---------------------------------------------------------------------------------- |
| `test/conformance`、`conformance/`          | 固定済みの適合性スイート、CLI `ay conformance`                                      |
| `src/lore*`、`licenses/lore`、`tools/lore` | Lore VCS(MIT、取り込み済み)                                                         |
| `src/apm`                                  | APM クレート                                                                        |
| `[patch.crates-io]`                           | `rev` で固定した aphrody-labs フォークのパッチ済みクレート(quinn-proto、glob-match) |
| `infra/chromium-factory`                      | Chromium ビルドファクトリー                                                         |
| `plugins/labs`                                | Claude Code プラグイン `labs`                                                       |

レシピ: `just lab-build`、`just lab-dev`、`just lab-conformance`。
