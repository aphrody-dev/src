[English source](../../games/PLAN.md)

# src のゲームとクリエイティブスイート: 計画(2026-11-13 改訂)

本書は初版を置き換えます。初版はリポジトリで既に決定済みの事項(UI スタック、GPU のピン、FFmpeg バインディング、C ABI)を提案していたため、撤回しました。以下の各行には、2026-11-13 に事実を読んだ場所を記します。行に明記がない限り、何も構築されていません。

## 1. 既存のもの

| 領域                   | 状態                                                                                                                                                                                               | 参照先                                                  |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| UI の決定              | 2026-11-13 のオーナー決定(同日修正)。フレームワークは自由(Bevy UI、egui、iced、WinUI 3、Tauri、GPUI、WebUI など)で、基準は描画品質、性能、機能                                                     | `docs/ui/STACK.md`                                      |
| デザインシステム       | トークンは `packages/design`。Rust コアは `crates/aphrody-ui` で、レイアウトアダプター `to_bevy`(`css_to_bevy_node`)と `to_egui` を任意機能 `bevy`、`egui` の背後に置く                            | `docs/design/DESIGN_SYSTEM.md`、`crates/aphrody-ui/Cargo.toml` |
| エンジンと GPU のピン  | `[workspace.dependencies]`: bevy 0.20、egui 0.37、wgpu 30.0.1、winit 0.31.0-beta.4、image 0.25.10                                                                                                  | `Cargo.toml` 124〜162 行                                |
| メディア領域           | `crates/tv-core`、`tv-ffmpeg`(`ffmpeg-next` 9.1.0 の安全なラッパー)、`tv-cli`、`tv-i18n`                                                                                                           | `docs/tv/plan-ecosysteme-c-rust.mdx`                    |
| ライセンス方針         | `deny.toml` の許可リスト。GPL、LGPL、AGPL、OSI 非準拠、`NOASSERTION` のリポジトリは、レビューの記録がない限り不可。FFmpeg の libav* は動的リンクで、ベンダリングしない                             | `docs/ARCHITECTURE.md`、`deny.toml`                     |
| C ABI                  | `crates/core-capi`(cbindgen、`include/aphrody_core.h`)が `crates/core` を包む。Bun バインディングは `packages/core/src/ffi.ts`、規則は `docs/native/llvm/C-ABI-2026.md`                                   | 同左                                                    |
| コードグラフ           | `ay graph build`(tree-sitter)、レシピ `just graph <path> <name>`、出力は `graphify-out/<name>`(追跡対象外)                                                                                         | `justfile`                                              |
| フラット化             | `ay flat list\|sync\|check` が bun フォークのリーフクレートを `crates/bun-flat` にコピーする。アップストリームのクレートごとに 1 モジュールで、フォークのコミットとライセンスを `flat.toml` に記録 | `crates/bun-flat/flat.toml`                             |
| 固定済みチェックアウト | `third_party/artcraft`(`83aad5eb`)、`third_party/ffmpeg`(`46d13a83`)、`third_party/storyteller-bevy`(`4ce8b72c`)、`third_party/wgpu`(aphrody-labs フォーク)、`third_party/winit`                   | `DEPS`、`src.lock.json`                                 |
| 追跡中のフォーク       | `third_party/forks.txt` に bevyengine 18、storytold 33、EpicGames 10 件                                                                                                                            | `docs/epic/TRACKING.md`                                 |
| 方向性                 | 「Epic track(予定なし)」。Unreal Engine は非公開フォーク経由のみ                                                                                                                                   | `docs/STACK-ROADMAP.md`                                 |

## 2. 統合を制約するバージョン(`gh api`、2026-11-13)

