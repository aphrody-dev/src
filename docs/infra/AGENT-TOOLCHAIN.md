# Outillage agent reproductible (skills, plugins, MCP)

Date : 2026-11-13. Source de vérité : `infra/agents/toolchain.toml`. Applier : `packages/machine/src/toolchain.ts` (appelé par `packages/machine/src/apply-user.ts` sur le PC ; `just agents-sync [--check]`).

## Cause du défaut

- Claude Code ne charge `.agents/skills` (42 skills à l'époque) que pour une session lancée dans `C:\src`. Lancé ailleurs (`C:\Users\aphro\nt`, dossier neutre, runners de la flotte), il ne voyait que les 12 dossiers de `~/.claude/skills`, posés à la main.
- Plugins, marketplaces et MCP étaient installés à la main, sans manifeste : rien ne les reproduisait sur une autre machine.
- `C:\Users\aphro\nt` est un reste vide (un sous-dossier `C` vide). Ce qui y renvoie encore : l'entrée `projects` de `~/.claude.json`, le dossier mémoire `~/.claude/projects/C--Users-aphro-nt` et deux commentaires (`packages/machine/shell.dsc.winget`, `packages/shell-matrix/src/cases.ts`, cible réelle : `apps/nt/docs/research/shell-replacement.md`).

## Mécanisme (aucun lien, aucune copie dans le dépôt)

- Marketplace racine `aphrody` : `.claude-plugin/marketplace.json`, à la racine de src. Elle remplace `plugins/.claude-plugin/marketplace.json` (`claude plugin marketplace add C:\src` la repointe sans désinstaller ses plugins). Codex lit le même fichier (`.claude-plugin/marketplace.json` fait partie des chemins de `codex-rs/core-plugins/src/marketplace.rs`, openai/codex@aa5f492031f7).
- Plugin `aphrody-skills` : sa racine est `.agents` (manifeste `.agents/.claude-plugin/plugin.json`, extension Gemini `.agents/gemini-extension.json`). Ses skills sont `.agents/skills`, la source unique. Chaque CLI en garde une copie dans son propre cache : Claude dans `~/.claude/plugins/cache/aphrody/aphrody-skills/<sha>`, Codex dans `~/.codex/plugins/cache`, agy dans `~/.gemini/config/plugins`. L'applier recopie dès que le HEAD de src change (`refresh = true`, état dans `~/.cache/aphrody/agents-sync.json`).
- Les 9 skills génériques de `~/.claude/skills` sont maintenant dans `.agents/skills` : bun, bun-ffi, fleet, gh-fork, learn, llvm-toolchain, microsoft, r2, tree-sitter. Trois restent propres au PC (`[[skill.private]]`, hors dépôt public) : windows-machine, chrome, shell.
- Forks aphrody-labs épinglés par sha dans la marketplace : `vercel-agent-skills` (vercel-labs/agent-skills@1a2c79d4e6c4), `web-quality-skills` (addyosmani/web-quality-skills@afa8da942115 : Lighthouse, Core Web Vitals). Les skills Stitch sont fournies par `.agents/skills/stitch-*`, la copie `web-design-guidelines` par vercel-agent-skills : les doublons sont retirés.
- Réglages : seules les CLI les modifient (`claude plugin marketplace add|install|enable|disable|update`, `claude mcp add|remove`, `codex plugin marketplace add`, `codex plugin add`, `agy plugin install`, `gemini extensions link`). L'applier ne réécrit jamais `settings.json`. L'état MCP est lu dans `~/.claude.json`, sans y écrire.
- Secrets : `secrets = ["NOM"]` sur une entrée MCP. Le serveur est lancé par `bun packages/env-kit/src/cli.ts secret exec NOM -- <cmd>`, si bien que la valeur ne passe ni par settings ni par argv. hostinger-api avait son jeton en clair dans `~/.claude.json` : l'entrée a été remplacée.
- Liens interdits : `[cleanup] link_dirs`. L'applier retire tout symlink ou jonction qui pointe vers une skill déjà fournie par aphrody-skills (16 liens retirés de `~/.gemini/skills` le 2026-11-13).

## Cibles par agent

| Agent | Mécanisme | Vérification |
|---|---|---|
| Claude Code | marketplace `aphrody` + plugins `[[claude.plugin]]`, MCP `[[claude.mcp]]`, skills épinglées `[[claude.skill]]` | `claude plugin list`, `claude mcp list`, `claude -p --output-format stream-json --verbose` (événement init, champ `skills`) |
| Codex | `codex plugin marketplace add <src>` + `codex plugin add aphrody-skills@aphrody` (seules les sources locales sont listées par Codex) | `codex plugin list` |
| agy | `agy plugin install <dossier du plugin>` (source locale, ou cache Claude pour un plugin GitHub) ; vercel-agent-skills refusé (pas de manifeste) | `agy plugin list --json` |
| Gemini CLI | `gemini extensions link <src>/.agents` | CLI absente du PC et de la flotte le 2026-11-13 |

Le champ `hosts` vaut pc, prd, fr1 ou fr2 (absent : tous). Sur Linux, l'hôte se lit dans `HOST=` de `/etc/fleet/resilience.conf` et la racine est celle du checkout qui exécute l'applier.

## Mesures du 2026-11-13 (PC)

- Session `claude -p` lancée depuis un dossier neutre : 207 skills, dont 69 aphrody-skills (avant : 12 skills utilisateur, et aucune skill de src hors de `C:\src`), 21 plugins, 13 MCP (hostinger-api connecté via env-kit).
- agy : aphrody-skills (69 skills) et web-quality-skills (6). Codex : aphrody-skills installé et activé (69 skills).
- `just agents-sync --check` : aucun écart.

## Exécution automatique

- Front unique : `ay agents install|sync|check|list` (crates/ay, route bun vers `packages/machine/src/toolchain.ts`), `just agents-sync [check]`. Les autres verbes de `ay agents` restent l'orchestrateur ai-os.
- PC : tâches `\\Aphrody\\AgentsSync` (toutes les heures) et `\\Aphrody\\AgentsSyncLogon` (ouverture de session), posées par `infra/agents/install-pc.sh` ; `apply-user.ts` appelle aussi l'applier.
- Flotte : `infra/fleet/bin/agents-sync.sh` lancé par `aphrody-agents-sync.timer` (toutes les heures, après `src-checkout-update`). Il applique pour root et agent depuis `/srv/src` ; `SRC_SPARSE` contient `.agents`, `.claude-plugin`, `plugins` et `packages/machine`. Le tout est poussé par `fleet-resilience-remote.sh`. Un utilisateur sans aucun agent est ignoré (root sur fr2).
- Secrets HTTP : `headers = { En-tête = "SECRET" }` pose un `headersHelper` (`packages/machine/src/mcp-headers.ts`) qui lit le coffre env-kit au lancement. `DEVELOPERKNOWLEDGE_API_KEY` ne vit plus que dans le coffre : elle a été retirée de `HKCU\\Environment` et sert le serveur `developer-knowledge` (connecté). Le serveur homonyme du plugin google-cloud-developer, qui attend la variable d'env, reste en échec.

## Mesures du 2026-11-13 (`check` : 0 écart partout)

| Hôte | Utilisateur | Claude (plugins actifs, MCP) | Codex | agy |
|---|---|---|---|---|
| pc | aphro | 21 plugins, 14 MCP ; `claude -p` neutre : 207 skills dont 69 aphrody-skills | aphrody-skills | aphrody-skills 69, web-quality-skills 6 |
| prd | root | 17, 7 | aphrody-skills | aphrody-skills 69, web-quality-skills 6 |
| prd | agent | 17, 7 ; `claude -p` dans /tmp : 197 skills dont 69 aphrody-skills | aphrody-skills | absent |
| fr1 | root | 17, 7 (Claude passé de 2.1.96 à 2.1.323, agy à 1.5.8) | absent | aphrody-skills 69, web-quality-skills 6 |
| fr1 | agent | 20, 7 | aphrody-skills | absent |
| fr2 | agent | 17, 8 | aphrody-skills | absent |
| fr2 | root | aucun agent installé | | |

Avant : 12 skills utilisateur sur le PC, aucune sur la flotte ; plugins et MCP posés à la main sur le PC seulement.

## Décision : APM et vercel-labs/skills non adoptés

- vercel-labs/skills (`npx skills`, fork aphrody-labs/skills@e781cb4d0743) installe des skills en copiant ou en liant dans les dossiers de chaque agent (`~/.claude/skills`, `~/.agents/skills`...). Cela fait une copie hors cache par agent, ou un lien, deux choses interdites. Les marketplaces natives (Claude, Codex, agy) font déjà ce travail depuis la marketplace racine.
- microsoft/apm (fork aphrody-labs/apm@1a6c1df655b7) est un gestionnaire Python (`apm.yml`, `apm install`). Le passer sur bun reviendrait à le réécrire, et son manifeste ferait doublon avec `toolchain.toml`.
- Les deux forks restent épinglés dans `third_party/forks.txt` comme référence. `toolchain.toml` et `ay agents` sont le seul front ; à réexaminer si un format de paquet d'agents commun aux CLI devient standard.

## Reste

- Gemini CLI : présente pour agent sur prd (extension aphrody-skills liée), absente ailleurs.
