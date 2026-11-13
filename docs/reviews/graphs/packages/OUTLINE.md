# Codebase Digest: packages

- Files analyzed: 872
- Total lines: 46104
- Total size: 1.80 MB
- Git branch: `main`
- Git HEAD commit: `272c544f (docker: ship vendor icons, wallpaper thumbs and crates/game/assets to the bun-build stage (aphrody, r2-site, api-gateway images))`
- Digest mode: `AST-Smart Outline`

## Directory Structure

```text
packages/
├── DEPS.rules (2 lines, 91 B, ~23 tokens)
├── ai-os/
│   ├── DEPS.rules (2 lines, 91 B, ~23 tokens)
│   ├── NOTICE (7 lines, 415 B, ~104 tokens)
│   ├── README.md (38 lines, 3.0 KB, ~846 tokens)
│   ├── bench/
│   │   ├── retrieval.ts (12 lines, 481 B, ~142 tokens)
│   │   └── srcdocs.ts (5 lines, 140 B, ~42 tokens)
│   ├── config/
│   │   ├── model-routing.json (260 lines, 6.6 KB, ~2.5k tokens)
│   │   └── review.json (135 lines, 6.2 KB, ~2.1k tokens)
│   ├── docs/
│   │   ├── ARCHITECTURE.md (116 lines, 14.4 KB, ~3.5k tokens)
│   │   ├── BRAIN.md (42 lines, 3.6 KB, ~982 tokens)
│   │   ├── FUSION.md (83 lines, 13.0 KB, ~3.2k tokens)
│   │   ├── LEGACY-INVENTORY.md (37 lines, 3.6 KB, ~1.0k tokens)
│   │   ├── MODEL_ROUTING.md (81 lines, 9.2 KB, ~2.7k tokens)
│   │   ├── NHITL.md (34 lines, 4.5 KB, ~1.2k tokens)
│   │   ├── NOTE-core-hash.md (8 lines, 652 B, ~173 tokens)
│   │   ├── ORCHESTRATOR.md (244 lines, 26.6 KB, ~7.0k tokens)
│   │   ├── RELAY.md (28 lines, 3.3 KB, ~938 tokens)
│   │   ├── ROADMAP.md (19 lines, 3.1 KB, ~826 tokens)
│   │   ├── SESSION-2026-11-13.md (20 lines, 2.2 KB, ~621 tokens)
│   │   ├── cli-reference/
│   │   │   ├── agy.md (51 lines, 4.5 KB, ~1.4k tokens)
│   │   │   └── claude-code.md (55 lines, 4.6 KB, ~1.4k tokens)
│   │   ├── gemini-web/
│   │   │   └── RECON.md (37 lines, 3.1 KB, ~845 tokens)
│   │   └── reviews/
│   │       └── brain-gemini-2026-11-13.md (19 lines, 1.7 KB, ~453 tokens)
│   ├── fixtures/
│   │   ├── ai_foundations_to_agi/
│   │   │   ├── fields.yaml (41 lines, 1.9 KB, ~449 tokens)
│   │   │   ├── outline.yaml (19 lines, 1.5 KB, ~369 tokens)
│   │   │   └── results/
│   │   │       ├── Alan_Turing.json (15 lines, 2.4 KB, ~589 tokens)
│   │   │       ├── Attention_Is_All_You_Need.json (15 lines, 2.5 KB, ~633 tokens)
│   │   │       └── Intelligence_artificielle_generale.json (15 lines, 2.5 KB, ~594 tokens)
│   │   └── orch/
│   │       └── proof.json (54 lines, 1.7 KB, ~627 tokens)
│   ├── licenses/
│   │   ├── hermes-agent.LICENSE (21 lines, 1.1 KB, ~257 tokens)
│   │   ├── openclaw.LICENSE (21 lines, 1.1 KB, ~255 tokens)
│   │   ├── opencode.LICENSE (21 lines, 1.0 KB, ~253 tokens)
│   │   └── pi.LICENSE (21 lines, 1.0 KB, ~253 tokens)
│   ├── native/
│   │   └── relay-windows/
│   │       ├── Program.cs (159 lines, 7.7 KB, ~1.9k tokens)
│   │       ├── Relay.Service.csproj (18 lines, 825 B, ~212 tokens)
│   │       └── install.ps1 (30 lines, 2.3 KB, ~649 tokens)
│   ├── package.json (36 lines, 1.5 KB, ~551 tokens)
│   ├── python/
│   │   ├── agent_core/
│   │   │   └── pyproject.toml (13 lines, 322 B, ~106 tokens)
│   │   ├── hermes_agent_memory/
│   │   │   ├── pyproject.toml (19 lines, 484 B, ~140 tokens)
│   │   │   ├── src/
│   │   │   │   └── hermes_agent_memory/
│   │   │   │       └── __init__.py (25 lines, 1.2 KB, ~396 tokens)
│   │   │   └── tests/
│   │   │       └── test_provider.py (5 lines, 153 B, ~40 tokens)
│   │   └── research_ref/
│   │       ├── pyproject.toml (5 lines, 182 B, ~54 tokens)
│   │       └── validate_json.py (7 lines, 196 B, ~56 tokens)
│   ├── src/
│   │   ├── agent-cli.ts (9 lines, 219 B, ~69 tokens)
│   │   ├── brain/
│   │   │   ├── cli.ts (16 lines, 524 B, ~159 tokens)
│   │   │   └── design.ts (5 lines, 182 B, ~53 tokens)
│   │   ├── cli.ts (1 lines, 35 B, ~11 tokens)
│   │   ├── core/
│   │   │   ├── agent.ts (11 lines, 273 B, ~85 tokens)
│   │   │   ├── context.ts (26 lines, 1.1 KB, ~348 tokens)
│   │   │   ├── council.ts (9 lines, 330 B, ~99 tokens)
│   │   │   ├── home.ts (10 lines, 423 B, ~121 tokens)
│   │   │   ├── hub.ts (13 lines, 397 B, ~120 tokens)
│   │   │   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   │   ├── memory.ts (14 lines, 529 B, ~166 tokens)
│   │   │   ├── model.ts (5 lines, 138 B, ~43 tokens)
│   │   │   ├── scheduler.ts (18 lines, 639 B, ~202 tokens)
│   │   │   ├── secrets.ts (5 lines, 285 B, ~79 tokens)
│   │   │   ├── shell.ts (4 lines, 140 B, ~41 tokens)
│   │   │   ├── skill-lint.ts (6 lines, 221 B, ~64 tokens)
│   │   │   ├── skills.ts (20 lines, 804 B, ~240 tokens)
│   │   │   └── tools.ts (12 lines, 327 B, ~101 tokens)
│   │   ├── fabric/
│   │   │   ├── cli.ts (3 lines, 73 B, ~23 tokens)
│   │   │   └── index.ts (39 lines, 1.7 KB, ~513 tokens)
│   │   ├── gateway/
│   │   │   └── index.ts (16 lines, 529 B, ~162 tokens)
│   │   ├── google/
│   │   │   ├── absorb.ts (11 lines, 408 B, ~122 tokens)
│   │   │   ├── auth.ts (3 lines, 168 B, ~47 tokens)
│   │   │   ├── cli.ts (9 lines, 403 B, ~117 tokens)
│   │   │   ├── jules/
│   │   │   │   ├── LICENSE (201 lines, 11.1 KB, ~2.6k tokens)
│   │   │   │   ├── activities/
│   │   │   │   │   ├── client.ts (20 lines, 854 B, ~243 tokens)
│   │   │   │   │   ├── summary.ts (3 lines, 125 B, ~35 tokens)
│   │   │   │   │   └── types.ts (5 lines, 164 B, ~46 tokens)
│   │   │   │   ├── api.ts (14 lines, 588 B, ~165 tokens)
│   │   │   │   ├── artifacts.ts (13 lines, 581 B, ~160 tokens)
│   │   │   │   ├── caching.ts (6 lines, 213 B, ~64 tokens)
│   │   │   │   ├── client.ts (38 lines, 1.5 KB, ~435 tokens)
│   │   │   │   ├── errors.ts (23 lines, 1.1 KB, ~298 tokens)
│   │   │   │   ├── index.ts (7 lines, 220 B, ~68 tokens)
│   │   │   │   ├── mappers.ts (11 lines, 508 B, ~127 tokens)
│   │   │   │   ├── network/
│   │   │   │   │   └── adapter.ts (13 lines, 474 B, ~140 tokens)
│   │   │   │   ├── platform/
│   │   │   │   │   ├── node.ts (17 lines, 778 B, ~226 tokens)
│   │   │   │   │   └── types.ts (3 lines, 107 B, ~29 tokens)
│   │   │   │   ├── polling.ts (7 lines, 208 B, ~62 tokens)
│   │   │   │   ├── query/
│   │   │   │   │   ├── computed.ts (10 lines, 516 B, ~133 tokens)
│   │   │   │   │   ├── projection.ts (10 lines, 522 B, ~146 tokens)
│   │   │   │   │   ├── schema.ts (8 lines, 361 B, ~95 tokens)
│   │   │   │   │   ├── select.ts (12 lines, 471 B, ~136 tokens)
│   │   │   │   │   └── validate.ts (19 lines, 894 B, ~229 tokens)
│   │   │   │   ├── retry-utils.ts (4 lines, 159 B, ~43 tokens)
│   │   │   │   ├── session.ts (35 lines, 1.3 KB, ~411 tokens)
│   │   │   │   ├── sessions.ts (13 lines, 554 B, ~156 tokens)
│   │   │   │   ├── snapshot.ts (11 lines, 552 B, ~143 tokens)
│   │   │   │   ├── sources.ts (13 lines, 528 B, ~144 tokens)
│   │   │   │   ├── storage/
│   │   │   │   │   ├── cache-info.ts (15 lines, 545 B, ~146 tokens)
│   │   │   │   │   ├── memory.ts (17 lines, 921 B, ~258 tokens)
│   │   │   │   │   ├── node-fs.ts (27 lines, 1.3 KB, ~379 tokens)
│   │   │   │   │   ├── root.ts (6 lines, 187 B, ~56 tokens)
│   │   │   │   │   └── types.ts (8 lines, 283 B, ~77 tokens)
│   │   │   │   ├── streaming.ts (8 lines, 236 B, ~71 tokens)
│   │   │   │   ├── types.ts (73 lines, 3.3 KB, ~828 tokens)
│   │   │   │   ├── utils/
│   │   │   │   │   └── page-token.ts (3 lines, 131 B, ~36 tokens)
│   │   │   │   └── utils.ts (2 lines, 74 B, ~24 tokens)
│   │   │   ├── stitch/
│   │   │   │   ├── LICENSE (200 lines, 11.0 KB, ~2.5k tokens)
│   │   │   │   ├── generated/
│   │   │   │   │   └── src/
│   │   │   │   │       ├── designsystem.ts (13 lines, 497 B, ~154 tokens)
│   │   │   │   │       ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   │   │   │       ├── project.ts (21 lines, 842 B, ~252 tokens)
│   │   │   │   │       ├── responses.generated.ts (17 lines, 782 B, ~181 tokens)
│   │   │   │   │       ├── screen.ts (16 lines, 592 B, ~182 tokens)
│   │   │   │   │       ├── stitch.ts (11 lines, 412 B, ~129 tokens)
│   │   │   │   │       ├── tool-definitions.ts (4 lines, 152 B, ~39 tokens)
│   │   │   │   │       └── types.generated.ts (33 lines, 1.2 KB, ~315 tokens)
│   │   │   │   └── src/
│   │   │   │       ├── auth.ts (7 lines, 288 B, ~78 tokens)
│   │   │   │       ├── client.ts (32 lines, 1.4 KB, ~421 tokens)
│   │   │   │       ├── constants.ts (1 lines, 35 B, ~11 tokens)
│   │   │   │       ├── content-handler.ts (4 lines, 171 B, ~44 tokens)
│   │   │   │       ├── debug.ts (4 lines, 253 B, ~70 tokens)
│   │   │   │       ├── download-handler.ts (21 lines, 948 B, ~258 tokens)
│   │   │   │       ├── entity-manager.ts (13 lines, 624 B, ~179 tokens)
│   │   │   │       ├── generation.ts (15 lines, 603 B, ~181 tokens)
│   │   │   │       ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   │   │       ├── project-ext.ts (13 lines, 417 B, ~127 tokens)
│   │   │   │       ├── schema-repair.ts (6 lines, 274 B, ~77 tokens)
│   │   │   │       ├── screen-ext.ts (12 lines, 525 B, ~153 tokens)
│   │   │   │       ├── singleton.ts (15 lines, 675 B, ~186 tokens)
│   │   │   │       ├── slugify.ts (2 lines, 65 B, ~20 tokens)
│   │   │   │       ├── spec/
│   │   │   │       │   ├── client.ts (10 lines, 336 B, ~94 tokens)
│   │   │   │       │   ├── content.ts (7 lines, 275 B, ~72 tokens)
│   │   │   │       │   ├── download.ts (10 lines, 379 B, ~98 tokens)
│   │   │   │       │   ├── error-mapping.ts (4 lines, 166 B, ~46 tokens)
│   │   │   │       │   ├── errors.ts (7 lines, 342 B, ~89 tokens)
│   │   │   │       │   ├── upload.ts (8 lines, 324 B, ~89 tokens)
│   │   │   │       │   └── validate.ts (13 lines, 640 B, ~205 tokens)
│   │   │   │       ├── tool-map.ts (5 lines, 239 B, ~64 tokens)
│   │   │   │       ├── tools.ts (1 lines, 35 B, ~11 tokens)
│   │   │   │       ├── types.ts (3 lines, 108 B, ~33 tokens)
│   │   │   │       ├── upload-handler.ts (12 lines, 485 B, ~135 tokens)
│   │   │   │       ├── utils.ts (2 lines, 96 B, ~27 tokens)
│   │   │   │       ├── version.ts (1 lines, 34 B, ~10 tokens)
│   │   │   │       └── virtual-tools.ts (4 lines, 165 B, ~49 tokens)
│   │   │   └── tools.ts (3 lines, 82 B, ~27 tokens)
│   │   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   ├── llm/
│   │   │   ├── agents.ts (9 lines, 290 B, ~87 tokens)
│   │   │   ├── generate.ts (7 lines, 223 B, ~64 tokens)
│   │   │   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   │   ├── model.ts (13 lines, 538 B, ~152 tokens)
│   │   │   ├── models.ts (8 lines, 320 B, ~96 tokens)
│   │   │   ├── schema.ts (4 lines, 132 B, ~39 tokens)
│   │   │   ├── testing.ts (6 lines, 245 B, ~71 tokens)
│   │   │   └── types.ts (12 lines, 370 B, ~112 tokens)
│   │   ├── nhitl/
│   │   │   ├── cli.ts (4 lines, 90 B, ~28 tokens)
│   │   │   ├── index.ts (22 lines, 846 B, ~263 tokens)
│   │   │   ├── ledger.json (261 lines, 17.2 KB, ~5.1k tokens)
│   │   │   ├── login.ts (10 lines, 356 B, ~111 tokens)
│   │   │   ├── scan.ts (4 lines, 154 B, ~47 tokens)
│   │   │   └── scanners.ts (22 lines, 983 B, ~281 tokens)
│   │   ├── orch/
│   │   │   ├── classify.ts (5 lines, 285 B, ~82 tokens)
│   │   │   ├── cli.ts (8 lines, 168 B, ~53 tokens)
│   │   │   ├── fleet.ts (11 lines, 422 B, ~129 tokens)
│   │   │   ├── health.ts (13 lines, 425 B, ~133 tokens)
│   │   │   ├── inline.ts (9 lines, 263 B, ~81 tokens)
│   │   │   ├── lifecycle.ts (7 lines, 281 B, ~80 tokens)
│   │   │   ├── policy.ts (7 lines, 224 B, ~66 tokens)
│   │   │   ├── queue.ts (15 lines, 697 B, ~202 tokens)
│   │   │   ├── run.ts (28 lines, 1.0 KB, ~310 tokens)
│   │   │   └── select.ts (17 lines, 585 B, ~174 tokens)
│   │   ├── relay/
│   │   │   ├── a2a.ts (18 lines, 645 B, ~200 tokens)
│   │   │   ├── accounts.ts (6 lines, 327 B, ~95 tokens)
│   │   │   ├── acp.ts (13 lines, 369 B, ~119 tokens)
│   │   │   ├── agent-tools.ts (12 lines, 283 B, ~93 tokens)
│   │   │   ├── backends.ts (6 lines, 187 B, ~57 tokens)
│   │   │   ├── cdp.ts (16 lines, 636 B, ~190 tokens)
│   │   │   ├── cli.ts (7 lines, 166 B, ~55 tokens)
│   │   │   ├── hook.ts (4 lines, 95 B, ~30 tokens)
│   │   │   ├── inspect.ts (2 lines, 54 B, ~18 tokens)
│   │   │   ├── mcp-http.ts (17 lines, 701 B, ~206 tokens)
│   │   │   ├── mcp-hub.ts (21 lines, 891 B, ~262 tokens)
│   │   │   ├── oauth.ts (28 lines, 1.1 KB, ~319 tokens)
│   │   │   ├── orch-tools.ts (3 lines, 80 B, ~26 tokens)
│   │   │   ├── outbound.ts (29 lines, 1.1 KB, ~325 tokens)
│   │   │   ├── protocols.ts (11 lines, 410 B, ~129 tokens)
│   │   │   ├── recon.ts (5 lines, 167 B, ~53 tokens)
│   │   │   ├── server.ts (16 lines, 453 B, ~146 tokens)
│   │   │   ├── tools.ts (13 lines, 336 B, ~110 tokens)
│   │   │   └── webmcp.ts (4 lines, 135 B, ~42 tokens)
│   │   ├── research/
│   │   │   ├── context7.ts (6 lines, 202 B, ~59 tokens)
│   │   │   ├── factcheck.ts (6 lines, 199 B, ~61 tokens)
│   │   │   └── index.ts (21 lines, 774 B, ~225 tokens)
│   │   ├── review/
│   │   │   ├── cli.ts (8 lines, 221 B, ~69 tokens)
│   │   │   ├── index.ts (44 lines, 1.6 KB, ~484 tokens)
│   │   │   └── sources.ts (16 lines, 679 B, ~199 tokens)
│   │   └── tui/
│   │       └── index.ts (10 lines, 331 B, ~98 tokens)
│   ├── templates/
│   │   └── home/
│   │       ├── AGENTS.md (130 lines, 7.0 KB, ~1.8k tokens)
│   │       ├── HEARTBEAT.md (6 lines, 230 B, ~57 tokens)
│   │       ├── IDENTITY.md (30 lines, 1.4 KB, ~403 tokens)
│   │       ├── MEMORY.md (3 lines, 100 B, ~28 tokens)
│   │       ├── SOUL.md (47 lines, 2.1 KB, ~574 tokens)
│   │       └── USER.md (25 lines, 1.1 KB, ~273 tokens)
│   └── test/
│       ├── brain.test.ts (7 lines, 198 B, ~63 tokens)
│       ├── core/
│       │   ├── context.test.ts (6 lines, 142 B, ~46 tokens)
│       │   ├── dedupe.test.ts (4 lines, 117 B, ~40 tokens)
│       │   ├── e2e.test.ts (7 lines, 173 B, ~58 tokens)
│       │   ├── hub.test.ts (6 lines, 141 B, ~46 tokens)
│       │   └── scheduler-skills.test.ts (7 lines, 173 B, ~58 tokens)
│       ├── fabric/
│       │   └── fabric.test.ts (5 lines, 110 B, ~34 tokens)
│       ├── gateway/
│       │   ├── gateway.test.ts (7 lines, 175 B, ~58 tokens)
│       │   └── hardening.test.ts (10 lines, 275 B, ~94 tokens)
│       ├── google/
│       │   ├── fixtures/
│       │   │   └── stitch/
│       │   │       ├── apply_design_system.json (29 lines, 1.2 KB, ~392 tokens)
│       │   │       ├── create_design_system.json (3 lines, 88 B, ~33 tokens)
│       │   │       ├── create_design_system_from_design_md.json (3 lines, 94 B, ~35 tokens)
│       │   │       ├── create_project.json (3 lines, 100 B, ~34 tokens)
│       │   │       ├── edit_screens.json (29 lines, 1.1 KB, ~379 tokens)
│       │   │       ├── generate_screen_from_text.json (29 lines, 1.1 KB, ~378 tokens)
│       │   │       ├── generate_variants.json (29 lines, 1.1 KB, ~378 tokens)
│       │   │       ├── get_screen.json (7 lines, 250 B, ~89 tokens)
│       │   │       ├── list_design_systems.json (7 lines, 195 B, ~68 tokens)
│       │   │       ├── list_projects.json (6 lines, 189 B, ~66 tokens)
│       │   │       ├── list_screens.json (14 lines, 499 B, ~178 tokens)
│       │   │       ├── update_design_system.json (3 lines, 88 B, ~33 tokens)
│       │   │       └── upload_design_md.json (2 lines, 57 B, ~18 tokens)
│       │   ├── jules.test.ts (7 lines, 160 B, ~51 tokens)
│       │   └── stitch.test.ts (9 lines, 245 B, ~82 tokens)
│       ├── llm/
│       │   └── llm.test.ts (4 lines, 117 B, ~40 tokens)
│       ├── nhitl/
│       │   └── nhitl.test.ts (5 lines, 110 B, ~34 tokens)
│       ├── orch/
│       │   └── orch.test.ts (6 lines, 145 B, ~48 tokens)
│       ├── relay/
│       │   ├── a2a.test.ts (5 lines, 111 B, ~35 tokens)
│       │   ├── acp.test.ts (5 lines, 111 B, ~35 tokens)
│       │   ├── agent-tools.test.ts (5 lines, 110 B, ~34 tokens)
│       │   ├── oauth.test.ts (6 lines, 133 B, ~41 tokens)
│       │   ├── outbound.test.ts (4 lines, 120 B, ~40 tokens)
│       │   ├── protocols.test.ts (3 lines, 94 B, ~30 tokens)
│       │   └── sockets.test.ts (6 lines, 188 B, ~61 tokens)
│       ├── research/
│       │   ├── bench.test.ts (3 lines, 86 B, ~27 tokens)
│       │   ├── factcheck.test.ts (4 lines, 121 B, ~40 tokens)
│       │   └── research.test.ts (8 lines, 209 B, ~70 tokens)
│       ├── review/
│       │   └── review.test.ts (11 lines, 319 B, ~110 tokens)
│       └── tui/
│           ├── pty.test.ts (5 lines, 110 B, ~34 tokens)
│           └── tui.test.ts (8 lines, 202 B, ~69 tokens)
├── assets/
│   ├── package.json (26 lines, 953 B, ~335 tokens)
│   ├── src/
│   │   ├── bundle.ts (11 lines, 337 B, ~98 tokens)
│   │   ├── cli.ts (15 lines, 402 B, ~126 tokens)
│   │   ├── games.ts (10 lines, 457 B, ~131 tokens)
│   │   ├── gen/
│   │   │   ├── core.ts (24 lines, 1.1 KB, ~340 tokens)
│   │   │   ├── gen.ts (24 lines, 1.0 KB, ~309 tokens)
│   │   │   ├── styles.ts (15 lines, 630 B, ~197 tokens)
│   │   │   ├── svg.ts (11 lines, 604 B, ~178 tokens)
│   │   │   └── themes.ts (7 lines, 299 B, ~89 tokens)
│   │   ├── icons.ts (13 lines, 475 B, ~135 tokens)
│   │   ├── manifest.ts (18 lines, 921 B, ~269 tokens)
│   │   ├── modules.d.ts (1 lines, 34 B, ~10 tokens)
│   │   ├── optimize.ts (13 lines, 510 B, ~149 tokens)
│   │   ├── publish.ts (13 lines, 518 B, ~152 tokens)
│   │   ├── repos.ts (14 lines, 510 B, ~153 tokens)
│   │   ├── retest.ts (9 lines, 393 B, ~112 tokens)
│   │   ├── sources.ts (16 lines, 541 B, ~155 tokens)
│   │   ├── test.ts (21 lines, 984 B, ~280 tokens)
│   │   └── util.ts (7 lines, 228 B, ~69 tokens)
│   ├── tests/
│   │   ├── asset-test/
│   │   │   ├── library.test.ts (4 lines, 102 B, ~34 tokens)
│   │   │   └── test.test.ts (4 lines, 112 B, ~39 tokens)
│   │   ├── manifest.test.ts (3 lines, 83 B, ~26 tokens)
│   │   └── pipeline.test.ts (11 lines, 272 B, ~91 tokens)
│   └── tsconfig.json (11 lines, 346 B, ~118 tokens)
├── bun-parity/
│   ├── PARITY_REPORT.md (178 lines, 25.5 KB, ~6.9k tokens)
│   ├── bin/
│   │   └── bpt.ts (7 lines, 227 B, ~72 tokens)
│   ├── bunfig.toml (12 lines, 176 B, ~50 tokens)
│   ├── package.json (29 lines, 1020 B, ~356 tokens)
│   ├── parity-matrix.json (505 lines, 25.4 KB, ~7.6k tokens)
│   ├── patches/
│   │   ├── 0001-mime-chromium-types.patch (15 lines, 791 B, ~199 tokens)
│   │   ├── 0002-scheduler-webapi-decl.patch (34 lines, 1.0 KB, ~281 tokens)
│   │   ├── RUST_INTEGRATION_SPEC.md (66 lines, 2.4 KB, ~668 tokens)
│   │   └── series (2 lines, 64 B, ~18 tokens)
│   ├── src/
│   │   ├── compare/
│   │   │   ├── compare.ts (19 lines, 802 B, ~248 tokens)
│   │   │   └── fixtures/
│   │   │       └── shell-windows.ts (2 lines, 48 B, ~15 tokens)
│   │   ├── env.d.ts (3 lines, 95 B, ~27 tokens)
│   │   ├── index.ts (1 lines, 34 B, ~10 tokens)
│   │   ├── llms/
│   │   │   ├── cli.ts (8 lines, 278 B, ~84 tokens)
│   │   │   ├── extract.ts (15 lines, 623 B, ~180 tokens)
│   │   │   └── run.ts (11 lines, 360 B, ~105 tokens)
│   │   ├── patcher/
│   │   │   ├── index.ts (5 lines, 152 B, ~47 tokens)
│   │   │   ├── preload-gen.ts (5 lines, 144 B, ~42 tokens)
│   │   │   └── rust-gen.ts (6 lines, 174 B, ~50 tokens)
│   │   ├── polyfills/
│   │   │   ├── cache-storage.ts (24 lines, 1.2 KB, ~333 tokens)
│   │   │   ├── compression.ts (8 lines, 427 B, ~108 tokens)
│   │   │   ├── doh.ts (11 lines, 480 B, ~128 tokens)
│   │   │   ├── index.ts (10 lines, 301 B, ~89 tokens)
│   │   │   ├── locks.ts (13 lines, 542 B, ~147 tokens)
│   │   │   ├── mime.ts (9 lines, 429 B, ~122 tokens)
│   │   │   ├── scheduler.ts (24 lines, 1.1 KB, ~309 tokens)
│   │   │   └── trusted-types.ts (28 lines, 1.2 KB, ~360 tokens)
│   │   ├── preload-entry.ts (2 lines, 66 B, ~20 tokens)
│   │   ├── recon/
│   │   │   ├── api.ts (6 lines, 195 B, ~57 tokens)
│   │   │   ├── css.ts (6 lines, 164 B, ~51 tokens)
│   │   │   ├── data-assets.ts (6 lines, 177 B, ~53 tokens)
│   │   │   ├── dns.ts (5 lines, 139 B, ~42 tokens)
│   │   │   ├── html.ts (6 lines, 162 B, ~50 tokens)
│   │   │   ├── index.ts (12 lines, 286 B, ~96 tokens)
│   │   │   ├── js.ts (5 lines, 138 B, ~42 tokens)
│   │   │   ├── stack.ts (3 lines, 100 B, ~30 tokens)
│   │   │   ├── texte.ts (5 lines, 141 B, ~42 tokens)
│   │   │   └── tls.ts (5 lines, 139 B, ~42 tokens)
│   │   ├── types.ts (9 lines, 346 B, ~96 tokens)
│   │   └── utils/
│   │       └── reporter.ts (6 lines, 260 B, ~70 tokens)
│   ├── test/
│   │   ├── chromium-parity.test.ts (5 lines, 157 B, ~51 tokens)
│   │   ├── llms/
│   │   │   └── cases.json (930 lines, 43.0 KB, ~15.2k tokens)
│   │   └── llms-docs.test.ts (6 lines, 178 B, ~61 tokens)
│   └── tsconfig.json (15 lines, 504 B, ~173 tokens)
├── bun-plugins/
│   ├── bun-native.d.ts (50 lines, 2.0 KB, ~538 tokens)
│   ├── decide-plugin.ts (23 lines, 984 B, ~262 tokens)
│   ├── index.ts (1 lines, 34 B, ~10 tokens)
│   ├── just-plugin.ts (7 lines, 254 B, ~72 tokens)
│   ├── package.json (20 lines, 698 B, ~238 tokens)
│   ├── tests/
│   │   ├── just-plugin.test.ts (3 lines, 82 B, ~26 tokens)
│   │   ├── turbo-cache.test.ts (4 lines, 109 B, ~34 tokens)
│   │   └── vcs-meta.test.ts (4 lines, 106 B, ~34 tokens)
│   ├── tsconfig.json (13 lines, 413 B, ~141 tokens)
│   ├── turbo-cache-plugin.ts (13 lines, 436 B, ~128 tokens)
│   └── vcs-meta-plugin.ts (8 lines, 309 B, ~89 tokens)
├── chromium-bun/
│   ├── REPORT.md (329 lines, 37.7 KB, ~10.4k tokens)
│   ├── package.json (26 lines, 997 B, ~350 tokens)
│   ├── profiles/
│   │   └── headless.json (151 lines, 8.1 KB, ~2.6k tokens)
│   ├── src/
│   │   ├── audit/
│   │   │   ├── chromium-inspector.ts (11 lines, 375 B, ~103 tokens)
│   │   │   └── purge-matrix.ts (2 lines, 58 B, ~19 tokens)
│   │   ├── benchmarks/
│   │   │   ├── category-a-engines.ts (20 lines, 817 B, ~231 tokens)
│   │   │   ├── category-b-os-posix.ts (9 lines, 276 B, ~84 tokens)
│   │   │   ├── category-c-shells.ts (7 lines, 258 B, ~74 tokens)
│   │   │   ├── category-d-build.ts (6 lines, 194 B, ~58 tokens)
│   │   │   ├── category-e-compression-db.ts (4 lines, 140 B, ~40 tokens)
│   │   │   ├── headless-sites.ts (17 lines, 608 B, ~186 tokens)
│   │   │   └── runner.ts (15 lines, 503 B, ~156 tokens)
│   │   ├── browser/
│   │   │   ├── bun-v8-bridge.ts (23 lines, 1.1 KB, ~307 tokens)
│   │   │   ├── cdp-client.ts (30 lines, 1.5 KB, ~414 tokens)
│   │   │   ├── chromium-tracker.ts (19 lines, 866 B, ~222 tokens)
│   │   │   ├── launcher.ts (11 lines, 450 B, ~122 tokens)
│   │   │   ├── profile.ts (18 lines, 822 B, ~231 tokens)
│   │   │   ├── shields.ts (13 lines, 443 B, ~137 tokens)
│   │   │   └── ssrf.ts (11 lines, 526 B, ~147 tokens)
│   │   ├── cli.ts (10 lines, 343 B, ~109 tokens)
│   │   ├── engines/
│   │   │   ├── cli.ts (7 lines, 245 B, ~74 tokens)
│   │   │   ├── index.ts (1 lines, 34 B, ~10 tokens)
│   │   │   ├── install.ts (6 lines, 190 B, ~54 tokens)
│   │   │   ├── launch.ts (11 lines, 400 B, ~115 tokens)
│   │   │   ├── matrix.ts (9 lines, 465 B, ~132 tokens)
│   │   │   └── registry.ts (19 lines, 874 B, ~248 tokens)
│   │   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   ├── layers.ts (4 lines, 178 B, ~49 tokens)
│   │   ├── paths.ts (7 lines, 308 B, ~89 tokens)
│   │   ├── qa/
│   │   │   ├── e2e-runner.ts (7 lines, 326 B, ~87 tokens)
│   │   │   └── real-browser-audit.ts (13 lines, 510 B, ~134 tokens)
│   │   ├── search/
│   │   │   ├── boq-grounding.ts (11 lines, 615 B, ~164 tokens)
│   │   │   ├── cluster-3vps.ts (26 lines, 1.1 KB, ~295 tokens)
│   │   │   ├── crawler.ts (15 lines, 665 B, ~175 tokens)
│   │   │   ├── index.ts (1 lines, 34 B, ~10 tokens)
│   │   │   └── indexer.ts (19 lines, 884 B, ~240 tokens)
│   │   ├── types.ts (8 lines, 347 B, ~92 tokens)
│   │   ├── webui_poc/
│   │   │   ├── cr-button.ts (7 lines, 223 B, ~66 tokens)
│   │   │   ├── cr-dialog.ts (6 lines, 184 B, ~56 tokens)
│   │   │   ├── cr-icon.ts (5 lines, 156 B, ~47 tokens)
│   │   │   ├── cr-toolbar.ts (7 lines, 208 B, ~64 tokens)
│   │   │   ├── index.ts (2 lines, 79 B, ~23 tokens)
│   │   │   └── tokens.ts (3 lines, 145 B, ~38 tokens)
│   │   └── winner-picker.ts (13 lines, 480 B, ~133 tokens)
│   ├── test/
│   │   ├── benchmarks.test.ts (7 lines, 310 B, ~97 tokens)
│   │   ├── chromium-inspector.test.ts (4 lines, 117 B, ~36 tokens)
│   │   ├── engines.test.ts (7 lines, 200 B, ~64 tokens)
│   │   ├── layers.test.ts (3 lines, 81 B, ~26 tokens)
│   │   ├── purge-matrix.test.ts (3 lines, 93 B, ~30 tokens)
│   │   ├── ssrf.test.ts (3 lines, 87 B, ~28 tokens)
│   │   └── winner-picker.test.ts (6 lines, 152 B, ~49 tokens)
│   ├── tests/
│   │   └── cluster-search.test.ts (5 lines, 128 B, ~43 tokens)
│   ├── tsconfig.json (16 lines, 523 B, ~164 tokens)
│   └── winners.json (399 lines, 16.5 KB, ~5.2k tokens)
├── core/
│   ├── DEPS.rules (3 lines, 149 B, ~39 tokens)
│   ├── package.json (15 lines, 516 B, ~188 tokens)
│   ├── src/
│   │   ├── cli.ts (7 lines, 157 B, ~51 tokens)
│   │   ├── ffi.ts (28 lines, 1.2 KB, ~348 tokens)
│   │   ├── generate.ts (13 lines, 437 B, ~127 tokens)
│   │   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   └── store.ts (9 lines, 460 B, ~129 tokens)
│   ├── test/
│   │   └── ffi.test.ts (5 lines, 121 B, ~38 tokens)
│   └── tsconfig.json (12 lines, 428 B, ~149 tokens)
├── deploy/
│   ├── README.md (35 lines, 3.7 KB, ~1.1k tokens)
│   ├── package.json (21 lines, 780 B, ~264 tokens)
│   ├── projects.toml (46 lines, 2.0 KB, ~585 tokens)
│   ├── src/
│   │   ├── access.ts (6 lines, 241 B, ~68 tokens)
│   │   ├── alphabet.ts (8 lines, 397 B, ~111 tokens)
│   │   ├── cli.ts (18 lines, 810 B, ~232 tokens)
│   │   ├── client/
│   │   │   ├── material-web.d.ts (1 lines, 34 B, ~10 tokens)
│   │   │   └── md.ts (6 lines, 275 B, ~82 tokens)
│   │   ├── m3.ts (10 lines, 390 B, ~113 tokens)
│   │   ├── pages.ts (13 lines, 505 B, ~148 tokens)
│   │   ├── registry.ts (17 lines, 619 B, ~178 tokens)
│   │   ├── runtime.ts (20 lines, 721 B, ~208 tokens)
│   │   ├── serve.ts (14 lines, 595 B, ~168 tokens)
│   │   ├── state.ts (14 lines, 564 B, ~152 tokens)
│   │   └── worker.ts (17 lines, 802 B, ~238 tokens)
│   ├── tests/
│   │   ├── deploy.test.ts (17 lines, 515 B, ~168 tokens)
│   │   ├── runtime.test.ts (7 lines, 200 B, ~63 tokens)
│   │   └── serve.test.ts (4 lines, 139 B, ~43 tokens)
│   ├── tsconfig.json (11 lines, 346 B, ~118 tokens)
│   └── wrangler.toml (38 lines, 1.3 KB, ~358 tokens)
├── design/
│   ├── DESIGN.md (281 lines, 8.7 KB, ~2.4k tokens)
│   ├── package.json (30 lines, 1.5 KB, ~501 tokens)
│   ├── src/
│   │   ├── adapters.ts (5 lines, 175 B, ~51 tokens)
│   │   ├── build.ts (7 lines, 253 B, ~75 tokens)
│   │   ├── bun-plugin.ts (6 lines, 197 B, ~58 tokens)
│   │   ├── cli.ts (8 lines, 260 B, ~78 tokens)
│   │   ├── components.ts (37 lines, 1.7 KB, ~512 tokens)
│   │   ├── figma-themes.ts (2 lines, 55 B, ~17 tokens)
│   │   ├── figma.ts (2 lines, 56 B, ~17 tokens)
│   │   ├── index.ts (5 lines, 244 B, ~73 tokens)
│   │   ├── modules.ts (4 lines, 104 B, ~32 tokens)
│   │   ├── runtime.ts (9 lines, 350 B, ~103 tokens)
│   │   ├── schemes.ts (4 lines, 143 B, ~41 tokens)
│   │   ├── symbols.css (1 lines, 35 B, ~11 tokens)
│   │   ├── themes.ts (8 lines, 355 B, ~101 tokens)
│   │   └── web.ts (8 lines, 327 B, ~95 tokens)
│   ├── tests/
│   │   ├── adapters.test.ts (4 lines, 126 B, ~38 tokens)
│   │   ├── runtime.test.ts (5 lines, 139 B, ~47 tokens)
│   │   ├── themes.test.ts (4 lines, 126 B, ~38 tokens)
│   │   ├── tokens.test.ts (4 lines, 125 B, ~38 tokens)
│   │   └── web.test.ts (3 lines, 78 B, ~26 tokens)
│   └── tokens/
│       ├── adapters/
│       │   ├── Theme.kt (352 lines, 15.8 KB, ~3.7k tokens)
│       │   ├── _angular-theme.scss (1 lines, 36 B, ~11 tokens)
│       │   ├── aphrody_theme.dart (358 lines, 14.1 KB, ~3.5k tokens)
│       │   ├── fluent.json (123 lines, 5.4 KB, ~1.6k tokens)
│       │   ├── gpui-kit.json (582 lines, 22.7 KB, ~7.6k tokens)
│       │   ├── mui.json (133 lines, 4.7 KB, ~1.6k tokens)
│       │   ├── shadcn.css (1 lines, 35 B, ~11 tokens)
│       │   ├── tailwind.css (1 lines, 36 B, ~11 tokens)
│       │   ├── webui-tokens.json (998 lines, 60.7 KB, ~20.8k tokens)
│       │   └── winui.xaml (330 lines, 27.0 KB, ~6.7k tokens)
│       ├── ansi.json (341 lines, 12.3 KB, ~4.9k tokens)
│       ├── ansi.sh (1 lines, 35 B, ~11 tokens)
│       ├── figma-sync.js (1 lines, 36 B, ~11 tokens)
│       ├── figma-themes-sync.js (1 lines, 35 B, ~11 tokens)
│       ├── figma-variables.json (2920 lines, 71.3 KB, ~26.9k tokens)
│       ├── figma.json (11 lines, 620 B, ~184 tokens)
│       ├── themes.css (1 lines, 37 B, ~11 tokens)
│       ├── themes.json (749 lines, 27.3 KB, ~9.4k tokens)
│       ├── tokens.css (1 lines, 36 B, ~11 tokens)
│       ├── tokens.json (611 lines, 20.9 KB, ~7.5k tokens)
│       ├── tokens.rs (10 lines, 367 B, ~108 tokens)
│       ├── tokens.zig (310 lines, 14.6 KB, ~3.4k tokens)
│       └── tokens_test.zig (10 lines, 461 B, ~137 tokens)
├── env-kit/
│   ├── README.md (67 lines, 5.6 KB, ~1.7k tokens)
│   ├── loaders/
│   │   ├── cpp/
│   │   │   ├── sovereign_env.h (8 lines, 434 B, ~116 tokens)
│   │   │   └── sovereign_env.hpp (22 lines, 877 B, ~255 tokens)
│   │   ├── dotnet/
│   │   │   └── SovereignEnv.cs (213 lines, 7.1 KB, ~1.8k tokens)
│   │   ├── go/
│   │   │   ├── envkit.go (26 lines, 913 B, ~275 tokens)
│   │   │   ├── envkit_test.go (9 lines, 171 B, ~52 tokens)
│   │   │   └── go.mod (3 lines, 58 B, ~19 tokens)
│   │   ├── lua/
│   │   │   └── sovereign_env.lua (9 lines, 336 B, ~101 tokens)
│   │   ├── python/
│   │   │   └── sovereign_env.py (20 lines, 850 B, ~261 tokens)
│   │   ├── rust/
│   │   │   ├── Cargo.toml (8 lines, 204 B, ~58 tokens)
│   │   │   └── src/
│   │   │       └── lib.rs (37 lines, 1.7 KB, ~542 tokens)
│   │   └── shell/
│   │       ├── load-env.ps1 (88 lines, 2.5 KB, ~797 tokens)
│   │       └── load-env.sh (2 lines, 62 B, ~19 tokens)
│   ├── package.json (26 lines, 992 B, ~340 tokens)
│   ├── scripts/
│   │   ├── bootstrap-env.ps1 (326 lines, 14.0 KB, ~4.0k tokens)
│   │   ├── registry-cleanup.ts (6 lines, 225 B, ~66 tokens)
│   │   └── upgrade-gh-scopes.ps1 (77 lines, 2.3 KB, ~690 tokens)
│   ├── src/
│   │   ├── accounts.ts (33 lines, 1.4 KB, ~352 tokens)
│   │   ├── auth-daemon.ts (12 lines, 447 B, ~130 tokens)
│   │   ├── auth.ts (41 lines, 1.9 KB, ~535 tokens)
│   │   ├── billing.ts (16 lines, 709 B, ~200 tokens)
│   │   ├── cli.ts (30 lines, 1.2 KB, ~343 tokens)
│   │   ├── editors.ts (9 lines, 408 B, ~109 tokens)
│   │   ├── github-app.test.ts (4 lines, 99 B, ~31 tokens)
│   │   ├── github-app.ts (31 lines, 1.7 KB, ~492 tokens)
│   │   ├── gmail.ts (9 lines, 430 B, ~118 tokens)
│   │   ├── google-auth.ts (5 lines, 201 B, ~55 tokens)
│   │   ├── google-context.ts (11 lines, 505 B, ~141 tokens)
│   │   ├── index.ts (25 lines, 1.1 KB, ~314 tokens)
│   │   ├── secret-store.ts (20 lines, 949 B, ~262 tokens)
│   │   └── whoami.ts (18 lines, 979 B, ~279 tokens)
│   ├── tests/
│   │   ├── accounts.test.ts (7 lines, 213 B, ~66 tokens)
│   │   ├── auth-daemon.test.ts (3 lines, 83 B, ~26 tokens)
│   │   ├── auth.test.ts (7 lines, 162 B, ~50 tokens)
│   │   ├── env-kit.test.ts (9 lines, 254 B, ~78 tokens)
│   │   ├── gmail.test.ts (4 lines, 106 B, ~34 tokens)
│   │   ├── google-context.test.ts (3 lines, 86 B, ~27 tokens)
│   │   ├── merge.test.ts (3 lines, 77 B, ~25 tokens)
│   │   ├── vectors/
│   │   │   ├── dotenv.env (13 lines, 332 B, ~94 tokens)
│   │   │   └── dotenv.json (13 lines, 383 B, ~139 tokens)
│   │   └── whoami.test.ts (3 lines, 78 B, ~25 tokens)
│   └── tsconfig.json (11 lines, 346 B, ~118 tokens)
├── ffi-bridge/
│   ├── DEPS.rules (4 lines, 260 B, ~72 tokens)
│   ├── dx12-hal.test.ts (3 lines, 79 B, ~25 tokens)
│   ├── package.json (16 lines, 564 B, ~198 tokens)
│   ├── rust-stack-ffi.test.ts (6 lines, 129 B, ~40 tokens)
│   ├── src/
│   │   ├── dx12-hal.ts (13 lines, 497 B, ~143 tokens)
│   │   ├── stack-bench-runner.ts (5 lines, 123 B, ~37 tokens)
│   │   ├── tier5-bun-bench.ts (5 lines, 153 B, ~46 tokens)
│   │   └── unix-distro.ts (10 lines, 373 B, ~98 tokens)
│   ├── tsconfig.json (11 lines, 376 B, ~127 tokens)
│   └── unix-distro.test.ts (4 lines, 100 B, ~32 tokens)
├── forge/
│   ├── package.json (25 lines, 957 B, ~328 tokens)
│   ├── src/
│   │   ├── bundle.ts (10 lines, 293 B, ~87 tokens)
│   │   ├── ci.ts (5 lines, 143 B, ~43 tokens)
│   │   ├── cli.ts (14 lines, 336 B, ~110 tokens)
│   │   ├── crypto.ts (10 lines, 531 B, ~146 tokens)
│   │   ├── db.ts (16 lines, 704 B, ~202 tokens)
│   │   ├── depot-bridge.ts (15 lines, 710 B, ~194 tokens)
│   │   ├── depot_ffi.ts (18 lines, 841 B, ~230 tokens)
│   │   ├── native_lib.ts (7 lines, 216 B, ~63 tokens)
│   │   ├── pillars.ts (15 lines, 647 B, ~171 tokens)
│   │   ├── root.ts (5 lines, 217 B, ~65 tokens)
│   │   ├── server.ts (12 lines, 344 B, ~108 tokens)
│   │   ├── triforge.ts (25 lines, 1.1 KB, ~294 tokens)
│   │   ├── types.ts (13 lines, 506 B, ~134 tokens)
│   │   └── vcs.ts (20 lines, 889 B, ~244 tokens)
│   ├── tests/
│   │   ├── bundle.test.ts (5 lines, 125 B, ~41 tokens)
│   │   ├── crypto.test.ts (3 lines, 81 B, ~26 tokens)
│   │   ├── db.test.ts (3 lines, 77 B, ~26 tokens)
│   │   ├── depot_ffi.test.ts (5 lines, 134 B, ~43 tokens)
│   │   ├── pillars.test.ts (6 lines, 149 B, ~51 tokens)
│   │   ├── server.test.ts (3 lines, 81 B, ~26 tokens)
│   │   └── triforge.test.ts (6 lines, 147 B, ~48 tokens)
│   └── tsconfig.json (17 lines, 552 B, ~179 tokens)
├── gaming/
│   ├── package.json (31 lines, 1.1 KB, ~401 tokens)
│   ├── src/
│   │   ├── cli.ts (16 lines, 681 B, ~208 tokens)
│   │   ├── downloads.toml (79 lines, 2.5 KB, ~700 tokens)
│   │   ├── dx.ts (12 lines, 459 B, ~132 tokens)
│   │   ├── forks.ts (5 lines, 158 B, ~47 tokens)
│   │   ├── index.ts (1 lines, 34 B, ~10 tokens)
│   │   ├── native.ts (6 lines, 227 B, ~68 tokens)
│   │   ├── proton.ts (9 lines, 283 B, ~84 tokens)
│   │   ├── skills.ts (7 lines, 273 B, ~81 tokens)
│   │   ├── steam.ts (26 lines, 1.2 KB, ~332 tokens)
│   │   ├── steamcmd.ts (19 lines, 893 B, ~246 tokens)
│   │   └── vulkan.ts (11 lines, 461 B, ~128 tokens)
│   ├── tests/
│   │   └── gaming.test.ts (6 lines, 137 B, ~44 tokens)
│   └── tsconfig.json (11 lines, 346 B, ~118 tokens)
├── google-design/
│   ├── README.md (88 lines, 3.9 KB, ~1.1k tokens)
│   ├── assets/
│   │   └── symbols/
│   │       ├── css/
│   │       │   └── aphrody-pet-symbols.css (1 lines, 35 B, ~11 tokens)
│   │       ├── index.json (26 lines, 702 B, ~253 tokens)
│   │       ├── manifest.json (81 lines, 8.6 KB, ~1.9k tokens)
│   │       └── material-symbols-index.json (15444 lines, 443.8 KB, ~150.5k tokens)
│   ├── build.ts (7 lines, 225 B, ~71 tokens)
│   ├── bunfig.toml (2 lines, 22 B, ~8 tokens)
│   ├── cli.ts (16 lines, 583 B, ~187 tokens)
│   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   ├── package.json (35 lines, 1.3 KB, ~468 tokens)
│   ├── server.ts (9 lines, 327 B, ~106 tokens)
│   ├── src/
│   │   ├── assets/
│   │   │   ├── audio-video.ts (13 lines, 559 B, ~148 tokens)
│   │   │   ├── brand-legal.ts (6 lines, 203 B, ~57 tokens)
│   │   │   ├── gif-encoder.ts (9 lines, 448 B, ~112 tokens)
│   │   │   ├── icons-sprites.ts (6 lines, 273 B, ~69 tokens)
│   │   │   ├── index.ts (16 lines, 602 B, ~167 tokens)
│   │   │   ├── models-3d.ts (17 lines, 940 B, ~231 tokens)
│   │   │   ├── open-pets.ts (12 lines, 552 B, ~147 tokens)
│   │   │   ├── png-encoder.ts (7 lines, 383 B, ~102 tokens)
│   │   │   ├── themes-stylesheets.ts (9 lines, 418 B, ~108 tokens)
│   │   │   └── wallpapers.ts (9 lines, 398 B, ~110 tokens)
│   │   ├── canvas/
│   │   │   └── canvas-engine.ts (5 lines, 200 B, ~51 tokens)
│   │   ├── cli.ts (3 lines, 84 B, ~27 tokens)
│   │   ├── color-utils/
│   │   │   └── hct.ts (15 lines, 732 B, ~187 tokens)
│   │   ├── design-md/
│   │   │   ├── LICENSE (201 lines, 11.1 KB, ~2.6k tokens)
│   │   │   ├── cli.ts (6 lines, 236 B, ~70 tokens)
│   │   │   ├── css-vars/
│   │   │   │   ├── handler.test.ts (8 lines, 330 B, ~93 tokens)
│   │   │   │   ├── handler.ts (8 lines, 373 B, ~100 tokens)
│   │   │   │   ├── serialize.ts (4 lines, 140 B, ~38 tokens)
│   │   │   │   └── spec.ts (5 lines, 183 B, ~50 tokens)
│   │   │   ├── dtcg/
│   │   │   │   ├── handler.test.ts (9 lines, 360 B, ~102 tokens)
│   │   │   │   ├── handler.ts (14 lines, 727 B, ~188 tokens)
│   │   │   │   └── spec.ts (11 lines, 416 B, ~109 tokens)
│   │   │   ├── fixer/
│   │   │   │   ├── handler.test.ts (4 lines, 98 B, ~31 tokens)
│   │   │   │   ├── handler.ts (4 lines, 167 B, ~48 tokens)
│   │   │   │   └── spec.ts (3 lines, 99 B, ~29 tokens)
│   │   │   ├── fixture.test.ts (5 lines, 103 B, ~33 tokens)
│   │   │   ├── fixtures/
│   │   │   │   ├── ALPINE_OBSERVATORY.md (132 lines, 6.7 KB, ~1.7k tokens)
│   │   │   │   ├── CARTOGRAPHERS_ATLAS.md (151 lines, 6.2 KB, ~1.7k tokens)
│   │   │   │   ├── DESIGN-test.md (183 lines, 7.7 KB, ~2.0k tokens)
│   │   │   │   ├── HERITAGE.md (178 lines, 7.6 KB, ~2.0k tokens)
│   │   │   │   ├── MERIDIAN.md (160 lines, 7.0 KB, ~1.8k tokens)
│   │   │   │   ├── NEO_ESOTERIC_MONUMENT.md (132 lines, 6.5 KB, ~1.7k tokens)
│   │   │   │   ├── NO_FRONTMATTER.md (55 lines, 5.6 KB, ~1.4k tokens)
│   │   │   │   ├── OUT_OF_ORDER.md (12 lines, 99 B, ~33 tokens)
│   │   │   │   ├── PAWS_AND_PATHS.md (219 lines, 8.2 KB, ~2.2k tokens)
│   │   │   │   └── TRACKS_OF_DC.md (141 lines, 6.2 KB, ~1.6k tokens)
│   │   │   ├── index.test.ts (3 lines, 76 B, ~24 tokens)
│   │   │   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   │   ├── lint.ts (14 lines, 496 B, ~146 tokens)
│   │   │   ├── linter/
│   │   │   │   ├── handler.test.ts (8 lines, 216 B, ~70 tokens)
│   │   │   │   ├── handler.ts (7 lines, 281 B, ~78 tokens)
│   │   │   │   ├── rules/
│   │   │   │   │   ├── broken-ref.test.ts (4 lines, 108 B, ~35 tokens)
│   │   │   │   │   ├── broken-ref.ts (5 lines, 188 B, ~59 tokens)
│   │   │   │   │   ├── contrast-ratio.test.ts (4 lines, 112 B, ~35 tokens)
│   │   │   │   │   ├── contrast-ratio.ts (6 lines, 275 B, ~80 tokens)
│   │   │   │   │   ├── index.ts (16 lines, 503 B, ~158 tokens)
│   │   │   │   │   ├── levenshtein.test.ts (3 lines, 81 B, ~25 tokens)
│   │   │   │   │   ├── levenshtein.ts (2 lines, 98 B, ~29 tokens)
│   │   │   │   │   ├── missing-primary.test.ts (4 lines, 113 B, ~35 tokens)
│   │   │   │   │   ├── missing-primary.ts (4 lines, 163 B, ~48 tokens)
│   │   │   │   │   ├── missing-sections.test.ts (4 lines, 114 B, ~35 tokens)
│   │   │   │   │   ├── missing-sections.ts (4 lines, 164 B, ~49 tokens)
│   │   │   │   │   ├── missing-typography.test.ts (4 lines, 116 B, ~36 tokens)
│   │   │   │   │   ├── missing-typography.ts (4 lines, 166 B, ~49 tokens)
│   │   │   │   │   ├── omitted.test.ts (4 lines, 106 B, ~33 tokens)
│   │   │   │   │   ├── omitted.ts (4 lines, 161 B, ~48 tokens)
│   │   │   │   │   ├── orphaned-tokens.test.ts (4 lines, 114 B, ~35 tokens)
│   │   │   │   │   ├── orphaned-tokens.ts (5 lines, 220 B, ~64 tokens)
│   │   │   │   │   ├── section-order.test.ts (4 lines, 114 B, ~37 tokens)
│   │   │   │   │   ├── section-order.ts (5 lines, 192 B, ~60 tokens)
│   │   │   │   │   ├── test-helpers.ts (5 lines, 162 B, ~55 tokens)
│   │   │   │   │   ├── token-like-ignored.test.ts (5 lines, 148 B, ~48 tokens)
│   │   │   │   │   ├── token-like-ignored.ts (6 lines, 308 B, ~86 tokens)
│   │   │   │   │   ├── token-summary.test.ts (4 lines, 111 B, ~35 tokens)
│   │   │   │   │   ├── token-summary.ts (4 lines, 161 B, ~48 tokens)
│   │   │   │   │   ├── types.test.ts (4 lines, 96 B, ~31 tokens)
│   │   │   │   │   ├── types.ts (6 lines, 222 B, ~66 tokens)
│   │   │   │   │   ├── unknown-key.test.ts (5 lines, 141 B, ~47 tokens)
│   │   │   │   │   └── unknown-key.ts (6 lines, 217 B, ~68 tokens)
│   │   │   │   ├── runner.test.ts (9 lines, 266 B, ~85 tokens)
│   │   │   │   ├── runner.ts (8 lines, 242 B, ~74 tokens)
│   │   │   │   └── spec.ts (7 lines, 231 B, ~66 tokens)
│   │   │   ├── model/
│   │   │   │   ├── color-parser.ts (19 lines, 905 B, ~247 tokens)
│   │   │   │   ├── handler.test.ts (5 lines, 140 B, ~43 tokens)
│   │   │   │   ├── handler.ts (16 lines, 673 B, ~186 tokens)
│   │   │   │   ├── spec.test.ts (4 lines, 126 B, ~38 tokens)
│   │   │   │   └── spec.ts (20 lines, 862 B, ~233 tokens)
│   │   │   ├── parser/
│   │   │   │   ├── handler.test.ts (3 lines, 78 B, ~24 tokens)
│   │   │   │   ├── handler.ts (7 lines, 262 B, ~72 tokens)
│   │   │   │   ├── scan.ts (5 lines, 219 B, ~60 tokens)
│   │   │   │   ├── spec.test.ts (3 lines, 75 B, ~24 tokens)
│   │   │   │   └── spec.ts (10 lines, 399 B, ~106 tokens)
│   │   │   ├── spec-config.test.ts (4 lines, 100 B, ~32 tokens)
│   │   │   ├── spec-config.ts (22 lines, 989 B, ~269 tokens)
│   │   │   ├── spec-config.yaml (167 lines, 4.5 KB, ~1.2k tokens)
│   │   │   ├── spec.md (418 lines, 16.8 KB, ~4.5k tokens)
│   │   │   └── tailwind/
│   │   │       ├── handler.test.ts (6 lines, 209 B, ~62 tokens)
│   │   │       ├── handler.ts (10 lines, 497 B, ~133 tokens)
│   │   │       ├── spec.ts (6 lines, 209 B, ~56 tokens)
│   │   │       └── v4/
│   │   │           ├── fixture.test.ts (7 lines, 164 B, ~54 tokens)
│   │   │           ├── handler.test.ts (6 lines, 215 B, ~66 tokens)
│   │   │           ├── handler.ts (8 lines, 400 B, ~105 tokens)
│   │   │           ├── serialize.test.ts (4 lines, 100 B, ~32 tokens)
│   │   │           ├── serialize.ts (3 lines, 126 B, ~35 tokens)
│   │   │           └── spec.ts (5 lines, 194 B, ~53 tokens)
│   │   ├── figma/
│   │   │   └── figma-connect.ts (13 lines, 592 B, ~151 tokens)
│   │   ├── humanizer/
│   │   │   └── anti-slop.ts (14 lines, 621 B, ~160 tokens)
│   │   ├── mdx/
│   │   │   └── bun-docs-generator.ts (7 lines, 256 B, ~73 tokens)
│   │   ├── spec/
│   │   │   └── prd-design-md.ts (9 lines, 360 B, ~101 tokens)
│   │   ├── stitch/
│   │   │   └── stitch-engine.ts (8 lines, 380 B, ~102 tokens)
│   │   ├── symbols/
│   │   │   └── catalog.ts (15 lines, 752 B, ~201 tokens)
│   │   ├── theme-builder/
│   │   │   └── exporter.ts (12 lines, 646 B, ~164 tokens)
│   │   ├── types.d.ts (2 lines, 68 B, ~19 tokens)
│   │   ├── verifier/
│   │   │   └── ui-gate.ts (9 lines, 357 B, ~100 tokens)
│   │   └── web/
│   │       └── templates.ts (13 lines, 626 B, ~175 tokens)
│   ├── tests/
│   │   ├── exporter.test.ts (3 lines, 97 B, ~30 tokens)
│   │   ├── hct.test.ts (3 lines, 90 B, ~29 tokens)
│   │   ├── mdx.test.ts (5 lines, 135 B, ~43 tokens)
│   │   ├── server.test.ts (3 lines, 77 B, ~25 tokens)
│   │   ├── stitch.test.ts (3 lines, 95 B, ~30 tokens)
│   │   ├── symbols.test.ts (3 lines, 90 B, ~28 tokens)
│   │   └── ui-gate.test.ts (3 lines, 91 B, ~29 tokens)
│   └── tsconfig.json (14 lines, 521 B, ~168 tokens)
├── i18n/
│   ├── locales/
│   │   ├── en.json (154 lines, 7.2 KB, ~2.4k tokens)
│   │   ├── es.json (154 lines, 7.8 KB, ~2.5k tokens)
│   │   ├── fr.json (154 lines, 7.8 KB, ~2.6k tokens)
│   │   ├── ja.json (154 lines, 8.7 KB, ~2.5k tokens)
│   │   └── zh-CN.json (154 lines, 7.2 KB, ~2.3k tokens)
│   ├── package.json (27 lines, 994 B, ~345 tokens)
│   ├── src/
│   │   ├── check.ts (7 lines, 252 B, ~76 tokens)
│   │   ├── cli.ts (10 lines, 449 B, ~135 tokens)
│   │   ├── i18n.ts (9 lines, 341 B, ~101 tokens)
│   │   ├── icu.ts (19 lines, 846 B, ~243 tokens)
│   │   ├── index.ts (6 lines, 183 B, ~61 tokens)
│   │   └── negotiate.ts (5 lines, 259 B, ~73 tokens)
│   ├── tests/
│   │   ├── fixtures/
│   │   │   └── format.json (110 lines, 2.6 KB, ~1.0k tokens)
│   │   ├── helpers.ts (1 lines, 34 B, ~10 tokens)
│   │   └── i18n.test.ts (6 lines, 163 B, ~53 tokens)
│   └── tsconfig.json (12 lines, 380 B, ~127 tokens)
├── linux/
│   ├── package.json (17 lines, 604 B, ~209 tokens)
│   ├── src/
│   │   ├── cli.ts (17 lines, 664 B, ~201 tokens)
│   │   ├── kernel.ts (8 lines, 279 B, ~83 tokens)
│   │   ├── patchsets.ts (18 lines, 853 B, ~246 tokens)
│   │   └── recipe.ts (20 lines, 920 B, ~269 tokens)
│   ├── tests/
│   │   └── linux.test.ts (9 lines, 219 B, ~73 tokens)
│   └── tsconfig.json (11 lines, 346 B, ~118 tokens)
├── machine/
│   ├── DEPS.rules (2 lines, 91 B, ~23 tokens)
│   ├── README.md (27 lines, 4.8 KB, ~1.3k tokens)
│   ├── machine.export.dsc.winget (1632 lines, 43.8 KB, ~11.5k tokens)
│   ├── package.json (17 lines, 743 B, ~247 tokens)
│   ├── shell.dsc.winget (25 lines, 953 B, ~248 tokens)
│   ├── shells/
│   │   ├── bash/
│   │   │   ├── bash_profile (3 lines, 241 B, ~69 tokens)
│   │   │   ├── bashrc (140 lines, 6.9 KB, ~2.2k tokens)
│   │   │   ├── inputrc (19 lines, 770 B, ~223 tokens)
│   │   │   └── niubashrc (6 lines, 427 B, ~121 tokens)
│   │   ├── completions/
│   │   │   ├── ay.fish (443 lines, 64.7 KB, ~16.4k tokens)
│   │   │   ├── ay.nu (691 lines, 22.7 KB, ~6.5k tokens)
│   │   │   └── ay.yaml (1087 lines, 45.3 KB, ~11.9k tokens)
│   │   ├── env.fish (31 lines, 1.3 KB, ~361 tokens)
│   │   ├── env.nu (72 lines, 3.5 KB, ~1.1k tokens)
│   │   ├── env.ps1 (76 lines, 3.6 KB, ~1.1k tokens)
│   │   ├── env.sh (2 lines, 57 B, ~18 tokens)
│   │   ├── env.toml (149 lines, 4.5 KB, ~1.3k tokens)
│   │   ├── fish/
│   │   │   └── config.fish (22 lines, 848 B, ~247 tokens)
│   │   ├── manifest.toml (103 lines, 3.6 KB, ~1.1k tokens)
│   │   ├── nu/
│   │   │   ├── config.nu (32 lines, 1.3 KB, ~377 tokens)
│   │   │   └── env.nu (3 lines, 192 B, ~57 tokens)
│   │   ├── pwsh/
│   │   │   └── profile.ps1 (328 lines, 17.5 KB, ~4.9k tokens)
│   │   └── shells.lock.toml (124 lines, 7.3 KB, ~2.1k tokens)
│   └── src/
│       ├── apply-user.ts (4 lines, 101 B, ~32 tokens)
│       ├── desktop-bench.ts (2 lines, 55 B, ~17 tokens)
│       ├── desktop-proof.ts (2 lines, 57 B, ~18 tokens)
│       ├── flatten-refs.ts (2 lines, 55 B, ~17 tokens)
│       ├── flatten-third-party.ts (7 lines, 161 B, ~51 tokens)
│       ├── forks.ts (4 lines, 97 B, ~31 tokens)
│       ├── mcp-headers.ts (2 lines, 79 B, ~27 tokens)
│       ├── shells.ts (36 lines, 1.5 KB, ~446 tokens)
│       └── toolchain.ts (20 lines, 677 B, ~203 tokens)
├── net/
│   ├── DEPS.rules (2 lines, 91 B, ~23 tokens)
│   ├── package.json (10 lines, 318 B, ~117 tokens)
│   ├── src/
│   │   ├── cdp.ts (4 lines, 185 B, ~52 tokens)
│   │   └── probe.ts (7 lines, 218 B, ~65 tokens)
│   ├── targets.json (11 lines, 678 B, ~215 tokens)
│   └── test/
│       └── gemini.e2e-auth.test.ts (5 lines, 124 B, ~41 tokens)
├── release/
│   ├── package.json (15 lines, 551 B, ~191 tokens)
│   ├── release.toml (34 lines, 1.6 KB, ~462 tokens)
│   ├── src/
│   │   ├── cli.ts (6 lines, 155 B, ~48 tokens)
│   │   ├── freeze.ts (10 lines, 392 B, ~114 tokens)
│   │   ├── plan.ts (13 lines, 470 B, ~135 tokens)
│   │   └── pyproject.ts (4 lines, 93 B, ~30 tokens)
│   ├── tests/
│   │   ├── freeze.test.ts (4 lines, 102 B, ~32 tokens)
│   │   └── plan.test.ts (3 lines, 79 B, ~26 tokens)
│   └── tsconfig.json (11 lines, 346 B, ~118 tokens)
├── runtime-adapter/
│   ├── DEPS.rules (2 lines, 91 B, ~23 tokens)
│   ├── package.json (16 lines, 598 B, ~203 tokens)
│   ├── src/
│   │   ├── bun.ts (15 lines, 543 B, ~175 tokens)
│   │   ├── cf.ts (11 lines, 398 B, ~119 tokens)
│   │   ├── env.ts (5 lines, 223 B, ~66 tokens)
│   │   ├── index.ts (15 lines, 590 B, ~176 tokens)
│   │   └── types.ts (11 lines, 369 B, ~112 tokens)
│   ├── tests/
│   │   ├── adapter.test.ts (9 lines, 215 B, ~73 tokens)
│   │   └── deploy-target.test.ts (4 lines, 115 B, ~37 tokens)
│   └── tsconfig.json (10 lines, 286 B, ~98 tokens)
├── shell-matrix/
│   ├── ab (0 lines, 0 B, ~0 tokens)
│   ├── ac (0 lines, 0 B, ~0 tokens)
│   ├── assign.txt (0 lines, 0 B, ~0 tokens)
│   ├── both.txt (2 lines, 4 B, ~3 tokens)
│   ├── d/
│   │   ├── 1.txt (0 lines, 0 B, ~0 tokens)
│   │   ├── 2.txt (0 lines, 0 B, ~0 tokens)
│   │   ├── 3.txt (0 lines, 0 B, ~0 tokens)
│   │   ├── [abc] (0 lines, 0 B, ~0 tokens)
│   │   ├── ]x (0 lines, 0 B, ~0 tokens)
│   │   ├── a  b (0 lines, 0 B, ~0 tokens)
│   │   ├── a b (0 lines, 0 B, ~0 tokens)
│   │   ├── a.txt (0 lines, 0 B, ~0 tokens)
│   │   ├── aab (0 lines, 0 B, ~0 tokens)
│   │   ├── ab (0 lines, 0 B, ~0 tokens)
│   │   ├── abb (0 lines, 0 B, ~0 tokens)
│   │   ├── abc (0 lines, 0 B, ~0 tokens)
│   │   ├── abd (0 lines, 0 B, ~0 tokens)
│   │   ├── acb (0 lines, 0 B, ~0 tokens)
│   │   ├── axb (0 lines, 0 B, ~0 tokens)
│   │   ├── b.txt (0 lines, 0 B, ~0 tokens)
│   │   ├── bar.txt (0 lines, 0 B, ~0 tokens)
│   │   ├── c.md (0 lines, 0 B, ~0 tokens)
│   │   ├── f1 (0 lines, 0 B, ~0 tokens)
│   │   ├── f10 (0 lines, 0 B, ~0 tokens)
│   │   ├── f2 (0 lines, 0 B, ~0 tokens)
│   │   ├── fa (0 lines, 0 B, ~0 tokens)
│   │   ├── foo.md (0 lines, 0 B, ~0 tokens)
│   │   ├── foo.txt (0 lines, 0 B, ~0 tokens)
│   │   ├── qfile (0 lines, 0 B, ~0 tokens)
│   │   ├── star (0 lines, 0 B, ~0 tokens)
│   │   ├── starfile (0 lines, 0 B, ~0 tokens)
│   │   ├── sub/
│   │   │   ├── deep/
│   │   │   │   └── low (0 lines, 0 B, ~0 tokens)
│   │   │   ├── mid (0 lines, 0 B, ~0 tokens)
│   │   │   └── y.txt (0 lines, 0 B, ~0 tokens)
│   │   ├── sub_note (0 lines, 0 B, ~0 tokens)
│   │   ├── top (0 lines, 0 B, ~0 tokens)
│   │   ├── x.txt (0 lines, 0 B, ~0 tokens)
│   │   └── y.md (0 lines, 0 B, ~0 tokens)
│   ├── data/
│   │   └── diffcorpus.json (919 lines, 43.7 KB, ~16.9k tokens)
│   ├── e.txt (0 lines, 0 B, ~0 tokens)
│   ├── f (2 lines, 13 B, ~4 tokens)
│   ├── f.txt (1 lines, 4 B, ~2 tokens)
│   ├── f1 (0 lines, 0 B, ~0 tokens)
│   ├── f2.txt (1 lines, 4 B, ~2 tokens)
│   ├── g.txt (1 lines, 4 B, ~2 tokens)
│   ├── lib.sh (1 lines, 34 B, ~10 tokens)
│   ├── link1 (0 lines, 0 B, ~0 tokens)
│   ├── only.txt (0 lines, 0 B, ~0 tokens)
│   ├── out.txt (1 lines, 8 B, ~3 tokens)
│   ├── package.json (13 lines, 540 B, ~180 tokens)
│   ├── plainfile (0 lines, 0 B, ~0 tokens)
│   ├── run.sh (1 lines, 34 B, ~10 tokens)
│   ├── rw.txt (1 lines, 1 B, ~1 tokens)
│   ├── s.sh (2 lines, 45 B, ~16 tokens)
│   ├── scripts/
│   │   └── export-diffcorpus.py (2 lines, 66 B, ~20 tokens)
│   ├── shells.json (4 lines, 111 B, ~40 tokens)
│   ├── src/
│   │   ├── cases.ts (2 lines, 59 B, ~19 tokens)
│   │   ├── cli.ts (5 lines, 172 B, ~54 tokens)
│   │   ├── diff.ts (6 lines, 263 B, ~77 tokens)
│   │   ├── main.ts (4 lines, 120 B, ~38 tokens)
│   │   └── niu-e2e.ts (7 lines, 231 B, ~70 tokens)
│   ├── test/
│   │   ├── diffcorpus.test.ts (3 lines, 75 B, ~24 tokens)
│   │   └── niu-e2e.test.ts (3 lines, 78 B, ~26 tokens)
│   ├── tf.txt (3 lines, 29 B, ~11 tokens)
│   └── tg.txt (4 lines, 42 B, ~14 tokens)
├── site/
│   ├── package.json (18 lines, 746 B, ~252 tokens)
│   └── src/
│       ├── build.ts (18 lines, 543 B, ~166 tokens)
│       ├── cli.ts (6 lines, 140 B, ~46 tokens)
│       ├── config.ts (7 lines, 255 B, ~70 tokens)
│       ├── fonts.ts (6 lines, 233 B, ~67 tokens)
│       ├── headers.ts (6 lines, 222 B, ~63 tokens)
│       ├── html.ts (4 lines, 133 B, ~41 tokens)
│       ├── image.ts (5 lines, 167 B, ~53 tokens)
│       ├── index.ts (1 lines, 35 B, ~11 tokens)
│       ├── metadata.ts (8 lines, 286 B, ~83 tokens)
│       ├── routes.ts (16 lines, 624 B, ~177 tokens)
│       └── serve.ts (9 lines, 292 B, ~83 tokens)
├── upstream/
│   ├── package.json (23 lines, 824 B, ~282 tokens)
│   ├── src/
│   │   ├── cli.ts (24 lines, 1.0 KB, ~316 tokens)
│   │   ├── forge.ts (9 lines, 402 B, ~117 tokens)
│   │   ├── git.ts (21 lines, 947 B, ~281 tokens)
│   │   ├── mirror.ts (14 lines, 470 B, ~139 tokens)
│   │   ├── patch.ts (10 lines, 451 B, ~128 tokens)
│   │   ├── registry.ts (10 lines, 315 B, ~93 tokens)
│   │   ├── rules.ts (9 lines, 391 B, ~114 tokens)
│   │   └── stack.ts (26 lines, 1.1 KB, ~310 tokens)
│   ├── tests/
│   │   └── upstream.test.ts (12 lines, 303 B, ~101 tokens)
│   └── tsconfig.json (11 lines, 346 B, ~118 tokens)
├── vault/
│   ├── bench/
│   │   └── bench.ts (6 lines, 157 B, ~48 tokens)
│   ├── native/
│   │   ├── Cargo.toml (36 lines, 962 B, ~277 tokens)
│   │   ├── src/
│   │   │   ├── ayv1.rs (7 lines, 288 B, ~96 tokens)
│   │   │   ├── capi.rs (19 lines, 1.3 KB, ~406 tokens)
│   │   │   ├── envelope.rs (11 lines, 670 B, ~210 tokens)
│   │   │   ├── lib.rs (13 lines, 399 B, ~133 tokens)
│   │   │   ├── local.rs (20 lines, 945 B, ~299 tokens)
│   │   │   └── win.rs (13 lines, 582 B, ~185 tokens)
│   │   └── tests/
│   │       ├── interop.rs (9 lines, 301 B, ~89 tokens)
│   │       └── vectors/
│   │           └── ayv1-master07.hex (1 lines, 127 B, ~18 tokens)
│   ├── package.json (16 lines, 693 B, ~228 tokens)
│   ├── src/
│   │   ├── age.ts (13 lines, 573 B, ~155 tokens)
│   │   ├── chrome.ts (12 lines, 507 B, ~148 tokens)
│   │   ├── cli.ts (15 lines, 501 B, ~154 tokens)
│   │   ├── crypto.ts (16 lines, 812 B, ~229 tokens)
│   │   ├── csv.ts (3 lines, 150 B, ~46 tokens)
│   │   ├── doc.ts (17 lines, 748 B, ~214 tokens)
│   │   ├── hosts.ts (20 lines, 881 B, ~248 tokens)
│   │   ├── index.ts (1 lines, 35 B, ~11 tokens)
│   │   ├── migrate.ts (6 lines, 178 B, ~54 tokens)
│   │   ├── paths.ts (11 lines, 434 B, ~125 tokens)
│   │   ├── profiles.ts (16 lines, 547 B, ~162 tokens)
│   │   ├── shred.ts (4 lines, 146 B, ~43 tokens)
│   │   ├── sqlite.ts (13 lines, 581 B, ~177 tokens)
│   │   ├── store.ts (22 lines, 1004 B, ~278 tokens)
│   │   ├── sync.ts (30 lines, 1.4 KB, ~400 tokens)
│   │   └── win/
│   │       ├── ffi.ts (14 lines, 657 B, ~193 tokens)
│   │       ├── pool.ts (7 lines, 221 B, ~72 tokens)
│   │       └── worker.ts (3 lines, 76 B, ~25 tokens)
│   ├── tests/
│   │   ├── linux-sandbox.test.ts (5 lines, 110 B, ~34 tokens)
│   │   └── vault.test.ts (5 lines, 111 B, ~35 tokens)
│   └── tsconfig.json (11 lines, 363 B, ~126 tokens)
└── wck/
    ├── README.md (63 lines, 3.0 KB, ~889 tokens)
    ├── package.json (22 lines, 842 B, ~284 tokens)
    ├── src/
    │   ├── cli.ts (4 lines, 110 B, ~33 tokens)
    │   ├── context.ts (6 lines, 204 B, ~57 tokens)
    │   ├── globals.d.ts (2 lines, 66 B, ~19 tokens)
    │   ├── index.ts (1 lines, 35 B, ~11 tokens)
    │   ├── specs/
    │   │   ├── aiseo.ts (3 lines, 128 B, ~35 tokens)
    │   │   ├── cwv.ts (4 lines, 187 B, ~49 tokens)
    │   │   ├── lh.ts (3 lines, 133 B, ~35 tokens)
    │   │   ├── mwg.ts (3 lines, 109 B, ~29 tokens)
    │   │   ├── seo.ts (3 lines, 126 B, ~35 tokens)
    │   │   ├── wasm.ts (3 lines, 127 B, ~35 tokens)
    │   │   └── webgpu.ts (3 lines, 129 B, ~35 tokens)
    │   ├── types.ts (9 lines, 386 B, ~112 tokens)
    │   └── validator.ts (12 lines, 336 B, ~102 tokens)
    ├── tests/
    │   └── wck.test.ts (6 lines, 129 B, ~41 tokens)
    └── tsconfig.json (14 lines, 467 B, ~151 tokens)
```

