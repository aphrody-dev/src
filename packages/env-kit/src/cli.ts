#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { syncAllEditorConfigs } from "./editors";
import {
  buildAphrodyIamBindingsPlan,
  formatAccountsStatusReport,
  formatIamBindingsPlan,
  initGcloudConfigurations,
  inspectAccountsStatus,
  switchGcloudPrincipal,
} from "./accounts";
import {
  DEFAULT_MONOREPO_ENV_PATH,
  exportForCloudflareDevVars,
  exportForVercelEnv,
  loadMonorepoEnv,
  maskValue,
  upsertEnvFileKey,
} from "./index";

const DOCTOR_SECTIONS: ReadonlyArray<{
  title: string;
  keys: readonly string[];
}> = [
  {
    title: "GitHub & Forge",
    keys: ["GITHUB_TOKEN", "GH_TOKEN"],
  },
  {
    title: "Figma & Design",
    keys: [
      "FIGMA_ACCESS_TOKEN",
      "FIGMA_TOKEN",
      "FIGMA_MATERIAL_ICONS_LOCAL_DIR",
    ],
  },
  {
    title: "Package Registries (npm, Crates.io, PyPI, NuGet)",
    keys: [
      "NPM_TOKEN",
      "CARGO_REGISTRY_TOKEN",
      "UV_PUBLISH_TOKEN",
      "TWINE_PASSWORD",
      "NUGET_API_KEY",
    ],
  },
  {
    title: "Native & Systems Toolchains (Rust, C/C++, Go, Lua)",
    keys: [
      "CARGO_HOME",
      "RUSTC_WRAPPER",
      "CC",
      "CMAKE_GENERATOR",
      "CUDA_PATH",
      "VULKAN_SDK",
      "GOPATH",
      "LUA_PATH",
    ],
  },
  {
    title: "Cloud Infrastructure (GCP, Vercel, Neon, Cloudflare)",
    keys: [
      "GOOGLE_CLOUD_PROJECT",
      "GOOGLE_CLOUD_REGION",
      "GOOGLE_APPLICATION_CREDENTIALS",
      "VERCEL_TOKEN",
      "NEON_API_KEY",
      "NEON_ORG_ID",
      "DATABASE_URL",
      "CLOUDFLARE_ACCOUNT_ID",
      "CLOUDFLARE_API_TOKEN",
    ],
  },
  {
    title: "AI Models & Sovereign Local Inference",
    keys: [
      "ANTHROPIC_API_KEY",
      "ANTHROPIC_WORKSPACE_ID",
      "GEMINI_API_KEY",
      "GOOGLE_API_KEY",
      "OPENAI_API_KEY",
      "EXA_API_KEY",
      "CTX7_API_KEY",
      "RING3_BASE_URL",
      "PI_LU_BASE_URL",
    ],
  },
];

function setWindowsUserEnv(key: string, value: string): void {
  if (process.platform !== "win32") return;
  const res = spawnSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "[Environment]::SetEnvironmentVariable($env:__EK_KEY, $env:__EK_VAL, 'User')",
    ],
    {
      env: {
        ...process.env,
        __EK_KEY: key,
        __EK_VAL: value,
      },
      stdio: "ignore",
    },
  );
  if (res.status !== 0) {
    throw new Error(`Failed to persist ${key} into Windows User Environment`);
  }
}

function lockWindowsEnvAcl(envPath: string): void {
  if (process.platform !== "win32" || !existsSync(envPath)) return;
  const user = process.env.USERNAME ?? "aphro";
  spawnSync(
    "icacls.exe",
    [
      envPath,
      "/inheritance:r",
      "/grant:r",
      `${user}:(F)`,
      "*S-1-5-18:(F)",
      "*S-1-5-32-544:(F)",
    ],
    { stdio: "ignore" },
  );
}

const COUPLED_KEYS: Readonly<Record<string, readonly string[]>> = {
  GITHUB_TOKEN: ["GH_TOKEN"],
  GH_TOKEN: ["GITHUB_TOKEN"],
  FIGMA_ACCESS_TOKEN: ["FIGMA_TOKEN"],
  FIGMA_TOKEN: ["FIGMA_ACCESS_TOKEN"],
  GEMINI_API_KEY: ["GOOGLE_API_KEY"],
  GOOGLE_API_KEY: ["GEMINI_API_KEY"],
};

