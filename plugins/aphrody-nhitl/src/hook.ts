// aphrody-nhitl single hook entry: dispatches on hook_event_name.
// PreToolUse / PermissionRequest: auto-approve except policy denies.
// Notification: log only. Stop / SubagentStop: continue while a goal or todo is open.
// SubagentStart / SubagentStop: track running agents. SessionStart: local digest (no network).
import { readdirSync, readFileSync, unlinkSync } from "node:fs";
import {
  CLAUDE_DIR,
  clearGoal,
  LEARN_DIR,
  type HookInput,
  log,
  out,
  readGoal,
  readInput,
  readState,
  redact,
  STATE_DIR,
  tailLines,
  writeState,
} from "./lib.ts";
import { decide, type Verdict } from "./policy.ts";

const MAX_CONTINUE = Number(process.env.NHITL_MAX_CONTINUE ?? 3);
const BLOCKER_RX =
  /\b(bloqu[ée]|blocked|blocker|bloquant|impossible de continuer|cannot proceed|can't proceed|waiting (for|on) (you|the user)|j'attends|en attente de (toi|vous|l'utilisateur)|need (you|your) to|besoin (de toi|que tu)|2FA|captcha|mot de passe|password required|mfa)\b/i;
const DONE_TOKEN = "NHITL_DONE";

const t0 = performance.now();
const inp = await readInput();
const ev = inp.hook_event_name ?? process.argv[2] ?? "";
const sid = inp.session_id ?? "nosid";
const cwd = inp.cwd ?? process.cwd();
const ms = () => Math.round(performance.now() - t0);

type Agents = Record<string, { sid: string; type: string; ts: number }>;
const AGENTS = "agents";
function agents(): Agents {
  const a = readState<Agents>(AGENTS, "all", {});
  const cutoff = Date.now() - 6 * 3600_000;
  for (const [k, v] of Object.entries(a)) if (v.ts < cutoff) delete a[k];
  return a;
}

function cmdSummary(i: HookInput): string {
  const ti = i.tool_input ?? {};
  return redact(
    String(ti.command ?? ti.file_path ?? ti.path ?? ti.url ?? ""),
    140,
  );
}

// Last TodoWrite list in a transcript tail: open items.
async function openTodos(path: string | undefined): Promise<string[]> {
  const lines = await tailLines(path, 1_500_000);
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i]!;
    if (!l.includes('"TodoWrite"')) continue;
    try {
      const o = JSON.parse(l);
      for (const b of o?.message?.content ?? []) {
        if (
          b?.type === "tool_use" &&
          b.name === "TodoWrite" &&
          Array.isArray(b.input?.todos)
        )
          return b.input.todos
            .filter(
              (t: any) => t.status === "pending" || t.status === "in_progress",
            )
            .map((t: any) =>
              String(t.content ?? t.activeForm ?? "").slice(0, 100),
            );
      }
    } catch {}
  }
  return [];
}

// The policy never throws by design; if a bug makes it throw, shell commands are refused (the
// agent can rephrase) and other tools pass, instead of letting onFailure fail open silently.
function safeDecide(tool: string, input: Record<string, any>): Verdict {
  try {
    return decide(tool, input, cwd);
  } catch (e) {
    log({
      ev: "error",
      sid,
      tool,
      err: redact(String((e as Error)?.stack ?? e), 400),
    });
    return tool === "Bash" || tool === "PowerShell" || tool === "Monitor"
      ? {
          deny: "NHITL : erreur interne de la politique sur cette commande ; la reformuler (commandes plus simples, chemins littéraux).",
        }
      : null;
  }
}