## Source Files

================================================
FILE: ai-os/README.md
================================================
# @aphrody/ai-os

The single AI unit of `src`: agent core, model bridge, relay, gateway, research and TUI in one Bun package, with no
npm dependency (Bun built-ins only: `bun:sqlite`, `Bun.serve`, `Bun.listen`, `Bun.spawn`, `node:readline`, `fetch`).
Merged flat from `aphrody-labs/agent@83c2c8b` with `git subtree` (history kept: `git log -- packages/ai-os`).

| Path                   | Export       | Role                                                                                         |
| ---------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `src/core`             | `./core`     | agent loop, tools, memory, Context selection, skills, hub, scheduler, council, secrets       |
| `src/llm`              | `./llm`      | single model bridge: providers and models discovered at run time, tool loop, JSON Schema     |
| `src/relay`            | `./relay`    | the only MCP server (HTTP 2025-11-25 and 2026-07-28, stdio) and A2A 1.0.1 `SendMessage`      |
| `src/gateway`          | `./gateway`  | WebSocket sessions, OpenAI-compatible chat, channel webhooks                                 |
| `src/research`         | `./research` | outline-driven research, fact-check, Context7 docs                                           |
| `src/tui`              | `./tui`      | terminal UI                                                                                  |
| `bench`, `fixtures`    |              | retrieval bench and research reference pack                                                  |
| `python`               |              | uv workspace: pyo3 `agent_core` (`crates/agent-py`), Hermes memory provider, reference check |
| `native/relay-windows` |              | Windows service `AphrodyRelay` (.NET 11 NativeAOT) and `install.ps1`                         |

