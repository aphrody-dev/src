#!/usr/bin/env bun
// Démarrage du proxy LiteLLM sur un hôte Linux (prd) sans fichier de secrets en clair :
//   1. identifiants systemd-creds ($CREDENTIALS_DIRECTORY, LoadCredentialEncrypted=) -> environnement du proxy ;
//   2. `ay ai config --manifest <ai.toml>` écrit les routes (références os.environ/X, aucune valeur) ;
//   3. infra/ai/litellm-overlay.toml : routes retirées pour l'hôte, extra_headers, plafonds de dépense ;
//   4. exec litellm sur la config retouchée ($RUNTIME_DIRECTORY, 0600).
// Usage (unité) : bun litellm-serve.ts [--manifest ai.toml] [--overlay litellm-overlay.toml] [--dry-run]
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir, hostname } from "node:os";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    manifest: { type: "string", default: join(import.meta.dir, "ai.toml") },
    overlay: {
      type: "string",
      default: join(import.meta.dir, "litellm-overlay.toml"),
    },
    ay: {
      type: "string",
      default: Bun.which("ay") ?? join(homedir(), ".local/bin/ay"),
    },
    litellm: {
      type: "string",
      default: Bun.which("litellm") ?? join(homedir(), ".local/bin/litellm"),
    },
    "dry-run": { type: "boolean" },
  },
});

const env: Record<string, string> = {
  ...(process.env as Record<string, string>),
};
const credDir = env.CREDENTIALS_DIRECTORY;
if (credDir && existsSync(credDir))
  for (const name of readdirSync(credDir))
    env[name] = readFileSync(join(credDir, name), "utf8").trim();

// Comptes de service en JSON : exposés sous AY_VERTEX_<PROJET>, le nom que `ay ai config` référence.
for (const v of Object.values(env)) {
  if (!v.startsWith("{") || !v.includes("private_key")) continue;
  try {
    const sa = JSON.parse(v);
    if (sa.project_id)
      env[
        `AY_VERTEX_${String(sa.project_id)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "_")}`
      ] = v;
  } catch {}
}

const gen = Bun.spawnSync(
  [values.ay!, "ai", "config", "--manifest", values.manifest!],
  { env, stdout: "pipe", stderr: "pipe" },
);
if (gen.exitCode !== 0) {
  console.error(`ay ai config : ${gen.stderr.toString().trim().slice(-400)}`);
  process.exit(1);
}
const manifest: any = Bun.TOML.parse(readFileSync(values.manifest!, "utf8"));
const cfgPath = String(
  manifest.settings?.config ?? "~/.config/ay/litellm.yaml",
).replace(/^~/, homedir());
const cfg: any = JSON.parse(readFileSync(cfgPath, "utf8"));
const ov: any = existsSync(values.overlay!)
  ? Bun.TOML.parse(readFileSync(values.overlay!, "utf8"))
  : {};
const host = env.AY_AI_HOST ?? hostname().split(".")[0]!;
const resolve = (v: unknown) =>
  typeof v === "string" && v.startsWith("env:")
    ? `os.environ/${v.slice(4)}`
    : v;
// LiteLLM ne résout os.environ/ qu'au premier niveau de litellm_params : les en-têtes reçoivent la valeur.
const value = (v: unknown) =>
  typeof v === "string" && v.startsWith("env:") ? env[v.slice(4)] : v;

const drop = new Set<string>([
  ...(ov.drop?.[host] ?? []),
  ...(ov.drop?.["*"] ?? []),
]);
const missing: string[] = [];
cfg.model_list = (cfg.model_list ?? []).filter(
  (m: any) => !drop.has(m.model_name),
);
for (const m of cfg.model_list) {
  const h = ov.headers?.[m.model_name];
  if (h) {
    m.litellm_params.extra_headers = Object.fromEntries(
      Object.entries(h).map(([k, v]) => {
        const x = value(v);
        if (x === undefined) missing.push(String(v));
        return [k, x];
      }),
    );
  }
  const b = ov.budget?.[m.model_name];
  if (b) {
    m.litellm_params.max_budget = b.max_budget;
    m.litellm_params.budget_duration = b.budget_duration;
    m.model_info = { ...(m.model_info ?? {}), id: m.model_name };
  }
  for (const [k, v] of Object.entries(m.litellm_params))
    m.litellm_params[k] = resolve(v);
}
cfg.litellm_settings = {
  ...(cfg.litellm_settings ?? {}),
  ...(ov.litellm_settings ?? {}),
};

const out = join(
  env.RUNTIME_DIRECTORY ?? join(dirname(cfgPath)),
  "litellm.json",
);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(cfg, null, 2), { mode: 0o600 });
chmodSync(out, 0o600);
const summary = {
  host,
  config: out,
  routes: cfg.model_list.map((m: any) => m.model_name),
  dropped: [...drop],
  missing,
  prefer: ov.prefer?.order ?? [],
};
console.error(JSON.stringify(summary));
if (missing.length) {
  console.error(`valeurs absentes de l'environnement : ${missing.join(", ")}`);
  process.exit(1);
}
if (values["dry-run"]) process.exit(0);
const host_ = String(manifest.settings?.host ?? "127.0.0.1");
const port = String(manifest.settings?.port ?? 4000);
const p = Bun.spawn(
  [
    values.litellm!,
    "--config",
    out,
    "--host",
    host_,
    "--port",
    port,
    "--num_workers",
    "1",
  ],
  {
    env,
    stdio: ["inherit", "inherit", "inherit"],
  },
);
for (const s of ["SIGTERM", "SIGINT"] as const) process.on(s, () => p.kill(s));
process.exit(await p.exited);
