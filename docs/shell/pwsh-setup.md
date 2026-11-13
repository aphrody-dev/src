# PowerShell : profil canonique (2026-11-13)

Source unique : `packages/machine/shells/pwsh/profile.ps1`, copiée par `bun packages/machine/src/shells.ts` (liens `[[link]]` pwsh et powershell de `shells/manifest.toml`) vers :

| Édition | Exécutable | `$PROFILE.CurrentUserCurrentHost` |
|---|---|---|
| pwsh 7.7.0 (Store, `Microsoft.PowerShell_8wekyb3d8bbwe`) | `%LOCALAPPDATA%\Microsoft\WindowsApps\Microsoft.PowerShell_8wekyb3d8bbwe\pwsh.exe` | `~\Documents\PowerShell\Microsoft.PowerShell_profile.ps1` |
| Windows PowerShell 5.1 (rôle : ne pas casser) | `powershell.exe` | `~\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1` |

Contrôle : `bun packages/machine/src/shells.ts --check` (ou `apply-user.ts --check`). Les profils AllHosts (`profile.ps1`) n'existent pas : un fichier vide coûte quand même une lecture, une vérification de politique et un scan AMSI (~20 ms mesurés pour un dot-source vide). Claude Code n'est pas concerné : son outil PowerShell est désactivé (`CLAUDE_CODE_USE_POWERSHELL_TOOL=0`) et lancerait de toute façon `-NoProfile`.

## Réglages

| # | Réglage | Valeur | Pourquoi / source |
|---|---|---|---|
| 1 | Environnement partagé | `. $env:AY_SRC\packages\machine\shells\env.ps1` (défaut `C:\src`) | Généré depuis `shells/env.toml` par shells.ts (agent C) ; `$env:*` uniquement, aucune cmdlet. Chargé aussi en mode `-c` pour que les scripts voient le même environnement. |
| 2 | Télémétrie | `POWERSHELL_TELEMETRY_OPTOUT=1`, `POWERSHELL_UPDATECHECK=Off` en HKCU\Environment (persist dans env.toml) | about_Telemetry / about_Environment_Variables 7.7 : « must be set before starting the PowerShell process ». Le profil ne peut donc pas les poser pour lui-même ; env.ps1 les recopie pour les enfants. `POWERSHELL_DIAGNOSTICS_OPTOUT` non posé : il supprime le pipe IPC d'`Enter-PSHostProcess` (7.6+). |
| 3 | Encodage | `$OutputEncoding` et `[Console]::OutputEncoding` = UTF-8 sans BOM ; en 7+ aussi `[Console]::InputEncoding` et `$PSDefaultParameterValues['*:Encoding']='utf8NoBOM'` | about_Character_Encoding 7.7 : `$OutputEncoding` régit l'envoi vers les programmes natifs, `*:Encoding` toutes les cmdlets qui ont `-Encoding`. Pas d'`InputEncoding` ni de `*:Encoding` en 5.1 (comportement inchangé, `utf8` y écrit un BOM). |
| 4 | Garde non interactive | arrêt après 1-3 si `-c/-Command/-f/-File/-e/-EncodedCommand/-NonInteractive` (préfixes acceptés par pwsh) sans `-NoExit`, ou `UserInteractive=false` | comparaisons de chaînes, pas de regex ni de cmdlet sur ce chemin. |
| 5 | Démarrage sans cmdlet | appels .NET et affectations uniquement jusqu'au premier prompt ; abonnement OnIdle via `$ExecutionContext.Events.SubscribeEvent(…, maxTriggerCount 1)` | la première cmdlet (`Select-Object`, `Register-EngineEvent`, `Remove-Variable`) charge Microsoft.PowerShell.Utility : ~20 ms mesurés. Surcharge `SubscribeEvent(Object, String, String, PSObject, ScriptBlock, Boolean, Boolean, Int32)` présente en 7.7 et 5.1 (réflexion). |
| 6 | Différé OnIdle | options PSReadLine, raccourcis, complétions, zoxide | Register-EngineEvent 7.7 : « When PSReadLine is in use, the OnIdle event is fired when ReadKey() times out » ; le prompt s'affiche avant. Le bloc `$global:__ay_idle` est lié à l'état de session global et dot-sourcé depuis l'action : fonctions et variables restent globales (vérifié 7.7 et 5.1). |
| 7 | Modules | aucun `Import-Module` ; auto-chargement natif | PSReadLine est chargé par l'hôte console. |
| 8 | Raccourcis | `ll` (eza), `gs`/`gd`/`gl` (git), `vs-env` (vswhere + Launch-VsDevShell à la demande) | repris du profil précédent. |
| 9 | Bloc Coreutils for Windows 2026.9.3 | copié tel quel (marqueur `DO NOT MODIFY -- coreutils -- 60b36fc6…`), 7+ seulement | l'installeur réécrit `$PROFILE` s'il ne trouve pas son marqueur : d'où le mode `copy` plutôt qu'un stub `source`. Il surcharge `PSConsoleHostReadLine` pour router `ls`, `cat`… vers `C:\Program Files\coreutils\cmd\*.cmd`. |

## PSReadLine

