# AI Triad Gateway (:4319) & MCP Federation

## Multi-Protocol Endpoints (`http://127.0.0.1:4319`)
- `POST /v1/chat/completions` — OpenAI Chat Completions wire translation (`triad/auto`, `triad/claude`, `triad/codex`, `triad/agy`, `triad/council`).
- `POST /v1/responses` — OpenAI Responses API for Codex custom `model_providers`.
- `POST /v1/messages` — Anthropic Messages v1 wire translation.
- `POST /mcp` & `triad mcp-stdio` — MCP `2025-03-26` server exposing `triad_ask_claude`, `triad_ask_codex`, `triad_ask_agy`, `triad_council_review`, and `triad_auth_status`.

## Automatic Quota Fallback
`routeTask` automatically detects HTTP `429` / `resource_exhausted` responses and fails over across `agy -> claude -> codex` without dropping context.
