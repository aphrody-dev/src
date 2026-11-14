# aphrody-apm

Rust port of Microsoft APM (Agent Package Manager). Upstream: `C:\src\third_party\ai\microsoft_apm`, commit `1a6c1df` (Apache-2.0, apm-cli 0.35.1). It ships a library (`aphrody_apm`) and an `apm` binary.

## Covered

- `apm.yml`: name/version (non-empty strings, so `version: 1.0` is rejected like upstream), description/author/license/type, `includes` (`auto` or list), `targets`/`target` (CSV, aliases `vscode`/`agents` -> `copilot`), `dependencies.apm` / `mcp`, `devDependencies`, `scripts`. Unknown and `x-*` keys are kept on re-serialization.
- YAML: PyYAML-compatible loader (YAML 1.1 bool/int/float/null/timestamp resolution, anchors and aliases rejected, req-mf-020) and a `safe_dump` emitter (quoting rules, 80-column folding, indentless sequences, `? key` complex keys). The emitter reproduces upstream's committed `apm.lock.yaml` byte for byte (3 362 lines).
- `apm.lock.yaml`: `to_dict` field order and omission rules, unknown fields replayed last, content-driven `lockfile_version` (1/2/3), `deployments` ledger rows, conflict-marker and version checks, legacy `deployed_skills` migration.
- Dependency references: local paths, `owner/repo[/sub/path][#ref]`, host-qualified shorthand, HTTPS/SSH/`file://` URLs, Azure DevOps, and the object form (`git`, `path`, `ref`, `alias`, `skills`). The `@alias` shorthand is rejected, as upstream does.
- Resolution: breadth-first and transitive. The shallowest declaration wins and cycles are cut. Local deps are copied to `apm_modules/_local/<name>`; transitive ones go to `_local/<sha12>/<name>` and carry `declaring_parent` and `anchored_local_path`. Git deps are fetched by calling the `git` CLI, because `gix` is not vendored. They are pinned to the locked `resolved_commit` unless you pass `--update`.
- `apm install` for `copilot`, `claude` and `agent-skills`:
  - **copilot**: `.github/instructions`, `.github/prompts` and `.github/agents` get verbatim copies; skills go to `.agents/skills/<name>/`.
  - **claude**: `.claude/rules/*.md` (`applyTo` becomes `paths:`), `.claude/commands/*.md` (prompt to command transform), `.claude/agents/*.md` and `.claude/skills/<name>/`.
  - Workflow-shape prompts (`interval`, `schedule_*`) are skipped.
  - Agents are classified by their frontmatter.
  - In-package markdown links are rewritten.
  - Per-file hashes are LF-normalized; `content_hash` is computed over the package tree.
  - Stale files are removed on reinstall.
  - Target detection matches upstream: explicit target, else by directory, else `copilot`.
- `apm compile`: writes a single root `AGENTS.md` (copilot) and `CLAUDE.md` (claude) using the upstream templates and the deterministic Build ID.

## Tests

Run `cargo test -p aphrody-apm`. There are 49 tests: 32 unit, 12 upstream-conformance, 5 end-to-end.

- The `upstream.rs` tests run against the checkout. Set `APM_UPSTREAM` to point at it. If the checkout is missing, the tests skip.
- These tests run a full `apm install` on a copy of upstream's own project. For all 11 dependencies, the resulting `deployed_files`, `deployed_file_hashes`, `content_hash`, `depth`, `resolved_by` and anchoring match upstream's lockfile exactly.
- CONFORMANCE.json requirements exercised: req-cf-001, req-mf-002/003, req-mf-019, req-mf-020, req-ext-001, req-lk-004, req-lk-005, req-lk-011, req-lk-013, req-lk-022. That is 10 of 137. Most of the other upstream conformance tests check JSON Schemas or spec text, not loader behavior.

## Gaps

- Registry (`id:`), marketplace and plugin sources: these entries are detected and rejected. Semver git ranges, replacements, the policy engine, audit and security scanning are not ported.
- MCP/LSP server integration: lockfile sections are preserved but nothing is configured. Hooks, canvas, Copilot App and Cowork are not ported.
- Targets cursor, codex, gemini, kiro, opencode, windsurf and antigravity are accepted in `apm.yml` but skipped at install.
- User scope (`~/.apm`), `apm init`/`run`/`deps`/`audit`/`pack`, and the authentication/token flows (private repos only work through the `git` credential helper) are not ported.
- Compile only produces a single root file. Upstream's default distributed `AGENTS.md` placement, constitution and chatmodes are not ported.
- Context-file (`.context.md`/`.memory.md`) link resolution is not ported. Comments in `apm.yml` are lost on re-serialization, as upstream.
- No Bun/TypeScript part: the only JS in upstream is `packages/apm-contributor-dashboard/client`, a sample Vite app shipped as an APM package, not part of the CLI.
