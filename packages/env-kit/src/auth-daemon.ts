/**
 * `ay auth daemon` : un seul service d'authentification par hôte, à la place des relances de connexion.
 *
 * - Sonde l'état réel de chaque identifiant toutes les `--every` minutes (5 par défaut) : `auth-state.json` n'est
 *   jamais plus vieux que cette période, et `ay auth status` reste une sonde directe (aucun cache).
 * - Rafraîchit seul ce qui se rafraîchit sans humain (`repair` sans navigateur : jeton gh du trousseau, secrets CI,
 *   tunnels, clés ssh) ; les jetons à refresh token (gcloud, impersonation de compte de service, codex, claude
 *   setup-token) se renouvellent dans leur CLI à chaque sonde.
 * - Dernier recours : un identifiant qui exige un clic n'est signalé qu'une fois par 24 h, tous regroupés dans une
 *   seule notification ; aucune page n'est ouverte, aucune connexion relancée. Le propriétaire répond par
 *   `ay auth daemon --ack <cible>` : une seule connexion est alors lancée pour cette cible.
 * Fichiers : <état>/auth-state.json (dernière sonde), <état>/auth-prompts.json (derniers signalements).
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { type AuthOptions, type Check, collectChecks, type Manifest, runAuth } from "./auth";
import { secretGet, secretList } from "./secret-store";

const DAY = 86_400_000;

/** Le PC porte le coffre de référence : secrets CI, OIDC, flotte, tunnels et jetons d'API y sont sondés et poussés. */
const PC = process.platform === "win32" || process.env.AY_AUTH_REFRESH_ALL === "1";
/**
 * Identifiants dont un runner Linux a besoin (infra/agents/runner.ts : gh pour le push, claude et codex pour les
 * tâches) ; les autres CLI (cf, wrangler, vercel, gcloud, portées gh admin) sont l'affaire du PC, qui pousse les
 * valeurs. AY_AUTH_TARGETS (liste séparée par des virgules) remplace cette liste.
 */
export const RUNNER_TARGETS = (process.env.AY_AUTH_TARGETS ?? "gh,claude,codex").split(",").filter(Boolean);
export const scope = (checks: Check[], pc = PC) =>
  pc ? checks : checks.filter((c) => c.kind === "store" || RUNNER_TARGETS.includes(c.target));

