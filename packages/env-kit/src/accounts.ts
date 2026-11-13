import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { DEFAULT_MONOREPO_ENV_PATH, loadMonorepoEnv } from "./index";
import { secretGet } from "./secret-store";

/** Personal Google accounts never live in the public repo: environment first, then the vault (env-kit secret set). */
const vaultCache = new Map<string, string | undefined>();
export function personalAccount(
  key: "APHRODY_AI_GOOGLE_ACCOUNT" | "APHRODY_OWNER_GOOGLE_ACCOUNT",
): string {
  let v = process.env[key];
  if (!v && vaultCache.has(key)) v = vaultCache.get(key);
  else if (!v) {
    try {
      v = secretGet(key);
    } catch {
      v = undefined;
    }
    vaultCache.set(key, v);
  }
  return (v ?? "").trim().toLowerCase();
}

export const APHRODY_GCP_PROJECT_ID = "aphrody";
export const APHRODY_GCP_PROJECT_NUMBER = "468000409790";
export const APHRODY_PRIMARY_REGION = "europe-west1";
export const APHRODY_AI_REGION = "us-central1";

export type PrincipalAlias = "ai" | "owner" | "org" | "sa";

export interface GooglePrincipalSpec {
  readonly alias: PrincipalAlias;
  readonly email: string;
  readonly memberPrefix: "user" | "serviceAccount";
  readonly gcloudConfig: string;
  readonly project: string;
  readonly projectNumber: string;
  readonly region: string;
  readonly aiRegion?: string;
  readonly rcloneRemote?: string;
  readonly roleSummary: string;
  readonly agentHarnesses?: readonly string[];
  readonly iamRoles: readonly string[];
}

export const APHRODY_PRINCIPALS: Readonly<
  Record<PrincipalAlias, GooglePrincipalSpec>
> = {
  ai: {
    alias: "ai",
    get email() {
      return personalAccount("APHRODY_AI_GOOGLE_ACCOUNT");
    },
    memberPrefix: "user",
    gcloudConfig: "ai-agent",
    project: APHRODY_GCP_PROJECT_ID,
    projectNumber: APHRODY_GCP_PROJECT_NUMBER,
    region: APHRODY_PRIMARY_REGION,
    aiRegion: APHRODY_AI_REGION,
    rcloneRemote: "gdrive-ai",
    roleSummary:
      "Dedicated autonomous AI Google account (Gemini, Spark, Hermes, OpenClaw, Google Drive gdrive-ai, NotebookLM, Vertex AI, Cloud Build agent sandboxes)",
    agentHarnesses: [
      "ai-os",
      "triad",
      "pi-opencode",
      "gemini",
      "spark",
      "hermes",
      "openclaw",
    ],
    iamRoles: [
      "roles/aiplatform.user",
      "roles/serviceusage.serviceUsageConsumer",
      "roles/artifactregistry.writer",
      "roles/cloudbuild.builds.editor",
      "roles/developerconnect.user",
      "roles/storage.objectAdmin",
      "roles/logging.logWriter",
    ],
  },
  owner: {
    alias: "owner",
    get email() {
      return personalAccount("APHRODY_OWNER_GOOGLE_ACCOUNT");
    },
    memberPrefix: "user",
    gcloudConfig: "owner",
    project: APHRODY_GCP_PROJECT_ID,
    projectNumber: APHRODY_GCP_PROJECT_NUMBER,
    region: APHRODY_PRIMARY_REGION,
    roleSummary:
      "Personal developer & root owner account of the owner (GCP project aphrody #468000409790 and personal dev workstation)",
    iamRoles: ["roles/owner"],
  },
  org: {
    alias: "org",
    email: "contact@aphrody.com",
    memberPrefix: "user",
    gcloudConfig: "org-contact",
    project: APHRODY_GCP_PROJECT_ID,
    projectNumber: APHRODY_GCP_PROJECT_NUMBER,
    region: APHRODY_PRIMARY_REGION,
    roleSummary:
      "Organization & production infrastructure master identity across Google Workspace, Cloudflare, GitHub (aphrody-dev), GitLab (aphrody-dev / git.aphrody.com), OVH (fr1, fr2), Hostinger (usa), Vercel, Supabase, and Mail (mail.aphrody.com)",
    iamRoles: [
      "roles/editor",
      "roles/run.admin",
      "roles/dns.admin",
      "roles/secretmanager.admin",
    ],
  },
  sa: {
    alias: "sa",
    email: "yolo-automation@aphrody.iam.gserviceaccount.com",
    memberPrefix: "serviceAccount",
    gcloudConfig: "sa-automation",
    project: APHRODY_GCP_PROJECT_ID,
    projectNumber: APHRODY_GCP_PROJECT_NUMBER,
    region: APHRODY_PRIMARY_REGION,
    roleSummary:
      "Headless NHITL CI/CD service account in GCP project aphrody (#468000409790)",
    iamRoles: [
      "roles/editor",
      "roles/developerconnect.admin",
      "roles/artifactregistry.admin",
    ],
  },
};

