export const meta = {
  name: "gemini-review",
  description:
    "Submit src deliverables to Gemini via the relay, verify each defect, archive the verdicts",
  whenToUse:
    'Mandatory Gemini review of src deliverables (args: { files: ["path", ...] } relative to C:\\src)',
  phases: [
    { title: "Review", detail: "relay gemini_review (MCP relay) per file" },
    {
      title: "Verification",
      detail: "each reported defect is confirmed or refuted in the code",
    },
  ],
};

const REVIEW = {
  type: "object",
  properties: {
    file: { type: "string" },
    score: { type: "number" },
    chat: { type: "string" },
    defects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          where: { type: "string" },
          claim: { type: "string" },
          fix: { type: "string" },
        },
        required: ["where", "claim"],
      },
    },
  },
  required: ["file", "score", "defects"],
};
const VERDICT = {
  type: "object",
  properties: { real: { type: "boolean" }, evidence: { type: "string" } },
  required: ["real", "evidence"],
};

const files = Array.isArray(args?.files) ? args.files : [];
if (!files.length) throw new Error("args.files required");

const results = await pipeline(
  files,
  (file) =>
    agent(
      `Load the MCP tool mcp__relay__gemini_review via ToolSearch, read ${file}, and call it with title="${file}" and content=the full text of the file. ` +
        `Report the /20 score and each reported defect (location, claim, proposed fix), as well as the returned conversation URL.`,
      { label: `review:${file}`, phase: "Review", schema: REVIEW },
    ),
  (review, file) =>
    review &&
    parallel(
      review.defects.map(
        (d) => () =>
          agent(
            `Verify in ${file} this claim from an external review, by reading the actual code: "${d.claim}" (location: ${d.where}). ` +
              `real=true only if the defect is present and demonstrable; otherwise real=false with the counter-evidence.`,
            {
              label: `verif:${file}`,
              phase: "Verification",
              schema: VERDICT,
              effort: "low",
            },
          ).then((v) => ({ ...d, verdict: v })),
      ),
    ).then((defects) => ({ ...review, defects: defects.filter(Boolean) })),
);

return results.filter(Boolean).map((r) => ({
  file: r.file,
  score: r.score,
  chat: r.chat,
  confirmed: r.defects.filter((d) => d.verdict?.real),
  refuted: r.defects.filter((d) => d.verdict && !d.verdict.real),
}));
