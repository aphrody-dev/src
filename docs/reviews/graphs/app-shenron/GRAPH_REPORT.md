# Graph Report - shenron

## Corpus Check
- **Nodes:** 152022 · **Edges:** 245302 · **Communities:** 5442
- **Extraction Engine:** 100% Native Tree-Sitter AST & Justfile Integration

## God Nodes (Most connected abstractions)
1. `image-variants.json` [file] - 2905 connections (apps/site/src/data/image-variants.json:L1)
2. `streams.json` [file] - 2533 connections (data/streams.json:L1)
3. `en.json` [file] - 1950 connections (apps/site/messages/en.json:L1)
4. `fr.json` [file] - 1950 connections (apps/site/messages/fr.json:L1)
5. `ja.json` [file] - 1950 connections (apps/site/messages/ja.json:L1)
6. `Ok()` [function] - 1193 connections (crates/shenron-studio/src/studio.rs:L9)
7. `expect()` [function] - 1131 connections (packages/pipeline/test/rag-passage-split.test.ts:L6)
8. `JSON.stringify()` [function] - 1115 connections (packages/pipeline/test/dragon-ball-manga.test.ts:L78)
9. `bun:test` [import] - 1086 connections (packages/pipeline/test/rag-passage-split.test.ts:L1)
10. `xv2-catalog.json` [file] - 1081 connections (apps/bot/assets/dbz/xv2-catalog.json:L1)
11. `join()` [function] - 956 connections (packages/pipeline/test/orchestrator.test.ts:L30)
12. `String()` [function] - 951 connections (replica/crunchyroll/design/contrast.ts:L87)

## Key Structural Connections
- `package.json` --[defines]--> `name` (Extracted)
- `package.json` --[defines]--> `version` (Extracted)
- `package.json` --[defines]--> `private` (Extracted)
- `package.json` --[defines]--> `description` (Extracted)
- `package.json` --[defines]--> `workspaces` (Extracted)
- `package.json` --[defines]--> `packages` (Extracted)
- `package.json` --[defines]--> `catalog` (Extracted)
- `package.json` --[defines]--> `@ai-sdk/openai-compatible` (Extracted)
- `package.json` --[defines]--> `@ai-sdk/provider` (Extracted)
- `package.json` --[defines]--> `@aphrody/api` (Extracted)
- `package.json` --[defines]--> `@aphrody/bun-steam` (Extracted)
- `package.json` --[defines]--> `@aphrody/bun-test-dom` (Extracted)
- `package.json` --[defines]--> `@aphrody/discord-kit` (Extracted)
- `package.json` --[defines]--> `@aphrody/http` (Extracted)
- `package.json` --[defines]--> `@aphrody/inference` (Extracted)
- `package.json` --[defines]--> `@aphrody/m3-ai` (Extracted)
- `package.json` --[defines]--> `@aphrody/m3-primitives` (Extracted)
- `package.json` --[defines]--> `@aphrody/m3-reader` (Extracted)
- `package.json` --[defines]--> `@aphrody/m3-theme` (Extracted)
- `package.json` --[defines]--> `@aphrody/m3-tokens` (Extracted)

## Architecture Diagram (Mermaid Preview)