export interface OrgProviderSurfaceSpec {
  readonly id: string;
  readonly name: string;
  readonly masterIdentity: string;
  readonly target: string;
  readonly envKeys: readonly string[];
  readonly requiredAnyKeys: readonly string[];
}

export const ORG_PROVIDER_SURFACES: readonly OrgProviderSurfaceSpec[] = [
  {
    id: "google-workspace",
    name: "Google Workspace",
    masterIdentity: "contact@aphrody.com",
    target: "aphrody.com",
    envKeys: [
      "APHRODY_ORG_GOOGLE_ACCOUNT",
      "GOOGLE_WORKSPACE_DOMAIN",
      "GOOGLE_WORKSPACE_ADMIN_EMAIL",
    ],
    requiredAnyKeys: [
      "APHRODY_ORG_GOOGLE_ACCOUNT",
      "GOOGLE_WORKSPACE_ADMIN_EMAIL",
    ],
  },
  {
    id: "gcp-aphrody",
    name: "GCP aphrody",
    masterIdentity: "contact@aphrody.com",
    target: "aphrody (468000409790)",
    envKeys: [
      "GOOGLE_CLOUD_PROJECT",
      "GOOGLE_CLOUD_REGION",
      "GOOGLE_APPLICATION_CREDENTIALS",
      "GEMINI_API_KEY",
    ],
    requiredAnyKeys: ["GOOGLE_CLOUD_PROJECT"],
  },
  {
    id: "cloudflare",
    name: "Cloudflare",
    masterIdentity: "contact@aphrody.com",
    target: "aphrody.com (DNS, Workers, R2, MASQUE Mesh)",
    envKeys: [
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_API_TOKEN",
      "CLOUDFLARE_ZONE_ID",
    ],
    requiredAnyKeys: ["CLOUDFLARE_API_TOKEN"],
  },
  {
    id: "github",
    name: "GitHub",
    masterIdentity: "contact@aphrody.com",
    target: "github.com/aphrody-dev",
    envKeys: ["GITHUB_TOKEN", "GH_TOKEN"],
    requiredAnyKeys: ["GITHUB_TOKEN", "GH_TOKEN"],
  },
  {
    id: "gitlab",
    name: "GitLab",
    masterIdentity: "contact@aphrody.com",
    target: "gitlab.com/aphrody-dev & git.aphrody.com",
    envKeys: ["GITLAB_HOST", "GITLAB_TOKEN"],
    requiredAnyKeys: ["GITLAB_TOKEN"],
  },
  {
    id: "ovh",
    name: "OVH",
    masterIdentity: "contact@aphrody.com",
    target: "fr1 (51.77.147.152) & fr2 (51.255.162.6)",
    envKeys: [
      "OVH_ENDPOINT",
      "OVH_APPLICATION_KEY",
      "OVH_APPLICATION_SECRET",
      "OVH_CONSUMER_KEY",
    ],
    requiredAnyKeys: ["OVH_APPLICATION_KEY", "OVH_CONSUMER_KEY"],
  },
  {
    id: "hostinger",
    name: "Hostinger",
    masterIdentity: "contact@aphrody.com",
    target: "usa (72.60.186.43 — Google/Gemini egress)",
    envKeys: ["HOSTINGER_API_TOKEN"],
    requiredAnyKeys: ["HOSTINGER_API_TOKEN"],
  },
  {
    id: "vercel",
    name: "Vercel",
    masterIdentity: "contact@aphrody.com",
    target: "aphrody-dev",
    envKeys: ["VERCEL_TOKEN", "VERCEL_ORG_ID", "VERCEL_PROJECT_ID"],
    requiredAnyKeys: ["VERCEL_TOKEN"],
  },
  {
    id: "supabase",
    name: "Supabase",
    masterIdentity: "contact@aphrody.com",
    target: "aphrody-prod",
    envKeys: [
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_PROJECT_REF",
    ],
    requiredAnyKeys: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  },
  {
    id: "mail",
    name: "Mail",
    masterIdentity: "contact@aphrody.com",
    target: "mail.aphrody.com (Stalwart JMAP/SMTP/IMAP + Split-Delivery)",
    envKeys: [
      "MAIL_DOMAIN",
      "MAIL_HOST",
      "MAIL_FROM",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
      "JMAP_URL",
      "JMAP_API_TOKEN",
    ],
    requiredAnyKeys: ["MAIL_HOST", "SMTP_PASSWORD", "JMAP_API_TOKEN"],
  },
];

