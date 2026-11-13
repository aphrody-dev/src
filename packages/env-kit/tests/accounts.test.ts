import { describe, expect, test } from "bun:test";

// Fixture accounts: the real personal accounts live only in the vault.
process.env.APHRODY_AI_GOOGLE_ACCOUNT = "ai@aphrody.test";
process.env.APHRODY_OWNER_GOOGLE_ACCOUNT = "owner@aphrody.test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// infra/mesh-vn is git-ignored (local only): its mail DNS test runs only where the module exists.
const MESH_VN = join(import.meta.dir, "../../../infra/mesh-vn/src/cloudflare-mail-dns.ts");
const meshVn: any = require("node:fs").existsSync(MESH_VN) ? await import(MESH_VN) : null;
import {
  APHRODY_GCP_PROJECT_ID,
  APHRODY_GCP_PROJECT_NUMBER,
  APHRODY_PRINCIPALS,
  buildAphrodyIamBindingsPlan,
  getIsolatedGcloudEnv,
  initGcloudConfigurations,
  inspectAccountsStatus,
  ORG_PROVIDER_SURFACES,
  resolvePrincipal,
  switchGcloudPrincipal,
} from "../src/accounts";

function withTempDir(fn: (dir: string) => void | Promise<void>) {
  const dir = mkdtempSync(join(tmpdir(), "env-kit-accounts-test-"));
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  try {
    const res = fn(dir);
    if (res && typeof (res as Promise<void>).finally === "function") {
      return (res as Promise<void>).finally(cleanup);
    }
    cleanup();
    return res;
  } catch (err) {
    cleanup();
    throw err;
  }
}

