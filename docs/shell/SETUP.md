# Shells : installation reproductible (2026-11-13)

Une seule source d'environnement pour tous les shells, des configs versionnées dans le dépôt, un lock vérifiable. Windows (le PC) et Linux (prd, fr1, fr2) utilisent les mêmes fichiers.

## Couche partagée (`packages/machine/shells/`)

| Fichier | Rôle |
|---|---|
| `env.toml` | source unique : SRC_ROOT, AY_SHELL_CACHE, XDG (Linux seulement), LANG, EDITOR/VISUAL/PAGER, CARGO_HOME/RUSTUP_HOME/BUN_INSTALL, Deno/JDK/Android/Ghidra (Windows), npm, télémétrie coupée, PATH (`front` = entrées remises en tête), `persist.windows` (HKCU) |
| `env.sh` `env.ps1` `env.nu` `env.fish` | générés par `shells.ts --gen`, ne pas éditer. Idempotents, aucun sous-processus |
| `manifest.toml` | `[[link]]` : config du dépôt -> emplacement attendu par le shell (`source` = stub d'une ligne, `copy` = copie) |
| `shells.lock.toml` | version, URL amont, sha256 de l'asset (gh api), b3sum du binaire installé, hôtes |
| `bash/` (agent A, [bash-setup.md](bash-setup.md)) · `pwsh/` (agent B, [pwsh-setup.md](pwsh-setup.md)) · `nu/` · `fish/` | configs par shell |
| `completions/ay.{yaml,fish,nu}` | générées depuis `ay --help` (clap et argh) : spec carapace (bash, pwsh, nu), complétions fish, `extern` nushell |

Commandes (racine du dépôt) :

```
bun packages/machine/src/shells.ts --gen        # régénère env.* et completions/ay.*
bun packages/machine/src/shells.ts              # génère + déploie les liens + caches nu (idempotent)
bun packages/machine/src/shells.ts --check      # écart : fichiers générés, liens, lock, HKCU, dossiers épinglés (code 1)
bun packages/machine/src/shells.ts --only nu,fish,carapace   # restreint les [[link]] déployés
bun packages/machine/src/apply-user.ts [--check]             # inclut shells.ts
```

Pièges mesurés, gérés par le générateur :
- PATH dans la famille bash sous Windows : niubash et brush acceptent `C:/x;…` (séparateur `;`), Git Bash (`BASH=/usr/bin/*`) exige `:` et `/c/x`. env.sh choisit la forme à l'exécution.
- niubash 1.5.0 : `${PATH//…}` coûte 40 à 100 ms par appel sur un PATH long. env.sh teste l'appartenance avec `case` et retire une entrée par `%%`/`#*`. Coût mesuré de `. env.sh` : +11 ms (22,0 -> 33,2 ms, hyperfine).
- pwsh : aucune cmdlet dans env.ps1. Une cmdlet charge son module, et 12 `Get-Command` coûtaient ~115 ms. PATH traité en une passe (List + HashSet insensible à la casse).
- Sous Windows, ne pas définir XDG_CONFIG_HOME : nushell et git iraient chercher leur config dans `~/.config`.
- `HKCU\Environment` : POWERSHELL_TELEMETRY_OPTOUT et POWERSHELL_UPDATECHECK doivent exister avant le lancement de pwsh (about_Environment_Variables 7.7). `--check` les contrôle sans les écrire ; nt-d6 les applique.

## nushell

- Binaire : MSI officiel 0.117.0 dans `%LOCALAPPDATA%\Programs\nu\bin\nu.exe`. `~\.cargo\bin\nu.exe` en est une copie (b3sum identique `00443a42…`), à supprimer.
- Stubs `%APPDATA%\nushell\{env,config}.nu` -> `nu/env.nu` (qui source `../env.nu`) et `nu/config.nu`. Les clés de config ont été vérifiées avec `config nu --doc` (0.117.0) ; `str downcase` est déprécié depuis 0.114.0, utiliser `str lowercase`.
- Démarrage sans processus externe. zoxide et carapace sont pré-générés dans `vendor/autoload` (`ay-zoxide.nu`, `ay-carapace.nu`), le mécanisme d'autoload amont, chargé après config.nu.
- Complétions : `ay` passe par des `extern` natifs (120 signatures, `completions/ay.nu`) ; git, cargo, bun et just passent par le complétion externe carapace 1.8.2, avec la spec `ay.yaml` dans `%APPDATA%\carapace\specs`.
- Les alias ne masquent jamais une commande interne : `ls`, `find`, `du` et `ps` restent structurés.

## fish

- Pas de build Windows natif amont. Le README 4.9.3 renvoie à WSL, Cygwin ou MSYS2, tous trois exclus ; les issues #4212 et #10155 sont fermées (« requires a POSIX-compatible environment »), et le fork `openhoangnc/fish4win` est inactif depuis 2021. fish n'est donc utilisé que sur la flotte Linux. prd l'a via pacman (4.9.3). Pour les autres hôtes : asset statique amont (`shells.lock.toml`) ou home-manager.
- Stub `~/.config/fish/config.fish` -> `fish/config.fish`, qui source `../env.fish`. `fish_add_path -gPm` vient de `fish_add_path --help` sur prd. La partie interactive est derrière `status is-interactive; or return 0`, avec l'init zoxide en cache dans `$AY_SHELL_CACHE/fish` et des abréviations plutôt que des alias.
- Complétions : celles de fish pour git, cargo et just (79, 56 et 68 entrées sur prd), et `completions/ay.fish` dans `~/.config/fish/completions`.

## Nix (Linux)

- Nix n'est installé sur aucun hôte au 2026-11-13. fr2 garde les comptes `nixbld*` d'une installation retirée, sans `/nix`. Les hôtes ne sont pas modifiés.
- `infra/fleet/nix/` contient un flake home-manager standalone (`root@prd`, `ubuntu@fr1`, `ubuntu@fr2`) qui lit `packages/machine/shells`. Les options ont été vérifiées dans `nix-community/home-manager` (modules/programs/{bash,fish,nushell,carapace,zoxide}.nix). Construit le 2026-11-13 dans le conteneur `nixos/nix` (Nix 2.35.6) sur prd, à partir d'un checkout git : `nix build .#homeConfigurations."root@prd".activationPackage` réussit, et le chemin relatif `../../../packages/machine/shells` est accepté, car un flake dans un sous-dossier git a le dépôt entier pour racine. Test de fumée avec les paquets du store : nu 0.116.1 et fish 4.9.3 chargent les configs du dépôt (SRC_ROOT=/root/src, EDITOR=nvim, 119 `extern` ay). `flake.lock` épingle nixpkgs d4f25a3e (2026-11-11) et home-manager 82ce401a (2026-11-10).
- Verdict : pour 3 hôtes avec des distributions natives (pacman, apt), `shells.ts` suffit sous bun, et home-manager ne s'impose pas. Le flake est prêt si un hôte passe à Nix. Écart à signaler : nixpkgs (nixos-unstable) est encore en nushell 0.116.1, alors que le lock épingle 0.117.0.

## État bas niveau cible (appliqué par nt-d6 le 2026-11-13, contrôlé par `apply-user.ts --check`)

| Où | Valeur |
|---|---|
| `~/.claude/settings.json` env | `CLAUDE_CODE_GIT_BASH_PATH=C:\Users\aphro\AppData\Local\Programs\Niubash\winuxcmd\bin\bash.exe`, `CLAUDE_CODE_USE_POWERSHELL_TOOL=0` (déjà en place) |
| `HKCU\Environment` (`env.toml` `[persist.windows]`, écrit par setx sans --check) | `SRC_ROOT=C:\src`, `AY_SHELL_CACHE=%USERPROFILE%\.cache\shell`, `CLAUDE_CODE_USE_POWERSHELL_TOOL=0`, `AGY_USE_POWERSHELL_TOOL=0`, `CLAUDE_CODE_GIT_BASH_PATH` = bash.exe de niubash (alignés sur settings.json), télémétrie pwsh/.NET, `CARGO_HOME`, `RUSTUP_HOME`, `BUN_INSTALL`, `PYTHONUTF8` |
| PATH utilisateur (`[persist_path]`) | en tête : Coreutils, `~\.local\bin`, `~\.cargo\bin`, `~\.bun\bin`, puis le reste, sans doublon. bun winget (Oven-sh.Bun) : winget refuse de le désinstaller ; il a été retiré de `machine.export.dsc.winget` et reste masqué par cet ordre. `~\.cargo\bin\nu.exe` est retiré (`[[duplicate]]` du lock) |
| Windows Terminal (`manifest.toml` `[terminal]`, lecture seule) | défaut Niubash élevé (`niu.exe`), Git Bash `hidden`, PowerShell `pwsh.exe -NoLogo`, brush main `%USERPROFILE%\.local\share\brush-main\brush.exe -l` (GUID …0010), Nushell = fragment `nu` (MSI) |

## Démarrage mesuré (hyperfine -N, 2026-11-13)

| Shell | Windows (PC) | Linux prd (chargé, moyenne / min) |
|---|---|---|
| nushell 0.117.0, sans config (`-n`) | 24,8 ms | 31,8 / 20,0 ms |
| nushell, config du dépôt + autoload | 38,7 ms (dont ~8 ms pour le registre de plugins bunos et ~0 ms pour env.nu + config.nu) | 45,9 / 23,9 ms |
| fish 4.9.3, `--no-config` | n/a | 12,8 / 6,7 ms |
| fish + config.fish (non interactif / `-i`) | n/a | 17,8 / 9,8 ms ; 30,1 / 18,7 ms |
| bash 5.3.20 `--norc` / + env.sh | voir bash-setup.md | 4,0 / 1,8 ms ; 7,1 / 3,7 ms |
| brush 0.4.0 + env.sh | voir bash-setup.md | 23,9 / 12,2 ms |
| niubash 1.5.0 `-c exit` / + env.sh | 22,0 ms / 33,2 ms | n/a |
| pwsh 7.7 | voir pwsh-setup.md | n/a |
