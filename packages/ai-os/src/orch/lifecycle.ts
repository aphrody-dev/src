// Workflows reproductibles du cycle de vie de src, sans humain : ils ne figent ni moteur ni modèle (sélection par
// select.ts), seulement les étapes, leurs hôtes et leurs garde-fous. Compilation et conteneurs sur prd uniquement
// (nice -n 19, -j 4) ; le poste ne fait que formater, typer, tester en bun et juger.
//   software : code -> fmt -> check/arch/clippy -> tests -> tribunal (ai-os review) -> correction -> build/docker
//              -> déploiement (dry-run sauf --apply) -> surveillance -> optimisation (étapes générées)
//   design   : PRD + DESIGN.md (gds plan) -> gds verify -> wck 100/100 -> juge
//   market   : brouillons rédigés et mis en file ; la publication est un effet externe retenu (policy.ts)
import { shq } from "./fleet";
import type { Step, Workflow } from "./run";

export type LifecycleOptions = {
  task?: string;
  /** Préfixes de chemins que le code peut toucher et commiter (runner : commit borné). */
  paths?: string[];
  apply?: boolean;
  /** Paquets bun à tester (défaut : packages/ai-os). */
  bunTests?: string[];
  /** Hôte de compilation (défaut prd). */
  build?: string;
  slug?: string;
};

const day = () => new Date().toISOString().slice(0, 10);
const slugOf = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "run";
// Checkout du runner sur l'hôte distant : main à jour avant de compiler.
const synced = (cmd: string) => `git pull -q --ff-only origin main && ${cmd}`;
const heavy = (cmd: string) => `nice -n 19 ${cmd}`;
const q = (xs: string[]) => xs.map(shq).join(" ");

export function software(o: LifecycleOptions = {}): Workflow {
  const paths = o.paths?.length ? o.paths : ["packages/ai-os"];
  const build = o.build ?? "prd";
  const slug = o.slug ?? slugOf(o.task ?? paths.join("-"));
  const msg = (what: string) => `${paths[0]} : ${what}`;
  const steps: Step[] = [];
  const after = (ids: string[]) =>
    ids.filter((id) => steps.some((s) => s.id === id));
  if (o.task)
    steps.push({
      id: "code",
      do: "agent",
      role: "coder",
      needs: { edit: true },
      prompt: `${o.task}\n\nRègles de src : lis AGENTS.md et CLAUDE.md ; ne touche que ${paths.join(", ")} ; zéro emoji ; aucun secret affiché ; termine par bun fmt sur tes fichiers.`,
      check: `bun check && bun fmt --check ${q(paths)}`,
      commit: { paths, message: msg(o.task.slice(0, 60)) },
      budget_usd: 5,
    });
  steps.push(
    {
      id: "fmt",
      do: "cmd",
      deps: after(["code"]),
      hosts: ["pc"],
      // Vérification seulement : un écart ouvre un ticket coder qui formate et commite dans `paths` (aucune
      // modification locale non commitée que prd ne verrait pas).
      run: `bun fmt --check ${q(paths)}`,
    },
    {
      // Une seule synchronisation git sur l'hôte de compilation, avant toute compilation (pas de index.lock concurrent).
      id: "sync",
      do: "cmd",
      deps: ["fmt"],
      hosts: [build],
      run: "git pull -q --ff-only origin main",
      onFail: "stop",
    },
    { id: "check", do: "cmd", deps: ["fmt"], hosts: ["pc"], run: "bun check" },
    {
      id: "arch",
      do: "cmd",
      deps: ["fmt"],
      hosts: ["pc"],
      run: "ay arch check --strict",
    },
    {
      id: "clippy",
      do: "cmd",
      deps: ["sync"],
      hosts: [build],
      run: heavy("cargo clippy --workspace -j 4 --quiet -- -D warnings"),
      timeout_s: 5400,
    },
    {
      id: "test-bun",
      do: "cmd",
      deps: ["check"],
      hosts: ["pc"],
      run: (o.bunTests ?? ["packages/ai-os"])
        .map((p) => `bun test ${shq(p)}`)
        .join(" && "),
    },
    {
      id: "test-cargo",
      do: "cmd",
      deps: ["clippy"],
      hosts: [build],
      run: heavy("cargo test --workspace -j 4 --quiet"),
      timeout_s: 5400,
    },
    {
      id: "test-go",
      do: "cmd",
      deps: ["test-cargo"], // une compilation à la fois sur prd
      hosts: [build],
      run: heavy("go -C infra test ./..."),
      timeout_s: 2400,
    },
    {
      id: "diff",
      do: "cmd",
      deps: ["test-bun", "arch"],
      hosts: ["pc"],
      // Échec de git propagé (pas masqué par le code de sortie de head).
      run: `out=$(git log -3 -p --stat -- ${q(paths)}) && printf '%s' "$out" | head -c 100000`,
      onFail: "stop",
    },
    {
      // Tribunal à trois voix (src/review : Gemini et Claude en parallèle, juge neutre qui tranche), moteurs du
      // registre avec repli, ancré sur les sources officielles Google et docs/reviews/CHECKLISTS.md ; verdicts
      // docs/reviews/<voix>-<date>-<slug>.md et ligne d'INDEX.md écrits par l'outil.
      id: "review",
      do: "tool",
      deps: ["diff"],
      hosts: ["pc"],
      tool: "review",
      args: {
        title: `${paths.join(", ")} (${day()})`,
        content: "{{diff}}",
        slug,
      },
      onFail: "continue",
    },
    {
      id: "fix",
      do: "agent",
      role: "coder",
      deps: ["review"],
      needs: { edit: true },
      prompt:
        "Le tribunal ai-os review (deux voix et un juge) a relu le changement. Vérifie chaque défaut retenu par le juge dans le code ; corrige ceux qui sont réels, ignore les autres en le disant. Rien à faire si le statut est « conforme ».\n\n{{review}}",
      check: "bun check && ay arch check --strict",
      commit: {
        paths: [...paths, "docs/reviews"],
        message: msg("corrections du tribunal"),
      },
      onFail: "continue",
      budget_usd: 5,
    },
    {
      id: "docker",
      do: "cmd",
      deps: ["fix", "test-cargo", "test-go"],
      hosts: [build],
      // Resynchronisé : les corrections des juges ont été poussées par le runner depuis « sync ».
      run: synced(
        heavy("docker build --target runtime -t aphrody/src:agents ."),
      ),
      timeout_s: 5400,
    },
    {
      id: "deploy",
      do: "cmd",
      deps: ["docker"],
      hosts: ["pc"],
      run: o.apply ? "ay deploy up --all" : "ay deploy up --all --dry-run",
    },
    {
      id: "monitor",
      do: "tool",
      deps: ["deploy"],
      hosts: ["pc"],
      tool: "fleet_status",
      args: {},
    },
    {
      id: "optimize",
      do: "agent",
      role: "sre",
      deps: ["monitor"],
      prompt:
        'État de la flotte après déploiement :\n{{monitor}}\n\nPropose au plus 3 optimisations mesurables de src (performance, fiabilité, coût), chacune en tâche pour un agent coder. Réponds uniquement par un bloc ```json {"steps":[{"id":"o1","do":"agent","role":"coder","needs":{"edit":true},"prompt":"…","check":"…"}]} ``` ; liste vide si rien ne le justifie.',
      expand: true,
      // Les tâches générées commitent dans le même périmètre et s'enchaînent (run.ts).
      commit: { paths, message: msg("optimisation") },
      onFail: "continue",
    },
  );
  return { name: `software-${slug}`, paths, steps };
}

