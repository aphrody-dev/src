# Revue Juge : ai-os review (tribunal à trois voix, commit c962371b) (2026-11-13)

- Date : 2026-11-13. Outil : ai-os review (tribunal à trois voix, docs/reviews/README.md). Voix : Juge.
- Moteur : claude:claude-opus-5-5 (85358 ms, cache miss) ; essais : claude:claude-opus-5-5 ok.
- Objet : `ai-os review (tribunal à trois voix, commit c962371b)` ; 15 fichier(s).
- Note : 10/20. Seuil : 16/20. Statut : à corriger.
- Sources : eng-practices-looking-for@3e6ba5cfc8c0 (https://github.com/google/eng-practices/blob/3e6ba5cfc8c096528173f8f31b2caf15bb78340c/review/reviewer/looking-for.md), eng-practices-standard@deaff2f9ff28 (https://github.com/google/eng-practices/blob/deaff2f9ff28501df657f37a73ed72afa57cb2e0/review/reviewer/standard.md), eng-practices-small-cls@fde5fd40e259 (https://github.com/google/eng-practices/blob/fde5fd40e259bb703dec55f17729abe99c17bf73/review/developer/small-cls.md), chromium-code-reviews@a0ff4b55377c (https://github.com/chromium/chromium/blob/a0ff4b55377c2267617f8041bc3fd8b1641a53c3/docs/code_reviews.md), chromium-web-style@76a9e5ddf3de (https://github.com/chromium/chromium/blob/76a9e5ddf3de5e65c610470a2e68aa23366659a8/styleguide/web/web.md), chromium-rule-of-2@bc2ba7b2a160 (https://github.com/chromium/chromium/blob/bc2ba7b2a1607076f60327102bab31a8bba10f77/docs/security/rule-of-2.md), google-ts-style@52f2e7406a80 (https://github.com/google/styleguide/blob/52f2e7406a802778e44b92694d4aead252b09091/tsguide.md), google-shell-style@3c900a67cd12 (https://github.com/google/styleguide/blob/3c900a67cd1271cf40881075904385cd101fa1bf/shellguide.md), google-markdown-style@102d363fce6d (https://github.com/google/styleguide/blob/102d363fce6d18674d605430e3ddb5eb91487f85/docguide/style.md).
- Listes de contrôle : bun-ts, ci, docs-facts, nhitl-agents, security, shell-justfile (docs/reviews/CHECKLISTS.md) ; sujets : bun-ts, ci, docs-facts, nhitl-agents, security, shell-justfile.

## Verdict brut

Note : 10/20

| Grief | Gemini | Claude | Juge (décision motivée) | Suite |
|---|---|---|---|---|
| `slug` non confiné | G1 | C1 | Confirmé. `join` normalise `judge-<date>-../../../x.md` hors de `outDir`. Le slug vient du MCP (`a.slug`) et de `--slug` sans aucun filtre. | D1 |
| Aucune expurgation des secrets | G2 | C6 | Confirmé. `collect` lit tout chemin interne, `.env` compris (le `deny` de `.claude/settings.json` ne couvre pas ce code). Le texte part au moteur, puis le verdict brut est archivé et copié dans le résumé de CI. | D2 |
| « conforme » sur une revue tronquée | G3 | C3 | Confirmé. `truncated` ne change jamais `status`. `max_bytes` compte en réalité des caractères. | D3 |
| Voix sans moteur, statut conforme | G4 | - | Confirmé. Si Gemini échoue, le juge tranche sur la seule plaidoirie de Claude et sa note décide. | D4 |
| Une voix en échec écrase un verdict valide au rejeu | - | C2 | Confirmé. La boucle d'écriture parcourt toutes les entrées de `done`, y compris `ok:false`. La clé d'INDEX bascule alors sur `names[0]`. Gravité ramenée à moyenne : git conserve l'ancien verdict. | D5 |
| Le premier moteur consomme tout le délai | - | C5 | Confirmé. Le premier moteur reçoit `left` entier ; s'il bloque, le repli promis par le README n'a jamais lieu. | D6 |
| Réponse 200 sans note mise en cache | G5 | - | Confirmé. `status: r.ok ? 200 : 502` porte sur `ok` et pas sur `parseScore`, donc la réponse inutilisable est rejouée pendant 24 h. | D7 |
| `recordMissing` et `new Nhitl()` sans `try` | G6 | - | Confirmé. Une exception dans le `Promise.all` de la vague annule toute la revue, après des appels de moteur déjà faits. | D8 |
| `sections()` ignore les blocs de code, `slice` coupe en plein mot | G7, G8 | C11 | Confirmé, preuve dans les extraits injectés ici : `# You can include comments…`, « too inc », bloc shell non fermé. | D9 |
| `SourceCache` : `JSON.parse` nu, écriture non atomique, erreurs sans TTL | G9 | - | Confirmé. `fresh` exige `!m.error`, donc une source en erreur est rechargée à chaque revue (jusqu'à 3 appels `gh` de 30 s). | D10 |
| Écriture non atomique de `INDEX.md` et des verdicts | G10 | - | Nuancé, gravité basse. La CI écrit dans `$RUNNER_TEMP`, sans INDEX. La concurrence reste possible entre `just review` et lifecycle. | D18 |
| `parseScore` au lieu de `parseJudgeScore` pour le juge | G11 | - | Nuancé. Le contrat impose « Note : » en tête, le risque est faible. | D19 |
| `values.force !== false` | G12 | C4 | Confirmé, mais gravité basse et non haute. Le README dit que `review sources` force toujours : le drapeau `--force` est simplement mort. | D20 |
| E/S au niveau du module dans `review/cli.ts`, code 2 ambigu | G13 | C8 | Confirmé. Si le répartiteur importe `review/cli.ts`, `main` reçoit `["review", …]` (voir « À confirmer »). | D11 |
| `inside()` refuse `..foo` | G14 | - | Confirmé, gravité basse. | D21 |
| `t.title` brut dans le Markdown | G15 | - | Confirmé, gravité basse. Le titre vient du MCP. | D22 |
| Actions non épinglées par SHA, pas de `permissions:` | G16 | C16 | Confirmé. Le job reçoit trois secrets. | D12 |
| `only` = « modèle en dur » | G17 | - | Rejeté. Ce sont des expressions régulières de familles de moteurs, pas des modèles ; le commentaire est exact. | - |
| Test « checklist » tautologique | G18 | C19 | Confirmé. `CONTRACT` contient déjà `checklist:<sujet>`. | D13 |
| Test « fouille » non hermétique | G19 | C20 | Confirmé. Il dépend des verdicts réels du poste et sort par un `return` silencieux. | D14 |
| `tmpdir` et fichier `viaFile` jamais supprimés | G20 | C15 | Confirmé. La consigne complète reste en clair dans `%TEMP%`. | D15 |
| Arguments MCP non validés, `fix:true` hors politique | G21 | C14 | Confirmé. Un `threshold` négatif rend toute note conforme. `fix` pousse sur main sans passer par `owner-rules.json`. | D16 |
| Commit trop gros | G22 | - | Confirmé, gravité basse. | D23 |
| `subs[sub]` nu | - | C7 | Confirmé, gravité basse : code antérieur, visible seulement en contexte du hunk. | D24 |
| Juge de la même famille que la voix Claude | - | C9 | Confirmé, gravité basse. La neutralité annoncée n'est pas garantie. | D25 |
| CHECKLISTS et `lifecycle.ts` contredisent CLAUDE.md | - | C10 | Confirmé. CHECKLISTS limite fr1 à Chromium/LLVM alors que CLAUDE.md en fait l'usine de builds et la CI Rust ; le commentaire de `lifecycle.ts` met la compilation « sur prd uniquement ». | D17 |
| `parseFindings` lit le tableau de décisions | - | C12 | Confirmé dès que le juge numérote ses griefs : rien ne restreint la lecture à `## Défauts`. | D26 |
| `fetch` toléré en échec, plage étendue à des commits étrangers | - | C13 | Confirmé. | D27 |
| `git diff HEAD` ignore les fichiers non suivis | - | C17 | Confirmé, gravité basse. | D28 |
| Course sur `cands ??=`, TTL d'env en `NaN` | - | C18 | Confirmé, gravité basse. | D29 |
| `--dry-run` sort en code 1 | - | - | Ajout du juge. Le statut forcé à « à corriger » donne `ok:false`, donc le code de sortie est 1. | D30 |
| Chemin gitiles sans contrôle `..` | - | - | Ajout du juge, gravité basse. Seule la branche GitHub contrôle `..`. | D31 |

## Défauts
| # | fichier:ligne | gravité | défaut | correction | source |
|---|---|---|---|---|---|
| 1 | packages/ai-os/src/review/index.ts:~955 ; relay/tools.ts:+157 | haute | Le `slug` (MCP, `--slug`) écrit hors de `docs/reviews` | Imposer `^[a-z0-9][a-z0-9-]{0,63}$`, puis vérifier `relative(outDir, out)` | checklist:security |
| 2 | review/index.ts:~218 (`collect`), ~1020 | haute | Des secrets lus et envoyés aux moteurs, puis archivés | Refuser `.env*` et les fichiers ignorés par git ; appliquer `redact` avant la consigne et avant l'écriture | checklist:security |
| 3 | review/index.ts:~233, ~960 | haute | Une revue tronquée peut finir « conforme » | Si `truncated > 0`, plafonner au statut « à corriger » ou découper la revue ; renommer en `max_chars` | checklist:docs-facts |
| 4 | review/index.ts:~950 | moyenne | Le tribunal dégradé (une voix absente) passe la porte | Exiger toutes les voix demandées, sinon un statut « dégradé » avec un code distinct | checklist:nhitl-agents |
| 5 | review/index.ts:~1020 | moyenne | Un échec écrase un verdict valide et déplace la clé d'INDEX | N'écrire que les voix `ok` ; clé d'INDEX = slug + date | checklist:security |
| 6 | review/index.ts:~655 (`runVoice`) | moyenne | Le premier moteur prend tout le budget de la voix | Délai par essai : `min(left, timeout / n)` avec un plancher | checklist:bun-ts |
| 7 | review/index.ts:~434 | moyenne | Une réponse sans note est mise en cache 24 h | Renvoyer 502 si `parseScore` échoue | checklist:bun-ts |
| 8 | review/index.ts:~940 | moyenne | Une erreur NHITL annule la revue | `try/catch` autour de `nhitlIx()` et de `recordMissing`, avec journalisation | checklist:security |
| 9 | review/sources.ts:~200, ~236 | moyenne | Découpage Markdown qui ignore les blocs de code, troncature en plein mot | Suivre l'état des blocs ``` ; couper à une fin de paragraphe ; ajouter un test | eng-practices-looking-for |
| 10 | review/sources.ts:~120-138 | moyenne | `JSON.parse` nu, écritures non atomiques, sources en erreur rechargées à chaque revue | `try/catch` avec repli sur `{}` ; écriture `.tmp` puis `rename` ; TTL court pour les erreurs | checklist:bun-ts |
| 11 | review/cli.ts:94 | moyenne | `main` s'exécute à l'import ; le code 2 sert à l'usage et à « aucun moteur » | `if (import.meta.main)` seul ; code 64 pour l'usage | checklist:bun-ts |
| 12 | .github/workflows/judge.yml:+75-80 | moyenne | Actions non épinglées, aucune `permissions:` | Épingler par SHA ; `permissions: contents: read` | checklist:ci |
| 13 | test/review/review.test.ts:216 | moyenne | L'assertion « checklist » est toujours vraie | Tester `Object.hasOwn` | eng-practices-looking-for |
| 14 | test/review/review.test.ts:336-345 | moyenne | Test lié aux données du poste, `return` silencieux | Fixture dans `tmpdir` | checklist:bun-ts |
| 15 | llm/agents.ts:+94 ; review.test.ts:42 | moyenne | Consigne en clair laissée dans `%TEMP%`, `tmpdir` non nettoyés | Suppression en `finally` ; `afterAll` dans les tests | checklist:security |
| 16 | relay/tools.ts:+148-160 | moyenne | `threshold` et `voices` non validés ; `fix` sans politique | Contrôler `Number.isFinite` et `0 < n ≤ 20` ; soumettre `fix` à `owner-rules.json` | checklist:bun-ts, checklist:nhitl-agents |
| 17 | docs/reviews/CHECKLISTS.md:20,43,57 ; orch/lifecycle.ts:2 | moyenne | Contradiction avec CLAUDE.md sur les rôles de fr1 et prd | Aligner les deux textes sur CLAUDE.md | checklist:docs-facts |
| 18 | review/index.ts:~976,1006 | basse | Écritures non atomiques | Fichier `.tmp` puis `rename` | checklist:bun-ts |
| 19 | review/index.ts:~537 | basse | `parseScore` utilisé pour le juge | `parseJudgeScore` pour les voix qui ont `after` | - |
| 20 | review/cli.ts:50 | basse | Le drapeau `--force` est sans effet | `values.force === true`, ou retirer l'option | - |
| 21 | review/index.ts:105 | basse | `inside()` rejette `..foo` | `rel === ".." \|\| rel.startsWith("../")` | checklist:security |
| 22 | review/index.ts:~619 | basse | Titre non assaini dans l'en-tête « Objet » | Assainir le titre une fois, à la création de la cible | checklist:security |
| 23 | commit c962371b | basse | Le commit mélange plusieurs sujets | Le scinder | eng-practices-small-cls |
| 24 | src/cli.ts:16 | basse | `subs[sub]` nu | `Object.hasOwn` | checklist:bun-ts |
| 25 | config/review.json:24 | basse | Le juge peut être de la même famille qu'une voix | Exclure dynamiquement les moteurs déjà utilisés par les voix | eng-practices-standard |
| 26 | review/index.ts:~280 | moyenne | `parseFindings` lit tous les tableaux | Ne lire que celui qui suit `## Défauts` | - |
| 27 | review/index.ts:~1060,1095 | moyenne | Échec du `fetch` toléré ; plage A..ref qui inclut des commits étrangers | Échouer fermé ; borner la plage au commit de correction | checklist:security |
| 28 | review/index.ts:~150 | basse | Les fichiers non suivis sont exclus du mode `diff` | Ajouter `ls-files --others --exclude-standard` | - |
| 29 | review/index.ts:~830,~395 | basse | Course sur `cands`, TTL lu dans l'env sans validation | Mémoriser la promesse ; `Number.isFinite` | checklist:bun-ts |
| 30 | review/cli.ts:92 | basse | `--dry-run` sort en code 1 | Renvoyer 0 en mode `dryRun` | - |
| 31 | review/sources.ts:~88 | basse | Chemin gitiles sans contrôle `..` | Appliquer le même contrôle que pour GitHub | checklist:security |

## À confirmer
- Le répartiteur `src/cli.ts` retire-t-il `review` d'`argv` ? Sinon `just review` échoue, car « review » est lu comme une cible.
- Positions de l'`INSERT` positionnel de `record` (12 colonnes) contre le schéma de `violation`.
- Prise en charge par `relay/outbound.ts` de `deterministic`, de `x-aphrody-cache` et de la clé de cache avec en-têtes (`x-review-timeout` varie d'un appel à l'autre).
- Existence de `actions/checkout@v7`, de `claude-code@2.1.323` et des chemins de sources `rustguide.md`, `go/best-practices.md` et `bzl-style.mdx`.
- Authentification de l'outil `review` du relais ; injection de consigne par le diff en CI.

## Synthèse
L'architecture est saine et les tests de rotation et de gel sont réels. Trois défauts hauts : écriture hors dossier via `slug`, secrets envoyés puis archivés, statut « conforme » sur un contenu tronqué.
Les autres défauts sont des échecs ouverts (voix manquante, cache, NHITL, `fetch`) et quatre tests faibles. Un seul grief est rejeté : G17.
