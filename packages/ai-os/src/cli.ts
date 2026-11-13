#!/usr/bin/env bun
// @aphrody/ai-os entry point: `ai-os relay <cmd>` runs the relay CLI (src/relay/cli.ts), `ai-os orch <cmd>` the
// orchestrator (src/orch/cli.ts), `ai-os fabric <cmd>` the distributed inference fabric (src/fabric/cli.ts),
// `ai-os nhitl <cmd>` the index of human-in-the-loop violations (src/nhitl/cli.ts),
// anything else the agent CLI (src/agent-cli.ts: init, run, context, schedule, heartbeat, skills, research, gateway, tui).
const subs: Record<string, string> = {
  relay: "./relay/cli.ts",
  orch: "./orch/cli.ts",
  fabric: "./fabric/cli.ts",
  brain: "./brain/cli.ts",
  nhitl: "./nhitl/cli.ts",
};
const sub = Bun.argv[2];
if (sub && subs[sub]) {
  const same = Bun.argv === process.argv;
  Bun.argv.splice(2, 1);
  if (!same) process.argv.splice(2, 1);
  await import(subs[sub]);
} else await import("./agent-cli.ts");