Rust crates: `crates/agent-context`, `crates/agent-py` (root workspace). Linux unit of the relay:
`infra/fleet/prd/systemd/aphrody-relay.service`.

No provider or model is hardcoded. `AGENT_MODEL=provider/model` takes any id listed by `llm_models`
(`ai-os relay` tool, `listModels()`); without it the first model of the first active provider is used (Ollama,
`RELAY_OPENAI_ENDPOINTS`, OpenRouter, Hugging Face, Vercel AI Gateway, Cloudflare Workers AI, Antigravity CLI, Claude
Code CLI). `AGENT_EMBEDDER=hash|provider/model`.

```sh
bun test test                                   # from packages/ai-os (never from the src root)
bun src/cli.ts run "summarize README.md into notes.md"
bun src/cli.ts relay serve                      # relay: /rpc /mcp /a2a /ws, TCP, TLS
```

Former npm dependencies, all replaced: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai-compatible`, `workers-ai-provider`
(-> `src/llm`, OpenAI-compatible chat/completions and embeddings over `fetch`), `zod` (-> `src/llm/schema.ts`),
`@modelcontextprotocol/sdk` (-> relay MCP server, `relay mcp-stdio`), `@earendil-works/pi-tui` (-> `node:readline`).
None remains.

License: MIT OR Apache-2.0. Third-party notices in `NOTICE` and `licenses/`.


================================================
FILE: ai-os/docs/ARCHITECTURE.md
================================================
# Architecture

One repo for the agent stack, from GPU runtime to the user-facing surfaces. Names come from the root `identity.toml` (`[products.ai-os]`).
Workspaces: bun (`packages/*`), cargo (`crates/*`), uv (`python/*`). Native code builds on the shared Chromium LLVM
toolchain (see `C:\src\docs\llvm\UNIFIED-TOOLCHAIN.md`); native CI runs on the `prd` self-hosted runner, never on the dev PC.

## Layers

```
 L7 surfaces   cli (agent) | tui | desktop | web | mobile | HTTP API | MCP server | A2A/ACP/AG-UI endpoints
 L6 gateway    channels (Chat SDK adapters), auth, sessions, routing     <- OpenClaw gateway, ai-triad gateway
 L5 core       loop (AI SDK) | tools | memory | skills | learning loop | scheduler/heartbeat | sandbox | hooks/plugins
 L4 providers  AI SDK providers (anthropic, openai-compatible, AI Gateway, Workers AI) | local endpoint
 L3 weights    HF hub fetch -> content-addressed store (blake3) -> R2 cache
 L2 inference  llama.cpp server | ONNX Runtime (DirectML/CUDA) | candle/burn | vLLM (Linux, prd)
 L1 runtime    wgpu/Dawn (WebGPU) | CUDA | Vulkan | DirectML | CPU (AVX2/AVX-512)
 L0 platform   Windows 11 native (windows-rs) | Linux 7.x | Cloudflare Workers/DO | Vercel Functions (runtime-adapter)
```

## Modules

| Module                                   | Path                             | Status                                       |
| ---------------------------------------- | -------------------------------- | -------------------------------------------- |
| core loop, tools, memory, skills         | `src/core`                       | done: `agent run`, e2e test green on Windows |
| scheduler / heartbeat                    | `packages/scheduler`             | planned                                      |
| gateway + channels                       | `src/gateway`                    | planned                                      |
| tui                                      | `src/tui`                        | planned                                      |
| mcp server/client                        | `src/relay` (MCP)                | planned                                      |
| inference / weights                      | `crates/infer`, `crates/weights` | planned                                      |
| python bridge                            | `python/agent_py` (pyo3)         | planned                                      |
| legacy (migrated as-is, to be dissolved) | `legacy/*`                       | imported                                     |

## Feature mapping

Source: OC = OpenClaw (fork aphrody-labs/openclaw), HA = Hermes Agent (fork aphrody-labs/hermes-agent), pi, OCd = opencode,
L = legacy src packages. Approach: SDK = native vendor SDK, FORK = code from our fork, OWN = our own code.

| Feature                                  | From                                                                                 | Module             | Approach                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------ | ------------------ | ----------------------------------------------------------------- |
| agent loop, multi-step tool calls        | pi, OCd, HA                                                                          | core/agent.ts      | SDK: Vercel AI SDK `generateText` + `isStepCount`                 |
| model providers, fallback                | HA (anthropic_adapter, auxiliary_client), L ai-os/providers, pi-opencode/lu-provider | core/model.ts      | SDK: `@ai-sdk/*`, AI Gateway                                      |
| read/write/edit/bash tools               | pi (4 tools), OCd                                                                    | core/tools.ts      | OWN (small)                                                       |
| persistent memory, FTS recall            | HA memory_tool, memory_manager; L brain, ai-os/nexus/brain-memory                    | core/memory.ts     | OWN on bun:sqlite FTS5, semantics from HA                         |
| skill creation (SKILL.md), self-learning | HA skill_manager_tool, learning_graph                                                | core/skills.ts     | OWN, Agent Skills format, semantics from HA                       |
| skill lint/provenance/lock               | HA skill_linter, skill_provenance, skill_lock                                        | core/skills        | FORK port (planned)                                               |
| scheduler, heartbeat, cron               | OC heartbeat, HA cron/                                                               | scheduler          | SDK: Workflow (durable) + Cloudflare Agents schedule; local timer |
| multi-channel gateway                    | OC gateway/channels                                                                  | gateway            | SDK: Chat SDK adapters                                            |
| sessions, compaction                     | HA compression, OCd sessions                                                         | core/session       | OWN (planned)                                                     |
| sandbox                                  | OC sandbox, HA docker                                                                | core/sandbox       | Windows AppContainer (windows-rs), Vercel Sandbox, CF Sandbox     |
| hooks, plugins                           | OC plugins, OCd plugins                                                              | core/hooks         | OWN (Claude Code hook format)                                     |
| MCP client/server                        | L ai-os/protocols/mcp, knowledge-engine/mcp, ai-triad/server                         | mcp                | SDK: `@modelcontextprotocol/sdk`, AI SDK MCP client               |
| A2A                                      | L ai-os/protocols/a2a                                                                | protocols          | SDK: A2A (Google, fork adk-python for reference)                  |
| ACP                                      | HA acp_adapter, L ai-os/protocols/acp, ai-triad                                      | protocols          | SDK: ACP                                                          |
| AG-UI                                    | -                                                                                    | web                | SDK: AG-UI                                                        |
| TUI                                      | pi, OCd                                                                              | tui                | FORK (pi tui)                                                     |
| web UI                                   | OC apps, L ai-triad WebGUI, agy web-app                                              | web                | SDK: AI SDK UI                                                    |
| desktop                                  | OC apps, L agy rust-desktop                                                          | desktop            | OWN (windows-rs / webview)                                        |
| deep research, fact-check, context7      | L knowledge-engine                                                                   | tools/research     | OWN (migrate)                                                     |
| cross-CLI council (codex/gemini/claude)  | L ai-triad, ai-os/triad (duplicate)                                                  | tools/council      | OWN (dedupe into one)                                             |
| standards sentinel, extractor            | L ai-os/sentinel, extractor                                                          | tools/sentinel     | OWN (migrate or drop)                                             |
| bun:ffi computer-use bus                 | L ai-os/ffi                                                                          | crates/desktop-use | windows-rs (replace FFI)                                          |
| session merge                            | L brain                                                                              | core/session       | OWN (fold into memory)                                            |
| gemma lab, notebook, finops              | L agy                                                                                | tools/*            | evaluate, likely drop                                             |
| local inference                          | L ai-os/native, zig                                                                  | crates/infer       | FORK llama.cpp / ONNX Runtime (fork onnxruntime)                  |
| WebGPU                                   | L ai-os/wasm-webgpu                                                                  | crates/gpu         | FORK wgpu / dawn                                                  |
| deploy targets                           | -                                                                                    | adapters           | `packages/runtime-adapter` (src branch hosting/portable)          |
| parsing / code graph                     | -                                                                                    | tools/code         | crates/core (src branch core/common-lib), tree-sitter             |

## ADR

| #    | Decision                                                                                                             |
| ---- | -------------------------------------------------------------------------------------------------------------------- |
| 0001 | Agent loop on Vercel AI SDK 7 (installed 7.0.170); no hand-written provider clients.                                 |
| 0002 | Memory on bun:sqlite + FTS5, one file per home (`AGENT_HOME`). Embeddings later via local ONNX model.                |
| 0003 | Skills use the Agent Skills format (SKILL.md + YAML front matter), compatible with Claude Code.                      |
| 0004 | Legacy src AI packages imported verbatim into `legacy/` then dissolved module by module; src history is the archive. |
| 0005 | OpenClaw/Hermes/pi/opencode code is MIT; ported code keeps notices in `NOTICE` + `licenses/`.                        |
| 0006 | Native builds on the prd runner with the Chromium LLVM toolchain; GitHub-hosted CI runs bun tests only.              |
| 0007 | Windows native first (no WSL); Linux second; Cloudflare/Vercel through runtime-adapter.                              |
| 0008 | Product name only in root `identity.toml`.                                                                           |

## Context (attention-style selection)

Design rules: C:\src\var\data\ai_foundations_to_agi\attention_is_all_you_need_full_llm_markdown.md §7. Module `src/core/context.ts`.

| Transformer             | Implementation                                                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| encoder                 | `Context.ingest`: memories, skills (`Skills.sync`), research results (`researchEntries`, one entry per item x field), MEMORY.md, code chunks with symbols                               |
| multi-head Q·K          | heads run in parallel: lexical (FTS5 bm25), semantic (embeddings: hash offline, Workers AI bge-m3, llama.cpp), structural (symbol overlap; crates/core graph next), recency (half-life) |
| scaling + softmax       | per-head standardization, linear merge in logit space (weights = W^O, `config.json`), one softmax over candidates                                                                       |
| masking                 | `Mask` (scopes, sources, predicate) applied before scoring; `redactText` on every selected entry                                                                                        |
| top-k, O(n²) bound      | candidate cap (200), top-k under a token budget                                                                                                                                         |
| KV-cache                | embeddings cached by (embedder, sha256(text)) in `kv`; static persona prefix first in the system prompt so provider prompt caches hit                                                   |
| decoder cross-attention | `run()` selects context for the task and puts it after the persona prefix; memory_search, skills and research reads all go through `select()`                                           |
| FFN per position        | `agent research` items run as independent parallel workers (batch_size)                                                                                                                 |

Bench (`bun bench/retrieval.ts [--embedder provider/model]`, 39 entries, 30 queries, Windows PC, 2026-11-12):

| embedder            | head config    | P@1   | R@5   | MRR   | ms/query                 |
| ------------------- | -------------- | ----- | ----- | ----- | ------------------------ |
| hash512             | lexical        | 0.200 | 0.533 | 0.343 | 1.4                      |
| hash512             | merged         | 0.133 | 0.533 | 0.306 | 2.1                      |
| bge-m3 (Workers AI) | semantic       | 0.200 | 0.800 | 0.423 | 228 cold, about 2 cached |
| bge-m3 (Workers AI) | merged 0.5/0.5 | 0.167 | 0.733 | 0.371 | 2.5                      |

Queries reuse each item's description for all of its fields, so P@1 is low by construction; R@5 is the metric to watch.
Next: learn head weights on a labeled set, structural head from crates/core (tree-sitter), and a hierarchical summary layer for large n.

Fusion tuning (2026-11-12, `bun bench/retrieval.ts --tune [--embedder provider/model]`): grid over lexical/semantic weights x {rrf, logit}, objective R@5 then MRR.

| embedder | best single head R@5 | tuned (rrf 0.2/0.8) R@5 in-sample | leave-one-item-out R@5 |
| -------- | -------------------- | --------------------------------- | ---------------------- |
| hash512  | 0.533                | 0.567                             | 0.467                  |
| bge-m3   | 0.800 (semantic)     | 0.867                             | 0.800                  |

Default fusion is weighted RRF (k=60) with lexical 0.2, semantic 0.7, structural 0.05, recency 0.05. With bge-m3, held-out recall equals the best single head; the pack has only 30 queries, so the weights must be re-tuned once a larger labeled set exists.


================================================
FILE: deploy/README.md
================================================
# @aphrody/deploy: aphrody.app

First-party deployment platform of the monorepo (the role Vercel plays for its users, `docs/ALPHABET.md`), on Cloudflare Workers and R2. No `vercel.json`, no Vercel dependency.

## Model

- `projects.toml`: one entry per deployable project (path, bun build command, output, domains, watched paths, vault variable names).
- A deployment is immutable: `deploys/<project>/<sha>/` in R2 bucket `aphrody-dist`, with its record (`<sha>.json`) and build log (`<sha>.log`).
- Production is a pointer (`deploys/<project>/_state.json`). Promote and rollback move it; nothing is rebuilt or redeployed. The history of moves is kept.
- Previews: `https://<project>-<sha7>.aphrody.app` (route `*.aphrody.app/*`, wildcard DNS). Production: the project domains. `aphrody.com` is served by the `apps/aphrody` Worker from the same pointer; `/api/*`, `/g/*`, `/search` still go to the Bun backend on prd.

## Flow

1. Push on `main` -> `.github/workflows/deploy.yml` -> `bun packages/deploy/src/cli.ts ci`: uploads the registry (projects, monorepo inventory, labs cards, Material 3 tokens from `assets/brand`), builds each affected project, uploads it through the API, records a GitHub deployment (environment `preview/<project>`, then `production/<project>`), moves production when `production = "auto"`.
2. `ay deploy <project>` dispatches the same workflow and waits for the preview (nothing is built on the workstation); `--local` builds here with the vault environment.
3. `ay deploy ls [project]`, `ay deploy logs <project> [sha]`, `ay deploy rollback <project> [sha]`, `ay deploy promote <project> <sha>`.

## Surfaces

- `https://aphrody.app/`: projects and their production and latest deployments (public).
- `https://aphrody.app/labs`: aphrody-labs cards (bets of `docs/ALPHABET.md`, public non-fork non-archived repositories with their GitHub description).
- `https://aphrody.app/dashboard`: Cloudflare Access application `aphrody-app-dashboard` (owner policy), JWT verified again by the Worker; deployments, logs, promote and rollback.
- API: `GET /api/projects`, `GET /api/projects/<p>/deployments` public; writes and logs need `Authorization: Bearer $APHRODY_DEPLOY_TOKEN` (vault, CI secret, Worker secret `DEPLOY_TOKEN`) or Access.

## Operations

- Worker: `wrangler.toml` (name `aphrody-deploy`); `bunx wrangler@4.161.0 deploy --dry-run` first. The token comes from `ay auth mint cloudflare --perm "Workers Scripts Write,Workers R2 Storage Write" -- ...`.
- Proof: `env-kit exec -- bun infra/cloudflare/proof.ts` (section 10: aphrody.com holding page, aphrody.app pages, Access on the dashboard, last push deployed with a live preview, rollback drill on `yolo`).
- Rollback of the platform itself: `wrangler rollback` on `aphrody-deploy`; of the apex move: re-attach `aphrody.app` and `www.aphrody.app` to the Worker `aphrody-app-site` (the former desktop shell, now on `shell.aphrody.app`).

## Vercel inventory (2026-11-13, API `api.vercel.com` with the vault `VERCEL_TOKEN`)

- Team `aphrody-dev` (plan hobby, account soft-blocked since 06/2026, `docs/infra/DEPLOY.md`): projects `rg-api` (root `apps/rg-bot`), `rg-website` (`apps/rg-website`, Next.js), `rg-discord` (`crates/aphrody-rg-server`). Zero deployments, no linked repository, no domain.
- Not migrated: the three belong to rosegriffon (`apps/rosegriffon`, a community product maintained by Aphrody, not an Aphrody product), their root directories do not exist in `src`, and there is nothing deployed to move. Same for `apps/shenron/vercel.json` (submodule, community product).
- In `src` itself nothing is served by Vercel. What remains is portability code: `scripts/deploy-target.ts <app> vercel` (render only, refuses commercial apps) and `apps/r2-site/src/entry.vercel.ts` (adapter of `packages/runtime-adapter`).


================================================
FILE: env-kit/README.md
================================================
# `@aphrody/env-kit` — Sovereign Monorepo Environment & Secret Architecture

Zero-dependency cross-language environment loader, secret redaction guard, and unified editor/CLI credential synchronizer for `C:\src`.

## Security Model

1. **Master Secret Vault (`C:\src\.env`)**: Locked via Windows NTFS ACLs (`inheritance:r`, explicit Full Control strictly restricted to `$env:USERNAME`, `NT AUTHORITY\SYSTEM`, and `BUILTIN\Administrators`).
2. **Global Git Guard**: `C:\src\.gitignore` and global `core.excludesFile` (`~/.gitignore_global`) block `.env`, `.env.*` (except `!.env.example`), `.dev.vars`, `*.pem`, `*.key`, and `.credentials.json` across every repository on the machine.
3. **Zero-Leakage Redaction**: Every language loader masks credentials (`SET [len=N]`) or `[REDACTED]` on `inspect`, `JSON.stringify`, `Debug`/`Display`, `repr()`, `fmt.Stringer`, and `__tostring`.

## CLI Usage (`env-kit`)

Installed at `C:\Users\aphro\.local\bin\env-kit.exe` (`env-kit.cmd` shim):

```powershell
env-kit doctor                       # Masked audit of all credentials, NTFS ACLs, and editors
env-kit accounts status [--json]     # 3-principal gcloud configs, rclone, and 10 org provider surfaces
env-kit accounts init-gcloud         # Idempotently configure ai-agent, owner, org-contact, sa-automation
env-kit accounts switch <principal>  # Switch active gcloud config (<ai|owner|org|sa>)
env-kit accounts iam-bindings        # Print idempotent IAM policy bindings for project aphrody (#468000409790)
env-kit set <KEY> <VALUE>            # Propagate secret to C:\src\.env + Windows User Env + OpenCode/Zed/Pi
env-kit nuget-set-key <API_KEY>      # Set NUGET_API_KEY across .env and Windows User Env
env-kit sync-editors                 # Sync OpenCode, Zed, and Pi provider & MCP configs
env-kit sync-gh                      # Sync active `gh auth token` into GITHUB_TOKEN & GH_TOKEN
env-kit dev-vars <workerDir>         # Generate gitignored .dev.vars for Cloudflare `wrangler dev`
env-kit vercel-env [dir] [--write]   # Export masked Vercel env summary or .env.local
env-kit exec -- <command> [args...]  # Run any binary with C:\src\.env injected
```

## OS Secret Store (`env-kit secret`, `ay secret`)

Encrypted by the OS, one file per secret named after its environment variable (`src/secret-store.ts`):

| Host       | Backend                                                                  | Directory                                                                    |
| :--------- | :----------------------------------------------------------------------- | :--------------------------------------------------------------------------- |
| Windows    | DPAPI current user (`CryptProtectData` via bun:ffi, application entropy) | `%LOCALAPPDATA%\aphrody\secrets\<NAME>.dpapi`                                |
| Linux root | `systemd-creds` (host key, TPM2 when present)                            | `/etc/credstore.encrypted/<NAME>` (read by `LoadCredentialEncrypted=<NAME>`) |
| Linux user | `systemd-creds --user` (systemd >= 256)                                  | `~/.config/credstore.encrypted/<NAME>`                                       |

```sh
<provider cli> | ay secret set NAME      # value on stdin only (refused from a terminal)
ay secret exec NAME [NAME...] -- cmd     # child gets the values in its env
ay secret pipe NAME -- cmd               # child gets the value on stdin
ay secret list | info | has NAME | rm NAME | import [KEY...]   # import: .env -> store, idempotent
```

There is no `get`: a stdout captured by an agent or a CI log is not a terminal, so nothing prints a value.
Library API for other tools (AI provider keys included): `secretSet`, `secretGet`, `secretList`,
`resolveSecret(name)` (store, then `process.env` / `.env`). `env-kit set` and `sync-gh` also write the store.

## Fleet Authentication (`env-kit auth`, `ay auth`)

`status`, `repair [--browser]`, `gh-secrets`, `tunnels`, `rotate cloudflare`: see `docs/infra/AUTH.md`.
Inventory in `infra/deploy.toml` (`[nodes.*]`, `[auth.*]`).

## Multi-Language Loaders

| Language / Runtime            | Path                                                      | Native CLI Flag / Usage                                                  |
| :---------------------------- | :-------------------------------------------------------- | :----------------------------------------------------------------------- |
| **Bun v1.4.4 / TypeScript**   | `C:\src\packages\env-kit\src\index.ts`                    | `bun --env-file=C:/src/.env` or `loadMonorepoEnv({ service, required })` |
| **Rust 2024 (`aphrody-env`)** | `C:\src\packages\env-kit\loaders\rust`                    | `aphrody_env::load_monorepo_env(LoadOptions::default())`                 |
| **Python 3.12+ / `uv`**       | `C:\src\packages\env-kit\loaders\python\sovereign_env.py` | `uv run --env-file C:/src/.env` or `sovereign_env.load_monorepo_env()`   |
| **C11 / C++23**               | `C:\src\packages\env-kit\loaders\cpp\sovereign_env.hpp`   | `sovereign_env::load()` / `sovereign_env_load_file(NULL, 0)`             |
| **.NET 10/11 C#**             | `C:\src\packages\env-kit\loaders\dotnet\SovereignEnv.cs`  | `Aphrody.EnvKit.SovereignEnv.Load()`                                     |
| **Go 1.24+**                  | `C:\src\packages\env-kit\loaders\go\envkit.go`            | `envkit.Load()`                                                          |
| **Lua 5.1+ / LuaJIT**         | `C:\src\packages\env-kit\loaders\lua\sovereign_env.lua`   | `require("sovereign_env").load()` (via `LUA_PATH`)                       |
| **PowerShell / POSIX**        | `C:\src\packages\env-kit\loaders\shell\load-env.ps1`      | `. C:\src\packages\env-kit\loaders\shell\load-env.ps1` / `. load-env.sh` |


================================================
FILE: google-design/README.md
================================================
# Google Design Sovereign Mirror & UI Gate (`gds`)

Complete local mirror, HCT perceptual color engine, universal multi-surface token compiler, and UI gate verification engine for Google Design (`design.google`), Material Design 3 (`m3.material.io`), Google Stitch, Figma Code Connect, and Gemini Web Canvas.

Built with 100% pure **Bun v1.4.4 Full Rust Architecture** with strictly **zero external npm dependencies**.

---

## Capabilities

1. **Exact CAM16 + CIELAB -> HCT Color Science**:
   - Perceptual color space math based directly on Google's `material-foundation/material-color-utilities`.
   - Full tonal palettes (`0, 4, 6, 10, 12, 17, 20, 22, 24, 30, 40, 50, 60, 70, 80, 87, 90, 92, 94, 95, 96, 98, 99, 100`).
   - DynamicScheme generation across TonalSpot, Expressive, Vibrant, Monochrome, and Neutral variants.
   - Mathematical WCAG 2.2 AA / AAA contrast solver and image seed color quantizer.

2. **Universal Multi-Surface Token Compiler (7 Surfaces)**:
   - **Web CSS**: `--md-sys-color-*`, `--md-sys-typescale-*`, `--md-sys-motion-*`, `--md-sys-shape-*`, `--md-sys-elevation-*`.
   - **Figma W3C Tokens**: `$value`, `$type`, Collections schema, and Code Connect contracts.
   - **Stitch & Gemini Canvas**: Interactive UI tree, responsive breakpoints (Compact, Medium, Expanded), and Nano Banana (`gemini-2.5-flash-image`) asset slots.
   - **Desktop Rust**: `taffy::google_design` styles, Zed `GPUI` themes, System76 `COSMIC` RON, and Microsoft WinUI 3 `Fluent 2` parity.
   - **Mobile**: Android Material You `colors.xml`, Jetpack Compose `lightColorScheme`, and Apple SwiftUI `Color` extensions.
   - **TUI**: 24-bit TrueColor ANSI escape sequences, Rio terminal config, and OpenTUI Unicode glyph themes.

3. **Automated UI Gate Verifier (`gds verify`)**:
   - Scans web, mobile, desktop, and UI codebases against Material 3 token rules.
   - Flags rogue hardcoded hex colors outside the HCT tonal system.
   - Audits 4dp/8dp harmonic grid compliance for margins, paddings, and layout gaps.
   - Verifies crisp Material Symbols vector SVG coordinates (`viewBox="0 -960 960 960"`).
   - Validates WCAG 2.2 contrast ratios and tone delta mathematically.

4. **Automated MDX Generator for Bun Docs (`gds mdx`)**:
   - Compiles full documentation directly into `C:\src\third_party\bun\docs\design\`.
   - Formatted natively via `bun fmt`.

5. **Full-Recon Local Mirror Web Server (`server.ts`)**:
   - Routes: `/`, `/hct`, `/tokens`, `/symbols`, `/canvas`, `/stitch`, `/figma`, `/verify`, `/llms.txt`.
   - JSON API: `/api/hct`, `/api/tokens`, `/api/symbols`, `/api/stitch`, `/api/verify`, `/api/canvas`.
   - Enforces zero layout shift (`CLS = 0`) and high performance.

---

## 3-Letter CLI Usage (`gds`)

```bash
# Display help and available commands
gds help

# Start the local mirror server
gds serve --port 3030

# Run UI Gate verification on any target directory
gds verify C:\src\packages\google-design
gds verify C:\src\apps\aphrody

# Analyze any color in CAM16 / HCT perceptual space
gds hct 4285F4
gds hct EA4335

# Compile universal multi-surface tokens from a seed color
gds tokens --seed "#4285F4" --out ./tokens

# Search crisp Material Symbols
gds symbols search

# Generate structured Material 3 screens from prompts
gds stitch "Developer analytics dashboard"

# Re-generate and format Bun docs MDX suite
gds mdx
```

---

## Upstream Sovereign Repositories (`upstream/`)

The following upstream repositories are tracked locally with minimal byte footprints (`--depth=1 --filter=blob:none` and sparse checkouts):

- `material-foundation/material-color-utilities`
- `material-foundation/material-theme-builder`
- `material-foundation/material-tokens`
- `material-components/material-web`
- `google/material-design-icons` (sparse checkout of core symbols, variablefont, README)
- `figma/code-connect`
- `figma/plugin-typings`
- `google-labs-code/stitch-sdk`
- `google-labs-code/stitch-skills`
- `google-labs-code/design.md`


================================================
FILE: machine/README.md
================================================
# packages/machine/ — poste Windows reproductible, du noyau à Claude Code

Décisions et preuves : [aphrody-labs/nt docs/research](https://github.com/aphrody-labs/nt/tree/main/docs/research) (`shell-replacement.md`, `claude-to-nt-stack.md`, `fork-merge-plan.md`, `rust-in-windows.md`). Profil matériel : skill `windows-machine`.

## Ordre d'application

| #   | Commande                                                                                           | Effet                                                                                                                                                                                  | Vérifier                                             |
| --- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | `winget configure -f packages/machine/shell.dsc.winget --accept-configuration-agreements`          | niubash 1.5.0 + Coreutils for Windows 2026.9.3 (DSC v3, `Microsoft.WinGet/Package`)                                                                                                    | `winget configure test -f …`                         |
| 2   | `winget configure -f packages/machine/machine.export.dsc.winget --accept-configuration-agreements` | les 160 paquets du poste (sans Oven-sh.Bun : bun = ~/.bun, tools.toml), versions épinglées (export du 2026-11-12)                                                                      | `winget configure test -f …`                         |
| 3   | `ay up` (racine du dépôt)                                                                          | toolchains de `tools.toml` (dont niubash, ms-coreutils) avec checksums                                                                                                                 | `ay up --check`                                      |
| 4   | `bun packages/machine/src/apply-user.ts`                                                           | Claude Code (bash = niubash, outil PowerShell off), MCP `agent-desktop` (UIA, `--headed`) et `agent-browser`, PATH utilisateur sans Git Bash, Windows Terminal (défaut niubash, élevé) | `bun … --check` (code 0)                             |
| 5   | `bun packages/machine/src/forks.ts` puis `ay lock --lock-only`                                     | forks `aphrody-labs` (origin) + amont (upstream) + remotes de réseau, un clone par projet dans `third_party/`                                                                          | `bun packages/machine/src/forks.ts --check` (code 0) |

Exécution : Claude Code tourne en administrateur (intégrité élevée `S-1-16-12288`) ; Windows Terminal ouvre niubash élevé ; `sudo` (Inline) est disponible pour un processus non élevé.

## Réglages de sécurité — à faire par le propriétaire (non automatisés ici)

Ces réglages changent la posture de sécurité du poste ; ils restent une décision humaine.

| Réglage                                                                                              | Où                                                    | État au 2026-11-12                                                             |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Sudo for Windows                                                                                     | Paramètres > Système > Avancé > Activer sudo          | activé, mode Inline (`HKLM\…\Sudo Enabled=3`)                                  |
| Élévation admin sans invite UAC                                                                      | `ConsentPromptBehaviorAdmin`                          | `0` (aucune invite) : tout processus de l'utilisateur peut s'élever en silence |
| Fonctionnalités agentiques expérimentales (surface MCP Windows, compte et espace de travail d'agent) | Paramètres > Système > Composants IA > Outils d'agent | désactivé (`odr mcp list` : « MCP surface is not enabled »)                    |
| Réduire les protections des connecteurs d'agent                                                      | Paramètres > Système > Avancé > Composants IA         | non activé                                                                     |
| Computer use de Claude Desktop                                                                       | Claude Desktop > Settings > This computer             | à décider (préversion, Windows)                                                |


================================================
FILE: wck/README.md
================================================
# wck: Sovereign Compile-Time Web & Lighthouse Gate

Deterministic, zero-compromise Compile-Time Web Validator implementing all 7 mandatory specifications for modern web platforms.

Built in 100% pure oven-sh/bun (Full Rust) with zero external npm dependencies. Compiled to a standalone native Windows executable (`wck.exe`).

## 7 Mandatory Specifications

1. **Spec 1 — Google Search SEO (`seo`)**:
   - `<html lang="...">` ISO language declaration
   - `<meta charset="utf-8">`
   - `<title>` length between 10 and 60 characters
   - `<meta name="description">` length between 50 and 160 characters
   - `<link rel="canonical" href="https://...">`
   - OpenGraph metadata (`og:title`, `og:description`, `og:url`, `og:type`)
   - Semantic landmarks: `<header role="banner">`, `<main role="main">`, `<footer role="contentinfo">`
   - Accessible names on `<button>`, `<input>`, `<a>`, `<svg role="img">`
   - `robots.txt` and `sitemap.xml` validation

2. **Spec 2 — Google AI Mode SEO & Generative Engine Optimization (`aiseo`)**:
   - Schema.org JSON-LD Structured Data (`WebSite` or `SoftwareApplication` with `potentialAction: SearchAction`)
   - Meta robots AI crawler directives: `index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1`
   - Concise AI Crawler Index (`/llms.txt`) with H1 title, summary, and canonical endpoints

3. **Spec 3 — Modern Web Guidelines & WCAG 2.2 AA (`mwg`)**:
   - `<meta name="viewport" content="width=device-width, initial-scale=1">` (rejects `maximum-scale=1` or `user-scalable=no`)
   - Explicit `color-scheme: light dark` support
   - Keyboard `:focus-visible` CSS rules
   - `@media (prefers-reduced-motion: reduce)` support
   - Zero deprecated HTML tags and zero inline `javascript:` URLs

4. **Spec 4 — Core Web Vitals Static Gate (`cwv`)**:
   - **CLS = 0.000**: Explicit `width` & `height` on all `<img>`, `<svg>`, `<canvas>`, `<video>` tags; compositor-only `@keyframes`
   - **LCP Budget**: Initial HTML + gzipped CSS `< 14 KB` (fits inside TCP IW10 congestion window)
   - **INP Budget**: Initial JS bundle gzipped size `< 30 KB` (< 15 ms parse/compile, < 50 ms INP)

5. **Spec 5 — Lighthouse 100/100/100/100 Gate (`lh`)**:
   - Deterministic 100/100/100/100 scores across Performance, Accessibility, Best Practices, and SEO

6. **Spec 6 — WebAssembly Spec Gate (`wasm`)**:
   - Magic header `\0asm\x01\x00\x00\x00` validation
   - Native `WebAssembly.validate()` bytecode verification
   - Native `WebAssembly.Module()` instantiation and export/import contract checks

7. **Spec 7 — WebGPU & Chromium Dawn Spec Gate (`webgpu`)**:
   - WGSL entry points `@compute`, `@vertex`, `@fragment`
   - Universal Dawn/Chromium workgroup limit: `X * Y * Z <= 256` invocations
   - Group/binding uniqueness (`@group(g) @binding(b)`)
   - 16-byte struct uniform std140 layout alignment rules
   - Browser `navigator.gpu` capability guard

## CLI Usage

```bash
# Validate directory
wck C:\src\apps\aphrody\dist

# Validate single HTML document
wck C:\src\crates\gamescope-rs\web\index.html

# Output JSON
wck C:\src\apps\aphrody\dist --json
```


================================================
FILE: ai-os/package.json
================================================
// [OUTLINE - 35 symbols, 42 lines]
// L2: "name": "@aphrody/ai-os"
// L3: "version": "0.2.0"
// L4: "description": "Aphrody AI OS: agent core (memory, skills, context, scheduler), single model bridge discovered at run time, relay (MCP, A2A, ACP, JSON-RPC over HTTP/WS/TCP/TLS), gateway, research, TUI"
// L5: "type": "module"
// L6: "private": true
// L7-L10: "bin":
// L8: "ai-os": "./src/cli.ts"
// L9: "relay": "./src/relay/cli.ts"
// L11-L26: "exports":
// L12: ".": "./src/index.ts"
// L13: "./core": "./src/core/index.ts"
// L14: "./llm": "./src/llm/index.ts"
// L15: "./llm/testing": "./src/llm/testing.ts"
// L16: "./gateway": "./src/gateway/index.ts"
// L17: "./research": "./src/research/index.ts"
// L18: "./tui": "./src/tui/index.ts"
// L19: "./relay": "./src/relay/protocols.ts"
// L20: "./relay/server": "./src/relay/server.ts"
// L21: "./stitch": "./src/google/stitch/src/index.ts"
// L22: "./stitch/tools": "./src/google/stitch/src/tools.ts"
// L23: "./jules": "./src/google/jules/index.ts"
// L24: "./google": "./src/google/cli.ts"
// L25: "./relay/mcp-http": "./src/relay/mcp-http.ts"
// L27-L31: "scripts":
// L28: "test": "bun test test"
// L29: "check": "bun check src/cli.ts"
// L30: "relay": "bun src/relay/cli.ts serve"
// L32-L34: "dependencies":
// L33: "@aphrody/design": "workspace:*"
// L35: "devDependencies":
// L36: "license": "MIT OR Apache-2.0"
// L37-L41: "repository":
// L38: "type": "git"
// L39: "url": "git+https://github.com/aphrody-labs/src.git"
// L40: "directory": "packages/ai-os"


================================================
FILE: ai-os/python/agent_core/pyproject.toml
================================================
[build-system]
requires = ["maturin>=1.9,<2"]
build-backend = "maturin"

[project]
name = "agent-core"
version = "0.1.0"
description = "pyo3 bridge to the agent Context store (crates/agent-py)."
requires-python = ">=3.10"

[tool.maturin]
manifest-path = "../../../../crates/agent-py/Cargo.toml"
module-name = "agent_core"


================================================
FILE: ai-os/python/hermes_agent_memory/pyproject.toml
================================================
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "hermes-agent-memory"
version = "0.1.0"
description = "Hermes Agent memory provider backed by the unified agent Context store (pyo3 agent_core)."
requires-python = ">=3.10"
dependencies = ["agent-core"]

[project.entry-points."hermes_agent.memory_providers"]
agent = "hermes_agent_memory:register"

[dependency-groups]
dev = ["pytest>=8"]

[tool.uv.sources]
agent-core = { workspace = true }


================================================
FILE: ai-os/python/research_ref/pyproject.toml
================================================
[project]
name = "research-ref"
version = "0.1.0"
description = "Reference validator for agent research results (TS port in packages/ai-os/src/research)."
requires-python = ">=3.14"


================================================
FILE: assets/package.json
================================================
// [OUTLINE - 25 symbols, 33 lines]
// L2: "name": "@aphrody/assets"
// L3: "version": "0.1.0"
// L4: "description": "Redistribution-safe asset library: manifest with SPDX license, sha256 and attribution; fetch, verify, list"
// L5: "type": "module"
// L6: "main": "./src/manifest.ts"
// L7: "types": "./src/manifest.ts"
// L8-L10: "bin":
// L9: "assets": "./src/cli.ts"
// L11-L15: "scripts":
// L12: "verify": "bun run src/cli.ts verify"
// L13: "gen": "bun run src/gen/gen.ts"
// L14: "test": "bun test"
// L16-L19: "dependencies":
// L17: "svgo": "4.1.0"
// L18: "wawoff2": "2.0.1"
// L20-L22: "devDependencies":
// L21: "gltf-validator": "2.0.0-dev.3.10"
// L23: "license": "MIT OR Apache-2.0"
// L24-L28: "repository":
// L25: "type": "git"
// L26: "url": "git+https://github.com/aphrody-labs/src.git"
// L27: "directory": "packages/assets"
// L29-L32: "publishConfig":
// L30: "access": "public"
// L31: "registry": "https://registry.npmjs.org/"


================================================
FILE: bun-parity/package.json
================================================
// [OUTLINE - 28 symbols, 42 lines]
// L2: "name": "@aphrody/bun-parity"
// L3: "version": "1.0.0"
// L4: "description": "Automated Chromium Upstream vs Bun Full-Stack Parity Recon & Auto-Patcher"
// L5: "type": "module"
// L6: "main": "src/index.ts"
// L7-L9: "bin":
// L8: "bpt": "./bin/bpt.ts"
// L10-L19: "scripts":
// L11: "bpt": "bun run ./bin/bpt.ts"
// L12: "scan": "bun run ./bin/bpt.ts scan"
// L13: "patch": "bun run ./bin/bpt.ts patch"
// L14: "report": "bun run ./bin/bpt.ts report"
// L15: "test": "bun test"
// L16: "check": "bun check"
// L17: "fmt": "bun fmt"
// L18: "fmt:check": "bun fmt --check"
// L20-L28: "keywords": [
// L29: "author": "Antigravity Engineering"
// L30: "license": "MIT"
// L31: "dependencies":
// L32: "devDependencies":
// L33-L37: "repository":
// L34: "type": "git"
// L35: "url": "git+https://github.com/aphrody-labs/src.git"
// L36: "directory": "packages/bun-parity"
// L38-L41: "publishConfig":
// L39: "access": "public"
// L40: "registry": "https://registry.npmjs.org/"


================================================
FILE: bun-plugins/package.json
================================================
// [OUTLINE - 19 symbols, 24 lines]
// L2: "name": "@aphrody/bun-plugins"
// L3: "version": "1.0.0"
// L4: "description": "Sovereign Bun Plugins: Just Recipes, Turbo Blake3 Cache, and VCS Metadata"
// L5: "type": "module"
// L6: "main": "index.ts"
// L7-L11: "scripts":
// L8: "test": "bun test"
// L9: "check": "bun check"
// L10: "fmt": "bun fmt"
// L12: "dependencies":
// L13: "devDependencies":
// L14: "license": "MIT OR Apache-2.0"
// L15-L19: "repository":
// L16: "type": "git"
// L17: "url": "git+https://github.com/aphrody-labs/src.git"
// L18: "directory": "packages/bun-plugins"
// L20-L23: "publishConfig":
// L21: "access": "public"
// L22: "registry": "https://registry.npmjs.org/"


================================================
FILE: chromium-bun/package.json
================================================
// [OUTLINE - 25 symbols, 31 lines]
// L2: "name": "@aphrody/chromium-bun"
// L3: "version": "0.0.0"
// L4: "private": true
// L5: "description": "CDP client, SSRF-guarded crawler, BM25 search shards, engine registry and runtime benchmarks, on bun"
// L6: "type": "module"
// L7: "main": "src/index.ts"
// L8-L13: "exports":
// L9: ".": "./src/index.ts"
// L10: "./search": "./src/search/index.ts"
// L11: "./cdp": "./src/browser/cdp-client.ts"
// L12: "./engines": "./src/engines/index.ts"
// L14-L16: "bin":
// L15: "chromium-bun": "./src/cli.ts"
// L17-L24: "scripts":
// L18: "start": "bun run src/cli.ts"
// L19: "bench": "bun run src/benchmarks/runner.ts"
// L20: "inspect": "bun run src/audit/chromium-inspector.ts"
// L21: "test": "bun test"
// L22: "check": "bun check"
// L23: "fmt": "bun fmt"
// L25: "license": "MIT OR Apache-2.0"
// L26-L30: "repository":
// L27: "type": "git"
// L28: "url": "git+https://github.com/aphrody-labs/src.git"
// L29: "directory": "packages/chromium-bun"


================================================
FILE: core/package.json
================================================
// [OUTLINE - 14 symbols, 19 lines]
// L2: "name": "@aphrody/core"
// L3: "version": "0.1.0"
// L4: "private": true
// L5: "type": "module"
// L6: "description": "bun:ffi bridge to crates/core-capi: tree-sitter parse/query, BLAKE3, recursive index (sqlite + JSON)"
// L7-L11: "exports":
// L8: ".": "./src/index.ts"
// L9: "./ffi": "./src/ffi.ts"
// L10: "./store": "./src/store.ts"
// L12-L14: "bin":
// L13: "ay-index": "./src/cli.ts"
// L15-L18: "scripts":
// L16: "test": "bun test"
// L17: "check": "bun check"


================================================
FILE: deploy/package.json
================================================
// [OUTLINE - 20 symbols, 25 lines]
// L2: "name": "@aphrody/deploy"
// L3: "version": "0.1.0"
// L4: "description": "aphrody.app: first-party deployment platform of the monorepo (previews per commit, production pointer, rollback, logs) on Cloudflare Workers and R2"
// L5: "type": "module"
// L6: "private": true
// L7: "main": "./src/index.ts"
// L8: "types": "./src/index.ts"
// L9-L11: "bin":
// L10: "aphrody-deploy": "./src/cli.ts"
// L12-L16: "scripts":
// L13: "check": "bun check"
// L14: "fmt": "bun fmt"
// L15: "test": "bun test"
// L17: "dependencies":
// L18: "devDependencies":
// L19: "license": "MIT OR Apache-2.0"
// L20-L24: "repository":
// L21: "type": "git"
// L22: "url": "git+https://github.com/aphrody-labs/src.git"
// L23: "directory": "packages/deploy"


================================================
FILE: design/package.json
================================================
// [OUTLINE - 29 symbols, 34 lines]
// L2: "name": "@aphrody/design"
// L3: "version": "0.1.0"
// L4: "description": "Systeme de design unique du monorepo : tokens Material 3 (Material Color Utilities) depuis assets/brand/brand.toml, sorties CSS, Rust (GPUI), Zig, ANSI, Figma, DESIGN.md ; composants Material Web ; Material Symbols (SVG et police : sous-ensemble d ay brand build ; material-symbols ne sert qu au catalogue des noms)."
// L5: "private": true
// L6: "type": "module"
// L7-L18: "exports":
// L8: ".": "./src/index.ts"
// L9: "./tokens.json": "./tokens/tokens.json"
// L10: "./tokens.css": "./tokens/tokens.css"
// L11: "./themes.css": "./tokens/themes.css"
// L12: "./themes.json": "./tokens/themes.json"
// L13: "./components": "./src/components.ts"
// L14: "./symbols.css": "./src/symbols.css"
// L15: "./bun-plugin": "./src/bun-plugin.ts"
// L16: "./runtime": "./src/runtime.ts"
// L17: "./web": "./src/web.ts"
// L19-L27: "scripts":
// L20: "build": "bun run src/build.ts"
// L21: "check": "bun run src/build.ts --check"
// L22: "test": "bun test"
// L23: "figma": "bun run src/figma.ts --modes 4"
// L24: "themes": "bun run src/cli.ts themes"
// L25: "screenshots": "bun run src/cli.ts screenshots"
// L26: "lint": "bun run ../google-design/src/design-md/cli.ts lint DESIGN.md"
// L28-L32: "dependencies":
// L29: "@material/material-color-utilities": "catalog:"
// L30: "@material/web": "catalog:"
// L31: "material-symbols": "catalog:"
// L33: "license": "MIT OR Apache-2.0"


================================================
FILE: env-kit/loaders/rust/Cargo.toml
================================================
[package]
name = "aphrody-env"
version = "0.1.0"
edition.workspace = true
description = "Zero-dependency Rust 2024 loader and SecretString redaction guard for C:/src/.env"
license = "MIT"

[dependencies]


================================================
FILE: env-kit/package.json
================================================
// [OUTLINE - 25 symbols, 31 lines]
// L2: "name": "@aphrody/env-kit"
// L3: "version": "1.0.0"
// L4: "description": "Zero-dependency cross-language environment sharing, secret redaction, 3-principal Google Cloud IAM, and editor/agent sync toolkit for C:/src"
// L5: "type": "module"
// L6: "main": "./src/index.ts"
// L7: "types": "./src/index.ts"
// L8-L10: "bin":
// L9: "env-kit": "./src/cli.ts"
// L11-L18: "scripts":
// L12: "check": "bun check"
// L13: "fmt": "bun fmt"
// L14: "fmt:check": "bun fmt --check"
// L15: "test": "bun test"
// L16: "doctor": "bun run src/cli.ts doctor"
// L17: "accounts": "bun run src/cli.ts accounts status"
// L19: "dependencies":
// L20: "devDependencies":
// L21: "license": "MIT OR Apache-2.0"
// L22-L26: "repository":
// L23: "type": "git"
// L24: "url": "git+https://github.com/aphrody-labs/src.git"
// L25: "directory": "packages/env-kit"
// L27-L30: "publishConfig":
// L28: "access": "public"
// L29: "registry": "https://registry.npmjs.org/"


================================================
FILE: ffi-bridge/package.json
================================================
// [OUTLINE - 15 symbols, 19 lines]
// L2: "name": "@aphrody/ffi-bridge"
// L3: "version": "1.27.0"
// L4: "private": true
// L5: "description": "bun:ffi bindings and tests of the Rust cdylibs (dx12-hal, rust-stack, unix-distro probes)"
// L6: "type": "module"
// L7-L10: "exports":
// L8: "./dx12-hal": "./src/dx12-hal.ts"
// L9: "./unix-distro": "./src/unix-distro.ts"
// L11-L15: "scripts":
// L12: "test": "bun test"
// L13: "check": "bun check"
// L14: "fmt": "bun fmt"
// L16: "dependencies":
// L17: "devDependencies":
// L18: "packageManager": "bun@1.4.4"


================================================
FILE: forge/package.json
================================================
// [OUTLINE - 24 symbols, 31 lines]
// L2: "name": "@aphrody/forge"
// L3: "version": "1.1.0"
// L4: "description": "Sovereign Rust + TypeScript Tri-Forge (GitHub + GitLab + Google Git + Arch Upstreams) CLI (frg)"
// L5: "type": "module"
// L6: "main": "src/cli.ts"
// L7-L9: "bin":
// L8: "frg": "src/cli.ts"
// L10-L16: "scripts":
// L11: "start": "bun run src/cli.ts serve"
// L12: "status": "bun run src/cli.ts status"
// L13: "remotes": "bun run src/cli.ts remotes"
// L14: "build": "bun build --compile src/cli.ts --outfile dist/frg.exe"
// L15: "test": "bun test"
// L17-L19: "dependencies":
// L18: "@aphrody/core": "workspace:*"
// L20: "devDependencies":
// L21: "license": "MIT OR Apache-2.0"
// L22-L26: "repository":
// L23: "type": "git"
// L24: "url": "git+https://github.com/aphrody-labs/src.git"
// L25: "directory": "packages/forge"
// L27-L30: "publishConfig":
// L28: "access": "public"
// L29: "registry": "https://registry.npmjs.org/"


================================================
FILE: gaming/package.json
================================================
// [OUTLINE - 30 symbols, 39 lines]
// L2: "name": "@aphrody/gaming"
// L3: "version": "1.0.0"
// L4: "description": "Gaming stack of the monorepo: Steam (web API, SteamID, local paths over `ay steam`), Proton, Vulkan layers, DirectX, steamcmd and Proton wrappers; `ay gaming`"
// L5: "type": "module"
// L6: "main": "./src/index.ts"
// L7: "types": "./src/index.ts"
// L8-L10: "bin":
// L9: "gaming": "./src/cli.ts"
// L11-L15: "scripts":
// L12: "check": "bun check"
// L13: "fmt": "bun fmt"
// L14: "test": "bun test"
// L16: "dependencies":
// L17: "devDependencies":
// L18: "license": "MIT OR Apache-2.0"
// L19-L23: "repository":
// L20: "type": "git"
// L21: "url": "git+https://github.com/aphrody-labs/src.git"
// L22: "directory": "packages/gaming"
// L24-L27: "publishConfig":
// L25: "access": "public"
// L26: "registry": "https://registry.npmjs.org/"
// L28-L35: "exports":
// L29: ".": "./src/index.ts"
// L30: "./steamcmd": "./src/steamcmd.ts"
// L31: "./steam": "./src/steam.ts"
// L32: "./proton": "./src/proton.ts"
// L33: "./vulkan": "./src/vulkan.ts"
// L34: "./dx": "./src/dx.ts"
// L36-L38: "files": [


================================================
FILE: google-design/package.json
================================================
// [OUTLINE - 34 symbols, 40 lines]
// L2: "name": "@aphrody/google-design"
// L3: "version": "2.0.0"
// L4: "description": "Anti-AI-Slop Design-First Studio, M3 + Fluent 2 + Omarchy/CachyOS Token Compiler & Open Creative Asset Bank"
// L5: "private": true
// L6: "type": "module"
// L7: "main": "./index.ts"
// L8-L16: "exports":
// L9: ".": "./index.ts"
// L10: "./cli": "./cli.ts"
// L11: "./humanizer": "./src/humanizer/anti-slop.ts"
// L12: "./spec": "./src/spec/prd-design-md.ts"
// L13: "./assets": "./src/assets/index.ts"
// L14: "./symbols": "./src/symbols/catalog.ts"
// L15: "./design-md": "./src/design-md/index.ts"
// L17-L19: "bin":
// L18: "gds": "./cli.ts"
// L20-L31: "scripts":
// L21: "build": "bun run build.ts"
// L22: "dev": "bun run server.ts"
// L23: "start": "bun run server.ts"
// L24: "test": "bun test tests"
// L25: "check": "bun check"
// L26: "fmt": "bun fmt"
// L27: "mdx": "bun run cli.ts mdx"
// L28: "verify": "bun run cli.ts verify"
// L29: "assets": "bun run cli.ts assets --out dist/assets"
// L30: "lint": "bun run src/cli.ts lint"
// L32: "dependencies":
// L33: "devDependencies":
// L34: "license": "MIT OR Apache-2.0"
// L35-L39: "repository":
// L36: "type": "git"
// L37: "url": "git+https://github.com/aphrody-labs/src.git"
// L38: "directory": "packages/google-design"


================================================
FILE: i18n/package.json
================================================
// [OUTLINE - 26 symbols, 33 lines]
// L2: "name": "@aphrody/i18n"
// L3: "version": "0.1.0"
// L4: "description": "Shared i18n layer for src: JSON catalogs with an ICU MessageFormat subset, t() with fallback to en, Accept-Language negotiation, check/extract CLI"
// L5: "type": "module"
// L6: "main": "./src/index.ts"
// L7: "types": "./src/index.ts"
// L8-L11: "exports":
// L9: ".": "./src/index.ts"
// L10: "./locales/*": "./locales/*"
// L12-L14: "bin":
// L13: "aphrody-i18n": "./src/cli.ts"
// L15-L20: "scripts":
// L16: "check": "bun check"
// L17: "fmt": "bun fmt"
// L18: "test": "bun test"
// L19: "i18n:check": "bun run src/cli.ts check"
// L21: "dependencies":
// L22: "devDependencies":
// L23: "license": "MIT OR Apache-2.0"
// L24-L28: "repository":
// L25: "type": "git"
// L26: "url": "git+https://github.com/aphrody-labs/src.git"
// L27: "directory": "packages/i18n"
// L29-L32: "publishConfig":
// L30: "access": "public"
// L31: "registry": "https://registry.npmjs.org/"


================================================
FILE: linux/package.json
================================================
// [OUTLINE - 16 symbols, 21 lines]
// L2: "name": "@aphrody/linux"
// L3: "version": "1.0.0"
// L4: "description": "ay linux and ay pkg: kernel patchsets, kernel builds off the PC, one package recipe for every distro"
// L5: "type": "module"
// L6: "private": true
// L7-L9: "bin":
// L8: "linux": "./src/cli.ts"
// L10-L14: "scripts":
// L11: "check": "bun check"
// L12: "fmt": "bun fmt"
// L13: "test": "bun test"
// L15: "license": "MIT OR Apache-2.0"
// L16-L20: "repository":
// L17: "type": "git"
// L18: "url": "git+https://github.com/aphrody-labs/src.git"
// L19: "directory": "packages/linux"


================================================
FILE: machine/package.json
================================================
// [OUTLINE - 16 symbols, 20 lines]
// L2: "name": "@aphrody/machine"
// L3: "version": "0.1.0"
// L4: "description": "Reproducible Windows workstation: WinGet DSC v3 (niubash, Coreutils), Claude Code shell/MCP setup, aphrody-labs forks, flat third_party"
// L5: "type": "module"
// L6: "private": true
// L7-L13: "scripts":
// L8: "check": "bun src/apply-user.ts --check"
// L9: "apply": "bun src/apply-user.ts"
// L10: "flatten": "bun src/flatten-third-party.ts"
// L11: "shells": "bun src/shells.ts"
// L12: "shells:check": "bun src/shells.ts --check"
// L14: "license": "MIT OR Apache-2.0"
// L15-L19: "repository":
// L16: "type": "git"
// L17: "url": "git+https://github.com/aphrody-labs/src.git"
// L18: "directory": "packages/machine"


================================================
FILE: net/package.json
================================================
// [OUTLINE - 9 symbols, 12 lines]
// L2: "name": "@aphrody/net"
// L3: "version": "0.2.0"
// L4: "private": true
// L5: "type": "module"
// L6: "module": "src/probe.ts"
// L7-L11: "scripts":
// L8: "probe": "bun src/probe.ts"
// L9: "test": "bun test"
// L10: "test:e2e-auth": "bun test test/gemini.e2e-auth.test.ts"


================================================
FILE: release/package.json
================================================
// [OUTLINE - 14 symbols, 19 lines]
// L2: "name": "@aphrody/release"
// L3: "version": "1.0.0"
// L4: "private": true
// L5: "description": "ay release: tags, GitHub releases, crates.io, npm, PyPI and vcpkg/CMake from fr1, dry-run first"
// L6: "type": "module"
// L7-L9: "bin":
// L8: "release": "./src/cli.ts"
// L10-L12: "scripts":
// L11: "test": "bun test"
// L13: "license": "MIT OR Apache-2.0"
// L14-L18: "repository":
// L15: "type": "git"
// L16: "url": "git+https://github.com/aphrody-labs/src.git"
// L17: "directory": "packages/release"


================================================
FILE: runtime-adapter/package.json
================================================
// [OUTLINE - 15 symbols, 19 lines]
// L2: "name": "@aphrody/runtime-adapter"
// L3: "version": "0.1.0"
// L4: "description": "One app entrypoint for Cloudflare Workers, Vercel Functions and Bun.serve on the VPS: storage, KV, SQL, cron and env selected by infra/deploy.toml + env"
// L5: "private": true
// L6: "type": "module"
// L7: "main": "./src/index.ts"
// L8-L11: "exports":
// L9: ".": "./src/index.ts"
// L10: "./bun": "./src/bun.ts"
// L12-L16: "scripts":
// L13: "test": "bun test"
// L14: "check": "bun check"
// L15: "fmt": "bun fmt"
// L17: "dependencies":
// L18: "devDependencies":


================================================
FILE: shell-matrix/package.json
================================================
// [OUTLINE - 12 symbols, 16 lines]
// L2: "name": "@aphrody/shell-matrix"
// L3: "version": "0.1.0"
// L4: "description": "Conformance matrix for sh/bash candidates replacing Git Bash/MSYS2 (Claude Code invocation, POSIX, bash, Windows paths)"
// L5: "type": "module"
// L6: "private": true
// L7-L9: "bin":
// L8: "shell-matrix": "./src/cli.ts"
// L10: "license": "MIT OR Apache-2.0"
// L11-L15: "repository":
// L12: "type": "git"
// L13: "url": "git+https://github.com/aphrody-labs/src.git"
// L14: "directory": "packages/shell-matrix"


================================================
FILE: site/package.json
================================================
// [OUTLINE - 17 symbols, 23 lines]
// L2: "name": "@aphrody/site"
// L3: "version": "0.1.0"
// L4: "description": "Framework de sites statiques sur bun : conventions app/ (page, layout, not-found, route, [param], generateStaticParams), métadonnées, i18n, images, polices, CDN /_static immuable, _headers et _redirects."
// L5: "private": true
// L6: "type": "module"
// L7-L9: "bin":
// L8: "aphrody-site": "./src/cli.ts"
// L10-L14: "exports":
// L11: ".": "./src/index.ts"
// L12: "./build": "./src/build.ts"
// L13: "./serve": "./src/serve.ts"
// L15-L17: "scripts":
// L16: "test": "bun test"
// L18-L21: "dependencies":
// L19: "@aphrody/design": "workspace:*"
// L20: "@aphrody/wck": "workspace:*"
// L22: "license": "MIT OR Apache-2.0"


================================================
FILE: upstream/package.json
================================================
// [OUTLINE - 22 symbols, 28 lines]
// L2: "name": "@aphrody/upstream"
// L3: "version": "1.0.0"
// L4: "description": "Patch stacks of the bun and Chromium forks: status, rebase on upstream, ephemeral PR heads, contribution checks"
// L5: "type": "module"
// L6: "main": "./src/index.ts"
// L7: "types": "./src/index.ts"
// L8-L10: "bin":
// L9: "upstream": "./src/cli.ts"
// L11-L15: "scripts":
// L12: "check": "bun check"
// L13: "fmt": "bun fmt"
// L14: "test": "bun test"
// L16: "dependencies":
// L17: "devDependencies":
// L18: "license": "MIT OR Apache-2.0"
// L19-L23: "repository":
// L20: "type": "git"
// L21: "url": "git+https://github.com/aphrody-labs/src.git"
// L22: "directory": "packages/upstream"
// L24-L27: "publishConfig":
// L25: "access": "public"
// L26: "registry": "https://registry.npmjs.org/"


================================================
FILE: vault/native/Cargo.toml
================================================
# aphrody-vault: Rust side of @aphrody/vault (docs/infra/VAULT.md). Same on-disk formats as the TS
# package: DPAPI blobs (entropy v1) / systemd-creds credentials, AYV1 envelopes, age X25519.
# Member of the root workspace (explicit entry in the root Cargo.toml), built in CI or on fr1.
[package]
name = "aphrody-vault"
version = "0.1.0"
edition.workspace = true
rust-version.workspace = true
license.workspace = true
publish = false

[lib]
crate-type = ["rlib", "cdylib"]

[dependencies]
age = { workspace = true }
aes-gcm = { workspace = true }
tokio = { workspace = true, features = [
  "rt",
  "rt-multi-thread",
  "process",
  "fs",
  "io-util",
  "macros",
] }
zeroize = { workspace = true }
getrandom = { workspace = true }

[target.'cfg(windows)'.dependencies]
windows = { workspace = true, features = [
  "Win32_Foundation",
  "Win32_Security_Cryptography",
] }

[dev-dependencies]
tokio = { workspace = true, features = ["rt-multi-thread", "macros"] }


================================================
FILE: vault/package.json
================================================
// [OUTLINE - 15 symbols, 19 lines]
// L2: "name": "@aphrody/vault"
// L3: "version": "0.1.0"
// L4: "description": "Async secret vault for src: DPAPI / Windows Hello (NCrypt Passport KSP) / systemd-creds locally, age envelopes per host for sync, sealed json/xml/csv/toml documents, row-encrypted bun:sqlite, Chromium password CSV and agent profiles"
// L5: "type": "module"
// L6: "main": "./src/index.ts"
// L7: "types": "./src/index.ts"
// L8-L10: "bin":
// L9: "vault": "./src/cli.ts"
// L11-L15: "scripts":
// L12: "test": "bun test"
// L13: "bench": "bun bench/bench.ts"
// L14: "check": "bun check"
// L16: "dependencies":
// L17: "license": "MIT OR Apache-2.0"
// L18: "private": true


================================================
FILE: wck/package.json
================================================
// [OUTLINE - 21 symbols, 27 lines]
// L2: "name": "@aphrody/wck"
// L3: "version": "1.0.0"
// L4: "description": "Compile-Time Web Validator (Google SEO + AI Mode SEO + Modern Web Guidelines + Core Web Vitals + Lighthouse 100 + WASM + WebGPU Chromium Spec)"
// L5: "type": "module"
// L6-L8: "bin":
// L7: "wck": "./src/cli.ts"
// L9-L14: "scripts":
// L10: "build": "bun build --compile src/cli.ts --outfile dist/wck"
// L11: "test": "bun test"
// L12: "check": "bun check"
// L13: "fmt": "bun fmt"
// L15: "dependencies":
// L16: "devDependencies":
// L17: "license": "MIT OR Apache-2.0"
// L18-L22: "repository":
// L19: "type": "git"
// L20: "url": "git+https://github.com/aphrody-labs/src.git"
// L21: "directory": "packages/wck"
// L23-L26: "publishConfig":
// L24: "access": "public"
// L25: "registry": "https://registry.npmjs.org/"


================================================
FILE: ai-os/src/core/index.ts
================================================
// [OUTLINE - 0 symbols, 62 lines]


================================================
FILE: ai-os/src/fabric/index.ts
================================================
// [OUTLINE - 32 symbols, 787 lines]
// import node:crypto
// import node:fs
// import node:os
// import node:path
// import ../orch/fleet
// import ../orch/health
// L23: type Asset =
// L24-L42: type FabricNode =
// L43-L61: type Fabric =
// L62-L68: type NodeState =
// L75-L81: function loadFabric(root = srcRoot()): Fabric
// L90-L108: function nodeEnv(f: Fabric, n: FabricNode): Record<string, string>
// L119-L131: function remoteLine(env: Record<string, string>, action: string)
// L133-L159: async function nodeSh(
// L162-L186: async function reachable(host: string, port: number, ms = 3000)
// L170-L174: open(s)
// L175-L178: error()
// L179: data()
// L206-L210: async function sha256File(p: string)
// L212-L242: async function ensureCoordinatorBin(f: Fabric): Promise<string>
// L244-L257: function modelPath(
// L261-L267: function tensorSplit(f: Fabric, admitted: string[]): number[]
// L270-L296: function coordinatorArgs(
// L298-L306: type State =
// L323-L333: async function waitHealthy(url: string, ms: number)
// L335-L341: async function stopCoordinator()
// L346-L353: type UpOpts =
// L364-L472: async function up(o: UpOpts =
// L478-L487: function trials(): any[]
// L490-L503: function takeLock(): boolean
// L506-L557: async function trial(id: string, root = srcRoot())
// L562-L615: async function ensure(root = srcRoot())
// L618-L644: function timer(remove = false, every = 10, root = srcRoot())
// L646-L688: async function status(root = srcRoot())
// L691-L703: async function warm(only?: string[], root = srcRoot())
// L705-L721: async function down(root = srcRoot())
// L724-L760: async function bench(prompt: string, n = 128, root = srcRoot())
// L763-L787: async function serveNode(id: string, root = srcRoot())


================================================
FILE: ai-os/src/gateway/index.ts
================================================
// [OUTLINE - 10 symbols, 368 lines]
// import node:crypto
// import ../core/agent
// import ../core/home
// import ../core/memory
// import ../llm/types
// L13-L18: type Inbound =
// L19-L27: interface Channel
// L32-L40: async parse(req)
// L41-L43: async reply(_m, text)
// L46-L66: type GatewayOptions =
// L68: class Busy extends Error
// L87-L97: function trimHistory(history: Message[], max: number)
// L99-L368: function createGateway(o: GatewayOptions)
// L305-L318: fetch(req, srv)
// L320-L352: async message(ws, raw)


================================================
FILE: ai-os/src/google/jules/index.ts
================================================
// [OUTLINE - 1 symbols, 137 lines]
// import ./client.js
// import ./storage/node-fs.js
// import ./platform/node.js
// import ./types.js
// import ./storage/root.js
// L42-L44: function connect(options: JulesOptions =


================================================
FILE: ai-os/src/google/stitch/generated/src/index.ts
================================================
// [OUTLINE - 0 symbols, 19 lines]


================================================
FILE: ai-os/src/google/stitch/src/index.ts
================================================
// [OUTLINE - 0 symbols, 75 lines]


================================================
FILE: ai-os/src/index.ts
================================================
// [OUTLINE - 0 symbols, 12 lines]


================================================
FILE: ai-os/src/llm/index.ts
================================================
// [OUTLINE - 0 symbols, 21 lines]


================================================
FILE: ai-os/src/nhitl/index.ts
================================================
// [OUTLINE - 17 symbols, 279 lines]
// import bun:sqlite
// import node:fs
// import node:path
// import ../orch/fleet
// L11: type Severity = "high" | "medium" | "low" | "info";
// L12: type Status = "open" | "fixed" | "inevitable";
// L13-L21: type Source =
// L23-L35: type Violation =
// L60-L63: function redact(text: string, max = 160): string
// L66-L74: function scrub(text: string): string
// L76-L279: class Index
// L78-L101: constructor(path = dbPath())
// L103-L111: stamp(unit: string): string | undefined
// L114-L121: idsOf(source: Source, unit: string): string[]
// L124-L173: replace(
// L176-L206: record(v: Violation)
// L208-L212: logScan(source: string, n: number, ms: number, error?: string)
// L214-L218: triage(id: string, status: Status, reason?: string)
// L221-L254: list(
// L256-L274: stats()
// L276-L278: close()


================================================
FILE: ai-os/src/research/index.ts
================================================
// [OUTLINE - 12 symbols, 309 lines]
// import ../llm/generate
// import ../llm/schema
// import ../llm/types
// import ../core/memory
// import ../core/secrets
// import node:fs
// import node:path
// import ./context7
// L14-L20: type Item =
// L21-L30: type Outline =
// L31: type Field =
// L32: type Fields =
// L37-L51: function researchEntries(topic: string, data: Record<string, unknown>)
// L60-L62: async function loadYaml<T>(path: string): Promise<T>
// L65-L93: function validate(
// L95-L110: function schemaFor(fields: Fields): JsonSchema
// L129-L144: type ResearchOptions =
// L146-L223: async function researchItem(
// L225-L282: async function research(o: ResearchOptions)
// L285-L300: async function validateDir(outlinePath: string, fieldsPath?: string)


================================================
FILE: ai-os/src/review/index.ts
================================================
// [OUTLINE - 33 symbols, 1207 lines]
// import node:fs
// import node:path
// import ../nhitl/index
// import ../orch/classify
// import ../orch/fleet
// import ../orch/health
// import ../orch/inline
// import ../orch/select
// import ../relay/outbound
// import ./sources
// L33-L42: type VoiceCfg =
// L43-L53: type Config =
// L70-L78: type Target =
// L87-L102: async function git(root: string, args: string[], allowFail = false)
// L117-L122: function inside(root: string, p: string): string
// L126-L265: async function collect(
// L271-L278: function parseScore(text: string): number | undefined
// L281-L285: function parseJudgeScore(text: string): number | undefined
// L287-L294: type Finding =
// L297-L320: function parseFindings(text: string): Finding[]
// L328-L335: function checklists(root = srcRoot()): Record<string, string>
// L337-L342: type Grounding =
// L344-L374: async function ground(
// L396-L418: function voicePrompt(
// L422-L429: type Attempt =
// L430-L436: type EngineAnswer =
// L438-L442: type Engine = (
// L446-L500: function cachedEngine(
// L503-L529: async function enginesFor(
// L531-L541: type VoiceResult =
// L543-L619: async function runVoice(
// L633-L634: type Status =
// L636-L681: function verdictMarkdown(o:
// L684-L708: function indexRow(o:
// L710-L720: function upsertIndex(
// L724-L746: function recordMissing(
// L750-L778: type ReviewOptions =
// L780-L787: type Fixer = (o:
// L789-L809: type ReviewResult =
// L844-L1126: async function review(o: ReviewOptions =
// L1129-L1154: async function advance(
// L1156-L1167: function commonDir(files: string[]): string
// L1172-L1207: function mine(root = srcRoot())


================================================
FILE: ai-os/src/tui/index.ts
================================================
// [OUTLINE - 4 symbols, 138 lines]
// import node:readline
// import node:util
// import @aphrody/design
// import ../core/agent
// import ../llm/types
// L9-L16: type TuiOptions =
// L24-L53: function renderMarkdown(md: string, color = true)
// L56-L90: async function handle(
// L92-L138: async function startTui(o: TuiOptions)


================================================
FILE: bun-parity/src/index.ts
================================================
// [OUTLINE - 0 symbols, 9 lines]


================================================
FILE: bun-parity/src/patcher/index.ts
================================================
// [OUTLINE - 1 symbols, 25 lines]
// import ../types.ts
// import ./preload-gen.ts
// import ./rust-gen.ts
// L9-L25: async function runFullAutoPatch(


================================================
FILE: bun-parity/src/polyfills/index.ts
================================================
// [OUTLINE - 2 symbols, 91 lines]
// import ./scheduler.ts
// import ./locks.ts
// import ./trusted-types.ts
// import ./cache-storage.ts
// import ./compression.ts
// import ./mime.ts
// import ./doh.ts
// L39-L46: interface ChromiumParityInstalled
// L48-L91: function installAllChromiumPolyfills(


================================================
FILE: bun-parity/src/recon/index.ts
================================================
// [OUTLINE - 1 symbols, 77 lines]
// import ../types.ts
// import ./html.ts
// import ./css.ts
// import ./js.ts
// import ./api.ts
// import ./texte.ts
// import ./data-assets.ts
// import ./dns.ts
// import ./tls.ts
// import ./stack.ts
// L16-L77: async function runFullParityScan(


================================================
FILE: bun-plugins/index.ts
================================================
// [OUTLINE - 0 symbols, 5 lines]


================================================
FILE: chromium-bun/src/engines/index.ts
================================================
// [OUTLINE - 0 symbols, 5 lines]


================================================
FILE: chromium-bun/src/index.ts
================================================
// [OUTLINE - 0 symbols, 17 lines]


================================================
FILE: chromium-bun/src/search/index.ts
================================================
// [OUTLINE - 0 symbols, 5 lines]


================================================
FILE: chromium-bun/src/webui_poc/index.ts
================================================
// [OUTLINE - 1 symbols, 9 lines]
// L7-L9: function initializeWebUI(): string


================================================
FILE: core/src/index.ts
================================================
// [OUTLINE - 0 symbols, 10 lines]


================================================
FILE: design/src/index.ts
================================================
// [OUTLINE - 3 symbols, 18 lines]
// import ../tokens/tokens.json
// L5: type Mode = keyof typeof tokens.color;
// L6: type Role = keyof typeof tokens.color.light;
// L13-L17: function ansi(name: Role, mode: Mode = "dark", bg = false): string


================================================
FILE: env-kit/loaders/rust/src/lib.rs
================================================
// [OUTLINE - 29 symbols, 431 lines]
// import std
// import std
// import std
// import std
// import std
// import std
// import super
// L21-L23: pub struct SecretString
// L27-L31: pub fn new(value: impl Into<String>) -> Self
// L35-L37: pub fn expose_secret(&self) -> &str
// L40-L42: pub fn len(&self) -> usize
// L45-L47: pub fn is_empty(&self) -> bool
// L51-L53: fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result
// L57-L59: fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result
// L63-L65: fn from(value: String) -> Self
// L69-L71: fn from(value: &str) -> Self
// L76-L83: pub struct LoadOptions<'a>
// L86-L93: pub enum EnvError
// L96-L110: fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result
// L116-L118: fn from(value: io::Error) -> Self
// L123-L126: pub struct SovereignEnv
// L129-L141: fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result
// L146-L148: pub fn env_path(&self) -> &Path
// L151-L153: pub fn get_secret(&self, key: &str) -> Option<&SecretString>
// L156-L161: pub fn get_exposed(&self, key: &str) -> Option<&str>
// L164-L177: pub fn masked_summary(&self) -> BTreeMap<String, String>
// L182-L210: pub fn is_secret_key(key: &str, value: &str) -> bool
// L214-L232: pub fn resolve_monorepo_env_path(start_dir: Option<&Path>) -> PathBuf
// L234-L243: fn is_valid_env_ident(key: &str) -> bool
// L247-L306: pub fn parse_dotenv(content: &str) -> BTreeMap<String, SecretString>
// L308-L316: fn strip_inline_comment(val: &str) -> &str
// L324-L381: pub fn load_monorepo_env(options: LoadOptions<'_>) -> Result<SovereignEnv, EnvError>
// L384-L431: mod tests
// L388-L408: fn parses_quotes_comments_and_escapes()
// L411-L416: fn redacts_secret_string_in_debug_and_display()
// L419-L430: fn sovereign_env_debug_never_leaks_secrets()


================================================
FILE: env-kit/src/index.ts
================================================
// [OUTLINE - 22 symbols, 556 lines]
// import node:fs
// import node:path
// L22-L35: interface LoadMonorepoEnvOptions
// L37: type RedactedEnvView = Readonly<Record<string, string>>;
// L39-L53: function isSecretKey(key: string, value = ""): boolean
// L55-L63: function maskValue(key: string, value: string | undefined): string
// L68-L90: function resolveMonorepoEnvPath(
// L95-L159: function parseDotEnv(content: string): Record<string, string>
// L164-L174: function formatEnvEntry(key: string, value: string): string
// L180-L201: function redactEnv(
// L203-L210: interface LoadedMonorepoEnv
// L221-L310: function loadMonorepoEnv(
// L278-L280: get(key: string): string | undefined
// L281-L288: require(key: string): string
// L289-L291: toJSON(): Record<string, string>
// L312-L317: interface ExportCloudflareDevVarsOptions
// L339-L385: function exportForCloudflareDevVars(
// L387-L392: interface VercelEnvPayloadItem
// L398-L450: function exportForVercelEnv(
// L443-L445: toDotEnvLocal(): string
// L446-L448: items(): VercelEnvPayloadItem[]
// L455-L492: function upsertEnvFileKey(
// L521-L528: interface EnvMergePlan
// L534-L554: function planEnvMerge(


================================================
FILE: gaming/src/index.ts
================================================
// [OUTLINE - 0 symbols, 9 lines]


================================================
FILE: google-design/index.ts
================================================
// [OUTLINE - 0 symbols, 16 lines]


================================================
FILE: google-design/src/assets/index.ts
================================================
// [OUTLINE - 5 symbols, 214 lines]
// import node:crypto
// import node:fs
// import node:path
// import ./brand-legal.ts
// import ./themes-stylesheets.ts
// import ./icons-sprites.ts
// import ./open-pets.ts
// import ./wallpapers.ts
// import ./models-3d.ts
// import ./audio-video.ts
// L17-L36: interface AssetManifestEntry
// L38-L52: interface AssetBankGenerationResult
// L54-L81: function getMimeType(ext: string): string
// L83-L103: function inferDimensionsOrDuration(relPosix: string): string | undefined
// L109-L204: function generateAssetBank(outDir: string): AssetBankGenerationResult


================================================
FILE: google-design/src/design-md/index.ts
================================================
// [OUTLINE - 0 symbols, 71 lines]


================================================
FILE: google-design/src/design-md/linter/rules/index.ts
================================================
// [OUTLINE - 1 symbols, 72 lines]
// import ./types.js
// import ../../model/spec.js
// import ../spec.js
// import ./broken-ref.js
// import ./missing-primary.js
// import ./contrast-ratio.js
// import ./orphaned-tokens.js
// import ./token-summary.js
// import ./missing-sections.js
// import ./section-order.js
// import ./missing-typography.js
// import ./unknown-key.js
// import ./token-like-ignored.js
// import ./omitted.js
// L46-L54: function toLintRule(descriptor: RuleDescriptor): LintRule


================================================
FILE: i18n/src/index.ts
================================================
// [OUTLINE - 0 symbols, 11 lines]
// import ../locales/en.json
// import ../locales/es.json
// import ../locales/fr.json
// import ../locales/ja.json
// import ../locales/zh-CN.json


================================================
FILE: runtime-adapter/src/index.ts
================================================
// [OUTLINE - 11 symbols, 141 lines]
// import ./cf
// import ./env
// import ./types
// L18: type Bindings = Record<string, unknown>;
// L20-L52: async function resolveCtx(
// L54-L68: async function cronRoute(
// L70-L72: interface ExecCtx
// L75-L93: function cloudflare(app: AppDef)
// L77-L80: async fetch(req: Request, b: Bindings, c: ExecCtx)
// L81-L91: async scheduled(ev:
// L96-L111: function vercel(app: AppDef)
// L98-L109: async fetch(req: Request)
// L117-L137: async function vps(app: AppDef, argv: string[] = Bun.argv)
// L139-L141: function defineApp(app: AppDef): AppDef


================================================
FILE: site/src/index.ts
================================================
// [OUTLINE - 0 symbols, 14 lines]


================================================
FILE: vault/native/src/lib.rs
================================================
// [OUTLINE - 9 symbols, 62 lines]
// import ayv1
// import envelope
// import local
// L13: pub mod ayv1;
// L14: pub mod capi;
// L15: pub mod envelope;
// L16: pub mod local;
// L18: pub mod win;
// L25-L31: pub enum Error
// L34-L42: fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result
// L48-L50: fn from(e: std::io::Error) -> Self
// L56-L62: pub fn valid_name(n: &str) -> bool


================================================
FILE: vault/src/index.ts
================================================
// [OUTLINE - 0 symbols, 33 lines]


================================================
FILE: wck/src/index.ts
================================================
// [OUTLINE - 0 symbols, 10 lines]


================================================
FILE: DEPS.rules
================================================
# checkdeps layer rules (see docs/ARCHITECTURE.md). Inherited by subdirectories.
layer = 3


================================================
FILE: ai-os/DEPS.rules
================================================
# checkdeps layer rules (see docs/ARCHITECTURE.md). Inherited by subdirectories.
layer = 4


================================================
FILE: ai-os/NOTICE
================================================
agent - Copyright (c) 2026 Aphrody contributors. Dual-licensed MIT OR Apache-2.0.

Portions derived from (all MIT, full texts in licenses/):
- OpenClaw  (c) 2026 OpenClaw Foundation   - fork aphrody-labs/openclaw
- Hermes Agent (c) 2025 Nous Research      - fork aphrody-labs/hermes-agent
- pi (c) 2025 Mario Zechner                - third_party/pi
- opencode (c) 2025 opencode               - third_party/opencode


================================================
FILE: ai-os/bench/retrieval.ts
================================================
// [OUTLINE - 6 symbols, 327 lines]
// import ../src/core/index
// import node:fs
// import node:os
// import node:path
// import ../src/research/index
// L39-L100: async function bench(embedder: Embedder = hashEmbedder())
// L114: type Q =
// L115-L123: type Cfg =
// L125-L141: async function evalCfg(ctx: Context, qs: Q[], c: Cfg)
// L156-L200: async function tune(embedder: Embedder = hashEmbedder())
// L212-L314: async function evalLarge(embedder: Embedder = hashEmbedder())


================================================
FILE: ai-os/bench/srcdocs.ts
================================================
// [OUTLINE - 2 symbols, 64 lines]
// import node:fs
// import node:path
// L7-L10: type EvalSet =
// L13-L55: async function buildSrcDocs(


================================================
FILE: ai-os/config/model-routing.json
================================================
// [OUTLINE - 259 symbols, 305 lines]
// L2: "fetched": "2026-11-13"
// L3: "currency": "USD per MTok"
// L4-L141: "tasks":
// L5-L19: "pre-commit":
// L6-L10: "primary":
// L7: "provider": "anthropic"
// L8: "model": "claude-haiku-5-5"
// L9: "thinking":
// L9: "effort": "low"
// L11-L17: "fallback": [
// L13: "provider": "google"
// L14: "model": "gemini-3.5-flash-lite"
// L15: "thinking":
// L15: "thinking_level": "minimal"
// L18: "estUsd": 0.001
// L20-L34: "ci-review":
// L21-L25: "primary":
// L22: "provider": "google"
// L23: "model": "gemini-4-hydrogen"
// L24: "thinking":
// L24: "thinking_level": "medium"
// L26-L32: "fallback": [
// L28: "provider": "anthropic"
// L29: "model": "claude-sonnet-5-5"
// L30: "thinking":
// L30: "effort": "medium"
// L33: "estUsd": 0.09
// L35-L49: "judge":
// L36-L40: "primary":
// L37: "provider": "google"
// L38: "model": "gemini-4-carbon"
// L39: "thinking":
// L39: "thinking_level": "high"
// L41-L47: "fallback": [
// L43: "provider": "anthropic"
// L44: "model": "claude-opus-5-5"
// L45: "thinking":
// L45: "effort": "high"
// L48: "estUsd": 0.19
// L50-L64: "test-gen":
// L51-L55: "primary":
// L52: "provider": "anthropic"
// L53: "model": "claude-sonnet-5-5"
// L54: "thinking":
// L54: "effort": "medium"
// L56-L62: "fallback": [
// L58: "provider": "google"
// L59: "model": "gemini-4-hydrogen"
// L60: "thinking":
// L60: "thinking_level": "medium"
// L63: "estUsd": 0.12
// L65-L79: "flaky-triage":
// L66-L70: "primary":
// L67: "provider": "anthropic"
// L68: "model": "claude-haiku-5-5"
// L69: "thinking":
// L69: "effort": "medium"
// L71-L77: "fallback": [
// L73: "provider": "google"
// L74: "model": "gemini-3.5-flash-lite"
// L75: "thinking":
// L75: "thinking_level": "low"
// L78: "estUsd": 0.004
// L80-L94: "replic":
// L81-L85: "primary":
// L82: "provider": "anthropic"
// L83: "model": "claude-sonnet-5-5"
// L84: "thinking":
// L84: "effort": "high"
// L86-L92: "fallback": [
// L88: "provider": "google"
// L89: "model": "gemini-4-hydrogen"
// L90: "thinking":
// L90: "thinking_level": "high"
// L93: "estUsd": 0.2
// L95-L109: "orchestration":
// L96-L100: "primary":
// L97: "provider": "anthropic"
// L98: "model": "claude-haiku-5-5"
// L99: "thinking":
// L99: "effort": "low"
// L101-L107: "fallback": [
// L103: "provider": "google"
// L104: "model": "gemini-3.5-flash-lite"
// L105: "thinking":
// L105: "thinking_level": "minimal"
// L108: "estUsd": 0.0005
// L110-L124: "repo-digest":
// L111-L115: "primary":
// L112: "provider": "anthropic"
// L113: "model": "claude-haiku-5-5"
// L114: "thinking":
// L114: "effort": "medium"
// L116-L122: "fallback": [
// L118: "provider": "google"
// L119: "model": "gemini-4-hydrogen"
// L120: "thinking":
// L120: "thinking_level": "low"
// L123: "estUsd": 0.17
// L125-L140: "batch":
// L126-L131: "primary":
// L127: "provider": "anthropic"
// L128: "model": "claude-haiku-5-5"
// L129: "thinking":
// L129: "effort": "low"
// L130: "mode": "batch+cache"
// L132-L139: "fallback": [
// L134: "provider": "google"
// L135: "model": "gemini-3.5-flash-lite"
// L136: "thinking":
// L136: "thinking_level": "minimal"
// L137: "mode": "batch"
// L142-L290: "prices":
// L143-L217: "anthropic":
// L144-L152: "claude-haiku-5-5":
// L145: "in": 0.1
// L146: "out": 0.5
// L147: "cacheHit": 0.01
// L148: "batchIn": 0.05
// L149: "batchOut": 0.25
// L150: "over100k":
// L150: "in": 0.5
// L150: "out": 2.5
// L150: "cacheHit": 0.05
// L151: "context": 1000000
// L153-L160: "claude-haiku-4-5":
// L154: "in": 1
// L155: "out": 5
// L156: "cacheHit": 0.1
// L157: "batchIn": 0.5
// L158: "batchOut": 2.5
// L159: "context": 200000
// L161-L168: "claude-sonnet-5-5":
// L162: "in": 2
// L163: "out": 10
// L164: "cacheHit": 0.1
// L165: "batchIn": 1
// L166: "batchOut": 5
// L167: "context": 1000000
// L169-L176: "claude-sonnet-5":
// L170: "in": 2
// L171: "out": 10
// L172: "cacheHit": 0.2
// L173: "batchIn": 1
// L174: "batchOut": 5
// L175: "context": 1000000
// L177-L184: "claude-sonnet-4-6":
// L178: "in": 3
// L179: "out": 15
// L180: "cacheHit": 0.3
// L181: "batchIn": 1.5
// L182: "batchOut": 7.5
// L183: "context": 1000000
// L185-L192: "claude-opus-5-5":
// L186: "in": 4
// L187: "out": 20
// L188: "cacheHit": 0.2
// L189: "batchIn": 2
// L190: "batchOut": 10
// L191: "context": 1000000
// L193-L200: "claude-opus-5":
// L194: "in": 5
// L195: "out": 25
// L196: "cacheHit": 0.5
// L197: "batchIn": 2.5
// L198: "batchOut": 12.5
// L199: "context": 1000000
// L201-L208: "claude-fable-5-2":
// L202: "in": 8
// L203: "out": 40
// L204: "cacheHit": 0.2
// L205: "batchIn": 4
// L206: "batchOut": 20
// L207: "context": 1000000
// L209-L216: "claude-fable-5-1":
// L210: "in": 10
// L211: "out": 50
// L212: "cacheHit": 0.25
// L213: "batchIn": 5
// L214: "batchOut": 25
// L215: "context": 1000000
// L218-L289: "google":
// L219-L225: "gemini-2.5-flash-lite":
// L220: "in": 0.1
// L221: "out": 0.4
// L222: "cache": 0.01
// L223: "batchIn": 0.05
// L224: "batchOut": 0.2
// L226-L232: "gemini-3.1-flash-lite":
// L227: "in": 0.25
// L228: "out": 1.5
// L229: "cache": 0.025
// L230: "batchIn": 0.125
// L231: "batchOut": 0.75
// L233-L239: "gemini-3.5-flash-lite":
// L234: "in": 0.3
// L235: "out": 2.5
// L236: "cache": 0.03
// L237: "batchIn": 0.15
// L238: "batchOut": 1.25
// L240-L246: "gemini-3-flash-preview":
// L241: "in": 0.5
// L242: "out": 3
// L243: "cache": 0.05
// L244: "batchIn": 0.25
// L245: "batchOut": 1.5
// L247-L254: "gemini-3.8-flash":
// L248: "in": 0.75
// L249: "out": 3.75
// L250: "cache": 0.075
// L251: "batchIn": 0.375
// L252: "batchOut": 1.875
// L253: "from2027-01-01":
// L253: "in": 1.5
// L253: "out": 7.5
// L255-L262: "gemini-4-hydrogen":
// L256: "in": 1.5
// L257: "out": 7.5
// L258: "cache": 0.075
// L259: "batchIn": 0.75
// L260: "batchOut": 3.75
// L261: "context": 1000000
// L263-L271: "gemini-4-argon":
// L264: "in": 2
// L265: "out": 10
// L266: "cache": 0.1
// L267: "batchIn": 1
// L268: "batchOut": 5
// L269: "context": 1000000
// L270: "from2026-12-01":
// L270: "in": 4
// L270: "out": 20
// L270: "cache": 0.2
// L272-L280: "gemini-4-carbon":
// L273: "in": 2
// L274: "out": 10
// L275: "cache": 0.1
// L276: "batchIn": 1
// L277: "batchOut": 5
// L278: "context": 1000000
// L279: "from2026-12-01":
// L279: "in": 4
// L279: "out": 20
// L279: "cache": 0.2
// L281-L288: "gemini-3.1-pro-preview":
// L282: "in": 2
// L283: "out": 12
// L284: "cache": 0.2
// L285: "batchIn": 1
// L286: "batchOut": 6
// L287: "over200k":
// L287: "in": 4
// L287: "out": 18
// L291-L296: "webPicker":
// L292: "Flash-Lite 3.5": "gemini-3.5-flash-lite"
// L293: "Hydrogen 4": "gemini-4-hydrogen"
// L294: "Argon 4": "gemini-4-argon"
// L295: "Carbon 4": "gemini-4-carbon"
// L297-L304: "sources": [


================================================
FILE: ai-os/config/review.json
================================================
// [OUTLINE - 134 symbols, 188 lines]
// L2: "$comment": "ai-os review (src/review, docs/reviews/README.md). Aucun modèle ni fournisseur ici : les voix ne déclarent que des familles de moteurs (expressions régulières sur les identifiants du registre : CLI d'agents + llm_models) et des classes de tâche de config/model-routing.json ; l'ordre réel vient de orch/select.ts (santé, refroidissements)."
// L3: "threshold": 16
// L4: "timeout_s": 420
// L5: "max_bytes": 120000
// L6: "grounding_chars": 24000
// L7: "rounds": 4
// L8: "stale_rounds": 2
// L9-L29: "voices":
// L10-L15: "gemini":
// L11: "label": "Gemini"
// L12: "stance": "voix Google : Chromium (styleguide, depot_tools, gn), Google eng-practices, guides de style Google, Python, Go, Android, ChromiumOS, Bazel. Tu défends les pratiques Google et tu cites la règle officielle qui fonde chaque grief."
// L13: "tasks": ["ci-review", "judge"]
// L14: "only": ["^agy(:|$)", "gemini", "gemma"]
// L16-L21: "claude":
// L17: "label": "Claude"
// L18: "stance": "voix Rust et bun : sûreté mémoire, types, erreurs explicites, bun natif (aucun outil que bun remplace), tests bun, windows-rs. Tu défends Rust et bun et tu vérifies chaque affirmation dans le diff."
// L19: "tasks": ["ci-review", "judge"]
// L20: "only": ["^claude(:|$)", "anthropic", "claude"]
// L22-L28: "judge":
// L23: "label": "Juge"
// L24: "stance": "juge neutre C, C++, assembleur et natif, hostile au code et jamais aux personnes. Tu contre-vérifies chaque grief des deux voix dans le diff, tu corriges l'accusation comme les plaideurs, et ta décision prime."
// L25: "tasks": ["judge"]
// L26: "prefer": ["^claude(:|$)", "^codex(:|$)"]
// L27: "after": ["gemini", "claude"]
// L30-L47: "topics":
// L31: "bun-ts": "\\.(ts|tsx|js|mjs|cjs)$|(^|/)(package\\.json|bunfig\\.toml|bun\\.lock)$"
// L32: "rust": "\\.rs$|(^|/)Cargo\\.(toml|lock)$|rust-toolchain"
// L33: "cpp": "\\.(c|cc|cpp|cxx|h|hh|hpp|ixx|cppm|asm|S)$"
// L34: "python": "\\.py$"
// L35: "go": "\\.go$|(^|/)go\\.(mod|sum)$"
// L36: "shell-justfile": "\\.(sh|bash|ps1)$|(^|/)justfile$"
// L37: "ci": "^\\.github/workflows/"
// L38: "infra-fleet": "^infra/|docs/infra/"
// L39: "cloudflare": "cloudflare|wrangler\\.(toml|jsonc?)$"
// L40: "security": "auth|oauth|token|secret|vault|crypto|tls|gateway|relay/"
// L41: "nhitl-agents": "agents?|nhitl|orch/|relay/|\\.claude/|AGENTS\\.md|CLAUDE\\.md"
// L42: "docs-facts": "\\.md$"
// L43: "chromium-google": "chromium|depot_tools|\\.gn$|\\.gni$|DEPS$|PRESUBMIT"
// L44: "bazel": "(^|/)(BUILD|BUILD\\.bazel|WORKSPACE|MODULE\\.bazel)$|\\.bzl$"
// L45: "android": "android|Android\\.bp$|\\.kt$|\\.kts$"
// L46: "chromiumos": "chromiumos|ebuild$"
// L48-L187: "sources": [
// L50: "id": "eng-practices-looking-for"
// L51: "topics": ["*"]
// L52: "github": "google/eng-practices"
// L53: "path": "review/reviewer/looking-for.md"
// L56: "id": "eng-practices-standard"
// L57: "topics": ["*"]
// L58: "github": "google/eng-practices"
// L59: "path": "review/reviewer/standard.md"
// L62: "id": "eng-practices-small-cls"
// L63: "topics": ["*"]
// L64: "github": "google/eng-practices"
// L65: "path": "review/developer/small-cls.md"
// L68: "id": "chromium-code-reviews"
// L69: "topics": ["chromium-google", "cpp", "ci"]
// L70: "github": "chromium/chromium"
// L71: "path": "docs/code_reviews.md"
// L74: "id": "chromium-cpp-style"
// L75: "topics": ["cpp", "chromium-google"]
// L76: "github": "chromium/chromium"
// L77: "path": "styleguide/c++/c++.md"
// L80: "id": "chromium-cpp-dos-donts"
// L81: "topics": ["cpp"]
// L82: "github": "chromium/chromium"
// L83: "path": "styleguide/c++/c++-dos-and-donts.md"
// L86: "id": "chromium-python-style"
// L87: "topics": ["python", "chromium-google"]
// L88: "github": "chromium/chromium"
// L89: "path": "styleguide/python/python.md"
// L92: "id": "chromium-web-style"
// L93: "topics": ["bun-ts"]
// L94: "github": "chromium/chromium"
// L95: "path": "styleguide/web/web.md"
// L98: "id": "chromium-rule-of-2"
// L99: "topics": ["security", "cpp", "rust"]
// L100: "github": "chromium/chromium"
// L101: "path": "docs/security/rule-of-2.md"
// L104: "id": "google-ts-style"
// L105: "topics": ["bun-ts"]
// L106: "github": "google/styleguide"
// L107: "path": "tsguide.md"
// L110: "id": "google-cpp-style"
// L111: "topics": ["cpp"]
// L112: "github": "google/styleguide"
// L113: "path": "cppguide.md"
// L116: "id": "google-rust-style"
// L117: "topics": ["rust"]
// L118: "github": "google/styleguide"
// L119: "path": "rustguide.md"
// L122: "id": "google-shell-style"
// L123: "topics": ["shell-justfile", "ci"]
// L124: "github": "google/styleguide"
// L125: "path": "shellguide.md"
// L128: "id": "google-python-style"
// L129: "topics": ["python"]
// L130: "github": "google/styleguide"
// L131: "path": "pyguide.md"
// L134: "id": "google-go-best-practices"
// L135: "topics": ["go"]
// L136: "github": "google/styleguide"
// L137: "path": "go/best-practices.md"
// L140: "id": "google-markdown-style"
// L141: "topics": ["docs-facts"]
// L142: "github": "google/styleguide"
// L143: "path": "docguide/style.md"
// L146: "id": "depot-tools-readme"
// L147: "topics": ["chromium-google"]
// L148: "gitiles": "https://chromium.googlesource.com/chromium/tools/depot_tools"
// L149: "path": "README.md"
// L152: "id": "depot-tools-git-cl"
// L153: "topics": ["chromium-google", "ci"]
// L154: "gitiles": "https://chromium.googlesource.com/chromium/tools/depot_tools"
// L155: "path": "README.git-cl.md"
// L158: "id": "chromiumos-shell-style"
// L159: "topics": ["chromiumos", "shell-justfile"]
// L160: "gitiles": "https://chromium.googlesource.com/chromiumos/docs"
// L161: "path": "styleguide/shell.md"
// L164: "id": "chromiumos-python-style"
// L165: "topics": ["chromiumos"]
// L166: "gitiles": "https://chromium.googlesource.com/chromiumos/docs"
// L167: "path": "styleguide/python.md"
// L170: "id": "android-soong"
// L171: "topics": ["android"]
// L172: "gitiles": "https://android.googlesource.com/platform/build/soong"
// L173: "path": "README.md"
// L176: "id": "bazel-bzl-style"
// L177: "topics": ["bazel"]
// L178: "github": "bazelbuild/bazel"
// L179: "path": "docs/rules/bzl-style.mdx"
// L182: "id": "bazel-build-style"
// L183: "topics": ["bazel"]
// L184: "github": "bazelbuild/bazel"
// L185: "path": "docs/build/style-guide.mdx"


================================================
FILE: ai-os/docs/BRAIN.md
================================================
# ai-os brain

One brain for Claude Code and agy (Antigravity CLI), owned by `@aphrody/ai-os`.

## Commands

- `ai-os brain absorb [--days N] [--dry-run]`: indexes into `~/.agent/memory.sqlite` (Context store, FTS5 + embeddings)
  every Claude memory file, prompt history per project, one digest per Claude session transcript, and agy conversation
  summaries plus user turns (`~/.gemini/antigravity*/conversation_summaries.db`). Files older than N days in
  `~/.claude/{projects,file-history,paste-cache,backups,shell-snapshots}` and `~/.gemini/antigravity-cli/{brain,conversations}`
  are zstd level 19 compressed (`Bun.zstdCompressSync`) into `~/.agent/brain.sqlite` and removed from disk.
- `ai-os brain sync`: writes the global `~/.claude/CLAUDE.md` and the memory index into a managed block of
  `~/.gemini/GEMINI.md`, sets Claude `permissions.defaultMode = bypassPermissions` and agy
  `toolPermission = artifactReviewPolicy = always-proceed`, prunes agy `trustedWorkspaces` to existing paths.
- `ai-os brain restore <path>`: writes compressed files back to their original location.

## State on 2026-11-13

- Indexed: 91 memories, 5 project histories, 305 Claude sessions, 496 agy conversations.
- Packed: 28,764 files, 1.59 GB to 529 MB. Files touched in the last 24 h stay on disk so live sessions can resume.
- Verified headless without approval: `agy -p ... --output-format json` and `claude -p ... --output-format json` both
  ran a shell write and returned success.
- agy config facts and sources: `docs/cli-reference/agy.md`; Claude Code: `docs/cli-reference/claude-code.md`.

## Session summary (2026-11-13, consolidation of the agent context)

- Goal: one brain and one no-human-in-the-loop setup for Claude Code and agy, owned by ai-os, with compressed storage.
- Done: `ai-os brain` (absorb, sync, restore), unit tests `test/brain.test.ts`; `~/.claude/projects` 426 MB to 112 MB
  (remaining files are the live sessions touched in the last 15 min); `~/.gemini/antigravity-cli/brain` 1.3 GB to 106 MB;
  blob store 616 MB with byte-verified packing.
- agy facts applied (sources in `docs/cli-reference/agy.md`): settings in `~/.gemini/antigravity-cli/settings.json`,
  `toolPermission` and `artifactReviewPolicy` = `always-proceed`, hooks in `~/.gemini/config/hooks.json`, MCP in
  `~/.gemini/config/mcp_config.json` (legacy copy merged), `trustedWorkspaces` 70 to 23 entries.
- Claude facts applied (`docs/cli-reference/claude-code.md`): `AGENTS.md` is only loaded without a `CLAUDE.md`, so
  `C:\src\CLAUDE.md` now imports `@AGENTS.md` and `@.agents/SOUL.md`.
- Context compaction: memories 47 to 36 (duplicates of the global CLAUDE.md removed, fleet contradictions merged into
  `fleet-roles`), GEMINI.md 15 KB to 8 KB (legacy directives replaced by a pointer to AGENTS.md plus the synced block),
  project CLAUDE.md fleet roles aligned with the global rule (fr1 = builds, CI, training, heavy agents).
- Verified: `claude -p` and `agy -p` each ran a shell write headless with no approval prompt.
- Reviews: relay Gemini 8/20 then 13/20, fixes applied; third pass on gemini.google.com Carbon High returned an empty answer twice, see
  `docs/reviews/brain-gemini-2026-11-13.md`.
- agy hooks: both hooks.json files carried a UTF-8 BOM and were silently ignored (a test write reached System32). BOM removed, matcher updated to current tool names (run_command, write_to_file, replace_file_content, multi_replace_file_content); a probe hook captured the real PreToolUse payload and pre-tool-guard denies a System32 write with it. MCP: `agy mcp list` shows ai-os and hostinger, and a headless call to an ai-os tool succeeded.


================================================
FILE: ai-os/docs/FUSION.md
================================================
# Fusion: OpenClaw + Hermes ecosystems -> aphrody-labs/agent

Listed 2026-11-12 with `gh api orgs/openclaw/repos` (non-archived) and `gh api orgs/NousResearch/repos` (agent-related).
Forks: aphrody-labs/openclaw and aphrody-labs/hermes-agent (branch `windows-native`, see C:\src\docs\agents\WINDOWS-NATIVE-PORT.md, 16eea3d).
Status: done / partial / todo / skip (out of scope: macOS/Apple-only, org ops, forks of upstream tools we already fork).

## Rules

- OpenClaw (TS): moved to bun only (bun install/test/build, Bun.serve, Bun.$, bun:sqlite, bun:ffi, Bun.file, workers). Remove pnpm/node/tsx/vitest/esbuild, polyfills and utils that bun or `src/core` already provide.
- Hermes (Python): stays under uv (`python/`). Python reaches the Rust core through pyo3 (`crates/agent-py`) and the TS side through the relay (MCP over stdio or HTTP, `packages/ai-os/docs/RELAY.md`). bun:ffi only loads C ABI libraries into bun; Python never goes through it. Logic that duplicates OpenClaw goes into the shared TS modules.
- Home: one `~/.agent` (`agent init`), templates merged from OpenClaw workspace templates and Hermes SOUL.

## Core

| Repo                                                                                        | Target module                                                | Status                                                                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| openclaw/openclaw (agent loop, tools, memory, sessions)                                     | packages/core (all reads through core/context.ts)            | partial (loop, tools, memory, skills, heartbeat, home, context)                            |
| openclaw/openclaw (gateway, channels, plugins SDK)                                          | src/gateway, packages/plugins                                | todo                                                                                       |
| openclaw/openclaw docs/reference/templates                                                  | templates/home                                               | done                                                                                       |
| NousResearch/hermes-agent agent/, tools/ (memory, skills, learning loop, cron, compression) | packages/core + python/hermes_agent_memory (pyo3 agent_core) | partial (skill lint/usage/curation, cron, memory provider on the shared store, skills hub) |
| NousResearch/hermes-agent acp_adapter                                                       | src/gateway (ACP)                                            | todo                                                                                       |
| NousResearch/hermes-agent SOUL / persona                                                    | templates/home/SOUL.md                                       | done                                                                                       |
| openclaw/openclaw-windows-node, openclaw-windows-packaging (C#)                             | crates/windows (windows-rs) + MSIX in packaging/             | todo                                                                                       |
| openclaw/ocm (Rust manager)                                                                 | crates/ocm                                                   | todo                                                                                       |

## Skills, plugins, registry

| Repo                                                                                              | Target                                                                                                                    | Status |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------ |
| openclaw/clawhub (skill + plugin registry)                                                        | packages/hub (client); the server runs on Bun.serve (prd), not Workers (bun:sqlite, Bun.$ and bun:ffi do not exist there) | todo   |
| openclaw/agent-skills                                                                             | skills/ (bundled)                                                                                                         | todo   |
| openclaw/clawscan (skill security scan, Go)                                                       | packages/hub scan (TS port)                                                                                               | todo   |
| openclaw/babelfish (plugins from other agent apps)                                                | packages/plugins compat                                                                                                   | todo   |
| openclaw/catalog (model catalog)                                                                  | packages/core model catalog                                                                                               | todo   |
| openclaw/kitchen-sink, plugin-inspector, crabpot, tidepool                                        | packages/plugins test fixtures                                                                                            | todo   |
| NousResearch/hermes-official-plugins, hermes-labs-plugins, hermes-example-plugins                 | python/plugins + plugin bridge                                                                                            | todo   |
| NousResearch/hermes-plugin-{honcho,mem0,openviking,supermemory,retaindb,byterover}                | memory provider interface in core                                                                                         | todo   |
| NousResearch/hermes-plugin-{backsearch,sprites,solstice}, hermes-nvidia, hermes-collective-wisdom | plugins                                                                                                                   | todo   |
| NousResearch/hermes-agent-self-evolution                                                          | core learning loop                                                                                                        | todo   |

## Protocols, tools, runtime libs

| Repo                                                                                    | Target                                    | Status  |
| --------------------------------------------------------------------------------------- | ----------------------------------------- | ------- |
| openclaw/acpx (ACP client)                                                              | src/gateway ACP                           | todo    |
| openclaw/mcporter (MCP as TS API)                                                       | src/relay (MCP) client                    | todo    |
| openclaw/turnwire (MCP relay, Go)                                                       | src/relay (MCP) relay                     | todo    |
| openclaw/lobster (workflow shell)                                                       | packages/core workflows (Vercel Workflow) | todo    |
| openclaw/libterminal                                                                    | src/tui                                   | todo    |
| openclaw/fs-safe, proc-safe, proxyline                                                  | core sandbox/fs (bun-native)              | todo    |
| openclaw/clawrouter (provider router)                                                   | core/model.ts + AI Gateway                | partial |
| openclaw/clawpdf, ffmpeg-wasm, libopus-wasm, rastermill                                 | packages/media                            | todo    |
| openclaw/carapace (design tokens)                                                       | apps/web                                  | todo    |
| openclaw/collab, cookbook, uirouter, reef, hermit, krillswitch, crabhelm, openclaw-atif | evaluate per repo                         | todo    |

## Channels and crawlers

| Repo                                                                                                                                    | Target                                                              | Status |
| --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------ |
| openclaw/wacli, wacrawl, telecrawl, slacrawl, discrawl, imsgcrawl, notcrawl, graincrawl, photoscrawl, gitcrawl, birdclaw, crawlkit (Go) | src/gateway channels via Chat SDK + packages/crawl (TS, bun:sqlite) | todo   |
| openclaw/crabline (mock channel server)                                                                                                 | gateway tests                                                       | todo   |
| openclaw/clickclack, clawdex, clawgo, esp-openclaw-node (C)                                                                             | evaluate (esp node -> firmware/)                                    | todo   |
| openclaw/gogcli, goplaces, spogo, remindctl                                                                                             | tools via MCP                                                       | todo   |

## Eval, ops

| Repo                                                                                                                                                                                                          | Target                                | Status |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------ |
| openclaw/Kova, clawgrit-reports, openclaw-rtt                                                                                                                                                                 | bench/                                | todo   |
| NousResearch/hermes-toolperf-evals, hermes-compression-eval, harbor-fork                                                                                                                                      | evals/                                | todo   |
| openclaw/crabbox, crabfleet, clawpatch, clawsweeper* , octopool, releases, release-workflows, telemetry, docs, ask-molty, community, rfcs, homebrew-tap, nix-openclaw*, openclaw-ansible, openclaw-enterprise | skip or infra/ later                  | skip   |
| openclaw/bun, WebKit                                                                                                                                                                                          | already forked (aphrody-labs/bun)     | skip   |
| openclaw/Peekaboo, AXorcist, Swabble, Tachikoma, imsg, crawlbar, openclaw-facetime                                                                                                                            | macOS-only                            | skip   |
| NousResearch/NemoClaw (OpenClaw in NVIDIA OpenShell)                                                                                                                                                          | sandbox backend                       | todo   |
| NousResearch/RL, tinker-atropos, vllm, lighteval, Hermes-Function-Calling                                                                                                                                     | inference/training, out of agent core | skip   |
| NousResearch/autonovel, pokemon-agent, cline, nousflash-agents, local_generative_agents, agent-governance-toolkit, hermes-paperclip-adapter                                                                   | examples / evaluate                   | skip   |

## OpenClaw bun-native status (2026-11-12, fork branch `bun-native`, 52bfe78ce)

- `bun pm migrate` rejects the pnpm 12 lockfile (two YAML documents; then NonExistentWorkspaceDependency, oven-sh/bun#23026, although every link target exists). Fallback in `scripts/bun-migrate.ts`: workspaces/overrides/patches/trusted deps go from pnpm-workspace.yaml into package.json; the 1331 packages pnpm resolved to a single version are pinned as overrides; nested `a>b` overrides are dropped (bun overrides are global).
- `bun install` on prd: OK (1701 installs) with `bunfig.toml` `[run] bun = true` (node -> bun) and the preinstall guard accepting Bun 1.4.4+.
- `bun run build` on prd: blocked. TypeScript 7 native API (`typescript/sync`, SyncRpcChannel) reads `child.stdout._handle.fd`, a Node internal Bun does not expose. Options: patch typescript (patchedDependencies) to use a FIFO on POSIX like its Windows named-pipe path, or add `_handle.fd` to Bun's child_process in aphrody-labs/bun.
- Not started: replacing tsx/vitest/esbuild per package.


================================================
FILE: ai-os/docs/LEGACY-INVENTORY.md
================================================
# Legacy AI inventory (src @ 5525822)

Lines = .ts/.rs/.py/.zig. Imported with `git archive HEAD packages/<name>` into `legacy/<name>`; deleted from src.

| Package          | Files | Lines | Content                                                                                           |
| ---------------- | ----- | ----- | ------------------------------------------------------------------------------------------------- |
| ai-os            | 75    | 20231 | control plane, providers, MCP/A2A/ACP, sentinel, extractor, bun:ffi bus, triad copy, sqlite state |
| knowledge-engine | 18    | 5561  | context7 client, deep research, fact-check, docs/skills generators, MCP stdio                     |
| ai-triad         | 22    | 3793  | codex/agy/gemini/claude runners, OAuth device flow, gateway, TUI                                  |
| agy              | 13    | 3079  | Antigravity CLI glue, gemma lab, notebook, web app, rust-desktop                                  |
| pi-opencode      | 17    | 2159  | pi core tools, opencode UI, NHITL loop, provider                                                  |
| brain            | 6     | 588   | session merge                                                                                     |
| total            | 151   | 35411 |                                                                                                   |

## Duplicates found

- `runAgent`, `routeTask`, `runCouncil`: ai-os/src/triad and ai-triad/src/runners (same council logic twice).
- `redactSecret(s)FromText`, `parseDotEnv`: ai-os/src/env.ts, ai-os/nexus/security.ts, knowledge-engine/env/safe-env.ts.
- `runCliSubprocess`, `resolveCodexExecutable`, `resolveBinaryCatalog`: ai-triad/discovery.ts and ai-os/extracted.
- MCP servers: ai-os/protocols/mcp.ts, ai-os/nexus/unified-mcp.ts, knowledge-engine/mcp/stdio.ts, ai-triad/server/gateway.ts (4 implementations).
- Provider layers: ai-os/providers, pi-opencode/lu-provider.ts, ai-triad runners (replaced by `src/core/model.ts`).
- Memory: brain, ai-os/nexus/brain-memory.ts (replaced by `src/core/memory.ts`).

## Absorbed (2026-11-12)

- MCP x4 -> `src/relay` (MCP) (official SDK, stdio). Removed: ai-os protocols/mcp.ts, nexus/unified-mcp.ts, knowledge-engine src/mcp, ai-triad server.
- Council x2 -> `src/core/council.ts` (`council`, `route`, `ask`). Removed: ai-os src/triad, ai-triad.
- Redactors x3 -> `src/core/secrets.ts`. Copies left inside ai-os/env.ts, nexus/security.ts and knowledge-engine/env go when those packages are dissolved.
- brain -> core memory; pi-opencode (pi tools, provider) -> core tools + model.ts. Both removed.
- Remaining legacy: ai-os, knowledge-engine, agy (23 639 lines). Their entry points still import the removed files and do not run; legacy is not built.

## Dissolved (2026-11-12, legacy/ deleted)

- knowledge-engine: context7 client -> research/context7.ts (docs_search, docs_fetch tools); fact-check -> research/factcheck.ts; deep research -> research pipeline; MCP -> src/relay (MCP); redactor -> core/secrets.ts.
- ai-os: providers/federation -> core/model.ts; brain-memory -> core/memory.ts; skills-hub -> core/skills hub; protocols a2a/acp -> gateway (roadmap); triad -> core/council.ts.
- Dropped (no consumer, or replaced by vendor SDKs): ai-os extractor, system1 trainer/decisional engine, sentinel, posix/nix/wasm-webgpu, bun:ffi desktop bus (windows-rs crate planned), benchmark arena, rosegriffon ops; knowledge-engine docs/skills generators, kernel crawler, agy session auditor; agy (Antigravity CLI glue, gemma lab, notebook, finops, web app, rust-desktop).
- Source remains in git history: aphrody-labs/src@5525822 packages/_, aphrody-labs/agent@efa63bb legacy/_.


================================================
FILE: ai-os/docs/MODEL_ROUTING.md
================================================
# Model routing

Fetched 2026-11-13. Prices in USD per million tokens (MTok), standard tier, global routing.

Sources:

- [A1] https://platform.claude.com/docs/en/about-claude/pricing
- [A2] claude-api skill model table (cached 2026-11-03; matches A1 on every listed price)
- [G1] https://aistudio.google.com/docs/pricing (redirect target of ai.google.dev/gemini-api/docs/pricing)
- [G2] https://aistudio.google.com/docs/models
- [G3] https://aistudio.google.com/docs/thinking
- [L1] relay `llm_models` (antigravity, claude providers), `claude --help`, `agy --help`

## Claude (Anthropic API), ranked by output price

| Model id                           | In    | Out   | Cache hit   | Batch in/out | Context | Thinking                                                        | Source |
| ---------------------------------- | ----- | ----- | ----------- | ------------ | ------- | --------------------------------------------------------------- | ------ |
| claude-haiku-5-5 (<=100k prompt)   | 0.10  | 0.50  | 0.01        | 0.05 / 0.25  | 1M      | adaptive, effort low..max, default medium                       | A1, A2 |
| claude-haiku-5-5 (>100k prompt)    | 0.50  | 2.50  | 0.05        | 0.25 / 1.25  | 1M      | same                                                            | A1     |
| claude-haiku-4-5                   | 1.00  | 5.00  | 0.10        | 0.50 / 2.50  | 200K    | budget_tokens                                                   | A1, A2 |
| claude-sonnet-5-5                  | 2.00  | 10.00 | 0.10        | 1.00 / 5.00  | 1M      | adaptive, effort low..max (default high); `between_tools` = off | A1, A2 |
| claude-sonnet-5                    | 2.00  | 10.00 | 0.20        | 1.00 / 5.00  | 1M      | adaptive, effort low..max                                       | A1     |
| claude-sonnet-4-6                  | 3.00  | 15.00 | 0.30        | 1.50 / 7.50  | 1M      | adaptive, effort low..max (no xhigh)                            | A1     |
| claude-opus-5-5                    | 4.00  | 20.00 | 0.20        | 2.00 / 10.00 | 1M      | always on, effort low..max, default medium                      | A1, A2 |
| claude-opus-5 / 4-8 / 4-7 / 4-6    | 5.00  | 25.00 | 0.50        | 2.50 / 12.50 | 1M      | adaptive                                                        | A1     |
| claude-fable-5-2 (Mythos 5.2 same) | 8.00  | 40.00 | 0.20        | 4.00 / 20.00 | 1M      | always on, effort low..max                                      | A1, A2 |
| claude-fable-5-1 / fable-5         | 10.00 | 50.00 | 0.25 / 1.00 | 5.00 / 25.00 | 1M      | always on                                                       | A1     |

Cache writes: 1.25x base (5 min TTL), 2x base (1 h). Batch = 50 % off in and out; stacks with caching. US-only `inference_geo` = 1.1x. Fast mode: Opus 5.5 8/40, Fable 5.2 16/80, not with batch. Thinking tokens bill as output. (A1)

## Gemini (Gemini API / AI Studio), ranked by output price

| Model id               | In                          | Out           | Cache       | Batch in/out               | Context    | thinking_level (default) | Source     |
| ---------------------- | --------------------------- | ------------- | ----------- | -------------------------- | ---------- | ------------------------ | ---------- |
| gemini-2.5-flash-lite  | 0.10                        | 0.40          | 0.01        | 0.05 / 0.20                | not stated | low/medium/high (off)    | G1, G2, G3 |
| gemini-3.1-flash-lite  | 0.25                        | 1.50          | 0.025       | 0.125 / 0.75               | not stated | minimal..high (minimal)  | G1, G3     |
| gemini-3.5-flash-lite  | 0.30                        | 2.50          | 0.03        | 0.15 / 1.25                | not stated | minimal..high (minimal)  | G1, G3     |
| gemini-3-flash-preview | 0.50                        | 3.00          | 0.05        | 0.25 / 1.50                | not stated | minimal..high (high)     | G1, G3     |
| gemini-3.8-flash       | 0.75 (1.50 from 2027-01-01) | 3.75 (7.50)   | 0.075       | 0.375 / 1.875              | not stated | low..high (medium)       | G1, G3     |
| gemini-3.6-flash       | 0.75 (1.50)                 | 3.75 (7.50)   | 0.075       | 0.375 / 1.875              | not stated | minimal..high (medium)   | G1, G3     |
| gemini-4-hydrogen      | 1.50                        | 7.50          | 0.075       | 0.75 / 3.75                | 1M         | low..xhigh (high)        | G1, G2, G3 |
| gemini-4-argon         | 2.00 (4.00 from 2026-12-01) | 10.00 (20.00) | 0.10 (0.20) | 1.00 / 5.00 (2.00 / 10.00) | 1M         | low..high (medium)       | G1, G2, G3 |
| gemini-4-carbon        | 2.00 (4.00 from 2026-12-01) | 10.00 (20.00) | 0.10 (0.20) | 1.00 / 5.00 (2.00 / 10.00) | 1M         | low..high (medium)       | G1, G2, G3 |
| gemini-3.1-pro-preview | 2.00 / 4.00 >200k           | 12.00 / 18.00 | 0.20 / 0.40 | 1.00 / 6.00                | not stated | low..high (high)         | G1, G3     |

Thinking tokens bill as output; `max_output_tokens` covers thinking + answer. G3 documents only `thinking_level` (no `thinkingBudget`); `minimal` is not available on Gemini 4 or 3.8 Flash. Free tier exists for Hydrogen and Flash/Flash-Lite, not Carbon/Argon. (G1, G3)

Web picker mapping (confirmed by G2): Flash-Lite 3.5 = `gemini-3.5-flash-lite`, Hydrogen 4 = `gemini-4-hydrogen`, Argon 4 = `gemini-4-argon`, Carbon 4 = `gemini-4-carbon` (strongest reasoning).

## Reachable locally (L1)

- antigravity (`agy`): gemini-4-{carbon,argon}-{low,medium,high}, gemini-4-hydrogen-{low,medium,high,xhigh}, gemini-3.8-flash-{low,medium,high}, claude-opus-5-5-{low,medium,high}, claude-sonnet-5-5-{low,medium,high}, gpt-oss-120b-medium. No Flash-Lite, no Haiku.
- claude CLI: `--model`, `--effort low|medium|high|xhigh|max`, `--fallback-model`; relay exposes only `claude/default`.
- Also present: ollama gemma4:e2b, fabric qwen3-0.6b, ~40 Cloudflare Workers AI models (not ranked here).

## Conflicts and caveats

- Gemini 4 Carbon/Argon prices double on 2026-12-01; Gemini 3.8/3.6 Flash double on 2027-01-01 (G1). Recheck routing then: after 2026-12-01 Carbon High costs as much as Opus 5.5 per output token.
- Haiku 5.5 (0.10/0.50) is cheaper than every Gemini Flash-Lite except 2.5 Flash-Lite, but its price jumps 5x above 100k prompt tokens (A1).
- G2 states no context window for Flash/Flash-Lite models; long-context routes use only models with a stated 1M window.
- Haiku 5.5 and Gemini Flash-Lite are not reachable via `agy`; they need direct API keys (`llm_ask` providers or SDK).
- Haiku 5.5 has no server-side refusal fallback (A2); fallback is handled by our router.
- `gemini-2.5-flash` / `-pro` are deprecated and reroute on 2026-12-01 (G2); not used.

## Per-task routing

Cost estimates use standard prices above (pre-2026-12-01), thinking counted as output.

| Task                                        | Typical call                        | Primary                                      | Est. cost                 | Fallback                         | Est. cost      |
| ------------------------------------------- | ----------------------------------- | -------------------------------------------- | ------------------------- | -------------------------------- | -------------- |
| pre-commit (small diff lint review)         | 5k in / 1k out                      | claude-haiku-5-5, effort low                 | $0.001                    | gemini-3.5-flash-lite, minimal   | $0.004         |
| CI PR review                                | 40k in / 4k out                     | gemini-4-hydrogen, medium                    | $0.09                     | claude-sonnet-5-5, effort medium | $0.12          |
| validation / judge /20                      | 30k in / 13k out                    | gemini-4-carbon, high (policy)               | $0.19 ($0.38 after 12-01) | claude-opus-5-5, effort high     | $0.38          |
| test generation                             | 20k in / 8k out                     | claude-sonnet-5-5, effort medium             | $0.12                     | gemini-4-hydrogen, medium        | $0.09          |
| flaky-test triage                           | 30k in / 2k out                     | claude-haiku-5-5, effort medium              | $0.004                    | gemini-3.5-flash-lite, low       | $0.014         |
| replic (re-run + minimise failure, agentic) | 50k in / 10k out per turn           | claude-sonnet-5-5, effort high               | $0.20                     | gemini-4-hydrogen, high          | $0.15          |
| orchestration / routing                     | 3k in / 0.3k out                    | claude-haiku-5-5, effort low                 | $0.0005                   | gemini-3.5-flash-lite, minimal   | $0.002         |
| long-context repo digest                    | 300k in / 8k out                    | claude-haiku-5-5 (>100k tier), effort medium | $0.17                     | gemini-4-hydrogen, low           | $0.51          |
| batch / offline                             | per 1M in / 0.1M out, cached prefix | claude-haiku-5-5 Batch API + cache reads     | $0.05 + $0.025            | gemini-3.5-flash-lite Batch      | $0.15 + $0.125 |

Escalation: any route whose primary fails twice or returns low confidence escalates one tier (Haiku 5.5 -> Sonnet 5.5 -> Opus 5.5; Flash-Lite -> Hydrogen -> Carbon). Use prompt caching on stable system prompts and repo context for every Claude route (cache hit 0.01-0.20, A1).


================================================
FILE: ai-os/docs/NHITL.md
================================================
# NHITL index

Owner rule: do everything else that remains to be done before a summary; a pause, a final question or an action left to the owner violates NHITL (no human in the loop). Everything that violates it is indexed here.

## Command

[... truncated by token budget ...]

