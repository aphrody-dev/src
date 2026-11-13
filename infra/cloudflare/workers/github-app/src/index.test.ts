import { describe, expect, test } from "bun:test";
import worker, { classify } from "./index.ts";

const repo = {
  full_name: "aphrody-labs/src",
  default_branch: "main",
  owner: { login: "aphrody-labs" },
};

describe("classify", () => {
  test("CI rouge sur main", () => {
    const e = classify("workflow_run", "d1", {
      action: "completed",
      repository: repo,
      workflow_run: {
        conclusion: "failure",
        head_branch: "main",
        head_sha: "abc",
        html_url: "u",
        name: "ci",
        event: "push",
        head_repository: { full_name: "aphrody-labs/src" },
      },
    });
    expect(e?.kind).toBe("ci_red");
    // PR de fork dont la branche s appelle main : ignorée.
    expect(
      classify("workflow_run", "d4", {
        action: "completed",
        repository: repo,
        workflow_run: {
          conclusion: "failure",
          head_branch: "main",
          event: "pull_request",
          head_repository: { full_name: "evil/src" },
        },
      }),
    ).toBeNull();
    // Installation tierce de l App publique : ignorée.
    expect(
      classify("release", "d5", {
        action: "published",
        repository: { ...repo, full_name: "x/y", owner: { login: "x" } },
        release: { tag_name: "v1" },
      }),
    ).toBeNull();
    expect(
      classify("workflow_run", "d2", {
        action: "completed",
        repository: repo,
        workflow_run: { conclusion: "failure", head_branch: "feat" },
      }),
    ).toBeNull();
    expect(
      classify("workflow_run", "d3", {
        action: "completed",
        repository: repo,
        workflow_run: { conclusion: "success", head_branch: "main" },
      }),
    ).toBeNull();
  });
  test("push sur la branche par défaut seulement", () => {
    expect(
      classify("push", "d", {
        ref: "refs/heads/main",
        after: "1".repeat(40),
        repository: repo,
        head_commit: { message: "a\nb" },
      })?.title,
    ).toBe("a");
    expect(
      classify("push", "d", {
        ref: "refs/heads/x",
        after: "1",
        repository: repo,
      }),
    ).toBeNull();
    expect(
      classify("push", "d", {
        ref: "refs/heads/main",
        deleted: true,
        after: "0".repeat(40),
        repository: repo,
      }),
    ).toBeNull();
  });
  test("release, sécurité, bruit", () => {
    expect(
      classify("release", "d", {
        action: "published",
        repository: repo,
        release: { tag_name: "v1" },
      })?.kind,
    ).toBe("release");
    expect(
      classify("dependabot_alert", "d", {
        action: "created",
        repository: repo,
        alert: { html_url: "u", security_advisory: { summary: "s" } },
      })?.title,
    ).toBe("s");
    expect(
      classify("issues", "d", { action: "opened", repository: repo }),
    ).toBeNull();
  });
});

describe("fetch", () => {
  const secret = "s3cret";
  const sign = async (b: string) => {
    const k = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    return `sha256=${Buffer.from(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(b))).toString("hex")}`;
  };
  // timingSafeEqual n'existe que dans workerd : équivalent pour le test.
  (crypto.subtle as any).timingSafeEqual ??= (a: Uint8Array, b: Uint8Array) =>
    a.length === b.length && a.every((x, i) => x === b[i]);
  test("signature exigée, événement mis en file", async () => {
    const sent: unknown[] = [];
    const env = {
      GITHUB_WEBHOOK_SECRET: secret,
      EVENTS: { send: async (m: unknown) => void sent.push(m) },
    } as any;
    const body = JSON.stringify({
      action: "published",
      repository: repo,
      release: { tag_name: "v2" },
    });
    const bad = await worker.fetch(
      new Request("https://x/github", {
        method: "POST",
        body,
        headers: { "x-hub-signature-256": "sha256=00" },
      }),
      env,
    );
    expect(bad.status).toBe(401);
    const ok = await worker.fetch(
      new Request("https://x/github", {
        method: "POST",
        body,
        headers: {
          "x-hub-signature-256": await sign(body),
          "x-github-event": "release",
          "x-github-delivery": "id1",
        },
      }),
      env,
    );
    expect(ok.status).toBe(202);
    expect(sent).toHaveLength(1);
  });
});