export const APHRODY_SHARED_APIS: readonly string[] = [
  "iam.googleapis.com",
  "cloudresourcemanager.googleapis.com",
  "aiplatform.googleapis.com",
  "generativelanguage.googleapis.com",
  "sourcerepo.googleapis.com",
  "developerconnect.googleapis.com",
  "cloudbuild.googleapis.com",
  "artifactregistry.googleapis.com",
  "run.googleapis.com",
  "secretmanager.googleapis.com",
  "drive.googleapis.com",
];

export function resolvePrincipal(input: string): GooglePrincipalSpec {
  const normalized = input.trim().toLowerCase();
  if (normalized in APHRODY_PRINCIPALS) {
    return APHRODY_PRINCIPALS[normalized as PrincipalAlias];
  }
  for (const spec of Object.values(APHRODY_PRINCIPALS)) {
    if (
      spec.gcloudConfig.toLowerCase() === normalized ||
      (spec.email !== "" && spec.email.toLowerCase() === normalized)
    ) {
      return spec;
    }
  }
  throw new Error(
    `Unknown Aphrody Google principal "${input}". Expected one of: ai, owner, org, sa`,
  );
}

export interface IsolatedGcloudEnvOptions {
  readonly baseEnv?: Readonly<Record<string, string | undefined>>;
  readonly homeDir?: string;
  readonly ensureAdcDir?: boolean;
}

export function getPrincipalAdcFilePath(
  principal: PrincipalAlias | string,
  homeDir: string = homedir(),
): string {
  const spec = resolvePrincipal(principal);
  const appData =
    process.platform === "win32"
      ? (process.env.APPDATA ?? join(homeDir, "AppData", "Roaming"))
      : join(homeDir, ".config");
  return join(
    appData,
    "gcloud",
    "aphrody-adc",
    `${spec.gcloudConfig}-adc.json`,
  );
}

/**
 * Generates an isolated child-process environment dictionary binding
 * `CLOUDSDK_ACTIVE_CONFIG_NAME` (and principal-scoped project/region variables)
 * without mutating the developer's active global `gcloud` configuration.
 */
