import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { openPolyglotBridge } from "./index";

describe("Three-Way Polyglot FFI Bridge (Rust <-> Bun v1.4.4 <-> Go 1.27)", () => {
  const bridge = openPolyglotBridge();

  test("loads Go 1.27 infra_go.dll, Rust pi_opencode_native.dll, and Rust agent_desktop_ffi.dll in the same process", () => {
    expect(bridge.goInfraVersion()).toBe(127);
    expect(bridge.agentDesktopAbiVersion()).toBe(7);
    expect(bridge.agentDesktopInit(7)).toBe(0);
  });

  test("enforces host boundary safety across both Rust and Go FFI", () => {
    expect(bridge.rustIsSafePath("C:\\Windows\\System32")).toBe(false);
    expect(bridge.rustIsSafePath("C:\\src\\infra")).toBe(true);
    expect(() => bridge.goDetectProject("C:\\Windows\\System32")).toThrow();
  });

  test("invokes Go zero-config detector on real C:\\src projects via C-ABI", () => {
    const aphrody = bridge.goDetectProject("C:\\src\\apps\\aphrody");
    expect(["aphrody", "web"]).toContain(aphrody.name);
    expect(aphrody.runtime).toBe("bun-fullstack");
    expect(aphrody.region).toBe("eu-fr");
    expect(aphrody.targetNodes).toContain("fr1");

    const infra = bridge.goDetectProject("C:\\src\\infra");
    expect(infra.runtime).toBe("go-service");

    const triad = bridge.goDetectProject("ai-triad");
    expect(triad.region).toBe("us-google-egress");
    expect(triad.googleEgress).toBe(true);
    expect(triad.targetNodes).toContain("usa");
  });

  test("signs Cloudflare R2 S3v4 AWS4-HMAC-SHA256 headers via Go C-ABI", () => {
    const emptySha256 = createHash("sha256").update("").digest("hex");
    const auth = bridge.goSignR2S3v4({
      method: "PUT",
      url: "https://ca22c1a51a145f919b54afa18d936516.r2.cloudflarestorage.com/shenron-cdn/releases/v1.oci.tar",
      accessKey: "AKIA_TEST_R2_KEY",
      secretKey: "SECRET_TEST_R2_VALUE",
      region: "auto",
      payloadHash: emptySha256,
      isoDate: "20261110T220000Z",
    });
    expect(auth).toStartWith(
      "AWS4-HMAC-SHA256 Credential=AKIA_TEST_R2_KEY/20261110/auto/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=",
    );
  });

  test("executes zero-copy memory pipeline: Rust -> Bun shared Uint8Array -> Go OCI SHA-256 -> Bun", () => {
    const res = bridge.zeroCopyRustToBunToGoSnapshotDigest("C:\\src\\infra\\internal\\oci");
    expect(res.goInfraVersion).toBe(127);
    expect(res.agentDesktopAbiVersion).toBe(7);
    expect(res.rustCpuThreads).toBeGreaterThanOrEqual(1);
    expect(res.rustSnapshot.fileCount).toBeGreaterThanOrEqual(3);
    expect(res.rustSnapshot.merkleHash).toHaveLength(16);

    // Independently recompute SHA-256 over the exact Rust JSON string to verify zero-copy byte accuracy
    const canonicalRustJson = JSON.stringify(res.rustSnapshot);
    const expectedDigest = `sha256:${createHash("sha256").update(canonicalRustJson).digest("hex")}`;
    expect(res.goOciDigest).toBe(expectedDigest);
  });
});
