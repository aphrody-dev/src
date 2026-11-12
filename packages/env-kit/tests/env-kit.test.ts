import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncAllEditorConfigs } from "../src/editors";
import {
  exportForCloudflareDevVars,
  exportForVercelEnv,
  loadMonorepoEnv,
  parseDotEnv,
  redactEnv,
  resolveMonorepoEnvPath,
  upsertEnvFileKey,
} from "../src/index";

function withTempDir(fn: (dir: string) => void): void {
  const dir = mkdtempSync(join(tmpdir(), "env-kit-test-"));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("env-kit Bun/TypeScript core", () => {
  test("parses comments, export prefix, quotes, and escape sequences", () => {
    const parsed = parseDotEnv(`
      # Header comment
      SIMPLE_VAL=alpha_123 # inline comment
      export DOUBLE_QUOTED="line1\\nline2\\t\\"ok\\""
      SINGLE_QUOTED='literal \\n # hash stays'
      EMPTY_KEY=
    `);

    expect(parsed.SIMPLE_VAL).toBe("alpha_123");
    expect(parsed.DOUBLE_QUOTED).toBe('line1\nline2\t"ok"');
    expect(parsed.SINGLE_QUOTED).toBe("literal \\n # hash stays");
    expect(parsed.EMPTY_KEY).toBe("");
  });

  test("walks upward to nearest .env and respects override=false", () => {
    withTempDir((dir) => {
      const rootEnv = join(dir, ".env");
      const nested = join(dir, "apps", "worker", "src");
      writeFileSync(
        rootEnv,
        [
          "SYNTHETIC_FORGE_TOKEN=ghp_mock_token_value_1234567890",
          "SYNTHETIC_PROJECT_ID=aphrody-test",
          "SERVICE_MODE=production",
        ].join("\n"),
        "utf8",
      );
      Bun.spawnSync([
        "powershell",
        "-NoProfile",
        "-Command",
        `New-Item -ItemType Directory -Force -Path '${nested}' | Out-Null`,
      ]);

      expect(resolveMonorepoEnvPath(nested)).toBe(rootEnv);

      process.env.SERVICE_MODE = "local_override";
      try {
        const loaded = loadMonorepoEnv({
          startDir: nested,
          service: "worker-api",
          required: ["SYNTHETIC_FORGE_TOKEN", "SYNTHETIC_PROJECT_ID"],
          override: false,
          injectProcessEnv: false,
        });

        expect(loaded.get("SERVICE_MODE")).toBe("local_override");
        expect(loaded.require("SYNTHETIC_PROJECT_ID")).toBe("aphrody-test");

        const serialized = JSON.stringify(loaded);
        expect(serialized).not.toContain("ghp_mock_token_value_1234567890");
        expect(serialized).toContain("SET [len=31]");

        const inspected = Bun.inspect(loaded);
        expect(inspected).not.toContain("ghp_mock_token_value_1234567890");
      } finally {
        delete process.env.SERVICE_MODE;
      }
    });
  });

  test("throws masked error when required keys are missing", () => {
    withTempDir((dir) => {
      const envFile = join(dir, ".env");
      writeFileSync(envFile, "GOOGLE_CLOUD_PROJECT=aphrody\n", "utf8");

      expect(() =>
        loadMonorepoEnv({
          envPath: envFile,
          service: "billing-engine",
          required: ["MISSING_SYNTHETIC_SECRET_KEY"],
          injectProcessEnv: false,
        }),
      ).toThrow(/\[service=billing-engine\].*MISSING_SYNTHETIC_SECRET_KEY/);
    });
  });

  test("redactEnv masks secret keys and secret value prefixes", () => {
    const view = redactEnv({
      ANTHROPIC_API_KEY: "synthetic_key_val_22ch",
      GOOGLE_CLOUD_PROJECT: "aphrody",
      CUDA_PATH: "C:\\Program Files\\NVIDIA\\CUDA\\v13.4",
      CUSTOM_PLAIN_FLAG: `${"figd"}_mock_prefixed_token_999`,
    });

    expect(view.ANTHROPIC_API_KEY).toBe("SET [len=22]");
    expect(view.GOOGLE_CLOUD_PROJECT).toBe("aphrody");
    expect(view.CUDA_PATH).toBe("C:\\Program Files\\NVIDIA\\CUDA\\v13.4");
    expect(view.CUSTOM_PLAIN_FLAG).toBe("SET [len=28]");
  });

  test("generates gitignored .dev.vars for Cloudflare wrangler dev and Vercel export", () => {
    withTempDir((dir) => {
      const envFile = join(dir, ".env");
      const workerDir = join(dir, "worker");
      writeFileSync(
        envFile,
        [
          "CLOUDFLARE_ACCOUNT_ID=ca22c1a51a145f919b54afa18d936516",
          "GEMINI_API_KEY=AIzaMockTestKeyForUnitSpecOnly1234",
          "CARGO_HOME=C:/Users/aphro/.cargo",
        ].join("\n"),
        "utf8",
      );

      upsertEnvFileKey(envFile, "NEON_API_KEY", "napi_mock_test_key_98765");

      const { devVarsPath, writtenKeys } = exportForCloudflareDevVars(
        workerDir,
        {
          envPath: envFile,
        },
      );
      expect(existsSync(devVarsPath)).toBe(true);
      expect(writtenKeys).toContain("CLOUDFLARE_ACCOUNT_ID");
      expect(writtenKeys).toContain("GEMINI_API_KEY");
      expect(writtenKeys).toContain("NEON_API_KEY");
      expect(writtenKeys).not.toContain("CARGO_HOME");

      const devVarsText = readFileSync(devVarsPath, "utf8");
      expect(devVarsText).toContain(
        "CLOUDFLARE_ACCOUNT_ID=ca22c1a51a145f919b54afa18d936516",
      );

      const vercel = exportForVercelEnv({ envPath: envFile });
      expect(vercel.summary.GEMINI_API_KEY).toBe("SET [len=34]");
      expect(vercel.summary.CARGO_HOME).toBeUndefined();
    });
  });

  test("syncAllEditorConfigs preserves UI settings while wiring providers and MCPs", () => {
    withTempDir((dir) => {
      const zedDir = join(dir, "Roaming", "Zed");
      Bun.spawnSync([
        "powershell",
        "-NoProfile",
        "-Command",
        `New-Item -ItemType Directory -Force -Path '${zedDir}' | Out-Null`,
      ]);
      writeFileSync(
        join(zedDir, "settings.json"),
        `// Comment header\n{\n  "ui_font_size": 16,\n  "theme": { "dark": "One Dark", },\n}\n`,
        "utf8",
      );

      const res = syncAllEditorConfigs({
        homeDir: dir,
        appDataDir: join(dir, "Roaming"),
      });

      expect(existsSync(res.opencodePath)).toBe(true);
      expect(existsSync(res.zedPath)).toBe(true);
      expect(existsSync(res.piSettingsPath)).toBe(true);
      expect(existsSync(res.piModelsPath)).toBe(true);

      const ocJson = JSON.parse(readFileSync(res.opencodePath, "utf8"));
      expect(ocJson.providers.anthropic.apiKey).toBe("{env:ANTHROPIC_API_KEY}");
      expect(ocJson.providers.google.apiKey).toBe("{env:GEMINI_API_KEY}");
      expect(ocJson.providers.ring3_local.baseUrl).toBe(
        "http://127.0.0.1:8787/v1",
      );
      expect(ocJson.providers.locally_uncensored.baseUrl).toBe(
        "http://127.0.0.1:8129/v1",
      );
      expect(ocJson.mcp.figma.environment.FIGMA_ACCESS_TOKEN).toBe(
        "{env:FIGMA_ACCESS_TOKEN}",
      );

      const zedRaw = readFileSync(res.zedPath, "utf8");
      expect(zedRaw).toContain('"ui_font_size": 16');
      expect(zedRaw).toContain('"ring3_agent"');
      expect(zedRaw).toContain('"native-hardware-cuda"');
    });
  });
});

describe("env-kit cross-language loaders integration", () => {
  test("Python sovereign_env.py parses and redacts secrets cleanly", () => {
    withTempDir((dir) => {
      const envFile = join(dir, ".env");
      writeFileSync(
        envFile,
        'SYNTH_PY_TOKEN="ghp_py_mock_secret_12345"\nSYNTH_PY_PROJECT=aphrody-py\n',
        "utf8",
      );

      const pyScript = `
import sys
sys.path.insert(0, r"C:\\src\\packages\\env-kit\\loaders\\python")
import sovereign_env
env = sovereign_env.load_monorepo_env(
    env_path=r"${envFile}",
    service="py-spec",
    required=["SYNTH_PY_TOKEN", "SYNTH_PY_PROJECT"],
    inject_process_env=False,
)
assert env["SYNTH_PY_TOKEN"] == "ghp_py_mock_secret_12345"
assert env["SYNTH_PY_PROJECT"] == "aphrody-py"
rep = repr(env)
assert "ghp_py_mock_secret_12345" not in rep
assert "SET [len=24]" in rep
print("PY_OK")
`;
      const res = spawnSync("python", ["-c", pyScript], { encoding: "utf8" });
      expect(res.status).toBe(0);
      expect(res.stdout.trim()).toBe("PY_OK");
    });
  });

  test("PowerShell load-env.ps1 loads variables without overriding existing process env", () => {
    withTempDir((dir) => {
      const envFile = join(dir, ".env");
      writeFileSync(
        envFile,
        "SYNTH_PS_KEY=from_dotenv\nSYNTH_PS_EXISTING=from_dotenv\n",
        "utf8",
      );

      const cmd = `
$env:SYNTH_PS_EXISTING = 'keep_me'
. 'C:\\src\\packages\\env-kit\\loaders\\shell\\load-env.ps1' -EnvPath '${envFile}' -Required @('SYNTH_PS_KEY')
if ($env:SYNTH_PS_KEY -ne 'from_dotenv') { exit 2 }
if ($env:SYNTH_PS_EXISTING -ne 'keep_me') { exit 3 }
Write-Output 'PS_OK'
`;
      const res = spawnSync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", cmd],
        { encoding: "utf8" },
      );
      expect(res.status).toBe(0);
      expect(res.stdout.trim()).toBe("PS_OK");
    });
  });

  test("Rust cargo test and Go test suites pass", () => {
    const cargo = spawnSync("cargo", ["test", "--quiet"], {
      cwd: "C:\\src\\packages\\env-kit\\loaders\\rust",
      encoding: "utf8",
    });
    expect(cargo.status).toBe(0);

    const go = spawnSync("go", ["test", "./..."], {
      cwd: "C:\\src\\packages\\env-kit\\loaders\\go",
      encoding: "utf8",
    });
    expect(go.status).toBe(0);
  }, 30_000);
});