export function getIsolatedGcloudEnv(
  principal: PrincipalAlias | string,
  options: IsolatedGcloudEnvOptions = {},
): Record<string, string> {
  const spec = resolvePrincipal(principal);
  const base = options.baseEnv ?? process.env;
  const home = options.homeDir ?? homedir();
  const out: Record<string, string> = {};

  for (const [k, v] of Object.entries(base)) {
    if (v !== undefined) {
      out[k] = v;
    }
  }

  out.CLOUDSDK_ACTIVE_CONFIG_NAME = spec.gcloudConfig;
  out.CLOUDSDK_CORE_PROJECT = spec.project;
  out.CLOUDSDK_CORE_ACCOUNT = spec.email;
  out.CLOUDSDK_COMPUTE_REGION = spec.region;
  out.GOOGLE_CLOUD_PROJECT = spec.project;
  out.GCLOUD_PROJECT = spec.project;
  out.GOOGLE_CLOUD_QUOTA_PROJECT = spec.project;
  out.APHRODY_ACTIVE_PRINCIPAL = spec.alias;
  out.APHRODY_GCP_PROJECT_NUMBER = spec.projectNumber;

  if (spec.aiRegion) {
    out.CLOUDSDK_AI_REGION = spec.aiRegion;
    out.GOOGLE_CLOUD_REGION = spec.aiRegion;
    out.GOOGLE_CLOUD_LOCATION = spec.aiRegion;
  } else {
    out.GOOGLE_CLOUD_REGION = spec.region;
    out.GOOGLE_CLOUD_LOCATION = spec.region;
  }

  if (spec.rcloneRemote) {
    out.APHRODY_RCLONE_REMOTE = spec.rcloneRemote;
  }

  const isolatedAdcPath = getPrincipalAdcFilePath(spec.alias, home);
  if (options.ensureAdcDir) {
    mkdirSync(join(isolatedAdcPath, ".."), { recursive: true });
  }
  out.APHRODY_ISOLATED_ADC_PATH = isolatedAdcPath;
  if (existsSync(isolatedAdcPath)) {
    out.GOOGLE_APPLICATION_CREDENTIALS = isolatedAdcPath;
  }

  return out;
}

export interface IamBindingEntry {
  readonly principalAlias: PrincipalAlias;
  readonly member: string;
  readonly email: string;
  readonly role: string;
  readonly project: string;
  readonly projectNumber: string;
  readonly command: string;
}

export interface IamBindingsPlan {
  readonly project: string;
  readonly projectNumber: string;
  readonly executorConfig: string;
  readonly executorAccount: string;
  readonly enabledApis: readonly string[];
  readonly enableApisCommand: string;
  readonly bindings: readonly IamBindingEntry[];
}

export function buildAphrodyIamBindingsPlan(): IamBindingsPlan {
  const bindings: IamBindingEntry[] = [];
  const order: readonly PrincipalAlias[] = ["owner", "ai", "org", "sa"];

  for (const alias of order) {
    const spec = APHRODY_PRINCIPALS[alias];
    const member = `${spec.memberPrefix}:${spec.email}`;
    for (const role of spec.iamRoles) {
      bindings.push({
        principalAlias: alias,
        member,
        email: spec.email,
        role,
        project: APHRODY_GCP_PROJECT_ID,
        projectNumber: APHRODY_GCP_PROJECT_NUMBER,
        command: `gcloud projects add-iam-policy-binding ${APHRODY_GCP_PROJECT_ID} --member="${member}" --role="${role}" --condition=None --configuration=owner --quiet`,
      });
    }
  }

  return {
    project: APHRODY_GCP_PROJECT_ID,
    projectNumber: APHRODY_GCP_PROJECT_NUMBER,
    executorConfig: APHRODY_PRINCIPALS.owner.gcloudConfig,
    executorAccount: APHRODY_PRINCIPALS.owner.email,
    enabledApis: APHRODY_SHARED_APIS,
    enableApisCommand: `gcloud services enable ${APHRODY_SHARED_APIS.join(" ")} --project=${APHRODY_GCP_PROJECT_ID} --configuration=owner --quiet`,
    bindings,
  };
}

export interface GcloudNamedConfigState {
  readonly name: string;
  readonly isActive: boolean;
  readonly account: string | null;
  readonly project: string | null;
  readonly region: string | null;
  readonly aiRegion: string | null;
}