describe("Aphrody 3-Principal Multi-Google & Org Identity Architecture", () => {
  test("resolves all 4 canonical principals by alias, config name, or email", () => {
    expect(resolvePrincipal("ai").email).toBe("ai@aphrody.test");
    expect(resolvePrincipal("ai-agent").alias).toBe("ai");
    expect(resolvePrincipal("ai@aphrody.test").rcloneRemote).toBe(
      "gdrive-ai",
    );

    expect(resolvePrincipal("owner").email).toBe("owner@aphrody.test");
    expect(resolvePrincipal("owner").gcloudConfig).toBe("owner");

    expect(resolvePrincipal("org").email).toBe("contact@aphrody.com");
    expect(resolvePrincipal("org-contact").alias).toBe("org");

    expect(resolvePrincipal("sa").email).toBe(
      "yolo-automation@aphrody.iam.gserviceaccount.com",
    );
    expect(resolvePrincipal("sa-automation").memberPrefix).toBe(
      "serviceAccount",
    );

    expect(() => resolvePrincipal("unknown-principal")).toThrow(
      /Unknown Aphrody Google principal/,
    );
  });

  test("generates isolated gcloud child environment without clobbering global active config", () => {
    withTempDir((dir) => {
      const env = getIsolatedGcloudEnv("ai", {
        baseEnv: { PATH: "/usr/bin", CUSTOM_FLAG: "1" },
        homeDir: dir,
        ensureAdcDir: true,
      });

      expect(env.CLOUDSDK_ACTIVE_CONFIG_NAME).toBe("ai-agent");
      expect(env.CLOUDSDK_CORE_PROJECT).toBe("aphrody");
      expect(env.CLOUDSDK_CORE_ACCOUNT).toBe("ai@aphrody.test");
      expect(env.CLOUDSDK_COMPUTE_REGION).toBe("europe-west1");
      expect(env.CLOUDSDK_AI_REGION).toBe("us-central1");
      expect(env.GOOGLE_CLOUD_REGION).toBe("us-central1");
      expect(env.APHRODY_RCLONE_REMOTE).toBe("gdrive-ai");
      expect(env.APHRODY_GCP_PROJECT_NUMBER).toBe("468000409790");
      expect(env.CUSTOM_FLAG).toBe("1");

      const orgEnv = getIsolatedGcloudEnv("org", {
        baseEnv: {},
        homeDir: dir,
      });
      expect(orgEnv.CLOUDSDK_ACTIVE_CONFIG_NAME).toBe("org-contact");
      expect(orgEnv.CLOUDSDK_CORE_ACCOUNT).toBe("contact@aphrody.com");
      expect(orgEnv.GOOGLE_CLOUD_REGION).toBe("europe-west1");
    });
  });

  test("builds complete idempotent GCP IAM bindings plan for project aphrody (#468000409790)", () => {
    const plan = buildAphrodyIamBindingsPlan();
    expect(plan.project).toBe(APHRODY_GCP_PROJECT_ID);
    expect(plan.projectNumber).toBe(APHRODY_GCP_PROJECT_NUMBER);
    expect(plan.executorConfig).toBe("owner");
    expect(plan.executorAccount).toBe("owner@aphrody.test");
    expect(plan.enabledApis).toContain("aiplatform.googleapis.com");
    expect(plan.enabledApis).toContain("developerconnect.googleapis.com");
    expect(plan.enabledApis).toContain("drive.googleapis.com");

    const membersAndRoles = plan.bindings.map((b) => `${b.member}=>${b.role}`);
    expect(membersAndRoles).toContain(
      "user:owner@aphrody.test=>roles/owner",
    );
    expect(membersAndRoles).toContain(
      "user:ai@aphrody.test=>roles/aiplatform.user",
    );
    expect(membersAndRoles).toContain(
      "user:ai@aphrody.test=>roles/cloudbuild.builds.editor",
    );
    expect(membersAndRoles).toContain(
      "user:contact@aphrody.com=>roles/secretmanager.admin",
    );
    expect(membersAndRoles).toContain(
      "serviceAccount:yolo-automation@aphrody.iam.gserviceaccount.com=>roles/developerconnect.admin",
    );
  });

  test("inspects accounts status strictly with boolean key presence and never leaks secret values", () => {
    withTempDir((dir) => {
      const envFile = join(dir, ".env");
      const mockSecret = "cf_super_secret_token_never_leak_999888";
      writeFileSync(
        envFile,
        [
          `CLOUDFLARE_API_TOKEN=${mockSecret}`,
          "GOOGLE_CLOUD_PROJECT=aphrody",
          "APHRODY_ORG_GOOGLE_ACCOUNT=contact@aphrody.com",
          "MAIL_HOST=mail.aphrody.com",
          "SMTP_PASSWORD=smtp_secret_never_leak_777",
        ].join("\n"),
        "utf8",
      );

      const originalCf = process.env.CLOUDFLARE_API_TOKEN;
      delete process.env.CLOUDFLARE_API_TOKEN;

      try {
        const status = inspectAccountsStatus({
          envPath: envFile,
          homeDir: dir,
          runner: (cmd, args) => {
            if (cmd === "gcloud" && args[0] === "config") {
              return {
                status: 0,
                stderr: "",
                stdout: JSON.stringify([
                  {
                    name: "ai-agent",
                    is_active: false,
                    properties: {
                      core: {
                        account: "ai@aphrody.test",
                        project: "aphrody",
                      },
                      compute: { region: "europe-west1" },
                      ai: { region: "us-central1" },
                    },
                  },
                  {
                    name: "owner",
                    is_active: true,
                    properties: {
                      core: {
                        account: "owner@aphrody.test",
                        project: "aphrody",
                      },
                      compute: { region: "europe-west1" },
                      ai: { region: null },
                    },
                  },
                ]),
              };
            }
            if (cmd === "gcloud" && args[0] === "auth") {
              return {
                status: 0,
                stderr: "",
                stdout: JSON.stringify([
                  { account: "owner@aphrody.test", status: "ACTIVE" },
                ]),
              };
            }
            if (cmd === "rclone") {
              return {
                status: 0,
                stderr: "",
                stdout: "gdrive-ai:\nvps:\n",
              };
            }
            return { status: 0, stdout: "", stderr: "" };
          },
        });

        expect(status.orgSurfaces.length).toBe(ORG_PROVIDER_SURFACES.length);
        expect(status.activeGcloudConfig).toBe("owner");
        expect(status.rcloneRemotes).toContain("gdrive-ai");

        const aiStatus = status.principals.find((p) => p.alias === "ai")!;
        expect(aiStatus.configExists).toBe(true);
        expect(aiStatus.oauthCached).toBe(false);
        expect(aiStatus.rcloneReady).toBe(true);

        const cfSurface = status.orgSurfaces.find(
          (s) => s.id === "cloudflare",
        )!;
        expect(cfSurface.ready).toBe(true);
        expect(cfSurface.keyPresence.CLOUDFLARE_API_TOKEN).toBe(true);

        const jsonDump = JSON.stringify(status);
        expect(jsonDump).not.toContain(mockSecret);
        expect(jsonDump).not.toContain("smtp_secret_never_leak_777");
      } finally {
        if (originalCf !== undefined) {
          process.env.CLOUDFLARE_API_TOKEN = originalCf;
        }
      }
    });
  });

  test("initGcloudConfigurations creates missing configs and preserves active config", () => {
    const calls: string[] = [];
    const res = initGcloudConfigurations({
      runner: (cmd, args) => {
        calls.push(`${cmd} ${args.join(" ")}`);
        if (
          args[0] === "config" &&
          args[1] === "configurations" &&
          args[2] === "list"
        ) {
          return {
            status: 0,
            stderr: "",
            stdout: JSON.stringify([
              {
                name: "default",
                is_active: true,
                properties: {
                  core: {
                    account: APHRODY_PRINCIPALS.sa.email,
                    project: "aphrody",
                  },
                },
              },
            ]),
          };
        }
        if (args[0] === "auth") {
          return { status: 0, stderr: "", stdout: "[]" };
        }
        return { status: 0, stderr: "", stdout: "" };
      },
    });

    expect(res.createdConfigs).toEqual([
      "ai-agent",
      "owner",
      "org-contact",
      "sa-automation",
    ]);
    expect(res.preservedActiveConfig).toBe("default");
    expect(
      calls.some((c) =>
        c.includes(
          "gcloud config configurations create ai-agent --no-activate --quiet",
        ),
      ),
    ).toBe(true);
    expect(
      calls.some((c) =>
        c.includes(
          "gcloud config set ai/region us-central1 --configuration=ai-agent --quiet",
        ),
      ),
    ).toBe(true);

    const sw = switchGcloudPrincipal("org", {
      runner: (_cmd, args) => {
        if (
          args[0] === "config" &&
          args[1] === "configurations" &&
          args[2] === "list"
        ) {
          return {
            status: 0,
            stderr: "",
            stdout: JSON.stringify([{ name: "org-contact", is_active: false }]),
          };
        }
        if (args[0] === "auth") {
          return { status: 0, stderr: "", stdout: "[]" };
        }
        return { status: 0, stderr: "", stdout: "" };
      },
    });
    expect(sw.activated).toBe(true);
    expect(sw.oauthCached).toBe(false);
    expect(sw.loginHint).toContain("contact@aphrody.com");
  });

  test.skipIf(!meshVn)("generates Cloudflare mail DNS records (MX, SPF, Dual DKIM, DMARC, MTA-STS, TLS-RPT, BIMI)", async () => {
    await withTempDir(async (dir) => {
      const records = meshVn.generateCloudflareMailDnsRecords({
        ed25519PublicKeyBase64: "MCowBQYDK2VwAyEAMockEd25519Key",
        rsaPublicKeyBase64: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMockRsaKey",
      });

      expect(records.length).toBe(12);

      const mxPrimary = records.find(
        (r) => r.type === "MX" && r.priority === 10,
      );
      expect(mxPrimary?.content).toBe("mail.aphrody.com");

      const mxWorkspace = records.find(
        (r) => r.type === "MX" && r.priority === 20,
      );
      expect(mxWorkspace?.content).toBe("smtp.google.com");

      const spf = records.find(
        (r) => r.type === "TXT" && r.name === "aphrody.com",
      );
      expect(spf?.content).toContain("a:mail.aphrody.com");
      expect(spf?.content).toContain("include:_spf.google.com");

      const dmarc = records.find((r) => r.name === "_dmarc.aphrody.com");
      expect(dmarc?.content).toBe(
        "v=DMARC1; p=quarantine; rua=mailto:dmarc@aphrody.com; ruf=mailto:dmarc@aphrody.com; fo=1",
      );

      const bimi = records.find((r) => r.name === "default._bimi.aphrody.com");
      expect(bimi?.content).toContain(
        "https://aphrody.com/assets/brand/aphrody-monogram-bimi.svg",
      );

      const zoneText = meshVn.formatBindZoneFile(records);
      expect(zoneText).toContain("s1-ed25519._domainkey.aphrody.com.");
      expect(zoneText).toContain("s2-rsa._domainkey.aphrody.com.");
      expect(zoneText).toContain("_mta-sts.aphrody.com.");
      expect(zoneText).toContain("_smtp._tls.aphrody.com.");

      const syncRes = await meshVn.syncCloudflareMailDns({
        outDir: dir,
        applyLive: false,
      });
      expect(syncRes.mode).toBe("dry-run");
      const parsedJson = JSON.parse(readFileSync(syncRes.jsonPath, "utf8"));
      expect(parsedJson.length).toBe(12);
    });
  });
});
