# Audit de l'outillage agent : Google, DeepMind, Chrome, gcloud, Gemini, Antigravity et catalogues de skills

Date : 2026-11-13. Poste : PC Windows, Claude Code 2.1.322, scope user. Sources vues en session : `gh api` (commits ci-dessous), registre npm (`chrome-devtools-mcp` 1.13.0, `firebase-tools` 15.36.0, `@google-cloud/gcloud-mcp` 0.5.3), README de google/mcp (liste officielle des serveurs MCP Google). Hors périmètre : écosystèmes design/UI (Figma, M3, Fluent, shadcn, Stitch), audités par un autre agent.

Manifeste des installations : `infra/agents/toolchain.toml` (applier `packages/machine/src/apply-user.ts`).

## Existant avant l'audit

- MCP : relay (127.0.0.1:8790 : gemini_ask, gemini_cli_ask, gemini_review, gcloud_accounts, agy_ask, workspace_api/workspace_ask, stitch__*, skills_list, claude_ask, fleet_status), github (plugin officiel, api.githubcopilot.com), microsoft-learn, context7, cloudflare, resend, figma, agent-browser, agent-desktop, hostinger (désactivé ici), claude-in-chrome.
- Plugins : vercel (vercel/vercel-plugin), microsoft-docs, github, skill-creator, frontend-design, plugin-dev, LSP (clangd, rust-analyzer, typescript, gopls).
- Skills projet (C:\src\.agents\skills) : google-cloud-official-catalog (google/skills vendorisé), google-labs-stitch-jules-design, gemini-ai-studio-multimodal, agy-continuous-reviewer, vercel-labs-arena ; catalogues vendorisés dans third_party (google-skills, gemini-skills, android-skills, anthropics-skills, microsoft-skills, chrome-devtools-mcp, lighthouse, stitch-skills, jules-skills, googleworkspace-cli, gemini-cli).
- CLI : gcloud 593.0.0, firebase 15.36.0 (bun), agy 1.5.7 ; gemini CLI absent (couvert par le relais).

## Tableau