export interface GcloudAuthAccountState {
  readonly account: string;
  readonly active: boolean;
}

export interface PrincipalRuntimeStatus {
  readonly alias: PrincipalAlias;
  readonly email: string;
  readonly gcloudConfig: string;
  readonly configExists: boolean;
  readonly configActive: boolean;
  readonly configuredAccount: string | null;
  readonly configuredProject: string | null;
  readonly oauthCached: boolean;
  readonly isolatedAdcReady: boolean;
  readonly rcloneRemote?: string;
  readonly rcloneReady?: boolean;
}

export interface OrgSurfaceStatus {
  readonly id: string;
  readonly name: string;
  readonly masterIdentity: string;
  readonly target: string;
  readonly ready: boolean;
  /** Strictly boolean presence map — NEVER raw values! */
  readonly keyPresence: Readonly<Record<string, boolean>>;
}

export interface AccountsStatusReport {
  readonly project: {
    readonly id: string;
    readonly number: string;
    readonly primaryRegion: string;
    readonly aiRegion: string;
  };
  readonly activeGcloudConfig: string | null;
  readonly activeGcloudAccount: string | null;
  readonly gcloudConfigurations: readonly GcloudNamedConfigState[];
  readonly gcloudAuthAccounts: readonly GcloudAuthAccountState[];
  readonly rcloneRemotes: readonly string[];
  readonly principals: readonly PrincipalRuntimeStatus[];
  readonly orgSurfaces: readonly OrgSurfaceStatus[];
}

export type CommandRunner = (
  cmd: string,
  args: readonly string[],
) => { status: number | null; stdout: string; stderr: string };