function runDoctor(envPath: string): number {
  const loaded = loadMonorepoEnv({ envPath, injectProcessEnv: false });
  const home = homedir();
  const appData = process.env.APPDATA ?? join(home, "AppData", "Roaming");

  console.log(
    "=== env-kit Doctor (Zero-Leakage Credential & Toolchain Audit) ===",
  );
  console.log(`Master .env : ${envPath} [exists=${existsSync(envPath)}]`);

  if (process.platform === "win32" && existsSync(envPath)) {
    const acl = spawnSync("icacls.exe", [envPath], { encoding: "utf8" });
    const aclLines = (acl.stdout ?? "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith("Successfully processed"));
    console.log(`NTFS ACLs   : ${aclLines.join(" | ")}`);
  }

  const gitExcludes = spawnSync(
    "git",
    ["config", "--global", "--get", "core.excludesFile"],
    { encoding: "utf8" },
  );
  console.log(
    `Git Guard   : core.excludesFile=${(gitExcludes.stdout ?? "").trim() || "UNSET"}`,
  );

  for (const section of DOCTOR_SECTIONS) {
    console.log(`\n--- ${section.title} ---`);
    for (const key of section.keys) {
      const val = loaded.parsed[key] || process.env[key] || "";
      console.log(`  ${key.padEnd(32)} : ${maskValue(key, val)}`);
    }
  }

  console.log("\n--- Editor & Agent Harness Wiring ---");
  const targets: ReadonlyArray<[string, string]> = [
    ["OpenCode", join(home, ".config", "opencode", "opencode.jsonc")],
    ["Zed", join(appData, "Zed", "settings.json")],
    ["Pi Settings", join(home, ".pi", "agent", "settings.json")],
    ["Pi Models", join(home, ".pi", "agent", "models.json")],
    ["npmrc", join(home, ".npmrc")],
    ["Claude Settings", join(home, ".claude", "settings.json")],
    ["Gemini CLI", join(home, ".gemini", "settings.json")],
  ];

  for (const [label, path] of targets) {
    const exists = existsSync(path);
    let detail = exists ? "READY" : "MISSING";
    if (exists && label === "npmrc") {
      const content = readFileSync(path, "utf8");
      detail = content.includes("${NPM_TOKEN}")
        ? "READY (env-interpolated ${NPM_TOKEN})"
        : "READY";
    }
    console.log(`  ${label.padEnd(18)} : ${detail} (${path})`);
  }

  return 0;
}

function setCredentialEverywhere(
  envPath: string,
  key: string,
  value: string,
): void {
  upsertEnvFileKey(envPath, key, value);
  setWindowsUserEnv(key, value);
  process.env[key] = value;

  const coupled = COUPLED_KEYS[key] ?? [];
  for (const mirrorKey of coupled) {
    upsertEnvFileKey(envPath, mirrorKey, value);
    setWindowsUserEnv(mirrorKey, value);
    process.env[mirrorKey] = value;
  }

  lockWindowsEnvAcl(envPath);
  syncAllEditorConfigs();

  const updatedNames = [key, ...coupled].join(", ");
  console.log(
    `[env-kit] Updated ${updatedNames} -> ${maskValue(key, value)} across ${envPath}, Windows User Env, OpenCode, Zed, and Pi.`,
  );
}

function printHelp(): void {
  console.log(`env-kit — Sovereign Multi-Language Environment & Secret Manager

Usage:
  env-kit doctor                       Audit masked status of all credentials, ACLs, and editors
  env-kit accounts status [--json]     Inspect 3-principal gcloud configs, rclone, and org provider surfaces
  env-kit accounts init-gcloud         Idempotently initialize ai-yoyo, owner-yohan, org-contact, sa-automation
  env-kit accounts switch <principal>  Activate gcloud configuration for <ai|owner|org|sa>
  env-kit accounts iam-bindings        Print idempotent GCP IAM policy bindings for project aphrody (#468000409790)
  env-kit set <KEY> <VALUE>            Set key in C:/src/.env + Windows User Env + sync editors
  env-kit nuget-set-key <API_KEY>      Set NUGET_API_KEY and register with dotnet nuget config
  env-kit sync-editors                 Re-wire OpenCode, Zed, and Pi provider/MCP configs
  env-kit sync-gh                      Sync current 'gh auth token' into GITHUB_TOKEN & GH_TOKEN
  env-kit dev-vars <projectDir>        Write gitignored .dev.vars for Cloudflare wrangler dev
  env-kit vercel-env [projectDir]      Preview masked Vercel env summary (or write .env.local with --write)
  env-kit exec -- <cmd> [args...]      Execute command with C:/src/.env injected into child process
`);
}

function runAccountsCommand(envPath: string, args: readonly string[]): number {
  const sub = args[0] ?? "status";

  if (sub === "status") {
    const asJson = args.includes("--json");
    const report = inspectAccountsStatus({ envPath });
    if (asJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(formatAccountsStatusReport(report));
    }
    return 0;
  }

  if (sub === "init-gcloud") {
    const res = initGcloudConfigurations();
    console.log(
      `[env-kit] Initialized gcloud configurations (${res.updatedConfigs.join(", ")}) [created=${res.createdConfigs.length}, active=${res.preservedActiveConfig ?? "NONE"}].`,
    );
    return 0;
  }

  if (sub === "switch") {
    const target = args[1];
    if (!target) {
      console.error("Usage: env-kit accounts switch <ai|owner|org|sa>");
      return 1;
    }
    const res = switchGcloudPrincipal(target);
    console.log(
      `[env-kit] Activated gcloud configuration "${res.principal.gcloudConfig}" (${res.principal.email}, project=${res.principal.project}).`,
    );
    if (!res.oauthCached && res.loginHint) {
      console.log(
        `[env-kit] OAuth token not cached yet for ${res.principal.email}. Run:\n  ${res.loginHint}`,
      );
    }
    return 0;
  }

  if (sub === "iam-bindings") {
    const asJson = args.includes("--json");
    const plan = buildAphrodyIamBindingsPlan();
    if (asJson) {
      console.log(JSON.stringify(plan, null, 2));
    } else {
      console.log(formatIamBindingsPlan(plan));
    }
    return 0;
  }

  console.error(
    `Unknown accounts subcommand: ${sub}. Expected one of: status, init-gcloud, switch, iam-bindings`,
  );
  return 1;
}

export async function main(
  argv: string[] = process.argv.slice(2),
): Promise<number> {
  const cmd = argv[0];
  const envPath = process.env.ENV_KIT_FILE ?? DEFAULT_MONOREPO_ENV_PATH;

  if (!cmd || cmd === "--help" || cmd === "-h" || cmd === "help") {
    printHelp();
    return 0;
  }

  if (cmd === "doctor") {
    return runDoctor(envPath);
  }

  if (cmd === "accounts") {
    return runAccountsCommand(envPath, argv.slice(1));
  }

  if (cmd === "set") {
    const key = argv[1];
    const val = argv[2];
    if (!key || val === undefined) {
      console.error("Usage: env-kit set <KEY> <VALUE>");
      return 1;
    }
    setCredentialEverywhere(envPath, key, val);
    return 0;
  }

  if (cmd === "nuget-set-key") {
    const apiKey = argv[1];
    if (!apiKey) {
      console.error("Usage: env-kit nuget-set-key <NUGET_API_KEY>");
      return 1;
    }
    setCredentialEverywhere(envPath, "NUGET_API_KEY", apiKey);
    console.log(
      "[env-kit] NUGET_API_KEY ready for `dotnet nuget push --api-key $env:NUGET_API_KEY -s https://api.nuget.org/v3/index.json`.",
    );
    return 0;
  }

  if (cmd === "sync-editors") {
    const res = syncAllEditorConfigs();
    for (const f of res.updatedFiles) {
      console.log(`[env-kit] Synced editor config: ${f}`);
    }
    return 0;
  }

  if (cmd === "sync-gh") {
    const gh = spawnSync("gh", ["auth", "token"], { encoding: "utf8" });
    const tok = (gh.stdout ?? "").trim();
    if (gh.status !== 0 || !tok) {
      console.error("[env-kit] Could not retrieve token from `gh auth token`.");
      return 1;
    }
    setCredentialEverywhere(envPath, "GITHUB_TOKEN", tok);
    return 0;
  }

  if (cmd === "dev-vars") {
    const targetDir = argv[1] ?? process.cwd();
    const res = exportForCloudflareDevVars(targetDir, { envPath });
    console.log(
      `[env-kit] Wrote ${res.writtenKeys.length} keys (${res.writtenKeys.join(", ")}) to ${res.devVarsPath}`,
    );
    return 0;
  }

  if (cmd === "vercel-env") {
    const writeFlag = argv.includes("--write");
    const targetDir =
      argv.slice(1).find((a) => !a.startsWith("-")) ?? process.cwd();
    const exported = exportForVercelEnv({ envPath });
    console.log(
      `[env-kit] Prepared ${exported.count} Vercel environment entries:`,
    );
    for (const [k, masked] of Object.entries(exported.summary)) {
      console.log(`  ${k.padEnd(30)} : ${masked}`);
    }
    if (writeFlag) {
      const outFile = join(resolve(targetDir), ".env.local");
      await Bun.write(outFile, exported.toDotEnvLocal());
      console.log(`[env-kit] Wrote gitignored ${outFile}`);
    }
    return 0;
  }

  if (cmd === "exec") {
    const sepIdx = argv.indexOf("--");
    const childArgs = sepIdx >= 0 ? argv.slice(sepIdx + 1) : argv.slice(1);
    if (childArgs.length === 0) {
      console.error("Usage: env-kit exec -- <command> [args...]");
      return 1;
    }
    loadMonorepoEnv({ envPath, override: false, injectProcessEnv: true });
    const child = spawnSync(childArgs[0]!, childArgs.slice(1), {
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });
    return child.status ?? 1;
  }

  console.error(`Unknown command: ${cmd}`);
  printHelp();
  return 1;
}

if (import.meta.main) {
  main().then((code) => {
    process.exit(code);
  });
}
