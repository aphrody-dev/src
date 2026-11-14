# PC-TUNING (2026-11-14)

Mesures hyperfine 2.x, `-N`, 10 runs, machine en charge (agents actifs). Le hyperfine installe affiche `Wall Time`.

## Couches POSIX et shells
- Canonique interactif : niubash 1.5.0 (`Unixwin.Niubash`) avec `Microsoft.Coreutils`. Config unique : `packages/machine/shells/bash/bashrc`.
- Conserve : Git for Windows 2.56.0.4 (`C:\Program Files\Git`), exige par l'outil Bash de Claude Code (lanceur `bin\bash.exe`). pwsh 7.7.0 (winget) unique.
- `C:\msys` n'est pas une installation : depot source (401 Mo), pas de runtime a desinstaller. Pas de Cygwin, busybox ni msys2 installes.
- Retires : Nushell 0.117 (winget), pwsh 7.6.9 (outil dotnet global), `~/.local/bin/{uutils,coreutils}.exe`, entree PATH utilisateur `nu\bin` (PATH utilisateur deduplique : aucun doublon avec le PATH machine, aucun dossier mort).
- Non retires (hors droits, installes en etendue utilisateur, `winget uninstall` refuse depuis un jeton eleve) : `uutils.coreutils` 0.12 / `uutils.diffutils` (shims `WinGet\Links`), GitHub.cli 2.102.0 (doublon de 2.103.3). Desinstaller depuis une session non elevee.
- `bash` seul depuis cmd/hyperfine resout `System32\bash.exe` (lanceur WSL, ordre PATH machine) : utiliser le chemin complet niubash. Le PATH machine n'est pas modifiable sans elevation, WSL hors perimetre.

## Terminal
`infra/windows-terminal/settings.json` : defaut = Niubash, profils Nushell, PowerShell (dotnet global) et Azure Cloud Shell supprimes, rendu GPU Atlas par defaut. `elevate: true` conserve (choix proprietaire).

## Git
- Global : `core.fsmonitor=true` (etait `false` au niveau utilisateur), untrackedCache, manyFiles, index.version 4, writeCommitGraph (fetch, gc), pack.threads=0, longpaths, credential helper gh-token.
- `git maintenance start` sur C:\src (strategie incremental, 3 taches planifiees) ; 62 depots enregistres dans `maintenance.repo`.
- Hooks : plus de husky ni de `core.hooksPath` ; les hooks `.git/hooks` (git-lfs) s'executent (`git hook run post-commit` rc 0) ; commit normal sans `-c core.hooksPath=/dev/null`.

## RAM, CPU, disque
- Plan d'alimentation : Performances optimales (deja actif). Compression memoire : desactivee, laissee ainsi (32 Go, 11-14 Go libres). Pagefile 31,8 Go systeme (inchange).
- Taches desactivees : ASUS Optimization, ASUS Update Checker 2.0, AsusSystemAnalysis, AsusSystemDiagnosis_DriverQuality, XblGameSaveTask. Autostarts gardes : Chrome, SecurityHealth, Realtek audio, Everything.
- Windows Search : C:\src n'est pas dans les regles d'indexation (seuls Users et Menu Demarrer) ; rien a exclure.
- Defender : exclusions deja presentes pour C:\src, .cargo, .rustup, .bun, LLVM, VS BuildTools, Windows Kits, sccache ; Defender reste actif.

## Avant / apres
| Mesure | Avant | Apres |
|---|---|---|
| `git status` (C:\src) | 132,7 ms | 115,4 ms (fsmonitor global) |
| niubash `-lc exit` | 43,8 ms | 43,8 ms |
| niubash `-lic exit` | 284 ms | 246-257 ms (init starship mis en cache complet) |
| pwsh `-NoProfile` / avec profil | 148 / 207 ms | inchange |
| RAM libre | 14,2 Go | 11,5 Go (charge agents variable) |
