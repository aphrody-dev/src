// Contribution rules checked before a patch goes upstream. Sources (read 2026-11-13):
// - bun: .github/pull_request_template.md ("What does this PR do?", "How did you verify your code works?"),
//   .github/workflows/on-slop.yml (PRs closed when they fail to verify the problem or to test the fix),
//   format.yml / lint.yml / rust-lints.yml / source-lints.yml (dispatched separately). No CLA, no DCO.
// - Chromium: docs/contributing.md (CLA, AUTHORS entry, `git cl upload`, 72-column description, Bug:/Fixed:
//   footer) and agents/ai_policy.md (the human behind the account reviews, understands and answers).
// - src: AGENTS.md (no emoji, no AI attribution, no secret).
import type { Meta } from "./patch.ts";

export type Finding = {
  level: "error" | "warn" | "info";
  rule: string;
  msg: string;
};

export type PatchInput = {
  meta: Meta;
  files: string[];
  added: string; // added lines of the diff, joined
  authorEmail: string;
  authors?: string | null; // Chromium AUTHORS file content, when the checkout has it
};

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;
const AI_ATTRIBUTION =
  /(Co-Authored-By:.*\b(Claude|Anthropic|GPT|OpenAI|Copilot|Gemini|Codex)\b|Generated (with|by) .*(Claude|AI|GPT|Copilot|Gemini)|\bnoreply@anthropic\.com\b)/i;
const SECRET =
  /(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sk-ant-[A-Za-z0-9-]{20,}|xox[bp]-[A-Za-z0-9-]{20,})/;
const VERIFY =
  /^(Tested|Test|Verification|Verified|How (did you|I) verif\w*)\b[^\n]*:/im;

export function checkCommon(p: PatchInput): Finding[] {
  const f: Finding[] = [];
  const msg = p.meta.subject + "\n" + p.meta.body;
  if (EMOJI.test(msg))
    f.push({ level: "error", rule: "no-emoji", msg: "emoji dans le message" });
  if (EMOJI.test(p.added))
    f.push({
      level: "warn",
      rule: "no-emoji",
      msg: "emoji dans les lignes ajoutées",
    });
  if (AI_ATTRIBUTION.test(msg))
    f.push({
      level: "error",
      rule: "no-ai-attribution",
      msg: "attribution IA dans le message",
    });
  if (SECRET.test(p.added) || SECRET.test(msg))
    f.push({
      level: "error",
      rule: "no-secret",
      msg: "motif de secret dans le patch",
    });
  if (p.meta.subject.length > 72)
    f.push({
      level: "warn",
      rule: "subject-length",
      msg: `sujet de ${p.meta.subject.length} caractères (> 72)`,
    });
  if (p.meta.status === "inappropriate")
    f.push({
      level: "error",
      rule: "status",
      msg: `Upstream-Status: Inappropriate [${p.meta.statusNote}] : pas destiné à l'amont`,
    });
  return f;
}

/** Paths of bun that are code, where on-slop asks for a test. */
const BUN_CODE = /^(src\/|packages\/bun-[\w-]+\/src\/)/;
const BUN_TEST = /^(test\/|src\/.*\.test\.|packages\/.*\/test\/)/;

export function checkBun(p: PatchInput): Finding[] {
  const f = checkCommon(p);
  if (!p.meta.body.trim())
    f.push({
      level: "error",
      rule: "bun-pr-template",
      msg: "corps vide : « What does this PR do? » sans contenu",
    });
  if (!VERIFY.test(p.meta.body))
    f.push({
      level: "error",
      rule: "bun-pr-template",
      msg: "aucun paragraphe « Tested: » / « Verification: » : « How did you verify your code works? » serait vide (on-slop.yml)",
    });
  const code = p.files.some((x) => BUN_CODE.test(x) && !BUN_TEST.test(x));
  const tests = p.files.some((x) => BUN_TEST.test(x));
  if (code && !tests)
    f.push({
      level: "error",
      rule: "bun-test",
      msg: "code de src/ modifié sans test sous test/ (on-slop.yml : tester le correctif)",
    });
  return f;
}

export function checkChromium(p: PatchInput): Finding[] {
  const f = checkCommon(p);
  if (!/^(Bug|Fixed): \S+/m.test(p.meta.body))
    f.push({
      level: "error",
      rule: "cr-footer",
      msg: "pied « Bug: <n> » ou « Fixed: <n> » absent (docs/contributing.md)",
    });
  const long = p.meta.body
    .split("\n")
    .filter((l) => l.length > 72 && !/^\S+:\/\/\S+$/.test(l.trim()));
  if (long.length)
    f.push({
      level: "warn",
      rule: "cr-wrap",
      msg: `${long.length} ligne(s) de description > 72 colonnes`,
    });
  if (p.authors !== undefined && p.authors !== null) {
    const domain = p.authorEmail.split("@")[1] ?? "";
    const listed =
      p.authors.includes(p.authorEmail) ||
      (domain && p.authors.includes(`*@${domain}`));
    if (!listed && !p.files.includes("AUTHORS"))
      f.push({
        level: "error",
        rule: "cr-authors",
        msg: `${p.authorEmail} absent de AUTHORS : l'ajouter dans la première CL`,
      });
  }
  f.push({
    level: "info",
    rule: "cr-cla",
    msg: "CLA individuel Google signé par le propriétaire : https://cla.developers.google.com/about/google-individual",
  });
  f.push({
    level: "info",
    rule: "cr-ai-policy",
    msg: "agents/ai_policy.md : le propriétaire relit, comprend et répond lui-même aux relecteurs",
  });
  f.push({
    level: "info",
    rule: "cr-presubmit",
    msg: "git cl format && git cl presubmit --upload sur fr1 avant git cl upload",
  });
  return f;
}

export function check(rules: string, p: PatchInput): Finding[] {
  if (rules === "bun") return checkBun(p);
  if (rules === "chromium") return checkChromium(p);
  return checkCommon(p);
}

/** PR body in bun's template, from the commit body (verification paragraph split out). */
export function bunPrBody(meta: Meta): string {
  const paras = meta.body.split(/\n{2,}/);
  const i = paras.findIndex((x) => VERIFY.test(x));
  const what = (i < 0 ? paras : paras.slice(0, i)).join("\n\n").trim();
  const how =
    i < 0 ? "" : paras.slice(i).join("\n\n").replace(VERIFY, "").trim();
  return `### What does this PR do?\n\n${what}\n\n### How did you verify your code works?\n\n${how}\n`;
}