| スタック                                                                  | wgpu                                      | winit                                    | UI                                                     | ライセンス                                               |
| :------------------------------------------------------------------------ | :---------------------------------------- | :--------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------- |
| src ワークスペース                                                        | 30.0.1                                    | 0.31.0-beta.4                            | `docs/ui/STACK.md` に従う                              | MIT OR Apache-2.0                                        |
| Bevy v0.20.1(最新リリース)                                                | 30                                        | 0.30                                     | bevy_ui                                                | MIT OR Apache-2.0                                        |
| Craft Apps(photocraft、filmcraft、soundcraft、craft-launcher、craft-libs) | 30.0(`storytold/egui` の `6d518fc7` 経由) | 0.30.13(`storytold/winit` の `a517b384`) | egui 0.37.0(フォーク)                                  | Apache-2.0                                               |
| ArtCraft Studio(`storytold/artcraft`)                                     | 未確認                                    | 未確認                                   | Tauri 2.11.2 の Web ビューと TypeScript フロントエンド | Apache-2.0 と MIT のファイル                             |
| `storytold/artcraft-services`(バックエンド)                               | 該当なし                                  | 該当なし                                 | 該当なし                                               | 「ArtCraft License (WIP)」。フェアソースで、私的利用のみ |

読み取り: Rust の 3 スタックはいずれも wgpu 30 なので、wgpu は 1 つで足ります。winit は異なります。src は 0.31.0-beta.4、Bevy 0.20.1 と Craft の egui フォークは 0.30.x です。現在 winit に依存するのは `gamescope-cli` のみで、`aphrody-ui` は `bevy_ui` だけを有効にしているため、ワークスペース内の winit は 1 つです。`bevy_winit` や `egui-winit` を追加すると 2 つ目が入ります。

## 3. 検出した衝突と、オーナーの決定までの既定動作

1. 2026-11-13 にオーナーが決定: 見た目が良く、最適化され、機能する限り、どの UI フレームワークも認める。したがって Craft Apps は egui を維持し、Aphrody のトークンは `aphrody-ui` の `egui` 機能で届ける。これは `docs/ui/STACK.md` の 4 参照ルールを修正する。
2. `third_party/storyteller-bevy` はライセンスファイルも `license` フィールドもないままピンされている(最終コミット 2024-04-09)。既定: 参照目的の閲覧のみで、`crates/` にはコピーせず、ロックからの削除候補とする。
3. `docs/tv/plan-ecosysteme-c-rust.mdx` は x264 と x265(GPL)を挙げるが、`docs/ARCHITECTURE.md` は GPL を拒否し、`tv-ffmpeg` のテスト `ffmpeg_build_is_lgpl` は `--enable-gpl` でビルドした libavutil を拒否する。既定: テストが強制する内容(LGPL ビルド、ハードウェアエンコーダー)。
4. `C` という名前のルートディレクトリを新設すると、レイヤリングと archguard のルート許可リストに反する(C ABI は `crates/core-capi`)。既定: 新しいルートディレクトリは作らない。新しい C サーフェスは `core-capi` か `<domain>-capi` クレートに置く。
5. `storytold/artcraft-services` は OSI 非準拠ライセンスである。既定: フォークもコピーもせず、文書化された HTTP API の呼び出しのみ(`docs/games/ARTCRAFT.md`)。

## 4. 作業順序と各ステップの検証

Rust のビルドは CI か fr1 で行い、ワークステーションでは行いません。

