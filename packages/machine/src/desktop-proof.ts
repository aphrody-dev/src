// Preuve agent-desktop sur Chrome réel (UIA, mode sémantique headless) : naviguer, lire, cliquer.
// bun packages/machine/src/desktop-proof.ts <window-id> <url>... ; une ligne JSON par site.
// Ne clique que des liens au nom unique, hors connexion/inscription/contact.
const [win, ...urls] = Bun.argv.slice(2);
const AVOID =
  /log ?in|sign|connexion|inscri|account|compte|contact|demo|sales|cookie|accept|refuser|reject|tout/i;

const ad = (...a: string[]) => {
  const p = Bun.spawnSync(["agent-desktop.exe", ...a]);
  return JSON.parse(p.stdout.toString() || "{}");
};
const title = () =>
  (ad("list-windows", "--app", "chrome.exe").data ?? []).find(
    (w: { id: string }) => w.id === win,
  )?.title ?? "";
const waitTitle = async (prev: string, ms = 15000) => {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    const t = title();
    if (t && t !== prev && !/^(Nouvel onglet|New Tab|Chargement)/.test(t))
      return t;
    await Bun.sleep(250);
  }
  return title();
};
type N = {
  role?: string;
  name?: string;
  value?: string;
  ref_id?: string;
  states?: string[];
  children?: N[];
};
const flat = (n: N, out: N[] = []) => {
  out.push(n);
  for (const c of n.children ?? []) flat(c, out);
  return out;
};
const clock = () => {
  const t0 = performance.now();
  return () => Math.round(performance.now() - t0);
};

for (const url of urls) {
  const rec: Record<string, unknown> = { url };
  let t = clock();
  // omnibox = le textfield de la barre d'outils du navigateur (pas un champ de la page)
  const omni = (
    ad("find", "--window-id", win, "--role", "textfield").data?.matches ?? []
  ).find((m: { path: string[] }) => m.path.includes("toolbar"))?.ref_id;
  const before = title();
  // espace final : l'omnibox ne complète pas en ligne une saisie terminée par un blanc
  const sv = ad("set-value", omni, `${url} `);
  // Chrome reformate l'URL affichée : la relecture diffère, l'action a quand même eu lieu
  rec.set_value = sv.ok
    ? sv.data?.disposition?.delivery
    : `${sv.error?.code}/${sv.error?.details?.kind ?? ""}`;
  rec.press = ad("press", "return", "--window-id", win).data?.disposition
    ?.delivery;
  rec.title = await waitTitle(before);
  rec.nav_ms = t();
  await Bun.sleep(1500); // rendu et settle UIA de la nouvelle page
  t = clock();
  const snap = ad(
    "snapshot",
    "--window-id",
    win,
    "--compact",
    "-i",
    "--max-depth",
    "30",
    "--timeout-ms",
    "8000",
  );
  rec.snapshot_ms = t();
  const nodes = flat(snap.data?.tree ?? {});
  rec.refs = snap.data?.ref_count;
  rec.complete = snap.data?.complete;
  const links = nodes.filter((n) => n.role === "link" && n.name && n.ref_id);
  rec.links = links.length;
  const host = new URL(url).hostname.replace(/^www\./, "");
  const count = new Map<string, number>();
  for (const l of links) count.set(l.name!, (count.get(l.name!) ?? 0) + 1);
  const pick = links.find(
    (l) =>
      count.get(l.name!) === 1 &&
      !AVOID.test(l.name!) &&
      !/^(home|accueil|\w+( logo)?)$/i.test(l.name!) && // logo ou nom de marque : retour à l'accueil
      !/\/home$/.test(l.value ?? "") &&
      (l.value ?? "").includes(host) &&
      !(l.value ?? "").includes("#") &&
      new URL(l.value!).pathname.length > 1,
  );
  rec.read = links.slice(0, 6).map((l) => l.name);
  if (pick) {
    rec.click_target = `${pick.name} -> ${pick.value}`;
    t = clock();
    const c = ad("click", pick.ref_id!);
    rec.click = c.ok ? c.data?.steps?.[0]?.label : c.error?.code;
    rec.after_click_title = await waitTitle(rec.title as string);
    rec.click_ms = t();
  }
  console.log(JSON.stringify(rec));
}