| Nom | Source + commit | Statut | Recouvrement | Verdict |
|---|---|---|---|---|
| chrome-devtools (MCP) | ChromeDevTools/chrome-devtools-mcp@1417f93ee3f8, npm 1.13.0 | Installé (user, `bun x`), vérifié : new_page + list_pages sur example.com | agent-browser, claude-in-chrome (pilotage) ; apporte traces perf, lighthouse_audit, heap snapshot, réseau, console | install (MCP seul ; plugin upstream non retenu : lance npx et un plugin.json ne se surcharge pas depuis une marketplace) |
| Lighthouse / PageSpeed / CrUX | GoogleChrome/lighthouse@4875928438c0 | Couvert | outil lighthouse_audit et performance_* de chrome-devtools | skip |
| google-cloud-developer (plugin) | google/skills@85f227ea6a8f | Installé, 5 skills (gcloud, auth, onboarding, developer-knowledge) + MCP HTTP developer-knowledge | umbrella google-cloud-official-catalog (scope projet src seul) | install |
| Developer Knowledge (MCP distant) | developerknowledge.googleapis.com/mcp (via google-cloud-developer) | Installé, vérifié : search_documents "Cloud Run remote MCP server" ; clé GCP restreinte à l'API, coffre env-kit + env user `DEVELOPERKNOWLEDGE_API_KEY` | context7 (docs génériques) | install |
| firebase (MCP) | firebase/firebase-tools@450bcf337418, npm 15.36.0 | Installé (user, `bun x firebase-tools mcp`), vérifié : firebase_list_projects (9 projets) | aucun | install |
| firebase (plugin skills) | firebase/agent-skills@99954a30898b | Non installé | MCP firebase ci-dessus | skip (le plugin embarque un .mcp.json npx ; skills non reprises) |
| document-skills (plugin) | anthropics/skills@2c5958ecac7c | Installé, 4 skills (docx, pdf, pptx, xlsx) | aucun | install |
| example-skills, claude-api, academy-guide, discernment-nudge | anthropics/skills@2c5958ecac7c | Non installé | skill-creator, frontend-design et claude-api déjà présents | skip |
| gemini-skills (plugin) | google-gemini/gemini-skills@87fb0173d36f | Installé, 4 skills (gemini-api-dev, live, cli, omni-flash) | gemini-ai-studio-multimodal (projet), relay gemini_* | install |
| modern-web-guidance (plugin) | GoogleChrome/modern-web-guidance@4dd968349e54 | Installé, 2 skills (modern-web-guidance, chrome-extensions) | skill chrome (config locale, pas les bonnes pratiques web) | install |
| android-skills (plugin) | android/skills@5815d27fda56 | Installé, 36 skills | third_party/android-skills (non chargé) | install |
| Plugins bases de données GCP (alloydb, bigquery, cloud-sql-*, spanner, firestore-native, looker, dataproc, ...) | google/skills marketplace @85f227ea6a8f | Marketplace ajoutée, plugins non installés | aucun usage sur le poste | skip |
| gcloud MCP / observability / storage | googleapis/gcloud-mcp@238728f237ec, npm 0.5.3 | Non installé | gcloud CLI via Bash + skill gcloud (google-cloud-developer) + relay gcloud_accounts | skip |
| Cloud Run MCP | GoogleCloudPlatform/cloud-run-mcp@74a9a9d113d1 | Non installé | déploiements sur la flotte VPS et Cloudflare, pas Cloud Run | skip |
| GKE MCP | GoogleCloudPlatform/gke-mcp@853e1d8589c6 | Non installé | pas de GKE ; binaire Go | skip |
| MCP Toolbox for Databases | googleapis/genai-toolbox@45ed205cc868 | Non installé | aucune base GCP utilisée | skip |
| MCP distants gérés Google (BigQuery, GCE, Spanner, Maps...) | google/mcp@9ebafd607afd (liste) | Non installé | Developer Knowledge seul retenu | skip |
| Google Workspace (extension) | gemini-cli-extensions/workspace@089927ead014 | Non installé | connecteurs claude.ai Gmail/Drive/Docs/Sheets/Slides/Calendar + relay workspace_api | skip |
| Gemini CLI + extensions | google-gemini/gemini-cli@b9776560ea57 | Non installé | relay gemini_cli_ask / gemini_ask / gemini_review | skip |
| Antigravity (agy) | CLI agy 1.5.7 (locale) | Présent | relay agy_ask + skill agy-continuous-reviewer | skip (déjà intégré) |
| Genkit MCP | firebase/genkit@9eadfa9946f0 | Non installé | aucun projet Genkit | skip |
| Jules skills | google-labs-code/jules-skills@7a76d3bfcf42 | Non installé | umbrella google-labs-stitch-jules-design | skip |
| Stitch MCP / skills | google-labs-code/stitch-skills@0337446dadde | Hors périmètre (design) | relay stitch__* déjà exposé | skip |
| science-skills | google-deepmind/science-skills@370f8f33e5bb | Non installé | hors besoins | skip |
| BigQuery Agent Analytics | GoogleCloudPlatform/BigQuery-Agent-Analytics-Plugins@dd54ffd26b66 | Non installé | journal local ~/.claude/learning | skip |
| vercel-labs/agent-skills | vercel-labs/agent-skills@1a2c79d4e6c4 | Non installé | plugin vercel (react-best-practices, deployments...) ; web-design-guidelines hors périmètre | skip |
| microsoft/skills | microsoft/skills@2d08976b5f1c | Non installé | Azure uniquement (pas d'Azure) ; vendorisé third_party/microsoft-skills | skip |
| GitHub MCP | github/github-mcp-server@6fbcd00b2034 | Présent (plugin github, distant) | — | skip (déjà installé) |
| awesome-copilot | github/awesome-copilot@222eba62d518 | Non installé | communautaire, non officiel | skip |

## Forks

Aucun : rien à patcher (npx contourné par des serveurs MCP `bun x` déclarés dans le manifeste). ChromeDevTools/chrome-devtools-mcp est déjà forké (aphrody-labs, third_party/forks.txt).

## Reste bloqué

- Skills du plugin chrome-devtools-mcp (8) et du plugin firebase (14) non chargées : ces plugins lancent npx ; il faudrait un fork patché (`bun x`) sur une branche dédiée, interdit (main seul) et en conflit avec la synchro upstream.
- Le serveur developer-knowledge lit `DEVELOPERKNOWLEDGE_API_KEY` dans l'env utilisateur : actif dans les sessions Claude ouvertes après le 2026-11-13 04:30.
- Résidu npm de l'essai du plugin : `~/.claude/plugins/data/chrome-devtools-mcp-aphrody` (suppression refusée par le hook NHITL hors C:\src).
