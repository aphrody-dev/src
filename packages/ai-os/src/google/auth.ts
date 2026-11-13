// Authentification Google sans clé d'API pour les clients absorbés de google-labs-code (Stitch) et le relais : jeton
// OAuth du compte gcloud actif + projet de facturation (RELAY_GCP_QUOTA_PROJECT, sinon le projet gcloud courant).
// gcloud est lancé sans bloquer la boucle d'événements (un spawnSync gelait le relais plusieurs secondes) et le
// jeton est gardé 45 min (durée de vie 1 h). Les valeurs ne sont jamais journalisées.

let cache: { at: number; token: string; project: string } | null = null;

const run = async (a: string[]) => {
  const p = Bun.spawn(["gcloud", ...a], { stdout: "pipe", stderr: "ignore" });
  return (await new Response(p.stdout).text()).trim();
};

export async function gcloudCredentials(): Promise<{
  token: string;
  project: string;
}> {
  if (cache && Date.now() - cache.at < 45 * 60_000) return cache;
  const [token, project] = await Promise.all([
    run(["auth", "print-access-token"]),
    Bun.env.RELAY_GCP_QUOTA_PROJECT ?? run(["config", "get-value", "project"]),
  ]);
  cache = { at: Date.now(), token, project };
  return cache;
}

/** En-têtes Bearer + projet de quota (format attendu par stitch.googleapis.com/mcp). */
export async function gcloudHeaders(): Promise<Record<string, string>> {
  const { token, project } = await gcloudCredentials();
  return { authorization: `Bearer ${token}`, "x-goog-user-project": project };
}