| #   | ステップ                                                                                                                                                                                        | 検証                                                   | 状態                                                                                                                                                                         |
| :-- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 既存のチェックアウトを `just graph third_party/<path> <name>` でグラフ化                                                                                                                        | ノード数とエッジ数を含む `GRAPH_REPORT.md`             | 2026-11-13 に `ay graph build` で完了(出力は `graphify-out/`、追跡対象外)。libavcodec 29819 / 97225、`artcraft/crates` 34314 / 69018 など。各回ワークステーションで 6 秒以内 |
| 2   | 共有 clang で同ライブラリの LLVM IR を fr1 上で生成(`docs/native/llvm/UNIFIED-TOOLCHAIN.md`)                                                                                                           | 設定済みの LGPL ビルドから `.bc` を生成                | 未着手                                                                                                                                                                       |
| 3   | フォーマット層: `storytold/craft-libs`(Apache-2.0、psd、pdf、exr、heif、tiff、webp、svg、raw、docx、xlsx など 114 の `craft-<name>` クレート)を、コピーせず `rev` で固定した git 依存として評価 | CI で `cargo deny check licenses` が通る               | 未着手                                                                                                                                                                       |
| 4   | メディア: `docs/tv` の記述どおり `crates/tv-*` を拡張(本計画は追加しない)                                                                                                                       | `ffmpeg_build_is_lgpl` を含む `tv-ffmpeg` のテスト     | `crates/tv-*` を保守するセッションが担当                                                                                                                                     |
| 5   | エンジン: `aphrody-ui` の `bevy` 機能の背後で Bevy クレートを 1 機能ずつ追加。`bevy_winit` を有効にする前に winit 0.30 と 0.31 のどちらかを決める                                               | CI の `cargo tree -d` に winit と wgpu が 1 つずつ並ぶ | 未着手                                                                                                                                                                       |
| 6   | 変更が必要なリーフクレートだけをフラット化: `ay flat` をフォークごとの `flat.toml` に一般化。ライセンスなしと OSI 非準拠のソースは除外                                                          | `ay flat check --fork third_party/<name>` がクリーン   | 2026-11-13 完了: `ay flat list\|sync\|check --fork third_party/<name> [--manifest]`、フォークごとに flat.toml(bun、diffutils)、deny.toml に対する SPDX ゲート                |
| 7   | fr1 で作ったリリースビルドから Craft Apps のキャプチャ(スクリーンショット、トークン)を取得し、git の外に保存                                                                                    | `docs/games/ARTCRAFT.md` 記載のファイル                | 未着手                                                                                                                                                                       |
| 8   | Unreal Engine: 変更なし。非公開フォーク、連携のみ                                                                                                                                               | `docs/epic/RESOURCES.md`                               | 本計画での作業なし                                                                                                                                                           |

## 5. 未完了

- 本計画のために、クレートの追加、コードの移動、ビルドの実行は行っていません。src をゲームエンジンとクリエイティブスイートへ作り替える作業は始まっていません。
- 2026-11-13 の計測で、本書とは無関係に失敗したゲート: `ay arch check --strict`(72 件以上のエラー。50 MB を超えるバイナリを含む)、`ay manifests verify`(gitlink でないピン)、`ay doctor`(`cl.exe` なし)。

## 6. 2026-11-13 にオーナーが設定した目標(記録のみ、未着手)

- アプリは 3 つだけ、領域ごとに 1 つ: `shenron`、`rosegriffon`、そして `apps/aphrody`(aphrody.com)と `apps/aphrody-app`(aphrody.app)を統合した Aphrody アプリ。それ以外のアプリ、パッケージ、クレートは共有コードにフラット化する。`shenron` と `rosegriffon` のうち製品固有でないコードは共有クレートとパッケージへ移し、再利用する。
- 統合した Aphrody アプリが Craft Apps、ArtCraft、ゲームをホストしデプロイする。ブラウザでのフルスクリーン WebAssembly と WebGPU、オープンワールドのマルチプレイヤー、1080p で 120 fps、ゲームパッド(Xbox、PlayStation)、キーボードとマウス、音声と映像。Bevy 上に構築し、Unreal Engine との機能マトリクスを作る。
- オーナーが挙げたアップストリームは、使用前に `gh api` で確認する: `vercel-labs/ui`、`vercel-labs/native`、`niri-wm/niri`、`niri-wm/awesome-niri`、DioxusLabs 組織、`longbridge`(GPUI コンポーネント、`nsh`)、`cloudflare/vinext`、`vercel/next.js`、`vercel/vercel`、`vercel/ai`、`vercel/turborepo`、`mui/base-ui`、shadcn、`tailwindlabs/tailwindcss`、Microsoft WebUI、iced、COSMIC。
- クリーンアップ: アプリ、パッケージ、クレート内のベンダリングされた third-party コピーとネストしたコピーを削除する。依存関係は 1 つにつき 1 バージョン。バイナリを小さくする。
- 作業開始前に定義するチェック: CI での統合アプリのビルド 1 回、フレームレートを計測するブラウザ実行、置き換える機能ごとの同等性リスト。現時点ではいずれも存在しない。
- キャラクターとマスコットのアセット(イナズマイレブンとドラゴンボールのキャラクター、Tux、Bun のマスコット、第三者のロゴ)は権利者のものであり、再配布を許すライセンスのアセットだけをこの公開リポジトリに入れる。