const product_ = (p: string) => {
  if (!/^[\w.-]+$/.test(p)) throw new Error(`nom de produit invalide : ${p}`);
  return p;
};

export function design(product: string, o: { url?: string } = {}): Workflow {
  const dir = `apps/${product_(product)}`;
  return {
    name: `design-${product}`,
    steps: [
      {
        id: "prd",
        do: "agent",
        role: "designer",
        needs: { edit: true },
        prompt: `Design-First Gate de src pour ${dir} : mets à jour le cahier des charges (PRD) et DESIGN.md avec \`gds plan ${product} --out ${dir}/docs\`, puis complète-les à partir du code réel. Aucun code UI avant ces documents.`,
        check: `gds audit-slop ${shq(`${dir}/docs`)}`,
        commit: {
          paths: [`${dir}/docs`],
          message: `${dir} : PRD et DESIGN.md`,
        },
      },
      {
        id: "gds",
        do: "cmd",
        deps: ["prd"],
        hosts: ["pc"],
        run: `gds verify ${shq(dir)}`,
      },
      {
        id: "wck",
        do: "cmd",
        deps: ["prd"],
        hosts: ["pc"],
        run: `wck ${shq(o.url ?? dir)} --quiet`,
      },
      {
        id: "judge",
        do: "tool",
        deps: ["gds", "wck"],
        hosts: ["pc"],
        tool: "review",
        args: {
          title: `${dir} design (${day()})`,
          content: "gds verify :\n{{gds}}\n\nwck :\n{{wck}}",
          slug: `design-${product}`,
        },
      },
    ],
  };
}

export function market(product: string, brief: string): Workflow {
  product_(product);
  return {
    name: `market-${product}`,
    steps: [
      {
        id: "facts",
        do: "cmd",
        hosts: ["pc"],
        run: `git log -20 --format='%h %s' -- ${shq(`apps/${product}`)} ${shq(`packages/${product}`)}`,
      },
      {
        id: "draft",
        do: "agent",
        role: "growth",
        needs: {},
        prompt: `Rédige des brouillons marketing pour ${product} : ${brief}\nFaits vérifiables uniquement (journal ci-dessous), ton direct, zéro emoji, aucun superlatif ni vocabulaire d'IA. Un brouillon par canal, avec le canal en titre.\n\n{{facts}}`,
        out: `var/agents/outbox/${product}-${day()}.md`,
      },
      {
        id: "publish",
        do: "agent",
        role: "growth",
        deps: ["draft"],
        effect: "external",
        prompt: "Publier les brouillons validés :\n{{draft}}",
      },
    ],
  };
}