Versions : 2.4.5 dans pwsh 7.7.0 (`$PSHOME\Modules\PSReadLine`, release amont v2.4.5 du 2025-10-22) ; 5.1 a 2.0.0 dans `C:\Program Files\WindowsPowerShell\Modules` mais charge 2.4.5 quand `PSModulePath` hérite de pwsh. Paramètres vérifiés par `(Get-Command Set-PSReadLineOption).Parameters` dans les deux éditions et par `reference/7.7/PSReadLine/Set-PSReadLineOption.md` (MicrosoftDocs/PowerShell-Docs@ebaa235784, 2026-11-02).

| Option | Valeur | Défaut documenté / note |
|---|---|---|
| EditMode | Windows | défaut sous Windows (Get-PSReadLineOption sans profil) |
| BellStyle | None | défaut Audible (vérifié) |
| HistoryNoDuplicates | on | |
| MaximumHistoryCount | 50000 | doc : « Default value: None » ; non fixé, `Get-PSReadLineOption` sans profil renvoie 0 |
| HistorySearchCursorMovesToEnd | on | |
| HistorySaveStyle | SaveIncrementally | défaut ; historique partagé entre instances |
| PredictionSource | History | défaut None ; `Plugin`/`HistoryAndPlugin` depuis 2.2.0, aucun prédicteur installé. Posé seulement si le paramètre existe ; refusé (erreur capturée) si la sortie n'est pas VT ou est redirigée. |
| PredictionViewStyle | ListView | depuis 2.2.0 ; défaut InlineView |
| Filtrage de l'historique sensible | défaut (pas d'`AddToHistoryHandler`) | about_PSReadLine : filtrage amélioré en 2.2.0 et 2.3.4 |
| Touches | Haut/Bas = HistorySearchBackward/Forward, Tab = MenuComplete, Ctrl+→ = ForwardWord, Ctrl+t = fichiers (fd + fzf), Ctrl+r = historique (fzf `--scheme=history`) | sans PSFzf |

## Complétions

Cache : `$env:AY_SHELL_CACHE\pwsh\<nom>.ps1` (`~\.cache\shell\pwsh`, partagé avec la famille bash dans `~\.cache\shell`). Ligne 1 = `# ay-src: <exécutable>` ; à l'idle, `Update-AyCompletions` ne relance un générateur que si le cache manque ou si cet exécutable est plus récent : ~9-12 ms à chaud, aucun sous-processus. `Update-AyCompletions -Force` régénère tout.

| Commande | Version vue | Générateur | Remarque |
|---|---|---|---|
| just | 1.59.0 | `JUST_COMPLETE=powershell just` | `just --completions powershell` ne fait que ré-invoquer cette forme (complétion dynamique clap) : on met en cache le script final. |
| rustup | 1.29.3 | `rustup completions powershell rustup` | |
| cargo | (carapace 1.8.2) | `carapace cargo powershell` | `rustup completions powershell cargo` : « cargo does not currently support completions for powershell ». |
| bun | 1.4.4 (carapace) | `carapace bun powershell` | `bun completions` ne produit que bash/zsh/fish. |
| git | (carapace) | `carapace git powershell` | pas de générateur PowerShell natif. |
| gh | 2.103.3 | `gh completion -s powershell`, corrigé | le script cobra fait `Invoke-Expression "$RequestComp" 2>&1`, ce qui ne capte pas le stderr natif : « Completion ended with directive… » s'imprimait sur la ligne. La redirection est déplacée dans la commande (`"$RequestComp 2>`$null"`). |
| ay | 0.2.0 (carapace) | `carapace ay powershell` | `ay` n'a pas de sous-commande `completions` ; spec partagée `{appdata}\carapace\specs\ay.yaml` générée depuis `ay --help` (manifest.toml). |
| zoxide | 0.10.0 | `zoxide init powershell` | fonctions `global:`, hook de prompt. |

Tests (TabExpansion2, 7.7 et 5.1) : `git chec` → check-attr…, `cargo bui` → build, `bun ru` → run, `gh pr li` → list, `just --li` → --list…, `rustup tool` → toolchain, `ay ` → arch bench build…, `ay up --` → --assets --bootstrap --check…

## Démarrage (hyperfine, 20 runs, 2026-11-13)

| Commande | pwsh 7.7 | powershell 5.1 |
|---|---|---|
| `-NoLogo -NoProfile -c exit` | 186 ms | 134 ms |
| `-NoLogo -c exit` (profil, garde batch) | 238 ms | 230 ms |
| `-NoLogo -NoProfile -NoExit -c exit` | 256 ms | |
| `-NoLogo -NoExit -c exit` (profil complet, proxy interactif) | 335 ms | |

Ancien profil (même machine) : +42 ms en interactif ; nouveau sans env.ps1 : +42 ms. Le surcoût actuel vient d'env.ps1 (+46 ms au-delà d'un dot-source vide, boucle PATH ; correction demandée à shells.ts) et du parse du fichier (~15 ms, dont le bloc Coreutils et ses deux regex `Compiled` ~11 ms).

## Hors périmètre

PATH, registre, Windows Terminal et settings.json de Claude Code : agent C (`shells.ts`, `apply-user.ts`). Le déployeur du skill `shell` (`~/.claude/skills/shell/scripts/apply.ps1`) ne copie plus de profil pwsh.
