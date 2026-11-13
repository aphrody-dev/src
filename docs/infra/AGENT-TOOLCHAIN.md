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

## Reste

- Flotte (prd, fr1, fr2 ; utilisateurs root et agent) : il manque l'unité `aphrody-agents-sync.timer` et l'ajout de `.agents`, `.claude-plugin`, `plugins` et `packages/machine` à `SRC_SPARSE` (`infra/fleet/*/resilience.conf`). Sur fr1, root a un Claude 2.1.96 ; sur fr2, root n'a ni claude ni bun.
- PC : la correction de dérive tourne quand on lance `apply-user.ts` ou `just agents-sync` ; aucune tâche planifiée ne la déclenche encore.
- `DEVELOPERKNOWLEDGE_API_KEY` est dans l'env utilisateur Windows (choix de l'audit `docs/tooling/AI-TOOLING-AUDIT.md`), donc hors du seul coffre.
- `ay agents` et l'intégration APM / vercel-labs/skills (forks aphrody-labs/apm, aphrody-labs/skills) ne sont pas faits.
