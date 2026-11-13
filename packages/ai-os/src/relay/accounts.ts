// Synchronisation des comptes du propriétaire : chaque adresse de ACCOUNTS est propriétaire partout où les CLI déjà
// authentifiées le permettent. Idempotent : seul l'écart est appliqué ; `apply: false` (défaut) ne fait que le relevé.
//   GitHub    : organisations dont le compte gh est admin -> invitation par e-mail, rôle admin (POST /orgs/{org}/invitations)
//   gcloud    : projets listés par le compte actif -> roles/owner pour user:<adresse>
//   Cloudflare: comptes visibles par le jeton -> membre « Super Administrator » (API /accounts/{id}/members)
// Non automatisable sans connexion de l'utilisateur : npm (npm login), Vercel (offre Hobby : pas de membres), OVH,
// Microsoft 365 / Outlook (aucune session CLI) ; signalés dans le relevé.
export const ACCOUNTS = (
  Bun.env.RELAY_OWNER_EMAILS ??
  [
    "contact@aphrody.com",
    Bun.env.APHRODY_OWNER_GOOGLE_ACCOUNT,
    Bun.env.APHRODY_AI_GOOGLE_ACCOUNT,
  ]
    .filter(Boolean)
    .join(",")
)
  .split(",")
  .map((s) => s.trim().toLowerCase());

type Step = {
  target: string;
  account: string;
  state: "present" | "missing" | "applied" | "error" | "manual";
  detail?: string;
};
const run = async (argv: string[], input?: string) => {
  const p = Bun.spawn(argv, {
    stdout: "pipe",
    stderr: "pipe",
    stdin: input ? new Blob([input]) : "ignore",
  });
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  return { out: out.trim(), err: err.trim(), code };
};

async function github(apply: boolean): Promise<Step[]> {
  const steps: Step[] = [];
  const orgs = (
    await run([
      "gh",
      "api",
      "user/memberships/orgs",
      "-q",
      '.[]|select(.role=="admin" and .state=="active")|.organization.login',
    ])
  ).out
    .split(/\r?\n/)
    .filter(Boolean);
  for (const org of orgs) {
    // Adresses déjà membres (e-mail public ou vérifié visible) ou déjà invitées.
    const invited = new Set(
      (
        await run([
          "gh",
          "api",
          `orgs/${org}/invitations`,
          "-q",
          ".[].email // empty",
        ])
      ).out
        .toLowerCase()
        .split(/\r?\n/)
        .filter(Boolean),
    );
    for (const email of ACCOUNTS) {
      const target = `github:${org}`;
      if (invited.has(email)) {
        steps.push({
          target,
          account: email,
          state: "present",
          detail: "invitation en attente",
        });
        continue;
      }
      if (!apply) {
        steps.push({ target, account: email, state: "missing" });
        continue;
      }
      const r = await run([
        "gh",
        "api",
        "-X",
        "POST",
        `orgs/${org}/invitations`,
        "-f",
        `email=${email}`,
        "-f",
        "role=admin",
      ]);
      const already =
        /already a part|is already a member|already been invited/i.test(
          r.out + r.err,
        );
      steps.push({
        target,
        account: email,
        state: r.code === 0 ? "applied" : already ? "present" : "error",
        detail:
          r.code === 0
            ? "invitation admin envoyée"
            : (r.out || r.err).slice(0, 200),
      });
    }
  }
  return steps;
}

