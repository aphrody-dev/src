// `env-kit billing status|plan|apply|relink` : facturation Google Cloud gérée par agents (docs/infra/GCP-BILLING.md).
// Jeton sans clé : impersonation de billing-agent@aphrody (roles/iam.serviceAccountTokenCreator du propriétaire),
// ou OIDC GitHub (pool `github`) en CI via CLOUDSDK_AUTH_ACCESS_TOKEN. Aucune dépense : budgets, lecture, liaison.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const BILLING_AGENT_SA = "billing-agent@aphrody.iam.gserviceaccount.com";
export const BILLING_TOPIC = "projects/aphrody/topics/billing-alerts";
const QUOTA_PROJECT = "aphrody";
const OWNER = "yohanpierre15@gmail.com";
const THRESHOLDS = [
  { thresholdPercent: 0.5 },
  { thresholdPercent: 0.9 },
  { thresholdPercent: 1.0 },
  { thresholdPercent: 1.0, spendBasis: "FORECASTED_SPEND" },
];
/** Plafond bas par défaut d'un projet sans budget (EUR/mois), tant que `.agents/owner-rules.json` ne dit rien. */
const DEFAULT_PROJECT_CAP_EUR = 5;

type Json = Record<string, any>;

function token(asOwner: boolean): string {
  if (process.env.CLOUDSDK_AUTH_ACCESS_TOKEN)
    return process.env.CLOUDSDK_AUTH_ACCESS_TOKEN;
  const args = asOwner
    ? ["auth", "print-access-token", `--account=${OWNER}`]
    : [
        "auth",
        "print-access-token",
        `--impersonate-service-account=${BILLING_AGENT_SA}`,
        `--account=${OWNER}`,
      ];
  const r = spawnSync("gcloud", [...args, "--quiet"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    windowsHide: true,
    timeout: 60_000,
  });
  const t = (r.stdout ?? "").trim().split("\n").pop() ?? "";
  if (r.status !== 0 || !t)
    throw new Error(
      `jeton gcloud indisponible (${(r.stderr ?? "").split("\n")[0]})`,
    );
  return t;
}

class Api {
  constructor(private readonly tok: string) {}
  async call(method: string, url: string, body?: unknown): Promise<Json> {
    const r = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.tok}`,
        "x-goog-user-project": QUOTA_PROJECT,
        "Content-Type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const j = (await r.json().catch(() => ({}))) as Json;
    if (!r.ok) return { error: j.error?.message ?? `HTTP ${r.status}` };
    return j;
  }
  get = (u: string) => this.call("GET", u);
}

export interface OwnerRules {
  /** EUR/mois par projet ; absent = plafond bas par défaut. */
  projectCapsEur?: Record<string, number>;
  /** Projets dont la facturation est coupée au dépassement (fonction billing-cap). */
  hardCap?: string[];
  /** Autorise les dépenses nouvelles (création de ressources payantes). Absent = false. */
  allowNewSpend?: boolean;
}

export function loadOwnerRules(root: string): OwnerRules | null {
  const p = join(root, ".agents", "owner-rules.json");
  if (!existsSync(p)) return null;
  const j = JSON.parse(readFileSync(p, "utf8")) as Json;
  return (j.billing ?? j) as OwnerRules;
}

interface Snapshot {
  accounts: Json[];
  links: Record<string, Json[]>;
  budgets: Record<string, Json[]>;
  lastSpend: Record<string, { cost: number; amount: number; at: string }>;
}

async function snapshot(api: Api): Promise<Snapshot> {
  const accounts = ((
    await api.get("https://cloudbilling.googleapis.com/v1/billingAccounts")
  ).billingAccounts ?? []) as Json[];
  const links: Snapshot["links"] = {};
  const budgets: Snapshot["budgets"] = {};
  await Promise.all(
    accounts
      .filter((a) => a.open)
      .map(async (a) => {
        const id = String(a.name).split("/")[1]!;
        links[id] = ((
          await api.get(
            `https://cloudbilling.googleapis.com/v1/${a.name}/projects`,
          )
        ).projectBillingInfo ?? []) as Json[];
        budgets[id] = ((
          await api.get(
            `https://billingbudgets.googleapis.com/v1/${a.name}/budgets`,
          )
        ).budgets ?? []) as Json[];
      }),
  );
  // Dernière dépense connue par budget : journaux de la fonction billing-cap (une ligne par notification).
  // entries:list renvoie des pages vides tant que le balayage n'est pas fini : suivre nextPageToken.
  const since = new Date(Date.now() - 3 * 86400_000).toISOString();
  const entries: Json[] = [];
  let pageToken: string | undefined;
  for (let i = 0; i < 20 && entries.length < 200; i++) {
    const logs = await api.call(
      "POST",
      "https://logging.googleapis.com/v2/entries:list",
      {
        resourceNames: [`projects/${QUOTA_PROJECT}`],
        filter: `resource.type="cloud_run_revision" AND resource.labels.service_name="billing-cap" AND jsonPayload.budget:* AND timestamp>="${since}"`,
        orderBy: "timestamp desc",
        pageSize: 200,
        pageToken,
      },
    );
    entries.push(...((logs.entries ?? []) as Json[]));
    pageToken = logs.nextPageToken;
    if (!pageToken) break;
  }
  const lastSpend: Snapshot["lastSpend"] = {};
  for (const e of entries) {
    const b = e.jsonPayload?.budget as string | undefined;
    if (b && !lastSpend[b])
      lastSpend[b] = {
        cost: e.jsonPayload.cost,
        amount: e.jsonPayload.amount,
        at: e.timestamp,
      };
  }
  return { accounts, links, budgets, lastSpend };
}