const defaultCommandRunner: CommandRunner = (cmd, args) => {
  if (process.platform === "win32" && cmd === "gcloud") {
    const sdkCmdCandidates = [
      "C:\\Program Files (x86)\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd",
      "C:\\Program Files\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd",
      join(
        process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"),
        "Google",
        "Cloud SDK",
        "google-cloud-sdk",
        "bin",
        "gcloud.cmd",
      ),
    ];
    const resolvedCmd =
      sdkCmdCandidates.find((p) => existsSync(p)) ?? "gcloud.cmd";
    const quoteCmdArg = (arg: string): string =>
      /[\s"&|<>^()]/.test(arg) ? `"${arg.replace(/"/g, '""')}"` : arg;
    const cmdLine = `"${quoteCmdArg(resolvedCmd)} ${args.map(quoteCmdArg).join(" ")}"`;
    const res = spawnSync("cmd.exe", ["/d", "/s", "/c", cmdLine], {
      encoding: "utf8",
      windowsVerbatimArguments: true,
      windowsHide: true,
    });
    return {
      status: res.status,
      stdout: res.stdout ?? "",
      stderr: res.stderr ?? (res.error ? res.error.message : ""),
    };
  }

  const res = spawnSync(cmd, [...args], {
    encoding: "utf8",
    windowsHide: true,
  });
  return {
    status: res.status,
    stdout: res.stdout ?? "",
    stderr: res.stderr ?? (res.error ? res.error.message : ""),
  };
};

export function inspectAccountsStatus(
  options: {
    envPath?: string;
    runner?: CommandRunner;
    homeDir?: string;
  } = {},
): AccountsStatusReport {
  const envPath = options.envPath ?? DEFAULT_MONOREPO_ENV_PATH;
  const runner = options.runner ?? defaultCommandRunner;
  const home = options.homeDir ?? homedir();

  const loaded = loadMonorepoEnv({
    envPath,
    injectProcessEnv: false,
  });

  const hasEnvKey = (key: string): boolean => {
    const fileVal = loaded.parsed[key];
    if (fileVal !== undefined && fileVal.trim().length > 0) {
      return true;
    }
    const procVal = process.env[key];
    return procVal !== undefined && procVal.trim().length > 0;
  };

  // 1. gcloud config configurations list
  const cfgRes = runner("gcloud", [
    "config",
    "configurations",
    "list",
    "--limit=50",
    "--format=json(name,is_active,properties.core.account,properties.core.project,properties.compute.region,properties.run.region,properties.ai.region)",
  ]);

  const gcloudConfigurations: GcloudNamedConfigState[] = [];
  if (cfgRes.status === 0 && cfgRes.stdout.trim().startsWith("[")) {
    try {
      const parsedCfgs = JSON.parse(cfgRes.stdout) as Array<{
        name?: string;
        is_active?: boolean;
        properties?: {
          core?: { account?: string | null; project?: string | null };
          compute?: { region?: string | null };
          run?: { region?: string | null };
          ai?: { region?: string | null };
        };
      }>;
      for (const item of parsedCfgs) {
        if (!item.name) continue;
        gcloudConfigurations.push({
          name: item.name,
          isActive: Boolean(item.is_active),
          account: item.properties?.core?.account ?? null,
          project: item.properties?.core?.project ?? null,
          region:
            item.properties?.run?.region ??
            item.properties?.compute?.region ??
            null,
          aiRegion: item.properties?.ai?.region ?? null,
        });
      }
    } catch {
      // Ignore malformed JSON from missing CLI
    }
  }

  // 2. gcloud auth list
  const authRes = runner("gcloud", [
    "auth",
    "list",
    "--limit=50",
    "--format=json(account,status)",
  ]);
  const gcloudAuthAccounts: GcloudAuthAccountState[] = [];
  if (authRes.status === 0 && authRes.stdout.trim().startsWith("[")) {
    try {
      const parsedAuth = JSON.parse(authRes.stdout) as Array<{
        account?: string;
        status?: string;
      }>;
      for (const item of parsedAuth) {
        if (!item.account) continue;
        gcloudAuthAccounts.push({
          account: item.account,
          active: (item.status ?? "").toUpperCase() === "ACTIVE",
        });
      }
    } catch {
      // Ignore malformed JSON
    }
  }

  // 3. rclone listremotes
  const rcloneRes = runner("rclone", ["listremotes"]);
  const rcloneRemotes =
    rcloneRes.status === 0
      ? rcloneRes.stdout
          .split(/\r?\n/)
          .map((r) => r.trim().replace(/:$/, ""))
          .filter((r) => r.length > 0)
      : [];

  const cachedEmailSet = new Set(
    gcloudAuthAccounts.map((a) => a.account.toLowerCase()),
  );
  const rcloneSet = new Set(rcloneRemotes.map((r) => r.toLowerCase()));

  const principals: PrincipalRuntimeStatus[] = (
    ["ai", "owner", "org", "sa"] as const
  ).map((alias) => {
    const spec = APHRODY_PRINCIPALS[alias];
    const cfg = gcloudConfigurations.find((c) => c.name === spec.gcloudConfig);
    const adcPath = getPrincipalAdcFilePath(alias, home);
    return {
      alias,
      email: spec.email,
      gcloudConfig: spec.gcloudConfig,
      configExists: Boolean(cfg),
      configActive: Boolean(cfg?.isActive),
      configuredAccount: cfg?.account ?? null,
      configuredProject: cfg?.project ?? null,
      oauthCached: cachedEmailSet.has(spec.email.toLowerCase()),
      isolatedAdcReady: existsSync(adcPath),
      ...(spec.rcloneRemote
        ? {
            rcloneRemote: spec.rcloneRemote,
            rcloneReady: rcloneSet.has(spec.rcloneRemote.toLowerCase()),
          }
        : {}),
    };
  });

  const orgSurfaces: OrgSurfaceStatus[] = ORG_PROVIDER_SURFACES.map(
    (surface) => {
      const keyPresence: Record<string, boolean> = {};
      for (const k of surface.envKeys) {
        keyPresence[k] = hasEnvKey(k);
      }
      const ready = surface.requiredAnyKeys.some((k) =>
        Boolean(keyPresence[k]),
      );
      return {
        id: surface.id,
        name: surface.name,
        masterIdentity: surface.masterIdentity,
        target: surface.target,
        ready,
        keyPresence,
      };
    },
  );

  const activeCfg = gcloudConfigurations.find((c) => c.isActive) ?? null;
  const activeAuth = gcloudAuthAccounts.find((a) => a.active) ?? null;

  return {
    project: {
      id: APHRODY_GCP_PROJECT_ID,
      number: APHRODY_GCP_PROJECT_NUMBER,
      primaryRegion: APHRODY_PRIMARY_REGION,
      aiRegion: APHRODY_AI_REGION,
    },
    activeGcloudConfig: activeCfg?.name ?? null,
    activeGcloudAccount: activeAuth?.account ?? activeCfg?.account ?? null,
    gcloudConfigurations,
    gcloudAuthAccounts,
    rcloneRemotes,
    principals,
    orgSurfaces,
  };
}

export interface InitGcloudConfigsResult {
  readonly createdConfigs: readonly string[];
  readonly updatedConfigs: readonly string[];
  readonly preservedActiveConfig: string | null;
}

/**
 * Idempotently creates and configures `ai-agent`, `owner`, `org-contact`, and `sa-automation`
 * without clobbering the currently active `gcloud` configuration.
 */
export function initGcloudConfigurations(
  options: {
    runner?: CommandRunner;
  } = {},
): InitGcloudConfigsResult {
  const runner = options.runner ?? defaultCommandRunner;
  const before = inspectAccountsStatus({ runner });
  const existingNames = new Set(before.gcloudConfigurations.map((c) => c.name));
  const preservedActiveConfig = before.activeGcloudConfig;

  const createdConfigs: string[] = [];
  const updatedConfigs: string[] = [];

  for (const alias of ["ai", "owner", "org", "sa"] as const) {
    const spec = APHRODY_PRINCIPALS[alias];
    if (!existingNames.has(spec.gcloudConfig)) {
      const createRes = runner("gcloud", [
        "config",
        "configurations",
        "create",
        spec.gcloudConfig,
        "--no-activate",
        "--quiet",
      ]);
      if (createRes.status !== 0) {
        throw new Error(
          `Failed creating gcloud configuration ${spec.gcloudConfig}: ${createRes.stderr.trim()}`,
        );
      }
      createdConfigs.push(spec.gcloudConfig);
    }

    const props: Array<[string, string]> = [
      ["core/project", spec.project],
      ["run/region", spec.region],
      ["artifacts/location", spec.region],
    ];
    if (spec.aiRegion) {
      props.push(["ai/region", spec.aiRegion]);
    }
    // Set core/account last so regional property writes never trigger remote GCE validation before OAuth login
    props.push(["core/account", spec.email]);

    for (const [prop, val] of props) {
      const setRes = runner("gcloud", [
        "config",
        "set",
        prop,
        val,
        `--configuration=${spec.gcloudConfig}`,
        "--quiet",
      ]);
      if (setRes.status !== 0) {
        throw new Error(
          `Failed setting ${prop} on ${spec.gcloudConfig}: ${setRes.stderr.trim()}`,
        );
      }
    }

    updatedConfigs.push(spec.gcloudConfig);
  }

  if (preservedActiveConfig) {
    runner("gcloud", [
      "config",
      "configurations",
      "activate",
      preservedActiveConfig,
      "--quiet",
    ]);
  }

  return {
    createdConfigs,
    updatedConfigs,
    preservedActiveConfig,
  };
}

export interface SwitchGcloudPrincipalResult {
  readonly principal: GooglePrincipalSpec;
  readonly activated: boolean;
  readonly oauthCached: boolean;
  readonly loginHint: string | null;
}

export function switchGcloudPrincipal(
  target: string,
  options: {
    runner?: CommandRunner;
  } = {},
): SwitchGcloudPrincipalResult {
  const runner = options.runner ?? defaultCommandRunner;
  const spec = resolvePrincipal(target);
  const status = inspectAccountsStatus({ runner });

  const exists = status.gcloudConfigurations.some(
    (c) => c.name === spec.gcloudConfig,
  );
  if (!exists) {
    initGcloudConfigurations({ runner });
  }

  const actRes = runner("gcloud", [
    "config",
    "configurations",
    "activate",
    spec.gcloudConfig,
    "--quiet",
  ]);
  if (actRes.status !== 0) {
    throw new Error(
      `Failed activating gcloud configuration ${spec.gcloudConfig}: ${actRes.stderr.trim()}`,
    );
  }

  const oauthCached = status.gcloudAuthAccounts.some(
    (a) => a.account.toLowerCase() === spec.email.toLowerCase(),
  );

  let loginHint: string | null = null;
  if (!oauthCached) {
    if (spec.memberPrefix === "serviceAccount") {
      loginHint = `gcloud auth activate-service-account ${spec.email} --key-file=<PATH_TO_KEY_JSON> --configuration=${spec.gcloudConfig}`;
    } else {
      loginHint = `gcloud auth login ${spec.email} --configuration=${spec.gcloudConfig} && gcloud auth application-default login --configuration=${spec.gcloudConfig}`;
    }
  }

  return {
    principal: spec,
    activated: true,
    oauthCached,
    loginHint,
  };
}

export function formatAccountsStatusReport(
  report: AccountsStatusReport,
): string {
  const lines: string[] = [];
  lines.push(
    "=== Aphrody 3-Principal Multi-Google & Org Identity Matrix (env-kit accounts) ===",
  );
  lines.push(
    `GCP Project          : ${report.project.id} (#${report.project.number}) [region=${report.project.primaryRegion}, ai=${report.project.aiRegion}]`,
  );
  lines.push(
    `Active gcloud Config : ${report.activeGcloudConfig ?? "NONE"} (account=${report.activeGcloudAccount ?? "NONE"})`,
  );
  lines.push(
    `Rclone Remotes       : ${report.rcloneRemotes.length > 0 ? report.rcloneRemotes.join(", ") : "NONE"}`,
  );

  lines.push("\n--- Google Cloud Named Configurations & Principals ---");
  for (const p of report.principals) {
    const activeTag = p.configActive ? "ACTIVE" : "IDLE  ";
    const cfgTag = p.configExists ? "CFG:READY  " : "CFG:MISSING";
    const authTag = p.oauthCached ? "OAUTH:CACHED " : "OAUTH:PENDING";
    const rcloneTag = p.rcloneRemote
      ? ` | RCLONE(${p.rcloneRemote}):${p.rcloneReady ? "READY" : "MISSING"}`
      : "";
    lines.push(
      `  [${activeTag}] ${p.alias.padEnd(5)} -> ${p.gcloudConfig.padEnd(14)} | ${p.email.padEnd(46)} | ${cfgTag} | ${authTag}${rcloneTag}`,
    );
  }

  lines.push(
    "\n--- Organization Infrastructure Surfaces (contact@aphrody.com — Boolean Key Presence Only) ---",
  );
  for (const s of report.orgSurfaces) {
    const state = s.ready ? "READY  " : "PARTIAL";
    const keyFlags = Object.entries(s.keyPresence)
      .map(([k, present]) => `${k}=${present ? "true" : "false"}`)
      .join(", ");
    lines.push(
      `  [${state}] ${s.name.padEnd(17)} (${s.target})\n            Keys: ${keyFlags}`,
    );
  }

  return lines.join("\n");
}

export function formatIamBindingsPlan(plan: IamBindingsPlan): string {
  const lines: string[] = [];
  lines.push(
    `# Aphrody Multi-Principal GCP IAM Policy Sharing Plan (${plan.project} #${plan.projectNumber})`,
  );
  lines.push(
    `# Execute as Owner (${plan.executorAccount} via --configuration=${plan.executorConfig}):`,
  );
  lines.push("");
  lines.push("# 1. Enable Shared APIs");
  lines.push(plan.enableApisCommand);
  lines.push("");
  lines.push("# 2. Idempotent IAM Policy Bindings");
  for (const b of plan.bindings) {
    lines.push(b.command);
  }
  return lines.join("\n");
}