async function gcloud(apply: boolean): Promise<Step[]> {
  const steps: Step[] = [];
  const projects = (
    await run(["gcloud", "projects", "list", "--format=value(projectId)"])
  ).out
    .split(/\r?\n/)
    .filter(Boolean);
  const scope = (Bun.env.RELAY_GCP_PROJECTS ?? "").split(",").filter(Boolean);
  for (const p of scope.length
    ? projects.filter((x) => scope.includes(x))
    : projects) {
    const owners = new Set(
      (
        await run([
          "gcloud",
          "projects",
          "get-iam-policy",
          p,
          "--flatten=bindings[].members",
          "--filter=bindings.role:roles/owner",
          "--format=value(bindings.members)",
        ])
      ).out
        .toLowerCase()
        .split(/\r?\n/),
    );
    for (const email of ACCOUNTS) {
      const target = `gcloud:${p}`;
      if (owners.has(`user:${email}`)) {
        steps.push({ target, account: email, state: "present" });
        continue;
      }
      if (!apply) {
        steps.push({ target, account: email, state: "missing" });
        continue;
      }
      const r = await run([
        "gcloud",
        "projects",
        "add-iam-policy-binding",
        p,
        `--member=user:${email}`,
        "--role=roles/owner",
        "--condition=None",
        "--quiet",
        "--format=none",
      ]);
      // Projet hors organisation : Google impose une invitation de propriétaire par la console (SOLO_MUST_INVITE_OWNERS).
      const invite = /SOLO_MUST_INVITE_OWNERS/.test(r.err + r.out);
      steps.push({
        target,
        account: email,
        state: r.code === 0 ? "applied" : invite ? "manual" : "error",
        detail:
          r.code === 0
            ? "roles/owner"
            : invite
              ? `invitation propriétaire par la console : https://console.cloud.google.com/iam-admin/iam?project=${p}`
              : r.err.split(/\r?\n/).at(-1)?.slice(0, 240),
      });
    }
  }
  return steps;
}

async function cloudflare(apply: boolean): Promise<Step[]> {
  const token = Bun.env.CLOUDFLARE_API_TOKEN;
  if (!token)
    return [
      {
        target: "cloudflare",
        account: "*",
        state: "manual",
        detail:
          "CLOUDFLARE_API_TOKEN absent (droit Account Members:Edit requis)",
      },
    ];
  const cf = async (path: string, init?: RequestInit) =>
    (
      await fetch(`https://api.cloudflare.com/client/v4${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
        },
      })
    ).json() as Promise<any>;
  const steps: Step[] = [];
  for (const acc of (await cf("/accounts")).result ?? []) {
    const members = await cf(`/accounts/${acc.id}/members?per_page=50`);
    if (!members.success) {
      steps.push({
        target: `cloudflare:${acc.name}`,
        account: "*",
        state: "manual",
        detail: members.errors?.[0]?.message ?? "lecture des membres refusée",
      });
      continue;
    }
    const have = new Set(
      (members.result ?? []).map((m: any) =>
        String(m.user?.email ?? "").toLowerCase(),
      ),
    );
    const roles = (await cf(`/accounts/${acc.id}/roles`)).result ?? [];
    const superAdmin = roles.find((r: any) =>
      /Super Administrator/i.test(r.name),
    )?.id;
    for (const email of ACCOUNTS) {
      const target = `cloudflare:${acc.name}`;
      if (have.has(email)) {
        steps.push({ target, account: email, state: "present" });
        continue;
      }
      if (!apply || !superAdmin) {
        steps.push({
          target,
          account: email,
          state: "missing",
          detail: superAdmin
            ? undefined
            : "rôle Super Administrator introuvable",
        });
        continue;
      }
      const r = await cf(`/accounts/${acc.id}/members`, {
        method: "POST",
        body: JSON.stringify({ email, roles: [superAdmin], status: "pending" }),
      });
      steps.push({
        target,
        account: email,
        state: r.success ? "applied" : "error",
        detail: r.success
          ? "invitation Super Administrator"
          : r.errors?.[0]?.message,
      });
    }
  }
  return steps;
}

export async function accountsSync(apply = false) {
  const steps = [
    ...(await github(apply)),
    ...(await gcloud(apply)),
    ...(await cloudflare(apply)),
  ];
  steps.push(
    {
      target: "npm",
      account: "*",
      state: "manual",
      detail:
        "npm login puis npm org set <org> <utilisateur> owner (npm adresse des utilisateurs, pas des e-mails)",
    },
    {
      target: "vercel",
      account: "*",
      state: "manual",
      detail: "équipe aphrody-dev en offre Hobby : pas de membres",
    },
    {
      target: "ovh / microsoft-365 / outlook",
      account: "*",
      state: "manual",
      detail: "aucune session CLI : connexion de l'utilisateur requise",
    },
  );
  return { apply, accounts: ACCOUNTS, steps };
}
