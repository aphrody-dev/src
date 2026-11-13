// Plafonnement de facturation : budget Cloud Billing -> Pub/Sub billing-alerts -> cette fonction.
// Modèle officiel « cap costs » (docs.cloud.google.com/billing/docs/how-to/disable-billing-with-notifications),
// réécrit sans dépendance : jeton du serveur de métadonnées + REST Cloud Billing v1.
// Agit seulement si : budget nommé « project-<id>-<N>eur-month », <id> dans CAP_PROJECTS, coût > montant, DRY_RUN=0.
// Couper la facturation arrête tous les services du projet ; réactivation : `env-kit billing relink <id>`.

const CAP = new Set(
  (process.env.CAP_PROJECTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);
const DRY = process.env.DRY_RUN !== "0";
const API = "https://cloudbilling.googleapis.com/v1";

async function token() {
  const r = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" } },
  );
  if (!r.ok) throw new Error(`metadata ${r.status}`);
  return (await r.json()).access_token;
}

function log(severity, message, extra = {}) {
  console.log(JSON.stringify({ severity, message, ...extra }));
}

exports.capBilling = async (event) => {
  const msg = event?.data?.message ?? event?.message ?? event;
  const raw = msg?.data ? Buffer.from(msg.data, "base64").toString() : "{}";
  const d = JSON.parse(raw);
  const name = d.budgetDisplayName ?? "";
  const m = /^project-([a-z][a-z0-9-]{4,28}[a-z0-9])-\d+eur-/.exec(name);
  const ctx = {
    budget: name,
    cost: d.costAmount,
    amount: d.budgetAmount,
    threshold: d.alertThresholdExceeded,
  };
  if (!m) return log("INFO", "budget hors projet, alerte seule", ctx);
  const project = m[1];
  if (!(d.costAmount > d.budgetAmount))
    return log("INFO", "sous le plafond", { project, ...ctx });
  if (!CAP.has(project))
    return log("WARNING", "plafond depasse, projet non arme (alerte seule)", {
      project,
      ...ctx,
    });
  const t = await token();
  const h = {
    Authorization: `Bearer ${t}`,
    "Content-Type": "application/json",
  };
  const info = await (
    await fetch(`${API}/projects/${project}/billingInfo`, { headers: h })
  ).json();
  if (!info.billingEnabled)
    return log("INFO", "facturation deja coupee", { project });
  if (DRY)
    return log("WARNING", "DRY_RUN : coupure simulee", {
      project,
      account: info.billingAccountName,
      ...ctx,
    });
  const r = await fetch(`${API}/projects/${project}/billingInfo`, {
    method: "PUT",
    headers: h,
    body: JSON.stringify({ billingAccountName: "" }),
  });
  log(
    r.ok ? "ALERT" : "ERROR",
    r.ok ? "facturation coupee" : `echec coupure ${r.status}`,
    {
      project,
      previousAccount: info.billingAccountName,
      ...ctx,
    },
  );
};