```mermaid
flowchart TD
    file_bun_lock["bun.lock"]
    file_TODO_md["TODO.md"]
    file_package_json["package.json"]
    constant_package_json_name["name"]
    constant_package_json_version["version"]
    constant_package_json_private["private"]
    constant_package_json_description["description"]
    constant_package_json_workspaces["workspaces"]
    constant_package_json_packages["packages"]
    constant_package_json_catalog["catalog"]
    constant_package_json__ai_sdk_openai_compatible["@ai-sdk/openai-compatible"]
    constant_package_json__ai_sdk_provider["@ai-sdk/provider"]
    constant_package_json__aphrody_api["@aphrody/api"]
    constant_package_json__aphrody_bun_steam["@aphrody/bun-steam"]
    constant_package_json__aphrody_bun_test_dom["@aphrody/bun-test-dom"]
    constant_package_json__aphrody_discord_kit["@aphrody/discord-kit"]
    constant_package_json__aphrody_http["@aphrody/http"]
    constant_package_json__aphrody_inference["@aphrody/inference"]
    constant_package_json__aphrody_m3_ai["@aphrody/m3-ai"]
    constant_package_json__aphrody_m3_primitives["@aphrody/m3-primitives"]
    constant_package_json__aphrody_m3_reader["@aphrody/m3-reader"]
    constant_package_json__aphrody_m3_theme["@aphrody/m3-theme"]
    constant_package_json__aphrody_m3_tokens["@aphrody/m3-tokens"]
    constant_package_json__aphrody_messaging["@aphrody/messaging"]
    constant_package_json__aphrody_paths["@aphrody/paths"]
    constant_package_json__aphrody_plugin_opener["@aphrody/plugin-opener"]
    constant_package_json__aphrody_runtime_sdk["@aphrody/runtime-sdk"]
    constant_package_json__aphrody_sql["@aphrody/sql"]
    constant_package_json__base_ui_react["@base-ui/react"]
    constant_package_json__better_auth_cimd["@better-auth/cimd"]
    constant_package_json__better_auth_mcp["@better-auth/mcp"]
    constant_package_json__better_auth_oauth_provider["@better-auth/oauth-provider"]
    constant_package_json__better_auth_passkey["@better-auth/passkey"]
    constant_package_json__codemirror_lang_markdown["@codemirror/lang-markdown"]
    constant_package_json__codemirror_language_data["@codemirror/language-data"]
    file_package_json -->|defines| constant_package_json_name
    file_package_json -->|defines| constant_package_json_version
    file_package_json -->|defines| constant_package_json_private
    file_package_json -->|defines| constant_package_json_description
    file_package_json -->|defines| constant_package_json_workspaces
    file_package_json -->|defines| constant_package_json_packages
    file_package_json -->|defines| constant_package_json_catalog
    file_package_json -->|defines| constant_package_json__ai_sdk_openai_compatible
    file_package_json -->|defines| constant_package_json__ai_sdk_provider
    file_package_json -->|defines| constant_package_json__aphrody_api
    file_package_json -->|defines| constant_package_json__aphrody_bun_steam
    file_package_json -->|defines| constant_package_json__aphrody_bun_test_dom
    file_package_json -->|defines| constant_package_json__aphrody_discord_kit
    file_package_json -->|defines| constant_package_json__aphrody_http
    file_package_json -->|defines| constant_package_json__aphrody_inference
    file_package_json -->|defines| constant_package_json__aphrody_m3_ai
    file_package_json -->|defines| constant_package_json__aphrody_m3_primitives
    file_package_json -->|defines| constant_package_json__aphrody_m3_reader
    file_package_json -->|defines| constant_package_json__aphrody_m3_theme
    file_package_json -->|defines| constant_package_json__aphrody_m3_tokens
    file_package_json -->|defines| constant_package_json__aphrody_messaging
    file_package_json -->|defines| constant_package_json__aphrody_paths
    file_package_json -->|defines| constant_package_json__aphrody_plugin_opener
    file_package_json -->|defines| constant_package_json__aphrody_runtime_sdk
    file_package_json -->|defines| constant_package_json__aphrody_sql
    file_package_json -->|defines| constant_package_json__base_ui_react
    file_package_json -->|defines| constant_package_json__better_auth_cimd
    file_package_json -->|defines| constant_package_json__better_auth_mcp
    file_package_json -->|defines| constant_package_json__better_auth_oauth_provider
    file_package_json -->|defines| constant_package_json__better_auth_passkey
    file_package_json -->|defines| constant_package_json__codemirror_lang_markdown
    file_package_json -->|defines| constant_package_json__codemirror_language_data

```