const money = (a?: Json) =>
  a?.specifiedAmount
    ? `${a.specifiedAmount.units ?? 0} ${a.specifiedAmount.currencyCode}`
    : "dernière période";

async function idleFindings(api: Api, project: string): Promise<string[]> {
  const out: string[] = [];
  const agg = async (kind: string) =>
    (await api.get(
      `https://compute.googleapis.com/compute/v1/projects/${project}/aggregated/${kind}?maxResults=500`,
    )) as Json;
  const [vms, disks, addrs] = await Promise.all([
    agg("instances"),
    agg("disks"),
    agg("addresses"),
  ]);
  if (vms.error)
    return [`${project} : compute non lisible (${vms.error.split(".")[0]})`];
  const items = (j: Json) =>
    Object.values(j.items ?? {}).flatMap(
      (s: any) => s[Object.keys(s).find((k) => k !== "warning")!] ?? [],
    ) as Json[];
  for (const v of items(vms))
    if (v.status !== "RUNNING")
      out.push(
        `${project} : VM ${v.name} ${v.status} (disques toujours facturés)`,
      );
  for (const d of items(disks))
    if (!d.users?.length)
      out.push(
        `${project} : disque ${d.name} ${d.sizeGb} Go non attaché → snapshot puis arrêt`,
      );
  for (const a of items(addrs))
    if (a.status === "RESERVED")
      out.push(`${project} : IP ${a.name} (${a.address}) réservée inutilisée`);
  for (const r of [
    "google.compute.instance.IdleResourceRecommender",
    "google.compute.disk.IdleResourceRecommender",
    "google.compute.address.IdleResourceRecommender",
    "google.compute.image.IdleResourceRecommender",
  ]) {
    for (const loc of ["global", "us-central1", "europe-west1"]) {
      const j = await api.get(
        `https://recommender.googleapis.com/v1/projects/${project}/locations/${loc}/recommenders/${r}/recommendations`,
      );
      for (const rec of (j.recommendations ?? []) as Json[])
        out.push(`${project} : ${rec.description}`);
    }
  }
  const ep = await api.get(
    `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/us-central1/endpoints`,
  );
  for (const e of (ep.endpoints ?? []) as Json[])
    if (e.deployedModels?.length)
      out.push(
        `${project} : endpoint Vertex ${e.displayName} avec modèle déployé (facturé à l'heure)`,
      );
  return out;
}