export const stateDir = () =>
  process.env.AY_AUTH_STATE ??
  (process.platform === "win32"
    ? join(process.env.LOCALAPPDATA ?? homedir(), "aphrody", "auth")
    : join(process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"), "aphrody", "auth"));

const readJson = <T>(p: string, d: T): T => {
  try {
    return JSON.parse(readFileSync(p, "utf8")) as T;
  } catch {
    return d;
  }
};
const writeJson = (p: string, v: unknown) => {
  writeFileSync(`${p}.tmp`, JSON.stringify(v, null, 2), { mode: 0o600 });
  renameSync(`${p}.tmp`, p);
};

const key = (c: Check) => `${c.host}/${c.target}`;
/** Identifiant qui attend un geste humain (pas une simple absence d'outil). */
// Seuls les identifiants d'une personne (CLI, navigateur, jetons d'API) peuvent exiger son geste ; les écarts de CI,
// d'OIDC, de flotte ou d'unités sont du travail d'agent, gardés dans auth-state.json mais jamais signalés au propriétaire.
const OWNER_KINDS = new Set(["cli", "browser", "token", "store"]);
export const needsOwner = (c: Check) => OWNER_KINDS.has(c.kind) && (c.status === "action" || c.status === "invalid");

/** Cibles à signaler maintenant : au plus une fois par 24 h chacune. */
export function due(checks: Check[], prompts: Record<string, number>, now = Date.now()): Check[] {
  return checks.filter((c) => needsOwner(c) && now - (prompts[key(c)] ?? 0) >= DAY);
}

function notify(title: string, lines: string[]) {
  const body = lines.slice(0, 12).join("\n");
  if (process.platform === "win32") {
    // Notification Windows native (une seule, groupée) ; aucun navigateur.
    const esc = (s: string) => s.replace(/[<>&'"]/g, (m) => `&#${m.charCodeAt(0)};`);
    const xml = `<toast><visual><binding template='ToastGeneric'><text>${esc(title)}</text><text>${esc(body)}</text></binding></visual></toast>`;
    const ps = `$x=New-Object Windows.Data.Xml.Dom.XmlDocument; $x.LoadXml('${xml.replace(/'/g, "''")}'); [Windows.UI.Notifications.ToastNotificationManager,Windows.UI.Notifications,ContentType=WindowsRuntime] > $null; [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('aphrody auth').Show([Windows.UI.Notifications.ToastNotification]::new($x))`;
    spawnSync("pwsh", ["-NoProfile", "-NonInteractive", "-Command", ps], { windowsHide: true, timeout: 30_000 });
  }
  const out = join(stateDir(), "auth-pending.md");
  writeFileSync(out, `# ${title}\n\n${lines.map((l) => `- ${l}`).join("\n")}\n`, { mode: 0o600 });
}

export async function pass(m: Manifest, o: AuthOptions, refresh: boolean) {
  const at = new Date().toISOString();
  // Valeurs du coffre à chaque passe : un jeton tourné ailleurs ne laisse pas une copie périmée dans l'environnement.
  for (const n of secretList()) {
    // Valeur sans fin de ligne : systemd-creds rend souvent un \n final, refusé dans un en-tête HTTP.
    const v = secretGet(n)?.trim();
    if (v) process.env[n] = v;
  }
  // Rafraîchissement sans humain d'abord, puis la sonde qui fait foi.
  // Le PC (coffre de référence) répare tout ; les autres hôtes seulement leurs CLI et leur stockage, pour qu'aucun
  // hôte ne pousse ses copies vers les secrets GitHub ou la flotte.
  const only = PC ? o.only : ["cli", "store"];
  if (refresh) await collectChecks(m, { ...o, only, browser: false }, true).catch(() => []);
  const checks = scope(await collectChecks(m, { ...o, only: PC ? o.only : ["cli", "store"], browser: false }, false));
  const dir = stateDir();
  mkdirSync(dir, { recursive: true });
  writeJson(join(dir, "auth-state.json"), { at, checks });
  const pf = join(dir, "auth-prompts.json");
  const prompts = readJson<Record<string, number>>(pf, {});
  const now = Date.now();
  const d = due(checks, prompts, now);
  if (d.length) {
    notify(
      `${d.length} identifiant(s) à reconnecter`,
      d.map((c) => `${key(c)} : ${c.fix ?? c.proof} ; puis ay auth daemon --ack ${c.target}`),
    );
    for (const c of d) prompts[key(c)] = now;
    writeJson(pf, prompts);
  }
  return { at, total: checks.length, owner: checks.filter(needsOwner).map(key), notified: d.map(key) };
}

export async function daemon(m: Manifest, o: AuthOptions): Promise<number> {
  const a = o.args ?? [];
  const opt = (n: string) => (a.includes(n) ? a[a.indexOf(n) + 1] : undefined);
  const ack = opt("--ack");
  if (ack) {
    // Signal du propriétaire : une seule connexion pour cette cible, jamais de boucle.
    return runAuth("login", { ...o, args: [ack.replace(/^gcloud:.*/, "gcloud")] });
  }
  const every = Math.max(1, Number(opt("--every") ?? 5)) * 60_000;
  const refreshEvery = Math.max(every, Number(opt("--refresh") ?? 30) * 60_000);
  let lastRefresh = 0;
  do {
    const refresh = Date.now() - lastRefresh >= refreshEvery;
    if (refresh) lastRefresh = Date.now();
    const r = await pass(m, o, refresh);
    console.log(JSON.stringify(r));
    if (a.includes("--once")) break;
    await Bun.sleep(every);
  } while (true);
  return 0;
}

/** Dernière sonde si elle a moins de `maxAgeMs` (5 min par défaut), sinon undefined : jamais d'état périmé. */
export function lastState(maxAgeMs = 5 * 60_000): { at: string; checks: Check[] } | undefined {
  const p = join(stateDir(), "auth-state.json");
  if (!existsSync(p)) return undefined;
  const s = readJson<{ at: string; checks: Check[] } | undefined>(p, undefined);
  return s && Date.now() - Date.parse(s.at) <= maxAgeMs ? s : undefined;
}
