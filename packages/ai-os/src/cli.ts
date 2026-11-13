#!/usr/bin/env bun
// @aphrody/ai-os entry point: `ai-os relay <cmd>` runs the relay CLI (src/relay/cli.ts), `ai-os orch <cmd>` the
// orchestrator (src/orch/cli.ts), anything else the agent CLI
// (src/agent-cli.ts: init, run, context, schedule, heartbeat, skills, research, gateway, tui).
const sub = Bun.argv[2];
if (sub === "relay" || sub === "orch") {
  const same = Bun.argv === process.argv;
  Bun.argv.splice(2, 1);
  if (!same) process.argv.splice(2, 1);
  await import(sub === "relay" ? "./relay/cli.ts" : "./orch/cli.ts");
} else await import("./agent-cli.ts");