export async function runBillingCommand(
  root: string,
  args: readonly string[],
): Promise<number> {
  const sub = args[0] ?? "status";
  const asOwner = args.includes("--owner");
  const json = args.includes("--json");
  const api = new Api(token(asOwner || sub === "relink"));
  const rules = loadOwnerRules(root);

  if (sub === "status") {
    const s = await snapshot(api);
    if (json)
      return (
        console.log(JSON.stringify({ ...s, ownerRules: rules }, null, 2)),
        0
      );
    for (const a of s.accounts.filter((x) => x.open)) {
      const id = String(a.name).split("/")[1]!;
      console.log(
        `compte ${id} « ${a.displayName} » ${a.currencyCode ?? ""} parent=${a.parent ?? "-"}`,
      );
      console.log(
        `  crédits : aucune API publique → https://console.cloud.google.com/billing/${id}/credits/all`,
      );
      for (const p of s.links[id] ?? [])
        console.log(
          `  projet ${p.projectId} facturation=${p.billingEnabled ? "on" : "off"}`,
        );
      for (const b of s.budgets[id] ?? []) {
        const ls = s.lastSpend[b.displayName];
        const spend = ls
          ? ` dépensé=${ls.cost}/${ls.amount} (${ls.at.slice(0, 16)})`
          : "";
        const topic = b.spendCap
          ? `spend-cap:${b.spendCap.outputState}`
          : b.notificationsRule?.pubsubTopic
            ? "pubsub"
            : "email";
        console.log(
          `  budget ${b.displayName} ${money(b.amount)} seuils=${(b.thresholdRules ?? []).map((t: Json) => t.thresholdPercent).join("/")} ${topic}${spend}`,
        );
      }
    }
    console.log(
      `règles propriétaire : ${rules ? "présentes" : "absentes → aucune dépense nouvelle"}`,
    );
    return 0;
  }

  if (sub === "plan" || sub === "apply") {
    const s = await snapshot(api);
    const actions: { what: string; run: () => Promise<Json> }[] = [];
    const notes: string[] = [];
    for (const [id, projects] of Object.entries(s.links)) {
      const bs = s.budgets[id] ?? [];
      if (!bs.some((b) => !b.budgetFilter?.projects?.length))
        notes.push(`compte ${id} : pas de budget global`);
      for (const b of bs)
        // Les budgets spend cap (budgetFilter.services + spendCap) refusent un topic Pub/Sub.
        if (!b.spendCap && b.notificationsRule?.pubsubTopic !== BILLING_TOPIC)
          actions.push({
            what: `brancher le budget ${b.displayName} sur ${BILLING_TOPIC}`,
            run: () =>
              api.call(
                "PATCH",
                `https://billingbudgets.googleapis.com/v1/${b.name}?updateMask=notificationsRule`,
                {
                  notificationsRule: {
                    pubsubTopic: BILLING_TOPIC,
                    schemaVersion: "1.0",
                  },
                },
              ),
          });
      for (const p of projects.filter((x) => x.billingEnabled)) {
        const num = await api.get(
          `https://cloudresourcemanager.googleapis.com/v3/projects/${p.projectId}`,
        );
        const has = bs.some(
          (b) =>
            !b.spendCap && (b.budgetFilter?.projects ?? []).includes(num.name),
        );
        if (has || !num.name) continue;
        const cap =
          rules?.projectCapsEur?.[p.projectId] ?? DEFAULT_PROJECT_CAP_EUR;
        actions.push({
          what: `budget project-${p.projectId}-${cap}eur-month`,
          run: () =>
            api.call(
              "POST",
              `https://billingbudgets.googleapis.com/v1/billingAccounts/${id}/budgets`,
              {
                displayName: `project-${p.projectId}-${cap}eur-month`,
                budgetFilter: {
                  projects: [num.name],
                  creditTypesTreatment: "INCLUDE_ALL_CREDITS",
                  calendarPeriod: "MONTH",
                },
                amount: {
                  specifiedAmount: { currencyCode: "EUR", units: String(cap) },
                },
                thresholdRules: THRESHOLDS,
                notificationsRule: {
                  pubsubTopic: BILLING_TOPIC,
                  schemaVersion: "1.0",
                },
              },
            ),
        });
      }
      for (const p of projects.filter((x) => x.billingEnabled))
        notes.push(...(await idleFindings(api, p.projectId)));
    }
    if (!rules)
      notes.push(
        "`.agents/owner-rules.json` absent : aucune dépense nouvelle, plafonds bas par défaut",
      );
    for (const a of actions)
      console.log(`${sub === "apply" ? "applique" : "à faire"} : ${a.what}`);
    for (const n of notes) console.log(`recommandation : ${n}`);
    if (sub === "plan") return 0;
    let fail = 0;
    for (const a of actions) {
      const r = await a.run();
      if (r.error) (fail++, console.error(`échec : ${a.what} : ${r.error}`));
    }
    return fail ? 1 : 0;
  }

  if (sub === "lift") {
    // Lève un spend cap déclenché pour la période en cours (PATCH spendCap.inputState=AWAITING_NEXT_PERIOD).
    const name = args[1];
    if (!name)
      return (console.error("usage : env-kit billing lift <cap-...>"), 1);
    const s = await snapshot(api);
    const b = Object.values(s.budgets)
      .flat()
      .find((x) => x.displayName === name);
    if (!b) return (console.error(`budget ${name} introuvable`), 1);
    const r = await api.call(
      "PATCH",
      `https://billingbudgets.googleapis.com/v1/${b.name}?updateMask=spendCap.inputState`,
      { spendCap: { inputState: "AWAITING_NEXT_PERIOD" } },
    );
    console.log(
      r.error ? `échec : ${r.error}` : `${name} : ${r.spendCap?.outputState}`,
    );
    return r.error ? 1 : 0;
  }

  if (sub === "relink") {
    const project = args[1];
    const account = args[2] ?? "017AB5-0FC923-9CCFE5";
    if (!project)
      return (
        console.error("usage : env-kit billing relink <projet> [compte]"),
        1
      );
    const r = await api.call(
      "PUT",
      `https://cloudbilling.googleapis.com/v1/projects/${project}/billingInfo`,
      { billingAccountName: `billingAccounts/${account}` },
    );
    console.log(
      r.error
        ? `échec : ${r.error}`
        : `${project} → ${r.billingAccountName} (facturation ${r.billingEnabled ? "on" : "off"})`,
    );
    return r.error ? 1 : 0;
  }

  console.error(
    "usage : env-kit billing <status|plan|apply|lift <cap>|relink <projet> [compte]> [--json] [--owner]",
  );
  return 1;
}
