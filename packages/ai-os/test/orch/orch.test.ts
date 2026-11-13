// Orchestrateur : classement des échecs, routage déclaratif, graphe (parallélisme, expansion, cycle, ticket de
// correction, effet externe retenu, plafonds), file v1 du runner. Hôte local uniquement, aucun moteur réel.
import { expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.AGENT_HOME = mkdtempSync(join(tmpdir(), "ai-os-orch-"));
const { classify, retryAfterMs, switches } =
  await import("../../src/orch/classify.ts");
const { Health } = await import("../../src/orch/health.ts");
const { rank } = await import("../../src/orch/select.ts");
const { runWorkflow } = await import("../../src/orch/run.ts");
const Q = await import("../../src/orch/queue.ts");
import type { Host } from "../../src/orch/fleet.ts";

const root = mkdtempSync(join(tmpdir(), "ai-os-orch-root-"));
const local: Host = {
  id: "pc",
  local: true,
  src: root,
  roles: ["coder", "reviewer"],
  maxAgents: 2,
};
const opts = { hosts: [local], root, limits: { pollMs: 50 } };

test("classes d'échec : quota, throttle, auth, absence, contexte", () => {
  expect(classify("Error: RESOURCE_EXHAUSTED: credits balance is 0")).toBe(
    "quota",
  );
  expect(classify("HTTP 402 Payment Required")).toBe("quota");
  expect(classify("429 Too Many Requests, retry-after: 7")).toBe("throttle");
  expect(retryAfterMs("429 Too Many Requests, retry-after: 7")).toBe(7000);
  expect(classify("Failed to authenticate: OAuth session expired")).toBe(
    "auth",
  );
  expect(classify("", 127)).toBe("missing");
  expect(classify("prompt is too long: 250000 tokens")).toBe("context");
  expect(classify("assertion failed in foo.ts")).toBe("task");
  expect(switches("quota") && switches("auth") && !switches("throttle")).toBe(
    true,
  );
});

test("routage : modèle souhaité suivi de sa CLI, refroidissement et exclusions", () => {
  const h = new Health(join(process.env.AGENT_HOME!, "rank.sqlite"));
  const all = [
    { id: "claude", kind: "cli" as const, why: "" },
    { id: "agy", kind: "cli" as const, why: "" },
    { id: "ollama/m", kind: "model" as const, why: "", cost: 0, context: 8000 },
  ];
  expect(rank("pc", all, { models: ["agy:x-high"] }, h).slice(0, 2)).toEqual([
    "agy:x-high",
    "agy",
  ]);
  expect(rank("pc", all, { edit: true }, h)).not.toContain("ollama/m");
  expect(rank("pc", all, { context: 100_000 }, h)).toContain("claude");
  expect(rank("pc", all, { context: 100_000 }, h)).not.toContain("ollama/m");
  h.record("pc", "claude", false, "auth", 10);
  expect(rank("pc", all, {}, h)).not.toContain("claude");
  expect(rank("pc", all, {}, h, ["agy"])).not.toContain("agy");
  expect(rank("pc", all, { only: ["^ollama/"] }, h)).toEqual(["ollama/m"]);
  // Fiabilité observée : le moteur qui réussit passe devant.
  for (let i = 0; i < 3; i++) h.record("pc", "ollama/m", true, null, 100);
  expect(rank("pc", all, { ignore: ["^claude"] }, h)[0]).toBe("ollama/m");
  h.close();
});

test("graphe : parallélisme, sorties chaînées, expansion dynamique", async () => {
  const events: string[] = [];
  const r = await runWorkflow(
    {
      name: "t1",
      steps: [
        {
          id: "a",
          do: "cmd",
          run: "bun -e \"await Bun.sleep(300); console.log('A')\"",
        },
        {
          id: "b",
          do: "cmd",
          run: "bun -e \"await Bun.sleep(300); console.log('B')\"",
        },
        {
          id: "gen",
          do: "cmd",
          deps: ["a", "b"],
          expand: true,
          run: `bun -e "console.log(JSON.stringify({steps:[{id:'c',do:'cmd',run:'echo child'}]}))"`,
        },
      ],
    },
    { ...opts, onEvent: (e) => events.push(`${e.event}:${e.step ?? ""}`) },
  );
  expect(r.ok).toBe(true);
  const ids = r.steps.map((s) => s.id);
  expect(ids).toContain("gen.c");
  expect(r.steps.find((s) => s.id === "gen.c")!.output).toContain("child");
  // a et b en parallèle : les deux ont démarré avant la première fin.
  const firstEnd = events.findIndex((e) => e.startsWith("end:"));
  expect(events.indexOf("start:a")).toBeLessThan(firstEnd);
  expect(events.indexOf("start:b")).toBeLessThan(firstEnd);
});

test("cycle détecté, dépendance absente refusée", async () => {
  const r = await runWorkflow(
    {
      name: "t2",
      steps: [
        { id: "x", do: "cmd", deps: ["y"], run: "echo x" },
        { id: "y", do: "cmd", deps: ["x"], run: "echo y" },
      ],
    },
    opts,
  );
  expect(r.ok).toBe(false);
  expect(r.steps.every((s) => s.status === "skipped")).toBe(true);
  expect(
    runWorkflow(
      {
        name: "t3",
        steps: [{ id: "z", do: "cmd", deps: ["nope"], run: "echo" }],
      },
      opts,
    ),
  ).rejects.toThrow();
});

test("échec de commande : ticket de correction, dépendants en attente puis sautés sans worker", async () => {
  const r = await runWorkflow(
    {
      name: "t4",
      steps: [
        { id: "lint", do: "cmd", run: 'bun -e "process.exit(3)"' },
        { id: "after", do: "cmd", deps: ["lint"], run: "echo after" },
      ],
    },
    opts,
  );
  const lint = r.steps.find((s) => s.id === "lint")!;
  expect(lint.fixedBy).toBe("lint#fix1");
  const fix = r.steps.find((s) => s.id === "lint#fix1")!;
  expect(fix.status).toBe("failed"); // aucun worker coder : une étape d'édition ne s'exécute pas hors file
  expect(r.steps.find((s) => s.id === "after")!.status).toBe("skipped");
  expect(r.ok).toBe(false);
});

test("effet externe : retenu sans règle du propriétaire, autorisé avec", async () => {
  const wf = {
    name: "t5",
    steps: [
      {
        id: "publish-x",
        do: "cmd" as const,
        effect: "external" as const,
        run: "echo published",
      },
    ],
  };
  const r = await runWorkflow(wf, opts);
  const s = r.steps[0]!;
  expect(s.status).toBe("held");
  expect(existsSync(join(root, s.note!))).toBe(true);
  mkdirSync(join(root, ".agents"), { recursive: true });
  writeFileSync(
    join(root, ".agents", "owner-rules.json"),
    JSON.stringify({ rules: [{ effect: "external", match: "^publish-x " }] }),
  );
  const r2 = await runWorkflow(wf, opts);
  expect(r2.steps[0]!.status).toBe("done");
  expect(r2.steps[0]!.output).toContain("published");
});

test("garde-fous : arrêt après échecs consécutifs, plafond d'étapes", async () => {
  const steps = ["f1", "f2", "f3"].map((id) => ({
    id,
    do: "cmd" as const,
    run: 'bun -e "process.exit(1)"',
    onFail: "stop" as const,
  }));
  const r = await runWorkflow(
    {
      name: "t6",
      steps: [...steps, { id: "later", do: "cmd", deps: ["f1"], run: "echo" }],
    },
    { ...opts, limits: { ...opts.limits, maxConsecutiveFailures: 2 } },
  );
  expect(r.ok).toBe(false);
  expect(
    runWorkflow(
      {
        name: "t7",
        steps: Array.from({ length: 5 }, (_, i) => ({
          id: `s${i}`,
          do: "cmd" as const,
          run: "echo",
        })),
      },
      { ...opts, limits: { maxSteps: 3 } },
    ),
  ).rejects.toThrow(/plafond/);
});

test("file v1 : dépôt atomique, résultat final lu, sortie de la tentative acceptée", async () => {
  const id = "t-queue-1";
  await Q.enqueue(local, {
    v: 1,
    id,
    prompt: "p",
    role: "coder",
    host: "pc",
    providers: ["claude"],
  });
  const base = join(root, "var", "agents");
  expect(existsSync(join(base, "queue", "new", `${id}.json`))).toBe(true);
  expect(
    JSON.parse(readFileSync(join(base, "queue", "new", `${id}.json`), "utf8"))
      .v,
  ).toBe(1);
  expect(await Q.poll(local, id)).toBeNull();
  // Simule le runner : done + result.json + journal de la tentative 0.
  mkdirSync(join(base, "queue", "done"), { recursive: true });
  mkdirSync(join(base, "results", id), { recursive: true });
  writeFileSync(join(base, "queue", "done", `${id}.json`), "{}");
  const attempt = {
    provider: "claude:m",
    exit: 0,
    reason: "ok",
    started: "",
    ended: "",
  };
  writeFileSync(
    join(base, "results", id, "result.json"),
    JSON.stringify({ id, status: "done", host: "pc", attempts: [attempt] }),
  );
  writeFileSync(join(base, "results", id, "0-claude_m.log"), "sortie");
  const r = await Q.poll(local, id);
  expect(r?.status).toBe("done");
  expect(await Q.output(local, r!)).toBe("sortie");
  mkdirSync(join(base, "state"), { recursive: true });
  writeFileSync(join(base, "state", "heartbeat-coder"), "1");
  writeFileSync(join(base, "state", "cooldown-agy_x"), "1");
  const s = await Q.runnerState(local);
  expect(s.roles).toEqual(["coder"]);
  expect(s.cooling).toEqual(["agy_x"]);
});
