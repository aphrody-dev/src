---
name: ai-os-orchestrator
description: "Run multi-agent work across the fleet without a human: task graphs (agent, cmd, tool steps) in parallel on pc, prd and fr2, engines chosen from what is really installed and discovered, automatic failover on quota/429/auth, fix tickets, budgets, lifecycle (fmt, check, tests, judges, docker, deploy dry-run, monitor, optimize), held external effects. Use for any request to parallelise agents, delegate to sub-agents, route between CLIs or providers, or run the src lifecycle unattended."
---

# ai-os orchestrator

Reference: `packages/ai-os/docs/ORCHESTRATOR.md`. Code: `packages/ai-os/src/orch/`. Host execution (tmux sessions, queue) belongs to `infra/agents/runner.ts` (`docs/agents/AGENT-FIRST.md`): do not re-implement it, enqueue into it.

## Commands (JSON on stdout)

- `just orch hosts` / `just orch engines [--edit] [--model cli:model]` / `just orch health`
- `just orch run <workflow.json>` (`--dry-run` resolves the graph only), `just orch plan "<goal>"`
- `just lifecycle --task "<task>" --paths <prefix,...> [--apply]`
- `just orch design <product>`, `just orch market <product> "<brief>"` (drafts only)
- Relay: MCP tools `orch_run`, `orch_engines`, `fleet_status`.

## Rules

1. Never write a model or provider chain into a workflow: declare `needs` (`edit`, `context`, `tools`, `prefer`, `only`, `ignore`, `models` as preferences) and let `select.ts` compute `providers` from the probe, `llm_models`, models.dev and observed health.
2. Steps that edit files need `needs.edit` and go through the runner queue with `check` and `commit.paths`; read-only steps may run inline.
3. Compilation and containers run on prd only (`nice -n 19`, `-j 4`); fr1 never receives agents (excluded via `infra/deploy.toml` role `build`).
4. Publication, messages and spending are `effect: "external"`: held in `var/agents/outbox/` unless `.agents/owner-rules.json` (owner-written) has a matching rule. The same file drives `pre-tool-guard.ts` under `AGENT_GUARD=enforce`.
5. Judges' verdicts go to `docs/reviews/` (`out` field); verify every defect before fixing.
6. Budgets are mandatory for long runs: `limits.budgetUsd`, `tokenBudget`, `maxSteps`, `deadlineMs`; the run stops after `maxConsecutiveFailures`.