switch (ev) {
  case "PreToolUse": {
    const tool = inp.tool_name ?? "";
    writeState("mode", sid, {
      mode: inp.permission_mode ?? "",
      ts: Date.now(),
    });
    const input = inp.tool_input ?? {};
    const v = safeDecide(tool, input);
    if (v && "deny" in v) {
      log({
        ev: "pre",
        sid,
        tool,
        d: "deny",
        why: v.deny,
        cmd: cmdSummary(inp),
        ms: ms(),
      });
      out({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: v.deny,
        },
      });
    }
    // Rewritten input (read-only Grep with a secret exclusion glob): applies in every mode.
    if (v && "input" in v) {
      log({ ev: "pre", sid, tool, d: "rewrite", ms: ms() });
      out({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          permissionDecisionReason: "nhitl: secrets exclus",
          updatedInput: v.input,
        },
      });
    }
    if (tool === "ExitPlanMode")
      out({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "allow",
          updatedInput: input,
        },
      });
    // Never approve on behalf of plan mode; otherwise skip every prompt.
    if (inp.permission_mode === "plan") process.exit(0);
    log({ ev: "pre", sid, tool, d: "allow", ms: ms() });
    out({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        permissionDecisionReason: "nhitl",
      },
    });
  }
  case "PermissionRequest": {
    const tool = inp.tool_name ?? "";
    const input = inp.tool_input ?? {};
    const v = safeDecide(tool, input);
    log({
      ev: "perm",
      sid,
      tool,
      d: v && "deny" in v ? "deny" : "allow",
      why: v && "deny" in v ? v.deny : undefined,
      cmd: cmdSummary(inp),
      ms: ms(),
    });
    if (v && "deny" in v)
      out({
        hookSpecificOutput: {
          hookEventName: "PermissionRequest",
          decision: { behavior: "deny", message: v.deny },
        },
      });
    // Same rule as PreToolUse: plan mode keeps its own prompts.
    if (inp.permission_mode === "plan" && tool !== "ExitPlanMode")
      process.exit(0);
    out({
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        decision: {
          behavior: "allow",
          updatedInput: v && "input" in v ? v.input : input,
        },
      },
    });
  }
  case "Notification": {
    log({
      ev: "notif",
      sid,
      type: inp.notification_type ?? "",
      msg: redact(String(inp.message ?? ""), 200),
    });
    process.exit(0);
  }
  case "SubagentStart": {
    const a = agents();
    if (inp.agent_id)
      a[inp.agent_id] = { sid, type: inp.agent_type ?? "", ts: Date.now() };
    writeState(AGENTS, "all", a);
    process.exit(0);
  }
  case "Stop":
  case "SubagentStop": {
    const isSub = ev === "SubagentStop";
    if (isSub && inp.agent_id) {
      const a = agents();
      delete a[inp.agent_id];
      writeState(AGENTS, "all", a);
    }
    if (isSub && !inp.agent_type) process.exit(0); // internal agents (suggestions, /btw)
    const key = isSub ? `${sid}-${inp.agent_id ?? ""}` : sid;
    const last = String(inp.last_assistant_message ?? "");
    const goal = isSub ? null : readGoal(sid);
    const todos = await openTodos(
      isSub ? inp.agent_transcript_path : inp.transcript_path,
    );
    const pending: string[] = [];
    if (goal && !last.includes(DONE_TOKEN))
      pending.push(`objectif : ${goal.slice(0, 300)}`);
    if (goal && last.includes(DONE_TOKEN)) {
      clearGoal(sid);
      log({ ev: "goal", sid, d: "done" });
    }
    if (todos.length)
      pending.push(`todos ouverts : ${todos.slice(0, 5).join(" ; ")}`);
    const running = (inp.background_tasks ?? []).filter(
      (t) => t.status === "running" || t.status === "pending",
    );
    const blocker = BLOCKER_RX.test(last.slice(-1500));
    // The cap counts consecutive continuations: a stop not caused by this hook starts over.
    const st = inp.stop_hook_active
      ? readState<{ n: number }>("cont", key, { n: 0 })
      : { n: 0 };
    if (!pending.length || blocker || running.length || st.n >= MAX_CONTINUE) {
      if (pending.length)
        log({
          ev: "stop",
          sid,
          sub: isSub,
          d: "stop",
          why: blocker ? "blocker" : running.length ? "background" : "cap",
          n: st.n,
        });
      process.exit(0);
    }
    st.n++;
    writeState("cont", key, st);
    log({ ev: "stop", sid, sub: isSub, d: "continue", n: st.n, ms: ms() });
    out({
      decision: "block",
      reason: `NHITL (relance ${st.n}/${MAX_CONTINUE}) : travail non terminé, continuer sans demander. ${pending.join(" | ")}. Si un vrai blocage externe empêche d'avancer, l'énoncer en une ligne ; si tout est fini, terminer par ${DONE_TOKEN}.`,
    });
  }
  case "SessionStart": {
    const parts: string[] = [];
    // other live Claude sessions
    try {
      const busy: string[] = [];
      for (const f of readdirSync(`${CLAUDE_DIR}/sessions`)) {
        if (!f.endsWith(".json")) continue;
        try {
          const s = JSON.parse(
            readFileSync(`${CLAUDE_DIR}/sessions/${f}`, "utf8"),
          );
          if (s.sessionId !== sid && s.status === "busy")
            busy.push(
              `${s.name ?? s.sessionId?.slice(0, 8)} (${String(s.cwd ?? "").replaceAll("\\", "/")})`,
            );
        } catch {}
      }
      if (busy.length)
        parts.push(`sessions actives : ${busy.slice(0, 6).join(", ")}`);
    } catch {}
    const a = Object.values(agents());
    if (a.length)
      parts.push(
        `agents en cours : ${a.length} (${[...new Set(a.map((x) => x.type || "?"))].slice(0, 5).join(", ")})`,
      );
    const goal = readGoal(sid);
    if (goal) parts.push(`objectif : ${goal.slice(0, 200)}`);
    if (inp.source === "resume" || inp.source === "compact") {
      const todos = await openTodos(inp.transcript_path);
      if (todos.length)
        parts.push(`todos ouverts : ${todos.slice(0, 5).join(" ; ")}`);
    }
    try {
      const j = await tailLines(`${LEARN_DIR}/journal.jsonl`, 400_000);
      const n = j.filter(Boolean).length;
      if (n) {
        let lastTs = "";
        try {
          lastTs = JSON.parse(j.filter(Boolean).at(-1)!).ts?.slice(0, 16) ?? "";
        } catch {}
        parts.push(
          `learn : ${n} entrées de journal${n >= 20 ? " à distiller (skill learn)" : ""}, dernière ${lastTs}`,
        );
      }
      const day = Date.now() - 86_400_000;
      const denies = (
        await tailLines(`${LEARN_DIR}/nhitl.jsonl`, 300_000)
      ).filter(
        (l) => l.includes('"d":"deny"') && Date.parse(l.slice(7, 31)) > day,
      ).length;
      if (denies)
        parts.push(
          `nhitl : ${denies} refus en 24 h (~/.claude/learning/nhitl.jsonl)`,
        );
    } catch {}
    log({ ev: "start", sid, src: inp.source ?? "", ms: ms() });
    if (!parts.length) process.exit(0);
    out({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `[nhitl] ${parts.join(" | ")}`,
      },
    });
  }
  case "SessionEnd": {
    try {
      for (const f of readdirSync(STATE_DIR))
        if (f.includes(sid) && !f.startsWith("goal-"))
          unlinkSync(`${STATE_DIR}/${f}`);
    } catch {}
    process.exit(0);
  }
  default:
    process.exit(0);
}
