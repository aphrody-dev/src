// auth daemon : un identifiant qui attend le propriétaire n'est signalé qu'une fois par 24 h.
import { expect, test } from "bun:test";
import { due, needsOwner } from "../src/auth-daemon";

const c = (target: string, status: string) => ({ kind: "cli", target, host: "pc", status, proof: "" }) as any;

test("signalement au plus une fois par 24 h et par identifiant", () => {
  const now = Date.parse("2026-11-13T12:00:00Z");
  const checks = [c("npm", "action"), c("gh", "ok"), c("cf", "invalid"), c("agy", "skip")];
  expect(checks.filter(needsOwner).map((x) => x.target)).toEqual(["npm", "cf"]);
  const prompts = { "pc/npm": now - 3_600_000, "pc/cf": now - 86_400_001 };
  expect(due(checks, prompts, now).map((x) => x.target)).toEqual(["cf"]);
  expect(due(checks, {}, now).map((x) => x.target)).toEqual(["npm", "cf"]);
});
