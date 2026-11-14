[English source](../../../AGENTS.md)

# src: エージェント運用規約 (`AGENTS.md`)

すべてのエージェント CLI(Claude Code、Codex、Antigravity、OpenCode、Pi、Zed)が読みます。2026-11-13 に [`docs/games/PLAN.md`](../../games/PLAN.md) を軸に書き直しました。以前の「sovereign」という表現とその規則は撤回済みです。

## 1. src とは

src は Aphrody の公開モノレポです。方向性は、オープンに作るゲームエンジンとクリエイティブスイートです。エンジンは Bevy、制作ツールは Craft Apps と ArtCraft、メディアは `crates/tv-*` と FFmpeg、Unreal Engine は連携のみ(非公開フォークで、公開しません)とし、既存のプラットフォーム(Bun と Rust のツール、デプロイ、Linux と Windows のレイヤー)の上に載せます。状態と作業順序は `docs/games/PLAN.md` にあります。このリファクタリングはまだ何も構築されていません。尋ねられたらそう答えます。

## 2. 構成

- `apps/`: `aphrody`、`aphrody-app`、`auto`、`l2l`、`nt`、`r2b`、`r2-site`、`rosegriffon`、`shenron`、`unixwin`、`yolo`。git サブモジュールは `auto`、`r2b`、`rosegriffon`、`shenron` のみです。`rosegriffon` と `shenron` は Aphrody が保守するコミュニティサイトで、Aphrody のプロダクトではありません。
- `packages/`: Bun の `@aphrody/*` パッケージ群(`ai-os`、`core`、`deploy`、`design`、`forge`、`gaming` など)。
- `crates/`: 単一のフラットなワークスペースにある Rust 2024 クレート群(`ay`、`archguard`、`xtask`、`depot-*`、`lore*`、`aphrody-ui`、`core`、`core-capi`、`ffi`、`tv-*` など)。
- `infra/`: アップストリームのツールを組み合わせたフリートとデプロイの設定。
- `third_party/`: アップストリームのチェックアウトと aphrody-labs のフォーク。`src.lock.json` で固定します。

## 3. エージェントの働き方

- エージェントは自由に動きます。承認も確認も人手も介しません。判断し、実行し、検証し、完了したことと未完了のことを報告します。
- すべて `main` に直接コミットしてプッシュします。ブランチもワークツリーも使わず、アップストリームへのプッシュもしません。
- 窓口は `just` と `ay` CLI(`docs/ay/NAMING.md`)です。Rust のコンパイルは CI か fr1 で行い、ワークステーションでは行いません。prd は本番バックエンド専用、fr2 はエッジ専用です。
- UI フレームワークは自由です(Bevy UI、egui、iced、WinUI 3、Tauri、GPUI、WebUI)。基準は描画品質、性能、機能です。トークンは `packages/design` と `crates/aphrody-ui` から取ります。
- AI 機能は `packages/ai-os` にのみ置きます。プロバイダーとモデルは実行時に検出し、ハードコードしません。
- シークレットスキャンがクリーンになったら、公開リポジトリ、GitHub のリリースとタグ、crates.io、npm で公開します(`docs/publish/STATUS.md`)。

## 4. 変わらない制限

これらは他者の権利と、取り返しのつかない損害についての事実であり、プロセス上の規則ではありません。

- シークレット: `.env` の値を出力、ログ記録、コミットしません。コミットするのは `.env.example` のみです。リポジトリは公開されています。
- Unreal Engine のソース、Oodle と MSVC の SDK、ライセンスのないコードや OSI 非準拠ライセンスのコードは、リポジトリにコピーも公開もしません。
- ホストのシステムディレクトリ(`C:\Windows\System32`)は変更しません。ユーザーランドのバイナリは `~/.local/bin` に置きます。
- コード、文書、UI 文言、コミットに絵文字と AI の帰属表記は入れません。アップストリームへの貢献は、そのアップストリームの方針に従います。
- ドメインの純度は `ay arch check --strict` が検査します。`crates/*` は Rust のみ、`packages/*` は Bun のみ、アップストリームのコードは `third_party/` に置きます。

## 5. ゲームと Steam

所有関係の一覧: `docs/gaming/OWNERSHIP.md`。Rust は `crates/steam-depot`(`ay steam`)、Bun は `packages/gaming`(`ay gaming`)です。プラグインと MCP は `apps/rosegriffon/plugins/steam` にあり、そのスキルはそこで編集し、`ay gaming skills sync` でミラーします。
