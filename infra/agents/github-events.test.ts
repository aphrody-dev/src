import { describe, expect, test } from "bun:test";
import { coalesce, eventTask, type GithubEvent } from "./github-events.ts";

const ev = (x: Partial<GithubEvent>): GithubEvent => ({ v: 1, delivery: "d-0000000000000000001", event: "x", kind: "release", at: "", ...x });

describe("eventTask", () => {
  test("CI rouge sur src : même id que ciWatch, commit du runner", () => {
    const t = eventTask(ev({ kind: "ci_red", event: "workflow_run", repo: "aphrody-labs/src", sha: "0123456789abcdef", title: "ci : failure", url: "u" }), "prd")!;
    expect(t.id).toBe("ci-fix-0123456789ab");
    expect(t.role).toBe("sre");
    expect(t.commit?.paths).toEqual([""]);
  });
  test("CI rouge hors checkout : rapport sans commit", () => {
    const t = eventTask(ev({ kind: "ci_red", repo: "aphrody-labs/bun", sha: "ffffffffffffffff" }), "prd")!;
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
  });
});

describe("coalesce", () => {
  test("une revue par dépôt et par heure, plage depuis la précédente", () => {
    const st = {};
    const t0 = new Date("2026-11-13T10:00:00Z");
    const a = coalesce(st, [ev({ kind: "push_main", repo: "aphrody-labs/src", sha: "a".repeat(40), title: "one" }), ev({ kind: "push_main", repo: "aphrody-labs/src", sha: "b".repeat(40), title: "two" })], "prd", t0);
    expect(a).toHaveLength(1);
    expect(a[0]!.prompt).toContain("one | two");
    expect(coalesce(st, [ev({ kind: "push_main", repo: "aphrody-labs/src", sha: "c".repeat(40), title: "three" })], "prd", new Date("2026-11-13T10:30:00Z"))).toHaveLength(0);
    const c = coalesce(st, [], "prd", new Date("2026-11-13T11:01:00Z"));
    expect(c).toHaveLength(1);
    expect(c[0]!.prompt).toContain("b".repeat(40) + ".." + "c".repeat(40));
  });
});
