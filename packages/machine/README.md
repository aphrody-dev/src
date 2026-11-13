# packages/machine/ — poste Windows reproductible, du noyau à Claude Code

Décisions et preuves : [aphrody-labs/nt docs/research](https://github.com/aphrody-labs/nt/tree/main/docs/research) (`shell-replacement.md`, `claude-to-nt-stack.md`, `fork-merge-plan.md`, `rust-in-windows.md`). Profil matériel : skill `windows-machine`.

## Ordre d'application

| #   | Commande                                                                                           | Effet                                                                                                                                                                                  | Vérifier                                             |
| --- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | `winget configure -f packages/machine/shell.dsc.winget --accept-configuration-agreements`          | niubash 1.5.0 + Coreutils for Windows 2026.9.3 (DSC v3, `Microsoft.WinGet/Package`)                                                                                                    | `winget configure test -f …`                         |
| 2   | `winget configure -f packages/machine/machine.export.dsc.winget --accept-configuration-agreements` | les 160 paquets du poste (sans Oven-sh.Bun : bun = ~/.bun, tools.toml), versions épinglées (export du 2026-11-12)                                                                                                                    | `winget configure test -f …`                         |
| 3   | `ay up` (racine du dépôt)                                                                          | toolchains de `tools.toml` (dont niubash, ms-coreutils) avec checksums                                                                                                                 | `ay up --check`                                      |
| 4   | `bun packages/machine/src/apply-user.ts`                                                           | Claude Code (bash = niubash, outil PowerShell off), MCP `agent-desktop` (UIA, `--headed`) et `agent-browser`, PATH utilisateur sans Git Bash, Windows Terminal (défaut niubash, élevé) | `bun … --check` (code 0)                             |
| 5   | `bun packages/machine/src/forks.ts` puis `ay lock --lock-only`                                     | forks `aphrody-labs` (origin) + amont (upstream) + remotes de réseau, un clone par projet dans `third_party/`                                                                          | `bun packages/machine/src/forks.ts --check` (code 0) |

Exécution : Claude Code tourne en administrateur (intégrité élevée `S-1-16-12288`) ; Windows Terminal ouvre niubash élevé ; `sudo` (Inline) est disponible pour un processus non élevé.

## Réglages de sécurité — à faire par le propriétaire (non automatisés ici)

Ces réglages changent la posture de sécurité du poste ; ils restent une décision humaine.

| Réglage                                                                                              | Où                                                    | État au 2026-11-12                                                             |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| Sudo for Windows                                                                                     | Paramètres > Système > Avancé > Activer sudo          | activé, mode Inline (`HKLM\…\Sudo Enabled=3`)                                  |
| Élévation admin sans invite UAC                                                                      | `ConsentPromptBehaviorAdmin`                          | `0` (aucune invite) : tout processus de l'utilisateur peut s'élever en silence |
| Fonctionnalités agentiques expérimentales (surface MCP Windows, compte et espace de travail d'agent) | Paramètres > Système > Composants IA > Outils d'agent | désactivé (`odr mcp list` : « MCP surface is not enabled »)                    |
| Réduire les protections des connecteurs d'agent                                                      | Paramètres > Système > Avancé > Composants IA         | non activé                                                                     |
| Computer use de Claude Desktop                                                                       | Claude Desktop > Settings > This computer             | à décider (préversion, Windows)                                                |
