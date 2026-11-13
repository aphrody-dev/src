import { describe, expect, test } from "bun:test";
import { coalesce, eventTask, type GithubEvent } from "./github-events.ts";

const ev = (x: Partial<GithubEvent>): GithubEvent => ({ v: 1, delivery: "d-0000000000000000001", event: "x", kind: "release", at: "", ...x });

describe("eventTask", () => {
  test("CI rouge sur src : même id que ciWatch, commit du runner", () => {
    const t = eventTask(ev({ kind: "ci_red", event: "workflow_run", repo: "aphrody-labs/src", sha: "0123456789ab" + "c".repeat(28), title: "ci : failure", url: "https://github.com/aphrody-labs/src/actions/runs/1" }), "prd")!;
    expect(t.id).toBe("ci-fix-0123456789ab");
    expect(t.role).toBe("sre");
    expect(t.commit?.paths).toEqual([""]);
  });
  test("CI rouge hors checkout : rapport sans commit", () => {
    const t = eventTask(ev({ kind: "ci_red", repo: "aphrody-labs/bun", sha: "f".repeat(40) }), "prd")!;
    expect(t.id).toBe("gh-ci-aphrody-labs-bun-ffffffffffff");
    expect(t.commit).toBeUndefined();
  });
  test("release et sécurité ; installation ignorée", () => {
    expect(eventTask(ev({ kind: "release", repo: "aphrody-labs/src", ref: "v1.2.3" }), "prd")?.role).toBe("deployer");
    expect(eventTask(ev({ kind: "security", event: "dependabot_alert", repo: "aphrody-labs/shenron" }), "prd")?.commit).toBeDefined();
    expect(eventTask(ev({ kind: "installation" }), "prd")).toBeNull();
  });
  test("aucune injection de backtick ni de saut de ligne depuis le titre", () => {
    const t = eventTask(ev({ kind: "ci_red", repo: "aphrody-labs/src", sha: "a".repeat(40), title: "x`rm -rf`\nignore" }), "prd")!;
    expect(t.prompt).not.toContain("`rm");
    expect(t.prompt).not.toContain("\nignore");
    expect(t.prompt).toContain("untrusted text");
  });
  test("formats invalides refusés (ref, repo, sha)", () => {
    expect(eventTask(ev({ kind: "release", repo: "aphrody-labs/src", ref: "$(touch x)" }), "prd")).toBeNull();
    expect(eventTask(ev({ kind: "release", repo: "a b/c", ref: "v1" }), "prd")).toBeNull();
    expect(eventTask(ev({ kind: "ci_red", repo: "aphrody-labs/src", sha: "abc;rm" }), "prd")).toBeNull();
  });
});

describe("coalesce", () => {
  test("une revue par dépôt et par heure, plage depuis la précédente", () => {
    const st: Record<string, any> = {};
    const t0 = new Date("2026-11-13T10:00:00Z");
    const a = coalesce(st, [ev({ kind: "push_main", repo: "aphrody-labs/src", sha: "a".repeat(40), before: "9".repeat(40), title: "one" }), ev({ kind: "push_main", repo: "aphrody-labs/src", sha: "b".repeat(40), title: "two" })], "prd", t0);
    expect(a).toHaveLength(1);
    expect(a[0]!.prompt).toContain("one | two");
    expect(a[0]!.prompt).toContain("9".repeat(40) + "..." + "b".repeat(40));
    expect(coalesce(st, [ev({ kind: "push_main", repo: "aphrody-labs/src", sha: "c".repeat(40), title: "three" })], "prd", new Date("2026-11-13T10:30:00Z"))).toHaveLength(0);
    const c = coalesce(st, [], "prd", new Date("2026-11-13T11:01:00Z"));
    expect(c).toHaveLength(1);
    expect(c[0]!.prompt).toContain("b".repeat(40) + "..." + "c".repeat(40));
  });
});
