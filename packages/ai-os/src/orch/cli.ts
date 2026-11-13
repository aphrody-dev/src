// ai-os orch : orchestrateur multi-hôtes, multi-moteurs. Sorties JSON sur stdout, journal JSONL par exécution.
//   ai-os orch hosts                              hôtes (fleet.toml + deploy.toml, fr1 exclu), état des runners
//   ai-os orch engines [--host H] [--edit]        candidats et ordre `providers` calculé pour un besoin
//   ai-os orch run <workflow.json|->  [--dry-run] graphe d'étapes (format : docs/ORCHESTRATOR.md)
//   ai-os orch plan "<objectif>" [--dry-run]      un planificateur génère le graphe (étape expand), puis exécution
//   ai-os orch lifecycle [--task T] [--paths a,b] [--apply] [--dry-run]
//   ai-os orch design <produit> [--url U] | market <produit> "<brief>"
//   ai-os orch health                             refroidissements et issues observées par hôte/fournisseur
import { parseArgs } from "node:util";
import { hosts as fleetHosts } from "./fleet";
import { Health } from "./health";
import { design, market, software } from "./lifecycle";
import { runnerState } from "./queue";
import { type Step, type Workflow, runWorkflow } from "./run";
import { candidates, rank } from "./select";

const { positionals, values } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: {
    host: { type: "string" },
    edit: { type: "boolean" },
    prefer: { type: "string" },
    model: { type: "string", multiple: true },
    task: { type: "string" },
    paths: { type: "string" },
    url: { type: "string" },
    apply: { type: "boolean" },
    "dry-run": { type: "boolean" },
    quiet: { type: "boolean" },
  },
});
const [cmd, ...rest] = positionals;
const print = (x: unknown) => console.log(JSON.stringify(x, null, 2));
const exec = async (wf: Workflow) => {
  const r = await runWorkflow(wf, {
    dryRun: values["dry-run"],
    onEvent: values.quiet ? undefined : (e) => console.error(JSON.stringify(e)),
  });
  print(r);
  process.exit(r.ok ? 0 : 1);
};

switch (cmd) {
  case "hosts": {
    const hs = fleetHosts();
    print(
      await Promise.all(
        hs.map(async (h) => ({
          ...h,
          runner: await runnerState(h).catch((e) => ({ error: String(e) })),
        })),
      ),
    );
    break;
  }
  case "engines": {
    const health = new Health();
    const hs = fleetHosts().filter((h) => !values.host || h.id === values.host);
    print(
      await Promise.all(
        hs.map(async (h) => {
          const rs = await runnerState(h).catch(() => undefined);
          const all = await candidates(h, rs);
          return {
            host: h.id,
            candidates: all,
            providers: rank(
              h.id,
              all,
              {
                edit: values.edit,
                prefer: values.prefer as any,
                models: values.model,
              },
              health,
              rs?.cooling,
            ),
          };
        }),
      ),
    );
    health.close();
    break;
  }
  case "health": {
    const h = new Health();
    print({
      cooldown: h.db
        .query(
          "SELECT host, provider, class, fails, datetime(until/1000, 'unixepoch') AS until FROM cooldown WHERE until > ?",
        )
        .all(Date.now()),
      outcomes: h.db
        .query(
          "SELECT host, provider, count(*) AS n, sum(ok) AS ok, cast(avg(ms) AS int) AS avg_ms FROM outcome GROUP BY host, provider ORDER BY host, n DESC",
        )
        .all(),
    });
    h.close();
    break;
  }
  case "run": {
    const src = rest[0] ?? "-";
    const text =
      src === "-" ? await Bun.stdin.text() : await Bun.file(src).text();
    const wf = JSON.parse(text) as Workflow;
    if (!wf?.name || !Array.isArray(wf.steps))
      throw new Error("workflow : { name, steps[] } attendu");
    await exec(wf);
    break;
  }
  case "plan": {
    const goal = rest.join(" ");
    if (!goal) throw new Error('usage : ai-os orch plan "<objectif>"');
    const planner: Step = {
      id: "plan",
      do: "agent",
      role: "reviewer",
      expand: true,
      prompt:
        `Planifie l'objectif suivant pour le monorepo src en graphe d'étapes exécutables par des agents. Objectif : ${goal}\n\n` +
        'Réponds uniquement par un bloc ```json {"steps":[…]} ``` où chaque étape a id, do ("agent"|"cmd"|"tool"), deps (ids), ' +
        'et selon do : prompt + role (coder|reviewer|tester|linter|designer|deployer|sre|growth) + needs ({"edit":true} pour modifier des fichiers) + check, ' +
        'ou run (ligne sh), ou tool + args. Hôtes : pc, prd (compilation, nice -n 19, -j 4), fr2 (léger). Toute publication, envoi ou dépense : "effect":"external". Au plus 12 étapes.',
    };
    await exec({ name: "plan", steps: [planner] });
    break;
  }
  case "lifecycle":
    await exec(
      software({
        task: values.task,
        paths: values.paths?.split(",").filter(Boolean),
        apply: values.apply,
      }),
    );
    break;
  case "design":
    if (!rest[0]) throw new Error("usage : ai-os orch design <produit>");
    await exec(design(rest[0], { url: values.url }));
    break;
  case "market":
    if (!rest[0] || !rest[1])
      throw new Error('usage : ai-os orch market <produit> "<brief>"');
    await exec(market(rest[0], rest.slice(1).join(" ")));
    break;
  default:
    console.error(
      "usage : ai-os orch hosts | engines [--host H] [--edit] [--prefer cost|latency|reliability] [--model cli:m] | health | run <workflow.json|-> [--dry-run] | plan <objectif> | lifecycle [--task T] [--paths a,b] [--apply] | design <produit> [--url U] | market <produit> <brief>",
    );
    process.exit(2);
}
