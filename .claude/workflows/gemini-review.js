export const meta = {
  name: 'gemini-review',
  description: 'Soumettre des livrables de src à Gemini via le relais, vérifier chaque défaut, archiver les verdicts',
  whenToUse: 'Revue Gemini obligatoire des livrables de src (args : { files: ["chemin", ...] } relatifs à C:\\src)',
  phases: [
    { title: 'Revue', detail: 'gemini_review du relais (MCP relay) par fichier' },
    { title: 'Vérification', detail: 'chaque défaut annoncé est confirmé ou réfuté dans le code' },
  ],
}

const REVIEW = {
  type: 'object',
  properties: {
    file: { type: 'string' },
    score: { type: 'number' },
    chat: { type: 'string' },
    defects: { type: 'array', items: { type: 'object', properties: { where: { type: 'string' }, claim: { type: 'string' }, fix: { type: 'string' } }, required: ['where', 'claim'] } },
  },
  required: ['file', 'score', 'defects'],
}
const VERDICT = {
  type: 'object',
  properties: { real: { type: 'boolean' }, evidence: { type: 'string' } },
  required: ['real', 'evidence'],
}

const files = Array.isArray(args?.files) ? args.files : []
if (!files.length) throw new Error('args.files requis')

const results = await pipeline(
  files,
  (file) =>
    agent(
      `Charge l'outil MCP mcp__relay__gemini_review via ToolSearch, lis ${file}, et appelle-le avec title="${file}" et content=le texte complet du fichier. ` +
        `Rapporte la note /20 et chaque défaut annoncé (emplacement, affirmation, correction proposée), ainsi que l'URL de conversation renvoyée.`,
      { label: `revue:${file}`, phase: 'Revue', schema: REVIEW },
    ),
  (review, file) =>
    review &&
    parallel(
      review.defects.map((d) => () =>
        agent(
          `Vérifie dans ${file} cette affirmation d'une revue externe, en lisant le code réel : « ${d.claim} » (emplacement : ${d.where}). ` +
            `real=true uniquement si le défaut est présent et démontrable ; sinon real=false avec la preuve contraire.`,
          { label: `verif:${file}`, phase: 'Vérification', schema: VERDICT, effort: 'low' },
        ).then((v) => ({ ...d, verdict: v })),
      ),
    ).then((defects) => ({ ...review, defects: defects.filter(Boolean) })),
)

return results.filter(Boolean).map((r) => ({
  file: r.file,
  score: r.score,
  chat: r.chat,
  confirmed: r.defects.filter((d) => d.verdict?.real),
  refuted: r.defects.filter((d) => d.verdict && !d.verdict.real),
}))
